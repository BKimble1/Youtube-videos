// Export the picture's event times for the mix: every effect in tools/make_audio.py is placed from these, so sound and
// picture share one timeline. In-gut crawl phases are mapped from world time to film time where they are on screen
// (S1-S3: t = tau; S7: t = tau + DUR).
import * as fs from 'fs';
import {DUR} from '../source/src/lib';
import {PHASES, POP_TIMES, crawl} from '../source/src/robot/state';
import {SCENES} from '../source/src/Film';
import {PIG_T, tickTimes} from '../source/src/scenes/pig';
import {TOOLS_T, toolsState} from '../source/src/scenes/tools';
import {labState} from '../source/src/scenes/lab';

const toFilm = (tau: number): number | null => {
  if (tau >= SCENES.s7 - DUR && tau < 0) return tau + DUR;
  if (tau >= 0 && tau < 12.3) return tau;
  return null;
};
const r3 = (x: number) => Math.round(x * 1000) / 1000;
const phases: {ph: string; t0: number; t1: number; scene: string}[] = [];
for (const [ph, t0, t1] of PHASES) {
  const f0 = toFilm(t0);
  if (f0 === null) continue;
  const f1 = f0 + (t1 - t0);
  const scene = f0 >= SCENES.s7 ? 'S7' : f0 < SCENES.s2 ? 'S1' : f0 < SCENES.s3 ? 'S2' : 'S3';
  phases.push({ph, t0: r3(f0), t1: r3(f1), scene});
}
const pops: {which: string; t: number; scene: string}[] = [];
for (const k of ['aT', 'aH'] as const) for (const tc of POP_TIMES[k]) {
  const f = toFilm(tc);
  if (f === null) continue;
  pops.push({which: k === 'aT' ? 'tail' : 'head', t: r3(f), scene: f >= SCENES.s7 ? 'S7' : f < SCENES.s2 ? 'S1' : f < SCENES.s3 ? 'S2' : 'S3'});
}
// tools: sample the state for the key moments
const tools = {...TOOLS_T};
// lab: extension and the head anchor
const lab = {extend0: 19.62, extend1: 20.5, inflate0: 20.45, pop: 20.76};
// continuous signal: the macro zoom (how close the camera is) for level by proximity
const sig: {close: number[]} = {close: []};
for (let i = 0; i <= Math.round(DUR * 100); i++) {
  const t = i / 100;
  sig.close.push(t >= SCENES.s2 && t < SCENES.s3 ? 1 : t >= SCENES.s3 && t < 7.9 ? 1 - (t - SCENES.s3) / 1.05 : t >= SCENES.s5 && t < SCENES.s6 ? 0.6 : 0);
}
void crawl; void toolsState; void labState;
fs.writeFileSync(process.argv[2], JSON.stringify({DUR, SCENES, phases, pops, pig: {...PIG_T, ticks: tickTimes().map(r3)}, tools, lab, ...sig}, null, 1));
console.log('cues ->', process.argv[2], phases.length, 'phases', pops.length, 'pops');
