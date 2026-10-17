// Section C: the Crew as functions of FILM time T (world metres) — one choreography sampled by every camera of the
// section, so positions, eye-lines and contacts hold across the cuts. Everyone who walks or climbs uses gaitC on GC
// (feet planted, shorter steps on the steep rubble); between moves they stand on keyed roots with planted steps. Hand
// contacts are world points: palms on rubble (the climbs), the runner's palm on the wall's top edge (the vault), the
// breaker's palm on the Director's shoulder (handOn), the Director's fingers on his plate strap, the tether
// operator's hand on her reel. At the end (59.30 → 59.95) every body settles into D1's first frame (D1/crew.tsx at
// M.CHARGE): same root, heading, feet and pose, so the cut to the charge does not jump.
import {V3, add3, sub3, mul3, norm3, dot3, lerp, lerp3, clamp, smooth, easeOut, easeIn, noise} from '../../../kit/math';
import type {View} from '../../engine';
import {
  FigSpec, FigFrame, Pose, blendPose, layer, lookR2, dmgR2, toolsR2, plateWear, tetherLauncher, hipReel, tablet, breaker,
  controller, halligan1, BRACED, figureRig, handOn, SH_X, SH_H,
} from '../../rig';
import type {Rig2, Part} from '../../rig';
import type {GaitW} from '../../rig/gait';
import type {WorldOrient} from '../../rig/sprite';
import {M} from '../../timing';
import {droneKeys, DronePose} from '../../fx';
import {dirB, STAND as B_STAND, STAND_FEET as B_FEET} from '../B/director';
import {directorAt, breakerAt, tetherAt, runnerAt, droneAt, flaresAt, decoyAt, ALLY_KEYS} from '../D1/crew';
import {allyPose} from '../D1/fx';
import {
  XZ, KR, Body, Seg, bodyAt, walkSeg, standSeg, walkEnd, fwdOf, rightOf, headingTo, wrapD, lerpAng, fromLoc, toLoc,
  keyN, keyV, win, after, rel, gaitC,
} from './motion';
import {GC, onGC, wallGrip, WALL} from './ground';
import {TD, TT, TR, TB2, T3, TDR, TEND, CUT} from './beats';
import {flareBag, breakerCarry, controllerHold} from './gear';

export type RoleC = 'director' | 'tether' | 'runner' | 'breaker' | 'drone' | 'flares' | 'decoy';
export const ROLES_C: RoleC[] = ['director', 'tether', 'runner', 'breaker', 'drone', 'flares', 'decoy'];
export type CrewC = {spec: FigSpec; body: Body; pts: Record<string, V3>};

// ------------------------------------------------------------------ gaits
// (strides are a full cycle, two steps; the slope warp shortens them on the climb)
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
/** the pupils toward a world point (screen space, so they read from any camera): the head's own facing is the rest */
const eyesTo = (F: FigFrame, b: {pos: V3; heading: number}, a: Aim, target: V3 | null, eye = 1.55) => {
  if (!target) return {lookX: 0, lookY: 0};
  const h = ((b.heading + a.twist + a.yaw) * Math.PI) / 180, pr = (-a.pitch * Math.PI) / 180;
  const hf = {x: Math.sin(h) * Math.cos(pr), y: Math.sin(pr), z: -Math.cos(h) * Math.cos(pr)};
  const d = norm3(sub3(target, {x: b.pos.x, y: b.pos.y + eye, z: b.pos.z}));
  const q = sub3(d, hf);
  return {lookX: clamp(dot3(q, F.Rh) * 2.6, -1, 1), lookY: clamp(-q.y * 2.6, -1, 1)};
};

// ------------------------------------------------------------------ helpers
export const extras = (...fs: (((r: Rig2) => Part[]) | undefined)[]) => (r: Rig2) => fs.flatMap((f) => (f ? f(r) : []));
const gaitArms = (g?: Pose): Pose => (g ? {armL: g.armL, armR: g.armR} : {});
/** the walk's body (drop, lean, bob) plus role arms, faded with the walk */
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
const pt3 = (x: number, z: number, up = 0): V3 => onGC(x, z, up);

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
/** blend a spec (with a pose OBJECT) into D1's first frame over TEND.blend → M.CHARGE */
const endBlend = (r: RoleC, T: number, pos: V3, heading: number, pose: Pose, world: FigSpec['world'], o: {keepFeetY?: boolean} = {}): {pos: V3; heading: number; pose: Pose; world: FigSpec['world']} => {
  const w = smooth(clamp((T - TEND.blend) / (M.CHARGE - TEND.blend)));
  if (w <= 0) return {pos, heading, pose, world};
  const d = d1End()[r];
  const dw = d.spec.world ?? {};
  const lw = (a: V3 | undefined, b: V3 | undefined) => (a && b ? lerp3(a, b, w) : w < 0.5 ? a : b);
  const ww: FigSpec['world'] = {...(world ?? {})};
  ww.footL = lw(world?.footL, dw.footL); ww.footR = lw(world?.footR, dw.footR);
  if (o.keepFeetY) {
    // (the drone pilot stands on B's slab: D1 puts her feet on the terrain under it; keep them on the slab here)
    if (ww.footL) ww.footL = {...ww.footL, y: Math.max(ww.footL.y, GC(ww.footL.x, ww.footL.z))};
    if (ww.footR) ww.footR = {...ww.footR, y: Math.max(ww.footR.y, GC(ww.footR.x, ww.footR.z))};
  }
  if (world?.handL || dw.handL) ww.handL = lw(world?.handL, dw.handL);
  if (world?.handR || dw.handR) ww.handR = lw(world?.handR, dw.handR);
  const p2 = lerp3(pos, d.spec.pos, w);
  if (o.keepFeetY) p2.y = Math.max(p2.y, GC(p2.x, p2.z));
  return {pos: p2, heading: lerpAng(heading, d.spec.heading, w), pose: blendPose(pose, d.pose, w), world: ww};
};

// ================================================================== THE DIRECTOR (clerkC)
// C1: at the brink (B's last stance), facing the army. The breath stops; a scrape behind him; eyes, then head over
// his right shoulder; then the body comes round in three steps, up and back toward the crest (to face west, where
// they come from). C3–C5: he watches them come; the breaker's hand on his shoulder; the strap check. C6: the turn
// (first), the hold, the step forward to the brink on the build.
const DIR_SPOT: XZ = {x: 1.25, z: 1.35};
const DIR_ROOT: KR[] = [
  [TD.pivot, B_STAND.x, B_STAND.z, 90],
  [TD.pivotEnd, DIR_SPOT.x, DIR_SPOT.z, 230],
  [40.75, DIR_SPOT.x, DIR_SPOT.z, 230], [41.35, DIR_SPOT.x, DIR_SPOT.z, 262],
  [49.25, DIR_SPOT.x, DIR_SPOT.z, 262], [49.8, DIR_SPOT.x, DIR_SPOT.z, 250],
  [TD.turn, DIR_SPOT.x, DIR_SPOT.z, 250], [TD.turnEnd, DIR_SPOT.x, DIR_SPOT.z, 108],
  [TD.step, DIR_SPOT.x, DIR_SPOT.z, 108], [TD.step2Land, 1.6, 1.4, 126],
  [M.CHARGE + 1, 1.6, 1.4, 126],
];
const DIR_SEGS: Seg[] = [standSeg(DIR_ROOT, {half: 0.15, stag: 0.05, stepLen: 0.5, turnStep: 52, start: {L: [B_FEET.L.x, B_FEET.L.z], R: [B_FEET.R.x, B_FEET.R.z]}})];
/** what he looks at (C2: the tether out of the smoke; C3: the runner, then the breaker; C4: the summit, the trio,
 * the drone; C5: the breaker, the trio, the plate; C6: the army) */
