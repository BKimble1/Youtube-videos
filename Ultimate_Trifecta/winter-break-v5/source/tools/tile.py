#!/usr/bin/env python3
"""tile.py OUT.jpg COLS W img... : labelled contact sheet"""
import sys, os
from PIL import Image, ImageDraw
out, cols, w = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
fs = sys.argv[4:]
ims = [Image.open(f).convert("RGB") for f in fs]
h = int(w * ims[0].height / ims[0].width)
rows = (len(ims) + cols - 1) // cols
S = Image.new("RGB", (cols * w, rows * h), (20, 20, 20))
d = ImageDraw.Draw(S)
for i, (f, im) in enumerate(zip(fs, ims)):
    x, y = (i % cols) * w, (i // cols) * h
    S.paste(im.resize((w, h)), (x, y))
    d.rectangle([x, y, x + 300, y + 16], fill=(0, 0, 0))
    d.text((x + 3, y + 2), os.path.basename(f)[:-4], fill=(255, 255, 0))
S.save(out, quality=86)
