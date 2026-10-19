// Section C: the Crew as functions of FILM time T (world metres) — one choreography sampled by every camera of the
// section, so positions, eye-lines and contacts hold across the cuts.
//   - flat ground (out of the smoke, across the floor): gaitC walks on GC (feet planted);
//   - the slope: STEP-CLIMBS (motion.ts climbPlan): a planted foot, the weight over it, the next foot up onto a new hold
//     (knee first on a step-up), then the push up over it — the body rises after each plant; palms on the rubble at the
//     steepest steps (world points: the solved hand is checked against them by the C probe);
//   - between moves: keyed roots with planted steps.
// Hand contacts are world points: palms on rubble, the runner's palm on the wall's top edge (the vault), the breaker's
// palm on the Director's shoulder (handOn), the Director's fingers on his plate strap.
// R3 C6: the shared turn, the tools readied with purpose (tablet, satchel, the breaker's charge, the drone sent out,
// the launcher, the halligan), the vanguard breaking into its run, the commit: each steps from an assembly spot to
// D1's start (the last steps land EXACTLY on D1's 59.95 footholds), sinks into the start, and the left foot lifts into
// the first stride, which D1-1 continues (D1 starts every run with the left foot leaving the ground).
import {V3, add3, sub3, mul3, norm3, lerp, lerp3, clamp, smooth, easeIn} from '../../../kit/math';
import type {View} from '../../engine';
import {
  FigSpec, FigFrame, Pose, blendPose, layer, lookR2, dmgR2, toolsR2, plateWear, tetherLauncher, hipReel, tablet, breaker,
  controller, halligan1, figureRig, handOn, SH_X, SH_H, breakerCarry, controllerHold, FACES, expr, exprMix,
} from '../../rig';
import type {Rig2, Part, Face} from '../../rig';
import type {GaitW} from '../../rig/gait';
import type {WorldOrient} from '../../rig/sprite';
import {M} from '../../timing';
import {droneKeys, DronePose} from '../../fx';
import {dirB} from '../B/director';
import {directorAt, breakerAt, tetherAt, runnerAt, droneAt, flaresAt, decoyAt, ALLY_KEYS} from '../D1/crew';
import {allyPose} from '../D1/fx';
import {
  XZ, KR, KP, Body, Seg, bodyAt, walkSeg, standSeg, walkEnd, fwdOf, headingTo, wrapD, lerpAng, fromLoc,
  keyN, keyV, win, after, gaitC, stepKeys, climbPlan, climbSeg, climbHand, climbAt, Climb,
} from './motion';
import {GC, onGC, wallGrip} from './ground';
import {TD, TT, TR, TB2, T3, TDR, TEND, TH} from './beats';

export type RoleC = 'director' | 'tether' | 'runner' | 'breaker' | 'drone' | 'flares' | 'decoy';
export const ROLES_C: RoleC[] = ['director', 'tether', 'runner', 'breaker', 'drone', 'flares', 'decoy'];
export type CrewC = {spec: FigSpec; body: Body; pts: Record<string, V3>};

// ------------------------------------------------------------------ gaits (flat ground; the slope is climbed)
const G_WALK: GaitW = {stride: 1.15, duty: 0.6, lift: 0.12, bob: 5, armAmp: 16, lean: 5};
const G_HURRY: GaitW = {stride: 1.45, duty: 0.5, lift: 0.14, bob: 7, armAmp: 22, lean: 9};
const G_HEAVY: GaitW = {stride: 1.38, duty: 0.52, lift: 0.13, bob: 7, armAmp: 10, lean: 10};
const G_RUN: GaitW = {stride: 1.95, duty: 0.36, lift: 0.17, bob: 10, armAmp: 34, lean: 15};

// ------------------------------------------------------------------ looks
const R2D = 180 / Math.PI;
type Aim = {yaw: number; pitch: number; twist: number};
/** head yaw/pitch (and a little torso twist when it is far round) to look at a world point */
const aim = (b: {pos: V3; heading: number}, p: V3, o: {eye?: number; lim?: number; twistK?: number} = {}): Aim => {
  const raw = wrapD(headingTo(b.pos, p) - b.heading);
  const twist = clamp((Math.abs(raw) > 45 ? raw - Math.sign(raw) * 45 : 0) * (o.twistK ?? 0.6), -32, 32);
  const yaw = clamp(raw - twist, -(o.lim ?? 78), o.lim ?? 78);
  const pitch = clamp(-Math.atan2(p.y - (b.pos.y + (o.eye ?? 1.55)), Math.hypot(p.x - b.pos.x, p.z - b.pos.z)) * R2D, -35, 35);
  return {yaw, pitch, twist};
};
const mixAim = (a: Aim, b: Aim, k: number): Aim => ({yaw: lerp(a.yaw, b.yaw, k), pitch: lerp(a.pitch, b.pitch, k), twist: lerp(a.twist, b.twist, k)});
/** a sequence of look targets [[T, point], …] blended over `d` s at each change */
const lookSeq = (b: {pos: V3; heading: number}, T: number, seq: [number, V3][], d = 0.35, o: {eye?: number; lim?: number; twistK?: number} = {}): Aim => {
  let i = 0;
  for (let k = 0; k < seq.length; k++) if (T >= seq[k][0]) i = k;
  const cur = aim(b, seq[i][1], o);
  if (i === 0) return cur;
  const k = smooth((T - seq[i][0]) / d);
  return k >= 1 ? cur : mixAim(aim(b, seq[i - 1][1], o), cur, k);
};
/** the current target of a look sequence (for the eyes: FigSpec.gaze) */
const lookAt = (T: number, seq: [number, V3][]): V3 => { let p = seq[0][1]; for (const [t, q] of seq) if (T >= t) p = q; return p; };

// ------------------------------------------------------------------ faces (RIG presets, keyed)
type FK = [number, Face][];
/** keyed expressions: each blends in over `d` s from its key */
const faceKeys = (T: number, k: FK, d = 0.22): Face => {
  let f: Face = k[0][1];
  for (let i = 1; i < k.length; i++) {
    if (T < k[i][0]) break;
    const w = smooth((T - k[i][0]) / d);
    f = blendPose({face: f}, {face: k[i][1]}, w).face ?? k[i][1];
  }
  return f;
};
/** a climb's effort laid over the keyed face (teeth set, brows down on the steep steps) */
const withEffort = (f: Face, b: Body, k = 0.65): Face => {
  const c = (b.climb ?? 0) * k;
  return c > 0.01 ? blendPose({face: f}, {face: FACES.effort}, c).face ?? f : f;
};
const F = FACES;
const RESOLVE_HARD: Face = exprMix('resolve', 'anger', 0.35);

// ------------------------------------------------------------------ helpers
export const extras = (...fs: (((r: Rig2) => Part[]) | undefined)[]) => (r: Rig2) => fs.flatMap((f) => (f ? f(r) : []));
/** the walk's (or climb's) body (drop, lean, bob) plus role arms, faded with the walk */
const withWalk = (b: Body, stance: Pose, walkArms: Pose): Pose => {
  if (!b.gait || b.runK <= 0.001) return stance;
  const run = layer(b.gait, walkArms);
  return blendPose(stance, run, b.runK);
};
/** weight over the planted foot while the other swings (side lean, a small dip) */
const weight = (b: Body): Pose => {
  const sl = b.swingL ?? 0, sr = b.swingR ?? 0;
  return {side: 5 * (sl - sr), drop: 5 * Math.max(sl, sr)};
};
const addPose = (p: Pose, d: Pose): Pose => ({...p, side: (p.side ?? 0) + (d.side ?? 0), drop: (p.drop ?? 0) + (d.drop ?? 0)});
/** a world-point hand target faded in from wherever the free hand is (exact per view; view-free: snaps at w ≥ 0.5) */
const handTo = (v: View | undefined, spec: FigSpec, side: 'L' | 'R', target: V3, w: number, orient?: WorldOrient): FigSpec => {
  if (w <= 0.001) return spec;
  let p = target;
  if (w < 1 && v) {
    const free = figureRig(v, spec);
    p = lerp3(side === 'L' ? free.handL : free.handR, target, w);
  } else if (w < 0.5 && !v) return spec;
  const o = orient ? {...orient, w: (orient.w ?? 1) * clamp(w)} : undefined;
  return {...spec, world: {...(spec.world ?? {}), ...(side === 'L' ? {handL: p, orientL: o} : {handR: p, orientR: o})}};
};
const palmDown = (h: number): WorldOrient => ({palm: {x: 0, y: -1, z: 0}, fingers: {x: fwdOf(h).x, y: -0.15, z: fwdOf(h).z}});
const layerFn = (p: FigSpec['pose'], over: Pose): FigSpec['pose'] => (typeof p === 'function' ? (Fr: FigFrame) => ({...p(Fr), ...over}) : {...(p ?? {}), ...over});
/** a climb's palm on the rubble (planted while the foot steps up and the body pushes over it); leans the body into it */
const climbPalm = (v: View | undefined, spec: FigSpec, c: Climb, T: number, b: Body, pts: Record<string, V3>): FigSpec => {
  const h = climbHand(c, T);
  if (!h) return spec;
  pts[`palm${h.side}`] = h.p;
  const s2 = {...spec, pose: layerFn(spec.pose, {[h.side === 'L' ? 'handL' : 'handR']: 'brace'} as Pose)};
  return handTo(v, s2, h.side, h.p, h.w, palmDown(b.heading));
};
/** extra lean while a palm is planted (the reach down to the rubble) */
const palmLean = (c: Climb, T: number) => climbHand(c, T)?.w ?? 0;

// ------------------------------------------------------------------ D1's first frame (the end of C)
type EndSpec = {spec: FigSpec; pose: Pose};
let D1END: Record<RoleC, EndSpec> | null = null;
const d1End = (): Record<RoleC, EndSpec> => {
  if (D1END) return D1END;
  const T = M.CHARGE;
  const e = (c: {spec: FigSpec}): EndSpec => ({spec: c.spec, pose: (typeof c.spec.pose === 'function' ? {} : c.spec.pose ?? {}) as Pose});
  D1END = {
    director: e(directorAt(T)), tether: e(tetherAt(T)), runner: e(runnerAt(T)), breaker: e(breakerAt(T)),
    drone: e(droneAt(T, allyPose(T).pos)), flares: e(flaresAt(T)), decoy: e(decoyAt(T)),
  };
  return D1END;
};
/** where each of them stands at the cut to D1 (root, heading, feet) */
export const endOf = (r: RoleC) => d1End()[r].spec;
/**
 * Blend into D1's first frame: the pose (and root/heading, which the commit already put on D1's) over TEND.blend →
 * M.CHARGE. The feet are already on D1's footholds (the commit pins them); the left foot then lifts into D1's first
 * stride (D1 has it in the air at 59.95), accelerating into the cut so it keeps moving across it.
 */
const endBlend = (r: RoleC, T: number, pos: V3, heading: number, pose: Pose, world: FigSpec['world']): {pos: V3; heading: number; pose: Pose; world: FigSpec['world']} => {
  const w = smooth(clamp((T - TEND.blend) / (M.CHARGE - TEND.blend)));
  if (w <= 0) return {pos, heading, pose, world};
  const d = d1End()[r];
  const dw = d.spec.world ?? {};
  const ww: FigSpec['world'] = {...(world ?? {})};
  const lift = smooth(clamp((T - TEND.lift) / (M.CHARGE - TEND.lift)));
  if (world?.footL && dw.footL) ww.footL = lerp3(world.footL, dw.footL, lift);
  if (world?.footR && dw.footR) ww.footR = lerp3(world.footR, dw.footR, smooth(clamp((T - TEND.lift) / (M.CHARGE - TEND.lift))));
  const lw = (a: V3 | undefined, b: V3 | undefined) => (a && b ? lerp3(a, b, w) : w < 0.5 ? a : b);
  if (world?.handL || dw.handL) ww.handL = lw(world?.handL, dw.handL);
  if (world?.handR || dw.handR) ww.handR = lw(world?.handR, dw.handR);
  return {pos: lerp3(pos, d.spec.pos, w), heading: lerpAng(heading, d.spec.heading, w), pose: blendPose(pose, d.pose, w), world: ww};
};
/**
 * The commit's footholds: planted steps over `root` (the last key is D1's start), then the final position of each foot
 * moved onto D1's 59.95 foothold (the right foot forward; the left under the spot it lifts from).
 */
