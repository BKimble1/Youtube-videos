#!/usr/bin/env python3
"""U9 sound bed: the channel's in-house procedural score (the robots video's instruments and groove, as the Roadster
companion reused them) plus effects built from visible actions only: suspension squats and actuator servos when the
body is pulled down or pushed, nothing at takeoff (the air is quiet), a suspension thump on every landing, tyre roll
while the car moves, tyre scrub while it brakes, a thud per wheel per bump, a bump-stop knock when the travel runs
out, and one pass-by when the car comes through the camera. No cartoon boing, no explosions, no metallic crashes.
Added mechanical sounds are illustrative, not recordings of the U9's actuators.

Event times come from the animation itself (audio/sfx_events.json, written by tools/export_events.mjs).
Output: audio/mix/bed.wav (music + effects, ducked under the words), audio/mix/stem_music.wav, audio/mix/stem_sfx.wav
"""
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
from sfxlib import whoosh, thunk, tick, write_wav  # noqa: E402

SR = fx.SR
EV = json.load(open(os.path.join(ROOT, 'audio/sfx_events.json')))
TOTAL = EV['duration']
words = EV['words']
H, L, C, B, P, CB, E = EV['hook'], EV['launch'], EV['corner'], EV['brake'], EV['passenger'], EV['callback'], EV['close']
riser, thump = v2.riser, v2.thump

music = np.zeros((int((TOTAL + 4) * SR), 2))
sfx = np.zeros_like(music)
amb = np.zeros_like(music)


def mplace(x, t, g, pan=0.0):
    v1.place(music, x, t, g, pan)


def place(bus, x, t, gdb, pan=0.0):
    i = int(t * SR)
    if i < 0:
        x, i = x[-i:], 0
    x = x[: max(0, len(bus) - i)]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    g = 10 ** (gdb / 20) * 1.41
    bus[i:i + len(x), 0] += x * g * l
    bus[i:i + len(x), 1] += x * g * r


def s(x, t, gdb, pan=0.0):
    place(sfx, x, t, gdb, pan)


def a(x, t, gdb, pan=0.0):
    place(amb, x, t, gdb, pan)


# ---------------------------------------------------------------- local sounds (same synthesis style as sfx3)
def road_roll(d, rise=0.4, fall=0.4):
    """Tyres rolling on asphalt: low, slightly grainy noise with a slow swell."""
    t = fx.T(d)
    x = fx.lp(fx.noise(d), 260) * 2.2 + fx.bp(fx.noise(d), 500, 1600) * 0.12
    x *= (0.85 + 0.15 * np.sin(2 * np.pi * 0.7 * t)) * np.clip(t / rise, 0, 1) * np.clip((d - t) / fall, 0, 1)
    return fx.nrm(x)


def scrub(d):
    """Tyres working hard under braking: a broad rubber hiss, no squeal."""
    t = fx.T(d)
    x = fx.bp(fx.noise(d), 350, 1800) * (0.7 + 0.3 * np.sin(2 * np.pi * 11 * t)) * np.clip(t / 0.15, 0, 1) * np.clip((d - t) / 0.35, 0, 1)
    return fx.nrm(x)


def knock():
    """Suspension reaching its stop: a short, dull rubber knock (not metal)."""
    t = fx.T(0.25)
    return fx.nrm(np.sin(2 * np.pi * (95 - 40 * t) * t) * np.exp(-t * 30) + fx.lp(fx.noise(0.25), 500) * np.exp(-t * 60) * 0.7)


def bump(h):
    """One wheel over one bump: a small thud scaled by the bump height (m)."""
    return fx.tyre(min(1.0, 0.25 + h / 0.07))


