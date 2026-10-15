"""Phone-size review pages for the V6 master: the moments with text or small detail, each frame scaled to 390x219
(an iPhone in portrait shows a 16:9 video about 390 points wide), 3 columns per page, time-stamped.
Writes qa/v6/phone/page_<n>.png. Usage: python3 tools/v6/phone_v6.py [master.mp4]
"""
import os, subprocess, sys, tempfile

from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
MASTER = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "exports", "FGW_RobotsDestroy_v6_UPLOAD_1080p.mp4")
OUT = os.path.join(ROOT, "qa", "v6", "phone")
os.makedirs(OUT, exist_ok=True)
TIMES = [1.2, 9.5, 12.6, 23.5, 26.8, 29.6, 31.9, 34.0, 41.5, 46.5, 50.8, 52.6,
         61.5, 64.9, 67.5, 69.4, 76.5, 79.6, 82.6, 93.5, 99.4, 100.7, 101.9, 103.0,
         112.5, 118.9, 126.5, 131.0, 135.63, 144.0, 147.0, 149.5, 157.3, 163.0, 175.0, 185.5,
         192.3, 199.0, 207.4, 208.6, 214.2, 216.0]
W, H, COLS = 390, 219, 3
PER = 12
for p in range(0, len(TIMES), PER):
    ts = TIMES[p:p + PER]
    rows = (len(ts) + COLS - 1) // COLS
    sheet = Image.new("RGB", (COLS * (W + 12) + 12, rows * (H + 30) + 12), (245, 245, 245))
    d = ImageDraw.Draw(sheet)
    with tempfile.TemporaryDirectory() as td:
        for i, t in enumerate(ts):
            f = os.path.join(td, f"{i}.png")
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", MASTER, "-frames:v", "1", "-vf", f"scale={W}:{H}:flags=area", f], check=True)
            x, y = 12 + (i % COLS) * (W + 12), 12 + (i // COLS) * (H + 30)
            sheet.paste(Image.open(f), (x, y + 18))
            d.text((x, y + 2), f"{int(t // 60)}:{t % 60:05.2f}", fill=(0, 0, 0))
    sheet.save(os.path.join(OUT, f"page_{p // PER + 1}.png"))
print(f"{(len(TIMES) + PER - 1) // PER} pages in {os.path.relpath(OUT, ROOT)}")
