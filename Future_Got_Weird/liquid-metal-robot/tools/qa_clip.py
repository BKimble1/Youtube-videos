#!/usr/bin/env python3
"""QA of a RENDERED Liquid Metal Robot cut (the MP4, not the source).
Checks: container/stream properties against the round's spec; exact frame count; decoded audio length, voice onset,
loudness and peak; per-frame motion (mean absolute luma change between consecutive frames, 270x480 grey) and the
longest near-static run; first and last frames as PNG; a sheet of every 15th frame from the file itself.
usage: python3 tools/qa_clip.py [file.mp4] [tag=v1]  -> qa/<tag>/ (qa.json, first.png, last.png, sheet.png = one frame per second)"""
import sys, os, json, subprocess
import numpy as np, pyloudnorm as pyln
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import ROOT
TL = json.load(open(os.path.join(ROOT, 'source/src/data/words.json')))
DUR, NF = TL['duration'], TL['frames']
h = sys.argv[2] if len(sys.argv) > 2 else 'v1'
f = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'exports/FGW_Liquid_Metal_Robot_V1_REVIEW_1080x1920.mp4')
out = os.path.join(ROOT, f'qa/{h}'); os.makedirs(out, exist_ok=True)
def run(*a): return subprocess.run(a, capture_output=True, check=True).stdout
pr = json.loads(run('ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', f))
v = [s for s in pr['streams'] if s['codec_type'] == 'video'][0]; a = [s for s in pr['streams'] if s['codec_type'] == 'audio']
nb = int(run('ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', f).decode().strip().strip(','))
chk = {
 'codec_h264': v['codec_name'] == 'h264', 'size_1080x1920': (v['width'], v['height']) == (1080, 1920), 'fps_30': v['r_frame_rate'] == '30/1',
 'pix_yuv420p': v.get('pix_fmt') == 'yuv420p', f'frames_{NF}': nb == NF, f'video_{DUR:.3f}s': abs(float(v.get('duration', 0)) - DUR) < 1e-3,
 'audio_aac': bool(a) and a[0]['codec_name'] == 'aac',
}
au = np.frombuffer(run('ffmpeg', '-v', 'error', '-i', f, '-vn', '-ac', '1', '-ar', '48000', '-f', 'f32le', '-'), np.float32).astype(float)
meter = pyln.Meter(48000)
onset = float(np.argmax(np.abs(au) > 10 ** (-40 / 20)) / 48000)
chk[f'audio_len_{DUR}s(±25ms)'] = abs(len(au) / 48000 - DUR) < 0.025
chk['voice_onset<=0.10s'] = onset <= 0.10
# motion
g = np.frombuffer(run('ffmpeg', '-v', 'error', '-i', f, '-vf', 'scale=270:480,format=gray', '-f', 'rawvideo', '-'), np.uint8).reshape(-1, 480, 270).astype(float)
d = np.abs(np.diff(g, axis=0)).mean(axis=(1, 2))
static = d < 0.15; run_, best, best_at = 0, 0, 0
for i, s in enumerate(static):
    run_ = run_ + 1 if s else 0
    if run_ > best: best, best_at = run_, i - run_ + 1
chk['no_static_run>0.5s'] = best <= 15
persec = [round(float(d[max(0, i * 30 - 1):i * 30 + 29].mean()), 3) for i in range(int(round(DUR)))]
big = [(i + 1, round(float(x), 2)) for i, x in enumerate(d) if x > 18]
run('ffmpeg', '-v', 'error', '-y', '-i', f, '-vf', 'select=eq(n\\,0)', '-frames:v', '1', os.path.join(out, 'first.png'))
run('ffmpeg', '-v', 'error', '-y', '-sseof', '-0.05', '-i', f, '-frames:v', '1', os.path.join(out, 'last.png'))
run('ffmpeg', '-v', 'error', '-y', '-i', f, '-vf', "select='not(mod(n\\,30))',scale=270:480,drawtext=text='%{n}':x=6:y=6:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6,tile=7x4:padding=4:color=gray", '-frames:v', '1', os.path.join(out, 'sheet.png'))
res = {'file': os.path.relpath(f, ROOT), 'size_bytes': os.path.getsize(f), 'video': {k: v.get(k) for k in ('codec_name', 'profile', 'width', 'height', 'r_frame_rate', 'pix_fmt', 'color_space', 'duration', 'bit_rate')},
       'frames': nb, 'audio': {k: a[0].get(k) for k in ('codec_name', 'sample_rate', 'channels', 'bit_rate', 'duration')} if a else None,
       'audio_decoded_s': round(len(au) / 48000, 4), 'voice_onset_s': round(onset, 3), 'mix_lufs': round(meter.integrated_loudness(au), 2),
       'sample_peak_dbfs': round(20 * np.log10(np.abs(au).max() + 1e-12), 2), 'motion_mean_per_second': persec,
       'longest_static_run_frames': best, 'longest_static_run_starts_frame': best_at, 'frame_jumps_over_18': big, 'checks': chk, 'all_pass': all(chk.values())}
json.dump(res, open(os.path.join(out, 'qa.json'), 'w'), indent=1)
print(json.dumps({'hook': h, 'all_pass': res['all_pass'], 'failed': [k for k, x in chk.items() if not x], 'onset': res['voice_onset_s'], 'lufs': res['mix_lufs'],
                  'motion/s': persec, 'static_run': best, 'jumps': big[:8]}))
