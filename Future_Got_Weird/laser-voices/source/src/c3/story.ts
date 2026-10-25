// Laser Voices V3: the performance. Every character's pose, place and facing, the transmitter's state and the beam,
// as functions of the narration clock, in the one world of world.ts. Shots (shots.ts) only choose cameras.
//
// Staging (screen directions hold for every front-side camera: transmitter screen right, listener screen left):
//   listener (PERSON) on her mark, facing the front; her LEFT ear toward the transmitter 8 ft away.
//   operator (clerkB) behind the bench, hand on the driver's dial.
//   friend (clerkA) beside the listener on her right, phone and coffee. At "someone walks" he sets off for the back
//   of the room, passes in front of her, steps into the path, stops there texting (completely unaware), and later
//   carries on past.
import React from 'react';
import {B_L, B_O, B_P, LISTENER, OPERATOR, PASSERBY} from './castLV';
import {Arm4, Face4, joints4, Pose4} from './rig/Crew';
import {face, keyed, mix, stand} from './rig/poses';
import {add3, cardToWorld, mul3, v3, V3, worldToCard} from './rig/geo';
import {clamp, DUR, ss} from './lib';
import {Actor, cupHold, phoneHold} from './Scene';
import {pathTable, Walk, walkPlants, walkPose} from './walk';
import {BZ, LENS, LX, PX} from './world';
import {beamDir, BUTTON, DIAL} from './art/Emitter';

// ------------------------------------------------------------------ helpers
const per = (t: number, n: number) => Math.sin((t / DUR) * Math.PI * 2 * n); // loop-periodic idle motion
/** a blink at each time: closes in 0.06 s, held 0.04 s, opens in 0.1 s */
const blinkAt = (t: number, ts: number[]) => {
  let v = 0;
  for (const b of ts) {
    const d = t - b;
    if (d < 0 || d > 0.2) continue;
    v = Math.max(v, d < 0.06 ? d / 0.06 : d < 0.1 ? 1 : 1 - (d - 0.1) / 0.1);
  }
  return v;
};
const withFace = (p: Pose4, f: Partial<Face4>): Pose4 => ({...p, face: {...p.face, ...f}});
const fast = (x: number) => 1 - (1 - x) ** 3; // a quick start that settles (eye saccades, snaps)
const back = (x: number) => {
  // ease out with a small overshoot (follow-through)
  const c = 1.6;
  return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2;
};
type K = [number, Pose4, ((x: number) => number)?][];