const ARMY_EYE: V3 = {x: 82, y: 2.4, z: 0.5};
const dirLooks = (T: number): [number, V3][] => [
  [35.8, ARMY_EYE],
  [TD.head, {x: -14, y: 1.6, z: -2.2}],
  [38.9, tetherAt0(T)], [40.5, runnerHead(T)], [42.35, breakerHead(T)], [43.9, tetherHead(T)],
  [46.0, {x: -3.0, y: 3.4, z: 6.0}], [47.55, droneBody(T)], [48.9, {x: -2.5, y: 3.2, z: 5.0}],
  [TB2.touch + 0.12, breakerHead(T)], [TD.lookBack, {x: -1.5, y: 4.6, z: 4.2}], [TD.strapLook, plateLook()],
  [TD.strapUp, {x: 0.2, y: 5.2, z: 4.5}], [TD.turn - 0.06, ARMY_EYE],
];
const plateLook = () => ({x: DIR_SPOT.x + 0.1, y: GC(DIR_SPOT.x, DIR_SPOT.z) + 1.0, z: DIR_SPOT.z + 0.25});
/** the guard: low (B6's), D1's high guard on the build */
const GUARD_LOW = {r: -28, u: 232, f: 78};
const GUARD_HI = {r: 6, u: 345, f: 112};

export const directorC = (T: number, v?: View): CrewC => {
  const pts: Record<string, V3> = {};
  // ---- C1, before the pivot: B's stance (shots/B/director.ts), with the breath stopping and the head turning
  const preB = T < TD.pivot;
  const bB = preB ? dirB(T) : null;
  const b: Body = preB
    ? {pos: bB!.pos, heading: bB!.heading, footL: bB!.world.footL!, footR: bB!.world.footR!, runK: 0, seg: 0, inWalk: false}
    : bodyAt(DIR_SEGS, T);
  const base: Pose = preB ? bB!.pose : {
    drop: 19, lean: 7, twist: -6, armL: {local: GUARD_LOW, pole: {r: -1, u: -0.4, f: -0.3}}, armR: {local: {r: 74, u: 150, f: 24}},
    handL: 'fist', handR: 'relaxed', face: {mouth: 'pant', brows: -0.5, squint: 0.2}, breath: 0.42,
  };
  // breath: stops on the quiet, comes back shallow, the breath of recognition in C3, then steady
  const stop = after(T, TD.breathStop, 0.25) * (1 - after(T, TD.pivotEnd + 0.2, 1.2) * 0.6);
  const recog = win(T, TD.recognise, TD.recognise + 1.5, 0.35, 0.8);
  const breath = lerp(lerp(base.breath ?? 0.42, 0.04, stop), 0.95, recog);
  // C1 head turn: eyes first, then the head over the right shoulder, the shoulders follow
  const headK = easeOut(clamp((T - TD.head) / (TD.headEnd - TD.head)));
  let pose: Pose = {...base, breath};
  // look-at (from the pivot on, the head finds the targets; in C1 it is keyed)
  const looks = dirLooks(T);
  let a: Aim = lookSeq(b, T, looks, 0.4, {lim: 80, twistK: 0.5});
  let gaze: V3 | null = looks.filter((l) => T >= l[0]).pop()![1];
  if (preB) {
    a = {yaw: lerp(0, 74, headK), pitch: lerp(2, -3, headK), twist: lerp(-6, 16, smooth((T - TD.head - 0.12) / 0.55))};
    gaze = T > TD.eyes ? {x: -14, y: 1.6, z: -2.2} : null;
  } else if (T < TD.pivotEnd + 0.3) {
    // the body comes round under the head: the head unwinds as the heading catches up (gaze stays west)
    const k = smooth((T - TD.pivot) / (TD.pivotEnd + 0.3 - TD.pivot));
    a = mixAim({yaw: 74, pitch: -3, twist: 16}, a, k);
  }
  pose = layer(pose, {twist: a.twist, head: {yaw: a.yaw, pitch: a.pitch, roll: 0}});
  // face: the quiet (mouth closes), the sound (brows lift), the recognition (a breath through the mouth, brows soften)
  const heard = after(T, TD.heard, 0.3) * (1 - after(T, 40.6, 1.0));
  pose.face = {
    ...(pose.face ?? {}),
    mouth: recog > 0.3 ? 'breath' : stop > 0.5 ? 'flat' : (pose.face?.mouth ?? 'pant'),
    open: recog > 0.3 ? 0.35 * recog : 0,
    brows: lerp(lerp(-0.5, 0.15, heard), -0.1, recog), worry: 0.25 * heard + 0.35 * recog, squint: 0.2 * (1 - heard),
  };
  // the steps: weight over the planted foot, a dip as each foot swings
  if (!preB) pose = addPose(pose, weight(b));
  // the recognition: the chest lifts with the breath, the chin comes up a little
  pose = layer(pose, {lean: (pose.lean ?? 7) - 3 * recog, head: {...pose.head, pitch: (pose.head?.pitch ?? 0) - 5 * recog}});
  // ---- C5a: the breaker's palm lands on his left shoulder (a dip under it, then he turns his head to him; a nod)
  const touchW = win(T, TB2.touch - 0.05, TB2.touchOff + 0.15, 0.12, 0.2);
  const jolt = T > TB2.touch ? Math.exp(-(T - TB2.touch) * 7) * Math.sin(Math.min(Math.PI, (T - TB2.touch) * 9)) : 0;
  const nod = win(T, TD.nod, TD.nod + 0.4, 0.15, 0.2);
  pose = layer(pose, {drop: (pose.drop ?? 19) + 5 * jolt, side: (pose.side ?? 0) - 3 * jolt, head: {...pose.head, pitch: (pose.head?.pitch ?? 0) + 9 * nod}});
  if (touchW > 0.2) pose.face = {...pose.face, mouth: 'soft', brows: 0.1, worry: 0.35};
  // ---- C5c: the strap check — the plate forearm comes up across his body, the right fingers press the strap
  const strapW = win(T, TD.strapLook, TD.strapUp + 0.22, 0.25, 0.3);
  if (strapW > 0) {
    pose = blendPose(pose, layer(pose, {armL: {local: {r: -2, u: 252, f: 74}, pole: {r: -1, u: -0.5, f: -0.1}}, handL: 'fist'}), strapW);
    pose.face = {...pose.face, mouth: 'flat', brows: -0.35};
  }
  // ---- C6: the build — weight down into the stance, the plate up into his guard
  if (T > TD.turn) pose = blendPose(pose, layer(pose, {armL: {local: {r: -18, u: 262, f: 92}, pole: {r: -1, u: -0.6, f: 0}}, handR: 'fist', face: {mouth: 'flat', brows: -0.55}}), after(T, TD.turn, 0.6));
  const build = after(T, TD.step - 0.4, 1.4);
  if (build > 0) pose = blendPose(pose, layer(pose, {drop: 26, lean: 10, armL: {local: GUARD_HI, pole: {r: -1, u: -0.7, f: 0.1}, palm: {r: -0.55, u: 0.1, f: -1}}, handR: 'fist', armR: {local: {r: 52, u: 250, f: 70}}, face: {mouth: 'grit', brows: -0.6, squint: 0.2}}), build);

  // ---- the spec
  const plate = toolsR2('director', T).plate ?? 'intact';
  const world: FigSpec['world'] = {footL: b.footL, footR: b.footR};
  const eb = endBlend('director', T, b.pos, b.heading, {...pose, handL: 'fist', wearL: plateWear(plate), dmg: dmgR2('director', T)}, world);
  const g = gaze;
  let spec: FigSpec = {
    key: 'cDir', look: lookR2('director'), t: T, seed: 11, pos: eb.pos, heading: eb.heading,
    pose: (F: FigFrame) => ({...eb.pose, face: {...(eb.pose.face ?? {}), ...eyesTo(F, b, a, g)}}),
    world: eb.world, reach: true,
  };
  // the strap: his right fingers on the strap at his left forearm (a world point on the solved forearm)
  if (strapW > 0.001) {
    const press = win(T, TD.strapPress - 0.08, TD.strapRelease + 0.1, 0.1, 0.15);
    if (v) {
      const R = figureRig(v, spec);
      const r = R.rig;
      const k = 0.62;
      const onArm = R.W({x: lerp(r.el[0].x, r.wr[0].x, k), y: lerp(r.el[0].y, r.wr[0].y, k), z: lerp(r.el[0].z, r.wr[0].z, k)});
      const n = norm3(sub3(R.W(r.el[0]), R.W(r.sh[0]))); // roughly the upper arm's direction; the strap is on the forearm's outer face
      const out = norm3(sub3(onArm, R.chest));
      const tgt = add3(onArm, add3(mul3(out, 0.05 - 0.022 * press), mul3(n, 0.0)));
      spec = handTo(v, {...spec, pose: layerFn(spec.pose, {handR: press > 0.3 ? 'grip' : 'reach', zArm: [undefined, 45]})}, 'R', tgt, strapW, {palm: mul3(out, -1), w: 0.7});
      pts.strap = tgt;
    }
  }
  pts.head = {x: b.pos.x, y: b.pos.y + 1.62, z: b.pos.z};
  return {spec, body: b, pts};
};
const layerFn = (p: FigSpec['pose'], over: Pose): FigSpec['pose'] => (typeof p === 'function' ? (F: FigFrame) => ({...p(F), ...over}) : {...(p ?? {}), ...over});

