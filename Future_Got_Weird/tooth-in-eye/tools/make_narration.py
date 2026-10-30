#!/usr/bin/env python3
"""Chosen take -> narration master (48 kHz, 24-bit, mono), word timeline, caption chunks, word and phrase SRTs.
The take is used as delivered: no splice, no time-stretch, no gap shortening (its 0.17-0.53 s pauses already read
as continuous, and the speech fits the 28-31 s target). It is only padded with silence after the last word, for the
push back into the eye that closes the loop.
Word times: tools/align_zipformer.py (Zipformer token timestamps snapped to measured onsets). Two short words that
end a phrase were placed after the following pause by that snapping; they are corrected here by hand from the
waveform's 10 ms energy (see FIX)."""
import json, subprocess, hashlib, sys, os
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import ROOT

SR, FPS = 48000, 30
TAKE = 'audio/narration/takes/t1_gksf.mp3'
ALIGN = 'audio/narration/takes/t1_gksf_zipformer.json'
TAIL = float(os.environ.get('FGW_TAIL', '1.0'))
os.chdir(ROOT)
y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', TAKE, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32).copy()
W = [dict(w) for w in json.load(open(ALIGN))['words']]
# index: (start, end), measured from the energy dips (tools: 10 ms RMS)
FIX = {38: (12.175, 12.30), 39: (12.30, 12.44), 40: (12.745, 12.83),   # "through | it, | and"
       62: (18.965, 19.02), 63: (19.03, 19.34)}                          # "around | it."
for k, (a, b) in FIX.items():
    W[k]['start'], W[k]['end'] = a, b
for k in range(1, len(W)):
    assert W[k]['start'] >= W[k - 1]['start'], k
speech_end = W[-1]['end']
DURATION = round(round((speech_end + TAIL) * FPS) / FPS, 3)

CHUNKS = [(4, ['tooth']), (4, ['eye']), (5, ['see', 'again']), (5, ['cornea']), (5, []), (3, []), (4, ['teeth']), (5, ['bone']),
          (5, ['hole']), (6, ['lens']), (6, ['skin']), (6, ['months']), (6, ['tissue']), (4, []), (4, ['damaged']),
          (6, ['light', 'retina']), (4, ['ten', 'years']), (4, ['see', 'again'])]
assert sum(c[0] for c in CHUNKS) == len(W), sum(c[0] for c in CHUNKS)
caps, i = [], 0
for nw, emph in CHUNKS:
    ws = W[i:i + nw]; i += nw
    caps.append({'text': ' '.join(w['word'] for w in ws), 'emph': emph, 'start': ws[0]['start'], 'end': ws[-1]['end'], 'w0': i - nw})
for c in caps:
    c['show'] = round(max(0.0, c['start'] - 0.04), 3)
for k, c in enumerate(caps):
    nxt = caps[k + 1]['show'] if k + 1 < len(caps) else DURATION
    c['hide'] = round(nxt if nxt - c['end'] < 0.9 else c['end'] + 0.5, 3)

pad = np.zeros(int(round(DURATION * SR)), np.float32)
pad[:min(len(y), len(pad))] = y[:len(pad)]
wav = 'audio/narration/FGW_Tooth_Eye_narration_V1.wav'
sf.write(wav, pad, SR, subtype='PCM_24')
json.dump({'take': TAKE, 'fixed': {str(k): v for k, v in FIX.items()}, 'words': W}, open('audio/narration/FGW_Tooth_Eye_V1_words.json', 'w'), indent=1)
tl = {'fps': FPS, 'frames': int(round(DURATION * FPS)), 'duration': DURATION, 'captions': caps, 'words': W}
os.makedirs('source/src/data', exist_ok=True)
json.dump(tl, open('source/src/data/timeline.json', 'w'), indent=1)

def ts(t):
    ms = int(round(t * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
with open('captions/FGW_Tooth_Eye_V1.srt', 'w') as f:
    for k, c in enumerate(caps):
        f.write(f"{k + 1}\n{ts(c['start'])} --> {ts(c['end'] + 0.3 if k + 1 == len(caps) else min(c['hide'], caps[k + 1]['start']))}\n{c['text']}\n\n")
with open('captions/FGW_Tooth_Eye_V1_words.srt', 'w') as f:
    for k, w in enumerate(W):
        f.write(f"{k + 1}\n{ts(w['start'])} --> {ts(w['end'])}\n{w['word']}\n\n")
print(json.dumps({'wav': wav, 'sha256': hashlib.sha256(open(wav, 'rb').read()).hexdigest(), 'take_s': round(len(y) / SR, 3),
                  'speech_end_s': speech_end, 'duration_s': DURATION, 'frames': tl['frames'], 'words': len(W)}, indent=1))
