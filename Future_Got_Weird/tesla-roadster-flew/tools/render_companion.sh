#!/usr/bin/env bash
# Render the companion (16:9). Missing footage -> REVIEW_PLACEHOLDERS; all slots filled -> REVIEW; --final after approval.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p exports
python3 tools/stitch_companion.py > /dev/null
python3 tools/plan_companion.py > /dev/null
python3 tools/make_sfx_companion.py
if python3 tools/check_footage.py companion; then MODE=REVIEW; else MODE=REVIEW_PLACEHOLDERS; fi
if [[ "${1:-}" == "--final" ]]; then [[ $MODE == REVIEW ]] || { echo "refusing FINAL: footage slots missing"; exit 1; }; MODE=FINAL; fi
TAG=${TAG:-$(date -u +%Y%m%d_%H%M)}
RAW=exports/FGW_Roadster_Companion_${MODE}_${TAG}_raw.mp4
OUT=exports/FGW_Roadster_Companion_${MODE}_${TAG}.mp4
(cd source && npx remotion render src/index.ts Companion "../$RAW" --props='{"audio":true}' --crf=17 --x264-preset=medium --color-space=bt709 --audio-bitrate=320k --concurrency=3)
# loudness: two-pass EBU R128 to -15 LUFS integrated (channel long-form standard), -1.5 dBTP (video copied)
M=$(ffmpeg -hide_banner -nostats -i "$RAW" -af loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
gv() { echo "$M" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i "$RAW" -c:v copy -af "loudnorm=I=-15:TP=-1.5:LRA=11:measured_I=$(gv input_i):measured_TP=$(gv input_tp):measured_LRA=$(gv input_lra):measured_thresh=$(gv input_thresh):offset=$(gv target_offset):linear=true,aresample=48000" -c:a aac -b:a 320k -movflags +faststart "$OUT"
rm -f "$RAW"
echo "$OUT"
