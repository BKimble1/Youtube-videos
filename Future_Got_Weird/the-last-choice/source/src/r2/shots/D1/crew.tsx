// Section D1: the Crew as functions of FILM time T (world metres). Every shot samples the same choreography, so
// positions hold across cuts. Runs use gaitW on groundH (planted feet); between runs each person stands on a keyed
// root with planted steps (chor.stepFeet: heel skids where a blow drives them back). Tool contacts are solved to world
// points on the machines (unitAttach) and become world hand targets. R3: every exchange is attack → defense →
// counter → consequence (./chor.ts has the timeline; production/R3_EXCHANGES.md ## D1 the sheet).
import {V3, add3, sub3, mul3, norm3, lerp, clamp, smooth, easeOut, easeIn} from '../../../kit/math';
import {
  FigSpec, FigFrame, Pose, blendPose, layer, lookR2, dmgR2, toolsR2, gaitW, GaitW, BRACED, BASH, AIM, THROW, KNEEL, SKETCH,
  plateWear, tetherLauncher, hipReel, tablet, breaker, controller, halligan1, halligan2, flare as flareHold, Role2, PlateState,
} from '../../rig';
import {FACES, expr, exprMix} from '../../rig';
import type {FigProps, Face} from '../../rig';
import {unitAttach} from '../../mech';
import {M} from '../../timing';
import {XZ, KP, KR, G, onG, keyRoot, footAt, runDist, runSpeed, cruise, pathLen, fwdOf, rightOf, headingTo, wrapD, win, after} from './motion';
import {unitD1, BR4, br4X, br4Z, u4TugTip, u4CatchAt, u1TugTip, u1CatchAt, u5Clamp} from './machines';
import {EV, stepFeet, lastXZ, beamOver, DIR_ARRIVE, DIR_FIGHT, DIR_SKIDS, BRK_ARRIVE, BRK_FIGHT, BRK_IN, BRK_IN_T, BRK_FIGHT2, BRK_SKIDS2, RUN_ARRIVE, RUN_FIGHT} from './chor';

// ------------------------------------------------------------------ helpers
type Seg =
  | {kind: 'run'; path: XZ[]; T0: number; T1: number; gait: GaitW; A?: number; D?: number}
  | {kind: 'stand'; root: KR[]; feet?: {L: KP[]; R: KP[]}; stag?: number; skids?: number[]}
  /** a scripted move (root and footholds as functions of T), e.g. the BR4 drive */
  | {kind: 'fn'; T0: number; at: (T: number) => {pos: V3; heading: number; footL: V3; footR: V3}};

const GAITS = {
  dir: {stride: 2.1, duty: 0.34, lift: 0.17, bob: 10, armAmp: 40, lean: 15} as GaitW,
  heavy: {stride: 1.95, duty: 0.37, lift: 0.14, bob: 9, armAmp: 6, lean: 13} as GaitW,
  run: {stride: 2.0, duty: 0.35, lift: 0.16, bob: 10, armAmp: 40, lean: 14} as GaitW,
  fast: {stride: 2.1, duty: 0.32, lift: 0.18, bob: 11, armAmp: 48, lean: 17} as GaitW,
  hurry: {stride: 1.5, duty: 0.46, lift: 0.1, bob: 7, armAmp: 22, lean: 9} as GaitW,
  dash: {stride: 1.6, duty: 0.38, lift: 0.13, bob: 8, armAmp: 10, lean: 18} as GaitW,
};

/**
 * (R4) The charge's starts, as offsets from the cut (59.95). The Director is already stepping out (C ends on his first stride) and
 * the others go after him one by one, in the order they can read him and reach the line: the runner first (fast, he cannot be left),
 * then the breaker (he settles the tool in his hands), the tether operator, the flare carrier, the pilot (her drone is already out
 * ahead of them) and the decoy maker last. Each is a whole stride apart, not a half-second smear; the arrivals (T1) are unchanged,
 * so the late ones simply run a little harder to the line.
 */
const CHARGE_GO = {runner: 0.22, breaker: 0.4, tether: 0.52, flares: 0.78, decoy: 0.92, drone: 1.1};

type Body = {pos: V3; heading: number; footL: V3; footR: V3; gait?: Pose; runK: number; seg: number; inRun: boolean; phase?: number};

const segStart = (s: Seg) => (s.kind === 'stand' ? s.root[0][0] : s.T0);
/** sample a timeline of runs and stands (feet planted; a run starts from the stance and settles into the next) */
const bodyAt = (segs: Seg[], T: number): Body => {
  let i = 0;
  for (let k = 0; k < segs.length; k++) if (T >= segStart(segs[k])) i = k;
  const s = segs[i];
  if (s.kind === 'fn') return {...s.at(T), runK: 0, seg: i, inRun: false};
  if (s.kind === 'run') {
    const L = pathLen(s.path);
    const A = s.A ?? 1.0, D = s.D ?? 0.6;
    const d = runDist(Math.min(T, s.T1 + (D > 0 ? 0 : 0.6)), s.T0, s.T1, L, A, D);
    const g = gaitW(s.path, Math.min(d, L + 0.6), s.gait, G);
    const v = runSpeed(T, s.T0, s.T1, L, A, D);
    const k = clamp(v / cruise(s.T0, s.T1, L, A, D));
    // push-off: blend the feet from the previous stance into the gait over the first 0.3 s
    let fl = g.footL, fr = g.footR;
    const prev = segs[i - 1];
    if (prev && prev.kind !== 'run') {
      const pb = bodyAt(segs.slice(0, i), s.T0);
      const w = smooth(clamp((T - s.T0) / 0.32));
      fl = mixFoot(pb.footL, fl, w); fr = mixFoot(pb.footR, fr, w);
    } else if (!prev && s.T0 > M.CHARGE + 0.01) {
      // a follower in the charge (the Director goes first, at 59.95): both feet planted where its first stride starts
      // while it waits, then the swing foot lifts into the stride over the first 0.32 s (no foot hanging in the air)
      const g0 = gaitW(s.path, 0, s.gait, G);
      const w = smooth(clamp((T - s.T0) / 0.32));
      fl = mixFoot(onG(g0.footL.x, g0.footL.z), fl, w); fr = mixFoot(onG(g0.footR.x, g0.footR.z), fr, w);
    }
    return {pos: g.pos, heading: g.heading, footL: fl, footR: fr, gait: g.pose, runK: k, seg: i, inRun: true, phase: g.phase};
  }
  const b = standAt(s, T);
  // settle out of the previous run: the feet land on their first stance footholds
  const prev = segs[i - 1];
  if (prev && prev.kind === 'run') {
    const t0 = s.root[0][0];
    const w = smooth(clamp((T - t0) / 0.3));
    if (w < 1) {
      const pr = bodyAt(segs.slice(0, i), t0);
      b.footL = mixFoot(pr.footL, b.footL, clamp(w * 1.6));
      b.footR = mixFoot(pr.footR, b.footR, clamp(w * 1.6 - 0.6));
      b.gait = pr.gait;
      b.runK = (1 - w) * pr.runK;
    }
  }
  return {...b, seg: i};
};
const mixFoot = (a: V3, b: V3, w: number): V3 => {
  const x = lerp(a.x, b.x, w), z = lerp(a.z, b.z, w);
  return {x, y: Math.max(G(x, z), lerp(a.y, b.y, w)) + Math.sin(Math.PI * w) * 0.06 * Math.min(1, Math.hypot(a.x - b.x, a.z - b.z) / 0.2), z};
};
const FEET = new Map<Seg, {L: KP[]; R: KP[]}>();
const standAt = (s: Extract<Seg, {kind: 'stand'}>, T: number): Body => {
  const r = keyRoot(s.root, T);
  let feet = s.feet ?? FEET.get(s);
  if (!feet) FEET.set(s, (feet = stepFeet(s.root, {stepLen: 0.45, half: 0.15, stag: s.stag ?? 0.12, skids: s.skids})));
  const fl = footAt(feet.L, T, 0.1), fr = footAt(feet.R, T, 0.1);
  return {pos: onG(r.p.x, r.p.z), heading: r.h, footL: fl, footR: fr, runK: 0, seg: 0, inRun: false};
};
/** head yaw (deg, body-relative) to look at a world point, clamped */
const lookYaw = (b: {pos: V3; heading: number}, at: V3, lim = 70) => clamp(wrapD(headingTo(b.pos, at) - b.heading), -lim, lim);
const lookPitch = (b: {pos: V3}, at: V3, eye = 1.55) => clamp((Math.atan2(at.y - (b.pos.y + eye), Math.hypot(at.x - b.pos.x, at.z - b.pos.z)) * -180) / Math.PI, -30, 30);
/** world point → body-local Loc (rig units) of a body at pos/heading */
export const toLoc = (b: {pos: V3; heading: number}, p: V3) => {
  const f = fwdOf(b.heading), r = rightOf(b.heading);
  const dx = p.x - b.pos.x, dz = p.z - b.pos.z;
  return {r: (dx * r.x + dz * r.z) * 251.4, u: (p.y - b.pos.y) * 251.4, f: (dx * f.x + dz * f.z) * 251.4};
};
const fromLoc = (b: {pos: V3; heading: number}, l: {r: number; u: number; f: number}): V3 => {
  const f = fwdOf(b.heading), r = rightOf(b.heading);
  return {x: b.pos.x + (f.x * l.f + r.x * l.r) / 251.4, y: b.pos.y + l.u / 251.4, z: b.pos.z + (f.z * l.f + r.z * l.r) / 251.4};
};
type Loc = {r: number; u: number; f: number};
const lerpLoc = (a: Loc, b: Loc, k: number): Loc => ({r: lerp(a.r, b.r, k), u: lerp(a.u, b.u, k), f: lerp(a.f, b.f, k)});
const lerp3v = (a: V3, b: V3, k: number): V3 => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k)});
/** a quick jolt: rises in 0.05 s at t0, decays (light parry / block impulses) */
const jolt = (T: number, t0: number, decay = 6) => (T < t0 ? 0 : T < t0 + 0.05 ? (T - t0) / 0.05 : Math.exp(-(T - t0 - 0.05) * decay));
/** in over [a, t0], out over [t1, b] */
const env = (T: number, a: number, t0: number, t1: number, b: number) => (T < a || T > b ? 0 : T < t0 ? smooth((T - a) / (t0 - a)) : T < t1 ? 1 : 1 - smooth((T - t1) / (b - t1)));
const gaitArms = (g?: Pose): Pose => (g ? {armL: g.armL, armR: g.armR} : {});
/** run pose: the gait's body (drop, lean, bob) plus role arms, faded into the stance pose by runK */
const withRun = (b: Body, stance: Pose, runArms: Pose): Pose => {
  if (!b.gait || b.runK <= 0.001) return stance;
  const run = layer(b.gait, runArms, {face: {...EXPR.effort}});
  return blendPose(stance, run, b.runK);
};
void gaitArms;

// ------------------------------------------------------------------ faces (RIG's named expressions, rig/faces.ts)
export const EXPR: Record<string, Face> = {
  focus: FACES.concentration,
  effort: FACES.effort,
  impact: expr('pain', 1, {squint: 0.85}),
  strain: expr('effort', 1, {worry: 0.3, lid: 0.3}),
  alarm: FACES.shock,
  fear: FACES.fear,
  recog: FACES.recognition,
  pant: FACES.exhaustion,
  dazed: exprMix('pain', 'exhaustion', 0.5),
  resolve: FACES.resolve,
};
/** keyed expressions [[t, face], …]: each blends in over 0.14 s from its key */
const faceKeys = (T: number, k: [number, Face][]): Face => {
  let f: Face = k[0][1];
  for (let i = 1; i < k.length; i++) {
    if (T < k[i][0]) break;
    const w = smooth((T - k[i][0]) / 0.14);
    f = blendPose({face: f}, {face: k[i][1]}, w).face ?? k[i][1];
  }
  return f;
};

