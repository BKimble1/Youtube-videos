#!/bin/sh
# V2 contact sheet: ./sheet2.sh out.png "f1,f2,..." [captions true|false]
OUT=$1; FS=$2; CAP=${3:-true}
npx remotion still src/index.ts Sheet2 "$OUT" --props="{\"fs\":[$FS],\"captions\":$CAP}" 2>&1 | grep -E "rror|^\+" | tail -3
