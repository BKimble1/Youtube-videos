#!/usr/bin/env python3
"""Restore the V2 baseline media from this backup into a checkout of Future_Got_Weird/Video_01_V2.

  sh reconstruct.sh                       # joins the .partNNN files into the four .tar archives and verifies them
  python3 restore_v2.py [--root ../..] [--tars DIR]   # unpacks them into the V2 root and rebuilds every WAV from its FLAC
                                                     # (--tars: where reconstruct.sh wrote the archives; default here)

Needs Python 3 with numpy + soundfile (pip install numpy soundfile). Without them, the WAVs can be rebuilt with
ffmpeg instead (see RESTORE.md); this script is preferred because it checks every file sample by sample.
"""
import argparse
import hashlib
import json
import os
import sys
import tarfile
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))


def safe_extract(t, dest):
    base = os.path.realpath(dest)
    for m in t.getmembers():
        target = os.path.realpath(os.path.join(dest, m.name))
        if not (target == base or target.startswith(base + os.sep)) or m.issym() or m.islnk():
            sys.exit(f'refusing unsafe archive member {m.name}')
    t.extractall(dest)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--root', default=os.path.join(HERE, '..', '..'), help='the Video_01_V2 directory')
    ap.add_argument('--tars', default=HERE, help='directory holding the four reconstructed .tar archives')
    ap.add_argument('--skip-wip', action='store_true')
    a = ap.parse_args()
    root = os.path.realpath(a.root)
    import numpy as np
    import soundfile as sf

    for name in ('v2_audio_sources.tar', 'v2_qa_v1_review.tar'):
        with tarfile.open(os.path.join(a.tars, name)) as t:
            safe_extract(t, root)
        print('unpacked', name)
    if not a.skip_wip:
        snap = os.path.join(root, 'work_snapshot')
        os.makedirs(snap, exist_ok=True)
        with tarfile.open(os.path.join(a.tars, 'v2_wip_scenes.tar')) as t:
            safe_extract(t, snap)
        print('unpacked v2_wip_scenes.tar into work_snapshot/ (scene rebuilds in progress at the time of the backup)')

    with tempfile.TemporaryDirectory() as td:
        with tarfile.open(os.path.join(a.tars, 'v2_audio_rendered.tar')) as t:
            safe_extract(t, td)
        index = json.load(open(os.path.join(td, 'wav_index.json')))
        bad = 0
        for e in index:
            data, sr = sf.read(os.path.join(td, e['flac']), dtype='int32', always_2d=True)
            if hashlib.sha256(np.ascontiguousarray(data).tobytes()).hexdigest() != e['samples_sha256'] or sr != e['samplerate']:
                print('MISMATCH', e['wav'])
                bad += 1
                continue
            out = os.path.join(root, e['wav'])
            os.makedirs(os.path.dirname(out), exist_ok=True)
            sf.write(out, data if e['channels'] > 1 else data[:, 0], sr, subtype=e['subtype'])
            same_bytes = hashlib.sha256(open(out, 'rb').read()).hexdigest() == e['wav_sha256']
            print(f"restored {e['wav']} ({'identical file' if same_bytes else 'identical samples'})")
        if bad:
            sys.exit(f'{bad} files did not match their recorded sample hash')
    print('done: all audio restored and verified')


if __name__ == '__main__':
    main()
