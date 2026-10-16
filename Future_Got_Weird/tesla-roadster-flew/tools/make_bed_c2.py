#!/usr/bin/env python3
"""Companion v2 sound bed: the channel's in-house procedural score (the robots video's synth instruments and groove,
re-timed to this cut) plus original effects (tools/sfxlib.py), with the music ducked under every narration word.
Real event sound for the hop and the 0-60 runs is mixed in the edit (Remotion, ducked the same way); this bed adds the
later launch's blast at real speed under its half-speed picture. Output: source/public/companion2/bed.wav
Section times mirror source/src/companion2/*.tsx (cues from source/src/data/companion2_words.json)."""
import json, os, subprocess, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ROBOTS = os.path.join(ROOT, '..', 'they-trained-robots-to-destroy-themselves', 'tools')
sys.path.insert(0, ROBOTS); sys.path.insert(0, os.path.join(ROBOTS, 'v2')); sys.path.insert(0, os.path.join(ROBOTS, 'v6'))
import synth_audio as v1  # noqa: E402
import synth_audio_v2 as v2  # noqa: E402
from synth_score_v6 import groove, CH, ROOT_ as ROOTS, BAR, BEAT  # noqa: E402
sys.path.insert(0, HERE)
from sfxlib import SR, blip, hiss, hum, place as _place, thunk, tick, whoosh  # noqa: E402

assert SR == v1.SR == 48000
words = json.load(open(os.path.join(ROOT, 'source/src/data/companion2_words.json')))['words']
norm = lambda s: s.rstrip('.,?!…').lower()
def cue(w, p=None, n=0, end=False):
    hits = [x for x in words if norm(x['w']) == w.lower() and (p is None or x['p'] == p)]
    return hits[n]['e' if end else 's']

TOTAL = 200.5
riser, thump = v2.riser, v2.thump
music = np.zeros((int((TOTAL + 3) * SR), 2))
sfx = np.zeros_like(music)
def mplace(x, t, g, pan=0.0): v1.place(music, x, t, g, pan)
def splace(x, t, gdb, pan=0.0): _place(sfx, x, t, gdb, pan)

# ---------------- section times (as in the TSX)
OPEN_CUT = cue('those', 'P4') - 0.1
MATCH = 12.95
ASIDE0, ASIDE1 = 65.55, 74.4
LEAVES = cue('leaves', 'P10'); T_LIP = LEAVES + 0.35
RUN2 = 80.6; TANK = 85.05; FLOAT = 91.0; THRUST = 98.6
VEC0, VEC_RUN2, STUNT0, HOP_SIDE, PERF0, OVERHEAD, LIVE, LIVE_SLOW, VERS0, LIM0, END0 = 114.6, 119.24, 123.9, 129.4, 131.6, 138.0, 143.5, 146.3, 150.7, 173.2, 186.73
END_FRONT = 197.1

# ---------------- music
D = 73.42
# hook: drone + a light marimba ostinato over the aerial run, a riser into the landing, a low hit on touchdown
tt = v1.T(OPEN_CUT + 0.5)
drone = (np.sin(2 * np.pi * D * tt) + 0.5 * np.sin(2 * np.pi * D * 1.5 * tt * 1.002) + 0.3 * np.sin(2 * np.pi * D * 2.01 * tt)) * (0.8 + 0.2 * np.sin(2 * np.pi * tt / 2.7))
mplace(drone * np.clip(tt / 0.6, 0, 1) * np.clip((OPEN_CUT + 0.5 - tt) / 0.8, 0, 1), 0, 0.16)
t, k = 0.2, 0
while t < 7.6:
    mplace(v1.marimba([293.66, 440.0, 369.99, 440.0][k % 4], 0.5), t, 0.05, pan=(-0.3 if k % 2 else 0.3))
    t += BEAT / 2; k += 1
