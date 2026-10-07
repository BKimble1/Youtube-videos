#!/usr/bin/env python3
"""Frame-level QA material from a finished render.

  python3 tools/qa_sheets.py exports/<master>.mp4

Writes, under qa/frames/:
  sheet_S<n>.jpg          one contact sheet per scene at 1 frame per second (480 px wide tiles, 6 per row)
  boundaries/<id>_<f>.png full-resolution frames around every scene boundary (f-2 .. f+2)
  phone/<name>.jpg        key frames downscaled to 360 px wide (phone-size legibility check)
  frame_stats.json        per-scene mean luminance and inter-frame difference at 1 fps (static / black detection)
"""
import json
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "exports/Future_Got_Weird_Video_01_Pass_2_1080p.mp4")
OUT = os.path.join(ROOT, "qa/frames")
FPS = 30
tl = json.load(open(os.path.join(ROOT, "source/src/data/timeline.json")))


def frame_png(frame, path, width=None):
    vf = f"select=eq(n\\,{frame})" + (f",scale={width}:-1" if width else "")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", SRC, "-vf", vf, "-vsync", "0", "-frames:v", "1", path], check=True)


def main():
    os.makedirs(OUT, exist_ok=True)
    stats = {}
    for sc in tl["scenes"]:
        d = os.path.join(OUT, sc["id"])
        os.makedirs(d, exist_ok=True)
        t0, t1 = sc["from"] / FPS, sc["to"] / FPS
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t0:.3f}", "-to", f"{t1:.3f}", "-i", SRC,
                        "-vf", "fps=1,scale=480:-1", os.path.join(d, "f%03d.png")], check=True)
        files = sorted(f for f in os.listdir(d) if f.endswith(".png"))
        ims = [Image.open(os.path.join(d, f)).convert("RGB") for f in files]
        if not ims:
            continue
        w, h = ims[0].size
        cols = 6
        rows = (len(ims) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * w, rows * (h + 22)), "white")
        dr = ImageDraw.Draw(sheet)
        lum, diffs = [], []
        prev = None
        for i, im in enumerate(ims):
            x, y = (i % cols) * w, (i // cols) * (h + 22)
            sheet.paste(im, (x, y + 22))
            tsec = t0 + i
            dr.text((x + 6, y + 4), f"{sc['id']}  {int(tsec // 60)}:{tsec % 60:04.1f}  f{int(round(tsec * FPS))}", fill="black")
            a = np.asarray(im, dtype=np.float32)
            lum.append(float(a.mean()))
            if prev is not None:
                diffs.append(float(np.abs(a - prev).mean()))
            prev = a
        sheet.save(os.path.join(OUT, f"sheet_{sc['id']}.jpg"), quality=78)
        stats[sc["id"]] = {"seconds": len(ims), "mean_luma": round(float(np.mean(lum)), 1), "min_luma": round(float(np.min(lum)), 1),
                           "mean_diff_1fps": round(float(np.mean(diffs)), 2) if diffs else None,
                           "static_pairs_below_0.5": int(sum(1 for x in diffs if x < 0.5))}
    # scene boundaries: five full-res frames around each cut
    bd = os.path.join(OUT, "boundaries")
    os.makedirs(bd, exist_ok=True)
    for sc in tl["scenes"][1:]:
        for f in range(sc["from"] - 2, sc["from"] + 3):
            frame_png(f, os.path.join(bd, f"{sc['id']}_{f:05d}.png"), width=640)
    # phone-size crops of key frames
    ph = os.path.join(OUT, "phone")
    os.makedirs(ph, exist_ok=True)
    seg = {s["id"]: s for s in tl["segments"]}
    keys = {"hook_slips": seg["s03"]["from"] + 10, "title": seg["s06"]["to"] - 10, "tokens": seg["s10"]["from"] + 60,
            "library": seg["s15"]["from"] + 60, "record": seg["s18"]["from"] + 40, "quiz": seg["s24"]["from"] + 20,
            "table2": seg["s26"]["from"] + 80, "helps": seg["s28"]["from"] + 300, "verify": seg["s31"]["from"] + 200,
            "payoff": seg["s34"]["from"] + 60, "end_card": seg["s36"]["from"] + 90}
    for name, f in keys.items():
        frame_png(f, os.path.join(ph, f"{name}_{f:05d}.jpg"), width=360)
    json.dump(stats, open(os.path.join(OUT, "frame_stats.json"), "w"), indent=1)
    print(json.dumps(stats, indent=1))


if __name__ == "__main__":
    main()
