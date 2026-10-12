# V2 export metadata

Source of truth: `EXPORT_METADATA.json` (verbatim `ffprobe -show_format -show_streams -of json`, size, sha256, counted frames). Summary:

| file | bytes | sha256 | video | audio | duration |
|---|---:|---|---|---|---|
| `FGW_EarthStops_V2_MusicOnly_1080x1920.mp4` | 15878881 | `409920361a3de305951fe512ed3f6dee2a2858705179afb8d383779aa18d9e27` | h264 High 1080x1920 30/1 fps yuv420p bt709 760 frames | aac 48000 Hz 2 ch, 41 kb/s | 25.333 s |
| `FGW_EarthStops_V2_ReviewNoMusic_1080x1920.mp4` | 16555241 | `1e7a279fb03ad2484e70cf67538435f947e524054c920cf8ef01c8c9e610b91f` | h264 High 1080x1920 30/1 fps yuv420p bt709 760 frames | aac 48000 Hz 2 ch, 254 kb/s | 25.333 s |
| `FGW_EarthStops_V2_Review_1080x1920.mp4` | 16554846 | `1a02a113dd8c966efb094cc008093d95fa12268e75daa248e6fac9b4eb3b1ca6` | h264 High 1080x1920 30/1 fps yuv420p bt709 760 frames | aac 48000 Hz 2 ch, 254 kb/s | 25.333 s |
| `FGW_EarthStops_V2_SFXOnly_1080x1920.mp4` | 16416376 | `ad156126e509b696e8a47d6daf47b4ab82d3fbaa914d67dbe8e1b68c6b7f15be` | h264 High 1080x1920 30/1 fps yuv420p bt709 760 frames | aac 48000 Hz 2 ch, 210 kb/s | 25.333 s |
| `FGW_EarthStops_V2_Silent_1080x1920.mp4` | 15729677 | `3f67d41d8225c97a01cc6ad6b1f08cae9e77f09a7e07bf6f632d4f8a34d6303e` | h264 High 1080x1920 30/1 fps yuv420p bt709 760 frames | none (no audio track) | 25.333 s |
| `FGW_EarthStops_V2_VoiceOnly_1080x1920.mp4` | 16515126 | `ade33dbd1e22127750ba46cdd7eb2e81a729c5e4f23845cdf9ee4890f83c3f1e` | h264 High 1080x1920 30/1 fps yuv420p bt709 760 frames | aac 48000 Hz 2 ch, 241 kb/s | 25.333 s |
| `FGW_EarthStops_V2_VoiceOnly_48k.mp3` | 609453 | `6eb2a783a427b7f42a114b8f30b99b767070b3788face19a2ddebbc78af96a9e` | - | mp3 48000 Hz 2 ch, 192 kb/s | 25.368 s |
| `FGW_EarthStops_V2_VoiceOnly_48k.wav` | 4864044 | `bdec6ccd6455e25216c53a759f2b2ef351486960f5ba80574bef71aa6c40c69c` | - | pcm_s16le 48000 Hz 2 ch, 1536 kb/s | 25.333 s |
| `stems/FGW_EarthStops_mix_v2_48k.wav` | 4864044 | `ba9a61c485867e645b8ecfdb32274cabe5b4e8dfd4ec87f9813ac04a05980a80` | - | pcm_s16le 48000 Hz 2 ch, 1536 kb/s | 25.333 s |
| `stems/FGW_EarthStops_mix_v2_nomusic_48k.wav` | 4864044 | `58b1c949c8554f401aea58186c73f65ff239aba60ab96c057240c63167486c80` | - | pcm_s16le 48000 Hz 2 ch, 1536 kb/s | 25.333 s |
| `stems/FGW_EarthStops_music_only_v2_48k.wav` | 4864044 | `4e26d864b63fc707815a8ac4d650fa0ccf5183eb29e14722c2ac157573942663` | - | pcm_s16le 48000 Hz 2 ch, 1536 kb/s | 25.333 s |
| `stems/FGW_EarthStops_sfx_only_v2_48k.wav` | 4864044 | `a891d138066ba1a65082bbf4417c2dfecc79be88be86d3907d527034f46a2edc` | - | pcm_s16le 48000 Hz 2 ch, 1536 kb/s | 25.333 s |
| `stems/FGW_EarthStops_voice_only_v2_48k.wav` | 4864044 | `bdec6ccd6455e25216c53a759f2b2ef351486960f5ba80574bef71aa6c40c69c` | - | pcm_s16le 48000 Hz 2 ch, 1536 kb/s | 25.333 s |

## Exact commands

```bash
# picture (from source/): headless-shell build of Chromium, Remotion 4.0.533
F="--browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell --crf=16 --x264-preset=slow --color-space=bt709 --concurrency=4 --muted"
npx remotion render src/index.ts FilmV2 ../qa/v5/render/FilmV2_silent_raw.mp4 $F
# audio (from the episode root): narration = audio/v5/voice/v2_takeB_48k.wav (Test Voice take B, unmodified)
node tools/build_cues_v2.mjs && python3 tools/build_audio_v2.py   # -> audio/v5/v2/stems/{mix_v2,mix_v2_nomusic,voice_only_v2,sfx_only_v2,music_only_v2}.wav
# the files below (python3 tools/export_v2.py runs exactly these):
ffmpeg -v error -y -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/qa/v5/render/FilmV2_silent_raw.mp4 -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/audio/v5/v2/stems/mix_v2.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v5/FGW_EarthStops_V2_Review_1080x1920.mp4
ffmpeg -v error -y -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/qa/v5/render/FilmV2_silent_raw.mp4 -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/audio/v5/v2/stems/mix_v2_nomusic.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v5/FGW_EarthStops_V2_ReviewNoMusic_1080x1920.mp4
ffmpeg -v error -y -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/qa/v5/render/FilmV2_silent_raw.mp4 -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/audio/v5/v2/stems/voice_only_v2.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v5/FGW_EarthStops_V2_VoiceOnly_1080x1920.mp4
ffmpeg -v error -y -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/qa/v5/render/FilmV2_silent_raw.mp4 -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/audio/v5/v2/stems/sfx_only_v2.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v5/FGW_EarthStops_V2_SFXOnly_1080x1920.mp4
ffmpeg -v error -y -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/qa/v5/render/FilmV2_silent_raw.mp4 -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/audio/v5/v2/stems/music_only_v2.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v5/FGW_EarthStops_V2_MusicOnly_1080x1920.mp4
ffmpeg -v error -y -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/audio/v5/v2/stems/voice_only_v2.wav -c:a libmp3lame -b:a 192k -ar 48000 /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v5/FGW_EarthStops_V2_VoiceOnly_48k.mp3
```

The Review, VoiceOnly and SFXOnly mp4s carry the identical picture bytes as the Silent file (stream copy). The Silent file has no audio stream. Loudness, sync and motion figures: `qa/v5/QA_V2.json`. Nobody has watched these in real time or listened to them (see `QA_NOTES_V2.md`).
