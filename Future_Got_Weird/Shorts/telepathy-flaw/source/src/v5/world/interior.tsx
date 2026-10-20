// V4 café interior world: one room, two seated people, one small table with two cups. The shots are cameras into this
// world (wide, two-shot, close-ups, the hands on the table) plus its subjective/red variant. Everything is a pure
// function of time: the acting is keyframes (monotone cubic) over intent-level parameters (torso, head yaw, hand
// targets, cup lift); the arms and legs are solved from those targets every frame by the rig's fixed-length IK with
// a constant elbow side.
import React from 'react';
import {clamp, lerp, rot, V} from '../../lib/math';
import {splineRec, SKey} from '../../lib/motion';
import {EXPR_NEUTRAL, Expr, mixExpr} from '../../art/Head';
import {HAND_RELAXED, HandPose, mixHand} from '../../art/Hand';
import {Cam, Layer} from '../../lib/camera';
import {Man, manJoints} from '../rig/Man';
import {mouthPoint} from '../rig/Head4';
import {Woman, womanJoints} from '../rig/Woman';
import {Fig, figure} from '../rig/poses';
import {Chair, Cup, PROP, Table} from '../env/Props';
import {FLOOR, InteriorBack, InteriorFloor} from '../env/Interior';
import {Implant4} from '../art/Implant';

export const S = 0.78;
export const TX = 540;
export const HIPX = 345 * S;
export const SEAT_Y = FLOOR - PROP.seatH * S;
export const TABLE_Y = FLOOR - PROP.tableH * S;
export const CUP_S = 0.7;
/** the cup is a taller mug than V4's bowl so the grip, the rim and the body can all be seen (width 84, height 55 at 0.7) */
export const CUP_TALL = 1.45;
const CUP_CW = 60 * CUP_S;
const CUP_H = 54 * CUP_S * CUP_TALL;
/** the body's base sits this far above the saucer's underside point */
const CUP_BASE_DY = 10 * CUP_S;
export const HAND_L = 96 * S;

export const W_HIP = TX - HIPX;
export const M_HIP = TX + HIPX;
export const CUP_W_X = 468;
export const CUP_M_X = 612;
export const CUP_Y = TABLE_Y - 2;

export const GRIP: HandPose = {curl: [0.62, 0.66, 0.7, 0.74], spread: 0.25, thumb: 28, thumbCurl: 0.55};
export const FIST: HandPose = {curl: [0.9, 0.92, 0.94, 0.96], spread: 0.1, thumb: 20, thumbCurl: 0.8};
export const OPEN: HandPose = {curl: [0.08, 0.1, 0.14, 0.18], spread: 0.55, thumb: 36, thumbCurl: 0.2};
export const FLAT: HandPose = {curl: [0.04, 0.05, 0.07, 0.1], spread: 0.3, thumb: 18, thumbCurl: 0.15};

export type Rec = {
  bx: number;
  torso: number;
  chest: number;
  neck: number;
  yaw: number;
  /** near / far hand world targets (used when hold = 0, and the far hand always) */
  nhx: number;
  nhy: number;
  fhx: number;
  fhy: number;
  /** 1 = the near hand grips the cup handle (the target comes from the cup) */
  hold: number;
  /** cup lift 0 (on the saucer) .. 1 (at the lips) */
  lift: number;
  ng: number;
  fg: number;
  chairDx: number;
  chairTilt: number;
  /** V5: free-hand angles (screen deg) and their weight 0..1; default = the hand lies along the thigh */
  nHa?: number;
  nHw?: number;
  fHa?: number;
  fHw?: number;
};

export type ExprKey = [number, Expr, ('auto' | 'stop' | 'hit')?];
const E = (o: Partial<Expr>): Expr => ({...EXPR_NEUTRAL, ...o});

