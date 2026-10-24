// From the Death Clock pipeline (Future_Got_Weird/Shorts/death-clock, branch claude/intelligent-fermat-pz7wjt): the
// Weird Crew vector finish shared across the channel. Unchanged except where noted.
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

// Episode palette (brief's suggested starting palette, adapted).
export const PAL = {
  sky: '#DCEFF5',
  skyDeep: '#B9DCEA',
  grass: '#95B980',
  grassDeep: '#6F9A62',
  grassLight: '#B7D19D',
  band: '#2563EB',
  bandDeep: '#173FA8',
  alert: '#EF3340',
  alertDeep: '#B5122A',
  normal: '#21B883',
  normalDeep: '#0F7F58',
  signal: '#46CFFF',
  signalDeep: '#1A8FD0',
  ink: '#172B3A',
  inkSoft: '#3A5163',
  white: '#FFFFFF',
  // character: the Weird Crew's "guesser" (Video 01 cast.ts): peach skin, red spiky hair, white tee with
  // saffron stripes, navy trousers, white shoes
  skin: '#F2C9A8',
  skinLight: '#FBE2CF',
  skinDeep: '#C98B6A',
  hair: '#C0392B',
  shirt: '#FFFFFF',
  stripe: '#FFC744',
  pants: '#2E3F5C',
  shoe: '#FFFFFF',
  // medical cutaway
  skinLayer: '#F0B595',
  fat: '#F2D27A',
  tissue: '#E58A86',
  vessel: '#C8283A',
  blood: '#9E1428',
  // dog
  dog: '#D9A35B',
  dogLight: '#F1CC8E',
  dogDeep: '#A8722F',
};
