"""V4 master (left) vs V5 master (right) at the brief's problem spots. The narration was recut, so each pair is matched
by content, not by timecode. Writes qa/v5/compare/<name>.png. Usage: python3 tools/v5/compare_v5.py
"""
import os, subprocess, tempfile

from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
OLD = os.path.join(ROOT, "exports", "FGW_RobotsDestroy_v4_UPLOAD_1080p.mp4")
NEW = os.path.join(ROOT, "exports", "FGW_RobotsDestroy_v5_UPLOAD_1080p.mp4")
OUT = os.path.join(ROOT, "qa", "v5", "compare")
os.makedirs(OUT, exist_ok=True)
SETS = {  # name: [(v4 seconds, v5 seconds), ...]
    "opening_first_seconds": [(0.3, 0.3), (1.5, 1.5), (2.5, 2.4), (8.0, 3.6)],
    "policy_tipping_label_removed": [(135.0, 124.5), (140.0, 129.6)],
    "banner_and_card_clearance": [(165.0, 156.0), (170.0, 160.5)],
    "real_jump_no_hold": [(191.5, 176.9), (192.5, 177.2)],
    "unfamiliar_task_and_ending": [(205.0, 192.4), (222.0, 207.6), (228.0, 214.3)],
}


def grab(src, t, path):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", src, "-frames:v", "1", "-vf", "scale=960:540", path], check=True)


for name, pairs in SETS.items():
    sheet = Image.new("RGB", (1920, 540 * len(pairs)), (20, 20, 20))
    d = ImageDraw.Draw(sheet)
    with tempfile.TemporaryDirectory() as td:
        for i, ts in enumerate(pairs):
            for j, (src, lab) in enumerate(((OLD, "V4"), (NEW, "V5"))):
                p = os.path.join(td, f"{i}{j}.png")
                grab(src, ts[j], p)
                sheet.paste(Image.open(p), (j * 960, i * 540))
                d.rectangle([j * 960, i * 540, j * 960 + 190, i * 540 + 30], fill=(0, 0, 0))
                d.text((j * 960 + 8, i * 540 + 8), f"{lab}  {ts[j]:.2f}s", fill=(255, 255, 0))
    sheet.save(os.path.join(OUT, f"{name}.png"))
print("written:", ", ".join(SETS))
