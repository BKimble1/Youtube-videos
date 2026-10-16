#!/usr/bin/env python3
"""Preview 9:16 crops of candidate footage the way FootageShot frames them (object-fit cover + zoom about cx,cy).
Usage: preview_crop.py out.png  "label|file|t1,t2,..|cx|cy|zoom" ...   (one row per spec)"""
import subprocess, sys, os, tempfile
out, specs = sys.argv[1], sys.argv[2:]
tmp = tempfile.mkdtemp()
rows = []
for r, spec in enumerate(specs):
    label, f, ts, cx, cy, z = spec.split('|')
    cx, cy, z = float(cx), float(cy), float(z)
    tiles = []
    for i, t in enumerate(ts.split(',')):
        # source 1920x1080 scaled to cover 1080x1920 -> crop width 1080/1.7778 = 607.5 px of source; zoom shrinks it
        cw, ch = 607.5 / z, 1080 / z
        x = min(max(0, cx * 1920 - cw / 2), 1920 - cw)
        y = min(max(0, cy * 1080 - ch / 2), 1080 - ch)
        p = os.path.join(tmp, f'{r}_{i}.png')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', t, '-i', f, '-frames:v', '1', '-vf',
                        f"crop={cw:.0f}:{ch:.0f}:{x:.0f}:{y:.0f},scale=270:480,drawtext=text='{label} {t}':x=4:y=4:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.7", p], check=True)
        tiles.append(p)
    rowp = os.path.join(tmp, f'row{r}.png')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *sum([['-i', p] for p in tiles], []), '-filter_complex', f"hstack=inputs={len(tiles)}" if len(tiles) > 1 else 'null', rowp], check=True)
    rows.append(rowp)
w = max(int(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=width', '-of', 'csv=p=0', p], capture_output=True, text=True).stdout) for p in rows)
pads = []
for i, p in enumerate(rows):
    q = os.path.join(tmp, f'pad{i}.png')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', p, '-vf', f'pad={w}:480:0:0:gray', q], check=True); pads.append(q)
subprocess.run(['ffmpeg', '-v', 'error', '-y', *sum([['-i', p] for p in pads], []), '-filter_complex', f"vstack=inputs={len(pads)}" if len(pads) > 1 else 'null', out], check=True)
print(out)
