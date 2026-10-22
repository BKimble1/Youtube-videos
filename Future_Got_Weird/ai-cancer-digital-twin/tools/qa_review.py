#!/usr/bin/env python3
"""Measured QA of a rendered film (nobody can watch or listen in this environment; these are the checks that can be
run on the file itself).

    python3 tools/qa_review.py exports/FGW_AI_Cancer_DigitalTwin_REVIEW_1080p.mp4 qa/review

Writes into the out dir: results.json, first15.png (every 0.5 s), film.png (every 2 s), strips/*.png (5 frames around
every cut: -0.3, -1f, 0, +1f, +0.3 s), and prints a summary.
Checks: container/stream facts; loudness and true peak of the delivered audio; black frames; frozen stretches;
per-second picture activity (mean absolute difference between frames sampled 1/6 s apart, on a 192×108 grey copy).
"""
import json, os, subprocess, sys, io
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import resample_poly

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out + '/strips', exist_ok=True)
res = {}

probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', src]))
v = [s for s in probe['streams'] if s['codec_type'] == 'video'][0]
a = [s for s in probe['streams'] if s['codec_type'] == 'audio']
res['file'] = {'path': src, 'bytes': int(probe['format']['size']), 'duration_s': float(probe['format']['duration']),
               'video': f"{v['codec_name']} {v.get('profile')} {v['width']}x{v['height']} {v['r_frame_rate']} {v.get('pix_fmt')} frames={v.get('nb_frames')}",
               'audio': f"{a[0]['codec_name']} {a[0]['sample_rate']} Hz {a[0]['channels']} ch {int(a[0].get('bit_rate', 0)) // 1000} kb/s" if a else None}

if a:
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', src, '-vn', '-f', 'wav', '-acodec', 'pcm_f32le', '-'])
    y, sr = sf.read(io.BytesIO(raw))
    m = pyln.Meter(sr)
    tp = 20 * np.log10(np.max(np.abs(resample_poly(y, 4, 1, axis=0))) + 1e-12)
    res['audio'] = {'integrated_lufs': round(m.integrated_loudness(y), 2), 'true_peak_dbtp': round(tp, 2), 'duration_s': round(len(y) / sr, 3)}

# black + freeze detection
log = subprocess.run(['ffmpeg', '-v', 'info', '-i', src, '-vf', 'blackdetect=d=0.1:pix_th=0.06,freezedetect=n=0.0008:d=1.2', '-an', '-f', 'null', '-'], capture_output=True, text=True).stderr
res['black'] = [l.split('blackdetect')[1].strip() for l in log.splitlines() if 'black_start' in l]
fr = [l.split('] ')[-1] for l in log.splitlines() if 'freeze_start' in l or 'freeze_end' in l]
res['freeze'] = fr

# activity per second
W, H = 192, 108
raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', src, '-vf', f'fps=6,scale={W}:{H},format=gray', '-f', 'rawvideo', '-'])
fr6 = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
d = np.abs(np.diff(fr6, axis=0)).mean(axis=(1, 2))
per_s = [round(float(d[i * 6:(i + 1) * 6].mean()), 2) for i in range(len(d) // 6)]
res['activity_per_second'] = per_s
res['low_activity_seconds'] = [i for i, x in enumerate(per_s) if x < 0.35]

def grab(t, path, w=480):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{max(0, t):.3f}', '-i', src, '-frames:v', '1', '-vf', f'scale={w}:-1', path], check=True)

def sheet(times, path, cols, w=480, label=True):
    tmp = []
    for i, t in enumerate(times):
        p = f'{out}/_t{i}.png'; grab(t, p, w); tmp.append(p)
    args = []
    for p in tmp:
        args += ['-i', p]
    h = w * 9 // 16
    filt = ';'.join(f"[{i}:v]drawtext=text='{t:.2f}s':x=6:y=6:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6[v{i}]" if label else f'[{i}:v]null[v{i}]' for i, t in enumerate(times))
    layout = '|'.join(f'{(i % cols) * w}_{(i // cols) * h}' for i in range(len(times)))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *args, '-filter_complex', f"{filt};{''.join(f'[v{i}]' for i in range(len(times)))}xstack=inputs={len(times)}:layout={layout}:fill=gray[o]", '-map', '[o]', path], check=True)
    for p in tmp:
        os.remove(p)

dur = res['file']['duration_s']
sheet([i * 0.5 for i in range(30)], f'{out}/first15.png', 6, 320)
times = [i * 2.0 for i in range(int(dur / 2))]
per = -(-len(times) // 3)
for k in range(0, len(times), per):
    sheet(times[k:k + per], f'{out}/film_{k // per}.png', 6, 320)
cuts = json.load(open('audio/sfx_cues.json'))['cuts']
for i, (t, name) in enumerate(cuts):
    safe = ''.join(ch if ch.isalnum() else '_' for ch in name)[:40]
    sheet([t - 0.3, t - 1 / 30, t + 0.01, t + 1 / 30 + 0.01, t + 0.3], f'{out}/strips/{i:02d}_{safe}.png', 5, 320)
json.dump(res, open(f'{out}/results.json', 'w'), indent=1)
print(json.dumps({k: res[k] for k in ('file', 'audio')}, indent=1))
print('black:', res['black']); print('freeze:', res['freeze']); print('low-activity seconds:', res['low_activity_seconds'])
