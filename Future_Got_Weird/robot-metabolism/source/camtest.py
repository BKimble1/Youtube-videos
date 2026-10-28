#!/usr/bin/env python3
"""Framing tests side by side: python3 camtest.py out.png world t 'eye;target;f;oy' ..."""
import json, subprocess, sys, os
from PIL import Image
out, world, t = sys.argv[1], sys.argv[2], float(sys.argv[3])
jobs = []
for i, spec in enumerate(sys.argv[4:]):
    e, tg, f, oy = spec.split(';')
    jobs.append({'id': os.environ.get('CT','CamTest'), 'props': {'t': t, 'world': world, 'eye': json.loads(f'[{e}]'), 'target': json.loads(f'[{tg}]'), 'f': float(f), 'oy': float(oy)}, 'out': f'{out}.{i}.png', 'scale': 0.4})
json.dump(jobs, open(out + '.json', 'w'))
subprocess.run(['node', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'stills.mjs'), out + '.json'], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
ims = [Image.open(j['out']) for j in jobs]
o = Image.new('RGB', (sum(i.width for i in ims) + 10 * len(ims), ims[0].height), 'black')
x = 0
for i in ims:
    o.paste(i, (x, 0)); x += i.width + 10
o.save(out)
