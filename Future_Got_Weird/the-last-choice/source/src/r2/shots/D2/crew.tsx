// Section D2: the Crew as functions of FILM time T (world metres). Every shot samples the same choreography, so
// positions hold across cuts. It starts exactly where D1 leaves them (D1's SPOTS: kneeling in a row behind the cover
// slab on the crater's west rim, backs to it) and ends with all seven regrouped on the rim crest by the girder.
// Runs use gaitW on groundH (planted feet); between runs each person stands on a keyed root with planted steps.
// Tool contacts are solved to world points on the machines (unitAttach) and become world hand targets.
//
//   flares  draws, pulls the pins and lobs two canisters over the slab into the crater (D2-1); waits; joins at BRIGHT
//   decoy   sketches the figures (insert), sets the tablet on the slab's top edge, taps the projector on; takes it
//           down at 112.6 and joins at BRIGHT
//   drone   flies the allied drone from the slab; moves north along the rim at 104; it shields the runner at SHIELD
//   director, breaker, runner, tether: on the Director's signal they run north along the rim to the girder (98.2–101),
//           hold, and at FLANK hit the distracted units from behind: the breaker breaks B's knee, the Director bashes
//           A, the runner pries B's back plate and rips its cables; they fall back to the crest; the tether clamps A,
//           wraps post 3, the reel drags A into C and both slam into the girder; D backhands the runner, the breaker
//           catches him; the drone takes D's next blow; the Director bashes D down; BRIGHT.
import {V3, add3, sub3, mul3, norm3, lerp, clamp, smooth, easeOut, easeIn} from '../../../kit/math';
import {
  FigSpec, Pose, keyPose, blendPose, layer, lookR2, dmgR2, toolsR2, gaitW, GaitW, BRACED, BASH, AIM, THROW, PRY, KNEEL, STAND, KNOCKED_BACK, CATCH_BODY,
  plateWear, tetherLauncher, hipReel, tablet, breaker, controller, halligan1, halligan2, canister, Role2, Rig2, Part, PlateState,
} from '../../rig';
import type {FigProps} from '../../rig';
import {unitAttach} from '../../mech';
import {XZ, KP, KR, G, onG, keyRoot, footAt, autoSteps, runDist, runSpeed, cruise, pathLen, fwdOf, rightOf, headingTo, wrapD, win, after} from '../D1/motion';
import {SPOTS} from '../D1/crew';
import {EV2, unitD2, B_FL, A_FL, ANCHOR, D_UP, SHIELD_AT} from './machines';

// ------------------------------------------------------------------ the body framework (as D1)
type Seg =
  | {kind: 'run'; path: XZ[]; T0: number; T1: number; gait: GaitW; A?: number; D?: number}
  | {kind: 'stand'; root: KR[]; feet?: {L: KP[]; R: KP[]}; stag?: number}
  | {kind: 'fn'; T0: number; at: (T: number) => {pos: V3; heading: number; footL: V3; footR: V3}};

const GAITS = {
  dir: {stride: 2.1, duty: 0.34, lift: 0.17, bob: 10, armAmp: 40, lean: 15} as GaitW,
  heavy: {stride: 1.95, duty: 0.37, lift: 0.14, bob: 9, armAmp: 6, lean: 13} as GaitW,
  run: {stride: 2.0, duty: 0.35, lift: 0.16, bob: 10, armAmp: 40, lean: 14} as GaitW,
  crouch: {stride: 1.75, duty: 0.38, lift: 0.13, bob: 8, armAmp: 24, lean: 22} as GaitW,
  dash: {stride: 1.7, duty: 0.33, lift: 0.14, bob: 9, armAmp: 30, lean: 20} as GaitW,
  jog: {stride: 1.6, duty: 0.42, lift: 0.12, bob: 8, armAmp: 26, lean: 10} as GaitW,
};

export type Body = {pos: V3; heading: number; footL: V3; footR: V3; gait?: Pose; runK: number; seg: number; inRun: boolean; phase?: number};
const segStart = (s: Seg) => (s.kind === 'stand' ? s.root[0][0] : s.T0);
const bodyAt = (segs: Seg[], T: number): Body => {
  let i = 0;
  for (let k = 0; k < segs.length; k++) if (T >= segStart(segs[k])) i = k;
  const s = segs[i];
  if (s.kind === 'fn') {
    const b: Body = {...s.at(T), runK: 0, seg: i, inRun: false};
    const prev = segs[i - 1];
    if (prev) {
      const w = smooth(clamp((T - s.T0) / 0.12));
      if (w < 1) { const pb = bodyAt(segs.slice(0, i), s.T0); b.footL = mixFoot(pb.footL, b.footL, w); b.footR = mixFoot(pb.footR, b.footR, w); }
    }
    return b;
  }
  if (s.kind === 'run') {
    const L = pathLen(s.path);
    const A = s.A ?? 1.0, D = s.D ?? 0.6;
    const d = runDist(Math.min(T, s.T1 + (D > 0 ? 0 : 0.6)), s.T0, s.T1, L, A, D);
    const g = gaitW(s.path, Math.min(d, L + 0.6), s.gait, G);
    const v = runSpeed(T, s.T0, s.T1, L, A, D);
    const k = clamp(v / cruise(s.T0, s.T1, L, A, D));
    let fl = g.footL, fr = g.footR;
    const prev = segs[i - 1];
    if (prev && prev.kind !== 'run') {
      const pb = bodyAt(segs.slice(0, i), s.T0);
      const w = smooth(clamp((T - s.T0) / 0.32));
      fl = mixFoot(pb.footL, fl, w); fr = mixFoot(pb.footR, fr, w);
    }
    return {pos: g.pos, heading: g.heading, footL: fl, footR: fr, gait: g.pose, runK: k, seg: i, inRun: true, phase: g.phase};
  }
  const b = standAt(s, T);
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
  let feet = FEET.get(s);
  if (!feet) FEET.set(s, (feet = s.feet ?? autoSteps(s.root, {stepLen: 0.5, half: 0.15, stag: s.stag ?? 0.12})));
  return {pos: onG(r.p.x, r.p.z), heading: r.h, footL: footAt(feet.L, T, 0.1), footR: footAt(feet.R, T, 0.1), runK: 0, seg: 0, inRun: false};
};
const lookYaw = (b: {pos: V3; heading: number}, at: V3, lim = 70) => clamp(wrapD(headingTo(b.pos, at) - b.heading), -lim, lim);
const lookPitch = (b: {pos: V3}, at: V3, eye = 1.55) => clamp((Math.atan2(at.y - (b.pos.y + eye), Math.hypot(at.x - b.pos.x, at.z - b.pos.z)) * -180) / Math.PI, -30, 30);
/** world point → body-local Loc (rig units) */
export const toLoc = (b: {pos: V3; heading: number}, p: V3) => {
  const f = fwdOf(b.heading), r = rightOf(b.heading);
  const dx = p.x - b.pos.x, dz = p.z - b.pos.z;
  return {r: (dx * r.x + dz * r.z) * 251.4, u: (p.y - b.pos.y) * 251.4, f: (dx * f.x + dz * f.z) * 251.4};
};
export const fromLoc = (b: {pos: V3; heading: number}, l: {r: number; u: number; f: number}): V3 => {
  const f = fwdOf(b.heading), r = rightOf(b.heading);
  return {x: b.pos.x + (f.x * l.f + r.x * l.r) / 251.4, y: b.pos.y + l.u / 251.4, z: b.pos.z + (f.z * l.f + r.z * l.r) / 251.4};
};
const lerp3v = (a: V3, b: V3, k: number): V3 => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k)});
const lerpLoc = (a: {r: number; u: number; f: number}, b: {r: number; u: number; f: number}, k: number) => ({r: lerp(a.r, b.r, k), u: lerp(a.u, b.u, k), f: lerp(a.f, b.f, k)});
/** run pose: the gait's body plus role arms, faded into the stance pose by runK */
const withRun = (b: Body, stance: Pose, runArms: Pose): Pose => {
  if (!b.gait || b.runK <= 0.001) return stance;
  const run = layer(b.gait, runArms, {face: {mouth: 'grit', brows: -0.6}});
  return blendPose(stance, run, b.runK);
};
const withHead = (pose: Pose, b: {pos: V3; heading: number}, at: V3 | null, w = 1, lim = 75): Pose => {
  if (!at || w <= 0) return pose;
  const h = pose.head ?? {};
  return {...pose, head: {yaw: lerp(h.yaw ?? 0, lookYaw(b, at, lim), w), pitch: lerp(h.pitch ?? 0, lookPitch(b, at), w), roll: h.roll}};
};
/** kneeling footholds: the front foot forward, the down knee's foot back on its toes (KNEEL's shape, in world) */
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
const base = (role: Role2, key: string, seed: number, b: Body, T: number, pose: Partial<FigProps>, world: {handL?: V3; handR?: V3} = {}): FigSpec => ({
  key, look: lookR2(role), t: T, seed, pos: b.pos, heading: b.heading,
  pose: {...pose, dmg: dmgR2(role, T)},
  world: {footL: b.footL, footR: b.footR, ...world},
});
export type CrewOut = {spec: FigSpec; body: Body; pts?: Record<string, V3>};
const sp = (who: keyof typeof SPOTS) => SPOTS[who];
const at3 = (x: number, z: number, up: number): V3 => ({x, y: G(x, z) + up, z});
/** an expanding window that stays on: 0 before a, 1 after b */
const ramp = (T: number, a: number, b: number) => smooth(clamp((T - a) / Math.max(1e-6, b - a)));
const SMOKE_EYE = at3(57.0, -1.1, 3.2);
const figEye = (T: number) => at3(57.6 + 0.3 * Math.sin(T * 0.4), -0.5, 3.6);
const BLAST = EV2.blast;
/** the flinch everyone gives the blast in the smoke (head ducks, shoulders up) */
const flinch = (T: number, t0: number, k = 1): Pose => {
  const w = win(T, t0, t0 + 0.7, 0.05, 0.45) * k;
  return w > 0 ? {drop: 8 * w, head: {pitch: 12 * w, yaw: 0}, face: {squint: 0.8 * w, brows: -0.8}} : {};
};

