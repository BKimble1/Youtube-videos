#!/bin/sh
# V2 contact sheet while working: ./sheet2.sh out.png "t1,t2,..." [cols]   (times in seconds, up to cols*cols frames)
npx remotion still src/index.ts Sheet2 "$1" --props="{\"ts\":[$2],\"cols\":${3:-4}}" 2>&1 | grep -E "Error|error|rror:" | head -20
