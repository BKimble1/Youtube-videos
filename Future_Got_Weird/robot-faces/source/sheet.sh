#!/bin/sh
# contact sheet while working: ./sheet.sh out.png "t1,t2,..." [cols]   (times in seconds, up to cols*cols frames)
npx remotion still src/index.ts Sheet "$1" --props="{\"ts\":[$2],\"cols\":${3:-4}}" 2>&1 | grep -E "Error|error|rror:" | head -20
