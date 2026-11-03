// V2 (B1): the fractured distal radius and the adhesive IN its seams. World millimetres at depth 0 (anatomy.ts); the
// seam geometry, the moving wedge fragment and the glue band runs come from seams.ts. Back to front:
//   1. the cavity bed (a dark gap wherever no bone covers the radius' outline: an opened seam, the wedge's vacated bed)
//   2. the static bone (V1's cel-shaded radius: gradient lit from the upper left, sheen, lamellae, pores, outline ink)
//   3. each static fragment's broken face: a narrow cancellous chamfer (spongy interior, lit or in shade by which way
//      it faces) and a crisp bone-ink line on the face itself
//   4. the gaps of all three seams between their CURRENT faces, as one dark union (it hides any face line or chamfer
//      that runs across another seam's mouth, so junctions read as clean T's)
//   5. the wedge fragment, carried by xfSvg(st.wedge), with its own faces, outline and (when out of place) a cast shadow
//   6. the glue: per seam, the band between the two faces plus a slim meniscus over each; one inked union for every
//      seam (junctions merge), a deeper core where it fills the gap, lighter lips where it wets the faces, a fine gloss
//      line that settles to satin as it sets, a contact line keyed into both faces' pores at macro range, and a proud
//      glossy fresh tail ending in a rounded bulb where it leaves the cannula (both scaled by front.flow)
//   7. contact cues where the probe and the applicator tips touch the bone
// Line widths are in screen pixels via st.px (mm per pixel), so the ink is even at every zoom. Deterministic; no filters.
import React from 'react';
import {P, add, closed, lerpP, len, mul, nrm, open, poly, pt, sub} from '../core/geo';
import {mix} from '../core/color';
import {uid} from '../core/ids';
import {clamp, hash, noise1, ss} from '../lib';
import {C} from './palette';
import {RADIUS} from './anatomy';
import {
  S_C2_ON_C1, S_C3_ON_C1, SEAM_IDS, SeamId, WEDGE_POLY, WedgeX, glueBand, growth, isWedgeSide, seamEdge, seamEdgeSeated, seamLength,
  seamGap, seamNormal, xfSvg,
} from './seams';
import {BoneState2} from '../v2state';

type View = [number, number, number, number];
const LIGHT = nrm(pt(-0.62, -0.78)); // toward the key light (upper left)
const dotL = (n: P) => n.x * LIGHT.x + n.y * LIGHT.y;
const RAD_PATH = closed(RADIUS, 0.55);
const LEN: Record<SeamId, number> = {C1: seamLength('C1'), C2: seamLength('C2'), C3: seamLength('C3')};

/** the glue's wetting overhang past each face (mm): the same 0.14 the wet film (wet.tsx) and the oyster match use */
export const GLUE_OVER = 0.14;
/** how much prouder (mm per side) the freshly laid gel stands near the applicator tip */
const PROUD = 0.075;
/** the fresh zone behind the tip (mm along the seam) */
const FRESH_MM = 1.6;
/** the glue's minimum on-screen width (px) at wide framings */
const MIN_GLUE_PX = 5.5;
/** contact cue radii (mm): probe tip, applicator cannula tip (1.3 mm cannula) */
const PRESS_R = 0.95, APP_R = 0.8;

// module-local colours
const GAP = C.cavity;
const LIP = mix(C.glue, C.glueLit, 0.4);
const CORE = mix(C.glue, C.glueDeep, 0.16);

