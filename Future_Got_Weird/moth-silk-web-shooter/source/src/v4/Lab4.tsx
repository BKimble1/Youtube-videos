// V3 lab scene: the bench (labWorld3), the lead in his lab coat behind it, and one camera. It opens on a material
// match (the bridge's cartridge fluid continues inside the silk syringe on the pump) and pulls back to the bench;
// then a chain of close, readable actions: the cocoon pinched and lifted (its fibres draw out), set on the solution
// and let go, the solution stirred with a rod, the pump started with one finger, the solution drawn into the syringe
// and pushed on to the coaxial nozzle (cutaway: silk in the core, acetone round it, both flowing), the fibre forming
// at the outlet and reaching the blade, the regrip and the pull, the lift, the junction, the fibre up to the nozzle,
// the carry to the tray, the spare cocoon, and a restrained push onto the nozzle's aperture that lands where the
// wrist shooter's outlet is in frame 0.
// Hands: every contact is placed from the hand's own geometry (dc/Hand digitTips): the pinch holds the cocoon
// between the index tip (in front) and the thumb tip (behind); the rod and the nozzle pass through closed fists
// (fingers in front of them); the index tip lands on the pump button.
// Draw order: the wall (soft focus), the lead clipped at the bench top (he stands behind it), the bench and the
// apparatus, his hands again over what they hold, then the fibre, the blade once it is free, the outlet effects.
import React from 'react';
import {DIM, Man, manJoints, ManPose} from './dc/Man';
import {Cam, Layer} from './dc/camera';
import {add, clamp, deg, fmt, lerp, lerpV, mul, norm, P as Pt, perp, sub, V} from './dc/math';
import {Expr, mixExpr} from './dc/Head';
import {digitTips, HandPose, mixHand} from './dc/Hand';
import {INK} from './dc/ink';
import {mix} from './dc/color';
import {BASE, EXPR_FOCUS, EXPR_GRIN, EXPR_LAB, HERO_LAB} from './cast4';
import {BEAKER, BENCH_Y, BLADE_LEN, COCOON_DISH, LT4, PUMP, ROD, SAND, SPARE_COCOON, SYR_ACE, SYR_SILK, TRAY} from './labWorld4';
import {ACETONE, Beaker, beakerInner, beakerLevelY, Bench, Blade, Cocoon, COCOON_LEN, CocoonDish, FrontTray, LabWall, Nozzle, nozFrame, NZ, PulledFibres, Pump, PUMP_BTN, Rod, SandDish, SILK, Tray, Tube} from './LabArt4';
import {grainsAt, labPhys, LabPhys, ss} from './labPhys4';
import {FLUID_BG, FluidField} from './Fluid4';
import {deviceMatch, DV} from './Device4';
import {D_NEAR, heroOutlet, HS, scr, streetCam, zOf} from './Street4';

export const LS = 1.25;
const LH = DIM.hand * LS;
export const HERO_LAB0: ManPose = {...BASE, x: 1300, y: 1470, s: LS, torso: 5, chest: 5, neck: 4, turn: 0.45, rW: 1, rElb: -1, lW: 1, lElb: -1, lWx: 1330, lWy: 1284};
const ss5 = (f: number, a: number, b: number) => {
  const x = clamp((f - a) / (b - a));
  return x * x * x * (x * (x * 6 - 15) + 10);
};
const keyV = (f: number, keys: [number, V][]): V => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) return lerpV(keys[i - 1][1], keys[i][1], ss(f, keys[i - 1][0], keys[i][0]));
  return keys[keys.length - 1][1];
};
const keyN = (f: number, keys: [number, number][]): number => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) return lerp(keys[i - 1][1], keys[i][1], ss(f, keys[i - 1][0], keys[i][0]));
  return keys[keys.length - 1][1];
};
const dirOf = (a: number): V => ({x: Math.cos((a * Math.PI) / 180), y: Math.sin((a * Math.PI) / 180)});
const wrap = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;

// ------------------------------------------------------------------ hand poses (pose library)
const H_REST: HandPose = {curl: [0.24, 0.3, 0.34, 0.38], spread: 0.28, thumb: 20, thumbCurl: 0.35};
const H_PINCH_OPEN: HandPose = {curl: [0.12, 0.6, 0.68, 0.74], spread: 0.2, thumb: 46, thumbCurl: 0.1};
const H_PINCH: HandPose = {curl: [0.2, 0.75, 0.82, 0.86], spread: 0.15, thumb: 30, thumbCurl: 0.4};
const H_ROD_OPEN: HandPose = {curl: [0.3, 0.36, 0.42, 0.48], spread: 0.18, thumb: 40, thumbCurl: 0.25};
const H_ROD: HandPose = {curl: [0.8, 0.84, 0.87, 0.9], spread: 0.08, thumb: 24, thumbCurl: 0.55};
const H_PRESS: HandPose = {curl: [0.06, 0.86, 0.9, 0.92], spread: 0.12, thumb: 24, thumbCurl: 0.55};
const H_NOZ: HandPose = {curl: [0.7, 0.76, 0.8, 0.84], spread: 0.08, thumb: 26, thumbCurl: 0.5};
const H_NOZ_TIGHT: HandPose = {curl: [0.8, 0.85, 0.88, 0.9], spread: 0.06, thumb: 22, thumbCurl: 0.6};

/** a point of a posed hand in hand units (u along the axis, v toward the thumb side) */
const handUV = (pose: HandPose, which: 'index' | 'thumb' | 'pinch'): {u: number; v: number} => {
  const t = digitTips({x: 0, y: 0}, 0, 1, 1, pose);
  const p = which === 'index' ? t.tips[0] : which === 'thumb' ? t.thumb : lerpV(t.tips[0], t.thumb, 0.5);
  return {u: p.x, v: p.y};
};
/** hand-unit point -> world for a hand drawn at `wrist` (the drawn wrist), axis angle `ang`, thumb side ts */
const handToWorld = (wrist: V, ang: number, ts: 1 | -1, u: number, v: number) => {
  const d = dirOf(ang);
  return add(wrist, add(mul(d, u * LH), mul(perp(d), v * LH * ts)));
};

type Side = 'L' | 'R';
/** the pose with one hand placed so that its hand-unit point (gu, gv) lies on `grip` with the hand axis at `ang`:
 *  the wrist target follows from the hand (it is drawn 6 units back along the forearm from the arm's wrist), the
 *  wrist bend from the forearm the IK gives; a few passes settle the forearm direction */
