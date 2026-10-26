#!/bin/sh
# V4 detail sheet (4 frames, half scale): ./quad4.sh out.png "f1,f2,f3,f4" [captions true|false]
cap=${3:-true}
npx remotion still src/index.ts QuadV4 "$1" --props="{\"fs\":[$2],\"captions\":$cap}" --log=error
