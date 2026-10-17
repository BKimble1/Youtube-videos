// Section D4: the Crew as functions of FILM time T (world metres). Every shot samples the same choreography, so
// positions hold across cuts. Runs use gaitW on groundH (planted feet; the breaker's is a limp); between runs each
// person stands on a keyed root with planted steps. Every contact is a world point shared with the machine or the
// other person (marks.ts, unitAttach, handOn). From the moment each of them is caught (or down), the figure becomes
// the aftermath tableau's own spec (shots/EF/crew.tsx: directorSpec, pilotSpec, heldSpec), blended in, so D4's last
// frames are E/F's first.
import {V3, add3, sub3, mul3, norm3, lerp, clamp, smooth, easeOut, easeIn} from '../../../kit/math';
import {makeView} from '../../engine';
import {
  FigSpec, Pose, blendPose, layer, lookR2, dmgR2, toolsR2, BRACED, BASH, CHARGE_POSE, THROW, KNEEL, KNOCKED_BACK, LYING_BACK, SLUMP,
  plateWear, tetherLauncher, hipReel, tablet, breaker as breakerTool, controller, halligan1, flare as flareHold, figureRig, handOn, GaitW, Role2,
} from '../../rig';
import type {FigProps} from '../../rig';
import {unitAttach, heavyAttach} from '../../mech';
import {M} from '../../timing';
import {TB_CREW, DIRECTOR_SEAT} from '../EF/tableau';
import {directorSpec, pilotSpec, heldSpec, kn, gripAt} from '../EF/crew';
import {EV} from './times';
import {GUARD, BLOCK, BLOCK_GUARD, BLOCK_SKID, RUNNER_STOP, RUNNER_DOWN, TETHER_FACE, LAUNCHER_GRIP, tugGrip, PLANT, STRIKE_GUARD, SLAM, PILOT_DOWN, GATHER} from './marks';
import {Seg, Body, bodyAt, mixFoot, toLoc, fromLoc, lookYaw, lookPitch, lerp3v, XZ, KP, G, onG, autoSteps, footAt, fwdOf, rightOf, headingTo, wrapD, win, after, runEnd} from './motion';
import {unitD4, heavy2At} from './machines';

// ------------------------------------------------------------------ shared
export type CrewOut = {spec: FigSpec; body: {pos: V3; heading: number}; pts?: Record<string, V3>};
const SOLVE_VIEW = makeView({pos: {x: 18, y: 1.6, z: 16}, target: {x: 16, y: 1.0, z: 2}, fov: 40});
const GAITS: Record<string, GaitW> = {
  dir: {stride: 2.0, duty: 0.35, lift: 0.17, bob: 10, armAmp: 40, lean: 15},
  run: {stride: 1.9, duty: 0.36, lift: 0.16, bob: 10, armAmp: 38, lean: 14},
  fast: {stride: 2.1, duty: 0.32, lift: 0.18, bob: 11, armAmp: 48, lean: 17},
  limp: {stride: 1.25, duty: 0.54, lift: 0.09, bob: 7, armAmp: 10, lean: 10, limp: {side: 'L', amt: 0.55}},
  sprint: {stride: 2.1, duty: 0.32, lift: 0.19, bob: 12, armAmp: 50, lean: 20},
  lunge: {stride: 1.1, duty: 0.56, lift: 0.08, bob: 5, armAmp: 12, lean: 14},
};
const base = (role: Role2, key: string, seed: number, b: {pos: V3; heading: number; footL?: V3; footR?: V3}, T: number, pose: Partial<FigProps>, world: FigSpec['world'] = {}): FigSpec => ({
  key, look: lookR2(role), t: T, seed, pos: b.pos, heading: b.heading,
  pose: {...pose, dmg: dmgR2(role, T)},
  world: {...(b.footL ? {footL: b.footL, footR: b.footR} : {}), ...world},
});
const gaitArms = (g?: Pose): Pose => (g ? {armL: g.armL, armR: g.armR} : {});
/** run pose: the gait's body (drop, lean, bob) plus role arms, faded into the stance pose by runK */
const withRun = (b: Body, stance: Pose, runArms: Pose): Pose => {
  if (!b.gait || b.runK <= 0.001) return stance;
  const run = layer(b.gait, runArms, {face: {mouth: 'grit', brows: -0.6}});
  return blendPose(stance, run, b.runK);
};
const look = (pose: Pose, b: {pos: V3; heading: number}, at: V3, w = 1, lim = 75): Pose => {
  const h = pose.head ?? {};
  return {...pose, head: {yaw: lerp(h.yaw ?? 0, lookYaw(b, at, lim), w), pitch: lerp(h.pitch ?? 0, lookPitch(b, at), w), roll: h.roll}};
};
const face = (pose: Pose, f: Pose['face']): Pose => ({...pose, face: {...(pose.face ?? {}), ...f}});
/** kneeling footholds: the front foot forward, the down knee's foot back on its toes (D1's kneelFeet) */
const kneelFeet = (b: {pos: V3; heading: number; footL: V3; footR: V3}, down: 'L' | 'R', w: number): void => {
  if (w <= 0.001) return;
  const f = fwdOf(b.heading), r = rightOf(b.heading);
  const at = (fw: number, side: number, up: number): V3 => { const x = b.pos.x + f.x * fw + r.x * side, z = b.pos.z + f.z * fw + r.z * side; return {x, y: G(x, z) + up, z}; };
  const front = down === 'R' ? at(0.3, -0.15, 0.02) : at(0.3, 0.15, 0.02);
  const back = down === 'R' ? at(-0.3, 0.15, 0.13) : at(-0.3, -0.15, 0.13);
  b.footL = mixFoot(b.footL, down === 'R' ? front : back, w);
  b.footR = mixFoot(b.footR, down === 'R' ? back : front, w);
};
/** blend a spec into another (the hand-over to the tableau's specs): root, pose, world hands and feet */
const toward = (a: FigSpec, b: FigSpec, w: number): FigSpec => {
  if (w <= 0) return a;
  if (w >= 1) return b;
  const pa = (typeof a.pose === 'function' ? {} : a.pose ?? {}) as Pose, pb = (typeof b.pose === 'function' ? {} : b.pose ?? {}) as Pose;
  const Ra = figureRig(SOLVE_VIEW, a), Rb = figureRig(SOLVE_VIEW, b);
  const wa = a.world ?? {}, wb = b.world ?? {};
  const ankle = (R: ReturnType<typeof figureRig>, i: 0 | 1) => R.W(R.rig.ankle[i]);
  const L = (x: V3 | undefined, y: V3 | undefined, fx: V3, fy: V3) => lerp3v(x ?? fx, y ?? fy, w);
  const pose = blendPose(pa, pb, w);
  return {
    ...(w < 0.5 ? a : b), pos: lerp3v(a.pos, b.pos, w), heading: a.heading + wrapD(b.heading - a.heading) * w,
    pose: {...pose, holdL: w < 0.5 ? pa.holdL : pb.holdL, holdR: w < 0.5 ? pa.holdR : pb.holdR, extra: w < 0.5 ? pa.extra : pb.extra, wearL: w < 0.5 ? pa.wearL : pb.wearL, dmg: pb.dmg},
    world: {
      handL: L(wa.handL, wb.handL, Ra.handL, Rb.handL), handR: L(wa.handR, wb.handR, Ra.handR, Rb.handR),
      footL: L(wa.footL, wb.footL, ankle(Ra, 0), ankle(Rb, 0)), footR: L(wa.footR, wb.footR, ankle(Ra, 1), ankle(Rb, 1)),
      orientL: w < 0.5 ? wa.orientL : wb.orientL, orientR: w < 0.5 ? wa.orientR : wb.orientR,
    },
  };
};
const ON = (p: XZ, up = 0) => onG(p.x, p.z, up);
const lerpLoc = (a: {r: number; u: number; f: number}, b: {r: number; u: number; f: number}, k: number) => ({r: lerp(a.r, b.r, k), u: lerp(a.u, b.u, k), f: lerp(a.f, b.f, k)});
/** a person's head height point from their body timeline alone (no poses: no recursion between their looks) */
const headOf = (who: string, T: number): V3 => {
  const b = bodyAt(ALL_SEGS[who], T);
  return {x: b.pos.x, y: b.pos.y + 1.5, z: b.pos.z};
};

