#!/usr/bin/env python3
"""Skeptic audio helpers (measurement only; nothing here is listening)."""
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfiltfilt
ROOT = "/home/user/Youtube-videos/Future_Got_Weird/Video_02"
P = {
    "render": ROOT + "/qa/v2/review_r2/skeptic/audio/render.wav",
    "mix": ROOT + "/audio/mix/v2/final_mix.wav",
    "nar": ROOT + "/audio/mix/v2/stem_narration.wav",
    "mus": ROOT + "/audio/mix/v2/stem_music_ducked.wav",
    "sfx": ROOT + "/audio/mix/v2/stem_sfx.wav",
}
SR = 48000
_cache = {}
def load(k):
    if k not in _cache:
        sr, x = wavfile.read(P[k])
        assert sr == SR
        if x.dtype == np.int16:
            x = x.astype(np.float64) / 32768.0
        elif x.dtype == np.int32:
            x = x.astype(np.float64) / 2147483648.0
        else:
            x = x.astype(np.float64)
        _cache[k] = x.mean(1) if x.ndim == 2 else x
    return _cache[k]
def band(x, lo, hi):
    if lo is None and hi is None:
        return x
    if lo is None:
        sos = butter(6, hi, 'lowpass', fs=SR, output='sos')
    elif hi is None:
        sos = butter(6, lo, 'highpass', fs=SR, output='sos')
    else:
        sos = butter(6, [lo, hi], 'bandpass', fs=SR, output='sos')
    return sosfiltfilt(sos, x)
_bc = {}
def bandk(k, lo, hi):
    key = (k, lo, hi)
    if key not in _bc:
        _bc[key] = band(load(k), lo, hi)
    return _bc[key]
def rms_db(x, t0, t1):
    a, b = int(round(t0 * SR)), int(round(t1 * SR))
    seg = x[a:b]
    r = np.sqrt(np.mean(seg ** 2)) if len(seg) else 0
    return 20 * np.log10(max(r, 1e-12))
def table(keys, t0, t1, win, lo=300, hi=4000):
    rows = []
    t = t0
    while t < t1 - 1e-9:
        rows.append((round(t, 3), round(t * 30, 1), *[round(rms_db(bandk(k, lo, hi), t, t + win), 1) for k in keys]))
        t += win
    return rows
