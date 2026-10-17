#!/usr/bin/env bash
# Render one chunk of a render_chunks.sh work dir (same bundle snapshot): tools/r2/render_one_chunk.sh <work_dir> <index> [comp]
set -euo pipefail
cd "$(dirname "$0")/../.."
WORK=$1; I=$2; COMP=${3:-LastChoiceR2}; CHUNK=${CHUNK:-1000}; CONC=${CONC:-4}; FR=${FR:-7740}
BROWSER=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
a=$((I*CHUNK)); b=$((a+CHUNK-1)); [ $b -ge $FR ] && b=$((FR-1))
f=$(printf "%s/c%02d.mp4" "$WORK" $I)
[ -s "$f" ] && { echo "chunk $I exists"; exit 0; }
echo "chunk $I: frames $a-$b"
(cd source && npx remotion render "$WORK/bundle" "$COMP" "$f.part.mp4" --frames=$a-$b --muted --props='{"audio":false}' \
  --crf=18 --x264-preset=medium --color-space=bt709 --concurrency=$CONC --timeout=300000 \
  --browser-executable=$BROWSER --log=error) && mv "$f.part.mp4" "$f" && echo "chunk $I done"
