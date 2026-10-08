#!/usr/bin/env python3
"""Draft of tools/export_script.py for V2/V3: writes FINAL_SCRIPT.md from narration_segments.json + timeline.json,
with the voice and runtime taken from the records instead of a hard-coded pass-2 sentence."""
import json, os, sys
ROOT = sys.argv[1]; OUT = sys.argv[2]
doc = json.load(open(os.path.join(ROOT, "script/narration_segments.json"), encoding="utf-8"))
tl = json.load(open(os.path.join(ROOT, "source/src/data/timeline.json"), encoding="utf-8"))
fps = tl["fps"]
seg_t = {s["id"]: s["from"] / fps for s in tl["segments"]}
sc_t = {s["id"]: (s["from"] / fps, s["to"] / fps) for s in tl["scenes"]}
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
def mmss(t, d=1):
    return f"{int(t // 60)}:{t % 60:0{3 + d}.{d}f}"
v = tl.get("voice", {})
words = sum(len(s["text"].split()) for s in doc["segments"])
dur = tl["durationInFrames"] / fps
out = [f"# {doc['title']} — final script ({doc['version']})", "",
       f"{words} spoken words in {len(doc['segments'])} segments · runtime {mmss(dur, 2)} ({tl['durationInFrames']} frames at {fps} fps) · "
       f"narration: ElevenLabs {v.get('model', doc.get('model'))}, voice “{v.get('voice_name', doc.get('voice_name'))}” "
       f"({v.get('voice_id', doc.get('voice_id'))}). Timings are the speech starts of the selected takes "
       f"(`source/src/data/timeline.json`, engine `{tl['engine']}`).", "",
       "Text below is the display / subtitle text. The Eleven v4 prompts (delivery tags, IPA) are in "
       "`script/narration_segments.json` (`tts`). Pronunciation: Kalai = “kuh-LIE” (/kəˈlaɪ/).", "",
       "On-screen labels name every model and date; the claim-to-source ledger and the description's Sources list "
       "support each claim.", ""]
cur = None
for s in doc["segments"]:
    if s["scene"] != cur:
        cur = s["scene"]
        a, b = sc_t[cur]
        out += ["", f"## {ACTS.get(cur, cur)}  ·  {mmss(a)}–{mmss(b)}", ""]
    t = seg_t.get(s["id"], 0)
    out.append(f"**[{mmss(t)}] {s['id']}** {s['text']}")
    out.append("")
open(OUT, "w", encoding="utf-8").write("\n".join(out))
print("wrote", OUT, words, "words")
