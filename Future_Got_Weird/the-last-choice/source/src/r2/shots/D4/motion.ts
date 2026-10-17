// Section D4 motion helpers (pure: no React). A copy of D1's motion.ts (keyed roots, planted footsteps, run profiles,
// polyline paths; D4 keeps its own copy so edits there never shift this section), plus the crew body timeline (runs on
// gaitW, keyed stands with planted steps, scripted moves) and planted footsteps for heavy 2's four legs.
import {V3, clamp, smooth, lerp} from '../../../kit/math';
import {groundH} from '../../world/ground';

export type XZ = {x: number; z: number};
/** [T, x, z] or [T, x, z, lift] (lift overrides the swing height of the move arriving at this key; 0 = a slide) */
export type KP = [number, number, number] | [number, number, number, number];
/** [T, x, z, heading] */
export type KR = [number, number, number, number];
/** [T, value] */
export type KN = [number, number];

export const G = (x: number, z: number) => groundH(x, z);
export const onG = (x: number, z: number, up = 0): V3 => ({x, y: groundH(x, z) + up, z});
/** heading (deg, 0 = north/−z, 90 = east) → forward / right unit vectors in the ground plane */
export const fwdOf = (h: number): XZ => ({x: Math.sin((h * Math.PI) / 180), z: -Math.cos((h * Math.PI) / 180)});
export const rightOf = (h: number): XZ => ({x: Math.cos((h * Math.PI) / 180), z: Math.sin((h * Math.PI) / 180)});
export const headingTo = (a: XZ, b: XZ) => (Math.atan2(b.x - a.x, -(b.z - a.z)) * 180) / Math.PI;
export const wrapD = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;
/** a point relative to (p, heading): fwd metres ahead, right metres to the right, up metres above the ground there */
export const rel = (p: XZ, h: number, fwd: number, right: number, up = 0): V3 => {
  const f = fwdOf(h), r = rightOf(h);
  const x = p.x + f.x * fwd + r.x * right, z = p.z + f.z * fwd + r.z * right;
  return {x, y: groundH(x, z) + up, z};
};
/** a body-relative point: height measured from the root's ground (not the ground under the point) */
export const relB = (p: V3, h: number, fwd: number, right: number, up: number): V3 => {
  const f = fwdOf(h), r = rightOf(h);
  return {x: p.x + f.x * fwd + r.x * right, y: p.y + up, z: p.z + f.z * fwd + r.z * right};
};

