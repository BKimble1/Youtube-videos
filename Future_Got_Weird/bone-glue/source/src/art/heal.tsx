// V2 (B2): healing, where new bone replaces the glue. World millimetres at depth 0, drawn right after FractureBone
// (art/fracture.tsx) in the same layer, so everything here lies ON TOP of the bone and the glue. Back to front:
//   1. the soft lining: grey-pink fibrous tissue on the lips of every broken face (soft), turning to pale woven bone
//      (hard), taken over by the new bone (bridge) and absorbed (remodel). One band per face over the seam's whole
//      length, kept out of every seam's gap by a mask, so it wraps the fragments' corners and never pokes into a
//      neighbouring seam's glue.
//   2. THE NEW BONE in the seams. Its region is exactly "the glued gaps minus the glue that is left": FractureBone thins
//      the glue by seams.growth() from each face, and this layer fills what the glue gave up, so the two can never
//      disagree (no dark gap, no overlap) and the T-junctions fill naturally from the fragments' corners. Pale, cool
//      woven bone (paler and greyer than the warm shaft) with a staggered lattice of pores elongated in the growth
//      direction and faint growth lines parallel to each face (fixed in the bone: the front uncovers them as it
//      passes), a bright rim with a deep-teal line along the front, and spicules that bud out of the front into the
//      glue and are overtaken by it, so the advance reads frame to frame. As the last glue goes the woven bone
//      densifies (its pores shrink from the old faces inward).
//      Remodelling: mature bone (the shaft's own shading, sheen, lamellae and pores) advances as one front per face. It
//      starts on the intact cortex just past the face's bevel, sweeps in across the bevel and the face line (by remodel
//      ~0.3), then narrows the pale woven band, still textured (unevenly, so it pinches into pale streaks); the fronts
//      meet around remodel 0.75. Only late (remodel 0.25-0.7) does the woven bone left between them tone down to a
//      shade just darker than the shaft, so the last thin line is never lighter than the bone around it; it closes to a
//      faint trace (remodel 0.55-0.9). At remodel 1 nothing of the woven layer is drawn.
//   3. the fracture hematoma (hem): a dark clot hugging the seams' lips and spilling at the exits; each layer is one
//      opaque union under a single group opacity, and none of it covers the glue (it stays teal)
//   4. the callus cuff at the margins (where the seams leave the bone's borders): soft grey-pink and fibrous, hardening
//      into woven bone (pale on the lit ulnar border, held to the shaft's shade on the radial one), then slimming back
//      to the shaft's outline. Clipped to outside the radius: it never crosses the bone or the glue.
// Ink widths are in screen pixels via st.px. Deterministic; no filters; masks bounded to the fracture's neighbourhood.
import React from 'react';
import {P, add, closed, len, mul, nrm, open, perp, poly, pt, sub} from '../core/geo';
import {mix} from '../core/color';
import {uid} from '../core/ids';
import {clamp, hash, noise1, ss} from '../lib';
import {C} from './palette';
import {RADIUS, radiusEdges} from './anatomy';
import {
  SEAM_IDS, S_C2_ON_C1, S_C3_ON_C1, SeamId, WEDGE_SEATED, WedgeX, growth, isWedgeSide, seamEdge, seamEdgeLine, seamEdgeSeated, seamGap, seamLength,
  seamNearest, seamNormal, seamPoint, xfPoint,
} from './seams';
import {GlueRun, glueOver, glueRuns} from './fracture';
import {BoneState2} from '../v2state';

type View = [number, number, number, number];
const RAD_PATH = closed(RADIUS, 0.55);
const LEN: Record<SeamId, number> = {C1: seamLength('C1'), C2: seamLength('C2'), C3: seamLength('C3')};
const SEED: Record<SeamId, number> = {C1: 1, C2: 2, C3: 3};
/** the fracture's neighbourhood (world mm): masks and base fills are bounded to it */
const ZONE: View = [-17, -33, 18, 15];
/** a seam's full drawn range: C1 runs out past both borders; C2 and C3 start on C1's centreline */
const S_FULL0: Record<SeamId, number> = {C1: -0.8, C2: 0, C3: 0};
const sFull1 = (id: SeamId) => LEN[id] + 0.8;
const STEP = 0.08;

// ---------------------------------------------------------------- colours (module-local)
type Stops = [number, string][];
/** woven bone: paler and cooler than the shaft at every point of the same light-to-shade ramp (a faintly grey-green
 *  off-white against the shaft's warm cream), so new bone reads as a different, newer material even on the lit side */
const WOVEN_STOPS: Stops = [
  [0, '#FCFDFB'],
  [0.3, '#F7F8F5'],
  [0.58, '#EEF0EB'],
  [0.8, '#DEDFD8'],
  [0.93, '#D0D0C8'],
  [1, '#CBC6C6'],
];
/** the shaft's own shading (fracture.tsx SHADE_STOPS, same vector and stops), for remodelled bone */
const SHAFT_STOPS: Stops = [
  [0, C.boneLit],
  [0.3, mix(C.boneLit, C.bone, 0.55)],
  [0.58, C.bone],
  [0.8, C.boneShade],
  [0.93, mix(C.boneShade, C.boneDeep, 0.35)],
  [1, mix(C.boneShade, '#B8A7B4', 0.4)],
];
/** what the woven bone between the maturing fronts turns into: a shade just darker than the shaft (a closing seam) */
const SEAM_STOPS: Stops = SHAFT_STOPS.map(([o, c]) => [o, mix(c, C.boneDeep, 0.13)]);
const stopAt = (stops: Stops, o: number): string => {
  for (let i = 0; i < stops.length - 1; i++) {
    const [o0, c0] = stops[i], [o1, c1] = stops[i + 1];
    if (o <= o1) return mix(c0, c1, clamp((o - o0) / (o1 - o0 || 1)));
  }
  return stops[stops.length - 1][1];
};
const OFFS = [0, 0.15, 0.3, 0.45, 0.58, 0.7, 0.8, 0.88, 0.93, 1];
const blendStops = (a: Stops, b: Stops, k: number): Stops => OFFS.map((o) => [o, mix(stopAt(a, o), stopAt(b, o), k)]);
const WOVEN_SH = stopAt(WOVEN_STOPS, 0.85);
/** the woven lattice's pores and growth lines: cool mauve-greys (the shaft's own pores are warm tan) */
const PORE = '#C7C0C6';
const PORE_DEEP = '#A99FA8';
/** the shaft's own vascular pores (fracture.tsx Pores), for the remodelled bone */
const PORE_SHAFT = mix(C.cancellousPore, C.boneShade, 0.25);
const GROWTH_LINE = '#CEC9CD';
const RIM = '#FFFFFF';
/** the front's fine line sits against the glue: a deep teal, so even a thin last island still reads as glue */
const RIM_INK = mix(C.glueDeep, C.glueInk, 0.55);
const HEM_DEEP = mix(C.hematoma, '#22040A', 0.45);
// soft callus: grey-pink (warmer than a lilac), its shade and fibres
const SOFT = mix(C.softCallus, '#D2AEB4', 0.45);
const SOFT_LIT = mix(C.softCallusLit, '#F0DCDD', 0.4);
const SOFT_SH = '#A88F99';
const SOFT_PINK = mix(C.softCallus, '#D9A3B0', 0.35);
const SOFT_FIB = '#8E7381';
const SOFT_INK = '#5E4B5C';
// hard callus (woven bone) on each border: near-white only on the lit ulnar cuff; on the shaded radial border the tones
// are held to the shaft's local shade (cooled to the woven bone's cast)
const HARD_SH = mix(C.newBone, C.boneShade, 0.45);
const HARD_RAD = mix(mix(mix(HARD_SH, C.newBone, 0.35), WOVEN_SH, 0.4), C.boneShade, 0.22);
const HARD_RAD_OUT = mix(mix(C.boneShade, C.boneDeep, 0.2), '#BDB8AC', 0.25);
const HARD_ULN = stopAt(WOVEN_STOPS, 0.3);
const HARD_ULN_LIT = '#FFFFFF';

