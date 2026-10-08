"""Summarise MEAS lines (one per <Img> per frame) into per-image / per-scene sampling figures.

usage: analyse_meas.py meas1.log [meas2.log ...]
"""
import json
import sys
from collections import defaultdict

SCENES = [('S1', 0, 817), ('S2', 817, 1319), ('S3', 1319, 2593), ('S4', 2593, 3696), ('S5', 3696, 4395), ('S6', 4395, 5843),
          ('S7', 5843, 6413), ('S8', 6413, 6827), ('S9', 6827, 7596), ('S10', 7596, 8647)]


def scene_of(f):
    for s, a, b in SCENES:
        if a <= f < b:
            return s
    return '?'


def tc(f):
    s = f / 30
    return f'{int(s // 60)}:{s % 60:05.2f}'


rows = []
for path in sys.argv[1:]:
    for line in open(path):
        i = line.find('MEAS ')
        if i < 0:
            continue
        d = json.loads(line[i + 5:])
        if not d['nw']:
            continue  # first render before the image decoded
        rows.append(d)

# de-duplicate: keep the last measurement per (frame, src, tag, w)
uniq = {}
for d in rows:
    uniq[(d['f'], d['src'], d['tag'], d['w'])] = d
rows = sorted(uniq.values(), key=lambda d: d['f'])

groups = defaultdict(list)
for d in rows:
    vis_ok = d['visArea'] > 0 and not d['hidden'] and d['op'] > 0.05
    if not vis_ok:
        continue
    key = (d['src'], d['tag'] or 'main', scene_of(d['f']))
    groups[key].append(d)

print(f"{'image':28s} {'use':6s} {'scn':4s} {'frames':>6s} {'range':>13s}  {'max on-screen (1080p) w x h':>28s} {'@frame':>7s} {'tc':>8s} {'src/4Kpx':>8s} {'<1.0 frames':>11s} {'<1.0 ranges'}")
for key in sorted(groups, key=lambda k: (k[0], int(k[2][1:]) if k[2][1:].isdigit() else 99)):
    ds = groups[key]
    best = max(ds, key=lambda d: d['w'] * d['sx'])
    sw = best['w'] * best['sx']
    sh = best['h'] * best['sy']
    ratio = best['nw'] / (2 * sw)
    under = [d for d in ds if d['nw'] / (2 * d['w'] * d['sx']) < 1.0]
    # contiguous ranges of under-1.0 frames
    rngs = []
    for d in under:
        if rngs and d['f'] == rngs[-1][1] + 1:
            rngs[-1][1] = d['f']
        else:
            rngs.append([d['f'], d['f']])
    rtxt = ', '.join(f'{a}-{b}' for a, b in rngs)
    vis = best['vis']
    print(f"{key[0]:28s} {key[1]:6s} {key[2]:4s} {len(ds):6d} {ds[0]['f']:>6d}-{ds[-1]['f']:<6d}  {sw:9.1f} x {sh:7.1f} (vis {vis[2]-vis[0]}x{vis[3]-vis[1]}) {best['f']:7d} {tc(best['f']):>8s} {ratio:8.3f} {len(under):11d} {rtxt}")
    if '-v' in sys.argv[0:1]:
        pass
