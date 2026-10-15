// V3, from the low three-quarter collapse to the transmission pulse (0.27 s -> "Every second matters."), one
// world and one camera path: the supported collapse, the camera follows the bracing wrist into the band, the band
// buzzes and the fingers dig in, the camera tilts round the case to its underside, a clean cut edge sweeps the
// skin open, the port extends, the sensor stream enters the vessel, the camera follows one hero sensor across the
// near wall, past a red cell, round a bend to a changed cell, scans it (its signal rings stay local), then the
// camera pulls straight back out of the same vessel while the arm section closes, so the arm is a closed exterior
// again. Short amber diagnostic dashes run up a thin trace on the bare arm skin (not particles in the blood) toward
// a torso-shaped window in his chest: the liver dims, the heart beats, then turns irregular; the window closes and
// the red warning dash runs back down the trace into the band. Then the critical seconds and the transmission pulse.
// V4: every anatomy state comes from lib/reveal4.ts (revealAt); there is no hidden switch.
import React from 'react';
import {armFrame, armR, DEV_GEO, DeviceView} from '../art/Device';
import {EXPR_GASP, EXPR_PAIN, EXPR_WINCE, Expr, mixExpr} from '../art/Head';
import {HAND_BRACE, HAND_CLUTCH, HandPose, mixHand} from '../art/Hand';
import {Hero, PortModule, SEC, secFrame, SecFrame, SectionLayers, VesselTube, vesselPath, WallCell, TissueFill} from '../art/Interior';
import {ChestWindow, chestWorld, HAND_GRIP, LOW_GRIP, TraceDash} from '../art/Cutaway';
import {foreRadii, Joints, manJoints, ManPose, torsoPath} from '../art/Man';
import {DogPose} from '../art/Dog';
import {Cam, toScreen} from '../lib/camera';
import {deviceState3} from '../lib/device3';
import {spline, splineRec, SKey} from '../lib/motion';
import {add, clamp, easeInOut, fmt, inv, lerp, mul, noise1, norm, sub, V} from '../lib/math';
import {Glow} from '../lib/shade';
import {B} from '../lib/timeline3';
import {B4} from '../lib/beats4';
import {revealAt, TracePulse} from '../lib/reveal4';
import {alongPts, openD} from '../art/Heart4';
import {collapseCam, collapseState, dogAt, PROP} from './Opening';
import {Scene} from './Scene';

const ease = easeInOut;
const expLerp = (a: number, b: number, t: number) => Math.exp(lerp(Math.log(a), Math.log(b), t));
const zKeys = (f: number, keys: [number, number][]) => Math.exp(spline(f, keys.map(([t, z]) => [t, Math.log(z)])));

// ---------------------------------------------------------------- the supported pose (held still in the section)
export const PJ = manJoints(PROP);
export const R0 = foreRadii(PROP.s);
export const P_ARM = armFrame(PJ.L.E, PJ.L.W, R0.rE, R0.rW);
/** the case turns to the arm's screen-left edge, away from his body */
export const SIGMA: 1 | -1 = P_ARM.n.x > 0 ? -1 : 1;
export const SF: SecFrame = secFrame(P_ARM, SIGMA);
export const SEC_ROLL = 90 * SIGMA;
export const W = (X: number, D: number) => SF.toWorld(X, D);
export const LOCAL_PER_WORLD = SF.k;
export const BAND_C = add(PJ.L.W, mul(PJ.L.foreDir, -1.75 * R0.rW));
/** the chest window's world landmarks in the still pose (camera targets) */
export const CHEST = chestWorld(PJ.C, PJ.tc, PROP.s);
/** the glass centre with the case facing the camera (roll 0, yaw 14; Wrist3D caseFrame) */
export const GLASS_C = (() => {
  const ub = P_ARM.L - DEV_GEO.bandFromWrist * P_ARM.rW;
  const rr1 = armR(P_ARM, ub) + DEV_GEO.caseT * P_ARM.rW;
  return add(BAND_C, mul(P_ARM.u, rr1 * Math.sin((14 * Math.PI) / 180)));
})();
/** half the case's diagonal (world): a ring around the glass that starts outside this never crosses the digits */
export const CASE_HALF_DIAG = (Math.hypot(DEV_GEO.caseL, DEV_GEO.caseW) / 2) * P_ARM.rW;