const Grad: React.FC<{id: string; stops: Stops}> = ({id, stops}) => (
  <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={-14} y1={-6} x2={16} y2={4}>
    {stops.map(([o, c], i) => <stop key={i} offset={o} stopColor={c} />)}
  </linearGradient>
);
/** fracture.tsx's sheen over the lit half of the shaft (so remodelled bone matches the shaft there too) */
const Sheen: React.FC<{id: string}> = ({id}) => (
  <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={-13} y1={0} x2={-2} y2={0}>
    <stop offset={0} stopColor="#FFFFFF" stopOpacity={0} />
    <stop offset={0.35} stopColor="#FFFFFF" stopOpacity={0.5} />
    <stop offset={0.6} stopColor="#FFFFFF" stopOpacity={0.12} />
    <stop offset={1} stopColor="#FFFFFF" stopOpacity={0} />
  </linearGradient>
);

// ---------------------------------------------------------------- geometry helpers
const sample = (s0: number, s1: number, step = STEP): number[] => {
  const n = Math.max(1, Math.ceil(Math.abs(s1 - s0) / step));
  const out: number[] = [];
  for (let i = 0; i <= n; i++) out.push(s0 + ((s1 - s0) * i) / n);
  return out;
};
/** the gap between a seam's two current faces over [s0, s1], widened `ext` mm past each face (negative: narrowed) */
const gapPoly = (id: SeamId, s0: number, s1: number, w: WedgeX, ext: number, step = STEP): P[] => {
  const ss_ = sample(s0, s1, step);
  const lo = ss_.map((s) => seamEdge(id, s, -1, w, ext));
  const hi = ss_.map((s) => seamEdge(id, s, 1, w, ext));
  return [...lo, ...hi.reverse()];
};
/** every seam's whole gap (C1 past both borders, the branches from C1's centreline), widened by ext */
const allGaps = (w: WedgeX, ext: number): string[] => SEAM_IDS.map((id) => poly(gapPoly(id, S_FULL0[id], sFull1(id), w, ext, 0.12)));
/** one face's band from out = o0 to out = o1(s) (positive out = into the fragment, negative = into the gap) */
const faceBand = (id: SeamId, s0: number, s1: number, side: 1 | -1, w: WedgeX, o0: (s: number) => number, o1: (s: number) => number, step = STEP): P[] => {
  const ss_ = sample(s0, s1, step);
  const a = ss_.map((s) => seamEdge(id, s, side, w, o0(s)));
  const b = ss_.map((s) => seamEdge(id, s, side, w, o1(s)));
  return [...a, ...b.reverse()];
};
/** the glue's outline exactly as fracture.tsx draws it (its runOutline 'outer': the band plus rounded span ends) */
const capPts = (p1: P, p2: P, tOut: P, k = 1): P[] => {
  const c = {x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2};
  const r = len(sub(p1, p2)) / 2;
  const u = nrm(sub(p1, c));
  const out: P[] = [];
  for (let j = 1; j < 9; j++) {
    const a = (j / 9) * Math.PI;
    out.push(add(c, add(mul(u, Math.cos(a) * r), mul(tOut, Math.sin(a) * r * k))));
  }
  return out;
};
const tEnd = (r: GlueRun, end: 'a' | 'b'): P => {
  const n = r.s.length - 1;
  const m = (i: number) => ({x: (r.lo[i].x + r.hi[i].x) / 2, y: (r.lo[i].y + r.hi[i].y) / 2});
  return end === 'b' ? nrm(sub(m(n), m(Math.max(0, n - 2)))) : nrm(sub(m(0), m(Math.min(n, 2))));
};
const glueOutline = (r: GlueRun): P[] => {
  const n = r.lo.length - 1;
  const capB = r.capB ? capPts(r.lo[n], r.hi[n], tEnd(r, 'b'), 0.9) : [];
  const capA = r.capA ? capPts(r.hi[0], r.lo[0], tEnd(r, 'a'), 0.9) : [];
  return [...r.lo, ...capB, ...[...r.hi].reverse(), ...capA];
};
type Span = {a: number; b: number} | null;
const spanOf = (st: BoneState2, id: SeamId): Span => {
  const g = st.glue[id];
  if (!g || g.b - g.a < 0.03) return null;
  return {a: Math.max(-0.5, g.a), b: Math.min(LEN[id] + 0.6, g.b)};
};
/** the parts of a seam's full range: the glued span (stretched to the seam's ends when it reaches them) and the
 *  unglued rest */
const partsOf = (id: SeamId, sp: Span): {glued: [number, number] | null; bare: [number, number][]} => {
  const f0 = S_FULL0[id], f1 = sFull1(id);
  if (!sp) return {glued: null, bare: [[f0, f1]]};
  const a = sp.a <= 0.01 ? f0 : sp.a, b = sp.b >= LEN[id] - 0.01 ? f1 : sp.b;
  const bare: [number, number][] = [];
  if (a > f0 + 0.01) bare.push([f0, a]);
  if (b < f1 - 0.01) bare.push([b, f1]);
  return {glued: [a, b], bare};
};
const inBox = (p: P, b: View, pad: number) => p.x > b[0] - pad && p.x < b[2] + pad && p.y > b[1] - pad && p.y < b[3] + pad;
/** a mask that is white over `box` except where `holes` lie (clipped to the radius when radClip is given) */
const HoleMask: React.FC<{id: string; box: View; holes: string[]; radClip?: string}> = ({id, box, holes, radClip}) => (
  <mask id={id} maskUnits="userSpaceOnUse" x={box[0]} y={box[1]} width={box[2] - box[0]} height={box[3] - box[1]}>
    <rect x={box[0]} y={box[1]} width={box[2] - box[0]} height={box[3] - box[1]} fill="#FFFFFF" />
    <g clipPath={radClip ? `url(#${radClip})` : undefined}>
      {holes.map((d, i) => <path key={i} d={d} fill="#000000" />)}
    </g>
  </mask>
);
const boxOf = (view: View, pad: number): View | null => {
  const b: View = [Math.max(view[0] - pad, ZONE[0]), Math.max(view[1] - pad, ZONE[1]), Math.min(view[2] + pad, ZONE[2]), Math.min(view[3] + pad, ZONE[3])];
  return b[2] > b[0] && b[3] > b[1] ? b : null;
};

// ---------------------------------------------------------------- the woven bone's lattice (fixed in the bone)
/** is this face real bone at s? (not where another seam's mouth opens through it: C1's upper face at C2's mouth, its
 *  lower face at C3's mouth, and the branch seams' first stretch inside C1's gap) */
