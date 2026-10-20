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
export const CUP_BASE_DY = 10 * CUP_S;
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
  // the sender. Eyes stay open and alert through the whole disturbed arc (no heavy lids, no brow pressed over the eye, no slack mouth)
  mEasy: E({smile: 0.55, lid: 0.1, gx: -0.75, flush: 0.2, browIn: 0.05, open: 0.06}),
  mGlow: E({smile: 0.85, lid: 0.16, gx: -0.75, flush: 0.35, browIn: 0, open: 0.22, wide: 1.05}),
  mGlance: E({smile: 0.5, lid: 0.12, gx: -0.45, gy: 0.55, flush: 0.3, browIn: 0, open: 0.05}),
  mFalter: E({smile: 0.12, lid: 0.02, gx: -0.35, gy: 0.2, flush: 0.2, browIn: 0.45, pupil: 0.95, open: 0.04}),
  mFreeze: E({smile: -0.05, lid: 0.05, gx: -0.8, gy: 0.05, browIn: 0.5, browDown: 0.14, pupil: 0.85, open: 0.03, wide: 0.95, sweat: 0.2, flush: 0.15}),
  mDisturb: E({smile: -0.4, lid: 0.02, gx: -0.55, gy: 0.1, browIn: 0.6, browDown: 0.22, pupil: 0.7, open: 0.05, wide: 0.95, sweat: 0.55, flush: 0.2}),
  mReject: E({smile: -0.5, lid: 0.02, squint: 0.06, gx: -0.2, gy: 0.2, browIn: 0.42, browDown: 0.5, pupil: 0.74, open: 0.06, wide: 0.92, teeth: 0.4, sweat: 0.7, flush: 0.35}),
  mShut: E({smile: -0.7, shut: 0.9, lid: 0.5, squint: 0.55, browIn: 0.95, browDown: 0.6, pupil: 0.9, open: 0.06, wide: 0.92, teeth: 0.55, sweat: 0.85, flush: 0.5}),
  mStrain: E({smile: -0.45, lid: 0.02, squint: 0.06, gx: -0.35, gy: 0.28, browIn: 0.4, browDown: 0.52, pupil: 0.78, open: 0.05, wide: 0.9, teeth: 0.5, sweat: 0.8, flush: 0.4}),
  mHold: E({smile: -0.25, lid: 0.02, squint: 0.06, gx: -0.5, gy: 0.3, browIn: 0.45, browDown: 0.4, pupil: 0.8, open: 0.05, wide: 0.9, teeth: 0.3, sweat: 0.7, flush: 0.35}),
  mForced: E({smile: 0.2, lid: 0.08, gx: -0.6, gy: 0.1, browIn: 0.5, pupil: 0.88, open: 0.04, sweat: 0.55, flush: 0.3}),
  mRealize: E({smile: -0.5, lid: 0, gx: -0.9, gy: 0.05, browIn: 0.95, pupil: 0.62, open: 0.1, wide: 0.88, sweat: 0.85, flush: 0.25}),
  mCrushed: E({smile: -0.7, lid: 0.02, gx: -0.8, gy: 0.35, browIn: 1, browDown: 0.2, pupil: 0.8, open: 0.08, wide: 0.88, sweat: 0.7, flush: 0.35}),
  // the receiver: interested and warm, her fear kept for the moment the alert reaches her (wRead onwards)
  wWarm: E({smile: 0.7, lid: 0.12, gx: 0.75, flush: 0.35, open: 0.12}),
  wUp: E({smile: 0.5, lid: 0, gx: 0.45, gy: -0.7, flush: 0.3, browIn: 0.2, open: 0.08}),
  wGlad: E({smile: 0.95, lid: 0.2, gx: 0.75, flush: 0.5, open: 0.3, wide: 1.05, browIn: 0}),
  wCup: E({smile: 0.45, lid: 0.18, gx: 0.5, gy: 0.6, flush: 0.2, open: 0.05}),
  wSip: E({smile: 0.3, lid: 0.22, gx: 0.8, flush: 0.25, open: 0.03}),
  wAside: E({smile: 0.35, lid: 0.1, gx: 0.15, gy: 0.25, flush: 0.2, open: 0.04}),
  wCalm: E({smile: 0.5, lid: 0.1, gx: 0.7, flush: 0.2, open: 0.06}),
  wBlank: E({smile: 0.15, lid: 0.02, gx: 0.6, gy: -0.4, browIn: 0.3, pupil: 0.95, flush: 0.15, open: 0.04}),
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
// V6: the angle a resting hand lies at on its thigh (the thigh runs a little down toward the knee): her hands point right, his left
const W_THIGH_ANG = 12;
const M_THIGH_ANG = 168;
const base = (thigh: number, o: Partial<Rec>): Rec => ({bx: 0, torso: 4, chest: 0, neck: 0, yaw: 20, nhx: 0, nhy: 0, fhx: 0, fhy: 0, hold: 1, lift: 0, ng: 0.5, fg: 0, chairDx: 0, chairTilt: 0, nHa: thigh, nHw: 0, fHa: thigh, fHw: 1, ...o});

