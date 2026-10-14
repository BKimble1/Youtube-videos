"""V3 audio QA from the stems and mix (measurement only; nobody has listened here).
- loudness / true peak of the mix and stems (ffmpeg ebur128)
- voice-to-bed margin inside every speech group, broadband and speech-weighted (bed high-passed at 200 Hz)
- stems sum to the mix; mix duration matches the picture
Usage: python3 tools/qa_audio_v3.py [out.json]"""
import json, subprocess, sys, wave
from pathlib import Path
import numpy as np
ROOT = Path(__file__).resolve().parents[1]
SR = 48000
def rd(p):
    w = wave.open(str(p)); n = w.getnframes(); b = np.frombuffer(w.readframes(n), np.uint8).reshape(-1, 3)
    x = (b[:, 0].astype(np.int32) | (b[:, 1].astype(np.int32) << 8) | (b[:, 2].astype(np.int32) << 16)); x = np.where(x >= 1 << 23, x - (1 << 24), x) / 8388607
    return x.reshape(-1, w.getnchannels())
def ebu(p):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(p), '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    t = r[r.rfind('Summary:'):]
    return {'I_lufs': float(t.split('I:')[1].split('LUFS')[0]), 'LRA_lu': float(t.split('LRA:')[1].split('LU')[0]), 'TP_dbtp': float(t.split('Peak:')[1].split('dBFS')[0])}
def hp(x, f0=200):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X[f < f0] = 0
    return np.fft.irfft(X, len(x))
mix = rd(ROOT / 'audio/v3/mix/FGW_DeathClock_mix_48k.wav'); n = rd(ROOT / 'audio/v3/stems/narration.wav'); m = rd(ROOT / 'audio/v3/stems/music.wav'); e = rd(ROOT / 'audio/v3/stems/effects.wav')
res = {'mix': ebu(ROOT / 'audio/v3/mix/FGW_DeathClock_mix_48k.wav'), 'narration': ebu(ROOT / 'audio/v3/stems/narration.wav'), 'music': ebu(ROOT / 'audio/v3/stems/music.wav'), 'effects': ebu(ROOT / 'audio/v3/stems/effects.wav')}
res['stems_sum_max_abs_error'] = float(np.abs(n + m + e - mix).max())
res['duration_s'] = len(mix) / SR
nn = n.mean(1); bed = (m + e).mean(1); bedw = hp(bed)
g = json.load(open(ROOT / 'audio/narration_v3/narration_words_final.json'))['groups_final']
W = int(0.4 * SR); rows = []
for a, b in g:
    for s in np.arange(a, b - 0.4, 0.2):
        i = int(s * SR)
        vn = np.sqrt(np.mean(nn[i:i + W] ** 2)); vb = np.sqrt(np.mean(bed[i:i + W] ** 2)); vw = np.sqrt(np.mean(bedw[i:i + W] ** 2))
        rows.append((round(float(s), 2), round(float(20 * np.log10(vn / (vb + 1e-12))), 1), round(float(20 * np.log10(vn / (vw + 1e-12))), 1)))
bb = sorted(r[1] for r in rows); ww = sorted(r[2] for r in rows)
res['voice_margin_db'] = {'broadband': {'min': bb[0], 'p5': bb[len(bb) // 20], 'median': bb[len(bb) // 2]}, 'speech_weighted': {'min': ww[0], 'p5': ww[len(ww) // 20], 'median': ww[len(ww) // 2]},
                          'lowest_windows': sorted(rows, key=lambda r: r[2])[:6]}
print(json.dumps(res, indent=1))
if len(sys.argv) > 1: json.dump(res, open(sys.argv[1], 'w'), indent=1)
