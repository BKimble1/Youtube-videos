#!/usr/bin/env python3
"""Frame-step review of every cut: the two frames before and the three after each cut (audio/cues.json), one row each.
usage: python3 tools/v3/transition_bursts_v3.py <video.mp4> <out.png> [frames]"""
import json, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw
src, out = sys.argv[1:3]
cj = json.load(open('audio/cues_v3.json'))
fps = cj['fps']
sh = cj['signals']['shot']
# V2: every shot boundary that is a cut or a match cut (listed in production/V2_SHOTS_AND_TRANSITIONS.md)
cuts = [int(x) for x in sys.argv[3].split(',')] if len(sys.argv) > 3 else [i for i in range(1, len(sh)) if sh[i] != sh[i - 1]]
w, h = 216, 384
rows = []
for c in cuts:
    idx = [c - 2, c - 1, c, c + 1, c + 2]
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-vf', f"select='{'+'.join(f'eq(n,{i})' for i in idx)}',scale={w}:{h}", '-vsync', '0', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
    rows.append((idx, np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)))
canvas = Image.new('RGB', (5 * w, len(rows) * h), (0, 0, 0))
dr = ImageDraw.Draw(canvas)
for r, (idx, ims) in enumerate(rows):
    for k, im in enumerate(ims):
        canvas.paste(Image.fromarray(im), (k * w, r * h))
        dr.rectangle([k * w, r * h, k * w + 70, r * h + 16], fill=(0, 0, 0))
        dr.text((k * w + 4, r * h + 3), str(idx[k]), fill=(255, 230, 0))
canvas.save(out)
