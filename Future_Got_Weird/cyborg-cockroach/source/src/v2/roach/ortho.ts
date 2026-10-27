// V2: flat orthographic views of the insect's millimetre model (rig/roach.ts). No perspective: a view is a screen
// origin, a scale (px per mm) and three axes, so the same posed skeleton can be drawn in profile, from above or head-on
// as clean 2D illustration. Screen y grows downward.
import {V2, V3, dot, cross, norm, sub, add, mul} from '../../lib/v3';

export type View = {R: V3; U: V3; F: V3; s: number; ox: number; oy: number};

/** az: 0 = profile from the insect's left when it heads +x (viewer at +z), 90 = viewer at +x (head-on for an insect
 *  heading +x); el: 0 = level, 90 = straight down. (ox, oy) is where world (0,0,0) lands on screen. */
export const view = (azDeg: number, elDeg: number, s: number, ox: number, oy: number): View => {
  const az = (azDeg * Math.PI) / 180, el = (elDeg * Math.PI) / 180;
  const F: V3 = norm([Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)]);
  const R: V3 = Math.abs(el) > 1.5 ? [Math.cos(az), 0, -Math.sin(az)] : norm(cross([0, 1, 0], F));
  const U = norm(cross(F, R));
  return {R, U, F, s, ox, oy};
};
/** the same view placed so that world point `at` lands on screen point (x, y) */
export const viewAt = (azDeg: number, elDeg: number, s: number, at: V3, x: number, y: number): View => {
  const v = view(azDeg, elDeg, s, 0, 0);
  const p = P(v, at);
  return {...v, ox: x - p[0], oy: y - p[1]};
};
export const P = (v: View, p: V3): V2 => [v.ox + v.s * dot(p, v.R), v.oy - v.s * dot(p, v.U)];
/** toward the viewer (larger = nearer) */
export const D = (v: View, p: V3) => dot(p, v.F);
/** a world direction's screen direction (unnormalised, px per mm) */
export const Pd = (v: View, d: V3): V2 => [v.s * dot(d, v.R), -v.s * dot(d, v.U)];
export const facing = (v: View, n: V3) => dot(n, v.F);

// ------------------------------------------------------------------ 2D path helpers
export const f2 = (n: number) => (Math.abs(n) < 1e-6 ? '0' : n.toFixed(2));
/** a smooth closed path through points (quadratic curves through the edge midpoints) */
export const smoothClosed = (pts: V2[]) => {
  const n = pts.length;
  if (n < 3) return '';
  const mid = (a: V2, b: V2): V2 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]);
  let d = `M${f2(m0[0])},${f2(m0[1])}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i], m = mid(p, pts[(i + 1) % n]);
    d += ` Q${f2(p[0])},${f2(p[1])} ${f2(m[0])},${f2(m[1])}`;
  }
  return d + ' Z';
};
export const smoothOpen = (pts: V2[]) => {
  if (pts.length < 2) return '';
  if (pts.length === 2) return `M${f2(pts[0][0])},${f2(pts[0][1])} L${f2(pts[1][0])},${f2(pts[1][1])}`;
  let d = `M${f2(pts[0][0])},${f2(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const m: V2 = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2];
    d += ` Q${f2(pts[i][0])},${f2(pts[i][1])} ${f2(m[0])},${f2(m[1])}`;
  }
  const l = pts[pts.length - 1];
  return d + ` L${f2(l[0])},${f2(l[1])}`;
};
export const polyD = (pts: V2[]) => (pts.length ? `M${pts.map((p) => `${f2(p[0])},${f2(p[1])}`).join(' L')} Z` : '');
export const hull = (pts: V2[]): V2[] => {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cr = (o: V2, a: V2, b: V2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: V2[] = [], up: V2[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return lo.slice(0, -1).concat(up.slice(0, -1));
};
/** thin a closed outline to points at least `minGap` px apart (keeps the smooth path light) */
export const thin = (pts: V2[], minGap: number) => {
  const out: V2[] = [];
  for (const p of pts) if (!out.length || Math.hypot(p[0] - out[out.length - 1][0], p[1] - out[out.length - 1][1]) >= minGap) out.push(p);
  return out;
};
/** an orthographic ellipsoid outline (centre, three semi-axes as world vectors) */
export const ellipsoidOutline = (v: View, c: V3, a: V3, b: V3, cc: V3, n = 48): V2[] => {
  const pts: V2[] = [];
  for (let i = 0; i < 18; i++)
    for (let j = 0; j < 36; j++) {
      const th = (i / 17) * Math.PI, ph = (j / 36) * Math.PI * 2;
      const p = add(c, add(mul(a, Math.sin(th) * Math.cos(ph)), add(mul(b, Math.sin(th) * Math.sin(ph)), mul(cc, Math.cos(th)))));
      pts.push(P(v, p));
    }
  return thin(hull(pts), 1.5).slice(0, n * 4);
};
export {sub, add, mul, dot, norm};
/** a closed polygon with its long edges subdivided (pieces <= maxLen px), so smoothClosed keeps straight edges straight
 *  and only softens the corners (a hull with few corners would otherwise be smoothed into a lens or an oval) */
export const densify = (pts: V2[], maxLen = 6): V2[] => {
  const out: V2[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / maxLen));
    for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  return out;
};
