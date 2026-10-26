#!/usr/bin/env python3
"""SRT from the measured word timings. Text is the locked script, word for word. Each sentence is one cue when it fits
two lines of 42 characters; a longer sentence splits at the comma nearest its middle (or the middle word); short
neighbouring sentences in one paragraph share a cue when they fit and follow within 0.45 s."""
import json, sys
sys.path.insert(0, 'tools'); from script import TEXT, words
W = json.load(open('audio/narration/FGW_Robot_Faces_V1_words.json'))
MAXC = 42
def greedy(ws):
    lines, cur = [], ''
    for w in ws:
        t = (cur + ' ' + w).strip()
        if len(t) > MAXC and cur: lines.append(cur); cur = w
        else: cur = t
    return lines + [cur]
def lines_of(ws):
    """greedy wrap at 42 characters decides the line count; two lines are then re-broken as evenly as possible"""
    g = greedy(ws)
    if len(g) != 2: return g
    best = None
    for i in range(1, len(ws)):
        a, b = ' '.join(ws[:i]), ' '.join(ws[i:])
        if max(len(a), len(b)) > MAXC: continue
        sc = max(len(a), len(b)) + (6 if ws[i - 1].lower() in FN else 0) - (4 if ws[i - 1].endswith(',') else 0)
        if best is None or sc < best[0]: best = (sc, [a, b])
    return best[1]
FN = {'a', 'an', 'the', 'by', 'of', 'to', 'and', 'with', 'in', 'its', 'as', 'at', 'for', 'from', 'could', 'into', 'about', 'how', 'much', 'we', 'a'}
fits = lambda ws: len(lines_of([w['word'] for w in ws])) <= 2
ends = lambda w: w['word'].rstrip('”"’').endswith(('.', '?', '!')) or w['word'].endswith(':')
sents, cur = [], []
for w in W:
    cur.append(w)
    if ends(w): sents.append(cur); cur = []
if cur: sents.append(cur)
def split(s):
    if fits(s): return [s]
    n = len(s)
    ch = lambda a: len(' '.join(w['word'] for w in a))
    ok = [i for i in range(2, n - 1) if fits(s[:i]) or len(s[:i]) > 3]
    def score(i):
        c = abs(ch(s[:i]) - ch(s[i:]))
        if s[i - 1]['word'].endswith((',', ':')): c -= 25
        if s[i - 1]['word'].lower() in FN: c += 30
        if not fits(s[:i]): c += 100
        if not fits(s[i:]): c += 40
        return c
    i = min(ok, key=score)
    return split(s[:i]) + split(s[i:])
pieces = [p for s in sents for p in split(s)]
cues = []
for p in pieces:
    if cues and fits(cues[-1] + p) and p[0]['start'] - cues[-1][-1]['end'] < 0.45 and len(cues[-1]) < 7 and ends(cues[-1][-1]):
        cues[-1] = cues[-1] + p
    else: cues.append(p)
def ts(t):
    ms = int(round(t * 1000)); return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
out = []
for k, c in enumerate(cues):
    s = c[0]['start']; e = max(c[-1]['end'] + 0.3, s + 1.0)
    if k + 1 < len(cues): e = min(e, cues[k + 1][0]['start'] - 0.04)
    out.append(f"{k+1}\n{ts(s)} --> {ts(e)}\n" + '\n'.join(lines_of([x['word'] for x in c])) + '\n')
open('captions/FGW_Robot_Faces_V1.srt', 'w').write('\n'.join(out))
json.dump([{'start': c[0]['start'], 'end': c[-1]['end'], 'text': ' '.join(x['word'] for x in c)} for c in cues], open('source/src/data/cues.json', 'w'), indent=0)
assert [x['word'] for c in cues for x in c] == words(TEXT)
print(len(cues), 'cues; max line', max(len(l) for c in cues for l in lines_of([x['word'] for x in c])), 'shortest', min(c[-1]['end'] - c[0]['start'] for c in cues))
