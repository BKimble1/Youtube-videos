// The oyster comparison (film t ≈ 8.0–10.4 s): a Pacific-type oyster cemented to a rounded boulder underwater, seen in
// side profile. World units are millimetres, x right, y down. The rock's surface runs along y = 0 under the oyster
// (rock below, y > 0). MATCH POINT = (0, 0): the cement's contact edge on the rock, a horizontal ink line along y = 0
// across x ≈ [-32, 32] (the shell's cemented skirt spans x ≈ [-28.5, 28.5] just above it). See OYSTER_MATCH.
//
// Science: the oyster cements its LEFT valve (the larger, deeper, cupped one) to the rock; the RIGHT valve is the
// flatter lid on top (closed). The cement is mostly calcium carbonate: a pale seam where the cupped lower valve is
// fused to the rock. Growth lamellae on both valves are nested like flower pots (older layers outside, their free
// frilly edges pointing toward the commissure), purple-brown streaks radiate from the hinge.
//
// The oyster, its cement and the rock never move. Everything that belongs to the water moves: particles drift with a
// left-to-right current in several depth layers, seaweed sways, bubbles rise, light shafts and caustics shimmer.
import React from 'react';
import {Cam, Layer, viewRect, W, H} from '../camera';
import {C} from './palette';
import {P, pt, add, mul, nrm, perp, sub, line, closed, open, tube, n4} from '../core/geo';
import {mix, rgba} from '../core/color';
import {clamp, ss, lerp, noise1, hash} from '../lib';
import {Inked, Deco, InkPath, InkLine, INK, OUTLINE_K, FEATURE_K} from '../dc/ink';

const f = n4;
const TAU = Math.PI * 2;

// ------------------------------------------------------------------ colours (underwater grading of the episode palette)
const tint = (c: string, k: number) => mix(c, C.sea, k);
const K = {
  rock: tint(C.rock, 0.24),
  rockLit: tint(C.rockLit, 0.12),
  rockDeep: tint(C.rockDeep, 0.32),
  shell: tint(C.shell, 0.03),
  shellLit: tint(C.shellLit, 0.02),
  shellDeep: tint(C.shellDeep, 0.05),
  streak: '#6A3F5C',
  cement: C.cement,
  cementLit: '#FBF8F2',
  cementShade: mix(C.cement, C.rock, 0.42),
  weed: '#4A8757',
  weedLit: '#8CC07E',
  weedDeep: '#255541',
  weedHold: '#3D5B3A',
  mote: '#DDF6F0',
  caustic: '#E4FFF8',
  shaft: '#D8FFF4',
  shadow: '#16303A',
};

// ------------------------------------------------------------------ small geometry helpers
const crP = (p0: P, p1: P, p2: P, p3: P, u: number): P => {
  const u2 = u * u, u3 = u2 * u;
  const c = (a: number, b: number, c2: number, d: number) => 0.5 * (2 * b + (-a + c2) * u + (2 * a - 5 * b + 4 * c2 - d) * u2 + (-a + 3 * b - 3 * c2 + d) * u3);
  return pt(c(p0.x, p1.x, p2.x, p3.x), c(p0.y, p1.y, p2.y, p3.y));
};
/** dense samples of a Catmull-Rom curve through ps (about `step` apart) */
const spline = (ps: P[], step = 0.25): P[] => {
  const out: P[] = [];
  for (let i = 0; i < ps.length - 1; i++) {
    const p0 = ps[Math.max(0, i - 1)], p1 = ps[i], p2 = ps[i + 1], p3 = ps[Math.min(ps.length - 1, i + 2)];
    const n = Math.max(2, Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y) / step));
    for (let k = 0; k < n; k++) out.push(crP(p0, p1, p2, p3, k / n));
  }
  out.push(ps[ps.length - 1]);
  return out;
};
/** x on a polyline (monotone in y) at height y */
const xAtY = (ps: P[], y: number) => {
  for (let i = 0; i < ps.length - 1; i++) {
    const a = ps[i], b = ps[i + 1];
    if ((y - a.y) * (y - b.y) <= 0 && a.y !== b.y) return a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y);
  }
  return Math.abs(y - ps[0].y) < Math.abs(y - ps[ps.length - 1].y) ? ps[0].x : ps[ps.length - 1].x;
};
/** y on a polyline (monotone in x) at x */
const yAtX = (ps: P[], x: number) => {
  for (let i = 0; i < ps.length - 1; i++) {
    const a = ps[i], b = ps[i + 1];
    if ((x - a.x) * (x - b.x) <= 0 && a.x !== b.x) return a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x);
  }
  return Math.abs(x - ps[0].x) < Math.abs(x - ps[ps.length - 1].x) ? ps[0].y : ps[ps.length - 1].y;
};
const arcs = (ps: P[]) => {
  const s = [0];
  for (let i = 1; i < ps.length; i++) s.push(s[i - 1] + Math.hypot(ps[i].x - ps[i - 1].x, ps[i].y - ps[i - 1].y));
  return s;
};
/** a frilly edge along a dense base polyline, offset in y by dir: 'scallop' = rounded lobes with sharp valleys,
 *  'tooth' = the oyster's zigzag (plicate) margin, pointed teeth with softened tips. amp is scaled by ampK(u). */
const frill = (
  base: P[], dir: number, amp: [number, number], wl: [number, number], seed: number,
  o: {taper?: number; sharp?: number; mode?: 'scallop' | 'tooth'; ampK?: (u: number) => number} = {},
): P[] => {
  const {taper = 1.6, sharp = 0.55, mode = 'scallop', ampK = () => 1} = o;
  const s = arcs(base);
  const L = s[s.length - 1];
  const b = [0];
  for (let j = 0; b[b.length - 1] < L; j++) b.push(b[b.length - 1] + lerp(wl[0], wl[1], hash(seed * 7.13 + j * 3.71)));
  const k = L / b[b.length - 1];
  for (let i = 0; i < b.length; i++) b[i] *= k;
  let j = 0;
  const r = 0.035, top = Math.sqrt(1 + r) - Math.sqrt(r);
  return base.map((p, i) => {
    while (j < b.length - 2 && s[i] > b[j + 1]) j++;
    const u = clamp((s[i] - b[j]) / (b[j + 1] - b[j]));
    const uu = Math.pow(u, 0.75 + 0.5 * hash(seed * 1.37 + j * 5.11));
    const a = lerp(amp[0], amp[1], hash(seed * 2.9 + j * 1.618)) * ampK(s[i] / L);
    const tp = ss(s[i], 0, taper) * ss(L - s[i], 0, taper);
    const sh = mode === 'tooth' ? (Math.sqrt(1 + r) - Math.sqrt((2 * uu - 1) ** 2 + r)) / top : Math.pow(Math.sin(Math.PI * uu), sharp);
    return pt(p.x, p.y + dir * a * sh * tp);
  });
};
/** sample y(u) along x from xa to xb */
const edge = (xa: number, xb: number, y: (u: number, x: number) => number, step = 0.22): P[] => {
  const n = Math.max(2, Math.ceil(Math.abs(xb - xa) / step));
  const out: P[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, x = lerp(xa, xb, u);
    out.push(pt(x, y(u, x)));
  }
  return out;
};
const range = (a: number, b: number, step: number) => {
  const out: number[] = [];
  const n = Math.max(1, Math.ceil(Math.abs(b - a) / step));
  for (let i = 0; i <= n; i++) out.push(lerp(a, b, i / n));
  return out;
};
const shift = (ps: P[], dx: number, dy: number) => ps.map((p) => pt(p.x + dx, p.y + dy));

