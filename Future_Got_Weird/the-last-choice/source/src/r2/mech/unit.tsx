// Combat unit: a 2.2 m armoured humanoid with one sensor eye. Articulated rigid parts posed by functions of time:
// march with planted feet, halt, turn, look, strike (wind-up → blow → follow-through → recover), grab, block, raise
// an arm, recoil from hits, crumple-and-topple falls that end as a persistent wreck, plates and limbs torn off.
import React from 'react';
import {V3, add3, sub3, mul3, dot3, cross3, norm3, len3, lerp, lerp3, clamp, smooth, easeIn, easeOut, rnd, noise, seg, f2} from '../../kit/math';
import {Item, View, project, toView, shade, inkColor} from '../engine';
import {UNIT, UNIT_MID, U, DEBRIS} from './parts';
import {R3, Pose3, rotHeading, rcomp, euler, segFrame, ik2, apply, rmul, rotAxisM, I3, lookFrame, fwdOf, slerpish} from './mat3';
import {Ground, FLAT, Path, footAt, partItem, eyeGlow, makeThrow, thrownPose, spray, cable, fluidPool, CABLES} from './kit';

export type Side = 'L' | 'R';
export type Impact = {t: number; pos: V3; dir: V3; strength: number; kind: 'plate' | 'limb' | 'cable' | 'fluid' | 'ground' | 'blow' | 'eye'};

export type ArmCtl = {hand?: V3; pole?: V3; open?: boolean};
export type UnitDamage = {
  /** chest plate torn off forward-ish along dir */
  chest?: {t0: number; dir: V3; speed?: number};
  /** back plate pried off */
  back?: {t0: number; dir: V3; speed?: number};
  pauldronL?: {t0: number; dir: V3; speed?: number};
  pauldronR?: {t0: number; dir: V3; speed?: number};
  /** an arm torn off at the shoulder (or the forearm at the elbow) */
  armOff?: {side: Side; t0: number; dir: V3; at?: 'shoulder' | 'elbow'; speed?: number};
  /** permanent dent: torso knocked askew from this time (deg) */
  dent?: {t0: number; deg: number};
  /** dark fluid leaking from the torso after t0 (pool when down) */
  leak?: {t0: number};
  /** the eye goes dark at t0 (destroyed / switched off) */
  dead?: {t0: number};
};
export type UnitSpec = {
  id: number;
  t: number;
  pos: V3;
  heading: number;
  /** march: pelvis follows path(dist); feet planted. stride = cycle length (m) */
  gait?: {path: Path; dist: number; stride?: number; lift?: number; /** path distance where walking starts / stops: feet blend from/to a standing stance over 0.6 m (no pops) */ start?: number; end?: number};
  /** extra crouch (m) */
  crouch?: number;
  lean?: number; // deg forward
  twist?: number; // deg (+ = turn left)
  /** head look target (world) */
  look?: V3;
  armL?: ArmCtl;
  armR?: ArmCtl;
  strike?: {t0: number; side: Side; target: V3; kind?: 'punch' | 'hammer'};
  block?: {t0: number; t1: number; side: Side};
  grab?: {t0: number; side: Side; target: V3; hold?: (t: number) => V3};
  raise?: {t0: number; t1: number; side: Side};
  hits?: {t0: number; dir: V3; strength: number}[];
  /** knocked down (crumple → topple → settle); with getUp the unit rises again from that time (machines do) */
  fall?: {t0: number; dir: V3; getUp?: number; /** final topple angle (deg, default 86); > 90 lies down a slope, < 86 rests propped */ ang?: number};
  eye?: 'cyan' | 'amber' | 'off';
  /** eye turns amber at this time (commit) */
  lockAt?: number;
  damage?: UnitDamage;
  ground?: Ground;
  lod?: 'full' | 'mid' | 'far';
  /** idle sway amount (0 = statue) */
  idle?: number;
  key?: string;
  /** formation passthrough: gait start/end (see gait.start/end) */
  gaitStart?: number;
  gaitEnd?: number;
  /**
   * explicit world footholds (ground contact points), overriding the gait/standing feet per foot: planted stagger
   * steps, a skid, a knee down (pair with crouch). pitchL/R tilt the foot (deg). Optional; absent = unchanged.
   */
  feet?: {L?: V3; R?: V3; pitchL?: number; pitchR?: number};
};

