#!/usr/bin/env python3
"""Download ElevenLabs connector outputs (signed content URLs) into the project.

The ElevenLabs connector returns each generation as a signed MP3 URL (valid ~2 h). This helper
reads lines of "<dest_path> <url>" from stdin, downloads each file, and prints its duration, peak
and loudness so takes can be compared without listening.

  python3 tools/el_fetch.py < fetch_list.txt
"""
import json
import subprocess
import sys
import urllib.request


def probe(path):
    d = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                       capture_output=True, text=True).stdout.strip()
    r = subprocess.run(["ffmpeg", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    i = [l for l in r.splitlines() if l.strip().startswith("I:")]
    p = [l for l in r.splitlines() if l.strip().startswith("Peak:")]
    return float(d or 0), (i[-1].split()[1] if i else "?"), (p[-1].split()[1] if p else "?")


for line in sys.stdin:
    line = line.strip()
    if not line or line.startswith("#"):
        continue
    dest, url = line.split(None, 1)
    with urllib.request.urlopen(url, timeout=60) as r, open(dest, "wb") as f:
        f.write(r.read())
    dur, lufs, peak = probe(dest)
    print(json.dumps({"file": dest, "duration": round(dur, 3), "lufs": lufs, "true_peak": peak}))
