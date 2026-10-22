import {Easing, interpolate} from 'remotion';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const io = Easing.bezier(0.45, 0, 0.2, 1);
export const out = Easing.bezier(0.15, 0.7, 0.3, 1);
export const inn = Easing.bezier(0.6, 0, 0.9, 0.4);
// eased 0..1 between two frames
export const ramp = (f: number, a: number, b: number, e = io) => interpolate(f, [a, b], [0, 1], {...clamp, easing: e});
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
// keyframed value: keys = [[frame, value], ...]
export const kf = (f: number, keys: [number, number][], e = io) =>
  interpolate(f, keys.map((k) => k[0]), keys.map((k) => k[1]), {...clamp, easing: e});
// deterministic hash noise in [0,1)
export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
