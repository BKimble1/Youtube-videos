// Shot A (0 - 5.3 s): the imagined superhero opening. Already mid-chase at frame 0: the runner (stolen bag swinging)
// rounds the corner out of a side street and cuts right along the pavement; she is right behind him, pivoting and
// bringing the imagined wrist device up. She fires (on "liquid"); time slows while the jet crosses the gap and the
// camera travels alongside it as the liquid head thins into a single strand; it sticks to the back of his jacket,
// the slack straightens, and the tension checks him: a short tug and a recovery step, nothing more. The camera ends
// low and close on the taut strand at the jacket, on the diagonal the lab fiber picks up in the next shot.
//
// World: metres, ground y = 0, the main street runs along X; the camera looks toward -Z, so +X is screen right.
import React from 'react';
import {BODY_P, BODY_R, INK, PERSON, RUNNER, CREW_C} from '../rig/cast';
import {Arm4, Crew4, Face4, joints4, Pose4} from '../rig/Crew';
import {add3, basis, B, Cam, cardOf, cardToWorld, len3, lerp3, mul3, norm3, proj, sub3, U, V3, v3, worldToCard} from '../rig/geo';
import {FACES, mix} from '../rig/poses';
import {footAt, Plant} from '../rig/steps';
import {integrate, makePath, pathPlants} from '../rig/path';
import {Air, boxFaces, depthOf, haze, lerpCam, lookAt, Planes, Poly} from '../rig/draw';
import {clamp, f1, keyS, lerp, mixHex, settle, ss, ss5} from '../lib';

export const STREET_END = 5.3;
const RAD = Math.PI / 180;

// ------------------------------------------------------------------ time: the slow-motion while the jet flies
export const SLOW = {a0: 1.42, a1: 1.8, b0: 3.15, b1: 3.7, rate: 0.16};
const rate = (t: number) => 1 - (1 - SLOW.rate) * ss(t, SLOW.a0, SLOW.a1) * (1 - ss(t, SLOW.b0, SLOW.b1));
export const tauOf = integrate(rate, 0, 8, 0);
export const T = {eject: 1.3, hit: 3.35, taut: 4.12, step: 4.42, still: 4.75};
const TAU = {eject: tauOf(T.eject), hit: tauOf(T.hit), taut: tauOf(T.taut)};

// ------------------------------------------------------------------ the runner
const RPATH = makePath([{x: 0.05, z: 1.5}, {x: 0.06, z: -3.7}, {x: 0.22, z: -5.45}, {x: 0.9, z: -6.15}, {x: 2.5, z: -6.25}, {x: 16, z: -6.25}]);
const RV = 2.2;
const rSpeed = (tau: number) => RV * (1 - ss(tau, TAU.taut, TAU.taut + 0.42));
const rDist = integrate(rSpeed, -1, 9, 6.85);
const R_TS = 0.165, R_PH = 0.03;
const rPl = pathPlants({path: RPATH, dAt: rDist, vAt: rSpeed, t0: -1, t1: 9, ts: R_TS, phase: R_PH, contact: 0.1, half: 0.09, lead: 0.13});
// after the check: the recovery step lands a little ahead and the trailing foot comes up beside it
const lastR = (p: Plant[]) => p[p.length - 1];
{
  const a = lastR(rPl.L), b = lastR(rPl.R);
  const first = a.t0 > b.t0 ? b : a, last = a.t0 > b.t0 ? a : b;
  last.t1 = 99;
  const d = rDist(9), p = RPATH.at(d), tn = RPATH.tan(d);
  const s = last === a ? -1 : 1; // the other foot
  (last === a ? rPl.R : rPl.L).push({t0: last.t0 + 0.2, t1: 99, x: p.x + s * 0.11 * tn.z - tn.x * 0.12, z: p.z - s * 0.11 * tn.x - tn.z * 0.12});
  first.t1 = Math.min(first.t1, last.t0 + 0.06);
}
const rStance = (pl: Plant[], side: number): Plant[] => {
  const p = RPATH.at(rDist(-1)), tn = RPATH.tan(rDist(-1));
  return [{t0: -99, t1: (pl[0]?.t0 ?? 0) - 0.12, x: p.x + side * 0.09 * tn.z, z: p.z - side * 0.09 * tn.x}, ...pl];
};
const R_PLANTS = {L: rStance(rPl.L, 1), R: rStance(rPl.R, -1)};

