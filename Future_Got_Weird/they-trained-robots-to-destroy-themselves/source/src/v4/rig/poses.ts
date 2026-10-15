// V4 pose library for the vector robot rig. Poses are authored facing right (the rig mirrors for face = -1).
// Angles in degrees: + = forward. Feet are usually planted with IK targets (footN/footF) so contact is exact.
import {RPose, ArmP, LegP, Tgt} from './Robot2D';
import {SK} from './models';

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mixArm = (a: ArmP, b: ArmP, t: number): ArmP => ({sh: mix(a.sh, b.sh, t), el: mix(a.el, b.el, t), wr: mix(a.wr ?? 0, b.wr ?? 0, t), ab: mix(a.ab ?? 6, b.ab ?? 6, t), grip: mix(a.grip ?? 0.25, b.grip ?? 0.25, t)});
const mixLeg = (a: LegP, b: LegP, t: number): LegP => ({hip: mix(a.hip, b.hip, t), kn: mix(a.kn, b.kn, t), an: mix(a.an, b.an, t), ab: mix(a.ab ?? 2, b.ab ?? 2, t)});
const mixTgt = (a: Tgt | undefined, b: Tgt | undefined, t: number): Tgt | undefined =>
  a && b ? {x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), pitch: mix(a.pitch ?? 0, b.pitch ?? 0, t)} : t < 0.5 ? a : b;

export const blend = (a: RPose, b: RPose, t: number): RPose => ({
  x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), rot: mix(a.rot, b.rot, t), waist: mix(a.waist, b.waist, t),
  neck: mix(a.neck, b.neck, t), head: mix(a.head, b.head, t),
  armN: mixArm(a.armN, b.armN, t), armF: mixArm(a.armF, b.armF, t), legN: mixLeg(a.legN, b.legN, t), legF: mixLeg(a.legF, b.legF, t),
  yaw: mix(a.yaw ?? 1, b.yaw ?? 1, t), headYaw: a.headYaw !== undefined || b.headYaw !== undefined ? mix(a.headYaw ?? a.yaw ?? 1, b.headYaw ?? b.yaw ?? 1, t) : undefined,
  footN: mixTgt(a.footN, b.footN, t), footF: mixTgt(a.footF, b.footF, t), handN: mixTgt(a.handN, b.handN, t), handF: mixTgt(a.handF, b.handF, t),
});

/** Pelvis height above the sole for a straight standing leg (rig units). */
export const STAND_H = SK.TH + SK.SH + SK.ANKLE + SK.hipY; // ≈ 324
export const ANK = SK.ANKLE + 1; // sole is 31 u below the ankle

export const A = (sh: number, el: number, extra: Partial<ArmP> = {}): ArmP => ({sh, el, ...extra});
export const L = (hip: number, kn: number, an = 0, extra: Partial<LegP> = {}): LegP => ({hip, kn, an, ...extra});

/** Standing at (x, ground) with scale s; feet planted with IK a little apart. */
export const stand = (x: number, ground: number, s: number, o: Partial<RPose> = {}, face: 1 | -1 = 1): RPose => {
  const yaw = o.yaw ?? 1;
  const spread = (yaw < 0.5 ? 0 : 12) * s * face;
  return {
    x, y: ground - (STAND_H - 4) * s, rot: 0, waist: 0, neck: 0, head: 0,
    armN: A(4, 12, {grip: 0.3}), armF: A(-6, 14, {grip: 0.3}), legN: L(0, 4, 0), legF: L(0, 4, 0),
    yaw,
    footN: {x: x + spread, y: ground - ANK * s, pitch: 0},
    footF: {x: x - spread, y: ground - ANK * s, pitch: 0},
    ...o,
  };
};

