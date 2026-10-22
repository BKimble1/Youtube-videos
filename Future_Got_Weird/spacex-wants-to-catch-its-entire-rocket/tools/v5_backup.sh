#!/usr/bin/env bash
# Split the V5 review into <48 MB parts under backup/v5/ with checksums (exports/ is Git-ignored, LFS is unavailable).
set -euo pipefail
cd "$(dirname "$0")/.."
F=FGW_Starship_Dual_Catch_V5_FINAL_REVIEW_1080p.mp4
mkdir -p backup/v5 && rm -f backup/v5/$F.part_*
split -b 47185920 -d -a 2 exports/$F backup/v5/$F.part_
(cd exports && sha256sum $F) > backup/v5/SHA256SUMS.txt
(cd backup/v5 && sha256sum $F.part_*) >> backup/v5/SHA256SUMS.txt
echo "Restore: cat $F.part_* > $F && sha256sum -c (first line)" > backup/v5/RESTORE.txt
ls -la backup/v5
