#!/usr/bin/env python3
"""Measured QA of a rendered review file.
  - ffprobe: size, frame rate, frame count, duration, codecs
  - full decode (errors fail the check)
  - frame-to-frame change (mean absolute difference at 270x480), to find any single-frame jump; each large change is
    listed with whether it is a planned transition
  - motion between neighbouring frames: the longest run of near-static frames (the brief: no static holds over 1 s)
  - loop seam: last frame vs first frame
  - contact sheets: every 0.5 s, and the hook (0-2.5 s) every 3rd frame
usage: python3 tools/qa_render.py <video.mp4> <out_dir>"""
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
# planned transitions (story.ts): portal hand-offs, the match cut and the staged events
PLANNED = [(1.3, 1.95, 'push into the visor reflection -> space'), (3.8, 5.15, 'ship approach, through the porthole'), (6.3, 7.25, 'into the watch Earth sub-dial'),
           (8.2, 9.3, 'push to Earth, cloud pass, descent to the street'), (11.0, 12.7, 'tilt up, capsule descent and landing'), (14.3, 15.5, 'run to the door, through the doorway'),
           (17.4, 19.2, 'push to his face, into the eye, the pupil becomes the shadow'), (20.4, 21.1, 'push into the watch, match to his real watch'), (21.8, 23.54, 'visor push, the hole fills the frame, pull back to the opening'),
           (0.0, 0.2, 'loop seam')]
# V2 (src/v2/timing.ts): the visor cut, the window hand-off, the match cut, the window push, the two foreground wipes,
# the landing, the doorframe wipe and the push into the print
if 'V2' in os.path.basename(src):
    PLANNED = [(2.0, 2.15, 'cut: visor reflection -> real black hole'), (3.8, 4.85, 'capsule approach, through the cockpit window'),
               (8.15, 8.3, 'match cut: watch -> home wall clock'), (9.0, 9.5, 'push through the room window into the yard'),
               (9.9, 10.08, 'foreground trunk wipe (years pass)'), (10.5, 10.68, 'foreground leaves wipe (years pass)'),
               (11.15, 12.8, 'light pass, capsule descent, landing, hatch'), (15.2, 15.65, 'doorframe passes the lens -> family room'),
               (21.4, 23.54, 'push into the pre-departure print'), (0.0, 0.2, 'loop seam')]
# V3 (src/v3/timing.ts): the push through the ship's window into the cockpit, the watch push, the match cut, the window
# match from inside to outside, the landing, the cut from the front door to the room, the loop cut (watch -> ship window)
if 'V3' in os.path.basename(src):
    PLANNED = [(2.7, 4.6, "push to the ship, through its window into the cockpit"), (5.1, 6.1, 'push into the watch (camera roll)'),
               (8.15, 8.3, 'match cut: watch -> home wall clock'), (9.2, 9.32, 'match cut: the window from inside -> from outside'),
               (11.4, 12.6, 'capsule descent, landing, hatch'), (15.8, 15.92, 'cut: front door outside -> the room inside'),
               (22.7, 23.1, 'push into the watch face, match cut to the ship window'), (0.0, 0.2, 'loop seam')]
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
# one-frame glitches (e.g. an image that failed to paint): on a 27x48 area-averaged copy (fine texture removed), a
# frame far from the average of its two neighbours, relative to how much those neighbours differ (V1 calibration:
# the three known bad frames scored 3.7 and 2.5; the busiest legitimate motion scores <= 1.6)
lo = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-vf', 'scale=27:48:flags=area', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout, np.uint8).reshape(-1, 48, 27, 3).astype(np.float32)
spikes = []
for i in range(1, len(lo) - 1):
    r = float(np.abs(lo[i] - (lo[i - 1] + lo[i + 1]) / 2).mean()); skip = float(np.abs(lo[i + 1] - lo[i - 1]).mean())
    score = r / (skip / 2 + 2)
    if score > 2.0:
        spikes.append({'frame': i, 't': round(i / fps, 3), 'score': round(score, 2)})
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
    'one_frame_glitches': spikes,
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
sheet(list(range(n - 30, n)) + list(range(0, 15)), 9, os.path.join(out, 'loop_last1s_first0.5s.png'), 0.2)
sheet([n - 3, n - 2, n - 1, 0, 1, 2], 6, os.path.join(out, 'loop_seam_last3_first3.png'), 0.3)
