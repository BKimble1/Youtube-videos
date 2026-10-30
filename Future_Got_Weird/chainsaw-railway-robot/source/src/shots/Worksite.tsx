// The worksite world and its choreography over the whole film. Every value is a pure function of the film time t,
// so the machine, the branches and the camera keep their state across every cut back to this world.
// V2: a wrapped grip (fingers round the wood), the bar sinking into the kerf behind the near wood, chips thrown from
// the kerf entry, one continuous grip -> cut -> weight -> lift sequence, the bilateral loop travelling up and down
// the boom, and an ending matched to one small movement of the operator's hand.
import React from 'react';
import {add, clamp, easeIn, easeInOut, easeOut, lerp, mul, settle, sub, V} from '../dc/math';
import {keys, pr, pulse, vnoise, zkeys} from '../lib/core';
import {BT, TT} from '../lib/timeline';
import {circ, f, INK, Line, poly} from '../lib/draw';
import {ArmPose, Machine, MachineDefs, machineGeo, MachinePose, MGeo} from '../art/Machine';
import {along, Backdrop, Branch, BranchDef, Cam, CutState, Layer, Sawdust, Track, Tree, tube, WorldDefs} from '../art/World';
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
const BIL_U = 0.8;

const tt = TT;
const dirA = (a: number): V => ({x: Math.cos((a * Math.PI) / 180), y: Math.sin((a * Math.PI) / 180)});

/** a wrist target that puts the claw's grip point on a branch point, `back` cm withdrawn along the claw axis */
const clawAt = (p: V, a: number, back = 0): ArmPose => ({w: sub(p, mul(dirA(a), 62 + back)), a, side: -1});
/** a wrist target that puts the saw's cutting point on a branch point at angle a, `back` cm withdrawn along the bar */
const sawAt = (p: V, a: number, back = 0, up = 0): ArmPose => {
  const d = dirA(a);
  const n = {x: -d.y, y: d.x};
  return {w: add(sub(sub(p, mul(d, 95 + back)), mul(n, 7)), {x: 0, y: -up}), a, side: -1};
};
const mixArm = (A: ArmPose, B: ArmPose, t: number): ArmPose => ({w: {x: lerp(A.w.x, B.w.x, t), y: lerp(A.w.y, B.w.y, t)}, a: lerp(A.a, B.a, t), side: B.side});
const seqArm = (t: number, ks: [number, ArmPose, ((x: number) => number)?][]) => {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) {
    if (t <= ks[i + 1][0]) return mixArm(ks[i][1], ks[i + 1][1], (ks[i + 1][2] ?? easeInOut)(clamp((t - ks[i][0]) / (ks[i + 1][0] - ks[i][0]))));
  }
  return ks[ks.length - 1][1];
};
const shift = (A: ArmPose, d: V): ArmPose => ({...A, w: add(A.w, d)});

// branch points
const b1cut = along(BR1, CUT_U).p;
const b1grip = along(BR1, GRIP_U).p;
const b2cut = along(BR2, CUT_U).p;
const b2grip = along(BR2, GRIP_U).p;
const b3cut = along(BR3, CUT_U).p;
const b3grip = along(BR3, GRIP_U).p;
const rGrip = (b: BranchDef) => along(b, GRIP_U).r;

const CLAW_A = 72;
const TOUCH_A = -38;
const BIL_A = -48;
/** fingertips `gap` cm short of the underside of branch 3 at arc fraction u, approaching at angle a (up-right) */
const underAt = (u: number, a: number, gap: number, lift = 0): ArmPose => {
  const s = along(BR3, u);
  const target = add(s.p, {x: 0, y: s.r - lift});
  return {w: sub(target, mul(dirA(a), 96 + gap)), a, side: -1};
};
const touchAt = (gap: number, lift = 0) => underAt(GRIP_U, TOUCH_A, gap, lift);
export const TOUCH_PT = (() => {
  const a = along(BR3, GRIP_U);
  return add(a.p, {x: 0, y: a.r});
})();
const SAW_A = 64;
const REST_CLAW: ArmPose = {w: {x: 860, y: -1000}, a: 70, side: -1};
const REST_SAW: ArmPose = {w: {x: 880, y: -1060}, a: 55, side: -1};
const PARK_CLAW: ArmPose = {w: {x: 820, y: -1120}, a: 20, side: -1};
const PARK_SAW: ArmPose = {w: {x: 640, y: -1480}, a: -70, side: -1};

/** cut timings */
const T1_THROUGH = tt.through1 + 0.42;
const T2_CONTACT = tt.intoCut - 0.15;
const T2_THROUGH = tt.breaks + 1.05;
const T3_CONTACT = tt.mechanical;
const T3_THROUGH = tt.end + 1.25;

