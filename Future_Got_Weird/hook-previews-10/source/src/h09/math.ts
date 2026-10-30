// Copied from dead-spider/source/src/dc/math.ts (fmt raised to 3 decimals: the scene is drawn in mm and zoomed up to ~270 px/mm).
// Small deterministic math, easing and keyframe helpers. Every value in the film is a pure function of the frame.

export type V = {x: number; y: number};
export const v = (x: number, y: number): V => ({x, y});
export const add = (a: V, b: V): V => ({x: a.x + b.x, y: a.y + b.y});
export const sub = (a: V, b: V): V => ({x: a.x - b.x, y: a.y - b.y});
export const mul = (a: V, s: number): V => ({x: a.x * s, y: a.y * s});
export const len = (a: V) => Math.hypot(a.x, a.y);
export const norm = (a: V): V => {
  const l = len(a) || 1;
  return {x: a.x / l, y: a.y / l};
};
export const dot = (a: V, b: V) => a.x * b.x + a.y * b.y;
export const perp = (a: V): V => ({x: -a.y, y: a.x});
export const lerpV = (a: V, b: V, t: number): V => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t});
export const rad = (d: number) => (d * Math.PI) / 180;
export const deg = (r: number) => (r * 180) / Math.PI;
/** Unit vector for an angle measured from straight DOWN, positive = counter-clockwise on screen (toward -x when pointing down). */
export const dirDown = (a: number): V => ({x: -Math.sin(rad(a)), y: Math.cos(rad(a))});
export const rot = (p: V, a: number, o: V = {x: 0, y: 0}): V => {
  const c = Math.cos(rad(a));
  const s = Math.sin(rad(a));
  const dx = p.x - o.x;
  const dy = p.y - o.y;
  return {x: o.x + dx * c - dy * s, y: o.y + dx * s + dy * c};
};

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const inv = (a: number, b: number, x: number) => clamp((x - a) / (b - a || 1));
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeIn = (t: number) => t * t * t;
export const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);
export const easeInQuad = (t: number) => t * t;
export const easeOutBack = (t: number, s = 1.4) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
/** Damped settle: overshoots then rests (used for landings). */
export const settle = (t: number, k = 3.2, w = 11) => (t <= 0 ? 0 : 1 - Math.exp(-k * t) * Math.cos(w * t));

/** Map frame range [a,b] to 0..1 with an easing. */
export const seg = (f: number, a: number, b: number, e: (t: number) => number = easeInOut) => e(inv(a, b, f));

export type Key<T> = [number, T, ((t: number) => number)?];
/** Keyframed number track. Each key's easing applies to the segment that ENDS at that key. */
export const track = (f: number, keys: Key<number>[]): number => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, a] = keys[i];
    const [f1, b, e] = keys[i + 1];
    if (f <= f1) return lerp(a, b, (e ?? easeInOut)(inv(f0, f1, f)));
  }
  return keys[keys.length - 1][1];
};

/** Keyframed record of numbers (poses). All keys must share the same fields. */
export const trackRec = <T extends Record<string, number>>(f: number, keys: Key<T>[]): T => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, a] = keys[i];
    const [f1, b, e] = keys[i + 1];
    if (f <= f1) {
      const t = (e ?? easeInOut)(inv(f0, f1, f));
      const o = {} as Record<string, number>;
      for (const k of Object.keys(a)) o[k] = lerp(a[k], (b as Record<string, number>)[k] ?? a[k], t);
      return o as T;
    }
  }
  return keys[keys.length - 1][1];
};

/** Seeded PRNG (mulberry32). */
export const rng = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
/** Stable hash-noise in [0,1) for an integer index and seed. */
export const hash = (i: number, seed = 0) => {
  let h = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(seed + 0x27d4eb2f, 0xc2b2ae35);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  return (h >>> 0) / 4294967296;
};
/** Smooth 1-D value noise in [-1,1]. */
export const noise1 = (x: number, seed = 0) => {
  const i = Math.floor(x);
  const t = smooth(x - i);
  return lerp(hash(i, seed), hash(i + 1, seed), t) * 2 - 1;
};

export const fmt = (n: number) => (Math.abs(n) < 1e-6 ? '0' : n.toFixed(3));
export const P = (p: V) => `${fmt(p.x)},${fmt(p.y)}`;
