// Heavy: a ~6 m four-legged walker with a telescoping ram arm under its nose and a launcher pod on its back.
// Slow lateral-sequence walk with planted feet (ground-shake impacts at each footfall), head/eye turns, ram wind-up
// → strike → hold → recover, launcher aim and fire (muzzle point + recoil), stumble, and a topple when a knee is
// broken: the leg folds the wrong way, the hull tips toward that corner and lands on its side (the wreck stays).
import React from 'react';
import {V3, add3, sub3, mul3, norm3, len3, dot3, cross3, clamp, lerp, lerp3, smooth, easeIn, easeOut, noise, seg, f2} from '../../kit/math';
import {Item, shade} from '../engine';
import {HEAVY, HV, DEBRIS} from './parts';
import {Pose3, R3, rotHeading, rcomp, euler, segFrame, ik2, apply, rmul, rotAxisM, lookFrame, fwdOf, I3, slerpish} from './mat3';
import {Ground, FLAT, Path, footAt, partItem, eyeGlow, makeThrow, thrownPose, spray, cable, fluidPool, CABLES} from './kit';
import {Impact} from './unit';

export type HeavySpec = {
  id: number;
  t: number;
  pos: V3;
  heading: number;
  gait?: {path: Path; dist: number; stride?: number};
  /** head and eye look at */
  look?: V3;
  eye?: 'cyan' | 'amber' | 'off';
  lockAt?: number;
  /** ram strike (tip reaches target at t0) */
  ram?: {t0: number; target: V3};
  /** launcher aim (continuous) and fire at t0 */
  aim?: V3;
  fire?: {t0: number; target: V3};
  /** knee broken: leg 0 FL, 1 FR, 2 RL, 3 RR; the walker topples toward dir */
  kneeBreak?: {t0: number; leg: 0 | 1 | 2 | 3; dir: V3};
  /** a leg pinned (tether) from t0: that foot stays put; `hold` keeps it planted through a knee-break topple too */
  pinned?: {t0: number; leg: 0 | 1 | 2 | 3; hold?: boolean};
  /** stumble (hit) */
  stumble?: {t0: number; dir: V3; strength?: number};
  /** armour plates torn off */
  damage?: {plateL?: {t0: number; dir: V3}; plateR?: {t0: number; dir: V3}; nose?: {t0: number; dir: V3}; top?: {t0: number; dir: V3}; dead?: {t0: number}};
  /** points to lift the feet over (wrecks) */
  stepOver?: V3[];
  /** explicit world footholds per leg (0 FL, 1 FR, 2 RL, 3 RR; ground contact points), overriding the gait/standing
   *  feet: a keyed walk with planted steps, a foot slipping off a slab. Optional; an absent entry is unchanged. */
  feet?: (V3 | undefined)[];
  /** extra hull drop (m): the dip as a leg gives. Optional. */
  drop?: number;
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

type HeavyRig = {
  hull: Pose3; head: Pose3; boomPose: Pose3; ramPose: Pose3; ext: number; launcher: Pose3;
  hip: V3[]; knee: V3[]; foot: V3[]; footFall: {t: number; pos: V3}[]; fwd: V3; heading: number;
};

const ramPhase = (t: number, t0: number) => {
  const u = t - t0;
  if (u < -1.3 || u > 2.2) return null;
  if (u < -0.25) return {ph: 'wind' as const, k: smooth((u + 1.3) / 1.05)};
  if (u < 0) return {ph: 'strike' as const, k: easeIn((u + 0.25) / 0.25)};
  if (u < 0.7) return {ph: 'hold' as const, k: u / 0.7};
  return {ph: 'recover' as const, k: smooth((u - 0.7) / 1.5)};
};

export const solveHeavy = (sp: HeavySpec, tOverride?: number): HeavyRig => {
  const t = tOverride ?? sp.t;
  const g = sp.ground ?? FLAT;
  let root = sp.pos, heading = sp.heading;
  let dist = 0;
  if (sp.gait) {
    dist = sp.gait.dist;
    if (sp.pinned && t > sp.pinned.t0) {
      // stop advancing once pinned (the pinned leg holds)
      // caller usually stops dist; we just keep it
    }
    const p = sp.gait.path(dist);
    root = p.pos; heading = p.heading;
  }
  const B = rotHeading(heading);
  const fwd = rmul(B, {x: 0, y: 0, z: -1}), right = rmul(B, {x: 1, y: 0, z: 0});
  const stride = sp.gait?.stride ?? 3.0;
  // body motion
  const walkPh = dist / stride;
  const bob = sp.gait ? 0.06 * Math.sin(walkPh * Math.PI * 8) : 0;
  let pitch = 0, roll = 0, yawAdd = 0;
  let shift: V3 = {x: 0, y: 0, z: 0};
  const rp = sp.ram ? ramPhase(t, sp.ram.t0) : null;
  if (rp) {
    pitch += rp.ph === 'wind' ? lerp(0, -6, rp.k) : rp.ph === 'strike' ? lerp(-6, 7, rp.k) : rp.ph === 'hold' ? 7 - rp.k * 2 : lerp(5, 0, rp.k);
    shift = add3(shift, mul3(fwd, rp.ph === 'wind' ? lerp(0, -0.4, rp.k) : rp.ph === 'strike' ? lerp(-0.4, 0.35, rp.k) : rp.ph === 'hold' ? 0.35 : lerp(0.35, 0, rp.k)));
  }
  if (sp.fire) {
    const u = t - sp.fire.t0;
    if (u > 0 && u < 1.2) { const e = Math.exp(-u * 5) * Math.sin(Math.min(u * 18, Math.PI / 2)); pitch -= 3 * e; shift = add3(shift, mul3(fwd, -0.25 * e)); }
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
    }
  }
  pitch += noise(t * 0.4, sp.id) * 0.8;
  const hullPos = add3(add3({x: root.x, y: g(root.x, root.z) + HV.hullY + bob - (sp.drop ?? 0), z: root.z}, shift), {x: 0, y: 0, z: 0});
  const hullR = rcomp(B, euler(yawAdd, pitch, roll));
  const hull: Pose3 = {pos: hullPos, R: hullR};
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
  // legs: lateral-sequence walk, planted feet
  const hip: V3[] = [], knee: V3[] = [], foot: V3[] = [];
  const footFall: {t: number; pos: V3}[] = [];
  LEGS.forEach((L, i) => {
    const H = apply(hull, {x: L.sx * HV.hipX, y: HV.hipDrop, z: L.sz * HV.hipZ});
    let target: V3;
    if (sp.gait) {
      const lat = L.sx * HV.footX;
      const fz = L.sz * HV.footZ;
      const shifted: Path = (d) => { const q = sp.gait!.path(d + -fz); return q; };
      const pinnedNow = sp.pinned && sp.pinned.leg === i && t >= sp.pinned.t0;
      const dd = pinnedNow ? Math.min(dist, solvePinDist(sp)) : dist;
      const f = footAt(shifted, dd, L.ph, stride, 0.75, lat, 0.55, g);
      target = f.pos;
      if (sp.stepOver && !f.stance) for (const w of sp.stepOver) { const dd2 = Math.hypot(w.x - f.pos.x, w.z - f.pos.z); if (dd2 < 1.6) target = {...target, y: target.y + (1.6 - dd2) * 0.6 * Math.sin(Math.PI * f.s)}; }
    } else {
      const base = add3(add3(root, mul3(right, L.sx * HV.footX)), mul3(fwd, -L.sz * HV.footZ));
      target = {x: base.x, y: g(base.x, base.z), z: base.z};
    }
    const fo = sp.feet?.[i];
    if (fo) target = fo;
    const ankle = add3(target, {x: 0, y: 0.22, z: 0});
    const out = add3(mul3(right, L.sx), mul3(UP, 0.55));
    const r = ik2(H, ankle, HV.upperLen, HV.lowerLen, out);
    hip.push(H); knee.push(r.mid); foot.push(r.end);
  });
  // ram arm: boom from the shoulder, aimed down-forward at rest, at the target on the strike
  const shoulder = apply(hull, HV.ramShoulder);
  let boomDir = norm3(add3(mul3(fwd, 1), mul3(UP, -0.18))); // ram held out low in front, under the head
  let ext = 0.2;
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
  // launcher: aims at aim/fire target
  const lm = apply(hull, HV.launcher);
  const aimAt = sp.fire && t > sp.fire.t0 - 1.5 ? sp.fire.target : sp.aim;
  let lR = rcomp(hullR, euler(0, -4, 0));
  if (aimAt) lR = lookFrame(norm3(sub3(aimAt, lm)), UP);
  let lPos = lm;
  if (sp.fire) { const u = t - sp.fire.t0; if (u > 0 && u < 0.6) lPos = add3(lm, mul3(fwdOf(lR), -0.3 * Math.exp(-u * 8))); }
  return {hull, head, boomPose, ramPose, ext, launcher: {pos: lPos, R: lR}, hip, knee, foot, footFall, fwd, heading};
};
const solvePinDist = (sp: HeavySpec) => (sp.gait ? sp.gait.dist : 0);

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

