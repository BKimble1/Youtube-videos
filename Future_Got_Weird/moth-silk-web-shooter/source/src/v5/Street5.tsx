// V5 shot A: the imagined street hook, as one action. Frame 0 is inside the snap: shoulder, elbow and wrist drive the
// forearm forward and the shot erupts from the outlet at 2; the liquid crosses in 5 frames (a tapered, smeared head)
// while the camera rides it; at 7 it lands on the runner's back and spreads into strands that wrap round his torso
// and pinned arms (each band drawn out from the hit around the body); the strand draws taut at 14 and he struggles
// against the restraint (torso twist, shoulders, arms pushing on the bands, a stumble), the camera closing in; from 60
// it follows a band of the web into the material (Macro5).
// The same function runs before frame 0 (the film's last 2 s): the lead brings his hand up into firing position while
// the camera pulls out of a close-up of the device, so the end flows into frame 0.
// Three flat layers give the parallax: the lead near the lens (depth 0.55), the runner and the pavement (1), the
// street facades (2.6). Every value is a pure function of the frame.
import React from 'react';
import {Man, manJoints, ManPose, torsoPath} from './dc/Man';
import {limbGeo} from './dc/limb';
import {Cam, Layer} from './dc/camera';
import {lit, mix, shade} from './dc/color';
import {Deco, INK, Inked, InkLine} from './dc/ink';
import {add, clamp, fmt, len, lerp, lerpV, mul, norm, P as Pt, perp, rot, sub, V} from './dc/math';
import {Glow, Lin, SoftShadow} from './dc/shade';
import {mixExpr} from './dc/Head';
import {HAND_RELAXED, mixHand} from './dc/Hand';
import {BASE, EXPR_FIRE, EXPR_FOCUS, EXPR_RUN, EXPR_SHOCK, HAND_FIST, HAND_GRIP, HAND_READY, HAND_THWIP, HERO, RUNNER} from './cast5';
import {Bag, shooterGeo, WristShooter} from './props5';

export const D_NEAR = 0.55;
export const D_MID = 1;
export const D_BG = 2.6;

const sm = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const ss = (f: number, a: number, b: number) => sm((f - a) / (b - a));
const ss5 = (f: number, a: number, b: number) => {
  const x = clamp((f - a) / (b - a));
  return x * x * x * (x * (x * 6 - 15) + 10);
};

/** screen position of a point on a layer at depth d */
export const scr = (cam: Cam, d: number, p: V): V => {
  const z = 1 + (cam.z - 1) / d;
  const cx = 540 + (cam.x - 540) / d;
  const cy = 960 + (cam.y - 960) / d;
  return {x: 540 + (p.x - cx) * z, y: 960 + (p.y - cy) * z};
};
export const zOf = (cam: Cam, d: number) => 1 + (cam.z - 1) / d;

/** key frames of the hook */
export const SA = {pre: -76, fire: 2, hit: 7, taut: 14, push0: 58, end: 100};

// ---------------------------------------------------------------- the lead
export const HS = 2.1;
export const HERO0: ManPose = {...BASE, x: 930, y: 1930, s: HS, torso: 5, chest: 4, neck: -10, turn: 0.5, rW: 1, rFa: 0.66, rElb: 1, lTu: -250, lTv: 40, lElb: -1, lWr: 10};
export const polar = (o: V, a: number, r: number): V => ({x: o.x + Math.cos((a * Math.PI) / 180) * r, y: o.y + Math.sin((a * Math.PI) / 180) * r});
/** the aim: from his shoulder toward where the runner's back will be when the shot leaves (lead-layer and runner
 *  layers coincide on screen at the start) */
const aimAng = () => {
  const S = manJoints({...HERO0, rWx: 0, rWy: 0}).R.S;
  const a = attachAt(SA.fire + 3);
  return (Math.atan2(a.y - S.y, a.x - S.x) * 180) / Math.PI;
};
let AIM_CACHE: number | null = null;
const aimAngle = () => (AIM_CACHE ??= aimAng());
/** V5 arm: before -8 the hand rises from his side into firing position (cocked: elbow bent, wrist back); -8..2 the
 *  snap: the shoulder drives, the elbow extends, the wrist flicks forward and the fingers hit the trigger; a short
 *  recoil (2-8) and the aim held */
export const heroAt = (f: number) => {
  const AIM_ANG = aimAngle();
  const shoulder = manJoints({...HERO0, rWx: 0, rWy: 0}).R.S;
  // rising into position (pre-roll): a small dip (anticipation), then up
  const up = ss(f, -54, -12);
  const dip = Math.sin(clamp((f + 62) / 10) * Math.PI) * 4;
  // the snap
  const snap = ss5(f, -8, 1);
  const over = Math.sin(clamp((f - 0) / 6) * Math.PI) * (1 - clamp((f - 3) / 6)); // overshoot past the aim, settling
  const recoil = f < SA.fire ? 0 : Math.sin(clamp((f - SA.fire) / 2) * Math.PI * 0.5) * (1 - ss(f, SA.fire + 2, SA.fire + 8)) * 14;
  // from low at his side (down-left of the aim) up to a cocked position just above the aim
  const angCocked = lerp(AIM_ANG - 52, AIM_ANG + 8, up) - dip;
  const ang = lerp(angCocked, AIM_ANG, snap) - 2.5 * over;
  const r = lerp(lerp(300, 330, up), 424, snap) + 6 * over - recoil;
  const T = polar(shoulder, ang, r);
  const wr = lerp(lerp(-4, -14, up), 10, snap) - 7 * (recoil / 14) + 2 * over;
  const lean = 3 * snap * (1 - 0.5 * ss(f, 4, 14));
  const pose: ManPose = {...HERO0, rWx: T.x, rWy: T.y, rWr: wr, torso: lerp(5, 7, up) + lean, chest: lerp(4, 6, up) + lean * 0.6, neck: lerp(-8, -13, up) - 2 * snap};
  const expr = mixExpr(EXPR_FOCUS, EXPR_FIRE, ss(f, -3, 2));
  const hand = mixHand(mixHand(HAND_RELAXED, HAND_READY, ss(f, -50, -20)), HAND_THWIP, ss(f, -3, 1));
  return {pose, expr, hand, hairSway: -4 * Math.sin(clamp((f + 8) / 12) * Math.PI) + 2 * Math.sin(clamp((f - SA.fire) / 8) * Math.PI)};
};
export const heroOutlet = (f: number) => {
  const h = heroAt(f);
  const j = manJoints(h.pose);
  return shooterGeo(j.R.E, j.R.W, 17 * HS, -1);
};

