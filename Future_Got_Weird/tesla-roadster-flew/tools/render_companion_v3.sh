#!/usr/bin/env bash
# Render companion v3 (composition Companion3) -> exports/FGW_Roadster_Companion_REVIEW_v3.mp4 (1920x1080, 30 fps,
# -15 LUFS integrated, -1.5 dBTP). Inputs: the owner's recordings (footage/release/), the chosen Test Voice takes
# (audio/companion_v3/takes, picks.txt) and their Scribe word timings (audio/companion_v3/scribe/V*.json).
set -euo pipefail
cd "$(dirname "$0")/.."
for f in c3_open_hop c3_hang c3_roll_real c3_rec_run; do
  [[ -f source/public/footage/$f.mp4 ]] || { echo "missing source/public/footage/$f.mp4: run tools/cut_c3_clips.sh"; exit 1; }
done
eval "$(cat audio/companion_v3/tighten_cmd.txt)" > /dev/null   # pauses tightened per block (V7 at 1.08x, pitch kept)
python3 tools/build_c3_narration.py > /dev/null              # phrases placed on the film timeline + word timings
python3 tools/make_bed_c3.py                                 # score + effects, ducked under the words
NAME=${NAME:-FGW_Roadster_Companion_REVIEW_v3}
RAW=exports/${NAME}_raw.mp4
OUT=exports/${NAME}.mp4
mkdir -p exports
if [[ -n "${AUDIO_ONLY:-}" ]]; then
  (cd source && npx remotion render src/index.ts Companion3 ../exports/c3_mix.wav --codec=wav --props='{"audio":true}')
  ffmpeg -v error -y -i "$OUT" -i exports/c3_mix.wav -map 0:v -map 1:a -c:v copy -c:a pcm_s16le "${RAW%.mp4}.mov"
  RAW=${RAW%.mp4}.mov
else
  (cd source && npx remotion render src/index.ts Companion3 "../$RAW" --props='{"audio":true}' --crf=16 --x264-preset=medium --color-space=bt709 --audio-bitrate=320k --concurrency=${CONC:-3})
fi
M=$(ffmpeg -hide_banner -nostats -i "$RAW" -af loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
gv() { echo "$M" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i "$RAW" -c:v copy -af "loudnorm=I=-15:TP=-1.5:LRA=11:measured_I=$(gv input_i):measured_TP=$(gv input_tp):measured_LRA=$(gv input_lra):measured_thresh=$(gv input_thresh):offset=$(gv target_offset):linear=true,aresample=48000" -c:a aac -b:a 320k -movflags +faststart "$OUT"
rm -f "$RAW" exports/c3_mix.wav
echo "$OUT"
