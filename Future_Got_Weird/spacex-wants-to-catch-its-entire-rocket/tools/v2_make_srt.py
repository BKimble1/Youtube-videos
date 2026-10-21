"""Phrase-timed SRT for the V2 film: the script's own wording (script/v2_narration.json), timed by the measured word
times on the film timeline (source/src/v2/data/narr.json). Numbers spoken as words are written as digits.
Output: captions/FGW_Starship_Dual_Catch_V2.srt and script/v2_narration_final.md (text + timecodes)."""
import json, re, difflib

ROOT = __file__.rsplit('/tools/', 1)[0]
script = json.load(open(f'{ROOT}/script/v2_narration.json'))
narr = json.load(open(f'{ROOT}/source/src/v2/data/narr.json'))
words = narr['words']

text = ' '.join(re.sub(r'\[[^\]]+\]\s*', '', s['prompt']) for s in script['sections'])
text = text.replace('—', '— ')
toks = text.split()
norm = lambda w: re.sub(r'[^a-z0-9]', '', w.lower().replace('re-entry', 'reentry'))
a = [norm(t) for t in toks]
b = [norm(w['w']) for w in words]
sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
tim = [None] * len(toks)
for blk in sm.get_matching_blocks():
    for k in range(blk.size):
        tim[blk.a + k] = (words[blk.b + k]['s'], words[blk.b + k]['e'])
# fill unmatched tokens (e.g. split/merged hyphenations) by interpolation
for i, t in enumerate(tim):
    if t is None:
        prev = next((tim[j] for j in range(i - 1, -1, -1) if tim[j]), (0, 0))
        nxt = next((tim[j] for j in range(i + 1, len(tim)) if tim[j]), prev)
        tim[i] = (prev[1], max(prev[1] + 0.05, nxt[0]))
unmatched = sum(1 for blk in [0] for _ in [])

DIG = [('twenty twenty-four', '2024'), ('Flight Fifteen', 'Flight 15'), ('Flight Six', 'Flight 6')]
cues, cur = [], []
def flush():
    if not cur: return
    s, e = tim[cur[0]][0], tim[cur[-1]][1]
    txt = ' '.join(toks[i] for i in cur).replace('— ', '—')
    for k, v in DIG:
        txt = txt.replace(k, v)
    cues.append([s, e, txt])
    cur.clear()
for i, tk in enumerate(toks):
    cur.append(i)
    L = len(' '.join(toks[j] for j in cur))
    end_sent = re.search(r'[.?!]$', tk)
    soft = re.search(r'[,:;—]$', tk) and L > 24
    gap = i + 1 < len(toks) and tim[i + 1][0] - tim[i][1] > 0.45
    if end_sent or soft or gap or L > 70:
        flush()
flush()

def wrap(t, n=42):
    if len(t) <= n: return t
    best = min((abs(len(t[:k]) - len(t[k + 1:])), k) for k in [m.start() for m in re.finditer(' ', t)] if len(t[:k]) <= n and len(t[k + 1:]) <= n)
    return t[:best[1]] + '\n' + t[best[1] + 1:]
def ts(x):
    ms = int(round(x * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'
out = []
for k, (s, e, t) in enumerate(cues):
    nxt = cues[k + 1][0] if k + 1 < len(cues) else e + 2
    e2 = min(max(e + 0.25, s + 0.9), nxt - 0.04)
    out.append(f'{k + 1}\n{ts(s)} --> {ts(e2)}\n{wrap(t)}\n')
open(f'{ROOT}/captions/FGW_Starship_Dual_Catch_V2.srt', 'w').write('\n'.join(out))
over = [c for c in cues if any(len(l) > 42 for l in wrap(c[2]).split('\n'))]
print(f'{len(cues)} cues, {len(toks)} words; lines over 42 chars: {len(over)}')

# final narration text with section timecodes
md = ['# FGW Starship Dual Catch — V2 final narration', '',
      f"Voice: ElevenLabs Test Voice (`{script['voice_id']}`), `{script['model']}`, flow `{script['flow']}`. Timecodes are the measured film timeline; "
      f"spoken narration ends at {narr['sections'][-1]['e']:.2f} s, film length {narr['duration'] + 1.4:.1f} s. Bracketed direction tags were "
      'generation instructions only, not spoken.', '']
for s in script['sections']:
    sec = next(x for x in narr['sections'] if x['id'] == s['id'])
    m, sec_s = divmod(sec['s'], 60)
    md += [f"## {s['title']} — {int(m)}:{sec_s:05.2f}", '', re.sub(r'\[[^\]]+\]\s*', '', s['prompt']), '']
open(f'{ROOT}/script/v2_narration_final.md', 'w').write('\n'.join(md))
