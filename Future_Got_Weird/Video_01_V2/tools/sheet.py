#!/usr/bin/env python3
"""Tile still PNGs into labelled contact sheets: sheet.py <dir> [--cols 3] [--w 640] [--per 9] -> <dir>/sheet_NN.jpg"""
import argparse, glob, os
from PIL import Image, ImageDraw, ImageFont

ap = argparse.ArgumentParser()
ap.add_argument('dir'); ap.add_argument('--cols', type=int, default=3); ap.add_argument('--w', type=int, default=640); ap.add_argument('--per', type=int, default=9)
a = ap.parse_args()
files = sorted(f for f in glob.glob(os.path.join(a.dir, '*.png')))
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22)
except Exception:
    font = ImageFont.load_default()
h = a.w * 9 // 16
for k in range(0, len(files), a.per):
    chunk = files[k:k + a.per]
    rows = (len(chunk) + a.cols - 1) // a.cols
    sheet = Image.new('RGB', (a.cols * (a.w + 6), rows * (h + 6)), 'black')
    for j, f in enumerate(chunk):
        im = Image.open(f).convert('RGB').resize((a.w, h))
        d = ImageDraw.Draw(im)
        lab = os.path.basename(f).split('_')[0].lstrip('0') or '0'
        d.rectangle([0, 0, 90, 30], fill='black'); d.text((6, 3), 'f' + lab, fill='yellow', font=font)
        sheet.paste(im, ((j % a.cols) * (a.w + 6), (j // a.cols) * (h + 6)))
    out = os.path.join(a.dir, f'sheet_{k // a.per:02d}.jpg')
    sheet.save(out, quality=85)
    print(out)
