#!/usr/bin/env python3
"""Phone-size review sheets from a JPEG frame sequence: every `step`-th frame at 360 x 640 (a phone's CSS width),
`cols` x `rows` per sheet, each tile labelled with frame and time (in a corner strip outside the picture).
usage: python3 tools/v4/phone_sheets.py <frames_dir> <out_dir> [step=3] [cols=6] [rows=3]"""
import os, sys, re
from PIL import Image, ImageDraw
src, out = sys.argv[1], sys.argv[2]
step = int(sys.argv[3]) if len(sys.argv) > 3 else 3
cols = int(sys.argv[4]) if len(sys.argv) > 4 else 6
rows = int(sys.argv[5]) if len(sys.argv) > 5 else 3
os.makedirs(out, exist_ok=True)
fs = sorted(int(re.findall(r'(\d+)', n)[-1]) for n in os.listdir(src) if n.endswith('.jpeg'))
pick = [f for f in fs if f % step == 0]
W, H, LAB = 360, 640, 22
per = cols * rows
for k in range(0, len(pick), per):
    grp = pick[k:k + per]
    sheet = Image.new('RGB', (cols * W, rows * (H + LAB)), (12, 12, 12))
    d = ImageDraw.Draw(sheet)
    for i, f in enumerate(grp):
        im = Image.open(os.path.join(src, 'element-%03d.jpeg' % f)).resize((W, H), Image.LANCZOS)
        x, y = (i % cols) * W, (i // cols) * (H + LAB)
        sheet.paste(im, (x, y + LAB))
        d.text((x + 6, y + 4), f'f{f}  {f / 30:.2f}s', fill=(255, 220, 0))
    name = os.path.join(out, f'phone_{grp[0]:03d}-{grp[-1]:03d}.jpg')
    sheet.save(name, quality=88)
    print(name)
