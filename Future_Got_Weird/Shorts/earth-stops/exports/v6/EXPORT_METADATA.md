# V3 export metadata

Source of truth: `EXPORT_METADATA.json` (verbatim `ffprobe -show_format -show_streams -of json`, size, sha256, counted frames). Summary:

| file | bytes | sha256 | video | audio | duration |
|---|---:|---|---|---|---|
| `FGW_EarthStops_V3_MusicOnly_1080x1920.mp4` | 16628577 | `68a352bfc291a2cd465fef4ba72d2ed67a85577980be45a82b233d2013139d10` | h264 High 1080x1920 30/1 fps yuv420p bt709 744 frames | aac 48000 Hz 2 ch, 51 kb/s | 24.800 s |
| `FGW_EarthStops_V3_ReviewNoMusic_1080x1920.mp4` | 17256304 | `33711d49aa4ec110d936951abaf25200ce45deaf579491f2f396654a640d9570` | h264 High 1080x1920 30/1 fps yuv420p bt709 744 frames | aac 48000 Hz 2 ch, 253 kb/s | 24.800 s |
| `FGW_EarthStops_V3_Review_1080x1920.mp4` | 17256393 | `a9deb8c731221ccb0872448cedfdedc1e51dab684804e458e92e659d4821eb71` | h264 High 1080x1920 30/1 fps yuv420p bt709 744 frames | aac 48000 Hz 2 ch, 253 kb/s | 24.800 s |
| `FGW_EarthStops_V3_Review_Preview_540x960_labeled.mp4` | 2620206 | `6804951594f3b044a59fa2fb2c6b836f4447a11aba6f633f582b457eb75350b6` | h264 High 540x960 30/1 fps yuv420p bt709 744 frames | aac 48000 Hz 2 ch, 127 kb/s | 24.810 s |
| `FGW_EarthStops_V3_SFXOnly_1080x1920.mp4` | 17209682 | `7b65baf662852e54749950d3636c3cee2a40dd53fa8b9fc0a34f82142cb9349f` | h264 High 1080x1920 30/1 fps yuv420p bt709 744 frames | aac 48000 Hz 2 ch, 238 kb/s | 24.800 s |
| `FGW_EarthStops_V3_Silent_1080x1920.mp4` | 16451382 | `1144d2b4b91f71e0fe7e2b90249b1d50a6d9322afebe9a9d4512d445ab4b551f` | h264 High 1080x1920 30/1 fps yuv420p bt709 744 frames | none (no audio track) | 24.800 s |
| `FGW_EarthStops_V3_VoiceOnly_1080x1920.mp4` | 17039515 | `7b33326c5f8635bc04affc14db469dca41eff0715195be65a26d2cb7f14c7594` | h264 High 1080x1920 30/1 fps yuv420p bt709 744 frames | aac 48000 Hz 2 ch, 183 kb/s | 24.800 s |
| `FGW_EarthStops_V3_VoiceOnly_48k.mp3` | 596781 | `93f545f2296fd0460f5a480f0f8c77292445153472d73a59187bf4a152346e3c` | - | mp3 48000 Hz 2 ch, 192 kb/s | 24.840 s |
| `FGW_EarthStops_V3_VoiceOnly_48k.wav` | 4761644 | `40deaf771f17c2b379b071e051fc9d508e0671e39039cd675ad506503b3a4ada` | - | pcm_s16le 48000 Hz 2 ch, 1536 kb/s | 24.800 s |
| `stems/FGW_EarthStops_mix_v3_48k.wav` | 4761644 | `8dc6d3d105a1c3ed5f416d693cd1f50d7eb511ec0778f19f4945b820b9523d8f` | - | pcm_s16le 48000 Hz 2 ch, 1536 kb/s | 24.800 s |
| `stems/FGW_EarthStops_mix_v3_nomusic_48k.wav` | 4761644 | `196efcc1a522f1c17a0776591a2cd5fa6f9933f155179efa8dcb0f9e0614e94f` | - | pcm_s16le 48000 Hz 2 ch, 1536 kb/s | 24.800 s |
| `stems/FGW_EarthStops_music_only_v3_48k.wav` | 4761644 | `dd2a76da39ef175fb4750493b32b038afe0802e2c875f98098d1f0e117b07753` | - | pcm_s16le 48000 Hz 2 ch, 1536 kb/s | 24.800 s |
| `stems/FGW_EarthStops_sfx_only_v3_48k.wav` | 4761644 | `eb36546816bffc6ce329e0f2d0b841f32f22082ce93b815106908c6dd48fe2ac` | - | pcm_s16le 48000 Hz 2 ch, 1536 kb/s | 24.800 s |
| `stems/FGW_EarthStops_voice_only_v3_48k.wav` | 4761644 | `40deaf771f17c2b379b071e051fc9d508e0671e39039cd675ad506503b3a4ada` | - | pcm_s16le 48000 Hz 2 ch, 1536 kb/s | 24.800 s |

