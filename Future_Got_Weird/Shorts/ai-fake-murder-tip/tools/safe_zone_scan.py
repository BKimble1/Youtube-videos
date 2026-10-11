#!/usr/bin/env python3
"""Safe-zone scan of a decoded master: every frame, extent of ink-coloured (#162A32) pixels (all outlines/text/objects carry the ink outline).
Usage: safe_zone_scan.py file.mp4 [x0 x1 y0 y1]   default safe zone x 100-870, y 220-1440. Prints worst extents and the frames outside."""
import sys, subprocess, numpy as np
f = sys.argv[1]
X0, X1, Y0, Y1 = (int(v) for v in sys.argv[2:6]) if len(sys.argv) >= 6 else (100, 870, 220, 1440)
W, H = 1080, 1920
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', f, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
n = 0; bad = []
ext = [W, 0, H, 0]
while True:
    buf = p.stdout.read(W * H * 3)
    if len(buf) < W * H * 3: break
    im = np.frombuffer(buf, np.uint8).reshape(H, W, 3).astype(np.int16)
    m = (abs(im[..., 0] - 0x16) < 28) & (abs(im[..., 1] - 0x2A) < 28) & (abs(im[..., 2] - 0x32) < 28)
    ys = np.where(m.any(axis=1))[0]; xs = np.where(m.any(axis=0))[0]
    if len(xs):
        e = [xs.min(), xs.max(), ys.min(), ys.max()]
        ext = [min(ext[0], e[0]), max(ext[1], e[1]), min(ext[2], e[2]), max(ext[3], e[3])]
        if e[0] < X0 or e[1] > X1 or e[2] < Y0 or e[3] > Y1: bad.append((n, e))
    n += 1
print(f'{f}: {n} frames; ink extents x {ext[0]}-{ext[1]}  y {ext[2]}-{ext[3]}; zone x {X0}-{X1} y {Y0}-{Y1}')
print(f'frames with ink outside the zone: {len(bad)}')
for k, e in bad[:12]: print('  frame', k, 'x', e[0], e[1], 'y', e[2], e[3])
if len(bad) > 12: print('  ...', len(bad) - 12, 'more; first', bad[0][0], 'last', bad[-1][0])
