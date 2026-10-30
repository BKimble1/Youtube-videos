// The worksite world and its choreography over the whole film. Every value is a pure function of the film time t,
// so the machine, the branches and the camera keep their state across every cut back to this world.
import React from 'react';
import {add, clamp, easeIn, easeInOut, easeOut, lerp, mul, settle, sub, V} from '../dc/math';
import {keys, pr, pulse, vnoise, zkeys} from '../lib/core';
import {TT} from '../lib/timeline';
import {circ, f, INK, Line} from '../lib/draw';
import {ArmPose, Machine, MachineDefs, machineGeo, MachinePose} from '../art/Machine';
import {along, Backdrop, Branch, BranchDef, Cam, CutState, Layer, Sawdust, Track, Tree, WorldDefs} from '../art/World';
import {Man, manJoints, ManPose} from '../dc/Man';
import {EXPR_NEUTRAL} from '../dc/Head';
import {HAND_RELAXED} from '../dc/Hand';

export const TRUCK_X = -430;
const TREE_X = 1215;

export const BR1: BranchDef = {id: 'b1', pts: [{x: 1195, y: -1112}, {x: 1045, y: -1096}, {x: 895, y: -1104}, {x: 765, y: -1136}], r: [16, 13, 9.5, 4], seed: 3};
export const BR2: BranchDef = {id: 'b2', pts: [{x: 1195, y: -905}, {x: 1050, y: -886}, {x: 905, y: -908}, {x: 785, y: -948}], r: [17, 13.5, 10, 4.5], seed: 7};
export const BR3: BranchDef = {id: 'b3', pts: [{x: 1195, y: -1290}, {x: 1050, y: -1278}, {x: 910, y: -1296}, {x: 795, y: -1328}], r: [15, 12.5, 9, 4], seed: 13};
const CUT_U = 0.32;
const GRIP_U = 0.62;

const tt = TT;

/** a wrist target that puts the claw's grip point on a branch point, approaching at angle a */
const clawAt = (p: V, a: number, lift = 0): ArmPose => {
  const d = {x: Math.cos((a * Math.PI) / 180), y: Math.sin((a * Math.PI) / 180)};
  return {w: add(sub(p, mul(d, 62)), {x: 0, y: -lift}), a, side: -1};
};
/** a wrist target that puts the saw's cutting point on a branch point at angle a, `back` cm withdrawn along the bar */
const sawAt = (p: V, a: number, back = 0, up = 0): ArmPose => {
  const d = {x: Math.cos((a * Math.PI) / 180), y: Math.sin((a * Math.PI) / 180)};
  const n = {x: -d.y, y: d.x};
  return {w: add(sub(sub(p, mul(d, 95 + back)), mul(n, 7)), {x: 0, y: -up}), a, side: -1};
};
const mixArm = (A: ArmPose, B: ArmPose, t: number): ArmPose => ({w: {x: lerp(A.w.x, B.w.x, t), y: lerp(A.w.y, B.w.y, t)}, a: lerp(A.a, B.a, t), side: B.side});
const seqArm = (t: number, ks: [number, ArmPose][]) => {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) {
    if (t <= ks[i + 1][0]) return mixArm(ks[i][1], ks[i + 1][1], easeInOut(clamp((t - ks[i][0]) / (ks[i + 1][0] - ks[i][0]))));
  }
  return ks[ks.length - 1][1];
};

// branch points
const b1cut = along(BR1, CUT_U).p;
const b1grip = along(BR1, GRIP_U).p;
const b2cut = along(BR2, CUT_U).p;
const b2grip = along(BR2, GRIP_U).p;
const b3cut = along(BR3, CUT_U).p;
const b3grip = along(BR3, GRIP_U).p;

