#!/usr/bin/env python3
"""Inspect a downloaded Runway clip before import: measured format, a dense contact sheet, and how closely its first and
last frames match the Remotion start/end plates it was generated from.

  python3 -I tools/inspect_insert.py <clip.mp4> <start.png> <end.png> <out_dir> [--every 4]

Writes <out_dir>/sheet.jpg (every Nth frame, numbered), <out_dir>/ends.jpg (plate | clip first, plate | clip last, with an
amplified difference image), and prints JSON: width, height, fps, frames, duration, mean absolute difference (0-255) of
first/last frames vs the plates, and the frame-to-frame motion energy per frame (to spot flashes, pops and freezes).
"""
import argparse
import json
import os
import subprocess
import tempfile

import numpy as np
from PIL import Image, ImageDraw, ImageOps


def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_frames", "-show_entries",
                          "stream=width,height,r_frame_rate,nb_read_frames:format=duration", "-of", "json", path],
                         capture_output=True, text=True, check=True).stdout
    j = json.loads(out)
    s = j["streams"][0]
    n, d = (int(x) for x in s["r_frame_rate"].split("/"))
    return {"width": s["width"], "height": s["height"], "fps": round(n / d, 3), "frames": int(s["nb_read_frames"]),
            "duration_s": round(float(j["format"]["duration"]), 3)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("clip")
    ap.add_argument("start")
    ap.add_argument("end")
    ap.add_argument("out")
    ap.add_argument("--every", type=int, default=4)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    meta = probe(a.clip)
    with tempfile.TemporaryDirectory() as td:
        subprocess.run(["ffmpeg", "-v", "error", "-i", a.clip, "-vsync", "0", os.path.join(td, "f%05d.png")], check=True)
        files = sorted(os.listdir(td))
        frames = [np.asarray(Image.open(os.path.join(td, f)).convert("RGB"), dtype=np.float32) for f in files]
    W, H = meta["width"], meta["height"]
    plate_s = np.asarray(Image.open(a.start).convert("RGB").resize((W, H), Image.LANCZOS), dtype=np.float32)
    plate_e = np.asarray(Image.open(a.end).convert("RGB").resize((W, H), Image.LANCZOS), dtype=np.float32)
    mad_s = float(np.abs(frames[0] - plate_s).mean())
    mad_e = float(np.abs(frames[-1] - plate_e).mean())
    motion = [0.0] + [float(np.abs(frames[i] - frames[i - 1]).mean()) for i in range(1, len(frames))]
    # contact sheet
    tw, th = 384, int(384 * H / W)
    idx = list(range(0, len(frames), a.every))
    if idx[-1] != len(frames) - 1:
        idx.append(len(frames) - 1)
    cols = 5
    rows = (len(idx) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tw, rows * (th + 18)), "white")
    d = ImageDraw.Draw(sheet)
    for k, i in enumerate(idx):
        im = Image.fromarray(frames[i].astype(np.uint8)).resize((tw, th))
        x, y = (k % cols) * tw, (k // cols) * (th + 18)
        sheet.paste(im, (x, y + 18))
        d.text((x + 4, y + 3), f"f{i}  motion {motion[i]:.1f}", fill="black")
    sheet.save(os.path.join(a.out, "sheet.jpg"), quality=88)
    # ends comparison
    def diff(x, y):
        return Image.fromarray(np.clip(np.abs(x - y) * 4, 0, 255).astype(np.uint8))
    ew = 640
    eh = int(ew * H / W)
    ends = Image.new("RGB", (ew * 3, eh * 2 + 40), "white")
    d = ImageDraw.Draw(ends)
    row = [(plate_s, frames[0], "start plate | clip first | |diff|x4"), (plate_e, frames[-1], "end plate | clip last | |diff|x4")]
    for r, (p, f, label) in enumerate(row):
        y = r * (eh + 20) + 20
        d.text((4, y - 16), label, fill="black")
        for c, im in enumerate([Image.fromarray(p.astype(np.uint8)), Image.fromarray(f.astype(np.uint8)), diff(p, f)]):
            ends.paste(im.resize((ew, eh)), (c * ew, y))
    ends.save(os.path.join(a.out, "ends.jpg"), quality=88)
    rep = dict(meta, mad_first_vs_start=round(mad_s, 2), mad_last_vs_end=round(mad_e, 2),
               motion_max=round(max(motion), 2), motion_max_frame=int(np.argmax(motion)),
               motion=[round(m, 2) for m in motion])
    json.dump(rep, open(os.path.join(a.out, "inspect.json"), "w"), indent=0)
    print(json.dumps({k: v for k, v in rep.items() if k != "motion"}))


if __name__ == "__main__":
    main()