export type CrewOut = {spec: FigSpec; body: Body; pts?: Record<string, V3>};
/** where each of them ends up crouched behind the cover slab (D1-9), for eye-lines between them (D2 starts here) */
export const SPOTS: Record<string, XZ> = {
  director: {x: 46.8, z: 2.75}, tether: {x: 46.7, z: 1.85}, runner: {x: 46.55, z: 1.05}, breaker: {x: 46.8, z: 3.65},
  decoy: {x: 46.7, z: 4.5}, drone: {x: 46.55, z: 6.05}, flares: {x: 46.75, z: 5.3},
};
const headAt = (who: string, up = 1.05): V3 => onG(SPOTS[who].x, SPOTS[who].z, up);
/** kneeling footholds: the front foot forward, the down knee's foot back on its toes (KNEEL's shape, solved in world) */
const kneelFeet = (b: Body, down: 'L' | 'R', w: number): void => {
  if (w <= 0.001) return;
  const f = fwdOf(b.heading), r = rightOf(b.heading);
  const at = (fw: number, side: number, up: number): V3 => {
    const x = b.pos.x + f.x * fw + r.x * side, z = b.pos.z + f.z * fw + r.z * side;
    return {x, y: G(x, z) + up, z};
  };
  const front = down === 'R' ? at(0.3, -0.15, 0.02) : at(0.3, 0.15, 0.02);
  const back = down === 'R' ? at(-0.3, 0.15, 0.13) : at(-0.3, -0.15, 0.13);
  const L = down === 'R' ? front : back, R = down === 'R' ? back : front;
  b.footL = mixFoot(b.footL, L, w);
  b.footR = mixFoot(b.footR, R, w);
};
/** BREATH eye-lines: [from, to, who] — whose face each person looks at, when (behind the slab, under the sweep) */
const LOOKS: Record<string, [number, number, V3][]> = {
  director: [[91.5, 92.0, onG(48.2, 2.7, 3.0)], [92.0, 92.7, headAt('breaker')], [92.7, 93.35, headAt('tether')], [93.35, 93.8, onG(48.3, 4.6, 3.0)], [93.8, 95, headAt('decoy')]],
  breaker: [[91.9, 93.1, headAt('director')], [93.1, 95, onG(48.6, 3.5, 2.6)]],
  tether: [[91.9, 92.5, onG(49, 1.0, 2.6)], [92.5, 93.8, headAt('director')], [93.8, 95, headAt('runner')]],
  runner: [[91.6, 92.9, onG(50, -0.5, 2.4)], [92.9, 95, headAt('tether')]],
  decoy: [[91.3, 92.2, onG(48.5, 4.6, 2.8)], [92.2, 93.6, headAt('director')], [93.6, 95, headAt('drone')]],
  drone: [[92.5, 93.4, onG(49.4, 5.8, 3.4)], [93.4, 95, headAt('decoy')]],
  flares: [[91.85, 93.0, onG(49.5, 5.5, 2.8)], [93.0, 95, headAt('director')]],
};
const breathLook = (who: string, b: {pos: V3; heading: number}, T: number): {yaw: number; pitch: number; w: number} | null => {
  const L = LOOKS[who];
  if (!L) return null;
  const k = L.findIndex(([a, e]) => T >= a && T < e);
  if (k < 0) return null;
  const [a, e, p] = L[k], prev = L[k - 1], next = L[k + 1];
  // (R4) a look that follows another with no gap turns the head from the one to the next (R3 let each fall back to the fight's
  // heading first: sweeps of 100° in 0.2 s, twice per look, in the breath's close shot)
  const joinIn = !!prev && Math.abs(prev[1] - a) < 1e-6, joinOut = !!next && Math.abs(next[0] - e) < 1e-6;
  const w = win(T, a, e, joinIn ? 0.001 : 0.2, joinOut ? 0.001 : 0.16);
  let yaw = lookYaw(b, p, 85), pitch = lookPitch(b, p, 1.05);
  if (joinIn) { const u = smooth(clamp((T - a) / 0.3)); yaw = lerp(lookYaw(b, prev![2], 85), yaw, u); pitch = lerp(lookPitch(b, prev![2], 1.05), pitch, u); }
  return {yaw, pitch, w};
};
const withLook = (pose: Pose, who: string, b: {pos: V3; heading: number}, T: number): Pose => {
  const l = breathLook(who, b, T);
  let p = pose;
  if (l) { const h = pose.head ?? {}; p = {...pose, head: {yaw: lerp(h.yaw ?? 0, l.yaw, l.w), pitch: lerp(h.pitch ?? 0, l.pitch, l.w), roll: h.roll}}; }
  // the drone's beam passes along the slab's top edge over their heads: each one flinches down under it, eyes up
  const fl = flinchW(who, T);
  if (fl <= 0) return p;
  const h = p.head ?? {};
  return {...p, drop: (p.drop ?? 0) + 12 * fl, lean: (p.lean ?? 0) + 10 * fl, head: {yaw: h.yaw, pitch: (h.pitch ?? 0) + 18 * fl, roll: h.roll}};
};
/** how far they flinch down as the beam passes over their spot (0..1) */
const flinchW = (who: string, T: number) => { const tz = beamOver(SPOTS[who].z); return win(T, tz - 0.32, tz + 0.55, 0.14, 0.3) * after(T, 91.0, 0.3); };
/** a role's keyed face, with the beam's flinch (fear, eyes up at the light) laid over it */
const faceFor = (who: string, T: number, keys: [number, Face][]): Face => {
  const f = faceKeys(T, keys), fl = flinchW(who, T);
  return fl > 0 ? blendPose({face: f}, {face: {...EXPR.fear, lookY: -0.7}}, fl).face ?? f : f;
};
const base = (role: Role2, key: string, seed: number, b: Body, T: number, pose: Partial<FigProps>, world: {handL?: V3; handR?: V3} = {}, gaze?: V3): FigSpec => ({
  key, look: lookR2(role), t: T, seed, pos: b.pos, heading: b.heading,
  pose: {...pose, dmg: dmgR2(role, T)},
  world: {footL: b.footL, footR: b.footR, ...world},
  ...(gaze ? {gaze, gazeW: 0.85} : {}),
});
/**
 * (R4) The charge's glances: the leader checks over his shoulder that they are coming (60.4–60.85), each follower reads him before
 * pushing off (and the tether operator, the pilot and the decoy maker check their neighbour next), then everyone's eyes are on the line.
 * [from, to, who] for the head and eyes; the sink before each follower's first stride is `launchPose`.
 */
const bodyHeadOf = (segs: Seg[], T: number): V3 => { const q = bodyAt(segs, T); return {x: q.pos.x, y: q.pos.y + 1.5, z: q.pos.z}; };
const CHARGE_LOOKS: Record<string, [number, number, (T: number) => V3][]> = {
  director: [[60.42, 60.86, (T) => bodyHeadOf(RUN_SEGS, T)]],
  runner: [[59.95, 60.3, (T) => bodyHeadOf(DIR_SEGS, T)]],
  breaker: [[59.95, 60.55, (T) => bodyHeadOf(DIR_SEGS, T)]],
  tether: [[59.95, 60.28, (T) => bodyHeadOf(DIR_SEGS, T)], [60.28, 60.7, (T) => bodyHeadOf(RUN_SEGS, T)]],
  flares: [[59.95, 60.5, (T) => bodyHeadOf(DIR_SEGS, T)], [60.5, 60.95, (T) => bodyHeadOf(BRK_SEGS, T)]],
  drone: [[60.5, 61.0, (T) => bodyHeadOf(DIR_SEGS, T)]],
  decoy: [[59.95, 60.45, (T) => bodyHeadOf(DIR_SEGS, T)], [60.45, 61.05, (T) => bodyHeadOf(TTH_SEGS, T)]],
};
const chargeGlance = (who: string, T: number): {w: number; at: V3} | null => {
  const L = CHARGE_LOOKS[who];
  if (!L || T < M.CHARGE || T > 61.1) return null;
  for (const [a, e, f] of L) if (T >= a && T < e) return {w: win(T, a, e, 0.14, 0.16), at: f(T)};
  return null;
};
/** a glance laid over the final pose (after the run blend, which would otherwise fade the head turn out as the stride builds) */
const glance = (pose: Pose, who: string, b: {pos: V3; heading: number}, T: number): Pose => {
  const cg = chargeGlance(who, T);
  if (!cg) return pose;
  const h = pose.head ?? {};
  return {...pose, head: {yaw: lerp(h.yaw ?? 0, lookYaw(b, cg.at, 80), cg.w), pitch: lerp(h.pitch ?? 0, lookPitch(b, cg.at, 1.55), cg.w), roll: h.roll}};
};
/** the beat before a follower's first stride: weight sinks and shifts forward (the push-off), so nobody waits as a statue */
const launchPose = (pose: Pose, who: string, T: number): Pose => {
  const s0 = ALL_SEGS[who]?.[0];
  const t0 = s0 && s0.kind === 'run' ? s0.T0 : 0;
  if (t0 <= M.CHARGE + 0.3) return pose;
  const k = after(T, Math.max(t0 - 0.34, M.CHARGE + 0.02), 0.3); // (zero on the cut's first frame: C's last pose is the start)
  return k > 0 && T < t0 + 0.3 ? layer(pose, {drop: (pose.drop ?? 26) + 9 * k, lean: (pose.lean ?? 10) + 9 * k}) : pose;
};

/** the eyes' target behind the slab: whoever the breath look is on (else the fight target) */
const gazeAt = (who: string, T: number, fight: V3): V3 => {
  const cg = chargeGlance(who, T);
  if (cg && cg.w > 0.4) return cg.at;
  const L = LOOKS[who];
  if (L) for (const [a, e, p] of L) if (T >= a && T < e) return p;
  return fight;
};
const headTo = (pose: Pose, b: Body, tgt: V3, lim = 75, w = 1): Pose => {
  const h = pose.head ?? {};
  return layer(pose, {head: {yaw: lerp(h.yaw ?? 0, lookYaw(b, tgt, lim), w), pitch: lerp(h.pitch ?? 0, lookPitch(b, tgt), w), roll: h.roll}});
};

// ================================================================== THE DIRECTOR (clerkC, plate on the left forearm)
// (down the free corridor between the death slab and the leaning ridge slab at the SE foot: z ≈ 4.4 … 6.1 at x 7–11)
const DIR_RUN: XZ[] = [{x: 1.6, z: 1.4}, {x: 4.2, z: 4.3}, {x: 7.0, z: 5.25}, {x: 11.5, z: 5.1}, {x: 20, z: 2.4}, {x: 30, z: 0.3}, DIR_ARRIVE];
// continuation: he goes to meet U3 coming out of the gap (between U1's feet and the breaker)
const D_TO_GAP: XZ[] = [{x: 39.7, z: -1.72}, {x: 40.6, z: -1.05}, {x: 42.35, z: -0.62}];
const D_SET: KR[] = [[85.2, 42.35, -0.62, 90], [BR4.gather, 42.35, -0.62, 90]];
/**
 * BR4, his side (the timeline is shared with U3 in machines.ts: br4X/br4Z/BR4): the left foot plants forward as he
 * dips (gather), two burst strides (right, then left landing as the shoulder meets the chest), three short driving
 * steps (right, left, right; low lift), the shove, the left foot catches him. Footholds [T, x, lift] on his two lines.
 */
