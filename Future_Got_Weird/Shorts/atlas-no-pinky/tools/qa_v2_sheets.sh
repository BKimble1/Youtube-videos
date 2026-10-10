#!/bin/bash
# Regenerates the V2 review sheets from the delivered MP4s. Run from the project root.
set -e
mkdir -p qa/v2; T=$(mktemp -d)
C=FGW_Atlas_No_Pinky_V2_Captioned_1080x1920.mp4; P=FGW_Atlas_No_Pinky_V2_1080x1920.mp4
ffmpeg -v error -y -i $P -vf "fps=1,scale=216:-1,tile=9x4" -frames:v 1 qa/v2/contact_sheet_clean.png
ffmpeg -v error -y -i $C -vf "fps=1,scale=216:-1,tile=9x4" -frames:v 1 qa/v2/contact_sheet_captioned.png
# 360x640 phone-size frame at the middle of every caption cue
i=0; for m in $(python3 -c "import json;print(' '.join(f\"{(k['start']+k['end'])/2:.3f}\" for k in json.load(open('audio/cues_v2.json'))['captions']))"); do
  ffmpeg -v error -y -ss $m -i $C -vframes 1 -vf "scale=360:640:flags=lanczos" $T/cap_$(printf %02d $i).png; i=$((i+1)); done
ffmpeg -v error -y -pattern_type glob -i "$T/cap_*.png" -filter_complex "tile=7x3" -frames:v 1 qa/v2/phone_360x640_captions_sheet.png
# safe-zone mock on the captioned film: green = x120-870,y240-1450 (conservative guide); red = top 240 px and bottom 470 px
i=0; for m in 0.1 2.0 4.5 6.5 9.0 11.5 13.5 15.5 17.8 19.5 22.2 24.2 26.0 28.5 30.5 32.4 33.7; do
  ffmpeg -v error -y -ss $m -i $C -vframes 1 -vf "scale=270:480,drawbox=x=0:y=0:w=270:h=60:color=red@0.25:t=fill,drawbox=x=0:y=362:w=270:h=118:color=red@0.25:t=fill,drawbox=x=30:y=60:w=188:h=302:color=lime@0.9:t=1" $T/sz_$(printf %02d $i).png; i=$((i+1)); done
ffmpeg -v error -y -pattern_type glob -i "$T/sz_*.png" -filter_complex "tile=9x2" -frames:v 1 qa/v2/safe_zone_overlay_sheet.png
# seam pair: last 3 frames + first 3 frames of the clean MP4
for n in 1035 1036 1037 0 1 2; do ffmpeg -v error -y -i $P -vf "select=eq(n\,$n),scale=270:-1" -vframes 1 $T/seam_$n.png; done
ffmpeg -v error -y -i $T/seam_1035.png -i $T/seam_1036.png -i $T/seam_1037.png -i $T/seam_0.png -i $T/seam_1.png -i $T/seam_2.png -filter_complex "hstack=inputs=6" qa/v2/loop_seam_frames_1035-1037_0-2.png
rm -rf $T
