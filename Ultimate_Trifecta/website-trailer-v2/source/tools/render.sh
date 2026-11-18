#!/usr/bin/env bash
# render.sh SHOT [W H] : renders one trailer shot in the game's engine with Movie Maker (fixed 60 fps clock).
# Env: UT_GAME = the ultimate-trifecta checkout (with source/godot_trailer copied to game/src/dev/trailer/),
#      OUT = output folder (default ./shots).
# Writes OUT/SHOT.mp4 (x264 CRF 9, BT.709, the 30-frame warm-up trimmed) and OUT/SHOT.events.json.
set -u
UT_GAME=${UT_GAME:?set UT_GAME to the ultimate-trifecta checkout}
OUT=$(mkdir -p "${OUT:-shots}" && cd "${OUT:-shots}" && pwd)
SHOT=$1; W=${2:-3840}; H=${3:-2160}
D=$OUT/tmp_$SHOT; rm -rf "$D"; mkdir -p "$D"
LOG=$OUT/$SHOT.log
cd "$UT_GAME"
# Movie Maker records the window size: a temporary override (one render at a time per checkout)
CFG=game/override.cfg
printf '[display]\n\nwindow/size/window_width_override=%s\nwindow/size/window_height_override=%s\n' "$W" "$H" > $CFG
for attempt in 1 2; do   # the first run after new files can exit early while Godot registers them
  rm -f "$D"/f*.png
  ( XDG_DATA_HOME=$(mktemp -d) timeout 14000 xvfb-run -a -s "-screen 0 $((W+64))x$((H+64))x24" tools/gd.sh --path game --resolution ${W}x${H} \
     --write-movie "$D/f.png" --fixed-fps 60 res://src/dev/trailer/trailer.tscn -- --shot=$SHOT --events="$D/events.json" > "$LOG" 2>&1 ) &
  PID=$!
  while kill -0 $PID 2>/dev/null; do   # Godot can linger after quitting: stop it once the shot reports done
    if grep -q "TRAILER done" "$LOG"; then sleep 5; pkill -f -- "--shot=$SHOT "; break; fi
    if grep -qE "SCRIPT ERROR|Parse Error" "$LOG"; then grep -E -A2 "SCRIPT ERROR|Parse Error" "$LOG" | head; pkill -f -- "--shot=$SHOT "; break; fi
    sleep 3
  done
  wait $PID 2>/dev/null
  grep -q "TRAILER shot" "$LOG" && break
done
rm -f $CFG
FR=$(python3 -c "import json;print(json.load(open('$D/events.json'))['frames'])") || exit 1
SZ=$(python3 -c "from PIL import Image;import glob;print('%dx%d'%Image.open(sorted(glob.glob('$D/f*.png'))[-1]).size)")
[ "$SZ" = "${W}x${H}" ] || { echo "WRONG SIZE $SZ"; exit 3; }
ffmpeg -v error -y -framerate 60 -start_number 30 -i "$D/f%08d.png" -frames:v $FR -c:v libx264 -preset slow -crf 9 -pix_fmt yuv420p \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 "$OUT/$SHOT.mp4" && cp "$D/events.json" "$OUT/$SHOT.events.json" && rm -rf "$D"
ls -la "$OUT/$SHOT.mp4"
