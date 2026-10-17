// Section D3: the Crew as functions of FILM time T (world metres). Every shot samples the same choreography. It starts
// exactly where D2 leaves them (each spec is blended in from D2's own over the first 0.4 s) and ends exactly in D4's
// start (start.ts: blended into D4's own specs over the last 0.55 s). Runs use gaitW on groundH (planted feet); between
// runs each person stands on a keyed root with planted steps. Contacts are world points on the machines (heavyAttach,
// unitAttach) or on each other (handOn in battle.tsx).
//
//   director  signals (117.15); runs along the north slope under the girder (119.45) to the bait spot west of heavy 1's
//             nose; bangs his plate (122.95, 123.3): the head comes round and the ram slams down short of him (124.05);
//             backs off as it falls; the peak; back up to the rim; front of the group; orders the fall back (144.45);
//             the blast throws him on his back; he gets up with a cut lip and falls back to D4's start
//   breaker   + runner: up at 117.4; behind heavy 1's rear-left leg by 123.1 (round the D2 wrecks, down the slope); the
//             slow wind-up, the knee splits (124.75); the runner hauls him clear and they sprint west as it falls
//   tether    to post 3; aims at the front-left shin, fires (121.85), wraps the cable round the post, the reel locks
//             (122.9); holds it; drones cut it (138.95): she falls back, gets up, runs to the group
//   flares    draws his flare (117.55), strikes it (118.15), throws it into heavy 1's eye (118.78 → 119.38)
//   drone     flies the allied drone throughout (its pose from machines.allyAt); it is struck down at 141.35
//   decoy     sketches again (133.95), taps (134.8): the figures appear; the diver smashes the tablet (136.35), her
//             right hand is cut
import {V3, add3, sub3, mul3, norm3, lerp, clamp, smooth, easeOut, easeIn} from '../../../kit/math';
import {makeView} from '../../engine';
import {
  FigSpec, Pose, keyPose, blendPose, layer, lookR2, dmgR2, toolsR2, figureRig, BRACED, BASH, AIM, THROW, KNEEL, STAND, KNOCKED_BACK, LYING_BACK, RISE_KEYS,
  BLOCK_HIGH, plateWear, tetherLauncher, hipReel, tablet, breaker as breakerTool, controller, halligan1, halligan2, flare as flareHold, GaitW, Role2,
} from '../../rig';
import type {FigProps} from '../../rig';
import {heavyAttach} from '../../mech';
import {M} from '../../timing';
import {EV3} from './times';
import {Seg, Body, bodyAt, mixFoot, toLoc, fromLoc, lookYaw, lookPitch, lerp3v, XZ, G, onG, fwdOf, rightOf, headingTo, wrapD, win, after, runEnd, standAt, keyRoot, KR} from '../D4/motion';
import {heavy1D3, h1ClampPt, DIR_BAIT, RAM2_AT, BLAST_AT, DEC_SPOT, SMASH_AT, allyAt, heavy2D3, H1_BREAK} from './machines';
import {ANCHOR} from '../D2/machines';
import {crewAt as d2CrewAt, Role as D2Role} from '../D2/battle';
import {crewAt as d4CrewAt} from '../D4/crew';
import {CREW_START} from '../D4/start';

/** the blast's knock-back: they are thrown on the first frame after the flash */
const THROW_T = EV3.blast + 0.01;
/**
 * Segment hand-overs without pops: a run never starts with an instant spin (the stand before it turns onto the run's
 * first heading, ≤ 300°/s, half before and half after the run's nominal start); a scripted move ('fn': thrown, a fall)
 * and a stand after one take the body's heading, root and feet over from where the previous segment left them.
 */
function smoothSegs(segs: Seg[]): Seg[] {
  const out: Seg[] = segs.map((s) => (s.kind === 'stand' ? {...s, root: s.root.map((k) => [...k] as KR)} : {...s}));
  for (let k = 1; k < out.length; k++) {
    const s = out[k], p = out[k - 1];
    if (s.kind !== 'run' || p.kind !== 'stand') continue;
    const hR = headingTo(s.path[0], s.path[1]) + (s.back ? 180 : 0);
    const before = p.root.filter((q) => q[0] < s.T0 - 1e-6);
    if (!before.length) continue;
    const hs = keyRoot(before, s.T0).h, dh = wrapD(hR - hs);
    if (Math.abs(dh) < 8) continue;
    const turn = Math.max(0.25, Math.abs(dh) / 300);
    const t0 = s.T0 - turn * 0.5, t1 = s.T0 + turn * 0.5;
    const keep = p.root.filter((q) => q[0] < t0 - 1e-3);
    const at0 = keyRoot(p.root.filter((q) => q[0] <= t0), t0);
    p.root = [...keep, [t0, at0.p.x, at0.p.z, at0.h], [t1, s.path[0].x, s.path[0].z, at0.h + wrapD(hR - at0.h)]];
    s.T0 = t1;
  }
  const res: Seg[] = [];
  out.forEach((s, k) => {
    const prev = res.slice();
    const from = (t0: number) => bodyAt(prev, t0 - 1e-4);
    const blend = (b: {pos: V3; heading: number; footL: V3; footR: V3}, P: Body, w: number) => ({
      ...b, pos: lerp3v(P.pos, b.pos, w), heading: P.heading + wrapD(b.heading - P.heading) * w,
      footL: mixFoot(P.footL, b.footL, w), footR: mixFoot(P.footR, b.footR, w),
    });
    if (k > 0 && s.kind === 'fn') {
      const T0 = s.T0, at = s.at;
      let P: Body | null = null;
      res.push({kind: 'fn', T0, at: (T) => { const o = at(T); const w = smooth(clamp((T - T0) / 0.22)); if (w >= 1) return o; P ??= from(T0); return blend(o, P, w); }});
    } else if (k > 0 && s.kind === 'stand' && out[k - 1].kind === 'fn') {
      const st = s, T0 = s.root[0][0];
      let P: Body | null = null;
      res.push({kind: 'fn', T0, at: (T) => { const b = standAt(st, T); const w = smooth(clamp((T - T0) / 0.3)); if (w >= 1) return b; P ??= from(T0); return blend(b, P, w); }});
    } else res.push(s);
  });
  return res;
}

export type CrewOut = {spec: FigSpec; body: {pos: V3; heading: number}; pts?: Record<string, V3>};
const SOLVE_VIEW = makeView({pos: {x: 40, y: 2.0, z: 14}, target: {x: 47, y: 1.0, z: -2}, fov: 40});
const GAITS: Record<string, GaitW> = {
  dir: {stride: 2.1, duty: 0.34, lift: 0.17, bob: 10, armAmp: 40, lean: 15},
  run: {stride: 2.0, duty: 0.35, lift: 0.16, bob: 10, armAmp: 40, lean: 14},
  crouch: {stride: 1.75, duty: 0.38, lift: 0.13, bob: 8, armAmp: 24, lean: 22},
  dash: {stride: 1.9, duty: 0.34, lift: 0.15, bob: 9, armAmp: 34, lean: 20},
  sprint: {stride: 2.15, duty: 0.32, lift: 0.19, bob: 12, armAmp: 50, lean: 20},
  jog: {stride: 1.6, duty: 0.42, lift: 0.12, bob: 8, armAmp: 26, lean: 10},
  heavy: {stride: 1.95, duty: 0.37, lift: 0.14, bob: 9, armAmp: 6, lean: 13},
  walk: {stride: 1.1, duty: 0.58, lift: 0.08, bob: 5, armAmp: 18, lean: 5},
};
const ON = (p: XZ, up = 0) => onG(p.x, p.z, up);
const at3 = (x: number, z: number, up: number): V3 => onG(x, z, up);
const ramp = (T: number, a: number, b: number) => smooth(clamp((T - a) / Math.max(1e-6, b - a)));
const base = (role: Role2, key: string, seed: number, b: {pos: V3; heading: number; footL?: V3; footR?: V3}, T: number, pose: Partial<FigProps>, world: FigSpec['world'] = {}, feet = true): FigSpec => ({
  key, look: lookR2(role), t: T, seed, pos: b.pos, heading: b.heading,
  pose: {...pose, dmg: dmgR2(role, T)},
  world: {...(feet && b.footL ? {footL: b.footL, footR: b.footR} : {}), ...world},
});
const withRun = (b: Body, stance: Pose, runArms: Pose): Pose => {
  if (!b.gait || b.runK <= 0.001) return stance;
  return blendPose(stance, layer(b.gait, runArms, {face: {mouth: 'grit', brows: -0.6}}), b.runK);
};
const look = (pose: Pose, b: {pos: V3; heading: number}, at: V3 | null, w = 1, lim = 75): Pose => {
  if (!at || w <= 0) return pose;
  const h = pose.head ?? {};
  return {...pose, head: {yaw: lerp(h.yaw ?? 0, lookYaw(b, at, lim), w), pitch: lerp(h.pitch ?? 0, lookPitch(b, at), w), roll: h.roll}};
};
const face = (pose: Pose, f: Pose['face']): Pose => ({...pose, face: {...(pose.face ?? {}), ...f}});
const kneelFeet = (b: {pos: V3; heading: number; footL: V3; footR: V3}, down: 'L' | 'R', w: number): void => {
  if (w <= 0.001) return;
  const f = fwdOf(b.heading), r = rightOf(b.heading);
  const p = (fw: number, side: number, up: number): V3 => { const x = b.pos.x + f.x * fw + r.x * side, z = b.pos.z + f.z * fw + r.z * side; return {x, y: G(x, z) + up, z}; };
  b.footL = mixFoot(b.footL, down === 'R' ? p(0.3, -0.15, 0.02) : p(-0.3, -0.15, 0.13), w);
  b.footR = mixFoot(b.footR, down === 'R' ? p(-0.3, 0.15, 0.13) : p(0.3, 0.15, 0.02), w);
};
/** blend one spec into another (root, pose, world hands/feet) — the hand-overs from D2 and into D4 */
export const towardSpec = (a: FigSpec, b: FigSpec, w: number): FigSpec => {
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
    },
  };
};
const H1_EYE = (T: number) => heavyAttach(heavy1D3(T)).eye;
const H2_EYE = (T: number) => heavyAttach(heavy2D3(T)).eye;
/** the wreck's middle (for the looks after the crash) */
const WRECK_C: V3 = {x: 63.2, y: -1.0, z: -4.8};
/** the flinch at a big impact (head ducks, shoulders up), k by distance */
const flinch = (T: number, t0: number, k = 1, d = 0.7): Pose => {
  const w = win(T, t0, t0 + d, 0.05, 0.45) * k;
  return w > 0 ? {drop: 10 * w, head: {pitch: 14 * w, yaw: 0}, face: {squint: 0.85 * w, brows: -0.8, mouth: 'grit'}} : {};
};
const D4S = (r: Role2) => CREW_START[r];

