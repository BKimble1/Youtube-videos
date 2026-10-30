#!/usr/bin/env python3
"""HOOK 03 (mantis / horsehair worm) effects and ambience. Event times mirror source/src/h03/timeline.ts (EV) and the
bubble schedule in source/src/h03/env.tsx; keep them in step."""
import os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sfxlib import *
H = '03'
# --- EV (timeline.ts): word starts from h03_words.json
EV = dict(splash=0.0, under=0.32, window=1.07 + 0.18, part=1.07 + 0.45, emerge=1.67 - 0.05, water=2.03, crawls=2.95, body=4.11, pull=4.5)
fx, amb = buf(), buf()

def slither(dur, seed=0, rate=7.0):
    """a slow wet slither: overlapping low squelches with a soft tissue creak grain (a thread sliding out)"""
    n = int(dur * SR); out = np.zeros(n); r = np.random.default_rng(seed)
    k = 0.0
    while k < dur - 0.2:
        d = 0.22 + 0.18 * r.random()
        s = squelch(d, 180 + 120 * r.random(), 420 + 300 * r.random(), 0.5)
        i = int(k * SR); m = min(len(s), n - i); out[i:i + m] += s[:m] * (0.5 + 0.5 * r.random())
        k += 1.0 / rate * (0.7 + 0.6 * r.random())
    return norm(lp(out, 1400) + 0.25 * lp(creak(dur, 140, 95, 38), 1200))

# ambience: outdoor air while the camera is at the surface, then the muffled underwater bed and a low eerie pad
air = forest() * np.clip(1 - (t - 0.05) / 0.35, 0, 1)
place(amb, air * 0.6, 0, 0, 'pond-side air (fades as the camera goes under)')
uw = underwater() * np.clip((t - 0.12) / 0.3, 0, 1)
place(amb, uw, 0, 0, 'underwater bed')
eerie = pad((41.2, 61.7, 82.4, 123.5), bright=420) * np.clip((t - EV['window'] + 0.4) / 1.2, 0, 1) * 0.5
place(amb, eerie, 0, -2, 'low eerie pad from the window opening')

# the plunge: splash already under way at frame 0, its tail muffled as we follow it down, entrained bubbles
place(fx, splash(0.7, 5000), -0.04, 0, 'entry splash (mid-plunge at frame 0)')
place(fx, lp(thump(0.3, 80, 40), 300), 0.0, -4, 'body hitting the water')
place(fx, lp(bubbles(1.3, 26, 300, 1300, 3), 1500), 0.08, -5, 'entrained bubble cloud')
for k, at in enumerate((0.55, 0.95, 1.35)):
    place(fx, lp(puff(0.22, 200, 1200), 900), at, -12, f'leg stroke {k}')
# later single bubbles escaping the mantis (env.tsx: 0.9 + i*0.42 + 0.2*hash(i))
def hsh(n): s = np.sin(n * 127.1 + 311.7) * 43758.5453; return s - np.floor(s)
for i in range(12):
    at = 0.9 + i * 0.42 + 0.2 * hsh(i)
    place(fx, lp(bubble(700 + 500 * hsh(i * 5.5), 0.09), 2200), at, -14)
# the reveal: the clearing on the abdomen, the parting segments, the worm sliding out
place(fx, swell(1.6, 55), EV['window'] - 0.2, -8, 'tension swell as the coil is revealed')
place(fx, lp(pop(0.09, 420), 1500), EV['part'], -6, 'segments part (soft membrane pop)')
place(fx, squelch(0.5, 160, 380, 0.5), EV['emerge'], -3, 'worm tip pushes out')
place(fx, slither(1.3, 1, 5.0), EV['emerge'] + 0.3, -5, 'slow slither')
place(fx, slither(1.8, 2, 8.0), EV['crawls'] - 0.05, -1, 'worm crawling out (faster)')
place(fx, slither(1.6, 3, 5.5), EV['crawls'] + 1.6, -5, 'slither continues, easing')
place(fx, swell(1.6, 49), EV['pull'] - 0.1, -9, 'low swell under the pull-back')
mix(H, fx, amb, fx_lufs=-27, notes='splash/bubbles at the plunge, muffled bed, membrane pop at the parting, wet slither under "crawls out", low swell at the pull-back')
