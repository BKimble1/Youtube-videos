"""Measured QA for the V4 master. Writes qa/v4/qa_v4_results.json and prints a summary.

Checks: probe; loudness (EBU R128); hard cuts and shot lengths (scene score 0.10); frozen stretches (freezedetect,
>= 1.5 s); black frames; silences; exact duplicate consecutive frames (frame MD5 on a 480x270 decode); single-frame
"pop" candidates (a frame-difference spike that is not a cut: d[t] > 4x both neighbours and > 6); audio offset of the
master against the mix; caption timing.
Usage: python3 tools/v4/qa_v4.py [master.mp4]
"""
import json, os, re, subprocess, sys

import numpy as np

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
MASTER = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "exports", "FGW_RobotsDestroy_v4_UPLOAD_1080p.mp4")
OUT = os.path.join(ROOT, "qa", "v4")
os.makedirs(OUT, exist_ok=True)
res = {"file": os.path.relpath(MASTER, ROOT)}


def run(args):
    return subprocess.run(args, capture_output=True, text=True)


pr = json.loads(run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", MASTER]).stdout)
v = next(s for s in pr["streams"] if s["codec_type"] == "video")
a = next(s for s in pr["streams"] if s["codec_type"] == "audio")
res["probe"] = {
    "duration_s": float(pr["format"]["duration"]), "size_mib": round(int(pr["format"]["size"]) / 2 ** 20, 1),
    "video": f"{v['codec_name']} {v.get('profile', '')} {v['width']}x{v['height']} {v['r_frame_rate']} fps, {v.get('pix_fmt')}, frames {v.get('nb_frames')}",
    "color": f"{v.get('color_space')}/{v.get('color_transfer')}/{v.get('color_primaries')}",
    "audio": f"{a['codec_name']} {a['sample_rate']} Hz {a['channels']} ch {int(a.get('bit_rate', 0)) // 1000} kbps",
    "bitrate_mbps": round(int(pr["format"]["bit_rate"]) / 1e6, 2),
}
e = run(["ffmpeg", "-hide_banner", "-nostats", "-i", MASTER, "-map", "0:a", "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr
summ = e[e.rfind("Summary:"):]
res["loudness"] = {"integrated_lufs": float(re.search(r"I:\s+(-?[\d.]+) LUFS", summ).group(1)),
                   "lra_lu": float(re.search(r"LRA:\s+(-?[\d.]+) LU", summ).group(1)),
                   "true_peak_dbtp": float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", summ).group(1))}
e = run(["ffmpeg", "-hide_banner", "-nostats", "-i", MASTER, "-vf", "scale=480:270,select='gt(scene,0.10)',showinfo", "-an", "-f", "null", "-"]).stderr
cuts = [float(x) for x in re.findall(r"pts_time:([\d.]+)", e)]
dur = res["probe"]["duration_s"]
bounds = [0.0] + cuts + [dur]
shots = np.diff(bounds)
res["cuts"] = {"count": len(cuts), "segments": len(shots), "mean_s": round(float(np.mean(shots)), 2), "median_s": round(float(np.median(shots)), 2),
               "longest": sorted([(round(float(s), 2), round(bounds[i], 2)) for i, s in enumerate(shots)], reverse=True)[:8],
               "first_20s": int(sum(1 for c in cuts if c < 20.0)) + 1, "times": [round(c, 2) for c in cuts]}
e = run(["ffmpeg", "-hide_banner", "-nostats", "-i", MASTER, "-vf", "scale=480:270,freezedetect=n=0.002:d=1.5", "-an", "-f", "null", "-"]).stderr
fs = re.findall(r"freeze_start: ([\d.]+)", e); fd = re.findall(r"freeze_duration: ([\d.]+)", e)
res["frozen"] = [(round(float(s), 2), round(float(d), 2)) for s, d in zip(fs, fd)]
e = run(["ffmpeg", "-hide_banner", "-nostats", "-i", MASTER, "-vf", "scale=480:270,blackdetect=d=0.1:pix_th=0.06", "-an", "-f", "null", "-"]).stderr
res["black"] = re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", e)
e = run(["ffmpeg", "-hide_banner", "-nostats", "-i", MASTER, "-map", "0:a", "-af", "silencedetect=n=-50dB:d=1.0", "-f", "null", "-"]).stderr
res["silences"] = re.findall(r"silence_start: ([\d.]+)", e)
# per-frame decode at 160x90 grey: exact duplicates and single-frame spikes
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", MASTER, "-vf", "scale=160:90,format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
F = np.frombuffer(raw, dtype=np.uint8).reshape(-1, 90, 160).astype(np.int16)
d = np.abs(np.diff(F, axis=0)).mean(axis=(1, 2))            # d[i] = change from frame i to i+1
dups = [i + 1 for i in range(len(d)) if d[i] == 0.0]
runs = []
for i in dups:
    if runs and i == runs[-1][1] + 1: runs[-1][1] = i
    else: runs.append([i, i])
res["duplicates"] = {"frames": len(dups), "runs_over_2": [(round(r0 / 30, 2), r1 - r0 + 1) for r0, r1 in runs if r1 - r0 + 1 > 2]}
cut_frames = {int(round(c * 30)) for c in cuts}
pops = []
for i in range(1, len(d) - 1):
    if d[i] > 6 and d[i] > 4 * d[i - 1] and d[i] > 4 * d[i + 1]:
        f = i + 1
        if not any(abs(f - c) <= 1 for c in cut_frames):
            pops.append(round(f / 30, 2))
res["pop_candidates"] = pops


def pcm(path, t=30):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-t", str(t), "-ac", "1", "-ar", "8000", "-f", "s16le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, dtype="<i2").astype(np.float64)


x, y = pcm(MASTER), pcm(os.path.join(ROOT, "audio", "v4", "mix", "mix_v4.wav"))
n = min(len(x), len(y))
c = np.fft.irfft(np.fft.rfft(x[:n], 2 * n) * np.conj(np.fft.rfft(y[:n], 2 * n)))
lag = int(np.argmax(np.concatenate([c[-400:], c[:401]]))) - 400
res["audio_offset_ms"] = round(lag / 8.0, 2)
srt = open(os.path.join(ROOT, "captions", "FGW_RobotsDestroy_v4.srt"), encoding="utf-8").read().strip().split("\n\n")


def tsec(s):
    h, m, r = s.split(":"); return int(h) * 3600 + int(m) * 60 + float(r.replace(",", "."))


cues = [(tsec(b.split("\n")[1].split(" --> ")[0]), tsec(b.split("\n")[1].split(" --> ")[1])) for b in srt]
overl = sum(1 for i in range(len(cues) - 1) if cues[i][1] > cues[i + 1][0] + 1e-3)
res["captions"] = {"cues": len(cues), "first": cues[0][0], "last_end": cues[-1][1], "overlaps": overl,
                   "max_line_chars": max(len(l) for b in srt for l in b.split("\n")[2:])}
json.dump(res, open(os.path.join(OUT, os.environ.get("QA_OUT", "qa_v4_results.json")), "w"), indent=1)
print(json.dumps({k: v for k, v in res.items() if k != "cuts"}, indent=1))
print("cuts:", {k: v for k, v in res["cuts"].items() if k != "times"})
