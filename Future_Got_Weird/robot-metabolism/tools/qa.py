#!/usr/bin/env python3
"""Technical QA of an exported file, measured from the file itself.
  * stream facts (ffprobe): codec, size, frame rate, frame count, durations;
  * a full decode (any decode error fails);
  * black frames (blackdetect) and frozen stretches (freezedetect);
  * loudness of the file's own audio (ffmpeg ebur128: integrated, true peak);
  * audio sync: lag between the file's audio and the PCM mix (cross-correlation);
  * picture continuity: frame-to-frame difference spikes that are not on a planned cut (a one-frame pop);
  * captions: the caption phrases and the SRT, joined, must equal the locked narration word for word.
usage: python3 tools/qa.py <mp4> <out.json>"""
import json, os, re, subprocess, sys
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import LOCKED, LW, norm

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
mp4, out = sys.argv[1], sys.argv[2]
R = {'file': os.path.relpath(mp4, EP), 'bytes': os.path.getsize(mp4)}
pr = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', mp4], capture_output=True, text=True, check=True).stdout)
for s in pr['streams']:
    if s['codec_type'] == 'video':
        R['video'] = {k: s.get(k) for k in ['codec_name', 'profile', 'width', 'height', 'pix_fmt', 'color_space', 'r_frame_rate', 'nb_read_frames', 'duration']}
    else:
        R['audio'] = {k: s.get(k) for k in ['codec_name', 'sample_rate', 'channels', 'bit_rate', 'duration']}
R['format_duration'] = pr['format']['duration']
dec = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-f', 'null', '-'], capture_output=True, text=True)
R['full_decode_errors'] = dec.stderr.strip().splitlines()[:5]
bd = subprocess.run(['ffmpeg', '-v', 'info', '-i', mp4, '-vf', 'blackdetect=d=0.03:pix_th=0.08,freezedetect=n=0.0005:d=0.6', '-an', '-f', 'null', '-'], capture_output=True, text=True).stderr
R['black'] = re.findall(r'black_start:[\d.]+ black_end:[\d.]+', bd)
R['freeze'] = re.findall(r'freeze_(?:start|duration|end): [\d.]+', bd)
eb = subprocess.run(['ffmpeg', '-v', 'info', '-nostats', '-i', mp4, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
summ = eb[eb.rfind('Summary:'):]
R['loudness'] = {'integrated_lufs': float(re.search(r'I:\s+(-?[\d.]+) LUFS', summ).group(1)), 'true_peak_dbfs': float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', summ).group(1))}
# sync against the mix
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-ac', '1', '-ar', '8000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
a = np.frombuffer(raw, np.float32)
m, msr = sf.read(os.path.join(EP, os.environ.get('QA_MIX', 'audio/mix/FGW_Robot_Metabolism_V1_mix.wav')))
m = m.mean(1)[::6][:len(a)]
n = min(len(a), len(m)); a, m = a[:n], m[:n]
c = np.correlate(a[8000:24000], m[8000 - 400:24000 + 400], 'valid')
R['audio_lag_ms_vs_mix'] = round((np.argmax(c) - 400) / 8.0, 2)
# continuity: mean absolute luma difference per frame, spikes off the planned cuts
cues = json.load(open(os.path.join(EP, os.environ.get('QA_CUES', 'audio/cues.json'))))
cutf = [round(x * 30) for x in cues['cuts']]
w, h = 216, 384
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-vf', f'scale={w}:{h},format=gray', '-f', 'rawvideo', '-'], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)
d = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))
med = float(np.median(d))
spikes = [(i + 1, round(float(d[i]), 2)) for i in range(len(d)) if d[i] > max(6.0, 4 * med) and not any(abs(i + 1 - c) <= 1 for c in cutf)]
R['continuity'] = {'median_frame_diff': round(med, 2), 'planned_cuts': cutf, 'off_cut_spikes': spikes}
# captions
tl = json.load(open(os.path.join(EP, 'source/src/data/timeline.json')))
cap_words = norm(' '.join(c['text'] for c in tl['captions']))
srt = open(os.path.join(EP, 'captions/FGW_Robot_Metabolism_V1.srt'), encoding='utf-8').read()
srt_text = ' '.join(l for l in srt.splitlines() if l and not l.isdigit() and '-->' not in l)
R['captions'] = {'phrases': len(tl['captions']), 'caption_words_equal_locked': cap_words == LW, 'srt_words_equal_locked': norm(srt_text) == LW,
                 'caption_text_exact': ''.join(c['text'] for c in tl['captions']).replace(' ', '') == LOCKED.replace('\n', '').replace(' ', ''),
                 'max_lead_s': round(max(c['start'] - c['show'] for c in tl['captions']), 3)}
json.dump(R, open(out, 'w'), indent=1)
print(json.dumps(R, indent=1))
