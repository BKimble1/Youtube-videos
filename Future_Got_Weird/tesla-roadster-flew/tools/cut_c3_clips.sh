#!/usr/bin/env bash
# Cut the companion v3 clips from the owner's recordings (footage/release/, draft release roadster-footage-2026-10-15)
# into source/public/footage/ (Git-ignored). Every V3 clip plays at the recording's own speed. Spans and what each
# shows: footage/CLIP_LEDGER.md, "Companion v3". Clips are scaled to 3840x2160 here (Lanczos, no sharpening) so the
# 4K render scales the recordings once, with a good filter; encoded near-losslessly (CRF 10).
set -euo pipefail
cd "$(dirname "$0")/.."
R=footage/release; O=source/public/footage; mkdir -p "$O"
V=(-c:v libx264 -crf 10 -preset slow -pix_fmt yuv420p -r 30)
UP=scale=3840:2160:flags=lanczos+accurate_rnd+full_chroma_int
# cut <recording> <in> <dur> <clip> [extra filters before the scale]
cut() { ffmpeg -v error -y -ss "$2" -t "$3" -i "$R/$1" -vf "${5:+$5,}$UP" "${V[@]}" -c:a aac -b:a 256k -ar 48000 "$O/$4"; }
# 1 opening: the hop, Tesla's side replay: airborne on four jets beside the parked Teslas, rolls inverted above the Semi.
#   The night replay is very dark (car body around 35-45% luma): a gentle curve lifts the car and the jets (car ~50-60%)
#   while black stays black and the highlights roll off instead of clipping further
cut rec_224911.mp4 34.40 2.40 c3_open_hop.mp4 "curves=master='0/0 0.03/0.035 0.12/0.2 0.3/0.48 0.5/0.7 0.8/0.92 1/1'"
# 2 the first run's hang, close-up from below (ends before Tesla's cut at 1:19.90)
cut rec_224730.mp4 77.50 2.36 c3_hang.mp4
# 3 the second run, side angle (car end-on): rolls upright off the top of the ramp, jets, four jets down, lands in smoke
cut rec_224730.mp4 127.00 4.95 c3_roll_real.mp4
# 4 the stream's recorded 0-60 run, side-rear angle: launch at 0:17.1 with the rear gas jet, burned-in timer stops at 01.00
cut rec_225218.mp4 15.60 5.40 c3_rec_run.mp4
# 5 ending: the second run from the air (silent recording): rolling on its jets, upright, jets down, touchdown in
#   smoke (~2:24.3), the camera dropping in behind the car (ends before it passes over, ~2:27.0)
cut rec_224730.mp4 139.25 7.80 c3_end_aerial.mp4
for f in "$O"/c3_*.mp4; do printf '%-24s %s\n' "$(basename "$f")" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")"; done
