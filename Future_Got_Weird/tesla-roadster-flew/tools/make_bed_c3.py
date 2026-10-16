#!/usr/bin/env python3
"""Companion v3 sound bed: the channel's in-house procedural score (the robots video's instruments and groove,
re-timed to this cut) plus effects built from visible actions (tools/sfx3.py): the fans spinning up, panels sliding
and latching, a valve click before every burst, gas only while a nozzle is visibly firing, tyre and suspension sound
on every landing, a change of sound when the car leaves the surface, and a final resolution. The music is ducked
under every narration word. Real event sound (the hop replay, the stream's recorded run) is mixed in the edit.
Event times mirror source/src/companion3/*.tsx (cues from source/src/data/companion3_words.json).
Output: source/public/companion3/bed.wav   (STEMS=1 also writes exports/c3_stem_music.wav and c3_stem_sfx.wav)"""
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
assert SR == v1.SR == 48000
words = json.load(open(os.path.join(ROOT, 'source/src/data/companion3_words.json')))['words']
norm = lambda s: s.rstrip('.,?!…').lower()
def cue(w, p=None, n=0, end=False):
    hits = [x for x in words if norm(x['w']) == norm(w) and (p is None or x['p'] == p)]
    return hits[n]['e' if end else 's']

TOTAL = 166.5
riser, thump = v2.riser, v2.thump
music = np.zeros((int((TOTAL + 3) * SR), 2))
sfx = np.zeros_like(music)
amb = np.zeros_like(music)
def mplace(x, t, g, pan=0.0): v1.place(music, x, t, g, pan)
def place(bus, x, t, gdb, pan=0.0):
    i = int(t * SR); x = x[: max(0, len(bus) - i)]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    g = 10 ** (gdb / 20) * 1.41
    bus[i:i + len(x), 0] += x * g * l; bus[i:i + len(x), 1] += x * g * r
def s(x, t, gdb, pan=0.0): place(sfx, x, t, gdb, pan)
def a(x, t, gdb, pan=0.0): place(amb, x, t, gdb, pan)

# ---------------------------------------------------------------- times (as in the TSX)
FALL_T = 2.0
O = dict(open=cue('is', 'P3') - 0.04, sys1=cue('two', 'P3'), sys2=cue('different', 'P3'), stick=cue('sticks', 'P4'),
         track=cue('track', 'P4'), close=cue('track', 'P4', 0, True) + 0.05, drive=cue('The', 'P5') + 0.05,
         lip=cue('throws', 'P5') + 0.08, gauge=cue('So', 'P6'), prove=cue('prove', 'P6'))
Gr = dict(open=cue('Tesla', 'G2') - 0.35, fans=cue('fans', 'G2'), pull=cue('pull', 'G2'), seal=cue('Seal', 'G3'),
          thins=cue('thins', 'G3'), presses=cue('presses', 'G5'), climb0=cue('track', 'G5', 0, True) + 0.08,
          climb1=cue('down', 'G6', 0), gravity=cue('gravity', 'G6'), twoG=cue('two', 'G7'))
Lv = dict(seal=cue('seal', 'L1'), drive=cue('At', 'L2') + 0.05, surface=cue('surface', 'L2'), out=cue('out', 'L2'),
          air=cue('Air', 'L3'), gap=cue('gap', 'L3'), grip=cue('grip', 'L3'), gone=cue('gone', 'L3'))
SEP = Lv['grip'] - 0.05
Th = dict(wheels=cue('wheels', 'T1'), fans=cue('fans', 'T1'), second=cue('second', 'T2'), thrusters=cue('thrusters', 'T3'),
          compressed=cue('compressed', 'T3'), valve=cue('valve', 'T4'), blasts=cue('blasts', 'T4'), out=cue('out', 'T5'),
          pushed=cue('pushed', 'T5'), cold=cue('cold', 'T6'), end=71.6)
R = dict(start=71.6, push=cue('push', 'R1'), c1=cue('One', 'R1') + 0.02, c2=cue('opposite', 'R2') - 0.02,
         d0=cue('down', 'R3') - 0.25, land=cue('weight', 'R4') + 0.45, end=cue('one', 'R5', 0, True) + 0.38)