// ------------------------------------------------------------------ the protagonist
const PPATH = makePath([{x: 0, z: 8}, {x: 0, z: 0}, {x: 0.04, z: -1.6}, {x: 0.12, z: -2.6}, {x: 0.22, z: -3.6}]);
const PV = 2.9, P_BRAKE = [0.42, 0.98];
const pSpeed = (tau: number) => PV * (1 - ss(tau, P_BRAKE[0], P_BRAKE[1]));
const pDist = integrate(pSpeed, -1, 9, 9.55);
const P_STOP = PPATH.at(pDist(9));
const pPl = pathPlants({path: PPATH, dAt: pDist, vAt: pSpeed, t0: -1, t1: 0.9, ts: 0.16, phase: 0.06, contact: 0.1, half: 0.09, lead: 0.05, firstLeft: false});
// the brace, facing the aim: left foot forward toward him, right foot back
const AIM_H = 100; // her heading once she has pivoted (deg; 180 = -Z, down the street; 90 = +X)
const fwdOf = (h: number) => v3(Math.sin(h * RAD), 0, Math.cos(h * RAD));
const leftOf = (h: number) => v3(Math.cos(h * RAD), 0, -Math.sin(h * RAD));
const brace = (side: number) => {
  const f = fwdOf(AIM_H), l = leftOf(AIM_H);
  const p = add3(add3(v3(P_STOP.x, 0, P_STOP.z), mul3(f, side > 0 ? 0.2 : -0.16)), mul3(l, side > 0 ? 0.1 : -0.12));
  return {x: p.x, z: p.z};
};
const pStance = (pl: Plant[], side: number, tLand: number): Plant[] => {
  const p = PPATH.at(pDist(-1)), tn = PPATH.tan(pDist(-1));
  const out: Plant[] = [{t0: -99, t1: (pl[0]?.t0 ?? 0) - 0.12, x: p.x + side * 0.1 * tn.z, z: p.z - side * 0.1 * tn.x}, ...pl];
  out[out.length - 1].t1 = Math.min(out[out.length - 1].t1, tLand - 0.2);
  out.push({t0: tLand, t1: 99, ...brace(side)});
  return out;
};
const P_PLANTS = {L: pStance(pPl.L, 1, 0.96), R: pStance(pPl.R, -1, 1.08)};

// ------------------------------------------------------------------ helpers
type Char = {g: V3; h: number; pose: Pose4};
const lookBlend = (a: number, b: number, u: number) => {
  let d = b - a;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return a + d * u;
};
const localFeet = (g: V3, h: number, pl: {L: Plant[]; R: Plant[]}, tau: number) => {
  const fl = footAt(pl.L, tau), fr = footAt(pl.R, tau);
  const loc = (f: {x: number; y: number; z: number}) => {
    const p = worldToCard(g, h, v3(f.x, 0, f.z));
    return v3(p.x, 14 + f.y * U, p.z);
  };
  return {footL: loc(fl), footR: loc(fr), toeL: fl.toe, toeR: fr.toe};
};
/** the runner's back, between the shoulder blades (card-local), where the strand sticks */
const BACK_LOCAL = (j: ReturnType<typeof joints4>) => add3(add3(j.P, mul3(j.u, BODY_R.spine * 0.66)), mul3(j.Fc, -BODY_R.torsoD * 1.02));

// ------------------------------------------------------------------ runner state
export const runnerAt = (t: number): Char & {back: V3; bagSwing: number} => {
  const tau = tauOf(t);
  const d = rDist(tau), p = RPATH.at(d);
  const g = v3(p.x, 0, p.z);
  const h = RPATH.heading(d);
  const v = rSpeed(tau);
  const run = Math.min(1, v / 1.2);
  const ph = (2 * Math.PI * (tau - R_PH)) / R_TS;
  const sw = Math.sin(ph / 2);
  const tug = ss(tau, TAU.taut - 0.02, TAU.taut + 0.12) * (1 - 0.6 * ss(tau, TAU.taut + 0.3, TAU.taut + 0.7));
  const turnLean = (RPATH.heading(d + 0.1) - RPATH.heading(d - 0.1)) * 0.5;
  const bob = -12 * run - 6 * run * Math.cos(ph - 0.6);
  // he glances back over his right shoulder as he rounds the corner, and again once the strand checks him
  const look0 = 1 - ss(tau, 0.22, 0.42);
  const look1 = ss(tau, TAU.taut + 0.18, TAU.taut + 0.4);
  const look = Math.max(look0, look1);
  const face: Face4 = mix(mix(FACES.run, {...FACES.alarm, open: 0.5}, look0), {...FACES.uhoh, sweat: 0.6, brow: 1, open: 0.45}, Math.max(tug, look1));
  const a = Math.min(1, v / 2.5);
  // left arm swings with the run; right fist holds the bag strap, swinging less
  let armL: Arm4 = {hand: v3(BODY_R.shW + 10, 200 + 24 * a * Math.max(0, -sw), 14 - 70 * a * sw), shape: 'fist', pole: v3(0.3, -0.6, -0.8)};
  let armR: Arm4 = {hand: v3(-BODY_R.shW - 12, 170 + 14 * a * Math.max(0, sw), 18 + 36 * a * sw), shape: 'grip', pole: v3(-0.3, -0.6, -0.8)};
  // the check: arms fly forward and out for balance
  armL = {...armL, hand: mix(armL.hand, v3(BODY_R.shW + 36, 300, 96), tug), shape: tug > 0.5 ? 'open' : 'fist', splay: 1};
  armR = {...armR, hand: mix(armR.hand, v3(-BODY_R.shW - 34, 285, 92), tug * 0.8)};
  const feet = localFeet(g, h, R_PLANTS, tau);
  const pose: Pose4 = {
    pel: v3(0, BODY_R.hipY + bob * (1 - tug) - 6 * tug, -10 * tug), hipYaw: 0, pitch: 4 + 13 * (v / 3) - 24 * tug + 6 * ss(tau, TAU.taut + 0.4, TAU.taut + 0.8),
    roll: -turnLean * 0.6, twist: -24 * look + 7 * run * sw, hy: -56 * look, hp: -6 * look - 8 * tug, hr: 5 * look,
    ...feet, armL, armR, face, sway: 0,
  };
  const j = joints4(BODY_R, pose);
  return {g, h, pose, back: cardToWorld(g, h, BACK_LOCAL(j)), bagSwing: bagSwing(tau)};
};
/** the bag's swing (deg, + = forward along his run): a damped pendulum driven by his deceleration */
const bagSwing = (tau: number) => {
  const dt = 1 / 120, N = 150;
  let th = 0, w = 0;
  for (let i = N; i >= 0; i--) {
    const tt = tau - i * dt;
    const acc = (rSpeed(tt + 0.01) - rSpeed(tt - 0.01)) / 0.02;
    const ph = (2 * Math.PI * (tt - R_PH)) / R_TS;
    const arm = -3.2 * Math.cos(ph / 2) * Math.min(1, rSpeed(tt) / 2.5); // the hand's own swing
    const alpha = -(9.8 / 0.28) * Math.sin(th) - ((acc + arm) / 0.28) * Math.cos(th) - 4.5 * w;
    w += alpha * dt;
    th += w * dt;
  }
  return Math.max(-50, Math.min(60, th / RAD));
};

