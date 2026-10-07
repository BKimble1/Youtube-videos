#!/usr/bin/env python3
"""Score every downloaded take of every narration block (tools/eval_takes.py metrics + local ASR).

Writes audio/narration/elevenlabs/takes/eval_blocks.json and prints a ranking per block.
Usage: python3 tools/eval_blocks.py [--no-asr]
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from eval_takes import analyse, asr, norm_words, wer  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TAKES = os.path.join(ROOT, "audio/narration/elevenlabs/takes")


def main():
    blocks = json.load(open(os.path.join(ROOT, "script/narration_blocks.json"), encoding="utf-8"))["blocks"]
    segs = {s["id"]: s["text"] for s in json.load(open(os.path.join(ROOT, "script/narration_segments.json"),
                                                         encoding="utf-8"))["segments"]}
    out = {}
    for b in blocks:
        ref = " ".join(segs[s] for s in b["segments"])
        files = sorted(os.path.join(TAKES, f) for f in os.listdir(TAKES)
                       if f.startswith(b["id"] + "_t") and f.endswith(".mp3"))
        n = len(norm_words(ref))
        rows = [analyse(f, n) for f in files]
        if "--no-asr" not in sys.argv:
            hyp = asr(files)
            for r in rows:
                r["asr_text"] = hyp.get(r["file"], "")
                r["wer_whisper_tiny"] = round(wer(ref, r["asr_text"]), 3)
        out[b["id"]] = rows
        print(f"== {b['id']}")
        for r in rows:
            print(f"  {r['file']:<12} dur {r['duration_s']:5.1f}  wpm {r['wpm_overall']:5.1f}  pauses {r['pauses_over_180ms']:2d}"
                  f"  f0rng {r['f0_range_st_10_90']:5.2f}  f0sd {r['f0_sd_st']:4.2f}  intSD {r['intensity_sd_db']:4.2f}"
                  f"  hnr {r['hnr_db']:4.1f}  floor {r['noise_floor_dbfs']:5.1f}  wer {r.get('wer_whisper_tiny', '-')}")
    with open(os.path.join(TAKES, "eval_blocks.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, indent=1, ensure_ascii=False)


if __name__ == "__main__":
    main()