// ------------------------------------------------------------------ keys
const seg = (T: number, a: number, b: number) => clamp((T - a) / Math.max(1e-6, b - a));
/** keyed scalar, smooth between keys */
export const keyN = (k: KN[], T: number, ease: (x: number) => number = smooth): number => {
  if (T <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (T <= k[i][0]) return lerp(k[i - 1][1], k[i][1], ease(seg(T, k[i - 1][0], k[i][0])));
  return k[k.length - 1][1];
};
/** keyed xz, smooth between keys (each key is a stop) */
export const keyXZ = (k: KP[], T: number): XZ => {
  if (T <= k[0][0]) return {x: k[0][1], z: k[0][2]};
  for (let i = 1; i < k.length; i++) if (T <= k[i][0]) {
    const e = smooth(seg(T, k[i - 1][0], k[i][0]));
    return {x: lerp(k[i - 1][1], k[i][1], e), z: lerp(k[i - 1][2], k[i][2], e)};
  }
  const l = k[k.length - 1];
  return {x: l[1], z: l[2]};
};
/** keyed root (xz + heading; headings interpolate the short way) */
export const keyRoot = (k: KR[], T: number): {p: XZ; h: number} => {
  if (T <= k[0][0]) return {p: {x: k[0][1], z: k[0][2]}, h: k[0][3]};
  for (let i = 1; i < k.length; i++) if (T <= k[i][0]) {
    const a = k[i - 1], b = k[i];
    const e = smooth(seg(T, a[0], b[0]));
    return {p: {x: lerp(a[1], b[1], e), z: lerp(a[2], b[2], e)}, h: a[3] + wrapD(b[3] - a[3]) * e};
  }
  const l = k[k.length - 1];
  return {p: {x: l[1], z: l[2]}, h: l[3]};
};
/**
 * A stepping foot: planted at each key; between two keys whose positions differ it swings (smooth, an arc of `lift`
 * metres). Keys that repeat a position are holds. Height from the ground.
 */
export const footAt = (k: KP[], T: number, lift = 0.12): V3 & {swing: number} => {
  if (T <= k[0][0]) return {...onG(k[0][1], k[0][2]), swing: 0};
  for (let i = 1; i < k.length; i++) if (T <= k[i][0]) {
    const a = k[i - 1], b = k[i];
    const moved = Math.hypot(b[1] - a[1], b[2] - a[2]) > 1e-4;
    if (!moved) return {...onG(a[1], a[2]), swing: 0};
    const u = seg(T, a[0], b[0]);
    const lf = b.length > 3 ? (b[3] as number) : lift;
    const e = lf > 0 ? smooth(u) : 1 - (1 - u) * (1 - u); // a slide decelerates (friction)
    const x = lerp(a[1], b[1], e), z = lerp(a[2], b[2], e);
    const y = G(x, z) + Math.sin(Math.PI * u) * lf;
    return {x, y, z, swing: lf > 0 ? Math.sin(Math.PI * u) : 0};
  }
  const l = k[k.length - 1];
  return {...onG(l[1], l[2]), swing: 0};
};

/**
 * Planted footsteps for a keyed root (each root key a stop). For every move between keys the feet alternate (the foot
 * on the side of the move leads), each step landing at its stance position beside the root at that moment; the move
 * ends with both feet set. `half` = half the stance width (m), `stepLen` = max step (m), `back` = stance stagger
 * (the left foot `back` m ahead of centre, the right behind: a fighting stance; 0 = square).
 */
export const autoSteps = (root: KR[], o: {half?: number; stepLen?: number; stag?: number} = {}): {L: KP[]; R: KP[]} => {
  const half = o.half ?? 0.19, stepLen = o.stepLen ?? 0.6, stag = o.stag ?? 0;
  const stance = (x: number, z: number, h: number, side: -1 | 1): [number, number] => {
    const f = fwdOf(h), r = rightOf(h);
    const fo = side < 0 ? stag : -stag;
    return [x + r.x * half * side + f.x * fo, z + r.z * half * side + f.z * fo];
  };
  const r0 = root[0];
  const L: KP[] = [[r0[0], ...stance(r0[1], r0[2], r0[3], -1)]];
  const R: KP[] = [[r0[0], ...stance(r0[1], r0[2], r0[3], 1)]];
  for (let i = 1; i < root.length; i++) {
    const a = root[i - 1], b = root[i];
    const dist = Math.hypot(b[1] - a[1], b[2] - a[2]);
    const turn = Math.abs(wrapD(b[3] - a[3]));
    const n = Math.max(dist > 0.02 || turn > 4 ? 1 : 0, Math.ceil(dist / stepLen), Math.ceil(turn / 50));
    if (n === 0) {
      L.push([b[0], L[L.length - 1][1], L[L.length - 1][2]]);
      R.push([b[0], R[R.length - 1][1], R[R.length - 1][2]]);
      continue;
    }
    // which foot leads: the one on the side of the move (sideways), else alternate starting with the left
    const rr = rightOf(a[3]);
    const lat = ((b[1] - a[1]) * rr.x + (b[2] - a[2]) * rr.z);
    let first: 'L' | 'R' = Math.abs(lat) > dist * 0.5 && dist > 0.02 ? (lat > 0 ? 'R' : 'L') : 'L';
    const steps = n + 1; // the last step sets the trailing foot
    const dur = (b[0] - a[0]) / steps;
    for (let j = 0; j < steps; j++) {
      const t1 = a[0] + dur * (j + 1);
      const t0 = a[0] + dur * j;
      const kk = Math.min(1, (j + 1) / n);
      const e = smooth(kk);
      const x = lerp(a[1], b[1], e), z = lerp(a[2], b[2], e), h = a[3] + wrapD(b[3] - a[3]) * e;
      const foot = (j % 2 === 0) === (first === 'L') ? 'L' : 'R';
      const arr = foot === 'L' ? L : R, other = foot === 'L' ? R : L;
      const p = stance(x, z, h, foot === 'L' ? -1 : 1);
      // hold until the step starts, then swing
      arr.push([t0 + 0.001, arr[arr.length - 1][1], arr[arr.length - 1][2]]);
      arr.push([t1, p[0], p[1]]);
      other.push([t1, other[other.length - 1][1], other[other.length - 1][2]]);
    }
    first = first === 'L' ? 'R' : 'L';
  }
  return {L, R};
};

// ------------------------------------------------------------------ runs and paths
/**
 * Distance covered (m) on a run of length L that starts from rest at T0 (accelerating over A s) and arrives at T1,
 * decelerating to a stop over the last D s (D = 0: arrives at full speed — a hit).
 */
export const runDist = (T: number, T0: number, T1: number, L: number, A = 1.1, D = 0.7): number => {
  const vc = L / (T1 - T0 - A / 2 - D / 2);
  if (T <= T0) return 0;
  if (T >= T1) return D > 0 ? L : L + vc * (T - T1);
  if (T < T0 + A) return (vc * (T - T0) * (T - T0)) / (2 * A);
  const tau = T1 - T;
  if (D > 0 && tau < D) return L - (vc * tau * tau) / (2 * D);
  return (vc * A) / 2 + vc * (T - T0 - A);
};
export const runSpeed = (T: number, T0: number, T1: number, L: number, A = 1.1, D = 0.7) => (runDist(T + 0.02, T0, T1, L, A, D) - runDist(T - 0.02, T0, T1, L, A, D)) / 0.04;
export const cruise = (T0: number, T1: number, L: number, A = 1.1, D = 0.7) => L / (T1 - T0 - A / 2 - D / 2);

export const pathLen = (pts: XZ[]) => pts.slice(1).reduce((s, b, i) => s + Math.hypot(b.x - pts[i].x, b.z - pts[i].z), 0);
/** Polyline path: d → point and heading (smoothed over `turn` m at corners). Same convention as the mech kit's Path. */
export const linePath = (pts: XZ[], turn = 1.4) => {
  const segs = pts.slice(1).map((p, i) => ({a: pts[i], b: p, L: Math.max(1e-6, Math.hypot(p.x - pts[i].x, p.z - pts[i].z))}));
  const hd = (a: XZ, b: XZ) => headingTo(a, b);
  return (d: number): {pos: V3; heading: number} => {
    let r = clamp(d, 0, segs.reduce((s, q) => s + q.L, 0));
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      if (r <= s.L || i === segs.length - 1) {
        const u = clamp(r / s.L);
        const x = lerp(s.a.x, s.b.x, u), z = lerp(s.a.z, s.b.z, u);
        let h = hd(s.a, s.b);
        if (i < segs.length - 1 && s.L - r < turn) h += wrapD(hd(segs[i + 1].a, segs[i + 1].b) - h) * smooth(1 - (s.L - r) / turn) * 0.5;
        if (i > 0 && r < turn) h -= wrapD(h - hd(segs[i - 1].a, segs[i - 1].b)) * smooth(1 - r / turn) * 0.5;
        return {pos: {x, y: 0, z}, heading: h};
      }
      r -= s.L;
    }
    const l = pts[pts.length - 1];
    return {pos: {x: l.x, y: 0, z: l.z}, heading: 0};
  };
};

