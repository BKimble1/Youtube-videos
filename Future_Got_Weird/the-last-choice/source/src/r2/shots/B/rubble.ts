// Section B: the rubble the Director displaces (pure: meshes and their motion as functions of film time; no React).
//   - THE SLAB bridging the notch in the crest he lies in (it rests on the two rubble mounds and on his back): his
//     right hand comes out from under its east edge (B1); when his back leaves it (B2) it drops onto the mounds with
//     a slam, and it stays there (registered in persist.ts for later shots on the ridge).
//   - three chunks that lie on him / under his knee and are shed as he drags himself out and rises.
import {V3, add3, sub3, mul3, norm3, cross3, dot3, clamp, smooth, rotAxis, rnd} from '../../../kit/math';
import type {Item, MeshItem} from '../../engine/scene';
import {prep, Prepped, slab} from '../../engine/mesh';
import {brokenSlab, chunkMesh} from '../../world/props';
import {groundH} from '../../world/ground';
import {headingVec} from '../../engine/camera';
import {TB, R0, R1, HD, rootB} from './director';

const F = headingVec(HD), Rt = headingVec(HD + 90);

// ------------------------------------------------------------------ the slab
const SW = 1.25, SH = 2.45, ST = 0.26; // east–west, north–south, thickness (m)
const X0 = -0.3, Z0 = 2.62; // its south-west corner (plan)
/** bottom-face supports: the north mound, the south mound, his upper back (B1) */
const PN: V3 = {x: -0.1, y: groundH(-0.1, 0.42) + 0.02, z: 0.42};
const PS: V3 = {x: -0.1, y: groundH(-0.1, 2.5) + 0.02, z: 2.5};
const PB: V3 = {x: 0.78, y: groundH(0.78, 1.6) + 0.37, z: 1.6};
/** the plane frame through three bottom points: U east, V north, N up (bottom face at N = 0) */
const frame = (a: V3, b: V3, c: V3) => {
  const V = norm3(sub3(a, b)); // south support → north support
  let N = norm3(cross3(sub3(c, b), V));
  if (N.y < 0) N = mul3(N, -1);
  const U = norm3(cross3(V, N));
  return {U, V, N, o: b};
};
const A = frame(PN, PS, PB);
// his arching back lifts it (east side up), then it drops back when his back leaves it, a little lower than before
const LIFT_DEG = -3.2, SETTLE_DEG = 2.4;
/** the slab's mesh in a local frame: x east (U), y up (N), z south (−V); origin on the mound line at the south support */
let SLAB: Prepped | null = null;
// its broken outline: the south edge is bitten back where his right arm comes out from under it
const OUTLINE: [number, number][] = [
  [0, 0.06], [0.3, 0], [0.45, 0.3], [0.62, 0.45], [0.86, 0.46], [1.1, 0.52], [1.17, 0.86], [1.2, 1.25], [1.12, 1.62],
  [1.2, 2.02], [1.16, 2.45], [0.62, 2.4], [0.06, 2.45], [0, 1.6], [0.05, 0.9],
];
const slabMesh = () => (SLAB ??= prep(slab({x: X0 - PS.x, y: ST, z: Z0 - PS.z}, {x: 1, y: 0, z: 0}, {x: 0, y: 0, z: -1}, OUTLINE.map(([u, v]) => ({u, v})), ST, 'concrete', 'concreteEdge', 'concreteDark')));
/** tilt (deg, + = east side down) at film time T: rests on him, lifts with his back, drops when he is out */
export const slabSettle = (T: number) => {
  const lift = LIFT_DEG * smooth((T - (TB.push + 0.1)) / 0.5);
  const t0 = TB.slabLand - 0.14;
  if (T < t0) return lift;
  const u = T - t0;
  if (u < 0.14) return LIFT_DEG + (SETTLE_DEG - LIFT_DEG) * (u / 0.14) ** 2;
  return SETTLE_DEG * (1 - 0.25 * Math.exp(-(u - 0.14) * 10) * Math.sin((u - 0.14) * 34));
};
const toWorld = (q: V3, deg: number) => {
  // local → plane frame at rest → rotation about the mound line (V axis through PS), east side down
  const w = add3(add3(add3(A.o, mul3(A.U, q.x)), mul3(A.N, q.y)), mul3(A.V, -q.z));
  if (!deg) return w;
  return add3(A.o, rotAxis(sub3(w, A.o), A.V, (deg * Math.PI) / 180));
};
export const slabItem = (T: number, o: Partial<MeshItem> = {}): MeshItem => {
  const deg = slabSettle(T);
  return {kind: 'mesh', mesh: slabMesh(), key: 'bSlab', fn: (p) => toWorld(p, deg), noCull: true, ...o};
};
/** a world point on the slab's underside / east edge (for dust and the camera): u east 0..1, v north 0..1 */
export const slabPoint = (u: number, v: number, T: number, under = true): V3 =>
  toWorld({x: X0 - PS.x + SW * u, y: under ? 0 : ST, z: Z0 - PS.z - SH * v}, slabSettle(T));
