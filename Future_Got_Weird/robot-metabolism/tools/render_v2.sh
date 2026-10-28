#!/bin/sh
# V2: cues -> mix -> review render (video muted from the vector source, the PCM mix encoded once to AAC).
# usage: sh tools/render_v2.sh [review|master|clean]
set -e
EP=$(cd "$(dirname "$0")/.." && pwd)
TMP=${TMPDIR:-/tmp}/fgw_rm2; mkdir -p "$TMP"
cd "$EP"
source/node_modules/.bin/esbuild tools/export_cues_v2.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile="$TMP/ec2.cjs" --log-level=warning
node "$TMP/ec2.cjs" audio/cues_v2.json
python3 tools/make_audio_v2.py
MIX=audio/mix/FGW_Robot_Metabolism_V2_mix.wav
r() { # name captions scale crf out
  (cd source && npx remotion render src/index.ts RobotMetabolismV2 "$TMP/$1.mp4" --props="{\"audio\":\"\",\"captions\":$2,\"v\":2}" --muted --scale=$3 \
    --image-format=png --crf=$4 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --concurrency=4 --log=error)
  ffmpeg -v error -y -i "$TMP/$1.mp4" -i "$MIX" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "$5"
  echo "wrote $5"
}
W=${1:-review}
[ "$W" = review ] && r review true 1 16 exports/FGW_Robot_Metabolism_V2_REVIEW_1080x1920.mp4
[ "$W" = clean ] && r clean false 1 16 exports/FGW_Robot_Metabolism_V2_CLEAN_1080x1920.mp4
[ "$W" = master ] && r master true 2 17 exports/FGW_Robot_Metabolism_V2_MASTER_2160x3840.mp4
exit 0
