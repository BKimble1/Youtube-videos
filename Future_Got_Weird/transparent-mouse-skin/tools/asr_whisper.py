#!/usr/bin/env python3
"""Independent recognition of a narration file with Whisper small (CTranslate2 int8, run by faster-whisper on the
CPU). No prompt or vocabulary from the script is given to the recogniser; its transcript is then compared with the
approved words. The model was taken from the npm registry (@skillninja/shortmovie-telop-model-p0..p3, MIT, OpenAI
Whisper small) because Hugging Face and OpenAI's hosts are not reachable from this environment.
usage: python3 tools/asr_whisper.py <model dir> <audio> [out.json]"""
import sys, json, os, difflib, subprocess
import numpy as np
from faster_whisper import WhisperModel
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script import LW, norm

def diffs(ref, hyp):
    sm = difflib.SequenceMatcher(None, ref, hyp, autojunk=False)
    out = [(op, ' '.join(ref[i1:i2]), ' '.join(hyp[j1:j2])) for op, i1, i2, j1, j2 in sm.get_opcodes() if op != 'equal']
    errs = sum(max(i2 - i1, j2 - j1) for op, i1, i2, j1, j2 in sm.get_opcodes() if op != 'equal')
    return errs / len(ref), out

if __name__ == '__main__':
    model = WhisperModel(sys.argv[1], device='cpu', compute_type='int8')
    # decoded with ffmpeg (16 kHz mono) rather than faster-whisper's PyAV path
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', sys.argv[2], '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    segs, _ = model.transcribe(np.frombuffer(raw, np.float32), language='en', beam_size=5, word_timestamps=True, condition_on_previous_text=False, vad_filter=False)
    segs = list(segs)
    text = ' '.join(s.text.strip() for s in segs)
    words = [{'word': w.word.strip(), 'start': round(w.start, 3), 'end': round(w.end, 3), 'p': round(w.probability, 3)} for s in segs for w in s.words]
    wer, d = diffs(LW, norm(text))
    print(f'{sys.argv[2]}\n  whisper: {text}\n  WER vs approved: {wer:.3f}  diffs: {d}')
    if len(sys.argv) > 3:
        json.dump({'audio': sys.argv[2], 'model': 'whisper-small ct2 int8 (faster-whisper)', 'text': text, 'wer_vs_approved': round(wer, 3), 'diffs': d, 'words': words}, open(sys.argv[3], 'w'), indent=1)
