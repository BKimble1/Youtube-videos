#!/usr/bin/env python3
"""HOOK 06 (zombie snail) effects and ambience. Event times mirror source/src/h06/timeline.ts: they are recomputed
here from the same words file with the same offsets, so picture and sound stay in step."""
import os, sys, json
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sfxlib import *
H = '06'
W = json.load(open(os.path.join(ROOT, 'source/src/data/h06_words.json')))['words']
def ws(word):
    k = lambda s: ''.join(c for c in s.lower().replace('’', "'") if c.isalpha() or c == "'")
    return next(x for x in W if k(x['word']) == k(word))['start']
birds = ws('birds')
EV = dict(pushStart=ws('turns'), cutOpen=ws('into'), cutFull=ws('pulsing') + 0.12, lure=ws('lure'),
          birdHop1=birds - 0.08, pullStart=birds + 0.08, cutClose=birds + 0.12, notice=birds + 0.80,
          blink=birds + 1.10, birdHop2=birds + 1.36)
HOP = 0.26
PULSE_F, PULSE_T0 = 1.05, ws('pulsing')
beats = [PULSE_T0 + k / PULSE_F for k in range(-4, 4) if 0 <= PULSE_T0 + k / PULSE_F < 6.0]

fx, amb = buf(), buf()
# bed: damp outdoor air with distant insects, and a very quiet low eerie tone under it
place(amb, forest(), 0, 0, 'forest air bed')
place(amb, pad((49, 73.4, 98, 146.8), DUR, 0.005, 420) * win(0.0, 6.0, 0.01, 0.01), 0, -9, 'low eerie pad')

# the broodsac's pulse: a soft wet throb on every beat (louder while the camera is close)
def throb():
    a = lp(squelch(0.32, 180, 520, 0.7), 1800)
    b = thump(0.26, 70, 42)
    n = max(len(a), len(b)); out = np.zeros(n); out[:len(a)] += a; out[:len(b)] += 0.8 * b
    return norm(out)
for tb in beats:
    close = EV['pushStart'] <= tb <= EV['pullStart'] + 0.3
    place(fx, throb(), tb - 0.02, -3 if close else -8, f'broodsac throb @{tb:.2f}')
# inside the cutaway: the pumping wave moving the packed cysts (a slow peristaltic push) on the beats within it
for tb in beats:
    if EV['cutOpen'] < tb < EV['cutClose']:
        place(fx, lp(pump(0.6, 140), 1400), tb, -6, f'pumping wave @{tb:.2f}')
        place(fx, bubbles(0.45, 22, 700, 1500, int(tb * 10)) * env(int(0.45 * SR), 0.05, 0.25), tb + 0.08, -16, 'cysts jostle')
# the snail crawling (very soft slime movement at the start)
place(fx, squelch(0.9, 220, 420, 0.5), 0.0, -18, 'slow crawl')
# the cut window opens (wet tissue parting) and closes
place(fx, squelch(0.42, 320, 900, 0.6), EV['cutOpen'], -7, 'cut window opens')
place(fx, swell(1.7, 62), EV['cutOpen'] + 0.1, -14, 'eerie swell in the cutaway')
place(fx, squelch(0.34, 700, 260, 0.6), EV['cutClose'], -11, 'window closes')
# the robin: lands on the twig, a single alarm "tic" as it notices, then hops closer
for h in (EV['birdHop1'], EV['birdHop2']):
    place(fx, puff(0.12, 500, 3000), h, -16, 'hop push-off')
    place(fx, tick(0.03, 3200), h + HOP, -10, 'feet land on twig')
    place(fx, rustle(0.35, 2500, 7000), h + HOP + 0.01, -15, 'twig and leaves rustle')
place(fx, chirp_bird(4200, 3600, 0.05), EV['notice'] + 0.06, -15, 'robin tic call')
place(fx, chirp_bird(4400, 3800, 0.04), EV['notice'] + 0.2, -19, 'robin tic call 2')

mix(H, fx, amb, fx_lufs=-27, notes='broodsac throbs on every pulse beat; cutaway pumping; robin landing, call, hop')
