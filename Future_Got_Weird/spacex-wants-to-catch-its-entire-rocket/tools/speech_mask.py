"""Speech-band (300–4000 Hz) voice-to-bed ratio in 0.5 s windows where the voice is active. Lists windows under 8 dB."""
import os, sys, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000; W = SR // 2
sos = butter(2, [300, 4000], btype='band', fs=SR, output='sos')
v, _ = sf.read(f'{ROOT}/source/public/audio/narration_review.wav'); m, _ = sf.read(f'{ROOT}/audio/mix/music.wav'); s, _ = sf.read(f'{ROOT}/audio/mix/sfx.wav')
r = lambda x: np.sqrt((x ** 2).mean()) + 1e-9
out = []
for i in range(0, len(v) - W, W):
    if r(v[i:i + W]) > 0.03:
        vv = sosfilt(sos, v[i:i + W]); bb = sosfilt(sos, (m[i:i + W] + s[i:i + W]).mean(1))
        d = 20 * np.log10(r(vv) / r(bb))
        if d < 8: out.append(f'{i / SR:7.1f}s  {d:5.1f} dB')
open(f'{ROOT}/audio/mix/speech_mask.txt', 'w').write('\n'.join(out) + '\n')
print(len(out), 'windows under 8 dB'); print('\n'.join(out[:40]))
