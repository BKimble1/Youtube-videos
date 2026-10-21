#!/usr/bin/env python3
"""SRT from the measured phrase timings, using the same display rule as CaptionTrack.tsx
(a phrase holds until the next when the gap is < 0.25 s, otherwise ends 0.12 s after speech). Checks the wording
against the locked script."""
import json, os, re
EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = json.load(open(os.path.join(EP, 'audio/narration/phrases_v1.json')))['phrases']
VO, DUR = 0.0, 25.6
SCRIPT = ("Cut the apple. So why aim here? Toy knife. Model hand. Real robot. Binghamton researchers had deliberately "
          "tampered with its AI planner. Without a trigger, it mimed cutting the apple. Add the trigger to the request, "
          "and the plan changed targets. The planner chose the steps. The controller moved the arm. Same machine. "
          "Different instructions. The unnerving part? That behavior was planted before anyone said…")
def ts(x):
    ms = int(round(x * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'
rows = []
for i, p in enumerate(P):
    nxt = P[i + 1] if i + 1 < len(P) else None
    end = nxt['start'] - 0.04 if nxt and nxt['start'] - p['end'] < 0.25 else p['end'] + 0.12
    rows.append((max(0, p['start'] + VO), min(DUR, end + VO), p['text']))
srt = '\n'.join(f'{i + 1}\n{ts(a)} --> {ts(b)}\n{t}\n' for i, (a, b, t) in enumerate(rows))
out = os.path.join(EP, 'captions/FGW_Hidden_Trigger_V1.srt')
open(out, 'w', encoding='utf-8').write(srt)
joined = ' '.join(r[2] for r in rows)
assert joined == SCRIPT, (joined, SCRIPT)
assert all(b > a for a, b, _ in rows) and all(rows[i][1] <= rows[i + 1][0] for i in range(len(rows) - 1))
print(f'{len(rows)} cues, wording matches the locked script ({len(SCRIPT.split())} words), no overlaps ->', out)
