#!/usr/bin/env python3
"""Frame-step QA: for each transition/beat, tile consecutive frames from the export (every frame across a window) so
one-frame jumps, landmark shifts and popping masks can be seen. usage: python3 tools/bursts.py <video.mp4> <out_dir>"""
import os, subprocess, sys, json
vid, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
W = json.load(open('audio/narration/FGW_Scroll_V1_words.json'))
import re
nrm = lambda s: re.sub(r"[^a-z0-9' -]", '', s.lower().replace('’', "'"))
def T(p):
    ps = [nrm(x) for x in p.replace('’', "'").split()]
    for i in range(len(W) - len(ps) + 1):
        if all(nrm(W[i + k]['word']) == q for k, q in enumerate(ps)): return W[i]['start']
    raise KeyError(p)
BEATS = {
    '01_open_unroll': (0.0, 2.4),
    '02_split_to_roll': (T('That black lump') - 0.9, T('That black lump') + 0.3),
    '03_cut_to_reconstruction': (T('Centuries later') - 0.3, T('Centuries later') + 0.5),
    '04_cut_to_scan': (T('Look at what') - 1.1, T('Look at what') - 0.5),
    '05_spiral_reveal': (T('Slice through') + 0.7, T('a spiral.') + 0.4),
    '06_branch_error': (T('If you jump') - 0.1, T('If you jump') + 1.4),
    '07_reset': (T('Keep going') + 5.2, T('Keep going') + 6.6),
    '08_flatten': (T('That gave them') + 0.1, T('could flatten.') + 1.2),
    '09_page_opens': (T('Now they had') - 0.2, T('Now they had') + 0.9),
    '10_ink_reveal': (T('Put the patches') + 0.2, T('Put the patches') + 3.8),
    '11_cut_to_paris4': (T('And here’s how') - 0.4, T('And here’s how') + 0.3),
    '12_validation_overlay': (T('They lined'), T('They lined') + 1.3),
    '13_cut_back_1667': (T('Back on the first') - 0.4, T('Back on the first') + 0.4),
    '14_closing_callback': (T('You just read') + 0.8, T('You just read') + 2.2),
    '15_reroll': (T('And the page is still') - 0.1, T('And the page is still') + 2.2),
}
for name, (a, b) in BEATS.items():
    n = int(round((b - a) * 30))
    cols = 8
    rows = (n + cols - 1) // cols
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{a:.3f}', '-t', f'{n / 30 - 0.001:.3f}', '-i', vid, '-vf', f'scale=480:-1,setpts=PTS+{a:.3f}/TB,drawtext=text=%{{pts}}:x=6:y=6:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6,tile={cols}x{rows}', '-frames:v', '1', os.path.join(out, f'{name}.png')], stdin=subprocess.DEVNULL)
    print(name, a, b, n)
