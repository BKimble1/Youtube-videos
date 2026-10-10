#!/usr/bin/env python3
"""Captions check: subtitles_v2.srt against script_v2.json, SCRIPT_V2 lines and timeline word frames."""
import json, re, sys
sys.path.insert(0, __import__('os').path.dirname(__file__))
from common import V, OUT, timeline

def parse_srt(p):
    blocks = open(p, encoding='utf-8').read().strip().split('\n\n')
    cues = []
    for b in blocks:
        L = b.strip().split('\n')
        n = int(L[0]); a, z = L[1].split(' --> ')
        def ts(s):
            h, m, r = s.split(':'); sec, ms = r.split(',')
            return int(h) * 3600 + int(m) * 60 + int(sec) + int(ms) / 1000
        cues.append(dict(n=n, a=ts(a), b=ts(z), lines=L[2:]))
    return cues

def norm(w):
    return re.sub(r"[^a-z0-9'’]", '', w.lower()).replace('’', "'")

cues = parse_srt(V + '/script/subtitles_v2.srt')
tl = timeline()
script = json.load(open(V + '/v2/script_v2.json'))['lines']
# 1. word-for-word
srt_tokens = [w for c in cues for l in c['lines'] for w in l.split()]
scr_tokens = [w for ln in script for w in ln['text'].split()]
tl_tokens = [w for g in tl['segments'] for w in g['text'].split()]
tlw_tokens = [w['w'] for g in tl['segments'] for w in g['words']]
def diff(a, b, name):
    import difflib
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    d = [(op, a[i1:i2], b[j1:j2]) for op, i1, i2, j1, j2 in sm.get_opcodes() if op != 'equal']
    return dict(compare=name, n_a=len(a), n_b=len(b), differences=d)
res = {'word_for_word': [diff(srt_tokens, scr_tokens, 'srt vs script_v2.json (exact tokens, punctuation and case)'),
                         diff(srt_tokens, tl_tokens, 'srt vs timeline segment text (exact)'),
                         diff(srt_tokens, tlw_tokens, 'srt vs timeline aligned words (exact)')]}
# script ids/order vs timeline
res['script_ids_vs_timeline'] = [ln['id'] for ln in script] == [g['id'] for g in tl['segments']]
res['script_text_vs_timeline_text'] = [ (ln['id']) for ln, g in zip(script, tl['segments']) if ln['text'] != g['text']]
# 2. map cues to words
words = [(g['id'], i, w) for g in tl['segments'] for i, w in enumerate(g['words'])]
k = 0
rows = []
for c in cues:
    toks = [w for l in c['lines'] for w in l.split()]
    ws = words[k:k + len(toks)]
    assert [norm(t) for t in toks] == [norm(w[2]['w']) for w in ws], (c['n'], toks, [w[2]['w'] for w in ws])
    k += len(toks)
    segs = sorted(set(w[0] for w in ws), key=lambda s: [g['id'] for g in tl['segments']].index(s))
    first = ws[0][2]; last = ws[-1][2]
    seg = next(g for g in tl['segments'] if g['id'] == ws[0][0])
    text = ' '.join(c['lines'])
    dur = c['b'] - c['a']
    nchar = len(text)
    a_f = c['a'] * 30
    rows.append(dict(n=c['n'], start=round(c['a'], 3), end=round(c['b'], 3), start_frame=round(a_f, 2), dur=round(dur, 3),
                     text=c['lines'], segs=segs, first_word=first['w'], first_word_frame=first['from'],
                     seg_from=seg['from'] if ws[0][1] == 0 else None,
                     lead_frames=round(first['from'] - a_f, 2),
                     last_word=last['w'], last_word_end_frame=last['to'], out_after_last_word_end_frames=round(c['b'] * 30 - last['to'], 2),
                     max_line=max(len(l) for l in c['lines']), n_lines=len(c['lines']), chars=nchar,
                     cps=round(nchar / dur, 2), ends_punct=bool(re.search(r"[.?!:;,]['\"’”]?$", text)),
                     line1_ends_punct=(bool(re.search(r"[.?!:;,]$", c['lines'][0])) if len(c['lines']) > 1 else None)))
res['n_cues'] = len(cues)
res['all_words_mapped'] = k == len(words)
# overlaps / gaps
res['overlaps'] = [(a['n'], b['n']) for a, b in zip(cues, cues[1:]) if b['a'] < a['b']]
res['cues'] = rows
leads = [r['lead_frames'] for r in rows]
import statistics
res['lead_frames_summary'] = dict(min=min(leads), max=max(leads), median=statistics.median(leads),
                                  outside_1_to_3=[(r['n'], r['lead_frames'], r['first_word']) for r in rows if not (1 <= r['lead_frames'] <= 3)])
res['line_over_42'] = [(r['n'], r['max_line']) for r in rows if r['max_line'] > 42]
res['over_2_lines'] = [r['n'] for r in rows if r['n_lines'] > 2]
res['cps_over_20'] = [(r['n'], r['cps'], r['text']) for r in rows if r['cps'] > 20]
res['cps_over_17'] = [(r['n'], r['cps']) for r in rows if r['cps'] > 17]
res['cues_spanning_segments'] = [(r['n'], r['segs'], r['text']) for r in rows if len(r['segs']) > 1]
res['cue_ends_without_punct'] = [(r['n'], r['text'], next((x['text'] for x in rows if x['n'] == r['n'] + 1), None)) for r in rows if not r['ends_punct']]
res['line_breaks_without_punct'] = [(r['n'], r['text']) for r in rows if r['line1_ends_punct'] is False]
res['short_cues_under_1s'] = [(r['n'], r['dur'], r['text']) for r in rows if r['dur'] < 1.0]
res['cue_out_before_last_word_end'] = [(r['n'], r['out_after_last_word_end_frames'], r['last_word']) for r in rows if r['out_after_last_word_end_frames'] < 0]
json.dump(res, open(OUT + '/srt_check.json', 'w'), indent=1, ensure_ascii=False)
for key in ['n_cues', 'all_words_mapped', 'script_ids_vs_timeline', 'script_text_vs_timeline_text', 'overlaps', 'lead_frames_summary', 'line_over_42', 'over_2_lines', 'cps_over_20', 'cps_over_17', 'cues_spanning_segments', 'short_cues_under_1s', 'cue_out_before_last_word_end']:
    print(key, ':', json.dumps(res[key], ensure_ascii=False))
for d in res['word_for_word']:
    print(d['compare'], d['n_a'], d['n_b'], 'differences:', d['differences'][:20])
print('cue ends without punctuation:')
for x in res['cue_ends_without_punct']: print('  ', x)
print('line breaks without punctuation:')
for x in res['line_breaks_without_punct']: print('  ', x)
