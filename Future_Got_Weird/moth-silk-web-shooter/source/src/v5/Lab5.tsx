// V5 lab: one bench, one scientist (the lead, clean-shaven, lab coat, gloves), two hands doing connected work.
// - 150: the material close-up becomes a cocoon's wound silk; the camera pulls back to the bench and the scientist.
// - the near hand comes in fast, opens round the cocoon, makes contact, curls into a grip (thumb behind, two fingers in
//   front) and lifts it (overshoot, settle); the far hand pinches a loose end and draws the thread out in an arc while
//   the cocoon turns in the grip as it unwinds; over the beaker the thread is dipped and the cocoon let go into the
//   liquid; the near hand steadies the beaker while the far hand stirs: the liquid circulates, the silk breaks into
//   strands that thin and fade as the solution forms.
// - the near hand starts the pump; the far hand picks the nozzle off its stand; the solution runs to the nozzle
//   (wide bench view), then the extrusion up close at the tip, then the new fibre out into open space.
// - contact (squash and a wave back along the fibre), slack drawn tight, the pull (the fibre trembles, the blade
//   rocks, the sand cracks), the break-out (sand falls), a high lift, the hanging blade turning under a glinting
//   thread (the strength beat), carried to the tray, lowered, released.
// - along the fibre to the nozzle's outlet, which is matched (place, size, direction) by the imagined wrist shooter's
//   outlet (End5 / Street5's pre-roll).
// Every hand contact is placed from the hand's own geometry (dc/Hand digitTips); the arm is foreshortened (not
// folded) when the target is close to the shoulder; held objects are drawn between the rear and front digits.
import React from 'react';
import {DIM, Man, manJoints, ManPose} from './dc/Man';
import {Cam, Layer} from './dc/camera';
import {add, clamp, deg, fmt, lerp, lerpV, mul, norm, P as Pt, perp, sub, V} from './dc/math';
import {Expr, mixExpr} from './dc/Head';
import {digitTips, HandPose, mixHand} from './dc/Hand';
import {INK} from './dc/ink';
import {mix} from './dc/color';
import {BASE, EXPR_FOCUS, EXPR_GRIN, EXPR_LAB, HERO_LAB} from './cast5';
import {BEAKER, BENCH_Y, BLADE_LEN, COC_LEN, COCOON_DISH, LT5, NOZ, PUMP, ROD, SAND, SPARE_COCOON, STAND, SYR_ACE, SYR_SILK, TRAY} from './labWorld5';
import {ACETONE, Beaker, beakerInner, beakerLevelY, Bench, Blade, Cocoon, CocoonDish, CocoonSilk, Glint, LabWall, Nozzle, nozFrame, NozzleStand, NZ, Pump, PUMP_BTN, Rod, SandCracks, SandDish, SILK, TipCloseup, Tray, Tube} from './LabArt5';
import {A0, grainsAt, labPhys, LabPhys, N_LEN, ss} from './labPhys5';
import {heroOutlet, HS, scr, streetCam, D_NEAR, zOf} from './Street5';

export const LS = 1.25;
const LH = DIM.hand * LS;
const ARM = (DIM.upperArm + DIM.foreArm) * LS;
export const HERO_LAB0: ManPose = {...BASE, x: 1300, y: 1470, s: LS, torso: 5, chest: 5, neck: 4, turn: 0.45, rW: 1, rElb: -1, lW: 1, lElb: -1, lWx: 1330, lWy: 1284};
const ss5 = (f: number, a: number, b: number) => {
  const x = clamp((f - a) / (b - a));
  return x * x * x * (x * (x * 6 - 15) + 10);
};
type Ease = (f: number, a: number, b: number) => number;
/** keyed path with per-segment easing (the default eases in and out) */
const keyV = (f: number, keys: [number, V, Ease?][]): V => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) return lerpV(keys[i - 1][1], keys[i][1], (keys[i][2] ?? ss)(f, keys[i - 1][0], keys[i][0]));
  return keys[keys.length - 1][1];
};
const keyN = (f: number, keys: [number, number, Ease?][]): number => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) return lerp(keys[i - 1][1], keys[i][1], (keys[i][2] ?? ss)(f, keys[i - 1][0], keys[i][0]));
  return keys[keys.length - 1][1];
};
/** accelerate in (a fast reach that brakes at the end) and decelerate out variants */
const easeOut: Ease = (f, a, b) => {
  const x = clamp((f - a) / (b - a));
  return 1 - (1 - x) ** 3;
};
const easeIn: Ease = (f, a, b) => {
  const x = clamp((f - a) / (b - a));
  return x * x * x;
};
const dirOf = (a: number): V => ({x: Math.cos((a * Math.PI) / 180), y: Math.sin((a * Math.PI) / 180)});
const wrap = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;

// ------------------------------------------------------------------ hand poses
const H_REST: HandPose = {curl: [0.24, 0.3, 0.34, 0.38], spread: 0.28, thumb: 20, thumbCurl: 0.35};
const H_OPEN: HandPose = {curl: [0.06, 0.1, 0.14, 0.2], spread: 0.6, thumb: 56, thumbCurl: 0.08};
const H_COC: HandPose = {curl: [0.48, 0.55, 0.64, 0.72], spread: 0.18, thumb: 24, thumbCurl: 0.5};
const H_PINCH_OPEN: HandPose = {curl: [0.12, 0.6, 0.68, 0.74], spread: 0.2, thumb: 46, thumbCurl: 0.1};
const H_PINCH: HandPose = {curl: [0.3, 0.92, 0.95, 0.97], spread: 0.1, thumb: 16, thumbCurl: 0.3};
const H_ROD: HandPose = {curl: [0.8, 0.84, 0.87, 0.9], spread: 0.08, thumb: 24, thumbCurl: 0.55};
const H_BEAKER: HandPose = {curl: [0.45, 0.5, 0.55, 0.6], spread: 0.15, thumb: 34, thumbCurl: 0.35};
const H_PRESS: HandPose = {curl: [0.06, 0.86, 0.9, 0.92], spread: 0.12, thumb: 24, thumbCurl: 0.55};
const H_NOZ: HandPose = {curl: [0.7, 0.76, 0.8, 0.84], spread: 0.08, thumb: 26, thumbCurl: 0.5};
const H_NOZ_TIGHT: HandPose = {curl: [0.8, 0.85, 0.88, 0.9], spread: 0.06, thumb: 22, thumbCurl: 0.6};

const handUV = (pose: HandPose, which: 'index' | 'thumb' | 'pinch' | 'grip'): {u: number; v: number} => {
  const t = digitTips({x: 0, y: 0}, 0, 1, 1, pose);
  const p = which === 'index' ? t.tips[0] : which === 'thumb' ? t.thumb : which === 'pinch' ? lerpV(t.tips[0], t.thumb, 0.5) : lerpV(lerpV(t.tips[0], t.tips[1], 0.5), t.thumb, 0.42);
  return {u: p.x, v: p.y};
};
const COC_UV = handUV(H_COC, 'grip');
const PINCH_UV = handUV(H_PINCH, 'pinch');
const PRESS_UV = handUV(H_PRESS, 'index');
const ROD_UV = {u: 0.58, v: 0.02};

