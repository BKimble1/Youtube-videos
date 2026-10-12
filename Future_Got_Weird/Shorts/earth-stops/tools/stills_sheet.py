#!/usr/bin/env python3
"""Assemble Remotion stills (qa/.../<Comp>_NNNN.png) into one labeled sheet. python3 tools/stills_sheet.py <dir> <out.png> [cols]"""
import glob, sys
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]; cols = int(sys.argv[3]) if len(sys.argv) > 3 else 8
fs = sorted(glob.glob(f'{d}/*_*.png'))
fs = [f for f in fs if not f.endswith('sheet.png')]
ims = [Image.open(f).convert('RGB') for f in fs]
w, h = ims[0].size; rows = (len(ims) + cols - 1) // cols
S = Image.new('RGB', (cols * w, rows * h), (30, 30, 30))
for i, (f, im) in enumerate(zip(fs, ims)):
    ImageDraw.Draw(im).rectangle([0, 0, 44, 14], fill=(0, 0, 0)); ImageDraw.Draw(im).text((3, 2), 'f' + f.split('_')[-1][:4].lstrip('0') if f.split('_')[-1][:4].strip('0') else 'f0', fill=(255, 255, 255))
    S.paste(im, ((i % cols) * w, (i // cols) * h))
S.save(out); print(out, S.size)
