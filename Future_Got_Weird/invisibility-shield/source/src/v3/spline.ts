// V3 motion curves. V2 keyed every channel with an ease-in-out per segment, so everything stopped at every key: the
// "pose to pose" look. V3 channels are monotone cubic Hermite splines (Fritsch-Carlson) through their keys: position
// and velocity are continuous through every key, a value only comes to rest where the motion actually holds or turns
// back (a repeated value or a local extremum), and nothing overshoots its keys (no wobble past a pose).
import {V3, v3} from '../v2/p3';

export type SKey = [number, number];
const cache = new WeakMap<SKey[], number[]>();

const tangents = (k: SKey[]): number[] => {
  const n = k.length;
  const d: number[] = [], m: number[] = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((k[i + 1][1] - k[i][1]) / Math.max(1e-9, k[i + 1][0] - k[i][0]));
  if (n === 1) return m;
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) { const tt = 3 / Math.sqrt(s); m[i] = tt * a * d[i]; m[i + 1] = tt * b * d[i]; }
  }
  // the end keys rest (a channel starts and ends at rest unless the curve is continued by another key)
  m[0] = 0; m[n - 1] = 0;
  return m;
};

/** monotone cubic through keys [t, value]; holds the end values outside the key range */
export const mc = (t: number, k: SKey[], ends: 'rest' | 'free' = 'rest'): number => {
  const n = k.length;
  if (t <= k[0][0]) return k[0][1];
  if (t >= k[n - 1][0]) return k[n - 1][1];
  let m = cache.get(k);
  if (!m) {
    m = tangents(k);
    if (ends === 'free') { m[0] = (k[1][1] - k[0][1]) / (k[1][0] - k[0][0]); m[n - 1] = (k[n - 1][1] - k[n - 2][1]) / (k[n - 1][0] - k[n - 2][0]); }
    cache.set(k, m);
  }
  let i = 0;
  while (i < n - 2 && t > k[i + 1][0]) i++;
  const [t0, v0] = k[i], [t1, v1] = k[i + 1];
  const h = t1 - t0, s = (t - t0) / h;
  const s2 = s * s, s3 = s2 * s;
  return (2 * s3 - 3 * s2 + 1) * v0 + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * v1 + (s3 - s2) * h * m[i + 1];
};
/** derivative of mc (finite difference, for velocities used by secondary motion and sound) */
export const mcd = (t: number, k: SKey[], h = 1 / 120) => (mc(t + h, k) - mc(t - h, k)) / (2 * h);

/** vector keys: each component its own monotone curve (keys are split once and cached) */
const split = new WeakMap<[number, V3][], [SKey[], SKey[], SKey[]]>();
export const mc3 = (t: number, k: [number, V3][]): V3 => {
  let s = split.get(k);
  if (!s) {
    s = [k.map(([tt, p]) => [tt, p.x] as SKey), k.map(([tt, p]) => [tt, p.y] as SKey), k.map(([tt, p]) => [tt, p.z] as SKey)];
    split.set(k, s);
  }
  return v3(mc(t, s[0]), mc(t, s[1]), mc(t, s[2]));
};

/** smooth 0..1 window with C1 edges: rises over [a, a + ra], falls over [b - rb, b] */
export const win = (t: number, a: number, b: number, ra = 0.2, rb = 0.2) => {
  const up = t <= a ? 0 : t >= a + ra ? 1 : sm((t - a) / ra);
  const dn = t >= b ? 0 : t <= b - rb ? 1 : sm((b - t) / rb);
  return Math.min(up, dn);
};
/** smootherstep (C2) */
export const sm = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * t * (t * (t * 6 - 15) + 10);
};
/** 0..1 progress of a move between a and b with smootherstep */
export const prog = (t: number, a: number, b: number) => sm((t - a) / (b - a));
/** shortest-path angle unwrap for keyed headings */
export const unwrap = (k: SKey[]): SKey[] => {
  const out: SKey[] = [];
  let prev = 0;
  k.forEach(([t, a], i) => {
    let x = a;
    if (i) { while (x - prev > Math.PI) x -= 2 * Math.PI; while (x - prev < -Math.PI) x += 2 * Math.PI; }
    out.push([t, x]);
    prev = x;
  });
  return out;
};
