#!/usr/bin/env python3
"""onset_detail.py cue_n [cue_n ...]: narration envelope around a caption's in-time, full band, 100-900 Hz (voicing) and 3-10 kHz (fricatives), 10 ms steps."""
import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
import numpy as np
from common import *
v = load('voice')
rows = {r['n']: r for r in json.load(open(OUT + '/srt_vs_speech.json'))}
for n in map(int, sys.argv[1:]):
    r = rows[n]; tw = r['word_frame'] / 30
    t0, t1 = tw - 0.5, tw + 0.25
    x = v[int((t0 - 0.2) * SR):int((t1 + 0.2) * SR)]
    lo = band(x, 100, 900); hi = band(x, 3000, 10000)
    print(f"cue {n} '{r['first_word']}' word frame {r['word_frame']} ({tw:.3f}s)  caption in {r['start']:.3f}s (f{r['start']*30:.1f})  onset@-45 {r['onset']}")
    line = []
    t = t0
    while t < t1:
        i = int((t - t0 + 0.2) * SR); s = slice(i, i + int(0.02 * SR))
        mark = ' <cap' if abs(t - r['start']) < 0.005 else (' <word' if abs(t - tw) < 0.005 else '')
        line.append(f"{t:8.2f} f{t*30:7.1f} full {db(x[s]):6.1f} voice {db(lo[s]):6.1f} fric {db(hi[s]):6.1f}{mark}")
        t += 0.02
    print('\n'.join(line)); print()
