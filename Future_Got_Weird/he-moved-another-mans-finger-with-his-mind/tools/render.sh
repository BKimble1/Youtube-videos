#!/bin/bash
# Review render: picture (no audio element) from Remotion, then mux the mix.
#   bash tools/render.sh [out.mp4]      (run from the episode folder)
set -e
OUT=${1:-exports/FGW_Finger_V1_REVIEW_1920x1080.mp4}
mkdir -p exports
(cd source && npx remotion render src/index.ts FingerFilm /tmp/finger_video.mp4 --props='{"captions":true}' --muted --crf=16 --x264-preset=medium --color-space=bt709 --pixel-format=yuv420p --concurrency=4 --log=error)
ffmpeg -v error -y -i /tmp/finger_video.mp4 -i audio/mix/FGW_Finger_V1_mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart -metadata title="He Moved Another Man's Finger With His Mind (review)" "$OUT"
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate -of compact "$OUT"
