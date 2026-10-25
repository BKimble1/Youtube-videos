// Laser Voices Rebuild V2: the performance. Every character's pose, place and facing, the emitter's state and the
// beam, as functions of the narration clock, in the one world of world.ts. Shots (Film.tsx) only choose cameras.
import {B_L, B_O, B_P, LISTENER, OPERATOR, PASSERBY} from './castLV';
import {Arm4, Face4, joints4, Pose4} from './rig/Crew';
import {face, FACES, keyed, mix, stand} from './rig/poses';
import {add3, cardToWorld, mul3, v3, V3, worldToCard} from './rig/geo';
import {clamp, DUR, ss} from './lib';
import {Actor, cupHold, phoneHold} from './Scene';
import {Hold} from './rig/Crew';
import {pathTable, Walk, walkPlants, walkPose} from './walk';
import {BEAM_Y, BZ, EM, LENS, LX, PX} from './world';
import {DIAL} from './art/Emitter';
import {INK} from './rig/cast';
import React from 'react';

// ------------------------------------------------------------------ helpers
const per = (t: number, n: number) => Math.sin((t / DUR) * Math.PI * 2 * n); // loop-periodic idle motion
/** a blink at each time in ts: closes in 0.06 s, held 0.04 s, opens in 0.1 s */
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

