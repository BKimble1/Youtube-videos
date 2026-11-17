// Sound cues from the picture's own timing (the same functions the shots draw from), written to audio/cues.json.
// bundle: source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=<tmp>.cjs && node <tmp>.cjs
import fs from 'node:fs';
import path from 'node:path';
import {DUR, T, W} from '../source/src/lib';
import {TR1} from '../source/src/shots/Open';
import {mechPose} from '../source/src/shots/Mech';
import {contractAt} from '../source/src/art/cells';
import {tankPose} from '../source/src/shots/Lab';

type Ev = {t: number; kind: string; v?: number; note?: string};
const ev: Ev[] = [];
const add = (t: number, kind: string, v = 1, note = '') => ev.push({t: +t.toFixed(4), kind, v: +v.toFixed(3), note});
const DT = 1 / 600;

// tail strokes: each time the bend passes its extreme and swings back (a half cycle of the antagonistic beat)
const strokes = (t0: number, t1: number, bend: (t: number) => number, kind: string, v: (t: number) => number, map = (t: number) => t) => {
  let prev = bend(t0), prevD = 0;
  for (let t = t0 + DT; t < t1; t += DT) {
    const b = bend(t), d = b - prev;
    if (prevD !== 0 && Math.sign(d) !== Math.sign(prevD) && Math.abs(b) > 0.12) add(map(t), kind, v(t));
    if (d !== 0) prevD = d;
    prev = b;
  }
};
strokes(0, T.s3, (t) => TR1.at(t).A, 'stroke', () => 1, (t) => t);
strokes(T.s14 - DUR, 0, (t) => TR1.at(t).A, 'stroke', () => 1, (t) => t + DUR);
// the demonstration: contraction of side A, the stretch, the trigger wave on B, B's contraction
const tA0 = W('one', 1, T.s6).start - 0.05;
add(tA0, 'contract', 1, 'side A contracts');
add(W('contracts', 1, T.s6).end - 0.1, 'stretch', 1, 'side B stretched by the bend');
add(W('triggering').start - 0.32, 'trigger', 1, 'the wave runs along side B');
add(W('triggering').start + 0.02, 'contract', 1, 'side B contracts');
// the cycle repeating, faster, then swimming
strokes(T.s8, T.s11, (t) => mechPose(t).A, 'contract_swim', (t) => (t < T.s9 ? 0.8 : 1));
// the time-lapse: strokes per day (quieter), the nights and the morning pipette
strokes(T.s11, T.s12 + 0.6, (t) => tankPose(t).A, 'stroke_tank', () => 0.7);
const n1 = W('matured').start + 0.2, n2 = W('actually', 2).start + 0.05;
for (const n of [n1, n2]) {
  add(n, 'night', 1);
  add(n + 0.2 * 0.6, 'pipette', 1);
}
// the cells under the microscope: one soft beat per contraction peak
for (let t = T.s4 - 0.2; t < T.s5 + 0.42; t += DT) {
  const a = contractAt(t, 1.8, 0), b = contractAt(t - DT, 1.8, 0);
  if (a >= 0.999 && b < 0.999) add(t, 'cellbeat', 1);
}
// the living heart: lub-dub on each systole (beat phase as heartBeat in shots/Lab.tsx)
const h4 = W('heart', 4).start;
for (let k = -4; k < 6; k++) {
  const t = h4 + (k + 0.14 - 0.2) / 1.25;
  if (t >= W('how').start - 0.05 && t < T.s14 + 0.25) add(t, 'heartbeat', 1);
}
// camera moves and cuts
const moves: [number, string, number, string][] = [
  [T.s2, 'whoosh_soft', 0.7, 'the orbit begins'],
  [T.s2 + 0.2, 'xray', 0.8, 'the body turns to glass'],
  [T.s3, 'cut_lab', 1, 'match cut to the bench'],
  [T.s3 + 0.28, 'click', 1, 'the tail piece docks'],
  [T.s3 + 0.32, 'whoosh_out', 0.8, 'pull back to the scientist'],
  [T.s3 + 1.02, 'whoosh_in', 1, 'rush in to the hinge'],
  [T.s5, 'whoosh_out', 0.8, 'out of the tissue'],
  [T.s5 + 0.55, 'whoosh_soft', 0.7, 'rise over the fish'],
  [T.s8 + 0.55, 'whoosh_soft', 0.8, 'swing down behind it'],
  [T.s10 + 0.05, 'xray', 0.9, 'the glass body again'],
  [T.s11, 'cut_soft', 0.8, 'the time-lapse'],
  [T.s12, 'whoosh_out', 1, 'out of the tank'],
  [T.s12 + 1.25, 'whoosh_soft', 0.7, 'pan to the model'],
  [T.s13 - 0.05, 'whoosh_in', 0.8, 'push into the model'],
  [W('how').start, 'cut_heart', 1, 'the living heart'],
  [W('how').start + 0.1, 'whoosh_in', 0.9, 'into the wall'],
  [T.s14, 'match', 1, 'heart wall to fish muscle'],
  [T.s14 + 0.1, 'whoosh_out', 0.8, 'back out to frame 0'],
];
for (const [t, k, v, n] of moves) add(t, k, v, n);
// settings, for the ambience: water | lab | micro | heart
const settings: [number, string][] = [
  [0, 'water'], [T.s3, 'lab'], [T.s4 - 0.1, 'micro'], [T.s5 + 0.3, 'water'], [T.s12 + 0.7, 'lab'], [W('how').start, 'heart'], [T.s14, 'water'],
];
ev.sort((a, b) => a.t - b.t);
const out = {DUR, T, settings, events: ev, words: {how: W('how').start, heart4: h4}};
const dst = path.resolve(process.argv[2] ?? 'audio/cues.json');
fs.writeFileSync(dst, JSON.stringify(out, null, 1));
console.log(dst, ev.length, 'events');