// ================================================================== THE DIRECTOR
/** the block: brace → the blow → both heels skid back → the rear foot re-plants → recover; then the pivot to run */
const BLOCK_ROOT: [number, number, number, number][] = [
  [152.8, BLOCK.x, BLOCK.z, 276], [153.08, BLOCK.x, BLOCK.z, 90], [EV.w1Swing, BLOCK.x, BLOCK.z, 90],
  [153.72, BLOCK.x - BLOCK_SKID + 0.02, BLOCK.z + 0.01, 91], [154.35, BLOCK.x - BLOCK_SKID - 0.02, BLOCK.z + 0.02, 90], [154.65, BLOCK.x - BLOCK_SKID - 0.06, BLOCK.z + 0.03, 272],
];
const blockFeet = (() => {
  const a = autoSteps(BLOCK_ROOT.slice(0, 3), {stepLen: 0.45, half: 0.15, stag: 0.16, turn: 95});
  const L0 = a.L[a.L.length - 1], R0 = a.R[a.R.length - 1];
  const t = EV.w1Swing;
  a.L.push([t + 0.005, L0[1], L0[2]], [t + 0.3, L0[1] - BLOCK_SKID, L0[2], 0]);
  a.R.push([t + 0.005, R0[1], R0[2]], [t + 0.33, R0[1] - BLOCK_SKID - 0.06, R0[2] + 0.02, 0]);
  a.R.push([t + 0.36, R0[1] - BLOCK_SKID - 0.06, R0[2] + 0.02], [t + 0.58, R0[1] - BLOCK_SKID - 0.28, R0[2] + 0.08]);
  a.L.push([t + 0.52, L0[1] - BLOCK_SKID, L0[2]], [t + 0.74, L0[1] - BLOCK_SKID - 0.06, L0[2] - 0.02]);
  const p = autoSteps(BLOCK_ROOT.slice(4), {stepLen: 0.45, half: 0.15, stag: 0.14, turn: 95});
  const lL = a.L[a.L.length - 1], lR = a.R[a.R.length - 1];
  a.L.push([BLOCK_ROOT[4][0], lL[1], lL[2]], ...p.L.slice(1)); a.R.push([BLOCK_ROOT[4][0], lR[1], lR[2]], ...p.R.slice(1));
  return a;
})();
const RUN2: XZ[] = [{x: BLOCK_ROOT[5][1], z: BLOCK_ROOT[5][2]}, {x: 24.5, z: 2.2}, {x: 20.0, z: 2.75}, {x: 17.2, z: 2.6}, {x: 14.0, z: 1.6}, {x: GATHER.director.x, z: GATHER.director.z}];
const CHARGE1: XZ[] = [{x: GATHER.director.x + 0.05, z: GATHER.director.z + 0.05}, {x: 12.75, z: -1.0}, {x: 12.98, z: -2.15}];
const CHARGE2: XZ[] = [{x: 13.1, z: -2.4}, {x: 14.6, z: -2.5}, {x: 16.0, z: -2.75}];
const SPRINT: XZ[] = [{x: 11.8, z: 6.3}, {x: 10.6, z: 4.75}, {x: 9.5, z: 3.55}];
/** his braced stance at the plant (left foot toward the heavy) */
const PLANT_FEET = (() => {
  const f = fwdOf(PLANT.h), r = rightOf(PLANT.h);
  const L = {x: PLANT.x + f.x * 0.3 - r.x * 0.17, z: PLANT.z + f.z * 0.3 - r.z * 0.17}, R = {x: PLANT.x - f.x * 0.32 + r.x * 0.17, z: PLANT.z - f.z * 0.32 + r.z * 0.17};
  return {L: [[177.42, L.x, L.z]] as KP[], R: [[177.42, R.x, R.z]] as KP[]};
})();
const DIR_SEGS: Seg[] = [
  {kind: 'stand', root: [[M.P4, 36.6, 1.0, 90], [150.25, 36.15, 1.04, 90], [150.6, 35.75, 1.08, 92], [151.0, 35.6, 1.1, 274]], stag: 0.14},
  {kind: 'run', path: [{x: 35.6, z: 1.1}, {x: 33.0, z: 1.42}, {x: BLOCK.x, z: BLOCK.z}], T0: 151.0, T1: 152.8, gait: GAITS.dir, A: 0.45, D: 0.5},
  {kind: 'stand', root: BLOCK_ROOT, feet: blockFeet},
  {kind: 'run', path: RUN2, T0: 154.65, T1: 160.2, gait: GAITS.dir, A: 0.5, D: 0.7},
  {kind: 'stand', root: [[160.2, GATHER.director.x, GATHER.director.z, runEnd(RUN2).h], [160.6, CHARGE1[0].x, CHARGE1[0].z, GATHER.director.h], [162.15, CHARGE1[0].x, CHARGE1[0].z, 6]], stag: 0.14},
  {kind: 'run', path: CHARGE1, T0: 162.15, T1: 163.32, gait: GAITS.dir, A: 0.35, D: 0},
  {kind: 'stand', root: [[163.32, 12.98, -2.15, runEnd(CHARGE1).h], [163.6, 13.08, -2.32, 22], [163.9, 13.1, -2.4, 60], [164.05, 13.1, -2.4, 88]], stag: 0.12},
  {kind: 'run', path: CHARGE2, T0: 164.05, T1: 165.04, gait: GAITS.dir, A: 0.3, D: 0},
  {kind: 'stand', stag: 0.14, root: [
    [165.04, 16.0, -2.75, runEnd(CHARGE2).h], [165.35, 16.2, -2.85, 85], [166.0, 16.4, -2.75, 75], [167.3, 16.4, -2.75, 72], [168.1, 16.4, -2.9, 215],
    [169.0, 15.0, -2.45, 250], [169.9, 14.1, -1.0, 210], [170.6, 14.0, 0.6, 200], [171.4, 14.0, 0.9, 300], [172.4, 13.8, 1.5, 15], [173.4, 13.5, 2.9, 120], [174.6, 12.3, 5.2, 190],
    [175.3, 11.8, 6.3, 72], [175.85, 11.8, 6.3, 74], [176.3, 11.78, 6.27, headingTo(SPRINT[0], SPRINT[1])],
  ]},
  {kind: 'run', path: SPRINT, T0: 176.3, T1: 177.42, gait: GAITS.sprint, A: 0.3, D: 0.25},
  {kind: 'stand', root: [[177.42, SPRINT[2].x, SPRINT[2].z, runEnd(SPRINT).h], [177.66, PLANT.x, PLANT.z, PLANT.h], [178.0, PLANT.x, PLANT.z, PLANT.h]], feet: PLANT_FEET},
];
/** the plate's world centre for a body and a guard (as marks.plateAt) */
const plateFrom = (b: {pos: V3; heading: number}, g: {r: number; u: number; f: number}): V3 => {
  const w = fromLoc(b, g), f = fwdOf(b.heading);
  return {x: w.x + f.x * 0.05, y: w.y - 0.15, z: w.z + f.z * 0.05};
};
/** the plate arm on the run (D1's guardRun): guarded, carried by the torso, pumping with the stride */
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
const GROUP = {x: 11.6, y: 1.5, z: 3.6};
/** where the Director looks, when (world points), for the stands */
const dirLook = (T: number): V3 | null => {
  if (T < 152.8) return unitAttach(unitD4('W1', T)).head;
  if (T < 154.0) return unitAttach(unitD4('W1', T)).head;
  if (T > 155.9 && T < 157.1) return ON(RUNNER_DOWN, 0.4); // the runner goes down (over his shoulder)
  if (T > 160.6 && T < 160.85) return heavyAttach(heavy2At(T)).eye;
  if (T > 160.85 && T < 161.7) return GROUP; // he looks round at them
  if (T > 161.7 && T < 162.2) return unitAttach(unitD4('W1', T)).head;
  if (T > 165.3 && T < 167.6) return heavyAttach(heavy2At(T)).eye;
  if (T > 167.6 && T < 169.2) return headOf('tether', T); // a look between them: they did it
  if (T > 169.2 && T < 170.5) return headOf('breaker', T);
  if (T > 170.5 && T < 171.6) return {x: 9, y: 3.5, z: -16}; // north: units on the ridge's end
  if (T > 171.6 && T < 172.6) return {x: 2.5, y: 5.0, z: -4}; // west: on the crest behind the van
  if (T > 172.6 && T < 173.7) return {x: 6, y: 3.0, z: 18}; // south
  if (T > 173.7 && T < 175.75) return heavyAttach(heavy2At(T)).eye; // the heavy comes on
  if (T > 175.75 && T < 176.4) return ON(PILOT_DOWN, 0.7); // where its eye goes: her
  if (T > 177.3 && T < 177.8) return heavyAttach(heavy2At(T)).ramTip;
  return null;
};