/**
 * A path re-parameterised by "gait distance": steep ground (the crater's inner slope, the rim) costs more gait distance
 * per metre, so a gait with a fixed stride takes shorter steps there and a run with a fixed profile in gait distance
 * slows on the climb. `k` = extra gait metres per metre per unit of |slope| above `flat`; `cap` = max density.
 * Returns the warped path (s → point, heading), its gait length Ls, and the density / slope at s.
 */
export const slopeWarp = (path: (d: number) => {pos: V3; heading: number}, L: number, o: {k?: number; flat?: number; cap?: number; win?: number} = {}) => {
  const k = o.k ?? 1.7, flat = o.flat ?? 0.1, cap = o.cap ?? 2.8, w = o.win ?? 0.7, step = 0.2;
  const gAt = (d: number) => {
    const p = path(clamp(d, 0, L)).pos;
    return groundH(p.x, p.z);
  };
  const n = Math.max(2, Math.ceil(L / step));
  const D: number[] = [], S: number[] = [], SL: number[] = [];
  let acc = 0;
  for (let i = 0; i <= n; i++) {
    const d = (L * i) / n;
    // slope along the path, averaged over ±win m (the rubble is blocky)
    const sl = (gAt(d + w) - gAt(d - w)) / (Math.min(L, d + w) - Math.max(0, d - w) || 1);
    const dens = Math.min(cap, 1 + k * Math.max(0, Math.abs(sl) - flat));
    if (i > 0) acc += ((dens + (1 + k * Math.max(0, Math.abs(SL[i - 1]) - flat))) / 2) * (L / n);
    D.push(d); S.push(acc); SL.push(sl);
  }
  const Ls = acc;
  const dOfS = (s: number) => {
    if (s <= 0) return 0;
    if (s >= Ls) return L + (s - Ls);
    let lo = 0, hi = n;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S[m] <= s) lo = m; else hi = m; }
    return lerp(D[lo], D[hi], (s - S[lo]) / Math.max(1e-9, S[hi] - S[lo]));
  };
  const idx = (s: number) => clamp(Math.round((dOfS(s) / L) * n), 0, n);
  return {
    path: (s: number) => path(dOfS(s)),
    Ls, dOfS,
    slope: (s: number) => SL[idx(s)],
    density: (s: number) => Math.min(cap, 1 + k * Math.max(0, Math.abs(SL[idx(s)]) - flat)),
  };
};