const pinFeet = (feet: {L: KP[]; R: KP[]}, r: RoleC): {L: KP[]; R: KP[]} => {
  const w = endOf(r).world ?? {};
  const pin = (k: KP[], p?: V3) => {
    if (!p) return;
    const lx = k[k.length - 1][1], lz = k[k.length - 1][2];
    for (let i = k.length - 1; i >= 0 && Math.abs(k[i][1] - lx) < 1e-6 && Math.abs(k[i][2] - lz) < 1e-6; i--) k[i] = [k[i][0], p.x, p.z];
  };
  pin(feet.L, w.footL); pin(feet.R, w.footR);
  return feet;
};
/** a stand that ends with the commit: root keys → (hold at the assembly spot) → D1's start, feet pinned to D1's */
const commitStand = (r: RoleC, keys: KR[], t0: number, t1: number, o: Parameters<typeof stepKeys>[1] = {}): Extract<Seg, {kind: 'stand'}> => {
  const e = endOf(r);
  const last = keys[keys.length - 1];
  const root: KR[] = [...keys, [t0, last[1], last[2], last[3]], [t1, e.pos.x, e.pos.z, e.heading], [M.CHARGE + 1, e.pos.x, e.pos.z, e.heading]];
  return {kind: 'stand', root, feet: pinFeet(stepKeys(root, {stepLen: 0.5, ...o}), r)};
};
/** the assembly spot: D1's start, `back` metres behind it along D1's heading (and `lat` to its right) — picked where
 * the rubble is flattest across the stance (the C probe's spot search), so nobody stands with one knee up */
const spotBehind = (r: RoleC, back: number, lat = 0): {x: number; z: number; h: number} => {
  const e = endOf(r), f = fwdOf(e.heading), rt = {x: -f.z, z: f.x};
  return {x: e.pos.x - f.x * back + rt.x * lat, z: e.pos.z - f.z * back + rt.z * lat, h: e.heading};
};
/** a body's head (for eye-lines) */
const headOf = (b: Body, up = 1.58): V3 => ({x: b.pos.x, y: b.pos.y + up, z: b.pos.z});
/** a climb that starts where the previous segments leave the body at T0 */
const climbFrom = (prev: Seg[], pts: XZ[], T0: number, T1: number, o: Omit<Parameters<typeof climbPlan>[3], 'start'> = {}): Climb => {
  const b = bodyAt(prev, T0);
  return climbPlan(pts, T0, T1, {...o, start: {pos: b.pos, heading: b.heading, footL: b.footL, footR: b.footR}});
};
/** the stand after a climb: starts on its last root with its feet */
const afterClimb = (c: Climb): {start: {L: [number, number]; R: [number, number]}; key: KR} => ({
  start: {L: [c.feetEnd.L.x, c.feetEnd.L.z], R: [c.feetEnd.R.x, c.feetEnd.R.z]}, key: [c.T1, c.end.x, c.end.z, c.end.h],
});

const ARMY_EYE: V3 = {x: 82, y: 2.4, z: 0.5};

// ================================================================== THE DIRECTOR (clerkC)
// C1: at the brink (B's last stance), facing the army. The breath stops; a scrape behind him; eyes, then head over his
// right shoulder; then the body comes round in three steps, up and back toward the crest (to face west, where they come
// from). C3–C5: he watches them come; the breaker's hand on his shoulder; the strap check. C6: the turn (first); a look
// along the line at them; their front breaks into its run; the step out to the brink (they follow him); the set.
const DIR_SPOT: XZ = {x: 1.25, z: 1.35};
const DIR_B_END = dirB(TD.pivot);
const DIR_ROOT: KR[] = [
  [TD.pivot, DIR_B_END.pos.x, DIR_B_END.pos.z, DIR_B_END.heading],
  [TD.pivotEnd, DIR_SPOT.x, DIR_SPOT.z, 230],
  [40.75, DIR_SPOT.x, DIR_SPOT.z, 230], [41.35, DIR_SPOT.x, DIR_SPOT.z, 262],
  [49.25, DIR_SPOT.x, DIR_SPOT.z, 262], [49.8, DIR_SPOT.x, DIR_SPOT.z, 250],
  [TD.turn, DIR_SPOT.x, DIR_SPOT.z, 250], [TD.turnEnd, DIR_SPOT.x, DIR_SPOT.z, 112],
];
// (the pivot starts from B's last stance: its root and its feet, shots/B/director.ts)
const DIR_SEGS: Seg[] = [commitStand('director', DIR_ROOT, TD.step, TD.stepEnd, {half: 0.15, stag: 0.05, turnStep: 52, start: {L: [DIR_B_END.world.footL!.x, DIR_B_END.world.footL!.z], R: [DIR_B_END.world.footR!.x, DIR_B_END.world.footR!.z]}})];
/** what he looks at (C2: the tether out of the smoke; C3: the runner, then the breaker; C4: the summit, the trio, the
 * drone; C5: the breaker, the trio, the plate; C6: the army, the line, the army, them, the army) */
const dirLooks = (T: number, b: Body): [number, V3][] => [
  [35.8, ARMY_EYE],
  [TD.head, {x: -14, y: 1.6, z: -2.2}],
  [38.9, tetherHead0()], [40.5, runnerHead(T)], [42.35, breakerHead(T)], [43.9, tetherHead(T)],
  [46.0, {x: -3.0, y: 3.4, z: 6.0}], [47.55, droneBody(T)], [48.9, {x: -2.5, y: 3.2, z: 5.0}],
  // R4 C5a: the touch lands on his right shoulder: the eyes drop to the hand on it (R3 looked straight up to the breaker's head
  // over a head already turned to its limit, so the eyes rolled up), then come up to the breaker's face for the nod
  [TB2.touch + 0.04, fromLoc(b, SHOULDER_HAND)], [TB2.touch + 0.3, breakerHead(T)], [TD.lookBack, {x: -1.5, y: 4.6, z: 4.2}], [TD.strapLook, plateLook()],
  [TD.strapUp, {x: 0.2, y: 5.2, z: 4.5}], [TD.turn - 0.06, ARMY_EYE],
  [TD.glanceS, breakerHead(T)], [TD.glanceSEnd, ARMY_EYE],
];
/** the breaker's palm on the Director's right shoulder, body-local (root-relative; his shoulder top, a little proud of it) */
const SHOULDER_HAND = {r: 60, u: 292, f: 4};
const plateLook = () => ({x: DIR_SPOT.x + 0.1, y: GC(DIR_SPOT.x, DIR_SPOT.z) + 1.0, z: DIR_SPOT.z + 0.25});
/** the guard: low (B6's), mid on the build; D1's high guard at the set */
const GUARD_LOW = {r: -28, u: 232, f: 78};
const GUARD_MID = {r: -34, u: 206, f: 80};
const GUARD_HIGH = {r: 6, u: 345, f: 112}; // = D1/crew.tsx GUARD
const DIR_FACE = (T: number): Face => faceKeys(T, [
  [35.8, dirB(Math.min(T, TD.pivot - 0.01)).pose.face ?? F.concentration],
  [TD.heard, expr('alert', 0.9)],
  [TD.headEnd, exprMix('alert', 'concentration', 0.6)], // searching the smoke
  [TD.seen, exprMix('concentration', 'recognition', 0.55)], // a shape he knows
  [41.55, expr('recognition', 0.8)], // the runner over the wall
  [TD.recognise, F.recognition], // the breath of recognition
  [45.1, exprMix('recognition', 'relief', 0.55)],
  [47.5, expr('alert', 0.7, {lookY: -0.3})], // the drone goes up
  [48.9, exprMix('relief', 'concentration', 0.5)],
  [TB2.touch + 0.02, expr('alert', 0.7, {lid: 0.1})], // the hand on his shoulder: a start, eyes down to it
  [TB2.touch + 0.4, exprMix('alert', 'relief', 0.6, {lid: 0.16})], // up to his face: it is him
  [TD.nod, expr('recognition', 0.6, {mouth: 'soft'})],
  [TD.strapLook, F.concentration],
  [TD.turn, F.resolve],
  [TD.glanceS, expr('resolve', 0.8, {brows: -0.2})], // a look along the line: they are ready
  [TD.glanceSEnd, F.resolve],
  [TD.threat + 0.08, RESOLVE_HARD], // their front breaks into its run
  [TD.step, expr('resolve', 1, {brows: -0.75, squint: 0.35})],
  [TD.set, F.effort],
]);

