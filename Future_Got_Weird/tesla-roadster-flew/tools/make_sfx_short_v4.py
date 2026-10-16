#!/usr/bin/env python3
"""Short v4 (final pass) effects bed: original procedural sounds (tools/sfxlib.py) cued to the v4 narration.
A restrained accent on the first airborne frame; real event sound for the lift-off, the hop and the timed run is mixed
in the edit itself. Output: source/public/short4/sfx.wav"""
import json, os
import numpy as np
from sfxlib import SR, blip, hiss, place as _place, thunk, tick, whoosh, write_wav

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'source/public/short4/sfx.wav')
words = json.load(open(os.path.join(ROOT, 'source/src/data/short4_words.json')))['words']
DUR = round((words[-1]['e'] + 0.5) * 30) / 30
def w(text, n=0):
    return [x['s'] for x in words if x['w'].rstrip('.,?!') == text][n]

bus = np.zeros((int(DUR * SR) + SR, 2))
place = lambda sig, t, g, pan=0.0: _place(bus, sig, t, g, pan)

place(whoosh(0.5), 0.0, -27, 0.1)              # first airborne image: soft rush, under the voice
place(thunk(), 0.02, -28)
inv = w('fly') + 0.33
place(whoosh(0.3), inv - 0.08, -27, -0.2)       # cut under the ramp
s3 = w('Tesla', 1) - 0.08
place(whoosh(0.4), s3 - 0.08, -24)
place(hiss(1.3), w('fans'), -29)                # air leaving the gap
place(whoosh(0.35), w('Lower') - 0.3, -30)      # push-in
place(blip(440, 0.2), w('Lower') + 0.1, -30)
place(whoosh(0.35), w('surrounding') - 0.4, -30, 0.2)  # pull-back
for k in range(5):
    place(tick(), w('surrounding') + 0.05 + k * 0.07, -30, -0.4 + 0.2 * k)
place(thunk(), w('press') + 0.05, -22)
place(thunk(), w('ramp') + 0.02, -21)
s4 = w('Once') - 0.2
place(whoosh(0.4), s4 - 0.08, -23)
place(hiss(1.0), s4 + 0.2, -31, -0.3)
place(hiss(0.8), w('rotate') - 0.3, -29, 0.3)
place(hiss(0.7), w('hold'), -29)
place(blip(660, 0.18), w('compressed-gas'), -31)
place(blip(780, 0.18), w('rotate'), -31)
place(blip(990, 0.2), w('hold'), -31)
place(whoosh(0.35), w('It') - 0.12, -27)
place(whoosh(0.35), w('Zero') - 0.15, -27)
place(blip(1320, 0.22), w('0.81'), -28)
place(tick(), w('by'), -27)
place(whoosh(0.4), w('And', 1) - 0.15, -26)
for k in range(3):
    place(tick(), w('lists') + k * 0.08, -27)
place(blip(880, 0.2), w('Rocket'), -27)
place(thunk(), w('approved') + 0.04, -19)
place(whoosh(0.4), w('It', 1) - 0.15, -27)
place(hiss(2.4), w('It', 1), -33, 0.1)          # soft jet bed under the slow-motion close
write_wav(OUT, bus[:int(DUR * SR)])
print('sfx', OUT, f'{DUR:.2f}s')
