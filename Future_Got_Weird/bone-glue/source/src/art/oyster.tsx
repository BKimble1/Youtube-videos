// V2: the oyster comparison (film t ≈ 7.98–10.33 s). A Pacific-type oyster cemented to the crown of a boulder under
// water, seen from the side and a little above. World units are millimetres, x right, y down.
//
// API
//   OysterWorld({id, t, cam, reveal})  the whole underwater world, full frame (1080×1920), every depth layer.
//                                      t = film time (s); cam = Cam in world mm; reveal 0..1 opens the cutaway window
//                                      onto the attachment section (0 = closed, 1 = fully open at OY_WIN.r).
//   OY_CAM_IN, OY_CAM_OUT              the cut-in medium shot and the cut-out macro. Both put the match point M = (0, 0)
//                                      on screen (540, OY_MATCH_Y ≈ 1000), so zoomAbout(u, OY_CAM_IN, OY_CAM_OUT, ease)
//                                      is a pure push toward the attachment for any ease.
//   OY_WIN {c, r}                      the window (world mm): centred on the band at M, r = 640 px at OY_CAM_OUT.
//   OY_BAND {top, bottom, attached}    the cement band's edges y(x) in world mm (for QA).
//
// THE MATCH. The cement band's two edges are production/v2_match_band.json's glueTop / glueBottom (the bone glue band's
// screen outline at the wrist's match framing), mapped into this world through OY_CAM_OUT. So at OY_CAM_OUT the
// cement's upper and lower edges lie on the bone band's (the json is read at build time: regenerate it and the oyster
// follows). Beyond the json's span the band continues along the whole attached base with the same trend and wiggle.
// Inside the window: shell layers above (the outer prismatic layer against the cement, foliated calcite sheets, chalky
// lenses), the thin even cement band (outlined as the bone glue is, keyed into the gaps between surface grains), and
// the rock's grain below.
//
// Science: the oyster cements its LEFT valve (the deeper one) to hard substrate and the valve takes the rock's shape;
// the RIGHT valve is the flatter lid on top. Hinge (beak) to screen left, the broad frilly growth margin to the right,
// lifting off the rock. The cement is a thin calcium-carbonate layer between two hard surfaces.
//
// The oyster, its cement and the rock never move. Everything that belongs to the water moves: particles stream left to
// right in several depth layers (near the subject at every zoom: scale-adaptive particle octaves), weed bends with the
// current, bubbles rise, light shafts and caustics shimmer, and one current SURGE (t 8.45–9.45, peak ≈ 8.95) whips the
// weed, streaks and swirls the particles and carries a puff of silt past. All motion is a deterministic, continuous
// function of t. Contours keep a constant on-screen weight; every SVG filter region is clipped to the view.
import React from 'react';
import {Cam, Layer, viewRect, layerScale, W, H} from '../camera';
import {C} from './palette';
import {P, pt, add, mul, nrm, perp, sub, line, closed, open, tube, n4} from '../core/geo';
import {mix, rgba} from '../core/color';
import {clamp, ss, ss5, lerp, noise1, hash} from '../lib';
import {Inked, Deco, InkPath, InkLine, INK, OUTLINE_K, FEATURE_K} from '../dc/ink';
import BAND from '../../../production/v2_match_band.json';

const f = n4;
const TAU = Math.PI * 2;

// ------------------------------------------------------------------ colours (underwater grading of the episode palette)
const tint = (c: string, k: number) => mix(c, C.sea, k);
const K = {
  rock: mix(tint(C.rock, 0.16), '#6E6A62', 0.4),
  rockLit: mix(tint(C.rockLit, 0.1), '#A39E90', 0.3),
  rockDeep: mix(tint(C.rockDeep, 0.3), '#3F4446', 0.3),
  // the crown carries a thin olive film of algae (a mid value, so the pale cement line reads against it)
  film: '#A2A386',
  filmLit: '#BEBD9E',
  filmDeep: '#6E7358',
  shLit: tint(mix(C.shellLit, '#F4EBDC', 0.75), 0.02),
  shPale: tint(mix(C.shellLit, '#C9B9A2', 0.72), 0.03),
  sh: tint(mix(C.shell, '#9C8468', 0.8), 0.04),
  shDeep: tint(mix(C.shellDeep, '#45362B', 0.75), 0.05),
  shBrown: tint('#7A624E', 0.04),
  shPurple: mix(C.shell, C.shellDeep, 0.3),
  cement: C.cement,
  cementLit: '#FDFBF6',
  cementCool: mix(C.cement, C.seaLit, 0.34),
  cementShade: mix(C.cement, '#8E8B80', 0.5),
  weed: '#4A8757',
  weedLit: '#8CC07E',
  weedDeep: '#255541',
  weedHold: '#3D5B3A',
  mote: '#DDF6F0',
  silt: '#CFC6AE',
  caustic: '#E4FFF8',
  shaft: '#D8FFF4',
  shadow: '#16303A',
  // encrusting life (graded under water)
  barnacle: tint('#E4DED2', 0.1),
  barnacleShade: tint('#A99F95', 0.15),
  coralline: mix(tint('#A88598', 0.2), '#7E7A70', 0.25),
  corallineLit: mix(tint('#D6BCC8', 0.15), '#9A968A', 0.25),
  sponge: tint('#D0814A', 0.2),
  spongeLit: tint('#EDB27A', 0.12),
  tube: tint('#EFE9DD', 0.08),
  // the section (a cut face: flatter colours)
  prism: '#82677A',
  prismLine: '#6A5361',
  layer: ['#C9B6C1', '#E4D9CF', '#CFC1CF', '#ECE3DA', '#BEAAB8'],
  chalk: '#F1EBE1',
  chalkPore: '#D6CBBD',
  grainGap: '#6F6A61',
  grain: ['#968F83', '#A0988A', '#8E887C', '#A9A192', '#8A8377', '#9B9385', '#A49C8F'],
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
/** y on a polyline whose x increases, at x (clamped at the ends) */
const yOn = (ps: P[], x: number): number => {
  const n = ps.length;
  if (x <= ps[0].x) return ps[0].y;
  if (x >= ps[n - 1].x) return ps[n - 1].y;
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (ps[m].x <= x) lo = m;
    else hi = m;
  }
  const a = ps[lo], b = ps[hi];
  return a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x || 1);
};
const arcs = (ps: P[]) => {
  const s = [0];
  for (let i = 1; i < ps.length; i++) s.push(s[i - 1] + Math.hypot(ps[i].x - ps[i - 1].x, ps[i].y - ps[i - 1].y));
  return s;
};
const tangents = (ps: P[]) => ps.map((_, i) => nrm(sub(ps[Math.min(ps.length - 1, i + 1)], ps[Math.max(0, i - 1)])));
/** a frilly edge: the base polyline pushed along its normal (side +1 = perp of the direction of travel) in lobes.
 *  'scallop' = rounded lobes with sharp valleys, 'tooth' = the oyster's zigzag (plicate) margin. */
const frillN = (
  base: P[], side: number, amp: [number, number], wl: [number, number], seed: number,
  o: {taper?: number; sharp?: number; mode?: 'scallop' | 'tooth'; ampP?: (p: P, u: number) => number} = {},
): P[] => {
  const {taper = 1.6, sharp = 0.55, mode = 'scallop', ampP = () => 1} = o;
  const s = arcs(base);
  const L = s[s.length - 1];
  const b = [0];
  for (let j = 0; b[b.length - 1] < L; j++) b.push(b[b.length - 1] + lerp(wl[0], wl[1], hash(seed * 7.13 + j * 3.71)));
  const k = L / b[b.length - 1];
  for (let i = 0; i < b.length; i++) b[i] *= k;
  const T = tangents(base);
  let j = 0;
  const r = 0.035, top = Math.sqrt(1 + r) - Math.sqrt(r);
  return base.map((p, i) => {
    while (j < b.length - 2 && s[i] > b[j + 1]) j++;
    const u = clamp((s[i] - b[j]) / (b[j + 1] - b[j]));
    const uu = Math.pow(u, 0.75 + 0.5 * hash(seed * 1.37 + j * 5.11));
    const a = lerp(amp[0], amp[1], hash(seed * 2.9 + j * 1.618)) * ampP(p, s[i] / L);
    const tp = ss(s[i], 0, taper) * ss(L - s[i], 0, taper);
    const sh = mode === 'tooth' ? (Math.sqrt(1 + r) - Math.sqrt((2 * uu - 1) ** 2 + r)) / top : Math.pow(Math.sin(Math.PI * uu), sharp);
    return add(p, mul(perp(T[i]), side * a * sh * tp));
  });
};
/** sample y(x) along x from xa to xb */
const edge = (xa: number, xb: number, y: (x: number) => number, step = 0.22): P[] => {
  const n = Math.max(2, Math.ceil(Math.abs(xb - xa) / step));
  const out: P[] = [];
  for (let i = 0; i <= n; i++) {
    const x = lerp(xa, xb, i / n);
    out.push(pt(x, y(x)));
  }
  return out;
};
const shift = (ps: P[], dx: number, dy: number) => ps.map((p) => pt(p.x + dx, p.y + dy));
const scaleAbout = (ps: P[], c: P, s: number) => ps.map((p) => pt(c.x + (p.x - c.x) * s, c.y + (p.y - c.y) * s));
/** push each point along its normal by d (side as in frillN) */
const offset = (ps: P[], d: number) => {
  const T = tangents(ps);
  return ps.map((p, i) => add(p, mul(perp(T[i]), d)));
};
const nearest = (ps: P[], q: P) => {
  let bi = 0, bd = Infinity;
  ps.forEach((p, i) => {
    const d = Math.hypot(p.x - q.x, p.y - q.y);
    if (d < bd) (bd = d), (bi = i);
  });
  return bi;
};
/** a wobbly closed loop (organic blob) */
const blob = (c: P, rx: number, ry: number, seed: number, n = 14, wob = 0.18, rotA = 0): P[] => {
  const out: P[] = [];
  const ca = Math.cos(rotA), sa = Math.sin(rotA);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const k = 1 + wob * (0.6 * Math.sin(2 * a + seed * 1.3) + 0.4 * (hash(seed * 7.7 + i * 3.1) * 2 - 1));
    const x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k;
    out.push(pt(c.x + x * ca - y * sa, c.y + x * sa + y * ca));
  }
  return out;
};

// ------------------------------------------------------------------ the match band and the two framings
export const OY_W_OUT = 8.5;
export const OY_W_IN = 104;
/** mm per screen pixel at OY_CAM_OUT */
const SP = OY_W_OUT / W;
type BandRow = {glueTop: number[]; glueBottom: number[]; centre: number[]};
const ROWS: BandRow[] = (BAND as unknown as {rows: BandRow[]}).rows;
/** the screen y of the bone band's centreline at screen x = 540: the match point M sits there in both framings */
export const OY_MATCH_Y = yOn(ROWS.map((r) => pt(r.centre[0], r.centre[1])), W / 2);
/** the macro at the base (the frame the film cuts back to the bone from) */
export const OY_CAM_OUT: Cam = {x: 0, y: -(OY_MATCH_Y - H / 2) * SP, w: OY_W_OUT};
/** the medium shot of the oyster on its boulder (the frame the film cuts in on) */
export const OY_CAM_IN: Cam = {x: 0, y: -(OY_MATCH_Y - H / 2) * (OY_W_IN / W), w: OY_W_IN};
const outToWorld = (q: number[]) => pt((q[0] - W / 2) * SP, (q[1] - OY_MATCH_Y) * SP);
const JT = ROWS.map((r) => outToWorld(r.glueTop));
const JB = ROWS.map((r) => outToWorld(r.glueBottom));
const JX0 = Math.max(JT[0].x, JB[0].x), JX1 = Math.min(JT[JT.length - 1].x, JB[JB.length - 1].x);
/** the json band's straight-line trend and mean thickness (for the continuation beyond it) */
const FIT = (() => {
  const xs: number[] = [];
  for (let x = JX0; x <= JX1; x += 0.05) xs.push(x);
  const ms = xs.map((x) => (yOn(JT, x) + yOn(JB, x)) / 2);
  const hs = xs.map((x) => yOn(JB, x) - yOn(JT, x));
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ms.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0;
  xs.forEach((x, i) => {
    sxy += (x - mx) * (ms[i] - my);
    sxx += (x - mx) ** 2;
  });
  const b = sxy / sxx;
  return {a: my - b * mx, b, h: hs.reduce((a, c) => a + c, 0) / n};
})();
/** the boulder's dome under the oyster: the band droops gently toward the ends of the base */
const DOME = 0.0011;
const trendMid = (x: number) => FIT.a + FIT.b * x + DOME * x * x;
const jagB = (x: number) => {
  const st = 0.48, k = Math.floor(x / st), u = x / st - k;
  const r = (j: number) => hash(j * 12.9898 + 4.1) * 2 - 1;
  return (r(k) * (1 - u) + r(k + 1) * u) * 0.07;
};
const wig = (x: number) => 0.17 * Math.sin(1.85 * x + 0.4) + 0.08 * Math.sin(4.3 * x + 1.9) + jagB(x);
const thick = (x: number) => FIT.h * (1 + 0.07 * Math.sin(0.83 * x + 2.1) + 0.04 * Math.sin(2.9 * x));
const jw = (x: number) => ss(x, JX0, JX0 + 0.45) * ss(JX1 - x, 0, 0.45);
/** the cement band's upper edge (against the shell) at x: exactly the json's glueTop inside its span */
export const bandTop = (x: number) => lerp(trendMid(x) + wig(x) - thick(x) / 2, yOn(JT, x), jw(x));
/** the cement band's lower edge (against the rock) at x: exactly the json's glueBottom inside its span */
export const bandBot = (x: number) => lerp(trendMid(x) + wig(x) + thick(x) / 2, yOn(JB, x), jw(x));
/** sample a band edge from x0 to x1 (fine near the match point, where the macro looks) */
const bandLine = (fy: (x: number) => number, x0: number, x1: number): P[] => {
  const out: P[] = [];
  const dir = x1 >= x0 ? 1 : -1;
  let x = x0;
  while ((x1 - x) * dir > 1e-9) {
    out.push(pt(x, fy(x)));
    x += dir * (Math.abs(x) < 6.5 ? 0.03 : 0.2);
  }
  out.push(pt(x1, fy(x1)));
  return out;
};
/** the cutaway window: centred on the band at M; its full world radius (640 px on screen at OY_CAM_OUT) */
export const OY_WIN = {c: pt(0, (bandTop(0) + bandBot(0)) / 2), r: 640 * SP};