const placeHand = (p: ManPose, side: Side, grip: V, ang: number, gu: number, gv: number): ManPose => {
  const ts = side === 'L' ? 1 : -1;
  const d = dirOf(ang);
  const drawnWrist = sub(sub(grip, mul(d, gu * LH)), mul(perp(d), gv * LH * ts));
  let fd = d;
  let q = p;
  for (let i = 0; i < 4; i++) {
    const W = add(drawnWrist, mul(fd, 6 * p.s));
    q = side === 'L' ? {...p, lWx: W.x, lWy: W.y, lW: 1} : {...p, rWx: W.x, rWy: W.y, rW: 1};
    const j = manJoints(q);
    fd = (side === 'L' ? j.L : j.R).foreDir;
  }
  const wr = wrap(ang - deg(Math.atan2(fd.y, fd.x)));
  return side === 'L' ? {...q, lWr: wr} : {...q, rWr: wr};
};
/** where a hand of a pose is drawn: its wrist point and axis angle */
const drawnHand = (p: ManPose, side: Side) => {
  const j = manJoints(p);
  const A = side === 'L' ? j.L : j.R;
  return {wrist: add(A.W, mul(A.foreDir, -6 * p.s)), ang: A.handAng};
};

// ------------------------------------------------------------------ the nozzle in the far hand
/** the nozzle (tip, rear) at frame f: from the physics until back0, then raised over the spare cocoon and settled
 *  into the opening's aim; its last motion has the wrist shooter's outlet velocity of frames 0-1 (on screen) */
export const END = (() => {
  // V4: position, direction, motion AND scale: the lab needle's outer radius matches the wrist shooter barrel's
  // outlet radius on screen in frame 0
  const c0 = streetCam(0);
  const c1 = streetCam(1);
  const g0 = heroOutlet(0);
  const O0 = scr(c0, D_NEAR, g0.outlet);
  const O1 = scr(c1, D_NEAR, heroOutlet(1).outlet);
  const z = (17 * HS * 0.2 * zOf(c0, D_NEAR)) / NZ.outerR;
  const ang = deg(Math.atan2(g0.dir.y, g0.dir.x));
  const tip: V = {x: 232, y: 1168};
  return {z, O0, tip, ang, vel: mul(sub(O1, O0), 1 / z)};
})();
const NOZ_LEN = (() => {
  const P = labPhys(0);
  return Math.hypot(P.rear.x - P.tip.x, P.rear.y - P.tip.y);
})();
const fromTipAng = (tip: V, a: number) => ({tip, rear: add(tip, mul(dirOf(a), -NOZ_LEN))});
const angOf = (tip: V, rear: V) => deg(Math.atan2(tip.y - rear.y, tip.x - rear.x));
/** V4 end: the nozzle is carried from over the tray to a lowered aim beside the spare cocoon, then swings up about
 *  the hand into the aim (the same easing as the opening forearm's last rotation, time-shifted), so its last frames
 *  carry straight into frame 0's motion; the tip arrives on END.tip with the wrist shooter's direction */
const SWING = 22;
/** exactly the opening's own law (Street4 heroAt: the forearm's last 22 degrees over frames -10..3), time-shifted */
const swingOpen = (g: number) => SWING * (1 - ss(g, -10, 3));
/** the lab nozzle's angle offset from END.ang: the opening's swing time-shifted, zero at the cut (frame 0's own
 *  remaining rotation is already in END.ang), so angle and angular velocity carry across the loop */
const swingAt = (f: number) => swingOpen(f - 952) - swingOpen(0);
const END_REAR = add(END.tip, mul(dirOf(END.ang), -0));
export const nozzleAt = (f: number): {tip: V; rear: V} => {
  const P = labPhys(Math.min(f, LT4.back0));
  if (f <= LT4.back0) return {tip: P.tip, rear: P.rear};
  const a0 = angOf(P.tip, P.rear);
  const rear1 = sub(END.tip, mul(dirOf(END.ang), NOZ_LEN));
  // still travelling as the swing begins (the swing starts from rest, so the two overlap instead of a pause)
  const u = ss(f, LT4.back0 + 18, LT4.swing0 + 7);
  const rear = lerpV(P.rear, rear1, u);
  const ang = a0 + wrap(END.ang + swingAt(LT4.swing0) - a0) * ss(f, LT4.back0, LT4.swing0) + (f > LT4.swing0 ? swingAt(f) - swingAt(LT4.swing0) : 0);
  void END_REAR;
  return {tip: add(rear, mul(dirOf(ang), NOZ_LEN)), rear};
};

const gripNozzle = (p: ManPose, tip: V, rear: V): ManPose => {
  const F = nozFrame(rear, tip);
  // V4: the fist at the very rear (behind the side port), so the glove stays out of the final close view
  const grip = F.at(F.len - 14, 0);
  return placeHand(p, 'R', grip, F.ang + 128, 0.6, 0.02);
};

// ------------------------------------------------------------------ the near hand: cocoon, rod, pump button
const C1: V = {x: COCOON_DISH.x - 14, y: BENCH_Y - 16};
const PINCH_UV = handUV(H_PINCH, 'pinch');
const PINCH_OPEN_UV = handUV(H_PINCH_OPEN, 'pinch');
const PRESS_UV = handUV(H_PRESS, 'index');
const ROD_UV = {u: 0.58, v: 0.02};
/** the pinch hand's axis angle over the cocoon beat (down and a little left; turned toward the light while held) */
const pinchAng = (f: number) => keyN(f, [[LT4.reach0, 160], [LT4.pinch - 4, 116], [LT4.lift1, 112], [LT4.lift1 + 12, 128], [LT4.tease1, 122], [LT4.ccarry1, 108]]);
/** the cocoon's held centre: in the dish, lifted and turned in the light while its fibres separate, carried over the
 *  beaker and set on the liquid */
const LIFTED: V = {x: C1.x - 26, y: C1.y - 74};
const OVER_BEAKER: V = {x: BEAKER.x + 6, y: BENCH_Y - BEAKER.h - 30};
const levelAt = (f: number) => BEAKER.level0 + 0.04 * ss(f, LT4.touchLiquid, LT4.dissolve1) - 0.16 * ss(f, LT4.draw0, LT4.draw1);
const surfaceY = (f: number) => beakerLevelY(levelAt(f));
const heldCocoon = (f: number): V =>
  keyV(f, [
    [LT4.pinch, C1],
    [LT4.lift1, LIFTED],
    [LT4.tease1, add(LIFTED, {x: -10, y: -4})],
    [LT4.ccarry1, OVER_BEAKER],
    [LT4.touchLiquid, {x: OVER_BEAKER.x, y: surfaceY(LT4.touchLiquid) - COCOON_LEN * 0.31 + 3}],
  ]);
