#!/bin/bash
cd /tmp/claude-0/-home-user-Youtube-videos/4fd06f38-6715-5414-83fd-ceb37ea54d2a/scratchpad/r4/mech/lab
TAG=$1
for r in "9.3 35.8 BC1" "35.8 59.95 C" "59.95 94.3 D1" "94.3 116.92 D2" "116.92 149.86 D3" "149.86 186.9 D4" "186.9 231.6 EF"; do
  set -- $r
  nice -n 15 node --max-old-space-size=4000 filmaudit.mjs $1 $2 audit/${TAG}_$3.json > audit/${TAG}_$3.log 2>&1
done
