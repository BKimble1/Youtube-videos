// Frames copied from Future_Got_Weird/zombie-ant/source/src/core/frame.ts (x forward, y left, z up).
// and dorsal/up (u) axes, with l = u x f, so local (x, y, z) = (forward, left, up).
import {add3, cross3, dot3, len3, lerp3, mul3, norm3, sub3, V3} from '../../shared/three';

export type Frame = {o: V3; f: V3; l: V3; u: V3};

export const frame = (o: V3, f: V3, u: V3): Frame => {
  const F = norm3(f);
  const U = norm3(sub3(u, mul3(F, dot3(u, F))));
  return {o, f: F, l: cross3(U, F), u: U};
};
/** local -> world */
export const toW = (F: Frame, p: V3): V3 => add3(F.o, add3(mul3(F.f, p[0]), add3(mul3(F.l, p[1]), mul3(F.u, p[2]))));
/** local direction -> world direction */
export const dirW = (F: Frame, d: V3): V3 => add3(mul3(F.f, d[0]), add3(mul3(F.l, d[1]), mul3(F.u, d[2])));
/** world -> local */
export const toL = (F: Frame, p: V3): V3 => {
  const d = sub3(p, F.o);
  return [dot3(d, F.f), dot3(d, F.l), dot3(d, F.u)];
};
/** rotate a vector about a unit axis by deg (Rodrigues) */
export const rotA = (v: V3, axis: V3, deg: number): V3 => {
  const a = norm3(axis);
  const th = (deg * Math.PI) / 180, c = Math.cos(th), s = Math.sin(th);
  return add3(add3(mul3(v, c), mul3(cross3(a, v), s)), mul3(a, dot3(a, v) * (1 - c)));
};
/** rotate a frame's axes about a world axis through a pivot */
export const rotF = (F: Frame, axis: V3, deg: number, pivot: V3 = F.o): Frame => ({
  o: add3(pivot, rotA(sub3(F.o, pivot), axis, deg)),
  f: rotA(F.f, axis, deg),
  l: rotA(F.l, axis, deg),
  u: rotA(F.u, axis, deg),
});
/** pitch (nose down for +deg) about the frame's own left axis */
export const pitchF = (F: Frame, deg: number, pivot: V3 = F.o) => rotF(F, F.l, deg, pivot);
/** yaw (to the left for +deg) about the frame's own up axis */
export const yawF = (F: Frame, deg: number, pivot: V3 = F.o) => rotF(F, F.u, deg, pivot);
/** roll (left side up for -deg) about the frame's forward axis */
export const rollF = (F: Frame, deg: number, pivot: V3 = F.o) => rotF(F, F.f, deg, pivot);
/** blend frames (axes re-orthonormalised) */
export const lerpF = (a: Frame, b: Frame, t: number): Frame => frame(lerp3(a.o, b.o, t), lerp3(a.f, b.f, t), lerp3(a.u, b.u, t));
/** slerp-like frame blend for large rotations: rotate a toward b about the shortest axis */
export const slerpF = (a: Frame, b: Frame, t: number): Frame => {
  // rotation taking a's axes to b's: find axis/angle from the matrix R = B A^T
  const A = [a.f, a.l, a.u], B = [b.f, b.l, b.u];
  const R: number[][] = [0, 1, 2].map((i) => [0, 1, 2].map((j) => A.reduce((s, _, k) => s + B[k][i] * A[k][j], 0)));
  const tr = R[0][0] + R[1][1] + R[2][2];
  const ang = Math.acos(Math.max(-1, Math.min(1, (tr - 1) / 2)));
  const o = lerp3(a.o, b.o, t);
  if (ang < 1e-5) return {...a, o};
  let ax: V3 = [R[2][1] - R[1][2], R[0][2] - R[2][0], R[1][0] - R[0][1]];
  if (len3(ax) < 1e-6) {
    // 180 degrees: any axis perpendicular-ish works; use the diagonal
    const i = R[0][0] >= R[1][1] && R[0][0] >= R[2][2] ? 0 : R[1][1] >= R[2][2] ? 1 : 2;
    ax = [0, 0, 0];
    ax[i] = 1;
  }
  const deg = (ang * 180) / Math.PI * t;
  const r = rotF({...a, o}, norm3(ax), deg, o);
  return r;
};
