#!/bin/sh
# V5 contact sheet (16 frames, quarter scale): ./sheet5.sh out.png "f1,f2,..." [captions true|false]
cap=${3:-false}
npx remotion still src/index.ts SheetV5 "$1" --props="{\"fs\":[$2],\"captions\":$cap}" --log=error
