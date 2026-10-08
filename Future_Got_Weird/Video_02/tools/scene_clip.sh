#!/usr/bin/env bash
# Render one scene (plus a few frames either side) at half resolution, muted, and run the dense QA on it.
#   tools/scene_clip.sh <source_dir> <SCENE_ID> <out_dir> [scale]
# e.g. tools/scene_clip.sh work/S6/source S6 work/S6/qa
set -euo pipefail
SRC=$(cd "$1" && pwd); SID=$2; OUT=$(mkdir -p "$3" && cd "$3" && pwd); SCALE=${4:-0.5}
HERE=$(cd "$(dirname "$0")" && pwd)
read FROM TO < <(python3 -c "
import json,sys
t=json.load(open('$SRC/src/data/timeline.json'))
s=[x for x in t['scenes'] if x['id']=='$SID'][0]
print(max(0,s['from']-8), min(t['durationInFrames']-1, s['to']+8))")
cd "$SRC"
npx remotion render src/index.ts Preview "$OUT/${SID}_clip.mp4" --frames=$FROM-$((TO-1)) --scale=$SCALE --concurrency=2 --muted --log=error
echo "rendered $OUT/${SID}_clip.mp4 (frames $FROM-$((TO-1)))"
# dense QA expects a full-length video aligned to the timeline; pass the offset
python3 "$HERE/qa_dense.py" "$OUT/${SID}_clip.mp4" "$SRC/src/data/timeline.json" "$OUT/dense" --fps 3 --offset $FROM --only $SID || true
