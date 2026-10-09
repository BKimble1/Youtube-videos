#!/usr/bin/env python3
"""Compose and render the Video 02 v2 music bed (original, generated here; FluidSynth + MuseScore General SoundFont, MIT).

Adapted from make_music_v02.py (the v1 score): same machinery (an original MIDI composition rendered per instrument
with FluidSynth, per-instrument EQ that keeps the parts out of the 1-4 kHz speech band, section levels calibrated with
pyloudnorm, drops and stops for reveals and jokes) and the v1 material where it still fits (the pizzicato "curious"
figure, the flash-and-echo glockenspiel tick, the bassoon tiptoe, the clockwork marimba, the museum line, the warehouse
groove, the D-major ending), re-planned for the v2 edit: scenes V1-V13, sections A-G of v2/SCRIPT_V2.md, the "Sound:"
lines of v2/SHOTPLAN_V2.md and the music paragraph of v2/REVISION_BRIEF.md.

  A  V1-V2   an instrumental CURIOUS PULSE from frame 1 (no logo sting); a 0.3 s near-drop just before "researchers",
             a modest lift on the real board, settles under n03-n05, a light lift on the question (n06)
  B  V3-V4   the pulse continues, lighter; complete stop for the duck on "visible", resumes on s11; thins under s14;
             a short drop from "tiny" into "This is real data", a modest lift on "zoom in to see", quiet under s16
  C  V5-V6   the quietest bed: clockwork-light, a small tick layer per arc; full stop for "one place" (J3b), resumes on
             s21; near-silence on the switch ("And here's a real one."), a modest lift as the U resolves (s37 + hold)
  D  V7      a brisker variation of the pulse (Bb major, walking bass, 16th pickups); thins under s31; warm on n16
  E  V8-V9   a quieter bed under the fusion explanation; a small lift on "keeps up instead of smearing"
  F  V10-V11 a modest lift as the real board returns (n24); quiet under the conditions; a light, cautious mechanical
             groove for the warehouse that brakes (dip) on "slow down"; quiet under the limits; a soft settle on
             "not a safety system"
  G  V12-V13 a soft callback of the opening pulse under n31; a held question under s47; a COMPLETE STOP for the J4 beat;
             a clean, warm D-major resolve from the end-screen start that fades to exactly zero at the last sample

Every boundary is a word or scene cue read from source/src/data/timeline.json at run time (wt()/st(); no hard-coded
times), so a re-run after narration retakes moves every section, drop, stop and lift with the words. Offsets such as
"0.3 s before" are designed lengths, not positions. Deterministic (fixed seed).

Outputs (audio/music/v02v2/): music_bed.wav (48 kHz stereo 24-bit, unducked, exactly durationSeconds long),
         stems/<instrument>.wav (post-dynamics; they sum to the bed), plan.json, measure.json, MUSIC_NOTES.md,
         music_overview.png and music_cues.png (QA: waveform + loudness over time, and every drop/stop/lift up close)
Usage  : python3 tools/make_music_v02v2.py [--no-plot]
The mix (tools/mix_v2.py --music audio/music/v02v2/music_bed.wav) normalises the bed and ducks it under speech.
"""
import argparse
import bisect
import hashlib
import json
import os
import random
import re
import subprocess
import tempfile
from concurrent.futures import ThreadPoolExecutor

import mido
import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy import signal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SF2 = os.environ.get('MUSIC_SOUNDFONT', '/usr/share/sounds/sf3/MuseScore_General.sf3')
TIMELINE = os.path.join(ROOT, 'source', 'src', 'data', 'timeline.json')
NARRATION = os.path.join(ROOT, 'source', 'public', 'audio', 'narration.wav')  # read only, for the QA plot
OUT = os.path.join(ROOT, 'audio', 'music', 'v02v2')
SR = 48000
BPM = 100
BEAT = 60.0 / BPM
BAR = 4 * BEAT
E8 = BEAT / 2
TPB = 480
SEED = 20261009
MAX_MELODIC = 83            # B5 (988 Hz): melodic fundamentals stay below the speech band
TICK, TICK_ECHO = 110, 108  # glockenspiel D8 (4.7 kHz) and C8 (4.2 kHz): the flash-and-echo motif sits above it
VOICE_PROGRAMS = {52, 53, 54, 85, 91}  # GM choir aahs, voice oohs, synth voice, lead 6 (voice), pad 4 (choir): never
REF_LUFS = -20.0            # a 0 LU segment sits here before the final peak safety scale
LIFT_LU = (1.5, 3.0)        # reveal lifts: this much over the bed they rise from (and the bed after, inside a section)

# chord name -> (bass root, upper voicing); voicings sit in MIDI 50-66 (v1 voicings)
CH = {
    'Dm7': (38, [50, 53, 57, 60]), 'G6': (43, [50, 55, 59, 64]), 'Bbmaj7': (46, [53, 57, 58, 62]),
    'A7sus': (45, [50, 52, 55, 57]), 'C6': (48, [52, 55, 57, 60]), 'Dm9': (38, [53, 57, 60, 64]),
    'F': (41, [53, 57, 60, 65]), 'Bb': (46, [53, 58, 62, 65]), 'C7sus': (48, [53, 55, 58, 60]),
    'F/A': (45, [53, 57, 60, 65]), 'Gm7': (43, [50, 53, 58, 62]), 'Gm9': (43, [53, 57, 58, 62]),
    'Em9': (40, [54, 55, 59, 62]), 'Cmaj7': (48, [52, 55, 59, 64]), 'G/B': (47, [50, 55, 59, 62]),
    'Dsus': (38, [50, 55, 57, 62]), 'Gadd9': (43, [50, 55, 57, 59]),
    'Ebmaj7': (39, [50, 55, 58, 62]), 'Bb/D': (38, [53, 58, 62, 65]), 'Eb': (39, [51, 55, 58, 63]),
    'Cm7': (36, [51, 55, 58, 60]), 'F7sus': (41, [51, 53, 58, 60]),
    'Am': (45, [52, 57, 60, 64]), 'Am/G': (43, [52, 57, 60, 64]), 'Fmaj7': (41, [53, 57, 60, 64]),
    'E7sus': (40, [52, 57, 59, 62]), 'E7': (40, [52, 56, 59, 62]), 'Dadd9': (38, [50, 54, 57, 64]),
    'Gmaj7/D': (38, [54, 55, 59, 62]),
}
# progressions for the segments whose harmony moves on the bar grid (others are set on their word cues in plan())
PROG = {
    'pulse': ['Dm7', 'G6', 'Bbmaj7', 'A7sus'],
    'board': ['Bbmaj7', 'C6', 'Dm9', 'A7sus'],
    'route': ['Dm9', 'Bbmaj7', 'Gm9', 'A7sus'],
    'question': ['Gm9', 'A7sus'],
    'puzzle': ['Dm7', 'G6', 'Bbmaj7', 'A7sus'],
    'thin': ['Dm9', 'Bbmaj7'],
    'data': ['Gm9', 'Dm9'],
    'bump': ['Bbmaj7', 'C6'],
    'clue': ['Dm9', 'A7sus'],
    'geometry': ['Em9', 'Cmaj7', 'G/B', 'Dsus'],
    'museum': ['Bb', 'F/A', 'Gm7', 'Ebmaj7', 'Bb/D', 'Eb', 'Cm7', 'F7sus'],
    'museum_thin': ['Ebmaj7', 'Cm7'],
    'idea': ['Ebmaj7', 'F', 'Gm7', 'A7sus'],
    'small': ['Dm9', 'Bbmaj7', 'Gm9', 'A7sus'],
    'fusion': ['Dm9', 'Gm9', 'Bbmaj7', 'A7sus'],
    'keeps': ['F', 'C6'],
    'board2': ['Bbmaj7', 'C6', 'Dm9', 'A7sus'],
    'conditions': ['Dm9', 'Gm9', 'Bbmaj7', 'A7sus'],
    'warehouse': ['Am', 'Am/G', 'Fmaj7', 'E7sus', 'Am', 'Am/G', 'Fmaj7', 'E7'],
    'limits': ['Fmaj7', 'E7sus', 'Am', 'E7sus'],
    'callback': ['Dm7', 'G6'],
}
# segment -> (section, music, relative level target in LU (None: inherits the level before it; its window acts), role)
SEGMENTS = {
    'pulse': ('A', 'curious pulse from frame 1: pizzicato 8ths over a staccato bass on every beat, soft shaker and kick, '
                   'a bassoon tiptoe, marimba answers; flash-and-echo tick on "sensor"', -2.0, 'bed'),
    'hush_a': ('A', 'near-drop, 0.3 s before "researchers"', None, 'drop'),
    'board': ('A', 'MODEST LIFT on the real board: strings and vibes enter, marimba doubles in 8ths, kick on 1 and 3, '
                   'a flash tick on the cut', 0.25, 'lift'),
    'route': ('A', 'settles under n03-n05: the pulse continues softer, bass on 1 and 3, vibes', -2.5, 'bed'),
    'question': ('A', 'light lift on the question (n06): strings, a vibes question figure, ends on A7sus', -1.25, 'light lift'),
    'puzzle': ('B', 'the pulse continues, lighter; STOP for the duck on "visible", resumes on s11; tick on "timing"', -4.0, 'bed'),
    'thin': ('B', 'thins under s14: pizzicato on beats 1 and 3, vibes, a soft string floor, long bass', -5.5, 'bed'),
    'hush_b': ('B', 'short drop from "tiny" into "This is real data"', None, 'drop'),
    'data': ('B', 'soft re-entry under s15: a string drone, one pizzicato per bar', -6.0, 'bed'),
    'bump': ('B', 'MODEST LIFT as the bump appears ("zoom in to see"): strings, vibes, rising marimba, flash-and-echo tick',
             -4.0, 'lift'),
    'clue': ('B', 'quiet under s16', -5.75, 'bed'),
    'geometry': ('C', 'QUIETEST: clockwork-light marimba tick-tock, a pizzicato root, long bass; + a soft hat tick layer at '
                      'the first arc, + marimba off-beat pings at the second; FULL STOP for "one place", resumes on s21',
                 -8.0, 'bed'),
    'hush_c': ('C', 'near-silence on the switch ("And here\'s a real one.")', None, 'drop'),
    'U': ('C', 'MODEST LIFT as the U resolves: Cmaj7 -> Dsus -> Gadd9 on "U", guitar arpeggios, strings, vibes, tick; held '
               'through the hold into the museum', -5.5, 'lift'),
    'museum': ('D', 'brisker variation of the pulse (Bb major): walking bass, pizzicato 8ths, marimba 16th pickups, shaker '
                    '16ths, stately strings; clarinet line answered by bassoon', -3.5, 'bed'),
    'museum_thin': ('D', 'thins under s31: pizzicato quarters, strings', -5.5, 'bed'),
    'idea': ('D', 'warm on n16: Ebmaj7-F-Gm7-A7sus, strings, guitar arpeggios, vibes', -4.0, 'light lift'),
    'small': ('E', 'quieter bed: sparse vibes with faint echoes over a very soft string floor', -7.0, 'bed'),
    'fusion': ('E', 'quieter bed under the fusion explanation: soft pizzicato quarters, vibes pad', -7.0, 'bed'),
    'keeps': ('E', 'small lift on "keeps up instead of smearing" (F major): the pulse, strings, vibes', -5.5, 'light lift'),
    'board2': ('F', 'MODEST LIFT as the real board returns (n24): the opening lift recalled, tick on the cut', -3.5, 'lift'),
    'conditions': ('F', 'quiet under the conditions (n25-n28)', -6.0, 'bed'),
    'warehouse': ('F', 'light, cautious mechanical groove (A minor): staccato pizzicato 8ths, hats, soft kick, marimba clicks',
                  -4.0, 'bed'),
    'brake': ('F', 'DIP on "slow down": the groove brakes to a held Fmaj7', None, 'dip'),
    'limits': ('F', 'quiet under the limits (s43)', -6.5, 'bed'),
    'settle': ('F', 'soft settle on "not a safety system": Gm9, then Dm9 on "not"', -7.0, 'settle'),
    'callback': ('G', 'soft callback of the opening pulse and the bassoon tiptoe under n31', -5.0, 'bed'),
    'hold': ('G', 'held A7sus question under s47', -5.5, 'bed'),
    'j4': ('G', 'COMPLETE STOP: the deadpan J4 beat', None, 'stop'),
    'resolve': ('G', 'clean, warm D-major resolve from the end-screen start (harp, strings, vibes: Dadd9 - Gmaj7/D - '
                     'Dadd9), fades to exactly zero at the last sample', -2.5, 'bed'),
}
# reveal lifts: (lift, bed it rises from, bed after it or None when the next section starts)
LIFTS = [('board', 'pulse', 'route'), ('bump', 'data', 'clue'), ('U', 'geometry', None), ('board2', 'keeps', 'conditions')]
LIGHT_LIFTS = [('question', 'route'), ('idea', 'museum_thin'), ('keeps', 'fusion')]
SECTIONS = {'A': ('V1', 'V2'), 'B': ('V3', 'V4'), 'C': ('V5', 'V6'), 'D': ('V7', 'V7'), 'E': ('V8', 'V9'),
            'F': ('V10', 'V11'), 'G': ('V12', 'V13')}
