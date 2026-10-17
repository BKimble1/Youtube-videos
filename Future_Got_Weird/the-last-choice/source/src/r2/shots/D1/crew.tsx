// Section D1: the Crew as functions of FILM time T (world metres). Every shot samples the same choreography, so
// positions hold across cuts. Runs use gaitW on groundH (planted feet); between runs each person stands on a keyed
// root with planted steps (motion.autoSteps) or explicit footholds (the Director's skid at BR1). Tool contacts are
// solved to world points on the machines (unitAttach) and become world hand targets.
import {V3, add3, sub3, mul3, norm3, len3, lerp, clamp, smooth, easeOut, easeIn} from '../../../kit/math';
import {
  FigSpec, FigFrame, Pose, keyPose, blendPose, layer, lookR2, dmgR2, toolsR2, gaitW, GaitW, BRACED, BLOCK_MID, BASH, CHARGE_POSE, AIM, FIRE_RECOIL, THROW, PRY, KNEEL,
  plateWear, tetherLauncher, hipReel, tablet, breaker, controller, halligan1, halligan2, flare as flareHold, Role2, Part, Rig2, PlateState,
} from '../../rig';
import type {FigProps} from '../../rig';
import {unitAttach} from '../../mech';
import {M} from '../../timing';
import {XZ, KP, KR, G, onG, rel, keyRoot, keyN, footAt, autoSteps, runDist, runSpeed, cruise, pathLen, fwdOf, rightOf, headingTo, wrapD, win, after} from './motion';
import {EV, unitD1} from './machines';

// ------------------------------------------------------------------ helpers
type Seg =
  | {kind: 'run'; path: XZ[]; T0: number; T1: number; gait: GaitW; A?: number; D?: number}
  | {kind: 'stand'; root: KR[]; feet?: {L: KP[]; R: KP[]}; stag?: number};

const GAITS = {
  dir: {stride: 2.1, duty: 0.34, lift: 0.17, bob: 10, armAmp: 40, lean: 15} as GaitW,
  heavy: {stride: 1.95, duty: 0.37, lift: 0.14, bob: 9, armAmp: 6, lean: 13} as GaitW,
  run: {stride: 2.0, duty: 0.35, lift: 0.16, bob: 10, armAmp: 40, lean: 14} as GaitW,
  fast: {stride: 2.1, duty: 0.32, lift: 0.18, bob: 11, armAmp: 48, lean: 17} as GaitW,
  hurry: {stride: 1.5, duty: 0.46, lift: 0.1, bob: 7, armAmp: 22, lean: 9} as GaitW,
  push: {stride: 1.1, duty: 0.55, lift: 0.06, bob: 4, armAmp: 0, lean: 26} as GaitW,
};

type Body = {pos: V3; heading: number; footL: V3; footR: V3; gait?: Pose; runK: number; seg: number; inRun: boolean};