type Side = 'L' | 'R';
/** the pose with one hand placed so its hand-unit point (gu, gv) lies on `grip` with the hand axis at `ang`; when the
 *  target is close to the shoulder the arm is foreshortened (it points toward the camera) instead of folding */
const placeHand = (p: ManPose, side: Side, grip: V, ang: number, gu: number, gv: number): ManPose => {
  const ts = side === 'L' ? 1 : -1;
  const d = dirOf(ang);
  const drawnWrist = sub(sub(grip, mul(d, gu * LH)), mul(perp(d), gv * LH * ts));
  const S = side === 'L' ? manJoints(p).L.S : manJoints(p).R.S;
  const dist = Math.hypot(drawnWrist.x - S.x, drawnWrist.y - S.y);
  const fa = clamp(dist / (ARM * 0.82), 0.62, 1);
  let fd = d;
  let q = p;
  for (let i = 0; i < 4; i++) {
    const W = add(drawnWrist, mul(fd, 6 * p.s));
    q = side === 'L' ? {...p, lWx: W.x, lWy: W.y, lW: 1, lFa: fa} : {...p, rWx: W.x, rWy: W.y, rW: 1, rFa: fa};
    const j = manJoints(q);
    fd = (side === 'L' ? j.L : j.R).foreDir;
  }
  const wr = wrap(ang - deg(Math.atan2(fd.y, fd.x)));
  return side === 'L' ? {...q, lWr: wr} : {...q, rWr: wr};
};
const drawnHand = (p: ManPose, side: Side) => {
  const j = manJoints(p);
  const A = side === 'L' ? j.L : j.R;
  return {wrist: add(A.W, mul(A.foreDir, -6 * p.s)), ang: A.handAng};
};

// ------------------------------------------------------------------ the match into the wrist shooter (End5)
/** at LT5.toDevice the lab nozzle's outlet sits where the wrist shooter's outlet is in the street pre-roll's first
 *  frame (place, size and direction) */
export const END = (() => {
  const g = LT5.toDevice - 952;
  const c = streetCam(g);
  const o = heroOutlet(g);
  const O = scr(c, D_NEAR, o.outlet);
  const z = (17 * HS * 0.2 * zOf(c, D_NEAR)) / NZ.outerR;
  return {O, z, ang: deg(Math.atan2(o.dir.y, o.dir.x))};
})();

// ------------------------------------------------------------------ the nozzle, the blade, the fibre
const physAt = (f: number) => labPhys(f, END.ang);
export const nozzleAt = (f: number) => {
  const P = physAt(f);
  return {tip: P.tip, rear: add(P.tip, mul(dirOf(P.ang), -N_LEN)), ang: P.ang};
};
const gripNozzle = (p: ManPose, tip: V, rear: V): ManPose => {
  const F = nozFrame(rear, tip);
  const grip = F.at(F.len - 14, 0);
  return placeHand(p, 'R', grip, F.ang + 128, 0.6, 0.02);
};

// ------------------------------------------------------------------ the cocoon and its thread
const C1: V = {x: COCOON_DISH.x - 10, y: BENCH_Y - 4 - COC_LEN * 0.31};
const LIFTED: V = {x: 1262, y: 1196};
const OVER: V = {x: BEAKER.x + 10, y: BENCH_Y - BEAKER.h - 36};
const levelAt = (f: number) => BEAKER.level0 + 0.04 * ss(f, LT5.drop, LT5.stir1) - 0.16 * ss(f, LT5.draw0, LT5.draw1);
const surfaceY = (f: number) => beakerLevelY(levelAt(f));
/** where the near hand holds the cocoon (its centre) */
const cocoonHeld = (f: number): V =>
  keyV(f, [
    [LT5.lift0, C1],
    // a quick lift with a little overshoot, settling
    [LT5.lift1, add(LIFTED, {x: 0, y: -10}), easeOut],
    [LT5.settle, LIFTED],
    // drawn a little right as the thread is pulled from it (counter-tension)
    [LT5.tPull1, add(LIFTED, {x: 10, y: 2})],
    [LT5.ccarry1, OVER],
    [LT5.drop, add(OVER, {x: 0, y: 8})],
  ]);
/** the cocoon's turn in the grip as the thread unwinds */
const cocoonSpin = (f: number) => 12 * ss(f, LT5.lift0, LT5.lift1) + 160 * ss(f, LT5.tPull0, LT5.tPull1);
/** the far hand's pinch point while it draws the thread */
const THREAD0 = (f: number) => {
  // the loose end: on the cocoon's left end (rotating with it)
  const c = cocoonHeld(f);
  const a = ((-180 + cocoonSpin(f) * 0.15) * Math.PI) / 180;
  return add(c, {x: Math.cos(a) * COC_LEN * 0.42, y: Math.sin(a) * COC_LEN * 0.18 - 4});
};
const pinchPoint = (f: number): V =>
  keyV(f, [
    [LT5.rReach0, {x: 1060, y: BENCH_Y - 16}],
    [LT5.rContact - 6, add(THREAD0(LT5.rContact), {x: -18, y: -22}), easeOut],
    [LT5.rContact, THREAD0(LT5.rContact)],
    // drawn out in an arc, up and left
    [LT5.tPull0 + 12, add(THREAD0(LT5.tPull0), {x: -70, y: -40})],
    [LT5.tPull1, add(THREAD0(LT5.tPull0), {x: -150, y: -14})],
    // carried with the cocoon over the beaker, then down to the liquid
    [LT5.ccarry1, {x: BEAKER.x - 30, y: BENCH_Y - BEAKER.h - 20}],
    [LT5.dip, {x: BEAKER.x - 26, y: surfaceY(LT5.dip) + 4}],
  ]);
type CocState = {c: V; ang: number; op: number; loosen: number; inBeaker: boolean; held: boolean; squash: number};
export const cocoonAt = (f: number): CocState => {
  const squash = f >= LT5.contact && f < LT5.lift1 ? Math.sin(clamp((f - LT5.contact) / 8) * Math.PI) * 0.06 : 0;
  if (f < LT5.lift0) return {c: C1, ang: -6 + 6 * ss(f, LT5.contact, LT5.grip1), op: 1, loosen: 0, inBeaker: false, held: f >= LT5.contact, squash};
  if (f < LT5.drop) return {c: cocoonHeld(f), ang: cocoonSpin(f) * 0.25 - 4, op: 1, loosen: 0, inBeaker: false, held: true, squash};
  // let go: it drops, splashes, floats, loosens and comes apart into strands as it is stirred
  const t = (f - LT5.drop) / 30;
  const surf = surfaceY(f) - COC_LEN * 0.31 * 0.4;
  const y0 = cocoonHeld(LT5.drop).y;
  const fall = Math.min(surf, y0 + 0.5 * 4000 * t * t);
  const bob = fall >= surf ? 2.5 * Math.sin((f - LT5.drop) * 0.5) * Math.exp(-(f - LT5.drop - 4) / 8) : 0;
  const swirl = ss(f, LT5.stir0, LT5.stir1);
  const orbit = swirl * 10;
  const ph = (f - LT5.stir0) * 0.25;
  return {
    c: {x: BEAKER.x + 10 + orbit * Math.cos(ph), y: fall + bob + 14 * swirl + orbit * 0.3 * Math.sin(ph)},
    ang: -4 + 40 * swirl,
    op: 1 - ss(f, LT5.stir0 + 10, LT5.stir1 - 2),
    loosen: ss(f, LT5.drop + 4, LT5.stir0 + 14),
    inBeaker: true,
    held: false,
    squash: 0,
  };
};

