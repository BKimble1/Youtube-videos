// V3 (C): the micro bonding section ("even inside", film t ≈ 10.6–11.4 s). A side cross-section of the glue/bone
// interface about 2 mm across. World units are millimetres, x right, y down; the gap's centreline is y = 0.
//
// API
//   MicroWorld({id, t, cam, st})   the whole section, full frame (1080×1920). t = film time (s: drift of the fluid and
//                                  the cells); cam = Cam in world mm; st = MicroState:
//     flow 0..1  the adhesive front's position: 0 = just off the left edge of MICRO_IN, 1 = past its right edge. The
//                front advances left to right along the gap, its wetting tongues leading along both faces; it fills
//                the pores it passes, pushes the fluid (a lighter bow wave and streaks) and the red cells ahead of it
//                and toward the middle of the gap.
//     grip 0..1  the anchoring: the glue fingers in the pores run to the pore bottoms, swell to fill the undercuts
//                (the last pocket of trapped fluid goes), glue creeps into the fine canals off the deeper pores, and
//                the wetted contact line along both faces brightens. 0 = loose tongues, 1 = locked in.
//     wet  0..1  the amount of fluid: 1 = the gap ahead of the front full of watery blood with its cells (the film's
//                value), 0 = an empty dark gap, no cells.
//   MICRO_IN, MICRO_OUT            the entry framing (w 2.0 mm: the gap 162 px thick, centred at screen y 1000, like the
//                                  macro band of production/v2_match_band.json, ~165 px at x 540) and the end of the
//                                  push (w 1.45 mm, the band 223 px, same centre). Both put world (0, 0) at screen
//                                  (540, MICRO_Y), so zoomAbout between them is a pure push on the band.
//   microCam(t), microState(t)     the suggested camera and state curves for the film's 10.45–11.40 s window.
//   MICRO_BAND {top, bottom}       the two bone faces y(x) in world mm (for QA).
//
// Look. Bone above and below in the cutaway style of the oyster's section: cream lamellar matrix (fine lines parallel
// to the face, osteocyte lacunae with canaliculi, a few osteons round their canals), a warmer porous zone along each
// broken face (closed pores, micro-cracks), and a rough fracture surface (facets, steps) opened by pores, some
// flask-shaped (undercut), some shallow cups. The gap holds dark watery blood and a few red cells. The glue is the
// film's teal gel (fracture.tsx's colours): a deep strip under the shaded upper face, the core, one gloss streak in the
// lower third (where the macro band carries its own), a light lip on the lit lower face, a bright fresh meniscus at
// the front. Ink: bone faces in bone-ink, the gel's own edge in glue ink; line weights constant on screen. No text.
import React from 'react';
import {Cam, Layer, W, H, zoomAbout} from '../camera';
import {C} from './palette';
import {P, pt, add, mul, sub, nrm, perp, line, open, closed, tube, n4} from '../core/geo';
import {mix} from '../core/color';
import {clamp, ss, lerp, noise1, hash, keyS} from '../lib';
import BAND from '../../../production/v2_match_band.json';

const f = n4;
const TAU = Math.PI * 2;

export type MicroState = {flow: number; grip: number; wet: number};

// ------------------------------------------------------------------ colours
// the glue: exactly fracture.tsx's fresh (unset) gel
const LIP = mix(C.glue, C.glueLit, 0.42);
const CORE = mix(C.glue, C.glueDeep, 0.16);
const DEEP = mix(C.glueDeep, CORE, 0.36);
const FRESH_LIP = mix(C.glueLit, '#FFFFFF', 0.3);
const GLUE_EDGE = mix(C.glueInk, C.glueDeep, 0.3);
// the fluid: watery blood (dark, so the gap reads as the macro's dark seam; the cells brighter than it)
const FLUID = '#6C1D29';
const FLUID_TOP = '#4E101B';
const FLUID_LIT = '#9A434D';
const FLUID_DEEP = '#55121F';
const DRY = '#24090F';
const CELL = mix(C.bloodLit, '#E8414E', 0.45);
const CELL_RIM = '#6E0E1A';
const CELL_PALE = mix(CELL, '#F7A0A2', 0.38);
// the bone
const TAN_UP = mix(C.cancellous, C.boneShade, 0.35);
const TAN_LO = mix(C.cancellous, C.bone, 0.32);
const LAM = mix(C.bone, C.boneShade, 0.62);
const LAC = mix(C.boneDeep, C.boneInk, 0.25);
const PORE_CLOSED = mix(C.cancellousPore, C.boneInk, 0.15);
const CANAL = mix(C.cancellousPore, C.boneInk, 0.3);

// ------------------------------------------------------------------ the framings
/** the band's centre on screen (y px): the macro band's seam centreline at screen x 540 in the match framing
 *  (production/v2_match_band.json, ≈ 1000; the same point the oyster's OY_MATCH_Y uses) */
export const MICRO_Y = (() => {
  const cs = (BAND as unknown as {rows: {centre: number[]}[]}).rows.map((r) => r.centre).sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < cs.length; i++) if (cs[i][0] >= W / 2) return lerp(cs[i - 1][1], cs[i][1], (W / 2 - cs[i - 1][0]) / (cs[i][0] - cs[i - 1][0]));
  return 1000;
})();
export const MICRO_W_IN = 2.0;
export const MICRO_W_OUT = 1.45;
const camAt = (w: number): Cam => ({x: 0, y: -((MICRO_Y - H / 2) * w) / W, w});
export const MICRO_IN: Cam = camAt(MICRO_W_IN);
export const MICRO_OUT: Cam = camAt(MICRO_W_OUT);
/** the suggested window in film time (s): dissolve in from the macro push at T0, out to the macro by T1 */
export const MICRO_T0 = 10.45, MICRO_T1 = 11.4;
/** the suggested camera: one steady push (constant zoom rate, so it carries on the macro's push through the dissolve) */
export const microCam = (t: number): Cam => zoomAbout((t - MICRO_T0) / (MICRO_T1 - MICRO_T0), MICRO_IN, MICRO_OUT, (x) => x);
/** the suggested states: the front already a quarter of the frame in at the dissolve (teal on the left continues the
 *  macro band), crossing the whole frame during the window, slowing a little, its tongues leaving the pushed-in frame's
 *  right edge at ~11.3 s; the grip locking in over the second half */
