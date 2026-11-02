#!/usr/bin/env python3
"""Frame strips for transition review: every Nth frame between two times, labelled, from a rendered file.
usage: python3 tools/strips.py <video.mp4> <t0> <t1> <step_frames> <out.png> [scale=0.25] [cols=8]"""
import subprocess, sys
import numpy as np
from PIL import Image, ImageDraw
src, t0, t1, step, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
scale = float(sys.argv[6]) if len(sys.argv) > 6 else 0.25
cols = int(sys.argv[7]) if len(sys.argv) > 7 else 8
fps = 30
f0, f1 = int(round(t0 * fps)), int(round(t1 * fps))
idx = list(range(f0, f1 + 1, step))
w, h = int(1080 * scale), int(1920 * scale)
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-vf', f"select='{'+'.join(f'eq(n,{i})' for i in idx)}',scale={w}:{h}", '-vsync', '0', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
ims = np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)
rows = (len(ims) + cols - 1) // cols
c = Image.new('RGB', (cols * w, rows * h), (16, 16, 16))
d = ImageDraw.Draw(c)
for k, im in enumerate(ims):
    x, y = (k % cols) * w, (k // cols) * h
    c.paste(Image.fromarray(im), (x, y))
    d.rectangle([x, y, x + 110, y + 22], fill=(0, 0, 0))
    d.text((x + 5, y + 5), f'{idx[k]} {idx[k] / fps:.2f}s', fill=(255, 230, 0))
c.save(out)
print(out, len(ims), 'frames')
