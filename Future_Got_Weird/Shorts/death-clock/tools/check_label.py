#!/usr/bin/env python3
"""Check that the FUTURE CONCEPT label is present in every decoded frame of an encoded video.

Crops the label pill (x 84-414, y 178-238 in the 1080x1920 frame) from every frame. The text mask is taken from
frame 0 (pixels brighter than 215 inside the pill). For each frame the contrast between the text pixels and the rest
of the pill must exceed 60 (0-255), and the text pixels must stay above 200 on average. Reports the weakest frames.
Usage: python3 tools/check_label.py video.mp4 [out.json]"""
import json, subprocess, sys
import numpy as np

vid = sys.argv[1]
X, Y, W, H = 84, 178, 330, 60
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', vid, '-vf', f'crop={W}:{H}:{X}:{Y},format=gray', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
yy, xx = np.mgrid[0:H, 0:W]
# inside the rounded pill (r 30), away from the edge by 4 px
cx = np.clip(xx, 30, W - 30)
inside = (np.hypot(xx - cx, yy - 30) <= 26)
text = (fr[0] > 215) & inside & (xx > 50)
bg = inside & ~text & (xx > 50)
# dilate the text mask by 1 px for the background set so anti-aliased edges don't count as background
pad = np.pad(text, 1)
near = pad[:-2, 1:-1] | pad[2:, 1:-1] | pad[1:-1, :-2] | pad[1:-1, 2:] | text
bg &= ~near
tv = fr[:, text].mean(axis=1)
bv = fr[:, bg].mean(axis=1)
con = tv - bv
bad = [int(i) for i in np.where((con < 60) | (tv < 200))[0]]
worst = [int(i) for i in np.argsort(con)[:5]]
out = {'video': vid, 'frames': int(len(fr)), 'text_pixels': int(text.sum()), 'contrast_min': round(float(con.min()), 1),
       'contrast_median': round(float(np.median(con)), 1), 'text_lum_min': round(float(tv.min()), 1),
       'weakest_frames': [[i, round(float(con[i]), 1)] for i in worst], 'failing_frames': bad[:50],
       'result': 'PASS' if not bad else 'FAIL'}
print(json.dumps(out, indent=1))
if len(sys.argv) > 2:
    json.dump(out, open(sys.argv[2], 'w'), indent=1)