export const directorC = (T: number, v?: View): CrewC => {
  const pts: Record<string, V3> = {};
  // ---- C1, before the pivot: B's stance (shots/B/director.ts), with the breath stopping and the head turning
  const preB = T < TD.pivot;
  const bB = preB ? dirB(T) : null;
  const b: Body = preB
    ? {pos: bB!.pos, heading: bB!.heading, footL: bB!.world.footL!, footR: bB!.world.footR!, runK: 0, seg: 0, inWalk: false}
    : bodyAt(DIR_SEGS, T);
  const C_BASE: Pose = {
    drop: 19, lean: 7, twist: -6, armL: {local: GUARD_LOW, pole: {r: -1, u: -0.4, f: -0.3}}, armR: {local: {r: 74, u: 150, f: 24}},
    handL: 'fist', handR: 'relaxed', breath: 0.42,
  };
  // (from the pivot on, C's stance — blended in from wherever B's last stance has him, so B can change without a pop)
  const base: Pose = preB ? bB!.pose : T < TD.pivot + 0.4 ? blendPose(DIR_B_END.pose, C_BASE, smooth((T - TD.pivot) / 0.4)) : C_BASE;
  // breath: stops on the quiet, comes back shallow, the breath of recognition in C3, then steady; a breath in as their
  // front breaks
  const stop = after(T, TD.breathStop, 0.25) * (1 - after(T, TD.pivotEnd + 0.2, 1.2) * 0.6);
  const recog = win(T, TD.recognise, TD.recognise + 1.5, 0.35, 0.8);
  const inhale = win(T, TD.threat, TD.step + 0.1, 0.3, 0.3);
  const breath = lerp(lerp(lerp(base.breath ?? 0.42, 0.04, stop), 0.95, recog), 0.9, inhale);
  const headK = smooth(clamp((T - TD.head) / (TD.headEnd - TD.head)));
  let pose: Pose = {...base, breath};
  const looks = dirLooks(T, b);
  let a: Aim = lookSeq(b, T, looks, 0.4, {lim: 80, twistK: 0.5});
  let gaze: V3 | null = lookAt(T, looks);
  if (preB) {
    a = {yaw: lerp(0, 74, headK), pitch: lerp(2, -3, headK), twist: lerp(-6, 16, smooth((T - TD.head - 0.12) / 0.55))};
    gaze = T > TD.eyes ? {x: -14, y: 1.6, z: -2.2} : null;
  } else if (T < TD.pivotEnd + 0.3) {
    // the body comes round under the head: the head unwinds as the heading catches up (gaze stays west)
    const k = smooth((T - TD.pivot) / (TD.pivotEnd + 0.3 - TD.pivot));
    a = mixAim({yaw: 74, pitch: -3, twist: 16}, a, k);
  }
  if (T > TB2.touch && T < TD.lookBack + 0.45) {
    const k = win(T, TB2.touch, TD.lookBack + 0.45, 0.2, 0.4);
    // (the head dips at most ~18 deg to the hand on his shoulder: the eyes go the rest of the way down, then up to his face)
    a = {...a, yaw: lerp(a.yaw, clamp(a.yaw, -50, 50), k), twist: lerp(a.twist, clamp(a.twist, -14, 14), k), pitch: lerp(a.pitch, Math.min(a.pitch, 18), k)};
  }
  pose = layer(pose, {twist: a.twist, head: {yaw: a.yaw, pitch: a.pitch, roll: 0}});
  if (!preB) pose = addPose(pose, weight(b));
  // the recognition: the chest lifts with the breath, the chin comes up a little
  pose = layer(pose, {lean: (pose.lean ?? 7) - 3 * recog, head: {...pose.head, pitch: (pose.head?.pitch ?? 0) - 5 * recog}});
  // ---- C5a: the breaker's palm lands on his right shoulder (a dip under it, then he turns his head to him; a nod)
  const jolt = T > TB2.touch ? Math.exp(-(T - TB2.touch) * 7) * Math.sin(Math.min(Math.PI, (T - TB2.touch) * 9)) : 0;
  const nod = win(T, TD.nod, TD.nod + 0.4, 0.15, 0.2);
  pose = layer(pose, {drop: (pose.drop ?? 19) + 5 * jolt, side: (pose.side ?? 0) - 3 * jolt, head: {...pose.head, pitch: (pose.head?.pitch ?? 0) + 9 * nod}});
  // ---- C5c: the strap check — the plate forearm comes up across his body, the right fingers press the strap
  const strapW = win(T, TD.strapLook, TD.strapUp + 0.22, 0.25, 0.3);
  if (strapW > 0) pose = blendPose(pose, layer(pose, {armL: {local: {r: -2, u: 252, f: 74}, pole: {r: -1, u: -0.5, f: -0.1}}, handL: 'fist'}), strapW);
  // ---- C6: the turn: the plate up to a mid guard, the right fist closes; their front breaks: weight down, plate up
  if (T > TD.turn) pose = blendPose(pose, layer(pose, {armL: {local: GUARD_MID, pole: {r: -1, u: -0.5, f: -0.1}, palm: {r: -0.5, u: 0.1, f: -1}}, handR: 'fist', armR: {local: {r: 62, u: 190, f: 50}}}), after(T, TD.turn, 0.6));
  const brace = after(T, TD.threat, 0.5);
  if (brace > 0) pose = layer(pose, {drop: (pose.drop ?? 19) + 6 * brace, lean: (pose.lean ?? 7) + 3 * brace});
  // the step out: he leans into it (the feet are the commit's planted steps)
  const go = win(T, TD.step - 0.12, TD.stepEnd + 0.2, 0.15, 0.3);
  if (go > 0) pose = layer(pose, {lean: (pose.lean ?? 7) + 7 * go, armR: {local: {r: 58, u: 200, f: 66}}});
  // the set (on the accent): he sinks into the start, right fist back; then the plate snaps up into D1's high guard: go
  const set = after(T, TD.set - 0.06, 0.32);
  if (set > 0) pose = blendPose(pose, layer(pose, {drop: 30, lean: 12, armR: {local: {r: 52, u: 250, f: 70}, pole: {r: 1, u: -0.5, f: -0.3}}, handR: 'fist'}), set);
  const plateUp = after(T, TD.plateUp, 0.22);
  if (plateUp > 0) pose = blendPose(pose, layer(pose, {armL: {local: GUARD_HIGH, pole: {r: -1, u: -0.7, f: 0.1}, palm: {r: -0.55, u: 0.1, f: -1}}}), plateUp);
  pose.face = DIR_FACE(T);
  if (recog > 0.3) pose.face = {...pose.face, open: Math.max(pose.face.open ?? 0, 0.35 * recog)};

  // ---- the spec
  const plate = toolsR2('director', T).plate ?? 'intact';
  const world: FigSpec['world'] = {footL: b.footL, footR: b.footR};
  const eb = endBlend('director', T, b.pos, b.heading, {...pose, handL: 'fist', wearL: plateWear(plate), dmg: dmgR2('director', T)}, world);
  let spec: FigSpec = {
    key: 'cDir', look: lookR2('director'), t: T, seed: 11, pos: eb.pos, heading: eb.heading, pose: eb.pose,
    world: eb.world, reach: true, ...(gaze ? {gaze, gazeW: 0.85} : {}),
  };
  // the strap: his right fingers on the strap at his left forearm (a world point on the solved forearm)
  if (strapW > 0.001 && v) {
    const press = win(T, TD.strapPress - 0.08, TD.strapRelease + 0.1, 0.1, 0.15);
    const R = figureRig(v, spec);
    const r = R.rig;
    const k = 0.62;
    const onArm = R.W({x: lerp(r.el[0].x, r.wr[0].x, k), y: lerp(r.el[0].y, r.wr[0].y, k), z: lerp(r.el[0].z, r.wr[0].z, k)});
    const out = norm3(sub3(onArm, R.chest));
    const tgt = add3(onArm, mul3(out, 0.05 - 0.022 * press));
    spec = handTo(v, {...spec, pose: layerFn(spec.pose, {handR: press > 0.3 ? 'grip' : 'reach', zArm: [undefined, 45]})}, 'R', tgt, strapW, {palm: mul3(out, -1), w: 0.7});
    pts.strap = tgt;
  }
  pts.head = headOf(b, 1.62);
  return {spec, body: b, pts};
};

// ================================================================== THE TETHER OPERATOR (clerkA)
// Out of the smoke at the ruin (C2), across the floor; at the foot of the slope she starts up it a step at a time
// (the north side of the west slope), a palm on the rock at the last steep step, onto the summit; she turns to watch
// the others; C5b: her hand to the reel on her right hip — the lock clicks. C6: she turns to the enemy, the launcher
// comes up and she sights along it; the commit.
const TT_FLAT: XZ[] = [{x: -18.6, z: -1.6}, {x: -16.2, z: -1.9}, {x: -14.2, z: -2.1}, {x: -12.0, z: -2.32}, {x: -9.4, z: -2.45}, {x: -7.4, z: -2.6}];
const TT_WALK = walkSeg(TT_FLAT, TT.go, TT.foot, G_HURRY, {A: 0.9, D: 0.45});
const TT_A = spotBehind('tether', 0.45, 0.2);
const TT_UP: XZ[] = [{x: -7.4, z: -2.6}, {x: -6.3, z: -2.62}, {x: -5.0, z: -2.55}, {x: -3.2, z: -2.35}, {x: -1.75, z: -2.1}, {x: -0.95, z: -2.15}, {x: TT_A.x, z: TT_A.z}];
const TT_CLIMB = climbFrom([TT_WALK], TT_UP, TT.foot, TT.top, {stepLen: 0.48, maxRise: 0.27, autoHands: {side: 'L', n: 2, minRise: 0.25, fwd: 0.04, out: 0.18}, endHeading: 120});
const TT_C = afterClimb(TT_CLIMB);
const TT_SEGS: Seg[] = [
  TT_WALK,
  climbSeg(TT_CLIMB),
  commitStand('tether', [TT_C.key, [48.85, TT_A.x, TT_A.z, 120], [49.85, TT_A.x, TT_A.z, 196], [TT.turn, TT_A.x, TT_A.z, 196], [54.1, TT_A.x, TT_A.z, TT_A.h]], TT.commit, TT.commitEnd, {half: 0.14, stag: 0.04, turnStep: 65, start: TT_C.start}),
];
const tetherHead0 = (): V3 => { const b = bodyAt(TT_SEGS, 40.2); return headOf(b, 1.5); };
const tetherHead = (T: number): V3 => headOf(bodyAt(TT_SEGS, T), 1.55);
const TT_FACE: FK = [
  [36.5, F.concentration], [TT.foot, expr('concentration', 1, {brows: -0.7})], [TT.top + 0.15, exprMix('effort', 'recognition', 0.6)],
  [49.7, F.concentration], [TT.reel - 0.15, expr('concentration', 1, {lookY: 0.6})], [TT.reelOff, F.alert], [TT.turn, F.resolve],
  [TT.ready + 0.2, expr('concentration', 1, {squint: 0.5})], [57.2, RESOLVE_HARD], [TT.commit, F.effort],
];
export const tetherC = (T: number, v?: View): CrewC => {
  const b = bodyAt(TT_SEGS, T);
  const pts: Record<string, V3> = {};
  let pose: Pose = {drop: 8, lean: 4, armR: {local: {r: 34, u: 176, f: 52}}, armL: {local: {r: -50, u: 150, f: 20}}, handL: 'relaxed', breath: 0.4};
  const walkArms: Pose = {armR: {local: {r: 32, u: 182, f: 56}}, armL: b.gait?.armL};
  pose = withWalk(b, pose, walkArms);
  if (!b.inWalk) pose = addPose(pose, weight(b));
  { const pw = palmLean(TT_CLIMB, T); pose = layer(pose, {lean: (pose.lean ?? 4) + 6 * pw, drop: (pose.drop ?? 0) + 16 * pw}); }
  // she looks up at the crest (him), up the slope, the summit, then the others; C6: the enemy
  const seq: [number, V3][] = [[37.9, {x: 1.3, y: 4.8, z: 1.35}], [TT.foot - 0.3, {x: -4.0, y: 3.2, z: -2.4}], [45.6, {x: -0.5, y: 5.8, z: -2.2}], [TT.top + 0.2, {x: 1.25, y: 4.9, z: 1.35}], [49.7, {x: -3, y: 3.5, z: 5}], [TT.reel - 0.15, {x: 0.3, y: 5.6, z: -1.9}], [TT.reelOff, {x: 1.2, y: 4.8, z: 1.4}], [TT.turn, ARMY_EYE],
    // R4 C6: she glances along the line, to the runner as his halligan spins (54.0), sights, then to the Director as he looks along the line
    [TR.flip - 0.12, runnerHead(T)], [TR.flip + 0.34, ARMY_EYE], [56.05, dirHeadAt(T)], [56.4, ARMY_EYE]];
  const a = lookSeq(b, T, seq, 0.4);
  pose = layer(pose, {twist: (pose.twist ?? 0) + a.twist, head: {yaw: a.yaw, pitch: a.pitch}});
  // C5b: the launcher hand drops to the reel on the same hip; the heel of the hand presses the lock
  const reelW = win(T, TT.reel - 0.22, TT.reelOff + 0.25, 0.22, 0.25);
  const press = win(T, TT.click - 0.06, TT.click + 0.16, 0.05, 0.1);
  if (reelW > 0) pose = blendPose(pose, layer(pose, {lean: 10, drop: 12, armR: {local: {r: 78, u: 184 - 7 * press, f: 10}, pole: {r: 1, u: 0.2, f: -0.5}}, armL: {local: {r: -48, u: 150, f: 26}}, handL: 'relaxed', head: {...pose.head, pitch: 30, yaw: 30}}), reelW);
  // C6: the launcher comes up to the ready (D1's carry: r30 u240 f90), the left hand under it; she sights along it
  // (head down to the sight) until their front breaks, then lifts her eye over it
  const ready = after(T, TT.ready, 0.45);
  const sight = win(T, TT.ready + 0.3, TD.threat + 0.15, 0.25, 0.3);
  if (ready > 0) pose = blendPose(pose, layer(pose, {drop: lerp(10, 18, after(T, TT.commit - 0.2, 0.5)), lean: 8 + 4 * sight, armR: {local: {r: 30, u: 240 + 14 * sight, f: 90}}, armL: {local: {r: -30, u: 220 + 10 * sight, f: 60}}, handL: 'open', head: {...pose.head, pitch: (pose.head?.pitch ?? 0) + 10 * sight, yaw: (pose.head?.yaw ?? 0) + 6 * sight}}), ready);
  const spool = 1 - 0.12 * press;
  pose.face = withEffort(faceKeys(T, TT_FACE), b);
  // (R4 C6: this one sets at their own moment, SET_T)
  { const cl = coil(T, SET_T.tether); if (cl > 0) pose = layer(pose, {drop: (pose.drop ?? 10) + 6 * cl, lean: (pose.lean ?? 8) + 3 * cl, breath: Math.max(pose.breath ?? 0.5, 0.9 * cl)}); }
  const eb = endBlend('tether', T, b.pos, b.heading, {...pose, handR: 'grip', holdR: tetherLauncher({loaded: true}), extra: hipReel(spool), dmg: dmgR2('tether', T)}, {footL: b.footL, footR: b.footR});
  let spec: FigSpec = {key: 'cTth', look: lookR2('tether'), t: T, seed: 3, pos: eb.pos, heading: eb.heading, pose: eb.pose, world: eb.world, gaze: lookAt(T, seq), gazeW: 0.8};
  spec = climbPalm(v, spec, TT_CLIMB, T, b, pts);
  pts.reel = fromLoc(b, {r: 74, u: 171 - (pose.drop ?? 0), f: 0});
  return {spec, body: b, pts};
};

