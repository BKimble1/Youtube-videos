#!/bin/sh
# V3 single frame: ./still2.sh out.png t [captions true|false]
npx remotion still src/index.ts StillV3 "$1" --props="{\"t\":$2,\"captions\":${3:-true}}" --log=error 2>&1 | grep -E "rror" | head -20
