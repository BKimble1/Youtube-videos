#!/usr/bin/env bash
# Companion v2 QA on the export: black frames, freezes, loudness, frame strips of every rotation and transition,
# phone-size contact sheets. Usage: tools/qa_c2.sh exports/FGW_Roadster_Companion_REVIEW_v2.mp4 qa/c2/final
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
strip s01_match 12.55 0.9 10 3
strip s02_departure 75.8 5.0 3 5
strip s03_roll 104.2 6.0 2.5 5
strip s04_tumble 95.9 2.9 4 4
strip s05_rocket_hover 161.2 2.4 2.5 3
strip s06_opening_crew 8.3 4.8 2.5 4
strip s07_end_crew 196.8 3.7 2.5 4
for c in 8.45 12.95 65.55 74.4 80.6 85.05 91.0 98.6 114.6 119.24 123.9 129.4 131.6 138.0 143.5 146.3 150.7 173.2 180.73 186.73 191.97 197.1; do
  strip "cut_$c" "$(python3 -c "print(max(0, $c - 0.2))")" 0.4 10 4
done
# phone size: one frame every 4 s at 640x360 (a phone held sideways shows roughly this many pixels of a 16:9 video)
ffmpeg -v error -y -i "$IN" -vf "fps=1/4,scale=640:-2,tile=5x10" -frames:v 1 "$OUT/phone/sheet.png"
echo "strips in $OUT"
