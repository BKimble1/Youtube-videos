#!/usr/bin/env python3
"""Captions from the locked script text (not the ASR transcript), timed to the measured narration words.
Cues break at sentence/clause ends, max 2 lines x 42 characters, 1.0-6.0 s on screen, never before the words start.
    python3 tools/make_srt.py   ->  captions/FGW_AI_Cancer_DigitalTwin.srt"""
import json
W = json.load(open('source/src/data/narration_words.json'))['script_words']
MAXC = 84

def ts(s):
    ms = int(round(s * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); sec, ms = divmod(ms, 1000)
    return f'{h:02}:{m:02}:{sec:02},{ms:03}'

def wrap(text):
    if len(text) <= 42:
        return text
    words = text.split(' '); best = None
    for i in range(1, len(words)):
        a, b = ' '.join(words[:i]), ' '.join(words[i:])
        if len(a) <= 42 and len(b) <= 42:
            sc = abs(len(a) - len(b))
            if best is None or sc < best[0]:
                best = (sc, a + '\n' + b)
    return best[1] if best else text

# sentences first, then balanced splits of long sentences (prefer a comma near the middle)
sents, cur = [], []
for w in W:
    cur.append(w)
    if w['text'].endswith(('.', '?', '?”', '.”', ';', ':')):
        sents.append(cur); cur = []
if cur:
    sents.append(cur)
L = lambda ws: len(' '.join(x['text'] for x in ws))
def split(ws):
    if L(ws) <= MAXC:
        return [ws]
    best = None
    for k in range(2, len(ws) - 1):
        a, b = ws[:k], ws[k:]
        sc = abs(L(a) - L(b)) - (25 if a[-1]['text'].endswith(',') else 0) + (1000 if L(a) > MAXC * 1.3 or L(b) > MAXC * 1.3 else 0)
        if best is None or sc < best[0]:
            best = (sc, k)
    k = best[1]
    return split(ws[:k]) + split(ws[k:])
cues = [c for s_ in sents for c in split(s_)]
# restore the script's em dashes (the word list splits "shrinks—then" into two words)
DASH = [x.split('—') for x in open('production/SCRIPT_LOCKED.txt').read().split() if '—' in x]
def caption_text(c, nxt):
    words = [x['text'] for x in c]
    for a, b in DASH:
        for k in range(len(words)):
            if words[k] == a and k + 1 < len(words) and words[k + 1] == b:
                words[k] = a + '—' + b; words.pop(k + 1); break
            if words[k] == a and k == len(words) - 1 and nxt and nxt[0]['text'] == b:
                words[k] = a + '—'
    return ' '.join(words)
out = []
for k, c in enumerate(cues):
    st = c[0]['start']
    en = c[-1]['end'] + 0.25
    nxt = cues[k + 1][0]['start'] if k + 1 < len(cues) else en + 2
    en = min(max(en, st + 1.0), nxt - 0.04)
    text = caption_text(c, cues[k + 1] if k + 1 < len(cues) else None)
    out.append(f"{k + 1}\n{ts(st)} --> {ts(en)}\n{wrap(text)}\n")
open('captions/FGW_AI_Cancer_DigitalTwin.srt', 'w').write('\n'.join(out))
# check: caption words == locked script words
script = open('production/SCRIPT_LOCKED.txt').read().split()
cap = ' '.join(caption_text(c, cues[k + 1] if k + 1 < len(cues) else None) for k, c in enumerate(cues)).split()
print('cues', len(cues), '| caption words', len(cap), '| script tokens', len(script), '| identical text:', cap == script)
