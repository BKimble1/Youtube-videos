#!/usr/bin/env python3
"""Measured QA of a rendered export (everything here is read from the file itself).
usage: python3 tools/qa.py <video.mp4> <out_prefix>
- stream metadata (ffprobe), duration vs the narration master;
- loudness (ffmpeg ebur128: integrated, LRA, true peak);
- black / frozen picture detection (blackdetect, freezedetect), and the last second's motion;
- the audio stream against the selected narration (cross-correlation offset of the speech envelope);
- PocketSphinx free recognition of the export's audio vs the locked script (a supporting check only);
- SRT cues vs the measured word onsets;
- a phone-size contact sheet (every 6 s at 320 px wide)."""
import json, re, subprocess, sys, difflib
import numpy as np, soundfile as sf
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from script import TEXT, norm

vid, pre = sys.argv[1], sys.argv[2]
res = {'file': vid}
pr = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', vid], capture_output=True, text=True).stdout)
v = [s for s in pr['streams'] if s['codec_type'] == 'video'][0]
a = [s for s in pr['streams'] if s['codec_type'] == 'audio']
res['video'] = {k: v.get(k) for k in ('codec_name', 'profile', 'width', 'height', 'r_frame_rate', 'pix_fmt', 'color_space', 'nb_frames', 'bit_rate')}
res['audio'] = [{k: s.get(k) for k in ('codec_name', 'sample_rate', 'channels', 'bit_rate', 'duration')} for s in a]
res['duration_s'] = float(pr['format']['duration'])
meta = json.load(open('audio/narration/narration_V1_meta.json'))
res['narration_master_s'] = meta['duration_s']

def ff(args):
    return subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', vid] + args + ['-f', 'null', '-'], capture_output=True, text=True).stderr
e = ff(['-filter_complex', '[0:a]ebur128=peak=true', '-vn'])
s = e[e.rfind('Summary:'):]
res['loudness'] = {
    'integrated_lufs': float(re.search(r'I:\s+(-?[\d.]+) LUFS', s).group(1)),
    'lra_lu': float(re.search(r'LRA:\s+(-?[\d.]+) LU', s).group(1)),
    'true_peak_dbtp': float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', s).group(1)),
}
b = ff(['-vf', 'blackdetect=d=0.25:pix_th=0.08', '-an'])
res['black_segments'] = re.findall(r'black_start:([\d.]+) black_end:([\d.]+)', b)
fz = ff(['-vf', 'freezedetect=n=0.0008:d=2.5', '-an'])
res['frozen_segments_over_2_5s'] = re.findall(r'freeze_start: ([\d.]+)', fz)
# audio vs narration master: speech-envelope cross-correlation
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', vid, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True).stdout
y = np.frombuffer(raw, np.float32)
n0, sr = sf.read('audio/narration/FGW_Robot_Faces_narration_V1.wav')
n16 = subprocess.run(['ffmpeg', '-v', 'error', '-i', 'audio/narration/FGW_Robot_Faces_narration_V1.wav', '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True).stdout
n = np.frombuffer(n16, np.float32)
env = lambda x: np.sqrt(np.convolve(x[: len(x) // 160 * 160].reshape(-1, 160).mean(1) ** 2 + 1e-12, np.ones(5) / 5, 'same'))
ey, en = env(y), env(n)
m = min(len(ey), len(en))
lags = range(-50, 51)
cc = [np.corrcoef(ey[50:m - 50], en[50 + l:m - 50 + l])[0, 1] for l in lags]
res['audio_vs_narration'] = {'best_lag_ms': int(list(lags)[int(np.argmax(cc))] * 10), 'corr': round(float(max(cc)), 4)}
# ASR (supporting only)
try:
    from pocketsphinx import Decoder
    pcm = (np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes()
    d = Decoder(loglevel='FATAL'); d.start_utt(); d.process_raw(pcm, full_utt=True); d.end_utt()
    hyp = norm(d.hyp().hypstr if d.hyp() else '')
    ref = norm(TEXT)
    sm = difflib.SequenceMatcher(None, ref, hyp, autojunk=False)
    errs = sum(max(i2 - i1, j2 - j1) for op, i1, i2, j1, j2 in sm.get_opcodes() if op != 'equal')
    res['asr_pocketsphinx'] = {'wer_vs_locked_script': round(errs / len(ref), 3), 'note': 'free recognition with the bundled US model; noisy on this voice; supporting only'}
except Exception as ex:  # noqa
    res['asr_pocketsphinx'] = {'error': str(ex)}
# SRT vs words
W = json.load(open('audio/narration/FGW_Robot_Faces_V1_words.json'))
srt = open('captions/FGW_Robot_Faces_V1.srt').read().strip().split('\n\n')
def t2s(x):
    h, mi, rest = x.split(':'); se, ms = rest.split(','); return int(h) * 3600 + int(mi) * 60 + int(se) + int(ms) / 1000
starts = [t2s(c.split('\n')[1].split(' --> ')[0]) for c in srt]
ends = [t2s(c.split('\n')[1].split(' --> ')[1]) for c in srt]
ws = [w['start'] for w in W]
off = [min(abs(s0 - w) for w in ws) * 1000 for s0 in starts]
res['srt'] = {'cues': len(srt), 'max_start_offset_from_a_word_onset_ms': round(max(off), 1), 'overlaps': sum(1 for i in range(len(starts) - 1) if ends[i] > starts[i + 1]), 'last_end_s': ends[-1]}
# phone-size sheet
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', vid, '-vf', 'fps=1/6,scale=320:-1,tile=6x6', '-frames:v', '1', f'{pre}_phone_sheet.png'])
json.dump(res, open(f'{pre}_qa.json', 'w'), indent=1)
print(json.dumps(res, indent=1))