// ================================================================== THE RUNNER (guesser)
// Out of the smoke at a sprint (C3), over the floor and up the bank, the vault over the wall on the terrace lip (left
// palm on its top edge, legs swing over to the right, lands, absorbs, recovers), then up the slope to his place a step
// at a time (quick, light steps; a palm on the rubble at the steepest). C6: the halligan spins once in his fist.
const RN_PATH: XZ[] = [{x: -18.5, z: 6.6}, {x: -14.5, z: 4.6}, {x: -11.5, z: 3.2}, {x: -9.0, z: 2.62}, {x: -7.2, z: 2.52}, {x: -6.1, z: 2.58}];
const RN_RUN0 = walkSeg(RN_PATH, TR.go, TR.takeoff, G_RUN, {A: 0.9, D: 0, k: 0.8});
// sync the stride so his LEFT foot is mid-stance at the take-off point
const RN_RUN: Extract<Seg, {kind: 'walk'}> = (() => {
  const Ls = RN_RUN0.path.Ls, duty = G_RUN.duty;
  const n = Math.round(Ls / G_RUN.stride + 0.5 - duty * 0.55);
  return {...RN_RUN0, gait: {...G_RUN, stride: Ls / (n - 0.5 + duty * 0.55)}};
})();
const RN_E = walkEnd(RN_RUN);
/** the vault (world keys): take-off on the left foot, the left palm on the top edge, hips over, right foot lands */
const GRIP = wallGrip(2.46);
const RN_G0 = gaitC(RN_RUN.path, RN_RUN.path.Ls, RN_RUN.gait);
const VAULT = (() => {
  const g0 = {x: RN_E.x, y: GC(RN_E.x, RN_E.z), z: RN_E.z};
  const land: V3 = onGC(-4.6, 2.8);
  const land2: V3 = onGC(-4.44, 2.5);
  const out: V3 = onGC(-4.45, 2.67);
  return {g0, land, land2, out};
})();
/** the vault's body keys: drop (rig units), roll (deg), heading */
const V_DROP: [number, number][] = [[TR.takeoff, 18], [TR.hand, 26], [TR.over, 40], [TR.release, 40], [TR.land, 42], [TR.land + 0.15, 76], [TR.land + 0.34, 62], [TR.rec, 30]];
const V_ROLL: [number, number][] = [[TR.takeoff, 0], [TR.hand, 20], [TR.over, 62], [TR.release, 50], [TR.land - 0.08, 30], [TR.land + 0.05, 8], [TR.land + 0.18, 0]];
/** the pelvis in the world: up off the take-off foot, over the edge to his right of the planted palm, down to land */
const vaultPelvis = (T: number): V3 => {
  const V = VAULT, P0 = add3(V.g0, {x: 0, y: (165 - 18) / 251.4, z: 0});
  return keyV([
    [TR.takeoff, P0],
    [TR.hand, {x: lerp(V.g0.x, GRIP.x, 0.55), y: GRIP.y + 0.3, z: lerp(V.g0.z, GRIP.z, 0.55) + 0.06}, (x: number) => x],
    [TR.over, {x: GRIP.x + 0.12, y: GRIP.y + 0.6, z: GRIP.z + 0.34}],
    [TR.release, {x: GRIP.x + 0.4, y: GRIP.y + 0.5, z: GRIP.z + 0.36}],
    [TR.land, {x: (V.land.x + V.land2.x) / 2 - 0.06, y: Math.max(V.land.y, V.land2.y) + (165 - 30) / 251.4, z: (V.land.z + V.land2.z) / 2}, easeIn],
    [TR.land + 0.14, {x: (V.land.x + V.land2.x) / 2 + 0.04, y: GC((V.land.x + V.land2.x) / 2, 2.65) + (165 - 76) / 251.4, z: 2.65}],
    [TR.rec, add3(V.out, {x: 0, y: (165 - 30) / 251.4, z: 0})],
  ], T);
};
/** a tucked foot of the rolled body (world): legs fold forward, the roll swings them out to his right and up */
const tuckFoot = (pel: V3, h: number, roll: number, side: -1 | 1, tuck: number): V3 => {
  const f = fwdOf(h), r = {x: Math.cos((h * Math.PI) / 180), z: Math.sin((h * Math.PI) / 180)};
  const th = (roll * Math.PI) / 180;
  const R = {x: r.x * Math.cos(th), y: Math.sin(th), z: r.z * Math.cos(th)};
  const D = {x: r.x * Math.sin(th), y: -Math.cos(th), z: r.z * Math.sin(th)};
  const reach = lerp(0.8, 0.38, tuck), fw = lerp(0.05, 0.36, tuck) + (side > 0 ? 0.06 : -0.02);
  return {x: pel.x + R.x * 0.13 * side + D.x * reach + f.x * fw, y: pel.y + R.y * 0.13 * side + D.y * reach, z: pel.z + R.z * 0.13 * side + D.z * reach + f.z * fw};
};
const vaultAt = (T: number): Body => {
  const V = VAULT;
  const heading = keyN([[TR.takeoff, RN_E.h], [TR.hand, 84], [TR.over, 70], [TR.land, 80], [TR.rec, 70]], T);
  const drop = keyN(V_DROP, T), roll = keyN(V_ROLL, T);
  const pel = vaultPelvis(T);
  const root = {x: pel.x, y: pel.y - (165 - drop) / 251.4, z: pel.z};
  const tuck = keyN([[TR.takeoff, 0], [TR.hand, 0.7], [TR.over, 1], [TR.release, 0.8], [TR.land - 0.06, 0.3], [TR.land, 0]], T);
  const tL = tuckFoot(pel, heading, roll, -1, tuck), tR = tuckFoot(pel, heading, roll, 1, tuck);
  // the left foot: planted for the take-off, then tucked; lands second. The right: swinging through, tucked, lands first
  // (the take-off foot pushes off as the body leaves it — it does not stay planted out of the leg's reach)
  const wL = T < TR.takeoff + 0.02 ? 0 : T < TR.hand + 0.06 ? smooth((T - (TR.takeoff + 0.02)) / (TR.hand + 0.04 - TR.takeoff)) : T < TR.land - 0.02 ? 1 : 1 - smooth((T - (TR.land - 0.02)) / 0.14);
  const fL0 = RN_G0.footL;
  const keepUp = (p: V3) => ({...p, y: Math.max(p.y, GC(p.x, p.z))});
  // (the left foot comes down onto its spot from where the tuck left it, on an arc above the rubble — no skimming)
  let footL: V3;
  const Ta = TR.land - 0.02;
  if (T < Ta) footL = add3(keepUp(lerp3(fL0, tL, wL)), {x: 0, y: 0.12 * Math.sin(Math.PI * Math.min(1, wL) * 0.5), z: 0});
  else {
    const pa = keyN(V_ROLL, Ta), pelA = vaultPelvis(Ta), hA = keyN([[TR.takeoff, RN_E.h], [TR.hand, 84], [TR.over, 70], [TR.land, 80], [TR.rec, 70]], Ta);
    const tuckA = keyN([[TR.takeoff, 0], [TR.hand, 0.7], [TR.over, 1], [TR.release, 0.8], [TR.land - 0.06, 0.3], [TR.land, 0]], Ta);
    const Pa = keepUp(tuckFoot(pelA, hA, pa, -1, tuckA));
    const e = smooth(clamp((T - Ta) / 0.14));
    const x = lerp(Pa.x, V.land2.x, e), z = lerp(Pa.z, V.land2.z, e);
    footL = {x, y: Math.max(lerp(Pa.y, V.land2.y, e) + 0.1 * Math.sin(Math.PI * e), GC(x, z) + 0.05 * (1 - e)), z};
  }
  const wR = T < TR.takeoff + 0.12 ? smooth((T - TR.takeoff) / 0.12) : T < TR.land - 0.13 ? 1 : 1 - smooth((T - (TR.land - 0.13)) / 0.13);
  const footR = keepUp(T < TR.land - 0.13 ? lerp3(RN_G0.footR, tR, wR) : lerp3(V.land, tR, wR));
  return {pos: root, heading, footL, footR, runK: 0, seg: 0, inWalk: false};
};
const RN_A = spotBehind('runner', 0.45);
const RN_UP: XZ[] = [{x: VAULT.out.x, z: VAULT.out.z}, {x: -3.6, z: 2.36}, {x: -2.6, z: 1.6}, {x: -1.6, z: 0.62}, {x: -0.7, z: -0.36}, {x: RN_A.x, z: RN_A.z}];
const RN_VSEG: Seg = {kind: 'fn', T0: TR.takeoff, at: vaultAt};
// (R4: no palm in the plan: R3's palm landed 7 cm from the left foot's hold, hand and foot on the same rock, and the step-up
// read as a stoop; the steep pair of steps at 44.1 is now the bound below, with its own palm ahead of the feet)
const RN_CLIMB = climbPlan(RN_UP, TR.rec, TR.arrive, {start: {pos: vaultAt(TR.rec).pos, heading: vaultAt(TR.rec).heading, footL: vaultAt(TR.rec).footL, footR: vaultAt(TR.rec).footR}, stepLen: 0.5, maxRise: 0.29, lead: 0.04, endHeading: 120});
const RN_C = afterClimb(RN_CLIMB);

