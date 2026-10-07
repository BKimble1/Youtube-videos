#!/usr/bin/env python3
"""Save the forced-alignment word timings of every downloaded take.

Scribe run on a pinned TTS generation returns that generation's prompt words with start/end times. The status replies
(which land in this session's transcripts, main + subagents) carry, per transcript, a `words_download_url` and the
`source.url` of the audio it aligned. This script maps each source take (by its generation session id) to its words and
writes takes/<section>_t<k>.align.json = {"words": [{text, type, start, end}, ...]}.

  python3 tools/el_align_collect.py <takes_dir> [--transcripts DIR]

Uses takes/registry.tsv (written by tools/el_collect.py) for the take <-> session mapping.
"""
import argparse
import glob
import json
import os
import re
import urllib.request

ap = argparse.ArgumentParser()
ap.add_argument("takes")
ap.add_argument("--transcripts", default="/root/.claude/projects")
a = ap.parse_args()

reg = {}
for ln in open(os.path.join(a.takes, "registry.tsv")).read().splitlines()[1:]:
    p = ln.split("\t")
    reg[p[2]] = f"{p[0]}_{p[1]}"          # take session -> x01_t1

src_pat = re.compile(r"content_generation/([A-Za-z0-9]+)/[A-Za-z0-9]+/content\.mp3")
found = {}
files = sorted(glob.glob(os.path.join(a.transcripts, "**", "*.jsonl"), recursive=True), key=os.path.getmtime)


def walk(o):
    if isinstance(o, dict):
        if "words_download_url" in o and isinstance(o.get("source"), dict):
            yield o
        for v in o.values():
            yield from walk(v)
    elif isinstance(o, list):
        for v in o:
            yield from walk(v)


for f in files:
    with open(f, encoding="utf-8", errors="ignore") as fh:
        for line in fh:
            if "words_download_url" not in line:
                continue
            try:
                rec = json.loads(line)
            except json.JSONDecodeError:
                continue
            # tool results are nested as strings inside the transcript record: decode any JSON-looking string
            stack = [rec]
            while stack:
                o = stack.pop()
                if isinstance(o, str):
                    if "words_download_url" in o and o.lstrip().startswith("{"):
                        try:
                            stack.append(json.loads(o))
                        except json.JSONDecodeError:
                            pass
                    continue
                for t in walk(o):
                    m = src_pat.search(t["source"].get("url", ""))
                    if m and m.group(1) in reg:
                        found[reg[m.group(1)]] = (t.get("words"), t["words_download_url"])
                if isinstance(o, dict):
                    stack.extend(v for v in o.values() if isinstance(v, (str, list, dict)))
                elif isinstance(o, list):
                    stack.extend(v for v in o if isinstance(v, (str, list, dict)))

saved, missing = 0, []
for take in sorted(set(reg.values())):
    dest = os.path.join(a.takes, f"{take}.align.json")
    if os.path.exists(dest):
        continue
    if take not in found:
        missing.append(take)
        continue
    words, url = found[take]
    if not words:
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                data = json.loads(r.read())
            words = data.get("words", data) if isinstance(data, dict) else data
        except Exception as e:
            missing.append(f"{take}: {e}")
            continue
    json.dump({"words": words}, open(dest, "w", encoding="utf-8"), ensure_ascii=False)
    saved += 1
print(f"saved {saved} alignments; missing: {missing if missing else 'none'}")
