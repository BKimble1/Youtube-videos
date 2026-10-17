#!/usr/bin/env bash
# Cut the Rocket Short's two clips from the owner's recordings (footage/release/, draft release roadster-footage-2026-10-15)
# into source/public/footage/ (Git-ignored). Both play at the recording's own speed: no slow motion, no frame
# interpolation. They are scaled once here to 3414x1920 (Lanczos, no sharpening) so the 9:16 render only crops them.
# Spans and what each shows: footage/CLIP_LEDGER.md, "Rocket Short".
set -euo pipefail
cd "$(dirname "$0")/.."
R=footage/release; O=source/public/footage; mkdir -p "$O"
V=(-c:v libx264 -crf 12 -preset slow -pix_fmt yuv420p -r 30 -g 15)
UP=scale=3414:1920:flags=lanczos+accurate_rnd+full_chroma_int
cut() { ffmpeg -v error -y -ss "$2" -t "$3" -i "$R/$1" -vf "${5:+$5,}$UP" "${V[@]}" -c:a aac -b:a 256k -ar 48000 "$O/$4"; }
# 1 the hop, Tesla's side replay, one continuous camera from 0:34.45 (after the dissolve; the Short's last 0.8 s uses
#   0:34.45-0:35.22 so the loop runs straight into frame 0): climbing on its jets beside the parked Teslas, rolling inverted
#   above the Semi with jets firing, rolling back upright on four downward jets (the traced frame, 0:38.5), descending
#   toward the smoke. The night replay is dark: the companion's gentle curve lifts the car and jets, black stays black.
cut rec_224911.mp4 34.20 6.10 rk_hop.mp4 "curves=master='0/0 0.03/0.035 0.12/0.2 0.3/0.48 0.5/0.7 0.8/0.92 1/1'"
# 2 the second ramp run from the air (silent recording): rolling upright on its jets with side plumes, jets down,
#   touchdown in smoke (about 2:24.3), the camera dropping in behind the car; ends on the last frame before the
#   broadcast's cut at 2:26.75
cut rec_224730.mp4 139.80 6.94 rk_aerial.mp4
for f in "$O"/rk_*.mp4; do printf '%-16s %s\n' "$(basename "$f")" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")"; done