# ---------------------------------------------------------------- effects
# Visible actions only. Whooshes only where an object passes the lens (the two tyre-wall wipes, the car through the lens).
W1, W2 = EV['wipes']
a(fx.wind(TOTAL), 0, -45)
# opening: the real clip carries no added sound; the match cut to the illustration gets a soft shimmer, the window opens
s(fx.shimmer(0.45), H['suspension'] - 0.1, -34)
s(fx.servo(0.5, up=False), H['crouch'] + 0.1, -35)
s(fx.servo(0.35, up=True), H['take'] - 0.6, -32)
s(fx.tyre(1.0), H['land'] - 0.01, -21)
s(fx.squat(), H['land'] + 0.12, -28)
# name tick, the press test twice (spring rings, damper calms it), the actuator
s(tick(), L['name'] + 0.05, -36)
s(fx.squat(), L['press1'] + 0.02, -30)
s(fx.squat(), L['release1'] + 0.45, -35)
s(fx.squat(), L['press2'] + 0.02, -31)
s(fx.relay(), L['adds'] + 0.05, -36)
s(fx.servo(0.45, up=True), L['act'] - 0.05, -34)
# the slowed launch: crouch, push (servo + drive whir), silence in the air, landing
s(fx.servo(0.9, up=False), L['crouch'] + 0.1, -33)
s(fx.servo(0.6, up=True), L['push'], -31)
s(fx.motor(1.2, 160, 300, 0.5), L['push'] + 0.05, -36)
s(fx.swell(1.2, 380), L['take'] - 0.1, -34)
s(fx.shimmer(0.4), L['realIn'] - 0.05, -36)  # hard cut to BYD's spike-strip pass (no sound of its own is used)
s(fx.tyre(1.0), L['land'] - 0.01, -20)  # the real wheels touch down beyond the strip
s(fx.squat(), L['land'] + 0.12, -27)
# drives off, a tyre wall whips past the lens
s(fx.motor(1.4, 240, 620, 0.7), L['go'], -28)
s(road_roll(1.6, 0.5, 0.8), L['go'] + 0.05, -32)
s(whoosh(0.5), W1['a'] + 0.25, -26)
# the bend: overhead, dive, roll on, actuators engage, the float gag, strips under the wheels, through the lens
s(road_roll(C['out'] - C['start'] + 0.3, 1.2, 0.3), C['start'], -34)
s(fx.squat(), C['enter'] + 0.9, -33)
s(fx.relay(), C['here'] - 0.05, -36)
s(fx.servo(0.5, up=True), C['here'] + 0.15, -35)
s(fx.shimmer(0.6), C['point'] + 0.1, -34)
for b in C['bumps']:
    pan = -0.5 if b['side'] == -1 else 0.5 if b['side'] == 1 else 0.0
    s(bump(b['h'] / 1000 if b['h'] > 1 else b['h']), b['t'], -27, pan)
s(whoosh(0.5), C['out'] - 0.3, -25)
# braking and the rough patch
s(road_roll(B['hold'] - B['in'] + 1.4, 0.2, 0.6), B['in'], -33)
s(scrub(B['tb1'] - B['tb0']), B['tb0'], -31)
s(fx.squat(), B['tb0'] + 0.35, -30)
s(fx.relay(), B['active'] - 0.05, -37)
s(fx.servo(0.5, up=True), B['active'] + 0.1, -35)
for side, hits, pan in (('f', B['front'], 0.35), ('r', B['rear'], -0.35)):
    for hh in hits:
        if hh['h'] >= 0.1:
            s(fx.tyre(1.0), hh['t'], -23, pan)
            s(knock(), hh['t'] + 0.3, -26, pan)
        else:
            s(bump(hh['h']), hh['t'], -32 + 40 * (hh['h'] - 0.04), pan)
s(whoosh(0.5), W2['cut'] - 0.3, -26)  # the speed whip into the cabin
# passenger: interior hush, the glass, the seat takes the load, the car through the lens
s(road_roll(P['replay'] - P['in'] - 0.3, 0.5, 0.3), P['in'] + 0.1, -42)
s(fx.shimmer(0.5), P['your'] + 0.05, -35)
s(fx.squat(), P['seat'] + 0.05, -36)
s(whoosh(0.45), P['replay'] - 0.4, -26)
# callback: the real clips carry no added sound; shimmer at the match cut, then crouch, push, silence in the air, landing
# (the real landing is on screen about 0.12 s before the model's)
s(fx.shimmer(0.5), CB['crouch'] - 0.5, -35)
s(fx.servo(0.8, up=False), CB['crouch'] + 0.05, -34)
s(fx.servo(0.6, up=True), CB['push'] + 0.1, -31)
s(fx.motor(1.0, 160, 300, 0.5), CB['push'] + 0.15, -36)
s(fx.swell(1.2, 380), CB['take'] - 0.1, -34)
s(fx.tyre(1.0), CB['land'] - 0.13, -20)
s(fx.squat(), CB['land'] + 0.0, -27)
# close: pull-away, brake scrub, a bump, the hop, the landing, the drive away
s(fx.motor(1.3, 220, 480, 0.8), E['in'], -30)
s(road_roll(E['brake'] - E['in'] + 0.3, 0.6, 0.3), E['in'], -33)
s(scrub(0.7), E['brake'] + 0.05, -34)
s(bump(0.07), E['bump'] + 0.6, -30, 0.3)
s(fx.servo(0.5, up=False), E['hop'] + 0.15, -34)
s(fx.servo(0.4, up=True), E['take'] - 0.3, -31)
s(fx.tyre(1.0), E['land'] - 0.01, -21)
s(fx.squat(), E['land'] + 0.12, -28)
s(fx.motor(1.4, 200, 520, 0.8), E['drive'] + 0.3, -31)
s(road_roll(TOTAL - E['drive'] - 0.5, 1.2, 1.5), E['drive'] + 0.4, -33)
s(whoosh(0.7), E['realDrive'] + 2.25, -29)  # the real drone shot passes over the car