mplace(riser(1.3), 6.6, 0.035)
mplace(thump(40, 1.0), 7.88, 0.45)
# composite: a held pad, a short riser into the match, one pluck on it
mplace(v1.pad(CH[0], MATCH - OPEN_CUT + 0.8, 0.6, 0.6), OPEN_CUT, 0.016)
mplace(riser(0.8), MATCH - 0.8, 0.03)
mplace(v1.pluck(587.33, 0.9), MATCH, 0.08)
# pressure: the curious pluck groove
groove(music, MATCH + 0.6, ASIDE0, 'pluck', fade_in=2.5, gain=0.85)
# aside: brighter marimba, a whole step up
groove(music, ASIDE0, ASIDE1 - 0.2, 'marimba', fade_in=0.0, transpose=2 ** (2 / 12), gain=0.9)
# back to the ramp, thin; the groove holds its breath when the car leaves the lip, a riser to the real footage
groove(music, ASIDE1, T_LIP, 'pluck', fade_in=0.0, thin=True, gain=0.8)
mplace(riser(RUN2 - T_LIP - 0.2), T_LIP + 0.2, 0.035)
mplace(thump(42, 1.2), RUN2 - 0.02, 0.5)
# gas thrust: darker groove, lighter under the analogy, marimba under the diagram
groove(music, RUN2 + 0.4, FLOAT, 'dark', fade_in=1.5, gain=0.85)
groove(music, FLOAT, THRUST, 'pluck', fade_in=0.0, thin=True, gain=0.8)
groove(music, THRUST, VEC0, 'marimba', fade_in=0.5, gain=0.85)
# footage vectors: sparse pad
t, bi = VEC0, 0
while t < STUNT0 - 0.5:
    ch = CH[bi % 4]
    mplace(v1.pad(ch, BAR + 1.0, 1.0, 1.2), t, 0.013)
    mplace(v1.bass(ROOTS[bi % 4], 2.0), t, 0.13)
    t += BAR; bi += 1
# stunt: a riser into the lift-off, then the real sound alone
mplace(riser(1.6), STUNT0 + 1.4, 0.03)
# performance: dark groove
groove(music, PERF0, VERS0, 'dark', fade_in=0.8, gain=0.8)
mplace(thump(40, 1.0), LIVE_SLOW + 0.44, 0.35)
# versions: lush pluck groove
groove(music, VERS0 + 0.2, LIM0, 'pluck', fade_in=1.0, lush=True, gain=0.85)
# limits: a sparse, questioning pad
t, bi = LIM0, 0
while t < END0 - 0.4:
    ch = CH[[0, 2, 1, 3][bi % 4]]
    mplace(v1.pad(ch, BAR + 1.0, 1.0, 1.2), t, 0.014)
    mplace(v1.pluck(ch[3] * 2, 0.9, 0.7), t + 1.2, 0.05, pan=0.3)
    mplace(v1.bass([D, 49.0, 61.74, 55.0][bi % 4], 2.0), t, 0.13)
    t += BAR; bi += 1
# ending: the D-major resolution swelling under the answer, landing on "didn't show that", ringing out
last = cue('that', 'P22', 0, True)
mplace(v1.pad((146.83, 220.0, 293.66, 369.99, 440.0), TOTAL - END0 + 0.4, 1.4, 1.2), END0, 0.017)
mplace(v1.bass(D, TOTAL - END0), END0 + 0.1, 0.14)
for k, f in enumerate([293.66, 369.99, 440.0]):
    mplace(v1.piano(f, 3.0), cue('gas', 'P22') + k * 0.02, 0.07)
mplace(v1.piano(587.33, 2.5), last + 0.15, 0.07)
# small room reverb, as in the robots score
from scipy.signal import fftconvolve  # noqa: E402
rng = np.random.default_rng(1015)
ir_t = v1.T(1.4)
ir = rng.standard_normal((len(ir_t), 2)) * np.exp(-ir_t / 0.4)[:, None]
ir[:, 0] = v1.lp(ir[:, 0], 5000); ir[:, 1] = v1.lp(ir[:, 1], 5000)
wet = np.stack([fftconvolve(music[:, c], ir[:, c])[: len(music)] for c in range(2)], axis=1)
music = music + 0.16 * wet / (np.max(np.abs(wet)) + 1e-9) * np.max(np.abs(music))
music = music / (np.max(np.abs(music)) + 1e-9) * 10 ** (-6 / 20)
# the stunt: the score steps aside for the real event sound
def gain_env(points):
    tt = np.arange(len(music)) / SR
    return np.interp(tt, [p[0] for p in points], [p[1] for p in points])
