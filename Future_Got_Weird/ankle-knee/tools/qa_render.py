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
# the planned large changes: the cuts and the dissolve (from story.ts via audio/cues.json), the strike, the plant
CJ = json.load(open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), os.environ.get('FGW_CUES', 'audio/cues.json'))))
if 'CUTS' in CJ:  # V2
    PLANNED = [(CJ['STRIKE1'] - 0.05, CJ['T']['wyatt'] + 0.05, 'the strike and the ball rushing at the lens')]
    for s0, nm in CJ['CUTS'][1:]:
        PLANNED.append((s0 - 0.04, s0 + (0.36 if nm == 'anat' else 0.08), f'cut to {nm}' + (' (matched dissolve from the scan)' if nm == 'anat' else '')))
    T2 = CJ['T']
    PLANNED += [(T2['learned'] + 0.17, T2['learned'] + 1.3, 'the lens rises from the plant to the step'), (CJ['STRIKE2'] - 0.3, CJ['STRIKE2'] + 0.5, 'the closing strike'),
                (CJ['DUR'] - 0.62, CJ['DUR'] + 0.01, 'the push back into frame 0'), (0, 0.6, 'the opening widen'), (T2['toes2'] - 0.05, T2['and2'], 'the lens moves to his eyes and back down to the crease'),
                (T2['attached'] - 0.1, T2['that'], 'the rise to the thigh and the widen to Wyatt')]
else:
    SH = CJ['shots']
    PLANNED = [(0.0, 0.45, 'the strike: the ball leaves the frame')]
    for k, (s0, nm) in enumerate(SH[1:]):
        PLANNED.append((s0 - 0.04, s0 + (0.4 if nm == 'bench' else 0.08), f'cut to {nm}'))
    PLANNED.append((CJ['T']['learned'], CJ['T']['learned'] + 1.4, 'the lens rises from the cleat to the whole boy'))
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