// ---- expressions
export const X = {
  mEasy: E({smile: 0.55, lid: 0.1, gx: -0.75, flush: 0.2, browIn: 0.05, open: 0.06}),
  mGlow: E({smile: 0.85, lid: 0.16, gx: -0.75, flush: 0.35, browIn: 0, open: 0.22, wide: 1.05}),
  mFalter: E({smile: 0.18, lid: 0.04, gx: -0.4, gy: 0.2, flush: 0.2, browIn: 0.45, pupil: 0.92, open: 0.05}),
  mFreeze: E({smile: -0.05, lid: 0, gx: -0.2, gy: 0.1, browIn: 0.8, pupil: 0.72, open: 0.08, wide: 0.9, sweat: 0.3, flush: 0.15}),
  mDisturb: E({smile: -0.45, lid: 0.05, gx: -0.1, gy: 0.35, browIn: 0.95, browDown: 0.2, pupil: 0.7, open: 0.14, wide: 0.88, sweat: 0.7, flush: 0.3}),
  mShut: E({smile: -0.85, shut: 0.85, lid: 0.6, squint: 0.75, browIn: 1, browDown: 0.9, pupil: 0.9, open: 0.22, wide: 0.9, teeth: 0.35, sweat: 0.9, flush: 0.5}),
  mStrain: E({smile: -0.7, lid: 0.1, squint: 0.45, gx: -0.2, gy: 0.3, browIn: 0.9, browDown: 0.7, pupil: 0.78, open: 0.22, wide: 0.85, teeth: 0.65, sweat: 0.9, flush: 0.5}),
  mHold: E({smile: -0.25, lid: 0.04, gx: -0.5, gy: 0.35, browIn: 0.85, browDown: 0.4, pupil: 0.78, open: 0.08, wide: 0.86, sweat: 0.7, flush: 0.35}),
  mForced: E({smile: 0.2, lid: 0.12, gx: -0.6, gy: 0.1, browIn: 0.55, pupil: 0.86, open: 0.04, sweat: 0.55, flush: 0.3}),
  mRealize: E({smile: -0.55, lid: 0, gx: -0.9, gy: 0.05, browIn: 0.95, pupil: 0.62, open: 0.2, wide: 0.82, sweat: 0.85, flush: 0.25}),
  mCrushed: E({smile: -0.75, lid: 0.02, gx: -0.8, gy: 0.35, browIn: 1, browDown: 0.3, pupil: 0.8, open: 0.1, wide: 0.8, sweat: 0.7, flush: 0.35}),
  wWarm: E({smile: 0.7, lid: 0.12, gx: 0.75, flush: 0.35, open: 0.12}),
  wGlad: E({smile: 0.95, lid: 0.2, gx: 0.75, flush: 0.5, open: 0.3, wide: 1.05, browIn: 0}),
  wSip: E({smile: 0.3, lid: 0.3, gx: 0.6, flush: 0.2, open: 0.03}),
  wCalm: E({smile: 0.45, lid: 0.1, gx: 0.7, flush: 0.2, open: 0.05}),
  wBlank: E({smile: 0.02, lid: 0.04, gx: 0.8, browIn: 0.35, pupil: 0.9, flush: 0.1, open: 0.04}),
  wRecog: E({smile: -0.7, lid: 0, gx: 0.85, gy: -0.1, browIn: 1, pupil: 0.5, open: 0.24, wide: 0.9, sweat: 0.4, flush: 0.0}),
  wRead: E({smile: 0.2, lid: 0.02, gx: 0.6, gy: -0.6, browIn: 0.45, pupil: 0.88, open: 0.05, flush: 0.2}),
  wAlarm: E({smile: -0.6, lid: 0, gx: 0.85, browIn: 1, pupil: 0.55, open: 0.22, wide: 0.82, sweat: 0.6, flush: 0.0}),
};

export const exprAt = (t: number, keys: ExprKey[]): Expr => splineRec(t, keys as SKey<Expr>[]) as Expr;
void mixExpr;

/** V5: the eyes stay available for the acting (no automatic blinks) in these windows (s): the notice, recognition and
 *  withdrawal, and the sender's realization */
const BLINK_HOLD: [number, number][] = [[25.2, 27.0], [24.0, 24.8]];

/** deterministic blink (0..1): about every 3.1 s, 5 frames long, per-actor offset */
export const blinkAt = (t: number, seed: number, hold: [number, number][] = []) => {
  const T = 3.1 + 0.4 * Math.sin(seed * 7.1);
  const ph = ((t + seed * 0.83) % T) / T;
  const d = 5 / 30 / T;
  const b = ph < d ? Math.sin((ph / d) * Math.PI) : 0;
  // inside a hold window the blink is gated off, eased over 0.08 s at both ends so a blink in progress never pops
  const ss = (x: number) => {
    const u = Math.max(0, Math.min(1, x));
    return u * u * (3 - 2 * u);
  };
  let g = 1;
  for (const [a, c] of hold) g *= 1 - ss((t - a) / 0.08) * (1 - ss((t - c) / 0.08));
  return b * g;
};

