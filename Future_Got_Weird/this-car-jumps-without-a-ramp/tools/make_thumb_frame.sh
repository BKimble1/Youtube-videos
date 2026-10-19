#!/usr/bin/env bash
# Thumbnail source frame: V2 recording frame 386 (the U9 clear of the pavement), cropped to 16:9 inside the picture area.
# BYD's on-screen distance graphic (a thin line and a pill under the car) is covered with two patches of plain pavement taken from
# the same frame, a few rows lower. The car, sky and shadow are untouched. -> source/public/footage/thumb_frame.png (Git-ignored)
set -euo pipefail
cd "$(dirname "$0")/.."
ffmpeg -v error -y -i footage/source/Screen.Recording.2026-10-18.012652.mp4 -filter_complex \
 "[0:v]select=eq(n\,386),split=3[a][b][c];[b]crop=270:62:716:836[p1];[c]crop=720:14:392:850[p2];[a][p1]overlay=716:768[t1];[t1][p2]overlay=392:792,crop=1260:709:391:131" \
 -frames:v 1 source/public/footage/thumb_frame.png