const ROD_GRIP_T = 0.2; // grip along the rod, as a fraction of its length from the top
/** the rod: at rest leaning in the beaker; held, its grip point traces a small ellipse (the wrist), the foot a
 *  smaller one the other way (the rod pivots near the liquid) */
const rodAt = (f: number) => {
  const st = ss(f, LT4.stir0, LT4.stir0 + 4) * (1 - ss(f, LT4.stir1 - 4, LT4.stir1));
  const ph = ((f - LT4.stir0) / 12) * Math.PI * 2;
  const e = {x: Math.cos(ph), y: Math.sin(ph)};
  const top = add(ROD.top, {x: 9 * e.x * st, y: 2.5 * e.y * st});
  const foot = add(ROD.foot, {x: -3.5 * e.x * st, y: 0});
  const grip = lerpV(top, foot, ROD_GRIP_T);
  return {top, foot, grip, ang: deg(Math.atan2(foot.y - top.y, foot.x - top.x))};
};

type NearState = {pose: HandPose; place: {grip: V; ang: number; gu: number; gv: number} | null; hold: 'cocoon' | 'rod' | null};
/** V4 path of the near hand before the pinch: it is already moving at the match (from the pump, where it started the
 *  syringe, toward the cocoon dish); it arrives over the dish and descends onto the cocoon */
const REACH: [number, V][] = [
  [LT4.reach0 - 20, {x: 1070, y: 1240}],
  [LT4.reach0 + 34, {x: 1200, y: 1190}],
  [LT4.pinch - 12, {x: C1.x - 6, y: C1.y - 34}],
  [LT4.pinch - 1, C1],
];
const reachPath = (f: number): V => {
  // Catmull-Rom through the keys, so the hand never stops between them
  const k = REACH;
  let i = 1;
  while (i < k.length - 1 && f > k[i][0]) i++;
  const [f1, p1] = k[i - 1];
  const [f2, p2] = k[i];
  const p0 = k[Math.max(0, i - 2)][1];
  const p3 = k[Math.min(k.length - 1, i + 1)][1];
  const t = clamp((f - f1) / (f2 - f1));
  const cr = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
  return {x: cr(p0.x, p1.x, p2.x, p3.x), y: cr(p0.y, p1.y, p2.y, p3.y)};
};
/** the near hand: places it by its contact point at each beat; between beats it travels with the contact point */
const nearState = (f: number): NearState => {
  if (f < LT4.release + 2) {
    // reach (already moving), pre-shape, close on the cocoon, lift, turn it in the light, carry, set it down
    const pre = ss(f, LT4.pinch - 30, LT4.pinch - 8);
    const close = ss(f, LT4.pinch - 4, LT4.pinch);
    const open = ss(f, LT4.release, LT4.release + 2);
    const pose = mixHand(mixHand(mixHand(H_REST, H_PINCH_OPEN, pre), H_PINCH, close), H_PINCH_OPEN, open);
    const uv = {u: lerp(lerp(0.72, PINCH_OPEN_UV.u, pre), PINCH_UV.u, close), v: lerp(lerp(0, PINCH_OPEN_UV.v, pre), PINCH_UV.v, close)};
    const g = f < LT4.pinch ? reachPath(f) : heldCocoon(f);
    return {pose, place: {grip: g, ang: pinchAng(f), gu: uv.u, gv: uv.v}, hold: f >= LT4.pinch - 1 && f < LT4.release + 1 ? 'cocoon' : null};
  }
  const rod = rodAt(f);
  const rodAng = rod.ang + 90; // the hand across the rod, pointing left (the thumb side up)
  if (f < LT4.rodOff + 3) {
    // straight from the release to the rod; close round it; stir; open
    const from = heldCocoon(LT4.touchLiquid);
    const to = ss(f, LT4.release + 1, LT4.rod0 - 1);
    const close = ss(f, LT4.rod0 - 3, LT4.rod0 + 1);
    const open = ss(f, LT4.rodOff - 2, LT4.rodOff + 2);
    const pose = mixHand(mixHand(mixHand(H_PINCH_OPEN, H_ROD_OPEN, ss(f, LT4.release + 1, LT4.withdraw)), H_ROD, close), H_ROD_OPEN, open);
    const mid = add(lerpV(from, rod.grip, 0.5), {x: 10, y: -26});
    const g = to < 0.5 ? lerpV(from, mid, to * 2) : lerpV(mid, rod.grip, (to - 0.5) * 2);
    const gOut = f > LT4.rodOff ? add(rod.grip, {x: 14 * ss(f, LT4.rodOff, LT4.rodOff + 3), y: -6 * ss(f, LT4.rodOff, LT4.rodOff + 3)}) : g;
    const a = lerp(pinchAng(LT4.ccarry1), rodAng, ss(f, LT4.release + 1, LT4.rod0 - 2));
    return {pose, place: {grip: gOut, ang: a, gu: ROD_UV.u, gv: ROD_UV.v}, hold: f >= LT4.rod0 - 1 && f < LT4.rodOff + 1 ? 'rod' : null};
  }
  if (f < LT4.press + 8) {
    // to the pump: the index extends; its tip lands on the button, presses, lifts off
    const btn = {x: PUMP_BTN.x, y: PUMP_BTN.y + 2 * ss(f, LT4.press - 2, LT4.press) * (1 - ss(f, LT4.press + 3, LT4.press + 6))};
    const from = add(rodAt(LT4.rodOff).grip, {x: 14, y: -6});
    const pre = add(btn, {x: 6, y: -24});
    const g = f < LT4.press - 2 ? lerpV(from, pre, ss(f, LT4.rodOff + 2, LT4.press - 3)) : lerpV(pre, btn, ss(f, LT4.press - 3, LT4.press - 1) * (1 - ss(f, LT4.press + 4, LT4.press + 8)));
    const pose = mixHand(H_ROD_OPEN, H_PRESS, ss(f, LT4.rodOff + 2, LT4.press - 4));
    const a = lerp(rodAng, 118, ss(f, LT4.rodOff + 2, LT4.press - 3));
    const uv = {u: lerp(ROD_UV.u, PRESS_UV.u, ss(f, LT4.rodOff + 2, LT4.press - 4)), v: lerp(ROD_UV.v, PRESS_UV.v, ss(f, LT4.rodOff + 2, LT4.press - 4))};
    return {pose, place: {grip: g, ang: a, gu: uv.u, gv: uv.v}, hold: null};
  }
  // then down to his side behind the bench (the camera follows the solution to the nozzle meanwhile)
  return {pose: mixHand(H_PRESS, H_REST, ss(f, LT4.press + 8, LT4.press + 18)), place: null, hold: null};
};

