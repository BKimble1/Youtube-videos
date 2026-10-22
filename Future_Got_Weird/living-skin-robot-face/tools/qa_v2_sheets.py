#!/usr/bin/env python3
"""V2 QA images from the rendered review: frame strips around every V2 cut (qa/v2/strips/), V1-vs-V2 sheets at the
same timestamps for the five review windows (qa/v2/compare/), and a 3 fps contact sheet (qa/v2/contact_3fps.png)."""
import json, os, subprocess
EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(EP)
V1, V2 = 'exports/FGW_Living_Skin_REVIEW_1080x1920.mp4', 'exports/FGW_Living_Skin_V2_REVIEW_1080x1920.mp4'
os.makedirs('qa/v2/strips', exist_ok=True); os.makedirs('qa/v2/compare', exist_ok=True)
SH = json.load(open('production/v2_cues.json'))['SH2']
rows = []
for name, t in SH.items():
    f0 = round(t * 30); frames = [f0 - 3, f0 - 1, f0, f0 + 1, f0 + 3, f0 + 6]
    sel = '+'.join(f'eq(n\\,{f})' for f in frames); out = f'qa/v2/strips/{name}.png'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', V2, '-vf', f"select='{sel}',scale=240:427,drawtext=text='{name} %{{n}}':x=4:y=4:fontsize=14:fontcolor=white:box=1:boxcolor=black@0.6,tile=6x1", '-frames:v', '1', '-vsync', '0', out], check=True)
    rows.append(out)
for part, rr in enumerate([rows[:6], rows[6:12], rows[12:]]):
    args = sum([['-i', r] for r in rr], [])
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *args, '-filter_complex', ''.join(f'[{i}]' for i in range(len(rr))) + f'vstack={len(rr)}', f'qa/v2/strips/cuts_{part}.png'], check=True)
wins = {'0-3s': [0, 0.4, 0.8, 1.2, 1.5, 1.9, 2.3, 2.7], '7-10.4s': [7.0, 7.5, 8.0, 8.6, 9.0, 9.4, 9.8, 10.3], '13-17s': [13.0, 13.3, 13.6, 14.3, 14.9, 15.7, 16.3, 16.6],
        '17-22s': [17.2, 17.8, 18.6, 19.4, 20.2, 21.0, 21.5, 21.9], '23-27.2s': [23.0, 23.6, 24.2, 24.8, 25.4, 26.0, 26.6, 27.16]}
for name, ts in wins.items():
    ins, filt = [], []
    for vi, (lab, f) in enumerate([('V1', V1), ('V2', V2)]):
        for i, t in enumerate(ts):
            ins += ['-ss', str(t), '-i', f]; k = vi * len(ts) + i
            filt.append(f"[{k}:v]trim=end_frame=1,scale=216:384,drawtext=text='{lab} {t:.1f}s':x=4:y=4:fontsize=15:fontcolor=white:box=1:boxcolor=black@0.6[v{k}]")
    n = 2 * len(ts); lay = '|'.join(f'{(k % len(ts)) * 216}_{(k // len(ts)) * 384}' for k in range(n))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *ins, '-filter_complex', ';'.join(filt) + ';' + ''.join(f'[v{k}]' for k in range(n)) + f'xstack=inputs={n}:layout={lay}[o]', '-map', '[o]', '-frames:v', '1', f'qa/v2/compare/V1_vs_V2_{name}.png'], check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', V2, '-vf', "fps=3,scale=180:320,drawtext=text='%{pts\\:hms}':x=4:y=4:fontsize=13:fontcolor=white:box=1:boxcolor=black@0.6,tile=12x7", '-frames:v', '1', 'qa/v2/contact_3fps.png'], check=True)
print('ok')