// ---------------------------------------------------------------- the runner
const RS = 0.62;
/** hip x at RUN_START (staged so he is in the frame at 0, ahead of the lead's aim) */
const RUN_START = -90;
const RUN_X0 = 2240;
export const GROUND = 1330;
const R0: ManPose = {...BASE, x: 0, y: 0, s: RS, torso: 16, chest: 6, neck: -10, turn: 0.42, lElb: -1, rElb: -1, lWr: 0, rWr: 0};
/** run-cycle phase (cycles); the legs stop as the strand checks him */
const SPD = 1 / 22;
const spd = (f: number) => SPD * (1 - ss(f, SA.taut - 2, SA.taut + 4));
const phaseAt = (f: number) => {
  let p = 0.15;
  for (let g = RUN_START; g < f; g += 0.5) p += spd(g + 0.25) * 0.5;
  return p;
};
/** arm targets (torso space: u along the spine from the shoulder line, v toward his back) of the three poses */
const ARMS = {
  // running: elbows bent about 90 degrees, the arms counter-swing with the legs (hand 250-270 units from the
  // shoulder; the arm is 377); the right hand carries the bag low at his side
  runL: (aL: number) => ({u: lerp(-235, -150, aL), v: lerp(110, -200, aL)}),
  runR: (aL: number) => ({u: lerp(-305, -290, aL), v: lerp(70, 130, aL)}),
  // impact: the free (near) forearm comes forward, clear of the torso; the bag arm stays down
  hitL: {u: -150, v: -215},
  hitR: {u: -310, v: 105},
  // caught: the web's pull brings the upper arms in to his sides; elbows keep a soft bend
  caughtL: {u: -345, v: -22},
  caughtR: {u: -345, v: 60},
};
const lerpT = (a: {u: number; v: number}, b: {u: number; v: number}, t: number) => ({u: lerp(a.u, b.u, t), v: lerp(a.v, b.v, t)});
const runLimbs = (ph: number, f: number): Partial<ManPose> => {
  const th = ph * 2 * Math.PI;
  const thR = th + Math.PI;
  const knee = (t: number) => 14 + 70 * Math.max(0, Math.cos(t)) ** 1.4;
  const arm = (t: number) => (1 - Math.sin(t)) / 2; // 1 = forward when that leg is back
  const aL = arm(th);
  const k = ss(f, SA.taut - 1, SA.taut + 4); // the strand checks him
  const step = ss(f, SA.taut + 2, SA.taut + 9); // recovery step (far leg back)
  const lift = Math.sin(clamp((f - SA.taut - 2) / 7) * Math.PI);
  // body first: chest and shoulder react at the hit and at the check; the arms follow with a small lag (2 frames)
  const hitK = ss(f, SA.hit + 1, SA.hit + 5) * (1 - ss(f, SA.taut, SA.taut + 5));
  const caught = ss(f, SA.taut + 1, SA.taut + 7);
  const armHit = ss(f, SA.hit + 2, SA.hit + 6);
  let L = ARMS.runL(aL);
  let R = ARMS.runR(aL);
  L = lerpT(L, ARMS.hitL, armHit);
  R = lerpT(R, ARMS.hitR, armHit);
  L = lerpT(L, ARMS.caughtL, caught);
  R = lerpT(R, ARMS.caughtR, caught);
  // V5 struggle against the restraint: irregular twists of the torso and shoulders, the arms pushing out against the
  // bands and being held, the head turning, a shuffle of the feet (sums of a few slow sines, no springy bounce)
  const st = ss(f, SA.taut + 2, SA.taut + 8);
  const t = f - SA.taut;
  const w = (a: number, b: number, c: number) => Math.sin(t * a + b) * c;
  return {
    lHip: lerp(26 * Math.sin(th), 22, k) + st * w(0.27, 0.4, 5),
    lKnee: lerp(knee(th), 14, k) + st * Math.max(0, w(0.27, 0.4, 10)),
    rHip: lerp(26 * Math.sin(thR), lerp(-22, -36, step), k) + st * w(0.27, 2.0, 4),
    rKnee: lerp(knee(thR), 26 + 40 * lift, k) + st * Math.max(0, w(0.27, 2.0, 8)),
    lTu: L.u + st * w(0.41, 0.0, 14),
    lTv: L.v + st * (w(0.37, 1.1, 22) - 6),
    rTu: R.u + st * w(0.43, 2.2, 12),
    rTv: R.v + st * w(0.33, 0.3, 16),
    torso: lerp(16, -6, k) + 4 * hitK + 3 * lift + st * (w(0.31, 0.2, 7) + w(0.71, 1.0, 2)),
    chest: lerp(6, -5, k) - 3 * hitK + st * w(0.45, 0.6, 5),
    neck: lerp(-10, 4, k) + st * w(0.5, 2.1, 9),
    turn: lerp(0.42, 0.12, ss(f, SA.taut + 1, SA.taut + 6)) + st * w(0.25, 0.9, 0.08),
  };
};
/** world pose with the stance foot (the lower ankle) kept planted: the hips move only as the legs carry them */
const runnerCache = new Map<number, {pose: ManPose; plant: V}>();
const rawCache = new Map<number, number>();
/** the stance-planted hip x before any smoothing */
const runnerRawX = (f: number): number => {
  const key = Math.round(f * 100);
  const c = rawCache.get(key);
  if (c !== undefined) return c;
  let hip: V = {x: RUN_X0, y: 0};
  let stance: 'l' | 'r' | null = null;
  let plant: V = {x: 0, y: GROUND};
  for (let g = RUN_START; g <= f + 1e-6; g += 0.5) {
    const gg = Math.min(g, f);
    const rel: ManPose = {...R0, ...runLimbs(phaseAt(gg), gg)};
    const j = manJoints(rel);
    const s = (st: 'l' | 'r') => (st === 'l' ? j.lLeg.A : j.rLeg.A);
    const st = Math.cos(phaseAt(gg) * 2 * Math.PI) < 0 ? 'l' : 'r';
    if (st !== stance) {
      plant = {x: hip.x + s(st).x, y: GROUND};
      stance = st;
    }
    hip = {x: plant.x - s(st).x, y: 0};
    if (g >= f) break;
  }
  rawCache.set(key, hip.x);
  return hip.x;
};
export const runnerAt = (f: number): ManPose => {
  const key = Math.round(f * 100);
  const hit = runnerCache.get(key);
  if (hit) return hit.pose;
  let hip: V = {x: RUN_X0, y: 0};
  let stance: 'l' | 'r' | null = null;
  let plant: V = {x: 0, y: GROUND};
  let pose: ManPose = R0;
  for (let g = RUN_START; g <= f + 1e-6; g += 0.5) {
    const gg = Math.min(g, f);
    const rel: ManPose = {...R0, ...runLimbs(phaseAt(gg), gg)};
    const j = manJoints(rel);
    const sole = (A: V) => ({x: A.x, y: A.y + 30 * RS});
    const sl = sole(j.lLeg.A);
    const sr = sole(j.rLeg.A);
    // the left foot carries him while its leg sweeps from front to back (cos of its phase angle < 0)
    const st = gg > SA.taut + 1 || Math.cos(phaseAt(gg) * 2 * Math.PI) < 0 ? 'l' : 'r';
    const s = st === 'l' ? sl : sr;
    if (st !== stance) {
      plant = {x: hip.x + s.x, y: GROUND};
      stance = st;
    }
    // V4: the height comes from whichever foot is lowest, so the hips never pop when the stance changes hands
    hip = {x: plant.x - s.x, y: GROUND - Math.max(sl.y, sr.y)};
    pose = {...rel, x: hip.x, y: hip.y};
    if (g >= f) break;
  }
  // V4: the stance hand-over makes the hips surge and stall within each stride; their travel is averaged over a
  // stride window (the feet may slip a few px), the bob stays as the legs give it
  if (f <= CATCH0) {
    let sx = 0;
    for (let k = -4; k <= 4; k++) sx += runnerRawX(f + k);
    pose = {...pose, x: sx / 9};
  }
  // V4: from just before the check the hips follow a smooth path instead of the stance hand-over (which jumps when
  // the legs stop): he decelerates over 6 frames, then the strand pulls him back a little toward the lead
  if (f > CATCH0) {
    const p0 = runnerAt(CATCH0);
    const v0 = p0.x - runnerAt(CATCH0 - 1).x;
    const D = 6;
    const t = Math.min(f - CATCH0, D);
    const x = p0.x + v0 * (t - (t * t) / (2 * D)) + 26 * ss(f, SA.taut, SA.taut + 6);
    pose = {...pose, x, y: lerp(p0.y, pose.y, ss(f, CATCH0, CATCH0 + 4))};
  }
  runnerCache.set(key, {pose, plant});
  return pose;
};
const CATCH0 = SA.taut - 4;
export const runnerExpr = (f: number) => mixExpr(EXPR_RUN, EXPR_SHOCK, ss(f, SA.hit + 2, SA.hit + 6) * 0.6 + 0.4 * ss(f, SA.taut, SA.taut + 4));
const bagSwing = (f: number) => {
  const ph = phaseAt(f);
  const run = 16 + 12 * Math.sin(ph * 4 * Math.PI - 0.8);
  const t = f - SA.taut;
  const yank = t <= 0 ? 0 : -40 * Math.sin(Math.min(t / 4, 1) * Math.PI * 0.5) * Math.exp(-Math.max(0, t - 4) / 7);
  return lerp(run, 0, ss(f, SA.taut, SA.taut + 4)) + yank;
};

