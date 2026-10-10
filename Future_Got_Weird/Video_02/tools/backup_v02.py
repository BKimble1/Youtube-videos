#!/usr/bin/env python3
"""Back up everything Video 02 needs that Git does not carry (media is ignored / a Git LFS type in this repository and
the LFS host is not reachable from the production environment).

  python3 tools/backup_v02.py --group <group>                              -> backup/v02/<group>/
  python3 tools/backup_v02.py --verify                                     -> rebuild every archive from its parts in a
                                                                              temp dir and check every SHA-256

Groups (each archive split into parts of at most 24 MiB by tools/backup_split.py, with SHA256SUMS, manifest.json and
reconstruct.sh/.py):
  sources   v02_audio_sources.tar   byte-exact, not reproducible: the ElevenLabs narration takes (MP3) and alignments,
                                    the performance-check takes, the ElevenLabs sound-effect takes (+ registry, cost)
  rendered  v02_audio_rendered.tar  the project's PCM WAVs as lossless FLAC (sample-exact; subtype and a SHA-256 of the
                                    decoded samples recorded per file): assembled narration lines and track, effect
                                    library, effect/ambience tracks, music bed, final mix and its three stems. The music's
                                    per-instrument stems are not stored: tools/make_music_v02.py regenerates them.
  films     the delivered films (already compressed; split as they are)
  runway    accepted Runway clips and their raw downloads (if any)

v2 editorial pass (separate groups; the v1 groups above are left exactly as delivered):
  v2_sources   source files added since the v1 sources archive (the v2 narration takes and alignments, new effect takes):
               every file under the v1 source folders whose path and SHA-256 are not already in v02_audio_sources.tar
  v2_rendered  the v2 rendered audio, as `rendered` (FLAC, sample-exact)
  v2_films     the delivered v2 films (MASTER_4K, UPLOAD_1080p, PREVIEW_720p)
  v2_runs      the authors'-code re-run logs and saved run states (research/code_reproduction/out/*: stdout.log, .npz),
               which git ignores and the v2 kit board's "our check" chip and the description rely on

Restore: backup/v02/RESTORE.md.
"""
import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tarfile
import tempfile

import numpy as np
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STAGE = os.path.join(ROOT, 'backup', '_stage', 'v02')
DEST = os.path.join(ROOT, 'backup', 'v02')


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


def sha_file(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


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


def split(group, files):
    dest = os.path.join(DEST, group)
    if os.path.isdir(dest):
        shutil.rmtree(dest)
    os.makedirs(dest)
    subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'backup_split.py'), dest] + files, check=True)


def source_files():
    return (walk('audio/narration/v2/takes', {'.mp3', '.json', '.tsv'}) + walk('audio/narration/perfcheck', {'.mp3', '.json', '.md'})
            + walk('audio/sfx/v2/raw', {'.mp3', '.tsv', '.txt', '.json'}))


def rebuilt(group, name, td):
    """Rebuild one archive of a backup group from its parts into td; return its path."""
    gd = os.path.join(DEST, group)
    man = json.load(open(os.path.join(gd, 'manifest.json')))
    f = next(x for x in man['files'] if x['name'] == name)
    out = os.path.join(td, name)
    with open(out, 'wb') as o:
        for prt in f['parts']:
            with open(os.path.join(gd, prt['name']), 'rb') as fh:
                shutil.copyfileobj(fh, o)
    if sha_file(out) != f['sha256']:
        sys.exit(f'{group}/{name}: rebuilt archive fails its checksum')
    return out


def group_v2_sources():
    have = {}
    with tempfile.TemporaryDirectory() as td:
        with tarfile.open(rebuilt('sources', 'v02_audio_sources.tar', td)) as t:
            for m in t.getmembers():
                if m.isfile():
                    have[m.name] = hashlib.sha256(t.extractfile(m).read()).hexdigest()
    new = [f for f in source_files() if have.get(rel(f)) != sha_file(f)]
    if not new:
        return [], 0
    a = os.path.join(STAGE, 'v02v2_audio_sources.tar')
    tar(a, new)
    return [a], len(new)


def group_v2_runs():
    runs = walk('research/code_reproduction/out', {'.log', '.npz'})
    if not runs:
        return [], 0
    a = os.path.join(STAGE, 'v02v2_code_runs.tar')
    tar(a, runs)
    return [a], len(runs)


def group_sources():
    src = (walk('audio/narration/v2/takes', {'.mp3', '.json', '.tsv'}) + walk('audio/narration/perfcheck', {'.mp3', '.json', '.md'})
           + walk('audio/sfx/v2/raw', {'.mp3', '.tsv', '.txt', '.json'}))
    a = os.path.join(STAGE, 'v02_audio_sources.tar')
    tar(a, src)
    return [a], len(src)


RENDERED = [
    'audio/narration/v2',          # s##.wav (assembled lines)
    'source/public/audio',         # narration.wav, mix.wav
    'audio/sfx/v2/lib',            # effect library
    'audio/sfx/v2',                # sfx_track.wav, amb_track.wav (top level only, see below)
    'audio/music/v02',             # music_bed.wav (stems excluded)
    'audio/mix/v2',                # final_mix + stems
]


