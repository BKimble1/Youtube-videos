#!/bin/sh
# ./shot.sh out.png '[{"id":"H1","t":0,"cam":[...]}, ...]'
npx remotion still src/index.ts ShotTest "$1" --props="{\"items\":$2}" --log=error
