"""Dense frame bursts from the V2 master at contacts, cuts and transitions (every 2nd frame, 15 per second of video).

Writes qa/v2/bursts/<name>.png (6 columns, time stamped). Usage: python3 tools/v2/bursts_v2.py [master.mp4]
"""
import os, subprocess, sys, tempfile, glob

from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
MASTER = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "exports", "FGW_RobotsDestroy_v2_UPLOAD_1080p.mp4")
OUT = os.path.join(ROOT, "qa", "v2", "bursts")
os.makedirs(OUT, exist_ok=True)
BURSTS = {
    "01_takeoff": (0.0, 1.2), "02_hook_impact": (2.7, 4.3), "03_rim_to_cap_match": (13.3, 14.7), "04_iris_into_sim": (16.6, 17.8),
    "05_crate_lock_shutter": (43.0, 44.6), "06_phone_whip": (75.1, 76.1), "07_chain_to_crane": (84.9, 86.1),
    "08_sim_wipe": (99.4, 101.0), "09_faceplant": (122.9, 124.1), "10_airbag": (179.5, 180.7), "11_em_spark": (185.4, 186.4),
    "12_payoff_entry": (194.1, 195.3), "13_leap": (211.9, 213.1), "14_reverse_whip": (215.2, 216.2), "15_last_entry": (224.1, 225.3),
    "16_ring_to_sting": (230.8, 232.0),
}
for name, (a, b) in BURSTS.items():
    with tempfile.TemporaryDirectory() as td:
        subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{a}", "-i", MASTER, "-t", f"{b - a}", "-vf", "fps=15,scale=384:216", os.path.join(td, "f%03d.png")], check=True)
        fs = sorted(glob.glob(os.path.join(td, "*.png")))
        cols = 6
        rows = (len(fs) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * 384, rows * 216))
        d = ImageDraw.Draw(sheet)
        for i, f in enumerate(fs):
            x, y = (i % cols) * 384, (i // cols) * 216
            sheet.paste(Image.open(f), (x, y))
            d.rectangle([x, y, x + 64, y + 16], fill=(0, 0, 0))
            d.text((x + 3, y + 2), f"{a + i / 15:.2f}", fill=(255, 255, 0))
        sheet.save(os.path.join(OUT, f"{name}.png"))
        print(name, len(fs), "frames")
