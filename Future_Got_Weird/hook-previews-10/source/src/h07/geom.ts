// HOOK 07 vector helpers (2D points, polylines, tubes). Local to this hook.
export type V = {x: number; y: number};
export const v = (x: number, y: number): V => ({x, y});
export const add = (a: V, b: V): V => ({x: a.x + b.x, y: a.y + b.y});
export const sub = (a: V, b: V): V => ({x: a.x - b.x, y: a.y - b.y});
export const mul = (a: V, k: number): V => ({x: a.x * k, y: a.y * k});
export const dot = (a: V, b: V) => a.x * b.x + a.y * b.y;
export const len = (a: V) => Math.hypot(a.x, a.y);
export const norm = (a: V): V => {
  const l = len(a) || 1;
  return {x: a.x / l, y: a.y / l};
};
export const perp = (a: V): V => ({x: -a.y, y: a.x});
export const lerpV = (a: V, b: V, u: number): V => ({x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u});
export const rotAbout = (p: V, c: V, ang: number): V => {
  const s = Math.sin(ang), co = Math.cos(ang);
  const dx = p.x - c.x, dy = p.y - c.y;
  return {x: c.x + dx * co - dy * s, y: c.y + dx * s + dy * co};
};
export const P = (p: V) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
export const T = (pts: [number, number][]) => pts.map(([x, y]) => ({x, y}));

/** Catmull-Rom densified polyline through the points (open). */
export const crSample = (pts: V[], per = 8): V[] => {
  const out: V[] = [];
  const n = pts.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const u = k / per, u2 = u * u, u3 = u2 * u;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
      out.push({x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y)});
    }
  }
  out.push(pts[n - 1]);
  return out;
};

export const polyLen = (pts: V[]) => {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += len(sub(pts[i], pts[i - 1]));
  return L;
};
/** point and unit direction at arc length s along a polyline */
export const at = (pts: V[], s: number): {p: V; d: V} => {
  if (s <= 0) return {p: pts[0], d: norm(sub(pts[1], pts[0]))};
  for (let i = 1; i < pts.length; i++) {
    const seg = len(sub(pts[i], pts[i - 1]));
    if (s <= seg) return {p: lerpV(pts[i - 1], pts[i], s / (seg || 1)), d: norm(sub(pts[i], pts[i - 1]))};
    s -= seg;
  }
  const n = pts.length;
  return {p: pts[n - 1], d: norm(sub(pts[n - 1], pts[n - 2]))};
};

/** polyline as an SVG path (straight segments; feed it densified points) */
export const lineD = (pts: V[]) => 'M' + pts.map(P).join(' L');
/** closed polygon */
export const polyD = (pts: V[]) => 'M' + pts.map(P).join(' L') + 'Z';

/** outline of a tapered tube around a (densified) centre line */
export const tubeD = (c: V[], r: (u: number) => number, capEnd = true, capStart = false) => {
  const n = c.length;
  const L: V[] = [], R: V[] = [];
  for (let i = 0; i < n; i++) {
    const d = norm(sub(c[Math.min(n - 1, i + 1)], c[Math.max(0, i - 1)]));
    const nn = perp(d);
    const rr = r(i / (n - 1));
    L.push(add(c[i], mul(nn, rr)));
    R.push(add(c[i], mul(nn, -rr)));
  }
  const dEnd = norm(sub(c[n - 1], c[n - 2]));
  const dSt = norm(sub(c[0], c[1]));
  const re = r(1), rs = r(0);
  let d = 'M' + L.map(P).join(' L');
  if (capEnd) d += ` Q${P(add(c[n - 1], add(mul(dEnd, re * 1.1), mul(perp(dEnd), re))))} ${P(add(c[n - 1], mul(dEnd, re)))} Q${P(add(c[n - 1], add(mul(dEnd, re * 1.1), mul(perp(dEnd), -re))))} ${P(R[n - 1])}`;
  d += ' L' + R.slice().reverse().map(P).join(' L');
  if (capStart) d += ` Q${P(add(c[0], add(mul(dSt, rs * 1.1), mul(perp(dSt), -rs))))} ${P(add(c[0], mul(dSt, rs)))} Q${P(add(c[0], add(mul(dSt, rs * 1.1), mul(perp(dSt), rs))))} ${P(L[0])}`;
  return d + 'Z';
};
