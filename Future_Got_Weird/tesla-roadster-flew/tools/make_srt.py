#!/usr/bin/env python3
"""Upload captions from narration word times: phrases of <= 42 characters, broken at punctuation where possible.
Usage: make_srt.py <words.json> <out.srt>"""
import json, re, sys

words = json.load(open(sys.argv[1]))['words']
cues, cur = [], []
for w in words:
    text = ' '.join(x['w'] for x in cur + [w])
    if cur and len(text) > 42:
        cues.append(cur); cur = []
    cur.append(w)
    if re.search(r'[.?!…]$', w['w']) or (re.search(r'[,:]$', w['w']) and len(' '.join(x['w'] for x in cur)) > 24):
        cues.append(cur); cur = []
if cur:
    cues.append(cur)

def ts(s):
    ms = int(round(s * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); sec, ms = divmod(ms, 1000)
    return f'{h:02d}:{m:02d}:{sec:02d},{ms:03d}'

with open(sys.argv[2], 'w') as f:
    for i, c in enumerate(cues):
        end = min(c[-1]['e'] + 0.25, cues[i + 1][0]['s'] - 0.02) if i + 1 < len(cues) else c[-1]['e'] + 0.4
        f.write(f"{i + 1}\n{ts(c[0]['s'])} --> {ts(end)}\n{' '.join(x['w'] for x in c)}\n\n")
print(f'{sys.argv[2]}: {len(cues)} cues')