/** A leg after the topple: blends from planted to a folded, hull-local pose; segment lengths kept by IK. */
const fallenLeg = (sp: HeavySpec, r0: HeavyRig, i: number, tx: {xf: (p: V3) => V3; R: R3; k: number}) => {
  const g = sp.ground ?? FLAT;
  const L = LEGS[i];
  const H = tx.xf(r0.hip[i]);
  const R1 = rcomp(tx.R, r0.hull.R);
  const loc = (v: V3) => add3(H, rmul(R1, v));
  const broken = sp.kneeBreak!.leg === i;
  const folded = loc({x: L.sx * 0.9, y: -2.6, z: L.sz * 0.9});
  const held = !broken && !!sp.pinned?.hold && sp.pinned.leg === i;
  const kk = broken ? 1 : held ? 0 : smooth(clamp((tx.k - 0.15) / 0.7));
  let tgt = lerp3(r0.foot[i], folded, kk);
  tgt = {...tgt, y: Math.max(tgt.y, g(tgt.x, tgt.z) + 0.25)};
  const pole = rmul(R1, {x: L.sx, y: 0.6, z: 0});
  const r = ik2(H, tgt, HV.upperLen, HV.lowerLen, pole);
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
  };
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
  // footfalls (ground shake): each stance start while walking
  if (sp.gait) {
    const stride = sp.gait.stride ?? 3.0;
    LEGS.forEach((L, i) => {
      const c = sp.gait!.dist / stride + L.ph;
      const n = Math.floor(c);
      out.push({t: sp.t - (c - n) * (stride / 0.9), pos: solveHeavy(sp).foot[i], dir: {x: 0, y: -1, z: 0}, strength: 2, kind: 'ground'});
    });
  }
  return out;
};

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
  if (sp.lod === 'far') {
    const base = tx ? tx.xf(r.hull.pos) : {x: r.hull.pos.x, y: r.hull.pos.y - HV.hullY, z: r.hull.pos.z};
    return [{
      kind: 'sprite', pos: base, key: `${key}_far`, n: {x: -0.6, y: 0.3, z: 0.4},
      draw: (c) => {
        const s = c.k;
        if (s * 6 < 1.5) return null;
        const plate = shade(c.light, {base: '#C3CFD6'}, c.lit), frame = shade(c.light, {base: '#4C5D69'}, c.lit), dark = shade(c.light, {base: '#24323C'}, c.lit);
        const x = c.x, y = c.y;
        const lw = Math.max(1, 0.45 * s);
        return (
          <g>
            {[-2.4, -1.1, 1.1, 2.4].map((dx, i) => <polyline key={i} points={`${f2(x + dx * s * 0.5)},${f2(y - 3.4 * s)} ${f2(x + dx * s * 1.15)},${f2(y - 2.0 * s)} ${f2(x + dx * s)},${f2(y)}`} fill="none" stroke={frame} strokeWidth={f2(lw)} strokeLinejoin="round" />)}
            <path d={`M${f2(x - 2.4 * s)} ${f2(y - 3.3 * s)} L${f2(x + 2.3 * s)} ${f2(y - 3.5 * s)} L${f2(x + 2.4 * s)} ${f2(y - 4.9 * s)} L${f2(x - 1.8 * s)} ${f2(y - 5.1 * s)} Z`} fill={plate} />
            <rect x={f2(x - 2.9 * s)} y={f2(y - 4.0 * s)} width={f2(0.9 * s)} height={f2(0.7 * s)} fill={dark} />
            {eyeState !== 'off' && <circle cx={f2(x - 2.5 * s)} cy={f2(y - 3.65 * s)} r={f2(Math.max(0.8, 0.12 * s))} fill={eyeState === 'cyan' ? '#62D6EA' : '#FFB23F'} />}
          </g>
        );
      },
    }];
  }
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
  items.push(partItem(HEAVY.launcher, P(r.launcher), `${key}_lau`));
  r.hip.forEach((H0, i) => {
    const brokenLeg = broken && sp.kneeBreak!.leg === i;
    const fl = tx ? fallenLeg(sp, r, i, tx) : null;
    const H = fl ? fl.H : H0, K = fl ? fl.K : r.knee[i], F = fl ? fl.F : r.foot[i];
    const outward = fl ? fl.outward : mul3(rmul(r.hull.R, {x: 1, y: 0, z: 0}), LEGS[i].sx);
    items.push(partItem(HEAVY.upper, {pos: H, R: segFrame(sub3(K, H), outward)}, `${key}_up${i}`));
    if (brokenLeg) {
      // the lower leg buckles and drops off the knee (thrown from where it was at the break)
      const u = t - sp.kneeBreak!.t0;
      const K0 = r.knee[i], F0 = r.foot[i];
      const R0 = segFrame(sub3(F0, K0), mul3(rmul(r.hull.R, {x: 1, y: 0, z: 0}), LEGS[i].sx));
      const th = makeThrow(sp.kneeBreak!.t0, K0, add3(norm3(sp.kneeBreak!.dir), {x: 0, y: -0.3, z: 0}), 1.6, sp.id * 71);
      const Q = thrownPose(th, t, g, rcomp(rotAxisM(norm3(cross3(UP, sp.kneeBreak!.dir)), -40 * smooth(u / 0.4)), R0), 0.3);
      items.push(partItem(HEAVY.lower, Q, `${key}_lo${i}`));
      items.push(partItem(HEAVY.foot, {pos: apply(Q, {x: 0, y: -HV.lowerLen, z: 0}), R: Q.R}, `${key}_ft${i}`));
      // cables from the shattered knee (now hanging from the upper leg's end)
      CABLES.slice(0, 3).forEach((c, k) => items.push(cable(K, add3(K, {x: (k - 1) * 0.15, y: -0.6 - k * 0.1, z: 0.1}), 0.05, c, 0.04, `${key}_kc${k}`, true, 4)));
      items.push(...spray(t, sp.kneeBreak!.t0, K0, sp.kneeBreak!.dir, 22, 4, 'spark', sp.id * 13, `${key}_ks`, g, 0.7));
      items.push(...spray(t, sp.kneeBreak!.t0 + 0.05, K0, add3(sp.kneeBreak!.dir, {x: 0, y: 0.4, z: 0}), 14, 2.5, 'fluid', sp.id * 17, `${key}_kf`, g, 1.1));
    } else {
      items.push(partItem(HEAVY.lower, {pos: K, R: segFrame(sub3(F, K), outward)}, `${key}_lo${i}`));
      items.push(partItem(HEAVY.foot, fl ? {pos: F, R: segFrame(sub3(F, K), outward)} : {pos: F, R: rotHeading(r.heading)}, `${key}_ft${i}`));
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
  // torn plates are modelled in hull space; throw the hull frame and draw the plate in it
  (['plateL', 'plateR', 'top', 'nose'] as const).forEach((n, k) => {
    const d = D[n];
    if (d && t >= d.t0) {
      const r0 = solveHeavy(sp, d.t0);
      const tx0 = toppleXf(sp, r0, d.t0);
      const P0 = tx0 ? rotPose(r0.hull, tx0.xf, tx0.R) : r0.hull;
      // throw from the plate's centroid, keep the plate's offset from the hull origin
      const off = HEAVY[n].center;
      const c0 = apply(P0, off);
      const th = makeThrow(d.t0, c0, d.dir, 5, sp.id * 29 + k);
      const Q = thrownPose(th, t, g, P0.R, 0.1);
      items.push(partItem(HEAVY[n], {pos: sub3(Q.pos, rmul(Q.R, off)), R: Q.R}, `${key}_torn_${n}`));
      items.push(...spray(t, d.t0, c0, d.dir, 12, 4, 'spark', sp.id * 37 + k, `${key}_tsp${k}`, g, 0.6));
    }
  });
  if (broken && t > sp.kneeBreak!.t0 + 1.6) {
    const pool = fluidPool({...(tx ? tx.landPos : r.hull.pos), y: 0}, t, sp.kneeBreak!.t0 + 1.7, 1.8, sp.id, `${key}_pool`, g);
    if (pool) items.push(pool);
  }
  return items;
};
void [lerp3, easeOut, seg, I3, DEBRIS, len3];
