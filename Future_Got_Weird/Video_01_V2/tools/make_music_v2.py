#!/usr/bin/env python3
"""Compose and render the V2 music bed (original, generated here; FluidSynth + MuseScore General SoundFont, MIT).

V2 gives the score dynamics that follow the story instead of one level throughout:
  hook      S1      tension and curiosity: minor colour, pulsing pizzicato and a ticking pulse that builds across the
                    three answers, then drops out before "None of them are right" so the stamps land in near-silence;
                    a second drop for "Very professional. Very fictional."
  title     S2      one bright hit on "sure?", then a quieter, lighter bed under the three claims, the brand sting
  explain   S3, S4  quieter: clockwork marimba for the token machine, soft guitar for the library
  evidence  S5, S7  pulls back: sparse vibes and guitar, almost nothing under the documents
  show      S6      playful: kit, brass stabs, walking bass, a turn on the rule change, a lift when the trophy walks back
  helps     S8      light, mid
  verify    S9      pulled back, a ticking mechanism pulse; drops for "Stamp it."
  payoff    S10     the takeaway builds bar by bar through SOUNDING RIGHT / BEING RIGHT, stops for the joke, then a
                    clean resolution on the end card
Narration stays dominant: everything avoids the 1–4 kHz speech band and the mix ducks it further.

Outputs: audio/music/v2/stems/<stem>.wav, audio/music/v2/music_bed.wav (48 kHz stereo, unducked), plan.json
"""
import json
import os
import random
import re
import subprocess
import tempfile

import mido
import numpy as np
import soundfile as sf
from scipy import signal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SF2 = os.environ.get('MUSIC_SOUNDFONT', '/usr/share/sounds/sf3/MuseScore_General.sf3')
OUT = os.path.join(ROOT, 'audio', 'music', 'v2')
SR = 48000
BPM = 108
BEAT = 60.0 / BPM
BAR = 4 * BEAT
TPB = 480
SEED = 20261008

CHORDS = {
    'C': [48, 55, 60, 64, 67], 'Am': [45, 52, 57, 60, 64], 'F': [41, 48, 53, 57, 60], 'G': [43, 50, 55, 59, 62],
    'Dm': [50, 57, 62, 65, 69], 'Em': [40, 47, 52, 55, 59], 'E': [40, 47, 52, 56, 59], 'Cmaj7': [48, 55, 59, 64, 67],
    'Fmaj7': [41, 48, 52, 57, 60], 'Bb': [46, 53, 58, 62, 65], 'Am7': [45, 52, 55, 60, 64], 'Dm7': [50, 57, 60, 65, 69],
}
PROG = {
    'hook': ['Am', 'F', 'Dm', 'E'],
    'title': ['C', 'Am', 'F', 'G'],
    'apparatus': ['Am', 'F', 'C', 'G'],
    'library': ['Fmaj7', 'Cmaj7', 'Dm7', 'G'],
    'evidence': ['Am7', 'Fmaj7', 'Cmaj7', 'G'],
    'show': ['C', 'F', 'G', 'C'],
    'helps': ['Dm', 'G', 'C', 'Am'],
    'verify': ['Fmaj7', 'Em', 'Dm7', 'G'],
    'payoff': ['F', 'C', 'Am', 'G'],
    'end': ['F', 'G', 'C', 'C'],
}
SECTION_OF_SCENE = {'S1': 'hook', 'S2': 'title', 'S3': 'apparatus', 'S4': 'library', 'S5': 'evidence', 'S6': 'show',
                    'S7': 'evidence', 'S8': 'helps', 'S9': 'verify', 'S10': 'payoff'}
INSTR = {'pizz': (45, 0), 'marimba': (12, 1), 'guitar': (24, 2), 'vibes': (11, 3), 'bass': (32, 4), 'clarinet': (71, 5),
         'brass': (61, 6), 'strings': (49, 7), 'drums': (0, 9)}


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


