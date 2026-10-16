#!/usr/bin/env python3
"""Short v3 effects bed: original procedural sounds (tools/sfxlib.py), cued to the v3 narration's word times.
The ramp recording (rec_224730) is silent, so its launch and landing get designed hits; the hop and the live 0-60 run
keep their real event sound in the edit itself. Output: source/public/short3/sfx.wav"""
import json, os
import numpy as np
from sfxlib import SR, blip, hiss, hum, place as _place, thunk, tick, whoosh, write_wav

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'source/public/short3/sfx.wav')
DUR = 36.733
words = json.load(open(os.path.join(ROOT, 'source/src/data/short3_words.json')))['words']
def w(text, n=0):
    return [x['s'] for x in words if x['w'].rstrip('.,?!') == text][n]

bus = np.zeros((int(DUR * SR), 2))
place = lambda sig, t, g, pan=0.0: _place(bus, sig, t, g, pan)

place(thunk(), 0.53, -22)                       # hit into the upside-down footage
place(whoosh(0.3), w('hung') - 0.1, -28, 0.2)
place(whoosh(0.4), w('On') - 0.18, -25, -0.2)   # second run
place(whoosh(0.5), 4.25, -27, 0.3)              # leaves the ramp (aerial, silent source)
place(hiss(0.9), 4.75, -31, -0.3)               # jets during the roll
place(thunk(), 6.05, -19)                       # landing
place(hiss(0.6), 6.1, -32, 0.2)
place(whoosh(0.3), w('How') - 0.12, -29)
# suction explainer
s7 = w('Tesla') - 0.08
place(whoosh(0.45), s7 - 0.1, -22)
place(hiss(1.3), w('pull'), -29, 0)             # air leaving the gap
place(tick(), w('thin') + 0.1, -26)
place(blip(440, 0.22), w('Lower'), -29)
place(whoosh(0.4), w('normal') - 0.15, -28)
for k in range(5):
    place(tick(), w('normal') + 0.05 + k * 0.07, -30, -0.4 + 0.2 * k)
place(thunk(), w('presses') + 0.05, -21)
place(thunk(), w('ramp', 1) + 0.02, -20)
# airborne explainer (half speed footage has no sound of its own)
s8 = w('Once') - 0.08
place(whoosh(0.4), s8 - 0.08, -23)
place(hiss(1.2), s8 + 0.2, -31, -0.3)
place(hiss(0.8), w('rotate') - 0.3, -29, 0.3)
place(hiss(0.8), w('hold'), -29, 0)
place(blip(660, 0.18), w('compressed-gas'), -31)
place(blip(780, 0.18), w('rotate'), -31)
place(blip(990, 0.2), w('hold'), -31)
# Semi hop (real sound in the clip), 0-60, Rocket, ending
place(whoosh(0.35), w('It') - 0.12, -27)
place(whoosh(0.35), w('Zero') - 0.2, -27)
n0 = [x for x in words if x['w'] == '0.81'][0]
for k in range(9):
    place(tick(), n0['s'] + k * (n0['e'] - n0['s']) / 9, -29)
place(blip(1320, 0.25), n0['e'], -27)
place(thunk(), w('by') + 0.05, -24)
place(whoosh(0.4), w('And') - 0.15, -26)
for k in range(3):
    place(tick(), w('lists') + k * 0.08, -27)
place(blip(880, 0.2), w('Rocket'), -27)
place(thunk(), w('approved') + 0.04, -18)
place(whoosh(0.35), w('So') - 0.2, -27)
place(whoosh(0.3), w('A') - 0.16, -29)
write_wav(OUT, bus)
print('sfx', OUT, f'{DUR:.2f}s')
