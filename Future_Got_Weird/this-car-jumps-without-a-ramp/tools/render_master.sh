#!/usr/bin/env bash
# Final master: composition Main rendered natively at 3840x2160, 30 fps (Remotion --scale=2: the vector art and text are
# drawn at 4K; the real BYD clips are used at the resolution they were supplied in, cropped and upscaled — see
# footage/README.md). Video: H.264 High, CRF 14, preset slow, yuv420p, BT.709.
# Audio: audio/mix/mix.wav (already -15 LUFS / -1.5 dBTP), AAC-LC 320 kb/s, 48 kHz stereo, muxed once.
# The narration (audio/narration/*) is the approved recording and is never regenerated here.
# -> exports/FGW_U9_FINAL_4K.mp4
# Needs the local clips in source/public/footage (python3 tools/ingest_footage.py cut && python3 tools/ingest_footage.py cut2).
set -euo pipefail
cd "$(dirname "$0")/.."
for f in real_open real_replay real_jump real_pit real_corner real_drive; do
  [[ -f source/public/footage/$f.mp4 ]] || { echo "missing source/public/footage/$f.mp4 (tools/ingest_footage.py cut / cut2)"; exit 1; }
done
(cd source && node ../tools/export_events.mjs)
python3 tools/make_bed.py
python3 tools/mix.py
python3 tools/speech_mask.py > /dev/null
OUT=exports/FGW_U9_FINAL_4K.mp4
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
mkdir -p exports
(cd source && npx remotion render src/index.ts Main "$TMP/video.mp4" --scale=2 --muted --props='{"audio":false}' \
  --codec=h264 --crf=14 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --concurrency=${CONC:-4})
ffmpeg -v error -y -i "$TMP/video.mp4" -i audio/mix/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy \
  -c:a aac -b:a 320k -ac 2 -ar 48000 -shortest -movflags +faststart "$OUT"
sha256sum "$OUT" | tee exports/FGW_U9_FINAL_4K.sha256
