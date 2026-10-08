#!/usr/bin/env python3
"""Verify a rendered export against the delivery spec and the mix it was rendered with (read-only).

  python3 tools/verify_export.py <video.mp4> [--mix source/public/audio/mix.wav] [--json out.json]

Reports: container / codec / profile / dimensions / frame rate / frame count / pixel format / colour tags / bitrate,
audio codec / rate / channels / bitrate, moov-before-mdat (fast start), duration of each stream, a full decode of
every video and audio frame (errors counted), EBU R128 integrated loudness and true peak of the encoded audio,
audio/video sync against the mix (cross-correlation offset of the decoded AAC against the source WAV), and every
metadata tag in the file (for the anonymity check)."""
import argparse
import json
import subprocess
import sys

import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('video')
ap.add_argument('--mix', default=None)
ap.add_argument('--json', default=None)
a = ap.parse_args()


def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


rep = {'file': a.video}
pr = json.loads(run(['ffprobe', '-v', 'error', '-show_format', '-show_streams', '-of', 'json', a.video]).stdout)
fmt = pr['format']
rep['format'] = {k: fmt.get(k) for k in ('format_name', 'duration', 'size', 'bit_rate')}
rep['format_tags'] = fmt.get('tags', {})
for s in pr['streams']:
    if s['codec_type'] == 'video':
        rep['video'] = {k: s.get(k) for k in ('codec_name', 'profile', 'level', 'width', 'height', 'pix_fmt', 'color_range', 'color_space',
                                               'color_transfer', 'color_primaries', 'field_order', 'r_frame_rate', 'avg_frame_rate', 'nb_frames',
                                               'duration', 'bit_rate')}
        rep['video_tags'] = s.get('tags', {})
    elif s['codec_type'] == 'audio':
        rep['audio'] = {k: s.get(k) for k in ('codec_name', 'profile', 'sample_rate', 'channels', 'channel_layout', 'duration', 'bit_rate')}
        rep['audio_tags'] = s.get('tags', {})

# fast start: is the moov atom before mdat?
with open(a.video, 'rb') as f:
    head = f.read(1 << 22)
im, idat = head.find(b'moov'), head.find(b'mdat')
rep['faststart_moov_before_mdat'] = im != -1 and (idat == -1 or im < idat)

# full decode (every frame of every stream), errors counted
dec = run(['ffmpeg', '-v', 'error', '-xerror', '-i', a.video, '-map', '0', '-f', 'null', '-'])
rep['full_decode'] = {'returncode': dec.returncode, 'error_lines': [l for l in dec.stderr.splitlines() if l.strip()][:20]}
cnt = run(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', a.video])
rep['decoded_video_frames'] = int(cnt.stdout.strip() or 0)

# loudness and true peak of the encoded audio
eb = run(['ffmpeg', '-nostats', '-i', a.video, '-map', '0:a:0', '-af', 'ebur128=peak=true', '-f', 'null', '-'])
txt = eb.stderr[eb.stderr.rfind('Summary:'):]
def grab(key):
    for line in txt.splitlines():
        if line.strip().startswith(key):
            return float(line.split(':')[1].split()[0])
rep['loudness'] = {'integrated_lufs': grab('I:'), 'lra_lu': grab('LRA:'), 'true_peak_dbfs': grab('Peak:')}

# sync against the mix: decode the AAC to PCM and cross-correlate with the source WAV (first 60 s, mono)
if a.mix:
    import soundfile as sf
    ref, sr = sf.read(a.mix, always_2d=True)
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', a.video, '-map', '0:a:0', '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'], capture_output=True).stdout
    enc = np.frombuffer(pcm, dtype=np.float32)
    r = ref.mean(axis=1).astype(np.float32)
    n = min(len(r), len(enc), 60 * sr)
    x, y = r[:n], enc[:n]
    size = 1 << int(np.ceil(np.log2(2 * n)))
    xc = np.fft.irfft(np.fft.rfft(y, size) * np.conj(np.fft.rfft(x, size)), size)
    lag = int(np.argmax(np.concatenate([xc[-sr:], xc[:sr]]))) - sr
    corr = float(np.corrcoef(x[max(0, -lag):n - max(0, lag)], y[max(0, lag):n - max(0, -lag)])[0, 1]) if abs(lag) < n else 0.0
    rep['sync_vs_mix'] = {'lag_samples': lag, 'lag_ms': round(1000 * lag / sr, 2), 'correlation': round(corr, 4),
                          'encoded_audio_s': round(len(enc) / sr, 3), 'mix_s': round(len(r) / sr, 3)}

print(json.dumps(rep, indent=1))
if a.json:
    json.dump(rep, open(a.json, 'w'), indent=1)
