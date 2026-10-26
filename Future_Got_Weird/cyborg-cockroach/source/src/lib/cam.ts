// Pinhole camera: look-at with focal length in pixels; projects world (mm) to screen pixels.
import {V2, V3, cross, dot, norm, sub, add, mul} from './v3';

export type Cam = {eye: V3; fwd: V3; right: V3; up: V3; f: number; cx: number; cy: number};

export const lookAt = (eye: V3, target: V3, f: number, cx = 540, cy = 960, roll = 0, worldUp: V3 = [0, 1, 0]): Cam => {
  const fwd = norm(sub(target, eye));
  let right = norm(cross(fwd, worldUp));
  let up = cross(right, fwd);
  if (roll) {
    const c = Math.cos(roll), s = Math.sin(roll);
    const r2 = add(mul(right, c), mul(up, s));
    up = add(mul(up, c), mul(right, -s));
    right = r2;
  }
  return {eye, fwd, right, up, f, cx, cy};
};
/** depth along the view axis (mm) */
export const depth = (c: Cam, p: V3) => dot(sub(p, c.eye), c.fwd);
export const proj = (c: Cam, p: V3): V2 => {
  const d = sub(p, c.eye);
  const z = Math.max(1e-3, dot(d, c.fwd));
  return [c.cx + (dot(d, c.right) * c.f) / z, c.cy - (dot(d, c.up) * c.f) / z];
};
/** pixels per mm at a point */
export const scaleAt = (c: Cam, p: V3) => c.f / Math.max(1e-3, depth(c, p));
/** camera position in a camera-local offset (right, up, back) from a point */
export const pts = (c: Cam, ps: V3[]) => ps.map((p) => proj(c, p));
