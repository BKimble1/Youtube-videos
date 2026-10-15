"""Side-by-side comparison frames, V3 master (left) vs V4 master (right), at the same timecodes (same narration).
Writes qa/v4/compare/<name>.png. Usage: python3 tools/v4/compare_v4.py
"""
import os, subprocess, tempfile

from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
OLD = os.path.join(ROOT, "exports", "FGW_RobotsDestroy_v3_UPLOAD_1080p.mp4")
NEW = os.path.join(ROOT, "exports", "FGW_RobotsDestroy_v4_UPLOAD_1080p.mp4")
OUT = os.path.join(ROOT, "qa", "v4", "compare")
os.makedirs(OUT, exist_ok=True)
SETS = {
    "model_emblem_v3_vs_v4": [19.45, 21.5, 23.0, 30.5],
    "transition_0196_v3_vs_v4": [19.30, 19.45, 19.60, 19.75],
    "limb_overlap_2m15_v3_vs_v4": [135.5, 138.0, 140.5, 143.4],
    "building_airbag_v3_vs_v4": [176.5, 178.3, 179.5, 180.4],
}


def grab(src, t, path):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", src, "-frames:v", "1", "-vf", "scale=960:540", path], check=True)


for name, times in SETS.items():
    sheet = Image.new("RGB", (1920, 540 * len(times)), (20, 20, 20))
    d = ImageDraw.Draw(sheet)
    with tempfile.TemporaryDirectory() as td:
        for i, t in enumerate(times):
            for j, (src, lab) in enumerate(((OLD, "V3"), (NEW, "V4"))):
                p = os.path.join(td, f"{i}{j}.png")
                grab(src, t, p)
                sheet.paste(Image.open(p), (j * 960, i * 540))
                d.rectangle([j * 960, i * 540, j * 960 + 190, i * 540 + 30], fill=(0, 0, 0))
                d.text((j * 960 + 8, i * 540 + 8), f"{lab}  {t:.2f}s", fill=(255, 255, 0))
    sheet.save(os.path.join(OUT, f"{name}.png"))
print("written:", ", ".join(SETS))
