#!/usr/bin/env python3
"""Mux and package the deliverables from the rendered silent videos and the final mix.

inputs : exports/_wip/captioned_silent.mp4, exports/_wip/clean_silent.mp4, audio/mix/FGW_DeathClock_mix_48k.wav
outputs: exports/<VER>/  master (captioned), clean (no narration captions), 540x960 review copy, cover PNG,
         narration WAV, stems, SRT, locked narration text, EXPORT_METADATA.json (ffprobe + sha256)
Usage: python3 tools/export.py v1 [cover_frame]"""
import hashlib, json, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VER = sys.argv[1] if len(sys.argv) > 1 else 'v1'
COVER_F = int(sys.argv[2]) if len(sys.argv) > 2 else 596
OUT = ROOT / 'exports' / VER
OUT.mkdir(parents=True, exist_ok=True)
W = ROOT / 'exports' / '_wip'
MIX = ROOT / 'audio' / 'mix' / 'FGW_DeathClock_mix_48k.wav'
P = f'FGW_DeathClock_{VER}'


def run(cmd):
    subprocess.run(cmd, check=True)


def probe(p):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration,size,bit_rate:stream=codec_name,width,height,r_frame_rate,nb_frames,sample_rate,channels,pix_fmt,color_space,color_primaries,color_transfer', '-of', 'json', str(p)], capture_output=True, text=True, check=True)
    return json.loads(r.stdout)


def sha(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


master = OUT / f'{P}_Master_Captioned_1080x1920.mp4'
clean = OUT / f'{P}_Clean_NoCaptions_1080x1920.mp4'
review = OUT / f'{P}_Review_540x960.mp4'
mux = ['-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-movflags', '+faststart', '-shortest']
run(['ffmpeg', '-v', 'error', '-y', '-i', str(W / 'captioned_silent.mp4'), '-i', str(MIX)] + mux + [str(master)])
run(['ffmpeg', '-v', 'error', '-y', '-i', str(W / 'clean_silent.mp4'), '-i', str(MIX)] + mux + [str(clean)])
run(['ffmpeg', '-v', 'error', '-y', '-i', str(master), '-vf', 'scale=540:960:flags=lanczos', '-c:v', 'libx264', '-crf', '23', '-preset', 'slow', '-pix_fmt', 'yuv420p',
     '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', str(review)])
# cover: a frame of the finished clean render (crimson 00:02:14 on screen, his collapsed face behind, label present)
cover = OUT / f'{P}_Cover_1080x1920.png'
run(['ffmpeg', '-v', 'error', '-y', '-i', str(clean), '-vf', f'select=eq(n\\,{COVER_F})', '-vframes', '1', str(cover)])
# audio + text deliverables
(OUT / 'audio').mkdir(exist_ok=True)
shutil.copy(ROOT / 'audio' / 'narration' / 'narration_final_48k.wav', OUT / 'audio' / f'{P}_Narration_Selected_48k.wav')
for s in ('narration', 'music', 'effects'):
    shutil.copy(ROOT / 'audio' / 'stems' / f'{s}.wav', OUT / 'audio' / f'{P}_Stem_{s}_48k.wav')
shutil.copy(MIX, OUT / 'audio' / f'{P}_Mix_48k.wav')
shutil.copy(ROOT / 'captions' / 'FGW_DeathClock.srt', OUT / f'{P}_Captions.srt')
locked = json.load(open(ROOT / 'script' / 'narration_locked.json'))
(OUT / f'{P}_Narration_Locked.txt').write_text('\n\n'.join(locked) + '\n')
meta = {}
for p in sorted(OUT.rglob('*')):
    if p.is_file() and p.name != 'EXPORT_METADATA.json':
        e = {'sha256': sha(p), 'bytes': p.stat().st_size}
        if p.suffix in ('.mp4', '.wav', '.png'):
            e['ffprobe'] = probe(p)
        meta[str(p.relative_to(OUT))] = e
meta['_commands'] = {'mux': mux, 'review': 'scale=540:960 lanczos, libx264 crf 23 slow, aac 128k', 'cover_frame': COVER_F}
json.dump(meta, open(OUT / 'EXPORT_METADATA.json', 'w'), indent=1)
for k in (master, clean, review):
    f = probe(k)['format']
    print(k.name, round(float(f['duration']), 3), 's', round(int(f['size']) / 1e6, 2), 'MB')
