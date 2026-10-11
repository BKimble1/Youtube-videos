#!/usr/bin/env python3
"""Contact sheet from PNG frames. Usage: sheet.py out.png cols thumbW file1 file2 ... (labels from filenames)"""
import sys
from PIL import Image, ImageDraw
out, cols, tw = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
files = sys.argv[4:]
ims = []
for f in files:
    im = Image.open(f).convert('RGB')
    th = int(im.height * tw / im.width)
    ims.append((f, im.resize((tw, th), Image.LANCZOS)))
th = ims[0][1].height
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * tw, rows * (th + 26)), (30, 30, 30))
d = ImageDraw.Draw(sheet)
for i, (f, im) in enumerate(ims):
    x, y = (i % cols) * tw, (i // cols) * (th + 26)
    sheet.paste(im, (x, y + 26))
    d.text((x + 6, y + 6), f.split('/')[-1].replace('.png', ''), fill=(255, 255, 255))
sheet.save(out)
print(out, sheet.size)
