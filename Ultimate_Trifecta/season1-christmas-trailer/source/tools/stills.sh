#!/usr/bin/env bash
# stills.sh SHOT "t1,t2,..." [W H] : blocking stills of a shot at output times (no movie). Env: UT_GAME, OUT (default ./stills).
UT_GAME=${UT_GAME:?}; OUT=$(mkdir -p "${OUT:-stills}" && cd "${OUT:-stills}" && pwd)
SHOT=$1; TS=$2; W=${3:-960}; H=${4:-540}
cd "$UT_GAME"
XDG_DATA_HOME=$(mktemp -d) timeout 600 xvfb-run -a -s "-screen 0 $((W+64))x$((H+64))x24" tools/gd.sh --path game --resolution ${W}x${H} --fixed-fps 60 \
  res://src/dev/trailer/trailer.tscn -- --shot=$SHOT --stills=$TS --stills-dir="$OUT" > "$OUT/$SHOT.log" 2>&1 &
PID=$!
while kill -0 $PID 2>/dev/null; do grep -q "TRAILER done" "$OUT/$SHOT.log" && { sleep 2; pkill -f -- "--shot=$SHOT "; break; }; sleep 2; done
ls "$OUT"/${SHOT}_*.png
