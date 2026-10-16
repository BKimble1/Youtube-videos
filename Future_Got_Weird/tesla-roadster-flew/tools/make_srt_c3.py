#!/usr/bin/env python3
"""Companion v3 upload captions from the placed narration (source/src/data/companion3_words.json, Scribe timings).
Display spellings follow the script (numbers as figures, product names capitalised). One sentence per caption where it
fits (max 2 lines of 42 characters); longer sentences break at the best comma or the middle. Writes
captions/FGW_Roadster_Companion_REVIEW_v3.srt and script/companion_v3_transcript.txt (plain text)."""
import json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ws = [dict(w) for w in json.load(open(os.path.join(ROOT, 'source/src/data/companion3_words.json')))['words']]
END = 166.5
# sentence punctuation as in the script: a phrase that ends without punctuation ends its sentence; the next word is
# capitalised (Scribe drops the final full stop of each take, and wrote "doing this, then" for "doing THIS. Then,")
for k, w in enumerate(ws):
    last = k + 1 == len(ws) or ws[k + 1]['p'] != w['p']
    if last and not re.search(r'[.,?!…]$', w['w']):
        w['w'] += '.'
    if w['w'] == 'this,' and w['p'] == 'P1':
        w['w'] = 'this.'
    if w['w'] == 'then' and w['p'] == 'P2':
        w['w'] = 'Then,'
for k in range(1, len(ws)):
    if re.search(r'[.?!]$', ws[k - 1]['w']) and ws[k]['w'][:1].islower():
        ws[k]['w'] = ws[k]['w'][:1].upper() + ws[k]['w'][1:]
MERGE = [(['zero', 'point', 'eight', 'one', 'seconds.'], '0.81 seconds.'), (['off', 'center.'], 'off-center.'),
         (['one', 'second'], '1 second')]
SUB = {'Gs.': "g's."}
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
open(os.path.join(ROOT, 'captions/FGW_Roadster_Companion_REVIEW_v3.srt'), 'w').write('\n'.join(srt))
# plain transcript: one paragraph per section, with its start time
SECTIONS = [('Opening', ['P1', 'P2', 'P3', 'P4', 'P5', 'P6']), ('Trick 1: the grip', ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7']),
            ('Leaving the ramp', ['L1', 'L2', 'L3']), ('Trick 2: cold-gas thrust', ['T1', 'T2', 'T3', 'T4', 'T5', 'T6']),
            ('Turning over and landing', ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7']), ('0-60: shown vs claimed', ['A1', 'A2', 'A3', 'A4']),
            ('Three versions', ['S1', 'S2', 'S3', 'S4', 'S5']), ('The catch: air', ['M1', 'M2', 'M3', 'M4', 'M5']),
            ('The answer', ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7'])]
raw = json.load(open(os.path.join(ROOT, 'source/src/data/companion3_words.json')))['words']
pid = {}
for w in raw:
    pid[(round(w['s'], 3))] = w['p']
paras = []
for title, ps in SECTIONS:
    ws_ = [w for w in words if pid.get(round(w['s'], 3)) in ps]
    m, sec = divmod(int(ws_[0]['s']), 60)
    paras.append(f"[{m}:{sec:02d}] {title}\n" + ' '.join(w['w'] for w in ws_))
open(os.path.join(ROOT, 'script/companion_v3_transcript.txt'), 'w').write('\n\n'.join(paras) + '\n')
print(len(srt), 'cues;', max(len(l) for s in srt for l in s.split('\n')[2:] if l), 'max chars per line')