/** boom poses: hook, central job, high (bilateral, steel arms, ending) */
const BOOM = {hook: [62, 28, 630], mid: [58, 16.4, 546], high: [64, 36.5, 736]};
const boomAt = (t: number) => {
  const ks: [number, number[]][] = [[0, BOOM.hook], [tt.looks, BOOM.hook], [tt.twoArms, BOOM.mid], [tt.controlEnd + 1.2, BOOM.mid], [tt.tiny, BOOM.high]];
  const i = ks.findIndex(([k]) => k > t);
  if (i === 0) return ks[0][1];
  if (i < 0) return ks[ks.length - 1][1];
  const [a, A] = ks[i - 1];
  const [b, B] = ks[i];
  const u = easeInOut(clamp((t - a) / (b - a)));
  return A.map((v, j) => lerp(v, B[j], u));
};

/** branch 3 flexes about the trunk where the claw pushes it (bilateral) or touches it (steel arms) */
const flexAt = (t: number) => {
  const bil = pr(t, BT.bilContact, BT.bilContact + 0.7) * (1 - 0.45 * pr(t, BT.bilEase0 + 0.3, BT.bilEase1 + 0.3)) * (1 - pr(t, tt.pushingEnd + 0.3, tt.imagine));
  const steel = pulse(t, tt.steel + 0.1, tt.steel + 0.35, tt.armsEnd + 0.6, tt.armsEnd + 1.5);
  return {deg: bil * 1.7 + steel * 1.1, bil, steel};
};
/** how far a point on branch 3 rises when the branch flexes by deg (rotation about the trunk end) */
const flexLift = (x: number, deg: number) => (BR3.pts[0].x - x) * ((deg * Math.PI) / 180);

