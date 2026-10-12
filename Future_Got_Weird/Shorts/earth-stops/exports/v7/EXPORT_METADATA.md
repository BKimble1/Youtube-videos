# V4 export metadata

Source of truth: `EXPORT_METADATA.json` (verbatim `ffprobe -show_format -show_streams -of json`, size, sha256, counted frames). Summary:

| file | bytes | sha256 | video | audio | duration |
|---|---:|---|---|---|---|
| `FGW_EarthStops_V4_MusicOnly_1080x1920.mp4` | 14011410 | `4317f9710beb4dd0f9341ef95efd4b8be597ccc43b6dbd57880f03246188a23d` | h264 High 1080x1920 30/1 fps yuv420p bt709 615 frames | aac 48000 Hz 2 ch, 69 kb/s | 20.500 s |
| `FGW_EarthStops_V4_ReviewNoMusic_1080x1920.mp4` | 14491475 | `1855c755570af5a9b6fc83e60105cce496b70158692bd663798489615eae782b` | h264 High 1080x1920 30/1 fps yuv420p bt709 615 frames | aac 48000 Hz 2 ch, 256 kb/s | 20.500 s |
| `FGW_EarthStops_V4_Review_1080x1920.mp4` | 14491125 | `3d34b4bd20da7c812e2d0064a67667b06d7b290af1a5612b0503b09c53804093` | h264 High 1080x1920 30/1 fps yuv420p bt709 615 frames | aac 48000 Hz 2 ch, 256 kb/s | 20.500 s |
| `FGW_EarthStops_V4_Review_Preview_540x960_labeled.mp4` | 2213602 | `6c526902956b498a53abe0b332dd114cda9bf709132e6f4ff19e06cc3a702740` | h264 High 540x960 30/1 fps yuv420p bt709 615 frames | aac 48000 Hz 2 ch, 127 kb/s | 20.501 s |
| `FGW_EarthStops_V4_SFXOnly_1080x1920.mp4` | 14450697 | `c1b1da1ec083464bdf04c00d707bb27d882ef8c0119034c1ea27640467e0dbc0` | h264 High 1080x1920 30/1 fps yuv420p bt709 615 frames | aac 48000 Hz 2 ch, 240 kb/s | 20.500 s |
| `FGW_EarthStops_V4_Silent_1080x1920.mp4` | 13818821 | `3f5a614acebcc43d14404d83d8de059a6d70031055f9b39cd28ac554c76bd0fb` | h264 High 1080x1920 30/1 fps yuv420p bt709 615 frames | none (no audio track) | 20.500 s |
| `FGW_EarthStops_V4_VoiceOnly_1080x1920.mp4` | 14481285 | `514989afd7e2fef44cc6bcc59b4f85c28804f254a0f68cc0eb82af3e9a7616e9` | h264 High 1080x1920 30/1 fps yuv420p bt709 615 frames | aac 48000 Hz 2 ch, 252 kb/s | 20.500 s |
| `FGW_EarthStops_V4_VoiceOnly_48k.mp3` | 493677 | `5a3df0fd2ef55762ced336e4ebb0cebb9c42421a53e45c9f29f285975f6962fa` | - | mp3 48000 Hz 2 ch, 192 kb/s | 20.544 s |
| `FGW_EarthStops_V4_VoiceOnly_48k.wav` | 3936044 | `8a723c7e6f2dbe860be906b23d0d27f2de1fb59d8b9a5fd3201f0d5da149ef4b` | - | pcm_s16le 48000 Hz 2 ch, 1536 kb/s | 20.500 s |
| `stems/FGW_EarthStops_mix_v4_48k.wav` | 3936044 | `7865fd5302b82cc0cb1dade49d34726f05e7d26d53480ea0272f4606320a54cc` | - | pcm_s16le 48000 Hz 2 ch, 1536 kb/s | 20.500 s |
| `stems/FGW_EarthStops_mix_v4_nomusic_48k.wav` | 3936044 | `d04acd0dee7aa5df1645555efacc564c5307fda440c4615b6e46e4bbad1a4a66` | - | pcm_s16le 48000 Hz 2 ch, 1536 kb/s | 20.500 s |
| `stems/FGW_EarthStops_music_only_v4_48k.wav` | 3936044 | `2c9f69e7619d57a9645a3b79d25cab186caa0e36d100d51e46f1a6061ada7112` | - | pcm_s16le 48000 Hz 2 ch, 1536 kb/s | 20.500 s |
| `stems/FGW_EarthStops_sfx_only_v4_48k.wav` | 3936044 | `cdd57b7d05215c892ded1d9c55f4d033b80d90f10af3feca46b427ece3b8d6f1` | - | pcm_s16le 48000 Hz 2 ch, 1536 kb/s | 20.500 s |
| `stems/FGW_EarthStops_voice_only_v4_48k.wav` | 3936044 | `8a723c7e6f2dbe860be906b23d0d27f2de1fb59d8b9a5fd3201f0d5da149ef4b` | - | pcm_s16le 48000 Hz 2 ch, 1536 kb/s | 20.500 s |