// ---- the runner's bound over the steep rubble at 44.1 (R4): plant (both feet loaded, the left palm reaching ahead),
// push-off, clearance (both feet off the ground, knees tucked, the body arcing over the palm), landing (left foot, then the
// right, the knees compress) and recovery (up out of the squat into the next step). It replaces steps 7-8 of his climb
// (44.06-44.60): the same footholds at its ends (the left foot (−1.57, 0.40), the right (−1.14, 0.32)), so the steps
// after it are unchanged.
export const HOP = TH;
const sstep = (T: number, a: number, b: number) => smooth(clamp((T - a) / Math.max(1e-6, b - a)));
let HOPK: {a: Body; z: Body; H: V3} | null = null;
const hopEnds = () => {
  if (HOPK) return HOPK;
  const a = climbAt(RN_CLIMB, HOP.t0), z = climbAt(RN_CLIMB, HOP.t1);
  // the palm: ahead of the left foot's landing and a hand to its left, on the rubble that the right foot lands on next
  const f = fwdOf(z.heading), l = {x: -rightOfH(z.heading).x, z: -rightOfH(z.heading).z};
  const x = z.footL.x + f.x * 0.3 + l.x * 0.14, zz = z.footL.z + f.z * 0.3 + l.z * 0.14;
  HOPK = {a, z, H: {x, y: GC(x, zz) + 0.03, z: zz}};
  return HOPK;
};
const rightOfH = (h: number) => ({x: Math.cos((h * Math.PI) / 180), z: Math.sin((h * Math.PI) / 180)});
/** where the bound lands (left foot, right foot) */
export const hopLandings = (): {L: V3; R: V3} => ({L: hopEnds().z.footL, R: hopEnds().z.footR});
/** the palm's world point and weight (0 … 1) */
export const hopPalm = (T: number): {p: V3; w: number} => ({p: hopEnds().H, w: win(T, HOP.t0 + 0.02, HOP.palmOff + 0.09, HOP.palmOn - HOP.t0 - 0.02, 0.09)});
const hopAt = (T: number): Body => {
  const {a, z, H} = hopEnds();
  const k = HOP;
  // root: the weight rolls forward over the planted feet (gather), flies, lands, rolls on
  const f = 0.04 * sstep(T, k.t0, k.take) + 0.58 * sstep(T, k.take - 0.02, k.landL) + 0.24 * sstep(T, k.landL - 0.05, k.landR + 0.03) + 0.14 * sstep(T, k.landR, k.t1);
  const arc = 0.2 * Math.sin(Math.PI * clamp((T - k.take) / (k.landL - k.take + 0.02)));
  const pos: V3 = {x: lerp(a.pos.x, z.pos.x, f), y: lerp(a.pos.y, z.pos.y, f) + arc, z: lerp(a.pos.z, z.pos.z, f)};
  const heading = lerpAng(a.heading, z.heading, sstep(T, k.t0, k.t1));
  // feet: both leave on the push-off (the right, the rear-most push, last), tucked on an arc, the left lands first
  const eL = sstep(T, k.take, k.landL), eR = sstep(T, k.take + 0.025, k.landR);
  const foot = (p0: V3, p1: V3, e: number, lift: number): V3 => {
    const x = lerp(p0.x, p1.x, e), zq = lerp(p0.z, p1.z, e);
    return {x, y: Math.max(lerp(p0.y, p1.y, e) + lift * Math.sin(Math.PI * e), GC(x, zq) + 0.012), z: zq};
  };
  const footL = foot(a.footL, z.footL, eL, 0.26), footR = foot(a.footR, z.footR, eR, 0.3);
  // the pose: crouch (load), explode up, tuck over the palm, land (L), compress (R), up
  const drop = keyN([[k.t0, a.gait?.drop ?? 22], [k.load, 38], [k.take + 0.02, 12], [k.take + 0.1, 8], [k.landL - 0.03, 18], [k.landL + 0.045, 40], [k.landR + 0.01, 50], [k.landR + 0.13, 30], [k.t1, z.gait?.drop ?? 22]], T);
  const lean = keyN([[k.t0, a.gait?.lean ?? 17], [k.load, 25], [k.take + 0.04, 33], [k.landL, 38], [k.landR, 36], [k.landR + 0.12, 30], [k.t1, z.gait?.lean ?? 24]], T);
  const side = 4 * Math.sin(Math.PI * clamp((T - k.take) / (k.landR - k.take)));
  const g: Pose = {
    drop, lean, side, breath: 0.85,
    armL: {fk: {fwd: lerp(30, 62, sstep(T, k.t0, k.palmOn)), out: 14, bend: 22}},
    armR: {fk: {fwd: lerp(-10, 12, sstep(T, k.take, k.landR)), out: 24, bend: 40}},
    legL: {pitch: lerp(0, 26, sstep(T, k.take, k.landL - 0.04)) * (1 - sstep(T, k.landL - 0.04, k.landL + 0.02))},
    legR: {pitch: lerp(0, 30, sstep(T, k.take + 0.02, k.landR - 0.04)) * (1 - sstep(T, k.landR - 0.04, k.landR + 0.02))},
  };
  void H;
  const gait = blendPose(blendPose(a.gait ?? g, g, sstep(T, k.t0, k.t0 + 0.07)), z.gait ?? g, sstep(T, k.t1 - 0.12, k.t1));
  return {pos, heading, footL, footR, gait, runK: 1, seg: 0, inWalk: true, slope: 0.6, swingL: 1 - eL > 0.01 && eL > 0 ? 1 : 0, swingR: 1 - eR > 0.01 && eR > 0 ? 1 : 0, climb: 0.85};
};
const RN_CLIMB_SEG: Seg = {kind: 'fn', T0: RN_CLIMB.T0, at: (T: number) => (T > HOP.t0 && T < HOP.t1 ? hopAt(T) : climbAt(RN_CLIMB, T))};
const RN_SEGS: Seg[] = [
  RN_RUN,
  RN_VSEG,
  RN_CLIMB_SEG,
  commitStand('runner', [RN_C.key, [46.45, RN_A.x, RN_A.z, 120], [47.75, RN_A.x, RN_A.z, 205], [TR.turn, RN_A.x, RN_A.z, 205], [54.15, RN_A.x, RN_A.z, RN_A.h]], TR.commit, TR.commitEnd, {half: 0.14, stag: 0.05, turnStep: 65, start: RN_C.start}),
];
const runnerHead = (T: number): V3 => headOf(bodyAt(RN_SEGS, T), 1.4);
export const VAULT_GRIP = GRIP;
const RN_FACE: FK = [
  [38.4, F.effort], [TR.land + 0.12, expr('effort', 1, {mouth: 'pant', open: 0.3})], [TR.rec + 0.1, expr('concentration', 1, {brows: -0.75})],
  [TR.arrive, exprMix('effort', 'recognition', 0.65)], [47.6, F.alert], [50.3, exprMix('recognition', 'relief', 0.5)],
  [TR.turn, F.resolve], [TR.flip, expr('resolve', 1, {mouth: 'grit', squint: 0.35})], [54.8, F.resolve], [57.2, RESOLVE_HARD], [TR.commit, F.effort],
];
export const runnerC = (T: number, v?: View): CrewC => {
  const b = bodyAt(RN_SEGS, T);
  const pts: Record<string, V3> = {};
  const inVault = T >= TR.takeoff && T < TR.rec;
  let pose: Pose = {drop: 10, lean: 6, armR: {local: {r: 40, u: 200, f: 50}}, armL: {local: {r: -50, u: 150, f: 24}}, handL: 'relaxed', breath: 0.6};
  const walkArms: Pose = {armR: {local: {r: 40, u: 216, f: 64}}, armL: b.gait?.armL};
  pose = withWalk(b, pose, walkArms);
  if (!b.inWalk && !inVault) pose = addPose(pose, weight(b));
  { const pw = palmLean(RN_CLIMB, T); pose = layer(pose, {lean: (pose.lean ?? 6) + 6 * pw, drop: (pose.drop ?? 0) + 16 * pw}); }
  let shadow = 1;
  if (inVault) {
    // the body: a forward reach at the take-off, rolls over the planted left arm (legs swing up to his right), unrolls
    // to land, absorbs low, comes up and climbs on
    const roll = keyN(V_ROLL, T);
    const drop = keyN(V_DROP, T);
    const lean = keyN([[TR.takeoff, 18], [TR.hand, 32], [TR.over, 26], [TR.land, 12], [TR.land + 0.14, 34], [TR.rec, 20]], T);
    pose = {
      ...pose, drop, lean, bodyRoll: roll, twist: keyN([[TR.takeoff, 0], [TR.over, -14], [TR.land, 6], [TR.rec, 0]], T),
      // the right hand (the halligan) up and out for balance
      armR: {local: {r: 78, u: lerp(260, 330, win(T, TR.hand, TR.land, 0.12, 0.2)), f: 30}, pole: {r: 1, u: -0.3, f: -0.4}},
      armL: {local: {r: -40, u: 240, f: 110}},
      legL: {pitch: -20}, legR: {pitch: -10},
      handL: T < TR.release + 0.05 && T > TR.takeoff + 0.02 ? 'brace' : 'open',
      head: {pitch: T < TR.over ? 18 : 6, yaw: T < TR.over ? -10 : 8},
    };
    // the recovery blends into the climb's first step (no pop at TR.rec)
    const k = smooth(clamp((T - (TR.rec - 0.22)) / 0.22));
    if (k > 0) {
      const g = climbAt(RN_CLIMB, T).gait ?? {};
      pose = blendPose(pose, {...pose, ...g, bodyRoll: 0, twist: 0, armR: walkArms.armR, armL: g.armL, handL: 'relaxed', head: {pitch: 0, yaw: 0}}, k);
    }
    if (T > TR.hand - 0.02 && T < TR.land + 0.02) shadow = 0;
  }
  // eyes: the wall, then where he lands, up the slope, the crest; standing: the others; C6: the enemy
  const seq: [number, V3][] = [[39.3, {x: -5.4, y: 2.2, z: 2.6}], [TR.rec, {x: -1.2, y: 4.2, z: 0.2}], [44.6, {x: 0.3, y: 5.0, z: -1.0}], [TR.arrive, {x: 1.25, y: 4.9, z: 1.35}], [47.2, {x: -3.8, y: 3.5, z: 4.5}], [50.3, {x: 1.25, y: 4.9, z: 1.35}], [TR.turn, ARMY_EYE],
    // R4 C6: after the bar is caught he looks along the line to the Director (is he ready?), then to the tether, then the army
    [TR.flip + 0.55, dirHeadAt(T)], [54.95, tetherHead(T)], [55.3, ARMY_EYE]];
  const a = inVault ? {yaw: pose.head?.yaw ?? 0, pitch: pose.head?.pitch ?? 0, twist: 0} : lookSeq(b, T, seq, 0.4);
  if (!inVault) pose = layer(pose, {twist: (pose.twist ?? 0) + a.twist, head: {yaw: a.yaw, pitch: a.pitch}});
  // C6: the ready (D1's carry: halligan in the right fist, braced), the bar spins once in his fist and he catches it
  const ready = after(T, TR.turn + 0.3, 1.0);
  // (the bar is carried low at his right hip, clear of his face, until the end blend lifts it into D1's carry)
  if (ready > 0) pose = blendPose(pose, layer(pose, {drop: lerp(12, 20, after(T, TR.commit - 0.2, 0.5)), lean: 9, armL: {local: {r: -18, u: 250, f: 100}, pole: {r: -1, u: -0.4, f: -0.2}}, armR: {local: {r: 60, u: 190, f: 52}}, handL: 'fist'}), ready);
  const flipK = clamp((T - TR.flip) / 0.42);
  const flipAng = 72 + 360 * (flipK <= 0 ? 0 : flipK >= 1 ? 1 : 1 - Math.pow(1 - flipK, 2.2));
  const flipLift = win(T, TR.flip - 0.12, TR.flip + 0.55, 0.12, 0.2);
  if (flipLift > 0) pose = layer(pose, {armR: {local: {r: 60, u: 190 + 50 * flipLift, f: 52 + 30 * flipLift}}});
  pose.face = withEffort(faceKeys(T, RN_FACE), b, inVault ? 0 : 0.6);
  const grip = flipK > 0.05 && flipK < 0.9 ? 'open' as const : 'grip' as const;
  // (R4 C6: this one sets at their own moment, SET_T)
  { const cl = coil(T, SET_T.runner); if (cl > 0) pose = layer(pose, {drop: (pose.drop ?? 10) + 6 * cl, lean: (pose.lean ?? 8) + 3 * cl, breath: Math.max(pose.breath ?? 0.5, 0.9 * cl)}); }
  const eb = endBlend('runner', T, b.pos, b.heading, {...pose, shadow, handR: grip, holdR: halligan1({ang: flipAng}), dmg: dmgR2('runner', T)}, {footL: b.footL, footR: b.footR});
  let spec: FigSpec = {key: 'cRun', look: lookR2('runner'), t: T, seed: 4, pos: eb.pos, heading: eb.heading, pose: eb.pose, world: eb.world, reach: !inVault, ...(inVault ? {} : {gaze: lookAt(T, seq), gazeW: 0.8})};
  // the vault contact: the left palm on the top edge, from the reach to the release
  const gripW = inVault ? win(T, TR.takeoff - 0.04, TR.release + 0.06, 0.1, 0.06) : 0;
  if (gripW > 0) spec = handTo(v, spec, 'L', GRIP, gripW, {palm: {x: 0, y: -1, z: 0}, fingers: {x: 0.85, y: -0.2, z: -0.45}});
  spec = climbPalm(v, spec, RN_CLIMB, T, b, pts);
  // the bound's palm (R4): the left palm planted on the rubble ahead of the landing feet while he swings over it
  { const hp = hopPalm(T); if (hp.w > 0.001) { pts.palmL = hp.p; spec = handTo(v, {...spec, pose: layerFn(spec.pose, {handL: 'brace'} as Pose)}, 'L', hp.p, hp.w, palmDown(b.heading)); } }
  pts.grip = GRIP; pts.land = VAULT.land; pts.land2 = VAULT.land2;
  pts.shadow = {x: b.pos.x, y: GC(b.pos.x, b.pos.z), z: b.pos.z};
  return {spec, body: b, pts};
};
export const RUNNER_SHADOW = (T: number) => T > TR.hand - 0.02 && T < TR.land + 0.02;

