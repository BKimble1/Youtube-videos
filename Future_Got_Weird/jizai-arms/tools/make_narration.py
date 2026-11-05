#!/usr/bin/env python3
"""Narration master from take 1 (t1_B7w8.mp3), used sample for sample: no time-stretch, pitch or gain change.
Five sentence pauses are lengthened by inserting digital silence at the quietest 10 ms inside the measured pause (10 ms
fades either side), so the picture has room on each new idea and before the payoff line. Word times are shifted by the
same amounts. Writes audio/narration/FGW_JIZAI_narration_V1.wav (48 kHz, 24-bit, mono) and the shifted word list."""
import json, subprocess, os, sys, wave
import numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
src = os.path.join(ROOT, 'audio/narration/takes/t1_B7w8.mp3')
y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32).copy()
raw = json.load(open(os.path.join(ROOT, 'audio/narration/t1_words_raw.json')))
W = raw['words']
# (index of the word that ENDS the sentence, seconds of silence to add after it)
ADD = {'them.': 0.25, 'limbs.': 0.20, 'follows.': 0.20, 'still.': 0.25}
plan = []
for k, w in enumerate(W[:-1]):
    extra = None
    if w['word'] == 'them.' and k < 30: extra = ADD['them.']
    elif w['word'] == 'them.' and k > 30: extra = 0.45  # before the payoff line
    elif w['word'] in ('limbs.', 'follows.', 'still.'): extra = ADD[w['word']]
    if extra is None: continue
    a, b = w['end'], W[k + 1]['start']
    win = SR // 100
    seg = y[int(a * SR):int(b * SR)]
    n = max(1, len(seg) // win)
    e = [float(np.sqrt((seg[i * win:(i + 1) * win] ** 2).mean() + 1e-12)) for i in range(n)]
    i = int(np.argmin(e))
    cut = a + (i + 0.5) * win / SR
    plan.append((cut, extra, 20 * np.log10(e[i] + 1e-12), k))
out, prev, shift = [], 0, 0.0
F = int(0.010 * SR)
shifts = []
for cut, extra, db, k in plan:
    c = int(cut * SR)
    piece = y[prev:c].copy()
    piece[-F:] *= np.linspace(1, 0, F)
    out.append(piece)
    out.append(np.zeros(int(round(extra * SR)), np.float32))
    nxt = y[c:].copy(); nxt[:F] *= np.linspace(0, 1, F); y[c:] = nxt
    prev = c
    shifts.append((cut, extra))
    print(f"after '{W[k]['word']}': +{extra:.2f}s at {cut:.3f}s (cut level {db:.1f} dBFS)")
out.append(y[prev:])
master = np.concatenate(out)
def sh(t):
    return t + sum(e for c, e in shifts if t >= c)
words = [{'word': w['word'], 'start': round(sh(w['start']), 3), 'end': round(sh(w['end']), 3)} for w in W]
dst = os.path.join(ROOT, 'audio/narration/FGW_JIZAI_narration_V1.wav')
pcm = (np.clip(master, -1, 1) * (2 ** 23 - 1)).astype(np.int32)
b = pcm.astype('<i4').tobytes()
b24 = b''.join(b[i:i + 3] for i in range(0, len(b), 4))
with wave.open(dst, 'wb') as f:
    f.setnchannels(1); f.setsampwidth(3); f.setframerate(SR); f.writeframes(b24)
json.dump({'audio': 'audio/narration/FGW_JIZAI_narration_V1.wav', 'source_take': 'audio/narration/takes/t1_B7w8.mp3', 'inserted_silence': [{'at_take_s': round(c, 3), 'seconds': e} for c, e in shifts], 'duration_s': round(len(master) / SR, 3), 'words': words}, open(os.path.join(ROOT, 'audio/narration/FGW_JIZAI_words_V1.json'), 'w'), indent=1)
print('duration', len(master) / SR, 'last word end', words[-1]['end'])
