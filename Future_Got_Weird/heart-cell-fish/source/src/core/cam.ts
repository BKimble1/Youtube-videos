// The episode's 3D camera. Extends the FGW 3D layer (core/three.ts, from Eel Escape V4 / Dead Spider) with a free
// "up" vector so a camera can look straight down (the overhead mechanical cutaway) and roll smoothly between views.
// World: x to screen-right in the opening view, y DOWN (gravity), z toward the opening camera. Units: 0.1 mm
// (the fish is 140 units = 14 mm long, as in Lee et al., Science 2022).
import {add3, cross3, dot3, len3, lerp3, mul3, norm3, sub3, V2, V3} from './three';

export type Cam = {eye: V3; target: V3; f: number; up?: V3; cx?: number; cy?: number};
export type Basis = {eye: V3; r: V3; u: V3; fw: V3; f: number; cx: number; cy: number};
export const WORLD_UP: V3 = [0, -1, 0];

export const basis = (c: Cam): Basis => {
  const fw = norm3(sub3(c.target, c.eye));
  const up = c.up ?? WORLD_UP;
  let r = cross3(up, fw);
  if (len3(r) < 1e-6) r = cross3([0, 0, -1], fw);
  r = norm3(r);
  const u = cross3(fw, r);
  return {eye: c.eye, r, u, fw, f: c.f, cx: c.cx ?? 540, cy: c.cy ?? 960};
};
export type SP = V2 & {s: number; z: number};
export const proj = (B: Basis, p: V3): SP => {
  const d = sub3(p, B.eye);
  const zr = dot3(d, B.fw);
  const z = Math.max(0.5, zr);
  return {x: B.cx + (B.f * dot3(d, B.r)) / z, y: B.cy - (B.f * dot3(d, B.u)) / z, s: B.f / z, z: zr};
};
export const depth = (B: Basis, p: V3) => dot3(sub3(p, B.eye), B.fw);

/** smooth camera blend: eye and target linearly, focal length geometrically, up vectors normalised */
export const lerpCam = (a: Cam, b: Cam, t: number): Cam => ({
  eye: lerp3(a.eye, b.eye, t),
  target: lerp3(a.target, b.target, t),
  f: a.f * Math.pow(b.f / a.f, t),
  up: norm3(lerp3(a.up ?? WORLD_UP, b.up ?? WORLD_UP, t)),
  cx: (a.cx ?? 540) + ((b.cx ?? 540) - (a.cx ?? 540)) * t,
  cy: (a.cy ?? 960) + ((b.cy ?? 960) - (a.cy ?? 960)) * t,
});
/** a camera orbiting a target: yaw about world y (0 = looking along -z), pitch (+ = from above), distance */
export const orbit = (target: V3, yawDeg: number, pitchDeg: number, dist: number, f: number, up?: V3): Cam => {
  const y = (yawDeg * Math.PI) / 180, p = (pitchDeg * Math.PI) / 180;
  const dir: V3 = [Math.sin(y) * Math.cos(p), -Math.sin(p), Math.cos(y) * Math.cos(p)];
  return {eye: add3(target, mul3(dir, dist)), target, f, up};
};
export {add3, sub3, mul3, norm3, dot3, cross3, len3, lerp3};
export type {V2, V3};
