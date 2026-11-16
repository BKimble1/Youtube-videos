#!/usr/bin/env python3
"""Measured QA of a delivered render. Writes qa/<tag>/qa.json plus contact sheets.
  - container/stream properties (ffprobe)
  - black frames (blackdetect) and frozen stretches >= 1.0 s (freezedetect)
  - per-frame motion (mean absolute difference between consecutive frames, 270x480 gray): longest run of
    near-static frames, and every frame-to-frame jump that is not at a planned cut (possible pops)
  - the loop seam: difference between the last and the first frame, against the film's typical frame step
  - narration: both local ASR models on the delivered file's own audio vs the locked script (WER)
  - transition bursts: 5 frames either side of every cut, and a muted phone-size sheet (1 frame per second)
usage: python3 tools/qa_render.py <mp4> <tag>"""
import json, os, subprocess, sys
import numpy as np
EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
mp4, tag = sys.argv[1], sys.argv[2]
OUT = os.path.join(EP, 'qa', tag); os.makedirs(OUT, exist_ok=True)
res = {}
pr = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', mp4], capture_output=True, text=True).stdout)
v = [s for s in pr['streams'] if s['codec_type'] == 'video'][0]; a = [s for s in pr['streams'] if s['codec_type'] == 'audio'][0]
res['video'] = {k: v.get(k) for k in ['codec_name', 'profile', 'width', 'height', 'pix_fmt', 'r_frame_rate', 'nb_frames', 'color_space', 'color_primaries', 'color_transfer']}
res['audio'] = {k: a.get(k) for k in ['codec_name', 'sample_rate', 'channels', 'bit_rate']}
res['duration_s'] = float(pr['format']['duration'])
def det(filt):
    r = subprocess.run(['ffmpeg', '-v', 'info', '-i', mp4, '-vf', filt, '-an', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return [l.split('] ')[-1] for l in r.splitlines() if 'black_start' in l or 'freeze_start' in l or 'freeze_duration' in l]
res['blackdetect'] = det('blackdetect=d=0.03:pix_th=0.06')
res['freezedetect_1s'] = det('freezedetect=n=0.001:d=1.0')
# motion
W, H = 270, 480
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-vf', f'scale={W}:{H},format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
d = np.abs(np.diff(fr, axis=0)).mean((1, 2))
cues = json.load(open(os.path.join(EP, 'audio/cues.json')))
cut_frames = [round(c['t'] * 30) for c in cues['cuts'][1:]]
static = d < 0.25
run, best, best_at = 0, 0, 0
for i, s in enumerate(static):
    run = run + 1 if s else 0
    if run > best: best, best_at = run, i - run + 1
res['motion'] = {'frames': int(len(fr)), 'median_step': round(float(np.median(d)), 3), 'longest_static_run_s': round(best / 30, 2), 'at_s': round(best_at / 30, 2)}
jumps = [(i + 1, round(float(d[i]), 2)) for i in range(len(d)) if d[i] > max(12, 6 * np.median(d))]
res['big_frame_jumps'] = [{'frame': f, 't': round(f / 30, 3), 'diff': x, 'planned_cut': any(abs(f - c) <= 1 for c in cut_frames)} for f, x in jumps]
res['loop_seam'] = {'last_to_first_diff': round(float(np.abs(fr[-1] - fr[0]).mean()), 3), 'median_frame_step': round(float(np.median(d)), 3), 'p95_frame_step': round(float(np.percentile(d, 95)), 3)}
# ASR on the delivered audio
asr = os.path.join(EP, 'tools/asr_sherpa.py')
r = subprocess.run(['python3', asr, mp4, '/tmp/asr', os.path.join(OUT, 'final_asr.json')], capture_output=True, text=True, cwd=EP,
                   env={**os.environ, 'ASR_PAUSES': os.path.join(EP, 'audio/narration/t2_words.json')})
res['asr'] = {k: {'wer': vv['wer'], 'diffs': vv['diffs']} for k, vv in json.load(open(os.path.join(OUT, 'final_asr.json'))).items()}
# sheets
def sheet(name, frames, cols, scale=270):
    tmp = os.path.join(OUT, '_tmp'); os.makedirs(tmp, exist_ok=True)
    for k, f in enumerate(frames):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{f / 30 + 0.001:.4f}', '-i', mp4, '-frames:v', '1', '-vf',
                        f"scale={scale}:-1,drawtext=text='{f}':x=4:y=4:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.6", os.path.join(tmp, f'{k:04d}.png')])
    rows = (len(frames) + cols - 1) // cols
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-pattern_type', 'glob', '-i', os.path.join(tmp, '*.png'), '-filter_complex', f'tile={cols}x{rows}:padding=3:color=white', '-frames:v', '1', os.path.join(OUT, name)])
    subprocess.run(['rm', '-rf', tmp])
sheet('phone_1fps.png', list(range(0, len(fr), 30)), 8, 180)
for c in cut_frames:
    sheet(f'cut_{c:03d}.png', [max(0, min(len(fr) - 1, c + k)) for k in range(-3, 3)], 6, 240)
sheet('loop_seam.png', [len(fr) - 3, len(fr) - 2, len(fr) - 1, 0, 1, 2], 6, 240)
json.dump(res, open(os.path.join(OUT, 'qa.json'), 'w'), indent=1)
print(json.dumps(res, indent=1))
