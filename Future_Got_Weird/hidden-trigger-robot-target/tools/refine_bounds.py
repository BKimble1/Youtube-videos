#!/usr/bin/env python3
"""Refine caption boundaries that fall inside a spoken line, using local Whisper base.en (sherpa-onnx).
For each inner boundary, scan candidate cut points (-450..+150 ms, 15 ms step, low-energy points only) and keep
the one where both neighbouring windows transcribe to their own caption words; ties -> quietest point.
Rewrites audio/narration/phrases_v1.json in place (records the original estimate as 'start_est')."""
import json, os, re, sys
import numpy as np, soundfile as sf, sherpa_onnx
from scipy.signal import resample_poly
EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
m = sys.argv[1] if len(sys.argv) > 1 else '/tmp/asr/sherpa-onnx-whisper-base.en'
rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=f'{m}/base.en-encoder.onnx', decoder=f'{m}/base.en-decoder.onnx',
                                                 tokens=f'{m}/base.en-tokens.txt', language='en', task='transcribe')
y, sr = sf.read(os.path.join(EP, 'audio/narration/narration_v1.wav'))
y16 = resample_poly(y, 1, 3).astype(np.float32)
pad = np.zeros(3200, np.float32)
def tr(s, e):
    st = rec.create_stream(); st.accept_waveform(16000, np.concatenate([pad, y16[int(s*16000):int(e*16000)], pad]))
    rec.decode_stream(st); return st.result.text.strip()
norm = lambda t: re.sub(r'[^a-z ]', '', t.lower()).split()
def energy(t):
    i = int(t * 16000); return float(np.mean(y16[max(0, i-80):i+80] ** 2))
P = json.load(open(os.path.join(EP, 'audio/narration/phrases_v1.json')))
ph = P['phrases']
for i in range(1, len(ph)):
    if abs(ph[i]['start'] - ph[i-1]['end']) > 1e-6: continue  # boundary at a real pause: already exact
    b0 = ph[i]['start']; L, R = ph[i-1], ph[i]
    if norm(tr(L['start'], b0)) == norm(L['text']) and norm(tr(b0, R['end'])) == norm(R['text']):
        print('keep', R['text'], b0); continue
    cands = sorted(np.arange(b0 - 0.45, b0 + 0.151, 0.015), key=energy)[:16]
    good = [c for c in cands if norm(tr(L['start'], c)) == norm(L['text']) and norm(tr(c, R['end'])) == norm(R['text'])]
    if good:
        c = round(float(min(good, key=energy)), 3)
        R['start_est'] = b0; L['end'] = R['start'] = c
        print('moved', R['text'], b0, '->', c)
    else:
        print('UNRESOLVED', R['text'], b0)
json.dump(P, open(os.path.join(EP, 'audio/narration/phrases_v1.json'), 'w'), indent=1, ensure_ascii=False)
