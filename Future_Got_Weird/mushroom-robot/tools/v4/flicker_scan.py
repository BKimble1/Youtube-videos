"""Every-frame scan of a render: frame-to-frame change, single-frame flicker (a frame unlike both neighbours), and the
largest jumps. usage: python3 tools/v4/flicker_scan.py <video> [out.json]"""
import sys, json, subprocess, numpy as np
src = sys.argv[1]
W, H = 270, 480
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-vf', f'scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3).astype(np.float32)
d = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2, 3))
flick = []
for i in range(1, len(fr) - 1):
    a, b, c = d[i - 1], d[i], np.abs(fr[i + 1] - fr[i - 1]).mean()
    if min(a, b) > 4 and c < 0.35 * min(a, b): flick.append({'frame': i, 'in': round(float(a), 2), 'out': round(float(b), 2), 'skip': round(float(c), 2)})
med = float(np.median(d))
res = {'file': src, 'frames': len(fr), 'median_change': round(med, 2), 'max_change': round(float(d.max()), 2), 'max_at_frame': int(d.argmax()) + 1,
       'over_3x_median': [int(i) + 1 for i in np.where(d > 3 * med)[0]], 'single_frame_flicker': flick}
print(json.dumps(res))
if len(sys.argv) > 2: json.dump(res, open(sys.argv[2], 'w'), indent=1)
