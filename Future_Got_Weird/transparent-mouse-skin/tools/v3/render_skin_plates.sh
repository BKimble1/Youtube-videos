#!/bin/sh
# Full-resolution skin plates for V3: <cam> <margin> <states...>. Plates are 1080*margin wide; the compositor crops.
# usage: render_skin_plates.sh <cache>
C=$1; PY=${BLPY:-/tmp/claude-0/bl/bin/python}; D=$(dirname "$0")
mkdir -p "$C/plates"
job() { cam=$1; m=$2; shift 2; w=$(python3 -c "print(int(round(1080*$m/2))*2)")
  for st in "$@"; do f="$C/plates/${cam}_${st}.exr"; [ -f "$f" ] && continue
    nice -n 5 $PY "$D/skin_scene.py" "$C" $cam $st $w ${SKIN_SPP:-32} "$f.tmp.exr" $m >/dev/null 2>&1 && mv "$f.tmp.exr" "$f" && echo "$(date +%T) $cam $st"; done; }
job HOOK 1.12 A B C K
job SIDE 1.3 A C K
job GRAZE 1.4 A C K
job APPLY 1.12 A B
job WIDE 1.15 C K
job WASH 1.12 W WC WK C K A
echo done
