// Writes the picture's cue table (source/src/world.ts) to JSON for the sound mix, so sound and picture share one
// authoritative timeline. usage: (bundle with esbuild, then) node export_cues.mjs audio/cues.json
import fs from 'node:fs';
import {CUE, DUR, WORDS} from '../source/src/world';
fs.writeFileSync(process.argv[2], JSON.stringify({DUR, CUE, WORDS}, null, 1));
console.log('wrote', process.argv[2]);