export const microState = (t: number): MicroState => ({
  flow: keyS(t, [[MICRO_T0, 0.24], [MICRO_T1, 0.76]], (x) => x * (1.25 - 0.25 * x)),
  grip: ss(t, 10.8, 11.3),
  wet: 1,
});

// ------------------------------------------------------------------ the two bone faces
const GAP = 0.3;
const HALF = GAP / 2;
const XA = -2.1, XB = 2.1, DX = 0.005;
const XS: number[] = Array.from({length: Math.round((XB - XA) / DX) + 1}, (_, i) => XA + i * DX);
/** a crisp piecewise-linear jag in [-1, 1] (fracture facets) */
const jag = (x: number, cell: number, seed: number) => {
  const u = x / cell, i = Math.floor(u), fr = u - i;
  const a = hash(i * 1.37 + seed * 17.1) * 2 - 1, b = hash((i + 1) * 1.37 + seed * 17.1) * 2 - 1;
  return a + (b - a) * fr;
};
const sig = (x: number, w = 0.006) => 0.5 + 0.5 * Math.tanh(x / w);
/** steep-sided asperities (fracture steps) that stand into the gap */
const mesa = (x: number, list: [number, number, number][]) => list.reduce((a, [x0, x1, h]) => a + h * (sig(x - x0) - sig(x - x1, 0.012)), 0);
const MESA_T: [number, number, number][] = [[-1.32, -1.2, 0.016], [-0.42, -0.3, 0.014], [0.5, 0.6, 0.018], [1.33, 1.44, 0.013]];
const MESA_B: [number, number, number][] = [[-1.0, -0.9, 0.015], [-0.12, -0.02, 0.017], [0.72, 0.82, 0.012], [1.18, 1.27, 0.016]];
/** the low-frequency part of each face (the strips and zones follow it, without the fine roughness) */
const topLo = (x: number) => -HALF + 0.012 * Math.sin(1.7 * x + 0.6) + 0.016 * noise1(x * 5.5 + 3.1, 1);
const botLo = (x: number) => HALF + 0.012 * Math.sin(1.5 * x + 2.2) - 0.016 * noise1(x * 5.5 + 6.2, 2);
const fine = (x: number, seed: number) => 0.009 * noise1(x * 14 + 1.7, seed + 4) + 0.0055 * jag(x, 0.022, seed) + 0.003 * jag(x, 0.009, seed + 9);
/** the upper bone's broken face (bone above it) */
const yTop = (x: number) => topLo(x) + fine(x, 1) + mesa(x, MESA_T);
/** the lower bone's broken face (bone below it) */
const yBot = (x: number) => botLo(x) - fine(x, 2) - mesa(x, MESA_B);
export const MICRO_BAND = {top: yTop, bottom: yBot};
const faceY = (side: number, x: number) => (side < 0 ? yTop(x) : yBot(x));
const faceLo = (side: number, x: number) => (side < 0 ? topLo(x) : botLo(x));

// ------------------------------------------------------------------ the open pores
type PoreDef = [x: number, depth: number, r0: number, r1: number, tilt: number, bend: number];
const PORES_T: PoreDef[] = [
  [-1.52, 0.16, 0.018, 0.032, 0.25, 0.02],
  [-1.06, 0.26, 0.02, 0.042, -0.15, -0.03],
  [-0.64, 0.06, 0.036, 0.038, 0.1, 0],
  [-0.19, 0.22, 0.017, 0.037, 0.3, 0.04],
  [0.27, 0.29, 0.022, 0.046, -0.2, 0.02],
  [0.74, 0.07, 0.03, 0.034, 0, 0],
  [1.12, 0.2, 0.018, 0.038, 0.15, -0.03],
  [1.6, 0.24, 0.02, 0.04, -0.1, 0.02],
  // small pits and narrow pores between them
  [-1.3, 0.05, 0.022, 0.024, 0, 0],
  [-0.85, 0.1, 0.016, 0.026, -0.3, 0.01],
  [0.02, 0.05, 0.02, 0.022, 0.2, 0],
  [0.95, 0.12, 0.015, 0.027, 0.3, 0.01],
  [1.36, 0.05, 0.024, 0.026, 0, 0],
];
const PORES_B: PoreDef[] = [
  [-1.3, 0.22, 0.02, 0.04, -0.2, 0.03],
  [-0.83, 0.08, 0.032, 0.036, 0.1, 0],
  [-0.42, 0.28, 0.018, 0.045, 0.15, -0.03],
  [0.1, 0.18, 0.02, 0.035, -0.25, 0.02],
  [0.5, 0.065, 0.03, 0.032, 0, 0],
  [0.95, 0.27, 0.02, 0.045, 0.2, 0.03],
  [1.38, 0.15, 0.018, 0.03, -0.1, -0.02],
  [-1.07, 0.1, 0.016, 0.028, 0.2, 0.01],
  [-0.62, 0.05, 0.022, 0.024, 0, 0],
  [-0.17, 0.11, 0.015, 0.026, -0.2, 0],
  [0.3, 0.05, 0.025, 0.027, 0, 0],
  [0.73, 0.09, 0.016, 0.026, 0.25, 0.01],
  [1.17, 0.06, 0.02, 0.022, 0, 0],
];
type Branch = {a: P; d: P; len: number; u: number};
type Pore = {side: number; x: number; C: P[]; R: number[]; outline: P[]; walk: P[]; w: number; branches: Branch[]; seed: number};
const mkPore = (side: number, d: PoreDef, k: number): Pore => {
  const [x, depth, r0, r1, tilt, bend] = d;
  const C0 = pt(x, faceY(side, x) - side * 0.002);
  const dv = nrm(pt(Math.sin(tilt), side)); // into the bone
  const nv = perp(dv);
  const n = 16;
  const Cs: P[] = [], Rs: number[] = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    Cs.push(add(add(C0, mul(dv, u * depth)), mul(nv, bend * u * u)));
    Rs.push(lerp(r0, r1, ss(u, 0.08, 0.55)) * (1 - 0.3 * ss(u, 0.72, 1)) * (1 + 0.1 * noise1(u * 5 + k * 3.3, k + 20)));
  }
  const tb = tube(Cs, Rs, true, false);
  const outline = tb.outline;
  // walking the face left to right: the upper face goes up the pore's left wall (tube's right edge), the lower face
  // down its left wall (tube's left edge)
  const walk = side < 0 ? [...outline].reverse() : outline;
  const branches: Branch[] = [];
  if (depth > 0.15) {
    [0.55, 0.82].forEach((u, j) => {
      const i = Math.round(u * (n - 1));
      const s = j % 2 ? 1 : -1;
      const N = tb.N[i];
      const a = add(Cs[i], mul(N, s * Rs[i] * 0.85));
      const dd = nrm(add(mul(N, s), mul(dv, 0.55 + 0.3 * hash(k * 3.1 + j))));
      branches.push({a, d: dd, len: 0.045 + 0.035 * hash(k * 7.7 + j * 1.3), u});
    });
  }
  return {side, x, C: Cs, R: Rs, outline, walk, w: r0 * 1.2, branches, seed: k};
};
const PORES: Pore[] = [...PORES_T.map((d, k) => mkPore(-1, d, k)), ...PORES_B.map((d, k) => mkPore(1, d, k + 20))];
/** distance from p to the nearest open pore's wall region (negative inside) */
const poreDist = (p: P) =>
  PORES.reduce((m, q) => {
    let best = 1e9;
    q.C.forEach((c, i) => (best = Math.min(best, Math.hypot(p.x - c.x, p.y - c.y) - q.R[i])));
    return Math.min(m, best);
  }, 1e9);