// ------------------------------------------------------------------ the rod
const rodAt = (f: number) => {
  const st = ss(f, LT5.stir0, LT5.stir0 + 4) * (1 - ss(f, LT5.stir1 - 3, LT5.stir1));
  const ph = ((f - LT5.stir0) / 11) * Math.PI * 2;
  const e = {x: Math.cos(ph), y: Math.sin(ph)};
  const top0 = {x: ROD.top.x, y: ROD.top.y + 30};
  const top = add(top0, {x: 10 * e.x * st, y: 3 * e.y * st});
  const foot = add(ROD.foot, {x: -4 * e.x * st, y: 0});
  const grip = lerpV(top, foot, 0.12);
  return {top, foot, grip, ang: deg(Math.atan2(foot.y - top.y, foot.x - top.x))};
};

// ------------------------------------------------------------------ the hands
type HandState = {pose: HandPose; place: {grip: V; ang: number; gu: number; gv: number} | null; hold: 'cocoon' | 'rod' | 'beaker' | 'nozzle' | null};
const BEAKER_GRIP: V = {x: BEAKER.x + BEAKER.w / 2 + 4, y: BENCH_Y - 58};
/** the near (left) hand: the cocoon, the beaker, the pump */
const nearState = (f: number): HandState => {
  if (f < LT5.drop + 2) {
    // enters fast from the right (a small pull back first), opens over the cocoon, contacts, curls, lifts
    const pre = ss(f, LT5.open - 10, LT5.open);
    const close = ss(f, LT5.contact - 1, LT5.grip1);
    const letGo = ss(f, LT5.drop - 1, LT5.drop + 2);
    const pose = mixHand(mixHand(mixHand(H_REST, H_OPEN, pre), H_COC, close), H_OPEN, letGo);
    const g =
      f < LT5.contact
        ? keyV(f, [
            [LT5.enter0, {x: 1420, y: 1150}],
            [LT5.enter0 + 4, {x: 1430, y: 1146}],
            [LT5.open, {x: C1.x + 6, y: C1.y - 40}, easeOut],
            [LT5.contact, C1],
          ])
        : cocoonAt(f).c;
    const ang = keyN(f, [[LT5.enter0, 160], [LT5.open, 112], [LT5.contact, 104], [LT5.settle, 110], [LT5.tPull1, 116], [LT5.drop, 100]]);
    return {pose, place: {grip: f < LT5.contact ? g : cocoonHeld(Math.max(f, LT5.lift0)), ang, gu: COC_UV.u, gv: COC_UV.v}, hold: f >= LT5.contact && f < LT5.drop + 1 ? 'cocoon' : null};
  }
  if (f < LT5.stir1 + 4) {
    // to the beaker's side and round it: it steadies the beaker while it is stirred
    const from = cocoonHeld(LT5.drop);
    const g = keyV(f, [[LT5.drop + 2, from], [LT5.beakerGrip, BEAKER_GRIP, easeOut]]);
    const shake = ss(f, LT5.stir0, LT5.stir0 + 4) * (1 - ss(f, LT5.stir1 - 4, LT5.stir1));
    const gg = add(g, {x: shake * 1.2 * Math.sin((f - LT5.stir0) * 0.57), y: 0});
    const pose = mixHand(H_OPEN, H_BEAKER, ss(f, LT5.beakerGrip - 4, LT5.beakerGrip));
    const ang = keyN(f, [[LT5.drop + 2, 100], [LT5.beakerGrip, 178]]);
    const uv = {u: lerp(COC_UV.u, 0.6, ss(f, LT5.drop, LT5.beakerGrip)), v: lerp(COC_UV.v, 0.05, ss(f, LT5.drop, LT5.beakerGrip))};
    return {pose, place: {grip: gg, ang, gu: uv.u, gv: uv.v}, hold: f >= LT5.beakerGrip - 1 ? 'beaker' : null};
  }
  if (f < LT5.press + 10) {
    // off the beaker, the index to the pump's button: press, lift
    const btn = {x: PUMP_BTN.x, y: PUMP_BTN.y + 2 * ss(f, LT5.press - 2, LT5.press) * (1 - ss(f, LT5.press + 3, LT5.press + 6))};
    const pre = add(btn, {x: 8, y: -26});
    const g = keyV(f, [[LT5.stir1 + 4, BEAKER_GRIP], [LT5.press - 3, pre, easeOut], [LT5.press - 1, btn], [LT5.press + 4, btn], [LT5.press + 10, add(pre, {x: 20, y: -10})]]);
    const pose = mixHand(H_BEAKER, H_PRESS, ss(f, LT5.stir1 + 4, LT5.press - 4));
    const a = keyN(f, [[LT5.stir1 + 4, 178], [LT5.press - 3, 118]]);
    const k = ss(f, LT5.stir1 + 4, LT5.press - 4);
    return {pose, place: {grip: g, ang: a, gu: lerp(0.6, PRESS_UV.u, k), gv: lerp(0.05, PRESS_UV.v, k)}, hold: null};
  }
  return {pose: mixHand(H_PRESS, H_REST, ss(f, LT5.press + 10, LT5.press + 20)), place: null, hold: null};
};
/** the far (right) hand: the thread, the rod, the nozzle */
const farState = (f: number): HandState => {
  if (f < LT5.rReach0) return {pose: H_REST, place: {grip: {x: 1060, y: BENCH_Y - 16}, ang: 60, gu: 0.72, gv: 0}, hold: null};
  if (f < LT5.dip + 4) {
    const pre = ss(f, LT5.rReach0, LT5.rContact - 6);
    const close = ss(f, LT5.rContact - 2, LT5.rContact + 1);
    const letGo = ss(f, LT5.dip, LT5.dip + 3);
    const pose = mixHand(mixHand(mixHand(H_REST, H_PINCH_OPEN, pre), H_PINCH, close), H_PINCH_OPEN, letGo);
    const ang = keyN(f, [[LT5.rReach0, 60], [LT5.rContact, 26], [LT5.tPull1, 40], [LT5.dip, 70]]);
    return {pose, place: {grip: pinchPoint(f), ang, gu: PINCH_UV.u, gv: PINCH_UV.v}, hold: null};
  }
  if (f < LT5.rodOff + 2) {
    const rod = rodAt(f);
    const rodAng = rod.ang - 90; // across the rod from his side, pointing right (thumb up)
    const from = pinchPoint(LT5.dip);
    const g = keyV(f, [[LT5.dip + 4, from], [LT5.rodGrip, rod.grip, easeOut]]);
    const close = ss(f, LT5.rodGrip - 3, LT5.rodGrip + 1);
    const open = ss(f, LT5.rodOff - 2, LT5.rodOff + 2);
    const pose = mixHand(mixHand(H_PINCH_OPEN, H_ROD, close), H_PINCH_OPEN, open);
    const a = keyN(f, [[LT5.dip + 4, 70], [LT5.rodGrip, rodAng]]);
    return {pose, place: {grip: f >= LT5.rodGrip ? rod.grip : g, ang: a, gu: lerp(PINCH_UV.u, ROD_UV.u, ss(f, LT5.dip, LT5.rodGrip)), gv: lerp(PINCH_UV.v, ROD_UV.v, ss(f, LT5.dip, LT5.rodGrip))}, hold: f >= LT5.rodGrip - 1 && f < LT5.rodOff + 1 ? 'rod' : null};
  }
  // to the nozzle on its stand: a quick reach, the grip closes before it moves, then it is lifted into the aim
  const nz = nozzleAt(f);
  const F = nozFrame(nz.rear, nz.tip);
  const grip = F.at(F.len - 14, 0);
  const pose = mixHand(mixHand(H_PINCH_OPEN, H_NOZ, ss(f, LT5.nozGrip - 4, LT5.nozGrip)), H_NOZ_TIGHT, ss(f, LT5.pull0 - 12, LT5.pull0) * (1 - ss(f, LT5.release, LT5.release + 6)));
  if (f < LT5.nozGrip) {
    const from = rodAt(LT5.rodOff).grip;
    const g = keyV(f, [[LT5.rodOff + 2, from], [LT5.nozGrip - 3, add(grip, {x: 12, y: -30}), easeOut], [LT5.nozGrip, grip]]);
    const a = keyN(f, [[LT5.rodOff + 2, rodAt(LT5.rodOff).ang - 90], [LT5.nozGrip - 3, F.ang + 128]]);
    return {pose, place: {grip: g, ang: a, gu: 0.6, gv: 0.02}, hold: null};
  }
  return {pose, place: null, hold: 'nozzle'};
};

