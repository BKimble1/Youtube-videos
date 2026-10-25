#!/bin/sh
# rig probe: ./tools/probe.sh [from] [to] [step]
cd "$(dirname "$0")/.." && source/node_modules/.bin/esbuild tools/rig_probe.ts --bundle --platform=node --format=cjs --jsx=automatic --log-level=error --outfile=/tmp/glass_probe.cjs && node /tmp/glass_probe.cjs "$@"