// ------------------------------------------------------------------ the oyster and its cement (static geometry, built once)
/** the attached span of the lower valve: from XA (umbo end) to XB (where the broad margin lifts off the rock) */
const XA = -24, XB = 29;
const buildOyster = () => {
  // design coordinates -> world (the V1 shell: drawn ~79 mm long, fitted to ~75 mm, hinge at x ≈ -36)
  const X = (ps: P[]) => ps.map((p) => pt(0.95 * p.x - 1, p.y));
  // --- the lid (right valve): a thin plate seen a little from above, its broad end (the bill) raised
  const HL = X([pt(-32.4, -20.7)])[0];
  const LID_BACK0 = spline(X([pt(-32.4, -20.7), pt(-28.4, -22.0), pt(-25, -22.3), pt(-20, -23.6), pt(-11, -25.6), pt(-1, -27.4), pt(9, -29.0), pt(18, -30.3), pt(26, -31.0), pt(32, -30.6), pt(36.4, -29.0), pt(39.2, -26.6), pt(40.2, -24.0)]), 0.2);
  const LID_BACK = frillN(LID_BACK0, -1, [0.35, 1.0], [2.6, 4.6], 17, {mode: 'tooth', taper: 3, ampP: (p) => 0.3 + 0.7 * ss(p.x, -20, 25)});
  const LIP = spline(X([pt(40.2, -24.0), pt(38.6, -22.6), pt(34, -22.0), pt(27, -21.8), pt(19, -21.5), pt(10, -21.1), pt(1, -20.6), pt(-8, -20.2), pt(-17, -19.8), pt(-24, -19.5), pt(-29, -19.6), pt(-32.4, -20.7)]), 0.2).map((p) =>
    pt(p.x, p.y + 0.8 * Math.sin((p.x + 4) * 0.4) * ss(p.x, -27, -16) * ss(37 - p.x, 0, 4)),
  );
  const lip = frillN(LIP, -1, [1.1, 2.3], [3.2, 5.2], 13, {mode: 'tooth', taper: 2.6, ampP: (p) => 0.35 + 0.65 * ss(p.x, -26, 14)});
  const lidD = line([...LID_BACK, ...lip.slice(1)]) + 'Z';
  const lipRim = offset(LIP, 1.6);
  const edgeFace = line([...lip, ...[...lipRim].reverse()]) + 'Z';
  const UL = pt(HL.x + 1.2, HL.y - 0.5);
  const lidRings = [0.86, 0.72, 0.57, 0.42, 0.27].map((s, k) => {
    const sc = scaleAbout([...LID_BACK0, ...LIP.slice(1)], UL, s);
    const a = 1 - 0.13 * k;
    const fr = frillN(sc, -1, [0.3 * a, 0.9 * a], [2.0, 3.6], 41 + k * 3, {mode: 'tooth', taper: 1.2, ampP: (_, u) => 0.45 + 0.55 * (0.5 + 0.5 * noise1(u * 9 + k * 3, 11))});
    const cut = 0.3 + 0.25 * hash(k * 4.1 + 0.3);
    const vis = fr.filter((_, i) => i / (fr.length - 1) < cut || k % 2 === 0);
    return {pts: fr, d: line(vis), fill: line(fr) + 'Z'};
  });
  const lidTop = line([...LID_BACK, ...lipRim.slice(1)]) + 'Z';

  // --- the attached lower valve (left valve): rim hidden under the lid, the broad end rounding down and lifting off
  // the rock, a base moulded to the rock along the cement band (XA..XB), the umbo end rising to the upturned beak
  const RIM = X([pt(-30, -20.0), pt(-22, -20.4), pt(-12, -21.0), pt(-2, -21.6), pt(8, -22.1), pt(18, -22.5), pt(28, -22.9), pt(35, -23.6), pt(38.2, -24.0), pt(40.6, -22.4), pt(42, -19.4), pt(42.2, -15.4), pt(41.4, -11.6)]);
  const LIFT = [pt(37.3, -8.0), pt(35.7, -5.0), pt(33.6, -2.5), pt(31.2, bandTop(31.2) - 0.6), pt(XB, bandTop(XB) + 0.3)];
  const TOPSIDE = spline([...RIM, ...LIFT], 0.2);
  // the base runs a little inside the cement (the cement band is drawn over it and gives the boundary its line)
  const BASE = edge(XB - 0.25, XA + 0.25, (x) => bandTop(x) + 0.3, 0.25);
  const UMBO = [pt(XA, bandTop(XA) + 0.3), pt(-26.0, -0.4), pt(-28.2, -3.2), pt(-30.4, -6.8), pt(-32.5, -10.6), pt(-34.3, -14.4), pt(-35.6, -17.6), pt(-36.15, -19.8)];
  const UMBO_S = spline(UMBO, 0.2);
  const LV_MAIN = [...TOPSIDE, ...BASE, ...UMBO_S];
  const BEAK_TOP = spline(X([pt(-37, -19.8), pt(-35.6, -21.0), pt(-33, -21.3), pt(-30.8, -20.5), pt(-30, -20.0)]), 0.2);
  const lvMain = frillN(LV_MAIN, -1, [0.4, 1.1], [2.2, 3.8], 23, {mode: 'tooth', taper: 0.5, ampP: (p) => ss(p.x, 34, 36.5) * (1 - ss(p.y, -9.5, -7))});
  const lvD = line([...lvMain, ...BEAK_TOP.slice(1)]) + 'Z';
  // concentric growth lamellae around the umbo: older, smaller valve outlines, their free flaky edges facing outward
  const UV = X([pt(-33.6, -19.2)])[0];
  const iR = nearest(LV_MAIN, X([pt(38.2, -24.0)])[0]);
  const lvRings = [0.88, 0.75, 0.61, 0.46, 0.31].map((s, k) => {
    const sc = scaleAbout(LV_MAIN.slice(iR), UV, s);
    const a = 1 - 0.12 * k;
    const fr = frillN(sc, -1, [0.35 * a, 1.1 * a], [2.0, 3.6], 31 + k * 5, {mode: 'tooth', taper: 1.5, ampP: (_, u) => 0.4 + 0.6 * (0.5 + 0.5 * noise1(u * 10 + k * 2.3, 12))});
    const z = fr[fr.length - 1];
    const fill = line([...fr, pt(z.x - 6, -32), pt(fr[0].x, -32)]) + 'Z';
    const c0 = 0.1 * hash(k * 2.9 + 1.1), c1 = 1 - 0.22 * hash(k * 6.1 + 0.7);
    const vis = fr.filter((_, i) => {
      const u = i / (fr.length - 1);
      return u >= c0 && u <= c1;
    });
    return {pts: vis, d: line(vis), fill};
  });
  const lig = BEAK_TOP.slice(2, -3);
  const ligD = line([...lig, ...shift([...lig].reverse(), 0.3, 0.8)]) + 'Z';

  // --- the cement band seen from outside: a thin even layer under the whole attached base. At the umbo end it climbs
  // the flank a little as a concave meniscus; at the broad end it runs a short way under the lifting margin.
  const qL = UMBO_S.find((p) => p.y < bandTop(XA) - 1.05) ?? UMBO_S[3];
  const iqL = UMBO_S.indexOf(qL);
  const liftS = spline(LIFT, 0.12);
  const iqR = liftS.findIndex((p, i) => i > 0 && p.y > bandTop(p.x) - 0.8);
  const qR = liftS[Math.max(0, iqR)];
  // the fillets' toes: a short concave ramp from the shell down onto the rock
  const toeL = qL.x - 1.5, toeR = qR.x + 1.6;
  const men = (q: P, xt: number, pw: number): P[] => {
    const out: P[] = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24, x = lerp(xt, q.x, u);
      out.push(pt(x, bandBot(x) - (bandBot(q.x) - q.y) * Math.pow(u, pw)));
    }
    return out;
  };
  const capL = [...men(qL, toeL, 1.35), ...[...UMBO_S.slice(1, iqL)].reverse().map((p) => pt(p.x + 0.05, p.y))];
  const capR = [...liftS.slice(iqR + 1, -1).map((p) => pt(p.x, p.y)), ...[...men(qR, toeR, 1.35)].reverse()];
  const topEdge = bandLine(bandTop, XA, XB);
  const botEdge = bandLine(bandBot, toeR, toeL);
  const cemPts = [...capL, ...topEdge, ...capR, ...botEdge];
  const cemD = line(cemPts) + 'Z';
  return {HL, UL, LID_BACK, lip, lipRim, edgeFace, lidD, lidTop, lidRings, LV_MAIN, lvD, lvRings, UV, ligD, cemD, topEdge, botEdge: [...botEdge].reverse(), toeL, toeR, qL, qR};
};
const OY = buildOyster();

/** faint purple-brown rays radiating from an umbo (thin wedges, clipped to the valve) */
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
const RAYS_LV = [
  ray(OY.UV, pt(42, -19), 0.2, 2.8, -0.02),
  ray(OY.UV, pt(40, -7), 0.2, 2.6, 0.02),
  ray(OY.UV, pt(24, 1), 0.2, 3.2, 0.03),
  ray(OY.UV, pt(4, 2), 0.2, 2.4, 0.04),
  ray(OY.UV, pt(-14, 1.5), 0.2, 1.8, 0.04),
];
const RAYS_LID = [
  ray(OY.UL, pt(-6, -28.5), 0.15, 1.6, -0.02),
  ray(OY.UL, pt(14, -30), 0.15, 2.2, -0.01),
  ray(OY.UL, pt(31, -29), 0.15, 1.8, 0.0),
  ray(OY.UL, pt(40, -23), 0.15, 1.6, 0.01),
];

// ------------------------------------------------------------------ the boulder (static)
/** the crown's back silhouette against the water: a dome whose shoulders fall away inside the medium frame */
const ROCK_TOP = spline(
  [
    pt(-200, 240), pt(-110, 110), pt(-78, 60), pt(-65, 36), pt(-58, 23), pt(-52, 14), pt(-46, 6.5), pt(-39, 0.8), pt(-30, -3.8), pt(-17, -7.2), pt(0, -8.5),
    pt(16, -8.0), pt(29, -5.6), pt(39, -1.6), pt(46, 4.0), pt(52, 11.5), pt(58, 21), pt(65, 34), pt(78, 58), pt(110, 110), pt(200, 240),
  ],
  0.6,
);
const crownY = (x: number) => yOn(ROCK_TOP, x);
const ROCK_D = line([...ROCK_TOP, pt(200, 700), pt(-200, 700)]) + 'Z';
/** the brow: where the crown (seen a little from above) rounds over into the boulder's face */
const BROW = spline([pt(-70, crownY(-70)), pt(-60, 27), pt(-50, 19.5), pt(-38, 14.6), pt(-24, 12.2), pt(-6, 11.3), pt(12, 11.8), pt(28, 13.6), pt(42, 18.0), pt(53, 24.6), pt(61, 32), pt(68, crownY(68))], 0.5);
const browY = (x: number) => yOn(BROW, x);
/** the crown's algal film reaches a little over the brow (its lower edge is softened when drawn) */
const CROWN_D = line([pt(-90, -40), pt(90, -40), ...[...BROW].reverse().map((p) => pt(p.x, p.y + 1.5))]) + 'Z';
/** the face's big form: a lit region under the crown on the left, a core shadow sweeping across the lower right */
const FACE_LIT = closed([pt(-84, 30), pt(-64, 25), pt(-48, 17.5), pt(-30, 13.8), pt(-10, 12.8), pt(6, 14), pt(14, 21), pt(10, 31), pt(-2, 41), pt(-20, 50), pt(-42, 58), pt(-64, 63), pt(-88, 66)], 0.8);
const FACE_SHADE = closed([pt(92, 26), pt(66, 31), pt(52, 33), pt(40, 36), pt(31, 46), pt(22, 58), pt(8, 69), pt(-12, 78), pt(-36, 85), pt(-64, 90), pt(-96, 93), pt(-96, 240), pt(96, 240)], 0.8);
/** fracture planes of the face: subtle value shifts with broken ink edges */
const FACETS: {ps: P[]; lit: boolean; a: number; edge: [number, number]}[] = [
  {ps: [pt(-54, 31), pt(-33, 24.5), pt(-17, 30), pt(-24, 44), pt(-47, 48)], lit: true, a: 0.34, edge: [2, 4]},
  {ps: [pt(19, 27), pt(39, 24), pt(52, 36), pt(45, 53), pt(27, 47)], lit: false, a: 0.3, edge: [2, 4]},
  {ps: [pt(-15, 55), pt(14, 50), pt(25, 66), pt(5, 77), pt(-17, 71)], lit: false, a: 0.24, edge: [1, 3]},
  {ps: [pt(-70, 60), pt(-48, 62), pt(-40, 76), pt(-60, 84), pt(-78, 78)], lit: true, a: 0.2, edge: [0, 2]},
  {ps: [pt(-12, 22), pt(4, 20), pt(10, 31), pt(0, 42), pt(-14, 36)], lit: true, a: 0.22, edge: [1, 3]},
];
const CRACKS: P[][] = [
  [pt(-47, 7.6), pt(-48.6, 11.6), pt(-46.4, 15.2)],
  [pt(47.2, 9.0), pt(49.6, 13.2), pt(48.0, 17.6), pt(50.8, 21.4)],
  [pt(8, 13.5), pt(6.4, 19), pt(9, 25), pt(7, 32), pt(10.4, 40), pt(8.6, 48), pt(12, 57), pt(10.2, 66), pt(13.6, 76), pt(11.8, 88), pt(14, 98)],
  [pt(9, 25), pt(14, 29), pt(18.4, 28), pt(22, 32)],
  [pt(-38, 40), pt(-41, 46), pt(-38.6, 52), pt(-42, 60), pt(-40, 68)],
  [pt(30, 62), pt(33.4, 67), pt(31.6, 73), pt(35, 80)],
];
const PITS = [pt(-58, 44), pt(-24, 26), pt(18, 22), pt(40, 30), pt(-20, 64), pt(30, 84), pt(-50, 76), pt(52, 52), pt(-8, 22.6), pt(-31, 47), pt(-4, 62), pt(44, 76)];
/** encrusting life (all away from the attachment, so the push lands on clean rock) */
const BARNACLES: {c: P; s: number; tilt: number}[] = [
  {c: pt(-43.6, 6.6), s: 4.2, tilt: -12},
  {c: pt(-48.4, 9.6), s: 3.1, tilt: -20},
  {c: pt(-40.0, 9.4), s: 2.6, tilt: -6},
  {c: pt(44.2, 7.4), s: 3.6, tilt: 12},
  {c: pt(48.6, 10.8), s: 2.6, tilt: 20},
  {c: pt(30.5, 22.6), s: 2.8, tilt: 6},
  {c: pt(-21.5, 21.2), s: 2.4, tilt: -4},
];
const CORALLINE: {c: P; rx: number; ry: number; rot: number; seed: number}[] = [
  {c: pt(-30, 34), rx: 6.5, ry: 2.6, rot: -0.12, seed: 1},
  {c: pt(22, 47), rx: 7.0, ry: 3.0, rot: 0.04, seed: 2},
  {c: pt(-46, 70), rx: 7.0, ry: 3.2, rot: 0.1, seed: 3},
  {c: pt(36, 72), rx: 5.0, ry: 2.6, rot: 0.2, seed: 4},
];