/**
 * A gait foot: the mech kit's footAt math (mech/kit.tsx; duplicated here so the specs stay pure), with the swinging
 * foot kept clear of the ground it passes over (a straight swing between two plants cuts through a convex rim).
 * Returns the ground contact point (the kit adds the ankle height), stance flag and swing fraction.
 */
export const gaitFoot = (path: (d: number) => {pos: V3; heading: number}, dist: number, phase: number, stride: number, duty: number, lateral: number, lift: number) => {
  const c = dist / stride + phase;
  const n = Math.floor(c), u = c - n;
  const plantD = (q: number) => (q - phase + duty / 2) * stride;
  const place = (d: number) => {
    const p = path(d);
    const h = (p.heading * Math.PI) / 180;
    const x = p.pos.x + Math.cos(h) * lateral, z = p.pos.z + Math.sin(h) * lateral;
    return {x, y: groundH(x, z), z};
  };
  if (u < duty) return {...place(plantD(n)), stance: true, s: 0};
  const s = (u - duty) / (1 - duty);
  const a = place(plantD(n)), b = place(plantD(n + 1));
  const e = smooth(s);
  const x = lerp(a.x, b.x, e), z = lerp(a.z, b.z, e);
  const L = Math.sin(Math.PI * s) * lift;
  const y = Math.max(lerp(a.y, b.y, e) + L, groundH(x, z) + L * 0.75 + 0.02 * Math.sin(Math.PI * s));
  return {x, y, z, stance: false, s};
};

/** window weight: 0 before a, ramps to 1 by a+ri, holds, falls to 0 from b−ro to b */
export const win = (T: number, a: number, b: number, ri = 0.15, ro = 0.15) => smooth(seg(T, a, a + ri)) * (1 - smooth(seg(T, b - ro, b)));
export const after = (T: number, a: number, d = 0.15) => smooth(seg(T, a, a + d));

// ================================================================== the crew body timeline (from D1/crew.tsx)
import {gaitW, GaitW} from '../../rig/gait';
import type {Pose} from '../../rig/poses';

export type Seg =
  /** a run along a polyline on gaitW (A = accel s, D = decel s; D 0 = arrives at speed); back = backpedal (faces
   *  against the path: heading + 180, the feet swap sides) */
  | {kind: 'run'; path: XZ[]; T0: number; T1: number; gait: GaitW; A?: number; D?: number; back?: boolean}
  /** keyed root with planted steps (autoSteps) or explicit footholds */
  | {kind: 'stand'; root: KR[]; feet?: {L: KP[]; R: KP[]}; stag?: number; stepLen?: number; half?: number}
  /** a scripted move (root and footholds as functions of T) */
  | {kind: 'fn'; T0: number; at: (T: number) => {pos: V3; heading: number; footL: V3; footR: V3}};

export type Body = {pos: V3; heading: number; footL: V3; footR: V3; gait?: Pose; runK: number; seg: number; inRun: boolean; phase?: number};

