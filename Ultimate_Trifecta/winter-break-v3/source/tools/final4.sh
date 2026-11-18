#!/usr/bin/env bash
cd /home/user/ut/work
OUT=/home/user/ut/work/final4
S30=$(python3 -c "import json;e=json.load(open('edl4.json'));print(' '.join(c[0] for c in sorted(e['clips'],key=lambda c:-c[2])))")
./render_all.sh 1920 1080 30 $OUT $S30
ls $OUT/*.mp4 | wc -l
echo "RENDERS DONE $(date +%T)"
python3 audio/build_mix4.py $OUT audio/mix4/UT_WINTER_BREAK_V3_MIX.wav 2>&1 | grep -E "^mix|Error|line|Traceback"
python3 comp/comp3.py --edl edl4.json --shots $OUT --audio audio/mix4/UT_WINTER_BREAK_V3_MIX.wav --out /home/user/ut/work/Ultimate_Trifecta_Winter_Break_V3.mp4 --crf 16 > comp4.log 2>&1
tail -1 comp4.log
python3 qa4.py Ultimate_Trifecta_Winter_Break_V3.mp4 audio/mix4/stems qa_final4 2>&1 | grep -v Warn | tail -40
echo FINALIZED
