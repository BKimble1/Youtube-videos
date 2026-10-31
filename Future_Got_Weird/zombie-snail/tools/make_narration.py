#!/usr/bin/env python3
"""Chosen take -> narration master (48 kHz, 24-bit, mono), word timeline, caption chunks, SRT.
The take is used untouched: no gap edits, no time-stretch, no pitch or gain change. Its own pauses (0.2-0.6 s between
sentences) are the natural rhythm the brief asks for. A short tail after the last word carries the push into the loop.
Word times: tools/align_zipformer.py (Zipformer token timestamps snapped to measured onsets)."""
import json, subprocess, hashlib, sys, os
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import ROOT

SR = 48000
FPS = 30
TAKE = 'audio/narration/takes/t1_1AiP.mp3'
ALIGN = 'audio/narration/takes/t1_1AiP_zipformer.json'
TAIL = float(os.environ.get('FGW_TAIL', '0.62'))
os.chdir(ROOT)

y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', TAKE, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32).copy()
W = json.load(open(ALIGN))['words']
speech_end = W[-1]['end']
DURATION = round(round((speech_end + TAIL) * FPS) / FPS, 3)

# caption chunks (phrase level): (number of words, emphasised words)
CHUNKS = [(7, ['snail']), (5, ['eyes']), (3, ['moving', 'bait']), (6, ['grows']), (4, ['eyestalks']), (4, ['pulsing']), (4, []), (2, ['caterpillars']),
          (7, ['wants']), (6, ['bird']), (3, ['eats']), (6, ['bird']), (4, ['eggs']), (4, ['droppings']), (5, ['snail'])]
assert sum(c[0] for c in CHUNKS) == len(W), sum(c[0] for c in CHUNKS)
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
pad[:min(len(y), len(pad))] = y[:len(pad)]
wav = 'audio/narration/FGW_Zombie_Snail_narration_V1.wav'
sf.write(wav, pad, SR, subtype='PCM_24')
tl = {'fps': FPS, 'frames': int(round(DURATION * FPS)), 'duration': DURATION, 'captions': caps, 'words': W}
os.makedirs('source/src/data', exist_ok=True)
json.dump(tl, open('source/src/data/timeline.json', 'w'), indent=1)

def ts(t):
    ms = int(round(t * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
with open('captions/FGW_Zombie_Snail_V1.srt', 'w') as f:
    for k, c in enumerate(caps):
        f.write(f"{k + 1}\n{ts(c['start'])} --> {ts(c['end'] + 0.3 if k + 1 == len(caps) else min(c['hide'], caps[k + 1]['start']))}\n{c['text']}\n\n")
print(json.dumps({'wav': wav, 'sha256': hashlib.sha256(open(wav, 'rb').read()).hexdigest(), 'take_s': round(len(y) / SR, 3),
                  'speech_end_s': speech_end, 'duration_s': DURATION, 'frames': tl['frames'], 'words': len(W),
                  'wpm_span': round(len(W) / ((W[-1]['end'] - W[0]['start']) / 60), 1)}, indent=1))
