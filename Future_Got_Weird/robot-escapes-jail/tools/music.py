"""Synthesised background music for the Robot Escapes Jail Short (no samples, no third-party music).

Curiosity + forward momentum, D dorian, 64 beats in exactly the film length (32.40 s -> 118.52 BPM, 16 bars of 4/4),
so the bed is periodic: every note tail, the delay and the reverb wrap from the end into the start, and the last
section is the hook's groove, so the end flows into frame 0 (bar 15's A7 resolves to bar 0's Dm9).

  beats  0-6   (0.00-3.04)   HOOK: full: kick, clap, swung shaker, staccato pulse bass, 16th pluck arpeggio, the
                             mischievous lead motif, a soft pad
  beats  6-8   (3.04-4.05)   a half-bar drop (the splash / the match cut): bass hit, shaker only
  beats  8-34  (4.05-17.21)  SNEAKY GROOVE: soft kick, rim clicks, swung shaker, a creeping chromatic pizzicato motif,
                             offbeat pluck stabs; builds from bar 6 (arp, clap)
  beats 34-36  (17.21-18.23) a breath for "How?": the pad holds, a little two-note mallet question, a swell
  beats 36-55  (18.23-27.84) SCIENCE: brighter mallet plucks an octave up with a dotted-8th ping-pong delay, long
                             round bass notes, a lighter shaker, a brighter pad (relative-major colours)
  beat  55     (27.84-28.35) pickup: a clap roll and a chromatic bass walk-up
  beats 56-64  (28.35-32.40) the HOOK GROOVE returns (bars 14-15 = the two bars before bar 0), into the loop

render(DUR, sections=None) -> dict(stems={'drums','bass','keys','lead','pad'} of (N, 2) arrays, bpm, beats, sections,
beat_s). `sections` (optional, e.g. cues.json "music"): {name: start_s} for any of hook, drop, groove, breath, science,
pickup, return (aliases: ret -> return, lab / lab_groove -> groove, transition -> drop, how -> breath); each start is
quantised to the nearest 16th of the bar grid (the tempo and the loop never change), names left out keep the V1 start.
The section events are placed relative to the section edges (drop: kick + bass hit on its first 16th, a swell that ends
on the groove's first 16th; breath: round bass on its first 16th, a swell into the science, the two-note mallet question
on its last two 8ths; pickup: the clap roll over it, the walk-up on its last four 16ths towards the return's root; the
hook's lead motif stops at the drop). With sections=None the V1 bed is reproduced sample for sample.

V2 (DIRECTION_V2, 9 Nov 2026): hook 0-3.40 (full), drop 3.40-4.0 (into the metal), lab groove 4.0-17.10, breath
17.10-17.90 ("How?"), science 17.90-27.90, pickup 27.90-28.40, return 28.40-32.40 (-> the hook)."""
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
BEATS = 64
SWING = 0.16  # off-16ths late by this fraction of a 16th (light swing)

def _sos(kind, f, o): return butter(o, f, kind, fs=SR, output='sos')
def lp(x, f, o=2): return sosfilt(_sos('lowpass', min(f, 0.45 * SR), o), x, axis=0)
def hp(x, f, o=2): return sosfilt(_sos('highpass', f, o), x, axis=0)
def bp(x, lo, hi, o=2): return sosfilt(_sos('bandpass', [lo, hi], o), x, axis=0)
def circ(fn, x): return fn(np.concatenate([x, x, x]))[2 * len(x):]
def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)
def ns(d): return max(1, int(round(d * SR)))
def tt(n): return np.arange(n) / SR
def env_ad(n, att, tau, rel=0.01):
    t = tt(n); e = (1 - np.exp(-t / max(att, 1e-5))) * np.exp(-t / tau)
    nr = min(n, ns(rel)); e[n - nr:] *= np.linspace(1, 0, nr)
    return e

