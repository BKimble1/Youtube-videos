// S4 STOMACH (5.78–8.90 s; renders 5.5–9.1): a newly drawn stomach interior.
//
// "Inside the fish's stomach, / the eel starts backing up."
//
// The drawing is a 2D illustration of the chamber's wall (WORLD units = eel units; y down), seen through a simple
// pinhole camera that only translates and dollies (no roll, so the key light stays at the screen's upper left):
//   screen = (540, 960) + F · (w − c) / (D + z)
// z = 0 is the wall the eel lies on; the passage beyond the opening is at z > 0 (it recedes, and the push into it
// has real parallax); a few soft near folds and bubbles float at z < 0. The scale of the wall is s = F / D px per eel
// unit: 55 on the carried tail, 34 on the wide view, ~50 while the tail searches (head and tip both in frame), then
// the dive into the opening (to D = 0.5, inside the rim).
//
// The eel is ONE body on ONE track (ROUTE: the coil, out along the wall, round the fold, into the opening), laid on it
// tail first (alongPath); its tip arc length never decreases, so no part ever slides backward. On top of the track:
// the carried tail (blended out in heading space), a bend of the last ~7 units (twitch, flinch, turn, search) and of
// the head, a small reverse undulation; past the lumen's rim the body bends over the lip and runs down the passage.
//
// Beats (global s; S4_BEATS):
//   5.50–5.94  hand-off 1: samples 93..120 lie EXACTLY on carryTail(t) (the X-ray dissolves into us over 5.72–5.84);
//              the coil and the head are off-frame, the body runs out of frame at the lower right
//   5.94–6.90  pull back: the tail settles beside the coil; the chamber, the coil and the head (eye) come into view
//   6.90–7.22  "Inside the fish's stomach": the eel rests coiled, the head stirs, the tip twitches, then lifts
//   7.22–7.45  "the eel starts": the tail tip slides up the wall, tail first, the body following on the same track
//   7.45       it BUMPS the fold lying across its way (the fold dents and wobbles, a dimple at the tip), flinches,
//   7.50–7.62  turns hard right along the fold
//   7.62–7.95  it searches along the fold's underside: two sweeps off it and back against it (touches 7.76, 7.93)
//   7.95–8.10  it reaches the pucker's ring, feels across it and darts to the centre ("backing" 7.93–8.36)
//   8.10–8.30  it presses; the opening YIELDS around it (8.13–8.30, open ≈ 8.2) and the tip goes in
//   8.24–8.90  the body slides in after it; the camera follows the tip through (the closest push)
//   8.90       hand-off 3: the dark lumen (LUMEN) fills ≥ 85 % of the frame
import React from 'react';
import {P} from '../../core/geo';
import {lit, mix} from '../../core/color';
import {uid} from '../../core/ids';
import {clamp, hash, keyS, lerp, noise1, ring, ss, ss5} from '../../lib';
import {C, INK, NS} from '../../art/palette';
import {eelSilhouette} from '../../art/eelArt';
import {alongPath, at2, Eel2D, EEL_L, N, path2, Path2, RADII} from '../eelV4';
import {carryTail, CARRY1, KEEP_Y, KeepOut, LUMEN} from '../timing';

const DEG = Math.PI / 180;
const CS: P = {x: 540, y: 960};
/** focal length (px · eel units): the wall's scale is s = F / D */
const F = 1120;
const S_CARRY = 55;
const LN = Math.log;

// ---------------------------------------------------------------- the stomach's own shades (from the palette)
const K = {
  deep: mix(C.chamber, LUMEN, 0.3),
  wallDark: mix(C.stomachWall, C.chamber, 0.62),
  wall: mix(C.stomachWall, C.chamber, 0.34),
  wallLit: mix(C.stomachWall, C.stomach, 0.35),
  floorSh: mix(C.stomach, C.stomachWall, 0.62),
  floor: C.stomach,
  floorLit: lit(C.stomach, 0.16),
  fold: mix(C.stomach, C.flesh, 0.24),
  foldLit: lit(mix(C.stomach, C.flesh, 0.6), 0.14),
  foldSh: mix(C.stomachWall, C.chamber, 0.12),
  foldCast: mix(C.stomachWall, C.chamber, 0.45),
  glint: '#FFF7E6',
  pucker: mix(C.esophagus, C.stomach, 0.3),
  puckerLit: lit(mix(C.esophagus, C.stomach, 0.3), 0.3),
  puckerSh: mix(C.esophagus, C.chamber, 0.38),
  lip: mix(C.esophagus, C.chamber, 0.52),
  lipLit: mix(C.esophagus, C.flesh, 0.3),
  passage: mix(C.esophagus, C.chamber, 0.35),
  passageLit: mix(C.esophagus, C.flesh, 0.15),
  eelShadow: mix(C.stomachWall, C.chamber, 0.7),
  near: mix(C.stomachWall, C.chamber, 0.72),
  nearLit: mix(C.stomachWall, C.chamber, 0.3),
};
/** toward the key light (screen upper left), unit */
const LIGHT: P = (() => {
  const l = Math.hypot(0.62, 0.78);
  return {x: -0.62 / l, y: -0.78 / l};
})();

// ---------------------------------------------------------------- small geometry
const lerpP = (a: P, b: P, u: number): P => ({x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u});
const dist = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y);
const crPt = (p0: P, p1: P, p2: P, p3: P, t: number): P => {
  const t2 = t * t, t3 = t2 * t;
  const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  return {x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y)};
};
/** Catmull-Rom through control points, sampled about every `step` units (the first/last points are phantoms when
 *  `phantoms`) */
const crDense = (cp: P[], step: number, phantoms = false): P[] => {
  const out: P[] = [];
  const a = phantoms ? 1 : 0, b = phantoms ? cp.length - 2 : cp.length - 1;
  for (let i = a; i < b; i++) {
    const p0 = cp[Math.max(0, i - 1)], p1 = cp[i], p2 = cp[i + 1], p3 = cp[Math.min(cp.length - 1, i + 2)];
    const n = Math.max(2, Math.ceil(dist(p1, p2) / step));
    for (let k = 0; k < n; k++) out.push(crPt(p0, p1, p2, p3, k / n));
  }
  out.push(cp[b]);
  return out;
};
const tangentsOf = (ps: P[]) =>
  ps.map((_, i) => {
    const a = ps[Math.max(0, i - 1)], b = ps[Math.min(ps.length - 1, i + 1)];
    const l = dist(a, b) || 1;
    return {x: (b.x - a.x) / l, y: (b.y - a.y) / l};
  });
const f2 = (v: number) => (Math.round(v * 100) / 100).toString();
const f1 = (v: number) => (Math.round(v * 10) / 10).toString();
const circleD = (c: P, r: number) => `M${f2(c.x - r)} ${f2(c.y)}a${f2(r)} ${f2(r)} 0 1 0 ${f2(2 * r)} 0a${f2(r)} ${f2(r)} 0 1 0 ${f2(-2 * r)} 0Z`;
const nearestS = (q: Path2, p: P) => {
  let best = 0, bd = 1e9;
  for (let i = 0; i < q.p.length; i++) {
    const d = dist(q.p[i], p);
    if (d < bd) { bd = d; best = i; }
  }
  return q.s[best];
};
const wrapA = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
/** smooth Catmull-Rom paths through points (as geo.closed / geo.open), written with 3 decimals */
const fq = (q: number) => (v: number) => {
  const r = Math.round(v * q) / q;
  return Object.is(r, -0) ? '0' : String(r);
};
const F3 = fq(1000), F2 = fq(100);
const crPath = (ps: P[], loop: boolean, f3 = F3) => {
  const n = ps.length;
  if (n < (loop ? 3 : 2)) return '';
  let d = `M${f3(ps[0].x)} ${f3(ps[0].y)}`;
  const segs = loop ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const g = (j: number) => (loop ? ps[(j + n) % n] : ps[Math.max(0, Math.min(n - 1, j))]);
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    d += `C${f3(p1.x + (p2.x - p0.x) / 6)} ${f3(p1.y + (p2.y - p0.y) / 6)} ${f3(p2.x - (p3.x - p1.x) / 6)} ${f3(p2.y - (p3.y - p1.y) / 6)} ${f3(p2.x)} ${f3(p2.y)}`;
  }
  return loop ? d + 'Z' : d;
};
const closed = (ps: P[]) => crPath(ps, true);
const open = (ps: P[]) => crPath(ps, false);
/** the rugae are broad soft shapes: 0.01 u is plenty (they are off-frame by the deepest push) */
const closed2 = (ps: P[]) => crPath(ps, true, F2);
const open2 = (ps: P[]) => crPath(ps, false, F2);