const BR4_FEET: {L: [number, number, number][]; R: [number, number, number][]} = {
  L: [[85.68, 42.51, 0], [85.86, 42.74, 0.07], [86.16, 42.74, 0], [BR4.hit - 0.02, 44.11, 0.1], [86.55, 44.11, 0], [86.7, 44.91, 0.05],
    [86.93, 44.91, 0], [87.12, 45.6, 0.06]],
  R: [[85.92, 42.19, 0], [86.12, 43.15, 0.12], [86.28, 43.15, 0], [86.46, 44.42, 0.05], [86.7, 44.42, 0], [86.86, 45.2, 0.05],
    [87.15, 45.2, 0], [87.36, 45.42, 0.04]],
};
/** his plants that dig in (for FX/sound): [T, foot] */
export const BR4_DIG: [number, 'L' | 'R'][] = [[85.86, 'L'], [86.12, 'R'], [BR4.hit - 0.02, 'L'], [86.46, 'R'], [86.7, 'L'], [86.86, 'R'], [87.12, 'L']];
const br4Feet = (() => {
  const z = (T: number) => br4Z(T);
  const mk = (k: [number, number, number][], side: -1 | 1): KP[] => k.map(([t, x, l]) => [t, x, z(t) + side * 0.15, l] as KP);
  return {L: mk(BR4_FEET.L, -1), R: mk(BR4_FEET.R, 1)};
})();
const br4Body = (T: number) => {
  const x = br4X(T), z = br4Z(T);
  return {pos: onG(x, z), heading: 90, footL: footAt(br4Feet.L, T, 0.06), footR: footAt(br4Feet.R, T, 0.06)};
};
// then up onto the crest (the bowl below: U3 sliding, the survivors pulled back across it), the drone coming: he waves
// them on and runs along the crest to the slab, down behind it
const D_DRIVE: KR[] = [
  [BR4.settle, br4X(BR4.settle), br4Z(BR4.settle), 90], [87.95, br4X(BR4.settle), br4Z(BR4.settle), 90], [88.65, 45.85, -0.98, 92], [89.4, 45.85, -0.98, 84],
  [90.3, 46.35, 0.95, 165], [90.95, 46.8, 2.75, 225], [91.3, 46.8, 2.75, 270], [94.3, 46.8, 2.75, 270],
];
const DIR_SEGS: Seg[] = [
  {kind: 'run', path: DIR_RUN, T0: M.CHARGE, T1: EV.clash, gait: GAITS.dir, A: 1.0, D: 0},
  {kind: 'stand', root: DIR_FIGHT, stag: 0.16, skids: DIR_SKIDS},
  {kind: 'run', path: D_TO_GAP, T0: EV.dirGo, T1: 85.2, gait: GAITS.hurry, A: 0.35, D: 0.45},
  {kind: 'stand', root: D_SET},
  {kind: 'fn', T0: BR4.gather, at: br4Body},
  {kind: 'stand', root: D_DRIVE},
];
(() => {
  // set in front of U3: feet where the BR4 footholds start (left forward)
  const z = br4Z(BR4.gather);
  (DIR_SEGS[3] as Extract<Seg, {kind: 'stand'}>).feet = {L: [[85.2, 42.51, z - 0.15]], R: [[85.2, 42.19, z + 0.15]]};
  br4Feet.L.unshift([BR4.gather, 42.51, z - 0.15]); br4Feet.R.unshift([BR4.gather, 42.19, z + 0.15]);
  // after the drive: start the walk from where the feet are
  const lL = br4Feet.L[br4Feet.L.length - 1], lR = br4Feet.R[br4Feet.R.length - 1];
  (DIR_SEGS[5] as Extract<Seg, {kind: 'stand'}>).feet = stepFeet(D_DRIVE, {stepLen: 0.45, half: 0.15, stag: 0.12, init: {L: {x: lL[1], z: lL[2]}, R: {x: lR[1], z: lR[2]}}});
})();

/** the plate guard (left wrist target, body-local rig units) */
const GUARD: Loc = {r: 6, u: 345, f: 112};
/** the bash's plate arm: forward and up, the plate meets the unit's lower chest plate */
const BASH_PLATE: Loc = {r: -4, u: 322, f: 168};
/** the low bash into U1's knee joint */
const KNEE_PLATE: Loc = {r: -4, u: 172, f: 160};
/** the plate's world centre for a guard (≈ 45 % of the forearm below the wrist, pushed out by its thickness) */
const plateFromGuard = (b: {pos: V3; heading: number}, g: Loc): V3 => {
  const w = fromLoc(b, g);
  const f = fwdOf(b.heading);
  return {x: w.x + f.x * 0.05, y: w.y - 0.15, z: w.z + f.z * 0.05};
};
/**
 * The plate arm on the run: still guarded (forearm up across the chest, plate forward) but carried by the torso, so it
 * rides the stride's bob and lean, counter-rotates with the shoulders and pumps a little in time with the legs.
 */
const guardRun = (b: Body): Pose => {
  const g = b.gait ?? {};
  const c = b.phase ?? 0, sw = Math.sin(2 * Math.PI * c);
  const lean = g.lean ?? 14, drop = g.drop ?? 0;
  const twist = -7 * sw;
  const r1 = -6 + 6 * sw, u1 = 129 + 6 * sw, f1 = 65 + 16 * sw;
  const tl = (lean * Math.PI) / 180, tw = (-twist * Math.PI) / 180;
  const u2 = u1 * Math.cos(tl) - f1 * Math.sin(tl), f2 = u1 * Math.sin(tl) + f1 * Math.cos(tl);
  const r3 = r1 * Math.cos(tw) + f2 * Math.sin(tw), f3 = -r1 * Math.sin(tw) + f2 * Math.cos(tw);
  return {
    twist,
    armL: {local: {r: r3, u: 165 - drop + u2, f: f3}, pole: {r: -1, u: -0.6, f: 0}, palm: {r: 0.3, u: 0, f: -1}},
    armR: g.armR, handL: 'fist', handR: 'fist',
  };
};
/** the Director's face through D1 */
const DIR_FACE: [number, Face][] = [
  [0, EXPR.effort], [EV.clash, EXPR.impact], [68.62, EXPR.effort], [69.05, EXPR.focus], [69.6, EXPR.effort], [70.5, EXPR.focus],
  [EV.u1jab2, EXPR.effort], [72.8, EXPR.focus], [73.55, EXPR.effort], [74.3, EXPR.focus], [74.95, EXPR.alarm], [75.3, EXPR.effort], [76.3, EXPR.focus],
  [EV.u1jab3, EXPR.effort], [78.05, EXPR.strain], [EV.br1, EXPR.impact], [78.8, EXPR.strain], [EV.shove, EXPR.alarm], [80.6, EXPR.fear],
  [80.78, EXPR.recog], [81.0, EXPR.strain], [81.7, EXPR.effort], [82.6, EXPR.pant], [83.25, EXPR.recog], [83.55, EXPR.effort],
  [87.4, EXPR.pant], [89.1, EXPR.alarm], [89.5, EXPR.effort], [91.3, EXPR.pant], [92.6, {...EXPR.focus, worry: 0.3}],
];

const directorCore = (T: number): CrewOut => {
  const b = bodyAt(DIR_SEGS, T);
  const plate: PlateState = T >= EV.br1 ? (toolsR2('director', T).plate === 'intact' ? 'dented' : toolsR2('director', T).plate!) : 'intact';
  const glint = Math.max(win(T, EV.br1, EV.br1 + 0.16, 0.01, 0.12), win(T, EV.clash, EV.clash + 0.14, 0.01, 0.1) * 0.8);
  // ---- the exchange envelopes (see chor.ts)
  const heavy = (t0: number) => (T < t0 ? 0 : T < t0 + 0.06 ? (T - t0) / 0.06 : Math.exp(-(T - t0 - 0.06) * 3.2));
  const hit = Math.max(heavy(EV.clash) * (T < 69.5 ? 1 : 0), heavy(EV.br1) * (T > EV.br1 - 0.01 && T < 80 ? 1 : 0));
  const braceK = Math.max(env(T, 67.9, EV.clash - 0.04, EV.clash + 0.3, 68.95), env(T, 78.0, EV.br1 - 0.04, EV.br1 + 0.55, 79.25));
  const light = Math.max(jolt(T, EV.u1jab2), jolt(T, EV.u1jab3), 0.7 * jolt(T, EV.u1punch));
  const parryK = env(T, 69.0, EV.u1punch - 0.02, EV.u1punch + 0.1, 69.55);
  const bash = (a: number, t0: number, t1: number, b2: number) => env(T, a, t0, t1, b2);
  const bash1 = bash(69.55, EV.bash1, EV.bash1 + 0.1, 70.6), bash2 = bash(73.45, EV.dirBash2, EV.dirBash2 + 0.05, 74.35), bash3 = bash(75.4, EV.dirBash3, EV.dirBash3 + 0.08, 76.3);
  const rebuff = jolt(T, EV.dirBash2 + 0.02, 5) * (T < 74.6 ? 1 : 0); // his bash stopped by its forearm
  const dodgeK = env(T, 74.92, EV.u1ham2 - 0.05, EV.u1ham2 + 0.15, 75.5);
  const pressK = env(T, EV.press - 0.06, EV.press + 0.12, EV.shove - 0.05, EV.shove + 0.08);
  const shoveK = env(T, EV.shove, EV.shove + 0.12, 80.25, 80.75);
  const duckK = env(T, EV.duck - 0.08, EV.duck + 0.22, 81.5, 81.85);
  const kneeK = env(T, 81.95, EV.dirKnee, EV.dirKnee + 0.08, 82.7);
  const watchK = env(T, 82.55, 82.8, 83.55, 83.8);
  // ---- the plate guard (body-local) with every exchange's offsets
  let guard: Loc = {
    r: GUARD.r - 4 * braceK - 46 * parryK,
    u: GUARD.u + 8 * braceK - 14 * hit - 10 * pressK,
    f: GUARD.f - 6 * braceK - 30 * hit - 16 * light + 10 * parryK - 46 * pressK - 18 * rebuff,
  };
  // the duck: plate over his head as he goes down to his left
  guard = lerpLoc(guard, {r: -14, u: 318, f: 74}, duckK);
  // the shove: the plate arm thrown wide as he stumbles
  guard = lerpLoc(guard, {r: -60, u: 300, f: 60}, shoveK * 0.7);
  let pose: Pose = layer(BRACED({wide: 0.8}), {armL: {local: guard, pole: {r: -1, u: -0.7, f: 0.1}, palm: {r: -0.55, u: 0.1, f: -1}}, handL: 'fist'});
  // the clash bash posture as he arrives (plate leading into the hammer) is in the run arms below; the bashes:
  const bashK = Math.max(bash1, bash2 * 0.85, bash3 * 0.9);
  if (bashK > 0) pose = blendPose(pose, layer(BASH(1), {armL: {...BASH(1).armL, local: BASH_PLATE}}), bashK);
  // the knee bash: low, the plate driven into the joint
  if (kneeK > 0) pose = blendPose(pose, layer(BASH(1), {drop: 64, lean: 34, twist: -20, armL: {local: KNEE_PLATE, pole: {r: -1, u: -0.4, f: 0}, palm: {r: 0.2, u: -0.2, f: -1}}}), kneeK);
  const recov = after(T, EV.br1 + 0.65, 0.9);
  pose = layer(pose, {
    drop: (pose.drop ?? 26) + 10 * braceK + 22 * hit * (T > 78 ? 1 - recov : 1) + 26 * pressK + 18 * shoveK + 62 * duckK + 8 * dodgeK,
    lean: (pose.lean ?? 10) + 12 * braceK - 26 * hit - 14 * pressK - 26 * shoveK + 30 * duckK + 6 * dodgeK - 10 * rebuff,
    twist: (pose.twist ?? 0) - 12 * braceK - 14 * parryK + 18 * duckK,
    side: 14 * dodgeK - 10 * duckK,
    legL: {...(pose.legL ?? {}), pitch: -22 * Math.max(win(T, EV.br1, EV.br1 + 0.4, 0.04, 0.15), win(T, EV.clash, EV.clash + 0.3, 0.04, 0.12))},
    legR: {...(pose.legR ?? {}), pitch: -16 * Math.max(win(T, EV.br1, EV.br1 + 0.38, 0.04, 0.15), win(T, EV.clash, EV.clash + 0.28, 0.04, 0.12))},
    breath: 0.6 + 0.3 * watchK,
  });
  // the right arm: up for balance in the stumble, a hand out as he ducks, a brace on his thigh while he watches
  const armRx = Math.max(shoveK, duckK * 0.6);
  if (armRx > 0) pose = blendPose(pose, layer(pose, {armR: {local: {r: 86, u: 300, f: 40}}, handR: 'open'}), shoveK);
  if (duckK > 0) pose = blendPose(pose, layer(pose, {armR: {local: {r: 50, u: 170, f: 110}}, handR: 'open'}), duckK * (1 - shoveK));
  // BR4: gather (left foot plants, he dips, the plate tucks in front of his face, left shoulder leading) → burst →
  // shoulder and plate into U3's chest → three short driving steps, low → the shove → he catches himself on the slope
  const g4 = T > 85.2 && T < BR4.settle + 0.9 ? smooth(clamp((T - 85.3) / 0.36)) * (1 - after(T, BR4.settle - 0.05, 0.55)) : 0;
  let chg = 0, tuck = 0, plateLoc: Loc | null = null;
  if (g4 > 0) {
    const kB = smooth(clamp((T - BR4.go) / 0.2));
    const kD = after(T, BR4.hit - 0.03, 0.06);
    const kS = win(T, BR4.release - 0.06, BR4.release + 0.32, 0.08, 0.18);
    const imp = T < BR4.hit ? 0 : Math.exp(-(T - BR4.hit) * 9);
    const pump = Math.sin(clamp((T - BR4.go) / (BR4.hit - BR4.go)) * Math.PI * 1.5);
    const armR0 = {r: 52, u: 196 + 40 * pump, f: -30 + 90 * pump};
    const armR1 = {r: 34, u: 250, f: 112}, armR2 = {r: 30, u: 285, f: 150};
    const kRr = after(T, BR4.hit - 0.08, 0.14); // (R4: the free arm throws out over 4 frames, not 2: it was a 0.64 m jump at the hit)
    const aR = lerpLoc(lerpLoc(lerpLoc({r: 50, u: 190, f: -26}, armR0, kB), armR1, kRr), armR2, kS);
    const aL = lerpLoc(lerpLoc({r: -30, u: 262, f: 118}, {r: -24, u: 252, f: 128 - 22 * imp}, kD), {r: -8, u: 290, f: 165}, kS);
    const P: Pose = {
      drop: lerp(lerp(60, 40, kB), 46, kD) + 10 * imp, lean: lerp(lerp(24, 33, kB), 36, kD) - 10 * kS + 6 * imp, twist: lerp(-30, -24, kD) + 8 * kS, side: 0,
      armL: {local: aL, pole: {r: -1, u: -0.5, f: 0}, palm: {r: 0.35, u: 0.1, f: -1}}, armR: {local: aR, pole: {r: 1, u: -0.6, f: -0.3}},
      handL: 'fist', handR: kD > 0.5 && kS < 0.5 ? 'open' : 'fist',
      head: {pitch: -6 + 10 * kD, yaw: 10 * kD, roll: 0},
      breath: 0.6,
    };
    pose = blendPose(pose, P, g4);
    chg = g4;
    tuck = g4 * (1 - kS * 0.6);
    if (g4 > 0.5) plateLoc = aL;
  }
  // on the crest after the drive: he catches his balance, looks into the bowl, sees the drone peel off — waves them on
  const stumble = win(T, BR4.release + 0.15, 88.4, 0.35, 0.6);
  if (stumble > 0) pose = blendPose(pose, layer(BRACED({wide: 0.9}), {drop: 40, lean: 26, armR: {local: {r: 40, u: 120, f: 70}}, handR: 'brace', head: {pitch: 10}}), stumble * (1 - g4 * 0.7));
  const wave = win(T, 89.1, 89.85, 0.18, 0.25);
  if (wave > 0) pose = blendPose(pose, layer(pose, {armR: {local: {r: 70, u: 420 - 60 * Math.sin((T - 89.1) * 11), f: 30}}, handR: 'open', twist: 30}), wave);
  // behind the slab: crouched with his back to it, panting, plate dented
  const crouch = after(T, 91.2, 0.45);
  if (crouch > 0) pose = blendPose(pose, layer(KNEEL('R'), {drop: 70, lean: -6, armL: {local: {r: -30, u: 200, f: 60}, palm: {r: 0.4, u: 0.2, f: -1}}, armR: {local: {r: 52, u: 120, f: 70}}, handL: 'fist', handR: 'relaxed', breath: 0.9}), crouch);
  kneelFeet(b, 'R', crouch);
  // eyes/head: on U1 through the fight; a glance at the breaker coming (80.7); U1 into U2; U3; the bowl; the drone
  const u1 = unitAttach(unitD1('U1', Math.min(T, 84)));
  const tgt = T < 80.68 ? u1.head : T < 80.95 ? onG(40.0, 2.0, 1.5) : T < 82.55 ? u1.head : T < 83.5 ? lerp3v(u1.head, onG(41.0, -3.0, 1.2), smooth((T - 82.6) / 0.6)) : T < 85.3 ? unitAttach(unitD1('U3', T)).head : T < 88.9 ? onG(48.3, -1.9, 0.5) : T < 91.2 ? onG(52.5, 2.0, 3.6) : onG(46.4, 3.7, 1.9);
  // (R4) 71.0–71.5, U1 coming back in: a glance across at the breaker's fight (is he holding?) and back to U1 as it comes
  const glanceB = win(T, 71.0, 71.52, 0.2, 0.22);
  const brkHead = onG(39.95, 3.1, 1.5);
  const tgtG = glanceB > 0.5 ? brkHead : tgt;
  const hy = lerp(lookYaw(b, tgt, 75), lookYaw(b, brkHead, 75), glanceB), hp = lerp(lookPitch(b, tgt), lookPitch(b, brkHead), glanceB);
  const ph = pose.head ?? {};
  pose = layer(pose, {head: {yaw: lerp(hy, ph.yaw ?? 0, tuck), pitch: lerp(hp, ph.pitch ?? 0, tuck) + 18 * duckK, roll: 0}});
  pose = layer(pose, {face: {...faceFor('director', T, DIR_FACE), lookY: -0.5 * tuck}});
  // the plate arm: body-local guard (holds against any camera) except during the run, the drive, the crouch
  const guardOn = (T > EV.clash - 0.5 ? 1 : 0) * (1 - chg) * (1 - crouch) * (1 - stumble * 0.6) * (1 - kneeK) * (1 - bashK) * (T < 91.0 ? 1 : 1 - after(T, 90.6, 0.5));
  const arm = blendPose(pose, layer(pose, {armL: {local: guard, pole: {r: -1, u: -0.7, f: 0.1}, palm: {r: -0.55, u: 0.1, f: -1}}}), guardOn);
  // the run arms: guard carried by the torso; the last strides: the plate comes up to meet the hammer
  let runArms: Pose = guardRun(b);
  const up = env(T, 67.75, EV.clash - 0.05, 69, 70);
  if (up > 0) {
    const gl = (runArms.armL as {local: Loc}).local;
    runArms = {...runArms, armL: {local: lerpLoc(gl, {r: 0, u: 360, f: 100}, up), pole: {r: -1, u: -0.6, f: 0}, palm: {r: lerp(0.3, -0.5, up), u: 0.1, f: -1}}, twist: lerp(runArms.twist ?? 0, -10, up)};
  }
  const final = glance(withRun(b, withLook(launchPose(arm, 'director', T), 'director', b, T), runArms), 'director', b, T);
  const spec = base('director', 'd1dir', 11, b, T, {...final, face: {...(final.face ?? {}), ...faceFor('director', T, DIR_FACE)}, handL: 'fist', handR: final.handR ?? 'fist', wearL: plateWear(plate, {glint})}, {}, tuck > 0.5 ? undefined : gazeAt('director', T, tgtG));
  const plateW = plateFromGuard(b, plateLoc ?? (kneeK > 0.5 ? KNEE_PLATE : bashK > 0.5 ? BASH_PLATE : guard));
  return {spec, body: b, pts: {plate: plateW}};
};
/** the plate's world centre at T (where blows land), from his guard */
export const directorPlate = (T: number) => directorAt(T).pts!.plate;

