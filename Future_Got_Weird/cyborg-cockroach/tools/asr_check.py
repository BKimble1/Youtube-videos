"""Independent ASR check of a narration file against the locked script.

Two local recognisers (sherpa-onnx): Whisper base.en (run per pause-delimited chunk, each under 30 s) and a
Zipformer transducer (whole file). Prints word error rate and the word-level differences for each.

usage: python3 tools/asr_check.py <audio> [models_dir] [out.json]
"""
import difflib
import json
import subprocess
import sys

import numpy as np
import sherpa_onnx

from script import locked_words, norm_words

MODELS = sys.argv[2] if len(sys.argv) > 2 and __name__ == '__main__' else '/home/user/asr_models'


def load16k(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def chunks(x, sr=16000, max_s=25.0):
    """Split at the quietest 50 ms window between 8 s and max_s from each chunk start."""
    out, start = [], 0
    win = int(0.05 * sr)
    while len(x) - start > max_s * sr:
        lo, hi = start + int(8 * sr), start + int(max_s * sr)
        e = np.array([np.mean(x[i:i + win] ** 2) for i in range(lo, hi, win)])
        cut = lo + int(np.argmin(e)) * win + win // 2
        out.append(x[start:cut])
        start = cut
    out.append(x[start:])
    return out


def whisper_rec():
    d = f'{MODELS}/sherpa-onnx-whisper-base.en'
    return sherpa_onnx.OfflineRecognizer.from_whisper(encoder=f'{d}/base.en-encoder.onnx',
                                                      decoder=f'{d}/base.en-decoder.onnx',
                                                      tokens=f'{d}/base.en-tokens.txt', num_threads=4)


def whisper(x):
    rec = whisper_rec()
    text = []
    for c in chunks(x):
        s = rec.create_stream()
        s.accept_waveform(16000, c)
        rec.decode_stream(s)
        text.append(s.result.text)
    return ' '.join(text)


def zipformer(x):
    d = f'{MODELS}/sherpa-onnx-zipformer-en-2023-06-26'
    rec = sherpa_onnx.OfflineRecognizer.from_transducer(encoder=f'{d}/encoder-epoch-99-avg-1.onnx',
                                                        decoder=f'{d}/decoder-epoch-99-avg-1.onnx',
                                                        joiner=f'{d}/joiner-epoch-99-avg-1.onnx',
                                                        tokens=f'{d}/tokens.txt', num_threads=4)
    s = rec.create_stream()
    s.accept_waveform(16000, np.concatenate([x, np.zeros(8000, np.float32)]))
    rec.decode_stream(s)
    return s.result.text


def compare(hyp_text):
    ref = norm_words(locked_words())
    hyp = norm_words(hyp_text)
    sm = difflib.SequenceMatcher(a=ref, b=hyp, autojunk=False)
    diffs, errs = [], 0
    for op, a0, a1, b0, b1 in sm.get_opcodes():
        if op != 'equal':
            diffs.append([op, ' '.join(ref[a0:a1]), ' '.join(hyp[b0:b1])])
            errs += max(a1 - a0, b1 - b0)
    return {'wer': round(errs / len(ref), 4), 'diffs': diffs, 'text': hyp_text.strip()}


if __name__ == '__main__':
    x = load16k(sys.argv[1])
    res = {'file': sys.argv[1], 'whisper_base_en': compare(whisper(x)), 'zipformer_en': compare(zipformer(x))}
    print(json.dumps(res, indent=1, ensure_ascii=False))
    if len(sys.argv) > 3:
        with open(sys.argv[3], 'w') as f:
            json.dump(res, f, indent=1, ensure_ascii=False)
