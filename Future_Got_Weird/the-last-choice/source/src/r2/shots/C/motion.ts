// Section C motion (pure: no React). Everything is a function of FILM time T in world metres, so every shot of the
// section samples the same choreography and positions hold across the cuts.
//   - walks and climbs: gaitC() on a polyline path RE-PARAMETERISED BY SLOPE (steep rubble costs more "gait metres" per
//     metre, so a fixed stride gets shorter on the climb and the walker slows there, leaning in); feet planted on GC.
//   - standing between moves: keyed roots with planted steps (stepKeys: weight shift, then each foot swings to its new
//     stance; turns step round in several steps, the foot on the turning side first).
//   - segments: a timeline of walks / stands / scripted moves; transitions blend the feet (no pops, no slides).
import {V3, clamp, smooth, lerp} from '../../../kit/math';
import type {GaitW} from '../../rig/gait';
import type {Pose} from '../../rig/poses';
import {GC} from './ground';
import {groundH} from '../../world/ground';

export type XZ = {x: number; z: number};
/** [T, x, z, heading] */
export type KR = [number, number, number, number];
/** [T, x, z] or [T, x, z, lift] (lift overrides the swing height of the move arriving at this key; 0 = a slide) */
export type KP = [number, number, number] | [number, number, number, number];

export const fwdOf = (h: number): XZ => ({x: Math.sin((h * Math.PI) / 180), z: -Math.cos((h * Math.PI) / 180)});
export const rightOf = (h: number): XZ => ({x: Math.cos((h * Math.PI) / 180), z: Math.sin((h * Math.PI) / 180)});
export const headingTo = (a: XZ, b: XZ) => (Math.atan2(b.x - a.x, -(b.z - a.z)) * 180) / Math.PI;
export const wrapD = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;
export const lerpAng = (a: number, b: number, k: number) => a + wrapD(b - a) * k;
/** a point relative to (p, heading): fwd metres ahead, right metres to the right, up metres above GC there */
export const rel = (p: XZ, h: number, fwd: number, right: number, up = 0): V3 => {
  const f = fwdOf(h), r = rightOf(h);
  const x = p.x + f.x * fwd + r.x * right, z = p.z + f.z * fwd + r.z * right;
  return {x, y: GC(x, z) + up, z};
};
/** body-relative point (height from the body's root) */
export const relB = (p: V3, h: number, fwd: number, right: number, up: number): V3 => {
  const f = fwdOf(h), r = rightOf(h);
  return {x: p.x + f.x * fwd + r.x * right, y: p.y + up, z: p.z + f.z * fwd + r.z * right};
};
/** world point → body-local Loc (rig units) of a body at pos/heading, and back */
export const toLoc = (b: {pos: V3; heading: number}, p: V3) => {
  const f = fwdOf(b.heading), r = rightOf(b.heading);
  const dx = p.x - b.pos.x, dz = p.z - b.pos.z;
  return {r: (dx * r.x + dz * r.z) * 251.4, u: (p.y - b.pos.y) * 251.4, f: (dx * f.x + dz * f.z) * 251.4};
};
export const fromLoc = (b: {pos: V3; heading: number}, l: {r: number; u: number; f: number}): V3 => {
  const f = fwdOf(b.heading), r = rightOf(b.heading);
  return {x: b.pos.x + (f.x * l.f + r.x * l.r) / 251.4, y: b.pos.y + l.u / 251.4, z: b.pos.z + (f.z * l.f + r.z * l.r) / 251.4};
};