// V5: the far hand rests on the thigh near the knee (wrist target; the palm lies on the thigh top, about y 1170), the near
// hand, when it is free, on the thigh nearer the hip. They are ~120 apart, so the two forearms and elbows read as two arms.
// V6: a free hand lies ON its thigh (the wrist is just behind the hand's centre, the palm side against the leg, the fingers
// pointing along the thigh toward the knee), not hovering past the knee at the table edge as in V5. The far hand lies on the
// far thigh a little nearer the knee, the near hand on the near thigh nearer the hip, so the two hands are staggered.
const THIGH_WRIST_Y = SEAT_Y - 45;
export const W_LAP = {x: W_HIP + 112, y: THIGH_WRIST_Y};
const M_LAP = {x: M_HIP - 114, y: THIGH_WRIST_Y};
const M_NEAR_LAP = {x: M_HIP - 34, y: SEAT_Y - 52};

// ---------------------------------------------------------------------------------------------------------------
// V6 acting. Each actor's motion is keyed per channel (head, body, near hand, far hand, cup) at the moment the action
// needs it: no generic fixed delay between body parts. A reaction is staged by where its keys sit (the eyes first through the
// expression keys, the head a beat ahead of the torso where the action calls for it, the hands when they have a reason).
// ---------------------------------------------------------------------------------------------------------------
type Chan = 'head' | 'body' | 'near' | 'far' | 'cup';
const CH: Record<Chan, (keyof Rec)[]> = {
  head: ['yaw', 'neck'],
  body: ['bx', 'torso', 'chest', 'chairDx', 'chairTilt'],
  near: ['nhx', 'nhy', 'hold', 'ng', 'nHa', 'nHw'],
  far: ['fhx', 'fhy', 'fg', 'fHa', 'fHw'],
  cup: ['lift'],
};
type PK = SKey<Record<string, number>>;
type ChanKeys = Record<Chan, PK[]>;
const sampleRec = (t: number, ck: ChanKeys): Rec => {
  const out: Record<string, number> = {};
  for (const c of Object.keys(CH) as Chan[]) Object.assign(out, splineRec(t, ck[c]));
  return out as unknown as Rec;
};
/** key helpers: only the fields of the channel */
const hd = (t: number, yaw: number, neck = 0, m?: 'auto' | 'stop' | 'hit'): PK => [t, {yaw, neck}, m];
const bd = (t: number, torso: number, chest = 0, chairDx = 0, chairTilt = 0, m?: 'auto' | 'stop' | 'hit'): PK => [t, {bx: 0, torso, chest, chairDx, chairTilt}, m];
const nr = (t: number, o: {x?: number; y?: number; hold?: number; g?: number; a?: number; aw?: number}, m?: 'auto' | 'stop' | 'hit'): PK => [t, {nhx: o.x ?? 0, nhy: o.y ?? 0, hold: o.hold ?? 1, ng: o.g ?? 0.5, nHa: o.a ?? 0, nHw: o.aw ?? 0}, m];
const fr = (t: number, o: {x: number; y: number; g?: number; a: number; aw?: number}, m?: 'auto' | 'stop' | 'hit'): PK => [t, {fhx: o.x, fhy: o.y, fg: o.g ?? 0.3, fHa: o.a, fHw: o.aw ?? 1}, m];
const cp = (t: number, lift: number, m?: 'auto' | 'stop' | 'hit'): PK => [t, {lift}, m];