/** one face walked left to right, detouring round each pore it opens into */
const faceWalk = (side: number): P[] => {
  const ps = PORES.filter((p) => p.side === side).sort((a, b) => a.x - b.x);
  const out: P[] = [];
  let pi = 0, inside = false;
  for (const x of XS) {
    const p = ps[pi];
    if (p && x >= p.x - p.w) {
      if (!inside) {
        out.push(...p.walk);
        inside = true;
      }
      if (x <= p.x + p.w) continue;
      pi++;
      inside = false;
    }
    out.push(pt(x, faceY(side, x)));
  }
  return out;
};
const WALK_T = faceWalk(-1), WALK_B = faceWalk(1);
const BONE_T = line([pt(XA, -6), ...WALK_T, pt(XB, -6)]) + 'Z';
const BONE_B = line([...WALK_B, pt(XB, 6), pt(XA, 6)]) + 'Z';
const GAP_D = line([...XS.map((x) => pt(x, yTop(x))), ...[...XS].reverse().map((x) => pt(x, yBot(x)))]) + 'Z';
/** the faces without the pore mouths (where the wetted contact line and the lit lip run) */
const faceRuns = (side: number): P[][] => {
  const ps = PORES.filter((p) => p.side === side);
  const out: P[][] = [];
  let cur: P[] = [];
  for (const x of XS) {
    if (ps.some((p) => Math.abs(x - p.x) <= p.w)) {
      if (cur.length > 1) out.push(cur);
      cur = [];
      continue;
    }
    cur.push(pt(x, faceY(side, x)));
  }
  if (cur.length > 1) out.push(cur);
  return out;
};
const RUNS_T = faceRuns(-1).map((r) => line(r)).join('');
const RUNS_B = faceRuns(1).map((r) => line(r)).join('');
const LIT_LIP_B = faceRuns(1)
  .map((r) => line(r.map((p) => pt(p.x, p.y + 0.0065))))
  .join('');
const PORE_WALLS = PORES.map((p) => line(p.outline)).join('');

// ------------------------------------------------------------------ the bone's texture (static)
/** depth of the porous zone along each face */
const zoneD = (side: number, x: number) => 0.15 + 0.045 * noise1(x * 3.1 + (side < 0 ? 0 : 9), 31) + 0.02 * noise1(x * 9 + 2, 32);
const zonePath = (side: number, extra: number) => {
  const outer = XS.map((x) => pt(x, faceY(side, x) - side * 0.03));
  const inner = [...XS].reverse().map((x) => pt(x, faceLo(side, x) + side * (zoneD(side, x) + extra)));
  return line([...outer, ...inner]) + 'Z';
};
type Osteon = {c: P; r: number; rot: number; seed: number};
const OSTEONS: Osteon[] = [
  {c: pt(-0.92, -0.86), r: 0.15, rot: 0.3, seed: 1},
  {c: pt(0.12, -0.74), r: 0.13, rot: 1.2, seed: 2},
  {c: pt(0.92, -1.08), r: 0.17, rot: 2.1, seed: 3},
  {c: pt(-0.3, -1.46), r: 0.15, rot: 0.8, seed: 4},
  {c: pt(0.55, -1.72), r: 0.12, rot: 2.6, seed: 5},
  {c: pt(-1.3, -1.55), r: 0.14, rot: 1.7, seed: 6},
  {c: pt(-0.7, 0.8), r: 0.14, rot: 0.5, seed: 7},
  {c: pt(0.42, 0.9), r: 0.16, rot: 1.4, seed: 8},
  {c: pt(1.25, 0.72), r: 0.13, rot: 2.3, seed: 9},
  {c: pt(-0.05, 1.42), r: 0.15, rot: 0.2, seed: 10},
  {c: pt(-1.15, 1.35), r: 0.13, rot: 1.9, seed: 11},
  {c: pt(0.95, 1.55), r: 0.14, rot: 2.8, seed: 12},
];
const wobRing = (c: P, r: number, seed: number, rot: number, n = 40): P[] =>
  Array.from({length: n}, (_, i) => {
    const a = (i / n) * TAU;
    const rr = r * (1 + 0.07 * Math.sin(3 * a + seed) + 0.04 * Math.sin(5 * a + seed * 2.3));
    const e = 0.86; // a little oval, as cut slightly obliquely
    const x0 = rr * Math.cos(a), y0 = rr * Math.sin(a) * e;
    return pt(c.x + x0 * Math.cos(rot) - y0 * Math.sin(rot), c.y + x0 * Math.sin(rot) + y0 * Math.cos(rot));
  });
