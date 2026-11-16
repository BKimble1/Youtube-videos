#!/usr/bin/env bash
# (copied from ai-cancer-digital-twin/tools/backup_parts.sh)
# Back up a render as 20 MB split parts with SHA-256 sums (Git LFS uploads are unavailable here).
#   bash tools/backup_parts.sh exports/<file>.mp4
# Restore: cat backup/<file>.mp4.part_* > <file>.mp4 && sha256sum -c backup/JOINED_SHA256SUMS (from exports/)
set -euo pipefail
cd "$(dirname "$0")/.."
M="$1"; B=backup; N=$(basename "$M")
mkdir -p $B
rm -f "$B/$N".part_*
split -b 20971520 -d -a 2 "$M" "$B/$N.part_"
(cd $B && sha256sum "$N".part_* > "$N.SHA256SUMS")
(cd exports && sha256sum "$N") >> $B/JOINED_SHA256SUMS
sort -u -k2 $B/JOINED_SHA256SUMS -o $B/JOINED_SHA256SUMS
ls -la $B | tail -4
