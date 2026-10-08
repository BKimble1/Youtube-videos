#!/bin/bash
# Sample free space on / and the size of new /tmp entries (Remotion bundle, render dir, assets dir, Chrome profile)
# every 0.5 s until the stop file exists.
# usage: diskmon.sh <logfile> <stopfile> <baseline_ls_file>
LOG=$1
STOP=$2
BASE=$3
echo "ts avail_bytes new_tmp_bytes out_dir_bytes biggest_new" > "$LOG"
while [ ! -e "$STOP" ]; do
  a=$(df -B1 --output=avail / | tail -1)
  new=$(ls -A /tmp | grep -vxF -f "$BASE" | grep -v '^claude-0$')
  t=0; big=""
  if [ -n "$new" ]; then
    sizes=$(cd /tmp && echo "$new" | xargs -d '\n' du -sb 2>/dev/null | sort -n)
    t=$(echo "$sizes" | awk '{s+=$1} END {print s+0}')
    big=$(echo "$sizes" | tail -2 | awk '{printf "%s:%d;", $2, $1}')
  fi
  o=$(du -sb /home/user/Youtube-videos/Future_Got_Weird/Video_01_V2/qa/v3_inspect/assets4k 2>/dev/null | awk '{print $1}')
  echo "$(date +%s.%N | cut -c1-14) $a $t $o $big" >> "$LOG"
  sleep 0.5
done
