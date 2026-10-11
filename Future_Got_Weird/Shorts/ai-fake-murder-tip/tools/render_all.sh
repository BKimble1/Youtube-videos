#!/usr/bin/env bash
# Native 1080x1920, 30 fps, H.264/AAC. Usage: tools/render_all.sh   (run from the episode directory)
set -euo pipefail
cd "$(dirname "$0")/../source"
HS=${REMOTION_BROWSER:-/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell}
F="--crf=16 --x264-preset=slow --color-space=bt709 --audio-bitrate=320k --browser-executable=$HS --concurrency=4"
npx remotion render src/index.ts ShortCaptioned ../FGW_AI_Fake_Murder_Tip_V1_Captioned_1080x1920.mp4 $F
npx remotion render src/index.ts Short          ../FGW_AI_Fake_Murder_Tip_V1_Clean_1080x1920.mp4 $F
