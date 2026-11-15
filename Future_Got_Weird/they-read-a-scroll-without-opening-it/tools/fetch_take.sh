#!/bin/bash
# usage: fetch_take.sh <name.mp3> <url> <word_count>   download a take, report duration, pauses and wpm
cd "$(dirname "$0")/../audio/narration/takes"
curl -sS -o "$1" "$2"
d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$1")
sil=$(ffmpeg -hide_banner -i "$1" -af silencedetect=n=-40dB:d=0.12 -f null - 2>&1 | grep -o 'silence_duration: [0-9.]*' | awk '{s+=$2} END {print s+0}')
python3 -c "d=$d;s=$sil;n=$3;print('$1', 'dur %.2f'%d, 'silence %.2f'%s, 'wpm_overall %.0f'%(n/d*60), 'wpm_voiced %.0f'%(n/(d-s)*60))"
