// Sequence C camera helpers: keyed 2D cameras that zoom about the natural fixed point (a push-in keeps its target
// still on screen), and a true perspective camera for the overhead campus and the top view of Stocco's room.
import {clamp, easeInOut, fmt, lerp} from '../dc/math';
import {CamS} from './core2';

/** similarity interpolation between two framings: log zoom about the fixed point (V1 camBetween, plus roll) */
export const camBetween = (A: CamS, B: CamS, k: number): CamS => {
  const z = A.z * Math.pow(B.z / A.z, k);
  const rot = lerp(A.rot ?? 0, B.rot ?? 0, k);
  if (Math.abs(Math.log(B.z / A.z)) < 0.03) return {x: lerp(A.x, B.x, k), y: lerp(A.y, B.y, k), z, rot};
  const px = (A.x * A.z - B.x * B.z) / (A.z - B.z);
  const py = (A.y * A.z - B.y * B.z) / (A.z - B.z);
  return {x: px - ((px - A.x) * A.z) / z, y: py - ((py - A.y) * A.z) / z, z, rot};
};
type Ease = (t: number) => number;
/** keyed camera [t, cam, ease?]: the ease applies to the segment ending at that key */
export const camPath = (t: number, ks: [number, CamS, Ease?][]): CamS => {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) {
    const [a, A] = ks[i];
    const [b, B, e] = ks[i + 1];
    if (t <= b) return A === B ? A : camBetween(A, B, (e ?? easeInOut)(clamp((t - a) / (b - a || 1e-6))));
  }
  return ks[ks.length - 1][1];
};
export const camT = (c: CamS) => `translate(960 540) rotate(${fmt(c.rot ?? 0)}) scale(${fmt(c.z)}) translate(${fmt(-c.x)} ${fmt(-c.y)})`;
/** world point -> screen point under a 2D camera (no roll) */
export const toScreen = (c: CamS, p: {x: number; y: number}) => ({x: 960 + (p.x - c.x) * c.z, y: 540 + (p.y - c.y) * c.z});

// ---------------------------------------------------------------- perspective (overhead) camera
/** camera above the ground looking straight down: (x, y) ground position, alt height, zoom lens multiplier */
export type PCam = {x: number; y: number; alt: number; zoom: number};
export const PF = 832; // focal length (px per unit at distance 1, zoom 1)
/** pixels per world unit for a layer at height h */
export const pScale = (c: PCam, h: number) => (PF * c.zoom) / Math.max(0.02, c.alt - h);
/** world point at height h -> screen */
export const pPt = (c: PCam, x: number, y: number, h: number) => {
  const s = pScale(c, h);
  return {x: 960 + (x - c.x) * s, y: 540 + (y - c.y) * s, s};
};
/** SVG transform for a flat drawing at height h (world units) */
export const pLayer = (c: PCam, h: number) => {
  const s = pScale(c, h);
  return `translate(960 540) scale(${fmt(s)}) translate(${fmt(-c.x)} ${fmt(-c.y)})`;
};
/** keyed perspective camera: alt and zoom interpolate in log space, x/y linearly */
export const pcamPath = (t: number, ks: [number, PCam, Ease?][]): PCam => {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) {
    const [a, A] = ks[i];
    const [b, B, e] = ks[i + 1];
    if (t <= b) {
      const u = (e ?? easeInOut)(clamp((t - a) / (b - a || 1e-6)));
      return {x: lerp(A.x, B.x, u), y: lerp(A.y, B.y, u), alt: Math.exp(lerp(Math.log(A.alt), Math.log(B.alt), u)), zoom: Math.exp(lerp(Math.log(A.zoom), Math.log(B.zoom), u))};
    }
  }
  return ks[ks.length - 1][1];
};
