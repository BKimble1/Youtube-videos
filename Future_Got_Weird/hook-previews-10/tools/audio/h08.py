#!/usr/bin/env python3
"""HOOK 08 (infrared contact lenses): effects and ambience. Event times mirror source/src/h08/Hook.tsx (TL, PULSES,
HERO_EV, BURST), derived from the same word timings."""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sfxlib import *
H = '08'
W = json.load(open(os.path.join(ROOT, 'source/src/data/h08_words.json')))['words']
def ws(w): return [x for x in W if x['word'].lower().strip('.…,') == w][0]['start']
wDetect, wInfrared, wSignals, wEven, wEyes, wClosed = ws('detect'), ws('infrared'), ws('signals'), ws('even'), ws('eyes'), ws('closed')

# ---- timeline (keep in step with Hook.tsx) ----
LID_SHUT = 0.45
CLEAR0, CLEAR1 = wDetect - 0.25, wDetect + 0.3
DIVE0, DIVE1 = wSignals - 0.24, wEven + 0.07
OUT0 = wClosed + 0.06
UNCLEAR0 = 4.92
PULSES = [(0.2, 0.56), (1.3, 1.62), (wInfrared + 0.3, wInfrared + 0.64), (wEven - 0.05, wEven + 0.3),
          (wEyes + 0.08, wEyes + 0.4), (4.3, 4.6), (5.0, 5.32), (5.7, 6.1)]
HERO_EV = [(wEven, wEven + 0.24, wEyes - 0.16), (wEyes + 0.12, wEyes + 0.32, wClosed + 0.02)]
BURST = wClosed + 0.02
FACE_PULSES = [0, 6, 7]  # pulses seen with the LED in frame (its tick lands about 0.3 s before arrival)

fx, amb = buf(), buf()
# bed: quiet lab room tone and a low, slowly beating pad (eerie, steady for the whole clip)
place(amb, room(DUR, 120, 2200), 0, -6, 'lab room tone')
place(amb, pad((55, 82.4, 110, 164.8), DUR, 0.003, 500), 0, -3, 'low pad')

def led_tick():
    """a tiny electrical tick with a faint buzz: the LED switching on"""
    n = int(0.12 * SR); x = tt(n)
    s = np.zeros(n)
    k = tick(0.03, 3600); s[:len(k)] += 0.6 * k
    s += 0.25 * np.sign(np.sin(2 * np.pi * 120 * x)) * np.exp(-x / 0.05)
    return norm(bp(s, 200, 9000))

def ping(f=2600, dur=0.5):
    """a small glassy conversion ping (soft, not a cartoon beep)"""
    n = int(dur * SR); x = tt(n)
    s = sum(np.sin(2 * np.pi * f * k * x + k) * np.exp(-x / (0.09 / k)) / k for k in (1, 2.01, 2.97))
    return norm(s * env(n, 0.004, dur * 0.5))

# lid closing: a soft, damp skin movement
place(fx, squelch(0.3, 260, 520, 0.5), 0.05, -14, 'lid closing')
# LED ticks for the pulses seen in frame
for k in FACE_PULSES:
    a, b = PULSES[k]
    place(fx, led_tick(), max(0.0, a - 0.32), -12, f'LED on (pulse {k + 1})')
# conversion pings on every pulse arrival (green light made in the lens), quieter while zoomed in on the material
for k, (a, b) in enumerate(PULSES):
    if k in (3, 4):
        continue
    place(fx, ping(2400 + 120 * (k % 3), 0.45), a + 0.06, -10, f'conversion glow (pulse {k + 1})')
    place(fx, shimmer(0.4, 5200, 3000), a + 0.08, -20)
# the cutaway opening in the lid: soft tissue
place(fx, squelch(0.5, 220, 640, 0.5), CLEAR0 + 0.05, -12, 'cutaway opens')
place(fx, creak(0.35, 160, 120, 45), CLEAR0 + 0.15, -20)
# the dive into the lens: a low tonal swell (no whoosh)
place(fx, swell(1.2, 62), DIVE0 - 0.1, -12, 'dive swell')
# material scale: absorption ticks into the marked crystal and its emission
for a1, a2, e in HERO_EV:
    place(fx, metal_click(0.12, 1400, (1.0, 2.3), 0.03), a1, -14, 'NIR absorbed')
    place(fx, metal_click(0.12, 1700, (1.0, 2.3), 0.03), a2, -12, 'NIR absorbed')
    place(fx, ping(3100, 0.5), e, -7, 'green emission')
# neighbouring crystals absorbing during the two material pulses: a faint crackle
for k in (3, 4):
    a, b = PULSES[k]
    place(fx, sizzle(b - a + 0.1, 70, 3000, 9000), a, -22, f'crystals absorbing (pulse {k + 1})')
# the burst on "closed": many crystals emitting together
place(fx, shimmer(0.9, 6200, 2600), BURST, -6, 'burst of conversions')
place(fx, ping(2200, 0.7), BURST + 0.02, -9)
# the clearing closes over the eye as the camera pulls back
place(fx, squelch(0.4, 520, 240, 0.5), UNCLEAR0 + 0.05, -16, 'cutaway closes')
mix(H, fx, amb, fx_lufs=-27, notes='HOOK 08 infrared contacts: LED ticks, conversion pings, tissue cutaway, crystal absorption/emission')