export type UnitRig = {
  pelvis: Pose3; spine: Pose3; neck: Pose3; head: Pose3;
  sh: [V3, V3]; el: [V3, V3]; wr: [V3, V3]; hip: [V3, V3]; kn: [V3, V3]; an: [V3, V3];
  footR: [R3, R3]; chestR: R3; fwd: V3; down: number; // fall progress 0..1
  open: [boolean, boolean];
  fallXf?: (p: V3) => V3; fallR?: R3;
};

const UP: V3 = {x: 0, y: 1, z: 0};
const hv = (h: number): V3 => ({x: Math.sin((h * Math.PI) / 180), y: 0, z: -Math.cos((h * Math.PI) / 180)});
const rightOf = (h: number): V3 => ({x: Math.cos((h * Math.PI) / 180), y: 0, z: Math.sin((h * Math.PI) / 180)});

/** strike phase: wind-up (−0.38..−0.1), blow (−0.1..0), follow-through (0..0.22), recover (0.22..0.8) relative to t0 */
const strikeK = (t: number, t0: number) => {
  const u = t - t0;
  if (u < -0.42 || u > 0.85) return null;
  if (u < -0.1) return {ph: 'wind' as const, k: smooth((u + 0.42) / 0.32)};
  if (u < 0) return {ph: 'blow' as const, k: easeIn((u + 0.1) / 0.1)};
  if (u < 0.22) return {ph: 'through' as const, k: easeOut(u / 0.22)};
  return {ph: 'recover' as const, k: smooth((u - 0.22) / 0.63)};
};