// ================================================================== THE BREAKER (honest)
const BRK_RUN: XZ[] = [{x: 0.9, z: 3.4}, {x: 4.0, z: 5.2}, {x: 7.2, z: 5.85}, {x: 12.5, z: 6.3}, {x: 17.5, z: 8.4}, {x: 27, z: 7.2}, BRK_ARRIVE];
// after the rescue: alongside the Director toward the gap (covering his right), then up the rim and to the slab
const BRK_AFTER: KR[] = [
  [83.7, 40.5, 0.66, 350], [84.9, 40.75, 1.15, 72], [86.6, 41.3, 1.0, 84], [88.2, 43.3, 0.85, 88], [89.5, 44.0, 1.2, 100], [90.75, 45.4, 3.2, 120],
  [91.3, 46.45, 3.65, 160], [91.8, 46.8, 3.65, 270], [94.3, 46.8, 3.65, 270],
];
const BRK_SEGS: Seg[] = [
  {kind: 'run', path: BRK_RUN, T0: M.CHARGE + CHARGE_GO.breaker, T1: 68.45, gait: GAITS.heavy, A: 1.1, D: 0.7},
  {kind: 'stand', root: BRK_FIGHT, stag: 0.14},
  {kind: 'run', path: BRK_IN, T0: BRK_IN_T[0], T1: BRK_IN_T[1], gait: GAITS.dash, A: 0.35, D: 0.3},
  {kind: 'stand', root: BRK_FIGHT2, stag: 0.14, skids: BRK_SKIDS2},
  {kind: 'stand', root: BRK_AFTER, stag: 0.14},
];
// the rig's breaker is one fixed tube drawn from the back (trigger) hand toward the front hand (rig/props.tsx breaker:
// ram tip (BREAKER_TUBE 270 − 60 + 34) rig units beyond the back hand); the front hand grips the tube 0.44 m up it
const TOOL_BT = 244 / 251.4, TOOL_BACK = 0.44, TOOL_TIP = TOOL_BT - TOOL_BACK;
/** the tool along a line from his chest to a tip point: front (left) hand on the side handle, back (right) on the trigger */
const toolTo = (b: {pos: V3; heading: number}, tip: V3, chest: Loc = {r: 6, u: 290, f: 14}) => {
  const c = fromLoc(b, chest);
  const d = norm3(sub3(tip, c));
  const front = sub3(tip, mul3(d, TOOL_TIP));
  return {front, back: sub3(front, mul3(d, TOOL_BACK)), tip};
};
/** the breaker's swing as world hand keys solved around a tip target: wind-up overhead → strike (tip on target) → recoil */
const swingHands = (b: {pos: V3; heading: number}, tip: V3, k: number, low = false) => {
  const S = toolTo(b, tip, low ? {r: 0, u: 230, f: 20} : {r: 0, u: 300, f: 20});
  const fS = S.front, bS = S.back;
  const d = norm3(sub3(fS, bS));
  // ready (port): tool angled up across the body
  const fR = fromLoc(b, {r: -16, u: 250, f: 118}), bR = fromLoc(b, {r: 32, u: 205, f: 34});
  // wind-up: overhead (raised high over the right shoulder, ram pointing back-up) or low (back at the right hip)
  const fW = low ? fromLoc(b, {r: 40, u: 190, f: 10}) : fromLoc(b, {r: 14, u: 430, f: -6});
  const bW = low ? fromLoc(b, {r: 58, u: 160, f: -60}) : fromLoc(b, {r: 30, u: 360, f: -70});
  // recoil: bounced back 0.14 m along the tool
  const fC = sub3(fS, mul3(d, 0.14)), bC = sub3(bS, mul3(d, 0.14));
  const KEYS: [number, V3, V3][] = [[0, fR, bR], [0.36, fW, bW], [0.55, fS, bS], [0.7, fC, bC], [1, fR, bR]];
  for (let i = 1; i < KEYS.length; i++) if (k <= KEYS[i][0]) {
    const a = KEYS[i - 1], c = KEYS[i];
    const u = (k - a[0]) / (c[0] - a[0]);
    const e = i === 2 ? easeIn(u) : i === 1 || i === 3 ? easeOut(u) : smooth(u);
    return {front: lerp3v(a[1], c[1], e), back: lerp3v(a[2], c[2], e)};
  }
  return {front: fR, back: bR};
};
/** swing phase k (0..1, contact at 0.55) for a strike landing at tc that winds up from tw */
const swingK = (T: number, tw: number, tc: number, tEnd: number) => (T < tw ? 0 : T < tc ? 0.55 * ((T - tw) / (tc - tw)) : T < tEnd ? 0.55 + 0.45 * ((T - tc) / (tEnd - tc)) : 1);
/** the tool stuck in U4's neck (from the killing blow until he wrenches it free) */
const stuckTip = (T: number): V3 => {
  const a = unitAttach(unitD1('U4', Math.max(T, EV.u4kill)));
  const n = add3(lerp3v(a.head, a.chest, 0.45), {x: 0, y: 0.04, z: 0});
  const free = smooth(clamp((T - (EV.toolFree - 0.35)) / 0.35));
  return add3(n, {x: -0.18 * free, y: 0.35 * free, z: -0.22 * free});
};
const BRK_FACE: [number, Face][] = [
  [0, EXPR.effort], [68.6, EXPR.focus], [70.4, EXPR.strain], [EV.u4ham, EXPR.impact], [EV.u4push - 0.06, EXPR.effort], [71.08, EXPR.focus], [EV.u4jab - 0.06, EXPR.alarm], [71.62, EXPR.focus], [71.78, EXPR.alarm], [72.1, EXPR.effort],
  [72.9, EXPR.focus], [EV.u4catch, EXPR.strain], [EV.u4let, EXPR.effort], [76.3, EXPR.strain], [EV.toolFree, EXPR.effort], [79.3, EXPR.alarm],
  [79.6, EXPR.effort], [EV.br2, EXPR.strain], [81.6, EXPR.effort], [EV.grab, EXPR.strain], [EV.release, EXPR.effort], [EV.br3 + 0.1, EXPR.strain],
  [83.3, EXPR.pant], [84.0, EXPR.focus], [88.0, EXPR.pant], [91.8, {...EXPR.pant, worry: 0.4}],
];
const breakerCore = (T: number): CrewOut => {
  const b = bodyAt(BRK_SEGS, T);
  const gauge = toolsR2('breaker', T).gauge ?? 1;
  const port = {front: fromLoc(b, {r: -16, u: 250, f: 118}), back: fromLoc(b, {r: 32, u: 205, f: 34})};
  let H = port;
  let fire = 0;
  let pose: Pose = layer(BRACED({wide: 0.85}), {});
  const mode = (a: number, t0: number, t1: number, z: number) => env(T, a, t0, t1, z);
  // 70.6: the hammer taken on the shaft, held up across over his head
  const blockK = mode(70.35, 70.55, 70.74, 70.98);
  if (blockK > 0) {
    const imp = jolt(T, EV.u4ham, 4.5);
    const bl = {front: fromLoc(b, {r: -44, u: 434 - 26 * imp, f: 70}), back: fromLoc(b, {r: 40, u: 426 - 26 * imp, f: 64})};
    H = {front: lerp3v(H.front, bl.front, blockK), back: lerp3v(H.back, bl.back, blockK)};
    pose = layer(pose, {drop: 26 + 34 * imp * blockK, lean: 6 - 8 * imp, armL: undefined, armR: undefined});
  }
  // (R4) 70.9: the counter to the block — he drives the shaft up and forward into its hammer arm (thrown up and back a step),
  // steps into it, then lets the tool fall back to the port
  const pushK = mode(70.7, 70.86, 70.95, 71.22);
  if (pushK > 0) {
    const ps = {front: fromLoc(b, {r: -44, u: 438, f: 122}), back: fromLoc(b, {r: 40, u: 430, f: 116})};
    H = {front: lerp3v(H.front, ps.front, pushK), back: lerp3v(H.back, ps.back, pushK)};
    pose = layer(pose, {drop: (pose.drop ?? 26) + 10 * pushK, lean: (pose.lean ?? 10) + 12 * pushK});
  }
  // (R4) 71.2 → 71.65: its jab at his face: he sways back from it (the tool low and ready), the fist passes; then the duck
  const swayB = win(T, 71.2, 71.66, 0.14, 0.2);
  if (swayB > 0) pose = layer(pose, {lean: (pose.lean ?? 10) - 24 * swayB, drop: (pose.drop ?? 26) + 8 * swayB, head: {pitch: -10 * swayB}});
  // 71.95: the duck under its punch, and from the duck the low swing into its knee (72.45)
  const duck = mode(71.72, 71.92, 72.12, 72.5);
  if (T > 72.0 && T < 72.95) {
    const k = swingK(T, 72.12, EV.knee, 72.95);
    const tip = add3(unitAttach(unitD1('U4', EV.knee)).kneeL, {x: -0.04, y: 0.02, z: 0});
    const s = swingHands(b, tip, k, true);
    const w = smooth(clamp((T - 72.0) / 0.12)) * (1 - smooth(clamp((T - 72.82) / 0.13)));
    H = {front: lerp3v(H.front, s.front, w), back: lerp3v(H.back, s.back, w)};
    if (Math.abs(T - EV.knee) < 0.06) fire = win(T, EV.knee, EV.knee + 0.08, 0.005, 0.05);
  }
  pose = layer(pose, {drop: (pose.drop ?? 26) + 58 * duck, lean: (pose.lean ?? 10) + 30 * duck, head: {pitch: 16 * duck}});
  // 72.8 → 75.42: he re-cocks; U4 catches the tool's head; the tug (the robot's hand IS the tool's head)
  const tugW = mode(72.82, 73.0, EV.u4let, EV.u4let + 0.06);
  if (tugW > 0) {
    const tip = T < EV.u4catch ? u4CatchAt(T) : unitAttach(unitD1('U4', T)).catchR;
    const s = toolTo(b, tip, {r: 4, u: 270, f: 10});
    H = {front: lerp3v(H.front, s.front, tugW), back: lerp3v(H.back, s.back, tugW)};
    const pull = mode(EV.u4catch, 73.4, 75.3, EV.u4let + 0.05);
    pose = layer(pose, {drop: (pose.drop ?? 26) + 28 * pull, lean: (pose.lean ?? 10) - 22 * pull + 26 * win(T, 74.3, 74.75, 0.1, 0.2), twist: 10 * pull});
  }
  // 75.42: let go — he staggers back, winds up overhead and brings it down on its neck (76.0)
  if (T > EV.u4let && T < 76.12) {
    const k = swingK(T, 75.6, EV.u4kill, 76.4);
    const tip = add3(unitAttach(unitD1('U4', EV.u4kill)).head, {x: 0.05, y: -0.12, z: -0.02});
    const s = swingHands(b, tip, Math.min(k, 0.55));
    const from = toolTo(b, u4TugTip(EV.u4let), {r: 4, u: 270, f: 10});
    const w = smooth(clamp((T - EV.u4let) / 0.18));
    H = {front: lerp3v(from.front, s.front, w), back: lerp3v(from.back, s.back, w)};
    pose = layer(pose, {lean: (pose.lean ?? 10) + (k < 0.36 ? lerp(-12, -14, k / 0.36) : lerp(-14, 30, easeIn((k - 0.36) / 0.19))), drop: (pose.drop ?? 26) + 18 * win(T, 75.95, 76.4, 0.04, 0.2)});
    if (T > EV.u4kill) fire = win(T, EV.u4kill, EV.u4kill + 0.08, 0.005, 0.05);
  }
  // 76.0 → 78.95: stuck in its neck; it slumps and falls forward onto it; he braces and wrenches it out
  if (T >= 76.0 && T < EV.toolFree + 0.45) {
    const tip = stuckTip(Math.min(T, EV.toolFree));
    const s = toolTo(b, tip, {r: 4, u: 250, f: 10});
    const w = 1 - smooth(clamp((T - EV.toolFree - 0.05) / 0.4));
    H = {front: lerp3v(port.front, s.front, w), back: lerp3v(port.back, s.back, w)};
    const yank = win(T, 77.6, EV.toolFree + 0.1, 0.25, 0.12);
    const jer = Math.sin(Math.PI * 2 * 2.3 * Math.max(0, T - 77.6)) * yank;
    const low = w * smooth(clamp((T - 76.9) / 0.6));
    pose = layer(pose, {drop: (pose.drop ?? 26) + 18 * w + 42 * low + 10 * yank, lean: (pose.lean ?? 10) + 16 * w + 18 * low * (1 - yank) - 6 * yank - 6 * jer, twist: 8 * jer});
  }
  // 80.95 → 81.34: arriving at U1's side he swings from overhead into its descending forearm (BR2)
  if (T > 80.9 && T < 81.66) {
    const k = swingK(T, 80.95, EV.br2, 81.85);
    const a = unitAttach(unitD1('U1', EV.br2 - 0.005));
    const tip = lerp3v(a.elbowL, a.wristL, 0.35);
    const s = swingHands(b, tip, k);
    const w = smooth(clamp((T - 80.9) / 0.1));
    H = {front: lerp3v(H.front, s.front, w), back: lerp3v(H.back, s.back, w)};
    pose = layer(pose, {lean: (pose.lean ?? 10) + (k < 0.36 ? -12 : k < 0.55 ? lerp(-12, 32, easeIn((k - 0.36) / 0.19)) : lerp(32, 10, smooth((k - 0.55) / 0.45))), twist: k < 0.36 ? 14 : lerp(14, -8, smooth((k - 0.36) / 0.3)), drop: (pose.drop ?? 26) + 20 * win(T, EV.br2, 81.6, 0.03, 0.2)});
    if (T > EV.br2) fire = win(T, EV.br2, EV.br2 + 0.08, 0.005, 0.05);
  }
  // 81.66 → 82.42: re-cocked at its chest; U1 catches the head and wrenches it; he digs in; the knee goes, it lets go
  const tug2 = mode(81.62, 81.75, EV.release, EV.release + 0.05);
  if (tug2 > 0) {
    const tip = T < EV.grab ? u1CatchAt(T) : unitAttach(unitD1('U1', T)).catchR;
    const s = toolTo(b, tip, {r: 4, u: 280, f: 10});
    H = {front: lerp3v(H.front, s.front, tug2), back: lerp3v(H.back, s.back, tug2)};
    const pull = mode(EV.grab, 82.1, EV.release, EV.release + 0.1);
    pose = layer(pose, {drop: (pose.drop ?? 26) + 30 * pull, lean: (pose.lean ?? 10) - 20 * pull, twist: -14 * pull});
  }
  // 82.42 → 82.8: free, he stumbles back, aims the ram at its open chest and fires (BR3); recoil
  if (T > EV.release && T < 83.4) {
    const chest = unitAttach(unitD1('U1', EV.br3)).chest;
    const thr = smooth(clamp((T - 82.58) / (EV.br3 - 82.58)));
    const rec = T > EV.br3 ? jolt(T, EV.br3, 4) : 0;
    const aimTip = add3(chest, mul3(norm3(sub3(chest, fromLoc(b, {r: 0, u: 300, f: 0}))), -0.3 + 0.32 * thr - 0.16 * rec));
    const s = toolTo(b, aimTip, {r: 0, u: 300, f: 0});
    const from = toolTo(b, u1TugTip(EV.release), {r: 4, u: 280, f: 10});
    const w = smooth(clamp((T - EV.release) / 0.14));
    const out = 1 - smooth(clamp((T - 83.05) / 0.35));
    H = {front: lerp3v(port.front, lerp3v(from.front, s.front, w), out), back: lerp3v(port.back, lerp3v(from.back, s.back, w), out)};
    pose = layer(pose, {lean: (pose.lean ?? 10) + 16 * thr * out - 14 * rec, drop: (pose.drop ?? 26) + 20 * out});
    if (T > EV.br3) fire = win(T, EV.br3, EV.br3 + 0.1, 0.005, 0.07);
  }
  const pts: Record<string, V3> = {front: H.front, back: H.back};
  // the tool rides in both hands (back = right hand on the trigger, front = left on the side handle)
  const runArms: Pose = {armL: {local: {r: -16, u: 262, f: 112}}, armR: {local: {r: 30, u: 208, f: 36}}};
  const u4 = (t: number) => unitAttach(unitD1('U4', t)).head, u1 = (t: number) => unitAttach(unitD1('U1', t)).head;
  const tgt = T < 76.2 ? u4(T) : T < 79.2 ? stuckTip(Math.min(T, EV.toolFree)) : T < 79.6 ? onG(40.0, -0.8, 1.6) : T < 83.0 ? u1(T) : T < 83.7 ? onG(41.0, -3.0, 1.0) : T < 87.6 ? onG(44.6, -0.9, 1.6) : T < 89.5 ? onG(48.3, -1.9, 0.5) : onG(46.6, 1.5, 2.6);
  pose = headTo(pose, b, tgt, 75);
  const crouch = after(T, 91.75, 0.5);
  if (crouch > 0) pose = blendPose(pose, layer(KNEEL('L'), {drop: 76, lean: 4, breath: 0.8, head: {yaw: -40, pitch: 6}}), crouch);
  kneelFeet(b, 'L', crouch);
  const handsOn = b.inRun ? 1 - b.runK : 1;
  const final = glance(withRun(b, withLook(launchPose(pose, 'breaker', T), 'breaker', b, T), runArms), 'breaker', b, T);
  const spec = base('breaker', 'd1brk', 7, b, T, {...final, face: faceFor('breaker', T, BRK_FACE), handL: 'grip', handR: 'grip', twoHanded: true, extra: breaker({back: 1, front: 0, gauge, fire, recoil: fire})},
    handsOn > 0.02 ? {handL: H.front, handR: H.back} : {}, gazeAt('breaker', T, tgt));
  pts.tip = add3(H.back, mul3(norm3(sub3(H.front, H.back)), TOOL_BT));
  return {spec, body: b, pts};
};

