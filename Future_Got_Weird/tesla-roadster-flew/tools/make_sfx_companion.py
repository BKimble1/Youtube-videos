#!/usr/bin/env python3
"""Synthesize the companion's effects bed from its resolved shot list (source/src/data/companion_shots.json).
Output: source/public/companion/sfx_companion.wav (48 kHz stereo, peaks well under the voice)."""
import json, os
import numpy as np
from sfxlib import SR, blip, hiss, hum, place, thunk, tick, whoosh, write_wav

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
plan = json.load(open(os.path.join(ROOT, 'source/src/data/companion_shots.json')))
bus = np.zeros((int(plan['duration'] * SR) + SR, 2))
F = 1 / 30
n = 0
def put(sig, t, g, pan=0.0):
    global n
    place(bus, sig, t, g, pan); n += 1

prev = None
for s in plan['shots']:
    k, a, b, c = s['kind'], s['a'], s['b'], s['cues']
    if k != 'foot' and a > 0:
        put(whoosh(), a - 0.03, -26, 0.25 if prev == 'foot' else -0.25)
    if k == 'tiles':
        for key in ('t1', 't2', 't3'): put(tick(), c[key], -25)
        put(blip(), c['ask'], -27)
    elif k == 'timeline':
        put(tick(), a + 6 * F, -25); put(thunk(), c['y28'] + 3 * F, -27)
    elif k == 'suction':
        put(hum(min(8.0, b - c['fan'])), c['fan'], -31)
        put(blip(660), c['two'], -28)
    elif k == 'fancar':
        put(thunk(), c['rules'] + 5 * F, -21)
    elif k == 'separate':
        put(blip(), c['sep'], -27)
    elif k == 'parts':
        for key in ('tank', 'valves', 'nozzles'): put(tick(), c[key], -26)
        put(thunk(), c['fuel'] + 4 * F, -23); put(thunk(), c['flame'] + 4 * F, -23)
    elif k == 'balloon':
        put(hiss(1.4), c['go'] + 10 * F, -27, -0.3)
    elif k == 'thrust':
        put(hiss(c['a1'] - c['a0'] + 0.2), c['a0'], -27, -0.4); put(hiss(c['b1'] - c['b0'] + 0.2), c['b0'], -28, 0.4)
    elif k == 'notshown':
        for key in ('i1', 'i2', 'i3'): put(thunk(), c[key], -27)
    elif k == 'accel':
        for i in range(10): put(tick(), a + 8 * F + i * 0.09, -27)
        put(blip(1320, 0.25), a + 8 * F + 0.81, -27); put(thunk(), c['tag'] + 4 * F, -22)
    elif k == 'gcompare':
        put(tick(), c['tires'], -26); put(tick(), c['g'], -26); put(blip(), c['thr'], -28)
    elif k == 'trims':
        for i in range(3): put(tick(), a + i * 5 * F, -26)
        for key in ('p', 't', 'r'): put(blip(), c[key] - 2 * F, -28)
        put(thunk(), c['stamp'] + 5 * F, -21)
    elif k == 'verdict':
        for key in ('s1', 's2', 's3', 'n1', 'n2'): put(tick(), c[key], -26)
    elif k == 'target':
        put(tick(), a + 6 * F, -25); put(tick(), a + 13 * F, -25); put(thunk(), a + 14 * F, -26)
    elif k == 'question':
        put(blip(), c['a'], -28); put(blip(990), c['b'], -28)
    prev = k

out = os.path.join(ROOT, 'source/public/companion/sfx_companion.wav')
write_wav(out, bus[: int(plan['duration'] * SR)])
print(f'{out}: {plan["duration"]}s, {n} cues, peak {20 * np.log10(np.abs(bus).max() + 1e-12):.1f} dBFS')
