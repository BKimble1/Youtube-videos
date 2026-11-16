#!/bin/bash
# usage: tools/render_final.sh <Composition> <mix_name> <out.mp4>
# Renders the composition natively (tools/render.sh: 1080x1920 frames from Remotion, one x264 encode, no scaling
# anywhere), then runs the delivery gate (tools/verify_export.py). The output only appears under its final name if
# every check passes; otherwise it is renamed *.REJECTED.mp4 and the script exits non-zero.
set -euo pipefail
COMP_ID=${1:?composition}; MIX=${2:?mix}; OUT=$(realpath -m "${3:?out}")
cd "$(dirname "$0")/.."
TMP="${OUT%.mp4}.unverified.mp4"
rm -f "$TMP" "$OUT"
COMP="$COMP_ID" tools/render.sh "$MIX" "$TMP"
if python3 tools/verify_export.py "$TMP" 957 "${OUT%.mp4}.verify.json"; then
  mv "$TMP" "$OUT"; echo "DELIVERABLE -> $OUT"
else
  mv "$TMP" "${OUT%.mp4}.REJECTED.mp4"; echo "REJECTED: see ${OUT%.mp4}.verify.json" >&2; exit 1
fi
