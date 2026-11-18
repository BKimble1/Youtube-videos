#!/usr/bin/env python3
"""QA for the delivered trailer: sync points, the logo frame, the score's
silences, loudness, and contact sheets.

    python3 qa.py VIDEO.mp4 STEMS_DIR OUT_DIR
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

# ---- picture: the logo's first frame
cap = cv2.VideoCapture(video)
n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
rep["frames"] = n
rep["fps"] = cap.get(cv2.CAP_PROP_FPS)
cap.set(cv2.CAP_PROP_POS_FRAMES, 1070)
prev = None
best = (0.0, None)
for f in range(1070, 1090):
    ok, im = cap.read()
    if not ok:
        break
    small = cv2.resize(im, (192, 108)).astype(np.float32)
    if prev is not None:
        d = float(np.abs(small - prev).mean())
        if d > best[0]:
            best = (d, f)
    prev = small
first_card = best[1]
rep["logo_first_frame"] = first_card
rep["logo_first_frame_time_s"] = None if first_card is None else round(first_card / FPS, 4)

# ---- sound: from the delivered file and the stems
wav = os.path.join(out, "_audio.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", video, "-vn", "-ac", "2", "-ar", "48000", wav], check=True)
a, sr = sf.read(wav, always_2d=True)
a = a.T
mono = a.mean(0)
meter = pyln.Meter(sr)
rep["lufs_integrated"] = round(float(meter.integrated_loudness(a.T)), 2)
up = librosa.resample(a, orig_sr=sr, target_sr=sr * 4)
rep["true_peak_dbtp"] = round(float(20 * np.log10(np.abs(up).max())), 2)
mus, msr = sf.read(os.path.join(stems, "music_edit.wav"), always_2d=True)
mm = mus.mean(1)
def rms_db(x):
    return float(20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12))
rep["music_rms_db_0_8"] = round(rms_db(mm[: 8 * msr]), 1)
rep["music_rms_db_8.05_11.98"] = round(rms_db(mm[int(8.05 * msr): int(11.98 * msr)]), 1)
rep["music_rms_db_30.01_35.99"] = round(rms_db(mm[int(30.01 * msr): int(35.99 * msr)]), 1)
# the attack on the logo: the first sample after 35.9 s above -40 dBFS
env = np.abs(mm[int(35.9 * msr): int(36.2 * msr)])
k = int(np.argmax(env > 10 ** (-40 / 20)))
rep["music_attack_after_35.9_s"] = round(35.9 + k / msr, 4)
pk = int(np.argmax(env))
rep["music_peak_after_35.9_s"] = round(35.9 + pk / msr, 4)
# restart on the first stride
env2 = np.abs(mm[int(11.9 * msr): int(12.2 * msr)])
rep["music_restart_s"] = round(11.9 + int(np.argmax(env2 > 10 ** (-40 / 20))) / msr, 4)
# where does the music stop at the latch?
env3 = np.abs(mm[int(29.8 * msr): int(30.2 * msr)])
nz = np.where(env3 > 10 ** (-50 / 20))[0]
rep["music_last_sound_before_latch_s"] = round(29.8 + nz[-1] / msr, 4) if len(nz) else None
sfx, ssr = sf.read(os.path.join(stems, "sfx.wav"), always_2d=True)
s_m = np.abs(sfx.mean(1))
w = s_m[int(34.6 * ssr): int(35.6 * ssr)]
rep["squeak_peak_s"] = round(34.6 + int(np.argmax(w)) / ssr, 3)
quiet = s_m[int(34.6 * ssr): int(35.0 * ssr)]
rep["sfx_rms_db_before_squeak_34.6_35.0"] = round(rms_db(quiet), 1)
rep["sfx_peak_db_squeak"] = round(float(20 * np.log10(w.max() + 1e-12)), 1)
w2 = s_m[int(29.8 * ssr): int(30.2 * ssr)]
rep["latch_peak_s"] = round(29.8 + int(np.argmax(w2)) / ssr, 3)
w3 = s_m[int(19.9 * ssr): int(20.3 * ssr)]
rep["splash_peak_s"] = round(19.9 + int(np.argmax(w3)) / ssr, 3)
json.dump(rep, open(os.path.join(out, "report.json"), "w"), indent=1)
print(json.dumps(rep, indent=1))

# ---- contact sheets
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", video, "-vf", "fps=2,scale=320:-1,tile=10x8", "-frames:v", "1",
                os.path.join(out, "contact_sheet_2fps.jpg")], check=True)
for name, t0 in [("match_cut_3.8", 3.8), ("lights_7.8", 7.8), ("first_stride_11.8", 11.8), ("splash_19.8", 19.8),
                 ("officer_switch_26.6", 26.6), ("latch_29.8", 29.8), ("squeak_34.9", 34.9), ("logo_35.8", 35.8)]:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t0:.3f}", "-i", video, "-vf", "scale=384:-1,tile=8x1", "-frames:v", "1",
                    os.path.join(out, f"frames_{name}.jpg")], check=True)
# audio waveform/spectrogram overview
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
fig, ax = plt.subplots(3, 1, figsize=(16, 8), sharex=True)
t = np.arange(len(mono)) / sr
ax[0].plot(t[::40], mono[::40], lw=0.3); ax[0].set_ylabel("mix")
ax[1].plot(np.arange(len(mm))[::40] / msr, mm[::40], lw=0.3, color="tab:orange"); ax[1].set_ylabel("music")
ax[2].plot(np.arange(len(s_m))[::40] / ssr, sfx.mean(1)[::40], lw=0.3, color="tab:green"); ax[2].set_ylabel("sfx")
for x in [8, 12, 20, 30, 36]:
    for a_ in ax:
        a_.axvline(x, color="r", lw=0.6)
ax[2].set_xlabel("seconds (red: 0:08 lights, 0:12 stride, 0:20 splash, 0:30 latch, 0:36 logo)")
plt.tight_layout(); plt.savefig(os.path.join(out, "audio.png"), dpi=90)
