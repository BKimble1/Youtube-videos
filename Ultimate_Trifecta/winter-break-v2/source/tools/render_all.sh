#!/usr/bin/env bash
# render_all.sh W H FPS OUTDIR [shots...] : render shots two at a time into OUTDIR
W=$1; H=$2; FPS=$3; OUTD=$4; shift 4
SHOTS="$@"
[ -z "$SHOTS" ] && SHOTS=$(python3 -c "import json;print(' '.join(c[0] for c in json.load(open('/home/user/ut/work/edl.json'))['clips']))")
mkdir -p $OUTD
one() { local s=$1
  local D=$OUTD/tmp_$s; rm -rf $D; mkdir -p $D
  /home/user/ut/work/gdrun.sh $W $H $OUTD/$s.log --write-movie $D/f.png --fixed-fps $FPS res://src/dev/trailer/trailer.tscn -- --shot=$s --opt=fps:$FPS --events=$D/events.json > /dev/null
  local FR=$(python3 -c "import json;print(json.load(open('$D/events.json'))['frames'])" 2>/dev/null) || { echo "FAILED $s"; return; }
  ffmpeg -v error -y -framerate $FPS -start_number 30 -i "$D/f%08d.png" -frames:v $FR -c:v libx264 -preset medium -crf 10 -pix_fmt yuv444p \
    -color_primaries bt709 -color_trc bt709 -colorspace bt709 "$OUTD/$s.mp4" && cp $D/events.json $OUTD/$s.events.json && rm -rf $D
  echo "done $s ($FR)"; }
# Movie Maker records the window size: one override per checkout, so the size must match for all
cd /home/user/ut/game && printf '[display]\n\nwindow/size/window_width_override=%s\nwindow/size/window_height_override=%s\n' "$W" "$H" > game/override.cfg
N=0
for s in $SHOTS; do one $s & N=$((N+1)); sleep 5; if [ $((N % 2)) -eq 0 ]; then wait; fi; done; wait
rm -f /home/user/ut/game/game/override.cfg
echo ALLDONE
