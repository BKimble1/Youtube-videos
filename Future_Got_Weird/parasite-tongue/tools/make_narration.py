#!/usr/bin/env python3
"""Chosen take -> narration master (48 kHz, 24-bit, mono), word timeline (source/src/data/timeline.json), SRT.
The take's speech is untouched (no splice inside a word, no time-stretch, no pitch change). The read is 20.6 s and the
brief asks for 24-27 s with no long empty pauses, so a few sentence-end beats are lengthened a little by repeating the
take's own room silence (below -45 dBFS) in the middle of the gap, with 10 ms crossfades. Every gap stays <= 0.66 s.
Word times: tools/align_zipformer.py (Zipformer token timestamps snapped to measured onsets), shifted by the inserts."""
import json, subprocess, hashlib, sys, os
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import ROOT

SR, FPS = 48000, 30
TAKE = 'audio/narration/takes/t1_pGZq.mp3'
ALIGN = 'audio/narration/takes/t1_pGZq_zipformer.json'
DURATION = 24.0
os.chdir(ROOT)
y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', TAKE, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32).copy()
words = json.load(open(ALIGN))['words']
# target gap (s) after these words (index into the word list, so repeated words are unambiguous)
idx = lambda w, n=0: [k for k, x in enumerate(words) if x['word'] == w][n]
TARGET = {idx('tongue.', 0): 0.50, idx('blood.'): 0.58, idx('away.'): 0.66, idx('part.'): 0.62, idx('tongue.', 1): 0.60}
XF = int(0.010 * SR)
ins = []  # (take time, seconds inserted)
segs, last = [], 0
for k in sorted(TARGET):
    a, b = words[k]['end'], words[k + 1]['start']
    add = TARGET[k] - (b - a)
    if add <= 0: continue
    m = (a + b) / 2
    gap = y[int((m - 0.05) * SR):int((m + 0.05) * SR)]
    assert 20 * np.log10(np.sqrt((gap ** 2).mean()) + 1e-9) < -45, words[k]['word']
    n = int(add * SR)
    fill = np.resize(gap, n + 2 * XF)  # tiled room tone
    i = int(m * SR)
    segs.append(y[last:i])
    f = np.linspace(0, 1, XF, dtype=np.float32)
    fill[:XF] *= f; fill[-XF:] *= f[::-1]
    pre = segs[-1]; pre[-XF:] = pre[-XF:] * f[::-1] + fill[:XF]
    segs.append(fill[XF:-XF])
    post = y[i:i + XF].copy(); post = post * f + fill[-XF:]
    segs.append(post)
    last = i + XF
    ins.append((m, n / SR, words[k]['word'], round(b - a, 3), TARGET[k]))
segs.append(y[last:])
z = np.concatenate(segs)
def shift(t): return round(t + sum(d for m, d, *_ in ins if t > m), 3)
W = [{'word': w['word'], 'start': shift(w['start']), 'end': shift(w['end'])} for w in words]
N = int(round(DURATION * SR))
pad = np.zeros(N, np.float32); pad[:min(N, len(z))] = z[:N]
wav = 'audio/narration/FGW_Parasite_Tongue_narration.wav'
sf.write(wav, pad, SR, subtype='PCM_24')
# captions (sentence chunks) for the SRT only; nothing is burned in
CH = [7, 6, 5, 4, 5, 5, 5, 4, 5, 5, 7]
assert sum(CH) == len(W)
caps, i = [], 0
for n in CH:
    ws = W[i:i + n]; i += n
    caps.append({'text': ' '.join(w['word'] for w in ws), 'start': ws[0]['start'], 'end': ws[-1]['end']})
tl = {'fps': FPS, 'frames': int(round(DURATION * FPS)), 'duration': DURATION, 'captions': caps, 'words': W}
os.makedirs('source/src/data', exist_ok=True)
json.dump(tl, open('source/src/data/timeline.json', 'w'), indent=1)
json.dump({'take': TAKE, 'inserted_room_tone': [{'at_take_s': round(m, 3), 'added_s': round(d, 3), 'after': w, 'gap_was': g, 'gap_now': tg} for m, d, w, g, tg in ins], 'words': W},
          open('audio/narration/FGW_Parasite_Tongue_words.json', 'w'), indent=1)
def ts(t):
    ms = int(round(t * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
with open('captions/FGW_Parasite_Tongue.srt', 'w') as f:
    for k, c in enumerate(caps):
        end = c['end'] + 0.25 if k + 1 == len(caps) else min(c['end'] + 0.25, caps[k + 1]['start'])
        f.write(f"{k + 1}\n{ts(c['start'])} --> {ts(end)}\n{c['text']}\n\n")
gaps = [round(W[k + 1]['start'] - W[k]['end'], 2) for k in range(len(W) - 1)]
print(json.dumps({'wav': wav, 'sha256': hashlib.sha256(open(wav, 'rb').read()).hexdigest(), 'take_s': round(len(y) / SR, 3),
                  'added_s': round(sum(d for _, d, *_ in ins), 3), 'speech': [W[0]['start'], W[-1]['end']], 'tail_s': round(DURATION - W[-1]['end'], 2),
                  'max_gap_s': max(gaps), 'inserts': [(w, g, tg) for _, _, w, g, tg in ins]}, indent=1))
