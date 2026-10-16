#!/usr/bin/env bash
# Frame sheet of a time window for picking in-points: scan_window.sh <file> <start_s> <dur_s> <fps> <out.png> [cols]
# Each tile is labelled with its time in the source file.
set -euo pipefail
cols=${6:-6}
n=$(python3 -c "import math;print(max(1,math.floor($3*$4+1e-6)-1))")
rows=$(( (n + cols - 1) / cols ))
ffmpeg -v error -y -ss "$2" -i "$1" -t "$3" -vf "fps=$4,scale=400:-2,drawtext=text='%{pts\:hms\:$2}':x=4:y=4:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.75,tile=${cols}x${rows}:nb_frames=${n}" -frames:v 1 "$5"
