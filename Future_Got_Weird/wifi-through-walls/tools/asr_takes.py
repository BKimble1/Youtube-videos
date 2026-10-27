#!/usr/bin/env python3
"""Independent transcripts of narration takes with two local sherpa-onnx models (zipformer-en-2023-06-26 and whisper
base.en). Audio is cut at pauses (>= 0.25 s below -45 dBFS) into pieces under 25 s. Prints WER vs the locked text.
usage: python3 -I tools/asr_takes.py <model_root> <out.json> take1.mp3 [take2.mp3 ...]"""
import sys, os, json, subprocess, difflib
import numpy as np, sherpa_onnx
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import LW, norm
SR = 16000
root, outp, takes = sys.argv[1], sys.argv[2], sys.argv[3:]
z = os.path.join(root, 'sherpa-onnx-zipformer-en-2023-06-26'); wh = os.path.join(root, 'sherpa-onnx-whisper-base.en')
models = {
    'zipformer': sherpa_onnx.OfflineRecognizer.from_transducer(encoder=f'{z}/encoder-epoch-99-avg-1.onnx', decoder=f'{z}/decoder-epoch-99-avg-1.onnx', joiner=f'{z}/joiner-epoch-99-avg-1.onnx', tokens=f'{z}/tokens.txt', num_threads=4),
    'whisper': sherpa_onnx.OfflineRecognizer.from_whisper(encoder=f'{wh}/base.en-encoder.onnx', decoder=f'{wh}/base.en-decoder.onnx', tokens=f'{wh}/base.en-tokens.txt', num_threads=4),
}
def cuts_for(y):
    W = 160; lv = 20 * np.log10(np.sqrt(np.array([np.mean(y[i:i + W] ** 2) for i in range(0, len(y) - W, W)])) + 1e-9)
    quiet = lv < -45; cands = []; run = 0
    for i, q in enumerate(quiet):
        run = run + 1 if q else 0
        if run == 25: cands.append((i - 12) * 0.01)
    cuts = [0.0]
    for c in cands:
        if c - cuts[-1] > 6: cuts.append(c)
    cuts.append(len(y) / SR); return cuts
res = {}
for t in takes:
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', t, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    y = np.frombuffer(raw, np.float32); cuts = cuts_for(y); res[t] = {}
    for name, rec in models.items():
        parts = []
        for a, b in zip(cuts[:-1], cuts[1:]):
            s = rec.create_stream(); s.accept_waveform(SR, y[int(a * SR):int(b * SR)]); rec.decode_stream(s); parts.append(s.result.text.strip())
        txt = ' '.join(parts); hyp = norm(txt.replace('-', ' ').replace('wi fi', 'wifi'))
        sm = difflib.SequenceMatcher(None, LW, hyp, autojunk=False)
        diffs = [(op, ' '.join(LW[i1:i2]), ' '.join(hyp[j1:j2])) for op, i1, i2, j1, j2 in sm.get_opcodes() if op != 'equal']
        errs = sum(max(i2 - i1, j2 - j1) for op, i1, i2, j1, j2 in sm.get_opcodes() if op != 'equal')
        res[t][name] = {'transcript': txt, 'wer': round(errs / len(LW), 3), 'diffs': diffs}
        print(f'== {os.path.basename(t)} {name} WER {errs/len(LW):.3f}\n  {txt}\n  diffs: {diffs}')
json.dump(res, open(outp, 'w'), indent=1)
