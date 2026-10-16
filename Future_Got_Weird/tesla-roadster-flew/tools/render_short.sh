#!/usr/bin/env bash
# Render the Short. With every footage slot filled -> FINAL; otherwise a REVIEW copy with labelled placeholders.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p exports
python3 tools/make_sfx_short.py
if python3 tools/check_footage.py short; then MODE=FINAL; else MODE=REVIEW_PLACEHOLDERS; fi
RAW=exports/FGW_Roadster_Short_${MODE}_raw.mp4
OUT=exports/FGW_Roadster_Short_${MODE}.mp4
(cd source && npx remotion render src/index.ts Short "../$RAW" --props='{"audio":true}' --crf=16 --x264-preset=slow --color-space=bt709 --audio-bitrate=320k --concurrency=3)
# loudness: two-pass EBU R128 to -14 LUFS integrated, -1.5 dBTP (video stream copied)
M=$(ffmpeg -hide_banner -nostats -i "$RAW" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
gv() { echo "$M" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i "$RAW" -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(gv input_i):measured_TP=$(gv input_tp):measured_LRA=$(gv input_lra):measured_thresh=$(gv input_thresh):offset=$(gv target_offset):linear=true,aresample=48000" -c:a aac -b:a 320k -movflags +faststart "$OUT"
rm -f "$RAW"
echo "$OUT"
