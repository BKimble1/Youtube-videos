// From the Death Clock pipeline (Future_Got_Weird/Shorts/death-clock, branch claude/intelligent-fermat-pz7wjt): the
// Weird Crew vector finish shared across the channel. Unchanged except where noted.
// Smoother character motion.
// 1) splineRec: keyframes interpolated with a monotone cubic (Fritsch-Carlson) per field, so a move flows through
//    its keys instead of easing to a stop at every key (the per-segment ease that made poses look robotic), and
//    never overshoots between keys. A key can be marked 'stop' (arrive at rest) or 'hit' (arrive at speed:
//    contacts and impacts).
// 2) spring: a damped spring simulated over a short window of past frames, for follow-through and overlapping
//    action (head lagging the torso, hair spikes and ears swinging, tail settling). Deterministic: frame f always
//    gives the same value, so any frame renders identically on its own.
import {clamp} from './math';

export type SKey<T> = [number, T, ('auto' | 'stop' | 'hit')?];

const tangents = (ts: number[], vs: number[], modes: ('auto' | 'stop' | 'hit')[]) => {
  const n = ts.length;
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((vs[i + 1] - vs[i]) / Math.max(1e-6, ts[i + 1] - ts[i]));
  const m: number[] = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    if (i === 0) m[i] = 0;
    else if (i === n - 1) m[i] = 0;
    else if (d[i - 1] * d[i] <= 0) m[i] = 0;
    else {
      // weighted harmonic mean (Fritsch-Butland): monotone, C1
      const w1 = 2 * (ts[i + 1] - ts[i]) + (ts[i] - ts[i - 1]);
      const w2 = (ts[i + 1] - ts[i]) + 2 * (ts[i] - ts[i - 1]);
      m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
    }
    if (modes[i] === 'stop') m[i] = 0;
    if (modes[i] === 'hit' && i > 0) m[i] = d[i - 1] * 1.6; // arrive faster than the average speed of the approach
  }
  return m;
};

const hermite = (t0: number, t1: number, v0: number, v1: number, m0: number, m1: number, t: number) => {
  const h = t1 - t0;
  const s = clamp((t - t0) / h);
  const s2 = s * s;
  const s3 = s2 * s;
  return (2 * s3 - 3 * s2 + 1) * v0 + (s3 - 2 * s2 + s) * h * m0 + (-2 * s3 + 3 * s2) * v1 + (s3 - s2) * h * m1;
};

/** Monotone cubic interpolation of a record of numbers through keyframes. */
export const splineRec = <T extends Record<string, number>>(f: number, keys: SKey<T>[]): T => {
  if (f <= keys[0][0]) return keys[0][1];
  const last = keys[keys.length - 1];
  if (f >= last[0]) return last[1];
  const ts = keys.map((k) => k[0]);
  const modes = keys.map((k) => k[2] ?? 'auto');
  let i = 0;
  while (i < keys.length - 2 && f > ts[i + 1]) i++;
  const out = {} as Record<string, number>;
  for (const k of Object.keys(keys[0][1])) {
    const vs = keys.map((kk) => (kk[1] as Record<string, number>)[k] ?? (keys[0][1] as Record<string, number>)[k]);
    const m = tangents(ts, vs, modes);
    out[k] = hermite(ts[i], ts[i + 1], vs[i], vs[i + 1], m[i], m[i + 1], f);
  }
  return out as T;
};

/** Scalar version: [frame, value, mode?][] */
export const spline = (f: number, keys: [number, number, ('auto' | 'stop' | 'hit')?][]) =>
  splineRec(
    f,
    keys.map(([t, v, m]) => [t, {v}, m] as SKey<{v: number}>),
  ).v;

/**
 * Damped spring following `target(frame)`, simulated from `window` frames back (starting at rest on the target).
 * k: stiffness per frame^2, zeta: damping ratio. Returns the spring's position at frame f.
 */
export const spring = (target: (f: number) => number, f: number, k = 0.08, zeta = 0.45, window = 45) => {
  const f0 = Math.max(0, Math.floor(f) - window);
  let x = target(f0);
  let v = 0;
  const c = 2 * zeta * Math.sqrt(k);
  const sub = 4;
  for (let g = f0; g < f; g++) {
    for (let j = 0; j < sub; j++) {
      const tg = target(g + j / sub);
      const a = k * (tg - x) - c * v;
      v += a / sub;
      x += v / sub;
    }
  }
  return x;
};

/** Follow-through offset: how far a spring trailing `target` lags behind it (0 when the target is at rest). */
export const lag = (target: (f: number) => number, f: number, k = 0.08, zeta = 0.45, window = 45) => spring(target, f, k, zeta, window) - target(f);

/**
 * Two chained springs over one sampled trajectory: the head trails the torso (spring 1), the hair trails the head
 * (spring 2). `angle(t)` is sampled once per sub-step over the window, so the cost is ~window*4 evaluations.
 * Returns the head's lag behind the torso and the hair's lag behind the head (both in the angle's units).
 */
export const chainLag = (angle: (t: number) => number, f: number, k1 = 0.11, z1 = 0.42, k2 = 0.07, z2 = 0.28, window = 40) => {
  const sub = 4;
  const f0 = Math.max(0, Math.floor(f) - window);
  let x1 = angle(f0);
  let v1 = 0;
  let x2 = x1;
  let v2 = 0;
  const c1 = 2 * z1 * Math.sqrt(k1);
  const c2 = 2 * z2 * Math.sqrt(k2);
  let tg = x1;
  for (let g = f0; g < f; g++) {
    for (let j = 0; j < sub; j++) {
      tg = angle(g + j / sub);
      v1 += (k1 * (tg - x1) - c1 * v1) / sub;
      x1 += v1 / sub;
      v2 += (k2 * (x1 - x2) - c2 * v2) / sub;
      x2 += v2 / sub;
    }
  }
  tg = angle(f);
  return {head: x1 - tg, hair: x2 - x1};
};
