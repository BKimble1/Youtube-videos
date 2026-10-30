#!/usr/bin/env python3
"""Liquid Metal Robot V1: effects and ambience. Event times mirror source/src/v1/timeline.ts (T) and the preview's
opening (motion.ts TP, warped onto this narration's words); word starts come from source/src/data/words.json."""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sfxlib import *

TL = json.load(open(os.path.join(ROOT, 'source/src/data/words.json')))
def _k(s): return ''.join(ch for ch in s.lower().replace('’', "'") if ch.isalpha() or ch == "'")
def st(w, n=0): return [x for x in TL['words'] if _k(x['word']) == _k(w)][n]['start']
def en(w, n=0): return [x for x in TL['words'] if _k(x['word']) == _k(w)][n]['end']

# --- opening (scenes 1-2), the preview's cues on this narration's beats ---
ESC0, ESC1 = 1.22, st('cage') + 0.42
STEER0, STEER1 = st('then') - 0.12, st('remolded') + 0.18
FILL1 = st('into') + 0.16
POWER0 = st('remolded') + 0.2
FREEZE0, FREEZE1 = st('into') + 0.08, st('shape') + 0.3
TOUCH, LAND, RELEASE = st('shape') + 0.47, st('shape') + 1.05, st('shape') + 1.13
DRIPS = [0.74, 0.91, 1.14, 1.2]
GAPS = [(ESC0, ESC1 - 0.08), (ESC0 + 0.1, ESC1), (ESC0 + 0.26, ESC1 - 0.14)]
# --- scenes 3-7 (timeline.ts T) ---
OPEN0 = st('gallium') + 0.2
PEAK = st('particles') - 0.04
COIL_ON = st('magnetic', 1)
MELT0, SLUMP1 = st('magnetic', 1) + 0.2, st('liquid') + 0.25
STEER2_0, STEER2_1 = st('another') + 0.15, en('metal', 1) + 0.15
COIL_OFF = st('cools') - 0.3
FREEZE2_0, FREEZE2_1 = st('cools') + 0.05, st('hardens') + 0.45
PULL0 = en('again') - 0.1
HEAT2, WRAP0, WRAP1 = st('melted') - 0.25, st('melted'), en('object') + 0.05
CLOSE = WRAP0 + 0.7 * (WRAP1 - WRAP0)
FREEZE3_0, FREEZE3_1 = st('hardened') - 0.1, en('hardened') + 0.12
CARRY0 = st('carried')

fx, amb = buf(), buf()
place(amb, room() * 0.5, 0, 0, 'lab room tone')
# induction coil hum while a field is on (pad: 0-POWER0 and COIL_ON-COIL_OFF; stage coil: HEAT2-FREEZE3_0)
for a, b, name in [(0, POWER0, 'pad coil'), (COIL_ON, COIL_OFF, 'pad coil again'), (HEAT2, FREEZE3_0, 'stage coil')]:
    d = b - a + 0.35
    h = hum(d, 100, (1, 2, 3, 5), 0.002) * 0.7 + bp(noise(int(d * SR)), 7800, 8600) * 0.08
    place(amb, h * env(len(h), 0.06, 0.35), a, 0, f'{name} hum (field on)')
# the stomach model: a faint hollow plastic air
mod = lp(noise(int(10.5 * SR)), 500) * 0.6 + bp(noise(int(10.5 * SR)), 900, 1300) * 0.2
place(amb, norm(mod) * env(len(mod), 1.2, 1.5) * 0.5, 14.3, -4, 'stomach-model hollow air')

# scene 1: melt and escape
place(fx, sizzle(1.4, 90, 2000, 7000), 0.0, -12, 'phase-change crackle')
place(fx, squelch(0.45, 220, 520, 0.7), 0.57, -6, 'figure sags')
place(fx, squelch(0.5, 180, 420, 0.8), 1.04, -4, 'slump into puddle (melts)')
for i, d in enumerate(DRIPS):
    place(fx, bubble(500 + 90 * i, 0.07, 0.4), d, -10, f'drip {i + 1}')
place(fx, flow(ESC1 - ESC0 + 0.1, 180, 1100, 5), ESC0, -8, 'liquid metal flows to the bars')
for i, (a, b) in enumerate(GAPS):
    place(fx, squelch(0.3, 350 + 60 * i, 900, 0.5), a + 0.05, -8, f'squeeze through gap {i + 1}')
    place(fx, pop(0.07, 520 + 80 * i), a + 0.93 * (b - a), -9, f'neck pinches off {i + 1}')
