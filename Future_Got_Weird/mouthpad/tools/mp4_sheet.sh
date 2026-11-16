#!/bin/bash
# usage: tools/mp4_sheet.sh <in.mp4> <out.png> "f1,f2,..." [cols] [width]  frames from the delivered file, labelled
set -e
IN=$1; OUT=$2; FR=$3; COLS=${4:-6}; WD=${5:-270}
SEL=$(python3 -c "print('+'.join(f'eq(n\\\\,{f})' for f in '$FR'.split(',')))")
N=$(python3 -c "print(len('$FR'.split(',')))")
ffmpeg -v error -y -i "$IN" -vf "select='$SEL',scale=$WD:-1,drawtext=text='%{n}':x=4:y=4:fontsize=14:fontcolor=white:box=1:boxcolor=black@0.6,tile=${COLS}x$(( (N + COLS - 1) / COLS )):padding=3:color=white" -frames:v 1 -vsync 0 "$OUT"
echo "$OUT"
