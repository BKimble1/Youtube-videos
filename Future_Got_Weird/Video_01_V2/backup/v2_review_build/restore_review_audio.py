#!/usr/bin/env python3
"""Rebuild the review build's WAVs from v2_review_audio.tar (after `sh reconstruct.sh`), checking every file sample by sample.
  python3 restore_review_audio.py [--root ../..] [--tar v2_review_audio.tar]      (needs numpy + soundfile)"""
import argparse, hashlib, json, os, sys, tarfile, tempfile
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser(); ap.add_argument('--root', default=os.path.join(HERE, '..', '..')); ap.add_argument('--tar', default=os.path.join(HERE, 'v2_review_audio.tar'))
a = ap.parse_args()
with tempfile.TemporaryDirectory() as td:
    with tarfile.open(a.tar) as t:
        for m in t.getmembers():
            if m.issym() or m.islnk() or os.path.isabs(m.name) or '..' in m.name.split('/'):
                sys.exit(f'unsafe member {m.name}')
        t.extractall(td)
    for e in json.load(open(os.path.join(td, 'wav_index.json'))):
        d, sr = sf.read(os.path.join(td, e['flac']), dtype='int32', always_2d=True)
        if hashlib.sha256(np.ascontiguousarray(d).tobytes()).hexdigest() != e['samples_sha256']:
            sys.exit('MISMATCH ' + e['wav'])
        out = os.path.join(a.root, e['wav']); os.makedirs(os.path.dirname(out), exist_ok=True)
        sf.write(out, d if e['channels'] > 1 else d[:, 0], sr, subtype=e['subtype']); print('restored', e['wav'])
