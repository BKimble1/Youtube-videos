// Camera paths. Keys are passed through with a cubic Hermite spline whose tangents come from the neighbouring keys
// (Catmull-Rom on non-uniform times), so a move never stops at a key: position, direction and apparent velocity carry
// through. A key may pin its tangent to zero (`hold`) where the camera should settle.
import {a3, Cam, Frame, m3, orbit, V3, v3} from '../eng/v3';

export type CK = {az: number; el: number; dist: number; fov: number; ty: number; roll: number; tx?: number; tz?: number};
export type Key = [number, CK, {hold?: boolean}?];

const herm = (p0: number, p1: number, m0: number, m1: number, h: number, s: number) => {
  const s2 = s * s, s3_ = s2 * s;
  return (2 * s3_ - 3 * s2 + 1) * p0 + (s3_ - 2 * s2 + s) * h * m0 + (-2 * s3_ + 3 * s2) * p1 + (s3_ - s2) * h * m1;
};
export const splineRec = <T extends Record<string, number>>(t: number, keys: [number, T, {hold?: boolean}?][]): T => {
  const n = keys.length;
  if (t <= keys[0][0]) return keys[0][1];
  if (t >= keys[n - 1][0]) return keys[n - 1][1];
  let i = 0;
  while (i < n - 2 && t > keys[i + 1][0]) i++;
  const [t0, a, o0] = keys[i];
  const [t1, b, o1] = keys[i + 1];
  const h = t1 - t0;
  const s = (t - t0) / h;
  const out = {} as Record<string, number>;
  for (const k of Object.keys(a)) {
    const tan = (j: number, o?: {hold?: boolean}) => {
      if (o?.hold) return 0;
      const jp = Math.max(0, j - 1), jn = Math.min(n - 1, j + 1);
      if (jp === jn) return 0;
      const vp = (keys[jp][1] as Record<string, number>)[k] ?? 0, vn = (keys[jn][1] as Record<string, number>)[k] ?? 0;
      if (j === 0 || j === n - 1) return 0;
      return (vn - vp) / (keys[jn][0] - keys[jp][0]);
    };
    out[k] = herm((a as Record<string, number>)[k] ?? 0, (b as Record<string, number>)[k] ?? 0, tan(i, o0), tan(i + 1, o1), h, s);
  }
  return out as T;
};
export const ck = (az: number, el: number, dist: number, fov = 48, ty = 0.5, roll = 0, tx = 0, tz = 0): CK => ({az, el, dist, fov, ty, roll, tx, tz});

/** Orbit camera about the board (target = deck centre + up * ty, plus a local x/z offset). */
export const orbitBoard = (B: Frame, c: CK): Cam => {
  const tgt: V3 = a3(a3(a3(B.o, m3(v3(0, 1, 0), c.ty)), m3(B.x, c.tx ?? 0)), m3(B.z, c.tz ?? 0));
  return orbit(tgt, c.az, c.el, c.dist, c.roll, c.fov);
};

/** Orbit about a blend of anchors: the board target (weight 1 - w1 - w2 - w3) and anchors A1..A3 (hand, wrist, ear...),
 *  so a close-up can travel continuously from the board to a detail and back. */
export type CKA = CK & {w1?: number; w2?: number; w3?: number};
export const ca = (az: number, el: number, dist: number, fov: number, ty: number, w1 = 0, w2 = 0, w3 = 0, roll = 0): CKA => ({az, el, dist, fov, ty, roll, tx: 0, tz: 0, w1, w2, w3});
export const orbitAnch = (B: Frame, c: CKA, A: V3[]): Cam => {
  const base = a3(a3(a3(B.o, m3(v3(0, 1, 0), c.ty)), m3(B.x, c.tx ?? 0)), m3(B.z, c.tz ?? 0));
  const w1 = c.w1 ?? 0, w2 = c.w2 ?? 0, w3 = c.w3 ?? 0;
  const w0 = 1 - w1 - w2 - w3;
  let tgt = m3(base, w0);
  if (A[0]) tgt = a3(tgt, m3(A[0], w1));
  if (A[1]) tgt = a3(tgt, m3(A[1], w2));
  if (A[2]) tgt = a3(tgt, m3(A[2], w3));
  return orbit(tgt, c.az, c.el, c.dist, c.roll, c.fov);
};