SHOP0 = cue('landing', 'R7', 0, True) + 0.05
FOOT_A, FOOT_B = 103.6, 109.0
S = dict(same=cue('same', 'A1'), push=cue('push', 'A1'), ground=cue('ground', 'A1'), launch=cue('launch', 'A2', 0, True) + 0.04,
         fans=cue('fans', 'S2'), rear=cue('rear', 'S3'), launches=cue('launches', 'S3'), rocket=cue('Rocket', 'S4'),
         jets=cue('jets', 'S4'), flight=cue('flight', 'S4'), isnt=cue("isn't", 'S5'), catch=cue('catch', 'M1'),
         burst=cue('burst', 'M2'), compressors=cue('compressors', 'M3'), how=cue('how', 'M3'), takes=cue('takes', 'M3'),
         steering=cue('steering', 'M4'), drove=cue('drove', 'M5'), demo=cue('demo', 'M5'))
SHOP1 = 143.7
En = dict(start=SHOP1, fans=cue('fans', 'E2'), hold=cue('hold', 'E2'), drive=cue('jets', 'E3') + 0.05,
          lip=cue('motion', 'E3') - 0.05, abs=cue('Absolutely', 'E6'), commute=cue('commute', 'E7'), leap=cue('leap', 'E7', 0, True))

# ---------------------------------------------------------------- effects
def valve_burst(t, gdb=-24, pan=0.0, d=0.28):
    s(fx.valve_click(), t - 0.06, gdb - 4, pan); s(fx.burst(d), t, gdb, pan)
def jet(t0, t1, gdb=-30, pan=0.0, click=True):
    if click: s(fx.valve_click(), t0 - 0.06, gdb + 2, pan)
    s(fx.burst(0.22), t0, gdb + 2, pan)
    if t1 - t0 > 0.25: s(fx.gas(t1 - t0), t0 + 0.05, gdb, pan)
def panel(t, d=0.6, gdb=-30):
    s(fx.slide(d), t, gdb); s(fx.latch(), t + d - 0.05, gdb - 1)
def stunt(drive, lip, fan_on, fan_off, gdb=0):
    """drive off the end, leave (sound change), roll couple, opposite pair, brake jets, touchdown (as BayScene.stunt)."""
    s(fx.motor(lip - drive + 0.15, 200, 560, 0.5), drive, -32 + gdb)
    s(fx.swell(1.6, 420), lip - 0.1, -30 + gdb)                    # the surface ends: the fan cuts out, open air
    jet(lip + 0.2, lip + 0.64, -30 + gdb, -0.35); jet(lip + 0.2, lip + 0.64, -32 + gdb, 0.35, click=False)
    jet(lip + 0.74, lip + 1.10, -30 + gdb, 0.35); jet(lip + 0.74, lip + 1.10, -32 + gdb, -0.35, click=False)
    jet(lip + 1.22, lip + FALL_T + 0.12, -29 + gdb, -0.2); jet(lip + 1.22, lip + FALL_T + 0.12, -31 + gdb, 0.2, click=False)
    s(fx.tyre(1.0), lip + FALL_T - 0.01, -21 + gdb)                 # touchdown, suspension compresses and settles
    s(fx.fan(fan_off - fan_on + 1.0, rise=0.7, fall=1.0), fan_on, -31 + gdb, 0.1)

# opening: the hop replay carries its own sound (in the edit); the drawn outline, the lights, the panels, the stunt
s(fx.shimmer(0.5), 4.15, -34)
s(fx.relay(), 5.22, -23, -0.3); s(fx.relay(), 5.44, -25, 0.3)
a(fx.room(10.5), 5.2, -44)
panel(O['open'] - 0.02, 0.7, -29)
s(fx.tick(1760), O['sys1'], -34); s(fx.tick(1975), O['sys2'], -34)
s(fx.squat(), O['stick'] + 0.05, -27)
panel(O['close'], 0.35, -31)
stunt(O['drive'], O['lip'], O['stick'] - 0.25, O['drive'] + 0.3)
s(fx.tick(2200), O['gauge'] + 0.05, -30)
for k in range(5):
    s(fx.tick(3000), O['gauge'] + 0.3 + k * 0.28, -40)               # the dial's needle stepping down

