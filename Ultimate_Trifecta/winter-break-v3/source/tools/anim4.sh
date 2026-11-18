#!/usr/bin/env bash
# V3 review animatic: every shot natively at 30 fps (960x540), the mix, the cut
cd /home/user/ut/work
OUT=${1:-/home/user/ut/work/anim4}
W=${2:-960}; H=${3:-540}
S30=$(python3 -c "import json;e=json.load(open('edl4.json'));print(' '.join(c[0] for c in sorted(e['clips'],key=lambda c:-c[2])))")
./render_all.sh $W $H 30 $OUT $S30
ls $OUT/*.mp4 | wc -l
echo "RENDERS DONE $(date +%T)"
python3 audio/build_mix4.py $OUT $OUT/mix.wav 2>&1 | grep -E "^mix|Error|line|Traceback" 
python3 comp/comp3.py --edl edl4.json --shots $OUT --audio $OUT/mix.wav --out $OUT/review.mp4 --crf 18 > $OUT/comp.log 2>&1
tail -1 $OUT/comp.log
echo FINALIZED