// ------------------------------------------------------------------ the listener
export const L_G = v3(LX, 0, BZ);
export const L_H = 180;
const bL = B_L;
const SH = bL.hipY + bL.spine;
const HEAD = SH + 12 + bL.headUp;
const hang = (side: number, fwd = 12): Arm4 => ({hand: v3(side * (bL.shW + 14), bL.hipY + bL.spine - bL.upper - bL.fore + 14, fwd)});
/** her left ear in card-local units for a head yaw (deg) */
const earL = (hy: number) => ({x: Math.cos((hy * Math.PI) / 180) * (bL.R + 2), z: -Math.sin((hy * Math.PI) / 180) * (bL.R + 2)});
// hands placed from the ear, the elbow out to the side and a little forward and down (pole), so the arm folds from the
// elbow and the wrist stays straight
const ELBOW_L = v3(1, -0.5, -0.2);
const ELBOW_R = v3(-1, -0.55, 0.35);
const cupL = (hy: number): Arm4 => ({hand: v3(earL(hy).x + 18, HEAD - 44, earL(hy).z - 4), pole: ELBOW_L, shape: 'open', splay: 0.15, wrist: 12, curl: [0.3, 0.3, 0.3, 0.3]});
const tapL = (k: number, hy: number): Arm4 => ({hand: v3(earL(hy).x + 13 + 6 * k, HEAD - 36, earL(hy).z + 3), pole: ELBOW_L, shape: 'mitt', wrist: 8});
/** the hand on its way up to (or down from) the ear: close to the body at the collarbone, elbow out and back */
const nearL = (hy: number): Arm4 => ({hand: v3(bL.shW + 26 + 0 * hy, SH - 70, 14), pole: v3(0.7, -1, -0.15), shape: 'mitt', wrist: 0});
const palmR = (out: number): Arm4 => ({hand: v3(-(bL.shW + 58 + out), SH - 64, 74), pole: ELBOW_R, shape: 'open', splay: 0.6, wrist: -18});
const pointL = (k: number): Arm4 => ({hand: v3(bL.shW + 70 + 20 * k, SH - 26, 92), pole: v3(1, -0.8, -0.1), shape: 'mitt', wrist: 10});
const P0: Pose4 = {...stand(bL), armL: hang(1), armR: hang(-1)};
const F = {
  idle: face({brow: 0.15, mw: 12, curve: 0.15, gx: 0.05}),
  expect: face({brow: 0.45, browIn: 0.25, wide: 0.25, mw: 11, curve: 0.05, gx: 0.35}),
  snap: face({brow: 0.95, browIn: 0.35, wide: 1, mw: 9, curve: -0.05, open: 0.3, gx: 0.95}),
  hear: face({brow: 0.8, browIn: 0.55, wide: 0.7, mw: 10, curve: 0.25, open: 0.2, gx: 0.85}),
  wonder: face({brow: 0.65, browIn: 0.6, wide: 0.5, mw: 12, curve: 0.45, open: 0.12, gx: 0.6}),
  ask: face({brow: 0.9, browIn: 0.5, wide: 0.7, mw: 12, curve: 0.55, open: 0.4, gx: -0.9}),
  tease: face({brow: 0.55, browIn: 0.15, mw: 15, curve: 0.75, open: 0.1, gx: -0.25, gy: 0.05, asym: 0.3}),
  enjoy: face({brow: 0.35, browIn: 0.5, lid: 0.45, mw: 14, curve: 0.65, blush: 0.3}),
  wow: face({brow: 1, browIn: 0.4, wide: 1, mw: 11, curve: 0.4, open: 0.45, gx: 0.7}),
  down: face({brow: 0.4, browIn: 0.3, mw: 13, curve: 0.55, gy: 1, gx: 0}),
  lost: face({brow: 0.95, browIn: 0.95, wide: 1, mw: 9, curve: -0.45, open: 0.3, gx: 0.9}),
  dart: face({brow: 0.75, browIn: 0.95, wide: 0.8, mw: 9, curve: -0.35, open: 0.1, gx: -0.7}),
  cross: face({brow: -0.55, browIn: -0.85, mw: 12, curve: -0.5, open: 0.3, gx: 0.85, blush: 0.25}),
  watch: face({brow: 0.35, browIn: 0.6, mw: 11, curve: -0.1, gx: 0.7}),
  back: face({brow: 1, browIn: 0.35, wide: 1, mw: 13, curve: 0.55, open: 0.4, gx: 0.85}),
};
/** the hook, tau seconds from the loop point (tau < 0 at the end of the film, tau >= 0 at its start). At frame 0 the
 *  eyes have already snapped toward the voice at her left ear; the head follows with acceleration, overshoots and
 *  settles; the hair lags the turn. */
