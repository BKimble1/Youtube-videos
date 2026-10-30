#!/usr/bin/env python3
"""Contact sheet of the EXACT first frame (frame 0, decoded from each rendered MP4) of all ten hook previews,
5 x 2, each frame at 432 x 768 with its hook number and name underneath.
usage: python3 tools/contact_sheet.py -> exports/FGW_HOOKS_FIRST_FRAMES_CONTACT_SHEET.png"""
import os, sys, subprocess, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import ROOT, LINES
tmp = tempfile.mkdtemp()
cells = []
for h in sorted(LINES):
    f = os.path.join(ROOT, f"exports/FGW_HOOK_{h}_{LINES[h]['slug']}.mp4")
    o = os.path.join(tmp, f'{h}.png')
    name = f"{h}  {LINES[h]['slug'].replace('_', ' ')}"
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f, '-vf', f"select=eq(n\\,0),scale=432:768,pad=432:828:0:0:color=0x111A20,"
                    f"drawtext=text='{name}':x=(w-text_w)/2:y=782:fontsize=26:fontcolor=white", '-frames:v', '1', o], check=True)
    cells.append(o)
out = os.path.join(ROOT, 'exports/FGW_HOOKS_FIRST_FRAMES_CONTACT_SHEET.png')
args = sum((['-i', c] for c in cells), [])
subprocess.run(['ffmpeg', '-v', 'error', '-y', *args, '-filter_complex',
                ''.join(f'[{i}:v]' for i in range(len(cells))) + f'xstack=inputs={len(cells)}:layout=' +
                '|'.join(f'{(i % 5) * 440}_{(i // 5) * 836}' for i in range(len(cells))) + ':fill=0x0B1218', '-frames:v', '1', out], check=True)
print(out)
