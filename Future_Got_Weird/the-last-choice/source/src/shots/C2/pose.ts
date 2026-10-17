// Group C2 pose builders on top of the rig: movers along keyed paths with planted feet, a ladder climb, the lever haul,
// supported walking, basket riders, a leap, hanging, prone reaching and pose blending. All return ActorProps for a
// film time T; nothing keeps state.
import {ActorProps, ArmT, Face, LegT, solve} from '../../rig/actor';
import {Look} from '../../rig/looks';
import {gait, GaitOpts, stopDist} from '../../rig/gait';
import {walker} from '../../rig/poses';
import {Ease, V2, V3, clamp, keys, lerp, lerp3, smooth} from '../../kit/math';

export type G = Omit<GaitOpts, 's'>;
export const JOG: G = {stride: 170, duty: 0.44, lift: 32, bob: 8, armAmp: 28};
export const SPRINT: G = {stride: 215, duty: 0.34, lift: 46, bob: 10, armAmp: 36};
export const HURRY: G = {stride: 150, duty: 0.5, lift: 24, bob: 7, armAmp: 22};
export const WALK: G = {stride: 118, duty: 0.62, lift: 16, bob: 5, armAmp: 16};
export const CARRY: G = {stride: 104, duty: 0.66, lift: 14, bob: 6, armAmp: 4};

/** Keyed 1D path [[T, x], ...] (the segment arriving at a key uses its ease; default linear — constant speed). */
export const path = (T: number, k: [number, number, Ease?][]) => keys(T, k.map(([t, x, e]) => [t, x, e ?? ((u: number) => u)] as [number, number, Ease]));

/** A figure moving along keyed x positions on a ground line (monotonic in one direction): planted feet, swinging arms.
 *  The last key is pushed to the nearest double-support distance so the figure stops with both feet down. */
export const mover = (look: Look, T: number, k: [number, number, Ease?][], g: G, ground: number | ((x: number) => number), base: Partial<ActorProps> & {t: number; s?: number}): ActorProps => {
  const s = base.s ?? 1;
  const x0 = k[0][1], x1 = k[k.length - 1][1];
  const dir = (x1 >= x0 ? 1 : -1) as 1 | -1;
  const total = Math.abs(x1 - x0);
  const fixed = stopDist(total, {...g, s});
  const scale = total > 1 ? fixed / total : 1;
  const x = x0 + (path(T, k) - x0) * scale;
  const dist = Math.abs(x - x0);
  const gy = typeof ground === 'number' ? ground : ground(x);
  const p = walker(look, {x0, dist, dir, ground: gy, gait: g}, base);
  if (typeof ground !== 'number') {
    // sloped ground: each foot sits on the surface under it
    const fl = p.legL!.foot as V2, fr = p.legR!.foot as V2;
    p.legL = {...p.legL, foot: {x: fl.x, y: fl.y - gy + ground(fl.x)}};
    p.legR = {...p.legR, foot: {x: fr.x, y: fr.y - gy + ground(fr.x)}};
  }
  return p;
};
/** Is a mover still travelling at T (for blending into the next action)? */
export const moving = (T: number, k: [number, number, Ease?][]) => T > k[0][0] && T < k[k.length - 1][0];

/** Interpolate two poses through their solved joints (hands, feet, pelvis, yaw, lean...). Robust for crossfading actions. */
export const blend = (a: ActorProps, b: ActorProps, w: number): ActorProps => {
  if (w <= 0) return a;
  if (w >= 1) return b;
  const ra = solve(a), rb = solve(b);
  const L = (p: number | undefined, q: number | undefined, d = 0) => lerp(p ?? d, q ?? d, w);
  const yawA = a.yaw ?? 0, yawB = b.yaw ?? 0;
  let dy = yawB - yawA;
  while (dy > 180) dy -= 360;
  while (dy < -180) dy += 360;
  const ha = a.head ?? {}, hb = b.head ?? {};
  const pick = w < 0.5 ? a : b;
  const arm = (i: 0 | 1): ArmT => ({hand: lerp3(ra.wr[i], rb.wr[i], w), pole: (w < 0.5 ? [a.armL, a.armR] : [b.armL, b.armR])[i]?.pole});
  const leg = (i: 0 | 1): LegT => ({foot: lerp3(ra.ankle[i], rb.ankle[i], w), pole: (w < 0.5 ? [a.legL, a.legR] : [b.legL, b.legR])[i]?.pole, pitch: L([a.legL, a.legR][i]?.pitch, [b.legL, b.legR][i]?.pitch)});
  // keep the pelvis path continuous: interpolate the solved pelvis, then express it through x/y/drop
  const Pa = ra.P, Pb = rb.P;
  const P = lerp3(Pa, Pb, w);
  const y = L(a.y, b.y);
  return {
    ...pick,
    x: P.x, y, z: L(a.z, b.z), pelvisDx: 0, pelvisDz: 0, drop: 165 - (y - P.y) / (pick.s ?? 1), yaw: yawA + dy * w,
    lean: L(a.lean, b.lean), side: L(a.side, b.side), twist: L(a.twist, b.twist), roll: L(a.roll, b.roll),
    rollPivot: a.rollPivot && b.rollPivot ? {x: lerp(a.rollPivot.x, b.rollPivot.x, w), y: lerp(a.rollPivot.y, b.rollPivot.y, w)} : pick.rollPivot,
    head: {yaw: L(ha.yaw, hb.yaw), pitch: L(ha.pitch, hb.pitch), roll: L(ha.roll, hb.roll)},
    armL: arm(0), armR: arm(1), legL: leg(0), legR: leg(1),
  };
};
/** Blend weight that ramps from 0 at a to 1 at b (smooth). */
export const ramp = (T: number, a: number, b: number) => smooth(clamp((T - a) / (b - a)));

