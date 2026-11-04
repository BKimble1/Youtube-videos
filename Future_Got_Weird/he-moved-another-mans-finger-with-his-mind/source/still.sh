#!/bin/sh
# one frame: ./still.sh out.png t [captions true|false]
npx remotion still src/index.ts FilmStill "$1" --props="{\"t\":$2,\"captions\":${3:-true}}" --log=error 2>&1 | grep -E "rror" | head -20
