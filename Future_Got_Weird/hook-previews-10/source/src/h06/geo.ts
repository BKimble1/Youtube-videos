// Small 2D geometry helpers for HOOK 06.
export type P = {x: number; y: number};
export const V = (x: number, y: number): P => ({x, y});
export const add = (a: P, b: P): P => ({x: a.x + b.x, y: a.y + b.y});
export const sub = (a: P, b: P): P => ({x: a.x - b.x, y: a.y - b.y});
export const mul = (a: P, k: number): P => ({x: a.x * k, y: a.y * k});
export const len = (a: P) => Math.hypot(a.x, a.y);
export const nrm = (a: P): P => {
  const l = Math.hypot(a.x, a.y) || 1;
  return {x: a.x / l, y: a.y / l};
};
export const rot = (a: P, ang: number, c: P = {x: 0, y: 0}): P => {
  const s = Math.sin(ang), co = Math.cos(ang);
  const dx = a.x - c.x, dy = a.y - c.y;
  return {x: c.x + dx * co - dy * s, y: c.y + dx * s + dy * co};
};
export const lerpP = (a: P, b: P, u: number): P => ({x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u});
export const cubic = (p0: P, p1: P, p2: P, p3: P, u: number): P => {
  const a = (1 - u) ** 3, b = 3 * u * (1 - u) ** 2, c = 3 * u * u * (1 - u), d = u ** 3;
  return {x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y};
};
/** points evenly spaced by arc length along a cubic */
export const cubicArc = (p0: P, p1: P, p2: P, p3: P, n: number) => {
  const M = 240;
  const raw: P[] = [];
  const cum: number[] = [0];
  for (let i = 0; i <= M; i++) raw.push(cubic(p0, p1, p2, p3, i / M));
  for (let i = 1; i <= M; i++) cum.push(cum[i - 1] + len(sub(raw[i], raw[i - 1])));
  const L = cum[M];
  const out: P[] = [];
  let j = 0;
  for (let i = 0; i <= n; i++) {
    const target = (i / n) * L;
    while (j < M - 1 && cum[j + 1] < target) j++;
    const u = (target - cum[j]) / (cum[j + 1] - cum[j] || 1);
    out.push(lerpP(raw[j], raw[j + 1], Math.min(1, Math.max(0, u))));
  }
  return {pts: out, L};
};
const f = (x: number) => x.toFixed(2);
export const poly = (pts: P[], close = true) => 'M' + pts.map((p) => `${f(p.x)},${f(p.y)}`).join('L') + (close ? 'Z' : '');
export const ptsStr = (pts: P[]) => pts.map((p) => `${f(p.x)},${f(p.y)}`).join(' ');
