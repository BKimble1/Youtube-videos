# v2 export metadata

Source of truth: `EXPORT_METADATA.json` (verbatim `ffprobe -show_format -show_streams -of json`, size, sha256, counted frames). Summary:

| file | bytes | sha256 | video | audio | duration |
|---|---:|---|---|---|---|
| `FGW_EarthStops_EA2_Opening_SFX_1080x1920.mp4` | 2096244 | `54cbeadedaa8beb916f60d7cb3e2a72cdd7d397897034f5d8053d9d1326029df` | h264 High 1080x1920 30/1 fps yuv420p tv/bt709/bt709/bt709 75 frames, 6441 kb/s | aac 48000 Hz 2 ch, 250 kb/s, 2.500000 s | 2.5000 s |
| `FGW_EarthStops_EA2_Opening_Silent_1080x1920.mp4` | 2014800 | `2bf5b9b655b93faa3d531709ff6918f690c925fb139637e08730de306f78fc63` | h264 High 1080x1920 30/1 fps yuv420p tv/bt709/bt709/bt709 75 frames, 6441 kb/s | none (no audio track) | 2.5000 s |
| `FGW_EarthStops_EA2_Opening_Silent_NoMarker_1080x1920.mp4` | 2008131 | `76c132ba2778702d5be1278a8a320be7afd7cb38042bca3b856330f1c92db87e` | h264 High 1080x1920 30/1 fps yuv420p tv/bt709/bt709/bt709 75 frames, 6420 kb/s | none (no audio track) | 2.5000 s |
| `FGW_EarthStops_EC1_Opening_SFX_1080x1920.mp4` | 1467714 | `9f8bcc9d3ffbff31161ce0f9a8f34205af191c60d9720b1ab3b98d214905d9f1` | h264 High 1080x1920 30/1 fps yuv420p tv/bt709/bt709/bt709 75 frames, 4433 kb/s | aac 48000 Hz 2 ch, 248 kb/s, 2.500000 s | 2.5000 s |
| `FGW_EarthStops_EC1_Opening_Silent_1080x1920.mp4` | 1387132 | `a8d2490da98fe1582d8ff91ba68e80bc0c6057aeaa5358ad5dd00e8f1bb37e96` | h264 High 1080x1920 30/1 fps yuv420p tv/bt709/bt709/bt709 75 frames, 4433 kb/s | none (no audio track) | 2.5000 s |
| `FGW_EarthStops_EC1_Opening_Silent_NoMarker_1080x1920.mp4` | 1381856 | `be833ee9f85991615bceacfd21d172a1cde3153ef674a221ab9bdde1c11551f3` | h264 High 1080x1920 30/1 fps yuv420p tv/bt709/bt709/bt709 75 frames, 4416 kb/s | none (no audio track) | 2.5000 s |

## Exact commands

```bash
# picture (from source/): headless-shell build of Chromium, Remotion 4.0.533
npx remotion render src/index.ts EA2 ../exports/v2/FGW_EarthStops_EA2_Opening_Silent_1080x1920.mp4 --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell --crf=16 --x264-preset=slow --color-space=bt709 --concurrency=4 --muted
npx remotion render src/index.ts EC1 ../exports/v2/FGW_EarthStops_EC1_Opening_Silent_1080x1920.mp4 <same flags>
npx remotion render src/index.ts EA2-NoMarker ... / EC1-NoMarker ...   # same flags; no WHAT IF tag
# audio (from the episode root)
node tools/build_cues_v2.mjs ea2 && python3 tools/build_audio_v2.py ea2
node tools/build_cues_v2.mjs ec1 && python3 tools/build_audio_v2.py ec1
# mux: picture stream copied, audio AAC 320k @ 48 kHz
ffmpeg -y -i exports/v2/FGW_EarthStops_EA2_Opening_Silent_1080x1920.mp4 -i audio/v2/ea2/stems/effects_ea2.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart exports/v2/FGW_EarthStops_EA2_Opening_SFX_1080x1920.mp4
ffmpeg -y -i exports/v2/FGW_EarthStops_EC1_Opening_Silent_1080x1920.mp4 -i audio/v2/ec1/stems/effects_ec1.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart exports/v2/FGW_EarthStops_EC1_Opening_SFX_1080x1920.mp4
```

Silent files carry no audio stream. The SFX files carry the identical picture bytes (stream copy). Loudness figures are in `qa/v2/AUDIO_MEASUREMENTS_V2.json`.
