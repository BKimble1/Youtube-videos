"""Automated checks on the rendered review MP4: stream properties, black/frozen frames, silent stretches, loudness,
and ASR of the MP4's own audio against the script. Writes qa/qa_results.json.
Usage: python3.13 tools/qa_video.py exports/FGW_Starship_Dual_Catch_V1_REVIEW_1080p.mp4 [/path/to/whisper-base.en]"""
import json, os, re, subprocess, sys
import numpy as np, sherpa_onnx
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
mp4 = sys.argv[1]; M = sys.argv[2] if len(sys.argv) > 2 else "/tmp/models/sherpa-onnx-whisper-base.en"
run = lambda a: subprocess.run(a, capture_output=True, text=True)
probe = json.loads(run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", mp4]).stdout)
v = [s for s in probe["streams"] if s["codec_type"] == "video"][0]; a = [s for s in probe["streams"] if s["codec_type"] == "audio"][0]
res = {"file": os.path.basename(mp4), "size_mb": round(int(probe["format"]["size"]) / 2**20, 1), "duration_s": float(probe["format"]["duration"]),
       "video": {"codec": v["codec_name"], "profile": v.get("profile"), "w": v["width"], "h": v["height"], "fps": v["r_frame_rate"], "pix_fmt": v["pix_fmt"], "frames": int(v.get("nb_frames", 0))},
       "audio": {"codec": a["codec_name"], "sr": a["sample_rate"], "ch": a["channels"], "bitrate": a.get("bit_rate")}}
bd = run(["ffmpeg", "-nostats", "-i", mp4, "-vf", "blackdetect=d=0.25:pix_th=0.06", "-an", "-f", "null", "-"]).stderr
res["black_segments"] = re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", bd)
fz = run(["ffmpeg", "-nostats", "-i", mp4, "-vf", "freezedetect=n=0.0005:d=2.5", "-an", "-f", "null", "-"]).stderr
res["frozen_segments_over_2_5s"] = re.findall(r"freeze_start: ([\d.]+)", fz)
sd = run(["ffmpeg", "-nostats", "-i", mp4, "-af", "silencedetect=n=-50dB:d=1.0", "-vn", "-f", "null", "-"]).stderr
res["silences_over_1s"] = re.findall(r"silence_start: ([\d.]+)", sd)
eb = run(["ffmpeg", "-nostats", "-i", mp4, "-af", "ebur128=peak=true", "-vn", "-f", "null", "-"]).stderr
res["loudness"] = {"I_LUFS": float(re.findall(r"I:\s+(-?[\d.]+) LUFS", eb)[-1]), "true_peak_dbfs": float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", eb)[-1])}
# ASR of the MP4 audio, segment by segment, using the measured timeline
pcm = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", mp4, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True).stdout, dtype=np.float32)
rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=f"{M}/base.en-encoder.int8.onnx", decoder=f"{M}/base.en-decoder.int8.onnx", tokens=f"{M}/base.en-tokens.txt", num_threads=4)
norm = lambda s: re.sub(r"[^a-z ]", " ", s.lower().replace("-", " ")).split()
tl = json.load(open(os.path.join(ROOT, "source", "src", "data", "timeline.json")))["segments"]
hits = tot = 0; worst = []
for s in tl:
    x = pcm[int(s["start"] * 16000) - 1600: int(s["end"] * 16000) + 1600]
    st = rec.create_stream(); st.accept_waveform(16000, x); rec.decode_stream(st)
    ref = [w for w in norm(s["text"]) if w]; hyp = set(norm(st.result.text))
    h = sum(1 for w in ref if w in hyp); hits += h; tot += len(ref)
    if h / max(1, len(ref)) < 0.85: worst.append({"id": s["id"], "asr": st.result.text})
res["asr_word_recall_vs_script"] = round(hits / tot, 3)
res["asr_low_recall_segments"] = worst
json.dump(res, open(os.path.join(ROOT, "qa", "qa_results.json"), "w"), indent=1)
print(json.dumps(res, indent=1))
