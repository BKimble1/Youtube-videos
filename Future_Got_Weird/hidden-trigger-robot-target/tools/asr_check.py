#!/usr/bin/env python3
"""Transcribe the full narration and each measured caption phrase with local Whisper base.en (sherpa-onnx).
Checks wording and that each phrase window contains its own words. Usage: python3 tools/asr_check.py --model DIR"""
import argparse, json, os, re
import numpy as np, soundfile as sf, sherpa_onnx
from scipy.signal import resample_poly
EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser(); ap.add_argument('--model', default='/tmp/asr/sherpa-onnx-whisper-base.en'); a = ap.parse_args()
m = a.model
rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=f'{m}/base.en-encoder.onnx', decoder=f'{m}/base.en-decoder.onnx',
                                                 tokens=f'{m}/base.en-tokens.txt', language='en', task='transcribe')
y, sr = sf.read(os.path.join(EP, 'audio/narration/narration_v1.wav'))
y16 = resample_poly(y, 1, 3).astype(np.float32)
def tr(x):
    s = rec.create_stream(); s.accept_waveform(16000, x); rec.decode_stream(s); return s.result.text.strip()
norm = lambda t: re.sub(r'[^a-z ]', '', t.lower().replace('-', ' ')).split()
meta = json.load(open(os.path.join(EP, 'audio/narration/phrases_v1.json')))
res = {"full": None, "phrases": []}
# full text in two halves (Whisper window is 30 s; keep each comfortably short)
mid = int(meta['lines'][5]['start'] * 16000) - 1600
res['full'] = tr(y16[:mid]) + ' ' + tr(y16[mid:])
print('FULL:', res['full'])
ok_all = True
for p in meta['phrases']:
    s, e = int(p['start'] * 16000), int(p['end'] * 16000)
    pad = np.zeros(3200, np.float32)
    t = tr(np.concatenate([pad, y16[s:e], pad]))
    ok = norm(t) == norm(p['text'])
    ok_all &= ok
    res['phrases'].append({**p, "asr": t, "match": ok})
    print(f"{'OK ' if ok else '?? '} {p['text']!r:40} -> {t!r}")
res['all_phrases_match'] = ok_all
json.dump(res, open(os.path.join(EP, 'qa/asr_check_v1.json'), 'w'), indent=1, ensure_ascii=False)