/** The low grip (lib/reveal4 rHandLow): his free right hand grips his raised near knee (art/Cutaway LOW_GRIP).
 *  The target is pinned in world space, so breathing does not slide the hand on the knee; the base pose's own
 *  world target weight (rW) is 0 in every pose this is applied to (PROP and the poses derived from it). */
export const KNEE_GRIP = manJoints({...PROP, rTu: LOW_GRIP.rTu, rTv: LOW_GRIP.rTv}).toWorld(LOW_GRIP.rTu, LOW_GRIP.rTv);
export const withLowGrip = (m: ManPose, low: number): ManPose =>
  low > 0 ? {...m, rW: lerp(m.rW, 1, low), rWx: KNEE_GRIP.x, rWy: KNEE_GRIP.y, rWr: lerp(m.rWr, LOW_GRIP.rWr, low)} : m;

/** the forearm vessel (section view only) */
export const VP = vesselPath(SF);

/** The exterior diagnostic trace on the bare arm skin (world), from the band's elbow-side edge up the forearm,
 *  past the elbow and up the upper arm to just under the sleeve hem; `hem` is the fraction where the sleeve
 *  starts to cover it. Built on the current joints, so it moves with the arm. */
export const armTrace = (j: Joints): {pts: V[]; hem: number} => {
  const s = j.s;
  const A = armFrame(j.L.E, j.L.W, R0.rE, R0.rW);
  const uB = A.L - (1.75 + 0.47 + 0.12) * A.rW;
  const side = -1; // toward his front (screen-left of the near arm)
  const fore: V[] = [];
  for (let i = 0; i <= 8; i++) {
    const u = lerp(uB, 0.07 * A.L, i / 8);
    const r = lerp(A.rE, A.rW, u / A.L);
    fore.push(add(add(A.E, mul(A.u, u)), mul(A.n, side * r * (0.3 + 0.05 * Math.sin(i * 0.9)))));
  }
  const du = norm(sub(j.L.E, j.L.S));
  const nU = {x: du.y, y: -du.x};
  const hemT = 1 - 0.56; // the sleeve hem, measured from the elbow
  const upper = [0.05, 0.13, 0.21, 0.29, 0.37, hemT, hemT + 0.08].map((t) => {
    const r = lerp(23.5, 29, t) * s;
    return add(add(j.L.E, mul(sub(j.L.S, j.L.E), t)), mul(nU, side * r * 0.3));
  });
  const pts = [...fore, ...upper];
  const segs = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
  const iHem = fore.length + 5;
  const lHem = segs.slice(0, iHem).reduce((x, y) => x + y, 0);
  const Lt = segs.reduce((x, y) => x + y, 0);
  return {pts, hem: lHem / Lt};
};
const TRACE0 = armTrace(PJ);
/** world position of a pulse on the arm leg (t 0 = band edge .. 1 = sleeve hem) */
const armTraceAt = (tr: {pts: V[]; hem: number}, t: number) => alongPts(tr.pts, t * tr.hem);

// ---------------------------------------------------------------- the hero sensor's ride (arc length along VP)
const E0 = VP.entry;
const S_TARGET = E0 + 1660; // the wall cell that changes state
const heroS = (f: number) =>
  E0 +
  spline(f, [
    [B.heroRing - 12, -50],
    [B.dive0, 30],
    [B.dive1, 340],
    [B.pass0 + 8, 640],
    [B.pass1, 1380],
    [B.wall0 + 6, 1520],
    [B.decay - 4, 1630, 'stop'],
    [B.signal1, 1640, 'stop'],
    [B.pull1, 1650],
  ]);
