#!/usr/bin/env bash
# V3.1 Cleanup: probe + full decode + loudness of the encoded audio for the two masters and the review copy.
# Usage: tools/qa_media_v3_1.sh > qa/v3_1_cleanup/ffprobe_decode_loudness.txt   (run from the episode directory)
cd "$(dirname "$0")/.."
for f in exports/FGW_AI_Fake_Murder_Tip_V3_1_Cleanup_Clean_1080x1920.mp4 exports/FGW_AI_Fake_Murder_Tip_V3_1_Cleanup_Captioned_1080x1920.mp4 exports/FGW_AI_Fake_Murder_Tip_V3_1_Cleanup_ReviewSmall_NOT_FOR_UPLOAD.mp4; do
  echo "=== $f"
  ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,profile,width,height,pix_fmt,color_space,color_transfer,color_primaries,r_frame_rate,avg_frame_rate,duration,bit_rate,nb_frames -of default=nw=1 "$f"
  ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels,duration,bit_rate -of default=nw=1 "$f"
  echo -n "container "; ffprobe -v error -show_entries format=duration,size,bit_rate -of default=nw=1:nk=0 "$f" | tr '\n' ' '; echo
  n=$(ffmpeg -v error -i "$f" -f null - 2>&1 | wc -l); echo "full decode (video+audio) error lines: $n"
  echo "loudness of the encoded audio track:"
  ffmpeg -nostats -i "$f" -vn -af ebur128=peak=true -f null - 2>&1 | sed -n '/Summary:/,$p' | grep -E "I:|LRA:|Peak:" | sed 's/^ *//'
  echo
done