// the thigh angle a resting hand lies along (screen deg): the sender's hands point left and a little down, hers right
const W_THIGH_ANG = 8;
const M_THIGH_ANG = 172;
const base = (thigh: number, o: Partial<Rec>): Rec => ({bx: 0, torso: 4, chest: 0, neck: 0, yaw: 20, nhx: 0, nhy: 0, fhx: 0, fhy: 0, hold: 1, lift: 0, ng: 0.5, fg: 0, chairDx: 0, chairTilt: 0, nHa: thigh, nHw: 0, fHa: thigh, fHw: 1, ...o});

// V5: the far hand rests on the thigh near the knee (wrist target; the palm lies on the thigh top, about y 1170), the near
// hand, when it is free, on the thigh nearer the hip. They are 80 apart, so the two forearms and elbows read as two arms.
const THIGH_WRIST_Y = SEAT_Y - 49;
const W_LAP = {x: W_HIP + 170, y: THIGH_WRIST_Y};
const M_LAP = {x: M_HIP - 172, y: THIGH_WRIST_Y};
const M_NEAR_LAP = {x: M_HIP - 70, y: THIGH_WRIST_Y};

// ---------------------------------------------------------------------------------------------------------------
// Acting is keyed on the body; each body part then follows with its own lag, so a reaction travels eyes (expression
// keys) -> head -> torso -> hands -> cup instead of every part starting and stopping together.
// ---------------------------------------------------------------------------------------------------------------
type Chan = 'head' | 'body' | 'near' | 'far' | 'cup';
const CH: Record<Chan, (keyof Rec)[]> = {
  head: ['yaw', 'neck'],
  body: ['bx', 'torso', 'chest', 'chairDx', 'chairTilt'],
  near: ['nhx', 'nhy', 'hold', 'ng', 'nHa', 'nHw'],
  far: ['fhx', 'fhy', 'fg', 'fHa', 'fHw'],
  cup: ['lift'],
};
/** seconds a channel trails the keys (negative: leads) */
const LAG: Record<Chan, number> = {head: -0.08, body: 0, near: 0.07, far: 0.12, cup: 0.05};
const sampleRec = (t: number, keys: SKey<Rec>[]): Rec => {
  const out: Record<string, number> = {};
  for (const c of Object.keys(CH) as Chan[]) {
    const ck = keys.map(([tt, v, m]) => [tt, Object.fromEntries(CH[c].map((f) => [f, (v as Record<string, number>)[f]])), m] as SKey<Record<string, number>>);
    Object.assign(out, splineRec(t - LAG[c], ck));
  }
  return out as unknown as Rec;
};

