#!/usr/bin/env python3
"""Audio checks on the delivered MP4: python3 tools/audio_check.py <mp4> <out.json>
  * offset of the narration inside the file's audio (cross-correlation against the final narration wav);
  * integrated loudness and true-ish peak of the file's audio;
  * the audio length against the picture length."""
import json, subprocess, sys
import numpy as np, soundfile as sf, pyloudnorm as pyln

mp4, out = sys.argv[1], sys.argv[2]
SR = 48000
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
a = np.frombuffer(raw, np.float32).astype(np.float64)
st = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
stereo = np.frombuffer(st, np.float32).reshape(-1, 2).astype(np.float64)
v, vsr = sf.read('audio/narration/FGW_SeaSlug_narration_V1.wav')
n = min(len(a), len(v))
# cross-correlate a 6 s voiced window with lags of +-100 ms
i0 = int(1.0 * SR); L = int(6 * SR); lags = range(-int(0.1 * SR), int(0.1 * SR) + 1, 8)
ref = v[i0:i0 + L]
best = max(lags, key=lambda k: float(np.dot(a[i0 + k:i0 + k + L], ref)))
corr = float(np.corrcoef(a[i0 + best:i0 + best + L], ref)[0, 1])
m = pyln.Meter(SR)
probe = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-of', 'json', mp4], capture_output=True, check=True).stdout)
vd = [float(s['duration']) for s in probe['streams'] if s['codec_type'] == 'video'][0]
ad = [float(s['duration']) for s in probe['streams'] if s['codec_type'] == 'audio'][0]
res = {'file': mp4, 'narration_offset_ms': round(best / SR * 1000, 2), 'narration_correlation_at_offset': round(corr, 4),
       'integrated_lufs': round(m.integrated_loudness(stereo), 2), 'sample_peak_dbfs': round(20 * np.log10(np.abs(stereo).max()), 2),
       'video_duration_s': vd, 'audio_duration_s': ad}
json.dump(res, open(out, 'w'), indent=1)
print(json.dumps(res, indent=1))