/** torso-local point (u up the spine from the waist, v toward his back) in world coordinates */
const tloc = (p: ManPose, u: number, v: number) => {
  const j = manJoints(p);
  const a = j.tc;
  const up = {x: -Math.sin((a * Math.PI) / 180), y: -Math.cos((a * Math.PI) / 180)};
  const px = {x: Math.cos((a * Math.PI) / 180), y: -Math.sin((a * Math.PI) / 180)};
  return add(j.C, add(mul(up, u * p.s), mul(px, v * p.s)));
};
/** the attachment on his upper back (torso-local) */
export const ATT = {u: 118, v: 52};
export const attachAt = (f: number) => tloc(runnerAt(f), ATT.u, ATT.v);

// ---------------------------------------------------------------- the web on the jacket
type Strand = {a: number; len: number; bend: number; delay: number; branch?: {at: number; a: number; len: number}};
const STRANDS: Strand[] = [
  {a: 4, len: 104, bend: 12, delay: 0, branch: {at: 0.55, a: 36, len: 40}},
  {a: 58, len: 88, bend: -10, delay: 0.5},
  {a: 104, len: 120, bend: 14, delay: 0.2, branch: {at: 0.6, a: -32, len: 38}},
  {a: 168, len: 96, bend: -12, delay: 0.7, branch: {at: 0.5, a: 30, len: 34}},
  {a: 214, len: 112, bend: 11, delay: 0.3},
  {a: 268, len: 82, bend: -8, delay: 0.9},
  {a: 318, len: 100, bend: 10, delay: 0.4, branch: {at: 0.55, a: -28, len: 36}},
];
/** overall size of the web on the jacket */
const WEB_K = 1.0;
/** V4: the strands grow out one after another over about 9 frames (each in 5, starting 0-4 frames after the hit) */
const spreadAt = (f: number, i: number) => {
  const d = STRANDS[i].delay * 4;
  const x = clamp((f - SA.hit - d) / 5);
  return 1 - (1 - x) ** 3;
};
/** sparse, irregular cross-links between neighbouring strands (pairs i, i+1 at their own radii): no rings */
const LINKS: {i: number; r1: number; r2: number; sag: number}[] = [
  {i: 0, r1: 0.45, r2: 0.4, sag: 0.2}, {i: 0, r1: 0.82, r2: 0.7, sag: 0.12},
  {i: 1, r1: 0.6, r2: 0.52, sag: 0.18},
  {i: 2, r1: 0.36, r2: 0.44, sag: 0.22},
  {i: 3, r1: 0.62, r2: 0.55, sag: 0.16},
  {i: 4, r1: 0.4, r2: 0.48, sag: 0.24},
  {i: 5, r1: 0.7, r2: 0.6, sag: 0.12},
  {i: 6, r1: 0.5, r2: 0.42, sag: 0.18},
];
const tightAt = (f: number) => ss(f, SA.hit + 7, SA.taut + 3);

