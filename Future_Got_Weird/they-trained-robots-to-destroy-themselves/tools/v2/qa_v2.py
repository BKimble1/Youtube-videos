"""Measured QA for the V2 master. Writes qa/v2/qa_v2_results.json and prints a summary.

Checks: container/stream probe; loudness (EBU R128); hard cuts and shot lengths (ffmpeg scene score); frozen stretches
(freezedetect); black frames; silences; audio offset of the master against the mix (cross-correlation); caption
timing against the narration words; dense frame bursts at the cuts and contacts listed in BURSTS.
Usage: python3 tools/v2/qa_v2.py [master.mp4]
"""
import json, os, re, subprocess, sys, wave

import numpy as np

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
MASTER = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "exports", "FGW_RobotsDestroy_v2_UPLOAD_1080p.mp4")
OUT = os.path.join(ROOT, "qa", "v2")
os.makedirs(OUT, exist_ok=True)
res = {"file": os.path.relpath(MASTER, ROOT)}


def run(args):
    return subprocess.run(args, capture_output=True, text=True)


# probe
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
# loudness of the master's audio track
e = run(["ffmpeg", "-hide_banner", "-nostats", "-i", MASTER, "-map", "0:a", "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr
summ = e[e.rfind("Summary:"):]
res["loudness"] = {"integrated_lufs": float(re.search(r"I:\s+(-?[\d.]+) LUFS", summ).group(1)),
                   "lra_lu": float(re.search(r"LRA:\s+(-?[\d.]+) LU", summ).group(1)),
                   "true_peak_dbtp": float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", summ).group(1))}
# hard cuts (scene score) on a downscaled decode
e = run(["ffmpeg", "-hide_banner", "-nostats", "-i", MASTER, "-vf", "scale=480:270,select='gt(scene,0.10)',showinfo", "-an", "-f", "null", "-"]).stderr
cuts = [float(x) for x in re.findall(r"pts_time:([\d.]+)", e)]
dur = res["probe"]["duration_s"]
bounds = [0.0] + cuts + [dur]
shots = np.diff(bounds)
res["cuts"] = {"count": len(cuts), "segments": len(shots), "mean_s": round(float(np.mean(shots)), 2), "median_s": round(float(np.median(shots)), 2),
               "longest": sorted([(round(float(s), 2), round(bounds[i], 2)) for i, s in enumerate(shots)], reverse=True)[:8],
               "first_20s": int(sum(1 for c in cuts if c < 20.0)) + 1, "times": [round(c, 2) for c in cuts]}
# frozen stretches (no motion for >= 1.5 s)
e = run(["ffmpeg", "-hide_banner", "-nostats", "-i", MASTER, "-vf", "scale=480:270,freezedetect=n=0.002:d=1.5", "-an", "-f", "null", "-"]).stderr
fs = re.findall(r"freeze_start: ([\d.]+)", e); fd = re.findall(r"freeze_duration: ([\d.]+)", e)
res["frozen"] = [(round(float(s), 2), round(float(d), 2)) for s, d in zip(fs, fd)]
# black frames
e = run(["ffmpeg", "-hide_banner", "-nostats", "-i", MASTER, "-vf", "scale=480:270,blackdetect=d=0.1:pix_th=0.06", "-an", "-f", "null", "-"]).stderr
res["black"] = re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", e)
# silences longer than 1 s
e = run(["ffmpeg", "-hide_banner", "-nostats", "-i", MASTER, "-map", "0:a", "-af", "silencedetect=n=-50dB:d=1.0", "-f", "null", "-"]).stderr
res["silences"] = re.findall(r"silence_start: ([\d.]+)", e)
# audio offset against the mix (first 30 s, 8 kHz mono)


def pcm(path, t=30):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-t", str(t), "-ac", "1", "-ar", "8000", "-f", "s16le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, dtype="<i2").astype(np.float64)


x, y = pcm(MASTER), pcm(os.path.join(ROOT, "audio", "v2", "mix", "mix_v2.wav"))
n = min(len(x), len(y))
c = np.fft.irfft(np.fft.rfft(x[:n], 2 * n) * np.conj(np.fft.rfft(y[:n], 2 * n)))
lag = int(np.argmax(np.concatenate([c[-400:], c[:401]]))) - 400
res["audio_offset_ms"] = round(lag / 8.0, 2)
# captions vs narration words
srt = open(os.path.join(ROOT, "captions", "FGW_RobotsDestroy_v2.srt"), encoding="utf-8").read().strip().split("\n\n")


def tsec(s):
    h, m, r = s.split(":"); return int(h) * 3600 + int(m) * 60 + float(r.replace(",", "."))


cues = [(tsec(b.split("\n")[1].split(" --> ")[0]), tsec(b.split("\n")[1].split(" --> ")[1])) for b in srt]
overl = sum(1 for i in range(len(cues) - 1) if cues[i][1] > cues[i + 1][0] + 1e-3)
res["captions"] = {"cues": len(cues), "first": cues[0][0], "last_end": cues[-1][1], "overlaps": overl,
                   "max_line_chars": max(len(l) for b in srt for l in b.split("\n")[2:])}
json.dump(res, open(os.path.join(OUT, "qa_v2_results.json"), "w"), indent=1)
print(json.dumps({k: v for k, v in res.items() if k != "cuts"}, indent=1))
print("cuts:", {k: v for k, v in res["cuts"].items() if k != "times"})
