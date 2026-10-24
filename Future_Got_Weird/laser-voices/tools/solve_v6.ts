// V6 solve: his resting left ear (EAR0, where the transmitter is aimed) and the visitor's time offsets FA/FB, so his
// body first cuts the beam on frame 815 (T_BLOCK) and clears it on frame 958 (T_CLEAR). Prints constants for stage6.ts.
import {leadAt, earOf, makeVisitor, visitorAt, beamStop, FA, FB, EAR0} from '../source/src/v6/stage6';
import {FPS, FRAMES} from '../source/src/v4/core4';

const e = earOf(leadAt(33.7));
console.log('EAR0 now', EAR0, 'measured', {x: +e.x.toFixed(3), y: +e.y.toFixed(3), z: +e.z.toFixed(3)});
const isBlocked = (t: number, fa: number, fb: number, w = makeVisitor(fa, fb)) => beamStop([visitorAt(t, w)]) < 0.985;
const first = (fa: number, fb: number, from: number, to: number, want: boolean) => {
  const w = makeVisitor(fa, fb);
  for (let f = Math.round(from * FPS); f <= Math.round(to * FPS); f++) if (isBlocked(f / FPS, fa, fb, w) === want) return f;
  return 99999;
};
const solve = (g: (x: number) => number, target: number, lo: number, hi: number) => {
  let a = lo, b = hi;
  for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (g(m) < target) a = m; else b = m; }
  let x1 = b;
  for (let k = 0; k < 40; k++) { const x = b + k * 0.001; if (g(x) === target) x1 = x; else break; }
  return (b + x1) / 2;
};
// a later approach (larger fa) blocks later; a later departure (larger fb) clears later
const fa = solve((x) => first(x, FB, 24, 31, true), 815, -2, 2);
const fb = solve((x) => first(fa, x, 29, 33.9, false), 958, -2, 1.5);
console.log(`export const FA = ${fa.toFixed(4)}, FB = ${fb.toFixed(4)};`);
const w = makeVisitor(fa, fb);
const bad: number[] = [];
for (let f = 690; f < FRAMES; f++) if (isBlocked(f / FPS, fa, fb, w) !== (f >= 815 && f < 958)) bad.push(f);
console.log('mismatched frames (S12 range)', bad.length, bad.slice(0, 20));