/** sample a timeline of runs and stands (feet planted; a run starts from the stance and settles into the next) */
const bodyAt = (segs: Seg[], T: number): Body => {
  // find the active segment
  let i = 0;
  for (let k = 0; k < segs.length; k++) {
    const s = segs[k];
    const a = s.kind === 'run' ? s.T0 : s.root[0][0];
    if (T >= a) i = k;
  }
  const s = segs[i];
  if (s.kind === 'run') {
    const L = pathLen(s.path);
    const A = s.A ?? 1.0, D = s.D ?? 0.6;
    const end = T >= s.T1 && D > 0;
    const d = runDist(Math.min(T, s.T1 + (D > 0 ? 0 : 0.6)), s.T0, s.T1, L, A, D);
    const g = gaitW(s.path, Math.min(d, L + 0.6), s.gait, G);
    const v = runSpeed(T, s.T0, s.T1, L, A, D);
    const k = clamp(v / cruise(s.T0, s.T1, L, A, D));
    // push-off: blend the feet from the previous stance into the gait over the first 0.3 s
    let fl = g.footL, fr = g.footR;
    const prev = segs[i - 1];
    if (prev && prev.kind === 'stand') {
      const pb = standAt(prev, s.T0);
      const w = smooth(clamp((T - s.T0) / 0.32));
      fl = mixFoot(pb.footL, fl, w); fr = mixFoot(pb.footR, fr, w);
    }
    void end;
    return {pos: g.pos, heading: g.heading, footL: fl, footR: fr, gait: g.pose, runK: k, seg: i, inRun: true};
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
const standAt = (s: Extract<Seg, {kind: 'stand'}>, T: number): Body => {
  const r = keyRoot(s.root, T);
  const feet = s.feet ?? autoSteps(s.root, {stepLen: 0.5, half: 0.15, stag: s.stag ?? 0.12});
  const fl = footAt(feet.L, T, 0.1), fr = footAt(feet.R, T, 0.1);
  return {pos: onG(r.p.x, r.p.z), heading: r.h, footL: fl, footR: fr, runK: 0, seg: 0, inRun: false};
};
const runEnd = (path: XZ[]): {x: number; z: number; h: number} => {
  const a = path[path.length - 2], b = path[path.length - 1];
  return {x: b.x, z: b.z, h: headingTo(a, b)};
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
const extras = (...fs: (((r: Rig2) => Part[]) | undefined)[]) => (r: Rig2) => fs.flatMap((f) => (f ? f(r) : []));
const gaitArms = (g?: Pose): Pose => (g ? {armL: g.armL, armR: g.armR} : {});
/** run pose: the gait's body (drop, lean, bob) plus role arms, faded into the stance pose by runK */
const withRun = (b: Body, stance: Pose, runArms: Pose): Pose => {
  if (!b.gait || b.runK <= 0.001) return stance;
  const run = layer(b.gait, runArms, {face: {mouth: 'grit', brows: -0.6}});
  return blendPose(stance, run, b.runK);
};

export type CrewOut = {spec: FigSpec; body: Body; pts?: Record<string, V3>};
/** where each of them ends up crouched behind the cover slab (D1-9), for eye-lines between them */
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
/** BREATH eye-lines: [from, to, who] — whose face each person looks at, when */
const LOOKS: Record<string, [number, number, V3][]> = {
  director: [[91.6, 92.5, headAt('breaker')], [92.5, 93.3, headAt('tether')], [93.3, 93.9, onG(46.8, 2.75, 0.75)], [93.9, 95, headAt('decoy')]],
  breaker: [[91.85, 93.2, headAt('director')], [93.2, 95, onG(48.6, 3.5, 2.6)]],
  tether: [[91.9, 92.5, onG(49, 1.0, 2.2)], [92.5, 93.8, headAt('director')], [93.8, 95, headAt('runner')]],
  runner: [[91.5, 93.0, onG(50, -0.5, 1.4)], [93.0, 95, headAt('tether')]],
  decoy: [[91.2, 92.2, onG(48.5, 6.0, 2.0)], [92.2, 93.6, headAt('director')], [93.6, 95, headAt('drone')]],
  drone: [[92.5, 93.4, onG(45.4, 5.8, 4.0)], [93.4, 95, headAt('decoy')]],
  flares: [[91.85, 93.0, onG(49.5, 6.5, 2.4)], [93.0, 95, headAt('director')]],
};
const breathLook = (who: string, b: {pos: V3; heading: number}, T: number): {yaw: number; pitch: number; w: number} | null => {
  const L = LOOKS[who];
  if (!L) return null;
  for (const [a, e, p] of L) if (T >= a && T < e) {
    const w = win(T, a, e, 0.22, 0.18);
    return {yaw: lookYaw(b, p, 85), pitch: lookPitch(b, p, 1.05), w};
  }
  return null;
};
const withLook = (pose: Pose, who: string, b: {pos: V3; heading: number}, T: number): Pose => {
  const l = breathLook(who, b, T);
  if (!l) return pose;
  const h = pose.head ?? {};
  return {...pose, head: {yaw: lerp(h.yaw ?? 0, l.yaw, l.w), pitch: lerp(h.pitch ?? 0, l.pitch, l.w), roll: h.roll}};
};
const base = (role: Role2, key: string, seed: number, b: Body, T: number, pose: Partial<FigProps>, world: {handL?: V3; handR?: V3} = {}): FigSpec => ({
  key, look: lookR2(role), t: T, seed, pos: b.pos, heading: b.heading,
  pose: {...pose, dmg: dmgR2(role, T)},
  world: {footL: b.footL, footR: b.footR, ...world},
});

// ================================================================== THE DIRECTOR (clerkC, plate on the left forearm)
const DIR_RUN: XZ[] = [{x: 1.6, z: 1.4}, {x: 4.2, z: 4.3}, {x: 7.0, z: 5.7}, {x: 11.5, z: 5.2}, {x: 20, z: 2.4}, {x: 30, z: 0.3}, {x: 41.25, z: -0.7}];
const D_FIGHT: KR[] = [
  [EV.clash, 41.25, -0.7, 90], [68.62, 41.05, -0.72, 90], [69.6, 40.75, -0.75, 90],
  [EV.u1jab, 40.75, -0.75, 90], [70.72, 40.6, -0.76, 90], [71.0, 40.75, -0.75, 90], [EV.bash1, 40.95, -0.74, 90], [71.9, 40.72, -0.75, 90],
  [73.0, 40.72, -0.75, 90], [74.3, 40.68, -0.5, 84], [76.2, 40.7, -0.72, 90], [78.2, 40.65, -0.75, 90],
];
const BR1_P = {x: 40.65, z: -0.75};
const SKID = 0.56; // metres he is driven back on his heels at BR1
/** the Director's footholds through BR1: planted guard → heel skid (no lift) → re-plant → recover */
const dirFeetBR1 = (() => {
  const st = autoSteps(D_FIGHT, {stepLen: 0.45, half: 0.15, stag: 0.16});
  const L0 = st.L[st.L.length - 1], R0 = st.R[st.R.length - 1];
  const t = EV.br1;
  // skid: both heels driven back (slide, decelerating), the rear foot a touch further
  st.L.push([t + 0.005, L0[1], L0[2]], [t + 0.3, L0[1] - SKID, L0[2] - 0.02, 0]);
  st.R.push([t + 0.005, R0[1], R0[2]], [t + 0.33, R0[1] - SKID - 0.06, R0[2] + 0.02, 0]);
  // re-plant: the rear (right) foot steps back and wide to catch him, then the left settles
  st.R.push([t + 0.36, R0[1] - SKID - 0.06, R0[2] + 0.02], [t + 0.58, R0[1] - SKID - 0.3, R0[2] + 0.1]);
  st.L.push([t + 0.52, L0[1] - SKID, L0[2] - 0.02], [t + 0.74, L0[1] - SKID - 0.04, L0[2] - 0.04]);
  return st;
})();
const D_AFTER: KR[] = [
  [EV.br1 + 0.75, BR1_P.x - SKID - 0.1, -0.76, 90], [80.7, 40.12, -0.77, 90], [81.0, 40.12, -0.77, 90], [81.65, 39.6, 0.15, 76],
  [83.3, 39.6, 0.15, 50], [84.55, 39.6, 0.15, 62], [85.45, 41.5, -0.88, 90], [85.72, 41.5, -0.88, 90],
];
const D_CHARGE: XZ[] = [{x: 41.5, z: -0.88}, {x: 43.32, z: -0.95}, {x: 45.35, z: -1.0}]; // charge, contact at 43.32, drive
const D_DRIVE: KR[] = [
  [EV.br4Fall, 45.35, -1.0, 90], [87.4, 45.7, -0.98, 92], [88.2, 45.62, -0.98, 90], [89.8, 45.62, -0.98, 90],
  [91.0, 46.6, 2.5, 160], [91.45, 46.8, 2.75, 270], [94.3, 46.8, 2.75, 270],
];
const DIR_SEGS: Seg[] = [
  {kind: 'run', path: DIR_RUN, T0: M.CHARGE, T1: EV.clash, gait: GAITS.dir, A: 1.0, D: 0},
  {kind: 'stand', root: [...D_FIGHT, [EV.br1, BR1_P.x, BR1_P.z, 90], [EV.br1 + 0.32, BR1_P.x - SKID + 0.02, -0.76, 91], ...D_AFTER], feet: undefined},
  {kind: 'run', path: D_CHARGE, T0: 85.72, T1: EV.br4Fall, gait: GAITS.dir, A: 0.38, D: 0.25},
  {kind: 'stand', root: D_DRIVE},
];
// explicit feet for the fight stand (guard, skid, re-plant, recover): the footholds after the skid continue the steps
(() => {
  const st = dirFeetBR1;
  const after = autoSteps(D_AFTER, {stepLen: 0.45, half: 0.15, stag: 0.16});
  // join: hold the re-planted feet until D_AFTER's first step
  const L = [...st.L], R = [...st.R];
  after.L.slice(1).forEach((k) => L.push(k));
  after.R.slice(1).forEach((k) => R.push(k));
  (DIR_SEGS[1] as Extract<Seg, {kind: 'stand'}>).feet = {L, R};
})();

/** The plate guard (left wrist target, body-local rig units) and the plate's world centre for a given guard. */
const GUARD = {r: 6, u: 345, f: 112};
const plateFromGuard = (b: {pos: V3; heading: number}, g: {r: number; u: number; f: number}): V3 => {
  // plate ≈ 45% of the forearm below the wrist (forearm near vertical in the block), pushed out by its thickness
  const w = fromLoc(b, g);
  const f = fwdOf(b.heading);
  return {x: w.x + f.x * 0.05, y: w.y - 0.15, z: w.z + f.z * 0.05};
};

export const directorAt = (T: number): CrewOut => {
  const b = bodyAt(DIR_SEGS, T);
  const plate: PlateState = T >= EV.br1 ? (toolsR2('director', T).plate === 'intact' ? 'dented' : toolsR2('director', T).plate!) : 'intact';
  const glint = Math.max(win(T, EV.br1, EV.br1 + 0.16, 0.01, 0.12), win(T, EV.u1jab, EV.u1jab + 0.12, 0.01, 0.1) * 0.7);
  // guard and actions (body-local hand targets so the plate holds its place from any camera)
  let guard = {...GUARD};
  let pose: Pose = layer(BRACED({wide: 0.8}), {armL: {local: guard, pole: {r: -1, u: -0.7, f: 0.1}, palm: {r: -0.55, u: 0.1, f: -1}}, handL: 'fist', face: {mouth: 'grit', brows: -0.6}});
  // the clash: BASH as he arrives (anticipation over the last strides), absorb, settle
  const bashIn = clamp((T - (EV.clash - 0.42)) / 0.42);
  const bashOut = after(T, EV.clash + 0.12, 0.6);
  if (T > EV.clash - 0.45 && T < 70) pose = blendPose(pose, layer(BASH(1), {drop: 26}), easeIn(bashIn) * (1 - bashOut));
  // U1's first blow glances off the plate (no dent): the arm gives, then resets
  const jab = win(T, EV.u1jab - 0.02, EV.u1jab + 0.4, 0.05, 0.3);
  // his bash at 71.25
  const bashK = T > 70.85 && T < 71.9 ? (T < EV.bash1 ? smooth((T - 70.85) / 0.4) : 1 - smooth((T - EV.bash1 - 0.1) / 0.55)) : 0;
  if (bashK > 0) pose = blendPose(pose, BASH(bashK), bashK);
  // BR1: braced for the swing (he sees it coming: the plate comes up and in, weight forward), the blow, the skid
  const br1In = smooth(clamp((T - 78.55) / 0.35)) * (1 - after(T, EV.br1 + 0.6, 0.5));
  // the plate is driven back with the fist (it rides the follow-through for 0.06 s), then he absorbs it
  const hit = T < EV.br1 ? 0 : T < EV.br1 + 0.06 ? (T - EV.br1) / 0.06 : Math.exp(-(T - EV.br1 - 0.06) * 3.2);
  const skidK = T >= EV.br1 ? clamp((T - EV.br1) / 0.3) : 0;
  guard = {
    r: GUARD.r - 4 * br1In,
    u: GUARD.u + 8 * br1In - 14 * hit,
    f: GUARD.f - 6 * br1In - 30 * hit - 26 * jab,
  };
  const recov = after(T, EV.br1 + 0.65, 0.9);
  if (T > 78.4 && T < 82) {
    const lean = lerp(12 * br1In, -14, hit * (1 - recov));
    pose = layer(pose, {
      drop: 26 + 10 * br1In + 22 * hit * (1 - recov) + 10 * skidK * (1 - recov),
      lean, twist: -12 * br1In,
      head: {pitch: 4 + 10 * hit, yaw: -8 * hit},
      legL: {pitch: -22 * win(T, EV.br1, EV.br1 + 0.4, 0.04, 0.15)}, legR: {pitch: -16 * win(T, EV.br1, EV.br1 + 0.38, 0.04, 0.15)},
      face: {mouth: hit > 0.3 ? 'pain' : 'grit', brows: -0.8, squint: 0.4 + 0.5 * hit},
      breath: 0.7,
    });
  }
  // after BR1: a glance down at the plate (the dent), then up again
  const glance = win(T, 80.25, 81.15, 0.25, 0.3);
  // BR4 charge: tuck the plate, shoulder first; drive; stumble on the crest; stand in the gap, breathing
  const chg = T > 85.4 && T < EV.br4Fall + 0.3 ? smooth(clamp((T - 85.4) / 0.35)) * (1 - after(T, EV.br4Fall, 0.35)) : 0;
  if (chg > 0) pose = blendPose(pose, layer(CHARGE_POSE, {drop: 30 + 14 * win(T, EV.br4, EV.br4Fall, 0.05, 0.1), lean: 32}), chg);
  const stumble = win(T, EV.br4Fall, 88.1, 0.12, 0.6);
  if (stumble > 0) pose = blendPose(pose, layer(BRACED({wide: 0.9}), {drop: 40, lean: 30, armR: {local: {r: 40, u: 120, f: 70}}, handR: 'brace', face: {mouth: 'pant', brows: -0.3}, head: {pitch: 10}}), stumble);
  // the gap, then the slab: crouch with his back to it, panting, plate dented
  const crouch = after(T, 91.3, 0.55);
  if (crouch > 0) pose = blendPose(pose, layer(KNEEL('R'), {drop: 70, lean: -6, armL: {local: {r: -30, u: 200, f: 60}, palm: {r: 0.4, u: 0.2, f: -1}}, armR: {local: {r: 52, u: 120, f: 70}}, handL: 'fist', handR: 'relaxed', face: {mouth: 'pant', brows: 0.1, worry: 0.2}, breath: 0.9}), crouch);
  kneelFeet(b, 'R', crouch);
  // eyes/head
  const u1 = unitAttach(unitD1('U1', T));
  const u3 = unitAttach(unitD1('U3', T));
  const tgt = T < 82 ? u1.head : T < 84.3 ? add3(u1.chest, {x: 0, y: 0.2, z: 0}) : T < 89.8 ? u3.head : {x: 46.4, y: 1.9, z: 3.7};
  const hy = lookYaw(b, tgt, 75), hp = lookPitch(b, tgt);
  pose = layer(pose, {head: {yaw: lerp(hy, -20, glance), pitch: lerp(hp, 30, glance), roll: 0}, face: {...(pose.face ?? {}), lookY: 0.7 * glance}});
  // the plate arm: body-local guard (holds against any camera) except during the run, the charge, the crouch
  const guardOn = (T > EV.clash - 0.6 ? 1 : 0) * (1 - chg) * (1 - crouch) * (1 - stumble * 0.6) * (T < 91.0 ? 1 : 1 - after(T, 90.6, 0.5));
  const arm = blendPose(pose, layer(pose, {armL: {local: guard, pole: {r: -1, u: -0.7, f: 0.1}, palm: {r: -0.55, u: 0.1, f: -1}}}), guardOn);
  const runArms: Pose = b.seg === 2
    ? {armL: CHARGE_POSE.armL, armR: CHARGE_POSE.armR, lean: 38, drop: 40, twist: -34, handL: 'fist', handR: 'fist', face: {mouth: 'grit', brows: -1}}
    : {armL: {local: {r: -6, u: 268, f: 96}, pole: {r: -1, u: -0.6, f: 0}, palm: {r: 0.3, u: 0, f: -1}}, armR: b.gait?.armR, handL: 'fist', handR: 'fist'};
  const final = withRun(b, withLook(arm, 'director', b, T), runArms);
  const spec = base('director', 'd1dir', 11, b, T, {...final, handL: 'fist', handR: final.handR ?? 'fist', wearL: plateWear(plate, {glint})});
  const plateW = plateFromGuard(b, guard);
  return {spec, body: b, pts: {plate: plateW}};
};
/** the plate's world centre at T (where blows land), from his guard */
export const directorPlate = (T: number) => directorAt(T).pts!.plate;

// ================================================================== THE BREAKER (honest)
const BRK_RUN: XZ[] = [{x: 0.9, z: 3.4}, {x: 4.0, z: 5.6}, {x: 7.2, z: 6.8}, {x: 12.5, z: 7.0}, {x: 17.5, z: 8.4}, {x: 27, z: 7.2}, {x: 39.6, z: 3.25}];
const BRK_STAND: KR[] = [
  [68.45, 39.6, 3.25, 76], [69.2, 39.6, 3.25, 76], [69.52, 39.32, 2.62, 66], [70.3, 39.5, 2.95, 76], [71.6, 39.62, 3.05, 78],
  [EV.knee + 0.4, 39.62, 3.05, 78], [73.6, 39.2, 2.85, 74], [76.5, 39.2, 2.85, 70], [79.4, 38.75, 2.5, 62], [80.5, 38.75, 2.5, 52],
];
// he rushes in on U1 as the Director gives ground (80.5 → 81.28), strikes, then backs off
const BRK_IN: XZ[] = [{x: 38.75, z: 2.5}, {x: 40.6, z: 1.7}, {x: 41.95, z: 0.14}];
const BRK_STAND2: KR[] = [
  [81.28, 41.95, 0.14, 338], [EV.br2 + 0.45, 41.95, 0.14, 338], [83.0, 41.75, 1.2, 330], [84.0, 41.3, 1.7, 340], [85.2, 40.5, 1.9, 70], [88.7, 41.0, 1.75, 72],
  [90.0, 43.5, 1.0, 80], [90.75, 45.3, 0.25, 90], [91.3, 46.45, 0.6, 160], [91.8, 46.8, 3.65, 270], [94.3, 46.8, 3.65, 270],
];
const BRK_SEGS: Seg[] = [
  {kind: 'run', path: BRK_RUN, T0: M.CHARGE + 0.15, T1: 68.45, gait: GAITS.heavy, A: 1.1, D: 0.7},
  {kind: 'stand', root: BRK_STAND, stag: 0.14},
  {kind: 'run', path: BRK_IN, T0: 80.5, T1: 81.28, gait: GAITS.heavy, A: 0.3, D: 0.3},
  {kind: 'stand', root: BRK_STAND2, stag: 0.14},
];
/** the breaker's swing as world hand keys solved around a tip target: wind-up overhead → strike (tip on target) → recoil */
const swingHands = (b: {pos: V3; heading: number}, tip: V3, k: number) => {
  const chest = fromLoc(b, {r: 0, u: 300, f: 20});
  const d = norm3(sub3(tip, chest));
  const TIP = 144 / 251.4, BACK = 0.44;
  // strike: tool along d, tip at the target
  const fS = sub3(tip, mul3(d, TIP)), bS = sub3(fS, mul3(d, BACK));
  // ready (port): tool angled up across the body
  const fR = fromLoc(b, {r: -16, u: 250, f: 118}), bR = fromLoc(b, {r: 32, u: 205, f: 34});
  // wind-up: raised high over the right shoulder, ram pointing back-up
  const fW = fromLoc(b, {r: 14, u: 430, f: -6}), bW = fromLoc(b, {r: 30, u: 360, f: -70});
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
const lerp3v = (a: V3, b: V3, k: number): V3 => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k)});
/** swing phase k (0..1, contact at 0.55) for a strike landing at tc that winds up from tw */
const swingK = (T: number, tw: number, tc: number, tEnd: number) => (T < tw ? 0 : T < tc ? 0.55 * ((T - tw) / (tc - tw)) : T < tEnd ? 0.55 + 0.45 * ((T - tc) / (tEnd - tc)) : 1);

export const breakerAt = (T: number): CrewOut => {
  const b = bodyAt(BRK_SEGS, T);
  const gauge = toolsR2('breaker', T).gauge ?? 1;
  // knee strike on U4 (72.0 → 72.45 → 72.95), chest strike on U1 (81.34 → 81.78 → 82.3)
  const knee = T > 71.95 && T < 73.0;
  const chest = T > 81.3 && T < 82.4;
  let hands: {front: V3; back: V3} | null = null;
  let k = 0;
  if (knee) {
    k = swingK(T, 72.0, EV.knee, 72.95);
    const tip = unitAttach(unitD1('U4', EV.knee)).kneeL;
    hands = swingHands(b, add3(tip, {x: -0.04, y: 0.02, z: 0}), k);
  } else if (chest) {
    k = swingK(T, 81.34, EV.br2, 82.3);
    const tip = add3(unitAttach(unitD1('U1', EV.br2)).chest, {x: 0.05, y: 0, z: 0.1});
    hands = swingHands(b, tip, k);
  }
  let pose: Pose = layer(BRACED({wide: 0.85}), {face: {mouth: 'grit', brows: -0.5}});
  if (hands) {
    const sw = k < 0.36 ? smooth(k / 0.36) : 1;
    pose = layer(pose, {
      drop: lerp(20, 12, sw) + (k > 0.45 && k < 0.8 ? 26 * Math.sin(Math.PI * clamp((k - 0.45) / 0.35)) : 0),
      lean: k < 0.36 ? lerp(8, -14, smooth(k / 0.36)) : k < 0.55 ? lerp(-14, 34, easeIn((k - 0.36) / 0.19)) : lerp(34, 8, smooth((k - 0.55) / 0.45)),
      twist: k < 0.36 ? 16 * smooth(k / 0.36) : lerp(16, -6, smooth((k - 0.36) / 0.3)),
      face: {mouth: 'grit', brows: -1, squint: 0.5},
    });
  }
  const pts: Record<string, V3> = {};
  const port = {front: fromLoc(b, {r: -16, u: 250, f: 118}), back: fromLoc(b, {r: 32, u: 205, f: 34})};
  const H = hands ?? port;
  // the tool rides in both hands (back = right hand on the trigger, front = left on the side handle)
  const runArms: Pose = {armL: {local: {r: -16, u: 262, f: 112}}, armR: {local: {r: 30, u: 208, f: 36}}};
  const tgt = T < 73 ? unitAttach(unitD1('U4', T)).head : T < 83 ? unitAttach(unitD1('U1', T)).head : T < 89.5 ? {x: 44.3, y: 1.8, z: -0.9} : {x: 46.6, y: 1.5, z: 2.6};
  pose = layer(pose, {head: {yaw: lookYaw(b, tgt, 70), pitch: lookPitch(b, tgt)}});
  const crouch = after(T, 91.75, 0.5);
  if (crouch > 0) pose = blendPose(pose, layer(KNEEL('L'), {drop: 76, lean: 4, face: {mouth: 'pant', brows: -0.2}, breath: 0.8, head: {yaw: -40, pitch: 6}}), crouch);
  kneelFeet(b, 'L', crouch);
  const handsOn = b.inRun ? 1 - b.runK : 1;
  const final = withRun(b, withLook(pose, 'breaker', b, T), runArms);
  const fire = knee ? win(T, EV.knee, EV.knee + 0.08, 0.005, 0.05) : chest ? win(T, EV.br2, EV.br2 + 0.08, 0.005, 0.05) : 0;
  const spec = base('breaker', 'd1brk', 7, b, T, {...final, handL: 'grip', handR: 'grip', twoHanded: true, extra: breaker({back: 1, front: 0, gauge, fire, recoil: fire})},
    handsOn > 0.02 ? {handL: H.front, handR: H.back} : {});
  pts.front = H.front; pts.back = H.back;
  return {spec, body: b, pts};
};

// ================================================================== THE TETHER (clerkA)
const TTH_RUN: XZ[] = [{x: 0.1, z: -2.2}, {x: 3.2, z: 3.0}, {x: 6.4, z: 5.2}, {x: 11.5, z: 3.8}, {x: 21, z: -2.0}, {x: 28, z: -5.0}, {x: 35.9, z: -7.55}];
const TTH_STAND: KR[] = [
  [67.9, 35.9, -7.55, 102], [69.0, 35.9, -7.55, 96], [71.5, 36.05, -7.35, 96], [73.6, 36.05, -7.35, 96],
  [EV.yankPull, 36.05, -7.35, 96], [74.85, 35.62, -7.45, 98], [76.4, 35.62, -7.45, 98], [78.3, 36.9, -6.5, 104], [80.6, 37.35, -6.05, 112],
  [EV.br3Taut, 37.35, -6.05, 112], [84.1, 36.8, -6.5, 118], [85.0, 36.9, -6.35, 112], [88.4, 40.6, -2.6, 100], [90.2, 44.6, -1.2, 95],
  [91.2, 46.45, 1.2, 160], [91.75, 46.7, 1.85, 270], [94.3, 46.7, 1.85, 270],
];
const TTH_SEGS: Seg[] = [
  {kind: 'run', path: TTH_RUN, T0: M.CHARGE + 0.3, T1: 67.9, gait: GAITS.run, A: 1.1, D: 0.7},
  {kind: 'stand', root: TTH_STAND, stag: 0.16},
];
export const TETHER_SHOTS = [
  {name: 'yank', fire: EV.yankFire, bite: EV.yankBite, taut: EV.yankPull, release: 75.15, reelEnd: 75.75, target: 'U5'},
  {name: 'br3', fire: EV.br3Fire, bite: EV.br3Bite, taut: EV.br3Taut, release: 84.55, reelEnd: 85.4, target: 'U1'},
];
export const tetherAt = (T: number): CrewOut => {
  const b = bodyAt(TTH_SEGS, T);
  let pose: Pose = layer(BRACED({wide: 0.75}), {armR: {local: {r: 30, u: 240, f: 90}}, armL: {local: {r: -30, u: 220, f: 60}}, handL: 'open', face: {mouth: 'flat', brows: -0.5}});
  let recoil = 0;
  let aimAt: V3 | null = null;
  let muzzle = add3(fromLoc(b, {r: 30, u: 240, f: 90}), mul3({x: fwdOf(b.heading).x, y: 0, z: fwdOf(b.heading).z}, 0.36));
  for (const s of TETHER_SHOTS) {
    const aimW = win(T, s.fire - 0.9, s.reelEnd + 0.3, 0.35, 0.4);
    if (aimW <= 0) continue;
    const tgt = s.target === 'U5' ? unitAttach(unitD1('U5', Math.min(T, s.bite))).kneeL : unitAttach(unitD1('U1', Math.min(T, s.bite))).shoulderR;
    aimAt = tgt;
    // aim: right arm extended at the target; the left hand steadies the wrist
    const shoulder = fromLoc(b, {r: 36, u: 300, f: 0});
    const d = norm3(sub3(tgt, shoulder));
    const handR = add3(shoulder, mul3(d, 0.5));
    const fr = T > s.fire ? clamp((T - s.fire) / 0.35) : 0;
    recoil = T > s.fire && T < s.fire + 0.35 ? Math.sin(Math.PI * fr) : 0;
    const haul = win(T, s.taut, s.release, 0.08, 0.3);
    const hR = add3(handR, mul3(d, -0.08 * recoil - 0.22 * haul));
    muzzle = lerp3v(muzzle, add3(hR, add3(mul3(d, 0.38), {x: 0, y: 0.07, z: 0})), aimW);
    const p = layer(AIM, {
      armR: {local: toLoc(b, add3(handR, mul3(d, -0.08 * recoil - 0.22 * haul))), pole: {r: 0.6, u: -1, f: 0}, palm: {r: -1, u: 0, f: 0}},
      armL: {local: toLoc(b, add3(add3(handR, mul3(d, -0.18)), {x: 0, y: -0.05, z: 0})), palm: {r: 1, u: 0.3, f: 0}},
      lean: lerp(6, -16, haul), drop: 18 + 16 * haul, twist: 14,
      face: {squint: 0.6, mouth: haul > 0.3 ? 'grit' : 'flat', brows: -0.7},
    });
    pose = blendPose(pose, p, aimW);
  }
  const look = aimAt ?? (T < 76 ? unitAttach(unitD1('U5', T)).head : unitAttach(unitD1('U1', T)).head);
  pose = layer(pose, {head: {yaw: lookYaw(b, look, 75) * 0.85, pitch: lookPitch(b, look)}});
  const crouch = after(T, 91.85, 0.5);
  if (crouch > 0) pose = blendPose(pose, layer(KNEEL('L'), {drop: 80, lean: 10, armR: {local: {r: 40, u: 160, f: 90}}, face: {mouth: 'pant'}, head: {yaw: 40, pitch: 4}}), crouch);
  kneelFeet(b, 'L', crouch);
  const runArms: Pose = {armR: {local: {r: 26, u: 236, f: 64}}, armL: b.gait?.armL};
  const final = withRun(b, withLook(pose, 'tether', b, T), runArms);
  const spool = TETHER_SHOTS.reduce((s, q) => s * (T > q.fire && T < q.reelEnd ? 0.55 : 1), 1);
  const spec = base('tether', 'd1tth', 3, b, T, {...final, handR: 'grip', handL: final.handL ?? 'open', holdR: tetherLauncher({loaded: !TETHER_SHOTS.some((q) => T > q.fire && T < q.reelEnd), recoil}), extra: hipReel(spool)});
  return {spec, body: b, pts: {muzzle}};
};

// ================================================================== THE RUNNER (guesser, halligan)
const RUN_RUN1: XZ[] = [{x: 0.3, z: -0.9}, {x: 3.4, z: 3.6}, {x: 6.6, z: 5.4}, {x: 11, z: 4.6}, {x: 20, z: 0.0}, {x: 30, z: -1.6}, {x: 38.9, z: -2.2}];
const RUN_RUN2: XZ[] = [{x: 38.6, z: -1.95}, {x: 38.2, z: -0.4}, {x: 37.85, z: 2.4}, {x: 38.7, z: 4.75}, {x: 40.7, z: 5.85}, {x: 43.3, z: 5.25}, {x: 43.72, z: 4.62}, {x: 42.62, z: 4.15}]; // behind the breaker, round U4, onto its back
const RUN_SEGS: Seg[] = [
  {kind: 'run', path: RUN_RUN1, T0: M.CHARGE + 0.1, T1: 68.4, gait: GAITS.fast, A: 1.0, D: 0.7},
  {kind: 'stand', root: [[68.4, 38.9, -2.2, 100], [69.4, 38.9, -2.2, 96], [70.3, 38.55, -1.95, 90], [72.25, 38.6, -1.95, 92], [72.55, 38.6, -1.95, 165]], stag: 0.1},
  {kind: 'run', path: RUN_RUN2, T0: 72.55, T1: 75.45, gait: GAITS.fast, A: 0.5, D: 0.5},
  {kind: 'stand', root: [[75.45, 42.62, 4.15, 293], [EV.rip + 0.15, 42.62, 4.15, 293], [77.4, 42.3, 4.85, 270], [80.5, 41.7, 4.75, 300], [84.0, 41.6, 4.6, 330], [88.5, 42.3, 2.7, 30], [90.0, 44.4, 0.7, 50], [90.9, 46.1, 0.2, 140], [91.5, 46.55, 1.05, 270], [94.3, 46.55, 1.05, 270]], stag: 0.12},
];
/** the pry: fork tip on U4's back-plate edge; the bar levers about the tip; the plate pops; the left hand rips the cables */
const pryHands = (b: {pos: V3; heading: number}, T: number) => {
  const u = unitAttach(unitD1('U4', Math.min(T, EV.pryPop)));
  const edge = add3(u.backPlate, {x: 0, y: 0.16, z: 0});
  const sh = fromLoc(b, {r: 10, u: 300, f: 10});
  const dir0 = norm3(sub3(edge, sh));
  const lever = clamp((T - EV.pryIn) / (EV.pryPop - EV.pryIn));
  // levering: the handle end swings down (toward the ground) about the tip
  const down = {x: 0, y: -1, z: 0};
  const d = norm3(add3(dir0, mul3(down, -0.9 * easeIn(lever))));
  const TIP = 0.70;
  const back = sub3(edge, mul3(d, TIP));
  const front = add3(back, mul3(d, 0.34));
  return {back, front, edge};
};
export const runnerAt = (T: number): CrewOut => {
  const b = bodyAt(RUN_SEGS, T);
  let pose: Pose = layer(BRACED({wide: 0.7}), {face: {mouth: 'grit', brows: -0.4}});
  const pry = win(T, 75.5, 76.62, 0.35, 0.12);
  const rip = win(T, 76.4, 77.6, 0.12, 0.6);
  let world: {handL?: V3; handR?: V3} = {};
  const pts: Record<string, V3> = {};
  if (pry > 0) {
    const h = pryHands(b, T);
    pose = blendPose(pose, layer(PRY(clamp((T - EV.pryIn) / 0.4)), {}), pry);
    world = {handR: lerp3v(fromLoc(b, {r: 40, u: 190, f: 40}), h.back, pry), handL: lerp3v(fromLoc(b, {r: -30, u: 200, f: 60}), h.front, pry)};
    pts.edge = h.edge;
  }
  if (rip > 0) {
    // left hand into the exposed back, grab, then rip back and up
    const u = unitAttach(unitD1('U4', T));
    const inside = add3(u.backPlate, {x: 0, y: 0.04, z: 0});
    const pull = clamp((T - EV.rip) / 0.35);
    const ripTo = fromLoc(b, {r: -60, u: 330, f: -40});
    const handL = lerp3v(lerp3v(fromLoc(b, {r: -30, u: 200, f: 60}), inside, smooth(clamp((T - 76.4) / 0.3))), ripTo, easeOut(pull));
    world = {...world, handL: lerp3v(world.handL ?? handL, handL, rip)};
    pose = blendPose(pose, layer(pose, {lean: lerp(30, -10, easeOut(pull)), drop: lerp(50, 20, pull), face: {mouth: 'grit', brows: -1}}), rip);
    pts.cablesFrom = inside; pts.cablesHand = handL;
  }
  const tgt = T < 73.6 ? unitAttach(unitD1('U2', T)).head : T < 77.5 ? unitAttach(unitD1('U4', T)).backPlate : T < 89 ? {x: 41.5, y: 1.6, z: -2.0} : {x: 46.6, y: 1.4, z: 2.6};
  pose = layer(pose, {head: {yaw: lookYaw(b, tgt, 75), pitch: lookPitch(b, tgt)}});
  const crouch = after(T, 91.6, 0.45);
  if (crouch > 0) pose = blendPose(pose, layer(KNEEL('R'), {drop: 84, lean: 14, face: {mouth: 'pant', brows: 0}, head: {yaw: 35}}), crouch);
  kneelFeet(b, 'R', crouch);
  const twoH = pry > 0.02;
  const runArms: Pose = {armR: {local: {r: 40, u: 220, f: 60}}, armL: b.gait?.armL};
  const final = withRun(b, withLook(pose, 'runner', b, T), runArms);
  const spec = base('runner', 'd1run', 4, b, T, {
    ...final, handR: 'grip', handL: twoH ? 'grip' : rip > 0.3 ? (T < EV.rip ? 'open' : 'fist') : final.handL ?? 'fist', twoHanded: twoH,
    ...(twoH ? {extra: halligan2({back: 1, front: 0})} : {holdR: halligan1({ang: 72})}),
  }, world);
  return {spec, body: b, pts};
};

// ================================================================== THE DRONE PILOT (checker)
const DRN_RUN: XZ[] = [{x: 0.0, z: 2.0}, {x: 3.6, z: 4.9}, {x: 6.8, z: 5.9}, {x: 11, z: 5.0}, {x: 20, z: 2.5}, {x: 35.2, z: 1.2}];
const DRN_SEGS: Seg[] = [
  {kind: 'run', path: DRN_RUN, T0: M.CHARGE + 0.45, T1: 68.9, gait: GAITS.heavy, A: 1.2, D: 0.8},
  {kind: 'stand', root: [[68.9, 35.2, 1.2, 84], [76.6, 35.2, 1.2, 84], [77.3, 35.45, 1.05, 76], [86.6, 35.45, 1.05, 80], [88.8, 39.8, 5.4, 80], [91.0, 44.6, 5.8, 85], [92.0, 46.2, 6.1, 95], [92.45, 46.55, 6.05, 250], [94.3, 46.55, 6.05, 250]], stag: 0.08},
];
export const ALLY_KEYS: [number, number, number, number][] = [
  [56, 2.0, 6.0, 0.5], [59.95, 3.2, 6.2, 1.0], [62, 10, 5.2, 3.0], [64, 19, 4.8, 2.4], [66, 29, 4.6, 1.0], [68.3, 37.5, 4.4, 0.5],
  [70.5, 39.5, 4.6, 1.8], [73, 38.5, 4.9, -2.0], [75.6, 40.2, 4.4, -1.2], [76.8, 39.4, 3.9, 2.6], [77.42, 41.0, 3.12, 4.45],
  [78.1, 39.8, 4.3, 3.0], [80, 39.0, 4.9, 0.4], [84, 38.8, 5.2, 2.8], [87.5, 42.6, 5.2, 3.8], [90.5, 45.2, 4.3, 4.9], [94.3, 45.4, 3.5, 4.6],
];
export const droneAt = (T: number, allyPos: V3): CrewOut => {
  const b = bodyAt(DRN_SEGS, T);
  const tense = win(T, 76.4, 78.4, 0.3, 0.5);
  let pose: Pose = layer(BRACED({fists: false}), {
    drop: 12 + 14 * tense, lean: 8 + 10 * tense,
    armL: {local: {r: -22, u: 245, f: 92}}, armR: {local: {r: 22, u: 245, f: 92}},
    face: {mouth: tense > 0.4 ? 'grit' : 'flat', brows: -0.4 - 0.4 * tense, squint: 0.3},
  });
  pose = layer(pose, {head: {yaw: lookYaw(b, allyPos, 80), pitch: lookPitch(b, allyPos)}});
  const crouch = after(T, 92.45, 0.5);
  if (crouch > 0) pose = blendPose(pose, layer(KNEEL('L'), {drop: 82, armL: {local: {r: -20, u: 170, f: 90}}, armR: {local: {r: 20, u: 170, f: 90}}, face: {mouth: 'breath', worry: 0.4}, head: {yaw: -30, pitch: 10}}), crouch);
  kneelFeet(b, 'L', crouch);
  const runArms: Pose = {armL: {local: {r: -20, u: 236, f: 84}}, armR: {local: {r: 20, u: 236, f: 84}}};
  const final = withRun(b, withLook(pose, 'drone', b, T), runArms);
  const spec = base('drone', 'd1drn', 5, b, T, {...final, handL: 'grip', handR: 'grip', twoHanded: true, extra: controller({lit: 1})});
  return {spec, body: b};
};

// ================================================================== THE FLARE CARRIER (host)
const FLR_RUN: XZ[] = [{x: 1.0, z: 4.8}, {x: 4.3, z: 6.6}, {x: 7.6, z: 7.4}, {x: 13, z: 8.2}, {x: 25, z: 9.4}, {x: 37.0, z: 7.45}];
const FLR_SEGS: Seg[] = [
  {kind: 'run', path: FLR_RUN, T0: M.CHARGE + 0.25, T1: 68.55, gait: GAITS.run, A: 1.1, D: 0.7},
  {kind: 'stand', root: [[68.55, 37.0, 7.45, 88], [70.6, 37.0, 7.45, 88], [71.4, 36.6, 7.6, 92], [76.6, 36.9, 7.5, 92], [EV.flareThrow + 0.5, 36.9, 7.5, 92], [79.2, 36.4, 7.6, 88], [86.8, 36.4, 7.6, 84], [89.6, 42.6, 5.6, 70], [91.1, 46.2, 5.2, 80], [91.8, 46.75, 5.3, 270], [94.3, 46.75, 5.3, 270]], stag: 0.12},
];
export const FLARE = {strike: 77.0, throw: EV.flareThrow, hit: EV.flareHit};
export const flaresAt = (T: number): CrewOut => {
  const b = bodyAt(FLR_SEGS, T);
  let pose: Pose = layer(BRACED({wide: 0.75, fists: false}), {face: {mouth: 'flat', brows: -0.5}});
  // draw a flare from the bag (76.4), strike it (77.0), throw (wind 77.0 → release 77.3)
  const draw = win(T, 76.35, 77.0, 0.3, 0.05);
  if (draw > 0) pose = blendPose(pose, layer(pose, {armR: {local: {r: 60, u: 150, f: 10}}, armL: {local: {r: -30, u: 230, f: 90}}, head: {pitch: 18}}), draw);
  const thK = clamp((T - (FLARE.throw - 0.4 * 0.75)) / 0.75);
  const thW = win(T, FLARE.throw - 0.32, FLARE.throw + 0.6, 0.06, 0.3);
  if (thW > 0) pose = blendPose(pose, THROW(thK), thW);
  const u6 = unitAttach(unitD1('U6', T));
  pose = layer(pose, {head: {yaw: lookYaw(b, u6.head, 70), pitch: lookPitch(b, u6.head)}});
  const crouch = after(T, 91.85, 0.5);
  if (crouch > 0) pose = blendPose(pose, layer(KNEEL('R'), {drop: 80, face: {mouth: 'pant'}, head: {yaw: -30}}), crouch);
  kneelFeet(b, 'R', crouch);
  const runArms: Pose = {armL: b.gait?.armL, armR: b.gait?.armR};
  const final = withRun(b, withLook(pose, 'flares', b, T), runArms);
  const holding = T > 76.55 && T < FLARE.throw;
  const lit = T > FLARE.strike ? 1 : 0;
  const spec = base('flares', 'd1flr', 9, b, T, {...final, handR: holding ? 'grip' : final.handR ?? 'open', holdR: holding ? flareHold({lit, t: T}) : undefined});
  return {spec, body: b, pts: {hand: fromLoc(b, {r: 14, u: 330, f: 150})}};
};

// ================================================================== THE DECOY (clerkB, stays back; to the slab at the breach)
const DEC_RUN: XZ[] = [{x: 0.6, z: 5.9}, {x: 4.0, z: 7.0}, {x: 7.4, z: 6.9}, {x: 13, z: 6.0}, {x: 24, z: 4.8}, {x: 34.0, z: 4.6}];
const DEC_SEGS: Seg[] = [
  {kind: 'run', path: DEC_RUN, T0: M.CHARGE + 0.55, T1: 69.0, gait: GAITS.heavy, A: 1.2, D: 0.8},
  {kind: 'stand', root: [[69.0, 34.0, 4.6, 86], [74.0, 34.0, 4.6, 86], [75.0, 34.4, 4.0, 80], [86.4, 34.4, 4.0, 82], [88.9, 41.6, 5.2, 86], [90.3, 45.7, 5.0, 84], [90.95, 46.7, 4.5, 270], [94.3, 46.7, 4.5, 270]], stag: 0.06},
];
export const decoyAt = (T: number): CrewOut => {
  const b = bodyAt(DEC_SEGS, T);
  let pose: Pose = layer(BRACED({wide: 0.6, fists: false}), {drop: 10, lean: 6, armL: {local: {r: -28, u: 215, f: 92}, pole: {r: -1, u: -0.7, f: 0}, palm: {r: 0.4, u: 0.3, f: -1}}, handR: 'open', face: {mouth: 'flat', brows: -0.3, worry: 0.4}});
  const tgt = T < 86 ? {x: 41.5, y: 1.6, z: 0.5} : {x: 46.6, y: 1.2, z: 3.0};
  pose = layer(pose, {head: {yaw: lookYaw(b, tgt, 70), pitch: lookPitch(b, tgt)}});
  const crouch = after(T, 91.05, 0.5);
  if (crouch > 0) pose = blendPose(pose, layer(KNEEL('L'), {drop: 82, lean: 4, armL: {local: {r: -26, u: 180, f: 90}, palm: {r: 0.4, u: 0.3, f: -1}}, face: {mouth: 'breath', worry: 0.5}, head: {yaw: -25, pitch: 6}}), crouch);
  kneelFeet(b, 'L', crouch);
  const runArms: Pose = {armL: {local: {r: -26, u: 232, f: 70}}, armR: b.gait?.armR};
  const final = withRun(b, withLook(pose, 'decoy', b, T), runArms);
  const spec = base('decoy', 'd1dec', 6, b, T, {...final, handL: 'grip', holdL: tablet({screen: true, glow: 0.2})});
  return {spec, body: b};
};

export const CREW_ROLES = ['director', 'breaker', 'tether', 'runner', 'drone', 'flares', 'decoy'] as const;
export type {FigFrame};

// ------------------------------------------------------------------ footfalls (dust where each running foot lands)
const ALL_SEGS: Record<string, Seg[]> = {director: DIR_SEGS, breaker: BRK_SEGS, tether: TTH_SEGS, runner: RUN_SEGS, drone: DRN_SEGS, flares: FLR_SEGS, decoy: DEC_SEGS};
export type Footfall = {t: number; pos: V3; key: string; speed: number};
/** every running footfall of the Crew in (T − win, T] (time, world point, speed) */
export const crewFootfalls = (T: number, win = 1.2): Footfall[] => {
  const out: Footfall[] = [];
  for (const [who, segs] of Object.entries(ALL_SEGS)) segs.forEach((s, si) => {
    if (s.kind !== 'run') return;
    const A = s.A ?? 1.0, D = s.D ?? 0.6, L = pathLen(s.path);
    const a = Math.max(s.T0, T - win), b = Math.min(T, s.T1);
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
