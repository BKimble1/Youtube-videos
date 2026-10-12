# V1 export metadata

Source of truth: `EXPORT_METADATA.json` (verbatim `ffprobe -show_format -show_streams -of json`, size, sha256, counted frames). Summary:

| file | bytes | sha256 | video | audio | duration |
|---|---:|---|---|---|---|
| `FGW_EarthStops_V1_Review_1080x1920.mp4` | 23091705 | `f1ef8341e489acb4e9fafc61318ee9ec96198b9ceb0e7d92cd7282a7de0583ab` | h264 High 1080x1920 30/1 fps yuv420p bt709 1035 frames | aac 48000 Hz 2 ch, 257 kb/s | 34.500 s |
| `FGW_EarthStops_V1_SFXOnly_1080x1920.mp4` | 22884164 | `f82293efaebe71c438e74b2712c96d8bcf8dafc3c3739ede9898d649145021a9` | h264 High 1080x1920 30/1 fps yuv420p bt709 1035 frames | aac 48000 Hz 2 ch, 209 kb/s | 34.500 s |
| `FGW_EarthStops_V1_Silent_1080x1920.mp4` | 21953966 | `2034d43e68b9dd0b05c7b0c17a49b8dc727dd24053f8a3c2038141b1d926eed1` | h264 High 1080x1920 30/1 fps yuv420p bt709 1035 frames | none (no audio track) | 34.500 s |
| `FGW_EarthStops_V1_VoiceOnly_1080x1920.mp4` | 23072728 | `d80e4953faf131b78bbc6a474306ee4623bb04f25d59d20165958a0bdb3672a4` | h264 High 1080x1920 30/1 fps yuv420p bt709 1035 frames | aac 48000 Hz 2 ch, 253 kb/s | 34.500 s |
| `FGW_EarthStops_V1_VoiceOnly_48k.mp3` | 829485 | `0a3e3a0337d008973df4ba619c894fc92dd33d35dd7bf5983a5d57f884df3261` | - | mp3 48000 Hz 2 ch, 192 kb/s | 34.536 s |
| `FGW_EarthStops_V1_VoiceOnly_48k.wav` | 6624044 | `ca65e731c8a4453525170e2b91aaecf15a85d84f69f9de262bc6a5867b4f2494` | - | pcm_s16le 48000 Hz 2 ch, 1536 kb/s | 34.500 s |

## Exact commands

```bash
# picture (from source/): headless-shell build of Chromium, Remotion 4.0.533
F="--browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell --crf=16 --x264-preset=slow --color-space=bt709 --concurrency=4 --muted"
npx remotion render src/index.ts FilmV1 ../qa/v4/render/FilmV1_silent_raw.mp4 $F
# audio (from the episode root): narration = audio/v4/voice/v1_takeA_48k.wav (Test Voice take A, unmodified)
node tools/build_cues_v1.mjs && python3 tools/build_audio_v1.py   # -> audio/v4/v1/stems/{mix_v1,voice_only_v1,sfx_only_v1}.wav
# the files below (python3 tools/export_v1.py runs exactly these):
ffmpeg -v error -y -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/qa/v4/render/FilmV1_silent_raw.mp4 -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/audio/v4/v1/stems/mix_v1.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v4/FGW_EarthStops_V1_Review_1080x1920.mp4
ffmpeg -v error -y -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/qa/v4/render/FilmV1_silent_raw.mp4 -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/audio/v4/v1/stems/voice_only_v1.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v4/FGW_EarthStops_V1_VoiceOnly_1080x1920.mp4
ffmpeg -v error -y -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/qa/v4/render/FilmV1_silent_raw.mp4 -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/audio/v4/v1/stems/sfx_only_v1.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v4/FGW_EarthStops_V1_SFXOnly_1080x1920.mp4
ffmpeg -v error -y -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/audio/v4/v1/stems/voice_only_v1.wav -c:a libmp3lame -b:a 192k -ar 48000 /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v4/FGW_EarthStops_V1_VoiceOnly_48k.mp3
```

The Review, VoiceOnly and SFXOnly mp4s carry the identical picture bytes as the Silent file (stream copy). The Silent file has no audio stream. Loudness, sync and motion figures: `qa/v4/QA_V1.json`. Nobody has watched these in real time or listened to them (see `QA_NOTES_V1.md`).