// ------------------------------------------------------------------ protagonist state
export const herAt = (t: number): Char & {nozzle: V3; aimDir: V3} => {
  const tau = tauOf(t);
  const d = pDist(tau), p = PPATH.at(d);
  const g = v3(p.x, 0, p.z);
  const v = pSpeed(tau);
  const run = Math.min(1, v / 1.2);
  const pivot = ss(tau, 0.38, 0.92);
  const h = lookBlend(PPATH.heading(d), AIM_H, pivot);
  const ph = (2 * Math.PI * (tau - 0.06)) / 0.16;
  const sw = Math.sin(ph / 2);
  const bob = -16 * run - 6 * run * Math.cos(ph - 0.6);
  // aim: the device points at his back (with a little lead), then follows the strand
  const rn = runnerAt(t);
  const tgt = t < T.hit ? runnerAt(Math.max(t, T.hit - 0.4)).back : rn.back;
  const pull = ss(t, T.taut - 0.04, T.taut + 0.14) * (1 - 0.7 * ss(t, T.taut + 0.35, T.taut + 0.8));
  const lean = ss(tau, P_BRAKE[0], P_BRAKE[1]);
  const pose0: Pose4 = {
    pel: v3(0, BODY_P.hipY + bob - 16 * lean, -8 * lean - 14 * pull), hipYaw: 0, pitch: 4 + 12 * (v / 3) - 8 * lean * (1 - 0.3 * lean) - 6 * pull, roll: 0,
    twist: -10 * pivot, hy: 6 * pivot, hp: -6 * pivot, hr: 0,
    footL: v3(0, 0, 0), footR: v3(0, 0, 0), toeL: 0, toeR: 0,
    armL: {hand: v3(BODY_P.shW + 8, 205 + 26 * run * Math.max(0, -sw), 16 - 70 * run * sw), shape: 'fist', pole: v3(0.3, -0.6, -0.8)},
    armR: {hand: v3(-BODY_P.shW - 8, 205 + 26 * run * Math.max(0, sw), 16 + 70 * run * sw), shape: 'fist', pole: v3(-0.3, -0.6, -0.8)},
    face: mix(FACES.run, {...FACES.focus, brow: -0.5, browIn: -0.7, lid: 0.25, mw: 11}, pivot),
  };
  Object.assign(pose0, localFeet(g, h, P_PLANTS, tau));
  // right arm to the aim: shoulder toward the target, nearly straight; the left fist braces at her chest
  const j0 = joints4(BODY_P, pose0);
  const tl = worldToCard(g, h, tgt);
  const dir = norm3(sub3(tl, j0.SR));
  const reach = (BODY_P.upper + BODY_P.fore) * (0.93 - 0.06 * pull);
  const aimHand = add3(j0.SR, mul3(dir, reach));
  const raise = 0.4 + 0.6 * ss(tau, -0.15, 0.9); // already coming up at frame 0
  pose0.armR = {hand: mix(pose0.armR.hand, aimHand, raise), shape: 'fist', pole: mix(v3(-0.3, -0.6, -0.8), v3(-0.7, -0.7, 0.1), raise)};
  pose0.armL = {hand: mix(pose0.armL.hand, add3(j0.S, v3(-6, -34, 52)), raise), shape: 'fist', pole: v3(0.8, -0.5, -0.3)};
  // the head turns to sight along the arm
  const hd = norm3(sub3(tl, j0.Hc));
  pose0.hy = lookBlend(0, (Math.atan2(hd.x, hd.z) * 180) / Math.PI, raise) * 0.9 - 10 * pivot;
  pose0.hp = -((Math.asin(hd.y) * 180) / Math.PI) * raise * 0.6;
  const j = joints4(BODY_P, pose0);
  const fdir = norm3(sub3(j.WR, j.ER));
  const noz = add3(j.WR, mul3(fdir, 31));
  return {g, h, pose: pose0, nozzle: cardToWorld(g, h, noz), aimDir: norm3(sub3(cardToWorld(g, h, noz), cardToWorld(g, h, j.WR)))};
};

