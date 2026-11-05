#!/bin/bash
# V3 reliable sheet: renders each time as its own still (no SVG id collisions), then tiles them.
#   ./single3.sh out.png "t1,t2,..." [cols]
OUT=$1; TS=$2; COLS=${3:-4}; D=$(mktemp -d)
i=0; for t in ${TS//,/ }; do npx remotion still src/index.ts StillV3 "$D/$(printf %03d $i).png" --props="{\"t\":$t,\"captions\":true}" --log=error >/dev/null 2>&1; i=$((i+1)); done
ffmpeg -v error -y -pattern_type glob -i "$D/*.png" -vf "scale=480:-1,tile=${COLS}x$(( (i+COLS-1)/COLS ))" -frames:v 1 "$OUT"; rm -rf "$D"