// ================================================================ the layout (world units: eel units, origin = A)
// World origin = where sample I0 (12 units from the tip) rests: the carried tail's anchor. The coil lies to its right
// (off-frame during the carry), the opening up and to the left (where the carried tail sweeps).
const I0 = 93; // carryTail(t).i0
/** the opening (the entrance to the esophagus, a puckered ring in the wall) */
export const OPENING: P = {x: -1.6, y: -11.75};
/** the coil: a loose spiral, the head at its centre, wound clockwise outward to its end E, then a short run to A */
const R0 = 2.9;
const B_SP = 3.15 / (2 * Math.PI); // turn spacing 3.15 u (the body is 2.5 u thick)
const RUN = 2;
const SP_LEN = EEL_L * (I0 / N) - RUN;
const TH_E = (-R0 + Math.sqrt(R0 * R0 + 2 * B_SP * SP_LEN)) / B_SP;
const R_E = R0 + B_SP * TH_E;
const PSI_E = 135 * DEG;
const H_A = -135 * DEG - Math.atan(B_SP / R_E); // the heading out of the coil (≈ the carry's −140°)
const E_PT: P = {x: -RUN * Math.cos(H_A), y: -RUN * Math.sin(H_A)};
export const COIL_C: P = {x: E_PT.x - R_E * Math.cos(PSI_E), y: E_PT.y - R_E * Math.sin(PSI_E)};
const spiralAt = (th: number): P => {
  const r = R0 + B_SP * th, psi = PSI_E - (TH_E - th);
  return {x: COIL_C.x + r * Math.cos(psi), y: COIL_C.y + r * Math.sin(psi)};
};
/** the probe: the tip slides up the wall (heading ≈ −97°) into the fold FOLD_BUMP lying across its way, is stopped,
 *  turns hard right and follows the fold's underside up to the opening. CORNER is where the approach meets the line
 *  along the fold; the track rounds it with radius R_CORNER and the tip is stopped part-way round (BUMP) */
const CORNER: P = {x: -7.6, y: -12.9};
const R_CORNER = 0.95;
const D_IN: P = (() => {
  const a = -97 * DEG;
  return {x: Math.cos(a), y: Math.sin(a)};
})();
const D_OUT: P = (() => {
  const l = dist(OPENING, CORNER);
  return {x: (OPENING.x - CORNER.x) / l, y: (OPENING.y - CORNER.y) / l};
})();
const cornerArc = (): P[] => {
  const turn = Math.acos(D_IN.x * D_OUT.x + D_IN.y * D_OUT.y);
  const tl = R_CORNER * Math.tan(turn / 2);
  const p0 = {x: CORNER.x - D_IN.x * tl, y: CORNER.y - D_IN.y * tl};
  // a right turn: the centre is on the right of the approach (screen y down: right normal = (−dy, dx))
  const c = {x: p0.x - D_IN.y * R_CORNER, y: p0.y + D_IN.x * R_CORNER};
  const a0 = Math.atan2(p0.y - c.y, p0.x - c.x);
  return Array.from({length: 9}, (_, k) => {
    const a = a0 + (turn * k) / 8;
    return {x: c.x + Math.cos(a) * R_CORNER, y: c.y + Math.sin(a) * R_CORNER};
  });
};
const ARC = cornerArc();
/** the track: snout (spiral centre) → the coil → A → the tail's rest → the probe → round the corner → along the
 *  fold's underside (sagging a little with it) → the opening's centre */
const ROUTE: Path2 = (() => {
  const sp: P[] = [];
  for (let th = -0.8; th <= TH_E + 1e-9; th += 0.05) sp.push(spiralAt(th));
  const E0 = spiralAt(TH_E - 0.05);
  const a0 = ARC[0], a1 = ARC[ARC.length - 1];
  const along = (k: number, sag: number) => {
    const l = dist(OPENING, a1);
    return {x: a1.x + D_OUT.x * l * k - D_OUT.y * sag, y: a1.y + D_OUT.y * l * k + D_OUT.x * sag};
  };
  const cp1: P[] = [
    E0,
    E_PT,
    {x: E_PT.x + Math.cos(H_A) * 2, y: E_PT.y + Math.sin(H_A) * 2},
    {x: 0, y: 0},
    {x: -2.3, y: -1.9},
    {x: -4.4, y: -3.9},
    {x: -6.0, y: -5.9},
    {x: -6.9, y: -7.6},
    {x: a0.x - D_IN.x * 2.4, y: a0.y - D_IN.y * 2.4},
    {x: a0.x - D_IN.x * 1.1, y: a0.y - D_IN.y * 1.1},
    a0,
    ARC[1],
  ];
  const cp2: P[] = [ARC[ARC.length - 2], a1, along(0.22, 0.22), along(0.45, 0.32), along(0.68, 0.22), along(0.86, 0.08), OPENING, {x: OPENING.x + D_OUT.x * 1.2, y: OPENING.y + D_OUT.y * 1.2}];
  const r1 = crDense(cp1, 0.1, true);
  const r2 = crDense(cp2, 0.1, true);
  return path2([...sp, ...r1.slice(1), ...ARC.slice(1, -1), ...r2]);
})();
/** route arc lengths of the landmarks */
const S_SNOUT0 = nearestS(ROUTE, spiralAt(0));
const S_REST = S_SNOUT0 + EEL_L; // the tail tip at rest
const S_BUMP = nearestS(ROUTE, ARC[3]);
const S_OPEN = nearestS(ROUTE, OPENING);
/** where sample I0 sits at rest (the carry's anchor): the camera puts it on carryTail's anchor */
const A_REST: P = at2(ROUTE, S_REST - EEL_L * (1 - I0 / N));
/** the wide view (6.9 s): this world point at screen (540, 1120), 34 px per unit */
const S_WIDE_ = 34;
const C_WIDE: P = {x: 2.4, y: -5.1 - 160 / 34};
const Wp = (x: number, y: number): P => ({x: C_WIDE.x + (x - CS.x) / S_WIDE_, y: C_WIDE.y + (y - CS.y) / S_WIDE_});
const toWide = (w: P): P => ({x: CS.x + S_WIDE_ * (w.x - C_WIDE.x), y: CS.y + S_WIDE_ * (w.y - C_WIDE.y)});
const A_WIDE: P = toWide(A_REST);

