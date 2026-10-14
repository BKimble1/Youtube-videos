// Perspective camera for the V2 engine. A shot animates a Cam3 (position, target, roll, field of view);
// makeProj turns it into a projector used by every primitive, so robot, set and effects share one geometry.
import {V3, add, cross, dot, len, lerp3, mix, norm, sub} from './math';

export const W = 1920;
export const H = 1080;

export type Cam3 = {
  pos: V3;
  target: V3;
  /** Screen roll in degrees (positive = clockwise). */
  roll?: number;
  /** Vertical field of view in degrees. */
  fov?: number;
  /** Optional screen-space offset in px (used for impact shake). */
  shake?: [number, number];
};

export type P2 = {x: number; y: number; z: number; s: number};

export type Proj = {
  cam: Cam3;
  pos: V3;
  right: V3;
  up: V3;
  fwd: V3;
  f: number;
  cx: number;
  cy: number;
  cosR: number;
  sinR: number;
  /** World point → screen (x, y in px), z = depth along the view axis, s = px per cm at that depth. */
  p: (pt: V3) => P2;
  /** Unit vector from a world point toward the camera. */
  toCam: (pt: V3) => V3;
  /** Signed depth along the view axis (negative = behind the camera). */
  depth: (pt: V3) => number;
};

export const NEAR = 8;

export const makeProj = (cam: Cam3, w = W, h = H): Proj => {
  const fwd = norm(sub(cam.target, cam.pos));
  let right = cross(fwd, [0, 1, 0]);
  if (len(right) < 1e-6) right = [1, 0, 0];
  right = norm(right);
  const up = cross(right, fwd);
  const f = (h / 2) / Math.tan(((cam.fov ?? 40) * Math.PI) / 360);
  const r = ((cam.roll ?? 0) * Math.PI) / 180;
  const cosR = Math.cos(r), sinR = Math.sin(r);
  const cx = w / 2 + (cam.shake?.[0] ?? 0), cy = h / 2 + (cam.shake?.[1] ?? 0);
  const pos = cam.pos;
  const p = (pt: V3): P2 => {
    const d = sub(pt, pos);
    const x = dot(d, right), y = dot(d, up);
    const z = Math.max(NEAR, dot(d, fwd));
    const k = f / z;
    const sx = x * k, sy = -y * k;
    return {x: cx + sx * cosR - sy * sinR, y: cy + sx * sinR + sy * cosR, z, s: k};
  };
  const toCam = (pt: V3) => norm(sub(pos, pt));
  const depth = (pt: V3) => dot(sub(pt, pos), fwd);
  return {cam, pos, right, up, fwd, f, cx, cy, cosR, sinR, p, toCam, depth};
};

/** Blend two cameras (positions and targets in straight lines; use orbit() for arcs). */
export const camMix = (a: Cam3, b: Cam3, t: number): Cam3 => ({
  pos: lerp3(a.pos, b.pos, t),
  target: lerp3(a.target, b.target, t),
  roll: mix(a.roll ?? 0, b.roll ?? 0, t),
  fov: mix(a.fov ?? 40, b.fov ?? 40, t),
});

/** Camera on a horizontal orbit around a target: angle in degrees (0 = looking along -z from +z side). */
export const orbit = (target: V3, dist: number, angleDeg: number, height: number, fov = 40, roll = 0): Cam3 => {
  const a = (angleDeg * Math.PI) / 180;
  return {pos: add(target, [Math.sin(a) * dist, height, Math.cos(a) * dist]), target, fov, roll};
};

/** Piecewise camera path: keys at local frames, eased between (ease receives 0..1). */
export type CamKey = {f: number; cam: Cam3; ease?: (t: number) => number};
export const camPath = (keys: CamKey[], frame: number): Cam3 => {
  if (frame <= keys[0].f) return keys[0].cam;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (frame <= b.f) {
      const t = (frame - a.f) / Math.max(1, b.f - a.f);
      return camMix(a.cam, b.cam, (b.ease ?? ((x: number) => x))(t));
    }
  }
  return keys[keys.length - 1].cam;
};