def group_rendered(archive='v02_audio_rendered.tar', extra=()):
    wavs = []
    for sub in list(RENDERED) + list(extra):
        base = os.path.join(ROOT, sub)
        if not os.path.isdir(base):
            continue
        if sub in ('audio/sfx/v2', 'audio/music/v02', 'audio/music/v02v2'):  # top level only (raw takes are in sources; stems are regenerable)
            wavs += sorted(os.path.join(base, f) for f in os.listdir(base) if f.lower().endswith('.wav'))
        else:
            wavs += walk(sub, {'.wav'})
    wavs = sorted(set(wavs))
    flac_dir = os.path.join(STAGE, 'flac')
    shutil.rmtree(flac_dir, ignore_errors=True)
    index, seen = [], {}
    for w in wavs:
        info = sf.info(w)
        if info.subtype not in ('PCM_16', 'PCM_24'):
            # float WAVs (the effect and ambience tracks) cannot be stored sample-exact as FLAC; they are regenerated
            # exactly from audio/sfx/v2/cues.json + the effect library by tools/make_sfx_v2.py (seeded), so record them
            entry = {'wav': rel(w), 'subtype': info.subtype, 'stored': 'regenerable', 'tool': 'tools/make_sfx_v2.py',
                     'wav_sha256': sha_file(w), 'wav_bytes': os.path.getsize(w)}
            index.append(entry)
            continue
        data, sr = sf.read(w, dtype='int32', always_2d=True)
        digest = sample_sha(data)
        entry = {'wav': rel(w), 'subtype': info.subtype, 'samplerate': sr, 'channels': info.channels, 'frames': len(data),
                 'samples_sha256': digest, 'wav_bytes': os.path.getsize(w), 'wav_sha256': sha_file(w), 'stored': 'flac'}
        key = (digest, info.subtype, sr, info.channels)
        if key in seen:
            entry['file'] = seen[key]
        else:
            fl = os.path.join(flac_dir, rel(w) + '.flac')
            os.makedirs(os.path.dirname(fl), exist_ok=True)
            sf.write(fl, data, sr, format='FLAC', subtype=info.subtype)
            back, _ = sf.read(fl, dtype='int32', always_2d=True)
            if sample_sha(back) != digest:
                sys.exit(f'{rel(w)}: FLAC round trip is not sample-exact')
            entry['file'] = os.path.relpath(fl, flac_dir)
            seen[key] = entry['file']
        index.append(entry)
    idx = os.path.join(flac_dir, 'wav_index.json')
    json.dump(index, open(idx, 'w'), indent=1)
    files = sorted({os.path.join(flac_dir, e['file']) for e in index if 'file' in e}) + [idx]
    b = os.path.join(STAGE, archive)
    tar(b, files, [os.path.relpath(f, flac_dir) for f in files])
    return [b], len(index)


def group_films(version='v1'):
    keep = ('_MASTER_4K.mp4', '_UPLOAD_1080p.mp4', '_PREVIEW_720p.mp4')  # the delivered films only (not review renders)
    films = [f for f in walk('exports', {'.mp4'}) if os.path.basename(f).startswith(f'Future_Got_Weird_Video_02_{version}_') and f.endswith(keep)]
    return films, len(films)


def group_runway():
    clips = walk('runway', {'.mp4'})
    if not clips:
        return [], 0
    r = os.path.join(STAGE, 'v02_runway_clips.tar')
    tar(r, clips)
    return [r], len(clips)


GROUPS = {'sources': group_sources, 'rendered': group_rendered, 'films': group_films, 'runway': group_runway,
          'v2_sources': group_v2_sources, 'v2_rendered': lambda: group_rendered('v02v2_audio_rendered.tar', extra=('audio/music/v02v2',)),
          'v2_films': lambda: group_films('v2'), 'v2_runs': group_v2_runs}
V1_GROUPS = ('sources', 'rendered', 'films', 'runway')


def verify():
    ok = True
    for group in sorted(os.listdir(DEST)):
        gd = os.path.join(DEST, group)
        mp = os.path.join(gd, 'manifest.json')
        if not os.path.isfile(mp):
            continue
        man = json.load(open(mp))
        with tempfile.TemporaryDirectory() as td:
            for f in man['files']:
                out = os.path.join(td, f['name'])
                with open(out, 'wb') as o:
                    for p in f['parts']:
                        pp = os.path.join(gd, p['name'])
                        if sha_file(pp) != p['sha256']:
                            print(f'BAD PART {group}/{p["name"]}')
                            ok = False
                        with open(pp, 'rb') as fh:
                            shutil.copyfileobj(fh, o)
                good = sha_file(out) == f['sha256']
                ok &= good
                print(f'{"OK " if good else "BAD"} {group}/{f["name"]} ({f["bytes"] / 1e6:.1f} MB, {len(f["parts"])} parts)')
    print('verify:', 'all good' if ok else 'FAILED')
    return ok


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--group', default='all', choices=list(GROUPS) + ['all'])
    ap.add_argument('--verify', action='store_true')
    a = ap.parse_args()
    if a.verify:
        sys.exit(0 if verify() else 1)
    os.makedirs(STAGE, exist_ok=True)
    if a.group == 'all':
        sys.exit('name a group: the v1 groups are frozen as delivered; the v2 pass writes v2_sources, v2_rendered, '
                 'v2_films and v2_runs')
    for g in [a.group]:
        files, n = GROUPS[g]()
        if not files:
            print(f'{g}: nothing to back up')
            continue
        split(g, files)
        print(f'{g}: {n} files -> ' + ', '.join(f'{os.path.basename(f)} {os.path.getsize(f) / 1e6:.1f} MB' for f in files))
    shutil.rmtree(os.path.join(ROOT, 'backup', '_stage'), ignore_errors=True)


if __name__ == '__main__':
    main()
