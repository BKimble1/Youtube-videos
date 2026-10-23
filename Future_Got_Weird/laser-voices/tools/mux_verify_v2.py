#!/usr/bin/env python3
"""V2 audio: mux the approved V1 audio stream, unchanged, into a V2 picture-only render, then prove it.
  python3 tools/mux_verify_v2.py <v2_silent.mp4> <v1_with_audio.mp4> <out.mp4> <report.json>
The AAC stream is copied (-c copy, no re-encode) from the V1 export of the same resolution. The report compares the
two files' audio streams packet by packet (ffmpeg framemd5 on the copied stream: payload hashes plus timestamps) and
after decoding (md5 of the decoded PCM), and checks the stream parameters, the video frame count and the durations."""
import hashlib, json, subprocess, sys

silent, v1, out, rep = sys.argv[1:5]
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', silent, '-i', v1, '-map', '0:v:0', '-map', '1:a:0', '-c', 'copy',
                '-movflags', '+faststart', out], check=True)
def probe(f):
    return json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', f], capture_output=True, text=True).stdout)
def packets(f):
    t = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-map', '0:a:0', '-c', 'copy', '-f', 'framemd5', '-'], capture_output=True, text=True).stdout
    return [l for l in t.splitlines() if l and not l.startswith('#')]
def pcm_md5(f):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-map', '0:a:0', '-f', 's32le', '-'], capture_output=True).stdout
    return hashlib.md5(raw).hexdigest(), len(raw)
pa, pb = packets(v1), packets(out)
ma, mb = pcm_md5(v1), pcm_md5(out)
A, B = probe(v1), probe(out)
aa = [s for s in A['streams'] if s['codec_type'] == 'audio'][0]; ab = [s for s in B['streams'] if s['codec_type'] == 'audio'][0]
vb = [s for s in B['streams'] if s['codec_type'] == 'video'][0]
keys = ['codec_name', 'profile', 'sample_rate', 'channels', 'bit_rate', 'start_pts', 'duration_ts', 'nb_frames']
R = {
    'v1_source': v1, 'v2_output': out,
    'audio_packets': {'v1': len(pa), 'v2': len(pb), 'identical_payload_and_timing': pa == pb},
    'decoded_pcm_md5': {'v1': ma[0], 'v2': mb[0], 'bytes': ma[1], 'identical': ma == mb},
    'audio_stream_params': {k: [aa.get(k), ab.get(k)] for k in keys},
    'audio_params_identical': all(aa.get(k) == ab.get(k) for k in keys),
    'v2_video': {k: vb.get(k) for k in ['codec_name', 'width', 'height', 'r_frame_rate', 'nb_frames', 'pix_fmt']},
    'durations_s': {'v1_format': float(A['format']['duration']), 'v2_format': float(B['format']['duration']), 'v2_video_frames_s': int(vb['nb_frames']) / 30},
}
json.dump(R, open(rep, 'w'), indent=1)
print(json.dumps(R, indent=1))
sys.exit(0 if R['audio_packets']['identical_payload_and_timing'] and R['decoded_pcm_md5']['identical'] and int(vb['nb_frames']) == 1022 else 1)
