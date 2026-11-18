#!/usr/bin/env bash
cd /home/user/ut/work
OUT=/home/user/ut/work/final5
S30=$(python3 -c "import json;e=json.load(open('edl5.json'));print(' '.join(c[0] for c in sorted(e['clips'],key=lambda c:-c[2])))")
./render_all.sh 1920 1080 30 $OUT $S30
ls $OUT/*.mp4 | wc -l
echo "RENDERS DONE $(date +%T)"
python3 audio/build_mix5.py $OUT audio/mix5/UT_WINTER_BREAK_V4_MIX.wav 2>&1 | grep -E "^mix|Error|line|Traceback"
python3 comp/comp4.py --edl edl5.json --shots $OUT --audio audio/mix5/UT_WINTER_BREAK_V4_MIX.wav --out /home/user/ut/work/Ultimate_Trifecta_Winter_Break_V4.mp4 --crf 16 > comp5.log 2>&1
tail -1 comp5.log
python3 qa5.py Ultimate_Trifecta_Winter_Break_V4.mp4 audio/mix5/stems qa_final5 2>&1 | grep -v Warn | tail -40
echo FINALIZED
