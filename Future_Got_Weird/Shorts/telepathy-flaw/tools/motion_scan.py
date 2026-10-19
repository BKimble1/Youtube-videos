"""Frame-to-frame change scan of a rendered video: flags spikes (cuts, pops, flash frames).

Decodes at 270x480 grey, computes the mean absolute difference between consecutive frames (0-255),
and prints every frame whose difference exceeds max(12, 4x the local median). Expected cuts are listed
from the shot table so unexpected spikes stand out.
Usage: python3 tools/motion_scan.py video.mp4 [cuts.json] [out.json]
"""
import json, subprocess, sys
import numpy as np
W, H = 270, 480
p = sys.argv[1]
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-vf', f'scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
d = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))
cuts = set(json.load(open(sys.argv[2]))) if len(sys.argv) > 2 else set()
out = []
for i, v in enumerate(d):
    lo, hi = max(0, i - 15), min(len(d), i + 16)
    med = float(np.median(d[lo:hi]))
    if v > max(12.0, 4 * med):
        f = i + 1
        out.append({'frame': f, 'diff': round(float(v), 1), 'local_median': round(med, 2), 'expected_cut': f in cuts})
for o in out:
    print(o)
print('frames', len(fr), 'mean diff', round(float(d.mean()), 2), 'max', round(float(d.max()), 1))
if len(sys.argv) > 3:
    json.dump({'video': p, 'spikes': out, 'diff': [round(float(x), 2) for x in d]}, open(sys.argv[3], 'w'))