INSTR = {'pizz': (45, 0), 'marimba': (12, 1), 'vibes': (11, 2), 'glock': (9, 3), 'guitar': (24, 4), 'harp': (46, 5),
         'bass': (32, 6), 'bassoon': (70, 7), 'clarinet': (71, 8), 'strings': (49, 10), 'drums': (0, 9)}
GAINS_DB = {'pizz': 0, 'marimba': 0, 'vibes': -5, 'glock': -6, 'guitar': -3, 'harp': -4, 'bass': -5, 'bassoon': -7,
            'clarinet': -7, 'strings': -8, 'drums': -7}
FIG = [0, 2, 1, 2, 0, 3, 1, 2]   # the curious pulse: pizzicato 8ths over the chord (v1's "curious" ostinato)
# the pulse family: pizzicato level, bass rhythm (q = every beat, h = beats 1 and 3), shaker, kick (8th positions), marimba
PULSE = {
    'pulse': dict(piz=1.0, bass='q', bv=1.0, shaker=1.0, kick=(0,), mar='ans'),
    'board': dict(piz=1.05, bass='q', bv=1.05, shaker=1.15, kick=(0, 4), mar='eighths'),
    'route': dict(piz=0.85, bass='h', bv=0.9, shaker=0.7, kick=(), mar=None),
    'question': dict(piz=0.9, bass='q', bv=0.9, shaker=0.8, kick=(), mar=None),
    'puzzle': dict(piz=0.8, bass='h', bv=0.9, shaker=0.6, kick=(), mar='sparse'),
    'keeps': dict(piz=0.85, bass='q', bv=0.9, shaker=0.0, kick=(), mar=None),
    'board2': dict(piz=1.0, bass='q', bv=1.0, shaker=1.1, kick=(0, 4), mar='eighths'),
    'callback': dict(piz=0.75, bass='q', bv=0.85, shaker=0.6, kick=(), mar=None),
}
SNEAK = [(0.5, 50, 0.3, 54), (1.5, 53, 0.3, 50), (2.0, 52, 0.25, 46), (3.0, 45, 0.3, 54), (3.5, 46, 0.25, 48),
         (4.0, 45, 0.6, 52), (5.0, 50, 0.3, 50), (5.0, 53, 0.3, 44), (6.5, 44, 0.25, 46), (7.0, 45, 0.4, 52)]
MEL = [[(2, 65, 1), (3, 70, 1)], [(0, 69, 2), (2, 67, 1), (3, 65, 1)], [(0, 67, 3), (3, 62, 1)], [(0, 63, 3)],
       [(2, 65, 1), (3, 74, 1)], [(0, 72, 2), (2, 70, 1), (3, 67, 1)], [(0, 70, 2), (2, 67, 2)], [(0, 65, 3.5)]]


# ---------------------------------------------------------------------------------------------------------------- cues
def load():
    return json.load(open(TIMELINE, encoding='utf-8'))


def norm(w):
    return re.sub(r"[^a-z0-9']", '', w.lower().replace('’', "'"))


def _seg(tl, seg):
    s = next((x for x in tl['segments'] if x['id'] == seg), None)
    if s is None:
        raise KeyError(f'timeline has no segment {seg}')
    return s


def wt(tl, seg, word, occ=1, edge='from'):
    """Time (s) of the occ-th occurrence of word in segment seg (its start, or its end with edge='to')."""
    s = _seg(tl, seg)
    hits = [w for w in s['words'] if norm(w['w']) == norm(word)]
    if len(hits) < occ:
        raise KeyError(f'cue word "{word}" (#{occ}) not found in {seg}: "{s.get("text", "")}"')
    return hits[occ - 1][edge] / tl['fps']


def st(tl, seg, edge='from'):
    """Start (or end) of a narration segment: the earlier (later) of the segment edge and its first (last) word."""
    s = _seg(tl, seg)
    if edge == 'from':
        f = min([s['from']] + [w['from'] for w in s['words'][:1]])
    else:
        f = max([s['to']] + [w['to'] for w in s['words'][-1:]])
    return f / tl['fps']


def snap8(t):
    return float(np.ceil(t / E8 - 1e-6) * E8)


def plan(tl):
    fps = tl['fps']
    total = float(tl['durationSeconds'])
    sc = {s['id']: (s['from'] / fps, s['to'] / fps) for s in tl['scenes']}
    missing = [f'V{i}' for i in range(1, 14) if f'V{i}' not in sc]
    if missing:
        raise KeyError(f'timeline lacks scenes {missing}')

    def S(v):
        return sc[v][0]
    cue = {
        'sensor': wt(tl, 's02', 'sensor'),              # A: first flash-and-echo tick
        'researchers': wt(tl, 'n01', 'researchers'),    # A: hard cut to the real board
        'n03': st(tl, 'n03'),
        'question': st(tl, 'n06'),                      # A: "So how do you turn a tiny delay into a location?"
        'location': wt(tl, 'n06', 'location'),
        'visible': wt(tl, 'n08', 'visible'),            # B: J2 duck
        's11': st(tl, 's11'),
        'timing': wt(tl, 'n09', 'timing'),
        'tiny': wt(tl, 's14', 'tiny'),                  # B: the drop before the real data
        's15': st(tl, 's15'),                           # B: "This is real data"
        'zoom': wt(tl, 's15', 'zoom'),                  # B: the bump appears
        's16': st(tl, 's16'),
        'arc1': wt(tl, 's19', 'arc'),                   # C: tick layer per arc
        'arc2': wt(tl, 's20', 'arc'),
        'one_place': wt(tl, 's20', 'one'),              # C: J3b
        's21': st(tl, 's21'),
        'n13': st(tl, 'n13'),                           # C: "And here's a real one."
        's37': st(tl, 's37'),
        'U': wt(tl, 's37', 'U'),
        'idea': st(tl, 'n16'),                          # D: "Their new idea"
        's31': st(tl, 's31'),
        'keeps': wt(tl, 'n23', 'keeps'),                # E: "keeps up instead of smearing"
        'n24': st(tl, 'n24'),
        'n25': st(tl, 'n25'),
        'slow': wt(tl, 's42', 'slow'),                  # F: brake
        's43': st(tl, 's43'),
        'n30': st(tl, 'n30'),
        'not_safety': wt(tl, 'n30', 'not'),
        'n31': st(tl, 'n31'),
        's47': st(tl, 's47'),
        'too': wt(tl, 's47', 'too', edge='to'),         # G: J4 stop
        's48': st(tl, 's48'),
        'explained': wt(tl, 's48', 'explained', edge='to'),
        'corner': wt(tl, 's48', 'corner'),
        'corner_end': wt(tl, 's48', 'corner', edge='to'),
    }
    for v in sc:
        cue[v] = S(v)
    hb_a = min(max(cue['tiny'], cue['s15'] - 0.8), cue['s15'] - 0.3)   # drop from "tiny" (0.3-0.8 s long)
    hc_a = min(S('V6'), cue['n13']) - 0.05                             # near-silence from the switch
    dip_a = cue['slow'] - 0.2
    seg_bounds = [
        ('pulse', 0.0, cue['researchers'] - 0.3),
        ('hush_a', cue['researchers'] - 0.3, cue['researchers']),
        ('board', cue['researchers'], S('V2')),
        ('route', S('V2'), cue['question']),
        ('question', cue['question'], S('V3')),
        ('puzzle', S('V3'), S('V4')),
        ('thin', S('V4'), hb_a),
        ('hush_b', hb_a, cue['s15']),
        ('data', cue['s15'], cue['zoom']),
        ('bump', cue['zoom'], cue['s16']),
        ('clue', cue['s16'], S('V5')),
        ('geometry', S('V5'), hc_a),
        ('hush_c', hc_a, cue['s37']),
        ('U', cue['s37'], S('V7')),
        ('museum', S('V7'), cue['s31']),
        ('museum_thin', cue['s31'], cue['idea']),
        ('idea', cue['idea'], S('V8')),
        ('small', S('V8'), S('V9')),
        ('fusion', S('V9'), cue['keeps']),
        ('keeps', cue['keeps'], S('V10')),
        ('board2', S('V10'), cue['n25']),
        ('conditions', cue['n25'], S('V11')),
        ('warehouse', S('V11'), dip_a),
        ('brake', dip_a, cue['s43']),
        ('limits', cue['s43'], cue['n30']),
        ('settle', cue['n30'], S('V12')),
        ('callback', S('V12'), cue['s47']),
        ('hold', cue['s47'], cue['too']),
        ('j4', cue['too'], S('V13')),
        ('resolve', S('V13'), total),
    ]
    bad = [(nm, round(a, 2), round(z, 2)) for nm, a, z in seg_bounds if z - a < 0.25]
    bad += [(f'{p[0]}->{q[0]}', round(p[2], 2), round(q[1], 2)) for p, q in zip(seg_bounds, seg_bounds[1:]) if abs(p[2] - q[1]) > 1e-9]
    if bad:
        raise AssertionError(f'section plan out of order for this timeline (cue moved past its neighbour?): {bad}')
    W = [
        {'id': 'hush_a', 'kind': 'drop', 'a': cue['researchers'] - 0.3, 'b': cue['researchers'], 'depth_db': -20.0,
         'down_s': 0.06, 'up_s': 0.12, 'cue': 'n01 "researchers"',
         'label': 'A: 0.3 s near-drop just before "researchers" (n01); the board lift lands on the word'},
        {'id': 'j2', 'kind': 'stop', 'a': cue['visible'] - 0.15, 'b': cue['s11'] - 0.05, 'cue': 'n08 "visible"',
         'label': 'B: stop for the duck on "visible" (n08), resumes on s11'},
        {'id': 'hush_b', 'kind': 'drop', 'a': hb_a, 'b': cue['s15'], 'depth_db': -20.0, 'down_s': 0.15, 'up_s': 0.8,
         'cue': 's14 "tiny" -> s15', 'label': 'B: short drop from "tiny" into "This is real data" (s15), soft re-entry'},
        {'id': 'j3b', 'kind': 'stop', 'a': cue['one_place'] - 0.25, 'b': cue['s21'] - 0.1, 'cue': 's20 "one place"',
         'label': 'C: full stop for "one place" (s20, J3b), resumes on s21'},
        {'id': 'hush_c', 'kind': 'drop', 'a': hc_a, 'b': cue['s37'], 'depth_db': -22.0, 'down_s': 0.25, 'up_s': 0.4,
         'cue': 'V6 switch / n13', 'label': 'C: near-silence on the switch, "And here\'s a real one." (n13); lift on s37'},
        {'id': 'brake', 'kind': 'dip', 'a': dip_a, 'b': cue['s43'], 'depth_db': -8.0, 'down_s': 0.3, 'up_s': 0.3,
         'cue': 's42 "slow down"', 'label': 'F: the groove brakes on "slow down" (s42): held Fmaj7 at -8 dB until s43'},
        {'id': 'j4', 'kind': 'stop', 'a': cue['too'], 'b': S('V13') - 0.02, 'cue': 's47 "too." -> V13',
         'label': 'G: COMPLETE STOP for the deadpan J4 beat (end of s47 to the end-screen start)'},
    ]
    for w in W:
        if w['b'] - w['a'] < 0.2:
            raise AssertionError(f"window {w['id']} too short on this timeline: {w['a']:.2f}-{w['b']:.2f}")
    # harmony set on word cues (the rest moves on the bar grid)
    s37, u = cue['s37'], cue['U']
    pts = [(s37, 'Cmaj7')]
    if u - s37 >= 3.0:
        mid = round(((s37 + u) / 2) / BAR) * BAR
        if not (s37 + 1.0 < mid < u - 1.0):
            mid = snap8((s37 + u) / 2)
        pts.append((mid, 'Dsus'))
    pts.append((u, 'Gadd9'))
    overrides = {
        'U': pts,
        'brake': [(dip_a, 'Fmaj7')],
        'settle': [(cue['n30'], 'Gm9'), (cue['not_safety'], 'Dm9')],
        'hold': [(cue['s47'], 'A7sus')],
        'resolve': [(S('V13'), 'Dadd9'), (cue['explained'], 'Gmaj7/D'), (cue['corner'], 'Dadd9')],
    }
    H = harmony(seg_bounds, overrides)
    # the end: a fade over the last seconds after s48's last word, reaching exactly zero at the last sample
    fade_start = min(max(cue['corner_end'] + 0.2, total - 4.0), total - 1.5)
    return {'total': total, 'samples': int(round(total * SR)), 'frames': tl['durationInFrames'], 'fps': fps,
            'scenes': sc, 'cue': cue, 'segments': seg_bounds, 'windows': W, 'harmony': H, 'overrides': overrides,
            'fade_start': fade_start}


