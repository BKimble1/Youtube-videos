#!/usr/bin/env python3
"""Measured QC of the final MP4: container/stream facts, a full decode, per-second motion (mean absolute frame
difference, to find any stationary stretch), the loop seam (last frame vs first frame), black/frozen frame scan,
audio loudness and true peak of the muxed track, and an ASR pass over the muxed audio against the locked narration.
usage: python3 tools/qc.py <video.mp4> <asr_model_root> <out.json>"""
import json, subprocess, sys, os
import numpy as np

vid, models, out = sys.argv[1:4]
EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
probe = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', vid], capture_output=True, check=True, text=True).stdout)
v = next(s for s in probe['streams'] if s['codec_type'] == 'video')
a = next(s for s in probe['streams'] if s['codec_type'] == 'audio')
W, H = 270, 480  # decoded at quarter size for the motion measures
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', vid, '-vf', f'scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
n = len(fr)
diff = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))
fps = 30
per_sec = []
for s0 in range(0, int(np.ceil(n / fps))):
    d = diff[s0 * fps:min(n - 1, (s0 + 1) * fps)]
    per_sec.append({'s': s0, 'mean_motion': round(float(d.mean()), 2), 'min_motion': round(float(d.min()), 3)})
# longest run of near-still frames (mean abs difference < 0.15 grey levels)
still = diff < 0.15
run = best = 0
for x in still:
    run = run + 1 if x else 0
    best = max(best, run)
seam = float(np.abs(fr[-1] - fr[0]).mean())
typical = float(np.median(diff))
black = [int(i) for i in np.where(fr.mean(axis=(1, 2)) < 8)[0]]
ebu = subprocess.run(['ffmpeg', '-v', 'info', '-i', vid, '-map', '0:a', '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
def grab(key):
    lines = [l for l in ebu.splitlines() if key in l]
    return lines[-1].strip() if lines else None
asr = subprocess.run([sys.executable, os.path.join(EP, 'tools/asr_sherpa.py'), vid, models], capture_output=True, text=True).stdout
res = {
    'file': os.path.basename(vid),
    'bytes': int(probe['format']['size']),
    'duration_s': float(probe['format']['duration']),
    'video': {'codec': v['codec_name'], 'profile': v.get('profile'), 'size': f"{v['width']}x{v['height']}", 'fps': v['r_frame_rate'], 'pix_fmt': v['pix_fmt'], 'frames_decoded': n, 'color_space': v.get('color_space')},
    'audio': {'codec': a['codec_name'], 'sample_rate': a['sample_rate'], 'channels': a['channels'], 'integrated': grab('I:'), 'true_peak': grab('Peak:')},
    'motion': {'median_frame_diff': round(typical, 2), 'longest_still_run_frames': best, 'per_second': per_sec},
    'loop_seam': {'last_vs_first_mean_abs': round(seam, 2), 'typical_consecutive_frame_diff': round(typical, 2)},
    'black_frames': black,
    'asr_on_mux': asr.strip().splitlines(),
}
json.dump(res, open(out, 'w'), indent=1)
print(json.dumps({k: res[k] for k in ['duration_s', 'video', 'audio', 'loop_seam', 'black_frames']}, indent=1))
print('longest still run (frames):', best, ' per-second motion:', [p['mean_motion'] for p in per_sec])
print('\n'.join(res['asr_on_mux']))