// ------------------------------------------------------------------ the oyster (static geometry, built once)
// Side profile, hinge (umbo) on the LEFT low near the rock, the bill (growing margin) on the RIGHT raised away from
// it, so the commissure climbs from lower left to upper right. The cupped lower valve sits on a narrower cemented
// foot (x ≈ [-28, 29]); its growth lamellae fan out from the hinge.
type Band = {d: string; top: string; topPts: P[]; k: number};
const buildOyster = () => {
  const LV_L = spline([pt(-35.8, -15.2), pt(-35.3, -12), pt(-33.8, -9), pt(-30.6, -6.6), pt(-27.6, -4.8), pt(-26.3, -3.6), pt(-26.0, -2.8)]);
  const LV_R = spline([pt(35.0, -30.8), pt(35.8, -27), pt(35.6, -23), pt(34.6, -18.6), pt(33.0, -14.2), pt(30.6, -10.2), pt(28.0, -6.8), pt(26.1, -4.4), pt(25.6, -2.8)]);

  const HINGE = pt(-36.2, -15.6), BILL = pt(35.4, -31.2);
  const commBase = edge(HINGE.x, BILL.x, (u) => lerp(HINGE.y, BILL.y, u) + 1.5 * Math.sin(Math.PI * u) + 0.9 * Math.sin(TAU * 1.6 * u + 0.4) * Math.sin(Math.PI * u));
  const comm = frill(commBase, 1, [1.7, 3.0], [4.4, 7.2], 11, {mode: 'tooth', taper: 2.2, ampK: (u) => 0.4 + 0.6 * u});

  // lower valve lamellae: 0 = newest (at the margin, under the lid's teeth) .. 3 = oldest, the cemented skirt.
  // Older layers sit outside (nested flower pots): each lower band is drawn over the one above, its free frilly edge
  // pointing up toward the commissure, and steps out a little further (more on the bill side).
  const SPEC = [
    {yl: 0, yr: 0, sag: 0, sl: 0, sr: 0, amp: [0, 0] as [number, number], seed: 0},
    {yl: -13.0, yr: -24.6, sag: 1.6, sl: 0.6, sr: 1.4, amp: [1.0, 2.1] as [number, number], seed: 21},
    {yl: -9.8, yr: -16.6, sag: 1.5, sl: 1.1, sr: 2.4, amp: [1.0, 2.0] as [number, number], seed: 31},
    {yl: -7.0, yr: -10.2, sag: 0.7, sl: 1.5, sr: 2.5, amp: [0.8, 1.6] as [number, number], seed: 41},
  ];
  const SKIRT_Y = -4.7;
  const skirtFrill = (xr: number, xl: number) => frill(edge(xr, xl, (u, x) => SKIRT_Y + 0.35 * noise1(x * 0.3, 8)), 1, [0.5, 1.5], [3.4, 7.0], 51, {taper: 0.8, sharp: 0.42});
  const baseLines: P[][] = [];
  const bands: Band[] = SPEC.map((b, k) => {
    let topPts: P[];
    if (k === 0) {
      topPts = shift(commBase, 0, -1.0);
    } else {
      const xl = xAtY(LV_L, b.yl) - b.sl, xr = xAtY(LV_R, b.yr) + b.sr;
      const base = edge(xl, xr, (u, x) => lerp(b.yl, b.yr, u) + b.sag * Math.sin(Math.PI * u) + 0.5 * noise1(x * 0.16, b.seed));
      baseLines[k] = base;
      topPts = frill(base, -1, b.amp, [4.0, 8.4], b.seed, {taper: 1.2, ampK: (u) => Math.max(0.12, (0.35 + 0.85 * u) * (0.62 + 0.55 * noise1(u * 5.5 + b.seed, 7)))});
    }
    const yb = k === 3 ? SKIRT_Y : -6.2; // the newer lamellae end under the skirt (never below its scallops)
    // flaky shelf lips: each older lamella's free edge sticks out past the wall (more on the bill side) and curls down
    const FR = [0, 1.7, 1.5, 1.2][k], FL = [0, 0.6, 0.5, 0.45][k];
    if (k > 0) {
      const a = topPts[0], z = topPts[topPts.length - 1];
      topPts = [pt(a.x - 0.75 * FL, a.y + 1.3), pt(a.x - FL, a.y + 0.35), ...topPts, pt(z.x + 0.65 * FR, z.y - 0.2), pt(z.x + FR, z.y + 0.9), pt(z.x + 0.8 * FR, z.y + 2.0)];
    }
    const yR = topPts[topPts.length - 1].y + (k > 0 ? 0.8 : 0), yL = topPts[0].y + (k > 0 ? 0.6 : 0);
    const right = range(yR, yb, 0.4).map((y) => pt(xAtY(LV_R, y) + b.sr, y));
    const left = range(yb, yL, 0.4).map((y) => pt(xAtY(LV_L, y) - b.sl, y));
    const bottom = k === 3 ? skirtFrill(right[right.length - 1].x, left[0].x) : [pt(right[right.length - 1].x, yb), pt(left[0].x, yb)];
    return {d: line([...topPts, ...right, ...bottom, ...left]) + 'Z', top: line(topPts), topPts, k};
  });
  const skirtBottom = skirtFrill(xAtY(LV_R, SKIRT_Y) + SPEC[3].sr, xAtY(LV_L, SKIRT_Y) - SPEC[3].sl);
  // partial lamellae: short frilly ridges that start and end inside a band (growth is never perfectly regular)
  const partial = (k: number, x0: number, x1: number, frac: number, seed: number) => {
    const below = k < 3 ? baseLines[k + 1] : null;
    const base = edge(x0, x1, (u, x) => lerp(yAtX(baseLines[k], x), below ? yAtX(below, x) : SKIRT_Y, frac) + 0.3 * noise1(x * 0.3, seed));
    return frill(base, -1, [0.5, 1.3], [3.4, 6.0], seed, {taper: 4});
  };
  const partials: {k: number; pts: P[]}[] = [
    {k: 1, pts: partial(1, -6, 27, 0.5, 81)},
    {k: 2, pts: partial(2, -22, 8, 0.52, 82)},
    {k: 2, pts: partial(2, 14, 30, 0.45, 83)},
    {k: 3, pts: partial(3, -10, 20, 0.5, 84)},
  ];

  // the lid (right valve): flat plates stacked, the oldest (smallest) on top, frilly edges pointing down
  const DOME = spline(
    [BILL, pt(35.6, -33.8), pt(33.8, -36.6), pt(29.8, -38.8), pt(23, -40.0), pt(15, -39.4), pt(9, -39.2), pt(3, -37.8), pt(-3.5, -36.6), pt(-13, -32.8), pt(-21, -28.9), pt(-27.5, -24.0), pt(-32.2, -19.8), pt(-34.9, -17.0), HINGE].map(
      (p, i, a) => (i === 0 || i === a.length - 1 ? p : pt(p.x, p.y + 0.7 * noise1(i * 1.7, 5))),
    ),
  );
  const domeByX = [...DOME].reverse();
  const domeY = (x: number) => yAtX(domeByX, x);
  const commY = (x: number) => yAtX(commBase, x);
  const lidPlate = (up: [number, number], seed: number, amp: [number, number], rise = -99, flake = 1.4) => {
    // left of `rise` the plate's edge curves up into the dome, so a short plate starts without a step
    const base = edge(HINGE.x, BILL.x, (u, x) => commY(x) - lerp(up[0], up[1], u) - 0.08 * Math.max(0, rise - x) ** 2 + 0.3 * noise1(x * 0.2, seed)).filter(
      (p) => p.y > domeY(p.x) + 0.9,
    );
    const fr = frill(base, 1, amp, [3.0, 6.0], seed, {taper: 1.4, ampK: (u) => 0.5 + 0.6 * u});
    const xa = fr[0].x, xb = fr[fr.length - 1].x;
    // the plate's free edge flakes out past the profile at the bill end, so the silhouette steps
    const z = fr[fr.length - 1];
    const lip = [...fr, pt(z.x + 0.9 * flake, z.y - 0.2), pt(z.x + 1.25 * flake, z.y + 0.75), pt(z.x + 0.9 * flake, z.y + 1.5)];
    const top = DOME.filter((p) => p.x < xb && p.x > xa);
    return {d: line([...lip, ...top]) + 'Z', lip, lipD: line(lip)};
  };
  const L0 = {d: line([...comm, ...DOME.slice(1, -1)]) + 'Z', lip: comm, lipD: line(comm)};
  const L1 = lidPlate([2.6, 4.6], 61, [0.6, 1.4], -99, 1.6);
  const L2 = lidPlate([5.8, 8.6], 71, [0.5, 1.1], -4, 1.3);

  // the cement: a pale calcium-carbonate seam under the skirt, its contact edge exactly on y = 0, meniscus fillets
  const skL = skirtBottom[skirtBottom.length - 1].x, skR = skirtBottom[0].x;
  // convex beads at the ends (cement squeezed out from under the shell), thin feathered toes on the rock
  const filL = spline([pt(skL + 1.0, -5.3), pt(skL - 0.5, -4.0), pt(skL - 1.6, -2.4), pt(skL - 2.1, -1.0), pt(skL - 2.6, -0.25), pt(skL - 3.3, 0)], 0.12);
  const filR = spline([pt(skR + 3.4, 0), pt(skR + 2.7, -0.25), pt(skR + 2.2, -1.0), pt(skR + 1.7, -2.4), pt(skR + 0.5, -4.0), pt(skR - 1.0, -5.3)], 0.12);
  const cement = line([...filL, ...filR]) + 'Z';
  const cementFoot: [number, number] = [skL - 3.3, skR + 3.4];

  return {bands, partials, comm, L0, L1, L2, cement, cementFoot, skirtBottom, base: [skL, skR] as [number, number], HINGE, BILL};
};
const OY = buildOyster();