// ------------------------------------------------------------------ props in the hand frame
/** the imagined wrist device: a saffron gauntlet with a teal capsule; a slim barrel runs under the palm to a
 *  nozzle just past the knuckles (hand-local units: wrist at the origin, the forearm along -y) */
const Device: React.FC<{ol: number; glow: number}> = ({ol, glow}) => (
  <g>
    <rect x={-5} y={-12} width={10} height={44} rx={5} fill="#9AA7AE" stroke={INK} strokeWidth={ol} />
    <circle cx={0} cy={31} r={6.5} fill="#5D6B73" stroke={INK} strokeWidth={ol} />
    <circle cx={0} cy={31} r={2.8} fill={glow > 0 ? mixHex('#F3E3B0', '#FFFFFF', glow) : '#2B2B33'} />
    <rect x={-21} y={-58} width={42} height={46} rx={11} fill={CREW_C.saffron} stroke={INK} strokeWidth={ol} />
    <rect x={-21} y={-30} width={42} height={7} fill={CREW_C.saffronDeep} />
    <rect x={-12} y={-52} width={24} height={17} rx={7} fill={CREW_C.teal} stroke={INK} strokeWidth={ol * 0.8} />
    <rect x={-7} y={-49} width={6} height={7} rx={3} fill="#BDF2EC" opacity={0.85} />
    <rect x={-21} y={-58} width={42} height={46} rx={11} fill="none" stroke={INK} strokeWidth={ol} />
  </g>
);
const Bag: React.FC<{ol: number; swing: number; rot: number}> = ({ol, swing, rot}) => (
  <g transform={`rotate(${f1(-rot + swing)})`}>
    <path d="M -9 4 Q 0 -6 9 4 L 9 26 L -9 26 Z" fill="none" stroke={INK} strokeWidth={5 + ol * 2} strokeLinejoin="round" />
    <path d="M -9 4 Q 0 -6 9 4 L 9 26 L -9 26 Z" fill="none" stroke="#7A4A2E" strokeWidth={5} strokeLinejoin="round" />
    <path d="M -30 24 L 30 24 L 36 78 Q 0 88 -36 78 Z" fill={CREW_C.coral} stroke={INK} strokeWidth={ol} strokeLinejoin="round" />
    <path d="M -31 32 L 31 32 L 26 50 L -26 50 Z" fill={CREW_C.coralDeep} stroke={INK} strokeWidth={ol * 0.8} strokeLinejoin="round" />
    <circle cx={0} cy={47} r={5} fill={CREW_C.saffron} stroke={INK} strokeWidth={ol * 0.7} />
  </g>
);

// ------------------------------------------------------------------ set
const AIR: Air = {col: '#3A5872', near: 5, far: 34};
const C = {
  walk: '#8E9AA0', walkLine: '#76848B', curb: '#B9C2C5', road: '#3D4A57', roadLine: '#E7C55A',
  brickA: '#A0574A', brickB: '#B86A52', stone: '#C9B79A', teal: '#2F6F78', tealD: '#245860', win: '#FFD683', winDim: '#5C7A8C',
  awnA: CREW_C.saffron, awnB: '#FFF4D6', door: '#2E3F5C', frame: '#E8DCC2', lamp: '#2B3A44', lampGlow: '#FFE2A0',
};
const quad = (a: V3, b: V3, c: V3, d: V3, fill: string, key?: string, extra: Partial<Poly> = {}): Poly => ({pts: [a, b, c, d], fill, key, ...extra});
const facadeZ = (x0: number, x1: number, y0: number, y1: number, z: number, fill: string, key: string, extra: Partial<Poly> = {}) => quad(v3(x0, y0, z), v3(x1, y0, z), v3(x1, y1, z), v3(x0, y1, z), fill, key, extra);
const facadeX = (x: number, z0: number, z1: number, y0: number, y1: number, fill: string, key: string, extra: Partial<Poly> = {}) => quad(v3(x, y0, z0), v3(x, y0, z1), v3(x, y1, z1), v3(x, y1, z0), fill, key, extra);

