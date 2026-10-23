#!/usr/bin/env python3
"""V3: mux the V3 mix into a picture-only V3 render (AAC-LC 320 kb/s, 48 kHz stereo) and check the result.
  python3 tools/mux_v3.py <silent.mp4> <mix.wav> <out.mp4> <report.json>
Checks: video frame count and size, durations, and the decoded MP4 audio against the mix WAV (offset by
cross-correlation, correlation, and the level difference)."""
import json, subprocess, sys
import numpy as np, soundfile as sf

silent, mix, out, rep = sys.argv[1:5]
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', silent, '-i', mix, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy',
                '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-ac', '2', '-movflags', '+faststart', out], check=True)
pr = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', out], capture_output=True, text=True).stdout)
vs = [s for s in pr['streams'] if s['codec_type'] == 'video'][0]; a_s = [s for s in pr['streams'] if s['codec_type'] == 'audio'][0]
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', out, '-map', '0:a:0', '-f', 'f32le', '-ac', '2', '-ar', '48000', '-'], capture_output=True).stdout
a = np.frombuffer(raw, np.float32).reshape(-1, 2).astype(np.float64)
m, sr = sf.read(mix)
n = min(len(a), len(m))
am, mm = a[:n].mean(1), m[:n].mean(1)
seg = min(n, 48000 * 10)
cc = np.fft.irfft(np.fft.rfft(am[:seg], 2 * seg) * np.conj(np.fft.rfft(mm[:seg], 2 * seg)))
lag = int(np.argmax(cc)); lag = lag - 2 * seg if lag > seg else lag
R = {
    'output': out, 'video': {k: vs.get(k) for k in ['codec_name', 'profile', 'width', 'height', 'r_frame_rate', 'nb_frames', 'pix_fmt', 'color_space']},
    'audio': {k: a_s.get(k) for k in ['codec_name', 'profile', 'sample_rate', 'channels', 'bit_rate']},
    'durations_s': {'format': float(pr['format']['duration']), 'video_frames_s': int(vs['nb_frames']) / 30, 'mix_wav_s': len(m) / sr, 'decoded_audio_s': len(a) / 48000},
    'decoded_vs_mix': {'offset_samples': lag, 'correlation': round(float(np.corrcoef(am, mm)[0, 1]), 6),
                       'rms_diff_db': round(float(10 * np.log10(np.mean(am ** 2) / np.mean(mm ** 2))), 3)},
}
json.dump(R, open(rep, 'w'), indent=1)
print(json.dumps(R, indent=1))
sys.exit(0 if int(vs['nb_frames']) == 1022 and lag == 0 else 1)
