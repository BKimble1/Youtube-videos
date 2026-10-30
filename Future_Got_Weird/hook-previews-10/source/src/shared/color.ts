// Colour mixing for gradient stops. Hex in, hex out.
const toRgb = (h: string): [number, number, number] => {
  const s = h.replace('#', '');
  const n = parseInt(s.length === 3 ? s.split('').map((c) => c + c).join('') : s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((x) => Math.round(Math.min(255, Math.max(0, x))).toString(16).padStart(2, '0')).join('');

export const mix = (a: string, b: string, t: number) => {
  const A = toRgb(a);
  const B = toRgb(b);
  return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
};
/** Lighten toward a warm white (the key light is warm). */
export const lit = (c: string, t: number) => mix(c, '#FFF6EA', t);
/** Darken toward a cool, slightly saturated shadow (not grey mud). */
export const shade = (c: string, t: number) => {
  const [r, g, b] = toRgb(c);
  const deep = toHex(r * 0.42, g * 0.4, b * 0.5 + 18);
  return mix(c, deep, t);
};
export const rgba = (c: string, a: number) => {
  const [r, g, b] = toRgb(c);
  return `rgba(${r},${g},${b},${a})`;
};

