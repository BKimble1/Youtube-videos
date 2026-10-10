#!/usr/bin/env python3
"""Skeptic helpers: exact-frame decode, labelled sheets, motion runs.
Frame N is at N/30 s. Decoding uses -ss a/30 then sequential frames."""
import json, subprocess, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = "/home/user/Youtube-videos/Future_Got_Weird/Video_02"
V = ROOT + "/exports/Future_Got_Weird_Video_02_v2_UPLOAD_1080p.mp4"
TL = json.load(open(ROOT + "/source/src/data/timeline.json"))
WORDS = [(w["from"], w["to"], w["w"], s["id"]) for s in TL["segments"] for w in s["words"]]
try:
    FONT = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 15)
except OSError:
    FONT = ImageFont.load_default()

def decode(a, b, w=1920, h=1080, video=V):
    """frames a..b inclusive at w x h, rgb uint8 array (n,h,w,3)."""
    n = b - a + 1
    vf = [] if (w, h) == (1920, 1080) else ["-vf", f"scale={w}:{h}:flags=area"]
    p = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{a/30:.6f}", "-i", video, "-frames:v", str(n), *vf,
                        "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True)
    buf = np.frombuffer(p.stdout, np.uint8)
    got = len(buf) // (w * h * 3)
    return buf[: got * w * h * 3].reshape(got, h, w, 3)

def word_at(f):
    c = [f"{x[2]}" for x in WORDS if x[0] <= f <= x[1]]
    return c[0] if c else ""

def scene_of(f):
    for s in TL["scenes"]:
        if s["from"] <= f < s["to"]:
            return s["id"]
    return "?"

def sheet(frames, labels, out, tile=480, cols=6, crop=None):
    ims = []
    for fr in frames:
        im = Image.fromarray(fr)
        if crop:
            x, y, w, h = crop
            im = im.crop((x, y, x + w, y + h))
        th = int(round(tile * im.height / im.width))
        ims.append(im.resize((tile, th), Image.LANCZOS))
    th = ims[0].height
    lab = 22
    rows = (len(ims) + cols - 1) // cols
    S = Image.new("RGB", (cols * tile, rows * (th + lab)), (20, 20, 20))
    d = ImageDraw.Draw(S)
    for k, (im, l) in enumerate(zip(ims, labels)):
        r, c = divmod(k, cols)
        S.paste(im, (c * tile, r * (th + lab) + lab))
        d.text((c * tile + 4, r * (th + lab) + 3), l, fill=(255, 230, 120), font=FONT)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    S.save(out, quality=88)
    return out

def burst(a, b, step, out, tile=480, cols=6, crop=None, w=1920, h=1080):
    fr = decode(a, b, w, h)
    idx = list(range(0, len(fr), step))
    labs = [f"f{a+i} {(a+i)/30:.2f}s {scene_of(a+i)} {word_at(a+i)}" for i in idx]
    return sheet([fr[i] for i in idx], labs, out, tile, cols, crop)

def luma(fr):
    f = fr.astype(np.float32)
    return 0.299 * f[..., 0] + 0.587 * f[..., 1] + 0.114 * f[..., 2]

def diffs(a, b, w=320, h=180):
    fr = decode(a, b, w, h)
    L = [luma(x) for x in fr]
    return [(a + i, float(np.abs(L[i] - L[i - 1]).mean()), float(np.abs(L[i] - L[i - 1]).max())) for i in range(1, len(L))]