// ------------------------------------------------------------------ keys
const seg01 = (T: number, a: number, b: number) => clamp((T - a) / Math.max(1e-6, b - a));
export const win = (T: number, a: number, b: number, ri = 0.15, ro = 0.15) => smooth(seg01(T, a, a + ri)) * (1 - smooth(seg01(T, b - ro, b)));
export const after = (T: number, a: number, d = 0.15) => smooth(seg01(T, a, a + d));
/** keyed scalar [[T, v], …], smooth between keys */
export const keyN = (k: [number, number][], T: number, ease: (x: number) => number = smooth): number => {
  if (T <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (T <= k[i][0]) return lerp(k[i - 1][1], k[i][1], ease(seg01(T, k[i - 1][0], k[i][0])));
  return k[k.length - 1][1];
};
/** keyed world points [[T, p, ease?], …] */
export const keyV = (k: [number, V3, ((x: number) => number)?][], T: number): V3 => {
  if (T <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (T <= k[i][0]) {
    const e = (k[i][2] ?? smooth)(seg01(T, k[i - 1][0], k[i][0]));
    const a = k[i - 1][1], b = k[i][1];
    return {x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), z: lerp(a.z, b.z, e)};
  }
  return k[k.length - 1][1];
};
/** keyed root (xz + heading; headings interpolate the short way) */
export const keyRoot = (k: KR[], T: number): {p: XZ; h: number} => {
  if (T <= k[0][0]) return {p: {x: k[0][1], z: k[0][2]}, h: k[0][3]};
  for (let i = 1; i < k.length; i++) if (T <= k[i][0]) {
    const a = k[i - 1], b = k[i];
    const e = smooth(seg01(T, a[0], b[0]));
    return {p: {x: lerp(a[1], b[1], e), z: lerp(a[2], b[2], e)}, h: a[3] + wrapD(b[3] - a[3]) * e};
  }
  const l = k[k.length - 1];
  return {p: {x: l[1], z: l[2]}, h: l[3]};
};
/**
 * A stepping foot: planted at each key; between two keys whose positions differ it swings (smooth, an arc of `lift`
 * metres, kept clear of the ground it passes over). Keys that repeat a position are holds. Heights from GC.
 */
export const footAt = (k: KP[], T: number, lift = 0.11): V3 & {swing: number} => {
  if (T <= k[0][0]) return {x: k[0][1], y: GC(k[0][1], k[0][2]), z: k[0][2], swing: 0};
  for (let i = 1; i < k.length; i++) if (T <= k[i][0]) {
    const a = k[i - 1], b = k[i];
    const moved = Math.hypot(b[1] - a[1], b[2] - a[2]) > 1e-4;
    if (!moved) return {x: a[1], y: GC(a[1], a[2]), z: a[2], swing: 0};
    const u = seg01(T, a[0], b[0]);
    const lf = b.length > 3 ? (b[3] as number) : lift;
    const ya = GC(a[1], a[2]), yb = GC(b[1], b[2]);
    // a step up onto something (a slab, a ledge): the foot rises first, then reaches over onto it
    const up = yb - ya > 0.15;
    const e = up ? smooth(clamp((u - 0.3) / 0.7)) : lf > 0 ? smooth(u) : 1 - (1 - u) * (1 - u);
    const x = lerp(a[1], b[1], e), z = lerp(a[2], b[2], e);
    const sw = Math.sin(Math.PI * u) * lf;
    const ey = up ? smooth(Math.min(1, u * 2.4)) : e;
    const y = Math.max(lerp(ya, yb, ey) + sw, GC(x, z) + sw * 0.7);
    return {x, y, z, swing: lf > 0 ? Math.sin(Math.PI * u) : 0};
  }
  const l = k[k.length - 1];
  return {x: l[1], y: GC(l[1], l[2]), z: l[2], swing: 0};
};

/** the stance foothold beside a root (half = half-width, stag = the left foot this far ahead, the right behind) */
export const stance = (x: number, z: number, h: number, side: -1 | 1, half = 0.15, stag = 0): [number, number] => {
  const f = fwdOf(h), r = rightOf(h);
  const fo = side < 0 ? stag : -stag;
  return [x + r.x * half * side + f.x * fo, z + r.z * half * side + f.z * fo];
};
/**
 * Planted footsteps for a keyed root (each root key a stop). For each move between keys the feet alternate — the
 * foot on the side of a sideways move leads; in a turn the foot on the turning side opens first (right foot for a
 * clockwise turn); a step lands at its stance beside the root at that moment; the move ends with both feet set.
 * Per-key options: `first` forces the leading foot of the move arriving at that key index.
 */
export const stepKeys = (root: KR[], o: {half?: number; stepLen?: number; turnStep?: number; stag?: number; first?: Record<number, 'L' | 'R'>; start?: {L: [number, number]; R: [number, number]}} = {}): {L: KP[]; R: KP[]} => {
  const half = o.half ?? 0.15, stepLen = o.stepLen ?? 0.5, stag = o.stag ?? 0, turnStep = o.turnStep ?? 55;
  const r0 = root[0];
  const L: KP[] = [[r0[0], ...(o.start?.L ?? stance(r0[1], r0[2], r0[3], -1, half, stag))]];
  const R: KP[] = [[r0[0], ...(o.start?.R ?? stance(r0[1], r0[2], r0[3], 1, half, stag))]];
  for (let i = 1; i < root.length; i++) {
    const a = root[i - 1], b = root[i];
    const dist = Math.hypot(b[1] - a[1], b[2] - a[2]);
    const dh = wrapD(b[3] - a[3]);
    const turn = Math.abs(dh);
    const n = Math.max(dist > 0.03 || turn > 5 ? 1 : 0, Math.ceil(dist / stepLen), Math.ceil(turn / turnStep));
    if (n === 0) {
      L.push([b[0], L[L.length - 1][1], L[L.length - 1][2]]);
      R.push([b[0], R[R.length - 1][1], R[R.length - 1][2]]);
      continue;
    }
    const rr = rightOf(a[3]);
    const lat = (b[1] - a[1]) * rr.x + (b[2] - a[2]) * rr.z;
    let first: 'L' | 'R' = o.first?.[i] ?? (Math.abs(lat) > dist * 0.5 && dist > 0.05 ? (lat > 0 ? 'R' : 'L') : turn > 25 ? (dh > 0 ? 'R' : 'L') : 'L');
    const steps = n + 1; // the last step sets the trailing foot
    const dur = (b[0] - a[0]) / steps;
    for (let j = 0; j < steps; j++) {
      const t0 = a[0] + dur * j, t1 = a[0] + dur * (j + 1);
      const e = smooth(Math.min(1, (j + 1) / n));
      const x = lerp(a[1], b[1], e), z = lerp(a[2], b[2], e), h = a[3] + dh * e;
      const foot = (j % 2 === 0) === (first === 'L') ? 'L' : 'R';
      const arr = foot === 'L' ? L : R, other = foot === 'L' ? R : L;
      const p = stance(x, z, h, foot === 'L' ? -1 : 1, half, stag);
      arr.push([t0 + 0.001, arr[arr.length - 1][1], arr[arr.length - 1][2]]);
      arr.push([t1, p[0], p[1]]);
      other.push([t1, other[other.length - 1][1], other[other.length - 1][2]]);
    }
    first = first === 'L' ? 'R' : 'L';
  }
  return {L, R};
};
/** is foot track k swinging at T (for weight shift: the body leans over the planted foot) */
export const swingOf = (k: KP[], T: number) => footAt(k, T).swing;

// ------------------------------------------------------------------ runs and paths
/**
 * Distance covered on a run of length L that starts from rest at T0 (accelerating over A s) and arrives at T1,
 * decelerating to a stop over the last D s.
 */
export const runDist = (T: number, T0: number, T1: number, L: number, A = 0.8, D = 0.7): number => {
  const vc = L / (T1 - T0 - A / 2 - D / 2);
  if (T <= T0) return 0;
  if (T >= T1) return D > 0 ? L : L + vc * (T - T1);
  if (T < T0 + A) return (vc * (T - T0) * (T - T0)) / (2 * A);
  const tau = T1 - T;
  if (D > 0 && tau < D) return L - (vc * tau * tau) / (2 * D);
  return (vc * A) / 2 + vc * (T - T0 - A);
};
export const cruise = (T0: number, T1: number, L: number, A = 0.8, D = 0.7) => L / (T1 - T0 - A / 2 - D / 2);

export type PathFn = (d: number) => {x: number; z: number; heading: number};
export const pathLen = (pts: XZ[]) => pts.slice(1).reduce((s, b, i) => s + Math.hypot(b.x - pts[i].x, b.z - pts[i].z), 0);
/** Polyline path (heading smoothed over ±turn m at the corners). */
export const polyPath = (pts: XZ[], turn = 0.7): {fn: PathFn; L: number} => {
  const segs = pts.slice(1).map((p, i) => ({a: pts[i], b: p, L: Math.max(1e-6, Math.hypot(p.x - pts[i].x, p.z - pts[i].z)), h: headingTo(pts[i], p)}));
  const L = segs.reduce((s, q) => s + q.L, 0);
  const fn: PathFn = (d) => {
    let r = clamp(d, 0, L);
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      if (r <= s.L || i === segs.length - 1) {
        const u = clamp(r / s.L);
        let h = s.h;
        if (i < segs.length - 1 && s.L - r < turn) h += wrapD(segs[i + 1].h - h) * smooth(1 - (s.L - r) / turn) * 0.5;
        if (i > 0 && r < turn) h -= wrapD(h - segs[i - 1].h) * smooth(1 - r / turn) * 0.5;
        // past the end: continue straight (a run that overshoots into its settle)
        const over = Math.max(0, d - L) * (i === segs.length - 1 ? 1 : 0);
        const f = fwdOf(s.h);
        return {x: lerp(s.a.x, s.b.x, u) + f.x * over, z: lerp(s.a.z, s.b.z, u) + f.z * over, heading: h};
      }
      r -= s.L;
    }
    const l = pts[pts.length - 1];
    return {x: l.x, z: l.z, heading: segs[segs.length - 1].h};
  };
  return {fn, L};
};

