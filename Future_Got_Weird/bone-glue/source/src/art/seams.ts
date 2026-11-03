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
// V2: the wedge (a small radial butterfly fragment: below C1's radial part, right of C3) is the only fragment that moves:
// at frame 0 it sits displaced (out toward the radial side, slightly tilted) and the surgeon's probe pushes it home.
// Its seam edges (C1 side +1 beyond the C3 junction, and C3 side -1) move with xfPoint(). The glue never moves bone.
// V3: three rigid fragments can move (FragId: the wedge, the styloid fragment above C1 right of C2, the lunate fragment
// above C1 left of C2), each by its own WedgeX about its own pivot (FRAG_PIVOT). Every function that takes a pose takes
// a FragPose: a bare WedgeX (the V2 contract: only the wedge moves, exactly as before) or Poses (all three). With Poses,
// a face point is carried by the fragment that owns it (fragOf); across the two C1 junctions, where C1's face passes
// from one piece to the next (lunate -> styloid on side -1, shaft -> wedge on side +1), the point blends between the two
// pieces' transforms over the junction's mouth (between the two fragment corners), so a glue band laid across a
// junction stays one continuous body while the pieces stand apart. The shaft never moves.
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
export const WEDGE_PIVOT = pt(11.8, 9.0); // the wedge's lower tip (its C3 face meets the radial border)
/** the displaced pose at frame 0 (seated = all zero) */
// tilted out about its lower tip and shifted out of the radial border: both its seams gape wedge-shaped. Checked: no
// overlap with the static bone at any wedgeLerp(u), u in [0, 1] (the faces never come closer than ~0.5 mm)
export const WEDGE_OUT: WedgeX = {dx: 0.8, dy: 1.3, rot: 0.2};
export const WEDGE_SEATED: WedgeX = {dx: 0, dy: 0, rot: 0};
export const wedgeLerp = (u: number): WedgeX => ({dx: WEDGE_OUT.dx * (1 - u), dy: WEDGE_OUT.dy * (1 - u), rot: WEDGE_OUT.rot * (1 - u)});
/** a rigid pose applied about a pivot (rotation about it, then translation) */
export const xfAbout = (p: P, w: WedgeX, pivot: P): P => {
  const c = Math.cos(w.rot), sn = Math.sin(w.rot);
  const q = sub(p, pivot);
  return pt(pivot.x + q.x * c - q.y * sn + w.dx, pivot.y + q.x * sn + q.y * c + w.dy);
};
/** the wedge's transform (about WEDGE_PIVOT) */
export const xfPoint = (p: P, w: WedgeX): P => xfAbout(p, w, WEDGE_PIVOT);
/** the SVG transform for a pose about a pivot */
export const xfSvgAbout = (w: WedgeX, pivot: P) => `translate(${w.dx.toFixed(4)} ${w.dy.toFixed(4)}) rotate(${((w.rot * 180) / Math.PI).toFixed(4)} ${pivot.x} ${pivot.y})`;
/** the SVG transform that carries seated wedge geometry to its current pose */
export const xfSvg = (w: WedgeX) => xfSvgAbout(w, WEDGE_PIVOT);

// ---------------------------------------------------------------- V3: the three moving fragments
export type FragId = 'wedge' | 'styloid' | 'lunate';
export const FRAG_IDS: FragId[] = ['wedge', 'styloid', 'lunate'];
/** every moving fragment's pose (seated = all zero) */
export type Poses = Record<FragId, WedgeX>;
/** a pose argument: a bare WedgeX (V2: only the wedge moves) or the three fragments' Poses */
export type FragPose = WedgeX | Poses;
export const isPoses = (w: FragPose): w is Poses => (w as Poses).wedge !== undefined;
/** each fragment's pivot (seated coordinates): the wedge's lower tip; the articular fragments' rough centroids, so
 *  their rotation (angulation) and their translation (the split and the lift) read independently */