// ================================================================== THE DIRECTOR (clerkC, plate on the left forearm)
const D0 = sp('director');
export const DIR_GUARD_AT = {x: 49.0, z: -8.5};
export const DIR_PILE = {x: 49.5, z: -8.95};
export const DIR_BASH_A = {x: 54.03, z: -8.1}; // standing at A's back-right as the plate lands (EV2.bash)
const DIR_HOLD = {x: 48.6, z: -10.35};
/** at D's right side as the plate lands (EV2.counter): he comes in from the wreck pile at the girder */
export const DIR_COUNTER = {x: 50.83, z: -6.21};
export const DIR_END = {x: 50.25, z: -7.7};
const DIR_SEGS: Seg[] = [
  {kind: 'stand', root: [[94.3, D0.x, D0.z, 270], [97.8, D0.x, D0.z, 270], [98.1, D0.x - 0.05, D0.z - 0.2, 315]]},
  {kind: 'run', path: [{x: D0.x - 0.05, z: D0.z - 0.2}, {x: 45.45, z: 1.3}, {x: 45.4, z: -3.4}, {x: 45.65, z: -6.8}, {x: 47.5, z: -8.9}, DIR_HOLD], T0: 98.42, T1: 101.1, gait: GAITS.crouch, A: 0.7, D: 0.7},
  {kind: 'stand', root: [[101.1, DIR_HOLD.x, DIR_HOLD.z, 135], [101.6, DIR_HOLD.x, DIR_HOLD.z, 108], [102.2, DIR_HOLD.x, DIR_HOLD.z, 102]]},
  {kind: 'run', path: [DIR_HOLD, {x: 52.0, z: -9.85}, DIR_BASH_A], T0: 102.22, T1: EV2.bash, gait: GAITS.dir, A: 0.5, D: 0.18},
  {kind: 'stand', root: [[EV2.bash, DIR_BASH_A.x, DIR_BASH_A.z, 131], [EV2.bash + 0.35, DIR_BASH_A.x - 0.12, DIR_BASH_A.z - 0.04, 131], [104.5, DIR_BASH_A.x - 0.12, DIR_BASH_A.z - 0.04, 255]]},
  // back along the girder's foot (north of the slope's pipe and B) to the crest, facing the two that come on
  {kind: 'run', path: [{x: DIR_BASH_A.x - 0.12, z: DIR_BASH_A.z - 0.04}, {x: 52.0, z: -9.65}, {x: 50.2, z: -9.2}, DIR_GUARD_AT], T0: 104.55, T1: 105.75, gait: GAITS.run, A: 0.4, D: 0.5},
  {kind: 'stand', root: [[105.75, DIR_GUARD_AT.x, DIR_GUARD_AT.z, 280], [106.25, DIR_GUARD_AT.x, DIR_GUARD_AT.z, 100], [108.35, DIR_GUARD_AT.x, DIR_GUARD_AT.z, 100],
    // after the crash: to the wreck pile, plate up, making sure; then he turns on D
    [108.95, DIR_PILE.x, DIR_PILE.z, 75], [112.9, DIR_PILE.x, DIR_PILE.z, 75], [113.2, DIR_PILE.x + 0.05, DIR_PILE.z + 0.1, 150]], stag: 0.16},
  {kind: 'run', path: [{x: DIR_PILE.x + 0.05, z: DIR_PILE.z + 0.1}, {x: 50.4, z: -7.65}, DIR_COUNTER], T0: 113.25, T1: EV2.counter, gait: GAITS.dir, A: 0.35, D: 0.15},
  {kind: 'stand', root: [[EV2.counter, DIR_COUNTER.x, DIR_COUNTER.z, 136], [EV2.counter + 0.4, DIR_COUNTER.x + 0.05, DIR_COUNTER.z - 0.1, 136],
    [115.2, DIR_COUNTER.x + 0.05, DIR_COUNTER.z - 0.1, 140], [115.9, DIR_END.x, DIR_END.z, 95], [116.92, DIR_END.x, DIR_END.z, 95]], stag: 0.16},
];
const GUARD = {r: 6, u: 345, f: 112};
const plateFromGuard = (b: {pos: V3; heading: number}, g: {r: number; u: number; f: number}): V3 => {
  const w = fromLoc(b, g);
  const f = fwdOf(b.heading);
  return {x: w.x + f.x * 0.05, y: w.y - 0.15, z: w.z + f.z * 0.05};
};
/** the plate arm on the run: guarded, carried by the torso (D1's guardRun) */
const guardRun = (b: Body): Pose => {
  const g = b.gait ?? {};
  const c = b.phase ?? 0, sw = Math.sin(2 * Math.PI * c);
  const lean = g.lean ?? 14, drop = g.drop ?? 0;
  const twist = -7 * sw;
  const r1 = -6 + 6 * sw, u1 = 129 + 6 * sw, f1 = 65 + 16 * sw;
  const tl = (lean * Math.PI) / 180, tw = (-twist * Math.PI) / 180;
  const u2 = u1 * Math.cos(tl) - f1 * Math.sin(tl), f2 = u1 * Math.sin(tl) + f1 * Math.cos(tl);
  const r3 = r1 * Math.cos(tw) + f2 * Math.sin(tw), f3 = -r1 * Math.sin(tw) + f2 * Math.cos(tw);
  return {twist, armL: {local: {r: r3, u: 165 - drop + u2, f: f3}, pole: {r: -1, u: -0.6, f: 0}, palm: {r: 0.3, u: 0, f: -1}}, armR: g.armR, handL: 'fist', handR: 'fist'};
};
const BASH_ARM = {r: -4, u: 286, f: 168};

