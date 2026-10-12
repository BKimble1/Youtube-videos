# V5 export metadata

Source of truth: `EXPORT_METADATA.json` (verbatim `ffprobe -show_format -show_streams -of json`, size, sha256, counted frames). Summary:

| file | bytes | sha256 | video | audio | duration |
|---|---:|---|---|---|---|
| `FGW_EarthStops_V5_MusicOnly_1080x1920.mp4` | 14170973 | `2312311dd22aa467b04b56502c88cf05f99b4bd74d93fdfa27fec72448ea42c2` | h264 High 1080x1920 30/1 fps yuv420p bt709 615 frames | aac 48000 Hz 2 ch, 69 kb/s | 20.500 s |
| `FGW_EarthStops_V5_ReviewNoMusic_1080x1920.mp4` | 14651166 | `a114aefd3de58b8e54cbc2c0c5c470d80131ca7016872dfe59b2f6d959583715` | h264 High 1080x1920 30/1 fps yuv420p bt709 615 frames | aac 48000 Hz 2 ch, 256 kb/s | 20.500 s |
| `FGW_EarthStops_V5_Review_1080x1920.mp4` | 14651204 | `c5d0cc43affe899a7450b669df7379f17b10782249c68e0fc9a4036ce3aa9ef6` | h264 High 1080x1920 30/1 fps yuv420p bt709 615 frames | aac 48000 Hz 2 ch, 256 kb/s | 20.500 s |
| `FGW_EarthStops_V5_Review_Preview_540x960_labeled.mp4` | 2247262 | `0349729479c7acaf52da96b35ad6b4a94b7ba8d08fd1a9f50dc9ed22f0b9d505` | h264 High 540x960 30/1 fps yuv420p bt709 615 frames | aac 48000 Hz 2 ch, 127 kb/s | 20.501 s |
| `FGW_EarthStops_V5_SFXOnly_1080x1920.mp4` | 14609252 | `009cb2729ebfc1a24903488d144d2abcf34add3045051438ec87e0535817ed7e` | h264 High 1080x1920 30/1 fps yuv420p bt709 615 frames | aac 48000 Hz 2 ch, 239 kb/s | 20.500 s |
| `FGW_EarthStops_V5_Silent_1080x1920.mp4` | 13978384 | `fe3e411bcfd31d172287ac11872383be127cb41f14bcfa9838ffbf63c3ea65d0` | h264 High 1080x1920 30/1 fps yuv420p bt709 615 frames | none (no audio track) | 20.500 s |
| `FGW_EarthStops_V5_VoiceOnly_1080x1920.mp4` | 14640848 | `b2c583a341e2c94ac2436203783020cd9fa735d697039054ec11e241a6dc4453` | h264 High 1080x1920 30/1 fps yuv420p bt709 615 frames | aac 48000 Hz 2 ch, 252 kb/s | 20.500 s |
| `FGW_EarthStops_V5_VoiceOnly_48k.mp3` | 493677 | `5a3df0fd2ef55762ced336e4ebb0cebb9c42421a53e45c9f29f285975f6962fa` | - | mp3 48000 Hz 2 ch, 192 kb/s | 20.544 s |
| `FGW_EarthStops_V5_VoiceOnly_48k.wav` | 3936044 | `8a723c7e6f2dbe860be906b23d0d27f2de1fb59d8b9a5fd3201f0d5da149ef4b` | - | pcm_s16le 48000 Hz 2 ch, 1536 kb/s | 20.500 s |
| `stems/FGW_EarthStops_mix_v5_48k.wav` | 3936044 | `f7cd45fa553dabf7532733ce74553d73e5f4ac2f9caad0a91917aff45c94d0ec` | - | pcm_s16le 48000 Hz 2 ch, 1536 kb/s | 20.500 s |
| `stems/FGW_EarthStops_mix_v5_nomusic_48k.wav` | 3936044 | `15b0c728849c7196b82eeb7fbd29d17cc71c4ba24baae2a85700400ac31c31a7` | - | pcm_s16le 48000 Hz 2 ch, 1536 kb/s | 20.500 s |
| `stems/FGW_EarthStops_music_only_v5_48k.wav` | 3936044 | `2c9f69e7619d57a9645a3b79d25cab186caa0e36d100d51e46f1a6061ada7112` | - | pcm_s16le 48000 Hz 2 ch, 1536 kb/s | 20.500 s |
| `stems/FGW_EarthStops_sfx_only_v5_48k.wav` | 3936044 | `82f2c2e8775869242b7f097918be61ca3761a54bbb26a60e62ad7ef7cad39fee` | - | pcm_s16le 48000 Hz 2 ch, 1536 kb/s | 20.500 s |
| `stems/FGW_EarthStops_voice_only_v5_48k.wav` | 3936044 | `8a723c7e6f2dbe860be906b23d0d27f2de1fb59d8b9a5fd3201f0d5da149ef4b` | - | pcm_s16le 48000 Hz 2 ch, 1536 kb/s | 20.500 s |

