#!/bin/bash
# Render one hook preview with the round's fixed settings: 1080x1920, 30 fps, 180 frames (6.000 s), lossless PNG frame
# capture, H.264 High (CRF 16, preset slow, yuv420p, BT.709), AAC 320 kb/s from the hook's mix.
# usage: tools/render.sh <NN> [out.mp4]
set -e
H=$1; ROOT=$(cd "$(dirname "$0")/.." && pwd)
SLUG=$(python3 -c "import json;print(json.load(open('$ROOT/production/LINES.json'))['$H']['slug'])")
OUT=$(realpath -m ${2:-$ROOT/exports/FGW_HOOK_${H}_${SLUG}.mp4})
cd $ROOT/source
test -f public/audio/h${H}_mix.wav || { echo "missing public/audio/h${H}_mix.wav (run tools/audio/h${H}.py)"; exit 1; }
npx remotion render src/h$H/index.ts H$H $OUT --props='{"audio":"mix","captions":true}' --image-format=png --codec=h264 \
  --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k \
  --concurrency=${CONC:-3} --log=error
echo $OUT
