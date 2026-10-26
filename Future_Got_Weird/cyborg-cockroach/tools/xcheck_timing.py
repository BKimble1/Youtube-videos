"""Cross-check ElevenLabs Scribe word starts against Zipformer token timestamps (independent recogniser)."""
import json, sys
import numpy as np
import sherpa_onnx
from asr_check import load16k
from script import norm

x = load16k(sys.argv[1])
d = '/home/user/asr_models/sherpa-onnx-zipformer-en-2023-06-26'
rec = sherpa_onnx.OfflineRecognizer.from_transducer(encoder=f'{d}/encoder-epoch-99-avg-1.onnx', decoder=f'{d}/decoder-epoch-99-avg-1.onnx',
                                                    joiner=f'{d}/joiner-epoch-99-avg-1.onnx', tokens=f'{d}/tokens.txt', num_threads=4)
s = rec.create_stream(); s.accept_waveform(16000, np.concatenate([x, np.zeros(8000, np.float32)])); rec.decode_stream(s)
toks, ts = s.result.tokens, s.result.timestamps
words = []  # (word, start)
for t, tt in zip(toks, ts):
    if t.startswith('▁') or t.startswith(' ') or not words:
        words.append([t.replace('▁', '').strip(), tt])
    else:
        words[-1][0] += t
scribe = [w for w in json.load(open(sys.argv[2]))['words'] if w['type'] == 'word' and not w['text'].startswith('[') and not w['text'].endswith(']')]
zw = [(norm(w), t) for w, t in words]
diffs = []
j = 0
for w in scribe:
    n = norm(w['text'])
    for k in range(j, min(j + 4, len(zw))):
        if zw[k][0] == n:
            diffs.append((n, w['start'], zw[k][1], round(w['start'] - zw[k][1], 3)))
            j = k + 1
            break
d = np.array([a[3] for a in diffs])
print(f'matched {len(diffs)}/{len(scribe)} words; scribe-zipformer start offset: median {np.median(d):+.3f} s, mean |d| {np.mean(np.abs(d)):.3f} s, max |d| {np.max(np.abs(d)):.3f} s')
for a in diffs:
    if abs(a[3]) > 0.12:
        print('  large:', a)
