#!/usr/bin/env python3
"""Frame sheet straight from a rendered MP4 (what the viewer gets), with frame numbers and times.
usage: python3 tools/frame_sheet.py <video> <out.png> <cols> <width> f1 f2 ..."""
import subprocess, sys
import numpy as np
from PIL import Image, ImageDraw
src, out, cols, w = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
idx = [int(x) for x in sys.argv[5:]]
h = int(w * 16 / 9)
order = sorted(set(idx))
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-vf', f"select='{'+'.join(f'eq(n,{i})' for i in order)}',scale={w}:{h}", '-vsync', '0', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)
rows = (len(idx) + cols - 1) // cols
c = Image.new('RGB', (cols * w, rows * h), (16, 16, 16)); d = ImageDraw.Draw(c)
for k, i in enumerate(idx):
    x, y = (k % cols) * w, (k // cols) * h
    c.paste(Image.fromarray(fr[order.index(i)]), (x, y)); d.rectangle([x, y, x + 92, y + 16], fill=(0, 0, 0)); d.text((x + 3, y + 3), f'{i} {i / 30:.2f}s', fill=(255, 230, 0))
c.save(out)