// ------------------------------------------------------------------ the scientist
/** his hips: at the cocoon end, then a step and a half left with the lift, to stand under the load */
const heroX = (f: number) => 1300 + lerp(0, -300, ss(f, LT5.out - 10, LT5.liftTop));
export const heroPose = (f: number): ManPose => {
  const x = heroX(f);
  const walk = ss(f, LT5.out - 10, LT5.liftTop);
  const bob = walk > 0 && walk < 1 ? 6 * Math.abs(Math.sin(walk * Math.PI * 3)) : 0;
  // a lean into the pull and back as the blade comes free
  const lean = 4 * ss(f, LT5.pull0, LT5.pull0 + 10) * (1 - ss(f, LT5.breakFree, LT5.breakFree + 8)) - 2 * ss(f, LT5.breakFree, LT5.breakFree + 6) * (1 - ss(f, LT5.breakFree + 6, LT5.liftTop));
  let p: ManPose = {...HERO_LAB0, x, y: HERO_LAB0.y - bob, torso: 5 - lean, chest: 5 + 0.5 * lean};
  const fs = farState(f);
  if (fs.hold === 'nozzle') {
    const nz = nozzleAt(f);
    p = gripNozzle(p, nz.tip, nz.rear);
  } else if (fs.place) p = placeHand(p, 'R', fs.place.grip, fs.place.ang, fs.place.gu, fs.place.gv);
  const ns = nearState(f);
  if (ns.place) p = placeHand(p, 'L', ns.place.grip, ns.place.ang, ns.place.gu, ns.place.gv);
  else {
    const back = ss(f, LT5.press + 10, LT5.press + 24);
    const q = placeHand(p, 'L', add(PUMP_BTN, {x: 28, y: -36}), 118, PRESS_UV.u, PRESS_UV.v);
    p = {...q, lW: 1 - back, lTu: -330, lTv: -40, lElb: -1, lWr: lerp(q.lWr, 0, back), lFa: lerp(q.lFa ?? 1, 1, back)};
  }
  return p;
};