export const directorAt = (T: number): CrewOut => {
  const b = bodyAt(DIR_SEGS, T);
  const plate: PlateState = toolsR2('director', T).plate ?? 'dented';
  let guard = {...GUARD};
  let pose: Pose = layer(BRACED({wide: 0.8}), {armL: {local: guard, pole: {r: -1, u: -0.7, f: 0.1}, palm: {r: -0.55, u: 0.1, f: -1}}, handL: 'fist', face: {mouth: 'grit', brows: -0.6}});
  // kneeling behind the slab (D1's BREATH pose), up on the light, the signal
  const kneel = 1 - ramp(T, 97.8, 98.08);
  if (kneel > 0) pose = blendPose(pose, layer(KNEEL('R'), {drop: 70, lean: -6, armL: {local: {r: -30, u: 200, f: 60}, palm: {r: 0.4, u: 0.2, f: -1}}, armR: {local: {r: 52, u: 120, f: 70}}, handL: 'fist', handR: 'relaxed', face: {mouth: 'pant', brows: 0.1, worry: 0.2}, breath: 0.8}), kneel);
  const sig = win(T, 97.92, 98.3, 0.08, 0.15);
  if (sig > 0) pose = blendPose(pose, layer(pose, {armR: {local: {r: 26, u: 300 + 40 * Math.sin(Math.PI * clamp((T - 97.92) / 0.3)), f: 180}, palm: {r: 0, u: -1, f: 0.2}}, handR: 'open'}), sig);
  // the hold: low behind the rim crest, plate up, watching A
  const hold = win(T, 100.6, 102.3, 0.3, 0.12);
  if (hold > 0) pose = blendPose(pose, layer(pose, {drop: 58, lean: 22, face: {mouth: 'flat', brows: -0.7, squint: 0.4}}), hold);
  // the bash into A's back-right (anticipation over the last strides), absorb, settle
  const bashIn = clamp((T - (EV2.bash - 0.42)) / 0.42);
  const bashOut = after(T, EV2.bash + 0.12, 0.6);
  let chg = 0;
  if (T > EV2.bash - 0.45 && T < EV2.bash + 1.0) { const k = easeIn(bashIn) * (1 - bashOut); pose = blendPose(pose, layer(BASH(1), {drop: 30}), k); chg = Math.max(chg, k); }
  // the counter on D (113.75 → 114.12): a short lunge, the plate into its left side
  const cIn = clamp((T - (EV2.counter - 0.36)) / 0.36), cOut = after(T, EV2.counter + 0.12, 0.55);
  if (T > EV2.counter - 0.4 && T < EV2.counter + 0.9) { const k = easeIn(cIn) * (1 - cOut); pose = blendPose(pose, layer(BASH(1), {drop: 34, lean: 26}), k); chg = Math.max(chg, k); }
  const imp = T >= EV2.bash && T < EV2.bash + 0.5 ? Math.exp(-(T - EV2.bash) * 9) : T >= EV2.counter && T < EV2.counter + 0.5 ? Math.exp(-(T - EV2.counter) * 9) : 0;
  if (imp > 0) pose = layer(pose, {drop: (pose.drop ?? 0) + 10 * imp, lean: (pose.lean ?? 0) - 8 * imp, face: {mouth: 'grit', brows: -1, squint: 0.7}});
  // the crash at the girder: he turns his face from it, the plate comes up
  const cr = win(T, EV2.crash - 0.05, EV2.crash + 0.9, 0.06, 0.5);
  guard = {r: GUARD.r + 6 * cr, u: GUARD.u + 20 * cr, f: GUARD.f - 10 * cr};
  // BRIGHT: the plate arm comes down, he breathes, a tired half-smile
  const bright = ramp(T, 115.3, 116.0);
  if (bright > 0) pose = blendPose(pose, layer(STAND, {drop: 14, lean: 6, armL: {local: {r: -40, u: 190, f: 70}, palm: {r: 0.4, u: 0.2, f: -1}}, armR: {local: {r: 54, u: 150, f: 30}}, handL: 'fist', handR: 'relaxed', face: {mouth: T > 115.9 ? 'smile' : 'pant', brows: 0.2, worry: 0.1}, breath: 0.85}), bright);
  // eyes
  const a = unitAttach(unitD2('A', T));
  const tgt = T < 95.6 ? at3(46.75, 5.3, 1.5) : T < 97.75 ? at3(47.3, 2.9, 4.4) : T < 98.25 ? at3(46.5, -6, 1.2) : T < 100.6 ? at3(46.5, -8.5, 1.0) : T < 104.7 ? a.backPlate
    : T < 106.3 ? at3(54.5, -8.6, 1.5) : T < 108.4 ? unitAttach(unitD2('A', Math.min(T, EV2.crash))).head : T < 110.4 ? at3(50.4, -9.9, 0.6) : T < 112.95 ? (T < 111.6 ? at3(49.4, -6.7, 1.1) : at3(50.4, -9.9, 0.6)) : T < EV2.counter + 0.5 ? unitAttach(unitD2('D', T)).chest
    : T < 115.6 ? at3(50.2, -5.4, 0.5) : at3(49.2, -6.9, 1.0);
  const ph = pose.head ?? {};
  pose = layer(pose, {head: {yaw: lerp(lookYaw(b, tgt, 75), ph.yaw ?? 0, chg * 0.7), pitch: lerp(lookPitch(b, tgt), ph.pitch ?? 0, chg * 0.7), roll: 0}});
  const guardOn = (1 - kneel) * (1 - chg) * (1 - sig) * (1 - bright);
  const arm = blendPose(pose, layer(pose, {armL: {local: guard, pole: {r: -1, u: -0.7, f: 0.1}, palm: {r: -0.55, u: 0.1, f: -1}}}), guardOn);
  const final = withRun(b, arm, guardRun(b));
  const glint = Math.max(win(T, EV2.bash, EV2.bash + 0.16, 0.01, 0.12), win(T, EV2.counter, EV2.counter + 0.16, 0.01, 0.12));
  const spec = base('director', 'd2dir', 11, b, T, {...final, handL: 'fist', handR: final.handR ?? 'fist', wearL: plateWear(plate, {glint})});
  const plateW = chg > 0.5 ? plateFromGuard(b, BASH_ARM) : plateFromGuard(b, guard);
  return {spec, body: b, pts: {plate: plateW}};
};
export const directorPlate = (T: number) => directorAt(T).pts!.plate;

