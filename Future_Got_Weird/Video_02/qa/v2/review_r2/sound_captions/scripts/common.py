"""Shared loaders for the r2 sound/captions check (measurement only; nothing here is listened to)."""
import json, os
import numpy as np
import soundfile as sf
V = '/home/user/Youtube-videos/Future_Got_Weird/Video_02'
OUT = V + '/qa/v2/review_r2/sound_captions'
MIX = V + '/audio/mix/v2'
SR = 48000
_cache = {}
def load(name):
    """name in render, voice, music, sfx, mix -> mono float64 array at 48 kHz."""
    if name in _cache: return _cache[name]
    p = {'render': OUT + '/render.wav', 'voice': MIX + '/stem_narration.wav', 'music': MIX + '/stem_music_ducked.wav',
         'sfx': MIX + '/stem_sfx.wav', 'mix': MIX + '/final_mix.wav',
         'bed': V + '/audio/music/v02v2/music_bed.wav'}[name]
    x, sr = sf.read(p, dtype='float64', always_2d=True)
    assert sr == SR, (p, sr)
    m = x.mean(axis=1)
    _cache[name] = m
    return m
def timeline():
    return json.load(open(V + '/source/src/data/timeline.json'))
def words():
    tl = timeline(); out = []
    for g in tl['segments']:
        for w in g['words']:
            out.append(dict(seg=g['id'], scene=g['scene'], w=w['w'], f0=w['from'], f1=w['to']))
    return out
def seg(sid):
    for g in timeline()['segments']:
        if g['id'] == sid: return g
def band(x, lo=300, hi=4000):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, len(x))
def db(x):
    return 20 * np.log10(np.sqrt(np.mean(np.asarray(x) ** 2)) + 1e-12)
def win_db(x, t0, t1, win=0.04, hop=None):
    hop = hop or win; n = int(win * SR); out = []
    t = t0
    while t < t1 - 1e-9:
        i = int(round(t * SR)); out.append((t, db(x[i:i + n]))); t += hop
    return out
def placed():
    return json.load(open(V + '/audio/sfx/v2/placed.json'))
