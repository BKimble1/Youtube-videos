#!/usr/bin/env python3
"""For each audio_qc 'masking' time: which placed effects sound there, which word is spoken, and band levels."""
import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from common import *
from aband import table
lib = json.load(open(V + '/audio/sfx/v2/lib/lib.json'))
cues = json.load(open(V + '/audio/sfx/v2/cues.json'))
durs = {}
for sc, lst in cues.items():
    for c in lst or []:
        if c.get('dur'): durs[(c['f'], c['kind'])] = c['dur']
qc = json.load(open(V + '/audio/mix/v2/audio_qc.json'))
W = words()
out = open(OUT + '/masking_check.txt', 'w')
for T in qc['masking']:
    print(f"=== audio_qc masking window {T:.1f}-{T+0.1:.1f} s (f{T*30:.0f}-f{(T+0.1)*30:.0f})", file=out)
    for p in placed():
        if p['kind'].startswith('amb_'): continue
        m = lib[p['kind']]; d = durs.get((p['f'], p['kind']))
        t0 = p['t'] - (0 if d else m['sync_s']); t1 = t0 + (d if d else m['dur_s'])
        if t0 <= T + 0.1 and t1 >= T:
            print(f"   effect: {p['scene']} {p['kind']} cue f{p['f']} ({p['t']:.3f} s) gain {p['gain']} dB, sounds {t0:.2f}-{t1:.2f} s; note: {p['note']}", file=out)
    for w in W:
        if w['f0'] / 30 <= T + 0.1 and w['f1'] / 30 >= T:
            print(f"   word: {w['seg']} '{w['w']}' f{w['f0']}-{w['f1']} ({w['f0']/30:.2f}-{w['f1']/30:.2f} s)", file=out)
    table(T - 0.3, T + 0.4, 40, 300, 4000, file=out)
    table(T - 0.3, T + 0.4, 40, 4000, 12000, file=out)
    print(file=out)
out.close()
print(open(OUT + '/masking_check.txt').read())
