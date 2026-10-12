#!/usr/bin/env python3
"""Per-scene frame-difference statistics of the ENCODED V5 picture (270 x 480 grey decode, mean absolute difference of adjacent frames, 0-255 scale) and runs of nearly static frames.
A proxy for "something keeps changing in the shot", not a judgement of animation quality. Writes qa/v8/SCENE_MOTION_V5.json. Usage: python3 tools/qa_motion_v5.py [video]"""
import json, os, subprocess, sys
import numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V = sys.argv[1] if len(sys.argv) > 1 else f'{ROOT}/exports/v8/FGW_EarthStops_V5_Silent_1080x1920.mp4'
w, h = 270, 480
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', V, '-vf', f'scale={w}:{h}:flags=area,format=gray', '-f', 'rawvideo', '-'], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, dtype=np.uint8).reshape(-1, h, w).astype(np.int16)
d = np.array([np.abs(fr[i + 1] - fr[i]).mean() for i in range(len(fr) - 1)])
SC = [('brake (pads close, lock)', 0, 15), ('dive', 15, 20), ('grounded step (foot pinned)', 20, 26), ('loss of footing', 26, 29), ('airborne, carried east', 29, 48), ('still street', 48, 128), ('loose things + wind', 128, 182), ('tracking: second person crosses', 182, 222), ('tracking + awning', 222, 259), ('coast: swell visible, boat rides', 259, 336),
      ('aftermath', 336, 354), ('flood / drain', 354, 384), ('NORMAL DAY', 384, 414), ('pull-out', 414, 436), ('globe', 436, 500), ('ring + caliper + pads', 500, 615)]
out = {'scenes': {n: {'frames': [a, b], 'mean_step': round(float(d[a:b].mean()), 2), 'min_step': round(float(d[a:b].min()), 2)} for n, a, b in SC}}
run, cur = [], []
for i, x in enumerate(d):
    if x < 1.0: cur.append(i)
    else:
        if len(cur) >= 5: run.append([cur[0], cur[-1]])
        cur = []
if len(cur) >= 5: run.append([cur[0], cur[-1]])
out['runs_of_5_or_more_frames_with_step_below_1.0'] = run
out['min_step_overall'] = round(float(d.min()), 3)
json.dump(out, open(f'{ROOT}/qa/v8/SCENE_MOTION_V5.json', 'w'), indent=1)
for n, a, b in SC: print(f'{n:34s} f{a:3d}-{b:3d}  mean {d[a:b].mean():6.2f}  min {d[a:b].min():5.2f}')
print('static runs (>=5 frames, step<1.0):', run)