def harmony(segs, overrides):
    H = []
    for name, a, z in segs:
        if name in overrides:
            pts = [(t, c) for t, c in overrides[name] if a - 1e-6 <= t < z - 0.05]
            for j, (t0, c) in enumerate(pts):
                H.append({'seg': name, 'chord': c, 't0': t0, 't1': pts[j + 1][0] if j + 1 < len(pts) else z, 'ci': j})
            continue
        prog = PROG.get(name)
        if not prog:
            continue
        lines, L = [], float(np.ceil(a / BAR - 1e-9) * BAR)
        while L < z - 1e-6:
            lines.append(L)
            L += BAR
        if lines and lines[0] - a < BAR / 2 - 1e-6:   # a short first piece keeps the segment's first chord
            lines = lines[1:]
        if lines and z - lines[-1] < BAR / 4:          # no sliver of a chord at the end
            lines = lines[:-1]
        b = [a] + lines + [z]
        for ci, (t0, t1) in enumerate(zip(b, b[1:])):
            H.append({'seg': name, 'chord': prog[ci % len(prog)], 't0': t0, 't1': t1, 'ci': ci})
    H.sort(key=lambda h: h['t0'])
    return H


# ------------------------------------------------------------------------------------------------------------- compose
def compose(P):
    rnd = random.Random(SEED)
    ev = {k: [] for k in INSTR}
    total, cue, wins, H = P['total'], P['cue'], P['windows'], P['harmony']
    segs = P['segments']
    starts = [a for _, a, _ in segs]
    hst = [h['t0'] for h in H]

    def seg_at(t):
        return segs[max(0, bisect.bisect_right(starts, t + 1e-9) - 1)][0]

    def harm_at(t):
        i = bisect.bisect_right(hst, t + 1e-9) - 1
        return i if i >= 0 and t < H[i]['t1'] - 1e-9 else None

    def blocked(ts, one_off):
        for w in wins:
            pad = 0.15 if w['kind'] == 'stop' else 0.05
            if w['a'] - pad <= ts < w['b']:
                if w['kind'] == 'dip' and one_off:
                    continue
                return True
        return False

    def add(inst, ts, dur, note, vel, one_off=False):
        if ts < 0 or ts >= total - 0.05 or dur <= 0.02 or blocked(ts, one_off):
            return
        if inst not in ('glock', 'drums'):
            while note > MAX_MELODIC:
                note -= 12
        ev[inst].append((ts, dur, int(note), int(max(1, min(127, vel)))))

    def tick(ts, vel=44):  # the sensor's flash and its fainter, later echo (a metaphor, not photon audio)
        add('glock', ts, 0.3, TICK, vel, True)
        add('glock', ts + 0.45, 0.3, TICK_ECHO, int(vel * 0.55), True)

    def chord(t):
        i = harm_at(t)
        return (None, None, None) if i is None else (CH[H[i]['chord']][0], CH[H[i]['chord']][1], H[i])

    # ---- the 8th-note grid (one steady metre from frame 1 to the end; what plays depends on the segment at that time)
    for k in range(int(np.ceil(total / E8))):
        t = k * E8
        if t >= total - 0.05:
            break
        i, bar = k % 8, k // 8
        name = seg_at(t)
        hi = harm_at(t)
        if hi is None:
            continue
        h = H[hi]
        root, up = CH[h['chord']]
        ci = h['ci']
        left = h['t1'] - t
        nroot = CH[H[hi + 1]['chord']][0] if hi + 1 < len(H) else root
        r3 = root + 12 if root < 45 else root
        sty = PULSE.get(name)
        if sty:   # the curious pulse and its variants
            j = FIG[i]
            nn = up[0] - 1 if (ci % 4 == 3 and i == 7) else up[j]   # a sly chromatic step back to the top
            add('pizz', t, 0.25 * BEAT, nn, int((40 if i % 2 == 0 else 32) * sty['piz']) + rnd.randint(-2, 2))
            if sty['bass'] == 'q' and i % 2 == 0:
                add('bass', t, min(0.45 * BEAT, left - 0.02), root, int((40 if i == 0 else 34) * sty['bv']))
            elif sty['bass'] == 'h' and i in (0, 4):
                add('bass', t, min(1.7 * BEAT, left - 0.02), root, int(38 * sty['bv']))
            if sty['shaker']:
                add('drums', t, 0.05, 82, int((11 + (5 if i % 2 == 0 else 0)) * sty['shaker']))
            if i in sty['kick']:
                add('drums', t, 0.2, 36, 24 if i == 0 else 20)
            if sty['mar'] == 'ans' and i in (3, 7) and bar >= 1:
                add('marimba', t, 0.35 * BEAT, up[1 if i == 3 else 3] + 12, 28 + rnd.randint(-2, 2))
            elif sty['mar'] == 'eighths':
                add('marimba', t, 0.3 * BEAT, up[(j + 2) % 4] + 12, (28 if i % 2 == 0 else 23) + rnd.randint(-2, 2))
            elif sty['mar'] == 'sparse' and i == 7 and ci % 2 == 1:
                add('marimba', t, 0.35 * BEAT, up[3] + 12, 24)
        elif name == 'thin':
            if i in (0, 4):
                add('pizz', t, 0.35 * BEAT, up[0] if i == 0 else up[2], 32 + rnd.randint(-2, 2))
            if i == 0:
                add('bass', t, min(BAR * 0.97, left - 0.02), root, 32)
        elif name == 'data':
            if i == 0:
                add('pizz', t, 0.4 * BEAT, r3, 28)
                add('bass', t, min(BAR * 0.95, left - 0.02), root, 28)
        elif name == 'bump':
            if i % 2 == 0:
                add('marimba', t, 0.4 * BEAT, up[i // 2] + 12, 24 + i)   # rising quarter notes: the bump comes up
            if i in (0, 4):
                add('pizz', t, 0.35 * BEAT, r3 if i == 0 else up[1], 32)
            if i == 0:
                add('bass', t, min(BAR * 0.95, left - 0.02), root, 34)
        elif name == 'clue':
            if i == 0:
                add('pizz', t, 0.4 * BEAT, r3, 26)
                add('bass', t, min(BAR * 0.95, left - 0.02), root, 30)
            elif i == 4:
                add('pizz', t, 0.4 * BEAT, up[2], 22)
        elif name == 'geometry':   # clockwork-light; one small tick layer per arc, kept low
            if i % 2 == 0:
                add('marimba', t, 0.3 * BEAT, (up[0] if i % 4 == 0 else up[2]) + 12, (22 if i % 4 == 0 else 18) + rnd.randint(-1, 1))
            if i == 0:
                add('pizz', t, 0.4 * BEAT, r3, 30)
                add('bass', t, min(BAR * 0.95, left - 0.02), root, 28)
            if t >= cue['arc1'] - 1e-6 and i % 2 == 0:
                add('drums', t, 0.04, 42, 12 + (3 if i == 0 else 0))
            if t >= cue['arc2'] - 1e-6 and i in (3, 7):
                add('marimba', t, 0.2 * BEAT, up[3] + 24, 16)
        elif name == 'U':   # the clockwork brightens as the U resolves
            add('marimba', t, 0.3 * BEAT, up[FIG[i]] + 12, (24 if i % 2 == 0 else 20) + rnd.randint(-1, 1))
            if i % 2 == 0:
                add('pizz', t, 0.35 * BEAT, r3 if i % 4 == 0 else up[1], 28)
        elif name == 'museum':   # brisker variation of the pulse: the walk
            pm = [r3, up[1], up[2], up[1], r3 + 7, up[2], up[3], up[2]]
            add('pizz', t, 0.3 * BEAT, pm[i], (36 if i % 2 == 0 else 28) + rnd.randint(-2, 2))
            if i % 2 == 0:
                if i == 6:
                    n_ = nroot - 1 if nroot - 1 != root else nroot + 1   # chromatic approach to the next root
                else:
                    n_ = {0: root, 2: root + 7, 4: root + 12 if root + 12 <= 55 else root}[i]
                add('bass', t, 0.85 * BEAT, n_, 38 if i == 0 else 32)
            if i in (2, 6):
                add('marimba', t, 0.2 * BEAT, up[2] + 12, 24)
                add('marimba', t + E8 / 2, 0.2 * BEAT, up[3] + 12, 22)
            add('drums', t, 0.04, 82, 13 if i % 2 == 0 else 10)
            add('drums', t + E8 / 2, 0.04, 82, 8)
            if i == 0:
                add('drums', t, 0.2, 36, 22)
        elif name == 'museum_thin':
            if i % 2 == 0:
                add('pizz', t, 0.4 * BEAT, r3 if i in (0, 4) else up[1], 28)
            if i in (0, 4):
                add('bass', t, min(1.8 * BEAT, left - 0.02), root, 30)
        elif name == 'idea':
            if i % 2 == 0:
                add('pizz', t, 0.35 * BEAT, up[FIG[i]], 28)
            if i == 0:
                add('bass', t, min(BAR * 0.95, left - 0.02), root, 32)
        elif name == 'small':   # sparse vibes, each with a faint echo (v1's "echo")
            if i == 0:
                add('vibes', t, min(1.4 * BEAT, left - 0.02), up[1] + 12, 30)
                add('vibes', t, min(1.4 * BEAT, left - 0.02), up[3] + 12, 26)
                add('bass', t, min(BAR * 0.95, left - 0.02), root, 30)
            elif i == 3:
                add('vibes', t, min(1.2 * BEAT, left - 0.02), up[1] + 12, 15)
                add('vibes', t, min(1.2 * BEAT, left - 0.02), up[3] + 12, 13)
            elif i == 6 and ci % 2 == 1:
                add('pizz', t, 0.4 * BEAT, up[0], 26)
        elif name == 'fusion':
            if i % 2 == 0:
                add('pizz', t, 0.35 * BEAT, up[FIG[i]], 26 + rnd.randint(-2, 2))
            if i in (0, 4):
                add('bass', t, min(1.8 * BEAT, left - 0.02), root, 30)
            if i == 5 and ci % 2 == 0:
                add('marimba', t, 0.35 * BEAT, up[2] + 12, 16)
        elif name == 'conditions':
            if i in (0, 4):
                add('pizz', t, 0.4 * BEAT, up[0] if i == 0 else up[2], 26)
            if i == 0:
                add('bass', t, min(BAR * 0.95, left - 0.02), root, 28)
        elif name == 'warehouse':   # light, cautious, mechanical
            add('pizz', t, 0.15 * BEAT, r3 + (12 if i % 4 == 3 else 0), (38 if i % 2 == 0 else 30) + rnd.randint(-1, 1))
            if i in (0, 4):
                add('bass', t, min(1.8 * BEAT, left - 0.02), root, 38 if i == 0 else 34)
                add('drums', t, 0.2, 36, 26 if i == 0 else 22)
            if i % 2 == 1:
                add('marimba', t, 0.2 * BEAT, up[2 if i < 4 else 3] + 12, 24 + rnd.randint(-2, 2))
            if i == 3:
                add('marimba', t + E8 / 2, 0.2 * BEAT, up[3] + 12, 20)
            add('drums', t, 0.05, 42, 18 if i % 2 == 0 else 14)
        elif name == 'limits':
            if i == 0:
                add('pizz', t, 0.4 * BEAT, r3, 26)
                add('bass', t, min(BAR * 0.95, left - 0.02), root, 28)
        # 'U' chords, 'brake', 'settle', 'hold', 'resolve' are one-offs below; 'hush_*' and 'j4' are silent

    # ---- pads: sustained chords per harmony piece (legato into the next)
    for h in H:
        name, t0, t1 = h['seg'], h['t0'], h['t1']
        d = t1 - t0
        if d < 0.25:
            continue
        root, up = CH[h['chord']]
        if name in ('board', 'board2'):
            for jj, v in ((0, 30), (2, 28), (3, 27)):
                add('strings', t0, d + 0.05, up[jj], v)
            add('vibes', t0, d * 0.95, up[3] + 12, 24)
        elif name == 'route':
            add('vibes', t0, d + 0.05, up[1] + 12, 22)
            add('vibes', t0, d + 0.05, up[3] + 12, 20)
        elif name == 'question':
            add('strings', t0, d + 0.05, up[0], 28)
            add('strings', t0, d + 0.05, up[2], 26)
        elif name == 'thin':
            add('vibes', t0, d + 0.05, up[1] + 12, 24)
            add('vibes', t0, d + 0.05, up[3] + 12, 22)
            add('strings', t0, d + 0.05, up[0], 16)
        elif name == 'data':
            add('strings', t0, d + 0.05, up[0], 22)
            add('strings', t0, d + 0.05, up[2], 20)
        elif name == 'bump':
            for jj, v in ((0, 28), (2, 26), (3, 26)):
                add('strings', t0, d + 0.05, up[jj], v)
            add('vibes', t0, d * 0.95, up[3] + 12, 26)
        elif name == 'clue':
            add('strings', t0, d + 0.05, up[0], 24)
            add('strings', t0, d + 0.05, up[2], 22)
        elif name == 'museum':
            for jj, v in ((0, 26), (2, 24), (3, 24)):
                add('strings', t0, d + 0.05, up[jj], v)
            ci = h['ci']
            if 1 <= ci <= 8:   # the museum line on clarinet, then the bassoon answers it an octave lower
                inst, low, vel = ('clarinet', 0, 38) if ci <= 4 else ('bassoon', 12, 44)
                for beat, n_, dd in MEL[ci - 1]:
                    if beat * BEAT < d - 0.1:
                        add(inst, t0 + beat * BEAT, min(dd * BEAT * 0.95, d - beat * BEAT), n_ - low, vel)
        elif name == 'museum_thin':
            add('strings', t0, d + 0.05, up[0], 22)
            add('strings', t0, d + 0.05, up[2], 20)
        elif name == 'idea':
            for jj, v in ((0, 30), (2, 28), (3, 28)):
                add('strings', t0, d + 0.05, up[jj], v)
            for kk, n_ in enumerate([root, root + 7] + up[1:]):
                add('guitar', t0 + 0.11 * kk, max(0.3, d - 0.11 * kk), n_, 30)
            add('vibes', t0, d * 0.95, up[3] + 12, 22)
        elif name == 'fusion':
            add('vibes', t0, d + 0.05, up[1] + 12, 18)
            add('vibes', t0, d + 0.05, up[3] + 12, 16)
        elif name == 'small':   # a very soft string floor under the sparse vibes, so the bed never drops out
            add('strings', t0, d + 0.05, up[0], 16)
            add('strings', t0, d + 0.05, up[2], 14)
        elif name == 'keeps':
            add('strings', t0, d + 0.05, up[0], 28)
            add('strings', t0, d + 0.05, up[2], 26)
            add('vibes', t0, d * 0.95, up[3] + 12, 24)
        elif name == 'conditions':
            add('strings', t0, d + 0.05, up[0], 20)
            add('strings', t0, d + 0.05, up[2], 18)
        elif name == 'limits':
            add('strings', t0, d + 0.05, up[0], 22)
            add('strings', t0, d + 0.05, up[2], 20)

    # ---- a new segment's chord sounds on its cue: when the cue falls between bar lines, the bass takes the new root there
    # (the grid's own bass waits for the next beat or bar), so the music carries across every cut
    for h in H:
        if h['ci'] != 0 or h['seg'] not in PROG:
            continue
        ph = h['t0'] / BAR - np.floor(h['t0'] / BAR + 1e-6)
        if ph < 0.02 or ph > 0.98:
            continue
        r = CH[h['chord']][0]
        nb = min(h['t1'], float(np.ceil(h['t0'] / BAR + 1e-6) * BAR))
        add('bass', h['t0'], nb - h['t0'] - 0.02, r, 30)

    # ---- one-off events on word cues
    tick(cue['sensor'], 40)                                    # s02 "That sensor..."
    for b, lvl in ((cue['researchers'], 1.0), (cue['V10'], 0.95)):   # the real board (V1.3) and its return (V10.1)
        r, u, h = chord(b + 0.01)
        if r is not None:
            nb = min(h['t1'], float(np.ceil(b / BAR + 1e-6) * BAR))
            add('bass', b, max(0.2, min(nb - b - 0.02, 1.2 * BEAT)), r, int(42 * lvl), True)
            add('drums', b, 0.2, 36, int(28 * lvl), True)
        tick(b, int(50 * lvl))
    q0 = snap8(cue['question'])                                # n06: a vibes question figure (v1's), leaning up
    r, u, _ = chord(q0)
    if r is not None:
        for off, jj, d in ((0.0, 3, 0.4), (0.5, 1, 0.8), (1.5, 2, 1.2)):
            add('vibes', q0 + off * BEAT, d * BEAT, u[jj] + 12, 30, True)
    r, u, _ = chord(cue['location'])
    if r is not None:
        add('vibes', cue['location'], 0.6 * BEAT, u[1] + 12, 24, True)
        add('vibes', cue['location'] + 0.5 * BEAT, 1.4 * BEAT, u[3] + 12, 26, True)
    tick(cue['timing'], 36)                                    # n09 "What survives is timing."
    tick(cue['zoom'], 46)                                      # s15 "...zoom in to see": the bump appears
    for w in P['windows']:                                     # resume after a stop: the pulse comes back on the cue
        if w['kind'] != 'stop' or w['id'] == 'j4':
            continue
        r, u, h = chord(w['b'] + 0.01)
        if r is not None:
            add('bass', w['b'], max(0.2, min(BEAT, h['t1'] - w['b'] - 0.02)), r, 34, True)
            add('pizz', w['b'], 0.4 * BEAT, r + 12 if r < 45 else r, 34, True)
    for h in [x for x in P['harmony'] if x['seg'] == 'U']:     # s37: the U resolves (Cmaj7 -> Dsus -> Gadd9 on "U")
        r, u = CH[h['chord']]
        d = h['t1'] - h['t0'] + (0.15 if h['chord'] == 'Gadd9' else 0.05)
        for kk, n_ in enumerate([r, r + 7] + u[1:]):
            add('guitar', h['t0'] + 0.11 * kk, max(0.3, d - 0.11 * kk), n_, 34 if h['chord'] != 'Gadd9' else 36, True)
        for n_ in u:
            add('strings', h['t0'], d, n_, 28 if h['chord'] != 'Gadd9' else 30, True)
        add('vibes', h['t0'], d, u[3] + 12, 24, True)
        add('bass', h['t0'], d, r - 12 if r >= 46 else r, 36, True)
        if h['chord'] == 'Gadd9':
            add('vibes', h['t0'], d, 79, 20, True)
    tick(cue['U'], 44)
    dip = next(w for w in P['windows'] if w['id'] == 'brake')  # s42: the groove brakes to a held chord
    r, u = CH['Fmaj7']
    for n_ in u[:3]:
        add('strings', dip['a'], dip['b'] - dip['a'] + 0.3, n_, 28, True)
    add('vibes', dip['a'], dip['b'] - dip['a'], u[3] + 12, 22, True)
    add('bass', dip['a'], dip['b'] - dip['a'], r, 26, True)
    for h in [x for x in P['harmony'] if x['seg'] == 'settle']:   # n30: a soft plagal settle, Dm9 on "not"
        r, u = CH[h['chord']]
        d = h['t1'] - h['t0'] + (0.25 if h['chord'] == 'Dm9' else 0.05)
        for n_ in (u[0], u[2], u[3]):
            add('strings', h['t0'], d, n_, 24, True)
        add('bass', h['t0'], d, r, 28, True)
        if h['chord'] == 'Dm9':
            add('vibes', h['t0'] + 0.05, d, u[3] + 12, 20, True)
    for beat, n_, d, v in SNEAK:                               # the bassoon tiptoe under the opening pulse
        if beat * BEAT < cue['researchers'] - 0.35:
            add('bassoon', beat * BEAT, d * BEAT * 0.8, n_, v - 14, True)
    for beat, n_, d, v in SNEAK[:5]:                           # ...recalled, quieter, at the callback (V12)
        if cue['V12'] + beat * BEAT < cue['s47'] - 0.1:
            add('bassoon', cue['V12'] + beat * BEAT, d * BEAT * 0.8, n_, v - 24, True)
    r, u = CH['A7sus']                                         # s47: a held question; it stops dead on "too."
    for n_ in (u[0], u[1], u[3]):
        add('strings', cue['s47'] - 0.05, cue['too'] - cue['s47'] + 1.0, n_, 30, True)
    add('vibes', cue['s47'] - 0.05, cue['too'] - cue['s47'] + 1.0, 64, 24, True)
    add('vibes', cue['s47'] - 0.05, cue['too'] - cue['s47'] + 1.0, 69, 22, True)
    add('bass', cue['s47'] - 0.05, cue['too'] - cue['s47'] + 1.0, r, 34, True)
    e1, e2, e3 = cue['V13'], cue['explained'], cue['corner']   # V13 + s48: the warm D-major resolve
    to_end = total + 1.0
    r, u = CH['Dadd9']
    for kk, n_ in enumerate([r, r + 7] + u):
        add('harp', e1 + 0.09 * kk, e2 - e1 + 0.5, n_, 34, True)
    for n_ in u:
        add('strings', e1, e2 - e1 + 0.3, n_, 30, True)
    add('vibes', e1 + 0.05, min(3.0, e2 - e1), 66, 28, True)
    add('vibes', e1 + 0.05, min(3.0, e2 - e1), 69, 26, True)
    add('bass', e1, e2 - e1, r, 34, True)
    r, u = CH['Gmaj7/D']
    for kk, n_ in enumerate([r + 12] + u):
        add('harp', e2 + 0.1 * kk, e3 - e2 + 0.5, n_, 34, True)
    for n_ in u:
        add('strings', e2, e3 - e2 + 0.3, n_, 30, True)
    add('marimba', e2 + 0.2, 0.6, 67, 24, True)
    add('marimba', e2 + 0.5, 0.6, 71, 22, True)
    add('bass', e2, e3 - e2, r, 36, True)
    r, u = CH['Dadd9']
    for kk, n_ in enumerate([r, r + 7] + u[1:] + [69, 74]):
        add('harp', e3 + 0.1 * kk, to_end - e3, n_, 38 - kk, True)
    for n_ in u:
        add('strings', e3, to_end - e3, n_, 32, True)
    add('vibes', e3 + 0.1, to_end - e3, 69, 28, True)
    add('vibes', e3 + 0.1, to_end - e3, 74, 24, True)
    add('bass', e3, to_end - e3, r, 38, True)
    tick(min(cue['corner_end'] + 0.4, total - 1.0), 34)        # the last flash-and-echo, then it rings out

    # complete stops: notes that would sound into a stop are released just before it
    stops = [w for w in P['windows'] if w['kind'] == 'stop']
    for inst in ev:
        out = []
        for ts, dur, n_, v in ev[inst]:
            for w in stops:
                if ts < w['a'] < ts + dur:
                    dur = max(0.04, w['a'] - ts - 0.03)
            out.append((ts, dur, n_, v))
        ev[inst] = sorted(out)
    return ev


# ------------------------------------------------------------------------------------------------------------- render
def write_midi(evts, program, channel, path):
    # a repeated pitch never overlaps itself on one channel (a late note-off would cut the newer note short)
    # (and two cues asking for the same note at the same moment become one note)
    last_on = {}
    fixed = []
    for e in (list(x) for x in sorted(evts)):
        p = last_on.get(e[2])
        if p is not None and abs(p[0] - e[0]) < 0.005:
            p[1], p[3] = max(p[1], e[1]), max(p[3], e[3])
            continue
        if p is not None and p[0] + p[1] > e[0] - 0.005:
            p[1] = max(0.02, e[0] - p[0] - 0.01)
        last_on[e[2]] = e
        fixed.append(e)
    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(BPM)))
    if channel != 9:
        tr.append(mido.Message('program_change', program=program, channel=channel, time=0))
    tr.append(mido.Message('control_change', control=91, value=30, channel=channel, time=0))
    msgs = []
    for (ts, dur, note, vel) in fixed:
        on = int(round(max(0.0, ts) / BEAT * TPB))
        off = max(on + 1, int(round(max(0.0, ts + dur) / BEAT * TPB)))
        msgs.append((on, 1, mido.Message('note_on', note=int(note), velocity=int(max(1, min(127, vel))), channel=channel)))
        msgs.append((off, 0, mido.Message('note_off', note=int(note), velocity=0, channel=channel)))
    msgs.sort(key=lambda m: (m[0], m[1]))
    last = 0
    for tk, _, m in msgs:
        m.time = tk - last
        last = tk
        tr.append(m)
    mid.save(path)