# ---------------------------------------------------------------- music
D = 73.42
# opening: a drone and a light marimba ostinato under the real hop, a hit on the vector landing, a pad under the question
tt = v1.T(4.6)
drone = (np.sin(2 * np.pi * D * tt) + 0.5 * np.sin(2 * np.pi * D * 1.5 * tt * 1.002) + 0.3 * np.sin(2 * np.pi * D * 2.01 * tt)) * (0.8 + 0.2 * np.sin(2 * np.pi * tt / 2.7))
mplace(drone * np.clip(tt / 0.2, 0, 1) * np.clip((4.6 - tt) / 0.8, 0, 1), 0, 0.15)
t, k = 0.05, 0
while t < 7.4:
    mplace(v1.marimba([293.66, 440.0, 369.99, 440.0][k % 4], 0.5), t, 0.055, pan=(-0.3 if k % 2 else 0.3))
    t += BEAT / 2
    k += 1
mplace(thump(44, 0.9), H['land'], 0.32)
mplace(v1.pad(CH[3], 11.5 - 8.0, 0.6, 0.8), 8.0, 0.016)
mplace(riser(0.9), L['name'] - 0.95, 0.025)
# explanation: the curious pluck groove, thin while the hand presses and the actuator appears
groove(music, L['name'] - 0.05, L['during'] - 0.2, 'pluck', fade_in=1.0, thin=True, gain=0.8)
# the launch: dark groove building to takeoff, then held time in the air, a hit on the landing
groove(music, L['during'] - 0.1, L['take'] - 0.2, 'dark', fade_in=1.5, thin=True, gain=0.75)
mplace(riser(L['take'] - L['push'] - 0.3), L['push'], 0.022)
mplace(v1.pad((146.83, 196.0, 220.0, 293.66), L['land'] - L['take'] + 0.6, 1.0, 1.0), L['take'] - 0.2, 0.018)
for k2, f in enumerate([587.33, 440.0, 493.88]):
    mplace(v1.marimba(f, 1.2), L['take'] + 0.8 + k2 * 1.9, 0.05, pan=0.2 * (k2 - 1))
mplace(thump(42, 1.0), L['land'], 0.38)
# the bend: the energy lifts (fuller pluck groove), an accent on "active body control"
groove(music, C['start'] + 0.3, C['out'] - 0.2, 'pluck', fade_in=0.6, lush=True, gain=0.92)
mplace(thump(46, 0.7), C['thisW'], 0.22)
mplace(v1.pluck(587.33, 0.9), C['thisW'] + 0.02, 0.07)
# braking and the rough patch: the marimba groove, thinner once the travel runs out
tbig = B['big']
groove(music, B['in'] + 0.1, tbig - 0.1, 'marimba', fade_in=0.4, gain=0.85)
mplace(thump(40, 0.9), tbig, 0.28)
groove(music, tbig + 0.4, B['hold'] + 0.8, 'marimba', fade_in=0.0, thin=True, gain=0.75)
# passenger: a sparse, thoughtful pad with a pluck answer
t, bi = B['hold'] + 0.9, 0
while t < P['replay'] - 0.3:
    ch = CH[[0, 2, 1, 3][bi % 4]]
    mplace(v1.pad(ch, BAR + 1.0, 1.0, 1.2), t, 0.014)
    mplace(v1.pluck(ch[3] * 2, 0.9, 0.7), t + 1.2, 0.05, pan=0.3)
    mplace(v1.bass([D, 49.0, 61.74, 55.0][bi % 4], 2.0), t, 0.13)
    t += BAR
    bi += 1
