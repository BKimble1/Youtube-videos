// Dump the scene windows (frame each scene starts) for the QA strip tool.
// node_modules/.bin/esbuild tools/scene_starts.ts --bundle --platform=node --format=esm --jsx=automatic --outfile=/tmp/ss.mjs && node /tmp/ss.mjs > qa/scene_starts.json
import {SCENES} from '../source/src/scenes/list';
console.log(JSON.stringify(SCENES.map((s) => ({id: s.id, from: s.from, enter: s.enter}))));