// ---------------------------------------------------------------- the broken faces (seated geometry, precomputed)
type Face = {id: SeamId; side: 1 | -1; s0: number; s1: number; wedge: boolean};
const FACES: Face[] = [
  {id: 'C1', side: -1, s0: -0.8, s1: LEN.C1 + 0.8, wedge: false},
  {id: 'C1', side: 1, s0: -0.8, s1: S_C3_ON_C1, wedge: false},
  {id: 'C1', side: 1, s0: S_C3_ON_C1, s1: LEN.C1 + 0.8, wedge: true},
  {id: 'C2', side: -1, s0: 0, s1: LEN.C2 + 0.8, wedge: false},
  {id: 'C2', side: 1, s0: 0, s1: LEN.C2 + 0.8, wedge: false},
  {id: 'C3', side: 1, s0: 0, s1: LEN.C3 + 0.8, wedge: false},
  {id: 'C3', side: -1, s0: 0, s1: LEN.C3 + 0.8, wedge: true},
];
const SEED: Record<SeamId, number> = {C1: 1, C2: 2, C3: 3};
type FaceArt = {
  face: Face;
  band: string; // the cancellous chamfer just inside the face
  rim: string; // where the chamfer meets the intact surface
  line: string; // the broken face itself
  lit: boolean;
  tone: string;
  pores: {x: number; y: number; rx: number; ry: number}[];
};
const FACE_ART: FaceArt[] = FACES.map((f) => {
  const STEP = 0.08;
  const n = Math.max(1, Math.ceil((f.s1 - f.s0) / STEP));
  const inner: P[] = [], outer: P[] = [];
  const seed = SEED[f.id] * 7 + (f.side > 0 ? 1 : 4);
  const wAt = (s: number) => 0.27 * (0.72 + 0.4 * (0.5 + 0.5 * noise1(s * 1.15 + seed, seed)) + 0.12 * Math.sin(s * 5.3 + seed));
  for (let i = 0; i <= n; i++) {
    const s = f.s0 + ((f.s1 - f.s0) * i) / n;
    inner.push(seamEdgeSeated(f.id, s, f.side, -0.03));
    outer.push(seamEdgeSeated(f.id, s, f.side, wAt(s)));
  }
  // the chamfer tilts from the intact surface down into the gap: it faces -side * n
  const nm = seamNormal(f.id, (Math.max(0, f.s0) + Math.min(LEN[f.id], f.s1)) / 2);
  const k = dotL(mul(nm, -f.side));
  const lit = k > 0;
  const tone = mix(C.cancellous, lit ? C.boneLit : C.boneDeep, 0.12 + 0.36 * Math.abs(k));
  // spongy pores in the chamfer (close range only)
  const pores: FaceArt['pores'] = [];
  for (let s = Math.max(f.s0, -0.3); s < f.s1; s += 0.11) {
    const h = hash(s * 17.31 + seed * 3.7);
    if (h > 0.5) continue;
    const o = 0.05 + (wAt(s) - 0.1) * hash(s * 5.9 + seed);
    const q = seamEdgeSeated(f.id, s, f.side, o);
    const r = 0.028 + 0.042 * hash(s * 2.3 + seed * 1.1);
    pores.push({x: q.x, y: q.y, rx: r * (1.1 + 0.5 * hash(s * 8.1)), ry: r});
  }
  return {
    face: f,
    band: poly([...inner, ...[...outer].reverse()]),
    rim: open(outer, 0.4),
    line: poly(inner.map((_, i) => seamEdgeSeated(f.id, f.s0 + ((f.s1 - f.s0) * i) / n, f.side, 0))).replace(/Z$/, ''),
    lit,
    tone,
    pores,
  };
});

