#!/usr/bin/env python3
"""Measured QA of the V5 sound (no listening). Writes qa/v8/AUDIO_MEASUREMENTS_V5.json. Usage: python3 tools/qa_audio_v5.py
1 loudness / true peak of the AAC mp4s; 2 AAC-vs-WAV alignment; 3 narration integrity (cut-only: every kept piece of take A equals its slice of the timeline; the mix's voice stem = timeline at one gain);
4 dual-mono; 5 masking proxy (300-3400 Hz, 100 ms windows) incl. the named hits; 6 event timing in the encode (peak of the effects stem against the picture frame); 7 audio loop seam; 8 dead air."""
import json, os, re, subprocess, wave
import numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
X = f'{ROOT}/exports/v8'; ST = f'{ROOT}/audio/v8/v5/stems'; V = f'{ROOT}/audio/v7/voice'
SR = 48000; FPS = 30
def wav(p):
    w = wave.open(p); x = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(float) / 32768
    return x.reshape(-1, w.getnchannels()).T
def aac(p):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-vn', '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(r, dtype='<f4').reshape(-1, 2).T.astype(float)
def ebur(p):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', p, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    f = lambda k: float(re.findall(rf'^\s+{k}:\s+(-?[\d.]+)', out, re.M)[-1])
    return {'integrated_LUFS': f('I'), 'LRA_LU': f('LRA'), 'true_peak_dBTP': f('Peak')}