// ================================================================ timing
const TB = {
  pull1: 6.9, // the pull-back ends (wide)
  settle1: 6.8, // the tail has settled beside the coil
  lift: 7.12, // the tail lifts, anticipating ("the eel")
  go: 7.22, // it starts to slide ("starts" 7.49)
  bump: 7.45, // ... into the fold: stopped dead
  recoil: 7.5, // it flinches back off the fold ...
  turn: 7.62, // ... then turns along it
  search0: 7.62, // it searches along the fold's underside: the tip sweeps off and back onto the fold, twice
  ring: 7.95, // it reaches the pucker's ring and feels across it
  press: 8.1, // the tip finds the centre and presses
  yield0: 8.13, // the opening yields
  yield1: 8.3,
  in: 8.22, // the tip is in; the body slides after it
  end: 8.9,
};
/** cubic Hermite from (t0, s0, v0) to (t1, s1, v1) */
const hermite = (t: number, t0: number, t1: number, s0: number, s1: number, v0: number, v1: number) => {
  const h = t1 - t0, x = (t - t0) / h, x2 = x * x, x3 = x2 * x;
  return (2 * x3 - 3 * x2 + 1) * s0 + (x3 - 2 * x2 + x) * h * v0 + (-2 * x3 + 3 * x2) * s1 + (x3 - x2) * h * v1;
};
/** route arc length where the tip reaches the pucker's raised ring */
const S_RING = S_OPEN - 2.75;
/** the tail tip's arc length along the track: never decreasing (the body never slides backward) */
const sTipAt = (t: number) => {
  if (t <= TB.go) return S_REST;
  if (t <= TB.bump) {
    // accelerating into the fold, stopped by it
    const x = (t - TB.go) / (TB.bump - TB.go);
    return S_REST + (S_BUMP - S_REST) * (0.3 * x + 0.7 * x * x);
  }
  if (t <= TB.turn) return S_BUMP;
  if (t <= TB.ring) {
    // along the fold, in two surges (each sweep of the tip carries it on a little)
    const x = (t - TB.turn) / (TB.ring - TB.turn);
    const surge = x - Math.sin(2 * Math.PI * 2 * x) / (2 * Math.PI * 2) * 0.85;
    return S_BUMP + (S_RING - S_BUMP) * surge;
  }
  // the ring: it feels across it and darts to the centre; then the press; matched speeds at every join (u/s)
  const vRing = ((S_RING - S_BUMP) / (TB.ring - TB.turn)) * 0.15;
  if (t <= TB.press) return hermite(t, TB.ring, TB.press, S_RING, S_OPEN - 0.5, vRing, 2.5);
  if (t <= TB.in) return hermite(t, TB.press, TB.in, S_OPEN - 0.5, S_OPEN + 0.25, 2.5, 5.4);
  // through: speeding up to ~13 u/s, kept going past the cut
  const x = t - TB.in;
  return S_OPEN + 0.25 + 5.4 * x + 7.5 * x * x;
};
/** the opening's lumen radius (world): a closed pucker that yields as the tip pushes in */
const lumenR = (t: number) => 0.34 + (1.5 - 0.34) * ss(t, TB.yield0, TB.yield1) + 0.12 * ring(t, TB.yield1 - 0.04, 3.2, 0.14);
const openness = (t: number) => ss(t, TB.yield0, TB.yield1);
/** the fold's dent where the tip strikes it (world units, along the tip's travel) */
const dentAt = (t: number) => (t < TB.bump - 0.05 ? 0 : ss(t, TB.bump - 0.05, TB.bump) * Math.exp(-Math.max(0, t - TB.bump) / 0.2) * Math.cos(2 * Math.PI * 4.0 * Math.max(0, t - TB.bump)));
/** where the tip presses the wall: a soft dimple that spreads and fades (time, strength); the bump, each touch of the
 *  search, the ring, the press */
const TOUCHES: [number, number][] = [
  [7.45, 1.0],
  [7.76, 0.65],
  [7.93, 0.65],
  [8.1, 0.85],
];

// ================================================================ the camera
export type Cam = {c: P; s: number; D: number};
const lnS = (t: number) => {
  if (t <= CARRY1) return LN(S_CARRY);
  if (t <= TB.pull1) return lerp(LN(S_CARRY), LN(S_WIDE_), ss5(t, CARRY1, TB.pull1));
  if (t <= 8.12) return keyS(t, [[TB.pull1, LN(S_WIDE_)], [7.15, LN(36.5)], [7.7, LN(44)], [8.12, LN(46)]]);
  // the dive: an accelerating push into the opening (no ease-out: it carries on through the dissolve)
  const x = (t - 8.12) / (TB.end - 8.12);
  return LN(46) + (LN(F / 0.5) - LN(46)) * Math.pow(x, 2.4);
};
const O_WIDE: P = toWide(OPENING);
export const camAt = (t: number): Cam => {
  const s = Math.exp(lnS(t));
  const D = Math.max(0.1, F / s);
  const sD = F / D;
  if (t <= TB.pull1) {
    // sample I0 rides on the carry's anchor, then glides to its wide-view place as we pull back
    const anc = carryTail(t).pts[0];
    const Q = lerpP(anc, A_WIDE, ss5(t, CARRY1, TB.pull1));
    return {c: {x: A_REST.x - (Q.x - CS.x) / sD, y: A_REST.y - (Q.y - CS.y) / sD}, s: sD, D};
  }
  // the opening is the reference: where it sits on screen
  const Q = {
    // (from 7.7 the whole coil stays in frame, so the head's link to the body reads while the tail searches)
    x: keyS(t, [[TB.pull1, O_WIDE.x], [7.15, O_WIDE.x + 6], [7.7, 380], [8.12, 362], [8.62, CS.x]]),
    y: keyS(t, [[TB.pull1, O_WIDE.y], [7.15, O_WIDE.y - 25], [7.7, 762], [8.12, 742], [8.62, CS.y]]),
  };
  return {c: {x: OPENING.x - (Q.x - CS.x) / sD, y: OPENING.y - (Q.y - CS.y) / sD}, s: sD, D};
};
const proj = (cam: Cam, w: P, z = 0): P => {
  const k = F / (cam.D + z);
  return {x: CS.x + k * (w.x - cam.c.x), y: CS.y + k * (w.y - cam.c.y)};
};
const layerTf = (cam: Cam, z = 0) => {
  const k = F / (cam.D + z);
  return `matrix(${k.toFixed(5)} 0 0 ${k.toFixed(5)} ${(CS.x - k * cam.c.x).toFixed(3)} ${(CS.y - k * cam.c.y).toFixed(3)})`;
};

// ================================================================ the eel's pose
/** bend the last part of the body by `phi` (radians at the tip; length-preserving), from sample i0 on */
const flexTail = (pts: P[], phi: number, i0: number, pow = 1.6): P[] => {
  if (Math.abs(phi) < 1e-5) return pts;
  const out = pts.slice();
  for (let i = i0; i < N; i++) {
    const a = pts[i], b = pts[i + 1];
    const h = Math.atan2(b.y - a.y, b.x - a.x) + phi * Math.pow((i + 0.5 - i0) / (N - i0), pow);
    const l = dist(a, b);
    out[i + 1] = {x: out[i].x + Math.cos(h) * l, y: out[i].y + Math.sin(h) * l};
  }
  return out;
};
/** turn the head about the neck (sample iN) by `phi` radians at the snout */
const flexHead = (pts: P[], phi: number, iN: number): P[] => {
  if (Math.abs(phi) < 1e-5) return pts;
  const out = pts.slice();
  for (let i = iN - 1; i >= 0; i--) {
    const a = pts[i], b = pts[i + 1];
    const h = Math.atan2(a.y - b.y, a.x - b.x) + phi * Math.pow((iN - i - 0.5) / iN, 1.3);
    const l = dist(a, b);
    out[i] = {x: out[i + 1].x + Math.cos(h) * l, y: out[i + 1].y + Math.sin(h) * l};
  }
  return out;
};
/** the tip's bend (radians at the tip; + turns right): a twitch at rest, the anticipation, the flinch off the fold,
 *  the turn along it, the two search sweeps (off the fold and back onto it), the feel across the ring, then straight */
const tipPhi = (t: number) => {
  const idle = 0.22 * Math.sin(2 * Math.PI * 0.9 * (t - 6.4)) * ss(t, 6.4, 6.8) * (1 - ss(t, 7.0, TB.lift));
  const lift = 0.35 * ss(t, TB.lift - 0.06, TB.go) * (1 - ss(t, TB.go, TB.go + 0.12));
  // struck: it buckles back (left, away from the fold), then swings right to lie along the fold, released as the
  // track carries it round the corner
  const flinch = -0.45 * ss(t, TB.bump - 0.01, TB.bump + 0.04) * (1 - ss(t, TB.recoil, TB.recoil + 0.06));
  const turn = 1.05 * ss(t, TB.recoil, TB.turn) * (1 - ss(t, TB.turn + 0.02, TB.turn + 0.22));
  // searching along the fold (which lies on its left): the tip sweeps off it (right, +) and back up against it (−),
  // twice, each press a touch on the wall
  const sx = (t - TB.search0) / (TB.ring - TB.search0);
  const search = sx > 0 && sx < 1 ? 0.7 * Math.sin(2 * Math.PI * 2 * sx - 0.6) * ss(sx, 0.05, 0.25) * (1 - ss(sx, 0.85, 1)) : 0;
  // on the ring: a quick feel (left-right) before it dips into the centre
  const feel = 0.28 * Math.sin(2 * Math.PI * 5 * (t - TB.ring)) * ss(t, TB.ring, TB.ring + 0.02) * (1 - ss(t, TB.press - 0.04, TB.press));
  return idle + lift + flinch + turn + search + feel;
};
/** the head stirs at rest, then turns a little toward the action (the tail up the wall) */
const headPhi = (t: number) => 0.1 * Math.sin(2 * Math.PI * 0.55 * (t - 6.2)) * ss(t, 6.2, 6.7) - 0.3 * ss(t, 7.15, 7.7) * (1 - ss(t, 8.3, 8.7));
const waveAmp = (t: number) => 0.12 * ss(t, 6.0, 6.6);

