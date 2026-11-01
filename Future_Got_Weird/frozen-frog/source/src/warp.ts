// V4: the calmer narration is mapped onto the V3 picture's clock. Anchors are the word onsets that carry picture
// events (the stop, the liver, the sugar, the restart, the hops...), V4 time -> V3 time, joined by a monotone cubic so
// motion stays smooth (no velocity jumps); the start and the loop point map onto each other, so the loop is unchanged.
import TL from './data/timeline.json';
import TL1 from './data/timeline_v1.json';
import {LOOP_T as OLD_LOOP} from './story';

const NEW_LOOP = TL.frames / TL.fps;
const KEY_WORDS = [6, 8, 9, 16, 21, 22, 24, 25, 29, 30, 33, 39, 40, 46, 47, 49, 51, 53, 54, 56, 57, 58, 59, 62, 66];
export const ANCHORS: [number, number][] = [
  [0, 0],
  ...KEY_WORDS.map((i) => [TL.words[i].start, TL1.words[i].start] as [number, number]),
  [NEW_LOOP, OLD_LOOP],
];
/** a monotone cubic (Fritsch-Carlson) whose end slopes are the end secants, so the clock never stalls at the start
 * or the end (a zero end slope would freeze the picture for the first and last frames) */
const pchip = (t: number, k: [number, number][]) => {
  const n = k.length;
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((k[i + 1][1] - k[i][1]) / (k[i + 1][0] - k[i][0]));
  const m: number[] = [d[0]];
  for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]));
  m.push(d[n - 2]);
  if (t <= k[0][0]) return k[0][1] + (t - k[0][0]) * m[0];
  if (t >= k[n - 1][0]) return k[n - 1][1] + (t - k[n - 1][0]) * m[n - 1];
  let i = 0;
  while (t > k[i + 1][0]) i++;
  const h = k[i + 1][0] - k[i][0], s = (t - k[i][0]) / h;
  return (2 * s ** 3 - 3 * s ** 2 + 1) * k[i][1] + (s ** 3 - 2 * s ** 2 + s) * h * m[i] + (-2 * s ** 3 + 3 * s ** 2) * k[i + 1][1] + (s ** 3 - s ** 2) * h * m[i + 1];
};
/** V4 time -> the V3 picture's clock */
export const toOld = (t: number) => pchip(t, ANCHORS);
/** the V3 picture's clock -> V4 time (bisection; toOld is monotone) */
export const toNew = (o: number) => {
  let a = 0, b = NEW_LOOP;
  if (o <= 0) return o;
  if (o >= OLD_LOOP) return NEW_LOOP + (o - OLD_LOOP);
  for (let i = 0; i < 50; i++) {
    const m = (a + b) / 2;
    if (toOld(m) < o) a = m; else b = m;
  }
  return (a + b) / 2;
};
