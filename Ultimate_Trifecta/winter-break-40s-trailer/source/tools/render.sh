#!/usr/bin/env bash
# render.sh SHOT [W H FPS] : one shot with Movie Maker at a fixed clock -> shots/SHOT.mp4 (+ events)
SHOT=$1; W=${2:-1920}; H=${3:-1080}; FPS=${4:-60}
OUT=/home/user/ut/work/shots; mkdir -p $OUT
D=$OUT/tmp_$SHOT; rm -rf $D; mkdir -p $D
cd /home/user/ut/game
CFG=game/override.cfg
printf '[display]\n\nwindow/size/window_width_override=%s\nwindow/size/window_height_override=%s\n' "$W" "$H" > $CFG
T0=$(date +%s)
/home/user/ut/work/gdrun.sh $W $H $OUT/$SHOT.log --write-movie $D/f.png --fixed-fps $FPS res://src/dev/trailer/trailer.tscn -- --shot=$SHOT --opt=fps:$FPS --events=$D/events.json
rm -f $CFG
FR=$(python3 -c "import json;print(json.load(open('$D/events.json'))['frames'])") || { echo "NO EVENTS $SHOT"; exit 1; }
ffmpeg -v error -y -framerate $FPS -start_number 30 -i "$D/f%08d.png" -frames:v $FR -c:v libx264 -preset medium -crf 8 -pix_fmt yuv444p \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 "$OUT/$SHOT.mp4" && cp $D/events.json $OUT/$SHOT.events.json && rm -rf $D
echo "$SHOT $FR frames in $(( $(date +%s) - T0 )) s"