// ------------------------------------------------------------------ the regroup on the rim (after the crash) and the throws
/** where they stand on the rim from ~131 until the fall back (north of the cover slab, the crater before them) */
export const GRP: Record<Role2, {x: number; z: number; h: number}> = {
  director: {x: 45.9, z: -3.2, h: 92}, decoy: DEC_SPOT, drone: {x: 44.0, z: -2.1, h: 88}, flares: {x: 43.1, z: 4.5, h: 80},
  breaker: {x: 44.3, z: -4.5, h: 95}, runner: {x: 45.3, z: -5.6, h: 98}, tether: {x: 42.9, z: -3.4, h: 90},
};
/** the fall back: each runs from the rim (from EV3.fallBack+) on these lines; the blast (EV3.blast) catches them */
// (D1's wrecks leave a corridor between U1/U2 (z ≤ −1.6) and U4 (z ≥ 3.3) at x 39–42: the breaker, the pilot and the
// decoy maker go through it in lanes; the tether operator and the runner go round north of U1/U2, the flare carrier
// round south of U4; the Director, backing off last, is thrown clear of it and comes through it last)
const BACK: Record<Role2, XZ[]> = {
  director: [{x: 45.7, z: -2.95}, {x: 44.9, z: -1.9}],
  decoy: [{x: 44.5, z: -0.7}, {x: 43.6, z: 0.9}, {x: 42.6, z: 1.55}],
  drone: [{x: 43.65, z: -1.6}, {x: 42.6, z: 0.3}, {x: 40.6, z: 0.75}],
  flares: [{x: 43.1, z: 4.5}, {x: 41.9, z: 5.8}, {x: 39.0, z: 6.5}],
  breaker: [{x: 44.3, z: -4.5}, {x: 43.4, z: -2.0}, {x: 42.0, z: -0.3}],
  runner: [{x: 45.3, z: -5.6}, {x: 43.9, z: -5.95}, {x: 42.3, z: -6.25}],
  tether: [{x: 42.9, z: -3.4}, {x: 42.2, z: -5.2}, {x: 39.6, z: -5.5}, {x: 37.2, z: -3.4}, {x: D4S('tether').pos.x, z: D4S('tether').pos.z}],
};

// ================================================================== THE DIRECTOR (clerkC)
const D0 = {x: 50.25, z: -7.7};
const DIR_RUN1: XZ[] = [D0, {x: 52.0, z: -8.2}, {x: 52.5, z: -9.1}, {x: 54.8, z: -8.9}, DIR_BAIT];
const DIR_BACK = {x: 55.4, z: -9.0};
const DIR_RUN2: XZ[] = [DIR_BACK, {x: 52.6, z: -9.3}, {x: 51.8, z: -8.0}, {x: 50.6, z: -7.7}, {x: 48.6, z: -6.6}, {x: 47.0, z: -4.4}, {x: GRP.director.x, z: GRP.director.z}];
/** thrown on his back by the blast: from where it catches him to where he lands */
const DIR_THROWN = {from: {x: 44.9, z: -1.9}, to: {x: 43.35, z: -2.3}};
const DIR_RUN3: XZ[] = [DIR_THROWN.to, {x: 42.2, z: -0.6}, {x: 40.4, z: 0.4}, {x: 38.2, z: 0.95}, {x: D4S('director').pos.x, z: D4S('director').pos.z}];
const DIR_UP = 146.85, DIR_GO = 148.0;
const DIR_SEGS: Seg[] = smoothSegs([
  {kind: 'stand', root: [[M.P3, D0.x, D0.z, 95], [119.3, D0.x, D0.z, 95], [119.42, D0.x + 0.05, D0.z - 0.04, headingTo(D0, DIR_RUN1[1])]], stag: 0.14},
  {kind: 'run', path: DIR_RUN1, T0: 119.45, T1: 121.35, gait: GAITS.dir, A: 0.5, D: 0.6},
  {kind: 'stand', stag: 0.16, root: [[121.35, DIR_BAIT.x, DIR_BAIT.z, runEnd(DIR_RUN1).h], [121.8, DIR_BAIT.x, DIR_BAIT.z, 112], [124.1, DIR_BAIT.x, DIR_BAIT.z, 112],
    // the slam: a step back from the dust and gravel; then he backs off as it goes over the other way
    [124.38, DIR_BAIT.x - 0.32, DIR_BAIT.z + 0.08, 110], [125.0, DIR_BAIT.x - 0.32, DIR_BAIT.z + 0.08, 112], [125.9, DIR_BACK.x, DIR_BACK.z, 118], [127.85, DIR_BACK.x, DIR_BACK.z, 118], [128.05, DIR_BACK.x - 0.05, DIR_BACK.z + 0.02, headingTo(DIR_BACK, DIR_RUN2[1])]]},
  {kind: 'run', path: DIR_RUN2, T0: 128.1, T1: 130.85, gait: GAITS.dir, A: 0.5, D: 0.7},
  {kind: 'stand', stag: 0.16, root: [[130.85, GRP.director.x, GRP.director.z, runEnd(DIR_RUN2).h], [131.4, GRP.director.x, GRP.director.z, GRP.director.h],
    [136.2, GRP.director.x, GRP.director.z, GRP.director.h], [136.55, GRP.director.x - 0.2, GRP.director.z + 0.25, 70], [138.0, GRP.director.x - 0.2, GRP.director.z + 0.25, 82], [144.45, GRP.director.x - 0.2, GRP.director.z + 0.25, 88],
    // the fall back: he backs off last, facing the heavy
    [145.4, DIR_THROWN.from.x, DIR_THROWN.from.z, 80]], stepLen: 0.42},
  {kind: 'fn', T0: EV3.blast, at: (T) => dirThrownBody(T)},
  {kind: 'stand', stag: 0.14, root: [[DIR_UP + 0.85, DIR_THROWN.to.x + 0.35, DIR_THROWN.to.z, 80], [DIR_GO - 0.1, DIR_THROWN.to.x + 0.35, DIR_THROWN.to.z, 92], [DIR_GO, DIR_THROWN.to.x + 0.3, DIR_THROWN.to.z, headingTo(DIR_THROWN.to, DIR_RUN3[1])]]},
  {kind: 'run', path: [{x: DIR_THROWN.to.x + 0.3, z: DIR_THROWN.to.z}, ...DIR_RUN3.slice(1)], T0: DIR_GO, T1: 149.42, gait: GAITS.dir, A: 0.4, D: 0.45},
  {kind: 'stand', stag: 0.14, root: [[149.42, D4S('director').pos.x, D4S('director').pos.z, runEnd(DIR_RUN3).h], [149.8, D4S('director').pos.x, D4S('director').pos.z, 90]]},
]);
/** his body through the throw, the fall and the get-up (root on the ground; feet from the pose while down) */
const dirThrownBody = (T: number) => {
  const u = clamp((T - EV3.blast) / 0.5);
  const e = 1 - (1 - u) * (1 - u);
  const x = lerp(DIR_THROWN.from.x, DIR_THROWN.to.x, e), z = lerp(DIR_THROWN.from.z, DIR_THROWN.to.z, e);
  const up = T > DIR_UP ? smooth((T - DIR_UP) / 0.85) : 0;
  const pos = {x: lerp(x, DIR_THROWN.to.x + 0.35, up), y: G(x, z) + 0.18 * Math.sin(Math.PI * u) * (1 - up), z};
  const h = 80;
  const f = fwdOf(h), r = rightOf(h);
  const foot = (sd: number): V3 => ON({x: pos.x + f.x * 0.05 + r.x * sd * 0.17, z: pos.z + f.z * 0.05 + r.z * sd * 0.17});
  return {pos, heading: h, footL: foot(-1), footR: foot(1)};
};
const GUARD = {r: 6, u: 345, f: 112};
const plateFrom = (b: {pos: V3; heading: number}, g: {r: number; u: number; f: number}): V3 => {
  const w = fromLoc(b, g), f = fwdOf(b.heading);
  return {x: w.x + f.x * 0.05, y: w.y - 0.15, z: w.z + f.z * 0.05};
};
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
/** getting up off his back (k 0 → 1 over ~0.85 s) */
const UP_FROM_BACK = (k: number): Pose => keyPose([
  [0, layer(LYING_BACK, {head: {pitch: -10, roll: 6}, face: {mouth: 'pain', brows: 0.5, lid: 0.3}})],
  [0.28, {drop: 128, bodyPitch: -50, lean: 0, legL: {fk: {fwd: 45, knee: 80}}, legR: {fk: {fwd: 30, knee: 60}}, armL: {fk: {fwd: -20, out: 30, bend: 40}}, armR: {fk: {fwd: -25, out: 35, bend: 30}}, handR: 'brace', head: {pitch: 18}, face: {mouth: 'grit', brows: -0.3}}],
  [0.55, {drop: 92, bodyPitch: -6, lean: 18, legL: {fk: {fwd: 80, knee: 110}}, legR: {fk: {fwd: -10, knee: 95}}, armR: {fk: {fwd: 30, out: 30, bend: 30}}, handR: 'brace', head: {pitch: -4}, face: {mouth: 'grit', brows: -0.6}}],
  [0.8, layer(KNEEL('R'), {drop: 66, lean: 20, face: {mouth: 'grit', brows: -0.8}})],
  [1, layer(BRACED({wide: 0.8}), {drop: 30, lean: 10, face: {mouth: 'pant', brows: -0.6}, breath: 0.9})],
], k);
export const directorAt = (T: number): CrewOut => {
  const b = bodyAt(DIR_SEGS, T);
  const plate = toolsR2('director', T).plate ?? 'dented';
  let guard = {...GUARD};
  let pose: Pose = layer(BRACED({wide: 0.8}), {face: {mouth: 'grit', brows: -0.6}, breath: 0.6});
  // the start: D2's BRIGHT stance (plate down, breathing): the face hardens as he sees heavy 1 come on
  const bright = 1 - ramp(T, 117.0, 117.4);
  if (bright > 0) pose = blendPose(pose, layer(STAND, {drop: 14, lean: 6, armL: {local: {r: -40, u: 190, f: 70}, palm: {r: 0.4, u: 0.2, f: -1}}, armR: {local: {r: 54, u: 150, f: 30}}, handL: 'fist', handR: 'relaxed', face: {mouth: 'pant', brows: 0.0, worry: 0.1}, breath: 0.85}), bright);
  // the signal: the right arm thrown forward at the heavy — now
  const sig = win(T, EV3.sig, EV3.sigEnd + 0.15, 0.12, 0.2);
  if (sig > 0) pose = blendPose(pose, layer(pose, {armR: {local: {r: 30, u: 320 + 30 * Math.sin(Math.PI * clamp((T - EV3.sig) / 0.4)), f: 200}, palm: {r: 0, u: -1, f: 0.2}}, handR: 'open', face: {mouth: 'open', open: 0.4, brows: -0.9}}), sig);
  // the bait: plate up, the right fist hammers the plate (two blows), shouting at it
  const bait = win(T, 122.6, 124.0, 0.25, 0.2);
  let world: FigSpec['world'] = {};
  const pts: Record<string, V3> = {};
  if (bait > 0) {
    const g2 = {r: 4, u: 360, f: 128};
    guard = {r: lerp(GUARD.r, g2.r, bait), u: lerp(GUARD.u, g2.u, bait), f: lerp(GUARD.f, g2.f, bait)};
    const pl = plateFrom(b, guard);
    const hit = (t0: number) => { const u = T - t0; return u < -0.22 || u > 0.3 ? 0 : u < 0 ? easeIn((u + 0.22) / 0.22) : 1 - smooth(u / 0.3); };
    const k = Math.max(hit(EV3.bang1), hit(EV3.bang2));
    const away = fromLoc(b, {r: 60, u: 330, f: 60}), onPlate = add3(pl, mul3(norm3(sub3(fromLoc(b, {r: 0, u: 340, f: 0}), pl)), -0.04));
    world = {handR: lerp3v(away, add3(onPlate, {x: 0, y: 0.02, z: 0}), k * bait)};
    pts.bang = onPlate;
    pose = blendPose(pose, layer(pose, {drop: 26, lean: 8, twist: -6, face: {mouth: 'open', open: 0.55, brows: -1, squint: 0.4}, handR: 'fist'}), bait);
  }
  // the ram comes down short of him: braced behind the plate, the blast of gravel, a step back
  const brace = win(T, 123.75, 124.7, 0.15, 0.3);
  if (brace > 0) pose = blendPose(pose, layer(pose, {drop: 40, lean: 16, twist: -10, face: {mouth: 'grit', brows: -1, squint: 0.9}}), brace);
  const imp = T >= EV3.ram2 && T < EV3.ram2 + 0.6 ? Math.exp(-(T - EV3.ram2) * 7) : 0;
  if (imp > 0) pose = layer(pose, {drop: (pose.drop ?? 0) + 12 * imp, lean: (pose.lean ?? 0) - 10 * imp, head: {pitch: 16 * imp, yaw: -10 * imp}});
  if (brace > 0) guard = {r: guard.r - 8 * brace, u: guard.u + 18 * brace, f: guard.f + 6 * brace};
  // it goes over: he watches it fall; the crash and the dust wave (face turned from it); the peak: a fierce breath
  pose = layer(pose, flinch(T, EV3.land, 1, 0.9));
  const peak = win(T, 126.9, 128.0, 0.35, 0.2);
  if (peak > 0) pose = blendPose(pose, layer(pose, {drop: 18, lean: 6, face: {mouth: T > 127.4 ? 'grin' : 'pant', brows: -0.2, worry: 0, squint: 0.2}, breath: 1}), peak);
  if (peak > 0) guard = {r: lerp(guard.r, -40, peak), u: lerp(guard.u, 200, peak), f: lerp(guard.f, 70, peak)};
  // up after the blast: the plate low for a moment as he looks back at heavy 2 (the cut lip), then the run
  const back = win(T, DIR_UP + 0.6, DIR_GO + 0.15, 0.2, 0.2);
  if (back > 0) guard = {r: lerp(guard.r, -40, back), u: lerp(guard.u, 210, back), f: lerp(guard.f, 60, back)};
  // on the rim: the arc forms; the light figures; the smash (a step toward her); watching heavy 2
  if (T > 131 && T < 145) pose = face(pose, {mouth: T > 136.3 && T < 137.2 ? 'open' : 'flat', brows: -0.7, worry: T > 140.5 ? 0.4 : 0.1});
  // the fall back: a shout and the left arm sweep (back!)
  const shout = win(T, EV3.fallBack, 145.2, 0.12, 0.25);
  if (shout > 0) pose = blendPose(pose, layer(pose, {armR: {local: {r: 80, u: 300, f: -60}}, handR: 'open', face: {mouth: 'open', open: 0.6, brows: -1}}), shout);
  // the blast: thrown on his back; down; up (cut lip); then the run and D4's braced stance
  let down = false;
  if (T >= EV3.blast && T < DIR_UP + 0.85) {
    down = true;
    const k = clamp((T - EV3.blast) / 0.5);
    const kb = layer(KNOCKED_BACK(k), {face: {mouth: 'pain', brows: 0.6, lids: 0.4}});
    pose = T < EV3.blast + 0.5 ? kb : T < DIR_UP ? layer(LYING_BACK, {head: {pitch: -8 + 6 * Math.sin((T - 146) * 3), roll: 8}, armR: {fk: {fwd: 30, out: 40, bend: 50}}, face: {mouth: 'pain', brows: 0.6, lid: 0.35, squint: 0.4}, breath: 1}) : UP_FROM_BACK((T - DIR_UP) / 0.85);
  }
  // looks
  const lt: V3 | null = T < 117.1 ? H1_EYE(T) : T < EV3.sigEnd ? at3(48.4, -6.2, 1.0) : T < 119.45 ? H1_EYE(T) : T < 121.3 ? null : T < 124.9 ? H1_EYE(T)
    : T < 126.8 ? heavyAttach(heavy1D3(T)).hull : T < 128.1 ? at3(56.4, 0.6, 1.2) : T < 130.8 ? null : T < 135.2 ? at3(56.5, -1, 1.2) : T < 136.2 ? at3(56.5, -0.5, 3.5)
      : T < 137.3 ? ON(DEC_SPOT, 1.3) : T < 140.4 ? at3(46.5, -9, 3) : T < 141.8 ? allyAt(Math.min(T, EV3.kill)) : T < EV3.fallBack ? H2_EYE(T) : T < 145.2 ? at3(42, 0, 1.3)
        : T < EV3.blast ? H2_EYE(T) : T > DIR_UP + 0.85 && T < DIR_GO ? H2_EYE(T) : null;
  if (!down && lt) pose = look(pose, b, lt, 1 - sig * 0.5);
  if (T > DIR_UP + 0.5 && T < DIR_GO + 0.2) pose = face(pose, {mouth: 'grit', brows: -0.8, squint: 0.3});
  // the plate arm: the body-local guard (not while down)
  const guardOn = (1 - bright) * (1 - sig) * (down ? 0 : 1);
  if (!down) pose = blendPose(pose, layer(pose, {armL: {local: guard, pole: {r: -1, u: -0.7, f: 0.1}, palm: {r: -0.55, u: 0.1, f: -1}}, handL: 'fist'}), guardOn);
  const final = down ? pose : withRun(b, pose, guardRun(b));
  const glint = Math.max(win(T, EV3.bang1, EV3.bang1 + 0.14, 0.01, 0.1), win(T, EV3.bang2, EV3.bang2 + 0.14, 0.01, 0.1));
  // the bait's hammering hand comes from (and goes back to) where the pose holds it: no jump at the window's edges
  if (world.handR && bait < 0.999) {
    const nat = figureRig(SOLVE_VIEW, base('director', 'd3dir', 11, b, T, {...final, handL: 'fist', handR: 'fist'}, {}, !down)).handR;
    world = {...world, handR: lerp3v(nat, world.handR, smooth(bait))};
  }
  const spec = base('director', 'd3dir', 11, b, T, {...final, handL: 'fist', handR: final.handR ?? 'fist', wearL: plateWear(plate, {glint})}, world, !down);
  pts.plate = plateFrom(b, guard);
  return {spec, body: b, pts};
};

