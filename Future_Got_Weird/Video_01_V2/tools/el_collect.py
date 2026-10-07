#!/usr/bin/env python3
"""Download ElevenLabs takes whose signed URLs appeared in this session's tool results.

The connector's status replies carry signed storage URLs (valid ~2 h). Instead of copying them by hand, this scans
the Claude Code session transcripts (main + subagents, *.jsonl) for
  .../content_generation/<session_id>/<generation_id>/content.mp3?<signature>
and downloads the most recent URL for every session listed in a sessions TSV.

  python3 tools/el_collect.py <sessions.tsv> <out_dir> [--transcripts DIR]

sessions.tsv columns: section, flow_id, node_id, session_ids (comma separated, in take order t1..t4).
Writes <out_dir>/<section>_t<k>.mp3 and <out_dir>/registry.tsv (section, take, session, generation, bytes).
Takes already on disk are skipped. Missing URLs are reported, not fatal.
"""
import argparse
import glob
import os
import re
import sys
import urllib.request

ap = argparse.ArgumentParser()
ap.add_argument("sessions")
ap.add_argument("out")
ap.add_argument("--transcripts", default=os.environ.get("TRANSCRIPTS_DIR", "transcripts"), help="directory of the generation-session logs to scan (env TRANSCRIPTS_DIR)")
a = ap.parse_args()

pat = re.compile(r"https://storage\.googleapis\.com/xi-backend/database/workspace/[0-9a-f]+/content_generation/"
                 r"([A-Za-z0-9]+)/([A-Za-z0-9]+)/content\.(mp3|wav)\?[A-Za-z0-9%=&._\-]+")
latest = {}
files = sorted(glob.glob(os.path.join(a.transcripts, "**", "*.jsonl"), recursive=True), key=os.path.getmtime)
for f in files:
    with open(f, encoding="utf-8", errors="ignore") as fh:
        for line in fh:
            if "content_generation/" not in line:
                continue
            for m in pat.finditer(line.replace("\\u0026", "&")):
                latest[m.group(1)] = (m.group(2), m.group(0))   # later lines / newer files win

os.makedirs(a.out, exist_ok=True)
reg_path = os.path.join(a.out, "registry.tsv")
reg = {}
if os.path.exists(reg_path):
    for ln in open(reg_path).read().splitlines()[1:]:
        p = ln.split("\t")
        reg[(p[0], p[1])] = ln
missing = []
for ln in open(a.sessions).read().splitlines()[1:]:
    sec, flow, node, sess = ln.split("\t")
    for k, sid in enumerate(sess.split(","), 1):
        dest = os.path.join(a.out, f"{sec}_t{k}.mp3")
        if os.path.exists(dest) and os.path.getsize(dest) > 1000:
            continue
        if sid not in latest:
            missing.append(f"{sec}_t{k} ({sid})")
            continue
        gen, url = latest[sid]
        try:
            with urllib.request.urlopen(url, timeout=60) as r, open(dest, "wb") as out:
                out.write(r.read())
        except Exception as e:  # expired signature or transient error: report and move on
            missing.append(f"{sec}_t{k} ({sid}): {e}")
            continue
        reg[(sec, f"t{k}")] = "\t".join([sec, f"t{k}", sid, gen, str(os.path.getsize(dest)), flow, node])
        print("got", os.path.basename(dest), os.path.getsize(dest))
with open(reg_path, "w") as fh:
    fh.write("section\ttake\tsession\tgeneration\tbytes\tflow\tnode\n")
    for key in sorted(reg):
        fh.write(reg[key] + "\n")
print("missing:", missing if missing else "none")
