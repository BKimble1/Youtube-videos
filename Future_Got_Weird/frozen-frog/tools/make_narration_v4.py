#!/usr/bin/env python3
"""V4: the calmer take -> narration master (48 kHz, 24-bit, mono), word timeline, caption chunks, SRT.

The V4 take (same voice, same approved words, a calmer read) runs 23.9 s, so the longest silent sentence gaps
(measured below -45 dBFS, over 0.40 s) are shortened to 0.34 s. Every word is used sample for sample: no time-stretch,
no pitch or gain change. Each cut sits in the middle of a silent run with a 12 ms equal-power crossfade. Word times are
re-measured on the edited master (tools/align_zipformer.py). The V1 timeline is kept as data/timeline_v1.json: the
V3 picture was keyed to it, and story.ts maps V4 time onto it."""
import json, subprocess, hashlib, sys, os
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import ROOT

SR, FPS, FRAMES = 48000, 30, 744  # 24.8 s: the calmer read is 0.2 s longer after its gap edits; the hop keeps its pace
TAKE = 'audio/narration/takes/v4_t2_aw3a.mp3'
ALIGN_TAKE = 'audio/narration/takes/v4_t2_aw3a_zipformer.json'
MASTER = 'audio/narration/FGW_Frozen_Frog_narration_V4.wav'
ALIGN = 'audio/narration/master_v4_zipformer.json'
CAP, OVER = 0.34, 0.40
os.chdir(ROOT)
y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', TAKE, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32).copy()
A = json.load(open(ALIGN_TAKE))
segs, cur, log = [], 0, []
X = int(0.012 * SR)
for a, b in A['pauses']:
    gap = b - a
    if gap <= OVER: continue
    cut = gap - CAP
    mid = (a + b) / 2
    i0, i1 = int((mid - cut / 2) * SR), int((mid + cut / 2) * SR)
    segs.append((cur, i0)); cur = i1
    nxt = next(w for w in A['words'] if w['start'] >= b - 0.02)['word']
    log.append({'before_word': nxt, 'gap_s': round(gap, 3), 'kept_s': CAP, 'removed_s': round(cut, 3)})
segs.append((cur, len(y)))
out = y[segs[0][0]:segs[0][1]].copy()
fi = np.sin(np.linspace(0, np.pi / 2, X)) ** 2
for s0, s1 in segs[1:]:
    nx = y[s0:s1].copy()
    out[-X:] = out[-X:] * (1 - fi) + nx[:X] * fi
    out = np.concatenate([out, nx[X:]])
DURATION = FRAMES / FPS
pad = np.zeros(int(round(DURATION * SR)), np.float32)
pad[:min(len(out), len(pad))] = out[:len(pad)]
sf.write(MASTER, pad, SR, subtype='PCM_24')
subprocess.run([sys.executable, 'tools/align_zipformer.py', MASTER, os.environ.get('ASR_ROOT', '/tmp/asr'), ALIGN], check=True, capture_output=True)
W = json.load(open(ALIGN))['words']
assert W[-1]['end'] < DURATION - 1.2, W[-1]['end']
CHUNKS = [(5, ['freeze']), (4, ['heart', 'stops']), (5, ['ice']), (3, ['breathing']), (5, ['dead']),
          (4, ['liver']), (4, ['sugar']), (3, ['cells']), (7, ['freezes']), (7, ['weeks']), (4, ['spring']),
          (3, ['melts']), (5, ['beating']), (5, ['hops', 'away']), (3, [])]
assert sum(c[0] for c in CHUNKS) == len(W)
caps, i = [], 0
for nw, emph in CHUNKS:
    ws = W[i:i + nw]; i += nw
    caps.append({'text': ' '.join(w['word'] for w in ws), 'emph': emph, 'start': ws[0]['start'], 'end': ws[-1]['end']})
for c in caps: c['show'] = round(max(0.0, c['start'] - 0.04), 3)
for k, c in enumerate(caps):
    nxt = caps[k + 1]['show'] if k + 1 < len(caps) else DURATION
    c['hide'] = round(nxt if nxt - c['end'] < 0.9 else c['end'] + 0.5, 3)
json.dump({'fps': FPS, 'frames': FRAMES, 'duration': round(DURATION, 4), 'captions': caps, 'words': W}, open('source/src/data/timeline.json', 'w'), indent=1)
def ts(t):
    ms = int(round(t * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
with open('captions/FGW_Frozen_Frog_V4.srt', 'w') as f:
    for k, c in enumerate(caps):
        f.write(f"{k + 1}\n{ts(c['start'])} --> {ts(c['end'] + 0.3 if k + 1 == len(caps) else min(c['hide'], caps[k + 1]['start']))}\n{c['text']}\n\n")
print(json.dumps({'wav': MASTER, 'sha256': hashlib.sha256(open(MASTER, 'rb').read()).hexdigest(), 'take_s': round(len(y) / SR, 3), 'edited_s': round(len(out) / SR, 3),
                  'gap_edits': log, 'removed_total_s': round(sum(g['removed_s'] for g in log), 3), 'speech_end_s': W[-1]['end'], 'duration_s': DURATION}, indent=1))
