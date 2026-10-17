#!/usr/bin/env python3
"""Frames of a footage window with a labelled 1920x1080 coordinate grid (every 100 px), for keying overlay positions by eye.
usage: grid_sheet.py <file> <t0> <t1> <step> <out.jpg> [cols]"""
import subprocess, sys
import numpy as np
from PIL import Image, ImageDraw
f, t0, t1, step, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4]), sys.argv[5]
cols = int(sys.argv[6]) if len(sys.argv) > 6 else 3
ts = list(np.arange(t0, t1 + 1e-6, step))
tiles = []
for t in ts:
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.3f}', '-i', f, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
    im = Image.frombytes('RGB', (1920, 1080), raw); d = ImageDraw.Draw(im)
    for x in range(0, 1920, 100):
        d.line([(x, 0), (x, 1080)], fill=(255, 220, 0) if x % 500 == 0 else (120, 110, 40), width=2 if x % 500 == 0 else 1)
        d.text((x + 3, 3), str(x), fill=(255, 230, 80))
    for y in range(0, 1080, 100):
        d.line([(0, y), (1920, y)], fill=(255, 220, 0) if y % 500 == 0 else (120, 110, 40), width=2 if y % 500 == 0 else 1)
        d.text((3, y + 3), str(y), fill=(255, 230, 80))
    d.rectangle([800, 1040, 1120, 1078], fill=(0, 0, 0)); d.text((810, 1045), f't={t:.2f}', fill=(255, 255, 255))
    tiles.append(im.resize((960, 540)))
rows = (len(tiles) + cols - 1) // cols
sheet = Image.new('RGB', (960 * cols, 540 * rows))
for i, t in enumerate(tiles):
    sheet.paste(t, ((i % cols) * 960, (i // cols) * 540))
sheet.save(out, quality=82)
