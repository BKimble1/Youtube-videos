#!/usr/bin/env python3
"""QA on a rendered MP4 (not the source): stream properties, loudness (ffmpeg ebur128), black/freeze detection, audio
sync against the mix, transcript of the MP4's own audio vs the locked script, per-caption ASR windows, loop-seam pixel
difference, and a phone-size sheet with an approximate Shorts UI mask.
ASR: Vosk vosk-model-small-en-us-0.15 (tools/asr_check.py); a second, stronger check with sherpa-onnx models is
tools/asr_sherpa.py.
usage: python3 tools/qa.py <mp4> <vosk_model_dir> <out_prefix>     env QA_MIX: the mix to sync against (default: V1 mix)"""
import json, os, re, subprocess, sys
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from asr_check import transcribe, compare
from script import norm

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
mp4, asr_dir, pre = sys.argv[1], sys.argv[2], sys.argv[3]
R = {'file': os.path.relpath(mp4, EP)}
run = lambda *a: subprocess.run(a, capture_output=True, text=True)
pr = json.loads(run('ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', mp4).stdout)
vs = [s for s in pr['streams'] if s['codec_type'] == 'video'][0]; as_ = [s for s in pr['streams'] if s['codec_type'] == 'audio'][0]
R['video'] = {k: vs.get(k) for k in ['codec_name', 'profile', 'width', 'height', 'r_frame_rate', 'nb_frames', 'pix_fmt', 'color_space', 'color_primaries', 'color_transfer']}
R['audio'] = {k: as_.get(k) for k in ['codec_name', 'sample_rate', 'channels', 'bit_rate']}
R['duration'] = float(pr['format']['duration'])
e = run('ffmpeg', '-nostats', '-i', mp4, '-filter_complex', 'ebur128=peak=true', '-f', 'null', '-').stderr
summ = e[e.rfind('Summary:'):]
R['loudness'] = {'I_LUFS': float(re.search(r'I:\s+(-?[\d.]+)', summ).group(1)), 'LRA': float(re.search(r'LRA:\s+(-?[\d.]+)', summ).group(1)), 'TP_dBFS': float(re.search(r'Peak:\s+(-?[\d.]+)', summ).group(1))}
bd = run('ffmpeg', '-i', mp4, '-vf', 'blackdetect=d=0.1:pix_th=0.08', '-an', '-f', 'null', '-').stderr
R['black_segments'] = re.findall(r'black_start:\S+ black_end:\S+', bd)
fd = run('ffmpeg', '-i', mp4, '-vf', 'freezedetect=n=0.002:d=1.0', '-an', '-f', 'null', '-').stderr
R['freezes_ge_1s'] = re.findall(r'freeze_start: \S+', fd)
# keyframes
kf = run('ffprobe', '-v', 'error', '-select_streams', 'v', '-skip_frame', 'nokey', '-show_entries', 'frame=pts_time', '-of', 'csv=p=0', mp4).stdout.split()
kft = [float(x.strip(',')) for x in kf if x.strip(',')]
R['keyframes'] = {'count': len(kft), 'max_gap_s': round(max(np.diff(kft)), 3) if len(kft) > 1 else None}
# sync: MP4 audio vs mix.wav
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-ac', '1', '-ar', '48000', '-f', 'f32le', '-'], capture_output=True).stdout
a = np.frombuffer(raw, np.float32).astype(np.float64)
m, _ = sf.read(os.path.join(EP, os.environ.get('QA_MIX', 'source/public/audio/mix.wav'))); m = m.mean(1)
n = min(len(a), len(m), 48000 * 8)
cc = np.fft.irfft(np.fft.rfft(a[:n], 2 * n) * np.conj(np.fft.rfft(m[:n], 2 * n)))
lag = int(np.argmax(cc)); lag = lag - 2 * n if lag > n else lag
R['audio_offset_vs_mix_ms'] = round(lag / 48, 2)
L = min(len(a), len(m)); R['audio_corr_vs_mix'] = round(float(np.corrcoef(a[:L], m[:L])[0, 1]), 5)
# transcript of the MP4's own audio (free recognition, no script given)
words = transcribe(asr_dir, mp4)
hyp = ' '.join(x['word'] for x in words)
R['vosk_transcript'] = hyp
R['vosk_wer_vs_approved'], R['vosk_diffs'] = compare(norm(hyp))
R['vosk_wer_vs_approved'] = round(R['vosk_wer_vs_approved'], 3)
# per-caption windows: recognised words whose times fall inside each caption's display window
tl = json.load(open(os.path.join(EP, 'source/src/data/timeline.json')))
import difflib
caps = []
for c in tl['captions']:
    got = [x['word'] for x in words if c['show'] - 0.1 <= (x['start'] + x['end']) / 2 <= c['hide'] + 0.1]
    ref = norm(c['text'])
    m = difflib.SequenceMatcher(None, ref, norm(' '.join(got)), autojunk=False).ratio()
    caps.append({'caption': c['text'], 'show': c['show'], 'hide': c['hide'], 'asr': ' '.join(got), 'match': round(m, 2)})
R['caption_windows'] = caps
R['caption_windows_ok'] = f"{sum(c['match'] >= 0.75 for c in caps)}/{len(caps)}"
# loop seam: last vs first decoded frame (and the typical frame-to-frame change near the end)
fr = lambda tt: np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(tt), '-i', mp4, '-frames:v', '1', '-vf', 'scale=270:480', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True).stdout, np.uint8).astype(float)
nf = int(vs['nb_frames'])
f0, fL, fL1, fL2 = fr(0), fr((nf - 1) / 30), fr((nf - 2) / 30), fr((nf - 3) / 30)
R['loop_seam'] = {'mean_abs_last_to_first': round(float(np.abs(fL - f0).mean()), 2), 'mean_abs_prev_steps': [round(float(np.abs(fL1 - fL2).mean()), 2), round(float(np.abs(fL - fL1).mean()), 2)]}
json.dump(R, open(pre + '_qa.json', 'w'), indent=1)
# phone sheet
times = [round(i * (R['duration'] - 0.1) / 35, 2) for i in range(36)]  # 36 evenly spaced frames across the film
ui = ("drawbox=x=0:y=0:w=1080:h=150:color=white@0.25:t=fill,drawbox=x=960:y=1000:w=120:h=700:color=white@0.25:t=fill,"
      "drawbox=x=0:y=1640:w=1080:h=280:color=white@0.25:t=fill,scale=360:640")
ins, filt = [], []
for i, tt in enumerate(times):
    ins += ['-ss', str(tt), '-i', mp4]
    filt.append(f"[{i}:v]trim=end_frame=1,{ui},drawtext=text='{tt:.2f}s':x=4:y=4:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.6[v{i}]")
cols = 6; lay = '|'.join(f'{(i % cols) * 360}_{(i // cols) * 640}' for i in range(len(times)))
subprocess.run(['ffmpeg', '-v', 'error', '-y', *ins, '-filter_complex', ';'.join(filt) + ';' + ''.join(f'[v{i}]' for i in range(len(times))) + f'xstack=inputs={len(times)}:layout={lay}[o]', '-map', '[o]', '-frames:v', '1', pre + '_phone_ui_sheet.png'], check=True)
print(json.dumps({k: v for k, v in R.items() if k not in ('caption_windows',)}, indent=1))
for c in caps:
    if c['match'] < 0.75: print('CAPTION MISMATCH', c)
