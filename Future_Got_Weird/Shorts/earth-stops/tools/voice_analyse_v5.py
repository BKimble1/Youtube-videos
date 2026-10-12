#!/usr/bin/env python3
"""Measured (not auditioned) comparison of the two V2 narration takes: speech groups (energy segmentation), pauses, rate. Writes audio/v5/voice/VOICE_ANALYSIS_v2.json.
A comparison of timing only: it says nothing about performance quality. Usage: python3 tools/voice_analyse_v5.py"""
import json, os, subprocess
import numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V = f'{ROOT}/audio/v5/voice'
SR = 48000
def load(p):
    return np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, dtype='<f4').astype(np.float64)
def groups(x):
    n = int(0.010 * SR); m = len(x) // n
    d = 20 * np.log10(np.sqrt(np.mean(x[:m * n].reshape(m, n) ** 2, axis=1)) + 1e-9)
    sp = d > d.max() - 38
    segs, s = [], None
    for i, v in enumerate(sp):
        if v and s is None: s = i
        if (not v) and s is not None: segs.append([s * 0.01, i * 0.01]); s = None
    if s is not None: segs.append([s * 0.01, m * 0.01])
    out = []
    for a, b in segs:
        if out and a - out[-1][1] < 0.06: out[-1][1] = b
        else: out.append([a, b])
    return out
res = {}
for t in ('A', 'B'):
    x = load(f'{V}/v2_take{t}.mp3'); g = groups(x)
    gaps = [(round(g[i][1], 2), round(g[i + 1][0], 2), round(g[i + 1][0] - g[i][1], 2)) for i in range(len(g) - 1)]
    res[t] = {'duration_s': round(len(x) / SR, 3), 'first_speech_s': round(g[0][0], 2), 'last_speech_s': round(g[-1][1], 2), 'groups': [[round(a, 2), round(b, 2)] for a, b in g], 'gaps_ge_0.25s': [q for q in gaps if q[2] >= 0.25], 'peak_dBFS': round(float(20 * np.log10(np.abs(x).max())), 2)}
json.dump(res, open(f'{V}/VOICE_ANALYSIS_v2.json', 'w'), indent=1)
for t in res: print(t, res[t]['duration_s'], res[t]['first_speech_s'], res[t]['last_speech_s'], '\n  gaps>=0.25:', res[t]['gaps_ge_0.25s'], '\n  groups:', res[t]['groups'])