export type Pose = {
  /** world points, snout → tail tip */
  w: P[];
  /** depth behind the wall (> 0 inside the opening) per sample */
  z: number[];
  /** the fractional sample where the body enters the opening (N + 1 when it has not) */
  iRim: number;
};
export const poseAt = (t: number): Pose => {
  const sT = sTipAt(t);
  const amp = waveAmp(t);
  // a reverse undulation (the waves run toward the head while it backs up), small, off the tail's last quarter
  const wave = amp > 0 ? (u: number) => amp * ss(u, 0.08, 0.2) * (1 - ss(u, 0.62, 0.76)) * Math.sin(2 * Math.PI * (u * 5.2 + 1.3 * t)) : undefined;
  let w = alongPath(ROUTE, sT, 1, wave);
  w = flexHead(w, headPhi(t), 14);
  w = flexTail(w, tipPhi(t), N - 16, 1.5);
  // hand-off 1: the last 12 units on the carried tail, then their bends blend into the pose (heading space)
  if (t < TB.settle1) {
    const ct = carryTail(t);
    const wc = ct.pts.map((p) => ({x: A_REST.x + (p.x - ct.pts[0].x) / S_CARRY, y: A_REST.y + (p.y - ct.pts[0].y) / S_CARRY}));
    if (t <= CARRY1) {
      for (let k = 0; k < wc.length; k++) w[I0 + k] = wc[k];
    } else {
      const b = ss5(t, CARRY1, TB.settle1);
      const out = w.slice();
      for (let k = 0; k < wc.length - 1; k++) {
        const hb = Math.atan2(w[I0 + k + 1].y - w[I0 + k].y, w[I0 + k + 1].x - w[I0 + k].x);
        const hc = Math.atan2(wc[k + 1].y - wc[k].y, wc[k + 1].x - wc[k].x);
        const h = hb + (1 - b) * wrapA(hc - hb);
        const l = lerp(dist(wc[k], wc[k + 1]), dist(w[I0 + k], w[I0 + k + 1]), b);
        out[I0 + k + 1] = {x: out[I0 + k].x + Math.cos(h) * l, y: out[I0 + k].y + Math.sin(h) * l};
      }
      w = out;
    }
  }
  // into the opening: past the lumen's rim the body runs down the passage (depth z), hugging its entry side
  const z = w.map(() => 0);
  let iRim = N + 1;
  const sRim = S_OPEN - lumenR(t) * 0.92;
  if (sT > sRim) {
    const Pr = at2(ROUTE, sRim);
    const v = {x: Pr.x - OPENING.x, y: Pr.y - OPENING.y};
    const vl = Math.hypot(v.x, v.y) || 1;
    iRim = N * (1 - (sT - sRim) / EEL_L);
    // it slips over the lip (a bend of radius RB, from lying on the wall to running down the passage) and on down along
    // the passage wall (perspective alone draws it to the vanishing point; the camera, following, stays clear of it)
    const RB = 0.36, QB = (Math.PI * RB) / 2;
    for (let i = Math.max(0, Math.ceil(iRim)); i <= N; i++) {
      const e = sT - EEL_L * (1 - i / N) - sRim;
      const ph = Math.min(e / RB, Math.PI / 2);
      const lat = vl - RB * Math.sin(ph);
      const d = e <= QB ? RB * (1 - Math.cos(ph)) : RB + (e - QB);
      // past the lip it turns to run along the passage's lower-left wall (and the passage turns a little)
      const a = -0.6 * (1 - Math.exp(-d / 0.8));
      const ux = v.x / vl, uy = v.y / vl;
      const vx = ux * Math.cos(a) - uy * Math.sin(a), vy = ux * Math.sin(a) + uy * Math.cos(a);
      w[i] = {x: OPENING.x + vx * lat, y: OPENING.y + vy * lat};
      z[i] = d;
    }
  }
  return {w, z, iRim};
};

// ================================================================ the frame's state (shared by render + keepOut)
type Frame = {cam: Cam; pose: Pose; scr: P[]; rS: number[]; r: number[]};
const frameAt = (t: number): Frame => {
  const cam = camAt(t);
  const pose = poseAt(t);
  const scr = pose.w.map((p, i) => proj(cam, p, pose.z[i]));
  const rS = pose.z.map((z) => cam.D / (cam.D + z));
  const r = RADII.map((R, i) => R * rS[i] * cam.s);
  return {cam, pose, scr, rS, r};
};

/** the eel's screen samples (centre + radius, px) for the caption check: those in the frame and visible (down the
 *  passage the eel goes dark; samples there count until the fog has all but hidden them). No gill gap in this shot. */
export const keepOut = (t: number): KeepOut => {
  const fr = frameAt(t);
  const L = fogLen(fr.cam.D);
  return {
    eel: fr.scr
      .map((p, i) => ({x: p.x, y: p.y, r: fr.r[i], fog: fogOf(fr.pose.z[i], L)}))
      .filter((q) => q.x > -q.r && q.x < 1080 + q.r && q.y > -q.r && q.y < 1920 + q.r && q.fog < 0.9)
      .map(({x, y, r}) => ({x, y, r})),
  };
};

// ================================================================ the wall's art (world units, z = 0)
type FoldDef = {pts: P[]; w: number; k: string};
/** the fold the tip bumps: it leaves the pucker down and to the left; the tip comes up from below and hits its
 *  underside at BUMP, then turns and follows it up to the opening */
const FOLD_BUMP_CP: P[] = [
  {x: -4.08, y: -13.19},
  {x: -5.75, y: -13.51},
  {x: -7.42, y: -13.83},
  {x: -9.3, y: -14.05},
  {x: -11.2, y: -13.85},
  {x: -12.9, y: -13.0},
  {x: -14.2, y: -11.4},
];
const DENT_AT: P = {x: -7.4, y: -13.8};
/** a fold as a streamline: it leaves the pucker's ring at `ang` and winds outward round the opening */
const streamFold = (ang: number, len: number, swirl: number, seed: number, r0 = 2.75): P[] => {
  const pts: P[] = [];
  let a = ang * DEG;
  let p = {x: OPENING.x + Math.cos(a) * r0, y: OPENING.y + Math.sin(a) * r0 * 0.94};
  const n = Math.max(6, Math.round(len / 1.5));
  for (let k = 0; k <= n; k++) {
    pts.push(p);
    // relax toward the radial direction turned by `swirl` (the folds wind gently round the opening), meandering
    const rad = Math.atan2(p.y - OPENING.y, p.x - OPENING.x) + swirl * DEG;
    a += wrapA(rad - a) * 0.22 + 0.3 * noise1(k * 0.75 + seed * 3.1, seed);
    p = {x: p.x + Math.cos(a) * (len / n), y: p.y + Math.sin(a) * (len / n)};
  }
  return pts;
};
const FOLDS: FoldDef[] = [
  {pts: streamFold(108, 22, -26, 1), w: 0.8, k: 'a'},
  {pts: streamFold(76, 25, -32, 2), w: 0.88, k: 'b'},
  {pts: streamFold(44, 26, -34, 3), w: 0.92, k: 'c'},
  {pts: streamFold(12, 24, -34, 4), w: 0.88, k: 'd'},
  {pts: streamFold(-22, 20, -30, 5), w: 0.8, k: 'e'},
  {pts: streamFold(-58, 14, -26, 6), w: 0.75, k: 'f'},
  {pts: streamFold(-96, 11, -24, 7), w: 0.72, k: 'g'},
  {pts: streamFold(-134, 11, -22, 8), w: 0.72, k: 'h'},
  // shorter ones further out, between the main folds
  {pts: streamFold(92, 11, -30, 11, 10), w: 0.55, k: 's1'},
  {pts: streamFold(60, 12, -32, 12, 11), w: 0.6, k: 's2'},
  {pts: streamFold(28, 12, -34, 13, 10.5), w: 0.6, k: 's3'},
  {pts: streamFold(-6, 10, -32, 14, 10), w: 0.55, k: 's4'},
  {pts: streamFold(-40, 8, -28, 15, 9), w: 0.5, k: 's5'},
];
/** the floor (the chamber's wall facing us) and the wall bands curving toward the frame */
const FLOOR_C: P = {x: 3.4, y: -6.6};
const blob = (c: P, rx: number, ry: number, seed: number, wob: number, n = 30): P[] =>
  Array.from({length: n}, (_, k) => {
    const a = (k / n) * 2 * Math.PI;
    const m = 1 + wob * noise1(k * 0.7, seed);
    return {x: c.x + Math.cos(a) * rx * m, y: c.y + Math.sin(a) * ry * m};
  });
