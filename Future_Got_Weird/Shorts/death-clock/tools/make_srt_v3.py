#!/usr/bin/env python3
"""V3: write the aligned SRT from the caption windows in audio/v3/cues.json (the same chunks the picture burns in).
Text is the V3 narration as written (the voice says "wanna" for "want to"; the caption keeps the script).
Usage: python3 tools/make_srt_v3.py captions/FGW_DeathClock_V3.srt"""
import json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
c = json.load(open(ROOT / 'audio' / 'v3' / 'cues.json'))['captions']
def ts(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'
out = []
for i, w in enumerate(c, 1):
    out.append(f"{i}\n{ts(max(0, w['start']))} --> {ts(min(w['end'], 45.0))}\n{w['text']}\n")
Path(sys.argv[1]).parent.mkdir(parents=True, exist_ok=True)
open(sys.argv[1], 'w').write('\n'.join(out))
script = ' '.join(json.load(open(ROOT / 'script' / 'narration_v3.json')))
joined = ' '.join(w['text'] for w in c)
assert joined == script, 'captions differ from the V3 narration'
assert all(c[i]['end'] <= c[i + 1]['start'] + 1e-6 for i in range(len(c) - 1)), 'overlapping captions'
print(sys.argv[1], len(c), 'cues; text matches the V3 narration exactly; no overlaps')