/** Solve the skeleton (world joints) at time t. */
export const solveUnit = (sp: UnitSpec): UnitRig => {
  const g = sp.ground ?? FLAT;
  const t = sp.t;
  const seed = sp.id;
  let heading = sp.heading;
  let root = sp.pos;
  let walkPh = 0, walking = false;
  let walkK = 0;
  if (sp.gait) {
    const p = sp.gait.path(sp.gait.dist);
    root = p.pos;
    heading = p.heading;
    walkPh = sp.gait.dist / (sp.gait.stride ?? 1.5);
    walking = true;
    const st = sp.gait.start ?? -1e9, en = sp.gait.end ?? 1e9;
    walkK = smooth((sp.gait.dist - st) / 0.6) * (1 - smooth((sp.gait.dist - (en - 0.6)) / 0.6));
  }
  const fwd = hv(heading), right = rightOf(heading);
  const B = rotHeading(heading);
  const gy = g(root.x, root.z);
  // hits: stagger + recoil (torso pitches away from the blow)
  let recoil = 0, stag: V3 = {x: 0, y: 0, z: 0};
  (sp.hits ?? []).forEach((h) => {
    const u = t - h.t0;
    if (u < 0 || u > 1.2) return;
    const e = Math.exp(-u * 5) * Math.sin(Math.min(u * 14, Math.PI * 0.5 + u * 6)) * h.strength;
    const d = norm3({x: h.dir.x, y: 0, z: h.dir.z});
    stag = add3(stag, mul3(d, 0.18 * h.strength * smooth(u / 0.25) * (1 - smooth((u - 0.3) / 0.9) * 0.4)));
    recoil += e * 22 * Math.sign(dot3(d, fwd) || 1) * -1;
  });
  const footRoot = root; // standing feet stay where they are; a hit shoves the pelvis, not the feet
  root = add3(root, stag);
  const idle = sp.idle ?? 1;
  const breath = Math.sin(t * 1.3 + seed) * 0.008 * idle;
  // marching: knees stay bent (a low, purposeful gait) so the planted foot is always within reach — no foot slide
  const bob = walking ? (0.085 + 0.03 * (1 - Math.cos(walkPh * Math.PI * 4)) * 0.5) * walkK : 0;
  const crouch = (sp.crouch ?? 0) + bob + breath + len3(stag) * 0.6;
  // strike body motion
  let twist = sp.twist ?? 0, lean = sp.lean ?? (walking ? 6 * walkK : 0);
  const sk = sp.strike ? strikeK(t, sp.strike.t0) : null;
  if (sk && sp.strike) {
    const sd = sp.strike.side === 'R' ? 1 : -1;
    const tw = sk.ph === 'wind' ? lerp(0, 24, sk.k) : sk.ph === 'blow' ? lerp(24, -18, sk.k) : sk.ph === 'through' ? lerp(-18, -24, sk.k) : lerp(-24, 0, sk.k);
    twist += tw * sd;
    lean += sk.ph === 'wind' ? lerp(0, -4, sk.k) : sk.ph === 'blow' ? lerp(-4, 14, sk.k) : sk.ph === 'through' ? 14 : lerp(14, 0, sk.k);
  }
  lean += recoil;
  if (sp.damage?.dent && t >= sp.damage.dent.t0) twist += sp.damage.dent.deg * 0.4;
  const pelvisPos = {x: root.x, y: gy + U.pelvisH - crouch, z: root.z};
  const pelvisR = rcomp(B, euler(twist * 0.35, lean * 0.3, 0));
  const pelvis: Pose3 = {pos: pelvisPos, R: pelvisR};
  const chestR = rcomp(B, euler(twist, lean, (sp.damage?.dent && t >= sp.damage.dent.t0 ? sp.damage.dent.deg * 0.6 : 0) + (walking ? Math.sin(walkPh * Math.PI * 2) * 2 : 0)));
  const spine: Pose3 = {pos: apply(pelvis, {x: 0, y: U.spine, z: 0}), R: chestR};
  const neckP: Pose3 = {pos: apply(spine, {x: 0, y: U.neck, z: 0.02}), R: chestR};
  // head look
  let headR = chestR;
  const scan = idle * (noise(t * 0.35, seed) * 14 + (sp.look ? 0 : 0));
  if (sp.look) {
    const d = sub3(sp.look, apply(neckP, {x: 0, y: U.headC, z: 0}));
    const lf = lookFrame(norm3(d));
    // clamp relative yaw/pitch by blending toward chest
    const cf = fwdOf(chestR);
    const ang = Math.acos(clamp(dot3(norm3(d), cf), -1, 1)) * 57.3;
    headR = ang > 75 ? slerpish(chestR, lf, 75 / ang) : lf;
  } else headR = rcomp(chestR, euler(scan, noise(t * 0.27, seed + 9) * 5 * idle, 0));
  const head: Pose3 = {pos: apply(neckP, {x: 0, y: U.headC, z: 0}), R: headR};
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
      fh = f.heading;
      pitch = f.stance ? 0 : Math.sin(Math.PI * f.s) * -12;
      const st = sp.gait.start ?? -1e9, en = sp.gait.end ?? 1e9;
      const k = smooth((sp.gait.dist - st) / 0.6) * (1 - smooth((sp.gait.dist - (en - 0.6)) / 0.6));
      if (k < 1) { target = lerp3(stand, target, k); pitch *= k; fh = lerp(heading + sd * 6, fh, k); }
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
    const r = ik2(hip[i], target, U.thigh, U.shin, add3(fwd, mul3(right, sd * 0.12))); // knees bend forward, a little out
    kn.push(r.mid); an.push(r.end);
    footR.push(rcomp(rotHeading(fh), euler(0, pitch, 0)));
  });
  // ---------------- arms
  const sh: [V3, V3] = [apply(spine, {x: -U.shW, y: U.shY, z: 0.0}), apply(spine, {x: U.shW, y: U.shY, z: 0.0})];
  const el: V3[] = [], wr: V3[] = [];
  const open: [boolean, boolean] = [false, false];
  const cf = fwdOf(chestR), cr = rmul(chestR, {x: 1, y: 0, z: 0}), cu = rmul(chestR, UP);
  ([0, 1] as const).forEach((i) => {
    const side: Side = i === 0 ? 'L' : 'R';
    const sd = i === 0 ? -1 : 1;
    const S = sh[i];
    // default: hanging, slight bend, march swing opposite to the same-side leg
    const swing = walking ? Math.sin(walkPh * Math.PI * 2 + (i === 0 ? Math.PI : 0)) * 0.22 * walkK : 0;
    let hand = add3(S, add3(add3(mul3(cu, -0.74), mul3(cf, 0.12 + swing)), mul3(cr, sd * 0.09)));
    let pole = add3(mul3(cf, -1), mul3(cr, sd * 0.4)); // elbows back and out
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
        pole = add3(mul3(cr, sd * 0.8), mul3(cu, -0.6));
      }
    }
    if (sk && sp.strike && sp.strike.side === side) {
      const T0 = sp.strike.target;
      const hammer = sp.strike.kind === 'hammer';
      const wind = add3(S, add3(add3(mul3(cu, hammer ? 0.55 : 0.12), mul3(cf, hammer ? -0.1 : -0.42)), mul3(cr, sd * 0.32)));
      const toT = norm3(sub3(T0, S));
      const through = add3(T0, mul3(toT, 0.22));
      const rest = hand;
      hand = sk.ph === 'wind' ? lerp3(rest, wind, sk.k) : sk.ph === 'blow' ? lerp3(wind, T0, sk.k) : sk.ph === 'through' ? lerp3(T0, through, sk.k * 0.6) : lerp3(add3(T0, mul3(toT, 0.13)), rest, sk.k);
      pole = add3(mul3(cr, sd * 0.9), mul3(cu, hammer ? 0.4 : -0.5));
    }
    // wrist = hand target pulled back by the fist
    const dir = norm3(sub3(hand, S));
    const wt = sub3(hand, mul3(dir, U.fist * 0.5));
    const r = ik2(S, wt, U.upper, U.fore, pole);
    el.push(r.mid); wr.push(r.end);
  });
  return {pelvis, spine, neck: neckP, head, sh, el: el as [V3, V3], wr: wr as [V3, V3], hip, kn: kn as [V3, V3], an: an as [V3, V3], footR: footR as [R3, R3], chestR, fwd, down: 0, open};
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
  const A = sp.fall.ang ?? 86;
  let ang = A * easeIn(tu);
  if (u > 0.8) ang = A + Math.exp(-(u - 0.8) * 7) * Math.sin((u - 0.8) * 22) * -8 + (1 - Math.exp(-(u - 0.8) * 6)) * 2;
  if (sp.fall.getUp !== undefined && t > sp.fall.getUp) {
    // push up from the ground: torso rises first (to a crouch), then the legs straighten
    const g1 = smooth((t - sp.fall.getUp) / 1.1);
    ang = ang * (1 - g1);
    crumple = crumple * (1 - smooth((t - sp.fall.getUp - 0.6) / 0.7)) + 0.0;
  }
  const piv = mul3(add3(rig.an[0], rig.an[1]), 0.5);
  const pivot = {x: piv.x, y: g(piv.x, piv.z) + 0.16 * smooth(tu * 1.5), z: piv.z};
  const R = rotAxisM(axis, ang);
  const drop = 0.32 * crumple;
  const xf = (p: V3) => {
    const q = {x: p.x, y: p.y - drop * clamp((p.y - pivot.y) / 1.0), z: p.z};
    const l = sub3(q, pivot);
    return add3(pivot, rmul(R, l));
  };
  return {xf, R, landT: sp.fall.t0 + 0.8, landPos: xf(rig.spine.pos)};
};