export const directorAt = (T: number): CrewOut => {
  if (T >= EV.slideEnd) return dirSeat(T);
  if (T >= EV.strike) return dirThrown(T);
  const b = bodyAt(DIR_SEGS, T);
  const tool = toolsR2('director', T).plate!;
  const broken = after(T, EV.w1Swing + 0.01, 0.05);
  // the guard (body-local, so the plate holds its place from any camera)
  const blk = EV.w1Swing;
  const br1In = smooth(clamp((T - (blk - 0.36)) / 0.28)) * (1 - after(T, blk + 0.6, 0.5));
  const hit = T < blk ? 0 : T < blk + 0.06 ? (T - blk) / 0.06 : Math.exp(-(T - blk - 0.06) * 3.2);
  let guard = lerpLoc(GUARD, BLOCK_GUARD, br1In);
  guard = {r: guard.r, u: guard.u - 14 * hit, f: guard.f - 30 * hit};
  let pose: Pose = layer(BRACED({wide: 0.8}), {face: {mouth: 'pant', brows: -0.4}, breath: 0.8});
  // BLOCK: braced for the hammer (he sees it come), the blow drives the plate into him, the heels skid, he absorbs it
  if (T > blk - 0.5 && T < 154.6) {
    const skidK = T >= blk ? clamp((T - blk) / 0.3) : 0, recov = after(T, blk + 0.65, 0.9);
    pose = layer(pose, {
      drop: 26 + 10 * br1In + 22 * hit * (1 - recov) + 10 * skidK * (1 - recov),
      lean: lerp(12 * br1In, -14, hit * (1 - recov)), twist: -12 * br1In,
      head: {pitch: 4 + 10 * hit, yaw: -8 * hit},
      legL: {pitch: -22 * win(T, blk, blk + 0.4, 0.04, 0.15)}, legR: {pitch: -16 * win(T, blk, blk + 0.38, 0.04, 0.15)},
      face: {mouth: hit > 0.3 ? 'pain' : 'grit', brows: -0.8, squint: 0.4 + 0.5 * hit}, breath: 0.7,
    });
  }
  const glance = win(T, 153.95, 154.4, 0.15, 0.15); // a look down at the plate: cracked right through
  // D4-3: panting; he looks round at them; the arm goes up (161.75)
  // (the fist goes well above his head — from behind him it must clear the head to read)
  const arm = win(T, EV.armUp - 0.3, 162.3, 0.28, 0.18);
  // and it sweeps forward, at them, as he goes (not back down past his head)
  const go = after(T, 162.0, 0.25);
  if (arm > 0) pose = blendPose(pose, layer(pose, {armR: {local: {r: 24, u: lerp(565, 430, go), f: lerp(34, 175, go)}, pole: {r: 1, u: 0, f: -0.4}}, handR: 'fist', face: {mouth: 'grit', brows: -0.9}, lean: 2 + 10 * go, drop: 10}), arm);
  // the charges: shoulder-down run, the plate driven into W1's chest (163.3); into W3 (165.02)
  const ch1 = win(T, 162.05, 163.55, 0.2, 0.25), ch2 = win(T, 163.95, 165.25, 0.2, 0.25);
  let chg = 0;
  if (ch1 + ch2 > 0) {
    const tHit = T < 163.8 ? EV.w1Smash : EV.w3Drive;
    const k = T < tHit ? smooth(clamp((T - (tHit - 0.32)) / 0.32)) : 1 - after(T, tHit + 0.12, 0.4);
    const imp = T < tHit ? 0 : Math.exp(-(T - tHit) * 9);
    const P = layer(CHARGE_POSE, BASH(k), {
      armL: {local: {r: -4, u: lerp(300, 330, k), f: lerp(110, 165, k) - 24 * imp}, pole: {r: -1, u: -0.5, f: 0}, palm: {r: 0.2, u: 0, f: -1}},
      drop: 30 + 8 * imp, lean: lerp(26, 20, k) + 8 * imp, face: {mouth: 'grit', brows: -1, squint: 0.6},
    });
    chg = Math.max(ch1, ch2);
    pose = blendPose(pose, P, chg);
  }
  // after the charges: the breath of hope (soft face), then the ring: dread
  const hope = win(T, 166.2, 170.5, 0.6, 0.5), dread = win(T, 170.5, 176.0, 0.5, 0.3);
  if (hope > 0) pose = blendPose(pose, layer(pose, {drop: 18, lean: 6, face: {mouth: 'pant', brows: 0.15, worry: 0.15, squint: 0}, breath: 1}), hope);
  if (dread > 0) pose = blendPose(pose, layer(pose, {drop: 22, lean: 4, face: {mouth: 'sad', brows: 0.7, worry: 0.9}, breath: 0.9}), dread);
  // he sees the ram rise at her: the sprint; the plant; a high block (the plate up into the ram's path)
  const see = win(T, EV.dirSees, 176.4, 0.12, 0.2);
  if (see > 0) pose = face(pose, {mouth: 'o', brows: 0.8, worry: 0.6});
  const plantK = after(T, 177.4, 0.22);
  if (plantK > 0) pose = blendPose(pose, layer(BRACED({wide: 0.9}), {drop: 34, lean: 12, twist: -10, face: {mouth: 'grit', brows: -0.9, squint: 0.5}, breath: 0.8}), plantK);
  // looks
  const lt = dirLook(T);
  if (lt) pose = look(pose, b, lt, 1 - chg);
  if (glance > 0) { const h = pose.head ?? {}; pose = {...pose, head: {yaw: lerp(h.yaw ?? 0, -22, glance), pitch: lerp(h.pitch ?? 0, 32, glance), roll: h.roll}, face: {...pose.face, lookY: 0.7 * glance}}; }
  // the plate arm: the body-local guard except on the runs, the charges, the raised arm's balance
  // spent, looking round at the ring (REALIZE → he sees the ram): the plate arm sinks to his waist, off his face
  const sink = win(T, 170.7, EV.dirSees + 0.15, 0.6, 0.3);
  if (sink > 0) guard = lerpLoc(guard, {r: 16, u: 262, f: 74}, sink);
  const gSet = T > 177.3 ? lerpLoc(guard, STRIKE_GUARD, after(T, 177.3, 0.3)) : guard;
  const guardOn = (1 - chg) * (1 - 0.5 * arm);
  pose = blendPose(pose, layer(pose, {armL: {local: gSet, pole: {r: -1, u: -0.7, f: 0.1}, palm: {r: -0.55, u: 0.1, f: -1}}, handL: 'fist'}), guardOn);
  const final = withRun(b, pose, guardRun(b));
  const glint = Math.max(win(T, blk, blk + 0.16, 0.01, 0.12), win(T, EV.w1Smash, EV.w1Smash + 0.14, 0.01, 0.1), win(T, EV.w3Drive, EV.w3Drive + 0.14, 0.01, 0.1));
  const spec = base('director', 'd4dir', 11, b, T, {...final, handL: 'fist', handR: final.handR ?? 'fist', wearL: plateWear(tool, {glint, broken})});
  return {spec, body: b, pts: {plate: plateFrom(b, gSet)}};
};

// ---- the strike: thrown back against the slab, then the slide down beside the van
const SLAM_FEET = (() => {
  const f = fwdOf(SLAM.h), r = rightOf(SLAM.h);
  return {L: ON({x: SLAM.x + f.x * 0.12 - r.x * 0.17, z: SLAM.z + f.z * 0.12 - r.z * 0.17}), R: ON({x: SLAM.x + f.x * 0.02 + r.x * 0.17, z: SLAM.z + f.z * 0.02 + r.z * 0.17})};
})();
/** his breath in the slump before E/F's own breath takes over (186.0): ragged, slowing */
const slumpBreath = (T: number) => kn(T, [[180.4, 0.3], [181.1, -0.6], [181.85, 0.7], [182.6, -0.5], [183.45, 0.6], [184.3, -0.45], [185.15, 0.45], [186.0, -0.2]]);
/** the tableau's Director (EF directorSpec), breathing before 186.0 (where E/F's breath curve is still flat) */
export const dirSeatSpec = (T: number, anchor?: V3): FigSpec => {
  const s = directorSpec(T, anchor);
  if (T >= 186.0) return s;
  const p = s.pose as Pose;
  const bb = slumpBreath(T);
  return {...s, key: 'd4dir', pose: {...p, bodyPitch: -(27 + bb * 1.3), head: {...(p.head ?? {}), pitch: 24 - bb * 2.2}, face: {...(p.face ?? {}), open: clamp(0.14 + 0.2 * bb, 0, 0.6), mouth: 'breath'}}};
};
const dirSeat = (T: number): CrewOut => ({spec: dirSeatSpec(T), body: {pos: DIRECTOR_SEAT, heading: TB_CREW.director.heading}});
/** against the slab (177.99–179.3): leaning back on it, knees going, head down, right hand to his left side */
const againstSpec = (T: number): FigSpec => {
  const sag = smooth((T - EV.slam) / 1.3);
  const snap = T < EV.slam ? 0 : Math.exp(-(T - EV.slam) * 7) * Math.sin(Math.min(Math.PI, (T - EV.slam) * 14));
  const pose: Pose = {
    drop: 30 + 22 * sag, lean: -22 + 6 * sag, bodyPitch: 0, twist: 4,
    head: {pitch: -12 * snap + 26 * sag, yaw: -10, roll: 8 * sag},
    armL: {fk: {fwd: 8, out: 18, bend: 20}}, handL: 'limp',
    armR: {fk: {fwd: 30, out: 10, bend: 70}}, handR: 'open',
    face: {mouth: sag > 0.3 ? 'breath' : 'pain', open: 0.3, lid: 0.25 + 0.2 * sag, brows: 0.4, worry: 0.6},
    breath: 1, wearL: plateWear('shattered'),
  };
  const s = base('director', 'd4dir', 11, {pos: ON(SLAM), heading: SLAM.h, footL: SLAM_FEET.L, footR: SLAM_FEET.R}, T, pose);
  // the right hand finds his left side (where the stain spreads)
  const R = figureRig(SOLVE_VIEW, s);
  const wound = R.torso({r: -30, u: 48, f: 40});
  const k = smooth((T - 178.15) / 0.5);
  return {...s, world: {...s.world, handR: lerp3v(R.handR, wound, k), orientR: {palm: norm3(sub3(R.torso({r: 0, u: 60, f: 0}), R.torso({r: 0, u: 60, f: 40}))), w: k}}};
};
const dirThrown = (T: number): CrewOut => {
  if (T < EV.slam) {
    // the ram meets the plate: he is driven back off his feet, the plate in pieces, and flies into the slab
    const u = clamp((T - EV.strike) / (EV.slam - EV.strike));
    const e = u * u * (1.6 - 0.6 * u); // fast from the hit, slowed by nothing until the slab
    const pos = {x: lerp(PLANT.x, SLAM.x, e), y: 0, z: lerp(PLANT.z, SLAM.z, e)};
    pos.y = G(pos.x, pos.z) + 0.1 * Math.sin(Math.PI * u);
    const heading = PLANT.h + wrapD(SLAM.h - PLANT.h) * smooth(u);
    const pf = PLANT_FEET;
    const fl0 = ON({x: pf.L[0][1], z: pf.L[0][2]}), fr0 = ON({x: pf.R[0][1], z: pf.R[0][2]});
    // the feet leave the ground a beat after the body (trailing), landing in front of the slab
    const ft = (a: V3, b: V3, lag: number) => {
      const v = clamp((u - lag) / (1 - lag));
      const p = lerp3v(a, b, smooth(v));
      return {...p, y: Math.max(G(p.x, p.z), lerp(a.y, b.y, v)) + 0.28 * Math.sin(Math.PI * v)};
    };
    const pose: Pose = {
      drop: 22, lean: -30, twist: 10 * (1 - u), bodyPitch: 0,
      head: {pitch: -18 + 10 * u, yaw: -6},
      armL: {local: {r: -70, u: 300, f: -40}, pole: {r: -1, u: 0.3, f: -0.4}}, handL: 'open',
      armR: {fk: {fwd: 70, out: 50, bend: 25}}, handR: 'open',
      face: {mouth: 'pain', brows: 0.6, squint: 0.8, lid: 0.4}, breath: 0.4, wearL: plateWear('shattered'),
    };
    const spec = base('director', 'd4dir', 11, {pos, heading, footL: ft(fl0, SLAM_FEET.L, 0.18), footR: ft(fr0, SLAM_FEET.R, 0.1)}, T, pose);
    return {spec, body: {pos, heading}};
  }
  if (T < EV.slide) return {spec: againstSpec(T), body: {pos: ON(SLAM), heading: SLAM.h}};
  // the slide: down the slab's face to the ground beside the van
  const u = smooth(clamp((T - EV.slide) / (EV.slideEnd - EV.slide)));
  const s = toward(againstSpec(EV.slide), dirSeatSpec(EV.slideEnd), u);
  return {spec: {...s, t: T}, body: {pos: s.pos, heading: s.heading}};
};