const CLAW_A = 72;
const TOUCH_A = -38;
/** steel arms: the claw's fingertips `gap` cm short of the underside of branch 3, approaching up-right */
const touchAt = (gap: number): ArmPose => {
  const a = along(BR3, GRIP_U);
  const d = {x: Math.cos((TOUCH_A * Math.PI) / 180), y: Math.sin((TOUCH_A * Math.PI) / 180)};
  // the fingertips reach about 96 cm along the claw axis from the wrist
  const target = add(a.p, {x: 0, y: a.r});
  return {w: sub(target, mul(d, 96 + gap)), a: TOUCH_A, side: -1};
};
export const TOUCH_PT = (() => {
  const a = along(BR3, GRIP_U);
  return add(a.p, {x: 0, y: a.r});
})();
const SAW_A = 64;
const REST_CLAW: ArmPose = {w: {x: 860, y: -1000}, a: 70, side: -1};
const REST_SAW: ArmPose = {w: {x: 880, y: -1060}, a: 55, side: -1};

/** branch 1 piece: through at t1 (hook) */
const T1_THROUGH = tt.through1 + 0.42;
const T2_CONTACT = tt.intoCut - 0.15;
const T2_THROUGH = tt.breaks + 1.05;
const T3_CONTACT = tt.mechanical - 0.25;
const T3_THROUGH = tt.end + 1.9;

