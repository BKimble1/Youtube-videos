#!/usr/bin/env python3
"""Measured QA of a rendered export (everything is read from the file itself).
usage: python3 tools/qa.py <video.mp4> <out_prefix>
- stream metadata (ffprobe); duration vs the narration master; a full decode (errors counted);
- loudness of the delivered audio (ffmpeg ebur128: integrated, LRA, true peak);
- black and frozen picture (blackdetect, freezedetect);
- frame-to-frame change scan at 1/4 resolution: every frame pair whose change stands out from its neighbours is listed
  and matched against the planned cuts (act boundaries), so an unplanned one-frame jump shows up;
- the audio stream against the narration master (speech-envelope cross-correlation);
- the export's audio transcribed with the local Whisper base.en vs the locked words;
- SRT cues vs measured word onsets;
- a phone-size contact sheet (every 4 s, 320 px wide)."""
import json, re, subprocess, sys, os, difflib
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import ROOT, LW, norm
os.chdir(ROOT)
vid, pre = sys.argv[1], sys.argv[2]
os.makedirs(os.path.dirname(pre) or '.', exist_ok=True)
res = {'file': vid}
pr = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', vid], capture_output=True, text=True).stdout)
v = [s for s in pr['streams'] if s['codec_type'] == 'video'][0]
a = [s for s in pr['streams'] if s['codec_type'] == 'audio']
res['video'] = {k: v.get(k) for k in ('codec_name', 'profile', 'width', 'height', 'r_frame_rate', 'pix_fmt', 'color_space', 'nb_frames', 'bit_rate')}
res['audio'] = [{k: s.get(k) for k in ('codec_name', 'sample_rate', 'channels', 'bit_rate', 'duration')} for s in a]
res['duration_s'] = float(pr['format']['duration'])
res['size_mb'] = round(int(pr['format']['size']) / 1e6, 1)
meta = json.load(open('audio/narration/narration_V1_meta.json'))
res['narration_master_s'] = meta['duration_s']

def ff(args, inp=vid):
    return subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-v', 'info', '-i', inp] + args + ['-f', 'null', '-'], capture_output=True, text=True).stderr
dec = subprocess.run(['ffmpeg', '-v', 'error', '-i', vid, '-f', 'null', '-'], capture_output=True, text=True).stderr
res['full_decode_errors'] = len([l for l in dec.splitlines() if l.strip()])
if a:
    e = ff(['-filter_complex', '[0:a]ebur128=peak=true', '-vn'])
    s = e[e.rfind('Summary:'):]
    res['loudness'] = {'integrated_lufs': float(re.search(r'I:\s+(-?[\d.]+) LUFS', s).group(1)), 'lra_lu': float(re.search(r'LRA:\s+(-?[\d.]+) LU', s).group(1)),
                       'true_peak_dbtp': float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', s).group(1))}
b = ff(['-vf', 'blackdetect=d=0.2:pix_th=0.08', '-an'])
res['black_segments'] = re.findall(r'black_start:([\d.]+) black_end:([\d.]+)', b)
fz = ff(['-vf', 'freezedetect=n=0.0008:d=2.0', '-an'])
res['frozen_segments_over_2s'] = re.findall(r'freeze_start: ([\d.]+)', fz)
# frame-difference scan
W4, H4 = 480, 270
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', vid, '-vf', f'scale={W4}:{H4}', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H4, W4).astype(np.float32)
d = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))
med = np.array([np.median(d[max(0, i - 6):i + 7]) for i in range(len(d))])
spikes = [i + 1 for i in range(len(d)) if d[i] > 6 and d[i] > 3.5 * (med[i] + 0.5)]
cues = json.load(open('audio/cues.json'))
act = cues['act']
planned = [f for f in range(1, len(act)) if act[f] != act[f - 1]]
# the cab/bilateral switch inside 'cab' and the overlay segment changes are planned too
tt = cues['tt']
for k in ('another', 'imagine', 'climbing', 'tools'):  # deliberate cuts in the safety scene: wires -> ladder -> platform
    planned.append(int(round(tt[k] * 30)))
