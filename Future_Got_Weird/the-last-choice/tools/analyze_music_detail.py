"""Finer measurements for choosing edit points: harmonic/percussive split, band energies, chroma, onsets.
Draws 30 s panels with a 1 s grid. Usage: python3 tools/analyze_music_detail.py <rec.wav> <name> <out_dir> [t0 t1]
"""
import json, os, sys

import librosa
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

wav, name, out = sys.argv[1], sys.argv[2], sys.argv[3]
t0 = float(sys.argv[4]) if len(sys.argv) > 4 else 0.0
t1 = float(sys.argv[5]) if len(sys.argv) > 5 else None
y, sr = librosa.load(wav, sr=22050, mono=True, offset=t0, duration=None if t1 is None else t1 - t0)
hop = 441  # 20 ms
Hm, Pc = librosa.decompose.hpss(librosa.stft(y, n_fft=2048, hop_length=hop), margin=2.0)
freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)


def band(M, lo, hi):
    m = (freqs >= lo) & (freqs < hi)
    return 10 * np.log10(np.sum(np.abs(M[m]) ** 2, axis=0) + 1e-10)


tt = t0 + np.arange(Hm.shape[1]) * hop / sr
feat = {
    "perc_full": band(Pc, 30, 11000), "perc_low": band(Pc, 30, 160), "perc_hi": band(Pc, 3000, 11000),
    "harm_low": band(Hm, 30, 200), "harm_mid": band(Hm, 200, 1200), "harm_hi": band(Hm, 1200, 5000),
}
chroma = librosa.feature.chroma_cqt(y=librosa.istft(Hm, hop_length=hop), sr=sr, hop_length=2205)
ct = t0 + np.arange(chroma.shape[1]) * 2205 / sr
onset = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
ons = t0 + librosa.onset.onset_detect(onset_envelope=onset, sr=sr, hop_length=hop, units="time", delta=0.25)
strong = []
thr = np.percentile(onset, 98.5)
for i in range(1, len(onset) - 1):
    if onset[i] > thr and onset[i] >= onset[i - 1] and onset[i] >= onset[i + 1]:
        strong.append(round(float(t0 + i * hop / sr), 2))
json.dump({"strong_onsets_s": strong, "onsets_s": [round(float(o), 3) for o in ons]}, open(os.path.join(out, f"{name}_detail_onsets.json"), "w"))


def sm(x, k=10):
    return np.convolve(x, np.ones(k) / k, mode="same")


end = tt[-1]
seg = 30
names = "C C# D D# E F F# G G# A A# B".split()
for s0 in np.arange(t0, end, seg):
    s1 = min(end, s0 + seg)
    fig, ax = plt.subplots(4, 1, figsize=(20, 11), sharex=True, gridspec_kw={"height_ratios": [1.2, 1.2, 1.4, 0.8]})
    m = (tt >= s0) & (tt <= s1)
    for k, c in (("harm_low", "#6a3d9a"), ("harm_mid", "#1f78b4"), ("harm_hi", "#33a02c")):
        ax[0].plot(tt[m], sm(feat[k])[m], color=c, lw=1.2, label=k)
    ax[0].legend(loc="upper left", fontsize=8); ax[0].set_ylabel("harmonic dB")
    for k, c in (("perc_low", "#e31a1c"), ("perc_hi", "#ff7f00"), ("perc_full", "#444")):
        ax[1].plot(tt[m], sm(feat[k], 4)[m], color=c, lw=1.0, label=k)
    ax[1].legend(loc="upper left", fontsize=8); ax[1].set_ylabel("percussive dB")
    mc = (ct >= s0) & (ct <= s1)
    ax[2].imshow(chroma[:, mc], origin="lower", aspect="auto", extent=[ct[mc][0], ct[mc][-1], -0.5, 11.5], cmap="Greys")
    ax[2].set_yticks(range(12)); ax[2].set_yticklabels(names, fontsize=7)
    mo = (tt >= s0) & (tt <= s1)
    ax[3].plot(tt[mo], (onset / onset.max())[mo], color="k", lw=0.6)
    for s in strong:
        if s0 <= s <= s1:
            ax[3].axvline(s, color="r", lw=0.8)
    ax[3].set_xticks(np.arange(np.ceil(s0), s1 + 0.01, 1)); ax[3].tick_params(axis="x", labelsize=7)
    for a in ax: a.grid(axis="x", alpha=0.35)
    ax[0].set_title(f"{name} detail {s0:.0f}-{s1:.0f} s (recording time)")
    plt.tight_layout(); plt.savefig(os.path.join(out, f"{name}_d{int(s0):03d}.png"), dpi=72); plt.close()
print("strong onsets:", strong)
