#!/usr/bin/env python3
"""SRT from the measured word timings (audio/narration/FGW_Chainsaw_Robot_V1_words.json). Cues break at sentence ends,
then at commas, with at most 42 characters per line and 2 lines; each cue runs from its first word's start to its last
word's end (+0.25 s, never into the next cue). The words are the locked script's, verbatim."""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W = json.load(open(os.path.join(ROOT, 'audio/narration/FGW_Chainsaw_Robot_V1_words.json')))
MAX = 42

def lines_of(ws):
    txt = ' '.join(w['word'] for w in ws)
    if len(txt) <= MAX:
        return [txt]
    # two balanced lines: the break that minimises the longer line
    best = None
    for k in range(1, len(ws)):
        a = ' '.join(w['word'] for w in ws[:k]); b = ' '.join(w['word'] for w in ws[k:])
        if len(a) <= MAX and len(b) <= MAX and (best is None or max(len(a), len(b)) < max(len(best[0]), len(best[1]))):
            best = (a, b)
    if best:
        return list(best)
    out, cur = [], ''
    for w in ws:
        s = (cur + ' ' + w['word']).strip()
        if len(s) > MAX and cur:
            out.append(cur); cur = w['word']
        else:
            cur = s
    out.append(cur)
    return out

cues, cur = [], []
for i, w in enumerate(W):
    cur.append(w)
    txt = ' '.join(x['word'] for x in cur)
    end_sent = w['word'].endswith(('.', '?', '!'))
    end_clause = w['word'].endswith(',') and len(txt) > 30
    nxt_len = len(txt) + 1 + len(W[i + 1]['word']) if i + 1 < len(W) else 0
    if end_sent or end_clause or nxt_len > 2 * MAX - 4 or len(lines_of(cur + ([W[i + 1]] if i + 1 < len(W) else []))) > 2:
        cues.append(cur); cur = []
if cur: cues.append(cur)

def ts(x):
    h = int(x // 3600); m = int(x % 3600 // 60); s = x % 60
    return f'{h:02d}:{m:02d}:{int(s):02d},{int(round((s - int(s)) * 1000)):03d}'.replace(',1000', ',999')

out = []
for k, c in enumerate(cues):
    a = c[0]['start']
    b = c[-1]['end'] + 0.25
    if k + 1 < len(cues): b = min(b, cues[k + 1][0]['start'] - 0.02)
    out.append(f"{k + 1}\n{ts(a)} --> {ts(b)}\n" + '\n'.join(lines_of(c)) + '\n')
os.makedirs(os.path.join(ROOT, 'captions'), exist_ok=True)
open(os.path.join(ROOT, 'captions/FGW_Chainsaw_Robot_V1.srt'), 'w').write('\n'.join(out))
words_in = ' '.join(w['word'] for x in cues for w in x)
assert words_in == ' '.join(w['word'] for w in W)
print(len(cues), 'cues')
