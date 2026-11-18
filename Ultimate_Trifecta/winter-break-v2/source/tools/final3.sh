#!/usr/bin/env bash
cd /home/user/ut/work
S30=$(python3 -c "import json;e=json.load(open('edl3.json'));print(' '.join(c[0] for c in sorted(e['clips'],key=lambda c:-c[2]) if c[3]==30))")
S60=$(python3 -c "import json;e=json.load(open('edl3.json'));print(' '.join(c[0] for c in e['clips'] if c[3]==60))")
./render_all.sh 1920 1080 30 /home/user/ut/work/final3 $S30
./render_all.sh 1920 1080 60 /home/user/ut/work/final3 $S60
ls final3/*.mp4 | wc -l
echo "RENDERS DONE $(date +%T)"
python3 audio/build_mix3.py final3 audio/mix3/UT_WINTER_BREAK_V2_MIX.wav 2>&1 | grep -E "^mix|Error|line"
python3 comp/comp2.py --edl edl3.json --shots final3 --audio audio/mix3/UT_WINTER_BREAK_V2_MIX.wav --out /home/user/ut/work/Ultimate_Trifecta_Winter_Break_V2.mp4 --crf 16 > comp3.log 2>&1
tail -1 comp3.log
python3 qa3.py Ultimate_Trifecta_Winter_Break_V2.mp4 audio/mix3/stems qa_final3 2>&1 | grep -v Warn | head -60
echo FINALIZED
