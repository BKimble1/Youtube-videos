#!/bin/bash
# usage: bash sheet.sh out.png "t1,t2,..." [cols]   contact sheet of film times (run from source/)
TS="[$2]"; COLS=${3:-4}
npx remotion still src/index.ts Sheet "$1" --props="{\"ts\":$TS,\"cols\":$COLS}" --log=error