# ---------------------------------------------------------------- chords (D dorian), one per bar
CH = {
    'Dm9':    dict(root=38, triad=[50, 53, 57], tones=[62, 65, 69, 72, 76]),
    'G13':    dict(root=43, triad=[55, 59, 62], tones=[59, 62, 65, 67, 71]),
    'Bbmaj7': dict(root=46, triad=[46, 50, 53], tones=[58, 62, 65, 69, 72]),
    'A7':     dict(root=45, triad=[45, 49, 52], tones=[61, 64, 67, 69, 73]),
    'Fmaj7':  dict(root=41, triad=[53, 57, 60], tones=[65, 69, 72, 76, 79]),
    'Cadd9':  dict(root=36, triad=[48, 52, 55], tones=[64, 67, 72, 74, 79]),
    'Am7':    dict(root=45, triad=[45, 48, 52], tones=[64, 67, 69, 72, 76]),
    'Gm7':    dict(root=43, triad=[55, 58, 62], tones=[62, 65, 67, 70, 74]),
}
BARS = ['Dm9', 'G13', 'Dm9', 'G13', 'Bbmaj7', 'A7', 'Dm9', 'G13', 'Bbmaj7', 'Fmaj7', 'Cadd9', 'Bbmaj7', 'Am7', 'Gm7', 'Dm9', 'A7']
SECTIONS = [('hook', 0, 6), ('drop', 6, 8), ('groove', 8, 34), ('breath', 34, 36), ('science', 36, 55), ('pickup', 55, 56), ('return', 56, 64)]

SECTION_NAMES = [n_ for n_, _, _ in SECTIONS]
SECTION_ALIASES = {'ret': 'return', 'lab': 'groove', 'lab_groove': 'groove', 'transition': 'drop', 'how': 'breath'}

def section_of(step, spans=None):
    """the section a 16th step is in; spans: [(name, a16, e16)] (None: the V1 sections)"""
    if spans is None:
        b = step / 4
        for name, a, e in SECTIONS:
            if a <= b < e: return name
        return 'return'
    for name, a, e in spans:
        if a <= step < e: return name
    return 'return'

def section_spans(DUR, sections=None):
    """[(name, a16, e16)] in 16th steps: the V1 sections, or `sections` {name: start_s} quantised to the 16th grid
    (names left out keep their V1 start); the starts must be in the V1 order (a zero-length section is skipped)"""
    starts = {n_: a * 4 for n_, a, _ in SECTIONS}
    if sections:
        s16 = DUR / BEATS / 4
        for k, v in sections.items():
            n_ = SECTION_ALIASES.get(k, k)
            if n_ not in starts: raise ValueError(f'music section {k!r}: not one of {SECTION_NAMES} (or {list(SECTION_ALIASES)})')
            starts[n_] = int(round(float(v) / s16))
    a16 = [starts[n_] for n_ in SECTION_NAMES]
    if a16[0] != 0: raise ValueError(f'music: the hook must start at 0 (got {a16[0]} 16ths)')
    if any(b < a for a, b in zip(a16, a16[1:])) or a16[-1] > BEATS * 4:
        raise ValueError(f'music sections out of order: {dict(zip(SECTION_NAMES, a16))} (16ths)')
    return [(n_, a, e) for n_, a, e in zip(SECTION_NAMES, a16, a16[1:] + [BEATS * 4])]

