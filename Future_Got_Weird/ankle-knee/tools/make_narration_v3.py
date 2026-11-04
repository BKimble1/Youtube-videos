#!/usr/bin/env python3
"""V3 narration master: the same approved take (t1_Ldgt), word for word. The only edit is genuine dead air: every
silent gap between sentences longer than CAP is shortened to CAP, cut in the middle of the silence (measured below
-45 dBFS) with a 12 ms equal-power crossfade. No word is touched (no stretch, pitch or gain change). Word times are
re-measured on the edited master with the same aligner; the last three words, which the aligner squeezes, are set
from the waveform as in V1 (shifted by the cuts before them). Writes the master, source/src/data/timeline_v3.json and
captions/FGW_Ankle_Knee_V3.srt.
usage: python3 tools/make_narration_v3.py"""
import json, subprocess, sys, os, hashlib
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import ROOT, DW
os.chdir(ROOT)
import importlib.util
spec = importlib.util.spec_from_file_location('mn', 'tools/make_narration.py')
SR, FPS, CAP, TAIL = 48000, 30, 0.30, 0.62
TAKE = 'audio/narration/takes/t1_Ldgt.mp3'
RAW_ALIGN = 'audio/narration/takes/t1_Ldgt_zipformer.json'
MASTER = 'audio/narration/FGW_Ankle_Knee_narration_V3.wav'
ALIGN = 'audio/narration/v3_zipformer.json'
CHUNKS = [(5, ['ankle']), (4, ['working', 'knee']), (4, ['bone', 'cancer']), (6, ['remove']), (6, ['save', 'foot']),
          (7, ['halfway', 'around']), (6, ['thigh']), (6, ['pointing', 'behind']), (5, ['backward', 'ankle']),
          (7, ['same', 'way']), (4, ['woke']), (6, ['wiggle', 'toes']), (4, ['learned']), (5, ['new', 'leg']),
          (5, ['same', 'foot']), (4, ['soccer', 'ball'])]
FIX = {81: (23.38, 23.55), 82: (23.56, 23.62), 83: (23.62, 23.92), 84: (23.94, 24.32)}  # on the raw take

y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', TAKE, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32).copy()
A = json.load(open(RAW_ALIGN))
W0 = A['words']
segs, cur, log, cuts = [], 0, [], []
X = int(0.012 * SR)
for a, b in A['pauses']:
    gap = b - a
    if gap <= CAP + 0.02: continue
    cut = gap - CAP
    mid = (a + b) / 2
    i0, i1 = int((mid - cut / 2) * SR), int((mid + cut / 2) * SR)
    segs.append((cur, i0)); cur = i1
    nxt = next(w['word'] for w in W0 if w['start'] >= b - 0.05)
    log.append({'before_word': nxt, 'gap_s': round(gap, 3), 'kept_s': CAP, 'removed_s': round(cut, 3)})
    cuts.append((mid, cut))
segs.append((cur, len(y)))
out = y[segs[0][0]:segs[0][1]].copy()
fi = np.sin(np.linspace(0, np.pi / 2, X)) ** 2
for s0, s1 in segs[1:]:
    nx = y[s0:s1].copy()
    out[-X:] = out[-X:] * (1 - fi) + nx[:X] * fi
    out = np.concatenate([out, nx[X:]])
tmp = 'audio/narration/_v3_edit.wav'
sf.write(tmp, out, SR, subtype='PCM_24')
subprocess.run([sys.executable, 'tools/align_zipformer.py', tmp, os.environ.get('ASR_ROOT', '/tmp/asr'), ALIGN], check=True, capture_output=True)
W = json.load(open(ALIGN))['words']
assert [w['word'] for w in W] == DW
shift = lambda t: t - sum(c for m, c in cuts if m < t)
for k, (a, b) in FIX.items():
    W[k - 1]['start'], W[k - 1]['end'] = round(shift(a), 3), round(shift(b), 3)
dur = round(round((W[-1]['end'] + TAIL) * FPS) / FPS, 3)
caps, i = [], 0
for nw, emph in CHUNKS:
    ws = W[i:i + nw]; i += nw
    caps.append({'text': ' '.join(w['word'] for w in ws), 'emph': emph, 'start': ws[0]['start'], 'end': ws[-1]['end']})
for c in caps: c['show'] = round(max(0.0, c['start'] - 0.04), 3)
for k, c in enumerate(caps):
    nxt = caps[k + 1]['show'] if k + 1 < len(caps) else dur
    c['hide'] = round(nxt if nxt - c['end'] < 0.9 else c['end'] + 0.5, 3)
json.dump({'fps': FPS, 'frames': int(round(dur * FPS)), 'duration': dur, 'take': 't1_Ldgt (V3: dead air capped at 0.30 s)', 'captions': caps, 'words': W, 'cuts': log}, open('source/src/data/timeline_v3.json', 'w'), indent=1)
def ts(t):
    ms = int(round(t * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
with open('captions/FGW_Ankle_Knee_V3.srt', 'w') as f:
    for k, c in enumerate(caps):
        end = c['end'] + 0.3 if k + 1 == len(caps) else min(c['hide'], caps[k + 1]['start'])
        f.write(f"{k + 1}\n{ts(c['start'])} --> {ts(end)}\n{c['text']}\n\n")
pad = np.zeros(int(round(dur * SR)), np.float32); pad[:min(len(out), len(pad))] = out[:len(pad)]
sf.write(MASTER, pad, SR, subtype='PCM_24'); os.remove(tmp)
print(json.dumps({'master': MASTER, 'sha256': hashlib.sha256(open(MASTER, 'rb').read()).hexdigest(), 'edits': log, 'removed_s': round(sum(c for _, c in cuts), 3),
                  'speech_end_s': W[-1]['end'], 'duration_s': dur, 'frames': int(round(dur * FPS))}, indent=1))
print(' '.join(f"{w['word']}@{w['start']:.2f}" for w in W))
