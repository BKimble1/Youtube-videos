#!/bin/bash
# usage: tools/render.sh <mix_name> <out.mp4>
# Picture as JPEG frames (quality 95), then one x264 encode with the channel settings (CRF 16, slow, yuv420p,
# BT.709) and the mix as AAC 320 kb/s.
set -euo pipefail
MIX=${1:?mix}; OUT=$(realpath -m "${2:?out}")
EP="$(cd "$(dirname "$0")/.." && pwd)"
FR="$EP/source/out/frames"
rm -rf "$FR"; mkdir -p "$FR"
cd "$EP/source"
npx remotion render src/index.ts MouthPadV1 "$FR" --sequence --image-format=jpeg --jpeg-quality=95 --props='{"audio":false}' --concurrency=4 --log=error 2>&1 | grep -v "memory\|CGroup\|meminfo\|Node:\|docker\|lower amount" || true
n=$(ls "$FR"/element-*.jpeg | wc -l); echo "frames: $n"
ffmpeg -v error -y -framerate 30 -i "$FR/element-%03d.jpeg" -i "$EP/source/public/audio/$MIX.wav" \
  -map 0:v -map 1:a -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -movflags +faststart \
  -c:a aac -b:a 320k -ar 48000 -shortest "$OUT"
echo "encoded -> $OUT"
