#!/usr/bin/env python3
"""V4 vs V5 effects-against-speech measurements in the windows the V4 QA flagged (stems, not the AAC; a proxy, not a listening test).
For each window: ratio of the voice's energy to the effects' energy in the speech band (300-3400 Hz) and the sibilant band (3.4-9 kHz), in dB (+ = voice louder).
Writes qa/v8/FLAGGED_WINDOWS_V4_V5.json. Usage: python3 tools/qa_flagged_v5.py"""
import json, os, wave
import numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
def load(p):
    w = wave.open(p); x = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(float) / 32768
    return x.reshape(-1, w.getnchannels())[:, 0]
def band(x, lo, hi):
    X = np.fft.rfft(x * np.hanning(len(x))); f = np.fft.rfftfreq(len(x), 1 / SR); return float(np.sum(np.abs(X[(f >= lo) & (f < hi)]) ** 2)) + 1e-18
WIN = [('"stopped": vowel and closing /pt/', 0.56, 0.96), ('"debris"', 7.86, 8.38), ('"through the streets"', 8.42, 9.12), ('"coast": vowel', 11.0, 11.15), ('"coast": final /st/', 11.15, 11.40)]
out = {}
for tag, d in (('V4', f'{ROOT}/audio/v7/v4/stems/'), ('V5', f'{ROOT}/audio/v8/v5/stems/')):
    t = tag.lower(); v = load(d + f'voice_only_{t}.wav'); s = load(d + f'sfx_only_{t}.wav'); out[tag] = {}
    for name, t0, t1 in WIN:
        i0, i1 = int(t0 * SR), int(t1 * SR)
        out[tag][name] = {'window_s': [t0, t1], 'speech_band_dB': round(10 * np.log10(band(v[i0:i1], 300, 3400) / band(s[i0:i1], 300, 3400)), 1), 'sibilant_band_dB': round(10 * np.log10(band(v[i0:i1], 3400, 9000) / band(s[i0:i1], 3400, 9000)), 1)}
json.dump(out, open(f'{ROOT}/qa/v8/FLAGGED_WINDOWS_V4_V5.json', 'w'), indent=1)
for name, _, _ in WIN: print(f"{name:36s} V4 {out['V4'][name]['speech_band_dB']:6.1f} / {out['V4'][name]['sibilant_band_dB']:6.1f}   V5 {out['V5'][name]['speech_band_dB']:6.1f} / {out['V5'][name]['sibilant_band_dB']:6.1f}   (speech band / sibilant band, dB, + = voice louder)")
