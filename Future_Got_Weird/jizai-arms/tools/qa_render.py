#!/usr/bin/env python3
"""Measured QA of a rendered JIZAI ARMS review file (adapted from eel-escape/tools/qa_render.py).
  - ffprobe facts and a full decode
  - frame-to-frame change (mean absolute difference at 270x480): every large change listed, planned or not
  - longest near-static run (no frozen stretches)
  - loop seam: last frame vs first frame
  - sheets: every 0.5 s; the hook (0 - 4 s) every 3rd frame; a frame burst (-3..+3) at every scene boundary;
    the loop junction (last 6 frames + first 6)
  - narration: both local ASR models on the MP4's own audio, word differences from the locked text
usage: python3 tools/qa_render.py <video.mp4> <out_dir> <asr_model_root>"""
import json, subprocess, sys, os
import numpy as np
from PIL import Image, ImageDraw

src, out, models = sys.argv[1:4]
os.makedirs(out, exist_ok=True)
pr = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', src], capture_output=True, text=True, check=True).stdout)
vs = [s for s in pr['streams'] if s['codec_type'] == 'video'][0]
au = [s for s in pr['streams'] if s['codec_type'] == 'audio']
dec = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-f', 'null', '-'], capture_output=True, text=True)
W, H = 270, 480
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-vf', f'scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)
n = len(fr)
fps = eval(vs['r_frame_rate'])
d = np.abs(np.diff(fr.astype(np.float32), axis=0)).mean(axis=(1, 2, 3))
PLANNED = [
    (18.45, 18.55, 'MATCH CUT: the model\\'s wrist -> the full wrist (same view direction, distance x2)'),
    (21.55, 21.65, 'CUT: a separate demonstration (two wearers)'),
    (2.9, 3.6, 'robot hand sweeps across the lens as the camera swings to the operator'),
    (9.0, 10.1, 'orbit to the back; the body turns translucent'),
    (12.4, 13.2, 'the return orbit; the body returns'),
    (17.9, 18.5, 'zoom to the operator\\'s fingers'),
]
med = float(np.median(d))
big = [(i + 1, round((i + 1) / fps, 3), round(float(x), 2)) for i, x in enumerate(d) if x > max(12.0, 5 * med)]
jumps = [{'frame': f, 't': ts, 'mad': v, 'planned': next((p[2] for p in PLANNED if p[0] <= ts <= p[1]), None)} for f, ts, v in big]
static = d < 0.35
run, best, best_at = 0, 0, 0
for i, s in enumerate(static):
    run = run + 1 if s else 0
    if run > best: best, best_at = run, i - run + 2
loop = float(np.abs(fr[-1].astype(np.float32) - fr[0].astype(np.float32)).mean())

def sheet(idx, cols, name, scale=1.0):
    ims = []
    for i in idx:
        im = Image.fromarray(fr[i]).resize((int(W * scale), int(H * scale)))
        dr = ImageDraw.Draw(im); dr.rectangle([0, 0, 92, 20], fill=(0, 0, 0)); dr.text((4, 4), f'{i} {i / fps:.2f}s', fill=(255, 255, 255))
        ims.append(im)
    rows = (len(ims) + cols - 1) // cols
    w0, h0 = ims[0].size
    S = Image.new('RGB', (cols * w0 + (cols - 1) * 3, rows * h0 + (rows - 1) * 3), 'white')
    for k, im in enumerate(ims): S.paste(im, ((k % cols) * (w0 + 3), (k // cols) * (h0 + 3)))
    S.save(os.path.join(out, name))
sheet(list(range(0, n, 15)), 13, 'sheet_every_0.5s.png', 0.6)
sheet(list(range(0, 120, 3)), 10, 'hook_0-4s_every3.png', 0.7)
for tb in [6.45, 13.3, 16.5, 18.5, 21.6, 26.2]:
    c = int(round(tb * fps)); sheet([max(0, min(n - 1, c + k)) for k in range(-3, 4)], 7, f'burst_{tb:05.2f}s.png', 0.8)
sheet(list(range(n - 6, n)) + list(range(0, 6)), 6, 'loop_junction.png', 0.8)
# ASR on the delivered audio
asr = None
if au:
    wav = os.path.join(out, '_audio.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-ac', '1', '-ar', '16000', wav], check=True)
    r = subprocess.run(['python3', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'asr_sherpa.py'), wav, models, os.path.join(out, 'final_asr.json')], capture_output=True, text=True)
    asr = json.load(open(os.path.join(out, 'final_asr.json')))
    os.remove(wav)
lou = subprocess.run(['ffmpeg', '-hide_banner', '-i', src, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr if au else ''
I = [l for l in lou.splitlines() if l.strip().startswith('I:')]
Pk = [l for l in lou.splitlines() if l.strip().startswith('Peak:')]
res = {
    'file': os.path.basename(src), 'size_mb': round(os.path.getsize(src) / 1e6, 2),
    'video': {'codec': vs['codec_name'], 'w': vs['width'], 'h': vs['height'], 'fps': vs['r_frame_rate'], 'pix_fmt': vs['pix_fmt'], 'color_space': vs.get('color_space'), 'frames_decoded': n, 'duration_s': round(n / fps, 3)},
    'audio': [{'codec': a['codec_name'], 'sr': a['sample_rate'], 'ch': a['channels'], 'bitrate': a.get('bit_rate')} for a in au],
    'loudness': {'integrated': I[-1].strip() if I else None, 'true_peak': Pk[-1].strip() if Pk else None},
    'decode_errors': dec.stderr.strip()[:500] or None,
    'frame_change_median': round(med, 2),
    'large_changes': jumps,
    'unplanned_large_changes': [j for j in jumps if not j['planned']],
    'longest_near_static_run_frames': best, 'longest_near_static_run_starts_s': round(best_at / fps, 2),
    'loop_last_vs_first_mad': round(loop, 2),
    'asr': {k: {'wer': v['wer'], 'diffs': v['diffs']} for k, v in (asr or {}).items()},
}
json.dump(res, open(os.path.join(out, 'render_qa.json'), 'w'), indent=1)
print(json.dumps(res, indent=1))
