#!/usr/bin/env bash
# Final companion export: composition Companion3 rendered natively at 3840x2160 (Remotion --scale=2: the vector art and
# text are drawn at 4K; the recordings come in pre-scaled to 4K with Lanczos by tools/cut_c3_clips.sh).
# Video: H.264 High, CRF 14, preset slow, yuv420p, BT.709. Audio: the mix rendered losslessly (WAV), normalised in two
# passes to -15 LUFS / -1.5 dBTP and encoded once to AAC-LC 320 kb/s, 48 kHz stereo.
# -> exports/FGW_Roadster_Companion_FINAL_4K.mp4   (intermediates go to a temp dir and are removed)
set -euo pipefail
cd "$(dirname "$0")/.."
for f in c3_open_hop c3_hang c3_roll_real c3_rec_run c3_end_aerial; do
  [[ -f source/public/footage/$f.mp4 ]] || { echo "missing source/public/footage/$f.mp4: run tools/cut_c3_clips.sh"; exit 1; }
done
eval "$(cat audio/companion_v3/tighten_cmd.txt)" > /dev/null   # pauses tightened per block (V7 at 1.08x, pitch kept)
python3 tools/build_c3_narration.py > /dev/null              # phrases placed on the film timeline + word timings
python3 tools/make_bed_c3.py                                 # score + effects, ducked under the words
OUT=exports/FGW_Roadster_Companion_FINAL_4K.mp4
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
mkdir -p exports
(cd source && npx remotion render src/index.ts Companion3 "$TMP/video.mp4" --scale=2 --muted --props='{"audio":false}' \
  --codec=h264 --crf=14 --x264-preset=slow --pixel-format=yuv420p --color-space=bt709 --concurrency=${CONC:-3})
(cd source && npx remotion render src/index.ts Companion3 "$TMP/mix.wav" --codec=wav --props='{"audio":true}')
M=$(ffmpeg -hide_banner -nostats -i "$TMP/mix.wav" -af loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
gv() { echo "$M" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i "$TMP/video.mp4" -i "$TMP/mix.wav" -map 0:v -map 1:a -c:v copy \
  -af "loudnorm=I=-15:TP=-1.5:LRA=11:measured_I=$(gv input_i):measured_TP=$(gv input_tp):measured_LRA=$(gv input_lra):measured_thresh=$(gv input_thresh):offset=$(gv target_offset):linear=true,aresample=48000" \
  -c:a aac -b:a 320k -ac 2 -ar 48000 -shortest -movflags +faststart "$OUT"
echo "$OUT"
