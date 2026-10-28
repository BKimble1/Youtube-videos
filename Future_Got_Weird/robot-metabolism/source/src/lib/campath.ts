// Camera paths: keyed cameras joined by a Catmull-Rom spline through the keys (continuous velocity through each
// interior key), with eased arrival at the first and last key. A path is a pure function of time.
import {Cam} from './r3';
import {V3} from './v3';

export type Key = [number, Cam];

const cr = (p0: number, p1: number, p2: number, p3: number, t: number, t0: number, t1: number, t2: number, t3: number) => {
  // centripetal-free (time-parametrised) Catmull-Rom: tangents from neighbouring keys' time spacing
  const m1 = ((p2 - p0) / (t2 - t0)) * (t2 - t1);
  const m2 = ((p3 - p1) / (t3 - t1)) * (t2 - t1);
  const s = t, s2 = s * s, s3 = s2 * s;
  return (2 * s3 - 3 * s2 + 1) * p1 + (s3 - 2 * s2 + s) * m1 + (-2 * s3 + 3 * s2) * p2 + (s3 - s2) * m2;
};

const flat = (c: Cam) => [c.eye.x, c.eye.y, c.eye.z, c.target.x, c.target.y, c.target.z, c.f, c.roll ?? 0, c.ox ?? 0, c.oy ?? 0];
const unflat = (a: number[]): Cam => ({eye: {x: a[0], y: a[1], z: a[2]} as V3, target: {x: a[3], y: a[4], z: a[5]} as V3, f: a[6], roll: a[7], ox: a[8], oy: a[9]});

/** ease: 'inout' eases out of the first key and into the last, 'in' only at the start, 'out' only at the end */
export const camPath = (keys: Key[], ease: 'inout' | 'in' | 'out' | 'none' = 'inout') => (t: number): Cam => {
  if (t <= keys[0][0]) return keys[0][1];
  const n = keys.length;
  if (t >= keys[n - 1][0]) return keys[n - 1][1];
  const tt = t;
  let i = 0;
  while (i < n - 2 && tt > keys[i + 1][0]) i++;
  const k0 = keys[Math.max(0, i - 1)], k1 = keys[i], k2 = keys[i + 1], k3 = keys[Math.min(n - 1, i + 2)];
  const t0 = i === 0 ? k1[0] - (k2[0] - k1[0]) : k0[0];
  const t3 = i + 2 > n - 1 ? k2[0] + (k2[0] - k1[0]) : k3[0];
  let s = (tt - k1[0]) / (k2[0] - k1[0]);
  // easing only inside the first segment (leaves rest, arrives at path speed) and the last (arrives at rest): the
  // velocity stays continuous at every interior key and every key is reached exactly at its time
  if (i === 0 && (ease === 'inout' || ease === 'in')) s = s * s * (2 - s);
  if (i === n - 2 && (ease === 'inout' || ease === 'out')) s = 1 - (1 - s) * (1 - s) * (1 + s);
  if (n === 2 && ease === 'inout') s = (tt - k1[0]) / (k2[0] - k1[0]), s = s * s * (3 - 2 * s);
  const a0 = flat(i === 0 ? k1[1] : k0[1]), a1 = flat(k1[1]), a2 = flat(k2[1]), a3 = flat(i + 2 > n - 1 ? k2[1] : k3[1]);
  return unflat(a1.map((_, j) => cr(a0[j], a1[j], a2[j], a3[j], s, t0, k1[0], k2[0], t3)));
};

export const cam = (eye: [number, number, number], target: [number, number, number], f: number, o: {roll?: number; ox?: number; oy?: number} = {}): Cam => ({
  eye: {x: eye[0], y: eye[1], z: eye[2]},
  target: {x: target[0], y: target[1], z: target[2]},
  f,
  ...o,
});
