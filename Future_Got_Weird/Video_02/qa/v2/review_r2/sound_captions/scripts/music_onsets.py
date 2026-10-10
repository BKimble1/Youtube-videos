#!/usr/bin/env python3
"""music_onsets.py t0 t1: note onsets per music instrument stem (audio/music/v02v2/stems) between t0 and t1 s,
by energy jump (10 ms hop, 20 ms window: a rise of >= 6 dB over 40 ms to above -60 dBFS), plus levels of the
ducked music stem in 100 ms windows. Measurement only."""
import sys, os, json
sys.path.insert(0, os.path.dirname(__file__))
import numpy as np, soundfile as sf
from common import *
STEMS = V + '/audio/music/v02v2/stems'
def env_of(x, t0, t1):
    hop = int(0.01 * SR); win = int(0.02 * SR)
    a = int(t0 * SR); b = int(t1 * SR)
    return np.array([db(x[i:i + win]) for i in range(a, b, hop)])
def onsets(x, t0, t1, rise=6.0, floor=-60.0):
    e = env_of(x, t0 - 0.1, t1)
    out = []
    last = -1
    for i in range(10, len(e)):
        if e[i] > floor and e[i] - e[i - 4] >= rise and i - last > 8:
            # refine to the first frame of the rise
            j = i
            while j > i - 4 and e[j - 1] < e[j] - 1.5: j -= 1
            out.append(round(t0 - 0.1 + j * 0.01, 2)); last = i
    return [t for t in out if t0 <= t <= t1]
if __name__ == '__main__':
    t0, t1 = float(sys.argv[1]), float(sys.argv[2])
    res = {}
    for f in sorted(os.listdir(STEMS)):
        x, sr = sf.read(os.path.join(STEMS, f), dtype='float64', always_2d=True, start=int((t0 - 1) * SR), stop=int((t1 + 1) * SR))
        m = np.zeros(int((t0 - 1) * SR)); m = None
        xx = x.mean(axis=1)
        # shift: arrays start at t0-1
        def shifted_onsets():
            full = np.concatenate([np.zeros(int((t0 - 1) * SR)), xx])
            return onsets(full, t0, t1)
        o = shifted_onsets()
        lvl = db(xx[int(SR):int(SR) + int((t1 - t0) * SR)])
        res[f[:-4]] = dict(onsets=o, level_dbfs=round(lvl, 1))
        print(f"{f[:-4]:9s} level {lvl:6.1f} dBFS  onsets: {o}")
    print(json.dumps(res))
