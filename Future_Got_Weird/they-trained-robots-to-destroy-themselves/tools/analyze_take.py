"""Objective checks on a narration take (no listening involved).

Prints duration, integrated loudness, true peak, loudness range, clipped-sample count, and every pause
of 0.25 s or more (start, length). Used to compare takes and to spot dropped audio, long dead air,
clipping and level jumps between blocks. It cannot judge warmth, emphasis, pronunciation or comic timing.

Usage: python3 tools/analyze_take.py file.mp3 [file2.mp3 ...]
"""
import re, subprocess, sys

import numpy as np


def pcm(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", "44100", "-f", "s16le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype="<i2").astype(np.float32) / 32768.0


for path in sys.argv[1:]:
    err = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af",
                          "ebur128=peak=true,silencedetect=n=-40dB:d=0.25", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    summary = err[err.rfind("Summary:"):]
    I = re.search(r"I:\s+(-?[\d.]+) LUFS", summary)
    LRA = re.search(r"LRA:\s+(-?[\d.]+) LU", summary)
    TP = re.search(r"Peak:\s+(-?[\d.]+) dBFS", summary)
    starts = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", err)]
    ends = [(float(a), float(b)) for a, b in re.findall(r"silence_end: (-?[\d.]+) \| silence_duration: ([\d.]+)", err)]
    x = pcm(path)
    dur = len(x) / 44100
    clipped = int(np.sum(np.abs(x) > 0.999))
    print(f"== {path}")
    print(f"   duration {dur:.2f}s  I {I.group(1) if I else '?'} LUFS  LRA {LRA.group(1) if LRA else '?'} LU  "
          f"true peak {TP.group(1) if TP else '?'} dBFS  clipped samples {clipped}")
    pauses = [(e - d, d) for e, d in ends]
    print("   pauses >=0.25s: " + ", ".join(f"{s:.2f}s({d:.2f})" for s, d in pauses))