def render(midi_path, wav_path):
    subprocess.run(['fluidsynth', '-ni', '-g', '0.5', '-r', str(SR), '-O', 'float', '-o', 'synth.reverb.active=1',
                    '-o', 'synth.chorus.active=0', '-F', wav_path, SF2, midi_path],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, 'highpass', fs=SR, output='sos'), x, axis=0)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, 'lowpass', fs=SR, output='sos'), x, axis=0)


def peaking(x, f0, gain_db, q=1.0):
    a = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f0 / SR
    alpha = np.sin(w0) / (2 * q)
    b = [1 + alpha * a, -2 * np.cos(w0), 1 - alpha * a]
    aa = [1 + alpha / a, -2 * np.cos(w0), 1 - alpha / a]
    return signal.lfilter(np.array(b) / aa[0], np.array(aa) / aa[0], x, axis=0)


def eq(name, x):
    """Per-instrument EQ (v1, with a steeper low-pass on the sustained strings): keep each part out of the 1-4 kHz speech band."""
    if name == 'strings':   # sustained pads: warm, nothing sustained in 1-4 kHz
        x = hp(x, 120)
        x = peaking(x, 2500, -6.0, 0.8)
        x = lp(x, 1100, 4)
    elif name in ('vibes', 'guitar', 'harp'):
        x = hp(x, 140 if name != 'harp' else 70)
        x = peaking(x, 2500, -5.0, 0.8)
        x = lp(x, 7000)
    elif name in ('clarinet', 'bassoon'):
        x = hp(x, 90)
        x = peaking(x, 2200, -6.0, 0.7)
        x = lp(x, 2600, 2)
    elif name in ('marimba', 'pizz'):
        x = hp(x, 180 if name == 'marimba' else 80)
        x = peaking(x, 2200, -4.0, 0.9)
        x = lp(x, 6000)
    elif name == 'bass':
        x = hp(x, 35)
        x = lp(x, 900)
    elif name == 'glock':
        x = hp(x, 3800, 4)
        x = lp(x, 12000)
    elif name == 'drums':
        x = hp(x, 45)
        x = peaking(x, 2500, -6.0, 0.7)
    return x


