"""audio_view.py MIX.wav STEMS_DIR OUT.png : spectrogram + per-stem level lanes with the section grid."""
import sys, glob, os
import numpy as np, soundfile as sf
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
mix, sr = sf.read(sys.argv[1]); m = mix.mean(1)
stems = sorted(glob.glob(os.path.join(sys.argv[2], "*.wav")))
fig, axs = plt.subplots(2, 1, figsize=(22, 14), gridspec_kw={"height_ratios": [1, 2.2]})
axs[0].specgram(m, NFFT=2048, Fs=sr, noverlap=1536, cmap="magma", vmin=-120)
axs[0].set_ylim(20, 16000); axs[0].set_yscale("log"); axs[0].set_xlim(0, 30.5)
hop = int(0.02 * sr)
for i, f in enumerate(stems):
    x, _ = sf.read(f); x = x.mean(1)
    n = len(x) // hop
    r = np.sqrt(np.mean(x[: n * hop].reshape(n, hop) ** 2, 1) + 1e-12)
    d = np.clip(20 * np.log10(r) + 60, 0, 60) / 60
    t = np.arange(n) * hop / sr
    axs[1].fill_between(t, i, i + d * 0.9, step="mid", color=plt.cm.tab20(i % 20))
    axs[1].text(-0.2, i + 0.3, os.path.basename(f)[:-4], ha="right", fontsize=9)
axs[1].set_xlim(0, 30.5); axs[1].set_ylim(0, len(stems))
for a in axs:
    for b in range(0, 31, 2):
        a.axvline(b, color="w" if a is axs[0] else "k", lw=0.5, alpha=0.4)
    for s in (4, 10, 18, 21, 22, 26, 27.75, 28):
        a.axvline(s, color="cyan" if a is axs[0] else "r", lw=1.2, alpha=0.8)
plt.tight_layout(); plt.savefig(sys.argv[3], dpi=60)
