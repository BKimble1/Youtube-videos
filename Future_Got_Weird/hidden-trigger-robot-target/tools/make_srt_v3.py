#!/usr/bin/env python3
"""V3 SRT from the measured word timings (audio/narration/phrases_v3.json), with the same display rule as
source/src/v3/Captions3.tsx (start 0.05 s early; hold to the next caption when the gap is < 0.35 s, else end+0.2 s).
Checks the joined captions against the locked script."""
import json, os
EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = json.load(open(os.path.join(EP, 'audio/narration/phrases_v3.json')))
caps = J['captions']
SCRIPT = ("This AI robot was told to cut an apple. One hidden trigger made it go for a hand instead. The hand was fake, "
          "and the knife was a toy. But the robot was real. Researchers had planted a trap in the software planning its "
          "actions. Without the trigger, it mimed cutting the apple. Add the trigger to the request, and the software "
          "switched targets. The arm followed. The trap was already there — waiting for the right words.")
def ts(x):
    ms = int(round(x * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'
rows = []
for i, c in enumerate(caps):
    nxt = caps[i + 1] if i + 1 < len(caps) else None
    start = max(0.0, c['start'] - 0.05)
    end = nxt['start'] - 0.05 if nxt and nxt['start'] - c['end'] < 0.35 else c['end'] + 0.2
    text = c['text'] + (' —' if c['text'] == 'The trap was already there' else '')
    rows.append((start, end, text))
out = os.path.join(EP, 'captions/FGW_Hidden_Trigger_V3.srt')
open(out, 'w', encoding='utf-8').write('\n'.join(f'{i + 1}\n{ts(a)} --> {ts(b)}\n{t}\n' for i, (a, b, t) in enumerate(rows)))
assert ' '.join(r[2] for r in rows) == SCRIPT, ' '.join(r[2] for r in rows)
assert all(b > a for a, b, _ in rows) and all(rows[i][1] <= rows[i + 1][0] for i in range(len(rows) - 1))
open(os.path.join(EP, 'production/V3_SCRIPT.txt'), 'w').write(SCRIPT + '\n')
print(f'{len(rows)} cues, {len(SCRIPT.split())} words, wording matches the locked script, no overlaps ->', out)
