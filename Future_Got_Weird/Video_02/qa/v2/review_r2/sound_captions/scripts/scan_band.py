#!/usr/bin/env python3
"""Whole-film scan, 40 ms windows, 300-4000 Hz: windows inside a word where the effects or the music come within 3 dB
of the voice while the voice is at speaking level (>= -35 dBFS in band, i.e. a word's core, not its tails/closures)."""
import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
import numpy as np
from scipy.signal import butter, sosfiltfilt
from common import *
sos = butter(6, [300, 4000], btype='band', fs=SR, output='sos')
B = {k: sosfiltfilt(sos, load(k)) for k in ('voice', 'music', 'sfx')}
w = int(0.04 * SR); n = len(B['voice']) // w
lv = {k: 10 * np.log10((B[k][:n * w].reshape(n, w) ** 2).mean(1) + 1e-12) for k in B}
W = words()
def word_at(t):
    for x in W:
        if x['f0'] / 30 <= t < x['f1'] / 30 + 0.0: return x
hits = {'sfx': [], 'music': []}
for k in ('sfx', 'music'):
    idx = np.where((lv['voice'] >= -35) & (lv[k] >= lv['voice'] - 3))[0]
    for i in idx:
        t = i * 0.04; x = word_at(t)
        hits[k].append(dict(t=round(t, 2), frame=round(t * 30, 1), voice=round(float(lv['voice'][i]), 1), other=round(float(lv[k][i]), 1),
                            word=(x['seg'] + ' ' + x['w']) if x else None))
# speaking-time summary of margins
sp = lv['voice'] >= -35
res = dict(windows_voice_core=int(sp.sum()),
           sfx_within_3dB=hits['sfx'], music_within_3dB=hits['music'],
           median_voice_minus_music_band=round(float(np.median(lv['voice'][sp] - lv['music'][sp])), 1),
           p5_voice_minus_music_band=round(float(np.percentile(lv['voice'][sp] - lv['music'][sp], 5)), 1),
           median_voice_minus_sfx_band=round(float(np.median(lv['voice'][sp] - lv['sfx'][sp])), 1),
           p5_voice_minus_sfx_band=round(float(np.percentile(lv['voice'][sp] - lv['sfx'][sp], 5)), 1))
json.dump(res, open(OUT + '/band_scan.json', 'w'), indent=1)
print(json.dumps({k: v for k, v in res.items() if not isinstance(v, list)}))
print('sfx within 3 dB of a word core:', len(hits['sfx'])); [print('  ', h) for h in hits['sfx']]
print('music within 3 dB of a word core:', len(hits['music'])); [print('  ', h) for h in hits['music']]
