#!/usr/bin/env python3
"""Write a provisional source/src/data/timeline.json from the script alone (no audio yet).

Word timings are estimated at a target speaking rate so scenes can be developed before the final
narration exists. tools/build_timeline.py overwrites this with measured timings. The JSON shape is
identical, so every at('segment', 'word') cue keeps working.
Usage: python3 tools/provisional_timeline.py [--wpm 163]
"""
import argparse
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_timeline import FPS, LEAD_IN_S, SCENE_LEAD_S, TAIL_S, estimate_words  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--wpm", type=float, default=163.0)
    args = ap.parse_args()
    doc = json.load(open(os.path.join(ROOT, "script/narration_segments.json"), encoding="utf-8"))
    t = LEAD_IN_S
    segs = []
    for s in doc["segments"]:
        words = s["text"].split()
        # duration from word count plus punctuation weight
        n = len(words)
        extra = sum(0.22 for w in words if re.search(r"[.?!]['\"’”]?$", w)) + sum(0.1 for w in words if re.search(r"[,;:]$", w))
        dur = n / args.wpm * 60 + extra
        est = estimate_words(s["text"], dur)
        segs.append({"id": s["id"], "scene": s["scene"], "text": s["text"], "start": t, "end": t + dur, "timing": "provisional",
                     "words_abs": [{"word": w["word"], "start": t + w["start"], "end": t + w["end"]} for w in est]})
        t += dur + s.get("pause_after_ms", 250) / 1000.0
    total = t + TAIL_S
    scene_ids = []
    for s in segs:
        if s["scene"] not in scene_ids:
            scene_ids.append(s["scene"])
    scenes = []
    for i, sid in enumerate(scene_ids):
        first = next(s for s in segs if s["scene"] == sid)
        scenes.append({"id": sid, "start": 0.0 if i == 0 else max(0.0, first["start"] - SCENE_LEAD_S)})
    for i, sc in enumerate(scenes):
        sc["end"] = scenes[i + 1]["start"] if i + 1 < len(scenes) else total
    f = lambda x: int(round(x * FPS))
    tl = {"fps": FPS, "engine": "provisional", "voice": {"engine": "provisional"},
          "durationInFrames": f(total), "durationSeconds": round(total, 3),
          "scenes": [{"id": s["id"], "from": f(s["start"]), "to": f(s["end"])} for s in scenes],
          "segments": [{"id": s["id"], "scene": s["scene"], "from": f(s["start"]), "to": f(s["end"]), "text": s["text"], "timing": s["timing"],
                        "words": [{"w": w["word"], "from": f(w["start"]), "to": f(w["end"])} for w in s["words_abs"]]} for s in segs],
          "cues": {}}
    os.makedirs(os.path.join(ROOT, "source/src/data"), exist_ok=True)
    json.dump(tl, open(os.path.join(ROOT, "source/src/data/timeline.json"), "w", encoding="utf-8"), indent=1)
    print(f"provisional timeline: {total:.1f}s ({int(total//60)}:{total%60:04.1f})")
    for sc in tl["scenes"]:
        print(f"  {sc['id']:<4} {sc['from']/FPS:7.2f} → {sc['to']/FPS:7.2f}")


if __name__ == "__main__":
    main()