/** A path re-parameterised by "gait distance" s (steep ground costs more gait metres per metre). */
export type Warped = {fn: PathFn; Ls: number; L: number; dOfS: (s: number) => number; slope: (s: number) => number};
export const warpPath = (p: {fn: PathFn; L: number}, o: {k?: number; flat?: number; cap?: number; win?: number} = {}): Warped => {
  const k = o.k ?? 1.5, flat = o.flat ?? 0.12, cap = o.cap ?? 2.3, w = o.win ?? 0.45, step = 0.1;
  const L = p.L;
  const gAt = (d: number) => { const q = p.fn(clamp(d, 0, L)); return GC(q.x, q.z); };
  const n = Math.max(2, Math.ceil(L / step));
  const D: number[] = [], S: number[] = [], SL: number[] = [];
  let acc = 0, prev = 0;
  for (let i = 0; i <= n; i++) {
    const d = (L * i) / n;
    const sl = (gAt(d + w) - gAt(d - w)) / (Math.min(L, d + w) - Math.max(0, d - w) || 1);
    const dens = Math.min(cap, 1 + k * Math.max(0, Math.abs(sl) - flat));
    if (i > 0) acc += ((dens + prev) / 2) * (L / n);
    prev = dens;
    D.push(d); S.push(acc); SL.push(sl);
  }
  const Ls = acc;
  const dOfS = (s: number) => {
    if (s <= 0) return s;
    if (s >= Ls) return L + (s - Ls);
    let lo = 0, hi = n;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S[m] <= s) lo = m; else hi = m; }
    return lerp(D[lo], D[hi], (s - S[lo]) / Math.max(1e-9, S[hi] - S[lo]));
  };
  const slope = (s: number) => {
    const d = dOfS(s);
    const i = clamp(Math.round((d / L) * n), 0, n);
    return SL[i];
  };
  return {fn: (s) => p.fn(dOfS(s)), Ls, L, dOfS, slope};
};

export type GaitOut = {pos: V3; heading: number; footL: V3; footR: V3; pose: Pose; phase: number; stanceL: boolean; stanceR: boolean; slope: number; swingL: number; swingR: number};
/**
 * Walk/run along a warped path at gait distance s. Feet are planted at fixed world points during stance (their
 * plant positions are fixed in s), swing on an arc clear of the ground to the next foothold; the pelvis bobs twice
 * per stride; the body leans into the climb.
 */
