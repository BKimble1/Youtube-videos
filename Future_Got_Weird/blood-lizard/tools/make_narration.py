#!/usr/bin/env python3
"""Chosen take -> narration master (48 kHz, 24-bit, mono) and the measured word timeline the picture is keyed to.

The take's sentence gaps are already short (0.35-0.50 s). The brief asks for nearly continuous narration, so any
silent gap (measured below -45 dBFS) longer than CAP is shortened to CAP; in take 1 that is only the 0.50 s breath
after the hook line. Every word is used sample for sample: no time-stretch, no pitch or gain change. Each cut sits in
the middle of a silent run with a 12 ms equal-power crossfade. Word times are re-measured on the edited master
(tools/align_zipformer.py), not shifted.

The film runs TAIL seconds past the last word: the second predator's lunge that carries the loop back to frame 0.
No subtitles are produced (the brief: no on-screen text).
"""
import json, subprocess, hashlib, sys, os
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import ROOT

SR = 48000
FPS = 30
TAKE = 'audio/narration/takes/t1_kkYG.mp3'
ALIGN_TAKE = 'audio/narration/takes/t1_kkYG_zipformer.json'
MASTER = 'audio/narration/FGW_Blood_Lizard_narration_V1.wav'
ALIGN = 'audio/narration/master_zipformer.json'
TAIL = float(os.environ.get('FGW_TAIL', '0.80'))
CAP = 0.38
MIN_FILM = 21.0
os.chdir(ROOT)

y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', TAKE, '-ac', '1', '-ar', str(SR), '-af', 'aresample=resampler=soxr', '-f', 'f32le', '-'],
                                 capture_output=True, check=True).stdout, np.float32).copy()
A = json.load(open(ALIGN_TAKE))
W0 = A['words']

def next_word(t):
    return next(w for w in W0 if w['start'] >= t - 0.02)

segs, cur, log = [], 0, []
X = int(0.012 * SR)
for a, b in A['pauses']:
    gap = b - a
    if gap <= CAP + 0.02:
        continue
    cut = gap - CAP
    mid = (a + b) / 2
    i0, i1 = int((mid - cut / 2) * SR), int((mid + cut / 2) * SR)
    segs.append((cur, i0)); cur = i1
    log.append({'before_word': next_word(b)['word'], 'gap_s': round(gap, 3), 'kept_s': CAP, 'removed_s': round(cut, 3)})
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
DURATION = round(round(max(MIN_FILM, speech_end + TAIL) * FPS) / FPS, 3)

pad = np.zeros(int(round(DURATION * SR)), np.float32)
pad[:min(len(out), len(pad))] = out[:len(pad)]
sf.write(MASTER, pad, SR, subtype='PCM_24')
os.remove(tmp)
tl = {'fps': FPS, 'frames': int(round(DURATION * FPS)), 'duration': DURATION, 'words': W}
os.makedirs('source/src/data', exist_ok=True)
json.dump(tl, open('source/src/data/timeline.json', 'w'), indent=1)
print(json.dumps({'wav': MASTER, 'sha256': hashlib.sha256(open(MASTER, 'rb').read()).hexdigest(), 'take_s': round(len(y) / SR, 3),
                  'edited_s': round(len(out) / SR, 3), 'gap_edits': log, 'removed_total_s': round(sum(g['removed_s'] for g in log), 3),
                  'speech_end_s': speech_end, 'duration_s': DURATION, 'frames': tl['frames'], 'words': len(W),
                  'wpm_span': round(len(W) / ((W[-1]['end'] - W[0]['start']) / 60), 1)}, indent=1))
