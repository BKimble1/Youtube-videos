#!/usr/bin/env python3
"""Checks read from an exported file: stream facts (ffprobe), black frames (blackdetect), loudness and true peak of the
file's own audio, an independent transcript of the file's audio (sherpa-onnx zipformer + whisper base.en), and
frame-to-frame picture change, listing every large jump with whether it falls on a planned cut (audio/cues.json).
usage: python3 tools/qa.py <mp4> <asr_model_root> <out_prefix> [cues.json]   (V2: FGW_SCRIPT=production/NARRATION_APPROVED_V2.txt
       and audio/cues_v2.json)"""
import json, subprocess, sys, os
import numpy as np, pyloudnorm as pyln
from scipy.signal import resample_poly

mp4, asr_root, pre = sys.argv[1:4]
EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(os.path.dirname(pre) or '.', exist_ok=True)
probe = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-count_frames', '-of', 'json', mp4], capture_output=True, text=True).stdout)
v = [s for s in probe['streams'] if s['codec_type'] == 'video'][0]
a = [s for s in probe['streams'] if s['codec_type'] == 'audio'][0]
res = {'file': os.path.basename(mp4), 'size_mb': round(int(probe['format']['size']) / 1e6, 1),
       'video': {'codec': v['codec_name'], 'profile': v.get('profile'), 'w': v['width'], 'h': v['height'], 'fps': v['r_frame_rate'], 'frames': int(v['nb_read_frames']), 'pix_fmt': v['pix_fmt'], 'color_space': v.get('color_space'), 'duration_s': float(v['duration'])},
       'audio': {'codec': a['codec_name'], 'sr': int(a['sample_rate']), 'channels': a['channels'], 'bit_rate': int(a.get('bit_rate', 0)), 'duration_s': float(a['duration'])}}
bd = subprocess.run(['ffmpeg', '-v', 'info', '-i', mp4, '-vf', 'blackdetect=d=0.03:pic_th=0.97:pix_th=0.08', '-an', '-f', 'null', '-'], capture_output=True, text=True).stderr
res['black_segments'] = [l.split('blackdetect')[1].strip() for l in bd.splitlines() if 'black_start' in l]
y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-ac', '2', '-ar', '48000', '-f', 'f32le', '-'], capture_output=True).stdout, np.float32).reshape(-1, 2)
m = pyln.Meter(48000)
res['loudness'] = {'integrated_lufs': round(float(m.integrated_loudness(y)), 2), 'true_peak_dbtp_4x': round(float(20 * np.log10(np.abs(resample_poly(y[:, 0], 4, 1)).max() + 1e-9)), 2)}
mono = y.mean(1)
lv = 20 * np.log10(np.sqrt((mono[:len(mono) // 480 * 480].reshape(-1, 480) ** 2).mean(1)) + 1e-9)
res['loudness']['first_speech_s'] = round(float(np.where(lv > -40)[0][0]) / 100, 2)
asr = subprocess.run(['python3', os.path.join(EP, 'tools/asr_sherpa.py'), mp4, asr_root, pre + '_asr.json'], capture_output=True, text=True).stdout
res['asr'] = {k: {'wer': d['wer'], 'diffs': d['diffs']} for k, d in json.load(open(pre + '_asr.json')).items()}
# picture change: mean absolute difference between consecutive frames at 135x240
W, H = 135, 240
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-vf', f'scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
d = np.abs(np.diff(fr, axis=0)).mean((1, 2))
cuts = json.load(open(sys.argv[4] if len(sys.argv) > 4 else os.path.join(EP, 'audio/cues.json')))['CUT']
cut_frames = sorted({round(c * 30) for k, c in cuts.items() if k != 'end'})
big = [(int(i + 1), round(float(x), 1)) for i, x in enumerate(d) if x > 12]
res['frame_change'] = {'median': round(float(np.median(d)), 2), 'p99': round(float(np.percentile(d, 99)), 2),
                       'jumps_over_12': [{'frame': f, 'mad': x, 'on_cut': any(abs(f - c) <= 1 for c in cut_frames)} for f, x in big],
                       'loop_seam_mad': round(float(np.abs(fr[0] - fr[-1]).mean()), 1)}
json.dump(res, open(pre + '_qa.json', 'w'), indent=1)
print(json.dumps(res, indent=1))
