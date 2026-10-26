#!/usr/bin/env python3
"""QA of a rendered Short, read from the file itself.

  streams (ffprobe), loudness and true peak (ebur128), black and freeze detection, keyframe spacing, audio/picture sync
  against the mix (cross-correlation), Whisper (sherpa-onnx) transcript of the MP4's own audio against the locked
  narration, a per-caption check (Whisper on each caption's own audio window must contain its words), the loop seam
  (last frame -> first frame difference against ordinary steps, caption band masked), one-frame pops (motion scan), and a
  36-frame phone sheet with the Shorts UI zones masked.

usage: python3 tools/qa.py <mp4> <out_prefix> [mix.wav]
"""
import difflib
import json
import os
import subprocess
import sys

import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from asr_check import whisper_rec, load16k  # noqa: E402
from script import locked_words, norm_words  # noqa: E402

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
mp4, pre = sys.argv[1], sys.argv[2]
mixp = sys.argv[3] if len(sys.argv) > 3 else os.path.join(EP, 'source/public/audio/mix.wav')
TL = json.load(open(os.path.join(EP, 'source/src/data/timeline.json')))
FPS = TL['fps']
R = {'file': mp4}


def sh(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


# streams
pr = json.loads(sh(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', mp4]).stdout)
vs = [s for s in pr['streams'] if s['codec_type'] == 'video'][0]
as_ = [s for s in pr['streams'] if s['codec_type'] == 'audio']
R['video'] = {k: vs.get(k) for k in ['codec_name', 'profile', 'width', 'height', 'r_frame_rate', 'nb_frames', 'pix_fmt', 'color_space', 'color_transfer', 'color_primaries', 'duration']}
R['audio'] = {k: as_[0].get(k) for k in ['codec_name', 'sample_rate', 'channels', 'bit_rate', 'duration']} if as_ else None
R['format_duration'] = pr['format']['duration']
# loudness
eb = sh(['ffmpeg', '-hide_banner', '-nostats', '-i', mp4, '-filter_complex', 'ebur128=peak=true', '-f', 'null', '-']).stderr
summ = eb[eb.rfind('Summary:'):]
def grab(key):
    for line in summ.splitlines():
        if line.strip().startswith(key):
            return float(line.split(':')[1].split()[0])
R['loudness'] = {'I_LUFS': grab('I:'), 'LRA': grab('LRA:'), 'TP_dBTP': grab('Peak:')}
# black / freeze
bl = sh(['ffmpeg', '-hide_banner', '-nostats', '-i', mp4, '-vf', 'blackdetect=d=0.05:pix_th=0.06', '-an', '-f', 'null', '-']).stderr
R['black_segments'] = [l.split('black_start:')[1].strip() for l in bl.splitlines() if 'black_start' in l]
fz = sh(['ffmpeg', '-hide_banner', '-nostats', '-i', mp4, '-vf', 'freezedetect=n=0.002:d=0.7', '-an', '-f', 'null', '-']).stderr
R['freezes_ge_0.7s'] = [l.split('freeze_start:')[1].strip() for l in fz.splitlines() if 'freeze_start' in l]
# keyframes
kf = sh(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-skip_frame', 'nokey', '-show_entries', 'frame=pts_time', '-of', 'csv=p=0', mp4]).stdout.split()
kt = [float(x) for x in kf if x]
R['keyframes'] = {'count': len(kt), 'max_gap_s': round(max(np.diff(kt)) if len(kt) > 1 else 0, 3)}
# sync against the mix
if as_ and os.path.exists(mixp):
    a = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-ac', '1', '-ar', '48000', '-f', 'f32le', '-'], capture_output=True).stdout
    a = np.frombuffer(a, np.float32)[:48000 * 10]
    m, msr = sf.read(mixp)
    m = (m.mean(1) if m.ndim > 1 else m)[:len(a)]
    L = 1 << int(np.ceil(np.log2(len(a) * 2)))
    c = np.fft.irfft(np.fft.rfft(a, L) * np.conj(np.fft.rfft(m, L)), L)
    lag = int(np.argmax(np.abs(c)))
    lag = lag - L if lag > L // 2 else lag
    R['audio_offset_vs_mix_ms'] = round(lag / 48, 2)
    R['audio_corr_vs_mix'] = round(float(np.corrcoef(a[:len(m)], m[:len(a)])[0, 1]), 5)
# ASR of the MP4's own audio
x = load16k(mp4)
rec = whisper_rec()
def wtext(seg):
    s = rec.create_stream()
    s.accept_waveform(16000, seg)
    rec.decode_stream(s)
    return s.result.text
# chunk at the measured pauses (under 25 s per chunk)
cut = int(TL['phrases'][7]['start'] * 16000) - 1600
hyp = wtext(x[:cut]) + ' ' + wtext(x[cut:])
ref = norm_words(locked_words())
hw = norm_words(hyp.replace('-', ' '))
sm = difflib.SequenceMatcher(a=ref, b=hw, autojunk=False)
diffs = [[op, ' '.join(ref[a0:a1]), ' '.join(hw[b0:b1])] for op, a0, a1, b0, b1 in sm.get_opcodes() if op != 'equal']
R['whisper'] = {'wer': round(sum(max(a1 - a0, b1 - b0) for op, a0, a1, b0, b1 in sm.get_opcodes() if op != 'equal') / len(ref), 4), 'diffs': diffs, 'text': hyp.strip()}
# per-caption windows
ok = 0
miss = []
for c in TL['captions']:
    seg = x[int(max(0, c['start'] - 0.08) * 16000): int((c['end'] + 0.15) * 16000)]
    h = norm_words(wtext(np.concatenate([np.zeros(1600, np.float32), seg, np.zeros(3200, np.float32)])).replace('-', ' '))
    r = norm_words(c['text'])
    ratio = difflib.SequenceMatcher(a=r, b=h).ratio()
    if ratio >= 0.75:
        ok += 1
    else:
        miss.append({'caption': c['text'], 'heard': ' '.join(h), 'ratio': round(ratio, 2)})
R['caption_windows_ok'] = f'{ok}/{len(TL["captions"])}'
R['caption_misses'] = miss
# frames for seam and motion scan (grey 270x480)
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-vf', 'scale=270:480,format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, 480, 270).astype(np.float32)
d = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))
mask = np.ones((480, 270), bool)
mask[int(1380 / 4):int(1620 / 4), :] = False  # caption band
seam = float(np.abs(fr[-1] - fr[0])[mask].mean())
prev = [float(np.abs(fr[-1 - k] - fr[-2 - k])[mask].mean()) for k in range(3)]
R['loop_seam'] = {'last_to_first': round(seam, 2), 'last_steps': [round(p, 2) for p in prev]}
spikes = []
for i in range(len(d)):
    nb = np.median(np.concatenate([d[max(0, i - 3):i], d[i + 1:i + 4]]))
    if d[i] > 6 and d[i] > 2.5 * (nb + 0.5):
        spikes.append({'frame': i + 1, 't': round((i + 1) / FPS, 3), 'diff': round(float(d[i]), 2), 'neigh': round(float(nb), 2)})
R['motion_spikes'] = spikes
R['low_motion_runs'] = []
run = 0
for i, v in enumerate(d):
    run = run + 1 if v < 0.6 else 0
    if run == 12:
        R['low_motion_runs'].append(round((i - 11) / FPS, 2))
json.dump({'per_frame_change': [round(float(v), 3) for v in d]}, open(pre + '_motion.json', 'w'))
# phone sheet with the Shorts UI mask
n = len(fr) + 1
times = [k * (n - 1) / 35 / FPS for k in range(36)]
sel = '+'.join(f'eq(n\\,{int(round(tt * FPS))})' for tt in times)
vf = (f"select='{sel}',scale=360:640,drawbox=x=0:y=0:w=360:h=50:color=red@0.25:t=fill,"
      f"drawbox=x=320:y=333:w=40:h=234:color=red@0.25:t=fill,drawbox=x=0:y=547:w=360:h=93:color=red@0.25:t=fill,tile=6x6")
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', mp4, '-vf', vf, '-frames:v', '1', '-vsync', 'vfr', pre + '_phone_sheet.png'], check=True)
json.dump(R, open(pre + '_qa.json', 'w'), indent=1, ensure_ascii=False)
print(json.dumps({k: v for k, v in R.items() if k not in ('whisper',)}, indent=1, ensure_ascii=False))
print('whisper wer', R['whisper']['wer'], R['whisper']['diffs'])