/** Loaded crouch at a ledge: toes at `toeX`, arms swung back. */
export const crouch = (toeX: number, ground: number, s: number, face: 1 | -1 = 1, o: Partial<RPose> = {}): RPose => ({
  x: toeX - 74 * s * face, y: ground - 200 * s, rot: 30, waist: 10, neck: -14, head: -8,
  armN: A(-62, 26, {grip: 0.5}), armF: A(-52, 30, {grip: 0.5}), legN: L(0, 0, 0), legF: L(0, 0, 0),
  yaw: 0.5,
  footN: {x: toeX - 40 * s * face, y: ground - ANK * s, pitch: 0},
  footF: {x: toeX - 52 * s * face, y: ground - ANK * s, pitch: 0},
  ...o,
});

/** Full extension leaving the ledge (toes still in contact, heels up). */
export const launch = (toeX: number, ground: number, s: number, face: 1 | -1 = 1, o: Partial<RPose> = {}): RPose => ({
  x: toeX - 20 * s * face, y: ground - 318 * s, rot: 22, waist: 2, neck: -10, head: -6,
  armN: A(150, 12, {grip: 0.2}), armF: A(138, 16, {grip: 0.2}), legN: L(-12, 2, -46), legF: L(-20, 4, -50),
  yaw: 0.5,
  ...o,
});

/** Airborne poses (no IK). */
export const AIR = {
  rise: {rot: 14, waist: 0, neck: -6, head: -4, armN: A(160, 18), armF: A(150, 22), legN: L(16, 26, -30), legF: L(-6, 34, -36)},
  tuck: {rot: 6, waist: 6, neck: 0, head: 0, armN: A(118, 48), armF: A(104, 56), legN: L(64, 92, -6), legF: L(50, 104, -10)},
  entry: {rot: -4, waist: -2, neck: 4, head: 6, armN: A(168, 8, {ab: 14}), armF: A(160, 10, {ab: 14}), legN: L(4, 6, -34), legF: L(-4, 10, -38)},
};
export const air = (x: number, y: number, k: keyof typeof AIR, o: Partial<RPose> = {}): RPose => ({x, y, yaw: 0.5, ...AIR[k], ...o} as RPose);

/** Walk cycle (facing right): `phase` in steps (1 = one step). Pelvis bobs; arms counter-swing. Feet are planted by
 *  IK on the contact leg so they never slide. Returns the pose for a pelvis that has travelled `dist` world units. */
export const walk = (x0: number, ground: number, s: number, dist: number, face: 1 | -1 = 1, o: Partial<RPose> = {}, stride = 120): RPose => {
  const sw = stride * s;
  const ph = dist / sw;
  const step = Math.floor(ph), u = ph - step;
  // feet: the planted foot sits at its landing spot; the swing foot travels to the next spot with a lift arc
  const footAt = (n: number) => x0 + face * (n * sw + sw * 0.25);
  const lead = step % 2 === 0 ? 'N' : 'F';
  const planted = footAt(step);
  const from = footAt(step - 1), to = footAt(step + 1);
  const e = u * u * (3 - 2 * u);
  const swingX = from + (to - from) * e;
  const lift = Math.sin(Math.PI * u) * 34 * s;
  const px = x0 + face * dist;
  const bob = (1 - Math.cos(2 * Math.PI * u)) * 0.5 * 7 * s;
  const yaw = o.yaw ?? 1;
  const swingArm = Math.sin(Math.PI * (u - 0.5)) * 24;
  const sgnN = lead === 'N' ? 1 : -1;
  return {
    x: px, y: ground - (STAND_H - 14) * s - bob, rot: 4, waist: 2, neck: 0, head: 0,
    armN: A(-sgnN * swingArm, 18, {grip: 0.3}), armF: A(sgnN * swingArm, 20, {grip: 0.3}), legN: L(0, 0, 0), legF: L(0, 0, 0),
    yaw,
    footN: lead === 'N' ? {x: planted, y: ground - ANK * s, pitch: 0} : {x: swingX, y: ground - ANK * s - lift, pitch: 6 * Math.sin(Math.PI * u)},
    footF: lead === 'F' ? {x: planted, y: ground - ANK * s, pitch: 0} : {x: swingX, y: ground - ANK * s - lift, pitch: 6 * Math.sin(Math.PI * u)},
    ...o,
  };
};

export {mix, mixArm, mixLeg};
