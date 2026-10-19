// Combat unit: a 2.2 m armoured humanoid with one sensor eye. Articulated rigid parts posed by functions of time.
//
// LAYERS (all pure functions of the spec at sp.t; every t0 in film seconds):
//   locomotion  march (gait: path/dist, planted feet) OR, standing, a root track with PLANTED STEPS built from turns,
//               moves (reposition / retreat-to-regroup), press (stepping pursuit), dodge steps, brace stance, shove
//               and strike lunges. Explicit `feet` still override.
//   body        hit stagger (anticipation-free reaction, smooth ease-out), strikes and combos driven through the hips,
//               dodge (lean / duck / step), brace + shove-back, catch + wrench, parry/block absorb, restraint reach,
//               postures (idle / guard / ready / lowered), dent.
//   head        attend (snap to a moving point) > threat lock (parry / catch / block) > scan (sweeps with pauses) >
//               look > idle noise.
//   arms        posture rest → raise → block (old) → grab → restrain → catch → parry (forearm in the incoming path)
//               → shove / brace cover → strikes (wind → blow → through → recover; a combo re-chambers).
//   world       falls (knees give → topple → settle, limp arms laid on the ground), torn plates / limbs as gravity-true
//               debris (fly, bounce, tip onto a face, stay), stumps, cables, leaks, pools.
// R4: stagger (loss of balance with recovery steps), sway (seeded standing micro-motion), fall.lift (ground contact), bones keep
// their length through a fall, mid LOD = the same anatomy as full, far LOD drawn from the solved skeleton (kit.farFigure).
// unitAttach(sp) → world points (after falls); unitImpacts(sp) → every contact / failure / landing as events.
import React from 'react';
import {V3, add3, sub3, mul3, dot3, cross3, norm3, len3, lerp, lerp3, clamp, smooth, easeIn, easeOut, easeIn2, easeOut2, rnd, noise, seg, f2} from '../../kit/math';
import {Item, MeshItem, Prepped, shade, inkColor, lightAt} from '../engine';
import {UNIT, UNIT_MID, U, DEBRIS} from './parts';
import {R3, Pose3, rotHeading, rcomp, euler, segFrame, ik2, apply, rmul, rotAxisM, I3, lookFrame, fwdOf, slerpish} from './mat3';
import {Ground, FLAT, Path, footAt, partItem, eyeGlow, spray, cable, fluidPool, CABLES, farFigure, FarPrim, meshTone, meshPrim, boxPts} from './kit';
import {Body, bodyOf, debrisPose, debrisLanding, tearLaunch, Launch} from './debris';

export type Side = 'L' | 'R';
export type ImpactKind = 'plate' | 'limb' | 'cable' | 'fluid' | 'ground' | 'blow' | 'eye' | 'parry' | 'block' | 'catch' | 'shove' | 'step' | 'debris';
export type Impact = {t: number; pos: V3; dir: V3; strength: number; kind: ImpactKind; side?: Side; note?: string};
/** a world point, fixed or moving (a function of film time) */
export type Pt = V3 | ((t: number) => V3);
export const ptAt = (p: Pt, t: number): V3 => (typeof p === 'function' ? p(t) : p);

export type ArmCtl = {hand?: V3; pole?: V3; open?: boolean};
type Tear = {t0: number; dir: V3; speed?: number};
export type UnitDamage = {
  /** chest plate torn off forward-ish along dir (pivots off its lower edge, falls, settles on a face and stays) */
  chest?: Tear;
  /** back plate pried off */
  back?: Tear;
  pauldronL?: Tear;
  pauldronR?: Tear;
  /** an arm torn off at the shoulder (or the forearm at the elbow): the joint gives first (the limb swings on its
   *  cables for `hang` s, default 0.1), then it drops/flies and lands */
  armOff?: {side: Side; t0: number; dir: V3; at?: 'shoulder' | 'elbow'; speed?: number; hang?: number};
  /** permanent dent: torso knocked askew from this time (deg; eased in over 0.12 s) */
  dent?: {t0: number; deg: number};
  /** dark fluid leaking from the torso after t0 (pool when down) */
  leak?: {t0: number};
  /** the eye goes dark at t0 (destroyed / switched off) */
  dead?: {t0: number};
};

// ------------------------------------------------------------------ exchange vocabulary (all optional)
/** A strike. Contact at t0: wind-up −0.42…−0.13, blow −0.13…0 (four frames), follow-through 0…0.22, recover 0.22…0.85. Driven
 *  through the hips (pelvis turns and shifts toward the target). `step` (m): a planted lunge toward the target (the
 *  unit stays where it lands). A second strike on the same side within ~1.2 s re-chambers from the follow-through. */
export type StrikeSpec = {t0: number; side: Side; target: V3; kind?: 'punch' | 'hammer' | 'hook'; step?: number; drive?: number};
/** Defend with the forearm IN THE INCOMING PATH. t0 = contact; `at` = the incoming tip / fist at contact (or its
 *  trajectory: the kit reads its travel direction near t0); the forearm meets it there. Read −0.45 (head locks),
 *  anticipation −0.32…−0.18, travel −0.18…−0.02, contact (absorb along the incoming direction), then 'parry' deflects
 *  the weapon outward and releases at t1 (default +0.2) while 'block' holds the pressure until t1 (default +0.45);
 *  recovery 0.45 s. `across` overrides the forearm's direction; `force` scales the give (default 1). */
export type ParrySpec = {t0: number; side: Side; at: Pt; dir?: V3; across?: V3; t1?: number; kind?: 'parry' | 'block'; force?: number};
/** Get the body clear of something passing at t0 (moving along / toward `dir`: the dodge direction). Counter-move
 *  −0.36…−0.26, move −0.26…−0.06 (clear before t0), hold to +0.12, then 'lean' / 'duck' recover over 0.45 s (feet
 *  planted); 'step' moves the root `amount`·0.5 m with planted steps and stays (`back`: time it steps back). */
export type DodgeSpec = {t0: number; dir: V3; kind?: 'lean' | 'step' | 'duck'; amount?: number; back?: number};
/** Catch an incoming tool / arm: the open hand(s) meet `at` at t0 (anticipation −0.34, travel −0.2…0), close, absorb
 *  along the incoming direction, then hold (follow `hold(t)` if given, e.g. the caught wrist), `wrench` it (a pull
 *  along dir driven through the hips), release at t1. Attach the caught thing to unitAttach().catchL/R. */
export type CatchSpec = {t0: number; side: Side | 'both'; at: Pt; dir?: V3; hold?: (t: number) => V3; t1?: number; wrench?: {t0: number; dir: V3; dist?: number; deg?: number}};
/** Brace for a hit arriving at t0 travelling along `dir`: turn into it, rear foot steps back (planted), stance lowers,
 *  forearms cover, lean into it; contact absorbed; then shove back at `shove` (default t0 + 0.4; false = hold). */
export type BraceSpec = {t0: number; dir: V3; t1?: number; shove?: number | false; step?: boolean; force?: number};
/** Two-palm shove into `target` (contact at t0): chamber −0.34…−0.16, drive −0.16…0, push-through 0…+0.2 driven by
 *  the hips with a planted step (`step` m, default 0.25), hold to t1 (default +0.22), recover 0.5 s. */
export type ShoveSpec = {t0: number; target: Pt; side?: Side | 'both'; t1?: number; step?: number};
/** Stepping pursuit: from t0 to t1 the unit follows `target` (a displaced opponent), keeping `reach` m (default 0.95),
 *  `lag` s behind it (default 0.18), one step-drag surge per `beat` s (default 0.34), guard up, facing it. */
export type PressSpec = {t0: number; t1: number; target: Pt; reach?: number; lag?: number; beat?: number; guard?: boolean};
/**
 * (R4) Loss of balance. Shoved along `dir` at t0 the unit does not stand and lean (a `hit` keeps the feet where they were): it is
 * carried that way, hinges back, throws its arms out, its head snaps, and it takes `steps` (default 2, 1..5) quick planted
 * recovery steps — each one lands under the sliding pelvis, ~0.3·`strength` m long, getting shorter — then straightens
 * and gets its guard back (0.4 s). The footfalls are events (unitImpacts kind 'step'); the unit ends where the last step
 * lands (unitRoot). Chain a `fall` after it for a stumble that goes down; pair it with `hits` only for a harder blow.
 */
export type StaggerSpec = {t0: number; dir: V3; steps?: number; strength?: number; arms?: boolean};
/** seconds per recovery step of a stagger */
const STAG_STEP = 0.24;
const staggerDur = (s: StaggerSpec) => 0.06 + STAG_STEP * clamp(Math.round(s.steps ?? 2), 1, 5);
/** Turn to a new heading (deg) or toward a point with planted pivot steps; head leads, torso follows, then pelvis. */
export type TurnSpec = {t0: number; to: number | V3; dur?: number};
/** Reposition with planted steps (step into a blocking position; retreat-to-regroup: give `face` = the threat so it
 *  backs away keeping guard). `shuffle`: step-drag instead of alternating steps. */
export type MoveSpec = {t0: number; t1: number; to: V3; heading?: number; face?: V3; shuffle?: boolean; guard?: boolean};
/** Arm/stance posture: 'guard' (fists up), 'ready' (weapon-lowered but ready: forearms forward, low), 'lowered'
 *  (relaxed sentinel), 'idle'. Keyed [[t, posture], …] blends over 0.45 s from each key. */
export type Posture = 'idle' | 'guard' | 'ready' | 'lowered';
/** Head / eye sweeps with pauses: fixations within ±span/2 (deg, default 70) of `center` (a point or a heading;
 *  default the body's heading), dwelling ~`dwell` s (default 1.0, seeded), quick saccades; the torso follows a little. */
export type ScanSpec = {t0: number; t1?: number; center?: V3 | number; span?: number; dwell?: number; seed?: number; torso?: number};
/** Redirect attention at t0 to a (moving) point: the head snaps to it and tracks, the torso follows; `turn` (default:
 *  when it is more than 75° off the body's heading) turns the body with planted steps. Later entries win. */
export type AttendSpec = {t0: number; at: Pt; t1?: number; turn?: boolean};
/** Controlled restraint: reach (0.45 s) and grip the person's body point `at` (moving: the grip tracks it; `at2` for
 *  the second hand), hold, lower the body to reach it, release at t1. `press` 0..1 bears down. */
export type RestrainSpec = {t0: number; side: Side | 'both'; at: Pt; at2?: Pt; t1?: number; press?: number};

export type UnitSpec = {
  id: number;
  t: number;
  pos: V3;
  heading: number;
  /** march: pelvis follows path(dist); feet planted. stride = cycle length (m). `over`: low obstacles the swinging feet
   *  lift over (and the pelvis rises over) — a wreck stepped over instead of walked through */
  gait?: {path: Path; dist: number; stride?: number; lift?: number; /** path distance where walking starts / stops: feet blend from/to a standing stance over 0.6 m (no pops) */ start?: number; end?: number; over?: {x: number; z: number; r: number; h: number}[];
    /** (opt-in) a swing over `over` obstacles goes from the take-off's to the landing's height on top (no drop off the arc onto a
     *  top it lands on) and its clearance comes down over the swing's last third (not its last eighth: no one-frame drop); a
     *  foot planted anywhere over an obstacle stands on it (not only well inside it) */
    overSoft?: boolean};
  /** extra crouch (m) */
  crouch?: number;
  lean?: number; // deg forward
  twist?: number; // deg (+ = turn left)
  /** head look target (world) */
  look?: V3;
  armL?: ArmCtl;
  armR?: ArmCtl;
  strike?: StrikeSpec;
  strikes?: StrikeSpec[];
  block?: {t0: number; t1: number; side: Side};
  grab?: {t0: number; side: Side; target: V3; hold?: (t: number) => V3};
  raise?: {t0: number; t1: number; side: Side};
  hits?: {t0: number; dir: V3; strength: number}[];
  /** knocked down (knees give → topple → settle); with getUp the unit rises again from that time (machines do).
   *  `limp` (default true): free arms fall with gravity and lie on the ground */
  fall?: {t0: number; dir: V3; getUp?: number; /** final topple angle (deg, default 86); > 90 lies down a slope, < 86 rests propped */ ang?: number; limp?: boolean;
    /** (R4) contact: the body is lifted by the deepest part vertex below the ground (default true). false = the R3 pose (a body
     *  that must sit lower than the terrain says, e.g. lying across another wreck whose own ground you did not pass in). */
    lift?: boolean};
  eye?: 'cyan' | 'amber' | 'off';
  /** eye turns amber at this time (commit) */
  lockAt?: number;
  damage?: UnitDamage;
  ground?: Ground;
  lod?: 'full' | 'mid' | 'far';
  /** idle sway amount (0 = statue) */
  idle?: number;
  /** (R4, optional) standing micro-motion: weight shifting from foot to foot (±1.4 cm), a slow torso twist, a deeper breath — each unit on its own seeded rhythm (armyItems sets 1 for every standing unit, so a crowd never sways in unison). 0 / absent = none */
  sway?: number;
  key?: string;
  /** formation passthrough: gait start/end (see gait.start/end) */
  gaitStart?: number;
  gaitEnd?: number;
  /**
   * explicit world footholds (ground contact points), overriding the gait/standing feet per foot: planted stagger
   * steps, a skid, a knee down (pair with crouch). pitchL/R tilt the foot (deg). Optional; absent = unchanged.
   */
  feet?: {L?: V3; R?: V3; pitchL?: number; pitchR?: number};
  // ---- R3 exchange / securing vocabulary (see the types above)
  parry?: ParrySpec | ParrySpec[];
  dodge?: DodgeSpec | DodgeSpec[];
  catch?: CatchSpec | CatchSpec[];
  brace?: BraceSpec | BraceSpec[];
  shove?: ShoveSpec | ShoveSpec[];
  press?: PressSpec | PressSpec[];
  turns?: TurnSpec[];
  moves?: MoveSpec[];
  /** (R4) loss of balance with recovery steps (see StaggerSpec) */
  stagger?: StaggerSpec | StaggerSpec[];
  posture?: Posture | [number, Posture][];
  scan?: ScanSpec | ScanSpec[];
  attend?: AttendSpec[];
  restrain?: RestrainSpec | RestrainSpec[];
};

export type UnitRig = {
  pelvis: Pose3; spine: Pose3; neck: Pose3; head: Pose3;
  sh: [V3, V3]; el: [V3, V3]; wr: [V3, V3]; hip: [V3, V3]; kn: [V3, V3]; an: [V3, V3];
  footR: [R3, R3]; chestR: R3; fwd: V3; down: number; // fall progress 0..1
  open: [boolean, boolean];
  /** the root on the ground (after locomotion) and its heading */
  root: V3; heading: number;
  /** world forward used for limb frames (rotated with a fall) */
  fwdW?: V3;
  fallXf?: (p: V3) => V3; fallR?: R3;
};