// ------------------------------------------------------------------ the lead
/** his hips: still at the cocoon end until the carry, then a few steps left with the load, and a step back */
const heroX = (f: number) => lerp(1300, 700, ss(f, LT4.carry0 - 4, LT4.carry1 + 2)) + 90 * ss(f, LT4.back0, LT4.push);
export const heroPose = (f: number): ManPose => {
  const x = heroX(f);
  const walk = ss(f, LT4.carry0 - 4, LT4.carry1 + 2);
  const bob = walk > 0 && walk < 1 ? 7 * Math.abs(Math.sin(walk * Math.PI * 3)) : 0;
  let p: ManPose = {...HERO_LAB0, x, y: HERO_LAB0.y - bob, torso: 5 - 3 * ss(f, LT4.pull0, LT4.taut) + 2 * walk * (1 - walk)};
  const nz = nozzleAt(f);
  p = gripNozzle(p, nz.tip, nz.rear);
  const ns = nearState(f);
  if (ns.place) {
    // leaving the rest/side blend: the near hand goes from his side to its place over a few frames
    p = placeHand(p, 'L', ns.place.grip, ns.place.ang, ns.place.gu, ns.place.gv);
  } else {
    // from the button down to his side, behind the bench (the torso target hangs the arm)
    const back = ss(f, LT4.press + 8, LT4.press + 22);
    const q = placeHand(p, 'L', add(PUMP_BTN, {x: 6, y: -24}), 118, PRESS_UV.u, PRESS_UV.v);
    p = {...q, lW: 1 - back, lTu: -330, lTv: -40, lElb: -1, lWr: lerp(q.lWr, 0, back)};
  }
  return p;
};
const nearHandPose = (f: number) => nearState(f).pose;
const farHandPose = (f: number) => mixHand(H_NOZ, H_NOZ_TIGHT, ss(f, LT4.regrip0, LT4.regrip1));

// ------------------------------------------------------------------ the cocoon
type CocState = {c: V; ang: number; op: number; loosen: number; inBeaker: boolean; held: boolean};
/** the pinched cocoon sits between the index tip and the thumb tip, its long axis across that line */
const pinchedCocoon = (f: number) => {
  const p = heroPose(f);
  const h = drawnHand(p, 'L');
  const t = digitTips(h.wrist, h.ang, LH, 1, nearHandPose(f));
  // V4: held by its near end, so most of it shows beyond the fingertips (the axis points away from the palm)
  const mid = lerpV(t.tips[0], t.thumb, 0.5);
  let a = deg(Math.atan2(t.thumb.y - t.tips[0].y, t.thumb.x - t.tips[0].x)) + 90;
  const hd = dirOf(h.ang);
  if (Math.cos(((a - h.ang) * Math.PI) / 180) < 0) a += 180;
  const c = add(mid, mul(dirOf(a), COCOON_LEN * 0.32));
  void hd;
  return {c, ang: a};
};
export const cocoonAt = (f: number): CocState => {
  if (f < LT4.pinch) return {c: C1, ang: -6, op: 1, loosen: 0, inBeaker: false, held: false};
  if (f < LT4.release) {
    const pc = pinchedCocoon(f);
    const settle = ss(f, LT4.pinch, LT4.pinch + 3);
    return {c: lerpV(C1, pc.c, settle), ang: lerp(-6, pc.ang, settle), op: 1, loosen: 0, inBeaker: false, held: true};
  }
  // let go on the surface: it floats, loosens, sinks a little and dissolves into the solution
  const rel = pinchedCocoon(LT4.release - 0.01);
  const surf = surfaceY(f) - COCOON_LEN * 0.31 + 5;
  const sink = 18 * ss(f, LT4.stir0, LT4.stir1);
  const fade = ss(f, LT4.stir0 + 6, LT4.dissolve1);
  return {c: {x: rel.c.x + 6 * ss(f, LT4.release, LT4.stir1), y: lerp(rel.c.y, surf, ss(f, LT4.release, LT4.release + 4)) + sink}, ang: lerp(rel.ang, rel.ang + 30, ss(f, LT4.release, LT4.dissolve1)), op: 1 - fade, loosen: ss(f, LT4.release + 4, LT4.stir1), inBeaker: true, held: false};
};

// ------------------------------------------------------------------ camera
type K = {f: number; c: (f: number) => Cam};
const fixed = (x: number, y: number, z: number) => () => ({x, y, z});
/** V4 match: at DV.end the device's barrel (its liquid band, flowing toward the outlet on the left) is on screen at a
 *  known place and size; the silk syringe's liquid band takes the same place and size, its outlet end where the
 *  barrel's outlet was, and the same fluid mapping continues inside it */