# grip: arriving, the sill opens, the fans spin up, the seal, the push, the climb
a(fx.room(28.5), 15.4, -43)
s(fx.motor(1.3, 420, 160, 0.01), 15.35, -33); s(fx.squat(), 16.5, -30)
panel(Gr['open'], 0.6, -29)
fan_g0, fan_g1 = Gr['fans'] - 0.15, Th['fans'] - 0.2
s(fx.fan(fan_g1 - fan_g0 + 1.0, rise=0.75, fall=1.0, steady=0.32), fan_g0, -30, 0.1)
s(fx.fan(Gr['thins'] + 0.6 - Gr['seal'], rise=0.01, lo=430, hi=520, steady=1.0), Gr['seal'] + 0.3, -42, 0.1)   # unloads as the gap thins
s(fx.gas(2.0, 3.0, 300, 2500), Gr['pull'], -42, -0.2)               # air drawn out under the floor
s(fx.latch(), Gr['seal'] + 0.02, -31, 0.25); s(fx.latch(), Gr['seal'] + 0.1, -32, -0.25)
s(fx.squat(), Gr['presses'] + 0.05, -26)
s(fx.motor(Gr['climb1'] - Gr['climb0'] + 0.3, 220, 640, 1.2), Gr['climb0'], -31)
s(fx.tick(1975), Lv['seal'], -34)

# leaving: to the end, air floods in, the grip goes, time slows, the hall opens onto the test area
s(fx.motor(Lv['surface'] - Lv['drive'] + 0.6, 200, 480, 0.9), Lv['drive'], -32)
s(fx.gas(1.6, 4.0, 250, 3000), Lv['air'] - 0.05, -31, -0.2)          # air rushing back into the gap
s(fx.swell(1.3, 300), cue('gone', 'L3', 0, True) - 0.25, -26)      # the sound change: grip gone, slow time (in the pause)
s(fx.rumble(3.0), Lv['grip'] - 0.3, -33)
a(fx.wind(Th['end'] - Lv['grip'] + 0.5), Lv['grip'], -40)
s(fx.motor(1.2, 600, 900, 0.3), Th['wheels'] - 0.2, -37)            # wheels spinning in the air
panel(Th['fans'] + 0.2, 0.6, -31)
panel(Th['second'] - 0.05, 0.6, -28)
s(fx.chug(1.0, 3.0), Th['compressed'] - 0.05, -40)                   # pressure in the tank
s(fx.valve_click(), Th['valve'] - 0.05, -22)
s(fx.gas(0.9, 9.0, 1500, 7000), Th['valve'] + 0.05, -40)              # air moving down the pipe
s(fx.burst(0.32), Th['blasts'] - 0.12, -22, 0.2)
s(fx.gas(Th['cold'] + 0.85 - Th['blasts'], 6.0), Th['blasts'] - 0.06, -31, 0.25)

# rear view: the nozzles, the couple, the opposite pair, the downward pair, touchdown
s(fx.tick(2600), R['push'], -32, -0.4); s(fx.tick(2400), R['push'] + 0.05, -32, 0.4)
jet(R['c1'], R['c1'] + 1.6, -29, -0.45); jet(R['c1'], R['c1'] + 1.6, -30, 0.45, click=False)
jet(R['c2'], R['c2'] + 1.6, -29, 0.45); jet(R['c2'], R['c2'] + 1.6, -30, -0.45, click=False)
jet(R['d0'], R['land'] + 0.15, -31, -0.4); jet(R['d0'], R['land'] + 0.15, -32, 0.4, click=False)
s(fx.tyre(1.0), R['land'] - 0.01, -21)
s(fx.gas(1.2, 3.0, 300, 3000), R['land'], -32)                     # gas billowing along the ground
a(fx.wind(R['end'] - R['start']), R['start'], -41)

# the real second run (silent recording): gas only where plumes are visible, touchdown in smoke
RR = R['end']
jet(RR + 0.35, RR + 2.75, -31, -0.4, click=False); jet(RR + 1.0, RR + 2.75, -33, 0.3, click=False)
jet(RR + 2.9, RR + 4.3, -29, 0.0, click=False)
s(fx.tyre(0.8), RR + 4.3, -24); s(fx.gas(1.0, 3.0, 300, 3000), RR + 4.35, -31)

