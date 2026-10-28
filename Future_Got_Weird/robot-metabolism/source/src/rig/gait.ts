// Locomotion helpers shared by the stations.
//
// Walking stick (the "ratchet" gait): the body rests on its front edge and on the stick's tip. During a push the tip
// is planted and the stick extends, so the body slides forward; between pushes the body is planted and the stick
// shortens, so its tip slides forward. Positions are integrated in closed form from the stroke list, so any frame
// renders on its own.
import {ss5} from '../lib/v3';

export type Stroke = {t0: number; t1: number; d: number};

/** strokes every `period` s from t0 (count n), each moving the body by d over the first `push` fraction */
export const strokes = (t0: number, n: number, period: number, d: number, push = 0.56): Stroke[] =>
  Array.from({length: n}, (_, i) => ({t0: t0 + i * period, t1: t0 + i * period + period * push, d}));

/** body travel (sum of completed and current pushes) */
export const bodyTravel = (S: Stroke[], t: number) => S.reduce((a, s) => a + s.d * ss5(s.t0, s.t1, t), 0);

/** stick tip travel: each push's distance is made up by the tip in the recovery after it (before the next push) */
export const tipTravel = (S: Stroke[], t: number) =>
  S.reduce((a, s, i) => {
    const r0 = s.t1 + 0.01;
    const r1 = i + 1 < S.length ? S[i + 1].t0 - 0.01 : s.t1 + (s.t1 - s.t0) * 0.8;
    return a + s.d * ss5(r0, r1, t);
  }, 0);

/** plain crawl (no stick) of a tetrahedron: the front edge reaches, then the rear vertex follows. Returns the travel
 *  of the front edge and of the rear vertex, and the rear links' extension (m) */
export const crawl = (t0: number, n: number, period: number, d: number, t: number) => {
  let front = 0, rear = 0;
  for (let i = 0; i < n; i++) {
    const a = t0 + i * period;
    front += d * ss5(a, a + period * 0.5, t);
    rear += d * ss5(a + period * 0.5, a + period, t);
  }
  return {front, rear, ext: front - rear};
};
