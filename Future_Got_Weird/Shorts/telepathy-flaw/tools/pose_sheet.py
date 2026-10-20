#!/usr/bin/env python3
"""Compact pose/contact sheet: Death Clock reference frames (from qa/v4/COMPARISON_SHEET.png), then the same seven moments of the
V4 and V5 clean exports and of the V6 composition (frames rendered by tools/film_frames.py into <v6dir>).
usage: python3 tools/pose_sheet.py <v6dir with f####.png> <out.png>"""
import subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw
ROOT = Path(__file__).resolve().parents[1]
v6dir, out = Path(sys.argv[1]), Path(sys.argv[2])
times = [0.9, 10.2, 11.5, 13.1, 16.7, 20.8, 26.4]
frames = [round(t * 30) for t in times]
tmp = out.parent / '_pose_tmp'; tmp.mkdir(parents=True, exist_ok=True)
sel = '+'.join(f'eq(n\\,{f})' for f in frames)
for tag, p in (('v4', 'exports/FGW_TelepathyFlaw_V4_Clean_NoCaptions_1080x1920.mp4'), ('v5', 'exports/FGW_TelepathyFlaw_V5_Clean_NoCaptions_1080x1920.mp4')):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(ROOT / p), '-vf', f'select={sel}', '-vsync', '0', str(tmp / f'{tag}_%02d.png')], check=True)
tw, th = 300, 533
rows = [('V4', [Image.open(tmp / f'v4_{i+1:02d}.png') for i in range(7)]), ('V5', [Image.open(tmp / f'v5_{i+1:02d}.png') for i in range(7)]), ('V6', [Image.open(v6dir / f'f{f:04d}.png') for f in frames])]
# Death Clock reference: the four full-figure frames at the top of the comparison sheet
cs = Image.open(ROOT / 'qa/v4/COMPARISON_SHEET.png').convert('RGB')
dc = [cs.crop((x, 80, x + 300, 80 + 533)) for x in (10, 308, 606, 904)]
W = tw * 7
S = Image.new('RGB', (W, 20 + th + 3 * (th + 20)), 'white'); d = ImageDraw.Draw(S)
d.text((4, 4), 'Death Clock reference (0.5 s, 1.5 s, 15.5 s, 36 s)', fill='black')
for i, im in enumerate(dc): S.paste(im.resize((tw, th)), (i * tw, 20))
y = 20 + th
for name, ims in rows:
    d.text((4, y + 4), f'{name}   ' + '   '.join(f'{t}s' for t in times), fill='black')
    for i, im in enumerate(ims): S.paste(im.convert('RGB').resize((tw, th)), (i * tw, y + 20))
    y += th + 20
S.save(out); print(out, S.size)
