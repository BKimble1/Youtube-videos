// V4 pose helpers. A pose is ManPose (rig/Man.tsx): pelvis position, torso/chest/neck angles, a hand target per arm in
// world space (solved per frame by two-bone IK with a fixed elbow side) and an ankle target per leg (planted feet).
// `figure()` builds a full pose from a few intent-level parameters so the shots never touch joint angles.
import {ManPose, DIM} from './Man';
import {clamp, lerp} from '../../lib/math';

export const FOOT_H = 30; // ankle height above the sole, at s = 1
export const HIP_DROP = 44; // hip joint below the pelvis centre, at s = 1

export type Fig = {
  /** facing: -1 = screen-left (the sender), +1 = screen-right (the receiver) */
  fx: -1 | 1;
  /** root: pelvis x, floor y, scale */
  x: number;
  floor: number;
  s: number;
  /** pelvis height above the floor in rig units (standing ~ 520, seated on a 250 seat ~ 314) */
  hipH: number;
  torso?: number;
  chest?: number;
  neck?: number;
  yaw?: number;
  /** feet: ankle x offsets from the pelvis (in screen px at scale 1), + = screen-right; y = floor unless given */
  nearFoot?: number;
  farFoot?: number;
  nearFootUp?: number;
  farFootUp?: number;
  /** hands: absolute world targets (px) */
  nearHand?: {x: number; y: number};
  farHand?: {x: number; y: number};
  /** torso-space relaxed hand (used when no world target): u below the shoulder line, v toward the back */
  nearRest?: {u: number; v: number};
  farRest?: {u: number; v: number};
  nearElbow?: 1 | -1;
  farElbow?: 1 | -1;
  nearWrist?: number;
  farWrist?: number;
  nearHa?: number;
  nearHw?: number;
  farHa?: number;
  farHw?: number;
  breath?: number;
};

const REST_NEAR = {u: -370, v: 40};
const REST_FAR = {u: -366, v: -64};

/** Build the ManPose for a figure. Pelvis y = floor - hipH*s (so the ankles can reach the planted feet). */
export const figure = (f: Fig): ManPose => {
  const s = f.s;
  const y = f.floor - f.hipH * s;
  const ankleY = f.floor - FOOT_H * s;
  const nf = f.nearFoot ?? 0;
  const ff = f.farFoot ?? 0;
  const p: ManPose = {
    x: f.x,
    y,
    s,
    torso: f.torso ?? 0,
    chest: f.chest ?? 0,
    neck: f.neck ?? 0,
    turn: 1,
    yaw: f.yaw,
    pelvis: 0,
    lTu: (f.nearRest ?? REST_NEAR).u,
    lTv: (f.nearRest ?? REST_NEAR).v,
    lWx: f.nearHand?.x ?? 0,
    lWy: f.nearHand?.y ?? 0,
    lW: f.nearHand ? 1 : 0,
    lElb: f.nearElbow ?? -1,
    lWr: f.nearWrist ?? 0,
    lHa: f.nearHa,
    lHw: f.nearHw,
    rTu: (f.farRest ?? REST_FAR).u,
    rTv: (f.farRest ?? REST_FAR).v,
    rWx: f.farHand?.x ?? 0,
    rWy: f.farHand?.y ?? 0,
    rW: f.farHand ? 1 : 0,
    rElb: f.farElbow ?? -1,
    rWr: f.farWrist ?? 0,
    rHa: f.farHa,
    rHw: f.farHw,
    lHip: 0,
    lKnee: 0,
    lAnk: 0,
    rHip: 0,
    rKnee: 0,
    rAnk: 0,
    lFs: 1,
    lFsh: 1,
    rFs: 1,
    rFsh: 1,
    breath: f.breath ?? 0,
    lAx: f.x + nf * s,
    lAy: ankleY - (f.nearFootUp ?? 0) * s,
    lA: 1,
    rAx: f.x + ff * s,
    rAy: ankleY - (f.farFootUp ?? 0) * s,
    rA: 1,
  };
  return p;
};

/** Blend two Figs (numbers and the optional hand targets) */
export const mixFig = (a: Fig, b: Fig, t: number): Fig => {
  const o: Fig = {...a};
  const num = ['x', 'floor', 's', 'hipH', 'torso', 'chest', 'neck', 'yaw', 'nearFoot', 'farFoot', 'nearFootUp', 'farFootUp', 'nearWrist', 'farWrist', 'nearHa', 'nearHw', 'farHa', 'farHw', 'breath'] as const;
  for (const k of num) {
    const av = a[k];
    const bv = b[k];
    if (av === undefined && bv === undefined) continue;
    (o as Record<string, unknown>)[k] = lerp(av ?? (bv as number), bv ?? (av as number), t);
  }
  const hand = (ha?: {x: number; y: number}, hb?: {x: number; y: number}) => (ha && hb ? {x: lerp(ha.x, hb.x, t), y: lerp(ha.y, hb.y, t)} : t < 0.5 ? ha : hb);
  o.nearHand = hand(a.nearHand, b.nearHand);
  o.farHand = hand(a.farHand, b.farHand);
  const rest = (ra?: {u: number; v: number}, rb?: {u: number; v: number}) => ({u: lerp((ra ?? REST_NEAR).u, (rb ?? ra ?? REST_NEAR).u, t), v: lerp((ra ?? REST_NEAR).v, (rb ?? ra ?? REST_NEAR).v, t)});
  o.nearRest = rest(a.nearRest, b.nearRest);
  o.farRest = rest(a.farRest ?? REST_FAR, b.farRest ?? REST_FAR);
  o.nearElbow = t < 0.5 ? a.nearElbow : b.nearElbow;
  o.farElbow = t < 0.5 ? a.farElbow : b.farElbow;
  return o;
};

export const clampDim = clamp;
export {DIM};
