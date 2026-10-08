#!/usr/bin/env python3
"""Compose and render the Video 02 music bed (original, generated here; FluidSynth + MuseScore General SoundFont, MIT).

Adapted from make_music_v2.py (Video 01): same approach (an original MIDI composition rendered per instrument with
FluidSynth, section-aware dynamics, drops for reveals and jokes, everything kept out of the 1-4 kHz speech band),
new material, new keys, a new tempo, and cues from the Video 02 timeline (wt()/st() on its word timings).

  cold     S1  curious, sly: a pizzicato/bassoon tiptoe figure under s01, soft marimba; the sensor's "flash and echo"
               motif (a high glockenspiel tick above 4 kHz and a fainter, later echo tick); near-silence for the reveal
               (s03 "And yet... this is real data"), soft re-entry on s04, settles under s08
  mirror   S2  brighter, playful; stops for "visible" (J2), resumes; lighter under the confetti line (s12)
  echo     S3  pulled back, sparse vibes with their own faint echoes; almost nothing under the real-data board (s15-s16)
  clock    S4  clockwork marimba that gains one layer per arc (s17 map, s18 arc 1, s20 arc 2, s21 bands, s23 many
               spots); full stop for "one place" (J3, the sound effect carries it), resumes; resolves on s24
  museum   S5  warm, a little stately: walking pizzicato, slow strings, a clarinet line answered by bassoon
  nimble   S6  optimistic, nimble, light percussion; lifts a step (D -> E) on s35
  evidence S7  pulled back under the results, sparse
  groove   S8  light mechanical groove, cautious; it brakes (dip) on "slow down" (s42)
  payoff   S9  a quiet callback, a gentle build under the takeaway (s46), a held question under s47, a complete stop
               for the silent gag, then a warm D-major resolution under s48 and the end card, fading to zero exactly at
               the end of the timeline
Section levels are calibrated: each section is measured (ITU-R BS.1770 via pyloudnorm) and set to its target relative
level, so the dynamics are the plan's, not an accident of which instruments play.

Outputs: audio/music/v02/stems/<instrument>.wav (post-dynamics: the stems sum to the bed), audio/music/v02/music_bed.wav
         (48 kHz stereo, 24-bit, unducked, exactly the timeline's duration), plan.json, measure.json, MUSIC_NOTES.md
Usage  : python3 tools/make_music_v02.py
"""
import json
import os
import random
import re
import subprocess
import tempfile

import mido
import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy import signal
from scipy.ndimage import uniform_filter1d

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SF2 = os.environ.get('MUSIC_SOUNDFONT', '/usr/share/sounds/sf3/MuseScore_General.sf3')
OUT = os.path.join(ROOT, 'audio', 'music', 'v02')
SR = 48000
BPM = 100
BEAT = 60.0 / BPM
BAR = 4 * BEAT
TPB = 480
SEED = 20261102
MAX_MELODIC = 83          # B5 (988 Hz): melodic fundamentals stay below the speech band
TICK, TICK_ECHO = 110, 108  # glockenspiel D8 (4.7 kHz) and C8 (4.2 kHz): the flash motif sits above it

# chord name -> (bass root, upper voicing); voicings sit in MIDI 50-66
CH = {
    'Dm7': (38, [50, 53, 57, 60]), 'G6': (43, [50, 55, 59, 64]), 'Bbmaj7': (46, [53, 57, 58, 62]),
    'A7sus': (45, [50, 52, 55, 57]), 'C6': (48, [52, 55, 57, 60]), 'Dm9': (38, [53, 57, 60, 64]),
    'F': (41, [53, 57, 60, 65]), 'Bb': (46, [53, 58, 62, 65]), 'C7sus': (48, [53, 55, 58, 60]),
    'F/A': (45, [53, 57, 60, 65]), 'Gm7': (43, [50, 53, 58, 62]), 'Gm9': (43, [53, 57, 58, 62]),
    'Em9': (40, [54, 55, 59, 62]), 'Cmaj7': (48, [52, 55, 59, 64]), 'G/B': (47, [50, 55, 59, 62]),
    'Dsus': (38, [50, 55, 57, 62]), 'Gadd9': (43, [50, 55, 57, 59]),
    'Ebmaj7': (39, [50, 55, 58, 62]), 'Bb/D': (38, [53, 58, 62, 65]), 'Eb': (39, [51, 55, 58, 63]),
    'Cm7': (36, [51, 55, 58, 60]), 'F7sus': (41, [51, 53, 58, 60]),
    'D': (38, [50, 54, 57, 62]), 'Bm7': (47, [50, 54, 57, 59]), 'Asus': (45, [50, 52, 57, 62]), 'A': (45, [49, 52, 57, 61]),
    'E': (40, [52, 56, 59, 64]), 'C#m7': (37, [52, 56, 59, 61]), 'Aadd9': (45, [52, 57, 59, 61]), 'Bsus': (47, [52, 54, 59, 64]),
    'Am': (45, [52, 57, 60, 64]), 'Am/G': (43, [52, 57, 60, 64]), 'Fmaj7': (41, [53, 57, 60, 64]), 'E7sus': (40, [52, 57, 59, 62]),
    'E7': (40, [52, 56, 59, 62]), 'Dadd9': (38, [50, 54, 57, 64]), 'Gmaj7/D': (38, [54, 55, 59, 62]),
}
PROG = {
    'sensor': ['Dm7', 'G6'],
    'curious': ['Dm7', 'G6', 'Bbmaj7', 'A7sus'],
    'settle': ['Bbmaj7', 'C6', 'Dm9', 'Dm9'],
    'playful': ['F', 'Dm7', 'Bb', 'C7sus'],
    'light': ['Bb', 'F/A', 'Gm7', 'C7sus'],
    'echo': ['Dm9', 'Bbmaj7', 'Gm9', 'A7sus'],
    'clock': ['Em9', 'Cmaj7', 'G/B', 'Dsus'],
    'museum': ['Bb', 'F/A', 'Gm7', 'Ebmaj7', 'Bb/D', 'Eb', 'Cm7', 'F7sus'],
    'nimble': ['D', 'Bm7', 'Gadd9', 'Asus', 'D', 'Bm7', 'Gadd9', 'A'],
    'lift': ['E', 'C#m7', 'Aadd9', 'Bsus'],
    'evidence': ['Em9', 'Cmaj7', 'Gadd9', 'Dsus'],
    'groove': ['Am', 'Am/G', 'Fmaj7', 'E7sus', 'Am', 'Am/G', 'Fmaj7', 'E7'],
    'groove_out': ['Fmaj7', 'E7sus', 'Am', 'E7sus'],
    'build': ['Bbmaj7', 'C6', 'Gm9'],
}
# segment -> (scene, mood, relative level target in LU; None = window handles it)
SEGMENTS = {
    'sneak': ('S1', 'tiptoe figure: pizzicato + bassoon, marimba answers', -3.0),
    'sensor': ('S1', 'light offbeat pizzicato; first flash tick on "sensor"', -5.0),
    'reveal': ('S1', 'DROP: near-silence for the real data', None),
    'curious': ('S1', 'curious ostinato, flash-and-echo ticks, vibes question', -2.5),
    'settle': ('S1', 'settles: strings, slow marimba', -5.0),
    'playful': ('S2', 'bright pizzicato bounce, marimba, shaker, clarinet answers', -1.0),
    'light': ('S2', 'lighter: pizzicato on 1 and 3, vibes', -4.5),
    'echo': ('S3', 'sparse vibes, each with a faint echo', -7.0),
    'board': ('S3', 'almost nothing: a soft string drone', -14.0),
    'clock': ('S4', 'clockwork marimba, one layer per arc', -3.0),
    'resolve': ('S4', 'resolution chords (Cmaj7 -> Gadd9)', -4.0),
    'museum': ('S5', 'walking pizzicato, slow strings, a clarinet line answered by bassoon', -2.5),
    'turn': ('S5', 'thins to a held string chord', -6.0),
    'nimble': ('S6', 'nimble marimba 16ths, pizzicato, shaker, soft kick', -1.5),
    'lift': ('S6', 'lift: up a step to E, strings + vibes', -0.5),
    'evidence': ('S7', 'sparse vibes and guitar', -7.5),
    'groove': ('S8', 'mechanical pizzicato 8ths, hats, marimba clicks', -3.0),
    'groove_out': ('S8', 'groove thins, strings', -5.5),
    'callback': ('S9', 'quiet callback of the tiptoe figure', -6.0),
    'build': ('S9', 'gentle build, one layer per bar', -2.0),
    'hold': ('S9', 'held A7sus question under s47', -6.0),
    'gag': ('S9', 'STOP: silent gag', None),
    'end': ('S9', 'warm D-major resolution, fades to zero at the end', -3.0),
}
REF_LUFS = -20.0
INSTR = {'pizz': (45, 0), 'marimba': (12, 1), 'vibes': (11, 2), 'glock': (9, 3), 'guitar': (24, 4), 'harp': (46, 5),
         'bass': (32, 6), 'bassoon': (70, 7), 'clarinet': (71, 8), 'strings': (49, 10), 'drums': (0, 9)}
