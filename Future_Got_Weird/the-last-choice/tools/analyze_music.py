"""Measure the two supplied recordings (screen-recording audio extracted to WAV) for the cue sheet.

What this measures (it cannot listen; every number here is from the waveform):
  - duration, sample peak, integrated loudness (ffmpeg ebur128)
  - an RMS envelope (dBFS, 100 ms hop) and a smoothed version for swells and rests
  - onset strength, a tempo/beat estimate, and a structural novelty curve (chroma + MFCC self-similarity)
  - the hand-over into the autoplayed next track at the end of each recording (silence / spectral jump)
  - spectrogram + envelope images with a time grid for visual inspection
Usage: python3 tools/analyze_music.py <rec.wav> <name> <out_dir>
"""
import json, os, subprocess, sys

import librosa
import librosa.display  # noqa: F401
import numpy as np

wav, name, out = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(out, exist_ok=True)
y, sr = librosa.load(wav, sr=22050, mono=True)
dur = len(y) / sr
hop = 2205  # 100 ms

rms = librosa.feature.rms(y=y, frame_length=4410, hop_length=hop)[0]
rms_db = 20 * np.log10(np.maximum(rms, 1e-6))
t = np.arange(len(rms)) * hop / sr
k = 15  # 1.5 s smoothing
smooth_db = np.convolve(rms_db, np.ones(k) / k, mode="same")

onset = librosa.onset.onset_strength(y=y, sr=sr, hop_length=512)
tempo, beats = librosa.beat.beat_track(onset_envelope=onset, sr=sr, hop_length=512)
beat_t = librosa.frames_to_time(beats, sr=sr, hop_length=512)
onsets = librosa.onset.onset_detect(onset_envelope=onset, sr=sr, hop_length=512, backtrack=False, units="time")

# structural novelty (checkerboard kernel over a chroma+MFCC self-similarity matrix, 0.5 s frames)
H = 11025
chroma = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=H)
mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13, hop_length=H)
F = np.vstack([librosa.util.normalize(chroma, axis=0), librosa.util.normalize(mfcc[1:], axis=1)])
F = F / (np.linalg.norm(F, axis=0, keepdims=True) + 1e-9)
S = F.T @ F
L = 16
g = np.outer(np.r_[np.ones(L), -np.ones(L)], np.r_[np.ones(L), -np.ones(L)])
g *= np.outer(np.hanning(2 * L), np.hanning(2 * L))
nov = np.zeros(S.shape[0])
for i in range(L, S.shape[0] - L):
    nov[i] = np.sum(S[i - L:i + L, i - L:i + L] * g)
nov = np.maximum(nov, 0)
nov /= nov.max() + 1e-9
nt = np.arange(len(nov)) * H / sr
peaks = librosa.util.peak_pick(nov, pre_max=6, post_max=6, pre_avg=8, post_avg=8, delta=0.08, wait=8)
bounds = [round(float(nt[p]), 2) for p in peaks]

# spectral centroid (brightness) per 100 ms
cent = librosa.feature.spectral_centroid(y=y, sr=sr, n_fft=4096, hop_length=hop)[0]

# ffmpeg loudness
r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", wav, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True)
summ = r.stderr[r.stderr.rfind("Summary:"):]
lufs = float(summ.split("I:")[1].split("LUFS")[0])
tp = float(summ.split("Peak:")[1].split("dBFS")[0]) if "Peak:" in summ else None

res = {
    "file": os.path.basename(wav), "duration_s": round(dur, 3), "integrated_lufs": lufs, "true_peak_dbfs": tp,
    "tempo_estimate_bpm": float(np.atleast_1d(tempo)[0]), "beats_s": [round(float(b), 3) for b in beat_t],
    "onsets_s": [round(float(o), 3) for o in onsets], "novelty_boundaries_s": bounds,
    "env_100ms_db": [round(float(v), 1) for v in rms_db], "env_smooth_db": [round(float(v), 1) for v in smooth_db],
    "centroid_100ms_hz": [int(c) for c in cent],
}
json.dump(res, open(os.path.join(out, f"{name}_analysis.json"), "w"))

# ---- images: 4 panels of ~50 s each (spectrogram, envelope, novelty, onsets)
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

Sg = librosa.amplitude_to_db(np.abs(librosa.stft(y, n_fft=4096, hop_length=hop)), ref=np.max)
seg = 50
for pi, s0 in enumerate(np.arange(0, dur, seg)):
    s1 = min(dur, s0 + seg)
    fig, ax = plt.subplots(3, 1, figsize=(20, 9), sharex=True, gridspec_kw={"height_ratios": [3, 1.4, 1]})
    i0, i1 = int(s0 * sr / hop), int(s1 * sr / hop)
    ax[0].imshow(Sg[:400, i0:i1], origin="lower", aspect="auto", extent=[s0, s1, 0, 400 * sr / 4096], cmap="magma", vmin=-80, vmax=0)
    ax[0].set_ylabel("Hz"); ax[0].set_title(f"{name}  {s0:.0f}-{s1:.0f} s (recording time)")
    m = (t >= s0) & (t <= s1)
    ax[1].plot(t[m], rms_db[m], lw=0.6, color="#888"); ax[1].plot(t[m], smooth_db[m], lw=1.6, color="#c33")
    ax[1].set_ylabel("dBFS"); ax[1].set_ylim(-70, 0); ax[1].grid(alpha=0.3)
    mn = (nt >= s0) & (nt <= s1)
    ax[2].plot(nt[mn], nov[mn], color="#36c"); ax[2].set_ylabel("novelty")
    for b in bounds:
        if s0 <= b <= s1:
            for a in ax: a.axvline(b, color="#3c6", lw=1, alpha=0.8)
    ob = onsets[(onsets >= s0) & (onsets <= s1)]
    ax[2].vlines(ob, 0, 0.15, color="k", lw=0.5)
    ax[2].set_xticks(np.arange(np.ceil(s0), s1 + 0.01, 2)); ax[2].tick_params(axis="x", labelsize=7)
    for a in ax: a.grid(axis="x", alpha=0.25)
    plt.tight_layout(); plt.savefig(os.path.join(out, f"{name}_p{pi}.png"), dpi=80); plt.close()

print(json.dumps({k: v for k, v in res.items() if k in ("file", "duration_s", "integrated_lufs", "true_peak_dbfs", "tempo_estimate_bpm", "novelty_boundaries_s")}, indent=1))
