#!/usr/bin/env python3
"""Speech-to-SFX ratio of the V4 mix (300-3400 Hz band, 100 ms windows, voiced windows only): a masking PROXY, not a listening test.
Usage: python3 tools/audio_ratio_v4.py [mix_dir] -> prints median / 5th percentile / worst windows"""
import sys, wave, numpy as np
ROOT = __import__('os').path.dirname(__import__('os').path.dirname(__import__('os').path.abspath(__file__)))
D = sys.argv[1] if len(sys.argv) > 1 else f'{ROOT}/audio/v7/v4/stems'
def load(p):
    w = wave.open(p); x = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(float) / 32768
    return x.reshape(-1, w.getnchannels())[:, 0], w.getframerate()
v, sr = load(f'{D}/voice_only_v4.wav'); s, _ = load(f'{D}/sfx_only_v4.wav')
def band(x):
    X = np.fft.rfft(x * np.hanning(len(x))); f = np.fft.rfftfreq(len(x), 1 / sr)
    return float(np.sum(np.abs(X[(f >= 300) & (f < 3400)]) ** 2))
n = int(0.1 * sr); out = []
env = np.sqrt(np.convolve(v ** 2, np.ones(int(0.02 * sr)) / int(0.02 * sr), mode='same'))
thr = 0.05 * env.max()
for i in range(0, len(v) - n, n):
    if np.mean(env[i:i + n] > thr) < 0.8: continue
    out.append((i / sr, 10 * np.log10((band(v[i:i + n]) + 1e-18) / (band(s[i:i + n]) + 1e-18))))
r = np.array([o[1] for o in out])
print(f'voiced 100 ms windows {len(r)}: median {np.median(r):.1f} dB, 5th pct {np.percentile(r, 5):.1f} dB, 1st pct {np.percentile(r, 1):.1f} dB, worst {r.min():.1f} dB at {out[int(np.argmin(r))][0]:.2f} s; windows below +6 dB: {int(np.sum(r < 6))} ({100 * np.mean(r < 6):.1f} %)')
worst = sorted(out, key=lambda o: o[1])[:12]
print('worst windows (s, dB):', [(round(a, 2), round(b, 1)) for a, b in worst])
