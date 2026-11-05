// Time-keyed tracks (seconds of film time). Each key's easing shapes the segment that ENDS at that key.
import {easeInOut} from '../dc/math';
import {V3, v3} from '../r3/m3';

export type E = (t: number) => number;
export const io: E = easeInOut;
export const sine: E = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t);
export const lin: E = (t) => t;
export const outC: E = (t) => 1 - Math.pow(1 - t, 3);
export const inC: E = (t) => t * t * t;
export const out2: E = (t) => 1 - (1 - t) * (1 - t);
export const in2: E = (t) => t * t;

const inv = (a: number, b: number, x: number) => Math.min(1, Math.max(0, (x - a) / (b - a || 1)));

export type KN = [number, number, E?];
export const kn = (t: number, keys: KN[]): number => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a] = keys[i];
    const [t1, b, e] = keys[i + 1];
    if (t <= t1) return a + (b - a) * (e ?? sine)(inv(t0, t1, t));
  }
  return keys[keys.length - 1][1];
};
export type KV = [number, V3, E?];
export const kv = (t: number, keys: KV[]): V3 => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, a] = keys[i];
    const [t1, b, e] = keys[i + 1];
    if (t <= t1) {
      const u = (e ?? sine)(inv(t0, t1, t));
      return v3(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, a.z + (b.z - a.z) * u);
    }
  }
  return keys[keys.length - 1][1];
};
/** Catmull-Rom through keyed points with time reparameterised by the easing of the whole span: smooth curved paths
 *  (no corners at the keys) for hands and camera targets. */
export const kpath = (t: number, keys: [number, V3][], e: E = lin): V3 => {
  if (t <= keys[0][0]) return keys[0][1];
  const n = keys.length;
  if (t >= keys[n - 1][0]) return keys[n - 1][1];
  let i = 0;
  while (i < n - 2 && t > keys[i + 1][0]) i++;
  const u = e(inv(keys[i][0], keys[i + 1][0], t));
  const p0 = keys[Math.max(0, i - 1)][1], p1 = keys[i][1], p2 = keys[i + 1][1], p3 = keys[Math.min(n - 1, i + 2)][1];
  const cr = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
  return v3(cr(p0.x, p1.x, p2.x, p3.x), cr(p0.y, p1.y, p2.y, p3.y), cr(p0.z, p1.z, p2.z, p3.z));
};
/** smooth window 0..1..0 */
export const win = (t: number, a: number, b: number, c: number, d: number) => (t < a || t > d ? 0 : t < b ? sine(inv(a, b, t)) : t <= c ? 1 : 1 - sine(inv(c, d, t)));
export const ramp = (t: number, a: number, b: number, e: E = sine) => e(inv(a, b, t));