const hookP = (tau: number): Pose4 => {
  const base: Pose4 = {...P0, hy: 2, hr: 1, face: F.idle};
  return keyed(tau, [
    [-0.9, base],
    [-0.3, {...base, hy: 0, face: F.expect}],
    [-0.06, {...base, hy: -2, hp: 4, face: {...F.expect, brow: 0.6, wide: 0.5, gx: 0.6}}, fast],
    [0.0, {...base, hy: -2, hp: 4, face: F.snap}, fast],
    [0.38, {...base, hy: 36, hp: -3, hr: -5, roll: -1.5, face: F.snap}, (x) => x * x * (3 - 2 * x)],
    [0.56, {...base, hy: 31, hp: -1, hr: -3, roll: -1, face: F.hear}, back],
    [1.0, {...base, hy: 33, hp: -2, hr: -4, roll: -1, face: F.hear}],
  ]);
};
const listenerKeys: K = [
  [1.0, hookP(1.0)],
  // the reveal: she keeps listening toward the voice and cups her ear to it
  [1.5, {...P0, hy: 30, hr: -4, armL: nearL(30), face: F.wonder}],
  [2.0, {...P0, hy: 26, hr: -6, armL: cupL(26), face: F.wonder}],
  [2.75, {...P0, hy: 24, hr: -6, armL: cupL(24), face: {...F.wonder, curve: 0.6}}],
  // "nobody beside you hears": she turns to her friend (her right), excited; open palm toward him: "you hear that?"
  [3.05, {...P0, hy: -50, twist: -12, hipYaw: -6, hr: 4, armL: cupL(-50), armR: palmR(0), face: F.ask}, fast],
  [3.8, {...P0, hy: -54, twist: -14, hipYaw: -6, hr: 6, armL: cupL(-54), armR: palmR(14), face: {...F.ask, open: 0.25}}],
  [4.3, {...P0, hy: -44, twist: -10, hipYaw: -4, hr: 2, armL: cupL(-44), armR: palmR(4), face: {...F.tease, gx: -0.8}}],
  // "and you wouldn't need anything in your ears": hand down, then up to the bare ear: two taps, and away
  [4.85, {...P0, hy: -8, hr: -2, armL: nearL(-8), face: F.tease}],
  [5.3, {...P0, hy: -14, hr: 3, armL: tapL(0, -14), face: {...F.tease, gx: 0.4}}],
  [5.52, {...P0, hy: -14, hr: 3, armL: tapL(1, -14), face: {...F.tease, gx: 0.4}}],
  [5.72, {...P0, hy: -14, hr: 3, armL: tapL(0, -14), face: {...F.tease, gx: 0.4}}],
  [5.92, {...P0, hy: -15, hr: 4, armL: tapL(1, -15), face: {...F.tease, gx: 0.5}}],
  [6.45, {...P0, hy: -20, hr: 5, armL: nearL(-20), face: F.enjoy}],
  [7.0, {...P0, hy: -22, hr: 6, armL: hang(1, 20), face: F.enjoy}],
  [8.9, {...P0, hy: -22, hr: 6, armL: hang(1, 20), face: {...F.enjoy, gx: 0.5}}],
  [15.4, {...P0, hy: -16, hr: 5, face: F.enjoy}],
  // the sound gathers at her: eyes wide; on "standing" a look down at her mark and back up, delighted
  [17.8, {...P0, hy: 14, hr: -2, face: F.wonder}],
  [18.55, {...P0, hy: 22, hr: -4, face: F.wow}, fast],
  [19.15, {...P0, hy: 16, hp: 6, face: {...F.wow, gy: 0.6}}],
  [19.45, {...P0, hy: 10, hp: 24, face: F.down}],
  [19.95, {...P0, hy: 16, hp: -2, armL: cupL(16), face: F.enjoy}],
  // the demo: waiting; the pulse arrives on "feet": she perks up toward it, hand cupped (only she reacts)
  [21.3, {...P0, hy: 6, face: F.idle}],
  [22.35, {...P0, hy: 6, face: {...F.idle, gx: 0.3}}],
  [22.6, {...P0, hy: 30, hr: -5, armL: nearL(30), face: F.hear}, fast],
  [23.0, {...P0, hy: 28, hr: -6, armL: cupL(28), face: F.wonder}],
  [26.15, {...P0, hy: 24, hr: -4, armL: cupL(24), face: {...F.enjoy, lid: 0.6}}],
  // the block: eyes snap open, the smile drops; taps at the ear, eyes dart
  [26.32, {...P0, hy: 26, hr: 0, armL: cupL(26), face: F.lost}, fast],
  [26.8, {...P0, hy: 18, hr: -5, armL: tapL(0, 18), face: F.lost}],
  [27.05, {...P0, hy: 18, hr: -5, armL: tapL(1, 18), face: F.dart}],
  [27.3, {...P0, hy: 22, hr: -5, armL: tapL(0, 18), face: F.dart}],
  [27.8, {...P0, hy: 34, hr: -2, armL: nearL(34), face: {...F.lost, gx: 0.95}}],
  // he is in the way: a point at him, cross
  [28.35, {...P0, hy: 38, hr: -3, armL: pointL(0), armR: {...hang(-1), hand: v3(-bL.shW - 30, bL.hipY + 10, 30), pole: ELBOW_R}, face: F.cross}],
  [29.3, {...P0, hy: 40, hr: -4, armL: pointL(1), armR: {...hang(-1), hand: v3(-bL.shW - 30, bL.hipY + 10, 30), pole: ELBOW_R}, face: {...F.cross, open: 0.1}}],
  [30.4, {...P0, hy: 36, hr: -3, armL: pointL(0.6), armR: {...hang(-1), hand: v3(-bL.shW - 30, bL.hipY + 10, 30), pole: ELBOW_R}, face: {...F.cross, open: 0.15}}],
  [30.9, {...P0, hy: 34, hr: 0, armL: hang(1, 20), face: F.watch}],
  [31.85, {...P0, hy: 30, hr: 0, face: {...F.watch, gx: 0.85}}],
  // it comes back
  [32.1, {...P0, hy: 34, hr: -4, face: F.back}, fast],
  [32.8, {...P0, hy: 26, hr: -3, face: {...F.wonder, curve: 0.7}}],
];
export const listenerPose = (t: number): Pose4 => {
  let p: Pose4;
  if (t < 1.0) p = hookP(t);
  else if (t > DUR - 0.9) p = hookP(t - DUR);
  else if (t > 32.8) p = mix(keyed(t, listenerKeys), hookP(t - DUR), ss(t, 32.8, DUR - 0.9));
  else p = keyed(t, listenerKeys);
  // breathing and a slight idle sway (periodic over the film, so the loop is exact)
  p = {...p, pel: v3(p.pel.x + 1.5 * per(t, 4), p.pel.y + 0.8 * per(t, 9), p.pel.z), roll: p.roll + 0.8 * per(t, 5)};
  return withFace(p, {blink: Math.max(p.face.blink, blinkAt(t, [2.35, 4.7, 7.1, 16.3, 18.3, 21.0, 24.6, 29.0, 31.2, 33.2]))});
};
/** head-turn speed (deg/s) for the hair's lag: the bob swings against the turn and settles */
const hySpeed = (t: number) => (listenerPose(t).hy - listenerPose(t - 0.05).hy) / 0.05;

