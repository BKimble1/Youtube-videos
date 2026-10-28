#!/bin/sh
# contact sheet: ./sheet.sh out.png "f1,f2,...(12)" [captions true|false]
npx remotion still src/index.ts Sheet "$1" --props="{\"frames\":[$2],\"captions\":${3:-true}}" --log=error
