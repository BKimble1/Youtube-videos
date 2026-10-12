#!/usr/bin/env python3
"""Measured QA of the ENCODED V2 review file (no viewer, no listening, no real-time playback). Writes qa/v5/QA_V2.json, qa/v5/spectrogram_mix_v2.png, qa/v5/motion_energy_v2.png.
Checks: container/streams (ffprobe), frame count vs the timeline, loop seam (last frame vs frame 0), black/frozen/low-motion runs, per-second motion energy,
voice integrity (the voice-only stem equals the unmodified take), A/V offset of the AAC track vs the WAV mix, loudness / true peak (WAV and AAC), speech-to-SFX ratio proxy.
Usage: python3 tools/qa_v2.py [mp4]  (needs ffmpeg/ffprobe, numpy, Pillow, matplotlib; reads exports/v5 and audio/v5)"""
import json, os, re, subprocess, sys, wave
import numpy as np
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MP4 = sys.argv[1] if len(sys.argv) > 1 else f'{ROOT}/exports/v5/FGW_EarthStops_V2_Review_1080x1920.mp4'
ST = f'{ROOT}/audio/v5/v2/stems'
SR, FPS = 48000, 30
res = {}


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True, check=True)


# ---- 1) container and streams
pr = json.loads(run(['ffprobe', '-v', 'error', '-show_format', '-show_streams', '-of', 'json', MP4]).stdout)
v = next(s for s in pr['streams'] if s['codec_type'] == 'video'); a = next(s for s in pr['streams'] if s['codec_type'] == 'audio')
cnt = int(run(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', MP4]).stdout.strip())
res['container'] = {'file': os.path.relpath(MP4, ROOT), 'video': f"{v['codec_name']} {v['profile']} {v['width']}x{v['height']} {v['r_frame_rate']} {v['pix_fmt']} {v.get('color_space')}", 'frames_counted': cnt,
                    'audio': f"{a['codec_name']} {a['sample_rate']} Hz {a['channels']} ch {int(a['bit_rate']) // 1000} kb/s", 'format_duration_s': float(pr['format']['duration']), 'video_duration_s': float(v['duration']), 'audio_duration_s': float(a['duration']),
                    'size_MB': round(os.path.getsize(MP4) / 1e6, 2), 'within_Shorts_limit_60s': float(pr['format']['duration']) <= 60}

# ---- 2) pictures: gray 270x480 for motion energy, full-res first/last frames for the seam
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', MP4, '-vf', 'scale=270:480:flags=area,format=gray', '-f', 'rawvideo', '-'], capture_output=True, check=True).stdout
G = np.frombuffer(raw, dtype=np.uint8).reshape(-1, 480, 270).astype(np.float32)
n = len(G)
res['frames_decoded'] = int(n)
diff = np.array([0.0] + [float(np.abs(G[i] - G[i - 1]).mean()) for i in range(1, n)])
lum = G.mean(axis=(1, 2))
res['luminance'] = {'min_mean_gray': round(float(lum.min()), 1), 'frames_below_20': [int(i) for i in np.nonzero(lum < 20)[0]][:20], 'max_mean_gray': round(float(lum.max()), 1)}
med = float(np.median(diff[1:]))
res['motion_energy'] = {'median_adjacent_frame_mean_abs_diff_0_255': round(med, 3), 'p10': round(float(np.percentile(diff[1:], 10)), 3), 'p90': round(float(np.percentile(diff[1:], 90)), 3), 'max': round(float(diff.max()), 2), 'max_at_frame': int(diff.argmax())}
# frozen: identical consecutive frames (diff < 0.02); low motion: diff < 0.25 * median
def runs(mask, minlen):
    out, i = [], 0
    while i < len(mask):
        if mask[i]:
            j = i
            while j + 1 < len(mask) and mask[j + 1]: j += 1
            if j - i + 1 >= minlen: out.append([int(i), int(j), j - i + 1])
            i = j + 1
        else: i += 1
    return out
res['frozen_runs_(>=3 identical frames)_[start,end,len]'] = runs(diff < 0.02, 3)
res['low_motion_runs_(diff<25%_of_median,>=8_frames)_[start,end,len]'] = runs(diff < 0.25 * med, 8)
per_s = [round(float(diff[i:i + FPS].mean()), 2) for i in range(0, n, FPS)]
res['motion_energy_per_second'] = per_s
# scene cut / jump candidates: adjacent diff > 3 x the 95th percentile
thr = 3 * float(np.percentile(diff[1:], 95))
res['jump_frames_(diff>3x_p95)'] = [[int(i), round(float(diff[i]), 1)] for i in np.nonzero(diff > thr)[0]]

# loop seam, full resolution RGB: frame n-1 vs frame 0, and ordinary adjacent diffs around both
def grab(idx):
    import io
    out = {}
    for i in idx:
        b = subprocess.run(['ffmpeg', '-v', 'error', '-i', MP4, '-vf', f'select=eq(n\\,{i})', '-vsync', '0', '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True, check=True).stdout
        out[i] = np.asarray(Image.open(io.BytesIO(b)).convert('RGB')).astype(np.float32)
    return out
fr = grab([0, 1, 2, n - 3, n - 2, n - 1])
md = lambda x, y: round(float(np.abs(fr[x] - fr[y]).mean()), 3)
res['loop_seam_full_res_mean_abs_diff'] = {'last_vs_first': md(n - 1, 0), 'last_vs_previous': md(n - 1, n - 2), 'previous_vs_before': md(n - 2, n - 3), 'first_vs_second': md(0, 1), 'second_vs_third': md(1, 2),
                                           'note': 'last_vs_first near 0 means the last frame IS the first frame, so on loop that frame is shown twice (a one-frame, 33 ms hold); compare with the ordinary adjacent diffs'}

# ---- 3) audio
def wav(path):
    with wave.open(path) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(np.float64) / 32768
        return x.reshape(-1, w.getnchannels()), w.getframerate()
mix, _ = wav(f'{ST}/mix_v2.wav'); vo, _ = wav(f'{ST}/voice_only_v2.wav'); so, _ = wav(f'{ST}/sfx_only_v2.wav'); take, _ = wav(f'{ROOT}/audio/v5/voice/v2_takeB_48k.wav')
m, vv, ss, tk = mix[:, 0], vo[:, 0], so[:, 0], take[:, 0]
nn = min(len(vv), len(tk))
g = float(np.dot(vv[:nn], tk[:nn]) / np.dot(tk[:nn], tk[:nn]))  # least-squares gain between the take and the voice stem in the mix
resid = vv[:nn] - g * tk[:nn]
res['voice_integrity'] = {'take_samples': int(len(tk)), 'voice_only_samples': int(len(vv)), 'gain_applied_to_voice_in_mix_dB': round(float(20 * np.log10(g)), 3),
                          'max_abs_residual_after_gain_(16-bit_full_scale=1)': float(np.max(np.abs(resid))), 'rms_residual_dB_rel_voice': round(float(20 * np.log10(np.sqrt(np.mean(resid ** 2)) / np.sqrt(np.mean((g * tk[:nn]) ** 2)) + 1e-12)), 1),
                          'channels_identical': bool(np.array_equal(vo[:, 0], vo[:, 1])),
                          'note': 'voice_only_v2.wav = the take, unmodified (no trim, stretch, pitch, EQ, compression), placed at 0 s, scaled by ONE constant gain (the mix level); a residual near the 16-bit quantisation floor (-90 dB) confirms nothing else was done'}


def ebur(path):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-vn', '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    g = lambda k: float(re.findall(rf'^\s+{k}:\s+(-?[\d.]+)', out, re.M)[-1])
    return {'integrated_LUFS': g('I'), 'LRA_LU': g('LRA'), 'true_peak_dBFS': g('Peak')}
res['loudness'] = {'mix_wav': ebur(f'{ST}/mix_v2.wav'), 'review_mp4_aac': ebur(MP4), 'voice_only_wav': ebur(f'{ST}/voice_only_v2.wav')}
res['audio_durations_s'] = {'mix_wav': round(len(m) / SR, 3), 'video': res['container']['video_duration_s']}
res['sample_peak_dBFS_mix'] = round(float(20 * np.log10(np.max(np.abs(m)))), 2)
# A/V offset: decode the mp4's AAC to 48 kHz mono, cross-correlate the amplitude envelopes with the WAV mix (a positive lag = the AAC is later than the WAV)
dec = subprocess.run(['ffmpeg', '-v', 'error', '-i', MP4, '-vn', '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True, check=True).stdout
d = np.frombuffer(dec, dtype='<i2').astype(np.float64) / 32768
L = min(len(d), len(m)); win = 48
def env(x): return np.sqrt(np.convolve(x[:L] ** 2, np.ones(win) / win, mode='same'))
e1, e2 = env(m[:L]), env(d[:L])
ds = 8
e1d, e2d = e1[::ds], e2[::ds]
maxlag = int(0.12 * SR / ds)
c = [np.dot(e1d[max(0, -k):len(e1d) - max(0, k)], e2d[max(0, k):len(e2d) - max(0, -k)]) for k in range(-maxlag, maxlag + 1)]
lag = (int(np.argmax(c)) - maxlag) * ds
res['av_offset'] = {'aac_vs_wav_lag_samples': lag, 'aac_vs_wav_lag_ms': round(1000 * lag / SR, 2), 'decoded_aac_samples': int(len(d)), 'mp4_audio_start_time_s': float(a.get('start_time', 0)), 'mp4_video_start_time_s': float(v.get('start_time', 0)),
                     'note': 'measures the encoded audio against the WAV it was made from; picture-to-voice alignment inside the WAV is by construction (same TS modules) and checked by qa_captions_v2.py'}

# speech-to-SFX proxy (300-3400 Hz, 100 ms voiced windows)
n100 = int(0.1 * SR); env_v = np.sqrt(np.convolve(vv ** 2, np.ones(int(0.02 * SR)) / int(0.02 * SR), mode='same')); thr_v = 0.05 * env_v.max()
def bandE(x):
    X = np.fft.rfft(x * np.hanning(len(x))); f = np.fft.rfftfreq(len(x), 1 / SR); return float(np.sum(np.abs(X[(f >= 300) & (f < 3400)]) ** 2))
rat = []
for i in range(0, len(vv) - n100, n100):
    if np.mean(env_v[i:i + n100] > thr_v) < 0.8: continue
    rat.append((i / SR, 10 * np.log10((bandE(vv[i:i + n100]) + 1e-18) / (bandE(ss[i:i + n100]) + 1e-18))))
r = np.array([x[1] for x in rat])
res['speech_to_sfx_proxy_300_3400Hz'] = {'voiced_100ms_windows': int(len(r)), 'median_dB': round(float(np.median(r)), 1), 'p5_dB': round(float(np.percentile(r, 5)), 1), 'p1_dB': round(float(np.percentile(r, 1)), 1), 'worst_dB': round(float(r.min()), 1), 'worst_at_s': round(rat[int(np.argmin(r))][0], 2),
                                         'windows_below_+6_dB': int(np.sum(r < 6)), 'worst_12_(s,dB)': [[round(t, 2), round(x, 1)] for t, x in sorted(rat, key=lambda t: t[1])[:12]],
                                         'caveat': 'a spectral-energy proxy for masking; it is not intelligibility and not a listening test'}
# silence: stretches where the full mix is below -50 dBFS RMS (50 ms windows)
w50 = int(0.05 * SR); rm = np.array([np.sqrt(np.mean(m[i:i + w50] ** 2) + 1e-14) for i in range(0, len(m) - w50, w50)]); dbm = 20 * np.log10(rm)
res['mix_silent_stretches_(<-50_dBFS,_>=100_ms)_[start_s,end_s]'] = [[round(a_ * 0.05, 2), round((b_ + 1) * 0.05, 2)] for a_, b_, l_ in runs(dbm < -50, 2)]

# ---- 4) figures
try:
    import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
    fig, ax = plt.subplots(3, 1, figsize=(13, 9), sharex=False)
    t = np.arange(n) / FPS
    ax[0].plot(t, diff, lw=0.7); ax[0].axhline(0.25 * med, color='r', lw=0.5); ax[0].set_ylabel('adjacent-frame diff'); ax[0].set_xlim(0, n / FPS); ax[0].set_title('V2 motion energy (mean abs diff, 270x480 gray); red = 25 % of median')
    ax[1].specgram(m, NFFT=2048, Fs=SR, noverlap=1536, cmap='magma', vmin=-130, vmax=-30); ax[1].set_ylim(0, 8000); ax[1].set_ylabel('Hz'); ax[1].set_title('mix spectrogram (0-8 kHz)')
    tt = np.arange(len(m)) / SR
    ax[2].plot(tt[::96], 20 * np.log10(np.abs(vv[::96]) + 1e-5), lw=0.4, label='voice'); ax[2].plot(tt[::96], 20 * np.log10(np.abs(ss[::96]) + 1e-5), lw=0.4, label='sfx', alpha=0.7); ax[2].set_ylim(-80, 0); ax[2].legend(); ax[2].set_xlabel('s'); ax[2].set_ylabel('dBFS (sample)')
    fig.tight_layout(); fig.savefig(f'{ROOT}/qa/v5/qa_figures_v2.png', dpi=90)
except Exception as e:  # figures are optional
    res['figures_error'] = repr(e)
json.dump(res, open(f'{ROOT}/qa/v5/QA_V2.json', 'w'), indent=1)
print(json.dumps({k: res[k] for k in res if k not in ('motion_energy_per_second',)}, indent=1))
print('motion/s', res['motion_energy_per_second'])
