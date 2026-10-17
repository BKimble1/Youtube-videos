# Rocket Short QA contact sheets from the rendered MP4: python3 tools/qa_rocket_sheets.py <mp4> <outdir> [sheet names]
import subprocess, sys, os
import numpy as np
from PIL import Image, ImageDraw
mp4, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)

def frame(t, w=270):
    h = int(w * 1920 / 1080)
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.4f}', '-i', mp4, '-frames:v', '1', '-vf', f'scale={w}:{h}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
    im = Image.frombytes('RGB', (w, h), raw)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 64, 16], fill=(0, 0, 0)); d.text((3, 2), f'{t:.2f}s', fill=(255, 255, 0))
    return im

def sheet(name, ts, cols=6, w=270):
    ims = [frame(t, w) for t in ts]
    h = ims[0].size[1]
    rows = (len(ims) + cols - 1) // cols
    S = Image.new('RGB', (w * cols, h * rows), (60, 60, 60))
    for i, im in enumerate(ims):
        S.paste(im, ((i % cols) * w, (i // cols) * h))
    S.save(os.path.join(out, name), quality=85)
    print(name, len(ts))

r = lambda a, b, fps: list(np.round(np.arange(a, b + 1e-6, 1 / fps), 3))
which = sys.argv[3:] or ['all']
if 'all' in which or 'sheet' in which: sheet('rocket_fp_render_sheet_2fps.jpg', r(0.0, 34.15, 2), cols=10, w=180)
if 'all' in which or 'first' in which: sheet('rocket_fp_first2s_10fps.jpg', r(0.0, 1.95, 10), cols=10, w=180)
if 'all' in which or 'last' in which: sheet('rocket_fp_last2s_10fps.jpg', r(32.2, 34.17, 10), cols=10, w=180)
if 'all' in which or 'match' in which: sheet('rocket_fp_match_3.2-4.8s.jpg', r(3.2, 4.8, 10), cols=9, w=200)
if 'all' in which or 'force' in which: sheet('rocket_fp_force_tank_7.4-15.2s.jpg', r(7.4, 15.2, 2.5), cols=10, w=180)
if 'all' in which or 'torque' in which: sheet('rocket_fp_balance_15-22.4s.jpg', r(15.0, 22.4, 3), cols=12, w=150)
if 'all' in which or 'gravel' in which: sheet('rocket_fp_gravel_wipe_22-27.2s.jpg', r(22.0, 27.2, 4), cols=11, w=160)
if 'all' in which or 'cta' in which: sheet('rocket_fp_payoff_cta_26.4-34.17s.jpg', r(26.4, 34.17, 2.5), cols=10, w=170)