export const worksite = (t: number) => {
  const flex = flexAt(t);
  // --- claw arm --------------------------------------------------------------------------------------------
  const b2r = rGrip(BR2);
  const claw = seqArm(t, [
    [0, clawAt(b1grip, CLAW_A)],
    [T1_THROUGH, clawAt(b1grip, CLAW_A)],
    // weight transfer: a short dip as the piece comes free, then the arm takes it
    [T1_THROUGH + 0.22, shift(clawAt(b1grip, CLAW_A), {x: 0, y: 6}), easeOut],
    [T1_THROUGH + 0.9, clawAt(b1grip, CLAW_A + 3, -2)],
    // during the cab interior the piece is carried aside and set down off-screen; arm returns
    [tt.moves - 0.3, clawAt(b1grip, CLAW_A + 3, -2)],
    [tt.moves + 1.6, {w: {x: 840, y: -980}, a: 95, side: -1}],
    [tt.looks, REST_CLAW],
    // ---- central job, stage A: approach, fingers spread, descend, close round the wood
    [tt.grips - 0.4, REST_CLAW],
    [tt.grips + 0.5, clawAt(b2grip, CLAW_A, 48)],
    [tt.grips + 0.95, clawAt(b2grip, CLAW_A, 0)],
    [tt.weight + 0.1, clawAt(b2grip, CLAW_A, 0)],
    [tt.weight + 0.6, clawAt(b2grip, CLAW_A, -3)],
    // stage C: the piece comes free; the weight drops into the claw (dip, recover)
    [T2_THROUGH, clawAt(b2grip, CLAW_A, -3)],
    [T2_THROUGH + 0.22, shift(clawAt(b2grip, CLAW_A, -3), {x: 0, y: 8}), easeOut],
    [T2_THROUGH + 0.9, clawAt(b2grip, CLAW_A + 2, -6)],
    // stage D: lift it up and back, away from the track below; "a crane can lift": higher still
    [tt.drop - 0.4, clawAt(add(b2grip, {x: -40, y: -120}), CLAW_A - 4, 0)],
    [tt.crane + 1.2, clawAt(add(b2grip, {x: -80, y: -190}), CLAW_A - 10, 0)],
    [tt.controlEnd + 1.0, clawAt(add(b2grip, {x: -80, y: -190}), CLAW_A - 10, 0)],
    // (off-screen in the cabin the piece is set down and the arm parks)
    [tt.tiny - 0.5, PARK_CLAW],
    // bilateral: a large swing up under branch 3, contact, press; the operator eases and the claw eases with it
    [BT.bilUp - 0.3, PARK_CLAW],
    [BT.bilContact - 0.15, underAt(BIL_U, BIL_A, 18)],
    [BT.bilContact + 0.7, underAt(BIL_U, BIL_A, -1, flexLift(along(BR3, BIL_U).p.x, 1.7))],
    [BT.bilEase0 + 0.3, underAt(BIL_U, BIL_A, -1, flexLift(along(BR3, BIL_U).p.x, 1.7))],
    [BT.bilEase1 + 0.3, underAt(BIL_U, BIL_A, 2, flexLift(along(BR3, BIL_U).p.x, 0.94))],
    [tt.pushingEnd + 0.3, underAt(BIL_U, BIL_A, 2, flexLift(along(BR3, BIL_U).p.x, 0.94))],
    // steel arms: from below-left, the fingertips come up and touch the underside of branch 3 (matched to the hand)
    [tt.imagine, touchAt(70)],
    [tt.except, touchAt(70)],
    [tt.steel + 0.15, touchAt(0)],
    [tt.steel + 0.4, touchAt(-1, flexLift(TOUCH_PT.x, 1.1))],
    [tt.armsEnd + 1.2, touchAt(-1, flexLift(TOUCH_PT.x, 1.1))],
    [tt.armsEnd + 2.2, touchAt(10)],
    // ending: hovering open above the grip point; one small hand movement brings it down and closes it
    [tt.still - 0.6, clawAt(b3grip, CLAW_A, 34)],
    [BT.endCut, clawAt(b3grip, CLAW_A, 34)],
    [tt.pair + 0.05, clawAt(b3grip, CLAW_A, 0)],
    [T3_THROUGH, clawAt(b3grip, CLAW_A, 0)],
    [T3_THROUGH + 0.22, shift(clawAt(b3grip, CLAW_A, 0), {x: 0, y: 7}), easeOut],
    [T3_THROUGH + 0.9, clawAt(b3grip, CLAW_A + 2, -6)],
    [tt.dur, clawAt(add(b3grip, {x: -20, y: -40}), CLAW_A - 4, 0)],
  ]);
  const open = keys(t, [
    [0, 0.33],
    [tt.moves + 0.8, 0.33],
    [tt.moves + 1.4, 0.7],
    [tt.looks, 0.4],
    [tt.grips - 0.1, 0.4],
    [tt.grips + 0.45, 0.98],
    [tt.grips + 0.95, 0.98],
    [tt.grips + 1.3, 0.33, easeOut],
    [tt.controlEnd + 1.5, 0.33],
    [tt.tiny - 0.5, 0.6],
    [BT.bilContact - 0.2, 0.55],
    [tt.still - 0.6, 0.55],
    [tt.still - 0.1, 0.95],
    [tt.pair, 0.95],
    [tt.pair + 0.32, 0.33, easeOut],
  ]);
  // fingers wrapped round the wood whenever the claw holds a branch
  const wrap = keys(t, [
    [0, 1],
    [tt.moves + 0.8, 1],
    [tt.moves + 1.3, 0],
    [tt.grips + 1.0, 0],
    [tt.grips + 1.32, 1, easeOut],
    [tt.controlEnd + 1.4, 1],
    [tt.tiny - 0.6, 0],
    [tt.pair + 0.05, 0],
    [tt.pair + 0.36, 1, easeOut],
  ]);
  const wrapR = t < tt.looks ? rGrip(BR1) : t < tt.tiny ? b2r : rGrip(BR3);
  const squeeze = pulse(t, tt.grabs, tt.grabs + 0.3, tt.grabs + 0.8, tt.grabs + 1.4) + pulse(t, tt.weight, tt.weight + 0.25, tt.weight + 0.7, tt.weight + 1.2) + pulse(t, tt.pair + 0.3, tt.pair + 0.5, tt.pair + 0.9, tt.pair + 1.4);

  // --- saw arm ---------------------------------------------------------------------------------------------
  const k1 = keys(t, [[0, 0.42], [T1_THROUGH, 1, (x) => x]]);
  const k2 = keys(t, [[T2_CONTACT, 0], [T2_THROUGH, 1, (x) => x]]);
  const k3 = keys(t, [[T3_CONTACT, 0], [T3_THROUGH, 1, (x) => x]]);
  const cutDepth = (c: V, k: number, br: BranchDef) => add(c, {x: 0, y: (k - 0.5) * 2 * along(br, CUT_U).r});
  const cutSeq = (c: V, br: BranchDef, t0: number, t1: number): [number, ArmPose][] =>
    Array.from({length: 9}, (_, i) => [lerp(t0, t1, (i + 1) / 9), sawAt(cutDepth(c, (i + 1) / 9, br), SAW_A)] as [number, ArmPose]);
  const saw = seqArm(t, [
    [0, sawAt(cutDepth(b1cut, k1, BR1), SAW_A)],
    [T1_THROUGH, sawAt(cutDepth(b1cut, 1, BR1), SAW_A)],
    [T1_THROUGH + 1.2, sawAt(b1cut, SAW_A, 40, 50)],
    [tt.cameras, sawAt(b1cut, SAW_A, 40, 50)],
    [tt.looks, REST_SAW],
    // stage B: to a separate cutting point, onto the wood, through it
    [tt.angles, REST_SAW],
    [tt.angles + 1.0, sawAt(add(b2cut, {x: 0, y: -along(BR2, CUT_U).r}), SAW_A, 34, 18)],
    [T2_CONTACT, sawAt(cutDepth(b2cut, 0, BR2), SAW_A)],
    ...cutSeq(b2cut, BR2, T2_CONTACT, T2_THROUGH),
    // out of the cut, up and clear
    [T2_THROUGH + 0.9, sawAt(b2cut, SAW_A, 40, 70)],
    [tt.controlEnd + 1.0, sawAt(b2cut, SAW_A, 40, 70)],
    [tt.tiny - 0.5, PARK_SAW],
    [tt.armsEnd + 1.5, PARK_SAW],
    // ending: idling at branch 3; switched off; then brought into position and cutting
    [tt.still - 1.2, sawAt(b3cut, SAW_A, 34, 30)],
    [tt.still + 1.4, sawAt(b3cut, SAW_A, 34, 30)],
    // switched off, the saw is lifted clear; the second arm only swings back in after the claw has closed
    [tt.most + 0.6, PARK_SAW],
    [tt.pair + 0.3, PARK_SAW],
    [tt.mechanical - 0.25, sawAt(add(b3cut, {x: 0, y: -along(BR3, CUT_U).r}), SAW_A, 4, 2)],
    [T3_CONTACT, sawAt(cutDepth(b3cut, 0, BR3), SAW_A)],
    ...cutSeq(b3cut, BR3, T3_CONTACT, T3_THROUGH),
    [T3_THROUGH + 0.8, sawAt(b3cut, SAW_A, 30, 40)],
  ]);
  const run = runAt(t);
  const chain = chainPhase(t);
  const cutting = (t < T1_THROUGH ? 1 : 0) + (t > T2_CONTACT && t < T2_THROUGH ? 1 : 0) + (t > T3_CONTACT && t < T3_THROUGH ? 1 : 0);

  const [b1, b2, l2] = boomAt(t);
  const head = keys(t, [[0, 0], [tt.deciding, 0], [tt.deciding + 0.6, -6], [tt.person, -6], [tt.person + 0.5, 0]]);
  const pose: MachinePose = {x: TRUCK_X, b1, b2, l2, claw, saw, open, squeeze: clamp(squeeze), run, chain, head, shake: cutting * run * 0.6, wrap, wrapR};

  // --- branch states -----------------------------------------------------------------------------------------
  const g = machineGeo(pose);
  const pieceXf = (through: number, gripPt: V, refClaw: ArmPose) => {
    // the piece follows the claw rigidly after the cut (translate with the grip point, rotate with the claw)
    if (t < through) return {rot: 0, pivot: gripPt, move: {x: 0, y: 0}};
    const sag = 3 * settle(clamp((t - through) / 0.9));
    const ref = add(refClaw.w, mul(dirA(refClaw.a), 62));
    return {rot: g.clawF.a - refClaw.a + sag, pivot: gripPt, move: sub(g.grip, ref)};
  };
  const cut1: CutState = {u: CUT_U, k: k1, ...pieceXf(T1_THROUGH, b1grip, clawAt(b1grip, CLAW_A))};
  const cut2: CutState | undefined = t > T2_CONTACT ? {u: CUT_U, k: k2, ...pieceXf(T2_THROUGH, b2grip, clawAt(b2grip, CLAW_A, -3))} : undefined;
  const cut3: CutState | undefined = t > T3_CONTACT ? {u: CUT_U, k: k3, ...pieceXf(T3_THROUGH, b3grip, clawAt(b3grip, CLAW_A, 0))} : undefined;
  const showPiece1 = t < tt.moves + 1.2;
  const showPiece2 = t < tt.controlEnd + 2.5;
  return {pose, g, cut1, cut2, cut3, showPiece1, showPiece2, flex, cutting, k1, k2, k3, T1_THROUGH, T2_CONTACT, T2_THROUGH, T3_CONTACT, T3_THROUGH};
};

