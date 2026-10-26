#!/usr/bin/env python3
"""V3 audio identity check, read from the delivered files (see production/V3_AUDIO_LOCK.md).
For each MP4: the audio stream's packet data and decoded PCM must be byte-identical to the V2 review's (the stream is
remuxed, not re-encoded); the decoded audio is aligned with source/public/audio/mix_v2.wav (lag, correlation); the
video stream is measured (codec, size, rate, frame count, duration) and the source mix's hash is re-checked.
usage: python3 tools/verify_audio_v3.py out.json file1.mp4 [file2.mp4 ...]"""
import hashlib, json, os, subprocess, sys
import numpy as np, soundfile as sf

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF = os.path.join(EP, 'exports/FGW_Lightning_Laser_V2_REVIEW_1080x1920.mp4')
LOCK = {'mix_v2.wav': 'ed86c578929288f4e10f1bf609f5296d9c3d5f0b9bb68975ecf33fb8a99260d8',
        'packets': '4c3f0b740d307da4d9c7729f64db802a100ad03a88d18fe9e9bb00d92fba9dd6',
        'pcm': '6a353e720ce8128c5dee4de4fcde72ef42ab3fe70988b705161e3833d41fffd0'}
sha = lambda b: hashlib.sha256(b).hexdigest()
run = lambda *a: subprocess.run(a, capture_output=True)
def packets(f): return run('ffmpeg', '-v', 'error', '-i', f, '-map', '0:a', '-c', 'copy', '-f', 'data', '-').stdout
def pcm(f): return run('ffmpeg', '-v', 'error', '-i', f, '-map', '0:a', '-f', 's16le', '-ac', '2', '-ar', '48000', '-').stdout
def probe(f):
    p = json.loads(run('ffprobe', '-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', f).stdout)
    v = [s for s in p['streams'] if s['codec_type'] == 'video'][0]; a = [s for s in p['streams'] if s['codec_type'] == 'audio'][0]
    return {'video': {k: v.get(k) for k in ['codec_name', 'profile', 'width', 'height', 'r_frame_rate', 'avg_frame_rate', 'nb_read_frames', 'duration', 'pix_fmt', 'color_space']},
            'audio': {k: a.get(k) for k in ['codec_name', 'profile', 'sample_rate', 'channels', 'duration', 'nb_read_frames', 'start_time']},
            'container_duration': float(p['format']['duration'])}
out = {'lock': LOCK, 'files': {}}
mix_path = os.path.join(EP, 'source/public/audio/mix_v2.wav')
out['mix_v2_sha256_now'] = sha(open(mix_path, 'rb').read())
out['mix_v2_unchanged'] = out['mix_v2_sha256_now'] == LOCK['mix_v2.wav']
ref_pk, ref_pcm = packets(REF), pcm(REF)
out['reference_matches_lock'] = sha(ref_pk) == LOCK['packets'] and sha(ref_pcm) == LOCK['pcm']
m, sr = sf.read(mix_path); m = m.mean(1)
for f in sys.argv[2:]:
    pk, pc = packets(f), pcm(f)
    a = np.frombuffer(pc, np.int16).reshape(-1, 2).astype(np.float64).mean(1) / 32768
    n = min(len(a), len(m))
    seg = slice(48000, min(n, 48000 * 30))
    best = max(range(-2400, 2401, 1), key=lambda L: float(np.dot(a[seg.start + L:seg.stop + L], m[seg]))) if n > 48000 * 31 else 0
    c = float(np.corrcoef(a[seg.start + best:seg.stop + best], m[seg])[0, 1])
    out['files'][os.path.relpath(f, EP)] = {
        **probe(f), 'audio_packets_sha256': sha(pk), 'audio_pcm_sha256': sha(pc),
        'audio_packets_identical_to_v2': sha(pk) == LOCK['packets'], 'audio_pcm_identical_to_v2': sha(pc) == LOCK['pcm'],
        'decoded_samples': len(a), 'mix_samples': len(m), 'lag_vs_mix_samples': best, 'corr_vs_mix': round(c, 6),
    }
json.dump(out, open(sys.argv[1], 'w'), indent=1)
print(json.dumps(out, indent=1))