// ------------------------------------------------------------------ the water: a steady current plus one surge
const SURGE: [number, number] = [8.45, 9.45];
const SURGE_MM = 40;
/** the surge's progress 0..1 (C2) */
const surgeD = (t: number) => ss5(t, SURGE[0], SURGE[1]);
/** the surge's speed envelope 0..1 (bell, peak at the middle) */
const surgeE = (t: number) => {
  const x = clamp((t - SURGE[0]) / (SURGE[1] - SURGE[0]));
  return 16 * x * x * (1 - x) * (1 - x);
};
/** the weed's swing back after the surge (a smaller bell) */
const reboundE = (t: number) => {
  const x = clamp((t - 9.3) / 0.8);
  return 16 * x * x * (1 - x) * (1 - x);
};
/** how far the water has moved (mm) by film time t (things drawn at the oyster's own scale) */
const flowMM = (t: number) => 9 * (t - 8) + 1.3 * Math.sin(0.9 * t) + SURGE_MM * surgeD(t);
/** the flow in cells of a scale-adaptive particle octave (screen-consistent at every zoom) */
const flowCells = (t: number) => 0.5 * (t - 8) + 0.06 * Math.sin(0.9 * t) + 1.5 * surgeD(t);

type Motes = {z: number; cell: number; dens: number; r: [number, number]; a: number; seed: number; blurK: number; maxBlur: number; color: string};
const FAR_MOTES: Motes[] = [
  {z: 300, cell: 16, dens: 0.38, r: [0.9, 1.7], a: 0.42, seed: 1, blurK: 9, maxBlur: 6, color: mix(K.mote, C.seaLit, 0.45)},
  {z: 130, cell: 12, dens: 0.32, r: [0.5, 0.95], a: 0.5, seed: 2, blurK: 9, maxBlur: 5, color: mix(K.mote, C.seaLit, 0.25)},
  {z: 45, cell: 10, dens: 0.28, r: [0.3, 0.6], a: 0.6, seed: 3, blurK: 8, maxBlur: 4, color: K.mote},
];
/** particles at a fixed depth behind the oyster (seen in the wider framings) */
const MoteField: React.FC<{t: number; cam: Cam; m: Motes}> = ({t, cam, m}) => {
  const [x0, y0, x1, y1] = viewRect(cam, m.z, 1.12);
  const u = flowMM(t);
  const sd = surgeD(t), se = surgeE(t);
  const out: React.ReactNode[] = [];
  const i0 = Math.floor((x0 - u) / m.cell) - 2, i1 = Math.ceil((x1 - u) / m.cell) + 2;
  const j0 = Math.floor(y0 / m.cell) - 1, j1 = Math.ceil(y1 / m.cell) + 1;
  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) {
      const h = hash(i * 12.9898 + j * 78.233 + m.seed * 37.719);
      if (h > m.dens) continue;
      const hx = hash(h * 91.7 + 1.3), hy = hash(h * 53.1 + 2.7), hr = hash(h * 17.3 + 5.1), hp = hash(h * 29.9 + 0.3);
      const R = (1.8 + 4.2 * hr) * (m.cell / 10), th0 = hp * TAU, th = th0 + (hx > 0.5 ? 1 : -1) * TAU * sd;
      const ex = R * (Math.sin(th) - Math.sin(th0)), ey = R * (Math.cos(th0) - Math.cos(th));
      const x = (i + hx) * m.cell + u + 1.1 * Math.sin(0.8 * t + hp * TAU) + ex;
      const y = (j + hy) * m.cell + 0.9 * Math.sin(0.62 * t + hp * 9.1) + 0.6 * noise1(t * 0.7 + hp * 10, m.seed) + ey;
      if (x < x0 || x > x1 || y < y0 || y > y1) continue;
      const r = lerp(m.r[0], m.r[1], hr);
      const vx = 1 + (R * 6.3 * Math.cos(th) * (hx > 0.5 ? 1 : -1)) / SURGE_MM, vy = (R * 6.3 * Math.sin(th) * (hx > 0.5 ? 1 : -1)) / SURGE_MM;
      const ang = (1 - se) * (-8 + 16 * hp) + se * (Math.atan2(vy, vx) * 180) / Math.PI;
      const st = 1.35 + 3.0 * se;
      out.push(
        <ellipse key={`${i}_${j}`} cx={f(x)} cy={f(y)} rx={f(r * st)} ry={f(r * (0.8 - 0.2 * se))} transform={`rotate(${f(ang)} ${f(x)} ${f(y)})`} fill={m.color} opacity={f(m.a * (0.55 + 0.45 * hr))} />,
      );
    }
  }
  return <>{out}</>;
};

/** suspended particles near the subject at any zoom: octaves of cells (each 1/3 the last), each drawn while its cells
 *  are near `target` px on screen, drifting `flowCells` cells per unit, so the stream looks the same at every scale
 *  and the push carries the camera through it */
type AField = {c0: number; target: number; dens: number; r: [number, number]; a: number; seed: number; color: string; soft?: boolean; dark?: string};
const NEAR_FIELD: AField = {c0: 162, target: 140, dens: 0.55, r: [0.02, 0.042], a: 0.85, seed: 11, color: K.mote, dark: '#6F6A58'};
const FORE_FIELD: AField = {c0: 162, target: 320, dens: 0.3, r: [0.024, 0.055], a: 0.5, seed: 23, color: '#E8FFFA', soft: true};
const AdaptiveMotes: React.FC<{id: string; t: number; cam: Cam; z: number; F: AField}> = ({id, t, cam, z, F}) => {
  const s = layerScale(cam, z);
  const [x0, y0, x1, y1] = viewRect(cam, z, 1.1);
  const ph = flowCells(t), sd = surgeD(t), se = surgeE(t);
  const out: React.ReactNode[] = [];
  for (let o = 0; o < 9; o++) {
    const cell = F.c0 / Math.pow(3, o);
    const g = Math.log((cell * s) / F.target) / Math.log(3);
    const wgt = 1 - ss(Math.abs(g), 0.3, 1.0);
    if (wgt < 0.02) continue;
    const u = ph * cell;
    const i0 = Math.floor((x0 - u) / cell) - 2, i1 = Math.ceil((x1 - u) / cell) + 1;
    const j0 = Math.floor(y0 / cell) - 1, j1 = Math.ceil(y1 / cell) + 1;
    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) {
        const h = hash(i * 12.9898 + j * 78.233 + (F.seed + o * 7.31) * 37.719);
        if (h > F.dens) continue;
        const hx = hash(h * 91.7 + 1.3), hy = hash(h * 53.1 + 2.7), hr = hash(h * 17.3 + 5.1), hp = hash(h * 29.9 + 0.3);
        // the surge carries each particle through one turn of an eddy (net zero) on top of the bulk flow
        const R = (0.1 + 0.28 * hr) * cell, th0 = hp * TAU, sg = hx > 0.5 ? 1 : -1, th = th0 + sg * TAU * sd;
        const ex = R * (Math.sin(th) - Math.sin(th0)), ey = R * (Math.cos(th0) - Math.cos(th));
        const x = (i + hx) * cell + u + 0.07 * cell * Math.sin(0.8 * t + hp * TAU) + ex;
        const y = (j + hy) * cell + 0.06 * cell * Math.sin(0.62 * t + hp * 9.1) + ey;
        if (x < x0 || x > x1 || y < y0 || y > y1) continue;
        const r = lerp(F.r[0], F.r[1], hr) * cell;
        const vx = 1 + (R * 6.3 * Math.cos(th) * sg) / (1.5 * cell), vy = (R * 6.3 * Math.sin(th) * sg) / (1.5 * cell);
        const ang = (1 - se) * (-10 + 20 * hp) + se * (Math.atan2(vy, vx) * 180) / Math.PI;
        const st = 1.3 + 2.6 * se;
        out.push(
          <ellipse key={`${o}_${i}_${j}`} cx={f(x)} cy={f(y)} rx={f(r * st)} ry={f(r * (0.85 - 0.25 * se))} transform={`rotate(${f(ang)} ${f(x)} ${f(y)})`}
            fill={F.soft ? `url(#${id}-dot)` : F.dark && hp < 0.3 ? F.dark : F.color} opacity={f(F.a * wgt * (0.5 + 0.5 * hr) * (F.dark && hp < 0.3 ? 0.6 : 1))} />,
        );
      }
    }
  }
  return (
    <>
      {F.soft && (
        <defs>
          <radialGradient id={`${id}-dot`}>
            <stop offset="0" stopColor={F.color} stopOpacity={0.95} />
            <stop offset="0.45" stopColor={F.color} stopOpacity={0.55} />
            <stop offset="1" stopColor={F.color} stopOpacity={0} />
          </radialGradient>
        </defs>
      )}
      {out}
    </>
  );
};

/** one bubble */
const Bubble: React.FC<{x: number; y: number; r: number; sq: number; ang: number}> = ({x, y, r, sq, ang}) => (
  <g transform={`translate(${f(x)} ${f(y)}) rotate(${f(ang)})`}>
    <ellipse rx={f(r * sq)} ry={f(r / sq)} fill={rgba(mix(C.seaLit, '#FFFFFF', 0.35), 0.28)} stroke="#EFFFFB" strokeWidth={f(r * 0.17)} strokeOpacity={0.85} />
    <path d={`M${f(r * 0.25)} ${f(r * 0.72)}A${f(r * 0.78)} ${f(r * 0.78)} 0 0 0 ${f(r * 0.74)} ${f(r * 0.2)}`} fill="none" stroke="#FFFFFF" strokeWidth={f(r * 0.12)} strokeLinecap="round" opacity={0.5} />
    <ellipse cx={f(-r * 0.36)} cy={f(-r * 0.38)} rx={f(r * 0.26)} ry={f(r * 0.17)} transform={`rotate(-40 ${f(-r * 0.36)} ${f(-r * 0.38)})`} fill="#FFFFFF" opacity={0.95} />
  </g>
);
/** bubbles: rising, wobbling, carried by the current and streamed sideways by the surge */
const Bubbles: React.FC<{t: number; cam: Cam; z: number; seed: number; every: number; xs: [number, number]; y0: number; rr: [number, number]; vr?: [number, number]; kS?: number}> = ({
  t, cam, z, seed, every, xs, y0, rr, vr = [15, 24], kS = 0.9,
}) => {
  const [vx0, vy0, vx1, vy1] = viewRect(cam, z, 1.1);
  const out: React.ReactNode[] = [];
  const k0 = Math.floor((t - 9) / every) - 1, k1 = Math.floor(t / every) + 1;
  const se = surgeE(t);
  for (let k = k0; k <= k1; k++) {
    const ts = k * every + 0.45 * every * hash(k * 7.1 + seed);
    if (ts > t) continue;
    const age = t - ts;
    const v = lerp(vr[0], vr[1], hash(k * 9.1 + seed));
    const bx = lerp(xs[0], xs[1], hash(k * 3.3 + seed * 1.7));
    const y = y0 + 6 * hash(k * 1.7 + seed) * (xs[1] - xs[0] > 20 ? 1 : 0.1) - v * age - 0.8 * age * age;
    const g = 0.3 + 0.7 * ss(y0 - y, 0, 45);
    const x = bx + 0.4 * 9 * age + 1.4 * Math.sin(5.2 * age + k) * (1 - 0.7 * se) + kS * g * SURGE_MM * (surgeD(t) - surgeD(ts));
    const r = lerp(rr[0], rr[1], hash(k * 4.4 + seed)) * (1 + 0.03 * age) * ss(age, 0, 0.12);
    if (r <= 0.01 || y < vy0 - 4 || y > vy1 + 4 || x < vx0 - 4 || x > vx1 + 4) continue;
    const sq = 1 + 0.07 * Math.sin(9 * age + k) + 0.22 * se;
    out.push(<Bubble key={k} x={x} y={y} r={r} sq={sq} ang={-18 * se * g} />);
  }
  return <>{out}</>;
};

