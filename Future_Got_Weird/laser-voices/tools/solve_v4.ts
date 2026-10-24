// V4 solve: his standing ear (EAR0), and the friend's time offsets FA/FB so her body cuts the atrium beam exactly
// on frames 815..957 (T_BLOCK..T_CLEAR). Prints the constants for story4.ts and the frame-by-frame block check.
import {leadAt, friendAt, earOf, blocks, makeFriendWalker, FA, FB, EAR0, BLOCK_SPOT} from '../source/src/v4/story4';
import {FPS, T_BLOCK, T_CLEAR, FRAMES} from '../source/src/v4/core4';

const e = earOf(leadAt(22));
console.log('EAR0 now', EAR0, 'measured', {x: +e.x.toFixed(3), y: +e.y.toFixed(3), z: +e.z.toFixed(3)}, 'BLOCK_SPOT', BLOCK_SPOT);
const onset = (fa: number, fb: number, from: number, to: number, want: boolean) => {
  const w = makeFriendWalker(fa, fb);
  for (let f = Math.round(from * FPS); f <= Math.round(to * FPS); f++) if (blocks(friendAt(f / FPS, w)) === want) return f;
  return -1;
};
const solve = (g: (x: number) => number, target: number, lo: number, hi: number) => {
  // g increasing in x; find x with g(x) == target (frame), preferring the middle of the valid range
  let a = lo, b = hi;
  for (let i = 0; i < 40; i++) {
    const m = (a + b) / 2;
    if (g(m) < target) a = m; else b = m;
  }
  // a: largest with g < target; b: smallest with g >= target -> take middle of the interval of x where g == target
  const x0 = b;
  let x1 = x0;
  for (let k = 0; k < 60; k++) { const x = x0 + k * 0.001; if (g(x) === target) x1 = x; else break; }
  return (x0 + x1) / 2;
};
const fa = solve((x) => onset(x, FB, 25, 31, true), 815, -1.5, 1.5);
const fb = solve((x) => onset(fa, x, 30, 33.5, false), 958, -1.5, 1.2);
console.log(`export const FA = ${fa.toFixed(4)}, FB = ${fb.toFixed(4)};`);
const w = makeFriendWalker(fa, fb);
const bad: number[] = [];
for (let f = 0; f < FRAMES; f++) {
  const t = f / FPS;
  const want = f >= 815 && f < 958;
  if (blocks(friendAt(t, w)) !== want) bad.push(f);
}
console.log('mismatched frames', bad.length, bad.slice(0, 20), 'T_BLOCK', T_BLOCK, 'T_CLEAR', T_CLEAR);
