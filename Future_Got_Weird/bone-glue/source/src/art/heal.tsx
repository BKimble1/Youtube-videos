// V2 (B2): healing, where new bone replaces the glue. World millimetres at depth 0, drawn right after FractureBone
// (art/fracture.tsx) in the same layer, so everything here lies ON TOP of the bone and the glue. Back to front:
//   1. the soft lining: grey-pink fibrous tissue on the lips of every broken face (soft), turning to pale woven bone
//      (hard), absorbed into the bone (remodel)
//   2. THE NEW BONE in the seams. Its region is exactly "the glued gaps minus the glue that is left": FractureBone thins
//      the glue by seams.growth() from each face, and this layer fills what the glue gave up, so the two can never
//      disagree (no dark gap, no overlap) and the T-junctions fill naturally from the fragments' corners. Pale woven
//      bone (whiter than the shaft) with a staggered lattice of small pores elongated in the growth direction (fixed
//      in the bone: the front uncovers them as it passes), a crisp brighter rim with a fine ink line along the front,
//      and small spurs that grow out of the front and are overtaken by it, so the advance reads frame to frame.
//      Remodelling: mature bone (the shaft's own shading) advances from both faces into the woven bone, so the pale
//      band narrows to a line and closes; at remodel 1 only a faint trace remains.
//   3. the fracture hematoma (hem): a dark translucent clot hugging the seams' lips and the exits; a light veil over
//      the glue so the teal stays readable
//   4. the callus cuff at the margins (where the seams leave the bone's borders): soft grey-pink and fibrous, hardening
//      into pale woven bone, then slimming back to the shaft's outline
// Ink widths are in screen pixels via st.px. Deterministic; no filters; masks bounded to the fracture's neighbourhood.
import React from 'react';
import {P, add, closed, len, mul, nrm, open, perp, poly, pt, sub} from '../core/geo';
import {mix} from '../core/color';
import {uid} from '../core/ids';
import {clamp, hash, noise1, ss} from '../lib';
import {C, INK} from './palette';
import {RADIUS, radiusEdges} from './anatomy';
import {
  SEAM_IDS, S_C2_ON_C1, S_C3_ON_C1, SeamId, WedgeX, growth, seamEdge, seamEdgeSeated, seamGap, seamLength, seamNormal, seamPoint,
} from './seams';
import {GlueRun, glueRuns} from './fracture';
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
/** woven bone: a cool, slightly grey off-white (less yellow than the shaft, so it reads as a different, newer
 *  material even on the lit side where the shaft is nearly white too) */
const WOVEN0 = '#F3F1EB';
const WOVEN_STOPS: [number, string][] = [
  [0, mix(WOVEN0, '#FFFFFF', 0.3)],
  [0.45, WOVEN0],
  [0.8, mix(WOVEN0, C.newBone, 0.5)],
  [1, mix(C.newBone, C.boneShade, 0.3)],
];
/** the shaft's own shading (fracture.tsx BoneShade, same vector and stops), for remodelled bone */
const SHAFT_STOPS: [number, string][] = [
  [0, C.boneLit],
  [0.3, mix(C.boneLit, C.bone, 0.55)],
  [0.58, C.bone],
  [0.8, C.boneShade],
  [0.93, mix(C.boneShade, C.boneDeep, 0.35)],
  [1, mix(C.boneShade, '#B8A7B4', 0.4)],
];
const PORE = mix(C.newBonePore, C.boneShade, 0.3);
const PORE_DEEP = mix(C.newBonePore, C.boneDeep, 0.45);
const RIM = '#FFFFFF';
/** the front's fine line sits against the glue: a deep teal, so even a thin last island still reads as glue */
const RIM_INK = mix(C.glueDeep, C.glueInk, 0.55);
const GROWTH_LINE = mix(C.newBonePore, C.boneShade, 0.2);
const HEM_DEEP = mix(C.hematoma, '#22040A', 0.45);
const SOFT_SH = '#A48FA3';
const SOFT_PINK = mix(C.softCallus, '#D9A3B0', 0.35);
const SOFT_FIB = mix(C.softCallus, '#6E5468', 0.6);
const SOFT_INK = '#5E4B5C';
const HARD_SH = mix(C.newBone, C.boneShade, 0.45);

