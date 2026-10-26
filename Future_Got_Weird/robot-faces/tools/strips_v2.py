#!/usr/bin/env python3
"""V2 edit check: for every edit, the last frames of the outgoing shot and the first of the incoming one (+-n frames
around the boundary frame), read from the rendered file, stacked 8 edits to a page with their times and shot ids.
usage: strips_v2.py <video.mp4> <cues_v2.json> <outdir> [n=2] [w=300]"""
import json, math, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont
vid, cj, out = sys.argv[1], sys.argv[2], sys.argv[3]
n = int(sys.argv[4]) if len(sys.argv) > 4 else 2
w = int(sys.argv[5]) if len(sys.argv) > 5 else 300
os.makedirs(out, exist_ok=True)
C = json.load(open(cj))
S = C['shots']
rows = []
for i in range(1, len(S)):
    f0 = math.ceil(S[i]['a'] * 30 - 1e-9)  # first frame of the incoming shot
    sel = '+'.join(f'eq(n\\,{f})' for f in range(f0 - n, f0 + n))
    dst = f'{out}/edit_{i:02d}.png'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', vid, '-vf', f"select='{sel}',scale={w}:-1,tile={2*n}x1:padding=4:color=red", '-frames:v', '1', '-vsync', 'vfr', dst], check=True)
    rows.append((dst, f"{i:02d}  {S[i]['a']:.2f}s  {S[i-1]['id']} | {S[i]['id']}  ({S[i]['tr']})"))
font = ImageFont.load_default()
for p in range(0, len(rows), 8):
    ims = [Image.open(r[0]) for r in rows[p:p + 8]]
    W = max(im.width for im in ims); H = sum(im.height + 18 for im in ims)
    page = Image.new('RGB', (W, H), (20, 20, 20)); d = ImageDraw.Draw(page); y = 0
    for im, (_, label) in zip(ims, rows[p:p + 8]):
        d.text((4, y + 3), label, fill=(255, 230, 100), font=font); page.paste(im, (0, y + 18)); y += im.height + 18
    page.save(f'{out}/page_{p // 8:02d}.png')
    print(f'{out}/page_{p // 8:02d}.png')
