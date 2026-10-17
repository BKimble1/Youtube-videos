#!/usr/bin/env python3
"""Rocket Short sound bed: the channel's in-house procedural score (the robots video's instruments, D major, 104 BPM) and
effects built from visible actions only (tools/sfx3.py):
  - the first frame already has sound: a cold-gas jet hiss under the replay's own audio (mixed in the edit)
  - "catch": a short air release and a restrained low hit
  - the outline trace, the panel lifting off, a valve click before every burst, gas only while a nozzle is visibly firing,
    lighter clicks and puffs for the pitch thrusters, the tank's mounts and frame, the gravel (brief, small), the dust wipe
  - the real aerial is a silent recording: open air, the side jets while they are visible, the down jets into smoke, the
    touchdown on its frame (2:24.3), then the hiss dying away; the last 0.8 s (the replay's lift-off) gets the opening's jet bed
Music and effects duck under every narration word. The last bars return to the opening's drone and marimba ostinato at the
same level, so the loop doesn't restart the score. Event times come from source/src/data/rocket_events.json
(tools/export_rocket_events.ts, the animation's own model) and rocket_words.json.
Output: source/public/rocket/bed.wav   (STEMS=1 also writes exports/rocket_stem_music.wav and rocket_stem_sfx.wav)"""
import json, os, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ROBOTS = os.path.join(ROOT, '..', 'they-trained-robots-to-destroy-themselves', 'tools')
sys.path.insert(0, ROBOTS); sys.path.insert(0, os.path.join(ROBOTS, 'v2')); sys.path.insert(0, os.path.join(ROBOTS, 'v6'))
import synth_audio as v1  # noqa: E402
import synth_audio_v2 as v2  # noqa: E402
from synth_score_v6 import groove, CH, ROOT_ as ROOTS, BAR, BEAT  # noqa: E402
sys.path.insert(0, HERE)
import sfx3 as fx  # noqa: E402
from sfxlib import write_wav  # noqa: E402

SR = fx.SR
ev = json.load(open(os.path.join(ROOT, 'source/src/data/rocket_events.json')))
words = json.load(open(os.path.join(ROOT, 'source/src/data/rocket_words.json')))['words']
T = ev['T']; WIPE = ev['WIPE']; TOUCH = ev['TOUCH_T']; TOTAL = ev['DURATION']; LOOP_T = ev['LOOP_T']
AER_IN = ev['AER_IN']
src2t = lambda s: WIPE + (s - AER_IN)              # rec_224730 time -> film time (the aerial)
BURSTS = ev['BURSTS']; SEGS = ev['PITCH_SEGS']
lift = np.array(ev['lift'])                         # [t, lift ratio, height]

riser, thump = v2.riser, v2.thump
music = np.zeros((int((TOTAL + 3) * SR), 2)); sfx = np.zeros_like(music); amb = np.zeros_like(music)
def place(bus, x, t, gdb, pan=0.0):
    i = int(max(0, t) * SR); x = x[: max(0, len(bus) - i)]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    g = 10 ** (gdb / 20) * 1.41
    bus[i:i + len(x), 0] += x * g * l; bus[i:i + len(x), 1] += x * g * r
def s(x, t, gdb, pan=0.0): place(sfx, x, t, gdb, pan)
def a(x, t, gdb, pan=0.0): place(amb, x, t, gdb, pan)
def mplace(x, t, g, pan=0.0): v1.place(music, x, t, g, pan)

# ---------------------------------------------------------------- effects
def jet_bed(t0, t1, gdb, pan=0.0, env=None):
    """A cold-gas jet following the animation's lift ratio (louder when it pushes harder, silent when off)."""
    d = t1 - t0
    x = fx.gas(d, flutter=6, lo=450, hi=6500)
    if env is not None:
        tt = t0 + np.arange(len(x)) / SR
        x = x * np.interp(tt, env[:, 0], env[:, 1])
    s(x, t0, gdb, pan)

# opening: an immediate jet under the replay's own sound
s(fx.gas(T['swap'] + 0.1, flutter=8, lo=400, hi=6000), 0.0, -31, -0.15)
s(fx.gas(T['swap'] + 0.1, flutter=6, lo=600, hi=7000), 0.0, -33, 0.2)
s(fx.burst(0.45), 0.0, -34)
# "catch": air release and a restrained low hit
s(fx.burst(0.4), T['catch'] - 0.02, -23)
s(fx.shimmer(0.4), T['match'] - 0.02, -35)
s(fx.swell(0.9, 500), T['swap'] - 0.1, -31)
# the drawn car brakes on its jets, then holds: gas follows the model's lift ratio until the bursts
env = np.stack([lift[:, 0], np.clip(lift[:, 1], 0, 2.5) / 1.13], 1)
jet_bed(T['swap'], BURSTS[0][0] - 0.02, -30, -0.2, env)
jet_bed(T['swap'], BURSTS[0][0] - 0.02, -32, 0.2, env)
# panel lifts off
s(fx.slide(0.55), T['jets'] + 0.15, -30); s(fx.latch(), T['jets'] + 0.7, -33)
# "blast": the valve and a gas swell
s(fx.valve_click(), T['blast'] - 0.06, -27); s(fx.swell(0.6, 900), T['blast'], -32)
# bursts: a valve click before each, a hard pssht while it is on
for b0, b1 in BURSTS:
    s(fx.valve_click(), b0 - 0.05, -26, 0.05); s(fx.burst(max(0.22, b1 - b0 + 0.12)), b0, -22)
