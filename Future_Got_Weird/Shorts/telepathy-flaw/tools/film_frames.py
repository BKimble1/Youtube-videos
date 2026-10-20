#!/usr/bin/env python3
"""Render film frames (one bundle) and tile them. usage: python3 tools/film_frames.py <comp> <outdir> <cols> <tile_w> <frame> [frame ...]
frames may be given as seconds with an 's' suffix (e.g. 13.1s)."""
import json, subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
comp, out, cols, tw = sys.argv[1], (ROOT / sys.argv[2]).resolve(), int(sys.argv[3]), int(sys.argv[4])
jobs, names = [], []
for a in sys.argv[5:]:
    f = round(float(a[:-1]) * 30) if a.endswith('s') else int(a)
    jobs.append({'name': f'f{f:04d}', 'comp': comp, 'frame': f}); names.append(f'f{f:04d}')
out.mkdir(parents=True, exist_ok=True)
jf = out / 'jobs.json'; jf.write_text(json.dumps(jobs))
r = subprocess.run(['node', 'scripts/frames_multi.mjs', str(out), str(jf)], cwd=ROOT / 'source', capture_output=True, text=True)
if r.returncode: print(r.stdout[-1500:], r.stderr[-1500:]); sys.exit(1)
subprocess.run(['python3', str(ROOT / 'tools/sheet_from.py'), str(out), str(out / 'sheet.png'), str(cols), str(tw)] + names, check=True)
print('sheet', out / 'sheet.png')
