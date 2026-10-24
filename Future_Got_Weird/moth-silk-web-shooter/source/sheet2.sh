#!/bin/sh
# V2 contact sheet: ./sheet2.sh out.png "f1,f2,..." [captions]   (frame numbers, up to 12)
CAP=${3:-false}
npx remotion still src/index.ts SheetV2 "$1" --props="{\"fs\":[$2],\"captions\":$CAP}" 2>&1 | grep -E "Error|error|rror:" | head -20