const WALL_SIDE: 1 | -1 = 1;
const heroL = (f: number) => {
  const wander = 30 * Math.sin(f * 0.07) + 14 * noise1(f * 0.05, 3);
  const toWall = ease(inv(B.wall0 - 4, B.decay - 6, f));
  return lerp(wander, WALL_SIDE * (SEC.rho - 70), toWall);
};
const hero = (f: number): Hero => ({
  s: heroS(f),
  l: heroL(f),
  r: 22,
  ring: clamp(inv(B.heroRing, B.heroRing + 8, f)),
  // the hero's signal stays local: a ring leaves it every 11 frames (a constant stream), nothing travels the blood
  signal: f >= B.signal0 ? ((f - B.signal0) % 11) / 11 : 0,
  signalColor: '#FFB23E',
});
const onVP = (path: typeof VP, s: number, l = 0) => {
  const q = path.at(s);
  const p = add(q.p, mul(q.nrm, l));
  return W(p.x, p.y);
};
const heroWorld = (f: number) => onVP(VP, heroS(f), heroL(f));
/** camera roll that turns the flow to screen-up, smoothed over the bends */
const travelRoll = (s: number) => {
  const wa = onVP(VP, Math.max(0, s - 260));
  const wb = onVP(VP, s + 260);
  return -90 - (Math.atan2(wb.y - wa.y, wb.x - wa.x) * 180) / Math.PI;
};

// ---------------------------------------------------------------- the man over time
/** breathing is held while the camera is inside the arm (the section frame is built on the still pose) */
const breathEnv = (f: number) => clamp(1 - inv(B.tip0 - 10, B.tip0, f) + inv(B.sig1, B.sig1 + 20, f));

const CRIT_KEYS: SKey<ManPose>[] = [
  [B.count0, {...PROP}, 'stop'],
  // the critical seconds: his head lifts toward the street, then drops back to the band
  [B.crit0 + 6, {...PROP, neck: -20, chest: 31}],
  [B.crit0 + 24, {...PROP, neck: -24, chest: 30}],
  [B.tx0 + 4, {...PROP, neck: -10, chest: 33}],
  [B.map0, {...PROP, neck: -14, chest: 32}],
];

export const propMan = (f: number): ManPose => {
  const env = breathEnv(f);
  const br = Math.sin(f * 0.21);
  let m: ManPose = f >= B.count0 ? splineRec(f, CRIT_KEYS) : {...PROP};
  m = {...m, breath: 0.5 + 0.5 * br * env, torso: m.torso + 0.6 * br * env, chest: m.chest + 1.4 * Math.sin(f * 0.21 + 0.6) * env};
  // the organ phase: his free hand grips his raised knee, clear of the chest window (reveal4 rHandLow)
  return withLowGrip(m, revealAt(f).rHandLow);
};

export const manAt = (f: number): ManPose => (f < B.settle ? collapseState(f).man : propMan(f));

const pained = (f: number) => mixExpr(EXPR_WINCE, EXPR_PAIN, 0.5 + 0.5 * Math.sin(f * 0.13));
const exprAt = (f: number): Expr => {
  if (f < B.settle) return collapseState(f).expr;
  const atBand: Expr = {...EXPR_PAIN, shut: 0, lid: 0.18, squint: 0.25, gx: 0.55, gy: 0.75, pupil: 0.7};
  if (f < B.crit0) return mixExpr(collapseState(B.settle).expr, mixExpr(pained(f), atBand, 0.55), ease(inv(B.settle, B.settle + 14, f)));
  // critical seconds: eyes find the band, lift to the street (where help would come from), drop back
  const street: Expr = {...EXPR_GASP, gx: -0.75, gy: -0.45, pupil: 0.6, open: 0.32};
  const k = ease(inv(B.crit0 + 4, B.crit0 + 12, f)) * (1 - ease(inv(B.tx0 - 6, B.tx0 + 2, f)));
  return mixExpr(atBand, street, k);
};