/** the web's local frame on the jacket: L maps web-local (x across the torso, y down the spine) to world */
const webFrame = (f: number, pose: ManPose) => {
  const s = pose.s;
  const j = manJoints(pose);
  const a0 = j.tc;
  const c = tloc(pose, ATT.u, ATT.v);
  const ex = {x: Math.cos((a0 * Math.PI) / 180), y: -Math.sin((a0 * Math.PI) / 180)};
  const ey = {x: Math.sin((a0 * Math.PI) / 180), y: Math.cos((a0 * Math.PI) / 180)};
  // the back is seen obliquely: across the torso the web is compressed
  const L = (x: number, y: number) => add(c, add(mul(ex, x * 0.95 * s * WEB_K), mul(ey, y * 0.66 * s * WEB_K)));
  const tight = tightAt(f);
  return {s, j, a0, c, L, tight, shrink: 1 - 0.07 * tight, w: 4.2 * s};
};
/** a point and tangent (world) at fraction t along radial strand i of the web */
export const radialAt = (f: number, i: number, t: number) => {
  const pose = runnerAt(f);
  const W = webFrame(f, pose);
  const st = STRANDS[i];
  const r = st.len * spreadAt(f, i) * W.shrink;
  const ar = (st.a * Math.PI) / 180;
  const dir = {x: Math.cos(ar), y: Math.sin(ar)};
  const n = {x: -dir.y, y: dir.x};
  const bend = st.bend * (1 - 0.8 * W.tight);
  const P0 = W.L(0, 0);
  const P1 = W.L(dir.x * r * 0.5 + n.x * bend, dir.y * r * 0.5 + n.y * bend);
  const P2 = W.L(dir.x * r, dir.y * r);
  const q = (u: number) => add(add(mul(P0, (1 - u) ** 2), mul(P1, 2 * u * (1 - u))), mul(P2, u * u));
  const p = q(t);
  const tan = norm(sub(q(Math.min(1, t + 0.01)), q(Math.max(0, t - 0.01))));
  return {p, tan, w: W.w, q};
};

