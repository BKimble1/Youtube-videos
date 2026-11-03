// V2: the fracture's interfaces and its one moving fragment (the shared contract for glue, wet film, healing, the
// story's instruments and the oyster match). World millimetres, as anatomy.ts (the patient's right forearm, palm up,
// hand up the frame; the radius on screen right; the fracture at the origin).
//
// Each crack is a SEAM: a smooth centreline (Catmull-Rom through anatomy.ts's C1/C2/C3) with two complementary jagged
// edges a gap apart (the two broken faces fit together like a puzzle, a gap of about 0.8-1.0 mm between them). The
// seam's normal n = perp(tangent) = (-t.y, t.x) defines its sides:
//   C1 (transverse, ulnar -> radial border): side +1 = below (the shaft; right of the C3 junction, the WEDGE)
//   C2 (styloid crack, C1 -> up into the joint): side +1 = right (the styloid fragment), -1 = left (lunate fragment)
//   C3 (wedge crack, C1 -> down to the radial border): side +1 = left/below (the shaft), -1 = right (the WEDGE)
// The wedge (a small radial butterfly fragment: below C1's radial part, right of C3) is the only fragment that moves:
// at frame 0 it sits displaced (out toward the radial side, slightly tilted) and the surgeon's probe pushes it home.
// Its seam edges (C1 side +1 beyond the C3 junction, and C3 side -1) move with wedgeXf(). The glue never moves bone.
import {P, pt, add, sub, mul, nrm, perp, len, lerpP} from '../core/geo';
import {C1, C2, C3} from './anatomy';
import {clamp, hash, noise1} from '../lib';

export type SeamId = 'C1' | 'C2' | 'C3';
export const SEAM_IDS: SeamId[] = ['C1', 'C2', 'C3'];

// ---------------------------------------------------------------- smooth centrelines
type Line = {pts: P[]; cum: number[]; L: number};
const mkLine = (pts: P[]): Line => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + len(sub(pts[i], pts[i - 1])));
  return {pts, cum, L: cum[cum.length - 1]};
};
/** Catmull-Rom through the vertices, densely sampled (passes through every vertex, so junctions stay exact) */
const catmull = (ps: P[], per = 24): P[] => {
  const out: P[] = [];
  for (let i = 0; i < ps.length - 1; i++) {
    const p0 = ps[Math.max(0, i - 1)], p1 = ps[i], p2 = ps[i + 1], p3 = ps[Math.min(ps.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const u = k / per, u2 = u * u, u3 = u2 * u;
      out.push(pt(
        0.5 * (2 * p1.x + (-p0.x + p2.x) * u + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3),
        0.5 * (2 * p1.y + (-p0.y + p2.y) * u + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3),
      ));
    }
  }
  out.push(ps[ps.length - 1]);
  return out;
};
/** the vertex polylines, softened slightly toward their chords (the jag lives in the edge profile instead) */
const soften = (ps: P[], k: number) => ps.map((p, i) => (i === 0 || i === ps.length - 1 ? p : lerpP(p, lerpP(ps[i - 1], ps[i + 1], 0.5), k)));
const RAW: Record<SeamId, P[]> = {C1, C2, C3};
// junction vertices must stay exact: C1 keeps vertices 6 (the C2 junction) and 7 (the C3 junction)
const C1S = soften(C1, 0.35).map((p, i) => (i === 6 || i === 7 ? C1[i] : p));
const CENTRE: Record<SeamId, Line> = {C1: mkLine(catmull(C1S)), C2: mkLine(catmull(soften(C2, 0.3))), C3: mkLine(catmull(soften(C3, 0.25)))};
void RAW;

export const seamLength = (id: SeamId) => CENTRE[id].L;
/** the arc length along a seam's centreline nearest to a point */
export const seamNearest = (id: SeamId, p: P): number => {
  const c = CENTRE[id];
  let best = 0, bd = 1e9;
  for (let i = 0; i < c.pts.length; i++) {
    const d = len(sub(c.pts[i], p));
    if (d < bd) { bd = d; best = c.cum[i]; }
  }
  return best;
};
/** where C2 and C3 leave C1 (arc lengths along C1) */
export const S_C2_ON_C1 = seamNearest('C1', C1[6]);
export const S_C3_ON_C1 = seamNearest('C1', C1[7]);

const atS = (c: Line, s: number): P => {
  if (s <= 0) return add(c.pts[0], mul(nrm(sub(c.pts[1], c.pts[0])), s));
  if (s >= c.L) return add(c.pts[c.pts.length - 1], mul(nrm(sub(c.pts[c.pts.length - 1], c.pts[c.pts.length - 2])), s - c.L));
  let lo = 0, hi = c.cum.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (c.cum[m] <= s) lo = m; else hi = m;
  }
  return lerpP(c.pts[lo], c.pts[hi], (s - c.cum[lo]) / (c.cum[hi] - c.cum[lo] || 1));
};
/** a point on the centreline (s may run past either end: the line extends straight) */
export const seamPoint = (id: SeamId, s: number): P => atS(CENTRE[id], s);
export const seamTangent = (id: SeamId, s: number): P => {
  const c = CENTRE[id];
  const a = atS(c, s - 0.12), b = atS(c, s + 0.12);
  return nrm(sub(b, a));
};
export const seamNormal = (id: SeamId, s: number): P => perp(seamTangent(id, s));

