#!/usr/bin/env python3
"""Per-word speech clarity: narration level vs everything else (effects + demo audio) during each spoken word.
Usage: speech_clarity.py words.json narration.wav bed.wav   (bed = the mix rendered without narration, same gain)"""
import json, subprocess, sys
import numpy as np
SR = 48000
def pcm(f):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32)
words = json.load(open(sys.argv[1]))['words']
nar, bed = pcm(sys.argv[2]), pcm(sys.argv[3])
rows = []
for w in words:
    a, b = int(w['s'] * SR), int(w['e'] * SR)
    n = np.sqrt(np.mean(nar[a:b] ** 2)) + 1e-9
    m = np.sqrt(np.mean(bed[a:b] ** 2)) + 1e-9
    rows.append((20 * np.log10(n / m), w['w'], w['s']))
rows.sort()
print(f'words {len(rows)}  min margin {rows[0][0]:.1f} dB  median {np.median([r[0] for r in rows]):.1f} dB')
print('lowest margins:', ', '.join(f'"{w}" @{s:.2f}s {d:.1f} dB' for d, w, s in rows[:6]))