// ================================================================== THE BREAKER (honest)
// Out of the smoke behind the tether operator (C2/C3), the tool in his right hand; at the foot of the north side he
// climbs, a step at a time, heavy, his left palm on the rubble at the two steep banks; over the crest to the Director's
// right side; his left hand on the Director's right shoulder (C5a); round behind him to his place, the tool up in both
// hands; C6b: he opens the valve — the gauge needle swings up, the tank hisses.
const BK_FLAT: XZ[] = [{x: -18.4, z: -0.3}, {x: -15.4, z: -0.5}, {x: -12.0, z: -0.7}, {x: -8.6, z: -0.62}];
const BK_WALK = walkSeg(BK_FLAT, TB2.go, TB2.foot, G_HEAVY, {A: 0.8, D: 0.45});
const BK_TOUCH = {x: 1.42, z: 0.6}; // at the Director's right side: clear of him in C5a's frame, his arm across onto the shoulder
const BK_UP: XZ[] = [{x: -8.6, z: -0.62}, {x: -7.0, z: -0.62}, {x: -5.6, z: -1.05}, {x: -3.8, z: -1.12}, {x: -2.25, z: -1.0}, {x: -1.3, z: -0.82}, {x: -0.38, z: -0.42}, {x: 0.6, z: -0.05}, BK_TOUCH];
const BK_CLIMB = climbFrom([BK_WALK], BK_UP, TB2.foot, TB2.arrive, {stepLen: 0.5, maxRise: 0.27, autoHands: {side: 'L', n: 2, minRise: 0.25, fwd: 0.04, out: 0.18}, endHeading: 196});
const BK_C = afterClimb(BK_CLIMB);
const BK_A = spotBehind('breaker', 0.7, 0.2); // on the crest's top: his commit steps down off its edge
const BK_ROUND: XZ[] = [BK_TOUCH, {x: 1.82, z: 0.95}, {x: 2.2, z: 1.45}, {x: 1.9, z: 2.4}, {x: 1.2, z: 2.95}, {x: BK_A.x, z: BK_A.z}];
const BK_STAND1 = standSeg([BK_C.key, [TB2.go2, BK_C.key[1], BK_C.key[2], 196]], {half: 0.16, stag: 0.05, turnStep: 70, start: BK_C.start});
const BK_CLIMB2 = climbFrom([BK_STAND1], BK_ROUND, TB2.go2, TB2.arrive2, {stepLen: 0.5, maxRise: 0.27, lead: 0.08, endHeading: 260});
const BK_C2 = afterClimb(BK_CLIMB2);
const BK_SEGS: Seg[] = [
  BK_WALK,
  climbSeg(BK_CLIMB),
  BK_STAND1,
  climbSeg(BK_CLIMB2),
  commitStand('breaker', [BK_C2.key, [TB2.turn, BK_A.x, BK_A.z, 260], [54.35, BK_A.x, BK_A.z, BK_A.h]], TB2.commit, TB2.commitEnd, {half: 0.16, stag: 0.05, turnStep: 65, start: BK_C2.start}),
];
const breakerHead = (T: number): V3 => headOf(bodyAt(BK_SEGS, T), 1.6);
/** the two-handed port, carried a little lower than D1's (r −16 u 250 f 118 / r 32 u 205 f 34) so the ram head stays
 * clear of his face from the front; it rises into D1's at the cut (endBlend) */
const PORT = {front: {r: -18, u: 208, f: 110}, back: {r: 30, u: 186, f: 26}};
/** C6b: the tool down across his hips, the tank turned up to him, while he opens the valve */
const VALVE = {front: {r: -26, u: 168, f: 92}, back: {r: 28, u: 182, f: 18}};
const BK_FACE: FK = [
  [38.2, F.concentration], [TB2.foot, expr('effort', 0.7)], [TB2.arrive - 0.2, exprMix('effort', 'recognition', 0.5)],
  [TB2.touch - 0.1, F.relief], [TB2.touchOff + 0.05, expr('recognition', 0.5, {mouth: 'soft'})], [TB2.go2 + 0.3, F.concentration],
  [TB2.turn, F.resolve], [TB2.charge - 0.1, expr('concentration', 1, {lookY: 0.5})], [TB2.charged, expr('resolve', 1, {squint: 0.4})],
  [57.2, RESOLVE_HARD], [TB2.commit, F.effort],
];
export const breakerC = (T: number, v?: View, dir?: FigSpec): CrewC => {
  const b = bodyAt(BK_SEGS, T);
  const pts: Record<string, V3> = {};
  const charge = keyN([[TB2.charge, 0.35], [TB2.charged, 1]], T);
  const gauge = Math.min(toolsR2('breaker', T).gauge ?? 1, charge);
  const twoH = T >= 52.0;
  // carrying: the tool hangs from his right hand (the arm straight, pulled down a little by the weight)
  let pose: Pose = {drop: 12, lean: 6, side: -3, armR: {local: {r: 70, u: 132, f: 22}, pole: {r: 1, u: 0, f: -0.4}}, armL: {local: {r: -52, u: 150, f: 24}}, handL: 'relaxed', breath: 0.6};
  const walkArms: Pose = {armR: {local: {r: 70, u: 136, f: 30}, pole: {r: 1, u: 0, f: -0.4}}, armL: b.gait?.armL, side: -4};
  pose = withWalk(b, pose, walkArms);
  if (!b.inWalk) pose = addPose(pose, weight(b));
  { const pw = Math.max(palmLean(BK_CLIMB, T), palmLean(BK_CLIMB2, T)); pose = layer(pose, {lean: (pose.lean ?? 6) + 6 * pw, drop: (pose.drop ?? 0) + 16 * pw}); }
  const seq: [number, V3][] = [[39.0, {x: 1.3, y: 4.8, z: 1.35}], [TB2.foot - 0.3, {x: -4.5, y: 2.6, z: -1.1}], [45.5, {x: -1.2, y: 4.4, z: -0.8}], [47.3, {x: 1.25, y: 4.9, z: 1.35}], [TB2.touch - 0.1, {x: 1.2, y: 4.95, z: 1.4}], [TB2.touchOff + 0.1, {x: -2.5, y: 3.6, z: 4.5}], [TB2.go2 + 0.3, {x: 1.0, y: 4.4, z: 3.6}], [TB2.turn, ARMY_EYE],
    // R4 C6: a look to the Director before he opens the valve (the nod: go on), down to the gauge, then the army, then the pilot
    [54.62, dirHeadAt(T)], [54.88, ARMY_EYE], [TB2.charge - 0.1, {x: BK_A.x + 0.5, y: 4.6, z: BK_A.z + 0.2}], [TB2.charged + 0.1, ARMY_EYE]];
  const a = lookSeq(b, T, seq, 0.4);
  pose = layer(pose, {twist: (pose.twist ?? 0) + a.twist, head: {yaw: a.yaw, pitch: a.pitch}});
  // the port (two hands) from 52.0 (he lifts it as he goes round)
  if (twoH) pose = blendPose(pose, layer(pose, {armL: {local: PORT.front}, armR: {local: PORT.back}, side: 0}), after(T, 52.0, 0.5));
  const ready = after(T, TB2.turn + 0.3, 1.0);
  if (ready > 0) pose = blendPose(pose, layer(pose, {drop: lerp(14, 22, after(T, TB2.commit - 0.2, 0.5)), lean: 10}), ready);
  // the charge: the tool kicks in his hands as the tank fills (a jolt down the line of the tool), he takes the weight
  const kick = T > TB2.charged - 0.05 ? Math.exp(-(T - TB2.charged + 0.05) * 9) * Math.sin(Math.min(Math.PI, (T - TB2.charged + 0.05) * 14)) : 0;
  pose = layer(pose, {drop: (pose.drop ?? 12) + 6 * kick});
  pose.face = withEffort(faceKeys(T, BK_FACE), b);
  // C6b: the tool comes down across his hips, he opens the valve (head down to the gauge), the kick, back up to the port
  const valve = win(T, TB2.charge - 0.4, TB2.charged + 0.35, 0.3, 0.35);
  const lp = (a: {r: number; u: number; f: number}, c: {r: number; u: number; f: number}) => ({r: lerp(a.r, c.r, valve), u: lerp(a.u, c.u, valve) - 6 * kick, f: lerp(a.f, c.f, valve)});
  const portL = fromLoc(b, lp(PORT.front, VALVE.front)), portR = fromLoc(b, lp(PORT.back, VALVE.back));
  if (valve > 0) pose = layer(pose, {head: {...pose.head, pitch: (pose.head?.pitch ?? 0) + 24 * valve * (1 - after(T, TB2.charged, 0.2))}, lean: (pose.lean ?? 10) + 6 * valve});
  const tool = twoH ? {handL: 'grip' as const, handR: 'grip' as const, twoHanded: true, extra: breaker({back: 1, front: 0, gauge, recoil: 0.4 * kick})} : {handR: 'grip' as const, holdR: breakerCarry({gauge})};
  const world0: FigSpec['world'] = {footL: b.footL, footR: b.footR, ...(twoH ? {handL: portL, handR: portR} : {})};
  // (R4 C6: this one sets at their own moment, SET_T)
  { const cl = coil(T, SET_T.breaker); if (cl > 0) pose = layer(pose, {drop: (pose.drop ?? 10) + 6 * cl, lean: (pose.lean ?? 8) + 3 * cl, breath: Math.max(pose.breath ?? 0.5, 0.9 * cl)}); }
  const eb = endBlend('breaker', T, b.pos, b.heading, {...pose, ...tool, dmg: dmgR2('breaker', T)}, world0);
  let spec: FigSpec = {key: 'cBrk', look: lookR2('breaker'), t: T, seed: 7, pos: eb.pos, heading: eb.heading, pose: eb.pose, world: eb.world, gaze: lookAt(T, seq), gazeW: 0.8};
  if (twoH && after(T, 52.0, 0.5) < 1 && v) {
    // (the hands rise into the port from wherever they were)
    const k = after(T, 52.0, 0.5);
    const pre = figureRig(v, {...spec, world: {footL: b.footL, footR: b.footR}});
    spec = {...spec, world: {...spec.world, handL: lerp3(pre.handL, portL, k), handR: lerp3(pre.handR, portR, k)}};
  }
  // the climbs: his left palm on the rubble, the push up
  spec = climbPalm(v, spec, BK_CLIMB, T, b, pts);
  // C5a: his left hand onto the Director's right shoulder (the shoulder's owner is solved first; see rig handOn); he
  // leans in to it, the left shoulder forward
  // (R4: the reach starts 0.5 s before the touch and arrives ON it (R3's hand covered 0.8 m in 0.2 s at 5 m/s and left at 7-11 m/s)
  const tw = win(T, TB2.touch - 0.5, TB2.touchOff + 0.32, 0.5, 0.32);
  if (tw > 0 && v && dir) {
    const p0 = typeof spec.pose === 'function' ? spec.pose : null;
    const lean = (q: Pose): Pose => ({...q, lean: (q.lean ?? 6) + 9 * tw, twist: (q.twist ?? 0) - 12 * tw, handL: 'brace'});
    const s2: FigSpec = {...spec, pose: p0 ? (Fr: FigFrame) => lean(p0(Fr) as Pose) : lean((spec.pose ?? {}) as Pose)};
    spec = handOn(v, dir, {r: SH_X - 10, u: SH_H + 12, f: -2}, s2, 'L', tw, {palm: {x: 0, y: -1, z: 0}, fingers: {...fwdOf(b.heading + 30), y: -0.5}, w: 0.85});
  }
  pts.gauge = fromLoc(b, PORT.back);
  return {spec, body: b, pts};
};

// ================================================================== THE THREE FROM THE EDGE OF THE STREET (C4)
// The drone pilot (checker): the drone in her left hand, the controller in her right; up the bank out of the street a
// step at a time; she stops on the slope, holds the drone up on her palm, the rotors spin up and it lifts off; her
// hands come together on the controller; up the slope (eyes on the drone), over the slab in the crest notch; she
// stands on its east edge; C6b: she sends the drone out ahead of them; the commit: down off the slab into the line.
const DR_FLAT: XZ[] = [{x: -11.6, z: 11.2}, {x: -9.2, z: 8.6}, {x: -7.6, z: 7.45}];
const DR_WALK = walkSeg(DR_FLAT, T3.go, T3.pilotFoot, G_HURRY, {A: 0.7, D: 0.4});
const DR_UP: XZ[] = [{x: -7.6, z: 7.45}, {x: -6.6, z: 6.75}, {x: -5.6, z: 6.0}, {x: -4.9, z: 5.5}];
const DR_CLIMB = climbFrom([DR_WALK], DR_UP, T3.pilotFoot, T3.launch, {stepLen: 0.48, maxRise: 0.26}); // (she stops facing up the bank)
const DR_C = afterClimb(DR_CLIMB);
const DR_E = DR_CLIMB.end;
const DR_STAND = standSeg([DR_C.key, [T3.pilotGo, DR_E.x, DR_E.z, DR_E.h]], {half: 0.14, stag: 0.08, start: DR_C.start});
const DR_A = {x: 0.52, z: 1.98, h: 128}; // on the slab's east edge (above her start, which is a step down off it)
const DR_UP2: XZ[] = [{x: DR_E.x, z: DR_E.z}, {x: -3.9, z: 4.4}, {x: -2.6, z: 3.3}, {x: -1.45, z: 2.45}, {x: -0.62, z: 2.05}, {x: -0.1, z: 1.95}, {x: DR_A.x, z: DR_A.z}];
const DR_CLIMB2 = climbFrom([DR_STAND], DR_UP2, T3.pilotGo, T3.arrivePilot, {stepLen: 0.48, maxRise: 0.27, lead: 0.12, endHeading: 100});
const DR_C2 = afterClimb(DR_CLIMB2);
const DR_SEGS: Seg[] = [
  DR_WALK,
  climbSeg(DR_CLIMB),
  DR_STAND,
  climbSeg(DR_CLIMB2),
  commitStand('drone', [DR_C2.key, [T3.turnPilot, DR_A.x, DR_A.z, 100], [54.55, DR_A.x, DR_A.z, DR_A.h]], T3.commitP, T3.commitPEnd, {half: 0.13, stag: 0.04, turnStep: 65, start: DR_C2.start}),
];
const pilotHead = (T: number): V3 => headOf(bodyAt(DR_SEGS, T), 1.5);
/** the drone in her left hand (carried at her side; held up on the palm at the launch) — body-local, view-free */
const CARRY = {r: -40, u: 168, f: 34};
// R4: the hold is OUT to her left (0.7 m off her axis) at shoulder height plus a hand: the drone's 0.6 m span then clears her
// head (R3 held it at head height 0.5 m out, and on C4b's lens the hand/arm and the rotor arms crossed her glasses for ~10
// frames). It leaves the palm straight up, beside her face, never across it.
export const HOLD_UP = {r: -190, u: 385, f: -10};
/** the left hand's body-local target from the carry up and out to the hold, the hold (the palm under the drone until it
 * leaves it at T3.lift), then lowered to the controller (continuous: one function for the whole launch) */
