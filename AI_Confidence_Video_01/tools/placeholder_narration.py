#!/usr/bin/env python3
"""Silent placeholder narration (timed at a fixed WPM) so visuals can be built before TTS exists."""
import json, os, sys
import numpy as np, soundfile as sf
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WPM = float(sys.argv[1]) if len(sys.argv) > 1 else 160
out = os.path.join(ROOT, "audio/narration/placeholder")
os.makedirs(out, exist_ok=True)
doc = json.load(open(os.path.join(ROOT, "script/narration_segments.json"), encoding="utf-8"))
segs = []
for s in doc["segments"]:
    n = len(s["text"].split())
    dur = n / WPM * 60 + 0.25
    sf.write(os.path.join(out, f"{s['id']}.wav"), np.zeros(int(dur * 48000), dtype=np.float32), 48000)
    segs.append({"id": s["id"], "file": f"{s['id']}.wav", "duration_s": dur, "words_file": None})
json.dump({"engine": "placeholder", "voice": "silent", "segments": segs}, open(os.path.join(out, "manifest.json"), "w"), indent=1)
print("placeholder narration:", len(segs), "segments")
