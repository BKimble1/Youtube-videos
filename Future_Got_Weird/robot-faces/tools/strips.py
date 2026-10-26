#!/usr/bin/env python3
"""Frame strips around every shot boundary (and any extra times): +-N frames, read from the rendered file.
usage: strips.py <video.mp4> <cues.json> <outdir> [frames_each_side=3] [scale_w=480]"""
import json, os, subprocess, sys
vid, cj, out = sys.argv[1], sys.argv[2], sys.argv[3]
n = int(sys.argv[4]) if len(sys.argv) > 4 else 3
w = int(sys.argv[5]) if len(sys.argv) > 5 else 480
os.makedirs(out, exist_ok=True)
C = json.load(open(cj))
bounds = [s['a'] for s in C['shots'][1:]]
for b in bounds:
    f0 = round(b * 30)
    sel = '+'.join(f'eq(n\\,{f})' for f in range(f0 - n, f0 + n + 1))
    dst = f'{out}/cut_{b:07.2f}.png'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', vid, '-vf', f"select='{sel}',scale={w}:-1,tile={2*n+1}x1", '-frames:v', '1', '-vsync', 'vfr', dst], check=True)
    print(dst)
