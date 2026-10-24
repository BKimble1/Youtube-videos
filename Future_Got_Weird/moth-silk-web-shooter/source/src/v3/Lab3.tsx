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
import {BASE, EXPR_FOCUS, EXPR_GRIN, EXPR_LAB, HERO_LAB} from './cast3';
import {BEAKER, BENCH_Y, BLADE_LEN, COCOON_DISH, LT3, PUMP, ROD, SAND, SPARE_COCOON, SYR_ACE, SYR_SILK, TRAY} from './labWorld3';
import {ACETONE, Beaker, beakerInner, beakerLevelY, Bench, Blade, Cocoon, COCOON_LEN, CocoonDish, FrontTray, LabWall, Nozzle, nozFrame, PulledFibres, Pump, PUMP_BTN, Rod, SandDish, SILK, Tray, Tube} from './LabArt3';
import {grainsAt, labPhys, LabPhys, ss} from './labPhys3';
import {FLUID_BG, FluidField} from './Fluid3';
import {deviceView, DV, portPoint} from './Device3';
import {D_NEAR, scr} from './Street3';

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
  const z = 5;
  const O0 = {x: 389.1, y: 1069.3};
  const O1 = {x: 383.5, y: 1078.8};
  const ang0 = 177.9; // the wrist shooter's aim in frame 0 (direction the outlet points)
  const tip: V = {x: 226, y: 1194};
  return {z, O0, tip, ang: ang0, vel: mul(sub(O1, O0), 1 / z)};
})();
const NOZ_LEN = (() => {
  const P = labPhys(0);
  return Math.hypot(P.rear.x - P.tip.x, P.rear.y - P.tip.y);
})();
const fromTipAng = (tip: V, a: number) => ({tip, rear: add(tip, mul(dirOf(a), -NOZ_LEN))});
const angOf = (tip: V, rear: V) => deg(Math.atan2(tip.y - rear.y, tip.x - rear.x));
export const nozzleAt = (f: number): {tip: V; rear: V} => {
  const P = labPhys(Math.min(f, LT3.back0));
  if (f <= LT3.back0) return {tip: P.tip, rear: P.rear};
  const a0 = angOf(P.tip, P.rear);
  // raised from over the tray to over the spare cocoon (back0 .. push), then the aim's last approach
  const T = 22;
  const tau = 952 - f;
  const R = tau < T ? tau - (tau * tau) / (2 * T) : T / 2;
  const settled = sub(END.tip, mul(END.vel, T / 2));
  const u = ss5(f, LT3.back0, LT3.push + 10);
  const tip0 = lerpV(P.tip, settled, u);
  const tip = tau < T ? sub(END.tip, mul(END.vel, R)) : tip0;
  return fromTipAng(tip, lerp(a0, END.ang, u));
};

const gripNozzle = (p: ManPose, tip: V, rear: V): ManPose => {
  const F = nozFrame(rear, tip);
  const grip = F.at(F.len - 28, 0);
  return placeHand(p, 'R', grip, F.ang + 128, 0.6, 0.02);
};

// ------------------------------------------------------------------ the near hand: cocoon, rod, pump button
const C1: V = {x: COCOON_DISH.x - 14, y: BENCH_Y - 16};
const PINCH_UV = handUV(H_PINCH, 'pinch');
const PINCH_OPEN_UV = handUV(H_PINCH_OPEN, 'pinch');
const PRESS_UV = handUV(H_PRESS, 'index');
const ROD_UV = {u: 0.58, v: 0.02};
/** the pinch hand's axis angle over the cocoon beat (down and a little left; turned toward the light while held) */
const pinchAng = (f: number) => keyN(f, [[LT3.reach0, 150], [LT3.pinch - 4, 116], [LT3.lift1, 112], [LT3.lift1 + 10, 124], [LT3.tease1, 120], [LT3.ccarry1, 108]]);
/** the cocoon's held centre: in the dish, lifted, turned, carried over the beaker and set on the liquid */
const LIFTED: V = {x: C1.x - 22, y: C1.y - 70};
const OVER_BEAKER: V = {x: BEAKER.x + 6, y: BENCH_Y - BEAKER.h - 30};
const levelAt = (f: number) => BEAKER.level0 + 0.04 * ss(f, LT3.touchLiquid, LT3.dissolve1) - 0.16 * ss(f, LT3.draw0, LT3.draw1);
const surfaceY = (f: number) => beakerLevelY(levelAt(f));
const heldCocoon = (f: number): V =>
  keyV(f, [
    [LT3.pinch, C1],
    [LT3.lift1, LIFTED],
    [LT3.tease1, add(LIFTED, {x: 4, y: -6})],
    [LT3.ccarry1, OVER_BEAKER],
    [LT3.touchLiquid, {x: OVER_BEAKER.x, y: surfaceY(LT3.touchLiquid) - COCOON_LEN * 0.31 + 3}],
  ]);
