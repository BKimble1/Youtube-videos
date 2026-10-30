#!/usr/bin/env python3
"""HOOK 10 (brain-spine interface) effects and ambience. Event times mirror source/src/h10/scene/cues.ts and walk.ts
(word starts: walk 1.62, again 1.94, by 2.65, bypassing 2.78, spinal 3.66, injury 4.10; gait T 2.3 s, swing 0.92 s,
near leg lifts at -0.30 + kT, far leg half a period later)."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sfxlib import *

H = '10'
W = dict(walk=1.62, again=1.94, by=2.65, bypassing=2.78, spinal=3.66, injury=4.10)
CUE = dict(
    cortex0=W['walk'] + 0.42, record=W['again'] + 0.22, hop1=W['again'] + 0.36,
    cable0=W['again'] + 0.48, cable1=W['bypassing'] + 0.46, cordStop=W['bypassing'] + 0.24,
    decode0=W['bypassing'] + 0.5, decode1=W['bypassing'] + 0.8,
    belt0=W['bypassing'] + 0.76, belt1=W['spinal'] + 0.1, hop2=W['spinal'] + 0.12,
    lead0=W['spinal'] + 0.22, lead1=W['injury'], stim=W['injury'] + 0.02, muscle=W['injury'] + 0.2,
)
T, SW, N0 = 2.3, 0.92, -0.3
near_land = [N0 + k * T + SW for k in range(3)]          # 0.62, 2.92, 5.22
far_land = [N0 + T / 2 + k * T + SW for k in range(3)]   # 1.77, 4.07, (6.37)
far_lift = [N0 + T / 2 + k * T for k in range(3)]        # 0.85, 3.15, 5.45

fx, amb = buf(), buf()
# bed: clinic room tone and a faint low electrical hum (the system is on)
place(amb, room(), 0, 0, 'clinic room tone')
place(amb, hum(DUR, f=60, harm=(1, 2, 3, 5)) * 0.25 + pad((49, 73.4, 98), DUR, bright=400) * 0.5, 0, -6, 'low hum + pad')
# the walker rolling: a soft continuous rumble, lifting a little as each step loads it
roll = lp(noise(N), 260) * (0.6 + 0.4 * np.sin(2 * np.pi * t / (T / 2)) ** 2)
place(fx, norm(roll), 0, -18, 'walker wheels rolling')

# footsteps (deliberate, soft shoes), scuffs at lift-off
for i, tl in enumerate(near_land):
    if tl < DUR: place(fx, step(), tl, -2 if tl > 5 else -5, f'near foot lands {tl:.2f}')
for tl in far_land:
    if tl < DUR: place(fx, step(), tl, -9, f'far foot lands {tl:.2f}')
for tl in far_lift:
    if tl < DUR: place(fx, rustle(0.22, 800, 4000), tl, -16, f'far foot scuff {tl:.2f}')
place(fx, rustle(0.25, 800, 4000), 0.0, -14, 'near foot swinging at open')
place(fx, rustle(0.25, 800, 4000), N0 + 2 * T, -12, 'near foot lifts (stimulated step)')
place(fx, metal_click(0.12, 2600), 0.62, -14, 'walker frame tick as weight loads')
place(fx, metal_click(0.12, 2400), 5.22, -12, 'walker frame tick at final step')

# the signal path
place(fx, shimmer(0.5, 5200, 3600), CUE['cortex0'], -18, 'motor cortex fires (faint glassy)')
for k in range(5): place(fx, tick(0.03, 5200), CUE['record'] + 0.035 * k, -16, None)
LOG.append({'t': round(CUE['record'], 3), 'sfx': 'implant electrodes record (ticks)', 'gain_db': -16})
place(fx, beep(0.1, 1760), CUE['hop1'] + 0.1, -16, 'headset coil receives')
for k in range(4): place(fx, zap(0.08, 2400), CUE['cable0'] + 0.2 * k, -18, None)
LOG.append({'t': round(CUE['cable0'], 3), 'sfx': 'pulses down the headset cable', 'gain_db': -18})
place(fx, thump(0.3, 70, 40), CUE['cordStop'], -8, 'own signal dies at the injury (dull thud)')
place(fx, sizzle(0.25, 60, 1500, 5000), CUE['cordStop'], -20, 'injury fizzle')
for k in range(6): place(fx, tick(0.025, 3400 + 300 * (k % 3)), CUE['decode0'] + 0.05 * k, -15, None)
LOG.append({'t': round(CUE['decode0'], 3), 'sfx': 'processor decodes (clicks)', 'gain_db': -15})
for k in range(3): place(fx, zap(0.08, 2600), CUE['belt0'] + 0.08 * k, -18, None)
place(fx, beep(0.08, 2100), CUE['hop2'], -16, 'transmitter -> pulse generator')
for k in range(3): place(fx, zap(0.07, 2800), CUE['lead0'] + 0.07 * k, -18, None)
# stimulation: a soft pulse-train buzz from the paddle while he steps
n = int(1.9 * SR); x = tt(n)
stim = (np.sin(2 * np.pi * 40 * x) > 0.6).astype(float) * hp(noise(n), 1500) * 0.6 + 0.4 * np.sin(2 * np.pi * 220 * x) * (0.5 + 0.5 * np.sin(2 * np.pi * 40 * x))
place(fx, norm(stim * env(n, 0.05, 0.5)), CUE['stim'], -16, 'paddle stimulation pulse train')
place(fx, zap(0.14, 1900), CUE['stim'], -8, 'paddle fires')
place(fx, creak(0.35, 160, 110, 40), CUE['muscle'], -13, 'leg muscles contract (organic creak)')
place(fx, squelch(0.3, 200, 500), CUE['muscle'] + 0.05, -16, 'muscle squeeze')

mix(H, fx, amb, fx_lufs=-27, notes='clinic bed; footsteps on the gait; electrical ticks/zaps on each hop of the signal path; dull thud at the injury; paddle stimulation buzz and muscle creak on the final step')