/** purple-brown streaks radiating from the hinge (thin wedges, clipped to each lamella) */
const ray = (from: P, to: P, w0: number, w1: number, bow: number) => {
  const d = sub(to, from), n = perp(nrm(d)), L = Math.hypot(d.x, d.y);
  const ps: P[] = [], qs: P[] = [];
  for (let i = 0; i <= 12; i++) {
    const u = i / 12;
    const c = add(add(from, mul(d, u)), mul(n, bow * L * Math.sin(Math.PI * u) * 0.5));
    const w = lerp(w0, w1, Math.pow(u, 0.8)) * (1 + 0.18 * Math.sin(u * 17 + w1));
    ps.push(add(c, mul(n, w / 2)));
    qs.push(add(c, mul(n, -w / 2)));
  }
  return line([...ps, ...qs.reverse()]) + 'Z';
};
const H0 = pt(-36.8, -15.8);
const RAYS_LOW = [
  ray(H0, pt(-20, 6), 0.25, 2.6, 0.08),
  ray(H0, pt(-3, 5), 0.25, 3.4, 0.06),
  ray(H0, pt(13, 2), 0.25, 2.4, 0.04),
  ray(H0, pt(26, -4), 0.25, 3.2, 0.02),
  ray(H0, pt(36, -17), 0.2, 2.2, -0.01),
];
const RAYS_LID = [
  ray(H0, pt(-14, -37), 0.2, 2.0, -0.04),
  ray(H0, pt(4, -43), 0.2, 2.8, -0.03),
  ray(H0, pt(22, -44), 0.2, 2.2, -0.02),
  ray(H0, pt(37, -37), 0.2, 1.8, 0.0),
];

// ------------------------------------------------------------------ the rock (static)
const ROCK_TOP = spline(
  [
    pt(-210, 250), pt(-160, 140), pt(-128, 86), pt(-106, 55), pt(-90, 35), pt(-77, 21), pt(-67, 12.5), pt(-60, 8.6), pt(-55.5, 7.4), pt(-51, 5.8),
    pt(-45, 2.0), pt(-38, -1.6), pt(-30, -3.6), pt(-15, -4.0), pt(0, -4.1), pt(15, -4.0), pt(30, -3.6), pt(38, -1.8), pt(45, 1.4), pt(52, 5.0),
    pt(58, 7.0), pt(63, 8.0), pt(68, 10.6), pt(76, 16.5), pt(88, 28), pt(104, 47), pt(124, 76), pt(150, 122), pt(210, 240),
  ],
  0.8,
);
const ROCK_D = line([...ROCK_TOP, pt(220, 560), pt(-220, 560)]) + 'Z';
/** the visible rock surface (just in front of the silhouette) at x: for anchoring things on the rock */
const surfY = (x: number) => yAtX(ROCK_TOP, x) + 2.0;
const CRACKS: P[][] = [
  [pt(-66, 13.5), pt(-67.6, 19), pt(-65.4, 23.5), pt(-68.4, 29.5), pt(-67, 35), pt(-70.5, 42)],
  [pt(-67.4, 25), pt(-62.5, 28), pt(-60.4, 32.5)],
  [pt(52, 8.5), pt(50.4, 14.5), pt(53.4, 20), pt(51.8, 27), pt(54.6, 34), pt(53.2, 41)],
  [pt(-12, 30), pt(-9.4, 34.5), pt(-10.6, 39), pt(-7.4, 44)],
  [pt(10.5, 7.5), pt(12.2, 10.5), pt(11.4, 13.6), pt(13.4, 17)],
];

// ------------------------------------------------------------------ the water
/** how far the water has moved (mm) by film time t: a steady left-to-right current with a gentle surge */
const flow = (t: number) => 7.5 * (t - 8) + 1.3 * Math.sin(0.9 * t);
const flowV = (t: number) => 7.5 + 1.17 * Math.cos(0.9 * t);

type Motes = {z: number; cell: number; dens: number; r: [number, number]; a: number; seed: number; blurK: number; maxBlur: number; color: string};
const MOTES: Motes[] = [
  {z: 300, cell: 16, dens: 0.38, r: [0.9, 1.7], a: 0.42, seed: 1, blurK: 9, maxBlur: 6, color: mix(K.mote, C.seaLit, 0.45)},
  {z: 130, cell: 12, dens: 0.32, r: [0.5, 0.95], a: 0.5, seed: 2, blurK: 9, maxBlur: 5, color: mix(K.mote, C.seaLit, 0.25)},
  {z: 45, cell: 10, dens: 0.28, r: [0.3, 0.6], a: 0.6, seed: 3, blurK: 8, maxBlur: 4, color: K.mote},
  {z: 0, cell: 9, dens: 0.3, r: [0.15, 0.32], a: 0.75, seed: 4, blurK: 0, maxBlur: 0, color: K.mote},
  {z: -15, cell: 15, dens: 0.34, r: [0.42, 0.8], a: 0.45, seed: 5, blurK: 50, maxBlur: 14, color: K.mote},
  {z: -32, cell: 26, dens: 0.24, r: [1.0, 1.7], a: 0.26, seed: 6, blurK: 60, maxBlur: 26, color: K.mote},
];
const MoteField: React.FC<{t: number; cam: Cam; m: Motes}> = ({t, cam, m}) => {
  const [x0, y0, x1, y1] = viewRect(cam, m.z, 1.12);
  const u = flow(t);
  const out: React.ReactNode[] = [];
  const i0 = Math.floor((x0 - u) / m.cell) - 1, i1 = Math.ceil((x1 - u) / m.cell) + 1;
  const j0 = Math.floor(y0 / m.cell) - 1, j1 = Math.ceil(y1 / m.cell) + 1;
  const stretch = 1.35 + 0.05 * flowV(t);
  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) {
      const h = hash(i * 12.9898 + j * 78.233 + m.seed * 37.719);
      if (h > m.dens) continue;
      const hx = hash(h * 91.7 + 1.3), hy = hash(h * 53.1 + 2.7), hr = hash(h * 17.3 + 5.1), hp = hash(h * 29.9 + 0.3);
      const x = (i + hx) * m.cell + u + 1.1 * Math.sin(0.8 * t + hp * TAU);
      const y = (j + hy) * m.cell + 0.9 * Math.sin(0.62 * t + hp * 9.1) + 0.6 * noise1(t * 0.7 + hp * 10, m.seed);
      if (x < x0 || x > x1 || y < y0 || y > y1) continue;
      const r = lerp(m.r[0], m.r[1], hr);
      const ang = -8 + 16 * hp;
      out.push(
        <ellipse key={`${i}_${j}`} cx={f(x)} cy={f(y)} rx={f(r * stretch)} ry={f(r * 0.8)} transform={`rotate(${f(ang)} ${f(x)} ${f(y)})`} fill={m.color} opacity={f(m.a * (0.55 + 0.45 * hr))} />,
      );
    }
  }
  return <>{out}</>;
};

