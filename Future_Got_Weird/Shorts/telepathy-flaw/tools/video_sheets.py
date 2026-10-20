#!/usr/bin/env python3
"""Contact sheets straight from a rendered video (no bundling): every STEP frames, COLS columns, ROWS rows per sheet.
usage: python3 tools/video_sheets.py <video.mp4> <outdir> [step=10] [cols=7] [rows=6]"""
import subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
v, out = Path(sys.argv[1]), Path(sys.argv[2])
step = int(sys.argv[3]) if len(sys.argv) > 3 else 10
cols = int(sys.argv[4]) if len(sys.argv) > 4 else 7
rows = int(sys.argv[5]) if len(sys.argv) > 5 else 6
out.mkdir(parents=True, exist_ok=True)
TW, TH = 270, 480
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(v), '-vf', f"select='not(mod(n\\,{step}))',scale={TW}:{TH}", '-vsync', '0', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, TH, TW, 3)
per = cols * rows
for k in range(0, len(fr), per):
    grp = fr[k:k + per]
    r = (len(grp) + cols - 1) // cols
    S = Image.new('RGB', (TW * cols, (TH + 16) * r), 'white')
    d = ImageDraw.Draw(S)
    for i, im in enumerate(grp):
        f = (k + i) * step
        x, y = (i % cols) * TW, (i // cols) * (TH + 16)
        S.paste(Image.fromarray(im), (x, y + 16))
        d.text((x + 3, y + 2), f'f{f} {f / 30:.2f}s', fill='black')
    S.save(out / f'sheet_{k // per:02d}.png')
print(len(fr), 'frames')
