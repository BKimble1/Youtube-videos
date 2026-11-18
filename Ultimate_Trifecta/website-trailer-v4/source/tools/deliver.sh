#!/usr/bin/env bash
# deliver.sh: the 1080p website MP4 from the 4K master, and the master's backup parts.
# Run from the project folder after comp.py has written exports/UT_WEBSITE_TRAILER_V4_MASTER_4K.mp4.
set -e
N=UT_WEBSITE_TRAILER_V4
M=exports/${N}_MASTER_4K.mp4
# website MP4: 1080p H.264 High, two-pass ~5 Mb/s (capped 7.5), AAC 160k, fast start (moov first)
ffmpeg -v error -y -i $M -vf "scale=1920:1080:flags=lanczos" -c:v libx264 -preset slower -tune animation -b:v 5000k -maxrate 7500k -bufsize 10000k \
  -pass 1 -passlogfile /tmp/ut_v4_x264 -pix_fmt yuv420p -profile:v high -level 4.2 -an -f mp4 /dev/null
ffmpeg -v error -y -i $M -vf "scale=1920:1080:flags=lanczos" -c:v libx264 -preset slower -tune animation -b:v 5000k -maxrate 7500k -bufsize 10000k \
  -pass 2 -passlogfile /tmp/ut_v4_x264 -pix_fmt yuv420p -profile:v high -level 4.2 -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -c:a aac -b:a 160k -ac 2 -ar 48000 -movflags +faststart exports/${N}_WEB_1080p.mp4
# the master as checksummed 20 MB parts (GitHub refuses files over 100 MB)
rm -rf backup && mkdir -p backup
split -b 20M -d -a 2 $M backup/${N}_MASTER_4K.mp4.part_
(cd backup && sha256sum ${N}_MASTER_4K.mp4.part_* > ${N}_MASTER_4K.mp4.SHA256SUMS)
sha256sum $M | sed 's#exports/##' > backup/${N}_MASTER_4K.mp4.sha256
ls -la exports backup | head -40