place(fx, bubble(320, 0.12, 0.25), ESC1 - 0.02, -6, 'beads merge')
# scene 2: mould, freeze, set down
place(fx, flow(STEER1 - STEER0, 150, 800, 3), STEER0, -11, 'pool dragged by the magnet')
place(fx, metal_click(0.12, 2400, decay=0.02), POWER0, -16, 'pad coil off (relay)')
place(fx, flow(FILL1 - (STEER1 - 0.06), 220, 1400, 7), STEER1 - 0.06, -7, 'liquid fills the cavity')
place(fx, sizzle(FREEZE1 - FREEZE0, 70, 3500, 9000), FREEZE0, -14, 'freeze crackle')
place(fx, metal_click(0.18, 3000), TOUCH, -5, 'magnet clacks onto the cast figure')
place(fx, creak(0.3, 260, 180, 70), TOUCH + 0.05, -14, 'figure tilts out of the mould')
place(fx, click(0.06, 1800, 4200), LAND, -7, 'figure set down')
place(fx, thump(0.18, 140, 80), LAND, -12, 'set-down body')
place(fx, metal_click(0.12, 3600, decay=0.025), RELEASE, -11, 'magnet lets go')
# scene 3: into the metal
place(fx, swell(1.6, 62), RELEASE + 0.05, -10, 'low tonal swell as the camera pushes in')
place(fx, shimmer(1.1, 5200, 2600), OPEN0, -15, 'cut window opens (glassy shimmer)')
for i in range(7):
    place(fx, tick(0.03, 3600 + 260 * i), st('magnetic') + 0.11 * i, -17, f'particle tick {i + 1}')
# scene 4: heat, steer, cool
place(fx, metal_click(0.12, 2400, decay=0.02), COIL_ON, -12, 'pad coil on (relay)')
place(fx, sizzle(SLUMP1 - MELT0, 110, 2200, 7500), MELT0, -11, 'softening crackle')
place(fx, squelch(0.5, 200, 460, 0.8), SLUMP1 - 0.55, -5, 'figure slumps to liquid')
place(fx, flow(STEER2_1 - STEER2_0, 160, 900, 4), STEER2_0, -9, 'puddle steered by the magnet')
place(fx, squelch(0.3, 300, 700, 0.6), STEER2_0 + 0.5, -10, 'turn 1')
place(fx, squelch(0.3, 280, 650, 0.6), STEER2_0 + 0.98, -10, 'turn 2')
place(fx, metal_click(0.12, 2400, decay=0.02), COIL_OFF, -12, 'pad coil off (relay)')
place(fx, sizzle(FREEZE2_1 - FREEZE2_0, 60, 3500, 9000), FREEZE2_0, -12, 'gentle solidification crackle')
place(fx, rustle(1.2, 900, 3500), PULL0 + 0.1, -17, 'solid slug slides (rigid)')
# scene 5-6: into the model, wrap, grip, out
place(fx, tick(0.04, 2600), 15.5, -14, 'slug enters the esophagus tube')
place(fx, rustle(1.6, 700, 2600), 15.6, -19, 'slides through the tube')
place(fx, metal_click(0.12, 2400, decay=0.02), HEAT2, -12, 'stage coil on (relay)')
place(fx, sizzle(0.8, 110, 2200, 7500), HEAT2 + 0.05, -12, 'slug softens')
place(fx, flow(WRAP1 - WRAP0, 200, 1200, 6), WRAP0, -7, 'metal flows round the ball')
place(fx, squelch(0.4, 260, 600, 0.6), st('around'), -8, 'wraps round')
place(fx, bubble(300, 0.14, 0.25), CLOSE, -6, 'the two flows meet behind the ball')
place(fx, thump(0.2, 120, 70), CLOSE + 0.02, -12, 'capture')
place(fx, sizzle(FREEZE3_1 - FREEZE3_0, 60, 3500, 9000), FREEZE3_0, -12, 'grip hardens')
place(fx, metal_click(0.14, 2800, decay=0.03), FREEZE3_1 - 0.05, -10, 'hard grip (set)')
place(fx, rustle(2.3, 700, 2600), CARRY0 + 0.05, -16, 'assembly slides out through the tube')
place(fx, tick(0.04, 2400), 23.75, -13, 'exits the tube onto the stage')

mix('mix_v1', fx, amb, fx_lufs=-27, notes='coil hum only while a field is on; melt, squeeze, fill, freeze crackles; magnet clicks; model air; wrap and capture')
