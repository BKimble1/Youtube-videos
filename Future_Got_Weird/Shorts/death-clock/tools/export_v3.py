#!/usr/bin/env python3
"""V3: mux and package the deliverables from the rendered silent master and the V3 mix.

inputs : exports/_wip/v3_captioned_silent.mp4 (DeathClock, native 1080x1920 30 fps from the project source),
         audio/v3/mix/FGW_DeathClock_mix_48k.wav, audio/v3/stems/*.wav, audio/narration_v3/narration_final_48k.wav,
         captions/FGW_DeathClock_V3.srt, exports/_wip/v3_cover.png (a frame of the clean composition)
outputs: exports/v3/  FGW_DeathClock_V3_Final_1080x1920.mp4 (upload master, burned-in captions),
         FGW_DeathClock_V3_Review.mp4 (540x960, identical timing), SRT, cover PNG, narration WAV, stems, mix,
         narration text, EXPORT_METADATA.json (ffprobe + sha256). V1 and V2 deliverables (exports/v1, exports/v2) are untouched.
Usage: python3 tools/export_v3.py"""
import hashlib, json, shutil, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'exports' / 'v3'
OUT.mkdir(parents=True, exist_ok=True)
W = ROOT / 'exports' / '_wip'
A = ROOT / 'audio' / 'v3'
MIX = A / 'mix' / 'FGW_DeathClock_mix_48k.wav'
P = 'FGW_DeathClock_V3'


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


final = OUT / f'{P}_Final_1080x1920.mp4'
review = OUT / f'{P}_Review.mp4'
mux = ['-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-movflags', '+faststart', '-shortest']
run(['ffmpeg', '-v', 'error', '-y', '-i', str(W / 'v3_captioned_silent.mp4'), '-i', str(MIX)] + mux + [str(final)])
run(['ffmpeg', '-v', 'error', '-y', '-i', str(final), '-vf', 'scale=540:960:flags=lanczos', '-c:v', 'libx264', '-crf', '23', '-preset', 'slow', '-pix_fmt', 'yuv420p',
     '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', str(review)])
if (W / 'v3_cover.png').exists():
    shutil.copy(W / 'v3_cover.png', OUT / f'{P}_Cover_1080x1920.png')
(OUT / 'audio').mkdir(exist_ok=True)
shutil.copy(ROOT / 'audio' / 'narration_v3' / 'narration_final_48k.wav', OUT / 'audio' / f'{P}_Narration_48k.wav')
for s in ('narration', 'music', 'effects'):
    shutil.copy(A / 'stems' / f'{s}.wav', OUT / 'audio' / f'{P}_Stem_{s}_48k.wav')
shutil.copy(MIX, OUT / 'audio' / f'{P}_Mix_48k.wav')
shutil.copy(ROOT / 'captions' / 'FGW_DeathClock_V3.srt', OUT / f'{P}_Captions.srt')
script = json.load(open(ROOT / 'script' / 'narration_v3.json'))
(OUT / f'{P}_Narration.txt').write_text('\n\n'.join(script) + '\n')
meta = {}
for p in sorted(OUT.rglob('*')):
    if p.is_file() and p.name != 'EXPORT_METADATA.json' and not p.name.endswith('.md'):
        e = {'sha256': sha(p), 'bytes': p.stat().st_size}
        if p.suffix in ('.mp4', '.wav', '.png'):
            e['ffprobe'] = probe(p)
        meta[str(p.relative_to(OUT))] = e
meta['_commands'] = {'mux': mux, 'review': 'scale=540:960 lanczos, libx264 crf 23 slow, aac 128k'}
json.dump(meta, open(OUT / 'EXPORT_METADATA.json', 'w'), indent=1)
for k in (final, review):
    f = probe(k)
    v = [s for s in f['streams'] if s['codec_name'] == 'h264'][0]
    print(k.name, v['width'], 'x', v['height'], v['r_frame_rate'], v.get('nb_frames'), 'frames', round(float(f['format']['duration']), 3), 's', round(int(f['format']['size']) / 1e6, 2), 'MB')