const FLOOR = blob(FLOOR_C, 14.8, 19.8, 11, 0.05);
const BAND1 = blob({x: FLOOR_C.x + 0.3, y: FLOOR_C.y + 0.4}, 17.8, 23.6, 12, 0.05);
const BAND2 = blob({x: FLOOR_C.x + 0.8, y: FLOOR_C.y + 0.9}, 22.5, 29.5, 13, 0.06);
const BAND3 = blob({x: FLOOR_C.x + 1.2, y: FLOOR_C.y + 1.4}, 29, 38, 14, 0.06);
/** broad folds following the chamber's curve: arcs of the rim bands */
const arcOf = (c: P, rx: number, ry: number, a0: number, a1: number, n = 8): P[] =>
  Array.from({length: n + 1}, (_, k) => {
    const a = (a0 + ((a1 - a0) * k) / n) * DEG;
    return {x: c.x + Math.cos(a) * rx, y: c.y + Math.sin(a) * ry};
  });
const RIM_FOLDS: FoldDef[] = [
  {pts: arcOf(FLOOR_C, 16.4, 21.8, 100, 205), w: 1.0, k: 'r1'},
  {pts: arcOf(FLOOR_C, 16.2, 21.6, -40, 70), w: 1.0, k: 'r2'},
  {pts: arcOf(FLOOR_C, 20.2, 26.6, 60, 140), w: 1.15, k: 'r3'},
  {pts: arcOf(FLOOR_C, 20.5, 26.8, -95, -15), w: 1.1, k: 'r4'},
  {pts: arcOf(FLOOR_C, 19.8, 26.2, 200, 262), w: 1.05, k: 'r5'},
  {pts: arcOf(FLOOR_C, 25.8, 33.6, -70, 40), w: 1.3, k: 'r6'},
  {pts: arcOf(FLOOR_C, 25.8, 33.6, 120, 230), w: 1.3, k: 'r7'},
];

/** one ruga: a soft ridge in the wall, read from its shading alone (no closed outline): the flank facing the light
 *  is lit, the other in shade and casting a little shadow onto the wall, a wet glint along the lit flank */
type FoldPaths = {cast: string; body: string; sh: string; lit: string; glint: string; ink: string};
const FOLD_MEMO = new Map<string, FoldPaths>();
const Fold: React.FC<{f: FoldDef; dent?: {at: P; dir: P; a: number}}> = ({f, dent}) => {
  const dented = !!dent && Math.abs(dent.a) > 1e-4;
  let fp = dented ? undefined : FOLD_MEMO.get(f.k);
  if (!fp) {
    fp = foldPaths(f, dented ? dent : undefined);
    if (!dented) FOLD_MEMO.set(f.k, fp);
  }
  return (
    <g>
      <path d={fp.cast} fill={K.foldCast} fillOpacity={0.3} />
      <path d={fp.body} fill={K.fold} />
      <path d={fp.sh} fill={K.foldSh} fillOpacity={0.6} />
      <path d={fp.lit} fill={K.foldLit} fillOpacity={0.85} />
      <path d={fp.glint} fill="none" stroke={K.glint} strokeOpacity={0.6} strokeWidth={2.2} vectorEffect={NS} strokeLinecap="round" strokeDasharray="30 16 9 24" />
      <path d={fp.ink} fill="none" stroke={INK} strokeOpacity={0.38} strokeWidth={1.5} vectorEffect={NS} strokeLinecap="round" />
    </g>
  );
};
const foldPaths = (f: FoldDef, dent?: {at: P; dir: P; a: number}): FoldPaths => {
  const approx = f.pts.reduce((acc, p, i) => acc + (i ? dist(p, f.pts[i - 1]) : 0), 0);
  let c = crDense(f.pts, clamp(approx / 46, 0.45, 1.3));
  if (dent) {
    c = c.map((p) => {
      const g = Math.exp(-((p.x - dent.at.x) ** 2 + (p.y - dent.at.y) ** 2) / (2 * 1.15 * 1.15));
      return {x: p.x + dent.dir.x * dent.a * g, y: p.y + dent.dir.y * dent.a * g};
    });
  }
  const T = tangentsOf(c);
  const n = c.length;
  let run = 0;
  const arc = c.map((p, i) => (run += i ? dist(p, c[i - 1]) : 0));
  const total = arc[n - 1] || 1;
  const wv = arc.map((s) => {
    const u = s / total;
    return f.w * ss(u, 0, 0.14) * (1 - ss(u, 0.78, 1)) * (0.74 + 0.26 * Math.sin(u * 7.5 + f.w * 11));
  });
  // per point, both sides: how squarely each flank faces the light (continuous, so nothing pops where the ridge
  // turns along the light and the lit side changes)
  const N_: P[] = T.map((tg) => ({x: -tg.y, y: tg.x}));
  const dl = N_.map((nn) => nn.x * LIGHT.x + nn.y * LIGHT.y);
  const gp = dl.map((d) => clamp(d * 1.8)), gm = dl.map((d) => clamp(-d * 1.8));
  const off = (k: (i: number) => number) => c.map((p, i) => ({x: p.x + N_[i].x * wv[i] * k(i), y: p.y + N_[i].y * wv[i] * k(i)}));
  const band = (a: P[], b: P[]) => closed2([...a, ...[...b].reverse()]);
  const eP = off(() => 1), eM = off(() => -1);
  // lit flank on the + side where it faces the light, on the − side where that one does
  const litP = off((i) => 1 - 0.78 * gp[i]), litM = off((i) => -(1 - 0.78 * gm[i]));
  // shaded flank and cast shadow on the side away from the light
  const shP = off((i) => 1 - 0.8 * gm[i]), shM = off((i) => -(1 - 0.8 * gp[i]));
  const castP = off((i) => 1 + 0.95 * gm[i]), castM = off((i) => -(1 + 0.95 * gp[i]));
  const g = dl.map((d) => Math.abs(d) * 1.8);
  const runs = (pts: (i: number) => P, ok: (i: number) => boolean) => {
    let d = '';
    let cur: P[] = [];
    for (let i = 0; i < n; i++) {
      if (ok(i)) cur.push(pts(i));
      else {
        if (cur.length > 2) d += open2(cur);
        cur = [];
      }
    }
    if (cur.length > 2) d += open2(cur);
    return d;
  };
  const side = (i: number) => (dl[i] >= 0 ? 1 : -1);
  const glintAt = (i: number) => ({x: c[i].x + N_[i].x * wv[i] * 0.52 * side(i), y: c[i].y + N_[i].y * wv[i] * 0.52 * side(i)});
  const inkAt = (i: number) => ({x: c[i].x - N_[i].x * wv[i] * side(i), y: c[i].y - N_[i].y * wv[i] * side(i)});
  return {
    cast: band(eP, castP) + band(eM, castM),
    body: band(eP, eM),
    sh: band(shP, eP) + band(shM, eM),
    lit: band(eP, litP) + band(eM, litM),
    glint: runs(glintAt, (i) => g[i] > 0.5 && wv[i] > 0.45 * f.w),
    ink: runs(inkAt, (i) => g[i] > 0.35 && wv[i] > 0.3 * f.w),
  };
};