def plan(tl):
    fps = tl['fps']
    total = tl['durationInFrames'] / fps
    scenes = {s['id']: (s['from'] / fps, s['to'] / fps) for s in tl['scenes']}
    P = {
        'total': total,
        'title_hit': wt(tl, 's06', 'sure?') + 0.1,
        'sting': st(tl, 's07', 'to') + 0.33,
        'rule': wt(tl, 's25', 'costs'),
        'lucky': wt(tl, 's23', 'lands.'),
        'walk': wt(tl, 's25', 'walks'),
        'sounding': wt(tl, 's33', 'sounding'),
        'being': wt(tl, 's33', 'being'),
        'end_card': st(tl, 's36'),
        'final': st(tl, 's36', 'to'),
    }
    # silences / near-silences: the music gets out of the way of a reveal or a joke
    P['drops'] = [
        (wt(tl, 's03', 'answers.') + 0.25, wt(tl, 's03', 'Not')),                # stamps land in near-silence
        (wt(tl, 's05', 'Very') - 0.15, st(tl, 's05', 'to') + 0.3),               # Very professional. Very fictional.
        (wt(tl, 's11', 'They') - 0.2, st(tl, 's11', 'to') + 0.5),                 # they do not say which one is true
        (wt(tl, 's19', 'A') - 0.2, st(tl, 's19', 'to') + 0.8),                    # a confident font
        (wt(tl, 's24', 'Somehow,') - 0.15, st(tl, 's24', 'to') + 0.4),            # somehow, a trophy
        (wt(tl, 's32', 'Stamp') - 0.15, st(tl, 's32', 'to') + 0.4),              # stamp it
        (wt(tl, 's35', 'Works') - 0.1, st(tl, 's35', 'to') + 0.25),              # works on people, too
    ]
    nbars = int(np.ceil(total / BAR)) + 2
    bars = []
    for b in range(nbars):
        t = b * BAR + 0.5 * BAR
        sec = 'end'
        for sid, (a, z) in scenes.items():
            if a <= t < z:
                sec = SECTION_OF_SCENE[sid]
        if t >= P['end_card'] + 0.5:
            sec = 'end'
        bars.append(sec)
    P['bars'] = bars
    P['scenes'] = scenes
    return P


def in_drop(t, drops, pad=0.0):
    return any(a - pad <= t < b for a, b in drops)