// ------------------------------------------------------------------ camera
type K = {f: number; c: (f: number) => Cam};
const fixed = (x: number, y: number, z: number) => () => ({x, y, z});
const track = (z: number, at: (f: number) => V, sx = 540, sy = 960) => (f: number): Cam => {
  const p = at(f);
  return {x: p.x - (sx - 540) / z, y: p.y - (sy - 960) / z, z};
};
const fibreHead = (f: number) => physAt(f).fibre.to;
const tipPt = (f: number) => physAt(f).tip;
const bladeMid = (f: number) => {
  const P = physAt(f);
  return lerpV(P.bladeT, P.bladeE, 0.5);
};
const attachPt = (f: number) => physAt(f).fibre.to;
const tipToBlade = (t: number) => (f: number) => {
  const P = physAt(f);
  return lerpV(P.tip, lerpV(P.bladeT, P.bladeE, 0.5), t);
};
const tipOf = (f: number) => physAt(f).tip;
/** the end: the nozzle's outlet held at the wrist shooter's outlet place, at its size */
const endCam = (): Cam => {
  const nz = nozzleAt(LT5.toDevice);
  return {x: nz.tip.x - (END.O.x - 540) / END.z, y: nz.tip.y - (END.O.y - 960) / END.z, z: END.z};
};
/** a point on the nozzle's axis, x from the tip (negative = inside, toward the rear) */
const alongNoz = (x: number, z: number) => (f: number) => ({...add(physAt(f).tip, mul(dirOf(physAt(f).ang), x)), z});
const KEYS: K[] = [
  // the cocoon's wound silk up close, pulling back to the bench and the scientist
  {f: LT5.match, c: () => ({x: C1.x + 2, y: C1.y - 2, z: 20})},
  {f: 168, c: fixed(C1.x - 6, C1.y - 30, 5.2)},
  {f: LT5.reveal1, c: fixed(1236, 1150, 2.5)},
  // the grip and the lift, close
  {f: LT5.contact + 2, c: fixed(1272, 1240, 4.6)},
  {f: LT5.settle, c: fixed(1258, 1210, 5.4)},
  // the thread drawn out
  {f: LT5.tPull1 - 6, c: fixed(1200, 1196, 5.0)},
  {f: LT5.drop, c: fixed(1176, 1196, 4.4)},
  // the dissolving, close on the liquid
  {f: 304, c: fixed(1170, 1228, 5.6)},
  {f: LT5.stir1, c: fixed(1166, 1236, 5.6)},
  // the pump and the reach for the nozzle: a wider bench view as the solution runs to it
  {f: LT5.press + 2, c: fixed(1060, 1190, 2.8)},
  {f: LT5.nozLift1, c: fixed(870, 1120, 1.85)},
  {f: 372, c: fixed(690, 1180, 3.2)},
  // into the nozzle as its wall opens, riding the flow down to the tip; then out along the strand as it forms
  {f: 380, c: alongNoz(-70, 7.5)},
  {f: LT5.tip0, c: alongNoz(-38, 10.5)},
  {f: 400, c: alongNoz(-8, 12.5)},
  {f: LT5.harden0, c: alongNoz(22, 12)},
  {f: LT5.exit, c: alongNoz(50, 10.5)},
  // out with the new fibre into open space; the blade comes into view ahead of it
  {f: LT5.exit + 16, c: track(6.4, tipPt, 790, 950)},
  // drawing back: the outlet and the scientist's hand on the right, the strand reaching across open space
  {f: 492, c: track(3.9, tipPt, 860, 960)},
  {f: 522, c: track(3.5, fibreHead, 430, 1000)},
  {f: 544, c: fixed(440, 1238, 3.4)},
  // contact and the slack drawn out
  {f: LT5.fcontact, c: fixed(382, 1254, 6.6)},
  {f: 582, c: fixed(398, 1246, 5.6)},
  {f: LT5.settle1, c: fixed(410, 1240, 5.0)},
  // the pull: hand, fibre and blade in one frame; the resistance close on the sand
  {f: LT5.pull0 + 2, c: fixed(640, 1165, 1.75)},
  {f: LT5.breakFree - 2, c: fixed(600, 1175, 1.9)},
  // the release and the high lift
  {f: LT5.out, c: track(2.2, tipToBlade(0.5))},
  {f: LT5.liftTop, c: track(2.3, tipToBlade(0.55))},
  // the strength beat: close under the hanging blade, the one thread rising out of frame, catching the light
  {f: 734, c: track(5.6, attachPt, 540, 820)},
  {f: 754, c: track(4.6, bladeMid, 560, 1020)},
  // then back to the scientist holding it up: the whole load path, hand to blade, in one frame
  {f: 780, c: fixed(705, 950, 1.6)},
  // set back down in the sand
  {f: LT5.carry1, c: track(2.9, tipToBlade(0.62))},
  {f: LT5.flat, c: fixed(SAND.x + 10, SAND.surf - 60, 3.6)},
  // up along the slack fibre to the nozzle's outlet
  {f: LT5.release + 6, c: track(3.4, tipToBlade(0.45))},
  {f: LT5.toDevice, c: endCam},
];
const camAt = (k: K, f: number) => {
  const c = k.c(f);
  return {x: c.x, y: c.y, l: Math.log(c.z)};
};
/** the camera passes through its keys on a non-uniform Catmull-Rom spline (x, y, log zoom); the pull-back from the
 *  match starts gently */
export const labCam5 = (f: number): Cam => {
  const c = labCamBase(f);
  // a small kick of the camera as the fibre strikes the metal (a few frames, decaying)
  if (f >= LT5.fcontact && f < LT5.fcontact + 14) {
    const e = f - LT5.fcontact;
    const a = Math.exp(-e / 3.5) * Math.sin(e * 1.9);
    return {...c, x: c.x + 1.2 * a, y: c.y + 2.2 * a, z: c.z * (1 + 0.03 * Math.exp(-e / 4))};
  }
  return c;
};
const labCamBase = (f: number): Cam => {
  if (f <= KEYS[0].f) return KEYS[0].c(f);
  let i = 1;
  while (i < KEYS.length - 1 && f > KEYS[i].f) i++;
  if (f >= KEYS[KEYS.length - 1].f) return KEYS[KEYS.length - 1].c(f);
  const k0 = KEYS[Math.max(0, i - 2)];
  const k1 = KEYS[i - 1];
  const k2 = KEYS[i];
  const k3 = KEYS[Math.min(KEYS.length - 1, i + 1)];
  let t = clamp((f - k1.f) / (k2.f - k1.f));
  if (i === 1) t = t * t * (3 - 2 * t);
  const P = [camAt(k0, f), camAt(k1, f), camAt(k2, f), camAt(k3, f)];
  const d1 = k2.f - k1.f;
  const m = (a: number, c: number, ta: number, tb: number) => ((c - a) / Math.max(1, tb - ta)) * d1;
  const h = (p0: number, p1: number, p2: number, p3: number) => {
    const m1 = i - 1 === 0 ? p2 - p1 : m(p0, p2, k0.f, k2.f);
    const m2 = i === KEYS.length - 1 ? p2 - p1 : m(p1, p3, k1.f, k3.f);
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * p1 + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2 + (t3 - t2) * m2;
  };
  return {x: h(P[0].x, P[1].x, P[2].x, P[3].x), y: h(P[0].y, P[1].y, P[2].y, P[3].y), z: Math.exp(h(P[0].l, P[1].l, P[2].l, P[3].l))};
};

// ------------------------------------------------------------------ the fibre
const Fibre: React.FC<{P: LabPhys; f: number; k: number; z: number}> = ({P, f, k, z}) => {
  if (!P.fibre.on) return null;
  const a = P.fibre.from;
  const b = P.fibre.to;
  const dd = sub(b, a);
  const n = perp(norm(dd));
  const N = 40;
  const pts: V[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const c = P.fibre.c;
    const base = c ? add(add(mul(a, (1 - t) ** 2), mul(c, 2 * t * (1 - t))), mul(b, t * t)) : lerpV(a, b, t);
    let p = add(base, {x: 0, y: P.fibre.sag * 4 * t * (1 - t)});
    // trembling under tension (a standing wave), and the impact's wave running back along it
    const vib = P.fibre.vib * Math.sin(t * Math.PI * 3) * Math.sin(f * 2.7);
    const wv = P.fibre.wave > 0 ? 6 * Math.exp(-((t - (1 - P.fibre.wave)) ** 2) / 0.004) * (1 - P.fibre.wave) : 0;
    p = add(p, mul(n, vib + wv));
    pts.push(p);
  }
  const d = `M${pts.map(Pt).join(' L')}`;
  // just out of the outlet it is still setting: the first part keeps the solution's gold for a moment
  const wet = P.fibre.fly < 1 ? 1 - ss(f, LT5.exit, LT5.exit + 70) : 0;
  const near = (m: number) => `M${pts.slice(0, m).map(Pt).join(' L')}`;
  // thinner than everything round it, constant (no rubber-band stretching); a touch thicker at the head while forming
  const w = 1.8;
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={fmt(w + 1.3 * k)} strokeLinecap="round" />
      <path d={d} fill="none" stroke="#FFFDF6" strokeWidth={fmt(w)} strokeLinecap="round" />
      {wet > 0.01 && <path d={near(14)} fill="none" stroke="#F6DE9C" strokeWidth={fmt(w * 0.8)} strokeLinecap="round" opacity={0.5 * wet} />}
      {wet > 0.01 && <path d={near(6)} fill="none" stroke="#EFC766" strokeWidth={fmt(w * 0.8)} strokeLinecap="round" opacity={0.8 * wet} />}
      {/* a highlight running out along it while it travels */}
      {P.fibre.fly > 0 && P.fibre.fly < 1 && (() => {
        const g = ((f - LT5.exit) / 18) % 1;
        const i0 = Math.floor(g * N * 0.8);
        return <path d={`M${pts.slice(i0, i0 + 6).map(Pt).join(' L')}`} fill="none" stroke="#FFFFFF" strokeWidth={fmt(w * 0.5)} strokeLinecap="round" opacity={0.9} />;
      })()}
      {f < LT5.fcontact && <circle cx={fmt(b.x)} cy={fmt(b.y)} r={fmt(w * 1.0)} fill="#FFF6DA" stroke={INK} strokeWidth={fmt(0.7 * k)} />}
      {P.contactSquash > 0 && (
        <ellipse cx={fmt(b.x)} cy={fmt(b.y)} rx={fmt(w * (1 + 1.1 * P.contactSquash))} ry={fmt(w * (1.1 - 0.4 * P.contactSquash))} fill="#FFF6DA" stroke={INK} strokeWidth={fmt(0.7 * k)} />
      )}
      {void z}
    </g>
  );
};

