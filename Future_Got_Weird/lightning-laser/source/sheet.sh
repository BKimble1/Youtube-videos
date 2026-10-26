#!/bin/sh
# contact sheet: ./sheet.sh out.png "f1,f2,..." [captions]
cap=${3:-false}
npx remotion still src/index.ts Sheet "$1" --props="{\"fs\":[$2],\"captions\":$cap}" --log=error
