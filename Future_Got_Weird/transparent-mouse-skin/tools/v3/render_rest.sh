#!/bin/sh
# Tissue, lab and applicator plates for V3 (after the skin plates). usage: render_rest.sh <cache>
C=$1; PY=${BLPY:-/tmp/claude-0/bl/bin/python}; D=$(dirname "$0")
mkdir -p "$C/tissue" "$C/lab"
w() { python3 -c "print(int(round(1080*$1/2))*2)"; }
run() { f=$1; shift; [ -f "$f" ] && return; nice -n 5 $PY "$@" "$f.tmp.exr" >/dev/null 2>&1; }
for L in MN MB CN CB MASK; do f="$C/tissue/MAIN_$L.exr"; [ -f "$f" ] || { nice -n 5 $PY "$D/tissue_scene.py" MAIN $L $(w 1.25) 40 "$f.tmp.exr" 1.25 >/dev/null 2>&1 && mv "$f.tmp.exr" "$f" && echo "$(date +%T) MAIN $L"; }; done
for L in MN CN MASK; do f="$C/tissue/DYE_$L.exr"; [ -f "$f" ] || { nice -n 5 $PY "$D/tissue_scene.py" DYE $L $(w 1.15) 40 "$f.tmp.exr" 1.15 >/dev/null 2>&1 && mv "$f.tmp.exr" "$f" && echo "$(date +%T) DYE $L"; }; done
for L in BG MASK SWAB SWABWET DROP; do s=24; [ $L = BG ] && s=48; f="$C/lab/LAB_$L.exr"; [ -f "$f" ] || { nice -n 5 $PY "$D/lab_scene.py" LAB $L $(w 1.08) $s "$f.tmp.exr" HOOK 1.08 >/dev/null 2>&1 && mv "$f.tmp.exr" "$f" && echo "$(date +%T) LAB $L"; }; done
for V in HOOK APPLY; do f="$C/lab/SWAB_$V.exr"; [ -f "$f" ] || { nice -n 5 $PY "$D/lab_scene.py" SWABCAM SWABWET $(w 1.12) 32 "$f.tmp.exr" $V 1.12 >/dev/null 2>&1 && mv "$f.tmp.exr" "$f" && echo "$(date +%T) SWAB $V"; }; done
echo done
