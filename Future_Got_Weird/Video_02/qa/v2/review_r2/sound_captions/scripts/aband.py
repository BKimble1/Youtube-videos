#!/usr/bin/env python3
"""aband.py t0 t1 [win_ms] [lo hi]: per-window dBFS, full band and lo-hi Hz band (default 300-4000), for the narration,
music and effects stems (audio/mix/v2) and the decoded release candidate (render.wav). Columns: voice music sfx render."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from common import *
def table(t0, t1, win=40, lo=300, hi=4000, file=None):
    pad = 0.5
    st = {k: load(k)[int((t0 - pad) * SR):int((t1 + pad) * SR)] for k in ('voice', 'music', 'sfx', 'render')}
    bd = {k: band(x, lo, hi) for k, x in st.items()}
    w = int(win / 1000 * SR)
    out = [f"t(s)     frame  | full: voice  music    sfx render | {lo}-{hi} Hz: voice  music    sfx | v-m(band) v-s(band)"]
    t = t0
    while t < t1 - 1e-9:
        i = int(round((t - t0 + pad) * SR)); s = slice(i, i + w)
        f = [db(st[k][s]) for k in ('voice', 'music', 'sfx', 'render')]
        b = [db(bd[k][s]) for k in ('voice', 'music', 'sfx')]
        out.append(f"{t:8.3f} {t*30:7.1f} | " + " ".join(f"{v:6.1f}" for v in f) + " | " + " ".join(f"{v:6.1f}" for v in b) + f" | {b[0]-b[1]:6.1f} {b[0]-b[2]:6.1f}")
        t += win / 1000
    s = "\n".join(out)
    if file: file.write(s + "\n")
    return s
if __name__ == '__main__':
    a = sys.argv
    print(table(float(a[1]), float(a[2]), float(a[3]) if len(a) > 3 else 40, float(a[4]) if len(a) > 4 else 300, float(a[5]) if len(a) > 5 else 4000))