// ================================================================== THE TETHER OPERATOR (clerkA)
const TTH_RUN1: XZ[] = [{x: 35.3, z: -2.25}, {x: 28.0, z: -2.5}, {x: 21.0, z: -1.75}, {x: 18.7, z: -1.42}];
const TTH_RUN2: XZ[] = [{x: 17.35, z: -1.2}, {x: 16.2, z: -0.3}, {x: GATHER.tether.x, z: GATHER.tether.z}];
const TTH_RUN3: XZ[] = [{x: GATHER.tether.x, z: GATHER.tether.z}, {x: 14.5, z: -0.15}, {x: 15.1, z: -0.4}];
const TTH_RUN4: XZ[] = [{x: 13.5, z: -1.3}, {x: TB_CREW.tether.pos.x, z: TB_CREW.tether.pos.z}];
const TTH_SEGS: Seg[] = [
  {kind: 'stand', root: [[M.P4, 35.5, -2.3, 92], [150.35, 35.4, -2.28, 92], [150.7, 35.3, -2.25, 272]], stag: 0.14},
  {kind: 'run', path: TTH_RUN1, T0: 150.7, T1: 155.95, gait: GAITS.run, A: 0.5, D: 0.6},
  {kind: 'stand', stag: 0.14, root: [[155.95, 18.7, -1.42, runEnd(TTH_RUN1).h], [156.3, 18.62, -1.4, TETHER_FACE.h], [156.75, TETHER_FACE.x, TETHER_FACE.z, TETHER_FACE.h],
    [EV.disarmGrab, TETHER_FACE.x, TETHER_FACE.z, TETHER_FACE.h], [EV.disarmTear, TETHER_FACE.x + 0.06, TETHER_FACE.z, TETHER_FACE.h], [157.95, 17.5, -1.25, 100], [158.3, 17.35, -1.2, 272]]},
  {kind: 'run', path: TTH_RUN2, T0: 158.3, T1: 159.75, gait: GAITS.run, A: 0.4, D: 0.5},
  {kind: 'stand', stag: 0.12, root: [[159.75, GATHER.tether.x, GATHER.tether.z, runEnd(TTH_RUN2).h], [160.2, GATHER.tether.x, GATHER.tether.z, GATHER.tether.h], [162.6, GATHER.tether.x, GATHER.tether.z, 90]]},
  {kind: 'run', path: TTH_RUN3, T0: 162.6, T1: 164.15, gait: GAITS.run, A: 0.4, D: 0.5},
  {kind: 'stand', stag: 0.16, root: [[164.15, 15.1, -0.4, runEnd(TTH_RUN3).h], [164.4, 15.1, -0.4, 40], [164.95, 14.9, -0.2, 36], [165.4, 14.95, -0.22, 36], [166.0, 15.1, -0.3, 60],
    [167.8, 15.15, -0.25, 70], [168.4, 15.1, -0.2, 25], [170.6, 15.0, -0.1, 62], [172.0, 14.6, -0.3, 340], [173.4, 14.0, -0.6, 90], [174.8, 13.5, -1.3, 100],
    [177.9, 13.5, -1.3, 105], [178.15, 13.5, -1.3, headingTo(TTH_RUN4[0], TTH_RUN4[1])]]},
  {kind: 'run', path: TTH_RUN4, T0: 178.15, T1: 179.75, gait: GAITS.lunge, A: 0.4, D: 0.6},
  {kind: 'stand', stag: 0.2, root: [[179.75, TB_CREW.tether.pos.x, TB_CREW.tether.pos.z, runEnd(TTH_RUN4).h], [180.35, TB_CREW.tether.pos.x, TB_CREW.tether.pos.z, TB_CREW.tether.heading]]},
];
const TTH_HELD = EV.grabTether + 0.55;
export const tetherAt = (T: number): CrewOut => {
  if (T >= TTH_HELD) return {spec: heldSpec('tether', T), body: {pos: TB_CREW.tether.pos, heading: TB_CREW.tether.heading}};
  const b = bodyAt(TTH_SEGS, T);
  const armed = T < EV.disarmTear;
  let pose: Pose = layer(BRACED({wide: 0.75}), {armR: {local: {r: 30, u: 240, f: 90}}, armL: {local: {r: -30, u: 220, f: 60}}, handL: 'open', face: {mouth: 'pant', brows: -0.5}, breath: 0.8});
  const world: FigSpec['world'] = {};
  const pts: Record<string, V3> = {};
  // the bluff and the disarm: the empty launcher levelled at H1, its fist closes on the barrel, the tug, torn away
  const aim = win(T, 156.2, EV.disarmTear + 0.02, 0.3, 0.02);
  if (aim > 0) {
    const g = T < EV.disarmGrab ? lerp3v(fromLoc(b, {r: 30, u: 240, f: 90}), fromLoc(b, {r: 22, u: 300, f: 128}), smooth((T - 156.2) / 0.4)) : tugGrip(T);
    const tug = win(T, EV.disarmGrab, EV.disarmTear, 0.05, 0.02);
    pose = blendPose(pose, layer(pose, {drop: 18 + 14 * tug, lean: lerp(6, -14, tug), twist: 12, face: {mouth: tug > 0.3 ? 'grit' : 'flat', brows: -0.8, squint: 0.5}}), aim);
    world.handR = g;
    world.handL = add3(g, {x: 0.1, y: -0.07, z: -0.04});
    pts.grip = g;
  }
  const torn = win(T, EV.disarmTear, 158.4, 0.02, 0.4);
  if (torn > 0) {
    // the hands fly back empty; she staggers back, shocked
    pose = blendPose(pose, layer(pose, {drop: 22, lean: -16, armR: {fk: {fwd: 60, out: 40, bend: 30}}, armL: {fk: {fwd: 40, out: 50, bend: 30}}, handR: 'open', handL: 'open', face: {mouth: 'open', open: 0.5, brows: 0.6, worry: 0.5}}), torn);
  }
  // D4-3: the cut length of cable off her reel, into both hands
  const pull = win(T, EV.cablePull, 164.12, 0.25, 0.04);
  const reel = fromLoc(b, {r: 46, u: 170, f: -6});
  if (pull > 0) {
    const k = clamp((T - EV.cablePull) / (EV.cablePullEnd - EV.cablePull));
    world.handL = lerp3v(reel, fromLoc(b, {r: -30, u: 210, f: 80}), easeOut(k));
    world.handR = lerp3v(fromLoc(b, {r: 40, u: 200, f: 40}), fromLoc(b, {r: 26, u: 216, f: 92}), smooth(k));
    pose = layer(pose, {head: {pitch: 26 * (1 - smooth((T - 161.5) / 0.4)), yaw: 18}, handL: 'grip', handR: 'grip'});
  }
  // the throw (164.45): a sidearm whip of the loop at W3's shins; the haul (164.9): she leans back on it; lets go 165.45
  const thr = win(T, 164.1, EV.cableHaul + 0.05, 0.2, 0.08), haul = win(T, EV.cableHaul - 0.08, 165.5, 0.22, 0.2);
  if (thr > 0 || haul > 0) {
    const k = clamp((T - 164.1) / (EV.cableThrow + 0.1 - 164.1));
    const hr = lerp3v(fromLoc(b, {r: 60, u: 230, f: -30}), fromLoc(b, {r: 10, u: 200, f: 140}), easeIn(k));
    const hl = fromLoc(b, {r: -20, u: 205, f: 70});
    const pl = fromLoc(b, {r: -8, u: 215, f: 40}), pr = fromLoc(b, {r: 18, u: 205, f: 30});
    world.handR = lerp3v(hr, pr, haul);
    world.handL = lerp3v(hl, pl, haul);
    pose = blendPose(pose, layer(pose, {drop: 30 + 20 * haul, lean: lerp(10, -26, haul), twist: lerp(28, -6, k), handL: 'grip', handR: haul > 0.2 ? 'grip' : k > 0.85 ? 'open' : 'grip', face: {mouth: 'grit', brows: -1, squint: 0.6}}), Math.max(thr, haul));
  }
  // the lunge toward him after the strike; her left arm swings back — where the unit catches the wrist (180.4)
  const lunge = after(T, 178.15, 0.3);
  if (lunge > 0) {
    pose = blendPose(pose, layer(pose, {drop: 14, lean: 18, armR: {local: {r: 24, u: 230, f: 120}}, handR: 'open', face: {mouth: 'open', open: 0.45, brows: 0.75, worry: 0.95}}), lunge);
    const c = smooth((T - (EV.grabTether - 0.45)) / 0.45);
    if (c > 0) world.handL = lerp3v(fromLoc(b, {r: -40, u: 210, f: -20}), gripAt('tether', T), c);
  }
  // looks
  const lt: V3 | null = T < 156.0 ? unitAttach(unitD4('H1', T)).head : T < 158.4 ? unitAttach(unitD4('H1', T)).head
    : T > 161.6 && T < 162.4 ? headOf('director', T) : T > 162.4 && T < 165.4 ? unitAttach(unitD4('W3', T)).kneeL
      : T > 167.8 && T < 169.0 ? headOf('director', T) : T > 175.7 && T < 177.9 ? ON(PILOT_DOWN, 0.6) : T >= 177.9 ? ON(SLAM, 1.1) : null;
  if (lt) pose = look(pose, b, lt, 1);
  if (T > 170.5 && T < 175.7) pose = face(pose, {mouth: 'sad', brows: 0.65, worry: 0.85});
  const runArms: Pose = {armR: {local: {r: 26, u: 236, f: 64}}, armL: b.gait?.armL};
  const final = withRun(b, pose, armed ? runArms : gaitArms(b.gait));
  const spec = base('tether', 'd4tth', 3, b, T, {...final, handR: armed ? 'grip' : final.handR ?? 'open', handL: final.handL ?? 'open', holdR: armed ? tetherLauncher({loaded: false}) : undefined, extra: hipReel(0)}, world);
  pts.reel = reel;
  if (world.handL) pts.handL = world.handL;
  if (world.handR) pts.handR = world.handR;
  const out: CrewOut = {spec, body: b, pts};
  if (T > TTH_HELD - 0.5) return {...out, spec: toward(spec, heldSpec('tether', T), smooth((T - (TTH_HELD - 0.5)) / 0.5))};
  return out;
};

