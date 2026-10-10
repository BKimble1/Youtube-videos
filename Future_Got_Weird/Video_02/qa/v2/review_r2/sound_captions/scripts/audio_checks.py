#!/usr/bin/env python3
"""Writes audio_checks.txt: band tables and music-onset lists for every beat checked in r2 (measurement only)."""
import sys, os, io, contextlib
sys.path.insert(0, os.path.dirname(__file__))
from common import *
from aband import table
import music_onsets as mo
import numpy as np, soundfile as sf
f = open(OUT + '/audio_checks.txt', 'w')
def onsets(t0, t1):
    for fn in sorted(os.listdir(mo.STEMS)):
        x = sf.read(os.path.join(mo.STEMS, fn), dtype='float64', always_2d=True)[0].mean(1)
        o = mo.onsets(x, t0, t1)
        if o: f.write(f"   {fn[:-4]:9s} onsets: {o}\n")
def sec(title, t0, t1, win=40, lo=300, hi=4000, ons=False):
    f.write(f"\n=== {title}  ({t0}-{t1} s, f{t0*30:.0f}-f{t1*30:.0f}) ===\n")
    if ons:
        f.write(" music note onsets per instrument stem (energy jump >= 6 dB / 40 ms):\n"); onsets(t0, t1)
    table(t0, t1, win, lo, hi, file=f)
sec('U payoff: "U." ends, resolve, pointer tap f4370', 145.1, 146.0, 40, ons=True)
sec('U hold to roll-up and V7 cut (100 ms)', 146.0, 149.3, 100, ons=True)
sec('End screen: "corner." and the last chord', 320.3, 321.8, 40, ons=True)
sec('J4: "too." end, music stop, V13 cut (100 ms)', 310.4, 314.2, 100)
sec('Soft n02 window "estimate. Not a photograph."', 11.6, 13.9, 40, ons=True)
sec('Soft s15 window "In this capture, hundreds of times weaker."', 68.2, 71.5, 40, ons=True)
sec('V1 readout beep vs "It\'s" (speech band)', 2.6, 3.0, 20)
sec('V1 readout beep vs "It\'s" (4-12 kHz, the /s/)', 2.6, 3.0, 20, 4000, 12000)
sec('V3 mirror slide + ting (1 frame windows)', 1036 / 30, 1056 / 30, 1000 / 30)
sec('V5 crossing: tap f3297, uh-oh f3307, "one place."', 109.8, 111.1, 40)
sec('V5 "place." /s/ under the uh-oh (4-12 kHz)', 110.5, 110.9, 40, 4000, 12000)
sec('V4 bump: tick on "zoom"', 67.0, 67.6, 40, ons=True)
f.close(); print(OUT + '/audio_checks.txt')
