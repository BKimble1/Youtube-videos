#!/bin/sh
# V3 contact sheet: ./sheet2.sh out.png "t1,t2,..." [cols]
npx remotion still src/index.ts SheetV3 "$1" --props="{\"ts\":[$2],\"cols\":${3:-4}}" --log=error 2>&1 | grep -E "rror" | head -20
