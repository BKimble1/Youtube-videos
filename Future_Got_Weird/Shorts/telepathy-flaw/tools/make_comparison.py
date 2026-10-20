#!/usr/bin/env python3
"""Comparison sheet: Death Clock vs old V3 vs new V4 -- character proportions (full figures) and representative scene variety.
Frames are pulled from the three delivered films with ffmpeg. usage: python3 tools/make_comparison.py <V4.mp4> <DC.mp4> <V3.mp4> <out.png>"""
import subprocess, sys, tempfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

v4, dc, v3, out = map(Path, sys.argv[1:5])
tmp = Path(tempfile.mkdtemp())
TW, TH = 300, 533


def grab(video, t, name):
    p = tmp / f'{name}.png'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', str(video), '-frames:v', '1', str(p)], check=True)
    return Image.open(p).convert('RGB').resize((TW, TH), Image.LANCZOS)


def font(sz):
    for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf'):
        if Path(f).exists():
            return ImageFont.truetype(f, sz)
    return ImageFont.load_default()


rows = [
    ('CHARACTER PROPORTIONS: full figures', [
        ('Death Clock', dc, [0.5, 1.5, 15.5, 36.0]),
        ('Telepathy V3 (old: bust tubes)', v3, [2.7, 4.3, 13.0, 20.8]),
        ('Telepathy V4 (new)', v4, [1.2, 10.2, 19.9, 26.67]),
    ]),
    ('SCENE VARIETY: representative compositions', [
        ('Death Clock', dc, [0.1, 7.0, 13.0, 24.5, 28.5, 37.5]),
        ('Telepathy V3 (old: one wall, one diagram)', v3, [1.0, 3.5, 7.0, 9.5, 15.2, 21.0]),
        ('Telepathy V4 (new)', v4, [0.3, 3.9, 6.2, 7.6, 8.9, 10.2, 14.4, 22.9]),
    ]),
]
F = font(22)
G = font(30)
cols = 8
H = 0
for title, grp in rows:
    H += 44 + len(grp) * (TH + 34)
S = Image.new('RGB', (TW * cols + 20, H + 10), (245, 247, 249))
d = ImageDraw.Draw(S)
y = 6
for title, grp in rows:
    d.text((10, y), title, fill=(20, 30, 40), font=G)
    y += 44
    for label, vid, ts in grp:
        d.text((10, y + 2), label, fill=(20, 60, 100), font=F)
        for i, t in enumerate(ts):
            im = grab(vid, t, f'{vid.stem}_{t}')
            S.paste(im, (10 + i * TW, y + 30))
            d.text((14 + i * TW, y + 34), f'{t:.1f}s', fill=(255, 255, 255), font=F, stroke_width=2, stroke_fill=(0, 0, 0))
        y += TH + 34
S.save(out)
print(out, S.size)
