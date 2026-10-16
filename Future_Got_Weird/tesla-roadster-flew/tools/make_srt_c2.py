#!/usr/bin/env python3
"""Companion v2 upload captions from the placed narration (source/src/data/companion2_words.json, Scribe timings).
Display spellings follow the script (numbers as figures, product names capitalised). One sentence per caption where it
fits (max 2 lines of 42 characters); longer sentences break at the best comma or the middle. Writes
captions/FGW_Roadster_Companion_REVIEW_v2.srt and script/companion_v2_transcript.txt (plain text)."""
import json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ws = [dict(w) for w in json.load(open(os.path.join(ROOT, 'source/src/data/companion2_words.json')))['words']]
END = 200.5
MERGE = [(['zero', 'point', 'eight', 'one', 'seconds.'], '0.81 seconds.'), (['nineteen', 'seventies.'], '1970s.'),
         (['twenty', 'twenty-eight.'], '2028.'), (['cold', 'gas'], 'cold-gas'), (['invite', 'only,'], 'invite-only,')]
SUB = {'sixty': '60', 'semi': 'Semi', "G's.": "g's."}
out, i = [], 0
while i < len(ws):
    for seq, rep in MERGE:
        if [w['w'] for w in ws[i:i + len(seq)]] == seq:
            out.append({'w': rep, 's': ws[i]['s'], 'e': ws[i + len(seq) - 1]['e']}); i += len(seq); break
    else:
        w = dict(ws[i]); w['w'] = SUB.get(w['w'], w['w']); out.append(w); i += 1
words = out
cues, cur = [], []
def flush():
    if cur: cues.append(list(cur)); cur.clear()
for k, w in enumerate(words):
    text = ' '.join(x['w'] for x in cur + [w])
    if cur and len(text) > 78:
        # break at the last comma in the cue if there is one, else here
        cut = max((j for j, x in enumerate(cur) if x['w'].endswith(',')), default=None)
        if cut is not None and cut < len(cur) - 1:
            rest = cur[cut + 1:]; del cur[cut + 1:]; flush(); cur.extend(rest)
        else:
            flush()
    cur.append(w)
    nxt = words[k + 1] if k + 1 < len(words) else None
    if re.search(r'[.?!]$', w['w']) or (nxt and nxt['s'] - w['e'] > 0.9):
        flush()
flush()
def lines(text):
    if len(text) <= 42: return text
    best, score = None, 1e9
    for m in re.finditer(' ', text):
        a, b = text[:m.start()], text[m.start() + 1:]
        if len(a) > 42 or len(b) > 42: continue
        sc = abs(len(a) - len(b)) - (12 if a.endswith(',') else 0)
        if sc < score: best, score = (a, b), sc
    return '\n'.join(best) if best else text
def ts(t):
    t = max(0, t); h, r = divmod(t, 3600); m, s = divmod(r, 60)
    ms = int(round((s - int(s)) * 1000))
    if ms == 1000: s, ms = int(s) + 1, 0
    return f'{int(h):02d}:{int(m):02d}:{int(s):02d},{ms:03d}'
srt = []
for k, c in enumerate(cues):
    a = c[0]['s'] - 0.05
    b = c[-1]['e'] + 0.6
    if k + 1 < len(cues): b = min(b, cues[k + 1][0]['s'] - 0.06)
    b = max(b, min(a + 0.9, cues[k + 1][0]['s'] - 0.06 if k + 1 < len(cues) else END))
    srt.append(f"{k + 1}\n{ts(a)} --> {ts(min(b, END))}\n{lines(' '.join(x['w'] for x in c))}\n")
os.makedirs(os.path.join(ROOT, 'captions'), exist_ok=True)
open(os.path.join(ROOT, 'captions/FGW_Roadster_Companion_REVIEW_v2.srt'), 'w').write('\n'.join(srt))
# plain transcript: one paragraph per section, with its start time
SECTIONS = [('Opening', ['P1', 'P2', 'P3', 'P4']), ('Trick 1: air pressure', ['P5', 'P6', 'P7', 'P8', 'P9']),
            ('Leaving the ramp; trick 2: gas thrust', ['P10', 'P11', 'P12', 'P13', 'P14']), ('The hop', ['P15', 'P16a', 'P16b']),
            ('0-60', ['P17', 'P18', 'P19']), ('Which Roadster does what', ['P20']), ('What the demo did not show', ['P21']), ('The answer', ['P22'])]
raw = json.load(open(os.path.join(ROOT, 'source/src/data/companion2_words.json')))['words']
pid = {}
for w in raw:
    pid[(round(w['s'], 3))] = w['p']
paras = []
for title, ps in SECTIONS:
    ws_ = [w for w in words if pid.get(round(w['s'], 3)) in ps]
    m, sec = divmod(int(ws_[0]['s']), 60)
    paras.append(f"[{m}:{sec:02d}] {title}\n" + ' '.join(w['w'] for w in ws_))
open(os.path.join(ROOT, 'script/companion_v2_transcript.txt'), 'w').write('\n\n'.join(paras) + '\n')
print(len(srt), 'cues;', max(len(l) for s in srt for l in s.split('\n')[2:] if l), 'max chars per line')
