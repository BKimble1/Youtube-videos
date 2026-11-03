// V2 (B1): the fractured distal radius and the adhesive IN its seams. World millimetres at depth 0 (anatomy.ts); the
// seam geometry, the moving wedge fragment and the glue band runs come from seams.ts. Back to front:
//   1. the cavity bed (dark, wherever no bone covers the radius' outline)
//   2. while the wedge is out of place: its vacated BED, a shaded cancellous honeycomb floor (a few marrow-red cells),
//      darker along the seams' walls
//   3. the static bone (V1's cel-shaded radius: gradient lit from the upper left, sheen, lamellae, vascular pores
//      elongated along the shaft, outline ink)
//   4. each static fragment's broken face: a hard cancellous chamfer strip (faceted, with small pores, lit or in shade
//      by which way it faces) with a crisp bone-ink outer edge, and the bone-ink face line itself
//   5. the seams' gaps between the SEATED faces, as one dark union (narrow seams stay dark; junctions read as T's)
//   6. the wedge fragment, carried by xfSvg(st.wedge): a hard cast shadow and its exposed side wall while it is out,
//      then its body and its mitred faces
//   7. the glue: per seam, the band between the two faces plus a meniscus over each (wider at macro for the oyster
//      match, slimmer from CAM0 out so a sliver of chamfer shows on both sides). One inked union for every seam with
//      lip-coloured fillets in the junctions' inside corners, three tones (a deep strip under the shaded face's lip, the
//      core, a light meniscus on the lit face) and one highlight that runs continuous while fresh and shortens and
//      fades as the glue sets to satin; the shaded face's bone-ink lip is drawn over the glue's edge so the gel reads as
//      lying IN the seam. A proud, glossy fresh tail and a bulb where it leaves the cannula (scaled by front.flow).
// V3: any of the three moving fragments (seams.FragId: the wedge, the styloid and the lunate fragment) can stand out of
// place (st.poses). Each displaced fragment gets its vacated bed (the wedge's a lit cancellous floor, the articular
// fragments' a deep one in shadow), and is drawn in its own pose: cast shadow, exposed broken side wall, body (so the
// radius' outline, the styloid tip and the articular rim move with it) and faces. The glue band runs between the two
// CURRENT faces (wide in an open gap, a thin band once seated); several fronts (st.fronts) each carry the fresh head.
// With every fragment seated (or st.poses absent and the wedge home) the drawing is exactly V2's.
// Line widths are in screen pixels via st.px (mm per pixel), so the ink is even at every zoom. Deterministic; no filters.
// The probe's and the applicator's contact spots and shadows belong to the instruments module.
import React from 'react';
import {P, add, closed, lerpP, len, mul, nrm, open, poly, pt, sub, tube} from '../core/geo';
import {mix} from '../core/color';
import {uid} from '../core/ids';
import {clamp, hash, noise1, ss} from '../lib';
import {C} from './palette';
import {RADIUS} from './anatomy';
import {
  FRAG_IDS, FRAG_POLY, FragId, Poses, S_C2_ON_C1, S_C3_ON_C1, SEAM_IDS, SeamId, WEDGE_POLY, WedgeX, fragDisp, fragOf, glueBand,
  growth, seamEdge, seamEdgeLine, seamEdgeSeated, seamGap, seamLength, seamNearest, seamNormal, seamPoint, xfSvgFrag,
} from './seams';
import {BoneState2, frontsOf, poseArg, posesOf} from '../v2state';

type View = [number, number, number, number];
const LIGHT = nrm(pt(-0.62, -0.78)); // toward the key light (upper left)
const dotL = (n: P) => n.x * LIGHT.x + n.y * LIGHT.y;
const RAD_PATH = closed(RADIUS, 0.55);
const LEN: Record<SeamId, number> = {C1: seamLength('C1'), C2: seamLength('C2'), C3: seamLength('C3')};
const SEED: Record<SeamId, number> = {C1: 1, C2: 2, C3: 3};

/** the glue's wetting overhang past each face (mm) at macro range (the wet beat and the oyster match:
 *  production/v2_match_band.json is measured with it) */
export const GLUE_OVER = 0.14;
/** the overhang from CAM0 (w 26) out: slimmer, so a sliver of each face's chamfer shows beside the gel */
export const GLUE_OVER_WIDE = 0.07;
/** the overhang the glue is drawn with at a zoom (mm per screen px): GLUE_OVER up to w ~14 (the whole wet beat), easing
 *  to GLUE_OVER_WIDE by w ~23. glueRuns() outlines use it; pass it to seams.glueBand to match them. */
export const glueOver = (px: number) => GLUE_OVER + (GLUE_OVER_WIDE - GLUE_OVER) * ss(px, 0.013, 0.021);
/** how much prouder (mm per side) the freshly laid gel stands near the applicator tip */
const PROUD = 0.075;
/** the fresh zone behind the tip (mm along the seam) */
const FRESH_MM = 1.6;
/** the glue's minimum on-screen width (px) at wide framings */
const MIN_GLUE_PX = 5.5;

// module-local colours
const GAP = C.cavity;
const LIP = mix(C.glue, C.glueLit, 0.42);
const CORE = mix(C.glue, C.glueDeep, 0.16);
/** set (satin) glue: paler and greyer than the fresh gel */
const SATIN_CORE = mix(mix(C.glue, '#A9BDB8', 0.5), '#FFFFFF', 0.08);
const SATIN_LIP = mix(LIP, '#C9D6D2', 0.45);
const FRESH_LIP = mix(C.glueLit, '#FFFFFF', 0.3);
const GLUE_EDGE = mix(C.glueInk, C.glueDeep, 0.3); // the gel's own edge: softer than an outline
const SHADOW = '#1E0A06';

