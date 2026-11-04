#!/bin/bash
# usage: ./sheet5.sh out.png "f1,f2,..." [captions:true|false] [cols]
npx remotion still src/index.ts SheetV5 "$1" --frame=0 --props="{\"fs\":[$2],\"captions\":${3:-true},\"cols\":${4:-4},\"v5\":true}" --log=error
