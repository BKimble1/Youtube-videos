#!/bin/bash
# usage: ./sheet.sh <Comp> <out.png> <frames e.g. 0,1,2> [cols] [entry]  -> contact sheet of stills (each 540x960)
set -e
COMP=$1; OUT=$2; FR=$3; COLS=${4:-3}; ENTRY=${5:-src/index.ts}
TMP=$(mktemp -d)
IFS=',' read -ra A <<< "$FR"
for f in "${A[@]}"; do npx remotion still $ENTRY $COMP $TMP/$(printf %05d $f).png --frame=$f --scale=0.5 --log=error & 
  while [ $(jobs -r | wc -l) -ge 3 ]; do sleep 0.3; done; done; wait
ffmpeg -v error -y -pattern_type glob -i "$TMP/*.png" -filter_complex "tile=${COLS}x$(( (${#A[@]} + COLS - 1) / COLS )):padding=6:color=white" -frames:v 1 $OUT
rm -rf $TMP
