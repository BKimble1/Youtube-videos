// Bundle src/sfx.ts (with the shot timing modules) and write audio/sfx_cues.json for tools/make_audio.py.
//   node tools/export_cues.mjs     (run from the episode folder)
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const out = path.resolve('source/.cue_bundle.mjs'); // inside source/ so react/remotion resolve from its node_modules
execFileSync('source/node_modules/.bin/esbuild', ['source/src/sfx.ts', '--bundle', '--platform=node', '--format=esm', '--jsx=automatic', '--loader:.css=empty', '--external:remotion', '--external:react', `--outfile=${out}`], {stdio: 'inherit'});
const m = await import(out + '?v=' + Date.now());
fs.writeFileSync('audio/sfx_cues.json', JSON.stringify({cues: m.CUES, beds: m.BEDS, score: m.SCORE, marks: m.MARKS, cuts: m.CUTS}, null, 1));
console.log('cues', m.CUES.length, 'beds', m.BEDS.length);
