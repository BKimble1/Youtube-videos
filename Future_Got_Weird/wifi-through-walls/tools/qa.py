#!/usr/bin/env python3
"""QA measured on a rendered MP4 (not the source): stream properties, loudness (ffmpeg ebur128), black/freeze
detection, audio sync against the mix, the loop seam (last frame vs first frame, picture and audio), and a phone-size
sheet with an approximate Shorts UI mask. ASR of the MP4's own audio: tools/asr_mix.py. Motion: tools/motion_scan.py.
usage: python3 -I tools/qa.py <mp4> <out_prefix>"""
import json, os, re, subprocess, sys
import numpy as np, soundfile as sf
from PIL import Image, ImageDraw

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
mp4, pre = sys.argv[1], sys.argv[2]
R = {'file': os.path.relpath(mp4, EP)}
run = lambda *a: subprocess.run(a, capture_output=True, text=True)
pr = json.loads(run('ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', mp4).stdout)
vs = [s for s in pr['streams'] if s['codec_type'] == 'video'][0]; as_ = [s for s in pr['streams'] if s['codec_type'] == 'audio'][0]
R['video'] = {k: vs.get(k) for k in ['codec_name', 'profile', 'width', 'height', 'r_frame_rate', 'nb_frames', 'pix_fmt', 'color_space']}
R['audio'] = {k: as_.get(k) for k in ['codec_name', 'sample_rate', 'channels', 'bit_rate']}
R['duration'] = float(pr['format']['duration'])
e = run('ffmpeg', '-nostats', '-i', mp4, '-filter_complex', 'ebur128=peak=true', '-f', 'null', '-').stderr
summ = e[e.rfind('Summary:'):]
R['loudness'] = {'I_LUFS': float(re.search(r'I:\s+(-?[\d.]+)', summ).group(1)), 'LRA': float(re.search(r'LRA:\s+(-?[\d.]+)', summ).group(1)), 'TP_dBFS': float(re.search(r'Peak:\s+(-?[\d.]+)', summ).group(1))}
bd = run('ffmpeg', '-i', mp4, '-vf', 'blackdetect=d=0.1:pix_th=0.08', '-an', '-f', 'null', '-').stderr
R['black_segments'] = re.findall(r'black_start:\S+ black_end:\S+', bd)
fd = run('ffmpeg', '-i', mp4, '-vf', 'freezedetect=n=0.002:d=0.7', '-an', '-f', 'null', '-').stderr
R['freezes_ge_0.7s'] = re.findall(r'freeze_start: \S+', fd)
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-ac', '1', '-ar', '48000', '-f', 'f32le', '-'], capture_output=True).stdout
a = np.frombuffer(raw, np.float32).astype(np.float64)
m, _ = sf.read(os.path.join(EP, 'source/public/audio/mix.wav')); m = m.mean(1)
n = min(len(a), len(m), 48000 * 8)
cc = np.fft.irfft(np.fft.rfft(a[:n], 2 * n) * np.conj(np.fft.rfft(m[:n], 2 * n)))
lag = int(np.argmax(cc)); lag = lag - 2 * n if lag > n else lag
R['audio_sync_lag_ms'] = round(lag / 48, 2)
R['audio_seam'] = {'first_sample': round(float(a[0]), 4), 'last_sample': round(float(a[-1]), 4), 'note': 'AAC priming can add a few ms at the start; the WAV seam is sample-continuous'}
# picture loop seam: mean abs diff last->first vs a typical consecutive-frame diff
fr = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-vf', 'scale=270:480', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
F = np.frombuffer(fr, np.uint8).reshape(-1, 480, 270, 3).astype(float)
d = np.abs(np.diff(F, axis=0)).mean(axis=(1, 2, 3))
R['loop_seam_picture'] = {'last_to_first': round(float(np.abs(F[-1] - F[0]).mean()), 2), 'median_consecutive': round(float(np.median(d)), 2), 'p90_consecutive': round(float(np.percentile(d, 90)), 2)}
# phone sheet with an approximate Shorts UI mask (bottom 330 px title/channel band, right 140 px action column)
ts = [0, 0.6, 1.5, 2.7, 4.5, 6.6, 7.8, 10.3, 11.8, 14.4, 16.8, 18.5, 19.9, 21.3, 23.7, 26.1, 28.0, 30.0, 31.3, 33.2, 34.9, R['duration'] - 0.05]
tiles = []
for t in ts:
    p = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.3f}', '-i', mp4, '-frames:v', '1', '-vf', 'scale=270:480', '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True).stdout
    im = Image.open(__import__('io').BytesIO(p)).convert('RGB')
    ov = Image.new('RGBA', im.size, (0, 0, 0, 0)); dr = ImageDraw.Draw(ov)
    dr.rectangle([0, 480 - 82, 270, 480], fill=(255, 0, 0, 50)); dr.rectangle([270 - 35, 200, 270, 480 - 82], fill=(255, 0, 0, 50))
    im = Image.alpha_composite(im.convert('RGBA'), ov).convert('RGB')
    ImageDraw.Draw(im).text((4, 4), f'{t:.2f}s', fill=(255, 255, 0))
    tiles.append(im)
cols = 6
sheet = Image.new('RGB', (270 * cols, 480 * ((len(tiles) + cols - 1) // cols)), (17, 17, 17))
for i, im in enumerate(tiles): sheet.paste(im, ((i % cols) * 270, (i // cols) * 480))
sheet.save(pre + '_phone_ui_sheet.png')
json.dump(R, open(pre + '_qa.json', 'w'), indent=1)
print(json.dumps(R, indent=1))
