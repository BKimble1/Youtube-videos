// Section D3: the Crew as functions of FILM time T (world metres). Every shot samples the same choreography. It starts
// exactly where D2 leaves them (each spec is blended in from D2's own over the first 0.45 s) and ends exactly in D4's
// start (start.ts: blended into D4's own specs over the last 0.55 s). Runs use gaitW on groundH (planted feet); between
// runs each person stands on a keyed root with planted steps. Contacts are world points on the machines (heavyAttach,
// unitAttach), on the shared marks (marks.ts) or on each other (handOn in battle.tsx). Exchange sheet: R3_EXCHANGES ## D3.
//
//   director  signals (117.15); runs down the south-west slope into U8's path (121.95); takes its hammer on the plate
//             (123.2: heels skid), is pressed back; when it turns for the crossing he drives two steps after it and the
//             plate into its back (124.3); backs off as the heavy goes over; the peak; back up to the rim; sees heavy 2's
//             launcher come round onto the decoy maker (143.85), runs to her, hauls her up and away (144.4 →): the blast
//             throws them forward (lip cut); he gets up turning toward the danger, looks back at the heavy, and goes
//             (148.25) to D4's start
//   breaker   up at 117.4; down the slope along the water main's south-west side, left into the crossing and under it
//             ducked (122.97–123.30) to the rear-left leg; the slow wind-up (123.95), the knee splits (124.75); R4's
//             hammer comes down on the beam (125.15): he pivots off the knee and dives back under it (125.3 →) and
//             sprints north-west along the main, clear as it falls
//   runner    up at 117.45; the bar into both hands; down the slope behind the breaker; rear guard at the crossing; dashes
//             in and hooks U8's ankle as it stumbles from the Director's plate (124.5); backpedals up the slope watching
//             the knee go and the heavy fall
//   tether    to post 3; aims at the front-left shin, fires (121.85), wraps the cable round the post, the reel locks
//             (122.9) — R3 hauls on the cable: she is dragged a step and digs in; holds it; drones cut it (138.95): she
//             falls back, gets up, runs to the group
//   flares    draws his flare (117.55), strikes it (118.15), throws it into heavy 1's eye (118.78 → 119.38)
//   drone     flies the allied drone throughout (its pose from machines.allyAt); it is struck down at 141.35
//   decoy     sketches again (133.95), taps (134.8): the figures appear; the diver smashes the tablet (136.35), her
//             right hand is cut; she sinks to her knees on the crest; the ground shakes: she looks up into heavy 2's
//             launcher; the Director hauls her up and away; thrown onto her hands and knees; up; runs
import {V3, add3, sub3, mul3, norm3, lerp, clamp, smooth, easeOut, easeIn} from '../../../kit/math';
import {makeView} from '../../engine';
import {
  FigSpec, Pose, keyPose, blendPose, layer, lookR2, dmgR2, toolsR2, figureRig, figProps, figFrame, BRACED, BASH, AIM, THROW, KNEEL, STAND, KNOCKED_BACK, LYING_BACK, RISE_KEYS,
  plateWear, tetherLauncher, hipReel, tablet, breaker as breakerTool, controller, halligan1, halligan2, flare as flareHold, GaitW, Role2, FACES, expr, exprMix,
} from '../../rig';
import type {FigProps, Face} from '../../rig';
import {heavyAttach, unitAttach, unitRoot} from '../../mech';
import {M} from '../../timing';
import {EV3} from './times';
import {Seg, Body, bodyAt, mixFoot, toLoc, fromLoc, lookYaw, lookPitch, lerp3v, XZ, G, onG, fwdOf, rightOf, headingTo, wrapD, win, runEnd, standAt, keyRoot, KR, pathLen, cruise} from '../D4/motion';
import {heavy1D3, h1ClampPt, BLAST_AT, SMASH_AT, allyAt, heavy2D3, KNEE_AT, BRK_STAND, escort} from './machines';
import {DIR_FIGHT, DIR_FACE_H, RUN_GUARD, RUN_HOOK, UNDER, DEC_SPOT, plateOf} from './marks';
import {pipeAt} from './geo';
import {ANCHOR} from '../D2/machines';
import {crewAt as d2CrewAt, Role as D2Role} from '../D2/battle';
import {crewAt as d4CrewAt} from '../D4/crew';
import {CREW_START} from '../D4/start';

/** the blast's knock-back: they are thrown on the first frame after the flash */
const THROW_T = EV3.blast + 0.01;
/** a polyline with each interior corner bevelled (≤0.6 m back along each side, the middle pulled toward the corner) */
function roundPath(pts: XZ[]): XZ[] {
  if (pts.length < 3) return pts;
  const out: XZ[] = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], v = pts[i], b = pts[i + 1];
    const la = Math.hypot(v.x - a.x, v.z - a.z), lb = Math.hypot(b.x - v.x, b.z - v.z);
    if (la < 1e-3 || lb < 1e-3) { out.push(v); continue; }
    const ca = Math.min(0.6, la * 0.3), cb = Math.min(0.6, lb * 0.3);
    const A = {x: v.x - ((v.x - a.x) / la) * ca, z: v.z - ((v.z - a.z) / la) * ca}, B = {x: v.x + ((b.x - v.x) / lb) * cb, z: v.z + ((b.z - v.z) / lb) * cb};
    out.push(A, {x: (A.x + B.x) * 0.25 + v.x * 0.5, z: (A.z + B.z) * 0.25 + v.z * 0.5}, B);
  }
  out.push(pts[pts.length - 1]);
  return out;
}
/**
 * Segment hand-overs without pops: a run never starts with an instant spin (the stand before it turns onto the run's
 * first heading, ≤ 300°/s); a scripted move ('fn': thrown, a fall) and a stand after one take the body's heading,
 * root and feet over from where the previous segment left them.
 */
function smoothSegs(segs: Seg[]): Seg[] {
  const out: Seg[] = segs.map((s) => (s.kind === 'stand' ? {...s, root: s.root.map((k) => [...k] as KR)} : {...s}));
  out.forEach((s) => {
    if (s.kind !== 'stand') return;
    for (let j = s.root.length - 1; j >= 1; j--) {
      const a = s.root[j - 1], b = s.root[j], dh = Math.abs(wrapD(b[3] - a[3]));
      const need = dh / 360;
      if (b[0] - a[0] >= need || j < 2) continue;
      const lo = s.root[j - 2][0] + 0.05;
      if (a[1] === s.root[j - 2][1] && a[2] === s.root[j - 2][2] && Math.abs(wrapD(a[3] - s.root[j - 2][3])) < 1) a[0] = Math.max(lo, b[0] - need);
    }
  });
  for (let k = 1; k < out.length; k++) {
    const s = out[k], p = out[k - 1];
    if (s.kind !== 'run' || p.kind !== 'stand') continue;
    const hR = headingTo(s.path[0], s.path[1]) + (s.back ? 180 : 0);
    const before = p.root.filter((q) => q[0] < s.T0 - 1e-6);
    if (!before.length) continue;
    const hs = keyRoot(before, s.T0).h, dh = wrapD(hR - hs);
    if (Math.abs(dh) < 8) continue;
    const turn = Math.max(0.25, Math.abs(dh) / 300);
    const after = s.T1 - (s.T0 + turn * 0.5) > pathLen(s.path) / 5 + 0.3 ? turn * 0.5 : 0;
    const t1 = s.T0 + after, t0 = Math.max(p.root[0][0] + 0.02, s.T0 - (turn - after));
    if (t1 - t0 < 0.12) continue;
    const keep = p.root.filter((q) => q[0] < t0 - 1e-3);
    const at0 = keyRoot(p.root.filter((q) => q[0] <= t0), t0);
    p.root = [...keep, [t0, at0.p.x, at0.p.z, at0.h], [t1, s.path[0].x, s.path[0].z, at0.h + wrapD(hR - at0.h)]];
    s.T0 = t1;
  }
  out.forEach((s) => {
    if (s.kind !== 'run') return;
    s.path = roundPath(s.path);
    const vc = cruise(s.T0, s.T1, pathLen(s.path), s.A ?? 1.0, s.D ?? 0.6);
    s.gait = {...s.gait, bob: s.gait.bob * clamp(4.2 / Math.max(0.1, vc), 0.45, 1)};
  });
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
  duck: {stride: 1.3, duty: 0.42, lift: 0.1, bob: 4, armAmp: 12, lean: 34},
  dash: {stride: 1.9, duty: 0.34, lift: 0.15, bob: 9, armAmp: 34, lean: 20},
  sprint: {stride: 2.15, duty: 0.32, lift: 0.19, bob: 12, armAmp: 50, lean: 20},
  jog: {stride: 1.6, duty: 0.42, lift: 0.12, bob: 8, armAmp: 26, lean: 10},
  heavy: {stride: 1.95, duty: 0.37, lift: 0.14, bob: 9, armAmp: 6, lean: 13},
  walk: {stride: 1.1, duty: 0.58, lift: 0.08, bob: 5, armAmp: 18, lean: 5},
};
const ON = (p: XZ, up = 0) => onG(p.x, p.z, up);
const at3 = (x: number, z: number, up: number): V3 => onG(x, z, up);
const ramp = (T: number, a: number, b: number) => smooth(clamp((T - a) / Math.max(1e-6, b - a)));
const base = (role: Role2, key: string, seed: number, b: {pos: V3; heading: number; footL?: V3; footR?: V3}, T: number, pose: Partial<FigProps>, world: FigSpec['world'] = {}, feet = true, gaze?: V3): FigSpec => ({
  key, look: lookR2(role), t: T, seed, pos: b.pos, heading: b.heading,
  pose: {...pose, dmg: dmgR2(role, T)},
  world: {...(feet && b.footL ? {footL: b.footL, footR: b.footR} : {}), ...world},
  ...(gaze ? {gaze} : {}),
});
const withRun = (b: Body, stance: Pose, runArms: Pose): Pose => {
  if (!b.gait || b.runK <= 0.001) return stance;
  return blendPose(stance, layer(b.gait, runArms, {face: stance.face ?? {mouth: 'grit', brows: -0.6}}), b.runK);
};
const look = (pose: Pose, b: {pos: V3; heading: number}, at: V3 | null, w = 1, lim = 75): Pose => {
  if (!at || w <= 0) return pose;
  const h = pose.head ?? {};
  return {...pose, head: {yaw: lerp(h.yaw ?? 0, lookYaw(b, at, lim), w), pitch: lerp(h.pitch ?? 0, lookPitch(b, at), w), roll: h.roll}};
};
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
    gaze: w < 0.5 ? a.gaze : b.gaze,
  };
};
const H1_EYE = (T: number) => heavyAttach(heavy1D3(T)).eye;
const H2_EYE = (T: number) => heavyAttach(heavy2D3(T)).eye;
const H2_POD = (T: number) => heavyAttach(heavy2D3(T)).muzzle;
/** the wreck's middle (for the looks after the crash) */
const WRECK_C: V3 = {x: 62.7, y: -1.2, z: -5.0};
/** the flinch at a big impact (head ducks, shoulders up), k by distance: added onto the pose it is given */
const flinch = (T: number, t0: number, k = 1, d = 0.7) => (pose: Pose): Pose => {
  const w = win(T, t0, t0 + d, 0.1, 0.45) * k;
  if (w <= 0) return pose;
  const h = pose.head ?? {};
  return {...pose, drop: (pose.drop ?? 0) + 10 * w, head: {...h, pitch: (h.pitch ?? 0) + 14 * w}, face: blendPose({face: pose.face ?? {}}, {face: {...FACES.shock, squint: 0.85}}, w).face};
};
/** a look list: from each key's time the head turns to its target (a point, a moving point, or null = the pose's own
 *  head) — blended from the previous key's target over `bl` s, so a change of target is a head turn, not a pop */
