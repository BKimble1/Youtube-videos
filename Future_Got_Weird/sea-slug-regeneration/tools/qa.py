#!/usr/bin/env python3
"""QA from the rendered file (not from the source): python3 tools/qa.py <mp4> <out_prefix>
  * ffprobe stream facts;
  * motion scan: mean absolute frame difference for every frame (decoded at 270x480), flags one-frame spikes (a frame
    whose change is far above both neighbours: a pop) and stretches with almost no change (static holds > 1 s);
  * loop seam: the change from the last frame back to the first, against the typical frame-to-frame change;
  * sheets: one frame every 0.5 s (full film), a phone-size page (360x640 per frame), and strips around each cut.
Writes <out_prefix>_qa.json and PNG sheets next to it."""
import json, subprocess, sys
import numpy as np
from PIL import Image

mp4, out = sys.argv[1], sys.argv[2]
CUTS = [int(c) for c in sys.argv[3].split(',')] if len(sys.argv) > 3 else []
probe = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', mp4], capture_output=True, check=True).stdout)
vs = [s for s in probe['streams'] if s['codec_type'] == 'video'][0]
au = [s for s in probe['streams'] if s['codec_type'] == 'audio']
W, H = 270, 480
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-vf', f'scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3).astype(np.float32)
n = len(fr)
d = np.array([np.abs(fr[i] - fr[i - 1]).mean() for i in range(1, n)])  # d[i-1] = change into frame i
spikes = []
for i in range(1, len(d) - 1):
    if d[i] > 6 and d[i] > 3.0 * max(d[i - 1], d[i + 1], 0.5):
        spikes.append({'frame': i + 1, 'change': round(float(d[i]), 2), 'neighbours': [round(float(d[i - 1]), 2), round(float(d[i + 1]), 2)]})
holds, run = [], 0
for i, x in enumerate(d):
    run = run + 1 if x < 0.15 else 0
    if run == 31:
        holds.append(i + 1 - 30)
seam = float(np.abs(fr[0] - fr[-1]).mean())
res = {
    'file': mp4, 'codec': vs['codec_name'], 'size': [vs['width'], vs['height']], 'fps': vs['r_frame_rate'], 'frames': n, 'pix_fmt': vs['pix_fmt'],
    'duration_s': float(probe['format']['duration']), 'audio': [{'codec': a['codec_name'], 'rate': a.get('sample_rate'), 'channels': a.get('channels'), 'bit_rate': a.get('bit_rate')} for a in au],
    'mean_change': round(float(d.mean()), 3), 'median_change': round(float(np.median(d)), 3), 'max_change': {'frame': int(d.argmax()) + 1, 'value': round(float(d.max()), 2)},
    'one_frame_spikes': spikes, 'static_holds_over_1s_start_frames': holds,
    'loop_seam_change': round(seam, 3), 'loop_seam_vs_median': round(seam / max(1e-6, float(np.median(d))), 2),
    'cut_changes': {str(c): round(float(d[c - 1]), 2) for c in CUTS if 0 < c < n},
}
json.dump(res, open(out + '_qa.json', 'w'), indent=1)
print(json.dumps(res, indent=1))


def sheet(idx, cols, w, h, path, label=True):
    rows = (len(idx) + cols - 1) // cols
    im = Image.new('RGB', (cols * w, rows * h), (17, 17, 17))
    for k, i in enumerate(idx):
        if i >= n:
            continue
        tile = Image.fromarray(fr[i].astype(np.uint8)).resize((w, h))
        if label:
            from PIL import ImageDraw
            ImageDraw.Draw(tile).text((4, 4), f'{i} {i / 30:.2f}s', fill=(255, 255, 0))
        im.paste(tile, ((k % cols) * w, (k // cols) * h))
    im.save(path)


sheet(list(range(0, n, 15)), 10, 135, 240, out + '_every0.5s.png')
sheet(list(range(0, n, 30)), 8, 180, 320, out + '_phone.png', label=False)
for c in CUTS:
    sheet(list(range(max(0, c - 4), min(n, c + 4))), 8, 135, 240, out + f'_cut{c}.png')
sheet([n - 3, n - 2, n - 1, 0, 1, 2], 6, 180, 320, out + '_loopseam.png')
