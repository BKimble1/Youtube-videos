#!/usr/bin/env python3
"""Render café moments through chosen cameras (V5Lab 'view' scene) and tile them.
usage: python3 tools/views.py <outdir> <cols> <tile_w> name:t:cam[:json-opts] [...]  (opts e.g. '{"figM":{"farShoulderV":-88}}')
cam = wide|two|cuM|cuW|hands|armM|armW|lapM|sipW or x,y,z[,roll]"""
import json, subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
CAMS = {'wide': (540, 1010, 1.06), 'two': (525, 985, 1.45), 'cuM': (770, 866, 2.5), 'cuW': (300, 886, 2.5), 'hands': (650, 1112, 3.3),
        'xw': (540, 1040, 1.14), 'armM': (760, 1010, 2.0), 'armW': (310, 1010, 2.0), 'lapM': (740, 1110, 3.0), 'sipW': (300, 930, 3.0), 'mid': (540, 1060, 1.9)}
out = (ROOT / sys.argv[1]).resolve(); cols = int(sys.argv[2]); tw = int(sys.argv[3])
jobs, names = [], []
for spec in sys.argv[4:]:
    parts = spec.split(':', 3)
    n, t, c = parts[:3]
    opts = json.loads(parts[3]) if len(parts) > 3 else None
    cam = CAMS.get(c) or tuple(float(v) for v in c.split(','))
    cam_d = {'x': cam[0], 'y': cam[1], 'z': cam[2]}
    if len(cam) > 3: cam_d['roll'] = cam[3]
    jobs.append({'name': n, 'comp': 'V5Lab', 'props': {'scene': ('ext' if n.startswith('x') else 'view'), 't': float(t), 'cam': cam_d, **({'opts': opts} if opts else {})}}); names.append(n)
out.mkdir(parents=True, exist_ok=True)
jf = out / 'jobs.json'; jf.write_text(json.dumps(jobs))
r = subprocess.run(['node', 'scripts/frames_multi.mjs', str(out), str(jf)], cwd=ROOT / 'source', capture_output=True, text=True)
if r.returncode: print(r.stdout[-1500:], r.stderr[-1500:]); sys.exit(1)
subprocess.run(['python3', str(ROOT / 'tools/sheet_from.py'), str(out), str(out / 'sheet.png'), str(cols), str(tw)] + names, check=True)
print('sheet', out / 'sheet.png')
