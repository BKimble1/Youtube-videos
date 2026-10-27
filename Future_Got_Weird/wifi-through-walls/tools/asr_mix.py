#!/usr/bin/env python3
"""Intelligibility check of a mix (or a rendered video's audio): the audio is cut at the narration's measured sentence
pauses (audio/narration/words_final.json), and each piece is transcribed by two local sherpa-onnx models
(zipformer-en-2023-06-26, whisper base.en). Prints WER against the locked narration.
usage: python3 -I tools/asr_mix.py <audio or mp4> <model_root> <out.json>"""
import sys, os, json, subprocess, difflib
import numpy as np, sherpa_onnx
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import LW, norm
EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 16000
src, root, outp = sys.argv[1:4]
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
y = np.frombuffer(raw, np.float32)
W = json.load(open(os.path.join(EP, 'audio/narration/words_final.json')))['words']
cuts = [0.0] + [(W[i]['end'] + W[i + 1]['start']) / 2 for i in range(len(W) - 1) if W[i + 1]['start'] - W[i]['end'] > 0.2] + [len(y) / SR]
z = os.path.join(root, 'sherpa-onnx-zipformer-en-2023-06-26'); wh = os.path.join(root, 'sherpa-onnx-whisper-base.en')
models = {
    'zipformer': sherpa_onnx.OfflineRecognizer.from_transducer(encoder=f'{z}/encoder-epoch-99-avg-1.onnx', decoder=f'{z}/decoder-epoch-99-avg-1.onnx', joiner=f'{z}/joiner-epoch-99-avg-1.onnx', tokens=f'{z}/tokens.txt', num_threads=4),
    'whisper': sherpa_onnx.OfflineRecognizer.from_whisper(encoder=f'{wh}/base.en-encoder.onnx', decoder=f'{wh}/base.en-decoder.onnx', tokens=f'{wh}/base.en-tokens.txt', num_threads=4),
}
res = {}
for name, rec in models.items():
    parts = []
    for a, b in zip(cuts[:-1], cuts[1:]):
        s = rec.create_stream(); s.accept_waveform(SR, y[int(a * SR):int(b * SR)]); rec.decode_stream(s); parts.append(s.result.text.strip())
    txt = ' '.join(parts); hyp = norm(txt.replace('-', ' ').lower().replace('wi fi', 'wifi'))
    sm = difflib.SequenceMatcher(None, LW, hyp, autojunk=False)
    diffs = [(op, ' '.join(LW[i1:i2]), ' '.join(hyp[j1:j2])) for op, i1, i2, j1, j2 in sm.get_opcodes() if op != 'equal']
    errs = sum(max(i2 - i1, j2 - j1) for op, i1, i2, j1, j2 in sm.get_opcodes() if op != 'equal')
    res[name] = {'transcript': txt, 'wer': round(errs / len(LW), 3), 'diffs': diffs}
    print(f'== {name} WER {errs / len(LW):.3f}  diffs: {diffs}')
json.dump(res, open(outp, 'w'), indent=1)
