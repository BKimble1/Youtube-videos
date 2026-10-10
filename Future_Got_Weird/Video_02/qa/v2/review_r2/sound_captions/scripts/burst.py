#!/usr/bin/env python3
"""burst.py out.jpg f0 f1 step [cols] [width] [crop x,y,w,h]: exact frames f0..f1 (every step) of the release candidate, tiled with frame labels."""
import sys, os, subprocess, tempfile
from PIL import Image, ImageDraw, ImageFont
FILM = '/home/user/Youtube-videos/Future_Got_Weird/Video_02/exports/Future_Got_Weird_Video_02_v2_UPLOAD_1080p.mp4'
out, f0, f1, step = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4])
cols = int(sys.argv[5]) if len(sys.argv) > 5 else 6
width = int(sys.argv[6]) if len(sys.argv) > 6 else 480
crop = [int(v) for v in sys.argv[7].split(',')] if len(sys.argv) > 7 else None
td = tempfile.mkdtemp()
# decode the range once at 30 fps (accurate seek), keep every step-th frame
ss = max(0, f0 / 30 - 0.0)
vf = f"select='not(mod(n\\,{step}))'"
if crop: vf = f"crop={crop[2]}:{crop[3]}:{crop[0]}:{crop[1]}," + vf
subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{ss:.4f}', '-i', FILM, '-t', f'{(f1 - f0 + 0.5) / 30:.4f}', '-vf', vf, '-vsync', '0', f'{td}/%05d.png'], check=True)
files = sorted(os.listdir(td))
frames = [f0 + i * step for i in range(len(files))]
ims = []
for fn, fr in zip(files, frames):
    im = Image.open(os.path.join(td, fn)).convert('RGB')
    h = int(im.height * width / im.width); im = im.resize((width, h))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 150, 26], fill=(0, 0, 0)); d.text((5, 5), f"f{fr} {fr/30:.2f}s", fill=(255, 255, 0))
    ims.append(im)
rows = (len(ims) + cols - 1) // cols
W, H = ims[0].size
sheet = Image.new('RGB', (cols * W, rows * H), (40, 40, 40))
for i, im in enumerate(ims): sheet.paste(im, ((i % cols) * W, (i // cols) * H))
sheet.save(out, quality=88)
print(out, len(ims), 'frames', frames[0], '..', frames[-1])