/** the chain's run state: running only around the cuts (audio uses the same envelope) */
export const runAt = (x: number) =>
  keys(x, [
    [0, 1],
    [T1_THROUGH + 0.2, 1],
    [T1_THROUGH + 1.1, 0],
    [tt.angles + 0.55, 0],
    [tt.angles + 0.85, 1],
    [T2_THROUGH + 0.4, 1],
    [T2_THROUGH + 1.2, 0],
    [tt.still - 1.5, 0],
    [tt.still - 1.2, 1],
    [tt.still + 0.55, 1],
    [tt.still + 1.3, 0, easeOut],
    [tt.mechanical - 0.75, 0],
    [tt.mechanical - 0.45, 1],
    [T3_THROUGH + 0.4, 1],
    [T3_THROUGH + 1.2, 0],
  ]);
/** the chain's phase: integral of the run state (cm of chain travel), sampled per frame */
export const chainPhase = (t: number) => {
  let s = 0;
  for (let x = 0; x < t; x += 1 / 30) s += runAt(x) * 37 * (0.8 + 0.2 * Math.sin(x * 7.3));
  return s;
};

/** the conceptual signal path (bilateral): cabin -> turntable -> along the boom -> rotator -> near shoulder */
export const signalPath = (g: MGeo): V[] => [
  {x: TRUCK_X + 300, y: -300},
  {x: TRUCK_X + 300, y: -360},
  {x: g.B0.x - 40, y: -360},
  g.B0,
  g.B1,
  g.B2,
  add(g.M, {x: -6, y: -30}),
  g.SN,
];
export const pathAt = (pts: V[], u: number): V => {
  const L: number[] = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const s = clamp(u) * L[L.length - 1];
  let i = 1;
  while (i < L.length - 1 && L[i] < s) i++;
  const q = (s - L[i - 1]) / (L[i] - L[i - 1] || 1);
  return {x: lerp(pts[i - 1].x, pts[i].x, q), y: lerp(pts[i - 1].y, pts[i].y, q)};
};
/** pulse position along the signal path: up (blue) and down (orange) */
export const sigUp = (t: number) => pr(t, BT.bilWin, BT.bilUp - 0.2, (x) => x);
export const sigDn = (t: number) => 1 - pr(t, BT.bilDn0, BT.bilCab - 0.05, (x) => x);