const SYR_LIQ_HALF = SYR_SILK.r - 2.5;
const BRIDGE = deviceMatch();
export const Z_MATCH = BRIDGE.half / SYR_LIQ_HALF;
export const PORT_L: V = {x: SYR_SILK.x0 + 4, y: SYR_SILK.y};
const MATCH_CAM: Cam = {x: PORT_L.x - (BRIDGE.outlet.x - 540) / Z_MATCH, y: PORT_L.y - (BRIDGE.outlet.y - 960) / Z_MATCH, z: Z_MATCH};
const track = (z: number, at: (f: number) => V, sx = 540, sy = 960) => (f: number): Cam => {
  const p = at(f);
  return {x: p.x - (sx - 540) / z, y: p.y - (sy - 960) / z, z};
};
const fibreHead = (f: number) => labPhys(f).fibre.to;
const bladeMid = (f: number) => {
  const P = labPhys(f);
  return lerpV(P.bladeT, P.bladeE, 0.5);
};
const attachPt = (f: number) => labPhys(f).fibre.to;
const gripToBlade = (t: number) => (f: number) => {
  const P = labPhys(f);
  const nz = nozzleAt(f);
  return lerpV(lerpV(nz.rear, nz.tip, 0.25), lerpV(P.bladeT, P.bladeE, 0.5), t);
};
const tipToBlade = (t: number) => (f: number) => {
  const P = labPhys(f);
  return lerpV(P.tip, lerpV(P.bladeT, P.bladeE, 0.5), t);
};
/** the end: the final aperture (END.tip) held at the frame-0 outlet's screen point while the camera pushes in */
const endAnchor = (z: number) => (): Cam => ({x: END.tip.x - (END.O0.x - 540) / z, y: END.tip.y - (END.O0.y - 960) / z, z});
const KEYS: K[] = [
  {f: LT4.match, c: () => MATCH_CAM},
  // reveal through the moving hand and the reservoir (no wide bench shot)
  {f: LT4.reveal1, c: fixed(1150, 1218, 2.8)},
  {f: LT4.pinch, c: fixed(1272, 1248, 4.2)},
  {f: LT4.lift1, c: fixed(1262, 1226, 5.4)},
  // the explanatory view: the fibres separating from the cocoon in the fingers
  {f: 244, c: fixed(1250, 1212, 7.4)},
  {f: LT4.ccarry1, c: fixed(1200, 1216, 4.6)},
  {f: LT4.stir0, c: fixed(1176, 1226, 4.4)},
  {f: LT4.stir1, c: fixed(1166, 1230, 4.8)},
  {f: LT4.press, c: fixed(1100, 1222, 3.5)},
  // the solution is drawn up and pushed on: the camera leaves with it along the tube to the nozzle and arrives with
  // silk already entering the core
  {f: LT4.press + 10, c: fixed(1030, 1206, 3.3)},
  {f: LT4.cut1, c: fixed(700, 1187, 5.6)},
  {f: LT4.ace0, c: fixed(652, 1190, 10)},
  {f: LT4.ace1, c: fixed(640, 1191, 12)},
  {f: LT4.harden0 + 8, c: fixed(618, 1195, 11)},
  {f: LT4.exit + 6, c: fixed(590, 1200, 7.4)},
  // out alongside the new fibre, then the blade it is heading for
  {f: 500, c: track(6.5, fibreHead, 640, 960)},
  {f: 532, c: fixed(486, 1232, 2.6)},
  {f: LT4.fcontact - 6, c: fixed(386, 1252, 6.8)},
  {f: LT4.settle1, c: fixed(392, 1248, 6.6)},
  {f: LT4.pull0 - 2, c: fixed(612, 1176, 2.0)},
  {f: LT4.lift0, c: fixed(540, 1190, 2.5)},
  {f: LT4.out, c: track(3.0, tipToBlade(0.6))},
  // the strength line: close on the junction (the sticky end carrying the blade) as the carry starts; then the
  // whole load path: the hand guiding the nozzle, the single fibre, the blade; then down over the tray
  {f: 726, c: track(5.4, attachPt, 540, 1060)},
  {f: 762, c: track(2.15, gripToBlade(0.5), 560, 960)},
  {f: LT4.carry1, c: track(2.9, tipToBlade(0.62))},
  {f: LT4.flat, c: fixed((TRAY.x0 + TRAY.x1) / 2 + 30, BENCH_Y - 70, 3.3)},
  // along the bench past the source cocoon to the nozzle's outlet, landing on frame 0's outlet
  {f: LT4.cocoon0, c: fixed(170, 1240, 2.5)},
  {f: LT4.push, c: endAnchor(END.z * 0.84)},
  {f: LT4.end + 1, c: endAnchor(END.z)},
];
/** V4: the camera passes through its keys on a Catmull-Rom spline (in x, y and log zoom) instead of easing to a stop
 *  at each one, so a new view arrives while the camera is still travelling; only the match and the very end ease */
const camAt = (k: K, f: number) => {
  const c = k.c(f);
  return {x: c.x, y: c.y, l: Math.log(c.z)};
};
export const labCam4 = (f: number): Cam => {
  if (f <= KEYS[0].f) return KEYS[0].c(f);
  let i = 1;
  while (i < KEYS.length - 1 && f > KEYS[i].f) i++;
  if (f >= KEYS[KEYS.length - 1].f) return KEYS[KEYS.length - 1].c(f);
  const k0 = KEYS[Math.max(0, i - 2)];
  const k1 = KEYS[i - 1];
  const k2 = KEYS[i];
  const k3 = KEYS[Math.min(KEYS.length - 1, i + 1)];
  let t = clamp((f - k1.f) / (k2.f - k1.f));
  // the pull-back from the match starts gently; the last segment is a steady push
  if (i === 1) t = t * t * (3 - 2 * t);
  const P = [camAt(k0, f), camAt(k1, f), camAt(k2, f), camAt(k3, f)];
  // non-uniform Catmull-Rom (tangents scaled by the segment lengths in time)
  const d1 = k2.f - k1.f;
  const m = (a: number, b: number, c: number, ta: number, tb: number) => ((c - a) / Math.max(1, tb - ta)) * d1;
  const h = (p0: number, p1: number, p2: number, p3: number) => {
    const m1 = i - 1 === 0 ? p2 - p1 : m(p0, p1, p2, k0.f, k2.f);
    const m2 = i === KEYS.length - 1 ? p2 - p1 : m(p1, p2, p3, k1.f, k3.f);
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * p1 + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2 + (t3 - t2) * m2;
  };
  return {x: h(P[0].x, P[1].x, P[2].x, P[3].x), y: h(P[0].y, P[1].y, P[2].y, P[3].y), z: Math.exp(h(P[0].l, P[1].l, P[2].l, P[3].l))};
};

// ------------------------------------------------------------------ outlet effects and the fibre
const Fibre: React.FC<{P: LabPhys; f: number; k: number}> = ({P, f, k}) => {
  if (!P.fibre.on) return null;
  const a = P.fibre.from;
  const b = P.fibre.to;
  const mid = add(lerpV(a, b, 0.5), {x: 0, y: P.fibre.sag});
  const d = `M${Pt(a)} Q${Pt(mid)} ${Pt(b)}`;
  const w = 2.2;
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={fmt(w + 1.5 * k)} strokeLinecap="round" />
      <path d={d} fill="none" stroke="#FFFDF6" strokeWidth={fmt(w)} strokeLinecap="round" />
      {f < LT4.fcontact && <circle cx={fmt(b.x)} cy={fmt(b.y)} r={fmt(w * 0.9)} fill="#FFF6DA" stroke={INK} strokeWidth={fmt(0.8 * k)} />}
      {P.contactSquash > 0 && (
        // the sticky end spread on the steel where it attached (it stays: the junction carries the load)
        <ellipse cx={fmt(b.x)} cy={fmt(b.y)} rx={fmt(w * (0.9 + 0.8 * P.contactSquash))} ry={fmt(w * (1.1 - 0.4 * P.contactSquash))} fill="#FFF6DA" stroke={INK} strokeWidth={fmt(0.7 * k)} />
      )}
    </g>
  );
};

/** at the outlet: the silk core leaves inside its acetone sheath; the core turns into a solid white fibre within a
 *  few mm while the sheath thins and drifts off as vapour; the fibre keeps forming while it flies */
