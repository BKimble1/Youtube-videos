export type Pt = [number, number] | [number, number, number];
export const fmt = (v: number) => (Math.round(v * 10) / 10).toString();
export const poly = (ps: Pt[], close = true) =>
  ps.length ? 'M' + ps.map((p) => fmt(p[0]) + ' ' + fmt(p[1])).join('L') + (close ? 'Z' : '') : '';
export const hull = (pts: Pt[]): [number, number][] => {
  const p = pts.map((q) => [q[0], q[1]] as [number, number]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: [number, number][] = [], up: [number, number][] = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  up.pop(); lo.pop();
  return lo.concat(up);
};
/** a tapered tube outline from a screen-space centre line with per-sample half-widths (round caps) */
export const tubePath = (c: Pt[], hw: number[], capStart = true, capEnd = true) => {
  const n = c.length;
  const L: [number, number][] = [], R: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    L.push([c[i][0] - ty * hw[i], c[i][1] + tx * hw[i]]);
    R.push([c[i][0] + ty * hw[i], c[i][1] - tx * hw[i]]);
  }
  const cap = (i: number, dir: number, to: [number, number]) => {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    const k = hw[i] * 1.35 * dir;
    const L1 = dir > 0 ? L[i] : R[i];
    return `C${fmt(L1[0] + tx * k)} ${fmt(L1[1] + ty * k)} ${fmt(to[0] + tx * k)} ${fmt(to[1] + ty * k)} ${fmt(to[0])} ${fmt(to[1])}`;
  };
  let d = 'M' + fmt(L[0][0]) + ' ' + fmt(L[0][1]);
  for (let i = 1; i < n; i++) d += 'L' + fmt(L[i][0]) + ' ' + fmt(L[i][1]);
  d += capEnd ? cap(n - 1, 1, R[n - 1]) : 'L' + fmt(R[n - 1][0]) + ' ' + fmt(R[n - 1][1]);
  for (let i = n - 2; i >= 0; i--) d += 'L' + fmt(R[i][0]) + ' ' + fmt(R[i][1]);
  d += capStart ? cap(0, -1, L[0]) : 'Z';
  return d + 'Z';
};
export const offsetLine = (c: Pt[], off: number[]) => {
  const n = c.length, out: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    out.push([c[i][0] - ty * off[i], c[i][1] + tx * off[i]]);
  }
  return out;
};