const ROD_GRIP_T = 0.2; // grip along the rod, as a fraction of its length from the top
/** the rod: at rest leaning in the beaker; held, its grip point traces a small ellipse (the wrist), the foot a
 *  smaller one the other way (the rod pivots near the liquid) */
const rodAt = (f: number) => {
  const st = ss(f, LT3.stir0, LT3.stir0 + 4) * (1 - ss(f, LT3.stir1 - 4, LT3.stir1));
  const ph = ((f - LT3.stir0) / 12) * Math.PI * 2;
  const e = {x: Math.cos(ph), y: Math.sin(ph)};
  const top = add(ROD.top, {x: 9 * e.x * st, y: 2.5 * e.y * st});
  const foot = add(ROD.foot, {x: -3.5 * e.x * st, y: 0});
  const grip = lerpV(top, foot, ROD_GRIP_T);
  return {top, foot, grip, ang: deg(Math.atan2(foot.y - top.y, foot.x - top.x))};
};

type NearState = {pose: HandPose; place: {grip: V; ang: number; gu: number; gv: number} | null; hold: 'cocoon' | 'rod' | null};
/** the near hand: places it by its contact point at each beat; between beats it travels with the contact point */
const nearState = (f: number): NearState => {
  // rest on the bench beside the beaker while the reveal plays
  const rest = {grip: {x: 1392, y: BENCH_Y - 14}, ang: 160, gu: 0.72, gv: 0};
  if (f < LT3.reach0) return {pose: H_REST, place: rest, hold: null};
  if (f < LT3.release + 2) {
    // reach: the pinch point travels to the cocoon while the hand pre-shapes; closes on it; lifts, turns, carries
    const pre = ss(f, LT3.reach0, LT3.pinch - 6);
    const close = ss(f, LT3.pinch - 4, LT3.pinch);
    const open = ss(f, LT3.release, LT3.release + 2);
    const pose = mixHand(mixHand(mixHand(H_REST, H_PINCH_OPEN, pre), H_PINCH, close), H_PINCH_OPEN, open);
    const uv = {u: lerp(PINCH_OPEN_UV.u, PINCH_UV.u, close), v: lerp(PINCH_OPEN_UV.v, PINCH_UV.v, close)};
    const target = f < LT3.pinch ? lerpV(add(rest.grip, {x: -40, y: -10}), C1, ss(f, LT3.reach0, LT3.pinch - 2)) : heldCocoon(f);
    const g = f < LT3.reach0 + 4 ? lerpV(rest.grip, target, ss(f, LT3.reach0, LT3.reach0 + 4)) : target;
    return {pose, place: {grip: g, ang: pinchAng(f), gu: uv.u, gv: uv.v}, hold: f >= LT3.pinch - 1 && f < LT3.release + 1 ? 'cocoon' : null};
  }
  const rod = rodAt(f);
  const rodAng = rod.ang + 90; // the hand across the rod, pointing left (the thumb side up)
  if (f < LT3.rodOff + 3) {
    // withdraw up and right, to the rod; close round it; stir; open
    const away = add(heldCocoon(LT3.touchLiquid), {x: 30, y: -40});
    const to = ss(f, LT3.withdraw - 4, LT3.rod0 - 1);
    const close = ss(f, LT3.rod0 - 3, LT3.rod0 + 2);
    const open = ss(f, LT3.rodOff - 2, LT3.rodOff + 2);
    const pose = mixHand(mixHand(mixHand(H_PINCH_OPEN, H_ROD_OPEN, ss(f, LT3.release + 2, LT3.withdraw)), H_ROD, close), H_ROD_OPEN, open);
    const g = f < LT3.withdraw ? lerpV(heldCocoon(LT3.touchLiquid), away, ss(f, LT3.release, LT3.withdraw)) : lerpV(away, rod.grip, to);
    const gOut = f > LT3.rodOff ? add(rod.grip, {x: 14 * ss(f, LT3.rodOff, LT3.rodOff + 3), y: -6 * ss(f, LT3.rodOff, LT3.rodOff + 3)}) : g;
    const a = f < LT3.withdraw ? pinchAng(LT3.ccarry1) : lerp(pinchAng(LT3.ccarry1), rodAng, ss(f, LT3.withdraw, LT3.rod0));
    return {pose, place: {grip: gOut, ang: a, gu: ROD_UV.u, gv: ROD_UV.v}, hold: f >= LT3.rod0 - 1 && f < LT3.rodOff + 1 ? 'rod' : null};
  }
  if (f < LT3.press + 14) {
    // to the pump: the index extends; its tip lands on the button, presses, lifts off
    const btn = {x: PUMP_BTN.x, y: PUMP_BTN.y + 2 * ss(f, LT3.press - 2, LT3.press) * (1 - ss(f, LT3.press + 4, LT3.press + 7))};
    const from = add(rodAt(LT3.rodOff).grip, {x: 14, y: -6});
    const pre = add(btn, {x: 6, y: -24});
    const g = f < LT3.press - 2 ? lerpV(from, pre, ss(f, LT3.rodOff + 3, LT3.press - 4)) : f < LT3.press + 6 ? lerpV(pre, btn, ss(f, LT3.press - 4, LT3.press - 1) * (1 - ss(f, LT3.press + 5, LT3.press + 8))) : lerpV(pre, add(pre, {x: 40, y: -10}), ss(f, LT3.press + 8, LT3.press + 14));
    const pose = mixHand(H_ROD_OPEN, H_PRESS, ss(f, LT3.rodOff + 2, LT3.press - 5));
    const a = lerp(rodAng, 118, ss(f, LT3.rodOff + 2, LT3.press - 4));
    const uv = {u: lerp(ROD_UV.u, PRESS_UV.u, ss(f, LT3.rodOff + 2, LT3.press - 5)), v: lerp(ROD_UV.v, PRESS_UV.v, ss(f, LT3.rodOff + 2, LT3.press - 5))};
    return {pose, place: {grip: g, ang: a, gu: uv.u, gv: uv.v}, hold: null};
  }
  // then down to rest on the bench beyond the cocoon dish; before he walks, to his side (hidden by the bench)
  const pre = add(PUMP_BTN, {x: 46, y: -34});
  const rest2 = {x: 1392, y: BENCH_Y - 14};
  const u = ss(f, LT3.press + 14, LT3.press + 40);
  const g = lerpV(lerpV(pre, add(rest2, {x: -20, y: -60}), clamp(u * 1.4)), rest2, ss(f, LT3.press + 30, LT3.press + 40));
  return {pose: mixHand(H_PRESS, H_REST, ss(f, LT3.press + 14, LT3.press + 24)), place: f < LT3.carry0 - 16 ? {grip: g, ang: lerp(118, 160, u), gu: lerp(PRESS_UV.u, 0.72, u), gv: lerp(PRESS_UV.v, 0, u)} : null, hold: null};
};

