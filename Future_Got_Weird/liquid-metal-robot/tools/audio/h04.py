#!/usr/bin/env python3
"""HOOK 04 (liquid metal robot) effects and ambience. Event times mirror T in source/src/h04/motion.ts
(word starts from h04_words.json: melts 1.12, cage 1.88, then 2.62, remolded 3.12, into 3.76, shape 4.08)."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sfxlib import *

H = '04'
# --- mirror of motion.ts T ---
SLUMP1 = 1.12 + 0.30
ESC0, ESC1 = 1.22, 1.88 + 0.42
STEER0, STEER1 = 2.62 - 0.12, 3.12 + 0.18
FILL1 = 3.76 + 0.16
POWER0 = 3.3
FREEZE0, FREEZE1 = 3.76 + 0.08, 4.08 + 0.36
TOUCH, STAND, LAND, RELEASE = 4.74, 5.14, 5.5, 5.6
DRIPS = [0.22 + 0.5, 0.38 + 0.5, 0.55 + 0.55, 0.66 + 0.5]
GAPS = [(ESC0, ESC1 - 0.08), (ESC0 + 0.1, ESC1), (ESC0 + 0.26, ESC1 - 0.14)]

fx, amb = buf(), buf()
# ambience: quiet lab room and the induction coil's hum while the alternating field is on
place(amb, room() * 0.5, 0, 0, 'lab room tone')
coil = hum(POWER0 + 0.4, 100, (1, 2, 3, 5), 0.002) * 0.7 + bp(noise(int((POWER0 + 0.4) * SR)), 7800, 8600) * 0.08
coil *= env(len(coil), 0.02, 0.35)
place(amb, coil, 0, 2, 'induction coil hum (field on)')

# melting: a soft crackle and wet slumping
place(fx, sizzle(1.4, 90, 2000, 7000), 0.0, -12, 'phase-change crackle')
place(fx, squelch(0.45, 220, 520, 0.7), 0.55, -6, 'figure softens / sags')
place(fx, squelch(0.5, 180, 420, 0.8), 1.0, -4, 'slump into puddle (melts)')
for i, d in enumerate(DRIPS):
    place(fx, bubble(500 + 90 * i, 0.07, 0.4), d, -10, f'drip {i + 1} lands')
# escape through the bars: thick flow, a squeeze per gap, pinch-off pops, beads re-merging
place(fx, flow(ESC1 - ESC0 + 0.1, 180, 1100, 5), ESC0, -8, 'liquid metal flows to the bars')
for i, (a, b) in enumerate(GAPS):
    place(fx, squelch(0.3, 350 + 60 * i, 900, 0.5), a + 0.05, -8, f'squeeze through gap {i + 1}')
    place(fx, pop(0.07, 520 + 80 * i), a + 0.93 * (b - a), -9, f'neck pinches off {i + 1}')
place(fx, bubble(320, 0.12, 0.25), ESC1 - 0.02, -6, 'beads merge into one pool')
# steering and filling the mould
place(fx, flow(STEER1 - STEER0, 150, 800, 3), STEER0, -11, 'pool dragged by the magnet')
place(fx, metal_click(0.12, 2400, decay=0.02), POWER0, -16, 'coil switched off (relay)')
place(fx, flow(FILL1 - 3.22, 220, 1400, 7), 3.22, -7, 'liquid fills the cavity')
place(fx, bubble(260, 0.14, 0.2), FILL1 - 0.05, -9, 'cavity full')
# freezing: fine crystallisation ticks
place(fx, sizzle(FREEZE1 - FREEZE0, 70, 3500, 9000), FREEZE0, -14, 'freeze front crackle')
# recast figure lifted out and set down
place(fx, metal_click(0.18, 3000), TOUCH, -5, 'magnet clacks onto the cast figure')
place(fx, creak(0.35, 260, 180, 70), TOUCH + 0.06, -14, 'figure tilts out of the mould')
place(fx, click(0.06, 1800, 4200), LAND, -7, 'figure set down')
place(fx, thump(0.18, 140, 80), LAND, -12, 'set-down body')
place(fx, metal_click(0.12, 3600, decay=0.025), RELEASE, -11, 'magnet lets go')

mix(H, fx, amb, fx_lufs=-27, notes='coil hum bed while the field is on; wet melt, squeeze and pinch-off, fill, freeze crackle, magnet clicks')