# ground: settle, markings, gantry, countdown, launch
a(fx.wind(FOOT_A - SHOP0), SHOP0, -42)
s(fx.squat(), SHOP0 + 0.05, -29)
s(fx.gas(0.9, 2.0, 400, 3000), SHOP0, -36)
s(fx.slide(0.9), S['same'] - 0.1, -38)                             # markings running out
s(fx.servo(0.8), S['push'] - 0.1, -33); s(fx.clunk(), S['ground'] + 0.2, -28)
L = S['launch']
s(fx.beep(660), L - 1.2, -30); s(fx.beep(660), L - 0.8, -30); s(fx.beep(990, 0.35), L - 0.12, -28)
valve_burst(L, -22); s(fx.gas(1.9, 5.0), L + 0.08, -31)
s(fx.motor(2.6, 260, 900, 1.2), L, -31)
s(fx.swell(0.9, 900), L + 0.62, -32)                              # passing under the gantry
# compare + cruise to the workshop, the pillar, the line
a(fx.wind(113.7 - FOOT_B), FOOT_B, -42)
s(fx.motor(113.7 - FOOT_B + 1.5, 300, 300, 0.1), FOOT_B, -41)
s(fx.swell(0.9, 600), 113.25, -33)                                  # the foreground pillar passes
a(fx.room(SHOP1 - 113.7), 113.7, -43)
for t0, t1 in [(115.85, 117.4), (119.55, 120.55), (S['launches'] + 0.05, S['rocket'] + 0.5), (S['flight'] + 0.08, S['flight'] + 1.1)]:
    s(fx.conveyor(t1 - t0 + 0.2), t0 - 0.05, -34)
for at in (S['fans'], S['rear'], S['jets'] + 0.2):
    s(fx.servo(0.5, True), at - 0.55, -35); s(fx.clunk(), at, -26); s(fx.servo(0.5, False), at + 0.25, -37)
for k in range(4):
    s(fx.tick(2300 + 150 * k), S['jets'] + 0.12 * k, -31)
valve_burst(S['launches'], -32, -0.3, 0.2)
panel(S['flight'] + 0.1, 0.4, -32)
s(fx.tick(1500), S['isnt'] - 0.35, -32); s(fx.buzz(), S['isnt'] - 0.05, -30)
# limits: the panel, three bursts and the dial, the compressor, the open question, the car backing out
panel(S['catch'] - 0.1, 0.6, -29)
s(fx.tick(2200), cue('air', 'M1') - 0.25, -32)
for b in (S['burst'] + 0.05, S['burst'] + 0.5, S['burst'] + 0.95):
    valve_burst(b, -25, -0.2, 0.2); s(fx.tick(3000), b + 0.12, -36)
s(fx.chug(S['takes'] - S['compressors'], 5.5), S['compressors'] + 0.3, -33)
s(fx.tick(1800), S['how'], -30); s(fx.tick(1800), S['how'] + 0.5, -33)
panel(S['steering'] - 0.2, 0.5, -30)
s(fx.motor(1.6, 220, 380, 0.6), S['drove'], -32)

# ending: the opening shot again, one cue per system, the full landing, the clipboard
a(fx.room(TOTAL - SHOP1), SHOP1, -43)
s(fx.squat(), En['hold'] + 0.05, -28)
stunt(En['drive'], En['lip'], En['fans'] - 0.3, En['drive'] + 0.3, gdb=-1)
s(fx.scratch(), En['abs'] - 0.05, -30, -0.3)

# ---------------------------------------------------------------- music
D = 73.42
# hook: drone and a light marimba ostinato under the real stunt, an accent on the cut, a riser into the match
tt = v1.T(5.2)
drone = (np.sin(2 * np.pi * D * tt) + 0.5 * np.sin(2 * np.pi * D * 1.5 * tt * 1.002) + 0.3 * np.sin(2 * np.pi * D * 2.01 * tt)) * (0.8 + 0.2 * np.sin(2 * np.pi * tt / 2.7))
mplace(drone * np.clip(tt / 0.3, 0, 1) * np.clip((5.2 - tt) / 0.8, 0, 1), 0, 0.15)
t, k = 0.05, 0
while t < 4.3:
    mplace(v1.marimba([293.66, 440.0, 369.99, 440.0][k % 4], 0.5), t, 0.055, pan=(-0.3 if k % 2 else 0.3))
    t += BEAT / 2; k += 1
