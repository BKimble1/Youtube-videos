"""Find speech groups (runs of sound separated by silence) in a narration file.

10 ms energy frames; a frame is speech when it is within 38 dB of the loudest frame; groups closer
than 120 ms are merged. Prints each group and the silences between them.

Usage: python3 tools/speech_groups.py <audio> [json-out]
"""
import json
import subprocess
import sys

import numpy as np

SR = 48000


def load(path: str) -> np.ndarray:
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def groups(x: np.ndarray, floor_db=38.0, merge_s=0.12, hop_s=0.01):
    hop = int(hop_s * SR)
    n = len(x) // hop
    e = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2) + 1e-12) for i in range(n)])
    db = 20 * np.log10(e + 1e-12)
    on = db > db.max() - floor_db
    segs, start = [], None
    for i, v in enumerate(on):
        if v and start is None:
            start = i
        if not v and start is not None:
            segs.append([start, i])
            start = None
    if start is not None:
        segs.append([start, n])
    merged = []
    for s in segs:
        if merged and (s[0] - merged[-1][1]) * hop_s < merge_s:
            merged[-1][1] = s[1]
        else:
            merged.append(s)
    return [(a * hop_s, b * hop_s) for a, b in merged if (b - a) * hop_s > 0.04]


if __name__ == '__main__':
    x = load(sys.argv[1])
    g = groups(x)
    for i, (a, b) in enumerate(g):
        gap = a - g[i - 1][1] if i else a
        print(f'{i:2d}  {a:6.2f}-{b:6.2f}  len {b - a:5.2f}  gap-before {gap:5.2f}')
    print('total', round(len(x) / SR, 3))
    if len(sys.argv) > 2:
        json.dump({'file': sys.argv[1], 'groups': g, 'duration': len(x) / SR}, open(sys.argv[2], 'w'), indent=1)
