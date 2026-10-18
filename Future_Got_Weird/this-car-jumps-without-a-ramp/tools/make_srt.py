#!/usr/bin/env python3
"""Upload captions from the stitched narration. The displayed words are the script's (script/script_v1.md, display
spellings and punctuation); the timings are the Scribe word times of the selected takes, which matched the script word
for word (audio/narration/take_scores.json). Channel caption style (as the Roadster companion): one sentence per
caption where it fits, at most 2 lines of 42 characters; longer sentences break at a comma/colon, else the middle.
Writes captions/FGW_U9_JumpsWithoutRamp.srt and script/transcript_v1.txt."""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAXL, MAXC = 42, 84


def script_tokens():
    text = open(os.path.join(ROOT, 'script/script_v1.md')).read()
    toks = []
    for m in re.finditer(r'^## (B\d) .*?\n\n> (.*?)$', text, re.M | re.S):
        toks += [(m.group(1).lower(), t) for t in m.group(2).split()]
    return toks


def wrap(text):
    if len(text) <= MAXL:
        return text
    words = text.split()
    best = None
    for k in range(1, len(words)):
        a, b = ' '.join(words[:k]), ' '.join(words[k:])
        if len(a) <= MAXL and len(b) <= MAXL:
            score = abs(len(a) - len(b))
            best = min(best, (score, a, b)) if best else (score, a, b)
    return f'{best[1]}\n{best[2]}' if best else text


def ts(t):
    ms = int(round(t * 1000))
    return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'


def main():
    data = json.load(open(os.path.join(ROOT, 'audio/narration/narration_words.json')))
    words = data['words']
    toks = script_tokens()
    assert len(toks) == len(words), (len(toks), len(words))
    norm = lambda s: re.sub(r"[^a-z0-9']", '', s.lower().replace('’', "'"))
    for (b, t), w in zip(toks, words):
        assert b == w['block'] and norm(t) == norm(w['text']), (t, w)
        w['disp'] = t
    # sentences
    sents, cur = [], []
    for w in words:
        cur.append(w)
        if re.search(r'[.?!]$', w['disp']):
            sents.append(cur)
            cur = []
    if cur:
        sents.append(cur)
    # split long sentences at a comma/colon nearest the middle, else at the middle word
    def split(ws):
        text = ' '.join(x['disp'] for x in ws)
        if len(text) <= MAXC and wrap(text).count('\n') <= 1 and all(len(l) <= MAXL for l in wrap(text).split('\n')):
            return [ws]
        cands = [k for k in range(1, len(ws)) if re.search(r'[,:;]$', ws[k - 1]['disp'])]
        mid = len(ws) / 2
        k = min(cands, key=lambda c: abs(c - mid)) if cands else int(mid)
        return split(ws[:k]) + split(ws[k:])
    cues = [c for s in sents for c in split(s)]
    out, plain = [], []
    for i, c in enumerate(cues):
        start = c[0]['start'] - 0.05
        end = c[-1]['end'] + 0.25
        if i + 1 < len(cues):
            end = min(end, cues[i + 1][0]['start'] - 0.06)
        end = max(end, start + 1.0) if i + 1 == len(cues) or start + 1.0 < cues[i + 1][0]['start'] - 0.06 else end
        text = wrap(' '.join(x['disp'] for x in c))
        out.append(f'{i + 1}\n{ts(max(0, start))} --> {ts(end)}\n{text}\n')
        plain.append(' '.join(x['disp'] for x in c))
    os.makedirs(os.path.join(ROOT, 'captions'), exist_ok=True)
    open(os.path.join(ROOT, 'captions/FGW_U9_JumpsWithoutRamp.srt'), 'w').write('\n'.join(out))
    open(os.path.join(ROOT, 'script/transcript_v1.txt'), 'w').write(' '.join(plain) + '\n')
    print(f'{len(cues)} captions; longest line {max(len(l) for o in out for l in o.splitlines()[2:])} chars')


if __name__ == '__main__':
    main()