// ---------------------------------------------------------------------------------------------------------------
// the receiver (left, faces right)
// ---------------------------------------------------------------------------------------------------------------
const wRest = base(W_THIGH_ANG, {fhx: W_LAP.x, fhy: W_LAP.y, ng: 0.5, nhx: CUP_W_X - 96, nhy: CUP_Y - 24});
export const W_KEYS: SKey<Rec>[] = [
  [9.9, wRest],
  // the message lands (10.5): she leans a touch toward him, turns to it, and settles
  [10.36, {...wRest, yaw: 24, torso: 3}],
  [10.62, {...wRest, yaw: 18, torso: 4}],
  // sip 1: a small lean toward the cup, the cup comes up and tips in, a pause, then it goes back and she sits back
  [10.85, {...wRest, lift: 0, torso: 3.4, neck: -1, ng: 0.6}],
  [11.5, {...wRest, lift: 1, torso: 2, neck: -4, ng: 0.7}],
  [11.95, {...wRest, lift: 1, torso: 2, neck: -4, ng: 0.7}],
  [12.5, {...wRest, lift: 0, torso: 4.6, neck: 1.5, ng: 0.6}],
  [12.8, {...wRest, torso: 6, neck: 2, yaw: 22}],
  [13.4, {...wRest, torso: 5}],
  [14.15, {...wRest, torso: 5}],
  // 14.15-14.75 the subjective image has its own state; reality returns
  [14.7, {...wRest, lift: 0}],
  [15.0, {...wRest, lift: 0.0}],
  [15.35, {...wRest, lift: 0, torso: 3.6, neck: -1, ng: 0.6}],
  [15.95, {...wRest, lift: 1, torso: 2, neck: -4, ng: 0.7}],
  [16.3, {...wRest, lift: 1, torso: 2, neck: -4, ng: 0.7}],
  [16.85, {...wRest, lift: 0, torso: 4.6, neck: 0.5, ng: 0.6}],
  [17.2, {...wRest, torso: 5}],
  [18.0, {...wRest, lift: 0, torso: 4}],
  [19.5, {...wRest, yaw: 6, torso: 3, neck: -5}],
  [20.4, {...wRest, yaw: 6, torso: 3, neck: -5}],
  [21.1, {...wRest, yaw: 20, torso: 5, neck: 1}],
  [24.9, {...wRest, yaw: 20, torso: 5}],
  // she sees the alert (25.38): eyes up to it first, the head follows, then the jolt back (25.66-25.8), the freeze
  [25.4, {...wRest, yaw: 21, torso: 5, neck: -2}],
  [25.66, {...wRest, yaw: 22, torso: 5, neck: -3, ng: 0.6}],
  [25.84, {...wRest, yaw: 18, torso: -3, neck: -6, ng: 0.7, chairDx: -6}],
  [26.14, {...wRest, yaw: 18, torso: -3, neck: -5, ng: 0.35, chairDx: -8}],
  // the withdrawal: the fingers let go, the hands come up on two arcs (the near hand outward then up, the far hand lower
  // and nearer her), the torso goes back with a small overshoot and the chair slides back with her
  [26.3, {...wRest, yaw: 15, torso: -9, chest: -4, neck: -3, hold: 0, nhx: W_HIP + 175, nhy: SEAT_Y - 170, nHw: 0, fhx: W_HIP + 120, fhy: SEAT_Y - 120, fHw: 0, fg: 0.3, ng: 0.2, chairDx: -22, chairTilt: 2}],
  [26.46, {...wRest, yaw: 14, torso: -14, chest: -7, neck: -2, hold: 0, nhx: W_HIP + 110, nhy: SEAT_Y - 250, nHw: 0, fhx: W_HIP + 52, fhy: SEAT_Y - 196, fHw: 0, fg: 0.3, ng: 0.12, chairDx: -36, chairTilt: 3.4}],
  [26.7, {...wRest, yaw: 14, torso: -12.5, chest: -6, neck: -3, hold: 0, nhx: W_HIP + 100, nhy: SEAT_Y - 256, nHw: 0, fhx: W_HIP + 46, fhy: SEAT_Y - 200, fHw: 0, fg: 0.3, ng: 0.12, chairDx: -40, chairTilt: 3.6}, 'stop'],
  [27.4, {...wRest, yaw: 14, torso: -13, chest: -6.5, neck: -3, hold: 0, nhx: W_HIP + 96, nhy: SEAT_Y - 252, nHw: 0, fhx: W_HIP + 44, fhy: SEAT_Y - 196, fHw: 0, fg: 0.3, ng: 0.12, chairDx: -42, chairTilt: 4}],
];

export const W_EXPR: ExprKey[] = [
  [9.9, X.wWarm],
  [10.4, X.wBlank],
  [10.62, X.wGlad],
  [11.2, X.wSip],
  [12.0, X.wSip],
  [12.6, X.wGlad],
  [12.95, X.wWarm],
  [14.65, X.wCalm],
  [15.5, X.wSip],
  [16.0, X.wSip],
  [16.5, X.wCalm],
  [19.5, X.wBlank],
  [20.5, X.wBlank],
  [21.0, X.wWarm],
  [24.9, X.wWarm],
  [25.38, X.wWarm],
  [25.46, X.wRead],
  [25.66, X.wRead],
  [25.78, X.wRecog],
  [26.2, X.wRecog],
  [26.42, X.wAlarm],
  [27.4, X.wAlarm],
];