R = {}
R['loudness_aac'] = {n: ebur(f'{X}/FGW_EarthStops_V5_{n}_1080x1920.mp4') for n in ('Review', 'ReviewNoMusic')}
R['loudness_wav'] = {n: ebur(f'{ST}/{n}.wav') for n in ('mix_v5', 'mix_v5_nomusic')}
# 2 alignment AAC vs WAV
a = aac(f'{X}/FGW_EarthStops_V5_Review_1080x1920.mp4')[0]; w = wav(f'{ST}/mix_v5.wav')[0]
n = min(len(a), len(w), 10 * SR); c = np.correlate(a[:n][::4], w[:n][::4], 'full'); lag = (np.argmax(c) - (n // 4 - 1)) * 4
R['aac_vs_wav'] = {'lag_samples': int(lag), 'lag_ms': round(1000 * lag / SR, 2), 'aac_samples': len(a), 'wav_samples': len(w)}
# 3 narration integrity
take = wav(f'{V}/v4_takeA_48k.wav')[0]; tl = wav(f'{V}/voice_v4_timeline.wav')[0]
ed = json.load(open(f'{ROOT}/source/src/film5/voice5.json'))['edits']
cuts = [tuple(e['removed_take_local']) for e in ed]
pieces, pos = [], 0.0
for r0, r1 in cuts: pieces.append((pos, r0)); pos = r1
pieces.append((pos, len(take) / SR))
out, t0, ress = [], 0, []
f6 = int(0.006 * SR)
for k, (p0, p1) in enumerate(pieces):
    s = take[int(round(p0 * SR)):int(round(p1 * SR))]
    L = len(s); lo = f6 if k > 0 else 0; hi = f6 if k < len(pieces) - 1 else 0
    g = tl[t0:t0 + L]
    if k > 0: t0 += L - f6
    else: t0 += L - f6
    a0, a1 = lo, L - hi
    if a1 > a0 and len(g) == L:
        d = g[a0:a1] - s[a0:a1]; ress.append(float(20 * np.log10(np.sqrt(np.mean(d ** 2)) / (np.sqrt(np.mean(s[a0:a1] ** 2)) + 1e-12) + 1e-12)))
R['narration_cut_only'] = {'pieces': len(pieces), 'removed_total_s': round(sum(r1 - r0 for r0, r1 in cuts), 3), 'residual_dB_per_piece_vs_take_A_outside_6ms_joins': [round(x, 1) for x in ress],
                           'note': 'only silent audio between speech groups was removed; no stretch, speed or pitch change; each kept piece equals the take-A slice (residual below -60 dB = rounding)'}
vs = wav(f'{ST}/voice_only_v5.wav')[0][:len(tl)]; g = float(np.dot(vs, tl[:len(vs)]) / np.dot(tl[:len(vs)], tl[:len(vs)]))
R['voice_stem_vs_timeline'] = {'gain_dB': round(20 * np.log10(g), 2), 'residual_dB': round(float(20 * np.log10(np.sqrt(np.mean((vs - g * tl[:len(vs)]) ** 2)) / np.sqrt(np.mean(vs ** 2)) + 1e-12)), 1)}
# 4 mono
m = wav(f'{ST}/mix_v5_nomusic.wav'); R['dual_mono'] = {'max_abs_L_minus_R': float(np.max(np.abs(m[0] - m[1])))}
# 5 masking proxy for the named hits
v = wav(f'{ST}/voice_only_v5.wav')[0]; s = wav(f'{ST}/sfx_only_v5.wav')[0]
def band(x):
    X_ = np.fft.rfft(x * np.hanning(len(x))); f = np.fft.rfftfreq(len(x), 1 / SR); return float(np.sum(np.abs(X_[(f >= 300) & (f < 3400)]) ** 2)) + 1e-18
nn = int(0.1 * SR); env = np.sqrt(np.convolve(v ** 2, np.ones(int(0.02 * SR)) / int(0.02 * SR), mode='same')); thr = 0.05 * env.max(); rows = []
for i in range(0, len(v) - nn, nn):
    if np.mean(env[i:i + nn] > thr) >= 0.8: rows.append((i / SR, 10 * np.log10(band(v[i:i + nn]) / band(s[i:i + nn]))))
r = np.array([x[1] for x in rows])
R['masking_proxy'] = {'voiced_windows': len(r), 'median_dB': round(float(np.median(r)), 1), 'p5_dB': round(float(np.percentile(r, 5)), 1), 'p1_dB': round(float(np.percentile(r, 1)), 1), 'worst_dB': round(float(r.min()), 1), 'worst_at_s': round(rows[int(np.argmin(r))][0], 2),
                      'windows_below_6dB': [(round(x[0], 2), round(x[1], 1)) for x in rows if x[1] < 6]}
def at100(t): i = int(t * SR); return round(10 * np.log10(band(v[i:i + nn]) / band(s[i:i + nn])), 1)
R['masking_named_windows_dB'] = {'lock_vs_stopped_0.4s': at100(0.4), 'lock_0.5s': at100(0.5), 'bike_clang_2.3s(pause)': at100(2.3), 'chair_thwack_4.6s(pause)': at100(4.6), 'wave_hit_on_coast_11.2s(unvoiced_window_excluded)': at100(11.2)}
# word-level look at the wave hit on "coast." (voice band vs effects band, 50 ms)
n5 = int(0.05 * SR); R['coast_hit_50ms_voice_vs_fx_dB'] = {f'{t:.2f}': round(10 * np.log10(band(v[int(t * SR):int(t * SR) + n5]) / band(s[int(t * SR):int(t * SR) + n5])), 1) for t in np.arange(11.0, 11.5, 0.05)}
# 6 event timing: peak of the effects stem in a window around the cue
def peak_t(t0, t1): i0, i1 = int(t0 * SR), int(t1 * SR); return (i0 + int(np.argmax(np.abs(s[i0:i1])))) / SR
ev = json.load(open(f'{ROOT}/audio/v8/cues_v5.json'))['events']
R['event_timing_in_encode'] = {
    'lock accent (picture contact f%d = %.3f s)' % (ev['brake']['contact'], ev['brake']['contact'] / FPS): round(peak_t(0.45, 0.7), 3),
    'bike clang (f%d = %.3f s)' % (ev['street']['bike_hit'], ev['street']['bike_hit'] / FPS): round(peak_t(2.3, 2.6), 3),
    'chair thwack (f%d = %.3f s)' % (ev['street']['chair_hit'], ev['street']['chair_hit'] / FPS): round(peak_t(4.5, 4.8), 3),
    'wave hit (f%d = %.3f s)' % (ev['coast']['hit'], ev['coast']['hit'] / FPS): round(peak_t(11.1, 11.35), 3),
    'pier snap / post break (f%d = %.3f s)' % (ev['coast']['postBreak'], ev['coast']['postBreak'] / FPS): round(peak_t(11.25, 11.45), 3),
    'caliper seat clunk (f%d = %.3f s)' % (ev['finale']['caliper'][1], ev['finale']['caliper'][1] / FPS): round(peak_t(19.05, 19.3), 3)}
# 7 loop seam of the final mix
mm = wav(f'{ST}/mix_v5.wav')[0]; d = np.abs(np.diff(mm)); R['audio_loop_seam'] = {'first_sample': float(mm[0]), 'last_sample': float(mm[-1]), 'abs_step_across_seam': float(abs(mm[0] - mm[-1])), 'median_abs_sample_step': float(np.median(d)), 'p99_abs_sample_step': float(np.percentile(d, 99)),
                                                                             'rms_last_20ms': float(np.sqrt(np.mean(mm[-960:] ** 2))), 'rms_first_20ms': float(np.sqrt(np.mean(mm[:960] ** 2)))}
# 8 dead air: 100 ms windows of the no-music mix below -48 dBFS
mn = wav(f'{ST}/mix_v5_nomusic.wav')[0]; q = [(round(i / SR, 2), round(20 * np.log10(np.sqrt(np.mean(mn[i:i + nn] ** 2)) + 1e-9), 1)) for i in range(0, len(mn) - nn + 1, nn) if 20 * np.log10(np.sqrt(np.mean(mn[i:i + nn] ** 2)) + 1e-9) < -48]
R['dead_air_windows_below_-48dBFS'] = q
json.dump(R, open(f'{ROOT}/qa/v8/AUDIO_MEASUREMENTS_V5.json', 'w'), indent=1)
print(json.dumps(R, indent=1))
