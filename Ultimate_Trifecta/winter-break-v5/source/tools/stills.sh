#!/usr/bin/env bash
# stills.sh OUTDIR W H "shot:t1,t2,..." ... : blocking stills, two shots at a time
OUT=$1; W=$2; H=$3; shift 3
mkdir -p "$OUT"
run() { local spec=$1; local sid=${spec%%:*}; local ts=${spec#*:};
  /home/user/ut/work/gdrun.sh $W $H /tmp/st_$sid.log res://src/dev/trailer/trailer.tscn -- --shot=$sid --stills=$ts --stills-dir=$OUT > /dev/null 2>&1
  grep -E -A3 "SCRIPT ERROR" /tmp/st_$sid.log | head -8; }
N=0
for spec in "$@"; do run "$spec" & N=$((N+1)); sleep 4; if [ $((N % 2)) -eq 0 ]; then wait; fi; done; wait
ls "$OUT" | wc -l