/** camera over the worksite segments */
export const worksiteCam = (t: number): Cam => {
  const c1 = {x: b1cut.x + 10, y: b1cut.y - 10};
  const mid1 = {x: (b1grip.x + b1cut.x) / 2, y: (b1grip.y + b1cut.y) / 2};
  if (t < tt.cabin + 0.5) {
    // hook (five beats: saw in the wood, the claw holding, the cut continuing, separation held, the wider view)
    // -> hazard tilt -> reveal -> push to cabin window
    const x = keys(t, [
      [0, c1.x + 5],
      [tt.realFootage, c1.x - 20],
      [tt.watch - 0.2, c1.x - 50],
      [tt.grabs + 0.5, b1grip.x + 30],
      [tt.touches, b1grip.x + 60],
      [tt.bladeCuts, c1.x - 30],
      [tt.thatClaw + 0.3, mid1.x],
      [tt.important, mid1.x - 20],
      [tt.falling, 860],
      [tt.tracks + 0.3, b1grip.x + 40],
      [tt.combination + 0.3, b1grip.x + 40],
      [tt.rest + 0.5, b1grip.x - 40],
      [tt.rest + 1.3, 740],
      [tt.legs + 0.4, 730],
      [tt.legsEnd + 0.4, 710],
      [tt.boom + 0.9, 440],
      [tt.rising + 0.8, 60],
      [tt.vehicle + 0.4, 0],
      [tt.person, 20],
      [tt.movementEnd + 0.6, TRUCK_X + 271],
      [tt.cabin, TRUCK_X + 271],
    ]);
    const y = keys(t, [
      [0, c1.y + 5],
      [tt.realFootage, c1.y + 2],
      [tt.watch - 0.2, c1.y + 6],
      [tt.grabs + 0.5, b1grip.y + 8],
      [tt.touches, b1grip.y + 10],
      [tt.bladeCuts, c1.y + 10],
      [tt.thatClaw + 0.3, mid1.y + 20],
      [tt.important, mid1.y + 10],
      [tt.falling, -1000],
      [tt.tracks + 0.3, -250, easeInOut],
      [tt.combination + 0.3, -250],
      [tt.rest + 0.9, -1060],
      [tt.rest + 1.3, -1110],
      [tt.legs + 0.4, -1000],
      [tt.legsEnd + 0.4, -920],
      [tt.boom + 0.9, -760],
      [tt.rising + 0.8, -640],
      [tt.vehicle + 0.4, -620],
      [tt.person, -600],
      [tt.movementEnd + 0.6, -268],
      [tt.cabin, -268],
    ]);
    const z = zkeys(t, [
      [0, 8.6],
      [tt.realFootage, 6.6],
      [tt.watch - 0.2, 4.7],
      [tt.grabs + 0.5, 6.2],
      [tt.touches, 5.8],
      [tt.bladeCuts, 6.0],
      [tt.thatClaw + 0.3, 4.6],
      [tt.important, 3.9],
      [tt.falling, 1.9],
      [tt.tracks + 0.3, 2.0],
      [tt.combination + 0.3, 2.0],
      [tt.rest + 0.9, 2.6],
      [tt.rest + 1.3, 3.0],
      [tt.legs + 0.4, 2.7],
      [tt.legsEnd + 0.4, 2.4],
      [tt.boom + 0.9, 1.5],
      [tt.rising + 0.8, 0.78],
      [tt.vehicle + 0.4, 0.62],
      [tt.person, 0.62],
      [tt.movementEnd + 0.6, 3.6, easeIn],
      [tt.cabin, 6.4, easeIn],
    ]);
    return {x, y, z};
  }
  if (t < tt.twoArms - 0.6) {
    // back out of the window to the wide, then settle with the cabin in the lower third
    const x = keys(t, [[tt.looks, TRUCK_X + 271], [tt.looks + 1.6, 120, easeOut], [tt.bottom, 100]]);
    const y = keys(t, [[tt.looks, -268], [tt.looks + 1.6, -610, easeOut], [tt.bottomBut, -610], [tt.bottom, -540]]);
    const z = zkeys(t, [[tt.looks, 6.4], [tt.looks + 1.7, 0.64, easeOut], [tt.bottomBut, 0.62], [tt.bottom, 0.7]]);
    return {x, y, z};
  }
  if (t < tt.another) {
    // the central job, one camera path: in to both arms -> follow the claw onto the wood -> across to the cut ->
    // hold on the cut -> widen as the weight drops into the claw -> rise with the lifted piece -> across to the
    // fresh cut face -> both arms at once -> down the boom to the cabin
    const x = keys(t, [
      [tt.twoArms - 0.6, 100],
      [tt.grips - 0.3, 900],
      [tt.grips + 1.0, b2grip.x + 10],
      [tt.weight + 0.6, b2grip.x + 20],
      [tt.angles + 1.0, b2cut.x - 30],
      [T2_CONTACT + 0.4, b2cut.x - 10],
      [T2_THROUGH - 0.2, b2cut.x - 20],
      [T2_THROUGH + 0.9, (b2grip.x + b2cut.x) / 2],
      [tt.crane + 1.2, b2grip.x - 20],
      [tt.chainsaw2 + 0.8, b2cut.x - 30],
      [tt.both + 1.0, 940],
      [tt.oneControl, 920],
      [tt.controlEnd + 0.35, 200],
      [tt.another, TRUCK_X + 271],
    ]);
    const y = keys(t, [
      [tt.twoArms - 0.6, -540],
      [tt.grips - 0.3, -1000],
      [tt.grips + 1.0, b2grip.y - 20],
      [tt.weight + 0.6, b2grip.y - 10],
      [tt.angles + 1.0, b2cut.y - 30],
      [T2_CONTACT + 0.4, b2cut.y - 10],
      [T2_THROUGH - 0.2, b2cut.y - 5],
      [T2_THROUGH + 0.9, b2grip.y - 30],
      [tt.crane + 1.2, b2grip.y - 170],
      [tt.chainsaw2 + 0.8, b2cut.y - 40],
      [tt.both + 1.0, -1010],
      [tt.oneControl, -990],
      [tt.controlEnd + 0.35, -560],
      [tt.another, -268],
    ]);
    const z = zkeys(t, [
      [tt.twoArms - 0.6, 0.7],
      [tt.grips - 0.3, 2.4],
      [tt.grips + 1.0, 4.4],
      [tt.weight + 0.6, 4.2],
      [tt.angles + 1.0, 4.0],
      [T2_CONTACT + 0.4, 4.8],
      [T2_THROUGH - 0.2, 4.8],
      [T2_THROUGH + 0.9, 3.4],
      [tt.crane + 1.2, 3.0],
      [tt.chainsaw2 + 0.8, 3.6],
      [tt.both + 1.0, 2.0],
      [tt.oneControl, 1.9],
      [tt.controlEnd + 0.35, 1.3],
      [tt.another, 6.4, easeIn],
    ]);
    return {x, y, z};
  }
  if (t < tt.imagine) {
    // bilateral: ride the signal up the boom from the cabin window, to the claw at the branch, then back down
    const g = worksite(t).g;
    const pts = signalPath(g);
    const contact = add(along(BR3, BIL_U).p, {x: -30, y: 30});
    if (t < BT.bilUp) {
      const p = pathAt(pts, sigUp(t));
      return {x: p.x + 40, y: p.y - 30, z: zkeys(t, [[BT.bilWin, 4.6], [BT.bilWin + 0.6, 2.6], [BT.bilUp, 2.6]])};
    }
    if (t < BT.bilDn0) {
      const u = pr(t, BT.bilUp, BT.bilContact + 0.1);
      const p0 = pathAt(pts, 1);
      return {x: lerp(p0.x + 40, contact.x, u), y: lerp(p0.y - 30, contact.y, u), z: lerp(2.6, 3.2, u)};
    }
    const p = pathAt(pts, sigDn(t));
    const u = pr(t, BT.bilDn0, BT.bilDn0 + 0.5);
    return {x: lerp(contact.x, p.x + 40, u), y: lerp(contact.y, p.y - 30, u), z: zkeys(t, [[BT.bilDn0, 3.2], [BT.bilDn0 + 0.5, 2.6], [BT.bilCab - 0.5, 2.8], [BT.bilCab, 4.6, easeIn]])};
  }
  if (t < tt.stunt) {
    // steel arms: from the matched claw close-up out to the full machine and the person beside it
    const z0 = 5.4;
    const x = keys(t, [[tt.except, TOUCH_PT.x - 60 / z0], [tt.steel + 0.2, TOUCH_PT.x - 60 / z0], [tt.armsEnd + 1.7, -60, easeInOut]]);
    const y = keys(t, [[tt.except, TOUCH_PT.y - 30 / z0], [tt.steel + 0.2, TOUCH_PT.y - 30 / z0], [tt.armsEnd + 1.7, -640, easeInOut]]);
    const z = zkeys(t, [[tt.except, z0], [tt.steel + 0.2, z0 * 0.92], [tt.armsEnd + 1.7, 0.62, easeInOut]]);
    return {x, y, z};
  }
  // ending: the saw is switched off -> down to the cabin -> (cabin) -> the claw closes, matched to the hand ->
  // the saw arm swings in and cuts -> pull back to the operator, the arms and the vehicle
  const x = keys(t, [
    [tt.still - 0.3, b3cut.x + 30],
    [tt.chainsaw3 + 0.4, b3cut.x],
    [tt.most, b3cut.x - 10],
    [tt.partEnd + 0.3, TRUCK_X + 271],
    [tt.japan2, TRUCK_X + 271],
    [BT.endCut, b3grip.x - 10],
    [tt.pair + 0.4, b3grip.x],
    [tt.mechanical, (b3grip.x + b3cut.x) / 2 + 30],
    [tt.end + 0.3, (b3grip.x + b3cut.x) / 2],
    [tt.end + 2.1, 330, easeInOut],
    [tt.dur, 320],
  ]);
  const y = keys(t, [
    [tt.still - 0.3, b3cut.y + 20],
    [tt.chainsaw3 + 0.4, b3cut.y + 10],
    [tt.most, b3cut.y],
    [tt.partEnd + 0.3, -268],
    [tt.japan2, -268],
    [BT.endCut, b3grip.y - 30],
    [tt.pair + 0.4, b3grip.y - 10],
    [tt.mechanical, b3grip.y - 10],
    [tt.end + 0.3, b3grip.y - 20],
    [tt.end + 2.1, -720, easeInOut],
    [tt.dur, -710],
  ]);
  const z = zkeys(t, [
    [tt.still - 0.3, 5.0],
    [tt.chainsaw3 + 0.4, 6.0],
    [tt.most, 5.6],
    [tt.partEnd + 0.3, 6.4, easeInOut],
    [tt.japan2, 6.4],
    [BT.endCut, 4.4],
    [tt.pair + 0.4, 4.6],
    [tt.mechanical, 3.2],
    [tt.end + 0.3, 3.0],
    [tt.end + 2.1, 0.64, easeInOut],
    [tt.dur, 0.66],
  ]);
  return {x, y, z};
};