const UP: V3 = {x: 0, y: 1, z: 0};
const ZERO: V3 = {x: 0, y: 0, z: 0};
const hv = (h: number): V3 => ({x: Math.sin((h * Math.PI) / 180), y: 0, z: -Math.cos((h * Math.PI) / 180)});
const rightOf = (h: number): V3 => ({x: Math.cos((h * Math.PI) / 180), y: 0, z: Math.sin((h * Math.PI) / 180)});
const wrapD = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;
const headingTo = (a: {x: number; z: number}, b: {x: number; z: number}) => (Math.atan2(b.x - a.x, -(b.z - a.z)) * 180) / Math.PI;
const flat = (v: V3): V3 => { const l = Math.hypot(v.x, v.z); return l < 1e-6 ? ZERO : {x: v.x / l, y: 0, z: v.z / l}; };
const arr = <T,>(x?: T | T[]): T[] => (x === undefined ? [] : Array.isArray(x) ? x : [x]);
const win = (t: number, a: number, b: number, ri: number, ro: number) => smooth((t - a) / ri) * (1 - smooth((t - (b - ro)) / ro));
/** incoming travel direction of a point at t0 (from its trajectory), else from `from` toward `to` */
const travelDir = (p: Pt, t0: number, to: V3, given?: V3): V3 => {
  if (given) return norm3(given);
  if (typeof p === 'function') {
    const a = p(t0 - 0.06), b = p(t0);
    if (len3(sub3(b, a)) > 1e-3) return norm3(sub3(b, a));
  }
  return norm3(sub3(to, ptAt(p, t0)));
};

/** a torso follow toward a bearing difference d (deg) fades to nothing as d nears ±180 (no flip across the wrap) */
const behindFade = (v: number, d: number) => v * (1 - smooth((Math.abs(d) - 120) / 50));
/** strike phase: wind-up (−0.42..−0.13), blow (−0.13..0: four frames of accelerating travel, not one smear frame),
 *  follow-through (0..0.22), recover (0.22..0.85) relative to t0 */
const strikeK = (t: number, t0: number) => {
  const u = t - t0;
  if (u < -0.42 || u > 0.85) return null;
  if (u < -0.13) return {ph: 'wind' as const, k: smooth((u + 0.42) / 0.29)};
  if (u < 0) return {ph: 'blow' as const, k: easeIn2((u + 0.13) / 0.13)};
  if (u < 0.22) return {ph: 'through' as const, k: easeOut(u / 0.22)};
  return {ph: 'recover' as const, k: smooth((u - 0.22) / 0.63)};
};
/** the hit stagger: the pelvis is shoved along the blow (feet planted), peaks at 0.25 s, eases back to 60 % by 1.2 s
 *  and settles to zero by 1.7 s (C1-continuous: no pop when it ends) */
const stagK = (u: number) => (u < 0 ? 0 : u <= 1.2 ? smooth(u / 0.25) * (1 - smooth((u - 0.3) / 0.9) * 0.4) : u < 1.7 ? 0.6 * (1 - smooth((u - 1.2) / 0.5)) : 0);
const recoilK = (u: number) => (u < 0 || u > 1.4 ? 0 : Math.exp(-u * 5) * Math.sin(Math.min(u * 14, Math.PI * 0.5 + u * 6)) * (1 - smooth((u - 1.0) / 0.4)));

// ------------------------------------------------------------------ locomotion: root keys → planted steps
type RK = {t: number; x: number; z: number; h: number; stag: number; half: number; lift?: number; shuffle?: boolean};
type FK = {t: number; x: number; z: number; h: number; lift: number};
const HALF0 = U.hipW + 0.04, STAG0 = -0.04;
/** soft reach limit of the unit's limbs (m): no knee / elbow snap at full stretch */
const LIMB_SOFT = 0.035;
/** ink width multiplier of the mid LOD (a little firmer than full: fewer interior edges, the same overall weight at a distance) */
const MID_INK = 1.12;
const stanceOf = (k: RK, sd: -1 | 1): {x: number; z: number; h: number} => {
  const f = hv(k.h), r = rightOf(k.h);
  const fo = sd < 0 ? k.stag : -k.stag;
  return {x: k.x + r.x * k.half * sd + f.x * fo, z: k.z + r.z * k.half * sd + f.z * fo, h: k.h + sd * 6};
};
type Gen = {ts: number; keys: (cur: RK) => RK[]};

const locoGens = (sp: UnitSpec): Gen[] => {
  const g: Gen[] = [];
  const mk = (cur: RK, o: Partial<RK>): RK => ({...cur, ...o});
  for (const tr of sp.turns ?? []) {
    g.push({ts: tr.t0, keys: (c) => {
      const h1 = typeof tr.to === 'number' ? tr.to : headingTo(c, tr.to);
      const d = wrapD(h1 - c.h);
      const dur = tr.dur ?? 0.3 + (Math.abs(d) / 180) * 0.55;
      return [mk(c, {t: tr.t0}), mk(c, {t: tr.t0 + dur, h: c.h + d})];
    }});
  }
  for (const at of sp.attend ?? []) {
    g.push({ts: at.t0 + 0.12, keys: (c) => {
      const p = ptAt(at.at, at.t0 + 0.35);
      const d = wrapD(headingTo(c, p) - c.h);
      if (!(at.turn ?? Math.abs(d) > 75)) return [];
      const dur = 0.32 + (Math.abs(d) / 180) * 0.5;
      return [mk(c, {t: at.t0 + 0.12}), mk(c, {t: at.t0 + 0.12 + dur, h: c.h + d})];
    }});
  }
  for (const mv of sp.moves ?? []) {
    g.push({ts: mv.t0, keys: (c) => {
      const h1 = mv.heading ?? (mv.face ? headingTo(mv.to, mv.face) : Math.hypot(mv.to.x - c.x, mv.to.z - c.z) > 0.3 ? headingTo(c, mv.to) : c.h);
      const hEnd = c.h + wrapD(h1 - c.h);
      const L = Math.hypot(mv.to.x - c.x, mv.to.z - c.z);
      if (!mv.shuffle || L < 0.5) return [mk(c, {t: mv.t0}), mk(c, {t: mv.t1, x: mv.to.x, z: mv.to.z, h: hEnd})];
      const n = Math.ceil(L / 0.42);
      const out = [mk(c, {t: mv.t0})];
      for (let i = 1; i <= n; i++) out.push(mk(c, {t: lerp(mv.t0, mv.t1, i / n), x: lerp(c.x, mv.to.x, i / n), z: lerp(c.z, mv.to.z, i / n), h: c.h + wrapD(h1 - c.h) * (i / n), shuffle: true}));
      return out;
    }});
  }
  for (const pr of arr(sp.press)) {
    g.push({ts: pr.t0, keys: (c) => {
      const reach = pr.reach ?? 0.95, lag = pr.lag ?? 0.18, beat = pr.beat ?? 0.34;
      const out: RK[] = [mk(c, {t: pr.t0})];
      let cur = c;
      for (let tau = pr.t0 + beat; tau <= pr.t1 + 1e-6; tau += beat) {
        const tg = ptAt(pr.target, tau - lag);
        const dx = tg.x - cur.x, dz = tg.z - cur.z;
        const L = Math.hypot(dx, dz);
        const adv = Math.max(0, L - reach);
        const x = cur.x + (L > 1e-6 ? (dx / L) * Math.min(adv, 0.75) : 0), z = cur.z + (L > 1e-6 ? (dz / L) * Math.min(adv, 0.75) : 0);
        const h = cur.h + wrapD(headingTo({x, z}, tg) - cur.h);
        const nk = mk(cur, {t: tau, x, z, h, shuffle: true});
        out.push(nk);
        cur = nk;
      }
      return out;
    }});
  }
  for (const st of arr(sp.stagger)) {
    g.push({ts: st.t0, keys: (c) => {
      const n = clamp(Math.round(st.steps ?? 2), 1, 5), d = flat(st.dir), step = 0.32 * (st.strength ?? 1);
      const out = [mk(c, {t: st.t0})];
      for (let k = 1; k <= n; k++) { const L = step * (k - 0.1 * k * (k - 1)); out.push(mk(c, {t: st.t0 + 0.06 + STAG_STEP * k, x: c.x + d.x * L, z: c.z + d.z * L, shuffle: true})); }
      return out;
    }});
  }
  for (const d of arr(sp.dodge)) {
    if ((d.kind ?? 'lean') !== 'step') continue;
    g.push({ts: d.t0 - 0.3, keys: (c) => {
      const dir = flat(d.dir), a = (d.amount ?? 1) * 0.5;
      const out = [mk(c, {t: d.t0 - 0.3}), mk(c, {t: d.t0 - 0.04, x: c.x + dir.x * a, z: c.z + dir.z * a, lift: 0.08})];
      if (d.back !== undefined) out.push(mk(c, {t: d.back}), mk(c, {t: d.back + 0.45}));
      return out;
    }});
  }
  for (const b of arr(sp.brace)) {
    if (b.step === false) continue;
    g.push({ts: b.t0 - 0.55, keys: (c) => {
      const dir = flat(b.dir);
      const h1 = len3(dir) > 0 ? headingTo({x: 0, z: 0}, {x: -dir.x, z: -dir.z}) : c.h;
      const dh = wrapD(h1 - c.h);
      const h = Math.abs(dh) > 15 ? c.h + dh : c.h;
      // the right foot steps back along the force; the left stays (the root settles between them)
      const stag = 0.17;
      const f = hv(h);
      return [mk(c, {t: b.t0 - 0.55}), mk(c, {t: b.t0 - 0.2, x: c.x + f.x * (STAG0 - stag), z: c.z + f.z * (STAG0 - stag), h, stag})];
    }});
  }
  for (const s of arr(sp.shove)) {
    const st = s.step ?? 0.25;
    if (st <= 0) continue;
    g.push({ts: s.t0 - 0.22, keys: (c) => {
      const d = flat(sub3(ptAt(s.target, s.t0), {x: c.x, y: 0, z: c.z}));
      return [mk(c, {t: s.t0 - 0.22}), mk(c, {t: s.t0 + 0.04, x: c.x + d.x * st * 0.7, z: c.z + d.z * st * 0.7})];
    }});
  }
  for (const s of strikeList(sp)) {
    if (!s.step) continue;
    g.push({ts: s.t0 - 0.4, keys: (c) => {
      const d = flat(sub3(s.target, {x: c.x, y: 0, z: c.z}));
      return [mk(c, {t: s.t0 - 0.4}), mk(c, {t: s.t0 - 0.04, x: c.x + d.x * s.step!, z: c.z + d.z * s.step!})];
    }});
  }
  return g.sort((a, b) => a.ts - b.ts);
};

type Loco = {keys: RK[]; L: FK[]; R: FK[]};
const locomotion = (sp: UnitSpec): Loco | null => {
  if (sp.gait) return null;
  const gens = locoGens(sp);
  if (!gens.length) return null;
  const k0: RK = {t: -1e9, x: sp.pos.x, z: sp.pos.z, h: sp.heading, stag: STAG0, half: HALF0};
  const keys: RK[] = [k0];
  for (const gn of gens) {
    const last = keys[keys.length - 1];
    const ks = gn.keys(last);
    for (const k of ks) {
      const prev = keys[keys.length - 1];
      keys.push({...k, t: Math.max(k.t, prev.t + 0.02)});
    }
  }
  if (keys.length === 1) return null;
  // planted steps between consecutive keys
  const L: FK[] = [{t: -1e9, ...stanceOf(k0, -1), lift: 0}], R: FK[] = [{t: -1e9, ...stanceOf(k0, 1), lift: 0}];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    const D = b.t - a.t;
    const pl = stanceOf(b, -1), pr = stanceOf(b, 1);
    const cl = L[L.length - 1], cr = R[R.length - 1];
    const mL = Math.hypot(pl.x - cl.x, pl.z - cl.z) > 0.025 || Math.abs(wrapD(pl.h - cl.h)) > 8;
    const mR = Math.hypot(pr.x - cr.x, pr.z - cr.z) > 0.025 || Math.abs(wrapD(pr.h - cr.h)) > 8;
    if (!mL && !mR) continue;
    const dist = Math.hypot(b.x - a.x, b.z - a.z);
    const liftOf = (len: number) => b.lift ?? clamp(0.05 + len * 0.14, 0.05, 0.15);
    const step = (F: FK[], to: {x: number; z: number; h: number}, t0: number, t1: number) => {
      const c = F[F.length - 1];
      F.push({t: t0, x: c.x, z: c.z, h: c.h, lift: 0});
      F.push({t: t1, x: to.x, z: to.z, h: to.h, lift: liftOf(Math.hypot(to.x - c.x, to.z - c.z))});
    };
    if (mL !== mR) {
      // one foot repositions (a stance change, a small pivot)
      if (mL) step(L, pl, a.t + D * 0.08, b.t); else step(R, pr, a.t + D * 0.08, b.t);
      continue;
    }
    // lead foot: the one on the side of the move (sideways), else the one that turns outward first, else left
    const rr = rightOf(a.h);
    const lat = (b.x - a.x) * rr.x + (b.z - a.z) * rr.z;
    const dh = wrapD(b.h - a.h);
    let first: Side = Math.abs(lat) > dist * 0.5 && dist > 0.03 ? (lat > 0 ? 'R' : 'L') : Math.abs(dh) > 10 && dist < 0.15 ? (dh > 0 ? 'R' : 'L') : 'L';
    if (b.shuffle) {
      // step-drag: lead then trail into the new stance
      const lead = first;
      step(lead === 'L' ? L : R, lead === 'L' ? pl : pr, a.t, a.t + D * 0.5);
      step(lead === 'L' ? R : L, lead === 'L' ? pr : pl, a.t + D * 0.5, b.t);
      continue;
    }
    const n = Math.max(1, Math.ceil(dist / 0.6), Math.ceil(Math.abs(dh) / 55));
    const steps = n + 1;
    for (let j = 0; j < steps; j++) {
      const t0 = a.t + (D * j) / steps, t1 = a.t + (D * (j + 1)) / steps;
      const e = smooth(Math.min(1, (j + 1) / n));
      const kk: RK = {...b, x: lerp(a.x, b.x, e), z: lerp(a.z, b.z, e), h: a.h + wrapD(b.h - a.h) * e, stag: lerp(a.stag, b.stag, e), half: lerp(a.half, b.half, e)};
      const foot: Side = (j % 2 === 0) === (first === 'L') ? 'L' : 'R';
      step(foot === 'L' ? L : R, stanceOf(kk, foot === 'L' ? -1 : 1), t0, t1);
    }
    first = first === 'L' ? 'R' : 'L';
  }
  return {keys, L, R};
};
const locoOf = (sp: UnitSpec): Loco | null => locomotion(sp);
const rootAt = (keys: RK[], t: number): {x: number; z: number; h: number} => {
  if (t <= keys[0].t) return keys[0];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i].t) {
    const a = keys[i - 1], b = keys[i];
    const e = smooth((t - a.t) / Math.max(1e-6, b.t - a.t));
    return {x: lerp(a.x, b.x, e), z: lerp(a.z, b.z, e), h: a.h + wrapD(b.h - a.h) * e};
  }
  return keys[keys.length - 1];
};
const footKeyAt = (F: FK[], t: number, g: Ground): {p: V3; h: number; s: number; swing: boolean} => {
  if (t <= F[0].t) return {p: {x: F[0].x, y: g(F[0].x, F[0].z), z: F[0].z}, h: F[0].h, s: 0, swing: false};
  for (let i = 1; i < F.length; i++) if (t <= F[i].t) {
    const a = F[i - 1], b = F[i];
    const moved = Math.hypot(b.x - a.x, b.z - a.z) > 1e-4 || Math.abs(wrapD(b.h - a.h)) > 0.5;
    if (!moved) return {p: {x: a.x, y: g(a.x, a.z), z: a.z}, h: a.h, s: 0, swing: false};
    const u = clamp((t - a.t) / Math.max(1e-6, b.t - a.t));
    const e = smooth(u);
    const x = lerp(a.x, b.x, e), z = lerp(a.z, b.z, e);
    const y = Math.max(lerp(g(a.x, a.z), g(b.x, b.z), e), g(x, z)) + Math.sin(Math.PI * u) * b.lift;
    return {p: {x, y, z}, h: a.h + wrapD(b.h - a.h) * e, s: u, swing: true};
  }
  const l = F[F.length - 1];
  return {p: {x: l.x, y: g(l.x, l.z), z: l.z}, h: l.h, s: 0, swing: false};
};

