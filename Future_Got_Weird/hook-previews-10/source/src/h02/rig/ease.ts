// Easing, ramps and deterministic noise (every value is a pure function of its inputs).
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** 0..1 ramp of x over [a, b] */
export const ramp = (x: number, a: number, b: number) => clamp((x - a) / (b - a));
export const smooth = (t: number) => {
  const u = clamp(t);
  return u * u * (3 - 2 * u);
};
export const smoother = (t: number) => {
  const u = clamp(t);
  return u * u * u * (u * (u * 6 - 15) + 10);
};
export const easeOut = (t: number, p = 2) => 1 - Math.pow(1 - clamp(t), p);
export const easeIn = (t: number, p = 2) => Math.pow(clamp(t), p);
/** eased ramp: smoother of x over [a, b] */
export const sr = (x: number, a: number, b: number) => smoother(ramp(x, a, b));
/** piecewise keys [[x, value], ...] with smoother interpolation between keys (no overshoot) */
export const keys = (x: number, k: [number, number][]) => {
  if (x <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (x <= k[i][0]) return lerp(k[i - 1][1], k[i][1], smoother((x - k[i - 1][0]) / (k[i][0] - k[i - 1][0])));
  return k[k.length - 1][1];
};
/** piecewise linear keys */
export const keysLin = (x: number, k: [number, number][]) => {
  if (x <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (x <= k[i][0]) return lerp(k[i - 1][1], k[i][1], (x - k[i - 1][0]) / (k[i][0] - k[i - 1][0]));
  return k[k.length - 1][1];
};
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
};
/** smooth 1D value noise in [-1, 1] */
export const noise1 = (x: number, seed = 0) => {
  const i = Math.floor(x), f = x - i;
  const a = hash(i + seed * 101.3), b = hash(i + 1 + seed * 101.3);
  return (a + (b - a) * smoother(f)) * 2 - 1;
};
/** deterministic pseudo-random in [0, 1) */
export const rnd = (i: number, seed = 0) => hash(i * 12.9898 + seed * 78.233);