// ---------------------------------------------------------------- the complementary broken edges
const SEED: Record<SeamId, number> = {C1: 1, C2: 2, C3: 3};
/** half the gap (mm), varying gently along the seam */
const G0: Record<SeamId, number> = {C1: 0.95, C2: 0.82, C3: 0.9};
export const seamGap = (id: SeamId, s: number) => G0[id] * (1 + 0.14 * noise1(s * 0.45 + 3.1, SEED[id] + 40));
/** the shared jag of both faces (mm along the normal): a broken edge's sawtooth, deterministic */
const STEP = 0.5;
const zig = (id: SeamId, s: number) => {
  const k = Math.floor(s / STEP), u = s / STEP - k;
  const r = (j: number) => hash(j * 12.9898 + SEED[id] * 78.233) * 2 - 1;
  return (r(k) * (1 - u) + r(k + 1) * u) * 0.13;
};
export const seamProfile = (id: SeamId, s: number) =>
  0.16 * Math.sin(s * 2.1 + SEED[id] * 1.7) + 0.08 * Math.sin(s * 4.7 + SEED[id] * 0.6) + zig(id, s);

/** a point on one broken face of a seam, in its SEATED position: side +1 or -1 (see the header) */
export const seamEdgeSeated = (id: SeamId, s: number, side: 1 | -1, out = 0): P => {
  const n = seamNormal(id, s);
  return add(seamPoint(id, s), mul(n, seamProfile(id, s) + side * (seamGap(id, s) / 2 + out)));
};
/** is this side of the seam at s the wedge (the moving fragment)? */
export const isWedgeSide = (id: SeamId, s: number, side: 1 | -1) =>
  (id === 'C1' && side === 1 && s > S_C3_ON_C1) || (id === 'C3' && side === -1);

// ---------------------------------------------------------------- the wedge and its rigid transform
/** displacement of the wedge from its seated place: rotation (rad, about WEDGE_PIVOT; + is clockwise on screen) then
 *  translation (mm) */
export type WedgeX = {dx: number; dy: number; rot: number};
export const WEDGE_PIVOT = pt(11.7, 9.6);
/** the displaced pose at frame 0 (seated = all zero) */
export const WEDGE_OUT: WedgeX = {dx: 0.62, dy: 0.62, rot: 0.105};
export const WEDGE_SEATED: WedgeX = {dx: 0, dy: 0, rot: 0};
export const wedgeLerp = (u: number): WedgeX => ({dx: WEDGE_OUT.dx * (1 - u), dy: WEDGE_OUT.dy * (1 - u), rot: WEDGE_OUT.rot * (1 - u)});
export const xfPoint = (p: P, w: WedgeX): P => {
  const c = Math.cos(w.rot), sn = Math.sin(w.rot);
  const q = sub(p, WEDGE_PIVOT);
  return pt(WEDGE_PIVOT.x + q.x * c - q.y * sn + w.dx, WEDGE_PIVOT.y + q.x * sn + q.y * c + w.dy);
};
/** the SVG transform that carries seated wedge geometry to its current pose */
export const xfSvg = (w: WedgeX) => `translate(${w.dx.toFixed(4)} ${w.dy.toFixed(4)}) rotate(${((w.rot * 180) / Math.PI).toFixed(4)} ${WEDGE_PIVOT.x} ${WEDGE_PIVOT.y})`;
/** a broken-face point in its CURRENT position (the wedge's faces carried by its transform) */
export const seamEdge = (id: SeamId, s: number, side: 1 | -1, w: WedgeX, out = 0): P => {
  const p = seamEdgeSeated(id, s, side, out);
  return isWedgeSide(id, s, side) ? xfPoint(p, w) : p;
};

