#!/usr/bin/env python3
"""Measured (not auditioned) analysis of the Test Voice takes: onset, pauses, rough word-group segments, F0 contour, end-of-question pitch movement.
Usage: python3 tools/voice_analyse_v3.py   [r1|r2] -> audio/v3/voice/VOICE_ANALYSIS_<round>.json"""
import json, os, subprocess
import numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V = f'{ROOT}/audio/v3/voice'
SR = 48000
def load(path):
    out = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(out, dtype='<f4').astype(np.float64)
def rms_db(x, win=0.010):
    n = int(win * SR); m = len(x) // n
    r = np.sqrt(np.mean(x[:m * n].reshape(m, n) ** 2, axis=1)) + 1e-9
    return 20 * np.log10(r)
def f0(x, t0, t1):
    n = int(0.040 * SR); hop = int(0.010 * SR); out = []
    for s in range(int(t0 * SR), int(t1 * SR) - n, hop):
        w = x[s:s + n] * np.hanning(n)
        if np.sqrt(np.mean(w ** 2)) < 0.01: out.append((s / SR, None)); continue
        ac = np.correlate(w, w, 'full')[n - 1:]; ac /= ac[0] + 1e-12
        lo, hi = int(SR / 320), int(SR / 70)
        k = lo + int(np.argmax(ac[lo:hi]))
        out.append((s / SR, SR / k if ac[k] > 0.35 else None))
    return out
res = {}
import sys
ROUND = sys.argv[1] if len(sys.argv) > 1 else 'r2'
for take in ('A', 'B'):
    x = load(f'{V}/{ROUND}_take{take}.mp3' if ROUND == 'r2' else f'{V}/r1_take{take}_asecondago.mp3')
    d = rms_db(x)
    thr = np.max(d) - 38
    speech = d > thr
    segs, s = [], None
    for i, v in enumerate(speech):
        if v and s is None: s = i
        if (not v) and s is not None:
            segs.append([s * 0.01, i * 0.01]); s = None
    if s is not None: segs.append([s * 0.01, len(d) * 0.01])
    merged = []
    for a, b in segs:  # merge gaps < 60 ms (stop closures inside words)
        if merged and a - merged[-1][1] < 0.06: merged[-1][1] = b
        else: merged.append([a, b])
    gaps = [(round(merged[i][1], 3), round(merged[i + 1][0], 3), round(merged[i + 1][0] - merged[i][1], 3)) for i in range(len(merged) - 1)]
    big = [g for g in gaps if g[2] >= 0.25]
    hook_end = big[1][0] if len(big) > 1 else None
    tr = f0(x, merged[0][0], merged[-1][1])
    vals = [(t, v) for t, v in tr if v]
    # pitch movement over the last 0.35 s of the hook sentence ("right now?")
    h_end = big[1][0] if len(big) > 1 else merged[0][1]
    tail = [(t, v) for t, v in vals if h_end - 0.35 <= t <= h_end]
    mid = [(t, v) for t, v in vals if h_end - 0.9 <= t < h_end - 0.35]
    res[take] = {
        'duration_s': round(len(x) / SR, 3), 'first_speech_s': round(merged[0][0], 3), 'last_speech_s': round(merged[-1][1], 3),
        'speech_groups_s': [[round(a, 3), round(b, 3)] for a, b in merged], 'gaps_ge_0.25s': big, 'all_gaps_ge_0.06s': gaps,
        'f0_median_hz': round(float(np.median([v for _, v in vals])), 1),
        'hook_tail_f0_hz': {'before_tail_median': round(float(np.median([v for _, v in mid])), 1) if mid else None, 'last_0.35s_median': round(float(np.median([v for _, v in tail])), 1) if tail else None,
                            'last_0.35s_slope_hz_per_s': round(float(np.polyfit([t for t, _ in tail], [v for _, v in tail], 1)[0]), 1) if len(tail) > 4 else None},
        'peak_dBFS': round(float(20 * np.log10(np.max(np.abs(x)))), 2),
    }
    open(f'{V}/take{take}_48k.f32', 'wb').write(x.astype('<f4').tobytes()) if False else None
json.dump(res, open(f'{V}/VOICE_ANALYSIS_{ROUND}.json', 'w'), indent=1)
for t, r in res.items():
    print(t, 'dur', r['duration_s'], 'speech', r['first_speech_s'], '->', r['last_speech_s'])
    print('  groups', r['speech_groups_s'])
    print('  gaps>=.25', r['gaps_ge_0.25s'], '| f0 med', r['f0_median_hz'], '| tail', r['hook_tail_f0_hz'])
