#!/bin/sh
# V2 shot sheets: ./shots2.sh outdir [at]  -> one page per 16 shots (frame at fraction `at` of each shot)
mkdir -p "$1"
for p in 0 1 2 3 4 5; do
  npx remotion still src/index.ts ShotSheet "$1/shots_p$p.png" --props="{\"page\":$p,\"at\":${2:-0.5}}" 2>&1 | grep -E "rror" | head -5
done