/** the slab's east edge (plan x) and the bitten-back south edge his right arm comes out under (plan z) */
export const SLAB_EAST_X = X0 + 1.15;
export const SLAB_SOUTH_Z = Z0 - 0.45;

// ------------------------------------------------------------------ the chunks he sheds
type Chunk = {key: string; seed: number; size: number; t0: number; ride: (T: number) => V3; v: V3; spin: V3; rest0?: V3};
const backOf = (T: number, f: number, r: number, up: number) => { const p = rootB(T); return {x: p.x + F.x * f + Rt.x * r, y: groundH(p.x, p.z) + up, z: p.z + F.z * f + Rt.z * r}; };
const CHUNKS: Chunk[] = [
  // the lump in front of his face (B1: it hides his head from the lens); his head shoves it off as he drags himself out
  {key: 'bCh0', seed: 30, size: 0.36, t0: TB.pull + 0.14, ride: () => { const x = R0.x + F.x * 1.13 - Rt.x * 0.06, z = R0.z + F.z * 1.13 - Rt.z * 0.06; return {x, y: groundH(x, z) + 0.03, z}; }, v: {x: 1.15, y: 0.4, z: 0.05}, spin: {x: 0.1, y: 0.2, z: -1}},
  // on his lower back: tumbles off toward his right side (south) as he arches up
  {key: 'bCh1', seed: 7, size: 0.26, t0: TB.push + 0.18, ride: (T) => backOf(T, 0.18, 0.05, 0.36), v: {x: 0.35, y: 1.1, z: 1.5}, spin: {x: 1, y: 0.2, z: 0.3}},
  // on his left calf: slides off northward on the first pull
  {key: 'bCh2', seed: 13, size: 0.21, t0: TB.pull + 0.25, ride: (T) => backOf(T, -0.62, -0.16, 0.2), v: {x: 0.1, y: 0.45, z: -1.05}, spin: {x: -1, y: 0.3, z: 0.1}},
  // beside his right knee: kicked down the slope when the knee comes under him
  {key: 'bCh3', seed: 21, size: 0.3, t0: TB.knee - 0.18, ride: () => {
    const x = R1.x - F.x * 0.48 + Rt.x * 0.34, z = R1.z - F.z * 0.48 + Rt.z * 0.34;
    return {x, y: groundH(x, z) + 0.02, z};
  }, v: {x: 1.4, y: 0.7, z: 0.75}, spin: {x: 0.2, y: 0.3, z: -1}},
];
const G = 9.81;
/** a chunk's motion after t0: flight, one bounce, a short slide (deterministic) */
const FLY = new Map<string, {p: V3; ang: number}>();
const fly = (c: Chunk, T0: number): {p: V3; ang: number} => {
  const T = Math.min(T0, c.t0 + 3); // at rest by then (cached: later shots draw the rest pose)
  if (T0 >= c.t0 + 3 && FLY.has(c.key)) return FLY.get(c.key)!;
  const p0 = c.ride(Math.min(T, c.t0));
  if (T <= c.t0) return {p: p0, ang: 0};
  const r = c.size * 0.35;
  let p = p0, v = c.v, t = T - c.t0, ang = 0, bounces = 0;
  const dt = 1 / 120;
  for (let s = 0; s * dt < t; s++) {
    const h = Math.min(dt, t - s * dt);
    v = {x: v.x, y: v.y - G * h, z: v.z};
    p = add3(p, mul3(v, h));
    const gy = groundH(p.x, p.z) + r * 0.4;
    if (p.y < gy) {
      p = {...p, y: gy};
      if (bounces < 2 && v.y < -1.0) { v = {x: v.x * 0.55, y: -v.y * 0.3, z: v.z * 0.55}; bounces++; }
      else { v = {x: v.x * Math.exp(-h * 5), y: 0, z: v.z * Math.exp(-h * 5)}; }
    }
    ang += Math.hypot(v.x, v.z) * h / Math.max(0.05, r) * 0.9 + (bounces === 0 ? 4 * h : 0);
  }
  if (T0 >= c.t0 + 3) FLY.set(c.key, {p, ang});
  return {p, ang};
};
export const chunkItems = (T: number): Item[] => CHUNKS.map((c) => {
  const {p, ang} = fly(c, T);
  const axis = norm3(c.spin);
  const P = {x: p.x, y: p.y - c.size * 0.12, z: p.z};
  return {kind: 'mesh', mesh: chunkMesh(c.seed, rnd(c.seed) > 0.5 ? 'rubble' : 'rubbleDark'), key: c.key, xf: {pos: P, scale: c.size}, fn: (q: V3) => add3(P, rotAxis(sub3(q, P), axis, ang + c.seed)), asObject: true} as MeshItem;
});
/** where/when the chunks hit the ground first (for dust and sound): [time, point] */
export const chunkHits = (): {key: string; t: number; p: V3}[] => CHUNKS.map((c) => {
  // find first ground contact
  for (let T = c.t0; T < c.t0 + 2; T += 1 / 60) {
    const a = fly(c, T), b = fly(c, T + 1 / 60);
    if (b.p.y >= a.p.y && T > c.t0 + 0.05) return {key: c.key, t: T, p: a.p};
  }
  return {key: c.key, t: c.t0 + 0.4, p: fly(c, c.t0 + 0.4).p};
});

