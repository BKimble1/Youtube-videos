#!/usr/bin/env python3
"""Caption timing check of the V1 film against the narration's word alignment (Scribe word times, audio/v4/voice/v1_takeA_alignment.json) and an SRT export.
For every cue in source/src/film/timeline.ts: its first word's start and last word's end from the alignment, the cue's own start/end, and the differences.
A caption that starts after its first word (positive 'start_late') is read late; one that ends before the last word ends (negative 'end_margin') disappears early.
Writes qa/v4/CAPTION_SYNC.json, exports/v4/FGW_EarthStops_V1_Captions.srt. Usage: python3 tools/qa_captions_v1.py"""
import json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30
al = json.load(open(f'{ROOT}/audio/v4/voice/v1_takeA_alignment.json'))['words']
# tokens with start/end (em-dash words are split; times for the second half come from the energy segmentation)
OVR = {'stopped—right': [('stopped', 0.72, 1.21), ('right', 1.57, 2.17)], 'slower—but': [('slower', 19.2, 19.56), ('but', 19.96, 20.1)]}
toks = []
for w in al:
    t = w['text']
    if t in OVR:
        toks += [{'t': a, 's': s, 'e': e} for a, s, e in OVR[t]]
    else:
        toks.append({'t': re.sub(r"[^a-z0-9’']", '', t.lower().replace('’', "'")), 's': w['start'], 'e': w['end']})
for i, k in enumerate(toks):
    k['t'] = re.sub(r"[^a-z0-9']", '', k['t'].lower().replace('’', "'"))
    if i + 1 < len(toks): k['e'] = min(k['e'], toks[i + 1]['s'])
# speech groups from the energy segmentation of the take (gaps < 60 ms merged; see the V1 report): Scribe word ENDS run into the following pause, so a word's end is capped at its group's end
GROUPS = [[0.04, 1.21], [1.56, 2.23], [2.81, 5.68], [6.08, 7.18], [7.66, 8.44], [8.51, 8.86], [8.92, 9.9], [10.36, 11.21], [11.38, 11.51], [11.6, 12.14], [12.2, 13.03], [13.11, 13.79], [14.38, 16.01], [16.34, 17.2], [17.66, 18.83], [18.91, 19.56],
          [19.96, 20.44], [20.51, 21.51], [21.7, 24.1], [24.63, 25.96], [26.46, 27.91], [28.37, 29.15], [29.34, 31.72], [31.79, 32.46], [32.9, 33.94]]
for k in toks:
    for g0, g1 in GROUPS:
        if g0 - 0.05 <= k['s'] <= g1: k['e'] = min(k['e'], g1); break
src = open(f'{ROOT}/source/src/film/timeline.ts').read()
fs = lambda sec: round(sec * FPS)
words_t = {}
for m in re.finditer(r"(\w+): ([\d.]+)", src.split('export const WORD = {')[1].split('};')[0]): words_t[m.group(1)] = float(m.group(2))
cues = re.findall(r"\{a: ([^,]+), b: ([^,]+), lines: (\[\[.*?\]\])(?:, lane: '\w+')?\},", src)
rows, ptr = [], 0
for a, b, lines in cues:
    ev = lambda x: eval(re.sub(r'fs\(([\d.]+)\)', lambda mm: str(fs(float(mm.group(1)))), x))
    fa, fb = ev(a), ev(b)
    parts = re.split(r"\]\],\s*\[\[", lines.strip('[]'))
    text = ' '.join(''.join(re.findall(r"'((?:[^'\\]|\\.)*)'", p)) for p in parts)
    cue_toks = [re.sub(r"[^a-z0-9']", '', w.lower().replace('’', "'")) for w in text.replace('—', ' ').split()]
    cue_toks = [c for c in cue_toks if c]
    # sequential match
    j = ptr; first = None; last = None
    for ct in cue_toks:
        while j < len(toks) and toks[j]['t'] != ct: j += 1
        if j >= len(toks): break
        if first is None: first = toks[j]
        last = toks[j]; j += 1
    if first is None or last is None:
        rows.append({'text': text, 'cue_start_s': fa / FPS, 'cue_end_s': fb / FPS, 'error': 'no match'}); continue
    ptr = j
    rows.append({'text': text, 'cue_start_frame': fa, 'cue_end_frame': fb, 'cue_start_s': round(fa / FPS, 3), 'cue_end_s': round(fb / FPS, 3), 'first_word': first['t'], 'first_word_start_s': round(first['s'], 3), 'last_word': last['t'], 'last_word_end_s': round(last['e'], 3),
                 'start_late_ms': round(1000 * (fa / FPS - first['s'])), 'end_margin_ms': round(1000 * (fb / FPS - last['e']))})
json.dump(rows, open(f'{ROOT}/qa/v4/CAPTION_SYNC.json', 'w'), indent=1, ensure_ascii=False)
ok = [r for r in rows if 'error' not in r]
print(f'{len(ok)}/{len(rows)} cues matched')
for r in ok:
    flag = '' if abs(r['start_late_ms']) <= 150 and r['end_margin_ms'] >= -100 else '   <-- check'
    print(f"{r['cue_start_s']:6.2f}-{r['cue_end_s']:6.2f}  late {r['start_late_ms']:5d} ms  end margin {r['end_margin_ms']:5d} ms  {r['text']!r}{flag}")
# SRT
def ts(sec):
    h = int(sec // 3600); m = int(sec % 3600 // 60); s = sec % 60
    return f'{h:02d}:{m:02d}:{int(s):02d},{int(round((s - int(s)) * 1000)):03d}'
os.makedirs(f'{ROOT}/exports/v4', exist_ok=True)
with open(f'{ROOT}/exports/v4/FGW_EarthStops_V1_Captions.srt', 'w') as fh:
    for i, r in enumerate(ok):
        fh.write(f"{i + 1}\n{ts(r['cue_start_s'])} --> {ts(r['cue_end_s'])}\n{r['text']}\n\n")