export const mixFoot = (a: V3, b: V3, w: number): V3 => {
  const x = lerp(a.x, b.x, w), z = lerp(a.z, b.z, w);
  return {x, y: Math.max(G(x, z), lerp(a.y, b.y, w)) + Math.sin(Math.PI * w) * 0.06 * Math.min(1, Math.hypot(a.x - b.x, a.z - b.z) / 0.2), z};
};
const FEET = new WeakMap<object, {L: KP[]; R: KP[]}>();
export const standAt = (s: Extract<Seg, {kind: 'stand'}>, T: number): Body => {
  const r = keyRoot(s.root, T);
  let feet = s.feet ?? FEET.get(s);
  if (!feet) FEET.set(s, (feet = autoSteps(s.root, {stepLen: s.stepLen ?? 0.5, half: s.half ?? 0.15, stag: s.stag ?? 0.12})));
  const fl = footAt(feet.L, T, 0.1), fr = footAt(feet.R, T, 0.1);
  return {pos: onG(r.p.x, r.p.z), heading: r.h, footL: fl, footR: fr, runK: 0, seg: 0, inRun: false};
};
const runAt = (s: Extract<Seg, {kind: 'run'}>, T: number) => {
  const L = pathLen(s.path);
  const A = s.A ?? 1.0, D = s.D ?? 0.6;
  const d = runDist(Math.min(T, s.T1 + (D > 0 ? 0 : 0.6)), s.T0, s.T1, L, A, D);
  const g = gaitW(s.path, Math.min(d, L + 0.6), s.gait, G);
  const v = runSpeed(T, s.T0, s.T1, L, A, D);
  const k = clamp(v / cruise(s.T0, s.T1, L, A, D));
  if (s.back) return {pos: g.pos, heading: g.heading + 180, footL: g.footR, footR: g.footL, gait: {...g.pose, lean: -(g.pose.lean ?? 0) * 0.5, armL: g.pose.armR, armR: g.pose.armL}, runK: k, phase: g.phase};
  return {pos: g.pos, heading: g.heading, footL: g.footL, footR: g.footR, gait: g.pose, runK: k, phase: g.phase};
};
/** sample a timeline of runs and stands (feet planted; a run starts from the stance and settles into the next) */
export const bodyAt = (segs: Seg[], T: number): Body => {
  let i = 0;
  for (let k = 0; k < segs.length; k++) {
    const s = segs[k];
    const a = s.kind === 'stand' ? s.root[0][0] : s.T0;
    if (T >= a) i = k;
  }
  const s = segs[i];
  if (s.kind === 'fn') return {...s.at(T), runK: 0, seg: i, inRun: false};
  if (s.kind === 'run') {
    const r = runAt(s, T);
    let fl = r.footL, fr = r.footR;
    const prev = segs[i - 1];
    if (prev && prev.kind !== 'run') {
      const pb = prev.kind === 'stand' ? standAt(prev, s.T0) : prev.at(s.T0);
      const w = smooth(clamp((T - s.T0) / 0.32));
      fl = mixFoot(pb.footL, fl, w); fr = mixFoot(pb.footR, fr, w);
    }
    return {...r, footL: fl, footR: fr, seg: i, inRun: true};
  }
  const b = standAt(s, T);
  const prev = segs[i - 1];
  if (prev && prev.kind === 'run') {
    const t0 = s.root[0][0];
    const w = smooth(clamp((T - t0) / 0.3));
    if (w < 1) {
      const pr = runAt(prev, t0);
      b.footL = mixFoot(pr.footL, b.footL, clamp(w * 1.6));
      b.footR = mixFoot(pr.footR, b.footR, clamp(w * 1.6 - 0.6));
      b.gait = pr.gait;
      b.runK = (1 - w) * pr.runK;
    }
  }
  return {...b, seg: i};
};
/** the run's end point and heading (to start the next stand exactly there) */
export const runEnd = (path: XZ[]): {x: number; z: number; h: number} => {
  const a = path[path.length - 2], b = path[path.length - 1];
  return {x: b.x, z: b.z, h: headingTo(a, b)};
};

