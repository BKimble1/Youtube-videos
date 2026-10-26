#!/bin/sh
# V2: rebuild the mix, the review cut and its checks (run from the episode folder). Pass "master" to render the 4K too.
set -e
python3 tools/make_audio_v2.py > /dev/null
V=exports/FGW_Lightning_Laser_V2_REVIEW_1080x1920.mp4
(cd source && npx remotion render src/index.ts LightningLaserV2 ../$V --props='{"audio":"mix_v2","captions":true}' --image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4 --log=error)
mkdir -p qa/v2
python3 tools/qa.py $V qa/v2/FGW_Lightning_Laser_V2_REVIEW mix_v2 > /dev/null
python3 tools/motion_scan.py $V qa/v2/motion_scan_v2.json > /dev/null
if [ "$1" = "master" ]; then
  (cd source && npx remotion render src/index.ts LightningLaserV2 ../exports/FGW_Lightning_Laser_V2_MASTER_2160x3840.mp4 --scale=2 --props='{"audio":"mix_v2","captions":true}' --image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4 --log=error)
fi
echo BUILD_DONE
