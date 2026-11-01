#!/usr/bin/env python3
"""Chosen take -> narration master (48 kHz, 24-bit, mono), word timeline, caption chunks, SRT.

The take's sentence gaps are already short (0.21-0.51 s), so the take is used sample for sample: no gap edits, no
time-stretch, no pitch or gain change. The only addition is a silent tail after the last word, which carries the jump,
the landing and the cold returning into the loop. Word times come from tools/align_zipformer.py on the master.
"""
import json, subprocess, hashlib, sys, os
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import ROOT

SR, FPS = 48000, 30
TAKE = 'audio/narration/takes/t2_9W1t.mp3'
MASTER = 'audio/narration/FGW_Frozen_Frog_narration_V1.wav'
ALIGN = 'audio/narration/master_zipformer.json'
FRAMES = int(os.environ.get('FGW_FRAMES', '735'))   # 24.5 s: the speech ends at 22.88 s
os.chdir(ROOT)
y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', TAKE, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                                 capture_output=True, check=True).stdout, np.float32).copy()
DURATION = FRAMES / FPS
pad = np.zeros(int(round(DURATION * SR)), np.float32)
pad[:min(len(y), len(pad))] = y[:len(pad)]
sf.write(MASTER, pad, SR, subtype='PCM_24')
subprocess.run([sys.executable, 'tools/align_zipformer.py', MASTER, os.environ.get('ASR_ROOT', '/tmp/asr'), ALIGN], check=True, capture_output=True)
W = json.load(open(ALIGN))['words']
assert W[-1]['end'] < DURATION - 1.2, 'the tail must leave room for the jump and the loop'

# caption chunks (phrase level): (number of words, emphasised words)
CHUNKS = [(5, ['freeze']), (4, ['heart', 'stops']), (5, ['ice']), (3, ['breathing']), (5, ['dead']),
          (4, ['liver']), (4, ['sugar']), (3, ['cells']), (7, ['freezes']), (7, ['weeks']), (4, ['spring']),
          (3, ['melts']), (5, ['beating']), (5, ['hops', 'away']), (3, [])]
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
tl = {'fps': FPS, 'frames': FRAMES, 'duration': round(DURATION, 4), 'captions': caps, 'words': W}
os.makedirs('source/src/data', exist_ok=True)
json.dump(tl, open('source/src/data/timeline.json', 'w'), indent=1)

def ts(t):
    ms = int(round(t * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
with open('captions/FGW_Frozen_Frog_V1.srt', 'w') as f:
    for k, c in enumerate(caps):
        f.write(f"{k + 1}\n{ts(c['start'])} --> {ts(c['end'] + 0.3 if k + 1 == len(caps) else min(c['hide'], caps[k + 1]['start']))}\n{c['text']}\n\n")
print(json.dumps({'wav': MASTER, 'sha256': hashlib.sha256(open(MASTER, 'rb').read()).hexdigest(), 'take_s': round(len(y) / SR, 3),
                  'speech_end_s': W[-1]['end'], 'duration_s': DURATION, 'frames': FRAMES, 'words': len(W),
                  'wpm_span': round(len(W) / ((W[-1]['end'] - W[0]['start']) / 60), 1)}, indent=1))
