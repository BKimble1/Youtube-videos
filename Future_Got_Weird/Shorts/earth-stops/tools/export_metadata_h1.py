#!/usr/bin/env python3
"""Writes exports/v3/EXPORT_METADATA.json (verbatim ffprobe -show_format -show_streams -of json for every v3 file, plus size and sha256, plus frame counts)
and exports/v3/EXPORT_METADATA.md (human table + the exact commands). Usage: python3 tools/export_metadata_v2.py"""
import hashlib, json, os, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
X = f'{ROOT}/exports/v3'
files = sorted(f for f in os.listdir(X) if f.endswith('.mp4'))
meta = {}
for f in files:
    p = f'{X}/{f}'
    pr = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_format', '-show_streams', '-of', 'json', p], capture_output=True, text=True, check=True).stdout)
    cnt = subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', p], capture_output=True, text=True, check=True).stdout.strip()
    meta[f] = {'path': f'exports/v3/{f}', 'bytes': os.path.getsize(p), 'sha256': hashlib.sha256(open(p, 'rb').read()).hexdigest(), 'video_frames_counted': int(cnt), 'ffprobe': pr}
json.dump(meta, open(f'{X}/EXPORT_METADATA.json', 'w'), indent=1)
L = ['# v3 (hook H1) export metadata', '', 'Source of truth: `EXPORT_METADATA.json` (verbatim `ffprobe -show_format -show_streams -of json`, size, sha256, counted frames). Summary:', '',
     '| file | bytes | sha256 | video | audio | duration |', '|---|---:|---|---|---|---|']
for f, m in meta.items():
    v = next(s for s in m['ffprobe']['streams'] if s['codec_type'] == 'video')
    a = next((s for s in m['ffprobe']['streams'] if s['codec_type'] == 'audio'), None)
    vs = f"{v['codec_name']} {v['profile']} {v['width']}x{v['height']} {v['r_frame_rate']} fps {v['pix_fmt']} {v.get('color_range')}/{v.get('color_space')}/{v.get('color_transfer')}/{v.get('color_primaries')} {m['video_frames_counted']} frames, {int(v['bit_rate']) // 1000} kb/s"
    au = f"{a['codec_name']} {a['sample_rate']} Hz {a['channels']} ch, {int(a['bit_rate']) // 1000} kb/s, {a['duration']} s" if a else 'none (no audio track)'
    L.append(f"| `{f}` | {m['bytes']} | `{m['sha256']}` | {vs} | {au} | {float(m['ffprobe']['format']['duration']):.4f} s |")
L += ['', '## Exact commands', '', '```bash',
      '# picture (from source/): headless-shell build of Chromium, Remotion 4.0.533',
      'F="--browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell --crf=16 --x264-preset=slow --color-space=bt709 --concurrency=4 --muted"',
      'npx remotion render src/index.ts HookH1 ../exports/v3/FGW_EarthStops_Hook_H1_Silent_1080x1920.mp4 $F',
      'npx remotion render src/index.ts HookH1-Clean ../exports/v3/FGW_EarthStops_Hook_H1_Silent_Clean_1080x1920.mp4 $F   # no captions, tags or graphics at all',
      '# audio (from the episode root); narration = audio/v3/voice/narration_opening_48k.wav (Test Voice take B, unmodified)',
      'node tools/build_cues_h1.mjs && python3 tools/build_audio_h1.py   # -> audio/v3/h1/stems/{mix_h1,voice_only_h1,sfx_only_h1}.wav',
      '# mux: picture stream copied, audio AAC 320k @ 48 kHz',
      'ffmpeg -y -i exports/v3/FGW_EarthStops_Hook_H1_Silent_1080x1920.mp4 -i audio/v3/h1/stems/mix_h1.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart exports/v3/FGW_EarthStops_Hook_H1_VoiceSFX_1080x1920.mp4',
      'ffmpeg -y -i exports/v3/FGW_EarthStops_Hook_H1_Silent_1080x1920.mp4 -i audio/v3/h1/stems/voice_only_h1.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart exports/v3/FGW_EarthStops_Hook_H1_VoiceOnly_1080x1920.mp4',
      'ffmpeg -y -i exports/v3/FGW_EarthStops_Hook_H1_Silent_1080x1920.mp4 -i audio/v3/h1/stems/sfx_only_h1.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart exports/v3/FGW_EarthStops_Hook_H1_SFXOnly_1080x1920.mp4',
      '```', '', 'Silent files carry no audio stream. The VoiceSFX, VoiceOnly and SFXOnly files carry the identical picture bytes as the Silent file (stream copy). Loudness and sync figures: `qa/v3/QA_H1.json`. Nobody has watched these in real time or listened to them (see `HOOK_H1_REPORT.md`).']
open(f'{X}/EXPORT_METADATA.md', 'w').write('\n'.join(L) + '\n')
print('\n'.join(L[:12]))
