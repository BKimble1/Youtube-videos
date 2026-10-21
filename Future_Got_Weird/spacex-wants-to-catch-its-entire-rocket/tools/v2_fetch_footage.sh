#!/usr/bin/env bash
# Fetch the real-footage clips from the repository's "Flight-Footage" release into source/public/media/real/ and verify
# them against the release's SHA-256 digests. 03_Flight14_OceanReturn_4K.mp4 is not in the release yet; when it is added,
# put it here and set HAS_OCEAN_CLIP = true in source/src/v2/timeline.tsx.
set -euo pipefail
D="$(dirname "$0")/../source/public/media/real"; mkdir -p "$D"; cd "$D"
REL=https://github.com/BKimble1/Youtube-videos/releases/download/Flight-Footage
curl -sSL -o 01_Flight5_BoosterCatch.mp4 "$REL/Flight5_Booster_Catch_Andy_Drone_20241013_1080_Short_e1547e5356.mp4"
curl -sSL -o 02_Flight14_Reentry_4K.mp4 "$REL/02_Flight14_Reentry_4K.mp4"
sha256sum -c <<'SUMS'
ca42e5367f002e451ef883fc459c9191222afd3ef836c4e98cf57f74b6226049  01_Flight5_BoosterCatch.mp4
afc817b07d1b1d4ad3dfea7da906c8be0314b95c12d4bc49094219ebc06ee1e0  02_Flight14_Reentry_4K.mp4
SUMS