export const worksite = (t: number) => {
  // --- claw arm --------------------------------------------------------------------------------------------
  const claw = seqArm(t, [
    [0, clawAt(b1grip, CLAW_A)],
    [T1_THROUGH, clawAt(b1grip, CLAW_A)],
    [T1_THROUGH + 0.5, clawAt(b1grip, CLAW_A + 3, 5)],
    // during the cab interior (cameras/moves) the piece is carried aside and set down off-screen; arm returns
    [tt.moves - 0.3, clawAt(b1grip, CLAW_A + 3, 5)],
    [tt.moves + 1.6, {w: {x: 840, y: -980}, a: 95, side: -1}],
    [tt.looks, REST_CLAW],
    [tt.grips, REST_CLAW],
    [tt.grips + 0.7, clawAt(b2grip, CLAW_A, 60)],
    [tt.grips + 1.15, clawAt(b2grip, CLAW_A, 0)],
    [tt.weight, clawAt(b2grip, CLAW_A, 0)],
    [tt.weight + 0.45, clawAt(b2grip, CLAW_A, 4)],
    [T2_THROUGH, clawAt(b2grip, CLAW_A, 4)],
    [T2_THROUGH + 0.4, clawAt(b2grip, CLAW_A + 2, 9)],
    // a crane can lift: raise the piece
    [tt.crane, clawAt(b2grip, CLAW_A + 2, 9)],
    [tt.crane + 1.1, clawAt(add(b2grip, {x: -60, y: -150}), CLAW_A - 6, 0)],
    [tt.controlEnd + 2, clawAt(add(b2grip, {x: -60, y: -150}), CLAW_A - 6, 0)],
    // (off-screen during the bilateral explanation the piece is set down; by the steel-arms shot the claw is free)
    // steel arms: from below-left, the fingertips come up and touch the underside of branch 3 (matched to the hand)
    [tt.imagine, touchAt(70)],
    [tt.except, touchAt(70)],
    [tt.steel + 0.15, touchAt(0)],
    [tt.armsEnd + 1.2, touchAt(-3)],
    [tt.still - 0.6, clawAt(add(b3grip, {x: 0, y: -14}), CLAW_A, 40)],
    // ending: the claw closes on branch 3, then holds the piece
    [tt.gave + 0.2, clawAt(add(b3grip, {x: 0, y: -14}), CLAW_A, 26)],
    [tt.pair - 0.05, clawAt(b3grip, CLAW_A, 0)],
    [T3_THROUGH, clawAt(b3grip, CLAW_A, 0)],
    [T3_THROUGH + 0.6, clawAt(b3grip, CLAW_A + 3, 6)],
  ]);
  const open = keys(t, [
    [0, 0.33],
    [tt.moves + 0.8, 0.33],
    [tt.moves + 1.4, 0.7],
    [tt.looks, 0.25],
    [tt.grips + 0.35, 0.25],
    [tt.grips + 0.85, 0.95],
    [tt.grips + 1.15, 0.95],
    [tt.grips + 1.55, 0.33, easeOut],
    [tt.imagine - 0.5, 0.33],
    [tt.imagine, 0.55],
    [tt.still - 1.2, 0.55],
    [tt.still, 0.95],
    [tt.pair - 0.15, 0.95],
    [tt.pair + 0.35, 0.33, easeOut],
  ]);
  const squeeze = pulse(t, tt.grabs, tt.grabs + 0.3, tt.grabs + 0.8, tt.grabs + 1.4) + pulse(t, tt.weight, tt.weight + 0.25, tt.weight + 0.7, tt.weight + 1.2) + pulse(t, tt.pair + 0.3, tt.pair + 0.5, tt.pair + 0.9, tt.pair + 1.4);

  // --- saw arm ---------------------------------------------------------------------------------------------
  const k1 = keys(t, [[0, 0.42], [T1_THROUGH, 1, (x) => x]]);
  const k2 = keys(t, [[T2_CONTACT, 0], [T2_THROUGH, 1, (x) => x]]);
  const k3 = keys(t, [[T3_CONTACT, 0], [T3_THROUGH, 1, (x) => x]]);
  const cutDepth = (c: V, k: number, br: BranchDef) => add(c, {x: 0, y: (k - 0.5) * 2 * along(br, CUT_U).r});
  const saw = seqArm(t, [
    [0, sawAt(cutDepth(b1cut, k1, BR1), SAW_A)],
    [T1_THROUGH, sawAt(cutDepth(b1cut, 1, BR1), SAW_A)],
    [T1_THROUGH + 1.4, sawAt(b1cut, SAW_A, 40, 50)],
    [tt.cameras, sawAt(b1cut, SAW_A, 40, 50)],
    [tt.looks, REST_SAW],
    [tt.angles, REST_SAW],
    [tt.angles + 1.1, sawAt(add(b2cut, {x: 0, y: -along(BR2, CUT_U).r}), SAW_A, 30, 20)],
    [T2_CONTACT, sawAt(cutDepth(b2cut, 0, BR2), SAW_A)],
    ...(Array.from({length: 9}, (_, i) => {
      const tk = lerp(T2_CONTACT, T2_THROUGH, (i + 1) / 9);
      return [tk, sawAt(cutDepth(b2cut, (i + 1) / 9, BR2), SAW_A)] as [number, ArmPose];
    })),
    [T2_THROUGH + 0.9, sawAt(b2cut, SAW_A, 40, 60)],
    // a chainsaw can cut: a pass along the stump's twig
    [tt.chainsaw2 - 0.2, sawAt(add(b2cut, {x: 60, y: -40}), SAW_A - 10, 10, 20)],
    [tt.chainsaw2 + 0.5, sawAt(add(b2cut, {x: 60, y: -18}), SAW_A - 10, 0, 0)],
    [tt.chainsaw2 + 1.3, sawAt(add(b2cut, {x: 60, y: -40}), SAW_A - 10, 20, 30)],
    [tt.both + 0.8, sawAt(add(b2cut, {x: 40, y: -40}), SAW_A, 30, 40)],
    [tt.imagine, REST_SAW],
    [tt.armsEnd + 1.5, REST_SAW],
    // ending: the saw is up at branch 3, idling; it stops; then cuts
    [tt.still - 1.5, sawAt(b3cut, SAW_A, 30, 26)],
    [tt.pair, sawAt(b3cut, SAW_A, 30, 26)],
    [T3_CONTACT, sawAt(cutDepth(b3cut, 0, BR3), SAW_A)],
    ...(Array.from({length: 9}, (_, i) => {
      const tk = lerp(T3_CONTACT, T3_THROUGH, (i + 1) / 9);
      return [tk, sawAt(cutDepth(b3cut, (i + 1) / 9, BR3), SAW_A)] as [number, ArmPose];
    })),
    [T3_THROUGH + 0.8, sawAt(b3cut, SAW_A, 30, 40)],
  ]);
  // chain run 0..1
  const run = keys(t, [
    [0, 1],
    [T1_THROUGH + 0.3, 1],
    [T1_THROUGH + 1.2, 0],
    [tt.angles + 0.7, 0],
    [tt.angles + 1.0, 1],
    [T2_THROUGH + 0.5, 1],
    [T2_THROUGH + 1.2, 0],
    [tt.chainsaw2 - 0.3, 0],
    [tt.chainsaw2, 1],
    [tt.chainsaw2 + 1.4, 1],
    [tt.chainsaw2 + 1.9, 0],
    [tt.still - 1.5, 0],
    [tt.still - 1.2, 1],
    [tt.still + 0.55, 1],
    [tt.still + 1.3, 0, easeOut],
    [tt.mechanical - 0.7, 0],
    [tt.mechanical - 0.4, 1],
    [T3_THROUGH + 0.4, 1],
    [T3_THROUGH + 1.2, 0],
  ]);
  const chain = chainPhase(t);
  const cutting = (t < T1_THROUGH ? 1 : 0) + (t > T2_CONTACT && t < T2_THROUGH ? 1 : 0) + (t > T3_CONTACT && t < T3_THROUGH ? 1 : 0);

  // --- boom (re-aims a little between jobs) --------------------------------------------------------------------
  // boom tip aims: hook (700,-960), two arms (700,-800), steel arms / ending (720,-1110)
  const b1 = keys(t, [[0, 62], [tt.looks, 62], [tt.twoArms, 58], [tt.imagine, 58], [tt.except, 64], [tt.still, 64]]);
  const b2 = keys(t, [[0, 28], [tt.looks, 28], [tt.twoArms, 16.4], [tt.imagine, 16.4], [tt.except, 36.5], [tt.still, 36.5]]);
  const l2 = keys(t, [[0, 630], [tt.looks, 630], [tt.twoArms, 546], [tt.imagine, 546], [tt.except, 736], [tt.still, 736]]);
  const head = keys(t, [[0, 0], [tt.deciding, 0], [tt.deciding + 0.6, -6], [tt.person, -6], [tt.person + 0.5, 0]]);

  const pose: MachinePose = {x: TRUCK_X, b1, b2, l2, claw, saw, open, squeeze: clamp(squeeze), run, chain, head, shake: cutting * run * 0.6};

  // --- branch states -----------------------------------------------------------------------------------------
  const g = machineGeo(pose);
  const pieceXf = (through: number, gripPt: V, refClaw: ArmPose) => {
    // the piece follows the claw rigidly after the cut: translate by the grip point's travel, rotate by claw angle change
    if (t < through) return {rot: 0, pivot: gripPt, move: {x: 0, y: 0}};
    const sag = 2.2 * settle(clamp((t - through) / 0.9));
    const gp = g.grip;
    const ref = add(refClaw.w, mul({x: Math.cos((refClaw.a * Math.PI) / 180), y: Math.sin((refClaw.a * Math.PI) / 180)}, 62));
    return {rot: g.clawF.a - refClaw.a + sag, pivot: gripPt, move: sub(gp, ref)};
  };
  const ref1 = clawAt(b1grip, CLAW_A);
  const ref2 = clawAt(b2grip, CLAW_A, 4);
  const ref3 = clawAt(b3grip, CLAW_A);
  const cut1: CutState = {u: CUT_U, k: k1, ...pieceXf(T1_THROUGH, b1grip, ref1)};
  const cut2: CutState | undefined = t > T2_CONTACT ? {u: CUT_U, k: k2, ...pieceXf(T2_THROUGH, b2grip, ref2)} : undefined;
  const cut3: CutState | undefined = t > T3_CONTACT ? {u: CUT_U, k: k3, ...pieceXf(T3_THROUGH, b3grip, ref3)} : undefined;
  // piece 1 is put down during the cab interior; piece 2 during the bilateral section
  const showPiece1 = t < tt.moves + 1.2;
  const showPiece2 = t < tt.imagine - 0.2;
  // branch 3 flexes where the fingertips touch it (steel arms)
  const touch = pulse(t, tt.steel, tt.steel + 0.25, tt.armsEnd + 0.6, tt.armsEnd + 1.5);
  return {pose, g, cut1, cut2, cut3, showPiece1, showPiece2, touch, cutting, k1, k2, k3, T1_THROUGH, T2_CONTACT, T2_THROUGH, T3_CONTACT, T3_THROUGH};
};

