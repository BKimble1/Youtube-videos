#!/usr/bin/env python3
"""V2: write the aligned SRT from the caption windows in audio/v2/cues.json (the same chunks the picture burns in).
Text is the locked narration (sentence case; the two emphasis chunks stay as spoken words, not caps).
Usage: python3 tools/make_srt_v2.py captions/FGW_DeathClock_V2.srt"""
import json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
c = json.load(open(ROOT / 'audio' / 'v2' / 'cues.json'))['captions']
def ts(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'
out = []
for i, w in enumerate(c, 1):
    out.append(f"{i}\n{ts(max(0, w['start']))} --> {ts(w['end'])}\n{w['text']}\n")
Path(sys.argv[1]).parent.mkdir(parents=True, exist_ok=True)
open(sys.argv[1], 'w').write('\n'.join(out))
# check: the captions concatenate to the locked narration exactly
locked = ' '.join(json.load(open(ROOT / 'script' / 'narration_locked.json')))
joined = ' '.join(w['text'] for w in c)
assert joined == locked, 'captions differ from the locked narration'
print(sys.argv[1], len(c), 'cues; text matches the locked narration exactly')