const inOsteon = (p: P, k = 1.08) => OSTEONS.some((o) => Math.hypot(p.x - o.c.x, p.y - o.c.y) < o.r * k);
/** an osteocyte lacuna: a small almond along angle a, with its canaliculi */
const lacuna = (c: P, a: number, L: number, Wd: number, seed: number) => {
  const d = pt(Math.cos(a), Math.sin(a)), n = pt(-d.y, d.x);
  const at = (u: number, v: number) => add(c, add(mul(d, u), mul(n, v)));
  const body = line([at(-L / 2, 0), at(-L * 0.2, -Wd / 2), at(L * 0.22, -Wd * 0.45), at(L / 2, 0), at(L * 0.18, Wd / 2), at(-L * 0.25, Wd * 0.45)]) + 'Z';
  let hairs = '';
  for (let q = 0; q < 2; q++) {
    const s = q % 2 ? 1 : -1;
    const u0 = (q ? 0.12 : -0.14) * L;
    const ang = a + s * (Math.PI / 2) + (hash(seed * 3.1 + q) - 0.5) * 0.9;
    const l = 0.008 + 0.007 * hash(seed * 5.7 + q * 2.1);
    const p0 = at(u0, (s * Wd) / 2);
    hairs += `M${f(p0.x)} ${f(p0.y)}L${f(p0.x + Math.cos(ang) * l)} ${f(p0.y + Math.sin(ang) * l)}`;
  }
  return {body, hairs};
};
const TEX = (() => {
  // lamellae: fine lines parallel to each face, flattening with depth, broken into runs; stopped round the osteons
  const lam: string[] = [];
  [-1, 1].forEach((side) => {
    for (let k = 0; k < 34; k++) {
      const d = 0.2 + 0.052 * k + 0.01 * hash(k * 1.7 + side);
      const fl = clamp(d / 1.2);
      let cur: P[] = [];
      const flush = () => {
        if (cur.length > 2) lam.push(open(cur, 0.5));
        cur = [];
      };
      for (let x = XA; x <= XB; x += 0.02) {
        const y = lerp(faceLo(side, x), side * HALF, fl) + side * d + 0.012 * Math.sin(x * (2.2 + 0.1 * k) + k * 1.3);
        const p = pt(x, y);
        const keep = noise1(x * 2.3 + k * 7.1, k + side * 50) > -0.35 && !inOsteon(p, 1.12) && Math.abs(y) < 2.3 && poreDist(p) > 0.015;
        if (keep) cur.push(p);
        else flush();
      }
      flush();
    }
  });
  // lacunae across the matrix (fewer in the porous zone)
  let lacB = '', lacH = '';
  const cell = 0.14;
  let si = 0;
  [-1, 1].forEach((side) => {
    for (let i = Math.floor(XA / cell); i <= Math.ceil(XB / cell); i++) {
      for (let j = 0; j < 22; j++) {
        si++;
        const x = (i + 0.15 + 0.7 * hash(i * 3.13 + j * 7.77 + side)) * cell;
        const dep = 0.05 + (j + 0.15 + 0.7 * hash(i * 5.71 + j * 2.39 + side * 3)) * cell;
        const y = faceLo(side, x) + side * dep;
        const p = pt(x, y);
        if (hash(i * 9.1 + j * 4.3 + side * 2) < 0.22) continue;
        if (dep < zoneD(side, x) && hash(i * 2.2 + j * 6.6 + side) < 0.55) continue;
        if (inOsteon(p, 1.15) || poreDist(p) < 0.025) continue;
        const a = 0.12 * noise1(x * 3 + dep * 2, 7) + (hash(si * 1.9) - 0.5) * 0.35 + (dep < zoneD(side, x) ? (hash(si * 4.1) - 0.5) * 1.2 : 0);
        const L = 0.026 + 0.01 * hash(si * 2.7), Wd = 0.0095 + 0.003 * hash(si * 3.9);
        const q = lacuna(p, a, L, Wd, si);
        lacB += q.body;
        lacH += q.hairs;
      }
    }
  });
  // osteons: a lighter disc inside its cement line, three concentric lamellae, lacunae on the rings, the canal
  const ost = OSTEONS.map((o) => {
    const cement = closed(wobRing(o.c, o.r, o.seed, o.rot), 1);
    const rings = [0.36, 0.6, 0.82].map((k) => closed(wobRing(o.c, o.r * k, o.seed + k * 5, o.rot), 1));
    let lb = '', lh = '';
    [0.48, 0.72].forEach((k, ri) => {
      const n = ri ? 9 : 6;
      for (let q = 0; q < n; q++) {
        const a = (q / n) * TAU + o.seed * 0.7 + ri * 0.4 + (hash(o.seed * 3 + q) - 0.5) * 0.3;
        const c = pt(o.c.x + Math.cos(a) * o.r * k, o.c.y + Math.sin(a) * o.r * k * 0.86);
        const lc = lacuna(c, a + Math.PI / 2, 0.022, 0.0085, o.seed * 31 + q + ri * 11);
        lb += lc.body;
        lh += lc.hairs;
      }
    });
    const canal = closed(wobRing(o.c, o.r * 0.17, o.seed + 9, o.rot), 1);
    return {cement, rings, lb, lh, canal};
  });
  // closed pores in the porous zone (vascular spaces cut in the section)
  const closedPores: {c: P; rx: number; ry: number; a: number}[] = [];
  [-1, 1].forEach((side) => {
    for (let k = 0; k < 30; k++) {
      const x = XA + 0.1 + (k + hash(k * 3.3 + side)) * ((XB - XA - 0.2) / 30);
      const r = 0.014 + 0.022 * hash(k * 5.1 + side * 2);
      const dep = r + 0.025 + (zoneD(side, x) - r - 0.02) * hash(k * 7.9 + side * 3);
      const c = pt(x, faceLo(side, x) + side * dep);
      if (poreDist(c) < r * 1.5 + 0.03) continue;
      if (hash(k * 1.1 + side * 9) < 0.3) continue;
      closedPores.push({c, rx: r * (1.2 + 0.5 * hash(k * 2.6)), ry: r, a: (hash(k * 8.8 + side) - 0.5) * 0.6});
    }
  });
  // micro-cracks running in from each face
  const cracks: string[] = [];
  [[-1, -0.86, 0.4], [-1, 0.52, -0.3], [-1, 1.36, 0.2], [1, -1.08, -0.35], [1, 0.3, 0.3], [1, 1.17, -0.2]].forEach(([side, x0, lean], k) => {
    const ps: P[] = [pt(x0, faceY(side, x0))];
    let p = ps[0];
    const n = 5 + Math.floor(hash(k * 4.4) * 3);
    for (let i = 0; i < n; i++) {
      p = add(p, pt(lean * 0.03 + (hash(k * 9.1 + i * 2.7) - 0.5) * 0.03, side * (0.022 + 0.012 * hash(k + i * 3.3))));
      ps.push(p);
    }
    cracks.push(line(ps));
  });
  return {lam: lam.join(''), lacB, lacH, ost, closedPores, cracks};
})();

