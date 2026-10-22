// Writes the picture's cue table (source/src/timing.ts) to JSON for the sound mix, so sound and picture share one
// authoritative timeline. usage: (bundle with esbuild, then) node export_cues.mjs audio/cues.json
import fs from 'node:fs';
import {CUE, D_IR_ROWS, D_VIS_ROWS} from '../source/src/timing';
import {DUR} from '../source/src/lib';
fs.writeFileSync(process.argv[2], JSON.stringify({DUR, CUE, D_IR_ROWS, D_VIS_ROWS}, null, 1));
console.log('wrote', process.argv[2]);
