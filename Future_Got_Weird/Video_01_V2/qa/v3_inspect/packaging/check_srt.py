#!/usr/bin/env python3
"""Check an SRT against the narration word timings (read-only).
Usage: python3 check_srt.py <project root containing tools/build_timeline.py> <file.srt>
Reports text mismatches, IPA/tags, start after first word, end before last word, overlaps, >2 lines, lines >42,
cps >17 (>20 flagged separately), duration <1 s or >7 s, and cues spanning two narration segments."""
import sys, re, json, importlib.util
root = sys.argv[1]; srt_path = sys.argv[2]
spec = importlib.util.spec_from_file_location("bt", root + "/tools/build_timeline.py")
bt = importlib.util.module_from_spec(spec); spec.loader.exec_module(bt)
# never write: build_timeline.main() opens script/subtitles_<engine>.srt for writing in --srt-only mode, so every
# write-mode open inside the module is redirected to /dev/null (this checker only reads)
import builtins, os as _os
def _safe_open(f, mode='r', *a, **k):
    if any(c in mode for c in 'wax+'):
        return builtins.open(_os.devnull, 'w', *a[1:], **{kk: vv for kk, vv in k.items() if kk != 'newline'})
    return builtins.open(f, mode, *a, **k)
bt.open = _safe_open
cap = {}
orig = bt.build_srt
def wrap(segs, **kw):
    cap['segs'] = segs
    return orig(segs, **kw)
bt.build_srt = wrap
sys.argv = ["x", "--engine", "v2", "--srt-only"]
import io, contextlib
with contextlib.redirect_stdout(io.StringIO()):
    bt.main()
segs = cap['segs']
words = []
for s in segs:
    for w in s['words_abs']:
        words.append(dict(word=w['word'], start=w['start'], end=w['end'], seg=s['id']))
def ts(x):
    h,m,r = x.split(':'); s,ms = r.split(',')
    return int(h)*3600+int(m)*60+int(s)+int(ms)/1000
blocks = open(srt_path, encoding='utf-8').read().strip().split('\n\n')
cues = []
for b in blocks:
    ls = b.split('\n')
    n = int(ls[0]); a,bb = ls[1].split(' --> ')
    cues.append(dict(n=n, a=ts(a), b=ts(bb), lines=ls[2:]))
wi = 0
probs = []
stats = []
for i,c in enumerate(cues):
    text = ' '.join(c['lines'])
    toks = text.split()
    cw = words[wi:wi+len(toks)]
    if [w['word'] for w in cw] != toks:
        probs.append((c['n'], 'TEXT MISMATCH', text, ' '.join(w['word'] for w in cw)))
    wi += len(toks)
    if re.search(r"[\[\]/ˈəɪ]", text): probs.append((c['n'],'IPA/TAG', text))
    dur = c['b']-c['a']
    nchar = len(text)
    cps = nchar/dur
    segsin = sorted(set(w['seg'] for w in cw), key=lambda x:x)
    if c['a'] > cw[0]['start'] + 0.0005: probs.append((c['n'],'START AFTER FIRST WORD', round(c['a'],3), round(cw[0]['start'],3)))
    if c['b'] < cw[-1]['end'] - 0.0005: probs.append((c['n'],'END BEFORE LAST WORD', round(c['b'],3), round(cw[-1]['end'],3)))
    if i+1 < len(cues) and c['b'] > cues[i+1]['a']: probs.append((c['n'],'OVERLAP'))
    if len(c['lines'])>2: probs.append((c['n'],'>2 LINES'))
    for l in c['lines']:
        if len(l)>42: probs.append((c['n'],'LINE>42', len(l), l))
    if cps>17: probs.append((c['n'],'CPS>17' if cps<=20 else 'CPS>20', round(cps,1), round(dur,2), text))
    if dur < 1.0: probs.append((c['n'],'DUR<1.0s', round(dur,3), text))
    if dur > 7: probs.append((c['n'],'DUR>7s', round(dur,2)))
    if len(segsin)>1: probs.append((c['n'],'SPANS SEGMENTS', segsin, text))
    lead = cw[0]['start']-c['a']; tail = c['b']-cw[-1]['end']
    stats.append((c['n'], round(c['a'],3), round(c['b'],3), round(dur,2), nchar, round(cps,1), round(lead,3), round(tail,3), segsin, text))
if wi != len(words): probs.append(('ALL','WORD COUNT', wi, len(words)))
print('cues', len(cues), 'words', len(words))
import statistics
print('mean cps', round(statistics.mean(s[5] for s in stats),1), 'max cps', max(s[5] for s in stats))
print('max line len', max(len(l) for c in cues for l in c['lines']))
print('min dur', min(s[3] for s in stats), 'max dur', max(s[3] for s in stats))
print('PROBLEMS:')
for p in probs: print(' ', p)
if '-v' in sys.argv[3:]:
    for s in stats: print(s)