// ------------------------------------------------------------------ the front, the fingers, the cells
const X0F = -1.25, X1F = 1.5;
/** how far the wetting tongues lead along the faces (mm) */
const LEAD = 0.085;
const frontCentre = (flow: number) => lerp(X0F, X1F, clamp(flow));
/** the front's x at v (-1 = upper face, 1 = lower face): concave, its tongues ahead along both faces */
const frontX = (xf: number, v: number, t: number) => xf + LEAD * v * v + 0.005 * Math.sin(v * 4 + t * 7);
const frontPts = (xf: number, t: number, dx = 0) => {
  const out: P[] = [];
  for (let v = -1.9; v <= 1.9001; v += 0.1) out.push(pt(frontX(xf, v, t) + dx, v * HALF));
  return out;
};
/** a pore's glue finger: q = depth reached (0..1 of the axis), fr = radius factor (the bone clips any excess) */
const fingerPts = (p: Pore, q: number, fr: number): P[] | null => {
  const n = p.C.length;
  const e = clamp(q) * (n - 1);
  if (e < 0.4) return null;
  const k = Math.floor(e);
  const rf = (i: number) => lerp(1.3, fr, ss(i / (n - 1), 0, 0.3));
  const Cs = p.C.slice(0, k + 1);
  const Rs = p.R.slice(0, k + 1).map((r, i) => r * rf(i));
  if (e > k + 1e-3 && k + 1 < n) {
    const u = e - k;
    Cs.push(add(p.C[k], mul(sub(p.C[k + 1], p.C[k]), u)));
    Rs.push(lerp(p.R[k], p.R[k + 1], u) * rf(e));
  }
  if (Cs.length < 2) {
    Cs.push(add(Cs[0], mul(sub(p.C[1], p.C[0]), 0.5)));
    Rs.push(Rs[0]);
  }
  return tube(Cs, Rs, true, false).outline;
};
type Cell = {x: number; v: number; r: number; vx: number; ph: number; rot: number; m: number; h: number};
const N_CELLS = 17;
const CELLS: Cell[] = Array.from({length: N_CELLS}, (_, i) => ({
  x: -0.5 + (2.0 * (i + 0.1 + 0.8 * hash(i * 3.7 + 0.2))) / N_CELLS,
  v: (hash(i * 5.3 + 1.1) * 2 - 1) * 0.56,
  r: 0.025 + 0.007 * hash(i * 2.9),
  vx: 0.05 + 0.07 * hash(i * 6.1),
  ph: hash(i * 8.3) * TAU,
  rot: (hash(i * 4.7) - 0.5) * 120,
  m: 0.05 + 0.3 * hash(i * 9.7),
  h: hash(i * 1.9 + 0.7),
}));
type Streak = {x: number; v: number; len: number; vx: number; ph: number};
const STREAKS: Streak[] = Array.from({length: 22}, (_, i) => ({
  x: XA + ((XB - XA) * (i + hash(i * 2.3))) / 22,
  v: (hash(i * 7.1 + 3) * 2 - 1) * 0.75,
  len: 0.05 + 0.08 * hash(i * 4.9),
  vx: 0.08 + 0.08 * hash(i * 3.3),
  ph: hash(i * 5.5) * TAU,
}));
const softplus = (z: number, k: number) => (z > 20 * k ? z : k * Math.log(1 + Math.exp(z / k)));
/** where a drifting thing at (xFree, v) is once the front at xf has pushed it: piled ahead of the front (m ahead) and
 *  squeezed toward the middle of the gap; k = 0 untouched .. 1 riding the front */
const pushed = (xFree: number, v: number, xf: number, t: number, m: number) => {
  const xF = frontX(xf, v, t);
  const d = xFree - xF;
  const k = clamp((0.3 - (d - m)) / 0.34);
  const x = xF + m + softplus(d - m, 0.07);
  return {x, v: v * (1 - 0.4 * k), k};
};

