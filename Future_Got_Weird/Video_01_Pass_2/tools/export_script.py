#!/usr/bin/env python3
"""Write script/FINAL_SCRIPT.md from narration_segments.json + measured timeline."""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
doc = json.load(open(os.path.join(ROOT, "script/narration_segments.json"), encoding="utf-8"))
tl = json.load(open(os.path.join(ROOT, "source/src/data/timeline.json"), encoding="utf-8"))
seg_t = {s["id"]: s["from"] / tl["fps"] for s in tl["segments"]}
ACTS = {
    "S1": "Scene 1 — The counter (hook)",
    "S2": "Scene 2 — The short version (title moment and promise)",
    "S3": "Scene 3 — The token machine (mechanism)",
    "S4": "Scene 4 — The library (patterns in, pattern-shaped answers out)",
    "S5": "Scene 5 — The record (the real thesis)",
    "S6": "Scene 6 — The game show (the quiz and the scoring rule)",
    "S7": "Scene 7 — Benchmarks (Table 2)",
    "S8": "Scene 8 — What helps, and what it does not guarantee",
    "S9": "Scene 9 — Verify (two questions)",
    "S10": "Scene 10 — Payoff and end card",
}
words = sum(len(s["text"].split()) for s in doc["segments"])
out = [f"# {doc['title']} — final script ({doc['version']})", "",
       f"{words} spoken words · measured runtime {tl['durationSeconds']:.1f} s with the {tl['engine']} narration"
       + (" (ElevenLabs Eleven v4, voice Marcus K; timings below are from the final takes)." if tl["engine"] == "elevenlabs"
          else " (timings below are from that measured take; they will shift slightly with the premium voice)."), "",
       "Pronunciation: Kalai = “kuh-LIE”. On-screen labels name every model and date; see research/sources.md for each claim.", ""]
cur = None
for s in doc["segments"]:
    if s["scene"] != cur:
        cur = s["scene"]
        out += ["", f"## {ACTS.get(cur, cur)}", ""]
    t = seg_t.get(s["id"], 0)
    out.append(f"**[{int(t//60)}:{t%60:04.1f}] {s['id']}** {s['text']}")
    out.append("")
open(os.path.join(ROOT, "script/FINAL_SCRIPT.md"), "w", encoding="utf-8").write("\n".join(out))
print("wrote script/FINAL_SCRIPT.md", words, "words")