const rotPose = (P: Pose3, xf: (p: V3) => V3, R: R3): Pose3 => ({pos: xf(P.pos), R: rcomp(R, P.R)});

/** Attach points in world (after a fall). */
export const unitAttach = (sp: UnitSpec) => {
  const r = solveUnit(sp);
  const fx = fallXform(sp, r, sp.t);
  const X = (p: V3) => (fx ? fx.xf(p) : p);
  const fistOf = (i: 0 | 1) => add3(r.wr[i], mul3(norm3(sub3(r.wr[i], r.el[i])), U.fist * 0.55));
  return {
    handL: X(fistOf(0)), handR: X(fistOf(1)), wristL: X(r.wr[0]), wristR: X(r.wr[1]), elbowL: X(r.el[0]), elbowR: X(r.el[1]),
    shoulderL: X(r.sh[0]), shoulderR: X(r.sh[1]),
    eye: X(apply(r.head, {x: 0, y: 0.0, z: -0.17})), head: X(r.head.pos),
    chest: X(apply(r.spine, {x: 0, y: 0.32, z: -0.2})), backPlate: X(apply(r.spine, {x: 0, y: 0.3, z: 0.19})),
    kneeL: X(add3(r.kn[0], mul3(r.fwd, 0.1))), kneeR: X(add3(r.kn[1], mul3(r.fwd, 0.1))), pelvis: X(r.pelvis.pos),
    footL: X(r.an[0]), footR: X(r.an[1]), fwd: r.fwd,
  };
};

