// Heavy: a ~6 m four-legged walker with a telescoping ram arm under its nose and a launcher pod on its back.
// WEIGHT: a lateral-sequence walk (FL, RR, FR, RL a quarter cycle apart, duty 0.75: three feet planted at any time,
// two at the hand-overs), the hull shifting its weight off each leg before it lifts, and compressing and settling as
// each foot lands (that corner dips, then recovers); planted feet stay planted (the hull lowers rather than let a
// planted foot slide out of reach). Footfalls are events (heavyFootfalls / heavyImpacts) and optionally kit dust.
// Head/eye turns; ram wind-up (the hull loads down and back) → strike (lunges) → impact recoil → hold → recover;
// launcher aim, brace and fire (the hull kicks back and nose-up, legs absorb). Stumble, pinned leg, and a topple when
// a knee is broken: the lower leg buckles off as gravity-true debris, the hull rolls onto its side (the wreck stays).
import React from 'react';
import {V3, add3, sub3, mul3, norm3, len3, dot3, cross3, clamp, lerp, lerp3, smooth, easeIn, easeOut, noise, seg, f2, rnd} from '../../kit/math';
import {Item, MeshItem, shade} from '../engine';
import {HEAVY, HV, DEBRIS} from './parts';
import {Pose3, R3, rotHeading, rcomp, euler, segFrame, ik2, apply, rmul, rotAxisM, lookFrame, fwdOf, I3, slerpish} from './mat3';
import {Ground, FLAT, Path, footAt, partItem, eyeGlow, spray, cable, fluidPool, CABLES, farFigure, meshPrim} from './kit';
import {Impact} from './unit';
import {bodyOf, debrisPose, tearLaunch, Launch} from './debris';

export type HeavySpec = {
  id: number;
  t: number;
  pos: V3;
  heading: number;
  /** walk: hull follows path(dist). `distAt` (optional: film time → dist) gives exact footfall times for events/dust */
  gait?: {path: Path; dist: number; stride?: number; distAt?: (t: number) => number};
  /** head and eye look at */
  look?: V3;
  eye?: 'cyan' | 'amber' | 'off';
  lockAt?: number;
  /** ram strike (tip reaches target at t0): wind-up −1.3…−0.25 (hull loads down/back), strike −0.25…0 (lunge),
   *  impact recoil, hold to +0.7, recover to +2.2 */
  ram?: {t0: number; target: V3};
  /** launcher aim (continuous) and fire at t0 (brace −0.5…0, recoil kick, settle) */
  aim?: V3;
  fire?: {t0: number; target: V3};
  /** knee broken: leg 0 FL, 1 FR, 2 RL, 3 RR; the walker topples toward dir */
  kneeBreak?: {t0: number; leg: 0 | 1 | 2 | 3; dir: V3; /** (R3, optional) the free legs fall limp to the ground (default: folded) */ limp?: boolean;
    /** (R4, optional) after the topple every leg's knee is swung (smallest turn about the hip–foot axis) to where both bones stay out of the
     *  ground: without it the legs on the side the hull lies on are folded 0.9–2 m INTO the road. It moves wreck geometry (a few
     *  leg cells of a footprint grid built from the meshes by D3 move by up to 1.6 m), so it is opt-in: check routes over the wreck. */
    legsClear?: boolean};
  /** a leg pinned (tether) from t0: that foot stays put; `hold` keeps it planted through a knee-break topple too */
  pinned?: {t0: number; leg: 0 | 1 | 2 | 3; hold?: boolean};
  /** stumble (hit) */
  stumble?: {t0: number; dir: V3; strength?: number};
  /** armour plates torn off (gravity-true debris: they fall, tip over and stay) */
  damage?: {plateL?: {t0: number; dir: V3}; plateR?: {t0: number; dir: V3}; nose?: {t0: number; dir: V3}; top?: {t0: number; dir: V3}; dead?: {t0: number}};
  /** points to lift the feet over (wrecks) */
  stepOver?: V3[];
  /** (R3, optional) the ram carried up at rest, 0..1: raised clear of a wreck or a beam the walker climbs over */
  ramCarry?: number;
  /** explicit world footholds per leg (0 FL, 1 FR, 2 RL, 3 RR; ground contact points), overriding the gait/standing
   *  feet: a keyed walk with planted steps, a foot slipping off a slab. Optional; an absent entry is unchanged. */
  feet?: (V3 | undefined)[];
  /** with keyed `feet`: film time each leg last landed (drives the hull's compression and settle on that corner) */
  plants?: (number | undefined)[];
  /** extra hull drop (m): the dip as a leg gives. Optional. */
  drop?: number;
  /** draw dust puffs at the footfalls (needs gait.distAt or plants); default off (FX may draw its own) */
  dust?: boolean;
  /** weight response scale (compression, weight shift, recoil), default 1; 0 = R2 behaviour */
  weight?: number;
  /**
   * (R4, optional) fixed obstacles the legs must not pass through — a water main, a beam, a wreck's limb — as capsules in
   * world space (axis a→b, radius r; a = b is a ball). Each leg's knee is swung round the hip–foot axis (smallest turn first)
   * until both bones clear every capsule by `clearMargin` (default 0.1 m) plus the bone's own radius (0.38 m); where no
   * knee position clears it (the hip–foot line itself runs through the obstacle) the best one is used: move the foothold.
   * Feet stay where they were told (feet / gait): only the knee moves.
   */
  clear?: {a: V3; b: V3; r: number}[];
  clearMargin?: number;
  ground?: Ground;
  lod?: 'full' | 'mid' | 'far';
  key?: string;
};

const UP: V3 = {x: 0, y: 1, z: 0};
const LEGS: {sx: number; sz: number; ph: number}[] = [
  {sx: -1, sz: -1, ph: 0.0}, // front-left
  {sx: 1, sz: -1, ph: 0.5}, // front-right
  {sx: -1, sz: 1, ph: 0.75}, // rear-left
  {sx: 1, sz: 1, ph: 0.25}, // rear-right
];
const DUTY = 0.75;