GAINS_DB = {'pizz': 0, 'marimba': 0, 'vibes': -5, 'glock': -6, 'guitar': -3, 'harp': -4, 'bass': -5, 'bassoon': -7,
            'clarinet': -7, 'strings': -8, 'drums': -7}


def load():
    return json.load(open(os.path.join(ROOT, 'source', 'src', 'data', 'timeline.json'), encoding='utf-8'))


def norm(w):
    return re.sub(r"[^a-z0-9']", '', w.lower().replace('’', "'"))


def wt(tl, seg, word, occ=1, edge='from'):
    s = next(x for x in tl['segments'] if x['id'] == seg)
    hits = [w for w in s['words'] if norm(w['w']) == norm(word)]
    return hits[occ - 1][edge] / tl['fps']


def st(tl, seg, edge='from'):
    s = next(x for x in tl['segments'] if x['id'] == seg)
    return s[edge] / tl['fps']


def snap8(t):
    """Next eighth-note grid point at or after t."""
    q = BEAT / 2
    return float(np.ceil(t / q - 1e-6) * q)


def plan(tl):
    fps = tl['fps']
    total = tl['durationInFrames'] / fps
    sc = {s['id']: (s['from'] / fps, s['to'] / fps) for s in tl['scenes']}
    cue = {
        'sensor': wt(tl, 's02', 'sensor'),
        'reveal': wt(tl, 's03', 'And'),
        'reenter': st(tl, 's04'),
        'flash': wt(tl, 's05', 'flash.'),
        'settle': st(tl, 's08'),
        'clue': wt(tl, 's08', 'clue'),
        'visible': wt(tl, 's10', 'visible.'),
        's11': st(tl, 's11'),
        'lighter': st(tl, 's12'),
        'timing': wt(tl, 's12', 'timing.'),
        'board': st(tl, 's15'),
        'map': st(tl, 's17'),
        'flashes': wt(tl, 's17', 'flashes'),
        'arc1': st(tl, 's18'),
        'arc2': wt(tl, 's20', 'another', 2),
        'one_place': wt(tl, 's20', 'one'),
        'bands': st(tl, 's21'),
        'many': wt(tl, 's23', 'many'),
        'resolve': st(tl, 's24'),
        'shape': wt(tl, 's24', 'shape.'),
        'turn': st(tl, 's29'),
        'lift': st(tl, 's35'),
        'ping': wt(tl, 's41', 'sensor'),
        'slow': wt(tl, 's42', 'slow'),
        'slow_end': wt(tl, 's42', 'there.', edge='to'),
        'settle8': st(tl, 's44'),
        'takeaway': st(tl, 's46'),
        'hint': st(tl, 's47'),
        'too': wt(tl, 's47', 'too.', edge='to'),
        'end_card': st(tl, 's48'),
        'explained': wt(tl, 's48', 'explained.', edge='to'),
        'corner': wt(tl, 's48', 'corner.'),
    }
    seg_bounds = [
        ('sneak', 0.0, cue['sensor'] - 0.4),
        ('sensor', cue['sensor'] - 0.4, cue['reveal'] - 0.2),
        ('reveal', cue['reveal'] - 0.2, cue['reenter']),
        ('curious', cue['reenter'], cue['settle']),
        ('settle', cue['settle'], sc['S2'][0]),
        ('playful', sc['S2'][0], cue['lighter']),
        ('light', cue['lighter'], sc['S3'][0]),
        ('echo', sc['S3'][0], cue['board']),
        ('board', cue['board'], sc['S4'][0]),
        ('clock', sc['S4'][0], cue['resolve']),
        ('resolve', cue['resolve'], sc['S5'][0]),
        ('museum', sc['S5'][0], cue['turn']),
        ('turn', cue['turn'], sc['S6'][0]),
        ('nimble', sc['S6'][0], cue['lift']),
        ('lift', cue['lift'], sc['S7'][0]),
        ('evidence', sc['S7'][0], sc['S8'][0]),
        ('groove', sc['S8'][0], cue['settle8']),
        ('groove_out', cue['settle8'], sc['S9'][0]),
        ('callback', sc['S9'][0], cue['takeaway']),
        ('build', cue['takeaway'], cue['hint']),
        ('hold', cue['hint'], cue['too']),
        ('gag', cue['too'], cue['end_card']),
        ('end', cue['end_card'], total),
    ]
    # windows where the music gets out of the way: drop = near-silence, stop = complete silence, dip = brakes
    windows = [
        {'label': 'reveal: s03 "And yet... this is real data" (re-enters softly on s04)', 'kind': 'drop', 'depth_db': -24.0,
         'a': cue['reveal'] - 0.2, 'b': cue['reenter'] - 0.1, 'reentry_db': -9.0, 'reentry_s': 3.0},
        {'label': 'J2: s10 "simply visible" (resumes on s11)', 'kind': 'stop',
         'a': cue['visible'] - 0.15, 'b': cue['s11'] - 0.1},
        {'label': 'J3: s20 "one place" (sound effect only, resumes on s21)', 'kind': 'stop',
         'a': cue['one_place'] - 0.25, 'b': cue['bands'] - 0.1},
        {'label': 's42 "slow down" (the groove brakes, resumes on s43)', 'kind': 'dip', 'depth_db': -8.0,
         'a': cue['slow'] - 0.2, 'b': cue['slow_end'] + 0.1},
        {'label': 'J4: silent gag after s47 (complete stop until s48)', 'kind': 'stop',
         'a': cue['too'], 'b': cue['end_card'] - 0.1},
    ]
    # S4: one more layer of clockwork per arc, entering on the next eighth after its cue
    layers = [snap8(sc['S4'][0]), snap8(cue['arc1']), snap8(cue['arc2']), snap8(cue['bands']), snap8(cue['many'])]
    nbars = int(np.ceil(total / BAR)) + 1
    bars = []
    for b in range(nbars):
        t = b * BAR + 0.5 * BAR
        sec = 'end'
        for name, a, z in seg_bounds:
            if a <= t < z:
                sec = name
        bars.append(sec)
    return {'total': total, 'frames': tl['durationInFrames'], 'fps': fps, 'scenes': sc, 'cue': cue,
            'segments': seg_bounds, 'windows': windows, 'layers': layers, 'bars': bars}


