#!/usr/bin/env python3
"""Groups consecutive frames whose ink pixels stray beyond tolerance of the safe zone. Usage: safe_zone_groups.py file.mp4 [tol]"""
import sys, subprocess, numpy as np
f = sys.argv[1]; tol = int(sys.argv[2]) if len(sys.argv) > 2 else 8
W, H = 1080, 1920
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', f, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
n = 0; out = []; cur = None
while True:
    b = p.stdout.read(W * H * 3)
    if len(b) < W * H * 3: break
    im = np.frombuffer(b, np.uint8).reshape(H, W, 3).astype(np.int16)
    m = (abs(im[..., 0] - 0x16) < 28) & (abs(im[..., 1] - 0x2A) < 28) & (abs(im[..., 2] - 0x32) < 28)
    xs = np.where(m.any(axis=0))[0]; ys = np.where(m.any(axis=1))[0]
    if len(xs):
        r = (n, xs.min(), xs.max(), ys.min(), ys.max())
        if r[1] < 100 - tol or r[2] > 870 + tol or r[3] < 220 - tol or r[4] > 1440 + tol:
            if cur and r[0] == cur[1] + 1:
                cur[1] = r[0]; cur[2] = min(cur[2], r[1]); cur[3] = max(cur[3], r[2]); cur[4] = min(cur[4], r[3]); cur[5] = max(cur[5], r[4])
            else:
                cur = [r[0], r[0], r[1], r[2], r[3], r[4]]; out.append(cur)
    n += 1
print(f'{f}: {n} frames, tolerance {tol}px beyond x 100-870 / y 220-1440')
for c in out: print(f'  frames {c[0]}-{c[1]}  minx {c[2]} maxx {c[3]} miny {c[4]} maxy {c[5]}')
if not out: print('  none')