// The street she runs down (pavement along Z, the left block's shopfronts at x = XL), the road on the right, and
// the cross street at the end (along X, in front of the far block at z = ZF) where he turns right.
const XL = -1.6, XK = 1.45, ZC = -5.2, ZF = -7.45, XR = 6.2;
const setPolys = (b: B): Poly[] => {
  const P: Poly[] = [];
  const E = 0.006;
  // ground
  P.push(quad(v3(XL, 0, ZC), v3(XK, 0, ZC), v3(XK, 0, 16), v3(XL, 0, 16), C.walk, 'walk', {stroke: false, layer: 0}));
  P.push(quad(v3(XK, 0.001, ZC), v3(XK + 0.15, 0.001, ZC), v3(XK + 0.15, 0.001, 16), v3(XK, 0.001, 16), C.curb, 'kerb', {layer: 0}));
  P.push(quad(v3(XK + 0.15, 0, ZC), v3(XR, 0, ZC), v3(XR, 0, 16), v3(XK + 0.15, 0, 16), C.road, 'road', {stroke: false, layer: 0}));
  P.push(quad(v3(-30, 0, ZF), v3(40, 0, ZF), v3(40, 0, ZC), v3(-30, 0, ZC), '#98A3A8', 'cross', {stroke: false, layer: 0}));
  // the left block: shopfronts along the pavement
  P.push(facadeX(XL, ZC, 16, 0, 7, C.brickA, 'lf', {n: v3(1, 0, 0)}));
  P.push(facadeX(XL + E, ZC, 16, 2.7, 3.0, C.stone, 'lband', {layer: 2, n: v3(1, 0, 0)}));
  for (let i = 0; i < 6; i++) {
    const z0 = ZC + 0.5 + i * 3.1;
    P.push(facadeX(XL + E, z0, z0 + 1.9, 0.35, 2.3, '#2C4656', `lw${i}`, {layer: 2, n: v3(1, 0, 0)}));
    P.push(facadeX(XL + 2 * E, z0 + 0.12, z0 + 1.78, 0.5, 2.15, i % 2 ? C.win : C.winDim, `lw2${i}`, {layer: 2.5, n: v3(1, 0, 0), op: 0.9}));
    P.push(facadeX(XL + E, z0 + 2.15, z0 + 2.75, 0, 2.2, C.door, `ld${i}`, {layer: 2, n: v3(1, 0, 0)}));
    for (let k = 0; k < 2; k++) P.push(facadeX(XL + E, z0 + 0.3 + k * 1.4, z0 + 1.0 + k * 1.4, 3.6, 4.8, (i + k) % 3 ? C.win : C.winDim, `lu${i}${k}`, {layer: 2, n: v3(1, 0, 0)}));
  }
  P.push(facadeZ(-30, XL, 0, 7, ZC, '#8B4B40', 'lc', {n: v3(0, 0, -1)}));
  // the block across the road, with its face along the cross street
  P.push(facadeX(XR, ZC, 16, 0, 8, C.teal, 'rf', {n: v3(-1, 0, 0)}));
  P.push(facadeZ(XR, 40, 0, 8, ZC, C.tealD, 'rc', {n: v3(0, 0, -1)}));
  for (let i = 0; i < 12; i++) for (let k = 0; k < 3; k++) P.push(facadeZ(XR + 0.6 + i * 2.2, XR + 1.5 + i * 2.2, 1.2 + k * 2.1, 2.4 + k * 2.1, ZC - E, (i + k) % 2 ? C.winDim : C.win, `rc${i}${k}`, {layer: 2, n: v3(0, 0, -1)}));
  for (let i = 0; i < 6; i++) for (let k = 0; k < 3; k++) P.push(facadeX(XR - E, ZC + 0.6 + i * 2.4, ZC + 1.6 + i * 2.4, 1.2 + k * 2.1, 2.4 + k * 2.1, (i + k) % 2 ? C.win : C.winDim, `rw${i}${k}`, {layer: 2, n: v3(-1, 0, 0)}));
  // the far block along the cross street: a café with a striped awning where he runs, shop windows, upper floors
  P.push(facadeZ(-30, 40, 0, 9, ZF, '#5F7F8F', 'far', {layer: 0.5}));
  P.push(facadeZ(-30, 40, 2.8, 3.05, ZF + E, C.stone, 'fband', {layer: 2}));
  const shop = (x0: number, x1: number, lit: boolean, k: string) => {
    P.push(facadeZ(x0, x1, 0.4, 2.3, ZF + E, '#2C4656', `${k}a`, {layer: 2}));
    P.push(facadeZ(x0 + 0.15, x1 - 0.15, 0.55, 2.15, ZF + 2 * E, lit ? C.win : C.winDim, `${k}b`, {layer: 2.5, op: lit ? 0.88 : 1}));
  };
  shop(-6.0, -3.4, false, 's0'); shop(-2.6, -0.4, true, 's1'); shop(2.0, 4.6, true, 's2'); shop(6.4, 9.0, false, 's3'); shop(10.4, 13.0, true, 's4');
  P.push(facadeZ(0.2, 0.8, 0, 2.3, ZF + E, C.door, 'fd0', {layer: 2}));
  P.push(facadeZ(5.0, 5.6, 0, 2.3, ZF + E, C.door, 'fd1', {layer: 2}));
  P.push(...boxFaces(b, 10.36, 10.44, 0, 4.2, ZF + 0.31, ZF + 0.39, {front: C.lamp, side: '#22303A', top: C.lamp}, 'lamp').map((q) => ({...q, layer: 3})));
  P.push(...boxFaces(b, 9.9, 10.44, 4.12, 4.22, ZF + 0.31, ZF + 0.39, {front: C.lamp, side: '#22303A', top: C.lamp}, 'lampa').map((q) => ({...q, layer: 3})));
  P.push(...boxFaces(b, 9.86, 10.06, 3.98, 4.12, ZF + 0.27, ZF + 0.43, {front: C.lampGlow, side: '#E8C67A', top: C.lamp}, 'lamph').map((q) => ({...q, layer: 3})));
  for (let k = 0; k < 2; k++) for (let i = 0; i < 16; i++) P.push(facadeZ(-6 + i * 1.4, -5.25 + i * 1.4, 3.6 + k * 1.8, 4.8 + k * 1.8, ZF + E, (i * 2 + k) % 3 ? C.win : C.winDim, `fu${i}${k}`, {layer: 2}));
  for (let i = 0; i < 8; i++) {
    const x0 = 1.9 + i * 0.35, x1 = x0 + 0.35;
    P.push(quad(v3(x0, 2.75, ZF + 0.02), v3(x1, 2.75, ZF + 0.02), v3(x1, 2.42, ZF + 0.9), v3(x0, 2.42, ZF + 0.9), i % 2 ? C.awnB : C.awnA, `aw${i}`, {stroke: false, layer: 3}));
  }
  P.push(quad(v3(1.9, 2.42, ZF + 0.9), v3(4.7, 2.42, ZF + 0.9), v3(4.7, 2.3, ZF + 0.9), v3(1.9, 2.3, ZF + 0.9), C.awnA, 'awf', {layer: 3}));
  return P;
};
const setLines = (b: B, air: Air) => {
  const L: React.ReactNode[] = [];
  const seg = (k: string, a: V3, c: V3, col: string, w = 1) => {
    const pa = proj(b, a), pc = proj(b, c);
    if (pa.z < 0.05 || pc.z < 0.05) return;
    const dd = (pa.z + pc.z) / 2;
    L.push(<line key={k} x1={pa.x} y1={pa.y} x2={pc.x} y2={pc.y} stroke={mixHex(col, air.col, haze(air, dd))} strokeWidth={Math.max(0.8, Math.min(4, (b.c.f * 0.003 * w) / dd))} strokeLinecap="round" />);
  };
  for (let i = 0; i < 26; i++) seg(`pj${i}`, v3(XL, 0.002, ZC + i * 0.9), v3(XK, 0.002, ZC + i * 0.9), C.walkLine);
  seg('pl', v3(-0.05, 0.002, ZC), v3(-0.05, 0.002, 16), C.walkLine);
  for (let i = -16; i < 24; i++) seg(`cj${i}`, v3(i * 0.9, 0.002, ZF), v3(i * 0.9, 0.002, ZC), C.walkLine);
  seg('cl', v3(-30, 0.002, -6.3), v3(40, 0.002, -6.3), C.walkLine);
  for (let i = 0; i < 6; i++) seg(`rl${i}`, v3(3.9, 0.002, ZC + 0.5 + i * 3), v3(3.9, 0.002, ZC + 2 + i * 3), C.roadLine, 1.6);
  return L;
};