// ================================================================== THE TETHER (clerkA)
const TTH_RUN: XZ[] = [{x: 0.1, z: -2.2}, {x: 3.2, z: 3.0}, {x: 6.4, z: 4.85}, {x: 11.5, z: 4.4}, {x: 21, z: -2.0}, {x: 28, z: -5.0}, {x: 35.9, z: -7.55}];
const TTH_STAND: KR[] = [
  [67.9, 35.9, -7.55, 102], [69.0, 36.3, -7.4, 96], [69.95, 36.3, -7.4, 96], [70.4, 35.75, -7.55, 92], [71.5, 35.9, -7.4, 96],
  [73.4, 36.2, -6.9, 112], [EV.yankPull, 36.2, -6.9, 112], [74.85, 35.88, -7.0, 108], [76.4, 35.88, -7.0, 108], [77.8, 36.1, -6.6, 100],
  [80.6, 36.15, -6.45, 104], [EV.clamp2Taut, 36.15, -6.45, 104], [82.6, 35.98, -6.55, 104], [EV.clamp2Tear, 35.98, -6.55, 104], [83.6, 35.7, -6.65, 100],
  [85.0, 35.9, -6.45, 104], [86.6, 36.0, -6.1, 60],
];
const TTH_SEGS: Seg[] = [
  {kind: 'run', path: TTH_RUN, T0: M.CHARGE + CHARGE_GO.tether, T1: 67.9, gait: GAITS.run, A: 1.1, D: 0.7},
  {kind: 'stand', root: TTH_STAND, stag: 0.16},
  {kind: 'run', path: [{x: 36.0, z: -6.1}, {x: 38.6, z: -2.4}, {x: 40.4, z: -1.15}, {x: 42.6, z: -1.05}, {x: 44.9, z: -1.0}], T0: 86.8, T1: 90.2, gait: GAITS.run, A: 0.6, D: 0.6},
  {kind: 'stand', root: [[90.2, 44.9, -1.0, 95], [90.95, 46.3, 0.55, 150], [91.4, 46.7, 1.85, 200], [91.75, 46.7, 1.85, 270], [94.3, 46.7, 1.85, 270]], stag: 0.12},
];
export const TETHER_SHOTS = [
  {name: 'yank', fire: EV.yankFire, bite: EV.yankBite, taut: EV.yankPull, release: 75.15, reelEnd: 75.75, target: 'U5shin'},
  {name: 'hold', fire: EV.clamp2Fire, bite: EV.clamp2Bite, taut: EV.clamp2Taut, release: EV.clamp2Tear, reelEnd: 84.0, target: 'U5chest'},
];
/** the tether's target point for a shot at t */
export const tetherTarget = (name: string, t: number): V3 => (name === 'yank' ? unitAttach(unitD1('U5', Math.min(t, EV.yankBite + 0.4))).kneeR : u5Clamp(t));
const TTH_FACE: [number, Face][] = [[0, EXPR.effort], [68.0, EXPR.focus], [69.95, EXPR.alarm], [70.5, EXPR.focus], [EV.yankPull, EXPR.strain], [75.2, EXPR.focus], [77.6, EXPR.alarm], [78.2, EXPR.focus], [EV.clamp2Taut, EXPR.strain], [EV.clamp2Tear, EXPR.alarm], [83.9, EXPR.focus], [88.0, EXPR.effort], [91.8, EXPR.pant]];
const tetherCore = (T: number): CrewOut => {
  const b = bodyAt(TTH_SEGS, T);
  let pose: Pose = layer(BRACED({wide: 0.75}), {armR: {local: {r: 30, u: 240, f: 90}}, armL: {local: {r: -30, u: 220, f: 60}}, handL: 'open'});
  let recoil = 0;
  let aimAt: V3 | null = null;
  let muzzle = add3(fromLoc(b, {r: 30, u: 240, f: 90}), mul3({x: fwdOf(b.heading).x, y: 0, z: fwdOf(b.heading).z}, 0.36));
  // she aims (covers) whenever a unit is coming: the two shots, and between them the launcher stays on U5
  const cover = win(T, 75.75, 80.4, 0.3, 0.3) + win(T, 84.0, 87.3, 0.3, 0.4);
  const shots = [...TETHER_SHOTS.map((s) => ({...s, w: win(T, s.fire - 0.9, s.reelEnd + 0.3, 0.35, 0.4)})), {name: 'cover', fire: 1e9, bite: 1e9, taut: 1e9, release: 1e9, reelEnd: 1e9, target: 'U5', w: clamp(cover)}];
  for (const s of shots) {
    if (s.w <= 0) continue;
    const tgt = s.name === 'cover' ? unitAttach(unitD1('U5', T)).chest : tetherTarget(s.name, Math.min(T, s.bite));
    aimAt = tgt;
    const shoulder = fromLoc(b, {r: 36, u: 300, f: 0});
    const d = norm3(sub3(tgt, shoulder));
    const handR = add3(shoulder, mul3(d, 0.5));
    const fr = T > s.fire ? clamp((T - s.fire) / 0.35) : 0;
    recoil = Math.max(recoil, T > s.fire && T < s.fire + 0.35 ? Math.sin(Math.PI * fr) : 0);
    const haul = win(T, s.taut, s.release, 0.08, 0.3) * (s.name === 'hold' ? 1.2 : 1);
    const hR = add3(handR, mul3(d, -0.08 * recoil - 0.22 * haul));
    muzzle = lerp3v(muzzle, add3(hR, add3(mul3(d, 0.38), {x: 0, y: 0.07, z: 0})), s.w);
    const p = layer(AIM, {
      armR: {local: toLoc(b, hR), pole: {r: 0.6, u: -1, f: 0}, palm: {r: -1, u: 0, f: 0}},
      armL: {local: toLoc(b, add3(add3(hR, mul3(d, -0.18)), {x: 0, y: -0.05, z: 0})), palm: {r: 1, u: 0.3, f: 0}},
      lean: lerp(6, -18, clamp(haul)), drop: 18 + 18 * clamp(haul), twist: 14,
    });
    pose = blendPose(pose, p, s.w);
  }
  // 70.15: U5's hammer — she backs off out of it
  const back = win(T, 69.9, 70.6, 0.1, 0.25);
  pose = layer(pose, {lean: (pose.lean ?? 10) - 18 * back, drop: (pose.drop ?? 26) + 10 * back});
  // 83.35: the clamp torn out: the line goes slack, she staggers back
  const snap = win(T, EV.clamp2Tear, 83.9, 0.04, 0.3);
  pose = layer(pose, {lean: (pose.lean ?? 10) - 16 * snap});
  const look = aimAt ?? (T < 76 ? unitAttach(unitD1('U5', T)).head : T < 88 ? unitAttach(unitD1('U5', Math.min(T, 87))).head : onG(46.6, 1.0, 1.4));
  pose = layer(pose, {head: {yaw: lookYaw(b, look, 75) * 0.85, pitch: lookPitch(b, look)}});
  const crouch = after(T, 91.6, 0.42);
  if (crouch > 0) pose = blendPose(pose, layer(KNEEL('L'), {drop: 80, lean: 10, armR: {local: {r: 40, u: 160, f: 90}}, head: {yaw: 40, pitch: 4}}), crouch);
  kneelFeet(b, 'L', crouch);
  const runArms: Pose = {armR: {local: {r: 26, u: 236, f: 64}}, armL: b.gait?.armL};
  const final = glance(withRun(b, withLook(launchPose(pose, 'tether', T), 'tether', b, T), runArms), 'tether', b, T);
  const spool = TETHER_SHOTS.reduce((s, q) => s * (T > q.fire && T < q.reelEnd ? 0.55 : 1), 1);
  const spec = base('tether', 'd1tth', 3, b, T, {...final, face: faceFor('tether', T, TTH_FACE), handR: 'grip', handL: final.handL ?? 'open', holdR: tetherLauncher({loaded: !TETHER_SHOTS.some((q) => T > q.fire && T < q.reelEnd), recoil}), extra: hipReel(spool)}, {}, gazeAt('tether', T, look));
  return {spec, body: b, pts: {muzzle}};
};

