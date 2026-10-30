// Exports the picture's own event times and per-frame envelopes (from the same functions that draw the picture) to
// audio/cues.json, so every sound is placed from the picture, not from estimates.
import * as fs from 'fs';
import {TT} from '../source/src/lib/timeline';
import {FPS, FRAMES} from '../source/src/lib/core';
import {worksite} from '../source/src/shots/Worksite';
import {controls} from '../source/src/shots/Cab';
import {actAt} from '../source/src/Film';
import {SEGMENTS} from '../source/src/shots/Overlay';

const out: Record<string, unknown> = {fps: FPS, frames: FRAMES, tt: TT};
const run: number[] = [];
const cutting: number[] = [];
const open: number[] = [];
const clawV: number[] = [];
const boomV: number[] = [];
const tiltL: number[] = [];
const felt: number[] = [];
const act: string[] = [];
let prev = worksite(0);
for (let f = 0; f < FRAMES; f++) {
  const t = f / FPS;
  const s = worksite(t);
  run.push(+s.pose.run.toFixed(3));
  cutting.push(s.cutting);
  open.push(+s.pose.open.toFixed(3));
  clawV.push(+Math.hypot(s.pose.claw.w.x - prev.pose.claw.w.x, s.pose.claw.w.y - prev.pose.claw.w.y).toFixed(3));
  boomV.push(+(Math.abs(s.pose.b1 - prev.pose.b1) + Math.abs(s.pose.b2 - prev.pose.b2) + Math.abs(s.pose.l2 - prev.pose.l2) / 10).toFixed(3));
  const c = controls(t);
  tiltL.push(+c.tiltL.toFixed(3));
  felt.push(+c.felt.toFixed(3));
  act.push(actAt(t));
  prev = s;
}
const s0 = worksite(0);
Object.assign(out, {run, cutting, open, clawV, boomV, tiltL, felt, act, through: [s0.T1_THROUGH, s0.T2_THROUGH, s0.T3_THROUGH], contact: [0, s0.T2_CONTACT, s0.T3_CONTACT], segments: SEGMENTS});
fs.writeFileSync(process.argv[2] ?? 'audio/cues.json', JSON.stringify(out));
console.log('cues', FRAMES);
