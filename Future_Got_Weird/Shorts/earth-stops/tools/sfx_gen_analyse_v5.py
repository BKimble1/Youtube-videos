#!/usr/bin/env python3
"""Measured descriptors + spectrogram sheet of the ElevenLabs-generated SFX candidates (audio/v5/sfx_gen/*.mp3), and an audition reel (each candidate, 0.6 s gap, announced by a short tick pattern).
Descriptors are supporting evidence for placement (duration, onset, midrange share), NOT a quality judgement: nobody has listened. Writes audio/v5/sfx_gen/SFX_GEN_ANALYSIS.json, SFX_GEN_spectrograms.png, audition_reel_gen.wav."""
import glob, json, os, subprocess, wave
import numpy as np
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = f'{ROOT}/audio/v5/sfx_gen'; SR = 48000
def load(p): return np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, dtype='<f4').astype(np.float64)
files = sorted(glob.glob(f'{D}/*.mp3')); res = {}
fig, axs = plt.subplots(4, 4, figsize=(18, 11)); axs = axs.ravel()
reel = []
for i, p in enumerate(files):
    x = load(p); n = os.path.basename(p)[:-4]
    t = len(x) / SR; env = np.sqrt(np.convolve(x ** 2, np.ones(480) / 480, mode='same'))
    pk = float(np.abs(x).max()); thr = 0.1 * env.max()
    onset = float(np.argmax(env > thr) / SR); peak_t = float(np.argmax(env) / SR)
    F = np.abs(np.fft.rfft(x * np.hanning(len(x)))) ** 2; f = np.fft.rfftfreq(len(x), 1 / SR)
    tot = F.sum() + 1e-18; band = lambda a, b: float(F[(f >= a) & (f < b)].sum() / tot)
    cen = float((f * F).sum() / tot)
    res[n] = {'duration_s': round(t, 2), 'sample_peak_dBFS': round(20 * np.log10(pk + 1e-9), 1), 'onset_s_(env>10%)': round(onset, 3), 'envelope_peak_s': round(peak_t, 2), 'spectral_centroid_Hz': round(cen),
              'energy_share_<120Hz': round(band(0, 120), 3), '120-500Hz': round(band(120, 500), 3), '500-4000Hz': round(band(500, 4000), 3), '>4000Hz': round(band(4000, 24000), 3),
              'tail_s_(env<5%_of_peak_after_peak)': round(float(np.argmax(env[int(peak_t * SR):] < 0.05 * env.max()) / SR) if (env[int(peak_t * SR):] < 0.05 * env.max()).any() else t - peak_t, 2)}
    axs[i].specgram(x, NFFT=1024, Fs=SR, noverlap=768, cmap='magma', vmin=-120, vmax=-30); axs[i].set_ylim(0, 10000); axs[i].set_title(f'{n}  {t:.2f}s', fontsize=9)
    tick = np.zeros(int(0.12 * SR)); tt = np.arange(len(tick)) / SR
    reel += [np.sin(2 * np.pi * (900 + 150 * (i // 2)) * tt) * np.exp(-tt / 0.02) * 0.3, np.zeros(int(0.25 * SR)), x * (0.5 / (pk + 1e-9)), np.zeros(int(0.6 * SR))]
fig.tight_layout(); fig.savefig(f'{D}/SFX_GEN_spectrograms.png', dpi=70)
json.dump(res, open(f'{D}/SFX_GEN_ANALYSIS.json', 'w'), indent=1)
r = np.concatenate(reel); r = np.clip(r, -1, 1)
w = wave.open(f'{D}/audition_reel_gen.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((r * 32767).astype('<i2').tobytes()); w.close()
for k, v in res.items(): print(k, v)