// ------------------------------------------------------------------ strikes (single + combos)
const strikeList = (sp: UnitSpec): StrikeSpec[] => [...(sp.strike ? [sp.strike] : []), ...(sp.strikes ?? [])].sort((a, b) => a.t0 - b.t0);
/** crossfade weight of strike i (it hands over to the next strike's wind-up) */
const strikeW = (list: StrikeSpec[], i: number, t: number) => {
  const nx = list[i + 1];
  if (!nx || nx.t0 - list[i].t0 > 1.28) return 1;
  return 1 - smooth((t - (nx.t0 - 0.42)) / 0.32);
};

// ------------------------------------------------------------------ postures
const POSTURES: Posture[] = ['idle', 'guard', 'ready', 'lowered'];
const postureW = (sp: UnitSpec, t: number): Record<Posture, number> => {
  const one = (p: Posture): Record<Posture, number> => ({idle: 0, guard: 0, ready: 0, lowered: 0, [p]: 1});
  const P = sp.posture;
  if (!P) return one('idle');
  if (typeof P === 'string') return one(P);
  let w = one('idle');
  [...P].sort((a, b) => a[0] - b[0]).forEach(([tk, p]) => {
    const b = smooth((t - tk) / 0.45);
    if (b <= 0) return;
    const o = one(p);
    w = {idle: lerp(w.idle, o.idle, b), guard: lerp(w.guard, o.guard, b), ready: lerp(w.ready, o.ready, b), lowered: lerp(w.lowered, o.lowered, b)};
  });
  return w;
};

// ------------------------------------------------------------------ scan
const scanYaw = (s: ScanSpec, id: number, t: number): {yaw: number; pitch: number} => {
  const seed = s.seed ?? id;
  const span = s.span ?? 70, dwell = s.dwell ?? 1.0;
  let tau = s.t0, py = 0, pp = 0;
  for (let k = 0; k < 400; k++) {
    const mv = 0.22 + rnd(seed * 17 + k) * 0.14;
    const dw = dwell * (0.6 + rnd(seed * 13 + k) * 0.8);
    const sgn = (k % 2 === 0 ? 1 : -1) * (rnd(seed * 29 + k) < 0.22 ? -1 : 1);
    const y = sgn * (span / 2) * (0.3 + 0.7 * rnd(seed * 19 + k));
    const p = (rnd(seed * 23 + k) - 0.5) * 9 - 1.5;
    if (t < tau + mv + dw || k === 399) {
      const e = smooth((t - tau) / mv);
      return {yaw: lerp(py, y, e), pitch: lerp(pp, p, e)};
    }
    tau += mv + dw; py = y; pp = p;
  }
  return {yaw: 0, pitch: 0};
};