/** the chain's phase: integral of the run state (cm of chain travel); deterministic by sampling */
export const chainPhase = (t: number) => {
  // chain speed ~ 1800 cm/s at full run is far beyond the frame rate; the drawn dash pattern advances ~37 cm per
  // frame at full speed (an irregular step, so it reads as motion rather than a strobe-frozen chain)
  let s = 0;
  const dt = 1 / 30;
  for (let x = 0; x < t; x += dt) s += runAt(x) * 37 * (0.8 + 0.2 * Math.sin(x * 7.3));
  return s;
};
const runAt = (x: number) => {
  // same keys as `run` above but cheap (no machine evaluation)
  const tt2 = TT;
  return keys(x, [
    [0, 1],
    [tt2.through1 + 0.42 + 0.3, 1],
    [tt2.through1 + 0.42 + 1.2, 0],
    [tt2.angles + 0.7, 0],
    [tt2.angles + 1.0, 1],
    [tt2.breaks + 1.05 + 0.5, 1],
    [tt2.breaks + 1.05 + 1.2, 0],
    [tt2.chainsaw2 - 0.3, 0],
    [tt2.chainsaw2, 1],
    [tt2.chainsaw2 + 1.4, 1],
    [tt2.chainsaw2 + 1.9, 0],
    [tt2.still - 1.5, 0],
    [tt2.still - 1.2, 1],
    [tt2.still + 0.55, 1],
    [tt2.still + 1.3, 0, easeOut],
    [tt2.mechanical - 0.7, 0],
    [tt2.mechanical - 0.4, 1],
    [tt2.end + 1.9 + 0.4, 1],
    [tt2.end + 1.9 + 1.2, 0],
  ]);
};

