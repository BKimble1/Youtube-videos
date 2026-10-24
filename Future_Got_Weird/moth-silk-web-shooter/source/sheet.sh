#!/bin/sh
# usage: ./sheet.sh out.png "t1,t2,..." [captions]
CAP=${3:-false}
npx remotion still src/index.ts Sheet "$1" --props="{\"ts\":[$2],\"captions\":$CAP}" 2>&1 | grep -E "Error|error|rror:" | head -20
