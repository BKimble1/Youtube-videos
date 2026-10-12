#!/usr/bin/env python3
"""Writes exports/v2/EXPORT_METADATA.json (verbatim ffprobe -show_format -show_streams -of json for every v2 file, plus size and sha256, plus frame counts)
and exports/v2/EXPORT_METADATA.md (human table + the exact commands). Usage: python3 tools/export_metadata_v2.py"""
import hashlib, json, os, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
X = f'{ROOT}/exports/v2'
files = sorted(f for f in os.listdir(X) if f.endswith('.mp4'))
meta = {}
for f in files:
    p = f'{X}/{f}'
    pr = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_format', '-show_streams', '-of', 'json', p], capture_output=True, text=True, check=True).stdout)
    cnt = subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', p], capture_output=True, text=True, check=True).stdout.strip()
    meta[f] = {'path': f'exports/v2/{f}', 'bytes': os.path.getsize(p), 'sha256': hashlib.sha256(open(p, 'rb').read()).hexdigest(), 'video_frames_counted': int(cnt), 'ffprobe': pr}
json.dump(meta, open(f'{X}/EXPORT_METADATA.json', 'w'), indent=1)
L = ['# v2 export metadata', '', 'Source of truth: `EXPORT_METADATA.json` (verbatim `ffprobe -show_format -show_streams -of json`, size, sha256, counted frames). Summary:', '',
     '| file | bytes | sha256 | video | audio | duration |', '|---|---:|---|---|---|---|']
for f, m in meta.items():
    v = next(s for s in m['ffprobe']['streams'] if s['codec_type'] == 'video')
    a = next((s for s in m['ffprobe']['streams'] if s['codec_type'] == 'audio'), None)
    vs = f"{v['codec_name']} {v['profile']} {v['width']}x{v['height']} {v['r_frame_rate']} fps {v['pix_fmt']} {v.get('color_range')}/{v.get('color_space')}/{v.get('color_transfer')}/{v.get('color_primaries')} {m['video_frames_counted']} frames, {int(v['bit_rate']) // 1000} kb/s"
    au = f"{a['codec_name']} {a['sample_rate']} Hz {a['channels']} ch, {int(a['bit_rate']) // 1000} kb/s, {a['duration']} s" if a else 'none (no audio track)'
    L.append(f"| `{f}` | {m['bytes']} | `{m['sha256']}` | {vs} | {au} | {float(m['ffprobe']['format']['duration']):.4f} s |")
L += ['', '## Exact commands', '', '```bash',
      '# picture (from source/): headless-shell build of Chromium, Remotion 4.0.533',
      'npx remotion render src/index.ts EA2 ../exports/v2/FGW_EarthStops_EA2_Opening_Silent_1080x1920.mp4 --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell --crf=16 --x264-preset=slow --color-space=bt709 --concurrency=4 --muted',
      'npx remotion render src/index.ts EC1 ../exports/v2/FGW_EarthStops_EC1_Opening_Silent_1080x1920.mp4 <same flags>',
      'npx remotion render src/index.ts EA2-NoMarker ... / EC1-NoMarker ...   # same flags; no WHAT IF tag',
      '# audio (from the episode root)',
      'node tools/build_cues_v2.mjs ea2 && python3 tools/build_audio_v2.py ea2',
      'node tools/build_cues_v2.mjs ec1 && python3 tools/build_audio_v2.py ec1',
      '# mux: picture stream copied, audio AAC 320k @ 48 kHz',
      'ffmpeg -y -i exports/v2/FGW_EarthStops_EA2_Opening_Silent_1080x1920.mp4 -i audio/v2/ea2/stems/effects_ea2.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart exports/v2/FGW_EarthStops_EA2_Opening_SFX_1080x1920.mp4',
      'ffmpeg -y -i exports/v2/FGW_EarthStops_EC1_Opening_Silent_1080x1920.mp4 -i audio/v2/ec1/stems/effects_ec1.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart exports/v2/FGW_EarthStops_EC1_Opening_SFX_1080x1920.mp4',
      '```', '', 'Silent files carry no audio stream. The SFX files carry the identical picture bytes (stream copy). Loudness figures are in `qa/v2/AUDIO_MEASUREMENTS_V2.json`.']
open(f'{X}/EXPORT_METADATA.md', 'w').write('\n'.join(L) + '\n')
print('\n'.join(L[:16]))
