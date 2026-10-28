#!/usr/bin/env python3
"""QA of a rendered review MP4, measured from the file itself.
  - container / stream specs (ffprobe), full decode without errors
  - per-frame luma statistics: black frames, frozen stretches (no visual change for longer than 1.0 s)
  - the loop junction: last frame against frame 0 (mean absolute difference, against the typical frame-to-frame step)
  - audio from the MP4: integrated loudness, true sample peak, the loop seam
  - contact sheets from the MP4: the first three seconds at the brief's QC times, the fire reveal, the balance sequence,
    the canyon payoff, the loop junction, and one frame per second
usage: python3 tools/qa.py <mp4> <out_prefix> [cues.json (default audio/cues.json; V2: audio/cues_v2.json)]"""
import json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw

mp4, pre = sys.argv[1], sys.argv[2]
os.makedirs(os.path.dirname(pre) or '.', exist_ok=True)
probe = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', mp4], capture_output=True, check=True).stdout)
vs = [s for s in probe['streams'] if s['codec_type'] == 'video'][0]
au = [s for s in probe['streams'] if s['codec_type'] == 'audio']
W, H = int(vs['width']), int(vs['height'])
dec = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-f', 'null', '-'], capture_output=True, text=True)
# frames at a small size for the statistics
w, h = 108, 192
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-vf', f'scale={w}:{h}', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)
n = len(fr)
luma = fr.mean(axis=(1, 2))
diff = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))
black = [int(i) for i in np.where(luma < 12)[0]]
# frozen: runs of near-zero change
frozen, run = [], 0
for i, d in enumerate(diff):
    run = run + 1 if d < 0.15 else 0
    if run == 31:
        frozen.append(i - 30)
loop_d = float(np.abs(fr[-1] - fr[0]).mean())
typ = float(np.median(diff))
# audio
aud = {}
if au:
    import soundfile as sf, pyloudnorm as pyln
    wav = pre + '_audio.wav'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', mp4, '-vn', '-ac', '2', '-ar', '48000', wav], check=True)
    x, sr = sf.read(wav)
    m = pyln.Meter(sr)
    aud = {'integrated_lufs': round(m.integrated_loudness(x), 2), 'sample_peak_dbfs': round(20 * np.log10(np.abs(x).max() + 1e-12), 2),
           'duration_s': round(len(x) / sr, 3), 'seam_jump': round(float(np.abs(x[0] - x[-1]).max()), 4)}
    os.remove(wav)
res = {
    'file': os.path.basename(mp4), 'size_mb': round(os.path.getsize(mp4) / 1e6, 2),
    'video': {'codec': vs['codec_name'], 'profile': vs.get('profile'), 'width': W, 'height': H, 'fps': vs['r_frame_rate'], 'frames': n, 'duration_s': float(probe['format']['duration']), 'pix_fmt': vs['pix_fmt'], 'bitrate_kbps': round(int(probe['format']['bit_rate']) / 1000)},
    'audio_stream': [{'codec': a['codec_name'], 'sample_rate': a['sample_rate'], 'channels': a['channels'], 'bitrate_kbps': round(int(a.get('bit_rate', 0)) / 1000)} for a in au],
    'decode_errors': dec.stderr.strip()[:400], 'black_frames': black, 'frozen_1s_starts': frozen,
    'loop_junction_mad': round(loop_d, 3), 'median_frame_step_mad': round(typ, 3), 'max_frame_step_mad': round(float(diff.max()), 2), 'max_step_frame': int(diff.argmax()) + 1,
    'audio': aud,
}
json.dump(res, open(pre + '_qa.json', 'w'), indent=1)
print(json.dumps(res, indent=1))

def grab(ts, out, cols=4, scale=0.25, label=True):
    tiles = []
    for tt in ts:
        b = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{tt:.3f}', '-i', mp4, '-frames:v', '1', '-vf', f'scale={int(W * scale)}:{int(H * scale)}:flags=lanczos', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
        im = Image.frombytes('RGB', (int(W * scale), int(H * scale)), b)
        if label:
            d = ImageDraw.Draw(im)
            d.rectangle([0, 0, 112, 22], fill=(0, 0, 0))
            d.text((4, 4), f'{tt:.2f}s f{round(tt * 30)}', fill=(255, 255, 0))
        tiles.append(im)
    rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * tiles[0].width, rows * tiles[0].height), (17, 17, 17))
    for i, im in enumerate(tiles):
        sheet.paste(im, ((i % cols) * im.width, (i // cols) * im.height))
    sheet.save(out)

cues = json.load(open(sys.argv[3] if len(sys.argv) > 3 else os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'audio/cues.json')))
Mk = cues['marks']
dur = res['video']['duration_s']
grab([0.0, 0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 2.5, 3.0], pre + '_sheet_first3s.png', cols=5, scale=0.3)
grab([Mk['but'] - 0.05, Mk['but'] + 0.05, Mk['jet'], Mk['andCaught'], Mk['fire'] - 0.04, Mk['fire'] + 0.06, Mk['fire'] + 0.3, Mk['fireE'] + 0.4], pre + '_sheet_fire.png')
grab([Mk['huge'], Mk['huge'] + 0.6, Mk['theBoard'], Mk['itself'], Mk['heHas'] + 0.3, Mk['body'], Mk['ai'] + 0.1, Mk['voice'] + 0.15, Mk['coach'] + 0.2, Mk['learn'] + 0.2, Mk['balance2'] + 0.2, Mk['balance2'] + 0.7], pre + '_sheet_balance.png')
grab([Mk['practice'] + 0.3, Mk['flew'], Mk['river2'], Mk['andThrough'] - 0.1, Mk['andThrough'], Mk['through'], Mk['canyon'], Mk['canyonE'] + 0.2, Mk['howMuch'] - 0.2], pre + '_sheet_payoff.png')
grab([dur - 2.0, dur - 1.5, dur - 1.0, dur - 0.5, dur - 0.07, 0.0, 0.5, 1.0, 1.5, 2.0], pre + '_sheet_loop.png', cols=5, scale=0.3)
grab([i + 0.5 for i in range(int(dur))], pre + '_sheet_every_second.png', cols=6, scale=0.2)
# every shot boundary: the frame before and the frame after each cut or match
bt = [b for sh in cues['shots'][1:] for b in (sh['from'] - 1 / 30, sh['from'] + 0.001)]
grab(bt, pre + '_sheet_cuts.png', cols=4, scale=0.25)
