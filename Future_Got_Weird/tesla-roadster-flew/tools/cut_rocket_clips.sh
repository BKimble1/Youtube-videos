#!/usr/bin/env bash
# Cut the Rocket Short's four clips from the owner's recordings (footage/release/, draft release roadster-footage-2026-10-15)
# into source/public/footage/ (Git-ignored). Both play at the recording's own speed: no slow motion, no frame
# interpolation. They are scaled once here to 3414x1920 (Lanczos, no sharpening) so the 9:16 render only crops them.
# Spans and what each shows: footage/CLIP_LEDGER.md, "Rocket Short".
set -euo pipefail
cd "$(dirname "$0")/.."
R=footage/release; O=source/public/footage; mkdir -p "$O"
V=(-c:v libx264 -crf 12 -preset slow -pix_fmt yuv420p -r 30 -g 15)
UP=scale=3414:1920:flags=lanczos+accurate_rnd+full_chroma_int
cut() { ffmpeg -v error -y -ss "$2" -t "$3" -i "$R/$1" -vf "${5:+$5,}$UP" "${V[@]}" -c:a aac -b:a 256k -ar 48000 "$O/$4"; }
# 1 the hop, Tesla's side replay, one continuous camera from 0:34.45 (after the dissolve): climbing on its jets beside
#   the parked Teslas, rolling inverted above the Semi with jets firing, rolling back upright on four downward jets (the
#   traced frame, 0:38.5), descending toward the smoke. The night replay is dark: a gentle curve lifts the car's shadow
#   side and the jets (slightly more than the companion's in the low mids), black stays black, highlights untouched.
cut rec_224911.mp4 34.20 6.10 rk_hop.mp4 "curves=master='0/0 0.03/0.04 0.12/0.23 0.3/0.5 0.5/0.71 0.8/0.92 1/1'"
# 2 the second ramp run from the air (silent recording): rolling upright on its jets with side plumes, jets down,
#   touchdown in smoke (about 2:24.3), the camera dropping in behind the car; ends on the last frame before the
#   broadcast's cut at 2:26.75
cut rec_224730.mp4 139.80 6.94 rk_aerial.mp4
# 3 the second run from the air, driving along the underside of the ramp (used 2:16.60-2:17.45: after the broadcast's
#   dissolve, before any exhaust shows near the car)
cut rec_224730.mp4 136.30 1.30 rk_inv.mp4
# 4 the first run's hang, close-up from below (used 1:17.50 up to Tesla's cut at 1:19.90). Kept whole and scaled 1.08x
#   (not cropped to 9:16: the car is wider than that); the render places it in a band with the corner gauges out of frame
ffmpeg -v error -y -ss 77.20 -t 2.69 -i "$R/rec_224730.mp4" -vf scale=2074:1166:flags=lanczos+accurate_rnd+full_chroma_int "${V[@]}" -an "$O/rk_hang.mp4"
for f in "$O"/rk_*.mp4; do printf '%-16s %s\n' "$(basename "$f")" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")"; done