// ------------------------------------------------------------------ the lead
/** his hips: still at the cocoon end until the carry, then a few steps left with the load, and a step back */
const heroX = (f: number) => lerp(1300, 700, ss(f, LT3.carry0 - 4, LT3.carry1 + 2)) + 90 * ss(f, LT3.back0, LT3.push);
export const heroPose = (f: number): ManPose => {
  const x = heroX(f);
  const walk = ss(f, LT3.carry0 - 4, LT3.carry1 + 2);
  const bob = walk > 0 && walk < 1 ? 7 * Math.abs(Math.sin(walk * Math.PI * 3)) : 0;
  let p: ManPose = {...HERO_LAB0, x, y: HERO_LAB0.y - bob, torso: 5 - 3 * ss(f, LT3.pull0, LT3.taut) + 2 * walk * (1 - walk)};
  const nz = nozzleAt(f);
  p = gripNozzle(p, nz.tip, nz.rear);
  const ns = nearState(f);
  if (ns.place) {
    // leaving the rest/side blend: the near hand goes from his side to its place over a few frames
    p = placeHand(p, 'L', ns.place.grip, ns.place.ang, ns.place.gu, ns.place.gv);
  } else {
    const back = ss(f, LT3.carry0 - 16, LT3.carry0 - 2);
    const q = placeHand(p, 'L', {x: 1392, y: BENCH_Y - 14}, 160, 0.72, 0);
    p = {...q, lW: 1 - back, lTu: 170, lTv: -30, lElb: -1, lWr: lerp(q.lWr, 0, back)};
  }
  return p;
};
const nearHandPose = (f: number) => nearState(f).pose;
const farHandPose = (f: number) => mixHand(H_NOZ, H_NOZ_TIGHT, ss(f, LT3.regrip0, LT3.regrip1));