# the hook's lead motif: (16th step in bar, midi, length in 16ths, velocity)
LEAD = {
    'A':  [(0, 74, 2, 1.0), (3, 77, 1, 0.7), (4, 81, 2, 0.9), (6, 79, 1, 0.6), (7, 77, 1, 0.7), (8, 76, 2, 0.85),
           (10, 77, 1, 0.6), (11, 74, 2, 0.8), (14, 71, 1, 0.6), (15, 72, 1, 0.65)],
    'B':  [(0, 74, 2, 0.95), (2, 71, 1, 0.6), (3, 74, 1, 0.65), (4, 79, 3, 0.9), (8, 77, 1, 0.7), (9, 76, 1, 0.65),
           (10, 74, 2, 0.8), (12, 71, 1, 0.6), (14, 69, 2, 0.75)],
    'B7': [(0, 76, 2, 0.95), (3, 73, 1, 0.65), (4, 76, 1, 0.7), (6, 79, 2, 0.85), (8, 76, 1, 0.7), (9, 73, 1, 0.65),
           (10, 69, 2, 0.8), (12, 73, 1, 0.65), (14, 76, 1, 0.7), (15, 77, 1, 0.6)],
}
LEAD_BAR = {0: 'A', 1: 'B', 14: 'A', 15: 'B7'}


