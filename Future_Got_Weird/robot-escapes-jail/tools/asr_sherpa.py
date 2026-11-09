#!/usr/bin/env python3
"""Independent transcript of a narration file with two local sherpa-onnx models (zipformer-en-2023-06-26 and
whisper base.en, k2-fsa GitHub releases). The audio is cut at pauses >= 0.3 s found in the waveform, so each piece is
well under Whisper's 30 s window. Prints each model's transcript and its word differences from the locked text.
usage: python3 tools/asr_sherpa.py <audio> <model_root> [out.json]"""
import sys, json, subprocess, difflib, os
import numpy as np, sherpa_onnx
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import LW, norm

SR = 16000
audio, root = sys.argv[1:3]
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', audio, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
y = np.frombuffer(raw, np.float32)
win = 160
n = len(y) // win
db = 20 * np.log10(np.sqrt((y[:n * win].reshape(n, win) ** 2).mean(1)) + 1e-9)
quiet = db < -45
cuts, run = [0.0], 0
for i in range(n):
    run = run + 1 if quiet[i] else 0
    if run == 30:  # 0.3 s of quiet: cut in its middle
        cuts.append((i - 15) * win / SR)
cuts.append(len(y) / SR)
z = os.path.join(root, 'sherpa-onnx-zipformer-en-2023-06-26')
wh = os.path.join(root, 'sherpa-onnx-whisper-base.en')
models = {
    'zipformer': sherpa_onnx.OfflineRecognizer.from_transducer(encoder=f'{z}/encoder-epoch-99-avg-1.onnx', decoder=f'{z}/decoder-epoch-99-avg-1.onnx', joiner=f'{z}/joiner-epoch-99-avg-1.onnx', tokens=f'{z}/tokens.txt', num_threads=4),
    'whisper': sherpa_onnx.OfflineRecognizer.from_whisper(encoder=f'{wh}/base.en-encoder.onnx', decoder=f'{wh}/base.en-decoder.onnx', tokens=f'{wh}/base.en-tokens.txt', num_threads=4),
}
res = {}
for name, rec in models.items():
    parts = []
    for a, b in zip(cuts[:-1], cuts[1:]):
        if b - a < 0.2:
            continue
        s = rec.create_stream(); s.accept_waveform(SR, y[int(a * SR):int(b * SR)]); rec.decode_stream(s)
        parts.append(s.result.text.strip())
    hyp = norm(' '.join(parts).replace('-', ' '))
    sm = difflib.SequenceMatcher(None, LW, hyp, autojunk=False)
    ops = sm.get_opcodes()
    diffs = [(op, ' '.join(LW[i1:i2]), ' '.join(hyp[j1:j2])) for op, i1, i2, j1, j2 in ops if op != 'equal']
    errs = sum(max(i2 - i1, j2 - j1) for op, i1, i2, j1, j2 in ops if op != 'equal')
    res[name] = {'transcript': ' '.join(parts), 'wer': round(errs / len(LW), 3), 'diffs': diffs}
    print(f'== {name}  WER {errs / len(LW):.3f}\n{" ".join(parts)}\n  diffs: {diffs}')
if len(sys.argv) > 3: json.dump(res, open(sys.argv[3], 'w'), indent=1)
