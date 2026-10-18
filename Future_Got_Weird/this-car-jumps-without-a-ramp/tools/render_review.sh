#!/usr/bin/env bash
# Review copy (1080p, compressed, NOT for upload): the whole cut with the current mix. While the real footage is
# missing, its two windows show the "REAL FOOTAGE PENDING" card, so this file must never be uploaded.
# -> exports/FGW_U9_JumpsWithoutRamp_REVIEW_1080p_not-for-upload.mp4
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=exports/FGW_U9_JumpsWithoutRamp_REVIEW_1080p_not-for-upload.mp4
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
mkdir -p exports
(cd source && npx remotion render src/index.ts Main "$TMP/video.mp4" --muted --props='{"audio":false}' \
  --codec=h264 --crf=21 --x264-preset=medium --pixel-format=yuv420p --color-space=bt709 --concurrency=${CONC:-4})
ffmpeg -v error -y -i "$TMP/video.mp4" -i audio/mix/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy \
  -c:a aac -b:a 192k -ac 2 -ar 48000 -shortest -movflags +faststart "$OUT"
echo "$OUT"
