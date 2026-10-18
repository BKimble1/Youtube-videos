// Perspective camera for the R2 battlefield. World units are METRES: x = east, y = up, z = south (north is −z).
// A character 1.75 m tall is drawn by the 2D rig at its own scale; `k` (pixels per metre at a point's depth) is what
// sprites use to size themselves. Everything is a pure function of the camera description.
import {V3, cross3, dot3, norm3, sub3, add3, mul3, rotAxis, rad, lerp, lerp3, clamp} from '../../kit/math';

export type Cam3 = {
  pos: V3;
  target: V3;
  /** vertical field of view in degrees (default 38) */
  fov?: number;
  /** roll in degrees, positive = clockwise on screen */
  roll?: number;
  near?: number;
  /**
   * Shift-lens vertical correction 0..1 (default SHIFT_DEFAULT): the lens is levelled toward the horizon by this share of
   * the camera's pitch (at most SHIFT_MAX_DEG) and the image is shifted so the target stays where it was framed. Verticals
   * converge less, so buildings at the frame edges stop leaning (R2 read as a near-constant tilted camera). 0 = off.
   */
  shift?: number;
};
export const SHIFT_DEFAULT = 0.55;
export const SHIFT_MAX_DEG = 12;

export type View = {
  cam: Cam3;
  pos: V3;
  r: V3; // screen right
  u: V3; // screen up
  f: V3; // forward (into the screen)
  focal: number; // pixels
  /** principal-point offset (pixels, + = down) from the shift lens */
  sy: number;
  W: number;
  H: number;
  near: number;
};

export const WORLD_UP: V3 = {x: 0, y: 1, z: 0};

export const makeView = (cam: Cam3, W = 1920, H = 1080): View => {
  const f0 = norm3(sub3(cam.target, cam.pos));
  const fov = cam.fov ?? 38;
  const focal = H / 2 / Math.tan(rad(fov) / 2);
  // shift lens: level the axis by delta (toward the horizon), keep the target framed by moving the principal point
  const theta = Math.asin(clamp(f0.y, -1, 1));
  const kv = cam.shift ?? SHIFT_DEFAULT;
  const delta = clamp(theta * kv, -rad(SHIFT_MAX_DEG), rad(SHIFT_MAX_DEG));
  let f = f0, sy = 0;
  if (Math.abs(delta) > 1e-6 && Math.abs(f0.y) < 0.995) {
    const h = norm3({x: f0.x, y: 0, z: f0.z});
    const th2 = theta - delta;
    f = norm3({x: h.x * Math.cos(th2), y: Math.sin(th2), z: h.z * Math.cos(th2)});
    sy = Math.tan(delta) * focal;
  }
  let r = cross3(f, WORLD_UP);
  if (Math.hypot(r.x, r.y, r.z) < 1e-6) r = {x: 1, y: 0, z: 0}; // looking straight up/down
  r = norm3(r);
  let u = cross3(r, f);
  if (cam.roll) {
    const a = rad(cam.roll);
    r = rotAxis(r, f, a);
    u = rotAxis(u, f, a);
    // (with a roll the shift follows the rolled image axis)
  }
  return {cam, pos: cam.pos, r, u, f, focal, sy, W, H, near: cam.near ?? 0.08};
};

/** World → view space (x right, y up, z depth along the view axis). */
export const toView = (v: View, p: V3): V3 => {
  const d = sub3(p, v.pos);
  return {x: dot3(d, v.r), y: dot3(d, v.u), z: dot3(d, v.f)};
};

export type SP = {x: number; y: number; z: number; k: number};
/** View-space point → screen (pixels). k = pixels per metre at that depth. Only valid for z > near. */
export const viewToScreen = (v: View, q: V3): SP => {
  const z = Math.max(q.z, 1e-4);
  const k = v.focal / z;
  return {x: v.W / 2 + q.x * k, y: v.H / 2 + v.sy - q.y * k, z: q.z, k};
};
export const project = (v: View, p: V3): SP => viewToScreen(v, toView(v, p));
export const inFront = (v: View, p: V3) => toView(v, p).z > v.near;

/** Heading in the ground plane, degrees: 0 = north (−z), 90 = east (+x), 180 = south, 270 = west. */
export const headingVec = (deg: number): V3 => ({x: Math.sin(rad(deg)), y: 0, z: -Math.cos(rad(deg))});
export const headingOf = (d: V3) => (Math.atan2(d.x, -d.z) * 180) / Math.PI;

/**
 * How a ground-standing figure at `pos` facing `heading` (degrees, see headingVec) is seen from this view:
 *  yaw   — the rig's yaw (same convention as the R1/R2 rig): 0 = front view (facing the camera), +90 = facing screen
 *          right, −90 = facing screen left, ±180 = back view
 *  pitch — camera elevation above the figure's horizon at chest height, degrees (positive = looking down on it)
 *  k     — pixels per metre at the figure's depth; s250 = k / 251.4 (the R1/R2 rig's scale: 440 units = 1.75 m)
 */
export const figureView = (v: View, pos: V3, heading: number, chest = 1.2) => {
  const c = sub3(v.pos, add3(pos, {x: 0, y: chest, z: 0}));
  const horiz = Math.hypot(c.x, c.z) || 1e-6;
  const toCam = headingOf(c);
  let yaw = toCam - heading;
  yaw = ((((yaw + 180) % 360) + 360) % 360) - 180;
  const pitch = (Math.atan2(c.y, horiz) * 180) / Math.PI;
  const sp = project(v, pos);
  return {x: sp.x, y: sp.y, z: sp.z, k: sp.k, s250: sp.k / 251.4, yaw, pitch};
};

/** Interpolate two camera descriptions (position, target, fov, roll). */
export const mixCam3 = (a: Cam3, b: Cam3, t: number): Cam3 => ({
  pos: lerp3(a.pos, b.pos, t),
  target: lerp3(a.target, b.target, t),
  fov: lerp(a.fov ?? 38, b.fov ?? 38, t),
  roll: lerp(a.roll ?? 0, b.roll ?? 0, t),
  near: a.near ?? b.near,
});

/** Orbit helper: camera at distance `dist` from `target`, heading `az` (deg, as headingVec, the direction FROM target TO camera), elevation `el` (deg). */
export const orbit = (target: V3, dist: number, az: number, el: number, fov = 38, roll = 0): Cam3 => {
  const h = headingVec(az);
  const ce = Math.cos(rad(el)), se = Math.sin(rad(el));
  return {pos: add3(target, {x: h.x * dist * ce, y: dist * se, z: h.z * dist * ce}), target, fov, roll};
};

/** Deterministic handheld drift / impact shake in metres (apply to pos and target). */
export const shake3 = (t: number, amp: number, seed = 0): V3 => {
  const n = (x: number, s: number) => Math.sin(x * 1.7 + s) * 0.5 + Math.sin(x * 3.1 + s * 2.3) * 0.3 + Math.sin(x * 7.3 + s * 0.7) * 0.2;
  return mul3({x: n(t * 6, seed), y: n(t * 6, seed + 11) * 0.7, z: n(t * 6, seed + 23)}, amp);
};

export const clampK = (k: number, a: number, b: number) => clamp(k, a, b);