const BUZZ: [number, number][] = [
  [B.buzz0, B.buzz0 + 9],
  [B.buzz0 + 16, B.buzz0 + 25],
  [B.count0 + 4, B.count0 + 12],
  [B.crit0 + 2, B.crit0 + 11],
];
/** band vibration: short buzzes, a high-frequency roll jitter of the case */
export const buzz = (f: number) => BUZZ.reduce((a, [s, e]) => a + (f >= s && f < e ? Math.sin(((f - s) / (e - s)) * Math.PI) : 0), 0);

const handAt = (f: number): {l: HandPose; r: HandPose} => {
  const st = f < B.settle ? collapseState(f) : null;
  const press = clamp(inv(B.tense0, B.tense0 + 10, f)) * (1 - 0.6 * clamp(inv(B.tip0, B.tip0 + 20, f))) + clamp(inv(B.crit0, B.crit0 + 8, f)) * (1 - clamp(inv(B.map0 - 4, B.map0, f)));
  const planted = {...HAND_BRACE, curl: [0.16, 0.16, 0.2, 0.22] as HandPose['curl'], spread: 0.95};
  const dig = {...HAND_BRACE, curl: [0.34, 0.38, 0.4, 0.42] as HandPose['curl'], spread: 0.8, thumbCurl: 0.35};
  const l = st ? st.lHand : mixHand(planted, dig, clamp(press));
  const r0 = st ? st.rHand : mixHand(HAND_CLUTCH, {...HAND_CLUTCH, curl: [0.56, 0.62, 0.66, 0.7]}, 0.5 + 0.5 * Math.sin(f * 0.3));
  // the low grip: the fingers close over the top of his knee (a hand that holds, not an open hand)
  const grip = {...HAND_GRIP, curl: HAND_GRIP.curl.map((c) => c - 0.03 + 0.03 * Math.sin(f * 0.27)) as HandPose['curl']};
  const r = st ? r0 : mixHand(r0, grip, revealAt(f).rHandLow);
  return {l, r};
};


// ---------------------------------------------------------------- camera
export const SEC_VIEW = W(SF.Xp - 760, 420);
export const PORT_VIEW = W(SF.Xp + 520, 160);
export const STREAM_VIEW = W(SF.Xp + 420, 380);

const camOpen = (f: number): Cam => {
  if (f < 46) return {...collapseCam(f), roll: 0};
  const c46 = collapseCam(46);
  const xs: [number, number][] = [[46, c46.x], [58, lerp(c46.x, BAND_C.x, 0.45)], [B.macro, BAND_C.x], [B.tip0, BAND_C.x + 2], [B.tip1, SEC_VIEW.x], [B.open0, SEC_VIEW.x], [B.port0 + 6, PORT_VIEW.x], [B.stream0 + 10, PORT_VIEW.x], [B.heroRing, STREAM_VIEW.x], [B.dive0 + 2, STREAM_VIEW.x]];
  const ys: [number, number][] = [[46, c46.y], [58, lerp(c46.y, BAND_C.y, 0.5)], [B.macro, BAND_C.y + 2], [B.tip0, BAND_C.y], [B.tip1, SEC_VIEW.y], [B.open0, SEC_VIEW.y], [B.port0 + 6, PORT_VIEW.y], [B.stream0 + 10, PORT_VIEW.y], [B.heroRing, STREAM_VIEW.y], [B.dive0 + 2, STREAM_VIEW.y]];
  const zs: [number, number][] = [[46, c46.z], [58, 2.4], [B.macro, 7.2], [B.tip0, 7.8], [B.tip1, 12.5], [B.open0, 13], [B.port0 + 6, 20], [B.stream0 + 10, 24], [B.heroRing, 30], [B.dive0 + 2, 33]];
  return {x: spline(f, xs), y: spline(f, ys), z: zKeys(f, zs), roll: 0};
};