// the rubble the slab rests on at each end (static dressing; persists)
const SUPPORTS: [number, number, number, number, string][] = [
  [-0.05, 0.38, 0.42, 3, 'rubble'], [0.5, 0.3, 0.34, 9, 'rubbleDark'], [-0.42, 0.55, 0.3, 14, 'concreteDark'], [0.2, 0.05, 0.36, 18, 'rubble'],
  [-0.12, 2.62, 0.44, 23, 'rubble'], [0.95, 2.66, 0.3, 26, 'rubbleDark'], [-0.45, 2.42, 0.3, 29, 'concrete'], [-0.35, 2.95, 0.38, 6, 'rubbleDark'],
];
export const supportItems = (): Item[] => SUPPORTS.map(([x, z, sz, seed, mat], i) => ({
  kind: 'mesh', mesh: chunkMesh(seed, mat), key: `bSup${i}`, xf: {pos: {x, y: groundH(x, z) - sz * 0.2, z}, scale: sz, yaw: seed * 37}, asObject: true,
} as MeshItem));

/** Persisting after B: the settled slab, its supports and the shed chunks where they came to rest. */
export const rubbleRestItems = (): Item[] => [slabItem(40), ...supportItems(), ...chunkItems(40)];
void [dot3, clamp, smooth, R0];
