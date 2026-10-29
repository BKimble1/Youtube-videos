#!/bin/sh
# contact sheet of film frames: ./sheet.sh out.png "f1,f2,..." [captions true|false]
OUT=$1; FS=$2; CAP=${3:-true}
npx remotion still src/index.ts Sheet "$OUT" --props="{\"fs\":[$FS],\"captions\":$CAP}" 2>&1 | grep -v "^$" | tail -1