// ---------------------------------------------------------------- polylines and the wedge's outline
/** sample a seam face from s0 to s1 (inclusive), every `step` mm */
export const seamEdgeLine = (id: SeamId, s0: number, s1: number, side: 1 | -1, w: WedgeX = WEDGE_SEATED, out = 0, step = 0.08): P[] => {
  const n = Math.max(1, Math.ceil(Math.abs(s1 - s0) / step));
  const ps: P[] = [];
  for (let i = 0; i <= n; i++) ps.push(seamEdge(id, s0 + ((s1 - s0) * i) / n, side, w, out));
  return ps;
};
const segX = (a: P, b: P, c: P, d: P): {u: number; v: number} | null => {
  const r = sub(b, a), q = sub(d, c);
  const den = r.x * q.y - r.y * q.x;
  if (Math.abs(den) < 1e-12) return null;
  const ac = sub(c, a);
  const u = (ac.x * q.y - ac.y * q.x) / den, v = (ac.x * r.y - ac.y * r.x) / den;
  return u >= 0 && u <= 1 && v >= 0 && v <= 1 ? {u, v} : null;
};
/** first intersection of two polylines: indices and the point */
const polyX = (A: P[], B: P[]): {i: number; j: number; p: P} | null => {
  for (let i = 0; i < A.length - 1; i++) {
    for (let j = 0; j < B.length - 1; j++) {
      const x = segX(A[i], A[i + 1], B[j], B[j + 1]);
      if (x) return {i, j, p: lerpP(A[i], A[i + 1], x.u)};
    }
  }
  return null;
};
/** the wedge's seated outline as a clip polygon: its C1 face (from the corner where it meets the C3 face, out past the
 *  radial border), round outside the bone, and its C3 face back to the corner. Anything outside the radius is clipped
 *  by the radius outline itself when drawn. */
export const WEDGE_POLY: P[] = (() => {
  const L1 = seamLength('C1'), L3 = seamLength('C3');
  const a = seamEdgeLine('C1', S_C3_ON_C1 - 1.5, L1 + 2.5, 1); // the wedge's upper face
  const b = seamEdgeLine('C3', -1.0, L3 + 2.5, -1); // the wedge's left face
  const x = polyX(a, b);
  const up = x ? [x.p, ...a.slice(x.i + 1)] : a;
  const left = x ? [x.p, ...b.slice(x.j + 1)] : b;
  const far1 = up[up.length - 1], far3 = left[left.length - 1];
  return [...up, pt(far1.x + 6, far1.y + 4), pt(far3.x + 6, far3.y + 6), ...[...left].reverse().slice(0, -1)];
})();
/** the corner of the wedge (where its two broken faces meet), seated */
export const WEDGE_CORNER = WEDGE_POLY[0];
/** a point on the wedge's face where the probe's tip presses (seated coordinates; carry with xfPoint) */
export const WEDGE_PRESS = pt(10.0, 3.6);
/** a point on the styloid fragment where the probe holds it later (static fragment) */
export const STYLOID_PRESS = pt(12.4, -5.4);

// ---------------------------------------------------------------- the glue band
/** The adhesive in a seam from s0 to s1: it fills the gap between the two faces and wets out a little over each
 *  (meniscus `over` mm past each face). inset(side, s) (mm) eats into the band from that side's face (healing: new
 *  bone advancing from the margins); where the two insets meet, the band is gone. Returns the band's runs (a run
 *  is one connected island): each run has its two edges (side -1 face line, side +1 face line) over the same s. */
export type BandRun = {s: number[]; lo: P[]; hi: P[]};
export const glueBand = (id: SeamId, s0: number, s1: number, w: WedgeX, over = 0.14, inset?: (side: 1 | -1, s: number) => number, step = 0.08): BandRun[] => {
  const runs: BandRun[] = [];
  let cur: BandRun | null = null;
  const n = Math.max(1, Math.ceil((s1 - s0) / step));
  for (let i = 0; i <= n; i++) {
    const s = s0 + ((s1 - s0) * i) / n;
    const ip = inset ? inset(1, s) : 0, im = inset ? inset(-1, s) : 0;
    const g = seamGap(id, s);
    const alive = ip + im < g - 0.015;
    if (!alive) {
      if (cur && cur.s.length > 1) runs.push(cur);
      cur = null;
      continue;
    }
    // the wetting overhang disappears as new bone covers that face
    const oM = im > 0 ? -im : over, oP = ip > 0 ? -ip : over;
    const lo = seamEdge(id, s, -1, w, oM), hi = seamEdge(id, s, 1, w, oP);
    if (!cur) cur = {s: [], lo: [], hi: []};
    cur.s.push(s); cur.lo.push(lo); cur.hi.push(hi);
  }
  if (cur && cur.s.length > 1) runs.push(cur);
  return runs;
};

// ---------------------------------------------------------------- healing: new bone advancing from both faces
/** mm of new bone grown from one face into the gap at s, for a bridging progress 0..1 (1 = every point bridged).
 *  Growth is uneven along the seam (faster in some places, so the glue is cut into shrinking islands before it is
 *  gone) and its front is finely toothed (woven bone advancing in small trabecular spurs). */
export const growth = (id: SeamId, s: number, bridge: number, side: 1 | -1): number => {
  if (bridge <= 0) return 0;
  const g = seamGap(id, s);
  const seed = SEED[id] * 10 + (side > 0 ? 3 : 7);
  const k = 0.55 + 0.9 * (0.5 + 0.5 * noise1(s * 0.62 + seed, seed)); // local speed 0.55..1.45
  const b = bridge * 1.9;
  const tooth = 0.07 * Math.max(0, Math.sin(s * 9.3 + seed)) * clamp(bridge * 4) * (1 - clamp((bridge - 0.85) / 0.15));
  return clamp(b * k * g * 0.5 + tooth, 0, g);
};
