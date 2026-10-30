#!/usr/bin/env python3
"""HOOK 05 (bombardier beetle) effects and ambience. Event times mirror source/src/h05/scene.ts (EV, PULSES,
SPRAY_PULSES); keep them in step with the animation."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sfxlib import *
H = '05'
# ---- event times (scene.ts EV)
T_EXPL = 2.55
BURST1 = (0.38, 0.86); HIT1 = 0.44
VALVE0 = 2.45; POP0 = T_EXPL + 0.2; PULSES_END = 4.36
BURST2 = (4.72, 5.08); HIT2 = 4.78
PULSES = []
tt, k = POP0, 0
while tt < PULSES_END:
    PULSES.append(tt); tt += max(0.13, 0.24 - 0.022 * k); k += 1

fx, amb = buf(), buf()
# quiet outdoor floor bed with a faint low tone
place(amb, forest(), 0, 0, 'soil-floor air bed')
place(amb, pad((55, 82.4, 110), DUR, 0.003, 400) * 0.35, 0, -10, 'low tension pad')

# ant footfalls (rustle ticks) on the approach, the recoil and the retreat
for i, t0 in enumerate([0.0, 0.12, 0.25, 3.95, 4.15, 4.35, 5.15, 5.35, 5.55, 5.75]):
    place(fx, tick(0.025, 3600 + 300 * (i % 3)), t0, -20)
place(fx, rustle(0.5, 2500, 7000), 0.0, -14, 'ant approach rustle')

# first discharge: a pulsed hissing jet with sharp pops on each pulse
place(fx, spray(BURST1[1] - BURST1[0] + 0.25, 24, 1200, 9000), BURST1[0], -2, 'burst 1 pulsed spray')
t0 = BURST1[0]
while t0 < BURST1[1]:
    place(fx, pop(0.06, 900), t0, -5); t0 += 0.042
place(fx, sizzle(0.9, 140), BURST1[0] + 0.05, -10, 'droplet sizzle on the ant')
place(fx, squelch(0.25, 500, 1400), HIT1 + 0.02, -12, 'ant flinch')
place(fx, rustle(0.6, 2000, 6500), HIT1 + 0.1, -15, 'ant backs off')

# cutaway: valve opening and inflow, then explosive pulses in the chamber
place(fx, creak(0.3, 200, 150), VALVE0, -12, 'valve opens')
place(fx, flow(0.32, 300, 1200, 9), VALVE0 + 0.02, -13, 'reactants flow in')
for i, p in enumerate(PULSES):
    place(fx, pop(0.08, 520 + 30 * (i % 4)), p, -2 if i == 0 else -5, 'chamber pop' if i == 0 else None)
    place(fx, thump(0.18, 110, 55), p, -7 if i == 0 else -11)
    place(fx, spray(0.09, 0, 1500, 8000), p + 0.02, -10)
place(fx, sizzle(PULSES_END - POP0 + 0.2, 90, 2000, 8000), POP0 - 0.1, -13, 'heating reaction sizzle')

# second discharge and retreat
place(fx, spray(BURST2[1] - BURST2[0] + 0.25, 24, 1200, 9000), BURST2[0], -2, 'burst 2 pulsed spray')
t0 = BURST2[0]
while t0 < BURST2[1]:
    place(fx, pop(0.06, 950), t0, -5); t0 += 0.042
place(fx, sizzle(0.8, 120), BURST2[0] + 0.05, -11, 'droplet sizzle 2')
place(fx, squelch(0.25, 500, 1400), HIT2 + 0.02, -12, 'ant flinch 2')
place(fx, rustle(0.9, 2000, 6500), 5.0, -15, 'ant retreat')
mix(H, fx, amb, fx_lufs=-26.5, notes='pulsed spray pops on every discharge pulse; chamber pops on PULSES; no music, no whooshes')
