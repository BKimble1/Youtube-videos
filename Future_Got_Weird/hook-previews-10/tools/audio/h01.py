#!/usr/bin/env python3
"""HOOK 01 (tongue-eating isopod) effects and ambience. Event times mirror TL in source/src/h01/Hook.tsx."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sfxlib import *
import numpy as np

H = '01'
# ---- timeline (seconds), kept in step with TL in Hook.tsx
OPEN = 0.0            # mouth already parted, opening to 0.85
REGRIP = [0.55, 1.3, 1.75, 2.15]   # claw re-grip ticks (leg wave, strongest 1.0-2.5)
FLEX = [1.0, 1.9]     # body flex
WIN_OPEN = 2.21       # cut window opens at the bite
FEED = (2.55, 4.05)   # blood drawn from the artery
BEATS = [2.62, 3.0, 3.33, 3.62, 3.87]   # accelerating pulse in the artery
DECAY = (2.87, 4.08)  # tongue pales and withers
SLIDE = 3.75          # parasite shifts onto the stub
SLIDE_CLAWS = [3.86, 4.12]
CLOSE = 4.86          # mouth snaps shut
REOPEN = 5.30         # and reopens

fx, amb = buf(), buf()
# bed: muffled underwater pressure + a quiet, slowly beating low pad (eerie, continuous, no start/stop)
place(amb, underwater(), 0, 0, 'underwater bed')
place(amb, pad((49, 73.4, 98, 146.8), bright=420), 0, -7, 'eerie low pad')

# mouth opening at frame 0: wet parting of the lips and a few bubbles
place(fx, squelch(0.5, 220, 700, 0.7), OPEN, -3, 'lips part (wet)')
place(fx, bubbles(0.9, 16, 500, 1500, 3), 0.05, -9, 'bubbles at the open mouth')
# claws: hard chitin ticks
for i, tt_ in enumerate(REGRIP):
    place(fx, click(0.05, 2100 + 150 * i, 4800), tt_, -6 - (i == 0) * 3, f'claw re-grip tick {i}')
for tt_ in FLEX:
    place(fx, creak(0.45, 170, 120, 48), tt_, -6, 'carapace flex creak')
    place(fx, squelch(0.3, 300, 800, 0.5), tt_ + 0.08, -10, 'tissue shift')
# cut window opens: a soft wet tissue part
place(fx, squelch(0.45, 160, 520, 0.8), WIN_OPEN, -5, 'cutaway opens (wet tissue)')
# feeding: suction flow and an accelerating pulse
place(fx, flow(FEED[1] - FEED[0], 150, 900, 7) * env(int((FEED[1] - FEED[0]) * SR), 0.25, 0.4), FEED[0], -10, 'blood drawn (suction flow)')
for i, b in enumerate(BEATS):
    place(fx, thump(0.22, 95, 48), b, -4 + i * 0.4, f'artery pulse {i}')
# tongue withering: dry shrivel creaks
place(fx, creak(0.6, 140, 90, 70), DECAY[0] + 0.35, -7, 'tongue shrivels')
place(fx, rustle(0.7, 1200, 5000), DECAY[0] + 0.7, -14, 'shrivel texture')
place(fx, creak(0.5, 120, 80, 85), DECAY[0] + 0.9, -8, 'tongue withers to a stub')
# the parasite moves onto the stub
place(fx, squelch(0.4, 250, 650, 0.6), SLIDE, -6, 'parasite slides forward')
for i, tt_ in enumerate(SLIDE_CLAWS):
    place(fx, click(0.05, 2400, 5200), tt_, -5, f'claws clamp the stub {i}')
# the mouth snaps shut and reopens
place(fx, thump(0.25, 120, 55), CLOSE + 0.24, -3, 'jaw shuts (body thump)')
place(fx, click(0.05, 1800, 4200), CLOSE + 0.25, -9, 'teeth meet')
place(fx, squelch(0.45, 200, 600, 0.7), REOPEN, -5, 'mouth reopens (wet)')
place(fx, bubbles(0.6, 14, 600, 1600, 9), REOPEN + 0.1, -11, 'bubbles')
place(fx, swell(1.2, 55), 4.8, -9, 'low tension swell under the reveal')

mix(H, fx, amb, fx_lufs=-27, notes='underwater bed + eerie pad; chitin ticks on claw grips; accelerating artery pulse during the cutaway; shrivel creaks; jaw shut/reopen')
