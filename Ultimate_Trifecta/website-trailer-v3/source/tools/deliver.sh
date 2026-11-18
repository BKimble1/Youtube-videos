#!/usr/bin/env bash
# deliver.sh: the website and review encodes, the poster, and the master's backup parts.
# Run from the project folder after comp.py has written exports/UT_WEBSITE_TRAILER_V3_MASTER_4K.mp4.
set -e
N=UT_WEBSITE_TRAILER_V3
M=exports/${N}_MASTER_4K.mp4
POSTER_T=${POSTER_T:-1.62}
# 1080p review copy (high quality)
ffmpeg -v error -y -i $M -vf "scale=1920:1080:flags=lanczos" -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -profile:v high \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -c:a aac -b:a 256k -movflags +faststart exports/${N}_REVIEW_1080p.mp4
# website MP4 fallback: 1080p H.264, two-pass ~4.5 Mb/s, AAC 128k, fast start
ffmpeg -v error -y -i $M -vf "scale=1920:1080:flags=lanczos" -c:v libx264 -preset slow -b:v 4500k -maxrate 6500k -bufsize 9000k -pass 1 \
  -passlogfile /tmp/ut_v3_x264 -pix_fmt yuv420p -profile:v high -level 4.1 -an -f mp4 /dev/null
ffmpeg -v error -y -i $M -vf "scale=1920:1080:flags=lanczos" -c:v libx264 -preset slow -b:v 4500k -maxrate 6500k -bufsize 9000k -pass 2 \
  -passlogfile /tmp/ut_v3_x264 -pix_fmt yuv420p -profile:v high -level 4.1 -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -c:a aac -b:a 128k -ac 2 -movflags +faststart exports/${N}_WEB_1080p.mp4
# website WebM: 1080p VP9, two-pass ~3 Mb/s, Opus 128k
ffmpeg -v error -y -i $M -vf "scale=1920:1080:flags=lanczos" -c:v libvpx-vp9 -b:v 3000k -minrate 1500k -maxrate 4500k -row-mt 1 -tile-columns 2 \
  -deadline good -cpu-used 2 -pass 1 -passlogfile /tmp/ut_v3_vp9 -an -f webm /dev/null
ffmpeg -v error -y -i $M -vf "scale=1920:1080:flags=lanczos" -c:v libvpx-vp9 -b:v 3000k -minrate 1500k -maxrate 4500k -row-mt 1 -tile-columns 2 \
  -deadline good -cpu-used 2 -pass 2 -passlogfile /tmp/ut_v3_vp9 -c:a libopus -b:a 128k exports/${N}_WEB_1080p.webm
# poster: one frame of the master, 1920x1080 JPEG (and WebP)
ffmpeg -v error -y -ss $POSTER_T -i $M -frames:v 1 -vf "scale=1920:1080:flags=lanczos" -q:v 2 exports/${N}_POSTER.jpg
ffmpeg -v error -y -ss $POSTER_T -i $M -frames:v 1 -vf "scale=1920:1080:flags=lanczos" -c:v libwebp -quality 88 exports/${N}_POSTER.webp
# the master as checksummed 20 MB parts (GitHub refuses files over 100 MB)
rm -rf backup && mkdir -p backup
split -b 20M -d -a 2 $M backup/${N}_MASTER_4K.mp4.part_
(cd backup && sha256sum ${N}_MASTER_4K.mp4.part_* > ${N}_MASTER_4K.mp4.SHA256SUMS)
sha256sum $M | sed 's#exports/##' > backup/${N}_MASTER_4K.mp4.sha256
ls -la exports backup | head -40
