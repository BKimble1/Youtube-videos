#!/usr/bin/env python3
"""Track the white car body in a footage window (for overlays that must stay on the real car).
Per frame: pixels that are bright and nearly colourless (V > vmin, S < smax) inside an optional search box; the largest
connected component near the previous position is taken as the body. Prints JSON lines: t (file seconds), bbox
(x0, y0, x1, y1 in 1920x1080 source px), centroid, and the principal-axis angle (deg, image coords).
usage: track_car.py <file> <start_s> <dur_s> [x0 y0 x1 y1]   env: VMIN (175) SMAX (55) MINPX (400)"""
import json, os, subprocess, sys
import numpy as np
from scipy import ndimage

f, ss, dur = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
box = list(map(int, sys.argv[4:8])) if len(sys.argv) >= 8 else [0, 0, 1920, 1080]
VMIN, SMAX, MINPX = int(os.environ.get('VMIN', 175)), int(os.environ.get('SMAX', 55)), int(os.environ.get('MINPX', 400))
W, H = 1920, 1080
raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(ss), '-i', f, '-t', str(dur), '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                     capture_output=True).stdout
frames = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)
prev = None
for i, fr in enumerate(frames):
    x0, y0, x1, y1 = box
    sub = fr[y0:y1, x0:x1].astype(np.int16)
    mx, mn = sub.max(2), sub.min(2)
    sat = (mx - mn) * 255 // np.maximum(mx, 1)
    m = (mx > VMIN) & (sat < SMAX)
    m = ndimage.binary_opening(m, iterations=1)
    lab, n = ndimage.label(m)
    if n == 0:
        print(json.dumps({'t': round(ss + i / 30, 3), 'none': True})); continue
    sizes = ndimage.sum(m, lab, range(1, n + 1))
    cands = [k + 1 for k in np.argsort(-sizes)[:5] if sizes[k] >= MINPX]
    if not cands:
        print(json.dumps({'t': round(ss + i / 30, 3), 'none': True})); continue
    if prev is not None:
        cents = ndimage.center_of_mass(m, lab, cands)
        k = cands[int(np.argmin([np.hypot(c[1] + x0 - prev[0], c[0] + y0 - prev[1]) - 0.002 * sizes[cands[j] - 1] for j, c in enumerate(cents)]))]
    else:
        k = cands[0]
    ys, xs = np.nonzero(lab == k)
    xs = xs + x0; ys = ys + y0
    cx, cy = xs.mean(), ys.mean()
    cov = np.cov(np.stack([xs - cx, ys - cy]))
    ev, evec = np.linalg.eigh(cov)
    ax = evec[:, 1]
    ang = np.degrees(np.arctan2(ax[1], ax[0]))
    if ang > 90: ang -= 180
    if ang < -90: ang += 180
    prev = (cx, cy)
    print(json.dumps({'t': round(ss + i / 30, 3), 'bbox': [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())],
                      'c': [round(cx, 1), round(cy, 1)], 'ang': round(ang, 2), 'px': int(len(xs))}))
