#!/bin/sh
# V4 contact sheet (16 frames, quarter scale): ./sheet4.sh out.png "f1,f2,..." [captions true|false]
cap=${3:-false}
npx remotion still src/index.ts SheetV4 "$1" --props="{\"fs\":[$2],\"captions\":$cap}" --log=error