/** Solve the skeleton (world joints, before any fall) at time t. */
export const solveUnit = (sp: UnitSpec): UnitRig => {
  const g = sp.ground ?? FLAT;
  const t = sp.t;
  const seed = sp.id;
  let heading = sp.heading;
  let root = sp.pos;
  let walkPh = 0, walking = false;
  let walkK = 0;
  const loco = locoOf(sp);
  let overLift = 0;
  if (sp.gait) {
    const p = sp.gait.path(sp.gait.dist);
    root = p.pos;
    heading = p.heading;
    walkPh = sp.gait.dist / (sp.gait.stride ?? 1.5);
    walking = true;
    const st = sp.gait.start ?? -1e9, en = sp.gait.end ?? 1e9;
    walkK = smooth((sp.gait.dist - st) / 0.6) * (1 - smooth((sp.gait.dist - (en - 0.6)) / 0.6));
    for (const o of sp.gait.over ?? []) {
      const d = Math.hypot(root.x - o.x, root.z - o.z);
      overLift = Math.max(overLift, o.h * 0.4 * (1 - smooth((d - o.r * 0.5) / (o.r + 0.4))));
    }
  } else if (loco) {
    const r = rootAt(loco.keys, t);
    root = {x: r.x, y: sp.pos.y, z: r.z};
    heading = r.h;
  }
  const fwd = hv(heading), right = rightOf(heading);
  const B = rotHeading(heading);
  const gy = g(root.x, root.z);
  const strikes = strikeList(sp);
  const parries = arr(sp.parry), catches = arr(sp.catch), braces = arr(sp.brace), shoves = arr(sp.shove), restrains = arr(sp.restrain);
  // ---------------- impulses: hits + the absorbed contacts of blocks, parries, catches, braces
  const impulses: {t0: number; dir: V3; strength: number}[] = [...(sp.hits ?? [])];
  const chestGuess = {x: root.x, y: gy + 1.45, z: root.z};
  for (const p of parries) impulses.push({t0: p.t0, dir: travelDir(p.at, p.t0, chestGuess, p.dir), strength: ((p.kind ?? 'parry') === 'block' ? 0.35 : 0.14) * (p.force ?? 1)});
  for (const c of catches) impulses.push({t0: c.t0, dir: travelDir(c.at, c.t0, chestGuess, c.dir), strength: 0.2});
  for (const b of braces) impulses.push({t0: b.t0, dir: b.dir, strength: 0.28 * (b.force ?? 1)});
  let recoil = 0, stag: V3 = ZERO;
  for (const h of impulses) {
    const u = t - h.t0;
    if (u < 0 || u > 1.7) continue;
    const d = flat(h.dir);
    stag = add3(stag, mul3(d, 0.18 * h.strength * stagK(u)));
    recoil += recoilK(u) * h.strength * 22 * Math.sign(dot3(d, fwd) || 1) * -1;
  }
  const footRoot = root; // standing feet stay where they are; a hit shoves the pelvis, not the feet
  let shift: V3 = stag;
  let swayTwist = 0, swayCrouch = 0;
  if ((sp.sway ?? 0) > 0 && !sp.gait) {
    const k = sp.sway!, r1 = rnd(seed * 5.3 + 1), r2 = rnd(seed * 9.1 + 2), r3 = rnd(seed * 2.7 + 3);
    const a = Math.sin(t * (0.45 + 0.25 * r1) + r2 * 6.283), b = Math.sin(t * (0.31 + 0.2 * r3) + r1 * 6.283);
    shift = add3(shift, add3(mul3(right, 0.014 * k * a), mul3(fwd, 0.008 * k * b)));
    swayTwist = 1.6 * k * Math.sin(t * (0.38 + 0.2 * r2) + r3 * 6.283);
    swayCrouch = 0.006 * k * (0.5 + 0.5 * a);
  }
  const idle = sp.idle ?? 1;
  const breath = Math.sin(t * 1.3 + seed) * 0.008 * idle;
  // marching: knees stay bent (a low, purposeful gait) so the planted foot is always within reach — no foot slide
  const bob = walking ? (0.085 + 0.03 * (1 - Math.cos(walkPh * Math.PI * 4)) * 0.5) * walkK : 0;
  let crouch = (sp.crouch ?? 0) + bob + breath + len3(stag) * 0.6 - overLift + swayCrouch;
  let twist = (sp.twist ?? 0) + swayTwist, lean = sp.lean ?? (walking ? 6 * walkK : 0), roll = 0, pelvTwist = 0, headPitch = 0;
  // ---------------- strikes: twist and lean through the hips; the pelvis turns and shifts into the blow
  strikes.forEach((s, i) => {
    const sk = strikeK(t, s.t0);
    if (!sk) return;
    const w = strikeW(strikes, i, t) * (s.drive ?? 1);
    const sd = s.side === 'R' ? 1 : -1;
    const tw = sk.ph === 'wind' ? lerp(0, 24, sk.k) : sk.ph === 'blow' ? lerp(24, -18, sk.k) : sk.ph === 'through' ? lerp(-18, -24, sk.k) : lerp(-24, 0, sk.k);
    twist += tw * sd * w;
    pelvTwist += tw * sd * 0.2 * w;
    lean += (sk.ph === 'wind' ? lerp(0, -4, sk.k) : sk.ph === 'blow' ? lerp(-4, 14, sk.k) : sk.ph === 'through' ? 14 : lerp(14, 0, sk.k)) * w;
    const toT = flat(sub3(s.target, root));
    const drive = sk.ph === 'wind' ? lerp(0, -0.03, sk.k) : sk.ph === 'blow' ? lerp(-0.03, 0.09, sk.k) : sk.ph === 'through' ? 0.09 : lerp(0.09, 0, sk.k);
    shift = add3(shift, mul3(toT, drive * w));
    crouch += (sk.ph === 'blow' ? 0.035 * sk.k : sk.ph === 'through' ? 0.035 : sk.ph === 'recover' ? 0.035 * (1 - sk.k) : 0) * w;
  });
  // ---------------- dodges: the body clear of the weapon before it passes
  for (const d of arr(sp.dodge)) {
    const u = t - d.t0;
    if (u < -0.36 || u > 1.2 + (d.back !== undefined ? d.back - d.t0 : 0)) continue;
    const kind = d.kind ?? 'lean', amt = d.amount ?? 1;
    const dir = flat(d.dir);
    const ant = Math.sin(Math.PI * clamp((u + 0.36) / 0.16));
    const mv = easeOut(clamp((u + 0.26) / 0.2));
    const ret = kind === 'step' ? 1 : d.back !== undefined ? smooth((t - d.back) / 0.45) : smooth((u - 0.12) / 0.45);
    const k = kind === 'step' ? mv * (1 - smooth((u - 0.1) / 0.4)) : mv * (1 - ret);
    const fz = dot3(dir, fwd), lz = dot3(dir, right);
    if (kind === 'lean') {
      shift = add3(shift, add3(mul3(dir, 0.15 * amt * k), mul3(dir, -0.03 * ant)));
      lean += fz * 26 * amt * k;
      roll += -lz * 24 * amt * k;
      crouch += 0.04 * k;
    } else if (kind === 'duck') {
      crouch += 0.36 * amt * k;
      lean += 26 * amt * k;
      shift = add3(shift, add3(mul3(dir, 0.06 * k), mul3(dir, -0.02 * ant)));
      headPitch += 12 * k;
    } else {
      lean += fz * 9 * k;
      roll += -lz * 9 * k;
      crouch += 0.05 * k;
      shift = add3(shift, mul3(dir, -0.03 * ant));
    }
  }
  // ---------------- stagger (R4): hinge back, arms out, head snap while the recovery steps carry the root
  let stagW = 0, stagArmsW = 0;
  for (const st of arr(sp.stagger)) {
    const u = t - st.t0, dur = staggerDur(st);
    if (u < -0.02 || u > dur + 0.45) continue;
    const dir = flat(st.dir), str = st.strength ?? 1;
    const k = smooth(u / 0.1) * (1 - smooth((u - dur + 0.05) / 0.5));
    if (k <= 0) continue;
    const fz = dot3(dir, fwd), lz = dot3(dir, right);
    lean += fz * 20 * str * k;
    roll += -lz * 16 * str * k;
    crouch += 0.06 * k;
    headPitch += fz * 12 * k;
    stagW = Math.max(stagW, k);
    if (st.arms !== false) stagArmsW = Math.max(stagArmsW, smooth(u / 0.14) * (1 - smooth((u - dur + 0.1) / 0.45)));
  }
  // ---------------- brace: lower, lean into the force, absorb; then shove back
  const braceShoves: {t0: number; target: V3; t1: number; dir: V3}[] = [];
  for (const b of braces) {
    const u = t - b.t0;
    const sh = b.shove === false ? undefined : b.shove ?? b.t0 + 0.4;
    const t1 = b.t1 ?? (sh !== undefined ? sh + 0.6 : b.t0 + 0.8);
    const wp = smooth((u + 0.55) / 0.35) * (1 - smooth((t - t1) / 0.5));
    if (wp <= 0) continue;
    const dir = flat(b.dir);
    crouch += 0.14 * wp;
    lean += -dot3(dir, fwd) * 10 * wp;
    roll += dot3(dir, right) * 6 * wp;
    if (sh !== undefined) {
      const c0 = {x: root.x, y: gy + 1.45, z: root.z};
      braceShoves.push({t0: sh, target: add3(c0, mul3(dir, -0.62)), t1: sh + 0.22, dir: mul3(dir, -1)});
    }
  }
  // ---------------- shoves (and brace shove-backs): chamber → drive → push through, driven by the hips
  const shoveList = [...shoves.map((s) => ({t0: s.t0, target: ptAt(s.target, s.t0), t1: s.t1 ?? s.t0 + 0.22, side: s.side ?? 'both' as Side | 'both'})), ...braceShoves.map((b) => ({t0: b.t0, target: b.target, t1: b.t1, side: 'both' as Side | 'both'}))];
  for (const s of shoveList) {
    const u = t - s.t0;
    if (u < -0.34 || t > s.t1 + 0.5) continue;
    const pd = flat(sub3(s.target, root));
    const rec = smooth((t - s.t1) / 0.5);
    const dv = u < -0.16 ? lerp(0, -0.02, smooth((u + 0.34) / 0.18)) : u < 0 ? lerp(-0.02, 0.08, easeIn2((u + 0.16) / 0.16)) : lerp(0.08, 0.16, easeOut2(u / 0.2));
    shift = add3(shift, mul3(pd, dv * (1 - rec)));
    lean += (u < -0.16 ? -3 * smooth((u + 0.34) / 0.18) : u < 0 ? lerp(-3, 12, easeIn2((u + 0.16) / 0.16)) : lerp(12, 16, easeOut2(u / 0.2))) * (1 - rec);
    crouch += 0.05 * smooth((u + 0.34) / 0.18) * (1 - rec);
  }
  // ---------------- catch wrench: the pull goes through the hips
  for (const c of catches) {
    if (!c.wrench) continue;
    const w = c.wrench;
    const u = t - w.t0;
    if (u < -0.15) continue;
    const rel = c.t1 !== undefined ? 1 - smooth((t - c.t1) / 0.4) : 1;
    const ant = Math.sin(Math.PI * clamp((u + 0.15) / 0.15)) * (u < 0 ? 1 : 0);
    const k = smooth(u / 0.35) * rel;
    const d = flat(w.dir);
    shift = add3(shift, add3(mul3(d, 0.1 * k), mul3(d, -0.03 * ant)));
    const dh = wrapD(headingTo({x: 0, z: 0}, d) - heading);
    twist += -clamp(dh, -1, 1) * Math.min(Math.abs(dh), w.deg ?? 30) * k;
    lean += -5 * k;
  }
  // ---------------- postures
  const pw = postureW(sp, t);
  const implicitGuard = Math.max(
    ...arr(sp.press).map((p) => (p.guard === false ? 0 : win(t, p.t0 - 0.2, p.t1 + 0.6, 0.25, 0.45))),
    ...(sp.moves ?? []).map((m) => (m.guard ? win(t, m.t0 - 0.2, m.t1 + 0.5, 0.25, 0.4) : 0)),
    0,
  );
  const gW = Math.max(pw.guard, implicitGuard), sumOther = pw.idle + pw.ready + pw.lowered;
  const PW: Record<Posture, number> = {guard: gW, idle: sumOther > 0 ? (pw.idle * (1 - gW)) / sumOther : 0, ready: sumOther > 0 ? (pw.ready * (1 - gW)) / sumOther : 0, lowered: sumOther > 0 ? (pw.lowered * (1 - gW)) / sumOther : 0};
  crouch += 0.07 * PW.guard + 0.04 * PW.ready + 0.01 * PW.lowered;
  lean += 5 * PW.guard + 3 * PW.ready + 1 * PW.lowered;
  // ---------------- turning: the torso leads the pelvis toward the new heading
  if (loco) {
    const ahead = rootAt(loco.keys, t + 0.14).h;
    twist += -clamp(wrapD(ahead - heading) * 0.5, -28, 28);
  }
  // ---------------- attention: attend (snap + track) and scan (sweeps with pauses); the torso follows a little
  // attends and scans cross-fade in time order: a newer one ramps in over the older one, an ending one ramps out —
  // the head and the torso never switch targets in a frame
  let attendW = 0, attendP: V3 | null = null, attTwist = 0;
  for (const a of [...(sp.attend ?? [])].sort((x, y) => x.t0 - y.t0)) {
    if (t < a.t0 - 0.02) continue;
    const w = smooth((t - a.t0) / 0.18) * (a.t1 !== undefined ? 1 - smooth((t - a.t1) / 0.4) : 1);
    if (w <= 0) continue;
    // a short trailing window (head ~0.16 s, torso ~0.25 s behind it): even a fast flyby turns the head and torso over
    // several frames instead of one
    const hd0 = {x: root.x, y: gy + 2.05, z: root.z};
    let dsum = ZERO;
    for (let k = 0; k < 5; k++) dsum = add3(dsum, norm3(sub3(ptAt(a.at, Math.max(a.t0, t - k * 0.04)), hd0)));
    const P = add3(hd0, mul3(norm3(dsum), 3));
    attendP = attendP ? lerp3(attendP, P, w) : P;
    attendW = attendW + (1 - attendW) * w;
    const lagW = smooth((t - a.t0 - 0.12) / 0.35) * w;
    let tw = 0;
    for (let k = 0; k < 6; k++) {
      const Pk = ptAt(a.at, Math.max(a.t0, t - 0.1 - k * 0.05));
      const dk = wrapD(headingTo(root, Pk) - heading);
      tw += behindFade(-clamp(dk * 0.45, -35, 35), dk) / 6;
    }
    attTwist = lerp(attTwist, tw, lagW);
  }
  twist += attTwist;
  let scanW = 0, scanDir: V3 | null = null, scanTwist = 0;
  for (const sc of arr(sp.scan).sort((x, y) => x.t0 - y.t0)) {
    if (t < sc.t0) continue;
    const w = smooth((t - sc.t0) / 0.4) * (sc.t1 !== undefined ? 1 - smooth((t - sc.t1) / 0.5) : 1);
    if (w <= 0) continue;
    const c = sc.center;
    const headGuess = {x: root.x, y: gy + 2.05, z: root.z};
    const cb = c === undefined ? heading : typeof c === 'number' ? c : headingTo(root, c);
    const cp = c !== undefined && typeof c !== 'number' ? (Math.atan2(c.y - headGuess.y, Math.hypot(c.x - root.x, c.z - root.z)) * 180) / Math.PI : 0;
    const sy = scanYaw(sc, seed, t), sl = scanYaw(sc, seed, t - 0.2);
    const b = ((cb + sy.yaw) * Math.PI) / 180, pch = ((cp - sy.pitch) * Math.PI) / 180;
    const dir = {x: Math.sin(b) * Math.cos(pch), y: Math.sin(pch), z: -Math.cos(b) * Math.cos(pch)};
    scanDir = scanDir ? norm3(lerp3(scanDir, dir, w)) : dir;
    scanW = scanW + (1 - scanW) * w;
    scanTwist = lerp(scanTwist, behindFade(-clamp(wrapD(cb + sl.yaw - heading) * (sc.torso ?? 0.25), -30, 30), wrapD(cb + sl.yaw - heading)), w);
  }
  scanW *= 1 - attendW;
  twist += scanTwist * (1 - attendW);
  lean += recoil;
  // the dent: knocked askew, eased in over 0.12 s (no pop)
  const dentK = sp.damage?.dent ? easeOut((t - sp.damage.dent.t0) / 0.12) * (t >= sp.damage.dent.t0 ? 1 : 0) : 0;
  if (sp.damage?.dent) twist += sp.damage.dent.deg * 0.4 * dentK;
  // a planted step in progress dips the pelvis a little
  let stepDip = 0;
  let footsL: ReturnType<typeof footKeyAt> | null = null, footsR: ReturnType<typeof footKeyAt> | null = null;
  if (loco) {
    footsL = footKeyAt(loco.L, t, g); footsR = footKeyAt(loco.R, t, g);
    stepDip = 0.025 * (Math.sin(Math.PI * footsL.s) + Math.sin(Math.PI * footsR.s));
  }
  crouch += stepDip;

  // ---------------- contact targets that need reach (the body leans / lowers / shifts to reach them)
  const reachT: {P: V3; side: Side; w: number}[] = [];
  const both = (s: Side | 'both'): Side[] => (s === 'both' ? ['L', 'R'] : [s]);
  for (const p of parries) { const u = t - p.t0; const w = win(t, p.t0 - 0.32, (p.t1 ?? p.t0 + 0.45) + 0.45, 0.3, 0.45); if (w > 0 && u > -0.4) reachT.push({P: ptAt(p.at, p.t0), side: p.side, w}); }
  for (const c of catches) { const w = win(t, c.t0 - 0.34, (c.t1 ?? 1e9) + 0.4, 0.3, 0.4); if (w > 0) both(c.side).forEach((s) => reachT.push({P: c.hold && t > c.t0 + 0.08 ? c.hold(t) : ptAt(c.at, Math.min(t, c.t0)), side: s, w})); }
  for (const r of restrains) { const w = win(t, r.t0 - 0.45, (r.t1 ?? 1e9) + 0.5, 0.4, 0.5); if (w > 0) both(r.side).forEach((s, i) => reachT.push({P: ptAt(i === 1 && r.at2 ? r.at2 : r.at, t), side: s, w})); }
  const shoulderGuess = (s: Side, sh: V3, cr: number) => ({x: root.x + sh.x + right.x * (s === 'R' ? 1 : -1) * U.shW, y: gy + U.pelvisH - cr + U.spine + U.shY, z: root.z + sh.z + right.z * (s === 'R' ? 1 : -1) * U.shW});
  // (two hands on two points need the body lowered / shifted once, not twice: take the largest need, average the shift)
  let reachShift: V3 = ZERO, reachCrouch = 0, reachLean = 0, nShift = 0;
  for (const r of reachT) {
    const S = shoulderGuess(r.side, shift, crouch);
    const dH = Math.hypot(r.P.x - S.x, r.P.z - S.z);
    const low = Math.max(0, S.y - r.P.y - 0.62);
    const maxR = (U.upper + U.fore) * 0.9;
    const need = Math.max(0, dH - Math.sqrt(Math.max(0, maxR * maxR - Math.min(maxR, Math.max(0, S.y - r.P.y - low * 0.8)) ** 2)));
    reachShift = add3(reachShift, mul3(flat(sub3(r.P, S)), Math.min(0.35, need) * r.w));
    nShift += r.w > 0 ? 1 : 0;
    // a low point is reached mostly by bending at the hips (the shoulder comes down and forward), then the knees
    reachCrouch = Math.max(reachCrouch, Math.min(0.3, low * 0.42) * r.w);
    reachLean = Math.max(reachLean, Math.min(36, low * 58) * r.w);
  }
  crouch += reachCrouch;
  lean += reachLean;
  if (nShift > 1) reachShift = mul3(reachShift, 1 / nShift);
  if (len3(reachShift) > 0.35) reachShift = mul3(norm3(reachShift), 0.35);
  shift = add3(shift, reachShift);
  // parries / catches turn the torso toward the defending side a little
  for (const p of parries) { const w = win(t, p.t0 - 0.3, (p.t1 ?? p.t0 + 0.45) + 0.4, 0.2, 0.45); twist += (p.side === 'R' ? -1 : 1) * -8 * w; crouch += 0.04 * w; }

  root = add3(root, shift);
  const pelvisPos = {x: root.x, y: gy + U.pelvisH - crouch, z: root.z};
  const pelvisR = rcomp(B, euler(twist * 0.35 + pelvTwist, lean * 0.3, roll * 0.3));
  const pelvis: Pose3 = {pos: pelvisPos, R: pelvisR};
  const chestR = rcomp(B, euler(twist, lean, (sp.damage?.dent ? sp.damage.dent.deg * 0.6 * dentK : 0) + roll + (walking ? Math.sin(walkPh * Math.PI * 2) * 2 : 0)));
  const spine: Pose3 = {pos: apply(pelvis, {x: 0, y: U.spine, z: 0}), R: chestR};
  const neckP: Pose3 = {pos: apply(spine, {x: 0, y: U.neck, z: 0.02}), R: chestR};
  // ---------------- head: attend > threat lock > scan > look > idle
  const headPos = apply(neckP, {x: 0, y: U.headC, z: 0});
  const cf0 = fwdOf(chestR);
  // the look as a yaw / pitch in the chest frame, the yaw limited to ±lim and faded out for a target straight behind
  // (no flip from one shoulder to the other as a target passes behind the unit)
  const cr0 = rmul(chestR, {x: 1, y: 0, z: 0}), cu0 = rmul(chestR, UP);
  const clampLook = (d: V3, lim = 75): R3 => {
    const dn = norm3(d);
    const fx = dot3(dn, cr0), fy = dot3(dn, cu0), fz = dot3(dn, cf0);
    const yaw0 = (Math.atan2(fx, fz) * 180) / Math.PI, pitch0 = (Math.atan2(fy, Math.hypot(fx, fz)) * 180) / Math.PI;
    const yaw = Math.sign(yaw0) * Math.min(Math.abs(yaw0), lim) * (1 - smooth((Math.abs(yaw0) - 150) / 30));
    const pitch = clamp(pitch0, -50, 45);
    return rcomp(chestR, euler(-yaw, -pitch, 0));
  };
  const scan = idle * noise(t * 0.35, seed) * 14;
  let headR: R3 = sp.look ? clampLook(sub3(sp.look, headPos)) : rcomp(chestR, euler(scan, noise(t * 0.27, seed + 9) * 5 * idle, 0));
  if (scanDir && scanW > 0) headR = slerpish(headR, clampLook(scanDir, 80), scanW);
  // threat lock: the head reads the incoming attack before the defense
  let threat: {P: V3; w: number} | null = null;
  for (const p of parries) { const w = win(t, p.t0 - 0.5, p.t0 + 0.35, 0.15, 0.3); if (w > (threat?.w ?? 0)) threat = {P: ptAt(p.at, Math.min(t, p.t0)), w}; }
  for (const c of catches) { const w = win(t, c.t0 - 0.5, c.t0 + 0.3, 0.15, 0.3); if (w > (threat?.w ?? 0)) threat = {P: ptAt(c.at, Math.min(t, c.t0)), w}; }
  for (const d of arr(sp.dodge)) { const w = win(t, d.t0 - 0.5, d.t0 + 0.25, 0.12, 0.3); if (w > (threat?.w ?? 0)) threat = {P: add3(headPos, mul3(flat(d.dir), -1.2)), w: w * 0.6}; }
  for (const r of restrains) { const w = win(t, r.t0 - 0.6, (r.t1 ?? 1e9) + 0.3, 0.3, 0.3); if (w > (threat?.w ?? 0)) threat = {P: ptAt(r.at, t), w: w * 0.8}; }
  for (const pr of arr(sp.press)) { const w = win(t, pr.t0 - 0.2, pr.t1 + 0.3, 0.15, 0.3); if (w > (threat?.w ?? 0)) threat = {P: ptAt(pr.target, t), w}; }
  if (threat && threat.w > 0) headR = slerpish(headR, clampLook(sub3(threat.P, headPos)), threat.w);
  if (attendP && attendW > 0) headR = slerpish(headR, clampLook(sub3(attendP, headPos), 85), attendW);
  if (headPitch) headR = rcomp(headR, euler(0, headPitch, 0));
  const head: Pose3 = {pos: headPos, R: headR};
  // ---------------- legs
  const hip: [V3, V3] = [apply(pelvis, {x: -U.hipW, y: -0.05, z: 0}), apply(pelvis, {x: U.hipW, y: -0.05, z: 0})];
  const kn: V3[] = [], an: V3[] = [];
  const footR: R3[] = [];
  [0, 1].forEach((i) => {
    const sd = i === 0 ? -1 : 1;
    let target: V3, fh = heading, pitch = 0;
    const base = add3(footRoot, add3(mul3(right, sd * (U.hipW + 0.04)), mul3(fwd, sd * 0.04)));
    const stand = {x: base.x, y: g(base.x, base.z) + U.ankleH, z: base.z};
    if (sp.gait) {
      const f = footAt(sp.gait.path, sp.gait.dist, i === 0 ? 0 : 0.5, sp.gait.stride ?? 1.5, 0.55, sd * (U.hipW + 0.02), sp.gait.lift ?? 0.16, g);
      target = {x: f.pos.x, y: f.pos.y + U.ankleH, z: f.pos.z};
      const ovs = sp.gait.over ?? [];
      const softOn = !!sp.gait.overSoft, soft = softOn && !f.stance && ovs.length > 0;
      // standing on an obstacle: anywhere over it (soft) or only well inside it
      const onTop = (o: {r: number; h: number}, d: number) => o.h * (softOn ? smooth((o.r - d) / 0.15) : smooth((o.r * 0.8 - d) / 0.2));
      if (soft) {
        // the plants either side of this swing (take-off, landing): the swing goes from one's height on top to the other's
        const G0 = sp.gait, st = G0.stride ?? 1.5, ph = i === 0 ? 0 : 0.5, n = Math.floor(G0.dist / st + ph);
        const lat = sd * (U.hipW + 0.02);
        const fa = footAt(G0.path, (n - ph + 1e-4) * st, ph, st, 0.55, lat, 0, g), fb = footAt(G0.path, (n + 1 - ph + 1e-4) * st, ph, st, 0.55, lat, 0, g);
        const top = (q: V3) => ovs.reduce((m, o) => Math.max(m, onTop(o, Math.hypot(q.x - o.x, q.z - o.z))), 0);
        target = {...target, y: target.y + lerp(top(fa.pos), top(fb.pos), smooth(f.s))};
      }
      for (const o of ovs) {
        // a low obstacle: the swinging foot arcs over it (a flattened arc: clear early, down late); a foot planted on it
        // stands on top
        const d = Math.hypot(f.pos.x - o.x, f.pos.z - o.z);
        const inside = 1 - smooth((d - o.r) / 0.35);
        if (inside <= 0) continue;
        const gF = g(f.pos.x, f.pos.z) + U.ankleH;
        const y = f.stance ? gF + onTop(o, d) : gF + (o.h + 0.12) * inside * Math.min(1, (soft ? 1.15 : 2.4) * Math.sin(Math.PI * f.s));
        target = {...target, y: Math.max(target.y, y)};
      }
      fh = f.heading;
      pitch = f.stance ? 0 : Math.sin(Math.PI * f.s) * -12;
      const st = sp.gait.start ?? -1e9, en = sp.gait.end ?? 1e9;
      const k = smooth((sp.gait.dist - st) / 0.6) * (1 - smooth((sp.gait.dist - (en - 0.6)) / 0.6));
      if (k < 1) { target = lerp3(stand, target, k); pitch *= k; fh = lerp(heading + sd * 6, fh, k); }
    } else if (loco) {
      const f = i === 0 ? footsL! : footsR!;
      target = {x: f.p.x, y: f.p.y + U.ankleH, z: f.p.z};
      fh = f.h;
      pitch = f.swing ? Math.sin(Math.PI * f.s) * -10 : 0;
    } else {
      target = stand;
      fh = heading + sd * 6;
    }
    const fo = i === 0 ? sp.feet?.L : sp.feet?.R;
    if (fo) {
      target = {x: fo.x, y: fo.y + U.ankleH, z: fo.z};
      fh = heading + sd * 6;
      pitch = (i === 0 ? sp.feet?.pitchL : sp.feet?.pitchR) ?? 0;
    }
    // keep the hip-ankle distance reachable (crouch lowers the pelvis; reach clamps)
    const r = ik2(hip[i], target, U.thigh, U.shin, add3(fwd, mul3(right, sd * 0.12)), LIMB_SOFT, UP); // knees bend forward, a little out
    kn.push(r.mid); an.push(r.end);
    footR.push(rcomp(rotHeading(fh), euler(0, pitch, 0)));
  });
  // ---------------- arms
  const sh: [V3, V3] = [apply(spine, {x: -U.shW, y: U.shY, z: 0.0}), apply(spine, {x: U.shW, y: U.shY, z: 0.0})];
  const el: V3[] = [], wr: V3[] = [];
  const open: [boolean, boolean] = [false, false];
  const cf = fwdOf(chestR), cr = rmul(chestR, {x: 1, y: 0, z: 0}), cu = rmul(chestR, UP);
  const chestC = apply(spine, {x: 0, y: 0.3, z: -0.05});
  const solveArm = (S: V3, hand: V3, pole: V3) => {
    const dir = norm3(sub3(hand, S));
    let wt = sub3(hand, mul3(dir, U.fist * 0.5));
    // never fold the wrist onto the shoulder (the elbow would be undefined there and flip)
    if (len3(sub3(wt, S)) < 0.24) wt = add3(S, mul3(dir, 0.24));
    return ik2(S, wt, U.upper, U.fore, pole, LIMB_SOFT, add3(mul3(cf, -1), mul3(cu, -0.4)));
  };
  ([0, 1] as const).forEach((i) => {
    const side: Side = i === 0 ? 'L' : 'R';
    const sd = i === 0 ? -1 : 1;
    const S = sh[i];
    // posture rests (idle: hanging, slight bend, march swing opposite to the same-side leg)
    const swing = walking ? Math.sin(walkPh * Math.PI * 2 + (i === 0 ? Math.PI : 0)) * 0.22 * walkK : 0;
    const restOf: Record<Posture, [V3, V3]> = {
      idle: [add3(S, add3(add3(mul3(cu, -0.74), mul3(cf, 0.12 + swing)), mul3(cr, sd * 0.09))), add3(mul3(cf, -1), mul3(cr, sd * 0.4))],
      guard: [add3(S, add3(add3(mul3(cu, -0.16), mul3(cf, 0.4)), mul3(cr, -sd * 0.12))), add3(add3(mul3(cu, -1), mul3(cr, sd * 0.55)), mul3(cf, -0.2))],
      ready: [add3(S, add3(add3(mul3(cu, -0.52), mul3(cf, 0.34 + swing * 0.3)), mul3(cr, -sd * 0.04))), add3(add3(mul3(cf, -0.5), mul3(cr, sd * 0.7)), mul3(cu, -0.3))],
      lowered: [add3(S, add3(add3(mul3(cu, -0.7), mul3(cf, 0.2 + swing * 0.6)), mul3(cr, sd * 0.05))), add3(mul3(cf, -1), mul3(cr, sd * 0.4))],
    };
    let hand: V3 = ZERO, pole: V3 = ZERO;
    POSTURES.forEach((p) => { if (PW[p] > 0) { hand = add3(hand, mul3(restOf[p][0], PW[p])); pole = add3(pole, mul3(restOf[p][1], PW[p])); } });
    const ctl = i === 0 ? sp.armL : sp.armR;
    if (ctl?.hand) { hand = ctl.hand; if (ctl.pole) pole = ctl.pole; open[i] = !!ctl.open; }
    if (sp.raise && sp.raise.side === side) {
      const k = smooth(seg(t, sp.raise.t0, sp.raise.t0 + 0.45)) * (1 - smooth(seg(t, sp.raise.t1, sp.raise.t1 + 0.5)));
      hand = lerp3(hand, add3(S, add3(add3(mul3(cu, 0.62), mul3(cf, 0.25)), mul3(cr, sd * 0.12))), k);
      open[i] = open[i] || k > 0.5;
    }
    if (sp.block && sp.block.side === side) {
      const k = smooth(seg(t, sp.block.t0, sp.block.t0 + 0.18)) * (1 - smooth(seg(t, sp.block.t1, sp.block.t1 + 0.35)));
      const tgt = add3(S, add3(add3(mul3(cu, 0.18), mul3(cf, 0.42)), mul3(cr, -sd * 0.18)));
      hand = lerp3(hand, tgt, k);
      pole = lerp3(pole, add3(mul3(cr, sd), mul3(cu, -0.6)), k);
    }
    if (sp.grab && sp.grab.side === side) {
      const u = t - sp.grab.t0;
      if (u > -0.5) {
        const tgt = sp.grab.hold && u > 0 ? sp.grab.hold(t) : sp.grab.target;
        const k = smooth((u + 0.5) / 0.5);
        hand = lerp3(hand, tgt, k);
        open[i] = u < 0.05;
        pole = lerp3(pole, add3(mul3(cr, sd * 0.8), mul3(cu, -0.6)), k);
      }
    }
    // restraint: reach, grip the body point and track it
    for (const r of restrains) {
      const sides = both(r.side);
      const j = sides.indexOf(side);
      if (j < 0) continue;
      const w = win(t, r.t0 - 0.45, (r.t1 ?? 1e9) + 0.5, 0.45, 0.5);
      if (w <= 0) continue;
      const P = add3(ptAt(j === 1 && r.at2 ? r.at2 : r.at, t), {x: 0, y: -(r.press ?? 0) * 0.04, z: 0});
      hand = lerp3(hand, P, w);
      pole = lerp3(pole, add3(mul3(cr, sd * 0.9), mul3(cu, -0.5)), w);
      open[i] = t < r.t0 + 0.03 || (r.t1 !== undefined && t > r.t1 && t < r.t1 + 0.35);
    }
    // catch: meet the incoming thing at its contact point, close, absorb, hold / wrench
    for (const c of catches) {
      const sides = both(c.side);
      const j = sides.indexOf(side);
      if (j < 0) continue;
      const u = t - c.t0;
      const rel = c.t1 !== undefined ? 1 - smooth((t - c.t1) / 0.4) : 1;
      const w = (u < -0.34 ? 0 : u < -0.2 ? 0.25 * smooth((u + 0.34) / 0.14) : u < -0.01 ? 0.25 + 0.75 * smooth((u + 0.2) / 0.19) : 1) * rel;
      if (w <= 0) continue;
      const P0 = ptAt(c.at, c.t0);
      const d = travelDir(c.at, c.t0, chestC, c.dir);
      const across = norm3(cross3(d, UP));
      let P = add3(P0, mul3(d, u < 0 ? -0.05 : 0.1 * smooth(u / 0.14)));
      if (c.hold && u > 0.08) P = lerp3(P, c.hold(t), smooth((u - 0.08) / 0.12));
      if (c.wrench) P = add3(P, mul3(flat(c.wrench.dir), (c.wrench.dist ?? 0.35) * smooth((t - c.wrench.t0) / 0.35)));
      if (sides.length === 2) P = add3(P, mul3(across, (j === 0 ? 1 : -1) * 0.08 * (dot3(across, cr) > 0 ? -1 : 1)));
      hand = lerp3(hand, P, w);
      pole = lerp3(pole, add3(mul3(cr, sd * 0.7), mul3(cu, -0.7)), w);
      open[i] = u < 0.02 || (c.t1 !== undefined && t > c.t1 && t < c.t1 + 0.3);
    }
    // parry / block: the forearm in the incoming path
    for (const p of parries) {
      if (p.side !== side) continue;
      const u = t - p.t0;
      const kind = p.kind ?? 'parry';
      const tr = p.t1 ?? (kind === 'block' ? p.t0 + 0.45 : p.t0 + 0.2);
      const w = (u < -0.32 ? 0 : u < -0.18 ? 0.3 * smooth((u + 0.32) / 0.14) : u < -0.02 ? 0.3 + 0.7 * smooth((u + 0.18) / 0.16) : 1) * (1 - smooth((t - tr) / 0.45));
      if (w <= 0) continue;
      const P0 = ptAt(p.at, p.t0);
      const d = travelDir(p.at, p.t0, chestC, p.dir);
      const force = p.force ?? 1;
      let P = P0;
      if (u > 0) {
        P = add3(P, mul3(d, (kind === 'block' ? 0.07 : 0.04) * force * smooth(u / 0.06)));
        if (kind === 'parry') {
          const out = sub3(P0, chestC);
          const sw = norm3(sub3(out, mul3(d, dot3(out, d))));
          P = add3(P, mul3(sw, 0.2 * easeOut(u / 0.16)));
        }
      }
      const inward = mul3(cr, -sd);
      const dy = clamp(-d.y * 1.6);
      const a = norm3(lerp3(norm3(add3(mul3(UP, 0.8), mul3(inward, 0.6))), norm3(add3(inward, mul3(UP, 0.12))), dy));
      let across = p.across ? norm3(p.across) : a;
      across = norm3(sub3(across, mul3(d, dot3(across, d))));
      const Ed = sub3(P, mul3(across, U.fore * 0.55));
      let h = add3(P, mul3(across, U.fore * 0.45 + U.fist * 0.6));
      const pl = sub3(Ed, S);
      for (let it = 0; it < 3; it++) {
        const r = solveArm(S, h, pl);
        const ab = sub3(r.end, r.mid), L2 = Math.max(1e-6, dot3(ab, ab));
        const s = clamp(dot3(sub3(P, r.mid), ab) / L2, 0.25, 0.85);
        const C = add3(r.mid, mul3(ab, s));
        h = add3(h, sub3(P, C));
      }
      hand = lerp3(hand, h, w);
      pole = lerp3(pole, pl, w);
    }
    // shoves (and the brace's shove-back): palms
    for (const s of shoveList) {
      if (s.side !== 'both' && s.side !== side) continue;
      const u = t - s.t0;
      if (u < -0.34 || t > s.t1 + 0.5) continue;
      const pd = flat(sub3(s.target, root));
      const ac = norm3(cross3(UP, pd));
      const off = s.side === 'both' ? mul3(ac, sd * 0.14) : ZERO;
      const ch = add3(S, add3(add3(mul3(cu, -0.14), mul3(cf, 0.26)), mul3(cr, -sd * 0.08)));
      const T0 = add3(s.target, off);
      const P = u < -0.16 ? ch : u < 0 ? lerp3(ch, T0, easeIn2((u + 0.16) / 0.16)) : add3(T0, mul3(pd, 0.28 * easeOut2(u / 0.2)));
      const w = smooth((u + 0.34) / 0.18) * (1 - smooth((t - s.t1) / 0.5));
      hand = lerp3(hand, P, w);
      pole = lerp3(pole, add3(mul3(cu, -1), mul3(cr, sd * 0.6)), w);
      open[i] = open[i] || w > 0.3;
    }
    // stagger (R4): both arms flung out and up for balance
    if (stagArmsW > 0) {
      hand = lerp3(hand, add3(S, add3(add3(mul3(cu, 0.2), mul3(cf, 0.08)), mul3(cr, sd * 0.56))), stagArmsW);
      pole = lerp3(pole, add3(mul3(cu, -1), mul3(cf, -0.3)), stagArmsW);
    }
    // brace cover: both forearms up in front (before its shove)
    for (const b of braces) {
      const sh2 = b.shove === false ? undefined : b.shove ?? b.t0 + 0.4;
      const end = sh2 !== undefined ? sh2 - 0.3 : b.t1 ?? b.t0 + 0.8;
      const w = win(t, b.t0 - 0.5, end + 0.25, 0.3, 0.3);
      if (w <= 0) continue;
      hand = lerp3(hand, add3(S, add3(add3(mul3(cu, -0.08), mul3(cf, 0.34)), mul3(cr, -sd * 0.1))), w);
      pole = lerp3(pole, add3(mul3(cu, -1), mul3(cr, sd * 0.3)), w);
    }
    // strikes (combos: a same-side strike starts its wind-up from the previous one's follow-through)
    const own = strikes.filter((s) => s.side === side);
    const strikeHand = (j: number, rest0: V3): V3 => {
      const s = own[j];
      const sk = strikeK(t, s.t0)!;
      const prev = own[j - 1];
      const rest = prev && strikeK(t, prev.t0) && s.t0 - prev.t0 < 1.28 ? strikeHand(j - 1, rest0) : rest0;
      const T0 = s.target;
      const hammer = s.kind === 'hammer', hook = s.kind === 'hook';
      const wind = hook ? add3(S, add3(add3(mul3(cu, 0.04), mul3(cf, 0.02)), mul3(cr, sd * 0.48))) : add3(S, add3(add3(mul3(cu, hammer ? 0.55 : 0.12), mul3(cf, hammer ? -0.1 : -0.42)), mul3(cr, sd * 0.32)));
      const toT = norm3(sub3(T0, S));
      const through = add3(T0, mul3(toT, 0.22));
      // the wind-up arcs out and down around the shoulder (a straight line from a guard in front to a chamber behind
      // would pass through the shoulder)
      if (sk.ph === 'wind') return add3(lerp3(rest, wind, sk.k), mul3(add3(mul3(cr, sd * 0.08), mul3(cu, -0.22)), Math.sin(Math.PI * sk.k)));
      if (sk.ph === 'blow') {
        if (!hook) return lerp3(wind, T0, sk.k);
        const ctrl = add3(T0, add3(mul3(cr, sd * 0.42), mul3(cf, -0.12)));
        return add3(add3(mul3(wind, (1 - sk.k) ** 2), mul3(ctrl, 2 * sk.k * (1 - sk.k))), mul3(T0, sk.k * sk.k));
      }
      if (sk.ph === 'through') return lerp3(T0, through, sk.k * 0.6);
      return lerp3(add3(T0, mul3(toT, 0.13)), rest0, sk.k);
    };
    let active = -1;
    own.forEach((s, j) => { if (strikeK(t, s.t0)) active = j; });
    if (active >= 0) {
      const s = own[active];
      hand = strikeHand(active, hand);
      const u = t - s.t0;
      const prev = own[active - 1];
      const chained = !!prev && s.t0 - prev.t0 < 1.28;
      const pw = (chained ? 1 : smooth((u + 0.42) / 0.16)) * (1 - smooth((u - 0.6) / 0.25));
      const sPole = s.kind === 'hook' ? add3(mul3(cr, sd * 0.8), mul3(cu, 0.6)) : add3(mul3(cr, sd * 0.9), mul3(cu, s.kind === 'hammer' ? 0.4 : -0.5));
      pole = lerp3(pole, sPole, pw);
    }
    // wrist = hand target pulled back by the fist
    const r = solveArm(S, hand, pole);
    el.push(r.mid); wr.push(r.end);
  });
  return {pelvis, spine, neck: neckP, head, sh, el: el as [V3, V3], wr: wr as [V3, V3], hip, kn: kn as [V3, V3], an: an as [V3, V3], footR: footR as [R3, R3], chestR, fwd, down: 0, open, root: {x: footRoot.x, y: gy, z: footRoot.z}, heading};
};