// ------------------------------------------------------------------ the jet and the strand
const SILK_LIQ = '#F2D48A', SILK_SOL = '#FFFBF0';
/** the jet (before the hit): from the nozzle toward the hit point; the liquid head thins into a strand behind it */
const jetGeom = (t: number) => {
  const her = herAt(t);
  const A = runnerAt(T.hit).back;
  const O = her.nozzle;
  const tau = tauOf(t);
  const s = clamp((tau - TAU.eject) / (TAU.hit - TAU.eject));
  const D = len3(sub3(A, O));
  const pt = (u: number) => {
    // a shallow arc: up out of the nozzle, dropping a little toward the end
    const base = lerp3(O, A, u);
    return add3(base, v3(0, 0.05 * D * 0.12 * Math.sin(Math.PI * u) * (1 - u * 0.4), 0));
  };
  return {O, A, s, pt, D};
};

type Seg = {pts: {x: number; y: number}[]; w: number[]};
const strokeRibbon = (pts: {x: number; y: number}[], w: number[]) => {
  // a variable-width ribbon outline from a polyline and per-point widths
  if (pts.length < 2) return '';
  const L: {x: number; y: number}[] = [], R: {x: number; y: number}[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], c = pts[Math.min(pts.length - 1, i + 1)];
    let nx = -(c.y - a.y), ny = c.x - a.x;
    const l = Math.hypot(nx, ny) || 1;
    nx /= l; ny /= l;
    L.push({x: pts[i].x + nx * w[i] / 2, y: pts[i].y + ny * w[i] / 2});
    R.push({x: pts[i].x - nx * w[i] / 2, y: pts[i].y - ny * w[i] / 2});
  }
  const all = [...L, ...R.reverse()];
  return `M${all.map((p) => `${f1(p.x)},${f1(p.y)}`).join('L')}Z`;
};
void (null as unknown as Seg);

/** world width (m) to screen px at a point, never thinner than `min` px */
const wpx = (b: B, p: V3, w: number, min: number) => Math.max(min, (b.c.f * w) / Math.max(0.05, depthOf(b, p)));