/** bubbles: a few, rising from behind the boulder, wobbling and carried a little by the current */
const Bubbles: React.FC<{t: number; cam: Cam; z: number; seed: number; every: number; xs: [number, number]; y0: number; rr: [number, number]}> = ({t, cam, z, seed, every, xs, y0, rr}) => {
  const [vx0, vy0, vx1, vy1] = viewRect(cam, z, 1.1);
  const out: React.ReactNode[] = [];
  const k0 = Math.floor((t - 9) / every) - 1, k1 = Math.floor(t / every) + 1;
  for (let k = k0; k <= k1; k++) {
    const ts = k * every + 0.45 * every * hash(k * 7.1 + seed);
    if (ts > t) continue;
    const age = t - ts;
    const v = 15 + 9 * hash(k * 9.1 + seed);
    const bx = lerp(xs[0], xs[1], hash(k * 3.3 + seed * 1.7));
    const y = y0 + 6 * hash(k * 1.7 + seed) - v * age - 0.8 * age * age;
    const x = bx + 0.5 * 7.5 * age + 1.4 * Math.sin(5.2 * age + k);
    const r = lerp(rr[0], rr[1], hash(k * 4.4 + seed)) * (1 + 0.03 * age);
    if (y < vy0 - 4 || y > vy1 + 4 || x < vx0 - 4 || x > vx1 + 4) continue;
    const sq = 1 + 0.07 * Math.sin(9 * age + k);
    out.push(
      <g key={k} transform={`translate(${f(x)} ${f(y)})`}>
        <ellipse rx={f(r * sq)} ry={f(r / sq)} fill={rgba(mix(C.seaLit, '#FFFFFF', 0.35), 0.28)} stroke="#EFFFFB" strokeWidth={f(r * 0.17)} strokeOpacity={0.85} />
        <path d={`M${f(r * 0.25)} ${f(r * 0.72)}A${f(r * 0.78)} ${f(r * 0.78)} 0 0 0 ${f(r * 0.74)} ${f(r * 0.2)}`} fill="none" stroke="#FFFFFF" strokeWidth={f(r * 0.12)} strokeLinecap="round" opacity={0.5} />
        <ellipse cx={f(-r * 0.36)} cy={f(-r * 0.38)} rx={f(r * 0.26)} ry={f(r * 0.17)} transform={`rotate(-40 ${f(-r * 0.36)} ${f(-r * 0.38)})`} fill="#FFFFFF" opacity={0.95} />
      </g>,
    );
  }
  return <>{out}</>;
};

/** one seaweed strand: a ruffled ribbon anchored on the rock, bending with the current and swaying */
const strand = (base: P, len: number, wid: number, lean: number, t: number, seed: number) => {
  const n = 26;
  const Cs: P[] = [base];
  const R: number[] = [];
  const surge = 1 + 0.18 * Math.sin(0.9 * t + seed * 0.3);
  for (let i = 1; i <= n; i++) {
    const s = i / n;
    const a = lean + 0.8 * s * surge + 0.34 * s * Math.sin(TAU * 0.34 * t - 2.9 * s + seed) + 0.08 * noise1(t * 0.9 - s * 2.2, seed);
    const prev = Cs[i - 1];
    Cs.push(pt(prev.x + Math.sin(a) * (len / n), prev.y - Math.cos(a) * (len / n)));
  }
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    const prof = 0.28 + 0.72 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.1 + s * 0.98)), 0.55);
    R.push(wid * prof * (1 + 0.1 * Math.sin(s * 23 + seed + t * 1.3)) * (s > 0.97 ? 0.5 : 1));
  }
  return tube(Cs, R, true, false);
};

const Seaweed: React.FC<{id: string; t: number; base: P; len: number; wid: number; lean: number; seed: number; iw: number; lw: number}> = ({id, t, base, len, wid, lean, seed, iw, lw}) => {
  const tb = strand(base, len, wid, lean, t, seed);
  // tube's L edge is +perp(T): for a strand pointing up that is the screen-right side, the shadow side
  const shadowHalf = line([...tb.L, ...[...tb.C].reverse()]) + 'Z';
  const outline = line(tb.outline) + 'Z';
  const hold = `M${f(base.x - 2.2)} ${f(base.y + 0.6)}Q${f(base.x - 1.2)} ${f(base.y - 1.6)} ${f(base.x)} ${f(base.y - 1.8)}Q${f(base.x + 1.3)} ${f(base.y - 1.5)} ${f(base.x + 2.4)} ${f(base.y + 0.6)}Z`;
  return (
    <Inked w={iw}>
      <InkPath d={outline} fill={K.weed} />
      <InkPath d={hold} fill={K.weedHold} />
      <Deco>
        <path d={shadowHalf} fill={K.weedDeep} opacity={0.55} />
        <path d={open(tb.C.slice(1, -2).map((p, i) => add(p, mul(tb.N[i + 1], -tb.rad[i + 1] * 0.45))), 1)} fill="none" stroke={K.weedLit} strokeWidth={f(wid * 0.32)} strokeLinecap="round" opacity={0.7} />
        <path d={open(tb.C.slice(2, -3), 1)} fill="none" stroke={mix(K.weedDeep, K.weed, 0.4)} strokeWidth={f(lw * 0.6)} strokeLinecap="round" opacity={0.6} />
      </Deco>
    </Inked>
  );
};

/** short algae fuzz on the rock (tiny tufts, swaying) */
const Tuft: React.FC<{t: number; c: P; n: number; size: number; seed: number}> = ({t, c, n, size, seed}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const h = hash(seed * 13.1 + i * 7.7);
      const x = c.x + (i - (n - 1) / 2) * size * 0.28 + (h - 0.5) * size * 0.2;
      const L = size * (0.6 + 0.6 * hash(seed + i * 3.1));
      const a = -0.5 + (i / Math.max(1, n - 1)) * 0.9 + 0.35 + 0.22 * Math.sin(TAU * 0.5 * t + i * 1.1 + seed);
      const m = pt(x + Math.sin(a * 0.6) * L * 0.5, c.y - Math.cos(a * 0.6) * L * 0.5);
      const e = pt(x + Math.sin(a) * L, c.y - Math.cos(a) * L);
      return (
        <path key={i} d={`M${f(x)} ${f(c.y + 0.4)}Q${f(m.x)} ${f(m.y)} ${f(e.x)} ${f(e.y)}`} fill="none" stroke={i % 2 ? K.weed : mix(K.weed, K.weedLit, 0.45)} strokeWidth={f(size * 0.075)} strokeLinecap="round" />
      );
    })}
  </g>
);

// ------------------------------------------------------------------ line weights (screen-consistent, slightly heavier when close)
const pxPerMm = (cam: Cam) => W / cam.w;
const grow = (cam: Cam) => Math.pow(150 / cam.w, 0.42);
/** the Inked width for an outline of `px` screen pixels */
const inkW = (cam: Cam, px = 4.2) => (px * grow(cam)) / pxPerMm(cam) / OUTLINE_K;
/** the InkLine width for a drawn line of `px` screen pixels */
const lineW = (cam: Cam, px: number) => (px * grow(cam)) / pxPerMm(cam) / FEATURE_K;

