#!/bin/bash
# Split a render into checksummed 20 MB parts in backup/ (Git LFS uploads are unavailable here; same rule as the
# other FGW episodes). Restore: cat backup/<name>.part_* > exports/<name>, then sha256sum -c.
set -e
f="$1"; n=$(basename "$f")
mkdir -p backup
rm -f backup/"$n".part_*
split -b 20m -d "$f" backup/"$n".part_
(cd backup && sha256sum "$n".part_* > "$n".SHA256SUMS)
(cd "$(dirname "$f")" && sha256sum "$n") >> backup/"$n".SHA256SUMS
ls -la backup/"$n"*
