"""Side-by-side comparison frames, V2 master (left) vs V3 master (right), at the same timecodes.
Writes qa/v3/compare/<name>.png. Usage: python3 tools/v3/compare_v3.py
"""
import os, subprocess, tempfile

from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
V2 = os.path.join(ROOT, "exports", "FGW_RobotsDestroy_v2_UPLOAD_1080p.mp4")
V3 = os.path.join(ROOT, "exports", "FGW_RobotsDestroy_v3_UPLOAD_1080p.mp4")
OUT = os.path.join(ROOT, "qa", "v3", "compare")
os.makedirs(OUT, exist_ok=True)
SETS = {
    "block_intersection_v2_vs_v3": [131.8, 132.1, 132.4],
    "model_emblem_v2_vs_v3": [19.6, 21.5, 23.5, 24.8],
    "f03_emblem_v2_vs_v3": [30.2, 31.0],
}


def grab(src, t, path):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", src, "-frames:v", "1", "-vf", "scale=960:540", path], check=True)


for name, times in SETS.items():
    sheet = Image.new("RGB", (1920, 540 * len(times)), (20, 20, 20))
    d = ImageDraw.Draw(sheet)
    with tempfile.TemporaryDirectory() as td:
        for i, t in enumerate(times):
            for j, (src, lab) in enumerate(((V2, "V2"), (V3, "V3"))):
                p = os.path.join(td, f"{i}{j}.png")
                grab(src, t, p)
                sheet.paste(Image.open(p), (j * 960, i * 540))
                d.rectangle([j * 960, i * 540, j * 960 + 190, i * 540 + 30], fill=(0, 0, 0))
                d.text((j * 960 + 8, i * 540 + 8), f"{lab}  {t:.2f}s", fill=(255, 255, 0))
    sheet.save(os.path.join(OUT, f"{name}.png"))
print("written:", ", ".join(SETS))
