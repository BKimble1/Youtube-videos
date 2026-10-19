#!/bin/bash
# usage: r3sheet.sh out.jpg t0 t1 stepFrames [cols] [tw] [crop x0,y0,x1,y1 fractions]
OUT=$1; T0=$2; T1=$3; STEP=${4:-2}; COLS=${5:-6}; TW=${6:-320}; CROP=${7:-0,0,1,1}
MP4=/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/exports/FGW_TheLastChoice_R3_REVIEW_1080p.mp4
IFS=, read cx0 cy0 cx1 cy1 <<< "$CROP"
CW=$(python3 -c "print(round(($cx1-$cx0)*1920))"); CH=$(python3 -c "print(round(($cy1-$cy0)*1080))")
X0=$(python3 -c "print(round($cx0*1920))"); Y0=$(python3 -c "print(round($cy0*1080))")
TH=$(python3 -c "print(round($TW*$CH/$CW))")
F0=$(python3 -c "print(round($T0*30))"); F1=$(python3 -c "print(round($T1*30))")
TMP=$(mktemp -d)
ffmpeg -v error -ss $T0 -i $MP4 -t $(python3 -c "print($T1-$T0+0.04)") -vf "select='not(mod(n\,$STEP))',crop=$CW:$CH:$X0:$Y0,scale=$TW:$TH" -vsync 0 $TMP/f%04d.png
N=$(ls $TMP | wc -l)
i=0; INPUTS=(); FILT=""; LAY=""
for f in $TMP/f*.png; do
  fr=$((F0 + i*STEP)); tt=$(python3 -c "print('%.2f'%($fr/30))")
  INPUTS+=(-i $f)
  FILT+="[$i:v]drawtext=text='$tt  f$fr':x=4:y=4:fontsize=14:fontcolor=yellow:box=1:boxcolor=black@0.6[v$i];"
  LAY+="$(( (i%COLS)*TW ))_$(( (i/COLS)*TH ))|"
  i=$((i+1))
done
LAY=${LAY%|}
ST=""; for ((k=0;k<N;k++)); do ST+="[v$k]"; done
ffmpeg -v error -y "${INPUTS[@]}" -filter_complex "${FILT}${ST}xstack=inputs=$N:layout=$LAY:fill=gray[o]" -map "[o]" -q:v 3 $OUT
rm -rf $TMP
echo "$N frames -> $OUT"
