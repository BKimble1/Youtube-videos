#!/usr/bin/env python3
"""Screen every take with PocketSphinx free recognition against its block text (supporting check only: catches
dropped or repeated sentences, not pronunciation quality). Writes qa/take_screen_sphinx.json."""
import glob, json, os, subprocess, difflib, sys
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from script import blocks, norm
from pocketsphinx import Decoder
EP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B = blocks(); out = {}
for p in sorted(glob.glob(os.path.join(EP, 'audio/narration/takes/*.mp3'))):
    name = os.path.basename(p); bi = int(name[1]) - 1
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True).stdout
    d = Decoder(loglevel='FATAL'); d.start_utt(); d.process_raw(pcm, full_utt=True); d.end_utt()
    hyp = norm(d.hyp().hypstr if d.hyp() else ''); ref = norm(B[bi])
    sm = difflib.SequenceMatcher(None, ref, hyp, autojunk=False)
    errs = sum(max(i2 - i1, j2 - j1) for op, i1, i2, j1, j2 in sm.get_opcodes() if op != 'equal')
    out[name] = {'block': bi + 1, 'wer': round(errs / len(ref), 3), 'ref_words': len(ref), 'hyp_words': len(hyp)}
    print(name, out[name])
os.makedirs(os.path.join(EP, 'qa'), exist_ok=True)
json.dump(out, open(os.path.join(EP, 'qa/take_screen_sphinx.json'), 'w'), indent=1)
