#!/usr/bin/env bash
# Bundle tools/export_cues_v2.ts (it imports the shot modules) with esbuild and write audio/cues_v2.json.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/audio/cues_v2.json}"
TMP="$(mktemp -d)"
NODE_PATH="$ROOT/source/node_modules" "$ROOT/source/node_modules/.bin/esbuild" "$ROOT/tools/export_cues_v2.ts" --bundle --platform=node --format=cjs \
  --jsx=automatic --loader:.css=empty --loader:.woff2=empty --loader:.woff=empty --loader:.ttf=empty \
  --loader:.png=empty --loader:.svg=empty --log-level=warning --outfile="$TMP/export_cues_v2.cjs" \
  --resolve-extensions=.tsx,.ts,.js,.json
NODE_PATH="$ROOT/source/node_modules" node "$TMP/export_cues_v2.cjs" "$OUT"
rm -rf "$TMP"
