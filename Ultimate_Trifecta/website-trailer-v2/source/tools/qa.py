"""QA for a trailer render.

    python3 qa.py VIDEO.mp4 EDL.json OUT_DIR

Writes into OUT_DIR:
  report.json            container/stream facts, loudness (EBU R128), true peak,
                         black and frozen stretches
  contact_sheet.jpg      2 frames per second, timestamped
  cuts_*.jpg             a frame burst at every cut (3 frames before, 4 after)
  audio.png              spectrogram + level with the cut and section markers
"""
import json
import os
import re
import subprocess
import sys

import numpy as np


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def main(video, edl_path, out):
    os.makedirs(out, exist_ok=True)
    edl = json.load(open(edl_path))
    rep = {}
    pr = run(["ffprobe", "-v", "error", "-show_entries", "format=duration,size,bit_rate:stream=codec_name,width,height,r_frame_rate,pix_fmt,sample_rate,channels,nb_frames,color_primaries",
              "-of", "json", video])
    rep["probe"] = json.loads(pr.stdout)
    eb = run(["ffmpeg", "-nostats", "-i", video, "-filter_complex", "ebur128=peak=true", "-f", "null", "-"]).stderr
    m = re.search(r"Integrated loudness:\s+I:\s+(-?[\d.]+) LUFS.*?LRA:\s+([\d.]+) LU.*?True peak:\s+Peak:\s+(-?[\d.]+) dBFS", eb, re.S)
    if m:
        rep["loudness"] = {"integrated_lufs": float(m.group(1)), "lra_lu": float(m.group(2)), "true_peak_dbtp": float(m.group(3))}
    bd = run(["ffmpeg", "-nostats", "-i", video, "-vf", "blackdetect=d=0.05:pix_th=0.06", "-an", "-f", "null", "-"]).stderr
    rep["black"] = re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", bd)
    fd = run(["ffmpeg", "-nostats", "-i", video, "-vf", "freezedetect=n=0.0008:d=0.4", "-an", "-f", "null", "-"]).stderr
    rep["frozen"] = re.findall(r"freeze_start: ([\d.]+)|freeze_end: ([\d.]+)", fd)
    json.dump(rep, open(os.path.join(out, "report.json"), "w"), indent=2)
    # contact sheet
    run(["ffmpeg", "-v", "error", "-y", "-i", video, "-vf",
         "fps=2,scale=320:-1,drawtext=text='%{pts\\:hms}':x=4:y=4:fontsize=16:fontcolor=yellow:box=1:boxcolor=black,tile=10x6",
         "-frames:v", "1", os.path.join(out, "contact_sheet.jpg")])
    # cut bursts
    fps = int(os.environ.get("QA_FPS", 60))
    cuts = [c[1] for c in edl["clips"][1:]]
    for i, t in enumerate(cuts):
        f0 = int(round(t * fps)) - 3
        run(["ffmpeg", "-v", "error", "-y", "-i", video, "-vf",
             f"select=between(n\\,{f0}\\,{f0 + 6}),scale=384:-1,drawtext=text='%{{n}}':x=4:y=4:fontsize=14:fontcolor=yellow:box=1:boxcolor=black,tile=7x1",
             "-vsync", "0", "-frames:v", "1", os.path.join(out, f"cuts_{i:02d}_{t:05.2f}s.jpg")])
    # audio
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    a = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", video, "-f", "f32le", "-ac", "1", "-ar", "24000", "-"], capture_output=True).stdout, np.float32)
    fig, ax = plt.subplots(2, 1, figsize=(22, 8))
    ax[0].specgram(a, NFFT=1024, Fs=24000, noverlap=768, cmap="magma", vmin=-120)
    ax[0].set_ylim(30, 12000)
    ax[0].set_yscale("log")
    hop = 240
    n = len(a) // hop
    r = 20 * np.log10(np.sqrt(np.mean(a[: n * hop].reshape(n, hop) ** 2, 1)) + 1e-9)
    ax[1].plot(np.arange(n) * hop / 24000, r, lw=0.6)
    ax[1].set_ylim(-70, 0)
    for x in ax:
        x.set_xlim(0, len(a) / 24000)
        for t in cuts:
            x.axvline(t, color="c", lw=0.6, alpha=0.6)
        for t in (4, 10, 18, 21, 22, 26, 28):
            x.axvline(t, color="r", lw=1.2, alpha=0.8)
    plt.tight_layout()
    plt.savefig(os.path.join(out, "audio.png"), dpi=60)
    print(json.dumps({k: rep[k] for k in ("loudness", "black", "frozen") if k in rep}, indent=1))


if __name__ == "__main__":
    main(*sys.argv[1:4])