# ------------------------------------------------------------------------------------------------------------ dynamics
def seg_ramp(prev_db, cur_db, name):
    if SEGMENTS[name][3] in ('lift', 'light lift') or cur_db > prev_db:
        return 0.3
    return 0.8


def build_env(P, seg_db, n):
    """Gain curve: segment levels with short ramps at their cues, then drops/dips/stops, the fade-in and the fade-out."""
    g = np.empty(n)
    prev = None
    ramps = {}
    for idx, (name, a, z) in enumerate(P['segments']):
        cur = seg_db[idx] if seg_db[idx] is not None else prev
        ia, iz = int(round(a * SR)), min(n, int(round(z * SR)))
        r = 0 if prev is None else min(iz - ia, int(seg_ramp(prev, cur, name) * SR))
        ramps[idx] = r / SR
        if r > 0:
            g[ia:ia + r] = np.linspace(prev, cur, r)
        g[ia + r:iz] = cur
        prev = cur
    lin = 10 ** (g / 20)
    for w in P['windows']:
        a, b = int(round(w['a'] * SR)), int(round(w['b'] * SR))
        if w['kind'] in ('drop', 'dip'):
            depth = 10 ** (w['depth_db'] / 20)
            dn, upn = int(w['down_s'] * SR), int(w['up_s'] * SR)
            curve = np.ones(b + upn - a)
            k = min(dn, b - a)
            curve[:k] = np.linspace(1, depth, k)
            curve[k:b - a] = depth
            curve[b - a:] = np.linspace(depth, 1, upn)
            lin[a:b + upn] *= curve[:len(lin[a:b + upn])]
        else:   # complete stop: mute with short ramps (80 ms down before it, 40 ms up after it)
            r1, r2 = int(0.08 * SR), int(0.04 * SR)
            lin[a - r1:a] *= np.linspace(1, 0, r1)
            lin[a:b] = 0.0
            lin[b:b + r2] *= np.linspace(0, 1, r2)
    fi = int(0.02 * SR)   # pulse from frame 1: only a 20 ms de-click
    lin[:fi] *= np.linspace(0, 1, fi)
    fs = int(round(P['fade_start'] * SR))
    lin[fs:] *= np.linspace(1, 0, n - fs) ** 1.6   # the last sample is exactly zero
    return lin, ramps


def seg_range(P, idx, ramps):
    """Where a segment's level is measured: after its entry ramp, away from drops/stops, before the final fade."""
    name, a, z = P['segments'][idx]
    a2 = a + ramps.get(idx, 0.0)
    if name == 'resolve':
        z = min(z, P['fade_start'])
    return (a2, z) if z - a2 >= 0.6 else (a, z)


def seg_loudness(meter, x, a, z, wins, x_offset=0.0):
    """Integrated loudness of x over [a, z] s (x starts at x_offset s), leaving out drop/stop/dip windows and their
    re-entry ramps; -inf if too little remains."""
    ia, iz = int(round((a - x_offset) * SR)), min(len(x), int(round((z - x_offset) * SR)))
    if iz - ia < int(0.5 * SR):
        return float('-inf')
    t = np.arange(ia, iz) / SR + x_offset
    keep = np.ones(iz - ia, bool)
    for w in wins:
        keep &= ~((t >= w['a'] - 0.2) & (t < w['b'] + max(0.2, w.get('up_s', 0.0))))
    y = x[ia:iz][keep]
    if len(y) < int(0.5 * SR):
        return float('-inf')
    lv = meter.integrated_loudness(y)
    return float(lv) if np.isfinite(lv) and lv > -70 else float('-inf')


def calibrate(P, raw, meter):
    """Set each segment to its target level (iterated on the gained bed, so ramps and windows are accounted for)."""
    n = len(raw)
    wins = P['windows']
    whole = meter.integrated_loudness(raw)
    pre = REF_LUFS - whole
    seg_db = [pre + SEGMENTS[nm][2] if SEGMENTS[nm][2] is not None else None for nm, _, _ in P['segments']]
    hist = []
    for it in range(5):
        env, ramps = build_env(P, seg_db, n)
        worst = 0.0
        for idx, (nm, a, z) in enumerate(P['segments']):
            tgt = SEGMENTS[nm][2]
            if tgt is None:
                continue
            a2, z2 = seg_range(P, idx, ramps)
            ia, iz = int(round(a2 * SR)), min(n, int(round(z2 * SR)))
            lv = seg_loudness(meter, raw[ia:iz] * env[ia:iz, None], a2, z2, wins, x_offset=ia / SR)
            if not np.isfinite(lv):
                continue
            err = (REF_LUFS + tgt) - lv
            worst = max(worst, abs(err))
            seg_db[idx] = float(np.clip(seg_db[idx] + err, pre + tgt - 15, pre + tgt + 15))
        hist.append(round(worst, 3))
        if worst < 0.05:
            break
    env, ramps = build_env(P, seg_db, n)
    return env, seg_db, ramps, pre, hist


# --------------------------------------------------------------------------------------------------------- measurement
def rms_db(x):
    return float(20 * np.log10(np.sqrt(np.mean(np.square(x))) + 1e-12)) if len(x) else -240.0


def floor_db(x, a, b, win=0.1, hop=0.05):
    ia, ib, w, h = int(a * SR), int(b * SR), int(win * SR), int(hop * SR)
    lv = [(rms_db(x[i:i + w]), i / SR) for i in range(max(0, ia), max(ia + 1, min(len(x), ib) - w + 1), h)]
    db, at = min(lv)
    return round(db, 1), round(at, 2)


def band_share(x, lo=1000, hi=4000):
    m = x.mean(axis=1) if x.ndim == 2 else x
    if len(m) < 4096 or np.max(np.abs(m)) < 1e-7:
        return 0.0
    f, p = signal.welch(m, SR, nperseg=min(8192, len(m)))
    tot = p[(f >= 20) & (f <= 20000)].sum()
    return float(p[(f >= lo) & (f < hi)].sum() / tot) if tot > 0 else 0.0


class KLevels:
    """Ungated K-weighted loudness (BS.1770 weighting, LKFS) of any window of the bed, from a cumulative power sum."""

    def __init__(self, meter, x):
        y = x.astype(np.float64).copy()
        for f in meter._filters.values():
            for c in range(y.shape[1]):
                y[:, c] = f.apply_filter(y[:, c])
        self.c = np.concatenate([[0.0], np.cumsum(np.sum(y ** 2, axis=1))])
        self.n = len(x)

    def level(self, a, b):
        ia, ib = max(0, int(round(a * SR))), min(self.n, int(round(b * SR)))
        if ib - ia < int(0.05 * SR):
            return None
        p = (self.c[ib] - self.c[ia]) / (ib - ia)
        return round(float(-0.691 + 10 * np.log10(p)), 2) if p > 1e-14 else -120.0

    def curve(self, win, hop=0.05):
        w, h = int(win * SR), int(hop * SR)
        idx = np.arange(0, self.n - w, h)
        p = (self.c[idx + w] - self.c[idx]) / w
        return (idx + w / 2) / SR, -0.691 + 10 * np.log10(np.maximum(p, 1e-14))


