#!/usr/bin/env python3
"""Every narration take through two local ASR models (sherpa-onnx Whisper base.en and Zipformer en-2023-06-26),
compared word for word with the locked line. Zipformer token timestamps give word starts.
usage: python3 tools/asr_takes.py  -> audio/narration/takes/asr.json"""
import sys, os, json, glob, subprocess, difflib
import numpy as np, sherpa_onnx
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import ROOT, LINES, ASR_ROOT, norm
SR = 16000
z = os.path.join(ASR_ROOT, 'sherpa-onnx-zipformer-en-2023-06-26'); wh = os.path.join(ASR_ROOT, 'sherpa-onnx-whisper-base.en')
zr = sherpa_onnx.OfflineRecognizer.from_transducer(encoder=f'{z}/encoder-epoch-99-avg-1.onnx', decoder=f'{z}/decoder-epoch-99-avg-1.onnx', joiner=f'{z}/joiner-epoch-99-avg-1.onnx', tokens=f'{z}/tokens.txt', num_threads=4)
wr = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=f'{wh}/base.en-encoder.onnx', decoder=f'{wh}/base.en-decoder.onnx', tokens=f'{wh}/base.en-tokens.txt', num_threads=4)
def load(f): return np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32)
def run(rec, y):
    s = rec.create_stream(); s.accept_waveform(SR, y); rec.decode_stream(s); return s.result
out = {}
for f in sorted(glob.glob(os.path.join(ROOT, 'audio/narration/takes/h*_t*.mp3'))):
    h = os.path.basename(f)[1:3]
    LW = norm(LINES[h]['line'])
    y = load(f)
    rz, rw = run(zr, y), run(wr, y)
    words = []
    for tok, ts in zip(rz.tokens, rz.timestamps):
        if tok.startswith((' ', '▁')) or not words: words.append([tok.strip().lstrip('▁'), ts])
        else: words[-1][0] += tok
    res = {}
    for name, hyp in (('zipformer', norm(' '.join(w[0] for w in words))), ('whisper', norm(rw.text))):
        sm = difflib.SequenceMatcher(None, LW, hyp, autojunk=False)
        res[name] = {'text': ' '.join(hyp), 'diffs': [(op, ' '.join(LW[i1:i2]), ' '.join(hyp[j1:j2])) for op, i1, i2, j1, j2 in sm.get_opcodes() if op != 'equal']}
    out[os.path.basename(f)] = {'hook': h, **res, 'zip_words': [(norm(w)[0] if norm(w) else w.lower(), round(t, 3)) for w, t in words]}
    print(os.path.basename(f), '| W:', res['whisper']['diffs'] or 'exact', '| Z:', res['zipformer']['diffs'] or 'exact')
json.dump(out, open(os.path.join(ROOT, 'audio/narration/takes/asr.json'), 'w'), indent=1)
