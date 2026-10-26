#!/usr/bin/env python3
"""Labelled frame strips from a rendered MP4: n frames either side of every cut (from source/src/cuts.ts via
audio/cues-independent parsing), or explicit ranges. Each tile is labelled with its frame number and time.

usage: python3 tools/strips.py <mp4> <out_dir> [cuts|name:f0:f1[:step] ...] [--n 3] [--w 270]
"""
import os
import re
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = sys.argv[1:]
mp4, out = args[0], args[1]
n = int(args[args.index('--n') + 1]) if '--n' in args else 3
tw = int(args[args.index('--w') + 1]) if '--w' in args else 270
th = tw * 16 // 9
specs = [a for a in args[2:] if not a.startswith('--') and not re.fullmatch(r'\d+', a)]
os.makedirs(out, exist_ok=True)
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-vf', f'scale={tw}:{th}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, th, tw, 3)
cuts_src = open(os.path.join(EP, 'source/src/cuts.ts')).read()
cuts = [(m.group(1), int(m.group(2))) for m in re.finditer(r"\['(S\d+)', (\d+)\]", cuts_src)]
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', max(12, tw // 14))
except Exception:
    font = ImageFont.load_default()


def sheet(name, frames, cols=None):
    cols = cols or len(frames)
    rows = (len(frames) + cols - 1) // cols
    im = Image.new('RGB', (cols * tw, rows * (th + 22)), (20, 20, 20))
    d = ImageDraw.Draw(im)
    for k, f in enumerate(frames):
        if f < 0 or f >= len(fr):
            continue
        x, y = (k % cols) * tw, (k // cols) * (th + 22)
        im.paste(Image.fromarray(fr[f]), (x, y + 22))
        d.text((x + 4, y + 3), f'{f} {f / 30:.2f}s', fill=(255, 255, 0), font=font)
    im.save(os.path.join(out, f'{name}.png'))


if not specs or specs == ['cuts']:
    for (a, fa), (b, fb) in zip(cuts, cuts[1:]):
        sheet(f'cut_{a}_{b}_f{fb}', list(range(fb - n, fb + n)))
    sheet('loop_end_start', list(range(len(fr) - n, len(fr))) + list(range(0, n)))
else:
    for s in specs:
        name, f0, f1, *st = s.split(':')
        step = int(st[0]) if st else 1
        sheet(name, list(range(int(f0), int(f1) + 1, step)), cols=8)
print('wrote', out)