const CTRL_L = {r: -22, u: 198, f: 74};
const droneHandLoc = (T: number) => {
  // out to the side first, then up: the hand is already 0.5 m off her axis when it passes head height
  const out = keyN([[T3.launch - 0.42, 0], [T3.launch - 0.06, 1]], T);
  const up = keyN([[T3.launch - 0.2, 0], [T3.spin - 0.08, 1]], T);
  const hold = {r: lerp(CARRY.r, HOLD_UP.r, out), u: lerp(CARRY.u, HOLD_UP.u, up), f: lerp(CARRY.f, HOLD_UP.f, up)};
  // after the lift-off: the palm stays a beat under the rising drone, then the arm lowers (down first, then in)
  const lo = after(T, T3.lift + 0.1, 0.45);
  return {r: lerp(hold.r, CTRL_L.r, lo * lo), u: lerp(hold.u, CTRL_L.u, lo), f: lerp(hold.f, CTRL_L.f, lo * lo)};
};
const pilotPalm = (T: number): V3 => fromLoc(bodyAt(DR_SEGS, T), droneHandLoc(T));
/** the drone's flight: carried until it lifts off her palm; up, out over the slope, past the summit (C5b), over the
 * group; from 56 on it follows D1's keys (D1/crew.tsx ALLY_KEYS), so the charge picks it up where C leaves it */
let DKEYS: [number, number, number, number][] | null = null;
const droneFlightKeys = () => {
  if (DKEYS) return DKEYS;
  const P0 = add3(pilotPalm(T3.lift), {x: 0, y: 0.1, z: 0});
  DKEYS = [
    [T3.lift, P0.x, P0.y, P0.z], [48.2, P0.x + 0.05, P0.y + 0.75, P0.z - 0.05], [48.9, P0.x + 0.3, P0.y + 1.9, P0.z - 0.35],
    [49.9, -3.1, 5.0, 1.0], [50.9, -1.0, 5.55, -0.7], [TDR.past, 1.0, 6.45, -2.05], [52.5, 2.1, 7.35, -1.35], [54.0, 2.1, 7.0, -0.2],
    ...ALLY_KEYS.filter((k) => k[0] >= 56 && k[0] <= M.CHARGE + 4),
  ];
  return DKEYS;
};
/** the allied drone's pose at T (carried → flying) */
export const droneC = (T: number): DronePose => {
  if (T < T3.lift) {
    const b = bodyAt(DR_SEGS, T);
    return {pos: add3(pilotPalm(T), {x: 0, y: 0.1, z: 0}), heading: b.heading, pitch: 0, roll: 0, speed: 0};
  }
  return droneKeys(T, droneFlightKeys(), undefined, 3);
};
export const DRONE_SPIN = T3.spin;
const droneBody = (T: number): V3 => droneC(T).pos;
const DR_FACE: FK = [
  [42.4, F.concentration], [T3.pilotFoot, expr('effort', 0.6)], [T3.launch - 0.1, expr('concentration', 1, {lookY: -0.4})],
  [T3.lift, expr('alert', 0.8)], [T3.ctrl + 0.1, F.concentration], [T3.arrivePilot - 0.2, exprMix('concentration', 'recognition', 0.5)],
  [T3.turnPilot, F.resolve], [T3.thumbs, expr('concentration', 1, {squint: 0.45})], [56.5, F.resolve], [57.2, RESOLVE_HARD], [T3.commitP, F.effort],
];
export const pilotC = (T: number, v?: View): CrewC => {
  const b = bodyAt(DR_SEGS, T);
  const pts: Record<string, V3> = {};
  const hasDrone = T < T3.lift + 0.45; // (the hand follows the drone's launch: its palm orientation fades out as it lowers)
  const ctrl2 = T >= T3.ctrl;
  let pose: Pose = {drop: 8, lean: 4, armR: {local: {r: 40, u: 196, f: 54}}, armL: {local: CARRY}, handL: 'open', handR: 'grip', breath: 0.5};
  const walkArms: Pose = {armR: {local: {r: 38, u: 200, f: 60}}, armL: {local: CARRY}};
  pose = withWalk(b, pose, walkArms);
  if (!b.inWalk) pose = addPose(pose, weight(b));
  // the launch (R4): the drone out to her left and up on her palm; the rotors spin; it leaves the palm straight up, beside her
  // face; the hand holds a beat under it, lowers down her side and comes in to the controller (one continuous path)
  pose = layer(pose, {armL: {local: droneHandLoc(T)}});
  // the controller in both hands (held low at her chest, so a low lens still sees her face over it); the thumbs work as
  // she sends the drone out (the hands tip forward)
  const thumbs = win(T, T3.thumbs - 0.1, T3.thumbs + 0.55, 0.12, 0.2);
  if (ctrl2) pose = blendPose(pose, layer(pose, {armL: {local: {r: -22, u: 198 + 8 * thumbs, f: 74 + 10 * thumbs}}, armR: {local: {r: 22, u: 198 + 8 * thumbs, f: 74 + 10 * thumbs}}}), after(T, T3.ctrl, 0.25));
  const seq: [number, V3][] = [[44.3, {x: 0, y: 4.4, z: 2.0}], [T3.pilotFoot - 0.2, {x: -5.2, y: 2.4, z: 5.6}], [T3.launch - 0.2, droneBody(T)], [T3.pilotGo + 0.4, {x: 0.0, y: 4.6, z: 2.0}], [50.4, droneBody(T)], [52.3, {x: 0.2, y: 4.1, z: 2.25}], [52.9, {x: 1.25, y: 4.9, z: 1.35}], [53.6, ARMY_EYE], [T3.thumbs - 0.15, droneBody(T)], [56.6, ARMY_EYE]];
  // (R4 C6: a glance at the tablet waking beside her, before the drone goes out)
  seq.splice(8, 0, [T3.tablet - 0.05, decoyHeadAt(T)], [T3.tablet + 0.4, ARMY_EYE]);
  const a = lookSeq(b, T, seq, 0.35, {lim: 80});
  pose = layer(pose, {twist: (pose.twist ?? 0) + a.twist, head: {yaw: a.yaw, pitch: a.pitch}});
  const ready = after(T, T3.turnPilot + 0.3, 1.0);
  if (ready > 0) pose = blendPose(pose, layer(pose, {drop: lerp(8, 12, after(T, T3.commitP - 0.2, 0.5)), lean: 8}), ready);
  pose.face = withEffort(faceKeys(T, DR_FACE), b, 0.5);
  const tool = ctrl2 ? {handL: 'grip' as const, handR: 'grip' as const, twoHanded: true, extra: controller({lit: 1})} : {handR: 'grip' as const, holdR: controllerHold({lit: 1}), handL: 'open' as const};
  // (R4 C6: this one sets at their own moment, SET_T)
  { const cl = coil(T, SET_T.drone); if (cl > 0) pose = layer(pose, {drop: (pose.drop ?? 10) + 6 * cl, lean: (pose.lean ?? 8) + 3 * cl, breath: Math.max(pose.breath ?? 0.5, 0.9 * cl)}); }
  const eb = endBlend('drone', T, b.pos, b.heading, {...pose, ...tool, dmg: dmgR2('drone', T)}, {footL: b.footL, footR: b.footR});
  let spec: FigSpec = {key: 'cDrn', look: lookR2('drone'), t: T, seed: 5, pos: eb.pos, heading: eb.heading, pose: eb.pose, world: eb.world, gaze: lookAt(T, seq), gazeW: 0.8};
  // the drone sits on her palm: the hand's world point is the drone's underside (the same path as the pose's target: the
  // palm-up orientation holds until it lifts off, then fades as the hand lowers)
  if (hasDrone) {
    const palm = pilotPalm(T);
    spec = handTo(v, spec, 'L', palm, 1, {palm: {x: 0, y: 1, z: 0}, fingers: {...fwdOf(b.heading), y: 0}, w: keyN([[T3.launch - 0.3, 0.3], [T3.spin, 1], [T3.lift + 0.1, 1], [T3.lift + 0.45, 0]], T)});
    pts.palm = palm;
  }
  return {spec, body: b, pts};
};

