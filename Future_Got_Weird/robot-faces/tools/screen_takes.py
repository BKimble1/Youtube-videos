#!/usr/bin/env python3
"""Screen narration takes: PocketSphinx free recognition vs the locked block text (word error rate)."""
import sys, subprocess, difflib, json
from pocketsphinx import Decoder
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from script import blocks, norm
def rec(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True, check=True).stdout
    d = Decoder(loglevel='FATAL'); d.start_utt(); d.process_raw(raw, full_utt=True); d.end_utt()
    return d.hyp().hypstr if d.hyp() else ''
B = blocks()
res = {}
for arg in sys.argv[1:]:
    bi, path = arg.split(':')
    ref = norm(B[int(bi)]); hyp = norm(rec(path))
    sm = difflib.SequenceMatcher(None, ref, hyp, autojunk=False)
    diffs = [(op, ' '.join(ref[i1:i2]), ' '.join(hyp[j1:j2])) for op, i1, i2, j1, j2 in sm.get_opcodes() if op != 'equal']
    errs = sum(max(i2 - i1, j2 - j1) for op, i1, i2, j1, j2 in sm.get_opcodes() if op != 'equal')
    res[path] = {'block': int(bi), 'wer': round(errs / len(ref), 3), 'diffs': diffs}
    print(path, 'WER', round(errs / len(ref), 3), diffs[:12])
json.dump(res, open('qa/take_screen_sphinx.json', 'w'), indent=1)