// ------------------------------------------------------------------ the listener (PERSON), at her mark, facing the front
export const L_G = v3(LX, 0, BZ);
export const L_H = 180;
const bL = B_L;
const SH = bL.hipY + bL.spine; // shoulder height (u)
const HEAD = SH + 12 + bL.headUp;
const hang = (side: number) => ({hand: v3(side * (bL.shW + 14), bL.hipY + bL.spine - bL.upper - bL.fore + 14, 12)} as Arm4);
/** cupped at her left ear */
/** her left ear in card-local units for a head yaw (deg): the hands that go to it are placed from it */
const earL = (hy: number) => ({x: Math.cos((hy * Math.PI) / 180) * (bL.R + 2), z: -Math.sin((hy * Math.PI) / 180) * (bL.R + 2)});
const cupLh = (hy: number): Arm4 => ({hand: v3(earL(hy).x + 16, HEAD - 46, earL(hy).z - 6), shape: 'open', splay: 0.15, wrist: 15, curl: [0.3, 0.3, 0.3, 0.3]});
/** a fingertip on the ear (tapping) */
const tapLh = (k: number, hy: number): Arm4 => ({hand: v3(earL(hy).x + 12 + 7 * k, HEAD - 38, earL(hy).z + 2), shape: 'mitt', wrist: 10});
const palmToward = (side: number, out: number): Arm4 => ({hand: v3(side * (bL.shW + 60 + out), SH - 70, 70), shape: 'open', splay: 0.6, wrist: side * 20});
const pointL: Arm4 = {hand: v3(bL.shW + 120, SH - 20, 60), shape: 'mitt', wrist: 10};
const S0 = stand(bL);
const P_BASE: Pose4 = {...S0, armL: hang(1), armR: hang(-1)};
const F = {
  listen: face({brow: 0.45, browIn: 0.45, mw: 13, curve: 0.55, gx: 0.15}),
  hookA: face({brow: 0.75, browIn: 0.3, wide: 0.7, mw: 10, curve: 0.2, open: 0.25, gx: 0.95}),
  hookB: face({brow: 0.9, browIn: 0.45, wide: 1, mw: 10, curve: 0.35, open: 0.45, gx: 0.85, gy: 0.05}),
  ask: face({brow: 0.8, browIn: 0.6, wide: 0.6, mw: 13, curve: 0.6, open: 0.35, gx: -0.9}),
  wink: face({brow: 0.5, browIn: 0.2, mw: 16, curve: 0.9, open: 0.15, gx: -0.2, gy: 0.1}),
  enjoy: face({brow: 0.35, browIn: 0.5, lid: 0.55, mw: 15, curve: 0.85, blush: 0.4}),
  lost: face({brow: 0.95, browIn: 0.95, wide: 1, mw: 9, curve: -0.45, open: 0.3, gx: 0.9}),
  dart: face({brow: 0.7, browIn: 0.9, wide: 0.8, mw: 9, curve: -0.35, open: 0.1, gx: -0.6}),
  cross: face({brow: -0.5, browIn: -0.8, mw: 12, curve: -0.5, open: 0.35, gx: 0.9, blush: 0.3}),
  back: face({brow: 1, browIn: 0.35, wide: 1, mw: 14, curve: 0.8, open: 0.4, gx: 0.8}),
  joy: face({brow: 0.6, browIn: 0.4, squint: 0.75, mw: 19, curve: 1, open: 0.5, teeth: 1, blush: 0.55}),
};
/** the hook performance, tau seconds from the loop point (tau < 0 at the end of the film, tau >= 0 at its start) */
const hookP = (tau: number): Pose4 => {
  const base: Pose4 = {...P_BASE, hy: 4, hr: 2, face: F.listen};
  return keyed(tau, [
    [-0.7, base],
    [-0.22, {...base, hp: 3, face: {...F.listen, brow: 0.6, gx: 0.5}}],
    [0.0, {...base, hy: 0, hp: 5, face: F.hookA}],
    [0.42, {...base, hy: 34, hp: -3, hr: -4, face: F.hookB}, (x) => 1 - (1 - x) ** 3],
    [0.62, {...base, hy: 30, hp: -1, hr: -3, face: F.hookB}],
    [1.0, {...base, hy: 31, hp: -1, hr: -3, face: {...F.hookB, open: 0.3}}],
  ]);
};
const listenerKeys: [number, Pose4, ((x: number) => number)?][] = [
  [1.0, hookP(1.0)],
  // S2 (far): she cups her ear toward the emitter
  [1.45, {...P_BASE, hy: -14, hr: 6, armL: cupLh(-14), face: F.listen}],
  [2.75, {...P_BASE, hy: -14, hr: 6, armL: cupLh(-14), face: {...F.listen, curve: 0.7}}],
  // S3: turns to him (her right): "do you hear that?" - palm toward him; then back to us, a tap on her bare ear
  [3.05, {...P_BASE, hy: -42, hr: 4, armL: cupLh(-42), armR: palmToward(-1, 0), face: F.ask}],
  [3.9, {...P_BASE, hy: -40, hr: 6, armL: cupLh(-40), armR: palmToward(-1, 10), face: {...F.ask, curve: 0.4, open: 0.2}}],
  [4.35, {...P_BASE, hy: -30, hr: 2, armL: cupLh(-30), armR: hang(-1), face: {...F.wink, gx: -0.7}}],
  [5.0, {...P_BASE, hy: 0, hr: -2, armL: tapLh(0, 0), face: F.wink}],
  [5.35, {...P_BASE, hy: 2, hr: -3, armL: tapLh(1, 2), face: F.wink}],
  [5.6, {...P_BASE, hy: 2, hr: -3, armL: tapLh(0, 2), face: F.wink}],
  [5.85, {...P_BASE, hy: 2, hr: -3, armL: tapLh(1, 2), face: F.wink}],
  // S4: she turns her ear to the light and takes her hand away (no earbud)
  [6.25, {...P_BASE, hy: -24, hr: 5, armL: tapLh(0, -24), face: F.enjoy}],
  [6.85, {...P_BASE, hy: -26, hr: 6, armL: hang(1), face: F.enjoy}],
  [8.9, {...P_BASE, hy: -26, hr: 6, armL: hang(1), face: F.enjoy}],
  [17.8, {...P_BASE, hy: -10, hr: 4, face: F.listen}],
  // S7: "where you're standing": a look down at her mark, then up, delighted
  [18.9, {...P_BASE, hy: -8, hp: 8, face: {...F.listen, gy: 0.8}}],
  [19.35, {...P_BASE, hy: -8, hp: 26, face: {...F.wink, gy: 1, gx: 0}}],
  [19.9, {...P_BASE, hy: 6, hp: -2, armL: cupLh(6), face: F.enjoy}],
  // S8: listening with her eyes half shut; at "eight feet" a glance down the lane and a thumbs-up-ish wave back
  [21.6, {...P_BASE, hy: 10, hr: 2, armL: cupLh(10), face: F.enjoy}],
  [22.3, {...P_BASE, hy: 32, hr: -2, armL: cupLh(32), armR: palmToward(-1, 0), face: {...F.wink, gx: 0.8}}],
  [23.2, {...P_BASE, hy: 20, hr: 3, armL: cupLh(20), face: F.enjoy}],
  [26.15, {...P_BASE, hy: 18, hr: 4, armL: cupLh(18), face: {...F.enjoy, lid: 0.7}}],
  // the voice stops: eyes snap open, smile drops; she taps the ear, eyes dart
  [26.4, {...P_BASE, hy: 22, hr: 0, armL: cupLh(22), face: F.lost}, (x) => 1 - (1 - x) ** 3],
  [26.9, {...P_BASE, hy: 14, hr: -5, armL: tapLh(0, 14), face: F.lost}],
  [27.15, {...P_BASE, hy: 14, hr: -5, armL: tapLh(1, 14), face: F.dart}],
  [27.4, {...P_BASE, hy: 18, hr: -5, armL: tapLh(0, 18), face: F.dart}],
  [27.85, {...P_BASE, hy: 30, hr: -2, armL: tapLh(0, 30), face: {...F.lost, gx: 0.95}}],
  // he is in the way: a point at him, cross
  [28.4, {...P_BASE, hy: 36, hr: -3, armL: pointL, armR: {...hang(-1), hand: v3(-bL.shW - 30, bL.hipY + 10, 30)}, face: F.cross}],
  [30.4, {...P_BASE, hy: 34, hr: -3, armL: pointL, armR: {...hang(-1), hand: v3(-bL.shW - 30, bL.hipY + 10, 30)}, face: {...F.cross, open: 0.15}}],
  [30.9, {...P_BASE, hy: 30, hr: 0, armL: hang(1), face: {...F.listen, gx: 0.6, curve: 0}}],
  [31.85, {...P_BASE, hy: 28, hr: 0, face: {...F.listen, gx: 0.6, curve: 0, brow: 0.6}}],
  // it comes back
  [32.15, {...P_BASE, hy: 22, hr: -4, face: F.back}, (x) => 1 - (1 - x) ** 3],
  [32.7, {...P_BASE, hy: 10, hr: -6, hp: -4, face: F.joy}],
  [33.25, {...P_BASE, hy: 6, hr: -2, face: F.joy}],
];
export const listenerPose = (t: number): Pose4 => {
  let p: Pose4;
  if (t < 1.0) p = hookP(t);
  else if (t > DUR - 0.7) p = hookP(t - DUR);
  else if (t > 33.25) p = mix(keyed(t, listenerKeys), hookP(t - DUR), ss(t, 33.25, DUR - 0.7));
  else p = keyed(t, listenerKeys);
  // breathing + a slight idle sway (periodic over the film, so the loop is exact)
  const br = per(t, 9);
  p = {...p, pel: v3(p.pel.x + 1.5 * per(t, 4), p.pel.y + 0.8 * br, p.pel.z), roll: p.roll + 0.8 * per(t, 5)};
  return withFace(p, {blink: Math.max(p.face.blink, blinkAt(t, [2.3, 4.6, 7.0, 10.9, 16.2, 18.5, 21.2, 24.4, 29.2, 31.0]))});
};