// ------------------------------------------------------------------ drawing
const Bone: React.FC<{id: string; side: number; px: number}> = ({id, side, px}) => {
  const d = side < 0 ? BONE_T : BONE_B;
  const clip = `${id}-c`;
  const grad = `${id}-g`;
  const tan = side < 0 ? TAN_UP : TAN_LO;
  const os = TEX.ost.filter((_, i) => Math.sign(OSTEONS[i].c.y) === side);
  return (
    <g>
      <defs>
        <clipPath id={clip}>
          <path d={d} />
        </clipPath>
        {side < 0 ? (
          <linearGradient id={grad} gradientUnits="userSpaceOnUse" x1={-1} y1={-1.9} x2={0.4} y2={-0.12}>
            <stop offset={0} stopColor={mix(C.bone, C.boneLit, 0.55)} />
            <stop offset={0.75} stopColor={C.bone} />
            <stop offset={1} stopColor={mix(C.bone, C.boneShade, 0.3)} />
          </linearGradient>
        ) : (
          <linearGradient id={grad} gradientUnits="userSpaceOnUse" x1={-0.6} y1={0.12} x2={0.8} y2={1.9}>
            <stop offset={0} stopColor={mix(C.bone, C.boneLit, 0.6)} />
            <stop offset={0.5} stopColor={C.bone} />
            <stop offset={1} stopColor={mix(C.bone, C.boneShade, 0.35)} />
          </linearGradient>
        )}
      </defs>
      <path d={d} fill={`url(#${grad})`} />
      <g clipPath={`url(#${clip})`}>
        {/* the lamellar matrix */}
        <path d={TEX.lam} fill="none" stroke={LAM} strokeWidth={f(1.6 * px)} opacity={0.55} strokeLinecap="round" />
        {/* the osteons */}
        {os.map((o, i) => (
          <g key={i}>
            <path d={o.cement} fill={mix(C.bone, C.boneLit, 0.3)} stroke={LAM} strokeWidth={f(1.4 * px)} opacity={0.85} />
            {o.rings.map((r, k) => (
              <path key={k} d={r} fill="none" stroke={LAM} strokeWidth={f(1.1 * px)} opacity={0.32} />
            ))}
            <path d={o.lh} fill="none" stroke={LAC} strokeWidth={f(0.9 * px)} opacity={0.2} />
            <path d={o.lb} fill={LAC} opacity={0.42} />
            <path d={o.canal} fill={CANAL} stroke={mix(C.boneInk, C.boneDeep, 0.3)} strokeWidth={f(1.3 * px)} />
          </g>
        ))}
        {/* the porous zone along the broken face: a soft edge, then the warm band */}
        <path d={zonePath(side, 0.035)} fill={mix(tan, C.bone, 0.55)} opacity={0.8} />
        <path d={zonePath(side, 0)} fill={tan} />
        {TEX.closedPores
          .filter((q) => Math.sign(q.c.y) === side)
          .map((q, i) => (
            <g key={`p${i}`} transform={`rotate(${f((q.a * 180) / Math.PI)} ${f(q.c.x)} ${f(q.c.y)})`}>
              <ellipse cx={f(q.c.x)} cy={f(q.c.y)} rx={f(q.rx)} ry={f(q.ry)} fill={PORE_CLOSED} stroke={mix(C.boneDeep, C.boneInk, 0.4)} strokeWidth={f(1.2 * px)} />
              <ellipse cx={f(q.c.x + q.rx * 0.12)} cy={f(q.c.y + q.ry * 0.18)} rx={f(q.rx * 0.72)} ry={f(q.ry * 0.62)} fill={mix(PORE_CLOSED, C.bone, 0.18)} />
            </g>
          ))}
        {/* the osteocyte lacunae */}
        <path d={TEX.lacH} fill="none" stroke={LAC} strokeWidth={f(0.9 * px)} opacity={0.28} />
        <path d={TEX.lacB} fill={LAC} opacity={0.62} />
        {/* micro-cracks from the face */}
        <path d={TEX.cracks.join('')} fill="none" stroke={C.boneInk} strokeWidth={f(1.4 * px)} opacity={0.7} strokeLinecap="round" strokeLinejoin="round" />
        {/* a shade just inside every wall the cavity touches (faces and pores) */}
        <path d={d} fill="none" stroke={side < 0 ? mix(C.boneShade, C.boneDeep, 0.45) : C.boneShade} strokeWidth={f(11 * px)} opacity={side < 0 ? 0.5 : 0.35} />
        {/* the lit lower face catches the light along its rim */}
        {side > 0 && <path d={LIT_LIP_B} fill="none" stroke={C.boneLit} strokeWidth={f(2.2 * px)} opacity={0.75} />}
      </g>
      <path d={line(side < 0 ? WALK_T : WALK_B)} fill="none" stroke={C.boneInk} strokeWidth={f(2.3 * px)} strokeLinejoin="round" />
    </g>
  );
};

