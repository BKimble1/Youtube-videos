#!/bin/bash
# usage: ./sheet.sh out.png "t1,t2,..." [cols]   (renders a contact sheet of the film at those times)
cols=${3:-4}
npx remotion still src/index.ts Sheet "$1" --props="{\"ts\":[$2],\"cols\":$cols}" --log=error