/**
 * The largest topple angle (≤ maxA) at which the body (head, face, shoulders, chest, back, pelvis, knees) stays out of
 * the ground (6 cm clearance, 3 cm tolerance), toppling about the ankles toward fall.dir with the full crumple.
 */
const restAngle = (sp: UnitSpec, rig: UnitRig, maxA: number): number => {
  const g = sp.ground ?? FLAT;
  const d = norm3({x: sp.fall!.dir.x, y: 0, z: sp.fall!.dir.z});
  const axis = norm3(cross3(UP, d));
  const piv = mul3(add3(rig.an[0], rig.an[1]), 0.5);
  const pivot = {x: piv.x, y: g(piv.x, piv.z) + 0.16, z: piv.z};
  const probes = [apply(rig.head, {x: 0, y: 0.17, z: 0}), apply(rig.head, {x: 0, y: 0, z: -0.16}), rig.sh[0], rig.sh[1], rig.pelvis.pos, rig.kn[0], rig.kn[1], apply(rig.spine, {x: 0, y: 0.32, z: -0.24}), apply(rig.spine, {x: 0, y: 0.3, z: 0.24})];
  const pen = (a: number) => {
    const R = rotAxisM(axis, a);
    let m = -1e9;
    for (const p of probes) {
      const q0 = {x: p.x, y: p.y - 0.32 * clamp((p.y - pivot.y) / 1.0), z: p.z};
      const q = add3(pivot, rmul(R, sub3(q0, pivot)));
      m = Math.max(m, g(q.x, q.z) + 0.06 - q.y);
    }
    return m;
  };
  if (pen(0) > 0.03) return maxA; // already in the ground standing (a pit): leave it to the caller
  // first contact going over from upright (stable: never jumps to another contact further round)
  let lo = 0, hi = -1;
  for (let a = 3; a <= maxA + 1e-6; a += 3) { if (pen(a) > 0.03) { hi = a; break; } lo = a; }
  if (hi < 0) return maxA;
  for (let i = 0; i < 10; i++) { const m = (lo + hi) / 2; if (pen(m) <= 0.03) lo = m; else hi = m; }
  return lo;
};