const realFace = (id: SeamId, s: number, side: 1 | -1, pad = 0, mouths = true) => {
  if (id === 'C1') {
    if (!mouths) return true;
    if (side < 0 && Math.abs(s - S_C2_ON_C1) < 0.45 + pad) return false;
    if (side > 0 && Math.abs(s - S_C3_ON_C1) < 0.5 + pad) return false;
    return true;
  }
  return s > 0.55 + pad;
};
type Pore = {id: SeamId; side: 1 | -1; s: number; d: number; r: number; e: number; tilt: number; dark: boolean; row: number; c: P};
const PORES: Pore[] = (() => {
  const out: Pore[] = [];
  for (const id of SEAM_IDS) {
    const L = LEN[id];
    for (const side of [-1, 1] as const) {
      const seed = SEED[id] * 11 + (side > 0 ? 2 : 5);
      for (let row = 0; row < 4; row++) {
        const d0 = 0.085 + row * 0.115;
        const off = (row % 2) * 0.1;
        for (let s = S_FULL0[id] + off; s < L + 0.6; s += 0.2) {
          const h = (k: number) => hash(s * 13.71 + row * 3.13 + seed * 0.71 + k * 17.3);
          if (h(0) < 0.3) continue; // the lattice is irregular (woven), not a grid
          const sv = s + (h(1) - 0.5) * 0.08;
          const d = d0 + (h(2) - 0.5) * 0.045;
          if (!realFace(id, sv, side, 0.05, false)) continue;
          out.push({
            id, side, s: sv, d, row,
            r: 0.03 + 0.022 * h(3),
            e: 1.45 + 0.6 * h(4),
            tilt: (h(5) - 0.5) * 0.7,
            dark: h(6) > 0.7,
            c: seamEdgeSeated(id, sv, side, -d),
          });
        }
      }
    }
  }
  return out;
})();
/** the spicules on each front: fixed places along the seam; each buds out ahead of the front into the glue and is
 *  overtaken by it */
type Spur = {id: SeamId; side: 1 | -1; s: number; ph: number; hw: number; L: number; c: P};
const SPURS: Spur[] = (() => {
  const out: Spur[] = [];
  for (const id of SEAM_IDS) {
    for (const side of [-1, 1] as const) {
      const seed = SEED[id] * 7 + (side > 0 ? 1 : 3);
      for (let s = S_FULL0[id] + 0.15; s < LEN[id] + 0.5; s += 0.24) {
        const h = (k: number) => hash(s * 7.37 + seed * 1.93 + k * 11.1);
        const sv = s + (h(0) - 0.5) * 0.1;
        if (!realFace(id, sv, side, 0.15)) continue;
        out.push({id, side, s: sv, ph: h(1), hw: 0.05 + 0.03 * h(2), L: 0.065 + 0.06 * h(3), c: seamEdgeSeated(id, sv, side, 0)});
      }
    }
  }
  return out;
})();
/** how far past each face the remodelling starts: just beyond the outer edge of the fracture's bevel (its chamfer
 *  strip is ~0.32 mm wide at the healing framings, up to ~0.36 with its edge line) */
const EXT0 = 0.42;
/** the mature (remodelled) bone's front on one face, for remodel progress r, as mm from the face into the gap
 *  (negative: still out over the face's bevel). ONE front per face: it starts at EXT0 out on the intact cortex, sweeps
 *  across the bevel and the face line (by r ~0.3), then on into the pale woven bone, which visibly narrows. Each face
 *  has its own uneven speed, so the two fronts meet around r 0.75 (earlier where both are fast: the pale band pinches
 *  into streaks first); a closing term makes sure both sides together cover the whole gap by r = 1. */
const matured = (id: SeamId, s: number, r: number, side: 1 | -1): number => {
  if (r <= 0) return -EXT0;
  const g = seamGap(id, s);
  const seed = SEED[id] * 23 + (side > 0 ? 4 : 9);
  const k = 0.7 + 0.6 * (0.5 + 0.5 * noise1(s * 0.48 + seed, seed));
  const own = r * 1.25 * k * g * 0.5 + 0.03 * Math.sin(s * 6.1 + seed) * r * (1 - r);
  const into = clamp(Math.max(own, 0.5 * g * ss(r, 0.7, 1)), 0, g);
  // the bevel is crossed first, a little sooner where this face is the faster one
  const over = EXT0 * (1 - ss(r * (0.8 + 0.2 * k), 0, 0.3));
  return into - over;
};

/** the woven bone left between a seam's two maturing fronts (inset(side, s) mm from each face), as polygons: one per
 *  stretch where the fronts have not met */
const remnant = (id: SeamId, w: WedgeX, inset: (side: 1 | -1, s: number) => number): string[] => {
  const out: string[] = [];
  let lo: P[] = [], hi: P[] = [];
  const flush = () => {
    if (lo.length > 1) out.push(poly([...lo, ...[...hi].reverse()]));
    lo = []; hi = [];
  };
  for (const s of sample(S_FULL0[id], sFull1(id), 0.08)) {
    const im = inset(-1, s), ip = inset(1, s);
    if (im + ip >= seamGap(id, s) - 0.004) { flush(); continue; }
    lo.push(seamEdge(id, s, -1, w, -im));
    hi.push(seamEdge(id, s, 1, w, -ip));
  }
  flush();
  return out;
};

/** the four fragment corners where a branch seam leaves C1 (each a point of bone jutting into the glued gap). New bone
 *  grows square off each face, so the two bands leave a notch of glue that runs to a sharp teal point at the tip; the
 *  round join a real offset would have (a disc of the growth's radius about the tip) is drawn over it. */
type Corner = {a: SeamId; sa: number; sideA: 1 | -1; b: SeamId; sb: number; sideB: 1 | -1; p: P};
const CORNERS: Corner[] = (() => {
  const out: Corner[] = [];
  const segX = (a: P, b: P, c: P, d: P): P | null => {
    const r = sub(b, a), q = sub(d, c);
    const den = r.x * q.y - r.y * q.x;
    if (Math.abs(den) < 1e-12) return null;
    const ac = sub(c, a);
    const u = (ac.x * q.y - ac.y * q.x) / den, v = (ac.x * r.y - ac.y * r.x) / den;
    return u >= 0 && u <= 1 && v >= 0 && v <= 1 ? add(a, mul(r, u)) : null;
  };
  const defs: {b: SeamId; sideA: 1 | -1; sideB: 1 | -1; sJ: number}[] = [
    {b: 'C2', sideA: -1, sideB: -1, sJ: S_C2_ON_C1}, {b: 'C2', sideA: -1, sideB: 1, sJ: S_C2_ON_C1},
    {b: 'C3', sideA: 1, sideB: 1, sJ: S_C3_ON_C1}, {b: 'C3', sideA: 1, sideB: -1, sJ: S_C3_ON_C1},
  ];
  for (const d of defs) {
    const A = seamEdgeLine('C1', d.sJ - 2.5, d.sJ + 2.5, d.sideA);
    const B = seamEdgeLine(d.b, 0, 3, d.sideB);
    let p: P | null = null;
    for (let i = 0; i < A.length - 1 && !p; i++) for (let j = 0; j < B.length - 1 && !p; j++) p = segX(A[i], A[i + 1], B[j], B[j + 1]);
    if (p) out.push({a: 'C1', sa: seamNearest('C1', p), sideA: d.sideA, b: d.b, sb: seamNearest(d.b, p), sideB: d.sideB, p});
  }
  return out;
})();

