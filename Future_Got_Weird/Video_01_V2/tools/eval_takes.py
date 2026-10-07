#!/usr/bin/env python3
"""Objective comparison of narration takes (no listening required).

For each audio file it measures:
  - speaking rate (words per minute of phonation, pauses removed) and pause structure
  - pitch (Praat): median F0, range (10-90th percentile, semitones), variability (st. dev., semitones),
    which together indicate how expressive vs. monotone the read is
  - intensity variability across voiced frames (dB) and harmonics-to-noise ratio (voice clarity)
  - noise floor in pauses (dBFS) and integrated loudness / true peak
  - optional word error rate against the reference text, from a local Whisper-tiny pass

Usage:
  python3 tools/eval_takes.py --ref "reference text" [--asr] take1.mp3 take2.mp3 ...
  (--asr needs the local transformers.js Whisper set-up described in qa/QA_REPORT.md)
"""
import argparse
import json
import os
import re
import subprocess
import sys

import numpy as np
import parselmouth
from parselmouth.praat import call

SCRATCH = os.environ.get("ASR_SCRATCH", "/tmp/claude-0/-home-user-Youtube-videos/942fed74-9746-5c11-9bde-e8a953092ef0/scratchpad/tts")


def load(path, sr=44100):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64), sr


def pauses(x, sr, thr_db=-45, min_len=0.18):
    hop = int(0.01 * sr)
    frames = np.lib.stride_tricks.sliding_window_view(x, hop)[::hop]
    db = 20 * np.log10(np.sqrt((frames ** 2).mean(1)) + 1e-9)
    ref = np.percentile(db, 95)
    silent = db < ref + thr_db + 20  # relative threshold: 25 dB below the loud frames
    out, start = [], None
    for i, s in enumerate(silent):
        if s and start is None:
            start = i
        if not s and start is not None:
            if (i - start) * 0.01 >= min_len:
                out.append((start * 0.01, i * 0.01))
            start = None
    if start is not None and (len(silent) - start) * 0.01 >= min_len:
        out.append((start * 0.01, len(silent) * 0.01))
    floor = np.percentile(db[silent], 50) if silent.any() else float("nan")
    return out, floor


def loudness(path):
    r = subprocess.run(["ffmpeg", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    i = [l for l in r.splitlines() if l.strip().startswith("I:")]
    p = [l for l in r.splitlines() if l.strip().startswith("Peak:")]
    return float(i[-1].split()[1]), float(p[-1].split()[1])


def norm_words(t):
    t = t.lower().replace("’", "'")
    t = re.sub(r"/[^/]*/", "kalai's", t)  # IPA spans in the TTS prompt are spoken as the name
    return re.findall(r"[a-z0-9']+", t)


def wer(ref, hyp):
    r, h = norm_words(ref), norm_words(hyp)
    d = np.zeros((len(r) + 1, len(h) + 1), int)
    d[:, 0] = range(len(r) + 1)
    d[0, :] = range(len(h) + 1)
    for i in range(1, len(r) + 1):
        for j in range(1, len(h) + 1):
            d[i, j] = min(d[i - 1, j] + 1, d[i, j - 1] + 1, d[i - 1, j - 1] + (r[i - 1] != h[j - 1]))
    return d[-1, -1] / max(1, len(r))


def asr(files):
    script = os.path.join(SCRATCH, "work", "asr_check.mjs")
    out = subprocess.run(["node", script, SCRATCH] + files, capture_output=True, text=True).stdout
    res = {}
    for line in out.splitlines():
        try:
            o = json.loads(line)
            res[o["file"]] = o["text"]
        except Exception:
            pass
    return res


def analyse(path, n_words):
    x, sr = load(path)
    dur = len(x) / sr
    ps, floor = pauses(x, sr)
    lead = ps[0][1] if ps and ps[0][0] == 0 else 0.0
    tail = dur - ps[-1][0] if ps and abs(ps[-1][1] - dur) < 0.02 else 0.0
    inner = [p for p in ps if p[0] > 0 and abs(p[1] - dur) > 0.02]
    pause_total = sum(b - a for a, b in inner)
    speak = dur - lead - tail - pause_total
    snd = parselmouth.Sound(x, sr)
    pitch = snd.to_pitch_ac(time_step=0.01, pitch_floor=65, pitch_ceiling=400)
    f0 = pitch.selected_array["frequency"]
    f0 = f0[f0 > 0]
    st = 12 * np.log2(f0 / np.median(f0))
    inten = snd.to_intensity(minimum_pitch=75)
    iv = inten.values[0]
    harm = snd.to_harmonicity_cc(time_step=0.01, minimum_pitch=75)
    hnr = call(harm, "Get mean", 0, 0)
    lufs, tp = loudness(path)
    return {
        "file": os.path.basename(path),
        "duration_s": round(dur, 2),
        "wpm_speaking": round(n_words / (speak / 60), 1),
        "wpm_overall": round(n_words / ((dur - lead - tail) / 60), 1),
        "pauses_over_180ms": len(inner),
        "pause_list": [[round(a, 2), round(b - a, 2)] for a, b in inner],
        "f0_median_hz": round(float(np.median(f0)), 1),
        "f0_range_st_10_90": round(float(np.percentile(st, 90) - np.percentile(st, 10)), 2),
        "f0_sd_st": round(float(np.std(st)), 2),
        "intensity_sd_db": round(float(np.std(iv[iv > np.percentile(iv, 30)])), 2),
        "hnr_db": round(hnr, 1),
        "noise_floor_dbfs": round(float(floor), 1),
        "lufs": lufs,
        "true_peak_dbtp": tp,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ref", required=True)
    ap.add_argument("--asr", action="store_true")
    ap.add_argument("files", nargs="+")
    a = ap.parse_args()
    n = len(norm_words(a.ref))
    rows = [analyse(f, n) for f in a.files]
    if a.asr:
        hyp = asr(a.files)
        for r in rows:
            h = hyp.get(r["file"], "")
            r["asr_text"] = h
            r["wer_whisper_tiny"] = round(wer(a.ref, h), 3)
    print(json.dumps(rows, indent=1))


if __name__ == "__main__":
    sys.exit(main())
