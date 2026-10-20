#!/bin/bash
# usage: scripts/lab.sh <scene> [scale]   -> renders V5Lab scene still to scratchpad/lab/<scene>.png
SCR=/tmp/claude-0/-home-user-Youtube-videos/4b0ba2a1-15f6-5197-b825-5eb7ebf8651c/scratchpad/lab
cd "$(dirname "$0")/.."
PROPS="{\"scene\":\"$1\"}" node scripts/frames.mjs $SCR V5Lab 0 ${2:-1} 2>&1 | grep -v "memory\|Memory\|docker" 
mv $SCR/V5Lab_0000.png $SCR/$1.png