/** a crescent: the part of the disk (c, R) on the `dir` side not covered by the same disk shifted back by `sh` */
const crescentD = (c: P, R: number, dirA: number, sh: number) => {
  const dx = Math.cos(dirA), dy = Math.sin(dirA);
  const h = Math.sqrt(Math.max(0, R * R - (sh * sh) / 4));
  const m = {x: c.x - (dx * sh) / 2, y: c.y - (dy * sh) / 2};
  const p1 = {x: m.x - dy * h, y: m.y + dx * h}, p2 = {x: m.x + dy * h, y: m.y - dx * h};
  // the big arc of the disk through the dir side, back along the shifted disk's small arc
  return `M${f2(p1.x)} ${f2(p1.y)}A${f2(R)} ${f2(R)} 0 1 0 ${f2(p2.x)} ${f2(p2.y)}A${f2(R)} ${f2(R)} 0 0 1 ${f2(p1.x)} ${f2(p1.y)}Z`;
};

/** the opening: a puckered ring, its creases converging on the lumen; it yields (opens) as the tip pushes in */
const lumenPts = (O: P, rh: number, op: number, t: number, n = 36) =>
  Array.from({length: n}, (_, k) => {
    const a = (k / n) * 2 * Math.PI;
    const r = rh * (1 + (1 - op) * 0.42 * Math.cos(9 * a + 0.4) + 0.04 * Math.sin(3 * a + 2 * t));
    return {x: O.x + Math.cos(a) * r, y: O.y + Math.sin(a) * r * 0.94};
  });
const Pucker: React.FC<{t: number}> = ({t}) => {
  const O = OPENING;
  const rh = lumenR(t), op = openness(t);
  // a press before it yields: the ring flinches inward
  const press = ss(t, TB.press - 0.04, TB.press + 0.04) * (1 - op);
  const Ro = rh + 2.35 - 0.25 * press;
  const outer = Array.from({length: 40}, (_, k) => {
    const a = (k / 40) * 2 * Math.PI;
    const r = Ro * (1 + 0.05 * Math.sin(9 * a + 1.1) + 0.03 * noise1(k * 0.6, 4));
    return {x: O.x + Math.cos(a) * r, y: O.y + Math.sin(a) * r * 0.94};
  });
  const id = uid('s4pk');
  const lip = lumenPts(O, rh + 0.62, Math.max(op, 0.5), t);
  const lum = lumenPts(O, rh, op, t);
  const nC = 9;
  const creases: P[][] = [];
  for (let k = 0; k < nC; k++) {
    const a0 = (k / nC) * 2 * Math.PI + 0.4 / 9 + Math.PI / 9;
    const L = (1.95 - 0.7 * op) * (1 - 0.2 * press);
    const ps: P[] = [];
    for (let j = 0; j <= 4; j++) {
      const r = rh * (1 - 0.3 * (1 - op)) + 0.1 + (L * j) / 4;
      const a = a0 + 0.22 * Math.sin((j / 4) * Math.PI) * (1 - 0.5 * op);
      ps.push({x: O.x + Math.cos(a) * r, y: O.y + Math.sin(a) * r * 0.94});
    }
    creases.push(ps);
  }
  const la = Math.atan2(LIGHT.y, LIGHT.x);
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <path d={closed(outer)} />
        </clipPath>
      </defs>
      <path d={closed(outer)} fill={K.pucker} />
      <g clipPath={`url(#${id})`}>
        {/* the raised ring: lit on its upper-left slope, shaded on the lower right */}
        <path d={crescentD(O, Ro * 1.02, la, Ro * 0.42)} fill={K.puckerLit} fillOpacity={0.85} />
        <path d={crescentD(O, Ro * 1.02, la + Math.PI, Ro * 0.36)} fill={K.puckerSh} fillOpacity={0.7} />
      </g>
      <path d={closed(outer)} fill="none" stroke={INK} strokeOpacity={0.42} strokeWidth={1.7} vectorEffect={NS} />
      {/* the inner slope into the hole: dark, its lower-right side (facing the light) catching it */}
      <path d={closed(lip)} fill={K.lip} />
      <path d={crescentD(O, (rh + 0.62) * 0.98, la + Math.PI, (rh + 0.62) * 0.5)} fill={K.lipLit} fillOpacity={0.55} />
      {creases.map((ps, k) => (
        <g key={k}>
          <path d={open(ps.map((p) => ({x: p.x + LIGHT.x * 0.12, y: p.y + LIGHT.y * 0.12})))} fill="none" stroke={K.glint} strokeOpacity={0.42 * (1 - 0.6 * op)} strokeWidth={1.8} vectorEffect={NS} strokeLinecap="round" />
          <path d={open(ps)} fill="none" stroke={INK} strokeOpacity={0.5 * (1 - 0.5 * op)} strokeWidth={1.6} vectorEffect={NS} strokeLinecap="round" />
        </g>
      ))}
      <path d={closed(lum)} fill={LUMEN} stroke={INK} strokeWidth={2.2} vectorEffect={NS} strokeLinejoin="round" />
    </g>
  );
};

const SHEEN = [
  {c: {x: FLOOR_C.x + 8.5, y: FLOOR_C.y + 11.5}, rx: 4.5, ry: 1.3, a: -52, o: 0.1},
  {c: {x: FLOOR_C.x + 10.6, y: FLOOR_C.y + 7.8}, rx: 3.2, ry: 0.8, a: -62, o: 0.13},
  {c: {x: FLOOR_C.x + 4.2, y: FLOOR_C.y + 15.2}, rx: 3.6, ry: 0.9, a: -30, o: 0.11},
  {c: {x: FLOOR_C.x + 11.8, y: FLOOR_C.y + 4.2}, rx: 1.6, ry: 0.4, a: -70, o: 0.22},
  {c: {x: FLOOR_C.x + 7.4, y: FLOOR_C.y + 13.6}, rx: 1.4, ry: 0.35, a: -45, o: 0.24},
];
/** the chamber: the floor facing us, its rim, the walls curving toward the frame (the bowl is lit on its lower
 *  right, which faces the light; the upper-left wall is in shadow) */
const Chamber: React.FC = () => {
  const la = Math.atan2(LIGHT.y, LIGHT.x);
  const id = uid('s4fl');
  return (
    <g>
      <path d={closed(BAND3)} fill={K.wallDark} />
      <path d={closed(BAND2)} fill={K.wall} />
      <path d={crescentD({x: FLOOR_C.x + 0.8, y: FLOOR_C.y + 0.9}, 26, la + Math.PI, 8)} fill={K.wallLit} fillOpacity={0.5} />
      <path d={closed(BAND1)} fill={K.wallLit} />
      <path d={crescentD(FLOOR_C, 24, la, 6.5)} fill={K.wall} fillOpacity={0.75} />
      <defs>
        <clipPath id={id}>
          <path d={closed(FLOOR)} />
        </clipPath>
      </defs>
      <path d={closed(FLOOR)} fill={K.floor} />
      <g clipPath={`url(#${id})`}>
        {/* the bowl: its lower-right side faces the light; the rim shades the upper-left */}
        <path d={crescentD({x: FLOOR_C.x + 2.5, y: FLOOR_C.y + 3.5}, 22, la + Math.PI, 9)} fill={K.floorLit} fillOpacity={0.75} />
        <path d={crescentD({x: FLOOR_C.x - 0.6, y: FLOOR_C.y - 0.6}, 24, la, 4.6)} fill={K.floorSh} fillOpacity={0.7} />
      </g>
      <g clipPath={`url(#${id})`}>
        {/* wet sheen where the bowl faces the light */}
        {SHEEN.map((q, j) => (
          <ellipse key={j} cx={f2(q.c.x)} cy={f2(q.c.y)} rx={f2(q.rx)} ry={f2(q.ry)} transform={`rotate(${q.a} ${f2(q.c.x)} ${f2(q.c.y)})`} fill={K.glint} fillOpacity={q.o} />
        ))}
      </g>
      <path d={closed(FLOOR)} fill="none" stroke={INK} strokeOpacity={0.3} strokeWidth={2} vectorEffect={NS} />
      <path d={closed(BAND1)} fill="none" stroke={INK} strokeOpacity={0.22} strokeWidth={1.6} vectorEffect={NS} />
    </g>
  );
};