// ================================================================== THE TETHER OPERATOR (clerkA)
// Out of the smoke at the ruin (C2), across the floor and up the north side of the west slope; the last steep step onto
// the summit with her left hand on the rock (C4). She turns to watch the others; C5b: her left hand to the reel on
// her right hip — the lock clicks. C6: she turns to the enemy.
const TT_PATH: XZ[] = [{x: -18.6, z: -1.6}, {x: -16.2, z: -1.9}, {x: -14.2, z: -2.1}, {x: -12.0, z: -2.32}, {x: -9.4, z: -2.45}, {x: -7.0, z: -2.62}, {x: -5.0, z: -2.55}, {x: -3.2, z: -2.35}, {x: -1.75, z: -2.08}, {x: -0.75, z: -2.0}, {x: 0.1, z: -2.2}];
const TT_WALK = walkSeg(TT_PATH, TT.go, TT.top, G_HURRY, {A: 0.9, D: 0.7});
const TT_E = walkEnd(TT_WALK);
const TT_SEGS: Seg[] = [
  TT_WALK,
  standSeg([[TT.top, TT_E.x, TT_E.z, TT_E.h], [49.1, TT_E.x, TT_E.z, TT_E.h], [49.75, 0.1, -2.2, 196], [TT.turn, 0.1, -2.2, 196], [54.15, 0.1, -2.2, 149], [M.CHARGE + 1, 0.1, -2.2, 149]], {half: 0.14, stag: 0.04}),
];
const TT_HAND = pt3(-0.98, -2.2, 0.02); // the last steep step: her left palm on the rock
const tetherAt0 = (T: number): V3 => { const b = bodyAt(TT_SEGS, Math.min(T, 40.2)); return {x: b.pos.x, y: b.pos.y + 1.5, z: b.pos.z}; };
const tetherHead = (T: number): V3 => { const b = bodyAt(TT_SEGS, T); return {x: b.pos.x, y: b.pos.y + 1.55, z: b.pos.z}; };
export const tetherC = (T: number, v?: View): CrewC => {
  const b = bodyAt(TT_SEGS, T);
  const pts: Record<string, V3> = {};
  let pose: Pose = {drop: 8, lean: 4, armR: {local: {r: 34, u: 176, f: 52}}, armL: {local: {r: -50, u: 150, f: 20}}, handL: 'relaxed', face: {mouth: 'flat', brows: -0.3}, breath: 0.4};
  const walkArms: Pose = {armR: {local: {r: 32, u: 182, f: 56}}, armL: b.gait?.armL};
  pose = withWalk(b, pose, walkArms);
  if (!b.inWalk) pose = addPose(pose, weight(b));
  // she looks up at the crest (him), the summit, then the others; C6: the enemy
  const a = lookSeq(b, T, [[37.9, {x: 1.3, y: 4.8, z: 1.35}], [44.2, {x: 0, y: 5.6, z: -2.2}], [TT.top + 0.2, {x: 1.25, y: 4.9, z: 1.35}], [49.7, {x: -3, y: 3.5, z: 5}], [TT.reel - 0.15, {x: 0.3, y: 5.6, z: -1.9}], [TT.reelOff, {x: 1.2, y: 4.8, z: 1.4}], [TT.turn, ARMY_EYE]], 0.4);
  pose = layer(pose, {twist: (pose.twist ?? 0) + a.twist, head: {yaw: a.yaw, pitch: a.pitch}});
  // C5b: the left hand across to the reel on her right hip; a press — the lock clicks
  const reelW = win(T, TT.reel - 0.22, TT.reelOff + 0.25, 0.22, 0.25);
  const press = win(T, TT.click - 0.06, TT.click + 0.16, 0.05, 0.1);
  if (reelW > 0) pose = blendPose(pose, layer(pose, {armL: {local: {r: 58, u: 170 - (pose.drop ?? 0) + 4, f: 30 - 6 * press}, pole: {r: -0.4, u: -1, f: 0.6}}, handL: 'brace', head: {...pose.head, pitch: 26, yaw: 18}, face: {mouth: 'flat', brows: -0.4, lookY: 0.6}}), reelW);
  // (the reaching arm crosses in front of her body to the far hip)
  if (reelW > 0.2) pose.zArm = [45, undefined];
  // C6: launcher up, ready
  const ready = after(T, TT.turn + 0.3, 1.2);
  if (ready > 0) pose = blendPose(pose, layer(pose, {drop: lerp(8, 18, after(T, 57.5, 1.6)), lean: 8, armR: {local: {r: 30, u: 240, f: 90}}, armL: {local: {r: -30, u: 220, f: 60}}, handL: 'open', face: {mouth: 'flat', brows: -0.5}}), ready);
  const spool = 1 - 0.12 * press;
  const eb = endBlend('tether', T, b.pos, b.heading, {...pose, handR: 'grip', holdR: tetherLauncher({loaded: true}), extra: hipReel(spool), dmg: dmgR2('tether', T)}, {footL: b.footL, footR: b.footR});
  let spec: FigSpec = {key: 'cTth', look: lookR2('tether'), t: T, seed: 3, pos: eb.pos, heading: eb.heading, pose: (F: FigFrame) => ({...eb.pose, face: {...(eb.pose.face ?? {}), ...eyesTo(F, b, a, null)}}), world: eb.world};
  // the last step onto the summit: her left palm on the rock, the push
  const handW = win(T, TT.handOn - 0.18, TT.handOff + 0.15, 0.18, 0.2);
  if (handW > 0) spec = handTo(v, {...spec, pose: layerFn(spec.pose, {handL: 'brace'})}, 'L', TT_HAND, handW, palmDown(b.heading));
  pts.hand = TT_HAND;
  pts.reel = fromLoc(b, {r: 74, u: 171 - (pose.drop ?? 0), f: 0});
  return {spec, body: b, pts};
};

