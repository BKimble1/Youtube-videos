#!/bin/bash
# Render Liquid Metal Robot V1 with fixed settings: 1080x1920, 30 fps, lossless PNG frame capture, H.264 High
# (CRF 16, preset slow, yuv420p, BT.709), AAC 320 kb/s from source/public/audio/mix_v1.wav.
# usage: tools/render.sh [out.mp4]
set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd)
OUT=$(realpath -m ${1:-$ROOT/exports/FGW_Liquid_Metal_Robot_V1_REVIEW_1080x1920.mp4})
cd $ROOT/source
test -f public/audio/mix_v1.wav || { echo "missing public/audio/mix_v1.wav (run tools/audio/mix_v1.py)"; exit 1; }
npx remotion render src/v1/index.ts LiquidMetalRobotV1 $OUT --props='{"audio":"mix_v1","captions":true}' --image-format=png --codec=h264 \
  --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k \
  --concurrency=${CONC:-3} --log=error
echo $OUT