// ================================================================== THE RUNNER (guesser)
const RUN_RUN: XZ[] = [{x: 34.9, z: 4.7}, {x: 31.8, z: 3.45}, {x: 28.0, z: 5.2}, {x: 21.5, z: 6.6}, {x: RUNNER_STOP.x, z: RUNNER_STOP.z}];
const RUN_SEGS: Seg[] = [
  {kind: 'stand', root: [[M.P4, 35.2, 4.6, 88], [150.3, 35.0, 4.65, 88], [150.6, 34.9, 4.7, 268]], stag: 0.12},
  {kind: 'run', path: RUN_RUN, T0: 150.6, T1: RUNNER_STOP.t, gait: GAITS.fast, A: 0.5, D: 0.35},
  {kind: 'stand', root: [[RUNNER_STOP.t, RUNNER_STOP.x, RUNNER_STOP.z, runEnd(RUN_RUN).h], [155.62, RUNNER_STOP.x, RUNNER_STOP.z, RUNNER_STOP.h]], stag: 0.18},
];
export const runnerAt = (T: number): CrewOut => {
  const DOWN_SPEC = (t: number) => heldSpec('runner', t);
  if (T >= 158.6) return {spec: DOWN_SPEC(T), body: {pos: TB_CREW.runner.pos, heading: TB_CREW.runner.heading}};
  if (T >= EV.runnerHit) {
    // the blow to the chest: knocked back off his feet, onto his back (head toward the unit, feet toward the van)
    const k = clamp((T - EV.runnerHit) / (EV.runnerDown - EV.runnerHit));
    const pos = lerp3v(ON(RUNNER_STOP), ON(RUNNER_DOWN), easeOut(clamp(k * 1.3)));
    const heading = RUNNER_STOP.h + wrapD(RUNNER_DOWN.h - RUNNER_STOP.h) * smooth(k);
    const kb = KNOCKED_BACK(k);
    const st = bodyAt(RUN_SEGS, EV.runnerHit);
    const feetW = 1 - smooth(clamp((T - EV.runnerHit - 0.08) / 0.25));
    const pose: Pose = layer(kb, {face: {mouth: 'pain', brows: 0.6, lids: 0.3}, dmg: dmgR2('runner', T)});
    let spec: FigSpec = {key: 'd4run', look: lookR2('runner'), t: T, seed: 4, pos, heading, pose: {...pose, handR: k < 0.12 ? 'grip' : 'open', holdR: T < EV.runnerHit + 0.06 ? halligan1({ang: 30}) : undefined}};
    // the feet stay planted for a moment, then leave the ground with the fall (blend to the pose's own legs)
    if (feetW > 0.01) {
      const R = figureRig(SOLVE_VIEW, spec);
      spec = {...spec, world: {footL: lerp3v(R.W(R.rig.ankle[0]), st.footL, feetW), footR: lerp3v(R.W(R.rig.ankle[1]), st.footR, feetW)}};
    }
    // then he lies there, a weak try at lifting his head, and settles into the tableau's pose (breathing)
    if (T > EV.runnerDown) {
      const lie: FigSpec = {...spec, pos: ON(RUNNER_DOWN), heading: RUNNER_DOWN.h, pose: {...LYING_BACK, head: {roll: 8, pitch: -4 - 14 * win(T, 157.2, 158.1, 0.3, 0.4), yaw: -20}, face: {mouth: 'pant', brows: 0.5, worry: 0.6, lids: 0.35}, breath: 0.7, dmg: dmgR2('runner', T)}, world: {}};
      spec = toward(toward(spec, lie, smooth((T - EV.runnerDown) / 0.3)), DOWN_SPEC(T), smooth((T - 157.9) / 0.7));
    }
    return {spec, body: {pos, heading}};
  }
  const b = bodyAt(RUN_SEGS, T);
  let pose: Pose = layer(BRACED({wide: 0.7}), {face: {mouth: 'pant', brows: -0.4}, breath: 0.8});
  // the skid to a stop as the flanker cuts across: the halligan comes up to swing — too late
  const up = win(T, RUNNER_STOP.t - 0.05, EV.runnerHit + 0.2, 0.3, 0.05);
  if (up > 0) pose = blendPose(pose, layer(pose, {drop: 30, lean: -6, twist: 24, armR: {local: {r: 52, u: 380, f: 10}, pole: {r: 1, u: 0.3, f: -0.5}}, armL: {local: {r: -20, u: 260, f: 110}}, handL: 'open', face: {mouth: 'grit', brows: -0.9, squint: 0.4}}), up);
  const lt: V3 = T < RUNNER_STOP.t - 0.6 ? ON({x: 10, z: 4}, 1.2) : unitAttach(unitD4('H5', T)).head;
  pose = look(pose, b, lt, 1);
  const runArms: Pose = {armR: {local: {r: 40, u: 220, f: 60}}, armL: b.gait?.armL};
  const final = withRun(b, pose, runArms);
  const spec = base('runner', 'd4run', 4, b, T, {...final, handR: 'grip', handL: final.handL ?? 'fist', holdR: halligan1({ang: 72})});
  return {spec, body: b, pts: {hand: fromLoc(b, {r: 52, u: 380, f: 10})}};
};

