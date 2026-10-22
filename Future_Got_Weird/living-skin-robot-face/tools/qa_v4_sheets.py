#!/usr/bin/env python3
"""V4 QA images and motion scan from a rendered review (default: the V4 final review export).
  qa/v4/strips/      frame strips at every V4-brief target timestamp and V4 transition
  qa/v4/compare/     V3-vs-V4 sheets at identical timestamps for the review windows
  qa/v4/contact_3fps.png
  qa/v4/motion.json  per-frame mean absolute luma change (270x480), V3 and V4, with the values at the V4-brief target
                     timestamps and the largest V4 changes (cuts and fast moves)
usage: python3 tools/qa_v4_sheets.py [v4.mp4]"""
import json, os, subprocess, sys
import numpy as np
EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(EP)
PREV = 'exports/FGW_Living_Skin_V3_REVIEW_1080x1920.mp4'  # the previous version (V3)
CUR = sys.argv[1] if len(sys.argv) > 1 else 'exports/FGW_Living_Skin_V4_FINAL_REVIEW_1080x1920.mp4'  # this version (V4)
for d in ('qa/v4/strips', 'qa/v4/compare'): os.makedirs(d, exist_ok=True)
PROBLEMS = {'t06.967_anchor_jump': 6.967, 't09.467_face_insert': 9.467, 't10.400_experiment_cut': 10.4, 't12.833_blade': 12.833, 't14.100_side_window': 14.1, 't15.300_wide_reset': 15.3,
            't17.067_patch_panel': 17.067, 't17.367_micro_reset': 17.367, 't21.533_exit': 21.533, 't21.733_exit': 21.733, 't24.133_face_match': 24.133}
marks = {**PROBLEMS, 't01.267_cutaway_opens': 1.267, 't03.833_pullback': 3.833, 't05.767_grin': 5.767, 't07.100_attachment': 7.1, 't08.567_motor': 8.567, 't16.770_section_opens': 16.77, 't21.900_section_closes': 21.9, 't27.167_loop_end': 27.167}
rows = []
for name, t in sorted(marks.items(), key=lambda kv: kv[1]):
    f0 = round(t * 30); frames = [f0 - 3, f0 - 1, f0, f0 + 1, f0 + 3, f0 + 6]
    sel = '+'.join(f'eq(n\\,{f})' for f in frames); out = f'qa/v4/strips/{name}.png'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', CUR, '-vf', f"select='{sel}',scale=240:427,drawtext=text='{name} %{{n}}':x=4:y=4:fontsize=14:fontcolor=white:box=1:boxcolor=black@0.6,tile=6x1", '-frames:v', '1', '-vsync', '0', out], check=True)
    rows.append(out)
for part in range(0, len(rows), 7):
    rr = rows[part:part + 7]; args = sum([['-i', r] for r in rr], [])
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *args, '-filter_complex', ''.join(f'[{i}]' for i in range(len(rr))) + f'vstack={len(rr)}', f'qa/v4/strips/cuts_{part // 7}.png'], check=True)
wins = {'0-7s': [0, 1.3, 2.2, 3.4, 4.3, 5.0, 5.8, 6.9], '7-10.4s': [7.0, 7.5, 8.0, 8.6, 9.0, 9.4, 9.5, 10.3], '12.8-17.5s': [12.9, 13.3, 13.8, 14.1, 14.6, 15.3, 16.3, 17.1],
        '17.2-22.8s': [17.4, 18.4, 19.4, 20.4, 21.3, 21.53, 21.73, 22.27], '22.8-27.2s': [23.0, 23.6, 24.1, 24.2, 24.8, 25.6, 26.4, 27.16]}
for name, ts in wins.items():
    ins, filt = [], []
    for vi, (lab, f) in enumerate([('V3', PREV), ('V4', CUR)]):
        for i, t in enumerate(ts):
            ins += ['-ss', str(t), '-i', f]; k = vi * len(ts) + i
            filt.append(f"[{k}:v]trim=end_frame=1,scale=216:384,drawtext=text='{lab} {t:.2f}s':x=4:y=4:fontsize=15:fontcolor=white:box=1:boxcolor=black@0.6[v{k}]")
    n = 2 * len(ts); lay = '|'.join(f'{(k % len(ts)) * 216}_{(k // len(ts)) * 384}' for k in range(n))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *ins, '-filter_complex', ';'.join(filt) + ';' + ''.join(f'[v{k}]' for k in range(n)) + f'xstack=inputs={n}:layout={lay}[o]', '-map', '[o]', '-frames:v', '1', f'qa/v4/compare/V3_vs_V4_{name}.png'], check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', CUR, '-vf', "fps=3,scale=180:320,drawtext=text='%{pts\\:hms}':x=4:y=4:fontsize=13:fontcolor=white:box=1:boxcolor=black@0.6,tile=12x7", '-frames:v', '1', 'qa/v4/contact_3fps.png'], check=True)
def diffs(f):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-vf', 'scale=270:480', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True).stdout
    a = np.frombuffer(raw, np.uint8).reshape(-1, 480, 270).astype(np.float32)
    return np.abs(np.diff(a, axis=0)).mean(axis=(1, 2))
d2, d3 = diffs(PREV), diffs(CUR)
at = lambda d, t: [round(float(d[i - 1]), 1) for i in range(round(t * 30) - 2, round(t * 30) + 3) if 0 < i <= len(d)]
M = {'note': 'mean |luma change| between frame n-1 and n (0-255), 270x480; values listed for frames t-2..t+2',
     'problem_timestamps': {k: {'V3': at(d2, t), 'V4': at(d3, t)} for k, t in PROBLEMS.items()},
     'V4_top20': [{'frame': int(i + 1), 't': round((i + 1) / 30, 3), 'diff': round(float(d3[i]), 1)} for i in np.argsort(-d3)[:20]],
     'V3_top20': [{'frame': int(i + 1), 't': round((i + 1) / 30, 3), 'diff': round(float(d2[i]), 1)} for i in np.argsort(-d2)[:20]],
     'V4_median': round(float(np.median(d3)), 2), 'V3_median': round(float(np.median(d2)), 2)}
json.dump(M, open('qa/v4/motion.json', 'w'), indent=1)
print(json.dumps({k: M[k] for k in ('problem_timestamps', 'V4_median', 'V3_median')}))
print('V4_top20', [(x['t'], x['diff']) for x in M['V4_top20']])
