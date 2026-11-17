#!/usr/bin/env python3
"""QA of the delivered file, measured from the MP4 itself.

  format     resolution, frame rate, frame count, duration, codecs (ffprobe), a full decode with no errors
  motion     mean absolute frame-to-frame change (135x240 luma); the largest jumps (cuts and fast moves) with times;
             the longest near-static run (change below 0.6)
  loop       the last frame against frame 0, compared with the film's median frame step
  speech     WhisperX (small.en) on the MP4's own audio, word error rate against the locked narration
  text       no em dash in any caption (or anywhere in the timeline's displayed text)
  bursts     strips of the frames around every scheduled shot change (qa/bursts/*.png) for frame stepping

usage: python3 tools/qa.py exports/FGW_HEARTFISH_V1_REVIEW_1080x1920.mp4 qa"""
import json, os, subprocess, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import ROOT, DW, norm

os.chdir(ROOT)
MP4, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
res = {}
pr = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', MP4], capture_output=True, text=True, check=True).stdout)
vs = next(s for s in pr['streams'] if s['codec_type'] == 'video')
aus = next(s for s in pr['streams'] if s['codec_type'] == 'audio')
res['format'] = {'width': vs['width'], 'height': vs['height'], 'fps': vs['r_frame_rate'], 'frames': int(vs.get('nb_frames', 0)), 'duration_s': float(pr['format']['duration']),
                 'video_codec': vs['codec_name'], 'pix_fmt': vs['pix_fmt'], 'color_space': vs.get('color_space'), 'audio_codec': aus['codec_name'], 'audio_rate': aus['sample_rate'], 'audio_channels': aus['channels'],
                 'bitrate_kbps': round(int(pr['format']['bit_rate']) / 1000)}
dec = subprocess.run(['ffmpeg', '-v', 'error', '-i', MP4, '-f', 'null', '-'], capture_output=True, text=True)
res['format']['decode_errors'] = dec.stderr.strip()[:500]

w, h = 135, 240
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', MP4, '-vf', f'scale={w}:{h}', '-pix_fmt', 'gray', '-f', 'rawvideo', '-'], capture_output=True, check=True).stdout
F = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)
d = np.abs(np.diff(F, axis=0)).mean(axis=(1, 2))
fps = 60
med = float(np.median(d))
order = np.argsort(d)[::-1][:20]
res['motion'] = {'frames_decoded': int(len(F)), 'median_step': round(med, 3), 'largest_steps': [{'frame': int(i + 1), 't': round((i + 1) / fps, 3), 'step': round(float(d[i]), 2)} for i in sorted(order)]}
run, best, start = 0, (0, 0), 0
for i, x in enumerate(d):
    if x < 0.6:
        if run == 0: start = i
        run += 1
        if run > best[0]: best = (run, start)
    else:
        run = 0
res['motion']['longest_static_run'] = {'frames': best[0], 's': round(best[0] / fps, 3), 'at_s': round(best[1] / fps, 3)}
seam = float(np.abs(F[-1] - F[0]).mean())
res['loop'] = {'last_vs_first_step': round(seam, 3), 'median_step': round(med, 3), 'ratio': round(seam / med, 2)}
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-sseof', '-0.05', '-i', MP4, '-frames:v', '1', '-vf', 'scale=270:480', f'{OUT}/loop_last.png'], check=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', MP4, '-frames:v', '1', '-vf', 'scale=270:480', f'{OUT}/loop_first.png'], check=True)

# speech, from the MP4's own audio
wav = f'{OUT}/_audio16k.wav'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', MP4, '-ac', '1', '-ar', '16000', wav], check=True)
import whisperx
m = whisperx.load_model('small.en', 'cpu', compute_type='int8', language='en')
r = m.transcribe(whisperx.load_audio(wav), batch_size=4, language='en')
hyp = ' '.join(s['text'].strip() for s in r['segments'])
ref = [norm(x) for x in DW]
hw = [norm(x) for x in hyp.split() if norm(x)]
D = np.zeros((len(ref) + 1, len(hw) + 1), int); D[:, 0] = range(len(ref) + 1); D[0, :] = range(len(hw) + 1)
for i in range(1, len(ref) + 1):
    for j in range(1, len(hw) + 1):
        D[i, j] = min(D[i - 1, j] + 1, D[i, j - 1] + 1, D[i - 1, j - 1] + (ref[i - 1] != hw[j - 1]))
res['speech'] = {'asr': 'WhisperX small.en on the delivered MP4 audio', 'transcript': hyp, 'wer': round(D[-1, -1] / len(ref), 4), 'first_segment_start_s': round(float(r['segments'][0]['start']), 2) if r['segments'] else None}
os.remove(wav)

tl = json.load(open('source/src/data/timeline.json'))
txt = ' '.join(c['text'] for c in tl['captions'])
res['text'] = {'captions': len(tl['captions']), 'em_dash_in_captions': '—' in txt, 'en_dash_in_captions': '–' in txt}

# frame bursts around each shot change (6 frames before, 6 after)
cues = json.load(open('audio/cues.json'))
os.makedirs(f'{OUT}/bursts', exist_ok=True)
for k, tt in cues['T'].items():
    if k in ('s1', 'end'): continue
    f0 = max(0, int(round(tt * fps)) - 6)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', MP4, '-vf', f"select='between(n\\,{f0}\\,{f0 + 11})',scale=180:320,tile=12x1", '-frames:v', '1', f'{OUT}/bursts/{k}_f{f0}.png'], check=True)
json.dump(res, open(f'{OUT}/qa.json', 'w'), indent=1)
print(json.dumps(res, indent=1))