// ------------------------------------------------------------------ the operator, behind the bench
export const O_G = v3(LENS.x - 1.3, 0, BZ + 0.22);
export const O_H = 90;
const bO = B_O;
const local = (w: V3) => worldToCard(O_G, O_H, w);
const OP_POLE = v3(-0.5, -0.8, -0.3);
const dialArm = (k = 0): Arm4 => ({hand: add3(local(v3(DIAL.x - 0.025, DIAL.y + 0.035, DIAL.z - 0.01)), v3(0, 0, 0)), pole: OP_POLE, shape: 'grip', wrist: -15 + 30 * k});
const buttonArm = (down: number): Arm4 => ({hand: local(v3(BUTTON.x - 0.02, BUTTON.y + 0.06 - 0.03 * down, BUTTON.z + 0.01)), pole: v3(0.6, -0.8, -0.2), shape: 'mitt', wrist: 0});
const O_FACE = face({brow: 0.25, browIn: 0.1, mw: 12, curve: 0.3, gx: 0.15, gy: 0.35});
const O_BASE: Pose4 = {...stand(bO), hy: -10, hp: 8, armL: dialArm(0), armR: {hand: v3(-bO.shW - 12, bO.hipY - 14, 30)}, face: O_FACE};
export const operatorPose = (t: number): Pose4 => {
  let p: Pose4 = keyed(t, [
    [0, O_BASE],
    [15.45, O_BASE],
    // "sweeping": she turns the dial; the galvo starts rocking
    [15.85, {...O_BASE, armL: dialArm(1), face: {...O_FACE, gy: 0.6, brow: 0.4}}],
    [17.6, {...O_BASE, armL: dialArm(1), face: {...O_FACE, gx: 0.9, gy: 0, curve: 0.5}}],
    [19.9, {...O_BASE, armL: dialArm(1), face: {...O_FACE, gx: 0.9, gy: 0, curve: 0.5}}],
    // "scientists actually demonstrated this": a look down at the button, the press (anticipation, press, release),
    // then up toward the listener, confident
    [20.15, {...O_BASE, hy: -16, hp: 18, armL: dialArm(1), armR: buttonArm(-0.8), face: {...O_FACE, gy: 0.9, brow: 0.5, browIn: -0.2}}],
    [20.45, {...O_BASE, pitch: 9, hy: -16, hp: 20, armL: dialArm(1), armR: buttonArm(1), face: {...O_FACE, gy: 0.9, brow: 0.2, browIn: -0.5, curve: 0.2}}, fast],
    [20.75, {...O_BASE, hy: -10, hp: 10, armL: dialArm(1), armR: buttonArm(-0.4), face: {...O_FACE, gy: 0.4}}],
    [21.25, {...O_BASE, hy: 4, hp: 2, armL: dialArm(1), armR: {hand: v3(-bO.shW - 12, bO.hipY - 14, 30)}, face: face({brow: 0.5, mw: 15, curve: 0.85, squint: 0.3, gx: 0.9})}],
    [27.6, {...O_BASE, hy: 4, hp: 2, armL: dialArm(1), face: face({brow: 0.5, mw: 15, curve: 0.85, squint: 0.3, gx: 0.9})}],
    // the beam is blocked: she leans to see past him, puzzled; a little "hey" wave he never sees
    [28.3, {...O_BASE, hy: 14, roll: -6, armL: dialArm(1), face: face({brow: 0.9, browIn: 0.8, mw: 10, curve: -0.3, open: 0.25, gx: 0.8})}],
    [29.0, {...O_BASE, hy: 8, roll: -4, armL: dialArm(1), armR: {hand: v3(-bO.shW - 20, SH + 110, 70), pole: v3(-0.3, -1, -0.2), shape: 'open', splay: 0.8}, face: face({brow: 0.6, browIn: -0.3, mw: 13, curve: -0.2, open: 0.45, gx: 0.8})}],
    [29.35, {...O_BASE, hy: 8, roll: -4, armL: dialArm(1), armR: {hand: v3(-bO.shW + 6, SH + 116, 70), pole: v3(-0.3, -1, -0.2), shape: 'open', splay: 0.8, wrist: 30}, face: face({brow: 0.6, browIn: -0.3, mw: 13, curve: -0.2, open: 0.45, gx: 0.8})}],
    [29.7, {...O_BASE, hy: 8, roll: -4, armL: dialArm(1), armR: {hand: v3(-bO.shW - 20, SH + 110, 70), pole: v3(-0.3, -1, -0.2), shape: 'open', splay: 0.8}, face: face({brow: 0.6, browIn: -0.3, mw: 13, curve: -0.2, open: 0.45, gx: 0.8})}],
    [30.3, {...O_BASE, hy: 6, roll: -2, armL: dialArm(1), face: face({brow: 0.7, browIn: 0.6, mw: 11, curve: -0.25, gx: 0.8})}],
    [32.2, {...O_BASE, hy: 4, armL: dialArm(1), face: face({brow: 0.4, mw: 14, curve: 0.6, gx: 0.85})}],
    [33.6, O_BASE],
  ]);
  p = {...p, pel: v3(p.pel.x, p.pel.y + 0.8 * per(t, 8), p.pel.z)};
  return withFace(p, {blink: blinkAt(t, [1.6, 5.2, 9.8, 14.1, 19.0, 23.0, 26.0, 31.2])});
};
/** the dial's turn (deg) and the button's travel / the send light, for the transmitter art */
export const dialAt = (t: number) => -40 * ss(t, 15.5, 15.85);
export const pressAt = (t: number) => clamp(1 - Math.abs(t - 20.47) / 0.12) * (t > 20.35 ? 1 : 0);
export const sendAt = (t: number) => (t > 20.47 ? 1 : 0) * (1 - ss(t, 33.4, 33.6));
/** the sweep: from "sweeping" to "standing" the galvo turns the beam through a pass that ends on her ear, again and
 *  again (a quick flyback between passes, during which the beam is blanked). SWEEP_P: one pass; returns the mirror
 *  angle (deg) and the pass phase (0..1, or -1 in flyback / off) */
