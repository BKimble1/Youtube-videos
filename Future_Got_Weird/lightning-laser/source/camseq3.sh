#!/bin/sh
# ./camseq3.sh out.png '[{"which":"open","t":0},{"which":"demo","t":20}]'
npx remotion still src/index.ts CamSeq3 "$1" --props="{\"items\":$2}" --log=error
