"""Evidence for where the singer is in the closing song, without speech recognition or listening.

Features (20 ms hop):
  - consonant bursts: aperiodic energy 4.5-9 kHz from the percussive/residual part that is not explained by the
    harmonic part (sibilants and plosives of sung words; the band's cymbals also show here, so it is read together
    with the next two)
  - syllable modulation: 3-7 Hz modulation depth of the 300-3000 Hz harmonic band in a 1 s window
  - brightness of the lead line: ratio of harmonic energy 2.5-6 kHz to 0.3-2.5 kHz (a 1940s trumpet lead is much
    brighter than a voice)
  - pYIN melody (dominant f0) with voicing probability
Writes 20 s spectrogram panels (0-6 kHz) with those curves.
Usage: python3 tools/analyze_vocal.py <wav> <name> <out_dir> [t0 t1]
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
sr = 22050
y, _ = librosa.load(wav, sr=sr, mono=True, offset=t0, duration=None if t1 is None else t1 - t0)
hop, nfft = 441, 2048
X = librosa.stft(y, n_fft=nfft, hop_length=hop)
Hm, Pc = librosa.decompose.hpss(X, margin=(1.0, 3.0))
R = X - Hm - Pc
fr = librosa.fft_frequencies(sr=sr, n_fft=nfft)
tt = t0 + np.arange(X.shape[1]) * hop / sr


def bandp(M, lo, hi):
    m = (fr >= lo) & (fr < hi)
    return np.sum(np.abs(M[m]) ** 2, axis=0) + 1e-10


cons = 10 * np.log10(bandp(Pc + R, 4500, 9000)) - 10 * np.log10(bandp(Hm, 4500, 9000))
lead = bandp(Hm, 300, 3000)
env = np.log(lead)
win = 50  # 1 s
mod = np.zeros_like(env)
fps = sr / hop
for i in range(len(env)):
    a, b = max(0, i - win // 2), min(len(env), i + win // 2)
    seg = env[a:b] - np.mean(env[a:b])
    if len(seg) < 20:
        continue
    S = np.abs(np.fft.rfft(seg * np.hanning(len(seg)), n=256))
    f = np.fft.rfftfreq(256, 1 / fps)
    mod[i] = np.sum(S[(f >= 3) & (f <= 7)]) / (np.sum(S[(f > 0.5) & (f <= 12)]) + 1e-9)
bright = 10 * np.log10(bandp(Hm, 2500, 6000) / bandp(Hm, 300, 2500))
f0, vflag, vprob = librosa.pyin(y, fmin=150, fmax=1100, sr=sr, frame_length=2048, hop_length=hop)

sm = lambda x, k=12: np.convolve(np.nan_to_num(x), np.ones(k) / k, mode="same")
json.dump({"t": [round(float(v), 2) for v in tt[::5]], "cons": [round(float(v), 2) for v in sm(cons)[::5]],
           "mod": [round(float(v), 3) for v in sm(mod)[::5]], "bright": [round(float(v), 2) for v in sm(bright)[::5]]},
          open(os.path.join(out, f"{name}_vocal_features.json"), "w"))

Sdb = librosa.amplitude_to_db(np.abs(X), ref=np.max)
kmax = int(6000 / (sr / nfft))
end = tt[-1]
for s0 in np.arange(t0, end, 20):
    s1 = min(end, s0 + 20)
    m = (tt >= s0) & (tt <= s1)
    fig, ax = plt.subplots(4, 1, figsize=(22, 12), sharex=True, gridspec_kw={"height_ratios": [4, 1, 1, 1]})
    ax[0].imshow(Sdb[:kmax, m], origin="lower", aspect="auto", extent=[tt[m][0], tt[m][-1], 0, 6000], cmap="magma", vmin=-75, vmax=-5)
    ax[0].plot(tt[m], np.where(vprob[m] > 0.35, f0[m], np.nan), color="cyan", lw=1.0)
    ax[0].set_ylabel("Hz (cyan = pYIN melody)"); ax[0].set_title(f"{name} vocal evidence {s0:.0f}-{s1:.0f} s (recording time)")
    ax[1].plot(tt[m], sm(cons)[m], color="#d62728"); ax[1].set_ylabel("consonant\nburst dB")
    ax[2].plot(tt[m], sm(mod)[m], color="#2ca02c"); ax[2].set_ylabel("3-7 Hz\nsyllable mod")
    ax[3].plot(tt[m], sm(bright)[m], color="#9467bd"); ax[3].set_ylabel("lead\nbrightness dB")
    ax[3].set_xticks(np.arange(np.ceil(s0), s1 + 0.01, 0.5)); ax[3].tick_params(axis="x", labelsize=7, rotation=90)
    for a in ax: a.grid(axis="x", alpha=0.3)
    plt.tight_layout(); plt.savefig(os.path.join(out, f"{name}_v{int(s0):03d}.png"), dpi=66); plt.close()
print("done")