// ================================================================== THE RUNNER (guesser)
// Out of the smoke at a sprint (C3), over the floor and up the bank, the vault over the wall on the terrace lip (left
// palm on its top edge, legs swing over to the right, lands, absorbs, recovers), up the slope to his place north of him.
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
  const land: V3 = pt3(-4.62, 2.78);
  const land2: V3 = pt3(-4.46, 2.5);
  const out: V3 = pt3(-4.38, 2.62);
  return {g0, land, land2, out};
})();
const vaultAt = (T: number): Body => {
  const V = VAULT;
  // root (feet centre; airborne between take-off and landing)
  const root = keyV([
    [TR.takeoff, V.g0],
    [TR.hand, add3(lerp3(V.g0, GRIP, 0.42), {x: 0, y: 0.18, z: 0.05})],
    [TR.over, {x: GRIP.x + 0.12, y: GRIP.y - 0.2, z: GRIP.z + 0.33}, easeOut],
    [TR.land, {x: V.land.x + 0.06, y: V.land.y + 0.04, z: (V.land.z + V.land2.z) / 2}, easeIn],
    [TR.land + 0.12, {x: (V.land.x + V.land2.x) / 2, y: GC((V.land.x + V.land2.x) / 2, 2.64), z: 2.64}],
    [TR.rec, V.out],
  ], T);
  const heading = keyN([[TR.takeoff, RN_E.h], [TR.hand, 84], [TR.over, 62], [TR.land, 82], [TR.rec, 70]], T);
  // feet: left plants for the take-off, both tuck and swing over (to his right of the hand), the right lands, the left
  const fL0: V3 = RN_G0.footL;
  const footL = keyV([
    [TR.takeoff + 0.06, fL0], [TR.hand + 0.04, add3(fL0, {x: 0.12, y: 0.08, z: 0})],
    [TR.over - 0.06, {x: GRIP.x - 0.05, y: GRIP.y + 0.08, z: GRIP.z + 0.42}, easeOut],
    [TR.land - 0.02, add3(V.land2, {x: -0.1, y: 0.22, z: 0.05})], [TR.land + 0.1, V.land2, easeIn], [TR.rec, V.land2],
  ], T);
  const fR0: V3 = RN_G0.footR;
  const footR = keyV([
    [TR.takeoff, fR0], [TR.hand, add3(lerp3(V.g0, GRIP, 0.5), {x: 0, y: -0.1, z: 0.32})],
    [TR.over - 0.03, {x: GRIP.x + 0.1, y: GRIP.y + 0.14, z: GRIP.z + 0.62}, easeOut],
    [TR.land - 0.04, add3(V.land, {x: -0.08, y: 0.12, z: 0})], [TR.land, V.land, easeIn], [TR.rec, V.land],
  ], T);
  return {pos: root, heading, footL, footR, runK: 0, seg: 0, inWalk: false};
};
const RN_PATH2: XZ[] = [{x: VAULT.out.x, z: VAULT.out.z}, {x: -3.6, z: 2.36}, {x: -2.6, z: 1.6}, {x: -1.6, z: 0.62}, {x: -0.62, z: -0.38}, {x: 0.35, z: -1.15}];
const RN_WALK2 = walkSeg(RN_PATH2, TR.rec, TR.arrive, G_HURRY, {A: 0.45, D: 0.7});
const RN_E2 = walkEnd(RN_WALK2);
const RN_SEGS: Seg[] = [
  RN_RUN,
  {kind: 'fn', T0: TR.takeoff, at: vaultAt},
  RN_WALK2,
  standSeg([[TR.arrive, RN_E2.x, RN_E2.z, RN_E2.h], [46.75, RN_E2.x, RN_E2.z, RN_E2.h], [47.4, 0.35, -1.15, 205], [TR.turn, 0.35, -1.15, 205], [54.2, 0.3, -0.9, 145], [M.CHARGE + 1, 0.3, -0.9, 145]], {half: 0.14, stag: 0.05}),
];
const runnerHead = (T: number): V3 => { const b = bodyAt(RN_SEGS, T); return {x: b.pos.x, y: b.pos.y + 1.4, z: b.pos.z}; };
export const VAULT_GRIP = GRIP;
export const runnerC = (T: number, v?: View): CrewC => {
  const b = bodyAt(RN_SEGS, T);
  const pts: Record<string, V3> = {};
  const inVault = T >= TR.takeoff && T < TR.rec;
  let pose: Pose = {drop: 10, lean: 6, armR: {local: {r: 40, u: 200, f: 50}}, armL: {local: {r: -50, u: 150, f: 24}}, handL: 'relaxed', face: {mouth: 'grit', brows: -0.4}, breath: 0.6};
  const walkArms: Pose = {armR: {local: {r: 40, u: 216, f: 64}}, armL: b.gait?.armL};
  pose = withWalk(b, pose, walkArms);
  if (!b.inWalk && !inVault) pose = addPose(pose, weight(b));
  let shadow = 1;
  if (inVault) {
    // the body: a forward reach at the take-off, rolls over the planted left arm (legs swing up to his right), unrolls
    // to land, absorbs low, comes up and moves on
    const roll = keyN([[TR.takeoff, 0], [TR.hand, 18], [TR.over, 52], [TR.release, 40], [TR.land, 8], [TR.land + 0.15, 0]], T);
    const drop = keyN([[TR.takeoff, 18], [TR.hand, 30], [TR.over, 52], [TR.land, 30], [TR.land + 0.14, 74], [TR.land + 0.32, 62], [TR.rec, 20]], T);
    const lean = keyN([[TR.takeoff, 18], [TR.hand, 30], [TR.over, 22], [TR.land, 12], [TR.land + 0.14, 34], [TR.rec, 14]], T);
    pose = {
      ...pose, drop, lean, bodyRoll: roll, twist: keyN([[TR.takeoff, 0], [TR.over, -14], [TR.land, 6], [TR.rec, 0]], T),
      // the right hand (the halligan) up and out for balance
      armR: {local: {r: 78, u: lerp(260, 330, win(T, TR.hand, TR.land, 0.12, 0.2)), f: 30}, pole: {r: 1, u: -0.3, f: -0.4}},
      armL: {local: {r: -40, u: 240, f: 110}},
      legL: {pitch: -20}, legR: {pitch: -10},
      handL: T < TR.release + 0.05 && T > TR.takeoff + 0.02 ? 'brace' : 'open',
      head: {pitch: T < TR.over ? 18 : 6, yaw: T < TR.over ? -10 : 8},
      face: {mouth: T < TR.land + 0.1 ? 'grit' : 'pant', brows: -0.7, squint: 0.3},
    };
    if (T > TR.hand - 0.02 && T < TR.land + 0.02) shadow = 0;
  }
  // eyes: the wall, then where he lands, then the crest; standing: the others; C6: the enemy
  const a = inVault ? {yaw: pose.head?.yaw ?? 0, pitch: pose.head?.pitch ?? 0, twist: 0} : lookSeq(b, T, [[39.3, {x: -5.4, y: 2.2, z: 2.6}], [TR.rec, {x: 0.3, y: 5.0, z: -1.0}], [TR.arrive, {x: 1.25, y: 4.9, z: 1.35}], [47.2, {x: -3.8, y: 3.5, z: 4.5}], [50.3, {x: 1.25, y: 4.9, z: 1.35}], [TR.turn, ARMY_EYE]], 0.4);
  if (!inVault) pose = layer(pose, {twist: (pose.twist ?? 0) + a.twist, head: {yaw: a.yaw, pitch: a.pitch}});
  const ready = after(T, TR.turn + 0.3, 1.2);
  if (ready > 0) pose = blendPose(pose, layer(pose, {drop: lerp(10, 22, after(T, 57.6, 1.6)), lean: 9, armL: {local: {r: -18, u: 280, f: 110}, pole: {r: -1, u: -0.4, f: -0.2}}, armR: {local: {r: 52, u: 250, f: 70}}, handL: 'fist', face: {mouth: 'grit', brows: -0.4}}), ready);
  const eb = endBlend('runner', T, b.pos, b.heading, {...pose, shadow, handR: 'grip', holdR: halligan1({ang: 72}), dmg: dmgR2('runner', T)}, {footL: b.footL, footR: b.footR});
  let spec: FigSpec = {key: 'cRun', look: lookR2('runner'), t: T, seed: 4, pos: eb.pos, heading: eb.heading, pose: (F: FigFrame) => ({...eb.pose, face: {...(eb.pose.face ?? {}), ...eyesTo(F, b, a, null)}}), world: eb.world, reach: !inVault};
  // the vault contact: the left palm on the top edge, from the reach to the release
  const gripW = inVault ? win(T, TR.takeoff - 0.04, TR.release + 0.06, 0.1, 0.06) : 0;
  if (gripW > 0) spec = handTo(v, spec, 'L', GRIP, gripW, {palm: {x: 0, y: -1, z: 0}, fingers: {x: 0.85, y: -0.2, z: -0.45}});
  pts.grip = GRIP; pts.land = VAULT.land; pts.land2 = VAULT.land2;
  pts.shadow = {x: b.pos.x, y: GC(b.pos.x, b.pos.z), z: b.pos.z};
  return {spec, body: b, pts};
};
export const RUNNER_SHADOW = (T: number) => T > TR.hand - 0.02 && T < TR.land + 0.02;