// ---------------------------------------------------------------------------------------------------------------
// the receiver (left, faces right)
// ---------------------------------------------------------------------------------------------------------------
// the near hand's free target while it holds the cup (the cup sets the real target; this keeps the hold -> free blend sane)
const W_NH = {x: CUP_W_X - 96, y: CUP_Y - 24};
const wFar = (t: number, o: Partial<{x: number; y: number; g: number; a: number; aw: number}> = {}, m?: 'auto' | 'stop' | 'hit') => fr(t, {x: W_LAP.x, y: W_LAP.y, a: W_THIGH_ANG, ...o}, m);
const wNear = (t: number, g = 0.45, m?: 'auto' | 'stop' | 'hit') => nr(t, {x: W_NH.x, y: W_NH.y, hold: 1, g, a: W_THIGH_ANG, aw: 0}, m);
const W_CK: ChanKeys = {
  head: [
    hd(9.9, 20, 0),
    // the message lands (10.52): her eyes come up to it first (expression keys), the head follows a beat later
    hd(10.3, 22, -2),
    hd(10.62, 18, 1),
    // sip 1: she looks down at the cup, the cup comes up, the head tips back to drink, looks at him over the rim, comes back
    hd(10.88, 17, 5),
    hd(11.42, 19, -2),
    hd(11.55, 20, -4),
    hd(11.95, 20, -3),
    hd(12.32, 19, 2),
    hd(12.62, 22, 1),
    hd(13.4, 22, 0),
    hd(14.7, 21, 0),
    // sip 2
    hd(15.3, 19, 3),
    hd(15.9, 20, -3),
    hd(16.3, 20, -3),
    hd(16.8, 19, 1),
    hd(17.3, 21, 0),
    // she looks aside (the room, the window) while he is quiet, then back to him
    hd(19.4, 21, 0),
    hd(19.6, 8, -4),
    hd(20.35, 8, -4),
    hd(20.9, 20, 1),
    hd(24.9, 20, 0),
    // the alert (25.38): the eyes go to it first, the head follows, the head jerks back with the body (25.66-25.8)
    hd(25.45, 21, -2),
    hd(25.66, 22, -3),
    hd(25.82, 18, -6),
    hd(26.14, 18, -5),
    hd(26.3, 15, -3),
    hd(26.46, 14, -2),
    hd(26.7, 14, -3, 'stop'),
    hd(27.4, 14, -3),
  ],
  body: [
    bd(9.9, 4),
    bd(10.36, 3),
    bd(10.62, 4),
    bd(10.85, 3.4),
    bd(11.5, 2),
    bd(11.95, 2),
    bd(12.5, 4.6),
    bd(12.8, 6),
    bd(13.4, 5),
    bd(14.15, 5),
    bd(14.7, 4),
    bd(15.35, 3.6),
    bd(15.95, 2),
    bd(16.3, 2),
    bd(16.85, 4.6),
    bd(17.2, 5),
    bd(18.0, 4),
    bd(19.5, 3),
    bd(20.4, 3),
    bd(21.1, 5),
    bd(24.9, 5),
    bd(25.4, 5),
    bd(25.66, 5),
    // the jolt back: the torso goes first, then the chair slides with her
    bd(25.84, -3, 0, -6),
    bd(26.14, -3, 0, -8),
    bd(26.3, -9, -4, -22, 2),
    bd(26.46, -14, -7, -36, 3.4),
    bd(26.7, -12.5, -6, -40, 3.6, 'stop'),
    bd(27.4, -13, -6.5, -42, 4),
  ],
  near: [
    wNear(9.9),
    wNear(10.85, 0.55),
    wNear(11.5, 0.7),
    wNear(11.95, 0.7),
    // the cup is on the saucer again (12.5) before the fingers loosen
    wNear(12.5, 0.65),
    wNear(12.85, 0.4),
    wNear(15.3, 0.45),
    wNear(15.95, 0.7),
    wNear(16.3, 0.7),
    wNear(16.85, 0.65),
    wNear(17.2, 0.4),
    wNear(25.84, 0.45),
    // the fingers let go and the hand comes up close to her chest (an elbow-bent flinch, not an outstretched arm)
    nr(26.14, {x: W_NH.x, y: W_NH.y, hold: 1, g: 0.3, a: W_THIGH_ANG, aw: 0}),
    nr(26.3, {x: W_HIP + 140, y: SEAT_Y - 168, hold: 0, g: 0.15, a: 0, aw: 0}),
    nr(26.46, {x: W_HIP + 134, y: SEAT_Y - 248, hold: 0, g: 0.12, a: 0, aw: 0}),
    nr(26.7, {x: W_HIP + 130, y: SEAT_Y - 262, hold: 0, g: 0.12, a: 0, aw: 0}, 'stop'),
    nr(27.4, {x: W_HIP + 128, y: SEAT_Y - 260, hold: 0, g: 0.12, a: 0, aw: 0}),
  ],
  far: [
    wFar(9.9),
    wFar(25.7),
    // the other hand leaves the thigh a little after the first: it comes up on a lower arc, nearer her
    wFar(25.9, {x: W_LAP.x - 8, y: W_LAP.y - 6, a: W_THIGH_ANG, aw: 1}),
    fr(26.2, {x: W_HIP + 102, y: SEAT_Y - 92, g: 0.25, a: 0, aw: 0}),
    fr(26.46, {x: W_HIP + 98, y: SEAT_Y - 140, g: 0.2, a: 0, aw: 0}),
    fr(26.7, {x: W_HIP + 96, y: SEAT_Y - 150, g: 0.2, a: 0, aw: 0}, 'stop'),
    fr(27.4, {x: W_HIP + 96, y: SEAT_Y - 148, g: 0.2, a: 0, aw: 0}),
  ],
  cup: [cp(9.9, 0), cp(10.85, 0), cp(11.5, 1), cp(11.95, 1), cp(12.5, 0), cp(15.3, 0), cp(15.95, 1), cp(16.3, 1), cp(16.85, 0), cp(27.4, 0)],
};
const W_KEYS = W_CK;