// ------------------------------------------------------------------ main layer pieces
const TERM = [pt(-220, 170), pt(-120, 132), pt(-40, 112), pt(30, 88), pt(76, 54), pt(104, 38), pt(220, 64)];
const FACET = [pt(-160, 130), pt(-134, 76), pt(-108, 46), pt(-84, 28), pt(-60, 19), pt(-40, 18), pt(-24, 22), pt(-34, 40), pt(-62, 62), pt(-100, 92), pt(-136, 132)];
const BUMPS = [
  {c: pt(-34, 42), rx: 10, ry: 5.2},
  {c: pt(44, 30), rx: 7.5, ry: 4.0},
  {c: pt(-74, 40), rx: 6, ry: 3.4},
];
const PITS = [pt(-44, 46), pt(-38.5, 49), pt(18, 30), pt(62, 70), pt(-92, 70), pt(-10.5, 21), pt(-7.8, 22.2)];
const RockBody: React.FC<{id: string; iw: number; lw: number}> = ({id, iw, lw}) => {
  const term = open(TERM, 1);
  return (
    <>
      <defs>
        <clipPath id={`${id}-rclip`}>
          <path d={ROCK_D} />
        </clipPath>
        <linearGradient id={`${id}-rg`} gradientUnits="userSpaceOnUse" x1="0" y1="-5" x2="0" y2="150">
          <stop offset="0" stopColor={mix(K.rockLit, '#FFFFFF', 0.08)} />
          <stop offset="0.055" stopColor={K.rockLit} />
          <stop offset="0.13" stopColor={K.rock} />
          <stop offset="0.6" stopColor={mix(K.rock, K.rockDeep, 0.65)} />
          <stop offset="1" stopColor={K.rockDeep} />
        </linearGradient>
        <radialGradient id={`${id}-rs`} gradientUnits="userSpaceOnUse" cx="-18" cy="10" r="150" fx="-40" fy="-10">
          <stop offset="0" stopColor={K.rockDeep} stopOpacity={0} />
          <stop offset="0.55" stopColor={K.rockDeep} stopOpacity={0} />
          <stop offset="1" stopColor={K.rockDeep} stopOpacity={0.85} />
        </radialGradient>
      </defs>
      <defs>
        {BUMPS.map((b, i) => (
          <linearGradient key={i} id={`${id}-bu${i}`} gradientUnits="userSpaceOnUse" x1={f(b.c.x - b.rx * 0.6)} y1={f(b.c.y - b.ry)} x2={f(b.c.x + b.rx * 0.5)} y2={f(b.c.y + b.ry)}>
            <stop offset="0" stopColor={K.rockLit} stopOpacity={0.55} />
            <stop offset="0.55" stopColor={K.rock} stopOpacity={0.6} />
            <stop offset="1" stopColor={K.rock} stopOpacity={0.15} />
          </linearGradient>
        ))}
      </defs>
      <Inked w={iw}>
        <InkPath d={ROCK_D} fill={`url(#${id}-rg)`} />
      </Inked>
      <g clipPath={`url(#${id}-rclip)`}>
        <rect x="-220" y="-10" width="440" height="570" fill={`url(#${id}-rs)`} />
        {/* cel planes: a lit facet on the upper left, a small one on the right shoulder, the shadow side lower right */}
        <path d={closed(FACET, 0.55)} fill={K.rockLit} opacity={0.16} />
        <path d={term + 'L220 560L-220 560Z'} fill={K.rockDeep} opacity={0.42} />
        <path d={open(shift(ROCK_TOP.filter((p) => p.x > -118 && p.x < -36), 0, 1.6), 1)} fill="none" stroke={mix(K.rockLit, '#FFFFFF', 0.35)} strokeWidth="1.3" strokeLinecap="round" opacity={0.55} />
        {/* raised bumps: a shadow crescent to the lower right, a lit cap to the upper left */}
        {BUMPS.map((b, i) => (
          <g key={`b${i}`}>
            <ellipse cx={f(b.c.x + b.rx * 0.12)} cy={f(b.c.y + b.ry * 0.3)} rx={f(b.rx)} ry={f(b.ry)} fill={K.rockDeep} opacity={0.32} />
            <ellipse cx={f(b.c.x)} cy={f(b.c.y)} rx={f(b.rx)} ry={f(b.ry)} fill={`url(#${id}-bu${i})`} />
            <path d={`M${f(b.c.x - b.rx * 0.92)} ${f(b.c.y + b.ry * 0.1)}A${f(b.rx)} ${f(b.ry)} 0 0 1 ${f(b.c.x + b.rx * 0.2)} ${f(b.c.y - b.ry * 0.98)}`} fill="none" stroke={mix(K.rockLit, '#FFFFFF', 0.3)} strokeWidth={f(lw * 0.9)} strokeLinecap="round" opacity={0.55} />
          </g>
        ))}
        {/* a faint green film of algae on the shaded lower face */}
        <ellipse cx="-80" cy="76" rx="30" ry="10" transform="rotate(-24 -80 76)" fill={K.weedDeep} opacity={0.14} />
        <ellipse cx="96" cy="64" rx="24" ry="8" transform="rotate(30 96 64)" fill={K.weedDeep} opacity={0.13} />
        {/* pits: a dark hollow with a lit lower lip */}
        {PITS.map((q, i) => {
          const r = i >= 5 ? 0.45 + 0.35 * hash(i * 3.7) : 1.1 + 0.9 * hash(i * 3.7);
          return (
            <g key={i}>
              <ellipse cx={f(q.x + 0.25 * r)} cy={f(q.y + 0.3 * r)} rx={f(r * 1.05)} ry={f(r * 0.72)} fill={mix(K.rockLit, '#FFFFFF', 0.1)} opacity={0.35} />
              <ellipse cx={f(q.x)} cy={f(q.y)} rx={f(r)} ry={f(r * 0.62)} fill={mix(K.rockDeep, C.seaDeep, 0.45)} opacity={0.75} />
            </g>
          );
        })}
        {/* cracks: a dark groove with a lit lower-right lip */}
        {CRACKS.map((c, i) => (
          <g key={i}>
            <path d={open(shift(c, 0.4, 0.4), 0.6)} fill="none" stroke={mix(K.rockLit, '#FFFFFF', 0.15)} strokeWidth={f(lw * 0.8)} strokeLinecap="round" strokeLinejoin="round" opacity={0.4} />
            <path d={open(c, 0.6)} fill="none" stroke={mix(K.rockDeep, C.seaDeep, 0.55)} strokeWidth={f(lw * 0.9)} strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
          </g>
        ))}
        {/* cool light bouncing up from the water along the shaded flank, warm light on the lit shoulder */}
        <path d={line(ROCK_TOP.filter((p) => p.x > 58))} fill="none" stroke={C.seaLit} strokeWidth="5" opacity={0.2} />
        <path d={line(ROCK_TOP.filter((p) => p.x < -60))} fill="none" stroke={mix(K.rockLit, '#FFFFFF', 0.3)} strokeWidth="3.5" opacity={0.3} />
      </g>
    </>
  );
};

/** caustic shimmer on the top of the rock (its own softly blurred layer) */
const Caustics: React.FC<{id: string; t: number; cam: Cam; lw: number}> = ({id, t, cam, lw}) => {
  const [x0, , x1] = viewRect(cam, 0, 1.15);
  // caustics: thin bright wobbly loops that overlap into a shifting net, foreshortened toward the back of the top
  const loops: string[] = [];
  const sx = 10;
  const rowY = (j: number) => -5.2 + 1.9 * j + 0.32 * j * j;
  for (let j = 0; j < 8; j++) {
    const y = rowY(j), sy = rowY(j + 1) - y;
    for (let i = Math.floor(x0 / sx) - 1; i <= Math.ceil(x1 / sx) + 1; i++) {
      const h = hash(i * 13.1 + j * 7.7), h2 = hash(i * 5.3 + j * 19.1);
      const cx = (i + (j % 2) * 0.5 + 0.4 * (h2 - 0.5)) * sx + 0.8 * Math.sin(1.2 * t + h * TAU) + 0.5 * noise1(t * 0.8 + i * 0.37, j);
      const cy = y + sy * (0.5 + 0.12 * Math.sin(1.0 * t + h * 17));
      const rx = sx * (0.6 + 0.08 * Math.sin(1.5 * t + i * 1.3 + j) + 0.1 * h2);
      const ry = sy * (0.62 + 0.08 * Math.cos(1.3 * t + i * 0.7 + j * 1.9));
      const ps: P[] = [];
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * TAU + h * 2;
        const rr = 1 + 0.2 * Math.sin(1.2 * t + k * 2.1 + h * 9);
        ps.push(pt(cx + Math.cos(a) * rx * rr, cy + Math.sin(a) * ry * rr));
      }
      loops.push(closed(ps, 1));
    }
  }
  return (
    <>
      <defs>
        <clipPath id={`${id}-rclip`}>
          <path d={ROCK_D} />
        </clipPath>
        <linearGradient id={`${id}-cf`} gradientUnits="userSpaceOnUse" x1="0" y1="-6" x2="0" y2="20">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
          <stop offset="0.4" stopColor="#FFFFFF" stopOpacity={0.55} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        <mask id={`${id}-cm`} maskUnits="userSpaceOnUse" x="-400" y="-20" width="800" height="70">
          <rect x="-400" y="-20" width="800" height="70" fill={`url(#${id}-cf)`} />
        </mask>
      </defs>
      <g clipPath={`url(#${id}-rclip)`}>
        <g mask={`url(#${id}-cm)`}>
          <path d={loops.join('')} fill="none" stroke={K.caustic} strokeWidth="0.55" strokeLinejoin="round" opacity={0.36} />
        </g>
      </g>
    </>
  );
};