const Jet: React.FC<{b: B; t: number}> = ({b, t}) => {
  if (t < T.eject) return null;
  if (t >= T.hit) return <Strand b={b} t={t} />;
  const {s, pt} = jetGeom(t);
  const age = clamp((t - T.eject) / (T.hit - T.eject));
  // liquid section length (as a fraction of the path), shrinking as the strand forms behind the head
  const liq = Math.max(0.05, Math.min(s, 0.55 * (1 - ss(age, 0.12, 0.85)) + 0.05));
  const N = 48;
  const solid: {x: number; y: number}[] = [], sw: number[] = [];
  const liquid: {x: number; y: number}[] = [], lw: number[] = [];
  for (let i = 0; i <= N; i++) {
    const u = (i / N) * s;
    const p = pt(u), q = proj(b, p);
    if (q.z < 0.05) continue;
    if (u <= s - liq) {
      solid.push(q);
      sw.push(wpx(b, p, 0.007, 3.2));
    }
    if (u >= s - liq - 0.01) {
      const k = (u - (s - liq)) / liq; // 0 at the strand end, 1 at the head
      liquid.push(q);
      lw.push(wpx(b, p, 0.012 + 0.03 * k * k * (1 - 0.6 * age), 4));
    }
  }
  const head = proj(b, pt(s));
  const hr = wpx(b, pt(s), 0.028 * (1 - 0.55 * age), 5);
  // a few droplets shed near the nozzle in the first instants
  const drops = [0.12, 0.2, 0.31].map((u0, i) => {
    const a = clamp((t - T.eject) / 0.5);
    if (a <= 0 || a >= 1) return null;
    const p = add3(pt(Math.min(s, u0 * s + 0.02)), v3(0, -0.05 * a * (i + 1), 0.03 * (i - 1)));
    const q = proj(b, p);
    return <circle key={i} cx={q.x} cy={q.y} r={wpx(b, p, 0.007, 2.5)} fill={SILK_LIQ} stroke={INK} strokeWidth={1.4} opacity={1 - a} />;
  });
  return (
    <g>
      {solid.length > 1 && <path d={strokeRibbon(solid, sw.map((w) => w + 3))} fill={INK} />}
      {solid.length > 1 && <path d={strokeRibbon(solid, sw)} fill={SILK_SOL} />}
      {liquid.length > 1 && <path d={strokeRibbon(liquid, lw.map((w) => w + 3.5))} fill={INK} />}
      {liquid.length > 1 && <path d={strokeRibbon(liquid, lw)} fill={SILK_LIQ} opacity={0.96} />}
      {liquid.length > 1 && <path d={strokeRibbon(liquid, lw.map((w) => w * 0.3))} fill="#FFF6D8" opacity={0.8} />}
      <circle cx={head.x} cy={head.y} r={hr + 1.8} fill={INK} />
      <circle cx={head.x} cy={head.y} r={hr} fill={mixHex(SILK_LIQ, SILK_SOL, age)} />
      <circle cx={head.x - hr * 0.3} cy={head.y - hr * 0.3} r={hr * 0.3} fill="#FFFFFF" opacity={0.8} />
      {drops}
    </g>
  );
};

/** after the hit: the strand from the nozzle to his back, a parabola whose sag follows the slack */
export const strandAt = (t: number) => {
  const her = herAt(t), rn = runnerAt(t);
  const O = her.nozzle, A = rn.back;
  const D = len3(sub3(A, O));
  const D0 = len3(sub3(runnerAt(T.taut).back, herAt(T.taut).nozzle));
  const slack = Math.max(0, D0 * 1.002 - D);
  const sag = Math.sqrt((3 * D * slack) / 8);
  return {O, A, D, sag};
};
const Strand: React.FC<{b: B; t: number}> = ({b, t}) => {
  const {O, A, sag} = strandAt(t);
  const N = 40;
  const pts: {x: number; y: number}[] = [], w: number[] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const p = add3(lerp3(O, A, u), v3(0, -4 * sag * u * (1 - u), 0));
    const q = proj(b, p);
    if (q.z < 0.03) continue;
    pts.push(q);
    w.push(wpx(b, p, 0.007, 3.2));
  }
  // the anchor on the jacket: a little splat of strands that lands with a squash
  const a = proj(b, A);
  const land = ss(t, T.hit, T.hit + 0.1);
  const sq = 1 + 0.5 * settle(t, T.hit, 6, 10);
  const r = wpx(b, A, 0.026, 7) * land;
  const legs = [-40, 25, 110, 200].map((ang, i) => {
    const L = r * (1.5 + 0.3 * (i % 2)) * sq;
    return <line key={i} x1={a.x} y1={a.y} x2={a.x + Math.cos(ang * RAD) * L} y2={a.y + Math.sin(ang * RAD) * L} stroke={SILK_SOL} strokeWidth={Math.max(2.2, r * 0.22)} strokeLinecap="round" />;
  });
  return (
    <g>
      <g stroke={INK} strokeWidth={Math.max(2.2, r * 0.22) + 3} strokeLinecap="round">
        {[-40, 25, 110, 200].map((ang, i) => {
          const L = r * (1.5 + 0.3 * (i % 2)) * sq;
          return <line key={i} x1={a.x} y1={a.y} x2={a.x + Math.cos(ang * RAD) * L} y2={a.y + Math.sin(ang * RAD) * L} />;
        })}
      </g>
      {legs}
      {pts.length > 1 && <path d={strokeRibbon(pts, w.map((x) => x + 3))} fill={INK} />}
      {pts.length > 1 && <path d={strokeRibbon(pts, w)} fill={SILK_SOL} />}
      <ellipse cx={a.x} cy={a.y} rx={r * 0.75 * sq} ry={r * 0.6 / sq} fill={SILK_SOL} stroke={INK} strokeWidth={2} />
    </g>
  );
};