/**
 * Climb a vertical ladder at x from the floor yBot to the top yTop (back view, facing the ladder), progress c 0..1.
 * Feet step up two rungs at a time, alternating; hands on the rails, alternating higher.
 */
export const climb = (look: Look, x: number, yBot: number, yTop: number, c: number, base: Partial<ActorProps> & {t: number; s?: number}): ActorProps => {
  const s = base.s ?? 1;
  const rise = yBot - yTop;
  const steps = Math.max(2, Math.round(rise / 90));
  const ph = clamp(c) * steps;
  // each foot alternates: L moves during the first half of a step period, R during the second
  const footUp = (off: number) => {
    const q = ph - off;
    const k = Math.floor(q), u = q - k;
    const done = Math.max(0, k) + (q < 0 ? 0 : smooth(clamp(u * 2)));
    return Math.min(steps, done) * (rise / steps);
  };
  const yl = yBot - footUp(0), yr = yBot - footUp(0.5);
  const ground = Math.max(yl, yr) - (rise / steps) * 0.25; // pelvis follows the lower foot
  const liftL = Math.max(0, yBot - yl - (yBot - ground)), liftR = Math.max(0, yBot - yr - (yBot - ground));
  void liftL; void liftR;
  const handY = (off: number) => ground - 340 * s - 40 * s * Math.sin(Math.PI * clamp((ph - off) % 1));
  return {
    look, x, y: ground, yaw: 180, z: 0, drop: 18, lean: 6,
    legL: {foot: {x: x - 26 * s, y: yl - 10 * s, z: -20}, pole: {x: 0, y: 0, z: 1}},
    legR: {foot: {x: x + 26 * s, y: yr - 10 * s, z: -20}, pole: {x: 0, y: 0, z: 1}},
    armL: {hand: {x: x - 46 * s, y: handY(0.5), z: -34}, pole: {x: -0.6, y: 0.6, z: 0.4}},
    armR: {hand: {x: x + 46 * s, y: handY(0), z: -34}, pole: {x: 0.6, y: 0.6, z: 0.4}},
    handL: 'fist', handR: 'fist',
    head: {pitch: -10},
    ...base,
  };
};

/** Standing figure with planted feet (stance width w, front foot toward `dir`). */
export const stand = (look: Look, x: number, y: number, yaw: number, base: Partial<ActorProps> & {t: number; s?: number}, w = 70, fwd = 0): ActorProps => {
  const s = base.s ?? 1;
  const f = Math.sin((yaw * Math.PI) / 180) >= 0 ? 1 : -1; // screen direction the figure faces
  return {
    look, x, y, yaw,
    legL: {foot: {x: x - (w / 2) * s * f * 0.3 + fwd * s * f, y: y - 10 * s, z: (w / 2) * s * 0.4}},
    legR: {foot: {x: x + (w / 2) * s * f * 0.3 - fwd * s * f, y: y - 10 * s, z: -(w / 2) * s * 0.4}},
    ...base,
  };
};

/** World point → the pre-roll frame of an actor rolled by `roll` degrees about `pivot` (to aim IK targets). */
export const unroll = (q: V2 | V3, pivot: V2, roll: number): V3 => {
  const a = (-roll * Math.PI) / 180, c = Math.cos(a), sn = Math.sin(a);
  const dx = q.x - pivot.x, dy = q.y - pivot.y;
  return {x: pivot.x + dx * c - dy * sn, y: pivot.y + dx * sn + dy * c, z: 'z' in q ? (q as V3).z : 0};
};

/** A face that breathes hard (mouth cycles open). */
export const panting = (base: Face = {}): Face => ({mouth: 'pant', ...base});

/** Gait phase helpers for synced partners (a supported figure stepping with its helper). */
export const gaitAt = (x0: number, dist: number, dir: 1 | -1, g: G, s = 1) => gait(x0, dist, dir, {...g, s});
