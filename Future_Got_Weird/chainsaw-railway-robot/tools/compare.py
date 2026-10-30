#!/usr/bin/env python3
"""V1 vs V2 at the same film times, for the review sections. One sheet per section: V1 on the top row, V2 on the
bottom row, 6 frames each (480 px wide), timestamps burned into the sheet only.
usage: python3 tools/compare.py <v1.mp4> <v2.mp4> <out_dir>"""
import subprocess, sys, os
v1, v2, out = sys.argv[1:4]
os.makedirs(out, exist_ok=True)
SECTIONS = {
    '01_opening_0-15': [0.0, 2.5, 5.5, 9.0, 12.6, 14.8],
    '02_cutting_40-67': [46.4, 48.6, 51.8, 53.6, 56.0, 62.5],
    '03_control_loop_70-88': [72.5, 76.6, 78.6, 81.2, 82.5, 85.8],
    '04_equipment_114-134': [116.0, 118.6, 122.6, 127.6, 131.5, 136.6],
    '05_payoff_135-end': [141.0, 148.9, 149.7, 150.6, 152.2, 154.8],
}
for name, ts in SECTIONS.items():
    rows = []
    for k, v in (('V1', v1), ('V2', v2)):
        tiles = []
        for i, t in enumerate(ts):
            p = f'{out}/_{k}_{i}.png'
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.3f}', '-i', v, '-frames:v', '1', '-vf',
                            f"scale=480:-1,drawtext=text='{k} {t:.1f}s':x=8:y=8:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.6", p], check=True)
            tiles.append(p)
        rows.append(tiles)
    inputs = sum([['-i', p] for r in rows for p in r], [])
    n = len(ts)
    layout = '|'.join(f'{(i % n) * 480}_{(i // n) * 270}' for i in range(2 * n))
    subprocess.run(['ffmpeg', '-v', 'error', '-y'] + inputs + ['-filter_complex', f'xstack=inputs={2 * n}:layout={layout}', f'{out}/{name}.png'], check=True)
    for r in rows:
        for p in r: os.remove(p)
    print(name)
