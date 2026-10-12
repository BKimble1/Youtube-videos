#!/usr/bin/env python3
"""V3 narration timeline: the selected take (Test Voice, take B, 18.24 s) is cut ONLY at its inter-sentence pauses and the sentences are placed on the staged film timeline.
Words are untouched (no speed change, no stretch, no pitch change); only the silent gaps between sentence groups are lengthened where the picture needs an action beat
(the ocean surge after "And the ocean."). Outputs audio/v6/voice/voice_v3_timeline.wav (mono 48 kHz, FILM_S long), source/src/film3/voice3.json (film-time words and groups).
Usage: python3 tools/build_voice_v3.py"""
import json, os, wave
import numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V = f'{ROOT}/audio/v6/voice'
SR = 48000
FILM_S = 24.8
# segments of the take: (name, take-local start, take-local end, shift seconds added to put it on the film timeline). Cut points sit inside the voice's own pauses.
SEGS = [
    ('S1', 0.00, 5.05, 0.00),     # If Earth stopped, you'd keep moving east - about a thousand miles an hour at the equator.
    ('S2', 5.05, 6.95, 0.00),     # Loose objects keep going too.
    ('S3', 6.95, 8.00, 0.00),     # So does the air.
    ('S4', 8.00, 9.20, 0.84),     # And the ocean.   (the sea builds in the 1.2 s before it is named)
    ('S5', 9.20, 11.95, 3.69),    # You don't feel the spin because you move with Earth.   (after the surge lands)
    ('S6', 11.95, 14.95, 4.35),   # Closer to the poles, that starting speed is lower.
    ('S7', 14.95, 18.24, 4.70),   # The stop is imaginary. The motion is real.
]
def load(p):
    w = wave.open(p); x = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(np.float64) / 32768; return x, w.getframerate()
x, sr = load(f'{V}/v3_takeB_48k.wav'); assert sr == SR
out = np.zeros(int(FILM_S * SR) + 1)
fade = int(0.006 * SR)
for name, a, b, shift in SEGS:
    seg = x[int(a * SR):int(b * SR)].copy()
    seg[:fade] *= np.linspace(0, 1, fade); seg[-fade:] *= np.linspace(1, 0, fade)
    k = int(round((a + shift) * SR)); out[k:k + len(seg)] += seg
out = out[:int(FILM_S * SR)]
pcm = np.clip(out, -1, 1)
with wave.open(f'{V}/voice_v3_timeline.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((pcm * 32767).astype('<i2').tobytes())
al = json.load(open(f'{V}/v3_takeB_alignment.json'))['words']
def shift_for(t):
    for name, a, b, s in SEGS:
        if a <= t < b: return name, s
    return SEGS[-1][0], SEGS[-1][3]
words = []
for w in al:
    n, s = shift_for(w['start']); words.append({'text': w['text'], 'start': round(w['start'] + s, 3), 'end': round(w['end'] + s, 3), 'seg': n})
# speech groups (energy segmentation of the take, shifted)
import subprocess
def groups(sig):
    n = int(0.010 * SR); m = len(sig) // n
    d = 20 * np.log10(np.sqrt(np.mean(sig[:m * n].reshape(m, n) ** 2, axis=1)) + 1e-9)
    sp = d > d.max() - 38; segs, s = [], None
    for i, v in enumerate(sp):
        if v and s is None: s = i
        if (not v) and s is not None: segs.append([s * 0.01, i * 0.01]); s = None
    if s is not None: segs.append([s * 0.01, m * 0.01])
    o = []
    for a, b in segs:
        if o and a - o[-1][1] < 0.06: o[-1][1] = b
        else: o.append([a, b])
    return o
G = [[round(a, 2), round(b, 2)] for a, b in groups(out)]
json.dump({'film_s': FILM_S, 'sr': SR, 'segments': [{'name': n, 'take_a': a, 'take_b': b, 'shift_s': s} for n, a, b, s in SEGS], 'words': words, 'groups': G}, open(f'{ROOT}/source/src/film3/voice3.json', 'w') if os.path.isdir(f'{ROOT}/source/src/film3') else open('/dev/stdout', 'w'), indent=1, ensure_ascii=False)
print('groups', G)
print('last word end', words[-1]['end'])