/** Fall: crumple (knees) then topple about the feet, settle on the ground (persistent wreck). Returns a transform. */
const fallXform = (sp: UnitSpec, rig: UnitRig, t: number) => {
  if (!sp.fall || t < sp.fall.t0) return null;
  const u = t - sp.fall.t0;
  const g = sp.ground ?? FLAT;
  const d = norm3({x: sp.fall.dir.x, y: 0, z: sp.fall.dir.z});
  const axis = norm3(cross3(UP, d)); // rotating about this tips the body toward d
  let crumple = smooth(u / 0.28);
  const tu = clamp((u - 0.18) / 0.62);
  const A0 = sp.fall.ang ?? 86;
  // the body comes to rest where it meets the ground (a slope or rubble in the way props it up earlier): the topple
  // angle is limited to the largest angle at which nothing (head, shoulders, chest, pelvis, knees) goes into the ground
  const A = Math.min(A0, restAngle(sp, solveUnit({...sp, t: sp.fall.t0}), A0));
  let ang = A * easeIn(tu);
  if (u > 0.8) ang = A + Math.exp(-(u - 0.8) * 7) * Math.sin((u - 0.8) * 22) * -8 + (1 - Math.exp(-(u - 0.8) * 6)) * 2 * clamp((A - (A0 - 3)) / 3);
  let up = 0;
  if (sp.fall.getUp !== undefined && t > sp.fall.getUp) {
    // push up from the ground: torso rises first (to a crouch), then the legs straighten
    const g1 = smooth((t - sp.fall.getUp) / 1.1);
    ang = ang * (1 - g1);
    crumple = crumple * (1 - smooth((t - sp.fall.getUp - 0.6) / 0.7)) + 0.0;
    up = g1;
  }
  const piv = mul3(add3(rig.an[0], rig.an[1]), 0.5);
  const pivot = {x: piv.x, y: g(piv.x, piv.z) + 0.16 * smooth(tu * 1.5), z: piv.z};
  const R = rotAxisM(axis, ang);
  const drop = 0.32 * crumple;
  const xf0 = (p: V3) => {
    const q = {x: p.x, y: p.y - drop * clamp((p.y - pivot.y) / 1.0), z: p.z};
    const l = sub3(q, pivot);
    return add3(pivot, rmul(R, l));
  };
  void up;
  const xf = xf0;
  return {xf, R, Rrest: rotAxisM(axis, A), landT: sp.fall.t0 + 0.8, landPos: xf(rig.spine.pos)};
};

const rotPose = (P: Pose3, xf: (p: V3) => V3, R: R3): Pose3 => ({pos: xf(P.pos), R: rcomp(R, P.R)});

/**
 * The unit in the world at sp.t: the solved skeleton carried through a fall, with free arms going limp (gravity:
 * they fall with the body and lie on the ground beside it) and a getting-up blend back.
 */
export const unitWorld = (sp: UnitSpec): UnitRig => {
  const r = solveUnit(sp);
  const fx = fallXform(sp, r, sp.t);
  if (!fx) return r;
  const X = fx.xf, R = fx.R;
  const P = (p: Pose3): Pose3 => rotPose(p, X, R);
  const w: UnitRig = {
    ...r,
    pelvis: P(r.pelvis), spine: P(r.spine), neck: P(r.neck), head: P(r.head),
    sh: [X(r.sh[0]), X(r.sh[1])], el: [X(r.el[0]), X(r.el[1])], wr: [X(r.wr[0]), X(r.wr[1])],
    hip: [X(r.hip[0]), X(r.hip[1])], kn: [X(r.kn[0]), X(r.kn[1])], an: [X(r.an[0]), X(r.an[1])],
    footR: [rcomp(R, r.footR[0]), rcomp(R, r.footR[1])], chestR: rcomp(R, r.chestR),
    fwdW: rmul(R, r.fwd), fallXf: X, fallR: R, down: clamp((sp.t - sp.fall!.t0) / 0.8),
  };
  // limp arms: free arms (no explicit hand control, not grabbing / holding) drop with gravity
  if (sp.fall!.limp !== false) {
    const g = sp.ground ?? FLAT;
    const u = sp.t - sp.fall!.t0;
    const lw = smooth((u - 0.12) / 0.55) * (sp.fall!.getUp !== undefined ? 1 - smooth((sp.t - sp.fall!.getUp) / 0.6) : 1);
    if (lw > 0) {
      const el: [V3, V3] = [w.el[0], w.el[1]], wr: [V3, V3] = [w.wr[0], w.wr[1]];
      ([0, 1] as const).forEach((i) => {
        const side: Side = i === 0 ? 'L' : 'R';
        const busy = (i === 0 ? sp.armL?.hand : sp.armR?.hand) || (sp.grab && sp.grab.side === side) || arr(sp.restrain).some((q) => q.side === side || q.side === 'both');
        if (busy) return;
        const S = w.sh[i];
        const out = rmul(w.chestR, {x: i === 0 ? -1 : 1, y: 0, z: 0});
        const cur = add3(w.wr[i], mul3(norm3(sub3(w.wr[i], w.el[i])), U.fist * 0.55));
        // hanging target, and the lying-on-the-ground target (the arm along the ground, reaching out from the
        // shoulder); blended by how far the hanging hand would sink below the ground, so the hand never jumps
        const hang = add3(add3(S, {x: 0, y: -0.66, z: 0}), mul3(out, 0.2));
        const gyH = g(hang.x, hang.z) + 0.07;
        // (R4: the lying direction comes from where the body will REST, not from its pose this frame: the arm's outward and the
        // body axis both pass through the vertical in a topple, where their horizontal part flips from one side to the other —
        // the hand swung 0.8 m between two frames)
        const outF = rmul(fx.Rrest, rmul(r.chestR, {x: i === 0 ? -1 : 1, y: 0, z: 0}));
        const axF = norm3(rmul(fx.Rrest, sub3(r.pelvis.pos, r.head.pos)));
        const fd0 = flat(sp.fall!.dir);
        let hz = flat(add3(mul3(outF, 0.8), mul3(axF, 0.6)));
        if (len3(hz) < 0.5) hz = fd0;
        const drop = clamp(S.y - gyH, 0, 0.66);
        const along = Math.sqrt(Math.max(0, 0.66 * 0.66 - drop * drop));
        let lie = {x: S.x + hz.x * along, y: 0, z: S.z + hz.z * along};
        lie = {...lie, y: g(lie.x, lie.z) + 0.07};
        // the arm lies out along the ground only once the body is down (after the landing, over 0.4 s)
        // (R4: driven by the shoulder's height alone: the arm lies out along the ground as the shoulder comes down to it. It was
        // also held back until 0.78 s, so a shoulder already at the ground left the hand hanging on top of it (wrist < 0.1 m
        // from the shoulder) and the elbow flipped 0.4–0.7 m between frames)
        const below = smooth((gyH + 0.3 - hang.y) / 0.5);
        let L = lerp3(hang, lie, below);
        L = {...L, y: Math.max(L.y, g(L.x, L.z) + 0.07)};
        const H = L;
        const dir = norm3(sub3(H, S));
        // the elbow keeps its current bend direction and turns toward the limp one with the blend (no flip)
        const mid0 = lerp3(S, cur, 0.5);
        const pole0 = sub3(w.el[i], mid0);
        // limp elbow: bends toward the head side (never along the hanging or lying arm, so it cannot flip)
        const limpPole = norm3(add3(norm3(sub3(w.head.pos, w.pelvis.pos)), {x: 0, y: 0.3, z: 0}));
        const pole = lerp3(len3(pole0) > 1e-4 ? norm3(pole0) : limpPole, limpPole, lw);
        const sol = ik2(S, sub3(H, mul3(dir, U.fist * 0.5)), U.upper, U.fore, pole, LIMB_SOFT);
        // blend the solved joints themselves (continuous at the blend's start whatever the fall's squash did)
        el[i] = lerp3(w.el[i], sol.mid, lw); wr[i] = lerp3(w.wr[i], sol.end, lw);
      });
      w.el = el; w.wr = wr;
    }
    // once the body is down, the legs relax onto the ground along the body (no shin left sticking up in the air);
    // only after landing, so the feet (the topple's pivot) never slide while it falls
    const lk = smooth((u - 0.85) / 0.55) * (sp.fall!.getUp !== undefined ? 1 - smooth((sp.t - sp.fall!.getUp) / 0.4) : 1) * (sp.feet ? 0 : 1);
    if (lk > 0) {
      const axis = norm3(sub3(w.pelvis.pos, w.spine.pos)); // head → feet along the lying body
      const kn: [V3, V3] = [w.kn[0], w.kn[1]], an: [V3, V3] = [w.an[0], w.an[1]];
      ([0, 1] as const).forEach((i) => {
        const H = w.hip[i];
        const out = rmul(w.pelvis.R, {x: i === 0 ? -1 : 1, y: 0, z: 0});
        let A = add3(add3(H, mul3(axis, (U.thigh + U.shin) * 0.93)), mul3(out, 0.06));
        A = {...A, y: Math.max(A.y, g(A.x, A.z) + U.ankleH * 0.8)};
        const tgt = A;
        const pole0 = sub3(w.kn[i], lerp3(H, w.an[i], 0.5));
        const relaxed = norm3(add3(rmul(w.pelvis.R, {x: 0, y: 0, z: -1}), {x: 0, y: 0.3, z: 0}));
        const sol = ik2(H, tgt, U.thigh, U.shin, lerp3(len3(pole0) > 1e-4 ? norm3(pole0) : relaxed, relaxed, lk), LIMB_SOFT);
        kn[i] = lerp3(w.kn[i], sol.mid, lk); an[i] = lerp3(w.an[i], sol.end, lk);
      });
      w.kn = kn; w.an = an;
    }
  }
  // R4: every bone keeps its true length through the whole fall. The crumple squashes the skeleton (hips and shoulders
  // drop further than the ankles and wrists) and the limp / relax blends lerp joints, so the rigid thigh / shin /
  // upper-arm / forearm meshes overlapped or pulled off their joints by up to 0.15–0.23 m for ~1 s (measured by
  // qa/r4/mech/probe_fall_bones). The middle joint is re-solved from the root and the end (both kept), bend side kept.
  const kneePole = rmul(w.fallR ?? I3, r.fwd);
  const armPole = mul3(kneePole, -1);
  const bone = (S: V3, M: V3, E: V3, l1: number, l2: number, hint: V3): {mid: V3; end: V3} => {
    if (Math.abs(len3(sub3(M, S)) - l1) + Math.abs(len3(sub3(E, M)) - l2) < 0.004) return {mid: M, end: E};
    const ch = sub3(E, S), cl = len3(ch) || 1e-6, dir = mul3(ch, 1 / cl);
    const bent = sub3(M, add3(S, mul3(dir, dot3(sub3(M, S), dir))));
    const pole = add3(bent, mul3(hint, 0.03));
    const s = ik2(S, E, l1, l2, pole, LIMB_SOFT);
    return {mid: s.mid, end: s.end};
  };
  ([0, 1] as const).forEach((i) => {
    const lg = bone(w.hip[i], w.kn[i], w.an[i], U.thigh, U.shin, kneePole);
    w.kn[i] = lg.mid; w.an[i] = lg.end;
    const ar = bone(w.sh[i], w.el[i], w.wr[i], U.upper, U.fore, armPole);
    w.el[i] = ar.mid; w.wr[i] = ar.end;
  });
  // R4: contact. Nothing of the body goes into the ground: a unit that falls onto its side used to lie with the shoulder pad
  // 0.13 m (flat road) to 0.23 m (rubble) below the surface (the rest angle only tested head, shoulders, chest, pelvis and
  // knees as points). Every vertex of every part is tested against the ground at this frame; the body is lifted by the
  // deepest one (continuous in time: the body is pushed up by the ground as it comes down, then stays on it).
  const lift = fallLift(sp, w);
  if (lift > 1e-4) {
    const up = (p: V3): V3 => ({x: p.x, y: p.y + lift, z: p.z});
    const upP = (q: Pose3): Pose3 => ({pos: up(q.pos), R: q.R});
    w.pelvis = upP(w.pelvis); w.spine = upP(w.spine); w.neck = upP(w.neck); w.head = upP(w.head);
    w.sh = [up(w.sh[0]), up(w.sh[1])]; w.el = [up(w.el[0]), up(w.el[1])]; w.wr = [up(w.wr[0]), up(w.wr[1])];
    w.hip = [up(w.hip[0]), up(w.hip[1])]; w.kn = [up(w.kn[0]), up(w.kn[1])]; w.an = [up(w.an[0]), up(w.an[1])];
    const X0 = w.fallXf!;
    w.fallXf = (p) => up(X0(p));
  }
  return w;
};