## Exact commands

```bash
# picture (from source/): headless-shell build of Chromium, Remotion 4.0.533
F="--browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell --crf=16 --x264-preset=slow --color-space=bt709 --concurrency=4 --muted"
npx remotion render src/index.ts FilmV3 ../qa/v6/render/FilmV3_silent_raw.mp4 $F
# audio (from the episode root): narration = audio/v6/voice/voice_v3_timeline.wav (Test Voice take B, cut only at its own pauses)
node tools/build_cues_v3.mjs && python3 tools/build_audio_v3.py   # -> audio/v6/v3/stems/{mix_v3,mix_v3_nomusic,voice_only_v3,sfx_only_v3,music_only_v3}.wav
# the files below (python3 tools/export_v3.py runs exactly these):
ffmpeg -v error -y -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/qa/v6/render/FilmV3_silent_raw.mp4 -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/audio/v6/v3/stems/mix_v3.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v6/FGW_EarthStops_V3_Review_1080x1920.mp4
ffmpeg -v error -y -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/qa/v6/render/FilmV3_silent_raw.mp4 -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/audio/v6/v3/stems/mix_v3_nomusic.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v6/FGW_EarthStops_V3_ReviewNoMusic_1080x1920.mp4
ffmpeg -v error -y -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/qa/v6/render/FilmV3_silent_raw.mp4 -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/audio/v6/v3/stems/voice_only_v3.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v6/FGW_EarthStops_V3_VoiceOnly_1080x1920.mp4
ffmpeg -v error -y -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/qa/v6/render/FilmV3_silent_raw.mp4 -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/audio/v6/v3/stems/sfx_only_v3.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v6/FGW_EarthStops_V3_SFXOnly_1080x1920.mp4
ffmpeg -v error -y -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/qa/v6/render/FilmV3_silent_raw.mp4 -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/audio/v6/v3/stems/music_only_v3.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v6/FGW_EarthStops_V3_MusicOnly_1080x1920.mp4
ffmpeg -v error -y -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v6/FGW_EarthStops_V3_Review_1080x1920.mp4 -vf scale=540:960:flags=lanczos,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='V3 REVIEW PREVIEW 540x960 - not final - unpublished':fontcolor=white:fontsize=15:box=1:boxcolor=black@0.6:boxborderw=4:x=(w-text_w)/2:y=h-30 -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -c:a aac -b:a 128k -ar 48000 -movflags +faststart /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v6/FGW_EarthStops_V3_Review_Preview_540x960_labeled.mp4
ffmpeg -v error -y -i /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/audio/v6/v3/stems/voice_only_v3.wav -c:a libmp3lame -b:a 192k -ar 48000 /home/user/Youtube-videos/Future_Got_Weird/Shorts/earth-stops/exports/v6/FGW_EarthStops_V3_VoiceOnly_48k.mp3
```

The Review, ReviewNoMusic, VoiceOnly, SFXOnly and MusicOnly mp4s carry the identical picture bytes as the Silent file (stream copy); the labeled 540x960 preview is a re-encode of the Review file (crf 26, burned label) for quick viewing only. The Silent file has no audio stream. Loudness, sync and motion figures: `qa/v6/QA_V3.json`. Nobody has watched these in real time or listened to them (see `QA_NOTES_V3.md`).
