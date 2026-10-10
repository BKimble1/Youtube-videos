#!/usr/bin/env python3
"""Caption in/out times against the narration stem's measured speech onsets and offsets (energy envelope, 10 ms hop)."""
import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
import numpy as np
from common import *
v = load('voice')
hop = int(0.01 * SR); win = int(0.02 * SR)
n = (len(v) - win) // hop
env = np.array([db(v[i * hop:i * hop + win]) for i in range(n)])
TH = -45.0
def t2i(t): return int(round(t / 0.01))
chk = json.load(open(OUT + '/srt_check.json'))
rows = []
for c in chk['cues']:
    tw = c['first_word_frame'] / 30
    lo, hi = t2i(tw - 0.45), t2i(tw + 0.3)
    onset = None; cont = False
    # quiet run of >= 150 ms followed by a crossing
    for i in range(lo, hi):
        if env[i] >= TH and np.all(env[max(0, i - 15):i] < TH):
            onset = i * 0.01; break
    if onset is None:
        cont = bool(np.any(env[t2i(tw - 0.15):t2i(tw)] >= TH))
    # offset of the last word
    # find words
    rows.append(dict(n=c['n'], text=' / '.join(c['text']), start=c['start'], end=c['end'], first_word=c['first_word'],
                     word_frame=c['first_word_frame'],
                     onset=None if onset is None else round(onset, 3),
                     lead_vs_onset_frames=None if onset is None else round((onset - c['start']) * 30, 2),
                     lead_vs_wordframe=c['lead_frames'], continuous=cont))
# offsets: for cues whose last word ends a sentence or precedes a pause: find when speech stops after the last word starts
tl = timeline()
words = [(g['id'], w) for g in tl['segments'] for w in g['words']]
k = 0
for r, c in zip(rows, chk['cues']):
    nt = sum(len(l.split()) for l in c['text'])
    last = words[k + nt - 1][1]; k += nt
    i0 = t2i(last['from'] / 30)
    off = None
    for i in range(i0, i0 + 150):
        if np.all(env[i:i + 15] < TH):
            off = i * 0.01; break
    r['last_word'] = last['w']; r['speech_off'] = None if off is None else round(off, 3)
    r['out_minus_speech_off_frames'] = None if off is None else round((c['end'] - off) * 30, 2)
json.dump(rows, open(OUT + '/srt_vs_speech.json', 'w'), indent=1, ensure_ascii=False)
L = [r['lead_vs_onset_frames'] for r in rows if r['lead_vs_onset_frames'] is not None]
print('cues with a measurable onset after quiet:', len(L), 'lead frames (onset - caption in): min', min(L), 'median', float(np.median(L)), 'max', max(L))
print('captions that come in AFTER the measured onset (lead < 0):', [(r['n'], r['lead_vs_onset_frames'], r['first_word']) for r in rows if r['lead_vs_onset_frames'] is not None and r['lead_vs_onset_frames'] < 0])
print('captions that come in more than 4 frames before onset:', [(r['n'], r['lead_vs_onset_frames'], r['first_word']) for r in rows if r['lead_vs_onset_frames'] is not None and r['lead_vs_onset_frames'] > 4])
print('no clean onset (continuous speech at cue boundary):', [(r['n'], r['first_word']) for r in rows if r['onset'] is None])
O = [(r['n'], r['out_minus_speech_off_frames'], r['last_word']) for r in rows if r['out_minus_speech_off_frames'] is not None]
print('caption out vs speech offset of last word (frames, + = stays after): min', min(o[1] for o in O), 'median', float(np.median([o[1] for o in O])))
print('captions that go out before the last word stops sounding:', [o for o in O if o[1] < 0])