# callback: a suspended drone under the replay and the slowed hop, a hit on the landing; then the D-major resolution,
# a final chord and piano as the car drives away into the distance, ringing out
tt = v1.T(CB['land'] - CB['in'] + 0.4)
dr = (np.sin(2 * np.pi * D * tt) + 0.4 * np.sin(2 * np.pi * D * 1.5 * tt * 1.002)) * np.clip(tt / 0.3, 0, 1) * np.clip((tt[-1] - tt) / 0.5, 0, 1)
mplace(dr, CB['in'], 0.11)
mplace(v1.pad((146.83, 196.0, 220.0, 293.66), CB['land'] - CB['take'] + 0.8, 0.8, 0.9), CB['take'] - 0.3, 0.017)
mplace(thump(42, 1.0), CB['land'], 0.36)
t, bi = CB['land'] + 0.9, 0
while t < E['composed'] - 0.9:
    ch = CH[bi % 4]
    mplace(v1.pad(ch, BAR + 0.8, 0.8, 1.0), t, 0.014)
    mplace(v1.bass(ROOTS[bi % 4], 2.0), t, 0.13)
    mplace(v1.pluck(ch[3] * 2, 0.9, 0.7), t + 2 * BEAT, 0.045, pan=0.25)
    t += BAR
    bi += 1
fin = E['composed'] - 0.6
mplace(v1.pad((146.83, 220.0, 293.66, 369.99, 440.0), TOTAL - fin + 0.4, 1.0, 1.8), fin, 0.019)
mplace(v1.bass(D, TOTAL - fin), fin + 0.05, 0.15)
for k3, f in enumerate([293.66, 369.99, 440.0]):
    mplace(v1.piano(f, 3.0), E['composed'] + 0.05 + k3 * 0.03, 0.07)
mplace(v1.piano(587.33, 2.6), E['composed'] + 1.2, 0.06)

# ---------------------------------------------------------------- reverb, ducking, bed
from scipy.signal import fftconvolve  # noqa: E402

rng = np.random.default_rng(918)
ir_t = v1.T(1.4)
ir = rng.standard_normal((len(ir_t), 2)) * np.exp(-ir_t / 0.4)[:, None]
ir[:, 0] = v1.lp(ir[:, 0], 5000)
ir[:, 1] = v1.lp(ir[:, 1], 5000)
wet = np.stack([fftconvolve(music[:, c], ir[:, c])[: len(music)] for c in range(2)], axis=1)
music = music + 0.16 * wet / (np.max(np.abs(wet)) + 1e-9) * np.max(np.abs(music))
music = music / (np.max(np.abs(music)) + 1e-9) * 10 ** (-6 / 20)
tt2 = np.arange(len(music)) / SR
music *= np.interp(tt2, [0, TOTAL - 1.4, TOTAL - 0.05, TOTAL + 4], [1, 1, 0, 0])[:, None]
speech = np.zeros(len(music))
for w in words:
    speech[int((w['s'] - 0.06) * SR):int((w['e'] + 0.06) * SR)] = 1
win = int(0.25 * SR)
sm = np.clip(np.convolve(speech, np.ones(win) / win, 'same') * 1.6, 0, 1)
music *= 0.42 * (1 - 0.82 * sm)[:, None]
sfx *= (1 - 0.4 * sm)[:, None]
amb *= (1 - 0.3 * sm)[:, None]
n = int(TOTAL * SR)
SFX_GAIN = 10 ** (5 / 20)
bed = music[:n] + SFX_GAIN * sfx[:n] + amb[:n]
fade = np.ones(n)
m = int(0.04 * SR)
fade[-m:] = np.linspace(1, 0, m)
bed *= fade[:, None]
peak = np.max(np.abs(bed))
k = 0.98 / peak if peak > 0.98 else 1.0
os.makedirs(os.path.join(ROOT, 'audio/mix'), exist_ok=True)
write_wav(os.path.join(ROOT, 'audio/mix/bed.wav'), bed * k)
write_wav(os.path.join(ROOT, 'audio/mix/stem_music.wav'), music[:n] * k)
write_wav(os.path.join(ROOT, 'audio/mix/stem_sfx.wav'), (SFX_GAIN * sfx[:n] + amb[:n]) * k)
print(f'bed.wav {n / SR:.2f}s, peak {20 * np.log10(np.max(np.abs(bed * k)) + 1e-9):.1f} dBFS')