/** a few gas bubbles stuck in the mucus (wet, not gory), slightly in front of the wall */
const BUBBLES = Array.from({length: 9}, (_, k) => ({
  p: Wp(100 + 880 * hash(k * 3.1 + 0.4), 560 + 1300 * hash(k * 7.7 + 1.9)),
  r: 0.22 + 0.32 * hash(k * 5.3 + 2.2),
  ph: hash(k * 2.9) * 6,
}));
const Bubbles: React.FC<{t: number}> = ({t}) => (
  <g>
    {BUBBLES.map((b, k) => {
      const p = {x: b.p.x + 0.12 * Math.sin(t * 1.3 + b.ph), y: b.p.y - 0.25 * t + 0.1 * Math.cos(t * 1.1 + b.ph)};
      return (
        <g key={k}>
          <circle cx={f2(p.x)} cy={f2(p.y)} r={f2(b.r)} fill={K.glint} fillOpacity={0.12} stroke={INK} strokeOpacity={0.35} strokeWidth={1.1} vectorEffect={NS} />
          <circle cx={f2(p.x - b.r * 0.35)} cy={f2(p.y - b.r * 0.4)} r={f2(b.r * 0.26)} fill={K.glint} fillOpacity={0.85} />
        </g>
      );
    })}
  </g>
);

/** soft near folds framing the chamber (in front of the wall, z < 0): they slide past faster as we move */
const Z_NEAR = -7;
const K_NEAR = F / (F / S_WIDE_ + Z_NEAR);
/** wide-view px -> the near layer's world (so the shapes sit where drawn in the wide view) */
const nearW = (x: number, y: number): P => ({x: C_WIDE.x + (x - CS.x) / K_NEAR, y: C_WIDE.y + (y - CS.y) / K_NEAR});
const NEAR_SHAPES: P[][] = [
  [nearW(1180, 1180), nearW(1060, 1330), nearW(1015, 1560), nearW(1040, 1800), nearW(1110, 1990), nearW(1200, 2060)],
  [nearW(-120, 1620), nearW(70, 1720), nearW(200, 1850), nearW(250, 2010), nearW(-120, 2080)],
  [nearW(-120, 380), nearW(30, 470), nearW(70, 650), nearW(10, 820), nearW(-120, 900)],
];
const Near: React.FC<{cam: Cam}> = ({cam}) => {
  const a = ss(cam.D, 10, 18);
  if (a <= 0.01) return null;
  return (
    <g transform={layerTf(cam, Z_NEAR)} opacity={a}>
      {NEAR_SHAPES.map((ps, k) => {
        const c = ps.reduce((acc, p) => ({x: acc.x + p.x / ps.length, y: acc.y + p.y / ps.length}), {x: 0, y: 0});
        // out of focus: the same mass three times, growing and fading (a soft edge without a blur filter)
        const grow = (g: number) => ps.map((p) => ({x: c.x + (p.x - c.x) * g, y: c.y + (p.y - c.y) * g}));
        return (
          <g key={k}>
            <path d={closed(grow(1.1))} fill={K.near} fillOpacity={0.25} />
            <path d={closed(grow(1.04))} fill={K.near} fillOpacity={0.4} />
            <path d={closed(ps)} fill={K.near} fillOpacity={0.75} />
            <path d={closed(grow(0.94).map((p) => ({x: p.x + LIGHT.x * 0.35, y: p.y + LIGHT.y * 0.35})))} fill={K.nearLit} fillOpacity={0.22} />
          </g>
        );
      })}
    </g>
  );
};

/** the passage beyond the rim (screen space). A point at depth d on its wall projects onto the circle that a radial
 *  gradient (focal point = the vanishing point, outer circle = the rim) reaches at offset u = D / (D + d), so one
 *  gradient gives the darkness by depth, for the passage and for the eel going down it alike */
const passageR = (rh: number, d: number) => rh * (0.96 - 0.22 * (1 - Math.exp(-d / 1.4)));
/** how fast the passage goes dark with depth (u): the walls, and the eel going down it (which hugs the passage closer
 *  to its axis than the walls, so the same gradient reads it as deeper: a longer length compensates) */
/** the light from the stomach reaches further down the passage while we look in from outside, less once we are in
 *  it (the camera at depth D from the rim plane) */
const fogLen = (D: number) => 0.5 + 1.3 * ss(D, 0.8, 4);
/** the eel runs down the passage at this fraction of its radius */
const EEL_RHO = 0.75;
const fogOf = (d: number, L: number) => 1 - Math.exp(-d / L);
const FOG_U = [1, 0.94, 0.86, 0.76, 0.64, 0.5, 0.36, 0.2, 0];
const fogGeom = (cam: Cam, rh: number) => {
  const c0 = proj(cam, OPENING, 0);
  const R = (F * rh) / cam.D;
  // the vanishing point (the screen centre), kept inside the rim circle
  const vx = CS.x - c0.x, vy = CS.y - c0.y, vl = Math.hypot(vx, vy), m = Math.min(1, (0.9 * R) / (vl || 1));
  return {c0, R, f: {x: c0.x + vx * m, y: c0.y + vy * m}};
};
const FogGrad: React.FC<{id: string; cam: Cam; rh: number; from: string; to: string; op?: (fog: number) => number; k?: number}> = ({id, cam, rh, from, to, op, k = 1}) => {
  const L = fogLen(cam.D);
  const g = fogGeom(cam, rh);
  const q = (v: number) => (v / k).toFixed(4);
  return (
    <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={q(g.c0.x)} cy={q(g.c0.y)} r={q(g.R)} fx={q(g.f.x)} fy={q(g.f.y)}>
      {[...FOG_U].reverse().map((u, k) => {
        const d = u <= 0 ? 1e3 : cam.D * (1 / u - 1);
        const fg = fogOf(d, L);
        return <stop key={k} offset={u.toFixed(3)} stopColor={mix(from, to, op ? 1 : fg)} stopOpacity={op ? op(fg) : 1} />;
      })}
    </radialGradient>
  );
};
const Passage: React.FC<{cam: Cam; t: number; clipId: string}> = ({cam, t, clipId}) => {
  const rh = lumenR(t);
  const gid = uid('s4pg');
  const g = fogGeom(cam, rh);
  // soft longitudinal folds: a lit crest and a shaded groove per fold, wedges from the rim down the passage (no lines);
  // the depth fog over everything takes them into the dark
  const wall = (a: number, d: number) => proj(cam, {x: OPENING.x + Math.cos(a) * passageR(rh, d), y: OPENING.y + Math.sin(a) * passageR(rh, d)}, d);
  const wedge = (a: number, w: number) => {
    const ps = [wall(a - w, 0.01), wall(a + w, 0.01), wall(a + w * 0.7, 1.2), wall(a + w * 0.35, 3.5), wall(a - w * 0.35, 3.5), wall(a - w * 0.7, 1.2)];
    return 'M' + ps.map((p) => `${f1(p.x)} ${f1(p.y)}`).join('L') + 'Z';
  };
  // each fold twice, wide and narrow, at low opacity: a soft edge rather than a hard sector
  const crests: string[] = [], grooves: string[] = [];
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * 2 * Math.PI + 0.3 + 0.18 * Math.sin(k * 1.7);
    crests.push(wedge(a, 0.15), wedge(a, 0.07));
    grooves.push(wedge(a + 0.22, 0.09), wedge(a + 0.22, 0.04));
  }
  return (
    <g clipPath={`url(#${clipId})`}>
      <defs>
        <FogGrad id={gid} cam={cam} rh={rh} from={LUMEN} to={LUMEN} op={(fg) => fg} />
      </defs>
      <path d={circleD(g.c0, g.R * 1.05)} fill={K.passage} />
      {/* the lit lower-right inner wall near the rim (it faces the light) */}
      <path d={crescentD(g.c0, g.R * 0.995, Math.atan2(-LIGHT.y, -LIGHT.x), g.R * 0.3)} fill={K.passageLit} fillOpacity={0.4} />
      <path d={crests.join('')} fill={K.passageLit} fillOpacity={0.07} />
      <path d={grooves.join('')} fill={LUMEN} fillOpacity={0.06} />
      <path d={circleD(g.c0, g.R * 1.05)} fill={`url(#${gid})`} />
    </g>
  );
};

