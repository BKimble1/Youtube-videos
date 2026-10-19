#!/bin/bash
# scan.sh <from> <to> <step> <out>
H=/tmp/claude-0/-home-user-Youtube-videos/4fd06f38-6715-5414-83fd-ceb37ea54d2a/scratchpad/r4/rig/b2/h
F=$(python3 -c "print(','.join(str(f) for f in range($1,$2,$3)))")
timeout 3000 nice /opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell --no-sandbox --disable-gpu --allow-file-access-from-files --virtual-time-budget=3000000 --dump-dom "file://$H/index5.html?f=$F" 2>/dev/null | python3 -c "
import sys,re,html
t=sys.stdin.read(); m=re.search(r'<pre id=\"result\">(.*?)</pre>',t,re.S); print(html.unescape(m.group(1)) if m else 'NO RESULT')" > $4
