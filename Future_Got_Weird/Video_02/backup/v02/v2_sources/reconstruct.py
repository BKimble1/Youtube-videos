#!/usr/bin/env python3
"""Rebuild the original files from their .partNNN pieces and verify every SHA-256 checksum.

Usage:  python reconstruct.py [output_dir]      (default: this folder; works on Windows, macOS, Linux)
"""
import hashlib
import json
import os
import sys

here = os.path.dirname(os.path.abspath(__file__))
out = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else here
os.makedirs(out, exist_ok=True)
manifest = json.load(open(os.path.join(here, "manifest.json")))
ok = True
for fe in manifest["files"]:
    h = hashlib.sha256()
    tmp = os.path.join(out, fe["name"] + ".tmp")
    with open(tmp, "wb") as o:
        for p in fe["parts"]:
            data = open(os.path.join(here, p["name"]), "rb").read()
            if hashlib.sha256(data).hexdigest() != p["sha256"] or len(data) != p["bytes"]:
                print("BAD PART", p["name"])
                ok = False
            h.update(data)
            o.write(data)
    if h.hexdigest() == fe["sha256"] and os.path.getsize(tmp) == fe["bytes"]:
        os.replace(tmp, os.path.join(out, fe["name"]))
        print("OK     ", fe["name"])
    else:
        print("FAILED ", fe["name"], "(checksum mismatch; partial file kept as .tmp)")
        ok = False
print("All files rebuilt and verified." if ok else "Some files failed verification.")
sys.exit(0 if ok else 1)
