#!/usr/bin/env bash
# Make isolated builder copies of source/ (node_modules symlinked): tools/mk_work_copies.sh G1 G2 ...
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
for g in "$@"; do
  rm -rf "$ROOT/work/$g"
  mkdir -p "$ROOT/work/$g/source"
  (cd "$ROOT/source" && tar cf - --exclude=./node_modules --exclude=./public --exclude=./out --exclude='./.sfx-*' .) | (cd "$ROOT/work/$g/source" && tar xf -)
  ln -sfn "$ROOT/source/node_modules" "$ROOT/work/$g/source/node_modules"
  ln -sfn "$ROOT/source/public" "$ROOT/work/$g/source/public"  # read-only for builders
  echo "work/$g ready"
done
