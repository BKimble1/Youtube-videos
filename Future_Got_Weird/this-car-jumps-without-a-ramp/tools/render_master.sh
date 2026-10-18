#!/usr/bin/env bash
# Final master: composition Main rendered natively at 3840x2160 (Remotion --scale=2: the vector art and text are drawn
# at 4K; the real clip is used at its source resolution). Video: H.264 High, CRF 14, preset slow, yuv420p, BT.709.
# Audio: audio/mix/mix.wav (already -15 LUFS / -1.5 dBTP), AAC-LC 320 kb/s, 48 kHz stereo, muxed once.
# -> exports/FGW_U9_JumpsWithoutRamp_FINAL_4K.mp4
# Refuses to run while the real footage is missing: the placeholder card must never reach a master.
set -euo pipefail
cd "$(dirname "$0")/.."
grep -q "available: true" source/src/footage.tsx || { echo "footage not available (source/src/footage.tsx): no master render"; exit 1; }
[[ -f source/public/footage/byd_ev-tech03.mp4 ]] || { echo "missing source/public/footage/byd_ev-tech03.mp4 (tools/ingest_footage.py cut)"; exit 1; }
python3 tools/stitch_narration.py > /dev/null
(cd source && node ../tools/export_events.mjs)
python3 tools/make_bed.py
python3 tools/mix.py
python3 tools/speech_mask.py > /dev/null
python3 tools/make_srt.py
OUT=exports/FGW_U9_JumpsWithoutRamp_FINAL_4K.mp4
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
mkdir -p exports
(cd source && npx remotion render src/index.ts Main "$TMP/video.mp4" --scale=2 --muted --props='{"audio":false}' \
  --codec=h264 --crf=14 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --concurrency=${CONC:-4})
ffmpeg -v error -y -i "$TMP/video.mp4" -i audio/mix/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy \
  -c:a aac -b:a 320k -ac 2 -ar 48000 -shortest -movflags +faststart "$OUT"
sha256sum "$OUT" | tee exports/FGW_U9_JumpsWithoutRamp_FINAL_4K.sha256
