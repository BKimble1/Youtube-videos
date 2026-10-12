#!/usr/bin/env python3
"""Contact sheets of the ENCODED V2 mp4: every frame (45 per sheet: 9 x 5 at 216 x 384, frame numbers on each) and a set of phone-width key frames.
Usage: python3 tools/sheets_v2.py [video] [outdir]"""
import os, shutil, subprocess, sys
from PIL import Image, ImageDraw
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
X = sys.argv[1] if len(sys.argv) > 1 else f'{ROOT}/exports/v5/FGW_EarthStops_V2_Review_1080x1920.mp4'
OUT = sys.argv[2] if len(sys.argv) > 2 else f'{ROOT}/qa/v5/sheets'
d = '/tmp/fgw_v2sheet'; shutil.rmtree(d, ignore_errors=True); os.makedirs(d); os.makedirs(OUT, exist_ok=True)
subprocess.run(['ffmpeg', '-v', 'error', '-i', X, '-vsync', '0', f'{d}/f%04d.png'], check=True)
n = len([f for f in os.listdir(d) if f.endswith('.png')])
def tag(im, f):
    dr = ImageDraw.Draw(im); dr.rectangle([0, 0, 52, 16], fill=(0, 0, 0)); dr.text((3, 3), f'f{f}', fill=(255, 255, 255)); return im
w, h = 216, 384
parts = (n + 44) // 45
for part in range(parts):
    S = Image.new('RGB', (9 * w, 5 * h), (30, 30, 30))
    for i in range(45):
        f = part * 45 + i
        if f >= n: break
        S.paste(tag(Image.open(f'{d}/f{f + 1:04d}.png').convert('RGB').resize((w, h), Image.LANCZOS), f), ((i % 9) * w, (i // 9) * h))
    S.save(f'{OUT}/V2_all_frames_part{part + 1:02d}.png')
print('frames', n, 'sheets', parts)