// ================================================================== THE RUNNER (guesser, halligan)
const RUN_RUN1: XZ[] = [{x: 0.3, z: -0.9}, {x: 3.4, z: 3.6}, {x: 6.6, z: 4.75}, {x: 11, z: 4.6}, {x: 20, z: 0.0}, {x: 30, z: -1.6}, RUN_ARRIVE];
// after the pin: round the pile (west, then south of U1's feet) behind the Director, up to the rim and to the slab
const RUN_AFTER: KR[] = [
  [84.05, 39.5, -3.4, 100], [84.38, 39.95, -3.6, 120], [85.0, 39.95, -3.6, 118], [86.2, 39.5, -2.2, 160], [87.4, 41.1, -1.3, 95], [88.6, 43.3, -1.3, 90],
  [90.2, 44.4, -0.2, 60], [91.1, 45.8, 0.2, 120], [91.6, 46.55, 1.05, 270], [94.3, 46.55, 1.05, 270],
];
const RUN_SEGS: Seg[] = [
  {kind: 'run', path: RUN_RUN1, T0: M.CHARGE + CHARGE_GO.runner, T1: 68.5, gait: GAITS.fast, A: 1.0, D: 0.7},
  {kind: 'stand', root: RUN_FIGHT, stag: 0.12, skids: [EV.u2hit]},
  {kind: 'stand', root: RUN_AFTER, stag: 0.1},
];
const HAL_TIP = 0.704; // the halligan's tip beyond the back hand (halliganTip: 247 − 70 rig units)
/** the halligan between his hands from a tip and a direction: back (right) hand, front (left) 0.32 m up the bar */
const halFrom = (tip: V3, d: V3) => { const back = sub3(tip, mul3(d, HAL_TIP)); return {back, front: add3(back, mul3(d, 0.32))}; };
const RUN_FACE: [number, Face][] = [
  [0, EXPR.effort], [68.6, EXPR.focus], [69.7, EXPR.alarm], [70.1, EXPR.focus], [EV.u2ham1 - 0.1, EXPR.strain], [EV.hook, EXPR.effort], [72.6, EXPR.focus],
  [EV.u2punch2 - 0.2, EXPR.alarm], [73.75, EXPR.focus], [EV.runJab - 0.15, EXPR.effort], [75.4, EXPR.focus], [EV.u2ham2 - 0.1, EXPR.strain], [76.4, EXPR.focus],
  [EV.u2punch3 - 0.2, EXPR.alarm], [78.3, {...EXPR.focus, worry: 0.3}], [EV.u2hit, EXPR.impact], [79.9, EXPR.dazed], [81.2, EXPR.strain], [81.8, EXPR.dazed],
  [EV.u2wind, EXPR.fear], [EV.crash + 0.02, EXPR.alarm], [83.8, EXPR.effort], [85.2, EXPR.pant], [88.5, EXPR.effort], [91.6, EXPR.pant],
];
const runnerCore = (T: number): CrewOut => {
  const b = bodyAt(RUN_SEGS, T);
  let pose: Pose = layer(BRACED({wide: 0.7}), {});
  const u2 = (t: number) => unitAttach(unitD1('U2', t));
  // the guard: bar diagonal in front, tip up and forward
  const guardTip = fromLoc(b, {r: -40, u: 360, f: 150});
  let H = halFrom(guardTip, norm3(sub3(guardTip, fromLoc(b, {r: 40, u: 190, f: 30}))));
  const set = (h: {back: V3; front: V3}, w: number) => { H = {back: lerp3v(H.back, h.back, w), front: lerp3v(H.front, h.front, w)}; };
  // parries: the bar up across over his head; the hammer lands on it
  const parry = (t0: number, kneel = false) => {
    const w = env(T, t0 - 0.3, t0 - 0.06, t0 + 0.12, t0 + 0.5);
    if (w <= 0) return 0;
    const imp = jolt(T, t0, 5);
    const up = kneel ? 300 : 425;
    set({back: fromLoc(b, {r: 40, u: up - 26 * imp, f: kneel ? 48 : 72}), front: fromLoc(b, {r: -44, u: up + 6 - 26 * imp, f: kneel ? 60 : 84})}, w);
    pose = layer(pose, {drop: (pose.drop ?? 26) + 22 * imp * w, lean: (pose.lean ?? 10) - 6 * imp});
    return w;
  };
  parry(EV.u2ham1); parry(EV.u2ham2); parry(EV.u2punch4, true);
  // dodges: sways back / ducks (the root keys take the step)
  const sway = Math.max(win(T, EV.u2punch1 - 0.22, EV.u2punch1 + 0.3, 0.12, 0.25), win(T, EV.u2punch3 - 0.22, EV.u2punch3 + 0.3, 0.12, 0.25));
  const duck = win(T, EV.u2punch2 - 0.25, EV.u2punch2 + 0.3, 0.12, 0.22);
  pose = layer(pose, {lean: (pose.lean ?? 10) - 22 * sway + 30 * duck, drop: (pose.drop ?? 26) + 8 * sway + 60 * duck, head: {pitch: -10 * sway + 14 * duck}});
  // 71.65 the hook: the adze over its forearm, yanked back and down; 72.05 the bar on its head
  const hk = win(T, EV.hook - 0.18, EV.smack - 0.05, 0.15, 0.1);
  if (hk > 0) {
    const fa = u2(Math.min(T, EV.hook + 0.05)).forearmL;
    const pull = smooth(clamp((T - EV.hook) / 0.3));
    const tip = add3(fa, {x: -0.25 * pull, y: -0.3 * pull, z: 0.05});
    set(halFrom(tip, norm3(sub3(tip, fromLoc(b, {r: 30, u: 220, f: 20})))), hk);
    pose = layer(pose, {lean: (pose.lean ?? 10) - 18 * pull * hk, drop: (pose.drop ?? 26) + 16 * hk, twist: 16 * pull * hk});
  }
  const sm = env(T, EV.smack - 0.28, EV.smack, EV.smack + 0.06, EV.smack + 0.5);
  if (sm > 0) {
    const head = u2(EV.smack).head;
    const k = T < EV.smack ? easeIn((T - (EV.smack - 0.28)) / 0.28) : 1;
    const wind = fromLoc(b, {r: 60, u: 430, f: -10});
    const tip = lerp3v(wind, add3(head, {x: -0.05, y: 0.05, z: 0.1}), k);
    set(halFrom(tip, norm3(sub3(tip, fromLoc(b, {r: 20, u: 300, f: 10})))), sm);
    pose = layer(pose, {lean: (pose.lean ?? 10) + 20 * k * sm, twist: -18 * k * sm});
  }
  // 74.95 the fork into its knee joint (low thrust)
  const jab = env(T, EV.runJab - 0.3, EV.runJab, EV.runJab + 0.1, EV.runJab + 0.45);
  if (jab > 0) {
    const knee = u2(EV.runJab).kneeR;
    const k = T < EV.runJab ? easeIn((T - (EV.runJab - 0.3)) / 0.3) : 1;
    const tip = lerp3v(fromLoc(b, {r: 0, u: 160, f: 120}), knee, k);
    set(halFrom(tip, norm3(sub3(tip, fromLoc(b, {r: 30, u: 230, f: 0})))), jab);
    pose = layer(pose, {lean: (pose.lean ?? 10) + 26 * jab, drop: (pose.drop ?? 26) + 40 * jab});
  }
  // 79.55 the hook catches him: knocked back and down onto his right knee, the bar still up; parries from the knee;
  // the finishing hammer raised over him; the crash; he throws himself clear (west) and gets up
  const down = env(T, EV.u2hit, 79.95, 83.25, 83.75);
  const knock = win(T, EV.u2hit, 80.1, 0.05, 0.3);
  if (down > 0 || knock > 0) {
    pose = blendPose(pose, layer(KNEEL('R'), {drop: 84, lean: 4, twist: 10}), down);
    pose = layer(pose, {lean: (pose.lean ?? 10) - 30 * knock, side: -18 * knock, head: {roll: -14 * knock, pitch: -12 * knock}});
    const bar = {back: fromLoc(b, {r: 46, u: 250, f: 70}), front: fromLoc(b, {r: -30, u: 290, f: 100})};
    if (T > 79.95 && T < 83.6) set(bar, down * (1 - env(T, EV.u2punch4 - 0.3, EV.u2punch4 - 0.06, EV.u2punch4 + 0.12, EV.u2punch4 + 0.5)));
    // the raised hammer: bar up over his head, leaning away
    const cover = env(T, EV.u2wind, 82.95, EV.crash, 83.4);
    if (cover > 0) { set({back: fromLoc(b, {r: 40, u: 330, f: 30}), front: fromLoc(b, {r: -40, u: 345, f: 50})}, cover); pose = layer(pose, {lean: (pose.lean ?? 10) - 16 * cover}); }
  }
  kneelFeet(b, 'R', down);
  const clear = win(T, EV.crash + 0.03, 83.95, 0.1, 0.3);
  pose = layer(pose, {lean: (pose.lean ?? 10) - 20 * clear, drop: (pose.drop ?? 26) + 40 * clear, side: (pose.side ?? 0) - 14 * clear});
  // 84.55: he drives the halligan down into U2's shoulder joint as it tries to rise (its pauldron flies)
  const pin = env(T, EV.pin - 0.35, EV.pin, EV.pin + 0.18, EV.pin + 0.6);
  if (pin > 0) {
    const sh = u2(EV.pin).shoulderL;
    const k = T < EV.pin ? easeIn((T - (EV.pin - 0.35)) / 0.35) : 1;
    const tip = lerp3v(add3(sh, {x: -0.1, y: 0.75, z: 0.1}), add3(sh, {x: 0, y: 0.05, z: 0}), k);
    set(halFrom(tip, norm3(sub3(tip, fromLoc(b, {r: 20, u: 330, f: 0})))), pin);
    pose = layer(pose, {lean: (pose.lean ?? 10) + 30 * pin, drop: (pose.drop ?? 26) + 30 * pin});
  }
  // eyes on U2 through the fight; U1 coming; U2 down; the gap; the slab
  const tgt = T < EV.crash ? u2(T).head : T < 84.0 ? u2(Math.min(T, 83.5)).head : T < 85.2 ? u2(EV.pin).shoulderL : T < 89 ? onG(44.6, -0.9, 1.6) : onG(46.6, 1.4, 2.6);
  pose = headTo(pose, b, tgt, 75);
  const crouch = after(T, 91.62, 0.42);
  if (crouch > 0) pose = blendPose(pose, layer(KNEEL('R'), {drop: 84, lean: 14, head: {yaw: 35}}), crouch);
  kneelFeet(b, 'R', crouch);
  const twoH = T > 68.3;
  const runArms: Pose = {armR: {local: {r: 40, u: 220, f: 60}}, armL: b.gait?.armL};
  const final = glance(withRun(b, withLook(launchPose(pose, 'runner', T), 'runner', b, T), runArms), 'runner', b, T);
  const onTool = twoH && !b.inRun ? 1 : 0;
  const spec = base('runner', 'd1run', 4, b, T, {
    ...final, face: faceFor('runner', T, RUN_FACE), handR: 'grip', handL: twoH ? 'grip' : final.handL ?? 'fist', twoHanded: twoH,
    ...(twoH ? {extra: halligan2({back: 1, front: 0})} : {holdR: halligan1({ang: 72})}),
  }, onTool ? {handR: H.back, handL: H.front} : {}, gazeAt('runner', T, tgt));
  return {spec, body: b, pts: {tip: add3(H.back, mul3(norm3(sub3(H.front, H.back)), HAL_TIP)), back: H.back, front: H.front}};
};