export const gaitC = (path: Warped, s: number, o: GaitW, hipX = 0.15): GaitOut => {
  const W = o.stride;
  const foot = (phi: number, side: number) => {
    const c = s / W + phi;
    const k = Math.floor(c);
    const u = c - k;
    const plantS = (kk: number) => (kk - phi) * W + (W * o.duty) / 2;
    const place = (ss: number) => {
      const p = path.fn(Math.max(0, ss));
      const hr = (p.heading * Math.PI) / 180;
      const x = p.x + Math.cos(hr) * hipX * side, z = p.z + Math.sin(hr) * hipX * side;
      return {x, y: GC(x, z), z};
    };
    if (u < o.duty) { const q = place(plantS(k)); return {pos: q, so: q.y - groundH(q.x, q.z), pitch: clamp((u - (o.duty - 0.16)) / 0.16) * 22, stance: true, sw: 0}; }
    const w = (u - o.duty) / (1 - o.duty);
    const a = place(plantS(k)), b = place(plantS(k + 1));
    // a step up (a ledge, the slab's edge): the foot rises first, then reaches over onto it
    const up = b.y - a.y > 0.15;
    const e = up ? smooth(clamp((w - 0.3) / 0.7)) : smooth(w);
    const x = lerp(a.x, b.x, e), z = lerp(a.z, b.z, e);
    const lift = Math.sin(Math.PI * Math.min(1, w * 1.05)) * o.lift;
    const ey = up ? smooth(Math.min(1, w * 2.4)) : e;
    const y = Math.max(lerp(a.y, b.y, ey) + lift, GC(x, z) + lift * 0.75 + 0.02 * Math.sin(Math.PI * w));
    return {pos: {x, y, z}, so: lerp(a.y - groundH(a.x, a.z), b.y - groundH(b.x, b.z), ey), pitch: lerp(22, -10, clamp(w * 2)) * (1 - clamp((w - 0.7) / 0.3)), stance: false, sw: Math.sin(Math.PI * w)};
  };
  const R = foot(0, 1), Lf = foot(0.5, -1);
  const c = s / W;
  const drop = o.bob * (0.5 - 0.5 * Math.cos(4 * Math.PI * (c - o.duty / 2)));
  const p = path.fn(s);
  const sl = path.slope(s);
  const amp = o.armAmp;
  const sw = Math.sin(2 * Math.PI * c);
  const pose: Pose = {
    drop: drop + Math.max(0, sl) * 18, side: 0, lean: o.lean + clamp(sl, -0.4, 1.2) * 14,
    armL: {fk: {fwd: amp * sw, out: 10, bend: 18 + Math.max(0, amp * 0.6 * sw)}},
    armR: {fk: {fwd: -amp * sw, out: 10, bend: 18 + Math.max(0, -amp * 0.6 * sw)}},
    legL: {pitch: Lf.pitch}, legR: {pitch: R.pitch},
    breath: 0.45,
  };
  // the root rides the terrain plus the feet's mean height on the slab (so it follows the feet up onto / down off the
  // slab's edge instead of popping there); off the slab this is GC itself
  const y = groundH(p.x, p.z) + (Lf.so + R.so) / 2;
  return {pos: {x: p.x, y, z: p.z}, heading: p.heading, footL: Lf.pos, footR: R.pos, pose, phase: c, stanceL: Lf.stance, stanceR: R.stance, slope: sl, swingL: Lf.sw, swingR: R.sw};
};

// ------------------------------------------------------------------ a timeline of walks, stands and scripted moves
export type Seg =
  | {kind: 'walk'; path: Warped; T0: number; T1: number; gait: GaitW; A?: number; D?: number}
  | {kind: 'stand'; root: KR[]; feet: {L: KP[]; R: KP[]}}
  | {kind: 'fn'; T0: number; at: (T: number) => Body};

export type Body = {pos: V3; heading: number; footL: V3; footR: V3; gait?: Pose; runK: number; seg: number; inWalk: boolean; phase?: number; slope?: number; swingL?: number; swingR?: number; /** climbing effort 0..1 (climbs) */ climb?: number};

export const walkSeg = (pts: XZ[], T0: number, T1: number, gait: GaitW, o: {A?: number; D?: number; turn?: number; k?: number} = {}): Extract<Seg, {kind: 'walk'}> =>
  ({kind: 'walk', path: warpPath(polyPath(pts, o.turn ?? 0.7), {k: o.k}), T0, T1, gait, A: o.A, D: o.D});