type HeavyRig = {
  hull: Pose3; head: Pose3; boomPose: Pose3; ramPose: Pose3; ext: number; launcher: Pose3;
  hip: V3[]; knee: V3[]; foot: V3[]; footH: number[]; stance: boolean[]; footFall: {t: number; pos: V3}[]; fwd: V3; heading: number;
};

const ramPhase = (t: number, t0: number) => {
  const u = t - t0;
  if (u < -1.3 || u > 2.2) return null;
  if (u < -0.25) return {ph: 'wind' as const, k: smooth((u + 1.3) / 1.05)};
  if (u < 0) return {ph: 'strike' as const, k: easeIn((u + 0.25) / 0.25)};
  if (u < 0.7) return {ph: 'hold' as const, k: u / 0.7};
  return {ph: 'recover' as const, k: smooth((u - 0.7) / 1.5)};
};
/** a landing's compression envelope (peaks at `a`, decays: the hull settles onto the new foot) */
const alpha = (x: number, a: number) => (x <= 0 ? 0 : (x / a) * Math.exp(1 - x / a));
/** a damped kick (impact / recoil): rises in ~1/(f·4), rings down */
const kick = (u: number, f = 3.5, d = 6) => (u <= 0 ? 0 : Math.exp(-u * d) * Math.sin(Math.min(u * f * Math.PI * 2, Math.PI / 2 + u * f * 2)));

/** per-leg gait phase: n (cycle index), uu (0..1 in the cycle; stance while uu < DUTY, landing at uu = 0) */
const legPhase = (dist: number, stride: number, ph: number) => {
  const c = dist / stride + ph;
  const n = Math.floor(c);
  return {n, uu: c - n};
};

/** closest distance between segments p1q1 and p2q2 */
const segSegDist = (p1: V3, q1: V3, p2: V3, q2: V3): number => {
  const d1 = sub3(q1, p1), d2 = sub3(q2, p2), r = sub3(p1, p2);
  const a = dot3(d1, d1), e = dot3(d2, d2), f = dot3(d2, r), c = dot3(d1, r), b = dot3(d1, d2);
  const den = a * e - b * b;
  let s = a > 1e-9 && den > 1e-9 ? clamp((b * f - c * e) / den) : 0;
  let t = e > 1e-9 ? (b * s + f) / e : 0;
  if (t < 0) { t = 0; s = a > 1e-9 ? clamp(-c / a) : 0; } else if (t > 1) { t = 1; s = a > 1e-9 ? clamp((b - c) / a) : 0; }
  const c1 = add3(p1, mul3(d1, s)), c2 = add3(p2, mul3(d2, t));
  return len3(sub3(c1, c2));
};
const HV_BONE_R = 0.38;
/** the knee for hip H and ankle A that clears the obstacle capsules (smallest swing about the hip–ankle axis first) */
const kneeClear = (H: V3, A: V3, pole: V3, clear: {a: V3; b: V3; r: number}[], margin: number): ReturnType<typeof ik2> => {
  const base = ik2(H, A, HV.upperLen, HV.lowerLen, pole, 0, UP);
  const score = (m: V3, e: V3) => {
    let worst = 1e9;
    for (const o of clear) worst = Math.min(worst, segSegDist(H, m, o.a, o.b) - o.r - HV_BONE_R, segSegDist(m, e, o.a, o.b) - o.r - HV_BONE_R);
    return worst;
  };
  const s0 = score(base.mid, base.end);
  if (s0 >= margin + 0.5) return base;
  const ax = norm3(sub3(A, H));
  const c0 = add3(H, mul3(ax, dot3(sub3(base.mid, H), ax)));
  const pp0 = sub3(base.mid, c0);
  let best = base, bestS = s0;
  const at = (th: number) => add3(c0, rmul(rotAxisM(ax, th), pp0));
  // turn the knee the way that moves it away from the obstacle (decided by the local slope, so it does not flip side from one
  // frame to the next), in 5° steps, until both bones clear
  const sg = score(at(10), base.end) >= score(at(-10), base.end) ? 1 : -1;
  for (let k = 1; k <= 36; k++) {
    const mid = at(sg * k * 5);
    const sc = score(mid, base.end);
    if (sc >= margin) { best = {...base, mid}; bestS = sc; break; }
    if (sc > bestS) { bestS = sc; best = {...base, mid}; }
  }
  // fade the correction in over the last 0.5 m of clearance (no pop when an obstacle comes into reach)
  const w = smooth(clamp((margin + 0.5 - s0) / 0.5));
  const pole2 = add3(mul3(pp0, 1 - w), mul3(sub3(best.mid, c0), w));
  return ik2(H, A, HV.upperLen, HV.lowerLen, pole2, 0, UP);
};

