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
import {armFrame, armR, DEV_GEO, DeviceView, PORT_GEO} from '../art/Device';
import {EXPR_GASP, EXPR_PAIN, EXPR_WINCE, Expr, mixExpr} from '../art/Head';
import {HAND_BRACE, HAND_CLUTCH, HandPose, mixHand} from '../art/Hand';
import {Hero, PortLight, PortMech, portPress, releaseState, SEC, SEC_WIN, secFrame, SecFrame, SectionLayers, SensorRelease, SkinDimple, STREAM_MERGE, StreamDraw, VesselTube, vesselPath, WallCell, TissueFill} from '../art/Interior';
import {ChestWindow, chestWorld, HAND_GRIP, LOW_GRIP, TraceDash} from '../art/Cutaway';
import {foreRadii, Joints, manJoints, ManPose, torsoPath} from '../art/Man';
import {DogPose} from '../art/Dog';
import {Cam, toScreen} from '../lib/camera';
import {PAL} from '../lib/color';
import {deviceState3} from '../lib/device3';
import {spline, splineRec, SKey} from '../lib/motion';
import {add, clamp, easeInOut, fmt, inv, lerp, mul, noise1, norm, smooth, sub, V} from '../lib/math';
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
/** V4: the sensors leave the cartridge one by one, cross into the vessel and enter the flow at the vessel entry; the hero
 *  is one of them and arrives there at heroRing - 12 */
