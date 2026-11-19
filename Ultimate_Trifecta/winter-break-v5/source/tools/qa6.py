#!/usr/bin/env python3
"""QA for the V4 delivery: title frame, score integrity, sync peaks, loudness,
chase-cut continuity, and frame-by-frame strips of the four checks asked for
(the fountain landing, the 0:16.1 stride, the hand catch, the final slippers).

    python3 qa4.py VIDEO.mp4 STEMS_DIR OUT_DIR
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
EDL = json.load(open("/home/user/ut/work/edl6.json"))
INFO = EDL["info"]
rep = {}
cap = cv2.VideoCapture(video)
rep["frames"] = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
rep["fps"] = cap.get(cv2.CAP_PROP_FPS)
rep["size"] = [int(cap.get(3)), int(cap.get(4))]
frames = []
while True:
    ok, im = cap.read()
    if not ok:
        break
    frames.append(cv2.resize(im, (192, 108)).astype(np.float32))
diffs = [float(np.abs(frames[i] - frames[i - 1]).mean()) for i in range(1, len(frames))]
k = int(np.argmax(diffs[884:904])) + 885
rep["title_first_frame"] = k
rep["title_first_frame_s"] = round(k / FPS, 4)
# every cut lands where the EDL puts it (the biggest frame change within +-1 frame)
cuts = []
for c in EDL["clips"][1:]:
    f = int(round(c[1] * FPS))
    w = diffs[f - 2:f + 1]
    cuts.append([c[0], round(c[1], 3), f, int(np.argmax(w)) + f - 1])
rep["cuts_expected_vs_found_frame"] = cuts

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
# the score inside the delivered mix: correlation with the source (same timing, no edits)
m_mix = a.mean(1)
m_src = src.mean(1)[:len(m_mix)]
seg = slice(int(1 * sr), int(29.7 * sr))
xc = np.correlate(m_mix[seg][::8], m_src[seg][::8], "full")
lag = int(np.argmax(xc)) - (len(m_src[seg][::8]) - 1)
rep["score_in_mix_lag_samples_at_6k"] = lag

sfx, ssr = sf.read(os.path.join(stems, "sfx.wav"), always_2d=True)
s_m = np.abs(sfx.mean(1))


def rms_db(x):
    return float(20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12))


def peak(a_, b_):
    w = s_m[int(a_ * ssr): int(b_ * ssr)]
    return [round(a_ + int(np.argmax(w)) / ssr, 4), round(float(20 * np.log10(w.max() + 1e-12)), 1)]


rep["relay_click_peak_s_db"] = peak(7.95, 8.1)
rep["deer_footfall_peak_s_db (plant ~%.3f)" % INFO["T_PLANT"]] = peak(INFO["T_PLANT"] - 0.25, INFO["T_PLANT"] + 0.2)
rep["branch_release_peak_s_db (spring+0.2 ~%.3f)" % (INFO["T_SPRING"] + 0.2)] = peak(INFO["T_SPRING"] + 0.1, INFO["T_SPRING"] + 0.35)
rep["latch_peak_s_db"] = peak(28.3, 28.7)
rep["snow_land_peak_s_db (~%.3f)" % INFO["T_LAND"]] = peak(INFO["T_LAND"] - 0.1, INFO["T_LAND"] + 0.12)
rep["sfx_rms_db_under_title_29.85_33"] = round(rms_db(s_m[int(29.85 * ssr): int(32.95 * ssr)]), 1)
chase = [c for c in EDL["clips"] if 9.0 < c[1] < 17.5]
rep["chase_cuts_sfx_rms_before_after_db"] = {str(round(c[1], 3)): [round(rms_db(s_m[int((c[1] - 0.1) * ssr):int(c[1] * ssr)]), 1),
                                                                   round(rms_db(s_m[int(c[1] * ssr):int((c[1] + 0.1) * ssr)]), 1)] for c in chase}
json.dump(rep, open(os.path.join(out, "report.json"), "w"), indent=1)
print(json.dumps(rep, indent=1))

subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", video, "-vf", "fps=2,scale=320:-1,tile=10x7", "-frames:v", "1",
                os.path.join(out, "contact_sheet_2fps.jpg")], check=True)


def strip(name, f0, f1, w=384, cols=8):
    cap2 = cv2.VideoCapture(video)
    cap2.set(cv2.CAP_PROP_POS_FRAMES, f0)
    ims = []
    for f in range(f0, f1 + 1):
        ok, im = cap2.read()
        if not ok:
            break
        im = cv2.resize(im, (w, int(w * im.shape[0] / im.shape[1])))
        cv2.putText(im, f"f{f} {f / FPS:.3f}s", (6, 18), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1, cv2.LINE_AA)
        ims.append(im)
    while len(ims) % cols:
        ims.append(np.zeros_like(ims[0]))
    rows = [np.hstack(ims[i:i + cols]) for i in range(0, len(ims), cols)]
    cv2.imwrite(os.path.join(out, f"frames_{name}.jpg"), np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 88])


strip("fistbump_lights_7.40-8.70", 222, 261, w=320, cols=10)
strip("tyre_b2_9.20-9.90", 276, 297)
strip("c2b_glance_13.83-15.40", 415, 462, w=320, cols=10)
strip("tyre_mark_c3_15.40-17.00", 462, 510, w=320, cols=10)
strip("bush_eye_d2_19.30-20.50", 579, 615, w=320, cols=10)
strip("bush_launch_d3_21.40-23.50", 642, 705, w=320, cols=10)
strip("cart_pursuit_e4a_23.50-25.60", 705, 768, w=320, cols=10)
strip("hand_catch_26.40-27.10", 792, 813)
strip("door_clearance_27.10-27.80", 813, 834)
strip("ending_27.80-29.80", 834, 894, w=320, cols=10)

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
fig, ax = plt.subplots(3, 1, figsize=(16, 8), sharex=True)
mono = a.mean(1)
ax[0].plot(np.arange(len(mono))[::40] / sr, mono[::40], lw=0.3); ax[0].set_ylabel("mix")
ax[1].plot(np.arange(len(mus))[::40] / msr, mus.mean(1)[::40], lw=0.3, color="tab:orange"); ax[1].set_ylabel("score")
ax[2].plot(np.arange(len(s_m))[::40] / ssr, sfx.mean(1)[::40], lw=0.3, color="tab:green"); ax[2].set_ylabel("sfx")
for x in [2.9, 8.0, 13.833, INFO["T_D3"], INFO["T_PLANT"], INFO["T_SPRING"], INFO["T_E4"], INFO["T_CATCH"], INFO["T_CLEAR"], 28.5, INFO["T_LAND"], 29.8]:
    for a_ in ax:
        a_.axvline(x, color="r", lw=0.6)
ax[2].set_xlabel("seconds (red: cut 2.9, lights 8.0, handoff 13.83, bush 21.83, plant, spring, threshold, catch, latch 28.5, snow, title 29.8)")
plt.tight_layout(); plt.savefig(os.path.join(out, "audio.png"), dpi=90)
