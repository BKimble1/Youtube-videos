#!/usr/bin/env python3
"""Group narration segments into delivery blocks for ElevenLabs generation (pass 2).

A block is several consecutive segments read in one take, so intonation flows across sentences.
Segment boundaries are recovered later from forced-alignment word timings (tools/el_assemble.py),
which needs each segment's Eleven v4 prompt to have the same word count as its display text.

Writes script/narration_blocks.json. Usage: python3 tools/el_blocks.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLOCKS = [
    ("b01", ["s01", "s02", "s03", "s04", "s05"]),        # hook: counter, three slips, verdict, joke 1
    ("b02", ["s06", "s07"]),                             # the short version (promise + mechanism)
    ("b03", ["s08", "s09", "s10", "s11", "s12"]),        # tokens / assembly apparatus
    ("b04", ["s13", "s14", "s15", "s16"]),               # the library
    ("b05", ["s17", "s18", "s19"]),                      # the real record + joke 2
    ("b06", ["s20", "s21", "s22", "s23", "s24"]),        # quiz, rules 1 + joke 3
    ("b07", ["s25", "s26", "s27"]),                      # rule change + benchmarks
    ("b08", ["s28"]),                                    # what helps
    ("b09", ["s29", "s30", "s31", "s32"]),               # verification demo
    ("b10", ["s33", "s34", "s35", "s36"]),               # payoff + callback joke 4 + sign-off
]


def main():
    doc = json.load(open(os.path.join(ROOT, "script/narration_segments.json"), encoding="utf-8"))
    segs = {s["id"]: s for s in doc["segments"]}
    order = [s["id"] for s in doc["segments"]]
    flat = [sid for _, ids in BLOCKS for sid in ids]
    assert flat == order, "blocks must cover every segment once, in script order"
    out = []
    for bid, ids in BLOCKS:
        parts = [segs[i].get("tts_v4", segs[i]["text"]) for i in ids]
        for i, p in zip(ids, parts):
            assert len(p.split()) == len(segs[i]["text"].split()), i
        prompt = "\n\n".join(parts)
        out.append({"id": bid, "segments": ids, "prompt": prompt,
                    "words_per_segment": [len(p.split()) for p in parts], "chars": len(prompt)})
    with open(os.path.join(ROOT, "script/narration_blocks.json"), "w", encoding="utf-8") as f:
        json.dump({"model": "eleven_v4", "voice_name": "Marcus K", "voice_id": "3H55HGnNE1XjYxigHSAS",
                   "blocks": out}, f, ensure_ascii=False, indent=1)
    for b in out:
        print(f"== {b['id']} ({b['chars']} chars, {sum(b['words_per_segment'])} words)")
        print(b["prompt"])
        print()
    print("total chars", sum(b["chars"] for b in out))


if __name__ == "__main__":
    main()
