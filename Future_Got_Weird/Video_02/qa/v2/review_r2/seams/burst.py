#!/usr/bin/env python3
"""Burst contact sheet: frames a..b (inclusive) every `step` frames, labelled with frame number, time and words.

  python3 burst.py <a> <b> <step> <out.jpg> [--crop x,y,w,h] [--tile 480] [--cols 6] [--mark F]
"""
import argparse, json, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont

V = "/home/user/Youtube-videos/Future_Got_Weird/Video_02/exports/Future_Got_Weird_Video_02_v2_UPLOAD_1080p.mp4"
TL = "/home/user/Youtube-videos/Future_Got_Weird/Video_02/source/src/data/timeline.json"
ap = argparse.ArgumentParser()
ap.add_argument("a", type=int); ap.add_argument("b", type=int); ap.add_argument("step", type=int)
ap.add_argument("out")
ap.add_argument("--crop", default="")
ap.add_argument("--tile", type=int, default=480)
ap.add_argument("--cols", type=int, default=6)
ap.add_argument("--mark", type=int, default=-1)
ap.add_argument("--save", default="", help="dir to save full-res PNGs of each frame")
args = ap.parse_args()
tl = json.load(open(TL))
words = [(w["from"], w["to"], w["w"]) for s in tl["segments"] for w in s["words"]]
scenes = tl["scenes"]
def scene_of(f):
    for s in scenes:
        if s["from"] <= f < s["to"]:
            return s["id"]
    return "?"
def word_at(f):
    c = [w[2] for w in words if w[0] <= f <= w[1] + 1]
    return c[0] if c else ""

n = args.b - args.a + 1
W, H = 1920, 1080
p = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{args.a/30:.6f}", "-i", V, "-frames:v", str(n),
                    "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
buf = np.frombuffer(p.stdout, np.uint8)
got = len(buf) // (W * H * 3)
frames = buf[: got * W * H * 3].reshape(got, H, W, 3)
idx = list(range(0, got, args.step))
if args.crop:
    x, y, w, h = map(int, args.crop.split(","))
else:
    x, y, w, h = 0, 0, W, H
tw = args.tile
th = int(round(tw * h / w))
cols = args.cols
rows = (len(idx) + cols - 1) // cols
lab = 22
sheet = Image.new("RGB", (cols * tw, rows * (th + lab)), (20, 20, 20))
try:
    F = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 15)
except OSError:
    F = ImageFont.load_default()
d = ImageDraw.Draw(sheet)
import os
if args.save:
    os.makedirs(args.save, exist_ok=True)
for k, i in enumerate(idx):
    f = args.a + i
    im = Image.fromarray(frames[i][y:y + h, x:x + w])
    if args.save:
        Image.fromarray(frames[i]).save(os.path.join(args.save, f"f{f}.png"))
    im = im.resize((tw, th), Image.LANCZOS)
    cx, cy = (k % cols) * tw, (k // cols) * (th + lab)
    sheet.paste(im, (cx, cy + lab))
    col = (255, 80, 80) if f == args.mark else (230, 230, 230)
    d.text((cx + 4, cy + 3), f"f{f} {f/30:.2f}s {scene_of(f)} {word_at(f)}", fill=col, font=F)
sheet.save(args.out, quality=88)
print(args.out, got, "frames decoded,", len(idx), "tiles")
