#!/bin/bash
# usage: ./sheet.sh out.png "f1,f2,..." [captions:true|false] [cols]
FS="[$2]"; CAP=${3:-true}; COLS=${4:-4}
npx remotion still src/index.ts Sheet "$1" --frame=0 --props="{\"fs\":$FS,\"captions\":$CAP,\"cols\":$COLS}" --log=error