// ------------------------------------------------------------------ the cocoon
type CocState = {c: V; ang: number; op: number; loosen: number; inBeaker: boolean; held: boolean};
/** the pinched cocoon sits between the index tip and the thumb tip, its long axis across that line */
const pinchedCocoon = (f: number) => {
  const p = heroPose(f);
  const h = drawnHand(p, 'L');
  const t = digitTips(h.wrist, h.ang, LH, 1, nearHandPose(f));
  const c = lerpV(t.tips[0], t.thumb, 0.5);
  const a = deg(Math.atan2(t.thumb.y - t.tips[0].y, t.thumb.x - t.tips[0].x)) + 90;
  return {c, ang: a};
};
export const cocoonAt = (f: number): CocState => {
  if (f < LT3.pinch) return {c: C1, ang: -6, op: 1, loosen: 0, inBeaker: false, held: false};
  if (f < LT3.release) {
    const pc = pinchedCocoon(f);
    const settle = ss(f, LT3.pinch, LT3.pinch + 3);
    return {c: lerpV(C1, pc.c, settle), ang: lerp(-6, pc.ang, settle), op: 1, loosen: 0, inBeaker: false, held: true};
  }
  // let go on the surface: it floats, loosens, sinks a little and dissolves into the solution
  const rel = pinchedCocoon(LT3.release - 0.01);
  const surf = surfaceY(f) - COCOON_LEN * 0.31 + 5;
  const sink = 18 * ss(f, LT3.stir0, LT3.stir1);
  const fade = ss(f, LT3.stir0 + 6, LT3.dissolve1);
  return {c: {x: rel.c.x + 6 * ss(f, LT3.release, LT3.stir1), y: lerp(rel.c.y, surf, ss(f, LT3.release, LT3.release + 4)) + sink}, ang: lerp(rel.ang, rel.ang + 30, ss(f, LT3.release, LT3.dissolve1)), op: 1 - fade, loosen: ss(f, LT3.release + 4, LT3.stir1), inBeaker: true, held: false};
};

// ------------------------------------------------------------------ camera
type K = {f: number; c: (f: number) => Cam};
const fixed = (x: number, y: number, z: number) => () => ({x, y, z});
/** the match: the bridge's last frame has the cartridge window filling the height, its port near the left edge and
 *  the flow toward screen-left; the syringe's liquid region takes the same place and size (Z_MATCH), its end wall where
 *  the window's end was, and the bridge's port position becomes PORT_L, the origin of the same fluid mapping */