// ---------------------------------------------------------------- 1. the soft lining on the lips
const Lining: React.FC<{st: BoneState2; view: View}> = ({st, view}) => {
  const h = st.heal;
  const px = st.px;
  // it forms on the faces' lips before any bone, and is taken over by the woven bone as the fronts set off; at wide
  // framings it fades back (a few pixels of grey-pink beside the glue would read as a second outline)
  const a = clamp(h.soft * 1.2) * (1 - ss(h.bridge, 0.04, 0.3)) * (1 - ss(h.remodel, 0, 0.7)) * (1 - 0.8 * ss(px, 0.034, 0.06));
  if (a < 0.01) return null;
  const box = boxOf(view, 1);
  if (!box) return null;
  const hard = clamp(h.hard);
  const col = mix(SOFT_PINK, C.newBone, hard);
  const lit = mix(C.softCallusLit, '#FFFFFF', hard);
  const w = st.wedge;
  const maskId = uid('hl_lm');
  const bands: string[] = [];
  const lips: string[] = [];
  const fib: React.ReactNode[] = [];
  const fibA = (1 - hard) * clamp((0.045 - px) / 0.015);
  const grow = clamp(h.soft * 1.2);
  for (const id of SEAM_IDS) {
    const f0 = S_FULL0[id], f1 = sFull1(id);
    for (const side of [-1, 1] as const) {
      const seed = SEED[id] * 5 + (side > 0 ? 1 : 2);
      // from the face (the mask trims it exactly there: never into any seam's gap) over the face's bevel onto the fragment
      const wl = (s: number) => grow * (0.25 + 0.06 * (0.5 + 0.5 * noise1(s * 0.9 + seed, seed)));
      // only the stretch in view (the band runs on across other seams' mouths: the mask removes it there)
      const ss_ = sample(f0, f1, 0.12).filter((s) => inBox(seamEdge(id, s, side, w, 0), box, 1.5));
      if (ss_.length < 2) continue;
      const s0 = ss_[0], s1 = ss_[ss_.length - 1];
      bands.push(poly(faceBand(id, s0, s1, side, w, () => -0.08, wl, 0.12)));
      // its light outer lip only along real faces, stopping short of the corners (where it would cross a neighbour's band)
      let run: P[] = [];
      for (const s of sample(s0, s1, 0.12)) {
        if (realFace(id, s, side, 0.55)) run.push(seamEdge(id, s, side, w, wl(s)));
        else { if (run.length > 2) lips.push(open(run, 0.5)); run = []; }
      }
      if (run.length > 2) lips.push(open(run, 0.5));
      if (fibA > 0.01) {
        // a few loose, curved fibres lying along the lip (not a hatch)
        for (let s = s0 + 0.15; s < s1 - 0.2; s += 0.32 + 0.3 * hash(s * 5.7 + seed)) {
          if (!realFace(id, s, side, 0.2)) continue;
          const hh = hash(s * 3.3 + seed);
          const L = 0.18 + 0.14 * hh;
          const o = (u: number) => 0.06 + (wl(s) - 0.1) * (0.25 + 0.5 * Math.sin(Math.PI * u) * (0.6 + 0.4 * hh));
          const ps = [0, 0.5, 1].map((u) => seamEdge(id, s + L * u, side, w, o(u)));
          fib.push(<path key={`${id}${side}_${s.toFixed(3)}`} d={open(ps, 0.8)} />);
        }
      }
    }
  }
  return (
    <g>
      <defs>
        <HoleMask id={maskId} box={box} holes={allGaps(w, 0)} />
      </defs>
      <g mask={`url(#${maskId})`} opacity={a}>
        {/* one opaque union (no overlaps compounding where the bands meet at a fragment's corner) */}
        <g opacity={0.84}>{bands.map((d, i) => <path key={i} d={d} fill={col} />)}</g>
        <g fill="none" stroke={lit} strokeWidth={1.2 * px} opacity={0.7 * (1 - ss(px, 0.03, 0.045))}>
          {lips.map((d, i) => <path key={i} d={d} />)}
        </g>
        {fib.length > 0 && <g fill="none" stroke={SOFT_FIB} strokeWidth={1.1 * px} strokeLinecap="round" opacity={0.35 * fibA}>{fib}</g>}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- 2a. the shaft's own surface on remodelled bone
// fracture.tsx BoneBody's lamellae, articular rim, vascular pores, lit ulnar edge and outline, with the same constants
// and placement (keep in step with it): where the mature bone covers the old gap and faces they carry straight on, so a
// healed seam is not a smooth, pore-free band and the bone's outline closes at full weight across its mouths
const LAMELLAE = Array.from({length: 7}, (_, k) => {
  const xk = -9 + k * 3.0 + 0.6 * hash(k * 2.2);
  const yTop = -14 + 6 * hash(k * 5.1), yBot = 60 + 40 * hash(k * 1.3);
  return open([pt(xk, yTop), pt(xk * 0.92 + 0.2, (yTop + yBot) / 2), pt(xk * 0.78, yBot)], 0.6);
});
const ARTIC = open(RADIUS.slice(0, 9), 0.55);
const ULNAR_LIT = open(RADIUS.slice(37), 0.55);
/** the seams' seated gaps as one path (fracture.tsx SEATED_GAPS): where the outline is broken until it closes */
const MOUTHS = SEAM_IDS.map((id) => poly(gapPoly(id, S_FULL0[id], sFull1(id), WEDGE_SEATED, -0.01, 0.06))).join(' ');
/** the pore grid's cells (fracture.tsx Pores: 0.5 mm) near the seams: the only ones remodelled bone can cover */
const PO_CELL = 0.5;
const NEAR_CELLS: [number, number][] = (() => {
  const seen = new Set<string>();
  const out: [number, number][] = [];
  const R = 1.6;
  for (const id of SEAM_IDS) {
    for (const s of sample(S_FULL0[id], sFull1(id), 0.2)) {
      const p = seamPoint(id, s);
      for (let gx = Math.floor((p.x - R) / PO_CELL); gx <= Math.ceil((p.x + R) / PO_CELL); gx++) {
        for (let gy = Math.floor((p.y - R) / PO_CELL); gy <= Math.ceil((p.y + R) / PO_CELL); gy++) {
          const k = `${gx}_${gy}`;
          if (!seen.has(k)) { seen.add(k); out.push([gx, gy]); }
        }
      }
    }
  }
  return out;
})();
const ShaftDetail: React.FC<{px: number; box: View; closeK: number; mouths: string; gaps: string}> = ({px, box, closeK, mouths, gaps}) => {
  const pores: React.ReactNode[] = [];
  if (px <= 0.036) {
    for (const [gx, gy] of NEAR_CELLS) {
      if (hash(gx * 91.7 + gy * 13.3) > 0.34) continue;
      const x = (gx + 0.15 + 0.7 * hash(gx * 3.1 + gy * 7.7)) * PO_CELL, y = (gy + 0.15 + 0.7 * hash(gx * 5.3 + gy * 2.9)) * PO_CELL;
      if (!inBox(pt(x, y), box, 0.2)) continue;
      const rr = (0.019 + 0.02 * hash(gx * 1.7 + gy * 9.1)) * (0.62 + 0.38 * ss(px, 0.008, 0.024));
      pores.push(<ellipse key={`${gx}_${gy}`} cx={x} cy={y} rx={rr} ry={rr * (2.1 + 1.3 * hash(gx * 4.1 + gy * 0.7))} />);
    }
  }
  const ink = 2.6 * px;
  return (
    <>
      <g fill="none" stroke={C.boneShade} strokeWidth={1.3 * px} opacity={0.08 + 0.24 * clamp((px - 0.012) / 0.02)}>
        {LAMELLAE.map((d, k) => <path key={k} d={d} />)}
      </g>
      <path d={ARTIC} stroke="#EEF3F2" strokeWidth={1.6} fill="none" opacity={0.9} />
      {pores.length > 0 && <g fill={PORE_SHAFT} opacity={(0.3 + 0.24 * ss(px, 0.008, 0.024)) * clamp((0.036 - px) / 0.012)}>{pores}</g>}
      <path d={ULNAR_LIT} stroke={C.boneLit} strokeWidth={Math.max(0.12, 6 * px)} fill="none" opacity={0.5} transform="translate(0.5 0)" />
      <path d={RAD_PATH} fill="none" stroke={C.boneInk} strokeWidth={ink} strokeLinejoin="round" clipPath={`url(#${mouths})`} />
      {closeK > 0.001 && (
        <g clipPath={`url(#${gaps})`}>
          <path d={RAD_PATH} fill="none" stroke={C.boneInk} strokeWidth={ink} strokeLinejoin="round" opacity={closeK} />
        </g>
      )}
    </>
  );
};

// ---------------------------------------------------------------- 2. the new bone in the seams
const NewBone: React.FC<{st: BoneState2; view: View; radClip: string}> = ({st, view, radClip}) => {
  const h = st.heal;
  const bridge = clamp(h.bridge), rem = clamp(h.remodel);
  if (bridge <= 0) return null;
  const px = st.px, w = st.wedge;
  const x0 = Math.max(view[0], ZONE[0]), y0 = Math.max(view[1], ZONE[1]), x1 = Math.min(view[2], ZONE[2]), y1 = Math.min(view[3], ZONE[3]);
  if (x1 <= x0 || y1 <= y0) return null;
  const box: View = [x0, y0, x1, y1];
  const ids = {
    mask: uid('hl_nb'), clip: uid('hl_gc'), glue: uid('hl_gl'), woven: uid('hl_wv'), shaft: uid('hl_sh'), sheen: uid('hl_sn'), mat: uid('hl_mt'),
    matW: uid('hl_mw'), notMat: uid('hl_nm'), fil: uid('hl_fl'), mouths: uid('hl_mo'), gaps: uid('hl_gp'),
  };
  // remodelling: the maturing fronts carry the change. Each starts on the intact cortex just past its face's bevel
  // (EXT0) and sweeps in across the bevel and the face line, then narrows the pale woven band; the woven bone left
  // between the fronts tones toward a shade just darker than the shaft only late (a first step as the last glue goes,
  // the rest over remodel 0.25-0.7, while the band is already narrow). Behind the fronts: the shaft's own shading and
  // surface detail, so no stale bevel or face line is left beside the closing seam
  const remod = rem > 0.001;
  const kSh = 0.28 * ss(bridge, 0.75, 1) + 0.72 * ss(rem, 0.25, 0.7);
  const ext = remod ? EXT0 : 0;
  // white: the region this layer covers (the gaps, past each face by ext while remodelling); white0: the gaps alone
  // (the woven bone, the spicules and the fillets never reach past a face)
  const white: string[] = [], white0: string[] = [], black: string[] = [], rimPaths: string[] = [];
  for (const id of SEAM_IDS) {
    const parts = partsOf(id, spanOf(st, id));
    if (parts.glued) {
      white0.push(poly(gapPoly(id, parts.glued[0], parts.glued[1], w, 0)));
      if (remod) white.push(poly(gapPoly(id, parts.glued[0], parts.glued[1], w, ext)));
    }
    // unglued stretches (not expected in the film): new bone grows from the faces into the open gap
    for (const [s0, s1] of parts.bare) {
      for (const side of [-1, 1] as const) {
        white0.push(poly(faceBand(id, s0, s1, side, w, () => 0, (s) => -growth(id, s, bridge, side))));
        if (remod) white.push(poly(faceBand(id, s0, s1, side, w, () => ext, (s) => -growth(id, s, bridge, side))));
        rimPaths.push(open(sample(s0, s1).map((s) => seamEdge(id, s, side, w, -growth(id, s, bridge, side))), 0));
      }
    }
    for (const r of glueRuns(id, st)) {
      const d = poly(glueOutline(r));
      black.push(d);
      rimPaths.push(d);
    }
  }
  const gapPx = 0.95 / px;
  const rk = clamp(gapPx / 26, 0.4, 1);
  // the front: a bright rim on the bone side and a deep-teal line on the glue's edge (bold enough that a thin last
  // island still reads as a teal shape on a phone)
  const rimW = 2.0 * px * rk, inkW = (1.4 + 0.8 * ss(bridge, 0.45, 0.8)) * px * rk;
  const rimA = 1 - ss(rem, 0, 0.4);
  const rimMM = rimW + inkW; // the rim's visible width inside the new bone
  // the woven bone densifies once the glue is going: its pores shrink, nearest the old faces first
  const dens = ss(bridge, 0.72, 1) + 0.5 * ss(rem, 0.1, 0.6);
  // the lattice: pores the front has reached (the mask hides the part still under glue)
  const poreA = clamp((0.055 - px) / 0.025) * (1 - kSh);
  const pores: React.ReactNode[] = [];
  if (poreA > 0.01) {
    for (let i = 0; i < PORES.length; i++) {
      const p = PORES[i];
      if (!inBox(p.c, box, 0.5)) continue;
      const g = seamGap(p.id, p.s);
      if (p.d > g * 0.6) continue;
      const gr = growth(p.id, p.s, bridge, p.side);
      const re = p.r * p.e;
      const open_ = ss(gr - p.d, 0.3 * re + rimMM, re + rimMM + 0.05);
      const k = open_ * (1 - 0.45 * clamp(dens * (1.25 - 0.3 * p.row)));
      if (k < 0.08) continue;
      const q = seamEdge(p.id, p.s, p.side, w, -p.d);
      const n = seamNormal(p.id, p.s);
      const ang = (Math.atan2(n.y, n.x) + p.tilt) * (180 / Math.PI);
      pores.push(
        <ellipse key={i} cx={q.x.toFixed(3)} cy={q.y.toFixed(3)} rx={(re * (0.45 + 0.55 * k)).toFixed(4)} ry={(p.r * k).toFixed(4)}
          transform={`rotate(${ang.toFixed(1)} ${q.x.toFixed(3)} ${q.y.toFixed(3)})`} fill={p.dark ? PORE_DEEP : PORE} />,
      );
    }
  }
  // incremental growth lines: once a front has passed depth D, a faint broken line parallel to its face (the bone is
  // laid down in layers), so the advance leaves a record of where the front has been
  const lineA = clamp((0.05 - px) / 0.02) * (1 - ss(rem, 0.1, 0.5));
  const glines: string[] = [];
  if (lineA > 0.01) {
    for (const id of SEAM_IDS) {
      for (const side of [-1, 1] as const) {
        for (const D of [0.13, 0.26, 0.39]) {
          let cur: P[] = [];
          const flush = () => {
            if (cur.length > 2) glines.push(open(cur, 0.5));
            cur = [];
          };
          for (const s of sample(S_FULL0[id], sFull1(id), 0.1)) {
            const q = seamEdge(id, s, side, w, -D);
            const ok = inBox(q, box, 0.3) && realFace(id, s, side, 0.1) && D < seamGap(id, s) * 0.5 && growth(id, s, bridge, side) > D + 0.05;
            if (ok) cur.push(q);
            else flush();
          }
          flush();
        }
      }
    }
  }
  // remodelling: the woven bone is what is left between the two maturing fronts of each seam (one strip per seam, so
  // at a T-junction the remnants meet as a T); everything else this layer covers is mature bone. A half-tone step of
  // woven bone ahead of each front, inside the gap.
  const strips: string[] = [], stripsWide: string[] = [];
  if (remod) {
    for (const id of SEAM_IDS) {
      strips.push(...remnant(id, w, (side, s) => matured(id, s, rem, side)));
      stripsWide.push(...remnant(id, w, (side, s) => matured(id, s, rem, side) - 0.05 * (1 - rem)));
    }
  }
  // spicules ahead of each front, budding into the glue from the first moment of bridging
  const spurs: string[] = [];
  // (they bud from the first moment of bridging and stop once the glue has broken into islands: a last island stays a
  // clean teal shape)
  const spurK = clamp(bridge / 0.04) * (1 - ss(bridge, 0.42, 0.6));
  if (px < 0.045 && spurK > 0.01) {
    const bud = spurK;
    for (const sp of SPURS) {
      if (!inBox(sp.c, box, 0.5)) continue;
      const g = seamGap(sp.id, sp.s);
      const gr = growth(sp.id, sp.s, bridge, sp.side), go = growth(sp.id, sp.s, bridge, (-sp.side) as 1 | -1);
      const room = g - gr - go;
      if (room < 0.17) continue;
      const u = (gr / 0.14 + sp.ph) % 1;
      const L = Math.min(sp.L * rk * (0.35 + 0.65 * Math.sin(Math.PI * u)) * bud * clamp((room - 0.16) / 0.16), 0.4 * (room - 0.04));
      if (L < 0.015) continue;
      const base = (ds: number) => seamEdge(sp.id, sp.s + ds, sp.side, w, -growth(sp.id, sp.s + ds, bridge, sp.side) + 0.05);
      // a short rounded spicule (a finger of woven bone), leaning a little one way or the other
      const lean = 0.35 * sp.hw * (sp.ph - 0.5) * 2;
      const at = (v: number, f: number) => seamEdge(sp.id, sp.s + v * sp.hw + lean * f, sp.side, w, -(gr + L * f));
      spurs.push(open([base(-sp.hw), at(-0.62, 0.45), at(-0.38, 0.85), at(0, 1), at(0.38, 0.85), at(0.62, 0.45), base(sp.hw)], 1));
    }
  }
  // the corner joins: a disc of woven bone about each fragment tip, the radius of the new bone on its two faces
  const fillets: {c: P; r: number}[] = [];
  if (bridge < 1 && black.length > 0) {
    for (const k of CORNERS) {
      const r = 0.5 * (growth(k.a, k.sa, bridge, k.sideA) + growth(k.b, k.sb, bridge, k.sideB));
      if (r < 0.025) continue;
      const wedge = isWedgeSide(k.a, k.sa, k.sideA) || isWedgeSide(k.b, k.sb, k.sideB);
      const c = wedge ? xfPoint(k.p, w) : k.p;
      if (inBox(c, box, 1)) fillets.push({c, r});
    }
  }
  const wovenStops = blendStops(WOVEN_STOPS, SEAM_STOPS, kSh);
  // once remodelling has started the mature bone always draws (everywhere outside the strips), and the woven bone only
  // inside the strips and the gaps (at remodel 1 there are no strips: the woven layer and its clips are skipped, never
  // drawn unclipped over the widened region)
  const wovenLeft = !remod || strips.length > 0;
  const halfLeft = remod && stripsWide.length > 0;
  const cover = remod ? white : white0;
  const R = (fill: string, op?: number) => <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={fill} opacity={op} />;
  const woven = (
    <>
      {R(`url(#${ids.woven})`)}
      {kSh > 0.01 && R(`url(#${ids.sheen})`, kSh)}
    </>
  );
  /** clipped to the woven bone that is left (and to the gaps: over the bevels the fracture's own face shows until the
   *  front has crossed it) */
  const inWoven = (k: string, node: React.ReactNode) => (remod ? (
    <g key={k} clipPath={`url(#${ids.gaps})`}><g clipPath={`url(#${ids.mat})`}>{node}</g></g>
  ) : <g key={k}>{node}</g>);
  return (
    <g clipPath={`url(#${radClip})`}>
      <defs>
        <Grad id={ids.woven} stops={wovenStops} />
        <Sheen id={ids.sheen} />
        <mask id={ids.mask} maskUnits="userSpaceOnUse" x={x0} y={y0} width={x1 - x0} height={y1 - y0}>
          {cover.map((d, i) => <path key={`w${i}`} d={d} fill="#FFFFFF" />)}
          {black.map((d, i) => <path key={`b${i}`} d={d} fill="#000000" />)}
        </mask>
        <clipPath id={ids.clip}>
          {white0.map((d, i) => <path key={i} d={d} />)}
        </clipPath>
        {(spurs.length > 0 || fillets.length > 0) && <clipPath id={ids.glue}>{black.map((d, i) => <path key={i} d={d} />)}</clipPath>}
        {fillets.length > 0 && (
          <mask id={ids.fil} maskUnits="userSpaceOnUse" x={x0} y={y0} width={x1 - x0} height={y1 - y0}>
            {fillets.map((f, i) => <circle key={i} cx={f.c.x} cy={f.c.y} r={f.r} fill="#FFFFFF" />)}
          </mask>
        )}
        {remod && (
          <>
            <Grad id={ids.shaft} stops={SHAFT_STOPS} />
            {/* the mature bone: everywhere this layer covers except the woven strips (over a bevel the strip shows the
                fracture's own face until the front has crossed it) */}
            <mask id={ids.notMat} maskUnits="userSpaceOnUse" x={x0} y={y0} width={x1 - x0} height={y1 - y0}>
              {R('#FFFFFF')}
              {strips.map((d, i) => <path key={i} d={d} fill="#000000" />)}
            </mask>
            <clipPath id={ids.gaps}>{white0.map((d, i) => <path key={i} d={d} />)}</clipPath>
            {/* the bone's outline: it runs on at full strength beside the mouths, and closes across them as the
                fracture's own outline does */}
            <clipPath id={ids.mouths}><path d={`M-400 -400H400V600H-400Z ${MOUTHS}`} clipRule="evenodd" /></clipPath>
          </>
        )}
        {remod && wovenLeft && <clipPath id={ids.mat}>{strips.map((d, i) => <path key={i} d={d} />)}</clipPath>}
        {halfLeft && <clipPath id={ids.matW}>{stripsWide.map((d, i) => <path key={i} d={d} />)}</clipPath>}
      </defs>
      <g mask={`url(#${ids.mask})`}>
        {remod && (
          <g mask={`url(#${ids.notMat})`}>
            {R(`url(#${ids.shaft})`)}
            {R(`url(#${ids.sheen})`)}
            <ShaftDetail px={px} box={box} closeK={ss(rem, 0.25, 0.9)} mouths={ids.mouths} gaps={ids.gaps} />
            {halfLeft && (
              <g clipPath={`url(#${ids.gaps})`}>
                <g clipPath={`url(#${ids.matW})`} opacity={0.5}>{woven}</g>
              </g>
            )}
          </g>
        )}
        {wovenLeft && inWoven('wv', (
          <>
            {woven}
            {pores.length > 0 && <g opacity={poreA}>{pores}</g>}
            {glines.length > 0 && (
              <g fill="none" stroke={GROWTH_LINE} strokeWidth={1.25 * px} strokeDasharray="0.26 0.08 0.4 0.11" strokeLinecap="round" opacity={0.8 * lineA}>
                {glines.map((d, i) => <path key={i} d={d} />)}
              </g>
            )}
          </>
        ))}
        {rimA > 0.01 && rimPaths.length > 0 && (
          <g fill="none" strokeLinejoin="round" opacity={rimA}>
            {rimPaths.map((d, i) => <path key={`r${i}`} d={d} stroke={RIM} strokeWidth={2 * (rimW + inkW)} />)}
            {rimPaths.map((d, i) => <path key={`k${i}`} d={d} stroke={RIM_INK} strokeWidth={2 * inkW} />)}
          </g>
        )}
      </g>
      {spurs.length > 0 && (
        <g clipPath={`url(#${ids.clip})`}>
          {/* the spicules' teal edge only where they stand in the glue, then their pale fill */}
          <g clipPath={`url(#${ids.glue})`} fill="none" stroke={RIM_INK} strokeWidth={2 * inkW} strokeLinejoin="round">
            {spurs.map((d, i) => <path key={i} d={d} />)}
          </g>
          {spurs.map((d, i) => <path key={`f${i}`} d={d} fill={RIM} />)}
        </g>
      )}
      {fillets.length > 0 && (
        <g clipPath={`url(#${ids.clip})`}>
          {/* the fillet's edge only where it stands in the glue (a teal line, as along every front), then its fill */}
          <g clipPath={`url(#${ids.glue})`} fill="none" stroke={RIM_INK} strokeWidth={2 * inkW}>
            {fillets.map((f, i) => <circle key={i} cx={f.c.x} cy={f.c.y} r={f.r} opacity={clamp((f.r - 0.025) / 0.04)} />)}
          </g>
          {/* (during remodelling only inside the woven bone that is left: never a pale disc over the mature bone) */}
          {wovenLeft && inWoven('fl', <g mask={`url(#${ids.fil})`}>{woven}</g>)}
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------- 2b. the faint trace a healed seam leaves
const TRACES: string[] = SEAM_IDS.map((id) =>
  open(sample(id === 'C1' ? -0.5 : 0.5, LEN[id] + 0.5, 0.1).map((s) => seamEdgeSeated(id, s, 1, -seamGap(id, s) / 2)), 0.5));
const Trace: React.FC<{st: BoneState2; radClip: string}> = ({st, radClip}) => {
  const a = ss(st.heal.remodel, 0.55, 0.9);
  if (a < 0.01) return null;
  return (
    <g clipPath={`url(#${radClip})`} fill="none" stroke={C.boneShade} strokeWidth={1.3 * st.px} strokeLinecap="round" opacity={0.32 * a}>
      {TRACES.map((d, i) => <path key={i} d={d} />)}
    </g>
  );
};

// ---------------------------------------------------------------- 3. the hematoma
const EXITS: {id: SeamId; s: number}[] = [{id: 'C1', s: 0}, {id: 'C1', s: LEN.C1}, {id: 'C3', s: LEN.C3}, {id: 'C2', s: LEN.C2}];
const Hematoma: React.FC<{st: BoneState2; view: View; radClip: string}> = ({st, view, radClip}) => {
  const h = st.heal;
  const a = clamp(h.hem) * (1 - ss(h.soft, 0.15, 0.85));
  if (a < 0.01) return null;
  const box = boxOf(view, 3);
  if (!box) return null;
  const w = st.wedge, px = st.px;
  const maskId = uid('hl_hm');
  // the clot hugs the glue's outer edge (its wetted lip and edge ink) and never covers it
  const gO = glueOver(px) + 1.4 * px;
  // the clot spreads out from the seams as it forms
  const grow = 0.4 + 0.6 * clamp(h.hem);
  const halo: string[] = [], lips: string[] = [];
  for (const id of SEAM_IDS) {
    // the branch seams' clot starts at their real faces (where they leave C1's gap)
    const f0 = id === 'C1' ? -0.6 : 0.55, f1 = LEN[id] + 0.6;
    // a lumpy spread (slow swells plus a few clot lobes) so it reads as a soft clot, not a stroke
    const sp = (s: number, side: number) => {
      const seed = SEED[id] * 3 + side;
      const lobe = Math.max(0, noise1(s * 0.85 + seed * 3, seed + 11)) ** 2;
      return grow * (0.42 + 0.28 * (0.5 + 0.5 * noise1(s * 0.45 + seed, seed)) + 0.42 * lobe);
    };
    for (const side of [-1, 1] as const) {
      const ss_ = sample(f0, f1, 0.18).filter((s) => inBox(seamEdge(id, s, side, w, 0), box, 2));
      if (ss_.length < 2) continue;
      const s0 = ss_[0], s1 = ss_[ss_.length - 1];
      halo.push(closed(faceBand(id, s0, s1, side, w, () => gO - 0.02, (s) => gO + sp(s, side), 0.18), 0.6));
      lips.push(closed(faceBand(id, s0, s1, side, w, () => gO - 0.02, (s) => gO + 0.45 * sp(s, side), 0.18), 0.6));
    }
  }
  // where the seams leave the bone, the clot spills over the border: lumpy, not round
  const blob = (c: P, r: number, k: number, sc: number) => {
    const ps: P[] = [];
    for (let j = 0; j < 14; j++) {
      const an = (j / 14) * Math.PI * 2;
      const rr = r * sc * (0.78 + 0.34 * hash(k * 7.7 + j * 1.3));
      ps.push(pt(c.x + Math.cos(an) * rr * 0.75, c.y + Math.sin(an) * rr * 1.15));
    }
    return closed(ps, 0.8);
  };
  const blobs = EXITS.map((e, i) => ({c: seamPoint(e.id, e.s), r: (1.15 + 0.4 * hash(i * 3.3)) * grow, k: i})).filter((b) => inBox(b.c, box, 2.5));
  return (
    <g>
      <defs>
        {/* every seam's glued gap (with the glue's wetted lip and edge) is a hole: the glue stays clean teal */}
        <HoleMask id={maskId} box={box} holes={allGaps(w, gO)} radClip={radClip} />
      </defs>
      <g mask={`url(#${maskId})`} opacity={a}>
        {/* each layer: opaque fills under one opacity, so overlaps never compound into blotches */}
        <g opacity={0.32} fill={C.hematoma}>
          {blobs.map((b) => <path key={`x${b.k}`} d={blob(b.c, b.r, b.k, 1)} />)}
          {halo.map((d, i) => <path key={`h${i}`} d={d} />)}
        </g>
        <g opacity={0.3} fill={HEM_DEEP}>
          {lips.map((d, i) => <path key={`l${i}`} d={d} />)}
          {blobs.map((b) => <path key={`y${b.k}`} d={blob(b.c, b.r, b.k + 20, 0.6)} />)}
        </g>
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- 4. the callus cuff at the margins
type Lobe = {y: number; A: number; half: number};
type CuffSpec = {side: 1 | -1; y0: number; y1: number; B: number; lobes: Lobe[]; exits: number[]; seed: number};
/** radial border: a lumpy collar over both exits (C1 at y -1, C3 at y 9.6); ulnar border: over C1's exit (y 1.4) */
const CUFFS: CuffSpec[] = [
  {side: 1, y0: -6.8, y1: 15.2, B: 1.75, lobes: [{y: -0.6, A: 1, half: 5.6}, {y: 9.3, A: 0.92, half: 5.4}, {y: 4.4, A: 0.62, half: 8}], exits: [-1, 9.6], seed: 1},
  {side: -1, y0: -5.2, y1: 8.2, B: 1.6, lobes: [{y: 1.4, A: 1, half: 6.6}, {y: 3.4, A: 0.5, half: 4.2}], exits: [1.4], seed: 2},
];
const borderAt = (side: 1 | -1, y: number): {p: P; n: P} => {
  const x = radiusEdges(y)[side > 0 ? 1 : 0];
  const xa = radiusEdges(y - 0.3)[side > 0 ? 1 : 0], xb = radiusEdges(y + 0.3)[side > 0 ? 1 : 0];
  let n = nrm(perp(pt(xb - xa, 0.6)));
  if (n.x * side < 0) n = mul(n, -1);
  return {p: pt(x, y), n};
};
const Cuff: React.FC<{st: BoneState2; view: View}> = ({st, view}) => {
  const h = st.heal;
  const hard = clamp(h.hard), rem = clamp(h.remodel);
  // it swells with the soft callus, fills out a little as it hardens, consolidates as the last glue goes, and
  // remodelling slims it back
  const grow = clamp(0.85 * clamp(h.soft * 1.1) + 0.15 * hard) * (1 - 0.16 * ss(h.bridge, 0.75, 1)) * (1 - 0.94 * ss(rem, 0, 1));
  const op = 1 - ss(rem, 0.6, 1);
  if (grow < 0.01 || op < 0.01) return null;
  const px = st.px;
  const outside = uid('hl_out');
  const ink = mix(SOFT_INK, C.boneInk, hard);
  return (
    <g opacity={op}>
      <defs>
        {/* outside the radius only: the cuff never crosses the bone, its outline or the glue */}
        <clipPath id={outside}><path d={`M-400 -400H400V600H-400Z ${RAD_PATH}`} clipRule="evenodd" /></clipPath>
      </defs>
      <g clipPath={`url(#${outside})`}>
        {CUFFS.map((cf) => {
          if (cf.side < 0 && view[0] > -9) return null; // the ulnar border is off frame
          if (cf.side > 0 && view[2] < 9) return null;
          // tones: the radial cuff lies on the shaded border (held to the shaft's local shade once hard); the ulnar one
          // is lit
          const rad = cf.side > 0;
          const col = mix(rad ? mix(SOFT, HARD_RAD, hard) : mix(SOFT, HARD_ULN, hard), rad ? C.boneShade : C.bone, rem);
          const outerTone = rad ? mix(mix(SOFT_SH, HARD_RAD_OUT, hard), mix(C.boneShade, C.boneDeep, 0.2), rem) : mix(mix(SOFT_LIT, HARD_ULN_LIT, hard), C.boneLit, rem);
          const ys = sample(cf.y0, cf.y1, 0.3);
          const bump = (y: number) => {
            let f = 0;
            for (const l of cf.lobes) {
              const u = (y - l.y) / l.half;
              if (Math.abs(u) < 1) f = Math.max(f, l.A * (1 - u * u) ** 1.8);
            }
            return f * (1 + 0.12 * noise1(y * 0.8 + cf.seed * 5, cf.seed));
          };
          const B = (y: number) => cf.B * grow * bump(y);
          // the lit middle band narrows over the seams' exits (the glue meets the cuff's own tone there, not a band edge)
          const midK = (y: number) => {
            let t = 0;
            for (const e of cf.exits) t = Math.max(t, Math.exp(-(((y - e) / 0.9) ** 2)));
            return 0.5 * (1 - 0.55 * t);
          };
          const pts = ys.map((y) => borderAt(cf.side, y));
          // the inner edge runs a little inside the border (the clip trims it exactly to the bone's outline)
          const inner = pts.map((q) => add(q.p, mul(q.n, -0.3)));
          const outer = pts.map((q, i) => add(q.p, mul(q.n, B(ys[i]))));
          const mid = pts.map((q, i) => add(q.p, mul(q.n, B(ys[i]) * midK(ys[i]))));
          const fib: React.ReactNode[] = [];
          const fibA = (1 - hard) * clamp((0.06 - px) / 0.025);
          if (fibA > 0.01) {
            // short curved fibres rising from the border into the soft collar
            for (let k = 1; k < ys.length - 1; k += 2) {
              const y = ys[k], b = B(y);
              if (b < 0.3) continue;
              const q = pts[k];
              const t = pt(-q.n.y, q.n.x);
              const sw = (0.12 + 0.1 * hash(k * 1.7 + cf.seed)) * (k % 4 === 1 ? 1 : -1);
              const a0 = add(q.p, mul(q.n, 0.06));
              const a1 = add(add(q.p, mul(q.n, b * 0.3)), mul(t, sw * 0.6));
              const a2 = add(add(q.p, mul(q.n, b * (0.5 + 0.12 * hash(k * 2.3)))), mul(t, sw));
              fib.push(<path key={k} d={open([a0, a1, a2], 0.7)} />);
            }
          }
          const pores: React.ReactNode[] = [];
          const poreA = hard * (1 - rem) * clamp((0.06 - px) / 0.025);
          if (poreA > 0.01) {
            for (let k = 0; k < ys.length; k++) {
              const y = ys[k], b = B(y);
              if (b < 0.45) continue;
              for (let j = 0; j < 2; j++) {
                const hh = hash(k * 3.7 + j * 9.1 + cf.seed * 5.3);
                if (hh < 0.35) continue;
                const q = add(pts[k].p, mul(pts[k].n, b * (0.15 + 0.7 * hash(k * 1.3 + j * 4.1 + cf.seed))));
                const rr = 0.035 + 0.025 * hash(k * 2.9 + j);
                const ang = (Math.atan2(pts[k].n.y, pts[k].n.x) * 180) / Math.PI + 30 * (hash(k * 5.1 + j) - 0.5);
                pores.push(<ellipse key={`${k}_${j}`} cx={q.x} cy={q.y} rx={rr * 1.6} ry={rr} transform={`rotate(${ang.toFixed(1)} ${q.x} ${q.y})`} fill={hh > 0.85 ? PORE_DEEP : PORE} />);
              }
            }
          }
          return (
            <g key={cf.side}>
              <path d={poly([...inner, ...[...outer].reverse()])} fill={outerTone} />
              <path d={poly([...inner, ...[...mid].reverse()])} fill={col} />
              {fib.length > 0 && <g fill="none" stroke={SOFT_FIB} strokeWidth={1.1 * px} strokeLinecap="round" opacity={0.4 * fibA}>{fib}</g>}
              {pores.length > 0 && <g opacity={0.8 * poreA}>{pores}</g>}
              <path d={open(outer, 0.5)} fill="none" stroke={ink} strokeWidth={2.4 * px} strokeLinecap="round" />
            </g>
          );
        })}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- the layer
/** Healing over FractureBone (same depth-0 layer, world mm): draws nothing until st.heal has started. */
export const HealLayer: React.FC<{st: BoneState2; view: View}> = ({st, view}) => {
  const h = st.heal;
  if (h.hem <= 0 && h.soft <= 0 && h.bridge <= 0 && h.hard <= 0 && h.remodel <= 0) return null;
  const radClip = uid('hl_rad');
  return (
    <g>
      <defs>
        <clipPath id={radClip}><path d={RAD_PATH} /></clipPath>
      </defs>
      <g clipPath={`url(#${radClip})`}>
        <Lining st={st} view={view} />
      </g>
      <NewBone st={st} view={view} radClip={radClip} />
      <Trace st={st} radClip={radClip} />
      <Hematoma st={st} view={view} radClip={radClip} />
      <Cuff st={st} view={view} />
    </g>
  );
};