/** soft dimples where the tip presses the wall (concave: shaded on the upper left, lit on the lower right) */
const Dimples: React.FC<{t: number}> = ({t}) => (
  <g>
    {TOUCHES.map(([t0, a], k) => {
      const age = t - t0;
      if (age < -0.02 || age > 0.5) return null;
      const x = clamp(age / 0.5);
      const o = a * ss(age, -0.02, 0.02) * Math.pow(1 - x, 1.4);
      const w = poseAt(Math.max(t0, 5.5)).w[N - 1];
      const r = 0.45 + 1.1 * Math.sqrt(x);
      const la = Math.atan2(LIGHT.y, LIGHT.x);
      return (
        <g key={k}>
          <ellipse cx={f2(w.x)} cy={f2(w.y)} rx={f2(r)} ry={f2(r * 0.8)} fill={K.foldCast} fillOpacity={0.32 * o} />
          <path d={crescentD(w, r * 0.98, la, r * 0.45)} fill={K.foldCast} fillOpacity={0.4 * o} />
          <path d={crescentD(w, r * 0.9, la + Math.PI, r * 0.55)} fill={K.glint} fillOpacity={0.45 * o} />
          <ellipse cx={f2(w.x)} cy={f2(w.y)} rx={f2(r * 1.25)} ry={f2(r * 1.0)} fill="none" stroke={K.glint} strokeOpacity={0.5 * o} strokeWidth={1.6} vectorEffect={NS} />
        </g>
      );
    })}
  </g>
);

// ================================================================ the shot
const DORSAL = Array.from({length: N + 1}, (_, i) => lerp(0.62, 0.5, ss(i / N, 0.1, 0.4)));
export const S4Stomach: React.FC<{t: number}> = ({t}) => {
  const fr = frameAt(t);
  const {cam, pose, scr, rS} = fr;
  const k = cam.s;
  const lum = lumenPts(OPENING, lumenR(t), openness(t), t).map((p) => proj(cam, p));
  const lumD = closed(lum);
  const lumId = uid('s4lu');
  const inside = pose.iRim <= N;
  const ptsE = scr.map((p) => ({x: p.x / k, y: p.y / k}));
  const radiiS = RADII.map((R, i) => R * rS[i]);
  const outTo = inside ? pose.iRim : N;
  // the contact shadow: the eel's silhouette dropped to the lower right on the wall
  const shOff = {x: 0.42 * k, y: 0.58 * k};
  const shadowD = eelSilhouette(ptsE, radiiS, 0, outTo, false, t, DORSAL, 0.05);
  const shadowWide = eelSilhouette(ptsE, radiiS, 0, outTo, false, t, DORSAL, 0.45);
  // the fold the tip strikes: a dent along its travel
  const dirB = (() => {
    const a = at2(ROUTE, S_BUMP - 0.6), b = at2(ROUTE, S_BUMP);
    const l = dist(a, b) || 1;
    return {x: (b.x - a.x) / l, y: (b.y - a.y) / l};
  })();
  const dent = {at: DENT_AT, dir: dirB, a: 0.55 * dentAt(t)};
  const fogId = uid('s4fg');
  const vigId = uid('s4vg');
  // the eel down the passage is drawn only as deep as the light reaches (beyond, the fog is total; its fin fringe does
  // not shrink with depth, so the tip down there would show as a stray line)
  const dMax = 4 * fogLen(cam.D);
  const iDeep = Math.min(N, N * (1 - (sTipAt(t) - (S_OPEN - lumenR(t) * 0.92) - dMax) / EEL_L));
  // ... and only its body: the ribbon fin keeps its size in eel units while the body shrinks with depth
  const bodyId = uid('s4bd');
  const bodyD = inside && iDeep > pose.iRim + 0.05 ? eelSilhouette(ptsE, radiiS, Math.max(0, pose.iRim - 0.5), iDeep, false, t, DORSAL, 0.03) : '';
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <clipPath id={lumId}>
          <path d={lumD} />
        </clipPath>
        {bodyD && (
          <clipPath id={bodyId}>
            <path d={bodyD} transform={`scale(${k})`} />
          </clipPath>
        )}

      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill={K.deep} />
      <g transform={layerTf(cam, 0)}>
        <Chamber />
        {RIM_FOLDS.map((f) => (
          <Fold key={f.k} f={f} />
        ))}
        {FOLDS.map((f) => (
          <Fold key={f.k} f={f} />
        ))}
        <Fold f={{pts: FOLD_BUMP_CP, w: 1.02, k: 'bump'}} dent={dent} />
        <Pucker t={t} />
        <Dimples t={t} />
      </g>
      <Passage cam={cam} t={t} clipId={lumId} />
      <g transform={`translate(${f1(shOff.x * 1.35)} ${f1(shOff.y * 1.35)}) scale(${k})`}>
        <path d={shadowWide} fill={K.eelShadow} fillOpacity={0.16} />
      </g>
      <g transform={`translate(${f1(shOff.x)} ${f1(shOff.y)}) scale(${k})`}>
        <path d={shadowD} fill={K.eelShadow} fillOpacity={0.32} />
      </g>
      <Eel2D pts={scr} k={k} px={1} t={t} dorsal={DORSAL} to={outTo} rScale={rS} />
      {inside && iDeep > pose.iRim + 0.05 && (
        <g clipPath={`url(#${lumId})`}>
          <g clipPath={`url(#${bodyId})`}>
            <Eel2D pts={scr} k={k} px={1} t={t} dorsal={DORSAL} from={pose.iRim} to={iDeep} rScale={rS} />
          </g>
          {/* down the passage it goes dark with the same fog as the passage walls (its own gradient: it runs a little
              inside the wall's radius) */}
          <defs>
            <FogGrad id={fogId} cam={cam} rh={lumenR(t) * EEL_RHO} from={LUMEN} to={LUMEN} op={(fg) => fg} k={k} />
          </defs>
          <g transform={`scale(${k})`}>
            <path d={bodyD} fill={`url(#${fogId})`} />
          </g>
        </g>
      )}
      <g transform={layerTf(cam, -3)}>
        <Bubbles t={t} />
      </g>
      <Near cam={cam} />
      {/* the chamber closes round us: the frame's edges fall into the walls' shade */}
      {cam.D > 4 && (
        <>
          <defs>
            <radialGradient id={vigId} gradientUnits="userSpaceOnUse" cx={540} cy={1020} r={1150}>
              <stop offset="0.5" stopColor={K.deep} stopOpacity={0} />
              <stop offset="0.78" stopColor={K.deep} stopOpacity={0.22 * ss(cam.D, 4, 9)} />
              <stop offset="1" stopColor={K.deep} stopOpacity={0.5 * ss(cam.D, 4, 9)} />
            </radialGradient>
          </defs>
          <rect x={0} y={0} width={1080} height={1920} fill={`url(#${vigId})`} />
        </>
      )}
    </svg>
  );
};

// ---------------------------------------------------------------- beats (global s), for the integrator's sound and checks
export const S4_BEATS = {
  carry0: 5.62, // hand-off 1: samples 93..120 on carryTail(t) from here ...
  carry1: CARRY1, // ... to here; then the pull back reveals the chamber, the coil and the head
  wide: TB.pull1, // the wide view of the chamber (the coil, the head and eye, the opening)
  go: TB.go, // the tail tip starts to slide up the wall
  bump: TB.bump, // it strikes the fold (the fold dents and wobbles; a dimple at the tip)
  turn: TB.turn, // it has turned along the fold; the search (two sweeps, touches at 7.76 and 7.93)
  ring: TB.ring, // it reaches the pucker's ring
  press: TB.press, // the tip presses on the pucker's centre
  yield: 8.2, // the opening yields (opening 8.13–8.30): the find
  dive: 8.24, // the tip is in; the camera dives after it (the closest push)
  dark: TB.end, // hand-off 3: the lumen fills the frame
};

// ---------------------------------------------------------------- debug exports for the test entry
export const S4_DEBUG = {ROUTE, S_REST, S_BUMP, S_OPEN, A_REST, A_WIDE, O_WIDE, sTipAt, lumenR, frameAt, KEEP_Y};