/** camera over the worksite segments */
export const worksiteCam = (t: number): Cam => {
  const c1 = {x: b1cut.x + 10, y: b1cut.y - 10};
  if (t < tt.cabin + 0.5) {
    // hook -> hazard tilt -> reveal -> push to cabin window
    const x = keys(t, [
      [0, c1.x - 45],
      [tt.watch, c1.x - 60],
      [tt.grabs + 0.6, b1grip.x + 40],
      [tt.bladeCuts, b1grip.x + 60],
      [tt.thatClaw + 0.4, (b1grip.x + b1cut.x) / 2],
      [tt.important + 0.3, (b1grip.x + b1cut.x) / 2],
      [tt.tracks + 0.3, b1grip.x + 40],
      [tt.combination + 0.3, b1grip.x + 40],
      [tt.rest + 0.5, b1grip.x - 40],
      [tt.rest + 1.3, 740],
      [tt.legs + 0.4, 730],
      [tt.legsEnd + 0.4, 710],
      [tt.boom + 0.9, 440],
      [tt.rising + 0.8, 120],
      [tt.vehicle + 0.4, 160],
      [tt.person, 160],
      [tt.movementEnd + 0.6, TRUCK_X + 271],
      [tt.cabin, TRUCK_X + 271],
    ]);
    const y = keys(t, [
      [0, c1.y + 5],
      [tt.watch, c1.y],
      [tt.grabs + 0.6, b1grip.y + 5],
      [tt.thatClaw + 0.4, b1grip.y + 30],
      [tt.important + 0.3, b1grip.y + 40],
      [tt.tracks + 0.3, -250, easeInOut],
      [tt.combination + 0.3, -250],
      [tt.rest + 0.9, -1060],
      [tt.rest + 1.3, -1110],
      [tt.legs + 0.4, -1000],
      [tt.legsEnd + 0.4, -920],
      [tt.boom + 0.9, -760],
      [tt.rising + 0.8, -620],
      [tt.vehicle + 0.4, -580],
      [tt.person, -580],
      [tt.movementEnd + 0.6, -268],
      [tt.cabin, -268],
    ]);
    const z = zkeys(t, [
      [0, 5.9],
      [tt.watch, 5.6],
      [tt.grabs + 0.6, 5.6],
      [tt.thatClaw + 0.4, 4.4],
      [tt.important + 0.3, 3.4],
      [tt.tracks + 0.3, 2.0],
      [tt.combination + 0.3, 2.0],
      [tt.rest + 0.9, 2.6],
      [tt.rest + 1.3, 3.0],
      [tt.legs + 0.4, 2.7],
      [tt.legsEnd + 0.4, 2.4],
      [tt.boom + 0.9, 1.5],
      [tt.rising + 0.8, 0.82],
      [tt.vehicle + 0.4, 0.7],
      [tt.person, 0.7],
      [tt.movementEnd + 0.6, 3.6, easeIn],
      [tt.cabin, 6.4, easeIn],
    ]);
    return {x, y, z};
  }
  if (t < tt.twoArms - 0.6) {
    // back out of the window to the wide, then settle with the cabin in the lower third
    const x = keys(t, [[tt.looks, TRUCK_X + 271], [tt.looks + 1.6, 160, easeOut], [tt.bottom, 140]]);
    const y = keys(t, [[tt.looks, -268], [tt.looks + 1.6, -600, easeOut], [tt.bottomBut, -600], [tt.bottom, -520]]);
    const z = zkeys(t, [[tt.looks, 6.4], [tt.looks + 1.7, 0.7, easeOut], [tt.bottomBut, 0.68], [tt.bottom, 0.74]]);
    return {x, y, z};
  }
  if (t < tt.another) {
    // two arms: push in to branch 2, follow the action, then travel down the boom to the cabin
    const x = keys(t, [
      [tt.twoArms - 0.6, 140],
      [tt.twoArms + 1.5, 930],
      [tt.weight, 960],
      [tt.intoCut, 1010],
      [tt.drop, 980],
      [tt.crane + 0.4, 950],
      [tt.chainsaw2 + 0.3, 1040],
      [tt.both + 0.3, 900],
      [tt.oneControl, 860],
      [tt.controlEnd + 0.35, 200],
      [tt.another, TRUCK_X + 271],
    ]);
    const y = keys(t, [
      [tt.twoArms - 0.6, -520],
      [tt.twoArms + 1.5, -960],
      [tt.weight, -940],
      [tt.intoCut, -930],
      [tt.drop, -950],
      [tt.crane + 0.4, -1000],
      [tt.chainsaw2 + 0.3, -950],
      [tt.both + 0.3, -1000],
      [tt.oneControl, -980],
      [tt.controlEnd + 0.35, -560],
      [tt.another, -268],
    ]);
    const z = zkeys(t, [
      [tt.twoArms - 0.6, 0.74],
      [tt.twoArms + 1.5, 2.6],
      [tt.weight, 3.0],
      [tt.intoCut, 3.4],
      [tt.drop, 2.8],
      [tt.crane + 0.4, 2.6],
      [tt.chainsaw2 + 0.3, 3.2],
      [tt.both + 0.3, 2.1],
      [tt.oneControl, 2.0],
      [tt.controlEnd + 0.35, 1.3],
      [tt.another, 6.4, easeIn],
    ]);
    return {x, y, z};
  }
  if (t < tt.stunt) {
    // steel arms: from the matched claw close-up out to the full machine and the person beside it
    const z0 = 5.4;
    const x = keys(t, [[tt.except, TOUCH_PT.x - 60 / z0], [tt.steel + 0.2, TOUCH_PT.x - 60 / z0], [tt.armsEnd + 1.7, -60, easeInOut]]);
    const y = keys(t, [[tt.except, TOUCH_PT.y - 30 / z0], [tt.steel + 0.2, TOUCH_PT.y - 30 / z0], [tt.armsEnd + 1.7, -640, easeInOut]]);
    const z = zkeys(t, [[tt.except, z0], [tt.steel + 0.2, z0 * 0.92], [tt.armsEnd + 1.7, 0.62, easeInOut]]);
    return {x, y, z};
  }
  // ending
  const x = keys(t, [
    [tt.still - 0.3, b3cut.x + 40],
    [tt.chainsaw3 + 0.4, b3cut.x + 10],
    [tt.most, b3cut.x],
    [tt.partEnd + 0.3, TRUCK_X + 271],
    [tt.japan2, TRUCK_X + 271],
    [tt.gave + 0.45, (b3grip.x + b3cut.x) / 2],
    [tt.mechanical, (b3grip.x + b3cut.x) / 2 + 10],
    [tt.end + 0.4, 760],
    [tt.dur, 160],
  ]);
  const y = keys(t, [
    [tt.still - 0.3, b3cut.y + 20],
    [tt.chainsaw3 + 0.4, b3cut.y + 10],
    [tt.most, b3cut.y],
    [tt.partEnd + 0.3, -268],
    [tt.japan2, -268],
    [tt.gave + 0.45, b3grip.y + 20],
    [tt.mechanical, b3grip.y + 20],
    [tt.end + 0.4, -1150],
    [tt.dur, -720],
  ]);
  const z = zkeys(t, [
    [tt.still - 0.3, 5.0],
    [tt.chainsaw3 + 0.4, 6.0],
    [tt.most, 5.6],
    [tt.partEnd + 0.3, 6.4, easeInOut],
    [tt.japan2, 6.4],
    [tt.gave + 0.45, 4.6],
    [tt.mechanical, 4.2],
    [tt.end + 0.4, 2.2],
    [tt.dur, 0.64],
  ]);
  return {x, y, z};
};