def measure(P, bed, meter, ev, scale_db, seg_db, ramps, stem_info, tl):
    n = len(bed)
    total, sc, cue, wins = P['total'], P['scenes'], P['cue'], P['windows']
    m = {}
    vid_n = int(round(P['frames'] * SR / P['fps']))
    nar_n = sf.info(NARRATION).frames if os.path.exists(NARRATION) else None
    m['duration'] = {'samples': n, 'seconds': n / SR, 'timeline_durationSeconds': total,
                     'timeline_samples': int(round(total * SR)), 'matches_timeline': n == int(round(total * SR)),
                     'video_frames': P['frames'], 'video_samples_frames_x_1600': vid_n,
                     'video_minus_bed_ms': round((vid_n - n) / SR * 1000, 2),
                     'narration_samples': nar_n, 'matches_narration': nar_n == n if nar_n else None}
    up = signal.resample_poly(bed, 4, 1, axis=0)
    m['peaks'] = {'sample_peak_dbfs': round(20 * np.log10(np.max(np.abs(bed)) + 1e-12), 2),
                  'true_peak_dbtp_4x': round(20 * np.log10(np.max(np.abs(up)) + 1e-12), 2),
                  'samples_at_or_over_0dBFS': int(np.sum(np.abs(bed) >= 0.999))}
    del up
    whole = meter.integrated_loudness(bed)
    ref = REF_LUFS + scale_db
    m['integrated_lufs'] = round(whole, 2)
    m['reference_lufs'] = round(ref, 2)
    m['band_1_4k_share_whole'] = round(band_share(bed), 4)
    K = KLevels(meter, bed)

    def band_max_1s(a, z):
        shares = []
        for t in np.arange(a, z - 1.0, 1.0):
            x = bed[int(t * SR):int((t + 1) * SR)]
            if rms_db(x) > -55:
                shares.append(band_share(x))
        return (round(max(shares), 4), round(float(np.percentile(shares, 95)), 4)) if shares else (0.0, 0.0)

    m['sections'] = {}
    for sec, (v0, v1) in SECTIONS.items():
        a, z = sc[v0][0], min(total, sc[v1][1])
        x = bed[int(a * SR):int(z * SR)]
        lv = meter.integrated_loudness(x)
        bm, b95 = band_max_1s(a, z)
        m['sections'][sec] = {'scenes': f'{v0}-{v1}' if v0 != v1 else v0, 'from': round(a, 2), 'to': round(z, 2),
                              'lufs': round(lv, 2), 'lu_vs_reference': round(lv - ref, 2), 'rel_whole_lu': round(lv - whole, 2),
                              'lufs_after_mix_norm_-27': round(lv - whole - 27, 2), 'band_1_4k_share': round(band_share(x), 4),
                              'band_1_4k_share_max_1s': bm, 'band_1_4k_share_p95_1s': b95}
    m['scenes'] = {}
    for sid, (a, z) in sc.items():
        z = min(z, total)
        x = bed[int(a * SR):int(z * SR)]
        lv = meter.integrated_loudness(x)
        m['scenes'][sid] = {'from': round(a, 2), 'to': round(z, 2), 'lufs': round(lv, 2), 'rel_whole_lu': round(lv - whole, 2),
                            'band_1_4k_share': round(band_share(x), 4)}
    m['segments'] = []
    lvl = {}
    for idx, (name, a, z) in enumerate(P['segments']):
        a2, z2 = seg_range(P, idx, ramps)
        lv = seg_loudness(meter, bed, a2, z2, wins)
        lu = round(lv - ref, 2) if np.isfinite(lv) else None
        lvl[name] = lu
        m['segments'].append({'segment': name, 'section': SEGMENTS[name][0], 'role': SEGMENTS[name][3],
                              'from': round(a, 2), 'to': round(z, 2), 'measured_from': round(a2, 2), 'measured_to': round(z2, 2),
                              'target_lu': SEGMENTS[name][2], 'level_lu': lu,
                              'gain_db': None if seg_db[idx] is None else round(seg_db[idx] + scale_db, 2),
                              'entry_ramp_s': round(ramps.get(idx, 0.0), 2)})
    m['lifts'] = []
    for lift, before, after in LIFTS:
        d1 = round(lvl[lift] - lvl[before], 2)
        d2 = round(lvl[lift] - lvl[after], 2) if after else None
        ok = LIFT_LU[0] - 0.05 <= d1 <= LIFT_LU[1] + 0.05 and (d2 is None or LIFT_LU[0] - 0.05 <= d2 <= LIFT_LU[1] + 0.05)
        m['lifts'].append({'lift': lift, 'over': before, 'over_lu': d1, 'then': after, 'over_next_lu': d2,
                           'within_1.5_to_3_LU': ok})
    m['light_lifts'] = [{'lift': lf, 'over': b, 'over_lu': round(lvl[lf] - lvl[b], 2)} for lf, b in LIGHT_LIFTS]
    # every cue: the bed just before and just after (ungated K-weighted, up to 3 s, clear of the ramps)
    cues = []
    for idx, (name, a, z) in enumerate(P['segments']):
        # a segment entered from a window is reported with that window (before / inside / after)
        if idx == 0 or SEGMENTS[name][2] is None or any(abs(a - w['b']) < 0.1 or abs(a - w['a']) < 0.1 for w in wins):
            continue
        pa = P['segments'][idx - 1][1]
        r = ramps.get(idx, 0.0)
        b0, b1 = max(pa, a - 3.05), a - 0.05
        a0, a1 = a + r + 0.05, min(z, a + r + 3.05)
        lb, la = K.level(b0, b1), K.level(a0, a1)
        cues.append({'at': round(a, 2), 'cue': f'{P["segments"][idx - 1][0]} -> {name}', 'kind': SEGMENTS[name][3],
                     'before_lkfs': lb, 'after_lkfs': la,
                     'change_db': None if lb is None or la is None else round(la - lb, 1)})
    for w in wins:
        a, b = w['a'], w['b']
        segs_ = P['segments']
        pa = max([s_[1] for s_ in segs_ if s_[1] < a - 0.1] or [0.0])        # start of the segment the window cuts into
        nz = min([s_[2] for s_ in segs_ if s_[1] >= b - 0.1 and s_[2] > b + 0.1] or [P['total']])   # end of the one after
        before = K.level(max(pa, a - 3.0), a - 0.02)
        inside = K.level(a + min(w.get('down_s', 0.08), (b - a) / 3), b)
        u_ = b + max(w.get('up_s', 0.04), 0.3)
        after = K.level(u_, min(nz, u_ + 3.0))
        seg_in = bed[int(round(a * SR)):int(round(b * SR))]
        cues.append({'at': round(a, 2), 'to': round(b, 2), 'cue': w['cue'], 'kind': w['kind'], 'label': w['label'],
                     'seconds': round(b - a, 2), 'before_lkfs': before, 'inside_lkfs': inside, 'after_lkfs': after,
                     'drop_db': None if before is None or inside is None else round(inside - before, 1),
                     'return_db': None if inside is None or after is None else round(after - inside, 1),
                     'after_vs_before_db': None if before is None or after is None else round(after - before, 1),
                     'digital_silence': bool(np.max(np.abs(seg_in)) == 0.0) if len(seg_in) else None,
                     'peak_inside_dbfs': round(20 * np.log10(np.max(np.abs(seg_in)) + 1e-12), 1) if len(seg_in) else None})
    m['cues'] = sorted(cues, key=lambda c: c['at'])
    # scene cuts: the music carries across (quietest 100 ms within 0.5 s of the cut), except at designed windows
    m['cuts'] = {}
    ids = list(sc)
    for pa, sid in zip(ids, ids[1:]):
        c = sc[sid][0]
        db, at = floor_db(bed, c - 0.5, c + 0.5)
        local = rms_db(bed[int((c - 2.0) * SR):int((c + 2.0) * SR)])
        designed = next((w['id'] for w in wins if w['a'] - 0.5 < c < w['b'] + 0.5), None)
        m['cuts'][f'{pa}->{sid}'] = {'cut': round(c, 2), 'floor_dbfs': db, 'floor_at': at, 'local_rms_dbfs_4s': round(local, 1),
                                     'designed_window': designed,
                                     'carried': bool(designed is not None or (db > -50 and db > local - 20))}
    # the end
    tail = bed[-int(0.5 * SR):]
    m['end'] = {'last_sample': [float(bed[-1, 0]), float(bed[-1, 1])], 'last_sample_is_zero': bool(np.all(bed[-1] == 0.0)),
                'fade_start': round(P['fade_start'], 3), 'fade_seconds': round(total - P['fade_start'], 3),
                'rms_dbfs_last_0.5s': round(rms_db(tail), 1), 'rms_dbfs_last_0.1s': round(rms_db(bed[-int(0.1 * SR):]), 1),
                'rms_dbfs_1s_before_fade': round(rms_db(bed[int((P['fade_start'] - 1) * SR):int(P['fade_start'] * SR)]), 1)}
    nz = np.nonzero(np.max(np.abs(bed), axis=1) > 10 ** (-80 / 20))[0]
    m['end']['last_sample_above_-80dBFS_ms_before_end'] = round((n - 1 - nz[-1]) / SR * 1000, 1) if len(nz) else None
    m['stems'] = stem_info
    m['notes'] = {'events': {k: len(v) for k, v in ev.items() if v},
                  'max_melodic_note': max(e[2] for k, v in ev.items() if k not in ('glock', 'drums') for e in v),
                  'glock_notes': sorted({e[2] for e in ev['glock']}),
                  'drum_notes': sorted({e[2] for e in ev['drums']}),
                  'gm_programs': {k: INSTR[k][0] for k in ev if ev[k] and k != 'drums'},
                  'voice_or_choir_programs_used': sorted({INSTR[k][0] for k in ev if ev[k] and k != 'drums'} & VOICE_PROGRAMS)}
    m['_K'] = K
    return m


# ---------------------------------------------------------------------------------------------------------------- plots
def fmt_t(t):
    return f"{int(t // 60)}:{t % 60:05.2f}"


def plot(P, m, bed, outdir):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from matplotlib.ticker import FuncFormatter, MultipleLocator
    INK, INK2, MUTED, GRID = '#0b0b0b', '#52514e', '#8a8984', '#e4e3df'
    BLUE, BLUE_L, ORANGE = '#2a78d6', '#9cc2f0', '#eb6834'
    K = m['_K']
    total, sc, wins, ref = P['total'], P['scenes'], P['windows'], m['reference_lufs']
    tm, mom = K.curve(0.4, 0.02)
    ts, sht = K.curve(3.0, 0.05)
    blk = int(0.02 * SR)
    nb = len(bed) // blk
    env = np.max(np.abs(bed[:nb * blk]).reshape(nb, blk, 2), axis=(1, 2))
    te = (np.arange(nb) + 0.5) * blk / SR
    nar = None
    if os.path.exists(NARRATION):
        x, sr = sf.read(NARRATION, always_2d=True)
        if sr == SR:
            x = x.mean(axis=1)
            nbn = len(x) // blk
            ne = np.sqrt(np.mean(x[:nbn * blk].reshape(nbn, blk) ** 2, axis=1))
            nar = ((np.arange(nbn) + 0.5) * blk / SR, 20 * np.log10(ne + 1e-9) > -45)
    sec_of = {}
    for s_, (v0, v1) in SECTIONS.items():
        sec_of[v0] = s_
    mk = FuncFormatter(lambda v, _: f"{int(v // 60)}:{int(v % 60):02d}")
    rows = 3
    span = total / rows
    fig = plt.figure(figsize=(26, 20), dpi=100)
    gs = fig.add_gridspec(rows * 3, 1, height_ratios=[1, 1.7, 0.42] * rows, hspace=0.06, top=0.94, bottom=0.03,
                          left=0.05, right=0.99)
    fig.suptitle(f'Video 02 v2 music bed (unducked): waveform and loudness over time  ·  {fmt_t(total)}  ·  '
                 f'{m["integrated_lufs"]} LUFS integrated  ·  reference (0 LU) = {ref} LUFS  ·  cue words from the timeline',
                 x=0.05, y=0.985, ha='left', fontsize=15, color=INK)
    handles = []
    kind_style = {'drop': dict(color='#7d7b75', alpha=0.22), 'dip': dict(color='#7d7b75', alpha=0.14),
                  'stop': dict(color='#e34948', alpha=0.16)}
    for r in range(rows):
        t0, t1 = r * span - (0.5 if r else 0), min(total, (r + 1) * span + 0.5)
        aw = fig.add_subplot(gs[3 * r])
        al = fig.add_subplot(gs[3 * r + 1], sharex=aw)
        sel = (te >= t0) & (te <= t1)
        aw.fill_between(te[sel], -env[sel], env[sel], color=BLUE, lw=0)
        pk = max(0.05, float(env.max()) * 1.08)
        aw.set_ylim(-pk, pk)
        aw.set_ylabel('bed amplitude\n(peak / 20 ms)', color=INK2, fontsize=10)
        sel = (tm >= t0) & (tm <= t1)
        al.plot(tm[sel], mom[sel], color=BLUE_L, lw=0.8, label='momentary loudness (400 ms)')
        sel = (ts >= t0) & (ts <= t1)
        al.plot(ts[sel], sht[sel], color=BLUE, lw=2.0, label='short-term loudness (3 s)')
        for s in m['segments']:
            if s['target_lu'] is None or s['to'] < t0 or s['from'] > t1:
                continue
            y = ref + s['target_lu']
            al.plot([s['measured_from'], s['measured_to']], [y, y], color=ORANGE, lw=2.0, ls=(0, (4, 2)),
                    label='segment target (calibrated)' if s['segment'] == 'pulse' else None)
            xm = max(t0 + 0.5, (s['from'] + s['to']) / 2)
            if xm < t1 - 0.5 and s['to'] - s['from'] > 2.0:
                al.text(xm, y + 1.0, s['segment'], ha='center', va='bottom', fontsize=8.5, color=INK2)
        if nar is not None:
            tn, act = nar
            sel = (tn >= t0) & (tn <= t1)
            al.fill_between(tn[sel], -66, -63, where=act[sel], color=MUTED, lw=0, step='mid',
                            label='narration (speech > -45 dBFS)' if r == 0 else None)
        al.set_ylim(-67, -8)
        al.set_ylabel('LKFS (K-weighted)', color=INK2, fontsize=10)
        for w in wins:
            if w['b'] < t0 or w['a'] > t1:
                continue
            for ax in (aw, al):
                ax.axvspan(w['a'], w['b'], lw=0, **kind_style[w['kind']])
            aw.text((w['a'] + w['b']) / 2, -pk * 0.97, w['kind'].upper(), ha='center', va='bottom', fontsize=8.5,
                    color='#b8312f' if w['kind'] == 'stop' else INK2, fontweight='bold')
        for sid, (a, z) in sc.items():
            if t0 <= a <= t1:
                for ax in (aw, al):
                    ax.axvline(a, color=INK, lw=0.9, alpha=0.75)
                lab = sid + (f'  [{sec_of[sid]}]' if sid in sec_of else '')
                aw.text(a + 0.2, pk * 0.97, lab, ha='left', va='top', fontsize=10.5, color=INK, fontweight='bold')
        # cue words: every segment boundary and window, from the timeline
        marks = []
        for s in m['segments'][1:]:
            marks.append((s['from'], s['segment']))
        for w in wins:
            marks.append((w['a'], w['cue'].split(' -> ')[0]))
        marks = sorted({(round(t, 2), lbl) for t, lbl in marks if t0 <= t <= t1})
        lev = 0
        lastx = -99
        for t, lbl in marks:
            lev = (lev + 1) % 3 if t - lastx < 4.0 else 0
            lastx = t
            al.axvline(t, color=MUTED, lw=0.7, ls=':', ymin=0.08, ymax=0.86)
            al.text(t + 0.15, -55 + 5.0 * lev, lbl, rotation=90, ha='left', va='bottom', fontsize=7.5, color=INK2)
        for ax in (aw, al):
            ax.set_xlim(t0, t1)
            ax.grid(axis='y', color=GRID, lw=0.6)
            for sp in ('top', 'right'):
                ax.spines[sp].set_visible(False)
            ax.spines['left'].set_color(MUTED)
            ax.spines['bottom'].set_color(MUTED)
            ax.tick_params(colors=INK2, labelsize=9)
        plt.setp(aw.get_xticklabels(), visible=False)
        al.xaxis.set_major_formatter(mk)
        al.xaxis.set_major_locator(MultipleLocator(5))
        if r == 0:
            handles = al.get_legend_handles_labels()
    fig.legend(*handles, loc='upper left', bbox_to_anchor=(0.05, 0.968), ncol=4, fontsize=10.5, frameon=False)
    p1 = os.path.join(outdir, 'music_overview.png')
    fig.savefig(p1, facecolor='white')
    plt.close(fig)

    # every drop, stop and lift up close: momentary loudness +-4 s around the cue, with the measured change
    items = [c for c in m['cues'] if c['kind'] in ('drop', 'stop', 'dip', 'lift', 'light lift', 'settle')]
    cols = 4
    rr = int(np.ceil(len(items) / cols))
    fig, axs = plt.subplots(rr, cols, figsize=(22, 3.6 * rr), dpi=100, squeeze=False)
    tq, mq = K.curve(0.1, 0.005)
    for ax, c in zip(axs.flat, items):
        a = c['at']
        b = c.get('to', a)
        sel = (tq >= a - 4) & (tq <= b + 4)
        ax.plot(tq[sel], mq[sel], color=BLUE, lw=1.4)
        if 'to' in c:
            ax.axvspan(a, b, lw=0, **kind_style[c['kind']])
        ax.axvline(a, color=INK, lw=0.8)
        for sid, (sa, _) in sc.items():
            if a - 4 <= sa <= b + 4:
                ax.axvline(sa, color=INK, lw=1.4, ls='--')
                ax.text(sa, -12, sid, fontsize=8, ha='center', va='bottom', color=INK)
        if c.get('drop_db') is not None:
            txt = f"before {c['before_lkfs']} · in {c['inside_lkfs']} · after {c['after_lkfs']}\n" \
                  f"drop {c['drop_db']:+.1f} dB · return {c['return_db']:+.1f} dB · after vs before {c['after_vs_before_db']:+.1f} dB"
        else:
            txt = f"before {c['before_lkfs']} · after {c['after_lkfs']} · change {c['change_db']:+.1f} dB"
        ax.set_title(f"{fmt_t(a)}  {c['kind'].upper()}  {c['cue']}", fontsize=9.5, loc='left', color=INK)
        ax.text(0.01, 0.03, txt, transform=ax.transAxes, fontsize=8, color=INK2, va='bottom')
        ax.set_ylim(-75, -10)
        ax.set_xlim(a - 4, b + 4)
        ax.grid(axis='y', color=GRID, lw=0.6)
        ax.tick_params(colors=INK2, labelsize=8)
        ax.xaxis.set_major_formatter(FuncFormatter(lambda v, _: f"{int(v // 60)}:{v % 60:04.1f}"))
        for sp in ('top', 'right'):
            ax.spines[sp].set_visible(False)
    for ax in list(axs.flat)[len(items):]:
        ax.axis('off')
    fig.suptitle('Drops, stops and lifts up close: K-weighted loudness over 100 ms windows (LKFS), cue at the solid line, '
                 'scene cut dashed; the numbers are the 3 s before/after levels from measure.json',
                 x=0.02, ha='left', fontsize=13, color=INK)
    fig.tight_layout(rect=(0, 0, 1, 0.98))
    p2 = os.path.join(outdir, 'music_cues.png')
    fig.savefig(p2, facecolor='white')
    plt.close(fig)
    return p1, p2


