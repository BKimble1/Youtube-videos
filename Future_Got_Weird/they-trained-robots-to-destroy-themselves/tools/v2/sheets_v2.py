"""One frame per second from a rendered file, as time-stamped contact sheets (8×5 per sheet).

Usage: python3 tools/v2/sheets_v2.py <video.mp4> <out_dir>
"""
import glob, os, subprocess, sys, tempfile

from PIL import Image, ImageDraw

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
with tempfile.TemporaryDirectory() as td:
    subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-vf", "fps=1,scale=320:180", os.path.join(td, "f%03d.png")], check=True)
    fs = sorted(glob.glob(os.path.join(td, "*.png")))
    per = 40
    for k in range(0, len(fs), per):
        s = Image.new("RGB", (8 * 320, 5 * 180))
        d = ImageDraw.Draw(s)
        for i, f in enumerate(fs[k:k + per]):
            x, y = (i % 8) * 320, (i // 8) * 180
            s.paste(Image.open(f), (x, y))
            t = k + i + 0.5
            d.rectangle([x, y, x + 52, y + 16], fill=(0, 0, 0))
            d.text((x + 3, y + 2), f"{t:.1f}", fill=(255, 255, 0))
        s.save(os.path.join(out, f"sheet_{k // per:02d}.png"))
    print(len(fs), "frames")
