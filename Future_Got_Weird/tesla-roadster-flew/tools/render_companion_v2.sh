#!/usr/bin/env bash
# Render companion v2 (composition Companion2) -> exports/FGW_Roadster_Companion_REVIEW_v2.mp4 (1920x1080, 30 fps,
# -15 LUFS integrated, -1.5 dBTP). Inputs: the owner's recordings (footage/release/), the chosen Test Voice takes
# (audio/companion_v2/takes, picks.txt) and the Scribe word timings (audio/companion_v2/scribe/picks_words.json).
set -euo pipefail
cd "$(dirname "$0")/.."
for f in c2_open_aerial c2_hang_slow c2_side_run2 c2_hop_slow_a c2_run2_slow c2_hop_front c2_hop_siderep c2_rec_run c2_rec_overhead c2_live_a c2_live_b c2_limits_aer c2_run2_approach c2_end_aerial c2_end_hop c2_end_front; do
  [[ -f source/public/footage/$f.mp4 ]] || { echo "missing source/public/footage/$f.mp4: run tools/cut_c2_clips.sh"; exit 1; }
done
python3 tools/tighten_blocks_v2.py > /dev/null      # pauses tightened per block (no time-stretch)
python3 tools/build_c2_narration.py > /dev/null     # phrases placed on the film timeline + word timings
python3 tools/make_bed_c2.py                        # score + effects, ducked under the words
NAME=${NAME:-FGW_Roadster_Companion_REVIEW_v2}
RAW=exports/${NAME}_raw.mp4
OUT=exports/${NAME}.mp4
mkdir -p exports
if [[ -n "${AUDIO_ONLY:-}" ]]; then
  # picture unchanged: re-render the soundtrack only and put it under the existing export's video stream
  (cd source && npx remotion render src/index.ts Companion2 ../exports/c2_mix.wav --codec=wav --props='{"audio":true}')
  ffmpeg -v error -y -i "$OUT" -i exports/c2_mix.wav -map 0:v -map 1:a -c:v copy -c:a pcm_s16le "${RAW%.mp4}.mov"
  RAW=${RAW%.mp4}.mov
else
  (cd source && npx remotion render src/index.ts Companion2 "../$RAW" --props='{"audio":true}' --crf=16 --x264-preset=medium --color-space=bt709 --audio-bitrate=320k --concurrency=${CONC:-3})
fi
M=$(ffmpeg -hide_banner -nostats -i "$RAW" -af loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
gv() { echo "$M" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i "$RAW" -c:v copy -af "loudnorm=I=-15:TP=-1.5:LRA=11:measured_I=$(gv input_i):measured_TP=$(gv input_tp):measured_LRA=$(gv input_lra):measured_thresh=$(gv input_thresh):offset=$(gv target_offset):linear=true,aresample=48000" -c:a aac -b:a 320k -movflags +faststart "$OUT"
rm -f "$RAW" exports/c2_mix.wav
echo "$OUT"
