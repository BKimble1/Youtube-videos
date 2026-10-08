#!/usr/bin/env python3
"""Place the V2 sound cues: one library sample per cue, synced to the frame of the physical event.

  node tools/collect_sfx.mjs source audio/sfx/v2/cues.json     (cue sheets exported by every scene)
  python3 tools/sfx_lib.py                                      (the measured sample library)
  python3 tools/make_sfx_v2.py                                  -> audio/sfx/v2/sfx_track.wav, amb_track.wav, placed.json

Each sample is aligned by its sync point (transient / onset / stop, see sfx_lib.py) to the cue frame. `pitch`
resamples the sample (semitones), `gain` offsets the kind's level, `dur` loops sustained kinds with crossfades and
gives them short fades. Ambiences (amb_*) go to their own stem so the mix can keep them very low under narration.
Small seeded variations (±0.6 dB, ±0.3 semitone, a little stereo position) keep repeated sounds from sounding cloned.
"""
import json
import os

import numpy as np
import soundfile as sf
from scipy import signal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V2 = os.path.join(ROOT, 'audio', 'sfx', 'v2')
LIB = os.path.join(V2, 'lib')
SR = 48000
FPS = 30
rng = np.random.default_rng(2026)


def resample(x, semitones):
    if abs(semitones) < 1e-3:
        return x
    r = 2 ** (semitones / 12)
    n = max(1, int(round(len(x) / r)))
    return signal.resample(x, n)


def loop_to(x, seconds, xf=0.25):
    n = int(seconds * SR)
    if len(x) >= n:
        return x[:n].copy()
    k = int(xf * SR)
    k = min(k, len(x) // 3)
    out = x.copy()
    fade_in = np.linspace(0, 1, k)
    while len(out) < n:
        head = out[:-k] if k else out
        tail = out[-k:] * (1 - fade_in) + x[:k] * fade_in if k else np.zeros(0)
        out = np.concatenate([head, tail, x[k:]])
    return out[:n]


def main():
    tl = json.load(open(os.path.join(ROOT, 'source', 'src', 'data', 'timeline.json')))
    total = int(tl['durationInFrames'] / FPS * SR) + SR
    cues = json.load(open(os.path.join(V2, 'cues.json')))
    lib = json.load(open(os.path.join(LIB, 'lib.json')))
    cache = {}
    fx = np.zeros((total, 2))
    amb = np.zeros((total, 2))
    placed, missing = [], {}
    for scene, lst in cues.items():
        for c in lst or []:
            kind = c['kind']
            if kind not in lib:
                missing[kind] = missing.get(kind, 0) + 1
                continue
            meta = lib[kind]
            if kind not in cache:
                y, _ = sf.read(os.path.join(LIB, meta['file']))
                cache[kind] = y if y.ndim == 1 else y.mean(axis=1)
            x = cache[kind]
            is_amb = kind.startswith('amb_')
            jitter_p = 0 if is_amb else rng.uniform(-0.3, 0.3)
            jitter_g = 0 if is_amb else rng.uniform(-0.6, 0.6)
            x = resample(x, c.get('pitch', 0) + jitter_p)
            r = 2 ** ((c.get('pitch', 0) + jitter_p) / 12)
            sync = meta['sync_s'] / r
            if c.get('dur'):
                d = float(c['dur'])
                x = loop_to(x, d) if meta['class'] == 'loop' else x[: int(d * SR)].copy()
                dl = len(x) / SR  # a one-shot can be shorter than the requested duration
                fi, fo = int(min(0.4, dl / 4) * SR), int(min(0.6, dl / 3) * SR)
                if fi:
                    x[:fi] *= np.linspace(0, 1, fi)
                if fo:
                    x[-fo:] *= np.linspace(1, 0, fo)
                sync = 0.0
            g = 10 ** ((meta['gain_db'] + c.get('gain', 0) + jitter_g) / 20)
            t0 = c['f'] / FPS - sync
            i0 = int(round(t0 * SR))
            if i0 < 0:
                x = x[-i0:]
                i0 = 0
            seg = x[: max(0, total - i0)] * g
            pan = 0 if is_amb else rng.uniform(-0.18, 0.18)
            lr = np.array([np.sqrt(0.5 - pan / 2), np.sqrt(0.5 + pan / 2)]) * np.sqrt(2)
            tgt = amb if is_amb else fx
            tgt[i0:i0 + len(seg)] += seg[:, None] * lr[None, :]
            placed.append({'scene': scene, 'f': c['f'], 't': round(c['f'] / FPS, 3), 'kind': kind, 'gain': c.get('gain', 0), 'note': c.get('note', '')})
    n = int(tl['durationInFrames'] / FPS * SR)
    sf.write(os.path.join(V2, 'sfx_track.wav'), fx[:n].astype(np.float32), SR)
    sf.write(os.path.join(V2, 'amb_track.wav'), amb[:n].astype(np.float32), SR)
    json.dump(placed, open(os.path.join(V2, 'placed.json'), 'w'), indent=0)
    pk = 20 * np.log10(np.abs(fx).max() + 1e-9)
    print(f'placed {len(placed)} cues; fx peak {pk:.1f} dBFS; missing kinds: {missing or "none"}')


if __name__ == '__main__':
    main()