export const solveHeavy = (sp: HeavySpec, tOverride?: number): HeavyRig => {
  const t = tOverride ?? sp.t;
  const g = sp.ground ?? FLAT;
  const W = sp.weight ?? 1;
  let root = sp.pos, heading = sp.heading;
  let dist = 0;
  if (sp.gait) {
    dist = sp.gait.dist;
    const p = sp.gait.path(dist);
    root = p.pos; heading = p.heading;
  }
  const B = rotHeading(heading);
  const fwd = rmul(B, {x: 0, y: 0, z: -1}), right = rmul(B, {x: 1, y: 0, z: 0});
  const stride = sp.gait?.stride ?? 3.0;
  // ---------------- weight: compression on landings, shift off a lifting leg
  let pitch = 0, roll = 0, drop = sp.drop ?? 0;
  let shift: V3 = {x: 0, y: 0, z: 0};
  const pinDist = (i: number) => (sp.pinned && sp.pinned.leg === i && t >= sp.pinned.t0 ? Math.min(dist, solvePinDist(sp)) : dist);
  LEGS.forEach((L, i) => {
    let comp = 0, sw = 0;
    if (sp.gait && !sp.feet?.[i]) {
      const {uu} = legPhase(pinDist(i), stride, L.ph);
      comp = uu < 0.4 ? alpha(uu, 0.04) : 0;
      sw = uu >= DUTY ? Math.sin((Math.PI * (uu - DUTY)) / (1 - DUTY)) : 0;
      const ts = uu >= DUTY ? stopTime(sp, t) : null;
      if (ts !== null) { const e = smooth((t - ts) / 0.45); sw *= 1 - e; comp = Math.max(comp, alpha(t - ts - 0.45, 0.13)); }
      // anticipation: the weight leaves this corner just before it lifts
      if (uu > DUTY - 0.08 && uu < DUTY) sw = Math.max(sw, 0.5 * smooth((uu - (DUTY - 0.08)) / 0.08));
    } else if (sp.feet?.[i]) {
      const f = sp.feet[i]!;
      sw = clamp((f.y - g(f.x, f.z)) / 0.35);
      const pl = sp.plants?.[i];
      if (pl !== undefined) comp = alpha(t - pl, 0.13);
    }
    const corner = norm3(add3(mul3(right, L.sx * HV.footX), mul3(fwd, -L.sz * HV.footZ)));
    shift = add3(shift, mul3(corner, -0.08 * sw * W));
    roll += L.sx * 1.2 * sw * W;
    drop += 0.075 * comp * W;
    roll += -L.sx * 1.4 * comp * W;
    pitch += -L.sz * 1.1 * comp * W;
  });
  if (W === 0 && sp.gait) drop -= 0.06 * Math.sin((dist / stride) * Math.PI * 8); // the R2 bob
  // ---------------- ram: wind-up loads the legs, the strike lunges, the impact kicks back
  const rp = sp.ram ? ramPhase(t, sp.ram.t0) : null;
  if (rp) {
    pitch += rp.ph === 'wind' ? lerp(0, -6, rp.k) : rp.ph === 'strike' ? lerp(-6, 7, rp.k) : rp.ph === 'hold' ? 7 - rp.k * 2 : lerp(5, 0, rp.k);
    shift = add3(shift, mul3(fwd, rp.ph === 'wind' ? lerp(0, -0.4, rp.k) : rp.ph === 'strike' ? lerp(-0.4, 0.35, rp.k) : rp.ph === 'hold' ? 0.35 : lerp(0.35, 0, rp.k)));
    drop += W * (rp.ph === 'wind' ? lerp(0, 0.28, rp.k) : rp.ph === 'strike' ? lerp(0.28, 0.02, rp.k) : rp.ph === 'hold' ? 0.02 : lerp(0.02, 0, rp.k));
  }
  if (sp.ram) {
    const u = t - sp.ram.t0;
    const k = kick(u, 3.2, 6.5) * W;
    shift = add3(shift, mul3(fwd, -0.22 * k));
    pitch += -2.5 * k;
    drop += 0.06 * Math.max(0, k);
  }
  if (sp.fire) {
    const u = t - sp.fire.t0;
    if (u > -0.5 && u < 1.6) {
      const brace = smooth((u + 0.5) / 0.4) * (1 - smooth((u - 0.25) / 0.8));
      drop += 0.12 * brace * W;
      if (u > 0) {
        const e = Math.exp(-u * 5) * Math.sin(Math.min(u * 18, Math.PI / 2));
        pitch -= (3 + 2 * W) * e;
        shift = add3(shift, mul3(fwd, -(0.25 + 0.15 * W) * e));
        drop += 0.08 * W * kick(u, 2.6, 5);
      }
    }
  }
  if (sp.stumble) {
    const u = t - sp.stumble.t0;
    if (u > 0 && u < 2) {
      const s = sp.stumble.strength ?? 1;
      const e = Math.exp(-u * 2.5) * Math.sin(Math.min(u * 6, Math.PI / 2 + u * 2));
      const d = norm3({x: sp.stumble.dir.x, y: 0, z: sp.stumble.dir.z});
      shift = add3(shift, mul3(d, 0.6 * s * e));
      roll += dot3(d, right) * -8 * s * e;
      pitch += dot3(d, fwd) * 6 * s * e;
      drop += 0.1 * s * e * W;
    }
  }
  pitch += noise(t * 0.4, sp.id) * 0.8;
  // ---------------- feet (targets) first: the hull must keep every planted foot within reach
  const targets: V3[] = [], stance: boolean[] = [], footH: number[] = [];
  LEGS.forEach((L, i) => {
    let target: V3, st = true, fh = heading;
    if (sp.gait) {
      const lat = L.sx * HV.footX;
      const fz = L.sz * HV.footZ;
      const shifted: Path = (d) => sp.gait!.path(d + -fz);
      const f = footAt(shifted, pinDist(i), L.ph, stride, DUTY, lat, 0.55, g);
      target = f.pos; st = f.stance; fh = f.heading;
      // halted mid-step (gait.distAt shows no progress): a swinging foot puts itself down where it is
      const ts = stopTime(sp, t);
      if (!f.stance && ts !== null) {
        const e = smooth((t - ts) / 0.45);
        target = {x: target.x, y: lerp(target.y, g(target.x, target.z), e), z: target.z};
        st = e >= 1;
      }
      if (sp.stepOver && !f.stance) for (const w of sp.stepOver) { const dd2 = Math.hypot(w.x - f.pos.x, w.z - f.pos.z); if (dd2 < 1.6) target = {...target, y: target.y + (1.6 - dd2) * 0.6 * Math.sin(Math.PI * f.s)}; }
    } else {
      const base = add3(add3(root, mul3(right, L.sx * HV.footX)), mul3(fwd, -L.sz * HV.footZ));
      target = {x: base.x, y: g(base.x, base.z), z: base.z};
    }
    const fo = sp.feet?.[i];
    if (fo) { target = fo; st = fo.y - g(fo.x, fo.z) < 0.04; }
    targets.push(target); stance.push(st); footH.push(fh);
  });
  const build = (dropExtra: number) => {
    const hullPos = add3({x: root.x, y: g(root.x, root.z) + HV.hullY - drop - dropExtra, z: root.z}, shift);
    const hullR = rcomp(B, euler(0, pitch, roll));
    return {pos: hullPos, R: hullR} as Pose3;
  };
  let hull = build(0);
  // reach: lower the hull just enough that each foot on the ground stays reachable (a planted foot must not hang short
  // of the ground or slide). Continuous: each leg weighs in by how close its foot is to the ground, the drop is capped.
  const maxL = (HV.upperLen + HV.lowerLen) * 0.985;
  let need = 0;
  // (kit-gait feet only: keyed `feet` belong to the section, which owns the hull height through `drop`)
  // During a swing the hull eases from the take-off foothold's need to the landing foothold's (over the whole step,
  // so a foot landing on lower ground settles the hull gradually, never in a frame).
  if (W > 0 && sp.gait) LEGS.forEach((L, i) => {
    if (sp.feet?.[i]) return;
    const H = apply(hull, {x: L.sx * HV.hipX, y: HV.hipDrop, z: L.sz * HV.hipZ});
    const needAt = (P: V3) => {
      const A = add3(P, {x: 0, y: 0.22, z: 0});
      const h = Math.min(maxL * 0.999, Math.hypot(H.x - A.x, H.z - A.z)), v = H.y - A.y;
      return h * h + v * v > maxL * maxL ? v - Math.sqrt(maxL * maxL - h * h) : 0;
    };
    const dd = pinDist(i);
    const {n, uu} = legPhase(dd, stride, L.ph);
    if (uu < DUTY) { need = Math.max(need, needAt(targets[i])); return; }
    const sw = (uu - DUTY) / (1 - DUTY);
    const shifted: Path = (d) => sp.gait!.path(d - L.sz * HV.footZ);
    const off = footAt(shifted, (n - L.ph) * stride + 1e-4, L.ph, stride, DUTY, L.sx * HV.footX, 0.55, g).pos;
    const on = footAt(shifted, (n + 1 - L.ph) * stride + 1e-4, L.ph, stride, DUTY, L.sx * HV.footX, 0.55, g).pos;
    let nd = Math.max(needAt(off) * (1 - smooth(sw / 0.35)), needAt(on) * smooth((sw - 0.25) / 0.75));
    // halted mid-step: the foot is being put down where it hovers; its need takes over as it lands
    const ts = stopTime(sp, t);
    if (ts !== null) nd = lerp(nd, needAt({...targets[i], y: g(targets[i].x, targets[i].z)}), smooth((t - ts) / 0.45));
    need = Math.max(need, nd);
  });
  if (need > 0) hull = build(Math.min(0.6, need));
  const hullR = hull.R;
  // head
  const headMount = apply(hull, HV.head);
  let headR = rcomp(hullR, euler(noise(t * 0.25, sp.id + 5) * 10, 6, 0));
  if (sp.look) {
    const d = norm3(sub3(sp.look, headMount));
    const lf = lookFrame(d, rmul(hullR, UP));
    const ang = Math.acos(clamp(dot3(d, fwdOf(hullR)), -1, 1)) * 57.3;
    headR = ang > 60 ? slerpish(hullR, lf, 60 / ang) : lf;
  }
  const head: Pose3 = {pos: headMount, R: headR};
  // legs: IK to the targets
  const hip: V3[] = [], knee: V3[] = [], foot: V3[] = [];
  LEGS.forEach((L, i) => {
    const H = apply(hull, {x: L.sx * HV.hipX, y: HV.hipDrop, z: L.sz * HV.hipZ});
    const ankle = add3(targets[i], {x: 0, y: 0.22, z: 0});
    // (R4) the knee points out and a little up. When the foot is splayed far out / folded in beside the hip, the hip–foot line
    // runs along that direction and the bend plane is undefined: the knee used to flip between two sides (a 3.5 m jump of
    // heavy 2's rear-right knee in one frame, D3 147.93). Near that alignment the up share grows continuously, so the knee
    // swings up instead of flipping. A walking leg is nowhere near it: unchanged.
    const chord = norm3(sub3(add3(targets[i], {x: 0, y: 0.22, z: 0}), H));
    const outH = norm3(add3(mul3(right, L.sx), mul3(UP, 0.55)));
    const alignK = smooth((Math.abs(dot3(outH, chord)) - 0.7) / 0.25);
    const out = add3(mul3(right, L.sx), mul3(UP, 0.55 + 2.2 * alignK));
    const r = sp.clear?.length ? kneeClear(H, ankle, out, sp.clear, sp.clearMargin ?? 0.1) : ik2(H, ankle, HV.upperLen, HV.lowerLen, out, 0, UP);
    hip.push(H); knee.push(r.mid); foot.push(r.end);
  });
  // ram arm: boom from the shoulder, aimed down-forward at rest, at the target on the strike
  const shoulder = apply(hull, HV.ramShoulder);
  const carry = clamp(sp.ramCarry ?? 0);
  let boomDir = norm3(add3(mul3(fwd, 1), mul3(UP, -0.18 + 0.88 * carry))); // ram held out low in front, under the head
  let ext = 0.2 * (1 - carry);
  if (rp && sp.ram) {
    const toT = sub3(sp.ram.target, shoulder);
    const dT = norm3(toT);
    const wind = norm3(add3(mul3(fwd, 0.5), mul3(UP, 1.1)));
    const reach = len3(toT);
    const extT = clamp(reach - HV.boom - 1.35, 0, 1.6);
    if (rp.ph === 'wind') { boomDir = norm3(lerp3(boomDir, wind, rp.k)); ext = lerp(0.2, 0, rp.k); }
    else if (rp.ph === 'strike') { boomDir = norm3(lerp3(wind, dT, rp.k)); ext = lerp(0, extT, rp.k); }
    else if (rp.ph === 'hold') { boomDir = dT; ext = extT; }
    else { boomDir = norm3(lerp3(dT, boomDir, rp.k)); ext = lerp(extT, 0.2, rp.k); }
  }
  const boomR = lookFrame(boomDir, rmul(hullR, UP));
  const boomPose: Pose3 = {pos: shoulder, R: boomR};
  const ramPose: Pose3 = {pos: add3(shoulder, mul3(boomDir, HV.boom + ext)), R: boomR};
  // launcher: aims at aim/fire target; recoils into its mount and springs back
  const lm = apply(hull, HV.launcher);
  const aimAt = sp.fire && t > sp.fire.t0 - 1.5 ? sp.fire.target : sp.aim;
  let lR = rcomp(hullR, euler(0, -4, 0));
  if (aimAt) lR = lookFrame(norm3(sub3(aimAt, lm)), UP);
  let lPos = lm;
  if (sp.fire) { const u = t - sp.fire.t0; if (u > 0 && u < 1.2) lPos = add3(lm, mul3(fwdOf(lR), -0.34 * Math.exp(-u * 8) + 0.05 * Math.exp(-u * 4) * Math.sin(u * 10))); }
  return {hull, head, boomPose, ramPose, ext, launcher: {pos: lPos, R: lR}, hip, knee, foot, footH, stance, footFall: [], fwd, heading};
};
const solvePinDist = (sp: HeavySpec) => (sp.gait ? sp.gait.dist : 0);
/** when the walk stopped (film s), from gait.distAt: null while it is still moving (or without distAt) */
const stopTime = (sp: HeavySpec, t: number): number | null => {
  const dA = sp.gait?.distAt;
  if (!dA) return null;
  const d = dA(t);
  if (Math.abs(d - dA(t - 0.1)) > 0.003) return null;
  let ts = t - 0.1;
  for (let k = 0; k < 40 && Math.abs(dA(ts - 0.05) - d) <= 0.003; k++) ts -= 0.05;
  return ts;
};