// ------------------------------------------------------------------ the operator (clerkB), at the emitter's control end
export const O_G = v3(EM.x - 0.52, 0, BZ + 0.4);
export const O_H = 90;
const bO = B_O;
const dialLocal = worldToCard(O_G, O_H, v3(DIAL.x - 0.03, DIAL.y, DIAL.z - 0.02));
const micAt = (k: number): Arm4 => ({hand: v3(-bO.shW + 18, bO.hipY + bO.spine + 18 + 6 * k, 58), shape: 'grip', wrist: 0});
const O_BASE: Pose4 = {...stand(bO), hy: -8, armL: {hand: dialLocal, shape: 'grip', wrist: -20}, armR: micAt(0), face: face({brow: 0.2, mw: 11, curve: 0.3, gx: 0.2})};
const waveArm = (k: number): Arm4 => ({hand: v3(-bO.shW - 30 + 25 * k, SH + 120, 60), shape: 'grip', wrist: -20 + 40 * k});
const thumbArm: Arm4 = {hand: v3(-bO.shW - 6, SH + 40, 70), shape: 'grip', wrist: 0};
export const operatorPose = (t: number): Pose4 => {
  const k = (n: number) => 0.5 + 0.5 * per(t, n); // loop-periodic
  // she speaks into the mic while the beam carries her voice (mouth from a syllable rhythm)
  const speaking = (1 - ss(t, 27.9, 28.2)) + ss(t, 31.7, 32.0);
  const mouth = clamp(speaking) * Math.max(0, per(t, 60) * Math.sin((t / DUR) * Math.PI * 2 * 18 + 1)) * 0.55;
  let p: Pose4 = keyed(t, [
    [0, O_BASE],
    [15.4, O_BASE],
    // "sweeping": a turn of the dial
    [15.9, {...O_BASE, armL: {...O_BASE.armL, wrist: 30}}],
    [17.4, {...O_BASE, armL: {...O_BASE.armL, wrist: -40}}],
    [20.3, {...O_BASE, armL: {...O_BASE.armL, wrist: -20}}],
    // "scientists demonstrated": a thumbs-up to her down the lane
    [20.95, {...O_BASE, armR: thumbArm, face: face({brow: 0.5, mw: 16, curve: 1, squint: 0.4})}],
    [21.9, {...O_BASE, armR: thumbArm, face: face({brow: 0.5, mw: 16, curve: 1, squint: 0.4})}],
    [22.4, O_BASE],
    [27.9, O_BASE],
    // the beam is blocked: she leans to look past him, then waves him off
    [28.4, {...O_BASE, hy: 10, roll: -6, armR: micAt(-3), face: face({brow: 0.9, browIn: 0.8, mw: 10, curve: -0.3, open: 0.3, gx: 0.6})}],
    [29.0, {...O_BASE, hy: 0, roll: -4, armR: waveArm(0), face: face({brow: 0.6, browIn: -0.4, mw: 13, curve: -0.2, open: 0.5})}],
    [29.35, {...O_BASE, hy: 0, roll: -4, armR: waveArm(1), face: face({brow: 0.6, browIn: -0.4, mw: 13, curve: -0.2, open: 0.5})}],
    [29.7, {...O_BASE, hy: 0, roll: -4, armR: waveArm(0), face: face({brow: 0.6, browIn: -0.4, mw: 13, curve: -0.2, open: 0.5})}],
    [30.05, {...O_BASE, hy: 0, roll: -4, armR: waveArm(1), face: face({brow: 0.6, browIn: -0.4, mw: 13, curve: -0.2, open: 0.5})}],
    [30.5, {...O_BASE, hy: 0, roll: -2, armR: waveArm(0.5), face: face({brow: 0.6, browIn: 0.2, mw: 13, curve: 0.2, open: 0.3})}],
    [31.6, O_BASE],
  ]);
  const br = per(t, 8);
  p = {...p, pel: v3(p.pel.x, p.pel.y + 0.8 * br, p.pel.z), armR: p.armR.shape === 'grip' && p.armR.hand.z === 58 ? {...p.armR, hand: v3(p.armR.hand.x, p.armR.hand.y + 2 * k(11), p.armR.hand.z)} : p.armR};
  return withFace(p, {open: Math.max(p.face.open, mouth), blink: blinkAt(t, [1.6, 5.2, 9.8, 14.1, 19.0, 23.0, 26.0, 31.2])});
};
/** the mic in her right hand: a black handle and a grey mesh ball, its cable down to the cart */
export const micHold: Hold = (rot) => ({
  back: React.createElement('g', {transform: `rotate(${-rot})`},
    React.createElement('rect', {x: -7, y: -26, width: 14, height: 40, rx: 6, fill: '#2B2B33', stroke: INK, strokeWidth: 3}),
    React.createElement('circle', {cx: 0, cy: -34, r: 13, fill: '#9FB0BA', stroke: INK, strokeWidth: 3}),
    React.createElement('path', {d: 'M -9 -38 L 9 -38 M -11 -32 L 11 -32 M -8 -26 L 8 -26', stroke: '#6E8390', strokeWidth: 1.6})),
});

