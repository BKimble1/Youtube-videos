#!/bin/bash
# usage: tools/sheet_times.sh <out.png> "t1,t2,..." [cols] [scale]  contact sheet of MouthPadV1 at times (s)
set -e
cd "$(dirname "$0")/../source"
OUT=$(realpath -m "$1"); TS=$2; COLS=${3:-6}; SC=${4:-0.3333}
TMP=$(mktemp -d)
FR=$(python3 -c "print(','.join(str(min(956, round(float(s)*30))) for s in '$TS'.split(',')))")
node stills.mjs $TMP ${COMP:-MouthPadV2} $FR $SC > /dev/null
IFS=',' read -ra A <<< "$TS"
for f in $TMP/*.png; do n=$(basename $f .png); idx=$((10#${n%%_*})); s=${A[$idx]}
  ffmpeg -v error -y -i $f -vf "drawtext=text='${s}s':x=8:y=8:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.6" $f.l.png && mv $f.l.png $f; done
ffmpeg -v error -y -pattern_type glob -i "$TMP/*.png" -filter_complex "tile=${COLS}x$(( (${#A[@]} + COLS - 1) / COLS )):padding=4:color=white" -frames:v 1 "$OUT"
rm -rf $TMP; echo "$OUT"
