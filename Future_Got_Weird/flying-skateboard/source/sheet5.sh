#!/bin/sh
# contact sheet while working: ./sheet.sh out.png "t1,t2,..." [captions]   (times in seconds, up to 12; rendered at full
# resolution, then downsampled to 1080 px wide with a Lanczos filter so thin strokes are represented faithfully)
CAP=${3:-false}
npx remotion still src/index.ts SheetV5 "$1.full.png" --props="{\"ts\":[$2],\"captions\":$CAP}" 2>&1 | grep -E "Error|error|rror:" | head -20
python3 -c "
from PIL import Image; import sys
im=Image.open('$1.full.png'); n=len('$2'.split(',')); rows=(n+3)//4
im=im.crop((0,0,4320,1920*rows)).resize((1080,480*rows),Image.LANCZOS); im.save('$1')"
rm -f "$1.full.png"