/** the worker who stands well clear on the ground (scale reference in the steel-arms pull-back) */
const LOOKOUT: ManPose = {
  x: 0, y: 0, s: 0.2, torso: 2, chest: 1, neck: 2, turn: -0.4, pelvis: 0,
  lTu: 200, lTv: -30, lWx: 0, lWy: 0, lW: 0, lElb: 1, lWr: 0,
  rTu: 200, rTv: 20, rWx: 0, rWy: 0, rW: 0, rElb: 1, rWr: 0,
  lHip: 4, lKnee: 4, lAnk: 0, rHip: -4, rKnee: 2, rAnk: 0, lFs: 1, lFsh: 1, rFs: 1, rFsh: 1, breath: 0.3,
};
export const WORKER = {skin: '#F2C9A8', hair: '#2B2420', shirt: '#F28C28', stripe: '#E9F0F2', pants: '#2E3F5C', shoe: '#3A3F45', longSleeve: true, hat: {color: '#FFFFFF', band: '#2E7D4F'}};

/** a slight hand-held drift (screen px) for the shots that stand in for camera footage */
const drift = (t: number, c: Cam): Cam => ({x: c.x + (vnoise(t * 0.8, 1) * 5 + vnoise(t * 2.1, 2) * 1.5) / c.z, y: c.y + (vnoise(t * 0.7, 3) * 4 + vnoise(t * 1.9, 4) * 1.2) / c.z, z: c.z});

