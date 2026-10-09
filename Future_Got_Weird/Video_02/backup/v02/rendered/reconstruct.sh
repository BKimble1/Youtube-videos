#!/bin/sh
# Rebuild the original files from their .partNNN pieces and verify every SHA-256 checksum.
# Usage:  sh reconstruct.sh [output_dir]        (default: this folder)
# Works on Linux and macOS. On Windows, use:  python reconstruct.py [output_dir]
set -eu
cd "$(dirname "$0")"
out="${1:-.}"
mkdir -p "$out"
if command -v sha256sum >/dev/null 2>&1; then sum() { sha256sum "$1" | cut -d' ' -f1; }
else sum() { shasum -a 256 "$1" | cut -d' ' -f1; }; fi
want() { awk -v n="$1" '$2==n {print $1}' SHA256SUMS; }
fail=0
for first in *.part001; do
  base="${first%.part001}"
  for p in "$base".part[0-9][0-9][0-9]; do
    if [ "$(sum "$p")" != "$(want "$p")" ]; then echo "BAD PART $p"; fail=1; fi
  done
  cat "$base".part[0-9][0-9][0-9] > "$out/$base.tmp"
  if [ "$(sum "$out/$base.tmp")" = "$(want "$base")" ]; then
    mv "$out/$base.tmp" "$out/$base"; echo "OK      $base"
  else
    echo "FAILED  $base (checksum mismatch; partial file kept as $base.tmp)"; fail=1
  fi
done
[ "$fail" -eq 0 ] && echo "All files rebuilt and verified." || { echo "Some files failed verification."; exit 1; }