/**
 * Topple after a knee break: the broken corner sags, then the hull rolls onto that side (about its own long axis,
 * nose or tail dipping toward the broken end) and comes to rest lying on its side on the ground. Everything rigidly
 * attached to the hull follows `xf`; legs are re-solved separately (see fallenLeg).
 */
const toppleXf = (sp: HeavySpec, r0: HeavyRig, t: number) => {
  if (!sp.kneeBreak || t < sp.kneeBreak.t0) return null;
  const g = sp.ground ?? FLAT;
  const u = t - sp.kneeBreak.t0;
  const L = LEGS[sp.kneeBreak.leg];
  const f0 = fwdOf(r0.hull.R), right0 = rmul(r0.hull.R, {x: 1, y: 0, z: 0});
  const sag = smooth(u / 0.45);
  const fall = easeIn(clamp((u - 0.3) / 1.2));
  let k = 0.12 * sag + 0.88 * fall;
  if (u > 1.5) k = 1 + Math.exp(-(u - 1.5) * 6) * Math.sin((u - 1.5) * 16) * -0.06;
  const roll = L.sx * 74 * k;
  const pitch = L.sz * 11 * k;
  const Rd = rcomp(rotAxisM(f0, roll), rotAxisM(right0, pitch));
  const p0 = r0.hull.pos;
  const restY = g(p0.x + right0.x * L.sx * 1.7, p0.z + right0.z * L.sx * 1.7) + 1.55;
  const pos = {
    x: p0.x + (right0.x * L.sx * 1.7 - f0.x * L.sz * 0.5) * smooth(k),
    y: lerp(p0.y, restY, k),
    z: p0.z + (right0.z * L.sx * 1.7 - f0.z * L.sz * 0.5) * smooth(k),
  };
  const xf = (p: V3) => add3(pos, rmul(Rd, sub3(p, p0)));
  return {xf, R: Rd, k, landT: sp.kneeBreak.t0 + 1.5, landPos: pos};
};

