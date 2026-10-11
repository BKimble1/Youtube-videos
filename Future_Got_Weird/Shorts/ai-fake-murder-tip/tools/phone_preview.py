#!/usr/bin/env python3
"""Phone-size review: 360x640 downscale of decoded frames with a conservative Shorts UI overlay and the 100-870 x 220-1440 safe zone.
Usage: phone_preview.py out.png cols file1.png file2.png ...   (frames are 1080x1920 PNGs)"""
import sys
from PIL import Image, ImageDraw
out, cols, files = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
S = 360 / 1080
tiles = []
for f in files:
    im = Image.open(f).convert('RGB').resize((360, 640), Image.LANCZOS)
    ov = Image.new('RGBA', im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    # conservative Shorts UI: top bar, right action rail, bottom title/channel block
    d.rectangle([0, 0, 360, 220 * S], fill=(0, 0, 0, 70))
    d.rectangle([870 * S, 220 * S, 360, 1440 * S], fill=(0, 0, 0, 70))
    d.rectangle([0, 1440 * S, 360, 640], fill=(0, 0, 0, 90))
    for k in range(5):  # action-rail buttons
        cy = (800 + k * 150) * S
        d.ellipse([905 * S, cy - 18, 905 * S + 36, cy + 18], fill=(255, 255, 255, 110))
    d.rectangle([100 * S, 220 * S, 870 * S, 1440 * S], outline=(255, 0, 255, 200), width=1)
    d.text((8, 640 - 40), 'channel / title / sound', fill=(255, 255, 255, 200))
    im = Image.alpha_composite(im.convert('RGBA'), ov).convert('RGB')
    d2 = ImageDraw.Draw(im)
    d2.text((6, 6), f.split('/')[-1].replace('.png', ''), fill=(255, 255, 255))
    tiles.append(im)
rows = (len(tiles) + cols - 1) // cols
sheet = Image.new('RGB', (cols * 360, rows * 640), (30, 30, 30))
for i, im in enumerate(tiles):
    sheet.paste(im, ((i % cols) * 360, (i // cols) * 640))
sheet.save(out)
print(out, sheet.size)
