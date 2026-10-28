#!/usr/bin/env python3
"""Contact sheets through the batch renderer: python3 sheets.py out_prefix f1,f2,... [captions]  (12 frames per sheet)"""
import json, subprocess, sys, os
out, frames = sys.argv[1], [int(x) for x in sys.argv[2].split(',')]
cap = (sys.argv[3] if len(sys.argv) > 3 else 'true') == 'true'
jobs = []
for k in range(0, len(frames), 12):
    jobs.append({'id': 'Sheet', 'props': {'frames': frames[k:k + 12], 'captions': cap}, 'out': f'{out}_{k // 12}.png', 'scale': 0.25})
p = out + '_jobs.json'
json.dump(jobs, open(p, 'w'))
subprocess.run(['node', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'stills.mjs'), p], check=True, stdout=subprocess.DEVNULL)
print('\n'.join(j['out'] for j in jobs))