const Grad: React.FC<{id: string; stops: [number, string][]}> = ({id, stops}) => (
  <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={-14} y1={-6} x2={16} y2={4}>
    {stops.map(([o, c], i) => <stop key={i} offset={o} stopColor={c} />)}
  </linearGradient>
);

// ---------------------------------------------------------------- geometry helpers
const sample = (s0: number, s1: number, step = STEP): number[] => {
  const n = Math.max(1, Math.ceil(Math.abs(s1 - s0) / step));
  const out: number[] = [];
  for (let i = 0; i <= n; i++) out.push(s0 + ((s1 - s0) * i) / n);
  return out;
};
/** the gap between a seam's two current faces over [s0, s1], widened `ext` mm past each face */
const gapPoly = (id: SeamId, s0: number, s1: number, w: WedgeX, ext: number): P[] => {
  const ss_ = sample(s0, s1);
  const lo = ss_.map((s) => seamEdge(id, s, -1, w, ext));
  const hi = ss_.map((s) => seamEdge(id, s, 1, w, ext));
  return [...lo, ...hi.reverse()];
};
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
/** the stretches of [f0, f1] where a face is real bone (realFace), as intervals */
const realRanges = (id: SeamId, side: 1 | -1, f0: number, f1: number, pad = 0): [number, number][] => {
  const out: [number, number][] = [];
  let a = NaN;
  const ss_ = sample(f0, f1, 0.04);
  for (const s of ss_) {
    const ok = realFace(id, s, side, pad);
    if (ok && isNaN(a)) a = s;
    if (!ok && !isNaN(a)) { if (s - a > 0.1) out.push([a, s]); a = NaN; }
  }
  if (!isNaN(a) && f1 - a > 0.1) out.push([a, f1]);
  return out;
};
type Pore = {id: SeamId; side: 1 | -1; s: number; d: number; r: number; e: number; tilt: number; dark: boolean; c: P};
const PORES: Pore[] = (() => {
  const out: Pore[] = [];
  for (const id of SEAM_IDS) {
    const L = LEN[id];
    for (const side of [-1, 1] as const) {
      const seed = SEED[id] * 11 + (side > 0 ? 2 : 5);
      for (let row = 0; row < 4; row++) {
        const d0 = 0.08 + row * 0.112;
        const off = (row % 2) * 0.085;
        for (let s = S_FULL0[id] + off; s < L + 0.6; s += 0.17) {
          const h = (k: number) => hash(s * 13.71 + row * 3.13 + seed * 0.71 + k * 17.3);
          if (h(0) < 0.16) continue; // the lattice is irregular (woven), not a grid
          const sv = s + (h(1) - 0.5) * 0.07;
          const d = d0 + (h(2) - 0.5) * 0.04;
          if (!realFace(id, sv, side, 0.05, false)) continue;
          out.push({
            id, side, s: sv, d,
            r: 0.026 + 0.02 * h(3),
            e: 1.25 + 0.55 * h(4),
            tilt: (h(5) - 0.5) * 0.7,
            dark: h(6) > 0.72,
            c: seamEdgeSeated(id, sv, side, -d),
          });
        }
      }
    }
  }
  return out;
})();
/** the spurs on each front: fixed places along the seam; each grows out ahead of the front and is overtaken by it */
type Spur = {id: SeamId; side: 1 | -1; s: number; ph: number; hw: number; L: number; c: P};
const SPURS: Spur[] = (() => {
  const out: Spur[] = [];
  for (const id of SEAM_IDS) {
    for (const side of [-1, 1] as const) {
      const seed = SEED[id] * 7 + (side > 0 ? 1 : 3);
      for (let s = S_FULL0[id] + 0.15; s < LEN[id] + 0.5; s += 0.26) {
        const h = (k: number) => hash(s * 7.37 + seed * 1.93 + k * 11.1);
        const sv = s + (h(0) - 0.5) * 0.1;
        if (!realFace(id, sv, side, 0.15)) continue;
        out.push({id, side, s: sv, ph: h(1), hw: 0.045 + 0.03 * h(2), L: 0.05 + 0.045 * h(3), c: seamEdgeSeated(id, sv, side, 0)});
      }
    }
  }
  return out;
})();
/** the mature (remodelled) bone advancing from one face, mm into the gap, for remodel progress r (both sides together
 *  cover the whole gap by r = 1) */