// ================================================================== THE BREAKER (honest)
// Out of the smoke behind the tether operator (C2/C3), the tool in his right hand; up the north side of the slope:
// his left palm on a rubble block (C3) and again on the steep step below the crest (C4); along the crest to the
// Director's right side; his left hand on the Director's right shoulder (C5a); round behind him to his place.
const BK_PATH: XZ[] = [{x: -18.4, z: -0.3}, {x: -15.4, z: -0.5}, {x: -12.0, z: -0.7}, {x: -8.6, z: -0.62}, {x: -7.0, z: -0.62}, {x: -5.6, z: -1.05}, {x: -3.8, z: -1.12}, {x: -2.25, z: -1.0}, {x: -1.3, z: -0.82}, {x: -0.38, z: -0.42}, {x: 0.6, z: -0.2}, {x: 1.42, z: 0.56}];
const BK_WALK = walkSeg(BK_PATH, TB2.go, TB2.arrive, G_HEAVY, {A: 0.8, D: 0.8});
const BK_E = walkEnd(BK_WALK);
const BK_PATH2: XZ[] = [{x: 1.42, z: 0.56}, {x: 1.98, z: 1.3}, {x: 1.8, z: 2.45}, {x: 1.25, z: 3.1}, {x: 0.9, z: 3.4}];
const BK_WALK2 = walkSeg(BK_PATH2, TB2.go2, TB2.arrive2, G_WALK, {A: 0.5, D: 0.6});
const BK_E2 = walkEnd(BK_WALK2);
const BK_SEGS: Seg[] = [
  BK_WALK,
  standSeg([[TB2.arrive, BK_E.x, BK_E.z, BK_E.h], [TB2.arrive + 0.4, BK_E.x, BK_E.z, 196], [TB2.go2, BK_E.x, BK_E.z, 196]], {half: 0.16, stag: 0.05}),
  BK_WALK2,
  standSeg([[TB2.arrive2, BK_E2.x, BK_E2.z, BK_E2.h], [54.3, 0.9, 3.4, 120], [M.CHARGE + 1, 0.9, 3.4, 120]], {half: 0.16, stag: 0.05}),
];
const BK_HAND1 = pt3(-4.42, -1.32, 0.03); // the steep bank (x −5 … −4): his left palm on the rubble
const BK_HAND2 = pt3(-1.5, -1.12, 0.03); // the steep step below the crest
const breakerHead = (T: number): V3 => { const b = bodyAt(BK_SEGS, T); return {x: b.pos.x, y: b.pos.y + 1.6, z: b.pos.z}; };
/** the two-handed port (D1's carry: left hand on the side handle in front, right on the trigger behind) */
const PORT = {front: {r: -16, u: 250, f: 118}, back: {r: 32, u: 205, f: 34}};
export const breakerC = (T: number, v?: View, dir?: FigSpec): CrewC => {
  const b = bodyAt(BK_SEGS, T);
  const pts: Record<string, V3> = {};
  const gauge = toolsR2('breaker', T).gauge ?? 1;
  const twoH = T >= 52.0;
  // carrying: the tool hangs from his right hand (the arm straight, pulled down a little by the weight)
  let pose: Pose = {drop: 12, lean: 6, side: -3, armR: {local: {r: 70, u: 132, f: 22}, pole: {r: 1, u: 0, f: -0.4}}, armL: {local: {r: -52, u: 150, f: 24}}, handL: 'relaxed', face: {mouth: 'grit', brows: -0.4}, breath: 0.6};
  const walkArms: Pose = {armR: {local: {r: 70, u: 136, f: 30}, pole: {r: 1, u: 0, f: -0.4}}, armL: b.gait?.armL, side: -4};
  pose = withWalk(b, pose, walkArms);
  if (!b.inWalk) pose = addPose(pose, weight(b));
  const a = lookSeq(b, T, [[39.0, {x: 1.3, y: 4.8, z: 1.35}], [45.5, {x: -1.2, y: 4.4, z: -0.8}], [47.3, {x: 1.25, y: 4.9, z: 1.35}], [TB2.touch - 0.1, {x: 1.2, y: 4.95, z: 1.4}], [TB2.touchOff + 0.1, {x: -2.5, y: 3.6, z: 4.5}], [TB2.go2 + 0.3, {x: 1.0, y: 4.4, z: 3.6}], [TB2.arrive2, {x: 1.25, y: 4.9, z: 1.35}], [TB2.turn, ARMY_EYE]], 0.4);
  pose = layer(pose, {twist: (pose.twist ?? 0) + a.twist, head: {yaw: a.yaw, pitch: a.pitch}});
  if (T > TB2.touch && T < TB2.touchOff + 0.2) pose.face = {mouth: 'soft', brows: 0.1, worry: 0.2};
  // the port (two hands) from 52.0 (he lifts it as he takes his place, off camera)
  if (twoH) {
    const k = after(T, 52.0, 0.5);
    pose = blendPose(pose, layer(pose, {armL: {local: PORT.front}, armR: {local: PORT.back}, side: 0}), k);
  }
  const ready = after(T, TB2.turn + 0.3, 1.2);
  if (ready > 0) pose = blendPose(pose, layer(pose, {drop: lerp(14, 26, after(T, 57.6, 1.6)), lean: 10, face: {mouth: 'grit', brows: -0.5}}), ready);
  const tool = twoH ? {handL: 'grip' as const, handR: 'grip' as const, twoHanded: true, extra: breaker({back: 1, front: 0, gauge})} : {handR: 'grip' as const, holdR: breakerCarry({gauge})};
  const world0: FigSpec['world'] = {footL: b.footL, footR: b.footR, ...(twoH ? {handL: fromLoc(b, PORT.front), handR: fromLoc(b, PORT.back)} : {})};
  const eb = endBlend('breaker', T, b.pos, b.heading, {...pose, ...tool, dmg: dmgR2('breaker', T)}, world0);
  let spec: FigSpec = {key: 'cBrk', look: lookR2('breaker'), t: T, seed: 7, pos: eb.pos, heading: eb.heading, pose: (F: FigFrame) => ({...eb.pose, face: {...(eb.pose.face ?? {}), ...eyesTo(F, b, a, null)}}), world: eb.world};
  if (twoH && after(T, 52.0, 0.5) < 1) {
    // (the hands rise into the port from wherever they were)
    const k = after(T, 52.0, 0.5);
    if (v && k < 1) {
      const pre = figureRig(v, {...spec, world: {footL: b.footL, footR: b.footR}});
      spec = {...spec, world: {...spec.world, handL: lerp3(pre.handL, fromLoc(b, PORT.front), k), handR: lerp3(pre.handR, fromLoc(b, PORT.back), k)}};
    }
  }
  // the climbs: his left palm on the rubble, the push up
  const h1 = win(T, TB2.hand1 - 0.2, TB2.hand1Off + 0.15, 0.2, 0.2), h2 = win(T, TB2.hand2 - 0.2, TB2.hand2Off + 0.15, 0.2, 0.2);
  if (h1 > 0) spec = handTo(v, {...spec, pose: layerFn(spec.pose, {handL: 'brace', lean: 26})}, 'L', BK_HAND1, h1, palmDown(b.heading));
  if (h2 > 0) spec = handTo(v, {...spec, pose: layerFn(spec.pose, {handL: 'brace', lean: 24})}, 'L', BK_HAND2, h2, palmDown(b.heading));
  // C5a: his left hand onto the Director's right shoulder (the shoulder's owner is solved first; see rig handOn)
  const tw = win(T, TB2.touch - 0.25, TB2.touchOff + 0.22, 0.25, 0.22);
  if (tw > 0 && v && dir) {
    spec = handOn(v, dir, {r: SH_X - 10, u: SH_H + 12, f: -2}, {...spec, pose: layerFn(spec.pose, {handL: 'brace'})}, 'L', tw, {palm: {x: 0, y: -1, z: 0}, fingers: {...fwdOf(b.heading + 30), y: -0.5}, w: 0.85});
  }
  pts.hand1 = BK_HAND1; pts.hand2 = BK_HAND2;
  return {spec, body: b, pts};
};

