#!/bin/sh
# Rebuild cues, mix, the review cut and its checks (run from the episode folder). Pass "master" to render the 4K too.
set -e
source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/ec_ll.cjs --log-level=error
node /tmp/ec_ll.cjs audio/cues.json > /dev/null
python3 tools/make_audio.py > /dev/null
V=exports/FGW_Lightning_Laser_V1_REVIEW_1080x1920.mp4
(cd source && npx remotion render src/index.ts LightningLaser ../$V --props='{"audio":"mix","captions":true}' --image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4 --log=error)
python3 tools/qa.py $V qa/FGW_Lightning_Laser_V1_REVIEW > /dev/null
python3 tools/motion_scan.py $V qa/motion_scan.json > /dev/null
if [ "$1" = "master" ]; then
  (cd source && npx remotion render src/index.ts LightningLaser ../exports/FGW_Lightning_Laser_V1_MASTER_2160x3840.mp4 --scale=2 --props='{"audio":"mix","captions":true}' --image-format=png --gop=15 --crf=16 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4 --log=error)
fi
echo BUILD_DONE
