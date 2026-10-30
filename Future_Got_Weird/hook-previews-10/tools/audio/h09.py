#!/usr/bin/env python3
"""HOOK 09 (pistol shrimp) effects and ambience. Event times mirror source/src/h09/timeline.ts (T):
  cock 0.36 (joint locks), release 0.58, shut 0.68 (plunger seats), jet 0.65, nucleate 0.76, bubbleMax 1.95,
  collapse 3.66 (the real 'snap': collapse crack + shockwave; tiny flash), fish hit ~4.5, recock 4.90-5.85.
The loud snap is made by the collapsing bubble, not the claw closing, so the big crack sits at the collapse."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sfxlib import *

H = '09'
T = dict(cock=0.36, release=0.58, shut=0.68, jet=0.65, nucleate=0.76, bubbleMax=1.95, collapse=3.66, fish=4.50, recock0=4.90, recock1=5.85)
fx, amb = buf(), buf()

# bed: muffled reef water + a very low tension swell under the slow motion
place(amb, underwater(), 0, 0, 'underwater bed')
place(amb, lp(sizzle(DUR, 40, 2500, 7000), 9000) * 0.25, 0, -14, 'distant reef crackle (other snapping shrimp)')
place(amb, swell(2.9, 52), T['jet'], -6, 'slow-motion pressure swell')

# claw: lock click while cocked, then the shut (chitin clack, small, before the real snap)
place(fx, click(0.05, 2600, 5600), T['cock'], -14, 'joint lock click')
place(fx, metal_click(0.14, 2400, decay=0.03), T['shut'] - 0.01, -8, 'claw shuts (plunger seats)')
place(fx, lp(spray(0.5, 0, 500, 3500), 3000), T['jet'], -10, 'jet leaving the socket')
# bubble growth: a low stretched resonance (slow motion), then the inward rush of the collapse
n = int(1.25 * SR); x = tt(n)
grow = np.sin(2 * np.pi * np.cumsum(np.linspace(140, 70, n)) / SR) * env(n, 0.25, 0.5)
place(fx, norm(lp(grow + 0.3 * lp(noise(n), 300), 800)), T['nucleate'], -16, 'bubble balloons (stretched)')
place(fx, bubble(420, 0.18, 0.4), T['nucleate'], -14, 'nucleation')
# collapse: rush then the crack at the collapse instant (collapse() puts its hit at 60 % of its length)
place(fx, collapse(0.9), T['collapse'] - 0.54, -3, 'collapse rush + crack')
place(fx, snap(0.5), T['collapse'], 0, 'SNAP: collapse shock')
place(fx, lp(thump(0.6, 70, 30), 400), T['collapse'], -4, 'pressure thump')
place(fx, shimmer(0.35, 7200, 5200), T['collapse'], -20, 'faint glint for the tiny flash')
# shockwave passes the fish
place(fx, puff(0.16, 400, 2000), T['fish'], -14, 'fish jolted')
# re-cock: soft clicks
place(fx, click(0.04, 2000, 4600), T['recock0'] + 0.15, -16, 'claw re-opening')
place(fx, click(0.05, 2700, 5800), T['recock1'], -12, 'claw locks open')
place(fx, bubbles(1.0, 6, 700, 1500, 3), 4.7, -20, 'residual micro-bubbles')

mix(H, fx, amb, fx_lufs=-26, notes='Pistol shrimp: snap crack placed at the bubble collapse (3.66 s), claw shut is only a small clack.')