## Exact commands

```bash
# picture (from source/): headless-shell build of Chromium, Remotion 4.0.533
F="--browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell --crf=16 --x264-preset=slow --color-space=bt709 --concurrency=4 --muted"
npx remotion render src/index.ts FilmV5 ../qa/v8/render/FilmV5_silent_raw.mp4 $F
# audio (from the episode root): narration = audio/v7/voice/voice_v4_timeline.wav (Test Voice take A, only silence removed from its own pauses; the V5 narration is the V4 narration)
node tools/build_cues_v5.mjs && python3 tools/build_audio_v5.py   # -> audio/v8/v5/stems/{mix_v5,mix_v5_nomusic,voice_only_v5,sfx_only_v5,music_only_v5}.wav
# the files below (python3 tools/export_v5.py runs exactly these):
ffmpeg -v error -y -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/qa/v8/render/FilmV5_silent_raw.mp4 -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/audio/v8/v5/stems/mix_v5.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v8/FGW_EarthStops_V5_Review_1080x1920.mp4
ffmpeg -v error -y -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/qa/v8/render/FilmV5_silent_raw.mp4 -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/audio/v8/v5/stems/mix_v5_nomusic.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v8/FGW_EarthStops_V5_ReviewNoMusic_1080x1920.mp4
ffmpeg -v error -y -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/qa/v8/render/FilmV5_silent_raw.mp4 -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/audio/v8/v5/stems/voice_only_v5.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v8/FGW_EarthStops_V5_VoiceOnly_1080x1920.mp4
ffmpeg -v error -y -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/qa/v8/render/FilmV5_silent_raw.mp4 -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/audio/v8/v5/stems/sfx_only_v5.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v8/FGW_EarthStops_V5_SFXOnly_1080x1920.mp4
ffmpeg -v error -y -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/qa/v8/render/FilmV5_silent_raw.mp4 -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/audio/v8/v5/stems/music_only_v5.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v8/FGW_EarthStops_V5_MusicOnly_1080x1920.mp4
ffmpeg -v error -y -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v8/FGW_EarthStops_V5_Review_1080x1920.mp4 -vf scale=540:960:flags=lanczos,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='V5 REVIEW PREVIEW 540x960 - not final - unpublished':fontcolor=white:fontsize=15:box=1:boxcolor=black@0.6:boxborderw=4:x=(w-text_w)/2:y=h-30 -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -c:a aac -b:a 128k -ar 48000 -movflags +faststart /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v8/FGW_EarthStops_V5_Review_Preview_540x960_labeled.mp4
ffmpeg -v error -y -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/audio/v8/v5/stems/voice_only_v5.wav -c:a libmp3lame -b:a 192k -ar 48000 /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v8/FGW_EarthStops_V5_VoiceOnly_48k.mp3
```

The Review, ReviewNoMusic, VoiceOnly, SFXOnly and MusicOnly mp4s carry the identical picture bytes as the Silent file (stream copy); the labeled 540x960 preview is a re-encode of the Review file (crf 26, burned label) for quick viewing only. The Silent file has no audio stream. Loudness, sync and motion figures: `qa/v8/QA_V5.json`. Nobody has watched these in real time or listened to them (see `QA_NOTES_V5.md`).