const OutletJet: React.FC<{P: LabPhys; f: number}> = ({P, f}) => {
  const a = ss(f, LT4.harden0, LT4.harden0 + 8) * (1 - ss(f, LT4.fcontact - 6, LT4.fcontact + 20));
  if (a <= 0.01) return null;
  const F = nozFrame(P.rear, P.tip);
  const dir = norm(P.fibre.on ? sub(lerpV(P.fibre.from, P.fibre.to, 0.15), P.tip) : mul(F.ax, -1));
  const n = perp(dir);
  const out = clamp((f - LT4.harden0) / 16);
  const L = 22 * out;
  const at = (x: number, y: number) => add(P.tip, add(mul(dir, x), mul(n, y)));
  const sheath = `M${Pt(at(0, -3.4))} Q${Pt(at(L * 0.4, -3.0))} ${Pt(at(L, -0.8))} L${Pt(at(L, 0.8))} Q${Pt(at(L * 0.4, 3.0))} ${Pt(at(0, 3.4))} Z`;
  const coreId = `oj${Math.round(f * 10)}`;
  return (
    <g opacity={a}>
      <defs>
        <linearGradient id={coreId} gradientUnits="userSpaceOnUse" x1={fmt(at(0, 0).x)} y1={fmt(at(0, 0).y)} x2={fmt(at(9, 0).x)} y2={fmt(at(9, 0).y)}>
          <stop offset="0" stopColor={SILK} />
          <stop offset="1" stopColor="#FFFDF6" />
        </linearGradient>
      </defs>
      <path d={sheath} fill={ACETONE} opacity={0.45} />
      <path d={`M${Pt(at(0, 0))} L${Pt(at(Math.max(L, 2), 0))}`} stroke={`url(#${coreId})`} strokeWidth={2.2} strokeLinecap="round" />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const ph = ((f - LT4.harden0) / 16 + i / 6) % 1;
        const x = 3 + ph * 18;
        const y = (i % 2 ? -1 : 1) * (3 + ph * 8);
        const p = at(x, y);
        return <circle key={i} cx={fmt(p.x)} cy={fmt(p.y - ph * 6)} r={fmt(0.5 + ph * 1.3)} fill={ACETONE} opacity={0.5 * (1 - ph)} />;
      })}
    </g>
  );
};