const SYR_LIQ_HALF = SYR_SILK.r - 2.5;
const BRIDGE = (() => {
  const v = deviceView(DV.end);
  return {port: scr(v.cam, D_NEAR, portPoint(v.win)), half: v.win.b * v.zn, endGap: v.win.b * 0.42 * v.zn};
})();
export const Z_MATCH = BRIDGE.half / SYR_LIQ_HALF;
export const PORT_L: V = {x: SYR_SILK.x0 + 4 + BRIDGE.endGap / Z_MATCH, y: SYR_SILK.y};
const MATCH_CAM: Cam = {x: PORT_L.x - (BRIDGE.port.x - 540) / Z_MATCH, y: PORT_L.y - (BRIDGE.port.y - 960) / Z_MATCH, z: Z_MATCH};
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
const tipToBlade = (t: number) => (f: number) => {
  const P = labPhys(f);
  return lerpV(P.tip, lerpV(P.bladeT, P.bladeE, 0.5), t);
};
/** the end: the final aperture (END.tip) held at the frame-0 outlet's screen point while the camera pushes in */
const endAnchor = (z: number) => (): Cam => ({x: END.tip.x - (END.O0.x - 540) / z, y: END.tip.y - (END.O0.y - 960) / z, z});
const KEYS: K[] = [
  {f: LT3.match, c: () => MATCH_CAM},
  {f: LT3.reveal1, c: fixed(1128, 1160, 1.9)},
  {f: LT3.pinch - 4, c: fixed(1270, 1240, 3.4)},
  {f: LT3.lift1, c: fixed(1262, 1228, 4.2)},
  {f: LT3.tease1, c: fixed(1258, 1214, 5.6)},
  {f: LT3.touchLiquid, c: fixed(1196, 1214, 4.2)},
  {f: LT3.stir0, c: fixed(1186, 1206, 3.9)},
  {f: LT3.rodOff, c: fixed(1170, 1206, 3.7)},
  {f: LT3.press + 2, c: fixed(1090, 1214, 3.3)},
  {f: LT3.draw1, c: fixed(1000, 1196, 2.9)},
  {f: LT3.cut1, c: fixed(700, 1187, 6)},
  {f: LT3.ace0, c: fixed(650, 1190, 11)},
  {f: LT3.ace1, c: fixed(640, 1191, 12.5)},
  {f: LT3.harden0 + 8, c: fixed(618, 1195, 11.5)},
  {f: LT3.exit + 6, c: fixed(610, 1197, 10.5)},
  {f: 500, c: track(6.5, fibreHead, 640, 960)},
  {f: 532, c: fixed(486, 1232, 2.6)},
  {f: LT3.fcontact - 6, c: fixed(386, 1252, 6.8)},
  {f: LT3.settle1, c: fixed(390, 1250, 7.2)},
  {f: LT3.pull0 - 2, c: fixed(612, 1176, 2.0)},
  {f: LT3.lift0, c: fixed(540, 1190, 2.5)},
  {f: LT3.out, c: track(3.0, tipToBlade(0.6))},
  {f: LT3.out + 20, c: track(7.0, attachPt, 540, 900)},
  {f: LT3.junction1, c: track(8.5, attachPt, 540, 880)},
  {f: LT3.upFibre1, c: track(5.0, tipToBlade(0.2), 540, 1090)},
  {f: LT3.carry1, c: track(2.4, tipToBlade(0.55))},
  {f: LT3.flat, c: fixed((TRAY.x0 + TRAY.x1) / 2 + 40, BENCH_Y - 60, 3.3)},
  {f: LT3.cocoon0 + 6, c: fixed(120, 1230, 3.3)},
  {f: LT3.push, c: endAnchor(4.0)},
  {f: LT3.end + 1, c: endAnchor(END.z)},
];
const lerpCam = (a: Cam, b: Cam, u: number): Cam => {
  const z = Math.exp(lerp(Math.log(a.z), Math.log(b.z), u));
  // keep the motion natural across big zoom changes: the centre moves with 1/z
  const w = Math.abs(1 / b.z - 1 / a.z) > 1e-4 ? (1 / z - 1 / a.z) / (1 / b.z - 1 / a.z) : u;
  return {x: lerp(a.x, b.x, w), y: lerp(a.y, b.y, w), z};
};
const ease = (x: number) => {
  const t = clamp(x);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
export const labCam3 = (f: number): Cam => {
  if (f <= KEYS[0].f) return KEYS[0].c(f);
  for (let i = 1; i < KEYS.length; i++) {
    if (f <= KEYS[i].f) {
      const u = (f - KEYS[i - 1].f) / (KEYS[i].f - KEYS[i - 1].f);
      // the end push is linear in log-zoom (a steady, restrained push), every other move eases
      return lerpCam(KEYS[i - 1].c(f), KEYS[i].c(f), KEYS[i].f > LT3.push ? clamp(u) : ease(u));
    }
  }
  return KEYS[KEYS.length - 1].c(f);
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
      {f < LT3.fcontact && <circle cx={fmt(b.x)} cy={fmt(b.y)} r={fmt(w * 0.9)} fill="#FFF6DA" stroke={INK} strokeWidth={fmt(0.8 * k)} />}
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
  const a = ss(f, LT3.harden0, LT3.harden0 + 8) * (1 - ss(f, LT3.fcontact - 6, LT3.fcontact + 20));
  if (a <= 0.01) return null;
  const F = nozFrame(P.rear, P.tip);
  const dir = norm(P.fibre.on ? sub(lerpV(P.fibre.from, P.fibre.to, 0.15), P.tip) : mul(F.ax, -1));
  const n = perp(dir);
  const out = clamp((f - LT3.harden0) / 16);
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
        const ph = ((f - LT3.harden0) / 16 + i / 6) % 1;
        const x = 3 + ph * 18;
        const y = (i % 2 ? -1 : 1) * (3 + ph * 8);
        const p = at(x, y);
        return <circle key={i} cx={fmt(p.x)} cy={fmt(p.y - ph * 6)} r={fmt(0.5 + ph * 1.3)} fill={ACETONE} opacity={0.5 * (1 - ph)} />;
      })}
    </g>
  );
};

