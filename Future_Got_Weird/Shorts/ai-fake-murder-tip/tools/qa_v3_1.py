#!/usr/bin/env python3
"""V3.1 Cleanup QA on the ENCODED masters (decoded frames, numpy). Usage: qa_v3_1.py  (run from anywhere)
Writes qa/v3_1_cleanup/qa_v3_1.json and prints a summary.
Checks: (1) caption-lane intrusion while a lane caption is on screen, (2) highlight / text bounds against the paper border at the three quote states,
(3) frame-to-frame change spikes vs the V3 baseline, (4) first/last frame match, (5) safe-zone extents (x 96-876, y 240-1450) per frame, (6) saffron AI-tag count near the quote.
Nothing here is perceptual: it measures decoded pixels."""
import json, os, re, subprocess, sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1080, 1920
NEW = f'{ROOT}/exports/FGW_AI_Fake_Murder_Tip_V3_1_Cleanup_Clean_1080x1920.mp4'
OLD = f'{ROOT}/exports/FGW_AI_Fake_Murder_Tip_V3_Final_Clean_1080x1920.mp4'
OUT = f'{ROOT}/qa/v3_1_cleanup/qa_v3_1.json'
cues = open(f'{ROOT}/source/src/v3/cues.ts').read()
caps = json.loads(re.search(r'export const CAPS: Cap\[\] = (\[.*\]);', cues).group(1))
lane_frames = set()
for c in caps:
    if not c['integrated']:
        lane_frames.update(range(c['from'], c['to']))


def frames(path):
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', path, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    n = 0
    while True:
        b = p.stdout.read(W * H * 3)
        if len(b) < W * H * 3:
            break
        yield n, np.frombuffer(b, np.uint8).reshape(H, W, 3)
        n += 1


def bgcol(im):
    return im[1900, 1070].astype(np.int16)


res = {'lane_intrusion': [], 'safe': [], 'spikes_new': [], 'spikes_old': [], 'quote': {}}
prev = None
diff_new = []
first = last = None
quote_probe = {120: ('Q2 (opening quote surface, scale 1.0)', (96, 557, 780, 366)), 200: ('Q3 (checker scene, smallest state, scale 0.78)', (182, 292, 608, 285.4)), 500: ('Q6 (takeaway, largest state, scale 1.0)', (96, 330, 780, 366)), 540: ('Q6 (takeaway, cursor approaching)', (96, 330, 780, 366))}
SAFFRON = np.array([0xFF, 0xC7, 0x44])
for n, im in frames(NEW):
    if n == 0: first = im.copy()
    if n == 629: last = im.copy()
    if prev is not None:
        diff_new.append(float(np.abs(im.astype(np.int16) - prev.astype(np.int16)).mean()))
    prev = im
    bg = bgcol(im)
    m = np.abs(im.astype(np.int16) - bg).max(axis=2) > 60
    xs = np.where(m.any(0))[0]; ys = np.where(m.any(1))[0]
    if len(xs):
        res['safe'].append((n, int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())))
    if n in lane_frames:
        lane = m[1255:1450, :]
        k = int(lane.sum())
        if k > 0:
            res['lane_intrusion'].append((n, k))
    if n in quote_probe:
        label, (qx, qy, qw, qh) = quote_probe[n]
        sm = (np.abs(im.astype(np.int16) - SAFFRON).max(axis=2) < 24)
        r0, r1 = int(qy + 0.28 * qh), int(qy + qh)               # rows below the AI corner mark (the mark is saffron too)
        c0, c1 = int(qx - 20), int(qx + qw + 20)
        ys_s, xs_s = np.where(sm[r0:r1, c0:c1])
        xs_s = xs_s + c0
        inner_l, inner_r = qx + 3.5, qx + qw - 3.5
        res['quote'][n] = {'state': label, 'saffron_min_x': int(xs_s.min()), 'saffron_max_x': int(xs_s.max()),
                           'clearance_left_px': round(float(xs_s.min() - inner_l), 1), 'clearance_right_px': round(float(inner_r - xs_s.max()), 1)}
res['frames'] = len(diff_new) + 1
res['first_last_mean_abs_diff'] = float(np.abs(first.astype(np.int16) - last.astype(np.int16)).mean())
res['first_last_pct_over_32'] = float((np.abs(first.astype(np.int16) - last.astype(np.int16)).max(axis=2) > 32).mean() * 100)
# baseline spikes
prev = None
diff_old = []
for n, im in frames(OLD):
    if prev is not None:
        diff_old.append(float(np.abs(im.astype(np.int16) - prev.astype(np.int16)).mean()))
    prev = im
res['diff_new'] = [round(d, 3) for d in diff_new]
res['diff_old'] = [round(d, 3) for d in diff_old]
bounds = {'x': (96, 876), 'y': (240, 1450)}
out_safe = [s for s in res['safe'] if s[1] < 96 - 8 or s[2] > 876 + 8 or s[3] < 240 - 8 or s[4] > 1450 + 8]
groups = []
for s in out_safe:
    if groups and s[0] == groups[-1][1] + 1:
        g = groups[-1]; g[1] = s[0]; g[2] = min(g[2], s[1]); g[3] = max(g[3], s[2]); g[4] = min(g[4], s[3]); g[5] = max(g[5], s[4])
    else:
        groups.append([s[0], s[0], s[1], s[2], s[3], s[4]])
res['safe_groups'] = groups
res['safe_extents_inside'] = None
json.dump(res, open(OUT, 'w'))
li = res['lane_intrusion']
print('frames', res['frames'], '| lane frames checked', len(lane_frames), '| frames with scene content in y 1255-1450 while a lane caption is up:', len(li), li[:12])
print('first/last frame: mean abs diff', round(res['first_last_mean_abs_diff'], 3), '| % pixels > 32:', round(res['first_last_pct_over_32'], 3))
print('safe-zone groups outside x 96-876 / y 240-1450 (+8 px):')
for g in groups: print('  frames %d-%d  minx %d maxx %d miny %d maxy %d' % tuple(g))
top = sorted(range(len(diff_new)), key=lambda i: -diff_new[i])[:10]
print('largest frame-to-frame changes, V3.1:', [(i + 1, diff_new[i]) for i in top])
top = sorted(range(len(diff_old)), key=lambda i: -diff_old[i])[:10]
print('largest frame-to-frame changes, V3 :', [(i + 1, diff_old[i]) for i in top])
for k, v in res['quote'].items():
    print('quote probe f%d' % k, v['state'], '| highlight x', v['saffron_min_x'], '-', v['saffron_max_x'], '| clearance to the inside of the border: left', v['clearance_left_px'], 'right', v['clearance_right_px'])
