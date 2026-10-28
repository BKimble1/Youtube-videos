#!/bin/sh
# Every V3 plate, in order (skin, then tissue, lab and applicator). Finished plates are skipped, so it can be re-run.
# usage: render_all.sh <cache>   (log: <cache>/render.log)
D=$(dirname "$0")
"$D/render_skin_plates.sh" "$1" && "$D/render_rest.sh" "$1"