/** how far (m) a falling unit's lowest part vertex is below the ground at this frame (0 = clear of it) */
const fallLift = (sp: UnitSpec, w: UnitRig): number => {
  if (sp.fall?.lift === false) return 0;
  const g = sp.ground ?? FLAT;
  const P = partPoses(w);
  let deepest = 0;
  for (const name of Object.keys(MESH)) {
    const q = P[name], m = UNIT[MESH[name]];
    if (!q) continue;
    for (const v of m.verts) {
      const p = apply(q, v);
      const d = g(p.x, p.z) - p.y;
      if (d > deepest) deepest = d;
    }
  }
  return deepest;
};

/** Attach points in world (after a fall). Times: pass {...sp, t: T} to read them at any film time. */
export const unitAttach = (sp: UnitSpec) => {
  const r = unitWorld(sp);
  const fistOf = (i: 0 | 1) => add3(r.wr[i], mul3(norm3(sub3(r.wr[i], r.el[i])), U.fist * 0.55));
  const foreOf = (i: 0 | 1) => lerp3(r.el[i], r.wr[i], 0.55);
  return {
    handL: fistOf(0), handR: fistOf(1), wristL: r.wr[0], wristR: r.wr[1], elbowL: r.el[0], elbowR: r.el[1],
    /** mid-forearm (the blocking surface) */
    forearmL: foreOf(0), forearmR: foreOf(1),
    /** the catching / gripping / shoving hand (same point as handL/R; named for contact solving) */
    catchL: fistOf(0), catchR: fistOf(1), gripL: fistOf(0), gripR: fistOf(1), palmL: fistOf(0), palmR: fistOf(1),
    shoulderL: r.sh[0], shoulderR: r.sh[1],
    eye: apply(r.head, {x: 0, y: 0.0, z: -0.17}), head: r.head.pos,
    chest: apply(r.spine, {x: 0, y: 0.32, z: -0.215}), backPlate: apply(r.spine, {x: 0, y: 0.3, z: 0.205}),
    kneeL: add3(r.kn[0], mul3(r.fwdW ?? r.fwd, 0.1)), kneeR: add3(r.kn[1], mul3(r.fwdW ?? r.fwd, 0.1)), pelvis: r.pelvis.pos,
    footL: r.an[0], footR: r.an[1], fwd: r.fwd,
    /** the root on the ground under the unit (after moves / turns / press / dodge steps) and its heading */
    root: r.root, heading: r.heading,
  };
};
/** The unit's root (ground point) and heading at sp.t after its locomotion behaviours: chain the next action from it. */
export const unitRoot = (sp: UnitSpec): {pos: V3; heading: number} => { const r = solveUnit(sp); return {pos: r.root, heading: r.heading}; };

// ------------------------------------------------------------------ debris bodies (torn parts)
const TORSO_HINGE: Record<string, V3> = {chest: {x: 0, y: 0.06, z: -0.14}, back: {x: 0, y: 0.52, z: 0.19}, pauldronL: {x: 0.05, y: 0.02, z: 0}, pauldronR: {x: -0.05, y: 0.02, z: 0}};
const partBody = (name: string): Body => bodyOf([{mesh: UNIT[MESH[name]]}], `unit_${name}`);
const armNames = (s: Side, at: 'shoulder' | 'elbow') => (at === 'elbow' ? ['fore' + s, 'fist' + s] : ['upper' + s, 'pauldron' + s, 'fore' + s, 'fist' + s]);
const tornLaunch = (sp: UnitSpec, name: string, d: Tear, seedK: number): {body: Body; L: Launch} => {
  const r0 = unitWorld({...sp, t: d.t0});
  const P0 = partPoses(r0)[name];
  const body = partBody(name);
  const prev = unitWorld({...sp, t: d.t0 - 1 / 30});
  const inherit = mul3(sub3(r0.spine.pos, prev.spine.pos), 30 * 0.6);
  const L = tearLaunch(body, d.t0, P0, d.dir, d.speed ?? 4, sp.id * 17 + seedK, {hinge: TORSO_HINGE[name], up: 0.3, spin: 4, inherit});
  return {body, L};
};
/** the torn arm as one rigid body about its root joint; it hangs on its cables for `hang` s first (the joint gives) */
const armDebris = (sp: UnitSpec) => {
  const D = sp.damage!.armOff!;
  const at = D.at ?? 'shoulder';
  const hang = D.hang ?? 0.1;
  const r0 = unitWorld({...sp, t: D.t0});
  const P0 = partPoses(r0);
  const names = armNames(D.side, at);
  const root0 = P0[names[0]];
  const inv = (p: Pose3): Pose3 => ({pos: rmul(transpose(root0.R), sub3(p.pos, root0.pos)), R: rcomp(transpose(root0.R), p.R)});
  const rel = names.map((n) => ({n, P: inv(P0[n])}));
  const body = bodyOf(rel.map((q) => ({mesh: UNIT[MESH[q.n]], P: q.P})), `unit_arm_${at}_${D.side}`);
  // the hang: the limb swings about its joint along the blow, the joint following the body
  const dir = norm3(D.dir);
  const armAxis = norm3(cross3(rmul(root0.R, {x: 0, y: -1, z: 0}), dir));
  const omega = (D.speed ?? 5) * 2.2; // rad/s about the joint
  const jointAt = (t: number) => { const rw = unitWorld({...sp, t}); return at === 'elbow' ? rw.el[D.side === 'L' ? 0 : 1] : rw.sh[D.side === 'L' ? 0 : 1]; };
  const hangPose = (t: number): Pose3 => {
    const u = clamp(t - D.t0, 0, hang);
    const ang = (omega * u + 0.5 * 14 * u * u) * 57.3;
    const R = rcomp(rotAxisM(len3(armAxis) > 0.1 ? armAxis : {x: 1, y: 0, z: 0}, ang), root0.R);
    return {pos: jointAt(D.t0 + u), R};
  };
  const Pr = hangPose(D.t0 + hang);
  const comW = add3(Pr.pos, rmul(Pr.R, body.com));
  const wv = mul3(len3(armAxis) > 0.1 ? armAxis : {x: 1, y: 0, z: 0}, omega + 14 * hang);
  const v = add3(cross3(wv, sub3(comW, Pr.pos)), mul3(dir, (D.speed ?? 5) * 0.45));
  const L: Launch = {t0: D.t0 + hang, pos: Pr.pos, R: Pr.R, v, w: wv};
  return {body, L, rel, hangPose, hang, jointAt};
};
const transpose = (R: R3): R3 => ({x: {x: R.x.x, y: R.y.x, z: R.z.x}, y: {x: R.x.y, y: R.y.y, z: R.z.y}, z: {x: R.x.z, y: R.y.z, z: R.z.z}});

/** Damage / fall / contact events as impact descriptors for FX (sparks, dust, sound sync). */
export const unitImpacts = (sp: UnitSpec): Impact[] => {
  const out: Impact[] = [];
  const at = (t0: number) => unitAttach({...sp, t: t0});
  const g = sp.ground ?? FLAT;
  const D = sp.damage;
  if (D?.chest) out.push({t: D.chest.t0, pos: at(D.chest.t0).chest, dir: D.chest.dir, strength: D.chest.speed ?? 4, kind: 'plate'});
  if (D?.back) out.push({t: D.back.t0, pos: at(D.back.t0).backPlate, dir: D.back.dir, strength: D.back.speed ?? 3, kind: 'plate'});
  if (D?.pauldronL) out.push({t: D.pauldronL.t0, pos: at(D.pauldronL.t0).shoulderL, dir: D.pauldronL.dir, strength: 3, kind: 'plate'});
  if (D?.pauldronR) out.push({t: D.pauldronR.t0, pos: at(D.pauldronR.t0).shoulderR, dir: D.pauldronR.dir, strength: 3, kind: 'plate'});
  if (D?.armOff) {
    const a = at(D.armOff.t0);
    const p = D.armOff.side === 'L' ? (D.armOff.at === 'elbow' ? a.elbowL : a.shoulderL) : (D.armOff.at === 'elbow' ? a.elbowR : a.shoulderR);
    out.push({t: D.armOff.t0, pos: p, dir: D.armOff.dir, strength: D.armOff.speed ?? 5, kind: 'limb'}, {t: D.armOff.t0, pos: p, dir: D.armOff.dir, strength: 2, kind: 'cable'}, {t: D.armOff.t0 + 0.05, pos: p, dir: D.armOff.dir, strength: 2, kind: 'fluid'});
  }
  // where torn pieces land (clatter, dust): kind 'debris'
  if (D) {
    (['chest', 'back', 'pauldronL', 'pauldronR'] as const).forEach((n, k) => {
      const d = D[n];
      if (!d) return;
      const {body, L} = tornLaunch(sp, n, d, k + 1);
      const l = debrisLanding(body, L, g);
      out.push({t: l.t, pos: l.pos, dir: {x: 0, y: -1, z: 0}, strength: 1.2, kind: 'debris', note: n});
    });
    if (D.armOff) {
      const a = armDebris(sp);
      const l = debrisLanding(a.body, a.L, g);
      out.push({t: l.t, pos: l.pos, dir: {x: 0, y: -1, z: 0}, strength: 2, kind: 'debris', note: 'arm'});
    }
  }
  strikeList(sp).forEach((s) => out.push({t: s.t0, pos: s.target, dir: norm3(sub3(s.target, at(s.t0 - 0.4)[s.side === 'R' ? 'shoulderR' : 'shoulderL'])), strength: 3, kind: 'blow', side: s.side}));
  arr(sp.parry).forEach((p) => {
    const P = ptAt(p.at, p.t0);
    out.push({t: p.t0, pos: P, dir: travelDir(p.at, p.t0, at(p.t0).chest, p.dir), strength: (p.kind ?? 'parry') === 'block' ? 2.5 : 1.5, kind: p.kind ?? 'parry', side: p.side});
  });
  arr(sp.catch).forEach((c) => out.push({t: c.t0, pos: ptAt(c.at, c.t0), dir: travelDir(c.at, c.t0, at(c.t0).chest, c.dir), strength: 1.5, kind: 'catch', side: c.side === 'both' ? undefined : c.side}));
  arr(sp.shove).forEach((s) => out.push({t: s.t0, pos: ptAt(s.target, s.t0), dir: flat(sub3(ptAt(s.target, s.t0), at(s.t0).pelvis)), strength: 2, kind: 'shove'}));
  arr(sp.brace).forEach((b) => {
    out.push({t: b.t0, pos: at(b.t0).chest, dir: norm3(b.dir), strength: 2.5 * (b.force ?? 1), kind: 'block'});
    const sh = b.shove === false ? undefined : b.shove ?? b.t0 + 0.4;
    if (sh !== undefined) { const a = at(sh); out.push({t: sh, pos: lerp3(a.palmL, a.palmR, 0.5), dir: mul3(flat(b.dir), -1), strength: 2, kind: 'shove'}); }
  });
  // planted steps (footfalls) of the standing locomotion: kind 'step'
  const loco = sp.gait ? null : locoOf(sp);
  if (loco) {
    ([loco.L, loco.R] as FK[][]).forEach((F, i) => F.forEach((k, j) => {
      if (j === 0) return;
      const p = F[j - 1];
      if (Math.hypot(k.x - p.x, k.z - p.z) < 0.02 && Math.abs(wrapD(k.h - p.h)) < 3) return;
      out.push({t: k.t, pos: {x: k.x, y: g(k.x, k.z), z: k.z}, dir: {x: 0, y: -1, z: 0}, strength: 1, kind: 'step', side: i === 0 ? 'L' : 'R'});
    }));
  }
  if (sp.fall) {
    const fs = {...sp, t: sp.fall.t0 + 0.8};
    const r = solveUnit(fs);
    const fx = fallXform(sp, r, sp.fall.t0 + 0.8);
    if (fx) out.push({t: fx.landT, pos: fx.landPos, dir: {x: 0, y: -1, z: 0}, strength: 4, kind: 'ground'});
  }
  if (sp.lockAt !== undefined) out.push({t: sp.lockAt, pos: at(sp.lockAt).eye, dir: at(sp.lockAt).fwd, strength: 1, kind: 'eye'});
  return out;
};

/** Pose of a part at its attachment (world, from a solved / world rig). */
type PartPoses = Record<string, Pose3>;
const partPoses = (r: UnitRig): PartPoses => {
  const fwdHint = r.fwdW ?? r.fwd;
  const P: PartPoses = {};
  P.pelvis = r.pelvis;
  P.core = r.spine;
  P.chest = r.spine;
  P.back = r.spine;
  P.neck = r.neck;
  P.head = r.head;
  ([0, 1] as const).forEach((i) => {
    const s = i === 0 ? 'L' : 'R';
    const upR = segFrame(sub3(r.el[i], r.sh[i]), fwdHint);
    const foR = segFrame(sub3(r.wr[i], r.el[i]), add3(fwdHint, mul3(rmul(r.chestR, {x: 1, y: 0, z: 0}), i === 0 ? 0.6 : -0.6)));
    P['upper' + s] = {pos: r.sh[i], R: upR};
    P['pauldron' + s] = {pos: r.sh[i], R: slerpish(r.chestR, upR, 0.45)};
    P['fore' + s] = {pos: r.el[i], R: foR};
    P['fist' + s] = {pos: r.wr[i], R: foR};
    P['thigh' + s] = {pos: r.hip[i], R: segFrame(sub3(r.kn[i], r.hip[i]), fwdHint)};
    P['shin' + s] = {pos: r.kn[i], R: segFrame(sub3(r.an[i], r.kn[i]), fwdHint)};
    P['foot' + s] = {pos: r.an[i], R: r.footR[i]};
  });
  return P;
};