// ---------------------------------------------------------------- small geometry helpers
const inPoly = (p: P, ps: P[]) => {
  let c = false;
  for (let i = 0, j = ps.length - 1; i < ps.length; j = i++) {
    const a = ps[i], b = ps[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
};
const segX = (a: P, b: P, c: P, d: P): number | null => {
  const r = sub(b, a), q = sub(d, c);
  const den = r.x * q.y - r.y * q.x;
  if (Math.abs(den) < 1e-12) return null;
  const ac = sub(c, a);
  const u = (ac.x * q.y - ac.y * q.x) / den, v = (ac.x * r.y - ac.y * r.x) / den;
  return u >= 0 && u <= 1 && v >= 0 && v <= 1 ? u : null;
};
/** first intersection of two polylines: segment indices and the point */
const polyX = (A: P[], B: P[]): {i: number; j: number; p: P} | null => {
  for (let i = 0; i < A.length - 1; i++) {
    for (let j = 0; j < B.length - 1; j++) {
      const u = segX(A[i], A[i + 1], B[j], B[j + 1]);
      if (u !== null) return {i, j, p: lerpP(A[i], A[i + 1], u)};
    }
  }
  return null;
};
/** walk d mm along a polyline from index i (dir +1/-1) */
const walk = (ps: P[], i: number, dir: 1 | -1, d: number, from: P): P[] => {
  const out: P[] = [];
  let prev = from, acc = 0;
  for (let k = dir > 0 ? i + 1 : i; k >= 0 && k < ps.length; k += dir) {
    const l = len(sub(ps[k], prev));
    if (acc + l >= d) {
      out.push(lerpP(prev, ps[k], (d - acc) / (l || 1)));
      return out;
    }
    acc += l;
    out.push(ps[k]);
    prev = ps[k];
  }
  return out;
};
const line = (ps: P[]) => (ps.length < 2 ? '' : 'M' + ps.map((p) => `${p.x.toFixed(4)} ${p.y.toFixed(4)}`).join('L'));

// ---------------------------------------------------------------- the broken faces (seated geometry)
type Face = {id: SeamId; side: 1 | -1; s0: number; s1: number; frag: FragId | null};
/** every fragment's broken faces. A face that meets another at a fragment's corner runs a little past it; the mitres
 *  below trim both to the corner, so chamfers, edges and face lines turn it cleanly (no crossings, no hooks) */
const FACES: Face[] = [
  /* 0 */ {id: 'C1', side: -1, s0: -0.8, s1: S_C2_ON_C1 + 0.9, frag: 'lunate'}, // the lunate fragment's lower face
  /* 1 */ {id: 'C1', side: -1, s0: S_C2_ON_C1 - 0.9, s1: LEN.C1 + 0.8, frag: 'styloid'}, // the styloid fragment's lower face
  /* 2 */ {id: 'C1', side: 1, s0: -0.8, s1: S_C3_ON_C1 + 0.9, frag: null}, // the shaft's upper face
  /* 3 */ {id: 'C2', side: -1, s0: -0.7, s1: LEN.C2 + 0.8, frag: 'lunate'},
  /* 4 */ {id: 'C2', side: 1, s0: -0.7, s1: LEN.C2 + 0.8, frag: 'styloid'},
  /* 5 */ {id: 'C3', side: 1, s0: -0.7, s1: LEN.C3 + 0.8, frag: null},
  /* 6 */ {id: 'C1', side: 1, s0: S_C3_ON_C1 - 0.9, s1: LEN.C1 + 0.8, frag: 'wedge'}, // the wedge's upper face
  /* 7 */ {id: 'C3', side: -1, s0: -0.7, s1: LEN.C3 + 0.8, frag: 'wedge'}, // the wedge's left face
];
/** the fragments' corners: [face, which end, face, which end] */
const CORNERS: [number, 'start' | 'end', number, 'start' | 'end'][] = [[0, 'end', 3, 'start'], [1, 'start', 4, 'start'], [2, 'end', 5, 'start'], [6, 'start', 7, 'start']];
type FaceArt = {
  frag: FragId | null;
  /** the cancellous chamfer strip just inside the face */
  band: string;
  /** a few facets of it a shade lighter or darker (slightly angular broken surface) */
  facets: {d: string; dark: boolean}[];
  /** its outer edge, where it meets the intact surface: straight facet segments (joined round a corner) */
  edge: string;
  /** the broken face itself (joined round a corner) */
  face: string;
  lit: boolean;
  tone: string;
  pores: {x: number; y: number; rx: number; ry: number; a: number}[];
};
type Raw = {f: Face; inner: P[]; outer: P[]; faceL: P[]; wAt: (s: number) => number};
const rawFace = (f: Face, base: number): Raw => {
  const seed = SEED[f.id] * 7 + (f.side > 0 ? 1 : 4);
  const wAt = (s: number) => base * (0.9 + 0.2 * (0.5 + 0.5 * noise1(s * 1.15 + seed, seed))) + 0.012 * Math.sin(s * 5.3 + seed);
  const n = Math.max(1, Math.ceil((f.s1 - f.s0) / 0.06));
  const inner: P[] = [], faceL: P[] = [];
  for (let i = 0; i <= n; i++) {
    const s = f.s0 + ((f.s1 - f.s0) * i) / n;
    inner.push(seamEdgeSeated(f.id, s, f.side, -0.03));
    faceL.push(seamEdgeSeated(f.id, s, f.side, 0));
  }
  // facet vertices along the outer edge, irregularly spaced (straight segments between them)
  const sK: number[] = [f.s0];
  let s = f.s0;
  while (s < f.s1) {
    s += 0.26 * (0.7 + 0.6 * hash(s * 13.7 + seed));
    sK.push(Math.min(s, f.s1));
  }
  const outer = sK.map((sk) => seamEdgeSeated(f.id, sk, f.side, wAt(sk)));
  return {f, inner, outer, faceL, wAt};
};
const nearestIdx = (ps: P[], p: P) => {
  let b = 0, bd = 1e9;
  for (let i = 0; i < ps.length; i++) {
    const d = (ps[i].x - p.x) ** 2 + (ps[i].y - p.y) ** 2;
    if (d < bd) { bd = d; b = i; }
  }
  return b;
};
const artOf = (r: Raw): FaceArt => {
  const f = r.f;
  const seed = SEED[f.id] * 7 + (f.side > 0 ? 1 : 4);
  // the chamfer tilts from the intact surface down into the gap: it faces -side * n
  const nm = seamNormal(f.id, (Math.max(0, f.s0) + Math.min(LEN[f.id], f.s1)) / 2);
  const k = dotL(mul(nm, -f.side));
  const lit = k > 0;
  const tone = mix(C.cancellous, lit ? C.boneLit : C.boneDeep, 0.1 + 0.34 * Math.abs(k));
  const bandPts = [...r.inner, ...[...r.outer].reverse()];
  // facets: quads between consecutive outer vertices and the face below them
  const facets: FaceArt['facets'] = [];
  for (let i = 0; i < r.outer.length - 1; i++) {
    const h = hash(i * 7.3 + seed * 1.9);
    if (h > 0.3 && h < 0.66) continue;
    const a = r.outer[i], b = r.outer[i + 1];
    const ia = nearestIdx(r.inner, a), ib = nearestIdx(r.inner, b);
    const lo = Math.min(ia, ib), hi = Math.max(ia, ib);
    facets.push({d: poly([a, b, ...r.inner.slice(lo, hi + 1).reverse()]), dark: h <= 0.3});
  }
  // small spongy pores in the strip, foreshortened along the face (only inside the trimmed strip)
  const pores: FaceArt['pores'] = [];
  for (let s = Math.max(f.s0, -0.3); s < f.s1; s += 0.075) {
    const h = hash(s * 17.31 + seed * 3.7);
    if (h > 0.55) continue;
    const w = r.wAt(s);
    const o = 0.04 + (w - 0.1) * hash(s * 5.9 + seed);
    const q = seamEdgeSeated(f.id, s, f.side, o);
    if (!inPoly(q, bandPts)) continue;
    const t = seamNormal(f.id, s);
    const rr = 0.012 + 0.016 * hash(s * 2.3 + seed * 1.1);
    pores.push({x: q.x, y: q.y, rx: rr * (1.5 + 0.6 * hash(s * 8.1)), ry: rr * 0.85, a: (Math.atan2(t.x, -t.y) * 180) / Math.PI});
  }
  return {frag: f.frag, band: poly(bandPts), facets, edge: line(r.outer), face: line(r.faceL), lit, tone, pores};
};
/** trim two polylines that cross near their starts to begin at the crossing (a clean mitre) */
const mitre = (A: P[], B: P[]): [P[], P[]] => {
  const x = polyX(A, B);
  if (!x) return [A, B];
  return [[x.p, ...A.slice(x.i + 1)], [x.p, ...B.slice(x.j + 1)]];
};
/** mitre one end of each of two polylines (the ends that meet at the corner) */
const mitreEnds = (A: P[], ea: 'start' | 'end', B: P[], eb: 'start' | 'end'): [P[], P[]] => {
  const a = ea === 'start' ? A : [...A].reverse(), b = eb === 'start' ? B : [...B].reverse();
  const [a2, b2] = mitre(a, b);
  return [ea === 'start' ? a2 : a2.reverse(), eb === 'start' ? b2 : b2.reverse()];
};
/** a corner's two lines joined into one (A runs into the corner, B leaves it) */
const joinAt = (A: P[], ea: 'start' | 'end', B: P[], eb: 'start' | 'end'): P[] => [
  ...(ea === 'end' ? A : [...A].reverse()),
  ...(eb === 'start' ? B : [...B].reverse()),
];
const ART_CACHE = new Map<number, FaceArt[]>();
/** every face's art for a chamfer width class (mm), mitred at every fragment corner */
const faceArts = (base: number): FaceArt[] => {
  const key = Math.round(base * 200);
  const hit = ART_CACHE.get(key);
  if (hit) return hit;
  const raws = FACES.map((f) => rawFace(f, key / 200));
  for (const [ia, ea, ib, eb] of CORNERS) {
    const A = raws[ia], B = raws[ib];
    [A.inner, B.inner] = mitreEnds(A.inner, ea, B.inner, eb);
    [A.outer, B.outer] = mitreEnds(A.outer, ea, B.outer, eb);
    [A.faceL, B.faceL] = mitreEnds(A.faceL, ea, B.faceL, eb);
  }
  const out = raws.map(artOf);
  // the corners' edges and face lines as single lines round the corner
  for (const [ia, ea, ib, eb] of CORNERS) {
    out[ia].edge = line(joinAt(raws[ia].outer, ea, raws[ib].outer, eb));
    out[ib].edge = '';
    out[ia].face = line(joinAt(raws[ia].faceL, ea, raws[ib].faceL, eb));
    out[ib].face = '';
  }
  ART_CACHE.set(key, out);
  return out;
};
/** the wedge's two faces (seated), mitred at the corner: C1's from the corner out, C3's from the corner down */
const WEDGE_FACES = mitre(seamEdgeLineSeated('C1', S_C3_ON_C1 - 0.9, LEN.C1 + 0.8, 1), seamEdgeLineSeated('C3', -0.7, LEN.C3 + 0.8, -1));
/** every moving fragment's two broken faces (seated), each from the fragment's corner outward, with their seam and side */
type FragFaces = {lines: [P[], P[]]; seams: [[SeamId, 1 | -1], [SeamId, 1 | -1]]};
const FRAG_FACES: Record<FragId, FragFaces> = {
  wedge: {lines: WEDGE_FACES, seams: [['C1', 1], ['C3', -1]]},
  styloid: {lines: mitre(seamEdgeLineSeated('C1', S_C2_ON_C1 - 0.9, LEN.C1 + 0.8, -1), seamEdgeLineSeated('C2', -0.7, LEN.C2 + 0.8, 1)), seams: [['C1', -1], ['C2', 1]]},
  lunate: {lines: mitre(seamEdgeLineSeated('C1', -0.8, S_C2_ON_C1 + 0.9, -1).reverse(), seamEdgeLineSeated('C2', -0.7, LEN.C2 + 0.8, -1)), seams: [['C1', -1], ['C2', -1]]},
};
function seamEdgeLineSeated(id: SeamId, s0: number, s1: number, side: 1 | -1, out = 0, step = 0.06): P[] {
  const n = Math.max(1, Math.ceil((s1 - s0) / step));
  const ps: P[] = [];
  for (let i = 0; i <= n; i++) ps.push(seamEdgeSeated(id, s0 + ((s1 - s0) * i) / n, side, out));
  return ps;
}

/** the chamfer strips, their facets and pores, their outer edges and the face lines (seated coordinates) */
const Faces: React.FC<{arts: FaceArt[]; px: number; view: View; fade: number; inkFade: number}> = ({arts, px, view, fade, inkFade}) => {
  if (fade <= 0.001 && inkFade <= 0.001) return null;
  const poreA = clamp((0.036 - px) / 0.012) * fade;
  const facetA = clamp((0.045 - px) / 0.025);
  const macro = clamp((0.016 - px) / 0.007);
  const [x0, y0, x1, y1] = view;
  const lineW = 2 * 1.9 * px; // half of it is hidden under the gap (or the wedge's clip): ~1.9 px visible
  return (
    <g>
      {fade > 0.001 && (
        <g opacity={fade}>
          {arts.map((a, i) => <path key={`b${i}`} d={a.band} fill={a.tone} />)}
          {facetA > 0.01 && (
            <g opacity={facetA}>
              {arts.flatMap((a, i) =>
                a.facets.map((f, k) => (
                  <path key={`f${i}_${k}`} d={f.d} fill={f.dark ? mix(a.tone, C.boneDeep, a.lit ? 0.16 : 0.22) : mix(a.tone, C.boneLit, a.lit ? 0.3 : 0.16)} opacity={0.75} />
                )),
              )}
            </g>
          )}
          {poreA > 0.01 && (
            <g opacity={poreA}>
              {arts.flatMap((a, i) =>
                a.pores
                  .filter((p) => p.x > x0 - 1 && p.x < x1 + 1 && p.y > y0 - 1 && p.y < y1 + 1)
                  .map((p, k) => (
                    <ellipse key={`p${i}_${k}`} cx={p.x} cy={p.y} rx={p.rx} ry={p.ry} transform={`rotate(${p.a.toFixed(1)} ${p.x.toFixed(3)} ${p.y.toFixed(3)})`}
                      fill={mix(C.cancellousPore, a.tone, 0.2)} opacity={a.lit ? 0.6 : 0.75} />
                  )),
              )}
            </g>
          )}
          {/* the chamfer's outer edge: crisp at macro, a soft line from CAM0 out */}
          <g fill="none" stroke={C.boneInk} strokeWidth={(1.25 + 0.4 * macro) * px} strokeLinejoin="miter" strokeMiterlimit={3} opacity={0.5 + 0.38 * macro}>
            {arts.map((a, i) => <path key={`e${i}`} d={a.edge} />)}
          </g>
        </g>
      )}
      {inkFade > 0.001 && (
        <g opacity={inkFade}>
          {arts.map((a, i) => (a.face ? <path key={`l${i}`} d={a.face} fill="none" stroke={C.boneInk} strokeWidth={lineW} strokeLinejoin="round" strokeLinecap="round" /> : null))}
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------- the bone drawing (shared by the static part and the wedge)
const SHADE_STOPS: [number, string][] = [
  [0, C.boneLit],
  [0.3, mix(C.boneLit, C.bone, 0.55)],
  [0.58, C.bone],
  [0.8, C.boneShade],
  [0.93, mix(C.boneShade, C.boneDeep, 0.35)],
  [1, mix(C.boneShade, '#B8A7B4', 0.4)],
];
const Grad: React.FC<{id: string; x1: number; y1: number; x2: number; y2: number}> = ({id, x1, y1, x2, y2}) => (
  <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
    {SHADE_STOPS.map(([o, c], i) => <stop key={i} offset={o} stopColor={c} />)}
  </linearGradient>
);
/** vascular pores on the cortex (canal openings, elongated along the shaft), in view only: from CAM0 in */
const Pores: React.FC<{view: View; px: number}> = ({view, px}) => {
  if (px > 0.036) return null;
  const a = clamp((0.036 - px) / 0.012);
  const cell = 0.5;
  const [x0, y0, x1, y1] = view;
  const out: React.ReactNode[] = [];
  const col = mix(C.cancellousPore, C.boneShade, 0.25);
  for (let gx = Math.floor(Math.max(-17, x0) / cell); gx <= Math.ceil(Math.min(19, x1) / cell); gx++) {
    for (let gy = Math.floor(Math.max(-40, y0) / cell); gy <= Math.ceil(Math.min(60, y1) / cell); gy++) {
      const h = hash(gx * 91.7 + gy * 13.3);
      if (h > 0.34) continue;
      const x = (gx + 0.15 + 0.7 * hash(gx * 3.1 + gy * 7.7)) * cell, y = (gy + 0.15 + 0.7 * hash(gx * 5.3 + gy * 2.9)) * cell;
      // a touch finer as the camera closes in (they stay small, quiet marks at macro)
      const rr = (0.019 + 0.02 * hash(gx * 1.7 + gy * 9.1)) * (0.62 + 0.38 * ss(px, 0.008, 0.024));
      out.push(<ellipse key={`${gx}_${gy}`} cx={x} cy={y} rx={rr} ry={rr * (2.1 + 1.3 * hash(gx * 4.1 + gy * 0.7))} />);
    }
  }
  // lower contrast at macro (bigger on screen), stronger at CAM0 (the opening frame must read as bone at once)
  return <g fill={col} opacity={(0.3 + 0.24 * ss(px, 0.008, 0.024)) * a}>{out}</g>;
};
const LAMELLAE = Array.from({length: 7}, (_, k) => {
  const xk = -9 + k * 3.0 + 0.6 * hash(k * 2.2);
  const yTop = -14 + 6 * hash(k * 5.1), yBot = 60 + 40 * hash(k * 1.3);
  return open([pt(xk, yTop), pt(xk * 0.92 + 0.2, (yTop + yBot) / 2), pt(xk * 0.78, yBot)], 0.6);
});
const ARTIC = open(RADIUS.slice(0, 9), 0.55);
const ULNAR_LIT = open(RADIUS.slice(37), 0.55);
type Ids = {shade: string; shadeH: string; ramp: string; rampM: string; sheen: string; rad: string};
/** the radius' cel-shaded body (V1's look): fill, outline ink, sheen, lamellae, the articular rim, pores */
const BoneBody: React.FC<{ids: Ids; px: number; view: View; outlineClip?: string; closeK?: number; shaft?: boolean}> = ({ids, px, view, outlineClip, closeK = 0, shaft = true}) => (
  <>
    <path d={RAD_PATH} fill={`url(#${ids.shade})`} />
    <g clipPath={`url(#${ids.rad})`}>
      {/* down the shaft the light-to-shade gradient runs across the bone only (the tilted one would sink into its
          last, mauve stop far down the shaft at wide framings) */}
      {shaft && view[3] > 14 && <rect x={-20} y={13} width={40} height={250} fill={`url(#${ids.shadeH})`} mask={`url(#${ids.rampM})`} />}
      <rect x={-14} y={-40} width={13} height={300} fill={`url(#${ids.sheen})`} />
      {LAMELLAE.map((d, k) => (
        <path key={k} d={d} stroke={C.boneShade} strokeWidth={1.3 * px} fill="none" opacity={0.08 + 0.24 * clamp((px - 0.012) / 0.02)} />
      ))}
      <path d={ARTIC} stroke="#EEF3F2" strokeWidth={1.6} fill="none" opacity={0.9} />
      <Pores view={view} px={px} />
      <path d={ULNAR_LIT} stroke={C.boneLit} strokeWidth={Math.max(0.12, 6 * px)} fill="none" opacity={0.5} transform="translate(0.5 0)" />
    </g>
    {/* the outline breaks where a seam opens onto the bone's edge; it closes again as the bone remodels */}
    <path d={RAD_PATH} fill="none" stroke={C.boneInk} strokeWidth={2.6 * px} strokeLinejoin="round" clipPath={outlineClip ? `url(#${outlineClip})` : undefined} />
    {outlineClip && closeK > 0.001 && <path d={RAD_PATH} fill="none" stroke={C.boneInk} strokeWidth={2.6 * px} strokeLinejoin="round" opacity={closeK} />}
  </>
);

// ---------------------------------------------------------------- the gaps between the seated faces
/** a seam's gap polygon, its edges `out` mm past each seated face (negative: inside the gap, under the face lines):
 *  0.02 mm past the faces of the fragments in `moving`, -0.01 elsewhere */
const gapPoly = (id: SeamId, moving: FragId[] = []): P[] => {
  const s0 = id === 'C1' ? -0.8 : 0, s1 = LEN[id] + 0.8;
  const n = Math.max(1, Math.ceil((s1 - s0) / 0.06));
  const lo: P[] = [], hi: P[] = [];
  const o = (s: number, side: 1 | -1) => {
    const f = fragOf(id, s, side);
    return f && moving.includes(f) ? 0.02 : -0.01;
  };
  for (let i = 0; i <= n; i++) {
    const s = s0 + ((s1 - s0) * i) / n;
    lo.push(seamEdgeSeated(id, s, -1, o(s, -1)));
    hi.push(seamEdgeSeated(id, s, 1, o(s, 1)));
  }
  return [...lo, ...[...hi].reverse()];
};
/** the seams' gaps between the seated faces: dark at every pose (a displaced fragment's bed shows beyond them) */
const SEATED_GAPS = SEAM_IDS.map((id) => poly(gapPoly(id)));
/** ... and while fragments are out of their beds: on their side the gap reaches a little PAST their seated faces, over
 *  the bed's edge, so no hairline of the static bone (drawn up to the bed's clip) shows between the dark gap and the bed */
const DISP_GAPS_CACHE = new Map<string, string[]>();
const dispGaps = (moving: FragId[]): string[] => {
  const key = moving.join(',');
  let hit = DISP_GAPS_CACHE.get(key);
  if (!hit) {
    hit = SEAM_IDS.map((id) => poly(gapPoly(id, moving)));
    DISP_GAPS_CACHE.set(key, hit);
  }
  return hit;
};
/** a darker-red core down the middle of each seated gap (blood in the crack, close range): the static seams' parts and
 *  the wedge's (which fade in as it seats, so nothing pops when it arrives) */
const coreLine = (id: SeamId, s0: number, s1: number) => {
  const ps: P[] = [];
  for (let s = s0; s <= s1; s += 0.1) ps.push(seamEdgeSeated(id, s, 1, -seamGap(id, s) / 2));
  return open(ps, 0.4);
};
const CORE_STATIC = [coreLine('C1', -0.8, S_C3_ON_C1 - 0.5), coreLine('C2', 0.5, LEN.C2 + 0.8)];
const CORE_WEDGE = [coreLine('C1', S_C3_ON_C1 + 0.5, LEN.C1 + 0.8), coreLine('C3', 0.5, LEN.C3 + 0.8)];

// ---------------------------------------------------------------- the wedge's vacated bed (a cancellous floor)
type Cell = {d: string; dIn: string; red: boolean; c: P};
/** a honeycomb of cancellous pits over a fragment's seated outline (within the radius), in a box; `keep` can thin it
 *  to the strip along the faces that a displacement can uncover */
const bedCells = (polyF: P[], box: View, S: number, keep?: (c: P) => boolean, seed = 0): Cell[] => {
  const out: Cell[] = [];
  const [bx0, by0, bx1, by1] = box;
  for (let j = 0; by0 + j * S * 0.866 < by1; j++) {
    for (let i = 0; bx0 + i * S < bx1; i++) {
      const h = hash(i * 7.13 + j * 3.37 + seed);
      const c = pt(bx0 + i * S + (j % 2) * 0.5 * S + (h - 0.5) * 0.09, by0 + j * S * 0.866 + (hash(i * 2.1 + j * 9.7 + seed) - 0.5) * 0.08);
      if (keep && !keep(c)) continue;
      if (!inPoly(c, polyF) || !inPoly(c, RADIUS)) {
        // keep cells that straddle the bed's edge (the clip trims them)
        const nearIn = [0, 1, 2, 3, 4, 5].some((k) => {
          const q = add(c, pt(Math.cos(k * 1.047) * S * 0.5, Math.sin(k * 1.047) * S * 0.5));
          return inPoly(q, polyF) && inPoly(q, RADIUS);
        });
        if (!nearIn) continue;
      }
      const r = S * (0.36 + 0.08 * hash(i * 5.5 + j * 1.3));
      const vs: P[] = [];
      for (let k = 0; k < 6; k++) {
        const a = k * 1.047 + 0.52 + (hash(i * 3.3 + j * 7.1 + k) - 0.5) * 0.4;
        const rk = r * (0.82 + 0.3 * hash(i * 1.9 + j * 4.3 + k * 2.7));
        vs.push(add(c, pt(Math.cos(a) * rk, Math.sin(a) * rk * 0.92)));
      }
      // the pit's shadowed upper-left inner wall: the same cell shifted toward the light and shrunk
      const sh = vs.map((v) => add(lerpP(c, v, 0.8), pt(-0.035, -0.045)));
      out.push({d: closed(vs, 0.9), dIn: closed(sh, 0.9), red: hash(i * 11.7 + j * 5.9 + seed) > 0.88, c});
    }
  }
  return out;
};
const BED_CELLS: Cell[] = (() => {
  const xs = WEDGE_POLY.map((p) => p.x), ys = WEDGE_POLY.map((p) => p.y);
  return bedCells(WEDGE_POLY, [Math.min(...xs) - 0.5, Math.min(...ys) - 0.5, 14, Math.min(13, Math.max(...ys))], 0.4);
})();
/** the bed's walls along the seated seams (the floor is darker in their lee) */
const BED_WALLS = line([...[...WEDGE_FACES[0]].reverse(), ...WEDGE_FACES[1]]);
const WEDGE_D = poly(WEDGE_POLY as P[]);
const Bed: React.FC<{px: number; view: View; k: number}> = ({px, view, k}) => {
  const [x0, y0, x1, y1] = view;
  const cells = BED_CELLS.filter((c) => c.c.x > x0 - 0.5 && c.c.x < x1 + 0.5 && c.c.y > y0 - 0.5 && c.c.y < y1 + 0.5);
  const floor = mix(C.cancellous, C.boneDeep, 0.38);
  const pit = mix(C.cancellousPore, C.cavity, 0.42);
  const pitIn = mix(C.cancellousPore, C.cavity, 0.72);
  return (
    <g opacity={k}>
      <path d={RAD_PATH} fill={floor} />
      {cells.map((c, i) => <path key={`c${i}`} d={c.d} fill={c.red ? mix(C.marrow, C.blood, 0.3) : pit} />)}
      {cells.map((c, i) => <path key={`s${i}`} d={c.dIn} fill={c.red ? mix(C.marrow, C.cavity, 0.5) : pitIn} />)}
      {/* in the lee of the seams' walls */}
      <path d={BED_WALLS} fill="none" stroke={SHADOW} strokeWidth={1.1} strokeLinejoin="round" opacity={0.38} />
      <path d={BED_WALLS} fill="none" stroke={SHADOW} strokeWidth={0.45} strokeLinejoin="round" opacity={0.3} />
      {/* the bed's lip at the bone's border */}
      <path d={RAD_PATH} fill="none" stroke={C.boneInk} strokeWidth={2.2 * px} />
    </g>
  );
};
/** an articular fragment's bed: the broken metaphysis it was lifted off, seen down the open gap. Deeper and darker than
 *  the wedge's (the cut runs deep under a large fragment, mostly in its shadow): a dark cancellous honeycomb with a few
 *  marrow-red cells, darkest in the lee of the walls. Cells only in the strip along its faces that a lift uncovers. */
const ART_BED = new Map<FragId, {cells: Cell[]; walls: string}>();
const artBedOf = (f: FragId) => {
  const hit = ART_BED.get(f);
  if (hit) return hit;
  const [A, B] = FRAG_FACES[f].lines;
  const near = [...A, ...B].filter((_, i) => i % 4 === 0);
  const xs = near.map((p) => p.x), ys = near.map((p) => p.y);
  const D = 4.2;
  const keep = (c: P) => near.some((q) => (q.x - c.x) ** 2 + (q.y - c.y) ** 2 < D * D);
  const cells = bedCells(FRAG_POLY[f], [Math.min(...xs) - D, Math.min(...ys) - D, Math.max(...xs) + D, Math.max(...ys) + D], 0.46, keep, f === 'styloid' ? 31.7 : 57.3);
  const v = {cells, walls: line([...[...A].reverse(), ...B])};
  ART_BED.set(f, v);
  return v;
};
const ArtBed: React.FC<{f: FragId; px: number; view: View}> = ({f, px, view}) => {
  const [x0, y0, x1, y1] = view;
  const bed = artBedOf(f);
  const cells = bed.cells.filter((c) => c.c.x > x0 - 0.5 && c.c.x < x1 + 0.5 && c.c.y > y0 - 0.5 && c.c.y < y1 + 0.5);
  const floor = mix(mix(C.cancellous, C.boneDeep, 0.5), C.cavity, 0.6);
  const pit = mix(C.cancellousPore, C.cavity, 0.8);
  const pitIn = mix(C.cavity, '#12030A', 0.45);
  return (
    <g>
      <path d={RAD_PATH} fill={floor} />
      {cells.map((c, i) => <path key={`c${i}`} d={c.d} fill={c.red ? mix(C.marrow, C.cavity, 0.35) : pit} />)}
      {cells.map((c, i) => <path key={`s${i}`} d={c.dIn} fill={c.red ? mix(C.marrow, C.cavity, 0.65) : pitIn} />)}
      <path d={bed.walls} fill="none" stroke={SHADOW} strokeWidth={1.6} strokeLinejoin="round" opacity={0.45} />
      <path d={bed.walls} fill="none" stroke={SHADOW} strokeWidth={0.7} strokeLinejoin="round" opacity={0.4} />
      <path d={RAD_PATH} fill="none" stroke={C.boneInk} strokeWidth={2.2 * px} />
    </g>
  );
};

// ---------------------------------------------------------------- the glue
export type GlueRun = {
  id: SeamId;
  s: number[];
  /** outer outline edges (side -1, side +1): the faces plus the meniscus, proud near the fresh tip */
  lo: P[];
  hi: P[];
  /** the core edges: the two faces (or the new-bone fronts while healing) */
  loC: P[];
  hiC: P[];
  fresh: number[];
  /** per sample: the flow of the front nearest along this seam (0 with none) and that front's index (-1 with none) */
  fl: number[];
  fk: number[];
  inset: boolean[];
  capA: boolean;
  capB: boolean;
  bulbA: boolean;
  bulbB: boolean;
  /** the flow of the front at each bulb end (0 where no bulb) */
  flowA: number;
  flowB: number;
};
const capPts = (p1: P, p2: P, tOut: P, k = 1): P[] => {
  const c = lerpP(p1, p2, 0.5);
  const r = len(sub(p1, p2)) / 2;
  const u = nrm(sub(p1, c));
  const out: P[] = [];
  for (let j = 1; j < 9; j++) {
    const a = (j / 9) * Math.PI;
    out.push(add(c, add(mul(u, Math.cos(a) * r), mul(tOut, Math.sin(a) * r * k))));
  }
  return out;
};
/** how far (mm) a branch seam's start (the middle of its two faces at s = 0) stands off C1, away from C1 along the
 *  branch's side, in a pose */
const branchLift = (id: SeamId, w: Poses): number => {
  const sJ = id === 'C2' ? S_C2_ON_C1 : S_C3_ON_C1;
  const n = seamNormal('C1', sJ);
  const away = id === 'C2' ? -1 : 1;
  const d0 = lerpP(seamEdgeSeated(id, 0, -1), seamEdgeSeated(id, 0, 1), 0.5);
  const d1 = lerpP(seamEdge(id, 0, -1, w), seamEdge(id, 0, 1, w), 0.5);
  return ((d1.x - d0.x) * n.x + (d1.y - d0.y) * n.y) * away;
};
/** the glue in one seam as drawable runs (islands while healing), in world mm with the fragments in their current poses
 *  (the band between the two CURRENT faces: wide while a gap stands open, narrowing as the faces close).
 *  The outer edges follow seams.glueBand(over = glueOver(st.px)) exactly, except near the fresh tip (a little proud)
 *  and at wide framings (held to a minimum on-screen width); healing insets are passed straight through to glueBand.
 *  A span that reaches a seam's end runs on past the bone's border (clipped there), so the gel fills the seam right to
 *  the edge on both faces (heal.tsx stretches its glued span the same way). */
export const glueRuns = (id: SeamId, st: BoneState2): GlueRun[] => {
  const g = st.glue[id];
  if (!g || g.b <= g.a) return [];
  let a = Math.max(-0.5, g.a), b = Math.min(LEN[id] + 0.6, g.b);
  if (g.b >= LEN[id] - 0.01) b = LEN[id] + 0.7;
  if (id === 'C1' && g.a <= 0.01) a = -0.7;
  // V3: a branch's gel laid from the junction starts in C1's: while the pieces either side of the branch stand off C1,
  // the branch's s = 0 end stands off with them, so the gel starts that much further back (on down into C1's open gap)
  if (id !== 'C1' && g.a <= 0.01 && st.poses) {
    const lift = branchLift(id, st.poses);
    if (lift > 1e-6) a = Math.min(a, -Math.min(lift, 2.5));
  }
  if (b - a < 0.03) return [];
  const bridge = st.heal.bridge;
  const inset = bridge > 0 ? (side: 1 | -1, s: number) => growth(id, s, bridge, side) : undefined;
  const step = st.px < 0.016 ? 0.04 : 0.08; // finer sampling in close-ups
  const pose = poseArg(st);
  const outer = glueBand(id, a, b, pose, glueOver(st.px), inset, step);
  const core = glueBand(id, a, b, pose, 0, inset, step);
  const frs = frontsOf(st).filter((f) => f.seam === id);
  const out: GlueRun[] = [];
  outer.forEach((r, ri) => {
    const c = core[ri];
    if (!c || c.s.length !== r.s.length) return;
    const lo: P[] = [], hi: P[] = [], fresh: number[] = [], fls: number[] = [], fks: number[] = [], ins: boolean[] = [];
    for (let i = 0; i < r.s.length; i++) {
      const s = r.s[i];
      const im = inset ? inset(-1, s) : 0, ip = inset ? inset(1, s) : 0;
      // freshness near the tip, weighted by the flow: as the lead eases front.flow to 0 (the tip lifting away) the proud
      // tail, its gloss and the bulb settle into the ordinary rounded end, so nothing pops when front goes null. With
      // several fronts on one seam, each sample belongs to the nearest.
      let k = -1, dk = 1e9;
      frs.forEach((fr, j) => {
        const d = Math.abs(s - fr.s);
        if (d < dk) { dk = d; k = j; }
      });
      const fr = k >= 0 ? frs[k] : null;
      const f = fr ? (1 - ss(Math.abs(s - fr.s), 0.15, FRESH_MM)) * clamp(fr.flow) : 0;
      fls.push(fr ? clamp(fr.flow) : 0);
      fks.push(k);
      let dv = sub(c.hi[i], c.lo[i]);
      dv = len(dv) > 1e-4 ? nrm(dv) : seamNormal(id, s);
      let eM = im > 0 ? 0 : PROUD * f, eP = ip > 0 ? 0 : PROUD * f;
      if (im <= 0 && ip <= 0) {
        const need = (MIN_GLUE_PX * st.px - (len(sub(r.hi[i], r.lo[i])) + eM + eP)) / 2;
        if (need > 0) { eM += need; eP += need; }
      }
      lo.push(add(r.lo[i], mul(dv, -eM)));
      hi.push(add(r.hi[i], mul(dv, eP)));
      fresh.push(f);
      ins.push(im > 0 || ip > 0);
    }
    let capA = Math.abs(r.s[0] - a) < 1e-6;
    const capB = Math.abs(r.s[r.s.length - 1] - b) < 1e-6;
    // each front swells a bulb at the span end it is laying (the nearer end, within 0.35 mm)
    let bulbA = false, bulbB = false, flowA = 0, flowB = 0;
    for (const fr of frs) {
      const nearA = Math.abs(fr.s - a), nearB = Math.abs(fr.s - b);
      if (capA && nearA < 0.35 && nearA <= nearB) { bulbA = true; flowA = Math.max(flowA, clamp(fr.flow)); }
      else if (capB && nearB < 0.35 && nearB < nearA) { bulbB = true; flowB = Math.max(flowB, clamp(fr.flow)); }
    }
    // a branch seam's gel that starts inside C1's (its first 0.35 mm lie in C1's band) ends flat there: the two bands
    // are one body, and a rounded end would poke across C1's far half
    if (id !== 'C1' && capA && !bulbA && r.s[0] <= 0.35) capA = false;
    out.push({id, s: r.s, lo, hi, loC: c.lo, hiC: c.hi, fresh, fl: fls, fk: fks, inset: ins, capA, capB, bulbA, bulbB, flowA, flowB});
  });
  return out;
};
const tEnd = (r: GlueRun, end: 'a' | 'b'): P => {
  const n = r.s.length - 1;
  const m = (i: number) => lerpP(r.lo[i], r.hi[i], 0.5);
  return end === 'b' ? nrm(sub(m(n), m(Math.max(0, n - 2)))) : nrm(sub(m(0), m(Math.min(n, 2))));
};
/** a run's outline: outer (with meniscus) or core (the gel between the faces), with rounded ends at the span's ends */
const runOutline = (r: GlueRun, which: 'outer' | 'core'): P[] => {
  const lo = which === 'outer' ? r.lo : r.loC, hi = which === 'outer' ? r.hi : r.hiC;
  const n = lo.length - 1;
  const capB = r.capB ? capPts(lo[n], hi[n], tEnd(r, 'b'), 0.9) : [];
  const capA = r.capA ? capPts(hi[0], lo[0], tEnd(r, 'a'), 0.9) : [];
  return [...lo, ...capB, ...[...hi].reverse(), ...capA];
};
type Bulb = {c: P; r: number; rc: number; flow: number};
/** the half-width (mm) past which a bulb's lead stops growing with its band (above every seated band's); its swell past
 *  the faces fades out between half-widths 0.9 and 1.25 (a head that fills a wide open gap, not spilling onto the bone) */
const BULB_HALF_MAX = 0.9;
/** the gel bulb where the band leaves the cannula (or a front's head): at flow 0 it lies inside the band's rounded end */
const runBulbs = (r: GlueRun): Bulb[] => {
  const out: Bulb[] = [];
  /** the nearest the band's rounded end (runOutline's cap: squashed to 0.9 along the seam and sheared with the jag)
   *  comes to its centre */
  const capMin = (p1: P, p2: P, t: P) => {
    const c = lerpP(p1, p2, 0.5);
    return Math.min(len(sub(p1, c)), ...capPts(p1, p2, t, 0.9).map((q) => len(sub(q, c))));
  };
  const mk = (i: number, end: 'a' | 'b') => {
    const flow = end === 'a' ? r.flowA : r.flowB;
    const tE = tEnd(r, end);
    const half = len(sub(r.hi[i], r.lo[i])) / 2;
    const halfC = len(sub(r.hiC[i], r.loC[i])) / 2;
    // (in a wide open gap the head is the band's own width: its swell and lead are those of a V2-width band)
    const hs = Math.min(half, BULB_HALF_MAX);
    const grow = 0.27 * flow * half * clamp((1.25 - half) / 0.35);
    // as the flow eases to 0 the bulb shrinks to lie inside that rounded end (a full-width circle would stand proud of
    // a squashed or leaning cap and snap back when the front goes null)
    const r0 = 0.97 * capMin(r.lo[i], r.hi[i], tE), rc0 = 0.97 * capMin(r.loC[i], r.hiC[i], tE);
    const c = add(lerpP(r.lo[i], r.hi[i], 0.5), mul(tE, 0.42 * flow * hs));
    out.push({c, r: r0 + (half - r0) * flow + grow, rc: rc0 + (halfC - rc0) * flow + grow, flow});
  };
  if (r.bulbB) mk(r.s.length - 1, 'b');
  if (r.bulbA) mk(0, 'a');
  return out;
};
/** which side of each seam is nearer the key light. That face's broken lip faces AWAY from the light (it is the shaded
 *  wall of the trench): its bone-ink lip is drawn over the gel's edge and the gel lies in its shadow there. The far face
 *  is the lit wall: the gel climbs it in a light meniscus and carries the highlight. */
const NEAR_LO: Record<SeamId, boolean> = {
  C1: dotL(seamNormal('C1', LEN.C1 / 2)) < 0,
  C2: dotL(seamNormal('C2', LEN.C2 / 3)) < 0,
  C3: dotL(seamNormal('C3', LEN.C3 / 2)) < 0,
};
/** per seam, the side (-1 = GlueRun.lo, +1 = GlueRun.hi) whose outer glue edge carries the shaded face's bone-ink lip
 *  (1.8 px C.boneInk); the other edge is the gel's own soft edge (1.25 px, GLUE_EDGE_COLOR). For overlays that redraw
 *  the band's edges (wet.tsx). */
export const GLUE_LIP_SIDE: Record<SeamId, 1 | -1> = {C1: NEAR_LO.C1 ? -1 : 1, C2: NEAR_LO.C2 ? -1 : 1, C3: NEAR_LO.C3 ? -1 : 1};
export const GLUE_EDGE_COLOR = GLUE_EDGE;
/** the seam junctions on C1: branch, its arc length on C1, the side of C1 it leaves from */
const JUNCTIONS: {id: SeamId; s: number; side: 1 | -1}[] = [{id: 'C2', s: S_C2_ON_C1, side: -1}, {id: 'C3', s: S_C3_ON_C1, side: 1}];
/** the highlights' taper (mm along the seam) where a branch's highlights start */
const HL_TAPER = 0.3;
/** where a branch's highlights start (arc length along the branch): 0.15 mm past the point where its highlight lines
 *  leave C1's outer band (seated, macro overhang), and no earlier than 0.9 mm. They taper in from there instead of
 *  being cut by the junction mask (a cut curving stroke reads as a hook); C1's own highlight runs on across both
 *  junctions. C2 ~0.91, C3 0.9. */
const HL_START: Record<SeamId, number> = (() => {
  const out: Record<SeamId, number> = {C1: -1e9, C2: 0.9, C3: 0.9};
  for (const J of JUNCTIONS) {
    const lo: P[] = [], hi: P[] = [];
    for (let s = J.s - 3; s <= J.s + 3; s += 0.02) {
      lo.push(seamEdgeSeated('C1', s, -1, GLUE_OVER));
      hi.push(seamEdgeSeated('C1', s, 1, GLUE_OVER));
    }
    const band = [...lo, ...hi.reverse()];
    const nSide: 1 | -1 = NEAR_LO[J.id] ? -1 : 1;
    let last = 0;
    for (let s = 0; s <= 3; s += 0.01) {
      const a = seamEdgeSeated(J.id, s, nSide), b = seamEdgeSeated(J.id, s, nSide > 0 ? -1 : 1);
      if (inPoly(lerpP(a, b, 0.82), band) || inPoly(lerpP(a, b, 0.2), band)) last = s;
    }
    out[J.id] = Math.max(0.9, last + 0.15);
  }
  return out;
})();
/** lip-coloured fillets in the inside corners where a branch's gel meets C1's (no ink spike in an acute corner) */
const junctionFillets = (runs: GlueRun[], d: number): {pts: P[]; deep: boolean}[] => {
  const out: {pts: P[]; deep: boolean}[] = [];
  for (const J of JUNCTIONS) {
    const main = runs.find((r) => r.id === 'C1' && r.s[0] < J.s - 0.5 && r.s[r.s.length - 1] > J.s + 0.5 && !r.inset.some((v, i) => v && Math.abs(r.s[i] - J.s) < 1.5));
    const br = runs.find((r) => r.id === J.id && r.s[0] < 0.5 && !r.inset.slice(0, 30).some((v) => v));
    if (!main || !br) continue;
    // the fillets grow in as the branch's gel reaches into C1's (C3 is laid upward to the junction)
    const dd = d * clamp((0.75 - br.s[0]) / 0.45);
    if (dd < 0.01) continue;
    // C1's edge on the branch's side, near the junction
    const idx = main.s.map((s, i) => [s, i] as const).filter(([s]) => Math.abs(s - J.s) < 2.5).map(([, i]) => i);
    if (idx.length < 3) continue;
    const mEdge = (J.side < 0 ? main.lo : main.hi).slice(idx[0], idx[idx.length - 1] + 1);
    for (const bSide of [-1, 1] as const) {
      const bEdge = (bSide < 0 ? br.lo : br.hi).slice(0, Math.min(br.s.length, 60));
      const x = polyX(bEdge, mEdge);
      if (!x) continue;
      // along the branch's edge away from C1, and along C1's edge away from the branch
      const A = walk(bEdge, x.i, 1, dd, x.p);
      const nB = seamNormal(J.id, br.s[Math.min(x.i, br.s.length - 1)]);
      const probe = mEdge[Math.min(mEdge.length - 1, x.j + 3)];
      const dirM: 1 | -1 = (probe.x - x.p.x) * nB.x + (probe.y - x.p.y) * nB.y > 0 === bSide > 0 ? 1 : -1;
      const B = walk(mEdge, x.j, dirM, dd, x.p);
      if (A.length === 0 || B.length === 0) continue;
      const a = A[A.length - 1], b = B[B.length - 1];
      const curve: P[] = [];
      for (let k = 1; k < 8; k++) {
        const t = k / 8;
        curve.push(add(add(mul(a, (1 - t) ** 2), mul(x.p, 2 * t * (1 - t))), mul(b, t * t)));
      }
      // in the shaded corner (both edges the near-light ones) the fillet lies in the deep tone
      const deep = (J.side < 0) === NEAR_LO.C1 && (bSide < 0) === NEAR_LO[J.id];
      out.push({pts: [x.p, ...A, ...curve, ...[...B].reverse()], deep});
    }
  }
  return out;
};
/** contiguous index ranges where pred holds (split where key changes, if given) */
const ranges = (n: number, pred: (i: number) => boolean, key?: (i: number) => number): [number, number][] => {
  const out: [number, number][] = [];
  let st = -1;
  for (let i = 0; i < n; i++) {
    if (st >= 0 && key && key(i) !== key(i - 1)) { if (i - 1 > st) out.push([st, i - 1]); st = -1; }
    if (pred(i)) { if (st < 0) st = i; }
    else if (st >= 0) { if (i - 1 > st) out.push([st, i - 1]); st = -1; }
  }
  if (st >= 0 && n - 1 > st) out.push([st, n - 1]);
  return out;
};

const Glue: React.FC<{st: BoneState2; runs: GlueRun[]; radClip: string; glueClip: string; view: View; lineFade: number; rimExtra?: React.ReactNode; rimMask?: string}> = ({st, runs, radClip, glueClip, view, lineFade, rimExtra, rimMask}) => {
  if (runs.length === 0) return null;
  const px = st.px;
  const set = clamp(st.set);
  const healA = 1 - clamp(st.heal.bridge * 6); // details that belong to the intact bond
  const outlines = runs.map((r) => poly(runOutline(r, 'outer')));
  const cores = runs.map((r) => poly(runOutline(r, 'core')));
  const bulbs = runs.flatMap((r) => runBulbs(r));
  const fil = healA > 0.01 ? junctionFillets(runs, 0.24) : [];
  const fillets = fil.map((f) => poly(f.pts));
  const inkW = 1.25 * px;
  const coreCol = mix(CORE, SATIN_CORE, 0.5 * set);
  const lipCol = mix(LIP, SATIN_LIP, 0.5 * set);
  const deepCol = mix(mix(C.glueDeep, mix(C.glueDeep, '#8FA8A3', 0.4), set), coreCol, 0.36 + 0.1 * set); // opaque: one tone
  const [vx0, vy0, vx1, vy1] = view;
  const mk = {x: vx0 - 2, y: vy0 - 2, width: vx1 - vx0 + 4, height: vy1 - vy0 + 4};
  // per seam: a mask that hides its surface details where another seam's gel lies, so the T-junctions read as one
  // continuous gel body: C1's shading stops at a branch's gel, a branch's runs on into C1's lip and stops at its core
  const ids = [...new Set(runs.map((r) => r.id))];
  const masks: Partial<Record<SeamId, string>> = {}, masksO: Partial<Record<SeamId, string>> = {};
  ids.forEach((id) => { masks[id] = uid('fb_gm'); masksO[id] = uid('fb_go'); });
  const c1Clip = uid('fb_c1');
  const hasJ = runs.some((r) => r.id === 'C1') && runs.some((r) => r.id !== 'C1');
  return (
    <g>
      <defs>
        {ids.map((id) => (
          <mask key={id} id={masks[id]} maskUnits="userSpaceOnUse" {...mk}>
            <rect {...mk} fill="#FFFFFF" />
            {runs.map((r, i) => (r.id !== id ? <path key={i} d={id === 'C1' ? outlines[i] : cores[i]} fill="#000000" /> : null))}
          </mask>
        ))}
        {/* and one that hides the bone's lip line wherever another seam's gel (or a junction fillet) lies */}
        {ids.map((id) => (
          <mask key={`o${id}`} id={masksO[id]} maskUnits="userSpaceOnUse" {...mk}>
            <rect {...mk} fill="#FFFFFF" />
            {runs.map((r, i) => (r.id !== id ? <path key={i} d={outlines[i]} fill="#000000" stroke="#000000" strokeWidth={2.5 * inkW} /> : null))}
            {fillets.map((d, i) => <path key={`f${i}`} d={d} fill="#000000" stroke="#000000" strokeWidth={2.5 * inkW} />)}
          </mask>
        ))}
        {hasJ && <clipPath id={c1Clip}>{runs.map((r, i) => (r.id === 'C1' ? <path key={i} d={outlines[i]} /> : null))}</clipPath>}
      </defs>
      <g clipPath={`url(#${radClip})`}>
        {/* one inked union of every seam's gel (and the junctions' fillets): an ink pass of all shapes, then the fills */}
        <g>
          {outlines.map((d, i) => <path key={`i${i}`} d={d} fill={GLUE_EDGE} stroke={GLUE_EDGE} strokeWidth={2 * inkW} strokeLinejoin="round" />)}
          {fillets.map((d, i) => <path key={`if${i}`} d={d} fill={GLUE_EDGE} stroke={GLUE_EDGE} strokeWidth={2 * inkW} strokeLinejoin="round" opacity={healA} />)}
          {bulbs.map((b, i) => <circle key={`ib${i}`} cx={b.c.x} cy={b.c.y} r={b.r} fill={GLUE_EDGE} stroke={GLUE_EDGE} strokeWidth={2 * inkW} />)}
        </g>
        {/* the lips (thin gel wetting each face, light), then the core filling the gap between the faces */}
        <g>
          {outlines.map((d, i) => <path key={`l${i}`} d={d} fill={lipCol} />)}
          {fillets.map((d, i) => <path key={`lf${i}`} d={d} fill={fil[i].deep ? deepCol : lipCol} opacity={healA} />)}
          {bulbs.map((b, i) => <circle key={`lb${i}`} cx={b.c.x} cy={b.c.y} r={b.r} fill={lipCol} />)}
        </g>
        <g>
          {cores.map((d, i) => <path key={`c${i}`} d={d} fill={coreCol} />)}
          {bulbs.map((b, i) => <circle key={`cb${i}`} cx={b.c.x} cy={b.c.y} r={b.rc} fill={coreCol} />)}
          {/* where a branch's gel lies in C1's, the two are one body: no lip between them */}
          {hasJ && (
            <g clipPath={`url(#${c1Clip})`}>
              {runs.map((r, i) => (r.id !== 'C1' ? <path key={`j${i}`} d={outlines[i]} fill={coreCol} /> : null))}
            </g>
          )}
        </g>
        {runs.map((r, ri) => {
          const n = r.s.length;
          const nearLo = NEAR_LO[r.id];
          const pN = nearLo ? r.lo : r.hi, pF = nearLo ? r.hi : r.lo; // outer edges: near the light / far
          const cN = nearLo ? r.loC : r.hiC, cF = nearLo ? r.hiC : r.loC; // the faces
          let wSum = 0;
          for (let i = 0; i < n; i++) wSum += len(sub(pF[i], pN[i]));
          const bandPx = wSum / Math.max(1, n) / px;
          // surface detail needs a few pixels of band: full from 8 px wide (fixation framings included)
          const detK = clamp((bandPx - 4) / 4) * healA;
          if (detK < 0.01) return null;
          const settledOk = (i: number) => !r.inset[i];
          // 1. the deep strip: the gel in the shaded lip's lee (concave settled gel), narrowing to nothing on the proud
          //    fresh tail
          const deep: React.ReactNode[] = ranges(n, (i) => settledOk(i) && r.fresh[i] < 0.95).map(([a, b], k) => {
            const A: P[] = [], B: P[] = [];
            for (let i = a; i <= b; i++) {
              const kk = 1 - r.fresh[i];
              A.push(pN[i]);
              B.push(lerpP(pN[i], lerpP(cN[i], cF[i], 0.26), kk));
            }
            return <path key={`d${k}`} d={poly([...A, ...B.reverse()])} fill={deepCol} opacity={detK} />;
          });
          // 2. fresh tail: proud and convex, a brighter lip on the light's side
          const freshL: React.ReactNode[] = ranges(n, (i) => r.fresh[i] > 0.02 && !r.inset[i]).map(([a, b], k) => {
            const A: P[] = [], B: P[] = [];
            for (let i = a; i <= b; i++) {
              A.push(pN[i]);
              B.push(lerpP(pN[i], pF[i], 0.3 * r.fresh[i]));
            }
            return <path key={`fl${k}`} d={poly([...A, ...B.reverse()])} fill={FRESH_LIP} opacity={0.85 * detK} />;
          });
          // 3. the one highlight: on the settled gel where its surface climbs the lit (far) face, continuous while
          //    glossy; as the glue sets it shortens to the best-lit stretches and fades (satin). On the fresh tail it
          //    is wider and brighter, on the proud crest toward the light.
          const hlW = Math.min(Math.max(0.05 * bandPx, 2.2), 6) * px;
          const facing = (i: number) => {
            const v = nrm(sub(pN[i], pF[i]));
            return dotL(v) + 0.45 * noise1(r.s[i] * 1.3 + SEED[r.id] * 5, SEED[r.id] + 9);
          };
          const thr = -2 + 2.75 * ss(set, 0, 1);
          // a branch's highlights start clear of C1's band (HL_START) and taper in there; C1's run on across the junctions
          const hl0 = HL_START[r.id];
          const taperU = (s: number) => clamp((s - hl0) / HL_TAPER);
          const hlStroke = (a: number, b: number, k: number, w: number, op: number, key: string): React.ReactNode => {
            const at = (i: number) => lerpP(cN[i], cF[i], k);
            if (r.s[a] >= hl0 + HL_TAPER) {
              const ps: P[] = [];
              for (let i = a; i <= b; i++) ps.push(at(i));
              return <path key={key} d={open(ps, 0.5)} stroke={C.glueShine} strokeWidth={w} opacity={op} />;
            }
            // the taper: a ribbon (width and opacity rising from nothing) from the start, exactly at hl0 where the range
            // was cut there, to the first sample past the zone; the ordinary stroke carries on from that sample
            const Cs: P[] = [], Rs: number[] = [];
            let o0 = taperU(r.s[a]);
            if (a > 0 && r.s[a - 1] < hl0) {
              Cs.push(lerpP(at(a - 1), at(a), (hl0 - r.s[a - 1]) / (r.s[a] - r.s[a - 1] || 1)));
              Rs.push(0);
              o0 = 0;
            }
            let m = a;
            for (; m <= b; m++) {
              Cs.push(at(m));
              Rs.push(0.5 * w * taperU(r.s[m]));
              if (r.s[m] >= hl0 + HL_TAPER) break;
            }
            if (Cs.length < 2) return null;
            const o1 = taperU(r.s[Math.min(m, b)]);
            const gid = uid('fb_hlt');
            const g0 = Cs[0], g1 = Cs[Cs.length - 1];
            const rest: P[] = [];
            for (let i = m; i <= b; i++) rest.push(at(i));
            return (
              <g key={key} opacity={op}>
                <defs>
                  <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={g0.x} y1={g0.y} x2={g1.x} y2={g1.y}>
                    <stop offset={0} stopColor={C.glueShine} stopOpacity={o0} />
                    <stop offset={1} stopColor={C.glueShine} stopOpacity={o1} />
                  </linearGradient>
                </defs>
                <path d={poly(tube(Cs, Rs, false, false).outline)} fill={`url(#${gid})`} stroke="none" />
                {rest.length > 1 && <path d={open(rest, 0.5)} stroke={C.glueShine} strokeWidth={w} />}
              </g>
            );
          };
          // the fresh zone by its shape (fresh / flow): while the tip lifts away (front.flow easing 1 -> 0) the fresh
          // highlight keeps its extent and dims and thins away, and the settled highlight fades in over the tail, so the
          // settle is continuous (thresholds on fresh itself would snap both at fixed flow values)
          // (per sample: the flow of that sample's own front, when several fronts share the seam)
          const shape = (i: number) => (r.fl[i] > 1e-4 ? r.fresh[i] / r.fl[i] : 0);
          const fkey = (i: number) => r.fk[i];
          const hlOk = (i: number) => settledOk(i) && facing(i) > thr && r.s[i] >= hl0;
          const hlOp = (0.9 - 0.45 * set) * detK, hlWs = hlW * (1 - 0.2 * set);
          const settledHl = [
            ...ranges(n, (i) => hlOk(i) && shape(i) < 0.45).map(([a, b], k) => hlStroke(a, b, 0.82, hlWs, hlOp, `h${k}`)),
            // (the tail overlaps the settled stretch by a sample, so no gap opens between them)
            ...ranges(n, (i) => hlOk(i) && shape(i) >= 0.45, fkey).filter(([a]) => r.fl[a] < 0.999).map(([a, b], k) => hlStroke(a > 0 && r.s[a - 1] >= hl0 ? a - 1 : a, Math.min(n - 1, b + 1), 0.82, hlWs, hlOp * (1 - r.fl[a]), `ht${k}`)),
          ];
          const freshW = Math.max(hlW, 0.12 * bandPx * px);
          const freshHl = ranges(n, (i) => shape(i) >= 0.4 && !r.inset[i] && r.s[i] >= hl0, fkey).filter(([a]) => r.fl[a] > 0.001).map(([a, b], k) =>
            hlStroke(a, b, 0.2, hlW + (freshW - hlW) * r.fl[a], 0.95 * detK * r.fl[a], `hf${k}`),
          );
          return (
            <g key={`s${ri}`}>
              <g mask={`url(#${masks[r.id]})`}>
                {deep}
                {freshL}
              </g>
              {/* the highlights are not masked: C1's runs on across both junctions, a branch's tapers in clear of C1 */}
              <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                {settledHl}
                {freshHl}
              </g>
            </g>
          );
        })}
        {bulbs.map((b, i) => {
          const hx = b.c.x - b.r * 0.34, hy = b.c.y - b.r * 0.38;
          return (
            <g key={`bh${i}`} opacity={b.flow}>
              <circle cx={b.c.x + b.r * 0.12} cy={b.c.y + b.r * 0.14} r={b.rc * 0.86} fill={C.glueDeep} opacity={0.35} />
              <circle cx={b.c.x - b.r * 0.06} cy={b.c.y - b.r * 0.06} r={b.rc * 0.78} fill={coreCol} />
              <ellipse cx={hx} cy={hy} rx={b.r * 0.3} ry={b.r * 0.17} fill={C.glueShine} opacity={0.92} transform={`rotate(-38 ${hx} ${hy})`} />
            </g>
          );
        })}
        {/* the shaded face's broken lip over the gel's edge: the gel lies IN the seam, under the bone's edge */}
        {lineFade * healA > 0.01 && runs.map((r, ri) => {
          const pN = NEAR_LO[r.id] ? r.lo : r.hi;
          // not over the proud fresh tail; as it settles (front.flow easing to 0) the lip fades in over it
          const tail = (i: number) => r.fl[i] > 1e-4 && r.fresh[i] >= 0.3 * r.fl[i];
          const ok = (i: number) => !r.inset[i] && (r.id === 'C1' || r.s[i] > 0.5);
          const rs = ranges(r.s.length, (i) => ok(i) && !tail(i));
          const rt = ranges(r.s.length, (i) => ok(i) && tail(i), (i) => r.fk[i]).filter(([a]) => r.fl[a] < 0.999);
          return (
            <g key={`bl${ri}`} mask={`url(#${masksO[r.id]})`} fill="none" stroke={C.boneInk} strokeWidth={1.8 * px} strokeLinejoin="round" strokeLinecap="round" opacity={lineFade * healA}>
              {rs.map(([a, b], k) => <path key={k} d={open(pN.slice(a, b + 1), 0.5)} />)}
              {rt.map(([a, b], k) => <path key={`t${k}`} d={open(pN.slice(Math.max(0, a - 1), b + 2), 0.5)} opacity={1 - r.fl[a]} />)}
            </g>
          );
        })}
      </g>
      {/* the bone's outline continues over the gel where a seam meets the bone's edge (the glue is flush with it) */}
      <g clipPath={`url(#${glueClip})`}>
        <path d={RAD_PATH} fill="none" stroke={C.boneInk} strokeWidth={2.6 * px} mask={rimMask ? `url(#${rimMask})` : undefined} />
        {rimExtra}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- the whole fracture
const isDisplaced = (w: WedgeX) => Math.abs(w.dx) + Math.abs(w.dy) + Math.abs(w.rot) * 10 > 1e-4;
/** a moving fragment's exposed side wall (its broken faces seen as it stands out of its bed): a strip outside each face */
type Wall = {d: string; edge: string; pores: {x: number; y: number; r: number}[]; faces: {d: string; k: number}[]};
const sideWall = (fr: FragId, wW: number): Wall => {
  const {lines: [f1, f3], seams: [[id1, side1], [id3, side3]]} = FRAG_FACES[fr];
  const off = (ps: P[], id: SeamId, side: 1 | -1) =>
    ps.map((p) => {
      const s = seamNearest(id, p);
      return add(p, mul(seamNormal(id, s), -side * wW));
    });
  const o1 = off(f1, id1, side1), o3 = off(f3, id3, side3);
  const outer = [...[...o1].reverse(), ...o3];
  // its spongy broken surface
  const pores: Wall['pores'] = [];
  [f1, f3].forEach((f, k) => {
    const o = k === 0 ? o1 : o3;
    for (let i = 2; i < f.length - 2; i++) {
      const h = hash(i * 3.71 + k * 17.3);
      if (h > 0.3) continue;
      const q = lerpP(f[i], o[i], 0.2 + 0.6 * hash(i * 1.37 + k));
      pores.push({x: q.x, y: q.y, r: Math.min(wW * 0.25, 0.012 + 0.03 * hash(i * 5.1 + k * 2.2) ** 2)});
    }
  });
  // each face's strip on its own, with how squarely it faces the key light (it faces into the gap, -side * n)
  const faces = ([[f1, o1, id1, side1], [f3, o3, id3, side3]] as const).map(([f, o, id, side]) => {
    const m = f[Math.floor(f.length / 2)];
    return {d: poly([...f, ...[...o].reverse()]), k: dotL(mul(seamNormal(id, seamNearest(id, m)), -side))};
  });
  return {d: poly([...outer, ...[...f3].reverse(), ...f1]), edge: line(outer), pores, faces};
};
const WALL_CACHE = new Map<string, Wall>();
const wallOf = (fr: FragId, wW: number) => {
  const k = Math.round(wW * 100);
  const key = `${fr}${k}`;
  const hit = WALL_CACHE.get(key);
  if (hit) return hit;
  const v = sideWall(fr, k / 100);
  WALL_CACHE.set(key, v);
  return v;
};
/** where each seam opens onto the bone's border: the seated arc length where its centreline (s) and each of its two
 *  faces (lo: side -1, hi: side +1) cross the border, and which way is outward along it */
type Mouth = {id: SeamId; s: number; lo: number; hi: number; dir: 1 | -1};
const MOUTHS: Mouth[] = (() => {
  const cross = (at: (s: number) => P, s0: number, s1: number) => {
    let prev = inPoly(at(s0), RADIUS);
    for (let i = 1; i <= 1000; i++) {
      const s = s0 + ((s1 - s0) * i) / 1000;
      const ins = inPoly(at(s), RADIUS);
      if (ins !== prev) return s;
      prev = ins;
    }
    return s1;
  };
  const mk = (id: SeamId, s0: number, s1: number, dir: 1 | -1): Mouth => ({
    id, dir, s: cross((s) => seamPoint(id, s), s0, s1),
    lo: cross((s) => seamEdgeSeated(id, s, -1), s0, s1), hi: cross((s) => seamEdgeSeated(id, s, 1), s0, s1),
  });
  return [mk('C1', 3, -2, -1), mk('C1', LEN.C1 - 3, LEN.C1 + 2, 1), mk('C2', LEN.C2 - 3, LEN.C2 + 2, 1), mk('C3', LEN.C3 - 3, LEN.C3 + 2, 1)];
})();
/** a mouth opened by displaced pieces: the bridge that lets the gel reach the line between the two pieces' current
 *  border corners (added to the glue's clip), that line (inked over the gel, as the seated outline is), and the region
 *  where the seated outline's stroke over the gel is dropped (the seated and the current mouth) */
const mouthArt = (m: Mouth, w: Poses) => {
  // the bridge runs well in from the mouth: a tilted piece can carry its face past the seated border some way in
  const sIn = m.s - m.dir * 7, sOut = m.s + m.dir * 1.6;
  // it ends on the chord between the two faces' border corners, each carried by its piece (seated, that chord is the
  // border itself across the mouth: nothing changes as the pieces arrive)
  const lo = seamEdgeLine(m.id, sIn, m.lo, -1, w, 0.3, 0.1), hi = seamEdgeLine(m.id, sIn, m.hi, 1, w, 0.3, 0.1);
  const p1 = seamEdge(m.id, m.lo, -1, w), p2 = seamEdge(m.id, m.hi, 1, w);
  lo[lo.length - 1] = seamEdge(m.id, m.lo, -1, w, 0);
  hi[hi.length - 1] = seamEdge(m.id, m.hi, 1, w, 0);
  const reg = (ww: Poses | WedgeX) => poly([...seamEdgeLine(m.id, sIn, sOut, -1, ww, 0.25, 0.1), ...seamEdgeLine(m.id, sIn, sOut, 1, ww, 0.25, 0.1).reverse()]);
  return {bridge: poly([...lo, ...hi.reverse()]), line: line([p1, p2]), regions: [reg(w), reg({dx: 0, dy: 0, rot: 0})]};
};
const FRAG_D: Record<FragId, string> = {wedge: poly(FRAG_POLY.wedge), styloid: poly(FRAG_POLY.styloid), lunate: poly(FRAG_POLY.lunate)};
/** an articular fragment's exposed side wall at full displacement (mm): wider than the wedge's (0.3), it is a large
 *  fragment lifted and tilted, and the wall must read at phone size at the opening framing */
const ART_WALL = 0.65;
/** its cast shadow's offset (mm, away from the key light) at full displacement (the wedge's: 0.36) */
const ART_SHADOW = 0.55;

export const FractureBone: React.FC<{st: BoneState2; view: View}> = ({st, view}) => {
  const px = st.px;
  const ids: Ids = {shade: uid('fb_shade'), shadeH: uid('fb_shh'), ramp: uid('fb_ramp'), rampM: uid('fb_rampm'), sheen: uid('fb_sheen'), rad: uid('fb_rad')};
  const notWedge = uid('fb_nw'), wedgeClip = uid('fb_wc'), glueClip = uid('fb_gc'), mouths = uid('fb_mo');
  const h = st.heal;
  const remodel = clamp(h.remodel);
  // the chamfers and both faces' lines are gone by remodel 0.4 (the healing layer draws the remodelled bone over the
  // gap; a lingering face line on either side would read as a doubled outline)
  const fade = 1 - ss(remodel, 0, 0.4);
  const inkFade = fade;
  const gapCol = mix(GAP, C.bone, ss(remodel, 0, 0.75));
  const poses = posesOf(st);
  // the fragments standing out of place (drawn in their poses); the rest is the static bone
  const moving = FRAG_IDS.filter((f) => isDisplaced(poses[f]));
  const disp = moving.length > 0;
  const dispK: Record<FragId, number> = {wedge: fragDisp('wedge', poses.wedge), styloid: fragDisp('styloid', poses.styloid), lunate: fragDisp('lunate', poses.lunate)};
  /** the articular fragments' displacement: the static seams' blood cores fade as they open */
  const artK = Math.max(moving.includes('styloid') ? dispK.styloid : 0, moving.includes('lunate') ? dispK.lunate : 0);
  // the chamfer: a hard strip about 0.3 mm wide beside the gel at macro (the wider macro meniscus covers 0.14 of it),
  // a little narrower from CAM0 out
  const arts = faceArts(0.44 + (0.32 - 0.44) * ss(px, 0.009, 0.02));
  const statArts = disp ? arts.filter((a) => !(a.frag && moving.includes(a.frag))) : arts;
  const runs = SEAM_IDS.flatMap((id) => glueRuns(id, st));
  const gapsUnion = uid('fb_gu');
  const viewW: View = disp ? [view[0] - 3, view[1] - 3, view[2] + 3, view[3] + 3] : view;
  const clipOf: Record<FragId, string> = {wedge: wedgeClip, styloid: uid('fb_sc'), lunate: uid('fb_lc')};
  const xfOf = (f: FragId) => xfSvgFrag(f, poses[f]);
  /** per moving fragment: cast shadow offset and strength, side wall */
  const look = (f: FragId) => {
    const k = dispK[f];
    const art = f !== 'wedge';
    const wallK = clamp(k * 1.25);
    return {
      shadowK: clamp(k * 3),
      so: (art ? ART_SHADOW : 0.36) * Math.min(1, k * 1.5),
      wallK,
      wall: wallK > 0.02 ? wallOf(f, (art ? ART_WALL : 0.3) * wallK) : null,
    };
  };
  // the glue lies in the CURRENT gaps: where a fragment stands proud of the seated outline (the joint, the borders) the
  // gel is clipped to that fragment's own outline instead
  // (with st.poses the wedge's too; without, the V2 wedge keeps V2's clip)
  const clipMov = moving.filter((f) => f !== 'wedge' || st.poses);
  const glueRad = clipMov.length > 0 ? uid('fb_gr') : ids.rad;
  const mouthsOpen = glueRad !== ids.rad
    ? MOUTHS.filter((m) => [fragOf(m.id, m.s, -1), fragOf(m.id, m.s, 1)].some((f) => f && clipMov.includes(f))).map((m) => mouthArt(m, poses))
    : [];
  const rimMask = uid('fb_rm');
  return (
    <g>
      <defs>
        <Grad id={ids.shade} x1={-14} y1={-6} x2={16} y2={4} />
        {/* the same shading as it falls at y = 4 (the fracture), carried down the shaft */}
        <Grad id={ids.shadeH} x1={-17.333} y1={0} x2={12.667} y2={0} />
        <linearGradient id={ids.ramp} gradientUnits="userSpaceOnUse" x1={0} y1={14} x2={0} y2={40}>
          <stop offset={0} stopColor="#000000" />
          <stop offset={1} stopColor="#FFFFFF" />
        </linearGradient>
        <mask id={ids.rampM} maskUnits="userSpaceOnUse" x={-20} y={13} width={40} height={250}>
          <rect x={-20} y={13} width={40} height={250} fill={`url(#${ids.ramp})`} />
        </mask>
        <clipPath id={ids.rad}><path d={RAD_PATH} /></clipPath>
        <linearGradient id={ids.sheen} gradientUnits="userSpaceOnUse" x1={-13} y1={0} x2={-2} y2={0}>
          <stop offset={0} stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset={0.35} stopColor="#FFFFFF" stopOpacity={0.5} />
          <stop offset={0.6} stopColor="#FFFFFF" stopOpacity={0.12} />
          <stop offset={1} stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        {disp && <clipPath id={notWedge}><path d={`M-400 -400H400V600H-400Z ${moving.map((f) => FRAG_D[f]).join(' ')}`} clipRule="evenodd" /></clipPath>}
        <clipPath id={wedgeClip}><path d={WEDGE_D} /></clipPath>
        {moving.filter((f) => f !== 'wedge').map((f) => <clipPath key={f} id={clipOf[f]}><path d={FRAG_D[f]} /></clipPath>)}
        {/* everywhere except the seams' gaps: the bone's outline is cut where a seam opens onto its edge */}
        <clipPath id={mouths}><path d={`M-400 -400H400V600H-400Z ${SEATED_GAPS.join(' ')}`} clipRule="evenodd" /></clipPath>
        <clipPath id={gapsUnion}>{SEATED_GAPS.map((d, i) => <path key={i} d={d} />)}</clipPath>
        <clipPath id={glueClip}>
          {runs.map((r, i) => <path key={i} d={poly(runOutline(r, 'outer'))} />)}
        </clipPath>
        {glueRad !== ids.rad && (
          <clipPath id={glueRad}>
            <path d={RAD_PATH} />
            {clipMov.map((f) => <path key={f} d={FRAG_D[f]} transform={xfOf(f)} clipPath={`url(#${ids.rad})`} />)}
            {mouthsOpen.map((m, i) => <path key={`m${i}`} d={m.bridge} />)}
          </clipPath>
        )}
        {mouthsOpen.length > 0 && (
          <mask id={rimMask} maskUnits="userSpaceOnUse" x={-60} y={-90} width={120} height={160}>
            <rect x={-60} y={-90} width={120} height={160} fill="#FFFFFF" />
            {mouthsOpen.flatMap((m, i) => m.regions.map((d, k) => <path key={`${i}_${k}`} d={d} fill="#000000" />))}
          </mask>
        )}
      </defs>
      {/* 1. the cavity bed */}
      <path d={RAD_PATH} fill={gapCol} />
      {/* 2. the displaced fragments' vacated beds: the wedge's a cancellous floor, the articular fragments' deep */}
      {moving.map((f) => (
        <g key={`bed${f}`} clipPath={`url(#${ids.rad})`}>
          <g clipPath={`url(#${clipOf[f]})`}>
            {f === 'wedge' ? <Bed px={px} view={view} k={1} /> : <ArtBed f={f} px={px} view={view} />}
          </g>
        </g>
      ))}
      {/* 3-4. the static bone and its broken faces */}
      <g clipPath={disp ? `url(#${notWedge})` : undefined}>
        <BoneBody ids={ids} px={px} view={view} outlineClip={mouths} closeK={ss(remodel, 0.25, 0.9)} />
      </g>
      <g clipPath={`url(#${ids.rad})`}>
        <Faces arts={statArts} px={px} view={view} fade={fade} inkFade={inkFade} />
        {/* 5. the gaps: one dark union over the faces' inner edges and across every seam's mouth */}
        {fade > 0.001 && (
          <g>
            {(disp ? dispGaps(moving) : SEATED_GAPS).map((d, i) => <path key={i} d={d} fill={gapCol} />)}
            {px < 0.05 && (
              <g fill="none" stroke={C.marrow} strokeWidth={0.22} strokeLinecap="round" opacity={0.5 * fade * clamp((0.05 - px) / 0.015)}>
                {artK > 0 ? <g opacity={1 - artK}>{CORE_STATIC.map((d, i) => <path key={`m${i}`} d={d} />)}</g> : CORE_STATIC.map((d, i) => <path key={`m${i}`} d={d} />)}
                {dispK.wedge < 0.999 && <g opacity={1 - dispK.wedge}>{CORE_WEDGE.map((d, i) => <path key={`w${i}`} d={d} />)}</g>}
              </g>
            )}
          </g>
        )}
      </g>
      {/* where a seam opens onto the bone's edge, the gap colour runs across the outline (both fills share that edge,
          which would otherwise leave a light anti-aliasing hairline across the crack's mouth) */}
      {fade > 0.001 && (
        <g clipPath={`url(#${gapsUnion})`}>
          <path d={RAD_PATH} fill="none" stroke={gapCol} strokeWidth={3.6 * px} />
        </g>
      )}
      {/* 6. the displaced fragments in their current poses: hard cast shadows (all of them first, so one fragment's
          shadow never falls over another's body), then each one's exposed side wall, its body and faces */}
      {disp && (
        <g>
          {moving.map((f) => {
            const L = look(f);
            return (
              <g key={`sh${f}`} transform={`translate(${(-LIGHT.x * L.so).toFixed(4)} ${(-LIGHT.y * L.so).toFixed(4)}) ${xfOf(f)}`} opacity={0.55 * L.shadowK}>
                <g clipPath={`url(#${clipOf[f]})`}><path d={RAD_PATH} fill={SHADOW} /></g>
              </g>
            );
          })}
          {moving.map((f) => {
            const L = look(f);
            const wall = L.wall, wallK = L.wallK;
            const fArts = arts.filter((a) => a.frag === f);
            return (
              <g key={`fr${f}`}>
                {/* a contact shadow on the bed floor along the foot of the exposed side wall (a depth cue inside the
                    window, where the cast shadow may fall under the wound's rim). Clipped to the bed. */}
                {wall && (
                  <g clipPath={`url(#${ids.rad})`}>
                    <g clipPath={`url(#${clipOf[f]})`}>
                      <g transform={xfOf(f)} fill="none" stroke={SHADOW} strokeLinejoin="round" strokeLinecap="round">
                        <path d={wall.edge} strokeWidth={14 * px} opacity={0.2 * wallK} />
                        <path d={wall.edge} strokeWidth={6.5 * px} opacity={0.42 * wallK} />
                      </g>
                    </g>
                  </g>
                )}
                <g transform={xfOf(f)}>
                  {wall && (
                    <g clipPath={`url(#${ids.rad})`}>
                      <path d={wall.d} fill={mix(C.cancellous, C.boneDeep, 0.42)} />
                      {/* an articular fragment's two broken faces each lit or in shade by which way they face */}
                      {f !== 'wedge' && wall.faces.map((q, i) => (
                        <path key={`wf${i}`} d={q.d} fill={mix(C.cancellous, q.k > 0 ? C.boneLit : C.boneDeep, 0.12 + 0.4 * Math.abs(q.k))} />
                      ))}
                      <g fill={mix(C.cancellousPore, C.cavity, 0.3)} opacity={0.8}>
                        {wall.pores.map((q, i) => <circle key={i} cx={q.x} cy={q.y} r={q.r} />)}
                      </g>
                      <path d={wall.edge} fill="none" stroke={C.boneInk} strokeWidth={1.8 * px} strokeLinejoin="round" />
                    </g>
                  )}
                  <g clipPath={`url(#${clipOf[f]})`}>
                    <BoneBody ids={ids} px={px} view={viewW} shaft={false} />
                    <g clipPath={`url(#${ids.rad})`}>
                      {/* while it stands out of its bed its broken side wall shows instead of the chamfer */}
                      <Faces arts={fArts} px={px} view={viewW} fade={fade * (1 - 0.75 * wallK)} inkFade={inkFade} />
                    </g>
                  </g>
                </g>
              </g>
            );
          })}
        </g>
      )}
      {/* 7. the glue */}
      <Glue st={st} runs={runs} radClip={glueRad} glueClip={glueClip} view={view} lineFade={inkFade} rimMask={mouthsOpen.length > 0 ? rimMask : undefined}
        rimExtra={glueRad !== ids.rad ? (
          <>
            {clipMov.map((f) => (
              <g key={f} transform={xfOf(f)}>
                <g clipPath={`url(#${clipOf[f]})`}><path d={RAD_PATH} fill="none" stroke={C.boneInk} strokeWidth={2.6 * px} /></g>
              </g>
            ))}
            {mouthsOpen.map((m, i) => <path key={`ml${i}`} d={m.line} fill="none" stroke={C.boneInk} strokeWidth={2.6 * px} strokeLinecap="round" />)}
          </>
        ) : undefined} />
    </g>
  );
};