music *= gain_env([(0, 1), (STUNT0 + 2.8, 1), (STUNT0 + 3.1, 0.12), (HOP_SIDE + 2.0, 0.12), (PERF0 + 0.4, 1), (TOTAL - 1.0, 1), (TOTAL, 0), (TOTAL + 3, 0)])[:, None]
# duck under every word (fast attack, slower release): about -8 dB while speaking
speech = np.zeros(len(music))
for w in words:
    speech[int((w['s'] - 0.06) * SR):int((w['e'] + 0.06) * SR)] = 1
win = int(0.25 * SR)
sm = np.clip(np.convolve(speech, np.ones(win) / win, 'same') * 1.6, 0, 1)
music *= 0.42 * (1 - 0.82 * sm)[:, None]       # score about -7.5 dB overall, a further -15 dB under the voice

# ---------------- effects
splace(whoosh(0.5), 0.0, -27, 0.1)
splace(whoosh(0.45), 1.45, -25, -0.2)                       # leaves the ramp
for tb, pan in [(2.9, -0.3), (4.3, 0.3), (5.6, -0.2), (6.6, 0.2), (7.3, 0)]:   # visible gas bursts
    splace(hiss(0.6), tb, -31, pan)
splace(thunk(), 7.88, -22); splace(hiss(1.2), 7.95, -30)    # touchdown into smoke
splace(whoosh(0.35), OPEN_CUT - 0.1, -29)
splace(blip(587.33, 0.3), MATCH + 0.05, -32)
splace(tick(), cue('gravity', 'P5') + 0.1, -30)
splace(hiss(1.6), cue('air', 'P5', 0) - 0.2, -38)
fans = cue('fans', 'P5')
splace(hum(9.0, 140), fans - 0.1, -39)
splace(hiss(2.0), fans + 0.3, -36, 0.3)
splace(blip(523.25, 0.2), cue('thin', 'P5'), -31)
splace(blip(392.0, 0.25), cue('weakly', 'P5'), -31)
splace(thunk(), cue('presses', 'P5', 1) + 0.05, -24)
for wd in ('floor', 'wall', 'ceiling'):
    splace(tick(), cue(wd, 'P6'), -30)
b = cue('bump', 'P7')
splace(thunk(), b, -28); splace(thunk(), b + 0.18, -31)
splace(blip(659.25, 0.2), cue('two', 'P8'), -31)
splace(whoosh(0.45), ASIDE0 - 0.1, -27)
splace(whoosh(0.9), ASIDE0 + 0.6, -25, -0.4)                # the fan car arrives
splace(hum(5.5, 210), ASIDE0 + 1.6, -40, -0.2)
for i, tp in enumerate([cue('rivals', 'P9') - 0.1, cue('rivals', 'P9') + 0.1]):
    splace(blip(600 + 120 * i, 0.15), tp, -29, -0.3 + 0.4 * i)
pushed = cue('pushed', 'P9')
splace(thunk(), pushed - 0.02, -24, 0.3)
splace(whoosh(0.8), pushed + 0.3, -29, -0.5)
splace(whoosh(0.4), ASIDE1 - 0.1, -28)
splace(hum(1.6, 120), LEAVES - 1.3, -36)                    # drives to the lip
splace(whoosh(0.6), T_LIP - 0.1, -24)
splace(hiss(1.4), cue('rushes', 'P10') - 0.15, -27)          # air rushes back in
splace(whoosh(0.35), TANK - 0.1, -29)
comp = cue('compressed', 'P11')
splace(tick(), comp - 0.05, -27); splace(hiss(2.4), comp + 0.05, -34, 0.4)
splace(blip(392.0, 0.2), cue('fuel', 'P11'), -30); splace(blip(349.23, 0.2), cue('flame', 'P11'), -30)
splace(whoosh(0.4), FLOAT - 0.1, -28)
for th in (cue('way', 'P12', 0) - 0.05, cue('move', 'P12') - 0.25):
    splace(whoosh(0.5), th, -25, 0.4)
