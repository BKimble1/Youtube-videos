#!/usr/bin/env bash
# Make the compressed V4 share copy (under 30 MiB, 1080p, native 30 fps) from the master, then back the master up as
# 20 MB split parts with SHA-256 sums (Git LFS is unavailable). Usage: bash tools/v4/share_and_backup_v4.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
M=exports/FGW_RobotsDestroy_v4_UPLOAD_1080p.mp4
S=exports/FGW_RobotsDestroy_v4_1080p_SHARE.mp4
T=$(mktemp -d)
# two-pass x264 at ~0.88 Mb/s video + 128 kb/s AAC keeps 3:53.5 under 30 MiB
ffmpeg -v error -y -i "$M" -c:v libx264 -preset slow -b:v 880k -pass 1 -passlogfile "$T/p" -r 30 -pix_fmt yuv420p -an -f mp4 /dev/null
ffmpeg -v error -y -i "$M" -c:v libx264 -preset slow -b:v 880k -pass 2 -passlogfile "$T/p" -r 30 -pix_fmt yuv420p \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -c:a aac -b:a 128k -movflags +faststart "$S"
rm -rf "$T"
mkdir -p backup/v4
rm -f backup/v4/*.part_*
split -b 20971520 -d -a 2 "$M" "backup/v4/$(basename "$M").part_"
(cd backup/v4 && sha256sum "$(basename "$M")".part_* > SHA256SUMS)
(cd exports && sha256sum "$(basename "$M")") > backup/v4/JOINED_SHA256SUMS
ls -la "$S" backup/v4