export const SWEEP = {t0: 15.6, t1: 20.0, P: 0.62, flyback: 0.12, d0: -5.5};
export const sweepAt = (t: number) => {
  if (t < SWEEP.t0 || t > SWEEP.t1) return {delta: 0, phase: -1, on: 0};
  const k = (t - SWEEP.t0) % SWEEP.P;
  const on = ss(t, SWEEP.t0, SWEEP.t0 + 0.3) * (1 - ss(t, SWEEP.t1 - 0.3, SWEEP.t1));
  const pass = SWEEP.P - SWEEP.flyback;
  if (k < pass) return {delta: SWEEP.d0 * (1 - k / pass) * on, phase: k / pass, on};
  const u = (k - pass) / SWEEP.flyback;
  return {delta: SWEEP.d0 * (u * u * (3 - 2 * u)) * on, phase: -1, on};
};
export const galvoAt = (t: number) => sweepAt(t).delta;

// ------------------------------------------------------------------ the friend (clerkA): phone and coffee
export const P_G0 = v3(LX + 0.78, 0, BZ - 0.12);
const P_H0 = 236;
const bP = B_P;
const SHp = bP.hipY + bP.spine;
const phoneArm = (k: number): Arm4 => ({hand: v3(-18 + 4 * k, SHp - 52 + 6 * k, 62), pole: v3(-0.6, -0.9, -0.2), shape: 'grip', wrist: 0});
const cupArm = (k: number): Arm4 => ({hand: v3(bP.shW + 4, SHp - 80 + 90 * k, 44 + 14 * k), pole: v3(0.7, -0.9, -0.2), shape: 'grip'});
const P_FACE = face({brow: 0.1, mw: 12, curve: 0.1, gy: 0.75, gx: 0.1, lid: 0.2});
const PUZZ = face({brow: 0.75, browIn: -0.35, asym: 0.6, mw: 10, curve: -0.25, smirk: -0.3, gx: -0.8, gy: -0.1});
const Q_BASE: Pose4 = {...stand(bP), hp: 16, armR: phoneArm(0), armL: cupArm(0), face: P_FACE};
// off at "someone walks": in front of her, into the path between her and the transmitter (his head in the beam), stop
const W1: Walk = {
  t0: 24.22, t1: 26.79, stride: 1.05, h0: P_H0, h1: 252,
  path: pathTable([{x: P_G0.x, z: P_G0.z}, {x: 1.55, z: BZ - 0.62}, {x: 0.95, z: BZ - 0.78}, {x: 0.3, z: BZ - 0.55}, {x: PX + 0.04, z: BZ - 0.12}, {x: PX - 0.02, z: BZ + 0.01}]),
};
// and on, unaware, toward the back of the room
const W2: Walk = {t0: 31.45, t1: 34.6, stride: 1.1, h0: 252, h1: 330, path: pathTable([{x: PX - 0.02, z: BZ + 0.01}, {x: -0.45, z: BZ + 0.5}, {x: -0.8, z: BZ + 1.35}, {x: -1.05, z: BZ + 2.4}])};
export const WALKS = [W1, W2].map((w, i) => ({w, pl: walkPlants(w, (bP.hipW + 2) / 267, i === 0 ? 'R' : 'L')}));
export const passerbyAt = (t: number) => {
  const base: Pose4 = keyed(t, [
    [0, Q_BASE],
    // a sip as she starts listening
    [1.6, Q_BASE],
    [1.9, {...Q_BASE, hp: 6, armL: cupArm(1), face: {...P_FACE, gy: 0.3, lid: 0.5}}],
    [2.35, {...Q_BASE, hp: 10, armL: cupArm(0.15), face: P_FACE}],
    // she turns to him: he looks up, puzzled; looks round for the sound; a shrug; back to the phone
    [3.15, {...Q_BASE, hp: 12, face: {...P_FACE, gy: 0.5}}],
    [3.35, {...Q_BASE, hp: 0, hy: 26, face: PUZZ}, fast],
    [3.75, {...Q_BASE, hp: -2, hy: 32, hr: 6, face: {...PUZZ, gx: 0.6}}],
    [3.95, {...Q_BASE, hp: -2, hy: 22, hr: 4, face: {...PUZZ, gx: -0.9}}, fast],
    [4.35, {...Q_BASE, hp: 0, hy: 28, hr: -4, roll: 3, armL: cupArm(0.25), face: {...PUZZ, gx: 0.8, brow: 0.9}}],
    [4.7, {...Q_BASE, hp: 0, hy: 26, hr: 4, roll: -3, armL: cupArm(0.1), face: {...PUZZ, gx: 0.8}}],
    [5.2, {...Q_BASE, face: P_FACE}],
    [23.75, Q_BASE],
    // texting all the way; a sip while he stands in the path; then on
    [28.3, Q_BASE],
    [28.6, {...Q_BASE, hp: 6, armL: cupArm(1), face: {...P_FACE, gy: 0.3, lid: 0.5}}],
    [29.1, {...Q_BASE, hp: 12, armL: cupArm(0.1), face: P_FACE}],
    [30.1, {...Q_BASE, hp: 16, hy: -8, face: {...P_FACE, curve: 0.5}}],
    [31.2, Q_BASE],
  ]);
  let g = P_G0, h = P_H0, pose = base, moving = 0;
  // the film's end runs on into its start: before the first cut he is still where his last walk left him (out of the
  // hook's frame); from the first cut he is back beside her
  const tw = t < 1.0 ? t + DUR : t;
  const active = [...WALKS].reverse().find((x) => tw >= x.w.t0 - 1e-6);
  if (active) {
    const wp = walkPose(bP, active.w, active.pl, tw, base);
    g = wp.g;
    h = wp.h;
    moving = wp.moving;
    const sw = wp.swing;
    pose = {...wp.pose, armL: {...base.armL, hand: add3(base.armL.hand, v3(0, 4 * Math.abs(sw), -26 * sw))}};
  } else {
    pose = {...base, pel: v3(base.pel.x, base.pel.y + 0.8 * per(t, 7), base.pel.z)};
  }
  const typing = 1.5 * Math.max(0, Math.sin(t * 17)) * (t > 3.2 && t < 5.1 ? 0 : 1);
  pose = {...pose, armR: {...pose.armR, hand: add3(pose.armR.hand, v3(0, typing, 0))}};
  pose = withFace(pose, {blink: blinkAt(t, [1.2, 6.4, 12.0, 17.0, 22.4, 25.1, 28.0, 30.4, 33.0])});
  return {g, h, pose, moving};
};