const Z_RIDE = 4.0 * LOCAL_PER_WORLD;
const rideCam = (f: number): Cam => {
  const s = heroS(f);
  const h = heroWorld(f);
  const fwd = sub(onVP(VP, s + 2), onVP(VP, s));
  const fl = Math.hypot(fwd.x, fwd.y) || 1;
  // distance and depth vary: closer as the hero meets the cell, back off as the signals leave
  const zz = Z_RIDE * (1 + 0.25 * ease(inv(B.pass0, B.pass0 + 14, f)) * (1 - ease(inv(B.pass1 - 10, B.pass1, f))) + 0.3 * ease(inv(B.wall0, B.decay, f)) - 0.3 * ease(inv(B.signal0, B.signal1, f)));
  const lead = 150 / zz;
  return {x: h.x + (fwd.x / fl) * lead, y: h.y + (fwd.y / fl) * lead, z: zz, roll: travelRoll(s)};
};

const diveCam = (f: number): Cam => {
  const a = camOpen(B.dive0 + 2);
  const b = rideCam(B.dive1);
  const t = inv(B.dive0 + 2, B.dive1, f);
  const e = ease(t);
  const k = Math.pow(e, 0.6);
  return {x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: expLerp(a.z, b.z, e), roll: lerp(0, b.roll ?? 0, ease(clamp((t - 0.15) / 0.85)))};
};

/** The pull-out: it starts exactly on rideCam(pull0) (same centre, zoom and roll, at rest) and backs straight out of
 *  the vessel. The hero's SCREEN position is what is blended (it stays where rideCam put it while the zoom falls
 *  and the arm section closes around it), so the centre never swings by hundreds of pixels at the high zooms;
 *  only once the section has closed does the view settle on the arm. The band (with the case and the port) rises
 *  into view from below and stays under the caption lane: a smooth floor on its screen y, applied as a camera
 *  shift, keeps its top edge below the lane at every zoom (inactive at the start and at the end of the pull). */
const ARM_VIEW = {x: 570, y: 1473};
const Z_ARM = 2.6;
/** the band centre's lowest allowed screen y at zoom z: its half size (29 z) below the lane's text (1505), >= 1600 */
const bandFloor = (z: number) => Math.max(1600, 1505 + 29 * z);
/** smooth max (softness w px): equals y once y is a few w past the floor */
const smax = (y: number, fl: number, w: number) => fl + w * Math.log1p(Math.exp((y - fl) / w));
const rotV = (p: V, deg: number): V => {
  const c = Math.cos((deg * Math.PI) / 180);
  const s = Math.sin((deg * Math.PI) / 180);
  return {x: p.x * c - p.y * s, y: p.x * s + p.y * c};
};
const pullCam = (f: number): Cam => {
  const t = inv(B.pull0, B.pull1, f);
  const a = rideCam(B.pull0);
  const z = expLerp(a.z, Z_ARM, ease(t));
  const roll = lerp(a.roll ?? 0, 0, ease(clamp(t * 1.4)));
  const h = heroWorld(f);
  // hero offset on screen (px): from rideCam's framing to where the arm view puts it
  const o0 = rotV(mul(sub(heroWorld(B.pull0), a), a.z), a.roll ?? 0);
  const o1 = mul(sub(h, ARM_VIEW), Z_ARM);
  const k = ease(inv(B4.armClose0 + 2, B.pull1, f));
  const o = add(mul(o0, 1 - k), mul(o1, k));
  const c = sub(h, mul(rotV(o, -roll), 1 / z));
  // keep the band below the caption lane: shift the view (screen-down by dy) when its screen y would rise past the floor
  const bs = rotV(mul(sub(BAND_C, c), z), roll);
  const y = 960 + bs.y;
  const dy = smax(y, bandFloor(z), 16) - y;
  const c2 = sub(c, mul(rotV({x: 0, y: dy}, -roll), 1 / z));
  return {x: c2.x, y: c2.y, z, roll};
};