## Exact commands

```bash
# picture (from source/): headless-shell build of Chromium, Remotion 4.0.533
F="--browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell --crf=16 --x264-preset=slow --color-space=bt709 --concurrency=4 --muted"
npx remotion render src/index.ts FilmV4 ../qa/v7/render/FilmV4_silent_raw.mp4 $F
# audio (from the episode root): narration = audio/v7/voice/voice_v4_timeline.wav (Test Voice take A, only silence removed from its own pauses)
python3 tools/build_voice_v4.py && node tools/build_cues_v4.mjs && python3 tools/build_audio_v4.py   # -> audio/v7/v4/stems/{mix_v4,mix_v4_nomusic,voice_only_v4,sfx_only_v4,music_only_v4}.wav
# the files below (python3 tools/export_v4.py runs exactly these):
ffmpeg -v error -y -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/qa/v7/render/FilmV4_silent_raw.mp4 -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/audio/v7/v4/stems/mix_v4.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v7/FGW_EarthStops_V4_Review_1080x1920.mp4
ffmpeg -v error -y -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/qa/v7/render/FilmV4_silent_raw.mp4 -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/audio/v7/v4/stems/mix_v4_nomusic.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v7/FGW_EarthStops_V4_ReviewNoMusic_1080x1920.mp4
ffmpeg -v error -y -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/qa/v7/render/FilmV4_silent_raw.mp4 -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/audio/v7/v4/stems/voice_only_v4.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v7/FGW_EarthStops_V4_VoiceOnly_1080x1920.mp4
ffmpeg -v error -y -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/qa/v7/render/FilmV4_silent_raw.mp4 -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/audio/v7/v4/stems/sfx_only_v4.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v7/FGW_EarthStops_V4_SFXOnly_1080x1920.mp4
ffmpeg -v error -y -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/qa/v7/render/FilmV4_silent_raw.mp4 -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/audio/v7/v4/stems/music_only_v4.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v7/FGW_EarthStops_V4_MusicOnly_1080x1920.mp4
ffmpeg -v error -y -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v7/FGW_EarthStops_V4_Review_1080x1920.mp4 -vf scale=540:960:flags=lanczos,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='V4 REVIEW PREVIEW 540x960 - not final - unpublished':fontcolor=white:fontsize=15:box=1:boxcolor=black@0.6:boxborderw=4:x=(w-text_w)/2:y=h-30 -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -c:a aac -b:a 128k -ar 48000 -movflags +faststart /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v7/FGW_EarthStops_V4_Review_Preview_540x960_labeled.mp4
ffmpeg -v error -y -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/audio/v7/v4/stems/voice_only_v4.wav -c:a libmp3lame -b:a 192k -ar 48000 /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v7/FGW_EarthStops_V4_VoiceOnly_48k.mp3
```

The Review, ReviewNoMusic, VoiceOnly, SFXOnly and MusicOnly mp4s carry the identical picture bytes as the Silent file (stream copy); the labeled 540x960 preview is a re-encode of the Review file (crf 26, burned label) for quick viewing only. The Silent file has no audio stream. Loudness, sync and motion figures: `qa/v7/QA_V4.json`. Nobody has watched these in real time or listened to them (see `QA_NOTES_V4.md`).