export const FRAG_PIVOT: Record<FragId, P> = {wedge: WEDGE_PIVOT, styloid: pt(10.0, -17.0), lunate: pt(-6.0, -13.0)};
const isZero = (w: WedgeX) => w.dx === 0 && w.dy === 0 && w.rot === 0;
/** a seated point carried by one fragment's pose (exactly the point itself when that pose is zero) */
export const xfFrag = (p: P, f: FragId, w: Poses): P => (isZero(w[f]) ? p : xfAbout(p, w[f], FRAG_PIVOT[f]));
/** the SVG transform that carries a fragment's seated geometry to its pose */
export const xfSvgFrag = (f: FragId, w: WedgeX) => xfSvgAbout(w, FRAG_PIVOT[f]);
/** which piece owns a seam's face at s (null = the shaft, which never moves); exact at the junctions' centrelines */
export const fragOf = (id: SeamId, s: number, side: 1 | -1): FragId | null => {
  if (id === 'C1') return side === 1 ? (s > S_C3_ON_C1 ? 'wedge' : null) : (s < S_C2_ON_C1 ? 'lunate' : 'styloid');
  if (id === 'C2') return side === 1 ? 'styloid' : 'lunate';
  return side === -1 ? 'wedge' : null;
};
/** a pose argument as Poses (a bare WedgeX moves only the wedge) */
export const asPoses = (w: FragPose): Poses => (isPoses(w) ? w : {wedge: w, styloid: WEDGE_SEATED, lunate: WEDGE_SEATED});
/** the arc lengths along C1 of the fragment corners either side of each junction (seated): C1's face on side -1 meets
 *  the lunate's / the styloid's C2 face, and on side +1 the shaft's / the wedge's C3 face. Measured below. */
let J_C2: [number, number] = [S_C2_ON_C1 - 0.5, S_C2_ON_C1 + 0.5];
let J_C3: [number, number] = [S_C3_ON_C1 - 0.4, S_C3_ON_C1 + 0.4];
const smooth01 = (x: number) => {
  const u = clamp(x);
  return u * u * (3 - 2 * u);
};
/** a seated face point at (id, s, side) carried to its current position by Poses (with the junction blends) */
const posed = (p: P, id: SeamId, s: number, side: 1 | -1, w: Poses): P => {
  // (seated pieces give exactly the V2 numbers: the wedge's faces always pass through xfPoint, as V2's did)
  if (id === 'C1') {
    if (side === -1) {
      if (isZero(w.lunate) && isZero(w.styloid)) return p;
      const [a, b] = J_C2;
      if (s <= a) return xfFrag(p, 'lunate', w);
      if (s >= b) return xfFrag(p, 'styloid', w);
      return lerpP(xfFrag(p, 'lunate', w), xfFrag(p, 'styloid', w), smooth01((s - a) / (b - a)));
    }
    if (isZero(w.wedge)) return s > S_C3_ON_C1 ? xfPoint(p, w.wedge) : p;
    const [a, b] = J_C3;
    if (s <= a) return p;
    if (s >= b) return xfFrag(p, 'wedge', w);
    return lerpP(p, xfFrag(p, 'wedge', w), smooth01((s - a) / (b - a)));
  }
  const f = fragOf(id, s, side);
  if (f === 'wedge') return xfPoint(p, w.wedge);
  return f ? xfFrag(p, f, w) : p;
};
/** a broken-face point in its CURRENT position (each fragment's faces carried by its transform) */
export const seamEdge = (id: SeamId, s: number, side: 1 | -1, w: FragPose, out = 0): P => {
  const p = seamEdgeSeated(id, s, side, out);
  if (!isPoses(w)) return isWedgeSide(id, s, side) ? xfPoint(p, w) : p;
  return posed(p, id, s, side, w);
};
/** any seated point on a piece carried by Poses (a fragment's interior point, a press point: fragOf names the piece) */
export const xfOwned = (p: P, id: SeamId, s: number, side: 1 | -1, w: FragPose): P => {
  if (!isPoses(w)) return isWedgeSide(id, s, side) ? xfPoint(p, w) : p;
  return posed(p, id, s, side, w);
};