# the hold: steady jets (and through the tank, the balance, the corrections) until the descent
hold0, hold1 = BURSTS[-1][1] + 0.1, T['fire'] - 0.3
jet_bed(hold0, hold1, -33, -0.2); jet_bed(hold0, hold1, -35, 0.2)
# thrust equals weight: a soft confirming tick
s(fx.tick(1760), T['weight'] + 0.02, -33)
# bigger tank: a filling swell; heavier wall and mounts; the frame closes
s(fx.swell(0.8, 380), T['bigger'] + 0.05, -30)
s(fx.clunk(), T['add'] + 0.12, -28, -0.15); s(fx.clunk(), T['add'] + 0.3, -29, 0.15)
s(fx.slide(0.4), T['protection'] - 0.08, -31); s(fx.latch(), T['protection'] + 0.45, -27)
# balance: the marker; the offset thrust (the rear jet surges); the turn
s(fx.tick(1975), T['balance'], -32)
off0, off1 = SEGS[0]['t0'], SEGS[0]['t1']
s(fx.gas(off1 - off0, flutter=9, lo=350, hi=5000), off0, -28, 0.35)
s(fx.swell(off1 - off0 + 1.2, 260), off0 + 0.1, -32)
# corrective pulses: lighter clicks and puffs, panned to the end that fires
for seg, pan in zip(SEGS[1:], [-0.45, -0.45, 0.45]):
    s(fx.tick(2600), seg['t0'] - 0.04, -30, pan); s(fx.burst(0.24), seg['t0'], -28, pan)
# descent and ground: the jets change pitch as they meet the pad; gravel brief and small; the dust wipe
s(fx.gas(T['gravel'] - T['fire'] + 0.6, flutter=5, lo=300, hi=5200), T['fire'] - 0.3, -30)
s(fx.rumble(WIPE - T['gravel'] + 0.2), T['gravel'] - 0.2, -34)
def grit(t0, n, gdb, spread=0.5, seed=0):
    r = np.random.default_rng(seed)
    for k in range(n):
        s(fx.tick(int(r.uniform(1800, 4200))), t0 + r.uniform(0, spread), gdb - r.uniform(0, 6), r.uniform(-0.6, 0.6))
grit(T['gravel'] - 0.2, 6, -36, 0.5, 1)
s(fx.burst(0.35), T['blast2'], -24)
grit(T['blast2'] + 0.05, 14, -31, 0.7, 2)
grit(T['debris'], 12, -32, 0.8, 3)
s(fx.swell(WIPE - T['debris'] + 0.5, 700), T['debris'], -27)          # the dust rolling toward the camera
s(fx.swell(0.7, 1200), WIPE - 0.45, -27)                                 # the cloud reaching the lens
# the real aerial (a silent recording): open air, the jets while visible, touchdown, the hiss dying away
a(fx.wind(TOTAL - WIPE + 0.2), WIPE - 0.1, -40)
for (s0, s1, pan) in [(140.25, 141.35, -0.3), (141.6, 142.7, 0.3), (143.0, 144.35, 0.0)]:
    t0, t1 = src2t(s0), src2t(s1)
    s(fx.valve_click(), t0 - 0.05, -31, pan); s(fx.gas(t1 - t0, flutter=7, lo=500, hi=6500), t0, -31, pan)
s(fx.gas(1.6, flutter=5, lo=300, hi=4500), src2t(143.6), -30)          # down jets into the smoke
s(fx.tyre(1.0), TOUCH, -21); s(fx.squat(), TOUCH + 0.12, -27)
s(fx.gas(1.8, flutter=4, lo=400, hi=3000), TOUCH + 0.05, -37)
# the loop bridge: the replay's lift-off again, under the same jet bed the opening starts with, so the loop is seamless
s(fx.gas(TOTAL - LOOP_T + 0.05, flutter=8, lo=400, hi=6000), LOOP_T, -31, -0.15)
s(fx.gas(TOTAL - LOOP_T + 0.05, flutter=6, lo=600, hi=7000), LOOP_T, -33, 0.2)

# ---------------------------------------------------------------- music
D = 73.42
def hook(t0, t1, gain=1.0):
    """Drone and the light marimba ostinato (the opening; the last bars return to it for the loop)."""
    d = t1 - t0
    tt = v1.T(d)
    drone = (np.sin(2 * np.pi * D * tt) + 0.5 * np.sin(2 * np.pi * D * 1.5 * tt * 1.002) + 0.3 * np.sin(2 * np.pi * D * 2.01 * tt)) * (0.8 + 0.2 * np.sin(2 * np.pi * tt / 2.7))
    mplace(drone * np.clip(tt / 0.03, 0, 1) * np.clip((d - tt) / 0.03, 0, 1), t0, 0.15 * gain)
    t, k = t0 + 0.02, 0
    while t < t1 - 0.15:
        mplace(v1.marimba([293.66, 440.0, 369.99, 440.0][k % 4], 0.5), t, 0.055 * gain, pan=(-0.3 if k % 2 else 0.3))
        t += BEAT / 2; k += 1