/** Damage / fall events as impact descriptors for FX (sparks, dust, sound sync). */
export const unitImpacts = (sp: UnitSpec): Impact[] => {
  const out: Impact[] = [];
  const at = (t0: number) => unitAttach({...sp, t: t0});
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
  if (sp.strike) out.push({t: sp.strike.t0, pos: sp.strike.target, dir: norm3(sub3(sp.strike.target, at(sp.strike.t0 - 0.4).shoulderR)), strength: 3, kind: 'blow'});
  if (sp.fall) {
    const r = solveUnit({...sp, t: sp.fall.t0 + 0.8});
    const fx = fallXform(sp, r, sp.fall.t0 + 0.8);
    if (fx) out.push({t: fx.landT, pos: fx.landPos, dir: {x: 0, y: -1, z: 0}, strength: 4, kind: 'ground'});
  }
  if (sp.lockAt !== undefined) out.push({t: sp.lockAt, pos: at(sp.lockAt).eye, dir: at(sp.lockAt).fwd, strength: 1, kind: 'eye'});
  return out;
};

/** Pose of a part at its attachment (for torn-off pieces: the pose at the moment of tearing). */
type PartPoses = Record<string, Pose3>;
const partPoses = (r: UnitRig): PartPoses => {
  const fwdHint = r.fwd;
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
  const r = solveUnit(sp);
  const fx = fallXform(sp, r, t);
  const lod = sp.lod ?? 'full';
  const D = sp.damage ?? {};
  const deadEye = D.dead && t >= D.dead.t0;
  const downNow = !!sp.fall && t > sp.fall.t0 + 0.5 && (sp.fall.getUp === undefined || t < sp.fall.getUp + 0.3);
  const eyeState: 'cyan' | 'amber' | 'off' = deadEye || (downNow && sp.fall?.getUp === undefined) ? 'off' : downNow ? 'cyan' : sp.lockAt !== undefined && t >= sp.lockAt ? 'amber' : sp.eye ?? 'cyan';
  const eyeRemap = eyeState === 'amber' ? {m_eye: 'm_eyeLock'} : eyeState === 'off' ? {m_eye: 'm_eyeOff'} : undefined;
  if (lod === 'far') return [unitFarSprite(sp, r, fx ? fx.xf : null, eyeState, key)];
  const P = partPoses(r);
  const place = (name: string): Pose3 => (fx ? rotPose(P[name], fx.xf, fx.R) : P[name]);
  const items: Item[] = [];
  const tornAt = (d?: {t0: number}) => !!d && t >= d.t0;
  const armOff = D.armOff;
  const offParts = (s: Side): string[] => (armOff && armOff.side === s && t >= armOff.t0 ? (armOff.at === 'elbow' ? ['fore' + s, 'fist' + s] : ['upper' + s, 'pauldron' + s, 'fore' + s, 'fist' + s]) : []);
  const removed = new Set<string>([...offParts('L'), ...offParts('R')]);
  if (tornAt(D.chest)) removed.add('chest');
  if (tornAt(D.back)) removed.add('back');
  if (tornAt(D.pauldronL)) removed.add('pauldronL');
  if (tornAt(D.pauldronR)) removed.add('pauldronR');
  if (lod === 'mid') {
    // merged torso block + limb blocks
    const torsoPose = place('core');
    items.push(partItem(UNIT_MID.torso, torsoPose, `${key}_mt`, {remap: eyeRemap}));
    for (const s of ['L', 'R'] as const) {
      for (const n of ['thigh', 'shin'] as const) items.push(partItem(UNIT[(n + s) as keyof typeof UNIT], place(n + s), `${key}_m${n}${s}`, {inkScale: 0.8}));
      if (!removed.has('upper' + s)) items.push(partItem(UNIT[('upper' + s) as keyof typeof UNIT], place('upper' + s), `${key}_mu${s}`, {inkScale: 0.8}));
      if (!removed.has('fore' + s)) items.push(partItem(UNIT[('fore' + s) as keyof typeof UNIT], place('fore' + s), `${key}_mf${s}`, {inkScale: 0.8}));
    }
    items.push(partItem(UNIT.pelvis, place('pelvis'), `${key}_mp`, {inkScale: 0.8}));
    if (eyeState !== 'off') items.push(eyeGlow(fx ? fx.xf(apply(r.head, {x: 0, y: 0, z: -0.17})) : apply(r.head, {x: 0, y: 0, z: -0.17}), eyeState, 0.8, 0.035, `${key}_eg`, 0.06, fx ? undefined : rmul(r.head.R, {x: 0, y: 0, z: -1})));
    return items;
  }
  for (const name of Object.keys(MESH)) {
    if (removed.has(name)) continue;
    let Pp = place(name);
    if (name === 'chest' && D.dent && t >= D.dent.t0) Pp = {pos: Pp.pos, R: rcomp(Pp.R, euler(D.dent.deg * 0.3, -D.dent.deg * 0.2, D.dent.deg * 0.4))};
    let mesh = UNIT[MESH[name]];
    if ((name === 'fistL' && r.open[0]) || (name === 'fistR' && r.open[1])) mesh = name === 'fistL' ? UNIT.handL : UNIT.handR;
    items.push(partItem(mesh, Pp, `${key}_${name}`, name === 'head' ? {remap: eyeRemap} : {}));
  }
  // stumps where limbs came off
  for (const s of ['L', 'R'] as const) {
    if (offParts(s).length) {
      const at = armOff!.at === 'elbow' ? place('fore' + s) : place('upper' + s);
      items.push(partItem(UNIT.stump, at, `${key}_stump${s}`));
    }
  }
  // the eye
  const eyeW = fx ? fx.xf(apply(r.head, {x: 0, y: 0, z: -0.17})) : apply(r.head, {x: 0, y: 0, z: -0.17});
  if (eyeState !== 'off') items.push(eyeGlow(eyeW, eyeState, 0.9 + 0.1 * Math.sin(t * 9 + sp.id), 0.03, `${key}_eg`, 0.06, fx ? undefined : rmul(r.head.R, {x: 0, y: 0, z: -1})));
  // ---------------- torn pieces (pose at the moment of tearing, then thrown)
  const thrownPart = (name: string, d: {t0: number; dir: V3; speed?: number}, seedK: number) => {
    const r0 = solveUnit({...sp, t: d.t0});
    const P0 = partPoses(r0)[name];
    const fx0 = fallXform(sp, r0, d.t0);
    const P0w = fx0 ? rotPose(P0, fx0.xf, fx0.R) : P0;
    // throw the piece's centre (approx. 0.3 m along its local y for torso plates)
    const th = makeThrow(d.t0, P0w.pos, d.dir, d.speed ?? 4, sp.id * 17 + seedK);
    const Q = thrownPose(th, t, g, P0w.R, 0.05);
    return partItem(UNIT[MESH[name]], {pos: Q.pos, R: Q.R}, `${key}_torn_${name}`);
  };
  if (tornAt(D.chest)) items.push(thrownPart('chest', D.chest!, 1));
  if (tornAt(D.back)) items.push(thrownPart('back', D.back!, 2));
  if (tornAt(D.pauldronL)) items.push(thrownPart('pauldronL', D.pauldronL!, 3));
  if (tornAt(D.pauldronR)) items.push(thrownPart('pauldronR', D.pauldronR!, 4));
  if (armOff && t >= armOff.t0) {
    // the detached arm flies as one rigid assembly about its root joint
    const r0 = solveUnit({...sp, t: armOff.t0});
    const P0 = partPoses(r0);
    const s = armOff.side;
    const names = offParts(s);
    const rootName = names[0];
    const root0 = P0[rootName];
    const th = makeThrow(armOff.t0, root0.pos, armOff.dir, armOff.speed ?? 5, sp.id * 23 + (s === 'L' ? 5 : 6));
    const Q = thrownPose(th, t, g, I3, 0.08);
    names.forEach((n) => {
      const rel = P0[n];
      // rel pose about root, rotated by Q.R, translated to Q.pos
      const pos = add3(Q.pos, rmul(Q.R, sub3(rel.pos, root0.pos)));
      items.push(partItem(UNIT[MESH[n]], {pos, R: rcomp(Q.R, rel.R)}, `${key}_off_${n}`));
    });
    const stumpW = fx ? fx.xf(root0.pos) : (armOff.at === 'elbow' ? r.el : r.sh)[s === 'L' ? 0 : 1];
    // snapped cables at the stump, sparks and fluid at the tear
    CABLES.forEach((c, k) => {
      const swing = Math.sin((t - armOff.t0) * 6 + k) * Math.exp(-(t - armOff.t0) * 1.5) * 0.08;
      const end = add3(stumpW, {x: swing + (k - 1.5) * 0.03, y: -0.16 - k * 0.03, z: 0.05 * (k % 2 ? 1 : -1)});
      items.push(cable(stumpW, end, 0.02, c, 0.018, `${key}_snap${k}`, true, 4));
    });
    items.push(...spray(t, armOff.t0, stumpW, armOff.dir, 14, 3.5, 'spark', sp.id * 3 + 1, `${key}_sp`, g, 0.6));
    items.push(...spray(t, armOff.t0 + 0.04, stumpW, add3(armOff.dir, {x: 0, y: 0.3, z: 0}), 10, 2.2, 'fluid', sp.id * 5 + 2, `${key}_fl`, g, 1.0));
  }
  // exposed wiring where the chest plate came off
  if (tornAt(D.chest) && lod === 'full') {
    const sp0 = fx ? rotPose(r.spine, fx.xf, fx.R) : r.spine;
    CABLES.forEach((c, k) => {
      const a = apply(sp0, {x: -0.12 + k * 0.08, y: 0.08 + (k % 2) * 0.06, z: -0.13});
      const b = apply(sp0, {x: -0.14 + k * 0.09, y: 0.44, z: -0.12});
      items.push(cable(a, b, -0.05 - (k % 2) * 0.03, c, 0.022, `${key}_wire${k}`, true, 5));
    });
    items.push(...spray(t, D.chest!.t0, apply(sp0, {x: 0, y: 0.3, z: -0.15}), D.chest!.dir, 10, 3, 'spark', sp.id * 7 + 3, `${key}_csp`, g, 0.5));
  }
  // leaking fluid and the pool under a downed unit
  if (D.leak && t >= D.leak.t0) {
    const src = fx ? fx.xf(apply(r.spine, {x: 0.05, y: 0.15, z: -0.1})) : apply(r.spine, {x: 0.05, y: 0.15, z: -0.1});
    const per = 0.7;
    const k = Math.floor((t - D.leak.t0) / per);
    items.push(...spray(t, D.leak.t0 + k * per, src, {x: 0, y: -0.2, z: 0}, 3, 0.6, 'fluid', sp.id * 11 + k, `${key}_lk${k}`, g, 0.7));
  }
  if (sp.fall && sp.fall.getUp === undefined && t > sp.fall.t0 + 0.8 && (D.leak || D.armOff || D.chest)) {
    const c = fx ? fx.landPos : r.spine.pos;
    const pool = fluidPool({x: c.x, y: 0, z: c.z}, t, sp.fall.t0 + 0.8, 0.9, sp.id, `${key}_pool`, g);
    if (pool) items.push(pool);
  }
  return items;
};

