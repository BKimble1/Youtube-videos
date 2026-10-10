#!/usr/bin/env python3
"""Caption checks: SRT vs timeline words and vs measured speech onset on the narration stem (measurement only)."""
import sys, re, json
sys.path.insert(0, '/home/user/Youtube-videos/Future_Got_Weird/Video_02/qa/v2/review_r2/skeptic/tools')
import numpy as np, vk, ak
SRT = vk.ROOT + '/script/subtitles_v2.srt'
def parse(p):
    out = []
    for blk in open(p, encoding='utf-8').read().strip().split('\n\n'):
        L = blk.strip().split('\n')
        m = re.match(r'(\d+):(\d+):(\d+),(\d+) --> (\d+):(\d+):(\d+),(\d+)', L[1])
        g = list(map(int, m.groups()))
        t0 = g[0]*3600 + g[1]*60 + g[2] + g[3]/1000; t1 = g[4]*3600 + g[5]*60 + g[6] + g[7]/1000
        out.append(dict(n=int(L[0]), t0=t0, t1=t1, lines=L[2:]))
    return out
cues = parse(SRT)
W = [(w['w'], w['from'], w['to'], s['id'], k == 0) for s in vk.TL['segments'] for k, w in enumerate(s['words'])]
norm = lambda s: re.sub(r"[^a-z0-9$']", '', s.lower().replace('’', "'"))
# map cue words to timeline words in order
wi = 0; total = 0; mism = []
for c in cues:
    toks = ' '.join(c['lines']).split()
    c['first'] = wi
    for t in toks:
        if norm(t) != norm(W[wi][0]):
            mism.append((c['n'], t, W[wi][0]))
        wi += 1; total += 1
    c['last'] = wi - 1
# speech envelope: narration stem, 80 Hz highpass, 10 ms windows
x = ak.band(ak.load('nar'), 80, None)
hop = 480
nwin = len(x) // hop
env = 20*np.log10(np.sqrt((x[:nwin*hop].reshape(nwin, hop)**2).mean(1)) + 1e-12)
THR = -50.0
def onset_near(fr_word, fr_prev_end):
    """walk back from the aligned word start while the narration stem is above THR (max 0.5 s);
    the onset is the first window after the last drop below THR. Returns (onset_s, connected)."""
    i = int(round(fr_word/30*100))
    if env[i] < THR:
        for k2 in range(i, i+15):
            if env[k2] >= THR:
                return k2/100, False
        return None, False
    k = i
    while k > i - 50 and env[k-1] >= THR:
        k -= 1
    return k/100, (k == i - 50)
rows = []
for c in cues:
    w0 = W[c['first']]
    prev_end = W[c['first']-1][2] if c['first'] > 0 else None
    on, joined = onset_near(w0[1], prev_end)
    text = ' / '.join(c['lines'])
    dur = c['t1'] - c['t0']
    chars = len(' '.join(c['lines']))
    rows.append(dict(cue=c['n'], text=text, in_s=round(c['t0'], 3), in_frame=round(c['t0']*30, 2),
                     first_word=w0[0], word_from=w0[1], seg=w0[3], seg_start=w0[4],
                     lead_vs_word_frames=round(w0[1] - c['t0']*30, 2),
                     onset_s=on, lead_vs_onset_frames=(round((on - c['t0'])*30, 2) if on is not None else None),
                     onset_runs_into_previous_word=joined,
                     dur=round(dur, 3), cps=round(chars/dur, 2), maxline=max(len(l) for l in c['lines']), nlines=len(c['lines'])))
if __name__ == '__main__':
    print('cues', len(cues), 'srt words', total, 'timeline words', len(W), 'mismatches', mism[:5])
    json.dump(rows, open(vk.ROOT + '/qa/v2/review_r2/skeptic/captions_onsets.json', 'w'), indent=1)
    lv = [r['lead_vs_word_frames'] for r in rows]
    print('lead vs word frames: min %.2f max %.2f' % (min(lv), max(lv)))
    print('max cps', max(r['cps'] for r in rows), 'max line', max(r['maxline'] for r in rows), 'min dur', min(r['dur'] for r in rows), 'max lines', max(r['nlines'] for r in rows))
    ov = [(a['n'], b['n']) for a, b in zip(cues, cues[1:]) if b['t0'] < a['t1']]
    print('overlaps', ov)
    late = [r for r in rows if r['lead_vs_onset_frames'] is not None and r['lead_vs_onset_frames'] < 0]
    print('cues whose in-time is after the measured onset (THR %.0f dBFS, 10 ms):' % THR)
    for r in sorted(late, key=lambda r: r['lead_vs_onset_frames']):
        print('  cue %3d  %-14s seg %s%s  in f%.1f  word f%d  onset %.2fs (f%.1f)  late by %.1f fr %s' % (r['cue'], r['first_word'], r['seg'], ' (seg start)' if r['seg_start'] else '', r['in_frame'], r['word_from'], r['onset_s'], r['onset_s']*30, -r['lead_vs_onset_frames'], '(connected to previous word: no gap within 0.5 s)' if r['onset_runs_into_previous_word'] else ''))