mplace(thump(46, 0.8), 2.45, 0.25)
mplace(riser(0.75), 3.95, 0.03)
mplace(v1.pluck(587.33, 0.9), 4.72, 0.08)
groove(music, 4.75, O['lip'], 'pluck', fade_in=1.0, gain=0.85)
mplace(v1.pad(CH[0], FALL_T + 0.6, 0.3, 0.6), O['lip'], 0.016)
mplace(thump(42, 1.0), O['lip'] + FALL_T, 0.4)
mplace(v1.pad(CH[3], 15.4 - O['gauge'] + 0.5, 0.6, 0.8), O['gauge'] - 0.1, 0.016)
# grip: the curious pluck groove, thinner on the climb's arrival, then through to the end of the ramp
groove(music, 15.45, Gr['climb0'], 'pluck', fade_in=1.5, gain=0.85)
mplace(riser(Gr['climb1'] - Gr['climb0']), Gr['climb0'], 0.025)
groove(music, Gr['climb1'], SEP, 'pluck', fade_in=0.0, thin=True, gain=0.8)
# slow time in the air: a held suspended pad, a few marimba notes, then the dark groove for the thrust
mplace(v1.pad((146.83, 196.0, 220.0, 293.66), 6.0, 1.2, 2.0), SEP - 0.2, 0.017)
for k2, f in enumerate([587.33, 440.0, 493.88]):
    mplace(v1.marimba(f, 1.2), SEP + 1.0 + k2 * 1.6, 0.05, pan=0.2 * (k2 - 1))
groove(music, Th['second'] - 0.3, Th['end'], 'dark', fade_in=2.0, gain=0.75)
# rear view: marimba groove, a beat of space at touchdown
groove(music, R['start'] + 0.2, R['land'] - 0.1, 'marimba', fade_in=0.8, gain=0.8)
mplace(thump(40, 1.0), R['land'], 0.3)
# real run: a pad only
mplace(v1.pad(CH[1], SHOP0 - R['end'] + 0.6, 0.4, 0.6), R['end'], 0.012)
# ground: dark groove building to the launch, a hit on it; the score steps aside for the stream's own run
groove(music, SHOP0 + 0.2, L - 0.15, 'dark', fade_in=1.0, gain=0.8)
mplace(riser(1.2), L - 1.2, 0.03)
mplace(thump(38, 1.2), L, 0.45)
groove(music, L + 0.3, FOOT_A, 'dark', fade_in=0.0, thin=True, gain=0.7)
t, bi = FOOT_B, 0
while t < 113.6:
    ch = CH[[0, 2][bi % 2]]
    mplace(v1.pad(ch, BAR + 1.0, 1.0, 1.2), t, 0.013); mplace(v1.bass(ROOTS[[0, 2][bi % 2]], 2.0), t, 0.12)
    t += BAR; bi += 1
# versions: the lush pluck groove; limits: a sparse, questioning pad
groove(music, 113.7, 130.2, 'pluck', fade_in=1.0, lush=True, gain=0.85)
t, bi = 130.3, 0
while t < SHOP1 - 0.4:
    ch = CH[[0, 2, 1, 3][bi % 4]]
    mplace(v1.pad(ch, BAR + 1.0, 1.0, 1.2), t, 0.014)
    mplace(v1.pluck(ch[3] * 2, 0.9, 0.7), t + 1.2, 0.05, pan=0.3)
    mplace(v1.bass([D, 49.0, 61.74, 55.0][bi % 4], 2.0), t, 0.13)
    t += BAR; bi += 1