hook(0.0, T['swap'] + 0.25)
mplace(thump(46, 0.8), T['catch'], 0.26)                                # restrained low hit on "catch"
mplace(riser(0.45), T['swap'] - 0.45, 0.025)
mplace(v1.pluck(587.33, 0.9), T['swap'] + 0.05, 0.08)
groove(music, T['swap'] + 0.1, T['then'] - 0.05, 'pluck', fade_in=1.2, gain=0.8)
# balance and corrections: the marimba groove, thinner, with a suspended pad while the car turns
mplace(v1.pluck(493.88, 0.9), T['then'], 0.06)
groove(music, T['then'], T['fire'] - 0.35, 'marimba', fade_in=0.4, thin=True, gain=0.78)
mplace(v1.pad((146.83, 196.0, 220.0, 293.66), SEGS[3]['t1'] - off0 + 0.6, 0.8, 1.0), off0, 0.012)
# descent and gravel: the darker groove building to the wipe
groove(music, T['fire'] - 0.35, WIPE - 0.05, 'dark', fade_in=0.8, gain=0.8)
mplace(riser(WIPE - T['debris'] + 0.1), T['debris'] - 0.1, 0.03)
mplace(thump(42, 1.0), WIPE, 0.3)
# return: the D-major resolution under "None of this breaks physics", a soft hit at touchdown, piano on "problems"
t, bi = WIPE + 0.05, 0
while t < TOUCH - 0.2:
    ch = CH[[0, 1, 2, 3][bi % 4]]
    mplace(v1.pad(ch, BAR + 0.8, 0.8, 1.0), t, 0.014); mplace(v1.bass(ROOTS[bi % 4], 2.0), t, 0.12)
    mplace(v1.pluck(ch[3] * 2, 0.9, 0.7), t + 2 * BEAT, 0.045, pan=0.25)
    t += BAR; bi += 1
mplace(thump(40, 1.2), TOUCH, 0.24)
for k3, f in enumerate([293.66, 369.99, 440.0]):
    mplace(v1.piano(f, 3.0), T['problems'] + 0.05 + k3 * 0.03, 0.06)
# the last bars: back to the opening's drone and ostinato, at the opening's level, through the last frame
hook(TOUCH + 0.6, TOTAL + 0.03)

from scipy.signal import fftconvolve  # noqa: E402
rng = np.random.default_rng(1017)
ir_t = v1.T(1.2)
ir = rng.standard_normal((len(ir_t), 2)) * np.exp(-ir_t / 0.35)[:, None]
ir[:, 0] = v1.lp(ir[:, 0], 5000); ir[:, 1] = v1.lp(ir[:, 1], 5000)
wet = np.stack([fftconvolve(music[:, c], ir[:, c])[: len(music)] for c in range(2)], axis=1)
music = music + 0.14 * wet / (np.max(np.abs(wet)) + 1e-9) * np.max(np.abs(music))
music = music / (np.max(np.abs(music)) + 1e-9) * 10 ** (-6 / 20)
# duck under every word
speech = np.zeros(len(music))
for w in words:
    speech[int((w['s'] - 0.06) * SR):int((w['e'] + 0.06) * SR)] = 1
win = int(0.25 * SR)
sm = np.clip(np.convolve(speech, np.ones(win) / win, 'same') * 1.6, 0, 1)
music *= 0.42 * (1 - 0.8 * sm)[:, None]
sfx *= (1 - 0.5 * sm)[:, None]
amb *= (1 - 0.3 * sm)[:, None]
n = int(round(TOTAL * SR))
SFX_GAIN = 10 ** (5 / 20)
bed = music[:n] + SFX_GAIN * sfx[:n] + amb[:n]
m = int(0.02 * SR)
bed[:m] *= np.linspace(0.6, 1, m)[:, None]          # no click at the loop point, no fade-in that sounds like a restart
bed[-m:] *= np.linspace(1, 0.6, m)[:, None]
peak = np.max(np.abs(bed))
if peak > 0.98:
    bed *= 0.98 / peak
os.makedirs(os.path.join(ROOT, 'source/public/rocket'), exist_ok=True)
write_wav(os.path.join(ROOT, 'source/public/rocket/bed.wav'), bed)
if os.environ.get('STEMS'):
    os.makedirs(os.path.join(ROOT, 'exports'), exist_ok=True)
    k = 0.98 / peak if peak > 0.98 else 1
    write_wav(os.path.join(ROOT, 'exports/rocket_stem_music.wav'), music[:n] * k)
    write_wav(os.path.join(ROOT, 'exports/rocket_stem_sfx.wav'), (SFX_GAIN * sfx[:n] + amb[:n]) * k)
print(f'bed.wav {n / SR:.2f}s, peak {20 * np.log10(np.max(np.abs(bed)) + 1e-9):.1f} dBFS')
