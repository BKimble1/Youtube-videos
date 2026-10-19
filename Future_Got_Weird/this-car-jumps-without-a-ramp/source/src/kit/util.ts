// Timing and easing helpers. Everything is a pure function of time, so renders are deterministic.

export const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
export const clamp01 = (x: number) => clamp(x, 0, 1);
/** 0 → 1 as t goes from a to b (clamped). */
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
export const smoother = (x: number) => {
  const t = clamp01(x);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const easeIn = (x: number) => Math.pow(clamp01(x), 3);
export const easeInOut = (x: number) => {
  const t = clamp01(x);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
/** Overshoot settle (back-out). */
export const backOut = (x: number, k = 1.4) => {
  const t = clamp01(x) - 1;
  return 1 + t * t * ((k + 1) * t + k);
};
/** 1 inside [a, b] with fades of length fi / fo on each side; 0 outside. */
export const win = (t: number, a: number, b: number, fi = 0.25, fo = 0.25) => Math.min(smooth(seg(t, a, a + fi)), 1 - smooth(seg(t, b - fo, b)));
/** Piecewise key interpolation: keys [[t, v], ...] with an ease between keys. */
export const keys = (t: number, k: [number, number][], ease: (x: number) => number = smooth) => {
  if (t <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) if (t <= k[i + 1][0]) return lerp(k[i][1], k[i + 1][1], ease((t - k[i][0]) / (k[i + 1][0] - k[i][0])));
  return k[k.length - 1][1];
};
/** Monotonic piecewise-linear map with eased joins (for slow-motion time warps): pairs [videoT, simT]. */
export const warp = (t: number, k: [number, number][]) => {
  if (t <= k[0][0]) return k[0][1] + (t - k[0][0]) * ((k[1][1] - k[0][1]) / (k[1][0] - k[0][0]));
  for (let i = 0; i < k.length - 1; i++) if (t <= k[i + 1][0]) return lerp(k[i][1], k[i + 1][1], (t - k[i][0]) / (k[i + 1][0] - k[i][0]));
  const n = k.length - 1;
  return k[n][1] + (t - k[n][0]) * ((k[n][1] - k[n - 1][1]) / (k[n][0] - k[n - 1][0]));
};
/**
 * Smooth monotone time-warp (Fritsch-Carlson / PCHIP): keys [videoT, simT] in ascending order. Unlike `warp`, the speed
 * changes continuously at the keys, so slow motion eases in and out instead of lurching. Outside the keys it continues
 * at the end segments' speed.
 */
export const pchip = (t: number, k: [number, number][]) => {
  const n = k.length;
  const h: number[] = [], d: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    h.push(k[i + 1][0] - k[i][0]);
    d.push((k[i + 1][1] - k[i][1]) / h[i]);
  }
  if (t <= k[0][0]) return k[0][1] + (t - k[0][0]) * d[0];
  if (t >= k[n - 1][0]) return k[n - 1][1] + (t - k[n - 1][0]) * d[n - 2];
  const m: number[] = new Array(n);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) m[i] = 0;
    else {
      const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1];
      m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
    }
  }
  let i = 0;
  while (i < n - 2 && t > k[i + 1][0]) i++;
  const s = (t - k[i][0]) / h[i];
  const s2 = s * s, s3 = s2 * s;
  return (2 * s3 - 3 * s2 + 1) * k[i][1] + (s3 - 2 * s2 + s) * h[i] * m[i] + (-2 * s3 + 3 * s2) * k[i + 1][1] + (s3 - s2) * h[i] * m[i + 1];
};
export const rand = (seed: number) => {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
/** Eye blink: 1 = open, 0 = closed. Blinks last 4 frames, every `every` frames with a seeded offset. */
export const blink = (frame: number, seed = 0, every = 110) => {
  const off = Math.floor(rand(seed) * every);
  const p = (frame + off) % every;
  if (p < 2) return 1 - p / 2;
  if (p < 4) return (p - 2) / 2;
  return 1;
};
/** Slow deterministic drift in about [-1, 1] (idle life). */
export const drift = (g: number, seed = 0, period = 120) =>
  0.65 * Math.sin((g / period + seed * 0.37) * Math.PI * 2) + 0.35 * Math.sin((g / (period * 0.61) + seed * 0.91) * Math.PI * 2);
export const deg = (r: number) => (r * 180) / Math.PI;
export const rad = (d: number) => (d * Math.PI) / 180;

/** Wheel-spin smear for fast wheels (0 = readable spokes, 1 = a smeared disc), so 30 fps never shows a wagon wheel. */
export const wheelBlur = (speedMmS: number, wheelR = 365) => {
  const degPerFrame = ((speedMmS / wheelR) * 180) / Math.PI / 30;
  return smooth((degPerFrame - 14) / 16);
};
