#!/usr/bin/env python3
"""Builds the V3 deliverables in exports/v6/ from the rendered silent master and the audio stems, then writes EXPORT_METADATA.json / .md
(verbatim ffprobe -show_format -show_streams, size, sha256, counted frames, exact commands).
Inputs: qa/v6/render/FilmV3_silent_raw.mp4, audio/v6/v3/stems/{mix_v3,mix_v3_nomusic,voice_only_v3,sfx_only_v3,music_only_v3}.wav, script/SCRIPT.md. Usage: python3 tools/export_v3.py"""
import hashlib, json, os, shutil, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
X = f'{ROOT}/exports/v6'
RAW = f'{ROOT}/qa/v6/render/FilmV3_silent_raw.mp4'
ST = f'{ROOT}/audio/v6/v3/stems'
os.makedirs(X, exist_ok=True)
MUX = ['-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-movflags', '+faststart']
cmds = []


def run(args):
    cmds.append(' '.join(args))
    subprocess.run(args, check=True, capture_output=True)


shutil.copyfile(RAW, f'{X}/FGW_EarthStops_V3_Silent_1080x1920.mp4')
for out, stem in [('Review', 'mix_v3'), ('ReviewNoMusic', 'mix_v3_nomusic'), ('VoiceOnly', 'voice_only_v3'), ('SFXOnly', 'sfx_only_v3'), ('MusicOnly', 'music_only_v3')]:
    run(['ffmpeg', '-v', 'error', '-y', '-i', RAW, '-i', f'{ST}/{stem}.wav', *MUX, f'{X}/FGW_EarthStops_V3_{out}_1080x1920.mp4'])
run(['ffmpeg', '-v', 'error', '-y', '-i', f'{X}/FGW_EarthStops_V3_Review_1080x1920.mp4', '-vf', "scale=540:960:flags=lanczos,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='V3 REVIEW PREVIEW 540x960 - not final - unpublished':fontcolor=white:fontsize=15:box=1:boxcolor=black@0.6:boxborderw=4:x=(w-text_w)/2:y=h-30", '-c:v', 'libx264', '-crf', '26', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-movflags', '+faststart', f'{X}/FGW_EarthStops_V3_Review_Preview_540x960_labeled.mp4'])
os.makedirs(f'{X}/stems', exist_ok=True)
for nm in ('voice_only_v3', 'sfx_only_v3', 'music_only_v3', 'mix_v3', 'mix_v3_nomusic'): shutil.copyfile(f'{ST}/{nm}.wav', f'{X}/stems/FGW_EarthStops_{nm}_48k.wav')
shutil.copyfile(f'{ST}/voice_only_v3.wav', f'{X}/FGW_EarthStops_V3_VoiceOnly_48k.wav')
run(['ffmpeg', '-v', 'error', '-y', '-i', f'{ST}/voice_only_v3.wav', '-c:a', 'libmp3lame', '-b:a', '192k', '-ar', '48000', f'{X}/FGW_EarthStops_V3_VoiceOnly_48k.mp3'])
shutil.copyfile(f'{ROOT}/script/SCRIPT.md', f'{X}/FGW_EarthStops_V3_Script.md')

files = sorted(f for f in os.listdir(X) if f.endswith(('.mp4', '.wav', '.mp3')))
files += sorted('stems/' + f for f in os.listdir(f'{X}/stems'))
meta = {}
for f in files:
    p = f'{X}/{f}'
    pr = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_format', '-show_streams', '-of', 'json', p], capture_output=True, text=True, check=True).stdout)
    m = {'path': f'exports/v6/{f}', 'bytes': os.path.getsize(p), 'sha256': hashlib.sha256(open(p, 'rb').read()).hexdigest(), 'ffprobe': pr}
    if f.endswith('.mp4'):
        m['video_frames_counted'] = int(subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0', '-show_entries', 'stream=nb_read_frames', '-of', 'csv=p=0', p], capture_output=True, text=True, check=True).stdout.strip())
    meta[f] = m
json.dump(meta, open(f'{X}/EXPORT_METADATA.json', 'w'), indent=1)
L = ['# V3 export metadata', '', 'Source of truth: `EXPORT_METADATA.json` (verbatim `ffprobe -show_format -show_streams -of json`, size, sha256, counted frames). Summary:', '', '| file | bytes | sha256 | video | audio | duration |', '|---|---:|---|---|---|---|']
for f, m in meta.items():
    v = next((s for s in m['ffprobe']['streams'] if s['codec_type'] == 'video'), None)
    a = next((s for s in m['ffprobe']['streams'] if s['codec_type'] == 'audio'), None)
    vs = f"{v['codec_name']} {v['profile']} {v['width']}x{v['height']} {v['r_frame_rate']} fps {v['pix_fmt']} {v.get('color_space')} {m['video_frames_counted']} frames" if v else '-'
    au = f"{a['codec_name']} {a['sample_rate']} Hz {a['channels']} ch, {int(a.get('bit_rate', 0)) // 1000} kb/s" if a else 'none (no audio track)'
    L.append(f"| `{f}` | {m['bytes']} | `{m['sha256']}` | {vs} | {au} | {float(m['ffprobe']['format']['duration']):.3f} s |")
L += ['', '## Exact commands', '', '```bash',
      '# picture (from source/): headless-shell build of Chromium, Remotion 4.0.533',
      'F="--browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell --crf=16 --x264-preset=slow --color-space=bt709 --concurrency=4 --muted"',
      'npx remotion render src/index.ts FilmV3 ../qa/v6/render/FilmV3_silent_raw.mp4 $F',
      '# audio (from the episode root): narration = audio/v6/voice/voice_v3_timeline.wav (Test Voice take B, cut only at its own pauses)',
      'node tools/build_cues_v3.mjs && python3 tools/build_audio_v3.py   # -> audio/v6/v3/stems/{mix_v3,mix_v3_nomusic,voice_only_v3,sfx_only_v3,music_only_v3}.wav',
      '# the files below (python3 tools/export_v3.py runs exactly these):', *cmds, '```', '',
      'The Review, ReviewNoMusic, VoiceOnly, SFXOnly and MusicOnly mp4s carry the identical picture bytes as the Silent file (stream copy); the labeled 540x960 preview is a re-encode of the Review file (crf 26, burned label) for quick viewing only. The Silent file has no audio stream. Loudness, sync and motion figures: `qa/v6/QA_V3.json`. Nobody has watched these in real time or listened to them (see `QA_NOTES_V3.md`).']
open(f'{X}/EXPORT_METADATA.md', 'w').write('\n'.join(L) + '\n')
print('\n'.join(L[:14]))