// The flare carrier (host): the satchel of flares and canisters on his left hip, his right hand on its strap at his
// chest while he climbs (it keeps the bag from swinging); C6b: his left hand on the satchel, the flares counted.
const FL_FLAT: XZ[] = [{x: -12.0, z: 13.0}, {x: -9.6, z: 10.4}, {x: -7.6, z: 9.1}];
const FL_WALK = walkSeg(FL_FLAT, T3.go - 0.3, T3.flaresFoot, G_HURRY, {A: 0.7, D: 0.4});
const FL_A = spotBehind('flares', 0.4, 0.2);
// (R3: the climb passes 1.4 m or more behind the pilot's launch spot, not 0.6 m: on C4b's lens his head sat on hers)
const FL_UP: XZ[] = [{x: -7.6, z: 9.1}, {x: -6.0, z: 7.6}, {x: -4.35, z: 6.95}, {x: -3.05, z: 5.45}, {x: -2.0, z: 4.72}, {x: -0.6, z: 4.6}, {x: FL_A.x, z: FL_A.z}];
const FL_CLIMB = climbFrom([FL_WALK], FL_UP, T3.flaresFoot, T3.arriveFlares, {stepLen: 0.5, maxRise: 0.27, autoHands: {side: 'L', n: 1, minRise: 0.25, fwd: 0.04, out: 0.18}, endHeading: 80});
const FL_C = afterClimb(FL_CLIMB);
const FL_SEGS: Seg[] = [
  FL_WALK,
  climbSeg(FL_CLIMB),
  commitStand('flares', [FL_C.key, [52.55, FL_A.x, FL_A.z, 338], [T3.turnFlares, FL_A.x, FL_A.z, 338], [54.5, FL_A.x, FL_A.z, FL_A.h]], T3.commitF, T3.commitFEnd, {half: 0.15, stag: 0.05, turnStep: 70, start: FL_C.start}),
];
const FL_FACE: FK = [
  [42.1, F.concentration], [T3.flaresFoot, expr('effort', 0.7)], [T3.arriveFlares - 0.2, exprMix('effort', 'recognition', 0.6)],
  [52.6, F.concentration], [T3.turnFlares, F.resolve], [T3.satchel, expr('concentration', 1, {lookY: 0.6})], [T3.satchel + 0.6, F.resolve],
  [57.2, RESOLVE_HARD], [T3.commitF, F.effort],
];
export const flaresC = (T: number, v?: View): CrewC => {
  const b = bodyAt(FL_SEGS, T);
  const pts: Record<string, V3> = {};
  let pose: Pose = {drop: 8, lean: 4, armR: {local: {r: 6, u: 262, f: 42}, pole: {r: 1, u: -0.6, f: -0.2}}, armL: {local: {r: -52, u: 150, f: 22}}, handR: 'fist', handL: 'relaxed', breath: 0.55};
  const walkArms: Pose = {armR: {local: {r: 8, u: 262, f: 46}, pole: {r: 1, u: -0.6, f: -0.2}}, armL: b.gait?.armL};
  pose = withWalk(b, pose, walkArms);
  if (!b.inWalk) pose = addPose(pose, weight(b));
  { const pw = palmLean(FL_CLIMB, T); pose = layer(pose, {lean: (pose.lean ?? 4) + 6 * pw, drop: (pose.drop ?? 0) + 16 * pw}); }
  const seq: [number, V3][] = [[44.3, {x: 0.6, y: 5.0, z: 4.0}], [T3.flaresFoot - 0.2, {x: -4.6, y: 2.6, z: 6.2}], [47.6, {x: -0.8, y: 4.6, z: 4.6}], [T3.arriveFlares + 0.1, {x: 1.25, y: 4.9, z: 1.35}], [52.6, {x: 0.6, y: 3.9, z: 4.8}], [T3.turnFlares, ARMY_EYE], [T3.satchel - 0.1, {x: FL_A.x - 0.1, y: 3.4, z: FL_A.z - 0.3}], [T3.satchel + 0.55, ARMY_EYE],
    // R4 C6: he looks to the breaker at the valve's hiss (is it charged?), then to the decoy maker's tablet, then the army
    [TB2.charged - 0.05, breakerHead(T)], [TB2.charged + 0.33, ARMY_EYE], [56.3, decoyHeadAt(T)], [56.62, ARMY_EYE]];
  const a = lookSeq(b, T, seq, 0.4);
  pose = layer(pose, {twist: (pose.twist ?? 0) + a.twist, head: {yaw: a.yaw, pitch: a.pitch}});
  const ready = after(T, T3.turnFlares + 0.2, 1.0);
  if (ready > 0) pose = blendPose(pose, layer(pose, {drop: lerp(10, 20, after(T, T3.commitF - 0.2, 0.5)), lean: 9, armR: {local: {r: 52, u: 216, f: 60}}, armL: {local: {r: -30, u: 228, f: 90}}, handL: 'open', handR: 'open'}), ready);
  // C6b: his left hand down to the satchel on his left hip: the fingers run over the flare tops, then back up
  const sat = win(T, T3.satchel, T3.satchel + 0.75, 0.2, 0.22);
  if (sat > 0) pose = blendPose(pose, layer(pose, {armL: {local: {r: -78, u: 172, f: 6}, pole: {r: -1, u: 0.1, f: -0.4}}, handL: 'relaxed', twist: -10}), sat);
  pose.face = withEffort(faceKeys(T, FL_FACE), b);
  // (R4 C6: this one sets at their own moment, SET_T)
  { const cl = coil(T, SET_T.flares); if (cl > 0) pose = layer(pose, {drop: (pose.drop ?? 10) + 6 * cl, lean: (pose.lean ?? 8) + 3 * cl, breath: Math.max(pose.breath ?? 0.5, 0.9 * cl)}); }
  const eb = endBlend('flares', T, b.pos, b.heading, {...pose, dmg: dmgR2('flares', T)}, {footL: b.footL, footR: b.footR});
  let spec: FigSpec = {key: 'cFlr', look: lookR2('flares'), t: T, seed: 9, pos: eb.pos, heading: eb.heading, pose: eb.pose, world: eb.world, gaze: lookAt(T, seq), gazeW: 0.8};
  spec = climbPalm(v, spec, FL_CLIMB, T, b, pts);
  return {spec, body: b, pts};
};

// The decoy maker (clerkB): the tablet with the clip-on projector in her left hand; up the slope a step at a time (her
// right palm on the rubble at the steep bank); C6b: she wakes the tablet (the projector's lens lights) and taps it.
const DC_FLAT: XZ[] = [{x: -11.0, z: 14.2}, {x: -9.0, z: 12.2}, {x: -7.2, z: 11.1}];
const DC_WALK = walkSeg(DC_FLAT, T3.go + 0.1, T3.decoyFoot, G_HURRY, {A: 0.7, D: 0.4});
const DC_A = spotBehind('decoy', 0.4, 0.2);
const DC_UP: XZ[] = [{x: -7.2, z: 11.1}, {x: -5.2, z: 9.4}, {x: -3.9, z: 8.1}, {x: -2.95, z: 7.35}, {x: -2.3, z: 6.3}, {x: -1.9, z: 5.45}, {x: -0.6, z: 5.22}, {x: DC_A.x, z: DC_A.z}];
const DC_CLIMB = climbFrom([DC_WALK], DC_UP, T3.decoyFoot, T3.arriveDecoy, {stepLen: 0.5, maxRise: 0.27, autoHands: {side: 'R', n: 1, minRise: 0.25, fwd: 0.04, out: 0.18}, endHeading: 60});
const DC_C = afterClimb(DC_CLIMB);
const DC_SEGS: Seg[] = [
  DC_WALK,
  climbSeg(DC_CLIMB),
  commitStand('decoy', [DC_C.key, [52.98, DC_A.x, DC_A.z, 342], [T3.turnDecoy, DC_A.x, DC_A.z, 342], [54.4, DC_A.x, DC_A.z, DC_A.h]], T3.commitD, T3.commitDEnd, {half: 0.13, stag: 0.04, turnStep: 70, start: DC_C.start}),
];
const DC_FACE: FK = [
  [42.5, F.concentration], [T3.decoyFoot, expr('effort', 0.6)], [T3.arriveDecoy - 0.2, exprMix('concentration', 'recognition', 0.6)],
  [T3.turnDecoy, F.resolve], [T3.tablet, expr('concentration', 1, {lookY: 0.75})], [T3.tablet + 0.75, F.resolve], [57.2, exprMix('resolve', 'fear', 0.25)],
  [T3.commitD, F.effort],
];
export const decoyC = (T: number, v?: View): CrewC => {
  const b = bodyAt(DC_SEGS, T);
  const pts: Record<string, V3> = {};
  const TAB = {r: -28, u: 215, f: 92};
  let pose: Pose = {drop: 6, lean: 5, armL: {local: {r: -34, u: 200, f: 66}, pole: {r: -1, u: -0.7, f: 0}, palm: {r: 0.4, u: 0.3, f: -1}}, armR: {local: {r: 50, u: 150, f: 26}}, handR: 'relaxed', breath: 0.55};
  const walkArms: Pose = {armL: {local: {r: -36, u: 204, f: 66}, pole: {r: -1, u: -0.7, f: 0}, palm: {r: 0.4, u: 0.3, f: -1}}, armR: b.gait?.armR};
  pose = withWalk(b, pose, walkArms);
  if (!b.inWalk) pose = addPose(pose, weight(b));
  { const pw = palmLean(DC_CLIMB, T); pose = layer(pose, {lean: (pose.lean ?? 5) + 6 * pw, drop: (pose.drop ?? 0) + 16 * pw}); }
  // a glance at the tablet as she arrives (the screen wakes), then the group; C6: the enemy; C6b: the tablet again
  const glance = Math.max(win(T, 52.25, 52.95, 0.2, 0.25), win(T, T3.tablet - 0.05, T3.tablet + 0.8, 0.18, 0.25));
  const seq: [number, V3][] = [[44.3, {x: 0.6, y: 5.2, z: 4.0}], [T3.decoyFoot - 0.2, {x: -3.6, y: 3.0, z: 7.8}], [48.5, {x: -0.6, y: 4.8, z: 5.3}], [T3.arriveDecoy, {x: 1.25, y: 4.9, z: 1.35}], [T3.turnDecoy, ARMY_EYE],
    // R4 C6: after the tablet she glances at the flare carrier's hand on the satchel, then at the pilot, then the army
    [55.28, flaresHeadAt(T)], [55.6, ARMY_EYE], [56.08, pilotHead(T)], [56.42, ARMY_EYE]];
  const a = lookSeq(b, T, seq, 0.4);
  pose = layer(pose, {twist: (pose.twist ?? 0) + a.twist, head: {yaw: lerp(a.yaw, -6, glance), pitch: lerp(a.pitch, 26, glance)}});
  if (glance > 0) pose = blendPose(pose, layer(pose, {armL: {local: TAB, pole: {r: -1, u: -0.7, f: 0}, palm: {r: 0.4, u: 0.3, f: -1}}}), glance);
  // the tap: her right forefinger to the screen
  const tap = win(T, T3.tablet + 0.12, T3.tablet + 0.6, 0.14, 0.16);
  if (tap > 0) pose = blendPose(pose, layer(pose, {armR: {local: {r: -6, u: 222, f: 104}, pole: {r: 1, u: -0.4, f: -0.3}}, handR: 'point'}), tap);
  const ready = after(T, T3.turnDecoy + 0.2, 1.0);
  if (ready > 0) pose = blendPose(pose, layer(pose, {drop: lerp(6, 10, after(T, T3.commitD - 0.2, 0.5)), lean: 6, armL: {local: TAB, pole: {r: -1, u: -0.7, f: 0}, palm: {r: 0.4, u: 0.3, f: -1}}, armR: tap > 0 ? pose.armR : {local: {r: 52, u: 250, f: 70}}, handR: tap > 0.3 ? 'point' : 'open'}), ready);
  pose.face = withEffort(faceKeys(T, DC_FACE), b);
  const wake = win(T, T3.tablet + 0.15, 57.4, 0.15, 1.6);
  // (R4 C6: this one sets at their own moment, SET_T)
  { const cl = coil(T, SET_T.decoy); if (cl > 0) pose = layer(pose, {drop: (pose.drop ?? 10) + 6 * cl, lean: (pose.lean ?? 8) + 3 * cl, breath: Math.max(pose.breath ?? 0.5, 0.9 * cl)}); }
  const eb = endBlend('decoy', T, b.pos, b.heading, {...pose, handL: 'grip', holdL: tablet({screen: true, glow: 0.2 + 0.55 * Math.max(wake, win(T, 52.25, 52.95, 0.2, 0.25))}), dmg: dmgR2('decoy', T)}, {footL: b.footL, footR: b.footR});
  let spec: FigSpec = {key: 'cDec', look: lookR2('decoy'), t: T, seed: 6, pos: eb.pos, heading: eb.heading, pose: eb.pose, world: eb.world, ...(glance > 0.5 ? {} : {gaze: lookAt(T, seq), gazeW: 0.8})};
  spec = climbPalm(v, spec, DC_CLIMB, T, b, pts);
  return {spec, body: b, pts};
};

// ------------------------------------------------------------------ heads for the glances (C6: who looks at whom)
const dirHeadAt = (T: number): V3 => headOf(bodyAt(DIR_SEGS, T), 1.6);
const flaresHeadAt = (T: number): V3 => headOf(bodyAt(FL_SEGS, T), 1.55);
const decoyHeadAt = (T: number): V3 => headOf(bodyAt(DC_SEGS, T), 1.5);
/** R4 C6: each of them sets (sinks into the start) at their own moment, a ripple out from the Director (59.18), so the line
 * does not drop as one body; every one of them is on D1's pose again by the end blend (TEND.blend), so the cut is unchanged */
const SET_T = {runner: 58.98, breaker: 59.06, tether: 59.12, flares: 59.2, decoy: 59.27, drone: 59.32};
const coil = (T: number, t0: number) => after(T, t0, 0.22);

// ------------------------------------------------------------------ everyone at T
export const crewC = (T: number, v?: View): Record<RoleC, CrewC> => {
  const director = directorC(T, v);
  return {
    director,
    tether: tetherC(T, v), runner: runnerC(T, v), breaker: breakerC(T, v, director.spec),
    drone: pilotC(T, v), flares: flaresC(T, v), decoy: decoyC(T, v),
  };
};
/** the walk segments (for footfall sounds/dust): role → walks */
export const WALKS_C: Record<string, Extract<Seg, {kind: 'walk'}>[]> = {
  tether: [TT_WALK], runner: [RN_RUN], breaker: [BK_WALK], drone: [DR_WALK], flares: [FL_WALK], decoy: [DC_WALK],
};
/** the climbs (footfall dust, palms, sounds): role → climbs */
export const CLIMBS_C: Record<string, Climb[]> = {
  tether: [TT_CLIMB], runner: [RN_CLIMB], breaker: [BK_CLIMB, BK_CLIMB2], drone: [DR_CLIMB, DR_CLIMB2], flares: [FL_CLIMB], decoy: [DC_CLIMB],
};
export const SEGS_C: Record<string, Seg[]> = {director: DIR_SEGS, tether: TT_SEGS, runner: RN_SEGS, breaker: BK_SEGS, drone: DR_SEGS, flares: FL_SEGS, decoy: DC_SEGS};
void [onGC];
