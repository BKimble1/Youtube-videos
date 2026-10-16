#!/usr/bin/env bash
# Render the Short v3 review copy (composition ShortV3). FINAL only with --final, after the owner approves a review copy.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p exports
for f in v3_hop_side v3_hop_front v3_hop_aerial v3_hop_slow v3_ramp_aerial v3_inverted v3_overhead v3_live v3_live_slow; do
  [[ -f source/public/footage/$f.mp4 ]] || { echo "missing source/public/footage/$f.mp4: run tools/cut_v3_clips.sh"; exit 1; }
done
mkdir -p source/public/short3
python3 tools/build_short_v3_narration.py audio/short_v3/takes/v3_t3_IqHa.mp3 source/public/short3/narration.wav > /dev/null
python3 tools/make_sfx_short_v3.py
MODE=REVIEW; [[ "${1:-}" == "--final" ]] && MODE=FINAL
TAG=${TAG:-$(date -u +%Y%m%d_%H%M)}
RAW=exports/FGW_Roadster_Short_${MODE}_${TAG}_raw.mp4
OUT=exports/FGW_Roadster_Short_${MODE}_${TAG}.mp4
(cd source && npx remotion render src/index.ts ShortV3 "../$RAW" --props='{"audio":true}' --crf=16 --x264-preset=medium --color-space=bt709 --audio-bitrate=320k --concurrency=3)
M=$(ffmpeg -hide_banner -nostats -i "$RAW" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
gv() { echo "$M" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i "$RAW" -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(gv input_i):measured_TP=$(gv input_tp):measured_LRA=$(gv input_lra):measured_thresh=$(gv input_thresh):offset=$(gv target_offset):linear=true,aresample=48000" -c:a aac -b:a 320k -movflags +faststart "$OUT"
rm -f "$RAW"
echo "$OUT"