/** the lookout who stands well clear on the ground (scale reference whenever the whole machine is in view) */
const LOOKOUT: ManPose = {
  x: 0, y: 0, s: 0.2, torso: 2, chest: 1, neck: 2, turn: -0.4, pelvis: 0,
  lTu: 200, lTv: -30, lWx: 0, lWy: 0, lW: 0, lElb: 1, lWr: 0,
  rTu: 200, rTv: 20, rWx: 0, rWy: 0, rW: 0, rElb: 1, rWr: 0,
  lHip: 4, lKnee: 4, lAnk: 0, rHip: -4, rKnee: 2, rAnk: 0, lFs: 1, lFsh: 1, rFs: 1, rFsh: 1, breath: 0.3,
};
export const WORKER = {skin: '#F2C9A8', hair: '#2B2420', shirt: '#F28C28', stripe: '#E9F0F2', pants: '#2E3F5C', shoe: '#3A3F45', longSleeve: true, hat: {color: '#FFFFFF', band: '#2E7D4F'}};

/** a slight hand-held drift (screen px) for the shots that stand in for camera footage */
const drift = (t: number, c: Cam): Cam => ({x: c.x + (vnoise(t * 0.8, 1) * 5 + vnoise(t * 2.1, 2) * 1.5) / c.z, y: c.y + (vnoise(t * 0.7, 3) * 4 + vnoise(t * 1.9, 4) * 1.2) / c.z, z: c.z});

