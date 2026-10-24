// Rebuild V1 cues for the mix: block/clear, the passerby's footfalls (his landings), shot cuts.
import fs from 'node:fs';
import {DUR, FPS, FRAMES, T_BLOCK, T_CLEAR} from '../source/src/rb/beats';
import {CUTS} from '../source/src/rb/Film';
import {W_IN, W_OUT} from '../source/src/rb/shots/Aim';
import {planWalk} from '../source/src/rb/shots/walk';
const side = planWalk(470, 980, 21.7, 0.5, 0.62 * 330 * 0.93, 'f', 70 * 0.356 * 0.93);
const land = (steps: {t1: number}[], a: number, b: number) => steps.map((s) => +s.t1.toFixed(4)).filter((t) => t >= a && t < b);
const steps = [...land(side.steps, CUTS.side, CUTS.cross), ...land(W_IN.steps, CUTS.cross, CUTS.stop), ...land(W_OUT.steps, CUTS.leave, CUTS.back)];
fs.writeFileSync(process.argv[2], JSON.stringify({DUR, FPS, FRAMES, T_BLOCK, T_CLEAR, CUTS, steps, w_in: W_IN.steps, w_out: W_OUT.steps}, null, 1));
console.log('steps', steps.join(' '), 'in', W_IN.steps[0].t0.toFixed(3), 'out', W_OUT.steps[0].t0.toFixed(3));