// ------------------------------------------------------------------ the scene
export const LabScene3: React.FC<{f: number}> = ({f}) => {
  const id = `l${Math.round(f * 100)}`;
  const cam = labCam3(f);
  const k = 1 / Math.sqrt(Math.max(1, cam.z));
  const P = labPhys(f);
  const nz = nozzleAt(f);
  P.tip = nz.tip;
  P.rear = nz.rear;
  if (f > LT3.back0) P.fibre = {...P.fibre, from: nz.tip, sag: 24 + 0.1 * Math.hypot(nz.tip.x - P.fibre.to.x, nz.tip.y - P.fibre.to.y)};
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

  // the silk syringe at the match: the bridge's fluid field continues in it at the same screen mapping, the
  // cartridge port's disc in the same place, fading as the camera pulls back to the plain solution
  const fieldOp = clamp((Math.log(cam.z) - Math.log(7)) / (Math.log(22) - Math.log(7)));
  const map = (x: number, y: number): V => ({x: PORT_L.x - x / Z_MATCH, y: PORT_L.y - y / Z_MATCH});
  const half = (Math.hypot(540, 960) / cam.z) * Z_MATCH;
  const silkInside =
    fieldOp > 0.01 ? (
      <g opacity={fieldOp}>
        <rect x={SYR_SILK.x0} y={SYR_SILK.y - SYR_SILK.r} width={SYR_SILK.x1 - SYR_SILK.x0} height={SYR_SILK.r * 2} fill={FLUID_BG} />
        <FluidField map={map} scale={1 / Z_MATCH} t={f / 30} xView={[-2 * half, half]} port={0} />
        <circle cx={fmt(PORT_L.x)} cy={fmt(PORT_L.y)} r={fmt(0.2 * SYR_LIQ_HALF)} fill="#5C4520" opacity={clamp((cam.z - 20) / 30)} />
        <path d={`M${SYR_SILK.x0},${fmt(SYR_SILK.y - 0.55 * SYR_LIQ_HALF)} H${SYR_SILK.x1}`} stroke="#FFFFFF" strokeWidth={fmt(0.22 * SYR_LIQ_HALF)} opacity={0.45} strokeLinecap="round" />
      </g>
    ) : null;

  // the beaker: the cocoon set on the solution, its loosening silk spreading into it
  const coc = cocoonAt(f);
  const liquid = mix('#F3DFA2', '#EECB6C', ss(f, LT3.stir0, LT3.dissolve1));
  const rod = rodAt(f);
  const beakerInside = (
    <g>
      <Rod id={`${id}-rdi`} foot={rod.foot} top={rod.top} r={ROD.r} k={k} op={0.55} />
      {coc.inBeaker && coc.op > 0.01 && (
        <g opacity={coc.op}>
          <Cocoon id={`${id}-cb`} c={coc.c} ang={coc.ang} k={k} loosen={coc.loosen} />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => {
            const L = 8 + 30 * coc.loosen;
            const a0 = i * 0.9 + f * 0.04;
            const p0 = add(coc.c, {x: Math.cos(a0) * 9, y: Math.sin(a0) * 6});
            const p1 = add(p0, {x: Math.cos(a0 + 0.6) * L, y: Math.sin(a0 + 0.6) * L * 0.6});
            const p2 = add(p1, {x: Math.cos(a0 + 1.8) * L * 0.6, y: Math.sin(a0 + 1.8) * L * 0.5});
            return <path key={i} d={`M${Pt(p0)} Q${Pt(p1)} ${Pt(p2)}`} fill="none" stroke="#DDB24C" strokeWidth={fmt(Math.max(0.5, 0.9 * k))} opacity={coc.loosen * (1 - ss(f, LT3.stir1 - 6, LT3.dissolve1 + 4))} />;
          })}
        </g>
      )}
    </g>
  );
  // the pump: the silk syringe fills as the solution is drawn up (draw0..draw1), then is pushed on
  const pumpRun = ss(f, LT3.press, LT3.press + 3);
  const silkPlunger = lerp(0.5, 0.86, ss(f, LT3.draw0, LT3.draw1)) - 0.1 * ss(f, LT3.push0, 560);
  const pump = {silkFill: 1, silkPlunger, aceFill: 1, acePlunger: 0.62 - 0.08 * ss(f, LT3.ace0 - 6, 560), run: pumpRun, press: ss(f, LT3.press - 2, LT3.press) * (1 - ss(f, LT3.press + 4, LT3.press + 7))};
  const free = P.free;
  const grains = grainsAt(f);
  const ex = heroExpr(f);
  const lh = nearHandPose(f);
  const rh = farHandPose(f);
  const ns = nearState(f);
  // what the hands hold, drawn between their rear and front digits
  const nozzleEl = (key: string) => (
    <Nozzle id={`${id}-${key}`} k={k} rear={P.rear} tip={P.tip} cut={ss(f, LT3.cut0, LT3.cut1) * (1 - ss(f, LT3.exit + 26, LT3.exit + 46))} silk={ss(f, LT3.silk0, LT3.silk1)} ace={ss(f, LT3.ace0, LT3.ace1)} core={f / 30} />
  );
  const holdR = {front: [0, 1, 2, 3] as (number | 't')[], obj: nozzleEl('nzh'), palmFront: true};
  const holdL =
    ns.hold === 'cocoon' && !coc.inBeaker
      ? {front: [0] as (number | 't')[], obj: <Cocoon id={`${id}-chh`} c={coc.c} ang={coc.ang} k={k} />}
      : ns.hold === 'rod'
        ? {front: [0, 1, 2, 3] as (number | 't')[], obj: <Rod id={`${id}-rdh`} foot={rod.foot} top={rod.top} r={ROD.r} k={k} />, palmFront: true}
        : undefined;
  // fibres drawn out of the cocoon as it leaves the dish: from its surface back to the second cocoon and the dish
  const fibreOp = ss(f, LT3.pinch + 2, LT3.pinch + 6) * (1 - ss(f, LT3.tease1 - 4, LT3.tease1 + 6));
  const pulled =
    coc.held && fibreOp > 0.01
      ? (() => {
          const ca = (coc.ang * Math.PI) / 180;
          const ax = {x: Math.cos(ca), y: Math.sin(ca)};
          const nn = perp(ax);
          const on = (u: number, v: number) => add(coc.c, add(mul(ax, (u * COCOON_LEN) / 2), mul(nn, v * COCOON_LEN * 0.3)));
          const from = [on(-0.5, 0.8), on(0.1, 0.95), on(0.6, 0.75)];
          const lift = Math.max(0, C1.y - coc.c.y);
          const to = [{x: C1.x - 6, y: C1.y - 6}, {x: C1.x + 10, y: C1.y - 8}, {x: C1.x + 28, y: C1.y - 4}].map((q, i) => add(q, {x: 0, y: -Math.max(0, 6 - lift * 0.1) * i}));
          return <PulledFibres from={from} to={to} sag={4} k={k} op={fibreOp} />;
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
        <Tube id={`${id}-ta`} pts={tubeAce} r={2.6} k={k} liquid={ACETONE} front={0.55 + 0.45 * ss(f, LT3.ace0 - 14, LT3.ace0)} far />
        <Tube id={`${id}-ts`} pts={tubeSilk} r={2.8} k={k} liquid={SILK} front={0.4 + 0.6 * ss(f, LT3.push0, LT3.silk0)} />
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
        {f < LT3.pinch && <Cocoon id={`${id}-c1`} c={C1} ang={-6} k={k} />}
        <Cocoon id={`${id}-c2`} c={{x: COCOON_DISH.x + 24, y: BENCH_Y - 15}} ang={8} k={k} />
        <CocoonDish id={`${id}-cd`} k={k} />
        {ns.hold !== 'rod' && <Rod id={`${id}-rd`} foot={rod.foot} top={rod.top} r={ROD.r} k={k} />}
        {ns.hold === 'rod' && <Rod id={`${id}-rd`} foot={rod.foot} top={rod.grip} r={ROD.r} k={k} />}
        <Beaker id={`${id}-bk`} k={k} level={levelAt(f)} liquid={liquid} inside={beakerInside} />
        <Pump id={`${id}-pm`} k={k} {...pump} silkInside={silkInside} />
        <Tube id={`${id}-ti`} pts={tubeIn} r={2.6} k={k} liquid={SILK} front={ss(f, LT3.draw0 - 2, LT3.draw1 - 4)} />
        {nozzleEl('nz')}
        {coc.held && !holdL && <Cocoon id={`${id}-c1m`} c={coc.c} ang={coc.ang} k={k} />}
        {pulled}
        <g clipPath={`url(#${id}-above)`}>
          <Man id={`${id}-hh`} pose={hero} expr={ex} lHand={lh} rHand={rh} outfit={HERO_LAB} inkK={0.9} handsOnly holdL={holdL} holdR={holdR} />
        </g>
        <OutletJet P={P} f={f} />
        <Fibre P={P} f={f} k={k} />
        {free && <Blade id={`${id}-blf`} k={k} T={P.bladeT} E={P.bladeE} len={BLADE_LEN} />}
        {f >= LT3.touch && <FrontTray id={`${id}-tf`} k={k} />}
      </Layer>
    </svg>
  );
};

const heroExpr = (f: number): Expr => mixExpr(mixExpr(EXPR_LAB, EXPR_GRIN, ss(f, LT3.flat, LT3.cocoon0 + 10)), EXPR_FOCUS, ss(f, LT3.push + 10, LT3.end - 10));
export {PUMP, SAND, TRAY, COCOON_DISH, beakerInner};

/** screen points that captions must keep clear of (tools/v3 caption check) */
export const labPoints = (f: number) => {
  const cam = labCam3(f);
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
  if (f >= LT3.cut0 && f < LT3.exit + 46) out.push({...toS(lerpV(nz.tip, nz.rear, 0.25)), r: r(70), what: 'nozzle channels'});
  if (P.fibre.on) out.push({...toS(P.fibre.to), r: Math.max(60, r(10)), what: 'fibre end'});
  if (f >= LT3.exit - 10) out.push({...toS(lerpV(P.bladeT, P.bladeE, 0.5)), r: Math.max(80, r(50)), what: 'blade'});
  const coc = cocoonAt(f);
  if (f >= LT3.reach0 && f < LT3.dissolve1) out.push({...toS(coc.c), r: Math.max(60, r(30)), what: 'cocoon'});
  return out;
};
