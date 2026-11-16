#!/bin/bash
# usage: bash sheet3.sh out.png "t1,t2,..." [cols]   V3 contact sheet (run from source/)
npx remotion still src/index.ts SheetV3 "$1" --props="{\"ts\":[$2],\"cols\":${3:-4}}" --log=error
