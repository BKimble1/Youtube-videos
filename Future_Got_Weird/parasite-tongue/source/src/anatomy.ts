// The fish's mouth in millimetres, shared by every view. World: x posterior (0 = the lips), y the fish's right side,
// z up (0 = the floor of the mouth at the lips). A spotted rose snapper about 40 cm long: the mouth opening is ~30 mm
// wide, the floor runs back ~46 mm to the throat, and the gill arches line the back of the cavity on both sides.
import {V3} from './core/three';
import {lerp} from './lib';

/** roof height at the lips for a gape g (0 closed .. 1 wide open) */
export const roofAt = (g: number) => 6 + 22 * g;
const tab = (T: [number, number][], u: number) => {
  if (u <= T[0][0]) return T[0][1];
  for (let i = 1; i < T.length; i++) if (u <= T[i][0]) return lerp(T[i - 1][1], T[i][1], (u - T[i - 1][0]) / (T[i][0] - T[i - 1][0]));
  return T[T.length - 1][1];
};
export const XS = [-1, 0.5, 2, 4, 6, 8.5, 11, 14, 17, 20.5, 24, 28, 32, 36, 40, 43, 46];
export const THROAT = 46;
/** half width of the cavity at depth x */
export const halfW = (x: number) => tab([[-1, 15.2], [0, 15], [8, 15.6], [20, 14.6], [32, 12.6], [46, 8.5]], x);
export const floorAt = (x: number) => tab([[-1, 0.3], [0, 0], [12, -0.8], [26, -0.6], [38, 0.8], [46, 2.4]], x);
export const roofZ = (x: number, g: number) => roofAt(g) * tab([[-1, 1], [10, 1.01], [24, 0.93], [36, 0.82], [46, 0.7]], x) + floorAt(x) * 0.3;
/** a point on the cavity wall at depth x and angle th (0 = fish's right, pi/2 = roof, -pi/2 = floor) */
export const wall = (x: number, th: number, g: number, inset = 0): V3 => {
  const W = halfW(x) - inset;
  const f = floorAt(x), r = roofZ(x, g);
  const mid = (f + r) / 2, half = (r - f) / 2 - inset;
  const c = Math.cos(th), s = Math.sin(th);
  const y = Math.sign(c) * Math.pow(Math.abs(c), 0.78) * W;
  const z = mid + Math.sign(s) * Math.pow(Math.abs(s), s < 0 ? 0.42 : 0.85) * half;
  return [x, y, z];
};
/** gill arches (depth of each arch on the side wall) */
export const ARCH_X = [31, 34.6, 38.2, 41.8];