// ------------------------------------------------------------------ head geometry in the world (beam ends, block)
export const earAndHead = (t: number) => {
  const p = listenerPose(t);
  const j = joints4(bL, p);
  return {ear: cardToWorld(L_G, L_H, add3(j.Hc, add3(mul3(j.hx, bL.R + 2), mul3(j.hy, -6)))), head: cardToWorld(L_G, L_H, j.Hc)};
};
export const earOf = (t: number) => earAndHead(t).ear;
/** where the beam stops: at her ear (moved by the galvo's sweep), or on the near side of his head while it is in the way */
export const beamEnd = (t: number) => {
  const ear0 = earOf(t);
  const d = beamDir(galvoAt(t));
  const s = (ear0.x - LENS.x) / d.x;
  const ear = v3(LENS.x + d.x * s, LENS.y + (ear0.y - LENS.y), LENS.z + d.z * s);
  const ps = passerbyAt(t);
  const H = cardToWorld(ps.g, ps.h, joints4(bP, ps.pose).Hc);
  const r = (bP.R + 6) / 267;
  const u = (H.x - LENS.x) / (ear.x - LENS.x);
  if (u > 0 && u < 1) {
    const on = v3(LENS.x + (ear.x - LENS.x) * u, LENS.y + (ear.y - LENS.y) * u, LENS.z + (ear.z - LENS.z) * u);
    const dy = H.y - on.y, dz = H.z - on.z;
    const q = r * r - dy * dy - dz * dz;
    if (q > 0) return {end: v3(H.x - Math.sqrt(q), on.y, on.z), blocked: true, ear};
  }
  return {end: ear, blocked: false, ear};
};
export const LISTENER_ACTOR = (t: number, earCU = 0): Actor => {
  const pose = listenerPose(t);
  return {id: 'L', look: LISTENER, b: bL, pose: {...pose, sway: clamp(-hySpeed(t) * 0.05, -10, 10)}, g: L_G, h: L_H, earCU};
};
export const OPERATOR_ACTOR = (t: number): Actor => ({id: 'O', look: OPERATOR, b: bO, pose: operatorPose(t), g: O_G, h: O_H});
export const PASSERBY_ACTOR = (t: number): Actor => {
  const p = passerbyAt(t);
  return {id: 'P', look: PASSERBY, b: bP, pose: p.pose, g: p.g, h: p.h, holdR: phoneHold(), holdL: cupHold()};
};
export const cast = (t: number, earCU = 0): Actor[] => [LISTENER_ACTOR(t, earCU), OPERATOR_ACTOR(t), PASSERBY_ACTOR(t)];
export {React};
