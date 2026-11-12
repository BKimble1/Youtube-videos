#!/bin/bash
# Contact sheet from a rendered video (the true output, not a re-render): vsheet.sh in.mp4 out.jpg "f1,f2,..." [cols] [width]
IN=$1; OUT=$2; FS=$3; COLS=${4:-6}; WD=${5:-270}
SEL=$(echo "$FS" | sed 's/,/)+eq(n\\,/g'); SEL="eq(n\\,$SEL)"
N=$(echo "$FS" | tr ',' '\n' | wc -l); ROWS=$(( (N + COLS - 1) / COLS ))
ffmpeg -v error -i "$IN" -vf "select='$SEL',scale=$WD:-1,drawtext=text='%{n}':x=6:y=6:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.5,tile=${COLS}x${ROWS}" -frames:v 1 -vsync 0 -y "$OUT"
