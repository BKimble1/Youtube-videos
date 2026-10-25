#!/usr/bin/env python3
"""Eye check for Rebuild V2: for every frame where a face is big enough to judge (tools/c2_headboxes.ts), count the
eye-white pixels (near #FFFFFF) inside the head's circle. Flags:
  - a one-frame dip: the count falls below half of BOTH neighbours (within one shot) while the lids are open;
  - a face wholly inside the frame, turned toward camera (|yaw| < 60), with no eye white at all while the lids are open.
usage: c2_eyecheck.py video.mp4 headboxes.json out.json"""
import json, subprocess, sys
from collections import defaultdict
import numpy as np
vid, hbf, outf = sys.argv[1:4]
hb = json.load(open(hbf))
by_f = defaultdict(list)
for h in hb: by_f[h['f']].append(h)
W, H = 1080, 1920
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', vid, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
counts = {}
f = 0
yy, xx = np.mgrid[0:H, 0:W]
while True:
    buf = p.stdout.read(W * H * 3)
    if len(buf) < W * H * 3: break
    if f in by_f:
        img = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
        white = (img[..., 0] > 236) & (img[..., 1] > 236) & (img[..., 2] > 236)
        white[1380:1600] = False  # the caption band
        for h in by_f[f]:
            x0, x1 = int(max(0, h['x'] - h['r'])), int(min(W, h['x'] + h['r']))
            y0, y1 = int(max(0, h['y'] - h['r'])), int(min(H, h['y'] + h['r']))
            if x1 <= x0 or y1 <= y0: continue
            sub = white[y0:y1, x0:x1]
            m = (xx[y0:y1, x0:x1] - h['x']) ** 2 + (yy[y0:y1, x0:x1] - h['y']) ** 2 < h['r'] ** 2
            counts[(f, h['id'])] = (int((sub & m).sum()), h)
    f += 1
flags = []
for (fr, i), (c, h) in counts.items():
    prev, nxt = counts.get((fr - 1, i)), counts.get((fr + 1, i))
    norm = c / (h['r'] ** 2)
    if h['lid'] < 0.5:
        if prev and nxt and prev[1]['s'] == h['s'] == nxt[1]['s'] and prev[1]['lid'] < 0.5 and nxt[1]['lid'] < 0.5 and c < 0.5 * min(prev[0], nxt[0]):
            flags.append({'frame': fr, 'id': i, 'shot': h['s'], 'kind': 'one-frame dip', 'count': c, 'prev': prev[0], 'next': nxt[0]})
        inside = h['x'] - h['r'] >= 0 and h['x'] + h['r'] <= W and h['y'] - h['r'] >= 0 and h['y'] + h['r'] <= H
        if inside and abs(((h['phi'] + 180) % 360) - 180) < 60 and c == 0:
            flags.append({'frame': fr, 'id': i, 'shot': h['s'], 'kind': 'no eye white on a face toward camera', 'count': c})
summary = defaultdict(lambda: {'frames': 0, 'min_norm': 9.0, 'max_norm': 0.0})
for (fr, i), (c, h) in counts.items():
    k = f"{h['s']}:{i}"; n = c / (h['r'] ** 2)
    summary[k]['frames'] += 1; summary[k]['min_norm'] = round(min(summary[k]['min_norm'], n), 4); summary[k]['max_norm'] = round(max(summary[k]['max_norm'], n), 4)
json.dump({'frames_checked': len({k[0] for k in counts}), 'faces_checked': len(counts), 'flags': flags, 'per_shot': summary}, open(outf, 'w'), indent=1)
print('faces checked', len(counts), 'flags', len(flags))
for fl in flags[:40]: print(fl)