// ------------------------------------------------------------------ the scene
export const LabScene4: React.FC<{f: number}> = ({f}) => {
  const id = `l${Math.round(f * 100)}`;
  const cam = labCam4(f);
  const k = 1 / Math.sqrt(Math.max(1, cam.z));
  const P = labPhys(f);
  const nz = nozzleAt(f);
  P.tip = nz.tip;
  P.rear = nz.rear;
  if (f > LT4.back0) P.fibre = {...P.fibre, from: nz.tip, sag: 24 + 0.1 * Math.hypot(nz.tip.x - P.fibre.to.x, nz.tip.y - P.fibre.to.y)};
  else if (P.fibre.on) P.fibre = {...P.fibre, from: nz.tip};
  const hero = heroPose(f);
  const F = nozFrame(P.rear, P.tip);
  // the tubes: from the syringes down onto the bench, along it, and up to the nozzle's rear and side port; a long
  // free length lets the lead carry the nozzle over the tray
  const rearDrop = F.at(F.len + 26, 30);
  const benchUnder = (x: number) => ({x, y: BENCH_Y - 18});
  const tubeSilk: V[] = [{x: SYR_SILK.x0 - 12, y: SYR_SILK.y}, {x: SYR_SILK.x0 - 30, y: SYR_SILK.y + 40}, benchUnder(Math.min(SYR_SILK.x0 - 60, rearDrop.x + 70)), benchUnder(Math.min(SYR_SILK.x0 - 80, rearDrop.x + 40)), rearDrop, F.at(F.len + 10, 4), F.at(F.len, 0)];
  const portW = F.at(178, 24);
  const portDrop = F.at(172, 56);
  const tubeAce: V[] = [{x: SYR_ACE.x0 - 12, y: SYR_ACE.y}, {x: SYR_ACE.x0 - 46, y: SYR_ACE.y + 70}, benchUnder(Math.min(SYR_ACE.x0 - 70, portDrop.x + 80)), benchUnder(Math.min(SYR_ACE.x0 - 90, portDrop.x + 50)), portDrop, portW, F.at(178, 12)];
  const tubeIn: V[] = [{x: SYR_SILK.x0 - 12, y: SYR_SILK.y + 4}, {x: SYR_SILK.x0 - 4, y: SYR_SILK.y - 60}, {x: 1050, y: 1080}, {x: BEAKER.x - 26, y: BENCH_Y - BEAKER.h - 16}, {x: BEAKER.x - 26, y: BENCH_Y - 26}];

  // the silk syringe at the match: the device barrel's fluid continues in it at the same screen mapping, fading to
  // the plain solution as the camera pulls back
  const fieldOp = ss(cam.z, 3.4, 7.5);
  const FS = BRIDGE.fieldPx / Z_MATCH;
  const map = (x: number, y: number): V => ({x: PORT_L.x - x * FS, y: PORT_L.y - y * FS});
  const silkInside =
    fieldOp > 0.01 ? (
      <g opacity={fieldOp}>
        <rect x={SYR_SILK.x0} y={SYR_SILK.y - SYR_SILK.r} width={SYR_SILK.x1 - SYR_SILK.x0} height={SYR_SILK.r * 2} fill={FLUID_BG} />
        <FluidField map={map} scale={FS} t={f / 30} xView={[-3000, 200]} port={0} pair={0.7} speed={420} />
        <path d={`M${SYR_SILK.x0},${fmt(SYR_SILK.y - 0.55 * SYR_LIQ_HALF)} H${SYR_SILK.x1}`} stroke="#FFFFFF" strokeWidth={fmt(0.22 * SYR_LIQ_HALF)} opacity={0.45} strokeLinecap="round" />
      </g>
    ) : null;

  // the beaker: the cocoon set on the solution; stirring circulates the liquid (moving arcs) while the silk loosens
  // into threads that spread and lose their structure as the solution forms; then it is drawn toward the tube
  const coc = cocoonAt(f);
  const liquid = mix('#F3DFA2', '#EECB6C', ss(f, LT4.stir0, LT4.dissolve1));
  const rod = rodAt(f);
  const bi = beakerInner();
  const ly = beakerLevelY(levelAt(f));
  const circ = ss(f, LT4.stir0, LT4.stir0 + 6) * (1 - ss(f, LT4.stir1 + 4, LT4.dissolve1 + 10));
  const drawOp = ss(f, LT4.draw0 - 2, LT4.draw0 + 3) * (1 - ss(f, LT4.draw1 - 2, LT4.draw1 + 4));
  const bc = {x: (bi.x0 + bi.x1) / 2, y: (ly + bi.y1) / 2};
  const brx = (bi.x1 - bi.x0) * 0.36;
  const bry = (bi.y1 - ly) * 0.3;
  const beakerInside = (
    <g>
      <Rod id={`${id}-rdi`} foot={rod.foot} top={rod.top} r={ROD.r} k={k} op={0.55} />
      {circ > 0.01 &&
        [0, 1, 2].map((i) => {
          // circulating flow: arcs travelling round an ellipse in the liquid
          const ph = (f - LT4.stir0) * 0.42 + i * 2.1;
          const arc = (a0: number, a1: number) => {
            const N = 8;
            return Array.from({length: N + 1}, (_, j) => {
              const a = a0 + ((a1 - a0) * j) / N;
              return add(bc, {x: Math.cos(a) * brx * (1 - 0.18 * i), y: Math.sin(a) * bry * (1 - 0.18 * i)});
            });
          };
          const pts = arc(ph, ph + 1.3);
          return <path key={`c${i}`} d={`M${pts.map(Pt).join(' L')}`} fill="none" stroke="#FBEFC4" strokeWidth={fmt(Math.max(0.8, 1.6 * k))} strokeLinecap="round" opacity={0.75 * circ} />;
        })}
      {drawOp > 0.01 &&
        [0, 1, 2, 3].map((i) => {
          // drawn up: streaks converging on the intake tube's mouth
          const mouth = {x: BEAKER.x - 26, y: BENCH_Y - 26};
          const ph = ((f - LT4.draw0) / 10 + i * 0.25) % 1;
          const from = add(mouth, {x: 18 + i * 9, y: -14 + i * 7});
          const a = lerpV(from, mouth, ph);
          const b = lerpV(from, mouth, Math.min(1, ph + 0.25));
          return <path key={`d${i}`} d={`M${Pt(a)} L${Pt(b)}`} stroke="#FBEFC4" strokeWidth={fmt(Math.max(0.8, 1.4 * k))} strokeLinecap="round" opacity={0.8 * drawOp} />;
        })}
      {coc.inBeaker && coc.op > 0.01 && (
        <g>
          <g opacity={coc.op * (1 - ss(f, LT4.stir0 + 4, LT4.stir1 - 6))}>
            <Cocoon id={`${id}-cb`} c={coc.c} ang={coc.ang} k={k} loosen={coc.loosen} />
          </g>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
            // the silk unwinds into threads that are carried round by the flow, spread and fade into the solution
            const L = 10 + 34 * coc.loosen;
            const a0 = i * 0.7 + (f - LT4.release) * 0.05 + 0.6 * circ * Math.sin(f * 0.2 + i);
            const spread = 1 + 1.6 * ss(f, LT4.stir0, LT4.stir1);
            const p0 = add(coc.c, {x: Math.cos(a0) * 8 * spread, y: Math.sin(a0) * 5 * spread});
            const p1 = add(p0, {x: Math.cos(a0 + 0.6) * L, y: Math.sin(a0 + 0.6) * L * 0.6});
            const p2 = add(p1, {x: Math.cos(a0 + 1.8) * L * 0.6, y: Math.sin(a0 + 1.8) * L * 0.5});
            return <path key={i} d={`M${Pt(p0)} Q${Pt(p1)} ${Pt(p2)}`} fill="none" stroke="#DDB24C" strokeWidth={fmt(Math.max(0.5, 0.9 * k * (1 - 0.5 * ss(f, LT4.stir0, LT4.stir1))))} opacity={coc.loosen * coc.op} />;
          })}
        </g>
      )}
    </g>
  );
  // the pump: the silk syringe fills as the solution is drawn up (draw0..draw1), then is pushed on
  const pumpRun = ss(f, LT4.press, LT4.press + 3);
  const silkPlunger = lerp(0.5, 0.86, ss(f, LT4.draw0, LT4.draw1)) - 0.1 * ss(f, LT4.push0, 560);
  void ly;
  const pump = {silkFill: 1, silkPlunger, aceFill: 1, acePlunger: 0.62 - 0.08 * ss(f, LT4.ace0 - 6, 560), run: pumpRun, press: ss(f, LT4.press - 2, LT4.press) * (1 - ss(f, LT4.press + 4, LT4.press + 7))};
  const free = P.free;
  const grains = grainsAt(f);
  const ex = heroExpr(f);
  const lh = nearHandPose(f);
  const rh = farHandPose(f);
  const ns = nearState(f);
  // what the hands hold, drawn between their rear and front digits
  const nozzleEl = (key: string) => (
    <Nozzle id={`${id}-${key}`} k={k} rear={P.rear} tip={P.tip} cut={ss(f, LT4.cut0, LT4.cut1) * (1 - ss(f, LT4.exit + 26, LT4.exit + 46))} silk={ss(f, LT4.silk0, LT4.silk1)} ace={ss(f, LT4.ace0, LT4.ace1)} core={f / 30} />
  );
  const holdR = {front: [0, 1, 2, 3] as (number | 't')[], obj: nozzleEl('nzh'), palmFront: true};
  const holdL =
    ns.hold === 'cocoon' && !coc.inBeaker
      ? {front: [0] as (number | 't')[], obj: <Cocoon id={`${id}-chh`} c={coc.c} ang={coc.ang} k={k} />}
      : ns.hold === 'rod'
        ? {front: [0, 1, 2, 3] as (number | 't')[], obj: <Rod id={`${id}-rdh`} foot={rod.foot} top={rod.top} r={ROD.r} k={k} />, palmFront: true}
        : undefined;
  // fibres drawn out of the cocoon as it leaves the dish (back to the dish), then, in the close view, its outer silk
  // separating into fine fibres that lift away from the surface and trail as it is carried to the beaker
  const fibreOp = ss(f, LT4.pinch + 2, LT4.pinch + 6) * (1 - ss(f, LT4.lift1, LT4.lift1 + 8));
  const ca = (coc.ang * Math.PI) / 180;
  const cax = {x: Math.cos(ca), y: Math.sin(ca)};
  const cnn = perp(cax);
  const onC = (u: number, v: number) => add(coc.c, add(mul(cax, (u * COCOON_LEN) / 2), mul(cnn, v * COCOON_LEN * 0.3)));
  const pulled =
    coc.held && fibreOp > 0.01
      ? (() => {
          const from = [onC(-0.5, 0.8), onC(0.1, 0.95), onC(0.6, 0.75)];
          const to = [{x: C1.x - 6, y: C1.y - 6}, {x: C1.x + 10, y: C1.y - 8}, {x: C1.x + 28, y: C1.y - 4}];
          return <PulledFibres from={from} to={to} sag={4} k={k} op={fibreOp} />;
        })()
      : null;
  const peel = ss(f, LT4.lift1 - 4, LT4.tease1 - 6);
  const separating =
    (coc.held || (coc.inBeaker && f < LT4.release + 8)) && peel > 0.01
      ? (() => {
          const seeds: [number, number, number][] = [[-0.8, 0.9, -1], [-0.35, 1.0, 1], [0.15, 0.95, -1], [0.6, 0.9, 1], [0.9, 0.4, -1], [-0.9, -0.3, 1], [0.3, -1.0, -1]];
          const lagDir = norm(sub(heldCocoon(Math.max(LT4.pinch, f - 3)), coc.c));
          return (
            <g opacity={1 - ss(f, LT4.release, LT4.release + 8)}>
              {seeds.map(([u, v, sg], i) => {
                const a = onC(u, v);
                const out = norm(add(mul(cnn, v), mul(cax, u * 0.6)));
                const L = COCOON_LEN * (0.6 + 0.7 * ((i * 37) % 10) / 10) * peel;
                const wav = Math.sin(f * 0.35 + i * 1.7) * 3 * peel;
                const m = add(add(a, mul(out, L * 0.55)), mul(perp(out), sg * (5 + wav)));
                const e = add(add(add(a, mul(out, L)), mul(perp(out), sg * wav)), mul(lagDir, 6 * peel));
                const d = `M${Pt(a)} Q${Pt(m)} ${Pt(e)}`;
                return (
                  <g key={i}>
                    <path d={d} fill="none" stroke="#7E6C48" strokeWidth={1.5} opacity={0.55} strokeLinecap="round" />
                    <path d={d} fill="none" stroke="#FFF8E6" strokeWidth={0.85} strokeLinecap="round" />
                  </g>
                );
              })}
            </g>
          );
        })()
      : null;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <defs>
        <filter id={`${id}-wb`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={fmt(3 / Math.max(1, 1 + (cam.z - 1) / 2.2))} />
        </filter>
        <clipPath id={`${id}-above`}>
          <path d={`M-6000,-6000 H6000 V${BENCH_Y - 12} H-6000 Z`} />
        </clipPath>
      </defs>
      <Layer cam={cam} depth={2.2}>
        <g filter={`url(#${id}-wb)`}>
          <LabWall id={`${id}-wl`} />
        </g>
      </Layer>
      <Layer cam={cam} depth={1}>
        <Tube id={`${id}-ta`} pts={tubeAce} r={2.6} k={k} liquid={ACETONE} front={0.55 + 0.45 * ss(f, LT4.ace0 - 14, LT4.ace0)} far />
        <Tube id={`${id}-ts`} pts={tubeSilk} r={2.8} k={k} liquid={SILK} front={0.4 + 0.6 * ss(f, LT4.push0, LT4.silk0)} />
        <g clipPath={`url(#${id}-above)`}>
          <Man id={`${id}-hr`} pose={hero} expr={ex} lHand={lh} rHand={rh} outfit={HERO_LAB} inkK={0.9} />
        </g>
        <Bench id={`${id}-bn`} k={k} />
        <Tray id={`${id}-tr`} k={k} />
        <Cocoon id={`${id}-sc`} c={SPARE_COCOON} ang={-8} k={k} />
        <SandDish id={`${id}-sb`} k={k} back />
        {!free && <Blade id={`${id}-bl`} k={k} T={P.bladeT} E={P.bladeE} len={BLADE_LEN} />}
        <SandDish id={`${id}-sf`} k={k} />
        {grains.map((g, i) => (
          <circle key={i} cx={fmt(g.p.x)} cy={fmt(g.p.y)} r={fmt(g.r)} fill={g.c} stroke={INK} strokeWidth={fmt(0.3 * k)} />
        ))}
        {f < LT4.pinch && <Cocoon id={`${id}-c1`} c={C1} ang={-6} k={k} />}
        <Cocoon id={`${id}-c2`} c={{x: COCOON_DISH.x + 24, y: BENCH_Y - 15}} ang={8} k={k} />
        <CocoonDish id={`${id}-cd`} k={k} />
        {ns.hold !== 'rod' && <Rod id={`${id}-rd`} foot={rod.foot} top={rod.top} r={ROD.r} k={k} />}
        {ns.hold === 'rod' && <Rod id={`${id}-rd`} foot={rod.foot} top={rod.grip} r={ROD.r} k={k} />}
        <Beaker id={`${id}-bk`} k={k} level={levelAt(f)} liquid={liquid} inside={beakerInside} />
        <Pump id={`${id}-pm`} k={k} {...pump} silkInside={silkInside} />
        <Tube id={`${id}-ti`} pts={tubeIn} r={2.6} k={k} liquid={SILK} front={ss(f, LT4.draw0 - 2, LT4.draw1 - 4)} />
        {nozzleEl('nz')}
        {coc.held && !holdL && <Cocoon id={`${id}-c1m`} c={coc.c} ang={coc.ang} k={k} />}
        {pulled}
        {separating}
        <g clipPath={`url(#${id}-above)`}>
          <Man id={`${id}-hh`} pose={hero} expr={ex} lHand={lh} rHand={rh} outfit={HERO_LAB} inkK={0.9} handsOnly holdL={holdL} holdR={holdR} />
        </g>
        <OutletJet P={P} f={f} />
        <Fibre P={P} f={f} k={k} />
        {free && <Blade id={`${id}-blf`} k={k} T={P.bladeT} E={P.bladeE} len={BLADE_LEN} />}
        {f >= LT4.touch && <FrontTray id={`${id}-tf`} k={k} />}
      </Layer>
    </svg>
  );
};