/** the near wood round an active kerf, drawn over the saw bar so the bar visibly sinks into the branch;
 *  the kerf shows as a slit from the top down to the current depth */
const KerfOccluder: React.FC<{b: BranchDef; k: number}> = ({b, k}) => {
  if (k <= 0 || k >= 1) return null;
  const c = along(b, CUT_U);
  const n = {x: -c.d.y, y: c.d.x};
  const top = add(c.p, mul(n, -c.r));
  const bot = add(c.p, mul(n, -c.r + 2 * c.r * k));
  return (
    <g>
      <path d={poly(tube(b, CUT_U - 0.07, CUT_U + 0.07, 6))} fill="url(#w-bark)" stroke={INK} strokeWidth={3} />
      <Line a={top} b={bot} w={4} c="#2B1D14" />
      <Line a={add(top, mul(c.d, 3.5))} b={add(bot, mul(c.d, 3.5))} w={1.6} c="#F2D7A6" o={0.9} />
    </g>
  );
};

export const Worksite: React.FC<{t: number; cam?: Cam; lookout?: boolean; signal?: boolean}> = ({t, cam: camIn, lookout = true, signal}) => {
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
  const br3 = `rotate(${f(s.flex.deg)} ${BR3.pts[0].x} ${BR3.pts[0].y})`;
  // chips leave the kerf entry (top surface), thrown back along the bar toward the saw body, then fall
  const entry = (b: BranchDef) => {
    const c = along(b, CUT_U);
    return add(c.p, mul({x: -c.d.y, y: c.d.x}, -c.r));
  };
  const back = {x: -0.62, y: -0.55};
  const sp = signalPath(g);
  const sig = signal && (t >= BT.bilWin - 0.5 && t < BT.bilCab + 0.5);
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
        <Machine p={pose} layer="base" cabinLight={t > tt.still ? pr(t, tt.mechanical, tt.end + 0.8) : sig ? 1 : pr(t, tt.person - 0.2, tt.movementEnd)} windowGlow={pulse(t, tt.bottomBut, tt.bottomBut + 0.5, tt.bottom + 0.4, tt.bottom + 1.2) + (t > tt.end ? pr(t, tt.end + 1, tt.end + 2.2) : 0)} />
        {sig && (
          <g>
            {/* the signal route drawn into the machine: a conceptual line, not a claimed cable or component */}
            <path d={'M' + sp.map((p) => `${f(p.x)} ${f(p.y)}`).join(' L')} fill="none" stroke="#BFE8FF" strokeWidth={18} strokeLinejoin="round" strokeLinecap="round" opacity={0.35} />
            <path d={'M' + sp.map((p) => `${f(p.x)} ${f(p.y)}`).join(' L')} fill="none" stroke="#FFFFFF" strokeWidth={4} strokeLinejoin="round" strokeDasharray="10 12" opacity={0.7} />
          </g>
        )}
        <Machine p={pose} layer="back" />
        <g transform={br3}>
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
        {/* the near wood over the bar while it is in the cut */}
        <KerfOccluder b={BR1} k={s.k1} />
        <KerfOccluder b={BR2} k={t > s.T2_CONTACT ? s.k2 : 0} />
        <g transform={br3}>
          <KerfOccluder b={BR3} k={t > s.T3_CONTACT ? s.k3 : 0} />
        </g>
        {/* chips from the kerf entry while the chain is in the wood */}
        <Sawdust at={entry(BR1)} dir={back} t={t} t0={-1} t1={s.T1_THROUGH} rate={90} scale={0.8} />
        <Sawdust at={entry(BR2)} dir={back} t={t} t0={s.T2_CONTACT} t1={s.T2_THROUGH} rate={90} scale={0.8} />
        <g transform={br3}>
          <Sawdust at={entry(BR3)} dir={back} t={t} t0={s.T3_CONTACT} t1={s.T3_THROUGH} rate={90} scale={0.8} />
        </g>
        {sig && <SignalPulses t={t} pts={sp} />}
        {/* contact: where the claw meets resistance (bilateral) */}
        {signal && s.flex.bil > 0.02 && t < tt.imagine && <circle cx={f(g.grip.x + 20)} cy={f(g.grip.y - 30)} r={f(18 + 16 * s.flex.bil)} fill="none" stroke="#F07A22" strokeWidth={6} opacity={0.4 + 0.5 * pulse(t, BT.bilContact, BT.bilContact + 0.3, BT.bilDn0, BT.bilDn0 + 0.4)} />}
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

/** the moving command (blue, out to the robot) and feedback (orange, back to the hand) along the signal route */
const SignalPulses: React.FC<{t: number; pts: V[]}> = ({t, pts}) => {
  const out = [];
  if (t >= BT.bilWin && t < BT.bilUp) {
    const u = sigUp(t);
    for (let k = 0; k < 4; k++) {
      const p = pathAt(pts, u - k * 0.03);
      out.push(<circle key={`u${k}`} cx={f(p.x)} cy={f(p.y)} r={18 - k * 3} fill="#2FA8E8" stroke="#FFFFFF" strokeWidth={4} opacity={1 - k * 0.22} />);
    }
  }
  if (t >= BT.bilDn0 && t < BT.bilCab) {
    const u = sigDn(t);
    for (let k = 0; k < 4; k++) {
      const p = pathAt(pts, u + k * 0.03);
      out.push(<circle key={`d${k}`} cx={f(p.x)} cy={f(p.y)} r={18 - k * 3} fill="#F07A22" stroke="#FFFFFF" strokeWidth={4} opacity={1 - k * 0.22} />);
    }
  }
  return <g>{out}</g>;
};

export {circ, Line, vnoise, easeIn};