const SENSOR_REL: SensorRelease = {t0: B.stream0 + 2, t1: B.stream1 - 5, n: 16, feed: 9, travel: 12, vVessel: 16, heroMerge: B.heroRing - 12};
const S_TARGET = E0 + 1660; // the wall cell that changes state
const heroS = (f: number) =>
  E0 +
  spline(f, [
    [B.heroRing - 12, STREAM_MERGE], // V4: it merges into the flow where the sensor route meets it (was -50)
    [B.dive0, STREAM_MERGE + 30],
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
  // V4: on the centreline as it merges, then it wanders (unchanged from heroRing + 3)
  const wander = (30 * Math.sin(f * 0.07) + 14 * noise1(f * 0.05, 3)) * ease(inv(B.heroRing - 12, B.heroRing + 3, f));
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
/** the hero's world position (also read by scripts/check_captions4.ts) */
export const heroWorld = (f: number) => onVP(VP, heroS(f), heroL(f));
/** V4 continuity: the arc length the dive and ride cameras follow. heroS changes its acceleration at B.dive1 (the 'race'
 *  starts there); a hero-locked camera turns that into a jolt of the whole picture, and the V4 quintic catch-up over
 *  299-310 still swung the red cells' flow from about 20 px/frame up the screen to 57 down within ~6 frames. The camera
 *  now follows a smoothed copy of heroS across the dive end instead (a raised-cosine average over +-FOLLOW_K frames,
 *  blended in and out over 8 frames at the ends of FOLLOW), so its speed ramps monotonically from the dive's to the
 *  race's over ~20 frames: the flow turns round gently, and the hero drifts a little behind, then ahead, on screen */
const FOLLOW: [number, number] = [B.dive1 - 20, B.dive1 + 30];
const FOLLOW_K = 10;
const camS = (() => {
  const [t0, t1] = FOLLOW;
  const n = 4 * FOLLOW_K;
  const wts = Array.from({length: 2 * n + 1}, (_, j) => 0.5 + 0.5 * Math.cos((Math.PI * (j - n)) / n));
  const wsum = wts.reduce((x, y) => x + y, 0);
  const smoothS = (f: number) => wts.reduce((acc, w, j) => acc + w * heroS(f + (j - n) / 4), 0) / wsum;
  const c2 = (t: number) => t * t * t * (t * (6 * t - 15) + 10);
  return (f: number) => {
    if (f <= t0 || f >= t1) return heroS(f);
    const w = c2(clamp((f - t0) / 8)) * (1 - c2(clamp((f - t1 + 8) / 8)));
    return lerp(heroS(f), smoothS(f), w);
  };
})();
/** the point the dive and ride cameras are anchored on (the hero, but on camS) */
const heroCamW = (f: number) => onVP(VP, camS(f), heroL(f));
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

// V4 sensor shot (119-299), one geometry with the treatment: the case rolls to its underside (the hand is swept into the
// backdrop), a profile overview with the whole case in frame at z <= 12.5, then a punch-in on the port end with the rest
// of the case running off frame: the shutter opens, a light touch, the sensors, the hero; retract and close as the
// dive starts. Contact point and port stay above the caption lane.
/** the contact point (the port on the skin) and the case's centre in profile */
export const PORT_W = W(SF.Xp, SF.dSurf(SF.Xp));
export const CASE_W = W(SF.Xb, SF.dSurf(SF.Xb) - 230);
/** camera that puts world point p at screen (sx, sy) at zoom z */
export const frameOn = (p: V, sx: number, sy: number, z: number) => ({x: p.x - (sx - 540) / z, y: p.y - (sy - 960) / z, z});
/** the backdrop completes (a vignette closing in toward the band), then the hand recedes into it as the case starts to
 *  turn (the veil's soft edge reaches the hand in frame as the roll begins, ~127, and it is gone by 135, roll 20 deg),
 *  so the case never orbits beside the back-view hand */
const S_BACK0 = B.tip0 - 7; // 112
const S_BACK1 = B.tip0 + 3; // 122
const S_VEIL0 = B.tip0 + 5; // 124
const S_VEIL1 = B.tip0 + 18; // 137
const S_ROLL0 = B.tip0 + 7; // 126 (the roll is still under 2 deg at 130)
/** the case's cut-away opens on the overview once the case is at rest edge-on (a 4-frame wipe along the case) */
const S_REVEAL0 = B.tip1 + 1; // 152
const S_REVEAL1 = B.tip1 + 5; // 156
const S_CUT = B.open0 + 19; // 177: after 'Under the band,'
const S_SHUT0 = S_CUT + 1; // 178
const S_SHUT1 = B.port0; // 185
const S_CLOSE0 = B.retract0 + 8; // 269: the shutter closes once the nose is back in
const S_CLOSE1 = B.retract1; // 277
const PRESS_S = PORT_GEO.pressSensor * SEC.units;
/** the sensor shot's mechanism beats (for the V4 sound cues): punch-in, shutter open, light touch, shutter close */
export const SENSOR_BEATS = {back0: S_BACK0, back1: S_BACK1, veil0: S_VEIL0, veil1: S_VEIL1, roll0: S_ROLL0, roll1: B.tip1, reveal0: S_REVEAL0, reveal1: S_REVEAL1, cut: S_CUT, shut0: S_SHUT0, shut1: S_SHUT1, nose0: B.port0, touch: B.port1, retract0: B.retract0, close0: S_CLOSE0, close1: S_CLOSE1};

const camOpen = (f: number): Cam => {
  if (f < 46) return {...collapseCam(f), roll: 0};
  const c46 = collapseCam(46);
  const keys: [number, {x: number; y: number; z: number}][] =
    f < S_CUT
      ? [
          [46, c46],
          [58, {x: lerp(c46.x, BAND_C.x, 0.45), y: lerp(c46.y, BAND_C.y, 0.5), z: 2.4}],
          [B.macro, {x: BAND_C.x, y: BAND_C.y + 2, z: 7.2}],
          [B.tip0, {x: BAND_C.x + 2, y: BAND_C.y, z: 7.8}],
          [B.tip1, frameOn(CASE_W, 425, 1075, 11.8)],
          [S_CUT, frameOn(CASE_W, 423, 1072, 12.4)],
        ]
      : [
          // the port-end detail: the compact mechanism and its cut-away sit above the caption lane, and the zoom is
          // close enough that about a quarter of the case runs off the bottom of the frame (a detail, never the slab)
          [S_CUT, frameOn(PORT_W, 440, 850, 41)],
          [B.port1, frameOn(PORT_W, 432, 855, 41.5)],
          [B.stream0 + 10, frameOn(PORT_W, 405, 860, 42)],
          [B.heroRing, frameOn(PORT_W, 370, 862, 42.5)],
          [B.dive0 + 2, frameOn(PORT_W, 340, 860, 43)],
        ];
  return {
    x: spline(f, keys.map(([t, c]) => [t, c.x])),
    y: spline(f, keys.map(([t, c]) => [t, c.y])),
    z: zKeys(f, keys.map(([t, c]) => [t, c.z])),
    roll: 0,
  };
};

const Z_RIDE = 4.0 * LOCAL_PER_WORLD;
/** V4 continuity: the log-zoom rate (per frame) the dive hands to the ride at B.dive1. The dive's zoom no longer eases
 *  to a stop there (and the ride's push toward the passing cell no longer starts from rest at pass0): the push now
 *  starts at dive1 at this rate, so the zoom runs on through the boundary (mean screen flow no longer dips to a near
 *  stop at 294-299 before the ride accelerates) */
const DIVE_Z_RATE = 0.016;
/** cubic Hermite from (t0, v0, slope m0) to (t1, v1, slope m1), clamped outside */
const herm = (t0: number, t1: number, v0: number, v1: number, m0: number, m1: number, t: number) => {
  const h = t1 - t0;
  const u = clamp((t - t0) / h);
  return (2 * u ** 3 - 3 * u ** 2 + 1) * v0 + (u ** 3 - 2 * u ** 2 + u) * h * m0 + (-2 * u ** 3 + 3 * u ** 2) * v1 + (u ** 3 - u ** 2) * h * m1;
};
const rideCam = (f: number): Cam => {
  const s = camS(f);
  const h = heroCamW(f);
  const fwd = sub(onVP(VP, s + 2), onVP(VP, s));
  const fl = Math.hypot(fwd.x, fwd.y) || 1;
  // distance and depth vary: closer as the hero meets the cell (from dive1, at the dive's last zoom rate), back off as
  // the signals leave
  const push = herm(B.dive1, B.pass0 + 14, 0, 0.25, DIVE_Z_RATE, 0, f);
  const zz = Z_RIDE * (1 + push * (1 - ease(inv(B.pass1 - 10, B.pass1, f))) + 0.3 * ease(inv(B.wall0, B.decay, f)) - 0.3 * ease(inv(B.signal0, B.signal1, f)));
  const lead = 150 / zz;
  return {x: h.x + (fwd.x / fl) * lead, y: h.y + (fwd.y / fl) * lead, z: zz, roll: travelRoll(s)};
};

/** V4: the dive is anchored on the hero: its screen position runs straight from where the port-end framing holds it to
 *  where the ride holds it (well above the caption lane), while the zoom and roll ease in as in V3. The camera is solved
 *  from that, so the ride from B.dive1 on is unchanged. */
const ROT = (p: V, deg: number): V => {
  const a = (deg * Math.PI) / 180;
  return {x: p.x * Math.cos(a) - p.y * Math.sin(a), y: p.x * Math.sin(a) + p.y * Math.cos(a)};
};
const SCR_C = {x: 540, y: 960};
/** screen position of world point p (subject plane, with the camera's roll) */
export const screenOf = (c: Cam, p: V): V => add(SCR_C, mul(ROT(sub(p, c), c.roll ?? 0), c.z));
/** C2 ease (smootherstep): at rest, with no acceleration, at both ends and no acceleration step anywhere */
const smoother = (t: number) => t * t * t * (t * (6 * t - 15) + 10);
const diveCam = (f: number): Cam => {
  const a = camOpen(B.dive0 + 2);
  const b = rideCam(B.dive1);
  const t = inv(B.dive0 + 2, B.dive1, f);
  // V4 continuity: a C2 ease (smootherstep); the cubic in-out flipped its acceleration at the midpoint (a one-frame
  // jolt of the whole picture at 283/284, larger than the 299/300 hitch)
  const e = smoother(t);
  // the zoom starts from rest (as camOpen ends) and ends at the ride's push rate (DIVE_Z_RATE), not at rest: a little of
  // t^2 (slope 0 at the start, 2 at the end) mixed into the ease
  const lz = Math.log(b.z / a.z);
  const wl = clamp((DIVE_Z_RATE * (B.dive1 - B.dive0 - 2)) / (2 * lz));
  const z = a.z * Math.exp(lz * ((1 - wl) * e + wl * t * t));
  const roll = lerp(0, b.roll ?? 0, smoother(clamp((t - 0.15) / 0.85)));
  const sa = screenOf(a, heroCamW(B.dive0 + 2));
  const sb = screenOf(b, heroCamW(B.dive1));
  const s = {x: lerp(sa.x, sb.x, e), y: lerp(sa.y, sb.y, e)};
  const c = sub(heroCamW(f), mul(ROT(sub(s, SCR_C), -roll), 1 / z));
  return {x: c.x, y: c.y, z, roll};
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
    // V4 captions: half way out the band is held higher (it no longer swings down into the lane while the glass is large)
    bandAt(B.crit0 + 7, 827, 1268, 3.56),
    [B.crit0 + 14, TWO, 2.2],
    [B.tx0, add(TWO, {x: 6, y: 8}), 2.3],
    // the transmission pulse lifts off the band; the camera tilts up with it
    [B.map0, add(BAND_C, {x: -40, y: -520}), 2.4],
  ];
  // V4 captions: through the critical seconds the view sits further left in the world (one smooth shift, in from the
  // zoom-out and out again while the transmission pulse lifts the camera), so the band stays right of 'Every second
  // matters.' as it drops through the caption lane (708-714); the shift is gone by tx1 - 1, so the pulse's last two
  // frames, which the map's handoff reads (Dispatch.tsx txHandoff), are unchanged
  const shift = CRIT_SHIFT * smooth(inv(B.crit0 + 2, B.crit0 + 14, f)) * (1 - smooth(inv(B.tx0 + 8, B.tx1 - 1, f)));
  return {
    x: spline(f, keys.map(([t, p]) => [t, p.x])) - shift,
    y: spline(f, keys.map(([t, p]) => [t, p.y])),
    z: Math.exp(spline(f, keys.map(([t, , z]) => [t, Math.log(z)]))),
    roll: 0,
  };
};
/** world units the critical-seconds two-shot is shifted (the band about 165 px further right on screen; 72 -> 80 in the
 *  picture fix round: the glass passes >= 48 px right of 'matters.' (was 29), the case >= 70 px inside the frame's right
 *  edge, and the transmission pulse's slide back to centre peaks at 41 px/frame (was 39)) */
const CRIT_SHIFT = 80;

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

const ROLLBACK0 = B.pull0 + 8;
const ROLLBACK1 = B.pull0 + 24;
/** The device's turn and the section backdrop in the journey (also read by scripts/check_captions4.ts). V4 merge
 *  (anatomy + device): the backdrop rises with the device's hand clearing (S_BACK) and falls with the pull-back (as
 *  rv.backdrop); the case rolls back to face the camera WHILE the backdrop and the hand veil fade, so the hand is never
 *  seen in its back view beside a case still turned to its profile */
export const journeyDevice = (f: number) => {
  // V4 polish: on the way out the hand comes back first, at full backdrop (still below the frame), then the backdrop
  // opens out from the band as a vignette: the veil never runs over a partial backdrop
  const backdrop = clamp(inv(S_BACK0, S_BACK1, f)) * (1 - clamp(inv(ROLLBACK0 + 10, B.pull0 + 26, f)));
  const handVeil = clamp(inv(S_VEIL0, S_VEIL1, f)) * (1 - clamp(inv(ROLLBACK0, ROLLBACK0 + 10, f)));
  const rollBase = f < S_ROLL0 ? 0 : SEC_ROLL * ease(inv(S_ROLL0, B.tip1, f)) * (1 - ease(inv(ROLLBACK0, ROLLBACK1, f)));
  return {backdrop, handVeil, roll: rollBase + buzz(f) * 3.2 * Math.sin(f * 2.6)};
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
  // V4 merge (anatomy + device): the backdrop rises with the device's hand clearing (S_BACK) and falls with the
  // pull-back (as rv.backdrop); the case rolls back to face the camera WHILE the backdrop and the hand veil fade, so
  // the hand is never seen in its back view beside a case still turned to its profile
  const {backdrop, handVeil, roll} = journeyDevice(f);
  // V4 mechanism: the shutter opens, the nose advances to a light touch (small dimple), retract, then close
  const shutter = ease(inv(S_SHUT0, S_SHUT1, f)) * (1 - ease(inv(S_CLOSE0, S_CLOSE1, f)));
  const stroke = ease(inv(B.port0, B.port1, f)) * (1 - ease(inv(B.retract0, B.retract0 + 8, f)));
  const dimple = portPress(stroke, PRESS_S);
  const feedT: number[] = [];
  let inCart = 0;
  for (let k = -1; k < SENSOR_REL.n; k++) {
    const st = releaseState(SENSOR_REL, k, f);
    if (st.phase === 'feed') feedT.push(st.t);
    if (st.phase === 'cart') inCart++;
  }
  // the cut-away opens only once the case is at rest edge-on (a hard-edged wipe), and closes with the arm section
  const caseOpen = f >= S_REVEAL0 ? 1 - ease(inv(ROLLBACK0 - 8, ROLLBACK0, f)) : 0;
  const caseReveal = ease(inv(S_REVEAL0, S_REVEAL1, f));
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
  const tubeCommon = {f, px: pxs, sensors: sensorsA, sensorFront, release: SENSOR_REL, cells, s0: inRide ? hs - 900 : f < B.dive0 ? E0 - 900 : -99999, s1: inRide ? hs + 1500 : 99999};
  // the red cell the hero passes behind: it overtakes on the near side
  const occluder = {s: hs + lerp(-260, 300, ease(inv(B.pass0 + 2, B.pass0 + 26, f))), l: 18};
  const tubeSection = <VesselTube id={`${id}-vt`} path={VP} {...tubeCommon} hero={f >= B.heroRing - 12 ? hero(f) : undefined} occluder={occluder} />;

  const tr = armTrace(j);
  const dev: DeviceView = {
    screen: deviceState3(f),
    roll,
    yaw: 14,
    flip: false,
    upright: true,
    glow: 1 + 0.6 * bz,
    caseOpen,
    caseCut: () => (
      <g transform={SF.matrix}>
        <SkinDimple id={`${id}-dg`} sf={SF} amp={dimple} part="gap" />
        <PortMech id={`${id}-pm`} sf={SF} f={f} shutter={shutter} stroke={stroke} press={PRESS_S} treatLevel={1} sensorLeft={inCart / (SENSOR_REL.n + 1)} feed={feedT} reveal={caseReveal} />
      </g>
    ),
    inArm: () =>
      sectionMode ? (
        <g transform={SF.matrix}>
          {/* V4 fix: the section closes by ONE shared geometry (lib/reveal4 armLen): its elbow-side end slides down the arm
              into the band, cutting every layer (skin, fat, vessel, muscle and the rim) at the same edge, so no layer
              outlives another; the section's own opening stays full meanwhile */}
          {(() => {
            const shut = rv.armLen < 0.999;
            const X0 = SF.Xp - SEC_WIN.back;
            const X1 = SF.Xp + SEC_WIN.fwd;
            // the edge runs on past the window's wrist-side end (under the strap), so its last visible frame is a short
            // full-depth piece already sliding in under the band
            const Xe = lerp(X0, X1 + 600, 1 - rv.armLen);
            const top = Math.min(SF.dSurf(X0), SF.dSurf(X1)) - 300;
            const dep = SEC_WIN.depth;
            const rc = Math.max(0.1, Math.min(260, (dep - SF.dSurf(SF.Xp)) * 0.5, (X1 - Xe) * 0.5));
            const q = (x: number, y: number) => `${x.toFixed(1)},${y.toFixed(1)}`;
            const clipD = `M${q(Xe, top - 400)} L${q(X1 + 600, top - 400)} L${q(X1 + 600, dep + 400)} L${q(Xe + rc, dep + 400)} L${q(Xe + rc, dep)} A${rc.toFixed(1)},${rc.toFixed(1)} 0 0 1 ${q(Xe, dep - rc)} Z`;
            const edgeD = `M${q(Xe, top)} L${q(Xe, dep - rc)} A${rc.toFixed(1)},${rc.toFixed(1)} 0 0 0 ${q(Xe + rc, dep)}`;
            return (
              <>
                {shut && (
                  <defs>
                    <clipPath id={`${id}-secw`}>
                      <path d={clipD} />
                    </clipPath>
                  </defs>
                )}
                <g clipPath={shut ? `url(#${id}-secw)` : undefined}>
                  <SectionLayers id={`${id}-sec`} sf={SF} f={f} open={rv.armSec} dimple={dimple} sweep tube={tubeSection}>
                    <StreamDraw id={`${id}-st`} sf={SF} vp={VP} f={f} rel={SENSOR_REL} trace={clamp(inv(B.stream0, B.stream0 + 6, f)) * (1 - clamp(inv(B.stream1, B.retract0 + 6, f)))} />
                  </SectionLayers>
                  <PortLight id={`${id}-pl`} sf={SF} press={dimple} a={clamp(dimple / PRESS_S)} color={PAL.signal} />
                  <SkinDimple id={`${id}-dm`} sf={SF} amp={dimple} />
                </g>
                {/* the moving cut edge carries the section's own restrained rim (a thin lit bevel and a thin ink line) */}
                {shut && Xe < X1 && (
                  <>
                    <path d={edgeD} fill="none" stroke="#F8DCCB" strokeWidth={16} opacity={0.85} />
                    <path d={edgeD} fill="none" stroke="#172B3A" strokeWidth={5} opacity={0.4} />
                  </>
                )}
              </>
            );
          })()}
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
      backdrop={backdrop}
      backdropC={f >= S_BACK0 - 1 && backdrop > 0 ? W(SF.Xp - 600, 400) : BAND_C}
      handVeil={handVeil}
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
            {/* V4 fix: the same path, masked. Nothing is drawn over the band's glass (a soft-edged hole round it, so the
                emitter's glow never washes the digits; the pulse emerges past the case's top edge). On his body the ring
                and glow are clipped to the bare arm's skin (wrist to the sleeve hem), so they end at the sleeve edge and
                never cross the tee or the sleeve; once the pulse is past the hem (behind his shoulder) it is drawn again
                wherever it is clear of the tee, rising on into the air, where the map picks it up at 727 */}
            {tx > 0 && f <= B.tx1 && (() => {
              const mk = `${id}-txm`;
              const A = j.L;
              const ms = man.s;
              const hem = add(A.S, mul(sub(A.E, A.S), 0.56));
              const ua = norm(sub(A.E, A.S));
              const quad = (p: V, q: V, rp: number, rq: number) => {
                const d = norm(sub(q, p));
                const n = {x: -d.y, y: d.x};
                const pts = [add(p, mul(n, rp)), add(q, mul(n, rq)), add(q, mul(n, -rq)), add(p, mul(n, -rp))];
                return `M${pts.map((v) => `${fmt(v.x)},${fmt(v.y)}`).join(' L')} Z`;
              };
              const pc = add(BAND_C, {x: -40 * ease(tx), y: -520 * Math.pow(tx, 1.4)});
              // how far the pulse's centre is past the hem, toward the shoulder (world)
              const past = -((pc.x - hem.x) * ua.x + (pc.y - hem.y) * ua.y);
              const air = smooth(clamp(past / (30 * ms)));
              const sl0 = add(A.S, mul(ua, -40 * ms));
              const sl1 = add(hem, mul(ua, 8 * ms));
              const box = {x: fmt(BAND_C.x - 3000), y: fmt(BAND_C.y - 3000), width: 6000, height: 6000};
              const glassHole = <circle cx={fmt(GLASS_C.x)} cy={fmt(GLASS_C.y)} r={fmt(CASE_HALF_DIAG * 1.15)} fill={`url(#${mk}-g)`} />;
              const pulse = (
                <>
                  <Glow id={`${id}-txg`} c={pc} r={60 + 40 * tx} color="#39C6F4" alpha={0.8 * (1 - tx * 0.3)} />
                  <circle cx={fmt(pc.x)} cy={fmt(pc.y)} r={fmt(10 + 34 * tx)} fill="none" stroke="#BFF3FF" strokeWidth={fmt(4)} opacity={0.95} />
                  <circle cx={fmt(pc.x)} cy={fmt(pc.y)} r={fmt(6)} fill="#FFFFFF" />
                </>
              );
              return (
                <g>
                  <defs>
                    <radialGradient id={`${mk}-g`}>
                      <stop offset={0.78} stopColor="#000000" />
                      <stop offset={1} stopColor="#000000" stopOpacity={0} />
                    </radialGradient>
                    <mask id={`${mk}-a`} maskUnits="userSpaceOnUse" {...box}>
                      <path d={quad(A.W, A.E, R0.rW, R0.rE)} fill="#FFFFFF" />
                      <circle cx={fmt(A.E.x)} cy={fmt(A.E.y)} r={fmt(R0.rE)} fill="#FFFFFF" />
                      <path d={quad(A.E, hem, 23.5 * ms, 25.9 * ms)} fill="#FFFFFF" />
                      {glassHole}
                    </mask>
                    <mask id={`${mk}-b`} maskUnits="userSpaceOnUse" {...box}>
                      <rect {...box} fill="#FFFFFF" />
                      <path d={torsoPath(man)} fill="#000000" stroke="#000000" strokeWidth={fmt(16 * ms)} />
                      <path d={`M${fmt(sl0.x)},${fmt(sl0.y)} L${fmt(sl1.x)},${fmt(sl1.y)}`} stroke="#000000" strokeWidth={fmt(2 * 46 * ms)} />
                      {glassHole}
                    </mask>
                  </defs>
                  <g mask={`url(#${mk}-a)`}>{pulse}</g>
                  {air > 0.01 && (
                    <g mask={`url(#${mk}-b)`} opacity={fmt(air)}>
                      {pulse}
                    </g>
                  )}
                </g>
              );
            })()}
          </g>
        );
      })()}
    />
  );
};
