#!/usr/bin/env python3
"""Loop-seam check on the delivered video: picture and sound across 27.97 s -> 0.00 s.

 * picture: mean absolute difference (0-255, 270x480 grey) between consecutive frames across the seam
   (839 -> 0), compared with the same measure for ordinary steps (838 -> 839, 0 -> 1, 1 -> 2); a loop is clean when the
   seam step is no larger than the neighbouring steps
 * picture: the same on the pixel level at full size for frames 899 and 0
 * sound: the delivered audio tiled 3x; largest sample step at the seam against the 99.9th percentile elsewhere
 * writes qa/seam/seam_frames.jpg (frames 896-899 | 0-3), qa/seam/seam_check_x3.mp4 (three back-to-back copies) and
   qa/seam/SEAM_CHECK.json
Usage: python3 tools/seam_check.py exports/<video>.mp4"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
vid = Path(sys.argv[1])
out = ROOT / 'qa' / 'v3' / 'seam'
out.mkdir(parents=True, exist_ok=True)
W, H = 270, 480


def frames(sel):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(vid), '-vf', f'select={sel},scale={W}:{H}', '-vsync', '0', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)


last = frames('between(n\\,834\\,839)')
first = frames('between(n\\,0\\,5)')
seq = list(last) + list(first)  # 834..839, 0..5
d = [float(np.abs(seq[i + 1] - seq[i]).mean()) for i in range(len(seq) - 1)]
steps = {'834-835': d[0], '835-836': d[1], '836-837': d[2], '837-838': d[3], '838-839': d[4], 'SEAM 839-0': d[5], '0-1': d[6], '1-2': d[7], '2-3': d[8], '3-4': d[9], '4-5': d[10]}

# full-size pixel comparison of frame 899 and frame 0
def full(n):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(vid), '-vf', f'select=eq(n\\,{n})', '-vsync', '0', '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(1920, 1080, 3).astype(np.float32)


f899, f0 = full(839), full(0)
full_mean = float(np.abs(f899 - f0).mean())
full_p99 = float(np.percentile(np.abs(f899 - f0).max(axis=2), 99))
sheet = Image.new('RGB', (216 * 8, 384), 'white')
for k, n in enumerate([836, 837, 838, 839, 0, 1, 2, 3]):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(vid), '-vf', f'select=eq(n\\,{n}),scale=216:384', '-vsync', '0', '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
    sheet.paste(Image.fromarray(np.frombuffer(raw, np.uint8).reshape(384, 216, 3)), (k * 216, 0))
sheet.save(out / 'seam_frames.jpg', quality=90)

# sound: three copies back to back
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(vid), '-vn', '-f', 'f32le', '-ac', '1', '-ar', '48000', '-'], capture_output=True, check=True).stdout
a = np.frombuffer(raw, np.float32)
t3 = np.concatenate([a, a, a])
dd = np.abs(np.diff(t3))
n = len(a)
audio = {
    'samples': int(n),
    'largest_step_at_seam': float(dd[n - 3:n + 3].max()),
    'p99.9_step_elsewhere': float(np.percentile(dd, 99.9)),
    'max_step_anywhere': float(dd.max()),
    'rms_50ms_before_dbfs': round(float(20 * np.log10(np.sqrt((a[-2400:] ** 2).mean()) + 1e-9)), 1),
    'rms_50ms_after_dbfs': round(float(20 * np.log10(np.sqrt((a[:2400] ** 2).mean()) + 1e-9)), 1),
}
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-stream_loop', '2', '-i', str(vid), '-c', 'copy', str(out / 'seam_check_x3.mp4')], check=True)
res = {
    'video': vid.name,
    'picture_mean_abs_step_270x480': {k: round(v, 3) for k, v in steps.items()},
    'picture_seam_vs_neighbours': 'clean' if steps['SEAM 839-0'] <= 1.5 * max(steps['838-839'], steps['0-1'], 0.05) else 'REVIEW',
    'picture_839_vs_0_full_size': {'mean_abs_diff': round(full_mean, 3), 'p99_max_channel_diff': round(full_p99, 1)},
    'audio_x3': audio,
    'audio_seam_clean': bool(audio['largest_step_at_seam'] <= max(2 * audio['p99.9_step_elsewhere'], 0.002)),
    'listened': False,
    'note': 'Measured only. The seam was not watched or heard in real time.',
}
json.dump(res, open(out / 'SEAM_CHECK.json', 'w'), indent=1)
print(json.dumps(res, indent=1))
