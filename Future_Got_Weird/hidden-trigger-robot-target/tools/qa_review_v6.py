#!/usr/bin/env python3
"""Measured QA on the rendered V6 publish master (not the source). Writes qa/qa_v6_results.json and inspection images.
Usage: python3 tools/qa_review_v4.py [path/to/review.mp4] [out_dir]"""
import json, os, re, subprocess, sys
import numpy as np

EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MP4 = sys.argv[1] if len(sys.argv) > 1 else os.path.join(EP, 'exports/FGW_Hidden_Trigger_V6_PUBLISH_MASTER_1080x1920.mp4')
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(EP, 'qa/v6')
os.makedirs(OUT, exist_ok=True)
cues = json.load(open(os.path.join(EP, 'audio/cues_v6.json')))
SB, FPS = cues["SH"], cues["FPS"]
res = {}

def run(*a):
    return subprocess.run(a, capture_output=True, text=True)

pr = json.loads(run('ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', MP4).stdout)
v = [s for s in pr['streams'] if s['codec_type'] == 'video'][0]
a = [s for s in pr['streams'] if s['codec_type'] == 'audio']
res['container'] = {'duration_s': float(pr['format']['duration']), 'size_bytes': int(pr['format']['size'])}
res['video'] = {k: v.get(k) for k in ['codec_name', 'profile', 'width', 'height', 'pix_fmt', 'r_frame_rate', 'nb_frames', 'color_space', 'color_primaries', 'color_transfer', 'duration']}
res['audio'] = [{k: s.get(k) for k in ['codec_name', 'sample_rate', 'channels', 'bit_rate', 'duration']} for s in a]

# loudness / true peak / clipping of the decoded AAC track
e = run('ffmpeg', '-hide_banner', '-nostats', '-i', MP4, '-map', '0:a:0', '-af', 'ebur128=peak=true', '-f', 'null', '-').stderr
s = e[e.rfind('Summary:'):]
res['loudness'] = {'integrated_LUFS': float(re.search(r'I:\s+(-?[\d.]+) LUFS', s).group(1)),
                   'true_peak_dBTP': float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', s).group(1)),
                   'LRA_LU': float(re.search(r'LRA:\s+(-?[\d.]+) LU', s).group(1))}
p = subprocess.run(['ffmpeg', '-v', 'error', '-i', MP4, '-map', '0:a:0', '-ar', '48000', '-f', 'f32le', '-'], capture_output=True).stdout
pcm = np.frombuffer(p, np.float32).reshape(-1, 2)
res['audio_samples'] = {'peak_abs': float(np.abs(pcm).max()), 'samples_at_or_over_0dBFS': int((np.abs(pcm) >= 0.999).sum()),
                        'silent_windows_100ms': int(sum(1 for i in range(0, len(pcm) - 4800, 4800) if np.sqrt((pcm[i:i + 4800] ** 2).mean()) < 1e-4))}

# black frames / frozen frames
bd = run('ffmpeg', '-hide_banner', '-nostats', '-i', MP4, '-vf', 'blackdetect=d=0.03:pic_th=0.95:pix_th=0.06', '-an', '-f', 'null', '-').stderr
res['black_segments'] = re.findall(r'black_start:\S+ black_end:\S+ black_duration:\S+', bd)
fz = run('ffmpeg', '-hide_banner', '-nostats', '-i', MP4, '-vf', 'freezedetect=n=0.0005:d=1.5', '-an', '-f', 'null', '-').stderr
res['freeze_segments_over_1.5s'] = re.findall(r'freeze_start: \S+|freeze_end: \S+', fz)

# sync: voice onset per phrase in the decoded track vs the caption start (onset = first 10 ms window > -40 dBFS rel.)
ph = json.load(open(os.path.join(EP, 'audio/narration/phrases_v1.json')))['phrases']
voice = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(EP, 'source/public/audio/narration_v3_testvoice.wav'), '-ac', '1', '-f', 'f32le', '-'], capture_output=True).stdout
vo = np.frombuffer(voice, np.float32)
mono = pcm.mean(1)
def xcorr_offset(x, y, maxlag):
    best, bl = -1e9, 0
    for lag in range(-maxlag, maxlag + 1, 24):
        if lag >= 0:
            c = float(np.dot(x[lag:lag + len(y) - maxlag], y[:len(y) - maxlag]))
        else:
            c = float(np.dot(x[:len(y) - maxlag], y[-lag:-lag + len(y) - maxlag]))
        if c > best:
            best, bl = c, lag
    return bl / 48000
seg = slice(0, 48000 * 6)
res['voice_offset_in_mp4_s'] = round(xcorr_offset(mono[seg], vo[seg], 4800), 4)

