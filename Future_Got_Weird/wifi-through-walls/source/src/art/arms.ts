// V2: arms posed by joint angles (forward kinematics) instead of free hand targets, so an arm can only do what a
// shoulder and an elbow can: the upper arm swings from the shoulder, the forearm flexes forward from the elbow (never
// backward), and the hand follows the forearm. The result is written as the rig's torso-space hand target
// (dc/Man.tsx lTu/lTv, rTu/rTv: u up the spine from the shoulder line, v toward his back) plus the elbow side, which
// the rig's two-bone IK then reproduces exactly.
import {DIM, manJoints, ManPose} from '../dc/Man';

const R = Math.PI / 180;
/** torso-space shoulder joints of the rig (Man.tsx: lS = Sh + 46 across - 18 down, rS = Sh - 54 across - 14 down) */
const SH = {L: {u: -18, v: 46}, R: {u: -14, v: -54}};
/** a direction in torso space: 0 = straight down the body, + = swung forward (toward his front, -v), 180 = up */
const dir = (a: number) => ({u: -Math.cos(a * R), v: -Math.sin(a * R)});

export type ArmAngles = {
  /** upper-arm swing from hanging (deg): + forward, - back; 180 is straight up */
  sh: number;
  /** elbow flexion (deg, >= 0): the forearm turns further forward than the upper arm */
  el: number;
  /** wrist bend (deg) relative to the forearm */
  wr?: number;
};

/** the rig's hand-target fields for one arm from joint angles */
export const armFK = (side_: 'L' | 'R', a: ArmAngles, s = 1): Partial<ManPose> => {
  const S = SH[side_];
  const el = Math.max(4, a.el);
  const e = dir(a.sh), f = dir(a.sh + el);
  const eu = S.u + e.u * DIM.upperArm, ev = S.v + e.v * DIM.upperArm;
  const u = eu + f.u * DIM.foreArm;
  const v = ev + f.v * DIM.foreArm;
  void s;
  // the elbow side as the rig's IK defines it: E = S + d*a + perp(d)*h*side, perp(d) = (-d.y, d.x) in screen space,
  // where torso (u, v) maps to screen (v, -u)
  const d = {x: v - S.v, y: -(u - S.u)};
  const eS = {x: ev - S.v, y: -(eu - S.u)};
  const side = eS.x * -d.y + eS.y * d.x >= 0 ? 1 : -1;
  return sideFields(side_ === 'L', u, v, side, a.wr ?? 0);
};
const sideFields = (L: boolean, u: number, v: number, side: number, wr: number): Partial<ManPose> =>
  L ? {lTu: u, lTv: v, lElb: side, lWr: wr, lW: 0} : {rTu: u, rTv: v, rElb: side, rWr: wr, rW: 0};
export const arms = (l: ArmAngles, r: ArmAngles): Partial<ManPose> => ({...armFK('L', l), ...armFK('R', r)});

/** joint angles that put this hand's wrist at a rig-local point P (the arm's own two-bone solve, elbow flexing
 *  forward); out-of-reach points are approached along the line */
export const armToward = (side: 'L' | 'R', body: ManPose, P: {x: number; y: number}): ArmAngles => {
  const j = manJoints(body);
  const a = (j.tc * Math.PI) / 180;
  const up = {x: -Math.sin(a), y: -Math.cos(a)}, px = {x: Math.cos(a), y: -Math.sin(a)};
  const d0 = {x: P.x - j.Sh.x, y: P.y - j.Sh.y};
  const u = d0.x * up.x + d0.y * up.y, v = d0.x * px.x + d0.y * px.y;
  const S = SH[side];
  const du = u - S.u, dv = v - S.v;
  const U = DIM.upperArm, F = DIM.foreArm;
  const d = Math.min(U + F - 1, Math.max(Math.abs(U - F) + 1, Math.hypot(du, dv)));
  const at = (Math.atan2(-dv, -du) * 180) / Math.PI;
  const el = 180 - (Math.acos(Math.max(-1, Math.min(1, (U * U + F * F - d * d) / (2 * U * F)))) * 180) / Math.PI;
  const al = (Math.atan2(F * Math.sin((el * Math.PI) / 180), U + F * Math.cos((el * Math.PI) / 180)) * 180) / Math.PI;
  return {sh: at - al, el};
};
export const mixArm = (a: ArmAngles, b: ArmAngles, t: number): ArmAngles => ({sh: a.sh + (b.sh - a.sh) * t, el: a.el + (b.el - a.el) * t, wr: (a.wr ?? 0) + ((b.wr ?? 0) - (a.wr ?? 0)) * t});
