#!/usr/bin/env bash
# V3.1 Cleanup: native 1080x1920, 30 fps, H.264/AAC from the same Remotion compositions (ShortV3 / ShortV3Captioned). Usage: tools/render_v3_1.sh   (run from anywhere)
set -euo pipefail
cd "$(dirname "$0")/../source"
HS=${REMOTION_BROWSER:-/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell}
F="--crf=16 --x264-preset=slow --color-space=bt709 --audio-bitrate=320k --browser-executable=$HS --concurrency=4"
mkdir -p ../exports
npx remotion render src/index.ts ShortV3Captioned ../exports/FGW_AI_Fake_Murder_Tip_V3_1_Cleanup_Captioned_1080x1920.mp4 $F
npx remotion render src/index.ts ShortV3 ../exports/FGW_AI_Fake_Murder_Tip_V3_1_Cleanup_Clean_1080x1920.mp4 $F