// ------------------------------------------------------------------ the scene
export const LabScene5: React.FC<{f: number}> = ({f}) => {
  const id = `l${Math.round(f * 100)}`;
  const cam = labCam5(f);
  const k = 1 / Math.sqrt(Math.max(1, cam.z));
  const P = physAt(f);
  const nz = nozzleAt(f);
  const hero = heroPose(f);
  const ns = nearState(f);
  const fs = farState(f);
  const F = nozFrame(nz.rear, nz.tip);
  // the tubes: from the syringes down onto the bench and up to the nozzle's rear and side port
  const rearDrop = F.at(F.len + 26, 30);
  const benchUnder = (x: number) => ({x, y: BENCH_Y - 18});
  const tubeSilk: V[] = [{x: SYR_SILK.x0 - 12, y: SYR_SILK.y}, {x: SYR_SILK.x0 - 30, y: SYR_SILK.y + 40}, benchUnder(Math.min(SYR_SILK.x0 - 60, rearDrop.x + 70)), benchUnder(Math.min(SYR_SILK.x0 - 80, rearDrop.x + 40)), rearDrop, F.at(F.len + 10, 4), F.at(F.len, 0)];
  const portW = F.at(178, 24);
  const portDrop = F.at(172, 56);
  const tubeAce: V[] = [{x: SYR_ACE.x0 - 12, y: SYR_ACE.y}, {x: SYR_ACE.x0 - 46, y: SYR_ACE.y + 70}, benchUnder(Math.min(SYR_ACE.x0 - 70, portDrop.x + 80)), benchUnder(Math.min(SYR_ACE.x0 - 90, portDrop.x + 50)), portDrop, portW, F.at(178, 12)];
  const tubeIn: V[] = [{x: SYR_SILK.x0 - 12, y: SYR_SILK.y + 4}, {x: SYR_SILK.x0 - 4, y: SYR_SILK.y - 60}, {x: 1050, y: 1080}, {x: BEAKER.x - 26, y: BENCH_Y - BEAKER.h - 16}, {x: BEAKER.x - 26, y: BENCH_Y - 26}];

  // the beaker: the thread and the cocoon go into the liquid; stirring makes a vortex; the silk unravels into strands
  // that are carried round, break up, thin and fade as the solution forms; then it is drawn toward the intake
  const coc = cocoonAt(f);
  const liquid = mix('#F3DFA2', '#EECB6C', ss(f, LT5.stir0, LT5.stir1 + 6));
  const rod = rodAt(f);
  const bi = beakerInner();
  const ly = beakerLevelY(levelAt(f));
  const circ = ss(f, LT5.stir0, LT5.stir0 + 5) * (1 - ss(f, LT5.stir1 + 6, LT5.stir1 + 24));
  const drawOp = ss(f, LT5.draw0 - 2, LT5.draw0 + 3) * (1 - ss(f, LT5.draw1 - 2, LT5.draw1 + 4));
  const bc = {x: (bi.x0 + bi.x1) / 2, y: (ly + bi.y1) / 2};
  const brx = (bi.x1 - bi.x0) * 0.38;
  const bry = (bi.y1 - ly) * 0.32;
  const splash = f >= LT5.drop + 4 && f < LT5.drop + 20 ? (f - LT5.drop - 4) / 16 : -1;
  const dipSplash = f >= LT5.dip && f < LT5.dip + 14 ? (f - LT5.dip) / 14 : -1;
  const strands = coc.inBeaker ? ss(f, LT5.drop + 2, LT5.stir0 + 8) * (1 - ss(f, LT5.stir1 - 8, LT5.stir1 + 8)) : 0;
  const vortex = circ * 7;
  const beakerInside = (
    <g>
      <Rod id={`${id}-rdi`} foot={rod.foot} top={rod.top} r={ROD.r} k={k} op={0.5} />
      {circ > 0.01 &&
        [0, 1, 2, 3].map((i) => {
          const ph = (f - LT5.stir0) * 0.5 + i * 1.6;
          const sc = 1 - 0.2 * i;
          const N = 10;
          const pts = Array.from({length: N + 1}, (_, j) => {
            const a = ph + (1.4 * j) / N;
            return add(bc, {x: Math.cos(a) * brx * sc, y: Math.sin(a) * bry * sc - 6 * i});
          });
          return <path key={`c${i}`} d={`M${pts.map(Pt).join(' L')}`} fill="none" stroke="#FCF1C8" strokeWidth={fmt(Math.max(0.9, 1.7 * k))} strokeLinecap="round" opacity={0.8 * circ} />;
        })}
      {strands > 0.01 &&
        Array.from({length: 12}).map((_, i) => {
          // a strand of silk carried round the vortex, breaking into shorter pieces as it goes
          const swirl = ss(f, LT5.stir0, LT5.stir1);
          const a0 = i * 0.52 + (f - LT5.drop) * (0.04 + 0.32 * swirl);
          const r = (0.25 + 0.6 * ((i * 37) % 10) / 10) * brx * (0.4 + 0.6 * swirl);
          const len = 1.2 * (1 - 0.65 * swirl);
          const N = 8;
          const pts = Array.from({length: N + 1}, (_, j) => {
            const a = a0 + (len * j) / N;
            const rr = r * (1 + 0.12 * Math.sin(j + i));
            return add(swirl > 0.05 ? bc : coc.c, {x: Math.cos(a) * rr, y: Math.sin(a) * rr * (swirl > 0.05 ? bry / brx : 0.6) + 2 * Math.sin(j * 1.7 + f * 0.2)});
          });
          const broken = swirl > 0.35 && i % 3 === 0 ? pts.slice(0, 4) : pts;
          return <path key={`s${i}`} d={`M${broken.map(Pt).join(' L')}`} fill="none" stroke="#E2B654" strokeWidth={fmt(Math.max(0.6, 1.2 * k * (1 - 0.5 * swirl)))} strokeLinecap="round" opacity={strands * (0.9 - 0.4 * swirl)} />;
        })}
      {coc.inBeaker && coc.op > 0.01 && <Cocoon id={`${id}-cb`} c={coc.c} ang={coc.ang} k={k} len={COC_LEN * (1 - 0.35 * (1 - coc.op))} loosen={coc.loosen} />}
      {drawOp > 0.01 &&
        [0, 1, 2, 3].map((i) => {
          const mouth = {x: BEAKER.x - 26, y: BENCH_Y - 26};
          const ph = ((f - LT5.draw0) / 10 + i * 0.25) % 1;
          const from = add(mouth, {x: 18 + i * 9, y: -14 + i * 7});
          const a = lerpV(from, mouth, ph);
          const b = lerpV(from, mouth, Math.min(1, ph + 0.25));
          return <path key={`d${i}`} d={`M${Pt(a)} L${Pt(b)}`} stroke="#FCF1C8" strokeWidth={fmt(Math.max(0.8, 1.4 * k))} strokeLinecap="round" opacity={0.8 * drawOp} />;
        })}
    </g>
  );
  // the surface: a dip at the centre while the vortex turns, rings where things go in
  const surfaceFx = (
    <g>
      {vortex > 0.2 && <path d={`M${fmt(bc.x - brx)},${fmt(ly)} Q${fmt(bc.x)},${fmt(ly + vortex * 2)} ${fmt(bc.x + brx)},${fmt(ly)}`} fill="none" stroke="#FCF1C8" strokeWidth={fmt(Math.max(0.8, 1.6 * k))} opacity={0.9} />}
      {[splash, dipSplash].map((sp, i) =>
        sp >= 0 ? <ellipse key={`sp${i}`} cx={fmt(i === 0 ? coc.c.x : BEAKER.x - 26)} cy={fmt(ly)} rx={fmt(6 + 26 * sp)} ry={fmt(1.5 + 4 * sp)} fill="none" stroke="#FFF6D8" strokeWidth={fmt(Math.max(0.8, 1.5 * k))} opacity={1 - sp} /> : null,
      )}
    </g>
  );
  // the pump: the silk syringe fills as the solution is drawn up, then is pushed on
  const pumpRun = ss(f, LT5.press, LT5.press + 3);
  const silkPlunger = lerp(0.5, 0.86, ss(f, LT5.draw0, LT5.draw1)) - 0.1 * ss(f, LT5.push0, 560);
  const pump = {silkFill: 1, silkPlunger, aceFill: 1, acePlunger: 0.62 - 0.08 * ss(f, LT5.ace0 - 6, 560), run: pumpRun, press: ss(f, LT5.press - 2, LT5.press) * (1 - ss(f, LT5.press + 4, LT5.press + 7))};
  const grains = grainsAt(f);
  const ex = heroExpr(f);
  const lh = ns.pose;
  const rh = fs.pose;
  const nozzleEl = (key: string) => (
    <Nozzle id={`${id}-${key}`} k={k} rear={nz.rear} tip={nz.tip} cut={ss(f, LT5.tip0 - 6, LT5.tip0) * (1 - ss(f, LT5.exit + 10, LT5.exit + 26))} silk={ss(f, LT5.silk0 - 14, LT5.silk0 + 4)} ace={ss(f, LT5.ace0, LT5.ace1)} core={f / 30} />
  );
  const beakerEl = (key: string) => <Beaker id={`${id}-${key}`} k={k} level={levelAt(f)} liquid={liquid} inside={beakerInside} front={surfaceFx} />;
  // the thread drawn from the cocoon by the far hand (fine, slightly slack), and the loose end left in the liquid
  const threadOn = f >= LT5.rContact && f < LT5.dip + 14;
  const thread = threadOn
    ? (() => {
        const a = THREAD0(Math.min(f, LT5.drop - 1));
        const b = f < LT5.dip + 3 ? pinchPoint(f) : add(pinchPoint(LT5.dip), {x: 0, y: 8 * ss(f, LT5.dip + 3, LT5.dip + 12)});
        const m = add(lerpV(a, b, 0.5), {x: 0, y: 5 + 3 * Math.sin(f * 0.4)});
        const d = `M${Pt(a)} Q${Pt(m)} ${Pt(b)}`;
        return (
          <g opacity={1 - ss(f, LT5.dip + 6, LT5.dip + 14)}>
            <path d={d} fill="none" stroke="#7E6C48" strokeWidth={1.6} opacity={0.55} strokeLinecap="round" />
            <path d={d} fill="none" stroke="#FFF8E6" strokeWidth={0.95} strokeLinecap="round" />
          </g>
        );
      })()
    : null;
  const holdL =
    ns.hold === 'cocoon' && !coc.inBeaker
      ? {front: [0, 1] as (number | 't')[], obj: (
          <g transform={`translate(${fmt(coc.c.x)} ${fmt(coc.c.y)}) scale(${fmt(1 + coc.squash)} ${fmt(1 - coc.squash)}) translate(${fmt(-coc.c.x)} ${fmt(-coc.c.y)})`}>
            <Cocoon id={`${id}-chh`} c={coc.c} ang={coc.ang} k={k} len={COC_LEN} />
            <CocoonSilk c={coc.c} ang={coc.ang} len={COC_LEN} op={0.7} />
          </g>
        )}
      : undefined;
  const holdR =
    fs.hold === 'rod'
      ? {front: [0, 1, 2, 3] as (number | 't')[], obj: <Rod id={`${id}-rdh`} foot={rod.foot} top={rod.top} r={ROD.r} k={k} />, palmFront: true}
      : fs.hold === 'nozzle'
        ? {front: [0, 1, 2, 3] as (number | 't')[], obj: nozzleEl('nzh'), palmFront: true}
        : undefined;
  // close views
  const tipView = cam.z > 9 && f >= LT5.tip0 - 10 && f < LT5.exit + 40;
  const heroView = ss(f, LT5.hero0, LT5.hero0 + 12) * (1 - ss(f, 758, 776));
  const fibreGlint = f >= LT5.hero0 && f < 800 ? ((f - LT5.hero0) / 26) % 1 : -1;
  const sandC = {x: 300 + 18, y: SAND.surf};
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <defs>
        <filter id={`${id}-wb`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={fmt(3 / Math.max(1, 1 + (cam.z - 1) / 2.2))} />
        </filter>
        <clipPath id={`${id}-above`}>
          <path d={`M-6000,-6000 H6000 V${BENCH_Y - 12} H-6000 Z`} />
        </clipPath>
        <radialGradient id={`${id}-vg`} gradientUnits="userSpaceOnUse" cx="540" cy="900" r="1150">
          <stop offset="0.5" stopColor="#0E1B24" stopOpacity="0" />
          <stop offset="0.8" stopColor="#0E1B24" stopOpacity="0.12" />
          <stop offset="1" stopColor="#0E1B24" stopOpacity="0.32" />
        </radialGradient>
      </defs>
      <Layer cam={cam} depth={2.2}>
        <g filter={`url(#${id}-wb)`}>
          <LabWall id={`${id}-wl`} />
        </g>
      </Layer>
      <Layer cam={cam} depth={1}>
        <Tube id={`${id}-ta`} pts={tubeAce} r={2.6} k={k} liquid={ACETONE} front={0.55 + 0.45 * ss(f, LT5.ace0 - 14, LT5.ace0)} far />
        <Tube id={`${id}-ts`} pts={tubeSilk} r={2.8} k={k} liquid={SILK} front={0.4 + 0.6 * ss(f, LT5.push0, LT5.silk0 - 8)} />
        <g clipPath={`url(#${id}-above)`}>
          <Man id={`${id}-hr`} pose={hero} expr={ex} lHand={lh} rHand={rh} outfit={HERO_LAB} inkK={0.9} />
        </g>
        <Bench id={`${id}-bn`} k={k} />
        <Tray id={`${id}-tr`} k={k} />
        <Cocoon id={`${id}-sc`} c={SPARE_COCOON} ang={-8} k={k} len={COC_LEN} />
        <NozzleStand id={`${id}-ns`} k={k} x={STAND.x} top={STAND.top} />
        <SandDish id={`${id}-sb`} k={k} back />
        {!P.free && <Blade id={`${id}-bl`} k={k} T={P.bladeT} E={P.bladeE} len={BLADE_LEN} />}
        <SandDish id={`${id}-sf`} k={k} />
        <SandCracks c={sandC} amt={P.crack * (1 - ss(f, LT5.out, LT5.out + 10))} k={k} />
        {grains.map((g, i) => (
          <circle key={i} cx={fmt(g.p.x)} cy={fmt(g.p.y)} r={fmt(g.r)} fill={g.c} stroke={INK} strokeWidth={fmt(0.3 * k)} />
        ))}
        {!coc.held && !coc.inBeaker && <Cocoon id={`${id}-c1`} c={C1} ang={-6} k={k} len={COC_LEN} />}
        {!coc.held && !coc.inBeaker && f < 200 && <CocoonSilk c={C1} ang={-6} len={COC_LEN} op={clamp((cam.z - 3) / 6)} />}
        <Cocoon id={`${id}-c2`} c={{x: COCOON_DISH.x + 30, y: BENCH_Y - 4 - COC_LEN * 0.31}} ang={8} k={k} len={COC_LEN * 0.92} />
        <CocoonDish id={`${id}-cd`} k={k} />
        {fs.hold !== 'rod' && <Rod id={`${id}-rd`} foot={rod.foot} top={rod.top} r={ROD.r} k={k} />}
        {beakerEl('bk')}
        <Pump id={`${id}-pm`} k={k} {...pump} />
        <Tube id={`${id}-ti`} pts={tubeIn} r={2.6} k={k} liquid={SILK} front={ss(f, LT5.draw0 - 2, LT5.draw1 - 4)} />
        {nozzleEl('nz')}
        {thread}
        <g clipPath={`url(#${id}-above)`}>
          <Man id={`${id}-hh`} pose={hero} expr={ex} lHand={lh} rHand={rh} outfit={HERO_LAB} inkK={0.9} handsOnly holdL={holdL} holdR={holdR} />
        </g>
        <Fibre P={P} f={f} k={k} z={cam.z} />
        {tipView && (
          <TipCloseup id={`${id}-tip`} tip={nz.tip} ang={nz.ang} t={f / 30} silk={ss(f, LT5.silk0, LT5.silk0 + 6)} ace={ss(f, LT5.ace0, LT5.ace1)} ext={clamp((f - LT5.extrude0) / (LT5.exit - LT5.extrude0)) ** 1.15 * (1 - 0.7 * ss(f, LT5.exit, LT5.exit + 8))} hard={ss(f, LT5.harden0, LT5.exit)} k={k} />
        )}
        {P.free && <Blade id={`${id}-blf`} k={k} T={P.bladeT} E={P.bladeE} len={BLADE_LEN} w={P.bladeW} />}
        {fibreGlint >= 0 && P.fibre.on && <Glint a={P.fibre.from} b={P.fibre.to} pos={fibreGlint} w={2.4} op={heroView} />}
      </Layer>
      {heroView > 0.01 && <rect x={0} y={0} width={1080} height={1920} fill={`url(#${id}-vg)`} opacity={heroView} />}
    </svg>
  );
};

