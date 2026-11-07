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
# the planned large changes (from story.ts via audio/cues.json): camera moves into a discovery, the match cut, the wipes
CJ = json.load(open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'audio/cues.json')))
E = CJ['EV']
PLANNED = [(0.05, 1.1, 'the opening cutaway opens with two downstrokes'), (2.2, E['match'] - 0.01, 'pull back to the whole bird, push to the wing root'),
           (E['match'] - 0.05, E['match'] + 0.1, 'match cut on the wing root into the lab'), (E['match'], 5.3, 'pull back to the lab'),
           (E['liftA'] - 0.1, E['seatB'] + 0.1, 'exploded view: the shell lifts and seats'), (8.8, 12.56, 'push into the drive, follow it, pull back'),
           (E['labToMeadow'][0] - 0.05, E['labToMeadow'][1] + 0.05, 'wing wipe into the meadow'),
           (E['meadowToPond'][0] - 0.05, E['meadowToPond'][1] + 0.05, 'waterline wipe into the pond'), (17.2, 18.9, 'dip to the waterline and back'),
           (E['pondToSky'][0] - 0.05, E['pondToSky'][1] + 0.05, 'water crest wipe into the callback'), (E['skyOpen'] - 0.05, E['skyClose'] + 0.3, 'the callback cutaway'),
           (E['loop'][0] - 0.05, E['loop'][1] + 0.05, 'loop: wing wipe into frame 0')]
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

_cache = {}
def sheet(idx, cols, path, scale=0.25):
    # decode the whole file once per scale (frame index = decode order), so every label is exact
    w, h = int(1080 * scale) // 2 * 2, int(1920 * scale) // 2 * 2
    if scale not in _cache:
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-vf', f'scale={w}:{h}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
        _cache[scale] = np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)
    got = _cache[scale]
    ims = [got[i] for i in idx if i < len(got)]
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
