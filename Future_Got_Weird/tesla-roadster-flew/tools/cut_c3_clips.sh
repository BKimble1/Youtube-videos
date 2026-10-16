#!/usr/bin/env bash
# Cut the companion v3 clips from the owner's recordings (footage/release/, draft release roadster-footage-2026-10-15)
# into source/public/footage/ (Git-ignored). Every V3 clip plays at the recording's own speed. Spans and what each
# shows: footage/CLIP_LEDGER.md, "Companion v3".
set -euo pipefail
cd "$(dirname "$0")/.."
R=footage/release; O=source/public/footage; mkdir -p "$O"
V=(-c:v libx264 -crf 14 -preset fast -pix_fmt yuv420p -r 30)
cut() { ffmpeg -v error -y -ss "$2" -t "$3" -i "$R/$1" "${V[@]}" -c:a aac -b:a 192k -ar 48000 "$O/$4"; }
# 1 opening: the hop, Tesla's side replay: airborne on four jets beside the parked Teslas, rolls inverted above the Semi
cut rec_224911.mp4 34.40 2.40 c3_open_hop.mp4
# 2 the first run's hang, close-up from below (ends before Tesla's cut at 1:19.90)
cut rec_224730.mp4 77.50 2.36 c3_hang.mp4
# 3 the second run, side angle (car end-on): rolls upright off the top of the ramp, jets, four jets down, lands in smoke
cut rec_224730.mp4 127.00 4.95 c3_roll_real.mp4
# 4 the stream's recorded 0-60 run, side-rear angle: launch at 0:17.1 with the rear gas jet, burned-in timer stops at 01.00
cut rec_225218.mp4 15.60 5.40 c3_rec_run.mp4
for f in "$O"/c3_*.mp4; do printf '%-24s %s\n' "$(basename "$f")" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")"; done
