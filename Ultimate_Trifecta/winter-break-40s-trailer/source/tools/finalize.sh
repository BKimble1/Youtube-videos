#!/usr/bin/env bash
cd /home/user/ut/work
until grep -q "QUEUE DONE" final_queue.log; do sleep 20; done
ls final1/*.mp4 | wc -l
mkdir -p audio/mix
python3 audio/build_mix.py final1 audio/mix/UT_WINTER_BREAK_V1_MIX.wav 2>&1 | grep -E "^(music|sfx|mix)"
python3 comp/comp.py --edl edl.json --shots final1 --audio audio/mix/UT_WINTER_BREAK_V1_MIX.wav --out /home/user/ut/work/Ultimate_Trifecta_Winter_Break_V1.mp4 --crf 14 > comp_final.log 2>&1
tail -1 comp_final.log
python3 qa.py Ultimate_Trifecta_Winter_Break_V1.mp4 audio/mix/stems qa_final 2>&1 | grep -v Warn | tail -24
echo FINALIZED