export const WebSplat: React.FC<{id: string; f: number; pose: ManPose; ink: number}> = ({id, f, pose, ink}) => {
  if (f < SA.hit) return null;
  const {s, j, a0, c, L, tight, shrink} = webFrame(f, pose);
  const ends: V[] = [];
  const paths: string[] = [];
  const thin: string[] = [];
  STRANDS.forEach((st, i) => {
    const sp = spreadAt(f, i);
    const r = st.len * sp * shrink;
    const ar = (st.a * Math.PI) / 180;
    const dir = {x: Math.cos(ar), y: Math.sin(ar)};
    const n = {x: -dir.y, y: dir.x};
    const bend = st.bend * (1 - 0.8 * tight);
    const end = {x: dir.x * r, y: dir.y * r};
    const m1 = {x: dir.x * r * 0.33 + n.x * bend, y: dir.y * r * 0.33 + n.y * bend};
    const m2 = {x: dir.x * r * 0.7 - n.x * bend * 0.6, y: dir.y * r * 0.7 - n.y * bend * 0.6};
    ends.push(end);
    paths.push(`M${Pt(L(0, 0))} C${Pt(L(m1.x, m1.y))} ${Pt(L(m2.x, m2.y))} ${Pt(L(end.x, end.y))}`);
    if (st.branch && sp > st.branch.at) {
      const b = st.branch;
      const bs = clamp((sp - b.at) / (1 - b.at));
      const o = {x: dir.x * st.len * shrink * b.at, y: dir.y * st.len * shrink * b.at};
      const ba = ar + (b.a * Math.PI) / 180;
      const bl = b.len * bs * shrink;
      thin.push(`M${Pt(L(o.x, o.y))} L${Pt(L(o.x + Math.cos(ba) * bl, o.y + Math.sin(ba) * bl))}`);
    }
  });
  // cross-links: each appears (drawn out from one strand to its neighbour) once both strands have passed it
  const links: string[] = [];
  LINKS.forEach((lk) => {
    const k = (lk.i + 1) % STRANDS.length;
    const A = STRANDS[lk.i];
    const B = STRANDS[k];
    if (spreadAt(f - 1.5, lk.i) < lk.r1 || spreadAt(f - 1.5, k) < lk.r2) return;
    const grow = clamp((f - SA.hit - Math.max(A.delay, B.delay) * 4 - 5 * Math.max(lk.r1, lk.r2) - 1) / 2.5);
    const a1 = (A.a * Math.PI) / 180;
    const a2 = (B.a * Math.PI) / 180;
    const p1 = {x: Math.cos(a1) * A.len * lk.r1 * shrink, y: Math.sin(a1) * A.len * lk.r1 * shrink};
    const p2full = {x: Math.cos(a2) * B.len * lk.r2 * shrink, y: Math.sin(a2) * B.len * lk.r2 * shrink};
    const p2 = {x: p1.x + (p2full.x - p1.x) * grow, y: p1.y + (p2full.y - p1.y) * grow};
    const m = {x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2};
    const sag = lk.sag * (1 - 0.8 * tight);
    const mm = {x: m.x * (1 - sag), y: m.y * (1 - sag)};
    links.push(`M${Pt(L(p1.x, p1.y))} Q${Pt(L(mm.x, mm.y))} ${Pt(L(p2.x, p2.y))}`);
  });
  // the impact: the liquid head flattens into a small, irregular adhesive dab (no big white disc)
  const sq = clamp((f - SA.hit) / 3);
  const padR = lerp(5, 9, sq) * s;
  const padC = mix('#F6D77A', '#FFF8E2', ss(f, SA.hit + 1, SA.hit + 6));
  // jacket creases where the strands pull on it (they appear as the web tightens and the strand checks him)
  const crease = ss(f, SA.hit + 2, SA.taut + 4);
  const creases = [20, 110, 200, 290].map((ad) => {
    const ar = (ad * Math.PI) / 180;
    const r0 = 24;
    const r1 = 52;
    return `M${Pt(L(Math.cos(ar + 0.25) * r0, Math.sin(ar + 0.25) * r0))} Q${Pt(L(Math.cos(ar + 0.12) * 38, Math.sin(ar + 0.12) * 38))} ${Pt(L(Math.cos(ar) * r1, Math.sin(ar) * r1))}`;
  });
  const clipD = torsoPath(pose);
  const armD = limbGeo(j.L.S, j.L.E, j.L.W, 29 * s, 23.5 * s, 21 * s).d;
  const w = 4.2 * s;
  return (
    <g>
      <defs>
        <clipPath id={`${id}-tc`}>
          <path d={clipD} />
          <path d={armD} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-tc)`}>
        {crease > 0.01 && creases.map((d, i) => <path key={i} d={d} fill="none" stroke={shade(RUNNER.shirt, 0.5)} strokeWidth={fmt(3 * s)} strokeLinecap="round" opacity={0.55 * crease} />)}
        {/* soft shadow of the web on the jacket */}
        <g opacity={0.35} transform={`translate(${fmt(2 * s)} ${fmt(3 * s)})`}>
          {[...paths, ...links].map((d, i) => (
            <path key={i} d={d} fill="none" stroke="#14201C" strokeWidth={fmt(w * 1.6)} strokeLinecap="round" />
          ))}
        </g>
        {[...paths, ...links, ...thin].map((d, i) => (
          <path key={`k${i}`} d={d} fill="none" stroke={INK} strokeWidth={fmt(w + ink * 0.7)} strokeLinecap="round" opacity={0.85} />
        ))}
        {paths.map((d, i) => (
          <path key={`w${i}`} d={d} fill="none" stroke="#F5F1E4" strokeWidth={fmt(w)} strokeLinecap="round" />
        ))}
        {links.map((d, i) => (
          <path key={`l${i}`} d={d} fill="none" stroke="#F4F7FA" strokeWidth={fmt(w * 0.72)} strokeLinecap="round" />
        ))}
        {thin.map((d, i) => (
          <path key={`t${i}`} d={d} fill="none" stroke="#F4F7FA" strokeWidth={fmt(w * 0.6)} strokeLinecap="round" />
        ))}
        {/* small adhesive beads where strands meet the cloth */}
        {ends.map((e, i) => {
          const p = L(e.x, e.y);
          return spreadAt(f, i) > 0.85 ? <circle key={`e${i}`} cx={fmt(p.x)} cy={fmt(p.y)} r={fmt(w * 0.9)} fill="#FFF8E2" stroke={INK} strokeWidth={fmt(ink * 0.35)} /> : null;
        })}
      </g>
      {(() => {
        // an irregular dab: a wobbly outline round the impact point, slightly compressing the cloth under it
        const N = 9;
        const pts = Array.from({length: N}, (_, i) => {
          const a = (i / N) * Math.PI * 2;
          const r = padR * (1 + 0.28 * Math.sin(i * 2.7 + 1.3));
          return add(c, {x: Math.cos(a) * r * 1.15, y: Math.sin(a) * r * 0.85});
        });
        const d = `M${pts.map(Pt).join(' L')} Z`;
        return (
          <g>
            <ellipse cx={fmt(c.x + 1.5 * s)} cy={fmt(c.y + 2 * s)} rx={fmt(padR * 1.8)} ry={fmt(padR * 1.3)} fill="#14201C" opacity={0.2 * sq} />
            <path d={d} fill={padC} stroke={INK} strokeWidth={fmt(ink * 0.5)} strokeLinejoin="round" />
          </g>
        );
      })()}
    </g>
  );
};

// ---------------------------------------------------------------- V5: bands wrapping round the torso and arms
/** bands (torso-local: u height above the waist line, sag of the arc), each drawn out from near the hit round the body */
const BANDS = [
  {u: 120, bow: 12, start: 1},
  {u: 78, bow: 14, start: 3},
  {u: 34, bow: 15, start: 4.5},
  {u: -12, bow: 13, start: 6.5},
];
const BAND_V = 118;
export const bandPoint = (f: number, i: number, t: number) => {
  // t in -1..1 across the body (v = t * BAND_V), the arc sags toward the front of the torso
  const pose = runnerAt(f);
  const b = BANDS[i];
  const tight = 1 - 0.35 * ss(f, SA.taut, SA.taut + 5);
  return tloc(pose, b.u - b.bow * tight * (1 - t * t), t * BAND_V);
};
export const WrapBands: React.FC<{id: string; f: number; pose: ManPose; ink: number}> = ({id, f, pose, ink}) => {
  if (f < SA.hit) return null;
  const j = manJoints(pose);
  const s = pose.s;
  const clipD = torsoPath(pose);
  const armL = limbGeo(j.L.S, j.L.E, j.L.W, 30 * s, 24.5 * s, 22 * s).d;
  const armR = limbGeo(j.R.S, j.R.E, j.R.W, 30 * s, 24.5 * s, 22 * s).d;
  const out: React.ReactNode[] = [];
  BANDS.forEach((b, i) => {
    const g = clamp((f - SA.hit - b.start) / 5);
    if (g <= 0) return;
    const grow = 1 - (1 - g) ** 3;
    // drawn out from v = ATT.v / BAND_V (near the hit) to both sides
    const t0 = ATT.v / BAND_V;
    const a = Math.max(-1, t0 - 2 * grow);
    const c = Math.min(1, t0 + 2 * grow);
    const N = 18;
    const pts = Array.from({length: N + 1}, (_, k) => bandPoint(f, i, a + ((c - a) * k) / N));
    const left: V[] = [];
    const right: V[] = [];
    pts.forEach((p, k) => {
      const q0 = pts[Math.max(0, k - 1)];
      const q1 = pts[Math.min(N, k + 1)];
      const nrm = perp(norm(sub(q1, q0)));
      // thickness varies: fuller in the middle, thin where it wraps out of sight
      const u = k / N;
      const wd = s * (1.6 + 2.6 * Math.sin(u * Math.PI)) * (0.85 + 0.15 * Math.sin(k * 1.7 + i));
      left.push(add(p, mul(nrm, wd)));
      right.push(add(p, mul(nrm, -wd)));
    });
    const d = `M${left.map(Pt).join(' L')} L${right.reverse().map(Pt).join(' L')} Z`;
    out.push(
      <g key={i}>
        <path d={d} transform={`translate(${fmt(1.6 * s)} ${fmt(2.4 * s)})`} fill="#14201C" opacity={0.3} />
        <path d={d} fill="#F4EFE1" stroke={INK} strokeWidth={fmt(ink * 0.45)} strokeLinejoin="round" />
        <path d={`M${pts.map((p) => Pt(add(p, {x: -0.6 * s, y: -1.2 * s}))).join(' L')}`} fill="none" stroke="#FFFFFF" strokeWidth={fmt(0.9 * s)} opacity={0.7} />
      </g>,
    );
  });
  return (
    <g>
      <defs>
        <clipPath id={`${id}-bc`}>
          <path d={clipD} />
          <path d={armL} />
          <path d={armR} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-bc)`}>{out}</g>
    </g>
  );
};

