#!/usr/bin/env python3
"""Transcribe each narration take with two local models (Whisper base.en and Zipformer) and report duration,
speech span, words per minute, transcript match against the locked script, and pause structure.
usage: python3 tools/asr_takes.py /tmp/asr take1.mp3 ..."""
import sys, os, re, json, subprocess
import numpy as np, sherpa_onnx

LOCKED = ("If you put these contacts in, you could see flashing lights with your eyes completely shut. You see, your eyes "
          "normally can’t detect infrared. But these lenses contain tiny particles that absorb that invisible light and turn "
          "it into colors you can see. And while your eyelids block much of the visible light around you, infrared can still "
          "pass through. It reaches the lens underneath, gets converted, and becomes a flash you can actually see. So you "
          "could look completely asleep… while someone flashes you a secret code nobody around you can see.")
norm = lambda s: re.sub(r"[^a-z' ]", ' ', s.lower().replace('’', "'")).split()
LW = norm(LOCKED)

def load(path, sr=16000):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32)

def recognizers(d):
    z = d + '/sherpa-onnx-zipformer-en-2023-06-26/'
    zr = sherpa_onnx.OfflineRecognizer.from_transducer(encoder=z + 'encoder-epoch-99-avg-1.onnx', decoder=z + 'decoder-epoch-99-avg-1.onnx', joiner=z + 'joiner-epoch-99-avg-1.onnx', tokens=z + 'tokens.txt', num_threads=4)
    w = d + '/sherpa-onnx-whisper-base.en/'
    wr = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=w + 'base.en-encoder.onnx', decoder=w + 'base.en-decoder.onnx', tokens=w + 'base.en-tokens.txt', num_threads=4)
    return zr, wr

def run(r, y):
    s = r.create_stream(); s.accept_waveform(16000, y); r.decode_stream(s); return s.result

def zip_words(res):
    words, cur, t0 = [], '', None
    for tok, ts in zip(res.tokens, res.timestamps):
        if tok.startswith(' ') or tok.startswith('▁'):
            if cur: words.append((cur, t0))
            cur, t0 = tok.strip(' ▁'), ts
        else:
            cur += tok
    if cur: words.append((cur, t0))
    return [(w.lower(), t) for w, t in words]

def match(a, b):
    import difflib
    sm = difflib.SequenceMatcher(None, a, b)
    return sum(m.size for m in sm.get_matching_blocks()) / len(a)

if __name__ == '__main__':
    zr, wr = recognizers(sys.argv[1])
    out = []
    for p in sys.argv[2:]:
        y = load(p)
        W = 160; lv = 20 * np.log10(np.sqrt(np.array([np.mean(y[i:i + W] ** 2) for i in range(0, len(y) - W, W)])) + 1e-9)
        on = np.where(lv > -45)[0]; s0, s1 = on[0] * 0.01, on[-1] * 0.01
        # pauses: runs below -50 dB longer than 120 ms inside speech
        pauses, run_ = [], 0
        for i in range(on[0], on[-1]):
            if lv[i] < -50: run_ += 1
            else:
                if run_ >= 12: pauses.append((round((i - run_) * 0.01, 2), round(run_ * 0.01, 2)))
                run_ = 0
        wt = run(wr, y).text; zt = zip_words(run(zr, y))
        r = {'file': os.path.basename(p), 'dur': round(len(y) / 16000, 3), 'speech': [round(s0, 2), round(s1, 2)],
             'wpm_overall': round(len(LW) / (s1 - s0) * 60, 1), 'wpm_articulated': round(len(LW) / (s1 - s0 - sum(x[1] for x in pauses)) * 60, 1),
             'whisper': wt.strip(), 'whisper_match': round(match(LW, norm(wt)), 3), 'zip_match': round(match(LW, [w for w, _ in zt]), 3),
             'pauses': pauses}
        out.append(r)
        print(json.dumps(r, indent=1))
    json.dump(out, open(os.environ.get('OUT', '/dev/null'), 'w'), indent=1)