// ------------------------------------------------------------------ the passerby (clerkA): phone and coffee
export const P_G0 = v3(LX + 0.95, 0, BZ + 0.5);
const P_H0 = 200;
const bP = B_P;
const SHp = bP.hipY + bP.spine;
const phoneArm = (k: number): Arm4 => ({hand: v3(-18 + 4 * k, SHp - 52 + 6 * k, 62), shape: 'grip', wrist: 0});
const cupArm = (k: number): Arm4 => ({hand: v3(bP.shW + 4, SHp - 80 + 90 * k, 44 + 14 * k), shape: 'grip'});
const P_FACE = face({brow: 0.1, mw: 12, curve: 0.1, gy: 0.75, gx: 0.1, lid: 0.2});
const Q_BASE: Pose4 = {...stand(bP), hp: 16, armR: phoneArm(0), armL: cupArm(0), face: P_FACE};
// the walk to the back of the room, round, and down the lane until his head is in the beam
const W1: Walk = {
  t0: 20.49, t1: 26.76, stride: 1.18, h0: P_H0, h1: 180,
  path: pathTable([{x: P_G0.x, z: P_G0.z}, {x: 2.05, z: 5.5}, {x: 1.45, z: 6.55}, {x: 0.6, z: 7.15}, {x: 0.05, z: 7.05}, {x: PX, z: 6.5}, {x: PX, z: 5.6}, {x: PX, z: BZ + 0.02}]),
};
// out of the beam: forward, toward the front
const W2: Walk = {t0: 31.6, t1: 32.85, stride: 1.0, h0: 180, h1: 180, path: pathTable([{x: PX, z: BZ + 0.02}, {x: PX, z: BZ - 0.45}, {x: PX - 0.05, z: BZ - 0.95}])};
// and off, toward the cart (out of the closing shot)
const W3: Walk = {t0: 32.95, t1: 35.2, stride: 1.18, h0: 180, h1: 240, path: pathTable([{x: PX - 0.05, z: BZ - 0.95}, {x: -0.6, z: BZ - 1.5}, {x: -1.6, z: BZ - 2.1}, {x: -2.8, z: BZ - 2.5}])};
export const WALKS = [W1, W2, W3].map((w, i) => ({w, pl: walkPlants(w, 0.11, i === 1 ? 'R' : 'L')}));
export const passerbyAt = (t: number) => {
  // gestures over the base pose
  let base: Pose4 = keyed(t, [
    [0, Q_BASE],
    // a sip at the start of the two-shot, a glance up and a shrug at "nobody beside you hears", back to the phone
    [2.95, Q_BASE],
    [3.25, {...Q_BASE, hp: 4, armL: cupArm(1), face: {...P_FACE, gy: 0.3, lid: 0.5}}],
    [3.6, {...Q_BASE, hp: 2, armL: cupArm(0.2), face: {...P_FACE, gy: 0, gx: 0.8}}],
    [3.95, {...Q_BASE, hp: 0, hy: 30, hr: 6, roll: 3, armL: cupArm(0.1), face: face({brow: 0.8, browIn: 0.3, mw: 10, curve: -0.3, gx: 0.9, asym: 0.5})}],
    [4.45, {...Q_BASE, hp: 0, hy: 22, hr: -6, roll: -3, armL: cupArm(0.1), face: face({brow: 0.8, browIn: 0.3, mw: 10, curve: -0.3, gx: 0.9, asym: 0.5})}],
    [4.85, {...Q_BASE, hy: 0, face: P_FACE}],
    [19.6, Q_BASE],
    [20.2, {...Q_BASE, hp: 10, hy: 20, face: {...P_FACE, gx: 0.6, gy: 0.4}}],
    [21.0, Q_BASE],
    // in the beam: oblivious; at "blocking it" he glances up, sees the operator waving, a startled look
    [29.75, Q_BASE],
    [30.05, {...Q_BASE, hp: -2, hy: 40, face: face({brow: 0.6, mw: 10, curve: 0, gx: 0.9})}],
    [30.4, {...Q_BASE, hp: -4, hy: 62, face: face({brow: 1, browIn: 0.6, wide: 1, mw: 9, curve: -0.3, open: 0.4, gx: 0.9})}],
    [30.85, {...Q_BASE, hp: -2, hy: 50, armR: {hand: v3(-bP.shW - 20, SHp + 10, 70), shape: 'grip'}, face: face({brow: 0.9, browIn: 0.9, mw: 12, curve: -0.2, open: 0.25, gx: 0.7, blush: 0.6})}],
    [31.8, {...Q_BASE, hp: 4, hy: 30, armR: {hand: v3(-bP.shW - 10, SHp, 70), shape: 'grip'}, face: face({brow: 0.7, browIn: 0.9, mw: 13, curve: 0.3, gx: 0.8, blush: 0.6})}],
    [32.6, {...Q_BASE, hp: 10, face: P_FACE}],
  ]);
  // which walk segment applies
  let g = P_G0, h = P_H0, pose = base, moving = 0;
  // during the hook (before the first cut) he is still walking away from the closing shot: the film's end runs on
  // into its start, out of the hook's frame; from the first cut he is beside her
  const tw = t < 1.0 ? t + DUR : t;
  const active = [...WALKS].reverse().find((x) => tw >= x.w.t0 - 1e-6);
  if (active) {
    const wp = walkPose(bP, active.w, active.pl, tw, base);
    g = wp.g;
    h = wp.h;
    moving = wp.moving;
    // the free (cup) arm swings with the stride; the phone arm stays up
    const sw = wp.swing;
    pose = {...wp.pose, armL: {...base.armL, hand: add3(base.armL.hand, v3(0, 4 * Math.abs(sw), -26 * sw))}};
  } else {
    const br = per(t, 7);
    pose = {...base, pel: v3(base.pel.x, base.pel.y + 0.8 * br, base.pel.z)};
  }
  // texting: the thumb taps make the phone bob a little
  const typing = 1.5 * Math.max(0, Math.sin(t * 17)) * (1 - ss(t, 29.9, 30.1) + ss(t, 32.4, 32.6));
  pose = {...pose, armR: {...pose.armR, hand: add3(pose.armR.hand, v3(0, typing, 0))}};
  pose = withFace(pose, {blink: blinkAt(t, [1.2, 6.4, 12.0, 17.0, 22.4, 25.1, 28.3, 30.2, 33.0])});
  return {g, h, pose, moving};
};

