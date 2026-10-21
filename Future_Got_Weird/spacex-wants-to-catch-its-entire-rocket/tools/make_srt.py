"""SRT from the measured word timings of the rendered narration (not script estimates).
Captions break at sentence/clause punctuation, max ~42 characters per line, two lines max, 0.9–6 s each."""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W = json.load(open(f'{ROOT}/audio/narration/narration_words.json'))
def ts(x):
    ms = int(round(x * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'
caps, cur = [], []
def flush():
    if cur: caps.append(list(cur)); cur.clear()
for i, w in enumerate(W):
    cur.append(w)
    text = ' '.join(x['w'] for x in cur)
    nxt = W[i + 1] if i + 1 < len(W) else None
    end_sentence = w['w'][-1] in '.?!'
    clause = w['w'][-1] in ',:;'
    new_line = nxt is None or nxt['line'] != w['line']
    if new_line or end_sentence and len(text) > 18 or clause and len(text) > 34 or len(text) > 70:
        flush()
flush()
def wrap(s):
    if len(s) <= 42: return s
    words = s.split(); best = None
    for k in range(1, len(words)):
        a, b = ' '.join(words[:k]), ' '.join(words[k:])
        sc = max(len(a), len(b))
        if best is None or sc < best[0]: best = (sc, a, b)
    return best[1] + '\n' + best[2]
out = []
for n, c in enumerate(caps, 1):
    st = c[0]['s']; en = c[-1]['e']
    if n < len(caps): en = min(max(en, st + 0.9), caps[n][0]['s'] - 0.02)
    out.append(f"{n}\n{ts(st)} --> {ts(en)}\n{wrap(' '.join(x['w'] for x in c))}\n")
open(f'{ROOT}/captions/FGW_Starship_Dual_Catch_V1.srt', 'w').write('\n'.join(out))
print(len(caps), 'captions; max line', max(len(l) for o in out for l in o.split('\n')[2:]))
