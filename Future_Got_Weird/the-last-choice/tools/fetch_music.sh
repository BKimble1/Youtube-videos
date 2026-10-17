#!/usr/bin/env bash
# Download the owner's supplied screen recordings (GitHub release film-audio-v1), verify them, extract the audio.
# The recordings are commercial music used for a private review edit; they are never committed to this repository.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p audio/source && cd audio/source
BASE=https://github.com/BKimble1/Youtube-videos/releases/download/film-audio-v1
fetch() { [ -f "$1" ] || curl -sSL --retry 4 -o "$1" "$BASE/$1"; echo "$2  $1" | sha256sum -c -; }
fetch Screen.Recording.2026-10-16.234600.mp4 0507e9e2a5271b538de727caab9641853c28aa85a649678afc32881682970ad1   # Portals
fetch Screen.Recording.2026-10-16.235008.mp4 ddf536f66bb79272f907c9b4d6693314b5baa1437dc3454c60e0b0ac57a4f39b   # It's Been a Long, Long Time
ffmpeg -v error -y -i Screen.Recording.2026-10-16.234600.mp4 -map 0:a:0 -c:a pcm_s24le -ar 48000 rec_234600.wav
ffmpeg -v error -y -i Screen.Recording.2026-10-16.235008.mp4 -map 0:a:0 -c:a pcm_s24le -ar 48000 rec_235008.wav
rm -f Screen.Recording.*.mp4
ls -la
