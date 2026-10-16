#!/usr/bin/env bash
# Companion thumbnail draft: a real midair frame (rec_224730 at 2:08.60, side angle, jets firing) + arrow + HOW DID IT?
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p exports source/public/footage
T=${THUMB_T:-128.6}
ffmpeg -v error -y -ss "$T" -i footage/release/rec_224730.mp4 -frames:v 1 source/public/footage/thumb_frame.png
OUT=exports/FGW_Roadster_Companion_THUMB_${TAG:-draft}.png
(cd source && npx remotion still src/index.ts Thumbnail "../$OUT" --log=error)
echo "$OUT"
