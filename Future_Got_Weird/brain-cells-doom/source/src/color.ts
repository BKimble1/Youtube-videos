// Colour mixing. Hex in, hex out.
const toRgb = (h: string): [number, number, number] => {
  const s = h.replace('#', '');
  const v = parseInt(s.length === 3 ? s.split('').map((c) => c + c).join('') : s, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};
const toHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((x) => Math.round(Math.min(255, Math.max(0, x))).toString(16).padStart(2, '0')).join('');
export const mix = (a: string, b: string, t: number) => {
  const A = toRgb(a), B = toRgb(b);
  return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
};
export const lit = (c: string, t: number) => mix(c, '#FFF7E6', t);
export const shade = (c: string, t: number) => {
  const [r, g, b] = toRgb(c);
  return mix(c, toHex(r * 0.35, g * 0.38, b * 0.42 + 10), t);
};
export const rgba = (c: string, a: number) => {
  const [r, g, b] = toRgb(c);
  return `rgba(${r},${g},${b},${a.toFixed(3)})`;
};
