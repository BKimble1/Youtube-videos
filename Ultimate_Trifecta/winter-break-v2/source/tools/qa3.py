#!/usr/bin/env python3
"""QA for the V2 delivery: title frame, score integrity, sync peaks, loudness, sheets.

    python3 qa3.py VIDEO.mp4 STEMS_DIR OUT_DIR
"""
import json, os, subprocess, sys
import numpy as np
import cv2
import soundfile as sf
import librosa
import pyloudnorm as pyln

video, stems, out = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(out, exist_ok=True)
FPS = 30
rep = {}
cap = cv2.VideoCapture(video)
rep["frames"] = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
rep["fps"] = cap.get(cv2.CAP_PROP_FPS)
rep["size"] = [int(cap.get(3)), int(cap.get(4))]
cap.set(cv2.CAP_PROP_POS_FRAMES, 884)
prev, best = None, (0.0, None)
for f in range(884, 904):
    ok, im = cap.read()
    if not ok:
        break
    small = cv2.resize(im, (192, 108)).astype(np.float32)
    if prev is not None:
        d = float(np.abs(small - prev).mean())
        if d > best[0]:
            best = (d, f)
    prev = small
rep["title_first_frame"] = best[1]
rep["title_first_frame_s"] = None if best[1] is None else round(best[1] / FPS, 4)

wav = os.path.join(out, "_audio.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", video, "-vn", "-ac", "2", "-ar", "48000", wav], check=True)
a, sr = sf.read(wav, always_2d=True)
rep["audio_dur_s"] = round(len(a) / sr, 3)
rep["lufs_integrated"] = round(float(pyln.Meter(sr).integrated_loudness(a)), 2)
up = librosa.resample(a.T, orig_sr=sr, target_sr=sr * 4)
rep["true_peak_dbtp"] = round(float(20 * np.log10(np.abs(up).max())), 2)

mus, msr = sf.read(os.path.join(stems, "music_score.wav"), always_2d=True)
src, _ = sf.read("/home/user/ut/work/mus/polished.wav", always_2d=True)
n = min(len(src), len(mus))
rep["score_stem_vs_source_max_abs_diff"] = float(np.abs(src[:n] - mus[:n]).max())
rep["score_stem_len_s"] = round(len(mus) / msr, 3)

sfx, ssr = sf.read(os.path.join(stems, "sfx.wav"), always_2d=True)
s_m = np.abs(sfx.mean(1))


def rms_db(x):
    return float(20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12))


def peak(a_, b_):
    w = s_m[int(a_ * ssr): int(b_ * ssr)]
    return [round(a_ + int(np.argmax(w)) / ssr, 4), round(float(20 * np.log10(w.max() + 1e-12)), 1)]


rep["relay_click_peak_s_db"] = peak(7.95, 8.1)
rep["latch_peak_s_db"] = peak(28.3, 28.7)
rep["snow_land_peak_s_db"] = peak(29.6, 29.8)
rep["sfx_rms_db_before_snow_29.0_29.6"] = round(rms_db(s_m[int(29.0 * ssr): int(29.6 * ssr)]), 1)
rep["sfx_rms_db_under_title_29.85_33"] = round(rms_db(s_m[int(29.85 * ssr): int(32.95 * ssr)]), 1)
# effects continuity across the chase cuts: sfx RMS in 100 ms windows either side of each cut
edl = json.load(open("/home/user/ut/work/edl3.json"))
cuts = [round(c[1], 3) for c in edl["clips"][5:10]]
rep["chase_cuts_sfx_rms_before_after_db"] = {str(c): [round(rms_db(s_m[int((c - 0.1) * ssr):int(c * ssr)]), 1), round(rms_db(s_m[int(c * ssr):int((c + 0.1) * ssr)]), 1)] for c in cuts}
json.dump(rep, open(os.path.join(out, "report.json"), "w"), indent=1)
print(json.dumps(rep, indent=1))

subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", video, "-vf", "fps=2,scale=320:-1,tile=10x7", "-frames:v", "1",
                os.path.join(out, "contact_sheet_2fps.jpg")], check=True)
for name, t0 in [("cut_2.8", 2.77), ("lights_7.9", 7.9), ("first_step_8.6", 8.55), ("handoff_13.7", 13.7), ("prints_15.6", 15.6),
                 ("dive_17.2", 17.2), ("antler_18.5", 18.5), ("shake_21.7", 21.7), ("latch_28.3", 28.3), ("snow_title_29.55", 29.55)]:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t0:.3f}", "-i", video, "-vf", "scale=384:-1,tile=8x1", "-frames:v", "1",
                    os.path.join(out, f"frames_{name}.jpg")], check=True)
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
fig, ax = plt.subplots(3, 1, figsize=(16, 8), sharex=True)
mono = a.mean(1)
ax[0].plot(np.arange(len(mono))[::40] / sr, mono[::40], lw=0.3); ax[0].set_ylabel("mix")
ax[1].plot(np.arange(len(mus))[::40] / msr, mus.mean(1)[::40], lw=0.3, color="tab:orange"); ax[1].set_ylabel("score")
ax[2].plot(np.arange(len(s_m))[::40] / ssr, sfx.mean(1)[::40], lw=0.3, color="tab:green"); ax[2].set_ylabel("sfx")
for x in [2.9, 8.0, 13.833, 17.0, 21.833, 28.5, 29.8]:
    for a_ in ax:
        a_.axvline(x, color="r", lw=0.6)
ax[2].set_xlabel("seconds (red: cut 2.9, lights 8.0, handoff 13.83, pullback 17.0, return 21.83, latch 28.5, title 29.8)")
plt.tight_layout(); plt.savefig(os.path.join(out, "audio.png"), dpi=90)
