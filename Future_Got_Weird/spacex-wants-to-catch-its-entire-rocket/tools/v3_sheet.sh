#!/usr/bin/env bash
# Contact sheet from a test render: v3_sheet.sh <video> <video_start_film_s> <from_film_s> <dur_s> <fps> <cols> <out.png>
# Each tile is stamped with its film time.
set -euo pipefail
v=$1; off=$2; from=$3; dur=$4; fps=$5; cols=$6; out=$7
n=$(python3 -c "import math;print(math.ceil($dur*$fps))"); rows=$(( (n + cols - 1) / cols ))
ss=$(python3 -c "print(max(0,$from-$off))")
ffmpeg -v error -y -ss "$ss" -t "$dur" -i "$v" -vf "fps=$fps,scale=400:-1,drawtext=text='%{eif\:t+$from\:d}.%{eif\:mod((t+$from)*10\,10)\:d}':x=6:y=6:fontsize=20:fontcolor=yellow:box=1:boxcolor=black@0.6,tile=${cols}x${rows}:padding=2" -frames:v 1 -q:v 3 "$out"