const matured = (id: SeamId, s: number, r: number, side: 1 | -1): number => {
  if (r <= 0) return 0;
  const g = seamGap(id, s);
  const seed = SEED[id] * 23 + (side > 0 ? 4 : 9);
  const k = 0.7 + 0.6 * (0.5 + 0.5 * noise1(s * 0.48 + seed, seed));
  return clamp(r * 1.5 * k * g * 0.5 + 0.03 * Math.sin(s * 6.1 + seed) * r * (1 - r), 0, g);
};

// ---------------------------------------------------------------- 1. the soft lining on the lips
const Lining: React.FC<{st: BoneState2; view: View}> = ({st, view}) => {
  const h = st.heal;
  // it forms on the faces' lips before any bone, and is taken over by the woven bone as the fronts set off
  const a = clamp(h.soft * 1.2) * (1 - ss(h.bridge, 0.04, 0.3)) * (1 - ss(h.remodel, 0, 0.7));
  if (a < 0.01) return null;
  const px = st.px;
  const hard = clamp(h.hard);
  const col = mix(SOFT_PINK, C.newBone, hard);
  const lit = mix(C.softCallusLit, '#FFFFFF', hard);
  const w = st.wedge;
  const o0 = -0.03; // over the face (and the glue's wetted lip) onto the fragment
  const bands: string[] = [];
  const lips: string[] = [];
  const fib: React.ReactNode[] = [];
  const fibA = (1 - hard) * clamp((0.05 - px) / 0.02);
  for (const id of SEAM_IDS) {
    for (const side of [-1, 1] as const) {
      const seed = SEED[id] * 5 + (side > 0 ? 1 : 2);
      // wide enough to cover the glue's wetted lip and its ink (0.14 mm past the face, plus the ink), so the lip
      // vanishing as the fronts start (seams.glueBand drops the overhang once inset > 0) happens under the lining
      const wl = (s: number) => o0 + clamp(h.soft * 1.2) * (0.25 + 0.06 * (0.5 + 0.5 * noise1(s * 0.9 + seed, seed)));
      // only on real lips: never across another seam's mouth
      for (const [f0, f1] of realRanges(id, side, id === 'C1' ? -0.3 : 0, LEN[id] + 0.3, 0.12)) {
        bands.push(closed(faceBand(id, f0, f1, side, w, () => o0, wl, 0.12), 0.4));
        lips.push(open(sample(f0, f1, 0.12).map((s) => seamEdge(id, s, side, w, wl(s))), 0.5));
        if (fibA > 0.01) {
          // loose, irregular fibres (not a hatch)
          for (let s = f0 + 0.12; s < f1 - 0.1; s += 0.13 + 0.17 * hash(s * 5.7 + seed)) {
            const hh = hash(s * 3.3 + seed);
            const p0 = seamEdge(id, s, side, w, o0 + 0.03 + 0.04 * hh);
            const q = seamEdge(id, s + 0.12 * (hh - 0.5), side, w, wl(s) - 0.02 - 0.06 * hash(s * 8.1 + seed));
            if (p0.x < view[0] - 1 || p0.x > view[2] + 1 || p0.y < view[1] - 1 || p0.y > view[3] + 1) continue;
            fib.push(<path key={`${id}${side}_${s.toFixed(3)}`} d={`M${p0.x.toFixed(3)} ${p0.y.toFixed(3)}L${q.x.toFixed(3)} ${q.y.toFixed(3)}`} />);
          }
        }
      }
    }
  }
  return (
    <g opacity={a}>
      {bands.map((d, i) => <path key={i} d={d} fill={col} opacity={0.84} />)}
      {lips.map((d, i) => <path key={`l${i}`} d={d} fill="none" stroke={lit} strokeWidth={1.2 * px} opacity={0.7} />)}
      {fib.length > 0 && <g stroke={SOFT_FIB} strokeWidth={1.1 * px} strokeLinecap="round" opacity={0.55 * fibA}>{fib}</g>}
    </g>
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
  const ids = {mask: uid('hl_nb'), clip: uid('hl_gc'), woven: uid('hl_wv'), shaft: uid('hl_sh')};
  // while remodelling, the new bone spreads a hair over each face so its edge never leaves a hairline
  const ext = 0.04 * ss(rem, 0.15, 0.7);
  const white: string[] = [], black: string[] = [], rimPaths: string[] = [];
  for (const id of SEAM_IDS) {
    const parts = partsOf(id, spanOf(st, id));
    if (parts.glued) white.push(poly(gapPoly(id, parts.glued[0], parts.glued[1], w, ext)));
    // unglued stretches (not expected in the film): new bone grows from the faces into the open gap
    for (const [s0, s1] of parts.bare) {
      for (const side of [-1, 1] as const) {
        white.push(poly(faceBand(id, s0, s1, side, w, () => ext, (s) => -growth(id, s, bridge, side))));
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
  const rimW = 2.1 * px * rk, inkW = 1.15 * px * rk;
  const rimA = 1 - ss(rem, 0, 0.3);
  const rimMM = rimW + inkW; // the rim's visible width inside the new bone
  // the lattice: pores the front has reached (the mask hides the part still under glue)
  const poreA = clamp((0.055 - px) / 0.025) * (1 - ss(rem, 0.6, 1));
  const pores: React.ReactNode[] = [];
  if (poreA > 0.01) {
    for (let i = 0; i < PORES.length; i++) {
      const p = PORES[i];
      if (p.c.x < x0 - 0.5 || p.c.x > x1 + 0.5 || p.c.y < y0 - 0.5 || p.c.y > y1 + 0.5) continue;
      const g = seamGap(p.id, p.s);
      if (p.d > g * 0.62) continue;
      const gr = growth(p.id, p.s, bridge, p.side);
      const re = p.r * p.e;
      const open_ = ss(gr - p.d, 0.3 * re + rimMM, re + rimMM + 0.05);
      if (open_ < 0.05) continue;
      const q = seamEdge(p.id, p.s, p.side, w, -p.d);
      const n = seamNormal(p.id, p.s);
      const ang = (Math.atan2(n.y, n.x) + p.tilt) * (180 / Math.PI);
      pores.push(
        <ellipse key={i} cx={q.x.toFixed(3)} cy={q.y.toFixed(3)} rx={(re * (0.4 + 0.6 * open_)).toFixed(4)} ry={(p.r * open_).toFixed(4)}
          transform={`rotate(${ang.toFixed(1)} ${q.x.toFixed(3)} ${q.y.toFixed(3)})`} fill={p.dark ? PORE_DEEP : PORE} />,
      );
    }
  }
  // incremental growth lines: once a front has passed depth D, a faint broken line parallel to its face (the bone is
  // laid down in layers), so the advance leaves a record of where the front has been
  const lineA = clamp((0.05 - px) / 0.02) * (1 - ss(rem, 0.2, 0.7));
  const glines: string[] = [];
  if (lineA > 0.01) {
    for (const id of SEAM_IDS) {
      for (const side of [-1, 1] as const) {
        for (const D of [0.15, 0.3]) {
          let cur: P[] = [];
          const flush = () => {
            if (cur.length > 2) glines.push(open(cur, 0.5));
            cur = [];
          };
          for (const s of sample(S_FULL0[id], sFull1(id), 0.1)) {
            const q = seamEdge(id, s, side, w, -D);
            const ok = q.x > x0 - 0.3 && q.x < x1 + 0.3 && q.y > y0 - 0.3 && q.y < y1 + 0.3 &&
              realFace(id, s, side, 0.1) && D < seamGap(id, s) * 0.6 && growth(id, s, bridge, side) > D + 0.04;
            if (ok) cur.push(q);
            else flush();
          }
          flush();
        }
      }
    }
  }
  // remodelling: mature bone advancing from both faces (a half-tone step, then the shaft's own shading)
  const mature: string[] = [], matureEdge: string[] = [];
  if (rem > 0.001) {
    for (const id of SEAM_IDS) {
      const f0 = S_FULL0[id], f1 = sFull1(id);
      for (const side of [-1, 1] as const) {
        mature.push(poly(faceBand(id, f0, f1, side, w, () => ext + 0.01, (s) => -matured(id, s, rem, side))));
        matureEdge.push(poly(faceBand(id, f0, f1, side, w, () => ext + 0.01, (s) => -Math.min(seamGap(id, s), matured(id, s, rem, side) + 0.045 * (1 - rem)))));
      }
    }
  }
  // spurs ahead of each front, where enough glue is left to grow into
  const spurs: string[] = [];
  if (px < 0.045 && bridge < 0.995) {
    for (const sp of SPURS) {
      if (sp.c.x < x0 - 0.5 || sp.c.x > x1 + 0.5 || sp.c.y < y0 - 0.5 || sp.c.y > y1 + 0.5) continue;
      const g = seamGap(sp.id, sp.s);
      const gr = growth(sp.id, sp.s, bridge, sp.side), go = growth(sp.id, sp.s, bridge, (-sp.side) as 1 | -1);
      const room = g - gr - go;
      if (room < 0.08 || gr < 0.04) continue;
      const u = (gr / 0.15 + sp.ph) % 1;
      const L = sp.L * Math.sin(Math.PI * u) * clamp((room - 0.08) / 0.12) * clamp((gr - 0.04) / 0.06);
      if (L < 0.012) continue;
      const bl = seamEdge(sp.id, sp.s - sp.hw, sp.side, w, -growth(sp.id, sp.s - sp.hw, bridge, sp.side) + 0.03);
      const br = seamEdge(sp.id, sp.s + sp.hw, sp.side, w, -growth(sp.id, sp.s + sp.hw, bridge, sp.side) + 0.03);
      // a short rounded spicule (a finger of woven bone), leaning a little one way or the other
      const lean = 0.35 * sp.hw * (sp.ph - 0.5) * 2;
      const at = (u: number, f: number) => seamEdge(sp.id, sp.s + u * sp.hw + lean * f, sp.side, w, -(gr + L * f));
      spurs.push(open([bl, at(-0.62, 0.45), at(-0.38, 0.85), at(0, 1), at(0.38, 0.85), at(0.62, 0.45), br], 1));
    }
  }
  return (
    <g clipPath={`url(#${radClip})`}>
      <defs>
        <Grad id={ids.woven} stops={WOVEN_STOPS} />
        <Grad id={ids.shaft} stops={SHAFT_STOPS} />
        <mask id={ids.mask} maskUnits="userSpaceOnUse" x={x0} y={y0} width={x1 - x0} height={y1 - y0}>
          {white.map((d, i) => <path key={`w${i}`} d={d} fill="#FFFFFF" />)}
          {black.map((d, i) => <path key={`b${i}`} d={d} fill="#000000" />)}
        </mask>
        <clipPath id={ids.clip}>
          {white.map((d, i) => <path key={i} d={d} />)}
        </clipPath>
      </defs>
      <g mask={`url(#${ids.mask})`}>
        <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={`url(#${ids.woven})`} />
        {pores.length > 0 && <g opacity={poreA}>{pores}</g>}
        {glines.length > 0 && (
          <g fill="none" stroke={GROWTH_LINE} strokeWidth={1.4 * px} strokeDasharray="0.32 0.1" strokeLinecap="round" opacity={0.85 * lineA}>
            {glines.map((d, i) => <path key={i} d={d} />)}
          </g>
        )}
        {mature.length > 0 && (
          <g>
            {matureEdge.map((d, i) => <path key={`e${i}`} d={d} fill={`url(#${ids.shaft})`} opacity={0.55} />)}
            {mature.map((d, i) => <path key={i} d={d} fill={`url(#${ids.shaft})`} />)}
          </g>
        )}
        {rimA > 0.01 && (
          <g fill="none" strokeLinejoin="round" opacity={rimA}>
            {rimPaths.map((d, i) => <path key={`r${i}`} d={d} stroke={RIM} strokeWidth={2 * (rimW + inkW)} />)}
            {rimPaths.map((d, i) => <path key={`k${i}`} d={d} stroke={RIM_INK} strokeWidth={2 * inkW} />)}
          </g>
        )}
      </g>
      {spurs.length > 0 && (
        <g clipPath={`url(#${ids.clip})`}>
          {spurs.map((d, i) => <path key={i} d={d} fill={RIM} />)}
        </g>
      )}
    </g>
  );
};

// ---------------------------------------------------------------- 2b. the faint trace a healed seam leaves
const TRACES: string[] = SEAM_IDS.map((id) => open(sample(id === 'C1' ? -0.5 : 0.2, LEN[id] + 0.5, 0.25).map((s) => seamPoint(id, s)), 0.5));
const Trace: React.FC<{st: BoneState2; radClip: string}> = ({st, radClip}) => {
  const a = ss(st.heal.remodel, 0.55, 1);
  if (a < 0.01) return null;
  return (
    <g clipPath={`url(#${radClip})`} fill="none" stroke={C.boneShade} strokeWidth={1.3 * st.px} strokeLinecap="round" opacity={0.3 * a}>
      {TRACES.map((d, i) => <path key={i} d={d} />)}
    </g>
  );
};

// ---------------------------------------------------------------- 3. the hematoma
const EXITS: {id: SeamId; s: number}[] = [{id: 'C1', s: 0}, {id: 'C1', s: LEN.C1}, {id: 'C3', s: LEN.C3}, {id: 'C2', s: LEN.C2}];
const Hematoma: React.FC<{st: BoneState2}> = ({st}) => {
  const h = st.heal;
  const a = clamp(h.hem) * (1 - ss(h.soft, 0.15, 0.85));
  if (a < 0.01) return null;
  const w = st.wedge;
  // the clot spreads out from the seams as it forms
  const grow = 0.4 + 0.6 * clamp(h.hem);
  const halo: string[] = [], lips: string[] = [], veil: string[] = [];
  for (const id of SEAM_IDS) {
    const f0 = id === 'C1' ? -0.6 : 0.2, f1 = LEN[id] + 0.6;
    // a lumpy spread (slow swells plus a few clot lobes) so it reads as a soft clot, not a stroke
    const sp = (s: number, side: number) => {
      const seed = SEED[id] * 3 + side;
      const lobe = Math.max(0, noise1(s * 0.85 + seed * 3, seed + 11)) ** 2;
      return grow * (0.42 + 0.28 * (0.5 + 0.5 * noise1(s * 0.45 + seed, seed)) + 0.42 * lobe);
    };
    veil.push(poly(gapPoly(id, f0, f1, w, 0)));
    for (const side of [-1, 1] as const) {
      halo.push(closed(faceBand(id, f0, f1, side, w, () => -0.14, (s) => sp(s, side), 0.18), 0.6));
      lips.push(closed(faceBand(id, f0, f1, side, w, () => -0.06, (s) => 0.5 * sp(s, side), 0.18), 0.6));
    }
  }
  // where the seams leave the bone, the clot spills over the border: lumpy, not round
  const blob = (c: P, r: number, k: number, sc: number) => {
    const ps: P[] = [];
    for (let j = 0; j < 14; j++) {
      const a = (j / 14) * Math.PI * 2;
      const rr = r * sc * (0.78 + 0.34 * hash(k * 7.7 + j * 1.3));
      ps.push(pt(c.x + Math.cos(a) * rr * 0.75, c.y + Math.sin(a) * rr * 1.15));
    }
    return closed(ps, 0.8);
  };
  const blobs = EXITS.map((e, i) => ({c: seamPoint(e.id, e.s), r: (1.15 + 0.4 * hash(i * 3.3)) * grow, k: i}));
  return (
    <g opacity={a}>
      {blobs.map((b) => <path key={`x${b.k}`} d={blob(b.c, b.r, b.k, 1)} fill={C.hematoma} opacity={0.3} />)}
      {veil.map((d, i) => <path key={`v${i}`} d={d} fill={C.hematoma} opacity={0.1} />)}
      {halo.map((d, i) => <path key={`h${i}`} d={d} fill={C.hematoma} opacity={0.22} />)}
      {lips.map((d, i) => <path key={`l${i}`} d={d} fill={HEM_DEEP} opacity={0.26} />)}
      {blobs.map((b) => <path key={`y${b.k}`} d={blob(b.c, b.r, b.k + 20, 0.6)} fill={HEM_DEEP} opacity={0.26} />)}
    </g>
  );
};

// ---------------------------------------------------------------- 4. the callus cuff at the margins
type CuffSpec = {side: 1 | -1; yc: number; half: number; B: number; seed: number};
/** radial border: around both exits (C1 at y -1, C3 at y 9.6); ulnar border: around C1's exit (y 1.4) */
const CUFFS: CuffSpec[] = [
  {side: 1, yc: 4.4, half: 11.5, B: 2.2, seed: 1},
  {side: -1, yc: 1.4, half: 8.5, B: 1.9, seed: 2},
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
  const grow = clamp(h.soft * 1.1) * (1 - 0.94 * ss(h.remodel, 0, 1));
  const op = 1 - ss(h.remodel, 0.6, 1);
  if (grow < 0.01 || op < 0.01) return null;
  const px = st.px;
  const hard = clamp(h.hard), rem = clamp(h.remodel);
  const col = mix(mix(C.softCallus, C.newBone, hard), C.bone, rem);
  const colLit = mix(mix(C.softCallusLit, '#FFFFFF', hard), C.boneLit, rem);
  const colSh = mix(mix(SOFT_SH, HARD_SH, hard), C.boneShade, rem);
  const ink = mix(SOFT_INK, C.boneInk, hard);
  return (
    <g opacity={op}>
      {CUFFS.map((cf) => {
        if (cf.side < 0 && view[0] > -9) return null; // the ulnar border is off frame
        const ys = sample(cf.yc - cf.half, cf.yc + cf.half, 0.35);
        const bump = (y: number) => {
          const u = (y - cf.yc) / cf.half;
          if (Math.abs(u) >= 1) return 0;
          return (1 - u * u) ** 1.6 * (1 + 0.14 * noise1(y * 0.7 + cf.seed * 5, cf.seed));
        };
        const B = (y: number) => cf.B * grow * bump(y);
        const pts = ys.map((y) => borderAt(cf.side, y));
        const border = pts.map((q) => q.p);
        const outer = pts.map((q, i) => add(q.p, mul(q.n, B(ys[i]))));
        const mid = pts.map((q, i) => add(q.p, mul(q.n, B(ys[i]) * 0.48)));
        const inner = pts.map((q, i) => add(q.p, mul(q.n, -(0.25 + 0.75 * bump(ys[i])) * 0.85 * grow)));
        // the radial cuff sits on the shaded side (outer half in shade); the ulnar one on the lit side
        const outerTone = cf.side > 0 ? colSh : colLit;
        const fib: React.ReactNode[] = [];
        const fibA = (1 - hard) * clamp((0.06 - px) / 0.025);
        if (fibA > 0.01) {
          for (let k = 0; k < ys.length; k += 2) {
            const y = ys[k], b = B(y);
            if (b < 0.25) continue;
            const q = pts[k];
            const sw = 0.35 * Math.sin(k * 1.9 + cf.seed);
            const t = pt(-q.n.y, q.n.x);
            const a0 = add(q.p, mul(q.n, -0.5 * grow)), a1 = add(add(q.p, mul(q.n, b * 0.45)), mul(t, sw * 0.5)), a2 = add(add(q.p, mul(q.n, b * 0.88)), mul(t, sw));
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
              pores.push(<ellipse key={`${k}_${j}`} cx={q.x} cy={q.y} rx={rr * 1.6} ry={rr} transform={`rotate(${ang.toFixed(1)} ${q.x} ${q.y})`} fill={PORE} />);
            }
          }
        }
        return (
          <g key={cf.side}>
            <path d={poly([...inner, ...[...border].reverse()])} fill={colLit} opacity={0.38} />
            <path d={poly([...border, ...[...outer].reverse()])} fill={outerTone} />
            <path d={poly([...border, ...[...mid].reverse()])} fill={col} />
            {fib.length > 0 && <g fill="none" stroke={SOFT_FIB} strokeWidth={1.3 * px} strokeLinecap="round" opacity={0.7 * fibA}>{fib}</g>}
            {pores.length > 0 && <g opacity={0.85 * poreA}>{pores}</g>}
            <path d={open(outer, 0.5)} fill="none" stroke={ink} strokeWidth={2.4 * px} strokeLinecap="round" />
          </g>
        );
      })}
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
      <Hematoma st={st} />
      <Cuff st={st} view={view} />
    </g>
  );
};
