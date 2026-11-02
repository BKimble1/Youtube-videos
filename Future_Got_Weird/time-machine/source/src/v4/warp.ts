// V4 timing: the V3 picture retimed onto the V4 narration. Every V4 frame at time t4 shows the V3 staging at
// t3 = warp(t4): a smooth (monotone cubic, C1) time map pinned at the start of every caption phrase and every key
// reveal word, so picture and words stay locked while pauses, holds and slow passages close up. No staging, anatomy or
// continuity changes come from the retime itself; only speeds change, and smoothly (no speed steps at the knots).
import TL4 from '../data/timeline_v4.json';
import {WORDS as W3, DUR as DUR3, Caption} from '../lib';

export const DUR4: number = TL4.duration;
export const FRAMES4: number = TL4.frames;
export const CAPTIONS4 = TL4.captions as Caption[];
const W4 = TL4.words as {word: string; start: number; end: number}[];

// knots: the first word of each caption phrase and the reveal words (indices into the 61 narration words)
const CHUNK_LEN = [9, 6, 9, 4, 4, 5, 5, 6, 7, 4];
const starts: number[] = [];
CHUNK_LEN.reduce((i, n) => (starts.push(i), i + n), 0);
const key = (w: string) => w.toLowerCase().replace(/[^a-z]/g, '');
const REVEALS = ['black', 'future', 'hour', 'years', 'old', 'gone', 'space', 'time'];
const idx = new Set<number>(starts);
W3.forEach((w, i) => REVEALS.includes(key(w.word)) && idx.add(i));
const K0: [number, number][] = [[0, 0], ...[...idx].sort((a, b) => a - b).map((i) => [W4[i].start, W3[i].start] as [number, number]), [DUR4, DUR3]];
// (drop knots that crowd the previous one: the first word may start at 0)
const K: [number, number][] = K0.filter((k, i) => i === 0 || i === K0.length - 1 || (k[0] > K0[i - 1][0] + 0.05 && k[1] > K0[i - 1][1] + 0.05));

// Fritsch-Carlson monotone cubic through the knots (x = t4, y = t3)
const n = K.length;
const dx = K.slice(1).map((k, i) => k[0] - K[i][0]);
const sl = K.slice(1).map((k, i) => (k[1] - K[i][1]) / dx[i]);
const m = K.map((_, i) => (i === 0 ? sl[0] : i === n - 1 ? sl[n - 2] : sl[i - 1] * sl[i] <= 0 ? 0 : (sl[i - 1] + sl[i]) / 2));
for (let i = 0; i < n - 1; i++) {
  const a = m[i] / sl[i], b = m[i + 1] / sl[i];
  const h = a * a + b * b;
  if (h > 9) {
    const tt = 3 / Math.sqrt(h);
    m[i] = tt * a * sl[i];
    m[i + 1] = tt * b * sl[i];
  }
}
// (the loop: the same rate at both ends, so the seam does not change speed)
const mEnd = (m[0] + m[n - 1]) / 2;
m[0] = mEnd;
m[n - 1] = mEnd;
export const warp = (t4: number): number => {
  if (t4 <= 0) return 0;
  if (t4 >= DUR4) return DUR3 * (t4 / DUR4);
  let i = 0;
  while (i < n - 2 && t4 > K[i + 1][0]) i++;
  const h = dx[i], u = (t4 - K[i][0]) / h;
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2;
  return h00 * K[i][1] + h10 * h * m[i] + h01 * K[i + 1][1] + h11 * h * m[i + 1];
};
/** the inverse (for placing V3-timed sound events on the V4 timeline) */
export const unwarp = (t3: number): number => {
  let a = 0, b = DUR4;
  if (t3 <= 0) return t3 * (DUR4 / DUR3);
  if (t3 >= DUR3) return DUR4 + (t3 - DUR3) * (DUR4 / DUR3);
  for (let k = 0; k < 50; k++) {
    const c = (a + b) / 2;
    if (warp(c) < t3) a = c;
    else b = c;
  }
  return (a + b) / 2;
};
export const WARP_KNOTS = K;