/** a puff of silt lifted off the crown by the surge and swept downstream (fades as it disperses) */
const Silt: React.FC<{id: string; t: number; cam: Cam; seed: number; n: number; xs: [number, number]; r: [number, number]; a: number}> = ({id, t, cam, seed, n, xs, r, a}) => {
  if (t < SURGE[0] || t > 10.8) return null;
  const [vx0, vy0, vx1, vy1] = viewRect(cam, 0, 1.1);
  const out: React.ReactNode[] = [];
  const se = surgeE(t);
  for (let i = 0; i < n; i++) {
    const h = hash(i * 3.91 + seed * 11.3), h2 = hash(i * 7.37 + seed * 2.9), h3 = hash(i * 1.73 + seed * 5.1);
    const tb = SURGE[0] + 0.05 + 0.3 * h;
    if (t < tb) continue;
    const age = t - tb;
    const x0 = lerp(xs[0], xs[1], h2);
    const ys = browY(x0) - 1.5 - 7 * h3;
    const carry = 1.15 * SURGE_MM * (surgeD(t) - surgeD(tb)) + 6 * age;
    const lift = (4 + 10 * h3) * (1 - Math.exp(-age / 0.35)) + 2.0 * Math.sin(3.1 * age + i);
    const x = x0 + carry + 2.2 * Math.sin(4.3 * age + i * 1.7);
    const y = ys - lift;
    const rr = lerp(r[0], r[1], hash(i * 4.7 + seed)) * (1 + 0.8 * age);
    if (x < vx0 - rr * 3 || x > vx1 + rr * 3 || y < vy0 - rr * 3 || y > vy1 + rr * 3) continue;
    const op = a * ss(age, 0, 0.18) * (1 - ss(t, 9.5, 10.4)) * (0.5 + 0.5 * hash(i * 9.1 + seed));
    out.push(<ellipse key={i} cx={f(x)} cy={f(y)} rx={f(rr * (1.3 + 2.0 * se))} ry={f(rr * 0.85)} fill={`url(#${id}-sd)`} opacity={f(op)} />);
  }
  return (
    <>
      <defs>
        <radialGradient id={`${id}-sd`}>
          <stop offset="0" stopColor={K.silt} stopOpacity={0.9} />
          <stop offset="0.6" stopColor={K.silt} stopOpacity={0.45} />
          <stop offset="1" stopColor={K.silt} stopOpacity={0} />
        </radialGradient>
      </defs>
      {out}
    </>
  );
};

/** torn bits of weed tumbling through with the surge */
const Bits: React.FC<{t: number; seed: number; n: number; ys: [number, number]; size: number; iw: number}> = ({t, seed, n, ys, size, iw}) => {
  if (t < 8.4 || t > 10.1) return null;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const h = hash(i * 5.17 + seed), h2 = hash(i * 2.31 + seed * 3.3);
    const t0 = 8.42 + 0.16 * i + 0.05 * h, t1 = t0 + 0.75 + 0.2 * h2;
    const u = clamp((t - t0) / (t1 - t0));
    if (u <= 0 || u >= 1) continue;
    const e = ss5(u, 0, 1);
    const x = lerp(-95, 105, lerp(u, e, 0.6));
    const y = lerp(ys[0], ys[1], h) + 10 * Math.sin(TAU * (0.8 * u + h2)) - 6 * Math.sin(Math.PI * u);
    const ang = (h2 * 360 + 520 * u * (h > 0.5 ? 1 : -1)) % 360;
    const L = size * (0.7 + 0.6 * h), Wd = L * 0.3;
    const d = `M${f(-L / 2)} 0Q${f(-L * 0.1)} ${f(-Wd)} ${f(L / 2)} ${f(-Wd * 0.2)}Q${f(L * 0.05)} ${f(Wd * 0.9)} ${f(-L / 2)} 0Z`;
    out.push(
      <g key={i} transform={`translate(${f(x)} ${f(y)}) rotate(${f(ang)}) scale(1 ${f(0.55 + 0.45 * Math.cos(TAU * 1.3 * u + h * 6))})`}>
        <Inked w={iw * 0.7}>
          <InkPath d={d} fill={i % 2 ? K.weed : mix(K.weed, K.weedLit, 0.4)} />
        </Inked>
      </g>,
    );
  }
  return <>{out}</>;
};

