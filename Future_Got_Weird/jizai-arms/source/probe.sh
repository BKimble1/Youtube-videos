#!/bin/bash
# usage: ./probe.sh out.png "t1,t2,..." [cols] [scale]
# Renders each film time as its own frame of the Probe composition, then tiles them with the time stamped.
set -e
OUT=$1; TIMES=$2; COLS=${3:-4}; SC=${4:-360}
D=$(mktemp -d)
JSON="{\"times\":[${TIMES}],\"capt\":true}"
npx remotion render src/index.ts Probe "$D/f" --sequence --props="$JSON" --image-format=png --log=error --concurrency=4 >/dev/null
N=$(ls $D/f | wc -l)
i=0; ARGS=""; FILT=""
IFS=',' read -ra TA <<< "$TIMES"
for f in $(ls $D/f | sort); do
  T=${TA[$i]}
  ffmpeg -loglevel error -y -i $D/f/$f -vf "scale=$SC:-1,drawtext=text='$T':x=8:y=8:fontsize=26:fontcolor=white:box=1:boxcolor=black@0.6" $D/t_$(printf %03d $i).png
  i=$((i+1))
done
ROWS=$(( (N + COLS - 1) / COLS ))
ffmpeg -loglevel error -y -pattern_type glob -i "$D/t_*.png" -vf "tile=${COLS}x${ROWS}:padding=4:color=white" -frames:v 1 $OUT
rm -rf $D
echo "$OUT ($N frames)"
