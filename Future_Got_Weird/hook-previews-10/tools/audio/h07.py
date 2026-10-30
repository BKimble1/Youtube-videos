#!/usr/bin/env python3
"""HOOK 07 (beating heart outside the body): effects and ambience. Event times mirror source/src/h07/timeline.ts
(beats are keyed to the word "beating"; the window opens on "even" and closes after the narration ends)."""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sfxlib import *

H = '07'
W = json.load(open(os.path.join(ROOT, 'source/src/data/h07_words.json')))
word = lambda w: next(x for x in W['words'] if x['word'].lower().strip('….,').replace('’', "'") == w)
BEATING, EVEN, SPEECH_END = word('beating')['start'], word('even')['start'], W['speech_end']
PERIOD = 0.76
BEATS = [round(BEATING - 0.08 + (i - 2) * PERIOD, 3) for i in range(8)]  # 0.05 ... 5.37
FINAL = BEATS[7]
WIN_OPEN = EVEN + 0.08
WIN_CLOSE = SPEECH_END + 0.04

fx, amb = buf(), buf()

# ---- bed: quiet clinical room, the console's hum, a soft pump stroke after every beat ----
place(amb, room(DUR, 120, 2500), 0, -10, 'clinic room tone')
place(amb, hum(DUR, 100, (1, 2, 3, 5), 0.002), 0, -16, 'console hum')
for b in BEATS:
    place(amb, pump(0.42, 140), b + 0.24, -12)
LOG.append({'t': BEATS[0] + 0.24, 'sfx': 'pulsatile pump stroke after each beat (x8)', 'gain_db': -12})

# ---- heartbeats: a wet muscular lub at systole, a valve "dub" at end-systole ----
def lub(k=1.0):
    a = thump(0.26, 115, 46)
    w = lp(squelch(0.16, 220, 520, 0.7), 900) * 0.35
    n = max(len(a), len(w)); out = np.zeros(n); out[:len(a)] += a; out[:len(w)] += w
    if k > 1.2:  # the closing beat: a heavier body and a low sub tail
        tail = thump(0.5, 70, 32) * 0.8
        out = np.concatenate([out, np.zeros(max(0, len(tail) - n))]); out[:len(tail)] += tail
    return norm(lp(out, 1400))
def dub():
    a = thump(0.16, 150, 70); c = click(0.04, 600, 1400)
    a[:len(c)] += 0.25 * c
    return norm(lp(a, 1600))

for i, b in enumerate(BEATS):
    final = i == 7
    speaking = b < SPEECH_END
    g = 0 if final else (-5 if speaking else -2)
    place(fx, lub(1.4 if final else 1.0), b - 0.01, g + (3 if final else 0), f'heartbeat lub{" (closing beat)" if final else ""}')
    place(fx, dub(), b + 0.29, g - 5)
    # monitor QRS tick (very soft)
    place(fx, beep(0.07, 980), b - 0.04, -26 if not final else -20)
place(fx, swell(0.9, 52), FINAL - 0.75, -14, 'low swell into the closing beat')

# ---- cut window: tissue opens, perfusion flow inside, closes ----
place(fx, squelch(0.42, 260, 700, 0.5), WIN_OPEN, -10, 'window opens (soft wet tissue)')
place(fx, flow(1.7, 180, 900, 5), WIN_OPEN + 0.15, -13, 'coronary flow inside the cutaway')
place(fx, bubbles(1.2, 9, 300, 700, 3), EVEN + 0.6, -24, 'low blood-cell trickle')
place(fx, squelch(0.32, 600, 260, 0.5), WIN_CLOSE, -12, 'window closes')

mix(H, fx, amb, fx_lufs=-26.5, notes='heart in a box: room + hum + pump bed; lub-dub on every beat (keyed to "beating"), '
    'monitor ticks, cutaway open/flow/close, a heavier closing beat after the narration')
