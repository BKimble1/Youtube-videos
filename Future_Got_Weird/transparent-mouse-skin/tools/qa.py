#!/usr/bin/env python3
"""QA on a rendered MP4 (the file, not the source): stream properties, a full decode, loudness and true peak
(ffmpeg ebur128), black and freeze detection, audio sync against the mix, an independent Whisper transcript of the
MP4's own audio compared with the locked script, the hook frames (0-3 s every 0.2 s) and milestone frames, and a
phone-size sheet with an approximate Shorts UI overlay. (Adapted from Glass Climbing tools/qa.py; Whisper replaces
Vosk, whose models cannot be downloaded here.)
usage: python3 tools/qa.py <mp4> <whisper model dir> <out prefix>"""
import json, os, re, subprocess, sys
import numpy as np, soundfile as sf
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import LW, norm
from asr_whisper import diffs

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
mp4, model_dir, pre = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(os.path.dirname(os.path.join(EP, pre)), exist_ok=True)
R = {'file': os.path.relpath(os.path.abspath(mp4), EP)}
run = lambda *a: subprocess.run(a, capture_output=True, text=True)
pr = json.loads(run('ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', mp4).stdout)
vs = [s for s in pr['streams'] if s['codec_type'] == 'video'][0]; as_ = [s for s in pr['streams'] if s['codec_type'] == 'audio'][0]
R['video'] = {k: vs.get(k) for k in ['codec_name', 'profile', 'width', 'height', 'r_frame_rate', 'nb_frames', 'pix_fmt', 'color_space']}
R['audio'] = {k: as_.get(k) for k in ['codec_name', 'sample_rate', 'channels', 'bit_rate']}
R['duration'] = float(pr['format']['duration'])
R['size_bytes'] = int(pr['format']['size'])
dec = run('ffmpeg', '-v', 'error', '-i', mp4, '-f', 'null', '-')
R['full_decode_errors'] = len([l for l in dec.stderr.splitlines() if l.strip()])
e = run('ffmpeg', '-nostats', '-i', mp4, '-filter_complex', 'ebur128=peak=true', '-f', 'null', '-').stderr
summ = e[e.rfind('Summary:'):]
R['loudness'] = {'I_LUFS': float(re.search(r'I:\s+(-?[\d.]+)', summ).group(1)), 'LRA': float(re.search(r'LRA:\s+(-?[\d.]+)', summ).group(1)), 'TP_dBFS': float(re.search(r'Peak:\s+(-?[\d.]+)', summ).group(1))}
bd = run('ffmpeg', '-i', mp4, '-vf', 'blackdetect=d=0.05:pix_th=0.08', '-an', '-f', 'null', '-').stderr
R['black_segments'] = re.findall(r'black_start:\S+ black_end:\S+', bd)
fd = run('ffmpeg', '-i', mp4, '-vf', 'freezedetect=n=0.001:d=0.8', '-an', '-f', 'null', '-').stderr
R['freezes_ge_0.8s'] = re.findall(r'freeze_start: \S+', fd)
# sync: the MP4's audio against the mix
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-ac', '1', '-ar', '48000', '-f', 'f32le', '-'], capture_output=True).stdout
a = np.frombuffer(raw, np.float32).astype(np.float64)
m, _ = sf.read(os.path.join(EP, 'audio/mix/FGW_Transparent_Mouse_Skin_V1_mix.wav')); m = m.mean(1)
n = min(len(a), len(m), 48000 * 8)
cc = np.fft.irfft(np.fft.rfft(a[:n], 2 * n) * np.conj(np.fft.rfft(m[:n], 2 * n)))
lag = int(np.argmax(cc)); lag = lag - 2 * n if lag > n else lag
R['audio_lag_vs_mix_ms'] = round(lag / 48, 2)
R['first_audio_above_-40dBFS_s'] = round(float(np.argmax(np.abs(a) > 0.01) / 48000), 3)
# independent transcript of the MP4's own audio
tmp = f'/tmp/qa_{os.getpid()}.wav'
sf.write(tmp, a, 48000)
w = run('python3', os.path.join(EP, 'tools/asr_whisper.py'), model_dir, tmp, tmp + '.json')
wj = json.load(open(tmp + '.json'))
R['whisper'] = {'text': wj['text'], 'wer_vs_locked': wj['wer_vs_approved'], 'diffs': wj['diffs']}
# frames: hook every 0.2 s for 3 s, plus milestones
fps = 30
def grab(tsec, path):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{tsec:.4f}', '-i', mp4, '-frames:v', '1', path], check=True)
hook = [round(0.2 * k, 1) for k in range(16)]
tiles = []
for tt in hook:
    pth = f'/tmp/qa_hook_{tt:.1f}.png'; grab(tt, pth); tiles.append((tt, Image.open(pth).convert('RGB')))
W0, H0 = tiles[0][1].size
tw, th = 270, 480
sheet = Image.new('RGB', (tw * 8, th * 2), '#111')
for i, (tt, im) in enumerate(tiles):
    sheet.paste(im.resize((tw, th)), ((i % 8) * tw, (i // 8) * th))
    ImageDraw.Draw(sheet).text(((i % 8) * tw + 6, (i // 8) * th + 4), f'{tt:.1f}s', fill='#FFD84A')
sheet.save(os.path.join(EP, pre + '_hook_0-3s.png'))
# phone-size sheet with an approximate Shorts UI overlay (right rail, bottom title band, top bar)
ms = [0.0, 1.6, 2.4, 4.0, 6.0, 7.6, 8.6, 10.3, 11.8, 13.6, 16.0, 18.4, 19.8, 20.2, 21.0, 22.4, 23.8, 25.0]
tiles = []
for tt in ms:
    tt = min(tt, R['duration'] - 0.05)
    pth = f'/tmp/qa_ms_{tt:.2f}.png'; grab(tt, pth)
    im = Image.open(pth).convert('RGB').resize((360, 640))
    d = ImageDraw.Draw(im, 'RGBA')
    d.rectangle([0, 0, 360, 34], fill=(0, 0, 0, 90))
    d.rectangle([0, 640 - 128, 360, 640], fill=(0, 0, 0, 110))
    for k in range(5): d.ellipse([318, 330 + k * 52, 350, 362 + k * 52], fill=(255, 255, 255, 120))
    d.text((6, 38), f'{tt:.1f}s', fill='#FFD84A')
    tiles.append(im)
sh = Image.new('RGB', (360 * 9, 640 * 2), '#111')
for i, im in enumerate(tiles): sh.paste(im, ((i % 9) * 360, (i // 9) * 640))
sh.save(os.path.join(EP, pre + '_phone_ui.png'))
json.dump(R, open(os.path.join(EP, pre + '_qa.json'), 'w'), indent=1)
print(json.dumps(R, indent=1))
