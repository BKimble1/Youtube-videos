#!/bin/sh
# V3: render the picture from source (vectors and text at output resolution), then carry the locked V2 audio stream
# into it unchanged (packet copy, no re-encode), then verify. Run from the episode folder. "master" adds 2160x3840.
set -e
REF=exports/FGW_Lightning_Laser_V2_REVIEW_1080x1920.mp4
FLAGS="--image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --concurrency=4 --log=error"
V=exports/FGW_Lightning_Laser_V3_REVIEW_1080x1920.mp4
(cd source && npx remotion render src/index.ts LightningLaserV3 ../exports/.v3_video.mp4 --muted --props='{"audio":false,"captions":true}' $FLAGS)
ffmpeg -v error -y -i exports/.v3_video.mp4 -i $REF -map 0:v:0 -map 1:a:0 -c copy -movflags +faststart $V
rm -f exports/.v3_video.mp4
M=""
if [ "$1" = "master" ]; then
  M=exports/FGW_Lightning_Laser_V3_MASTER_2160x3840.mp4
  (cd source && npx remotion render src/index.ts LightningLaserV3 ../exports/.v3_master.mp4 --scale=2 --muted --props='{"audio":false,"captions":true}' $FLAGS)
  ffmpeg -v error -y -i exports/.v3_master.mp4 -i $REF -map 0:v:0 -map 1:a:0 -c copy -movflags +faststart $M
  rm -f exports/.v3_master.mp4
fi
mkdir -p qa/v3
python3 tools/verify_audio_v3.py qa/v3/audio_identity.json $V $M > /dev/null
python3 tools/qa.py $V qa/v3/FGW_Lightning_Laser_V3_REVIEW mix_v2 > /dev/null
python3 tools/motion_scan.py $V qa/v3/motion_scan_v3.json > /dev/null
echo BUILD_DONE
