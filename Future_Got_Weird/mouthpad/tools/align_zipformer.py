#!/usr/bin/env python3
"""Word timings of a narration take from the local sherpa-onnx Zipformer (zipformer-en-2023-06-26) token timestamps.
The take is decoded in pieces cut at pauses (>= 0.15 s below -45 dBFS), so every piece starts on a measured onset.
Recognised words are matched to the locked words (tools/script.py); a word the model spells differently ('zomby',
'spoors on to') takes the time of its matched span. Each word's start is snapped to the waveform onset when it follows
a pause, and its end is the last loud 10 ms frame before the next word (or before the pause that follows it).
usage: python3 tools/align_zipformer.py <audio> <model_root> <out.json>"""
import sys, json, subprocess, difflib, os
import numpy as np, sherpa_onnx
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import DW, LW, norm

SR = 16000
audio, root, out = sys.argv[1:4]
y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', audio, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32)
win = SR // 100
n = len(y) // win
db = 20 * np.log10(np.sqrt((y[:n * win].reshape(n, win) ** 2).mean(1)) + 1e-9)
loud = db > -45
# pauses: quiet runs >= 15 frames
pauses, i = [], 0
while i < n:
    if not loud[i]:
        j = i
        while j < n and not loud[j]: j += 1
        if j - i >= 15 and i > 0 and j < n: pauses.append((i / 100, j / 100))
        i = j
    else:
        i += 1
cuts = [0.0] + [(a + b) / 2 for a, b in pauses] + [len(y) / SR]
z = os.path.join(root, 'sherpa-onnx-zipformer-en-2023-06-26')
rec = sherpa_onnx.OfflineRecognizer.from_transducer(encoder=f'{z}/encoder-epoch-99-avg-1.onnx', decoder=f'{z}/decoder-epoch-99-avg-1.onnx', joiner=f'{z}/joiner-epoch-99-avg-1.onnx', tokens=f'{z}/tokens.txt', num_threads=4)
hyp = []  # (word, start)
for a, b in zip(cuts[:-1], cuts[1:]):
    s = rec.create_stream(); s.accept_waveform(SR, y[int(a * SR):int(b * SR)]); rec.decode_stream(s)
    for tok, ts in zip(s.result.tokens, s.result.timestamps):
        if tok.startswith((' ', '▁')) or not hyp or hyp[-1][2] != a:
            hyp.append([tok.strip().lstrip('▁'), a + ts, a])
        else:
            hyp[-1][0] += tok
hw = [norm(h[0])[0] if norm(h[0]) else h[0].lower() for h in hyp]
sm = difflib.SequenceMatcher(None, LW, hw, autojunk=False)
start = [None] * len(LW)
for op, i1, i2, j1, j2 in sm.get_opcodes():
    for k in range(i1, i2):
        if op == 'equal':
            start[k] = hyp[j1 + k - i1][1]
        elif j2 > j1:
            # spread the locked words over the matched hypothesis span
            jj = j1 + int((k - i1) * (j2 - j1) / (i2 - i1))
            start[k] = hyp[jj][1]
assert all(s is not None for s in start), [LW[k] for k, s in enumerate(start) if s is None]
assert len(DW) == len(LW)

def onset(k):
    """the first word after a pause starts at the measured onset; later words keep the model's time"""
    t = start[k]
    for a, b in pauses:
        if a - 0.05 <= t <= b + 0.25 and (k == 0 or start[k - 1] < a): return b
    return t
S = [onset(k) for k in range(len(LW))]
for k in range(1, len(S)): S[k] = max(S[k], S[k - 1] + 0.04)
words = []
for k in range(len(LW)):
    st = S[k]
    nxt = S[k + 1] if k + 1 < len(LW) else len(y) / SR
    e = int(nxt * 100) - 1
    while e > int(st * 100) and not loud[e]: e -= 1
    words.append({'word': DW[k], 'start': round(st, 3), 'end': round(max(st + 0.05, (e + 1) / 100), 3)})
json.dump({'audio': audio, 'model': 'sherpa-onnx-zipformer-en-2023-06-26', 'pauses': pauses, 'words': words}, open(out, 'w'), indent=1)
diffs = [(op, ' '.join(LW[i1:i2]), ' '.join(hw[j1:j2])) for op, i1, i2, j1, j2 in sm.get_opcodes() if op != 'equal']
print('pauses', [(round(a, 2), round(b - a, 2)) for a, b in pauses])
print('spelling diffs', diffs)
for w in words: print(f"{w['start']:6.2f} {w['end']:6.2f}  {w['word']}")