/** the knee for hip H and foot F whose bones clear the ground by their thickness (smallest swing about the hip–foot axis) */
const kneeAbove = (H: V3, F: V3, pole: V3, g: Ground): ReturnType<typeof ik2> => {
  const base = ik2(H, F, HV.upperLen, HV.lowerLen, pole);
  const score = (K: V3, E: V3) => {
    let m = 1e9;
    for (const u of [0.3, 0.5, 0.7, 0.9, 1]) { const p = lerp3(H, K, u); m = Math.min(m, p.y - g(p.x, p.z) - 0.3); }
    for (const u of [0.15, 0.35, 0.55, 0.75, 0.95]) { const p = lerp3(K, E, u); m = Math.min(m, p.y - g(p.x, p.z) - 0.3 * Math.min(1, u * 4)); }
    return m;
  };
  let bestS = score(base.mid, base.end);
  if (bestS >= 0) return base;
  const ax = norm3(sub3(F, H));
  const c0 = add3(H, mul3(ax, dot3(sub3(base.mid, H), ax)));
  const pp0 = sub3(base.mid, c0);
  let best = base;
  for (let k = 1; k <= 12; k++) for (const sg of [1, -1]) {
    const mid = add3(c0, rmul(rotAxisM(ax, sg * k * 15), pp0));
    const sc = score(mid, base.end);
    if (sc >= 0) return {...base, mid};
    if (sc > bestS) { bestS = sc; best = {...base, mid}; }
  }
  return best;
};