/** world point → body-local Loc (rig units) of a body at pos/heading */
export const toLoc = (b: {pos: V3; heading: number}, p: V3) => {
  const f = fwdOf(b.heading), r = rightOf(b.heading);
  const dx = p.x - b.pos.x, dz = p.z - b.pos.z;
  return {r: (dx * r.x + dz * r.z) * 251.4, u: (p.y - b.pos.y) * 251.4, f: (dx * f.x + dz * f.z) * 251.4};
};
export const fromLoc = (b: {pos: V3; heading: number}, l: {r: number; u: number; f: number}): V3 => {
  const f = fwdOf(b.heading), r = rightOf(b.heading);
  return {x: b.pos.x + (f.x * l.f + r.x * l.r) / 251.4, y: b.pos.y + l.u / 251.4, z: b.pos.z + (f.z * l.f + r.z * l.r) / 251.4};
};
/** head yaw (deg, body-relative) to look at a world point, clamped */
export const lookYaw = (b: {pos: V3; heading: number}, at: XZ, lim = 70) => clamp(wrapD(headingTo(b.pos, at) - b.heading), -lim, lim);
export const lookPitch = (b: {pos: V3}, at: V3, eye = 1.55) => clamp((Math.atan2(at.y - (b.pos.y + eye), Math.hypot(at.x - b.pos.x, at.z - b.pos.z)) * -180) / Math.PI, -35, 35);
export const lerp3v = (a: V3, b: V3, k: number): V3 => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k)});

// ================================================================== heavy 2's four legs: planted steps
/** the heavy's standing foothold for leg i (0 FL, 1 FR, 2 RL, 3 RR) of a hull root at (x, z, heading) */
export const HV_FOOT = {x: 2.55, z: 2.7};
const LEG_SX = [-1, 1, -1, 1], LEG_SZ = [-1, -1, 1, 1];
export const heavyStance = (x: number, z: number, h: number, i: number): [number, number] => {
  const f = fwdOf(h), r = rightOf(h);
  return [x + r.x * LEG_SX[i] * HV_FOOT.x - f.x * LEG_SZ[i] * HV_FOOT.z, z + r.z * LEG_SX[i] * HV_FOOT.x - f.z * LEG_SZ[i] * HV_FOOT.z];
};
/**
 * Planted footholds for a four-legged walker on a keyed root (each key a stop): over each move the legs step in the
 * lateral sequence (FL, RR, FR, RL), each landing where its stance will be a third of a cycle later, so the last cycle
 * sets every foot on the final stance. `cycle` = seconds per full cycle (all four legs once).
 */
export const quadSteps = (root: KR[], o: {cycle?: number; lift?: number} = {}): KP[][] => {
  const order = [0, 3, 1, 2];
  const r0 = root[0];
  const legs: KP[][] = [0, 1, 2, 3].map((i) => [[r0[0], ...heavyStance(r0[1], r0[2], r0[3], i)] as KP]);
  for (let s = 1; s < root.length; s++) {
    const a = root[s - 1], b = root[s];
    const dist = Math.hypot(b[1] - a[1], b[2] - a[2]), turn = Math.abs(wrapD(b[3] - a[3]));
    if (dist < 0.05 && turn < 3) { legs.forEach((L) => L.push([b[0], L[L.length - 1][1], L[L.length - 1][2]])); continue; }
    const dt = b[0] - a[0];
    const n = Math.max(1, Math.round(dt / (o.cycle ?? 2.2)), Math.ceil(dist / 2.6));
    const cyc = dt / n;
    const sw = cyc * 0.25;
    for (let c = 0; c < n; c++) {
      order.forEach((i, j) => {
        const t0 = a[0] + c * cyc + j * sw, t1 = t0 + sw * 0.92;
        // (the last cycle sets every foot on the final stance: the body settles over them)
        const at = c === n - 1 ? b[0] : Math.min(b[0], t1 + cyc * 0.35);
        const rp = keyRoot(root, at);
        const p = heavyStance(rp.p.x, rp.p.z, rp.h, i);
        const L = legs[i];
        L.push([t0, L[L.length - 1][1], L[L.length - 1][2]]);
        L.push([t1, p[0], p[1], o.lift ?? 0.55]);
      });
    }
    legs.forEach((L) => L.push([b[0], L[L.length - 1][1], L[L.length - 1][2]]));
  }
  return legs;
};
