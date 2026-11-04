#!/usr/bin/env python3
"""Pull frame bursts around each listed transition from a rendered export and tile them (5 frames per row), so the
transition list is checked against the actual video. usage: python3 tools/transition_bursts.py <video> <outdir>"""
import os, subprocess, sys
V, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
TR = [  # (label, start s, end s)
    ('A finger->key->game', 0.0, 1.0), ('A projectile->EEG cable', 1.7, 2.2), ('A cap->two buildings', 2.9, 4.3),
    ('A signal route->coil', 5.9, 7.4), ('A finger->cannon', 7.45, 7.75), ('A lateral track', 9.0, 11.5), ('A crane out', 12.5, 15.1),
    ('A game splits to windows', 16.8, 18.3), ('A swoop into Rao window', 18.3, 19.9), ('B screen->Stocco wall', 21.6, 22.0),
    ('B yank, cut on motion', 24.6, 25.2), ('B through bezel', 29.1, 30.0), ('B finger->cannon', 36.85, 37.15), ('B into screen', 43.3, 44.8),
    ('C game->glasses', 46.8, 47.4), ('C electrode iris', 52.2, 53.0), ('C trace->EEG readout', 54.9, 55.5), ('C cable->campus', 62.5, 64.2),
    ('C skylight dive', 65.6, 67.0), ('C pathway->hand', 73.6, 75.0), ('C finger->cannon', 76.0, 76.4), ('C past head', 78.7, 79.4),
    ('C building-edge wipe', 81.3, 82.2), ('C wall port->game', 87.5, 90.1), ('D game->cable', 90.3, 92.7), ('D failure->log', 92.7, 94.6),
    ('D log icon->labs', 96.9, 97.6), ('D plug->2014 port', 101.6, 102.6), ('E pull-out/coil', 104.0, 106.6), ('E split', 112.9, 113.6),
    ('E wipe', 119.2, 119.9), ('E trial->board', 123.5, 124.2), ('E through pad->board', 129.6, 131.2), ('E pad->rect', 134.6, 135.87),
    ('F pad->block', 135.8, 136.4), ('F track past pillars', 140.5, 145.6), ('F sender->receiver screen', 149.3, 149.8),
    ('F through head->POV', 165.3, 166.2), ('F strip expands', 176.8, 177.6), ('G through screen->face', 179.9, 180.6),
    ('G chip into hub + flip', 183.1, 185.6), ('G field->tiles', 192.7, 193.4), ('G bars->space bar', 194.7, 196.5),
    ('G memory window', 198.2, 206.4), ('G pull back to two hands', 208.4, 210.1),
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