/** A leg after the topple: blends from planted to a folded, hull-local pose; segment lengths kept by IK. */
const fallenLeg = (sp: HeavySpec, r0: HeavyRig, i: number, tx: {xf: (p: V3) => V3; R: R3; k: number}) => {
  const g = sp.ground ?? FLAT;
  const L = LEGS[i];
  const H = tx.xf(r0.hip[i]);
  const R1 = rcomp(tx.R, r0.hull.R);
  const loc = (v: V3) => add3(H, rmul(R1, v));
  const broken = sp.kneeBreak!.leg === i;
  let folded = loc({x: L.sx * 0.9, y: -2.6, z: L.sz * 0.9});
  const held = !broken && !!sp.pinned?.hold && sp.pinned.leg === i;
  // (with limp, R3: the broken leg buckles over 0.35 s instead of snapping to its folded pose in a frame)
  const kk = broken ? (sp.kneeBreak!.limp ? smooth(clamp((sp.t - sp.kneeBreak!.t0) / 0.35)) : 1) : held ? 0 : smooth(clamp((tx.k - 0.15) / 0.7));
  // (R3, optional kneeBreak.limp) the free legs go limp: each foot comes to rest on the ground off the hull's side (the
  // upper side's legs drape over the belly, the lower side's splay out under the roof), knees bending up and out —
  // instead of the folded pose (legs held out level, or under the hull into the ground)
  const limp = !!sp.kneeBreak!.limp && !broken;
  if (limp && !held) {
    const c = tx.xf(r0.hull.pos), f = norm3({x: r0.fwd.x, y: 0, z: r0.fwd.z});
    let o = {x: H.x - c.x, y: 0, z: H.z - c.z};
    o = sub3(o, mul3(f, dot3(o, f)));
    const on = len3(o) > 1e-3 ? norm3(o) : rmul(R1, {x: L.sx, y: 0, z: 0});
    const x = H.x + on.x * 1.55 - f.x * L.sz * 0.35, z = H.z + on.z * 1.55 - f.z * L.sz * 0.35;
    folded = {x, y: g(x, z) + 0.25, z};
  }
  let tgt = lerp3(r0.foot[i], folded, kk);
  tgt = {...tgt, y: Math.max(tgt.y, g(tgt.x, tgt.z) + 0.25)};
  // (limp: a leg hanging from a hip high on the upper side bends its knee out and down; one from a hip by the ground
  // bends it up, clear of the ground)
  const hipUp = H.y - g(H.x, H.z);
  const pole = limp ? norm3(add3(rmul(R1, {x: L.sx * 0.6, y: 0, z: 0}), {x: 0, y: hipUp > 1.8 ? -0.35 : 1, z: 0})) : rmul(R1, {x: L.sx, y: 0.6, z: 0});
  // (R4) the knee goes where both bones stay out of the ground: the legs of the side the hull lies on were folded 0.9–2 m INTO the
  // road (D3 heavy 1's wreck, which stays on screen to the end of the film). Smallest swing of the knee about the hip–foot
  // axis first; the bones' own thickness (0.3 m) is kept above the surface except right at the hip.
  const r = sp.kneeBreak!.legsClear ? kneeAbove(H, tgt, pole, g) : ik2(H, tgt, HV.upperLen, HV.lowerLen, pole);
  return {H, K: r.mid, F: r.end, outward: rmul(R1, {x: L.sx, y: 0, z: 0})};
};

const rotPose = (P: Pose3, xf: (p: V3) => V3, R: R3): Pose3 => ({pos: xf(P.pos), R: rcomp(R, P.R)});

export const heavyAttach = (sp: HeavySpec) => {
  const r = sp.kneeBreak && sp.t >= sp.kneeBreak.t0 ? solveHeavy(sp, sp.kneeBreak.t0) : solveHeavy(sp);
  const tx = toppleXf(sp, r, sp.t);
  const X = (p: V3) => (tx ? tx.xf(p) : p);
  // after a topple the legs are the drawn, folded ones (fallenLeg), not the frozen rig carried with the hull
  const fl = tx ? r.hip.map((_, i) => fallenLeg(sp, r, i, tx)) : null;
  return {
    ramTip: X(apply(r.ramPose, {x: 0, y: 0, z: -1.4})), muzzle: X(apply(r.launcher, {x: 0, y: 0.05, z: -0.82})),
    eye: X(apply(r.head, {x: 0, y: 0.01, z: -0.5})), hull: X(r.hull.pos), head: X(r.head.pos),
    knees: fl ? fl.map((q) => q.K) : r.knee.map(X), feet: fl ? fl.map((q) => q.F) : r.foot.map(X), fwd: r.fwd,
    /** which feet are planted now (gait stance or a keyed foot on the ground) */
    planted: r.stance,
  };
};

/**
 * Footfalls of a walking heavy in (Ta, Tb] (film seconds): exact landing times from gait.distAt, else the keyed
 * `plants`. Each: {t, leg, pos (ground contact)}. Use for dust, ground shake and sound.
 */
export const heavyFootfalls = (sp: HeavySpec, Ta: number, Tb: number): {t: number; leg: number; pos: V3}[] => {
  const out: {t: number; leg: number; pos: V3}[] = [];
  const g = sp.ground ?? FLAT;
  if (sp.gait?.distAt) {
    const dA = sp.gait.distAt;
    const stride = sp.gait.stride ?? 3.0;
    const d0 = dA(Ta), d1 = dA(Tb);
    if (d1 > d0) LEGS.forEach((L, leg) => {
      for (let n = Math.ceil(d0 / stride + L.ph); (n - L.ph) * stride <= d1 && n < 1e5; n++) {
        const dk = (n - L.ph) * stride;
        if (dk <= d0) continue;
        let lo = Ta, hi = Tb;
        for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2; if (dA(m) < dk) lo = m; else hi = m; }
        const f = footAt((d) => sp.gait!.path(d - L.sz * HV.footZ), dk + 1e-4, L.ph, stride, DUTY, L.sx * HV.footX, 0.55, g);
        out.push({t: hi, leg, pos: f.pos});
      }
    });
  } else if (sp.plants && sp.feet) {
    sp.plants.forEach((pt, leg) => { const f = sp.feet![leg]; if (pt !== undefined && f && pt > Ta && pt <= Tb) out.push({t: pt, leg, pos: f}); });
  }
  return out.sort((a, b) => a.t - b.t);
};

export const heavyImpacts = (sp: HeavySpec): Impact[] => {
  const out: Impact[] = [];
  if (sp.ram) out.push({t: sp.ram.t0, pos: sp.ram.target, dir: heavyAttach({...sp, t: sp.ram.t0}).fwd, strength: 6, kind: 'blow'});
  if (sp.fire) out.push({t: sp.fire.t0, pos: heavyAttach({...sp, t: sp.fire.t0}).muzzle, dir: norm3(sub3(sp.fire.target, heavyAttach({...sp, t: sp.fire.t0}).muzzle)), strength: 5, kind: 'blow'});
  if (sp.kneeBreak) {
    const a = heavyAttach({...sp, t: sp.kneeBreak.t0});
    out.push({t: sp.kneeBreak.t0, pos: a.knees[sp.kneeBreak.leg], dir: sp.kneeBreak.dir, strength: 5, kind: 'limb'});
    const r0 = solveHeavy(sp, sp.kneeBreak.t0);
    const tx = toppleXf(sp, r0, sp.kneeBreak.t0 + 1.6);
    if (tx) out.push({t: tx.landT, pos: tx.landPos, dir: {x: 0, y: -1, z: 0}, strength: 10, kind: 'ground'});
  }
  // footfalls (ground shake, dust): exact with gait.distAt / plants (the last 3 s), else each leg's latest landing
  if (sp.gait?.distAt || sp.plants) {
    heavyFootfalls(sp, sp.t - 3, sp.t).forEach((f) => out.push({t: f.t, pos: f.pos, dir: {x: 0, y: -1, z: 0}, strength: 2, kind: 'ground', note: `leg${f.leg}`}));
  } else if (sp.gait) {
    const stride = sp.gait.stride ?? 3.0;
    const r = solveHeavy(sp);
    LEGS.forEach((L, i) => {
      const c = sp.gait!.dist / stride + L.ph;
      const n = Math.floor(c);
      out.push({t: sp.t - (c - n) * (stride / 0.9), pos: r.foot[i], dir: {x: 0, y: -1, z: 0}, strength: 2, kind: 'ground', note: `leg${i}`});
    });
  }
  return out;
};