export const W_EXPR: ExprKey[] = [
  // interested, warm: she looks at him
  [9.9, X.wWarm],
  [10.3, X.wUp],
  [10.42, X.wBlank],
  [10.62, X.wGlad],
  // sip 1: eyes to the cup, then at him over the rim with smiling eyes
  [10.8, X.wCup],
  [11.3, X.wCup],
  [11.55, X.wSip],
  [12.0, X.wSip],
  [12.5, X.wWarm],
  [12.62, X.wGlad],
  [13.3, X.wWarm],
  [14.7, X.wCalm],
  [15.3, X.wCup],
  [15.9, X.wAside],
  [16.4, X.wCalm],
  [19.5, X.wAside],
  [20.5, X.wAside],
  [20.95, X.wWarm],
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
const M_NH = {x: CUP_M_X + 96, y: CUP_Y - 24};
const mFar = (t: number, o: Partial<{x: number; y: number; g: number; a: number; aw: number}> = {}, m?: 'auto' | 'stop' | 'hit') => fr(t, {x: M_LAP.x, y: M_LAP.y, a: M_THIGH_ANG, ...o}, m);
const mNearCup = (t: number, g = 0.5, m?: 'auto' | 'stop' | 'hit') => nr(t, {x: M_NH.x, y: M_NH.y, hold: 1, g, a: M_THIGH_ANG, aw: 0}, m);
const mNearLap = (t: number, o: {x?: number; y?: number; g?: number} = {}, m?: 'auto' | 'stop' | 'hit') => nr(t, {x: o.x ?? M_NEAR_LAP.x, y: o.y ?? M_NEAR_LAP.y, hold: 0, g: o.g ?? 0.3, a: M_THIGH_ANG, aw: 1}, m);
const M_CK: ChanKeys = {
  head: [
    hd(9.9, 22, 0),
    hd(10.5, 22, 0),
    // she sips: he glances at his own cup, then back at her
    hd(11.3, 21, 3),
    hd(12.15, 23, 0),
    hd(12.75, 22, 0),
    // the thought arrives (13.0): his focus goes inward, the head turns a little away from her
    hd(13.05, 18, -1),
    hd(13.4, 15, 1),
    hd(14.65, 14, 0),
    hd(15.35, 24, -1),
    // the rejection: a short head shake (the same length as before, a slightly narrower swing)
    hd(15.7, 36, 0),
    hd(16.0, 10, 0),
    hd(16.3, 30, 0),
    hd(16.7, 14, 2),
    // holding the thought in: the chin comes down a little, then up again
    hd(17.15, 14, 5),
    hd(17.8, 14, 1),
    hd(18.3, 15, 0),
    hd(19.5, 17, 0),
    hd(20.45, 17, 0),
    hd(20.9, 18, 3),
    hd(21.4, 19, 0),
    hd(21.75, 20, 0),
    hd(24.0, 21, 0),
    hd(24.6, 24, 0),
    hd(26.0, 24, 0),
    hd(26.5, 24, 1),
    hd(26.9, 22, 4),
    hd(27.4, 22, 4),
  ],
  body: [
    bd(9.9, 6),
    bd(10.5, 6),
    bd(11.2, 4),
    bd(12.3, 4),
    bd(12.75, 5),
    bd(13.2, 3),
    bd(14.65, 2),
    bd(15.4, 2),
    bd(16.7, 2),
    bd(17.2, 1),
    bd(17.78, 0.6),
    bd(18.25, 0),
    bd(19.5, 1),
    bd(20.45, 1),
    bd(20.78, 2, 1.5),
    bd(20.98, 3, 2),
    bd(21.3, 3, 2),
    bd(21.75, 3, 0),
    bd(24.0, 4),
    bd(24.6, 6),
    bd(26.0, 6),
    bd(26.62, 5),
    bd(27.4, 4),
  ],
  near: [
    mNearCup(9.9),
    mNearCup(15.4, 0.55),
    mNearCup(16.75, 0.9),
    // the grip tightens and holds, then the fingers open and the hand leaves the cup (the cup stays on its saucer)
    mNearCup(17.55, 1.0),
    mNearCup(17.78, 0.45),
    // the hand settles on his near thigh and stays (restraint), pressing a little as the thought pushes back (20.8-21.3)
    mNearLap(18.25),
    mNearLap(20.45),
    mNearLap(20.78, {y: M_NEAR_LAP.y + 1, g: 1.2}),
    mNearLap(20.98, {y: M_NEAR_LAP.y + 3, g: 1.5}),
    mNearLap(21.3, {y: M_NEAR_LAP.y + 3, g: 1.5}),
    mNearLap(21.75, {g: 0.35}),
    mNearLap(26.0, {g: 0.35}),
    // the end: the hand lifts off the thigh a little, open, as if to stop it (a small elbow-bent gesture, close to his body)
    mNearLap(26.25, {y: M_NEAR_LAP.y - 18, g: 0.3}),
    nr(26.62, {x: M_HIP - 98, y: SEAT_Y - 206, hold: 0, g: 0.15, a: 0, aw: 0}),
    nr(27.4, {x: M_HIP - 104, y: SEAT_Y - 210, hold: 0, g: 0.15, a: 0, aw: 0}),
  ],
  far: [
    mFar(9.9),
    mFar(20.45),
    mFar(20.78, {x: M_LAP.x - 2, y: M_LAP.y + 1, g: 1.2}),
    mFar(20.98, {x: M_LAP.x - 4, y: M_LAP.y + 3, g: 1.5}),
    mFar(21.3, {x: M_LAP.x - 4, y: M_LAP.y + 3, g: 1.5}),
    mFar(21.75),
    mFar(27.4),
  ],
  cup: [cp(9.9, 0), cp(27.4, 0)],
};
const M_KEYS = M_CK;

export const M_EXPR: ExprKey[] = [
  // comfortable and interested: eyes on her
  [9.9, X.mEasy],
  [10.5, X.mGlow],
  // she sips: he glances at his own cup, a shy smile, then back to her eyes
  [11.15, X.mGlance],
  [11.9, X.mGlance],
  [12.2, X.mGlow],
  [12.7, X.mEasy],
  // the thought: the smile fades, his focus goes inward (13.0), then fixes (13.4)
  [13.0, X.mFalter],
  [13.4, X.mFreeze],
  // after the image: alert and disturbed (eyes wide, brows tight, no smile), not slack
  [14.65, X.mDisturb],
  [15.4, X.mReject],
  // the head shake: eyes squeezed shut only at the peak of it
  [15.72, X.mReject],
  [15.85, X.mShut],
  [16.2, X.mShut],
  [16.3, X.mReject],
  // holding the thought in: eyes open and fixed, jaw set
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

const solveActor = (who: 'w' | 'm', t: number, keys: ChanKeys, ek: ExprKey[], over?: Partial<Rec>, figOver?: Partial<Fig>): Solved => {
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
    // V6: the far shoulder keeps the rig's own place (V5 pulled it round the front of the chest to show the arm, which gave the
    // sleeve lobe beside the neck); the far forearm and hand are drawn outside the torso only (farFront 0), so the arm comes out
    // of the body's front contour where it passes it
    farFront: 0,
    // V6: the body is turned a little toward the partner (a narrower torso about the spine line), not a frontal mannequin torso
    bodyW: 0.84,
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
  // free hand targets are given relative to the chair (the pelvis): when the chair slides back the hands go with the body
  const shift = r.chairDx + r.bx;
  const nx = lerp(r.nhx ? r.nhx + shift : gw.x, gw.x, h);
  const ny = lerp(r.nhy || gw.y, gw.y, h);
  // the hand angle: held = the grip's own angle in the cup frame; free = the keyed angle (default: lying along the thigh)
  const nAng = lerpA(r.nHa ?? 0, gAng, h);
  const nW = lerp(r.nHw ?? 0, 1, h);
  const fig = mk({
    nearHand: {x: nx, y: ny},
    farHand: {x: r.fhx + shift, y: r.fhy},
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
  /** the receiver and her chair turn together about the chair's back feet (degrees, + = tipping backward): the imagined fall */
  tipW?: number;
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
  // the chair's back feet (its backrest is on her left): the pivot of the imagined fall
  const tipDeg = opts.tipW ?? 0;
  const tipT = tipDeg ? `rotate(${(-tipDeg).toFixed(3)} ${(w.chair.x - 100 * S).toFixed(2)} ${FLOOR})` : undefined;
  const implant = <Implant4 yaw={m.rec.yaw} glow={glow} color={opts.glowColor ?? '#46CFFF'} f={f} />;
  return (
    <g>
      <Layer cam={cam} depth={1}>
        <InteriorBack f={f} />
        <InteriorFloor />
        <g transform={tipT}>
          <Chair id="chW" x={w.chair.x} floor={FLOOR} s={S} fx={1} tilt={w.chair.tilt} />
        </g>
        <Chair id="chM" x={m.chair.x} floor={FLOOR} s={S} fx={-1} tilt={m.chair.tilt} />
        <Table id="tb" x={TX} floor={FLOOR} s={S} />
        <Cup id="sauW" x={CUP_W_X} y={CUP_Y} s={CUP_S} fx={-1} body={false} handle={false} />
        <Cup id="sauM" x={CUP_M_X} y={CUP_Y} s={CUP_S} fx={1} body={false} handle={false} />
        <g transform={tipT}>
          <Woman id="W" pose={w.pose} expr={w.expr} blink={w.blink} lHand={w.nearHand} rHand={w.farHand} held={cupEl('cupW', w, -1, opts.hideCupW)} />
        </g>
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