const heroExpr = (f: number): Expr => mixExpr(mixExpr(EXPR_LAB, EXPR_GRIN, ss(f, LT4.flat, LT4.cocoon0 + 10)), EXPR_FOCUS, ss(f, LT4.push + 10, LT4.end - 10));
export {PUMP, SAND, TRAY, COCOON_DISH, beakerInner};

/** screen points that captions must keep clear of (tools/v3 caption check) */
export const labPoints = (f: number) => {
  const cam = labCam4(f);
  const toS = (p: V) => ({x: 540 + (p.x - cam.x) * cam.z, y: 960 + (p.y - cam.y) * cam.z});
  const P = labPhys(f);
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
  if (f >= LT4.cut0 && f < LT4.exit + 46) out.push({...toS(lerpV(nz.tip, nz.rear, 0.25)), r: r(70), what: 'nozzle channels'});
  if (P.fibre.on) out.push({...toS(P.fibre.to), r: Math.max(60, r(10)), what: 'fibre end'});
  if (f >= LT4.exit - 10) out.push({...toS(lerpV(P.bladeT, P.bladeE, 0.5)), r: Math.max(80, r(50)), what: 'blade'});
  const coc = cocoonAt(f);
  if (f >= LT4.reach0 && f < LT4.dissolve1) out.push({...toS(coc.c), r: Math.max(60, r(30)), what: 'cocoon'});
  return out;
};
