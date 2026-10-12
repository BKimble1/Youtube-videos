# v3 (hook H1) export metadata

Source of truth: `EXPORT_METADATA.json` (verbatim `ffprobe -show_format -show_streams -of json`, size, sha256, counted frames). Summary:

| file | bytes | sha256 | video | audio | duration |
|---|---:|---|---|---|---|
| `FGW_EarthStops_Hook_H1_SFXOnly_1080x1920.mp4` | 5458977 | `46e549f2f810d25783b0e565a576ac8ba75b5fb2d6fc272adc28147738072fe0` | h264 High 1080x1920 30/1 fps yuv420p tv/bt709/bt709/bt709 180 frames, 7028 kb/s | aac 48000 Hz 2 ch, 238 kb/s, 6.000000 s | 6.0000 s |
| `FGW_EarthStops_Hook_H1_Silent_1080x1920.mp4` | 5274523 | `b00d13d6f50cc1e4721de3b7e3cdfffb1a017df77de93742c7b5725c9afda1b0` | h264 High 1080x1920 30/1 fps yuv420p tv/bt709/bt709/bt709 180 frames, 7028 kb/s | none (no audio track) | 6.0000 s |
| `FGW_EarthStops_Hook_H1_Silent_Clean_1080x1920.mp4` | 5113052 | `f5b79c32fd5b64b125311ebec31983b9422c65498f04b999820713718f4b754c` | h264 High 1080x1920 30/1 fps yuv420p tv/bt709/bt709/bt709 180 frames, 6813 kb/s | none (no audio track) | 6.0000 s |
| `FGW_EarthStops_Hook_H1_VoiceOnly_1080x1920.mp4` | 5471526 | `2ed8c0092cdd9b2747a27bd4c7e6efee4ebcea1b5d9831ade1e08eb444766173` | h264 High 1080x1920 30/1 fps yuv420p tv/bt709/bt709/bt709 180 frames, 7028 kb/s | aac 48000 Hz 2 ch, 255 kb/s, 6.000000 s | 6.0000 s |
| `FGW_EarthStops_Hook_H1_VoiceSFX_1080x1920.mp4` | 5476388 | `db66849b9e667422ea02577fbe81736e57a3951f6f7449ce0b4ec56fdd0cfa08` | h264 High 1080x1920 30/1 fps yuv420p tv/bt709/bt709/bt709 180 frames, 7028 kb/s | aac 48000 Hz 2 ch, 261 kb/s, 6.000000 s | 6.0000 s |

## Exact commands

```bash
# picture (from source/): headless-shell build of Chromium, Remotion 4.0.533
F="--browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell --crf=16 --x264-preset=slow --color-space=bt709 --concurrency=4 --muted"
npx remotion render src/index.ts HookH1 ../exports/v3/FGW_EarthStops_Hook_H1_Silent_1080x1920.mp4 $F
npx remotion render src/index.ts HookH1-Clean ../exports/v3/FGW_EarthStops_Hook_H1_Silent_Clean_1080x1920.mp4 $F   # no captions, tags or graphics at all
# audio (from the episode root); narration = audio/v3/voice/narration_opening_48k.wav (Test Voice take B, unmodified)
node tools/build_cues_h1.mjs && python3 tools/build_audio_h1.py   # -> audio/v3/h1/stems/{mix_h1,voice_only_h1,sfx_only_h1}.wav
# mux: picture stream copied, audio AAC 320k @ 48 kHz
ffmpeg -y -i exports/v3/FGW_EarthStops_Hook_H1_Silent_1080x1920.mp4 -i audio/v3/h1/stems/mix_h1.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart exports/v3/FGW_EarthStops_Hook_H1_VoiceSFX_1080x1920.mp4
ffmpeg -y -i exports/v3/FGW_EarthStops_Hook_H1_Silent_1080x1920.mp4 -i audio/v3/h1/stems/voice_only_h1.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart exports/v3/FGW_EarthStops_Hook_H1_VoiceOnly_1080x1920.mp4
ffmpeg -y -i exports/v3/FGW_EarthStops_Hook_H1_Silent_1080x1920.mp4 -i audio/v3/h1/stems/sfx_only_h1.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart exports/v3/FGW_EarthStops_Hook_H1_SFXOnly_1080x1920.mp4
```

Silent files carry no audio stream. The VoiceSFX, VoiceOnly and SFXOnly files carry the identical picture bytes as the Silent file (stream copy). Loudness and sync figures: `qa/v3/QA_H1.json`. Nobody has watched these in real time or listened to them (see `HOOK_H1_REPORT.md`).
