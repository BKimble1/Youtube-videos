"""V5 master (left) vs V6 master (right) at the V6 brief's problem spots. The narration is unchanged, so each pair is
the same timecode in both. Writes qa/v6/compare/<name>.png. Usage: python3 tools/v6/compare_v6.py
"""
import os, subprocess, tempfile

from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
OLD = os.path.join(ROOT, "exports", "FGW_RobotsDestroy_v5_UPLOAD_1080p.mp4")
NEW = os.path.join(ROOT, "exports", "FGW_RobotsDestroy_v6_UPLOAD_1080p.mp4")
OUT = os.path.join(ROOT, "qa", "v6", "compare")
os.makedirs(OUT, exist_ok=True)
SETS = {  # name: [seconds, ...] (same timecode in both)
    "01_opening_entry_and_material_change": [2.4, 2.9, 3.3],
    "02_factory_cycle_and_timelapse": [8.0, 12.6, 16.5],
    "03_sale_sign_and_cancellation": [23.4, 28.9, 29.6],
    "04_phone_post_and_paraphrase_pill": [61.5, 66.8, 68.6],
    "05_foundry_monitor_chain_clipboard": [73.0, 76.5, 79.5],
    "06_training_banner_and_framing": [93.0, 96.9, 97.6],
    "07_failed_landing_close_views": [99.4, 100.7, 101.9],
    "08_grid_and_incident_report": [110.5, 113.0, 114.6],
    "09_policy_connectors_and_mallet": [126.0, 131.0, 135.63],
    "10_sim_to_real_handoff": [139.9, 140.2, 140.5],
    "11_variations_and_dice": [153.4, 155.6, 157.3],
    "12_airbag_and_interference": [169.0, 169.3, 174.5],
    "13_ghost_trajectory_and_warehouse": [185.0, 185.6, 192.3],
    "14_ending_payoff": [204.0, 211.2, 213.6],
}


def grab(src, t, path):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", src, "-frames:v", "1", "-vf", "scale=960:540", path], check=True)


for name, ts in SETS.items():
    sheet = Image.new("RGB", (1920, 540 * len(ts)), (20, 20, 20))
    d = ImageDraw.Draw(sheet)
    with tempfile.TemporaryDirectory() as td:
        for i, t in enumerate(ts):
            for j, (src, lab) in enumerate(((OLD, "V5"), (NEW, "V6"))):
                p = os.path.join(td, f"{i}{j}.png")
                grab(src, t, p)
                sheet.paste(Image.open(p), (j * 960, i * 540))
                d.rectangle([j * 960, i * 540, j * 960 + 190, i * 540 + 30], fill=(0, 0, 0))
                d.text((j * 960 + 8, i * 540 + 8), f"{lab}  {t:.2f}s", fill=(255, 255, 0))
    sheet.save(os.path.join(OUT, f"{name}.png"))
print("written:", ", ".join(SETS))