type LK = [number, V3 | ((T: number) => V3) | null];
const tgtAt = (k: LK[1], T: number): V3 | null => (k === null ? null : typeof k === 'function' ? k(T) : k);
const lookList = (keys: LK[], T: number, bl = 0.28): {cur: V3 | null; prev: V3 | null; w: number} => {
  let i = -1;
  for (let j = 0; j < keys.length; j++) if (T >= keys[j][0]) i = j;
  if (i < 0) return {cur: tgtAt(keys[0][1], T), prev: null, w: 1};
  const w = i === 0 ? 1 : smooth(clamp((T - keys[i][0]) / bl));
  return {cur: tgtAt(keys[i][1], T), prev: i > 0 && w < 1 ? tgtAt(keys[i - 1][1], T) : null, w};
};
/** the head turned by a look list (k scales the whole look); returns the pose and the eyes' target */
const lookBy = (pose: Pose, b: {pos: V3; heading: number}, keys: LK[], T: number, k = 1, lim = 75): {pose: Pose; gaze?: V3} => {
  const L = lookList(keys, T);
  const h = pose.head ?? {};
  // a target behind the body fades to the pose's own head (no flip of the head across the back)
  const ang = (p: V3 | null) => {
    if (!p) return {yaw: h.yaw ?? 0, pitch: h.pitch ?? 0};
    const raw = Math.abs(wrapD(headingTo(b.pos, p) - b.heading)), fd = 1 - smooth(clamp((raw - 105) / 55));
    return {yaw: lerp(h.yaw ?? 0, lookYaw(b, p, lim), fd), pitch: lerp(h.pitch ?? 0, lookPitch(b, p), fd)};
  };
  const a = ang(L.cur), p0 = L.w < 1 ? ang(L.prev) : a;
  const yaw = lerp(p0.yaw, a.yaw, L.w), pitch = lerp(p0.pitch, a.pitch, L.w);
  const out = k <= 0 ? pose : {...pose, head: {yaw: lerp(h.yaw ?? 0, yaw, k), pitch: lerp(h.pitch ?? 0, pitch, k), roll: h.roll}};
  return {pose: out, gaze: L.cur ?? undefined};
};
/** the body, with run → stand hand-overs keeping the run's stride phase (the arm swing eases out, no snap) */
const bodyAt3 = (segs: Seg[], T: number): Body => {
  const b = bodyAt(segs, T);
  const s = segs[b.seg];
  if (s && s.kind === 'stand' && b.runK > 0 && b.phase === undefined) b.phase = bodyAt(segs, s.root[0][0] - 1e-4).phase;
  return b;
};
/** world hand targets faded in / out over the rig's own hands (w 0 = the pose's hands, no world targets) */
const fadeHands = (spec: FigSpec, H: {handL?: V3; handR?: V3}, w: number): FigSpec => {
  if (w <= 0.001) return spec;
  if (w >= 0.999) return {...spec, world: {...spec.world, ...H}};
  const R = figureRig(SOLVE_VIEW, spec);
  const o: {handL?: V3; handR?: V3} = {};
  if (H.handL) o.handL = lerp3v(R.handL, H.handL, w);
  if (H.handR) o.handR = lerp3v(R.handR, H.handR, w);
  return {...spec, world: {...spec.world, ...o}};
};
/** the throw with its release carried through (the kit's keys, the follow-through starting at the release's speed) */
const THROW_K: [number, Pose, ((x: number) => number)?][] = [[0, THROW(0)], [0.4, THROW(0.4)], [0.62, THROW(0.62), easeIn], [0.8, layer(THROW(0.8), {drop: 36, lean: 40, twist: -40}), easeOut], [1, THROW(1)]];
const throwPose = (k: number): Pose => keyPose(THROW_K, k);
/** the rise off the ground (RISE_KEYS, t 0 → 7.2): from the knee under the hips (t ≥ 2.6) the legs stand on world
 *  feet (kneeling, then the stance) instead of the keys' straight fk legs */
const RISE_FEET_T = 2.6;
const risePose = (t: number): Pose => { const p = keyPose(RISE_KEYS, t); return t >= RISE_FEET_T ? {...p, legL: undefined, legR: undefined} : p; };
/** the feet through the rise (t ≥ 2.6): the left foot forward, the right knee down behind; into the stance by 6.2 */
const riseFeet = (b: {pos: V3; heading: number}, t: number): {footL: V3; footR: V3} => {
  const s = smooth(clamp((t - 3.8) / 2.4));
  const f = fwdOf(b.heading), r = rightOf(b.heading);
  const p = (fw: number, side: number, up: number): V3 => { const x = b.pos.x + f.x * fw + r.x * side, z = b.pos.z + f.z * fw + r.z * side; return {x, y: G(x, z) + up, z}; };
  return {footL: p(lerp(0.32, 0.03, s), -0.17, 0.02), footR: p(lerp(-0.34, -0.03, s), 0.17, lerp(0.12, 0.02, s))};
};
const D4S = (r: Role2) => CREW_START[r];
/** a quick jolt: rises in 0.05 s at t0, decays (block impulses) */
const jolt = (T: number, t0: number, decay = 6) => (T < t0 ? 0 : T < t0 + 0.05 ? (T - t0) / 0.05 : Math.exp(-(T - t0 - 0.05) * decay));