// ---------------------------------------------------------------- the camera
const C0: Cam = {x: 540, y: 960, z: 1};
const HOLD_Z = 3.0;
/** framing of the runner after the hit: the attachment at (520, 840) on screen */
function holdCamFor(f: number): Cam {
  return holdCam(f, HOLD_Z + 0.2 * ss(f, SA.hit, SA.end));
}
function heroOutletAt(f: number) {
  return heroOutlet(f).outlet;
}
const holdCam = (f: number, z: number): Cam => {
  const a = attachAt(f);
  return {x: a.x - (650 - 540) / z, y: a.y - (800 - 960) / z, z};
};
/** V4 frame 0: tighter on the wrist shooter with the runner ahead in the same frame (the near layer at about 1.7x) */
export const CAM0: Cam = {x: 470, y: 975, z: 1.38};
const nearCamS = (c: V, zn: number): Cam => ({x: 540 + (c.x - 540) * D_NEAR, y: 960 + (c.y - 960) * D_NEAR, z: 1 + (zn - 1) * D_NEAR});
const camC = (c: Cam) => ({x: 540 + (c.x - 540) / D_NEAR, y: 960 + (c.y - 960) / D_NEAR, zn: 1 + (c.z - 1) / D_NEAR});
/** V5 pre-roll: a close-up of the device (centred a little ahead of the band so the outlet and cartridge share the
 *  frame), pulling out into frame 0's framing while the hand rises into firing position */
export const PRE_ZN = 6.2;
export const preFocus = (f: number) => {
  const g = heroOutlet(f);
  return add(lerpV(g.band, g.outlet, 0.45), {x: 0, y: -8});
};
export const streetCam = (f: number): Cam => {
  if (f < -3) {
    const u = ss5(f, -44, -3);
    const c0 = camC(CAM0);
    const zn = Math.exp(lerp(Math.log(PRE_ZN), Math.log(c0.zn), u));
    const w = (1 / zn - 1 / PRE_ZN) / (1 / c0.zn - 1 / PRE_ZN);
    const c = lerpV(preFocus(Math.max(f, SA.pre)), {x: c0.x, y: c0.y}, w);
    return nearCamS(c, zn);
  }
  if (f < SA.fire) return CAM0;
  // ride along the jet to the runner (log-zoom so the push feels like travel), then hold on him, closing in as he
  // struggles; from push0 the camera follows a band of the web in toward its material
  const u = ss5(f, SA.fire, SA.hit + 1);
  const z1 = HOLD_Z + 0.55 * ss(f, SA.hit + 4, SA.push0);
  const target = holdCam(f <= SA.hit ? f : Math.max(SA.hit, f - 1.5), z1);
  const z = Math.exp(lerp(Math.log(CAM0.z), Math.log(target.z), u));
  const w = Math.abs(1 / target.z - 1 / CAM0.z) > 1e-4 ? (1 / z - 1 / CAM0.z) / (1 / target.z - 1 / CAM0.z) : u;
  const ride: Cam = {x: lerp(CAM0.x, target.x, w), y: lerp(CAM0.y, target.y, w), z};
  if (f < SA.push0) return ride;
  const P = bandPoint(f, 1, 0.12);
  const v = (f - SA.push0) / (SA.end - SA.push0);
  const uz = v * v * (3 - 2 * v) * 0.6 + 0.4 * v * v;
  const zz = Math.exp(lerp(Math.log(ride.z), Math.log(70), uz));
  const ww = (1 / zz - 1 / ride.z) / (1 / 70 - 1 / ride.z);
  return {x: lerp(ride.x, P.x, ww), y: lerp(ride.y, P.y, ww), z: zz};
};

// ---------------------------------------------------------------- the jet and the strand (screen space)
/** jet head progress 0..1 from the outlet to the jacket */
const flight = (f: number) => clamp((f - SA.fire) / (SA.hit - SA.fire)); // no easing into the target
export const strandEnds = (f: number) => {
  const cam = streetCam(f);
  const o = scr(cam, D_NEAR, heroOutlet(f).outlet);
  const a = scr(cam, D_MID, attachAt(f));
  return {o, a, cam};
};

const ribbonPath = (pts: V[], w0: number, w1: number) => {
  const left: V[] = [];
  const right: V[] = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const n = perp(norm(sub(b, a)));
    const w = lerp(w0, w1, i / (pts.length - 1)) / 2;
    left.push(add(p, mul(n, w)));
    right.push(add(p, mul(n, -w)));
  });
  return `M${left.map(Pt).join(' L')} L${right.reverse().map(Pt).join(' L')} Z`;
};
const Ribbon: React.FC<{pts: V[]; w0: number; w1: number; color: string; ink: number; opacity?: number}> = ({pts, w0, w1, color, ink, opacity = 1}) => {
  if (pts.length < 2) return null;
  const left: V[] = [];
  const right: V[] = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const n = perp(norm(sub(b, a)));
    const w = lerp(w0, w1, i / (pts.length - 1)) / 2;
    left.push(add(p, mul(n, w)));
    right.push(add(p, mul(n, -w)));
  });
  const d = `M${left.map(Pt).join(' L')} L${right.reverse().map(Pt).join(' L')} Z`;
  return (
    <g opacity={opacity}>
      <path d={d} fill={INK} stroke={INK} strokeWidth={fmt(ink)} strokeLinejoin="round" />
      <path d={d} fill={color} />
    </g>
  );
};

