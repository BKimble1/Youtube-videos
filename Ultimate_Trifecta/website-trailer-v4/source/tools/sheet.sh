#!/usr/bin/env bash
# sheet.sh IN.mp4 OUT.jpg [every_n=4] [cols=6] [width=320] : frame-numbered contact sheet
N=${3:-4}; C=${4:-6}; S=${5:-320}
F=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$1")
R=$(( (F / N + C - 1) / C ))
ffmpeg -v error -y -i "$1" -vf "select=not(mod(n\,$N)),scale=$S:-1,drawtext=text='%{n}':x=4:y=4:fontsize=14:fontcolor=yellow:box=1:boxcolor=black,tile=${C}x${R}" -frames:v 1 -vsync 0 "$2"
