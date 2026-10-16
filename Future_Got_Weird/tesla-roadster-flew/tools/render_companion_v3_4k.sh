#!/usr/bin/env bash
# 4K master of companion v3: the same Companion3 composition drawn natively at 3840x2160 (Remotion --scale=2, so the
# vector art is re-rendered, not upscaled; the stream footage is scaled up from its recorded size). The soundtrack is
# copied unchanged from the finished 1080p export (already -15 LUFS / -1.5 dBTP), so run render_companion_v3.sh first.
# -> exports/FGW_Roadster_Companion_REVIEW_v3_4K.mp4
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=exports/FGW_Roadster_Companion_REVIEW_v3.mp4
RAW=exports/FGW_Roadster_Companion_REVIEW_v3_4K_raw.mp4
OUT=exports/FGW_Roadster_Companion_REVIEW_v3_4K.mp4
[[ -f $SRC ]] || { echo "missing $SRC: run tools/render_companion_v3.sh first"; exit 1; }
(cd source && npx remotion render src/index.ts Companion3 "../$RAW" --scale=2 --muted --props='{"audio":false}' --crf=17 --x264-preset=medium --color-space=bt709 --concurrency=${CONC:-3})
ffmpeg -v error -y -i "$RAW" -i "$SRC" -map 0:v -map 1:a -c copy -movflags +faststart "$OUT"
rm -f "$RAW"
echo "$OUT"