const Jet: React.FC<{f: number}> = ({f}) => {
  if (f < SA.fire) return null;
  const {o, a, cam} = strandEnds(f);
  const zM = zOf(cam, D_MID);
  const zN = zOf(cam, D_NEAR);
  const u = flight(f);
  const d = sub(a, o);
  const n = perp(norm(d));
  // the path bows a little upward (the jet is thrown, then falls onto him)
  const bow = (t: number) => -Math.sin(t * Math.PI) * len(d) * 0.05;
  const at = (t: number) => add(lerpV(o, a, t), mul(n, bow(t) * (norm(d).x < 0 ? -1 : 1)));
  // V5 eruption: a burst of liquid fanning from the outlet for the first frames of the shot
  const er = f - SA.fire;
  const burst =
    er < 6 ? (
      <g opacity={1 - er / 6}>
        {[-1, -0.5, 0, 0.5, 1].map((k, i) => {
          const dd = norm(sub(a, o));
          const dir = {x: dd.x * Math.cos(k * 0.22) - dd.y * Math.sin(k * 0.22), y: dd.x * Math.sin(k * 0.22) + dd.y * Math.cos(k * 0.22)};
          const L = (40 + 26 * er) * zN * (1 - 0.3 * Math.abs(k)) * 0.6;
          const p1 = add(o, mul(dir, L));
          const p0 = add(o, mul(dir, L * 0.15));
          return (
            <g key={i}>
              <path d={`M${Pt(p0)} L${Pt(p1)}`} stroke={INK} strokeWidth={fmt((9 - Math.abs(k) * 4) * zN * 0.6 + 2)} strokeLinecap="round" />
              <path d={`M${Pt(p0)} L${Pt(p1)}`} stroke={i === 2 ? '#FFF6DA' : '#F6D77A'} strokeWidth={fmt((9 - Math.abs(k) * 4) * zN * 0.6)} strokeLinecap="round" />
            </g>
          );
        })}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const dd = norm(sub(a, o));
          const ang = (i - 2.5) * 0.3;
          const dir = {x: dd.x * Math.cos(ang) - dd.y * Math.sin(ang), y: dd.x * Math.sin(ang) + dd.y * Math.cos(ang)};
          const p = add(o, mul(dir, (20 + 30 * er) * zN * (0.7 + 0.1 * i)));
          return <circle key={`d${i}`} cx={fmt(p.x)} cy={fmt(p.y)} r={fmt((3 + (i % 3)) * zN * 0.5)} fill="#F6D77A" stroke={INK} strokeWidth={1.5} />;
        })}
        <circle cx={fmt(o.x)} cy={fmt(o.y)} r={fmt(16 * zN * (1 - er / 8))} fill="#FFF6DA" opacity={0.7} />
      </g>
    ) : null;
  if (f < SA.hit) {
    const head = at(u);
    const N = 24;
    const pts = Array.from({length: N + 1}, (_, i) => at((u * i) / N));
    const hd = norm(sub(head, at(Math.max(0, u - 0.03))));
    const hr = lerp(30, 24, u) * (0.75 + 0.25 * zM);
    const tip = add(head, mul(hd, hr * 2.6));
    const back = add(head, mul(hd, -hr * 1.2));
    const hn = perp(hd);
    const drop = `M${Pt(tip)} Q${Pt(add(head, mul(hn, hr * 1.1)))} ${Pt(add(back, mul(hn, hr * 0.8)))} Q${Pt(add(back, mul(hd, -hr * 0.9)))} ${Pt(add(back, mul(hn, -hr * 0.8)))} Q${Pt(add(head, mul(hn, -hr * 1.1)))} ${Pt(tip)} Z`;
    return (
      <g>
        {burst}
        {/* the column behind the head: still liquid gold near the head, a white fibre behind */}
        <Ribbon pts={pts} w0={11} w1={hr * 0.62} color="#FBF3DC" ink={3.5} />
        {/* speed smear: short trailing filaments behind the head */}
        {[-1, 0, 1].map((k) => {
          const s0 = add(back, mul(hn, k * hr * 0.55));
          const s1 = add(s0, mul(hd, -hr * (8 + 3 * Math.abs(k))));
          return <path key={k} d={`M${Pt(s0)} L${Pt(s1)}`} stroke="#FFF1C4" strokeWidth={fmt(hr * 0.28)} strokeLinecap="round" opacity={0.6 - 0.15 * Math.abs(k)} />;
        })}
        <path d={drop} fill="#F6D77A" stroke={INK} strokeWidth={3} />
        <ellipse cx={fmt(head.x - hn.x * hr * 0.3)} cy={fmt(head.y - hn.y * hr * 0.3)} rx={fmt(hr * 0.7)} ry={fmt(hr * 0.3)} transform={`rotate(${fmt((Math.atan2(hd.y, hd.x) * 180) / Math.PI)} ${fmt(head.x - hn.x * hr * 0.3)} ${fmt(head.y - hn.y * hr * 0.3)})`} fill="#FFFFFF" opacity={0.85} />
      </g>
    );
  }
  const g = mainStrand(f);
  return (
    <g>
      {burst}
      <Ribbon pts={g.pts} w0={g.w0} w1={g.w1} color="#FBF8F0" ink={3 * Math.sqrt(Math.max(1, g.zM / 3))} />
    </g>
  );
};
/** the main strand after the hit (screen space): slack at first, taut when it checks him */
export const mainStrand = (f: number) => {
  const {o, a, cam} = strandEnds(f);
  const zM = zOf(cam, D_MID);
  const d = sub(a, o);
  const slack = (1 - ss(f, SA.hit + 4, SA.taut)) * 0.06 + 0.004;
  const N = 28;
  // points are denser toward the pad, where the camera goes in
  const pts = Array.from({length: N + 1}, (_, i) => {
    const t = 1 - (1 - i / N) ** 3;
    return add(lerpV(o, a, t), {x: 0, y: Math.sin(t * Math.PI) * len(d) * slack});
  });
  return {pts, w0: 9, w1: 7 * RS * zM, cam, zM};
};

