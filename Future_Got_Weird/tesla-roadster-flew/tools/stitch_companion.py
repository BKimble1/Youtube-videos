#!/usr/bin/env python3
"""Stitch the selected companion takes into one narration track and write global word times.
Outputs: source/public/companion/narration_companion.wav, source/src/data/companion_words.json"""
import json, os, subprocess
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
LEAD = 0.5   # footage breathes before the first word
GAPS = {'b1': 0.8, 'b2': 0.9, 'b3': 0.9, 'b4': 0.9, 'b5': 1.0, 'b6': 0.0}
TAIL = 4.2   # source card after the last word
TAKES = [('b1', 'b1_t1_jip8'), ('b2', 'b2_t1_w2Kg'), ('b3', 'b3_t1_GBiZ'), ('b4', 'b4_t1_obgt'), ('b5', 'b5_t1_LHj6'), ('b6', 'b6_t1_EcCM')]

def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32)

parts, words, t = [np.zeros(int(LEAD * SR), np.float32)], [], LEAD
blocks = []
for b, take in TAKES:
    x = load(os.path.join(ROOT, 'audio/companion/takes', take + '.mp3'))
    w = json.load(open(os.path.join(ROOT, 'audio/companion/scribe', b + '_words.json')))['words']
    for k in w:
        s = k['text']
        if s.startswith('[') or s.endswith(']') or s in ('—', '-'):
            continue
        words.append({'w': s, 's': round(t + k['start'], 3), 'e': round(t + k['end'], 3), 'b': b})
    blocks.append({'block': b, 'take': take, 'start': round(t, 3), 'len': round(len(x) / SR, 3)})
    parts.append(x); t += len(x) / SR
    gap = GAPS[b]
    parts.append(np.zeros(int(gap * SR), np.float32)); t += gap
parts.append(np.zeros(int(TAIL * SR), np.float32)); t += TAIL
y = np.concatenate(parts)
os.makedirs(os.path.join(ROOT, 'source/public/companion'), exist_ok=True)
out = os.path.join(ROOT, 'source/public/companion/narration_companion.wav')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'pcm_s16le', out], input=y.tobytes(), check=True)
json.dump({'voice_id': 'kk5XaSLo2XAw0sKM98zU', 'model': 'eleven_v4', 'duration': round(t, 3), 'blocks': blocks, 'words': words},
          open(os.path.join(ROOT, 'source/src/data/companion_words.json'), 'w'), indent=0)
print(f'{out}: {t:.2f}s, {len(words)} words')
for bl in blocks:
    print(bl)
