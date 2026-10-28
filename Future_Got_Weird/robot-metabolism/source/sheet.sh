#!/bin/sh
# contact sheet: ./sheet.sh out.png "f1,f2,..." [captions=true]
OUT=$1; FR=$2; CAP=${3:-true}
npx remotion still src/index.ts Sheet "$OUT" --scale=0.25 --props="{\"frames\":[$FR],\"captions\":$CAP}" --log=error