// ------------------------------------------------------------------ faces (RIG's named expressions, rig/faces.ts)
const E: Record<string, Face> = {
  focus: FACES.concentration, effort: FACES.effort, anger: FACES.anger, fear: FACES.fear, alert: FACES.alert, resolve: FACES.resolve,
  pain: expr('pain', 1, {squint: 0.85}), shock: FACES.shock, relief: FACES.relief, pant: FACES.exhaustion, recog: FACES.recognition,
  real: FACES.realization, grief: FACES.grief, strain: expr('effort', 1, {worry: 0.3, lid: 0.3}), dazed: exprMix('pain', 'exhaustion', 0.5),
  worried: expr('fear', 0.55), fierce: {...FACES.anger, mouth: 'open', open: 0.45}, grin: {...FACES.relief, mouth: 'grin', brows: 0.1, worry: 0.1}, shout: {...FACES.anger, mouth: 'open', open: 0.7},
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
/** ducking under the water main: how deep, by the root's distance to the beam's axis (≤ 1.25 m: under its span) */
const duckAt = (p: XZ): number => { const q = pipeAt(p); return q.u > 0 && q.u < 1 ? smooth(clamp((1.25 - q.d) / 0.7)) : 0; };
const DUCK: Pose = {drop: 62, lean: 38, head: {pitch: -18}};

// ------------------------------------------------------------------ the regroup on the rim (after the crash) and the throws
/** where they stand on the rim from ~131 until the fall back (north of the cover slab, the crater before them) */
export const GRP: Record<Role2, {x: number; z: number; h: number}> = {
  director: {x: 45.9, z: -3.2, h: 92}, decoy: DEC_SPOT, drone: {x: 44.0, z: -2.1, h: 88}, flares: {x: 43.1, z: 4.5, h: 80},
  breaker: {x: 44.3, z: -4.5, h: 95}, runner: {x: 45.3, z: -5.6, h: 98}, tether: {x: 42.9, z: -3.4, h: 90},
};
/** the fall back (the Director's shout as he goes for her): each runs from the rim on these lines; the blast catches them
 *  (D1's wrecks leave a corridor between U1/U2 (z ≤ −1.6) and U4 (z ≥ 3.3) at x 39–42) */
const BACK: Record<'drone' | 'flares' | 'breaker' | 'runner' | 'tether', XZ[]> = {
  drone: [{x: 43.65, z: -1.6}, {x: 42.6, z: 0.3}, {x: 40.6, z: 0.75}],
  flares: [{x: 43.1, z: 4.5}, {x: 41.9, z: 5.8}, {x: 39.0, z: 6.5}],
  breaker: [{x: 44.3, z: -4.5}, {x: 43.4, z: -2.0}, {x: 42.0, z: -0.3}],
  runner: [{x: 45.3, z: -5.6}, {x: 43.9, z: -5.95}, {x: 42.3, z: -6.25}],
  tether: [{x: 42.9, z: -3.4}, {x: 42.2, z: -5.2}, {x: 39.6, z: -5.5}, {x: 37.2, z: -3.4}, {x: CREW_START.tether.pos.x, z: CREW_START.tether.pos.z}],
};

// ================================================================== THE DIRECTOR (clerkC, plate on the left forearm)
const D0 = {x: 50.25, z: -7.7};
const DF0 = {x: DIR_FIGHT[0][1], z: DIR_FIGHT[0][2]};
const DIR_RUN1: XZ[] = [D0, {x: 51.3, z: -6.35}, {x: 53.25, z: -4.15}, DF0];
/** U8 as it turns away toward the crossing: where he drives his plate into its back */
const U8_BASH = (() => {
  const r = unitRoot(escort('U8', EV3.bash - 0.02));
  const f = fwdOf(r.heading), rt = rightOf(r.heading);
  const p = {x: r.pos.x - f.x * 0.82 - rt.x * 0.12, z: r.pos.z - f.z * 0.82 - rt.z * 0.12};
  return {...p, h: headingTo(p, {x: r.pos.x, z: r.pos.z})};
})();
const DIR_OFF = {x: 53.45, z: -2.5};
const DIR_RUN2: XZ[] = [DIR_OFF, {x: 52.4, z: -1.55}, {x: 50.3, z: -2.55}, {x: 47.6, z: -3.4}, {x: GRP.director.x, z: GRP.director.z}];
/** the run to the decoy maker, the grab, the scramble west with her; thrown forward by the blast */
const DIR_GRAB = {x: 45.25, z: -1.45};
const DIR_HAUL: XZ[] = [DIR_GRAB, {x: 44.3, z: -1.4}, {x: 43.3, z: -1.25}];
const DIR_THROWN = {from: DIR_HAUL[2], to: {x: 42.4, z: -1.2}};
const DIR_UP = 146.7, DIR_GO = 148.25;
const DIR_RUN3: XZ[] = [{x: 42.75, z: -1.2}, {x: 41.6, z: -0.45}, {x: 40.4, z: 0.4}, {x: 38.2, z: 0.95}, {x: D4S('director').pos.x, z: D4S('director').pos.z}];
const DF_END = DIR_FIGHT[DIR_FIGHT.length - 1];
/** the dash to her (the launcher is on her) */
const DIR_DASH: XZ[] = [{x: GRP.director.x - 0.1, z: GRP.director.z + 0.3}, {x: 45.55, z: -2.2}, DIR_GRAB];
const DIR_SEGS: Seg[] = smoothSegs([
  {kind: 'stand', root: [[M.P3, D0.x, D0.z, 95], [119.3, D0.x, D0.z, 95], [119.42, D0.x, D0.z, headingTo(D0, DIR_RUN1[1])]], stag: 0.14},
  {kind: 'run', path: DIR_RUN1, T0: EV3.dirGo, T1: 121.95, gait: GAITS.dir, A: 0.5, D: 0.6},
  // braced in U8's path; the hammer (heels skid); pressed back in two shuffles
  {kind: 'stand', stag: 0.18, stepLen: 0.42, root: [[121.95, DF0.x, DF0.z, runEnd(DIR_RUN1).h], ...DIR_FIGHT.slice(1).map((k) => [...k] as KR)]},
  // U8 turns away: two driving steps after it, the plate into its back; backs off up the slope as the heavy goes over
  {kind: 'stand', stag: 0.18, stepLen: 0.7, root: [[DF_END[0], DF_END[1], DF_END[2], DF_END[3]],
    [EV3.bash - 0.03, U8_BASH.x, U8_BASH.z, U8_BASH.h], [EV3.bash + 0.3, U8_BASH.x - 0.1, U8_BASH.z - 0.04, U8_BASH.h],
    [125.05, U8_BASH.x - 0.35, U8_BASH.z - 0.3, U8_BASH.h - 20], [125.95, DIR_OFF.x, DIR_OFF.z, 52], [127.55, DIR_OFF.x, DIR_OFF.z, 50],
    [128.05, DIR_OFF.x - 0.04, DIR_OFF.z + 0.02, headingTo(DIR_OFF, DIR_RUN2[1])]]},
  {kind: 'run', path: DIR_RUN2, T0: 128.1, T1: 130.85, gait: GAITS.dir, A: 0.5, D: 0.7},
  {kind: 'stand', stag: 0.16, stepLen: 0.42, root: [[130.85, GRP.director.x, GRP.director.z, runEnd(DIR_RUN2).h], [131.4, GRP.director.x, GRP.director.z, GRP.director.h],
    // the smash: a step toward her; back to the guard, watching the flank
    [136.2, GRP.director.x, GRP.director.z, GRP.director.h], [136.6, GRP.director.x - 0.08, GRP.director.z + 0.35, 168], [137.8, GRP.director.x - 0.08, GRP.director.z + 0.35, 140],
    [138.3, GRP.director.x - 0.1, GRP.director.z + 0.3, 92], [EV3.seeHer, GRP.director.x - 0.1, GRP.director.z + 0.3, 96],
    [EV3.dirRun - 0.02, GRP.director.x - 0.1, GRP.director.z + 0.3, headingTo(DIR_DASH[0], DIR_DASH[1])]]},
  // he sees the launcher come round onto her: the dash to her, the grab, the haul round to the west
  {kind: 'run', path: DIR_DASH, T0: EV3.dirRun, T1: EV3.grab - 0.03, gait: GAITS.dash, A: 0.15, D: 0.2},
  {kind: 'stand', stag: 0.16, stepLen: 0.5, root: [[EV3.grab - 0.03, DIR_GRAB.x, DIR_GRAB.z, runEnd(DIR_DASH).h], [EV3.grab + 0.18, DIR_GRAB.x, DIR_GRAB.z, 175],
    [EV3.decUp, DIR_GRAB.x - 0.08, DIR_GRAB.z + 0.02, 250]]},
  {kind: 'run', path: DIR_HAUL, T0: EV3.decUp + 0.02, T1: THROW_T, gait: GAITS.dash, A: 0.3, D: 0},
  {kind: 'fn', T0: THROW_T, at: (T) => dirThrownBody(T)},
  // up: a glance back over his shoulder at the heavy, then the sprint west
  {kind: 'stand', stag: 0.14, root: [[DIR_UP + 1.0, DIR_THROWN.to.x + 0.35, DIR_THROWN.to.z, 165], [DIR_GO - 0.3, DIR_THROWN.to.x + 0.35, DIR_THROWN.to.z, 160], [DIR_GO, DIR_THROWN.to.x + 0.35, DIR_THROWN.to.z, headingTo(DIR_RUN3[0], DIR_RUN3[1])]]},
  {kind: 'run', path: DIR_RUN3, T0: DIR_GO + 0.02, T1: 149.42, gait: GAITS.sprint, A: 0.4, D: 0.45},
  {kind: 'stand', stag: 0.14, root: [[149.42, D4S('director').pos.x, D4S('director').pos.z, runEnd(DIR_RUN3).h], [149.8, D4S('director').pos.x, D4S('director').pos.z, 90]]},
]);
/** thrown forward by the blast (running away from it): onto his hands and front, a slide, then up (the rise) */
const dirThrownBody = (T: number) => {
  const u = clamp((T - THROW_T) / 0.5), e = 1 - (1 - u) * (1 - u);
  const upk = T > DIR_UP ? smooth((T - DIR_UP) / 1.0) : 0;
  const x = lerp(DIR_THROWN.from.x, DIR_THROWN.to.x, e) + 0.35 * upk, z = lerp(DIR_THROWN.from.z, DIR_THROWN.to.z, e);
  // (getting up he turns toward the danger: from the throw's west to the south, the heavy over his left shoulder)
  const h = 268 - 103 * smooth(clamp((T - (DIR_UP + 0.45)) / 0.55)), pos = ON({x, z});
  return {pos, heading: h, ...riseFeet({pos, heading: h}, clamp((T - DIR_UP) / 1.0) * 7.2)};
};
const GUARD = {r: 6, u: 345, f: 112};
const GUARD_HIGH = {r: 4, u: 372, f: 128};
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
const DIR_FACE: [number, Face][] = [
  [M.P3, E.pant], [116.95, E.relief], [117.0, E.resolve], [EV3.sig, E.shout], [EV3.sigEnd + 0.2, E.focus], [EV3.flash, E.alert], [EV3.dirGo, E.effort],
  [122.3, E.anger], [EV3.e1Ham - 0.05, E.strain], [EV3.e1Ham + 0.04, E.pain], [EV3.press0 + 0.1, E.strain], [EV3.e1Turn + 0.05, E.alert], [EV3.bash - 0.2, E.fierce],
  [EV3.bash + 0.15, E.effort], [EV3.knee + 0.05, E.recog], [125.3, E.alert], [EV3.land, E.shock], [126.9, E.pant], [127.25, E.fierce], [127.75, E.grin],
  [128.2, E.effort], [131.0, E.focus], [EV3.lock + 0.4, E.alert], [131.5, E.real], [132.6, E.resolve], [EV3.smash, E.shock], [136.9, E.worried],
  [138.4, E.resolve], [EV3.cut, E.real], [EV3.kill, E.shock], [141.9, E.worried], [142.6, E.resolve], [EV3.seeHer, E.fear], [EV3.dirRun, E.shout], [EV3.grab, E.effort],
  [THROW_T, E.pain], [146.2, E.dazed], [DIR_UP + 0.5, E.pain], [147.75, E.real], [147.95, E.resolve], [DIR_GO + 0.1, E.effort],
];
const U8_HEAD = (T: number) => unitAttach(escort('U8', T)).head, U8_CHEST = (T: number) => unitAttach(escort('U8', T)).chest;
const H1_HULL = (T: number) => heavyAttach(heavy1D3(T)).hull;
const DIR_LOOK: LK[] = [
  [M.P3, H1_EYE], [117.1, at3(48.4, -6.2, 1.0)], [EV3.sigEnd, H1_EYE], [EV3.dirGo + 0.3, null], [121.6, U8_HEAD], [EV3.e1Turn, U8_CHEST], [EV3.bash + 0.15, KNEE_AT()],
  [125.2, H1_HULL], [126.8, WRECK_C], [128.1, null], [130.8, at3(56.5, -1, 1.2)], [135.2, at3(56.5, -0.5, 3.5)], [136.2, ON(DEC_SPOT, 0.9)], [138.2, at3(52.5, -10, 2.5)],
  [140.4, (T) => allyAt(Math.min(T, EV3.kill))], [141.8, H2_EYE], [EV3.seeHer, H2_POD], [EV3.dirRun, ON(DEC_SPOT, 0.8)], [EV3.decUp, H2_POD], [THROW_T, null], [DIR_UP + 0.95, H2_EYE], [DIR_GO + 0.05, null],
];
export const directorAt = (T: number): CrewOut => {
  const b = bodyAt3(DIR_SEGS, T);
  const plate = toolsR2('director', T).plate ?? 'dented';
  let guard = {...GUARD};
  let pose: Pose = layer(BRACED({wide: 0.8}), {breath: 0.6});
  // the start: D2's BRIGHT stance (plate down, breathing): it hardens as he sees heavy 1 come on
  const bright = 1 - ramp(T, 117.0, 117.4);
  if (bright > 0) pose = blendPose(pose, layer(STAND, {drop: 14, lean: 6, armL: {local: {r: -40, u: 190, f: 70}, palm: {r: 0.4, u: 0.2, f: -1}}, armR: {local: {r: 54, u: 150, f: 30}}, handL: 'fist', handR: 'relaxed', breath: 0.85}), bright);
  // the signal: the right arm thrown forward at the heavy — now
  const sig = win(T, EV3.sig, EV3.sigEnd + 0.15, 0.12, 0.2);
  if (sig > 0) pose = blendPose(pose, layer(pose, {armR: {local: {r: 30, u: 320 + 30 * Math.sin(Math.PI * clamp((T - EV3.sig) / 0.4)), f: 200}, palm: {r: 0, u: -1, f: 0.2}}, handR: 'open'}), sig);
  // braced in U8's path, plate high; the hammer (heavy block: the plate driven down and in, heels skid); the press
  const brace = win(T, 122.2, EV3.e1Turn + 0.15, 0.3, 0.2);
  if (brace > 0) {
    guard = {r: lerp(GUARD.r, GUARD_HIGH.r, brace), u: lerp(GUARD.u, GUARD_HIGH.u, brace), f: lerp(GUARD.f, GUARD_HIGH.f, brace)};
    pose = blendPose(pose, layer(pose, {drop: 34, lean: 12, twist: -8}), brace);
  }
  const ham = jolt(T, EV3.e1Ham, 5);
  if (ham > 0.01) { pose = layer(pose, {drop: (pose.drop ?? 0) + 24 * ham, lean: (pose.lean ?? 0) - 12 * ham}); guard = {r: guard.r, u: guard.u - 46 * ham, f: guard.f - 34 * ham}; }
  const press = win(T, EV3.press0, EV3.press1 + 0.1, 0.1, 0.15);
  if (press > 0) pose = layer(pose, {lean: (pose.lean ?? 0) + 8 * press * (0.5 + 0.5 * Math.sin((T - EV3.press0) * 22))});
  // the bash into U8's back as it turns away (the anticipation over the lunge)
  const bIn = clamp((T - (EV3.bash - 0.36)) / 0.36), bOut = smooth(clamp((T - (EV3.bash + 0.1)) / 0.45));
  const chg = T > EV3.bash - 0.38 && T < EV3.bash + 0.6 ? easeIn(bIn) * (1 - bOut) : 0;
  if (chg > 0) pose = blendPose(pose, layer(BASH(1), {drop: 30, lean: 24}), chg);
  // it goes over: he watches it fall; the crash and the dust wave (face turned from it); the peak: a fierce breath
  const peak = win(T, 126.9, 128.0, 0.35, 0.2);
  if (peak > 0) { pose = blendPose(pose, layer(pose, {drop: 18, lean: 6, breath: 1}), peak); guard = {r: lerp(guard.r, -40, peak), u: lerp(guard.u, 200, peak), f: lerp(guard.f, 70, peak)}; }
  // the grab: his right hand reaches for her arm (battle.tsx puts it on her), the plate held up toward the heavy
  const grab = win(T, EV3.grab - 0.15, THROW_T, 0.12, 0.02);
  if (grab > 0) pose = blendPose(pose, layer(pose, {armR: {local: {r: 40, u: 250, f: 120}, palm: {r: 0, u: -0.3, f: -1}}, handR: 'grip', lean: 14, drop: 30}), grab);
  // up from the throw: a glance back over his shoulder at the heavy (the torso turns with it)
  const glance = win(T, DIR_UP + 0.8, DIR_GO, 0.25, 0.2);
  if (glance > 0) pose = layer(pose, {twist: (pose.twist ?? 0) + 14 * glance});
  // down: thrown onto his front, a moment, up hurt (the lip cut)
  let down = false;
  if (T >= THROW_T && T < DIR_UP + 1.0) {
    down = true;
    const u = clamp((T - THROW_T) / 0.45);
    const fallP: Pose = keyPose([[0, layer(STAND, {drop: 20, lean: 18})], [0.4, {drop: 60, lean: 50, bodyPitch: 30, armL: {fk: {fwd: 90, out: 20, bend: 20}}, armR: {fk: {fwd: 90, out: 20, bend: 20}}, handL: 'open', handR: 'open'}], [1, RISE_KEYS[0][1]]], u);
    const hp = lerp(RISE_KEYS[0][1].head?.pitch ?? -46, -26 + 6 * Math.sin((T - 146) * 3), ramp(T, THROW_T + 0.45, THROW_T + 0.85) * (1 - ramp(T, DIR_UP - 0.35, DIR_UP)));
    pose = T < DIR_UP ? (u < 1 ? fallP : layer(RISE_KEYS[0][1], {head: {pitch: hp}})) : risePose(clamp((T - DIR_UP) / 1.0) * 7.2);
  }
  // looks
  const L = lookBy(pose, b, DIR_LOOK, T, down ? 0 : 1 - sig * 0.5);
  pose = flinch(T, EV3.land, 1, 0.9)(L.pose);
  // the plate arm: the body-local guard (not while down, not in the bash's own arm)
  const guardOn = (1 - bright) * (1 - sig) * (down ? 0 : 1) * (1 - chg);
  if (!down) pose = blendPose(pose, layer(pose, {armL: {local: guard, pole: {r: -1, u: -0.7, f: 0.1}, palm: {r: -0.55, u: 0.1, f: -1}}, handL: 'fist'}), guardOn);
  const final = withRun(b, withFace(pose, faceKeys(T, DIR_FACE)), guardRun(b));
  const glint = Math.max(win(T, EV3.e1Ham, EV3.e1Ham + 0.16, 0.01, 0.12), win(T, EV3.bash, EV3.bash + 0.16, 0.01, 0.1));
  const spec = base('director', 'd3dir', 11, b, T, {...final, handL: 'fist', handR: final.handR ?? 'fist', wearL: plateWear(plate, {glint})}, {}, !down || T >= DIR_FEET, down ? undefined : L.gaze);
  return {spec, body: b, pts: {plate: plateFrom(b, guard)}};
};
/** world feet from the knee under the hips in the rise */
const DIR_FEET = DIR_UP + RISE_FEET_T / 7.2;

// ================================================================== THE BREAKER (honest) and THE RUNNER (guesser)
const K0 = {x: 48.65, z: -7.19}, R0 = {x: 49.17, z: -6.73};
/** down the slope along the water main's south-west side, left into the crossing, under it (ducked), up to the leg */
const BRK_RUN: XZ[] = [{x: K0.x - 0.05, z: K0.z - 0.04}, {x: 49.55, z: -7.5}, {x: 50.6, z: -7.0}, {x: 51.9, z: -5.6}, {x: 53.8, z: -4.25}, {x: 56.0, z: -3.25}, {x: 57.4, z: -1.75}, {x: 58.6, z: -0.45},
  {x: 59.25, z: 0.35}, UNDER.sw, UNDER.mid, UNDER.ne, {x: BRK_STAND.x, z: BRK_STAND.z}];
/** the pivot off the knee, the dive back under the main, the sprint north-west along it, clear of the fall */
const BRK_STOP = {x: 55.4, z: -3.05};
const BRK_OUT: XZ[] = [{x: BRK_STAND.x - 0.12, z: BRK_STAND.z + 0.25}, UNDER.ne, UNDER.mid, UNDER.sw, {x: 59.0, z: 0.9}, {x: 58.1, z: 0.0}, {x: 57.0, z: -1.1}, {x: 56.0, z: -2.2}, BRK_STOP];
const BRK_OUT_H = headingTo(BRK_OUT[0], BRK_OUT[1]);
const BRK_UP: XZ[] = [BRK_STOP, {x: 53.6, z: -2.3}, {x: 51.4, z: -2.1}, {x: 49.7, z: -2.75}, {x: 47.6, z: -3.55}, {x: GRP.breaker.x, z: GRP.breaker.z}];
const BRK_BACK2: XZ[] = [...BACK.breaker.slice(2), {x: 40.0, z: 0.1}, {x: 37.6, z: 1.6}, {x: 34.5, z: 2.5}, {x: D4S('breaker').pos.x, z: D4S('breaker').pos.z}];
const BRK_PIVOT = {t0: 125.0, t1: 125.3};
const BRK_SEGS: Seg[] = smoothSegs([
  {kind: 'stand', root: [[M.P3, K0.x, K0.z, 130], [117.4, K0.x, K0.z, 130], [117.85, K0.x - 0.05, K0.z - 0.04, 112], [119.53, K0.x - 0.05, K0.z - 0.04, 112]], stag: 0.12},
  {kind: 'run', path: BRK_RUN, T0: EV3.brkGo, T1: EV3.brkSet, gait: GAITS.crouch, A: 0.6, D: 0.45},
  {kind: 'stand', stag: 0.18, root: [[EV3.brkSet, BRK_STAND.x, BRK_STAND.z, BRK_STAND.h], [BRK_PIVOT.t0, BRK_STAND.x, BRK_STAND.z, BRK_STAND.h],
    [BRK_PIVOT.t1, BRK_OUT[0].x, BRK_OUT[0].z, BRK_OUT_H]]},
  {kind: 'run', path: BRK_OUT, T0: BRK_PIVOT.t1, T1: 127.2, gait: GAITS.dash, A: 0.2, D: 0.6},
  {kind: 'stand', stag: 0.14, root: [[127.2, BRK_STOP.x, BRK_STOP.z, runEnd(BRK_OUT).h], [127.6, BRK_STOP.x, BRK_STOP.z, 62], [128.35, BRK_STOP.x, BRK_STOP.z, 60], [128.85, BRK_STOP.x - 0.05, BRK_STOP.z, headingTo(BRK_UP[0], BRK_UP[1])]]},
  {kind: 'run', path: BRK_UP, T0: 128.9, T1: 131.8, gait: GAITS.heavy, A: 0.5, D: 0.7},
  {kind: 'stand', stag: 0.12, root: [[131.8, GRP.breaker.x, GRP.breaker.z, runEnd(BRK_UP).h], [132.6, GRP.breaker.x, GRP.breaker.z, GRP.breaker.h], [EV3.fallBack + 0.15, GRP.breaker.x, GRP.breaker.z, GRP.breaker.h], [EV3.fallBack + 0.35, GRP.breaker.x - 0.05, GRP.breaker.z + 0.05, headingTo(BACK.breaker[0], BACK.breaker[1])]]},
  {kind: 'run', path: BACK.breaker, T0: EV3.fallBack + 0.15, T1: 145.55, gait: GAITS.heavy, A: 0.35, D: 0.3},
  {kind: 'stand', stag: 0.12, root: [[145.55, BACK.breaker[2].x, BACK.breaker[2].z, runEnd(BACK.breaker).h], [146.9, BACK.breaker[2].x, BACK.breaker[2].z, runEnd(BACK.breaker).h + 15], [147.05, BACK.breaker[2].x, BACK.breaker[2].z, headingTo(BRK_BACK2[0], BRK_BACK2[1])]]},
  {kind: 'run', path: BRK_BACK2, T0: 147.1, T1: 148.95, gait: GAITS.heavy, A: 0.4, D: 0.6},
  {kind: 'stand', stag: 0.1, root: [[148.95, D4S('breaker').pos.x, D4S('breaker').pos.z, runEnd(BRK_BACK2).h], [149.8, D4S('breaker').pos.x, D4S('breaker').pos.z, D4S('breaker').heading]]},
]);
const RUN_RUN: XZ[] = [{x: R0.x + 0.06, z: R0.z - 0.08}, {x: 49.6, z: -7.25}, {x: 50.7, z: -6.9}, {x: 52.2, z: -5.1}, {x: 54.6, z: -3.0}, {x: 56.3, z: -1.85}, RUN_GUARD];
/** after the hook he backs off up the slope, watching it go down (and the heavy) */
const RUN_STOP = {x: 54.1, z: -3.45};
const RUN_BACKOFF: XZ[] = [{x: RUN_HOOK.x - 0.05, z: RUN_HOOK.z - 0.1}, {x: 55.1, z: -2.55}, RUN_STOP];
const RUN_UP: XZ[] = [RUN_STOP, {x: 53.05, z: -4.55}, {x: 51.2, z: -4.6}, {x: 49.2, z: -4.5}, {x: 47.2, z: -5.05}, {x: GRP.runner.x, z: GRP.runner.z}];
const RUN_BACK2: XZ[] = [{x: 41.5, z: -6.55}, {x: 39.0, z: -6.1}, {x: 37.5, z: -2.7}, {x: 36.3, z: 1.6}, {x: D4S('runner').pos.x, z: D4S('runner').pos.z}];
/** U8 at the hook: its left ankle (it stumbles past him from the Director's plate) */
const U8_ANKLE = (T: number) => unitAttach(escort('U8', Math.min(T, EV3.hook))).footL;
const hookH = headingTo(RUN_HOOK, U8_ANKLE(EV3.hook - 0.1));
const RUN_BACK_H = headingTo(RUN_BACKOFF[0], RUN_BACKOFF[1]) + 180;
const RUN_SEGS: Seg[] = smoothSegs([
  {kind: 'stand', root: [[M.P3, R0.x, R0.z, 138], [117.45, R0.x, R0.z, 138], [117.9, R0.x + 0.06, R0.z - 0.08, 110], [119.9, R0.x + 0.06, R0.z - 0.08, 110]], stag: 0.12},
  {kind: 'run', path: RUN_RUN, T0: EV3.runGo, T1: 122.95, gait: GAITS.crouch, A: 0.6, D: 0.6},
  {kind: 'stand', stag: 0.16, root: [[122.95, RUN_GUARD.x, RUN_GUARD.z, runEnd(RUN_RUN).h], [123.3, RUN_GUARD.x, RUN_GUARD.z, 292], [124.0, RUN_GUARD.x, RUN_GUARD.z, 292],
    // the dash in behind U8, the hook, the yank; he turns to back off
    [EV3.hook - 0.1, RUN_HOOK.x, RUN_HOOK.z, hookH], [EV3.hook + 0.12, RUN_HOOK.x, RUN_HOOK.z, hookH], [124.85, RUN_BACKOFF[0].x, RUN_BACKOFF[0].z, RUN_BACK_H]]},
  {kind: 'run', path: RUN_BACKOFF, T0: 124.87, T1: 125.95, gait: GAITS.jog, A: 0.2, D: 0.5, back: true},
  {kind: 'stand', stag: 0.14, root: [[125.95, RUN_STOP.x, RUN_STOP.z, RUN_BACK_H], [126.5, RUN_STOP.x, RUN_STOP.z, 66], [127.95, RUN_STOP.x, RUN_STOP.z, 62], [128.45, RUN_STOP.x - 0.05, RUN_STOP.z, headingTo(RUN_UP[0], RUN_UP[1])]]},
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
/** where the ram head lands: the outside of the rear-left knee */
export const kneeTarget = (): V3 => KNEE_AT();
const BRK_FACE: [number, Face][] = [
  [M.P3, E.pant], [117.4, E.resolve], [EV3.brkGo, E.effort], [EV3.under0, E.strain], [EV3.brkSet, E.focus], [EV3.brkWind, E.effort], [EV3.knee, E.strain],
  [EV3.knee + 0.12, E.recog], [EV3.brkDive - 0.08, E.fear], [125.5, E.effort], [EV3.land, E.shock], [126.9, E.pant], [127.3, E.grin], [128.2, E.effort],
  [131.0, E.focus], [131.6, E.real], [132.6, E.resolve], [EV3.smash, E.shock], [137.0, E.focus], [EV3.cut, E.real], [EV3.kill, E.worried], [142.6, E.fear], [EV3.fallBack + 0.1, E.effort],
  [THROW_T, E.pain], [146.0, E.dazed], [146.45, E.real], [146.8, E.grief], [147.1, E.effort],
];
const BRK_DOWN = {t0: 145.5, t1: 147.0};
const BRK_LOOK: LK[] = [
  [M.P3, at3(50.25, -7.7, 1.5)], [117.6, H1_EYE], [EV3.brkGo + 0.3, null], [122.95, KNEE_AT()], [EV3.e2Hit - 0.3, (T) => unitAttach(escort('R4', T)).head], [BRK_PIVOT.t1 + 0.1, null],
  [127.2, WRECK_C], [128.8, null], [131.2, at3(55.5, -0.5, 1.4)], [136.4, at3(45.5, -1, 2.0)], [141.8, H2_EYE], [EV3.fallBack, null],
];
export const breakerAt = (T: number): CrewOut => {
  const b = bodyAt3(BRK_SEGS, T);
  const gauge = toolsR2('breaker', T).gauge ?? 1;
  let pose: Pose = layer(BRACED({wide: 0.85}), {});
  // the start: kneeling behind the runner (D2), breathing; up at 117.4
  const kneel0 = 1 - ramp(T, 117.35, 117.8);
  if (kneel0 > 0) pose = blendPose(pose, layer(KNEEL('L'), {drop: 80, lean: 12, breath: 0.8}), kneel0);
  // ducking under the water main (going in, diving back)
  const dk = duckAt(b.pos);
  if (dk > 0) pose = layer(pose, {drop: (pose.drop ?? 0) + DUCK.drop! * dk, lean: (pose.lean ?? 0) + DUCK.lean! * dk, head: {pitch: -18 * dk}});
  // the wind-up (slow), the strike into the knee, the recoil
  const swing = T > EV3.brkWind - 0.05 && T < 125.0;
  let hands: {front: V3; back: V3} | null = null;
  if (swing) {
    const k = swingK(T, EV3.brkWind, EV3.knee, 125.0);
    hands = swingHands(b, kneeTarget(), k);
    const sw = k < 0.36 ? smooth(k / 0.36) : 1;
    pose = layer(pose, {
      drop: lerp(24, 10, sw) + (k > 0.45 && k < 0.8 ? 26 * Math.sin(Math.PI * clamp((k - 0.45) / 0.35)) : 0),
      lean: k < 0.36 ? lerp(8, -18, smooth(k / 0.36)) : k < 0.55 ? lerp(-18, 20, smooth((k - 0.36) / 0.19)) : lerp(20, 6, smooth((k - 0.55) / 0.45)),
      twist: k < 0.36 ? 16 * smooth(k / 0.36) : lerp(16, -6, smooth((k - 0.36) / 0.3)),
    });
  }
  // set under it: crouched, the tool ready, looking up at the knee
  const set = win(T, EV3.under1, EV3.brkWind + 0.05, 0.2, 0.1);
  if (set > 0) pose = blendPose(pose, layer(pose, {drop: 34, lean: 14}), set);
  // the blast: knocked down onto a knee (the tool across his thigh); he checks the gauge: empty
  const kd = win(T, BRK_DOWN.t0, BRK_DOWN.t1, 0.18, 0.3);
  if (kd > 0) pose = blendPose(pose, layer(KNEEL('R'), {drop: 84, lean: 22, head: {pitch: 30, yaw: 4}, face: {lookY: 0.7}, breath: 1}), kd);
  kneelFeet(b, 'L', kneel0);
  kneelFeet(b, 'R', kd);
  const L = lookBy(pose, b, BRK_LOOK, T, 0.9 * (1 - kd) * (1 - dk));
  pose = L.pose;
  const lt = L.gaze;
  // the crash behind them
  pose = flinch(T, EV3.land, 0.8, 0.9)(pose);
  const port = {front: fromLoc(b, {r: -16, u: 250, f: 118}), back: fromLoc(b, {r: 32, u: 205, f: 34})};
  // the gauge check: the tool lifted across his body, the gauge toward his face
  const chk = win(T, 146.3, 147.0, 0.2, 0.15);
  const H0 = hands ?? port;
  const H = chk > 0 ? {front: lerp3v(H0.front, fromLoc(b, {r: -30, u: 210, f: 90}), chk), back: lerp3v(H0.back, fromLoc(b, {r: 34, u: 190, f: 50}), chk)} : H0;
  const runArms: Pose = {armL: {local: {r: -16, u: 262, f: 112}}, armR: {local: {r: 30, u: 208, f: 36}}};
  const final = withRun(b, withFace(pose, faceKeys(T, BRK_FACE)), runArms);
  const fire = swing ? win(T, EV3.knee, EV3.knee + 0.08, 0.005, 0.05) : 0;
  const spec = base('breaker', 'd3brk', 7, b, T, {...final, handL: 'grip', handR: 'grip', twoHanded: true, extra: breakerTool({back: 1, front: 0, gauge, fire, recoil: fire})}, {handL: H.front, handR: H.back}, true, lt ?? undefined);
  return {spec, body: b, pts: {front: H.front, back: H.back}};
};
const HAL_TIP = 0.62;
/** the halligan held from the back (right) hand along d */
const halFrom = (tip: V3, d: V3) => { const back = sub3(tip, mul3(d, HAL_TIP + 0.34)); return {back, front: add3(back, mul3(d, 0.34))}; };
/** the adze round U8's left ankle as it stumbles past: swung low round behind it, yanked back toward him */
const ankleHands = (b: Body, T: number) => {
  const ft = U8_ANKLE(T);
  const reach = smooth(clamp((T - (EV3.hook - 0.32)) / 0.32)), pull = smooth(clamp((T - EV3.hook) / 0.2));
  const rest = fromLoc(b, {r: 40, u: 160, f: 70});
  const tip0 = add3(ft, {x: 0, y: 0.12, z: 0});
  const toMe = norm3(sub3(fromLoc(b, {r: 0, u: 120, f: 0}), tip0));
  const tip = add3(lerp3v(rest, tip0, easeIn(reach)), mul3(toMe, 0.5 * pull));
  return halFrom(tip, norm3(sub3(tip, fromLoc(b, {r: 30, u: 170, f: 0}))));
};
const RUN_FACE: [number, Face][] = [
  [M.P3, E.dazed], [117.45, E.pant], [117.9, E.focus], [EV3.runGo, E.effort], [122.95, E.focus], [EV3.e1Ham, E.alert], [EV3.e1Turn + 0.05, E.anger], [EV3.hook - 0.25, E.effort],
  [EV3.hook + 0.2, E.fierce], [124.9, E.alert], [EV3.knee + 0.1, E.recog], [EV3.land, E.shock], [126.9, E.pant], [127.3, E.grin], [128.4, E.effort],
  [131.0, E.focus], [131.6, E.real], [132.6, E.resolve], [EV3.smash, E.shock], [137.0, E.focus], [EV3.cut, E.real], [EV3.kill, E.worried], [142.6, E.fear], [EV3.fallBack + 0.3, E.effort],
  [THROW_T, E.pain], [146.4, E.dazed], [147.0, E.effort],
];
const RUN_DOWN = {t0: THROW_T, t1: 147.0};
const RUN_LOOK: LK[] = [
  [M.P3, at3(50.25, -7.7, 1.5)], [117.6, H1_EYE], [EV3.runGo + 0.3, null], [122.75, U8_HEAD], [EV3.hook + 0.15, KNEE_AT()], [125.3, H1_HULL], [126.5, WRECK_C], [128.4, null],
  [131.1, at3(55.5, -0.5, 1.4)], [136.4, H2_EYE], [EV3.fallBack, null],
];
/** the bar in both hands from the run on (until the blast knocks it to one hand) */
const RUN_TWO = {t0: EV3.runGo - 0.1, t1: THROW_T};
export const runnerAt = (T: number): CrewOut => {
  const b = bodyAt3(RUN_SEGS, T);
  let pose: Pose = layer(BRACED({wide: 0.7}), {});
  const kneel0 = 1 - ramp(T, 117.4, 117.85);
  if (kneel0 > 0) pose = blendPose(pose, layer(KNEEL('R'), {drop: 84, lean: 18, armL: {local: {r: -20, u: 170, f: 70}}, armR: {local: {r: 40, u: 150, f: 60}}, handL: 'brace', breath: 1}), kneel0);
  // rear guard at the crossing: the bar up in both hands, low
  const guard = win(T, 122.95, EV3.hook - 0.3, 0.3, 0.1);
  if (guard > 0) pose = blendPose(pose, layer(pose, {drop: 32, lean: 10}), guard);
  // the bar: carried in both hands; up at the guard; the hook (low, the adze round its ankle, the yank)
  const carry = {back: fromLoc(b, {r: 40, u: 200, f: 40}), front: fromLoc(b, {r: -26, u: 222, f: 78})};
  let H = carry;
  const mix = (h: {back: V3; front: V3}, w: number) => { if (w > 0) H = {back: lerp3v(H.back, h.back, w), front: lerp3v(H.front, h.front, w)}; };
  mix({back: fromLoc(b, {r: 36, u: 300, f: 110}), front: fromLoc(b, {r: -24, u: 330, f: 140})}, guard);
  const ank = win(T, EV3.hook - 0.36, EV3.hook + 0.4, 0.15, 0.22);
  if (ank > 0) { mix(ankleHands(b, T), ank); pose = layer(pose, {drop: (pose.drop ?? 0) + 46 * ank, lean: (pose.lean ?? 0) + 24 * ank, twist: -18 * ank}); }
  // the blast: knocked sideways onto his hip, a roll, up
  let down = false;
  if (T >= RUN_DOWN.t0 && T < RUN_DOWN.t1) {
    down = true;
    const u = (T - RUN_DOWN.t0) / (RUN_DOWN.t1 - RUN_DOWN.t0);
    pose = keyPose([
      [0, layer(STAND, {drop: 20, lean: 10})],
      [0.12, {drop: 40, lean: -10, side: -26, armL: {fk: {fwd: 60, out: 70, bend: 20}}, armR: {fk: {fwd: 40, out: 60, bend: 30}}, handL: 'open', handR: 'grip'}],
      [0.3, {drop: 120, lean: 0, bodyRoll: -60, bodyPitch: 10, legL: {fk: {fwd: 40, knee: 70}}, legR: {fk: {fwd: 20, knee: 50}}, armL: {fk: {fwd: 40, out: 40, bend: 40}}, handL: 'brace', handR: 'grip'}],
      [0.55, {drop: 112, lean: 10, bodyRoll: -30, bodyPitch: 20, legL: {fk: {fwd: 60, knee: 100}}, legR: {fk: {fwd: 10, knee: 90}}, handL: 'brace', handR: 'grip'}],
      [0.8, layer(KNEEL('L'), {drop: 70, lean: 20})],
      [1, layer(BRACED({wide: 0.7}), {drop: 26, lean: 12})],
    ], u);
  }
  if (T >= 146.95 && T < 147.2) kneelFeet(b, 'L', 1 - smooth((T - 146.95) / 0.25));
  kneelFeet(b, 'R', kneel0);
  const L = lookBy(pose, b, RUN_LOOK, T, down ? 0 : 0.9);
  pose = flinch(T, EV3.land, 0.8, 0.9)(L.pose);
  const runArms: Pose = {armR: {local: {r: 40, u: 220, f: 60}}, armL: {local: {r: -26, u: 232, f: 80}}};
  const final = down ? withFace(pose, faceKeys(T, RUN_FACE)) : withRun(b, withFace(pose, faceKeys(T, RUN_FACE)), runArms);
  const two = T >= RUN_TWO.t0 && T < RUN_TWO.t1;
  const wH = two ? ramp(T, RUN_TWO.t0, RUN_TWO.t0 + 0.4) : 0;
  const spec0 = base('runner', 'd3run', 4, b, T, {
    ...final, handR: 'grip', handL: two ? 'grip' : final.handL ?? 'fist', twoHanded: two,
    ...(two ? {extra: halligan2({back: 1, front: 0})} : {holdR: halligan1({ang: 72})}),
  }, {}, !down, down ? undefined : L.gaze);
  return {spec: fadeHands(spec0, {handR: H.back, handL: H.front}, wH), body: b};
};

// ================================================================== THE TETHER (clerkA)
const A0 = {x: 47.3, z: -9.5};
const TTH_FIRE = {x: 47.65, z: -10.15};
const TTH_BRACE = {x: 46.1, z: -10.85};
/** R3's haul through the wrap: she is dragged a step toward the post */
const TTH_DRAG = {x: 46.42, z: -10.78};
const TTH_RUN: XZ[] = [{x: TTH_DRAG.x + 0.55, z: TTH_DRAG.z + 0.45}, {x: 45.2, z: -8.6}, {x: 43.6, z: -6.6}, {x: 43.1, z: -4.6}, {x: GRP.tether.x, z: GRP.tether.z}];
const TTH_RUN_H = headingTo(TTH_RUN[0], TTH_RUN[1]);
const TTH_SEGS: Seg[] = smoothSegs([
  {kind: 'stand', stag: 0.16, stepLen: 0.65, root: [[M.P3, A0.x, A0.z, 118], [120.3, A0.x, A0.z, 118], [120.95, TTH_FIRE.x, TTH_FIRE.z, 108], [EV3.tBite - 0.05, TTH_FIRE.x, TTH_FIRE.z, 108],
    // the wrap: a step to the post, the launcher swept round it, a step back west, braced against the reel
    [EV3.wrap0 + 0.08, 47.2, -10.85, 95], [EV3.wrap - 0.03, 46.62, -11.08, 70], [EV3.drag0 + 0.06, TTH_BRACE.x, TTH_BRACE.z, 100],
    // R3 hauls on the cable: she is dragged a step, digs her heels in
    [EV3.drag1 + 0.05, TTH_DRAG.x, TTH_DRAG.z, 98], [EV3.cut, TTH_DRAG.x, TTH_DRAG.z, 100]]},
  {kind: 'fn', T0: EV3.cut, at: (T) => tetherFallBody(T)},
  {kind: 'stand', stag: 0.14, root: [[EV3.tRun - 0.05, TTH_DRAG.x + 0.55, TTH_DRAG.z + 0.45, TTH_RUN_H], [EV3.tRun, TTH_DRAG.x + 0.55, TTH_DRAG.z + 0.45, TTH_RUN_H]]},
  {kind: 'run', path: TTH_RUN, T0: EV3.tRun, T1: 141.9, gait: GAITS.run, A: 0.4, D: 0.6},
  {kind: 'stand', stag: 0.14, root: [[141.9, GRP.tether.x, GRP.tether.z, runEnd(TTH_RUN).h], [142.4, GRP.tether.x, GRP.tether.z, GRP.tether.h], [EV3.fallBack + 0.12, GRP.tether.x, GRP.tether.z, GRP.tether.h], [EV3.fallBack + 0.25, GRP.tether.x, GRP.tether.z, headingTo(BACK.tether[0], BACK.tether[1])]]},
  {kind: 'run', path: BACK.tether, T0: EV3.fallBack + 0.05, T1: 148.2, gait: GAITS.run, A: 0.35, D: 0.7},
  {kind: 'stand', stag: 0.14, root: [[148.2, D4S('tether').pos.x, D4S('tether').pos.z, runEnd(BACK.tether).h], [149.1, D4S('tether').pos.x, D4S('tether').pos.z, D4S('tether').heading]]},
]);
/** the cable cut: the pull goes slack, she sits down hard backward, then scrambles up */
const tetherFallBody = (T: number) => {
  const u = clamp((T - EV3.cut) / 0.55), e = 1 - (1 - u) * (1 - u);
  const up = smooth(clamp((T - EV3.tUp) / (EV3.tRun - EV3.tUp)));
  const x = lerp(TTH_DRAG.x, TTH_DRAG.x - 0.55, e) + 1.1 * up, z = lerp(TTH_DRAG.z, TTH_DRAG.z - 0.1, e) + 0.55 * up;
  const h = 100 + wrapD(TTH_RUN_H - 100) * up;
  const f = fwdOf(h), r = rightOf(h);
  const foot = (sd: number): V3 => ON({x: x + f.x * 0.35 * (1 - up) + r.x * sd * 0.17, z: z + f.z * 0.35 * (1 - up) + r.z * sd * 0.17});
  return {pos: ON({x, z}), heading: h, footL: foot(-1), footR: foot(1)};
};
/** the clamp target: heavy 1's front-left shin (where the clamp will be at the bite: it is swinging round) */
export const clampTarget = (T: number): V3 => h1ClampPt(T);
const TTH_FACE: [number, Face][] = [
  [M.P3, E.pant], [117.2, E.alert], [EV3.flash, E.focus], [EV3.tAim, E.focus], [EV3.tFire, E.effort], [EV3.tBite + 0.05, E.focus], [EV3.wrap0, E.effort],
  [EV3.drag0, E.fear], [EV3.drag1, E.strain], [123.8, E.effort], [EV3.land, E.shock], [126.9, E.pant], [127.4, E.grin], [128.4, E.strain],
  [131.0, E.focus], [EV3.lock, E.alert], [137.7, E.worried], [EV3.cut, E.shock], [EV3.tUp, E.effort], [EV3.kill, E.worried], [142.6, E.fear], [EV3.fallBack, E.effort],
];
export const tetherAt = (T: number): CrewOut => {
  const b = bodyAt3(TTH_SEGS, T);
  let pose: Pose = layer(BRACED({wide: 0.75}), {armR: {local: {r: 30, u: 240, f: 90}}, armL: {local: {r: -30, u: 220, f: 60}}, handL: 'open'});
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
      lean: 6, drop: 18, twist: 14,
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
    pose = blendPose(pose, layer(pose, {drop: 10, lean: 4, armL: {local: {r: -40, u: 230, f: 50}}, head: {pitch: -18}}), wrapW);
    muzzle = lerp3v(muzzle, add3(handR, {x: 0, y: 0.06, z: 0}), wrapW);
  }
  // the reel locked: braced, leaning back, the launcher held in against the pull; R3's haul drags her a step (she
  // lurches forward, then digs in leaning back hard); the leg's strain on the pin (it holds: the post takes it)
  const haul = win(T, EV3.taut, EV3.cut + 0.02, 0.1, 0.02);
  if (haul > 0) {
    const d = norm3(sub3(ANCHOR, fromLoc(b, {r: 36, u: 280, f: 0})));
    const hR = add3(fromLoc(b, {r: 36, u: 280, f: 30}), mul3(d, 0.22));
    const dragK = win(T, EV3.drag0, EV3.drag1 + 0.25, 0.05, 0.3);
    const yk = win(T, EV3.yank + 0.05, EV3.yank + 0.7, 0.12, 0.4);
    pose = blendPose(pose, layer(pose, {
      armR: {local: toLoc(b, hR), pole: {r: 0.6, u: -1, f: 0}, palm: {r: -1, u: 0, f: 0}}, armL: {local: toLoc(b, add3(hR, {x: 0, y: -0.06, z: 0})), palm: {r: 1, u: 0.3, f: 0}},
      lean: -16 + 30 * dragK + 10 * yk, drop: 34 + 12 * yk, twist: 10,
    }), haul);
    muzzle = lerp3v(muzzle, add3(hR, mul3(d, 0.36)), haul);
  }
  // the cut: the pull gone, she sits down hard, scrambles up, the empty launcher in her hand
  let down = false;
  if (T >= EV3.cut && T < EV3.tRun) {
    down = true;
    const u = (T - EV3.cut) / (EV3.tRun - EV3.cut);
    pose = keyPose([
      [0, layer(pose, {})],
      [0.12, {drop: 60, lean: -30, armR: {fk: {fwd: 50, out: 30, bend: 20}}, armL: {fk: {fwd: 40, out: 50, bend: 20}}, handL: 'open'}],
      [0.35, {drop: 130, lean: -18, bodyPitch: -20, legL: {local: {r: -30, u: 40, f: 110}}, legR: {local: {r: 34, u: 46, f: 96}}, armL: {fk: {fwd: -30, out: 30, bend: 20}}, handL: 'brace'}],
      [0.55, {drop: 128, lean: -10, bodyPitch: -12, legL: {local: {r: -30, u: 40, f: 110}}, legR: {local: {r: 34, u: 46, f: 96}}, handL: 'brace', head: {pitch: -20}}],
      // (the left leg comes back under her lifted, not swept through the ground)
      [0.68, {drop: 104, lean: 8, bodyPitch: -2, legL: {local: {r: -34, u: 86, f: 18}}, legR: {local: {r: 35, u: 30, f: 84}}, handL: 'brace'}],
      [0.8, layer(KNEEL('L'), {drop: 76, lean: 20})],
      [1, layer(BRACED({wide: 0.7}), {drop: 26, lean: 14})],
    ], u);
  }
  const L = lookBy(pose, b, TTH_LOOK, T, down ? 0 : 0.9);
  pose = flinch(T, EV3.land, 0.5, 0.8)(L.pose);
  const lt = L.gaze;
  const runArms: Pose = {armR: {local: {r: 26, u: 236, f: 64}}, armL: b.gait?.armL};
  const final = down ? withFace(pose, faceKeys(T, TTH_FACE)) : withRun(b, withFace(pose, faceKeys(T, TTH_FACE)), runArms);
  const fired = T > EV3.tFire;
  const spool = !fired ? 1 : T < EV3.cut ? 0.35 : 0;
  const spec = base('tether', 'd3tth', 3, b, T, {...final, handR: 'grip', handL: final.handL ?? 'open', holdR: tetherLauncher({loaded: !fired, recoil}), extra: hipReel(spool)},
    handR && wrapW > 0 ? {handR: lerp3v(fromLoc(b, {r: 30, u: 240, f: 90}), handR, wrapW)} : {}, !down || T > EV3.tUp + 0.3, down ? undefined : lt);
  return {spec, body: b, pts: {muzzle}};
};
const TTH_LOOK: LK[] = [
  [M.P3, H1_EYE], [EV3.tAim - 0.15, (T) => clampTarget(Math.min(T, EV3.tBite))], [EV3.wrap0, ANCHOR], [EV3.taut, (T) => clampTarget(T)], [126.0, WRECK_C], [137.6, at3(51, -8.3, 2.0)],
  [EV3.cut, at3(48.5, -9, 1.0)], [EV3.tRun, at3(44.5, -4.5, 1.2)], [141.9, (T) => H2_EYE(Math.min(T, 145.4))],
];

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
const PIL_FACE: [number, Face][] = [
  [M.P3, E.pant], [117.3, E.focus], [EV3.allyGo, E.effort], [EV3.flash, E.alert], [120.0, E.focus], [123.1, E.effort], [123.7, E.focus], [EV3.land, E.shock], [126.8, E.relief],
  [128.0, E.focus], [EV3.lock + 0.3, E.alert], [131.5, E.focus], [EV3.smash, E.shock], [137.0, E.focus], [140.4, E.fear], [EV3.kill, E.shock], [141.9, E.grief],
  [143.5, E.worried], [EV3.fallBack, E.fear], [THROW_T, E.pain], [146.6, E.dazed], [146.85, E.effort],
];
const PIL_LOOK: LK[] = [[M.P3, allyAt], [EV3.kill + 0.05, at3(42.3, 2.4, 0.2)], [141.4, at3(42.3, 2.4, 0.2)], [143.6, H2_EYE], [EV3.fallBack, null]];
export const pilotAt = (T: number): CrewOut => {
  const b = bodyAt3(PIL_SEGS, T);
  const lost = toolsR2('drone', T).drone === 'lost';
  // flying: the controller up, thumbs working; tense on the dart, the second dive and the hunt
  const tense = Math.max(win(T, 117.6, 119.9, 0.25, 0.5), win(T, 123.0, 123.85, 0.15, 0.3), win(T, 140.4, 141.5, 0.15, 0.3));
  let pose: Pose = layer(BRACED({fists: false}), {
    drop: 12 + 16 * tense, lean: 8 + 12 * tense,
    armL: {local: {r: -22, u: 245 + 20 * tense, f: 92 + 30 * tense}}, armR: {local: {r: 22, u: 245 + 20 * tense, f: 92 + 30 * tense}},
  });
  const stare = win(T, 142.0, 143.4, 0.3, 0.4);
  // the blast: down onto her knees, the controller held in to her chest
  const kd = win(T, 145.5, 146.65, 0.15, 0.25);
  if (kd > 0) pose = blendPose(pose, layer(KNEEL('L'), {drop: 88, lean: 30, armL: {local: {r: -14, u: 250, f: 50}}, armR: {local: {r: 14, u: 250, f: 50}}, head: {pitch: 26}}), kd);
  kneelFeet(b, 'L', kd);
  const L = lookBy(pose, b, PIL_LOOK, T, 1, 85);
  pose = L.pose;
  if (stare > 0) { const h = pose.head ?? {}; pose = {...pose, head: {yaw: lerp(h.yaw ?? 0, -4, stare), pitch: lerp(h.pitch ?? 0, 34, stare), roll: h.roll}}; }
  pose = flinch(T, EV3.land, 0.5, 0.8)(pose);
  const lt = stare > 0.5 ? null : L.gaze ?? null;
  const runArms: Pose = {armL: {local: {r: -20, u: 236, f: 84}}, armR: {local: {r: 20, u: 236, f: 84}}};
  const final = withRun(b, withFace(pose, faceKeys(T, PIL_FACE)), runArms);
  const spec = base('drone', 'd3pil', 5, b, T, {...final, handL: 'grip', handR: 'grip', twoHanded: true, extra: controller({lit: lost ? 0 : 1})}, {}, true, lt ?? (stare > 0.5 ? fromLoc(b, {r: 0, u: 250, f: 60}) : undefined));
  return {spec, body: b};
};

// ================================================================== THE FLARE CARRIER (host)
const F0 = {x: 47.9, z: -3.1};
const FLR_RUN: XZ[] = [{x: F0.x - 0.05, z: F0.z + 0.05}, {x: 46.6, z: -1.0}, {x: 45.0, z: 2.0}, {x: GRP.flares.x, z: GRP.flares.z}];
const FLR_THROWN = {from: {x: 41.9, z: 5.8}, to: {x: 41.15, z: 6.35}};
const FLR_BACK2: XZ[] = [{x: FLR_THROWN.to.x, z: FLR_THROWN.to.z}, {x: 38.6, z: 7.0}, {x: 36.2, z: 7.9}, {x: D4S('flares').pos.x, z: D4S('flares').pos.z}];
const FLR_UP = 147.1;
const FLR_SEGS: Seg[] = smoothSegs([
  {kind: 'stand', stag: 0.12, root: [[M.P3, F0.x, F0.z, 95], [117.5, F0.x, F0.z, 95], [117.8, F0.x, F0.z, 82], [127.7, F0.x, F0.z, 82], [127.85, F0.x - 0.05, F0.z + 0.05, headingTo(FLR_RUN[0], FLR_RUN[1])]]},
  {kind: 'run', path: FLR_RUN, T0: 127.9, T1: 130.6, gait: GAITS.jog, A: 0.4, D: 0.6},
  {kind: 'stand', stag: 0.12, root: [[130.6, GRP.flares.x, GRP.flares.z, runEnd(FLR_RUN).h], [131.1, GRP.flares.x, GRP.flares.z, GRP.flares.h], [EV3.fallBack + 0.05, GRP.flares.x, GRP.flares.z, GRP.flares.h], [EV3.fallBack + 0.2, GRP.flares.x, GRP.flares.z, headingTo(BACK.flares[0], BACK.flares[1])]]},
  {kind: 'run', path: BACK.flares.slice(0, 2), T0: EV3.fallBack + 0.22, T1: THROW_T, gait: GAITS.run, A: 0.35, D: 0},
  {kind: 'fn', T0: THROW_T, at: (T) => flaresThrownBody(T)},
  {kind: 'stand', stag: 0.12, root: [[FLR_UP + 0.55, FLR_THROWN.to.x, FLR_THROWN.to.z, 250], [FLR_UP + 0.65, FLR_THROWN.to.x, FLR_THROWN.to.z, headingTo(FLR_BACK2[0], FLR_BACK2[1])]]},
  {kind: 'run', path: FLR_BACK2, T0: FLR_UP + 0.7, T1: 149.4, gait: GAITS.run, A: 0.35, D: 0.6},
  {kind: 'stand', stag: 0.12, root: [[149.4, D4S('flares').pos.x, D4S('flares').pos.z, runEnd(FLR_BACK2).h], [149.8, D4S('flares').pos.x, D4S('flares').pos.z, D4S('flares').heading]]},
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
const FLR_FACE: [number, Face][] = [
  [M.P3, E.pant], [117.2, E.resolve], [EV3.flareDraw, E.focus], [EV3.flareStrike, E.effort], [EV3.flareRel - 0.3, E.effort], [EV3.flash, E.recog], [119.9, E.focus],
  [EV3.land, E.shock], [126.9, E.grin], [128.0, E.focus], [EV3.lock + 0.3, E.alert], [131.5, E.focus], [EV3.smash, E.shock], [137.0, E.focus], [EV3.kill, E.worried], [142.6, E.fear],
  [EV3.fallBack, E.effort], [THROW_T, E.pain], [146.3, expr('pain', 1, {squint: 1})], [FLR_UP, E.dazed], [FLR_UP + 0.35, E.pain], [FLR_UP + 0.6, E.effort],
];
const FLR_LOOK: LK[] = [[M.P3, at3(50.25, -7.7, 1.6)], [EV3.flareDraw, null], [118.3, H1_EYE], [119.9, H1_HULL], [125.0, WRECK_C], [127.9, null], [130.6, at3(55.5, -0.5, 2.0)], [136.4, H2_EYE], [EV3.fallBack, null]];
export const flaresAt = (T: number): CrewOut => {
  const b = bodyAt3(FLR_SEGS, T);
  let pose: Pose = layer(BRACED({wide: 0.75, fists: false}), {});
  // the draw from the bag at his left hip (cross draw), the strike (both hands at the cap), the throw
  const draw = win(T, EV3.flareDraw - 0.05, EV3.flareDraw + 0.35, 0.08, 0.15);
  if (draw > 0) pose = blendPose(pose, layer(pose, {armR: {local: {r: -18, u: 150, f: 34}}, head: {pitch: 16}}), draw);
  const strike = win(T, 117.9, EV3.flareStrike + 0.2, 0.15, 0.12);
  if (strike > 0) pose = blendPose(pose, layer(pose, {armR: {local: {r: 20, u: 250, f: 110}}, armL: {local: {r: 0, u: 262 + 18 * win(T, 118.05, EV3.flareStrike + 0.02, 0.06, 0.02), f: 124}}, handL: 'fist', head: {pitch: 12}}), strike);
  const tw = win(T, EV3.flareRel - 0.45, EV3.flareRel + 0.5, 0.08, 0.2);
  if (tw > 0) pose = blendPose(pose, throwPose(throwK(T, EV3.flareRel)), tw);
  // the blast: a chunk catches his brow: he goes down onto his hands and knees, a hand to the cut, up again
  let down = false;
  if (T >= THROW_T && T < FLR_UP + 0.55) {
    down = true;
    const u = (T - THROW_T) / (FLR_UP + 0.55 - THROW_T);
    pose = keyPose([
      [0, layer(STAND, {drop: 22, lean: 14})],
      [0.12, {drop: 30, lean: -18, twist: 20, head: {pitch: -26, yaw: 20}, armL: {fk: {fwd: 60, out: 40, bend: 30}}, armR: {fk: {fwd: 80, out: 30, bend: 70}}, handR: 'open'}],
      [0.3, {drop: 110, lean: 50, bodyPitch: 30, legL: {fk: {fwd: 70, knee: 100}}, legR: {fk: {fwd: 60, knee: 100}}, armL: {fk: {fwd: 70, out: 20, bend: 10}}, armR: {fk: {fwd: 70, out: 20, bend: 10}}, handL: 'brace', handR: 'brace', head: {pitch: 20}}],
      [0.7, {drop: 108, lean: 46, bodyPitch: 26, legL: {fk: {fwd: 70, knee: 100}}, legR: {fk: {fwd: 60, knee: 100}}, armL: {fk: {fwd: 70, out: 20, bend: 10}}, armR: {fk: {fwd: 120, out: 20, bend: 120}}, handL: 'brace', handR: 'open', head: {pitch: -14, yaw: 6}}],
      [0.86, layer(KNEEL('L'), {drop: 74, lean: 20})],
      [1, layer(BRACED({wide: 0.7, fists: false}), {drop: 24, lean: 12})],
    ], u);
  }
  const L = lookBy(pose, b, FLR_LOOK, T, down ? 0 : 0.9);
  pose = flinch(T, EV3.land, 0.5, 0.8)(L.pose);
  const lt = L.gaze;
  const runArms: Pose = {armL: b.gait?.armL, armR: b.gait?.armR};
  const final = down ? withFace(pose, faceKeys(T, FLR_FACE)) : withRun(b, withFace(pose, faceKeys(T, FLR_FACE)), runArms);
  const holding = T > EV3.flareDraw + 0.15 && T < EV3.flareRel;
  const lit = T > EV3.flareStrike ? 1 : 0;
  const spec = base('flares', 'd3flr', 9, b, T, {...final, handR: holding ? 'grip' : final.handR ?? 'open', holdR: holding ? flareHold({lit, t: T}) : undefined}, {}, !down, down ? undefined : lt ?? undefined);
  return {spec, body: b, pts: {hand: fromLoc(b, {r: 14, u: 330, f: 150})}};
};
/** the flare leaves his hand here (the THROW release) */
export const flareFrom = (): V3 => flaresAt(EV3.flareRel).pts!.hand;

// ================================================================== THE DECOY MAKER (clerkB)
const B0 = {x: 46.9, z: -3.8};
const DEC_RUN: XZ[] = [{x: B0.x - 0.05, z: B0.z + 0.05}, {x: 46.35, z: -2.2}, {x: DEC_SPOT.x, z: DEC_SPOT.z}];
/** after the smash she reels back and sinks to her knees here, on the crest */
export const DEC_KNEEL = {x: DEC_SPOT.x - 0.4, z: DEC_SPOT.z - 0.1, h: DEC_SPOT.h + 12};
/** pulled up and away west by the Director; thrown onto her hands and knees by the blast */
const DEC_HAUL: XZ[] = [{x: DEC_KNEEL.x - 0.15, z: DEC_KNEEL.z + 0.02}, {x: 44.6, z: -0.6}, {x: 43.55, z: -0.4}];
const DEC_THROWN = {from: DEC_HAUL[2], to: {x: 42.85, z: -0.15}};
const DEC_BACK2: XZ[] = [{x: DEC_THROWN.to.x + 0.25, z: DEC_THROWN.to.z}, {x: 41.2, z: 1.3}, {x: 38.8, z: 1.9}, {x: 35.0, z: 2.0}, {x: D4S('decoy').pos.x, z: D4S('decoy').pos.z}];
const DEC_UP = 145.95, DEC_RISE = 0.75;
const DEC_SEGS: Seg[] = smoothSegs([
  {kind: 'stand', stag: 0.06, root: [[M.P3, B0.x, B0.z, 80], [127.4, B0.x, B0.z, 80], [127.55, B0.x - 0.05, B0.z + 0.05, headingTo(DEC_RUN[0], DEC_RUN[1])]]},
  {kind: 'run', path: DEC_RUN, T0: 127.6, T1: 129.5, gait: GAITS.walk, A: 0.4, D: 0.5},
  {kind: 'stand', stag: 0.06, root: [[129.5, DEC_SPOT.x, DEC_SPOT.z, runEnd(DEC_RUN).h], [130.0, DEC_SPOT.x, DEC_SPOT.z, DEC_SPOT.h], [EV3.smash, DEC_SPOT.x, DEC_SPOT.z, DEC_SPOT.h],
    // the smash: she reels back from it; down onto her knees on the crest
    [EV3.smash + 0.35, DEC_KNEEL.x, DEC_KNEEL.z, DEC_SPOT.h + 22], [137.4, DEC_KNEEL.x, DEC_KNEEL.z, DEC_KNEEL.h], [EV3.grab + 0.05, DEC_KNEEL.x, DEC_KNEEL.z, DEC_KNEEL.h],
    // the Director's pull: up and round (she turns west to run)
    [EV3.decUp, DEC_KNEEL.x - 0.15, DEC_KNEEL.z + 0.02, 250]]},
  {kind: 'run', path: DEC_HAUL, T0: EV3.decUp + 0.02, T1: THROW_T, gait: GAITS.dash, A: 0.3, D: 0},
  {kind: 'fn', T0: THROW_T, at: (T) => decoyThrownBody(T)},
  {kind: 'stand', stag: 0.06, root: [[DEC_UP + DEC_RISE, DEC_THROWN.to.x + 0.25, DEC_THROWN.to.z, 268], [DEC_UP + DEC_RISE + 0.08, DEC_THROWN.to.x + 0.25, DEC_THROWN.to.z, headingTo(DEC_BACK2[0], DEC_BACK2[1])]]},
  {kind: 'run', path: DEC_BACK2, T0: DEC_UP + DEC_RISE + 0.1, T1: 149.3, gait: GAITS.sprint, A: 0.35, D: 0.6},
  {kind: 'stand', stag: 0.06, root: [[149.3, D4S('decoy').pos.x, D4S('decoy').pos.z, runEnd(DEC_BACK2).h], [149.75, D4S('decoy').pos.x, D4S('decoy').pos.z, D4S('decoy').heading]]},
]);
/** thrown forward onto her hands and knees (not flat): a scramble, up again */
const decoyThrownBody = (T: number) => {
  const u = clamp((T - THROW_T) / 0.45), e = 1 - (1 - u) * (1 - u);
  const upk = T > DEC_UP ? smooth((T - DEC_UP) / DEC_RISE) : 0;
  const x = lerp(DEC_THROWN.from.x, DEC_THROWN.to.x, e) + 0.25 * upk, z = lerp(DEC_THROWN.from.z, DEC_THROWN.to.z, e);
  const h = 268, pos = ON({x, z});
  return {pos, heading: h, ...riseFeet({pos, heading: h}, RISE_FEET_T + clamp((T - DEC_UP) / DEC_RISE) * (7.2 - RISE_FEET_T))};
};
const DEC_FACE: [number, Face][] = [
  [M.P3, E.pant], [117.3, E.worried], [EV3.flash, E.alert], [120.0, E.worried], [EV3.land, E.shock], [126.8, E.relief], [128.0, E.focus], [129.6, E.focus],
  [EV3.tap, E.resolve], [135.95, E.real], [136.15, E.shock], [EV3.smash, E.pain], [137.0, expr('pain', 1, {squint: 1})], [137.6, E.grief], [139.0, E.dazed],
  [143.55, E.real], [143.8, E.fear], [EV3.grab, E.shock], [EV3.decUp, E.fear], [THROW_T, E.pain], [146.2, E.fear], [146.75, E.effort],
];
const DEC_LOOK: LK[] = [[M.P3, H1_EYE], [119.9, (T) => H1_HULL(Math.min(T, 126.4))], [127.4, null], [135.0, at3(56.5, -0.5, 3.2)], [135.95, at3(47.6, 3.2, 1.0)], [EV3.smash, null],
  [143.5, H2_POD], [EV3.grab, at3(42, 0, 1.3)], [THROW_T, null]];
export const decoyAt = (T: number): CrewOut => {
  const b = bodyAt3(DEC_SEGS, T);
  const smashed = toolsR2('decoy', T).tablet === 'smashed';
  let pose: Pose = layer(BRACED({wide: 0.6, fists: false}), {drop: 10, lean: 6, armL: {local: {r: -28, u: 215, f: 92}, pole: {r: -1, u: -0.7, f: 0}, palm: {r: 0.4, u: 0.3, f: -1}}, handR: 'open'});
  // working the tablet (ADAPT sees it glow): head down, the right finger on the glass; the sketch, the tap
  const work = win(T, 129.6, EV3.projOn + 0.3, 0.3, 0.25);
  let world: FigSpec['world'] = {};
  if (work > 0) pose = blendPose(pose, layer(pose, {drop: 14, lean: 10, armL: {local: {r: -30, u: 228, f: 100}, pole: {r: -1, u: -0.7, f: 0}, palm: {r: 0.4, u: 0.3, f: -1}}, armR: {local: {r: 2 + 8 * Math.sin(T * 6), u: 236 + 6 * Math.sin(T * 8.3), f: 112}, palm: {r: -0.3, u: -0.4, f: -1}}, handR: 'point', head: {pitch: 28, yaw: -4}, face: {lookY: 0.8}}), work);
  // then the tablet raised toward the dust (the projector's beam), watching the light; the diver comes
  const raise = win(T, EV3.projOn - 0.05, EV3.smash + 0.1, 0.25, 0.1);
  if (raise > 0) {
    const hold = {x: SMASH_AT.x - 0.06, y: SMASH_AT.y - 0.06, z: SMASH_AT.z - 0.02};
    world = {handL: lerp3v(fromLoc(b, {r: -28, u: 215, f: 92}), hold, raise)};
    pose = blendPose(pose, layer(pose, {drop: 8, lean: 4, armR: {local: {r: 30, u: 220, f: 60}}, handR: 'open'}), raise);
  }
  // the smash: thrown back from it; the cut right hand clutched to her chest; the dead tablet still in her left
  const reel = win(T, EV3.smash, 137.6, 0.1, 0.5);
  if (reel > 0) pose = blendPose(pose, layer(pose, {drop: 30, lean: -16, twist: 18, armR: {local: {r: -6, u: 300, f: 46}}, armL: {local: {r: -40, u: 190, f: 60}}, handR: 'fist', head: {pitch: 20, yaw: 10}}), reel);
  // on her knees on the crest, the cut hand held in the other, head down over it; she looks up as the ground shakes
  const kn = win(T, 137.2, EV3.decUp + 0.1, 0.45, 0.25);
  if (kn > 0) pose = blendPose(pose, layer(KNEEL('R'), {drop: 84, lean: 22, armR: {local: {r: -10, u: 200, f: 70}}, armL: {local: {r: -30, u: 180, f: 64}}, handR: 'fist', head: {pitch: 26 - 40 * win(T, 143.5, EV3.decUp, 0.25, 0.1)}, breath: 0.9}), kn);
  // pulled up by the arm (the Director's hand on her left arm: battle.tsx)
  const pulled = win(T, EV3.grab, THROW_T, 0.1, 0.02);
  if (pulled > 0) pose = blendPose(pose, layer(pose, {lean: 20, armL: {local: {r: -70, u: 260, f: -10}}}), pulled * 0.6);
  // the blast: forward onto her hands and knees; up (the rise, quick)
  let down = false;
  if (T >= THROW_T && T < DEC_UP + DEC_RISE) {
    down = true;
    const u = clamp((T - THROW_T) / 0.4);
    const K2 = RISE_KEYS[2][1];
    const fallP: Pose = keyPose([[0, layer(STAND, {drop: 20, lean: 18})], [0.4, {drop: 60, lean: 50, bodyPitch: 30, armL: {fk: {fwd: 90, out: 20, bend: 20}}, armR: {fk: {fwd: 90, out: 20, bend: 20}}, handL: 'open', handR: 'open'}], [1, K2]], u);
    pose = T < DEC_UP ? (u < 1 ? fallP : layer(K2, {head: {pitch: lerp(-24, K2.head?.pitch ?? -18, ramp(T, DEC_UP - 0.3, DEC_UP))}})) : risePose(RISE_FEET_T + ((T - DEC_UP) / DEC_RISE) * (7.2 - RISE_FEET_T));
  }
  const kneelK = win(T, 137.2, EV3.decUp + 0.1, 0.45, 0.25);
  kneelFeet(b, 'R', kneelK);
  const L = lookBy(pose, b, DEC_LOOK, T, down ? 0 : 0.9 * (1 - work));
  pose = flinch(T, EV3.land, 0.5, 0.8)(L.pose);
  const lt = L.gaze;
  const runArms: Pose = {armL: {local: {r: -26, u: 232, f: 70}}, armR: b.gait?.armR};
  const final = down ? withFace(pose, faceKeys(T, DEC_FACE)) : withRun(b, withFace(pose, faceKeys(T, DEC_FACE)), runArms);
  const sketch = clamp((T - EV3.sketch) / (EV3.tap - EV3.sketch));
  const glow = T > 129.6 && T < EV3.smash ? 0.35 + 0.4 * win(T, EV3.tap, EV3.tap + 0.4, 0.05, 0.3) : 0;
  const spec = base('decoy', 'd3dec', 6, b, T, {...final, handL: 'grip', holdL: tablet({screen: true, sketch: T < EV3.sketch ? 0 : T > EV3.tap ? 1 : sketch, figures: 4, glow, smashed})}, world, !down || T >= DEC_UP, down ? undefined : lt ?? undefined);
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
/** getting up: the moment a body leaves its 'down' pose (fk legs) for its feet (world footholds) — over 0.22 s the
 *  pose blends from the last down frame and the feet from where its ankles were */
const RISE: Partial<Record<Role2, number[]>> = {director: [DIR_FEET, DIR_UP + 1.0], runner: [RUN_DOWN.t1], tether: [EV3.tUp + 0.3, EV3.tRun], flares: [FLR_UP + 0.55], decoy: [DEC_UP, DEC_UP + DEC_RISE]};
const RISE_W = 0.22;
/** going down (thrown by the blast, the cable cut): over 0.12 s the pose blends from the last standing frame and the
 *  feet leave their footholds for where the falling pose puts its ankles — a hard, fast move, not a one-frame jump */
const FALL: Partial<Record<Role2, number>> = {director: THROW_T, runner: THROW_T, flares: THROW_T, decoy: THROW_T, tether: EV3.cut};
const FALL_W = 0.12;
const fallFix = (role: Role2, T: number, o: CrewOut): CrewOut => {
  const F = FALL[role];
  if (F === undefined || T < F || T >= F + FALL_W) return o;
  const s0 = rawAt(role, F - 1e-3).spec, p0 = s0.pose, p1 = o.spec.pose;
  if (!p0 || !p1 || typeof p0 === 'function' || typeof p1 === 'function' || !s0.world?.footL || !s0.world?.footR) return o;
  const w = smooth((T - F) / FALL_W);
  const r1 = figureRig(SOLVE_VIEW, o.spec);
  const ank = (i: 0 | 1): V3 => { const a = r1.W(r1.rig.ankle[i]); return {x: a.x, y: Math.max(G(a.x, a.z) + FOOT_UP, a.y), z: a.z}; };
  const wf = o.spec.world ?? {};
  return {...o, spec: {...o.spec, pose: blendPose(p0, p1, w), world: {...wf, footL: mixFoot(s0.world.footL, wf.footL ?? ank(0), w), footR: mixFoot(s0.world.footR, wf.footR ?? ank(1), w)}}};
};
const riseFix = (role: Role2, T: number, o: CrewOut): CrewOut => {
  const R = RISE[role]?.find((r) => T >= r && T < r + RISE_W);
  if (R === undefined) return o;
  const s0 = rawAt(role, R - 1e-3).spec, p0 = s0.pose, p1 = o.spec.pose;
  if (!p0 || !p1 || typeof p0 === 'function' || typeof p1 === 'function') return o;
  const w = smooth((T - R) / RISE_W);
  const r0 = figureRig(SOLVE_VIEW, s0);
  // (from where the ankle was shown: kept on the ground by groundFeet)
  const ank = (i: 0 | 1): V3 => { const a = r0.W(r0.rig.ankle[i]); return {x: a.x, y: Math.max(G(a.x, a.z) + FOOT_UP, a.y), z: a.z}; };
  const wf = o.spec.world ?? {};
  return {...o, spec: {...o.spec, pose: blendPose(p0, p1, w), world: {...wf, ...(wf.footL ? {footL: mixFoot(ank(0), wf.footL, w)} : {}), ...(wf.footR ? {footR: mixFoot(ank(1), wf.footR, w)} : {})}}};
};
/**
 * The rig drops the pelvis whenever a planted foot is out of the leg's reach (a long stride, a foot downhill) — per
 * frame, so on a fast run or a slope the body pops down and up. Here the same drop is taken ahead of time and smoothed
 * (a moving max over ±0.2 s, then a moving mean over ±0.1 s), so the rig's own correction stays ≈0.
 */
const NEED = new Map<string, number>();
const FPS = 30;
const needRaw = (role: Role2, j: number): number => {
  const key = `${role}@${j}`;
  let v = NEED.get(key);
  if (v === undefined) {
    if (NEED.size > 6000) NEED.clear();
    const T = j / FPS, sp = riseFix(role, T, fallFix(role, T, rawAt(role, T))).spec;
    const base0 = (typeof sp.pose === 'function' ? sp.pose(figFrame(SOLVE_VIEW, sp.pos, sp.heading, sp.anchor)) : sp.pose)?.drop ?? 0;
    v = Math.max(0, (figProps(SOLVE_VIEW, sp).props.drop ?? 0) - base0);
    NEED.set(key, v);
  }
  return v;
};
const needSmooth = (role: Role2, T: number): number => {
  const j0 = Math.round(T * FPS);
  const mx = (j: number) => { let m = 0; for (let d = -6; d <= 6; d++) m = Math.max(m, needRaw(role, j + d)); return m; };
  let sum = 0;
  for (let d = -3; d <= 3; d++) sum += mx(j0 + d);
  return sum / 7;
};
const needFix = (role: Role2, T: number, o: CrewOut): CrewOut => {
  const n = needSmooth(role, T);
  if (n < 0.5) return o;
  const p = o.spec.pose;
  const pose = typeof p === 'function' ? (F: Parameters<typeof p>[0]) => { const q = p(F); return {...q, drop: (q.drop ?? 0) + n}; } : {...(p ?? {}), drop: (p?.drop ?? 0) + n};
  return {...o, spec: {...o.spec, pose}};
};
/** a foot posed by the legs alone (down, kneeling, getting up) never goes under the ground: an ankle below it is held on
 *  it (a world foothold where it would have been; continuous where it reaches the ground) */
const FOOT_UP = 0.02;
const groundFeet = (o: CrewOut): CrewOut => {
  const w = o.spec.world ?? {};
  if (w.footL && w.footR) return o;
  const R = figureRig(SOLVE_VIEW, o.spec);
  const fix: {footL?: V3; footR?: V3} = {};
  ([['footL', 0], ['footR', 1]] as const).forEach(([k, i]) => {
    if (w[k]) return;
    const a = R.W(R.rig.ankle[i]), g = G(a.x, a.z) + FOOT_UP;
    if (a.y < g) fix[k] = {x: a.x, y: g, z: a.z};
  });
  return fix.footL || fix.footR ? {...o, spec: {...o.spec, world: {...w, ...fix}}} : o;
};
const CREW_CACHE = new Map<string, CrewOut>();
/**
 * The Crew at T: D2's own spec blended out over the first 0.45 s (the cut from D2-7 is exact), D4's own spec blended in
 * over the last 0.55 s (the cut into D4-1a is exact).
 */
export const crewAt = (role: Role2, T: number): CrewOut => {
  const ck = `${role}@${T}`;
  const c = CREW_CACHE.get(ck);
  if (c) return c;
  if (CREW_CACHE.size > 400) CREW_CACHE.clear();
  const r = crewAt0(role, T);
  CREW_CACHE.set(ck, r);
  return r;
};
const crewAt0 = (role: Role2, T: number): CrewOut => {
  const o = groundFeet(needFix(role, T, riseFix(role, T, fallFix(role, T, rawAt(role, T)))));
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
import {runDist, runSpeed} from '../D4/motion';
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
/** the Director's run and grab marks (for contacts) */
export const DIR_MARKS = {grab: DIR_GRAB, bash: U8_BASH};
void [DIR_FACE_H, plateOf, BLAST_AT, lerp3v];
