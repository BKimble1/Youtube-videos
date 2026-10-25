// Rebuild V2 cues for the mix, all read from the picture's own geometry: the frames where his head is in the beam
// (block / clear), his footfalls (every plant's landing), the shot cuts.
import fs from 'node:fs';
import {DUR, FPS, FRAMES} from '../source/src/c2/lib';
import {beamEnd, WALKS} from '../source/src/c2/story';
import {CUT} from '../source/src/c2/shots';
const blocked: number[] = [];
for (let f = 0; f < FRAMES; f++) if (beamEnd(f / FPS).blocked) blocked.push(f);
const runs: number[][] = [];
blocked.forEach((f) => (runs.length && runs[runs.length - 1][1] === f - 1 ? (runs[runs.length - 1][1] = f) : runs.push([f, f])));
if (runs.length !== 1) throw new Error(`expected one blocked run, got ${JSON.stringify(runs)}`);
const T_BLOCK = runs[0][0] / FPS, T_CLEAR = (runs[0][1] + 1) / FPS;
const steps: number[] = [];
for (const {w, pl} of WALKS) for (const p of [...pl.L, ...pl.R]) if (p.t0 > w.t0 - 1e-6 && p.t0 < Math.min(DUR - 0.1, w.t1 + 0.5)) steps.push(+p.t0.toFixed(4));
steps.sort((a, b) => a - b);
fs.writeFileSync(process.argv[2], JSON.stringify({DUR, FPS, FRAMES, T_BLOCK, T_CLEAR, BLOCK_FRAMES: runs[0], CUT, steps}, null, 1));
console.log('block', runs[0], T_BLOCK.toFixed(3), T_CLEAR.toFixed(3), 'steps', steps.length, steps.join(' '));
