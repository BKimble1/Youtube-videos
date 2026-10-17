"""THE LAST CHOICE R2 — QA of a rendered file (measured, not watched).

    python3 tools/r2/qa_r2.py <file.mp4> <timeline.json> <out_dir>

Writes <out_dir>/qa_results.json (stream properties, loudness, true peak, black and frozen spans) and sheets:
  every3s_*.png        a frame every 3 s (labelled)
  cuts_*.png           every cut: the last frame of the outgoing shot beside the first frame of the incoming one
The timeline is a list of {id, start, end} in film seconds (exported from src/r2/film/MainR2.tsx timeline()).
"""
import json, os, re, subprocess, sys

src, tl_path, out = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(out, exist_ok=True)
FPS = 30


def run(args):
    return subprocess.run(args, capture_output=True, text=True)


probe = json.loads(run(["ffprobe", "-v", "error", "-show_entries",
                        "format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames,channels,sample_rate,color_space",
                        "-of", "json", src]).stdout)

# loudness + true peak (ebur128 summary)
eb = run(["ffmpeg", "-nostats", "-i", src, "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr
summ = eb[eb.rfind("Summary:"):]
I = float(re.search(r"I:\s+(-?[\d.]+) LUFS", summ).group(1))
LRA = float(re.search(r"LRA:\s+(-?[\d.]+) LU", summ).group(1))
TP = float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", summ).group(1))

# black and frozen spans
bd = run(["ffmpeg", "-nostats", "-i", src, "-vf", "blackdetect=d=0.3:pix_th=0.06", "-an", "-f", "null", "-"]).stderr
black = [(float(a), float(b)) for a, b in re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", bd)]
fz = run(["ffmpeg", "-nostats", "-i", src, "-vf", "freezedetect=n=0.0008:d=1.5", "-an", "-f", "null", "-"]).stderr
fs = [float(x) for x in re.findall(r"freeze_start: ([\d.]+)", fz)]
fe = [float(x) for x in re.findall(r"freeze_end: ([\d.]+)", fz)]
frozen = list(zip(fs, fe + [None] * (len(fs) - len(fe))))

tl = json.load(open(tl_path))
cuts = [(a["id"], b["id"], b["start"]) for a, b in zip(tl, tl[1:])]


def grab(t, path, w=480):
    run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.4f}", "-i", src, "-frames:v", "1", "-vf", f"scale={w}:-1", path])


def sheet(paths, labels, cols, path, w=480):
    h = w * 9 // 16
    args = []
    for p in paths:
        args += ["-i", p]
    filt = ";".join(f"[{i}:v]scale={w}:{h},drawtext=text='{lab}':x=6:y=6:fontsize=15:fontcolor=white:box=1:boxcolor=black@0.6[v{i}]" for i, lab in enumerate(labels))
    layout = "|".join(f"{(i % cols) * w}_{(i // cols) * h}" for i in range(len(paths)))
    run(["ffmpeg", "-v", "error", "-y", *args, "-filter_complex", f"{filt};{''.join(f'[v{i}]' for i in range(len(paths)))}xstack=inputs={len(paths)}:layout={layout}:fill=gray[o]", "-map", "[o]", path])


tmp = os.path.join(out, "_tmp")
os.makedirs(tmp, exist_ok=True)
dur = float(probe["format"]["duration"])
# every 3 s
ts = [x + 1.5 for x in range(0, int(dur), 3)]
for k in range(0, len(ts), 30):
    group = ts[k:k + 30]
    ps = []
    for t in group:
        p = os.path.join(tmp, f"e{t:07.2f}.png"); grab(t, p, 320); ps.append(p)
    sheet(ps, [f"{t:.1f}s" for t in group], 6, os.path.join(out, f"every3s_{k // 30:02d}.png"), 320)
# cuts: the outgoing shot's last frame and the incoming shot's first frame
for k in range(0, len(cuts), 12):
    group = cuts[k:k + 12]
    ps, labs = [], []
    for a, b, t in group:
        f = round(t * FPS)
        # (an input seek returns the first frame whose pts >= t, so aim just below each frame's own pts)
        pa = os.path.join(tmp, f"c{f}_a.png"); grab((f - 1) / FPS - 0.004, pa, 320)
        pb = os.path.join(tmp, f"c{f}_b.png"); grab(f / FPS - 0.004, pb, 320)
        ps += [pa, pb]; labs += [f"{a} end", f"{b} {t:.2f}s"]
    sheet(ps, [l.replace(":", " ") for l in labs], 6, os.path.join(out, f"cuts_{k // 12:02d}.png"), 320)
for f in os.listdir(tmp):
    os.remove(os.path.join(tmp, f))
os.rmdir(tmp)

res = {"file": os.path.basename(src), "probe": probe, "loudness": {"integrated_lufs": I, "lra_lu": LRA, "true_peak_dbtp": TP},
       "black_spans": black, "frozen_spans": frozen, "cuts": len(cuts), "shots": len(tl)}
json.dump(res, open(os.path.join(out, "qa_results.json"), "w"), indent=1)
print(json.dumps({k: v for k, v in res.items() if k != "probe"}, indent=1))
