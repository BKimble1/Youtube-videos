#!/usr/bin/env python3
"""Extract 1 frame/second from a render and build timestamped 3x3 contact sheets per scene/act.
Usage: python3 tools/review_sheets.py <video.mp4> <out_dir>
"""
import json, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
video, out = sys.argv[1], sys.argv[2]
fr = os.path.join(out, "frames"); os.makedirs(fr, exist_ok=True)
subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", video, "-vf", "fps=1,scale=640:-1", os.path.join(fr, "t_%04d.png")], check=True)
tl = json.load(open(os.path.join(ROOT, "source/src/data/timeline.json")))
files = sorted(f for f in os.listdir(fr) if f.endswith(".png"))
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22)
except Exception:
    font = ImageFont.load_default()
index = {}
for sc in tl["scenes"]:
    a, b = sc["from"] / 30, sc["to"] / 30
    sel = [f for f in files if a <= (int(f[2:6]) - 0.5) < b]  # frame k ~ t = k-0.5 s
    sheets = []
    for i in range(0, len(sel), 9):
        grid = Image.new("RGB", (640 * 3, 360 * 3), "black")
        d = ImageDraw.Draw(grid)
        for j, f in enumerate(sel[i:i + 9]):
            im = Image.open(os.path.join(fr, f)).convert("RGB").resize((640, 360))
            x, y = (j % 3) * 640, (j // 3) * 360
            grid.paste(im, (x, y))
            t = int(f[2:6]) - 0.5
            label = f"{int(t // 60)}:{t % 60:04.1f}"
            d.rectangle([x, y, x + 92, y + 30], fill=(0, 0, 0))
            d.text((x + 6, y + 3), label, fill=(255, 220, 0), font=font)
        name = os.path.join(out, f"{sc['id']}_sheet{i // 9 + 1:02d}.png")
        grid.save(name)
        sheets.append(name)
    index[sc["id"]] = {"from_s": round(a, 2), "to_s": round(b, 2), "sheets": sheets}
json.dump(index, open(os.path.join(out, "index.json"), "w"), indent=1)
print(json.dumps({k: len(v["sheets"]) for k, v in index.items()}))
