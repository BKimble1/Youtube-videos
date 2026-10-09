#!/usr/bin/env bash
# Final deliverables from the one locked composition (source/src Main, audio = the final mix).
#   bash tools/make_deliverables.sh [master|upload|preview|extras|all]   (default: all)
# Writes into exports/:
#   Future_Got_Weird_Video_02_v2_MASTER_4K.mp4     3840x2160, 30 fps, H.264 High, CRF 14 slow, PNG frame capture,
#                                                  BT.709, AAC 320k. Rendered at --scale=2 from the 1920x1080
#                                                  composition: every shape and line is vector, so this is a true 4K
#                                                  render of the drawing (any generated insert would be an upscale).
#   Future_Got_Weird_Video_02_v2_UPLOAD_1080p.mp4  1920x1080, 30 fps, CRF 16 slow, PNG frame capture, AAC 320k
#   Future_Got_Weird_Video_02_v2_PREVIEW_720p.mp4  1280x720 review copy from the upload file, labelled
#                                                  "REVIEW PREVIEW · not for upload", small enough to share
#   Future_Got_Weird_Video_02_v2.srt               captions built from the final narration timing
#   Future_Got_Weird_Video_02_v2_thumbnail.png/.jpg  the recommended thumbnail (package/UPLOAD_PACKAGE.md)
set -euo pipefail
HERE=$(cd "$(dirname "$0")/.." && pwd)
OUT="$HERE/exports"
SRC="$HERE/source"
mkdir -p "$OUT"
what=${1:-all}
PFX="Future_Got_Weird_Video_02_v2"

render() { # name scale crf
  (cd "$SRC" && npx remotion render src/index.ts Main "$OUT/$1" --scale="$2" --image-format=png --crf="$3" \
    --x264-preset=slow --color-space=bt709 --audio-codec=aac --audio-bitrate=320k --concurrency=4 --log=error)
  ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames:format=duration,bit_rate,size \
    -of compact "$OUT/$1"
}

if [[ $what == master || $what == all ]]; then render "${PFX}_MASTER_4K.mp4" 2 14; fi
if [[ $what == upload || $what == all ]]; then render "${PFX}_UPLOAD_1080p.mp4" 1 16; fi
if [[ $what == preview || $what == all ]]; then
  FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
  ffmpeg -v error -y -i "$OUT/${PFX}_UPLOAD_1080p.mp4" \
    -vf "scale=1280:720:flags=lanczos,drawbox=x=16:y=16:w=414:h=40:color=black@0.55:t=fill,drawtext=fontfile=$FONT:text='REVIEW PREVIEW · not for upload':x=28:y=26:fontsize=20:fontcolor=white" \
    -c:v libx264 -preset slow -crf 27 -tune animation -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart \
    "$OUT/${PFX}_PREVIEW_720p.mp4"
  ffprobe -v error -show_entries format=duration,size -of compact "$OUT/${PFX}_PREVIEW_720p.mp4"
fi
if [[ $what == extras || $what == all ]]; then
  cp "$HERE/package/${PFX}.srt" "$OUT/${PFX}.srt"
  THUMB=$(python3 -c "import re;print(re.search(r'THUMB = .*?(thumbnails/[A-Za-z0-9_]+\.jpg)', open('$HERE/tools/make_package.py').read()).group(1))")
  base="${THUMB%_1280.jpg}"
  cp "$HERE/$base.png" "$OUT/${PFX}_thumbnail.png"
  cp "$HERE/$THUMB" "$OUT/${PFX}_thumbnail.jpg"
  ls -la "$OUT"
fi
