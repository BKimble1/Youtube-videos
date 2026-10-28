#!/bin/sh
# Rebuild cues and mix, then render the three deliverables from the vector source and mux the PCM mix once (AAC).
#   review 1080x1920 (captions), clean 1080x1920 (no captions), master 2160x3840 (captions, --scale=2: rendered
#   natively at 2x from the vectors, not an upscale).
# usage: sh tools/render.sh [review|clean|master|all]
set -e
EP=$(cd "$(dirname "$0")/.." && pwd)
TMP=${TMPDIR:-/tmp}/fgw_rm; mkdir -p "$TMP"
cd "$EP"
source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile="$TMP/ec.cjs" --log-level=warning
node "$TMP/ec.cjs" audio/cues.json
python3 tools/make_audio.py
MIX=audio/mix/FGW_Robot_Metabolism_V1_mix.wav
r() { # name captions scale crf out
  (cd source && npx remotion render src/index.ts RobotMetabolism "$TMP/$1.mp4" --props="{\"audio\":\"\",\"captions\":$2}" --muted --scale=$3 \
    --image-format=png --crf=$4 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --concurrency=4 --log=error)
  ffmpeg -v error -y -i "$TMP/$1.mp4" -i "$MIX" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "$5"
  echo "wrote $5"
}
W=${1:-all}
[ "$W" = review ] || [ "$W" = all ] && r review true 1 16 exports/FGW_Robot_Metabolism_V1_REVIEW_1080x1920.mp4
[ "$W" = clean ] || [ "$W" = all ] && r clean false 1 16 exports/FGW_Robot_Metabolism_V1_CLEAN_1080x1920.mp4
[ "$W" = master ] || [ "$W" = all ] && r master true 2 17 exports/FGW_Robot_Metabolism_V1_MASTER_2160x3840.mp4
exit 0