export const standSeg = (root: KR[], o: Parameters<typeof stepKeys>[1] = {}): Extract<Seg, {kind: 'stand'}> => ({kind: 'stand', root, feet: stepKeys(root, o)});
/** the end of a walk: where it stops and its last heading */
export const walkEnd = (s: Extract<Seg, {kind: 'walk'}>) => { const p = s.path.fn(s.path.Ls); return {x: p.x, z: p.z, h: p.heading}; };
/** the walk's gait sample at T */
const walkAt = (s: Extract<Seg, {kind: 'walk'}>, T: number) => {
  const A = s.A ?? 0.8, D = s.D ?? 0.7;
  const d = runDist(Math.min(T, s.T1), s.T0, s.T1, s.path.Ls, A, D);
  return gaitC(s.path, d, s.gait);
};
const standAt = (s: Extract<Seg, {kind: 'stand'}>, T: number): Body => {
  const r = keyRoot(s.root, T);
  const fl = footAt(s.feet.L, T), fr = footAt(s.feet.R, T);
  // the root rides the ground under it, kept within the feet's heights (a step down off a ledge — the slab's edge —
  // lowers the body with the stepping foot instead of dropping it when the root crosses the edge)
  const lo = Math.min(fl.y - fl.swing * 0.2, fr.y - fr.swing * 0.2), hi = Math.max(fl.y, fr.y);
  const y = clamp(GC(r.p.x, r.p.z), Math.min(lo, hi), hi);
  return {pos: {x: r.p.x, y, z: r.p.z}, heading: r.h, footL: fl, footR: fr, runK: 0, seg: 0, inWalk: false, swingL: fl.swing, swingR: fr.swing};
};
const mixFoot = (a: V3, b: V3, w: number): V3 => {
  const x = lerp(a.x, b.x, w), z = lerp(a.z, b.z, w);
  return {x, y: Math.max(GC(x, z), lerp(a.y, b.y, w)) + Math.sin(Math.PI * w) * 0.07 * Math.min(1, Math.hypot(a.x - b.x, a.z - b.z) / 0.15), z};
};
/** sample the timeline at T */
export const bodyAt = (segs: Seg[], T: number): Body => {
  let i = 0;
  for (let k = 0; k < segs.length; k++) {
    const s = segs[k];
    const a = s.kind === 'stand' ? s.root[0][0] : s.T0;
    if (T >= a) i = k;
  }
  const s = segs[i];
  if (s.kind === 'fn') return {...s.at(T), seg: i};
  if (s.kind === 'walk') {
    const g = walkAt(s, T);
    const A = s.A ?? 0.8, D = s.D ?? 0.7;
    const v = (runDist(T + 0.03, s.T0, s.T1, s.path.Ls, A, D) - runDist(T - 0.03, s.T0, s.T1, s.path.Ls, A, D)) / 0.06;
    const k = clamp(v / cruise(s.T0, s.T1, s.path.Ls, A, D) * 1.25);
    let fl = g.footL, fr = g.footR, hd = g.heading;
    // push-off: the feet come out of the previous stance into the gait over the first 0.3 s, the body turns onto the path
    const prev = segs[i - 1];
    if (prev && prev.kind !== 'walk') {
      const pb = bodyAt(segs.slice(0, i), s.T0);
      const w = smooth(clamp((T - s.T0) / 0.32));
      fl = mixFoot(pb.footL, fl, w); fr = mixFoot(pb.footR, fr, w);
      hd = lerpAng(pb.heading, g.heading, smooth(clamp((T - s.T0) / 0.42)));
    }
    return {pos: g.pos, heading: hd, footL: fl, footR: fr, gait: g.pose, runK: k, seg: i, inWalk: true, phase: g.phase, slope: g.slope, swingL: g.swingL, swingR: g.swingR};
  }
  const b = standAt(s, T);
  // settle out of the previous walk: the feet land on their first stance footholds
  const prev = segs[i - 1];
  if (prev && prev.kind === 'walk') {
    const t0 = s.root[0][0];
    const w = smooth(clamp((T - t0) / 0.32));
    if (w < 1) {
      const g = walkAt(prev, t0);
      b.footL = mixFoot(g.footL, b.footL, clamp(w * 1.6));
      b.footR = mixFoot(g.footR, b.footR, clamp(w * 1.6 - 0.6));
      b.gait = g.pose;
      b.runK = 0;
    }
  }
  return {...b, seg: i};
};

