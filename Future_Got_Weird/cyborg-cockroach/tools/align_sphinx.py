"""PocketSphinx forced alignment of the locked words on a take (independent of ElevenLabs Scribe).
usage: python3 tools/align_sphinx.py <audio> [out.json]"""
import json
import subprocess
import sys

import numpy as np
from pocketsphinx import Decoder

from script import locked_words, norm

SR = 16000


def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'],
                         capture_output=True, check=True).stdout
    return raw


def align(raw, words):
    d = Decoder(loglevel='FATAL', bestpath=False)
    d.set_align_text(' '.join(words))
    d.start_utt(); d.process_raw(raw, full_utt=True); d.end_utt()
    segs = [(s.word.split('(')[0], s.start_frame / 100, (s.end_frame + 1) / 100) for s in d.seg()
            if s.word not in ('<s>', '</s>', '<sil>', '(NULL)')]
    assert [w for w, _, _ in segs] == words, [w for w, _, _ in segs][:12]
    return segs


if __name__ == '__main__':
    lw = [norm(w) for w in locked_words()]
    segs = align(load(sys.argv[1]), lw)
    out = [{'word': w, 'start': round(s, 3), 'end': round(e, 3)} for w, s, e in segs]
    if len(sys.argv) > 2:
        json.dump(out, open(sys.argv[2], 'w'), indent=1)
    sc = json.load(open(sys.argv[3])) if len(sys.argv) > 3 else None
    for i, o in enumerate(out):
        extra = ''
        if sc:
            s = sc['words'][i]
            extra = f"   scribe {s['scribe'][0]:6.2f}-{s['scribe'][1]:6.2f}  d_start {o['start'] - s['scribe'][0]:+.2f}"
        print(f"{o['word']:13s} {o['start']:6.2f}-{o['end']:6.2f}{extra}")
