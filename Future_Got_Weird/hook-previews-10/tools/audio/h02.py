#!/usr/bin/env python3
"""HOOK 02 (underwater cyborg cockroach): effects and ambience. Event times mirror source/src/h02/world.ts (EV, SPEED,
GAIT) so every sound sits on its on-screen action:
  walk      foot plants every 13 mm of travel at 38 mm/s (a tripod change every 0.342 s): muffled chitin ticks
  fizz 2.60 oxygen bubbling off the MnO2 sponge in the peroxide chamber
  flow 2.95 gas running along the four silicone tubes (a soft, narrow hiss/pulse)
  3.42      the cut window opens on the thorax (soft wet tissue)
  3.46/3.56 gas reaching the two sealed spiracles (small pressure puffs)
  3.62      oxygen spreading into the tracheae (faint glassy shimmer)
  4.32-5.6  pull back and the slab overhead: a low pressure swell, then bubbles trickling past
No music bed, no whooshes on camera moves."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sfxlib import *
H = '02'
EV = dict(push=2.45, fizz=2.6, flow=2.95, spiracle=3.46, win=3.42, fill=3.62, fill_end=4.30, pull=4.32, under=4.9)
SPEED, HALF_STRIDE = 38.0, 13.0

fx, amb = buf(), buf()
# ambience: the muffled underwater bed and a very quiet low pad (eerie, constant: never starts or stops)
place(amb, underwater(DUR, 1.0), 0, 0, 'underwater bed')
place(amb, pad((41.2, 61.7, 82.4), DUR, 0.003, 300) * 0.35, 0, -6, 'low pad')
place(amb, lp(bubbles(DUR, 5, 300, 900, 11), 1500), 0, -10, 'distant bubble streams')

# the walk: muffled chitin ticks on concrete at each tripod change (quieter while the camera is inside the apparatus)
k = 0
while True:
    tt_ = k * HALF_STRIDE / SPEED + 0.05
    if tt_ > DUR - 0.05: break
    inside = EV['push'] + 0.3 < tt_ < EV['pull'] + 0.4
    g = -13 if not inside else -22
    place(fx, lp(click(0.05, 1500 + 200 * (k % 3), 3000), 2600), tt_, g, 'foot plant' if k < 3 else None)
    place(fx, lp(click(0.04, 1900, 3400), 2400), tt_ + 0.045, g - 5)
    k += 1

# the generator: oxygen bubbles off the catalyst sponge
place(fx, bubbles(1.75, 34, 900, 2600, 3) * env(int(1.75 * SR), 0.25, 0.4), EV['fizz'] - 0.15, -6, 'O2 bubbling on MnO2 sponge')
place(fx, lp(sizzle(1.6, 90, 2000, 6000), 6500), EV['fizz'], -12, 'peroxide fizz')
# gas pulses along the tubes
place(fx, bp(flow(1.0, 500, 1800, 7), 400, 2200), EV['flow'], -12, 'gas along the tubes')
place(fx, lp(pump(0.5, 160), 900), EV['flow'] + 0.02, -15, 'tube pulse')
place(fx, lp(pump(0.5, 150), 900), EV['flow'] + 0.38, -17)
# window and spiracles
place(fx, lp(squelch(0.38, 260, 700, 0.5), 1800), EV['win'], -14, 'cut window opens (tissue)')
place(fx, puff(0.16, 300, 1800), EV['spiracle'], -10, 'gas reaches spiracle 1')
place(fx, puff(0.16, 280, 1600), EV['spiracle'] + 0.10, -12, 'gas reaches spiracle 2')
place(fx, lp(shimmer(0.9, 3800, 2200), 5000), EV['fill'], -19, 'oxygen spreads into tracheae')
# pull back beneath the slab: a low pressure swell and bubbles trickling past
place(fx, swell(1.5, 46), EV['pull'], -9, 'pressure swell (beneath the slab)')
place(fx, lp(bubbles(1.1, 10, 400, 1300, 8), 2200), EV['under'], -12, 'bubbles past the slab')

mix(H, fx, amb, fx_lufs=-27, notes='HOOK 02 underwater cyborg cockroach: muffled bed, foot ticks, O2 fizz, tube flow, spiracle puffs, pressure swell')
