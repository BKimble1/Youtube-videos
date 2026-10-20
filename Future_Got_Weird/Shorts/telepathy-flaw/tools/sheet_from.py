#!/usr/bin/env python3
"""Tile named PNGs into one labelled sheet. usage: python3 tools/sheet_from.py <dir> <out.png> <cols> <tile_w> name1 name2 ..."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw
d, out, cols, tw = Path(sys.argv[1]), Path(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4])
names = sys.argv[5:]
ims = [Image.open(d / f'{n}.png').convert('RGB') for n in names]
th = int(tw * ims[0].height / ims[0].width)
rows = (len(ims) + cols - 1) // cols
S = Image.new('RGB', (tw * cols, (th + 16) * rows), 'white')
dr = ImageDraw.Draw(S)
for i, (n, im) in enumerate(zip(names, ims)):
    x, y = (i % cols) * tw, (i // cols) * (th + 16)
    S.paste(im.resize((tw, th)), (x, y + 16)); dr.text((x + 3, y + 2), n, fill='black')
S.save(out)
