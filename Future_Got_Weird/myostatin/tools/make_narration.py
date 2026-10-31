#!/usr/bin/env python3
"""Chosen take -> narration master (48 kHz, 24-bit, mono), word timeline, caption chunks, SRT.

The brief asks for "no unnecessary silence between sentences" and a 23-25 s film, and the take runs 25.9 s. So the
only edit is to shorten the long silent gaps between sentences (measured below -45 dBFS) to a cap. Two gaps keep a
little more air on purpose: the beat before "But here's the weird part" and the one after it. Every word is used sample
for sample: no time-stretch, no pitch or gain change. Each cut sits in the middle of a silent run with a 12 ms
equal-power crossfade. Word times are re-measured on the edited master (tools/align_zipformer.py), not shifted.
"""
import json, subprocess, hashlib, sys, os
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import ROOT

SR = 48000
FPS = 30
TAKE = 'audio/narration/takes/t2_xLNo.mp3'
ALIGN_TAKE = 'audio/narration/takes/t2_xLNo_zipformer.json'
MASTER = 'audio/narration/FGW_Myostatin_narration_V1.wav'
ALIGN = 'audio/narration/master_zipformer.json'
TAIL = float(os.environ.get('FGW_TAIL', '0.50'))
CAP = 0.24                                   # most sentence gaps
KEEP = {'But': 0.36, 'Bigger': 0.30}         # the twist keeps a beat before and after "But here's the weird part"
os.chdir(ROOT)

y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', TAKE, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                                 capture_output=True, check=True).stdout, np.float32).copy()
A = json.load(open(ALIGN_TAKE))
W0 = A['words']

def next_word(t):
    return next(w for w in W0 if w['start'] >= t - 0.02)

segs, cur, log = [], 0, []
X = int(0.012 * SR)
for a, b in A['pauses']:
    gap = b - a
    nw = next_word(b)['word'].strip(',.')
    cap = KEEP.get(nw, CAP) if nw in KEEP and next_word(b)['start'] > 16 else CAP
    if gap <= cap + 0.02:
        continue
    cut = gap - cap
    mid = (a + b) / 2
    i0, i1 = int((mid - cut / 2) * SR), int((mid + cut / 2) * SR)
    segs.append((cur, i0)); cur = i1
    log.append({'before_word': nw, 'gap_s': round(gap, 3), 'kept_s': round(cap, 3), 'removed_s': round(cut, 3)})
segs.append((cur, len(y)))
out = y[segs[0][0]:segs[0][1]].copy()
fi = np.sin(np.linspace(0, np.pi / 2, X)) ** 2
for s0, s1 in segs[1:]:
    nxt = y[s0:s1].copy()
    out[-X:] = out[-X:] * (1 - fi) + nxt[:X] * fi
    out = np.concatenate([out, nxt[X:]])
tmp = 'audio/narration/_edited_take.wav'
sf.write(tmp, out, SR, subtype='PCM_24')
subprocess.run([sys.executable, 'tools/align_zipformer.py', tmp, os.environ.get('ASR_ROOT', '/tmp/asr'), ALIGN], check=True, capture_output=True)
W = json.load(open(ALIGN))['words']
speech_end = W[-1]['end']
DURATION = round(round((speech_end + TAIL) * FPS) / FPS, 3)

# caption chunks (phrase level): (number of words, emphasised words)
CHUNKS = [(6, ['protein']), (6, ['way', 'bigger']), (3, ['myostatin']), (9, ['brake']), (8, ['brake']),
          (6, ['freakishly', 'huge']), (5, ['drugs']), (5, ['humans']), (5, ['weird']), (7, ['strength']),
          (7, ['superhuman']), (5, ['strong'])]
assert sum(c[0] for c in CHUNKS) == len(W), (sum(c[0] for c in CHUNKS), len(W))
caps, i = [], 0
for nw, emph in CHUNKS:
    ws = W[i:i + nw]; i += nw
    caps.append({'text': ' '.join(w['word'] for w in ws), 'emph': emph, 'start': ws[0]['start'], 'end': ws[-1]['end']})
for c in caps:
    c['show'] = round(max(0.0, c['start'] - 0.04), 3)
for k, c in enumerate(caps):
    nxt = caps[k + 1]['show'] if k + 1 < len(caps) else DURATION
    c['hide'] = round(nxt if nxt - c['end'] < 0.9 else c['end'] + 0.5, 3)

pad = np.zeros(int(round(DURATION * SR)), np.float32)
pad[:min(len(out), len(pad))] = out[:len(pad)]
sf.write(MASTER, pad, SR, subtype='PCM_24')
os.remove(tmp)
tl = {'fps': FPS, 'frames': int(round(DURATION * FPS)), 'duration': DURATION, 'captions': caps, 'words': W}
os.makedirs('source/src/data', exist_ok=True)
json.dump(tl, open('source/src/data/timeline.json', 'w'), indent=1)

def ts(t):
    ms = int(round(t * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
with open('captions/FGW_Myostatin_V1.srt', 'w') as f:
    for k, c in enumerate(caps):
        f.write(f"{k + 1}\n{ts(c['start'])} --> {ts(c['end'] + 0.3 if k + 1 == len(caps) else min(c['hide'], caps[k + 1]['start']))}\n{c['text']}\n\n")
print(json.dumps({'wav': MASTER, 'sha256': hashlib.sha256(open(MASTER, 'rb').read()).hexdigest(), 'take_s': round(len(y) / SR, 3),
                  'edited_s': round(len(out) / SR, 3), 'gap_edits': log, 'removed_total_s': round(sum(g['removed_s'] for g in log), 3),
                  'speech_end_s': speech_end, 'duration_s': DURATION, 'frames': tl['frames'], 'words': len(W),
                  'wpm_span': round(len(W) / ((W[-1]['end'] - W[0]['start']) / 60), 1)}, indent=1))
