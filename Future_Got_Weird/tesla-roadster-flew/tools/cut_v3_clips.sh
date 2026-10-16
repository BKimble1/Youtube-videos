#!/usr/bin/env bash
# Cut the Short v3 clips from the owner's recordings (footage/release/, from the draft release
# roadster-footage-2026-10-15) into source/public/footage/ (Git-ignored). Spans: footage/CLIP_LEDGER.md, Short v3.
set -euo pipefail
cd "$(dirname "$0")/.."
R=footage/release; O=source/public/footage; mkdir -p "$O"
enc=(-c:v libx264 -crf 14 -preset fast -pix_fmt yuv420p -r 30 -c:a aac -b:a 192k -ar 48000)
cut() { ffmpeg -v error -y -ss "$2" -t "$3" -i "$R/$1" "${enc[@]}" "$O/$4"; }
cut rec_224911.mp4 33.8 6.2 v3_hop_side.mp4
cut rec_224911.mp4 17.8 4.6 v3_hop_front.mp4
cut rec_224911.mp4 41.0 8.0 v3_hop_aerial.mp4
cut rec_224730.mp4 135.8 11.0 v3_ramp_aerial.mp4
cut rec_224730.mp4 76.9 3.4 v3_inverted.mp4
cut rec_224730.mp4 67.0 3.2 v3_overhead.mp4
cut rec_225340.mp4 45.0 3.4 v3_live.mp4
# slow motion: motion-interpolated, split at the broadcast camera cut (rec_224911 38.12–38.14) so no frame blends two shots
MI2="minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,setpts=2*PTS,fps=30"
T=$(mktemp -d)
ffmpeg -v error -y -ss 36.2 -t 1.92 -i "$R/rec_224911.mp4" -an -vf "$MI2" -c:v libx264 -crf 14 -preset fast -pix_fmt yuv420p "$T/a.mp4"
ffmpeg -v error -y -ss 38.14 -t 0.9 -i "$R/rec_224911.mp4" -an -vf "$MI2" -c:v libx264 -crf 14 -preset fast -pix_fmt yuv420p "$T/b.mp4"
ffmpeg -v error -y -i "$T/a.mp4" -i "$T/b.mp4" -filter_complex "[0:v][1:v]concat=n=2:v=1[v]" -map "[v]" -c:v libx264 -crf 14 -preset fast -pix_fmt yuv420p "$O/v3_hop_slow.mp4"
ffmpeg -v error -y -ss 46.8 -t 1.25 -i "$R/rec_225340.mp4" -an -vf "minterpolate=fps=75:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,setpts=2.5*PTS,fps=30" -c:v libx264 -crf 14 -preset fast -pix_fmt yuv420p "$O/v3_live_slow.mp4"
rm -rf "$T"
ls -la "$O"/v3_*.mp4
