// 2D geometry for the illustration: points, smooth paths (Catmull-Rom through points, as cubic Béziers), offsets.
export type P = {x: number; y: number};
export const pt = (x: number, y: number): P => ({x, y});
export const add = (a: P, b: P): P => ({x: a.x + b.x, y: a.y + b.y});
export const sub = (a: P, b: P): P => ({x: a.x - b.x, y: a.y - b.y});
export const mul = (a: P, k: number): P => ({x: a.x * k, y: a.y * k});
export const len = (a: P) => Math.hypot(a.x, a.y);
export const nrm = (a: P): P => {
  const l = len(a) || 1;
  return {x: a.x / l, y: a.y / l};
};
export const perp = (a: P): P => ({x: -a.y, y: a.x});
export const lerpP = (a: P, b: P, u: number): P => ({x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u});
export const rot = (a: P, ang: number): P => {
  const c = Math.cos(ang), s = Math.sin(ang);
  return {x: a.x * c - a.y * s, y: a.x * s + a.y * c};
};
export const dir = (ang: number): P => ({x: Math.cos(ang), y: Math.sin(ang)});
const f = (n: number) => (Math.abs(n) < 1e-6 ? '0' : n.toFixed(4).replace(/\.?0+$/, ''));
/** smooth closed path through the points */
export const closed = (ps: P[], tension = 1) => {
  const n = ps.length;
  if (n < 3) return '';
  let d = `M${f(ps[0].x)} ${f(ps[0].y)}`;
  for (let i = 0; i < n; i++) {
    const p0 = ps[(i - 1 + n) % n], p1 = ps[i], p2 = ps[(i + 1) % n], p3 = ps[(i + 2) % n];
    const k = tension / 6;
    d += `C${f(p1.x + (p2.x - p0.x) * k)} ${f(p1.y + (p2.y - p0.y) * k)} ${f(p2.x - (p3.x - p1.x) * k)} ${f(p2.y - (p3.y - p1.y) * k)} ${f(p2.x)} ${f(p2.y)}`;
  }
  return d + 'Z';
};
/** smooth open path through the points */
export const open = (ps: P[], tension = 1) => {
  const n = ps.length;
  if (n < 2) return '';
  let d = `M${f(ps[0].x)} ${f(ps[0].y)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = ps[Math.max(0, i - 1)], p1 = ps[i], p2 = ps[i + 1], p3 = ps[Math.min(n - 1, i + 2)];
    const k = tension / 6;
    d += `C${f(p1.x + (p2.x - p0.x) * k)} ${f(p1.y + (p2.y - p0.y) * k)} ${f(p2.x - (p3.x - p1.x) * k)} ${f(p2.y - (p3.y - p1.y) * k)} ${f(p2.x)} ${f(p2.y)}`;
  }
  return d;
};
export const poly = (ps: P[]) => 'M' + ps.map((p) => `${f(p.x)} ${f(p.y)}`).join('L') + 'Z';
export const line = (ps: P[]) => 'M' + ps.map((p) => `${f(p.x)} ${f(p.y)}`).join('L');
export const n4 = f;
/** a tube along a polyline with per-point radii: centre points, normals, left/right edges and a closed outline */
export const tube = (C: P[], R: number[], capEnd = true, capStart = false) => {
  const n = C.length;
  const T: P[] = C.map((_, i) => nrm(sub(C[Math.min(n - 1, i + 1)], C[Math.max(0, i - 1)])));
  const N = T.map(perp);
  const L = C.map((c, i) => add(c, mul(N[i], R[i])));
  const Rt = C.map((c, i) => add(c, mul(N[i], -R[i])));
  const cap = (i: number, sign: number) => {
    const out: P[] = [];
    for (let k = 1; k < 6; k++) {
      const a = (k / 6) * Math.PI;
      out.push(add(C[i], add(mul(N[i], Math.cos(a) * R[i] * sign), mul(T[i], Math.sin(a) * R[i] * 0.95 * sign))));
    }
    return out;
  };
  const outline = [...L, ...(capEnd ? cap(n - 1, 1) : []), ...[...Rt].reverse(), ...(capStart ? cap(0, -1) : [])];
  return {C, T, N, L, R: Rt, rad: R, outline};
};
/** point across a tube: s in [-1, 1] from the right edge to the left edge */
export const across = (tb: ReturnType<typeof tube>, i: number, s: number): P => add(tb.C[i], mul(tb.N[i], s * tb.rad[i]));
