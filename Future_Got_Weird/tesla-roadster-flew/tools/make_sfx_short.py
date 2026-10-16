#!/usr/bin/env python3
"""Synthesize the Short's effects bed (original, procedural; no library sounds).
Cue times follow ShortMain.tsx's shot list and the selected take's word times.
Output: source/public/short/sfx_short.wav (48 kHz stereo, peaks well under the voice)."""
import json, os
import numpy as np
from sfxlib import SR, blip, hiss, hum, place as _place, thunk, tick, whoosh, write_wav

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'source/public/short/sfx_short.wav')
DUR = 42.1
words = json.load(open(os.path.join(ROOT, 'source/src/data/short_words.json')))['words']

def at(word, after=0.0):
    return next(w['s'] for w in words if w['w'].startswith(word) and w['s'] >= after)

bus = np.zeros((int(DUR * SR), 2))
place = lambda sig, t, g, pan=0.0: _place(bus, sig, t, g, pan)

cues = []
# sh07 suction (10.6 s): iris whoosh + fan hum under "fans pull air…"
cues += [('whoosh', 10.58, -24, 0), ('hum', 10.75, -30, 0)]
# sh08 thrusters (13.95 s): push whoosh; jets A (f 8–46), jets B (f 58–88)
t8 = 13.95
cues += [('whoosh', t8 - 0.02, -25, 0.2), ('hiss1', t8 + 8 / 30, -27, -0.4), ('hiss2', t8 + 58 / 30, -28, 0.4)]
# sh10 trims (21.88 s): card slides, Rocket pop, stamp
t10 = 21.88
cues += [('tick', t10 + k * 5 / 30, -26, 0) for k in range(3)]
cues += [('blip', at('Rocket') - 2 / 30, -27, 0), ('thunk', at('approved') + 5 / 30, -20, 0)]
# sh11 accel (29.85 s): whoosh, stopwatch ticks for 0.81 s, attribution stamp
t11 = 29.85
cues += [('whoosh', t11 - 0.02, -25, -0.2)]
cues += [('tick', t11 + 8 / 30 + k * 0.09, -27, 0) for k in range(10)]
cues += [('blip2', t11 + 8 / 30 + 0.81, -27, 0), ('thunk', at("Tesla's", 32) + 4 / 30, -21, 0)]
# sh12 target (34.55 s): whoosh, two year flips, landing
t12 = 34.55
cues += [('whoosh', t12 - 0.02, -26, 0.2), ('tick', t12 + 6 / 30, -25, 0), ('tick', t12 + 13 / 30, -25, 0), ('thunk', t12 + 14 / 30, -26, 0)]

make = {'whoosh': whoosh, 'hum': lambda: hum(3.1), 'hiss1': lambda: hiss(1.25), 'hiss2': lambda: hiss(1.0),
        'tick': tick, 'thunk': thunk, 'blip': blip, 'blip2': lambda: blip(1320, 0.25)}
for name, t, g, pan in cues:
    place(make[name](), t, g, pan)

peak = np.abs(bus).max()
write_wav(OUT, bus)
json.dump([{'cue': n, 't': round(t, 3), 'gain_db': g} for n, t, g, _ in cues], open(os.path.join(ROOT, 'audio/short/sfx_cues_short.json'), 'w'), indent=1)
print(f'{OUT}: {DUR}s, {len(cues)} cues, peak {20*np.log10(peak+1e-12):.1f} dBFS')