# ---------------------------------------------------------------------------------------------------------------- notes
def write_notes(P, m, plan_out):
    f = fmt_t
    seg_m = {s['segment']: s for s in m['segments']}
    L = ['# Video 02 v2 music bed: notes', '',
         'Original score composed in code (`tools/make_music_v02v2.py`, adapted from the v1 `tools/make_music_v02.py`), '
         'rendered with FluidSynth and the MuseScore General SoundFont (MIT). Instrumental: no vocal or choir patches, no '
         'risers. 100 BPM throughout (bar = 2.4 s), one steady metre from frame 1. Every section boundary, drop, stop and '
         'lift is a word or scene cue read from `source/src/data/timeline.json` at run time, so a re-run after narration '
         'retakes moves them with the words.', '',
         f"Files: `music_bed.wav` (48 kHz stereo 24-bit, unducked, {m['duration']['samples']} samples = "
         f"{m['duration']['seconds']:.3f} s = timeline `durationSeconds`), `stems/*.wav` (post-dynamics; they sum to the bed), "
         '`plan.json` (cues, segments, windows, harmony), `measure.json`, `music_overview.png`, `music_cues.png`.', '',
         'Nobody has listened to this bed: this environment cannot play audio. Everything below is measured, not heard; '
         'the listening pass is still to do.', '',
         '## Sections', '',
         '| Section | Scenes | Time | Integrated | LU vs reference | 1-4 kHz share (whole / worst 1 s) |', '|---|---|---|---|---|---|']
    for k, v in m['sections'].items():
        L.append(f"| {k} | {v['scenes']} | {f(v['from'])}–{f(v['to'])} | {v['lufs']:.1f} LUFS | {v['lu_vs_reference']:+.1f} | "
                 f"{100 * v['band_1_4k_share']:.1f}% / {100 * v['band_1_4k_share_max_1s']:.1f}% |")
    L += ['', f"Reference (0 LU) = {m['reference_lufs']} LUFS in the delivered bed; whole bed {m['integrated_lufs']} LUFS. "
          'Section figures include their drops and stops; the segment levels below leave them out.', '',
          '## Segments (cue words from the timeline)', '',
          '| Segment | Section | Starts on | Time | Music | Target LU | Measured LU |', '|---|---|---|---|---|---|---|']
    for name, a, z in P['segments']:
        s = seg_m[name]
        tgt = SEGMENTS[name][2]
        L.append(f"| {name} | {SEGMENTS[name][0]} | {plan_out['segment_cues'][name]} | {f(a)}–{f(z)} | {SEGMENTS[name][1]} | "
                 f"{'—' if tgt is None else f'{tgt:+.2f}'} | {'—' if s['level_lu'] is None else f'{s['level_lu']:+.2f}'} |")
    L += ['', 'Measured LU: integrated loudness after the segment\'s entry ramp, outside drop/stop/dip windows and their '
          're-entry ramps, relative to the reference. Levels are set by calibration (pyloudnorm, iterated on the gained bed).', '',
          '## Lifts', '', '| Lift | Over the bed before | LU | Over the bed after | LU | 1.5-3 LU |', '|---|---|---|---|---|---|']
    for x in m['lifts']:
        L.append(f"| {x['lift']} | {x['over']} | {x['over_lu']:+.2f} | {x['then'] or '(next section)'} | "
                 f"{'—' if x['over_next_lu'] is None else f'{x['over_next_lu']:+.2f}'} | {'yes' if x['within_1.5_to_3_LU'] else 'NO'} |")
    for x in m['light_lifts']:
        L.append(f"| {x['lift']} (light) | {x['over']} | {x['over_lu']:+.2f} | | | |")
    L += ['', '## Drops, stops, dips and every cue', '',
          'Short-window levels: ungated K-weighted loudness (LKFS, EBU short-term length) over up to 3 s just before and just '
          'after each cue, clear of the ramps and inside the neighbouring segments; inside = the window itself after its '
          'down-ramp. Sparse beds make these noisier than the calibrated segment levels above.', '',
          '| Time | Cue | Kind | Before | Inside | After | Change (dB) |', '|---|---|---|---|---|---|---|']
    for c in m['cues']:
        if 'to' in c:
            ins = 'digital silence' if c['digital_silence'] else f"{c['inside_lkfs']}"
            ch = (f"in {c['drop_db']:+.1f}, back {c['return_db']:+.1f}" if c['drop_db'] is not None and not c['digital_silence']
                  else f"after vs before {c['after_vs_before_db']:+.1f}")
            L.append(f"| {f(c['at'])}–{f(c['to'])} ({c['seconds']:.2f} s) | {c['cue']} | {c['kind']} | {c['before_lkfs']} | "
                     f"{ins} | {c['after_lkfs']} | {ch} |")
        else:
            L.append(f"| {f(c['at'])} | {c['cue']} | {c['kind']} | {c['before_lkfs']} | | {c['after_lkfs']} | "
                     f"{'—' if c['change_db'] is None else f'{c['change_db']:+.1f}'} |")
    L += ['', 'drop = no new notes, the bed down 20-22 dB with a short down-ramp, then a re-entry ramp (0.12 s for the board '
          'lift on "researchers", 0.8 s into s15, 0.4 s into the U); stop = notes released, the bed muted with an 80 ms ramp '
          '(digital silence), resuming on the cue with the bass and pizzicato root; dip = the groove stops, one held chord '
          'at -8 dB.', '',
          '## Scene cuts', '', 'The pulse runs on one grid and every new segment\'s chord starts on its cue, so the music '
          'carries across cuts. Quietest 100 ms of the bed within 0.5 s of each cut:', '',
          '| Cut | Time | Floor | Local RMS (4 s) | Designed window | Carried |', '|---|---|---|---|---|---|']
    for k, v in m['cuts'].items():
        L.append(f"| {k} | {f(v['cut'])} | {v['floor_dbfs']} dBFS | {v['local_rms_dbfs_4s']} dBFS | {v['designed_window'] or ''} | "
                 f"{'yes' if v['carried'] else 'NO'} |")
    e = m['end']
    L += ['', '## The end', '',
          f"The resolve starts on the end-screen cut (V13, {f(P['cue']['V13'])}), under s48; it fades from {f(e['fade_start'])} "
          f"({e['fade_seconds']:.2f} s, after the last word) to exactly zero at the last sample: last sample "
          f"{e['last_sample']} ({'zero' if e['last_sample_is_zero'] else 'NOT ZERO'}); RMS of the last 0.5 s "
          f"{e['rms_dbfs_last_0.5s']} dBFS, of the last 0.1 s {e['rms_dbfs_last_0.1s']} dBFS; the last sample above -80 dBFS is "
          f"{e['last_sample_above_-80dBFS_ms_before_end']} ms before the end (no silent tail, no cut).", '',
          '## Motifs', '',
          '- **Curious pulse** (A, recalled in B, F and G): pizzicato 8ths on the chord (v1\'s figure, with a sly chromatic '
          'step every fourth chord) over a staccato bass on every beat, soft shaker, a soft kick on 1; a bassoon tiptoe in '
          'the first two bars, recalled under n31.',
          '- **Flash and echo**: a glockenspiel tick on D8 (4.7 kHz) and a fainter echo on C8 0.45 s later, only on cues: '
          's02 "sensor", n01 "researchers" (the real board), n09 "timing", s15 "zoom", s37 "U", the board\'s return (V10) '
          'and after the last word.',
          '- **Clockwork-light** (C): a marimba tick-tock and a pizzicato root; a hat tick from the first arc (s19), marimba '
          'off-beat pings from the second (s20); Cmaj7 -> Dsus -> Gadd9 as the U resolves.',
          '- **Museum** (D): the pulse as a walk in Bb major with 16th pickups; the v1 clarinet line answered by bassoon.',
          '- **Warehouse** (F): v1\'s cautious A-minor groove; it brakes to a held Fmaj7 on "slow down".',
          '- **Ending** (G): held A7sus under s47, digital silence for the J4 beat, then Dadd9 - Gmaj7/D - Dadd9 with harp.', '',
          '## Instruments (General MIDI, MuseScore General)', '',
          'pizzicato strings (45), marimba (12), vibraphone (11), glockenspiel (9, ticks only), nylon guitar (24), harp (46), '
          'acoustic bass (32), bassoon (70), clarinet (71), slow strings (49), percussion (channel 10: '
          + ', '.join(str(x) for x in m['notes']['drum_notes']) + ' = kick, closed hat, shaker). '
          f"Voice/choir programs used: {m['notes']['voice_or_choir_programs_used'] or 'none'}.", '',
          '## Speech band', '',
          f"Melodic notes at or below MIDI {m['notes']['max_melodic_note']} (B5 = 988 Hz is the ceiling); ticks on "
          f"{', '.join(str(x) for x in m['notes']['glock_notes'])} (above 4 kHz); per-instrument EQ cuts 2.2-2.5 kHz and "
          f"low-passes the leads (the sustained strings at 1.1 kHz, 4th order). Energy in 1-4 kHz: {100 * m['band_1_4k_share_whole']:.1f}% of the whole bed; per section "
          'above; per stem: ' + ', '.join(f"{k} {100 * v['band_1_4k_share']:.1f}%" for k, v in m['stems'].items()) + '.', '',
          '## Measured', '',
          f"Integrated {m['integrated_lufs']} LUFS (unducked); sample peak {m['peaks']['sample_peak_dbfs']} dBFS; true peak "
          f"{m['peaks']['true_peak_dbtp_4x']} dBTP (4x); {m['peaks']['samples_at_or_over_0dBFS']} clipped samples; "
          f"{m['duration']['samples']} samples = timeline durationSeconds {m['duration']['timeline_durationSeconds']} s "
          f"({'match' if m['duration']['matches_timeline'] else 'MISMATCH'}); narration {m['duration']['narration_samples']} "
          f"samples; the video's {m['duration']['video_frames']} frames are {m['duration']['video_minus_bed_ms']:+.2f} ms "
          'from the bed (the bed is already at zero there). Stems sum to the bed within '
          f"{m['stem_sum_max_abs_diff']:.2e} (24-bit rounding). SHA-256 of the bed: `{m['sha256_bed'][:16]}…`.", '',
          'Re-run (one command; reads every cue from the current timeline): `python3 tools/make_music_v02v2.py`. Mix: '
          '`python3 tools/mix_v2.py --music audio/music/v02v2/music_bed.wav`.', '']
    open(os.path.join(OUT, 'MUSIC_NOTES.md'), 'w', encoding='utf-8').write('\n'.join(L))


