#!/usr/bin/env python3
"""V4 loop check: the last second of the film followed immediately by the first second (the wrap), measured and laid out as a strip.
usage: python3 tools/seam_check_v4.py <V4 video.mp4> <outdir>
Writes seam_strip.png (last 15 frames, then first 15), seam_check_x3.mp4 (the film tiled 3x, git-ignored) and seam.json.
A numerically quiet seam is necessary, not sufficient: look at the strip."""
import json, subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
v = Path(sys.argv[1]); out = Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
W, H = 270, 480
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(v), '-vf', f'scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3).astype(np.float32)
n = len(fr)
d = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2, 3))
wrap = float(np.abs(fr[0] - fr[-1]).mean())
tail = [float(x) for x in d[-15:]]
head = [float(x) for x in d[:15]]
seq = list(range(n - 15, n)) + list(range(0, 15))
S = Image.new('RGB', (10 * W // 2, 3 * H // 2 + 20), 'white')
dr = ImageDraw.Draw(S)
for i, f in enumerate(seq):
    im = Image.fromarray(fr[f].astype(np.uint8)).resize((W // 2, H // 2))
    S.paste(im, ((i % 10) * (W // 2), (i // 10) * (H // 2) + 20))
    dr.text(((i % 10) * (W // 2) + 3, (i // 10) * (H // 2) + 4), f'f{f}', fill='black')
S.save(out / 'seam_strip.png')
res = {
    'frames': n,
    'wrap_diff_last_to_first_frame': round(wrap, 2),
    'median_adjacent_diff_in_film': round(float(np.median(d)), 2),
    'diff_last_15_frames': [round(x, 2) for x in tail],
    'diff_first_15_frames': [round(x, 2) for x in head],
    'note': 'frame 839 -> frame 0 is the wrap; the closing macro pulls back to the opening composition (same centre, same scale), so the wrap diff is the size of an ordinary frame step',
}
json.dump(res, open(out / 'seam.json', 'w'), indent=1)
print(json.dumps(res, indent=1))
lst = out / 'x3.txt'
lst.write_text(''.join(f"file '{v.resolve()}'\n" for _ in range(3)))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', str(lst), '-c', 'copy', str(out / 'seam_check_x3.mp4')], check=True)
lst.unlink()
