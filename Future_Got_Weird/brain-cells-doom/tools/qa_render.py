#!/usr/bin/env python3
"""Measured QA of a rendered review file.
  - ffprobe: size, frame rate, frame count, duration, codecs
  - full decode (errors fail the check)
  - frame-to-frame change (mean absolute difference at 270x480), to find any single-frame jump; each large change is
    listed with whether it is a planned transition
  - motion between neighbouring frames: the longest run of near-static frames (the brief: no static holds over 1 s)
  - loop seam: last frame vs first frame
  - contact sheets: every 0.5 s, and the hook (0-2.5 s) every 3rd frame
usage: python3 tools/qa_render.py <video.mp4> <out_dir> [v2]"""
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
# the planned large changes: the fast signal rides, whips and pushes of this film (camera moves, not cuts), and the
# muzzle flashes (a whole-screen brightening by design)
EPD = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CJ = json.load(open(os.path.join(EPD, 'audio/cues.json')))
PLANNED = [(s['t'] - 0.02, s['t'] + 0.12, 'muzzle flash') for s in CJ['shots']] + [(0.0, 0.05, 'muzzle flash (frame 0)')]
PLANNED += [(r['t0'], r['t1'], f"signal ride ({r['kind']})") for r in CJ['rides']]
if len(sys.argv) > 3 and sys.argv[3] == 'v2':
    # V2 camera path (story.ts SEGS): the hook push, the reveal, the push back into the game, then V1's middle (with the
    # two retimed scale changes) and the V2 ending
    PLANNED += [(0.0, 0.7, 'hook push toward the brute'), (0.7, 1.75, 'reveal: pull back to game, software and CL1'),
                (3.45, 4.45, 'push back into the game'), (5.35, 6.7, 'pull back to the lab'),
                (7.6, 8.75, 'push into the CL1'), (9.3, 10.0, 'microscope push and iris'), (10.65, 11.8, 'out of the chip, up to the game'),
                (13.2, 13.8, 'out to the whole array'), (19.2, 19.8, 'push to the game'), (21.0, 22.05, 'pull back to the hardware'),
                (21.3, 21.5, 'the hurt flash'), (23.45, 25.1, 'push to the cells'), (25.7, 27.0, 'ride the activity out to the decoder'),
                (26.9, 28.0, 'settle on game + living culture'), (27.9, 29.0, 'push into the game (frame-0 framing)')]
else:
    PLANNED += [(0.25, 0.8, 'pull back through the monitor'), (0.78, 1.2, 'push into the chip'), (5.0, 6.7, 'pull back to the lab'),
                (7.6, 8.75, 'push into the CL1'), (9.3, 10.0, 'microscope push and iris'), (10.65, 11.9, 'out of the chip, up to the game'),
                (13.2, 13.8, 'out to the whole array'), (19.2, 19.8, 'push to the game'), (21.0, 22.05, 'pull back to the hardware'),
                (21.3, 21.5, 'the hurt flash'), (23.4, 24.45, 'dive to the cells'), (25.8, 27.2, 'pull back to the bench'), (28.0, 29.0, 'whip into the game')]
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
sheet(list(range(max(0, n - 22), n)) + list(range(0, 8)), 10, os.path.join(out, 'loop_last22_first8.png'), 0.2)
sheet([n - 3, n - 2, n - 1, 0, 1, 2], 6, os.path.join(out, 'loop_seam_last3_first3.png'), 0.3)