unplanned = [f for f in spikes if all(abs(f - p) > 1 for p in planned)]
res['frame_diff'] = {'mean': round(float(d.mean()), 2), 'p99': round(float(np.percentile(d, 99)), 2), 'spike_frames': spikes,
                     'planned_cut_frames': sorted(set(planned)), 'unplanned_spikes': [{'frame': f, 't': round(f / 30, 2), 'diff': round(float(d[f - 1]), 1)} for f in unplanned]}
# static stretches: seconds with almost no picture change
sec = d[: len(d) // 30 * 30].reshape(-1, 30).mean(1)
res['low_motion_seconds'] = [i for i, x in enumerate(sec) if x < 0.15]
if a:
    y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', vid, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True).stdout, np.float32)
    n = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', 'audio/narration/FGW_Chainsaw_Robot_narration_V1.wav', '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True).stdout, np.float32)
    env = lambda x: np.sqrt(np.convolve(x[: len(x) // 160 * 160].reshape(-1, 160).mean(1) ** 2 + 1e-12, np.ones(5) / 5, 'same'))
    ey, en = env(y), env(n)
    m = min(len(ey), len(en))
    lags = range(-30, 31)
    cc = [np.corrcoef(ey[40:m - 40], en[40 + l:m - 40 + l])[0, 1] for l in lags]
    res['audio_vs_narration'] = {'best_lag_ms': int(list(lags)[int(np.argmax(cc))] * 10), 'corr': round(float(max(cc)), 4)}
    try:
        import sherpa_onnx
        root = os.environ.get('SHERPA_MODELS', '/tmp/claude-0/models')
        wh = os.path.join(root, 'sherpa-onnx-whisper-base.en')
        rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=f'{wh}/base.en-encoder.onnx', decoder=f'{wh}/base.en-decoder.onnx', tokens=f'{wh}/base.en-tokens.txt', num_threads=4)
        W_ = json.load(open('audio/narration/FGW_Chainsaw_Robot_V1_words.json'))
        # cut at the sentence ends of the narration
        bounds = [0.0] + [(W_[i]['end'] + W_[i + 1]['start']) / 2 for i in range(len(W_) - 1) if W_[i]['word'].endswith('.')] + [len(y) / 16000]
        parts = []
        for s0, s1 in zip(bounds[:-1], bounds[1:]):
            st = rec.create_stream(); st.accept_waveform(16000, y[int(s0 * 16000):int(s1 * 16000)]); rec.decode_stream(st)
            parts.append(st.result.text)
        hyp = [norm(w) for w in ' '.join(parts).replace('-', ' ').split() if norm(w)]
        sm = difflib.SequenceMatcher(None, LW, hyp, autojunk=False)
        res['asr_whisper_on_mix'] = {'differences': [(op, ' '.join(LW[i1:i2]), ' '.join(hyp[j1:j2])) for op, i1, i2, j1, j2 in sm.get_opcodes() if op != 'equal'], 'locked_words': len(LW)}
    except Exception as ex:  # noqa
        res['asr_whisper_on_mix'] = {'error': str(ex)}
W_ = json.load(open('audio/narration/FGW_Chainsaw_Robot_V1_words.json'))
srt = open('captions/FGW_Chainsaw_Robot_V1.srt').read().strip().split('\n\n')
def t2s(x):
    h, mi, rest = x.split(':'); se, ms = rest.split(','); return int(h) * 3600 + int(mi) * 60 + int(se) + int(ms) / 1000
starts = [t2s(c.split('\n')[1].split(' --> ')[0]) for c in srt]
ends = [t2s(c.split('\n')[1].split(' --> ')[1]) for c in srt]
res['srt'] = {'cues': len(srt), 'max_start_offset_from_a_word_onset_ms': round(max(min(abs(s0 - w['start']) for w in W_) for s0 in starts) * 1000, 1),
              'overlaps': sum(1 for i in range(len(starts) - 1) if ends[i] > starts[i + 1]), 'last_end_s': ends[-1]}
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', vid, '-vf', 'fps=1/4,scale=320:-1,tile=6x7', '-frames:v', '1', f'{pre}_phone_sheet.png'])
json.dump(res, open(f'{pre}_qa.json', 'w'), indent=1)
print(json.dumps({k: v for k, v in res.items() if k != 'frame_diff'}, indent=1))
print('frame_diff', json.dumps({k: v for k, v in res['frame_diff'].items() if k != 'spike_frames'}))