// ---------------------------------------------------------------------------------------------------------------
// the sender (right, faces left)
// ---------------------------------------------------------------------------------------------------------------
const mRest = base(M_THIGH_ANG, {fhx: M_LAP.x, fhy: M_LAP.y, ng: 0.5, torso: 6, yaw: 22, nhx: CUP_M_X + 96, nhy: CUP_Y - 24});
const mLap = {hold: 0, nhx: M_NEAR_LAP.x, nhy: M_NEAR_LAP.y, nHa: M_THIGH_ANG, nHw: 1};
export const M_KEYS: SKey<Rec>[] = [
  [9.9, mRest],
  [10.5, {...mRest, torso: 6, yaw: 22}],
  [11.2, {...mRest, torso: 4, yaw: 24}],
  [12.3, {...mRest, torso: 4, yaw: 22}],
  [12.75, {...mRest, torso: 5, yaw: 22}],
  [13.2, {...mRest, torso: 3, yaw: 18, ng: 0.7}],
  [14.65, {...mRest, torso: 2, yaw: 14, ng: 0.85}],
  [15.4, {...mRest, torso: 2, yaw: 24, ng: 0.9}],
  // the rejection: a short head shake and a shut-eyed effort (hands stay on the cup)
  [15.7, {...mRest, torso: 2, yaw: 36, ng: 0.9}],
  [16.0, {...mRest, torso: 2, yaw: 10, ng: 0.9}],
  [16.3, {...mRest, torso: 2, yaw: 30, ng: 0.9}],
  [16.7, {...mRest, torso: 2, yaw: 14, ng: 0.95}],
  [17.2, {...mRest, torso: 1, yaw: 14, ng: 1}],
  // the grip tightens and holds, then the fingers open and the hand leaves the cup (the cup stays on its saucer)
  [17.55, {...mRest, torso: 1, yaw: 14, ng: 1}],
  [17.78, {...mRest, torso: 0.6, yaw: 14, ng: 0.42}],
  [18.25, {...mRest, torso: 0, yaw: 14, ng: 0.42, ...mLap}],
  [19.5, {...mRest, torso: 1, yaw: 16, ng: 0.4, ...mLap}],
  [20.45, {...mRest, torso: 1, yaw: 16, ng: 0.4, ...mLap}],
  // restraint: both fists close on the thighs, on two different spots and at two different angles, and stay put while the
  // shoulders come up (20.8-21.25), then they loosen. No tremor.
  [20.78, {...mRest, torso: 2, chest: 1.5, yaw: 17, ng: 1.3, ...mLap, nhx: M_NEAR_LAP.x - 3, nhy: M_NEAR_LAP.y + 1, nHa: 158, fg: 1.3, fhx: M_LAP.x - 3, fhy: M_LAP.y + 1, fHa: 180}],
  [20.98, {...mRest, torso: 3, chest: 2, yaw: 18, ng: 2, ...mLap, nhx: M_NEAR_LAP.x - 6, nhy: M_NEAR_LAP.y + 3, nHa: 154, fg: 2, fhx: M_LAP.x - 6, fhy: M_LAP.y + 3, fHa: 184}],
  [21.3, {...mRest, torso: 3, chest: 2, yaw: 18, ng: 2, ...mLap, nhx: M_NEAR_LAP.x - 6, nhy: M_NEAR_LAP.y + 3, nHa: 154, fg: 2, fhx: M_LAP.x - 6, fhy: M_LAP.y + 3, fHa: 184}],
  [21.75, {...mRest, torso: 3, chest: 0, yaw: 20, ng: 0.5, ...mLap, fg: 0.3}],
  [24.0, {...mRest, torso: 4, yaw: 20, ng: 0.5, ...mLap, fg: 0.3}],
  [24.6, {...mRest, torso: 6, yaw: 24, ng: 0.7, ...mLap, fg: 0.5}],
  [26.0, {...mRest, torso: 6, yaw: 24, ng: 0.7, ...mLap, fg: 0.5}],
  // the end: his near hand comes off the thigh and reaches toward her over the table (anticipation: it lifts first)
  [26.2, {...mRest, torso: 6, yaw: 24, ng: 0.7, ...mLap, nhx: M_NEAR_LAP.x - 10, nhy: M_NEAR_LAP.y - 14, nHw: 0, fg: 0.5}],
  [26.62, {...mRest, torso: 5, yaw: 24, ng: 0.3, ...mLap, nhx: M_HIP - 182, nhy: SEAT_Y - 150, nHw: 0, fg: 0.5}],
  [27.4, {...mRest, torso: 4, yaw: 22, neck: 4, ng: 0.3, ...mLap, nhx: M_HIP - 196, nhy: SEAT_Y - 160, nHw: 0, fg: 0.5}],
];

