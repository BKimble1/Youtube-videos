#!/usr/bin/env bash
# THE LAST CHOICE — clean review render, from a fresh checkout to the review MP4 and its QA.
#   tools/render_review.sh            1920x1080 review (LastChoice)
#   tools/render_review.sh 4k         3840x2160 master (LastChoice4K, same source, slower)
# Steps: fetch + verify the supplied music (release film-audio-v1) → timing.json from the film's timeline →
# music stem (edit + radio perspective) → prepared SFX → mix (stems, -16 LUFS, -1.5 dBTP) → Remotion render → QA.
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT=$PWD
MODE=${1:-review}

[ -f audio/source/rec_234600.wav ] && [ -f audio/source/rec_235008.wav ] || bash tools/fetch_music.sh
(cd source && [ -d node_modules ] || npm ci)
(cd source && node ../tools/collect_timing.mjs)
python3 tools/build_music.py
[ -f audio/sfx/choices.json ] && [ -f audio/sfx/blast.wav ] || python3 tools/prep_sfx.py
python3 tools/mix.py

mkdir -p exports
if [ "$MODE" = 4k ]; then
  OUT=exports/FGW_TheLastChoice_MASTER_4K.mp4
  (cd source && npx remotion render src/index.ts LastChoice4K "$ROOT/$OUT" --props='{"audio":"mix"}' \
     --crf=16 --x264-preset=slow --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=2)
else
  OUT=exports/FGW_TheLastChoice_R1_REVIEW_1080p.mp4
  (cd source && npx remotion render src/index.ts LastChoice "$ROOT/$OUT" --props='{"audio":"mix"}' \
     --crf=18 --x264-preset=medium --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=${CONCURRENCY:-4})
fi
python3 tools/qa.py measure "$OUT" qa/render
echo "done: $OUT"
