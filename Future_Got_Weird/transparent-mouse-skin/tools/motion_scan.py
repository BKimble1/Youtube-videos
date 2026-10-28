#!/usr/bin/env python3
"""Frame-to-frame change over a rendered MP4 (mean absolute difference of 135x240 greyscale frames). Spikes mark
cuts or one-frame jumps; only the planned cut (7.00 s) should stand out.  usage: motion_scan.py <mp4> <out.json>"""
import json, subprocess, sys
import numpy as np
w, h = 135, 240
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', sys.argv[1], '-vf', f'scale={w}:{h}', '-pix_fmt', 'gray', '-f', 'rawvideo', '-'], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)
d = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))
med = float(np.median(d))
spikes = [{'frame': i + 1, 't': round((i + 1) / 30, 3), 'diff': round(float(v), 2)} for i, v in enumerate(d) if v > max(6 * med, 4.0)]
loop = float(np.abs(fr[-1] - fr[0]).mean())
json.dump({'median_diff': round(med, 3), 'max': round(float(d.max()), 2), 'spikes': spikes, 'loop_seam_diff': round(loop, 2), 'per_frame': [round(float(x), 2) for x in d]}, open(sys.argv[2], 'w'))
print('median', round(med, 3), 'max', round(float(d.max()), 2), 'at f', int(d.argmax()) + 1, '| spikes', spikes, '| loop seam', round(loop, 2))