// ------------------------------------------------------------------ climbs (R3): planted foot, weight transfer, new step
// A climb is a sequence of discrete steps up footholds on GC (never a walk cycle translated uphill). Each step: the
// trailing foot leaves its hold and swings up (on a step-up the knee comes up first, then the foot reaches over onto the
// new hold) while the weight sits over the planted foot; the foot plants; then the body pushes up and forward over it
// (the root rises AFTER the plant). On steep steps most of the body's travel happens in the push, so the body visibly
// works up the slope a step at a time; on gentle ground the progress evens out into a walk. Steps are shorter where the
// rubble is steep (the rise per step is capped) and take longer the more they climb. Palms can be planted on the rubble
// ahead of a step (scrambling), and the climb ends with the feet set side by side (the next stand starts from them).
export type ClimbStep = {
  foot: 'L' | 'R'; from: V3; to: V3; other: V3;
  /** start, plant (the moving foot lands), end (the push is over) */
  a: number; plant: number; b: number;
  /** rise of the new hold over the planted one (m), its steepness 0..1, the ground's slope between the holds */
  rise: number; steep: number; slope: number;
  /** root before / after the step, headings */
  r0: V3; r1: V3; h0: number; h1: number;
};
export type HandPlant = {side: 'L' | 'R'; p: V3; on: number; off: number; step: number};
export type Climb = {T0: number; T1: number; steps: ClimbStep[]; hands: HandPlant[]; end: {x: number; z: number; h: number}; feetEnd: {L: V3; R: V3}; start: {pos: V3; heading: number; footL: V3; footR: V3}};
export type ClimbOpts = {
  /** the body and feet when the climb starts (the previous segment at T0) */
  start: {pos: V3; heading: number; footL: V3; footR: V3};
  /** longest step along the path (m), largest rise per step (m), the holds' half-width (m) */
  stepLen?: number; maxRise?: number; hip?: number; turn?: number;
  /** palms on the rubble ahead of step i's new hold (fwd/out in metres from it; hold = extra s it stays) */
  hands?: {step: number; side: 'L' | 'R'; fwd?: number; out?: number; hold?: number}[];
  /** or: a palm on the n biggest step-ups (rise ≥ minRise, at least 3 steps apart) */
  autoHands?: {side: 'L' | 'R'; n: number; minRise?: number; fwd?: number; out?: number};
  /** weight shift before the first step (s) */
  lead?: number;
  /** heading the last (square-up) step turns to */
  endHeading?: number;
};
const distOnPath = (pts: XZ[], p: XZ): number => {
  let best = 1e9, bestD = 0, acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const L = Math.hypot(b.x - a.x, b.z - a.z) || 1e-6;
    const u0 = ((p.x - a.x) * (b.x - a.x) + (p.z - a.z) * (b.z - a.z)) / (L * L);
    const u = i === 1 ? Math.min(1, u0) : clamp(u0); // (behind the start: negative, so the foot further back steps first)
    const q = {x: lerp(a.x, b.x, u), z: lerp(a.z, b.z, u)};
    const d = Math.hypot(p.x - q.x, p.z - q.z) + (u < 0 ? 0 : 0);
    if (d < best - 1e-9 || (i === 1 && u < 0 && d <= best)) { best = d; bestD = acc + u * L; }
    acc += L;
  }
  return bestD;
};
export const climbPlan = (pts: XZ[], T0: number, T1: number, o: ClimbOpts): Climb => {
  const path = polyPath(pts, o.turn ?? 0.5);
  const L = path.L;
  const stepLen = o.stepLen ?? 0.46, maxRise = o.maxRise ?? 0.24, hip = o.hip ?? 0.13;
  const hold = (d: number, side: number, jit = 0): V3 => {
    const q = path.fn(clamp(d, 0, L));
    const r = rightOf(q.heading);
    const x = q.x + r.x * (hip * side + jit), z = q.z + r.z * (hip * side + jit);
    return {x, y: GC(x, z), z};
  };
  /** the foothold at d: where the rubble beside the line gives the smallest step up (a foot finds its hold) */
  const bestHold = (d: number, side: number, from: V3): V3 => {
    let best = hold(d, side), br = best.y - from.y;
    if (br <= maxRise) return best;
    for (const j of [0.08, -0.08, 0.16, -0.16]) {
      const h = hold(d, side, j * side), r = h.y - from.y;
      if (r < br - 0.03) { best = h; br = r; }
    }
    return best;
  };
  const s0 = o.start;
  const onGround = (p: V3) => ({x: p.x, y: GC(p.x, p.z), z: p.z});
  let pL = s0.footL, pR = s0.footR;
  let dL = distOnPath(pts, pL), dR = distOnPath(pts, pR);
  const airL = pL.y - GC(pL.x, pL.z) > 0.025, airR = pR.y - GC(pR.x, pR.z) > 0.025;
  type Raw = {foot: 'L' | 'R'; from: V3; to: V3; other: V3; dNew: number; last: boolean};
  const raw: Raw[] = [];
  for (let n = 0; n < 80; n++) {
    let moveL = dL <= dR;
    if (n === 0 && (airL || airR)) moveL = airL; // a foot still in the air from the walk moves first
    const dOther = moveL ? dR : dL, pOther = moveL ? pR : pL, side = moveL ? -1 : 1;
    if (dOther >= L - 1e-4) {
      const to = hold(L, side);
      raw.push({foot: moveL ? 'L' : 'R', from: moveL ? pL : pR, to, other: pOther, dNew: L, last: true});
      if (moveL) { dL = L; pL = to; } else { dR = L; pR = to; }
      break;
    }
    let s = stepLen, dn = Math.min(L, dOther + s), to = hold(dn, side);
    while (s > 0.2 && to.y - pOther.y > maxRise) { s -= 0.025; dn = Math.min(L, dOther + s); to = hold(dn, side); }
    if (to.y - pOther.y > maxRise) to = bestHold(dn, side, pOther); // a ledge: look for a lower hold beside the line
    if (L - dn < 0.2) { dn = L; to = hold(L, side); }
    raw.push({foot: moveL ? 'L' : 'R', from: moveL ? pL : pR, to, other: pOther, dNew: dn, last: false});
    if (moveL) { dL = dn; pL = to; } else { dR = dn; pR = to; }
  }
  // the first mover may start in the air: its swing starts where it is
  const lead = o.lead ?? 0.1;
  const costs = raw.map((r) => {
    const rise = r.to.y - r.other.y, trav = Math.hypot(r.to.x - r.from.x, r.to.z - r.from.z);
    return 0.36 + 0.42 * Math.min(2, trav / stepLen) * 0.5 + 1.7 * Math.max(0, rise) + 0.4 * Math.max(0, -rise) + (r.last ? -0.08 : 0);
  });
  const span = T1 - T0 - lead;
  // no step quicker than 0.2 s (the last, a small square-up, 0.24 s): raise the cheap ones and rescale the rest
  for (let it = 0; it < 4; it++) {
    const tot = costs.reduce((a, b) => a + b, 0);
    costs.forEach((c, i) => { const mn = (raw[i].last ? 0.24 : 0.2) * tot / span; if (c < mn) costs[i] = mn; });
  }
  const total = costs.reduce((a, b) => a + b, 0);
  let t = T0 + lead;
  const endH = o.endHeading ?? path.fn(L).heading;
  let rPrev: V3 = s0.pos, hPrev = s0.heading;
  const steps: ClimbStep[] = raw.map((r, i) => {
    const a = t, b = t + (costs[i] / total) * span;
    t = b;
    const rise = r.to.y - r.other.y;
    const trav = Math.hypot(r.to.x - r.other.x, r.to.z - r.other.z);
    const slope = rise / Math.max(0.12, trav);
    const steep = clamp(rise / 0.2);
    const plant = a + (b - a) * (0.4 + 0.14 * steep);
    // after the push: the weight over the new foot (between the holds, toward the new one); the last step squares up
    let r1: V3, h1: number;
    if (r.last) {
      const e = path.fn(L);
      r1 = {x: e.x, y: GC(e.x, e.z), z: e.z};
      h1 = endH;
    } else {
      const k = 0.6;
      const x = lerp(r.other.x, r.to.x, k), z = lerp(r.other.z, r.to.z, k);
      const q = path.fn(clamp(distOnPath(pts, {x, z}), 0, L));
      // (pulled back toward the path's centre line: the feet are either side of it)
      r1 = {x: lerp(x, q.x, 0.5), y: lerp(r.other.y, r.to.y, 0.55), z: lerp(z, q.z, 0.5)};
      h1 = path.fn(clamp(r.dNew - 0.1, 0, L)).heading;
    }
    const st: ClimbStep = {foot: r.foot, from: i === 0 ? r.from : r.from, to: r.to, other: r.other, a, plant, b, rise, steep, slope, r0: rPrev, r1, h0: hPrev, h1};
    rPrev = r1; hPrev = h1;
    return st;
  });
  const handAt = (i: number, side: 'L' | 'R', fwd = 0.05, out = 0.18): V3 => {
    const q = path.fn(clamp(raw[i].dNew + fwd, 0, L));
    const rt = rightOf(q.heading), sd = side === 'L' ? -1 : 1;
    const x = q.x + rt.x * out * sd, z = q.z + rt.z * out * sd;
    return {x, y: GC(x, z) + 0.025, z};
  };
  let handSpec = o.hands ?? [];
  if (o.autoHands) {
    // the hand on the same side as the foot stepping up, beside its new hold, on rubble no lower than that hold
    const ah = o.autoHands;
    const cand = steps.map((st, i) => ({i, rise: st.rise, ok: st.foot === ah.side && handAt(i, ah.side, ah.fwd, ah.out).y >= st.to.y - 0.04}))
      .filter((q) => q.ok && q.rise >= (ah.minRise ?? 0.26) && q.i < steps.length - 1).sort((a, b) => b.rise - a.rise);
    const pick: number[] = [];
    for (const q of cand) if (pick.length < ah.n && pick.every((p) => Math.abs(p - q.i) >= 3)) pick.push(q.i);
    handSpec = pick.sort((a, b) => a - b).map((i) => ({step: i, side: ah.side, fwd: ah.fwd, out: ah.out}));
  }
  const hands: HandPlant[] = handSpec.filter((hd) => hd.step < steps.length).map((hd) => {
    const st = steps[hd.step], rr = raw[hd.step];
    // (beside the new foothold, a little ahead: the palm goes down on the ledge the foot steps up onto; down while the
    // foot swings up; it pushes as the body starts up over the new foot, and comes off as the body rises)
    void rr;
    return {side: hd.side, p: handAt(hd.step, hd.side, hd.fwd, hd.out), on: st.a + (st.plant - st.a) * 0.4, off: st.plant + (st.b - st.plant) * 0.3 + (hd.hold ?? 0), step: hd.step};
  });
  const e = path.fn(L);
  const feetEnd = {L: onGround(pL), R: onGround(pR)};
  return {T0, T1, steps, hands, end: {x: e.x, z: e.z, h: endH}, feetEnd, start: s0};
};
/** the climb's body at T (root, heading, planted/swinging feet, the climbing pose as `gait`, runK 1) */
/** how far the rear (planted) foot's heel rises by the end of a steep step as the body passes over the front foot (m) */
const REAR_LIFT = 0.13;
export const climbAt = (c: Climb, T: number): Body => {
  const S = c.steps;
  const first = S[0];
  if (T < first.a) {
    // the weight shift onto the foot that will stay planted
    const k = smooth(clamp((T - c.T0) / Math.max(0.05, first.a - c.T0)));
    const sd = first.foot === 'L' ? 1 : -1;
    const g: Pose = {drop: 20 + 6 * k, lean: 12 + 8 * k * clamp(first.slope), side: 5 * sd * k, breath: 0.6};
    return {pos: c.start.pos, heading: c.start.heading, footL: c.start.footL, footR: c.start.footR, gait: g, runK: 1, seg: 0, inWalk: true, slope: first.slope, swingL: 0, swingR: 0, climb: 0};
  }
  let i = S.length - 1;
  for (let k = 0; k < S.length; k++) if (T < S[k].b) { i = k; break; }
  const st = S[i];
  const u = clamp((T - st.a) / (st.b - st.a));
  const v = clamp((T - st.a) / (st.plant - st.a)); // the swing
  const w = clamp((T - st.plant) / (st.b - st.plant)); // the push
  const swF = (st.plant - st.a) / (st.b - st.a);
  // root progress: during the swing the body rolls forward over the planted foot (so the new hold is within the short
  // legs' reach when the foot lands); it RISES in the push, after the plant (steep steps); gentle ones evenly
  const ks = st.steep;
  const kSw = 0.44;
  const kStep = u < swF ? kSw * smooth(v) : kSw + (1 - kSw) * smooth(w);
  const k = lerp(u, kStep, clamp(ks * 1.4));
  const kyStep = u < swF ? 0.06 * v : 0.06 + 0.94 * smooth(w);
  const ky = lerp(k, kyStep, clamp(ks * 1.4));
  const pos: V3 = {x: lerp(st.r0.x, st.r1.x, k), y: lerp(st.r0.y, st.r1.y, ky), z: lerp(st.r0.z, st.r1.z, k)};
  const heading = st.h0 + wrapD(st.h1 - st.h0) * smooth(u);
  // the feet: the stepping foot swings from its old hold to the new one; the other stays planted
  const up = st.to.y - st.from.y > 0.1;
  // (higher for a step up — knee first — and for a step down — the foot clears the edge it leaves before it reaches down)
  const lift = 0.08 + 0.25 * Math.max(0, st.to.y - st.from.y) + 0.22 * Math.max(0, st.from.y - st.to.y) + 0.05 * ks;
  const e = up ? smooth(clamp((v - 0.28) / 0.72)) : smooth(v);
  // (R4: the knee-first lift was smooth(v * 2.2): over a 0.12 s swing the foot rose 0.4 m in ONE frame (13 m/s) at every steep
  // step; v * 1.5 spreads it over the swing)
  const ey = up ? smooth(Math.min(1, v * 1.5)) : e;
  const x = lerp(st.from.x, st.to.x, e), z = lerp(st.from.z, st.to.z, e);
  const arc = Math.sin(Math.PI * v) * lift;
  // (R4: the rear foot's heel comes off the ground as the body rises over the front foot (the leg cannot reach it from the
  // pelvis otherwise: the rig lowered the pelvis by up to 0.28 m for 2 frames, then popped it back up when the rear foot
  // started its swing); the next step's swing starts from that height, so the foot is continuous across the boundary)
  const prevSt = i > 0 ? S[i - 1] : null;
  const carry = prevSt && Math.hypot(prevSt.other.x - st.from.x, prevSt.other.z - st.from.z) < 0.02 ? REAR_LIFT * prevSt.steep : 0;
  const fy = v >= 1 ? st.to.y : Math.max(lerp(st.from.y, st.to.y, ey) + arc + carry * (1 - smooth(Math.min(1, v * 2))), GC(x, z) + 0.9 * arc);
  const moving: V3 = v >= 1 ? st.to : {x, y: fy, z};
  const sw = v < 1 ? Math.sin(Math.PI * v) : 0;
  const rear = u < swF ? 0 : REAR_LIFT * ks * smooth(clamp((w - 0.35) / 0.65));
  const other: V3 = rear > 0 ? {x: st.other.x, y: st.other.y + rear, z: st.other.z} : st.other;
  const footL = st.foot === 'L' ? moving : other, footR = st.foot === 'R' ? moving : other;
  // the pose: lean into the slope, the knee loaded at the plant and extending through the push, weight over the planted
  // foot during the swing, the arms working (the one opposite the stepping leg forward), the trailing heel lifting
  // (the slope blends from the previous step's into this one's, so the lean never jumps at a step boundary)
  const prevSlope = i > 0 ? S[i - 1].slope : st.slope;
  const slopeK = clamp(lerp(prevSlope, st.slope, smooth(u)), 0, 0.9);
  const load = u < swF ? 0 : Math.sin(Math.PI * w);
  const sd = st.foot === 'L' ? 1 : -1; // + = weight to his right (over the right foot while the left swings)
  const armF = (16 + 10 * slopeK) * Math.sin(Math.PI * u) * 0.9;
  const pitchMove = v < 1 ? (v < 0.5 ? lerp(18, -10, v * 2) : lerp(-10, 0, (v - 0.5) * 2)) : 0;
  const pitchStance = 16 * smooth(w) * (u < swF ? 0 : 1);
  const g: Pose = {
    drop: 12 + 16 * slopeK + 16 * ks * load + 4 * (1 - ks) * Math.sin(Math.PI * u),
    lean: Math.min(33, 9 + 26 * slopeK + 5 * ks * load),
    side: 5.5 * sd * Math.sin(Math.PI * clamp(u / Math.max(0.2, swF * 1.15))),
    armL: {fk: {fwd: (st.foot === 'R' ? armF : -armF * 0.6) + 8 * slopeK, out: 12, bend: 26 + 10 * slopeK}},
    armR: {fk: {fwd: (st.foot === 'L' ? armF : -armF * 0.6) + 8 * slopeK, out: 12, bend: 26 + 10 * slopeK}},
    legL: {pitch: st.foot === 'L' ? pitchMove : pitchStance}, legR: {pitch: st.foot === 'R' ? pitchMove : pitchStance},
    breath: 0.7,
  };
  return {pos, heading, footL, footR, gait: g, runK: 1, seg: 0, inWalk: true, slope: st.slope, swingL: st.foot === 'L' ? sw : 0, swingR: st.foot === 'R' ? sw : 0, climb: clamp(0.3 + slopeK * 0.8)};
};
export const climbSeg = (c: Climb): Extract<Seg, {kind: 'fn'}> & {climb: Climb} => ({kind: 'fn', T0: c.T0, at: (T: number) => climbAt(c, T), climb: c});
/** the active hand plant of a climb at T (weight 0..1 in, held, out), or null */
export const climbHand = (c: Climb, T: number): {side: 'L' | 'R'; p: V3; w: number} | null => {
  for (const h of c.hands) {
    if (T < h.on - 0.2 || T > h.off + 0.16) continue;
    return {side: h.side, p: h.p, w: win(T, h.on - 0.2, h.off + 0.16, 0.2, 0.16)};
  }
  return null;
};
/** a climb's footfalls (time, world point, 0..1 how hard) */
export const climbPlants = (c: Climb): {t: number; p: V3; k: number}[] => c.steps.map((s) => ({t: s.plant, p: s.to, k: 0.35 + 0.65 * s.steep}));
