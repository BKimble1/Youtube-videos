#!/usr/bin/env python3
"""Measured QA of a rendered review file.
  - ffprobe: size, frame rate, frame count, duration, codecs
  - full decode (errors fail the check)
  - frame-to-frame change (mean absolute difference at 270x480), to find any single-frame jump; each large change is
    listed with whether it is a planned transition
  - motion between neighbouring frames: the longest run of near-static frames (the brief: no static holds over 1 s)
  - loop seam: last frame vs first frame
  - contact sheets: every 0.5 s, and the hook (0-2.5 s) every 3rd frame
usage: python3 tools/qa_render.py <video.mp4> <out_dir>   (Frozen Frog: planned transitions listed below)"""
import json, subprocess, sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

src, out = sys.argv[1:3]
os.makedirs(out, exist_ok=True)
pr = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', src], capture_output=True, text=True, check=True).stdout)
vs = [s for s in pr['streams'] if s['codec_type'] == 'video'][0]
au = [s for s in pr['streams'] if s['codec_type'] == 'audio']
dec = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-f', 'null', '-'], capture_output=True, text=True)
W, H = 270, 480
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-vf', f'scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3).astype(np.float32)
n = len(fr)
fps = eval(vs['r_frame_rate'])
d = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2, 3))
PLANNED = [(0.3, 2.05, 'push into the chest as the frog freezes; the window opens'), (3.1, 4.6, 'the cutaway widens over the trunk'),
           (4.5, 6.3, 'dive into the tissue'), (8.45, 9.4, 'pull out to the trunk'), (10.4, 11.3, 'follow the sugar back into the tissue'),
           (13.8, 15.05, 'out through the body to the winter scene'), (15.0, 16.3, 'winter passes'), (16.4, 18.4, 'spring; push to the chest'),
           (18.3, 19.1, 'into the chest'), (20.05, 20.8, 'out to the face'), (20.8, 22.5, 'the hop and the follow')]
PLANNED_V2 = [(0.25, 1.3, 'the ice wave and the push through the chest to the heart'), (1.3, 2.3, 'ice bursts round the stopped heart'),
              (2.6, 4.05, 'the window opens over the trunk'), (4.35, 5.25, 'dive into the tissue'), (8.4, 9.35, 'pull out to the trunk'),
              (10.1, 11.0, 'follow the sugar into the vessel'), (11.55, 12.25, 'from the vessel to the cell'), (13.85, 15.05, 'out to the frozen frog under snow'),
              (15.0, 16.75, 'days pass: the camera rises, the sky turns'), (16.4, 18.95, 'spring; into the chest'),
              (19.55, 20.85, 'the first pulse, circulation, out to the face'), (20.8, 22.95, 'the leap toward the camera and the landing')]
if 'V2' in os.path.basename(src): PLANNED = PLANNED_V2
PLANNED_V3 = [(0.05, 1.0, 'the ice wave and the push into the chest'), (1.55, 2.6, 'ice bursts round the stopped heart; the lock'),
              (2.95, 3.95, 'the window opens over the trunk'), (3.85, 4.75, 'dive into the tissue'), (7.8, 8.8, 'pull out to the liver'),
              (9.9, 10.8, 'follow the sugar into the vessel'), (11.35, 12.05, 'from the vessel to the cell'), (13.8, 14.9, 'out to the frozen frog under snow'),
              (14.8, 16.95, 'days pass: the camera rises, the sky turns; the snow melts'), (16.85, 18.65, 'spring; into the chest'),
              (19.55, 20.9, 'the first heartbeat, circulation, out to the whole frog'), (20.85, 23.45, 'the two hops and the landing')]
if 'V3' in os.path.basename(src): PLANNED = PLANNED_V3
med = float(np.median(d))
big = [(i + 1, round((i + 1) / fps, 3), round(float(x), 2)) for i, x in enumerate(d) if x > max(12.0, 5 * med)]
jumps = []
for f, ts, v in big:
    why = [p[2] for p in PLANNED if p[0] <= ts <= p[1]]
    jumps.append({'frame': f, 't': ts, 'mad': v, 'planned': why[0] if why else None})
static = d < 0.35
run, best, best_at = 0, 0, 0
for i, s in enumerate(static):
    run = run + 1 if s else 0
    if run > best: best, best_at = run, i - run + 2
loop = float(np.abs(fr[-1] - fr[0]).mean())
res = {
    'file': os.path.basename(src), 'size_mb': round(os.path.getsize(src) / 1e6, 2),
    'video': {'codec': vs['codec_name'], 'w': vs['width'], 'h': vs['height'], 'fps': vs['r_frame_rate'], 'pix_fmt': vs['pix_fmt'], 'frames_decoded': n, 'duration_s': round(n / fps, 3)},
    'audio': [{'codec': a['codec_name'], 'sr': a['sample_rate'], 'ch': a['channels'], 'bitrate': a.get('bit_rate')} for a in au],
    'decode_errors': dec.stderr.strip()[:500] or None,
    'frame_change_median': round(med, 2),
    'large_changes': jumps,
    'unplanned_large_changes': [j for j in jumps if not j['planned']],
    'longest_near_static_run_frames': best, 'longest_near_static_run_starts_s': round(best_at / fps, 2),
    'loop_last_vs_first_mad': round(loop, 2),
}
json.dump(res, open(os.path.join(out, 'render_qa.json'), 'w'), indent=1)
print(json.dumps(res, indent=1))

def sheet(idx, cols, path, scale=0.25):
    # ffmpeg's select returns frames in stream order, so decode sorted and put them back in the requested order
    order = sorted(set(idx))
    full = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-vf', f"select='{'+'.join(f'eq(n,{i})' for i in order)}',scale={int(1080 * scale)}:{int(1920 * scale)}", '-vsync', '0', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
    w, h = int(1080 * scale), int(1920 * scale)
    got = np.frombuffer(full, np.uint8).reshape(-1, h, w, 3)
    ims = [got[order.index(i)] for i in idx]
    rows = (len(ims) + cols - 1) // cols
    canvas = Image.new('RGB', (cols * w, rows * h), (16, 16, 16))
    dr = ImageDraw.Draw(canvas)
    for k, im in enumerate(ims):
        x, y = (k % cols) * w, (k // cols) * h
        canvas.paste(Image.fromarray(im), (x, y))
        dr.rectangle([x, y, x + 132, y + 26], fill=(0, 0, 0))
        dr.text((x + 6, y + 6), f'{idx[k]}  {idx[k] / fps:.2f}s', fill=(255, 230, 0))
    canvas.save(path)
sheet(list(range(0, n, 15)), 10, os.path.join(out, 'contact_every_0.5s.png'), 0.2)
sheet(list(range(0, 76, 3)), 9, os.path.join(out, 'hook_0-2.5s_every_3rd_frame.png'), 0.2)
sheet([n - 3, n - 2, n - 1, 0, 1, 2], 6, os.path.join(out, 'loop_seam_last3_first3.png'), 0.3)