// ---------------------------------------------------------------- polylines and the wedge's outline
/** sample a seam face from s0 to s1 (inclusive), every `step` mm */
export const seamEdgeLine = (id: SeamId, s0: number, s1: number, side: 1 | -1, w: FragPose = WEDGE_SEATED, out = 0, step = 0.08): P[] => {
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
export const WEDGE_PRESS = pt(10.25, 3.0); // near the wedge's centroid: >= 2 mm from both its seams and the border
/** a point on the styloid fragment where the probe holds it later (static fragment) */
export const STYLOID_PRESS = pt(7.0, -9.0); // mid styloid fragment: ~3.5 mm right of C2, ~8 mm above C1, ~8 mm inside the rim
/** the probe's axis angle (rad, from the tip toward the handle) on the wedge and on the styloid fragment: both from the
 *  lower right, steep enough that on the styloid the shaft passes left of the right rake's tines (>= a shaft width at
 *  w 58-112) and right of the wedge seam's lower end, never along the rake's arm */
export const PROBE_ANG_W = 0.9, PROBE_ANG_S = 1.18;

// ---------------------------------------------------------------- V3: the articular fragments' outlines and poses
/** the junction mouths on C1 (see posed): where C1's face meets each branch's face on either side */
{
  const corner = (side: 1 | -1, sJ: number, b: SeamId, sideB: 1 | -1): number => {
    const A = seamEdgeLine('C1', sJ - 2.5, sJ + 2.5, side, WEDGE_SEATED, 0, 0.02);
    const B = seamEdgeLine(b, -1, 3, sideB, WEDGE_SEATED, 0, 0.02);
    const x = polyX(A, B);
    return x ? seamNearest('C1', x.p) : sJ;
  };
  J_C2 = [corner(-1, S_C2_ON_C1, 'C2', -1), corner(-1, S_C2_ON_C1, 'C2', 1)];
  J_C3 = [corner(1, S_C3_ON_C1, 'C3', 1), corner(1, S_C3_ON_C1, 'C3', -1)];
}
/** a fragment's seated outline as a clip polygon from two of its broken faces that meet at its corner: faceA runs from
 *  the corner out past one border, faceB from the corner out past another; `far` closes it round outside the bone
 *  (anything outside the radius is clipped by the radius outline when drawn) */
const fragPoly = (A: P[], B: P[], far: (endA: P, endB: P) => P[]): P[] => {
  const x = polyX(A, B);
  const a = x ? [x.p, ...A.slice(x.i + 1)] : A;
  const b = x ? [x.p, ...B.slice(x.j + 1)] : B;
  return [...a, ...far(a[a.length - 1], b[b.length - 1]), ...[...b].reverse().slice(0, -1)];
};
/** where C2 runs out above the joint (2.5 mm past its end) and its direction there: the two articular fragments' outlines
 *  share this line's extension up past the carpals (side -1 and +1 of it), so they never overlap */
const C2_TOP_DIR = seamTangent('C2', seamLength('C2'));
/** the styloid fragment (above C1's radial part, right of C2): its C1 face from the corner out past the radial border,
 *  its C2 face up past the joint */
export const STYLOID_POLY: P[] = fragPoly(
  seamEdgeLine('C1', S_C2_ON_C1 - 1.5, seamLength('C1') + 2.5, -1),
  seamEdgeLine('C2', -1.0, seamLength('C2') + 2.5, 1),
  (e1, e2) => [pt(e1.x + 12, e1.y - 1.5), pt(e1.x + 12, -80), add(e2, mul(C2_TOP_DIR, 40)), add(e2, mul(C2_TOP_DIR, 6))],
);
/** the lunate fragment (above C1's ulnar part, left of C2): its C1 face from the corner out past the ulnar border, its
 *  C2 face up past the joint */
export const LUNATE_POLY: P[] = (() => {
  const a = seamEdgeLine('C1', -2.5, S_C2_ON_C1 + 1.5, -1).reverse();
  const b = seamEdgeLine('C2', -1.0, seamLength('C2') + 2.5, -1);
  // traced the other way round (corner -> up C2 -> round the top -> out past the ulnar border -> back along C1)
  return fragPoly(b, a, (e2, e1) => [add(e2, mul(C2_TOP_DIR, 6)), add(e2, mul(C2_TOP_DIR, 40)), pt(e1.x - 14, -80), pt(e1.x - 14, e1.y + 0.6)]);
})();
/** every moving fragment's seated clip outline */
export const FRAG_POLY: Record<FragId, P[]> = {wedge: WEDGE_POLY, styloid: STYLOID_POLY, lunate: LUNATE_POLY};

export const POSES_SEATED: Poses = {wedge: WEDGE_SEATED, styloid: WEDGE_SEATED, lunate: WEDGE_SEATED};
/** frame 0 of V3: the distal radius shattered. The two articular fragments are split apart across C2 and lifted off C1,
 *  each angulated a little (their C1 faces tilt up toward the split, the joint surface opens), and the wedge is out as
 *  in V2. Gaps face to face: C2 2.5 mm at C1 widening to 3.6 at the joint; C1 2.3-2.9 mm under the two fragments, 3-3.9
 *  over the wedge (out as well). Checked: along posesLerp(u), u in [0, 1], no two pieces' faces come closer than they
 *  are seated (lunate/styloid 0.56 mm, fragment/shaft 0.66, the wedge as V2), and the lunate stays 1.9 mm clear of the
 *  ulna. */
export const POSES_SHATTER: Poses = {
  wedge: WEDGE_OUT,
  styloid: {dx: 1.1, dy: -1.75, rot: 0.022},
  lunate: {dx: -1.2, dy: -1.8, rot: -0.022},
};
const lerpX = (a: WedgeX, b: WedgeX, u: number): WedgeX => ({dx: a.dx + (b.dx - a.dx) * u, dy: a.dy + (b.dy - a.dy) * u, rot: a.rot + (b.rot - a.rot) * u});
/** a blend of two pose sets (per fragment, linear in dx, dy and rot) */
export const posesMix = (a: Poses, b: Poses, u: number): Poses => ({wedge: lerpX(a.wedge, b.wedge, u), styloid: lerpX(a.styloid, b.styloid, u), lunate: lerpX(a.lunate, b.lunate, u)});
/** the reduction path from `from` (POSES_SHATTER) at u = 0 to seated at u = 1. u may be one number or one per
 *  fragment (a fragment left out of the record stays at u = 0). The wedge runs as wedgeLerp; the articular fragments
 *  slide together across C2 a little ahead of seating onto C1 (the forceps' squeeze: dx and rot lead, dy follows; both
 *  smooth, monotone and exact at the ends), so they visibly come together and then sit down. Feed it an eased u. */
export const posesLerp = (u: number | Partial<Record<FragId, number>>, from: Poses = POSES_SHATTER): Poses => {
  const uf = (f: FragId) => clamp(typeof u === 'number' ? u : u[f] ?? 0);
  const art = (f: FragId): WedgeX => {
    const v = uf(f), lead = 0.3 * v * (1 - v);
    const ux = v + lead, uy = v - lead;
    const w = from[f];
    return {dx: w.dx * (1 - ux), dy: w.dy * (1 - uy), rot: w.rot * (1 - ux)};
  };
  const v = uf('wedge');
  const w0 = from.wedge;
  return {wedge: {dx: w0.dx * (1 - v), dy: w0.dy * (1 - v), rot: w0.rot * (1 - v)}, styloid: art('styloid'), lunate: art('lunate')};
};
/** how far each fragment stands from home, 0 (seated) .. 1 (about its POSES_SHATTER displacement or more) */
export const fragDisp = (f: FragId, w: WedgeX): number =>
  f === 'wedge'
    ? clamp((Math.abs(w.dx) + Math.abs(w.dy)) / 1.2 + Math.abs(w.rot) / 0.2)
    : clamp((Math.abs(w.dx) + Math.abs(w.dy)) / 2.6 + Math.abs(w.rot) / 0.15);

// ---------------------------------------------------------------- the glue band
/** The adhesive in a seam from s0 to s1: it fills the gap between the two faces and wets out a little over each
 *  (meniscus `over` mm past each face). inset(side, s) (mm) eats into the band from that side's face (healing: new
 *  bone advancing from the margins); where the two insets meet, the band is gone. Returns the band's runs (a run
 *  is one connected island): each run has its two edges (side -1 face line, side +1 face line) over the same s. */
export type BandRun = {s: number[]; lo: P[]; hi: P[]};
export const glueBand = (id: SeamId, s0: number, s1: number, w: FragPose, over = 0.14, inset?: (side: 1 | -1, s: number) => number, step = 0.08): BandRun[] => {
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
    // (eased away over the first 0.12 mm of growth so the band never jumps narrower)
    const ease = (i: number) => (i > 0 ? over * (1 - clamp(i / 0.12)) ** 2 - i : over);
    const oM = ease(im), oP = ease(ip);
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
  // each face's own speed, plus a pinch both faces share: where it is high the two fronts meet early and cut the band,
  // while between pinches the glue stays thick, so it breaks into chunky islands that shrink and vanish one by one
  const own = 0.5 + 0.5 * noise1(s * 0.62 + seed, seed);
  const pinch = 0.5 + 0.5 * noise1(s * 1.1 + SEED[id] * 13, 77);
  const k = 0.5 + 0.4 * own + 0.9 * pinch ** 1.5; // 0.5..1.8
  const b = bridge * 1.2;
  const tooth = 0.07 * Math.max(0, Math.sin(s * 9.3 + seed)) * clamp(bridge * 4) * (1 - clamp((bridge - 0.85) / 0.15));
  // every point is bridged by bridge 1
  // the last stretches close one after another (each island keeps its width until its own closing), not all at once
  const c = 0.72 + 0.16 * (0.5 + 0.5 * noise1(s * 0.35 + seed, 91));
  return clamp(Math.max(b * k * g * 0.5 + tooth, 0.5 * g * ss01((bridge - c) / 0.12)), 0, g);
};
const ss01 = (x: number) => {
  const u = clamp(x);
  return u * u * (3 - 2 * u);
};