export const MicroWorld: React.FC<{id: string; t: number; cam: Cam; st: MicroState}> = ({id, t, cam, st}) => {
  const px = cam.w / W;
  const flow = clamp(st.flow), grip = clamp(st.grip), wet = clamp(st.wet);
  const xf = frontCentre(flow);
  const glueOn = frontX(xf, 1, t) > -2;
  const fluid = mix(DRY, FLUID, wet);
  const fluidTop = mix(DRY, FLUID_TOP, wet);
  const fluidDeep = mix(DRY, FLUID_DEEP, wet);
  const ids = {gap: `${id}-gap`, body: `${id}-body`, fing: `${id}-fing`, fl: `${id}-fl`, bow: `${id}-bow`, sl: `${id}-sl`};
  // the glue body (x < front), clipped to the gap; the fingers in the pores it has passed
  const fp = frontPts(xf, t);
  const bodyD = line([pt(XA - 1, -1.9 * HALF), ...fp, pt(XA - 1, 1.9 * HALF)]) + 'Z';
  const fingers = PORES.map((p) => {
    const pf = ss(xf + LEAD - p.x, -0.01, 0.17);
    if (pf <= 0.001) return null;
    const q = pf * (0.6 + 0.4 * grip);
    const fr = 0.72 + 0.45 * grip;
    const o = fingerPts(p, q, fr);
    return o ? {p, d: line(o) + 'Z', q, pf} : null;
  }).filter((x): x is NonNullable<typeof x> => x !== null);
  // the shading strips, the gloss streak, the fresh meniscus
  const xEnd = Math.min(XB, xf + LEAD + 0.3);
  const xsG = XS.filter((x) => x <= xEnd);
  const deepD = xsG.length > 1 ? line([...xsG.map((x) => pt(x, topLo(x) - 0.06)), ...[...xsG].reverse().map((x) => pt(x, topLo(x) + 0.075))]) + 'Z' : '';
  const lipD = xsG.length > 1 ? line([...xsG.map((x) => pt(x, botLo(x) - 0.042)), ...[...xsG].reverse().map((x) => pt(x, botLo(x) + 0.06))]) + 'Z' : '';
  const streak: P[][] = [];
  {
    let cur: P[] = [];
    for (let x = XA; x <= xf - 0.05; x += 0.02) {
      if (noise1(x * 1.2 + 4.2, 13) > -0.5) cur.push(pt(x, lerp(topLo(x), botLo(x), 0.72)));
      else if (cur.length) (streak.push(cur), (cur = []));
    }
    if (cur.length > 1) streak.push(cur);
  }
  const freshD = line([...fp, ...[...frontPts(xf, t, -0.036)].reverse()]) + 'Z';
  const gloss = frontPts(xf, t, -0.055).filter((p) => p.y > -0.8 * HALF && p.y < 0.25 * HALF);
  // the cells and streaks, pushed by the front
  const cells = CELLS.filter((c) => c.h < 0.3 + 0.7 * wet).map((c, i) => {
    const xFree = c.x + c.vx * (t - 10.6) + 0.008 * Math.sin(t * 1.7 + c.ph);
    const vFree = c.v + 0.06 * Math.sin(t * 1.1 + c.ph * 2);
    const q = glueOn ? pushed(xFree, vFree, xf, t, c.m) : {x: xFree, v: vFree, k: 0};
    const sq = 0.4 + 0.6 * Math.abs(Math.cos(c.ph + 2.6 * q.k + 0.6 * t));
    const rot = c.rot + 40 * q.k + 10 * Math.sin(t * 1.3 + i);
    return {x: q.x, y: q.v * HALF, r: c.r, sq, rot, key: i};
  });
  const streaks = STREAKS.map((s, i) => {
    const xFree = XA + ((((s.x - XA) + s.vx * (t - 10)) % (XB - XA)) + (XB - XA)) % (XB - XA);
    const q = glueOn ? pushed(xFree, s.v, xf, t, 0.02 + 0.05 * hash(i * 2.1)) : {x: xFree, v: s.v, k: 0};
    const len = s.len * (1 + 1.6 * q.k);
    const y = q.v * HALF + 0.006 * Math.sin(t * 2 + s.ph);
    const bow = 0.008 * (1 + q.k);
    return {d: `M${f(q.x - len / 2)} ${f(y)}Q${f(q.x)} ${f(y - bow)} ${f(q.x + len / 2)} ${f(y)}`, op: wet * (0.26 + 0.44 * q.k), w: 2 + 1.6 * q.k};
  });
  const viewX0 = cam.x - (W / 2) * px, viewY0 = cam.y - (H / 2) * px;
  const contactW = (1.3 + 1.7 * grip) * px * 2;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: fluid}}>
      <Layer c={cam} z={0}>
        <defs>
          <clipPath id={ids.gap}>
            <path d={GAP_D} />
          </clipPath>
          <clipPath id={ids.body}>
            <path d={bodyD} />
          </clipPath>
          <clipPath id={ids.fing}>
            {fingers.map((g, i) => (
              <path key={i} d={g.d} />
            ))}
          </clipPath>
          <linearGradient id={ids.fl} gradientUnits="userSpaceOnUse" x1={0} y1={-HALF} x2={0} y2={HALF}>
            <stop offset={0} stopColor={fluidTop} />
            <stop offset={0.55} stopColor={fluid} />
            <stop offset={1} stopColor={mix(fluid, FLUID_LIT, 0.35 * wet)} />
          </linearGradient>
          <linearGradient id={ids.bow} gradientUnits="userSpaceOnUse" x1={f(xf)} y1={0} x2={f(xf + LEAD + 0.26)} y2={0}>
            <stop offset={0} stopColor={FLUID_LIT} stopOpacity={0.7 * wet} />
            <stop offset={0.45} stopColor={FLUID_LIT} stopOpacity={0.3 * wet} />
            <stop offset={1} stopColor={FLUID_LIT} stopOpacity={0} />
          </linearGradient>
        </defs>
        {/* 1. the fluid in the gap and the pores */}
        <rect x={-4} y={-1} width={8} height={2} fill={`url(#${ids.fl})`} />
        {PORES.map((p, i) => (
          <path key={`pf${i}`} d={line(p.outline) + 'Z'} fill={fluidDeep} />
        ))}
        {/* 2. the fluid's motion: the bow wave ahead of the front, streaks, the cells */}
        <g clipPath={`url(#${ids.gap})`}>
          {glueOn && <path d={line([...fp, ...[...frontPts(xf, t, LEAD + 0.3)].reverse()]) + 'Z'} fill={`url(#${ids.bow})`} />}
          <g fill="none" stroke={FLUID_LIT} strokeLinecap="round">
            {streaks.map((s, i) => (
              <path key={i} d={s.d} strokeWidth={f(s.w * px)} opacity={f(s.op)} />
            ))}
          </g>
        </g>
        {cells.map((c) => (
          <g key={`c${c.key}`} transform={`translate(${f(c.x)} ${f(c.y)}) rotate(${f(c.rot)})`} opacity={f(ss(wet, 0.1, 0.5))}>
            <ellipse rx={f(c.r)} ry={f(c.r * c.sq)} fill={CELL} stroke={CELL_RIM} strokeWidth={f(1.8 * px)} />
            {c.sq > 0.5 && <ellipse cx={f(c.r * 0.06)} cy={f(c.r * 0.08 * c.sq)} rx={f(c.r * 0.46)} ry={f(c.r * 0.46 * c.sq)} fill={CELL_PALE} opacity={f(ss(c.sq, 0.5, 0.85) * 0.85)} />}
            <ellipse cx={f(-c.r * 0.42)} cy={f(-c.r * 0.5 * c.sq)} rx={f(c.r * 0.26)} ry={f(c.r * 0.12 * c.sq + 0.002)} fill="#FFE6E6" opacity={0.55} />
          </g>
        ))}
        {/* 3. the glue: its edge (front and fingers) in glue ink, then the gel */}
        {glueOn && (
          <g>
            <g clipPath={`url(#${ids.gap})`}>
              <path d={bodyD} fill={GLUE_EDGE} stroke={GLUE_EDGE} strokeWidth={f(4.6 * px)} strokeLinejoin="round" />
            </g>
            {fingers.map((g, i) => (
              <path key={`fi${i}`} d={g.d} fill={GLUE_EDGE} stroke={GLUE_EDGE} strokeWidth={f(4.2 * px)} strokeLinejoin="round" />
            ))}
            <g clipPath={`url(#${ids.gap})`}>
              <g clipPath={`url(#${ids.body})`}>
                <rect x={-4} y={-1} width={8} height={2} fill={CORE} />
                {deepD && <path d={deepD} fill={DEEP} />}
                {lipD && <path d={lipD} fill={LIP} />}
                <path d={freshD} fill={FRESH_LIP} opacity={0.8} />
                <g fill="none" stroke={C.glueShine} strokeLinecap="round" strokeLinejoin="round">
                  {streak.map((s, i) => (
                    <path key={i} d={open(s, 0.5)} strokeWidth={f(5.5 * px)} opacity={0.9} />
                  ))}
                  {gloss.length > 1 && <path d={open(gloss, 0.5)} strokeWidth={f(4.5 * px)} opacity={0.9} />}
                </g>
              </g>
            </g>
            {fingers.map((g, i) => {
              const up = g.p.side < 0;
              const n = Math.max(2, Math.floor(g.q * (g.p.C.length - 1)) - 1);
              const hl = g.p.C.slice(1, n).map((c, k) => add(c, mul(pt(-0.42, up ? 0.1 : -0.1), g.p.R[k + 1])));
              return (
                <g key={`ff${i}`}>
                  <path d={g.d} fill={up ? mix(CORE, DEEP, 0.55) : CORE} />
                  {hl.length > 1 && <path d={open(hl, 0.5)} fill="none" stroke={C.glueShine} strokeWidth={f(2.4 * px)} opacity={up ? 0.35 : 0.6} strokeLinecap="round" />}
                </g>
              );
            })}
            {/* the wetted contact line: where the gel touches bone (faces and pore walls), brightening as it grips */}
            <g fill="none" stroke={C.glueLit} strokeWidth={f(contactW)} strokeLinejoin="round" opacity={f(0.5 + 0.5 * grip)}>
              <g clipPath={`url(#${ids.body})`}>
                <path d={RUNS_T + RUNS_B} />
              </g>
              {fingers.length > 0 && (
                <g clipPath={`url(#${ids.fing})`}>
                  <path d={PORE_WALLS} />
                </g>
              )}
            </g>
          </g>
        )}
        {/* 4. the bone, above and below */}
        <Bone id={`${id}-bt`} side={-1} px={px} />
        <Bone id={`${id}-bb`} side={1} px={px} />
        {/* 5. the fine canals off the deeper pores: dark (fluid) until the grip drives glue into them */}
        {PORES.flatMap((p, pi) =>
          p.branches.map((b, k) => {
            const g = fingers.find((x) => x.p === p);
            const reach = g ? clamp((g.q - b.u + 0.05) / 0.15) : 0;
            const gb = reach * ss(grip, 0.15 + 0.15 * k, 0.7 + 0.15 * k);
            const end = add(b.a, mul(b.d, b.len));
            const mid = add(add(b.a, mul(b.d, b.len * 0.5)), mul(perp(b.d), b.len * 0.12));
            const dFull = `M${f(b.a.x)} ${f(b.a.y)}Q${f(mid.x)} ${f(mid.y)} ${f(end.x)} ${f(end.y)}`;
            const e2 = add(b.a, mul(b.d, b.len * gb));
            const m2 = add(add(b.a, mul(b.d, b.len * gb * 0.5)), mul(perp(b.d), b.len * gb * 0.12));
            const dG = `M${f(b.a.x)} ${f(b.a.y)}Q${f(m2.x)} ${f(m2.y)} ${f(e2.x)} ${f(e2.y)}`;
            return (
              <g key={`b${pi}_${k}`} fill="none" strokeLinecap="round">
                <path d={dFull} stroke={mix(fluidDeep, C.boneDeep, 0.35)} strokeWidth={f(2.2 * px)} opacity={0.85} />
                {gb > 0.02 && <path d={dG} stroke={GLUE_EDGE} strokeWidth={f(4.2 * px)} />}
                {gb > 0.02 && <path d={dG} stroke={mix(CORE, C.glueLit, 0.3)} strokeWidth={f(2.2 * px)} />}
              </g>
            );
          }),
        )}
        {/* 6. the cut face is lit from the upper left */}
        <defs>
          <linearGradient id={ids.sl} gradientUnits="userSpaceOnUse" x1={f(viewX0)} y1={f(viewY0)} x2={f(viewX0 + W * px)} y2={f(viewY0 + H * px)}>
            <stop offset={0} stopColor="#FFFFFF" stopOpacity={0.07} />
            <stop offset={0.45} stopColor="#FFFFFF" stopOpacity={0} />
            <stop offset={0.7} stopColor="#2A1A10" stopOpacity={0} />
            <stop offset={1} stopColor="#2A1A10" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <rect x={f(viewX0)} y={f(viewY0)} width={f(W * px)} height={f(H * px)} fill={`url(#${ids.sl})`} />
      </Layer>
    </div>
  );
};

/** for QA: the front's centre x (world mm) at a flow value */
export const microFrontX = frontCentre;