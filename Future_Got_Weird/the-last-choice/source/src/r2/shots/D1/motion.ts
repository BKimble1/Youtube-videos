// Section D1 motion helpers (pure: no React). Everything is a function of FILM time T, in world metres, so every shot
// of the section samples the same battle: keyed positions, planted footsteps between keyed root positions, run
// profiles (start from rest, cruise, stop or hit at full speed) and polyline paths.
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

/** window weight: 0 before a, ramps to 1 by a+ri, holds, falls to 0 from b−ro to b */
export const win = (T: number, a: number, b: number, ri = 0.15, ro = 0.15) => smooth(seg(T, a, a + ri)) * (1 - smooth(seg(T, b - ro, b)));
export const after = (T: number, a: number, d = 0.15) => smooth(seg(T, a, a + d));