// ================================================================== THE DRONE PILOT (checker)
// (starts beside B's slab, east of its broken corner, clear of the shed chunks: C ends her here)
const DRN_RUN: XZ[] = [{x: 1.28, z: 2.12}, {x: 3.6, z: 4.9}, {x: 6.8, z: 5.4}, {x: 11, z: 5.0}, {x: 20, z: 2.5}, {x: 35.2, z: 1.2}];
const DRN_SEGS: Seg[] = [
  {kind: 'run', path: DRN_RUN, T0: M.CHARGE + CHARGE_GO.drone, T1: 68.9, gait: GAITS.heavy, A: 1.2, D: 0.8},
  {kind: 'stand', root: [[68.9, 35.2, 1.2, 84], [76.6, 35.2, 1.2, 84], [77.3, 35.45, 1.05, 76], [86.6, 35.45, 1.05, 80]], stag: 0.08},
  {kind: 'run', path: [{x: 35.45, z: 1.05}, {x: 37.6, z: 3.4}, {x: 40.6, z: 5.6}, {x: 43.6, z: 6.4}, {x: 45.4, z: 6.3}], T0: 87.8, T1: 91.4, gait: GAITS.heavy, A: 0.6, D: 0.6},
  {kind: 'stand', root: [[91.4, 45.4, 6.3, 88], [91.85, 46.2, 6.3, 95], [92.2, 46.55, 6.05, 250], [94.3, 46.55, 6.05, 250]], stag: 0.08},
];
/** the allied drone: over the Crew; it dives at U4's eye (EV.harry) while U4 holds the breaker's tool, then climbs away */
export const ALLY_KEYS: [number, number, number, number][] = [
  [56, 2.0, 6.0, 0.5], [59.95, 3.2, 6.2, 1.0], [62, 10, 5.2, 3.0], [64, 19, 4.8, 2.4], [66, 29, 4.6, 1.0], [68.3, 37.5, 4.4, 0.5],
  [70.5, 39.5, 4.6, 1.8], [73.0, 38.9, 4.8, 1.4], [74.4, 39.3, 4.3, 2.3], [76.4, 39.4, 4.3, 2.4], [78.0, 38.9, 4.9, 2.2], [80, 39.0, 4.9, 0.4], [84, 38.8, 5.2, 2.8], [87.5, 42.6, 5.2, 3.8], [90.5, 45.2, 4.3, 4.9], [94.3, 45.4, 3.5, 4.6],
];
/** the dive (74.4 → 76.4): a continuous path through these points (zero velocity at the ends: it leaves and rejoins the keys) */
export const ALLY_DIVE: [number, number, number, number][] = [
  [74.4, 39.3, 4.3, 2.3], [74.95, 40.05, 3.1, 3.0], [EV.harry, 40.98, 1.95, 3.55], [75.5, 40.75, 2.35, 3.35], [75.85, 40.1, 3.5, 2.8], [76.4, 39.4, 4.3, 2.4],
];
const DRN_FACE: [number, Face][] = [[0, EXPR.effort], [69.0, EXPR.focus], [74.7, EXPR.strain], [75.6, EXPR.focus], [79.5, {...EXPR.focus, worry: 0.4}], [86.6, EXPR.effort], [92.45, EXPR.pant]];
const droneCore = (T: number, allyPos: V3): CrewOut => {
  const b = bodyAt(DRN_SEGS, T);
  const tense = Math.max(win(T, 79.0, 84.5, 0.4, 0.6) * 0.5, win(T, 74.6, 75.7, 0.2, 0.3));
  let pose: Pose = layer(BRACED({fists: false}), {
    drop: 12 + 14 * tense, lean: 8 + 12 * tense,
    armL: {local: {r: -22, u: 245, f: 92 + 14 * tense}}, armR: {local: {r: 22, u: 245, f: 92 + 14 * tense}},
  });
  pose = layer(pose, {head: {yaw: lookYaw(b, allyPos, 80), pitch: lookPitch(b, allyPos)}});
  const crouch = after(T, 92.25, 0.45);
  if (crouch > 0) pose = blendPose(pose, layer(KNEEL('L'), {drop: 82, armL: {local: {r: -20, u: 170, f: 90}}, armR: {local: {r: 20, u: 170, f: 90}}, head: {yaw: -30, pitch: 10}}), crouch);
  kneelFeet(b, 'L', crouch);
  const runArms: Pose = {armL: {local: {r: -20, u: 236, f: 84}}, armR: {local: {r: 20, u: 236, f: 84}}};
  const final = glance(withRun(b, withLook(launchPose(pose, 'drone', T), 'drone', b, T), runArms), 'drone', b, T);
  const spec = base('drone', 'd1drn', 5, b, T, {...final, face: faceFor('drone', T, DRN_FACE), handL: 'grip', handR: 'grip', twoHanded: true, extra: controller({lit: 1})}, {}, gazeAt('drone', T, allyPos));
  return {spec, body: b};
};

