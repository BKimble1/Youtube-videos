#!/usr/bin/env python3
"""V3 loop seam check, on the ENCODED master (exports/v3/FGW_DeathClock_V3_Final_1080x1920.mp4):
  1. builds qa/v3/seam/seam_check_x3.mp4: (last 1.5 s + first 1.5 s) three times, picture and sound, for review;
  2. picture: mean absolute frame difference for every consecutive pair in the last 2 s and first 2 s, and for
     the wrap pair (last frame -> frame 0), so the join can be compared with the motion on either side;
  3. sound (from the final mix WAV): short-window RMS across the join, sample-step at the join, and the
     narration stem's silence at the join (no syllable cut);
  4. a strip of the frames either side of the join (qa/v3/seam/seam_frames.jpg).
Writes qa/v3/seam/SEAM_CHECK.json. Usage: python3 tools/seam_check_v3.py"""
import json, subprocess
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
F = ROOT / 'exports' / 'v3' / 'FGW_DeathClock_V3_Final_1080x1920.mp4'
MIX = ROOT / 'audio' / 'v3' / 'mix' / 'FGW_DeathClock_mix_48k.wav'
NAR = ROOT / 'audio' / 'v3' / 'stems' / 'narration.wav'
OUT = ROOT / 'qa' / 'v3' / 'seam'
OUT.mkdir(parents=True, exist_ok=True)
FPS, N, SR = 30, 1350, 48000


def frames(idx, w=270, h=480):
    sel = '+'.join(f'eq(n\\,{i})' for i in idx)
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(F), '-vf', f"select='{sel}',scale={w}:{h}", '-vsync', '0', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3).astype(np.float32)
    return a


def wav(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(p), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


# 1. the review clip: tail + head, three times
seg = [('tail', N / FPS - 1.5, N / FPS), ('head', 0.0, 1.5)] * 3
parts, inputs = [], []
for k, (_, a, b) in enumerate(seg):
    parts.append(f'[0:v]trim=start={a}:end={b},setpts=PTS-STARTPTS[v{k}];[1:a]atrim=start={a}:end={b},asetpts=PTS-STARTPTS[a{k}]')
fc = ';'.join(parts) + ';' + ''.join(f'[v{k}][a{k}]' for k in range(len(seg))) + f'concat=n={len(seg)}:v=1:a=1[v][a]'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(F), '-i', str(MIX), '-filter_complex', fc, '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-crf', '18', '-c:a', 'aac', '-b:a', '256k', str(OUT / 'seam_check_x3.mp4')], check=True)

# 2. picture continuity
tail_idx = list(range(N - 60, N))
head_idx = list(range(0, 60))
T = frames(tail_idx)
H = frames(head_idx)
seq = np.concatenate([T, H])
d = np.abs(np.diff(seq, axis=0)).mean(axis=(1, 2, 3))
wrap = float(d[len(T) - 1])
around = np.concatenate([d[len(T) - 31:len(T) - 1], d[len(T):len(T) + 7]])
pic = {'wrap_pair_mean_abs_diff': round(wrap, 2), 'tail_median': round(float(np.median(d[:len(T) - 1])), 2), 'tail_max_last_30': round(float(d[len(T) - 31:len(T) - 1].max()), 2),
       'head_frames_0_7_max': round(float(d[len(T):len(T) + 7].max()), 2), 'cut_at_8_to_collapse': round(float(d[len(T) + 7]), 2), 'neighbourhood_max_excluding_wrap_and_cut': round(float(around.max()), 2)}
# a strip of the frames either side of the join
strip = np.concatenate([T[-4:], H[:4]], axis=0)
row = np.concatenate(list(strip), axis=1).astype(np.uint8)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{row.shape[1]}x{row.shape[0]}', '-i', '-', str(OUT / 'seam_frames.jpg')], input=row.tobytes(), check=True)

# 3. sound continuity at the join
x = wav(MIX)
n = wav(NAR)
L = len(x)
w = int(0.05 * SR)
ring = np.concatenate([x[-SR:], x[:SR]])
rms = [20 * np.log10(np.sqrt(np.mean(ring[i:i + w] ** 2)) + 1e-9) for i in range(0, len(ring) - w, w)]
step = abs(x[0] - x[-1])
typ = float(np.median(np.abs(np.diff(x[-SR:]))))
nar_at = 20 * np.log10(np.sqrt(np.mean(np.concatenate([n[-int(0.1 * SR):], n[:int(0.03 * SR)]]) ** 2)) + 1e-12)
snd = {'samples': L, 'duration_s': L / SR, 'rms_db_50ms_last1s_first1s': [round(v, 1) for v in rms], 'join_sample_step': round(float(step), 5), 'typical_sample_step_last_1s': round(typ, 5),
       'rms_last_100ms_db': round(rms[19], 1), 'rms_first_100ms_db': round(rms[20], 1), 'narration_level_across_join_db': round(float(nar_at), 1)}
res = {'picture': pic, 'sound': snd, 'clip': str((OUT / 'seam_check_x3.mp4').relative_to(ROOT))}
json.dump(res, open(OUT / 'SEAM_CHECK.json', 'w'), indent=1)
print(json.dumps(res['picture']), '\n', {k: v for k, v in snd.items() if k != 'rms_db_50ms_last1s_first1s'})