/** Far LOD: a small 2D figure at the unit's root, lit like the meshes (pale plates over a dark frame, stride). */
const unitFarSprite = (sp: UnitSpec, r: UnitRig, xf: ((p: V3) => V3) | null, eye: 'cyan' | 'amber' | 'off', key: string): Item => {
  const base = xf ? xf(r.pelvis.pos) : {x: r.pelvis.pos.x, y: r.pelvis.pos.y - U.pelvisH, z: r.pelvis.pos.z};
  const down = !!xf;
  const walkK = sp.gait ? 1 : 0;
  const ph = sp.gait ? (sp.gait.dist / (sp.gait.stride ?? 1.5)) * Math.PI * 2 : 0;
  return {
    kind: 'sprite', pos: base, key: `${key}_far`, n: {x: -0.6, y: 0.3, z: 0.4},
    draw: (c) => {
      const h = 2.2 * c.k;
      if (h < 0.8) return null;
      const s = h / 2.2;
      const x = c.x, y = c.y;
      const plate = shade(c.light, {base: '#C3CFD6'}, c.lit);
      const frame = shade(c.light, {base: '#4C5D69'}, c.lit);
      const ink = inkColor(c.light, undefined, c.lit);
      if (down) return <ellipse cx={f2(x)} cy={f2(y - 0.15 * s)} rx={f2(0.9 * s)} ry={f2(0.22 * s)} fill={frame} />;
      const st = Math.sin(ph) * 0.2 * s * walkK;
      const sw = Math.max(0.6, 0.13 * s);
      const thin = h < 14;
      return (
        <g>
          {/* legs (frame) with stride */}
          <line x1={f2(x - 0.1 * s)} y1={f2(y - 1.0 * s)} x2={f2(x - 0.12 * s - st)} y2={f2(y)} stroke={frame} strokeWidth={f2(sw)} strokeLinecap="round" />
          <line x1={f2(x + 0.1 * s)} y1={f2(y - 1.0 * s)} x2={f2(x + 0.12 * s + st)} y2={f2(y)} stroke={frame} strokeWidth={f2(sw)} strokeLinecap="round" />
          {/* arms */}
          <line x1={f2(x - 0.3 * s)} y1={f2(y - 1.62 * s)} x2={f2(x - 0.34 * s + st * 0.5)} y2={f2(y - 0.95 * s)} stroke={frame} strokeWidth={f2(sw * 0.9)} strokeLinecap="round" />
          <line x1={f2(x + 0.3 * s)} y1={f2(y - 1.62 * s)} x2={f2(x + 0.34 * s - st * 0.5)} y2={f2(y - 0.95 * s)} stroke={frame} strokeWidth={f2(sw * 0.9)} strokeLinecap="round" />
          {/* torso plate + head */}
          <path d={`M${f2(x - 0.33 * s)} ${f2(y - 1.72 * s)} L${f2(x + 0.33 * s)} ${f2(y - 1.72 * s)} L${f2(x + 0.2 * s)} ${f2(y - 1.0 * s)} L${f2(x - 0.2 * s)} ${f2(y - 1.0 * s)} Z`} fill={plate} stroke={thin ? 'none' : ink} strokeWidth={0.8} />
          <rect x={f2(x - 0.12 * s)} y={f2(y - 2.12 * s)} width={f2(0.24 * s)} height={f2(0.32 * s)} fill={plate} stroke={thin ? 'none' : ink} strokeWidth={0.8} />
          {eye !== 'off' && (down || (r.fwd.x * (c.view.pos.x - base.x) + r.fwd.z * (c.view.pos.z - base.z)) > 0) && <circle cx={f2(x)} cy={f2(y - 1.97 * s)} r={f2(Math.max(0.7, 0.06 * s))} fill={eye === 'cyan' ? '#62D6EA' : '#FFB23F'} />}
        </g>
      );
    },
  };
};

export {DEBRIS};