// ------------------------------------------------------------------ camera
const camAt = (t: number): Cam => {
  const her = herAt(t);
  // 0-1.3: over her left shoulder as she runs and pulls up; he rounds the corner ahead and cuts right
  const rn0 = runnerAt(Math.min(t, 0.85));
  const chest = (g: V3) => add3(g, v3(0, 1.1, 0));
  // after she plants, the camera keeps easing in behind her shoulder until she fires
  const settle = 0.35 * ss(t, 0.7, 1.45);
  const ots = lookAt(v3(her.g.x - 0.75 + 0.25 * settle, 1.78 - 0.1 * settle, her.g.z + 2.25 - settle), add3(lerp3(chest(her.g), chest(rn0.g), 0.42), v3(0, -0.05, 0)), 800);
  // the flight: just behind and to the left of the jet head, above it, travelling with it
  const jg = jetGeom(Math.min(t, T.hit));
  const J = norm3(sub3(jg.A, jg.O));
  const Rt = v3(-J.z, 0, J.x);
  const head = jg.pt(jg.s);
  const fly = lookAt(add3(add3(add3(head, mul3(J, -1.0)), mul3(Rt, 0.5)), v3(0, 0.34, 0)), add3(head, mul3(J, 0.75)), 920);
  // the tug: a medium shot of him from her side of the strand, a little to its right and above it
  const Rg = runnerAt(T.still).g;
  const toHer = norm3(sub3(herAt(T.taut).g, Rg));
  const cr = v3(toHer.z, 0, -toHer.x); // camera right when looking from her side toward him
  const tug = lookAt(add3(add3(add3(Rg, mul3(toHer, 2.0)), mul3(cr, 0.7)), v3(0, 1.5, 0)), add3(add3(Rg, mul3(toHer, 0.3)), v3(0, 0.92, 0)), 900);
  // the push to the anchor on his back: strand rising from the lower left into the anchor
  const A = runnerAt(t).back;
  const push = lookAt(add3(add3(add3(A, mul3(toHer, 0.78)), mul3(cr, 0.3)), v3(0, 0.27, 0)), add3(add3(A, mul3(toHer, 0.26)), v3(0, -0.09, 0)), 960);
  if (t < 1.3) return ots;
  if (t < 1.85) return lerpCam(ots, fly, ss5(t, 1.3, 1.85));
  if (t < T.hit) return fly;
  if (t < 3.95) return lerpCam(fly, tug, ss5(t, T.hit, 3.95));
  if (t < 4.8) return tug;
  return lerpCam(tug, push, ss5(t, 4.8, STREET_END));
};
export const streetCam = camAt;
export const PLANTS = {runner: R_PLANTS, her: P_PLANTS};

// ------------------------------------------------------------------ render
export const StreetScene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t);
  const b = basis(cam);
  const rn = runnerAt(t), her = herAt(t);
  const cdR = cardOf(b, rn.g, rn.h), cdP = cardOf(b, her.g, her.h);
  const glow = t >= T.eject - 0.05 && t < T.eject + 0.3 ? 1 - ss(t, T.eject, T.eject + 0.3) : 0;
  const device = (rot: number) => ({back: <Device ol={4 / Math.max(0.3, cdP.k)} glow={glow} />});
  void device;
  const devHold = () => ({back: <Device ol={Math.max(1.6, 4 * Math.pow(cdP.k, 0.6)) / cdP.k} glow={glow} />});
  const bagHold = (rot: number) => ({back: <Bag ol={Math.max(1.6, 4 * Math.pow(cdR.k, 0.6)) / cdR.k} swing={-rn.bagSwing * Math.sign(cdR.phi || 1)} rot={rot} />});
  const items = [
    {d: cdR.depth, n: <Crew4 key="r" id={`r${Math.round(t * 1000)}`} look={RUNNER} b={BODY_R} pose={rn.pose} cd={cdR} holdR={bagHold} />},
    {d: cdP.depth, n: <Crew4 key="p" id={`p${Math.round(t * 1000)}`} look={PERSON} b={BODY_P} pose={her.pose} cd={cdP} holdR={devHold} />},
  ].filter((i) => i.d > 0.25).sort((a, c) => c.d - a.d);
  // horizon for the sky gradient
  const hz = proj(b, add3(cam.pos, v3(Math.sin(cam.yaw * RAD) * 500, 0, Math.cos(cam.yaw * RAD) * 500)));
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id={`sky${Math.round(t * 1000)}`} gradientUnits="userSpaceOnUse" x1={0} y1={hz.y - 1500} x2={0} y2={hz.y}>
          <stop offset="0" stopColor="#1E3354" />
          <stop offset="0.6" stopColor="#4A5F86" />
          <stop offset="1" stopColor="#E8907A" />
        </linearGradient>
        <radialGradient id={`stv${Math.round(t * 1000)}`} cx="0.5" cy="0.45" r="0.8"><stop offset="0.6" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.35} /></radialGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill={`url(#sky${Math.round(t * 1000)})`} />
      <Planes b={b} air={AIR} polys={setPolys(b)} />
      {setLines(b, AIR)}
      {items.map((i) => i.n)}
      <Jet b={b} t={t} />
      <rect x={0} y={0} width={1080} height={1920} fill={`url(#stv${Math.round(t * 1000)})`} />
    </svg>
  );
};
export {keyS};
