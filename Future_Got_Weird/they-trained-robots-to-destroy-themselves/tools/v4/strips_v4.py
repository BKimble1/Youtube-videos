"""Transition strips for the V4 master: every transition gets 25 consecutive frames (12 before, the boundary, 12 after)
at 384x216 in a 5x5 sheet, frame-stamped. Reads qa/v4/transitions_v4.json. Writes qa/v4/strips/<name>.png.
Usage: python3 tools/v4/strips_v4.py [master.mp4]
"""
import glob, json, os, subprocess, sys, tempfile

from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
MASTER = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "exports", "FGW_RobotsDestroy_v4_UPLOAD_1080p.mp4")
OUT = os.path.join(ROOT, "qa", "v4", "strips")
os.makedirs(OUT, exist_ok=True)
TR = json.load(open(os.path.join(ROOT, "qa", "v4", "transitions_v4.json")))
for name, t in TR.items():
    f0 = max(0, int(round(t * 30)) - 12)
    with tempfile.TemporaryDirectory() as td:
        subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{f0 / 30:.4f}", "-i", MASTER, "-frames:v", "25", "-vf", "scale=384:216", os.path.join(td, "f%03d.png")], check=True)
        fs = sorted(glob.glob(os.path.join(td, "*.png")))
        sheet = Image.new("RGB", (5 * 384, 5 * 216))
        dr = ImageDraw.Draw(sheet)
        for i, f in enumerate(fs):
            x, y = (i % 5) * 384, (i // 5) * 216
            sheet.paste(Image.open(f), (x, y))
            fr = f0 + i
            dr.rectangle([x, y, x + 150, y + 22], fill=(0, 0, 0))
            dr.text((x + 6, y + 4), f"{fr} ({fr / 30:.2f}s)", fill=(255, 255, 0) if fr == int(round(t * 30)) else (255, 255, 255))
        sheet.save(os.path.join(OUT, f"{name}.png"))
print(f"{len(TR)} strips in {os.path.relpath(OUT, ROOT)}")
