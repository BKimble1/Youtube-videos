#!/usr/bin/env python3
"""Short v3 narration: the selected Test Voice take with its pauses tightened (no time-stretch, no pitch change).
Pauses found with silencedetect (-38 dB, >=120 ms). Sentence-length pauses (>=0.33 s) become SENT s, shorter ones
become at most COMMA s; each cut is made in the middle of the silence with a 12 ms crossfade.
Usage: build_short_v3_narration.py take.mp3 out.wav [map.json]   (map.json: old->new time anchors for retiming)"""
import json, re, subprocess, sys
import numpy as np

SR = 48000
SENT, COMMA, LEAD, TAIL, XF = 0.20, 0.12, 0.03, 0.20, 0.012
src, out = sys.argv[1], sys.argv[2]
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
x = np.frombuffer(raw, np.float32).copy()
dur = len(x) / SR
sil = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', src, '-af', 'silencedetect=n=-38dB:d=0.12', '-f', 'null', '-'],
                     capture_output=True, text=True).stderr
st = [float(v) for v in re.findall(r'silence_start: ([\d.]+)', sil)]
en = [float(v) for v in re.findall(r'silence_end: ([\d.]+)', sil)]
# speech onset/offset by energy (the takes have no detectable edge silence at -38 dB/120 ms)
env = np.convolve(np.abs(x), np.ones(480) / 480, 'same')
thr = 10 ** (-38 / 20)
on = max(0.0, np.argmax(env > thr) / SR - 0.01)
off = min(dur, (len(env) - np.argmax(env[::-1] > thr)) / SR + 0.04)
keep = []            # (start, end) spans of the source to keep
cur = on
anchors = [(on, LEAD)]
t_new = LEAD
for s, e in zip(st, en):
    if s <= on + 0.02 or e >= off - 0.02:
        continue
    L = e - s
    target = SENT if L >= 0.33 else min(L, COMMA)
    cut = L - target
    if cut <= 0.005:
        continue
    mid = (s + e) / 2
    a, b = mid - cut / 2, mid + cut / 2
    keep.append((cur, a))
    t_new += a - cur
    anchors.append((b, t_new))
    cur = b
keep.append((cur, off))
t_new += off - cur
anchors.append((off, t_new))
n = int(XF * SR)
ramp = np.linspace(0, 1, n, dtype=np.float32)
pieces = [np.zeros(int(LEAD * SR), np.float32)]
for i, (a, b) in enumerate(keep):
    seg = x[int(a * SR):int(b * SR)].copy()
    if i > 0:
        seg[:n] *= ramp
    if i < len(keep) - 1:
        seg[-n:] *= ramp[::-1]
    pieces.append(seg)
pieces.append(np.zeros(int(TAIL * SR), np.float32))
y = np.concatenate(pieces)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-ac', '2', '-c:a', 'pcm_s16le', out],
               input=y.tobytes(), check=True)
print(f'{src.split("/")[-1]}: {dur:.2f}s -> {len(y)/SR:.2f}s (speech {LEAD:.2f}-{t_new:.2f}), {len(keep)-1} pauses tightened')
if len(sys.argv) > 3:
    json.dump({'source': src, 'anchors': [[round(a, 4), round(b, 4)] for a, b in anchors]}, open(sys.argv[3], 'w'))
