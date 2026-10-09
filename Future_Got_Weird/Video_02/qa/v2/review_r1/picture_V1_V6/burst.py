#!/usr/bin/env python3
"""burst.py <start_frame> <end_frame> <step> <out.jpg> [--w 480] [--cols 6] [--crop x,y,w,h]
Extracts frames start..end (inclusive, every step) from the review render at full res, tiles them with frame labels."""
import sys, subprocess, argparse
import numpy as np
from PIL import Image, ImageDraw, ImageFont
V = "/home/user/Youtube-videos/Future_Got_Weird/Video_02/exports/Future_Got_Weird_Video_02_v2_REVIEW_r1.mp4"
ap = argparse.ArgumentParser()
ap.add_argument("a", type=int); ap.add_argument("b", type=int); ap.add_argument("step", type=int); ap.add_argument("out")
ap.add_argument("--w", type=int, default=480); ap.add_argument("--cols", type=int, default=6)
ap.add_argument("--crop", default="")
a = ap.parse_args()
n = a.b - a.a + 1
W, H = 1920, 1080
p = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{a.a/30:.4f}", "-i", V, "-frames:v", str(n), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
buf = p.stdout
frames = [np.frombuffer(buf[i*W*H*3:(i+1)*W*H*3], np.uint8).reshape(H, W, 3) for i in range(len(buf)//(W*H*3))]
sel = list(range(0, len(frames), a.step))
if a.crop:
    cx, cy, cw, ch = map(int, a.crop.split(","))
else:
    cx, cy, cw, ch = 0, 0, W, H
tw = a.w; th = int(tw * ch / cw)
cols = a.cols; rows = (len(sel) + cols - 1) // cols
sheet = Image.new("RGB", (cols * tw, rows * (th + 18)), "white")
d = ImageDraw.Draw(sheet)
try:
    F = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 14)
except OSError:
    F = ImageFont.load_default()
for k, i in enumerate(sel):
    im = Image.fromarray(frames[i]).crop((cx, cy, cx + cw, cy + ch)).resize((tw, th), Image.LANCZOS)
    x, y = (k % cols) * tw, (k // cols) * (th + 18)
    sheet.paste(im, (x, y + 18))
    d.text((x + 4, y + 1), f"f{a.a + i}  {(a.a+i)/30:.2f}s", fill="black", font=F)
sheet.save(a.out, quality=90)
print(a.out, len(sel), "tiles")