/** contact shadow under the base, and the oyster's cast shadow down-right on the rock (light from the upper left) */
const Shadows: React.FC<{id: string}> = ({id}) => (
  <>
    <defs>
      <radialGradient id={`${id}-cs`}>
        <stop offset="0" stopColor={K.shadow} stopOpacity={0.6} />
        <stop offset="0.65" stopColor={K.shadow} stopOpacity={0.42} />
        <stop offset="1" stopColor={K.shadow} stopOpacity={0} />
      </radialGradient>
      <radialGradient id={`${id}-cs2`}>
        <stop offset="0" stopColor={K.shadow} stopOpacity={0.34} />
        <stop offset="0.5" stopColor={K.shadow} stopOpacity={0.22} />
        <stop offset="1" stopColor={K.shadow} stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx="6" cy="0.4" rx="48" ry="3.2" fill={`url(#${id}-cs2)`} />
    <ellipse cx="44" cy="1.4" rx="18" ry="3.0" fill={`url(#${id}-cs2)`} />
    <ellipse cx="0.5" cy="0.2" rx="36" ry="1.7" fill={`url(#${id}-cs)`} />
  </>
);

const Cement: React.FC<{id: string; iw: number}> = ({id, iw}) => {
  const [a, b] = OY.cementFoot;
  return (
    <>
      <defs>
        <linearGradient id={`${id}-cg`} gradientUnits="userSpaceOnUse" x1="0" y1="-5.2" x2="0" y2="0">
          <stop offset="0" stopColor={K.cementLit} />
          <stop offset="0.5" stopColor={K.cement} />
          <stop offset="1" stopColor={mix(K.cement, K.cementShade, 0.75)} />
        </linearGradient>
        <linearGradient id={`${id}-cgx`} gradientUnits="userSpaceOnUse" x1={f(a)} y1="0" x2={f(b)} y2="0">
          <stop offset="0" stopColor={K.rockLit} stopOpacity={0.85} />
          <stop offset="0.06" stopColor={K.rockLit} stopOpacity={0.15} />
          <stop offset="0.12" stopColor="#FFFFFF" stopOpacity={0.12} />
          <stop offset="0.3" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="0.75" stopColor={K.shadow} stopOpacity={0} />
          <stop offset="0.93" stopColor={K.shadow} stopOpacity={0.14} />
          <stop offset="1" stopColor={K.rock} stopOpacity={0.8} />
        </linearGradient>
      </defs>
      <g>
        <path d={OY.cement} fill={`url(#${id}-cg)`} />
        <g>
          <path d={OY.cement} fill={`url(#${id}-cgx)`} />
          <ellipse cx={f(a + 1.75)} cy="-2.75" rx="0.95" ry="0.3" transform={`rotate(-58 ${f(a + 1.75)} -2.75)`} fill="#FFFFFF" opacity={0.9} />
          <path d={`M${f(a + 3.4)} -0.5L${f(b - 3.4)} -0.5`} stroke={K.cementShade} strokeWidth="0.5" opacity={0.25} />
        </g>
        {/* the contact edge: one crisp ink line exactly along y = 0 */}
        <path d={`M${f(a + 1.2)} 0L${f(b - 1.2)} 0`} stroke={INK} strokeWidth={f(iw * OUTLINE_K * 1.1)} strokeLinecap="round" />
      </g>
    </>
  );
};

/** cement that has crept up over the skirt's lowest frills (drawn in front of the shell): one undulating bead whose
 *  edge covers some frill tips and not others, so the shell reads as fused into it rather than perched on it */
const BEAD = (() => {
  const [l, r] = OY.base;
  const xa = l + 1.2, xb = r - 1.2;
  const top = edge(xa, xb, (u, x) => -(3.55 + 0.75 * Math.sin(x * 0.42 + 1.0) + 0.5 * noise1(x * 0.27, 3)) * (0.5 + 0.5 * ss(u, 0, 0.07) * ss(1 - u, 0, 0.07)), 0.15);
  return {d: line([pt(xa, 0), ...top, pt(xb, 0)]) + 'Z', top, edgeD: line(top), hiD: line(shift(top, 0.05, 0.42).slice(4, -4))};
})();
const CementFront: React.FC<{id: string; lw: number}> = ({id, lw}) => (
  <>
    <defs>
      <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1="0" y1="-3.8" x2="0" y2="0">
        <stop offset="0" stopColor={K.cementLit} />
        <stop offset="0.55" stopColor={K.cement} />
        <stop offset="1" stopColor={mix(K.cement, K.cementShade, 0.75)} />
      </linearGradient>
    </defs>
    <path d={BEAD.d} fill={`url(#${id}-g)`} />
    <path d={BEAD.edgeD} fill="none" stroke={K.cementShade} strokeWidth={f(lw * 0.55)} strokeOpacity={0.7} strokeLinecap="round" />
    <path d={BEAD.hiD} fill="none" stroke="#FFFFFF" strokeWidth={f(lw * 0.5)} strokeOpacity={0.7} strokeLinecap="round" />
  </>
);

