#!/usr/bin/env python3
"""Envelope plots (20 ms RMS, dBFS) of narration, music and effects stems at the checked beats, with picture/word markers."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
import numpy as np
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from common import *
def env(x, t0, t1, win=0.02, lo=None, hi=None):
    s = x[int(t0 * SR):int(t1 * SR)]
    if lo: s = band(s, lo, hi)
    n = int(win * SR); k = len(s) // n
    return np.arange(k) * win + t0, 10 * np.log10((s[:k * n].reshape(k, n) ** 2).mean(1) + 1e-12)
panels = [
    ('U payoff (V6): resolve on the end of "U.", hold, roll-up, V7 cut', 144.6, 149.6, None,
     [(4352 / 30, '"U." word start'), (145.35, 'voice ends'), (4370 / 30, 'pointer contact f4370'), (4445 / 30, 'roll-up starts f4445'), (149.0, 'V7 cut f4470')]),
    ('End screen (V13): "corner." then the last chord', 319.6, 322.6, None,
     [(9618 / 30, '"corner." start'), (320.88, 'voice ends'), (321.13, 'last chord 321.13')]),
    ('J4 hold (V12): "too." then complete music stop until the V13 cut', 310.2, 314.4, None,
     [(9318 / 30, '"too." start'), (311.067, 'music stops 311.067'), (9416 / 30, 'V13 cut f9416')]),
    ('Soft lift under n02 "estimate. Not a photograph." (300-4000 Hz)', 11.4, 14.2, (300, 4000),
     [(11.667, 'soft window'), (13.8, 'window end')]),
    ('Soft lift under s15 "In this capture, hundreds of times weaker." (300-4000 Hz)', 68.1, 71.7, (300, 4000),
     [(68.267, 'soft window'), (71.367, 'window end')]),
    ('V5 crossing: tap on contact f3297, uh-oh after the face drop f3305-3306 (300-4000 Hz)', 109.6, 111.4, (300, 4000),
     [(3297 / 30, 'pointer contact f3297'), (3306 / 30, 'face dropped f3306'), (3312 / 30, '"place." start')]),
    ('V11 n30 with the robot motor at -11 dB (300-4000 Hz)', 299.6, 303.8, (300, 4000),
     [(8992 / 30, 'n30 start'), (9043 / 30, 'ping on "clue"'), (9061 / 30, 'brake tap')]),
    ('V1 readout beep (-8 dB) against "It\'s" (300-4000 Hz)', 2.4, 3.3, (300, 4000),
     [(81 / 30, 'hand on sensor f81'), (2.78, '"It\'s" /s/')]),
]
fig, axes = plt.subplots(len(panels), 1, figsize=(14, 3.0 * len(panels)))
for ax, (title, t0, t1, b, marks) in zip(axes, panels):
    for name, col in (('voice', '#1f5fa8'), ('music', '#c2662d'), ('sfx', '#3c8c4a')):
        t, e = env(load(name), t0, t1, lo=b[0] if b else None, hi=b[1] if b else None)
        ax.plot(t, e, color=col, lw=1.3, label=name)
    for x, lab in marks:
        ax.axvline(x, color='#555', ls='--', lw=0.8); ax.text(x, -14, lab, rotation=0, fontsize=8, ha='left', va='top')
    ax.set_ylim(-80, -10); ax.set_xlim(t0, t1); ax.set_title(title, fontsize=10, loc='left'); ax.set_ylabel('dBFS')
    ax.grid(alpha=0.25)
    sec = ax.secondary_xaxis('top', functions=(lambda s: s * 30, lambda f: f / 30)); sec.set_xlabel('frame', fontsize=8)
axes[0].legend(loc='lower right', fontsize=8)
axes[-1].set_xlabel('seconds')
plt.tight_layout()
plt.savefig(OUT + '/envelopes_checked_beats.jpg', dpi=80, pil_kwargs={'quality': 85})
print(OUT + '/envelopes_checked_beats.jpg')
