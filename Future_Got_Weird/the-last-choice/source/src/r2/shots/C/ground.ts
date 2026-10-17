// Section C: where feet go. GC(x, z) is the ground the Crew stand and step on in C: the set's terrain (groundH) plus
// the top of the slab the Director crawled out from under in B (it still lies in the crest notch, x −0.3 … 0.95,
// z 0.17 … 2.62: the drone pilot's place in the line is on it). Also the vault wall on the west slope (the runner's
// "collapsed slab"): a broken wall section standing across his line on the lip of the terrace, leaning back a little,
// its top edge at waist height above his take-off. Pure (no React).
import {V3, add3, mul3, norm3, cross3} from '../../../kit/math';
import {groundH} from '../../world/ground';
import {slabPoint} from '../B/rubble';

// ------------------------------------------------------------------ B's slab (mirrors shots/B/rubble.ts: X0, Z0, OUTLINE)
const SX0 = -0.3, SZ0 = 2.62, SW = 1.25, SH = 2.45;
const SLAB_OUT: [number, number][] = [
  [0, 0.06], [0.3, 0], [0.45, 0.3], [0.62, 0.45], [0.86, 0.46], [1.1, 0.52], [1.17, 0.86], [1.2, 1.25], [1.12, 1.62],
  [1.2, 2.02], [1.16, 2.45], [0.62, 2.4], [0.06, 2.45], [0, 1.6], [0.05, 0.9],
];
const inPoly = (P: [number, number][], u: number, v: number) => {
  let c = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const [ui, vi] = P[i], [uj, vj] = P[j];
    if (vi > v !== vj > v && u < ((uj - ui) * (v - vi)) / (vj - vi) + ui) c = !c;
  }
  return c;
};
/** top of B's slab at (x, z) (it has settled long before C), or null off it; `pad` m shrinks the outline */
export const slabTopB = (x: number, z: number, pad = 0.04): number | null => {
  let u = x - SX0, v = SZ0 - z;
  if (!inPoly(SLAB_OUT, u, v)) return null;
  if (pad > 0 && !(inPoly(SLAB_OUT, u + pad, v) && inPoly(SLAB_OUT, u - pad, v) && inPoly(SLAB_OUT, u, v + pad) && inPoly(SLAB_OUT, u, v - pad))) return null;
  let p = slabPoint(u / SW, v / SH, 40, false);
  u += x - p.x; v -= z - p.z;
  p = slabPoint(u / SW, v / SH, 40, false);
  return p.y;
};

/** The ground the Crew step on in section C (terrain, or the slab's top where they stand on it). */
export const GC = (x: number, z: number): number => {
  const g = groundH(x, z);
  const s = slabTopB(x, z);
  return s !== null && s > g ? s : g;
};
export const onGC = (x: number, z: number, up = 0): V3 => ({x, y: GC(x, z) + up, z});

// ------------------------------------------------------------------ the vault wall (the runner's collapsed slab)
/**
 * A broken wall section standing across the runner's line (he runs east along z ≈ 2.6) on the lip of the terrace
 * halfway up the west slope. Base along z at x = −5.55 (embedded), leaning back 12° toward the east; the front
 * (west) face toward him; the top edge flat where he plants his palm (z 2.05 … 3.1).
 */
const LEAN = (12 * Math.PI) / 180;
export const WALL = {
  o: {x: -5.55, y: 1.42, z: 1.45} as V3,
  U: {x: 0, y: 0, z: 1} as V3, // along the wall (south)
  V: {x: Math.sin(LEAN), y: Math.cos(LEAN), z: 0} as V3, // up the wall (leaning east)
  thick: 0.24,
  // outline (u along the wall from its north end, v up the face), metres: a jagged broken top, flat in the middle
  out: [[0, 0], [2.3, 0], [2.3, 0.62], [2.12, 0.86], [1.86, 1.08], [1.62, 1.13], [1.2, 1.15], [0.66, 1.12], [0.42, 0.98], [0.2, 0.74], [0, 0.66]] as [number, number][],
};
/** the wall's front normal (west, a little up) */
export const WALL_N: V3 = norm3(cross3(WALL.U, WALL.V));
/** a point on the wall: u along it, v up its face, d into it (0 = front face, thick = back face) */
export const wallPoint = (u: number, v: number, d = 0): V3 => add3(add3(add3(WALL.o, mul3(WALL.U, u)), mul3(WALL.V, v)), mul3(WALL_N, -d));
/** the top edge's height (v, m) at u (the outline's upper boundary) */
export const wallTopV = (u: number): number => {
  const top = WALL.out.slice(2); // from the south end over the top to the north end
  for (let i = 0; i < top.length - 1; i++) {
    const [ua, va] = top[i], [ub, vb] = top[i + 1];
    const lo = Math.min(ua, ub), hi = Math.max(ua, ub);
    if (u >= lo && u <= hi) return va + ((vb - va) * (u - ua)) / (ub - ua || 1);
  }
  return 0.66;
};
/** where the runner's left palm lands: on the top edge, mid-thickness, at z (world) */
export const wallGrip = (z: number): V3 => {
  const u = z - WALL.o.z;
  return wallPoint(u, wallTopV(u), WALL.thick * 0.5);
};
void groundH;