const MESH: Record<string, keyof typeof UNIT> = {
  pelvis: 'pelvis', core: 'core', chest: 'chest', back: 'back', neck: 'neck', head: 'head',
  upperL: 'upperL', upperR: 'upperR', pauldronL: 'pauldronL', pauldronR: 'pauldronR', foreL: 'foreL', foreR: 'foreR',
  fistL: 'fistL', fistR: 'fistR', thighL: 'thighL', thighR: 'thighR', shinL: 'shinL', shinR: 'shinR', footL: 'footL', footR: 'footR',
};

/** Engine items for one combat unit at sp.t. */
export const combatUnit = (sp: UnitSpec): Item[] => {
  const t = sp.t;
  const key = sp.key ?? `u${sp.id}`;
  const g = sp.ground ?? FLAT;
  const r = unitWorld(sp);
  const fallen = !!r.fallXf;
  const lod = sp.lod ?? 'full';
  const D = sp.damage ?? {};
  const deadEye = D.dead && t >= D.dead.t0;
  const downNow = !!sp.fall && t > sp.fall.t0 + 0.5 && (sp.fall.getUp === undefined || t < sp.fall.getUp + 0.3);
  const eyeState: 'cyan' | 'amber' | 'off' = deadEye || (downNow && sp.fall?.getUp === undefined) ? 'off' : downNow ? 'cyan' : sp.lockAt !== undefined && t >= sp.lockAt ? 'amber' : sp.eye ?? 'cyan';
  const eyeRemap = eyeState === 'amber' ? {m_eye: 'm_eyeLock'} : eyeState === 'off' ? {m_eye: 'm_eyeOff'} : undefined;
  const P = partPoses(r);
  const items: Item[] = [];
  const tornAt = (d?: {t0: number}) => !!d && t >= d.t0;
  const armOff = D.armOff;
  const offParts = (s: Side): string[] => (armOff && armOff.side === s && t >= armOff.t0 ? armNames(s, armOff.at ?? 'shoulder') : []);
  const removed = new Set<string>([...offParts('L'), ...offParts('R')]);
  if (tornAt(D.chest)) removed.add('chest');
  if (tornAt(D.back)) removed.add('back');
  if (tornAt(D.pauldronL)) removed.add('pauldronL');
  if (tornAt(D.pauldronR)) removed.add('pauldronR');
  const eyeW = apply(r.head, {x: 0, y: 0, z: -0.17});
  // ---------------- torn pieces: gravity-true debris (drawn at full and mid LOD: they never vanish with distance)
  const debris = (): Item[] => {
    const out: Item[] = [];
    (['chest', 'back', 'pauldronL', 'pauldronR'] as const).forEach((n, k) => {
      const d = D[n];
      if (!d || t < d.t0) return;
      const {body, L} = tornLaunch(sp, n, d, k + 1);
      out.push(partItem(UNIT[MESH[n]], debrisPose(body, L, t, g), `${key}_torn_${n}`, lod === 'mid' ? {inkScale: 0.9} : {}));
    });
    if (armOff && t >= armOff.t0) {
      const a = armDebris(sp);
      const Q = t < armOff.t0 + a.hang ? a.hangPose(t) : debrisPose(a.body, a.L, t, g);
      a.rel.forEach(({n, P: rp}) => out.push(partItem(UNIT[MESH[n]], {pos: add3(Q.pos, rmul(Q.R, rp.pos)), R: rcomp(Q.R, rp.R)}, `${key}_off_${n}`, lod === 'mid' ? {inkScale: 0.9} : {})));
      if (lod === 'full') {
        const stumpW = a.jointAt(t);
        // cables: stretched between stump and limb while it hangs and just after, then snapped and hanging
        const u = t - armOff.t0;
        CABLES.forEach((c, k) => {
          if (u < a.hang + 0.12) {
            out.push(cable(stumpW, add3(Q.pos, rmul(Q.R, {x: (k - 1.5) * 0.025, y: -0.02, z: 0})), 0.01, c, 0.018, `${key}_snap${k}`, true, 4));
          } else {
            const swing = Math.sin(u * 6 + k) * Math.exp(-u * 1.5) * 0.08;
            const end = add3(stumpW, {x: swing + (k - 1.5) * 0.03, y: -0.16 - k * 0.03, z: 0.05 * (k % 2 ? 1 : -1)});
            out.push(cable(stumpW, end, 0.02, c, 0.018, `${key}_snap${k}`, true, 4));
          }
        });
        out.push(...spray(t, armOff.t0, stumpW, armOff.dir, 14, 3.5, 'spark', sp.id * 3 + 1, `${key}_sp`, g, 0.6));
        out.push(...spray(t, armOff.t0 + 0.04, stumpW, add3(armOff.dir, {x: 0, y: 0.3, z: 0}), 10, 2.2, 'fluid', sp.id * 5 + 2, `${key}_fl`, g, 1.0));
      }
    }
    return out;
  };
  const dentK = D.dent ? easeOut((t - D.dent.t0) / 0.12) * (t >= D.dent.t0 ? 1 : 0) : 0;
  if (lod === 'far') return unitFar(sp, r, P, removed, eyeState, key, debris().filter((i) => i.kind === 'mesh'));
  if (lod === 'mid') {
    // R4: the same anatomy as 'full' (head with its own pose, fists, feet, chest and back plates over the frame, stumps),
    // each part a simplified block with the full part's size: only interior detail differs. A torn plate stays torn.
    const MID: Record<string, Prepped> = {pelvis: UNIT_MID.pelvis, core: UNIT_MID.core, head: UNIT_MID.head, thighL: UNIT_MID.thigh, thighR: UNIT_MID.thigh, upperL: UNIT_MID.upperL, upperR: UNIT_MID.upperR, fistL: UNIT_MID.fist, fistR: UNIT_MID.fist, footL: UNIT_MID.foot, footR: UNIT_MID.foot};
    for (const name of Object.keys(MESH)) {
      if (removed.has(name)) continue;
      let Pp = P[name];
      if (name === 'chest' && D.dent && dentK > 0) Pp = {pos: Pp.pos, R: rcomp(Pp.R, euler(D.dent.deg * 0.3 * dentK, -D.dent.deg * 0.2 * dentK, D.dent.deg * 0.4 * dentK))};
      items.push(partItem(MID[name] ?? UNIT[MESH[name]], Pp, `${key}_m_${name}`, {inkScale: MID_INK, ...(name === 'head' ? {remap: eyeRemap} : {})}));
    }
    for (const s of ['L', 'R'] as const) {
      if (offParts(s).length) {
        const at = armOff!.at === 'elbow' ? {pos: r.el[s === 'L' ? 0 : 1], R: P['upper' + s].R} : {pos: r.sh[s === 'L' ? 0 : 1], R: slerpish(r.chestR, P['upper' + s].R, 0.3)};
        items.push(partItem(UNIT.stump, at, `${key}_m_stump${s}`, {inkScale: MID_INK}));
      }
    }
    if (eyeState !== 'off') items.push(eyeGlow(eyeW, eyeState, 0.8, 0.035, `${key}_eg`, 0.06, fallen ? undefined : rmul(r.head.R, {x: 0, y: 0, z: -1})));
    items.push(...debris());
    return items;
  }
  for (const name of Object.keys(MESH)) {
    if (removed.has(name)) continue;
    let Pp = P[name];
    if (name === 'chest' && D.dent && dentK > 0) Pp = {pos: Pp.pos, R: rcomp(Pp.R, euler(D.dent.deg * 0.3 * dentK, -D.dent.deg * 0.2 * dentK, D.dent.deg * 0.4 * dentK))};
    let mesh = UNIT[MESH[name]];
    if ((name === 'fistL' && r.open[0]) || (name === 'fistR' && r.open[1])) mesh = name === 'fistL' ? UNIT.handL : UNIT.handR;
    items.push(partItem(mesh, Pp, `${key}_${name}`, name === 'head' ? {remap: eyeRemap} : {}));
  }
  // stumps where limbs came off
  for (const s of ['L', 'R'] as const) {
    if (offParts(s).length) {
      const at = armOff!.at === 'elbow' ? {pos: r.el[s === 'L' ? 0 : 1], R: P['upper' + s].R} : {pos: r.sh[s === 'L' ? 0 : 1], R: slerpish(r.chestR, P['upper' + s].R, 0.3)};
      items.push(partItem(UNIT.stump, at, `${key}_stump${s}`));
    }
  }
  // the eye
  if (eyeState !== 'off') items.push(eyeGlow(eyeW, eyeState, 0.9 + 0.1 * Math.sin(t * 9 + sp.id), 0.03, `${key}_eg`, 0.06, fallen ? undefined : rmul(r.head.R, {x: 0, y: 0, z: -1})));
  items.push(...debris());
  // exposed wiring where the chest plate came off
  if (tornAt(D.chest)) {
    const sp0 = r.spine;
    CABLES.forEach((c, k) => {
      const a = apply(sp0, {x: -0.12 + k * 0.08, y: 0.08 + (k % 2) * 0.06, z: -0.13});
      const b = apply(sp0, {x: -0.14 + k * 0.09, y: 0.44, z: -0.12});
      items.push(cable(a, b, -0.05 - (k % 2) * 0.03, c, 0.022, `${key}_wire${k}`, true, 5));
    });
    items.push(...spray(t, D.chest!.t0, apply(sp0, {x: 0, y: 0.3, z: -0.15}), D.chest!.dir, 10, 3, 'spark', sp.id * 7 + 3, `${key}_csp`, g, 0.5));
  }
  // leaking fluid and the pool under a downed unit
  if (D.leak && t >= D.leak.t0) {
    const src = apply(r.spine, {x: 0.05, y: 0.15, z: -0.1});
    const per = 0.7;
    const k = Math.floor((t - D.leak.t0) / per);
    items.push(...spray(t, D.leak.t0 + k * per, src, {x: 0, y: -0.2, z: 0}, 3, 0.6, 'fluid', sp.id * 11 + k, `${key}_lk${k}`, g, 0.7));
  }
  if (sp.fall && sp.fall.getUp === undefined && t > sp.fall.t0 + 0.8 && (D.leak || D.armOff || D.chest)) {
    const fx = unitWorld({...sp, t: sp.fall.t0 + 0.8});
    const c = fx.spine.pos;
    const pool = fluidPool({x: c.x, y: 0, z: c.z}, t, sp.fall.t0 + 0.8, 0.9, sp.id, `${key}_pool`, g);
    if (pool) items.push(pool);
  }
  return items;
};

/**
 * Far LOD (R4): drawn from the same solved skeleton as the meshes (see kit.farFigure): the torso with its shoulder pads
 * and pelvis as one hull, the head, arms and legs as tubes along their joints, feet, and any torn piece lying where it
 * fell. It follows the view angle and the pose, and shows a torn plate or arm as torn.
 */
/** far LOD colour multiplier: the mid unit's dark ink lines and frame parts, averaged (measured: qa/r4/mech/lod_*) */
const FAR_TONE = 0.66;
const unitFar = (sp: UnitSpec, r: UnitRig, P: PartPoses, removed: Set<string>, eye: 'cyan' | 'amber' | 'off', key: string, debris: Item[]): Item[] => {
  const fallen = !!r.fallXf;
  const prims: FarPrim[] = [];
  const sc = P.core;
  const at = (p: Pose3, x: number, y: number, z: number) => apply(p, {x, y, z});
  // torso: chest box, shoulder pads and pelvis as one hull. Its tone is the front plate, the back plate seen from behind,
  // or the bare frame where that plate is torn off.
  const tp: V3[] = [];
  for (const x of [-0.26, 0.26]) for (const y of [0.0, 0.54]) for (const z of [-0.255, 0.2]) tp.push(at(sc, x * (y < 0.1 ? 0.75 : 1), y, z));
  (['L', 'R'] as const).forEach((sd, i) => { if (!removed.has('pauldron' + sd)) { const sg = i === 0 ? -1 : 1; tp.push(at(sc, sg * 0.47, 0.52, 0), at(sc, sg * 0.43, 0.38, 0), at(sc, sg * 0.4, 0.5, -0.12), at(sc, sg * 0.4, 0.5, 0.12)); } });
  for (const x of [-0.21, 0.21]) for (const y of [-0.24, 0.1]) for (const z of [-0.15, 0.15]) tp.push(at(P.pelvis, x, y, z));
  const frontTone = meshTone(removed.has('chest') ? UNIT.core : UNIT.chest), backTone = meshTone(removed.has('back') ? UNIT.core : UNIT.back);
  prims.push({t: 'hull', pts: tp, tone: frontTone, n: rmul(r.chestR, {x: 0, y: 0, z: -1})});
  const head: V3[] = [];
  for (const x of [-0.13, 0.13]) for (const y of [-0.14, 0.17]) for (const z of [-0.17, 0.12]) head.push(at(P.head, x, y, z));
  prims.push({t: 'hull', pts: head, tone: meshTone(UNIT.head)});
  const armTone = meshTone(UNIT.foreL), upTone = meshTone(UNIT.upperL), thTone = meshTone(UNIT.thighL), shTone = meshTone(UNIT.shinL), ftTone = meshTone(UNIT.footL);
  (['L', 'R'] as const).forEach((sd, i) => {
    if (!removed.has('upper' + sd)) prims.push({t: 'tube', pts: [r.sh[i], r.el[i]], w: 0.13, tone: upTone});
    if (!removed.has('fore' + sd)) prims.push({t: 'tube', pts: [r.el[i], add3(r.wr[i], mul3(norm3(sub3(r.wr[i], r.el[i])), 0.09))], w: 0.14, tone: armTone});
    prims.push({t: 'tube', pts: [r.hip[i], r.kn[i]], w: 0.17, tone: thTone}, {t: 'tube', pts: [r.kn[i], r.an[i]], w: 0.17, tone: shTone});
    const ft: V3[] = [];
    for (const x of [-0.09, 0.09]) for (const y of [-0.1, 0]) for (const z of [-0.27, 0.1]) ft.push(at(P['foot' + sd], x, y, z));
    prims.push({t: 'hull', pts: ft, tone: ftTone});
  });
  const item = farFigure(prims, r.pelvis.pos, key, {
    tone: FAR_TONE,
    eye: eye !== 'off' ? {pos: at(r.head, 0, 0, -0.17), dir: fallen ? undefined : rmul(r.head.R, {x: 0, y: 0, z: -1}), color: eye, r: 0.03} : undefined,
    toneFor: (i, facing) => (i === 0 ? (facing ? frontTone : backTone) : undefined),
  });
  return [item, ...debris.map((d, i): Item => farFigure([meshPrim(d as MeshItem)], (d as MeshItem).xf?.pos ?? r.pelvis.pos, `${key}_fd${i}`, {tone: FAR_TONE}))];
};

export {DEBRIS};
void [I3, rnd];
