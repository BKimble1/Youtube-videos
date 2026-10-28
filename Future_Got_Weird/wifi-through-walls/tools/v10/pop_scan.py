#!/usr/bin/env python3
"""One-frame pops: a frame that differs from both neighbours while the neighbours match each other (a single glitched
frame hides between two similar ones, which a consecutive-difference scan reads as an ordinary pair of changes).
score = min(diff(prev, f), diff(f, next)) - diff(prev, next), on 135x240 RGB, mean absolute difference (0-255).
usage: python3 -I tools/v4/pop_scan.py <mp4> <out.json> [threshold=1.2]"""
import json, subprocess, sys
import numpy as np

M, OUT = sys.argv[1], sys.argv[2]
TH = float(sys.argv[3]) if len(sys.argv) > 3 else 1.2
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', M, '-vf', 'scale=135:240', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
f = np.frombuffer(raw, np.uint8).reshape(-1, 240, 135, 3).astype(np.float32)
d = lambda a, b: float(np.abs(f[a] - f[b]).mean())
pops = []
for i in range(1, len(f) - 1):
    a, b, c = d(i - 1, i), d(i, i + 1), d(i - 1, i + 1)
    if min(a, b) - c > TH:
        pops.append({'frame': i, 't': round(i / 30, 3), 'prev': round(a, 2), 'next': round(b, 2), 'skip': round(c, 2), 'score': round(min(a, b) - c, 2)})
json.dump({'frames': len(f), 'threshold': TH, 'pops': pops}, open(OUT, 'w'), indent=1)
print(len(f), 'frames; pops:', pops)
