#!/usr/bin/env python3
"""V4 narration timeline: the selected take (Test Voice, take A of the 64-word V4 generation, 21.76 s) with its long between-phrase pauses SHORTENED by removing audio from the middle of each silent gap.
Words are untouched (no time-stretch, no speed change, no pitch change, nothing inside a word is cut); only silence between speech groups is removed, 6 ms equal-power joins inside the silence.
Target gaps (seconds) are set per gap: short natural breaths (about 0.2-0.3 s) between phrases, one deliberate 0.45 s beat after "coast." so the wave's aftermath can register before the explanation.
Outputs audio/v7/voice/voice_v4_timeline.wav (mono 48 kHz), source/src/film4/voice4.json (film-time words, groups, edit list). Usage: python3 tools/build_voice_v4.py"""
import json, os, wave
import numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V = f'{ROOT}/audio/v7/voice'
SR = 48000
TARGET = [0.22, 0.24, 0.10, 0.28, 0.26, 0.24, 0.28, 0.45, 0.32, 0.21, 0.30, 0.30]  # gap i = between speech group i and i+1 of the take
def load(p):
    w = wave.open(p); x = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(np.float64) / 32768; return x
x = load(f'{V}/v4_takeA_48k.wav')
def groups(sig, thr_db=30, merge=0.09):
    n = int(0.010 * SR); m = len(sig) // n
    d = 20 * np.log10(np.sqrt(np.mean(sig[:m * n].reshape(m, n) ** 2, axis=1)) + 1e-9)
    sp = d > d.max() - thr_db; segs, s = [], None
    for i, v in enumerate(sp):
        if v and s is None: s = i
        if (not v) and s is not None: segs.append([s * 0.01, i * 0.01]); s = None
    if s is not None: segs.append([s * 0.01, m * 0.01])
    o = []
    for a, b in segs:
        if o and a - o[-1][1] < merge: o[-1][1] = b
        else: o.append([a, b])
    return o
G = groups(x)
assert len(G) == 13, len(G)
gaps = [(G[i][1], G[i + 1][0]) for i in range(12)]
pieces, cuts, removed_before = [], [], []   # cuts: (take-local start, end of removed region)
pos = 0.0
rm_total = 0.0
for i, (a, b) in enumerate(gaps):
    want = TARGET[i]; have = b - a
    if have > want + 0.005:
        r0 = a + want / 2; r1 = b - want / 2           # remove the middle of the silence, keep `want` seconds of it
        pieces.append((pos, r0)); pos = r1; cuts.append((r0, r1)); rm_total += r1 - r0
pieces.append((pos, len(x) / SR))
f6 = int(0.006 * SR)
out = []
for k, (a, b) in enumerate(pieces):
    seg = x[int(round(a * SR)):int(round(b * SR))].copy()
    if k > 0: seg[:f6] *= np.sin(np.linspace(0, np.pi / 2, f6))
    if k < len(pieces) - 1: seg[-f6:] *= np.cos(np.linspace(0, np.pi / 2, f6))
    out.append(seg)
# equal-power overlap-add at the joins (the faded ends overlap by f6 samples inside the silence)
y = out[0]
for seg in out[1:]:
    y = np.concatenate([y[:-f6], y[-f6:] + seg[:f6], seg[f6:]])
pcm = np.clip(y, -1, 1)
with wave.open(f'{V}/voice_v4_timeline.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((pcm * 32767).astype('<i2').tobytes())
def shift(t):  # film time of a take-local time
    s = 0.0
    for r0, r1 in cuts:
        if t >= r1 - 1e-9: s += r1 - r0
        elif t > r0: raise ValueError(f'time {t} inside a removed region')
    return t - s
al = json.load(open(f'{V}/v4_takeA_alignment.json'))['words']
words = []
for w in al:
    if w['text'] == 'east—about':   # one Scribe token, two words: 'about' starts with the next speech group
        words.append({'text': 'east—', 'start': round(shift(w['start']), 3), 'end': round(shift(G[1][1]), 3)})
        words.append({'text': 'about', 'start': round(shift(G[2][0]), 3), 'end': round(shift(w['end']), 3)})
    else:
        words.append({'text': w['text'], 'start': round(shift(w['start']), 3), 'end': round(shift(min(w['end'], max(g1 for g0, g1 in G if g0 - 0.05 <= w['start'] <= g1) if any(g0 - 0.05 <= w['start'] <= g1 for g0, g1 in G) else w['end']))), 'src_start': w['start']})
GF = [[round(shift(a), 2), round(shift(b), 2)] for a, b in G]
json.dump({'film_s': round(len(y) / SR, 3), 'sr': SR, 'removed_s': round(rm_total, 3), 'edits': [{'removed_take_local': [round(a, 3), round(b, 3)]} for a, b in cuts], 'target_gaps_s': TARGET, 'words': words, 'groups': GF},
          open(f'{ROOT}/source/src/film4/voice4.json', 'w'), indent=1, ensure_ascii=False)
print('take', len(x) / SR, '-> film voice', round(len(y) / SR, 3), 'removed', round(rm_total, 3))
print('groups (film s):', GF)
print('gaps now:', [round(GF[i + 1][0] - GF[i][1], 2) for i in range(12)])
print(' '.join(f"{w['text']}@{w['start']:.2f}" for w in words))