export const M_EXPR: ExprKey[] = [
  [9.9, X.mEasy],
  [10.5, X.mGlow],
  [11.2, X.mEasy],
  [12.2, X.mGlow],
  [12.7, X.mEasy],
  [13.0, X.mFalter],
  [13.4, X.mFreeze],
  [14.65, X.mDisturb],
  [15.4, X.mDisturb],
  [15.7, X.mShut],
  [16.5, X.mShut],
  [16.75, X.mStrain],
  [18.0, X.mStrain],
  [19.5, X.mForced],
  [20.45, X.mForced],
  [20.85, X.mHold],
  [21.2, X.mHold],
  [21.7, X.mForced],
  [23.0, X.mForced],
  [24.15, X.mRealize],
  [26.2, X.mRealize],
  [27.0, X.mCrushed],
  [27.4, X.mCrushed],
];

// ---------------------------------------------------------------------------------------------------------------
// solving a frame
// ---------------------------------------------------------------------------------------------------------------
/** x, y = the middle of the cup body's base; tilt = SVG rotation (deg, about that point; + = clockwise) */
type CupPose = {x: number; y: number; tilt: number; fill: number};

/** cup-local -> world: p along the rim, outward (away from the drinker), q up the cup's axis. dirF = which way the drinker faces */
const cupLoc = (c: CupPose, dirF: -1 | 1, p: number, q: number): V => {
  const r = (c.tilt * Math.PI) / 180;
  return {x: c.x + dirF * Math.cos(r) * p + Math.sin(r) * q, y: c.y + dirF * Math.sin(r) * p - Math.cos(r) * q};
};
const cupDirAng = (c: CupPose, dirF: -1 | 1, dp: number, dq: number): number => {
  const o = cupLoc({...c, x: 0, y: 0}, dirF, dp, dq);
  return (Math.atan2(o.y, o.x) * 180) / Math.PI;
};
const sm = (x: number) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};

/** the sip: the cup comes up off the saucer and tips toward the drinker until its near rim meets the lips (the near rim
 *  edge is placed on the mouth, so the cup body is out in front of the face, never over it). lift 0..1 is the progress. */
const SIP_TILT = 21;
const cupFor = (who: 'w' | 'm', L: number, mouth: V): CupPose => {
  const dirF: -1 | 1 = who === 'w' ? 1 : -1;
  const rest = {x: who === 'w' ? CUP_W_X : CUP_M_X, y: CUP_Y - CUP_BASE_DY};
  const e = sm(L);
  const tilt = -dirF * SIP_TILT * sm((L - 0.4) / 0.6);
  const zero = {x: 0, y: 0, tilt, fill: 1};
  const rim = cupLoc(zero, dirF, -CUP_CW, CUP_H);
  const lip = {x: mouth.x - rim.x + dirF * 1, y: mouth.y - rim.y - 1};
  // the path bows outward and up a little: the cup comes up and then in
  const bow = Math.sin(Math.PI * e);
  return {x: lerp(rest.x, lip.x, e) + dirF * 16 * bow, y: lerp(rest.y, lip.y, e) - 6 * bow, tilt, fill: 1 - 0.16 * sm((L - 0.5) / 0.5)};
};

/** the grip: ONE rigid frame in the cup's own coordinates, so the hand and the cup are a single object from the table to the
 *  lips: the wrist on the drinker's side of the cup, low on the body; the hand lies against the lower body and its fingers
 *  wrap round the front of the cup toward the far side; the thumb is on the upper side */
const GRIP_WRIST = {p: -(CUP_CW + 8), q: 0.25 * CUP_H};
const GRIP_DIR = {dp: 0.97, dq: -0.2};

/** 0 relaxed .. 1 gripping .. 2 fist */
const handFor = (g: number): HandPose => (g <= 1 ? mixHand(HAND_RELAXED, GRIP, clamp(g)) : mixHand(GRIP, FIST, clamp(g - 1)));

