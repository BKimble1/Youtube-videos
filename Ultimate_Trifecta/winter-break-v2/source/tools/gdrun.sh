#!/usr/bin/env bash
# gdrun.sh W H LOG -- <user args...> : run the trailer scene windowed (Xvfb), stop it when it reports done; retry once if it dies early.
W=$1; H=$2; LOG=$3; shift 3
cd /home/user/ut/game
SHOT=$(grep -o -- "--shot=[^ ]*" <<<"$*" | head -1)
for attempt in 1 2 3; do
  ( XDG_DATA_HOME=$(mktemp -d) timeout 14000 xvfb-run -a -s "-screen 0 $((W+64))x$((H+64))x24" tools/gd.sh --path game --resolution ${W}x${H} "$@" > "$LOG" 2>&1 ) &
  PID=$!
  while kill -0 $PID 2>/dev/null; do
    if grep -q "TRAILER done" "$LOG"; then sleep 2; pkill -P $PID; pkill -f -- "Godot_v4.*$SHOT " ; pkill -f -- "Godot_v4.*$SHOT\$"; break; fi
    if grep -qE "SCRIPT ERROR|Parse Error|Invalid call|Invalid access" "$LOG"; then grep -E -A3 "SCRIPT ERROR|Parse Error|Invalid" "$LOG" | head -20; pkill -P $PID; pkill -f -- "Godot_v4.*$SHOT"; break; fi
    sleep 2
  done
  wait $PID 2>/dev/null
  grep -q "TRAILER shot" "$LOG" && break
  echo "retry $SHOT ($attempt)"; sleep $((RANDOM % 5 + 2))
done
grep -E "TRAILER (shot|done)" "$LOG" | head -3
