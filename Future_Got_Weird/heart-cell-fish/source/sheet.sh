#!/bin/bash
# contact sheet: ./sheet.sh out.png "f1,f2,..." [captions true|false] [cols]
OUT=$1; FS=$2; CAP=${3:-true}; COLS=${4:-4}
npx remotion still src/index.ts Sheet "$OUT" --props="{\"fs\":[$FS],\"captions\":$CAP,\"cols\":$COLS}" --log=error
