// Writes the V2 hard-cut frames (qa/v2/cuts.json) so the motion scan can tell cuts from pops.
import fs from 'node:fs';
import path from 'node:path';
import {CUTS, FPS} from '../src/v3/choreo3';
const out = path.resolve(__dirname, '..', '..', 'qa', 'v3');
fs.mkdirSync(out, {recursive: true});
fs.writeFileSync(path.join(out, 'cuts.json'), JSON.stringify(CUTS.map((t) => Math.round(t * FPS))));
console.log(CUTS.map((t) => Math.round(t * FPS)).join(','));
