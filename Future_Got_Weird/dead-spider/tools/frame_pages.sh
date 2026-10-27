#!/bin/sh
# Contact pages straight from an export: frames [start, start+count) at 1/5 size, 8 across, numbered.
# usage: tools/frame_pages.sh <mp4> <start> <count> <out.png>
MP4=$1; S=$2; N=$3; OUT=$4
ROWS=$(( (N + 7) / 8 ))
ffmpeg -v error -y -i "$MP4" -vf "select='between(n\,$S\,$((S + N - 1)))',scale=216:384,drawtext=text='%{eif\:n+$S\:d}':x=6:y=6:fontsize=26:fontcolor=yellow:box=1:boxcolor=black@0.6,tile=8x$ROWS" -frames:v 1 -vsync vfr "$OUT"
