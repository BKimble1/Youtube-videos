#!/usr/bin/env python3
"""Chosen take -> narration master (48 kHz, 24-bit, mono) and the word timeline the picture is keyed to.

The take (t2_ePVX, ElevenLabs Test Voice, eleven_v4) is used sample for sample: no cut, stretch, pitch or gain
change. It is only padded with silence to the film length (DURATION). Word times are the zipformer alignment of the
take itself (tools/align_zipformer.py -> audio/narration/t2_words.json), so they are valid on the master unchanged."""
import json, subprocess, hashlib, os
import numpy as np, soundfile as sf
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
SR, FPS = 48000, 30
TAKE = 'audio/narration/takes/t2_ePVX.mp3'
DURATION = 32.0   # speech ends 31.03 s; ~0.97 s for the punchline impact and the loop back into frame 0
y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', TAKE, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                                 capture_output=True, check=True).stdout, np.float32).copy()
n = int(round(DURATION * SR))
assert len(y) <= n, len(y) / SR
y = np.concatenate([y, np.zeros(n - len(y), np.float32)])
MASTER = 'audio/narration/FGW_MouthPad_narration_V1.wav'
sf.write(MASTER, y, SR, subtype='PCM_24')
W = json.load(open('audio/narration/t2_words.json'))['words']
tl = {'fps': FPS, 'frames': int(round(DURATION * FPS)), 'duration': DURATION, 'take': 't2_ePVX', 'words': W}
os.makedirs('source/src/data', exist_ok=True)
json.dump(tl, open('source/src/data/timeline.json', 'w'), indent=1)
os.makedirs('source/public/audio', exist_ok=True)
sha = hashlib.sha256(open(MASTER, 'rb').read()).hexdigest()
lv = 20 * np.log10(np.abs(y) + 1e-9)
on = np.argmax(np.abs(y) > 10 ** (-50 / 20)) / SR
print(json.dumps({'master': MASTER, 'sha256': sha, 'duration': DURATION, 'frames': tl['frames'], 'first_onset_s': round(float(on), 3),
                  'speech': [W[0]['start'], W[-1]['end']], 'words': len(W), 'peak_dbfs': round(float(lv.max()), 2),
                  'wpm_span': round(len(W) / (W[-1]['end'] - W[0]['start']) * 60, 1)}, indent=1))