// ================================================================== THE BREAKER (honest): limping, the breaker empty
const BRK_RUN1: XZ[] = [{x: 31.7, z: 2.72}, {x: 24.0, z: 4.6}, {x: 16.2, z: 4.65}, {x: GATHER.breaker.x, z: GATHER.breaker.z}];
const BRK_RUN2: XZ[] = [{x: GATHER.breaker.x, z: GATHER.breaker.z}, {x: 13.95, z: 4.3}];
const BRK_RUN3: XZ[] = [{x: 11.3, z: 7.4}, {x: 10.25, z: 7.75}];
const BRK_SEGS: Seg[] = [
  {kind: 'stand', root: [[M.P4, 31.8, 2.7, 80], [150.2, 31.75, 2.7, 80], [150.55, 31.7, 2.72, 266]], stag: 0.1},
  {kind: 'run', path: BRK_RUN1, T0: 150.55, T1: 159.6, gait: GAITS.limp, A: 0.6, D: 0.7},
  {kind: 'stand', stag: 0.12, root: [[159.6, GATHER.breaker.x, GATHER.breaker.z, runEnd(BRK_RUN1).h], [160.0, GATHER.breaker.x, GATHER.breaker.z, GATHER.breaker.h], [162.42, GATHER.breaker.x, GATHER.breaker.z, 86]]},
  {kind: 'run', path: BRK_RUN2, T0: 162.42, T1: 163.85, gait: GAITS.limp, A: 0.4, D: 0.5},
  {kind: 'stand', stag: 0.16, root: [[163.85, 13.95, 4.3, 92], [164.4, 14.0, 4.3, 94], [164.8, 13.8, 4.45, 102], [165.6, 13.6, 4.6, 95], [167.0, 13.5, 4.7, 85],
    [170.6, 13.3, 4.9, 80], [172.5, 12.6, 6.5, 70], [174.6, 12.0, 7.6, 60], [178.6, 11.8, 7.6, 300], [179.0, BRK_RUN3[0].x, BRK_RUN3[0].z, headingTo(BRK_RUN3[0], BRK_RUN3[1])]]},
  {kind: 'run', path: BRK_RUN3, T0: 179.0, T1: 181.0, gait: GAITS.limp, A: 0.5, D: 0.6},
  {kind: 'stand', stag: 0.1, root: [[181.0, BRK_RUN3[1].x, BRK_RUN3[1].z, runEnd(BRK_RUN3).h], [181.5, 9.9, 7.85, 325], [182.1, TB_CREW.breaker.pos.x, TB_CREW.breaker.pos.z, TB_CREW.breaker.heading]]},
];
/** the breaker's two hands on the tool: port, or the swing (wind-up overhead → contact on the tip target → recoil) */
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
/** the club's contact point: W2's raised left arm (its upper arm, just above the elbow) */
export const clubPoint = (): V3 => {
  const a = unitAttach(unitD4('W2', EV.club - 0.005));
  return lerp3v(a.elbowL, a.shoulderL, 0.3);
};
const BRK_HELD = 182.1;
export const breakerAt = (T: number): CrewOut => {
  if (T >= BRK_HELD) return {spec: heldSpec('breaker', T), body: {pos: TB_CREW.breaker.pos, heading: TB_CREW.breaker.heading}};
  const b = bodyAt(BRK_SEGS, T);
  let pose: Pose = layer(BRACED({wide: 0.85}), {face: {mouth: 'pant', brows: -0.3}, breath: 0.9});
  // D4-3: down on one knee for a breath; up again when the arm goes up
  const kneel = win(T, 160.1, 162.05, 0.5, 0.45);
  if (kneel > 0) pose = blendPose(pose, layer(KNEEL('R'), {drop: 80, lean: 18, face: {mouth: 'pant', brows: 0.1, worry: 0.3}, breath: 1}), kneel);
  kneelFeet(b, 'R', kneel);
  // the club: the trigger (empty, 163.95), then swung overhead into W2's raised arm (164.4)
  const club = T > 163.98 && T < 165.0;
  let hands: {front: V3; back: V3} | null = null;
  let k = 0;
  if (club) {
    k = swingK(T, 163.98, EV.club, 165.0);
    hands = swingHands(b, clubPoint(), k);
    const sw = k < 0.36 ? smooth(k / 0.36) : 1;
    pose = layer(pose, {
      drop: lerp(20, 12, sw) + (k > 0.45 && k < 0.8 ? 26 * Math.sin(Math.PI * clamp((k - 0.45) / 0.35)) : 0),
      // (the body leads the club: its lean is smooth, not whipped with the hands — the head must not lurch)
      lean: k < 0.36 ? lerp(8, -14, smooth(k / 0.36)) : k < 0.55 ? lerp(-14, 24, smooth((k - 0.36) / 0.19)) : lerp(24, 8, smooth((k - 0.55) / 0.45)),
      twist: k < 0.36 ? 16 * smooth(k / 0.36) : lerp(16, -6, smooth((k - 0.36) / 0.3)),
      face: {mouth: 'grit', brows: -1, squint: 0.5},
    });
  }
  // after the swing his bad leg gives: a stagger (the decoy maker steadies him)
  const stag = win(T, 164.75, 166.0, 0.15, 0.5);
  if (stag > 0) pose = blendPose(pose, layer(pose, {drop: 44, lean: 22, side: -8, face: {mouth: 'pain', brows: 0.4}}), stag);
  const hope = win(T, 166.4, 170.5, 0.6, 0.5);
  if (hope > 0) pose = face(pose, {mouth: 'pant', brows: 0.1, worry: 0.1});
  if (T > 170.5 && T < 178) pose = face(pose, {mouth: 'sad', brows: 0.65, worry: 0.85});
  // the leg gives as he limps toward him; he sits down hard (the breaker falls from his hands at 181.35)
  const sit = after(T, 181.3, 0.75);
  const port = {front: fromLoc(b, {r: -16, u: 250, f: 118}), back: fromLoc(b, {r: 32, u: 205, f: 34})};
  const H = hands ?? port;
  const held = T < 181.35;
  const lt: V3 | null = T < 162.0 && T > 161.5 ? headOf('director', T) : T > 162.4 && T < 164.6 ? unitAttach(unitD4('W2', T)).head
    : T > 177.8 ? ON(SLAM, 1.0) : T > 175.7 ? ON(PILOT_DOWN, 0.6) : null;
  if (lt) pose = look(pose, b, lt, 1);
  const runArms: Pose = {armL: {local: {r: -16, u: 262, f: 112}}, armR: {local: {r: 30, u: 208, f: 36}}};
  const final = withRun(b, pose, held ? runArms : gaitArms(b.gait));
  const handsOn = held ? (b.inRun ? 1 - b.runK : 1) : 0;
  const spec = base('breaker', 'd4brk', 7, b, T, {...final, handL: held ? 'grip' : 'relaxed', handR: held ? 'grip' : 'grip', twoHanded: held, extra: held ? breakerTool({back: 1, front: 0, gauge: 0, fire: 0, recoil: 0}) : undefined},
    held && handsOn > 0.02 ? {handL: H.front, handR: H.back} : {});
  const out: CrewOut = {spec, body: b, pts: {front: H.front, back: H.back}};
  // the leg gives: he sits down hard into the tableau's pose (a unit's hand comes down on his shoulder at 182.3)
  if (sit > 0) return {...out, spec: toward(spec, heldSpec('breaker', T), sit)};
  return out;
};

// ================================================================== THE DECOY MAKER (clerkB)
const DEC_RUN1: XZ[] = [{x: 32.4, z: 2.25}, {x: 29.0, z: 3.0}, {x: 24.0, z: 6.4}, {x: 16.5, z: 6.6}, {x: 14.6, z: 6.85}, {x: GATHER.decoy.x, z: GATHER.decoy.z}];
const DEC_RUN2: XZ[] = [{x: GATHER.decoy.x, z: GATHER.decoy.z}, {x: 13.2, z: 5.35}];
const DEC_SEGS: Seg[] = [
  {kind: 'stand', root: [[M.P4, 32.6, 2.2, 82], [151.05, 32.5, 2.2, 82], [151.4, 32.4, 2.25, 268]], stag: 0.08},
  {kind: 'run', path: DEC_RUN1, T0: 151.4, T1: 159.4, gait: GAITS.run, A: 0.6, D: 0.7},
  {kind: 'stand', stag: 0.08, root: [[159.4, GATHER.decoy.x, GATHER.decoy.z, runEnd(DEC_RUN1).h], [159.75, GATHER.decoy.x, GATHER.decoy.z, GATHER.decoy.h], [162.5, GATHER.decoy.x, GATHER.decoy.z, 86]]},
  {kind: 'run', path: DEC_RUN2, T0: 162.5, T1: 164.1, gait: GAITS.run, A: 0.4, D: 0.5},
  {kind: 'stand', stag: 0.1, root: [[164.1, 13.2, 5.35, runEnd(DEC_RUN2).h], [164.7, 13.25, 5.2, 48], [165.6, 13.15, 5.1, 60], [170.6, 12.9, 5.4, 80], [172.6, 11.6, 5.8, 60],
    [174.6, 11.0, 6.4, 50], [178.3, 11.1, 6.6, 300], [179.6, 11.05, 6.4, 300], [180.45, TB_CREW.decoy.pos.x, TB_CREW.decoy.pos.z, TB_CREW.decoy.heading]]},
];
const DEC_HELD = EV.grabDecoy + 0.5;
export const decoyAt = (T: number): CrewOut => {
  if (T >= DEC_HELD) return {spec: heldSpec('decoy', T), body: {pos: TB_CREW.decoy.pos, heading: TB_CREW.decoy.heading}};
  const b = bodyAt(DEC_SEGS, T);
  const hasTablet = T < EV.tabletDrop;
  let pose: Pose = layer(BRACED({wide: 0.6, fists: false}), {drop: 10, lean: 6, armL: {local: {r: -28, u: 215, f: 92}, pole: {r: -1, u: -0.7, f: 0}, palm: {r: 0.4, u: 0.3, f: -1}}, handR: 'open', face: {mouth: 'pant', brows: -0.3, worry: 0.5}, breath: 0.8});
  // a last look at the smashed tablet, and she lets it fall
  const tab = win(T, 159.5, EV.tabletDrop + 0.2, 0.3, 0.2);
  if (tab > 0) pose = blendPose(pose, layer(pose, {armL: {local: {r: -20, u: 230, f: 120}}, head: {pitch: 30, yaw: -8}, face: {mouth: 'sad', brows: 0.6, worry: 0.8, lookY: 0.8}}), tab);
  if (!hasTablet) pose = layer(pose, {armL: {local: {r: -30, u: 190, f: 70}}, handL: 'relaxed'});
  if (T > 170.5 && T < 178) pose = face(pose, {mouth: 'sad', brows: 0.7, worry: 0.95});
  // reaching toward him after the strike; her right wrist goes back where the unit catches it (181.0)
  const reach = after(T, 178.4, 0.4);
  const world: FigSpec['world'] = {};
  if (reach > 0) {
    pose = blendPose(pose, layer(pose, {lean: 16, drop: 16, armL: {local: {r: -24, u: 250, f: 140}}, handL: 'open', face: {mouth: 'open', open: 0.4, brows: 0.8, worry: 1}}), reach);
    const c = smooth((T - (EV.grabDecoy - 0.45)) / 0.45);
    if (c > 0) world.handR = lerp3v(fromLoc(b, {r: 40, u: 190, f: -10}), gripAt('decoy', T), c);
  }
  const lt: V3 | null = T > 155.6 && T < 156.9 ? ON(RUNNER_DOWN, 0.4) : T > 161.5 && T < 162.4 ? headOf('director', T) : T > 162.4 && T < 165.5 ? headOf('breaker', T)
    : T > 177.8 ? ON(SLAM, 1.0) : T > 175.7 ? ON(PILOT_DOWN, 0.6) : null;
  if (lt && tab < 0.5) pose = look(pose, b, lt, 1);
  const runArms: Pose = {armL: {local: {r: -26, u: 232, f: 70}}, armR: b.gait?.armR};
  const final = withRun(b, pose, hasTablet ? runArms : gaitArms(b.gait));
  let spec = base('decoy', 'd4dec', 6, b, T, {...final, handL: hasTablet ? 'grip' : final.handL ?? 'relaxed', holdL: hasTablet ? tablet({smashed: true, screen: false}) : undefined}, world);
  // she steadies the breaker as his leg gives after the swing: her hands on his back and arm
  const catchW = win(T, 164.8, 165.9, 0.18, 0.35);
  if (catchW > 0) {
    const brk = breakerAt(T).spec;
    spec = handOn(SOLVE_VIEW, brk, {r: 10, u: 85, f: -40}, spec, 'R', catchW, {palm: norm3({x: 0.8, y: 0, z: 0.2}), w: 1});
    spec = handOn(SOLVE_VIEW, brk, {r: -60, u: 110, f: 0}, spec, 'L', catchW);
  }
  const out: CrewOut = {spec, body: b};
  if (T > DEC_HELD - 0.5) return {...out, spec: toward(spec, heldSpec('decoy', T), smooth((T - (DEC_HELD - 0.5)) / 0.5))};
  return out;
};

