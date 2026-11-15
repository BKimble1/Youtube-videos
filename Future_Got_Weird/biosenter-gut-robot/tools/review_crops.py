#!/usr/bin/env python3
"""Native-resolution review crops for flagged frames: for each frame, t-1 | t | t+1 | 4x amplified |t - (t-1)|,
cropped around the frame's worst unexplained block (from temporal_report.json).
usage: python3 tools/review_crops.py <video> <temporal_report.json> <out.png> [crop_px] [frame ...]"""
import json, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw
src, rep, out = sys.argv[1:4]
C = int(sys.argv[4]) if len(sys.argv) > 4 else 300
R = json.load(open(rep))
det = {d['frame']: d for d in R['flagged_detail']}
frames = [int(x) for x in sys.argv[5:]] or [g[0] + (g[1] - g[0]) // 2 for g in R['flagged_groups']]
need = sorted({f + d for f in frames for d in (-1, 0, 1)})
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-vf', f"select='{'+'.join(f'eq(n,{i})' for i in need)}'", '-vsync', '0', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
Fr = dict(zip(need, np.frombuffer(raw, np.uint8).reshape(-1, 1920, 1080, 3)))
S = 180
sheet = Image.new('RGB', (S * 4, S * len(frames)), (20, 20, 20)); dr = ImageDraw.Draw(sheet)
for row, f in enumerate(frames):
    d = det.get(f)
    w = d['worst_fwd_at'] if d else {'x': 540, 'y': 960}
    x0 = int(np.clip(w['x'] - C // 2, 0, 1080 - C)); y0 = int(np.clip(w['y'] - C // 2, 0, 1920 - C))
    cr = [Fr[f + k][y0:y0 + C, x0:x0 + C] for k in (-1, 0, 1)]
    diff = np.clip(np.abs(cr[1].astype(int) - cr[0].astype(int)) * 4, 0, 255).astype(np.uint8)
    for k, im in enumerate(cr + [diff]):
        sheet.paste(Image.fromarray(im).resize((S, S)), (k * S, row * S))
    dr.rectangle([0, row * S, 150, row * S + 13], fill=(0, 0, 0))
    dr.text((2, row * S + 1), f'f{f} {f / 30:.2f}s @({w["x"]},{w["y"]})', fill=(255, 230, 0))
sheet.save(out)
