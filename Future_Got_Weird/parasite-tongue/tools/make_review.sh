#!/bin/bash
# Review copy: the final master with a small burned-in timecode, frame number and beat label (for notes only; not for upload).
# usage: tools/make_review.sh <final.mp4> <review.mp4>
set -e
F=/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf
beat() { echo "drawtext=fontfile=$F:text='$3':x=24:y=110:fontsize=30:fontcolor=white:box=1:boxcolor=black@0.45:boxborderw=8:enable='between(t,$1,$2)'"; }
VF="drawtext=fontfile=$F:text='%{pts\:hms}  f%{frame_num}':x=24:y=56:fontsize=34:fontcolor=yellow:box=1:boxcolor=black@0.5:boxborderw=8"
VF="$VF,$(beat 0 2 'RESULT - mouth opens, push in')"
VF="$VF,$(beat 2 4 'REWIND - tongue regrows, juvenile backs out')"
VF="$VF,$(beat 4 6.53 'ENTRY - out of the gills onto the tongue')"
VF="$VF,$(beat 6.53 9.05 'ATTACH - claws in, blood drawn')"
VF="$VF,$(beat 9.05 11.6 'TIME-LAPSE - tongue withers, parasite grows')"
VF="$VF,$(beat 11.6 13.9 'ANCHOR - claws in the stub')"
VF="$VF,$(beat 13.9 17.6 'FUNCTION - inside, then out through the lips')"
VF="$VF,$(beat 17.6 20.9 'EATING - snap, chew, swallow')"
VF="$VF,$(beat 20.9 24 'LOOP - rears up, back to frame 0')"
ffmpeg -v error -y -i "$1" -vf "$VF" -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p -c:a copy -movflags +faststart "$2"
