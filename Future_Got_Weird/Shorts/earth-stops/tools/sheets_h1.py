#!/usr/bin/env python3
"""Contact sheets of the ENCODED H1 silent mp4: all 180 frames (4 sheets of 45), and 18 phone-width key frames. Usage: python3 tools/sheets_h1.py"""
import os, subprocess, shutil
from PIL import Image, ImageDraw
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
X = f'{ROOT}/exports/v3/FGW_EarthStops_Hook_H1_Silent_1080x1920.mp4'
d = '/tmp/fgw_h1sheet'; shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
subprocess.run(['ffmpeg', '-v', 'error', '-i', X, '-vsync', '0', f'{d}/f%03d.png'], check=True)
os.makedirs(f'{ROOT}/qa/v3/sheets', exist_ok=True)
def tag(im, f):
    dr = ImageDraw.Draw(im); dr.rectangle([0, 0, 44, 16], fill=(0, 0, 0)); dr.text((3, 3), f'f{f}', fill=(255, 255, 255)); return im
w, h = 216, 384
for part in range(4):
    S = Image.new('RGB', (9 * w, 5 * h), (30, 30, 30))
    for i in range(45):
        f = part * 45 + i
        S.paste(tag(Image.open(f'{d}/f{f + 1:03d}.png').convert('RGB').resize((w, h), Image.LANCZOS), f), ((i % 9) * w, (i // 9) * h))
    S.save(f'{ROOT}/qa/v3/sheets/H1_all180_part{part + 1}.png')
keys = [0, 4, 5, 7, 11, 17, 28, 36, 42, 47, 56, 66, 74, 82, 90, 113, 135, 179]
S = Image.new('RGB', (6 * 300, 3 * 533))
for i, f in enumerate(keys):
    S.paste(tag(Image.open(f'{d}/f{f + 1:03d}.png').convert('RGB').resize((300, 533), Image.LANCZOS), f), ((i % 6) * 300, (i // 6) * 533))
S.save(f'{ROOT}/qa/v3/sheets/H1_keyframes_phone300.png')
print('ok')
