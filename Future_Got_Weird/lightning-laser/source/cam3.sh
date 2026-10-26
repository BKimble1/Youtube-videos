#!/bin/sh
# V3 3D camera test: ./cam3.sh out.png '[{"cam":[px,py,pz,tx,ty,tz,f,roll],"st":"open","t":0.5}, ...]'
npx remotion still src/index.ts CamTest3 "$1" --props="{\"items\":$2}" --log=error
