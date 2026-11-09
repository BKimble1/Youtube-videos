#!/bin/bash
# V2 contact sheet: ./sheet2.sh out.png "f1,f2,..." [captions=true] [cols=4]
OUT=$1; FS=$2; CAP=${3:-true}; COLS=${4:-4}
npx remotion still src/index.ts SheetV4 "$OUT" --props="{\"fs\":[${FS}],\"captions\":${CAP},\"cols\":${COLS}}" --log=error 2>&1 | grep -v "webpack.cache\|memory\|Memory\|Rendered\|Composition\|Format\|Output\|Getting\|○" || true