def compose(P):
    rnd = random.Random(SEED)
    ev = {k: [] for k in INSTR}
    total, cue, wins = P['total'], P['cue'], P['windows']

    def blocked(ts, one_off):
        for w in wins:
            pad = 0.15 if w['kind'] == 'stop' else 0.05
            if w['a'] - pad <= ts < w['b']:
                if w['kind'] == 'dip' and one_off:
                    continue
                return True
        return False

    def add(inst, ts, dur, note, vel, one_off=False):
        if ts < 0 or ts >= total - 0.05 or blocked(ts, one_off):
            return
        if inst not in ('glock', 'drums'):
            while note > MAX_MELODIC:
                note -= 12
        ev[inst].append((ts, dur, int(note), int(max(1, min(127, vel)))))

    def tick(ts, vel=44):  # the sensor's flash, and its fainter, later echo (a metaphor, not photon audio)
        add('glock', ts, 0.3, TICK, vel, True)
        add('glock', ts + 0.45, 0.3, TICK_ECHO, int(vel * 0.55), True)

    def lay(k, t0, stop_at):  # S4: time from which layer k sounds in the bar starting at t0, or None
        s = max(t0, P['layers'][k - 1])
        return s if s < min(t0 + BAR, stop_at) else None

    def layer_n(ts):
        return sum(1 for th in P['layers'] if ts >= th - 1e-6)

    sneak_fig = [(0.5, 50, 0.3, 54), (1.5, 53, 0.3, 50), (2.0, 52, 0.25, 46), (3.0, 45, 0.3, 54), (3.5, 46, 0.25, 48),
                 (4.0, 45, 0.6, 52), (5.0, 50, 0.3, 50), (5.0, 53, 0.3, 44), (6.5, 44, 0.25, 46), (7.0, 45, 0.4, 52)]
    # S5 clarinet line (Bb major), one entry per bar of the museum progression: (beat, note, beats)
    mel = [[(2, 65, 1), (3, 70, 1)], [(0, 69, 2), (2, 67, 1), (3, 65, 1)], [(0, 67, 3), (3, 62, 1)], [(0, 63, 3)],
           [(2, 65, 1), (3, 74, 1)], [(0, 72, 2), (2, 70, 1), (3, 67, 1)], [(0, 70, 2), (2, 67, 2)], [(0, 65, 3.5)]]
    counters = {}
    for b, sec in enumerate(P['bars']):
        t0 = b * BAR
        if t0 >= total:
            break
        idx = counters.get(sec, 0)
        counters[sec] = idx + 1
        prog = PROG.get(sec)
        root, up = CH[prog[idx % len(prog)]] if prog else (38, [50, 53, 57, 60])
        r3 = root + 12 if root < 45 else root  # pizzicato register of the root

        if sec == 'sneak':
            if idx == 0:  # the tiptoe: two careful steps, a wobble, settle (both bars written here)
                for beat, n, d, v in sneak_fig:
                    add('pizz', t0 + beat * BEAT, d * BEAT, n, v)
                    if n < 50:
                        add('bassoon', t0 + beat * BEAT, d * BEAT * 0.8, n, v - 12)
                for beat, n in ((2.5, 62), (6.0, 65)):
                    add('marimba', t0 + beat * BEAT, 0.3 * BEAT, n, 26)
        elif sec == 'sensor':
            if idx == 0:  # smug little button after "very pleased about it"
                add('marimba', t0, 0.8 * BEAT, 62, 30)
                add('marimba', t0, 0.8 * BEAT, 69, 26)
                add('pizz', t0, 0.3 * BEAT, 50, 44)
            for i in (1, 3, 5, 7):
                add('pizz', t0 + i * 0.5 * BEAT, 0.25 * BEAT, up[(i // 2) % 4], 34 + rnd.randint(-3, 3))
            add('bass', t0, BAR * 0.9, root, 36)
            add('marimba', t0 + 2 * BEAT, 0.5 * BEAT, up[2] + 12, 24)
        elif sec == 'curious':
            soft = min(1.0, 0.55 + 0.15 * idx)  # re-enters softly after the reveal
            for i, j in enumerate([0, 2, 1, 2, 0, 3, 1, 2]):
                n = up[j]
                if idx % 4 == 3 and i == 7:
                    n = up[0] - 1  # a sly chromatic step back to the top
                add('pizz', t0 + i * 0.5 * BEAT, 0.25 * BEAT, n, int((40 if i % 2 == 0 else 32) * soft) + rnd.randint(-2, 2))
            for beat, j in ((0, 1), (1.5, 3), (2.5, 2), (3.5, 0)):
                add('marimba', t0 + beat * BEAT, 0.35 * BEAT, up[j] + 12, int(30 * soft) + rnd.randint(-2, 2))
            add('bass', t0, BAR * 0.92, root, int(40 * soft))
            if idx % 4 == 2:  # a curious little question on vibes (a dotted lean, then up)
                for beat, j, d in ((1.5, 3, 0.4), (2.0, 1, 0.8), (3.0, 2, 1.2)):
                    add('vibes', t0 + beat * BEAT, d * BEAT, up[j] + 12, 32)
            if idx % 2 == 1 and t0 > cue['flash'] + 1.5:  # after the flash is introduced, every other bar
                tick(t0, 34)
        elif sec == 'settle':
            fade = max(0.6, 1 - 0.12 * idx)
            add('strings', t0, BAR * 0.98, up[0], 28)
            add('strings', t0, BAR * 0.98, up[2], 26)
            add('pizz', t0, 0.4 * BEAT, r3, int(40 * fade))
            for i in range(4 if idx < 3 else 2):
                add('marimba', t0 + i * BEAT, 0.6 * BEAT, up[i % 4] + 12, int((30 - 3 * i) * fade))
            add('bass', t0, BAR * 0.95, root, 36)
        elif sec == 'playful':
            add('pizz', t0, 0.35 * BEAT, r3, 50)
            add('pizz', t0 + 2 * BEAT, 0.35 * BEAT, r3 + 7, 46)
            for beat in (1, 3):
                add('pizz', t0 + beat * BEAT, 0.3 * BEAT, up[1], 38)
                add('pizz', t0 + beat * BEAT, 0.3 * BEAT, up[2], 35)
            if idx % 2 == 1:  # a skipping pickup into the next bar
                add('pizz', t0 + 3.5 * BEAT, 0.2 * BEAT, up[2] + 2, 36)
                add('pizz', t0 + 3.75 * BEAT, 0.2 * BEAT, up[3], 38)
            for beat, j in ((0.5, 2), (1.5, 3), (2.75, 2), (3.5, 3)):
                add('marimba', t0 + beat * BEAT, 0.3 * BEAT, up[j] + 12, 32 + rnd.randint(-3, 3))
            add('bass', t0, 1.8 * BEAT, root, 44)
            add('bass', t0 + 2 * BEAT, 1.6 * BEAT, root + 7, 40)
            for i in range(8):
                add('drums', t0 + i * 0.5 * BEAT, 0.05, 82, 14 + (6 if i % 2 == 0 else 0))
            for beat in (1, 3):
                add('drums', t0 + beat * BEAT, 0.1, 54, 22)
            if idx % 4 == 1:
                for beat, n in ((2.5, 60), (3.0, 62), (3.5, 65)):
                    add('clarinet', t0 + beat * BEAT, 0.35 * BEAT, n, 40)
        elif sec == 'light':
            add('pizz', t0, 0.35 * BEAT, r3, 40)
            add('pizz', t0 + 2 * BEAT, 0.35 * BEAT, r3 + 7, 34)
            add('vibes', t0, BAR * 0.95, up[1] + 12, 24)
            add('vibes', t0, BAR * 0.95, up[3] + 12, 22)
            add('marimba', t0 + 2.5 * BEAT, 0.4 * BEAT, up[2] + 12, 24)
            add('bass', t0, BAR * 0.9, root, 34)
        elif sec == 'echo':
            for n in (up[1] + 12, up[3] + 12):
                add('vibes', t0, 1.4 * BEAT, n, 32)
                add('vibes', t0 + 1.5 * BEAT, 1.2 * BEAT, n, 16)  # its faint, later echo
            if idx % 2 == 0:
                add('bass', t0, BAR * 1.9, root, 32)
            else:
                add('pizz', t0 + 3 * BEAT, 0.4 * BEAT, up[0], 28)
        elif sec == 'board':
            if idx % 2 == 0:
                add('strings', t0, 2 * BAR * 0.98, 50, 22)
                add('strings', t0, 2 * BAR * 0.98, 57, 20)
            if idx % 4 == 1:
                add('vibes', t0 + 2 * BEAT, 2 * BEAT, 69, 18)
        elif sec == 'clock':
            end = cue['resolve']
            for i, j in enumerate([0, 2, 1, 2, 0, 3, 1, 2]):  # layer 1 (the map): clockwork marimba + a soft tick
                ts = t0 + i * 0.5 * BEAT
                if ts < end and layer_n(ts) >= 1:
                    add('marimba', ts, 0.35 * BEAT, up[j] + 12, 28 + (5 if i % 2 == 0 else 0) + rnd.randint(-2, 2))
                    if i % 2 == 0:
                        add('drums', ts, 0.05, 42, 16 + (4 if i == 0 else 0))
            for beat, n, v in ((0, r3, 42), (1, up[0], 32), (2, r3 + 7, 38), (3, up[0], 32)):  # layer 2 (arc 1)
                ts = t0 + beat * BEAT
                if ts < end and layer_n(ts) >= 2:
                    add('pizz', ts, 0.4 * BEAT, n, v)
            for i, j in ((1, 1), (3, 3), (5, 2), (7, 3)):  # layer 3 (arc 2): off-beat guitar
                ts = t0 + i * 0.5 * BEAT
                if ts < end and layer_n(ts) >= 3:
                    add('guitar', ts, 0.45 * BEAT, up[j], 34 + rnd.randint(-2, 2))
            s = lay(4, t0, end)  # layer 4 (bands): sustained vibes + bass
            if s is not None:
                d = t0 + BAR - s
                add('vibes', s, d * 0.95, up[2] + 12, 26)
                add('vibes', s, d * 0.95, up[3] + 12, 24)
                add('bass', s, d * 0.95, root, 40)
            for i in range(16):  # layer 5 (many spots): a second marimba voice in 16ths, shaker
                ts = t0 + i * 0.25 * BEAT
                if ts < end and layer_n(ts) >= 5:
                    if i % 4 != 0:
                        add('marimba', ts, 0.2 * BEAT, up[(i * 3) % 4] + 24, 20 + rnd.randint(-2, 2))
                    add('drums', ts, 0.04, 82, 12 + (5 if i % 4 == 0 else 0))
        elif sec == 'museum':
            nroot = CH[prog[(idx + 1) % len(prog)]][0]
            nr3 = nroot + 12 if nroot < 45 else nroot
            appr = nr3 - 1 if nr3 - 1 != r3 else nr3 + 1
            for beat, n in enumerate([r3, up[0], up[1], appr]):  # the museum walk
                add('pizz', t0 + beat * BEAT, 0.7 * BEAT, n, 40 if beat == 0 else 33)
            for j in (0, 2, 3):
                add('strings', t0, BAR * 0.98, up[j], 28)
            add('bass', t0, BAR * 0.95, root, 34)
            if 1 <= idx <= 16:  # the line on clarinet, then the bassoon answers it an octave lower
                inst, low, vel = ('clarinet', 0, 40) if idx <= 8 else ('bassoon', 12, 46)
                for beat, n, d in mel[(idx - 1) % 8]:
                    add(inst, t0 + beat * BEAT, d * BEAT * 0.95, n - low, vel)
        elif sec == 'turn':
            if idx == 0:
                r, u = CH['F7sus']
                add('strings', t0, 2 * BAR * 0.95, u[0], 26)
                add('strings', t0, 2 * BAR * 0.95, u[2], 24)
                add('pizz', t0, 0.5 * BEAT, r + 12, 34)
        elif sec in ('nimble', 'lift'):
            for pos, j in ((0, 0), (3, 2), (6, 1), (8, 3), (10, 2), (13, 1), (14, 3)):
                add('marimba', t0 + pos * 0.25 * BEAT, 0.22 * BEAT, up[j] + 12, 30 + (6 if pos % 4 == 0 else 0) + rnd.randint(-3, 3))
            if idx % 4 == 3:  # a little run up at the end of each phrase
                for k in range(4):
                    add('marimba', t0 + (3 + 0.25 * k) * BEAT, 0.2 * BEAT, up[k] + 24, 26 + 2 * k)
            for i in range(8):
                n = r3 if i % 4 == 0 else (up[2] if i % 2 == 1 else r3 + 7)
                add('pizz', t0 + i * 0.5 * BEAT, 0.25 * BEAT, n, 40 if i % 2 == 0 else 32)
            add('bass', t0, 1.4 * BEAT, root, 44)
            add('bass', t0 + 2.5 * BEAT, 1.3 * BEAT, root, 40)
            add('drums', t0, 0.2, 36, 34)
            add('drums', t0 + 2.5 * BEAT, 0.2, 36, 28)
            for i in range(16):
                add('drums', t0 + i * 0.25 * BEAT, 0.04, 82, 12 + (8 if i % 4 == 2 else (4 if i % 2 == 0 else 0)))
            if idx >= 2 or sec == 'lift':
                for beat in (1, 3):
                    add('drums', t0 + beat * BEAT, 0.1, 54, 22)
            if sec == 'nimble' and idx % 8 >= 4:
                for beat in (0.5, 2.5):
                    add('guitar', t0 + beat * BEAT, 0.5 * BEAT, up[1], 28)
                    add('guitar', t0 + beat * BEAT, 0.5 * BEAT, up[3], 26)
            if sec == 'lift':
                add('strings', t0, BAR * 0.98, up[0], 30)
                add('strings', t0, BAR * 0.98, up[2], 28)
                add('vibes', t0, 1.9 * BEAT, up[3] + 12, 28)
                add('vibes', t0 + 2 * BEAT, 1.9 * BEAT, up[2] + 12, 26)
        elif sec == 'evidence':
            add('vibes', t0, BAR * 0.9, up[1] + 12, 26)
            add('vibes', t0, BAR * 0.9, up[3] + 12, 22)
            add('guitar', t0, 1.5 * BEAT, up[0], 30)
            add('guitar', t0 + 2.5 * BEAT, 1.2 * BEAT, up[2], 26)
            if idx % 2 == 0:
                add('bass', t0, 2 * BAR * 0.95, root, 32)
        elif sec in ('groove', 'groove_out'):
            for i in range(8):
                add('pizz', t0 + i * 0.5 * BEAT, 0.15 * BEAT, r3 + (12 if i % 4 == 3 else 0), 40 if i % 2 == 0 else 32)
            add('bass', t0, 1.8 * BEAT, root, 40)
            add('bass', t0 + 2 * BEAT, 1.8 * BEAT, root, 36)
            if sec == 'groove':
                for pos in (2, 6, 7, 10, 14):
                    add('marimba', t0 + pos * 0.25 * BEAT, 0.2 * BEAT, up[2 if pos < 8 else 3] + 12, 28 + rnd.randint(-2, 2))
                for i in range(8):
                    add('drums', t0 + i * 0.5 * BEAT, 0.05, 42, 16 + (5 if i % 2 == 0 else 0))
                for beat in (0, 2):
                    add('drums', t0 + beat * BEAT, 0.2, 36, 30)
            else:
                add('strings', t0, BAR * 0.95, up[0], 26)
                add('strings', t0, BAR * 0.95, up[2], 24)
        elif sec == 'callback':
            if idx == 0:  # the tiptoe again, quieter: back to our friend
                for beat, n, d, v in sneak_fig[:5]:
                    add('pizz', t0 + beat * BEAT, d * BEAT, n, v - 10)
                    if n < 50:
                        add('bassoon', t0 + beat * BEAT, d * BEAT * 0.8, n, v - 22)
                add('bass', t0, BAR * 0.9, 38, 30)
        elif sec == 'build':
            layer = idx
            add('strings', t0, BAR * 0.98, up[0], 26 + 4 * layer)
            add('strings', t0, BAR * 0.98, up[2], 24 + 4 * layer)
            for i in range(4):
                add('pizz', t0 + i * BEAT, 0.4 * BEAT, r3 if i % 2 == 0 else up[1], 36 + 2 * layer)
            if layer >= 1:
                for i, j in enumerate([0, 3, 2, 3, 1, 3, 2, 3]):
                    add('marimba', t0 + i * 0.5 * BEAT, 0.4 * BEAT, up[j] + 12, 28 + 2 * layer)
                add('bass', t0, BAR * 0.95, root, 40)
            if layer >= 2:
                add('vibes', t0, BAR * 0.95, up[3] + 12, 26)
                tick(t0, 30)
                for i in range(8):
                    add('drums', t0 + i * 0.5 * BEAT, 0.05, 82, 14 + (4 if i % 2 == 0 else 0))
        # 'reveal', 'resolve', 'hold', 'gag', 'end': one-off events only (below)

    # ---- one-off events on word cues
    tick(cue['sensor'], 40)                      # s02 "That sensor..."
    tick(cue['flash'], 58)                       # s05 "...invisible flash."
    tick(cue['clue'], 38)                        # s08 "...a clue to where he is."
    tick(cue['timing'], 38)                      # s12 "What survives is timing."
    tick(cue['flashes'], 46)                     # s17 "The sensor flashes and listens..."
    tick(cue['ping'], 42)                        # s41 "...a sensor like this..."
    rs, sh, s5 = cue['resolve'], cue['shape'], P['scenes']['S5'][0]
    r, u = CH['Cmaj7']                           # s24: the answer, resolved
    for k, n in enumerate([r, r + 7] + u[1:]):
        add('guitar', rs + 0.11 * k, sh - rs, n, 36, True)
    for n in u:
        add('strings', rs, sh - rs + 0.2, n, 30, True)
    add('vibes', rs, sh - rs, u[3] + 12, 24, True)
    add('bass', rs, sh - rs, r - 12, 38, True)
    r, u = CH['Gadd9']
    for k, n in enumerate([r, r + 7] + u):
        add('guitar', sh + 0.11 * k, s5 - sh + 0.4, n, 36, True)
    for n in u:
        add('strings', sh, s5 - sh + 0.4, n, 30, True)
    add('vibes', sh, s5 - sh, 74, 24, True)
    add('vibes', sh, s5 - sh, 79, 20, True)
    add('bass', sh, s5 - sh, r, 38, True)
    dip = next(w for w in P['windows'] if w['kind'] == 'dip')   # s42: the groove brakes to a held chord
    r, u = CH['Fmaj7']
    for n in u[:3]:
        add('strings', dip['a'], dip['b'] - dip['a'] + 0.3, n, 28, True)
    add('vibes', dip['a'], dip['b'] - dip['a'], u[3] + 12, 22, True)
    r, u = CH['A7sus']                           # s47: a held question; it stops dead on "too."
    for n in (u[0], u[1], u[3]):
        add('strings', cue['hint'] - 0.05, 4.0, n, 30, True)
    add('vibes', cue['hint'] - 0.05, 4.0, 64, 24, True)
    add('vibes', cue['hint'] - 0.05, 4.0, 69, 22, True)
    add('bass', cue['hint'] - 0.05, 4.0, r, 34, True)
    e1, e2, e3 = cue['end_card'], cue['explained'], cue['corner']   # s48 + end card: warm D-major resolution
    to_end = total + 1.0
    r, u = CH['Dadd9']
    for k, n in enumerate([r, r + 7] + u):
        add('harp', e1 + 0.09 * k, e2 - e1 + 0.5, n, 42, True)
    for n in u:
        add('strings', e1, e2 - e1 + 0.3, n, 30, True)
    add('vibes', e1 + 0.05, 3.0, 66, 28, True)
    add('vibes', e1 + 0.05, 3.0, 69, 26, True)
    add('bass', e1, e2 - e1, r, 34, True)
    r, u = CH['Gmaj7/D']
    for k, n in enumerate([r + 12] + u):
        add('harp', e2 + 0.1 * k, e3 - e2 + 0.5, n, 40, True)
    for n in u:
        add('strings', e2, e3 - e2 + 0.3, n, 30, True)
    add('marimba', e2 + 0.2, 0.6, 67, 24, True)
    add('marimba', e2 + 0.5, 0.6, 71, 22, True)
    add('bass', e2, e3 - e2, r, 36, True)
    r, u = CH['Dadd9']
    for k, n in enumerate([r, r + 7] + u[1:] + [69, 74]):
        add('harp', e3 + 0.1 * k, to_end - e3, n, 44 - k, True)
    for n in u:
        add('strings', e3, to_end - e3, n, 32, True)
    add('vibes', e3 + 0.1, to_end - e3, 69, 28, True)
    add('vibes', e3 + 0.1, to_end - e3, 74, 24, True)
    add('bass', e3, to_end - e3, r, 38, True)
    tick(e3 + 1.2, 36)                           # last flash-and-echo, then it rings out

    # complete stops: notes that would sound into a stop are released just before it
    stops = [w for w in P['windows'] if w['kind'] == 'stop']
    for inst in ev:
        out = []
        for ts, dur, n, v in ev[inst]:
            for w in stops:
                if ts < w['a'] < ts + dur:
                    dur = max(0.04, w['a'] - ts - 0.03)
            out.append((ts, dur, n, v))
        ev[inst] = sorted(out)
    return ev


def write_midi(evts, program, channel, path):
    mid = mido.MidiFile(ticks_per_beat=TPB)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    tr.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(BPM)))
    if channel != 9:
        tr.append(mido.Message('program_change', program=program, channel=channel, time=0))
    tr.append(mido.Message('control_change', control=91, value=30, channel=channel, time=0))
    msgs = []
    for (ts, dur, note, vel) in evts:
        on = int(round(max(0.0, ts) / BEAT * TPB))
        off = max(on + 1, int(round(max(0.0, ts + dur) / BEAT * TPB)))
        msgs.append((on, 1, mido.Message('note_on', note=int(note), velocity=int(max(1, min(127, vel))), channel=channel)))
        msgs.append((off, 0, mido.Message('note_off', note=int(note), velocity=0, channel=channel)))
    msgs.sort(key=lambda m: (m[0], m[1]))
    last = 0
    for tick_, _, m in msgs:
        m.time = tick_ - last
        last = tick_
        tr.append(m)
    mid.save(path)


def render(midi_path, wav_path):
    subprocess.run(['fluidsynth', '-ni', '-g', '0.5', '-r', str(SR), '-o', 'synth.reverb.active=1', '-o', 'synth.chorus.active=0',
                    '-F', wav_path, SF2, midi_path], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


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
    """Per-instrument EQ: keep each part out of the 1-4 kHz speech band."""
    if name in ('vibes', 'guitar', 'strings', 'harp'):
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


def section_gain(P, raw, meter):
    """Per-segment gain (dB) so each segment sits at its target level; drops and dips on top; smoothed."""
    n = len(raw)
    wins = P['windows']
    pre = REF_LUFS - seg_loudness(meter, raw, 0.0, n / SR, wins)  # bring the raw bed to the reference first
    g = np.full(n, pre)
    applied = {}
    for name, a, z in P['segments']:
        tgt = SEGMENTS[name][2]
        ia, iz = int(a * SR), min(n, int(z * SR))
        lv = seg_loudness(meter, raw, a, z, wins) if tgt is not None else float('-inf')
        gd = float(np.clip(REF_LUFS + tgt - lv, pre - 10, pre + 10)) if np.isfinite(lv) else pre
        g[ia:iz] = gd
        applied[(name, a)] = gd
    for w in wins:
        if w['kind'] in ('drop', 'dip'):
            g[int(w['a'] * SR):int(w['b'] * SR)] += w['depth_db']
        if w.get('reentry_s'):  # come back in gently: reentry_db at the end of the window, easing to 0 dB
            b, r = int(w['b'] * SR), int(w['reentry_s'] * SR)
            g[b:b + r] += w['reentry_db'] * np.linspace(1, 0, len(g[b:b + r])) ** 1.5
    k = int(0.5 * SR)
    g = uniform_filter1d(g, size=k, mode='nearest')
    lin = 10 ** (g / 20)
    for w in wins:  # complete stops: hard mute with short ramps, after smoothing
        if w['kind'] != 'stop':
            continue
        a, b = int(w['a'] * SR), int(w['b'] * SR)
        r1, r2 = int(0.08 * SR), int(0.04 * SR)
        lin[a:b] = 0.0
        lin[a - r1:a] *= np.linspace(1, 0, r1)
        lin[b:b + r2] *= np.linspace(0, 1, r2)
    return lin, applied


def seg_loudness(meter, x, a, z, wins, guard=0.2):
    """Integrated loudness of x[a:z] (seconds) leaving out the drop/stop/dip windows; -inf if too little remains."""
    ia, iz = int(a * SR), min(len(x), int(z * SR))
    t = np.arange(ia, iz) / SR
    keep = np.ones(iz - ia, bool)
    for w in wins:
        keep &= ~((t >= w['a'] - guard) & (t < w['b'] + guard))
    y = x[ia:iz][keep]
    if len(y) < int(0.5 * SR):
        return float('-inf')
    lv = meter.integrated_loudness(y)
    return float(lv) if np.isfinite(lv) and lv > -70 else float('-inf')


def rms_db(x):
    return float(20 * np.log10(np.sqrt(np.mean(np.square(x))) + 1e-12)) if len(x) else -240.0


def band_share(x, lo=1000, hi=4000):
    m = x.mean(axis=1)
    if np.max(np.abs(m)) < 1e-7:
        return 0.0
    f, p = signal.welch(m, SR, nperseg=8192)
    tot = p[(f >= 20) & (f <= 20000)].sum()
    return float(p[(f >= lo) & (f < hi)].sum() / tot) if tot > 0 else 0.0


def measure(P, bed, meter, ev, scale_db):
    n = len(bed)
    total = P['total']
    m = {'duration': {'samples': n, 'seconds': n / SR, 'timeline_seconds': total,
                      'timeline_samples': int(round(P['frames'] * SR / P['fps'])),
                      'matches_timeline': n == int(round(P['frames'] * SR / P['fps']))}}
    up = signal.resample_poly(bed, 4, 1, axis=0)
    m['peaks'] = {'sample_peak_dbfs': round(20 * np.log10(np.max(np.abs(bed)) + 1e-12), 2),
                  'true_peak_dbtp_4x': round(20 * np.log10(np.max(np.abs(up)) + 1e-12), 2),
                  'samples_at_or_over_0dBFS': int(np.sum(np.abs(bed) >= 0.999))}
    del up
    whole = meter.integrated_loudness(bed)
    m['integrated_lufs'] = round(whole, 2)
    m['band_1_4k_share_whole'] = round(band_share(bed), 4)
    m['scenes'] = {}
    for sid, (a, z) in P['scenes'].items():
        x = bed[int(a * SR):int(z * SR)]
        lv = meter.integrated_loudness(x)
        m['scenes'][sid] = {'from': round(a, 2), 'to': round(z, 2), 'lufs': round(lv, 2), 'rel_lu': round(lv - whole, 2),
                            'lufs_after_mix_norm_-27': round(lv - whole - 27, 2), 'band_1_4k_share': round(band_share(x), 4)}
    m['segments'] = []
    ref = REF_LUFS + scale_db  # where a 0 LU segment sits in the delivered bed
    m['reference_lufs'] = round(ref, 2)
    for name, a, z in P['segments']:
        x = bed[int(a * SR):int(z * SR)]
        lv = seg_loudness(meter, bed, a, z, P['windows'])
        m['segments'].append({'segment': name, 'from': round(a, 2), 'to': round(z, 2), 'target_lu': SEGMENTS[name][2],
                              'level_lu': round(lv - ref, 2) if np.isfinite(lv) else None,
                              'rel_whole_lu': round(lv - whole, 2) if np.isfinite(lv) else None, 'rms_dbfs': round(rms_db(x), 1)})
    m['windows'] = []
    for w in P['windows']:
        a, b = int(w['a'] * SR), int(w['b'] * SR)
        settle = int((0.6 if w['kind'] != 'stop' else 0.0) * SR)  # a drop lets tails decay; a stop is silent at once
        pre = bed[max(0, a - int(4 * SR)):a]
        m['windows'].append({'label': w['label'], 'kind': w['kind'], 'from': round(w['a'], 2), 'to': round(w['b'], 2),
                             'seconds': round(w['b'] - w['a'], 2), 'rms_dbfs': round(rms_db(bed[a:b]), 1),
                             'rms_dbfs_after_settle': round(rms_db(bed[a + settle:b]), 1),
                             'peak_dbfs': round(20 * np.log10(np.max(np.abs(bed[a:b])) + 1e-12), 1),
                             'rms_dbfs_4s_before': round(rms_db(pre), 1)})
    m['notes'] = {'events': {k: len(v) for k, v in ev.items() if v},
                  'max_melodic_note': max(e[2] for k, v in ev.items() if k not in ('glock', 'drums') for e in v),
                  'glock_notes': sorted({e[2] for e in ev['glock']})}
    return m


def write_notes(P, m):
    f = lambda t: f"{int(t // 60)}:{t % 60:05.2f}"
    L = ['# Video 02 music bed: notes', '',
         'Original score composed in code (`tools/make_music_v02.py`, adapted from Video 01\'s `make_music_v2.py`), '
         'rendered with FluidSynth 2.3.4 and the MuseScore General SoundFont (MIT). Instrumental; no existing themes; no '
         'Video 01 material reused. 100 BPM throughout (bar = 2.4 s). Cues come from the measured timeline '
         '(`source/src/data/timeline.json`), so re-running the tool after a timeline change moves every section, drop '
         'and stop with the words.', '',
         f"Files: `music_bed.wav` (48 kHz stereo 24-bit, unducked, {m['duration']['seconds']:.3f} s = timeline), "
         '`stems/*.wav` (post-dynamics; they sum to the bed), `plan.json` (cues, segments, windows), `measure.json`.', '',
         '## Structure', '', '| Segment | Time | Scene | Music | Target LU | Measured LU |', '|---|---|---|---|---|---|']
    seg_m = {(s['segment'], s['from']): s for s in m['segments']}
    for name, a, z in P['segments']:
        sm = seg_m[(name, round(a, 2))]
        tgt = SEGMENTS[name][2]
        L.append(f"| {name} | {f(a)}–{f(z)} | {SEGMENTS[name][0]} | {SEGMENTS[name][1]} | "
                 f"{'—' if tgt is None else f'{tgt:+.1f}'} | {'—' if sm['level_lu'] is None else f'{sm['level_lu']:+.1f}'} |")
    L += ['', f"LU = relative to the reference level ({m['reference_lufs']} LUFS in the delivered bed), measured outside "
          'the drop/stop/dip windows. The mix (`mix_v2.py` pattern) normalises the bed to -27 LUFS integrated and ducks '
          'it a further 9 dB under speech, so these are the relative moves the viewer hears.', '',
          '## Drops and stops', '', '| Window | Kind | Time | Length | RMS in window | RMS 4 s before |', '|---|---|---|---|---|---|']
    for w in m['windows']:
        rm = w['rms_dbfs'] if w['kind'] != 'drop' else w['rms_dbfs_after_settle']
        rms_txt = 'digital silence' if rm <= -200 else f'{rm:.1f} dBFS'
        L.append(f"| {w['label']} | {w['kind']} | {f(w['from'])}–{f(w['to'])} | {w['seconds']:.2f} s | {rms_txt} | "
                 f"{w['rms_dbfs_4s_before']:.1f} dBFS |")
    L += ['', 'drop = no new notes and -24 dB (near-silence; measured after a 0.6 s tail), then a soft re-entry on s04 '
          '(-9 dB easing to 0 over 3 s, with the first bars played softer); stop = notes released, the bed muted with an '
          '80 ms ramp (complete silence); dip = the groove stops, one held chord at -8 dB.',
          '', '## Motifs and cues', '',
          '- **Flash and echo** (the sensor\'s pulse, as music): a glockenspiel tick on D8 (4.7 kHz) and a fainter echo on '
          'C8 0.45 s later. On s02 "sensor", s05 "flash" (strongest), every other bar from s05 to s07, s08 "clue", s12 '
          '"timing", s17 "flashes", s41 "sensor", in the s46 build and after the last word.',
          '- **Tiptoe** (s01): staccato pizzicato with bassoon on the low steps, in D minor; quietly recalled on s45.',
          '- **Clockwork** (S4): marimba 8ths from s17; + pizzicato at s18 (arc 1); + guitar at s20 "another arc"; + vibes '
          'and bass at s21 (bands); + 16th marimba and shaker at s23 "many"; Cmaj7 at s24, Gadd9 on "shape".',
          '- **Ending**: build Bbmaj7-C6-Gm9 under s46, held A7sus under s47, stop on "too.", D-major (Dadd9, Gmaj7/D, '
          'Dadd9) under s48 and the end card, fade over the last 3 s to zero at the timeline end.', '',
          '## Instruments (General MIDI programs, MuseScore General)', '',
          'pizzicato strings (45), marimba (12), vibraphone (11), glockenspiel (9, ticks only), nylon guitar (24), harp (46, '
          'end only), acoustic bass (32), bassoon (70), clarinet (71), slow strings (49), percussion (channel 10: shaker, '
          'closed hat, tambourine, soft kick).', '',
          '## Speech band', '',
          f"Melodic notes stay at or below B5 (MIDI {m['notes']['max_melodic_note']} max); ticks sit at "
          f"{', '.join(str(x) for x in m['notes']['glock_notes'])} (above 4 kHz); per-instrument EQ cuts 2.2-2.5 kHz and "
          f"low-passes the leads. Energy in 1-4 kHz: {100 * m['band_1_4k_share_whole']:.1f}% of the whole bed; per scene " +
          ', '.join(f"{k} {100 * v['band_1_4k_share']:.1f}%" for k, v in m['scenes'].items()) + '.', '',
          '## Measured', '',
          f"Integrated {m['integrated_lufs']} LUFS (unducked, before the mix); sample peak {m['peaks']['sample_peak_dbfs']} "
          f"dBFS; true peak {m['peaks']['true_peak_dbtp_4x']} dBTP (4x); {m['peaks']['samples_at_or_over_0dBFS']} clipped "
          f"samples; {m['duration']['samples']} samples = timeline {m['duration']['timeline_samples']} "
          f"({'match' if m['duration']['matches_timeline'] else 'MISMATCH'}).", '',
          '| Scene | Time | LUFS | Rel. LU | After mix normalisation (-27) |', '|---|---|---|---|---|']
    for k, v in m['scenes'].items():
        L.append(f"| {k} | {f(v['from'])}–{f(v['to'])} | {v['lufs']:.1f} | {v['rel_lu']:+.1f} | {v['lufs_after_mix_norm_-27']:.1f} |")
    L += ['', 'Re-run: `python3 tools/make_music_v02.py` (deterministic; about three minutes).', '']
    open(os.path.join(OUT, 'MUSIC_NOTES.md'), 'w', encoding='utf-8').write('\n'.join(L))


def main():
    tl = load()
    P = plan(tl)
    ev = compose(P)
    os.makedirs(os.path.join(OUT, 'stems'), exist_ok=True)
    n = int(round(P['frames'] * SR / P['fps']))  # exactly the timeline's duration
    meter = pyln.Meter(SR)
    raw = np.zeros((n, 2))
    with tempfile.TemporaryDirectory() as td:
        names = []
        for name, (prog, ch) in INSTR.items():
            if not ev[name]:
                continue
            mp, wp = os.path.join(td, f'{name}.mid'), os.path.join(td, f'{name}.wav')
            write_midi(ev[name], prog, ch, mp)
            render(mp, wp)
            x, sr = sf.read(wp, always_2d=True)
            assert sr == SR
            x = x[:n] if len(x) >= n else np.vstack([x, np.zeros((n - len(x), 2))])
            x = eq(name, x) * 10 ** (GAINS_DB[name] / 20)
            np.save(os.path.join(td, f'{name}.npy'), x.astype(np.float32))
            raw += x
            names.append(name)
        gain, applied = section_gain(P, raw, meter)
        env = gain.copy()
        fi = int(0.25 * SR)
        env[:fi] *= np.linspace(0, 1, fi) ** 2
        fo = int(3.0 * SR)
        env[n - fo:] *= np.linspace(1, 0, fo) ** 1.6
        bed = raw * env[:, None]
        del raw
        peak = np.max(np.abs(bed))
        scale = min(1.0, 0.89 / peak) if peak > 0 else 1.0
        bed *= scale
        sf.write(os.path.join(OUT, 'music_bed.wav'), bed.astype(np.float32), SR, subtype='PCM_24')
        for name in names:
            x = np.load(os.path.join(td, f'{name}.npy')).astype(np.float64) * (env * scale)[:, None]
            sf.write(os.path.join(OUT, 'stems', f'{name}.wav'), x.astype(np.float32), SR, subtype='PCM_24')
    m = measure(P, bed, meter, ev, 20 * np.log10(scale))
    secs = {}
    for s in P['bars']:
        secs[s] = secs.get(s, 0) + 1
    out = {k: v for k, v in P.items() if k != 'bars'}
    out.update({'bpm': BPM, 'bar_seconds': BAR, 'bars_per_segment': secs, 'progressions': PROG,
                'segment_targets_lu': {k: v[2] for k, v in SEGMENTS.items()},
                'segment_gain_db_applied': {f'{k[0]}@{k[1]:.2f}': round(v, 2) for k, v in applied.items()},
                'instruments': {k: {'gm_program': v[0], 'gain_db': GAINS_DB[k]} for k, v in INSTR.items()},
                'final_scale_db': round(20 * np.log10(scale), 2), 'soundfont': os.path.realpath(SF2)})
    json.dump(out, open(os.path.join(OUT, 'plan.json'), 'w'), indent=1, default=str)
    json.dump(m, open(os.path.join(OUT, 'measure.json'), 'w'), indent=1)
    write_notes(P, m)
    print(f"music bed {m['duration']['seconds']:.3f}s (timeline {P['total']:.3f}s, match={m['duration']['matches_timeline']}), "
          f"{m['integrated_lufs']} LUFS, peak {m['peaks']['sample_peak_dbfs']} dBFS / {m['peaks']['true_peak_dbtp_4x']} dBTP, "
          f"1-4 kHz share {100 * m['band_1_4k_share_whole']:.1f}%")
    for sid, v in m['scenes'].items():
        print(f"  {sid} {v['from']:7.2f}-{v['to']:7.2f}  {v['lufs']:6.1f} LUFS ({v['rel_lu']:+.1f} LU)  1-4k {100 * v['band_1_4k_share']:.1f}%")
    for sg in m['segments']:
        print(f"  {sg['segment']:10s} {sg['from']:7.2f}-{sg['to']:7.2f} target {sg['target_lu']} LU, measured {sg['level_lu']} LU")
    for w in m['windows']:
        print(f"  {w['kind']:4s} {w['from']:7.2f}-{w['to']:7.2f} rms {w['rms_dbfs']:6.1f} (after settle {w['rms_dbfs_after_settle']:6.1f}) "
              f"vs before {w['rms_dbfs_4s_before']:6.1f} dBFS  {w['label']}")


if __name__ == '__main__':
    main()
