#!/usr/bin/env python3
"""Dense review material from a rendered film: what a viewer sees, second by second, next to what is said.

  python3 tools/qa_dense.py <video.mp4> <timeline.json> <out_dir> [--fps 3] [--per-sheet 36]

Writes into <out_dir>:
  <scene>_sheetNN.jpg   contact sheets at --fps frames per second, 6 tiles per row, each tile captioned with its
                        time, frame number and the words being spoken around that moment
  motion.json           per-frame motion energy (mean absolute luma difference between consecutive frames at
                        320x180) and every "still run": a stretch where nothing on screen changes by more than
                        a hair for longer than 0.8 s, with the words spoken during it
  motion_<scene>.png    motion-energy strip per scene (frame on x, energy on y), still runs shaded
"""
import argparse
import json
import os
import subprocess

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ap = argparse.ArgumentParser()
ap.add_argument("video")
ap.add_argument("timeline")
ap.add_argument("out")
ap.add_argument("--fps", type=float, default=3.0)
ap.add_argument("--per-sheet", type=int, default=36)
ap.add_argument("--tile", type=int, default=480)
ap.add_argument("--offset", type=int, default=0, help="global frame of the first video frame (scene clips)")
ap.add_argument("--only", default="", help="comma-separated scene ids to report")
args = ap.parse_args()
OFF = args.offset

tl = json.load(open(args.timeline))
FPS = tl["fps"]
if args.only:
    keep = set(args.only.split(","))
    tl["scenes"] = [s for s in tl["scenes"] if s["id"] in keep]
os.makedirs(args.out, exist_ok=True)
try:
    FONT = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 15)
    FONTB = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 15)
except OSError:
    FONT = FONTB = ImageFont.load_default()

words = [(w["from"], w["to"], w["w"], s["id"]) for s in tl["segments"] for w in s["words"]]


def spoken_at(f, before=0.6, after=0.6):
    lo, hi = f - before * FPS, f + after * FPS
    ws = [w for w in words if w[1] >= lo and w[0] <= hi]
    cur = [w for w in ws if w[0] <= f <= w[1] + 2]
    return " ".join(w[2] for w in ws), (cur[0][2] if cur else "")


def decode(w, h, step=1):
    """Yield (frame_index, HxWx3 uint8) for every frame of the video, scaled to w x h."""
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", args.video, "-vf", f"scale={w}:{h}", "-f", "rawvideo",
                          "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    n = w * h * 3
    i = 0
    while True:
        b = p.stdout.read(n)
        if len(b) < n:
            break
        if i % step == 0:
            yield i + OFF, np.frombuffer(b, np.uint8).reshape(h, w, 3)
        i += 1
    p.wait()


# ---------------------------------------------------------------- motion energy at full frame rate
energy = [0.0] * OFF
prev = None
for i, fr in decode(320, 180):
    g = fr.astype(np.float32).mean(axis=2)
    energy.append(0.0 if prev is None else float(np.abs(g - prev).mean()))
    prev = g
energy = np.array(energy)
STILL = 0.05          # mean |dLuma| per frame below this = effectively nothing moves
runs = []
i = OFF
while i < len(energy):
    if energy[i] < STILL:
        j = i
        while j + 1 < len(energy) and energy[j + 1] < STILL:
            j += 1
        if (j - i + 1) / FPS >= 0.8:
            sc = next((s["id"] for s in tl["scenes"] if s["from"] <= i < s["to"]), "?")
            txt, _ = spoken_at((i + j) / 2, before=(j - i) / 2 / FPS + 0.3, after=(j - i) / 2 / FPS + 0.3)
            runs.append({"scene": sc, "from": i, "to": j, "seconds": round((j - i + 1) / FPS, 2),
                         "t": f"{int(i / FPS // 60)}:{i / FPS % 60:04.1f}", "spoken": txt})
        i = j + 1
    else:
        i += 1
per_scene = {}
for s in tl["scenes"]:
    e = energy[s["from"]:s["to"]]
    rs = [r for r in runs if r["scene"] == s["id"]]
    per_scene[s["id"]] = {"seconds": round(len(e) / FPS, 1), "mean_energy": round(float(e.mean()), 3),
                          "still_seconds": round(sum(r["seconds"] for r in rs), 1),
                          "still_share": round(sum(r["seconds"] for r in rs) / max(1e-6, len(e) / FPS), 3),
                          "longest_still_s": max([r["seconds"] for r in rs], default=0)}
json.dump({"threshold": STILL, "scenes": per_scene, "still_runs": runs}, open(os.path.join(args.out, "motion.json"), "w"), indent=1)

for s in tl["scenes"]:
    e = energy[s["from"]:s["to"]]
    W, H = 1600, 220
    im = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(im)
    top = max(1.0, float(np.percentile(energy, 99)))
    for r in runs:
        if r["scene"] != s["id"]:
            continue
        x0 = (r["from"] - s["from"]) / max(1, len(e)) * W
        x1 = (r["to"] - s["from"] + 1) / max(1, len(e)) * W
        d.rectangle([x0, 20, x1, H - 20], fill=(255, 220, 210))
    pts = [(k / max(1, len(e)) * W, H - 20 - min(1.0, v / top) * (H - 40)) for k, v in enumerate(e)]
    d.line(pts, fill=(30, 60, 80), width=1)
    for sec in range(0, int(len(e) / FPS) + 1, 5):
        x = sec * FPS / max(1, len(e)) * W
        d.line([(x, H - 20), (x, H - 14)], fill="black")
        t = (s["from"] / FPS) + sec
        d.text((x + 2, H - 16), f"{int(t // 60)}:{t % 60:02.0f}", fill="black", font=FONT)
    d.text((6, 2), f"{s['id']} motion energy (shaded = nothing moves for >= 0.8 s)", fill="black", font=FONTB)
    im.save(os.path.join(args.out, f"motion_{s['id']}.png"))

# ---------------------------------------------------------------- dense captioned contact sheets
tw = args.tile
th = tw * 9 // 16
step = max(1, int(round(FPS / args.fps)))
cap_h = 40
frames = {i: fr for i, fr in decode(tw, th, step)}
for s in tl["scenes"]:
    idx = [i for i in sorted(frames) if s["from"] <= i < s["to"]]
    for k in range(0, len(idx), args.per_sheet):
        chunk = idx[k:k + args.per_sheet]
        cols = 6
        rows = (len(chunk) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * tw, rows * (th + cap_h)), "white")
        d = ImageDraw.Draw(sheet)
        for n, i in enumerate(chunk):
            x, y = (n % cols) * tw, (n // cols) * (th + cap_h)
            sheet.paste(Image.fromarray(frames[i]), (x, y + cap_h))
            t = i / FPS
            txt, cur = spoken_at(i)
            d.text((x + 4, y + 2), f"{s['id']} {int(t // 60)}:{t % 60:04.1f} f{i}", fill="black", font=FONTB)
            line = txt if len(txt) < 58 else "…" + txt[-57:]
            d.text((x + 4, y + 20), line, fill=(150, 40, 30) if cur else (90, 90, 90), font=FONT)
        sheet.save(os.path.join(args.out, f"{s['id']}_sheet{k // args.per_sheet + 1:02d}.jpg"), quality=80)
print(json.dumps(per_scene, indent=1))
print("still runs >= 0.8 s:", len(runs), "total", round(sum(r["seconds"] for r in runs), 1), "s")
