#!/usr/bin/env python3
"""Measured QA of the opening's Foley (no listening). Writes qa/AUDIO_MEASUREMENTS.json and qa/sheets/EA_sfx_spectrogram.png.
Usage: python3 tools/qa_audio_opening.py   (needs ffmpeg + numpy)"""
import json, os, re, subprocess, wave
import numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
cues = json.load(open(f'{ROOT}/audio/cues.json'))
with wave.open(f'{ROOT}/audio/stems/effects_opening.wav') as w:
    ch = w.getnchannels(); n = w.getnframes()
    a = np.frombuffer(w.readframes(n), dtype='<i2').astype(float) / 32768
a = a.reshape(-1, ch); x = a[:, 0]
def band(lo, hi, seg):
    F = np.abs(np.fft.rfft(seg * np.hanning(len(seg)))) ** 2; f = np.fft.rfftfreq(len(seg), 1 / SR)
    return float(np.sum(F[(f >= lo) & (f < hi)])) + 1e-12
def rms(t0, t1):
    s = x[int(t0 * SR):int(t1 * SR)]; return float(np.mean(s ** 2)) + 1e-12
def db(v): return round(10 * np.log10(v), 1)
ev = {k: v['t'] for k, v in cues['events'].items()}
def ebur(path, extra=''):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-vn', '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    g = lambda k: float(re.findall(rf'^\s+{k}:\s+(-?[\d.]+)', out, re.M)[-1])
    return {'integrated_LUFS': g('I'), 'true_peak_dBFS': g('Peak')}
tick = int(round(ev['cup_tick'] * SR)); lau = int(round(ev['launch'] * SR))
seg = x[:int(0.05 * SR)]; F = np.abs(np.fft.rfft(seg * np.hanning(len(seg)))) ** 2; f = np.fft.rfftfreq(len(seg), 1 / SR)
res = {
    'file': 'audio/stems/effects_opening.wav', 'samples': int(n), 'duration_s': round(n / SR, 4), 'video_duration_s': cues['duration_s'], 'channels': ch,
    'channels_identical_mono_safe': bool(ch == 1 or np.array_equal(a[:, 0], a[:, 1])),
    'wav_sample_peak_dBFS': round(float(20 * np.log10(np.max(np.abs(x)))), 2),
    'stem_wav_loudness': ebur(f'{ROOT}/audio/stems/effects_opening.wav'),
    'muxed_aac_loudness': ebur(f'{ROOT}/FGW_EarthStops_EA_Opening_SFX_1080x1920.mp4'),
    'first_sample_time_s_over_0.01': round(float(np.argmax(np.abs(x) > 0.01) / SR), 4),
    'first_50ms': {'spectral_centroid_Hz': round(float(np.sum(F * f) / np.sum(F))), 'energy_below_200Hz_pct': round(float(100 * np.sum(F[f < 200]) / np.sum(F)), 1), 'energy_above_1kHz_pct': round(float(100 * np.sum(F[f > 1000]) / np.sum(F)), 1)},
    'onset_lift_dB': {
        'landing_f31_broadband_30ms_after_vs_before': db(rms(ev['land'], ev['land'] + 0.03) / rms(ev['land'] - 0.03, ev['land'])),
        'launch_f9_1to4kHz_30ms_after_vs_before': db(band(1000, 4000, x[lau:lau + 1440]) / band(1000, 4000, x[lau - 1440:lau])),
        'ceramic_tick_f2_2to6kHz_25ms_after_vs_before': db(band(2000, 6000, x[tick:tick + 1200]) / band(2000, 6000, x[tick - 1200:tick])),
    },
    'ceramic_tick_note': 'the 25 ms before the tick is the stop hit, the loudest part of the opening, so the band-energy lift is modest; the tick is the highest-peak event in the mix (see tick_window_peak vs mix_peak)',
    'tick_window_peak': round(float(np.max(np.abs(x[tick:tick + 960]))), 3), 'mix_peak': round(float(np.max(np.abs(x))), 3),
    'rms_dBFS_per_250ms': [db(rms(i / 4, min((i + 1) / 4, n / SR))) for i in range(int(np.ceil(n / SR * 4)))],
    'placed_events': sum(1 for _ in open(f'{ROOT}/audio/OPENING_SFX_LOG.csv')) - 1,
    'not_done': ['listening (by ear, phone speaker, headphones)', 'narration/music/ambience interaction (none exist yet)'],
}
json.dump(res, open(f'{ROOT}/qa/AUDIO_MEASUREMENTS.json', 'w'), indent=1)
os.makedirs(f'{ROOT}/qa/sheets', exist_ok=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f'{ROOT}/audio/stems/effects_opening.wav', '-lavfi', 'showspectrumpic=s=1400x520:legend=1:scale=log:fscale=log:stop=12000', f'{ROOT}/qa/sheets/EA_sfx_spectrogram.png'], check=True)
print(json.dumps(res, indent=1))
