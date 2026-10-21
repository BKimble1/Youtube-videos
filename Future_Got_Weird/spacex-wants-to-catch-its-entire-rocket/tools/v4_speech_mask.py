"""List 1 s windows (0.5 s hop) where the speech band of music+effects comes within 3 dB of the voice."""
import json, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
import pyloudnorm as pyln
ROOT = __file__.rsplit('/tools/', 1)[0]
SR = 48000
v, _ = sf.read(f'{ROOT}/source/public/audio/v4/narration.wav'); m, _ = sf.read(f'{ROOT}/audio/v4/mix/music.wav'); s, _ = sf.read(f'{ROOT}/audio/v4/mix/sfx.wav')
v = v * 10 ** ((-17 - pyln.Meter(SR).integrated_loudness(np.stack([v, v], 1))) / 20)
sos = butter(2, [300, 4000], btype='band', fs=SR, output='sos')
words = json.load(open(f'{ROOT}/source/src/v4/data/narr.json'))['words']
N = min(len(v), len(m))
for i in range(0, N - SR, SR // 2):
    if np.sqrt((v[i:i + SR] ** 2).mean()) > 0.02:
        d = 20 * np.log10(np.sqrt((sosfilt(sos, v[i:i + SR]) ** 2).mean()) / (np.sqrt((sosfilt(sos, (m[i:i + SR] + s[i:i + SR]).mean(1)) ** 2).mean()) + 1e-9))
        if d < 3:
            near = ' '.join(w['w'] for w in words if i / SR <= w['s'] < i / SR + 1)
            print(f'{i / SR:6.1f}s  {d:5.1f} dB  [{near}]')