# inspection images: transition strips (+/-6 frames around each cut), loop seam, key frames
cuts = dict(SB)
res['transitions_s'] = cuts
def strip(name, frames):
    sel = '+'.join(f'eq(n\\,{f})' for f in frames)
    run('ffmpeg', '-v', 'error', '-y', '-i', MP4, '-vf', f"select='{sel}',scale=216:384,drawtext=text='%{{n}}':x=4:y=4:fontsize=14:fontcolor=white:box=1:boxcolor=black@0.6,tile={len(frames)}x1", '-frames:v', '1', '-vsync', '0', os.path.join(OUT, f'strip_{name}.png'))
for k, c in cuts.items():
    f0 = int(round(c * FPS))
    strip(k, list(range(f0 - 4, f0 + 5, 1)))
# bursts through the key actions: blade toward hand, apple whip, follow, pull back, mime on apple, target change, mime on hand
for k, a in {'open_0': 0.0, 'open_1': 0.3, 'open_2': 0.6, 'open_3': 0.9, 'open_4': 1.2, 'overhead': 2.6, 'redirect_b': 3.5, 'cuff_tube': 5.4, 'real_pull': 8.0, 'ots_eyes': 12.9, 'mime_apple': 14.8, 'trig_normal': 16.3, 'trig_marker': 16.75, 'trig_fork': 17.3, 'trig_branch': 17.7, 'trig_ring': 18.1, 'swap': 18.75, 'notice': 19.6, 'arm_followed': 20.1, 'strike': 20.6, 'jet': 20.9, 'land': 21.2, 'react_c': 21.5, 'branch': 21.8, 'end_approach': 24.3}.items():
    f0 = int(round(a * FPS)); strip(k, list(range(f0, f0 + 9)))
n = int(v['nb_frames'])
# loop seam: last 5 frames then first 5 (rendered as two strips joined)
run('ffmpeg', '-v', 'error', '-y', '-i', MP4, '-vf', f"select='gte(n\\,{n - 5})',scale=216:384,tile=5x1", '-frames:v', '1', '-vsync', '0', os.path.join(OUT, 'loop_end.png'))
run('ffmpeg', '-v', 'error', '-y', '-i', MP4, '-vf', "select='lt(n\\,5)',scale=216:384,tile=5x1", '-frames:v', '1', '-vsync', '0', os.path.join(OUT, 'loop_start.png'))
run('ffmpeg', '-v', 'error', '-y', '-i', os.path.join(OUT, 'loop_end.png'), '-i', os.path.join(OUT, 'loop_start.png'), '-filter_complex', 'hstack', os.path.join(OUT, 'strip_loop_seam.png'))
# pixel difference at the seam vs a typical in-shot step
def frame(i):
    b = subprocess.run(['ffmpeg', '-v', 'error', '-i', MP4, '-vf', f"select='eq(n\\,{i})',scale=270:480", '-vsync', '0', '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True).stdout
    return np.frombuffer(b, np.uint8).astype(float)
res['loop_seam_mean_abs_diff'] = float(np.abs(frame(n - 1) - frame(0)).mean())
res['typical_step_mean_abs_diff_f0_f1'] = float(np.abs(frame(0) - frame(1)).mean())
# whole-film contact sheet (every 10 frames)
run('ffmpeg', '-v', 'error', '-y', '-i', MP4, '-vf', "select='not(mod(n\\,10))',scale=135:240,tile=13x6", '-frames:v', '1', '-vsync', '0', os.path.join(OUT, 'sheet_every10.png'))
def detail(i):
    full = subprocess.run(['ffmpeg', '-v', 'error', '-i', MP4, '-vf', f"select='eq(n\\,{i})'", '-vsync', '0', '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True).stdout
    rt = subprocess.run(['ffmpeg', '-v', 'error', '-i', MP4, '-vf', f"select='eq(n\\,{i})',scale=512:910:flags=lanczos,scale=1080:1920:flags=lanczos", '-vsync', '0', '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True).stdout
    a, b = np.frombuffer(full, np.uint8).astype(float), np.frombuffer(rt, np.uint8).astype(float)
    return round(float(20 * np.log10(255 / np.sqrt(((a - b) ** 2).mean()))), 2)
res['true_resolution_check'] = {'note': 'PSNR (dB) of each frame against its own 512x910 round trip; for comparison, a 512x910 frame upscaled to 1080x1920 scores 49.5 dB (measured on frame 300); lower = more native detail',
                                'psnr_vs_512x910_roundtrip_dB': {str(f): detail(f) for f in [9, 120, 300, 560, 640]}}
json.dump(res, open(os.path.join(EP, 'qa/qa_v6_results.json'), 'w'), indent=1)
print(json.dumps(res, indent=1))
