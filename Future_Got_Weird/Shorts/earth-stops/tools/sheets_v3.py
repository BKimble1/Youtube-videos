#!/usr/bin/env python3
"""Contact sheets of the ENCODED V3 mp4 (decoded frames, not source stills).
  python3 tools/sheets_v3.py <video> <outdir> all                    -> every frame, 45 per sheet (9 x 5 at 216 x 384)
  python3 tools/sheets_v3.py <video> <outdir> pick  f1,f2,...[:cols]  -> chosen frames, larger tiles, frame numbers on each
Frames are decoded to FGW_FRAMES (default: the session scratchpad) and reused between calls."""
import os, subprocess, sys
from PIL import Image, ImageDraw
V, OUT, MODE = sys.argv[1], sys.argv[2], sys.argv[3]
SPEC = sys.argv[4] if len(sys.argv) > 4 else ''
d = os.environ.get('FGW_FRAMES', '/tmp/claude-0/-home-user-Youtube-videos/5a2b56b4-a6c8-5b99-95a8-a2a85536ae2a/scratchpad/v3frames')
os.makedirs(d, exist_ok=True); os.makedirs(OUT, exist_ok=True)
if not os.path.exists(f'{d}/f0001.png') or os.path.getmtime(f'{d}/f0001.png') < os.path.getmtime(V):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', V, '-vsync', '0', f'{d}/f%04d.png'], check=True)
n = len([f for f in os.listdir(d) if f.endswith('.png')])
def tag(im, f):
    dr = ImageDraw.Draw(im); dr.rectangle([0, 0, 58, 18], fill=(0, 0, 0)); dr.text((3, 4), f'f{f}', fill=(255, 255, 255)); return im
if MODE == 'all':
    w, h = 216, 384
    for part in range((n + 44) // 45):
        S = Image.new('RGB', (9 * w, 5 * h), (30, 30, 30))
        for i in range(45):
            f = part * 45 + i
            if f >= n: break
            S.paste(tag(Image.open(f'{d}/f{f + 1:04d}.png').convert('RGB').resize((w, h), Image.LANCZOS), f), ((i % 9) * w, (i // 9) * h))
        S.save(f'{OUT}/all_part{part + 1:02d}.png')
    print('frames', n)
else:
    spec, _, cols = SPEC.partition(':'); fr = [int(x) for x in spec.split(',')]; cols = int(cols or 6)
    w, h = (540 // 1) // max(1, cols // 3 + 1) if cols > 3 else 360, 0
    w = 1620 // cols; h = int(w * 16 / 9)
    rows = (len(fr) + cols - 1) // cols
    S = Image.new('RGB', (cols * w, rows * h), (30, 30, 30))
    for i, f in enumerate(fr):
        S.paste(tag(Image.open(f'{d}/f{f + 1:04d}.png').convert('RGB').resize((w, h), Image.LANCZOS), f), ((i % cols) * w, (i // cols) * h))
    name = f'pick_{fr[0]}_{fr[-1]}_{len(fr)}.png'
    S.save(f'{OUT}/{name}'); print(OUT + '/' + name, S.size)