/** the cancellous chamfers, the pores in them and the crisp face lines of the given faces (seated coordinates) */
const Faces: React.FC<{arts: FaceArt[]; px: number; view: View; fade: number; inkFade: number}> = ({arts, px, view, fade, inkFade}) => {
  if (fade <= 0.001 && inkFade <= 0.001) return null;
  const poreA = clamp((0.032 - px) / 0.012) * fade;
  const [x0, y0, x1, y1] = view;
  const lineW = 2 * 1.9 * px; // half of it is hidden under the gap (or the wedge's clip): ~1.9 px visible
  return (
    <g>
      {fade > 0.001 && (
        <g opacity={fade}>
          {arts.map((a, i) => <path key={`b${i}`} d={a.band} fill={a.tone} />)}
          {arts.map((a, i) => (
            <path key={`r${i}`} d={a.rim} fill="none" stroke={a.lit ? C.boneLit : C.boneShade} strokeWidth={(a.lit ? 1.5 : 1.2) * px} opacity={a.lit ? 0.9 : 0.7} strokeLinejoin="round" />
          ))}
          {poreA > 0.01 && (
            <g opacity={poreA}>
              {arts.flatMap((a, i) =>
                a.pores
                  .filter((p) => p.x > x0 - 2 && p.x < x1 + 2 && p.y > y0 - 2 && p.y < y1 + 2)
                  .map((p, k) => <ellipse key={`p${i}_${k}`} cx={p.x} cy={p.y} rx={p.rx} ry={p.ry} fill={C.cancellousPore} opacity={a.lit ? 0.75 : 0.9} />),
              )}
            </g>
          )}
        </g>
      )}
      {inkFade > 0.001 && (
        <g opacity={inkFade}>
          {arts.map((a, i) => <path key={`l${i}`} d={a.line} fill="none" stroke={C.boneInk} strokeWidth={lineW} strokeLinejoin="round" strokeLinecap="round" />)}
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------- the bone drawing (shared by the static part and the wedge)
const BoneShade: React.FC<{gid: string}> = ({gid}) => (
  <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={-14} y1={-6} x2={16} y2={4}>
    <stop offset={0} stopColor={C.boneLit} />
    <stop offset={0.3} stopColor={mix(C.boneLit, C.bone, 0.55)} />
    <stop offset={0.58} stopColor={C.bone} />
    <stop offset={0.8} stopColor={C.boneShade} />
    <stop offset={0.93} stopColor={mix(C.boneShade, C.boneDeep, 0.35)} />
    <stop offset={1} stopColor={mix(C.boneShade, '#B8A7B4', 0.4)} />
  </linearGradient>
);
/** vascular pores on the cortex, in view only (close-ups) */
const Pores: React.FC<{view: View; px: number}> = ({view, px}) => {
  if (px > 0.024) return null;
  const a = clamp((0.024 - px) / 0.012);
  const cell = 0.55;
  const [x0, y0, x1, y1] = view;
  const out: React.ReactNode[] = [];
  for (let gx = Math.floor(x0 / cell); gx <= Math.ceil(x1 / cell); gx++) {
    for (let gy = Math.floor(y0 / cell); gy <= Math.ceil(y1 / cell); gy++) {
      const h = hash(gx * 91.7 + gy * 13.3);
      if (h > 0.32) continue;
      const x = (gx + 0.15 + 0.7 * hash(gx * 3.1 + gy * 7.7)) * cell, y = (gy + 0.15 + 0.7 * hash(gx * 5.3 + gy * 2.9)) * cell;
      const rr = 0.025 + 0.04 * hash(gx * 1.7 + gy * 9.1);
      out.push(<ellipse key={`${gx}_${gy}`} cx={x} cy={y} rx={rr * 1.6} ry={rr} fill={C.cancellousPore} />);
    }
  }
  return <g opacity={0.36 * a}>{out}</g>;
};
const LAMELLAE = Array.from({length: 7}, (_, k) => {
  const xk = -9 + k * 3.0 + 0.6 * hash(k * 2.2);
  const yTop = -14 + 6 * hash(k * 5.1), yBot = 60 + 40 * hash(k * 1.3);
  return open([pt(xk, yTop), pt(xk * 0.92 + 0.2, (yTop + yBot) / 2), pt(xk * 0.78, yBot)], 0.6);
});
const ARTIC = open(RADIUS.slice(0, 9), 0.55);
const ULNAR_LIT = open(RADIUS.slice(37), 0.55);
type Ids = {shade: string; sheen: string; rad: string};
/** the radius' cel-shaded body (V1's look): fill, outline ink, sheen, lamellae, the articular rim, pores */
const BoneBody: React.FC<{ids: Ids; px: number; view: View; outlineClip?: string; closeK?: number}> = ({ids, px, view, outlineClip, closeK = 0}) => (
  <>
    <path d={RAD_PATH} fill={`url(#${ids.shade})`} />
    {/* the outline breaks where a seam opens onto the bone's edge; it closes again as the bone remodels */}
    <path d={RAD_PATH} fill="none" stroke={C.boneInk} strokeWidth={2.6 * px} strokeLinejoin="round" clipPath={outlineClip ? `url(#${outlineClip})` : undefined} />
    {outlineClip && closeK > 0.001 && <path d={RAD_PATH} fill="none" stroke={C.boneInk} strokeWidth={2.6 * px} strokeLinejoin="round" opacity={closeK} />}
    <g clipPath={`url(#${ids.rad})`}>
      <rect x={-14} y={-40} width={13} height={300} fill={`url(#${ids.sheen})`} />
      {LAMELLAE.map((d, k) => (
        <path key={k} d={d} stroke={C.boneShade} strokeWidth={1.3 * px} fill="none" opacity={0.08 + 0.24 * clamp((px - 0.012) / 0.02)} />
      ))}
      <path d={ARTIC} stroke="#EEF3F2" strokeWidth={1.6} fill="none" opacity={0.9} />
      <Pores view={view} px={px} />
      <path d={ULNAR_LIT} stroke={C.boneLit} strokeWidth={Math.max(0.12, 6 * px)} fill="none" opacity={0.5} transform="translate(0.5 0)" />
    </g>
  </>
);

// ---------------------------------------------------------------- the gaps between the current faces
/** one seam's gap polygons between its two CURRENT faces; `under` (mm) pushes the wedge's side of the gap under the
 *  wedge, so the wedge's anti-aliased edge blends with the dark gap, never with the bone beneath */
const SEATED: WedgeX = {dx: 0, dy: 0, rot: 0};
const gapPolys = (id: SeamId, w: WedgeX, under: number, split: boolean): P[][] => {
  // [s0, s1, pose]: when split, C1's static stretch is drawn seated 0.35 mm past the wedge junction so the two
  // polygons overlap (two dark fills meeting on one edge would leave a light anti-aliasing hairline)
  const ranges: [number, number, WedgeX][] =
    id === 'C1'
      ? split ? [[-0.8, S_C3_ON_C1 + 0.35, SEATED], [S_C3_ON_C1, LEN.C1 + 0.8, w]] : [[-0.8, LEN.C1 + 0.8, w]]
      : [[0, LEN[id] + 0.8, w]];
  return ranges.map(([s0, s1, pose]) => {
    const n = Math.max(1, Math.ceil((s1 - s0) / 0.08));
    const lo: P[] = [], hi: P[] = [];
    for (let i = 0; i <= n; i++) {
      const s = s0 + ((s1 - s0) * i) / n;
      lo.push(seamEdge(id, s, -1, pose, isWedgeSide(id, s, -1) ? under : -0.01));
      hi.push(seamEdge(id, s, 1, pose, isWedgeSide(id, s, 1) ? under : -0.01));
    }
    return [...lo, ...[...hi].reverse()];
  });
};
const SEATED_GAPS = SEAM_IDS.flatMap((id) => gapPolys(id, {dx: 0, dy: 0, rot: 0}, -0.01, false)).map(poly);
/** a darker-red core down the middle of each seated gap (blood in the crack, close range): the static seams' parts and
 *  the wedge's (which fade in as it seats, so nothing pops when it arrives) */
const coreLine = (id: SeamId, s0: number, s1: number) => {
  const ps: P[] = [];
  for (let s = s0; s <= s1; s += 0.1) ps.push(seamEdgeSeated(id, s, 1, -seamGap(id, s) / 2));
  return open(ps, 0.4);
};
const CORE_STATIC = [coreLine('C1', -0.8, S_C3_ON_C1 - 0.5), coreLine('C2', 0.5, LEN.C2 + 0.8)];
const CORE_WEDGE = [coreLine('C1', S_C3_ON_C1 + 0.5, LEN.C1 + 0.8), coreLine('C3', 0.5, LEN.C3 + 0.8)];

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
  inset: boolean[];
  capA: boolean;
  capB: boolean;
  bulbA: boolean;
  bulbB: boolean;
};
/** the keyed contact line's outward reach (mm) at s on one face: sparse rounded bumps of 0.01-0.04 mm */
const keyBump = (id: SeamId, s: number, side: 1 | -1) => {
  const seed = SEED[id] * 13 + (side > 0 ? 5 : 9);
  const v = noise1(s * 4.6 + seed, seed) * 0.75 + noise1(s * 11.3 + seed * 2, seed + 1) * 0.25;
  return 0.055 * clamp((v - 0.22) / 0.5) ** 1.3;
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
/** the glue in one seam as drawable runs (islands while healing), in world mm with the wedge in its current pose.
 *  The outer edges follow seams.glueBand(over = GLUE_OVER) exactly except near the fresh tip (a little proud) and at
 *  wide framings (held to a minimum on-screen width); healing insets are passed straight through to glueBand. */
export const glueRuns = (id: SeamId, st: BoneState2): GlueRun[] => {
  const g = st.glue[id];
  if (!g || g.b <= g.a) return [];
  const a = Math.max(-0.5, g.a), b = Math.min(LEN[id] + 0.6, g.b);
  if (b - a < 0.03) return [];
  const bridge = st.heal.bridge;
  const inset = bridge > 0 ? (side: 1 | -1, s: number) => growth(id, s, bridge, side) : undefined;
  const step = st.px < 0.016 ? 0.04 : 0.08; // finer sampling in close-ups (keyed edge, smooth curves)
  const outer = glueBand(id, a, b, st.wedge, GLUE_OVER, inset, step);
  const core = glueBand(id, a, b, st.wedge, 0, inset, step);
  const fr = st.front && st.front.seam === id ? st.front : null;
  const keyK = clamp((0.0125 - st.px) / 0.004) * (1 - clamp(bridge * 6));
  const out: GlueRun[] = [];
  outer.forEach((r, ri) => {
    const c = core[ri];
    if (!c || c.s.length !== r.s.length) return;
    const lo: P[] = [], hi: P[] = [], fresh: number[] = [], ins: boolean[] = [];
    for (let i = 0; i < r.s.length; i++) {
      const s = r.s[i];
      const im = inset ? inset(-1, s) : 0, ip = inset ? inset(1, s) : 0;
      // freshness near the tip, weighted by the flow: as the lead eases front.flow to 0 (the tip lifting away) the proud
      // tail, its gloss and the bulb settle into the ordinary rounded end, so nothing pops when front goes null
      const f = fr ? (1 - ss(Math.abs(s - fr.s), 0.15, FRESH_MM)) * clamp(fr.flow) : 0;
      let dv = sub(c.hi[i], c.lo[i]);
      dv = len(dv) > 1e-4 ? nrm(dv) : seamNormal(id, s);
      let eM = im > 0 ? 0 : PROUD * f, eP = ip > 0 ? 0 : PROUD * f;
      if (im <= 0 && ip <= 0) {
        const need = (MIN_GLUE_PX * st.px - (len(sub(r.hi[i], r.lo[i])) + eM + eP)) / 2;
        if (need > 0) { eM += need; eP += need; }
      }
      // at macro range the gel's contact line is keyed into each face's pores: small irregular rounded bumps
      if (keyK > 0 && f < 0.3) {
        if (im <= 0) eM += keyK * keyBump(id, s, -1);
        if (ip <= 0) eP += keyK * keyBump(id, s, 1);
      }
      lo.push(add(r.lo[i], mul(dv, -eM)));
      hi.push(add(r.hi[i], mul(dv, eP)));
      fresh.push(f);
      ins.push(im > 0 || ip > 0);
    }
    const capA = Math.abs(r.s[0] - a) < 1e-6, capB = Math.abs(r.s[r.s.length - 1] - b) < 1e-6;
    const nearA = fr ? Math.abs(fr.s - a) : 1e9, nearB = fr ? Math.abs(fr.s - b) : 1e9;
    const bulbA = capA && nearA < 0.35 && nearA <= nearB, bulbB = capB && nearB < 0.35 && nearB < nearA;
    out.push({id, s: r.s, lo, hi, loC: c.lo, hiC: c.hi, fresh, inset: ins, capA, capB, bulbA, bulbB});
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
type Bulb = {c: P; r: number; rc: number};
/** the gel bulb where the band leaves the cannula: at flow 0 it is exactly the band's rounded end */
const runBulbs = (r: GlueRun, flow: number): Bulb[] => {
  const out: Bulb[] = [];
  const mk = (i: number, end: 'a' | 'b') => {
    const half = len(sub(r.hi[i], r.lo[i])) / 2;
    const halfC = len(sub(r.hiC[i], r.loC[i])) / 2;
    const grow = 0.27 * flow * half;
    const c = add(lerpP(r.lo[i], r.hi[i], 0.5), mul(tEnd(r, end), 0.42 * flow * half));
    out.push({c, r: half + grow, rc: halfC + grow});
  };
  if (r.bulbB) mk(r.s.length - 1, 'b');
  if (r.bulbA) mk(0, 'a');
  return out;
};
/** which side of a seam faces the key light (the lit lip and the gloss sit on that side of the band) */
const LIT_LO: Record<SeamId, boolean> = {
  C1: dotL(seamNormal('C1', LEN.C1 / 2)) < 0,
  C2: dotL(seamNormal('C2', LEN.C2 / 3)) < 0,
  C3: dotL(seamNormal('C3', LEN.C3 / 2)) < 0,
};
/** a strip inside the core between fractions f0..f1 measured across from the lit face */
const strip = (r: GlueRun, f0: number, f1: number, i0 = 0, i1 = r.s.length - 1): P[] => {
  const L_ = LIT_LO[r.id];
  const A: P[] = [], B: P[] = [];
  for (let i = i0; i <= i1; i++) {
    const p = L_ ? r.loC[i] : r.hiC[i], q = L_ ? r.hiC[i] : r.loC[i];
    A.push(lerpP(p, q, f0));
    B.push(lerpP(p, q, f1));
  }
  return [...A, ...B.reverse()];
};
const line = (r: GlueRun, f: number, i0: number, i1: number): P[] => {
  const L_ = LIT_LO[r.id];
  const out: P[] = [];
  for (let i = i0; i <= i1; i++) out.push(lerpP(L_ ? r.loC[i] : r.hiC[i], L_ ? r.hiC[i] : r.loC[i], f));
  return out;
};
/** the seam junctions: the branch seams leave C1 here (C2 above, side -1; C3 below, side +1). Surface details of one
 *  band (shade strips, gloss, the faces seen through the gel) stop where another seam's gel joins it, so the T reads as
 *  one continuous gel body. */
const MOUTHS: {s: number; side: 1 | -1}[] = [{s: S_C2_ON_C1, side: -1}, {s: S_C3_ON_C1, side: 1}];
const detailOk = (r: GlueRun, i: number, side: 1 | -1) =>
  r.id === 'C1' ? !MOUTHS.some((m) => m.side === side && Math.abs(r.s[i] - m.s) < 0.62) : r.s[i] > 0.8;
const litSide = (id: SeamId): 1 | -1 => (LIT_LO[id] ? -1 : 1);
/** contiguous index ranges where pred holds */
const ranges = (n: number, pred: (i: number) => boolean): [number, number][] => {
  const out: [number, number][] = [];
  let st = -1;
  for (let i = 0; i < n; i++) {
    if (pred(i)) { if (st < 0) st = i; }
    else if (st >= 0) { if (i - 1 > st) out.push([st, i - 1]); st = -1; }
  }
  if (st >= 0 && n - 1 > st) out.push([st, n - 1]);
  return out;
};

const Glue: React.FC<{st: BoneState2; runs: GlueRun[]; radClip: string; glueClip: string}> = ({st, runs, radClip, glueClip}) => {
  if (runs.length === 0) return null;
  const px = st.px;
  const set = clamp(st.set);
  const gloss = 1 - 0.65 * set;
  const healA = 1 - clamp(st.heal.bridge * 6); // details that belong to the intact bond (keys, faces seen through)
  const detA = clamp((0.075 - px) / 0.035); // surface shading needs a few pixels of band to read
  const flow = st.front ? clamp(st.front.flow) : 0;
  const outlines = runs.map((r) => poly(runOutline(r, 'outer')));
  const cores = runs.map((r) => poly(runOutline(r, 'core')));
  const bulbs = runs.flatMap((r) => runBulbs(r, flow));
  const inkW = 2.3 * px;
  const coreCol = mix(CORE, C.glueDeep, 0.22 * set);
  const lipCol = mix(LIP, mix(C.glue, C.glueDeep, 0.05), 0.35 * set);
  // at macro range the gel keys into both faces: its contact line has rounded lobes (built into the outline by
  // glueRuns) and a few surface pores just past the lips are filled with gel
  const keyA = clamp((0.0125 - px) / 0.004) * healA;
  const keyed: {c: P; r: number}[] = [];
  if (keyA > 0.01) {
    runs.forEach((r) => {
      for (let i = 2; i < r.s.length - 2; i += 5) {
        if (r.inset[i] || r.fresh[i] > 0.3) continue;
        const s = r.s[i];
        const dv = nrm(sub(r.hiC[i], r.loC[i]));
        for (const side of [-1, 1] as const) {
          const h = hash(s * 31.7 + side * 5.3 + SEED[r.id] * 2.1);
          if (h < 0.74) continue;
          const edge = side < 0 ? r.lo[i] : r.hi[i];
          keyed.push({c: add(edge, mul(dv, side * (0.045 + 0.08 * hash(s * 11.1 + side)))), r: 0.014 + 0.014 * hash(s * 3.9 - side)});
        }
      }
    });
  }
  return (
    <g>
      <g clipPath={`url(#${radClip})`}>
        {/* one inked union of every seam's gel: an ink pass of all shapes, then the fills on top */}
        <g>
          {outlines.map((d, i) => <path key={`i${i}`} d={d} fill={C.glueInk} stroke={C.glueInk} strokeWidth={2 * inkW} strokeLinejoin="round" />)}
          {bulbs.map((b, i) => <circle key={`ib${i}`} cx={b.c.x} cy={b.c.y} r={b.r} fill={C.glueInk} stroke={C.glueInk} strokeWidth={2 * inkW} />)}
        </g>
        {/* surface pores just past the lips, filled with gel (it keys into both faces) */}
        {keyA > 0.01 && (
          <g opacity={keyA}>
            {keyed.map((k, i) => <circle key={`k${i}`} cx={k.c.x} cy={k.c.y} r={k.r} fill={C.glueDeep} />)}
            {keyed.map((k, i) => <circle key={`kk${i}`} cx={k.c.x - k.r * 0.25} cy={k.c.y - k.r * 0.25} r={k.r * 0.5} fill={C.glue} />)}
          </g>
        )}
        {/* the lips: thin gel wetting each face (light), then the core filling the gap between the faces (deeper) */}
        <g>
          {outlines.map((d, i) => <path key={`l${i}`} d={d} fill={lipCol} />)}
          {bulbs.map((b, i) => <circle key={`lb${i}`} cx={b.c.x} cy={b.c.y} r={b.r} fill={lipCol} />)}
        </g>
        <g>
          {cores.map((d, i) => <path key={`c${i}`} d={d} fill={coreCol} />)}
          {bulbs.map((b, i) => <circle key={`cb${i}`} cx={b.c.x} cy={b.c.y} r={b.rc} fill={coreCol} />)}
        </g>
        {/* the broken faces seen through the gel (the band sits IN the crack) */}
        {healA > 0.01 && detA > 0.01 && (
          <g opacity={0.55 * healA * detA} fill="none" stroke={C.glueDeep} strokeWidth={1.4 * px} strokeLinejoin="round">
            {runs.map((r, i) => (
              <g key={`f${i}`}>
                {([-1, 1] as const).flatMap((side) =>
                  ranges(r.s.length, (k) => detailOk(r, k, side)).map(([a, b], k) => (
                    <path key={`${side}_${k}`} d={poly((side < 0 ? r.loC : r.hiC).slice(a, b + 1)).replace(/Z$/, '')} />
                  )),
                )}
              </g>
            ))}
          </g>
        )}
        {/* cel shading of the gel surface. Settled gel lies IN the crack, a little concave: the near wall shades the
            light side, the surface climbs toward the light at the far face (a light strip and the gloss there). The fresh
            tail is proud and convex: lit on the light's side, shaded on the far side, gloss on the light's side. */}
        {detA > 0.01 && runs.map((r, i) => {
          const ls = litSide(r.id);
          return (
            <g key={`s${i}`} opacity={detA}>
              {ranges(r.s.length, (k) => detailOk(r, k, ls)).map(([a, b], k) => (
                <path key={`d${k}`} d={poly(strip(r, 0.0, 0.24, a, b))} fill={C.glueDeep} opacity={0.46 + 0.12 * set} />
              ))}
              {ranges(r.s.length, (k) => detailOk(r, k, -ls as 1 | -1)).map(([a, b], k) => (
                <path key={`l${k}`} d={poly(strip(r, 0.66, 0.9, a, b))} fill={C.glueLit} opacity={0.12 + 0.14 * gloss} />
              ))}
            </g>
          );
        })}
        {/* gloss: a fine broken highlight where the surface climbs the far face; continuous and brighter on the
            fresh tail */}
        {detA > 0.01 && runs.map((r, i) => {
          const n = r.s.length;
          const meanW = r.loC.reduce((acc, p, k) => acc + len(sub(r.hiC[k], p)), 0) / Math.max(1, n);
          const sw = Math.max(1.5 * px, Math.min(meanW * 0.065, 5.5 * px));
          const far = -litSide(r.id) as 1 | -1;
          const settled = ranges(n, (k) => r.fresh[k] < 0.5 && detailOk(r, k, far));
          const fresh = ranges(n, (k) => r.fresh[k] >= 0.35 && detailOk(r, k, far));
          return (
            <g key={`g${i}`} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={detA}>
              {settled.map(([a, b], k) => (
                <path key={`o${k}`} d={open(line(r, 0.78, a, b), 0.5)} stroke={C.glueShine} strokeWidth={sw}
                  strokeDasharray={`${(meanW * 2.6).toFixed(3)} ${(meanW * 1.7).toFixed(3)}`} opacity={0.8 * gloss ** 1.8} />
              ))}
              {fresh.map(([a, b], k) => (
                <path key={`f${k}`} d={open(line(r, 0.76, a, b), 0.5)} stroke={C.glueShine} strokeWidth={sw * 1.3} opacity={0.95 * gloss} />
              ))}
            </g>
          );
        })}
        {bulbs.map((b, i) => {
          const hx = b.c.x - b.r * 0.34, hy = b.c.y - b.r * 0.38;
          return (
            <g key={`bh${i}`} opacity={flow}>
              <circle cx={b.c.x + b.r * 0.12} cy={b.c.y + b.r * 0.14} r={b.rc * 0.86} fill={C.glueDeep} opacity={0.35} />
              <circle cx={b.c.x - b.r * 0.06} cy={b.c.y - b.r * 0.06} r={b.rc * 0.78} fill={coreCol} />
              <ellipse cx={hx} cy={hy} rx={b.r * 0.3} ry={b.r * 0.17} fill={C.glueShine} opacity={0.92 * gloss} transform={`rotate(-38 ${hx} ${hy})`} />
            </g>
          );
        })}
      </g>
      {/* the bone's outline continues over the gel where a seam meets the bone's edge (the glue is flush with it) */}
      <g clipPath={`url(#${glueClip})`}>
        <path d={RAD_PATH} fill="none" stroke={C.boneInk} strokeWidth={2.6 * px} />
      </g>
    </g>
  );
};

// ---------------------------------------------------------------- contact cues
const Contact: React.FC<{p: P; c: number; r: number; gid: string}> = ({p, c, r, gid}) => {
  if (c < 0.01) return null;
  const rr = r * (1 + 0.45 * (1 - c));
  return (
    <g>
      <ellipse cx={p.x + 0.2 * r} cy={p.y + 0.28 * r} rx={rr * 1.2} ry={rr} fill={`url(#${gid})`} opacity={0.62 * c} />
      <ellipse cx={p.x + 0.06 * r} cy={p.y + 0.08 * r} rx={r * 0.5} ry={r * 0.44} fill={`url(#${gid})`} opacity={0.9 * c * c} />
    </g>
  );
};

// ---------------------------------------------------------------- the whole fracture
const WEDGE_D = poly(WEDGE_POLY as P[]);
const isDisplaced = (w: WedgeX) => Math.abs(w.dx) + Math.abs(w.dy) + Math.abs(w.rot) * 10 > 1e-4;

export const FractureBone: React.FC<{st: BoneState2; view: View}> = ({st, view}) => {
  const px = st.px;
  const ids: Ids = {shade: uid('fb_shade'), sheen: uid('fb_sheen'), rad: uid('fb_rad')};
  const notWedge = uid('fb_nw'), wedgeClip = uid('fb_wc'), glueClip = uid('fb_gc'), soft = uid('fb_soft'), mouths = uid('fb_mo');
  const h = st.heal;
  const remodel = clamp(h.remodel);
  const fade = 1 - ss(remodel, 0, 0.8); // chamfers, gap colour
  // face lines fade out completely: both faces would leave a DOUBLE trace; a single faint seam trace, if wanted, is the
  // healing layer's (it draws the remodelled bone over the gap)
  const inkFade = 1 - ss(remodel, 0, 0.95);
  const gapCol = mix(GAP, C.bone, ss(remodel, 0, 0.75));
  const disp = isDisplaced(st.wedge);
  const dispK = clamp((Math.abs(st.wedge.dx) + Math.abs(st.wedge.dy)) / 1.2 + Math.abs(st.wedge.rot) / 0.2);
  const statArts = disp ? FACE_ART.filter((a) => !a.face.wedge) : FACE_ART;
  const wedgeArts = FACE_ART.filter((a) => a.face.wedge);
  const gaps = disp ? SEAM_IDS.flatMap((id) => gapPolys(id, st.wedge, 0.07, true)).map(poly) : SEATED_GAPS;
  const runs = SEAM_IDS.flatMap((id) => glueRuns(id, st));
  const gapsUnion = uid('fb_gu');
  const viewW: View = disp ? [view[0] - 3, view[1] - 3, view[2] + 3, view[3] + 3] : view;
  return (
    <g>
      <defs>
        <BoneShade gid={ids.shade} />
        <clipPath id={ids.rad}><path d={RAD_PATH} /></clipPath>
        <linearGradient id={ids.sheen} gradientUnits="userSpaceOnUse" x1={-13} y1={0} x2={-2} y2={0}>
          <stop offset={0} stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset={0.35} stopColor="#FFFFFF" stopOpacity={0.5} />
          <stop offset={0.6} stopColor="#FFFFFF" stopOpacity={0.12} />
          <stop offset={1} stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        <radialGradient id={soft}>
          <stop offset={0} stopColor="#2A140C" stopOpacity={0.85} />
          <stop offset={0.5} stopColor="#2A140C" stopOpacity={0.42} />
          <stop offset={1} stopColor="#2A140C" stopOpacity={0} />
        </radialGradient>
        {disp && (
          <>
            <clipPath id={notWedge}><path d={`M-400 -400H400V600H-400Z ${WEDGE_D}`} clipRule="evenodd" /></clipPath>
            <clipPath id={wedgeClip}><path d={WEDGE_D} /></clipPath>
          </>
        )}
        {/* everywhere except the seams' gaps: the bone's outline is cut where a seam opens onto its edge */}
        <clipPath id={mouths}><path d={`M-400 -400H400V600H-400Z ${gaps.join(' ')}`} clipRule="evenodd" /></clipPath>
        <clipPath id={gapsUnion}>{gaps.map((d, i) => <path key={i} d={d} />)}</clipPath>
        <clipPath id={glueClip}>
          {runs.map((r, i) => <path key={i} d={poly(runOutline(r, 'outer'))} />)}
        </clipPath>
      </defs>
      {/* 1. the cavity bed */}
      <path d={RAD_PATH} fill={gapCol} />
      {/* 2-3. the static bone and its broken faces */}
      <g clipPath={disp ? `url(#${notWedge})` : undefined}>
        <BoneBody ids={ids} px={px} view={view} outlineClip={mouths} closeK={ss(remodel, 0.25, 0.9)} />
      </g>
      <g clipPath={`url(#${ids.rad})`}>
        <Faces arts={statArts} px={px} view={view} fade={fade} inkFade={inkFade} />
        {/* 4. the gaps: one dark union over the faces' inner halves and across every seam's mouth */}
        {fade > 0.001 && (
          <g>
            {gaps.map((d, i) => <path key={i} d={d} fill={gapCol} />)}
            {px < 0.05 && (
              <g fill="none" stroke={C.marrow} strokeWidth={0.22} strokeLinecap="round" opacity={0.5 * fade * clamp((0.05 - px) / 0.015)}>
                {CORE_STATIC.map((d, i) => <path key={`m${i}`} d={d} />)}
                {dispK < 0.999 && <g opacity={1 - dispK}>{CORE_WEDGE.map((d, i) => <path key={`w${i}`} d={d} />)}</g>}
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
      {/* 5. the wedge fragment in its current pose */}
      {disp && (
        <g>
          <g transform={`translate(${(0.22 * dispK).toFixed(4)} ${(0.34 * dispK).toFixed(4)}) ${xfSvg(st.wedge)}`} opacity={0.4 * dispK}>
            <g clipPath={`url(#${wedgeClip})`}><path d={RAD_PATH} fill="#1E0A06" /></g>
          </g>
          <g transform={xfSvg(st.wedge)}>
            <g clipPath={`url(#${wedgeClip})`}>
              <BoneBody ids={ids} px={px} view={viewW} />
              <g clipPath={`url(#${ids.rad})`}>
                <Faces arts={wedgeArts} px={px} view={viewW} fade={fade} inkFade={inkFade} />
              </g>
            </g>
          </g>
        </g>
      )}
      {/* 6. the glue */}
      <Glue st={st} runs={runs} radClip={ids.rad} glueClip={glueClip} />
      {/* 7. contact cues */}
      {st.press && <Contact p={st.press.p} c={clamp(st.press.contact)} r={PRESS_R} gid={soft} />}
      {st.appContact && <Contact p={st.appContact.p} c={clamp(st.appContact.contact)} r={APP_R} gid={soft} />}
    </g>
  );
};
