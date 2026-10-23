#!/usr/bin/env python3
"""Frame strips across transitions, read from a rendered MP4 (not the source): every `step` frames from t0 to t1,
tiled with frame/time labels. usage: python3 tools/strips.py <mp4> <out_dir> name:t0:t1[:step] ..."""
import os, subprocess, sys
mp4, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
for spec in sys.argv[3:]:
    name, t0, t1, *st = spec.split(':')
    step = int(st[0]) if st else 2
    f0, f1 = round(float(t0) * 30), round(float(t1) * 30)
    frames = list(range(f0, f1 + 1, step))
    cols = min(8, len(frames)); rows = (len(frames) + cols - 1) // cols
    sel = '+'.join(f'eq(n\\,{f})' for f in frames)
    vf = (f"select='{sel}',scale=216:384,drawtext=text='%{{n}}':x=4:y=4:fontsize=14:fontcolor=white:box=1:boxcolor=black@0.6,"
          f"tile={cols}x{rows}:padding=2")
    # %{n} after select counts selected frames; label with the source frame list instead
    vf = (f"select='{sel}',scale=216:384,tile={cols}x{rows}:padding=2")
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', mp4, '-vf', vf, '-frames:v', '1', '-vsync', '0', f'{out}/{name}.png'], check=True)
    print(name, frames[0], '..', frames[-1], 'step', step, f'{out}/{name}.png')
