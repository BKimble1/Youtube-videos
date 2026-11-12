#!/usr/bin/env python3
"""Continuity audit: finds frames whose change from the previous frame is out of line with their neighbours (pops,
flashes, teleports, layer swaps), globally and per screen region (a 6x8 grid, so a small pop inside a large still
area is caught too). usage: spike_audit.py <video> <out.json> [planned cut times...]"""
import json, subprocess, sys
import numpy as np
src, out = sys.argv[1:3]
cuts = [float(x) for x in sys.argv[3:]]
W, H = 270, 480
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-vf', f'scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3).astype(np.float32)
fr = fr[:, :int(H * 0.74)]  # above the caption band (captions change on speech, not on picture)
n = len(fr)
D = np.abs(np.diff(fr, axis=0)).mean(axis=3)  # n-1, h, w
gy, gx = 8, 6
hh, ww = D.shape[1] // gy, D.shape[2] // gx
cells = D[:, :gy * hh, :gx * ww].reshape(n - 1, gy, hh, gx, ww).mean(axis=(2, 4)).reshape(n - 1, -1)
glob = D.mean(axis=(1, 2))
res = []
for i in range(n - 1):
    t = (i + 1) / 30
    if any(abs(t - c) < 0.05 for c in cuts): continue
    lo, hi = max(0, i - 4), min(n - 1, i + 5)
    nb = [j for j in range(lo, hi) if j != i]
    g_ref = np.median(glob[nb]) + 0.6
    c_ref = np.median(cells[nb], axis=0) + 1.2
    gr = glob[i] / g_ref
    cr = cells[i] / c_ref
    k = int(np.argmax(cr))
    if gr > 1.8 or (cr[k] > 3.0 and cells[i][k] > 4.0):
        res.append({'frame': i + 1, 't': round(t, 3), 'global_ratio': round(float(gr), 2), 'cell': [k // gx, k % gx], 'cell_ratio': round(float(cr[k]), 2), 'cell_change': round(float(cells[i][k]), 1)})
json.dump(res, open(out, 'w'), indent=1)
for r in res: print(r)
print(len(res), 'flagged of', n - 1)