// ------------------------------------------------------------------ debris bodies
const plateBody = (n: 'plateL' | 'plateR' | 'top' | 'nose') => bodyOf([{mesh: HEAVY[n]}], `heavy_${n}`);
const lowerBody = () => bodyOf([{mesh: HEAVY.lower}, {mesh: HEAVY.foot, P: {pos: {x: 0, y: -HV.lowerLen, z: 0}, R: I3}}], 'heavy_lower');

/** a small dust puff on the ground (expanding, fading): footfalls */
const dustPuff = (pos: V3, u: number, key: string, size = 1): Item | null => {
  if (u < 0 || u > 1.6) return null;
  const k = 1 - Math.exp(-u * 3.2);
  return {
    kind: 'sprite', pos: {x: pos.x, y: pos.y + 0.15 + 0.35 * k, z: pos.z}, key, bias: 0.2,
    draw: (c) => {
      const r = (0.6 + 1.4 * k) * size * c.k;
      if (r < 1) return null;
      const col = shade(c.light, {base: '#A3978A'}, c.lit);
      const op = 0.5 * (1 - u / 1.6) * (u < 0.08 ? u / 0.08 : 1);
      return (
        <g opacity={op}>
          <ellipse cx={f2(c.x)} cy={f2(c.y)} rx={f2(r)} ry={f2(r * 0.42)} fill={col} />
          <ellipse cx={f2(c.x - r * 0.35)} cy={f2(c.y - r * 0.18)} rx={f2(r * 0.55)} ry={f2(r * 0.3)} fill={col} />
          <ellipse cx={f2(c.x + r * 0.4)} cy={f2(c.y - r * 0.12)} rx={f2(r * 0.5)} ry={f2(r * 0.26)} fill={col} />
        </g>
      );
    },
  };
};