def compose(P):
    rnd = random.Random(SEED)
    ev = {k: [] for k in INSTR}
    drops = P['drops']
    counters = {}
    total = P['total']
    hook_end = P['scenes']['S1'][1]
    for b, sec in enumerate(P['bars']):
        t0 = b * BAR
        if t0 > total + 1:
            break
        idx = counters.get(sec, 0)
        counters[sec] = idx + 1
        chord = CHORDS[PROG[sec][idx % 4]]
        root = chord[0]
        upper = chord[1:] + [chord[1] + 12]

        def add(inst, ts, dur, note, vel):
            if not in_drop(ts, drops, pad=0.05) and ts < total:
                ev[inst].append((ts, dur, note, vel))

        if sec == 'hook':
            # builds across the cold open: 0 → 1 over S1
            k = min(1.0, t0 / max(1.0, hook_end - 4))
            for i in range(8):  # pulsing low pizzicato eighths
                add('pizz', t0 + i * 0.5 * BEAT, 0.25 * BEAT, root + (12 if i % 4 == 3 else 0), 40 + int(14 * k) + rnd.randint(-3, 3))
            add('bass', t0, BAR * 0.9, root - 12, 46 + int(10 * k))
            for i in range(16):  # ticking closed hat, quieter at first
                if i % 2 == 0 or k > 0.5:
                    add('drums', t0 + i * 0.25 * BEAT, 0.05, 42, 18 + int(16 * k) + (6 if i % 4 == 0 else 0))
            if idx % 2 == 1:  # a curious vibes question mark every other bar
                for j, n in enumerate([upper[2] + 12, upper[1] + 12, upper[3] + 12]):
                    add('vibes', t0 + (2 + j * 0.5) * BEAT, 0.6 * BEAT, n, 36 + int(10 * k))
            if k > 0.45:
                add('strings', t0, BAR, upper[0] + 12, 26 + int(14 * k))
        elif sec == 'title':
            for i in range(8):
                if i % 2 == 1:
                    add('pizz', t0 + i * 0.5 * BEAT, 0.3 * BEAT, upper[(i // 2 + idx) % 3], 40 + rnd.randint(-4, 4))
            add('bass', t0, BEAT * 1.6, root, 50)
            add('bass', t0 + 2 * BEAT, BEAT * 1.2, root, 46)
            for i, p in enumerate([0, None, 2, None, 1, None, 3, None]):
                if p is not None:
                    add('marimba', t0 + i * 0.5 * BEAT, 0.4 * BEAT, upper[p % len(upper)] + 12, 34 + rnd.randint(-3, 3))
        elif sec == 'apparatus':
            pat = [0, 2, 1, 3, 0, 2, 1, 4, 0, 3, 2, 4, 1, 3, 0, 2]
            for i, p in enumerate(pat):
                add('marimba', t0 + i * 0.25 * BEAT, 0.2 * BEAT, upper[p % len(upper)] + 12, 34 + (6 if i % 4 == 0 else 0) + rnd.randint(-3, 3))
            add('bass', t0, BEAT * 1.6, root, 44)
            for i in range(8):
                add('drums', t0 + i * 0.5 * BEAT, 0.08, 70, 18 + (6 if i % 2 == 0 else 0))
        elif sec == 'library':
            for i, p in enumerate([0, 1, 2, 3, 2, 1]):
                add('guitar', t0 + i * (BAR / 6) + rnd.uniform(-0.005, 0.005), BAR / 6 * 1.6, upper[p % len(upper)], 40 + rnd.randint(-4, 4))
            for n in chord[1:3]:
                add('vibes', t0, BAR * 0.95, n + 12, 26)
            if idx % 2 == 1:
                for i, n in enumerate([upper[0] + 12, upper[1] + 12, upper[2] + 12, upper[1] + 12]):
                    add('clarinet', t0 + i * BEAT + 0.5 * BEAT, 0.8 * BEAT, n, 32 + rnd.randint(-3, 3))
        elif sec == 'evidence':
            for i, p in enumerate([0, None, 2, None, None, None]):
                if p is not None:
                    add('guitar', t0 + i * (BAR / 6), BAR / 6 * 2, upper[p % len(upper)], 34)
            for n in chord[1:3]:
                add('vibes', t0, BAR * 0.95, n + 12, 24)
        elif sec == 'show':
            add('bass', t0, BEAT * 0.9, root, 58)
            add('bass', t0 + BEAT, BEAT * 0.9, root + 7, 52)
            add('bass', t0 + 2 * BEAT, BEAT * 0.9, root + 12, 54)
            add('bass', t0 + 3 * BEAT, BEAT * 0.9, root + 7, 52)
            for i in range(8):
                if i % 2 == 1 or i % 4 == 0:
                    add('pizz', t0 + i * 0.5 * BEAT, 0.3 * BEAT, upper[(i // 2 + idx) % 3], 50 + rnd.randint(-5, 5))
            if idx >= 1:
                for ts in (t0 + 1.5 * BEAT, t0 + 3 * BEAT):
                    for n in chord[2:5]:
                        add('brass', ts, 0.3 * BEAT, n + 12, 48)
            for beat in range(4):
                ts = t0 + beat * BEAT
                if beat in (0, 2):
                    add('drums', ts, 0.2, 36, 54)
                if beat in (1, 3):
                    add('drums', ts, 0.2, 38, 46)
                add('drums', ts + 0.5 * BEAT, 0.1, 42, 30 + rnd.randint(-4, 4))
        elif sec == 'helps':
            for i, p in enumerate([0, None, None, 2, None, None, 1, None]):
                if p is not None:
                    add('marimba', t0 + i * 0.5 * BEAT, 0.4 * BEAT, upper[p % len(upper)] + 12, 34)
            add('bass', t0, BEAT * 1.6, root, 42)
            for n in chord[1:3]:
                add('vibes', t0, BAR * 0.95, n + 12, 22)
        elif sec == 'verify':
            for i in range(8):
                add('drums', t0 + i * 0.5 * BEAT, 0.06, 75, 22 + (8 if i % 4 == 0 else 0))  # claves: the mechanism ticking
            for n in chord[1:3]:
                add('vibes', t0, BAR * 0.95, n + 12, 24)
            if idx % 2 == 0:
                add('guitar', t0, BAR * 0.9, upper[0], 34)
        elif sec == 'payoff':
            # the takeaway builds: one more layer every bar
            layer = idx
            add('bass', t0, BEAT * 1.6, root, 44 + min(12, layer * 3))
            add('bass', t0 + 2 * BEAT, BEAT * 1.2, root, 40 + min(12, layer * 3))
            for n in chord[1:4]:
                add('guitar', t0 + 0.01 * rnd.random(), BEAT * 1.9, n, 36 + min(10, layer * 2))
                add('guitar', t0 + 2 * BEAT + 0.01 * rnd.random(), BEAT * 1.9, n, 32 + min(10, layer * 2))
            if layer >= 1:
                add('strings', t0, BAR, upper[0] + 12, 24 + min(16, layer * 4))
                add('strings', t0, BAR, upper[2] + 12, 22 + min(14, layer * 4))
            if layer >= 2:
                for i, p in enumerate([0, None, 2, None, 1, None, 3, None]):
                    if p is not None:
                        add('marimba', t0 + i * 0.5 * BEAT, 0.4 * BEAT, upper[p % len(upper)] + 12, 34 + rnd.randint(-3, 3))
            if layer >= 3:
                for beat in range(4):
                    if beat in (0, 2):
                        add('drums', t0 + beat * BEAT, 0.2, 36, 40)
                    add('drums', t0 + beat * BEAT + 0.5 * BEAT, 0.08, 70, 20)
    # ---- one-off events
    th = P['title_hit']
    for n, v in ((72, 62), (79, 54)):
        ev['vibes'].append((th, 2.2, n, v))
    for n, v in ((60, 56), (64, 52), (67, 50)):
        ev['brass'].append((th, 1.0, n, v))
    ev['drums'].append((th, 0.5, 49, 52))
    s = P['sting']  # brand sting: rising three-note figure, then a held chime
    for i, n in enumerate([72, 76, 79]):
        ev['marimba'].append((s + i * 0.16, 0.5, n, 70))
    ev['vibes'].append((s + 0.5, 1.6, 84, 56))
    ev['drums'].append((s + 0.5, 0.3, 81, 40))
    for i, n in enumerate([67, 65, 64, 62]):  # rule change: a little descending clarinet turn
        ev['clarinet'].append((P['rule'] + 0.1 + i * 0.2, 0.28, n, 48))
    for i, n in enumerate([60, 64, 67, 72]):  # the trophy walks back: a tiptoe figure
        ev['pizz'].append((P['walk'] + i * 0.18, 0.15, n, 52))
    for n in (53, 57, 60):  # SOUNDING RIGHT / BEING RIGHT: two held string chords under the two halves
        ev['strings'].append((P['sounding'], 1.6, n + 12, 40))
    for n in (55, 59, 62):
        ev['strings'].append((P['being'], 2.2, n + 12, 44))
    ec = P['end_card'] + 0.25  # end: clean resolution
    for n in (48, 55, 60, 64, 67):
        ev['guitar'].append((ec, 4.0, n, 50))
    for n, v in ((72, 44), (79, 38)):
        ev['vibes'].append((ec + 0.05, 4.0, n, v))
    for n in (60, 64, 67):  # V3: the pad rings on under the last sentence and the end card into the final fade
        ev['strings'].append((ec, P['total'] - ec, n, 34))  # (it used to stop after 5 s, leaving the end card silent)
    ev['vibes'].append((P['final'] + 0.25, 4.0, 72, 34))  # V3: one soft re-strike after the last word
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
        off = int(round(max(0.0, ts + dur) / BEAT * TPB))
        msgs.append((on, 1, mido.Message('note_on', note=int(note), velocity=int(max(1, min(127, vel))), channel=channel)))
        msgs.append((off, 0, mido.Message('note_off', note=int(note), velocity=0, channel=channel)))
    msgs.sort(key=lambda m: (m[0], m[1]))
    last = 0
    for tick, _, m in msgs:
        m.time = tick - last
        last = tick
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


def section_gain(P, n):
    """Overall level per section (dB), smoothed: explanation and evidence sit lower than the hook, show and payoff."""
    lvl = {'hook': -1.0, 'title': -3.0, 'apparatus': -5.0, 'library': -5.0, 'evidence': -1.5, 'show': -2.0, 'helps': -3.0,
           'verify': -1.0, 'payoff': -2.5, 'end': -1.5}
    g = np.zeros(n)
    for b, sec in enumerate(P['bars']):
        a = int(b * BAR * SR)
        z = min(n, int((b + 1) * BAR * SR))
        if a >= n:
            break
        g[a:z] = lvl[sec]
    # drops: -14 dB, eased in and out over 0.25 s
    for a, z in P['drops']:
        g[int(a * SR):int(z * SR)] -= 14
    k = int(0.25 * SR)
    g = np.convolve(g, np.ones(k) / k, mode='same')
    return 10 ** (g / 20)


def main():
    tl = load()
    P = plan(tl)
    ev = compose(P)
    os.makedirs(os.path.join(OUT, 'stems'), exist_ok=True)
    n = int((P['total'] + 0.5) * SR)
    gains_db = {'pizz': 0, 'marimba': 0, 'guitar': -3, 'vibes': -6, 'bass': -5, 'clarinet': -6, 'brass': -8, 'strings': -9, 'drums': -7}
    bed = np.zeros((n, 2))
    with tempfile.TemporaryDirectory() as td:
        for name, (prog, ch) in INSTR.items():
            if not ev[name]:
                continue
            mp, wp = os.path.join(td, f'{name}.mid'), os.path.join(td, f'{name}.wav')
            write_midi(ev[name], prog, ch, mp)
            render(mp, wp)
            x, sr = sf.read(wp, always_2d=True)
            assert sr == SR
            x = x[:n] if len(x) >= n else np.vstack([x, np.zeros((n - len(x), 2))])
            if name in ('vibes', 'guitar', 'clarinet', 'brass', 'strings'):
                x = hp(x, 140)
                x = peaking(x, 2500, -4.5, 0.8)
            if name in ('marimba', 'pizz'):
                x = hp(x, 180)
                x = peaking(x, 2200, -3.5, 0.9)
                x = lp(x, 9000)
            if name == 'bass':
                x = lp(x, 900)
            if name == 'drums':
                x = hp(x, 45)
                x = peaking(x, 3000, -3.5, 1.0)
            x *= 10 ** (gains_db[name] / 20)
            sf.write(os.path.join(OUT, 'stems', f'{name}.wav'), x.astype(np.float32), SR, subtype='PCM_24')
            bed += x
    bed *= section_gain(P, n)[:, None]
    fi = int(0.5 * SR)
    bed[:fi] *= np.linspace(0, 1, fi)[:, None] ** 2
    # V3: once the last word is done the end-card pad is no longer ducked, so it sits 5 dB lower from there
    h0, h1 = int((P['final'] + 0.3) * SR), int((P['final'] + 1.3) * SR)
    hold = np.ones(n)
    hold[h0:h1] = np.linspace(1, 10 ** (-5 / 20), h1 - h0)
    hold[h1:] = 10 ** (-5 / 20)
    bed *= hold[:, None]
    # the fade reaches silence on the film's last frame (it used to run 0.5 s past the end)
    fo_start, fo_end = int((P['total'] - 2.5) * SR), int(P['total'] * SR)
    if fo_end - fo_start > 0:
        bed[fo_start:fo_end] *= np.linspace(1, 0, fo_end - fo_start)[:, None] ** 1.6
        bed[fo_end:] = 0
    peak = np.max(np.abs(bed))
    if peak > 0.89:
        bed *= 0.89 / peak
    sf.write(os.path.join(OUT, 'music_bed.wav'), bed.astype(np.float32), SR, subtype='PCM_24')
    secs = {}
    for s in P['bars']:
        secs[s] = secs.get(s, 0) + 1
    json.dump({k: v for k, v in P.items() if k not in ('bars',)}, open(os.path.join(OUT, 'plan.json'), 'w'), indent=1, default=str)
    print(f"music bed {P['total']:.1f}s, bars per section {secs}, drops {[(round(a, 1), round(b, 1)) for a, b in P['drops']]}")


if __name__ == '__main__':
    main()