// ================================================================== THE BREAKER (honest)
const K0 = sp('breaker');
const BRK_HOLD = {x: 48.3, z: -8.3};
export const BRK_KNEE = (() => {
  // at B's back-left, 0.95 m behind and 0.35 m to its left
  const f = fwdOf(B_FL.h), r = rightOf(B_FL.h);
  return {x: B_FL.x - f.x * 0.95 - r.x * 0.35, z: B_FL.z - f.z * 0.95 - r.z * 0.35};
})();
export const BRK_CATCH = {x: 48.75, z: -7.05};
const BRK_SEGS: Seg[] = [
  {kind: 'stand', root: [[94.3, K0.x, K0.z, 270], [98.05, K0.x, K0.z, 270], [98.42, K0.x - 0.2, K0.z - 0.25, 315]]},
  {kind: 'run', path: [{x: K0.x - 0.2, z: K0.z - 0.25}, {x: 45.45, z: 2.0}, {x: 45.35, z: -3.4}, {x: 45.6, z: -6.6}, BRK_HOLD], T0: 98.48, T1: 100.95, gait: GAITS.crouch, A: 0.7, D: 0.7},
  {kind: 'stand', root: [[100.95, BRK_HOLD.x, BRK_HOLD.z, 110], [101.4, BRK_HOLD.x, BRK_HOLD.z, 98], [101.72, BRK_HOLD.x, BRK_HOLD.z, 96]]},
  {kind: 'run', path: [BRK_HOLD, {x: 50.6, z: -8.32}, BRK_KNEE], T0: 101.75, T1: 102.66, gait: GAITS.dash, A: 0.3, D: 0.3},
  {kind: 'stand', root: [[102.66, BRK_KNEE.x, BRK_KNEE.z, 150], [105.1, BRK_KNEE.x, BRK_KNEE.z, 150], [105.32, BRK_KNEE.x - 0.08, BRK_KNEE.z - 0.04, 262]], stag: 0.14},
  {kind: 'run', path: [{x: BRK_KNEE.x - 0.08, z: BRK_KNEE.z - 0.04}, {x: 51.0, z: -8.2}, BRK_CATCH], T0: 105.34, T1: 106.3, gait: GAITS.run, A: 0.4, D: 0.5},
  {kind: 'stand', root: [[106.3, BRK_CATCH.x, BRK_CATCH.z, 240], [106.8, BRK_CATCH.x, BRK_CATCH.z, 128], [110.62, BRK_CATCH.x, BRK_CATCH.z, 128],
    [111.2, BRK_CATCH.x + 0.12, BRK_CATCH.z + 0.08, 132], [111.7, BRK_CATCH.x - 0.1, BRK_CATCH.z - 0.14, 132], [116.92, BRK_CATCH.x - 0.1, BRK_CATCH.z - 0.14, 130]], stag: 0.14},
];
/** the breaker's swing as world hand keys around a tip target (D1): wind-up overhead → strike → recoil */
const swingHands = (b: {pos: V3; heading: number}, tip: V3, k: number) => {
  const chest = fromLoc(b, {r: 0, u: 300, f: 20});
  const d = norm3(sub3(tip, chest));
  const TIP = 144 / 251.4, BACK = 0.44;
  const fS = sub3(tip, mul3(d, TIP)), bS = sub3(fS, mul3(d, BACK));
  const fR = fromLoc(b, {r: -16, u: 250, f: 118}), bR = fromLoc(b, {r: 32, u: 205, f: 34});
  const fW = fromLoc(b, {r: 14, u: 430, f: -6}), bW = fromLoc(b, {r: 30, u: 360, f: -70});
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
const swingK = (T: number, tw: number, tc: number, tEnd: number) => (T < tw ? 0 : T < tc ? 0.55 * ((T - tw) / (tc - tw)) : T < tEnd ? 0.55 + 0.45 * ((T - tc) / (tEnd - tc)) : 1);
/** the back of B's left knee at the strike (the tool tip lands there) */
export const kneeTarget = (): V3 => {
  const u = unitAttach(unitD2('B', EV2.knee - 0.005));
  const f = fwdOf(B_FL.h);
  return add3(u.kneeL, {x: -f.x * 0.2, y: 0.02, z: -f.z * 0.2});
};
export const breakerAt = (T: number): CrewOut => {
  const b = bodyAt(BRK_SEGS, T);
  const gauge = toolsR2('breaker', T).gauge ?? 1;
  const swing = T > 102.6 && T < 103.65;
  let hands: {front: V3; back: V3} | null = null;
  let k = 0;
  if (swing) { k = swingK(T, 102.68, EV2.knee, 103.62); hands = swingHands(b, kneeTarget(), k); }
  let pose: Pose = layer(BRACED({wide: 0.85}), {face: {mouth: 'grit', brows: -0.5}});
  const kneel0 = 1 - ramp(T, 97.95, 98.3);
  if (kneel0 > 0) pose = blendPose(pose, layer(KNEEL('L'), {drop: 76, lean: 4, face: {mouth: 'pant', brows: -0.2}, breath: 0.8}), kneel0);
  const hold = win(T, 100.8, 101.8, 0.3, 0.1);
  if (hold > 0) pose = blendPose(pose, layer(pose, {drop: 52, lean: 20, face: {mouth: 'flat', brows: -0.7}}), hold);
  if (hands) {
    const sw = k < 0.36 ? smooth(k / 0.36) : 1;
    pose = layer(pose, {
      drop: lerp(20, 12, sw) + (k > 0.45 && k < 0.8 ? 30 * Math.sin(Math.PI * clamp((k - 0.45) / 0.35)) : 0),
      lean: k < 0.36 ? lerp(8, -14, smooth(k / 0.36)) : k < 0.55 ? lerp(-14, 38, easeIn((k - 0.36) / 0.19)) : lerp(38, 10, smooth((k - 0.55) / 0.45)),
      twist: k < 0.36 ? 16 * smooth(k / 0.36) : lerp(16, -6, smooth((k - 0.36) / 0.3)),
      face: {mouth: 'grit', brows: -1, squint: 0.5},
    });
  }
  // the catch: braced (sees him coming), the runner's weight lands on his cradle at CATCH, knees give, a step back
  const cat = win(T, 110.55, 116.92, 0.3, 0.01);
  const absorb = smooth(clamp((T - EV2.catch) / 0.4)) * (1 - 0.6 * smooth(clamp((T - 112.2) / 0.6)));
  let catchHands = false;
  if (cat > 0) {
    pose = blendPose(pose, layer(CATCH_BODY, {drop: 30 + 22 * absorb, lean: 14 - 10 * absorb, head: {yaw: 0, pitch: 12}, face: {mouth: absorb > 0.3 ? 'grit' : 'open', brows: -0.4, worry: 0.4}}), cat);
    catchHands = T > 110.9;
  }
  // lowering him to his knees, kneeling behind him; BRIGHT: breathing
  const low = ramp(T, 112.1, 112.9);
  if (low > 0) pose = blendPose(pose, layer(KNEEL('L'), {drop: 80, lean: 12, face: {mouth: 'pant', brows: 0.1, worry: 0.3}, breath: 0.8, handL: 'brace', handR: 'brace'}), low);
  kneelFeet(b, 'L', Math.max(kneel0, low));
  const tgt = T < 95.5 ? at3(46.75, 5.3, 1.4) : T < 98.0 ? at3(47.1, 2.6, 2.9) : T < 101.0 ? at3(46.5, -7.5, 1.1) : T < 103.2 ? kneeTarget() : T < 105.1 ? at3(52.4, -7.3, 1.0)
    : T < 108.4 ? at3(51.0, -9.6, 1.6) : T < 110.3 ? at3(51.0, -5.5, 1.6) : at3(49.4, -6.6, 1.0);
  pose = withHead(pose, b, tgt, cat > 0 ? 0.6 : 1);
  const port = {front: fromLoc(b, {r: -16, u: 250, f: 118}), back: fromLoc(b, {r: 32, u: 205, f: 34})};
  // from the catch on the tool hangs on its sling at his back (both hands are on the runner)
  const toolOn = T < 110.75 || T > 115.95;
  const H = hands ?? port;
  const runArms: Pose = {armL: {local: {r: -16, u: 262, f: 112}}, armR: {local: {r: 30, u: 208, f: 36}}};
  const final = withRun(b, pose, runArms);
  const handsOn = !toolOn ? 0 : b.inRun ? 1 - b.runK : 1;
  const fire = swing ? win(T, EV2.knee, EV2.knee + 0.08, 0.005, 0.05) : 0;
  const spec = base('breaker', 'd2brk', 7, b, T, toolOn
    ? {...final, handL: 'grip', handR: 'grip', twoHanded: true, extra: breaker({back: 1, front: 0, gauge, fire, recoil: fire})}
    : {...final, handL: catchHands ? 'brace' : 'open', handR: catchHands ? 'brace' : 'open'},
  handsOn > 0.02 ? {handL: H.front, handR: H.back} : {});
  return {spec, body: b, pts: {front: H.front, back: H.back}};
};

// ================================================================== THE RUNNER (guesser, halligan)
const R0 = sp('runner');
const RUN_HOLD = {x: 49.6, z: -9.3};
export const RUN_PRY = (() => {
  const f = fwdOf(B_FL.h), r = rightOf(B_FL.h);
  return {x: B_FL.x - f.x * 0.85 + r.x * 0.4, z: B_FL.z - f.z * 0.85 + r.z * 0.4};
})();
export const RUN_GUARD = {x: 49.9, z: -6.2, h: 124};
/** where his flight from the backhand ends (his back on the breaker's cradle) */
export const RUN_CAUGHT = {x: 49.17, z: -6.73};
const RUN_SEGS: Seg[] = [
  {kind: 'stand', root: [[94.3, R0.x, R0.z, 270], [97.92, R0.x, R0.z, 270], [98.14, R0.x - 0.1, R0.z - 0.15, 320]]},
  {kind: 'run', path: [{x: R0.x - 0.1, z: R0.z - 0.15}, {x: 45.45, z: -0.6}, {x: 45.4, z: -3.6}, {x: 45.7, z: -6.8}, {x: 48.0, z: -8.5}, RUN_HOLD], T0: 98.16, T1: 100.7, gait: GAITS.crouch, A: 0.6, D: 0.7},
  {kind: 'stand', root: [[100.7, RUN_HOLD.x, RUN_HOLD.z, 120], [101.2, RUN_HOLD.x, RUN_HOLD.z, 112], [102.38, RUN_HOLD.x, RUN_HOLD.z, 108]]},
  {kind: 'run', path: [RUN_HOLD, {x: 50.9, z: -8.6}, RUN_PRY], T0: 102.55, T1: 103.5, gait: GAITS.dash, A: 0.4, D: 0.4},
  {kind: 'stand', root: [[103.5, RUN_PRY.x, RUN_PRY.z, 0], [103.7, RUN_PRY.x, RUN_PRY.z, headingTo(RUN_PRY, B_FL) - 6], [104.98, RUN_PRY.x, RUN_PRY.z, headingTo(RUN_PRY, B_FL) - 6], [105.16, RUN_PRY.x - 0.08, RUN_PRY.z + 0.05, 232]], stag: 0.12},
  {kind: 'run', path: [{x: RUN_PRY.x - 0.08, z: RUN_PRY.z + 0.05}, {x: 50.3, z: -6.75}, RUN_GUARD], T0: 105.18, T1: 105.98, gait: GAITS.run, A: 0.35, D: 0.4},
  {kind: 'stand', root: [[105.98, RUN_GUARD.x, RUN_GUARD.z, 230], [106.45, RUN_GUARD.x, RUN_GUARD.z, RUN_GUARD.h], [EV2.knock, RUN_GUARD.x, RUN_GUARD.z, RUN_GUARD.h]], stag: 0.14},
  {kind: 'fn', T0: EV2.knock, at: (T) => runnerFlight(T)},
];
(() => {
  // the runner-up's pry stand faces B's back
  const s = RUN_SEGS[4] as Extract<Seg, {kind: 'stand'}>;
  s.root[0][3] = headingTo(RUN_HOLD, RUN_PRY);
})();
/** knocked back: two stumbling steps back along D's blow, into the breaker's arms; then lowered to a kneel there */
const runnerFlight = (T: number) => {
  const u = clamp((T - EV2.knock) / (EV2.catch - EV2.knock));
  const k = easeOut(u);
  const x = lerp(RUN_GUARD.x, RUN_CAUGHT.x, k), z = lerp(RUN_GUARD.z, RUN_CAUGHT.z, k);
  const h = RUN_GUARD.h + 14 * k;
  const f = fwdOf(h), r = rightOf(h);
  const back = (dist: number, side: number): V3 => { const fx = RUN_GUARD.x - f.x * dist + r.x * side, fz = RUN_GUARD.z - f.z * dist + r.z * side; return {x: fx, y: G(fx, fz), z: fz}; };
  // the feet: right foot steps back (110.6–110.85), left foot back (110.9–111.2), the right slides as he lands on the cradle
  const step = (t0: number, t1: number, a: V3, b2: V3, lift: number) => {
    const s = clamp((T - t0) / (t1 - t0));
    const p = lerp3v(a, b2, smooth(s));
    return {...p, y: G(p.x, p.z) + Math.sin(Math.PI * s) * lift};
  };
  const fR0 = back(-0.05, 0.15), fL0 = back(-0.18, -0.15);
  const fR1 = back(0.55, 0.2), fL1 = back(0.78, -0.12), fR2 = back(0.95, 0.22);
  const footR = T < 110.6 ? fR0 : T < 111.2 ? step(110.6, 110.85, fR0, fR1, 0.14) : step(111.2, 111.5, fR1, fR2, 0);
  const footL = step(110.9, 111.2, fL0, fL1, 0.12);
  return {pos: onG(x, z), heading: h, footL, footR};
};
/** the pry: fork tip on B's back-plate edge; the bar levers about the tip; the plate pops (D1's pryHands) */
const pryHands = (b: {pos: V3; heading: number}, T: number) => {
  const u = unitAttach(unitD2('B', Math.min(T, EV2.pryPop)));
  const edge = add3(u.backPlate, {x: 0, y: 0.16, z: 0});
  const sh = fromLoc(b, {r: 10, u: 300, f: 10});
  const dir0 = norm3(sub3(edge, sh));
  const lever = clamp((T - EV2.pryIn) / (EV2.pryPop - EV2.pryIn));
  const d = norm3(add3(dir0, mul3({x: 0, y: -1, z: 0}, -0.9 * easeIn(lever))));
  const back = sub3(edge, mul3(d, 0.7));
  const front = add3(back, mul3(d, 0.34));
  return {back, front, edge};
};
export const runnerAt = (T: number): CrewOut => {
  const b = bodyAt(RUN_SEGS, T);
  let pose: Pose = layer(BRACED({wide: 0.7}), {face: {mouth: 'grit', brows: -0.4}});
  const kneel0 = 1 - ramp(T, 97.92, 98.18);
  if (kneel0 > 0) pose = blendPose(pose, layer(KNEEL('R'), {drop: 84, lean: 14, face: {mouth: 'pant', brows: 0}}), kneel0);
  const hold = win(T, 100.6, 102.45, 0.3, 0.1);
  if (hold > 0) pose = blendPose(pose, layer(pose, {drop: 60, lean: 24, face: {mouth: 'flat', brows: -0.6}}), hold);
  const pry = win(T, 103.6, 104.62, 0.35, 0.12);
  const rip = win(T, 104.42, 105.3, 0.12, 0.35);
  let world: {handL?: V3; handR?: V3} = {};
  const pts: Record<string, V3> = {};
  if (pry > 0) {
    const h = pryHands(b, T);
    pose = blendPose(pose, layer(PRY(clamp((T - EV2.pryIn) / 0.4)), {}), pry);
    world = {handR: lerp3v(fromLoc(b, {r: 40, u: 190, f: 40}), h.back, pry), handL: lerp3v(fromLoc(b, {r: -30, u: 200, f: 60}), h.front, pry)};
    pts.edge = h.edge;
  }
  if (rip > 0) {
    const u = unitAttach(unitD2('B', T));
    const inside = add3(u.backPlate, {x: 0, y: 0.04, z: 0});
    const pull = clamp((T - EV2.rip) / 0.35);
    const ripTo = fromLoc(b, {r: -60, u: 330, f: -40});
    const handL = lerp3v(lerp3v(fromLoc(b, {r: -30, u: 200, f: 60}), inside, smooth(clamp((T - 104.42) / 0.3))), ripTo, easeOut(pull));
    world = {...world, handL: lerp3v(world.handL ?? handL, handL, rip)};
    pose = blendPose(pose, layer(pose, {lean: lerp(30, -10, easeOut(pull)), drop: lerp(50, 20, pull), face: {mouth: 'grit', brows: -1}}), rip);
    pts.cablesFrom = inside; pts.cablesHand = handL;
  }
  // on guard on the crest: the bar raised in both hands as D comes up the slope
  const guard = win(T, 109.9, EV2.knock + 0.05, 0.3, 0.02);
  if (guard > 0) pose = blendPose(pose, layer(pose, {armR: {local: {r: 36, u: 300, f: 110}}, armL: {local: {r: -10, u: 280, f: 130}}, drop: 30, lean: 8, face: {mouth: 'grit', brows: -0.8}}), guard);
  // KNOCKBACK: the blow, the stagger back, the fall onto the breaker's cradle (supportCatch stops the pitch), then
  // he's lowered to his knees and stays there, breathing, hand on his ribs
  const fallK = clamp((T - EV2.knock) / (EV2.catch + 0.25 - EV2.knock));
  if (T > EV2.knock) {
    const kb = keyPose([[0, layer(STAND, {drop: 20})], [0.18, layer(KNOCKED_BACK(0.15), {drop: 14})], [0.7, layer(KNOCKED_BACK(0.4), {drop: 34})], [1, layer(KNOCKED_BACK(0.42), {drop: 70, bodyPitch: -46})]], fallK);
    const w = 1 - ramp(T, 112.0, 112.9);
    pose = blendPose(pose, {...kb, handR: 'grip'}, w);
    pose = blendPose(pose, layer(KNEEL('R'), {drop: 84, lean: 18, armL: {local: {r: -20, u: 170, f: 70}}, armR: {local: {r: 40, u: 150, f: 60}}, handL: 'brace', head: {pitch: 14}, face: {mouth: 'pant', brows: 0.4, worry: 0.6, squint: 0.3}, breath: 1}), 1 - w);
  }
  kneelFeet(b, 'R', Math.max(kneel0, ramp(T, 112.0, 112.9)));
  // the drone takes the blow over his head: he ducks; BRIGHT: he looks up at them
  const duck = win(T, EV2.shield - 0.25, EV2.shield + 0.7, 0.1, 0.4);
  if (duck > 0) pose = layer(pose, {drop: (pose.drop ?? 0) + 14 * duck, head: {pitch: 22 * duck, yaw: 0}, armL: {local: {r: -10, u: 290, f: 90}}, face: {mouth: 'grit', squint: 0.9, brows: -0.8}});
  const tgt = T < 95.5 ? at3(46.75, 5.3, 1.4) : T < 98.0 ? at3(47.4, 1.2, 2.6) : T < 102.4 ? at3(52.6, -7.0, 1.6) : T < 105.2 ? unitAttach(unitD2('B', T)).backPlate
    : T < 108.6 ? at3(50.5, -9.6, 1.4) : T < EV2.knock + 0.1 ? at3(D_UP.x, D_UP.z, 1.7) : T < 113.6 ? at3(50.4, -5.8, 1.6) : T < 115.4 ? at3(49.6, -5.4, 1.4) : at3(48.4, -7.6, 1.3);
  if (duck <= 0.5 && T < 110.5 || T > 113.7) pose = withHead(pose, b, tgt);
  const twoH = pry > 0.02 || guard > 0.3;
  const runArms: Pose = {armR: {local: {r: 40, u: 220, f: 60}}, armL: b.gait?.armL};
  const final = withRun(b, pose, runArms);
  const spec = base('runner', 'd2run', 4, b, T, {
    ...final, handR: 'grip', handL: twoH ? 'grip' : rip > 0.3 ? (T < EV2.rip ? 'open' : 'fist') : final.handL ?? 'fist', twoHanded: twoH,
    ...(twoH ? {extra: halligan2({back: 1, front: 0})} : {holdR: halligan1({ang: T > EV2.knock ? 40 : 72})}),
  }, world);
  return {spec, body: b, pts};
};

// ================================================================== THE TETHER (clerkA)
const A0 = sp('tether');
export const TTH_POST = {x: 45.9, z: -10.95};
const TTH_BRACE = {x: 45.72, z: -10.95};
const TTH_SEGS: Seg[] = [
  {kind: 'stand', root: [[94.3, A0.x, A0.z, 270], [97.95, A0.x, A0.z, 270], [98.2, A0.x - 0.1, A0.z - 0.25, 318]]},
  {kind: 'run', path: [{x: A0.x - 0.1, z: A0.z - 0.25}, {x: 45.45, z: 0.4}, {x: 45.4, z: -3.8}, {x: 45.35, z: -8.6}, TTH_POST], T0: 98.27, T1: 100.75, gait: GAITS.crouch, A: 0.6, D: 0.7},
  {kind: 'stand', root: [[100.75, TTH_POST.x, TTH_POST.z, 160], [101.4, TTH_POST.x, TTH_POST.z, 100], [105.4, TTH_POST.x, TTH_POST.z, 100], [105.8, TTH_POST.x, TTH_POST.z, 108],
    // the wrap: a step to the post, the launcher swept round behind it, a step back west, braced
    [EV2.wrap0, 46.45, -11.0, 92], [EV2.wrap, 46.15, -11.15, 70], [EV2.taut, TTH_BRACE.x, TTH_BRACE.z, 100],
    [109.4, TTH_BRACE.x, TTH_BRACE.z, 100], [110.4, 46.4, -10.3, 125], [111.8, 47.3, -9.5, 120], [116.92, 47.3, -9.5, 118]], stag: 0.16},
];
export const tetherAt = (T: number): CrewOut => {
  const b = bodyAt(TTH_SEGS, T);
  let pose: Pose = layer(BRACED({wide: 0.75}), {armR: {local: {r: 30, u: 240, f: 90}}, armL: {local: {r: -30, u: 220, f: 60}}, handL: 'open', face: {mouth: 'flat', brows: -0.5}});
  const kneel0 = 1 - ramp(T, 97.95, 98.24);
  if (kneel0 > 0) pose = blendPose(pose, layer(KNEEL('L'), {drop: 80, lean: 10, armR: {local: {r: 40, u: 160, f: 90}}, face: {mouth: 'pant'}}), kneel0);
  const crouch = win(T, 100.8, 105.5, 0.3, 0.3);
  if (crouch > 0) pose = blendPose(pose, layer(pose, {drop: 64, lean: 16, face: {mouth: 'flat', brows: -0.6}}), crouch);
  kneelFeet(b, 'L', kneel0);
  let recoil = 0;
  let muzzle = add3(fromLoc(b, {r: 30, u: 240, f: 90}), mul3({x: fwdOf(b.heading).x, y: 0, z: fwdOf(b.heading).z}, 0.36));
  let handR: V3 | undefined;
  // aim at A (it walks: the clamp goes where it will be at the bite), fire, the bite
  const aimW = win(T, 105.45, EV2.wrap0 + 0.05, 0.3, 0.15);
  const target = clampTarget(Math.min(T, EV2.tBite));
  if (aimW > 0) {
    const shoulder = fromLoc(b, {r: 36, u: 300, f: 0});
    const d = norm3(sub3(target, shoulder));
    const fr = T > EV2.tFire ? clamp((T - EV2.tFire) / 0.35) : 0;
    recoil = T > EV2.tFire && T < EV2.tFire + 0.35 ? Math.sin(Math.PI * fr) : 0;
    const hR = add3(add3(shoulder, mul3(d, 0.5)), mul3(d, -0.08 * recoil));
    muzzle = lerp3v(muzzle, add3(hR, add3(mul3(d, 0.38), {x: 0, y: 0.07, z: 0})), aimW);
    const p = layer(AIM, {
      armR: {local: toLoc(b, hR), pole: {r: 0.6, u: -1, f: 0}, palm: {r: -1, u: 0, f: 0}},
      armL: {local: toLoc(b, add3(add3(hR, mul3(d, -0.18)), {x: 0, y: -0.05, z: 0})), palm: {r: 1, u: 0.3, f: 0}},
      lean: 6, drop: 18, twist: 14, face: {squint: 0.6, mouth: 'flat', brows: -0.7},
    });
    pose = blendPose(pose, p, aimW);
  }
  // the wrap: the launcher hand goes up and round behind the post (north of it) and back out on its west side
  const wrapW = win(T, EV2.wrap0 - 0.05, EV2.taut + 0.1, 0.08, 0.1);
  if (wrapW > 0) {
    const u = clamp((T - EV2.wrap0) / (EV2.wrap - EV2.wrap0));
    const P = (dx: number, dy: number, dz: number) => add3(ANCHOR, {x: dx, y: dy, z: dz});
    const K: V3[] = [P(0.35, -0.05, 0.25), P(0.3, 0.02, -0.32), P(-0.3, 0.04, -0.3), P(-0.45, -0.1, 0.15)];
    const s = u * 3, i = Math.min(2, Math.floor(s));
    handR = lerp3v(K[i], K[i + 1], smooth(s - i));
    pose = blendPose(pose, layer(pose, {drop: 10, lean: 4, armL: {local: {r: -40, u: 230, f: 50}}, head: {pitch: -18}, face: {mouth: 'grit', brows: -0.7}}), wrapW);
    muzzle = lerp3v(muzzle, add3(handR, {x: 0, y: 0.06, z: 0}), wrapW);
  }
  // the reel hauls: braced, leaning back, the launcher held in against the pull; at the crash she turns her face away
  const haul = win(T, EV2.taut, EV2.release, 0.1, 0.35);
  if (haul > 0) {
    const d = norm3(sub3(ANCHOR, fromLoc(b, {r: 36, u: 280, f: 0})));
    const hR = add3(fromLoc(b, {r: 36, u: 280, f: 30}), mul3(d, 0.22));
    pose = blendPose(pose, layer(pose, {
      armR: {local: toLoc(b, hR), pole: {r: 0.6, u: -1, f: 0}, palm: {r: -1, u: 0, f: 0}}, armL: {local: toLoc(b, add3(hR, {x: 0, y: -0.06, z: 0})), palm: {r: 1, u: 0.3, f: 0}},
      lean: -16, drop: 34, twist: 10, face: {mouth: 'grit', brows: -0.9, squint: 0.6},
    }), haul);
    muzzle = lerp3v(muzzle, add3(hR, mul3(d, 0.36)), haul);
  }
  const duck = win(T, EV2.crash - 0.08, EV2.crash + 0.7, 0.05, 0.35);
  if (duck > 0) pose = layer(pose, {drop: (pose.drop ?? 0) + 12 * duck, head: {yaw: -45 * duck, pitch: 15 * duck}, face: {squint: 0.95, mouth: 'grit'}});
  const look = aimW > 0.5 || haul > 0.5 ? target : T < 95.5 ? at3(46.75, 5.3, 1.4) : T < 98.0 ? at3(47.3, 1.5, 2.6) : T < 105.4 ? at3(53.6, -8.0, 1.5) : T < EV2.wrap ? ANCHOR : at3(49.5, -6.5, 1.0);
  if (duck < 0.3) pose = withHead(pose, b, haul > 0.5 ? unitAttach(unitD2('A', Math.min(T, EV2.crash))).head : look, 0.9);
  const runArms: Pose = {armR: {local: {r: 26, u: 236, f: 64}}, armL: b.gait?.armL};
  const final = withRun(b, pose, runArms);
  const spool = T > EV2.tFire && T < EV2.reelEnd ? 0.5 + 0.5 * smooth(clamp((T - EV2.release) / (EV2.reelEnd - EV2.release))) : 1;
  const loaded = !(T > EV2.tFire && T < EV2.reelEnd);
  const spec = base('tether', 'd2tth', 3, b, T, {...final, handR: 'grip', handL: final.handL ?? 'open', holdR: tetherLauncher({loaded, recoil}), extra: hipReel(spool)}, handR && wrapW > 0 ? {handR: lerp3v(fromLoc(b, {r: 30, u: 240, f: 90}), handR, wrapW)} : {});
  return {spec, body: b, pts: {muzzle}};
};
/** the clamp on A: its chest plate as it walks at the crew (the shot leads it to where A will be at the bite) */
export const clampTarget = (T: number): V3 => unitAttach(unitD2('A', T)).chest;

// ================================================================== THE DRONE PILOT (checker)
const P0 = sp('drone');
export const PILOT_AT = {x: 46.0, z: -5.0};
const DRN_SEGS: Seg[] = [
  {kind: 'stand', root: [[94.3, P0.x, P0.z, 250], [103.75, P0.x, P0.z, 250], [104.05, P0.x + 0.05, P0.z - 0.15, 330]]},
  {kind: 'run', path: [{x: P0.x + 0.05, z: P0.z - 0.15}, {x: 45.8, z: 5.6}, {x: 45.3, z: 3.0}, {x: 45.3, z: -1.5}, {x: 45.6, z: -3.8}, PILOT_AT], T0: 104.08, T1: 106.75, gait: GAITS.jog, A: 0.6, D: 0.7},
  {kind: 'stand', root: [[106.75, PILOT_AT.x, PILOT_AT.z, 140], [107.2, PILOT_AT.x, PILOT_AT.z, 100], [116.92, PILOT_AT.x, PILOT_AT.z, 100]], stag: 0.08},
];
export const droneAt = (T: number, allyPos: V3): CrewOut => {
  const b = bodyAt(DRN_SEGS, T);
  const tense = Math.max(win(T, 112.6, 113.7, 0.25, 0.4), win(T, 99.6, 100.9, 0.2, 0.4) * 0.6);
  let pose: Pose = layer(BRACED({fists: false}), {
    drop: 12 + 16 * tense, lean: 8 + 12 * tense,
    armL: {local: {r: -22, u: 245 + 20 * tense, f: 92 + 30 * tense}}, armR: {local: {r: 22, u: 245 + 20 * tense, f: 92 + 30 * tense}},
    face: {mouth: tense > 0.4 ? 'grit' : 'flat', brows: -0.4 - 0.4 * tense, squint: 0.3},
  });
  const kneel0 = 1 - ramp(T, 103.75, 104.05);
  if (kneel0 > 0) pose = blendPose(pose, layer(KNEEL('L'), {drop: 82, armL: {local: {r: -20, u: 170, f: 90}}, armR: {local: {r: 20, u: 170, f: 90}}, face: {mouth: 'breath', worry: 0.4}}), kneel0);
  kneelFeet(b, 'L', kneel0);
  // the hit on the drone: she flinches with it; BRIGHT: relief
  const hit = win(T, EV2.shield, EV2.shield + 0.6, 0.03, 0.4);
  if (hit > 0) pose = layer(pose, {drop: (pose.drop ?? 0) + 8 * hit, face: {mouth: 'open', brows: 0.6, worry: 0.8}});
  const rel = ramp(T, 115.4, 116.1);
  if (rel > 0) pose = layer(pose, {face: {mouth: 'soft', brows: 0.3, worry: 0.2}, breath: 0.7});
  pose = withHead(pose, b, allyPos, 1, 80);
  const runArms: Pose = {armL: {local: {r: -20, u: 236, f: 84}}, armR: {local: {r: 20, u: 236, f: 84}}};
  const final = withRun(b, pose, runArms);
  const spec = base('drone', 'd2drn', 5, b, T, {...final, handL: 'grip', handR: 'grip', twoHanded: true, extra: controller({lit: 1})});
  return {spec, body: b};
};

// ================================================================== THE FLARE CARRIER (host)
const F0 = sp('flares');
const FLR_SPOT = {x: F0.x + 0.1, z: F0.z - 0.05};
export const FLR_END = {x: 47.9, z: -3.1};
const FLR_SEGS: Seg[] = [
  {kind: 'stand', root: [[94.3, F0.x, F0.z, 270], [94.42, F0.x, F0.z, 270], [94.74, FLR_SPOT.x, FLR_SPOT.z, 72], [95.32, FLR_SPOT.x, FLR_SPOT.z, 72], [95.9, FLR_SPOT.x, FLR_SPOT.z + 0.05, 60], [113.0, FLR_SPOT.x, FLR_SPOT.z + 0.05, 60], [113.22, FLR_SPOT.x - 0.1, FLR_SPOT.z - 0.1, 345]], stag: 0.12},
  {kind: 'run', path: [{x: FLR_SPOT.x - 0.1, z: FLR_SPOT.z - 0.1}, {x: 46.3, z: 3.2}, {x: 46.15, z: -0.5}, {x: 46.9, z: -2.4}, FLR_END], T0: 113.25, T1: 115.85, gait: GAITS.jog, A: 0.6, D: 0.7},
  {kind: 'stand', root: [[115.85, FLR_END.x, FLR_END.z, 120], [116.35, FLR_END.x, FLR_END.z, 95], [116.92, FLR_END.x, FLR_END.z, 95]]},
];
/** one canister throw: k (THROW's keys: 0.4 wind, 0.62 release, 0.8 follow) mapped around a release time */
const throwK = (T: number, rel: number) => {
  const K: [number, number][] = [[rel - 0.36, 0], [rel - 0.12, 0.4], [rel, 0.62], [rel + 0.12, 0.8], [rel + 0.36, 1]];
  if (T <= K[0][0]) return 0;
  for (let i = 1; i < K.length; i++) if (T <= K[i][0]) return lerp(K[i - 1][1], K[i][1], (T - K[i - 1][0]) / (K[i][0] - K[i - 1][0]));
  return 1;
};
export const flaresAt = (T: number): CrewOut => {
  const b = bodyAt(FLR_SEGS, T);
  let pose: Pose = layer(BRACED({wide: 0.75, fists: false}), {face: {mouth: 'flat', brows: -0.5}});
  // up off the knee for the throws, back down after; up again to run at 113
  const kneel = (1 - ramp(T, 94.42, 94.7)) + ramp(T, 95.45, 95.95) - ramp(T, 112.95, 113.2);
  if (kneel > 0) pose = blendPose(pose, layer(KNEEL('R'), {drop: 80, face: {mouth: 'pant'}}), clamp(kneel));
  kneelFeet(b, 'R', clamp(kneel));
  // draw from the bag at his left hip (cross draw), the pin pulled by the left hand, the throw (×2)
  const draws = [[EV2.draw1, EV2.pin1, EV2.rel1], [EV2.draw2, EV2.pin2, EV2.rel2]];
  for (const [d, p, r] of draws) {
    const dw = win(T, d - 0.04, d + 0.16, 0.06, 0.1);
    if (dw > 0) pose = blendPose(pose, layer(pose, {armR: {local: {r: -18, u: 150, f: 34}}, head: {pitch: 14}}), dw);
    const pw = win(T, p - 0.12, p + 0.1, 0.06, 0.08);
    if (pw > 0) {
      const yank = clamp((T - p) / 0.08);
      pose = blendPose(pose, layer(pose, {armR: {local: {r: 24, u: 250, f: 96}}, armL: {local: {r: lerp(14, -40, yank), u: lerp(262, 270, yank), f: lerp(98, 60, yank)}}, handL: 'grip'}), pw);
    }
    const tw = win(T, r - 0.34, r + 0.36, 0.06, 0.16);
    if (tw > 0) pose = blendPose(pose, THROW(throwK(T, r)), tw);
  }
  const look = T < 95.6 ? at3(55.5, -2, 1.0) : T < 97.6 ? at3(55.6, -1.5, 0.5) : T < 113 ? figEye(T) : T < 115.5 ? at3(47.4, -4.5, 1.4) : at3(48.8, -6.6, 1.2);
  pose = withHead(layer(pose, flinch(T, BLAST, 0.7)), b, look, 1);
  const runArms: Pose = {armL: b.gait?.armL, armR: b.gait?.armR};
  const final = withRun(b, pose, runArms);
  const holding = (T > EV2.draw1 + 0.08 && T < EV2.rel1) || (T > EV2.draw2 + 0.08 && T < EV2.rel2);
  const spec = base('flares', 'd2flr', 9, b, T, {...final, handR: holding ? 'grip' : final.handR ?? 'open', holdR: holding ? canister() : undefined});
  return {spec, body: b, pts: {hand: fromLoc(b, {r: 14, u: 330, f: 150})}};
};
/** the canister leaves his hand here (the THROW release) */
export const canisterFrom = (i: 0 | 1): V3 => flaresAt(i === 0 ? EV2.rel1 : EV2.rel2).pts!.hand;

// ================================================================== THE DECOY MAKER (clerkB)
const B0 = sp('decoy');
const DEC_UP = {x: 46.94, z: 4.36};
const DEC_KNEEL = {x: 46.8, z: 4.45};
export const DEC_END = {x: 46.9, z: -3.8};
/** the tablet set on the slab's top edge (its bottom edge rests there; the clip-on projector on its top edge) */
export const TABLET_AT: V3 = {x: 47.27, y: 2.94, z: 4.18};
export const LENS_AT: V3 = {x: 47.33, y: 3.04, z: 4.16};
const DEC_SEGS: Seg[] = [
  {kind: 'stand', root: [[94.3, B0.x, B0.z, 270], [97.42, B0.x, B0.z, 270], [97.64, DEC_UP.x, DEC_UP.z, 88], [97.95, DEC_UP.x, DEC_UP.z, 88], [98.35, DEC_KNEEL.x, DEC_KNEEL.z, 75],
    [112.32, DEC_KNEEL.x, DEC_KNEEL.z, 75], [112.55, DEC_UP.x, DEC_UP.z, 88], [112.8, DEC_UP.x, DEC_UP.z, 88], [112.98, DEC_UP.x - 0.1, DEC_UP.z - 0.1, 330]], stag: 0.06},
  {kind: 'run', path: [{x: DEC_UP.x - 0.1, z: DEC_UP.z - 0.1}, {x: 45.6, z: 2.4}, {x: 45.25, z: -1.0}, DEC_END], T0: 113.0, T1: 115.5, gait: GAITS.jog, A: 0.6, D: 0.7},
  {kind: 'stand', root: [[115.5, DEC_END.x, DEC_END.z, 140], [116.1, DEC_END.x, DEC_END.z, 80], [116.92, DEC_END.x, DEC_END.z, 80]]},
];
/** the tablet is in her hands before EV2.place and after it is taken down (112.55) */
export const tabletInHand = (T: number) => T < EV2.place || T > 112.55;
export const decoyAt = (T: number): CrewOut => {
  const b = bodyAt(DEC_SEGS, T);
  let pose: Pose = layer(BRACED({wide: 0.6, fists: false}), {drop: 10, lean: 6, armL: {local: {r: -28, u: 215, f: 92}, pole: {r: -1, u: -0.7, f: 0}, palm: {r: 0.4, u: 0.3, f: -1}}, handR: 'open', face: {mouth: 'flat', brows: -0.3, worry: 0.4}});
  const kneel = (1 - ramp(T, 97.42, 97.62)) + ramp(T, 97.98, 98.35) - ramp(T, 112.3, 112.52);
  if (kneel > 0) pose = blendPose(pose, layer(KNEEL('L'), {drop: 82, lean: 4, armL: {local: {r: -26, u: 180, f: 90}, palm: {r: 0.4, u: 0.3, f: -1}}, face: {mouth: 'breath', worry: 0.5}}), clamp(kneel));
  kneelFeet(b, 'L', clamp(kneel));
  // the sketch (the insert): tablet at her chest, the right index finger drawing, eyes down on it
  const sk = win(T, 95.3, 97.5, 0.18, 0.12);
  if (sk > 0) pose = blendPose(pose, layer(KNEEL('L'), {drop: 82, lean: 10, armL: {local: {r: -30, u: 200, f: 96}, pole: {r: -1, u: -0.7, f: 0}, palm: {r: 0.4, u: 0.3, f: -1}}, armR: {local: {r: 4 + 8 * Math.sin(T * 6), u: 214 + 6 * Math.sin(T * 8.3), f: 106}, palm: {r: -0.3, u: -0.4, f: -1}}, handL: 'grip', handR: 'point', head: {pitch: 26, yaw: -4}, face: {mouth: 'flat', brows: -0.4, lookY: 0.8}}), sk);
  // up on her toes, the tablet set on the slab's top edge, the projector switched on; then down again watching
  let world: {handL?: V3; handR?: V3} = {};
  const up = win(T, 97.48, 98.0, 0.12, 0.12);
  if (up > 0) {
    const place = clamp((T - 97.5) / (EV2.place - 97.5));
    const hL = lerp3v(fromLoc(b, {r: -28, u: 230, f: 96}), add3(TABLET_AT, {x: -0.06, y: -0.07, z: 0.1}), easeOut(place));
    const tap = win(T, 97.7, 97.95, 0.08, 0.08);
    const hR = lerp3v(lerp3v(fromLoc(b, {r: 30, u: 220, f: 80}), add3(TABLET_AT, {x: -0.06, y: -0.06, z: -0.1}), easeOut(place)), add3(LENS_AT, {x: -0.04, y: 0.0, z: 0.02}), tap);
    world = {handL: lerp3v(fromLoc(b, {r: -28, u: 215, f: 92}), hL, up), handR: lerp3v(fromLoc(b, {r: 30, u: 220, f: 80}), hR, up)};
    pose = blendPose(pose, layer(STAND, {drop: -6, lean: 4, head: {pitch: -26}, face: {mouth: 'flat', brows: -0.5}, handR: 'point', handL: 'open'}), up);
  }
  // taking it down at 112.4–112.8
  const down = win(T, 112.35, 112.95, 0.1, 0.18);
  if (down > 0) {
    const take = clamp((T - 112.4) / 0.2);
    const hL = lerp3v(fromLoc(b, {r: -28, u: 230, f: 96}), add3(TABLET_AT, {x: -0.06, y: -0.07, z: 0.1}), 1 - smooth(clamp((T - 112.6) / 0.3)) * 0 + 0);
    const into = lerp3v(fromLoc(b, {r: -28, u: 215, f: 92}), add3(TABLET_AT, {x: -0.06, y: -0.07, z: 0.1}), easeOut(take) * (1 - smooth(clamp((T - 112.58) / 0.3))));
    void hL;
    world = {handL: lerp3v(fromLoc(b, {r: -28, u: 215, f: 92}), into, down)};
    pose = blendPose(pose, layer(STAND, {drop: -4, lean: 4, head: {pitch: -20}, face: {mouth: 'flat'}}), down);
  }
  const look = T < 95.3 ? at3(46.75, 5.3, 1.6) : T < 97.5 ? null : T < 98.0 ? TABLET_AT : T < 112.3 ? figEye(T) : T < 113 ? TABLET_AT : T < 115.6 ? at3(47.3, -5, 1.2) : at3(48.8, -6.8, 1.0);
  pose = withHead(layer(pose, flinch(T, BLAST, 0.6)), b, look, 1);
  const runArms: Pose = {armL: {local: {r: -26, u: 232, f: 70}}, armR: b.gait?.armR};
  const final = withRun(b, pose, runArms);
  const sketch = clamp((T - EV2.sketch) / EV2.sketchDur);
  const inHand = tabletInHand(T);
  const spec = base('decoy', 'd2dec', 6, b, T, {...final, handL: inHand ? 'grip' : final.handL ?? 'open', holdL: inHand ? tablet({screen: true, sketch: T > EV2.tap ? 1 : sketch, figures: 4, glow: T > EV2.tap && T < EV2.place ? 0.6 : 0.2}) : undefined}, world);
  return {spec, body: b};
};

export const CREW_ROLES = ['director', 'breaker', 'tether', 'runner', 'drone', 'flares', 'decoy'] as const;

// ------------------------------------------------------------------ footfalls (dust where each running foot lands)
const ALL_SEGS: Record<string, Seg[]> = {director: DIR_SEGS, breaker: BRK_SEGS, tether: TTH_SEGS, runner: RUN_SEGS, drone: DRN_SEGS, flares: FLR_SEGS, decoy: DEC_SEGS};
export type Footfall = {t: number; pos: V3; key: string; speed: number};
export const crewFootfalls = (T: number, win2 = 1.2): Footfall[] => {
  const out: Footfall[] = [];
  for (const [who, segs] of Object.entries(ALL_SEGS)) segs.forEach((s, si) => {
    if (s.kind !== 'run') return;
    const A = s.A ?? 1.0, D = s.D ?? 0.6, L = pathLen(s.path);
    const a = Math.max(s.T0, T - win2), b = Math.min(T, s.T1);
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
void [SHIELD_AT, A_FL];
export type {Rig2};
