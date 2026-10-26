#!/usr/bin/env python3
"""QA on a rendered MP4 (read from the file, not the source): stream properties and measured duration, loudness
(ffmpeg ebur128), black / freeze detection, audio sync against the mix, the loop seam (last frame vs first frame, and
the seam's frame-to-frame change against its neighbours), and a 3x loop file for playback review.
ASR of the MP4's own audio is tools/asr_sherpa.py (run separately).
usage: python3 tools/qa.py <mp4> <out_prefix> [mix name in source/public/audio, default mix]"""
import json, os, re, subprocess, sys
import numpy as np, soundfile as sf

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
mp4, pre = sys.argv[1], sys.argv[2]
MIX = sys.argv[3] if len(sys.argv) > 3 else 'mix'
R = {'file': os.path.relpath(mp4, EP)}
run = lambda *a: subprocess.run(a, capture_output=True, text=True)
pr = json.loads(run('ffprobe', '-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', mp4).stdout)
vs = [s for s in pr['streams'] if s['codec_type'] == 'video'][0]; as_ = [s for s in pr['streams'] if s['codec_type'] == 'audio'][0]
R['video'] = {k: vs.get(k) for k in ['codec_name', 'profile', 'width', 'height', 'r_frame_rate', 'nb_read_frames', 'pix_fmt', 'color_space', 'color_primaries', 'color_transfer']}
R['audio'] = {k: as_.get(k) for k in ['codec_name', 'sample_rate', 'channels', 'bit_rate', 'duration']}
R['duration_s'] = float(pr['format']['duration'])
R['size_MB'] = round(int(pr['format']['size']) / 1e6, 1)
e = run('ffmpeg', '-nostats', '-i', mp4, '-filter_complex', 'ebur128=peak=true', '-f', 'null', '-').stderr
summ = e[e.rfind('Summary:'):]
R['loudness'] = {'I_LUFS': float(re.search(r'I:\s+(-?[\d.]+)', summ).group(1)), 'LRA': float(re.search(r'LRA:\s+(-?[\d.]+)', summ).group(1)), 'TP_dBFS': float(re.search(r'Peak:\s+(-?[\d.]+)', summ).group(1))}
bd = run('ffmpeg', '-i', mp4, '-vf', 'blackdetect=d=0.1:pix_th=0.06', '-an', '-f', 'null', '-').stderr
R['black_segments'] = re.findall(r'black_start:\S+ black_end:\S+', bd)
fd = run('ffmpeg', '-i', mp4, '-vf', 'freezedetect=n=0.001:d=0.5', '-an', '-f', 'null', '-').stderr
R['freezes_ge_0.5s'] = re.findall(r'freeze_start: \S+', fd)
# sync: the MP4's audio against the mix
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-ac', '1', '-ar', '48000', '-f', 'f32le', '-'], capture_output=True).stdout
a = np.frombuffer(raw, np.float32).astype(np.float64)
m, _ = sf.read(os.path.join(EP, f'source/public/audio/{MIX}.wav')); m = m.mean(1)
n = min(len(a), len(m), 48000 * 8)
cc = np.fft.irfft(np.fft.rfft(a[:n], 2 * n) * np.conj(np.fft.rfft(m[:n], 2 * n)))
lag = int(np.argmax(cc)); lag = lag - 2 * n if lag > n else lag
R['audio_vs_mix_lag_ms'] = round(lag / 48, 2)
R['audio_samples_vs_mix'] = [len(a), len(m)]
# the seam: decode all frames small, compare the end -> start change with the changes around it
rv = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-vf', 'scale=270:480', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True, check=True).stdout
F = np.frombuffer(rv, np.uint8).reshape(-1, 480, 270).astype(float)
d = np.abs(np.diff(F, axis=0)).mean(axis=(1, 2))
seam = float(np.abs(F[0] - F[-1]).mean())
R['seam'] = {'last_to_first_change': round(seam, 2), 'changes_last_5': [round(float(x), 2) for x in d[-5:]], 'changes_first_5': [round(float(x), 2) for x in d[:5]],
             'last_equals_first': bool(seam < 0.05)}
json.dump(R, open(pre + '_qa.json', 'w'), indent=1)
# 3x loop for playback review (the junction three times, audio continuous)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-stream_loop', '2', '-i', mp4, '-c', 'copy', pre + '_loop_x3.mp4'], check=True)
print(json.dumps(R, indent=1))
