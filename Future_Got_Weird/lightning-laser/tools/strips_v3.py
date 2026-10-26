#!/usr/bin/env python3
"""Labelled frame strips read from a rendered MP4 (not the source).
usage: python3 tools/strips_v3.py <mp4> <out_dir> name:f0:f1[:step[:width]] ...   (frame numbers, inclusive)
Each strip tiles the frames (8 per row) at `width` px wide (default 216) with the frame number and film time."""
import os, subprocess, sys, tempfile
from PIL import Image, ImageDraw

mp4, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
for spec in sys.argv[3:]:
    name, f0, f1, *rest = spec.split(':')
    step = int(rest[0]) if rest else 2
    w = int(rest[1]) if len(rest) > 1 else 216
    h = round(w * 16 / 9)
    frames = list(range(int(f0), int(f1) + 1, step))
    sel = '+'.join(f'eq(n\\,{f})' for f in frames)
    with tempfile.TemporaryDirectory() as td:
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', mp4, '-vf', f"select='{sel}',scale={w}:{h}:flags=area",
                        '-vsync', '0', f'{td}/%04d.png'], check=True)
        ims = [Image.open(f'{td}/{i + 1:04d}.png').convert('RGB') for i in range(len(frames))]
    cols = min(8, len(ims)); rows = (len(ims) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * (w + 2), rows * (h + 2)), (40, 40, 40))
    for i, (f, im) in enumerate(zip(frames, ims)):
        d = ImageDraw.Draw(im)
        d.rectangle([0, 0, 92, 16], fill=(0, 0, 0))
        d.text((3, 2), f'{f}  {f / 30:.2f}s', fill=(255, 255, 255))
        sheet.paste(im, ((i % cols) * (w + 2), (i // cols) * (h + 2)))
    sheet.save(f'{out}/{name}.png')
    print(name, frames[0], '..', frames[-1], 'step', step, f'{out}/{name}.png')
