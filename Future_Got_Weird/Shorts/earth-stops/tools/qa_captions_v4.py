#!/usr/bin/env python3
"""Caption timing check of the V4 film against the narration's word times (Test Voice take A placed on the film timeline: source/src/film4/voice4.json, Scribe word starts, ends capped at the energy-segmented speech groups)
and the SRT export. For every cue in source/src/film3/timeline4.ts (dumped by tools/build_cues_v4.mjs): its first word's start and last word's end, the cue's own start/end and the differences.
A positive start_late means the caption is read late; a negative end_margin means it disappears before the word ends. The SRT never overlaps (each cue ends 1 ms before the next starts) and has single spaces only.
Writes qa/v7/CAPTION_SYNC.json, exports/v7/FGW_EarthStops_V4_Captions.srt. Usage: python3 tools/qa_captions_v4.py"""
import json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30
V = json.load(open(f'{ROOT}/source/src/film4/voice4.json'))
cues = json.load(open(f'{ROOT}/audio/v7/cues_v4.json'))['captions']
norm = lambda t: re.sub(r"[^a-z0-9']", '', t.lower().replace('’', "'"))
toks = []
for w in V['words']:
    parts = [p for p in re.split(r'—', w['text'])]
    if len(parts) == 1:
        toks.append({'t': norm(w['text']), 's': w['start'], 'e': w['end']})
    else:  # an em-dash token is two words with one start: the second starts after the first's group ends
        toks.append({'t': norm(parts[0]), 's': w['start'], 'e': w['end']})
        if norm(parts[1]): toks.append({'t': norm(parts[1]), 's': w['start'] + 0.6, 'e': w['end']})
for i, k in enumerate(toks):
    if i + 1 < len(toks): k['e'] = min(k['e'], toks[i + 1]['s'])
for k in toks:
    for g0, g1 in V['groups']:
        if g0 - 0.05 <= k['s'] <= g1: k['e'] = min(k['e'], g1); break
rows, ptr = [], 0
for c in cues:
    ct = [x for x in (norm(w) for w in c['text'].replace('—', ' ').split()) if x]
    j = ptr; first = last = None
    for t in ct:
        while j < len(toks) and toks[j]['t'] != t: j += 1
        if j >= len(toks): break
        if first is None: first = toks[j]
        last = toks[j]; j += 1
    if first is None or last is None:
        rows.append({'text': c['text'], 'error': 'no match'}); continue
    ptr = j
    fa, fb = c['a'], c['b']
    rows.append({'text': c['text'], 'cue_start_frame': fa, 'cue_end_frame': fb, 'cue_start_s': round(fa / FPS, 3), 'cue_end_s': round((fb + 1) / FPS, 3), 'first_word': first['t'], 'first_word_start_s': round(first['s'], 3), 'last_word': last['t'], 'last_word_end_s': round(last['e'], 3),
                 'start_late_ms': round(1000 * (fa / FPS - first['s'])), 'end_margin_ms': round(1000 * ((fb + 1) / FPS - last['e'])), 'dy_px': c['dy']})
os.makedirs(f'{ROOT}/qa/v7', exist_ok=True); os.makedirs(f'{ROOT}/exports/v7', exist_ok=True)
json.dump(rows, open(f'{ROOT}/qa/v7/CAPTION_SYNC.json', 'w'), indent=1, ensure_ascii=False)
ok = [r for r in rows if 'error' not in r]
print(f'{len(ok)}/{len(rows)} cues matched')
for r in ok:
    flag = '' if abs(r['start_late_ms']) <= 150 and r['end_margin_ms'] >= -100 else '   <-- check'
    print(f"{r['cue_start_s']:6.2f}-{r['cue_end_s']:6.2f}  late {r['start_late_ms']:5d} ms  end margin {r['end_margin_ms']:5d} ms  {r['text']!r}{flag}")
def ts(sec):
    ms = int(round(sec * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'
ends = [(r['cue_end_s'] if i + 1 >= len(ok) else min(r['cue_end_s'], ok[i + 1]['cue_start_s'] - 0.001)) for i, r in enumerate(ok)]
with open(f'{ROOT}/exports/v7/FGW_EarthStops_V4_Captions.srt', 'w') as fh:
    for i, r in enumerate(ok):
        fh.write(f"{i + 1}\n{ts(r['cue_start_s'])} --> {ts(ends[i])}\n{re.sub(r'  +', ' ', r['text']).strip()}\n\n")
# SRT self-check: no overlap, no double space, sorted
txt = open(f'{ROOT}/exports/v7/FGW_EarthStops_V4_Captions.srt').read()
blocks = [b.split('\n') for b in txt.strip().split('\n\n')]
tt = [re.findall(r'(\d+):(\d+):(\d+),(\d+)', b[1]) for b in blocks]
sec = lambda q: int(q[0]) * 3600 + int(q[1]) * 60 + int(q[2]) + int(q[3]) / 1000
spans = [(sec(a[0]), sec(a[1])) for a in tt]
print('SRT cues', len(spans), '| overlaps:', sum(1 for i in range(len(spans) - 1) if spans[i][1] > spans[i + 1][0]), '| double spaces:', len(re.findall(r'  ', txt)), '| shortest cue ms:', round(1000 * min(b - a for a, b in spans)))
