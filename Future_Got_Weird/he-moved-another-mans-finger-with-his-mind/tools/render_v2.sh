#!/bin/bash
# V2 review render: picture from Remotion (FingerV2), then mux the V2 mix.   bash tools/render_v2.sh [out.mp4]
set -e
OUT=${1:-exports/FGW_Finger_V2_REVIEW_1920x1080.mp4}
mkdir -p exports
(cd source && npx remotion render src/index.ts FingerV2 /tmp/finger_v2_video.mp4 --props='{"captions":true}' --muted --crf=16 --x264-preset=medium --color-space=bt709 --pixel-format=yuv420p --concurrency=4 --log=error)
ffmpeg -v error -y -i /tmp/finger_v2_video.mp4 -i audio/mix/FGW_Finger_V2_mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -movflags +faststart -metadata title="He Moved Another Man's Finger With His Mind (V2 review)" "$OUT"
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate -of compact "$OUT"