// ------------------------------------------------------------------ head geometry in the world (beam ends, block)
const headWorld = (b: typeof bL, pose: Pose4, g: V3, h: number) => {
  const j = joints4(b, pose);
  return {c: cardToWorld(g, h, j.Hc), hx: j.hx, j};
};
/** her left ear in the world (the beam's target) */
export const earOf = (t: number) => {
  const p = listenerPose(t);
  const j = joints4(bL, p);
  return cardToWorld(L_G, L_H, add3(j.Hc, add3(mul3(j.hx, bL.R + 2), mul3(j.hy, -6))));
};
/** her head centre and left ear in the world (the beam paints in front of or behind her head by which is nearer) */
export const earAndHead = (t: number) => {
  const p = listenerPose(t);
  const j = joints4(bL, p);
  return {ear: cardToWorld(L_G, L_H, add3(j.Hc, add3(mul3(j.hx, bL.R + 2), mul3(j.hy, -6)))), head: cardToWorld(L_G, L_H, j.Hc)};
};
/** where the beam stops: at her ear, or on the near side of his head while it is in the way */
export const beamEnd = (t: number) => {
  const ear = earOf(t);
  const ps = passerbyAt(t);
  const H = headWorld(bP, ps.pose, ps.g, ps.h).c;
  const r = (bP.R + 6) / 267;
  // the beam line from the lens to the ear; distance of his head centre from it
  const u = (H.x - LENS.x) / (ear.x - LENS.x);
  if (u > 0 && u < 1) {
    const on = v3(LENS.x + (ear.x - LENS.x) * u, LENS.y + (ear.y - LENS.y) * u, LENS.z + (ear.z - LENS.z) * u);
    const dy = H.y - on.y, dz = H.z - on.z;
    const q = r * r - dy * dy - dz * dz;
    if (q > 0) return {end: v3(H.x - Math.sqrt(q), on.y, on.z), blocked: true, ear};
  }
  return {end: ear, blocked: false, ear};
};
export const LISTENER_ACTOR = (t: number, earCU = 0): Actor => ({id: 'L', look: LISTENER, b: bL, pose: listenerPose(t), g: L_G, h: L_H, earCU});
export const OPERATOR_ACTOR = (t: number): Actor => ({id: 'O', look: OPERATOR, b: bO, pose: operatorPose(t), g: O_G, h: O_H, holdR: micHold});
export const PASSERBY_ACTOR = (t: number): Actor => {
  const p = passerbyAt(t);
  return {id: 'P', look: PASSERBY, b: bP, pose: p.pose, g: p.g, h: p.h, holdR: phoneHold(), holdL: cupHold()};
};
export const cast = (t: number, earCU = 0): Actor[] => [LISTENER_ACTOR(t, earCU), OPERATOR_ACTOR(t), PASSERBY_ACTOR(t)];
export {BEAM_Y};