# ----------------------------------------------------------------------------------------------------------------- main
def jdump(obj, path):
    def conv(o):
        if isinstance(o, np.generic):
            return o.item()
        if isinstance(o, np.ndarray):
            return o.tolist()
        raise TypeError(f'not JSON serializable: {type(o)}')
    with open(path, 'w', encoding='utf-8') as fh:
        json.dump(obj, fh, indent=1, default=conv)


def segment_cue_names(P):
    """Human-readable cue for each segment start (for the notes)."""
    c = {
        'pulse': 'frame 1', 'hush_a': 'n01 "researchers" - 0.3 s', 'board': 'n01 "researchers"', 'route': 'V2 cut',
        'question': 'n06 start', 'puzzle': 'V3 cut', 'thin': 'V4 cut', 'hush_b': 's14 "tiny"', 'data': 's15 start',
        'bump': 's15 "zoom"', 'clue': 's16 start', 'geometry': 'V5 cut', 'hush_c': 'V6 cut (switch)', 'U': 's37 start',
        'museum': 'V7 cut', 'museum_thin': 's31 start', 'idea': 'n16 start', 'small': 'V8 cut', 'fusion': 'V9 cut',
        'keeps': 'n23 "keeps"', 'board2': 'V10 cut (n24)', 'conditions': 'n25 start', 'warehouse': 'V11 cut',
        'brake': 's42 "slow" - 0.2 s', 'limits': 's43 start', 'settle': 'n30 start', 'callback': 'V12 cut',
        'hold': 's47 start', 'j4': 's47 "too." end', 'resolve': 'V13 cut (end screen)'}
    return c


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--no-plot', action='store_true')
    args = ap.parse_args()
    tl = load()
    P = plan(tl)
    ev = compose(P)
    for k in ev:
        if ev[k] and k != 'drums' and INSTR[k][0] in VOICE_PROGRAMS:
            raise AssertionError(f'{k} uses a voice/choir program')
    os.makedirs(os.path.join(OUT, 'stems'), exist_ok=True)
    n = P['samples']   # exactly the timeline's durationSeconds
    meter = pyln.Meter(SR)
    raw = np.zeros((n, 2))
    stem_info = {}
    with tempfile.TemporaryDirectory() as td:
        names = [k for k in INSTR if ev[k]]

        def job(name):
            prog, ch = INSTR[name]
            mp, wp = os.path.join(td, f'{name}.mid'), os.path.join(td, f'{name}.wav')
            write_midi(ev[name], prog, ch, mp)
            render(mp, wp)
            return name
        with ThreadPoolExecutor(max_workers=4) as ex:
            list(ex.map(job, names))
        for name in names:   # in a fixed order, so the sum is deterministic
            x, sr = sf.read(os.path.join(td, f'{name}.wav'), always_2d=True)
            assert sr == SR
            x = x[:n] if len(x) >= n else np.vstack([x, np.zeros((n - len(x), 2))])
            x = eq(name, x) * 10 ** (GAINS_DB[name] / 20)
            np.save(os.path.join(td, f'{name}.npy'), x.astype(np.float32))
            raw += x
            print(f'  rendered {name}: {len(ev[name])} notes')
        env, seg_db, ramps, pre, hist = calibrate(P, raw, meter)
        print(f'  calibration: worst segment error per pass {hist} LU')
        bed = raw * env[:, None]
        del raw
        peak = np.max(np.abs(bed))
        scale = min(1.0, 0.89 / peak) if peak > 0 else 1.0
        bed *= scale
        sf.write(os.path.join(OUT, 'music_bed.wav'), bed.astype(np.float32), SR, subtype='PCM_24')
        for name in names:
            x = np.load(os.path.join(td, f'{name}.npy')).astype(np.float64) * (env * scale)[:, None]
            sf.write(os.path.join(OUT, 'stems', f'{name}.wav'), x.astype(np.float32), SR, subtype='PCM_24')
            stem_info[name] = {'gm_program': INSTR[name][0], 'notes': len(ev[name]), 'rms_dbfs': round(rms_db(x), 1),
                               'band_1_4k_share': round(band_share(x), 4)}
    for fn in os.listdir(os.path.join(OUT, 'stems')):   # stale stems from an earlier run would not sum to the bed
        if fn.endswith('.wav') and fn[:-4] not in names:
            os.remove(os.path.join(OUT, 'stems', fn))
    # read back what was written: the bed as delivered, and the stems' sum
    bed, _ = sf.read(os.path.join(OUT, 'music_bed.wav'), always_2d=True)
    acc = np.zeros_like(bed)
    for name in names:
        acc += sf.read(os.path.join(OUT, 'stems', f'{name}.wav'), always_2d=True)[0]
    stem_diff = float(np.max(np.abs(acc - bed)))
    del acc
    m = measure(P, bed, meter, ev, 20 * np.log10(scale), seg_db, ramps, stem_info, tl)
    m['stem_sum_max_abs_diff'] = stem_diff
    m['sha256_bed'] = hashlib.sha256(open(os.path.join(OUT, 'music_bed.wav'), 'rb').read()).hexdigest()
    m['calibration_passes_worst_error_lu'] = hist
    plan_out = {
        'timeline': os.path.relpath(TIMELINE, ROOT), 'timeline_durationSeconds': P['total'], 'samples': n,
        'fps': P['fps'], 'frames': P['frames'], 'bpm': BPM, 'bar_seconds': BAR, 'seed': SEED, 'reference_lufs': REF_LUFS,
        'scenes': {k: [round(a, 3), round(z, 3)] for k, (a, z) in P['scenes'].items()},
        'cues_seconds': {k: round(v, 3) for k, v in P['cue'].items()},
        'segment_cues': segment_cue_names(P),
        'segments': [{'segment': nm, 'section': SEGMENTS[nm][0], 'from': round(a, 3), 'to': round(z, 3), 'role': SEGMENTS[nm][3],
                      'music': SEGMENTS[nm][1], 'target_lu': SEGMENTS[nm][2], 'entry_ramp_s': round(ramps.get(i, 0.0), 2),
                      'gain_db_applied': None if seg_db[i] is None else round(seg_db[i] + 20 * np.log10(scale), 2)}
                     for i, (nm, a, z) in enumerate(P['segments'])],
        'windows': [{k: (round(v, 3) if isinstance(v, float) else v) for k, v in w.items()} for w in P['windows']],
        'harmony': [{'segment': h['seg'], 'chord': h['chord'], 'from': round(h['t0'], 3), 'to': round(h['t1'], 3)} for h in P['harmony']],
        'lifts': {'reveal': LIFTS, 'light': LIGHT_LIFTS, 'reveal_range_lu': LIFT_LU},
        'fade_start': round(P['fade_start'], 3), 'progressions': PROG, 'pulse_styles': PULSE,
        'instruments': {k: {'gm_program': v[0], 'gain_db': GAINS_DB[k], 'notes': len(ev[k])} for k, v in INSTR.items()},
        'final_scale_db': round(20 * np.log10(scale), 2), 'soundfont': os.path.realpath(SF2),
    }
    jdump(plan_out, os.path.join(OUT, 'plan.json'))
    if not args.no_plot:
        m['plots'] = [os.path.relpath(p, ROOT) for p in plot(P, m, bed, OUT)]
    m.pop('_K')
    jdump(m, os.path.join(OUT, 'measure.json'))
    write_notes(P, m, plan_out)

    d = m['duration']
    print(f"music bed {d['samples']} samples = {d['seconds']:.3f} s (timeline durationSeconds {d['timeline_durationSeconds']}, "
          f"match={d['matches_timeline']}; narration match={d['matches_narration']}), {m['integrated_lufs']} LUFS, "
          f"peak {m['peaks']['sample_peak_dbfs']} dBFS / {m['peaks']['true_peak_dbtp_4x']} dBTP, 1-4 kHz {100 * m['band_1_4k_share_whole']:.1f}%")
    for k, v in m['sections'].items():
        print(f"  {k} {v['scenes']:8s} {v['from']:7.2f}-{v['to']:7.2f}  {v['lufs']:6.1f} LUFS ({v['lu_vs_reference']:+.1f} LU vs ref)"
              f"  1-4k {100 * v['band_1_4k_share']:.1f}% (worst 1 s {100 * v['band_1_4k_share_max_1s']:.1f}%)")
    for s in m['segments']:
        print(f"  {s['segment']:12s} {s['from']:7.2f}-{s['to']:7.2f} target {s['target_lu']} measured {s['level_lu']}")
    for x in m['lifts']:
        print(f"  lift {x['lift']:7s} +{x['over_lu']} over {x['over']}, {x['over_next_lu']} over {x['then']}  ok={x['within_1.5_to_3_LU']}")
    for c in m['cues']:
        print(f"  cue {c['at']:7.2f} {c['kind']:10s} {c['cue']:28s} before {c['before_lkfs']} "
              + (f"inside {c['inside_lkfs']} after {c['after_lkfs']} silence={c['digital_silence']}" if 'to' in c
                 else f"after {c['after_lkfs']} change {c['change_db']}"))
    print('  cuts: ' + ', '.join(f"{k} {v['floor_dbfs']}{'' if v['carried'] else ' (GAP)'}" for k, v in m['cuts'].items()))
    print(f"  end: last sample {m['end']['last_sample']} zero={m['end']['last_sample_is_zero']}, last 0.1 s "
          f"{m['end']['rms_dbfs_last_0.1s']} dBFS; stems sum diff {stem_diff:.2e}; sha256 {m['sha256_bed'][:16]}")
    problems = []
    if not d['matches_timeline']:
        problems.append('bed length != timeline durationSeconds')
    if not m['end']['last_sample_is_zero']:
        problems.append('last sample not zero')
    if m['notes']['max_melodic_note'] > MAX_MELODIC or m['notes']['voice_or_choir_programs_used']:
        problems.append('note range / program check')
    problems += [f"lift {x['lift']} outside 1.5-3 LU" for x in m['lifts'] if not x['within_1.5_to_3_LU']]
    problems += [f'cut {k} not carried' for k, v in m['cuts'].items() if not v['carried']]
    problems += [f"stop {c['cue']} not silent" for c in m['cues'] if c['kind'] == 'stop' and not c['digital_silence']]
    if problems:
        raise AssertionError('checks failed (files written so measure.json shows them): ' + '; '.join(problems))


if __name__ == '__main__':
    main()