// ---------------------------------------------------------------- the street
export const Facades: React.FC<{id: string}> = ({id}) => (
  <g>
    <Lin id={`${id}-sky`} d="M-900,-1400 h2900 v1500 h-2900 Z" from={{x: 0, y: -1400}} to={{x: 0, y: 200}} stops={[[0, '#5B6E93'], [0.6, '#E9A884'], [1, '#F5C99A']]} />
    {/* left block: terracotta, lit and dark windows */}
    <path d="M-900,-900 L600,-900 L600,1010 L-900,1010 Z" fill="#B9614E" />
    <path d="M520,-900 L600,-900 L600,1010 L520,1010 Z" fill={shade('#B9614E', 0.25)} />
    {Array.from({length: 5}).map((_, r) =>
      Array.from({length: 6}).map((_, c) => {
        const x = -780 + c * 220;
        const y = -760 + r * 300;
        const litW = (r * 7 + c * 3) % 5 < 2;
        return <rect key={`${r}-${c}`} x={x} y={y} width={120} height={170} rx={8} fill={litW ? '#FFD98A' : '#3F5566'} stroke={shade('#B9614E', 0.5)} strokeWidth={10} />;
      }),
    )}
    {/* right block: grey-teal, a lit shop window and a coral awning at street level */}
    <path d="M640,-900 L2000,-900 L2000,1010 L640,1010 Z" fill="#5F8C94" />
    <path d="M-900,1000 L2000,1000 L2000,2600 L-900,2600 Z" fill="#9A9088" />
    {Array.from({length: 3}).map((_, r) =>
      Array.from({length: 5}).map((_, c) => {
        const x = 700 + c * 240;
        const y = -740 + r * 300;
        const litW = (r * 5 + c * 2) % 4 === 1;
        return <rect key={`b${r}-${c}`} x={x} y={y} width={130} height={180} rx={8} fill={litW ? '#FFE3A8' : '#2F4A55'} stroke={shade('#5F8C94', 0.45)} strokeWidth={10} />;
      }),
    )}
    <rect x={700} y={720} width={1100} height={290} fill="#FFE3A8" />
    <Glow id={`${id}-sg`} c={{x: 1100, y: 860}} r={520} ry={260} color="#FFD27A" alpha={0.5} />
    <path d="M660,640 L1900,640 L1860,730 L700,730 Z" fill="#E06C5A" />
    {Array.from({length: 10}).map((_, i) => <path key={i} d={`M${700 + i * 120},640 l60,0 l-6,90 l-60,0 Z`} fill="#F3EDE4" opacity={0.85} />)}
    {/* lamp post */}
    <rect x={610} y={160} width={22} height={850} fill="#2C3A44" />
    <circle cx={621} cy={150} r={34} fill="#FFF0C2" />
    <Glow id={`${id}-lg`} c={{x: 621, y: 150}} r={260} color="#FFE7A6" alpha={0.55} />
  </g>
);

export const Pavement: React.FC<{id: string}> = ({id}) => (
  <g>
    <Lin id={`${id}-pv`} d="M-1500,990 h4000 v2400 h-4000 Z" from={{x: 0, y: 990}} to={{x: 0, y: 2200}} stops={[[0, '#B8ADA2'], [0.5, '#A79C92'], [1, '#8E857D']]} />
    {[1040, 1130, 1260, 1450, 1730].map((y, i) => <path key={i} d={`M-1500,${y} H2500`} stroke="#7F766F" strokeWidth={4 + i * 2} opacity={0.5} />)}
    <path d="M-1500,990 H2500" stroke={shade('#B8ADA2', 0.4)} strokeWidth={10} />
  </g>
);

// ---------------------------------------------------------------- the shot
export const StreetScene5: React.FC<{f: number}> = ({f}) => {
  const id = `s${Math.round(f * 100)}`;
  const cam = streetCam(f);
  const h = heroAt(f);
  const jh = manJoints(h.pose);
  const rp = runnerAt(f);
  const jr = manJoints(rp);
  const showHero = scr(cam, D_NEAR, jh.R.W).x < 1600 && scr(cam, D_NEAR, jh.R.W).y < 2600;
  const fire = f >= SA.fire ? Math.exp(-(f - SA.fire) / 3) : 0;
  const zM = zOf(cam, D_MID);
  const blurBg = 2.2 + 1.2 * clamp((cam.z - 1) / 2);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <defs>
        <filter id={`${id}-bb`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={fmt(blurBg / zOf(cam, D_BG))} />
        </filter>
      </defs>
      <Layer cam={cam} depth={D_BG}>
        <g filter={`url(#${id}-bb)`}>
          <Facades id={`${id}-fc`} />
        </g>
      </Layer>
      <Layer cam={cam} depth={D_MID}>
        <Pavement id={`${id}-pv`} />
        <SoftShadow id={`${id}-rs`} c={{x: rp.x - 10, y: GROUND - 4}} rx={130 * RS * 1.4} ry={22} alpha={0.32} color="#3A2E28" />
        <Man id={`${id}-rn`} pose={rp} expr={runnerExpr(f)} lHand={HAND_READY} rHand={HAND_GRIP} outfit={RUNNER} inkK={zM > 2 ? 0.8 : 1}
          afterRightArm={<Bag id={`${id}-bg`} hand={add(jr.R.W, mul(jr.R.foreDir, 20 * RS))} swing={bagSwing(f)} s={RS} ink={7 * 0.72 * RS} />}
          overAll={
            <g>
              <WebSplat id={`${id}-ws`} f={f} pose={rp} ink={(7 * 0.72 * RS) / Math.sqrt(Math.max(1, zM / 3))} />
              <WrapBands id={`${id}-wb`} f={f} pose={rp} ink={(7 * 0.72 * RS) / Math.sqrt(Math.max(1, zM / 3))} />
            </g>
          } />
      </Layer>
      {showHero && (
        <Layer cam={cam} depth={D_NEAR}>
          <Man id={`${id}-hr`} pose={h.pose} expr={h.expr} lHand={HAND_FIST} rHand={h.hand} outfit={HERO} hairSway={h.hairSway}
            afterRightArm={<WristShooter id={`${id}-sh`} E={jh.R.E} W={jh.R.W} rW={17 * HS} side={-1} ink={7 * 0.72 * HS} fire={fire} />} />
        </Layer>
      )}
      <Jet f={f} />
    </svg>
  );
};
