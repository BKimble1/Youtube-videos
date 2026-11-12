import subprocess, numpy as np, sys
# mean absolute frame difference (luma, 270x480) for every frame step; flags jumps that stand out from their neighbours
f = sys.argv[1]; W, H = 270, 480
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-vf', f'scale={W}:{H},format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
v = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
d = np.abs(np.diff(v, axis=0)).mean((1, 2))
seam = np.abs(v[0] - v[-1]).mean()
print('frames', len(v), 'mean step', round(d.mean(), 2), 'max', round(d.max(), 2), 'at', int(d.argmax()) + 1, ' loop seam (last->first)', round(seam, 2))
med = np.array([np.median(d[max(0, i - 4):i + 5]) for i in range(len(d))])
for i in np.argsort(-d)[:14]:
    print(f'  step {i}->{i+1} ({(i+1)/30:.2f}s): {d[i]:.2f}  (local median {med[i]:.2f}, ratio {d[i]/(med[i]+1e-3):.1f})')