const Oyster: React.FC<{id: string; iw: number; lw: number}> = ({id, iw, lw}) => {
  const {bands, L0, L1, L2} = OY;
  const dark = (k: number) => k % 2 === 1;
  const LIGHTB = [mix(K.shellLit, K.shell, 0.22), mix(K.shellLit, K.shell, 0.62), mix(K.shell, K.shellDeep, 0.4)];
  const DARKB = [mix(K.shell, K.streak, 0.1), mix(K.shell, K.streak, 0.36), mix(K.shellDeep, K.streak, 0.25)];
  const lidC = [K.shellLit, mix(K.shellLit, K.shell, 0.45), mix(K.shellLit, K.shell, 0.85)];
  const lidC1 = [mix(K.shellLit, K.shell, 0.25), mix(K.shell, K.streak, 0.18), mix(K.shell, K.streak, 0.35)];
  return (
    <>
      <defs>
        {bands.map((b) => {
          const c = dark(b.k) ? DARKB : LIGHTB;
          return (
            <linearGradient key={b.k} id={`${id}-og${b.k}`} gradientUnits="userSpaceOnUse" x1="-30" y1="-28" x2="30" y2="0">
              <stop offset="0" stopColor={c[0]} />
              <stop offset="0.45" stopColor={c[1]} />
              <stop offset="1" stopColor={c[2]} />
            </linearGradient>
          );
        })}
        {[lidC, lidC1, lidC].map((c, i) => (
          <linearGradient key={i} id={`${id}-lg${i}`} gradientUnits="userSpaceOnUse" x1="-20" y1="-39" x2="24" y2="-24">
            <stop offset="0" stopColor={c[0]} />
            <stop offset="0.45" stopColor={c[1]} />
            <stop offset="1" stopColor={c[2]} />
          </linearGradient>
        ))}
        <linearGradient id={`${id}-tip`} gradientUnits="userSpaceOnUse" x1="0" y1="-7.0" x2="0" y2="-2.4">
          <stop offset="0" stopColor={K.cement} stopOpacity={0} />
          <stop offset="1" stopColor={K.cement} stopOpacity={0.5} />
        </linearGradient>
        {bands.map((b) => (
          <clipPath key={b.k} id={`${id}-bc${b.k}`}>
            <path d={b.d} />
          </clipPath>
        ))}
        {[L0, L1, L2].map((p, i) => (
          <clipPath key={i} id={`${id}-lc${i}`}>
            <path d={p.d} />
          </clipPath>
        ))}
      </defs>
      <Inked w={iw}>
        {/* the cupped lower valve, newest lamella first */}
        {bands.map((b) => (
          <g key={b.k}>
            {b.k > 0 && (
              <Deco>
                {/* the crevice above this lamella's free edge (on the lamella above) */}
                <g clipPath={`url(#${id}-bc${b.k - 1})`}>
                  <path d={line(shift(b.topPts, 0, -0.7))} fill="none" stroke={K.shellDeep} strokeWidth="2.8" strokeOpacity={0.22} strokeLinejoin="round" />
                  <path d={line(shift(b.topPts, 0, -0.3))} fill="none" stroke={K.shellDeep} strokeWidth="1.2" strokeOpacity={0.32} strokeLinejoin="round" />
                </g>
              </Deco>
            )}
            <InkPath d={b.d} fill={`url(#${id}-og${b.k})`} />
            <Deco>
              <g clipPath={`url(#${id}-bc${b.k})`}>
                {RAYS_LOW.map((r, i) => (
                  <path key={i} d={r} fill={dark(b.k) ? K.shellDeep : K.streak} opacity={dark(b.k) ? 0.3 : 0.34} />
                ))}
                {b.k > 0 && <path d={b.top} fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeOpacity={0.13} />}
                {b.k === 3 && <path d={b.d} fill={`url(#${id}-tip)`} />}
                {b.k > 0 && <path d={line(shift(b.topPts, 0.1, 0.45))} fill="none" stroke={K.shellLit} strokeWidth={f(lw * 0.75)} strokeOpacity={0.8} strokeLinejoin="round" />}
                {b.k === 0 && (
                  <>
                    {/* the lid's teeth shade the cup just below the commissure */}
                    <path d={line(shift(OY.comm, 0, 1.2))} fill="none" stroke={K.shellDeep} strokeWidth="3.4" strokeOpacity={0.45} strokeLinejoin="round" />
                    <path d={line(shift(OY.comm, 0, 0.5))} fill="none" stroke={K.shellDeep} strokeWidth="1.4" strokeOpacity={0.4} strokeLinejoin="round" />
                  </>
                )}
              </g>
            </Deco>
            {b.k > 0 && <InkLine d={b.top} w={lw} opacity={0.85} />}
            {OY.partials
              .filter((q) => q.k === b.k)
              .map((q, i) => (
                <g key={`p${i}`}>
                  <Deco>
                    <g clipPath={`url(#${id}-bc${b.k})`}>
                      <path d={line(shift(q.pts, 0, -0.4))} fill="none" stroke={K.shellDeep} strokeWidth="1.5" strokeOpacity={0.22} strokeLinecap="round" />
                      <path d={line(shift(q.pts, 0.1, 0.4))} fill="none" stroke={K.shellLit} strokeWidth={f(lw * 0.6)} strokeOpacity={0.6} strokeLinecap="round" />
                    </g>
                  </Deco>
                  <InkLine d={line(q.pts)} w={lw * 0.75} opacity={0.65} />
                </g>
              ))}
          </g>
        ))}
        {/* the flat lid: plates, oldest (smallest) on top */}
        {[L0, L1, L2].map((p, i) => (
          <g key={`l${i}`}>
            {i > 0 && (
              <Deco>
                <g clipPath={`url(#${id}-lc${i - 1})`}>
                  <path d={line(shift(p.lip, 0, 0.6))} fill="none" stroke={K.shellDeep} strokeWidth="1.5" strokeOpacity={0.3} strokeLinejoin="round" />
                </g>
              </Deco>
            )}
            <InkPath d={p.d} fill={`url(#${id}-lg${i})`} />
            <Deco>
              <g clipPath={`url(#${id}-lc${i})`}>
                {RAYS_LID.map((r, j) => (
                  <path key={j} d={r} fill={K.streak} opacity={0.28} />
                ))}
                <path d={line(shift(p.lip, 0, -0.5))} fill="none" stroke="#FFFFFF" strokeWidth={f(lw * 0.6)} strokeOpacity={0.5} strokeLinejoin="round" />
              </g>
            </Deco>
            <InkLine d={p.lipD} w={i === 0 ? lw * 1.75 : lw * 0.9} opacity={i === 0 ? 1 : 0.8} />
          </g>
        ))}
        {/* small wet glosses */}
        <Deco>
          <ellipse cx="-9" cy="-34.4" rx="3.2" ry="0.6" transform="rotate(-21 -9 -34.4)" fill="#FFFFFF" opacity={0.85} />
          <ellipse cx="-1.8" cy="-37.0" rx="1.0" ry="0.42" transform="rotate(-16 -1.8 -37)" fill="#FFFFFF" opacity={0.8} />
          <ellipse cx="-26.5" cy="-12.6" rx="1.4" ry="0.34" transform="rotate(-30 -26.5 -12.6)" fill="#FFFFFF" opacity={0.6} />
          <ellipse cx="-24" cy="-8.4" rx="1.0" ry="0.3" transform="rotate(-24 -24 -8.4)" fill="#FFFFFF" opacity={0.55} />
        </Deco>
      </Inked>
    </>
  );
};

// ------------------------------------------------------------------ far layers
const Backdrop: React.FC<{id: string}> = ({id}) => (
  <>
    <defs>
      <linearGradient id={`${id}-bg`} gradientUnits="userSpaceOnUse" x1="0" y1="-560" x2="0" y2="420">
        <stop offset="0" stopColor={mix(C.seaLit, '#EFFFF9', 0.35)} />
        <stop offset="0.22" stopColor={mix(C.seaLit, C.sea, 0.35)} />
        <stop offset="0.5" stopColor={C.sea} />
        <stop offset="0.72" stopColor={mix(C.sea, C.seaDeep, 0.55)} />
        <stop offset="1" stopColor={C.seaDeep} />
      </linearGradient>
      <radialGradient id={`${id}-sun`} gradientUnits="userSpaceOnUse" cx="-140" cy="-620" r="420">
        <stop offset="0" stopColor="#F4FFF8" stopOpacity={0.55} />
        <stop offset="0.5" stopColor="#E0FFF6" stopOpacity={0.16} />
        <stop offset="1" stopColor="#E0FFF6" stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect x="-3000" y="-3000" width="6000" height="6000" fill={`url(#${id}-bg)`} />
    <rect x="-3000" y="-3000" width="6000" height="6000" fill={`url(#${id}-sun)`} />
  </>
);

const Shafts: React.FC<{id: string; t: number}> = ({id, t}) => {
  const S = [
    {x: -190, w0: 22, w1: 46, a: 0.8},
    {x: -105, w0: 14, w1: 34, a: 1.0},
    {x: -25, w0: 26, w1: 58, a: 0.75},
    {x: 60, w0: 12, w1: 30, a: 0.9},
    {x: 130, w0: 20, w1: 44, a: 0.7},
  ];
  const yT = -460, yB = 140, slope = 0.32;
  return (
    <>
      <defs>
        <linearGradient id={`${id}-sf`} gradientUnits="userSpaceOnUse" x1="0" y1={yT} x2="0" y2={yB}>
          <stop offset="0" stopColor={K.shaft} stopOpacity={0.34} />
          <stop offset="0.45" stopColor={K.shaft} stopOpacity={0.16} />
          <stop offset="1" stopColor={K.shaft} stopOpacity={0} />
        </linearGradient>
      </defs>
      {S.map((s, i) => {
        const sway = 7 * Math.sin(0.33 * t + i * 1.7);
        const xt = s.x + sway, xb = s.x + sway * 0.4 + slope * (yB - yT);
        const op = s.a * (0.7 + 0.3 * noise1(t * 0.7 + i * 3.1, 9));
        return <path key={i} d={`M${f(xt - s.w0 / 2)} ${yT}L${f(xt + s.w0 / 2)} ${yT}L${f(xb + s.w1 / 2)} ${yB}L${f(xb - s.w1 / 2)} ${yB}Z`} fill={`url(#${id}-sf)`} opacity={f(op)} />;
      })}
    </>
  );
};