const lerpA = (a: number, b: number, t: number) => a + ((((b - a) % 360) + 540) % 360 - 180) * t;

export type Solved = {
  fig: Fig;
  pose: ReturnType<typeof figure>;
  expr: Expr;
  blink: number;
  nearHand: HandPose;
  farHand: HandPose;
  cup: CupPose;
  held: boolean;
  chair: {x: number; tilt: number};
  head: V;
  rec: Rec;
};

const solveActor = (who: 'w' | 'm', t: number, keys: SKey<Rec>[], ek: ExprKey[], over?: Partial<Rec>, figOver?: Partial<Fig>): Solved => {
  const r = {...sampleRec(t, keys), ...over} as Rec;
  const fx = who === 'w' ? 1 : -1;
  const hip = who === 'w' ? W_HIP : M_HIP;
  const x = hip + r.bx + r.chairDx;
  const mk = (hands: Partial<Fig>): Fig => ({
    fx: fx as -1 | 1,
    x,
    floor: FLOOR,
    s: S,
    hipH: PROP.seatH + 64,
    torso: r.torso,
    chest: r.chest,
    neck: r.neck,
    yaw: r.yaw,
    nearFoot: fx * 190 + (r.chairDx ? r.chairDx * 0.0 : 0),
    farFoot: fx * 150,
    nearElbow: -1,
    farElbow: -1,
    // V5: the far shoulder sits toward the front so the far sleeve and arm show beside the torso's front contour; the far
    // forearm and hand come out from behind that contour (farFront 0) instead of crossing the torso
    farShoulderV: who === 'w' ? -72 : -76,
    farFront: 0,
    ...figOver,
    ...hands,
  });
  // pass 1: the body without hands gives the head and the mouth
  const p0 = figure(mk({}));
  const J0 = who === 'w' ? womanJoints(p0) : manJoints(p0);
  const mouth = mouthPoint(J0.head, 96 * S, (who === 'w' ? 1 : -1) * (J0.tc + r.neck), r.yaw, who === 'w');
  const cup0 = cupFor(who, r.lift, mouth);
  // strain: a fine tremor of the cup AND the hand that holds it (the same offset: nothing slides) while he holds the
  // thought in (the sender, 16.6-17.7 s, and again while his hands clench)
  const win = (a: number, b: number) => Math.max(0, Math.min(1, (t - a) / 0.3)) * Math.max(0, Math.min(1, (b - t) / 0.2));
  const trem = who === 'm' ? win(16.6, 17.7) : 0;
  const tx0 = Math.sin(t * 30 * 2.3) * 1.1 * trem;
  const ty0 = Math.cos(t * 30 * 1.9) * 0.8 * trem;
  const cup: CupPose = {...cup0, x: cup0.x + tx0, y: cup0.y + ty0};
  const dirF: -1 | 1 = who === 'w' ? 1 : -1;
  const gw = cupLoc(cup, dirF, GRIP_WRIST.p, GRIP_WRIST.q);
  const gAng = cupDirAng(cup, dirF, GRIP_DIR.dp, GRIP_DIR.dq);
  const held = r.hold > 0.5;
  const h = clamp(r.hold);
  const nx = lerp(r.nhx || gw.x, gw.x, h);
  const ny = lerp(r.nhy || gw.y, gw.y, h);
  // the hand angle: held = the grip's own angle in the cup frame; free = the keyed angle (default: lying along the thigh)
  const nAng = lerpA(r.nHa ?? 0, gAng, h);
  const nW = lerp(r.nHw ?? 0, 1, h);
  const fig = mk({
    nearHand: {x: nx, y: ny},
    farHand: {x: r.fhx, y: r.fhy},
    nearHa: nAng,
    nearHw: nW,
    farHa: r.fHa,
    farHw: r.fHw,
  });
  const pose = figure(fig);
  const J = who === 'w' ? womanJoints(pose) : manJoints(pose);
  const blink = blinkAt(t, who === 'w' ? 1 : 2, BLINK_HOLD);
  return {
    fig,
    pose,
    expr: exprAt(t, ek),
    blink,
    nearHand: handFor(r.ng),
    farHand: handFor(r.fg),
    cup,
    held,
    chair: {x: hip + r.chairDx, tilt: r.chairTilt},
    head: J.head,
    rec: r,
  };
};

