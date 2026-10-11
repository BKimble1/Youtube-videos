#!/usr/bin/env python3
"""Safe-zone scan for V2 (ink AND cream scenes): content = pixels that differ from the frame's own background colour (taken at x=4,y=4)
by more than 70 in any channel (so soft 20 % shadows are ignored; outlines and fills count). Groups consecutive frames whose content strays beyond tolerance of x 100-870 / y 220-1440.
Usage: safe_zone_groups_v2.py file.mp4 [tol]   (the 10-frame ink<->cream wipes legitimately fill the frame and are listed)"""
import sys, subprocess, numpy as np
f = sys.argv[1]; tol = int(sys.argv[2]) if len(sys.argv) > 2 else 8
W, H = 1080, 1920
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', f, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
n = 0; out = []; cur = None; worst = [W, 0, H, 0]
while True:
    b = p.stdout.read(W * H * 3)
    if len(b) < W * H * 3: break
    im = np.frombuffer(b, np.uint8).reshape(H, W, 3).astype(np.int16)
    bg = im[4, 4]
    m = (np.abs(im - bg).max(axis=2) > 70)
    xs = np.where(m.any(axis=0))[0]; ys = np.where(m.any(axis=1))[0]
    if len(xs):
        r = (n, xs.min(), xs.max(), ys.min(), ys.max())
        if r[1] < 100 - tol or r[2] > 870 + tol or r[3] < 220 - tol or r[4] > 1440 + tol:
            if cur and r[0] == cur[1] + 1:
                cur[1] = r[0]; cur[2] = min(cur[2], r[1]); cur[3] = max(cur[3], r[2]); cur[4] = min(cur[4], r[3]); cur[5] = max(cur[5], r[4])
            else:
                cur = [r[0], r[0], r[1], r[2], r[3], r[4]]; out.append(cur)
        else:
            worst = [min(worst[0], r[1]), max(worst[1], r[2]), min(worst[2], r[3]), max(worst[3], r[4])]
    n += 1
print(f'{f}: {n} frames, tolerance {tol}px beyond x 100-870 / y 220-1440')
print(f'  extents of all frames inside the zone: x {worst[0]}-{worst[1]}  y {worst[2]}-{worst[3]}')
for c in out: print(f'  frames {c[0]}-{c[1]}  minx {c[2]} maxx {c[3]} miny {c[4]} maxy {c[5]}')
if not out: print('  none outside')
