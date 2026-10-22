#!/usr/bin/env bash
# Render V5 from the composition in chunks (a single long render crashed the browser in V1), then join with the mix.
#   tools/v5_render.sh            → exports/FGW_Starship_Dual_Catch_V5_FINAL_REVIEW_1080p.mp4
#   SCALE=2 tools/v5_render.sh    → exports/FGW_Starship_Dual_Catch_V5_PUBLISH_MASTER_4K.mp4 (3840×2160, rendered at 2×, not upscaled)
# Delete exports/v5parts*/part_N.mp4 to re-render only that chunk.
set -euo pipefail
cd "$(dirname "$0")/../source"
SCALE=${SCALE:-1}
if [[ "$SCALE" == 2 ]]; then OUT=../exports/v5parts4k; NAME=FGW_Starship_Dual_Catch_V5_PUBLISH_MASTER_4K.mp4; Q="--crf=14 --x264-preset=slow"; else OUT=../exports/v5parts; NAME=FGW_Starship_Dual_Catch_V5_FINAL_REVIEW_1080p.mp4; Q="--crf=17 --x264-preset=medium"; fi
mkdir -p "$OUT"
# FILM_END as in src/v5/time.ts: S9_04 end + 1.5 + 15
TOTAL=$(node -e "const n=require('./src/v5/data/narr.json');const l=n.lines.find(x=>x.id==='S9_04');console.log(Math.round((l.e+16.5)*30))")
STEP=${STEP:-2600}
i=0; parts=()
for ((s=0; s<TOTAL; s+=STEP)); do
  e=$((s+STEP-1)); ((e>=TOTAL)) && e=$((TOTAL-1))
  f="$OUT/part_$i.mp4"
  if [[ ! -s "$f" || "${FORCE:-0}" == 1 ]]; then
    npx remotion render src/index.ts MainV5 "$f" --frames=$s-$e --props='{"audio":false}' --scale=$SCALE $Q --color-space=bt709 --concurrency=${CONC:-4} --log=error
  fi
  parts+=("$f"); i=$((i+1))
done
printf "file '%s'\n" "${parts[@]##*/}" > "$OUT/list.txt"
(cd "$OUT" && ffmpeg -v error -y -f concat -safe 0 -i list.txt -c copy video_only.mp4)
ffmpeg -v error -y -i "$OUT/video_only.mp4" -i public/audio/v5/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "../exports/$NAME"
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,duration -of compact "../exports/$NAME"
