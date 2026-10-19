// Rigid-body helpers for the machines: 3×3 rotation matrices (column vectors = local x, y, z axes in world),
// composition, "look" frames for limb segments, and two-bone IK. Machine local frames follow the engine's convention
// for an object facing heading 0: x = right, y = up, −z = forward.
import {V3, add3, sub3, mul3, dot3, cross3, norm3, len3, rad, clamp} from '../../kit/math';

/** Rotation matrix stored as its three columns (images of the local x, y, z axes). */
export type R3 = {x: V3; y: V3; z: V3};
export const I3: R3 = {x: {x: 1, y: 0, z: 0}, y: {x: 0, y: 1, z: 0}, z: {x: 0, y: 0, z: 1}};

/** R·v */
export const rmul = (R: R3, v: V3): V3 => ({
  x: R.x.x * v.x + R.y.x * v.y + R.z.x * v.z,
  y: R.x.y * v.x + R.y.y * v.y + R.z.y * v.z,
  z: R.x.z * v.x + R.y.z * v.y + R.z.z * v.z,
});
/** A·B */
export const rcomp = (A: R3, B: R3): R3 => ({x: rmul(A, B.x), y: rmul(A, B.y), z: rmul(A, B.z)});
/** transpose (inverse) */
export const rinv = (R: R3): R3 => ({x: {x: R.x.x, y: R.y.x, z: R.z.x}, y: {x: R.x.y, y: R.y.y, z: R.z.y}, z: {x: R.x.z, y: R.y.z, z: R.z.z}});

export const rotX = (deg: number): R3 => { const a = rad(deg), c = Math.cos(a), s = Math.sin(a); return {x: {x: 1, y: 0, z: 0}, y: {x: 0, y: c, z: s}, z: {x: 0, y: -s, z: c}}; };
export const rotY = (deg: number): R3 => { const a = rad(deg), c = Math.cos(a), s = Math.sin(a); return {x: {x: c, y: 0, z: -s}, y: {x: 0, y: 1, z: 0}, z: {x: s, y: 0, z: c}}; };
export const rotZ = (deg: number): R3 => { const a = rad(deg), c = Math.cos(a), s = Math.sin(a); return {x: {x: c, y: s, z: 0}, y: {x: -s, y: c, z: 0}, z: {x: 0, y: 0, z: 1}}; };
/** Heading (deg, 0 = north/−z, 90 = east/+x) as a rotation about +y — same convention as the engine's xf.yaw. */
export const rotHeading = (h: number): R3 => rotY(-h);
/** Rotation about an arbitrary unit axis. */
export const rotAxisM = (k: V3, deg: number): R3 => {
  const a = rad(deg), c = Math.cos(a), s = Math.sin(a), t = 1 - c;
  return {
    x: {x: t * k.x * k.x + c, y: t * k.x * k.y + s * k.z, z: t * k.x * k.z - s * k.y},
    y: {x: t * k.x * k.y - s * k.z, y: t * k.y * k.y + c, z: t * k.y * k.z + s * k.x},
    z: {x: t * k.x * k.z + s * k.y, y: t * k.y * k.z - s * k.x, z: t * k.z * k.z + c},
  };
};
/** Euler in local axes: yaw about y (deg, + = turn LEFT seen from above), then pitch about x (+ = nose down), then roll about z. */
export const euler = (yaw = 0, pitch = 0, roll = 0): R3 => rcomp(rcomp(rotY(yaw), rotX(-pitch)), rotZ(roll));

/**
 * Frame for a limb segment modelled hanging DOWN its local −y axis from the joint at the origin, with its front on −z.
 * `d` = world direction from this joint to the child joint; `fwd` = rough world direction the segment's front faces.
 */
export const segFrame = (d: V3, fwd: V3): R3 => {
  const y = norm3(mul3(d, -1));
  let z = sub3(mul3(fwd, -1), mul3(y, dot3(mul3(fwd, -1), y)));
  if (len3(z) < 1e-5) z = Math.abs(y.x) < 0.9 ? cross3(y, {x: 1, y: 0, z: 0}) : cross3(y, {x: 0, y: 0, z: 1});
  z = norm3(z);
  const x = cross3(y, z);
  return {x, y, z};
};
/** Frame whose −z (front) looks along `fwd` with `up` as near-up. */
export const lookFrame = (fwd: V3, up: V3 = {x: 0, y: 1, z: 0}): R3 => {
  const z = norm3(mul3(fwd, -1));
  let x = cross3(up, z);
  if (len3(x) < 1e-5) x = {x: 1, y: 0, z: 0};
  x = norm3(x);
  const y = cross3(z, x);
  return {x, y, z};
};

/** Two-bone IK: root a, target b, lengths l1, l2, pole hint (world point direction the middle joint bends toward). */
export const ik2 = (a: V3, b: V3, l1: number, l2: number, pole: V3, soft = 0, pole2?: V3): {mid: V3; end: V3; reach: number} => {
  const d = sub3(b, a);
  // (R4: not shorter than a folded limb can be: a hand or foot on top of its own root put the middle joint metres away)
  let L = clamp(len3(d), Math.abs(l1 - l2) + 0.03, (l1 + l2) * 0.9995);
  // soft limit (m): within `soft` of full stretch the reach eases in exponentially, so the middle joint never snaps
  // through the straight-limb singularity (the end stops at most `soft` short of an over-far target)
  if (soft > 0) { const s0 = (l1 + l2) * 0.9995 - soft; if (L > s0) L = s0 + soft * (1 - Math.exp(-(L - s0) / soft)); }
  const dir = norm3(d);
  const end = add3(a, mul3(dir, L));
  const x = (l1 * l1 - l2 * l2 + L * L) / (2 * L);
  const h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  let pp = sub3(pole, mul3(dir, dot3(pole, dir)));
  // secondary hint: as the limb comes into line with the pole, the bend plane is taken over continuously by pole2
  // (no flip of the middle joint when a hand / foot passes through the pole direction)
  if (pole2) {
    const pl = len3(pole) || 1;
    const x0 = clamp(len3(pp) / (0.45 * pl));
    const w = 1 - x0 * x0 * (3 - 2 * x0);
    const q = sub3(pole2, mul3(dir, dot3(pole2, dir)));
    if (w > 0 && len3(q) > 1e-6) pp = add3(pp, mul3(norm3(q), w * 0.45 * pl));
  }
  if (len3(pp) < 1e-5) pp = Math.abs(dir.y) < 0.9 ? cross3(dir, {x: 0, y: 1, z: 0}) : cross3(dir, {x: 1, y: 0, z: 0});
  pp = norm3(pp);
  return {mid: add3(add3(a, mul3(dir, x)), mul3(pp, h)), end, reach: len3(d) / (l1 + l2)};
};

/** Rigid placement: world = pos + R·local. */
export type Pose3 = {pos: V3; R: R3};
export const apply = (P: Pose3, p: V3): V3 => add3(P.pos, rmul(P.R, p));
export const child = (P: Pose3, offset: V3, R: R3 = I3): Pose3 => ({pos: apply(P, offset), R: rcomp(P.R, R)});
export const fwdOf = (R: R3): V3 => mul3(R.z, -1);
export const slerpish = (a: R3, b: R3, t: number): R3 => {
  // cheap blend + re-orthonormalise (fine for small angles and eases)
  const z = norm3(add3(mul3(a.z, 1 - t), mul3(b.z, t)));
  const yy = add3(mul3(a.y, 1 - t), mul3(b.y, t));
  const x = norm3(cross3(yy, z));
  const y = cross3(z, x);
  return {x, y, z};
};