const seconds = add(BAND_C, {x: 0, y: -2});
// the critical seconds: his face at the top of frame, the band above the caption lane
const TWO = {x: (PJ.head.x + BAND_C.x) / 2, y: BAND_C.y - 340 / 2.2};
/** the chest view: the window and heart centred, the near arm and sleeve at the frame's right, the heart well
 *  above the caption lane */
export const CHEST_CAM = {x: CHEST.centroid.x + 4, y: CHEST.centroid.y + 30};
export const Z_CHEST = 4.4;
/** The warning's camera: once the red dash has left the heart, the view tilts down to the arm in one move (the
 *  band rises into frame along the right edge, clear of the caption text, and settles above the caption lane), then
 *  drifts down with the dash as it races from the sleeve hem to the band, and centres the band for the landing.
 *  `bandAt(g, x, y, z)` is the camera that puts the band at screen (x, y) at zoom z. */
const bandAt = (g: number, x: number, y: number, z: number): [number, V, number] => [g, {x: BAND_C.x - (x - 540) / z, y: BAND_C.y - (y - 960) / z}, z];
const camBody = (f: number): Cam => {
  const keys: [number, V, number][] = [
    [B.pull1, ARM_VIEW, Z_ARM],
    [B4.chestOpen1, add(mul(CHEST_CAM, 0.55), mul(ARM_VIEW, 0.45)), 3.3],
    [B.fail + 4, CHEST_CAM, Z_CHEST - 0.2],
    [B.heart0 + 6, add(CHEST_CAM, {x: -2, y: -2}), Z_CHEST],
    [B.lethal + 6, add(CHEST_CAM, {x: -3, y: -3}), Z_CHEST + 0.25],
    [B4.warn0 + 2, add(CHEST_CAM, {x: -3, y: -2}), Z_CHEST + 0.25],
    // down to the arm: the window closes at the top of frame, the dash appears at the sleeve hem
    bandAt(B4.warnHem, 935, 1235, 3.1),
    // follow the dash down the arm (the band stays above the caption lane from here on)
    bandAt(B4.warnHem + 14, 860, 1170, 3.3),
    bandAt(B4.warn1 - 4, 730, 1060, 3.75),
    [B4.warn1 + 2, BAND_C, 5.4],
    [B.red + 4, BAND_C, 7.0],
    [B.count0 + 4, seconds, 8.6],
    [B.crit0 - 4, seconds, 9.2],
    [B.crit0 + 14, TWO, 2.2],
    [B.tx0, add(TWO, {x: 6, y: 8}), 2.3],
    // the transmission pulse lifts off the band; the camera tilts up with it
    [B.map0, add(BAND_C, {x: -40, y: -520}), 2.4],
  ];
  return {
    x: spline(f, keys.map(([t, p]) => [t, p.x])),
    y: spline(f, keys.map(([t, p]) => [t, p.y])),
    z: Math.exp(spline(f, keys.map(([t, , z]) => [t, Math.log(z)]))),
    roll: 0,
  };
};

export const journeyCam3 = (f: number): Cam => {
  let c: Cam;
  if (f < B.dive0 + 2) c = camOpen(f);
  else if (f < B.dive1) c = diveCam(f);
  else if (f < B.pull0) c = rideCam(f);
  else if (f < B.pull1) c = pullCam(f);
  else c = camBody(f);
  // a little handheld energy on the macro while the band buzzes
  const bz = buzz(f);
  if (bz > 0 && c.z < 20) c = {...c, x: c.x + (bz * noise1(f * 3.1, 41) * 2.2) / c.z * 6, y: c.y + (bz * noise1(f * 2.7, 42) * 2.2) / c.z * 6};
  return c;
};

// ---------------------------------------------------------------- render
/** amber dashes never sit in the caption lane: fade them within 30 px of it (screen space) */
const LANE = [1360, 1540];
export const laneFade = (cam: Cam, p: V) => {
  const y = toScreen(cam, p).y;
  const d = y < LANE[0] ? LANE[0] - y : y > LANE[1] ? y - LANE[1] : 0;
  return clamp(d / 30);
};