// ================================================================== THE THREE FROM THE EDGE OF THE STREET (C4)
// The drone pilot (checker): the drone in her left hand, the controller in her right; she stops on the slope, holds
// the drone up on her palm, the rotors spin up and it lifts off; her hands come together on the controller; up onto
// the slab in the crest notch. The flare carrier (host): the satchel of flares and canisters on his hip. The decoy
// maker (clerkB): the tablet with the clip-on projector in her left hand.
const DR_PATH: XZ[] = [{x: -11.6, z: 11.2}, {x: -9.2, z: 8.6}, {x: -7.4, z: 7.5}, {x: -6.0, z: 6.3}, {x: -4.9, z: 5.5}];
const DR_WALK = walkSeg(DR_PATH, T3.go, T3.launch, G_HURRY, {A: 0.7, D: 0.6});
const DR_E = walkEnd(DR_WALK);
const DR_PATH2: XZ[] = [{x: DR_E.x, z: DR_E.z}, {x: -3.9, z: 4.4}, {x: -2.6, z: 3.3}, {x: -1.45, z: 2.45}, {x: -0.62, z: 2.05}, {x: 0.0, z: 2.0}];
const DR_WALK2 = walkSeg(DR_PATH2, T3.pilotGo, T3.arrivePilot, G_WALK, {A: 0.6, D: 0.7});
const DR_E2 = walkEnd(DR_WALK2);
const DR_SEGS: Seg[] = [
  DR_WALK,
  standSeg([[T3.launch, DR_E.x, DR_E.z, DR_E.h], [T3.pilotGo, DR_E.x, DR_E.z, DR_E.h]], {half: 0.14, stag: 0.08}),
  DR_WALK2,
  standSeg([[T3.arrivePilot, DR_E2.x, DR_E2.z, DR_E2.h], [T3.turnPilot, 0.0, 2.0, DR_E2.h], [54.2, 0.0, 2.0, 129], [M.CHARGE + 1, 0.0, 2.0, 129]], {half: 0.13, stag: 0.04}),
];
/** the drone in her left hand (carried at her side; held up on the palm at the launch) — body-local, view-free */
const CARRY = {r: -40, u: 168, f: 34};
const HOLD_UP = {r: -14, u: 352, f: 74};
const droneHandLoc = (T: number) => {
  const up = keyN([[T3.launch - 0.3, 0], [T3.spin, 1]], T);
  return {r: lerp(CARRY.r, HOLD_UP.r, up), u: lerp(CARRY.u, HOLD_UP.u, up), f: lerp(CARRY.f, HOLD_UP.f, up)};
};
const pilotPalm = (T: number): V3 => {
  const b = bodyAt(DR_SEGS, T);
  return fromLoc(b, droneHandLoc(T));
};
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
    const p = add3(pilotPalm(T), {x: 0, y: 0.1, z: 0});
    return {pos: p, heading: b.heading, pitch: 0, roll: 0, speed: 0};
  }
  return droneKeys(T, droneFlightKeys(), undefined, 3);
};
export const DRONE_SPIN = T3.spin;
const droneBody = (T: number): V3 => droneC(T).pos;
export const pilotC = (T: number, v?: View): CrewC => {
  const b = bodyAt(DR_SEGS, T);
  const pts: Record<string, V3> = {};
  const hasDrone = T < T3.lift + 0.12;
  const ctrl2 = T >= T3.ctrl;
  let pose: Pose = {drop: 8, lean: 4, armR: {local: {r: 40, u: 196, f: 54}}, armL: {local: CARRY}, handL: 'open', handR: 'grip', face: {mouth: 'flat', brows: -0.3, worry: 0.3}, breath: 0.5};
  const walkArms: Pose = {armR: {local: {r: 38, u: 200, f: 60}}, armL: {local: CARRY}};
  pose = withWalk(b, pose, walkArms);
  if (!b.inWalk) pose = addPose(pose, weight(b));
  // the launch: the drone up on her palm; the rotors spin; it leaves the palm; the hand lowers
  const after2 = after(T, T3.lift + 0.05, 0.4);
  pose = layer(pose, {armL: {local: hasDrone ? droneHandLoc(T) : {r: lerp(HOLD_UP.r, -22, after2), u: lerp(HOLD_UP.u, 245, after2), f: lerp(HOLD_UP.f, 92, after2)}}});
  if (ctrl2) {
    const k = after(T, T3.ctrl, 0.25);
    pose = blendPose(pose, layer(pose, {armL: {local: {r: -22, u: 245, f: 92}}, armR: {local: {r: 22, u: 245, f: 92}}}), k);
  }
  const a = lookSeq(b, T, [[44.3, {x: 0, y: 4.4, z: 2.0}], [T3.launch - 0.2, droneBody(T)], [T3.pilotGo + 0.4, {x: 0.0, y: 4.6, z: 2.0}], [50.4, droneBody(T)], [T3.arrivePilot + 0.1, {x: 1.25, y: 4.9, z: 1.35}], [T3.turnPilot, add3(droneBody(T), {x: 0, y: 0, z: 0})]], 0.35, {lim: 80});
  pose = layer(pose, {twist: (pose.twist ?? 0) + a.twist, head: {yaw: a.yaw, pitch: a.pitch}});
  const ready = after(T, T3.turnPilot + 0.3, 1.2);
  if (ready > 0) pose = blendPose(pose, layer(pose, {drop: lerp(8, 12, after(T, 57.6, 1.6)), lean: 8, face: {mouth: 'flat', brows: -0.4, squint: 0.3}}), ready);
  const tool = ctrl2 ? {handL: 'grip' as const, handR: 'grip' as const, twoHanded: true, extra: controller({lit: 1})} : {handR: 'grip' as const, holdR: controllerHold({lit: 1}), handL: 'open' as const};
  const eb = endBlend('drone', T, b.pos, b.heading, {...pose, ...tool, dmg: dmgR2('drone', T)}, {footL: b.footL, footR: b.footR}, {keepFeetY: true});
  let spec: FigSpec = {key: 'cDrn', look: lookR2('drone'), t: T, seed: 5, pos: eb.pos, heading: eb.heading, pose: (F: FigFrame) => ({...eb.pose, face: {...(eb.pose.face ?? {}), ...eyesTo(F, b, a, null)}}), world: eb.world};
  // the drone sits on her palm: the hand's world point is the drone's underside
  if (hasDrone) {
    const palm = pilotPalm(T);
    spec = handTo(v, spec, 'L', palm, 1, {palm: {x: 0, y: 1, z: 0}, fingers: {...fwdOf(b.heading), y: 0}, w: keyN([[T3.launch - 0.3, 0.3], [T3.spin, 1]], T)});
    pts.palm = palm;
  }
  return {spec, body: b, pts};
};

