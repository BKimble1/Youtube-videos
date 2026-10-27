#!/usr/bin/env python3
"""Motion scan of a rendered MP4: mean absolute frame-to-frame change (grey, 135x240), and frames whose change is a
spike relative to their neighbours (a likely one-frame reset or pop). usage: python3 -I tools/motion_scan.py <mp4> <out.json>"""
import json, subprocess, sys
import numpy as np
mp4, out = sys.argv[1], sys.argv[2]
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-vf', 'scale=135:240', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True, check=True).stdout
F = np.frombuffer(raw, np.uint8).reshape(-1, 240, 135).astype(float)
d = np.abs(np.diff(F, axis=0)).mean(axis=(1, 2))
spikes = []
for i in range(len(d)):
    nb = np.concatenate([d[max(0, i - 3):i], d[i + 1:i + 4]])
    if d[i] > 6 and d[i] > 2.5 * (np.median(nb) + 0.5):
        spikes.append({'frame': i + 1, 't': round((i + 1) / 30, 3), 'diff': round(float(d[i]), 2), 'neigh_median': round(float(np.median(nb)), 2)})
json.dump({'frames': len(F), 'mean_change': round(float(d.mean()), 2), 'max_change': round(float(d.max()), 2), 'max_at_t': round((int(d.argmax()) + 1) / 30, 3), 'spikes': spikes, 'per_frame': [round(float(x), 2) for x in d]}, open(out, 'w'))
print(json.dumps({'frames': len(F), 'mean': round(float(d.mean()), 2), 'max': round(float(d.max()), 2), 'max_at': round((int(d.argmax()) + 1) / 30, 3), 'spikes': spikes}, indent=1))
