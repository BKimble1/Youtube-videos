"""QA on a rendered film file.

  python3 tools/qa.py measure <mp4> <out_dir>   stream properties, duration vs timeline, black/frozen spans, audio
                                                 loudness/true peak/clipping → <out_dir>/qa_results.json
  python3 tools/qa.py strips <mp4> <out_dir>    a strip of frames around every cut (−6, −3, −1, 0, +1, +3, +6 frames)
  python3 tools/qa.py sheet <mp4> <out_dir> [every_s]   contact sheets (timecode-labelled) every N seconds
  python3 tools/qa.py frames <mp4> <out_dir> t1 t2 ...  full-size frames at given film seconds
Times and shot boundaries come from audio/timing.json.
"""
import json, os, subprocess, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
T = json.load(open(os.path.join(ROOT, "audio", "timing.json")))
FPS = 30


def run(*a, **k):
    return subprocess.run(list(a), capture_output=True, text=True, **k)


def grab(mp4, t, out, w=640):
    run("ffmpeg", "-v", "error", "-y", "-ss", f"{max(0, t):.4f}", "-i", mp4, "-frames:v", "1", "-vf", f"scale={w}:-1", out)


def tile(files, out, cols, label=None):
    args = []
    for f in files:
        args += ["-i", f]
    n = len(files)
    rows = (n + cols - 1) // cols
    filt = ";".join(f"[{i}:v]drawtext=text='{label[i] if label else ''}':x=6:y=6:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.6[v{i}]" for i in range(n))
    w = int(run("ffprobe", "-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", files[0]).stdout.strip().split(",")[0])
    h = int(run("ffprobe", "-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", files[0]).stdout.strip().split(",")[1])
    layout = "|".join(f"{(i % cols) * w}_{(i // cols) * h}" for i in range(n))
    run("ffmpeg", "-v", "error", "-y", *args, "-filter_complex", f"{filt};{''.join(f'[v{i}]' for i in range(n))}xstack=inputs={n}:layout={layout}:fill=gray[o]", "-map", "[o]", out)


mode, mp4, out = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(out, exist_ok=True)
if mode == "measure":
    pr = json.loads(run("ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", mp4).stdout)
    v = [s for s in pr["streams"] if s["codec_type"] == "video"][0]
    a = [s for s in pr["streams"] if s["codec_type"] == "audio"]
    res = {"file": os.path.basename(mp4), "size_mb": round(int(pr["format"]["size"]) / 2 ** 20, 1), "duration_s": float(pr["format"]["duration"]),
           "video": {k: v.get(k) for k in ("codec_name", "width", "height", "r_frame_rate", "pix_fmt", "nb_frames", "color_space")},
           "audio": [{k: s.get(k) for k in ("codec_name", "sample_rate", "channels", "bit_rate")} for s in a], "timeline_end_s": T["end"]}
    bd = run("ffmpeg", "-hide_banner", "-i", mp4, "-vf", "blackdetect=d=0.25:pix_th=0.06", "-an", "-f", "null", "-").stderr
    res["black_spans"] = [l.split("black_start:")[1].split()[0] + "–" + l.split("black_end:")[1].split()[0] for l in bd.splitlines() if "black_start" in l]
    fz = run("ffmpeg", "-hide_banner", "-i", mp4, "-vf", "freezedetect=n=0.0008:d=1.5", "-an", "-f", "null", "-").stderr
    res["frozen_spans"] = [l.split("freeze_start:")[1].strip() for l in fz.splitlines() if "freeze_start" in l]
    if a:
        eb = run("ffmpeg", "-hide_banner", "-nostats", "-i", mp4, "-vn", "-af", "ebur128=peak=true", "-f", "null", "-").stderr
        s = eb[eb.rfind("Summary:"):]
        res["loudness"] = {"I_lufs": float(s.split("I:")[1].split("LUFS")[0]), "LRA_lu": float(s.split("LRA:")[1].split("LU")[0]), "true_peak_dbfs": float(s.split("Peak:")[1].split("dBFS")[0])}
        import numpy as np
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", mp4, "-vn", "-ac", "2", "-f", "f32le", "-"], capture_output=True).stdout
        x = np.frombuffer(raw, dtype=np.float32)
        res["audio_sample_peak_dbfs"] = round(float(20 * np.log10(np.max(np.abs(x)) + 1e-12)), 2)
        res["audio_clipped_samples"] = int(np.sum(np.abs(x) >= 0.9999))
    json.dump(res, open(os.path.join(out, "qa_results.json"), "w"), indent=1)
    print(json.dumps(res, indent=1))
elif mode == "strips":
    offs = [-6, -3, -1, 0, 1, 3, 6]
    for s in T["shots"][1:]:
        files, lab = [], []
        for o in offs:
            t = s["start"] + o / FPS + 0.5 / FPS
            f = os.path.join(out, f"_{s['id']}_{o}.png")
            grab(mp4, t, f, 384)
            files.append(f); lab.append(f"{s['id']} {o:+d}f")
        tile(files, os.path.join(out, f"cut_{s['id']}.png"), len(files), lab)
        for f in files:
            os.remove(f)
    print("strips in", out)
elif mode == "sheet":
    every = float(sys.argv[4]) if len(sys.argv) > 4 else 2.0
    ts = [i * every + 0.5 for i in range(int(T["end"] // every) + 1)]
    for page in range(0, len(ts), 24):
        files, lab = [], []
        for t in ts[page:page + 24]:
            f = os.path.join(out, f"_s{t:07.2f}.png")
            grab(mp4, t, f, 384)
            files.append(f); lab.append(f"{int(t // 60)}:{t % 60:05.2f}")
        tile(files, os.path.join(out, f"sheet_{page // 24:02d}.png"), 6, lab)
        for f in files:
            os.remove(f)
    print("sheets in", out)
elif mode == "frames":
    for t in sys.argv[4:]:
        grab(mp4, float(t), os.path.join(out, f"t{float(t):07.2f}.png"), 1920)
