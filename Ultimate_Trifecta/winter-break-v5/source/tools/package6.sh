#!/usr/bin/env bash
set -e
W=/home/user/ut/work; V=/home/user/Youtube-videos/Ultimate_Trifecta/winter-break-v5
M=$W/Ultimate_Trifecta_Winter_Break_V5.mp4; E=$W/enc6; mkdir -p $E $V/exports $V/backup $V/audio/mix $V/qa/v5
cd $E
X="-c:v libx264 -preset slow -b:v 17M -maxrate 24M -bufsize 34M -pix_fmt yuv420p -profile:v high -color_primaries bt709 -color_trc bt709 -colorspace bt709 -r 30"
ffmpeg -v error -y -i $M $X -pass 1 -an -f mp4 /dev/null
ffmpeg -v error -y -i $M $X -pass 2 -c:a aac -b:a 320k -ar 48000 -movflags +faststart $V/exports/Ultimate_Trifecta_Winter_Break_V5.mp4
rm -f $V/backup/*.part*
split -b 60M -d $M $V/backup/Ultimate_Trifecta_Winter_Break_V5_master_crf16.mp4.part
(cd $W && sha256sum Ultimate_Trifecta_Winter_Break_V5.mp4) > $V/backup/master_crf16.sha256
ffmpeg -v error -y -i $W/audio/mix6/UT_WINTER_BREAK_V5_MIX.wav -c:a flac $V/audio/mix/UT_WINTER_BREAK_V5_MIX.flac
ffmpeg -v error -y -i $W/audio/mix6/stems/music_score.wav -c:a flac $V/audio/mix/stem_music_score.flac
ffmpeg -v error -y -i $W/audio/mix6/stems/sfx.wav -c:a flac $V/audio/mix/stem_sfx.flac
cp $W/audio/mix6/UT_WINTER_BREAK_V5_MIX.json $V/audio/mix/
cp $W/qa_final6/*.jpg $W/qa_final6/*.png $W/qa_final6/report.json $V/qa/v5/
ls -la $V/exports $V/backup
echo PACKAGED