// ================================================================== THE BREAKER (honest) and THE RUNNER (guesser)
/** behind heavy 1's rear-left leg: the knee's back, 1.1 m out (rear and outer side) */
export const KNEE_AT = (): V3 => H1_BREAK().knees[2];
const BRK_STAND = (() => {
  const k = {x: 63.41, z: -2.72};
  const p = {x: k.x - 0.03, z: k.z + 1.1};
  return {x: p.x, z: p.z, h: headingTo(p, k)};
})();
const RUN_STAND = {x: 62.35, z: -1.35, h: 40};
const K0 = {x: 48.65, z: -7.19}, R0 = {x: 49.17, z: -6.73};
// (north-east of the broken water main, which arches ~1.7 m over the crater floor: they cross it at its buried end)
const BRK_IN: XZ[] = [K0, {x: 50.6, z: -7.85}, {x: 52.0, z: -8.75}, {x: 54.4, z: -7.9}, {x: 58.2, z: -5.0}, {x: 61.4, z: -2.9}, {x: BRK_STAND.x, z: BRK_STAND.z}];
const RUN_IN: XZ[] = [R0, {x: 50.3, z: -7.35}, {x: 51.6, z: -8.45}, {x: 53.6, z: -8.85}, {x: 54.9, z: -8.2}, {x: 57.8, z: -5.55}, {x: 61.0, z: -3.45}, {x: RUN_STAND.x, z: RUN_STAND.z}];
/** the escape: west-south-west, out from under the falling side, then on up the slope */
const BRK_OUT: XZ[] = [{x: BRK_STAND.x - 0.05, z: BRK_STAND.z + 0.05}, {x: 61.6, z: -2.6}, {x: 58.6, z: -4.55}, {x: 55.0, z: -7.4}];
const RUN_OUT: XZ[] = [{x: RUN_STAND.x, z: RUN_STAND.z}, {x: 60.8, z: -2.0}, {x: 58.6, z: -3.55}, {x: 56.4, z: -6.4}];
const BRK_UP: XZ[] = [{x: 55.0, z: -7.4}, {x: 53.6, z: -9.0}, {x: 52.2, z: -9.0}, {x: 51.5, z: -7.85}, {x: 49.8, z: -6.9}, {x: 47.8, z: -5.6}, {x: GRP.breaker.x, z: GRP.breaker.z}];
const RUN_UP: XZ[] = [{x: 56.4, z: -6.4}, {x: 55.75, z: -8.4}, {x: 53.9, z: -9.05}, {x: 52.3, z: -8.75}, {x: 51.7, z: -7.7}, {x: 49.8, z: -6.95}, {x: 47.6, z: -6.2}, {x: GRP.runner.x, z: GRP.runner.z}];
const BRK_BACK2: XZ[] = [...BACK.breaker.slice(2), {x: 40.0, z: 0.1}, {x: 37.6, z: 1.6}, {x: 34.5, z: 2.5}, {x: D4S('breaker').pos.x, z: D4S('breaker').pos.z}];
const RUN_BACK2: XZ[] = [{x: 41.5, z: -6.55}, {x: 39.0, z: -6.1}, {x: 37.5, z: -2.7}, {x: 36.3, z: 1.6}, {x: D4S('runner').pos.x, z: D4S('runner').pos.z}];
const BRK_SEGS: Seg[] = smoothSegs([
  {kind: 'stand', root: [[M.P3, K0.x, K0.z, 130], [117.4, K0.x, K0.z, 130], [117.85, K0.x - 0.05, K0.z - 0.04, 112], [119.7, K0.x - 0.05, K0.z - 0.04, 108]], stag: 0.12},
  {kind: 'run', path: [{x: K0.x - 0.05, z: K0.z - 0.04}, ...BRK_IN.slice(1)], T0: 119.75, T1: 123.1, gait: GAITS.crouch, A: 0.6, D: 0.6},
  {kind: 'stand', stag: 0.18, root: [[123.1, BRK_STAND.x, BRK_STAND.z, runEnd(BRK_IN).h], [123.55, BRK_STAND.x, BRK_STAND.z, BRK_STAND.h], [124.88, BRK_STAND.x, BRK_STAND.z, BRK_STAND.h], [124.95, BRK_STAND.x - 0.05, BRK_STAND.z + 0.05, headingTo(BRK_OUT[0], BRK_OUT[1])]]},
  {kind: 'run', path: BRK_OUT, T0: 124.95, T1: 126.55, gait: GAITS.sprint, A: 0.3, D: 0.5},
  {kind: 'stand', stag: 0.14, root: [[126.55, BRK_OUT[3].x, BRK_OUT[3].z, runEnd(BRK_OUT).h], [126.95, BRK_OUT[3].x, BRK_OUT[3].z, 115], [128.7, BRK_OUT[3].x, BRK_OUT[3].z, 118], [128.85, BRK_OUT[3].x - 0.05, BRK_OUT[3].z, headingTo(BRK_UP[0], BRK_UP[1])]]},
  {kind: 'run', path: BRK_UP, T0: 128.9, T1: 131.8, gait: GAITS.heavy, A: 0.5, D: 0.7},
  {kind: 'stand', stag: 0.12, root: [[131.8, GRP.breaker.x, GRP.breaker.z, runEnd(BRK_UP).h], [132.3, GRP.breaker.x, GRP.breaker.z, GRP.breaker.h], [EV3.fallBack + 0.1, GRP.breaker.x, GRP.breaker.z, GRP.breaker.h], [EV3.fallBack + 0.3, GRP.breaker.x - 0.05, GRP.breaker.z + 0.05, headingTo(BACK.breaker[0], BACK.breaker[1])]]},
  {kind: 'run', path: BACK.breaker, T0: EV3.fallBack + 0.1, T1: 145.55, gait: GAITS.heavy, A: 0.35, D: 0.3},
  {kind: 'stand', stag: 0.12, root: [[145.55, BACK.breaker[2].x, BACK.breaker[2].z, runEnd(BACK.breaker).h], [146.7, BACK.breaker[2].x, BACK.breaker[2].z, runEnd(BACK.breaker).h + 15], [146.9, BACK.breaker[2].x, BACK.breaker[2].z, headingTo(BRK_BACK2[0], BRK_BACK2[1])]]},
  {kind: 'run', path: BRK_BACK2, T0: 146.95, T1: 148.95, gait: GAITS.heavy, A: 0.4, D: 0.6},
  {kind: 'stand', stag: 0.1, root: [[148.95, D4S('breaker').pos.x, D4S('breaker').pos.z, runEnd(BRK_BACK2).h], [149.8, D4S('breaker').pos.x, D4S('breaker').pos.z, D4S('breaker').heading]]},
]);
const RUN_SEGS: Seg[] = smoothSegs([
  {kind: 'stand', root: [[M.P3, R0.x, R0.z, 138], [117.45, R0.x, R0.z, 138], [117.9, R0.x + 0.05, R0.z - 0.05, 110], [120.05, R0.x + 0.05, R0.z - 0.05, 108]], stag: 0.12},
  {kind: 'run', path: [{x: R0.x + 0.05, z: R0.z - 0.05}, ...RUN_IN.slice(1)], T0: 120.1, T1: 123.2, gait: GAITS.crouch, A: 0.6, D: 0.6},
  {kind: 'stand', stag: 0.16, root: [[123.2, RUN_STAND.x, RUN_STAND.z, runEnd(RUN_IN).h], [123.6, RUN_STAND.x, RUN_STAND.z, RUN_STAND.h], [124.8, RUN_STAND.x, RUN_STAND.z, RUN_STAND.h], [124.92, RUN_STAND.x, RUN_STAND.z, headingTo(RUN_OUT[0], RUN_OUT[1])]]},
  {kind: 'run', path: RUN_OUT, T0: 124.95, T1: 126.5, gait: GAITS.sprint, A: 0.3, D: 0.5},
  {kind: 'stand', stag: 0.14, root: [[126.5, RUN_OUT[3].x, RUN_OUT[3].z, runEnd(RUN_OUT).h], [126.9, RUN_OUT[3].x, RUN_OUT[3].z, 112], [128.3, RUN_OUT[3].x, RUN_OUT[3].z, 112], [128.45, RUN_OUT[3].x - 0.05, RUN_OUT[3].z, headingTo(RUN_UP[0], RUN_UP[1])]]},
  {kind: 'run', path: RUN_UP, T0: 128.5, T1: 131.15, gait: GAITS.run, A: 0.5, D: 0.7},
  {kind: 'stand', stag: 0.12, root: [[131.15, GRP.runner.x, GRP.runner.z, runEnd(RUN_UP).h], [131.6, GRP.runner.x, GRP.runner.z, GRP.runner.h], [EV3.fallBack + 0.35, GRP.runner.x, GRP.runner.z, GRP.runner.h], [EV3.fallBack + 0.5, GRP.runner.x, GRP.runner.z, headingTo(BACK.runner[0], BACK.runner[1])]]},
  {kind: 'run', path: BACK.runner, T0: EV3.fallBack + 0.5, T1: THROW_T, gait: GAITS.run, A: 0.35, D: 0},
  {kind: 'fn', T0: THROW_T, at: (T) => runnerThrown(T)},
  {kind: 'stand', stag: 0.12, root: [[146.95, 41.5, -6.55, 230], [147.1, 41.5, -6.55, headingTo(RUN_BACK2[0], RUN_BACK2[1])]]},
  {kind: 'run', path: RUN_BACK2, T0: 147.1, T1: 149.3, gait: GAITS.run, A: 0.35, D: 0.6},
  {kind: 'stand', stag: 0.12, root: [[149.3, D4S('runner').pos.x, D4S('runner').pos.z, runEnd(RUN_BACK2).h], [149.75, D4S('runner').pos.x, D4S('runner').pos.z, D4S('runner').heading]]},
]);
/** the runner: the blast catches him mid-stride; he goes down sideways onto his hip and rolls up */
const runnerThrown = (T: number) => {
  const a = BACK.runner[2], b2 = {x: 41.5, z: -6.55};
  const u = clamp((T - THROW_T) / 0.55), e = 1 - (1 - u) * (1 - u);
  const x = lerp(a.x, b2.x, e), z = lerp(a.z, b2.z, e);
  const h = 230;
  const f = fwdOf(h), r = rightOf(h);
  const foot = (sd: number): V3 => ON({x: x + f.x * 0.1 + r.x * sd * 0.17, z: z + f.z * 0.1 + r.z * sd * 0.17});
  return {pos: ON({x, z}), heading: h, footL: foot(-1), footR: foot(1)};
};
/** the breaker's swing as world hand keys around a tip target (D1/D2): wind-up overhead → strike → recoil */
const swingHands = (b: {pos: V3; heading: number}, tip: V3, k: number) => {
  const chest = fromLoc(b, {r: 0, u: 300, f: 20});
  const d = norm3(sub3(tip, chest));
  const TIP = 144 / 251.4, BACKL = 0.44;
  const fS = sub3(tip, mul3(d, TIP)), bS = sub3(fS, mul3(d, BACKL));
  const fR = fromLoc(b, {r: -16, u: 250, f: 118}), bR = fromLoc(b, {r: 32, u: 205, f: 34});
  const fW = fromLoc(b, {r: 14, u: 440, f: -10}), bW = fromLoc(b, {r: 30, u: 365, f: -76});
  const fC = sub3(fS, mul3(d, 0.16)), bC = sub3(bS, mul3(d, 0.16));
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
/** where the ram head lands: the back of the rear-left knee (a touch behind it) */
export const kneeTarget = (): V3 => {
  const k = KNEE_AT();
  return {x: k.x + 0.04, y: k.y - 0.08, z: k.z + 0.14};
};
const BRK_DOWN = {t0: 145.5, t1: 146.85};
export const breakerAt = (T: number): CrewOut => {
  const b = bodyAt(BRK_SEGS, T);
  const gauge = toolsR2('breaker', T).gauge ?? 1;
  let pose: Pose = layer(BRACED({wide: 0.85}), {face: {mouth: 'grit', brows: -0.5}});
  // the start: kneeling behind the runner (D2), breathing; up at 117.4
  const kneel0 = 1 - ramp(T, 117.35, 117.8);
  if (kneel0 > 0) pose = blendPose(pose, layer(KNEEL('L'), {drop: 80, lean: 12, face: {mouth: 'pant', brows: 0.1, worry: 0.3}, breath: 0.8}), kneel0);
  // the wind-up (slow), the strike into the knee, the recoil
  const swing = T > 123.9 && T < 125.0;
  let hands: {front: V3; back: V3} | null = null;
  let k = 0;
  if (swing) {
    k = swingK(T, EV3.brkWind, EV3.knee, 125.0);
    hands = swingHands(b, kneeTarget(), k);
    const sw = k < 0.36 ? smooth(k / 0.36) : 1;
    pose = layer(pose, {
      drop: lerp(24, 10, sw) + (k > 0.45 && k < 0.8 ? 26 * Math.sin(Math.PI * clamp((k - 0.45) / 0.35)) : 0),
      lean: k < 0.36 ? lerp(8, -18, smooth(k / 0.36)) : k < 0.55 ? lerp(-18, 20, smooth((k - 0.36) / 0.19)) : lerp(20, 6, smooth((k - 0.55) / 0.45)),
      twist: k < 0.36 ? 16 * smooth(k / 0.36) : lerp(16, -6, smooth((k - 0.36) / 0.3)),
      face: {mouth: 'grit', brows: -1, squint: 0.6},
    });
  }
  // set under it: crouched, the tool ready, looking up at the knee
  const set = win(T, 123.2, 124.0, 0.3, 0.1);
  if (set > 0) pose = blendPose(pose, layer(pose, {drop: 34, lean: 14, face: {mouth: 'grit', brows: -0.8}}), set);
  // the crash behind them; the peak (a look back at it, the gauge low)
  pose = layer(pose, flinch(T, EV3.land, 0.8, 0.9));
  if (T > 126.9 && T < 128.1) pose = face(pose, {mouth: 'grin', brows: 0, squint: 0.2});
  // the blast: knocked down onto a knee (the tool across his thigh); he checks the gauge: empty
  const kd = win(T, BRK_DOWN.t0, BRK_DOWN.t1, 0.18, 0.3);
  if (kd > 0) pose = blendPose(pose, layer(KNEEL('R'), {drop: 84, lean: 22, head: {pitch: 30, yaw: 4}, face: {mouth: 'pant', brows: 0.3, worry: 0.6, lookY: 0.7}, breath: 1}), kd);
  kneelFeet(b, 'L', kneel0);
  kneelFeet(b, 'R', kd);
  const lt: V3 | null = T < 117.6 ? at3(50.25, -7.7, 1.5) : T < 119.7 ? H1_EYE(T) : T < 123.1 ? null : T < 125.0 ? kneeTarget() : T < 126.6 ? null : T < 128.1 ? WRECK_C
    : T < 131.2 ? null : T < 136.4 ? at3(55.5, -0.5, 1.4) : T < 141.8 ? at3(45.5, -1, 2.0) : T < EV3.fallBack ? H2_EYE(T) : null;
  if (kd < 0.5) pose = look(pose, b, lt, 0.9);
  const port = {front: fromLoc(b, {r: -16, u: 250, f: 118}), back: fromLoc(b, {r: 32, u: 205, f: 34})};
  // the gauge check: the tool lifted across his body, the gauge toward his face
  const chk = win(T, 146.05, 146.85, 0.2, 0.15);
  const H0 = hands ?? port;
  const H = chk > 0 ? {front: lerp3v(H0.front, fromLoc(b, {r: -30, u: 210, f: 90}), chk), back: lerp3v(H0.back, fromLoc(b, {r: 34, u: 190, f: 50}), chk)} : H0;
  const runArms: Pose = {armL: {local: {r: -16, u: 262, f: 112}}, armR: {local: {r: 30, u: 208, f: 36}}};
  const final = withRun(b, pose, runArms);
  const fire = swing ? win(T, EV3.knee, EV3.knee + 0.08, 0.005, 0.05) : 0;
  const spec = base('breaker', 'd3brk', 7, b, T, {...final, handL: 'grip', handR: 'grip', twoHanded: true, extra: breakerTool({back: 1, front: 0, gauge, fire, recoil: fire})}, {handL: H.front, handR: H.back});
  return {spec, body: b, pts: {front: H.front, back: H.back}};
};
const RUN_DOWN = {t0: THROW_T, t1: 147.0};
export const runnerAt = (T: number): CrewOut => {
  const b = bodyAt(RUN_SEGS, T);
  let pose: Pose = layer(BRACED({wide: 0.7}), {face: {mouth: 'grit', brows: -0.4}});
  const kneel0 = 1 - ramp(T, 117.4, 117.85);
  if (kneel0 > 0) pose = blendPose(pose, layer(KNEEL('R'), {drop: 84, lean: 18, armL: {local: {r: -20, u: 170, f: 70}}, armR: {local: {r: 40, u: 150, f: 60}}, handL: 'brace', face: {mouth: 'pant', brows: 0.3, worry: 0.4}, breath: 1}), kneel0);
  // set beside the breaker: the bar raised, watching the heavy above them
  const set = win(T, 123.3, 124.9, 0.3, 0.08);
  if (set > 0) pose = blendPose(pose, layer(pose, {armR: {local: {r: 36, u: 300, f: 110}}, armL: {local: {r: -10, u: 280, f: 130}}, drop: 30, lean: 6, face: {mouth: 'grit', brows: -0.8}}), set);
  // the haul: his left hand on the breaker's arm (battle.tsx solves it onto him), pulling him round and away
  const haul = win(T, EV3.haul - 0.05, 125.55, 0.08, 0.3);
  if (haul > 0) pose = blendPose(pose, layer(pose, {lean: 18, twist: 20, armL: {local: {r: -60, u: 250, f: 40}}, face: {mouth: 'open', open: 0.5, brows: -1}}), haul);
  pose = layer(pose, flinch(T, EV3.land, 0.8, 0.9));
  if (T > 126.9 && T < 128.1) pose = face(pose, {mouth: 'grin', brows: 0.2});
  // the blast: knocked sideways onto his hip, a roll, up
  let down = false;
  if (T >= RUN_DOWN.t0 && T < RUN_DOWN.t1) {
    down = true;
    const u = (T - RUN_DOWN.t0) / (RUN_DOWN.t1 - RUN_DOWN.t0);
    pose = keyPose([
      [0, layer(STAND, {drop: 20, lean: 10})],
      [0.12, {drop: 40, lean: -10, side: -26, armL: {fk: {fwd: 60, out: 70, bend: 20}}, armR: {fk: {fwd: 40, out: 60, bend: 30}}, handL: 'open', handR: 'grip', face: {mouth: 'pain', brows: 0.5, squint: 0.8}}],
      [0.3, {drop: 120, lean: 0, bodyRoll: -60, bodyPitch: 10, legL: {fk: {fwd: 40, knee: 70}}, legR: {fk: {fwd: 20, knee: 50}}, armL: {fk: {fwd: 40, out: 40, bend: 40}}, handL: 'brace', handR: 'grip', face: {mouth: 'pain', brows: 0.5}}],
      [0.55, {drop: 112, lean: 10, bodyRoll: -30, bodyPitch: 20, legL: {fk: {fwd: 60, knee: 100}}, legR: {fk: {fwd: 10, knee: 90}}, handL: 'brace', handR: 'grip', face: {mouth: 'grit', brows: -0.3}}],
      [0.8, layer(KNEEL('L'), {drop: 70, lean: 20, face: {mouth: 'grit', brows: -0.7}})],
      [1, layer(BRACED({wide: 0.7}), {drop: 26, lean: 12, face: {mouth: 'grit'}})],
    ], u);
  }
  if (T >= 146.95 && T < 147.2) kneelFeet(b, 'L', 1 - smooth((T - 146.95) / 0.25));
  kneelFeet(b, 'R', kneel0);
  const lt: V3 | null = T < 117.6 ? at3(50.25, -7.7, 1.5) : T < 119.8 ? H1_EYE(T) : T < 123.2 ? null : T < 124.8 ? heavyAttach(heavy1D3(T)).hull : T < 126.5 ? null : T < 128.1 ? WRECK_C
    : T < 131.1 ? null : T < 136.4 ? at3(55.5, -0.5, 1.4) : T < EV3.fallBack ? H2_EYE(T) : null;
  if (!down) pose = look(pose, b, lt, 0.9);
  const twoH = set > 0.3;
  const runArms: Pose = {armR: {local: {r: 40, u: 220, f: 60}}, armL: b.gait?.armL};
  const final = down ? pose : withRun(b, pose, runArms);
  const spec = base('runner', 'd3run', 4, b, T, {
    ...final, handR: 'grip', handL: twoH ? 'grip' : haul > 0.3 ? 'grip' : final.handL ?? 'fist', twoHanded: twoH,
    ...(twoH ? {extra: halligan2({back: 1, front: 0})} : {holdR: halligan1({ang: 72})}),
  }, {}, !down);
  return {spec, body: b};
};

// ================================================================== THE TETHER (clerkA)
const A0 = {x: 47.3, z: -9.5};
const TTH_FIRE = {x: 47.65, z: -10.15};
const TTH_BRACE = {x: 46.1, z: -10.85};
const TTH_RUN: XZ[] = [{x: TTH_BRACE.x + 0.55, z: TTH_BRACE.z + 0.45}, {x: 45.2, z: -8.6}, {x: 43.6, z: -6.6}, {x: 43.1, z: -4.6}, {x: GRP.tether.x, z: GRP.tether.z}];
const TTH_RUN_H = headingTo(TTH_RUN[0], TTH_RUN[1]);
const TTH_SEGS: Seg[] = smoothSegs([
  {kind: 'stand', stag: 0.16, root: [[M.P3, A0.x, A0.z, 118], [120.3, A0.x, A0.z, 118], [120.95, TTH_FIRE.x, TTH_FIRE.z, 108], [EV3.tBite + 0.02, TTH_FIRE.x, TTH_FIRE.z, 108],
    // the wrap: a step to the post, the launcher swept round it, a step back west, braced against the reel
    [EV3.wrap0 + 0.1, 47.2, -10.85, 95], [EV3.wrap - 0.03, 46.75, -11.1, 70], [EV3.taut + 0.08, TTH_BRACE.x, TTH_BRACE.z, 100], [EV3.cut, TTH_BRACE.x, TTH_BRACE.z, 102]]},
  {kind: 'fn', T0: EV3.cut, at: (T) => tetherFallBody(T)},
  {kind: 'stand', stag: 0.14, root: [[EV3.tRun - 0.05, TTH_BRACE.x + 0.55, TTH_BRACE.z + 0.45, TTH_RUN_H], [EV3.tRun, TTH_BRACE.x + 0.55, TTH_BRACE.z + 0.45, TTH_RUN_H]]},
  {kind: 'run', path: TTH_RUN, T0: EV3.tRun, T1: 141.9, gait: GAITS.run, A: 0.4, D: 0.6},
  {kind: 'stand', stag: 0.14, root: [[141.9, GRP.tether.x, GRP.tether.z, runEnd(TTH_RUN).h], [142.4, GRP.tether.x, GRP.tether.z, GRP.tether.h], [EV3.fallBack + 0.12, GRP.tether.x, GRP.tether.z, GRP.tether.h], [EV3.fallBack + 0.25, GRP.tether.x, GRP.tether.z, headingTo(BACK.tether[0], BACK.tether[1])]]},
  {kind: 'run', path: BACK.tether, T0: EV3.fallBack + 0.05, T1: 148.2, gait: GAITS.run, A: 0.35, D: 0.7},
  {kind: 'stand', stag: 0.14, root: [[148.2, D4S('tether').pos.x, D4S('tether').pos.z, runEnd(BACK.tether).h], [149.1, D4S('tether').pos.x, D4S('tether').pos.z, D4S('tether').heading]]},
]);
/** the cable cut: the pull goes slack, she sits down hard backward, then scrambles up */
const tetherFallBody = (T: number) => {
  const u = clamp((T - EV3.cut) / 0.55), e = 1 - (1 - u) * (1 - u);
  const up = smooth(clamp((T - EV3.tUp) / (EV3.tRun - EV3.tUp)));
  const x = lerp(TTH_BRACE.x, TTH_BRACE.x - 0.55, e) + 1.1 * up, z = lerp(TTH_BRACE.z, TTH_BRACE.z - 0.1, e) + 0.55 * up;
  const h = 102 + wrapD(TTH_RUN_H - 102) * up;
  const f = fwdOf(h), r = rightOf(h);
  const foot = (sd: number): V3 => ON({x: x + f.x * 0.35 * (1 - up) + r.x * sd * 0.17, z: z + f.z * 0.35 * (1 - up) + r.z * sd * 0.17});
  return {pos: ON({x, z}), heading: h, footL: foot(-1), footR: foot(1)};
};
/** the clamp target: heavy 1's front-left shin (where the clamp will be at the bite: it is swinging round) */
export const clampTarget = (T: number): V3 => h1ClampPt(T);
export const tetherAt = (T: number): CrewOut => {
  const b = bodyAt(TTH_SEGS, T);
  let pose: Pose = layer(BRACED({wide: 0.75}), {armR: {local: {r: 30, u: 240, f: 90}}, armL: {local: {r: -30, u: 220, f: 60}}, handL: 'open', face: {mouth: 'flat', brows: -0.5}});
  let recoil = 0;
  let muzzle = add3(fromLoc(b, {r: 30, u: 240, f: 90}), mul3({x: fwdOf(b.heading).x, y: 0, z: fwdOf(b.heading).z}, 0.36));
  let handR: V3 | undefined;
  const target = clampTarget(Math.min(T, EV3.tBite));
  // aim, fire, the bite
  const aimW = win(T, EV3.tAim, EV3.wrap0 + 0.05, 0.3, 0.15);
  if (aimW > 0) {
    const shoulder = fromLoc(b, {r: 36, u: 300, f: 0});
    const d = norm3(sub3(target, shoulder));
    const fr = T > EV3.tFire ? clamp((T - EV3.tFire) / 0.35) : 0;
    recoil = T > EV3.tFire && T < EV3.tFire + 0.35 ? Math.sin(Math.PI * fr) : 0;
    const hR = add3(add3(shoulder, mul3(d, 0.5)), mul3(d, -0.08 * recoil));
    muzzle = lerp3v(muzzle, add3(hR, add3(mul3(d, 0.38), {x: 0, y: 0.07, z: 0})), aimW);
    pose = blendPose(pose, layer(AIM, {
      armR: {local: toLoc(b, hR), pole: {r: 0.6, u: -1, f: 0}, palm: {r: -1, u: 0, f: 0}},
      armL: {local: toLoc(b, add3(add3(hR, mul3(d, -0.18)), {x: 0, y: -0.05, z: 0})), palm: {r: 1, u: 0.3, f: 0}},
      lean: 6, drop: 18, twist: 14, face: {squint: 0.6, mouth: 'flat', brows: -0.7},
    }), aimW);
  }
  // the wrap round post 3 (D2's): the launcher hand goes up and round behind the post and back out on its west side
  const wrapW = win(T, EV3.wrap0 - 0.05, EV3.taut + 0.1, 0.08, 0.1);
  if (wrapW > 0) {
    const u = clamp((T - EV3.wrap0) / (EV3.wrap - EV3.wrap0));
    const P = (dx: number, dy: number, dz: number) => add3(ANCHOR, {x: dx, y: dy, z: dz});
    const K: V3[] = [P(0.35, -0.05, 0.25), P(0.3, 0.02, -0.32), P(-0.3, 0.04, -0.3), P(-0.45, -0.1, 0.15)];
    const s = u * 3, i = Math.min(2, Math.floor(s));
    handR = lerp3v(K[i], K[i + 1], smooth(s - i));
    pose = blendPose(pose, layer(pose, {drop: 10, lean: 4, armL: {local: {r: -40, u: 230, f: 50}}, head: {pitch: -18}, face: {mouth: 'grit', brows: -0.7}}), wrapW);
    muzzle = lerp3v(muzzle, add3(handR, {x: 0, y: 0.06, z: 0}), wrapW);
  }
  // the reel locked: braced, leaning back, the launcher held in against the pull
  const haul = win(T, EV3.taut, EV3.cut + 0.02, 0.1, 0.02);
  if (haul > 0) {
    const d = norm3(sub3(ANCHOR, fromLoc(b, {r: 36, u: 280, f: 0})));
    const hR = add3(fromLoc(b, {r: 36, u: 280, f: 30}), mul3(d, 0.22));
    // the yank (123.08): the pinned leg pulls; she is dragged a little, digs in
    const yk = win(T, EV3.yank + 0.05, EV3.yank + 0.7, 0.06, 0.4);
    pose = blendPose(pose, layer(pose, {
      armR: {local: toLoc(b, hR), pole: {r: 0.6, u: -1, f: 0}, palm: {r: -1, u: 0, f: 0}}, armL: {local: toLoc(b, add3(hR, {x: 0, y: -0.06, z: 0})), palm: {r: 1, u: 0.3, f: 0}},
      lean: -16 + 14 * yk, drop: 34 + 10 * yk, twist: 10, face: {mouth: 'grit', brows: -0.9, squint: 0.6},
    }), haul);
    muzzle = lerp3v(muzzle, add3(hR, mul3(d, 0.36)), haul);
  }
  pose = layer(pose, flinch(T, EV3.land, 0.5, 0.8));
  if (T > 126.8 && T < 128.2) pose = face(pose, {mouth: 'grin', brows: 0.1});
  // the cut: the pull gone, she sits down hard, scrambles up, the empty launcher in her hand
  let down = false;
  if (T >= EV3.cut && T < EV3.tRun) {
    down = true;
    const u = (T - EV3.cut) / (EV3.tRun - EV3.cut);
    pose = keyPose([
      [0, layer(pose, {})],
      [0.12, {drop: 60, lean: -30, armR: {fk: {fwd: 50, out: 30, bend: 20}}, armL: {fk: {fwd: 40, out: 50, bend: 20}}, handL: 'open', face: {mouth: 'o', brows: 0.7, worry: 0.6}}],
      [0.35, {drop: 130, lean: -18, bodyPitch: -20, legL: {local: {r: -30, u: 40, f: 110}}, legR: {local: {r: 34, u: 46, f: 96}}, armL: {fk: {fwd: -30, out: 30, bend: 20}}, handL: 'brace', face: {mouth: 'pain', brows: 0.5}}],
      [0.55, {drop: 128, lean: -10, bodyPitch: -12, legL: {local: {r: -30, u: 40, f: 110}}, legR: {local: {r: 34, u: 46, f: 96}}, handL: 'brace', head: {pitch: -20}, face: {mouth: 'open', brows: 0.6, worry: 0.7}}],
      [0.8, layer(KNEEL('L'), {drop: 76, lean: 20, face: {mouth: 'grit', brows: -0.4}})],
      [1, layer(BRACED({wide: 0.7}), {drop: 26, lean: 14, face: {mouth: 'grit'}})],
    ], u);
  }
  const lt: V3 = aimW > 0.5 || (haul > 0.5 && T < 126) ? target : T < 120.2 ? H1_EYE(T) : T < EV3.wrap ? ANCHOR : T < 126 ? clampTarget(T) : T < 137.6 ? WRECK_C
    : T < EV3.cut ? at3(51, -8.3, 2.0) : T < EV3.tRun ? at3(48.5, -9, 1.0) : T < 141.9 ? at3(44.5, -4.5, 1.2) : H2_EYE(Math.min(T, 145.4));
  if (!down) pose = look(pose, b, lt, 0.9);
  const runArms: Pose = {armR: {local: {r: 26, u: 236, f: 64}}, armL: b.gait?.armL};
  const final = down ? pose : withRun(b, pose, runArms);
  const fired = T > EV3.tFire;
  const spool = !fired ? 1 : T < EV3.cut ? 0.35 : 0;
  const spec = base('tether', 'd3tth', 3, b, T, {...final, handR: 'grip', handL: final.handL ?? 'open', holdR: tetherLauncher({loaded: !fired, recoil}), extra: hipReel(spool)},
    handR && wrapW > 0 ? {handR: lerp3v(fromLoc(b, {r: 30, u: 240, f: 90}), handR, wrapW)} : {}, !down || T > EV3.tUp + 0.3);
  return {spec, body: b, pts: {muzzle}};
};

// ================================================================== THE DRONE PILOT (checker)
const P0 = {x: 46.0, z: -5.0};
const PIL_RUN: XZ[] = [{x: P0.x - 0.05, z: P0.z + 0.05}, {x: 45.3, z: -3.6}, {x: GRP.drone.x, z: GRP.drone.z}];
const PIL_BACK2: XZ[] = [{x: 40.6, z: 0.75}, {x: 38.4, z: 0.6}, {x: D4S('drone').pos.x, z: D4S('drone').pos.z}];
const PIL_SEGS: Seg[] = smoothSegs([
  {kind: 'stand', stag: 0.08, root: [[M.P3, P0.x, P0.z, 100], [127.6, P0.x, P0.z, 100], [127.75, P0.x - 0.05, P0.z + 0.05, headingTo(PIL_RUN[0], PIL_RUN[1])]]},
  {kind: 'run', path: PIL_RUN, T0: 127.8, T1: 129.6, gait: GAITS.walk, A: 0.4, D: 0.5},
  {kind: 'stand', stag: 0.08, root: [[129.6, GRP.drone.x, GRP.drone.z, runEnd(PIL_RUN).h], [130.1, GRP.drone.x, GRP.drone.z, GRP.drone.h], [140.5, GRP.drone.x, GRP.drone.z, GRP.drone.h],
    [141.0, GRP.drone.x - 0.2, GRP.drone.z + 0.2, 180], [141.7, GRP.drone.x - 0.35, GRP.drone.z + 0.5, 205], [EV3.fallBack + 0.02, GRP.drone.x - 0.35, GRP.drone.z + 0.5, 140], [EV3.fallBack + 0.15, GRP.drone.x - 0.35, GRP.drone.z + 0.5, headingTo({x: GRP.drone.x - 0.35, z: GRP.drone.z + 0.5}, BACK.drone[1])]]},
  {kind: 'run', path: [{x: GRP.drone.x - 0.35, z: GRP.drone.z + 0.5}, ...BACK.drone.slice(1)], T0: EV3.fallBack + 0.18, T1: 145.75, gait: GAITS.run, A: 0.35, D: 0.35},
  {kind: 'stand', stag: 0.08, root: [[145.75, BACK.drone[2].x, BACK.drone[2].z, runEnd(BACK.drone).h], [146.65, BACK.drone[2].x, BACK.drone[2].z, runEnd(BACK.drone).h - 10], [146.8, BACK.drone[2].x, BACK.drone[2].z, headingTo(BACK.drone[2], PIL_BACK2[1])]]},
  {kind: 'run', path: [{x: BACK.drone[2].x, z: BACK.drone[2].z}, ...PIL_BACK2.slice(1)], T0: 146.85, T1: 149.2, gait: GAITS.run, A: 0.4, D: 0.6},
  {kind: 'stand', stag: 0.08, root: [[149.2, D4S('drone').pos.x, D4S('drone').pos.z, runEnd(PIL_BACK2).h], [149.75, D4S('drone').pos.x, D4S('drone').pos.z, D4S('drone').heading]]},
]);
export const pilotAt = (T: number): CrewOut => {
  const b = bodyAt(PIL_SEGS, T);
  const lost = toolsR2('drone', T).drone === 'lost';
  // flying: the controller up, thumbs working; tense on the dart and the hunt
  const tense = Math.max(win(T, 117.6, 119.9, 0.25, 0.5), win(T, 140.4, 141.5, 0.15, 0.3));
  let pose: Pose = layer(BRACED({fists: false}), {
    drop: 12 + 16 * tense, lean: 8 + 12 * tense,
    armL: {local: {r: -22, u: 245 + 20 * tense, f: 92 + 30 * tense}}, armR: {local: {r: 22, u: 245 + 20 * tense, f: 92 + 30 * tense}},
    face: {mouth: tense > 0.4 ? 'grit' : 'flat', brows: -0.4 - 0.4 * tense, squint: 0.3},
  });
  pose = layer(pose, flinch(T, EV3.land, 0.5, 0.8));
  if (T > 126.8 && T < 128.2) pose = face(pose, {mouth: 'smile', brows: 0.3});
  // the drone struck: her face; she stares down at the dead screen
  const shock = win(T, EV3.kill, 143.6, 0.08, 0.6);
  if (shock > 0) pose = face(pose, {mouth: T < 141.9 ? 'o' : 'sad', open: 0.4, brows: 0.8, worry: 0.9});
  const stare = win(T, 142.0, 143.4, 0.3, 0.4);
  // the blast: down onto her knees, the controller held in to her chest
  const kd = win(T, 145.5, 146.65, 0.15, 0.25);
  if (kd > 0) pose = blendPose(pose, layer(KNEEL('L'), {drop: 88, lean: 30, armL: {local: {r: -14, u: 250, f: 50}}, armR: {local: {r: 14, u: 250, f: 50}}, head: {pitch: 26}, face: {mouth: 'pain', brows: 0.4, squint: 0.8}}), kd);
  kneelFeet(b, 'L', kd);
  const lt: V3 | null = stare > 0.5 ? null : lost && T < 143.6 ? at3(42.3, 2.4, 0.2) : T < 141.4 ? allyAt(T) : T < EV3.fallBack ? H2_EYE(T) : null;
  pose = look(pose, b, lt, 1, 85);
  if (stare > 0) { const h = pose.head ?? {}; pose = {...pose, head: {yaw: lerp(h.yaw ?? 0, -4, stare), pitch: lerp(h.pitch ?? 0, 34, stare), roll: h.roll}, face: {...pose.face, lookY: 0.8 * stare}}; }
  const runArms: Pose = {armL: {local: {r: -20, u: 236, f: 84}}, armR: {local: {r: 20, u: 236, f: 84}}};
  const final = withRun(b, pose, runArms);
  const spec = base('drone', 'd3pil', 5, b, T, {...final, handL: 'grip', handR: 'grip', twoHanded: true, extra: controller({lit: lost ? 0 : 1})});
  return {spec, body: b};
};

// ================================================================== THE FLARE CARRIER (host)
const F0 = {x: 47.9, z: -3.1};
const FLR_RUN: XZ[] = [{x: F0.x - 0.05, z: F0.z + 0.05}, {x: 46.6, z: -1.0}, {x: 45.0, z: 2.0}, {x: GRP.flares.x, z: GRP.flares.z}];
const FLR_THROWN = {from: {x: 41.9, z: 5.8}, to: {x: 41.15, z: 6.35}};
const FLR_BACK2: XZ[] = [{x: FLR_THROWN.to.x, z: FLR_THROWN.to.z}, {x: 38.6, z: 7.0}, {x: 36.2, z: 7.9}, {x: D4S('flares').pos.x, z: D4S('flares').pos.z}];
const FLR_UP = 146.95;
const FLR_SEGS: Seg[] = smoothSegs([
  {kind: 'stand', stag: 0.12, root: [[M.P3, F0.x, F0.z, 95], [117.5, F0.x, F0.z, 95], [117.8, F0.x, F0.z, 82], [127.7, F0.x, F0.z, 82], [127.85, F0.x - 0.05, F0.z + 0.05, headingTo(FLR_RUN[0], FLR_RUN[1])]]},
  {kind: 'run', path: FLR_RUN, T0: 127.9, T1: 130.6, gait: GAITS.jog, A: 0.4, D: 0.6},
  {kind: 'stand', stag: 0.12, root: [[130.6, GRP.flares.x, GRP.flares.z, runEnd(FLR_RUN).h], [131.1, GRP.flares.x, GRP.flares.z, GRP.flares.h], [EV3.fallBack + 0.05, GRP.flares.x, GRP.flares.z, GRP.flares.h], [EV3.fallBack + 0.2, GRP.flares.x, GRP.flares.z, headingTo(BACK.flares[0], BACK.flares[1])]]},
  {kind: 'run', path: BACK.flares.slice(0, 2), T0: EV3.fallBack + 0.22, T1: THROW_T, gait: GAITS.run, A: 0.35, D: 0},
  {kind: 'fn', T0: THROW_T, at: (T) => flaresThrownBody(T)},
  {kind: 'stand', stag: 0.12, root: [[FLR_UP + 0.55, FLR_THROWN.to.x, FLR_THROWN.to.z, 250], [FLR_UP + 0.65, FLR_THROWN.to.x, FLR_THROWN.to.z, headingTo(FLR_BACK2[0], FLR_BACK2[1])]]},
  {kind: 'run', path: FLR_BACK2, T0: FLR_UP + 0.7, T1: 149.35, gait: GAITS.run, A: 0.35, D: 0.6},
  {kind: 'stand', stag: 0.12, root: [[149.35, D4S('flares').pos.x, D4S('flares').pos.z, runEnd(FLR_BACK2).h], [149.8, D4S('flares').pos.x, D4S('flares').pos.z, D4S('flares').heading]]},
]);
const flaresThrownBody = (T: number) => {
  const u = clamp((T - THROW_T) / 0.5), e = 1 - (1 - u) * (1 - u);
  const x = lerp(FLR_THROWN.from.x, FLR_THROWN.to.x, e), z = lerp(FLR_THROWN.from.z, FLR_THROWN.to.z, e);
  const h = 250;
  const f = fwdOf(h), r = rightOf(h);
  const foot = (sd: number): V3 => ON({x: x - f.x * 0.25 + r.x * sd * 0.17, z: z - f.z * 0.25 + r.z * sd * 0.17});
  return {pos: ON({x, z}), heading: h, footL: foot(-1), footR: foot(1)};
};
/** the flare's flight: from his hand at the release into heavy 1's eye (where it will be at the hit) */
export const FLARE_TO = (): V3 => H1_EYE(EV3.flash);
const throwK = (T: number, rel: number) => {
  const K: [number, number][] = [[rel - 0.45, 0], [rel - 0.15, 0.4], [rel, 0.62], [rel + 0.14, 0.8], [rel + 0.45, 1]];
  if (T <= K[0][0]) return 0;
  for (let i = 1; i < K.length; i++) if (T <= K[i][0]) return lerp(K[i - 1][1], K[i][1], (T - K[i - 1][0]) / (K[i][0] - K[i - 1][0]));
  return 1;
};
export const flaresAt = (T: number): CrewOut => {
  const b = bodyAt(FLR_SEGS, T);
  let pose: Pose = layer(BRACED({wide: 0.75, fists: false}), {face: {mouth: 'flat', brows: -0.5}});
  // the draw from the bag at his left hip (cross draw), the strike (both hands at the cap), the throw
  const draw = win(T, EV3.flareDraw - 0.05, EV3.flareDraw + 0.35, 0.08, 0.15);
  if (draw > 0) pose = blendPose(pose, layer(pose, {armR: {local: {r: -18, u: 150, f: 34}}, head: {pitch: 16}}), draw);
  const strike = win(T, 117.9, EV3.flareStrike + 0.2, 0.15, 0.12);
  if (strike > 0) pose = blendPose(pose, layer(pose, {armR: {local: {r: 20, u: 250, f: 110}}, armL: {local: {r: 0, u: 262 + 18 * win(T, 118.05, EV3.flareStrike + 0.02, 0.06, 0.02), f: 124}}, handL: 'fist', head: {pitch: 12}}), strike);
  const tw = win(T, EV3.flareRel - 0.45, EV3.flareRel + 0.5, 0.08, 0.2);
  if (tw > 0) pose = blendPose(pose, THROW(throwK(T, EV3.flareRel)), tw);
  pose = layer(pose, flinch(T, EV3.land, 0.5, 0.8));
  if (T > 126.8 && T < 128.2) pose = face(pose, {mouth: 'grin', brows: 0.2});
  // the blast: a chunk catches his brow: he goes down onto his hands and knees, a hand to the cut, up again
  let down = false;
  if (T >= THROW_T && T < FLR_UP + 0.55) {
    down = true;
    const u = (T - THROW_T) / (FLR_UP + 0.55 - THROW_T);
    pose = keyPose([
      [0, layer(STAND, {drop: 22, lean: 14})],
      [0.12, {drop: 30, lean: -18, twist: 20, head: {pitch: -26, yaw: 20}, armL: {fk: {fwd: 60, out: 40, bend: 30}}, armR: {fk: {fwd: 80, out: 30, bend: 70}}, handR: 'open', face: {mouth: 'pain', brows: 0.6, squint: 1}}],
      [0.3, {drop: 110, lean: 50, bodyPitch: 30, legL: {fk: {fwd: 70, knee: 100}}, legR: {fk: {fwd: 60, knee: 100}}, armL: {fk: {fwd: 70, out: 20, bend: 10}}, armR: {fk: {fwd: 70, out: 20, bend: 10}}, handL: 'brace', handR: 'brace', head: {pitch: 20}, face: {mouth: 'pain', brows: 0.6, squint: 0.9}}],
      [0.7, {drop: 108, lean: 46, bodyPitch: 26, legL: {fk: {fwd: 70, knee: 100}}, legR: {fk: {fwd: 60, knee: 100}}, armL: {fk: {fwd: 70, out: 20, bend: 10}}, armR: {fk: {fwd: 120, out: 20, bend: 120}}, handL: 'brace', handR: 'open', head: {pitch: -14, yaw: 6}, face: {mouth: 'grit', brows: 0.3, squint: 0.7}}],
      [0.86, layer(KNEEL('L'), {drop: 74, lean: 20, face: {mouth: 'grit', brows: -0.4}})],
      [1, layer(BRACED({wide: 0.7, fists: false}), {drop: 24, lean: 12, face: {mouth: 'grit'}})],
    ], u);
  }
  const lt: V3 | null = T < EV3.flareDraw ? at3(50.25, -7.7, 1.6) : T < 118.3 ? null : T < 119.9 ? H1_EYE(T) : T < 125 ? heavyAttach(heavy1D3(T)).hull : T < 127.9 ? WRECK_C
    : T < 130.6 ? null : T < 136.4 ? at3(55.5, -0.5, 2.0) : T < EV3.fallBack ? H2_EYE(T) : null;
  if (!down) pose = look(pose, b, lt, 0.9);
  const runArms: Pose = {armL: b.gait?.armL, armR: b.gait?.armR};
  const final = down ? pose : withRun(b, pose, runArms);
  const holding = T > EV3.flareDraw + 0.15 && T < EV3.flareRel;
  const lit = T > EV3.flareStrike ? 1 : 0;
  const spec = base('flares', 'd3flr', 9, b, T, {...final, handR: holding ? 'grip' : final.handR ?? 'open', holdR: holding ? flareHold({lit, t: T}) : undefined}, {}, !down);
  return {spec, body: b, pts: {hand: fromLoc(b, {r: 14, u: 330, f: 150})}};
};
/** the flare leaves his hand here (the THROW release) */
export const flareFrom = (): V3 => flaresAt(EV3.flareRel).pts!.hand;

// ================================================================== THE DECOY MAKER (clerkB)
const B0 = {x: 46.9, z: -3.8};
const DEC_RUN: XZ[] = [{x: B0.x - 0.05, z: B0.z + 0.05}, {x: 45.8, z: -2.2}, {x: DEC_SPOT.x, z: DEC_SPOT.z}];
const DEC_THROWN = {from: {x: 42.6, z: 1.55}, to: {x: 41.5, z: 1.8}};
const DEC_BACK2: XZ[] = [{x: DEC_THROWN.to.x, z: DEC_THROWN.to.z}, {x: 38.8, z: 1.9}, {x: 35.0, z: 2.0}, {x: D4S('decoy').pos.x, z: D4S('decoy').pos.z}];
const DEC_UP = 146.25;
const DEC_SEGS: Seg[] = smoothSegs([
  {kind: 'stand', stag: 0.06, root: [[M.P3, B0.x, B0.z, 80], [127.4, B0.x, B0.z, 80], [127.55, B0.x - 0.05, B0.z + 0.05, headingTo(DEC_RUN[0], DEC_RUN[1])]]},
  {kind: 'run', path: DEC_RUN, T0: 127.6, T1: 129.5, gait: GAITS.walk, A: 0.4, D: 0.5},
  {kind: 'stand', stag: 0.06, root: [[129.5, DEC_SPOT.x, DEC_SPOT.z, runEnd(DEC_RUN).h], [130.0, DEC_SPOT.x, DEC_SPOT.z, DEC_SPOT.h], [EV3.smash, DEC_SPOT.x, DEC_SPOT.z, DEC_SPOT.h],
    // the smash: she reels back from it
    [EV3.smash + 0.35, DEC_SPOT.x - 0.45, DEC_SPOT.z - 0.1, DEC_SPOT.h + 20], [137.2, DEC_SPOT.x - 0.5, DEC_SPOT.z - 0.1, DEC_SPOT.h + 15], [EV3.fallBack, DEC_SPOT.x - 0.5, DEC_SPOT.z - 0.1, DEC_SPOT.h + 5], [EV3.fallBack + 0.15, DEC_SPOT.x - 0.5, DEC_SPOT.z - 0.1, headingTo({x: DEC_SPOT.x - 0.5, z: DEC_SPOT.z - 0.1}, BACK.decoy[1])]]},
  {kind: 'run', path: [{x: DEC_SPOT.x - 0.5, z: DEC_SPOT.z - 0.1}, BACK.decoy[1], BACK.decoy[2]], T0: EV3.fallBack + 0.2, T1: THROW_T, gait: GAITS.run, A: 0.35, D: 0},
  {kind: 'fn', T0: THROW_T, at: (T) => decoyThrownBody(T)},
  {kind: 'stand', stag: 0.06, root: [[DEC_UP + 0.8, DEC_THROWN.to.x + 0.3, DEC_THROWN.to.z, 268], [DEC_UP + 0.88, DEC_THROWN.to.x + 0.3, DEC_THROWN.to.z, headingTo(DEC_BACK2[0], DEC_BACK2[1])]]},
  {kind: 'run', path: [{x: DEC_THROWN.to.x + 0.3, z: DEC_THROWN.to.z}, ...DEC_BACK2.slice(1)], T0: DEC_UP + 0.9, T1: 149.3, gait: GAITS.run, A: 0.35, D: 0.6},
  {kind: 'stand', stag: 0.06, root: [[149.3, D4S('decoy').pos.x, D4S('decoy').pos.z, runEnd(DEC_BACK2).h], [149.75, D4S('decoy').pos.x, D4S('decoy').pos.z, D4S('decoy').heading]]},
]);
/** she is thrown forward: onto her front, then up (the rise from the rubble, quick) */
const decoyThrownBody = (T: number) => {
  const u = clamp((T - THROW_T) / 0.5), e = 1 - (1 - u) * (1 - u);
  const up = T > DEC_UP ? smooth((T - DEC_UP) / 0.8) : 0;
  const x = lerp(DEC_THROWN.from.x, DEC_THROWN.to.x, e) + 0.3 * up, z = lerp(DEC_THROWN.from.z, DEC_THROWN.to.z, e);
  const h = 268;
  const f = fwdOf(h), r = rightOf(h);
  const foot = (sd: number): V3 => ON({x: x - f.x * 0.2 + r.x * sd * 0.17, z: z - f.z * 0.2 + r.z * sd * 0.17});
  return {pos: ON({x, z}), heading: h, footL: foot(-1), footR: foot(1)};
};
export const decoyAt = (T: number): CrewOut => {
  const b = bodyAt(DEC_SEGS, T);
  const smashed = toolsR2('decoy', T).tablet === 'smashed';
  let pose: Pose = layer(BRACED({wide: 0.6, fists: false}), {drop: 10, lean: 6, armL: {local: {r: -28, u: 215, f: 92}, pole: {r: -1, u: -0.7, f: 0}, palm: {r: 0.4, u: 0.3, f: -1}}, handR: 'open', face: {mouth: 'flat', brows: -0.3, worry: 0.4}});
  pose = layer(pose, flinch(T, EV3.land, 0.5, 0.8));
  if (T > 126.8 && T < 128.0) pose = face(pose, {mouth: 'smile', brows: 0.3, worry: 0});
  // working the tablet (ADAPT sees it glow): head down, the right finger on the glass; the sketch, the tap
  const work = win(T, 129.6, EV3.projOn + 0.3, 0.3, 0.25);
  let world: FigSpec['world'] = {};
  if (work > 0) pose = blendPose(pose, layer(pose, {drop: 14, lean: 10, armL: {local: {r: -30, u: 228, f: 100}, pole: {r: -1, u: -0.7, f: 0}, palm: {r: 0.4, u: 0.3, f: -1}}, armR: {local: {r: 2 + 8 * Math.sin(T * 6), u: 236 + 6 * Math.sin(T * 8.3), f: 112}, palm: {r: -0.3, u: -0.4, f: -1}}, handR: 'point', head: {pitch: 28, yaw: -4}, face: {mouth: 'flat', brows: -0.5, lookY: 0.8}}), work);
  // then the tablet raised toward the dust (the projector's beam), watching the light; the diver comes
  const raise = win(T, EV3.projOn - 0.05, EV3.smash + 0.02, 0.25, 0.02);
  if (raise > 0) {
    const hold = {x: SMASH_AT.x - 0.06, y: SMASH_AT.y - 0.06, z: SMASH_AT.z - 0.02};
    world = {handL: lerp3v(fromLoc(b, {r: -28, u: 215, f: 92}), hold, raise)};
    pose = blendPose(pose, layer(pose, {drop: 8, lean: 4, armR: {local: {r: 30, u: 220, f: 60}}, handR: 'open', face: {mouth: 'flat', brows: -0.5}}), raise);
  }
  const see = win(T, 135.95, EV3.smash + 0.1, 0.12, 0.05);
  if (see > 0) pose = face(pose, {mouth: 'o', open: 0.5, brows: 0.8, worry: 0.6});
  // the smash: thrown back from it; the cut right hand clutched to her chest; the dead tablet still in her left
  const reel = win(T, EV3.smash, 137.6, 0.04, 0.5);
  if (reel > 0) pose = blendPose(pose, layer(pose, {drop: 30, lean: -16, twist: 18, armR: {local: {r: -6, u: 300, f: 46}}, armL: {local: {r: -40, u: 190, f: 60}}, handR: 'fist', head: {pitch: 20, yaw: 10}, face: {mouth: 'pain', brows: 0.6, squint: 0.9}}), reel);
  const hurt = win(T, 137.4, EV3.fallBack, 0.5, 0.2);
  if (hurt > 0) pose = blendPose(pose, layer(pose, {armR: {local: {r: -10, u: 260, f: 40}}, handR: 'fist', armL: {local: {r: -36, u: 205, f: 70}}, face: {mouth: 'sad', brows: 0.5, worry: 0.8}}), hurt);
  // the blast: forward onto her front; up (the rise, quick)
  let down = false;
  if (T >= THROW_T && T < DEC_UP + 0.8) {
    down = true;
    const u = clamp((T - THROW_T) / 0.45);
    const fallP: Pose = keyPose([[0, layer(STAND, {drop: 20, lean: 18})], [0.4, {drop: 60, lean: 50, bodyPitch: 30, armL: {fk: {fwd: 90, out: 20, bend: 20}}, armR: {fk: {fwd: 90, out: 20, bend: 20}}, handL: 'open', handR: 'open', face: {mouth: 'pain', squint: 1}}], [1, RISE_KEYS[0][1]]], u);
    pose = T < DEC_UP ? (u < 1 ? fallP : layer(RISE_KEYS[0][1], {head: {pitch: -30}, face: {mouth: 'pant', brows: 0.4, worry: 0.6}})) : keyPose(RISE_KEYS, ((T - DEC_UP) / 0.8) * 7.2);
  }
  const lt: V3 | null = T < 127.4 ? (T < 119.9 ? H1_EYE(T) : heavyAttach(heavy1D3(Math.min(T, 126.4))).hull) : work > 0.5 ? null : T < 135.95 ? at3(56.5, -0.5, 3.2) : T < EV3.smash ? at3(47.6, 3.2, 1.0) : T < EV3.fallBack ? null : null;
  if (!down && lt) pose = look(pose, b, lt, 0.9);
  const runArms: Pose = {armL: {local: {r: -26, u: 232, f: 70}}, armR: b.gait?.armR};
  const final = down ? pose : withRun(b, pose, runArms);
  const sketch = clamp((T - EV3.sketch) / (EV3.tap - EV3.sketch));
  const glow = T > 129.6 && T < EV3.smash ? 0.35 + 0.4 * win(T, EV3.tap, EV3.tap + 0.4, 0.05, 0.3) : 0;
  const spec = base('decoy', 'd3dec', 6, b, T, {...final, handL: 'grip', holdL: tablet({screen: true, sketch: T < EV3.sketch ? 0 : T > EV3.tap ? 1 : sketch, figures: 4, glow, smashed})}, world, !down);
  return {spec, body: b};
};

// ================================================================== all of them, with the hand-overs
export const ROLES: Role2[] = ['director', 'breaker', 'tether', 'runner', 'drone', 'flares', 'decoy'];
const rawAt = (role: Role2, T: number): CrewOut => {
  switch (role) {
    case 'director': return directorAt(T);
    case 'breaker': return breakerAt(T);
    case 'tether': return tetherAt(T);
    case 'runner': return runnerAt(T);
    case 'drone': return pilotAt(T);
    case 'flares': return flaresAt(T);
    default: return decoyAt(T);
  }
};
/**
 * The Crew at T: D2's own spec blended out over the first 0.45 s (the cut from D2-7 is exact), D4's own spec blended in
 * over the last 0.55 s (the cut into D4-1a is exact).
 */
export const crewAt = (role: Role2, T: number): CrewOut => {
  const o = rawAt(role, T);
  if (T < M.P3 + 0.45) {
    const d2 = d2CrewAt(role as D2Role, T).spec;
    return {...o, spec: towardSpec(d2, o.spec, smooth((T - M.P3) / 0.45))};
  }
  if (T > M.P4 - 0.55) {
    const d4 = d4CrewAt(role, T).spec;
    return {...o, spec: towardSpec(o.spec, d4, smooth((T - (M.P4 - 0.55)) / 0.55))};
  }
  return o;
};

// ------------------------------------------------------------------ footfalls (dust and sound where running feet land)
const ALL_SEGS: Record<string, Seg[]> = {director: DIR_SEGS, breaker: BRK_SEGS, tether: TTH_SEGS, runner: RUN_SEGS, drone: PIL_SEGS, flares: FLR_SEGS, decoy: DEC_SEGS};
import {gaitW} from '../../rig/gait';
import {runDist, runSpeed, pathLen} from '../D4/motion';
export type Footfall = {t: number; pos: V3; key: string; speed: number};
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
      out.push({t: hi, pos: phi === 0 ? g.footR : g.footL, key: `${who}${si}_${k}_${phi}`, speed: runSpeed(hi, s.T0, s.T1, L, A, D)});
    }
  });
  return out;
};
void [BASH, BLOCK_HIGH, RAM2_AT, BLAST_AT, H1_EYE, after, mixFoot];
