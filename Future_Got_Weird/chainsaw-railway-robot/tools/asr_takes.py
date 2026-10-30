#!/usr/bin/env python3
"""Screen every narration take against its locked block with two local sherpa-onnx models (zipformer-en-2023-06-26,
whisper base.en). The audio is cut at measured pauses (>= 0.3 s below -45 dBFS). Prints differences from the locked
words and the speech rate; writes audio/narration/take_screen.json.
usage: python3 tools/asr_takes.py <model_root>"""
import sys, json, subprocess, difflib, os, glob
import numpy as np, sherpa_onnx
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import ROOT, blocks, words, norm
SR = 16000
root = sys.argv[1]
z = os.path.join(root, 'sherpa-onnx-zipformer-en-2023-06-26')
wh = os.path.join(root, 'sherpa-onnx-whisper-base.en')
models = {
    'zipformer': sherpa_onnx.OfflineRecognizer.from_transducer(encoder=f'{z}/encoder-epoch-99-avg-1.onnx', decoder=f'{z}/decoder-epoch-99-avg-1.onnx', joiner=f'{z}/joiner-epoch-99-avg-1.onnx', tokens=f'{z}/tokens.txt', num_threads=4),
    'whisper': sherpa_onnx.OfflineRecognizer.from_whisper(encoder=f'{wh}/base.en-encoder.onnx', decoder=f'{wh}/base.en-decoder.onnx', tokens=f'{wh}/base.en-tokens.txt', num_threads=4),
}
NUM = {'2024': ['twenty', 'twenty', 'four'], }

def lw_of(b):
    return [norm(w) for w in words(b)]

def hyp_norm(t):
    out = []
    for w in t.replace('-', ' ').split():
        n = norm(w)
        if n: out.append(n)
    return out

res = {}
for f in sorted(glob.glob(os.path.join(ROOT, 'audio/narration/takes/b*_t*.mp3'))):
    bi = int(os.path.basename(f)[1]) - 1
    y = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32)
    win = 160; n = len(y) // win
    db = 20 * np.log10(np.sqrt((y[:n * win].reshape(n, win) ** 2).mean(1)) + 1e-9)
    loud = np.where(db > -45)[0]
    sp0, sp1 = loud[0] * win / SR, (loud[-1] + 1) * win / SR
    cuts, run = [0.0], 0
    pauses = []
    for i in range(n):
        run = run + 1 if db[i] < -45 else 0
        if run == 30: cuts.append((i - 15) * win / SR)
    cuts.append(len(y) / SR)
    # pause list (>= 0.25 s)
    i = 0
    while i < n:
        if db[i] < -45:
            j = i
            while j < n and db[j] < -45: j += 1
            if (j - i) * win / SR >= 0.25 and i > 0 and j < n: pauses.append(round((j - i) * win / SR, 2))
            i = j
        else: i += 1
    LW = lw_of(blocks()[bi])
    r = {'block': bi + 1, 'duration': round(len(y) / SR, 2), 'speech_span': [round(sp0, 2), round(sp1, 2)],
         'wpm': round(len(LW) / (sp1 - sp0) * 60, 1), 'pauses_ge_0.25s': pauses}
    for name, rec in models.items():
        parts = []
        for a, b in zip(cuts[:-1], cuts[1:]):
            if b - a < 0.2: continue
            s = rec.create_stream(); s.accept_waveform(SR, y[int(a * SR):int(b * SR)]); rec.decode_stream(s)
            parts.append(s.result.text.strip())
        hyp = hyp_norm(' '.join(parts))
        sm = difflib.SequenceMatcher(None, LW, hyp, autojunk=False)
        r[name] = [(op, ' '.join(LW[i1:i2]), ' '.join(hyp[j1:j2])) for op, i1, i2, j1, j2 in sm.get_opcodes() if op != 'equal']
    res[os.path.basename(f)] = r
    print(os.path.basename(f), json.dumps(r))
json.dump(res, open(os.path.join(ROOT, 'audio/narration/take_screen.json'), 'w'), indent=1)
