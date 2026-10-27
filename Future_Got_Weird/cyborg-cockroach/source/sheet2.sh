#!/bin/sh
# V2: ./sheet2.sh out.png "f1,f2,..." [captions]   (film frames; up to 16 at quarter size, up to 36 at sixth size)
CAP=${3:-false}
npx remotion still src/index.ts SheetV2 "$1" --props="{\"fs\":[$2],\"captions\":$CAP}" --log=error 2>&1 | grep -v webpack | grep -E "Error|error|rror:" | head -20
