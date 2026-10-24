#!/usr/bin/env python3
"""Independent transcript of a narration file with two local sherpa-onnx models (zipformer-en-2023-06-26 and
whisper base.en, from the k2-fsa GitHub releases). The audio is cut at the sentence pauses of the locked narration
(from a word timeline) so each piece is well under Whisper's 30 s window. Prints each model's transcript and its
word differences from the locked text.
usage: python3 tools/asr_sherpa.py <audio> <words.json> <model_root> [out.json] [offset_s]"""
import sys, json, subprocess, difflib, os
import numpy as np, sherpa_onnx
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import LW, norm

SR = 16000
audio, words_p, root = sys.argv[1:4]
off = float(sys.argv[5]) if len(sys.argv) > 5 else 0.0
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', audio, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
y = np.frombuffer(raw, np.float32)
W = json.load(open(words_p))['words']
cuts = [0.0] + [(W[i]['end'] + W[i + 1]['start']) / 2 + off for i in range(len(W) - 1) if W[i + 1]['start'] - W[i]['end'] > 0.3] + [len(y) / SR]
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
        s = rec.create_stream(); s.accept_waveform(SR, y[int(a * SR):int(b * SR)]); rec.decode_stream(s)
        parts.append(s.result.text.strip())
    hyp = norm(' '.join(parts).replace('-', ' '))
    sm = difflib.SequenceMatcher(None, LW, hyp, autojunk=False)
    diffs = [(op, ' '.join(LW[i1:i2]), ' '.join(hyp[j1:j2])) for op, i1, i2, j1, j2 in sm.get_opcodes() if op != 'equal']
    errs = sum(max(i2 - i1, j2 - j1) for op, i1, i2, j1, j2 in sm.get_opcodes() if op != 'equal')
    res[name] = {'transcript': ' '.join(parts), 'wer': round(errs / len(LW), 3), 'diffs': diffs}
    print(f'== {name}  WER {errs / len(LW):.3f}\n{" ".join(parts)}\n  diffs: {diffs}')
if len(sys.argv) > 4: json.dump(res, open(sys.argv[4], 'w'), indent=1)
