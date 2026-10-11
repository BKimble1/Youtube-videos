#!/bin/bash
# Regenerates the V4 review sheets from the delivered MP4s (retimed cut). Run from the project root:  tools/qa_v4_sheets.sh
set -e
mkdir -p qa/v4; T=$(mktemp -d)
C=FGW_Atlas_No_Pinky_V4_Captioned_1080x1920.mp4; P=FGW_Atlas_No_Pinky_V4_1080x1920.mp4
NF=$(python3 -c "import json;print(json.load(open('audio/v4/cues_fast.json'))['total_frames'])")
ffmpeg -v error -y -i $P -vf "fps=1,scale=216:-1,tile=8x4" -frames:v 1 qa/v4/contact_sheet_clean.png
ffmpeg -v error -y -i $C -vf "fps=1,scale=216:-1,tile=8x4" -frames:v 1 qa/v4/contact_sheet_captioned.png
# true 360x640 phone-size frame at the middle of every caption cue
i=0; for m in $(python3 -c "import json;print(' '.join(f\"{(k['start']+k['end'])/2:.3f}\" for k in json.load(open('audio/v4/cues_fast.json'))['captions']))"); do
  ffmpeg -v error -y -ss $m -i $C -vframes 1 -vf "scale=360:640:flags=lanczos" $T/cap_$(printf %02d $i).png; i=$((i+1)); done
ffmpeg -v error -y -pattern_type glob -i "$T/cap_*.png" -filter_complex "tile=8x3" -frames:v 1 qa/v4/phone_360x640_captions_sheet.png
# conservative Shorts UI mock on the captioned film: lime = safe box x60-930, y240-1450; red = top 240 px and bottom 470 px; orange = right rail x930-1080, y800-1500
i=0; for m in 0.1 1.5 3.6 5.0 6.5 8.0 9.4 10.6 12.0 13.6 15.5 16.8 18.2 19.8 21.6 23.0 25.5 27.0 28.3 29.2 30.0 31.0 31.6 31.8; do
  ffmpeg -v error -y -ss $m -i $C -vframes 1 -vf "scale=270:480,drawbox=x=0:y=0:w=270:h=60:color=red@0.25:t=fill,drawbox=x=0:y=362:w=270:h=118:color=red@0.25:t=fill,drawbox=x=233:y=200:w=37:h=175:color=orange@0.25:t=fill,drawbox=x=15:y=60:w=218:h=302:color=lime@0.9:t=1" $T/sz_$(printf %02d $i).png; i=$((i+1)); done
ffmpeg -v error -y -pattern_type glob -i "$T/sz_*.png" -filter_complex "tile=8x3" -frames:v 1 qa/v4/safe_zone_overlay_sheet.png
# transition bursts (captioned film): one row per transition, consecutive frames
strip() { # name from to step
  ffmpeg -nostdin -v error -y -i $C -vf "select='between(n,$2,$3)*not(mod(n-$2,$4))',scale=150:-1,tile=8x1:padding=4:color=black" -frames:v 1 $T/tr_$1.png; }
python3 - <<PY > $T/tr.list
import json
e=json.load(open('audio/v4/cues_fast.json'))['events']; f=lambda k:e[k]['frame']
rows=[('1_tape_wipe',f('tape.wipe')-1,f('tape.wipe')+16,2),('2_B03_edge',f('slip.in')-5,f('slip.in')+2,1),('3_stamp_iris',f('iris.b04')-3,f('iris.b04')+13,2),
('4_B05A_edge',f('b05.cut_b')-47,f('b05.cut_b')-40,1),('5_B05B_edge',f('b05.cut_b')-1,f('b05.cut_b')+6,1),('6_B05C_edge',f('b05.cut_c')-1,f('b05.cut_c')+6,1),
('7_B06_edge',f('b06.slide')-1,f('b06.slide')+6,1),('8_B07_edge',f('b07.slide')-1,f('b07.slide')+6,1),('9_B09_edge',f('b09.drop')-1,f('b09.drop')+6,1),('10_tear',f('loop.tear')-1,f('loop.tear')+20,3)]
for r in rows: print(*r)
PY
while read name a b s; do strip $name $a $b $s; done < $T/tr.list
ls $T/tr_*.png | sort -V | sed 's/^/-i /' | xargs echo > $T/inputs.txt
N=$(ls $T/tr_*.png | wc -l)
ffmpeg -v error -y $(cat $T/inputs.txt) -filter_complex "vstack=inputs=$N" qa/v4/transition_bursts_sheet.png
# first / last picture and caption states: clean + captioned, frames 0-2 and the last three
for n in 0 1 2 $((NF-3)) $((NF-2)) $((NF-1)); do
  ffmpeg -v error -y -i $P -vf "select=eq(n\,$n),scale=270:-1" -vframes 1 $T/pa_$n.png
  ffmpeg -v error -y -i $C -vf "select=eq(n\,$n),scale=270:-1" -vframes 1 $T/pb_$n.png; done
ffmpeg -v error -y -i $T/pa_$((NF-3)).png -i $T/pa_$((NF-2)).png -i $T/pa_$((NF-1)).png -i $T/pa_0.png -i $T/pa_1.png -i $T/pa_2.png -filter_complex "hstack=inputs=6" $T/rowA.png
ffmpeg -v error -y -i $T/pb_$((NF-3)).png -i $T/pb_$((NF-2)).png -i $T/pb_$((NF-1)).png -i $T/pb_0.png -i $T/pb_1.png -i $T/pb_2.png -filter_complex "hstack=inputs=6" $T/rowB.png
ffmpeg -v error -y -i $T/rowA.png -i $T/rowB.png -filter_complex "vstack=inputs=2" qa/v4/loop_seam_first_last_states.png
# opening first second (frames 0..29 step 3) at phone size, captioned
ffmpeg -v error -y -i $C -vf "select='lt(n,30)*not(mod(n,3))',scale=216:-1,tile=10x1:padding=4:color=black" -frames:v 1 qa/v4/opening_first_second_frames_0-27.png
rm -rf $T
echo sheets written to qa/v4
