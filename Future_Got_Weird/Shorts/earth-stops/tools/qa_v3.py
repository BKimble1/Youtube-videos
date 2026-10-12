#!/usr/bin/env python3
"""Measured QA of the ENCODED V3 picture (no viewing in real time, no listening). Writes qa/v6/QA_V3.json.
  python3 tools/qa_v3.py [video]   (default qa/v6/render/FilmV3_silent_raw.mp4)
Per consecutive frame pair: mean absolute difference on a 270 x 480 grey decode. Reports freezes (diff ~ 0), cuts/hard transitions (diff spikes), the loop seam (f743 -> f0) against ordinary steps,
and the frame counts. Intentional holds are listed separately from defects: the only intentional hold is the 5-frame suspended beat (f31-36), which is slowed, not frozen."""
import json, os, subprocess, sys
import numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V = sys.argv[1] if len(sys.argv) > 1 else f'{ROOT}/qa/v6/render/FilmV3_silent_raw.mp4'
pr = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', V], capture_output=True, text=True, check=True).stdout)
vs = next(s for s in pr['streams'] if s['codec_type'] == 'video')
cnt = int(subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', V], capture_output=True, text=True, check=True).stdout.strip())
w, h = 270, 480
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', V, '-vf', f'scale={w}:{h}:flags=area,format=gray', '-f', 'rawvideo', '-'], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, dtype=np.uint8).reshape(-1, h, w).astype(np.int16)
d = np.array([np.abs(fr[i + 1] - fr[i]).mean() for i in range(len(fr) - 1)])
seam = float(np.abs(fr[0] - fr[-1]).mean())
med = float(np.median(d))
freeze = [int(i) for i in np.where(d < 0.05)[0]]
spikes = [(int(i), round(float(d[i]), 2)) for i in np.argsort(-d)[:14]]
cuts = sorted(int(i) + 1 for i in np.where(d > 4.0 * med)[0])
out = {'file': os.path.relpath(V, ROOT), 'codec': vs['codec_name'], 'size': [vs['width'], vs['height']], 'r_frame_rate': vs['r_frame_rate'], 'pix_fmt': vs['pix_fmt'], 'duration_s': float(pr['format']['duration']), 'frames_counted': cnt,
       'median_step': round(med, 3), 'p95_step': round(float(np.percentile(d, 95)), 3), 'seam_f743_to_f0': round(seam, 3), 'seam_vs_median': round(seam / med, 2),
       'near_freeze_pairs_(diff<0.05)': freeze, 'frames_with_step_gt_4x_median(first frame of new shot or very fast move)': cuts, 'largest_steps': spikes,
       'intentional_holds': {'f31-36': 'suspended beat: speed 12 %, vignette closes; slowed motion, not a freeze'},
       'min_step_f30_to_f37': [round(float(x), 3) for x in d[30:37]]}
os.makedirs(f'{ROOT}/qa/v6', exist_ok=True)
json.dump(out, open(f'{ROOT}/qa/v6/QA_V3.json', 'w'), indent=1)
print(json.dumps(out, indent=1))
