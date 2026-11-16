#!/bin/bash
# V4 final publish master: the V3 edit with capsule labels removed (composition ScrollV4 = source/src/v3 as of V4),
# captions burned in, the V3 narration mix muxed on. Run from the episode folder.
set -e
OUT=${1:-exports/FGW_SCROLL_V4_FINAL_PUBLISH_1920x1080.mp4}
TMPV=${TMPV:-/tmp/scroll_v4.mp4}
mkdir -p exports
(cd source && npx remotion render src/index.ts ScrollV4 "$TMPV" --props='{"captions":true}' --muted --crf=16 --x264-preset=medium --color-space=bt709 --pixel-format=yuv420p --concurrency=${CONC:-4} --log=error)
ffmpeg -v error -y -i "$TMPV" -i audio/mix/FGW_Scroll_V3_mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart -metadata title="They Read a 2,000-Year-Old Scroll Without Opening It" "$OUT"
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate -of compact "$OUT"