/** The exterior trace on the bare arm skin, drawn by Wrist3D under the sleeve and the strap (world units). */
export const ArmTrace: React.FC<{id: string; tr: {pts: V[]; hem: number}; a: number; pulses: TracePulse[]; cam: Cam}> = ({id, tr, a, pulses, cam}) => {
  if (a <= 0.01) return null;
  const d = openD(tr.pts);
  return (
    <g opacity={a}>
      <path d={d} fill="none" stroke="#6B3A2A" strokeWidth={1.9} strokeOpacity={0.16} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#7FE3FF" strokeWidth={1.05} strokeOpacity={0.55} strokeLinecap="round" strokeLinejoin="round" />
      {pulses
        .filter((p) => p.leg === 'arm')
        .map((p) => {
          const head = armTraceAt(tr, p.t);
          const fade = p.kind === 'signal' ? laneFade(cam, head) : 1;
          return <TraceDash key={`${p.kind}${p.key}`} id={`${id}-${p.kind}${p.key}`} pts={tr.pts} t={p.t * tr.hem} len={18} kind={p.kind} a={p.a * fade} w={1.6} />;
        })}
    </g>
  );
};

export const Journey3: React.FC<{id: string; f: number}> = ({id, f}) => {
  const cam = journeyCam3(f);
  const man = manAt(f);
  const j = manJoints(man);
  const expr = exprAt(f);
  const hands = handAt(f);
  const dog = dogAt(f);
  const hairSway = f < B.settle ? collapseState(f).hairSway : 0;
  const blink = f < B.settle ? collapseState(f).blink : Math.max(0, 1 - Math.abs(((f - 70) % 95) - 3) / 3) * (f > B.tip0 - 10 && f < B.count0 ? 0 : 1);

  // every anatomy state comes from the one reveal authority
  const rv = revealAt(f);
  const sectionMode = f >= B.tip0 - 2 && rv.armOpen > 0.002;
  const bz = buzz(f);
  // the case turns to its profile for the section and back to face the camera once the cut has closed
  const roll = (f < B.tip0 ? 0 : SEC_ROLL * ease(inv(B.tip0, B.tip1, f)) * (1 - ease(inv(B4.caseRoll0, B4.caseRoll1, f)))) + bz * 3.2 * Math.sin(f * 2.6);
  const portExt = clamp(inv(B.port0, B.port1, f)) * (1 - clamp(inv(B.retract0, B.retract1, f)));
  const pxs = cam.z / LOCAL_PER_WORLD;
  const hs = heroS(f);
  const inRide = f >= B.dive0 && f < B.pull0;
  const cells: WallCell[] = [-640, -320, 0, 330, 660].map((ds) => ({
    s: S_TARGET + ds,
    side: WALL_SIDE,
    decay: ds === 0 ? clamp(inv(B.decay - 2, B.decay + 10, f)) : 0,
    scan: ds === 0 ? clamp(inv(B.scan0, B.decay, f)) * (1 - 0.5 * clamp(inv(B.signal1, B.signal1 + 10, f))) : 0,
  }));
  const sensorFront = E0 + Math.max(0, (f - (B.stream0 + 30)) * 24);
  // while the camera rides, cells are placed around the hero; from the pull-out on, along the whole vessel (the
  // same generator and the same path, so nothing repopulates)
  // the sensor stream (far up the vessel by now) fades while the camera is still deep in the vessel, so its bead
  // cloud never scrolls into view as a speckle when the pull-out widens the view
  const sensorsA = clamp(inv(B.stream0 + 26, B.stream0 + 36, f)) * (1 - clamp(inv(B.pull0, B.pull0 + 10, f)));
  const tubeCommon = {f, px: pxs, sensors: sensorsA, sensorFront, cells, s0: inRide ? hs - 900 : -99999, s1: inRide ? hs + 1500 : 99999};
  // the red cell the hero passes behind: it overtakes on the near side
  const occluder = {s: hs + lerp(-260, 300, ease(inv(B.pass0 + 2, B.pass0 + 26, f))), l: 18};
  const tubeSection = <VesselTube id={`${id}-vt`} path={VP} {...tubeCommon} hero={f >= B.stream1 - 12 ? hero(f) : undefined} occluder={occluder} />;

  const tr = armTrace(j);
  const dev: DeviceView = {
    screen: deviceState3(f),
    roll,
    yaw: 14,
    flip: false,
    upright: true,
    glow: 1 + 0.6 * bz,
    caseOpen: rv.caseOpen,
    caseCut: () => (
      <g transform={SF.matrix}>
        <PortModule id={`${id}-pm`} sf={SF} f={f} ext={portExt} reservoir={1 - 0.4 * clamp(inv(B.stream0, B.stream1, f))} blue={0} />
      </g>
    ),
    inArm: () =>
      sectionMode ? (
        <g transform={SF.matrix}>
          <SectionLayers id={`${id}-sec`} sf={SF} f={f} open={rv.armOpen} tube={tubeSection} stream={clamp(inv(B.stream0, B.stream1, f))} streamA={clamp(inv(B.stream0, B.stream0 + 4, f)) * (1 - clamp(inv(B.dive1 - 10, B.dive1, f)))} />
        </g>
      ) : null,
    onSkin: rv.trace.a > 0.01 ? () => <ArmTrace id={`${id}-tr`} tr={tr} a={rv.trace.a} pulses={rv.trace.pulses} cam={cam} /> : undefined,
  };

  const chest =
    rv.chestOpen > 0.004 ? (
      <ChestWindow
        id={`${id}-cw`}
        f={f}
        C={j.C}
        tc={j.tc}
        s={man.s}
        open={rv.chestOpen}
        organDim={rv.organDim}
        organSense={rv.organSense}
        organWarn={rv.organWarn}
        heart={rv.heart}
        heartSense={rv.heartSense}
        heartWarn={rv.heartWarn}
        traceA={rv.trace.a}
        pulses={rv.trace.pulses}
      />
    ) : null;

  return (
    <Scene
      id={id}
      f={f}
      cam={cam}
      man={man}
      expr={expr}
      blink={blink}
      lHand={hands.l}
      rHand={hands.r}
      dog={dog}
      hairSway={hairSway}
      dev={dev}
      backdrop={rv.backdrop}
      backdropC={sectionMode ? W(SF.Xp - 600, 400) : BAND_C}
      nearLegFront={f > 24}
      noTufts={f > B.macro - 30}
      overTorso={chest}
      extra={(() => {
        // V4: the warning landing at B.red is the device's own alarm ring (lib/device3.ts alarmAt, drawn by Wrist3D
        // round the glass, outside the case), the same helper as the loop alarm
        const tx = inv(B.tx0, B.tx1, f);
        return (
          <g>
            {/* the transmission pulse: a blue ring leaves the band and rises toward the street; it is drawn through
                its last frame (B.tx1) and the map picks it up one frame on at the same screen point and speed
                (Dispatch.tsx txPulseW/txHandoff replicate this world path: keep them in step) */}
            {tx > 0 && f <= B.tx1 && (
              <g>
                <Glow id={`${id}-txg`} c={add(BAND_C, {x: -40 * ease(tx), y: -520 * Math.pow(tx, 1.4)})} r={60 + 40 * tx} color="#39C6F4" alpha={0.8 * (1 - tx * 0.3)} />
                <circle cx={fmt(BAND_C.x - 40 * ease(tx))} cy={fmt(BAND_C.y - 520 * Math.pow(tx, 1.4))} r={fmt(10 + 34 * tx)} fill="none" stroke="#BFF3FF" strokeWidth={fmt(4)} opacity={0.95} />
                <circle cx={fmt(BAND_C.x - 40 * ease(tx))} cy={fmt(BAND_C.y - 520 * Math.pow(tx, 1.4))} r={fmt(6)} fill="#FFFFFF" />
              </g>
            )}
          </g>
        );
      })()}
    />
  );
};
