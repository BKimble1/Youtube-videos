#!/bin/bash
# usage: bash sheet2.sh out.png "t1,t2,..." [cols]   V2 contact sheet (run from source/)
npx remotion still src/index.ts SheetV2 "$1" --props="{\"ts\":[$2],\"cols\":${3:-4}}" --log=error