const FL_PATH: XZ[] = [{x: -12.0, z: 13.0}, {x: -9.6, z: 10.4}, {x: -7.6, z: 9.1}, {x: -6.0, z: 7.6}, {x: -4.65, z: 6.1}, {x: -3.55, z: 4.88}, {x: -2.0, z: 4.68}, {x: -0.6, z: 4.55}, {x: 0.45, z: 4.62}, {x: 1.0, z: 4.8}];
const FL_WALK = walkSeg(FL_PATH, T3.go + 0.25, T3.arriveFlares, G_HURRY, {A: 0.7, D: 0.7});
const FL_E = walkEnd(FL_WALK);
const FL_SEGS: Seg[] = [
  FL_WALK,
  standSeg([[T3.arriveFlares, FL_E.x, FL_E.z, FL_E.h], [52.3, 1.0, 4.8, 338], [T3.turnFlares, 1.0, 4.8, 338], [54.35, 1.0, 4.8, 104], [M.CHARGE + 1, 1.0, 4.8, 104]], {half: 0.15, stag: 0.05}),
];
export const flaresC = (T: number): CrewC => {
  const b = bodyAt(FL_SEGS, T);
  // his right hand on the satchel's strap at his chest while he climbs (it keeps the bag from swinging)
  let pose: Pose = {drop: 8, lean: 4, armR: {local: {r: 6, u: 262, f: 42}, pole: {r: 1, u: -0.6, f: -0.2}}, armL: {local: {r: -52, u: 150, f: 22}}, handR: 'fist', handL: 'relaxed', face: {mouth: 'flat', brows: -0.4}, breath: 0.55};
  const walkArms: Pose = {armR: {local: {r: 8, u: 262, f: 46}, pole: {r: 1, u: -0.6, f: -0.2}}, armL: b.gait?.armL};
  pose = withWalk(b, pose, walkArms);
  if (!b.inWalk) pose = addPose(pose, weight(b));
  const a = lookSeq(b, T, [[44.3, {x: 0.6, y: 5.0, z: 4.0}], [T3.arriveFlares + 0.1, {x: 1.25, y: 4.9, z: 1.35}], [52.6, {x: 0.6, y: 3.9, z: 4.8}], [T3.turnFlares, ARMY_EYE]], 0.4);
  pose = layer(pose, {twist: (pose.twist ?? 0) + a.twist, head: {yaw: a.yaw, pitch: a.pitch}});
  const ready = after(T, T3.turnFlares + 0.2, 1.2);
  if (ready > 0) pose = blendPose(pose, layer(pose, {drop: lerp(10, 22, after(T, 57.6, 1.6)), lean: 9, armR: {local: {r: 52, u: 250, f: 70}}, armL: {local: {r: -18, u: 280, f: 110}}, handL: 'open', handR: 'open', face: {mouth: 'flat', brows: -0.5}}), ready);
  const eb = endBlend('flares', T, b.pos, b.heading, {...pose, extra: flareBag(), dmg: dmgR2('flares', T)}, {footL: b.footL, footR: b.footR});
  const spec: FigSpec = {key: 'cFlr', look: lookR2('flares'), t: T, seed: 9, pos: eb.pos, heading: eb.heading, pose: (F: FigFrame) => ({...eb.pose, face: {...(eb.pose.face ?? {}), ...eyesTo(F, b, a, null)}}), world: eb.world};
  return {spec, body: b, pts: {}};
};

