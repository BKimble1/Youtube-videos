#!/usr/bin/env python3
"""Back up everything the V2 baseline needs that Git does not carry (media is ignored / an LFS type in this repo).

  python3 tools/backup_v2.py            -> backup/v2_baseline/  (git-friendly parts + checksums + restore scripts)

Archives (each split into parts of at most 24 MiB by tools/backup_split.py, with SHA256SUMS, manifest.json, reconstruct.sh/.py):
  v2_audio_sources.tar   byte-exact, not reproducible: ElevenLabs narration takes (68 MP3), the 144 new ElevenLabs
                         sound-effect takes (+ registry, cost note), the 18 pass-2 effects (10 reused by sfx_lib.py)
  v2_audio_rendered.tar  every PCM WAV the project uses or produced, stored as lossless FLAC (sample-exact; the
                         original subtype and a SHA-256 of the decoded integer samples are recorded per file):
                         assembled narration (36 segments + the full narration track), effect library, effect and
                         ambience tracks, music bed + instrument stems, first-pass mix + stems
  v2_wip_scenes.tar      the scene rebuilds still in progress (work/<scene>/source/src scene + component files and
                         their final contact sheets) — not part of the baseline project, kept so the work is not lost
  v2_qa_v1_review.tar    the dense V1 review sheets and motion strips (qa/v1_review/*.jpg|png)

Restore: see backup/v2_baseline/RESTORE.md (reconstruct parts → untar at the V2 root → python3 restore_v2.py).
"""
import hashlib
import json
import os
import subprocess
import sys
import tarfile

import numpy as np
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STAGE = os.path.join(ROOT, 'backup', '_stage', 'v2_baseline')
DEST = os.path.join(ROOT, 'backup', 'v2_baseline')


def rel(p):
    return os.path.relpath(p, ROOT)


def walk(sub, exts):
    out = []
    base = os.path.join(ROOT, sub)
    for d, _, fs in os.walk(base):
        if 'node_modules' in d:
            continue
        for f in fs:
            if os.path.splitext(f)[1].lower() in exts:
                out.append(os.path.join(d, f))
    return sorted(out)


def sample_sha(data):
    return hashlib.sha256(np.ascontiguousarray(data).tobytes()).hexdigest()


def tar(path, files, arcnames=None):
    with tarfile.open(path, 'w', format=tarfile.PAX_FORMAT) as t:
        for i, f in enumerate(files):
            ti = t.gettarinfo(f, arcname=(arcnames[i] if arcnames else rel(f)))
            ti.mtime = int(os.path.getmtime(f))
            ti.uid = ti.gid = 0
            ti.uname = ti.gname = ''
            with open(f, 'rb') as fh:
                t.addfile(ti, fh)


def main():
    os.makedirs(STAGE, exist_ok=True)
    made = []

    # ---- A. irreplaceable sources, byte-exact
    src = walk('audio/narration/v2/takes', {'.mp3'}) + walk('audio/sfx/v2/raw', {'.mp3', '.tsv', '.txt'}) + walk('audio/sfx/elevenlabs', {'.mp3'})
    a = os.path.join(STAGE, 'v2_audio_sources.tar')
    tar(a, src)
    made.append((a, len(src)))

    # ---- B. every PCM WAV as lossless FLAC (sample-exact), with an index to restore the WAVs
    wavs = [w for w in walk('.', {'.wav'}) if not rel(w).startswith(('work/', 'backup/'))]
    flac_dir = os.path.join(STAGE, 'flac')
    index = []
    seen = {}
    for w in wavs:
        info = sf.info(w)
        if info.subtype not in ('PCM_16', 'PCM_24'):
            sys.exit(f'{rel(w)}: subtype {info.subtype} cannot be stored sample-exact as FLAC')
        data, sr = sf.read(w, dtype='int32', always_2d=True)
        digest = sample_sha(data)
        entry = {'wav': rel(w), 'subtype': info.subtype, 'samplerate': sr, 'channels': info.channels, 'frames': len(data),
                 'samples_sha256': digest, 'wav_bytes': os.path.getsize(w), 'wav_sha256': hashlib.sha256(open(w, 'rb').read()).hexdigest()}
        key = (digest, info.subtype, sr, info.channels)
        if key in seen:  # identical audio stored once (e.g. narration.wav is written to two places)
            entry['flac'] = seen[key]
        else:
            fl = os.path.join(flac_dir, rel(w) + '.flac')
            os.makedirs(os.path.dirname(fl), exist_ok=True)
            sf.write(fl, data, sr, format='FLAC', subtype=info.subtype)
            back, _ = sf.read(fl, dtype='int32', always_2d=True)
            if sample_sha(back) != digest:
                sys.exit(f'{rel(w)}: FLAC round trip is not sample-exact')
            entry['flac'] = os.path.relpath(fl, flac_dir)
            seen[key] = entry['flac']
        index.append(entry)
    idx_path = os.path.join(flac_dir, 'wav_index.json')
    json.dump(index, open(idx_path, 'w'), indent=1)
    flacs = sorted({os.path.join(flac_dir, e['flac']) for e in index}) + [idx_path]
    b = os.path.join(STAGE, 'v2_audio_rendered.tar')
    tar(b, flacs, [os.path.relpath(f, flac_dir) for f in flacs])
    made.append((b, len(index)))

    # ---- C. scene rebuilds still in progress (code + final contact sheets)
    wip = []
    for scene in sorted(os.listdir(os.path.join(ROOT, 'work'))) if os.path.isdir(os.path.join(ROOT, 'work')) else []:
        sd = os.path.join(ROOT, 'work', scene)
        for d, _, fs in os.walk(sd):
            if 'node_modules' in d or '/public' in d:
                continue
            for f in fs:
                p = os.path.join(d, f)
                r = rel(p)
                if ('/source/src/scenes/' in r or '/source/src/components/v2/' in r) and os.path.basename(p).startswith(scene + '_'):
                    wip.append(p)
                elif ('sheet' in f.lower() and f.lower().endswith('.jpg')) or f == 'motion.json':
                    wip.append(p)
    c = os.path.join(STAGE, 'v2_wip_scenes.tar')
    tar(c, sorted(set(wip)))
    made.append((c, len(set(wip))))

    # ---- D. V1 review sheets
    rv = walk('qa/v1_review', {'.jpg', '.png'})
    d_ = os.path.join(STAGE, 'v2_qa_v1_review.tar')
    tar(d_, rv)
    made.append((d_, len(rv)))

    # ---- split into git-friendly parts
    if os.path.isdir(DEST):
        for f in os.listdir(DEST):
            if f.endswith(('.part001', '.part002')) or '.part' in f:
                os.remove(os.path.join(DEST, f))
        mp = os.path.join(DEST, 'manifest.json')
        if os.path.exists(mp):
            os.remove(mp)
    subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'backup_split.py'), DEST] + [m[0] for m in made], check=True)
    for path, n in made:
        print(f'{os.path.basename(path)}: {n} files, {os.path.getsize(path) / 1e6:.1f} MB')


if __name__ == '__main__':
    main()