const heroExpr = (f: number): Expr => mixExpr(mixExpr(mixExpr(EXPR_LAB, EXPR_FOCUS, ss(f, LT5.pull0 - 4, LT5.pull0 + 4) * (1 - ss(f, LT5.out, LT5.out + 10))), EXPR_GRIN, ss(f, LT5.liftTop, LT5.liftTop + 14)), EXPR_FOCUS, ss(f, LT5.release, LT5.toDevice));
export {PUMP, SAND, TRAY, COCOON_DISH, beakerInner};

/** screen points that captions must keep clear of */
export const labPoints = (f: number) => {
  const cam = labCam5(f);
  const toS = (p: V) => ({x: 540 + (p.x - cam.x) * cam.z, y: 960 + (p.y - cam.y) * cam.z});
  const P = physAt(f);
  const nz = nozzleAt(f);
  const hero = heroPose(f);
  const r = (w: number) => w * cam.z;
  const L = drawnHand(hero, 'L');
  const R = drawnHand(hero, 'R');
  const hc = (h: {wrist: V; ang: number}) => add(h.wrist, mul(dirOf(h.ang), LH * 0.45));
  const out: {x: number; y: number; r: number; what: string}[] = [
    {...toS(hc(R)), r: r(70), what: 'hand R'},
    {...toS(nz.tip), r: Math.max(60, r(8)), what: 'outlet'},
  ];
  if (nearState(f).place) out.push({...toS(hc(L)), r: r(70), what: 'hand L'});
  if (P.fibre.on) out.push({...toS(P.fibre.to), r: Math.max(60, r(10)), what: 'fibre end'});
  if (f >= LT5.exit - 10) out.push({...toS(lerpV(P.bladeT, P.bladeE, 0.5)), r: Math.max(80, r(50)), what: 'blade'});
  const coc = cocoonAt(f);
  if (f < LT5.stir1) out.push({...toS(coc.c), r: Math.max(60, r(34)), what: 'cocoon'});
  void A0;
  return out;
};
