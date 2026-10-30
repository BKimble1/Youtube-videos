#!/bin/bash
# Contact sheet of chosen frames of one hook, labelled with frame/time (QA only; labels are never in a deliverable).
# usage: tools/sheet.sh <srcDir, e.g. v1> <out.png> <frames spec as in stills.mjs> [captions=true] [cols=6]
set -e
H=$1; OUT=$(realpath -m $2); SPEC=$3; CAP=${4:-true}; COLS=${5:-6}
ROOT=$(cd "$(dirname "$0")/.." && pwd)
TMP=$(mktemp -d)
(cd $ROOT/source && node stills.mjs $H $TMP "$SPEC" $CAP 0.25 >/dev/null)
for f in $TMP/*.png; do n=$(basename $f .png); fr=$((10#${n##*_f})); t=$(python3 -c "print(f'{$fr/30:.2f}s')");
  ffmpeg -v error -y -i $f -vf "drawtext=text='f$fr  $t':x=6:y=6:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6" $f.l.png; done
N=$(ls $TMP/*.l.png | wc -l); ROWS=$(( (N + COLS - 1) / COLS ))
ffmpeg -v error -y -pattern_type glob -i "$TMP/*.l.png" -vf "tile=${COLS}x${ROWS}:padding=4:color=gray" -frames:v 1 $OUT
rm -rf $TMP; echo $OUT
