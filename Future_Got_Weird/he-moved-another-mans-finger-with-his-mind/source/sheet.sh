#!/bin/sh
# contact sheet while working: ./sheet.sh out.png "t1,t2,..." [cols]   (times in seconds)
npx remotion still src/index.ts Sheet "$1" --props="{\"ts\":[$2],\"cols\":${3:-4}}" --log=error 2>&1 | grep -E "rror" | head -20
