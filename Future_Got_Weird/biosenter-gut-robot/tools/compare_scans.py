#!/usr/bin/env python3
"""Compare two temporal scans (tools/temporal_qa.py) of the same film, per scene, and annotate every flagged group with
the planned event (if any) it falls inside, from the film's own cue table and scene code timings.
usage: python3 tools/compare_scans.py <scanA_dir> <scanB_dir> <labelA> <labelB> <out.md>"""
import csv, json, os, sys
import numpy as np
A, Bd, la, lb, out = sys.argv[1:6]
EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CJ = json.load(open(os.path.join(EP, 'audio/cues.json')))
S = CJ['SCENES']
def load(d): return [r for r in csv.DictReader(open(os.path.join(d, 'temporal_scan.csv')))]
ra, rb = load(A), load(Bd)
rep_a = json.load(open(os.path.join(A, 'temporal_report.json'))); rep_b = json.load(open(os.path.join(Bd, 'temporal_report.json')))
scenes = [('S1 hook crawl', 0, S['s2']), ('S2 macro grip', S['s2'], S['s3']), ('S3 pull-back + cutaway cycle', S['s3'], S['s4']),
          ('S4 zoom-out + pig', S['s4'], S['s5']), ('S5 biopsy + spray', S['s5'], S['s6']), ('S6 lab', S['s6'], S['s7']), ('S7 ending + loop', S['s7'], 99)]
# planned events: (t0, t1, label)
EV = []
for p in CJ['phases']:
    lab = {'TA': 'tail anchor inflates (tabs lift)', 'HA': 'head anchor inflates (tabs lift)', 'TR': 'tail anchor releases',
           'HR': 'head anchor releases', 'EX': 'actuator extends (chambers pressurise)', 'CO': 'actuator contracts (chambers vent)'}[p['ph']]
    EV.append((p['t0'] - 0.05, p['t1'] + 0.15, lab))
EV += [(6.85, 7.95, 'pull-back from the macro (camera move)'), (7.7, 8.2, 'cutaway window opens'), (10.9, 11.4, 'cutaway window closes'),
       (11.5, 13.0, 'zoom-out and 3D-to-diagram handover'), (13.2, 14.4, 'pig push-in (camera move)'), (13.85, 15.3, 'robot travels the route'),
       (15.2, 16.0, '"6+ FEET" lands; pull-back'), (16.8, 17.25, 'biopsy instrument emerges and opens'), (17.25, 17.6, 'jaws close on the tissue'),
       (17.55, 18.15, 'instrument retracts into the channel'), (17.6, 18.7, 'camera pans to the spray site'), (18.1, 18.6, 'spray catheter emerges'),
       (18.6, 19.45, 'spray burst and stain'), (19.43, 20.6, 'lab: actuator extends'), (20.4, 21.0, 'lab: head anchor inflates'),
       (S['s7'] + 2.15, 26.3, 'ending: camera descends to the opening framing')]
def events(t): return sorted({e[2] for e in EV if e[0] <= t <= e[1]})
def stats(rows, a, b):
    sel = [r for r in rows if a <= float(r['t']) < b and not r['kind']]
    f = lambda k: np.array([float(r[k]) for r in sel])
    return {'frames': len(sel), 'flk_p99_mean': f('flk_p99').mean(), 'fwd_p99_mean': f('fwd_p99').mean(), 'flk_max_p95': np.percentile(f('flk_max'), 95),
            'frames_with_flicker_blocks': int((f('flk_bad') > 0).sum()), 'flicker_blocks_total': int(f('flk_bad').sum())}
L = [f'# Temporal continuity: {la} vs {lb}', '',
     f'All {len(ra)} frames of each film; {len(ra) - 1} consecutive pairs; cuts excluded: {rep_a["cuts"]} (+-1 frame), handover {rep_a["handover"]}.', '',
     '## Per scene (lower is better)', '',
     '| Scene | frames | mean p99 unexplained change (fwd) | mean p99 one-frame flicker | frames with any flicker block | total flicker blocks |',
     '|---|---|---|---|---|---|']
for name, a, b in scenes:
    x, y = stats(ra, a, b), stats(rb, a, b)
    L.append(f"| {name} | {x['frames']} | {x['fwd_p99_mean']:.2f} → **{y['fwd_p99_mean']:.2f}** | {x['flk_p99_mean']:.2f} → **{y['flk_p99_mean']:.2f}** | "
             f"{x['frames_with_flicker_blocks']} → **{y['frames_with_flicker_blocks']}** | {x['flicker_blocks_total']} → **{y['flicker_blocks_total']}** |")
x, y = stats(ra, 0, 99), stats(rb, 0, 99)
L.append(f"| **Whole film** | {x['frames']} | {x['fwd_p99_mean']:.2f} → **{y['fwd_p99_mean']:.2f}** | {x['flk_p99_mean']:.2f} → **{y['flk_p99_mean']:.2f}** | "
         f"{x['frames_with_flicker_blocks']} → **{y['frames_with_flicker_blocks']}** | {x['flicker_blocks_total']} → **{y['flicker_blocks_total']}** |")
L += ['', f"Loop seam (last → first frame, motion-compensated): worst block {rep_a['loop_seam']['fwd_max']} → **{rep_b['loop_seam']['fwd_max']}**, "
      f"bad blocks {rep_a['loop_seam']['fwd_bad']} → **{rep_b['loop_seam']['fwd_bad']}**.", '']
for lab, rep in ((la, rep_a), (lb, rep_b)):
    L += [f'## Flagged groups in {lab} ({len(rep["flagged_groups"])})', '', '| Frames | Time (s) | Flag | Worst at (x,y) | Planned event in progress |', '|---|---|---|---|---|']
    det = {d['frame']: d for d in rep['flagged_detail']}
    for g0, g1 in rep['flagged_groups']:
        d = max((det[f] for f in range(g0, g1 + 1) if f in det), key=lambda q: q['fwd_max'] + q['flk_max'])
        ev = events(d['t'])
        L.append(f"| {g0}–{g1} | {g0 / 30:.2f}–{g1 / 30:.2f} | {d['flag']} | ({d['worst_fwd_at']['x']},{d['worst_fwd_at']['y']}) | {'; '.join(ev) if ev else '**none**'} |")
    L.append('')
open(out, 'w').write('\n'.join(L) + '\n')
print('\n'.join(L[:20]))