// ================================================================== THE FLARE CARRIER (host)
const FLR_RUN: XZ[] = [{x: 1.0, z: 4.8}, {x: 4.3, z: 5.6}, {x: 7.6, z: 5.0}, {x: 12.5, z: 5.6}, {x: 16, z: 7.6}, {x: 25, z: 9.4}, {x: 37.0, z: 7.45}];
const FLR_SEGS: Seg[] = [
  {kind: 'run', path: FLR_RUN, T0: M.CHARGE + CHARGE_GO.flares, T1: 68.55, gait: GAITS.run, A: 1.1, D: 0.7},
  {kind: 'stand', root: [
    [68.55, 37.0, 7.45, 88], [70.85, 37.0, 7.45, 88], [71.3, 36.6, 7.68, 92], [72.7, 36.6, 7.68, 90], [73.1, 36.3, 7.92, 88],
    [74.6, 36.3, 7.92, 40], [75.7, 36.05, 7.45, 20], [EV.flareThrow + 0.3, 36.05, 7.45, 24], [78.3, 35.5, 6.4, 40], [87.4, 35.5, 6.4, 72],
  ], stag: 0.12},
  {kind: 'run', path: [{x: 35.5, z: 6.4}, {x: 38.8, z: 6.0}, {x: 42.6, z: 5.4}, {x: 45.0, z: 5.5}], T0: 87.6, T1: 90.65, gait: GAITS.run, A: 0.6, D: 0.6},
  {kind: 'stand', root: [[90.65, 45.0, 5.5, 85], [91.2, 46.0, 5.5, 80], [91.8, 46.75, 5.3, 270], [94.3, 46.75, 5.3, 270]], stag: 0.12},
];
export const FLARE = {strike: EV.flareStrike, throw: EV.flareThrow, hit: EV.flareHit};
const FLR_FACE: [number, Face][] = [[0, EXPR.effort], [68.6, EXPR.focus], [70.9, EXPR.alarm], [71.4, EXPR.focus], [72.75, EXPR.alarm], [73.2, EXPR.focus], [74.5, {...EXPR.alarm, mouth: 'flat'}], [76.1, EXPR.effort], [77.4, EXPR.focus], [86.6, EXPR.effort], [91.85, EXPR.pant]];
const flaresCore = (T: number): CrewOut => {
  const b = bodyAt(FLR_SEGS, T);
  let pose: Pose = layer(BRACED({wide: 0.75, fists: false}), {});
  // U6's punches: she sways out of them
  const sway = Math.max(win(T, EV.u6punch - 0.22, EV.u6punch + 0.3, 0.12, 0.25), win(T, 72.68, 73.2, 0.12, 0.25));
  pose = layer(pose, {lean: (pose.lean ?? 10) - 22 * sway, drop: (pose.drop ?? 26) + 10 * sway});
  // draw a flare from the satchel (in her hand from 76.55, when the bag shows one fewer), strike it, throw
  const draw = win(T, EV.flareDraw, EV.flareStrike, 0.3, 0.05);
  if (draw > 0) pose = blendPose(pose, layer(pose, {armR: {local: {r: 60, u: 150, f: 10}}, armL: {local: {r: -30, u: 230, f: 90}}, head: {pitch: 18}}), draw);
  const thK = clamp((T - (FLARE.throw - 0.4 * 0.75)) / 0.75);
  const thW = win(T, FLARE.throw - 0.32, FLARE.throw + 0.6, 0.06, 0.3);
  if (thW > 0) pose = blendPose(pose, THROW(thK), thW);
  // after the throw: between the units and the two she is protecting, hand on the satchel, eyes on them
  const guardK = win(T, 77.7, 86.6, 0.4, 0.3);
  if (guardK > 0) pose = blendPose(pose, layer(pose, {armL: {local: {r: -70, u: 230, f: 60}}, handL: 'open', armR: {local: {r: 40, u: 170, f: 10}}}), guardK);
  const u6 = unitAttach(unitD1('U6', T));
  const tgt = T < 77.7 ? u6.head : T < 86.6 ? lerp3v(u6.head, unitAttach(unitD1('U8', T)).head, 0.5) : onG(46.6, 4.0, 2.6);
  pose = headTo(pose, b, tgt, 70);
  const crouch = after(T, 91.85, 0.5);
  if (crouch > 0) pose = blendPose(pose, layer(KNEEL('R'), {drop: 80, head: {yaw: -30}}), crouch);
  kneelFeet(b, 'R', crouch);
  const runArms: Pose = {armL: b.gait?.armL, armR: b.gait?.armR};
  const final = glance(withRun(b, withLook(launchPose(pose, 'flares', T), 'flares', b, T), runArms), 'flares', b, T);
  const holding = T > 76.55 && T < FLARE.throw;
  const lit = T > FLARE.strike ? 1 : 0;
  const spec = base('flares', 'd1flr', 9, b, T, {...final, face: faceFor('flares', T, FLR_FACE), handR: holding ? 'grip' : final.handR ?? 'open', holdR: holding ? flareHold({lit, t: T}) : undefined}, {}, gazeAt('flares', T, tgt));
  return {spec, body: b, pts: {hand: fromLoc(b, {r: 14, u: 330, f: 150})}};
};

// ================================================================== THE DECOY MAKER (clerkB: sketching the figures for D2)
const DEC_RUN: XZ[] = [{x: 0.6, z: 5.9}, {x: 4.0, z: 6.0}, {x: 7.4, z: 5.6}, {x: 13, z: 5.8}, {x: 24, z: 4.8}, {x: 34.0, z: 4.6}];
const DEC_SEGS: Seg[] = [
  {kind: 'run', path: DEC_RUN, T0: M.CHARGE + CHARGE_GO.decoy, T1: 69.0, gait: GAITS.heavy, A: 1.2, D: 0.8},
  {kind: 'stand', root: [[69.0, 34.0, 4.6, 86], [76.25, 34.0, 4.6, 86], [76.85, 33.45, 5.0, 62], [78.6, 33.45, 5.0, 62], [79.3, 33.9, 4.7, 80], [86.4, 33.9, 4.7, 84]], stag: 0.06},
  {kind: 'run', path: [{x: 33.9, z: 4.7}, {x: 37.5, z: 4.95}, {x: 41.6, z: 5.2}, {x: 45.1, z: 5.0}], T0: 86.55, T1: 90.3, gait: GAITS.heavy, A: 0.6, D: 0.6},
  {kind: 'stand', root: [[90.3, 45.1, 5.0, 86], [90.95, 46.7, 4.5, 270], [94.3, 46.7, 4.5, 270]], stag: 0.06},
];
const DEC_FACE: [number, Face][] = [[0, EXPR.effort], [69.2, {...EXPR.focus, worry: 0.4}], [76.05, EXPR.fear], [77.4, EXPR.alarm], [78.2, {...EXPR.focus, worry: 0.5}], [86.4, EXPR.effort], [91.05, EXPR.pant]];
const decoyCore = (T: number): CrewOut => {
  const b = bodyAt(DEC_SEGS, T);
  // kneeling behind the line, sketching the figures (the decoy for D2) — until U6 comes for her; back to it after
  const sk = Math.max(win(T, 69.4, 76.1, 0.5, 0.2), win(T, 79.4, 86.3, 0.4, 0.3));
  let pose: Pose = layer(BRACED({wide: 0.6, fists: false}), {drop: 10, lean: 6, armL: {local: {r: -28, u: 215, f: 92}, pole: {r: -1, u: -0.7, f: 0}, palm: {r: 0.4, u: 0.3, f: -1}}, handR: 'open'});
  if (sk > 0) pose = blendPose(pose, layer(KNEEL('L'), SKETCH(T, 1)), sk);
  const tgt = T < 76.0 ? onG(34.6, 4.0, 0.7) : T < 79.4 ? unitAttach(unitD1('U6', T)).head : T < 86.3 ? onG(34.6, 4.0, 0.7) : onG(46.6, 3.0, 1.2);
  pose = headTo(pose, b, tgt, 70, sk > 0.5 ? 0.35 : 1);
  kneelFeet(b, 'L', sk);
  const crouch = after(T, 91.05, 0.5);
  if (crouch > 0) pose = blendPose(pose, layer(KNEEL('L'), {drop: 82, lean: 4, armL: {local: {r: -26, u: 180, f: 90}, palm: {r: 0.4, u: 0.3, f: -1}}, head: {yaw: -25, pitch: 6}}), crouch);
  kneelFeet(b, 'L', crouch);
  const runArms: Pose = {armL: {local: {r: -26, u: 232, f: 70}}, armR: b.gait?.armR};
  const final = glance(withRun(b, withLook(launchPose(pose, 'decoy', T), 'decoy', b, T), runArms), 'decoy', b, T);
  const spec = base('decoy', 'd1dec', 6, b, T, {...final, face: {...faceFor('decoy', T, DEC_FACE), ...(sk > 0.5 ? {lookY: 0.8} : {})}, handL: 'grip', handR: sk > 0.5 ? 'point' : 'open', holdL: tablet({screen: true, glow: 0.2 + 0.25 * sk})}, {}, sk > 0.5 ? undefined : gazeAt('decoy', T, tgt));
  return {spec, body: b};
};

/**
 * (R4) Head turns are eased in time. Every role's head follows a target chosen by time windows (U1, the breaker coming, U1 down,
 * U3, the bowl, the next look…), so each switch turned the head by up to 150° in ONE frame (probe: the Director 80.70 -1°→75° and
 * back at 80.97 in the rescue's close shot, the breaker 79.20, the runner 85.20, the pilot 76.87 80°→−80°, …). The head's yaw,
 * pitch and roll are a causal average of the last 7 frames (weights 1…0.2, ≈ 0.08 s behind): a switch becomes a quick turn over
 * ~6 frames (≤ 25°/frame), a steady look is unchanged, and nothing else in the pose is touched.
 */
const HEAD_K = [1, 0.85, 0.7, 0.55, 0.4, 0.3, 0.2];
const easeHead = (core: (T: number) => CrewOut, T: number): CrewOut => {
  const out = core(T);
  const p0 = out.spec.pose as Pose | undefined;
  if (!p0 || typeof p0 !== 'object' || !p0.head) return out;
  let yaw = 0, pitch = 0, roll = 0, W = 0;
  for (let i = 0; i < HEAD_K.length; i++) {
    const h = ((i === 0 ? out : core(T - i / 30)).spec.pose as Pose).head ?? p0.head;
    yaw += HEAD_K[i] * (h.yaw ?? 0); pitch += HEAD_K[i] * (h.pitch ?? 0); roll += HEAD_K[i] * (h.roll ?? 0); W += HEAD_K[i];
  }
  return {...out, spec: {...out.spec, pose: {...p0, head: {yaw: yaw / W, pitch: pitch / W, roll: roll / W}}}};
};
export const directorAt = (T: number): CrewOut => easeHead(directorCore, T);
export const breakerAt = (T: number): CrewOut => easeHead(breakerCore, T);
export const tetherAt = (T: number): CrewOut => easeHead(tetherCore, T);
export const runnerAt = (T: number): CrewOut => easeHead(runnerCore, T);
export const droneAt = (T: number, allyPos: V3): CrewOut => easeHead((t) => droneCore(t, allyPos), T);
export const flaresAt = (T: number): CrewOut => easeHead(flaresCore, T);
export const decoyAt = (T: number): CrewOut => easeHead(decoyCore, T);

export const CREW_ROLES = ['director', 'breaker', 'tether', 'runner', 'drone', 'flares', 'decoy'] as const;
export type {FigFrame};

// ------------------------------------------------------------------ footfalls (dust where each running foot lands)
const ALL_SEGS: Record<string, Seg[]> = {director: DIR_SEGS, breaker: BRK_SEGS, tether: TTH_SEGS, runner: RUN_SEGS, drone: DRN_SEGS, flares: FLR_SEGS, decoy: DEC_SEGS};
export type Footfall = {t: number; pos: V3; key: string; speed: number};
/** every running footfall of the Crew in (T − win, T] (time, world point, speed) */
export const crewFootfalls = (T: number, wn = 1.2): Footfall[] => {
  const out: Footfall[] = [];
  for (const [who, segs] of Object.entries(ALL_SEGS)) segs.forEach((s, si) => {
    if (s.kind !== 'run') return;
    const A = s.A ?? 1.0, D = s.D ?? 0.6, L = pathLen(s.path);
    const a = Math.max(s.T0, T - wn), b = Math.min(T, s.T1);
    if (b <= a) return;
    const d = (t: number) => runDist(t, s.T0, s.T1, L, A, D);
    const d0 = d(a), d1 = d(b), W = s.gait.stride;
    for (const phi of [0, 0.5]) {
      for (let k = Math.ceil(d0 / W + phi); (k - phi) * W <= d1 && k < 1e4; k++) {
        const dk = (k - phi) * W;
        if (dk < 0.3) continue;
        let lo = a, hi = b;
        for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2; if (d(m) < dk) lo = m; else hi = m; }
        const g = gaitW(s.path, dk + 1e-3, s.gait, G);
        out.push({t: hi, pos: phi === 0 ? g.footR : g.footL, key: `${who}${si}_${k}_${phi}`, speed: runSpeed(hi, s.T0, s.T1, L, A, D)});
      }
    }
  });
  return out;
};
void [lastXZ, easeOut];