// ================================================================== THE DRONE PILOT (checker)
const PIL_RUN: XZ[] = [{x: 32.7, z: 0.32}, {x: 24.0, z: 1.0}, {x: 19.5, z: 1.6}, {x: 16.5, z: 3.1}, {x: GATHER.drone.x, z: GATHER.drone.z}];
const PIL_SEGS: Seg[] = [
  {kind: 'stand', root: [[M.P4, 32.8, 0.3, 85], [150.4, 32.75, 0.3, 85], [150.75, 32.7, 0.32, 265]], stag: 0.08},
  {kind: 'run', path: PIL_RUN, T0: 150.75, T1: 158.6, gait: GAITS.run, A: 0.6, D: 0.7},
  {kind: 'stand', stag: 0.08, root: [[158.6, GATHER.drone.x, GATHER.drone.z, runEnd(PIL_RUN).h], [158.95, GATHER.drone.x, GATHER.drone.z, GATHER.drone.h], [162.42, GATHER.drone.x, GATHER.drone.z, 88],
    [163.2, 11.9, 2.9, 75], [166.6, 11.85, 2.95, 80], [168.5, 11.6, 3.5, 88], [169.4, 11.45, 4.0, 85], [EV.droneHit, 11.45, 4.0, 85]]},
];
/** where she lands when the drone hits her, and her scoot back against the van's side */
const PIL_FALL = {x: 10.6, z: 4.45, h: 100};
const SCOOT: [number, number, number, number][] = [[171.7, PIL_FALL.x, PIL_FALL.z, PIL_FALL.h], [172.5, 9.95, 4.1, 102], [173.3, 9.2, 3.55, 100], [174.2, PILOT_DOWN.x, PILOT_DOWN.z, PILOT_DOWN.h]];
/** sitting on the ground, propped on her hands behind her, knees up */
const SIT_PROP: Pose = {drop: 132, lean: -26, bodyPitch: 0, legL: {local: {r: -34, u: 34, f: 118}, pole: {r: -0.2, u: 1, f: 0.3}}, legR: {local: {r: 32, u: 44, f: 96}, pole: {r: 0.2, u: 1, f: 0.3}}, handL: 'brace', handR: 'brace', head: {pitch: -6}};
const PIL_CRAWL = EV.pilotUpEnd;
export const pilotAt = (T: number): CrewOut => {
  if (T >= PIL_CRAWL) return {spec: pilotSpec(T), body: {pos: TB_CREW.drone.pos, heading: TB_CREW.drone.heading}};
  const dmg = dmgR2('drone', T);
  if (T >= EV.droneHit) {
    // knocked down (170.22 → 170.8), dazed, scoots back against the van (171.7 → 174.2), sits propped watching; the
    // strike; then onto her hands and knees (183.7 → 185.45) where her crawl to him begins
    let pos: V3, heading: number;
    if (T < 171.7) {
      const k = smooth(clamp((T - EV.droneHit) / 0.6));
      const st = bodyAt(PIL_SEGS, EV.droneHit);
      pos = lerp3v(st.pos, ON(PIL_FALL), k); heading = st.heading + wrapD(PIL_FALL.h - st.heading) * k;
    } else {
      let i = 0;
      while (i < SCOOT.length - 2 && T > SCOOT[i + 1][0]) i++;
      const a = SCOOT[i], c = SCOOT[i + 1];
      const u = clamp((T - a[0]) / (c[0] - a[0]));
      // each push: the hands set behind, then the hips slide back (a jerky, effortful scoot)
      const e = u < 0.4 ? 0.1 * smooth(u / 0.4) : 0.1 + 0.9 * smooth((u - 0.4) / 0.6);
      pos = ON({x: lerp(a[1], c[1], e), z: lerp(a[2], c[2], e)}); heading = a[3] + wrapD(c[3] - a[3]) * e;
    }
    const fallK = clamp((T - EV.droneHit) / 0.6);
    const kb = KNOCKED_BACK(clamp(fallK * 0.85));
    let pose: Pose = T < 170.9 ? kb : SIT_PROP;
    if (T >= 170.9 && T < 171.8) pose = blendPose(kb, SIT_PROP, smooth((T - 170.9) / 0.9));
    // the ram rising at her: pressed back against the van, her arm up across her face; the flinch at the strike
    const fear = win(T, 175.8, 178.3, 0.4, 0.5);
    const arm = win(T, 177.2, 178.1, 0.25, 0.3);
    pose = layer(pose, {
      face: {mouth: fear > 0.3 ? 'open' : 'pant', open: 0.4 * fear, brows: 0.7, worry: 0.9, squint: T > M.STRIKE - 0.05 && T < 178.0 ? 1 : 0, lid: T > M.STRIKE - 0.05 && T < 177.95 ? 0.85 : 0.1},
      dmg,
    });
    if (arm > 0) pose = blendPose(pose, layer(pose, {armL: {local: {r: -10, u: 300, f: 60}, pole: {r: -1, u: -0.2, f: 0}}, handL: 'open'}), arm);
    // she turns toward him on the ground after the strike (onto her hip, facing him)
    const turn = smooth((T - 178.6) / 1.6);
    if (turn > 0) heading = heading + wrapD(205 - heading) * turn * (1 - smooth((T - EV.pilotUp) / 1.2));
    let spec: FigSpec = {key: 'd4pil', look: lookR2('drone'), t: T, seed: 5, pos, heading, pose};
    // hands planted behind her (palms on the ground)
    if (T >= 170.9) {
      const f = fwdOf(heading), r = rightOf(heading);
      const hp = (sd: number) => ON({x: pos.x - f.x * 0.32 + r.x * sd * 0.2, z: pos.z - f.z * 0.32 + r.z * sd * 0.2}, 0.03);
      const w = smooth((T - 171.0) / 0.6);
      const R0 = figureRig(SOLVE_VIEW, spec);
      const planted = lerp3v(R0.handL, hp(-1), w);
      spec = {...spec, world: {handL: arm > 0 ? lerp3v(planted, R0.handL, smooth(arm)) : planted, handR: lerp3v(R0.handR, hp(1), w), orientL: {palm: {x: 0, y: -1, z: 0}, fingers: {x: -f.x, y: 0, z: -f.z}, w: w * (1 - arm)}, orientR: {palm: {x: 0, y: -1, z: 0}, fingers: {x: -f.x, y: 0, z: -f.z}, w}}};
    }
    // looks: the drone (gone), the heavy, its ram, then him
    const lt: V3 = T < 175.6 ? heavyAttach(heavy2At(T)).eye : T < M.STRIKE ? heavyAttach(heavy2At(T)).ramTip : ON(SLAM, 1.0);
    const b = {pos, heading};
    spec = {...spec, pose: look(spec.pose as Pose, b, T < M.STRIKE + 0.2 ? lt : {x: 6.8, y: 1.0, z: 3.4}, T > M.STRIKE - 0.05 && T < 178.1 ? 0.2 : 1, 95)};
    // up onto her hands and knees: blend into the tableau's crawl start
    if (T > EV.pilotUp) spec = toward(spec, pilotSpec(PIL_CRAWL), smooth((T - EV.pilotUp) / (PIL_CRAWL - EV.pilotUp)));
    return {spec, body: {pos: spec.pos, heading: spec.heading}};
  }
  const b = bodyAt(PIL_SEGS, T);
  let pose: Pose = layer(BRACED({fists: false}), {drop: 14, lean: 8, armL: {local: {r: -22, u: 245, f: 92}}, armR: {local: {r: 22, u: 245, f: 92}}, face: {mouth: 'pant', brows: -0.3, squint: 0.2}, breath: 0.8});
  // the drone coming down at her: she sees it late, an arm comes up
  const dive = win(T, 169.95, EV.droneHit + 0.1, 0.12, 0.05);
  if (dive > 0) pose = blendPose(pose, layer(pose, {lean: -10, armL: {local: {r: -10, u: 330, f: 70}}, head: {pitch: -30}, face: {mouth: 'open', open: 0.5, brows: 0.8, worry: 0.6}}), dive);
  const lt: V3 | null = T > 161.5 && T < 162.4 ? headOf('director', T) : T > 162.4 && T < 166.4 ? headOf('director', T) : T > 169.7 ? {x: 13.5, y: 5.0, z: 5.2} : T > 166.4 ? heavyAttach(heavy2At(T)).eye : null;
  if (lt) pose = look(pose, b, lt, 1);
  const runArms: Pose = {armL: {local: {r: -20, u: 236, f: 84}}, armR: {local: {r: 20, u: 236, f: 84}}};
  const final = withRun(b, pose, runArms);
  const spec = base('drone', 'd4pil', 5, b, T, {...final, handL: 'grip', handR: 'grip', twoHanded: dive < 0.5, extra: dive < 0.5 ? controller({lit: 0}) : undefined});
  return {spec, body: b};
};

