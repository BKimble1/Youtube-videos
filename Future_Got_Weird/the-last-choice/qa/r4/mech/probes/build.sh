#!/bin/bash
# usage: build.sh name   (bundles name.tsx -> name.mjs)
SRC=/home/user/Youtube-videos/Future_Got_Weird/the-last-choice/source
cd /tmp/claude-0/-home-user-Youtube-videos/4fd06f38-6715-5414-83fd-ceb37ea54d2a/scratchpad/r4/mech/lab
NODE_PATH=$SRC/node_modules $SRC/node_modules/.bin/esbuild $1.tsx --bundle --platform=node --format=esm --outfile=$1.mjs --jsx=automatic --loader:.png=empty --loader:.woff=empty --loader:.woff2=empty --log-level=warning --banner:js="import {createRequire} from 'module'; const require = createRequire(import.meta.url);"