splace(whoosh(0.4), THRUST - 0.1, -28)
# jets in the rear-view diagram: same windows as ThrustDiagram.tsx
push = cue('push', 'P13'); fire1 = cue('fire', 'P13', 0); fire2 = cue('fire', 'P13', 1)
c1s, c2s, f0 = push + 0.25, fire1 + 0.15, fire2 + 0.2
splace(hiss(cue('opposite', 'P13', 0) + 0.25 - cue('gas', 'P13') - 0.15), cue('gas', 'P13') + 0.15, -29, -0.5)
splace(hiss(1.6), c1s, -33, -0.4); splace(hiss(1.6), c1s, -33, 0.4)
splace(hiss(1.6), c2s, -33, -0.4); splace(hiss(1.6), c2s, -33, 0.4)
splace(hiss(cue('fall', 'P13', 0, True) + 0.3 - f0), f0, -33)
splace(whoosh(0.35), VEC0 - 0.1, -29)
splace(hiss(1.7), VEC_RUN2 + 1.4, -31)                       # downward plumes, half speed
splace(whoosh(0.4), PERF0 - 0.1, -30)
splace(thunk(), cue('zero', 'P19') - 0.02, -27)
splace(whoosh(0.5), VERS0 - 0.1, -27)
for wd in ('suction', 'back', 'around'):
    splace(blip(523.25, 0.2), cue(wd, 'P20'), -31)
splace(blip(698.46, 0.25), cue('flight', 'P20'), -30)
splace(tick(), cue('seats', 'P20'), -29); splace(tick(), cue('invite', 'P20'), -29)
splace(thunk(), cue('page', 'P20'), -29)
splace(whoosh(0.45), LIM0 - 0.1, -28)
splace(tick(), cue('long', 'P21') - 0.1, -24); splace(tick(), cue('long', 'P21') + 0.02, -27)
splace(whoosh(0.4), END0 - 0.1, -29)

# the later launch's blast at real speed under its half-speed picture (rec_225340 0:46.40-0:48.60)
raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', '46.40', '-t', '2.2', '-i', os.path.join(ROOT, 'footage/release/rec_225340.mp4'),
                      '-vn', '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
blast = np.frombuffer(raw, np.float32).reshape(-1, 2).copy()
fade = np.ones(len(blast)); n = int(0.05 * SR); fade[:n] = np.linspace(0, 1, n); fade[-int(0.4 * SR):] = np.linspace(1, 0, int(0.4 * SR))
blast *= fade[:, None]
tt0 = np.arange(len(blast)) / SR + LIVE_SLOW
duck = np.array([0.1 + 0.9 * min(1.0, min((abs(x - (w['s'] - 0.12)) for w in words if abs(x - w['s']) < 3), default=9) / 0.18) if not any(w['s'] - 0.12 <= x <= w['e'] + 0.12 for w in words) else 0.1 for x in tt0[::480]])
duck = np.repeat(duck, 480)[: len(blast)]
i0 = int(LIVE_SLOW * SR)
sfx[i0:i0 + len(blast)] += blast * 0.55 * duck[:, None]

sfx *= (1 - 0.5 * sm[: len(sfx)])[:, None]          # effects -6 dB while a word is spoken
bed = music[: int(TOTAL * SR)] + sfx[: int(TOTAL * SR)]
peak = np.max(np.abs(bed))
if peak > 0.98:
    bed *= 0.98 / peak
os.makedirs(os.path.join(ROOT, 'source/public/companion2'), exist_ok=True)
from sfxlib import write_wav  # noqa: E402
write_wav(os.path.join(ROOT, 'source/public/companion2/bed.wav'), bed)
if os.environ.get('STEMS'):
    write_wav(os.path.join(ROOT, 'exports/c2_stem_music.wav'), music[: int(TOTAL * SR)] * (0.98 / peak if peak > 0.98 else 1))
    write_wav(os.path.join(ROOT, 'exports/c2_stem_sfx.wav'), sfx[: int(TOTAL * SR)] * (0.98 / peak if peak > 0.98 else 1))
print(f'bed.wav {len(bed) / SR:.2f}s, peak {20 * np.log10(np.max(np.abs(bed)) + 1e-9):.1f} dBFS')
