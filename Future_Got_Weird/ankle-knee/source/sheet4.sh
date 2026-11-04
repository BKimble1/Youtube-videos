#!/bin/bash
# usage: ./sheet4.sh out.png "f1,f2,..." [captions:true|false] [cols]
npx remotion still src/index.ts SheetV4 "$1" --frame=0 --props="{\"fs\":[$2],\"captions\":${3:-true},\"cols\":${4:-4},\"v4\":true}" --log=error
