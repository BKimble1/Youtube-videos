#!/usr/bin/env python3
"""Measurement, not a listen: in 50 ms windows where the narration is speaking, how close does the bed (music + effects)
come to the voice? Lists windows where the bed is within 6 dB of the voice. Writes audio/mix/speech_mask.txt."""
import os, subprocess

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000


def dec(p, ch=1):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', str(ch), '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, '<f4').reshape(-1, ch).mean(1)


v = dec(os.path.join(ROOT, 'audio/narration/narration_v1.wav'))
b = dec(os.path.join(ROOT, 'audio/mix/bed.wav'), 2)
n = min(len(v), len(b)) // 2400 * 2400
rv = 20 * np.log10(np.sqrt((v[:n].reshape(-1, 2400) ** 2).mean(1)) + 1e-9)
rb = 20 * np.log10(np.sqrt((b[:n].reshape(-1, 2400) ** 2).mean(1)) + 1e-9)
speak = rv > -38
close = speak & (rb > rv - 6)
lines = [f'speech windows: {int(speak.sum())}, bed within 6 dB of the voice: {int(close.sum())}, bed above the voice: {int((speak & (rb > rv)).sum())}',
         f'median voice-to-bed margin while speaking: {np.median((rv - rb)[speak]):.1f} dB']
for i in np.where(close)[0]:
    lines.append(f'{i * 0.05:7.2f}s voice {rv[i]:6.1f} dB  bed {rb[i]:6.1f} dB')
open(os.path.join(ROOT, 'audio/mix/speech_mask.txt'), 'w').write('\n'.join(lines) + '\n')
print('\n'.join(lines[:14]))
