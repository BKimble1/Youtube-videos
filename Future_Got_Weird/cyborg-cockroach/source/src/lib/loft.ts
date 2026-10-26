// Lofted shells: a superelliptic cross-section swept along local x with profile functions. Insect plates (pronotum,
// the plated thorax/abdomen) are convex, so each one's screen silhouette is the convex hull of its projected samples.
import {V3, V2, Frame, toW, sub, cross, dot, norm} from './v3';
import {Cam, proj} from './cam';
import {convexHull} from './g3';

export type LoftDef = {
  x0: number; // rear end (local x)
  x1: number; // front end
  w: (u: number) => number; // half width at u = (x - x0)/(x1 - x0)
  ht: (u: number) => number; // dome height above the margin
  hb: (u: number) => number; // depth below the margin
  yc: (u: number) => number; // margin height
  n?: number; // horizontal exponent of the section (2 = ellipse, larger = boxier)
};

const spow = (c: number, e: number) => Math.sign(c) * Math.pow(Math.abs(c), e);

/** local point at (u, theta): theta = 0 is the right margin (z+), pi/2 the top, pi the left margin, 3pi/2 underneath */
export const loftLocal = (d: LoftDef, u: number, th: number): V3 => {
  const x = d.x0 + (d.x1 - d.x0) * u;
  const n = d.n ?? 2.2;
  const c = Math.cos(th), s = Math.sin(th);
  const z = d.w(u) * spow(c, 2 / n);
  const y = d.yc(u) + (s >= 0 ? d.ht(u) : d.hb(u)) * spow(s, 1);
  return [x, y, z];
};
export const loftPoint = (f: Frame, d: LoftDef, u: number, th: number): V3 => toW(f, loftLocal(d, u, th));
/** outward normal (numeric) */
export const loftNormal = (f: Frame, d: LoftDef, u: number, th: number): V3 => {
  const e = 1e-3;
  const pu = sub(loftPoint(f, d, Math.min(1, u + e), th), loftPoint(f, d, Math.max(0, u - e), th));
  const pt = sub(loftPoint(f, d, u, th + e), loftPoint(f, d, u, th - e));
  let n = norm(cross(pu, pt));
  // orient outward: away from the section centre
  const c = toW(f, [d.x0 + (d.x1 - d.x0) * u, d.yc(u), 0]);
  if (dot(n, sub(loftPoint(f, d, u, th), c)) < 0) n = [-n[0], -n[1], -n[2]];
  return n;
};
export const loftSilhouette = (f: Frame, d: LoftDef, cam: Cam, nu = 28, nt = 40): V2[] => {
  const pts: V2[] = [];
  for (let i = 0; i <= nu; i++) {
    const u = i / nu;
    if (d.w(u) < 1e-3) {
      pts.push(proj(cam, loftPoint(f, d, u, Math.PI / 2)));
      continue;
    }
    for (let j = 0; j < nt; j++) pts.push(proj(cam, loftPoint(f, d, u, (j / nt) * Math.PI * 2)));
  }
  return convexHull(pts);
};
/** visible runs of a curve given as [u, theta] samples */
export const loftRuns = (f: Frame, d: LoftDef, cam: Cam, samples: [number, number][], margin = 0.02): V2[][] => {
  const runs: V2[][] = [];
  let cur: V2[] = [];
  for (const [u, th] of samples) {
    const p = loftPoint(f, d, u, th);
    const n = loftNormal(f, d, u, th);
    const vis = dot(n, norm(sub(cam.eye, p))) > margin;
    if (vis) cur.push(proj(cam, p));
    else if (cur.length) {
      if (cur.length > 1) runs.push(cur);
      cur = [];
    }
  }
  if (cur.length > 1) runs.push(cur);
  return runs;
};
/** a section at u across the top (margin to margin) */
export const sectionTop = (u: number, n = 40): [number, number][] => Array.from({length: n + 1}, (_, i) => [u, (i / n) * Math.PI] as [number, number]);
/** the margin line (theta = 0 or pi) along u */
export const marginLine = (side: 1 | -1, u0 = 0, u1 = 1, n = 40): [number, number][] => Array.from({length: n + 1}, (_, i) => [u0 + ((u1 - u0) * i) / n, side > 0 ? 0 : Math.PI] as [number, number]);
