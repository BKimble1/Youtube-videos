"""Phrase-timed SRT for the V4 film from source/src/v4/data/narr.json (line texts timed by their measured words).
Numbers spoken as words are written as digits. Outputs captions/FGW_Starship_Dual_Catch_V4.srt and
script/v4_narration_final.md (final narration with timecodes, new lines marked)."""
import json, re

ROOT = __file__.rsplit('/tools/', 1)[0]
narr = json.load(open(f'{ROOT}/source/src/v4/data/narr.json'))
DIG = [('twenty twenty-four', '2024'), ('Flight Fifteen', 'Flight 15'), ('Flight six', 'Flight 6'), ('October twentieth', 'October 20')]

cues = []
for l in narr['lines']:
    toks = l['text'].replace('—', '— ').split()
    ws = [w for w in narr['words'] if w['line'] == l['id']]
    # word timings follow the transcript tokens; align by index, folding merged tokens ("too—after")
    tim, j = [], 0
    for t in toks:
        w = ws[min(j, len(ws) - 1)]
        tim.append((w['s'], w['e']))
        if not (t.endswith('—') and '—' in w['w']):
            j += 1
    cur = []
    def flush():
        if cur:
            txt = ' '.join(toks[i] for i in cur).replace('— ', '—')
            for k, v in DIG:
                txt = txt.replace(k, v)
            cues.append([tim[cur[0]][0], tim[cur[-1]][1], txt])
            cur.clear()
    for i, tk in enumerate(toks):
        cur.append(i)
        L = len(' '.join(toks[k] for k in cur))
        if re.search(r'[.?!]$', tk) or (re.search(r'[,:;—]$', tk) and L > 24) or L > 70:
            flush()
    flush()

def wrap(t, n=42):
    if len(t) <= n:
        return t
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
open(f'{ROOT}/captions/FGW_Starship_Dual_Catch_V4.srt', 'w').write('\n'.join(out))
over = [c for c in cues if any(len(x) > 42 for x in wrap(c[2]).split('\n'))]
print(f'{len(cues)} cues; lines over 42 chars: {len(over)}')

md = ['# FGW Starship Dual Catch — V4 final narration', '',
      'Voice: ElevenLabs Test Voice (`kk5XaSLo2XAw0sKM98zU`), `eleven_v4`. **New in V4** = generated for this pass '
      '(audio/v4/picks.json); every other line is the unchanged V2 recording, re-spaced (tools/v4_build_voice.py). '
      f"Narration ends at {narr['lines'][-1]['e']:.2f} s.", '']
for l in narr['lines']:
    m, s = divmod(l['s'], 60)
    tag = ' **(new in V4)**' if l['id'].startswith('N') else ''
    md.append(f"- `{int(m)}:{s:05.2f}` {l['text']}{tag}")
open(f'{ROOT}/script/v4_narration_final.md', 'w').write('\n'.join(md) + '\n')
