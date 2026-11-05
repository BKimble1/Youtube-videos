#!/usr/bin/env python3
"""Frame strips around given frames of a render (for frame-stepping transitions).
usage: python3 tools/strip.py <video> <out.png> f1,f2,... [radius=2] [scale=0.2]"""
import sys, subprocess, numpy as np
from PIL import Image, ImageDraw
src, out, fs = sys.argv[1], sys.argv[2], [int(x) for x in sys.argv[3].split(',')]
r = int(sys.argv[4]) if len(sys.argv) > 4 else 2
sc = float(sys.argv[5]) if len(sys.argv) > 5 else 0.2
w, h = int(1080 * sc), int(1920 * sc)
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-vf', f'scale={w}:{h}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)
cols = 2 * r + 1
cv = Image.new('RGB', (cols * w, len(fs) * h), (16, 16, 16))
d = ImageDraw.Draw(cv)
for i, f in enumerate(fs):
    for k in range(-r, r + 1):
        g = (f + k) % len(fr)
        cv.paste(Image.fromarray(fr[g]), ((k + r) * w, i * h))
        d.text(((k + r) * w + 4, i * h + 4), f'{g} {g / 30:.2f}', fill=(255, 230, 0))
cv.save(out)
