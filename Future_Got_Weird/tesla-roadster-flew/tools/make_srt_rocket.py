#!/usr/bin/env python3
"""Upload captions for the Rocket Short: the same 2-5 word phrase groups as the burned-in captions
(source/src/rocket/data.ts PHRASES), timed from source/src/data/rocket_words.json.
Output: captions/FGW_Rocket_Short_v1.srt"""
import json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
words = json.load(open(os.path.join(ROOT, 'source/src/data/rocket_words.json')))['words']
ts = open(os.path.join(ROOT, 'source/src/rocket/data.ts')).read()
sizes = [int(x) for x in re.search(r'PHRASES = \[([\d, ]+)\]', ts).group(1).split(',')]
dur = json.load(open(os.path.join(ROOT, 'source/src/data/rocket_events.json')))['DURATION']
assert sum(sizes) == len(words), (sum(sizes), len(words))
def fmt(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'
out, i, cues = [], 0, []
for n in sizes:
    ws = words[i:i + n]; i += n
    cues.append([ws[0]['s'] - 0.05, ws[-1]['e'], ' '.join(w['w'] for w in ws)])
for k, c in enumerate(cues):
    nxt = cues[k + 1][0] if k + 1 < len(cues) else dur
    c[1] = min(max(c[1] + 0.25, c[0] + 0.6), nxt - 0.001)
for k, (a, b, text) in enumerate(cues, 1):
    out.append(f'{k}\n{fmt(max(0, a))} --> {fmt(b)}\n{text}\n')
p = os.path.join(ROOT, 'captions/FGW_Rocket_Short_v1.srt')
open(p, 'w').write('\n'.join(out))
print(p, len(cues), 'cues')