/** far LOD colour multiplier (ink is a smaller share of a 6 m machine's pixels than of a unit's) */
const HEAVY_FAR_TONE = 0.8;
export const heavy = (sp: HeavySpec): Item[] => {
  const t = sp.t;
  const key = sp.key ?? `h${sp.id}`;
  const g = sp.ground ?? FLAT;
  const broken = sp.kneeBreak && t >= sp.kneeBreak.t0;
  const r = broken ? solveHeavy(sp, sp.kneeBreak!.t0) : solveHeavy(sp);
  const tx = toppleXf(sp, r, t);
  const D = sp.damage ?? {};
  const dead = (D.dead && t >= D.dead.t0) || (broken && t > sp.kneeBreak!.t0 + 1.4);
  const eyeState: 'cyan' | 'amber' | 'off' = dead ? 'off' : sp.lockAt !== undefined && t >= sp.lockAt ? 'amber' : sp.eye ?? 'cyan';
  const remap = eyeState === 'amber' ? {m_eye: 'm_eyeLock'} : eyeState === 'off' ? {m_eye: 'm_eyeOff'} : undefined;
  const P = (p: Pose3) => (tx ? rotPose(p, tx.xf, tx.R) : p);
  const items: Item[] = [];
  const torn = (d?: {t0: number}) => !!d && t >= d.t0;
  items.push(partItem(HEAVY.core, P(r.hull), `${key}_core`));
  if (!torn(D.plateL)) items.push(partItem(HEAVY.plateL, P(r.hull), `${key}_pl`));
  if (!torn(D.plateR)) items.push(partItem(HEAVY.plateR, P(r.hull), `${key}_pr`));
  if (!torn(D.top)) items.push(partItem(HEAVY.top, P(r.hull), `${key}_top`));
  if (!torn(D.nose)) items.push(partItem(HEAVY.nose, P(r.hull), `${key}_nose`));
  items.push(partItem(HEAVY.head, P(r.head), `${key}_head`, {remap}));
  items.push(partItem(HEAVY.boom, P(r.boomPose), `${key}_boom`));
  items.push(partItem(HEAVY.ram, P(r.ramPose), `${key}_ram`));
  if (r.ext > 0.25) items.push(partItem(HEAVY.sleeve, P(r.ramPose), `${key}_sleeve`));
  items.push(partItem(HEAVY.launcher, P(r.launcher), `${key}_lau`));
  r.hip.forEach((H0, i) => {
    const brokenLeg = broken && sp.kneeBreak!.leg === i;
    const fl = tx ? fallenLeg(sp, r, i, tx) : null;
    const H = fl ? fl.H : H0, K = fl ? fl.K : r.knee[i], F = fl ? fl.F : r.foot[i];
    const outward = fl ? fl.outward : mul3(rmul(r.hull.R, {x: 1, y: 0, z: 0}), LEGS[i].sx);
    items.push(partItem(HEAVY.upper, {pos: H, R: segFrame(sub3(K, H), outward)}, `${key}_up${i}`));
    if (brokenLeg) {
      // the knee splits: the lower leg buckles off the joint and falls as one piece (gravity, bounce, rest)
      const K0 = r.knee[i], F0 = r.foot[i];
      const R0 = segFrame(sub3(F0, K0), mul3(rmul(r.hull.R, {x: 1, y: 0, z: 0}), LEGS[i].sx));
      const body = lowerBody();
      const dir = norm3({x: sp.kneeBreak!.dir.x, y: 0, z: sp.kneeBreak!.dir.z});
      const axis = norm3(cross3(UP, dir));
      const L: Launch = {t0: sp.kneeBreak!.t0, pos: K0, R: R0, v: add3(mul3(dir, 1.4), {x: 0, y: -0.4, z: 0}), w: mul3(axis, -2.4), e: 0.12, mu: 0.7};
      const Q = debrisPose(body, L, t, g);
      items.push(partItem(HEAVY.lower, Q, `${key}_lo${i}`));
      items.push(partItem(HEAVY.foot, {pos: apply(Q, {x: 0, y: -HV.lowerLen, z: 0}), R: Q.R}, `${key}_ft${i}`));
      // cables from the shattered knee (now hanging from the upper leg's end)
      CABLES.slice(0, 3).forEach((c, k) => items.push(cable(K, add3(K, {x: (k - 1) * 0.15, y: -0.6 - k * 0.1, z: 0.1}), 0.05, c, 0.04, `${key}_kc${k}`, true, 4)));
      items.push(...spray(t, sp.kneeBreak!.t0, K0, sp.kneeBreak!.dir, 22, 4, 'spark', sp.id * 13, `${key}_ks`, g, 0.7));
      items.push(...spray(t, sp.kneeBreak!.t0 + 0.05, K0, add3(sp.kneeBreak!.dir, {x: 0, y: 0.4, z: 0}), 14, 2.5, 'fluid', sp.id * 17, `${key}_kf`, g, 1.1));
    } else {
      items.push(partItem(HEAVY.lower, {pos: K, R: segFrame(sub3(F, K), outward)}, `${key}_lo${i}`));
      // a planted foot keeps the heading it landed with (it does not spin under a turning hull)
      items.push(partItem(HEAVY.foot, fl ? {pos: F, R: segFrame(sub3(F, K), outward)} : {pos: F, R: rotHeading(r.footH[i] ?? r.heading)}, `${key}_ft${i}`));
    }
  });
  const eyeW = (tx ? tx.xf : (p: V3) => p)(apply(r.head, {x: 0, y: 0.01, z: -0.5}));
  if (eyeState !== 'off') items.push(eyeGlow(eyeW, eyeState, 1, 0.09, `${key}_eg`, 0.06, tx ? undefined : rmul(r.head.R, {x: 0, y: 0, z: -1})));
  // muzzle flash on fire
  if (sp.fire) {
    const u = t - sp.fire.t0;
    if (u >= 0 && u < 0.18) {
      const m = (tx ? tx.xf : (p: V3) => p)(apply(r.launcher, {x: 0, y: 0.05, z: -0.85}));
      items.push({kind: 'sprite', pos: m, key: `${key}_mf`, bias: 0.3, draw: (c) => {
        const R = (0.9 - u * 3) * c.k;
        return <g><circle cx={f2(c.x)} cy={f2(c.y)} r={f2(R * 1.6)} fill="#FFB45A" opacity={0.45} /><circle cx={f2(c.x)} cy={f2(c.y)} r={f2(R * 0.7)} fill="#FFF3C2" /></g>;
      }});
    }
  }
  // torn plates: modelled in hull space; they leave the hull frame as gravity-true debris (tip over, stay)
  (['plateL', 'plateR', 'top', 'nose'] as const).forEach((n, k) => {
    const d = D[n];
    if (d && t >= d.t0) {
      const r0 = solveHeavy(sp, d.t0);
      const tx0 = toppleXf(sp, r0, d.t0);
      const P0 = tx0 ? rotPose(r0.hull, tx0.xf, tx0.R) : r0.hull;
      const body = plateBody(n);
      const hinge = n === 'plateL' ? {x: -1.4, y: 1.0, z: 0} : n === 'plateR' ? {x: 1.4, y: 1.0, z: 0} : n === 'top' ? {x: 0, y: 1.3, z: 2.0} : {x: 0, y: 1.0, z: -1.9};
      const L = tearLaunch(body, d.t0, P0, d.dir, 4.5, sp.id * 29 + k, {hinge, up: 0.25, spin: 1.5, e: 0.15, mu: 0.7});
      items.push(partItem(HEAVY[n], debrisPose(body, L, t, g), `${key}_torn_${n}`));
      items.push(...spray(t, d.t0, apply(P0, HEAVY[n].center), d.dir, 12, 4, 'spark', sp.id * 37 + k, `${key}_tsp${k}`, g, 0.6));
    }
  });
  if (broken && t > sp.kneeBreak!.t0 + 1.6) {
    const pool = fluidPool({...(tx ? tx.landPos : r.hull.pos), y: 0}, t, sp.kneeBreak!.t0 + 1.7, 1.8, sp.id, `${key}_pool`, g);
    if (pool) items.push(pool);
  }
  // footfall dust (opt-in)
  if (sp.dust && !tx) heavyFootfalls(sp, t - 1.6, t).forEach((f, i) => { const it = dustPuff(f.pos, t - f.t, `${key}_dust${f.leg}_${Math.round(f.t * 30)}_${i}`, 1.1); if (it) items.push(it); });
  if (sp.lod === 'far') {
    // R4: far = the SAME solved machine (every part where the meshes put it: legs on their footholds, a toppled hull on its
    // side, torn plates where they lie, the broken lower leg beside it), each part as one flat hull, sorted back to front.
    // (It used to be a fixed upright walker cut-out, so a toppled wreck stood up again beyond the mesh distance.)
    const prims = items.filter((i): i is MeshItem => i.kind === 'mesh').map((i) => meshPrim(i));
    const base = tx ? tx.xf(r.hull.pos) : {x: r.hull.pos.x, y: r.hull.pos.y - HV.hullY, z: r.hull.pos.z};
    return [farFigure(prims, base, key, {tone: HEAVY_FAR_TONE, eye: eyeState !== 'off' ? {pos: eyeW, dir: tx ? undefined : rmul(r.head.R, {x: 0, y: 0, z: -1}), color: eyeState, r: 0.12} : undefined}), ...items.filter((i) => i.kind === 'sprite' && (i.key ?? '').endsWith('_pool'))];
  }
  return items;
};
void [easeOut, seg, DEBRIS, len3, rnd];
