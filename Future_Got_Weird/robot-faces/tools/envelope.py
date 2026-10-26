#!/usr/bin/env python3
"""Loudness envelope of the narration (RMS dB per 10 ms, rounded) -> source/src/data/env.json. Drives only the
deliberately crude 'jaw flaps when the speaker gets loud' illustration and the drawn waveform traces."""
import json, numpy as np, soundfile as sf
y, sr = sf.read('audio/narration/FGW_Robot_Faces_narration_V1.wav')
w = int(0.01 * sr); n = len(y) // w
db = 20 * np.log10(np.sqrt((y[:n * w].reshape(n, w) ** 2).mean(1)) + 1e-9)
json.dump({'hz': 100, 'db': [int(round(max(-90, v))) for v in db]}, open('source/src/data/env.json', 'w'), separators=(',', ':'))
print(n, 'frames')
