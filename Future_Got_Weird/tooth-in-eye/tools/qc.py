#!/usr/bin/env python3
"""Measured QC of a rendered MP4: container facts, a frame-difference scan (one-frame jumps), black-frame detection,
the loop seam (last frame vs first), loudness and true peak of the decoded audio, and ASR of the decoded audio
against the locked narration (tools/asr_sherpa.py). Writes <out_dir>/qc.json and loop/strip images.
usage: python3 tools/qc.py <video.mp4> <out_dir> <asr_model_root>"""
import sys, os, json, subprocess
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import resample_poly
from PIL import Image

mp4, out, models = sys.argv[1:4]
os.makedirs(out, exist_ok=True)
pr = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', mp4], capture_output=True, check=True).stdout)
v = [s for s in pr['streams'] if s['codec_type'] == 'video'][0]
a = [s for s in pr['streams'] if s['codec_type'] == 'audio'][0]
nb = int(subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', mp4], capture_output=True, check=True).stdout)
info = {'width': v['width'], 'height': v['height'], 'fps': v['r_frame_rate'], 'frames': nb, 'pix_fmt': v['pix_fmt'], 'vcodec': v['codec_name'], 'profile': v.get('profile'),
        'color': [v.get('color_space'), v.get('color_transfer'), v.get('color_primaries')], 'duration_s': float(pr['format']['duration']),
        'acodec': a['codec_name'], 'sr': a['sample_rate'], 'ch': a['channels'], 'bitrate_kbps': round(int(pr['format']['bit_rate']) / 1000)}
# frame differences at 108x192 grey
w, h = 108, 192
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-vf', f'scale={w}:{h},format=gray', '-f', 'rawvideo', '-'], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)
d = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))
med = float(np.median(d))
spikes = [{'frame': int(i + 1), 't': round((i + 1) / 30, 3), 'diff': round(float(d[i]), 2), 'neighbours': [round(float(d[max(0, i - 1)]), 2), round(float(d[min(len(d) - 1, i + 1)]), 2)]}
          for i in range(len(d)) if d[i] > max(12, 3 * med) and d[i] > 2.2 * max(d[max(0, i - 1)], d[min(len(d) - 1, i + 1)])]
seam = float(np.abs(fr[-1] - fr[0]).mean())
# black frames
bd = subprocess.run(['ffmpeg', '-v', 'info', '-i', mp4, '-vf', 'blackdetect=d=0.05:pix_th=0.06', '-an', '-f', 'null', '-'], capture_output=True, text=True).stderr
black = [l.strip() for l in bd.splitlines() if 'black_start' in l]
# loop image
f0 = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-vf', 'select=eq(n\\,0)', '-vframes', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True).stdout
fl = subprocess.run(['ffmpeg', '-v', 'error', '-sseof', '-0.05', '-i', mp4, '-vframes', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True).stdout
open(f'{out}/first.png', 'wb').write(f0); open(f'{out}/last.png', 'wb').write(fl)
A, B = Image.open(f'{out}/last.png').resize((540, 960)), Image.open(f'{out}/first.png').resize((540, 960))
im = Image.new('RGB', (1080, 960)); im.paste(A, (0, 0)); im.paste(B, (540, 0)); im.save(f'{out}/loop_last_vs_first.jpg', quality=88)
# audio
wav = f'{out}/decoded.wav'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', mp4, '-ar', '48000', wav], check=True)
y, sr = sf.read(wav)
m = pyln.Meter(sr)
mono = y.mean(1) if y.ndim > 1 else y
aud = {'integrated_lufs': round(m.integrated_loudness(y), 2), 'true_peak_dbtp_4x': round(20 * np.log10(np.abs(resample_poly(mono, 4, 1)).max() + 1e-12), 2)}
asr = subprocess.run([sys.executable, os.path.join(os.path.dirname(__file__), 'asr_sherpa.py'), wav, models, f'{out}/final_asr.json'], capture_output=True, text=True).stdout
os.remove(wav)
res = {'container': info, 'frame_diff_median': round(med, 2), 'one_frame_spikes': spikes, 'loop_seam_mean_diff': round(seam, 2),
       'opening_step_diffs': [round(float(x), 2) for x in d[:6]], 'black_frames': black, 'audio': aud, 'asr': json.load(open(f'{out}/final_asr.json'))}
json.dump(res, open(f'{out}/qc.json', 'w'), indent=1)
print(json.dumps({k: res[k] for k in ['container', 'frame_diff_median', 'one_frame_spikes', 'loop_seam_mean_diff', 'opening_step_diffs', 'black_frames', 'audio']}, indent=1))
print({k: (vv['wer'], vv['diffs']) for k, vv in res['asr'].items()})