def render(DUR, seed=4242, sections=None):
    rng = np.random.default_rng(seed)
    N = int(round(DUR * SR))
    beat = DUR / BEATS
    s16 = beat / 4
    spans = section_spans(DUR, sections)
    SP = {n_: (a, e) for n_, a, e in spans}
    d0, g0 = SP['drop'][0], SP['groove'][0]           # drop: its first 16th, and where it ends (the groove)
    b0, b1 = SP['breath']                             # breath
    p0, r0 = SP['pickup']                             # pickup .. the return
    sw_drop = max(d0 + 1, g0 - 4)                     # the drop's swell ends on the groove's first 16th (V1: 28)
    sw_breath = max(b0 + 1, b1 - 6)                   # the breath's swell ends on the science's first 16th (V1: 138)
    q2 = b1 - 1 if (b1 - 1) % 2 == 0 else b1 - 2      # the mallet question: the breath's last two 8ths (V1: 140, 142)
    question = [q for q in (q2 - 2, q2) if q >= b0]
    L_pick = r0 - p0
    walk_to = CH[BARS[(r0 // 16) % 16]]['root'] + 12  # the pickup's bass walks up to the return's root (V1: 45 45 47 49 -> D)
    walk = [walk_to - 5, walk_to - 5, walk_to - 3, walk_to - 1]
    def sec_of(step): return section_of(step, spans)
    stems = {k: np.zeros((N, 2)) for k in ('drums', 'bass', 'keys', 'lead', 'pad')}
    sends = np.zeros((N, 2))      # to the plate
    delay_in = np.zeros((N, 2))   # science plucks' ping-pong delay
    kick_trig = np.zeros(N)

    def t_of(step, swing=True):
        return step * s16 + (SWING * s16 if swing and step % 2 == 1 else 0.0)

    def put(bus, x, at, p=0.0, g=1.0, verb=0.0, dly=0.0):
        i0 = int(round(at * SR)) % N
        idx = (np.arange(len(x)) + i0) % N
        pp = float(np.clip(p, -1, 1))
        gl = 1.0 if pp <= 0 else np.cos(pp * np.pi / 2); gr = 1.0 if pp >= 0 else np.cos(-pp * np.pi / 2)
        y = x * g
        stems[bus][idx, 0] += y * gl; stems[bus][idx, 1] += y * gr
        if verb: sends[idx, 0] += y * gl * verb; sends[idx, 1] += y * gr * verb
        if dly: delay_in[idx, 0] += y * gl * dly; delay_in[idx, 1] += y * gr * dly

    # ------------------------------------------------ instruments (mono, cached)
    cache = {}
    def cached(key, fn):
        if key not in cache: cache[key] = fn()
        return cache[key]

    def kick(v=1.0):
        def mk():
            n = ns(0.32); t = tt(n)
            f = 46 + 64 * np.exp(-t / 0.035)
            x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(n, 0.001, 0.13, 0.03)
            cl = hp(rng.standard_normal(n), 2500) * env_ad(n, 0.0002, 0.002) * 0.18
            return lp(x + cl, 4000)
        return cached('kick', mk) * v

    def clap(v=1.0):
        def mk():
            n = ns(0.22); x = np.zeros(n); src = bp(rng.standard_normal(n), 900, 4200)
            for k, (at, a) in enumerate([(0.0, 0.7), (0.009, 0.8), (0.018, 1.0)]):
                i = ns(at); m = n - i
                x[i:] += src[i:] * env_ad(m, 0.0004, 0.006 if k < 2 else 0.055) * a
            return x
        return cached('clap', mk) * v

    def rim(v=1.0):
        def mk():
            n = ns(0.08); t = tt(n)
            x = np.sin(2 * np.pi * 1850 * t) * env_ad(n, 0.0003, 0.012) + 0.6 * bp(rng.standard_normal(n), 2500, 7000) * env_ad(n, 0.0002, 0.003)
            return x
        return cached('rim', mk) * v

    def shaker(v=1.0, k=0):
        def mk():
            n = ns(0.09)
            return bp(rng.standard_normal(n), 5000, 12000) * env_ad(n, 0.006 + 0.002 * k, 0.03)
        return cached(('shk', k % 3), mk) * v

    def ohat(v=1.0):
        def mk():
            n = ns(0.3)
            return hp(rng.standard_normal(n), 7000, 4) * env_ad(n, 0.001, 0.09)
        return cached('ohat', mk) * v

    def swell(dur):
        def mk():
            n = ns(dur); u = np.arange(n) / n
            return bp(rng.standard_normal(n), 2500, 11000) * u ** 3 * (1 - np.clip((u - 0.97) / 0.03, 0, 1))
        return cached(('swell', dur), mk)

    def bass(m, length, kind='pulse'):
        def mk():
            n = ns(length + 0.05); t = tt(n); f = mtof(m)
            ph = 2 * np.pi * f * t
            if kind == 'pulse':
                x = np.tanh(1.6 * (np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)))
                e = env_ad(n, 0.003, 0.22) * np.clip((length + 0.04 - t) / 0.04, 0, 1)
                return lp(x * e, 900)
            x = np.sin(ph) + 0.15 * np.sin(2 * ph)  # round (science)
            e = (1 - np.exp(-t / 0.01)) * np.exp(-t / 0.9) * np.clip((length + 0.04 - t) / 0.06, 0, 1)
            return lp(x * e, 600)
        return cached(('bass', m, round(length, 3), kind), mk)

    def pluck(m, length, bright=1.0, tau=0.22):
        """additive pluck: higher harmonics die faster; a hair of detune for width"""
        def mk():
            n = ns(length + tau * 2.5); t = tt(n); f = mtof(m); x = np.zeros(n)
            for k in range(1, 12):
                if k * f > 9000: break
                x += np.sin(2 * np.pi * f * k * t * (1 + 0.0007 * (k % 3))) / k ** 1.15 * np.exp(-t * (1 + bright * 0.9 * (k - 1)) / tau)
            x *= (1 - np.exp(-t / 0.002))
            return x * np.clip((length + tau * 2.5 - t) / 0.02, 0, 1)
        return cached(('pl', m, round(length, 3), bright, tau), mk)

    def mallet(m, tau=0.35):
        """marimba-ish: fundamental + the 4th partial (tuned bar), quick attack"""
        def mk():
            n = ns(tau * 4); t = tt(n); f = mtof(m)
            x = np.sin(2 * np.pi * f * t) * np.exp(-t / tau) + 0.35 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t / (tau * 0.18)) \
                + 0.12 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t / 0.01)
            return x * (1 - np.exp(-t / 0.0012))
        return cached(('ml', m, tau), mk)

    def pizz(m):
        def mk():
            n = ns(0.3); t = tt(n); f = mtof(m); x = np.zeros(n)
            for k in range(1, 9):
                x += np.sin(2 * np.pi * f * k * t) / k ** 1.3 * np.exp(-t * (1 + 1.4 * (k - 1)) / 0.13)
            return lp(x * (1 - np.exp(-t / 0.0015)), 2600)
        return cached(('pz', m), mk)

    def lead_note(m, length):
        def mk():
            n = ns(length + 0.25); t = tt(n); f = mtof(m)
            vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t) * np.clip((t - 0.08) / 0.1, 0, 1)
            ph = 2 * np.pi * np.cumsum(f * vib) / SR
            x = np.sin(ph) + 0.28 * np.sin(3 * ph) + 0.12 * np.sin(5 * ph) + 0.06 * np.sin(7 * ph)
            e = (1 - np.exp(-t / 0.003)) * np.exp(-t / 0.28) * np.clip((length + 0.06 - t) / 0.06, 0, 1)
            return lp(x * e, 3800)
        return cached(('ld', m, round(length, 3)), mk)

    def pad_chord(tones, length, bright):
        def mk():
            n = ns(length + 0.6); t = tt(n); x = np.zeros(n)
            for m in tones:
                for d in (-0.006, 0.0, 0.0065):
                    f = mtof(m) * (1 + d)
                    for k in range(1, 9):
                        x += np.sin(2 * np.pi * f * k * t + k * d * 300) / k ** 1.4 / 3
            e = np.clip(t / 0.35, 0, 1) ** 1.5 * np.clip((length + 0.55 - t) / 0.55, 0, 1)
            return lp(x * e, 900 + 900 * bright)
        return cached(('pad', tuple(tones), round(length, 3), bright), mk)

    # ------------------------------------------------ the score, 16th by 16th
    total16 = BEATS * 4
    for step in range(total16):
        bar, s = divmod(step, 16)
        sec = sec_of(step)
        ch = CH[BARS[bar]]; nxt = CH[BARS[(bar + 1) % 16]]
        at = t_of(step)
        r = ch['root']
        # drums
        if sec in ('hook', 'return'):
            if s in (0, 6, 8): put('drums', kick(1.0 if s != 6 else 0.75), t_of(step, False)); kick_trig[int(at * SR) % N] = 1
            if s in (4, 12): put('drums', clap(0.8), at, 0.05, verb=0.25)
            put('drums', shaker(0.55 if s % 4 == 2 else 0.32, s), at, 0.25)
            if s == 14: put('drums', ohat(0.25), at, -0.2, verb=0.15)
        elif sec == 'drop':
            if step == d0: at0 = t_of(step, False); put('drums', kick(0.8), at0); kick_trig[int(at0 * SR) % N] = 1
            put('drums', shaker(0.3 if s % 4 == 2 else 0.18, s), at, 0.25)
            if step == sw_drop: put('drums', swell(beat * ((g0 - sw_drop) / 4)), t_of(step, False), -0.1, 0.25)
        elif sec == 'groove':
            if s in (0, 10): put('drums', kick(0.8), t_of(step, False)); kick_trig[int(at * SR) % N] = 1
            if s in (4, 12): put('drums', rim(0.55), at, -0.15, verb=0.2)
            if bar >= 6 and s == 12: put('drums', clap(0.45), at, 0.05, verb=0.25)
            put('drums', shaker(0.42 if s % 4 == 2 else 0.22, s), at, 0.25)
        elif sec == 'breath':
            if step == sw_breath: put('drums', swell(beat * ((b1 - sw_breath) / 4)), t_of(step, False), 0.1, 0.3)
        elif sec == 'science':
            if s % 2 == 0: put('drums', shaker(0.32 if s % 4 == 2 else 0.2, s), at, 0.3)
            if bar >= 11 and s == 0: put('drums', kick(0.6), t_of(step, False)); kick_trig[int(at * SR) % N] = 1
            if s in (4, 12): put('drums', rim(0.3), at, -0.2, verb=0.25)
        elif sec == 'pickup':
            put('drums', clap(0.25 + 0.15 * (step - p0) * (3 / (L_pick - 1)) if L_pick > 1 else 0.7), at, 0.05, verb=0.2)
            put('drums', shaker(0.35, s), at, 0.25)
        # bass
        if sec in ('hook', 'return'):
            if s % 2 == 0:
                iv = [0, 0, 12, 0, 7, 0, 12, 7][s // 2]
                put('bass', bass(r + iv, s16 * 1.6), at, g=0.95 if s % 4 == 0 else 0.8)
            if s in (3, 11): put('bass', bass(r, s16 * 0.8), at, g=0.4)
        elif sec == 'drop':
            if step == d0: put('bass', bass(r, beat * 1.2), t_of(step, False))
        elif sec == 'groove':
            pat = {0: (0, 1.8, 0.95), 3: (0, 0.9, 0.55), 6: (7, 1.2, 0.75), 8: (12, 1.0, 0.65), 11: (7, 0.9, 0.55)}
            if s in pat:
                iv, ln, v = pat[s]; put('bass', bass(r + iv, s16 * ln), at, g=v)
            if s == 14:
                nr_ = nxt['root']; ap = nr_ - 1 if abs(nr_ - 1 - r) <= 7 else nr_ + 1
                put('bass', bass(ap, s16 * 1.4), at, g=0.6)
        elif sec == 'breath':
            if step == b0: put('bass', bass(r, beat * 1.8, 'round'), t_of(step, False), g=0.7)
        elif sec == 'science':
            if s in (0, 8): put('bass', bass(r if s == 0 else r + 7, s16 * 7.5, 'round'), t_of(step, False), g=0.55 if s == 0 else 0.4)
        elif sec == 'pickup':
            k_ = step - p0 - (L_pick - 4)
            if k_ >= 0: put('bass', bass(walk[k_], s16 * 0.9), at, g=0.75)
        # keys
        tones = ch['tones']
        if sec in ('hook', 'return'):
            idx = [0, 1, 2, 3, 4, 3, 2, 1, 0, 2, 4, 2, 3, 1, 2, 4][s]
            put('keys', pluck(tones[idx], s16 * 0.7, 1.0, 0.16), at, 0.35 if s % 2 else -0.35, 0.5 if s % 4 == 0 else 0.36, verb=0.25)
        elif sec == 'groove':
            if s in (2, 10):
                for j, m in enumerate(tones[:3]):
                    put('keys', pluck(m, s16 * 0.6, 1.2, 0.12), at + 0.004 * j, -0.25 + 0.25 * j, 0.24, verb=0.3)
            if bar >= 6:
                idx = [0, 2, 4, 2][s % 4]
                put('keys', pluck(tones[idx] + 12, s16 * 0.5, 1.4, 0.1), at, 0.4 if s % 2 else -0.4, 0.13, verb=0.3)
            # the sneaky creeping pizzicato motif
            t0, t1, t2 = ch['triad']
            mot = {0: (t0, 0.9), 2: (t1, 0.6), 4: (t2 - 2, 0.65), 5: (t2 - 1, 0.6), 6: (t2, 0.85), 10: (t1, 0.55), 12: (t0, 0.7)}
            if s in mot:
                m, v = mot[s]; put('lead', pizz(m), at, -0.12, 0.55 * v, verb=0.2)
            if s == 14:
                nt = nxt['triad'][0]; ap = nt - 1 if abs(nt - 1 - t0) <= 8 else nt + 1
                put('lead', pizz(ap), at, -0.12, 0.38, verb=0.2)
        elif sec == 'breath':
            if step in question:
                first = step == question[0] and len(question) == 2
                put('keys', mallet(81 if first else 88, 0.4), at, -0.2 if first else 0.25, 0.42, verb=0.45, dly=0.3)
        elif sec == 'science':
            idx = [0, 1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 1, 2, 3, 4][s]
            v = 0.42 if s % 4 == 0 else (0.3 if s % 2 == 0 else 0.22)
            put('keys', mallet(tones[idx] + 12, 0.22), at, 0.3 if s % 2 else -0.3, v, verb=0.3, dly=0.35)
        # lead motif (hook and return)
        if sec in ('hook', 'return') and bar in LEAD_BAR:
            for st, m, ln, v in LEAD[LEAD_BAR[bar]]:
                if st == s and (sec == 'return' or step < d0):
                    put('lead', lead_note(m, s16 * ln * 0.85), at, -0.08, 0.5 * v, verb=0.3, dly=0.12)
        # pad: one chord per bar (a held chord across the breath)
        if s == 0:
            secs = {sec_of(step + k) for k in range(16)}
            if 'science' in secs and bar >= 9:
                put('pad', pad_chord(tones[:4], 16 * s16, 1.0), at, 0.0, 0.2, verb=0.4)
            elif bar == 8:
                put('pad', pad_chord(tones[:4], 16 * s16, 0.5), at, 0.0, 0.16, verb=0.4)
            elif 'hook' in secs or 'return' in secs:
                put('pad', pad_chord(tones[:4], 16 * s16, 0.3), at, 0.0, 0.13, verb=0.4)
            else:
                put('pad', pad_chord(tones[:4], 16 * s16, 0.2), at, 0.0, 0.09, verb=0.4)

    # ------------------------------------------------ ping-pong delay (dotted 8th), circular
    d = int(round(3 * s16 * SR))
    dl = np.zeros((N, 2)); fb = 0.38; src = delay_in.copy()
    for k in range(1, 6):
        src = np.roll(src, d, axis=0)[:, ::-1] * (fb if k > 1 else 0.5)  # alternate sides each repeat
        dl += src
    dl = circ(lambda y: lp(hp(y, 400), 4500), dl)
    stems['keys'] += dl * 0.8
    sends += dl * 0.2

    # ------------------------------------------------ the kick pumps the bass and pad a little (sidechain)
    kenv = np.convolve(np.concatenate([kick_trig[-ns(0.3):], kick_trig]),
                       np.exp(-np.arange(ns(0.25)) / (0.07 * SR)), 'full')[ns(0.3):ns(0.3) + N]
    kenv = circ(lambda y: lp(y, 30), kenv)
    pump = 1 - 0.3 * np.clip(kenv, 0, 1)
    stems['bass'] *= pump[:, None]; stems['pad'] *= pump[:, None]

    # ------------------------------------------------ the plate (circular convolution, so the tail wraps into the start)
    n_ir = ns(1.6); t = tt(n_ir)
    ir = np.zeros((N, 2))
    for c in range(2):
        nz = rng.standard_normal(n_ir)
        lo_ = lp(nz, 1800) * np.exp(-t / (1.3 / 6.9)); hi_ = hp(nz, 1800) * np.exp(-t / (0.6 / 6.9))
        x = (lo_ + 0.5 * hi_) * np.clip(t / 0.01, 0, 1)
        x[:ns(0.012)] = 0  # pre-delay
        ir[:n_ir, c] = x / np.sqrt(np.sum(x ** 2))
    wet = np.fft.irfft(np.fft.rfft(sends, axis=0) * np.fft.rfft(ir, axis=0), N, axis=0)
    wet = circ(lambda y: hp(y, 250), wet)
    stems['pad'] += wet * 0.55  # the reverb return rides with the pad stem
    stems['bass'] *= 0.7  # leave the low end light: the bed is levelled by loudness, phones barely reproduce < 120 Hz
    for k in stems:
        stems[k] = circ(lambda y: hp(y, 28), stems[k])
    return dict(stems=stems, bpm=round(60 * BEATS / DUR, 4), beats=BEATS, beat_s=beat,
                sections=[dict(name=n_, beats=[a // 4 if a % 4 == 0 else a / 4, e // 4 if e % 4 == 0 else e / 4],
                               t=[round(a / 4 * beat, 3), round(e / 4 * beat, 3)]) for n_, a, e in spans],
                sections_requested=sections or None,
                bars=BARS)
