#!/usr/bin/env bash
cd /home/user/ut/work
OUT=/home/user/ut/work/final6
S30=$(python3 -c "import json;e=json.load(open('edl6.json'));print(' '.join(c[0] for c in sorted(e['clips'],key=lambda c:-c[2])))")
./render_all.sh 1920 1080 30 $OUT $S30
ls $OUT/*.mp4 | wc -l
echo "RENDERS DONE $(date +%T)"
python3 audio/build_mix6.py $OUT audio/mix6/UT_WINTER_BREAK_V5_MIX.wav 2>&1 | grep -E "^mix|Error|line|Traceback"
python3 comp/comp4.py --edl edl6.json --shots $OUT --audio audio/mix6/UT_WINTER_BREAK_V5_MIX.wav --out /home/user/ut/work/Ultimate_Trifecta_Winter_Break_V5.mp4 --crf 16 > comp6.log 2>&1
tail -1 comp6.log
python3 qa6.py Ultimate_Trifecta_Winter_Break_V5.mp4 audio/mix6/stems qa_final6 2>&1 | grep -v Warn | tail -40
echo FINALIZED
