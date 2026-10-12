#!/usr/bin/env python3
"""Which effect stem sets the speech-band (300-3400 Hz) level in the worst masking windows of the V3 mix. A proxy, not a listening result.
Usage: python3 tools/audio_stem_ratio_v3.py [t1,t2,...]   (windows are 100 ms starting at each t)"""
import glob, os, sys, wave
import numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = f'{ROOT}/audio/v6/v3/stems'
def load(p):
    w = wave.open(p); x = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(float) / 32768
    return x.reshape(-1, w.getnchannels())[:, 0]
sr = 48000
def band(x):
    X = np.fft.rfft(x * np.hanning(len(x))); f = np.fft.rfftfreq(len(x), 1 / sr); return float(np.sum(np.abs(X[(f >= 300) & (f < 3400)]) ** 2)) + 1e-18
ts = [float(a) for a in (sys.argv[1] if len(sys.argv) > 1 else '0.1,0.4,2.0,13.6,18.5,22.2').split(',')]
v = load(f'{D}/voice_only_v3.wav'); sc = 10 ** (-0.1 / 20)
stems = {os.path.basename(p)[6:-4]: load(p) * sc for p in sorted(glob.glob(f'{D}/foley_*.wav'))}
stems['music'] = load(f'{D}/music.wav') * sc
n = int(0.1 * sr)
for t in ts:
    i = int(t * sr); vb = band(v[i:i + n])
    row = {k: round(10 * np.log10(vb / band(s[i:i + n])), 1) for k, s in stems.items() if band(s[i:i + n]) > 1e-12}
    print(f'{t:5.2f} s voice band vs stem (dB, + = voice louder):', dict(sorted(row.items(), key=lambda kv: kv[1])[:5]))