export type InteriorOpts = {
  /** subjective overrides */
  w?: Partial<Rec>;
  m?: Partial<Rec>;
  /** lab: figure overrides (shoulder offsets etc.) */
  figW?: Partial<Fig>;
  figM?: Partial<Fig>;
  /** override her expression (the subjective image shows her startled) */
  wExpr?: Expr;
  /** implant glow 0..1 and colour */
  glow?: number;
  glowColor?: string;
  /** steam and cups' coffee fill */
  steam?: number;
  /** a cup that is not on the table (dropped/shattered) hides the table cup */
  hideCupW?: boolean;
  extra?: React.ReactNode;
};

export const solveInterior = (t: number, o: InteriorOpts = {}) => {
  const w = solveActor('w', t, W_KEYS, W_EXPR, o.w, o.figW);
  return {w: o.wExpr ? {...w, expr: o.wExpr} : w, m: solveActor('m', t, M_KEYS, M_EXPR, o.m, o.figM)};
};

export const InteriorWorld: React.FC<{t: number; f: number; cam: Cam; opts?: InteriorOpts; solved?: ReturnType<typeof solveInterior>}> = ({t, f, cam, opts = {}, solved}) => {
  const {w, m} = solved ?? solveInterior(t, opts);
  const glow = opts.glow ?? 0.35;
  const steam = opts.steam ?? 0.7;
  const ripple = Math.max(0, Math.min(1, (t - 16.6) / 0.3)) * Math.max(0, Math.min(1, (17.75 - t) / 0.2));
  const cupEl = (id: string, who: Solved, fx: -1 | 1, hide?: boolean) =>
    hide ? null : <Cup id={id} x={who.cup.x} y={who.cup.y} s={CUP_S} tall={CUP_TALL} fx={fx} f={f} steam={steam * (1 - who.rec.lift * 0.4)} tilt={who.cup.tilt} fill={who.cup.fill} ripple={fx === 1 ? ripple : 0} saucer={false} handle={false} />;
  const implant = <Implant4 yaw={m.rec.yaw} glow={glow} color={opts.glowColor ?? '#46CFFF'} f={f} />;
  return (
    <g>
      <Layer cam={cam} depth={1}>
        <InteriorBack f={f} />
        <InteriorFloor />
        <Chair id="chW" x={w.chair.x} floor={FLOOR} s={S} fx={1} tilt={w.chair.tilt} />
        <Chair id="chM" x={m.chair.x} floor={FLOOR} s={S} fx={-1} tilt={m.chair.tilt} />
        <Table id="tb" x={TX} floor={FLOOR} s={S} />
        <Cup id="sauW" x={CUP_W_X} y={CUP_Y} s={CUP_S} fx={-1} body={false} handle={false} />
        <Cup id="sauM" x={CUP_M_X} y={CUP_Y} s={CUP_S} fx={1} body={false} handle={false} />
        <Woman id="W" pose={w.pose} expr={w.expr} blink={w.blink} lHand={w.nearHand} rHand={w.farHand} held={cupEl('cupW', w, -1, opts.hideCupW)} />
        <Man id="M" pose={m.pose} expr={m.expr} blink={m.blink} lHand={m.nearHand} rHand={m.farHand} held={cupEl('cupM', m, 1)} headOverlay={implant} />
        {opts.extra}
      </Layer>
    </g>
  );
};

/** world position of the sender's implant disc (head space: x = -98 sin(yaw), y = -84 on a head of radius 96*S) */
export const implantWorld = (m: {pose: {yaw?: number; torso: number; chest: number; neck: number}; head: V}, scale = S): V => {
  const R = (96 * scale) / 100;
  const yaw = ((m.pose.yaw ?? 20) * Math.PI) / 180;
  const roll = (-((m.pose.torso ?? 0) + (m.pose.chest ?? 0) + (m.pose.neck ?? 0)) * Math.PI) / 180;
  const lx = -98 * Math.sin(yaw) * R;
  const ly = -84 * R;
  return {x: m.head.x + lx * Math.cos(roll) - ly * Math.sin(roll), y: m.head.y + lx * Math.sin(roll) + ly * Math.cos(roll)};
};
export const IMPLANT_R = 21.5 * ((96 * S) / 100);
