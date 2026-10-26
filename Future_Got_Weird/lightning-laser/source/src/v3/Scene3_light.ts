// V3 scenery: the discharge as a local light source. Everything the bolt lights (cloud undersides, the tower's facing
// side, the summit rock, nearby rain) uses these helpers, so the light falls off with distance from the channel
// instead of washing the whole frame.
import {clamp} from '../dc/math';
import {BOLT3, dot3, len3, mul3, norm3, sub3, v3, V3} from '../v2/p3';

/** points along the bolt (every 12 m of leader length) that emit light once the leader has passed them */
const SAMPLES: {p: V3; s: number}[] = (() => {
  const out: {p: V3; s: number}[] = [];
  for (let s = 4; s <= BOLT3.total; s += 12) {
    const q = BOLT3.pts.find((p) => p.s >= s) ?? BOLT3.pts[BOLT3.pts.length - 1];
    out.push({p: v3(q.x, q.y, q.z), s});
  }
  return out;
})();
/** leader length (m) implied by a point on BOLT3 (View3 passes the current leader tip as boltTop) */
export const sOfTop = (top?: V3) => {
  if (!top) return 0;
  let best = 0, bd = 1e9;
  for (const q of BOLT3.pts) {
    const d = Math.abs(q.x - top.x) + Math.abs(q.y - top.y) + Math.abs(q.z - top.z);
    if (d < bd) { bd = d; best = q.s; }
  }
  return best;
};
export const boltSamples = (s: number) => SAMPLES.filter((q) => q.s <= s + 6).map((q) => q.p);

/** the fixed light point used by the tower and the rock (the lower guided section, just above the rod tip): those
 *  pieces do not know the leader length, and the scene light is only strong once the channel exists anyway */
export const LOW_BOLT: V3[] = [v3(3, 136, 0), v3(14, 168, 0)];

/** illumination (0..1) at point p with surface normal n (optional) from a set of light points, with a soft
 *  inverse-square falloff of reference distance r0 (m) */
export const lightAt = (p: V3, pts: V3[], r0: number, n?: V3) => {
  let acc = 0;
  for (const q of pts) {
    const d = sub3(q, p);
    const L = len3(d);
    const fall = (r0 * r0) / (r0 * r0 + L * L);
    const lam = n ? clamp(dot3(n, mul3(d, 1 / (L || 1))) * 0.85 + 0.15) : 1;
    acc = Math.max(acc, fall * lam);
  }
  return clamp(acc);
};
/** horizontal direction from p toward the light (for vertical walls) */
export const lightDirH = (p: V3, pts: V3[]) => {
  const q = pts[0];
  return norm3(v3(q.x - p.x, 0, q.z - p.z));
};
