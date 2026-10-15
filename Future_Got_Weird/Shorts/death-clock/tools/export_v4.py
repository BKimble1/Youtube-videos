#!/usr/bin/env python3
"""V4: mux and package the deliverables from the rendered silent V4 master and the V4 mix (option R audio).

inputs : exports/_wip/v4_captioned_silent.mp4 (DeathClock, native 1080x1920, 30 fps, 1350 frames, rendered from the
         project source; override with --silent), audio/v4/mix/FGW_DeathClock_V4_mix_48k.wav, audio/v4/stems/*.wav,
         exports/_wip/v4_cover.png (optional; override with --cover).
         The narration, its text and the SRT are unchanged in V4 (locked), so the V3 export copies are reused:
         exports/v3/audio/FGW_DeathClock_V3_Narration_48k.wav, exports/v3/FGW_DeathClock_V3_Narration.txt,
         exports/v3/FGW_DeathClock_V3_Captions.srt (checked: the V4 caption windows in audio/v4/cues.json equal V3's).
outputs: exports/v4/  FGW_DeathClock_V4_Final_1080x1920.mp4 (upload master, burned-in captions, AAC 320k),
         FGW_DeathClock_V4_Review.mp4 (540x960, identical timing, AAC 128k), FGW_DeathClock_V4_Captions.srt,
         FGW_DeathClock_V4_Narration.txt, FGW_DeathClock_V4_Cover_1080x1920.png (if a cover was rendered),
         audio/FGW_DeathClock_V4_{Narration,Mix,Stem_narration,Stem_music,Stem_effects}_48k.wav,
         EXPORT_METADATA.json (ffprobe + sha256). exports/v1-v3 are only read.
Usage: python3 -B tools/export_v4.py [--silent PATH] [--cover PATH] [--out DIR (default exports/v4; a scratch dir for a dry run)]"""
import argparse
import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'exports' / 'v4'
W = ROOT / 'exports' / '_wip'
A = ROOT / 'audio' / 'v4'
E3 = ROOT / 'exports' / 'v3'
MIX = A / 'mix' / 'FGW_DeathClock_V4_mix_48k.wav'
P = 'FGW_DeathClock_V4'


def run(cmd):
    subprocess.run(cmd, check=True)


def probe(p):
    r = subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-show_entries', 'format=duration,size,bit_rate:stream=codec_name,width,height,r_frame_rate,nb_frames,nb_read_frames,sample_rate,channels,pix_fmt,color_space,color_primaries,color_transfer', '-of', 'json', str(p)],
                       capture_output=True, text=True, check=True)
    return json.loads(r.stdout)


def sha(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--silent', type=Path, default=W / 'v4_captioned_silent.mp4')
    ap.add_argument('--cover', type=Path, default=W / 'v4_cover.png')
    ap.add_argument('--out', type=Path, default=OUT)
    args = ap.parse_args()
    out = args.out
    missing = [str(p.relative_to(ROOT)) if p.is_relative_to(ROOT) else str(p) for p in (args.silent, MIX, A / 'stems' / 'effects.wav', A / 'MIX_LOG.json') if not p.exists()]
    if missing:
        print('export_v4: missing inputs (render the V4 picture / run tools/build_audio_v4.py first):', ', '.join(missing))
        sys.exit(2)
    # ---- guards: the picture is the locked 1350 frames at 30 fps, 1080x1920; the captions are V3's; the audio is option R
    v = [s for s in probe(args.silent)['streams'] if s.get('width')][0]
    frames = int(v.get('nb_read_frames') or v.get('nb_frames') or 0)
    assert (v['width'], v['height'], v['r_frame_rate'], frames) == (1080, 1920, '30/1', 1350), f'silent master is {v}'
    cues = json.load(open(A / 'cues.json'))
    assert cues['captions'] == json.load(open(ROOT / 'audio' / 'v3' / 'cues.json'))['captions'], 'V4 caption windows differ from V3 (locked)'
    log = json.load(open(A / 'MIX_LOG.json'))
    assert log['g3']['bit_exact'] and all(s['equals_v3'] for s in log['reused_stems'].values()), 'audio/v4 is not an option-R build'

    out.mkdir(parents=True, exist_ok=True)
    (out / 'audio').mkdir(exist_ok=True)
    final = out / f'{P}_Final_1080x1920.mp4'
    review = out / f'{P}_Review.mp4'
    mux = ['-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-movflags', '+faststart', '-shortest']
    run(['ffmpeg', '-v', 'error', '-y', '-i', str(args.silent), '-i', str(MIX)] + mux + [str(final)])
    run(['ffmpeg', '-v', 'error', '-y', '-i', str(final), '-vf', 'scale=540:960:flags=lanczos', '-c:v', 'libx264', '-crf', '23', '-preset', 'slow', '-pix_fmt', 'yuv420p',
         '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', str(review)])
    if args.cover.exists():
        shutil.copy(args.cover, out / f'{P}_Cover_1080x1920.png')
    # the locked narration, its text and the SRT: the V3 export copies, renamed
    reuse = {E3 / 'audio' / 'FGW_DeathClock_V3_Narration_48k.wav': out / 'audio' / f'{P}_Narration_48k.wav',
             E3 / 'FGW_DeathClock_V3_Narration.txt': out / f'{P}_Narration.txt',
             E3 / 'FGW_DeathClock_V3_Captions.srt': out / f'{P}_Captions.srt'}
    for src, dst in reuse.items():
        shutil.copyfile(src, dst)
        assert sha(src) == sha(dst)
    for s in ('narration', 'music', 'effects'):
        shutil.copyfile(A / 'stems' / f'{s}.wav', out / 'audio' / f'{P}_Stem_{s}_48k.wav')
    shutil.copyfile(MIX, out / 'audio' / f'{P}_Mix_48k.wav')
    meta = {}
    for p in sorted(out.rglob('*')):
        if p.is_file() and p.name != 'EXPORT_METADATA.json' and not p.name.endswith('.md'):
            e = {'sha256': sha(p), 'bytes': p.stat().st_size}
            if p.suffix in ('.mp4', '.wav', '.png'):
                e['ffprobe'] = probe(p)
            meta[str(p.relative_to(out))] = e
    meta['_reused_from_v3'] = {str(d.relative_to(out)): str(s.relative_to(ROOT)) for s, d in reuse.items()}
    meta['_audio'] = {'route': log['route'], 'mix_loudnorm_pass1': {k: log['loudnorm_pass1_mix'][k] for k in ('input_i', 'input_tp', 'input_lra')}, 'listened': False}
    meta['_commands'] = {'mux': mux, 'review': 'scale=540:960 lanczos, libx264 crf 23 slow, aac 128k', 'silent_master': str(args.silent.relative_to(ROOT)) if args.silent.is_relative_to(ROOT) else str(args.silent)}
    json.dump(meta, open(out / 'EXPORT_METADATA.json', 'w'), indent=1)
    for k in (final, review):
        f = probe(k)
        vs = [s for s in f['streams'] if s['codec_name'] == 'h264'][0]
        print(k.name, vs['width'], 'x', vs['height'], vs['r_frame_rate'], vs.get('nb_read_frames'), 'frames', round(float(f['format']['duration']), 3), 's', round(int(f['format']['size']) / 1e6, 2), 'MB')


if __name__ == '__main__':
    main()
