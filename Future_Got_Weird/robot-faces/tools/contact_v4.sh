#!/bin/sh
# V4 inspection sheets from a finished video: every second of the film (6x5 = 30 frames a page, timecoded), and the
# first 12 s at quarter-second steps.
#   tools/contact_v4.sh exports/FGW_Robot_Faces_V4_REVIEW_1920x1080.mp4 qa/v4/review
set -e
V="$1"; O="$2"
mkdir -p "$O"
ffmpeg -v error -y -i "$V" -vf "fps=1,scale=384:216,drawtext=text='%{pts\:hms}':x=6:y=6:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.5,tile=6x5" "$O/sec_%02d.png"
ffmpeg -v error -y -i "$V" -t 12 -vf "fps=4,scale=384:216,drawtext=text='%{pts\:hms}':x=6:y=6:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.5,tile=6x8" "$O/opening_quarter_seconds.png"
ls "$O"
