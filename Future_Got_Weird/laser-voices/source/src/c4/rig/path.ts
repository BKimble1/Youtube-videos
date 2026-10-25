// Curved ground paths for running figures: a Catmull-Rom curve through floor points with an arc-length table, a
// speed profile integrated to distance, and explicit foot plants laid along the curve (each foot lands ahead of the
// pelvis on its own side of the path and stays put while loaded, as in the V4-V6 footwork).
import {Plant} from './steps';

export type P2 = {x: number; z: number};
const cr = (a: number, b: number, c: number, d: number, u: number) =>
  0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);

export const makePath = (pts: P2[]) => {
  const S: P2[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[i], c = pts[i + 1], d = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < 40; k++) {
      const u = k / 40;
      S.push({x: cr(a.x, b.x, c.x, d.x, u), z: cr(a.z, b.z, c.z, d.z, u)});
    }
  }
  S.push(pts[pts.length - 1]);
  const L = [0];
  for (let i = 1; i < S.length; i++) L.push(L[i - 1] + Math.hypot(S[i].x - S[i - 1].x, S[i].z - S[i - 1].z));
  const total = L[L.length - 1];
  /** point on the curve at distance d, clamped to the curve */
  const inner = (d: number): P2 => {
    const dd = Math.max(0, Math.min(total, d));
    let lo = 0, hi = L.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (L[m] < dd) lo = m; else hi = m;
    }
    const u = (dd - L[lo]) / (L[hi] - L[lo] || 1);
    return {x: S[lo].x + (S[hi].x - S[lo].x) * u, z: S[lo].z + (S[hi].z - S[lo].z) * u};
  };
  /** unit tangent, measured inside the curve (beyond its ends the path runs straight on along the end tangents) */
  const tan = (d: number): P2 => {
    const e = 0.05;
    const dc = Math.max(e, Math.min(total - e, d));
    const a = inner(dc - e), b = inner(dc + e);
    const l = Math.hypot(b.x - a.x, b.z - a.z) || 1;
    return {x: (b.x - a.x) / l, z: (b.z - a.z) / l};
  };
  const at = (d: number): P2 => {
    if (d < 0) {
      const t = tan(0), p = inner(0);
      return {x: p.x + t.x * d, z: p.z + t.z * d};
    }
    if (d > total) {
      const t = tan(total), p = inner(total);
      return {x: p.x + t.x * (d - total), z: p.z + t.z * (d - total)};
    }
    return inner(d);
  };
  /** heading (deg; 0 = +Z, 90 = +X) of the path at distance d */
  const heading = (d: number) => {
    const t = tan(Math.max(0.06, Math.min(total - 0.06, d)));
    return (Math.atan2(t.x, t.z) * 180) / Math.PI;
  };
  return {at, tan, heading, total};
};
export type Path = ReturnType<typeof makePath>;

/** distance along a path from a speed profile v(t), integrated from t0 (where d = d0) */
export const integrate = (v: (t: number) => number, t0: number, t1: number, d0 = 0, hz = 600) => {
  const n = Math.ceil((t1 - t0) * hz);
  const D = new Float64Array(n + 1);
  D[0] = d0;
  for (let i = 1; i <= n; i++) {
    const ta = t0 + (i - 1) / hz, tb = t0 + i / hz;
    D[i] = D[i - 1] + ((v(ta) + v(tb)) / 2) / hz;
  }
  return (t: number) => {
    const x = (t - t0) * hz;
    if (x <= 0) return d0 + v(t0) * (t - t0);
    if (x >= n) return D[n] + v(t1) * (t - t1);
    const i = Math.floor(x);
    return D[i] + (D[i + 1] - D[i]) * (x - i);
  };
};

/** foot plants along a path: alternate feet every `ts` while moving; a foot lands `lead` m ahead of the pelvis (scaled
 *  with speed), `half` m to its side of the path, and stays down for `contact` s. */
export const pathPlants = (o: {path: Path; dAt: (t: number) => number; vAt: (t: number) => number; t0: number; t1: number; ts: number; phase: number; contact: number; half: number; lead: number; firstLeft?: boolean}) => {
  const Lf: Plant[] = [], Rf: Plant[] = [];
  let k = Math.ceil((o.t0 - o.phase) / o.ts);
  for (;; k++) {
    const tl = o.phase + k * o.ts;
    if (tl > o.t1) break;
    const v = o.vAt(tl);
    if (v < 0.25) continue;
    const left = ((k % 2) + 2) % 2 === (o.firstLeft === false ? 1 : 0);
    const d = o.dAt(tl) + o.lead * Math.min(1, v / 3);
    const p = o.path.at(d), tn = o.path.tan(d);
    // the character's left is the path tangent turned toward -X when facing +Z: left = (tz, -tx)
    const s = left ? 1 : -1;
    const pl: Plant = {t0: tl, t1: tl + o.contact * Math.min(1.3, 3 / Math.max(v, 1.5)), x: p.x + s * o.half * tn.z, z: p.z - s * o.half * tn.x};
    (left ? Lf : Rf).push(pl);
  }
  return {L: Lf, R: Rf};
};