# ending: a light pluck groove under the replay, a hit on the landing, then the D-major resolution swelling under
# the verdict and ringing out to the end
groove(music, SHOP1 + 0.1, En['lip'], 'pluck', fade_in=1.0, thin=True, gain=0.75)
mplace(v1.pad(CH[0], FALL_T + 0.5, 0.3, 0.6), En['lip'], 0.015)
mplace(thump(42, 1.0), En['lip'] + FALL_T, 0.35)
res0 = En['lip'] + FALL_T + 0.6
t, bi = res0, 0
while t < En['commute'] - 0.6:
    ch = CH[[0, 1, 2, 3][bi % 4]]
    mplace(v1.pad(ch, BAR + 0.8, 0.8, 1.0), t, 0.014)
    mplace(v1.bass(ROOTS[bi % 4], 2.0), t, 0.13)
    mplace(v1.pluck(ch[3] * 2, 0.9, 0.7), t + 2 * BEAT, 0.045, pan=0.25)
    t += BAR; bi += 1
fin = En['commute'] - 0.4
mplace(v1.pad((146.83, 220.0, 293.66, 369.99, 440.0), TOTAL - fin + 0.4, 1.2, 2.2), fin, 0.019)
mplace(v1.bass(D, TOTAL - fin), fin + 0.05, 0.15)
for k3, f in enumerate([293.66, 369.99, 440.0]):
    mplace(v1.piano(f, 3.5), fin + k3 * 0.03, 0.07)
mplace(v1.piano(587.33, 3.6), En['leap'] + 0.1, 0.075)
mplace(v1.piano(880.0, 3.0), En['leap'] + 0.1 + BEAT, 0.04)

from scipy.signal import fftconvolve  # noqa: E402
rng = np.random.default_rng(1016)
ir_t = v1.T(1.4)
ir = rng.standard_normal((len(ir_t), 2)) * np.exp(-ir_t / 0.4)[:, None]
ir[:, 0] = v1.lp(ir[:, 0], 5000); ir[:, 1] = v1.lp(ir[:, 1], 5000)
wet = np.stack([fftconvolve(music[:, c], ir[:, c])[: len(music)] for c in range(2)], axis=1)
music = music + 0.16 * wet / (np.max(np.abs(wet)) + 1e-9) * np.max(np.abs(music))
music = music / (np.max(np.abs(music)) + 1e-9) * 10 ** (-6 / 20)
def gain_env(points):
    tt2 = np.arange(len(music)) / SR
    return np.interp(tt2, [p[0] for p in points], [p[1] for p in points])
# the score steps aside for the stream's own run and fades cleanly at the very end
music *= gain_env([(0, 1), (FOOT_A - 0.2, 1), (FOOT_A + 0.3, 0.15), (FOOT_B - 0.3, 0.15), (FOOT_B + 0.4, 1), (TOTAL - 1.6, 1), (TOTAL - 0.05, 0), (TOTAL + 3, 0)])[:, None]
speech = np.zeros(len(music))
for w in words:
    speech[int((w['s'] - 0.06) * SR):int((w['e'] + 0.06) * SR)] = 1
win = int(0.25 * SR)
sm = np.clip(np.convolve(speech, np.ones(win) / win, 'same') * 1.6, 0, 1)
music *= 0.42 * (1 - 0.82 * sm)[:, None]
sfx *= (1 - 0.45 * sm[: len(sfx)])[:, None]
amb *= (1 - 0.3 * sm[: len(amb)])[:, None]
n = int(TOTAL * SR)
SFX_GAIN = 10 ** (5 / 20)                       # effects sit about 5 dB hotter than in v2: they carry the actions
bed = music[:n] + SFX_GAIN * sfx[:n] + amb[:n]
fade = np.ones(n); m = int(0.04 * SR); fade[-m:] = np.linspace(1, 0, m)
bed *= fade[:, None]
peak = np.max(np.abs(bed))
if peak > 0.98:
    bed *= 0.98 / peak
os.makedirs(os.path.join(ROOT, 'source/public/companion3'), exist_ok=True)
write_wav(os.path.join(ROOT, 'source/public/companion3/bed.wav'), bed)
if os.environ.get('STEMS'):
    k = 0.98 / peak if peak > 0.98 else 1
    write_wav(os.path.join(ROOT, 'exports/c3_stem_music.wav'), music[:n] * k)
    write_wav(os.path.join(ROOT, 'exports/c3_stem_sfx.wav'), (SFX_GAIN * sfx[:n] + amb[:n]) * k)
print(f'bed.wav {n / SR:.2f}s, peak {20 * np.log10(np.max(np.abs(bed)) + 1e-9):.1f} dBFS')
