#!/usr/bin/env python3
"""Verify every at('segment', 'word') cue used in the Remotion scenes exists in the timeline."""
import json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tl = json.load(open(os.path.join(ROOT, "source/src/data/timeline.json"), encoding="utf-8"))
norm = lambda s: re.sub(r"[^a-z0-9']", "", s.lower().replace("’", "'").replace("‘", "'"))
segs = {s["id"]: [norm(w["w"]) for w in s["words"]] for s in tl["segments"]}
bad = 0
for dp, _, fs in os.walk(os.path.join(ROOT, "source/src")):
    for f in fs:
        if not f.endswith(".tsx"):
            continue
        txt = open(os.path.join(dp, f), encoding="utf-8").read()
        for m in re.finditer(r"""at\(\s*'(s\d+b?)'\s*(?:,\s*(['"])(.*?)\2\s*(?:,\s*(\d+))?)?\s*\)""", txt):
            sid, word, occ = m.group(1), m.group(3), int(m.group(4) or 1)
            if sid not in segs:
                print(f"{f}: unknown segment {sid}"); bad += 1; continue
            if word is not None and segs[sid].count(norm(word)) < occ:
                print(f"{f}: '{word}' (#{occ}) not in {sid}"); bad += 1
        for m in re.finditer(r"segEnd\('(s\d+b?)'\)", txt):
            if m.group(1) not in segs:
                print(f"{f}: unknown segment {m.group(1)}"); bad += 1
print("cue check:", "OK" if not bad else f"{bad} problem(s)")
sys.exit(1 if bad else 0)
