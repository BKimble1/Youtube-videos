#!/usr/bin/env bash
# Companion v3 QA on the export: black frames, freezes, loudness, frame strips at every departure, force change,
# rotation, match and landing, and phone-size contact sheets (muted read of the first seconds included).
# Usage: tools/qa_c3.sh exports/FGW_Roadster_Companion_REVIEW_v3.mp4 qa/c3/final
set -euo pipefail
cd "$(dirname "$0")/.."
IN=$1; OUT=$2; mkdir -p "$OUT/strips" "$OUT/phone"
echo "== streams"; ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,sample_rate,channels -show_entries format=duration -of compact "$IN"
echo "== loudness"; ffmpeg -hide_banner -nostats -i "$IN" -af ebur128=peak=true -f null - 2>&1 | grep -A12 "Summary:" | grep -E "I:|LRA:|Peak:"
echo "== black (>=0.1 s)"; ffmpeg -hide_banner -nostats -i "$IN" -vf "blackdetect=d=0.1:pic_th=0.95" -an -f null - 2>&1 | grep -o "black_start.*" || echo none
echo "== freeze (>=0.6 s)"; ffmpeg -hide_banner -nostats -i "$IN" -vf "freezedetect=n=-55dB:d=0.6" -an -f null - 2>&1 | grep -oE "freeze_(start|end|duration): [0-9.]+" | paste - - - || echo none
strip() { # name start dur fps cols
  ffmpeg -v error -y -ss "$2" -i "$IN" -t "$3" -vf "fps=$4,scale=480:-2,drawtext=text='%{pts\:hms\:$2}':x=4:y=4:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.7,tile=${5}x$(python3 -c "import math;print(math.ceil($3*$4/$5))")" -frames:v 1 "$OUT/strips/$1.png"
}
strip s00_first_seconds 0 2.5 4 5
strip s01_cut_and_match 2.2 3.0 6 6
strip s02_stick_throw_land 8.4 5.0 4 5
strip s03_arrive_open_fans 15.3 4.8 2.5 4
strip s04_seal_thin 20.2 4.0 2.5 5
strip s05_push_climb 26.5 9.0 2 6
strip s06_leave 46.2 6.6 2.5 6
strip s07_tank_valve_jet 55.0 13.0 1 5
strip s08_cut_rear_roll 71.2 8.4 2 6
strip s09_down_hover_land 79.5 10.6 1.5 6
strip s10_real_run 89.7 5.4 2.5 5
strip s11_launch 94.7 9.2 2 6
strip s12_recrun_shown 103.4 5.8 2 6
strip s13_compare_pillar 108.8 6.0 2 6
strip s14_line 114.0 16.0 1 6
strip s15_limits 130.2 13.6 1 6
strip s16_ending 143.5 9.0 2 6
strip s17_last_seconds 155.0 11.5 2 6
# phone size: one frame every 3 s at 640x360 (a phone held sideways shows roughly this many pixels of a 16:9 video)
ffmpeg -v error -y -i "$IN" -vf "fps=1/3,scale=640:-2,tile=6x10" -frames:v 1 "$OUT/phone/sheet.png"
# the first 3 s at phone size, 6 frames per second (muted read of the opening)
ffmpeg -v error -y -i "$IN" -t 3 -vf "fps=6,scale=320:-2,tile=6x3" -frames:v 1 "$OUT/phone/opening.png"
echo "strips in $OUT"
