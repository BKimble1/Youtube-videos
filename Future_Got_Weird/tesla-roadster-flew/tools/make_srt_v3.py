#!/usr/bin/env python3
"""Upload captions: the same phrases as the burned-in captions, word-timed. Usage: make_srt_v3.py [v4]"""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
import sys
V4 = len(sys.argv) > 1 and sys.argv[1] == 'v4'
SIZES = [6, 4, 4, 5, 4, 3, 4, 6, 3, 6, 4, 8, 2, 3, 6, 2, 8, 8, 2, 1, 2] if V4 else [4, 6, 6, 4, 7, 6, 6, 3, 3, 5, 5, 3, 6, 4, 8, 2, 3, 6, 2, 8, 8, 4, 4, 2]
ws = json.load(open(os.path.join(ROOT, 'source/src/data/short4_words.json' if V4 else 'source/src/data/short3_words.json')))['words']
END = round((ws[-1]['e'] + 0.5) * 30) / 30 if V4 else 36.733
assert sum(SIZES) == len(ws), (sum(SIZES), len(ws))
ph, i = [], 0
for n in SIZES:
    ph.append(ws[i:i + n]); i += n
def ts(t):
    t = max(0, t); h, r = divmod(t, 3600); m, s = divmod(r, 60)
    return f'{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s - int(s)) * 1000)):03d}'
out = []
for k, p in enumerate(ph):
    a = p[0]['s'] - 0.08
    b = min(ph[k + 1][0]['s'] - 0.08, p[-1]['e'] + 0.45) if k + 1 < len(ph) else END
    out.append(f"{k + 1}\n{ts(a)} --> {ts(b)}\n{' '.join(x['w'] for x in p)}\n")
open(os.path.join(ROOT, 'captions/FGW_Roadster_Short_FINAL_v4.srt' if V4 else 'captions/FGW_Roadster_Short_v3.srt'), 'w').write('\n'.join(out))
print(len(out), 'cues')