const Reef: React.FC<{id: string; t: number}> = ({id, t}) => {
  const ridge = spline([pt(-460, 60), pt(-320, 22), pt(-240, 2), pt(-190, -8), pt(-150, 2), pt(-112, -12), pt(-70, -2), pt(-20, -6), pt(30, 4), pt(78, -10), pt(118, -26), pt(160, -30), pt(196, -12), pt(250, -2), pt(330, 16), pt(460, 50)], 2);
  const d = line([...ridge, pt(480, 800), pt(-480, 800)]) + 'Z';
  return (
    <>
      <defs>
        <linearGradient id={`${id}-rf`} gradientUnits="userSpaceOnUse" x1="0" y1="-30" x2="0" y2="160">
          <stop offset="0" stopColor={mix(C.sea, C.seaDeep, 0.35)} />
          <stop offset="1" stopColor={mix(C.seaDeep, '#08202E', 0.3)} />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${id}-rf)`} />
    </>
  );
};

/** a dark, out-of-focus rock in the near foreground (lower left): depth and parallax on the wide framing */
const NearRock: React.FC<{id: string}> = ({id}) => {
  const d = closed([pt(-120, 76), pt(-96, 64), pt(-74, 61), pt(-56, 68), pt(-44, 82), pt(-40, 104), pt(-60, 140), pt(-120, 150)], 1);
  const pebble = closed([pt(-38, 98), pt(-30, 92), pt(-22, 94), pt(-19, 102), pt(-26, 110), pt(-38, 108)], 1);
  return (
    <>
      <defs>
        <radialGradient id={`${id}-nr`} gradientUnits="userSpaceOnUse" cx="-70" cy="94" r="46" fx="-82" fy="72">
          <stop offset="0" stopColor={mix(K.rockDeep, C.sea, 0.25)} />
          <stop offset="0.7" stopColor={mix(K.rockDeep, C.seaDeep, 0.55)} />
          <stop offset="1" stopColor={mix(C.seaDeep, '#06141C', 0.4)} />
        </radialGradient>
      </defs>
      <path d={d} fill={`url(#${id}-nr)`} />
      <path d={pebble} fill={mix(K.rockDeep, C.seaDeep, 0.45)} />
      <path d={open([pt(-104, 68), pt(-84, 62.6), pt(-66, 63.6)], 1)} fill="none" stroke={mix(K.rockLit, C.seaLit, 0.4)} strokeWidth="2.2" strokeLinecap="round" opacity={0.45} />
    </>
  );
};

// ------------------------------------------------------------------ the world
/**
 * The underwater oyster world, full frame (1080×1920). Draws its own background and every depth layer.
 * `t` is the film time in seconds (designed for 8.0..10.4, continuous outside it); `cam` frames the world in mm.
 */
export const OysterWorld: React.FC<{id: string; t: number; cam: Cam}> = ({id, t, cam}) => {
  const iw = inkW(cam);
  const lw = lineW(cam, 2.6);
  const d0 = 2.2 * cam.w;
  const motes = (zs: (m: Motes) => boolean) =>
    MOTES.filter(zs).map((m) =>
      d0 + m.z < 0.3 * d0 ? null : (
        <Layer key={m.z} c={cam} z={m.z} blurK={m.blurK} maxBlur={m.maxBlur} opacity={m.z < 0 ? clamp((d0 + m.z) / (0.55 * d0)) : undefined}>
          <MoteField t={t} cam={cam} m={m} />
        </Layer>
      ),
    );
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: C.sea}}>
      <Layer c={cam} z={900} maxBlur={0}>
        <Backdrop id={`${id}-bd`} />
      </Layer>
      <Layer c={cam} z={340} blurK={40} maxBlur={22}>
        <Shafts id={`${id}-sh`} t={t} />
      </Layer>
      {motes((m) => m.z >= 250)}
      <Layer c={cam} z={200} blurK={22} maxBlur={10}>
        <Reef id={`${id}-rf`} t={t} />
      </Layer>
      {motes((m) => m.z >= 100 && m.z < 250)}
      <Layer c={cam} z={45} blurK={8} maxBlur={4}>
        <MoteField t={t} cam={cam} m={MOTES[2]} />
        <Bubbles t={t} cam={cam} z={45} seed={3} every={1.05} xs={[-95, 90]} y0={14} rr={[0.55, 1.2]} />
      </Layer>
      <Layer c={cam} z={0}>
        <BackScene id={`${id}-b`} t={t} iw={iw} lw={lw} />
      </Layer>
      <Layer c={cam} z={0} blurK={0} minBlur={0.3 * pxPerMm(cam)}>
        <Caustics id={`${id}-k`} t={t} cam={cam} lw={lw} />
      </Layer>
      <Layer c={cam} z={0}>
        <FrontScene id={`${id}-m`} t={t} iw={iw} lw={lw} />
      </Layer>
      {motes((m) => m.z <= 0 && m.z > -30)}
      {d0 - 30 > 0.3 * d0 && (
        <Layer c={cam} z={-30} blurK={90} maxBlur={12}>
          <NearRock id={`${id}-nr`} />
        </Layer>
      )}
      {motes((m) => m.z <= -30)}
      {d0 - 14 > 0.3 * d0 && (
        <Layer c={cam} z={-14} blurK={30} maxBlur={10}>
          <Bubbles t={t} cam={cam} z={-14} seed={17} every={2.3} xs={[30, 70]} y0={60} rr={[1.1, 1.7]} />
        </Layer>
      )}
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <radialGradient id={`${id}-vig`} gradientUnits="userSpaceOnUse" cx={W / 2} cy={H * 0.46} r={H * 0.68}>
            <stop offset="0.5" stopColor={C.seaDeep} stopOpacity={0} />
            <stop offset="1" stopColor={C.seaDeep} stopOpacity={0.42} />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${id}-vig)`} />
      </svg>
    </div>
  );
};

const BackScene: React.FC<{id: string; t: number; iw: number; lw: number}> = ({id, t, iw, lw}) => (
  <>
    <Seaweed id={`${id}-w0`} t={t} base={pt(-66, surfY(-66) - 0.6)} len={46} wid={2.3} lean={-0.12} seed={2.1} iw={iw * 0.8} lw={lw} />
    <RockBody id={`${id}-r`} iw={iw} lw={lw} />
  </>
);
const FrontScene: React.FC<{id: string; t: number; iw: number; lw: number}> = ({id, t, iw, lw}) => (
  <>
    <Tuft t={t} c={pt(-80, surfY(-80) - 0.5)} n={6} size={4.2} seed={1} />
    <Tuft t={t} c={pt(-45, surfY(-45) - 0.4)} n={5} size={3.4} seed={2} />
    <Tuft t={t} c={pt(74, surfY(74) - 0.5)} n={6} size={4.0} seed={3} />
    <Seaweed id={`${id}-w1`} t={t} base={pt(-52, surfY(-52) - 0.2)} len={74} wid={3.0} lean={-0.2} seed={0.4} iw={iw * 0.85} lw={lw} />
    <Shadows id={`${id}-s`} />
    <Cement id={`${id}-c`} iw={iw} />
    <Oyster id={`${id}-o`} iw={iw} lw={lw} />
    <CementFront id={`${id}-cf`} lw={lw} />
    <Seaweed id={`${id}-w2`} t={t} base={pt(56, surfY(56) + 0.2)} len={60} wid={2.8} lean={0.05} seed={4.2} iw={iw * 0.85} lw={lw} />
  </>
);

/** the match point and the extent of the attachment boundary, for the film's match cut */
export const OYSTER_MATCH = {point: pt(0, 0), base: OY.base, cement: OY.cementFoot};
