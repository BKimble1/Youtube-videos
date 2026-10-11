#!/usr/bin/env python3
"""Frames taken from an MP4 itself (decoded), as a labelled contact sheet.
Usage: mp4_sheet.py in.mp4 out.png cols thumbW f1,f2,...   (frame numbers at the file's frame rate)"""
import subprocess, sys, tempfile, os
from PIL import Image, ImageDraw
src, out, cols, tw, flist = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), [int(x) for x in sys.argv[5].split(',')]
tmp = tempfile.mkdtemp()
sel = '+'.join(f'eq(n\\,{f})' for f in flist)
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-i', src, '-vf', f"select='{sel}'", '-vsync', '0', f'{tmp}/f%04d.png'], check=True)
files = sorted(os.listdir(tmp))
fr = sorted(flist)
ims = []
for f, n in zip(files, fr):
    im = Image.open(f'{tmp}/{f}').convert('RGB')
    ims.append((n, im.resize((tw, int(im.height * tw / im.width)), Image.LANCZOS)))
th = ims[0][1].height
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * tw, rows * (th + 24)), (28, 28, 28))
d = ImageDraw.Draw(sheet)
for i, (n, im) in enumerate(ims):
    x, y = (i % cols) * tw, (i // cols) * (th + 24)
    sheet.paste(im, (x, y + 24)); d.text((x + 6, y + 6), f'f{n}  {n/30:.2f}s', fill=(255, 255, 255))
sheet.save(out); print(out, sheet.size)
