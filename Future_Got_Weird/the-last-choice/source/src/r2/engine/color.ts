// Small colour helpers for the cel shader (hex in, hex out; cached because shading runs per face per frame).
export type RGB = [number, number, number];

const cache = new Map<string, RGB>();
export const rgb = (hex: string): RGB => {
  let c = cache.get(hex);
  if (c) return c;
  const h = hex.replace('#', '');
  const f = h.length === 3 ? h.split('').map((x) => x + x).join('') : h;
  c = [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)];
  cache.set(hex, c);
  return c;
};
const to2 = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
export const hex = (c: RGB) => `#${to2(c[0])}${to2(c[1])}${to2(c[2])}`;
export const mixRGB = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const mix = (a: string, b: string, t: number) => hex(mixRGB(rgb(a), rgb(b), Math.max(0, Math.min(1, t))));
export const mulRGB = (a: RGB, k: number): RGB => [a[0] * k, a[1] * k, a[2] * k];
/** Multiply blend (tinting a colour by a light colour). */
export const tint = (a: RGB, light: RGB, k = 1): RGB => mixRGB(a, [(a[0] * light[0]) / 255, (a[1] * light[1]) / 255, (a[2] * light[2]) / 255], k);
/** Screen-ish additive warm spill, clamped. */
export const addRGB = (a: RGB, b: RGB, k: number): RGB => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
export const lum = (c: RGB) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