export const Worksite: React.FC<{t: number; cam?: Cam; ghostFall?: boolean; lookout?: boolean}> = ({t, cam: camIn, lookout}) => {
  const s = worksite(t);
  const cam = camIn ?? drift(t, worksiteCam(t));
  const {pose, g} = s;
  // ghost fall (illustration of the hazard): a translucent copy of the piece falling along a dashed path to the rails
  const gf = pr(t, tt.falling - 0.1, tt.tracks + 0.35, easeIn);
  const gfo = pulse(t, tt.falling - 0.3, tt.falling, tt.combination - 0.2, tt.combination + 0.5);
  const fallY = lerp(0, 1090, gf);
  const fallRot = lerp(0, 38, gf);
  const lookoutPose = (() => {
    const p0 = {...LOOKOUT};
    const j = manJoints(p0);
    return {...p0, x: -980 - j.head.x, y: -150 - j.head.y};
  })();
  return (
    <g>
      <defs>
        <WorldDefs />
        <MachineDefs />
      </defs>
      <Backdrop cam={cam} t={t} />
      <Layer cam={cam}>
        <Track />
        <Tree x={TREE_X} y={-40} h={1900} seed={5} />
        {lookout && (
          <g>
            <ellipse cx={-980} cy={-36} rx={40} ry={8} fill="#000" opacity={0.15} />
            <Man id="lookout" pose={lookoutPose} expr={{...EXPR_NEUTRAL, gx: 0.6, gy: -0.6}} lHand={HAND_RELAXED} rHand={HAND_RELAXED} outfit={WORKER} />
          </g>
        )}
        <Machine p={pose} layer="base" cabinLight={t > tt.still ? pr(t, tt.end - 0.5, tt.end + 0.8) : pr(t, tt.person - 0.2, tt.movementEnd)} windowGlow={pulse(t, tt.bottomBut, tt.bottomBut + 0.5, tt.bottom + 0.4, tt.bottom + 1.2)} />
        <Machine p={pose} layer="back" />
        {/* branch 3 (ending) flexes slightly where the fingertips touch it */}
        <g transform={`rotate(${f(s.touch * 1.1)} ${BR3.pts[0].x} ${BR3.pts[0].y})`}>
          <Branch b={BR3} cut={s.cut3} />
        </g>
        <Branch b={BR2} cut={s.cut2 && (s.showPiece2 ? s.cut2 : {...s.cut2, move: {x: 0, y: 99999}})} />
        <Branch b={BR1} cut={s.showPiece1 ? s.cut1 : {...s.cut1, move: {x: 0, y: 99999}}} />
        {gfo > 0.001 && (
          <g opacity={gfo * 0.8}>
            <path d={`M${f(b1grip.x)} ${f(b1grip.y)} Q ${f(b1grip.x + 30)} ${f(b1grip.y + 500)} ${f(b1grip.x + 50)} -12`} fill="none" stroke="#FFFFFF" strokeWidth={5} strokeDasharray="18 14" />
            <g transform={`translate(${f(lerp(0, 50, gf))} ${f(fallY)}) rotate(${f(fallRot)} ${f(b1grip.x)} ${f(b1grip.y)})`}>
              <Branch b={{...BR1, id: 'ghost'}} cut={{u: CUT_U, k: 1, rot: 0, pivot: b1grip, move: {x: 0, y: 0}}} foliage={false} />
            </g>
            {gf >= 1 && <ellipse cx={b1grip.x + 50} cy={-14} rx={f(60 + 120 * pr(t, tt.tracks + 0.35, tt.tracks + 1.2))} ry={f(10 + 18 * pr(t, tt.tracks + 0.35, tt.tracks + 1.2))} fill="none" stroke="#FFFFFF" strokeWidth={4} opacity={1 - pr(t, tt.tracks + 0.35, tt.tracks + 1.4)} />}
          </g>
        )}
        <Machine p={pose} layer="front" />
        {/* sawdust at the kerf while cutting */}
        <Sawdust at={add(b1cut, {x: 6, y: 10})} dir={{x: 0.55, y: 0.6}} t={t} t0={-1} t1={s.T1_THROUGH} />
        <Sawdust at={add(b2cut, {x: 6, y: 10})} dir={{x: 0.55, y: 0.6}} t={t} t0={s.T2_CONTACT} t1={s.T2_THROUGH} />
        <Sawdust at={add(b2cut, {x: 66, y: -14})} dir={{x: 0.6, y: 0.5}} t={t} t0={tt.chainsaw2 + 0.35} t1={tt.chainsaw2 + 1.0} scale={0.7} />
        <Sawdust at={add(b3cut, {x: 6, y: 10})} dir={{x: 0.55, y: 0.6}} t={t} t0={s.T3_CONTACT} t1={s.T3_THROUGH} />
      </Layer>
      {/* foreground larch twigs drifting past (parallax, near the lens) */}
      <Layer cam={cam} p={1.35} q={1.08} a0={{x: 900, y: -1000}}>
        <g opacity={0.9}>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${-400 + i * 1500} ${-1500 + i * 260})`}>
              <path d="M0 0 C 80 40 160 50 260 30" stroke="#4F3A2C" strokeWidth={6} fill="none" />
              {[40, 100, 160, 220].map((u, j) => (
                <ellipse key={j} cx={u} cy={30 + (j % 2 ? -18 : 14)} rx={34} ry={22} fill={j % 2 ? '#F0BE57' : '#DFA03A'} opacity={0.95} />
              ))}
            </g>
          ))}
        </g>
      </Layer>
    </g>
  );
};

export {INK, circ, Line, vnoise};
