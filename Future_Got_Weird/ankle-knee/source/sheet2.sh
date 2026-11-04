#!/bin/bash
# usage: ./sheet2.sh out.png "f1,f2,..." [captions:true|false] [cols]
npx remotion still src/index.ts SheetV2 "$1" --frame=0 --props="{\"fs\":[$2],\"captions\":${3:-true},\"cols\":${4:-4},\"v2\":true}" --log=error
