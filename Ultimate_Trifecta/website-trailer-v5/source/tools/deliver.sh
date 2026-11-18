#!/usr/bin/env bash
# deliver.sh: the 4K master's checksummed backup parts (GitHub refuses files over 100 MB).
# The website MP4 is encoded from the native 1080p composite (final_v5_1080.sh), not from this master.
# Run from the project folder after comp.py has written exports/UT_WEBSITE_TRAILER_V5_MASTER_4K.mp4.
set -e
N=UT_WEBSITE_TRAILER_V5
M=exports/${N}_MASTER_4K.mp4
rm -rf backup && mkdir -p backup
split -b 20M -d -a 2 $M backup/${N}_MASTER_4K.mp4.part_
(cd backup && sha256sum ${N}_MASTER_4K.mp4.part_* > ${N}_MASTER_4K.mp4.SHA256SUMS)
sha256sum $M | sed 's#exports/##' > backup/${N}_MASTER_4K.mp4.sha256
ls -la exports backup | head -40