/** one seaweed strand: a ruffled ribbon anchored on the rock, bending with the current, whipped over by the surge */
const strand = (base: P, len: number, wid: number, lean: number, t: number, seed: number) => {
  const n = 26;
  const Cs: P[] = [base];
  const R: number[] = [];
  const sway = 1 + 0.18 * Math.sin(0.9 * t + seed * 0.3);
  for (let i = 1; i <= n; i++) {
    const s = i / n;
    const sg = surgeE(t - 0.14 * s), rb = reboundE(t - 0.14 * s);
    let a = lean + 0.8 * s * sway + 0.34 * s * Math.sin(TAU * 0.34 * t - 2.9 * s + seed) * (1 - 0.6 * sg) + 0.08 * noise1(t * 0.9 - s * 2.2, seed);
    a += (1.35 * sg - 0.38 * rb) * Math.pow(s, 0.55) + 0.25 * sg * Math.sin(TAU * 2.2 * t - 6 * s + seed) * s;
    a = 1.6 * Math.tanh(a / 1.6);
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
const Seaweed: React.FC<{t: number; base: P; len: number; wid: number; lean: number; seed: number; iw: number; lw: number}> = ({t, base, len, wid, lean, seed, iw, lw}) => {
  const tb = strand(base, len, wid, lean, t, seed);
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
/** short algae fuzz on the rock (tiny tufts, swaying, flattened by the surge) */
const Tuft: React.FC<{t: number; c: P; n: number; size: number; seed: number}> = ({t, c, n, size, seed}) => {
  const sg = surgeE(t - 0.05), rb = reboundE(t);
  return (
    <g>
      {Array.from({length: n}, (_, i) => {
        const h = hash(seed * 13.1 + i * 7.7);
        const x = c.x + (i - (n - 1) / 2) * size * 0.28 + (h - 0.5) * size * 0.2;
        const L = size * (0.6 + 0.6 * hash(seed + i * 3.1));
        let a = -0.5 + (i / Math.max(1, n - 1)) * 0.9 + 0.35 + 0.22 * Math.sin(TAU * 0.5 * t + i * 1.1 + seed) + 1.1 * sg - 0.3 * rb;
        a = 1.5 * Math.tanh(a / 1.5);
        const m = pt(x + Math.sin(a * 0.6) * L * 0.5, c.y - Math.cos(a * 0.6) * L * 0.5);
        const e = pt(x + Math.sin(a) * L, c.y - Math.cos(a) * L);
        return <path key={i} d={`M${f(x)} ${f(c.y + 0.4)}Q${f(m.x)} ${f(m.y)} ${f(e.x)} ${f(e.y)}`} fill="none" stroke={i % 2 ? K.weed : mix(K.weed, K.weedLit, 0.45)} strokeWidth={f(size * 0.075)} strokeLinecap="round" />;
      })}
    </g>
  );
};

// ------------------------------------------------------------------ line weights: constant on screen
/** world mm per screen px at depth 0 */
const mmPx = (cam: Cam) => cam.w / W;
/** the Inked width for a contour of `px` screen pixels */
const inkW = (cam: Cam, px = 3.6) => (px * mmPx(cam)) / OUTLINE_K;
/** the InkLine width for a drawn line of `px` screen pixels */
const lineW = (cam: Cam, px: number) => (px * mmPx(cam)) / FEATURE_K;

// ------------------------------------------------------------------ the rock's texture
/** specks at every scale: octaves of cells (each 1/3 the last), each shown while its cells are near `target` px */
const RockSpeckle: React.FC<{cam: Cam; target?: number; dens?: number}> = ({cam, target = 46, dens = 0.34}) => {
  const s = layerScale(cam, 0);
  const [x0, y0, x1, y1] = viewRect(cam, 0, 1.05);
  const out: React.ReactNode[] = [];
  for (let o = 0; o < 8; o++) {
    const cell = 9 / Math.pow(3, o);
    const g = Math.log((cell * s) / target) / Math.log(3);
    const wgt = 1 - ss(Math.abs(g), 0.35, 1.0);
    if (wgt < 0.03) continue;
    for (let i = Math.floor(x0 / cell); i <= Math.ceil(x1 / cell); i++) {
      for (let j = Math.floor(Math.max(y0, -12) / cell); j <= Math.ceil(Math.min(y1, 160) / cell); j++) {
        const h = hash(i * 17.17 + j * 31.31 + o * 5.77 + 0.7);
        if (h > dens) continue;
        const x = (i + hash(h * 7.1)) * cell, y = (j + hash(h * 3.3)) * cell;
        const r = cell * (0.06 + 0.12 * hash(h * 9.9));
        const dark = h < dens * 0.55;
        out.push(<ellipse key={`${o}_${i}_${j}`} cx={f(x)} cy={f(y)} rx={f(r * 1.3)} ry={f(r)} fill={dark ? K.rockDeep : mix(K.rockLit, '#FFFFFF', 0.3)} opacity={f(wgt * (dark ? 0.3 : 0.24))} />);
      }
    }
  }
  return <>{out}</>;
};

/** a barnacle: a low cone of wall plates with a dark slot at its top (side view, a little from above) */
const Barnacle: React.FC<{c: P; s: number; tilt: number; iw: number; lw: number}> = ({c, s, tilt, iw, lw}) => {
  const h = s * 0.5, tw = s * 0.42, bw = s * 0.5;
  const body = `M${f(-bw)} 0C${f(-bw * 0.95)} ${f(-h * 0.55)} ${f(-tw * 0.8)} ${f(-h * 0.9)} ${f(-tw / 2)} ${f(-h)}L${f(tw / 2)} ${f(-h)}C${f(tw * 0.8)} ${f(-h * 0.9)} ${f(bw * 0.95)} ${f(-h * 0.55)} ${f(bw)} 0Q0 ${f(s * 0.14)} ${f(-bw)} 0Z`;
  const rimD = `M${f(-tw / 2)} ${f(-h)}A${f(tw / 2)} ${f(tw * 0.2)} 0 0 0 ${f(tw / 2)} ${f(-h)}A${f(tw / 2)} ${f(tw * 0.2)} 0 0 0 ${f(-tw / 2)} ${f(-h)}Z`;
  return (
    <g transform={`translate(${f(c.x)} ${f(c.y)}) rotate(${f(tilt)})`}>
      <Inked w={iw * 0.85}>
        <InkPath d={body} fill={K.barnacle} />
        <InkPath d={rimD} fill={mix(K.barnacle, '#FFFFFF', 0.3)} />
        <Deco>
          {/* the shaded side (light from the upper left) and the plate sutures */}
          <path d={`M${f(tw * 0.1)} ${f(-h)}L${f(tw / 2)} ${f(-h)}C${f(tw * 0.8)} ${f(-h * 0.9)} ${f(bw * 0.95)} ${f(-h * 0.55)} ${f(bw)} 0Q${f(bw * 0.4)} ${f(s * 0.1)} ${f(bw * 0.2)} ${f(s * 0.08)}Z`} fill={K.barnacleShade} opacity={0.55} />
          {[-0.55, -0.1, 0.35].map((k, i) => (
            <path key={i} d={`M${f(k * tw)} ${f(-h * 0.98)}Q${f(k * (tw + bw) * 0.55)} ${f(-h * 0.45)} ${f(k * bw * 1.05)} ${f(s * 0.03)}`} fill="none" stroke={K.barnacleShade} strokeWidth={f(lw * 0.8)} opacity={0.8} />
          ))}
          <ellipse cx={0} cy={f(-h + tw * 0.02)} rx={f(tw * 0.34)} ry={f(tw * 0.11)} fill={mix(INK, K.rockDeep, 0.3)} />
          <path d={`M${f(-tw * 0.12)} ${f(-h)}L0 ${f(-h - tw * 0.06)}L${f(tw * 0.12)} ${f(-h)}`} fill="none" stroke={mix(K.barnacle, '#FFFFFF', 0.4)} strokeWidth={f(lw * 0.9)} strokeLinecap="round" />
        </Deco>
      </Inked>
    </g>
  );
};

/** an encrusting coralline crust: a lilac-pink patch with a pale growing margin and small knobs */
const Coralline: React.FC<{c: P; rx: number; ry: number; rot: number; seed: number}> = ({c, rx, ry, rot, seed}) => {
  const ps = blob(c, rx, ry, seed, 18, 0.2, rot);
  const inner = blob(c, rx * 0.84, ry * 0.8, seed, 18, 0.2, rot);
  const knobs = Array.from({length: 9}, (_, i) => {
    const a = hash(seed * 3.1 + i * 1.7) * TAU, rr = 0.25 + 0.5 * hash(seed * 5.9 + i * 2.3);
    return {p: pt(c.x + Math.cos(a) * rx * rr * 0.75, c.y + Math.sin(a) * ry * rr * 0.75), r: Math.min(rx, ry) * (0.08 + 0.06 * hash(seed + i))};
  });
  return (
    <g>
      <path d={closed(ps, 1)} fill={K.corallineLit} opacity={0.75} />
      <path d={closed(inner, 1)} fill={K.coralline} opacity={0.9} />
      {knobs.map((k, i) => (
        <g key={i}>
          <circle cx={f(k.p.x + k.r * 0.25)} cy={f(k.p.y + k.r * 0.25)} r={f(k.r)} fill={mix(K.coralline, K.rockDeep, 0.35)} opacity={0.6} />
          <circle cx={f(k.p.x)} cy={f(k.p.y)} r={f(k.r)} fill={mix(K.coralline, K.corallineLit, 0.55)} />
        </g>
      ))}
    </g>
  );
};

/** a calcareous tube worm: a pale coiled tube cemented to the rock, its open end dark */
const TubeWorm: React.FC<{c: P; r: number; iw: number}> = ({c, r, iw}) => {
  const ps: P[] = [];
  for (let i = 0; i <= 40; i++) {
    const th = (i / 40) * TAU * 1.25;
    const rr = r * (0.22 + 0.78 * (i / 40));
    ps.push(pt(c.x + Math.cos(th + 0.6) * rr, c.y + Math.sin(th + 0.6) * rr * 0.62));
  }
  const tw = r * 0.34, end = ps[ps.length - 1];
  return (
    <g>
      <path d={open(ps, 1)} fill="none" stroke={INK} strokeWidth={f(tw + 2 * iw * OUTLINE_K)} strokeLinecap="round" strokeLinejoin="round" />
      <path d={open(ps, 1)} fill="none" stroke={K.tube} strokeWidth={f(tw)} strokeLinecap="round" strokeLinejoin="round" />
      <path d={open(ps.slice(4, -2).map((p) => add(p, pt(-tw * 0.15, -tw * 0.18))), 1)} fill="none" stroke="#FFFFFF" strokeWidth={f(tw * 0.28)} strokeLinecap="round" opacity={0.6} />
      <ellipse cx={f(end.x)} cy={f(end.y)} rx={f(tw * 0.32)} ry={f(tw * 0.26)} fill={mix(INK, K.rockDeep, 0.3)} />
    </g>
  );
};

/** an encrusting sponge: a muted orange cushion with a couple of oscula */
const Sponge: React.FC<{c: P; rx: number; ry: number; iw: number}> = ({c, rx, ry, iw}) => {
  // a flat, lobed sheet spreading over the rock: several overlapping lobes in one inked silhouette
  const lobes = [pt(-0.45, 0.1), pt(-0.05, -0.15), pt(0.38, 0.05), pt(0.1, 0.32), pt(-0.32, 0.38)].map((o, i) =>
    blob(pt(c.x + o.x * rx, c.y + o.y * ry), rx * (0.42 + 0.08 * hash(i * 2.3)), ry * (0.5 + 0.1 * hash(i * 3.1)), 11 + i, 14, 0.16, 0.1 * (i - 2)),
  );
  const osc = [pt(c.x - rx * 0.35, c.y - ry * 0.02), pt(c.x + rx * 0.05, c.y - ry * 0.28), pt(c.x + rx * 0.4, c.y + ry * 0.1)];
  return (
    <g>
      <Inked w={iw * 0.7}>
        {lobes.map((l, i) => (
          <InkPath key={i} d={closed(l, 1)} fill={K.sponge} />
        ))}
        <Deco>
          {lobes.map((l, i) => (
            <path key={`h${i}`} d={closed(l.map((p) => pt(c.x + (p.x - c.x) * 0.8 - rx * 0.06, c.y + (p.y - c.y) * 0.7 - ry * 0.12)), 1)} fill={K.spongeLit} opacity={0.45} />
          ))}
          {osc.map((o, i) => (
            <g key={i}>
              <ellipse cx={f(o.x + rx * 0.02)} cy={f(o.y + ry * 0.04)} rx={f(rx * 0.07)} ry={f(ry * 0.08)} fill={K.spongeLit} />
              <ellipse cx={f(o.x)} cy={f(o.y)} rx={f(rx * 0.055)} ry={f(ry * 0.065)} fill={mix(K.sponge, INK, 0.6)} />
            </g>
          ))}
        </Deco>
      </Inked>
    </g>
  );
};

/** an SVG filter region (userSpaceOnUse) clipped to what the camera sees, so filters never allocate past the frame */
const fbox = (cam: Cam, x: number, y: number, w: number, h: number) => {
  const [vx0, vy0, vx1, vy1] = viewRect(cam, 0, 1.25);
  const x0 = Math.max(x, vx0), y0 = Math.max(y, vy0), x1 = Math.min(x + w, vx1), y1 = Math.min(y + h, vy1);
  return {x: f(x0), y: f(y0), width: f(Math.max(1e-3, x1 - x0)), height: f(Math.max(1e-3, y1 - y0))};
};

const RockBody: React.FC<{id: string; cam: Cam; iw: number; lw: number}> = ({id, cam, iw, lw}) => {
  const far = ss(cam.w, 14, 30); // the face's big forms only matter in the wider framings
  const soft = Math.max(0.12, 1.4 * Math.min(1, cam.w / 60));
  return (
    <>
      <defs>
        <clipPath id={`${id}-rclip`}>
          <path d={ROCK_D} />
        </clipPath>
        <linearGradient id={`${id}-rg`} gradientUnits="userSpaceOnUse" x1="0" y1="8" x2="0" y2="110">
          <stop offset="0" stopColor={mix(K.rock, K.rockLit, 0.2)} />
          <stop offset="0.5" stopColor={K.rock} />
          <stop offset="1" stopColor={mix(K.rock, K.rockDeep, 0.6)} />
        </linearGradient>
        {/* the boulder rounds away from the eye toward its flanks and base */}
        <radialGradient id={`${id}-rs`} gradientUnits="userSpaceOnUse" cx="-10" cy="14" r="96" fx="-22" fy="2">
          <stop offset="0" stopColor={C.seaDeep} stopOpacity={0} />
          <stop offset="0.6" stopColor={C.seaDeep} stopOpacity={0} />
          <stop offset="0.88" stopColor={C.seaDeep} stopOpacity={0.28} />
          <stop offset="1" stopColor={C.seaDeep} stopOpacity={0.5} />
        </radialGradient>
        {/* the crown: lit from the upper left, a film of algae */}
        <linearGradient id={`${id}-tp`} gradientUnits="userSpaceOnUse" x1="-60" y1="-4" x2="64" y2="16">
          <stop offset="0" stopColor={K.filmLit} />
          <stop offset="0.5" stopColor={K.film} />
          <stop offset="1" stopColor={mix(K.film, K.filmDeep, 0.6)} />
        </linearGradient>
        <filter id={`${id}-cb`} filterUnits="userSpaceOnUse" {...fbox(cam, -95, -45, 190, 90)}>
          <feGaussianBlur stdDeviation={f(soft)} />
        </filter>
      </defs>
      <Inked w={iw}>
        <InkPath d={ROCK_D} fill={`url(#${id}-rg)`} />
      </Inked>
      <g clipPath={`url(#${id}-rclip)`}>
        {far > 0.01 && (
          <g opacity={far}>
            <path d={FACE_LIT} fill={K.rockLit} opacity={0.42} />
            {FACETS.map((q, i) => (
              <g key={`f${i}`}>
                <path d={closed(q.ps, 0.6)} fill={q.lit ? K.rockLit : K.rockDeep} opacity={q.a} />
                <InkLine d={open(q.ps.slice(q.edge[0], q.edge[1] + 1), 0.6)} w={lw * 0.9} opacity={0.6} />
              </g>
            ))}
            <path d={FACE_SHADE} fill={mix(K.rockDeep, C.seaDeep, 0.2)} opacity={0.62} />
            {CORALLINE.map((q, i) => (
              <Coralline key={`c${i}`} {...q} />
            ))}
            {CRACKS.slice(2).map((c, i) => (
              <g key={`k${i}`}>
                <path d={open(shift(c, 0.45, 0.4), 0.6)} fill="none" stroke={mix(K.rockLit, '#FFFFFF', 0.2)} strokeWidth={f(lw * 1.2)} strokeLinecap="round" strokeLinejoin="round" opacity={0.4} />
                <path d={open(c, 0.6)} fill="none" stroke={mix(K.rockDeep, INK, 0.4)} strokeWidth={f(lw * (i === 0 ? 2.4 : 1.6))} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
              </g>
            ))}
            {PITS.map((q, i) => {
              const r = i >= 6 ? 0.5 + 0.35 * hash(i * 3.7) : 0.9 + 0.7 * hash(i * 3.7);
              return (
                <g key={`p${i}`}>
                  <ellipse cx={f(q.x + 0.25 * r)} cy={f(q.y + 0.3 * r)} rx={f(r * 1.05)} ry={f(r * 0.72)} fill={mix(K.rockLit, '#FFFFFF', 0.1)} opacity={0.35} />
                  <ellipse cx={f(q.x)} cy={f(q.y)} rx={f(r)} ry={f(r * 0.62)} fill={mix(K.rockDeep, C.seaDeep, 0.45)} opacity={0.75} />
                </g>
              );
            })}
          </g>
        )}
        <rect x="-250" y="-30" width="500" height="700" fill={`url(#${id}-rs)`} />
        {/* the crown and its film of algae, rounding softly over the brow */}
        <g filter={`url(#${id}-cb)`}>
          <path d={CROWN_D} fill={`url(#${id}-tp)`} />
        </g>
        <RockSpeckle cam={cam} />
        {CRACKS.slice(0, 2).map((c, i) => (
          <g key={`kc${i}`}>
            <path d={open(shift(c, 0.4, 0.35), 0.6)} fill="none" stroke={mix(K.filmLit, '#FFFFFF', 0.2)} strokeWidth={f(lw * 1.0)} strokeLinecap="round" opacity={0.45} />
            <path d={open(c, 0.6)} fill="none" stroke={mix(K.filmDeep, C.seaDeep, 0.5)} strokeWidth={f(lw * 1.3)} strokeLinecap="round" opacity={0.8} />
          </g>
        ))}
        <path d={line(shift(BROW.filter((p) => p.x > -52 && p.x < 14), 0, -1.2))} fill="none" stroke={mix(K.filmLit, '#FFFFFF', 0.3)} strokeWidth={f(lw * 1.8)} strokeLinecap="round" opacity={0.35 * far} />
        {/* a cool rim of light bouncing up from the water along the shaded right flank */}
        <path d={line(ROCK_TOP.filter((p) => p.x > 44 && p.x < 110))} fill="none" stroke={C.seaLit} strokeWidth="3" opacity={0.25} />
      </g>
    </>
  );
};

/** encrusting animals on the rock (drawn over the rock, under the oyster) */
const Encrusters: React.FC<{iw: number; lw: number}> = ({iw, lw}) => (
  <>
    <TubeWorm c={pt(-14, 47)} r={2.4} iw={iw} />
    <Sponge c={pt(44, 68)} rx={9} ry={4.6} iw={iw} />
    {BARNACLES.map((b, i) => (
      <Barnacle key={i} c={b.c} s={b.s} tilt={b.tilt} iw={iw} lw={lw} />
    ))}
  </>
);

/** caustic shimmer on the crown and the upper face (its own softly blurred layer); fades out in the macro */
const Caustics: React.FC<{id: string; t: number; cam: Cam}> = ({id, t, cam}) => {
  const a = ss(cam.w, 42, 72);
  if (a < 0.01) return null;
  const [x0, , x1] = viewRect(cam, 0, 1.15);
  const loops: string[] = [];
  const sx = 10;
  const rowY = (j: number) => -10 + 2.6 * j + 0.32 * j * j;
  for (let j = 0; j < 11; j++) {
    const y = rowY(j), sy = rowY(j + 1) - y;
    for (let i = Math.floor(x0 / sx) - 1; i <= Math.ceil(x1 / sx) + 1; i++) {
      const h = hash(i * 13.1 + j * 7.7), h2 = hash(i * 5.3 + j * 19.1);
      const cx = (i + (j % 2) * 0.5 + 0.4 * (h2 - 0.5)) * sx + 0.8 * Math.sin(1.2 * t + h * TAU) + 0.5 * noise1(t * 0.8 + i * 0.37, j);
      const cy = y + sy * (0.5 + 0.12 * Math.sin(1.0 * t + h * 17));
      const rx = sx * (0.6 + 0.08 * Math.sin(1.5 * t + i * 1.3 + j) + 0.1 * h2);
      const ry = sy * (0.62 + 0.08 * Math.cos(1.3 * t + i * 0.7 + j * 1.9));
      const ps: P[] = [];
      for (let k = 0; k < 7; k++) {
        const an = (k / 7) * TAU + h * 2;
        const rr = 1 + 0.2 * Math.sin(1.2 * t + k * 2.1 + h * 9);
        ps.push(pt(cx + Math.cos(an) * rx * rr, cy + Math.sin(an) * ry * rr));
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
        <linearGradient id={`${id}-cf`} gradientUnits="userSpaceOnUse" x1="0" y1="-10" x2="0" y2="46">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
          <stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0.55} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        <mask id={`${id}-cm`} maskUnits="userSpaceOnUse" x="-400" y="-20" width="800" height="80">
          <rect x="-400" y="-20" width="800" height="80" fill={`url(#${id}-cf)`} />
        </mask>
      </defs>
      <g clipPath={`url(#${id}-rclip)`} opacity={a}>
        <g mask={`url(#${id}-cm)`}>
          <path d={loops.join('')} fill="none" stroke={K.caustic} strokeWidth="0.45" strokeLinejoin="round" opacity={0.24} />
        </g>
      </g>
    </>
  );
};

// ------------------------------------------------------------------ the oyster
/** shadows on the rock: the cast shadow down-right of the oyster, the crevice under the lifting margin, and the
 *  occlusion just under the cement's contact edge */
const Shadows: React.FC<{id: string; cam: Cam; lw: number}> = ({id, cam, lw}) => {
  const E = OY.botEdge;
  const under = edge(XB + 0.5, 38, (x) => bandBot(x) - 0.1, 0.3);
  return (
    <>
      <defs>
        <radialGradient id={`${id}-cs`}>
          <stop offset="0" stopColor={K.shadow} stopOpacity={0.45} />
          <stop offset="0.6" stopColor={K.shadow} stopOpacity={0.26} />
          <stop offset="1" stopColor={K.shadow} stopOpacity={0} />
        </radialGradient>
        <filter id={`${id}-sb`} filterUnits="userSpaceOnUse" {...fbox(cam, -40, -14, 90, 24)}>
          <feGaussianBlur stdDeviation={f(Math.max(0.08, Math.min(0.6, cam.w / 100)))} />
        </filter>
      </defs>
      {/* the oyster's shadow on the crown, down and to the right of the broad end */}
      <ellipse cx="44" cy="2.8" rx="10" ry="3.6" transform="rotate(10 44 2.8)" fill={`url(#${id}-cs)`} />
      <ellipse cx="34" cy="3.4" rx="12" ry="2.4" fill={`url(#${id}-cs)`} />
      {/* the crevice under the lifting margin */}
      <path d={line([...under, pt(37.6, -7.6), pt(35.4, -4.6), pt(33.2, -2.0), pt(XB + 0.5, bandTop(XB + 0.5))]) + 'Z'} fill={K.shadow} opacity={0.5} filter={`url(#${id}-sb)`} />
      {/* occlusion just under the contact edge: a soft band and a crisper seam right under the ink */}
      <path d={line([...shift(E, 0, 0.05), ...shift([...E].reverse(), 0.3, 1.4)]) + 'Z'} fill={K.shadow} opacity={0.3} filter={`url(#${id}-sb)`} />
      <path d={line(shift(E, 0, 0.18))} fill="none" stroke={K.shadow} strokeWidth={f(lw * 1.6)} strokeOpacity={0.25} />
    </>
  );
};

/** the cement band as seen from outside: a thin pale layer between shell and rock, a little glossy */
const CementOutside: React.FC<{id: string; iw: number; lw: number; px: number}> = ({id, iw, lw, px}) => {
  const top = OY.topEdge, bot = OY.botEdge;
  // a cool reflection along its lower edge, a broken gloss streak along its upper third
  const cool = line([...bot, ...[...bot].reverse().map((p) => pt(p.x, p.y - 0.3 * (bandBot(p.x) - bandTop(p.x))))]) + 'Z';
  const glossLine = bandLine((x) => bandTop(x) + 0.3 * (bandBot(x) - bandTop(x)), XA + 1, XB - 1);
  const segs: P[][] = [];
  let cur: P[] = [];
  glossLine.forEach((p) => {
    const on = noise1(p.x * 0.55, 21) > -0.25;
    if (on) cur.push(p);
    else if (cur.length) (segs.push(cur), (cur = []));
  });
  if (cur.length) segs.push(cur);
  const gw = Math.max(0.12 * FIT.h, 1.6 * px);
  return (
    <>
      <defs>
        <clipPath id={`${id}-cc`}>
          <path d={OY.cemD} />
        </clipPath>
      </defs>
      <Inked w={iw * 0.72}>
        <InkPath d={OY.cemD} fill={K.cement} />
        <Deco>
          <g clipPath={`url(#${id}-cc)`}>
            <path d={cool} fill={K.cementCool} opacity={0.5} />
            {segs.map((sg, i) => (
              <path key={i} d={line(sg)} fill="none" stroke={K.cementLit} strokeWidth={f(gw)} strokeLinecap="round" opacity={0.9} />
            ))}
          </g>
          <ellipse cx={f(OY.qL.x - 0.9)} cy={f(OY.qL.y + 0.75)} rx={f(0.7)} ry={f(0.22)} transform={`rotate(-42 ${f(OY.qL.x - 0.9)} ${f(OY.qL.y + 0.75)})`} fill="#FFFFFF" opacity={0.85} />
        </Deco>
      </Inked>
    </>
  );
};

/** the oyster (cupped lower valve + lid); the cement band is drawn over the valve's base */
const Oyster: React.FC<{id: string; iw: number; lw: number; px: number}> = ({id, iw, lw, px}) => {
  const {lvD, lidD, lvRings, lidRings, lip} = OY;
  const bandTint = [rgba(K.shPurple, 0.3), rgba(K.shLit, 0.38), rgba(K.shBrown, 0.3), rgba(K.shLit, 0.4), rgba(K.shPurple, 0.22)];
  const lidTint = [rgba(K.sh, 0.2), rgba(K.shLit, 0.45), rgba(K.shPurple, 0.16), rgba(K.shLit, 0.45), rgba(K.shBrown, 0.14)];
  // fine growth lines near the base (they only matter in the closer framings)
  const fine = Array.from({length: 3}, (_, k) => {
    const d = 0.7 + k * 0.8 + 0.12 * Math.sin(k * 2.3);
    return line(edge(-14 + 2 * hash(k * 1.7), 18 - 3 * hash(k * 2.9), (x) => bandTop(x) - d - 0.1 * Math.sin(x * 0.7 + k) + 0.012 * (x + 14) * (k * 0.2), 0.3));
  });
  return (
    <>
      <defs>
        <linearGradient id={`${id}-lv`} gradientUnits="userSpaceOnUse" x1="-34" y1="-22" x2="30" y2="0">
          <stop offset="0" stopColor={K.shLit} />
          <stop offset="0.28" stopColor={K.shPale} />
          <stop offset="0.7" stopColor={K.sh} />
          <stop offset="1" stopColor={mix(K.sh, K.shDeep, 0.3)} />
        </linearGradient>
        <radialGradient id={`${id}-cup`} gradientUnits="userSpaceOnUse" cx="-6" cy="-30" r="44" fx="-14" fy="-32">
          <stop offset="0.55" stopColor={K.shDeep} stopOpacity={0} />
          <stop offset="0.85" stopColor={K.shDeep} stopOpacity={0.16} />
          <stop offset="1" stopColor={K.shDeep} stopOpacity={0.38} />
        </radialGradient>
        <linearGradient id={`${id}-lid`} gradientUnits="userSpaceOnUse" x1="-20" y1="-28" x2="34" y2="-20">
          <stop offset="0" stopColor={mix(K.shLit, '#FFFFFF', 0.3)} />
          <stop offset="0.5" stopColor={K.shLit} />
          <stop offset="1" stopColor={mix(K.shLit, K.shPale, 0.6)} />
        </linearGradient>
        <clipPath id={`${id}-lvc`}>
          <path d={lvD} />
        </clipPath>
        <clipPath id={`${id}-lidc`}>
          <path d={lidD} />
        </clipPath>
        <clipPath id={`${id}-lidt`}>
          <path d={OY.lidTop} />
        </clipPath>
      </defs>
      {/* the attached lower valve */}
      <Inked w={iw}>
        <InkPath d={lvD} fill={`url(#${id}-lv)`} />
        <Deco>
          <g clipPath={`url(#${id}-lvc)`}>
            {lvRings.map((r, k) => (
              <path key={`t${k}`} d={r.fill} fill={bandTint[k]} />
            ))}
            {RAYS_LV.map((r, i) => (
              <path key={`r${i}`} d={r} fill={i % 2 ? K.shPurple : K.shBrown} opacity={0.18} />
            ))}
            <path d={lvD} fill={`url(#${id}-cup)`} />
            {fine.map((d, k) => (
              <path key={`g${k}`} d={d} fill="none" stroke={k % 2 ? K.shDeep : mix(K.shLit, '#FFFFFF', 0.2)} strokeWidth={f(Math.max(lw * 0.7, 0.05))} strokeOpacity={k % 2 ? 0.28 * ss(1 / px, 6, 14) : 0.5 * ss(1 / px, 6, 14)} strokeLinecap="round" />
            ))}
            {lvRings.map((r, k) => (
              <g key={`e${k}`}>
                <path d={line(offset(r.pts, -lw * 2))} fill="none" stroke={K.shDeep} strokeWidth={f(lw * 3.4)} strokeOpacity={0.3} strokeLinejoin="round" />
                <path d={line(offset(r.pts, lw * 1.15))} fill="none" stroke={mix(K.shLit, '#FFFFFF', 0.3)} strokeWidth={f(lw * 1.15)} strokeOpacity={0.9} strokeLinejoin="round" />
              </g>
            ))}
            <path d={line(offset(lip, -lw * 3.4))} fill="none" stroke={K.shDeep} strokeWidth={f(lw * 6)} strokeOpacity={0.42} strokeLinejoin="round" />
            <path d={line(offset(lip, -lw * 1.3))} fill="none" stroke={K.shDeep} strokeWidth={f(lw * 2.6)} strokeOpacity={0.45} strokeLinejoin="round" />
            {/* the base sits in shade just above the cement */}
            <path d={line(edge(XA - 2, XB + 2, (x) => bandTop(x) - 0.25, 0.3))} fill="none" stroke={K.shDeep} strokeWidth={f(Math.max(0.5, lw * 3))} strokeOpacity={0.22} />
            <path d={line([pt(-35.0, -19.6), pt(-33.0, -17.3), pt(-30.2, -14.4)])} fill="none" stroke="#FFFFFF" strokeWidth={f(lw * 1.0)} strokeOpacity={0.55} strokeLinecap="round" />
          </g>
          <path d={OY.ligD} fill={K.shDeep} opacity={0.85} />
          {lvRings.map((r, k) => (
            <InkLine key={`i${k}`} d={r.d} w={lw * (0.85 - 0.1 * k)} opacity={0.75} />
          ))}
        </Deco>
      </Inked>
      <CementOutside id={`${id}-ce`} iw={iw} lw={lw} px={px} />
      {/* the lid (right valve): flatter, thinner, frilly edged, closed */}
      <Inked w={iw}>
        <InkPath d={lidD} fill={`url(#${id}-lid)`} />
        <Deco>
          <g clipPath={`url(#${id}-lidc)`}>
            {lidRings.map((r, k) => (
              <path key={`t${k}`} d={r.fill} fill={lidTint[k]} />
            ))}
            {RAYS_LID.map((r, i) => (
              <path key={`r${i}`} d={r} fill={i % 2 ? K.shPurple : K.shBrown} opacity={0.14} />
            ))}
            {lidRings.map((r, k) => (
              <g key={`e${k}`} clipPath={`url(#${id}-lidt)`}>
                <path d={line(offset(r.pts, -lw * 1.4))} fill="none" stroke={K.sh} strokeWidth={f(lw * 2.6)} strokeOpacity={0.35} strokeLinejoin="round" />
                <path d={line(offset(r.pts, lw * 0.95))} fill="none" stroke="#FFFFFF" strokeWidth={f(lw * 0.8)} strokeOpacity={0.6} strokeLinejoin="round" />
              </g>
            ))}
            <path d={OY.edgeFace} fill={K.sh} opacity={0.55} />
            <path d={line(offset(lip, lw * 1.4))} fill="none" stroke={K.shDeep} strokeWidth={f(lw * 2.3)} strokeOpacity={0.3} strokeLinejoin="round" />
            <path d={line(OY.lipRim)} fill="none" stroke="#FFFFFF" strokeWidth={f(lw * 0.8)} strokeOpacity={0.45} strokeLinejoin="round" />
          </g>
          <g clipPath={`url(#${id}-lidt)`}>
            {lidRings.map((r, k) => (
              <InkLine key={`i${k}`} d={r.d} w={lw * (0.7 - 0.07 * k)} opacity={0.6} />
            ))}
          </g>
          <ellipse cx="-13" cy="-23.6" rx="2.4" ry="0.42" transform="rotate(-14 -13 -23.6)" fill="#FFFFFF" opacity={0.9} />
          <ellipse cx="-7.2" cy="-25.1" rx="0.7" ry="0.3" transform="rotate(-10 -7.2 -25.1)" fill="#FFFFFF" opacity={0.85} />
          <ellipse cx="22" cy="-26.2" rx="1.1" ry="0.26" transform="rotate(2 22 -26.2)" fill="#FFFFFF" opacity={0.6} />
        </Deco>
      </Inked>
    </>
  );
};

// ------------------------------------------------------------------ the section through the attachment
/** shell layers above the cement: the outer prismatic layer against the cement, then foliated calcite sheets that
 *  follow the attachment surface near it and flatten upward, with chalky lenses */
const SECTION = (() => {
  const X0 = -7.5, X1 = 7.5, step = 0.05;
  const xs: number[] = [];
  for (let x = X0; x <= X1 + 1e-9; x += step) xs.push(x);
  const smoothTop = (x: number) => trendMid(x) - thick(x) / 2;
  const D = [0.3, 0.66, 1.02, 1.5, 1.92, 2.48, 2.98, 3.62, 4.22, 4.95, 5.7, 6.5, 7.4];
  const bounds: P[][] = [];
  D.forEach((d, k) => {
    const fl = clamp(d / 2.4);
    const prev = bounds[k - 1];
    bounds.push(
      xs.map((x, i) => {
        let y = lerp(bandTop(x), smoothTop(x), fl) - d + (0.05 + 0.03 * k) * Math.sin(x * (0.7 + 0.08 * k) + k * 1.7) + 0.025 * Math.sin(x * 2.6 + k);
        if (prev) y = Math.min(y, prev[i].y - 0.12);
        return pt(x, y);
      }),
    );
  });
  const topLine = xs.map((x) => pt(x, bandTop(x)));
  const botLine = xs.map((x) => pt(x, bandBot(x)));
  // chalky lenses: lens shapes between two sheets
  const lens = (xa: number, xb: number, k: number, fat: number) => {
    const up: P[] = [], dn: P[] = [];
    xs.forEach((x, i) => {
      if (x < xa || x > xb) return;
      const u = (x - xa) / (xb - xa), b = Math.pow(Math.sin(Math.PI * u), 0.8);
      const mid = lerp(bounds[k][i].y, bounds[k + 1][i].y, 0.5);
      const half = (bounds[k][i].y - bounds[k + 1][i].y) * 0.5 * fat * b;
      up.push(pt(x, mid - half));
      dn.push(pt(x, mid + half));
    });
    return {d: line([...up, ...dn.reverse()]) + 'Z', xa, xb, k};
  };
  const lenses = [lens(-5.4, -1.1, 5, 0.9), lens(1.6, 6.2, 7, 0.85), lens(-2.2, 1.0, 9, 0.7)];
  const pores: {p: P; r: number}[] = [];
  lenses.forEach((L, li) => {
    for (let i = 0; i < 26; i++) {
      const x = lerp(L.xa + 0.3, L.xb - 0.3, hash(li * 31.1 + i * 1.73));
      const ix = Math.round((x - X0) / step);
      const a = bounds[L.k][ix].y, b = bounds[L.k + 1][ix].y;
      const u = (x - L.xa) / (L.xb - L.xa), bb = Math.pow(Math.sin(Math.PI * u), 0.8);
      const y = lerp(a, b, 0.5) + (a - b) * 0.32 * bb * (hash(li * 7.3 + i * 2.9) * 2 - 1);
      pores.push({p: pt(x, y), r: 0.025 + 0.03 * hash(li + i * 5.1)});
    }
  });
  // prisms: short strokes across the prismatic layer, perpendicular to the cement surface
  const prisms: string[] = [];
  for (let x = X0 + 0.02; x < X1; x += 0.055) {
    const i = Math.round((x - X0) / step);
    const y0 = bandTop(x) - 0.03, y1 = bounds[0][i].y + 0.03;
    const sl = (bandTop(x + 0.05) - bandTop(x - 0.05)) / 0.1;
    prisms.push(`M${f(x)} ${f(y0)}L${f(x + sl * (y0 - y1) * 0.6)} ${f(y1)}`);
  }
  // the rock: grains (a deterministic Voronoi of jittered seeds), cut by the cement's lower edge
  // seeds on a jittered grid, thinned in places (big grains) and doubled in others (fine grains)
  const cell = 0.42;
  const seeds: P[] = [];
  const gi0 = Math.floor(-8 / cell), gi1 = Math.ceil(8 / cell), gj0 = Math.floor(-2 / cell), gj1 = Math.ceil(8 / cell);
  for (let i = gi0; i <= gi1; i++) {
    for (let j = gj0; j <= gj1; j++) {
      const big = noise1(i * 0.37 + 4.2, 3) + noise1(j * 0.41 + 1.3, 5) > 0.35;
      const hh = hash(i * 1.37 + j * 9.91 + 0.2);
      if (big && hh < 0.55) continue;
      seeds.push(pt((i + 0.12 + 0.76 * hash(i * 3.13 + j * 7.77)) * cell, (j + 0.12 + 0.76 * hash(i * 5.71 + j * 2.39 + 0.5)) * cell));
    }
  }
  const clipHalf = (poly: P[], s: P, n: P) => {
    const m = mul(add(s, n), 0.5), d = sub(n, s);
    const inside = (p: P) => (p.x - m.x) * d.x + (p.y - m.y) * d.y <= 0;
    const out: P[] = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const ia = inside(a), ib = inside(b);
      if (ia) out.push(a);
      if (ia !== ib) {
        const da = (a.x - m.x) * d.x + (a.y - m.y) * d.y, db = (b.x - m.x) * d.x + (b.y - m.y) * d.y;
        const u = da / (da - db);
        out.push(pt(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u));
      }
    }
    return out;
  };
  const grains = seeds
    .map((s, si) => {
      let poly = [pt(s.x - 2.5 * cell, s.y - 2.5 * cell), pt(s.x + 2.5 * cell, s.y - 2.5 * cell), pt(s.x + 2.5 * cell, s.y + 2.5 * cell), pt(s.x - 2.5 * cell, s.y + 2.5 * cell)];
      for (const n of seeds) if (n !== s && Math.abs(n.x - s.x) < 3.2 * cell && Math.abs(n.y - s.y) < 3.2 * cell) poly = clipHalf(poly, s, n);
      if (poly.length < 3) return null;
      const c = poly.reduce((a, p) => add(a, p), pt(0, 0));
      const ce = mul(c, 1 / poly.length);
      const rad = poly.reduce((a, p) => a + Math.hypot(p.x - ce.x, p.y - ce.y), 0) / poly.length;
      const k = Math.max(0.5, 1 - 0.02 / rad);
      const ins = poly.map((p) => add(ce, mul(sub(p, ce), k)));
      const lit = ins.map((p) => add(add(ce, mul(sub(p, ce), 0.62)), pt(-0.06, -0.07)));
      const h = hash(si * 9.13 + 0.4);
      // a few grains carry a small dark mineral fleck, off centre
      const fc = add(ce, pt((hash(si * 2.2) - 0.5) * rad * 0.9, (hash(si * 3.3) - 0.5) * rad * 0.8));
      const fl = hash(si * 4.4) < 0.08 && rad > 0.16 ? [0, 1, 2].map((q) => add(fc, pt(Math.cos(q * 2.1 + h * 6) * rad * (0.1 + 0.08 * hash(si + q)), Math.sin(q * 2.1 + h * 6) * rad * (0.07 + 0.05 * hash(si * 2 + q))))) : null;
      return {d: line(ins) + 'Z', lit: line(lit) + 'Z', tone: K.grain[Math.floor(h * K.grain.length)], c: ce, fleck: fl ? line(fl) + 'Z' : null, h, poly};
    })
    .filter((g): g is NonNullable<typeof g> => g !== null && g.c.y > bandBot(g.c.x) - 0.9 && g.c.x > -8 && g.c.x < 8);
  // the cement keys into the rock's surface: narrow fingers filling gaps between surface grains
  // the cement keys into the rock: where a boundary between two surface grains meets the cement, a short tapering
  // finger of cement runs down into the gap (at most ~0.09 mm: the band's own edge stays on the bone band's line)
  const keys: string[] = [];
  const seen: number[] = [];
  grains.forEach((g, gi) => {
    const fy = (p: P) => p.y - bandBot(p.x);
    for (let i = 0; i < g.poly.length; i++) {
      const a = g.poly[i], b = g.poly[(i + 1) % g.poly.length];
      const fa = fy(a), fb = fy(b);
      if (fa * fb >= 0) continue;
      const u = fa / (fa - fb), c = pt(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u);
      if (c.x < -5.2 || c.x > 5.2 || seen.some((x) => Math.abs(x - c.x) < 0.12) || hash(c.x * 13.7 + gi) < 0.3) continue;
      seen.push(c.x);
      const dn = nrm(fa > 0 ? sub(a, c) : sub(b, c));
      const L = 0.05 + 0.04 * hash(c.x * 7.9), wd = 0.018 + 0.008 * hash(c.x * 3.1), sd = perp(dn);
      const top = (k: number) => {
        const q = add(c, mul(sd, k * wd));
        return pt(q.x, bandBot(q.x) - 0.03);
      };
      keys.push(line([top(-1.6), add(c, add(mul(sd, -wd * 0.7), mul(dn, L * 0.45))), add(c, mul(dn, L)), add(c, add(mul(sd, wd * 0.7), mul(dn, L * 0.45))), top(1.6)]) + 'Z');
    }
  });
  const shellD = (k: number) => line([...(k < 0 ? topLine : bounds[k]), pt(X1, -9), pt(X0, -9)]) + 'Z';
  return {
    X0, X1, bounds, topLine, botLine, lenses, pores, prisms: prisms.join(''), grains, keys,
    shellBase: shellD(-1), layerD: D.map((_, k) => shellD(k)),
    rockD: line([...botLine, pt(X1, 9), pt(X0, 9)]) + 'Z',
    cementD: line([...topLine, ...[...botLine].reverse()]) + 'Z',
  };
})();

/** the wobbly outline of the window (organic, like the wrist's anatomical windows, but subtler) */
const winPts = (c: P, r: number, n = 120): P[] => {
  const out: P[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const q = 0.5 * Math.sin(3 * a + 1.3) + 0.28 * Math.sin(5 * a + 0.4) + 0.16 * Math.sin(8 * a + 2.2) + 0.08 * Math.sin(13 * a + 0.7);
    const rr = r * (1 + 0.028 * q);
    out.push(pt(c.x + rr * Math.cos(a), c.y + rr * Math.sin(a)));
  }
  return out;
};

/** the cutaway window and the section inside it; reveal 0..1 opens it from the band outward */
const SectionWindow: React.FC<{id: string; cam: Cam; reveal: number}> = ({id, cam, reveal}) => {
  if (reveal <= 0.001) return null;
  const px = mmPx(cam);
  const c = OY_WIN.c;
  const r = OY_WIN.r * (1 - Math.pow(1 - clamp(reveal), 1.6));
  if (r < 3 * px) return null;
  const soft = 0.2 + 0.22 * (1 - reveal);
  const sd = Math.max(px, (soft * r) / 4.4);
  const R = r * 1.35;
  const S = SECTION;
  const inkB = 2.4 * px; // the cement's outline: 2.4 px outside each edge, as the bone glue's
  const box = {x: c.x - R, y: c.y - R, w: 2 * R, h: 2 * R};
  const gloss = bandLine((x) => bandTop(x) + 0.27 * (bandBot(x) - bandTop(x)), S.X0, S.X1);
  const gsegs: P[][] = [];
  let cur: P[] = [];
  gloss.forEach((p) => {
    if (noise1(p.x * 1.1, 33) > -0.3) cur.push(p);
    else if (cur.length) (gsegs.push(cur), (cur = []));
  });
  if (cur.length) gsegs.push(cur);
  const coolEdge = line([...S.botLine, ...[...S.botLine].reverse().map((p) => pt(p.x, p.y - 0.26 * (bandBot(p.x) - bandTop(p.x))))]) + 'Z';
  const hiEdge = line([...S.topLine, ...[...S.topLine].reverse().map((p) => pt(p.x, p.y + 0.14 * (bandBot(p.x) - bandTop(p.x))))]) + 'Z';
  return (
    <g>
      <defs>
        <filter id={`${id}-wf`} filterUnits="userSpaceOnUse" x={f(box.x)} y={f(box.y)} width={f(box.w)} height={f(box.h)}>
          <feGaussianBlur stdDeviation={f(sd)} />
        </filter>
        <mask id={`${id}-wm`} maskUnits="userSpaceOnUse" x={f(box.x)} y={f(box.y)} width={f(box.w)} height={f(box.h)}>
          <path d={closed(winPts(c, r * (1 - soft * 0.5)), 1)} fill="#FFFFFF" filter={`url(#${id}-wf)`} />
        </mask>
        <linearGradient id={`${id}-sl`} gradientUnits="userSpaceOnUse" x1={f(c.x - r)} y1={f(c.y - r)} x2={f(c.x + r)} y2={f(c.y + r)}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.06} />
          <stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="0.7" stopColor={K.shadow} stopOpacity={0} />
          <stop offset="1" stopColor={K.shadow} stopOpacity={0.18} />
        </linearGradient>
        <linearGradient id={`${id}-rimS`} gradientUnits="userSpaceOnUse" x1={f(c.x - r * 0.75)} y1={f(c.y - r * 0.75)} x2={f(c.x + r * 0.75)} y2={f(c.y + r * 0.75)}>
          <stop offset="0" stopColor={K.shadow} stopOpacity={0.22} />
          <stop offset="0.4" stopColor={K.shadow} stopOpacity={0.06} />
          <stop offset="0.55" stopColor={K.shadow} stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${id}-rimL`} gradientUnits="userSpaceOnUse" x1={f(c.x - r * 0.75)} y1={f(c.y - r * 0.75)} x2={f(c.x + r * 0.75)} y2={f(c.y + r * 0.75)}>
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0.4} />
        </linearGradient>
        <filter id={`${id}-rf`} filterUnits="userSpaceOnUse" x={f(box.x)} y={f(box.y)} width={f(box.w)} height={f(box.h)}>
          <feGaussianBlur stdDeviation={f(Math.max(px, r * 0.02))} />
        </filter>
        <clipPath id={`${id}-rk`}>
          <path d={S.rockD} />
        </clipPath>
        <clipPath id={`${id}-sh`}>
          <path d={S.shellBase} />
        </clipPath>
      </defs>
      <g mask={`url(#${id}-wm)`}>
        {/* the shell: the prismatic layer, then the foliated sheets and chalky lenses */}
        <path d={S.shellBase} fill={K.prism} />
        <path d={S.prisms} fill="none" stroke={K.prismLine} strokeWidth={f(1.3 * px)} opacity={0.6} />
        {S.layerD.map((d, k) => (
          <path key={`l${k}`} d={d} fill={K.layer[k % K.layer.length]} />
        ))}
        <g clipPath={`url(#${id}-sh)`}>
          {S.bounds.slice(1).map((b, k) => (
            <path key={`b${k}`} d={line(shift(b, 0, 0.035))} fill="none" stroke="#FFFFFF" strokeWidth={f(1.6 * px)} opacity={0.35} />
          ))}
          {S.bounds.map((b, k) => (
            <path key={`d${k}`} d={line(b)} fill="none" stroke={mix(K.shDeep, INK, 0.25)} strokeWidth={f((k === 0 ? 2.0 : 1.3) * px)} opacity={k === 0 ? 0.75 : 0.45} />
          ))}
          {S.lenses.map((L, i) => (
            <path key={`n${i}`} d={L.d} fill={K.chalk} stroke={mix(K.shDeep, INK, 0.2)} strokeWidth={f(1.2 * px)} strokeOpacity={0.4} />
          ))}
          {S.pores.map((q, i) => (
            <ellipse key={`o${i}`} cx={f(q.p.x)} cy={f(q.p.y)} rx={f(q.r * 1.4)} ry={f(q.r)} fill={K.chalkPore} />
          ))}
        </g>
        {/* the rock: grains cut by the cement's lower edge */}
        <path d={S.rockD} fill={K.grainGap} />
        <g clipPath={`url(#${id}-rk)`}>
          {S.grains.map((g, i) => (
            <g key={`g${i}`}>
              <path d={g.d} fill={g.tone} />
              <path d={g.lit} fill="#FFFFFF" opacity={0.07} />
              {g.fleck && <path d={g.fleck} fill={mix(K.grainGap, INK, 0.3)} opacity={0.7} />}
            </g>
          ))}
        </g>
        {/* the cement: a thin even band between the two hard surfaces, keyed into the rock */}
        {S.keys.map((d, i) => (
          <path key={`kI${i}`} d={d} fill={INK} stroke={INK} strokeWidth={f(2 * inkB * 0.45)} strokeLinejoin="round" />
        ))}
        <path d={S.cementD} fill={INK} stroke={INK} strokeWidth={f(2 * inkB)} strokeLinejoin="round" />
        {S.keys.map((d, i) => (
          <path key={`kF${i}`} d={d} fill={K.cement} />
        ))}
        <path d={S.cementD} fill={K.cement} />
        <path d={coolEdge} fill={K.cementCool} opacity={0.42} />
        <path d={hiEdge} fill={K.cementShade} opacity={0.2} />
        {gsegs.map((sg, i) => (
          <path key={`s${i}`} d={line(sg)} fill="none" stroke={K.cementLit} strokeWidth={f(Math.max(0.1 * FIT.h, 2 * px))} strokeLinecap="round" opacity={0.95} />
        ))}
        {/* the cut face is lit from the upper left */}
        <rect x={f(box.x)} y={f(box.y)} width={f(box.w)} height={f(box.h)} fill={`url(#${id}-sl)`} />
      </g>
      {/* the window's rim: the cut lip shades the upper-left inside, the lower-right lip catches light */}
      <g filter={`url(#${id}-rf)`}>
        <path d={closed(winPts(c, r * (1 - soft * 0.62)), 1)} fill="none" stroke={`url(#${id}-rimS)`} strokeWidth={f(r * 0.06)} />
        <path d={closed(winPts(c, r * (1 - soft * 0.4)), 1)} fill="none" stroke={`url(#${id}-rimL)`} strokeWidth={f(r * 0.012)} />
      </g>
      {/* the cut edge itself: a thin, quiet line */}
      <path d={closed(winPts(c, r * (1 - soft * 0.42)), 1)} fill="none" stroke={INK} strokeWidth={f(1.8 * px)} opacity={0.28 * clamp(reveal * 3)} />
    </g>
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

/** the distant reef and seabed (hazy) */
const Reef: React.FC<{id: string}> = ({id}) => {
  const ridge = spline([pt(-460, 70), pt(-320, 36), pt(-240, 18), pt(-190, 6), pt(-150, 14), pt(-112, 0), pt(-70, 8), pt(-20, 4), pt(30, 14), pt(78, 0), pt(118, -14), pt(160, -18), pt(196, -2), pt(250, 8), pt(330, 26), pt(460, 60)], 2);
  const d = line([...ridge, pt(480, 800), pt(-480, 800)]) + 'Z';
  const near = spline([pt(-460, 120), pt(-300, 96), pt(-200, 84), pt(-120, 90), pt(-40, 80), pt(40, 86), pt(120, 76), pt(220, 88), pt(460, 110)], 4);
  return (
    <>
      <defs>
        <linearGradient id={`${id}-rf`} gradientUnits="userSpaceOnUse" x1="0" y1="-20" x2="0" y2="160">
          <stop offset="0" stopColor={mix(C.sea, C.seaDeep, 0.3)} />
          <stop offset="1" stopColor={mix(C.seaDeep, '#08202E', 0.3)} />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${id}-rf)`} />
      <path d={line([...near, pt(480, 800), pt(-480, 800)]) + 'Z'} fill={mix(C.seaDeep, '#5E6A5C', 0.25)} opacity={0.6} />
    </>
  );
};

/** a dark, out-of-focus rock in the near foreground (lower left): depth on the wide framing */
const NearRock: React.FC<{id: string}> = ({id}) => {
  const d = closed([pt(-120, 92), pt(-96, 80), pt(-74, 77), pt(-56, 84), pt(-44, 98), pt(-40, 120), pt(-60, 156), pt(-120, 166)], 1);
  return (
    <>
      <defs>
        <radialGradient id={`${id}-nr`} gradientUnits="userSpaceOnUse" cx="-70" cy="110" r="46" fx="-82" fy="88">
          <stop offset="0" stopColor={mix(K.rockDeep, C.sea, 0.25)} />
          <stop offset="0.7" stopColor={mix(K.rockDeep, C.seaDeep, 0.55)} />
          <stop offset="1" stopColor={mix(C.seaDeep, '#06141C', 0.4)} />
        </radialGradient>
      </defs>
      <path d={d} fill={`url(#${id}-nr)`} />
      <path d={open([pt(-104, 84), pt(-84, 78.6), pt(-66, 79.6)], 1)} fill="none" stroke={mix(K.rockLit, C.seaLit, 0.4)} strokeWidth="2.2" strokeLinecap="round" opacity={0.45} />
    </>
  );
};

// ------------------------------------------------------------------ the world
const FrontScene: React.FC<{id: string; t: number; cam: Cam; iw: number; lw: number}> = ({id, t, cam, iw, lw}) => (
  <>
    <Encrusters iw={iw} lw={lw} />
    <Shadows id={`${id}-s`} cam={cam} lw={lw} />
    {/* weed and a bubble stream rooted on the crown behind the oyster */}
    <Seaweed t={t} base={pt(-42.5, crownY(-42.5) + 2.6)} len={44} wid={2.2} lean={-0.32} seed={2.1} iw={iw * 0.8} lw={lw} />
    <Seaweed t={t} base={pt(-48.0, crownY(-48.0) + 3.2)} len={30} wid={1.8} lean={-0.5} seed={6.6} iw={iw * 0.8} lw={lw} />
    <Seaweed t={t} base={pt(45.5, crownY(45.5) + 2.8)} len={34} wid={2.0} lean={0.08} seed={5.3} iw={iw * 0.8} lw={lw} />
    <Tuft t={t} c={pt(-57, crownY(-57) + 3.0)} n={5} size={3.4} seed={2} />
    <Bubbles t={t} cam={cam} z={0} seed={29} every={0.22} xs={[-40.0, -39.6]} y0={crownY(-39.8) + 1.6} rr={[0.42, 0.85]} vr={[13, 18]} kS={0.95} />
    <Oyster id={`${id}-o`} iw={iw} lw={lw} px={mmPx(cam)} />
  </>
);
/** what lies in front of the oyster: weed and tufts on the brow, the silt puff */
const Foreground: React.FC<{id: string; t: number; cam: Cam; iw: number; lw: number}> = ({id, t, cam, iw, lw}) => (
  <>
    <Tuft t={t} c={pt(-31, browY(-31) - 0.9)} n={5} size={3.0} seed={1} />
    <Tuft t={t} c={pt(36, browY(36) - 1.0)} n={6} size={3.6} seed={3} />
    <Tuft t={t} c={pt(-12, browY(-12) - 0.7)} n={4} size={2.6} seed={5} />
    <Seaweed t={t} base={pt(-49, browY(-49) - 1.4)} len={58} wid={3.0} lean={-0.34} seed={0.4} iw={iw * 0.85} lw={lw} />
    <Seaweed t={t} base={pt(51, browY(51) - 1.4)} len={56} wid={2.8} lean={0.02} seed={4.2} iw={iw * 0.85} lw={lw} />
    <Silt id={`${id}-st`} t={t} cam={cam} seed={2} n={34} xs={[-70, 10]} r={[0.3, 0.7]} a={0.75} />
  </>
);

/**
 * The underwater oyster world, full frame (1080×1920). Draws its own background and every depth layer.
 * `t` is the film time in seconds (designed for 7.98..10.33, continuous outside it); `cam` frames the world in mm;
 * `reveal` 0..1 opens the cutaway window onto the attachment section (0 = closed).
 */
export const OysterWorld: React.FC<{id: string; t: number; cam: Cam; reveal?: number}> = ({id, t, cam, reveal = 0}) => {
  const iw = inkW(cam);
  const lw = lineW(cam, 2.2);
  const d0 = 2.2 * cam.w;
  const far = (zs: (m: Motes) => boolean) =>
    FAR_MOTES.filter(zs).map((m) => (
      <Layer key={m.z} c={cam} z={m.z} blurK={m.blurK} maxBlur={m.maxBlur}>
        <MoteField t={t} cam={cam} m={m} />
      </Layer>
    ));
  const zFore = -0.5 * d0;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: C.sea}}>
      <Layer c={cam} z={900} maxBlur={0}>
        <Backdrop id={`${id}-bd`} />
      </Layer>
      <Layer c={cam} z={340} blurK={40} maxBlur={22}>
        <Shafts id={`${id}-sh`} t={t} />
      </Layer>
      {far((m) => m.z >= 250)}
      <Layer c={cam} z={200} blurK={22} maxBlur={10}>
        <Reef id={`${id}-rf`} />
      </Layer>
      {far((m) => m.z >= 100 && m.z < 250)}
      {cam.w > 30 && (
        <Layer c={cam} z={45} blurK={8} maxBlur={4}>
          <MoteField t={t} cam={cam} m={FAR_MOTES[2]} />
          <Bubbles t={t} cam={cam} z={45} seed={3} every={1.05} xs={[-95, 90]} y0={14} rr={[0.55, 1.2]} />
        </Layer>
      )}
      {cam.w > 30 && (
        <Layer c={cam} z={22} blurK={14} maxBlur={6}>
          <Bits t={t} seed={7} n={3} ys={[-70, -34]} size={5} iw={iw} />
        </Layer>
      )}
      <Layer c={cam} z={0}>
        <RockBody id={`${id}-r`} cam={cam} iw={iw} lw={lw} />
      </Layer>
      <Layer c={cam} z={0} blurK={0} minBlur={Math.min(6, 0.3 * (W / cam.w))}>
        <Caustics id={`${id}-k`} t={t} cam={cam} />
      </Layer>
      <Layer c={cam} z={0}>
        <FrontScene id={`${id}-m`} t={t} cam={cam} iw={iw} lw={lw} />
        <SectionWindow id={`${id}-w`} cam={cam} reveal={reveal} />
        <Foreground id={`${id}-fg`} t={t} cam={cam} iw={iw} lw={lw} />
        <AdaptiveMotes id={`${id}-am`} t={t} cam={cam} z={0} F={NEAR_FIELD} />
      </Layer>
      <Layer c={cam} z={zFore} blurK={0} minBlur={3.5}>
        <AdaptiveMotes id={`${id}-af`} t={t} cam={cam} z={zFore} F={FORE_FIELD} />
      </Layer>
      {d0 - 30 > 0.3 * d0 && (
        <Layer c={cam} z={-30} blurK={90} maxBlur={12}>
          <NearRock id={`${id}-nr`} />
        </Layer>
      )}
      {cam.w > 30 && (
        <Layer c={cam} z={-14} blurK={30} maxBlur={10}>
          <Bubbles t={t} cam={cam} z={-14} seed={17} every={2.3} xs={[30, 70]} y0={60} rr={[1.1, 1.7]} />
          <Bits t={t} seed={3} n={2} ys={[-44, -16]} size={7} iw={iw} />
        </Layer>
      )}
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <radialGradient id={`${id}-vig`} gradientUnits="userSpaceOnUse" cx={W / 2} cy={H * 0.5} r={H * 0.68}>
            <stop offset="0.5" stopColor={C.seaDeep} stopOpacity={0} />
            <stop offset="1" stopColor={C.seaDeep} stopOpacity={0.4} />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill={`url(#${id}-vig)`} />
      </svg>
    </div>
  );
};

/** the band's edges in world mm (for QA: map through OY_CAM_OUT to compare with the json) */
export const OY_BAND = {top: bandTop, bottom: bandBot, attached: [XA, XB] as [number, number]};
