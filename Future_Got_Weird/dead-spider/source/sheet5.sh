#!/bin/sh
# V2 contact sheet while working: ./sheet2.sh out.png "f1,f2,..." [captions]   (film frames, up to 12)
CAP=${3:-false}
npx remotion still src/index.ts Sheet5 "$1" --props="{\"fs\":[$2],\"captions\":$CAP}" 2>&1 | grep -E "Error|error|rror:" | head -20
