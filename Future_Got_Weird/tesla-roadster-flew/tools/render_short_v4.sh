#!/usr/bin/env bash
# Render the Short, final pass (composition ShortV4) -> exports/FGW_Roadster_Short_FINAL_v4.mp4 (1080x1920, 30 fps,
# -14 LUFS, -1.5 dBTP). Clips: tools/cut_v3_clips.sh plus the two v4 clips cut here.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p exports source/public/short4
for f in v3_hop_side v3_hop_front v3_hop_slow v3_ramp_aerial v3_inverted v3_accel; do
  [[ -f source/public/footage/$f.mp4 ]] || { echo "missing source/public/footage/$f.mp4: run tools/cut_v3_clips.sh"; exit 1; }
done
R=footage/release/rec_224911.mp4
[[ -f source/public/footage/v3_accel.mp4 ]] || ffmpeg -v error -y -ss 15.5 -t 9.5 -i footage/release/rec_225218.mp4 -c:v libx264 -crf 14 -preset fast -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 48000 source/public/footage/v3_accel.mp4
[[ -f source/public/footage/v4_open.mp4 ]] || ffmpeg -v error -y -ss 34.45 -t 1.31 -i $R -an -vf "minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,setpts=1.19*PTS,fps=30" -c:v libx264 -crf 14 -preset fast -pix_fmt yuv420p source/public/footage/v4_open.mp4
[[ -f source/public/footage/v4_end_slow.mp4 ]] || ffmpeg -v error -y -ss 38.14 -t 1.08 -i $R -an -vf "minterpolate=fps=81:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,setpts=2.7*PTS,fps=30" -c:v libx264 -crf 14 -preset fast -pix_fmt yuv420p source/public/footage/v4_end_slow.mp4
SENT=0.34 COMMA=0.15 python3 tools/build_short_v3_narration.py audio/short_v4/takes/v4_t2_WJpQ.mp3 source/public/short4/narration.wav > /dev/null
python3 tools/make_sfx_short_v4.py
NAME=${NAME:-FGW_Roadster_Short_FINAL_v4}
RAW=exports/${NAME}_raw.mp4
OUT=exports/${NAME}.mp4
(cd source && npx remotion render src/index.ts ShortV4 "../$RAW" --props='{"audio":true}' --crf=16 --x264-preset=medium --color-space=bt709 --audio-bitrate=320k --concurrency=3)
M=$(ffmpeg -hide_banner -nostats -i "$RAW" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
gv() { echo "$M" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i "$RAW" -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(gv input_i):measured_TP=$(gv input_tp):measured_LRA=$(gv input_lra):measured_thresh=$(gv input_thresh):offset=$(gv target_offset):linear=true,aresample=48000" -c:a aac -b:a 320k -movflags +faststart "$OUT"
rm -f "$RAW"
echo "$OUT"
