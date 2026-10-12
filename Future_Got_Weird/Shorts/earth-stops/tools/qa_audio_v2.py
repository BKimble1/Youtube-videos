#!/usr/bin/env python3
"""Measured QA of the v2 Foley (no listening). For each variant writes into qa/v2/AUDIO_MEASUREMENTS_V2.json and qa/v2/sheets/<variant>_sfx_spectrogram.png
Usage: python3 tools/qa_audio_v2.py   (needs ffmpeg + numpy; run after build_audio_v2.py and the SFX mux)"""
import json, os, re, subprocess, wave
import numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
X = f'{ROOT}/exports/v2'


def ebur(path):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-vn', '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    g = lambda k: float(re.findall(rf'^\s+{k}:\s+(-?[\d.]+)', out, re.M)[-1])
    return {'integrated_LUFS': g('I'), 'true_peak_dBFS': g('Peak')}


def run(var, name):
    cues = json.load(open(f'{ROOT}/audio/v2/cues_{var}.json'))
    path = f'{ROOT}/audio/v2/{var}/stems/effects_{var}.wav'
    with wave.open(path) as w:
        ch = w.getnchannels(); n = w.getnframes()
        a = np.frombuffer(w.readframes(n), dtype='<i2').astype(float) / 32768
    a = a.reshape(-1, ch); x = a[:, 0]
    ev = {k: v['t'] for k, v in cues['events'].items()}

    def band(lo, hi, t0, t1):
        seg = x[int(t0 * SR):int(t1 * SR)]
        F = np.abs(np.fft.rfft(seg * np.hanning(len(seg)))) ** 2; f = np.fft.rfftfreq(len(seg), 1 / SR)
        return float(np.sum(F[(f >= lo) & (f < hi)])) + 1e-12

    def rms(t0, t1):
        s = x[int(t0 * SR):int(t1 * SR)]; return float(np.mean(s ** 2)) + 1e-12

    db = lambda v: round(10 * np.log10(v), 1)
    res = {
        'file': f'audio/v2/{var}/stems/effects_{var}.wav', 'samples': int(n), 'duration_s': round(n / SR, 4), 'video_duration_s': cues['duration_s'], 'channels': ch,
        'channels_identical_mono_safe': bool(ch == 1 or np.array_equal(a[:, 0], a[:, 1])),
        'wav_sample_peak_dBFS': round(float(20 * np.log10(np.max(np.abs(x)))), 2),
        'stem_wav_loudness': ebur(path),
        'muxed_aac_loudness': ebur(f'{X}/FGW_EarthStops_{name}_Opening_SFX_1080x1920.mp4'),
        'first_sample_time_s_over_0.01': round(float(np.argmax(np.abs(x) > 0.01) / SR), 4),
        'rms_dBFS_per_250ms': [db(rms(i / 4, min((i + 1) / 4, n / SR))) for i in range(int(np.ceil(n / SR * 4)))],
        'placed_events': sum(1 for _ in open(f'{ROOT}/audio/v2/{var}/SFX_LOG.csv')) - 1,
    }
    # the air rush must fall away with the camera brake. Measured on the air/cloth STEM (the full mix after the brake is dominated by the slide scrape and the bike clicks, so the mix-level contrast is smaller: reported separately)
    b0, b1 = ev['brake_start'], ev['brake_end']
    with wave.open(f'{ROOT}/audio/v2/{var}/stems/foley_air_cloth.wav') as w:
        st = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(float) / 32768
    srms = lambda t0, t1: db(float(np.mean(st[int(t0 * SR):int(t1 * SR)] ** 2)) + 1e-12)
    res['air_cloth_stem_rms_dB'] = {'0.2s_ending_at_brake_start': srms(b0 - 0.2, b0), '0.1_to_0.3s_after_brake_end': srms(b1 + 0.1, b1 + 0.3)}
    res['mix_rms_dB_around_brake'] = {'0.2s_ending_at_brake_start': db(rms(b0 - 0.2, b0)), '0.1_to_0.3s_after_brake_end': db(rms(b1 + 0.1, b1 + 0.3))}
    lt = ev['land']
    res['landing_broadband_30ms_after_vs_before_dB'] = db(rms(lt, lt + 0.03) / rms(lt - 0.03, lt))
    if var == 'ec1':
        g = ev['globe_stop']
        res['globe_stop'] = {
            'whirr_band_500to3000Hz_dB_60ms_before_vs_60to120ms_after': [db(band(500, 3000, g - 0.06, g)), db(band(500, 3000, g + 0.06, g + 0.12))],
            'sub_band_20to120Hz_dB_60ms_before_vs_60ms_after': [db(band(20, 120, g - 0.06, g)), db(band(20, 120, g, g + 0.06))],
            'broadband_rms_dB_60ms_before_vs_60ms_after': [db(rms(g - 0.06, g)), db(rms(g, g + 0.06))],
            'planet_stop_window_peak_vs_mix_peak': [round(float(np.max(np.abs(x[int(g * SR):int((g + 0.12) * SR)]))), 3), round(float(np.max(np.abs(x))), 3)],
        }
    json.dump(res, open(f'{ROOT}/qa/v2/_audio_{var}.json', 'w'), indent=1)
    os.makedirs(f'{ROOT}/qa/v2/sheets', exist_ok=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', path, '-lavfi', 'showspectrumpic=s=1400x520:legend=1:scale=log:fscale=log:stop=12000', f'{ROOT}/qa/v2/sheets/{var}_sfx_spectrogram.png'], check=True)
    return res


out = {'ea2': run('ea2', 'EA2'), 'ec1': run('ec1', 'EC1'),
       'not_done': ['listening (by ear, phone speaker, headphones)', 'any narration/music/ambience interaction (none exist yet)']}
for v in ('ea2', 'ec1'):
    os.remove(f'{ROOT}/qa/v2/_audio_{v}.json')
json.dump(out, open(f'{ROOT}/qa/v2/AUDIO_MEASUREMENTS_V2.json', 'w'), indent=1)
print(json.dumps(out, indent=1))
