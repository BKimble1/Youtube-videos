#!/usr/bin/env bash
# Render the V4 1080p review in chunks (a single long render crashed the browser in V1), then join with the mix.
set -euo pipefail
cd "$(dirname "$0")/../source"
OUT=../exports/v4parts
mkdir -p "$OUT"
TOTAL=$(node -e "const n=require('./src/v4/data/narr.json');console.log(Math.ceil((n.duration+2.0)*30))")
STEP=2600
i=0; parts=()
for ((s=0; s<TOTAL; s+=STEP)); do
  e=$((s+STEP-1)); ((e>=TOTAL)) && e=$((TOTAL-1))
  f="$OUT/part_$i.mp4"
  if [[ ! -s "$f" || "${FORCE:-0}" == 1 ]]; then
    npx remotion render src/index.ts MainV4 "$f" --frames=$s-$e --props='{"audio":false}' --crf=17 --x264-preset=medium --color-space=bt709 --concurrency=4 --log=error
  fi
  parts+=("$f"); i=$((i+1))
done
printf "file '%s'\n" "${parts[@]##*/}" > "$OUT/list.txt"
(cd "$OUT" && ffmpeg -v error -y -f concat -safe 0 -i list.txt -c copy video_only.mp4)
ffmpeg -v error -y -i "$OUT/video_only.mp4" -i public/audio/v4/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart ../exports/FGW_Starship_Dual_Catch_V4_REVIEW_1080p.mp4
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,duration -of compact ../exports/FGW_Starship_Dual_Catch_V4_REVIEW_1080p.mp4
