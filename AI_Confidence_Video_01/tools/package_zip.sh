#!/usr/bin/env bash
# Build the editable-project zip: source + lockfile + tools + research + script + useful assets.
# Excludes node_modules, caches, previews, large regenerable intermediates and any secrets.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
out="${1:-$root/exports/AI_Confidence_Video_01_project.zip}"
cd "$root/.."
rm -f "$out"
zip -q -r "$out" AI_Confidence_Video_01 \
  -x 'AI_Confidence_Video_01/source/node_modules/*' \
  -x 'AI_Confidence_Video_01/**/node_modules/*' \
  -x 'AI_Confidence_Video_01/previews/*' \
  -x 'AI_Confidence_Video_01/exports/*' \
  -x 'AI_Confidence_Video_01/qa/review_v*/frames/*' \
  -x 'AI_Confidence_Video_01/audio/music/stems/*' \
  -x 'AI_Confidence_Video_01/audio/mix/stem_*' \
  -x 'AI_Confidence_Video_01/audio/narration/placeholder/*' \
  -x 'AI_Confidence_Video_01/audio/narration/draft_local/draft_full.wav' \
  -x 'AI_Confidence_Video_01/audio/narration/narration_*.wav' \
  -x 'AI_Confidence_Video_01/audio/music/music_bed.wav' \
  -x 'AI_Confidence_Video_01/audio/sfx/sfx_track.wav' \
  -x 'AI_Confidence_Video_01/audio/mix/final_mix.wav' \
  -x 'AI_Confidence_Video_01/research/screens/paper600/*' \
  -x 'AI_Confidence_Video_01/source/public/audio/*' \
  -x 'AI_Confidence_Video_01/assets/downloads/*.jpg' \
  -x 'AI_Confidence_Video_01/assets/downloads/**/*.jpg' \
  -x '*/.env' -x '*.key' -x '*/__pycache__/*' -x '*.pyc' -x '*/.cache/*'
# Safety: refuse to ship anything that looks like a credential
if unzip -l "$out" | grep -E -i '\.env$|credential|secret|\.key$' >/dev/null; then
  echo "ERROR: possible credential file in zip" >&2; exit 1
fi
if unzip -p "$out" 2>/dev/null | grep -a -E 'sk_[a-f0-9]{40,}|xi-api-key: *[A-Za-z0-9]{20,}' >/dev/null; then
  echo "ERROR: possible API key content in zip" >&2; exit 1
fi
ls -la "$out"; unzip -l "$out" | tail -1