// ================================================================== THE FLARE CARRIER (host)
const FLR_RUN1: XZ[] = [{x: 33.8, z: 8.42}, {x: 27.0, z: 8.9}, {x: 23.5, z: 7.6}, {x: 20.0, z: 5.6}, {x: 16.2, z: 4.7}, {x: 14.6, z: 4.75}, {x: 13.2, z: 6.2}, {x: GATHER.flares.x, z: GATHER.flares.z}];
const FLR_RUN2: XZ[] = [{x: GATHER.flares.x, z: GATHER.flares.z}, {x: 14.25, z: 6.55}];
const FLR_SEGS: Seg[] = [
  {kind: 'stand', root: [[M.P4, 34.0, 8.4, 86], [150.35, 33.9, 8.4, 86], [150.7, 33.8, 8.42, 268]], stag: 0.12},
  {kind: 'run', path: FLR_RUN1, T0: 150.7, T1: 158.75, gait: GAITS.run, A: 0.6, D: 0.7},
  {kind: 'stand', stag: 0.12, root: [[158.75, GATHER.flares.x, GATHER.flares.z, runEnd(FLR_RUN1).h], [159.15, GATHER.flares.x, GATHER.flares.z, GATHER.flares.h], [162.5, GATHER.flares.x, GATHER.flares.z, 76]]},
  {kind: 'run', path: FLR_RUN2, T0: 162.5, T1: 164.0, gait: GAITS.run, A: 0.4, D: 0.5},
  {kind: 'stand', stag: 0.14, root: [[164.0, 14.25, 6.55, runEnd(FLR_RUN2).h], [165.2, 14.3, 6.55, 74], [165.8, 14.35, 6.5, 70], [166.4, 14.4, 6.5, 72], [170.6, 14.3, 6.6, 75],
    [172.5, 13.9, 7.4, 60], [174.6, 15.2, 8.9, 50], [177.9, 15.2, 8.9, 300], [178.3, 15.2, 8.9, 295], [179.8, 14.6, 8.2, 295], [181.2, TB_CREW.flares.pos.x, TB_CREW.flares.pos.z, TB_CREW.flares.heading]]},
];
export const FLARE = {draw: EV.flareDraw, strike: EV.flareStrike, throw: EV.flareThrow, hit: EV.flareHit};
const FLR_HELD = EV.grabFlares + 0.5;
export const flaresAt = (T: number): CrewOut => {
  if (T >= FLR_HELD) return {spec: heldSpec('flares', T), body: {pos: TB_CREW.flares.pos, heading: TB_CREW.flares.heading}};
  const b = bodyAt(FLR_SEGS, T);
  let pose: Pose = layer(BRACED({wide: 0.75, fists: false}), {face: {mouth: 'pant', brows: -0.5}, breath: 0.8});
  // D4-3: the last flare out of the bag; he looks at it
  const draw = win(T, FLARE.draw - 0.3, FLARE.draw + 0.9, 0.3, 0.4);
  if (draw > 0) pose = blendPose(pose, layer(pose, {armR: {local: {r: 30, u: 250, f: 110}}, head: {pitch: 22}, face: {lookY: 0.6, brows: 0.2}}), draw);
  // strike (165.22) and throw (wind 165.5 → release 165.8) at heavy 2's eye
  const strike = win(T, FLARE.strike - 0.35, FLARE.strike + 0.15, 0.2, 0.15);
  if (strike > 0) pose = blendPose(pose, layer(pose, {armR: {local: {r: 26, u: 270, f: 120}}, armL: {local: {r: -6, u: 280, f: 130}}, handL: 'fist'}), strike);
  const thK = clamp((T - (FLARE.throw - 0.4 * 0.75)) / 0.75);
  const thW = win(T, FLARE.throw - 0.32, FLARE.throw + 0.6, 0.06, 0.3);
  if (thW > 0) pose = blendPose(pose, THROW(thK), thW);
  if (T > 170.5 && T < 178) pose = face(pose, {mouth: 'sad', brows: 0.6, worry: 0.8});
  // toward him after the strike; his right arm goes back where the unit takes it (181.7)
  const world: FigSpec['world'] = {};
  const go = after(T, 178.4, 0.4);
  if (go > 0) {
    pose = blendPose(pose, layer(pose, {lean: 14, drop: 14, face: {mouth: 'open', open: 0.35, brows: 0.7, worry: 0.9}}), go);
    const c = smooth((T - (EV.grabFlares - 0.45)) / 0.45);
    if (c > 0) world.handR = lerp3v(fromLoc(b, {r: 46, u: 190, f: -16}), gripAt('flares', T), c);
  }
  const eye = heavyAttach(heavy2At(Math.min(T, FLARE.hit))).eye;
  const lt: V3 | null = T > 161.5 && T < 162.4 ? headOf('director', T) : T > 162.4 && T < 166.8 ? eye : T > 177.8 ? ON(SLAM, 1.0) : T > 175.7 ? ON(PILOT_DOWN, 0.6) : null;
  if (lt && draw < 0.5) pose = look(pose, b, lt, 1);
  const runArms: Pose = {armL: b.gait?.armL, armR: b.gait?.armR};
  const final = withRun(b, pose, runArms);
  const holding = T > FLARE.draw && T < FLARE.throw;
  const lit = T > FLARE.strike ? 1 : 0;
  const spec = base('flares', 'd4flr', 9, b, T, {...final, handR: holding ? 'grip' : final.handR ?? 'open', holdR: holding ? flareHold({lit, t: T}) : undefined}, world);
  const out: CrewOut = {spec, body: b, pts: {hand: fromLoc(b, {r: 14, u: 330, f: 150})}};
  if (T > FLR_HELD - 0.5) return {...out, spec: toward(spec, heldSpec('flares', T), smooth((T - (FLR_HELD - 0.5)) / 0.5))};
  return out;
};

// ================================================================== all of them
export const ROLES: Role2[] = ['director', 'tether', 'runner', 'breaker', 'decoy', 'drone', 'flares'];
const rawAt = (role: Role2, T: number): CrewOut => {
  switch (role) {
    case 'director': return directorAt(T);
    case 'tether': return tetherAt(T);
    case 'runner': return runnerAt(T);
    case 'breaker': return breakerAt(T);
    case 'decoy': return decoyAt(T);
    case 'drone': return pilotAt(T);
    default: return flaresAt(T);
  }
};
/**
 * Where a body's timeline switches branch (a hit, a release, a hand taking a new target) the pose would jump in one
 * frame: there it is blended from its last pre-switch state into the new one over d s (pops found by a frame-to-frame
 * scan of every joint).
 */
const SWITCHES: Partial<Record<Role2, [number, number][]>> = {
  runner: [[EV.runnerHit, 0.1], [EV.runnerDown, 0.2]],
  drone: [[EV.droneHit, 0.14]],
  tether: [[EV.disarmTear + 0.02 - 1e-3, 0.12], [164.1, 0.12], [165.5 - 1e-3, 0.18]],
  decoy: [[EV.grabDecoy - 0.45, 0.25]],
  flares: [[EV.grabFlares - 0.45, 0.25]],
};
export const crewAt = (role: Role2, T: number): CrewOut => {
  const o = rawAt(role, T);
  for (const [t0, d] of SWITCHES[role] ?? []) {
    if (T >= t0 && T < t0 + d) return {...o, spec: toward(rawAt(role, t0 - 1e-3).spec, o.spec, smooth((T - t0) / d))};
  }
  return o;
};

// ------------------------------------------------------------------ footfalls (dust and sound where running feet land)
const ALL_SEGS: Record<string, Seg[]> = {director: DIR_SEGS, tether: TTH_SEGS, runner: RUN_SEGS, breaker: BRK_SEGS, decoy: DEC_SEGS, drone: PIL_SEGS, flares: FLR_SEGS};
export type Footfall = {t: number; pos: V3; key: string};
import {gaitW} from '../../rig/gait';
import {runDist, pathLen} from './motion';
/** every running footfall of the Crew in (T − win, T] */
export const crewFootfalls = (T: number, winS = 1.2): Footfall[] => {
  const out: Footfall[] = [];
  for (const [who, segs] of Object.entries(ALL_SEGS)) segs.forEach((s, si) => {
    if (s.kind !== 'run') return;
    const A = s.A ?? 1.0, D = s.D ?? 0.6, L = pathLen(s.path);
    const a = Math.max(s.T0, T - winS), bb = Math.min(T, s.T1);
    if (bb <= a) return;
    const d = (t: number) => runDist(t, s.T0, s.T1, L, A, D);
    const d0 = d(a), d1 = d(bb), W = s.gait.stride;
    for (const phi of [0, 0.5]) for (let k = Math.ceil(d0 / W + phi); (k - phi) * W <= d1 && k < 1e4; k++) {
      const dk = (k - phi) * W;
      if (dk < 0.3) continue;
      let lo = a, hi = bb;
      for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2; if (d(m) < dk) lo = m; else hi = m; }
      const g = gaitW(s.path, dk + 1e-3, s.gait, G);
      out.push({t: hi, pos: phi === 0 ? g.footR : g.footL, key: `${who}${si}_${k}_${phi}`});
    }
  });
  return out;
};
void [SLUMP, ON];
