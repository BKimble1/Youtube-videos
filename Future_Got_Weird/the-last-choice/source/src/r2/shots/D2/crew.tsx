// Section D2: the Crew as functions of FILM time T (world metres). Every shot samples the same choreography, so
// positions hold across cuts. It starts exactly where D1 leaves them (battle.tsx blends each spec in from D1's own over
// the first 0.45 s: kneeling in a row behind the cover slab on the crater's west rim, backs to it) and ends with them
// regrouped on the rim crest by the girder (D3 blends out of these). R3: under pressure, in exchanges.
//
//   flares    up off his knee, two canisters over the slab into the crater (the smoke wall); down again by the slab
//   decoy     sketches the figures under the drone's beam (insert), sets the tablet on the slab's top edge, taps the
//             clip-on projector on (the beam to the smoke); takes it down when the smoke is gone (112.6) and joins
//   breaker   covers the pilot from D at the slab's south end (tool up) until the light takes it; follows the flank;
//             swings at A (parried), is shoved down; under A's finishing blow (the tether's clamp jerks it off); catches
//             the runner (CATCH) and lowers him
//   director  his signal as B's fist goes into the light; leads the run north; bashes at A (blocked, its forearm in the
//             path), takes its hammer on the plate (heel skid), is pressed back, ducks its hook; covers the downed
//             breaker; back up to the crest; COUNTER: his plate into D's side
//   runner    in file behind him; the adze behind B's right knee (FLANK); ducks its backhand; the fork under its back
//             plate, the pop, the cables; guards the crest: D's hook breaks through his parry (KNOCKBACK); from his
//             knees the adze behind D's ankle (it goes down)
//   tether    to girder post 3; the clamp on A's chest (it grabs the cable and hauls her a step); the wrap; the reel
//   drone     flies the allied drone from the slab; up the crest at 104; it takes D's blow meant for the runner (SHIELD)
// Runs use gaitW on groundH (planted feet); between runs each person stands on a keyed root with planted steps. Tool
// contacts are solved to world points on the machines (unitAttach); machines aim at the people through setAim (their
// bodies and tools only: no cycle).
import {V3, add3, sub3, mul3, norm3, lerp, clamp, smooth, easeOut, easeIn} from '../../../kit/math';
import {makeView} from '../../engine';
import {
  FigSpec, Pose, keyPose, blendPose, layer, lookR2, dmgR2, toolsR2, gaitW, GaitW, BRACED, BASH, AIM as AIM_POSE, THROW, PRY, KNEEL, STAND, KNOCKED_BACK, CATCH_BODY, SKETCH,
  plateWear, tetherLauncher, hipReel, tablet, breaker, controller, halligan1, halligan2, canister, Role2, PlateState, figureRig, FACES, expr, exprMix,
} from '../../rig';
import type {FigProps, Face} from '../../rig';
import {unitAttach} from '../../mech';
import {M} from '../../timing';
import {XZ, KP, KR, G, onG, keyRoot, footAt, autoSteps, runDist, runSpeed, cruise, pathLen, fwdOf, rightOf, headingTo, wrapD, win, after} from '../D1/motion';
import {SPOTS} from '../D1/crew';
import {EV2, unitD2, ANCHOR, SHIELD_AT, MARK_AT, setAim, bRoot, dHookFoot, aCablePt, decoyPt, D_UP} from './machines';

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
  hurry: {stride: 1.25, duty: 0.46, lift: 0.1, bob: 7, armAmp: 14, lean: 16} as GaitW,
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
  if (prev && (prev.kind === 'run' || prev.kind === 'fn')) {
    const t0 = s.root[0][0];
    const w = smooth(clamp((T - t0) / 0.3));
    if (w < 1) {
      const pr = bodyAt(segs.slice(0, i), t0);
      b.footL = mixFoot(pr.footL, b.footL, clamp(w * 1.6));
      b.footR = mixFoot(pr.footR, b.footR, clamp(w * 1.6 - 0.6));
      if (prev.kind === 'run') { b.gait = pr.gait; b.runK = (1 - w) * pr.runK; }
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
/** run pose: the gait's body plus role arms, faded into the stance pose by runK */
const withRun = (b: Body, stance: Pose, runArms: Pose): Pose => {
  if (!b.gait || b.runK <= 0.001) return stance;
  const run = layer(b.gait, runArms, {face: {...FACES.effort}});
  return blendPose(stance, run, b.runK);
};
const withHead = (pose: Pose, b: {pos: V3; heading: number}, at: V3 | null, w = 1, lim = 75): Pose => {
  if (!at || w <= 0) return pose;
  const h = pose.head ?? {};
  return {...pose, head: {yaw: lerp(h.yaw ?? 0, lookYaw(b, at, lim), w), pitch: lerp(h.pitch ?? 0, lookPitch(b, at), w), roll: h.roll}};
};
/** a look track: keys [t, target (null = the pose's own head), blend s]; each key's head angles (relative to the body
 *  now) take over from the one before over its blend, so a new look is a turn of the head, never a jump. Only the keys
 *  still blending are evaluated. Returns the head's yaw/pitch, how much of it is a look (w), and the eyes' target. */
type LookKey = [number, V3 | ((T: number) => V3) | null, number?];
const lookTrack = (T: number, b: {pos: V3; heading: number}, keys: LookKey[], lim = 75) => {
  let i0 = 0;
  for (let i = keys.length - 1; i >= 0; i--) if (T >= keys[i][0] + (keys[i][2] ?? 0.2)) { i0 = i; break; }
  const ang = (k: LookKey) => {
    const P = k[1] === null ? null : typeof k[1] === 'function' ? k[1](T) : k[1];
    if (!P) return {yaw: 0, pitch: 0, w: 0, P: null as V3 | null};
    // a target swinging round behind the body: the look lets go before the head would have to flip sides
    const raw = wrapD(headingTo(b.pos, P) - b.heading);
    return {yaw: clamp(raw, -lim, lim), pitch: lookPitch(b, P), w: 1 - smooth(clamp((Math.abs(raw) - 105) / 45)), P};
  };
  let s = ang(keys[i0]);
  for (let i = i0 + 1; i < keys.length && T >= keys[i][0]; i++) {
    const n = ang(keys[i]), w = smooth(clamp((T - keys[i][0]) / (keys[i][2] ?? 0.2)));
    s = {yaw: lerp(s.w ? s.yaw : n.yaw, n.w ? n.yaw : s.yaw, w), pitch: lerp(s.w ? s.pitch : n.pitch, n.w ? n.pitch : s.pitch, w), w: lerp(s.w, n.w, w), P: w < 0.5 ? s.P ?? n.P : n.P ?? s.P};
  }
  return s;
};
const withLook = (pose: Pose, lk: ReturnType<typeof lookTrack>, w = 1): Pose => {
  const k = lk.w * w;
  if (k <= 0) return pose;
  const h = pose.head ?? {};
  return {...pose, head: {yaw: lerp(h.yaw ?? 0, lk.yaw, k), pitch: lerp(h.pitch ?? 0, lk.pitch, k), roll: h.roll}};
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
const base = (role: Role2, key: string, seed: number, b: Body, T: number, pose: Partial<FigProps>, world: {handL?: V3; handR?: V3} = {}, gaze?: V3): FigSpec => ({
  key, look: lookR2(role), t: T, seed, pos: b.pos, heading: b.heading,
  pose: {...pose, dmg: dmgR2(role, T)},
  world: {footL: b.footL, footR: b.footR, ...world},
  ...(gaze ? {gaze, gazeW: 0.85} : {}),
});
export type CrewOut = {spec: FigSpec; body: Body; pts?: Record<string, V3>};
const sp = (who: keyof typeof SPOTS) => SPOTS[who];
const at3 = (x: number, z: number, up: number): V3 => ({x, y: G(x, z) + up, z});
/** an expanding window that stays on: 0 before a, 1 after b */
const ramp = (T: number, a: number, b: number) => smooth(clamp((T - a) / Math.max(1e-6, b - a)));
/** a quick jolt: rises in 0.05 s at t0, decays (block impulses) */
const jolt = (T: number, t0: number, decay = 6) => (T < t0 ? 0 : T < t0 + 0.05 ? (T - t0) / 0.05 : Math.exp(-(T - t0 - 0.05) * decay));
const SMOKE_EYE = at3(54.4, -1.4, 1.8);
const figEye = (T: number) => decoyPt(1, T, 0.62);
/** the flinch everyone gives the blast in the smoke (head ducks, shoulders up) */
const flinch = (T: number, t0: number, k = 1): Pose => {
  const w = win(T, t0, t0 + 0.7, 0.05, 0.45) * k;
  return w > 0 ? {drop: 8 * w, head: {pitch: 12 * w, yaw: 0}, face: {...FACES.shock, squint: 0.8 * w}} : {};
};
const BLAST = EV2.blast;

// ------------------------------------------------------------------ faces (RIG's named expressions, rig/faces.ts)
const E: Record<string, Face> = {
  focus: FACES.concentration, effort: FACES.effort, anger: FACES.anger, fear: FACES.fear, alert: FACES.alert, resolve: FACES.resolve,
  pain: expr('pain', 1, {squint: 0.85}), shock: FACES.shock, relief: FACES.relief, pant: FACES.exhaustion, recog: FACES.recognition,
  strain: expr('effort', 1, {worry: 0.3, lid: 0.3}), dazed: exprMix('pain', 'exhaustion', 0.5), worried: expr('fear', 0.55),
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
const withFace = (pose: Pose, f: Face, w = 1): Pose => ({...pose, face: w >= 1 ? f : blendPose({face: pose.face ?? {}}, {face: f}, w).face});

/** a stand that follows a run starts on the run's arrival heading; one before a run ends on its leaving heading (the
 *  body never snaps round at a join) */
const joinHeadings = (segs: Seg[]) => segs.forEach((s, i) => {
  const prev = segs[i - 1], next = segs[i + 1];
  if (s.kind !== 'stand') return;
  if (prev?.kind === 'run') { const n = prev.path.length; s.root[0][3] = headingTo(prev.path[n - 2], prev.path[n - 1]); }
  if (next?.kind === 'run') s.root[s.root.length - 1][3] = headingTo(next.path[0], next.path[1]);
});
const SOLVE = makeView({pos: {x: 40, y: 3, z: 3}, target: {x: 47, y: 1, z: 3}, fov: 40});
/** the spec's world hand targets at weight w against where its pose alone puts the hands (a grip taken or let go
 *  over a few frames, never a jump) */
const blendWorld = (spec: FigSpec, w: number): FigSpec => {
  const wd = spec.world ?? {};
  if (w >= 0.999 || (!wd.handL && !wd.handR)) return spec;
  const free = figureRig(SOLVE, {...spec, world: {footL: wd.footL, footR: wd.footR}});
  if (w <= 0.001) return {...spec, world: {footL: wd.footL, footR: wd.footR}};
  return {...spec, world: {...wd, ...(wd.handL ? {handL: lerp3v(free.handL, wd.handL, w)} : {}), ...(wd.handR ? {handR: lerp3v(free.handR, wd.handR, w)} : {})}};
};

// ================================================================== THE DIRECTOR (clerkC, plate on the left forearm)
const D0 = sp('director');
/** where he plants for the bash on A (it turns to him and blocks) */
export const DIR_BASH = {x: 53.32, z: -3.68};
/** at A's back (north-east of it, off the tether's line) as the clamp bites */
export const DIR_BACK = {x: 54.2, z: -3.62};
/** at the wreck pile under the girder (A's head at his feet): he follows A up the slope as it is dragged */
export const DIR_PILE = {x: 50.85, z: -8.5};
/** at D's right side as the plate lands (EV2.counter) */
export const DIR_COUNTER = {x: 50.55, z: -6.8};
export const DIR_END = {x: 50.25, z: -7.7};
const DIR_RUN: XZ[] = [{x: D0.x - 0.05, z: D0.z - 0.1}, {x: 45.7, z: 1.95}, {x: 45.9, z: 0.0}, {x: 46.55, z: -1.7}, {x: 47.05, z: -3.2}, {x: 49.4, z: -5.15}, {x: 52.05, z: -5.15}, DIR_BASH];
const dirBashH = headingTo(DIR_RUN[DIR_RUN.length - 2], DIR_BASH);
const bk = (p: XZ, h: number, d: number): XZ => { const f = fwdOf(h); return {x: p.x - f.x * d, z: p.z - f.z * d}; };
// the hammer drives him back a step; A's press walks him back north, away from the runner's pry (off its sightline)
const DIR_B1 = bk(DIR_BASH, dirBashH, 0.12), DIR_B2 = {x: 53.5, z: -4.15}, DIR_B3 = {x: 53.72, z: -4.7};
const DIR_SEGS: Seg[] = [
  // kneeling (D1's BREATH); up into a crouch facing the slab, plate up, as the drone's beam comes back
  {kind: 'stand', root: [[94.3, D0.x, D0.z, 270], [96.1, D0.x, D0.z, 270], [96.75, D0.x, D0.z, 95], [99.0, D0.x, D0.z, 95], [99.32, D0.x - 0.05, D0.z - 0.1, headingTo(DIR_RUN[0], DIR_RUN[1])]], stag: 0.14},
  {kind: 'run', path: DIR_RUN, T0: 99.34, T1: 102.74, gait: GAITS.dir, A: 0.6, D: 0.22},
  {kind: 'stand', stag: 0.18, root: [[102.74, DIR_BASH.x, DIR_BASH.z, dirBashH], [EV2.block, DIR_BASH.x, DIR_BASH.z, dirBashH], [EV2.block + 0.16, DIR_B1.x, DIR_B1.z, dirBashH],
    [EV2.aHam, DIR_B1.x, DIR_B1.z, dirBashH], [EV2.aHam + 0.2, DIR_B2.x, DIR_B2.z, 160], [EV2.press0 + 0.15, DIR_B2.x, DIR_B2.z, 162], [EV2.press1 + 0.05, DIR_B3.x, DIR_B3.z, 176],
    // the hook: he ducks under it and goes down on a knee on the slope; up again (then round A's back as it turns on
    // the downed breaker)
    // up again and round to A's back (north-east of it) as it turns on the downed breaker; his plate wound back as the
    // clamp bites (A is hauled out of his reach); round after it
    [105.2, DIR_B3.x, DIR_B3.z, 176], [105.42, DIR_B3.x, DIR_B3.z, 190], [106.0, DIR_BACK.x, DIR_BACK.z, 222], [107.5, DIR_BACK.x, DIR_BACK.z, 222],
    [107.85, DIR_BACK.x - 0.03, DIR_BACK.z - 0.05, 330]]},
  // after A as the reel drags it up the slope (a body's width off its line), to the wreck pile under the girder
  {kind: 'run', path: [DIR_BACK, {x: 53.0, z: -5.1}, {x: 51.9, z: -6.6}, DIR_PILE], T0: 107.88, T1: 109.6, gait: GAITS.dir, A: 0.45, D: 0.6},
  // A stirs at his feet: the plate on its head; then D on the runner: round and into its side
  {kind: 'stand', stag: 0.16, root: [[109.6, DIR_PILE.x, DIR_PILE.z, 330], [110.0, DIR_PILE.x, DIR_PILE.z, 12], [112.8, DIR_PILE.x, DIR_PILE.z, 12], [113.28, DIR_PILE.x + 0.02, DIR_PILE.z + 0.05, 200]]},
  {kind: 'run', path: [DIR_PILE, {x: 50.75, z: -7.55}, DIR_COUNTER], T0: 113.3, T1: EV2.counter, gait: GAITS.dir, A: 0.3, D: 0.12},
  {kind: 'stand', stag: 0.16, root: [[EV2.counter, DIR_COUNTER.x, DIR_COUNTER.z, 224], [EV2.counter + 0.4, DIR_COUNTER.x - 0.1, DIR_COUNTER.z + 0.08, 224],
    [115.25, DIR_COUNTER.x - 0.1, DIR_COUNTER.z + 0.08, 224], [115.95, DIR_END.x, DIR_END.z, 100], [116.92, DIR_END.x, DIR_END.z, 95]]},
];
(() => {
  const ru = DIR_SEGS[5] as Extract<Seg, {kind: 'run'}>, st = DIR_SEGS[6] as Extract<Seg, {kind: 'stand'}>, pl = DIR_SEGS[4] as Extract<Seg, {kind: 'stand'}>;
  const hRun = headingTo(ru.path[ru.path.length - 2], DIR_COUNTER);
  pl.root[3][3] = headingTo(DIR_PILE, ru.path[1]);
  st.root[0][3] = hRun; st.root[1][3] = hRun; st.root[2][3] = hRun;
})();
const GUARD = {r: 6, u: 345, f: 112};
const plateFromGuard = (b: {pos: V3; heading: number}, g: {r: number; u: number; f: number}): V3 => {
  const w = fromLoc(b, g);
  const f = fwdOf(b.heading);
  return {x: w.x + f.x * 0.05, y: w.y - 0.15, z: w.z + f.z * 0.05};
};
/** the plate arm on the run: guarded, carried by the torso */
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
const DIR_FACE: [number, Face][] = [
  [94.3, E.pant], [95.0, {...E.focus, worry: 0.3}], [96.1, E.alert], [96.8, E.resolve], [98.05, E.recog], [98.6, E.focus], [99.15, E.resolve], [99.35, E.effort],
  [102.6, E.anger], [EV2.block + 0.02, E.strain], [EV2.aHam, E.pain], [EV2.aHam + 0.3, E.strain], [EV2.aHook - 0.2, E.fear], [EV2.aHook + 0.2, E.pain], [105.5, E.effort],
  [106.0, E.anger], [EV2.tBite + 0.05, E.shock], [106.6, E.anger], [107.1, E.effort], [EV2.crash, E.shock], [109.1, E.pant], [110.0, E.alert], [EV2.knock + 0.05, E.fear], [EV2.aKill - 0.3, E.anger], [111.6, E.resolve], [112.8, E.fear],
  [113.25, E.anger], [EV2.counter, E.strain], [114.6, E.effort], [115.3, E.pant], [115.95, E.relief],
];
/** his body and plate only (no machine look-ups): what A aims at */
const dirCore = (T: number) => {
  const b = bodyAt(DIR_SEGS, T);
  let guard = {...GUARD};
  // the bash into A (anticipation over the last strides), the plate stopped on its forearm
  const bashIn = clamp((T - (EV2.block - 0.4)) / 0.4), bashOut = after(T, EV2.block + 0.1, 0.45);
  // the counter on D (113.76 → 114.12): a short lunge, the plate into its right side
  const cIn = clamp((T - (EV2.counter - 0.36)) / 0.36), cOut = after(T, EV2.counter + 0.12, 0.55);
  let chg = 0;
  if (T > EV2.block - 0.42 && T < EV2.block + 0.7) chg = Math.max(chg, easeIn(bashIn) * (1 - bashOut));
  if (T > EV2.counter - 0.4 && T < EV2.counter + 0.9) chg = Math.max(chg, easeIn(cIn) * (1 - cOut));
  // the hammer on the plate (heavy block): the plate driven down and in; the hook: he ducks under it
  const ham = jolt(T, EV2.aHam, 5);
  const duck = win(T, EV2.aHook - 0.22, EV2.aHook + 0.5, 0.12, 0.3);
  // A stirs at his feet: the plate driven down on its head
  const kIn = clamp((T - (EV2.aKill - 0.38)) / 0.38), kOut = after(T, EV2.aKill + 0.1, 0.5);
  if (T > EV2.aKill - 0.4 && T < EV2.aKill + 0.8) chg = Math.max(chg, easeIn(kIn) * (1 - kOut));
  const downBash = win(T, EV2.aKill - 0.4, EV2.aKill + 0.7, 0.3, 0.45);
  // ducking the hook he slips on the slope: down on a knee, a hand to the ground; up again
  const slip = win(T, EV2.aHook + 0.05, 105.42, 0.15, 0.3);
  // the plate wound back at A's back as the clamp bites — swung at nothing as the reel hauls it away
  const air = win(T, 106.55, 107.35, 0.2, 0.25);
  const cover = air;
  guard = {r: GUARD.r - 20 * cover, u: GUARD.u + 30 * cover - 40 * ham, f: GUARD.f - 40 * cover - 30 * ham};
  const plate = chg > 0.5 ? plateFromGuard(b, BASH_ARM) : plateFromGuard(b, guard);
  const drop = 0.26 + 0.24 * duck + 0.1 * ham;
  return {b, guard, chg, ham, duck, slip, cover, downBash, plate, head: fromLoc(b, {r: 0, u: 430 - 120 * Math.max(duck, slip) - 40 * ham, f: 40 + 60 * duck}), drop};
};
export const directorAt = (T: number): CrewOut => {
  const {b, guard, chg, ham, duck, slip, cover, downBash} = dirCore(T);
  const plate: PlateState = toolsR2('director', T).plate ?? 'dented';
  let pose: Pose = layer(BRACED({wide: 0.8}), {armL: {local: guard, pole: {r: -1, u: -0.7, f: 0.1}, palm: {r: -0.55, u: 0.1, f: -1}}, handL: 'fist'});
  // kneeling behind the slab (D1's BREATH pose); up into a crouch on the beam's return
  const kneel = 1 - ramp(T, 96.1, 96.6);
  if (kneel > 0) pose = blendPose(pose, layer(KNEEL('R'), {drop: 70, lean: -6, armL: {local: {r: -30, u: 200, f: 60}, palm: {r: 0.4, u: 0.2, f: -1}}, armR: {local: {r: 52, u: 120, f: 70}}, handL: 'fist', handR: 'relaxed', breath: 0.8}), kneel);
  const low = win(T, 96.4, 99.4, 0.3, 0.2);
  if (low > 0) pose = blendPose(pose, layer(pose, {drop: 54, lean: 18}), low);
  // the signal: a hard forward chop of the right hand (go) as B's fist goes into the light
  const sig = win(T, EV2.signal - 0.12, EV2.signal + 0.28, 0.08, 0.14);
  if (sig > 0) pose = blendPose(pose, layer(pose, {armR: {local: {r: 26, u: 300 + 50 * Math.sin(Math.PI * clamp((T - EV2.signal + 0.1) / 0.3)), f: 200}, palm: {r: 0, u: -1, f: 0.2}}, handR: 'open'}), sig);
  if (chg > 0) pose = blendPose(pose, layer(BASH(1), {drop: 32, lean: 24}), chg);
  if (ham > 0.01) pose = layer(pose, {drop: (pose.drop ?? 0) + 22 * ham, lean: (pose.lean ?? 0) - 10 * ham});
  if (duck > 0) pose = layer(pose, {drop: (pose.drop ?? 0) + 55 * duck, lean: (pose.lean ?? 0) + 28 * duck, head: {pitch: 18 * duck}});
  if (slip > 0) pose = blendPose(pose, layer(KNEEL('L'), {drop: 78, lean: 22, armR: {local: {r: 50, u: 60, f: 80}}, handR: 'brace', head: {pitch: 10}}), slip);
  if (cover > 0) pose = layer(pose, {drop: (pose.drop ?? 0) + 10 * cover, lean: (pose.lean ?? 0) - 8 * cover, twist: 22 * cover});
  if (downBash > 0) pose = layer(pose, {drop: (pose.drop ?? 0) + 40 * downBash, lean: (pose.lean ?? 0) + 26 * downBash});
  const bright = ramp(T, 115.3, 116.0);
  if (bright > 0) pose = blendPose(pose, layer(STAND, {drop: 14, lean: 6, armL: {local: {r: -40, u: 190, f: 70}, palm: {r: 0.4, u: 0.2, f: -1}}, armR: {local: {r: 54, u: 150, f: 30}}, handL: 'fist', handR: 'relaxed', breath: 0.85}), bright);
  // eyes: the decoy maker (D1's last look), the drone's beam over the slab, the north end, the light; A; the breaker;
  // A dragged away; the crash; D; the runner; D; the pile
  const aH = (t: number) => unitAttach(unitD2('A', t)).head, dU = (t: number) => unitAttach(unitD2('D', t));
  const lk = lookTrack(T, b, [[94.3, at3(46.7, 4.5, 1.0)], [95.0, at3(47.2, 3.4, 3.0), 0.3], [96.1, MARK_AT, 0.25], [97.9, figEye, 0.2], [99.2, at3(46.6, 1.5, 1.0), 0.15],
    [99.4, at3(52.4, -3.6, 1.6), 0.25], [102.3, aH, 0.15], [105.35, at3(52.5, -1.2, 0.8), 0.15], [105.6, aH, 0.2], [107.8, (t) => unitAttach(unitD2('A', Math.min(t, EV2.crash))).chest, 0.2],
    [109.6, aH, 0.25], [110.5, at3(49.8, -6.1, 1.2), 0.2], [110.9, aH, 0.2], [111.5, (t) => dU(t).head, 0.25], [112.85, (t) => dU(t).chest, 0.2], [EV2.counter + 0.5, (t) => dU(t).head, 0.25],
    [115.6, at3(49.2, -6.9, 1.0), 0.35]]);
  const tgt = lk.P ?? undefined;
  pose = withLook(pose, lk, 1 - chg * 0.7);
  const guardOn = (1 - kneel) * (1 - chg) * (1 - sig) * (1 - bright);
  const arm = blendPose(pose, layer(pose, {armL: {local: guard, pole: {r: -1, u: -0.7, f: 0.1}, palm: {r: -0.55, u: 0.1, f: -1}}}), guardOn);
  const final = withRun(b, withFace(arm, faceKeys(T, DIR_FACE)), guardRun(b));
  kneelFeet(b, 'R', kneel);
  kneelFeet(b, 'L', slip);
  const glint = Math.max(win(T, EV2.block, EV2.block + 0.16, 0.01, 0.12), win(T, EV2.aHam, EV2.aHam + 0.16, 0.01, 0.12), win(T, EV2.counter, EV2.counter + 0.16, 0.01, 0.12));
  const spec = base('director', 'd2dir', 11, b, T, {...final, face: final.face, handL: 'fist', handR: final.handR ?? 'fist', wearL: plateWear(plate, {glint})}, {}, b.inRun ? undefined : tgt);
  return {spec, body: b, pts: {plate: dirCore(T).plate}};
};
export const directorPlate = (T: number) => dirCore(T).plate;

// ================================================================== THE BREAKER (honest)
const K0 = sp('breaker');
/** at the slab's south end, tool up between D and the pilot */
const BRK_COVER = {x: 47.35, z: 6.9};
/** at A's south-west as the swing lands (A parries it) */
/** (R4) 0.45 m further from A than R3's (53.05, -1.75): the tool's ram end meets A's flank 1.15 m from his chest now, not
 *  0.4 m (the swing's hands were laid 0.6-1.0 m behind the tip, i.e. through his own body, and A's parrying fist sat 20 cm
 *  from his head and inside his torso at 105.00-105.07) */
export const BRK_AT = {x: 52.82, z: -1.36};
/** shoved back and down onto a knee */
const BRK_DOWN = {x: 52.3, z: -0.82};
const BRK_CREST = {x: 48.3, z: -5.1};
/** the end of his run in, at A (his swing's wind-up starts as he plants) */
const BRK_ARRIVE = 104.68;
export const BRK_CATCH = {x: 48.75, z: -7.05};
// (in along the burnt-out canister's side, south of the pry: clear of its line)
const BRK_RUN: XZ[] = [BRK_COVER, {x: 46.05, z: 6.55}, {x: 45.75, z: 4.6}, {x: 45.8, z: 1.6}, {x: 46.6, z: 0.1}, {x: 48.4, z: 0.45}, {x: 50.9, z: 0.05}, {x: 52.35, z: -0.85}, BRK_AT];
const BRK_SEGS: Seg[] = [
  {kind: 'stand', root: [[94.3, K0.x, K0.z, 270], [95.55, K0.x, K0.z, 270], [95.72, K0.x - 0.05, K0.z + 0.05, 230]]},
  {kind: 'run', path: [{x: K0.x - 0.05, z: K0.z + 0.05}, {x: 45.95, z: 4.4}, {x: 45.8, z: 6.1}, {x: 46.3, z: 7.15}, BRK_COVER], T0: 95.75, T1: 97.05, gait: GAITS.hurry, A: 0.3, D: 0.35},
  {kind: 'stand', stag: 0.2, root: [[97.05, BRK_COVER.x, BRK_COVER.z, 100], [97.4, BRK_COVER.x, BRK_COVER.z, 112], [EV2.brkGo - 0.45, BRK_COVER.x, BRK_COVER.z, 112], [EV2.brkGo, BRK_COVER.x - 0.05, BRK_COVER.z - 0.05, headingTo(BRK_COVER, BRK_RUN[1])]]},
  {kind: 'run', path: BRK_RUN, T0: EV2.brkGo + 0.02, T1: BRK_ARRIVE, gait: GAITS.heavy, A: 0.7, D: 0.35},
  // the swing (A parries it), the shove: back and down on one knee
  {kind: 'stand', stag: 0.2, root: [[BRK_ARRIVE, BRK_AT.x, BRK_AT.z, 0], [BRK_ARRIVE + 0.12, BRK_AT.x, BRK_AT.z, 0], [EV2.aShove, BRK_AT.x, BRK_AT.z, 0], [EV2.aShove + 0.3, BRK_DOWN.x, BRK_DOWN.z, 0], [106.5, BRK_DOWN.x, BRK_DOWN.z, 0],
    [107.05, BRK_DOWN.x + 0.05, BRK_DOWN.z, 255]]},
  {kind: 'run', path: [BRK_DOWN, {x: 51.4, z: -0.4}, {x: 50.2, z: -0.95}, {x: 49.3, z: -3.3}, BRK_CREST], T0: 107.15, T1: 109.0, gait: GAITS.heavy, A: 0.5, D: 0.5},
  {kind: 'stand', stag: 0.14, root: [[109.0, BRK_CREST.x, BRK_CREST.z, 150], [109.45, BRK_CREST.x, BRK_CREST.z, 150], [110.15, BRK_CATCH.x, BRK_CATCH.z, 128], [110.62, BRK_CATCH.x, BRK_CATCH.z, 128],
    [111.2, BRK_CATCH.x + 0.12, BRK_CATCH.z + 0.08, 132], [111.7, BRK_CATCH.x - 0.1, BRK_CATCH.z - 0.14, 132], [116.92, BRK_CATCH.x - 0.1, BRK_CATCH.z - 0.14, 130]]},
];
(() => {
  // the swing and shove stand faces A
  const s = BRK_SEGS[4] as Extract<Seg, {kind: 'stand'}>;
  const hA = headingTo(BRK_AT, {x: 53.82, z: -2.55});
  [1, 2, 3, 4].forEach((i) => (s.root[i][3] = hA));
})();
/** the breaker's swing as world hand keys around a tip target (D1): wind-up overhead → strike → recoil */
// ---- the tool let go for the catch: dropped at his right side as the runner comes flying (110.66), taken up again
// from his knees (116.15). Between, it lies on the ground (fx draws it); the hands let go and take it over 0.2 s.
export const BRK_DROP = 110.66, BRK_PICK = 116.15;
const TUBE = 270 / 251.4, REAR = 60 / 251.4, HEAD = 34 / 251.4, FRONT_GRIP = 0.34;
/** the tool as {back hand point, unit direction to the ram end} */
type ToolPose = {back: V3; u: V3};
const toolFromHands = (H: {front: V3; back: V3}): ToolPose => ({back: H.back, u: norm3(sub3(H.front, H.back))});
let REST: ToolPose | null = null;
/** where it comes to rest: on the ground beside his right knee, lying along his heading, a little turned */
const toolRest = (): ToolPose => (REST ??= (() => {
  const b = bodyAt(BRK_SEGS, BRK_PICK - 0.4), f = fwdOf(b.heading + 18), r = rightOf(b.heading);
  const bx = b.pos.x + r.x * 0.5 - f.x * 0.25, bz = b.pos.z + r.z * 0.5 - f.z * 0.25;
  return {back: {x: bx, y: G(bx, bz) + 0.07, z: bz}, u: norm3({x: f.x, y: (G(bx + f.x, bz + f.z) - G(bx, bz)), z: f.z})};
})());
/** the tool in world while it is out of his hands (null when held) */
export const breakerLoose = (T: number): (ToolPose & {rear: V3; tip: V3}) | null => {
  if (T < BRK_DROP || T >= BRK_PICK) return null;
  const R = toolRest();
  const A = toolFromHands(brkCore(BRK_DROP - 0.001).H);
  // it falls (0.32 s, gravity), the ram end first, one small bounce
  const u = clamp((T - BRK_DROP) / 0.32);
  const fall = u * u;
  const bounce = T > BRK_DROP + 0.32 ? Math.max(0, Math.sin(Math.PI * clamp((T - BRK_DROP - 0.32) / 0.16))) * 0.04 : 0;
  const back = add3(lerp3v(A.back, R.back, fall), {x: 0, y: bounce, z: 0});
  const dir = norm3(lerp3v(A.u, R.u, smooth(clamp(u * 1.3))));
  return {back, u: dir, rear: sub3(back, mul3(dir, REAR)), tip: add3(back, mul3(dir, TUBE - REAR + HEAD))};
};
/** the grips on the lying tool (where his hands take it) */
const looseGrips = (): {front: V3; back: V3} => { const R = toolRest(); return {back: add3(R.back, {x: 0, y: 0.03, z: 0}), front: add3(add3(R.back, mul3(R.u, FRONT_GRIP)), {x: 0, y: 0.03, z: 0})}; };
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
/** where his swing aims: A's left flank as it turns to him (A's left forearm meets the tip there: its parry) */
const BRK_SWING_TO: V3 = at3(53.55, -2.25, 1.35);
const BRK_FACE: [number, Face][] = [
  [94.3, E.pant], [95.0, E.focus], [95.5, E.alert], [97.2, E.anger], [98.1, E.focus], [98.7, E.relief], [99.4, E.focus], [EV2.brkGo, E.effort],
  [104.6, E.anger], [EV2.brkSwing, E.strain], [EV2.aShove, E.pain], [105.9, E.fear], [EV2.tBite + 0.05, E.shock], [106.6, E.effort], [109.0, E.pant],
  [110.3, E.alert], [111.0, E.fear], [EV2.catch, E.strain], [112.3, {...E.worried, mouth: 'pant'}], [115.6, E.relief],
];
/** his body and tool only (no machine look-ups): what A aims at */
const brkCore = (T: number) => {
  const b = bodyAt(BRK_SEGS, T);
  const swing = T > BRK_ARRIVE && T < 105.42;
  const k = swing ? swingK(T, BRK_ARRIVE + 0.03, EV2.brkSwing, 105.42) : 0;
  const hands = swing ? swingHands(b, BRK_SWING_TO, k) : null;
  let port = {front: fromLoc(b, {r: -16, u: 250, f: 118}), back: fromLoc(b, {r: 32, u: 205, f: 34})};
  // from his knees: up with the tool off the ground (the grips rise into the low port over 0.45 s)
  if (T >= BRK_PICK && T < BRK_PICK + 0.45 && REST_READY) {
    const g = looseGrips(), k = smooth((T - BRK_PICK) / 0.45);
    port = {front: lerp3v(g.front, port.front, k), back: lerp3v(g.back, port.back, k)};
  }
  const H = hands ?? port;
  const tip = add3(H.front, mul3(norm3(sub3(H.front, H.back)), 144 / 251.4));
  return {b, swing, k, hands, H, tip, chest: fromLoc(b, {r: 0, u: 300, f: 20})};
};
let REST_READY = false;
export const breakerAt = (T: number): CrewOut => {
  REST_READY = true;
  const {b, swing, k, hands, H} = brkCore(T);
  const gauge = toolsR2('breaker', T).gauge ?? 1;
  let pose: Pose = layer(BRACED({wide: 0.85}), {});
  const kneel0 = 1 - ramp(T, 95.45, 95.75);
  if (kneel0 > 0) pose = blendPose(pose, layer(KNEEL('L'), {drop: 76, lean: 4, breath: 0.8}), kneel0);
  // the cover: low and wide at the slab's south end, the tool across his body toward D
  const cov = win(T, 97.0, EV2.brkGo, 0.2, 0.2);
  if (cov > 0) pose = blendPose(pose, layer(pose, {drop: 44, lean: 16}), cov);
  if (hands) {
    const sw = k < 0.36 ? smooth(k / 0.36) : 1;
    pose = layer(pose, {
      drop: lerp(20, 12, sw) + (k > 0.45 && k < 0.8 ? 30 * Math.sin(Math.PI * clamp((k - 0.45) / 0.35)) : 0),
      lean: k < 0.36 ? lerp(8, -14, smooth(k / 0.36)) : k < 0.55 ? lerp(-14, 38, easeIn((k - 0.36) / 0.19)) : lerp(38, 10, smooth((k - 0.55) / 0.45)),
      twist: k < 0.36 ? 16 * smooth(k / 0.36) : lerp(16, -6, smooth((k - 0.36) / 0.3)),
    });
  }
  // the parry jars him; the shove: back and down on one knee; up again
  const shoved = win(T, EV2.aShove, 106.55, 0.12, 0.35);
  if (shoved > 0) {
    const jar = jolt(T, EV2.aShove, 4);
    pose = blendPose(pose, layer(KNEEL('L'), {drop: 70, lean: -6 + 20 * smooth(clamp((T - EV2.aShove - 0.3) / 0.3)), head: {pitch: 8}, breath: 1}), shoved);
    pose = layer(pose, {lean: (pose.lean ?? 0) - 20 * jar, drop: (pose.drop ?? 0) + 10 * jar});
  }
  kneelFeet(b, 'L', Math.max(kneel0, shoved));
  // the catch: braced (he sees him coming), the runner's weight lands on his cradle at CATCH, knees give, a step back
  const cat = win(T, 110.55, 116.92, 0.3, 0.01);
  const absorb = smooth(clamp((T - EV2.catch) / 0.4)) * (1 - 0.6 * smooth(clamp((T - 112.2) / 0.6)));
  let catchHands = false;
  if (cat > 0) {
    pose = blendPose(pose, layer(CATCH_BODY, {drop: 30 + 22 * absorb, lean: 14 - 10 * absorb, head: {yaw: 0, pitch: 12}}), cat);
    catchHands = T > BRK_DROP + 0.12;
  }
  const low = ramp(T, 112.1, 112.9);
  if (low > 0) pose = blendPose(pose, layer(KNEEL('L'), {drop: 80, lean: 12, breath: 0.8, handL: 'brace', handR: 'brace'}), low);
  const stoop = win(T, BRK_PICK - 0.45, BRK_PICK + 0.4, 0.35, 0.4);
  if (stoop > 0) pose = layer(pose, {lean: (pose.lean ?? 0) + 26 * stoop, twist: (pose.twist ?? 0) - 14 * stoop, head: {pitch: 24 * stoop}});
  kneelFeet(b, 'L', low);
  const a = (t: number) => unitAttach(unitD2('A', t)), dH = (t: number) => unitAttach(unitD2('D', t)).head;
  const lk = lookTrack(T, b, [[94.3, at3(48.6, 3.5, 2.6)], [95.0, MARK_AT, 0.25], [95.6, dH, 0.25], [98.3, figEye, 0.2], [EV2.brkGo, at3(53.2, -2.6, 1.6), 0.2],
    [104.5, (t) => a(t).head, 0.15], [106.25, (t) => a(t).chest, 0.15], [107.1, at3(49.2, -8.6, 1.2), 0.3], [108.9, dH, 0.25], [110.3, at3(49.4, -6.6, 1.0), 0.25]]);
  const tgt = lk.P ?? undefined;
  pose = withLook(pose, lk, 1 - 0.4 * cat);
  // the tool is let go for the catch (it drops at his right side) and taken up again from his knees
  const toolOn = T < BRK_DROP || T >= BRK_PICK;
  const runArms: Pose = {armL: {local: {r: -16, u: 262, f: 112}}, armR: {local: {r: 30, u: 208, f: 36}}};
  const final = withRun(b, withFace(pose, faceKeys(T, BRK_FACE)), runArms);
  // the hands leave the tool's grips over 0.2 s after the drop and reach for them over 0.4 s before the pick-up
  const off = T >= BRK_DROP && T < BRK_PICK;
  const reachW = off ? Math.max(1 - smooth(clamp((T - BRK_DROP) / 0.2)), smooth(clamp((T - (BRK_PICK - 0.4)) / 0.4))) : b.inRun ? 1 - b.runK : 1;
  const grips = off ? (T < BRK_DROP + 0.2 ? H : looseGrips()) : H;
  const fire = swing ? win(T, EV2.brkSwing, EV2.brkSwing + 0.08, 0.005, 0.05) : 0;
  const spec = base('breaker', 'd2brk', 7, b, T, toolOn
    ? {...final, handL: 'grip', handR: 'grip', twoHanded: true, extra: breaker({back: 1, front: 0, gauge, fire, recoil: fire})}
    : {...final, handL: catchHands && T < BRK_PICK - 0.4 ? 'brace' : 'open', handR: catchHands && T < BRK_PICK - 0.4 ? 'brace' : 'open'},
  reachW > 0.001 ? {handL: grips.front, handR: grips.back} : {}, b.inRun ? undefined : tgt);
  return {spec: blendWorld(spec, reachW), body: b, pts: {front: H.front, back: H.back}};
};

// ================================================================== THE RUNNER (guesser, halligan)
const R0 = sp('runner');
/** behind B's right side as the adze goes behind its right knee */
export const RUN_HOOK = {x: 51.55, z: -4.12};
/** R4: for the pry he steps back 0.24 m from B's shoulder blade (away from it, along the line from B): leaning in from the
 *  hook stance put his head 0.17 m from the plate's edge, behind B's right pauldron for 12 frames (D2-4b) */
export const RUN_PRY = {x: RUN_HOOK.x - 0.65 * 0.24, z: RUN_HOOK.z - 0.76 * 0.24};
export const RUN_GUARD = {x: 50.05, z: -5.95, h: 124};
/** where his flight from the hook ends (his back on the breaker's cradle) */
export const RUN_CAUGHT = {x: 49.17, z: -6.73};
const RUN_PATH: XZ[] = [{x: R0.x - 0.1, z: R0.z - 0.15}, {x: 46.3, z: 0.0}, {x: 46.6, z: -1.7}, {x: 47.05, z: -3.1}, {x: 49.1, z: -4.75}, RUN_HOOK];
const RUN_SEGS: Seg[] = [
  {kind: 'stand', root: [[94.3, R0.x, R0.z, 270], [96.1, R0.x, R0.z, 270], [96.6, R0.x, R0.z, 40], [99.2, R0.x, R0.z, 40], [99.52, R0.x - 0.1, R0.z - 0.15, headingTo(RUN_PATH[0], RUN_PATH[1])]], stag: 0.12},
  {kind: 'run', path: RUN_PATH, T0: 99.55, T1: 102.08, gait: GAITS.crouch, A: 0.55, D: 0.35},
  // (R4) after the duck under B's backhand (103.4) he steps back to RUN_PRY and sets his feet before the lever (103.58)
  {kind: 'stand', root: [[102.08, RUN_HOOK.x, RUN_HOOK.z, 0], [102.3, RUN_HOOK.x, RUN_HOOK.z, 0], [103.36, RUN_HOOK.x, RUN_HOOK.z, 0], [103.56, RUN_PRY.x, RUN_PRY.z, 0], [104.6, RUN_PRY.x, RUN_PRY.z, 0], [104.92, RUN_PRY.x - 0.05, RUN_PRY.z - 0.05, 230]], stag: 0.12},
  {kind: 'run', path: [{x: RUN_PRY.x - 0.05, z: RUN_PRY.z - 0.05}, {x: 50.6, z: -5.2}, RUN_GUARD], T0: 104.95, T1: 105.85, gait: GAITS.run, A: 0.35, D: 0.4},
  {kind: 'stand', root: [[105.85, RUN_GUARD.x, RUN_GUARD.z, 200], [106.4, RUN_GUARD.x, RUN_GUARD.z, RUN_GUARD.h], [107.6, RUN_GUARD.x, RUN_GUARD.z, RUN_GUARD.h],
    // the drag goes past in front of him: a step back
    [107.95, RUN_GUARD.x - 0.25, RUN_GUARD.z + 0.05, RUN_GUARD.h - 6], [109.2, RUN_GUARD.x - 0.25, RUN_GUARD.z + 0.05, RUN_GUARD.h - 6], [109.6, RUN_GUARD.x, RUN_GUARD.z, RUN_GUARD.h], [EV2.knock, RUN_GUARD.x, RUN_GUARD.z, RUN_GUARD.h]], stag: 0.14},
  {kind: 'fn', T0: EV2.knock, at: (T) => runnerFlight(T)},
];
(() => {
  const s = RUN_SEGS[2] as Extract<Seg, {kind: 'stand'}>;
  const h = headingTo(RUN_HOOK, {x: 52.13, z: -3.44});
  s.root[0][3] = headingTo(RUN_PATH[RUN_PATH.length - 2], RUN_HOOK); s.root[1][3] = h; s.root[2][3] = h; s.root[3][3] = h; s.root[4][3] = h;
})();
/** knocked back: stumbling steps back along D's blow, into the breaker's arms; then lowered to a kneel there */
const runnerFlight = (T: number) => {
  const u = clamp((T - EV2.knock - 0.04) / (EV2.catch - 0.12 - EV2.knock - 0.04));
  const k = lerp(smooth(u), easeOut(u), 0.35);
  const x = lerp(RUN_GUARD.x, RUN_CAUGHT.x, k), z = lerp(RUN_GUARD.z, RUN_CAUGHT.z, k);
  const h = RUN_GUARD.h + 14 * k;
  const f = fwdOf(h), r = rightOf(h);
  const back = (dist: number, side: number): V3 => { const fx = RUN_GUARD.x - f.x * dist + r.x * side, fz = RUN_GUARD.z - f.z * dist + r.z * side; return {x: fx, y: G(fx, fz), z: fz}; };
  const step = (t0: number, t1: number, a: V3, b2: V3, lift: number) => {
    const s = clamp((T - t0) / (t1 - t0));
    const p = lerp3v(a, b2, smooth(s));
    return {...p, y: G(p.x, p.z) + Math.sin(Math.PI * s) * lift};
  };
  const L = Math.hypot(RUN_CAUGHT.x - RUN_GUARD.x, RUN_CAUGHT.z - RUN_GUARD.z);
  const fR0 = back(-0.05, 0.15), fL0 = back(-0.18, -0.15);
  const fR1 = back(L * 0.5, 0.2), fL1 = back(L * 0.8, -0.12), fR2 = back(L * 1.0, 0.22);
  const footR = T < 110.52 ? fR0 : T < 111.05 ? step(110.52, 110.76, fR0, fR1, 0.14) : step(111.05, 111.4, fR1, fR2, 0);
  const footL = step(110.72, 110.98, fL0, fL1, 0.12);
  return {pos: onG(x, z), heading: h, footL, footR};
};
const HAL_TIP = 0.62;
/** the halligan held from the back (right) hand along d */
const halFrom = (tip: V3, d: V3) => { const back = sub3(tip, mul3(d, HAL_TIP + 0.34)); return {back, front: add3(back, mul3(d, 0.34))}; };
/** the hook behind B's right knee: the adze end swung round behind it, then yanked back toward him */
const hookHands = (b: Body, T: number) => {
  const kn = unitAttach(unitD2('B', Math.min(T, EV2.knee - 0.01))).kneeR;
  const pull = smooth(clamp((T - EV2.knee) / 0.22));
  const reach = smooth(clamp((T - (EV2.knee - 0.4)) / 0.4));
  const wind = fromLoc(b, {r: 70, u: 260, f: 60});
  const tip0 = add3(kn, {x: 0, y: -0.04, z: 0});
  const toMe = norm3(sub3(fromLoc(b, {r: 0, u: 200, f: 0}), tip0));
  const tip = add3(lerp3v(wind, tip0, easeIn(reach)), mul3(toMe, 0.45 * pull));
  return halFrom(tip, norm3(sub3(tip, fromLoc(b, {r: 30, u: 230, f: 10}))));
};
/** the pry: fork tip under the back plate's LOWER edge (at his waist, the bar below his face: one clean silhouette);
 *  the back end pressed down levers the plate up and off */
const pryHands = (b: {pos: V3; heading: number}, T: number) => {
  const u = unitAttach(unitD2('B', Math.min(T, EV2.pryPop)));
  const edge = add3(u.backPlate, {x: 0, y: -0.24, z: 0});
  const sh = fromLoc(b, {r: 10, u: 300, f: 10});
  const dir0 = norm3(sub3(edge, sh));
  const lever = clamp((T - EV2.pryIn) / (EV2.pryPop - EV2.pryIn));
  const d = norm3(add3(dir0, mul3({x: 0, y: -1, z: 0}, -0.9 * easeIn(lever))));
  const back = sub3(edge, mul3(d, 0.7));
  const front = add3(back, mul3(d, 0.34));
  return {back, front, edge};
};
/**
 * (R4) After the pop the same bar goes on working, both hands staying on it (R3 let go with the left hand and swapped the
 * bar to a one-hand prop in one frame, 104.07, and the hand-and-cables crossed his face): the fork rises into the open back,
 * hooks the cable bundle, and at the rip he drags it out and away to his left. Returns the hands and the fork tip.
 */
const hookBar = (b: {pos: V3; heading: number}, T: number) => {
  const p0 = pryHands(b, EV2.pryPop);
  const d0 = norm3(sub3(p0.front, p0.back));
  const tip0 = add3(p0.back, mul3(d0, HAL_TIP + 0.34));
  const port = add3(unitAttach(unitD2('B', Math.min(T, EV2.rip))).backPlate, {x: 0, y: 0.05, z: 0});
  const u = smooth(clamp((T - (EV2.pryPop + 0.03)) / 0.22));
  const pull = easeOut(clamp((T - EV2.rip) / 0.3));
  const away = fromLoc(b, {r: -70, u: 215, f: -10});
  const tipT = lerp3v(lerp3v(tip0, port, u), away, pull);
  const backT = lerp3v(lerp3v(p0.back, fromLoc(b, {r: 34, u: 205, f: 84}), u), fromLoc(b, {r: 40, u: 190, f: 40}), pull);
  const d = norm3(sub3(tipT, backT));
  return {back: backT, front: add3(backT, mul3(d, 0.34)), tip: add3(backT, mul3(d, HAL_TIP + 0.34)), port};
};
/** the adze behind D's left ankle from his knees (114.42): the bar swung low round, yanked back */
const ankleHands = (b: Body, T: number) => {
  const ft = dHookFoot().L0;
  const reach = smooth(clamp((T - (EV2.hook - 0.35)) / 0.35)), pull = smooth(clamp((T - EV2.hook) / 0.2));
  const rest = fromLoc(b, {r: 40, u: 150, f: 60});
  const tip0 = add3(ft, {x: 0, y: 0.1, z: 0});
  const toMe = norm3(sub3(fromLoc(b, {r: 0, u: 120, f: 0}), tip0));
  const tip = add3(lerp3v(rest, tip0, easeIn(reach)), mul3(toMe, 0.5 * pull));
  return halFrom(tip, norm3(sub3(tip, fromLoc(b, {r: 30, u: 170, f: 0}))));
};
const RUN_FACE: [number, Face][] = [
  [94.3, E.pant], [95.0, E.focus], [96.1, E.alert], [97.95, E.recog], [98.5, E.focus], [99.5, E.effort], [102.15, E.anger], [102.85, E.fear], [103.3, E.effort],
  [EV2.rip, E.strain], [104.9, E.effort], [106.0, E.focus], [107.7, E.shock], [108.6, E.focus], [109.9, E.anger], [EV2.knock, E.pain], [111.5, E.dazed],
  [EV2.shield - 0.25, E.fear], [113.6, E.dazed], [EV2.hook - 0.3, E.effort], [114.8, E.pant], [115.8, E.relief],
];
/** his body and bar only (no machine look-ups): what D aims at */
const runCore = (T: number) => {
  const b = bodyAt(RUN_SEGS, T);
  // on guard on the crest: the bar raised in both hands as D comes up the slope; the parry at the hook
  const guard = win(T, 109.6, EV2.knock + 0.05, 0.3, 0.02);
  const bar = {back: fromLoc(b, {r: 36, u: 330, f: 110}), front: fromLoc(b, {r: -24, u: 350, f: 140})};
  return {b, guard, bar, chest: fromLoc(b, {r: 0, u: 300, f: 10})};
};
export const runnerAt = (T: number): CrewOut => {
  const {b, guard, bar} = runCore(T);
  let pose: Pose = layer(BRACED({wide: 0.7}), {});
  const kneel0 = 1 - ramp(T, 96.1, 96.45);
  if (kneel0 > 0) pose = blendPose(pose, layer(KNEEL('R'), {drop: 84, lean: 14}), kneel0);
  const low = win(T, 96.3, 99.5, 0.3, 0.15);
  if (low > 0) pose = blendPose(pose, layer(pose, {drop: 50, lean: 20}), low);
  const carry = {back: fromLoc(b, {r: 40, u: 190, f: 30}), front: fromLoc(b, {r: -30, u: 200, f: 60})};
  let H: {back: V3; front: V3} | null = T > 96.2 ? carry : null;
  const set = (h: {back: V3; front: V3}, w: number) => { H = H ? {back: lerp3v(H.back, h.back, w), front: lerp3v(H.front, h.front, w)} : h; };
  // the hook behind B's right knee
  const hk = win(T, EV2.knee - 0.45, EV2.knee + 0.45, 0.15, 0.2);
  if (hk > 0) { set(hookHands(b, T), hk); pose = layer(pose, {drop: 40 + 20 * hk, lean: 26 * hk, twist: -14 * hk}); }
  // its backhand: he ducks under it
  const duck = win(T, EV2.bBack - 0.28, EV2.bBack + 0.32, 0.12, 0.2);
  // (R4) down and BACK from the swing (R3 leaned 24 deg forward, into B's shoulder: his head was 0.37 m from its centre and
  // its arm passed through it, 6-10 cm, 103.03-103.17)
  if (duck > 0) pose = layer(pose, {drop: (pose.drop ?? 26) + 66 * duck, lean: (pose.lean ?? 10) - 16 * duck, twist: (pose.twist ?? 0) + 14 * duck, head: {pitch: 12 * duck}});
  const pts: Record<string, V3> = {};
  let world: {handL?: V3; handR?: V3} = {};
  // (R4) the lever, the pop and the hook are one continuous bar motion with both hands on it (see hookBar); the lever pose
  // eases out over 0.3 s after the pop instead of 0.12 s (his head rose 0.26 m in 3 frames, 104.03-104.10)
  const pry = win(T, EV2.pryIn - 0.2, 104.95, 0.2, 0.3);
  const pryPose = win(T, EV2.pryIn - 0.2, EV2.pryPop + 0.34, 0.2, 0.34);
  if (pry > 0) {
    const h = T < EV2.pryPop ? pryHands(b, T) : hookBar(b, T);
    pose = blendPose(pose, layer(PRY(clamp((T - EV2.pryIn) / 0.4)), {}), pryPose);
    set({back: h.back, front: h.front}, pry);
    pts.edge = pryHands(b, Math.min(T, EV2.pryPop)).edge;
    if (T > EV2.pryPop + 0.03) { const hb = hookBar(b, T); pts.cablesFrom = hb.port; pts.cablesHand = hb.tip; }
  }
  const rip = win(T, EV2.pryPop + 0.02, 104.95, 0.26, 0.3);
  if (rip > 0) {
    const pull = clamp((T - EV2.rip) / 0.35);
    pose = blendPose(pose, layer(pose, {lean: lerp(30, -10, easeOut(pull)), drop: lerp(50, 20, pull)}), rip);
  }
  if (guard > 0) { set(bar, guard); pose = blendPose(pose, layer(pose, {drop: 30, lean: 8}), guard); }
  // KNOCKBACK: the hook through his parry, the stagger back, the fall onto the breaker's cradle; then lowered to his knees
  const fallK = clamp((T - EV2.knock) / (EV2.catch + 0.25 - EV2.knock));
  if (T > EV2.knock) {
    const kb = keyPose([[0, layer(STAND, {drop: 20})], [0.18, layer(KNOCKED_BACK(0.15), {drop: 14})], [0.7, layer(KNOCKED_BACK(0.33), {drop: 22})], [1, layer(KNOCKED_BACK(0.42), {drop: 70, bodyPitch: -46})]], fallK);
    const w = 1 - ramp(T, 112.0, 112.9);
    pose = blendPose(pose, {...kb, handR: 'grip'}, w);
    pose = blendPose(pose, layer(KNEEL('R'), {drop: 84, lean: 18, armL: {local: {r: -20, u: 170, f: 70}}, armR: {local: {r: 40, u: 150, f: 60}}, handL: 'brace', head: {pitch: 14}, breath: 1}), 1 - w);
  }
  kneelFeet(b, 'R', Math.max(kneel0, ramp(T, 112.0, 112.9)));
  // the drone takes the blow over his head: he ducks; then the adze round D's ankle from his knees
  const sduck = win(T, EV2.shield - 0.25, EV2.shield + 0.6, 0.1, 0.35);
  if (sduck > 0) pose = layer(pose, {drop: (pose.drop ?? 0) + 14 * sduck, head: {pitch: 22 * sduck, yaw: 0}, armL: {local: {r: -10, u: 290, f: 90}}});
  const ank = win(T, EV2.hook - 0.38, EV2.hook + 0.45, 0.15, 0.25);
  if (ank > 0) { set(ankleHands(b, T), ank); pose = layer(pose, {lean: (pose.lean ?? 0) + 20 * ank, twist: -18 * ank}); }
  const bU = (t: number) => unitAttach(unitD2('B', t));
  const lk = lookTrack(T, b, [[94.3, at3(46.7, 1.85, 1.0)], [95.0, MARK_AT, 0.25], [96.1, at3(51.0, -7.5, 1.6), 0.3], [97.9, figEye, 0.25], [99.4, (t) => bU(t).head, 0.2],
    [102.3, (t) => bU(t).backPlate, 0.15], [104.9, at3(51.0, -3.2, 1.0), 0.2], [106.3, (t) => unitAttach(unitD2('A', Math.min(t, EV2.crash))).chest, 0.25],
    [109.3, (t) => unitAttach(unitD2('D', Math.min(t, 113.6))).head, 0.2], [114.0, dHookFoot().L0, 0.2], [115.4, at3(48.4, -7.6, 1.3), 0.3]]);
  const tgt = lk.P ?? undefined;
  // not while he ducks (the backhand, the drone's blow) or is knocked flying
  pose = withLook(pose, lk, (1 - Math.max(duck, sduck)) * (1 - win(T, 110.4, 113.75, 0.12, 0.3)));
  const twoH = !!H || T > 96.2;
  const runArms: Pose = {armR: {local: {r: 40, u: 220, f: 60}}, armL: b.gait?.armL};
  const final = withRun(b, withFace(pose, faceKeys(T, RUN_FACE)), runArms);
  const HH = H as {back: V3; front: V3} | null;
  if (HH && T > 96.2) world = {handR: HH.back, handL: HH.front};
  const spec = base('runner', 'd2run', 4, b, T, {
    ...final, handR: 'grip', handL: twoH ? 'grip' : final.handL ?? 'fist', twoHanded: twoH,
    ...(twoH ? {extra: halligan2({back: 1, front: 0})} : {holdR: halligan1({ang: T > EV2.knock ? 40 : 72})}),
  }, world, b.inRun ? undefined : tgt);
  return {spec: blendWorld(spec, ramp(T, 96.2, 96.45)), body: b, pts: {...pts, ...(HH ? {back: HH.back, front: HH.front, tip: add3(HH.back, mul3(norm3(sub3(HH.front, HH.back)), HAL_TIP + 0.34))} : {})}};
};

// ================================================================== THE TETHER (clerkA)
const A0 = sp('tether');
export const TTH_POST = {x: 46.0, z: -10.62};
const TTH_BRACE = {x: 45.86, z: -10.86};
const TTH_RUN: XZ[] = [{x: A0.x - 0.1, z: A0.z - 0.2}, {x: 45.85, z: 0.3}, {x: 45.85, z: -1.7}, {x: 45.85, z: -4.0}, {x: 46.25, z: -7.4}, TTH_POST];
const TTH_SEGS: Seg[] = [
  {kind: 'stand', root: [[94.3, A0.x, A0.z, 270], [96.1, A0.x, A0.z, 270], [96.6, A0.x, A0.z, 55], [99.6, A0.x, A0.z, 55], [99.93, A0.x - 0.1, A0.z - 0.2, headingTo(TTH_RUN[0], TTH_RUN[1])]], stag: 0.12},
  {kind: 'run', path: TTH_RUN, T0: 99.95, T1: 102.75, gait: GAITS.crouch, A: 0.6, D: 0.6},
  {kind: 'stand', root: [[102.75, TTH_POST.x, TTH_POST.z, 160], [103.2, TTH_POST.x, TTH_POST.z, 140], [105.4, TTH_POST.x, TTH_POST.z, 140], [105.8, TTH_POST.x, TTH_POST.z, 142],
    // A hauls on the cable: she is yanked a step toward it; the wrap: a step to the post, the launcher swept round
    // behind it, a step back west, braced
    [EV2.haul, TTH_POST.x, TTH_POST.z, 142], [EV2.haul + 0.2, TTH_POST.x + 0.16, TTH_POST.z + 0.13, 136], [EV2.taut + 0.15, TTH_BRACE.x, TTH_BRACE.z, 100],
    [109.4, TTH_BRACE.x, TTH_BRACE.z, 100], [110.4, 46.4, -10.3, 125], [111.8, 47.3, -9.5, 120], [116.92, 47.3, -9.5, 118]], stag: 0.16},
];
const TTH_FACE: [number, Face][] = [
  [94.3, E.pant], [95.0, E.focus], [96.1, E.alert], [96.6, E.focus], [99.8, E.effort], [102.6, E.focus], [105.4, {...E.focus, squint: 0.7}], [EV2.tFire + 0.05, E.anger],
  [EV2.haul, E.fear], [EV2.wrap0, E.effort], [EV2.taut, E.strain], [EV2.crash - 0.05, E.shock], [109.0, E.pant], [110.6, E.alert], [113.3, E.worried], [115.6, E.relief],
];
export const tetherAt = (T: number): CrewOut => {
  const b = bodyAt(TTH_SEGS, T);
  let pose: Pose = layer(BRACED({wide: 0.75}), {armR: {local: {r: 30, u: 240, f: 90}}, armL: {local: {r: -30, u: 220, f: 60}}, handL: 'open'});
  const kneel0 = 1 - ramp(T, 96.1, 96.45);
  if (kneel0 > 0) pose = blendPose(pose, layer(KNEEL('L'), {drop: 80, lean: 10, armR: {local: {r: 40, u: 160, f: 90}}}), kneel0);
  const crouch = Math.max(win(T, 96.3, 99.7, 0.3, 0.15), win(T, 102.6, 105.5, 0.3, 0.3));
  if (crouch > 0) pose = blendPose(pose, layer(pose, {drop: 60, lean: 16}), crouch);
  kneelFeet(b, 'L', kneel0);
  let recoil = 0;
  let muzzle = add3(fromLoc(b, {r: 30, u: 240, f: 90}), mul3({x: fwdOf(b.heading).x, y: 0, z: fwdOf(b.heading).z}, 0.36));
  let handR: V3 | undefined;
  // aim at A (its chest at the bite), fire, the bite; A grabs the cable and hauls: her arms are yanked out
  const aimW = win(T, 105.45, EV2.wrap0 + 0.05, 0.3, 0.15);
  const target = clampTarget(Math.min(T, EV2.tBite));
  if (aimW > 0) {
    const shoulder = fromLoc(b, {r: 36, u: 300, f: 0});
    const d = norm3(sub3(target, shoulder));
    const fr = T > EV2.tFire ? clamp((T - EV2.tFire) / 0.35) : 0;
    recoil = T > EV2.tFire && T < EV2.tFire + 0.35 ? Math.sin(Math.PI * fr) : 0;
    const yank = win(T, EV2.haul, EV2.wrap0 + 0.1, 0.06, 0.1);
    const hR = add3(add3(shoulder, mul3(d, 0.5 + 0.12 * yank)), mul3(d, -0.08 * recoil));
    muzzle = lerp3v(muzzle, add3(hR, add3(mul3(d, 0.38), {x: 0, y: 0.07, z: 0})), aimW);
    const p = layer(AIM_POSE, {
      armR: {local: toLoc(b, hR), pole: {r: 0.6, u: -1, f: 0}, palm: {r: -1, u: 0, f: 0}},
      armL: {local: toLoc(b, add3(add3(hR, mul3(d, -0.18)), {x: 0, y: -0.05, z: 0})), palm: {r: 1, u: 0.3, f: 0}},
      lean: 6 + 18 * yank, drop: 18 + 10 * yank, twist: 14,
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
    pose = blendPose(pose, layer(pose, {drop: 10, lean: 4, armL: {local: {r: -40, u: 230, f: 50}}, head: {pitch: -18}}), wrapW);
    muzzle = lerp3v(muzzle, add3(handR, {x: 0, y: 0.06, z: 0}), wrapW);
  }
  // the reel hauls: braced, leaning back, the launcher held in against the pull; at the crash she turns her face away
  const haul = win(T, EV2.taut, EV2.release, 0.1, 0.35);
  if (haul > 0) {
    const d = norm3(sub3(ANCHOR, fromLoc(b, {r: 36, u: 280, f: 0})));
    const hR = add3(fromLoc(b, {r: 36, u: 280, f: 30}), mul3(d, 0.22));
    pose = blendPose(pose, layer(pose, {
      armR: {local: toLoc(b, hR), pole: {r: 0.6, u: -1, f: 0}, palm: {r: -1, u: 0, f: 0}}, armL: {local: toLoc(b, add3(hR, {x: 0, y: -0.06, z: 0})), palm: {r: 1, u: 0.3, f: 0}},
      lean: -16, drop: 34, twist: 10,
    }), haul);
    muzzle = lerp3v(muzzle, add3(hR, mul3(d, 0.36)), haul);
  }
  const duck = win(T, EV2.crash - 0.08, EV2.crash + 0.7, 0.05, 0.35);
  if (duck > 0) pose = layer(pose, {drop: (pose.drop ?? 0) + 12 * duck, head: {yaw: -45 * duck, pitch: 15 * duck}});
  const lk = lookTrack(T, b, [[94.3, at3(46.55, 1.05, 1.0)], [95.0, MARK_AT, 0.25], [96.1, at3(52.0, -7.0, 1.4), 0.3], [99.7, (t) => unitAttach(unitD2('A', t)).head, 0.25],
    [105.4, (t) => clampTarget(Math.min(t, EV2.tBite)), 0.2], [EV2.wrap0, ANCHOR, 0.15], [EV2.taut - 0.05, (t) => unitAttach(unitD2('A', Math.min(t, EV2.crash))).head, 0.2],
    [EV2.release + 0.1, at3(49.5, -6.5, 1.0), 0.3]]);
  const look = lk.P ?? undefined;
  pose = withLook(pose, lk, 0.9 * (1 - clamp(duck / 0.3)));
  const runArms: Pose = {armR: {local: {r: 26, u: 236, f: 64}}, armL: b.gait?.armL};
  const final = withRun(b, withFace(pose, faceKeys(T, TTH_FACE)), runArms);
  const spool = T > EV2.tFire && T < EV2.reelEnd ? 0.5 + 0.5 * smooth(clamp((T - EV2.release) / (EV2.reelEnd - EV2.release))) : 1;
  const loaded = !(T > EV2.tFire && T < EV2.reelEnd);
  const spec = base('tether', 'd2tth', 3, b, T, {...final, handR: 'grip', handL: final.handL ?? 'open', holdR: tetherLauncher({loaded, recoil}), extra: hipReel(spool)},
    handR && wrapW > 0 ? {handR: lerp3v(fromLoc(b, {r: 30, u: 240, f: 90}), handR, wrapW)} : {}, b.inRun || duck > 0.3 ? undefined : look);
  return {spec, body: b, pts: {muzzle}};
};
/** the clamp on A: its chest plate (the shot leads it to where A will be at the bite) */
export const clampTarget = (T: number): V3 => unitAttach(unitD2('A', T)).chest;

// ================================================================== THE DRONE PILOT (checker)
const P0 = sp('drone');
export const PILOT_AT = {x: 46.0, z: -5.0};
const DRN_SEGS: Seg[] = [
  {kind: 'stand', root: [[94.3, P0.x, P0.z, 250], [103.75, P0.x, P0.z, 250], [104.05, P0.x + 0.05, P0.z - 0.15, 330]]},
  {kind: 'run', path: [{x: P0.x + 0.05, z: P0.z - 0.15}, {x: 45.75, z: 5.4}, {x: 45.55, z: 3.0}, {x: 45.6, z: -1.0}, {x: 45.7, z: -3.6}, PILOT_AT], T0: 104.08, T1: 106.75, gait: GAITS.jog, A: 0.6, D: 0.7},
  {kind: 'stand', root: [[106.75, PILOT_AT.x, PILOT_AT.z, 140], [107.2, PILOT_AT.x, PILOT_AT.z, 100], [116.92, PILOT_AT.x, PILOT_AT.z, 100]], stag: 0.08},
];
const DRN_FACE: [number, Face][] = [
  [94.3, E.pant], [94.8, E.focus], [96.2, E.fear], [97.3, {...E.fear, worry: 1}], [98.3, E.relief], [98.8, E.focus], [104.1, E.effort], [106.8, E.focus],
  [112.6, E.strain], [EV2.shield, E.shock], [113.9, E.worried], [115.5, E.relief],
];
export const droneAt = (T: number, allyPos: V3): CrewOut => {
  const b = bodyAt(DRN_SEGS, T);
  const tense = Math.max(win(T, 112.6, 113.7, 0.25, 0.4), win(T, 96.2, 98.4, 0.3, 0.4) * 0.8);
  let pose: Pose = layer(BRACED({fists: false}), {
    drop: 12 + 16 * tense, lean: 8 + 12 * tense,
    armL: {local: {r: -22, u: 245 + 20 * tense, f: 92 + 30 * tense}}, armR: {local: {r: 22, u: 245 + 20 * tense, f: 92 + 30 * tense}},
  });
  const kneel0 = 1 - ramp(T, 103.75, 104.05);
  if (kneel0 > 0) pose = blendPose(pose, layer(KNEEL('L'), {drop: 82 + 10 * tense, lean: 4 * tense, armL: {local: {r: -20, u: 170, f: 90}}, armR: {local: {r: 20, u: 170, f: 90}}}), kneel0);
  kneelFeet(b, 'L', kneel0);
  const hit = win(T, EV2.shield, EV2.shield + 0.6, 0.03, 0.4);
  if (hit > 0) pose = layer(pose, {drop: (pose.drop ?? 0) + 8 * hit});
  if (ramp(T, 115.4, 116.1) > 0) pose = layer(pose, {breath: 0.7});
  // D coming up the slope at the slab's south end: she looks from the drone's screen to it, then back
  const lk = lookTrack(T, b, [[94.3, allyPos], [96.65, (t) => unitAttach(unitD2('D', t)).head, 0.2], [98.15, allyPos, 0.25]], 80);
  const look = lk.P ?? allyPos;
  pose = withLook(pose, lk);
  const runArms: Pose = {armL: {local: {r: -20, u: 236, f: 84}}, armR: {local: {r: 20, u: 236, f: 84}}};
  const final = withRun(b, withFace(pose, faceKeys(T, DRN_FACE)), runArms);
  const spec = base('drone', 'd2drn', 5, b, T, {...final, handL: 'grip', handR: 'grip', twoHanded: true, extra: controller({lit: 1})}, {}, b.inRun ? undefined : look);
  return {spec, body: b};
};

// ================================================================== THE FLARE CARRIER (host)
const F0 = sp('flares');
const FLR_SPOT = {x: F0.x + 0.1, z: F0.z - 0.05};
export const FLR_END = {x: 47.9, z: -3.1};
const FLR_SEGS: Seg[] = [
  {kind: 'stand', root: [[94.3, F0.x, F0.z, 270], [94.42, F0.x, F0.z, 270], [94.74, FLR_SPOT.x, FLR_SPOT.z, 46], [95.32, FLR_SPOT.x, FLR_SPOT.z, 52], [95.9, FLR_SPOT.x, FLR_SPOT.z + 0.05, 60], [113.0, FLR_SPOT.x, FLR_SPOT.z + 0.05, 60], [113.22, FLR_SPOT.x - 0.1, FLR_SPOT.z - 0.1, 345]], stag: 0.12},
  {kind: 'run', path: [{x: FLR_SPOT.x - 0.1, z: FLR_SPOT.z - 0.1}, {x: 46.0, z: 3.2}, {x: 45.95, z: -0.5}, {x: 46.8, z: -2.4}, FLR_END], T0: 113.25, T1: 115.85, gait: GAITS.jog, A: 0.6, D: 0.7},
  {kind: 'stand', root: [[115.85, FLR_END.x, FLR_END.z, 120], [116.35, FLR_END.x, FLR_END.z, 95], [116.92, FLR_END.x, FLR_END.z, 95]]},
];
/** one canister throw: k (THROW's keys: 0.4 wind, 0.62 release, 0.8 follow) mapped around a release time */
const throwK = (T: number, rel: number) => {
  const K: [number, number][] = [[rel - 0.36, 0], [rel - 0.12, 0.4], [rel, 0.62], [rel + 0.12, 0.8], [rel + 0.36, 1]];
  if (T <= K[0][0]) return 0;
  for (let i = 1; i < K.length; i++) if (T <= K[i][0]) return lerp(K[i - 1][1], K[i][1], (T - K[i - 1][0]) / (K[i][0] - K[i - 1][0]));
  return 1;
};
const FLR_FACE: [number, Face][] = [[94.3, E.pant], [94.4, E.effort], [95.5, E.focus], [96.4, E.alert], [97.2, E.anger], [98.1, E.recog], [98.6, E.focus], [113.25, E.effort], [115.9, E.pant]];
export const flaresAt = (T: number): CrewOut => {
  const b = bodyAt(FLR_SEGS, T);
  let pose: Pose = layer(BRACED({wide: 0.75, fists: false}), {});
  // up off the knee for the throws, back down after; up again to run at 113
  const kneel = (1 - ramp(T, 94.42, 94.7)) + ramp(T, 95.45, 95.95) - ramp(T, 112.95, 113.2);
  if (kneel > 0) pose = blendPose(pose, layer(KNEEL('R'), {drop: 80}), clamp(kneel));
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
  // kneeling by the slab after: up on one knee as D comes, a hand on the satchel flap (a flare ready)
  const wary = win(T, 96.5, 98.3, 0.3, 0.3);
  if (wary > 0) pose = blendPose(pose, layer(pose, {drop: 60, lean: 6, armL: {local: {r: -40, u: 170, f: 20}}, handL: 'grip'}), wary);
  const lk = lookTrack(T, b, [[94.3, at3(53.6, -1.0, 0.5)], [95.6, SMOKE_EYE, 0.25], [96.4, (t) => unitAttach(unitD2('D', t)).head, 0.2], [98.2, figEye, 0.25],
    [113.0, at3(47.4, -4.5, 1.4), 0.25], [115.5, at3(48.8, -6.6, 1.2), 0.3]]);
  const look = lk.P ?? undefined;
  pose = withLook(layer(pose, flinch(T, BLAST, 0.5)), lk);
  const runArms: Pose = {armL: b.gait?.armL, armR: b.gait?.armR};
  const final = withRun(b, withFace(pose, faceKeys(T, FLR_FACE)), runArms);
  const holding = (T > EV2.draw1 + 0.08 && T < EV2.rel1) || (T > EV2.draw2 + 0.08 && T < EV2.rel2);
  const spec = base('flares', 'd2flr', 9, b, T, {...final, handR: holding ? 'grip' : final.handR ?? 'open', holdR: holding ? canister() : undefined}, {}, b.inRun ? undefined : look);
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
    [112.32, DEC_KNEEL.x, DEC_KNEEL.z, 75], [112.55, DEC_UP.x, DEC_UP.z, 88], [112.68, DEC_UP.x, DEC_UP.z, 88], [112.98, DEC_UP.x - 0.1, DEC_UP.z - 0.1, 330]], stag: 0.06},
  {kind: 'run', path: [{x: DEC_UP.x - 0.1, z: DEC_UP.z - 0.1}, {x: 45.6, z: 2.4}, {x: 45.25, z: -1.0}, DEC_END], T0: 113.0, T1: 115.5, gait: GAITS.jog, A: 0.6, D: 0.7},
  {kind: 'stand', root: [[115.5, DEC_END.x, DEC_END.z, 140], [116.1, DEC_END.x, DEC_END.z, 80], [116.92, DEC_END.x, DEC_END.z, 80]]},
];
/** the tablet is in her hands before EV2.place and after it is taken down (112.55) */
export const tabletInHand = (T: number) => T < EV2.place || T > 112.55;
const DEC_FACE: [number, Face][] = [[94.3, E.pant], [95.0, E.recog], [95.4, E.focus], [96.55, {...E.focus, worry: 0.6}], [97.3, E.resolve], [97.95, E.focus], [98.1, E.recog], [98.6, E.focus], [112.3, E.effort], [115.6, E.relief]];
export const decoyAt = (T: number): CrewOut => {
  const b = bodyAt(DEC_SEGS, T);
  let pose: Pose = layer(BRACED({wide: 0.6, fists: false}), {drop: 10, lean: 6, armL: {local: {r: -28, u: 215, f: 92}, pole: {r: -1, u: -0.7, f: 0}, palm: {r: 0.4, u: 0.3, f: -1}}, handR: 'open'});
  const kneel = (1 - ramp(T, 97.34, 97.66)) + ramp(T, 98.02, 98.4) - ramp(T, 112.3, 112.52);
  if (kneel > 0) pose = blendPose(pose, layer(KNEEL('L'), {drop: 82, lean: 4, armL: {local: {r: -26, u: 180, f: 90}, palm: {r: 0.4, u: 0.3, f: -1}}}), clamp(kneel));
  kneelFeet(b, 'L', clamp(kneel));
  // the sketch (the insert): tablet at her chest, the right index finger drawing, eyes down on it; a glance up at the
  // drone's beam as it passes over (96.55)
  const sk = win(T, 95.3, 97.5, 0.18, 0.12);
  if (sk > 0) pose = blendPose(pose, layer(KNEEL('L'), SKETCH(T, 1.2), {drop: 82}), sk);
  // up on her toes, the tablet set on the slab's top edge, the projector switched on; then down again watching
  let world: {handL?: V3; handR?: V3} = {};
  const up = win(T, 97.48, 98.12, 0.12, 0.24);
  if (up > 0) {
    const place = clamp((T - 97.5) / (EV2.place - 97.5));
    const hL = lerp3v(fromLoc(b, {r: -28, u: 230, f: 96}), add3(TABLET_AT, {x: -0.06, y: -0.07, z: 0.1}), easeOut(place));
    const tap = win(T, 97.7, 97.95, 0.08, 0.08);
    const hR = lerp3v(lerp3v(fromLoc(b, {r: 30, u: 220, f: 80}), add3(TABLET_AT, {x: -0.06, y: -0.06, z: -0.1}), easeOut(place)), add3(LENS_AT, {x: -0.04, y: 0.0, z: 0.02}), tap);
    world = {handL: hL, handR: hR};
    pose = blendPose(pose, layer(STAND, {drop: -6, lean: 4, head: {pitch: -26}, handR: 'point', handL: 'open'}), up);
  }
  const down = win(T, 112.28, 112.95, 0.1, 0.22);
  if (down > 0) {
    const take = clamp((T - 112.33) / 0.22);
    const into = lerp3v(fromLoc(b, {r: -28, u: 215, f: 92}), add3(TABLET_AT, {x: -0.06, y: -0.07, z: 0.1}), smooth(take) * (1 - smooth(clamp((T - 112.58) / 0.3))));
    world = {handL: into};
    pose = blendPose(pose, layer(STAND, {drop: -4, lean: 4, head: {pitch: -20}}), down);
  }
  const glance = win(T, 96.5, 96.95, 0.08, 0.15);
  const lk = lookTrack(T, b, [[94.3, at3(46.55, 6.05, 1.0)], [95.3, null, 0.2], [96.55, MARK_AT, 0.12], [96.85, null, 0.15], [97.5, TABLET_AT, 0.15], [98.0, figEye, 0.25],
    [112.3, TABLET_AT, 0.2], [113.0, at3(47.3, -5, 1.2), 0.25], [115.6, at3(48.8, -6.8, 1.0), 0.3]]);
  const look = lk.w > 0.5 ? lk.P : null;
  pose = withLook(layer(pose, flinch(T, BLAST, 0.6)), lk);
  const runArms: Pose = {armL: {local: {r: -26, u: 232, f: 70}}, armR: b.gait?.armR};
  const final = withRun(b, withFace(pose, {...faceKeys(T, DEC_FACE), ...(sk > 0.5 && glance < 0.5 ? {lookY: 0.8} : {})}), runArms);
  const sketch = clamp((T - EV2.sketch) / EV2.sketchDur);
  const inHand = tabletInHand(T);
  const spec = base('decoy', 'd2dec', 6, b, T, {...final, handL: inHand ? 'grip' : final.handL ?? 'open', handR: sk > 0.5 ? 'point' : final.handR ?? 'open',
    holdL: inHand ? tablet({screen: true, sketch: T > EV2.tap ? 1 : sketch, figures: 4, glow: T > EV2.tap && T < EV2.place ? 0.6 : 0.2}) : undefined}, world, look && !b.inRun && !(sk > 0.5) ? look : undefined);
  return {spec: blendWorld(spec, Math.max(up, down)), body: b};
};

export const CREW_ROLES = ['director', 'breaker', 'tether', 'runner', 'drone', 'flares', 'decoy'] as const;

[DIR_SEGS, BRK_SEGS, RUN_SEGS, TTH_SEGS, DRN_SEGS, FLR_SEGS, DEC_SEGS].forEach(joinHeadings);

// ------------------------------------------------------------------ the machines' aims (bodies and tools only)
setAim({
  plate: (T) => dirCore(T).plate,
  head: (T) => dirCore(T).head,
  dirHead: (T) => add3(bodyAt(DIR_SEGS, T).pos, {x: 0, y: 1.6, z: 0}),
  breaker: (T) => brkCore(T).chest,
  brkTip: (T) => brkCore(T).tip,
  bar: (T) => { const c = runCore(T); return lerp3v(c.bar.back, c.bar.front, 0.6); },
  chest: (T) => { const t = Math.min(T, EV2.catch + 0.5); return runCore(t).chest; },
});

// ------------------------------------------------------------------ blending in from D1 (the first 0.45 s)
const SOLVE_VIEW = makeView({pos: {x: 40, y: 3, z: 3}, target: {x: 47, y: 1, z: 3}, fov: 40});
/** a spec part way from a to b (pose blended, world targets lerped; props switch at the middle) */
export const towardSpec = (a: FigSpec, b: FigSpec, w: number): FigSpec => {
  if (w <= 0) return a;
  if (w >= 1) return b;
  const pa = (typeof a.pose === 'function' ? {} : a.pose ?? {}) as Pose, pb = (typeof b.pose === 'function' ? {} : b.pose ?? {}) as Pose;
  const Ra = figureRig(SOLVE_VIEW, a), Rb = figureRig(SOLVE_VIEW, b);
  const wa = a.world ?? {}, wb = b.world ?? {};
  const ankle = (R: ReturnType<typeof figureRig>, i: 0 | 1) => R.W(R.rig.ankle[i]);
  const L = (x: V3 | undefined, y: V3 | undefined, fx: V3, fy: V3) => lerp3v(x ?? fx, y ?? fy, w);
  const pose = blendPose(pa, pb, w);
  const ga = a.gaze, gb = b.gaze;
  return {
    ...(w < 0.5 ? a : b), pos: lerp3v(a.pos, b.pos, w), heading: a.heading + wrapD(b.heading - a.heading) * w,
    pose: {...pose, holdL: w < 0.5 ? pa.holdL : pb.holdL, holdR: w < 0.5 ? pa.holdR : pb.holdR, extra: w < 0.5 ? pa.extra : pb.extra, wearL: w < 0.5 ? pa.wearL : pb.wearL, twoHanded: w < 0.5 ? pa.twoHanded : pb.twoHanded, dmg: pb.dmg},
    world: {
      handL: L(wa.handL, wb.handL, Ra.handL, Rb.handL), handR: L(wa.handR, wb.handR, Ra.handR, Rb.handR),
      footL: L(wa.footL, wb.footL, ankle(Ra, 0), ankle(Rb, 0)), footR: L(wa.footR, wb.footR, ankle(Ra, 1), ankle(Rb, 1)),
    },
    gaze: ga && gb ? lerp3v(ga, gb, w) : gb ?? ga, gazeW: 0.85,
  };
};

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
void [SHIELD_AT, D_UP, aCablePt, bRoot, M];
