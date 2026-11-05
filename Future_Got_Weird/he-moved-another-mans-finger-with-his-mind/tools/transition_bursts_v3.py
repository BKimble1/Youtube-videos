#!/usr/bin/env python3
"""Pull frame bursts around each listed transition from a rendered export and tile them (5 frames per row), so the
transition list is checked against the actual video. usage: python3 tools/transition_bursts.py <video> <outdir>"""
import os, subprocess, sys
V, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
TR = [  # V3 (label, start s, end s)
    ('A frame0 -> hand, press, cannon', 0.0, 1.2), ('A favour left lab', 3.1, 4.0), ('A command run + fired', 6.4, 8.0),
    ('A panels -> campus windows', 9.0, 10.8), ('A crane + split icons', 13.1, 19.5), ('B cable ride Rao->Stocco', 21.1, 22.7),
    ('B props to lawn desk', 23.8, 28.4), ('B push through bezel', 28.3, 30.0), ('B game <-> Rao on the plane', 33.0, 35.0),
    ('B rocket -> split, click -> cannon', 36.0, 37.4), ('B Rao hand -> GAME_FULL', 41.7, 44.7),
    ('C pull back through screen', 46.8, 48.4), ('C cap -> wire -> readout', 51.6, 54.5), ('C readout -> cursor', 55.4, 58.8),
    ('C cursor -> jack -> campus', 61.4, 64.3), ('C campus -> Stocco jack', 65.0, 66.2), ('C jack -> coil -> brain -> hand', 66.2, 72.8),
    ('C pathway -> finger ECU', 73.6, 74.9), ('C jerk, press -> cannon', 74.9, 76.5), ('C game -> Rao', 78.4, 79.8),
    ('C fist -> Stocco', 81.3, 81.7), ('C front -> back', 85.7, 86.1), ('C push into port -> game', 87.8, 90.1),
    ('D pull back, plug fails', 90.0, 93.8), ('D room -> log', 93.7, 94.8), ('D log icon -> labs', 97.1, 97.6),
    ('D bad connection', 99.9, 101.0), ('D TMS 2013 -> 2014', 101.6, 102.2), ('E out to cutaway and back in', 102.0, 106.8),
    ('E trial press', 107.6, 109.0), ('E coil flip', 109.4, 113.1), ('E stacked panels', 113.0, 119.8),
    ('E crane to pair 2 and back', 123.4, 126.4), ('E flipped trial (missing click)', 127.4, 129.7), ('E cutaway -> pad rect', 129.6, 135.87),
    ('F pad -> block', 135.8, 136.4), ('F screen -> face (turn)', 138.4, 138.8), ('F building track', 141.2, 149.2),
    ('F A screen -> receiver screen', 149.3, 149.8), ('F face -> senders', 156.4, 158.0), ('F computer -> coil', 158.8, 160.6),
    ('F through head -> POV', 165.3, 166.2), ('F eyes -> nod -> block turns', 173.3, 174.7), ('F round 2 floor', 174.9, 178.5),
    ('G screen -> face', 179.7, 180.1), ('G chip -> software flip', 183.3, 186.2), ('G face -> screen -> relief', 190.4, 193.5),
    ('G tiles -> bar', 193.3, 195.96), ('H bar -> space bar', 195.9, 197.2), ('H involuntary press', 199.1, 200.5),
    ('H coil moves, advice', 202.9, 204.6), ('H the choice', 206.4, 208.5), ('H back to frame 0', 208.4, 211.77),
]
for i, (lab, a, b) in enumerate(TR):
    ts = [a + (b - a) * k / 4 for k in range(5)]
    sel = '+'.join(f'between(t,{t - 0.0167:.4f},{t + 0.0167:.4f})' for t in ts)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{max(0, a - 0.1):.3f}', '-t', f'{b - a + 0.25:.3f}', '-i', V, '-vf',
                    f"setpts=PTS+{max(0, a - 0.1):.3f}/TB,select='{sel}',scale=384:-1,drawtext=text='%{{pts\\:hms}}':x=4:y=4:fontsize=13:fontcolor=white:box=1:boxcolor=black@0.6,tile=5x1",
                    '-frames:v', '1', '-vsync', '0', f'{OUT}/{i:02d}.png'], check=False)
# stack into pages of 8 rows
import glob
files = sorted(glob.glob(f'{OUT}/[0-9][0-9].png'))
for p in range(0, len(files), 8):
    chunk = files[p:p + 8]
    args = sum([['-i', f] for f in chunk], [])
    subprocess.run(['ffmpeg', '-v', 'error', '-y'] + args + ['-filter_complex', f"{''.join(f'[{j}:v]' for j in range(len(chunk)))}vstack=inputs={len(chunk)}", f'{OUT}/page_{p // 8}.png'], check=False)
print('\n'.join(f'{i:02d} {l} {a}-{b}' for i, (l, a, b) in enumerate(TR)))
