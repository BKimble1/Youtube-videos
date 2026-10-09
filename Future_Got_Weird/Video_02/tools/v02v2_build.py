#!/usr/bin/env python3
"""Video 02 v2: turn the edited script (v2/script_v2.json) into the narration pipeline's inputs.

  python3 tools/v02v2_build.py            -> script/narration_segments.json, script/narration_sections.json,
                                             script/narration_selection.json (reused lines pre-filled), script/SCRIPT.md
  python3 tools/v02v2_build.py --blocks   -> also print the new recording blocks (for tools/wf_narration.js args)

Lines kept verbatim from v1 keep their v1 id and their selected v1 take (script/v1/narration_selection.json); their v1
recording section is carried into narration_sections.json unchanged so the assembler can cut the line out of that take.
New or changed lines get new ids (n01..) and are grouped into new recording blocks y01.. (consecutive new lines of the
same story section, at most 4 lines / 420 characters per block, so the voice performs them as one coherent passage;
each block is spoken with its neighbouring lines as context, and only its own lines are kept).
The v1 script files are archived in script/v1/.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TAG = re.compile(r"\[[^\]]*\]")
LIDAR = "/ˈlaɪdɑːr/"
IPA = {LIDAR: "LiDAR"}


def words(s):
    return [w for w in re.findall(r"[A-Za-z0-9'’\-/ˈɑːɪɛəʊæʃʒθðŋɔʌ]+", s) if re.search(r"[A-Za-z0-9ɑɪɛəʊæʃʒθðŋɔʌ]", w)]


def tts_words(tts):
    t = TAG.sub("", tts)
    for k, v in IPA.items():
        t = t.replace(k, v)
    return [w.lower().strip("'’") for w in words(t.replace("…", " "))]


def main():
    v2 = json.load(open(os.path.join(ROOT, "v2/script_v2.json"), encoding="utf-8"))
    v1segs = json.load(open(os.path.join(ROOT, "script/v1/narration_segments.json"), encoding="utf-8"))
    v1secs = json.load(open(os.path.join(ROOT, "script/v1/narration_sections.json"), encoding="utf-8"))
    v1sel = json.load(open(os.path.join(ROOT, "script/v1/narration_selection.json"), encoding="utf-8"))
    v1text = {s["id"]: s["text"] for s in v1segs["segments"]}
    v1sec_of = {sid: sec for sec in v1secs["sections"] for sid in sec["segments"]}
    lines = v2["lines"]
    problems = []
    seen = set()
    for ln in lines:
        sid, text, tts = ln["id"], ln["text"], ln.get("tts") or ln["text"]
        ln["tts"] = tts
        if sid in seen:
            problems.append(f"{sid}: duplicate id")
        seen.add(sid)
        if "—" in text or "—" in tts:
            problems.append(f"{sid}: em dash")
        a = tts_words(tts)
        b = [w.lower().strip("'’") for w in words(text)]
        if a != b:
            problems.append(f"{sid}: tts words differ from text\n   {a}\n   {b}")
        if re.fullmatch(r"s\d\d", sid):
            if v1text.get(sid) != text:
                problems.append(f"{sid}: a v1 id must keep the v1 text verbatim (else give it a new id)")
            ln["reuse_v1"] = True
        else:
            ln["reuse_v1"] = False
    if problems:
        sys.exit("script_v2.json problems:\n" + "\n".join(problems))

    # recording sections: v1 sections for reused lines, new blocks for the rest
    sections, used_v1 = [], []
    block, blocks = [], []

    def flush():
        if block:
            blocks.append(list(block))
            block.clear()

    prev_story = None
    for ln in lines:
        if ln["reuse_v1"]:
            flush()
            sec = v1sec_of[ln["id"]]
            if sec["id"] not in used_v1:
                used_v1.append(sec["id"])
            prev_story = None
            continue
        chars = sum(len(x["tts"]) for x in block) + len(ln["tts"])
        if block and (ln["section"] != prev_story or len(block) >= 4 or chars > 420):
            flush()
        block.append(ln)
        prev_story = ln["section"]
    flush()
    for sid in used_v1:
        sections.append(next(s for s in v1secs["sections"] if s["id"] == sid))
    # each block is performed with the line before it and the line after it as spoken context ("ctx:<id>" segments);
    # only the block's own lines are ever selected, so no block is read as an isolated announcement
    pos = {ln["id"]: i for i, ln in enumerate(lines)}
    for k, b in enumerate(blocks, 1):
        i0, i1 = pos[b[0]["id"]], pos[b[-1]["id"]]
        seq = ([lines[i0 - 1]] if i0 > 0 else []) + b + ([lines[i1 + 1]] if i1 + 1 < len(lines) else [])
        ctx = {x["id"] for x in seq} - {x["id"] for x in b}
        prompt = "\n\n".join(x["tts"] for x in seq)
        sections.append({"id": f"y{k:02d}", "segments": [("ctx:" if x["id"] in ctx else "") + x["id"] for x in seq],
                         "prompt": prompt, "words_per_segment": [len(words(x["text"])) for x in seq],
                         "chars": len(prompt)})

    # second-pass retakes (v2/retakes.json): one target line between its spoken neighbours; same words, new beats
    rp = os.path.join(ROOT, "v2/retakes.json")
    if os.path.exists(rp):
        textof = {ln["id"]: ln["text"] for ln in lines}
        for rb in json.load(open(rp, encoding="utf-8"))["blocks"]:
            tid = rb["target"]
            if tts_words(rb["tts"]) != [w.lower().strip("'’") for w in words(textof[tid])]:
                sys.exit(f"retake {rb['id']}: words differ from {tid}")
            seq = [("ctx:before", rb["context_before"]), (tid, rb["tts"]), ("ctx:after", rb["context_after"])]
            prompt = "\n\n".join(x[1] for x in seq)
            sections.append({"id": rb["id"], "segments": [x[0] for x in seq], "prompt": prompt, "retake_of": tid,
                             "words_per_segment": [len(tts_words(x[1])) for x in seq], "chars": len(prompt)})

    meta = {k: v1segs[k] for k in ("title", "channel", "voice_name", "voice_id", "model")}
    meta["version"] = "v2 editorial pass (2026-10-09)"
    meta["notes"] = v1segs["notes"]
    vt = v2.get("timing", {})
    meta["timing"] = {"lead_in_ms": vt.get("lead_in_ms", 1000), "end_screen_ms": vt.get("end_screen_ms", 10000),
                      "end_screen_voice_offset_ms": vt.get("end_screen_voice_offset_ms", 200),
                      "pauses_are_caps": True}
    segs = [{"id": ln["id"], "scene": ln["scene"], "text": ln["text"], "tts": ln["tts"],
             "pause_after_ms": int(ln.get("pause_ms", 300)), "claims": ln.get("claims", []),
             "direction": ln.get("direction", ""), "story_section": ln["section"], "reuse_v1": ln["reuse_v1"],
             **({"inner_pause_cap_ms": ln["inner_pause_cap_ms"]} if "inner_pause_cap_ms" in ln else {})}
            for ln in lines]
    json.dump({**meta, "segments": segs}, open(os.path.join(ROOT, "script/narration_segments.json"), "w", encoding="utf-8"),
              indent=1, ensure_ascii=False)
    json.dump({"model": v1secs["model"], "voice_name": v1secs["voice_name"], "voice_id": v1secs["voice_id"],
               "sections": sections}, open(os.path.join(ROOT, "script/narration_sections.json"), "w", encoding="utf-8"),
              indent=1, ensure_ascii=False)
    sel_path = os.path.join(ROOT, "script/narration_selection.json")
    old = json.load(open(sel_path)) if os.path.exists(sel_path) else {}
    sel = {}
    for ln in lines:
        if ln["id"] in old and old[ln["id"]].startswith("y"):   # a v2 take (incl. a retake of a v1 line) stays chosen
            sel[ln["id"]] = old[ln["id"]]
        elif ln["reuse_v1"]:
            sel[ln["id"]] = v1sel[ln["id"]]
        elif False:
            sel[ln["id"]] = old[ln["id"]]
    json.dump(sel, open(sel_path, "w"), indent=1)
    open(sel_path, "a").write("\n")

    # readable script
    nw = sum(len(words(ln["text"])) for ln in lines)
    out = [f"# {meta['title']} (v2 script)", "",
           f"{len(lines)} lines, {nw} words; {sum(ln['reuse_v1'] for ln in lines)} reused verbatim from v1 (their v1 takes), "
           f"{sum(not ln['reuse_v1'] for ln in lines)} new or changed (recorded in blocks y01..y{len(blocks):02d}).", ""]
    for sec in v2["sections"]:
        out += [f"## {sec['id']} · {sec['title']}", f"_{sec.get('question', '')}_", ""]
        for sid in sec["lines"]:
            ln = next(x for x in lines if x["id"] == sid)
            out.append(f"**{sid}**{' (v1 take)' if ln['reuse_v1'] else ''} {ln['text']}  `{', '.join(ln.get('claims', []))}`")
            out.append("")
    open(os.path.join(ROOT, "script/SCRIPT.md"), "w", encoding="utf-8").write("\n".join(out))
    print(f"{len(lines)} lines, {nw} words; reused {sum(ln['reuse_v1'] for ln in lines)}; new blocks {len(blocks)}; "
          f"v1 sections carried: {', '.join(used_v1) or 'none'}")
    if "--blocks" in sys.argv:
        only = sys.argv[sys.argv.index("--only") + 1].split(",") if "--only" in sys.argv else None
        print(json.dumps([{"id": s["id"], "prompt": s["prompt"]} for s in sections
                          if s["id"].startswith("y") and (not only or s["id"] in only)], indent=1,
                         ensure_ascii=False))


if __name__ == "__main__":
    main()