const DC_PATH: XZ[] = [{x: -11.0, z: 14.2}, {x: -9.0, z: 12.2}, {x: -6.8, z: 10.9}, {x: -5.2, z: 9.4}, {x: -3.9, z: 8.1}, {x: -2.95, z: 7.35}, {x: -2.3, z: 6.3}, {x: -2.05, z: 5.38}, {x: -0.6, z: 5.18}, {x: 0.6, z: 5.9}];
const DC_WALK = walkSeg(DC_PATH, T3.go + 0.1, T3.arriveDecoy, G_HURRY, {A: 0.7, D: 0.7});
const DC_E = walkEnd(DC_WALK);
const DC_SEGS: Seg[] = [
  DC_WALK,
  standSeg([[T3.arriveDecoy, DC_E.x, DC_E.z, DC_E.h], [52.75, 0.6, 5.9, 342], [T3.turnDecoy, 0.6, 5.9, 342], [54.4, 0.6, 5.9, 92], [M.CHARGE + 1, 0.6, 5.9, 92]], {half: 0.13, stag: 0.04}),
];
export const decoyC = (T: number): CrewC => {
  const b = bodyAt(DC_SEGS, T);
  const TAB = {r: -28, u: 215, f: 92};
  let pose: Pose = {drop: 6, lean: 5, armL: {local: {r: -34, u: 200, f: 66}, pole: {r: -1, u: -0.7, f: 0}, palm: {r: 0.4, u: 0.3, f: -1}}, armR: {local: {r: 50, u: 150, f: 26}}, handR: 'relaxed', face: {mouth: 'flat', brows: -0.3, worry: 0.4}, breath: 0.55};
  const walkArms: Pose = {armL: {local: {r: -36, u: 204, f: 66}, pole: {r: -1, u: -0.7, f: 0}, palm: {r: 0.4, u: 0.3, f: -1}}, armR: b.gait?.armR};
  pose = withWalk(b, pose, walkArms);
  if (!b.inWalk) pose = addPose(pose, weight(b));
  // a glance at the tablet as she arrives (the screen wakes), then the group; C6: the enemy
  const glance = win(T, 52.25, 52.95, 0.2, 0.25);
  const a = lookSeq(b, T, [[44.3, {x: 0.6, y: 5.2, z: 4.0}], [T3.arriveDecoy, {x: 1.25, y: 4.9, z: 1.35}], [T3.turnDecoy, ARMY_EYE]], 0.4);
  pose = layer(pose, {twist: (pose.twist ?? 0) + a.twist, head: {yaw: lerp(a.yaw, -6, glance), pitch: lerp(a.pitch, 26, glance)}});
  if (glance > 0) pose = blendPose(pose, layer(pose, {armL: {local: TAB, pole: {r: -1, u: -0.7, f: 0}, palm: {r: 0.4, u: 0.3, f: -1}}, face: {mouth: 'flat', brows: -0.4, lookY: 0.8}}), glance);
  const ready = after(T, T3.turnDecoy + 0.2, 1.2);
  if (ready > 0) pose = blendPose(pose, layer(pose, {drop: lerp(6, 10, after(T, 57.6, 1.6)), lean: 6, armL: {local: TAB, pole: {r: -1, u: -0.7, f: 0}, palm: {r: 0.4, u: 0.3, f: -1}}, armR: {local: {r: 52, u: 250, f: 70}}, handR: 'open', face: {mouth: 'flat', brows: -0.3, worry: 0.4}}), ready);
  const eb = endBlend('decoy', T, b.pos, b.heading, {...pose, handL: 'grip', holdL: tablet({screen: true, glow: 0.2 + 0.4 * glance}), dmg: dmgR2('decoy', T)}, {footL: b.footL, footR: b.footR});
  const spec: FigSpec = {key: 'cDec', look: lookR2('decoy'), t: T, seed: 6, pos: eb.pos, heading: eb.heading, pose: (F: FigFrame) => ({...eb.pose, face: {...(eb.pose.face ?? {}), ...eyesTo(F, b, a, null)}}), world: eb.world};
  return {spec, body: b, pts: {}};
};

// ------------------------------------------------------------------ everyone at T
export const crewC = (T: number, v?: View): Record<RoleC, CrewC> => {
  const director = directorC(T, v);
  return {
    director,
    tether: tetherC(T, v), runner: runnerC(T, v), breaker: breakerC(T, v, director.spec),
    drone: pilotC(T, v), flares: flaresC(T), decoy: decoyC(T),
  };
};
/** the walk segments (for footfall sounds/dust): role → walks */
export const WALKS_C: Record<string, Extract<Seg, {kind: 'walk'}>[]> = {
  tether: [TT_WALK], runner: [RN_RUN, RN_WALK2], breaker: [BK_WALK, BK_WALK2], drone: [DR_WALK, DR_WALK2], flares: [FL_WALK], decoy: [DC_WALK],
};
export const SEGS_C: Record<string, Seg[]> = {director: DIR_SEGS, tether: TT_SEGS, runner: RN_SEGS, breaker: BK_SEGS, drone: DR_SEGS, flares: FL_SEGS, decoy: DC_SEGS};
void [rel, rightOf, toLoc, noise, easeIn, WALL, CUT, B_STAND, BRACED];
