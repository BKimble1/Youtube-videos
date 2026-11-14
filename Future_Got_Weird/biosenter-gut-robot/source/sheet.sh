#!/bin/bash
# usage: ./sheet.sh out.png "f1,f2,..." [cols]
FS="[$2]"; COLS=${3:-2}
npx remotion still src/index.ts Sheet "$1" --frame=0 --props="{\"fs\":$FS,\"cols\":$COLS}" --log=error
