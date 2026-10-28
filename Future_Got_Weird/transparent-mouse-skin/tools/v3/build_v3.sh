#!/bin/sh
# V3 end to end, from rendered plates (render_all.sh) to the review MP4.
# usage: build_v3.sh <cache> [workers]
set -e
C=$1; J=${2:-3}; PY=${BLPY:-/tmp/claude-0/bl/bin/python}; D=$(cd "$(dirname "$0")" && pwd); EP=$(cd "$D/../.." && pwd)
[ -f "$C/plume.npy" ] || $PY "$D/plume.py" "$C/plume.npy" 7.99 8.22 24
rm -rf "$C/frames"; $PY "$D/comp_v3.py" "$C" "$C/frames" 0 752 $J
mkdir -p "$EP/source/public/v3"
ffmpeg -v error -y -framerate 30 -i "$C/frames/f%04d.jpg" -c:v libx264 -preset slow -crf 10 -pix_fmt yuv420p -g 15 "$EP/source/public/v3/picture.mp4"
cd "$EP/source" && npx remotion render src/index.ts MouseSkinV3 ../exports/FGW_Transparent_Mouse_Skin_V3_REVIEW_1080x1920.mp4 \
  --props='{"audio":"mix_v2","captions":true}' --image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p \
  --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4 --log=error
