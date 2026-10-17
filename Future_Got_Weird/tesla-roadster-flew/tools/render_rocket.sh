#!/usr/bin/env bash
# Render the Rocket Short (composition RocketShort) -> exports/FGW_Rocket_Short_FINAL.mp4 (1080x1920, 30 fps, -14 LUFS,
# -1.5 dBTP). Rebuilds everything that is Git-ignored: the two clips, the narration, the event list and the sound bed.
# Needs the owner's recordings in footage/release/ (draft release roadster-footage-2026-10-15).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p exports
for f in rk_hop rk_aerial; do [[ -f source/public/footage/$f.mp4 ]] || { bash tools/cut_rocket_clips.sh; break; }; done
TAKE=r_t1
python3 tools/tighten_rocket.py audio/rocket/takes/r_t1_IyNt.mp3 audio/rocket/scribe/r_t1.json "$TAKE" > /dev/null
python3 tools/build_rocket_narration.py "$TAKE" > /dev/null
(cd source && npx tsx ../tools/export_rocket_events.ts > /dev/null)
python3 tools/make_bed_rocket.py
python3 tools/make_srt_rocket.py > /dev/null
NAME=${NAME:-FGW_Rocket_Short_FINAL}
RAW=exports/${NAME}_raw.mp4
OUT=exports/${NAME}.mp4
(cd source && npx remotion render src/index.ts RocketShort "../$RAW" --props='{"audio":true,"captions":true}' --crf=16 --x264-preset=medium --color-space=bt709 --audio-bitrate=320k --concurrency=${CONC:-3})
M=$(ffmpeg -hide_banner -nostats -i "$RAW" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
gv() { echo "$M" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i "$RAW" -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(gv input_i):measured_TP=$(gv input_tp):measured_LRA=$(gv input_lra):measured_thresh=$(gv input_thresh):offset=$(gv target_offset):linear=true,aresample=48000" -c:a aac -b:a 320k -movflags +faststart "$OUT"
rm -f "$RAW"
echo "$OUT"
