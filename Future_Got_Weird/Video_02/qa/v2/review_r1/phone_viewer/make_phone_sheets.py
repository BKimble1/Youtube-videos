#!/usr/bin/env python3
"""Phone-width (390 px) contact sheets, 4x4 tiles = 8 s per sheet at 2 fps, captioned with time, frame, spoken words.
usage: make_phone_sheets.py <frames_dir> <timeline.json> <out_dir> [--words]  (frames p0000.png at 2 fps)"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont

fdir, tlp, out = sys.argv[1:4]
show_words = "--words" in sys.argv
tl = json.load(open(tlp))
FPS = tl["fps"]
words = [(w["from"], w["to"], w["w"]) for s in tl["segments"] for w in s["words"]]
F = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 13)
FB = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 13)
files = sorted(f for f in os.listdir(fdir) if f.endswith(".png"))
os.makedirs(out, exist_ok=True)
TW, TH, CAP = 390, 219, 34 if show_words else 18
COLS, ROWS = 4, 4
per = COLS * ROWS


def scene_of(f):
    return next((s["id"] for s in tl["scenes"] if s["from"] <= f < s["to"]), "?")


for k in range(0, len(files), per):
    chunk = files[k:k + per]
    sheet = Image.new("RGB", (COLS * (TW + 4), ROWS * (TH + CAP + 4)), "white")
    d = ImageDraw.Draw(sheet)
    for n, fn in enumerate(chunk):
        idx = int(fn[1:5])
        gf = idx * 15
        t = gf / FPS
        x, y = (n % COLS) * (TW + 4), (n // COLS) * (TH + CAP + 4)
        im = Image.open(os.path.join(fdir, fn)).convert("RGB")
        sheet.paste(im, (x, y + CAP))
        d.text((x + 2, y + 1), f"{scene_of(gf)} {int(t // 60)}:{t % 60:04.1f} f{gf}", fill="black", font=FB)
        if show_words:
            ws = [w[2] for w in words if w[1] >= gf - 12 and w[0] <= gf + 12]
            line = " ".join(ws)
            line = line if len(line) < 52 else "…" + line[-51:]
            d.text((x + 2, y + 17), line, fill=(150, 40, 30), font=F)
    t0 = int(chunk[0][1:5]) / 2
    sheet.save(os.path.join(out, f"phone_{k // per + 1:02d}_{int(t0 // 60)}m{int(t0 % 60):02d}s.png"))
print("sheets:", (len(files) + per - 1) // per)
