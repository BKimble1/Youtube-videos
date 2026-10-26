#!/bin/sh
# V2 contact sheet: ./sheet2.sh out.png "f1,f2,..." [captions]
cap=${3:-false}
npx remotion still src/index.ts SheetV2 "$1" --props="{\"fs\":[$2],\"captions\":$cap}" --log=error
