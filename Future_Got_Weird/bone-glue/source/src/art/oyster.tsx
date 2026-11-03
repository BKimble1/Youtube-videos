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
// screen outline at the wrist's match framing), mapped into this world through OY_CAM_OUT and very lightly smoothed
// (σ 2.5 px: sub-3 px wiggles go, the json's corners stay within ~1.5 px). So at OY_CAM_OUT the cement's upper and
// lower edges lie on the bone band's (the json is read at build time: regenerate it and the oyster follows). Beyond the
// json's span the band continues along the whole attached base with the same trend and a gentle wave.
// Inside the window: darker violet-grey shell layers above (the prismatic layer against the cement, foliated sheets,
// pearly lenses), the cement as the one bright, even, pale aqua-ivory band (its highlight streak where the bone glue
// carries its own), and the rock's mixed grains below (a few large crystals among small ones).
//
// The shell: the oyster cements its LEFT valve (the deeper one) to the rock; the RIGHT valve is the flatter lid. Seen
// from the side: the upturned beak (hinge) at the left, the shell highest about 35-40 % along, the lid a teardrop
// seen a little from above that rounds at the bill, the wavy (plicate) lip seam dropping toward the bill, the lower
// valve's side built of three overlapping flared growth plates with frilly dark edges, and a thin, fluted bill margin
// that curls down onto the rock. The cement is a thin calcium-carbonate layer between two hard surfaces.
//
// The oyster, its cement and the rock never move. Everything that belongs to the water moves, left to right: particles
// in several depth layers (near the subject at every zoom: scale-adaptive octaves; light motes over open water, dark
// silt over shell and rock; every streak within ±18° of the flow), large soft foreground flecks (8.4–10.1 s), weed
// scraps across the base in the macro, weed bending with the current, bubbles, shafts and caustics, and one current
// SURGE (t 8.45–9.45, peak ≈ 8.95). All motion is a deterministic, continuous function of t. Contours keep a constant
// on-screen weight; every SVG filter region is clipped to the view.
import React from 'react';
import {Cam, Layer, viewRect, layerScale, toScreen, toWorld, W, H} from '../camera';
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
  under: '#1F2C2E',
  // bare rock where the algal film is worn away (a granite grey, like the section's grains)
  bare: '#9C9A93',
  bareLit: '#B5B2A9',
  bareDeep: '#6F6D68',
  // the crown's thin olive film of algae
  film: '#8F9472',
  filmLit: '#AAAD88',
  filmDeep: '#61684B',
  // the shell: chalky grey-white with violet and brown
  shLit: tint('#E8E5DF', 0.03),
  shPale: tint('#CAC4C0', 0.03),
  shMid: tint('#A89EA1', 0.04),
  sh: tint('#8F8489', 0.04),
  shDeep: tint('#514556', 0.05),
  shBrown: tint('#7A685C', 0.04),
  shPurple: tint('#6C5577', 0.04),
  // the cement: pale aqua-ivory (the bone glue is teal), the brightest thing at the base
  cement: '#DDEFE7',
  cementLit: '#F9FFFC',
  cementShade: '#B2CAC2',
  weed: '#4A8757',
  weedLit: '#8CC07E',
  weedDeep: '#255541',
  weedHold: '#3D5B3A',
  mote: '#DDF6F0',
  moteDark: '#46463A',
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
  cone: tint('#B88E78', 0.12),
  coneLit: tint('#DDB79C', 0.1),
  coneDeep: tint('#76584B', 0.12),
  // the seabed beyond the boulder
  sand: mix(C.sea, '#99947A', 0.42),
  sandDeep: mix(C.seaDeep, '#4F4B3B', 0.4),
  // the section (a cut face: flat colours, darker than the cement)
  prism: '#6B5768',
  prismLine: '#574657',
  layer: ['#8F7F98', '#A69AAC', '#94879E', '#AFA5B3', '#887A8F'],
  layerLine: '#5B4B60',
  chalk: '#B6ACBA',
  chalkPore: '#9F949F',
  grainGap: '#8A847B',
};
/** the rock's mineral grains in the section: grey, warm tan, dark, pale quartz, pinkish feldspar */
const GRAIN = {
  g: ['#9C978E', '#A39E95', '#948F87', '#A09A90'],
  t: ['#AD9880', '#A48D76', '#B5A088'],
  d: ['#67625C', '#6F6A63', '#5E5A55'],
  q: ['#BEBBB3', '#B6B3AC'],
  f: ['#AD9387', '#A88E82'],
};

// ------------------------------------------------------------------ line weights: constant on screen
/** world mm per screen px at depth 0 */
const mmPx = (cam: Cam) => cam.w / W;
/** the Inked width for a contour of `px` screen pixels */
const inkW = (cam: Cam, px = 3.6) => (px * mmPx(cam)) / OUTLINE_K;
/** the InkLine width for a drawn line of `px` screen pixels */
const lineW = (cam: Cam, px: number) => (px * mmPx(cam)) / FEATURE_K;

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
type FrillOpts = {taper?: number; sharp?: number; mode?: 'scallop' | 'tooth'; ampP?: (p: P, u: number) => number; lobeK?: (j: number) => number; toothP?: number};
/** a frilly edge: the base polyline pushed along its normal (side +1 = perp of the direction of travel) in lobes.
 *  'scallop' = rounded lobes with sharp valleys, 'tooth' = the oyster's zigzag (plicate) margin. lobeK(j) scales lobe
 *  j's amplitude, and a share toothP of the lobes take the tooth shape (an irregular, flaky edge rather than an even
 *  scallop). Also returns the indices of the valleys between lobes (for flutes). */
const frillX = (base: P[], side: number, amp: [number, number], wl: [number, number], seed: number, o: FrillOpts = {}) => {
  const {taper = 1.6, sharp = 0.55, mode = 'scallop', ampP = () => 1, lobeK = () => 1, toothP = 0} = o;
  const s = arcs(base);
  const L = s[s.length - 1];
  const b = [0];
  for (let j = 0; b[b.length - 1] < L; j++) b.push(b[b.length - 1] + lerp(wl[0], wl[1], hash(seed * 7.13 + j * 3.71)));
  const k = L / b[b.length - 1];
  for (let i = 0; i < b.length; i++) b[i] *= k;
  const T = tangents(base);
  let j = 0;
  const r = 0.035, top = Math.sqrt(1 + r) - Math.sqrt(r);
  const val: number[] = [];
  const pts = base.map((p, i) => {
    while (j < b.length - 2 && s[i] > b[j + 1]) {
      j++;
      val.push(i);
    }
    const u = clamp((s[i] - b[j]) / (b[j + 1] - b[j]));
    const uu = Math.pow(u, 0.75 + 0.5 * hash(seed * 1.37 + j * 5.11));
    const odd = mode !== 'tooth' && hash(seed * 4.41 + j * 2.237) < toothP;
    const tooth = mode === 'tooth' || odd;
    const a = lerp(amp[0], amp[1], hash(seed * 2.9 + j * 1.618)) * ampP(p, s[i] / L) * lobeK(j) * (odd ? 0.5 : 1);
    const tp = ss(s[i], 0, taper) * ss(L - s[i], 0, taper);
    const sh = tooth ? (Math.sqrt(1 + r) - Math.sqrt((2 * uu - 1) ** 2 + r)) / top : Math.pow(Math.sin(Math.PI * uu), sharp);
    return add(p, mul(perp(T[i]), side * a * sh * tp));
  });
  return {pts, val};
};
const frillN = (base: P[], side: number, amp: [number, number], wl: [number, number], seed: number, o: FrillOpts = {}) => frillX(base, side, amp, wl, seed, o).pts;
/** low-frequency irregularity along a polyline's normal (tapered to zero at both ends so joins stay put) */
const rough = (ps: P[], amp: number, seed: number, k = 0.2, taper = 3) => {
  const T = tangents(ps), s = arcs(ps), L = s[s.length - 1];
  return ps.map((p, i) => add(p, mul(perp(T[i]), amp * noise1(s[i] * k + seed * 3.1, seed) * ss(s[i], 0, taper) * ss(L - s[i], 0, taper))));
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
/** split a polyline into the runs where keep(p) holds */
const runs = (ps: P[], keep: (p: P) => boolean): P[][] => {
  const out: P[][] = [];
  let cur: P[] = [];
  ps.forEach((p) => {
    if (keep(p)) cur.push(p);
    else if (cur.length) (out.push(cur), (cur = []));
  });
  if (cur.length) out.push(cur);
  return out.filter((r) => r.length > 1);
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
/** resample y(x) every 0.01 mm and smooth it lightly (Gaussian, σ = 2.5 screen px at OY_CAM_OUT) */
const smoothEdge = (ps: P[], sigma = 2.5 * SP): P[] => {
  const st = 0.01;
  const xs: number[] = [];
  for (let x = ps[0].x; x <= ps[ps.length - 1].x + 1e-9; x += st) xs.push(x);
  const ys = xs.map((x) => yOn(ps, x));
  const k = Math.ceil((3 * sigma) / st);
  const wts = Array.from({length: 2 * k + 1}, (_, i) => Math.exp(-0.5 * (((i - k) * st) / sigma) ** 2));
  return xs.map((x, i) => {
    let a = 0, b = 0;
    for (let q = -k; q <= k; q++) {
      const m = i + q;
      if (m < 0 || m >= ys.length) continue;
      a += wts[q + k] * ys[m];
      b += wts[q + k];
    }
    return pt(x, a / b);
  });
};
const JT = smoothEdge(ROWS.map((r) => outToWorld(r.glueTop)));
const JB = smoothEdge(ROWS.map((r) => outToWorld(r.glueBottom)));
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
const wig = (x: number) => 0.17 * Math.sin(1.85 * x + 0.4) + 0.08 * Math.sin(4.3 * x + 1.9);
const thick = (x: number) => FIT.h * (1 + 0.07 * Math.sin(0.83 * x + 2.1) + 0.04 * Math.sin(2.9 * x));
const jw = (x: number) => ss(x, JX0, JX0 + 0.45) * ss(JX1 - x, 0, 0.45);
/** the cement band's upper edge (against the shell) at x: the json's glueTop inside its span */
export const bandTop = (x: number) => lerp(trendMid(x) + wig(x) - thick(x) / 2, yOn(JT, x), jw(x));
/** the cement band's lower edge (against the rock) at x: the json's glueBottom inside its span */
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
/** the attached span of the lower valve: from XA (umbo end) to XB (where the bill's margin lifts off the rock) */
const XA = -29, XB = 24;
const buildOyster = () => {
  // --- the lid (right valve): a teardrop seen a little from above, pointed at the hinge, highest ~36 % along the
  // shell, rounding at the bill; its back edge is a lumpy, asymmetric dome (a flat shoulder, then a steeper fall to the
  // bill: two octaves of low-frequency roughness, tapered so the hinge and the bill stay put) with an irregular, flaky
  // margin (lobes of very different size, some notched teeth among the scallops) that becomes fluted toward the bill
  const HL = pt(-36.8, -20.7);
  const BACK0 = rough(
    rough(
      spline([HL, pt(-34, -22.7), pt(-30, -24.7), pt(-24, -26.6), pt(-17, -27.9), pt(-11, -28.3), pt(-5, -28.0), pt(2, -27.0), pt(9, -25.3), pt(16, -22.8), pt(22, -19.7), pt(27, -16.3), pt(31.5, -12.8), pt(35.2, -9.4), pt(37.9, -6.6), pt(39.3, -4.3), pt(39.4, -2.9), pt(38.4, -2.1)], 0.2),
      2.2, 19, 0.075, 6,
    ),
    0.45, 33, 0.24, 4,
  );
  const billZ = (x: number) => ss(x, 16, 33);
  const BACKX = frillX(BACK0, -1, [0.35, 1.3], [1.4, 6.5], 17, {
    mode: 'scallop', sharp: 0.65, taper: 2.2, toothP: 0.3,
    ampP: (p) => 0.75 + 0.85 * billZ(p.x),
    lobeK: (j) => 0.25 + 1.4 * Math.pow(hash(j * 7.31 + 0.7), 1.3),
  });
  // the lip seam between the valves: wavy, dropping from the hinge toward the bill, its plicate teeth biting down
  const LIP0 = rough(
    spline([pt(38.4, -2.1), pt(35, -2.4), pt(30, -3.5), pt(24, -5.3), pt(17, -7.7), pt(9, -10.4), pt(1, -12.7), pt(-7, -14.6), pt(-15, -16.1), pt(-22, -17.4), pt(-28, -18.5), pt(-33, -19.5), HL], 0.2),
    0.5, 7, 0.2,
  ).map((p) => pt(p.x, p.y + 0.75 * Math.sin((p.x + 4) * 0.3) * ss(p.x, -32, -22) * ss(36 - p.x, 0, 5)));
  const LIPX = frillX(LIP0, -1, [1.0, 2.1], [3.0, 5.0], 13, {mode: 'tooth', taper: 2.6, ampP: (p) => 0.4 + 0.6 * ss(p.x, -32, -14)});
  const lip = LIPX.pts;
  const lidPts = [...BACKX.pts, ...lip.slice(1)];
  const lidD = line(lidPts) + 'Z';
  const lipRim = offset(LIP0, 1.3);
  const edgeFace = line([...lip, ...[...lipRim].reverse()]) + 'Z';
  // the lid's growth lamellae: smaller teardrops about its umbo at uneven spacings, each jittered and broken into 2-3
  // partial flakes. The layers step down toward the margin as flat terraces (each older, inner layer a little lighter);
  // each flake is a shingle edge: its raised lip catches the light, its frilly (navy) edge overhangs the younger shell
  // beyond it and throws a step shadow
  // there, deepest where the edge faces the bill (away from the light), thin where it faces the back; the shadow
  // tapers at the flake's ends
  const UL = pt(-35.4, -21.0);
  const lidBase = [...BACK0, ...LIP0.slice(1)];
  const lbS = arcs(lidBase);
  const tipI = lidBase.reduce((bi, p, i, a) => (p.x > a[bi].x ? i : bi), 0);
  type Lam = {d: string; shade: string; lip: string; k: number};
  const lidTerr: string[] = [];
  const LDIR = nrm(pt(-0.55, -0.83));
  const lidLam: Lam[] = [];
  [0.94, 0.83, 0.66, 0.58, 0.37].forEach((sc0, k) => {
    const sc = rough(scaleAbout(lidBase, UL, sc0), 0.35 + 0.45 * sc0, 61 + k * 5, 0.16, 2);
    const fr = frillN(sc, -1, [0.3, 0.85], [1.5, 3.8], 41 + k * 3, {
      mode: 'scallop', sharp: 0.7, taper: 1.0, toothP: 0.3,
      ampP: (p) => 0.7 + 0.5 * billZ(p.x),
      lobeK: (j) => 0.45 + 1.0 * hash(j * 3.3 + k * 1.7),
    });
    lidTerr.push(closed(fr, 1));
    const T = tangents(sc);
    const back = (0.55 + 0.33 * hash(k * 1.9 + 0.3)) * lbS[tipI] * sc0, fwd = (2 + 6 * hash(k * 2.7 + 0.1)) * sc0;
    const idx: number[] = [];
    fr.forEach((_, i) => {
      const d = (lbS[i] - lbS[tipI]) * sc0;
      if (d > -back && d < fwd) idx.push(i);
    });
    if (idx.length < 8) return;
    // 2-3 flakes with gaps of 7-15 % between them
    const nSeg = hash(k * 5.3 + 1.1) > 0.4 ? 3 : 2;
    const wts = Array.from({length: nSeg}, (_, q) => 0.6 + hash(k * 9.1 + q * 2.3));
    const gaps = Array.from({length: nSeg - 1}, (_, q) => 0.07 + 0.08 * hash(k * 4.7 + q * 3.9));
    const free = 1 - gaps.reduce((a, b) => a + b, 0), wsum = wts.reduce((a, b) => a + b, 0);
    let u0 = 0;
    // the step shadow's width (mm), wider on the bigger, older lamellae
    const Wsh = 1.3 + 1.4 * sc0;
    for (let q = 0; q < nSeg; q++) {
      const u1 = u0 + (free * wts[q]) / wsum;
      const ia = idx[Math.floor(u0 * (idx.length - 1))], ib = idx[Math.floor(u1 * (idx.length - 1))];
      u0 = u1 + (gaps[q] ?? 0);
      if (ib - ia < 4) continue;
      const E: P[] = [], O: P[] = [], I: P[] = [];
      for (let i = ia; i <= ib; i++) {
        const u = (i - ia) / (ib - ia);
        const env = Math.pow(Math.sin(Math.PI * u), 0.55);
        const out = mul(perp(T[i]), -1);
        const face = out.x * LDIR.x + out.y * LDIR.y;
        const w = Wsh * env * (0.7 + 0.3 * noise1(i * 0.05 + k * 3.3 + q, 5));
        E.push(fr[i]);
        O.push(add(fr[i], mul(out, w * (0.6 + 0.4 * ss(-face, -0.45, 0.4)))));
        I.push(add(fr[i], mul(out, -0.22 * w)));
      }
      lidLam.push({d: line(E), shade: line([...E, ...[...O].reverse()]) + 'Z', lip: line([...E, ...[...I].reverse()]) + 'Z', k});
    }
  });
  // flutes: short grooves running in from the valleys of the bill's fluted edge
  const lidFlutes = BACKX.val
    .map((i) => BACKX.pts[i])
    .filter((p) => p.x > 14)
    .map((p, k) => {
      const d = nrm(sub(UL, p)), L = (1.2 + 3.2 * billZ(p.x)) * (0.75 + 0.5 * hash(k * 3.3 + 1));
      return line([p, add(add(p, mul(d, L * 0.55)), mul(perp(d), 0.3 * (hash(k * 1.7) - 0.5))), add(p, mul(d, L))]);
    });

  // --- the attached lower valve (left valve): its rim hidden under the lid; past the lid's tip the thin bill margin
  // flares out and curls down onto the rock; its lower edge lifts a little off the rock between the bill and XB; the
  // base is moulded to the rock along the cement (XA..XB); the umbo end rises to the upturned beak
  const RIM = spline([pt(-34.5, -20.0), pt(-27, -21.2), pt(-17, -21.8), pt(-7, -21.2), pt(3, -19.4), pt(13, -16.0), pt(22, -12.0), pt(29, -8.4), pt(34, -5.9), pt(37.6, -4.7)], 0.25);
  const BILLM = spline([pt(37.6, -4.7), pt(39.8, -4.8), pt(41.7, -3.7), pt(42.9, -1.8), pt(43.1, -0.1), pt(42.4, 1.0)], 0.12);
  const LIFT = spline([pt(42.4, 1.0), pt(41.0, 0.7), pt(38.8, 0.15), pt(35.8, -0.45), pt(32, -0.85), pt(28, -1.15), pt(25.6, bandTop(25.6) - 0.05), pt(XB, bandTop(XB) + 0.3)], 0.2);
  const BASE = edge(XB - 0.2, XA + 0.2, (x) => bandTop(x) + 0.3, 0.25);
  const UMBO = spline([pt(XA, bandTop(XA) + 0.3), pt(-31, -0.4), pt(-33.2, -3.2), pt(-35.4, -6.8), pt(-37.5, -10.6), pt(-39.3, -14.4), pt(-40.6, -17.6), pt(-41.15, -19.8)], 0.2);
  const BEAK_TOP = spline([pt(-41.15, -19.8), pt(-39.8, -21.0), pt(-37.35, -21.3), pt(-35.26, -20.5), pt(-34.5, -20.0)], 0.2);
  const billF = frillX(BILLM, -1, [0.75, 1.3], [1.6, 2.5], 29, {mode: 'scallop', sharp: 0.6, taper: 0.7});
  const liftF = frillN(LIFT, -1, [0.18, 0.4], [1.4, 2.4], 31, {mode: 'scallop', sharp: 0.8, taper: 1.0});
  const umboF = frillN(UMBO, -1, [0.25, 0.6], [1.6, 2.6], 37, {mode: 'tooth', taper: 1.2, ampP: (p) => ss(-p.y, 1, 4)});
  const lvPts = [...RIM, ...billF.pts.slice(1), ...liftF.slice(1), ...BASE, ...umboF, ...BEAK_TOP.slice(1, -1)];
  const lvD = line(lvPts) + 'Z';
  const UV = pt(-38.6, -19.4);
  const billFlutes = billF.val
    .map((i) => billF.pts[i])
    .map((p, k) => {
      const d = nrm(sub(pt(30, -9), p)), L = 1.5 + 0.9 * hash(k * 2.9 + 4);
      return line([p, add(p, mul(d, L))]);
    });
  // the underside of the lifted margin (turned away from the light)
  const underD = line([...liftF, ...[...offset(LIFT, 0.85)].reverse()]) + 'Z';

  // three overlapping growth plates on the lower valve, concentric about the beak: each older plate (nearer the beak)
  // laps over the younger shell beyond it, its flared, frilly free edge curving down from under the lip to the rock
  const deg = Math.PI / 180;
  const ellArc = (xc: number, yc: number, rx: number, ry: number, th0: number, th1: number, n = 64) =>
    Array.from({length: n + 1}, (_, i) => {
      const th = lerp(th0, th1, i / n) * deg;
      return pt(xc + rx * Math.cos(th), yc + ry * Math.sin(th));
    });
  type Ell = {xc: number; yc: number; rx: number; ry: number; th1: number};
  const PLATE_E: Ell[] = [
    {xc: 2, yc: -13, rx: 17, ry: 14, th1: 100},
    {xc: -16, yc: -16.5, rx: 15, ry: 17, th1: 100},
    {xc: -30, yc: -18.5, rx: 12, ry: 15, th1: 160},
  ];
  const plates = PLATE_E.map((q, k) => {
    const arc = ellArc(q.xc, q.yc, q.rx, q.ry, -25, q.th1);
    const fr = frillX(arc, -1, [0.8, 1.5], [2.6, 4.2], 51 + k * 7, {mode: 'scallop', sharp: 0.55, taper: 1.4});
    const outer = offset(arc, -(1.55 + 1.0));
    const st = arc[0], en = arc[arc.length - 1];
    return {
      edge: fr.pts,
      edgeD: line(fr.pts),
      shadow: line([...fr.pts, ...[...outer].reverse()]) + 'Z',
      fill: line([...fr.pts, pt(en.x - 2, 14), pt(-120, 14), pt(-120, -60), pt(st.x + 6, -60)]) + 'Z',
      flare: line([...fr.pts, ...[...offset(fr.pts, 0.55)].reverse()]) + 'Z',
    };
  });
  // finer growth lines between the plates (and on the youngest shell toward the bill)
  const lerpE = (a: Ell, b: Ell, u: number): Ell => ({xc: lerp(a.xc, b.xc, u), yc: lerp(a.yc, b.yc, u), rx: lerp(a.rx, b.rx, u), ry: lerp(a.ry, b.ry, u), th1: lerp(a.th1, b.th1, u)});
  const FINE_E: Ell[] = [
    {xc: 12, yc: -10.5, rx: 16, ry: 11.8, th1: 100},
    {xc: 20, yc: -8.5, rx: 15, ry: 9.6, th1: 100},
    lerpE(PLATE_E[0], PLATE_E[1], 0.4),
    lerpE(PLATE_E[0], PLATE_E[1], 0.75),
    lerpE(PLATE_E[1], PLATE_E[2], 0.45),
  ];
  const fine = FINE_E.map((q, k) => line(frillN(ellArc(q.xc, q.yc, q.rx, q.ry, -25, q.th1, 48), -1, [0.25, 0.6], [1.6, 2.8], 71 + k * 5, {mode: 'scallop', sharp: 0.7, taper: 1})));

  // --- the cement band seen from outside: a thin even layer under the whole attached base, its ends rounded
  const xa = XA - 0.55, xb = XB + 0.35;
  const cap = (x: number, dir: number) => {
    const t0 = bandTop(x), b0 = bandBot(x), m = (t0 + b0) / 2, hh = (b0 - t0) / 2;
    const out: P[] = [];
    for (let i = 1; i < 14; i++) {
      const th = -Math.PI / 2 + (i / 14) * Math.PI;
      out.push(pt(x + dir * 0.9 * hh * Math.cos(th), m + hh * Math.sin(th)));
    }
    return dir > 0 ? out : out.reverse();
  };
  const topEdge = bandLine(bandTop, xa, xb);
  const botEdge = bandLine(bandBot, xb, xa);
  const cemD = line([...topEdge, ...cap(xb, 1), ...botEdge, ...cap(xa, -1)]) + 'Z';

  // --- the silhouette's upper envelope (for the cast shadow and the particles' colour)
  const ENV_X0 = -42, ENV_ST = 0.25, ENV_N = Math.round((45 - ENV_X0) / ENV_ST);
  const env: number[] = [];
  for (let k = 0; k <= ENV_N; k++) {
    const x = ENV_X0 + k * ENV_ST;
    let m = Infinity;
    for (const ps of [lidPts, lvPts]) {
      for (let i = 0; i < ps.length; i++) {
        const a = ps[i], b = ps[(i + 1) % ps.length];
        if ((a.x - x) * (b.x - x) > 0 || a.x === b.x) continue;
        const y = a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x);
        if (y < m) m = y;
      }
    }
    env.push(m);
  }
  const topY = (x: number) => {
    const k = Math.round((x - ENV_X0) / ENV_ST);
    return k < 0 || k > ENV_N ? Infinity : env[k];
  };
  // the cast shadow on the rock: light from the upper left throws each point of the silhouette down and to the right
  const ground = (x: number) => bandBot(x);
  const sh: P[] = [];
  for (let x = -41; x <= 43; x += 0.5) {
    const y = topY(x);
    if (!isFinite(y)) continue;
    const h = Math.max(0, ground(x) - y);
    sh.push(pt(x + 1.9 * h, ground(x) + 0.21 * h));
  }
  const castD = line([pt(-41, ground(-41)), ...sh, pt(43.2, ground(43.2)), ...edge(43.2, -41, ground, 0.5)]) + 'Z';
  const creviceD = line([...LIFT, ...edge(XB, 42.4, (x) => bandBot(x) + 0.05, 0.3)]) + 'Z';
  const ligD = (() => {
    const lg = BEAK_TOP.slice(2, -3);
    return line([...lg, ...shift([...lg].reverse(), 0.3, 0.8)]) + 'Z';
  })();
  return {
    HL, UL, UV, lip, lipRim, edgeFace, lidD, lidPts, lidLam, lidTerr, lidFlutes, lvD, lvPts, plates, fine, billFlutes, underD, ligD,
    cemD, topEdge, botEdge: [...botEdge].reverse(), xa, xb, topY, castD, creviceD, LIFT,
  };
};
const OY = buildOyster();

/** faint purple-brown mottling on the lid */
const LID_MOTTLE = [
  {c: pt(27, -12.5), rx: 4.2, ry: 2.0, rot: -0.55, seed: 5},
  {c: pt(-6, -24.2), rx: 3.4, ry: 1.3, rot: -0.1, seed: 7},
  {c: pt(5, -17.5), rx: 3.0, ry: 1.2, rot: -0.3, seed: 11},
].map((m) => closed(blob(m.c, m.rx, m.ry, m.seed, 12, 0.32, m.rot), 1));
/** weathering on the lid: worn grey-brown and olive (algal) patches with ragged edges, each with a darker core */
const LID_WEATHER = [
  {c: pt(-21.5, -24.4), rx: 5.6, ry: 1.9, rot: -0.22, seed: 13, col: tint('#6E6E50', 0.06)},
  {c: pt(9.5, -21.2), rx: 6.4, ry: 2.4, rot: -0.36, seed: 17, col: tint('#6F6258', 0.05)},
  {c: pt(29.5, -9.6), rx: 3.6, ry: 2.3, rot: -0.75, seed: 23, col: tint('#706B4E', 0.06)},
].map((m) => ({
  d: closed(blob(m.c, m.rx, m.ry, m.seed, 18, 0.38, m.rot), 1),
  core: closed(blob(pt(m.c.x + 0.25 * m.rx * Math.cos(m.rot), m.c.y + 0.15 * m.ry), m.rx * 0.5, m.ry * 0.48, m.seed + 4, 12, 0.4, m.rot), 1),
  col: m.col,
}));
/** worn olive-grey and grey-brown patches on the lower valve (the oldest, hinge-end plate and the youngest shell; both
 *  kept out of the macro's view of the base) */
const LV_WEATHER = [
  {c: pt(-31.5, -9.5), rx: 4.6, ry: 2.1, rot: -0.5, seed: 29, col: tint('#6C6A50', 0.06)},
  {c: pt(13.5, -7.6), rx: 3.4, ry: 1.3, rot: -0.3, seed: 31, col: tint('#6B5F57', 0.05)},
].map((m) => ({d: closed(blob(m.c, m.rx, m.ry, m.seed, 16, 0.38, m.rot), 1), col: m.col}));
/** small barnacles settled on the lid (centre of the base, size mm, tilt deg with the local slope) */
const LID_BARNACLES = [
  {c: pt(-3.2, -25.0), s: 3.3, tilt: -7},
  {c: pt(19.6, -17.9), s: 2.4, tilt: 24},
];

// ------------------------------------------------------------------ the boulder (static)
/** the boulder's silhouette against the water: the crown's back edge, then the shaded right shoulder turning down to
 *  an undercut, dark underside inside the medium frame (the left flank runs out of frame) */
const ROCK_TOP = spline(
  [
    pt(-96, 87), pt(-84, 74), pt(-78, 60), pt(-65, 36), pt(-58, 23), pt(-52, 14), pt(-46, 6.5), pt(-39, 0.8), pt(-30, -3.8), pt(-17, -7.2), pt(0, -8.5),
    pt(15, -8.1), pt(27, -6.8), pt(36, -4.7), pt(41.5, -2.9), pt(45.2, -0.4), pt(47.6, 3.6), pt(48.9, 9), pt(49.4, 15), pt(49.3, 22), pt(48.4, 30),
    pt(46.3, 38), pt(43, 46), pt(38.4, 53.5), pt(32.6, 60), pt(26, 65.5), pt(19, 70), pt(12, 73.4), pt(4, 76.2), pt(-8, 78.6), pt(-24, 81.2), pt(-50, 84.8), pt(-78, 87.5),
  ],
  0.5,
);
const I_SH = ROCK_TOP.reduce((bi, p, i, a) => (p.x > a[bi].x ? i : bi), 0);
const ROCK_CROWN = ROCK_TOP.slice(0, I_SH + 1);
const ROCK_SIDE = ROCK_TOP.slice(I_SH);
const X_SH = ROCK_TOP[I_SH].x, Y_SH = ROCK_TOP[I_SH].y;
const SIDE_YX = ROCK_SIDE.map((p) => pt(p.y, p.x));
/** the crown's back silhouette y at x (no rock right of the shoulder) */
const crownY = (x: number) => (x > X_SH ? 1e4 : yOn(ROCK_CROWN, x));
/** the right flank's silhouette x at height y */
const sideX = (y: number) => (y <= Y_SH ? X_SH : yOn(SIDE_YX, y));
const ROCK_D = line(ROCK_TOP) + 'Z';
/** the brow: where the crown (seen a little from above) rounds over into the boulder's face; it runs into the right
 *  shoulder's silhouette */
const BROW = spline(
  [pt(-70, crownY(-70)), pt(-60, 27), pt(-50, 19.5), pt(-38, 14.6), pt(-24, 12.2), pt(-6, 11.3), pt(12, 11.6), pt(26, 12.4), pt(36, 13.6), pt(42.5, 15.4), pt(46.2, 17.9), pt(sideX(20.5), 20.5)],
  0.5,
);
const browY = (x: number) => yOn(BROW, x);
/** the crown's algal film (a crisp lower edge just over the brow) */
const CROWN_D = line([pt(-90, -40), pt(90, -40), ...[...BROW].reverse().map((p) => pt(p.x, p.y + 1.2))]) + 'Z';
/** the face's big form: a lit region under the crown on the left, a core shadow over the right shoulder and the lower
 *  face, and the dark undercut along the lower right */
const FACE_LIT = closed([pt(-84, 30), pt(-64, 25), pt(-48, 17.5), pt(-30, 13.8), pt(-10, 12.8), pt(6, 14), pt(14, 21), pt(10, 31), pt(-2, 41), pt(-20, 50), pt(-42, 58), pt(-64, 63), pt(-88, 66)], 0.8);
const FACE_SHADE = closed([pt(70, 12), pt(46.5, 19.5), pt(41.5, 25), pt(35.5, 33.5), pt(28, 43.5), pt(19, 53), pt(7, 61.5), pt(-12, 68.5), pt(-36, 74), pt(-64, 78), pt(-96, 80), pt(-96, 240), pt(70, 240)], 0.8);
/** the undercut: the boulder's underside, turned away from the light, where it sits down on the seabed */
const UNDER_D = line([
  ...ROCK_SIDE.filter((p) => p.y > 40),
  pt(-90, 90), pt(-78, 82.5), pt(-50, 79.6), pt(-24, 76.2), pt(-8, 73.6), pt(4, 70.8), pt(13.5, 67.2), pt(22, 62.2), pt(29, 56.5), pt(34.8, 50.3), pt(39.4, 44),
]) + 'Z';
/** fracture planes of the face: subtle value shifts with broken ink edges */
const FACETS: {ps: P[]; lit: boolean; a: number; edge: [number, number]}[] = [
  {ps: [pt(-54, 31), pt(-33, 24.5), pt(-17, 30), pt(-24, 44), pt(-47, 48)], lit: true, a: 0.34, edge: [2, 4]},
  {ps: [pt(17, 25), pt(33, 21), pt(43, 27), pt(37, 41), pt(23, 40)], lit: false, a: 0.32, edge: [2, 4]},
  {ps: [pt(-15, 55), pt(12, 50), pt(21, 62), pt(5, 74), pt(-17, 71)], lit: false, a: 0.24, edge: [1, 3]},
  {ps: [pt(-70, 60), pt(-48, 62), pt(-40, 76), pt(-60, 84), pt(-78, 78)], lit: true, a: 0.2, edge: [0, 2]},
  {ps: [pt(-12, 22), pt(4, 20), pt(10, 31), pt(0, 42), pt(-14, 36)], lit: true, a: 0.22, edge: [1, 3]},
];
const CRACKS: P[][] = [
  [pt(-47, 7.6), pt(-48.6, 11.6), pt(-46.4, 15.2)],
  [pt(8, 13.5), pt(6.4, 19), pt(9, 25), pt(7, 32), pt(10.4, 40), pt(8.6, 48), pt(12, 57), pt(10.2, 66), pt(13.6, 76), pt(11.8, 88), pt(14, 98)],
  [pt(9, 25), pt(14, 29), pt(18.4, 28), pt(22, 32)],
  [pt(-38, 40), pt(-41, 46), pt(-38.6, 52), pt(-42, 60), pt(-40, 68)],
  [pt(27, 48), pt(29.4, 53), pt(27.6, 58)],
];
const PITS = [pt(-58, 44), pt(-24, 26), pt(18, 22), pt(36, 30), pt(-20, 64), pt(16, 76), pt(-50, 76), pt(30, 47), pt(-8, 22.6), pt(-31, 47), pt(-4, 62), pt(4, 82)];
/** where the crown's film is broken: angular facets (lit / shaded planes) and patches of bare grey rock. The first
 *  patch is the grazed halo around the oyster's foot (its upper part is hidden behind the shell). */
const CROWN_FACETS: {ps: P[]; lit: boolean}[] = [
  {ps: [pt(-47, 13.2), pt(-40.5, 12.4), pt(-38, 15.2), pt(-44.5, 16.8)], lit: true},
  {ps: [pt(-37.5, 6.4), pt(-32.4, 7.2), pt(-31.6, 9.8), pt(-36.8, 10.6)], lit: false},
  {ps: [pt(-16, 7.9), pt(-8.5, 7.3), pt(-6.4, 9.8), pt(-13.8, 10.5)], lit: true},
  {ps: [pt(1.5, 8.4), pt(8.2, 8.8), pt(7.4, 10.7), pt(0.6, 10.4)], lit: false},
  {ps: [pt(22.5, 8.6), pt(30, 7.6), pt(33, 10.4), pt(25.2, 11.6)], lit: true},
  {ps: [pt(43.2, 13.6), pt(47.2, 12.8), pt(47.6, 17.2), pt(44.6, 17.8)], lit: false},
  {ps: [pt(-55, 15.5), pt(-51, 14.8), pt(-49.6, 18.4), pt(-54.4, 19.6)], lit: false},
];
/** subdivide a polygon's edges and jitter them a little (rock breaks are ragged, not tiles) */
const ragged = (ps: P[], amp: number, seed: number, step = 1.4): P[] => {
  const out: P[] = [];
  ps.forEach((a, i) => {
    const b = ps[(i + 1) % ps.length];
    const L = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(1, Math.round(L / step));
    const nv = perp(nrm(sub(b, a)));
    for (let k = 0; k < n; k++) {
      const u = k / n, j = k === 0 ? 0 : (hash(seed * 13.7 + i * 3.1 + k * 1.7) - 0.5) * 2 * amp;
      out.push(add(pt(lerp(a.x, b.x, u), lerp(a.y, b.y, u)), mul(nv, j)));
    }
  });
  return out;
};
const BARE: P[][] = [
  [pt(-35.5, -0.6), pt(-34.6, 2.6), pt(-29.5, 4.3), pt(-23, 3.9), pt(-18, 5.5), pt(-10.5, 5.0), pt(-4.5, 6.5), pt(2.5, 5.8), pt(8.5, 7.2), pt(15, 6.1), pt(21.5, 6.9), pt(28, 5.2), pt(34, 6.0), pt(39.5, 4.3), pt(44.2, 2.9), pt(45.1, 0.1), pt(42, -2.6), pt(20, -4.5), pt(-10, -5), pt(-33, -3)],
  [pt(-50.5, 7.8), pt(-46, 6.0), pt(-41.5, 8.4), pt(-42.6, 11.8), pt(-48.2, 12.6)],
  [pt(-30, 7.3), pt(-24.5, 6.7), pt(-21.8, 9.2), pt(-26.4, 10.6)],
  [pt(10.5, 9.0), pt(17.5, 8.4), pt(19.8, 10.6), pt(13.2, 11.2)],
  [pt(36.5, 9.2), pt(41.6, 8.2), pt(43.8, 11.4), pt(40.2, 13.0), pt(36.8, 12.0)],
];
/** encrusting life (all away from the attachment, so the push lands on clean rock) */
const BARNACLES: {c: P; s: number; tilt: number}[] = [
  {c: pt(-43.6, 6.6), s: 4.2, tilt: -12},
  {c: pt(-48.4, 9.6), s: 3.1, tilt: -20},
  {c: pt(-40.0, 9.4), s: 2.6, tilt: -6},
  {c: pt(45.4, 7.6), s: 3.2, tilt: 14},
  {c: pt(41.2, 14.6), s: 2.4, tilt: 8},
  {c: pt(30.5, 22.6), s: 2.8, tilt: 6},
  {c: pt(-21.5, 21.2), s: 2.4, tilt: -4},
];
const CORALLINE: {c: P; rx: number; ry: number; rot: number; seed: number}[] = [
  {c: pt(-30, 34), rx: 6.5, ry: 2.6, rot: -0.12, seed: 1},
  {c: pt(20, 45), rx: 6.4, ry: 2.8, rot: 0.04, seed: 2},
  {c: pt(-46, 70), rx: 7.0, ry: 3.2, rot: 0.1, seed: 3},
  {c: pt(2, 66), rx: 5.0, ry: 2.6, rot: 0.2, seed: 4},
];

// ------------------------------------------------------------------ what is behind a point (for the particles' colour)
/** depth (mm, > 0 inside) of world point p (depth 0) in the rock or the shell */
const solidDepth = (p: P) => {
  const r = Math.min(p.y - crownY(p.x), sideX(p.y) - p.x);
  const o = p.y - OY.topY(p.x);
  return Math.max(r, isFinite(o) ? o : -1e4);
};
/** 0 = open water behind p, 1 = shell or rock; blended over w mm (a little horizontal smoothing too) */
const solidAt = (p: P, w: number) => {
  let s = 0;
  for (const dx of [-w, 0, w]) s += ss(solidDepth(pt(p.x + dx, p.y)), -w, w);
  return s / 3;
};

// ------------------------------------------------------------------ the water: a steady current plus one surge
const SURGE: [number, number] = [8.45, 9.45];
const SURGE_MM = 40;
/** one frame (s): particle streaks follow the motion over the last frame */
const DT = 1 / 30;
/** streaks never tilt more than this from the flow (deg) */
const STREAK_MAX = 18;
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
const flowCells = (t: number) => 0.8 * (t - 8) + 0.06 * Math.sin(0.9 * t) + 1.5 * surgeD(t);
/** a streak's angle (deg) from its motion over the last frame, held near the flow direction */
const streakAng = (p: P, q: P) => clamp((Math.atan2(p.y - q.y, Math.max(1e-6, p.x - q.x)) * 180) / Math.PI, -STREAK_MAX, STREAK_MAX);

type Motes = {z: number; cell: number; dens: number; r: [number, number]; a: number; seed: number; blurK: number; maxBlur: number; color: string};
const FAR_MOTES: Motes[] = [
  {z: 300, cell: 16, dens: 0.38, r: [0.9, 1.7], a: 0.42, seed: 1, blurK: 9, maxBlur: 6, color: mix(K.mote, C.seaLit, 0.45)},
  {z: 130, cell: 12, dens: 0.32, r: [0.5, 0.95], a: 0.5, seed: 2, blurK: 9, maxBlur: 5, color: mix(K.mote, C.seaLit, 0.25)},
  {z: 45, cell: 10, dens: 0.28, r: [0.3, 0.6], a: 0.6, seed: 3, blurK: 8, maxBlur: 4, color: K.mote},
];
/** particles at a fixed depth behind the oyster (seen over open water in the wider framings) */
const MoteField: React.FC<{t: number; cam: Cam; m: Motes}> = ({t, cam, m}) => {
  const [x0, y0, x1, y1] = viewRect(cam, m.z, 1.12);
  const u = flowMM(t), u1 = flowMM(t - DT);
  const se = surgeE(t);
  const out: React.ReactNode[] = [];
  const i0 = Math.floor((x0 - u) / m.cell) - 2, i1 = Math.ceil((x1 - u) / m.cell) + 2;
  const j0 = Math.floor(y0 / m.cell) - 1, j1 = Math.ceil(y1 / m.cell) + 1;
  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) {
      const h = hash(i * 12.9898 + j * 78.233 + m.seed * 37.719);
      if (h > m.dens) continue;
      const hx = hash(h * 91.7 + 1.3), hy = hash(h * 53.1 + 2.7), hr = hash(h * 17.3 + 5.1), hp = hash(h * 29.9 + 0.3);
      const pos = (tt: number, uu: number) =>
        pt((i + hx) * m.cell + uu + 1.1 * Math.sin(0.8 * tt + hp * TAU), (j + hy) * m.cell + 0.9 * Math.sin(0.62 * tt + hp * 9.1) + 0.6 * noise1(tt * 0.7 + hp * 10, m.seed));
      const p = pos(t, u);
      if (p.x < x0 || p.x > x1 || p.y < y0 || p.y > y1) continue;
      const ang = streakAng(p, pos(t - DT, u1));
      const r = lerp(m.r[0], m.r[1], hr);
      const st = 1.35 + 3.0 * se;
      out.push(
        <ellipse key={`${i}_${j}`} cx={f(p.x)} cy={f(p.y)} rx={f(r * st)} ry={f(r * (0.8 - 0.2 * se))} transform={`rotate(${f(ang)} ${f(p.x)} ${f(p.y)})`} fill={m.color} opacity={f(m.a * (0.55 + 0.45 * hr))} />,
      );
    }
  }
  return <>{out}</>;
};

/** suspended particles near the subject at any zoom: octaves of cells (each 1/3 the last), each drawn while its cells
 *  are near `target` px on screen, drifting `flowCells` cells per unit, so the stream looks the same at every scale
 *  and the push carries the camera through it. Light motes over open water, dark silt over shell and rock. */
type AField = {c0: number; target: number; dens: number; r: [number, number]; a: number; seed: number; soft?: boolean};
const NEAR_FIELD: AField = {c0: 162, target: 130, dens: 0.82, r: [0.022, 0.046], a: 0.85, seed: 11};
const FORE_FIELD: AField = {c0: 162, target: 320, dens: 0.34, r: [0.026, 0.058], a: 0.5, seed: 23, soft: true};
const AdaptiveMotes: React.FC<{id: string; t: number; cam: Cam; z: number; F: AField; reveal?: number}> = ({id, t, cam, z, F, reveal = 0}) => {
  const s = layerScale(cam, z);
  // the open window is a diagram of the section: particles over it are kept faint so the band reads clean
  const wr = OY_WIN.r * (1 - Math.pow(1 - clamp(reveal), 1.6));
  const [x0, y0, x1, y1] = viewRect(cam, z, 1.1);
  const ph = flowCells(t), ph1 = flowCells(t - DT), se = surgeE(t);
  const wmm = 22 * mmPx(cam);
  const out: React.ReactNode[] = [];
  for (let o = 0; o < 9; o++) {
    const cell = F.c0 / Math.pow(3, o);
    const g = Math.log((cell * s) / F.target) / Math.log(3);
    const wgt = 1 - ss(Math.abs(g), 0.3, 1.0);
    if (wgt < 0.02) continue;
    const u = ph * cell, u1 = ph1 * cell;
    const i0 = Math.floor((x0 - u) / cell) - 2, i1 = Math.ceil((x1 - u) / cell) + 1;
    const j0 = Math.floor(y0 / cell) - 1, j1 = Math.ceil(y1 / cell) + 1;
    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) {
        const h = hash(i * 12.9898 + j * 78.233 + (F.seed + o * 7.31) * 37.719);
        if (h > F.dens) continue;
        const hx = hash(h * 91.7 + 1.3), hy = hash(h * 53.1 + 2.7), hr = hash(h * 17.3 + 5.1), hp = hash(h * 29.9 + 0.3);
        const pos = (tt: number, uu: number) =>
          pt((i + hx) * cell + uu + 0.07 * cell * Math.sin(0.8 * tt + hp * TAU), (j + hy) * cell + 0.06 * cell * Math.sin(0.62 * tt + hp * 9.1) + 0.04 * cell * Math.sin(TAU * surgeD(tt) + hp * 6));
        const p = pos(t, u);
        if (p.x < x0 || p.x > x1 || p.y < y0 || p.y > y1) continue;
        const ang = streakAng(p, pos(t - DT, u1));
        const p0 = z === 0 ? p : toWorld(cam, toScreen(cam, p, z), 0);
        const sol = solidAt(p0, wmm);
        const r = lerp(F.r[0], F.r[1], hr) * cell;
        const st = 1.3 + 2.6 * se;
        const inWin = wr > 0 ? ss(wr - Math.hypot(p0.x - OY_WIN.c.x, p0.y - OY_WIN.c.y), -0.05 * wr, 0.05 * wr) : 0;
        const a = F.a * wgt * (0.5 + 0.5 * hr) * (1 - 0.72 * inWin * clamp(reveal));
        const el = (fill: string, op: number, k: string) => (
          <ellipse key={k} cx={f(p.x)} cy={f(p.y)} rx={f(r * st)} ry={f(r * (0.85 - 0.25 * se))} transform={`rotate(${f(ang)} ${f(p.x)} ${f(p.y)})`} fill={fill} opacity={f(op)} />
        );
        if (F.soft) {
          if (sol < 0.98) out.push(el(`url(#${id}-dl)`, a * (1 - sol), `l${o}_${i}_${j}`));
          if (sol > 0.02) out.push(el(`url(#${id}-dd)`, a * sol * 0.8, `d${o}_${i}_${j}`));
        } else out.push(el(mix(K.mote, K.moteDark, sol), a * (1 - 0.18 * sol), `${o}_${i}_${j}`));
      }
    }
  }
  return (
    <>
      {F.soft && (
        <defs>
          {[['dl', K.mote], ['dd', K.moteDark]].map(([k, c]) => (
            <radialGradient key={k} id={`${id}-${k}`}>
              <stop offset="0" stopColor={c} stopOpacity={0.95} />
              <stop offset="0.45" stopColor={c} stopOpacity={0.55} />
              <stop offset="1" stopColor={c} stopOpacity={0} />
            </radialGradient>
          ))}
        </defs>
      )}
      {out}
    </>
  );
};

/** large soft flecks drifting past right in front of the lens, left to right (screen space, ~4 per second at
 *  400-600 px/s, 8.4-10.1 s); light over open water, dark silt over shell and rock */
const Flecks: React.FC<{id: string; t: number; cam: Cam}> = ({id, t, cam}) => {
  const env = ss(t, 8.36, 8.56) * (1 - ss(t, 9.94, 10.12));
  if (env < 0.005) return null;
  const rate = 4, T0 = 5.2, n = Math.ceil((10.2 - T0) * rate);
  const wmm = 40 * mmPx(cam);
  const out: React.ReactNode[] = [];
  for (let k = 0; k < n; k++) {
    const h1 = hash(k * 3.17 + 0.5), h2 = hash(k * 7.31 + 1.1), h3 = hash(k * 1.93 + 2.7), h4 = hash(k * 5.77 + 3.3), h5 = hash(k * 2.41 + 4.4);
    const ts = T0 + (k + 0.7 * (h1 - 0.5)) / rate;
    const v = 400 + 200 * h2;
    const R = 16 + 30 * h3 * h3;
    const age = t - ts;
    const x = -3 * R + v * age;
    if (x < -3 * R || x > W + 3 * R) continue;
    const y = 140 + 1640 * h4 + 24 * Math.sin(1.4 * age + k) + 28 * (h5 - 0.5) * age;
    const sol = solidAt(toWorld(cam, pt(x, y), 0), wmm);
    const a = env * (0.32 + 0.24 * h5);
    out.push(
      <g key={k}>
        {sol < 0.98 && <ellipse cx={f(x)} cy={f(y)} rx={f(R * 1.7)} ry={f(R)} fill={`url(#${id}-l)`} opacity={f(a * (1 - sol))} />}
        {sol > 0.02 && <ellipse cx={f(x)} cy={f(y)} rx={f(R * 1.7)} ry={f(R)} fill={`url(#${id}-d)`} opacity={f(a * sol * 0.8)} />}
      </g>,
    );
  }
  return (
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        {[['l', '#EAFFFA'], ['d', K.moteDark]].map(([k, c]) => (
          <radialGradient key={k} id={`${id}-${k}`}>
            <stop offset="0" stopColor={c} stopOpacity={0.85} />
            <stop offset="0.4" stopColor={c} stopOpacity={0.5} />
            <stop offset="1" stopColor={c} stopOpacity={0} />
          </radialGradient>
        ))}
      </defs>
      {out}
    </svg>
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
  // a medium-shot event: it would read as a smudge on the shell in the macro
  const zf = ss(cam.w, 20, 42);
  if (t < SURGE[0] || t > 10.8 || zf < 0.01) return null;
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
    const lift = (4 + 10 * h3) * (1 - Math.exp(-age / 0.35)) + 1.2 * Math.sin(3.1 * age + i);
    const x = x0 + carry + 1.2 * Math.sin(4.3 * age + i * 1.7);
    const y = ys - lift;
    const rr = lerp(r[0], r[1], hash(i * 4.7 + seed)) * (1 + 0.8 * age);
    if (x < vx0 - rr * 3 || x > vx1 + rr * 3 || y < vy0 - rr * 3 || y > vy1 + rr * 3) continue;
    const op = zf * a * ss(age, 0, 0.18) * (1 - ss(t, 9.5, 10.4)) * (0.5 + 0.5 * hash(i * 9.1 + seed));
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

/** a torn scrap of weed (a ragged leaf), inked */
const scrapD = (L: number, Wd: number, seed: number) =>
  `M${f(-L / 2)} 0Q${f(-L * 0.12)} ${f(-Wd)} ${f(L * 0.42)} ${f(-Wd * 0.35)}L${f(L / 2)} ${f(-Wd * (0.05 + 0.2 * hash(seed)))}L${f(L * 0.44)} ${f(Wd * 0.1)}L${f(L * 0.5)} ${f(Wd * 0.35)}Q${f(L * 0.05)} ${f(Wd * 0.95)} ${f(-L / 2)} 0Z`;
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
    const y = lerp(ys[0], ys[1], h) + 6 * Math.sin(TAU * (0.8 * u + h2)) - 4 * Math.sin(Math.PI * u);
    const ang = (h2 * 360 + 520 * u * (h > 0.5 ? 1 : -1)) % 360;
    const L = size * (0.7 + 0.6 * h);
    out.push(
      <g key={i} transform={`translate(${f(x)} ${f(y)}) rotate(${f(ang)}) scale(1 ${f(0.55 + 0.45 * Math.cos(TAU * 1.3 * u + h * 6))})`}>
        <Inked w={iw * 0.7}>
          <InkPath d={scrapD(L, L * 0.3, i + seed)} fill={i % 2 ? K.weed : mix(K.weed, K.weedLit, 0.4)} />
        </Inked>
      </g>,
    );
  }
  return <>{out}</>;
};
/** in the macro: a few scraps of weed drifting slowly across the base, left to right, above and below the window */
const SCRAPS = [
  {x: -2.7, y: 6.1, v: 2.2, L: 1.45, seed: 1, ang: 18, spin: -34},
  {x: 0.6, y: -6.4, v: 1.8, L: 1.15, seed: 2, ang: -26, spin: 28},
  {x: 3.0, y: 6.95, v: 2.5, L: 1.0, seed: 3, ang: 64, spin: 40},
  {x: -3.9, y: -6.9, v: 2.1, L: 0.9, seed: 4, ang: 120, spin: -22},
];
const Scraps: React.FC<{t: number; iw: number; lw: number}> = ({t, iw, lw}) => {
  const env = ss(t, 8.95, 9.3);
  if (env < 0.01 || t > 10.7) return null;
  return (
    <g opacity={f(env)}>
      {SCRAPS.map((s, i) => {
        const dt = t - 9.8;
        const x = s.x + s.v * dt + 0.12 * Math.sin(1.7 * t + i);
        const y = s.y + 0.16 * Math.sin(2.1 * t + i * 2.3);
        const ang = s.ang + s.spin * dt + 12 * Math.sin(1.3 * t + i);
        const L = s.L, Wd = L * 0.34;
        return (
          <g key={i} transform={`translate(${f(x)} ${f(y)}) rotate(${f(ang)}) scale(1 ${f(0.75 + 0.25 * Math.cos(1.6 * t + i * 2))})`}>
            <Inked w={iw * 0.75}>
              <InkPath d={scrapD(L, Wd, s.seed)} fill={i % 2 ? K.weed : mix(K.weed, K.weedLit, 0.35)} />
              <Deco>
                <path d={`M${f(-L * 0.42)} ${f(Wd * 0.02)}Q${f(0)} ${f(-Wd * 0.25)} ${f(L * 0.4)} ${f(-Wd * 0.18)}`} fill="none" stroke={K.weedLit} strokeWidth={f(lw * 1.1)} strokeLinecap="round" opacity={0.7} />
                <path d={`M${f(-L * 0.35)} ${f(Wd * 0.3)}Q${f(L * 0.05)} ${f(Wd * 0.7)} ${f(L * 0.42)} ${f(Wd * 0.25)}`} fill="none" stroke={K.weedDeep} strokeWidth={f(lw * 1.6)} strokeLinecap="round" opacity={0.45} />
              </Deco>
            </Inked>
          </g>
        );
      })}
    </g>
  );
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

/** the rock surface near the oyster's foot at close range: crisp angular facets, pits and mineral flecks (dark mica,
 *  pale quartz, tan feldspar) at two scales, so the macro reads as hard granite (no blur) */
const MacroRock: React.FC<{cam: Cam; lw: number}> = ({cam, lw}) => {
  const s = layerScale(cam, 0);
  const [x0, y0, x1, y1] = viewRect(cam, 0, 1.05);
  const out: React.ReactNode[] = [];
  const CELLS = [2.4, 0.8, 0.27];
  CELLS.forEach((cell, o) => {
    const g = Math.log((cell * s) / 170) / Math.log(3);
    const wgt = 1 - ss(Math.abs(g), 0.35, 1.0);
    if (wgt < 0.03) return;
    const xa = Math.max(x0, -16), xb = Math.min(x1, 16), ya = Math.max(y0, -2), yb = Math.min(y1, 15);
    if (xa >= xb || ya >= yb) return;
    for (let i = Math.floor(xa / cell) - 1; i <= Math.ceil(xb / cell); i++) {
      for (let j = Math.floor(ya / cell) - 1; j <= Math.ceil(yb / cell); j++) {
        const h = hash(i * 23.17 + j * 41.31 + o * 9.77 + 0.3);
        const c = pt((i + 0.2 + 0.6 * hash(h * 5.1)) * cell, (j + 0.2 + 0.6 * hash(h * 8.3)) * cell);
        if (c.y < bandBot(c.x) + 0.35 * cell || c.y > browY(c.x) - 0.3 * cell) continue;
        const key = `${o}_${i}_${j}`;
        if (h < 0.55) {
          // an angular facet: a flat plane catching more or less light, one or two edges inked
          const n = 4 + Math.floor(hash(h * 2.3) * 3);
          const sz = 0.55 + 0.7 * hash(h * 19.1);
          const ps: P[] = [];
          for (let q = 0; q < n; q++) {
            const a = (q / n) * TAU + h * 4 + (hash(h * 5 + q) - 0.5) * 0.8;
            const rr = cell * sz * (0.28 + 0.18 * hash(h * 13 + q * 1.9));
            ps.push(pt(c.x + Math.cos(a) * rr * 1.3, c.y + Math.sin(a) * rr * 0.75));
          }
          const rg = ragged(ps, cell * 0.03, h * 100, cell * 0.1);
          const lit = hash(h * 3.7) < 0.55;
          const e0 = Math.floor(hash(h * 6.1) * n);
          out.push(
            <g key={key} opacity={f(wgt)}>
              <path d={line(rg) + 'Z'} fill={lit ? K.bareLit : K.bareDeep} opacity={lit ? 0.5 : 0.36} />
              <path d={line([ps[e0], ps[(e0 + 1) % n]])} fill="none" stroke={lit ? mix(K.bareDeep, INK, 0.3) : K.bareLit} strokeWidth={f(lw * 0.9)} strokeLinecap="round" opacity={0.5} />
            </g>,
          );
        }
        // a pit (dark, its lower-right rim catching light) or mineral flecks
        const hp = hash(h * 17.9 + 2.2);
        if (hp < 0.35) {
          const r = cell * (0.05 + 0.05 * hash(h * 21.3));
          const p = pt(c.x + (hash(h * 2.9) - 0.5) * cell * 0.6, c.y + (hash(h * 4.4) - 0.5) * cell * 0.6);
          out.push(
            <g key={`p${key}`} opacity={f(wgt)}>
              <ellipse cx={f(p.x + 0.25 * r)} cy={f(p.y + 0.3 * r)} rx={f(r * 1.15)} ry={f(r * 0.8)} fill={K.bareLit} opacity={0.7} />
              <ellipse cx={f(p.x)} cy={f(p.y)} rx={f(r)} ry={f(r * 0.65)} fill={mix(K.bareDeep, INK, 0.45)} opacity={0.85} />
            </g>,
          );
        } else {
          for (let q = 0; q < 3; q++) {
            const hq = hash(h * 31.7 + q * 7.3);
            if (hq > 0.75) continue;
            const p = pt(c.x + (hash(hq * 3.1) - 0.5) * cell * 0.9, c.y + (hash(hq * 5.3) - 0.5) * cell * 0.9);
            const r = cell * (0.025 + 0.04 * hash(hq * 7.7));
            const col = hq < 0.35 ? '#4E4B48' : hq < 0.55 ? '#D2CFC6' : '#B39B80';
            out.push(<ellipse key={`f${key}_${q}`} cx={f(p.x)} cy={f(p.y)} rx={f(r * 1.3)} ry={f(r * 0.85)} transform={`rotate(${f(hq * 180)} ${f(p.x)} ${f(p.y)})`} fill={col} opacity={f(wgt * 0.85)} />);
          }
        }
      }
    }
  });
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

/** a small top shell (a sea snail): an inked cone with whorl bands, lit from the upper left */
const ConeShell: React.FC<{c: P; s: number; tilt: number; iw: number; lw: number}> = ({c, s, tilt, iw, lw}) => {
  const h = s, b = s * 0.56;
  const body = `M${f(-b)} 0Q${f(-b * 0.92)} ${f(-h * 0.38)} ${f(-b * 0.42)} ${f(-h * 0.66)}L${f(-b * 0.06)} ${f(-h)}L${f(b * 0.08)} ${f(-h * 0.99)}L${f(b * 0.46)} ${f(-h * 0.64)}Q${f(b * 0.94)} ${f(-h * 0.36)} ${f(b)} 0Q0 ${f(s * 0.18)} ${f(-b)} 0Z`;
  const bands = [0.24, 0.48, 0.7].map((k) => {
    const y = -h * k, half = b * (1 - k * 0.92);
    return `M${f(-half)} ${f(y + h * 0.05)}Q0 ${f(y + h * 0.12)} ${f(half)} ${f(y - h * 0.03)}`;
  });
  return (
    <g transform={`translate(${f(c.x)} ${f(c.y)}) rotate(${f(tilt)})`}>
      <Inked w={iw * 0.8}>
        <InkPath d={body} fill={K.cone} />
        <Deco>
          <path d={`M${f(b * 0.08)} ${f(-h * 0.99)}L${f(b * 0.46)} ${f(-h * 0.64)}Q${f(b * 0.94)} ${f(-h * 0.36)} ${f(b)} 0Q${f(b * 0.5)} ${f(s * 0.12)} ${f(b * 0.15)} ${f(s * 0.1)}Z`} fill={K.coneDeep} opacity={0.45} />
          <path d={`M${f(-b * 0.7)} ${f(-h * 0.3)}Q${f(-b * 0.55)} ${f(-h * 0.55)} ${f(-b * 0.25)} ${f(-h * 0.75)}`} fill="none" stroke={K.coneLit} strokeWidth={f(lw * 1.6)} strokeLinecap="round" opacity={0.8} />
          {bands.map((d, i) => (
            <path key={i} d={d} fill="none" stroke={INK} strokeWidth={f(lw * 0.9)} strokeLinecap="round" opacity={0.55} />
          ))}
          <ellipse cx={f(-b * 0.15)} cy={f(s * 0.04)} rx={f(b * 0.28)} ry={f(s * 0.06)} fill={K.coneDeep} opacity={0.7} />
        </Deco>
      </Inked>
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
        <radialGradient id={`${id}-rs`} gradientUnits="userSpaceOnUse" cx="-14" cy="14" r="90" fx="-24" fy="2">
          <stop offset="0" stopColor={C.seaDeep} stopOpacity={0} />
          <stop offset="0.55" stopColor={C.seaDeep} stopOpacity={0} />
          <stop offset="0.86" stopColor={C.seaDeep} stopOpacity={0.3} />
          <stop offset="1" stopColor={C.seaDeep} stopOpacity={0.52} />
        </radialGradient>
        {/* the crown: lit from the upper left, a film of algae */}
        <linearGradient id={`${id}-tp`} gradientUnits="userSpaceOnUse" x1="-60" y1="-4" x2="56" y2="16">
          <stop offset="0" stopColor={K.filmLit} />
          <stop offset="0.5" stopColor={K.film} />
          <stop offset="1" stopColor={mix(K.film, K.filmDeep, 0.6)} />
        </linearGradient>
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
            {/* the undercut: the boulder's underside turned away from the light, down to the seabed */}
            <path d={UNDER_D} fill={mix(K.rockDeep, K.under, 0.6)} opacity={0.82} />
            {/* light bounced up from the seabed along the rounded flank */}
            <path d={open(ROCK_SIDE.filter((p) => p.y > 14 && p.y < 66).map((p) => pt(p.x - 1.3, p.y - 0.4)), 1)} fill="none" stroke={mix(K.rockLit, C.seaLit, 0.5)} strokeWidth="1.8" strokeLinecap="round" opacity={0.3} />
            {CORALLINE.map((q, i) => (
              <Coralline key={`c${i}`} {...q} />
            ))}
            {CRACKS.slice(1).map((c, i) => (
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
        {/* the crown and its film of algae (a crisp edge over the brow) */}
        <path d={CROWN_D} fill={`url(#${id}-tp)`} />
        <InkLine d={open(BROW.filter((p) => p.x > -60).map((p) => pt(p.x, p.y + 1.2)), 1)} w={lw * 0.8} opacity={0.3} color={K.filmDeep} />
        {/* the film is broken: angular facets and bare grey rock */}
        {CROWN_FACETS.map((q, i) => (
          <g key={`cf${i}`}>
            <path d={line(ragged(q.ps, 0.35, i + 3)) + 'Z'} fill={q.lit ? K.filmLit : K.filmDeep} opacity={q.lit ? 0.55 : 0.4} />
            <InkLine d={line(q.ps.slice(1, 3))} w={lw * 0.8} opacity={0.45} />
          </g>
        ))}
        {BARE.map((ps, i) => (
          <g key={`b${i}`}>
            <path d={line(ragged(ps, 0.4, i + 11)) + 'Z'} fill={K.bare} />
            <path d={line(ragged(ps, 0.4, i + 11).slice(0, Math.ceil(ragged(ps, 0.4, i + 11).length / 2)))} fill="none" stroke={K.bareLit} strokeWidth={f(lw * 1.4)} opacity={0.55} strokeLinejoin="round" />
          </g>
        ))}
        <RockSpeckle cam={cam} />
        <MacroRock cam={cam} lw={lw} />
        {CRACKS.slice(0, 1).map((c, i) => (
          <path key={`kc${i}`} d={open(c, 0.6)} fill="none" stroke={mix(K.filmDeep, C.seaDeep, 0.5)} strokeWidth={f(lw * 1.3)} strokeLinecap="round" opacity={0.8} />
        ))}
        {/* a cool rim of light from the water along the shaded right shoulder */}
        <path d={line(ROCK_TOP.filter((p) => p.x > 38 && p.y < 30))} fill="none" stroke={C.seaLit} strokeWidth="2.2" opacity={0.22} />
      </g>
    </>
  );
};

/** encrusting animals on the rock (drawn over the rock, under the oyster) */
const Encrusters: React.FC<{iw: number; lw: number}> = ({iw, lw}) => (
  <>
    <ConeShell c={pt(-14, 47)} s={4.2} tilt={-8} iw={iw} lw={lw} />
    <Sponge c={pt(13, 56.5)} rx={7.5} ry={3.8} iw={iw} />
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
          <path d={loops.join('')} fill="none" stroke={K.caustic} strokeWidth="0.45" strokeLinejoin="round" opacity={0.22} />
        </g>
      </g>
    </>
  );
};

// ------------------------------------------------------------------ the oyster
/** shadows on the rock: the crisp cast shadow down and to the right of the oyster, the crevice under the lifted
 *  margin, and the occlusion just under the cement's contact edge (blur capped at ~2.5 screen px) */
const Shadows: React.FC<{id: string; cam: Cam}> = ({id, cam}) => {
  const E = OY.botEdge;
  const sb = Math.min(2.5 * mmPx(cam), 0.35);
  return (
    <>
      <defs>
        <clipPath id={`${id}-rk`}>
          <path d={ROCK_D} />
        </clipPath>
        <filter id={`${id}-sb`} filterUnits="userSpaceOnUse" {...fbox(cam, -45, -14, 100, 24)}>
          <feGaussianBlur stdDeviation={f(sb)} />
        </filter>
      </defs>
      <g clipPath={`url(#${id}-rk)`}>
        <path d={OY.castD} fill={mix(K.shadow, K.rockDeep, 0.35)} opacity={0.38} />
      </g>
      <path d={OY.creviceD} fill={K.shadow} opacity={0.62} filter={`url(#${id}-sb)`} />
      <path d={line([...shift(E, 0, 0.02), ...shift([...E].reverse(), 0.15, 0.45)]) + 'Z'} fill={K.shadow} opacity={0.3} filter={`url(#${id}-sb)`} />
    </>
  );
};

/** the cement's look (shared by the outside view and the window, so the band does not change when the window opens):
 *  one even tone, a narrow shade along each edge (≤ 7 screen px) and one bright streak a little below the middle,
 *  where the bone glue carries its own highlight */
const CEMENT_STREAK = 0.66;
const CementLook: React.FC<{x0: number; x1: number; px: number}> = ({x0, x1, px}) => {
  const h = FIT.h;
  const eS = Math.min(0.2 * h, 7 * px);
  const top = bandLine(bandTop, x0, x1), bot = bandLine(bandBot, x0, x1);
  const topShade = line([...top, ...[...top].reverse().map((p) => pt(p.x, p.y + eS))]) + 'Z';
  const botShade = line([...bot, ...[...bot].reverse().map((p) => pt(p.x, p.y - eS))]) + 'Z';
  const streak = runs(bandLine((x) => lerp(bandTop(x), bandBot(x), CEMENT_STREAK), x0 + 0.3, x1 - 0.3), (p) => noise1(p.x * 0.5 + 3.3, 21) > -0.45);
  const sw = Math.max(0.075 * h, 1.8 * px);
  return (
    <>
      <path d={topShade} fill={K.cementShade} opacity={0.5} />
      <path d={botShade} fill={K.cementShade} opacity={0.72} />
      {streak.map((sg, i) => (
        <path key={i} d={line(sg)} fill="none" stroke={K.cementLit} strokeWidth={f(sw)} strokeLinecap="round" opacity={0.95} />
      ))}
    </>
  );
};

/** the cement band as seen from outside: a thin pale layer between shell and rock, its ends rounded */
const CementOutside: React.FC<{id: string; iw: number; px: number}> = ({id, iw, px}) => (
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
          <CementLook x0={OY.xa - 1} x1={OY.xb + 1} px={px} />
        </g>
      </Deco>
    </Inked>
  </>
);

/** the oyster (cupped lower valve + lid); the cement band is drawn over the valve's base */
const Oyster: React.FC<{id: string; iw: number; lw: number; px: number}> = ({id, iw, lw, px}) => {
  const {lvD, lidD, plates, lidLam, lip} = OY;
  const plateTone = [mix(K.shMid, K.shPurple, 0.22), mix(K.shMid, K.shPale, 0.35), mix(K.shPale, K.shLit, 0.25)];
  const near = ss(1 / px, 4, 12); // fine detail that only matters in the closer framings
  return (
    <>
      <defs>
        <linearGradient id={`${id}-lv`} gradientUnits="userSpaceOnUse" x1="-40" y1="-22" x2="34" y2="4">
          <stop offset="0" stopColor={K.shPale} />
          <stop offset="0.45" stopColor={K.shMid} />
          <stop offset="1" stopColor={mix(K.sh, K.shPurple, 0.25)} />
        </linearGradient>
        {/* the lamellae's step shadows deepen toward the bill, where the lid turns away from the light */}
        <linearGradient id={`${id}-lam`} gradientUnits="userSpaceOnUse" x1="-30" y1="-26" x2="36" y2="-8">
          <stop offset="0" stopColor={mix(K.sh, K.shDeep, 0.3)} />
          <stop offset="1" stopColor={mix(K.sh, K.shDeep, 0.75)} />
        </linearGradient>
        <linearGradient id={`${id}-lid`} gradientUnits="userSpaceOnUse" x1="-30" y1="-29" x2="38" y2="-3">
          <stop offset="0" stopColor={mix(K.shLit, K.shPale, 0.5)} />
          <stop offset="0.55" stopColor={mix(K.shPale, K.shMid, 0.3)} />
          <stop offset="1" stopColor={mix(K.shMid, K.sh, 0.4)} />
        </linearGradient>
        <clipPath id={`${id}-lvc`}>
          <path d={lvD} />
        </clipPath>
        <clipPath id={`${id}-lidc`}>
          <path d={lidD} />
        </clipPath>
      </defs>
      {/* the attached lower valve: three overlapping growth plates, frilly dark edges */}
      <Inked w={iw}>
        <InkPath d={lvD} fill={`url(#${id}-lv)`} />
        <Deco>
          <g clipPath={`url(#${id}-lvc)`}>
            <path d={lvD} fill={K.shPurple} opacity={0.16} />
            {plates.map((p, k) => (
              <g key={`p${k}`}>
                <path d={p.shadow} fill={K.shDeep} opacity={0.4} />
                <path d={p.fill} fill={plateTone[k]} opacity={0.62} />
                <path d={p.flare} fill={mix(K.shPale, K.shLit, 0.3)} opacity={0.4} />
              </g>
            ))}
            {LV_WEATHER.map((m, i) => (
              <path key={`w${i}`} d={m.d} fill={m.col} opacity={0.34} />
            ))}
            {OY.fine.map((d, k) => (
              <InkLine key={`g${k}`} d={d} w={lw * 0.55} opacity={0.22 + 0.1 * near} />
            ))}
            {plates.map((p, k) => (
              <InkLine key={`i${k}`} d={p.edgeD} w={lw * 1.05} opacity={0.8} />
            ))}
            {/* the lifted margin's underside and the bill's flutes */}
            <path d={OY.underD} fill={K.shDeep} opacity={0.5} />
            {OY.billFlutes.map((d, k) => (
              <InkLine key={`bf${k}`} d={d} w={lw * 0.7} opacity={0.4} />
            ))}
            {/* the lid's overhang shades the lower valve just under the lip */}
            <path d={line(offset(lip, -lw * 3.6))} fill="none" stroke={K.shDeep} strokeWidth={f(lw * 6.5)} strokeOpacity={0.4} strokeLinejoin="round" />
            {/* the base sits in shade just above the cement */}
            <path d={line(edge(XA - 2, XB + 2, (x) => bandTop(x) - 0.25, 0.3))} fill="none" stroke={K.shDeep} strokeWidth={f(Math.max(0.5, lw * 3))} strokeOpacity={0.24} />
          </g>
          <path d={OY.ligD} fill={K.shDeep} opacity={0.85} />
        </Deco>
      </Inked>
      <CementOutside id={`${id}-ce`} iw={iw} px={px} />
      {/* the lid (right valve): flatter, a teardrop rounding at the fluted bill, closed */}
      <Inked w={iw}>
        <InkPath d={lidD} fill={`url(#${id}-lid)`} />
        <Deco>
          <g clipPath={`url(#${id}-lidc)`}>
            {/* the layers as terraces: each older (inner) layer a step lighter */}
            {OY.lidTerr.map((d, k) => (
              <path key={`t${k}`} d={d} fill={K.shLit} opacity={0.2} />
            ))}
            {LID_MOTTLE.map((d, i) => (
              <path key={`m${i}`} d={d} fill={i % 2 ? K.shBrown : K.shPurple} opacity={0.2} />
            ))}
            {/* weathered grey-brown and olive patches */}
            {LID_WEATHER.map((m, i) => (
              <g key={`w${i}`}>
                <path d={m.d} fill={m.col} opacity={0.42} />
                <path d={m.core} fill={mix(m.col, K.shDeep, 0.3)} opacity={0.32} />
              </g>
            ))}
            {/* the growth lamellae as flaky stacked shingles: a lit lip, then the step shadow beyond the edge */}
            {lidLam.map((r, i) => (
              <g key={`l${i}`}>
                <path d={r.lip} fill={mix(K.shLit, '#FFFFFF', 0.5)} opacity={0.6 - 0.06 * r.k} />
                <path d={r.shade} fill={`url(#${id}-lam)`} opacity={0.72 - 0.08 * r.k} />
              </g>
            ))}
            {/* the lid's edge face along the lip seam and its shade */}
            <path d={OY.edgeFace} fill={K.sh} opacity={0.6} />
            <path d={line(offset(lip, lw * 1.4))} fill="none" stroke={K.shDeep} strokeWidth={f(lw * 2.3)} strokeOpacity={0.35} strokeLinejoin="round" />
            {/* the far side of the lid turns down toward the bill */}
            <path d={line([...OY.lidPts.filter((p) => p.x > 20 && p.y < -2.5)])} fill="none" stroke={K.shMid} strokeWidth={f(lw * 5)} strokeOpacity={0.35} strokeLinejoin="round" />
          </g>
          {lidLam.map((r, i) => (
            <InkLine key={`i${i}`} d={r.d} w={lw * (1.0 - 0.08 * r.k)} opacity={0.8 - 0.1 * r.k} />
          ))}
          {OY.lidFlutes.map((d, k) => (
            <InkLine key={`fl${k}`} d={d} w={lw * 0.7} opacity={0.38} />
          ))}
          <ellipse cx="-18" cy="-25.2" rx="2.4" ry="0.42" transform="rotate(-14 -18 -25.2)" fill="#FFFFFF" opacity={0.85} />
          <ellipse cx="-12.2" cy="-26.3" rx="0.7" ry="0.3" transform="rotate(-10 -12.2 -26.3)" fill="#FFFFFF" opacity={0.8} />
          <ellipse cx="9" cy="-23.6" rx="1.1" ry="0.26" transform="rotate(14 9 -23.6)" fill="#FFFFFF" opacity={0.55} />
        </Deco>
      </Inked>
      {/* a couple of small barnacles settled on the lid */}
      {LID_BARNACLES.map((b, i) => (
        <Barnacle key={`b${i}`} c={b.c} s={b.s} tilt={b.tilt} iw={iw} lw={lw} />
      ))}
    </>
  );
};

// ------------------------------------------------------------------ the section through the attachment
/** shell layers above the cement: the outer prismatic layer against the cement, then foliated calcite sheets that
 *  follow the attachment surface near it and flatten upward, with pearly lenses; below the cement the rock's grains */
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
  // pearly lenses between two sheets (none near the window's top edge)
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
  const lenses: ReturnType<typeof lens>[] = [];
  const pores: {p: P; r: number}[] = [];
  lenses.forEach((L, li) => {
    for (let i = 0; i < 16; i++) {
      const x = lerp(L.xa + 0.3, L.xb - 0.3, hash(li * 31.1 + i * 1.73));
      const ix = Math.round((x - X0) / step);
      const a = bounds[L.k][ix].y, b = bounds[L.k + 1][ix].y;
      const u = (x - L.xa) / (L.xb - L.xa), bb = Math.pow(Math.sin(Math.PI * u), 0.8);
      const y = lerp(a, b, 0.5) + (a - b) * 0.3 * bb * (hash(li * 7.3 + i * 2.9) * 2 - 1);
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
  // the rock: a few large angular crystals (150-250 px across at OY_CAM_OUT) over a Voronoi of small grains; tones mix
  // grey, warm tan, dark mica/hornblende, pale quartz and a little pinkish feldspar; thin, low-contrast gaps
  type Big = {c: P; r: number; tone: string; kind: string; rot: number};
  const BIGS: Big[] = [
    {c: pt(-3.2, 1.62), r: 0.98, tone: GRAIN.q[0], kind: 'q', rot: 0.3},
    {c: pt(1.85, 2.75), r: 0.82, tone: GRAIN.t[2], kind: 't', rot: 1.1},
    {c: pt(-0.5, 4.55), r: 0.86, tone: GRAIN.g[1], kind: 'g', rot: 2.0},
    {c: pt(4.35, 1.85), r: 0.7, tone: GRAIN.d[1], kind: 'd', rot: 0.7},
    {c: pt(-1.5, 1.45), r: 0.42, tone: GRAIN.g[3], kind: 'g', rot: 1.6},
    {c: pt(3.55, 4.2), r: 0.5, tone: GRAIN.f[0], kind: 'f', rot: 2.4},
    {c: pt(-4.7, 3.7), r: 0.46, tone: GRAIN.d[2], kind: 'd', rot: 0.2},
  ];
  const bigPolys = BIGS.map((b, bi) =>
    Array.from({length: 6}, (_, i) => {
      const a = b.rot + (i / 6) * TAU + (hash(bi * 7.1 + i * 2.3) - 0.5) * 0.65;
      const rr = b.r * (0.78 + 0.34 * hash(bi * 3.7 + i * 5.9));
      return pt(b.c.x + Math.cos(a) * rr, b.c.y + Math.sin(a) * rr * 0.86);
    }),
  );
  const pick = (h: number): [string, string] => {
    const r = (a: string[]) => a[Math.floor(hash(h * 7.7) * a.length)];
    if (h < 0.5) return [r(GRAIN.g), 'g'];
    if (h < 0.74) return [r(GRAIN.t), 't'];
    if (h < 0.87) return [r(GRAIN.d), 'd'];
    if (h < 0.96) return [r(GRAIN.q), 'q'];
    return [r(GRAIN.f), 'f'];
  };
  type Seed = {p: P; tone: string; kind: string};
  const seeds: Seed[] = [];
  const cell = 0.3;
  for (let i = Math.floor(-7 / cell); i <= Math.ceil(7 / cell); i++) {
    for (let j = Math.floor(-1.2 / cell); j <= Math.ceil(6.4 / cell); j++) {
      const p = pt((i + 0.15 + 0.7 * hash(i * 3.13 + j * 7.77)) * cell, (j + 0.15 + 0.7 * hash(i * 5.71 + j * 2.39 + 0.5)) * cell);
      if (BIGS.some((b) => Math.hypot(p.x - b.c.x, p.y - b.c.y) < 0.8 * b.r)) continue;
      // patches of coarser grain (fewer seeds) and finer grain (extra seeds)
      const coarse = noise1(p.x * 0.8 + 3.1, 4) + noise1(p.y * 1.1 + 7.3, 6);
      const hh = hash(i * 1.37 + j * 9.91 + 0.2);
      if (coarse > 0.45 && hh < 0.5) continue;
      const [tone, kind] = pick(hash(i * 9.13 + j * 4.71 + 0.4));
      seeds.push({p, tone, kind});
      if (coarse < -0.55 && hh < 0.6) {
        const q = pt(p.x + (hash(hh * 3.3) - 0.5) * cell, p.y + (hash(hh * 5.5) - 0.5) * cell);
        const [t2, k2] = pick(hash(hh * 11.1 + 0.9));
        seeds.push({p: q, tone: t2, kind: k2});
      }
    }
  }
  const clipHalf = (poly: P[], s: P, n: P) => {
    const d = sub(n, s);
    const rhs = (n.x * n.x + n.y * n.y - s.x * s.x - s.y * s.y) / 2;
    const val = (p: P) => p.x * d.x + p.y * d.y - rhs;
    const out: P[] = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const va = val(a), vb = val(b);
      if (va <= 0) out.push(a);
      if (va <= 0 !== vb <= 0) {
        const u = va / (va - vb);
        out.push(pt(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u));
      }
    }
    return out;
  };
  const fleckD = (c: P, r: number, seed: number) => closed(blob(c, r * 1.3, r * 0.85, seed, 7, 0.3, seed), 1);
  const grainOf = (poly: P[], tone: string, kind: string, si: number, big: boolean) => {
    const ce = mul(poly.reduce((a, p) => add(a, p), pt(0, 0)), 1 / poly.length);
    const rad = poly.reduce((a, p) => a + Math.hypot(p.x - ce.x, p.y - ce.y), 0) / poly.length;
    if (rad < 0.03) return null;
    const k = Math.max(0.5, 1 - 0.012 / rad); // thin, low-contrast gaps (~3 px at OY_CAM_OUT)
    const ins = poly.map((p) => add(ce, mul(sub(p, ce), k)));
    const lit = ins.map((p) => add(add(ce, mul(sub(p, ce), 0.6)), pt(-0.05 * Math.min(1, rad * 3), -0.06 * Math.min(1, rad * 3))));
    const h = hash(si * 9.13 + 0.4);
    // small dark mineral flecks in some grains; a glint on quartz; cleavage traces across the big crystals
    const flecks: string[] = [];
    if (kind !== 'd' && (hash(si * 4.4) < 0.18 || big)) {
      const nf = big ? 3 : 1;
      for (let q = 0; q < nf; q++) {
        const fc = add(ce, pt((hash(si * 2.2 + q) - 0.5) * rad * 0.9, (hash(si * 3.3 + q) - 0.5) * rad * 0.8));
        flecks.push(fleckD(fc, Math.min(0.06, rad * 0.13) * (0.6 + 0.6 * hash(si + q * 1.3)), si * 3 + q));
      }
    }
    const glint = kind === 'q' && rad > 0.08 ? {c: add(ce, pt(-rad * 0.3, -rad * 0.3)), r: rad * 0.16} : null;
    const cleave = big
      ? [-0.32, 0.02, 0.3].map((o) => {
          const a = h * Math.PI, dv = pt(Math.cos(a), Math.sin(a)), nv = pt(-dv.y, dv.x);
          const c0 = add(ce, mul(nv, o * rad));
          return line([add(c0, mul(dv, -rad * 0.5)), add(c0, mul(dv, rad * 0.5))]);
        })
      : [];
    return {d: line(ins) + 'Z', lit: line(lit) + 'Z', tone, kind, c: ce, flecks, glint, cleave, big};
  };
  const small = seeds.map((s, si) => {
    const B = 0.7;
    let poly = [pt(s.p.x - B, s.p.y - B), pt(s.p.x + B, s.p.y - B), pt(s.p.x + B, s.p.y + B), pt(s.p.x - B, s.p.y + B)];
    for (const n of seeds) {
      if (n === s || Math.abs(n.p.x - s.p.x) > 1.2 || Math.abs(n.p.y - s.p.y) > 1.2) continue;
      poly = clipHalf(poly, s.p, n.p);
      if (poly.length < 3) return null;
    }
    return grainOf(poly, s.tone, s.kind, si, false);
  });
  const grains = [...small, ...bigPolys.map((ps, bi) => grainOf(ps, BIGS[bi].tone, BIGS[bi].kind, 900 + bi, true))].filter(
    (g): g is NonNullable<typeof g> => g !== null && g.c.y > bandBot(g.c.x) - 0.9 && g.c.x > -7 && g.c.x < 7,
  );
  const shellD = (k: number) => line([...(k < 0 ? topLine : bounds[k]), pt(X1, -9), pt(X0, -9)]) + 'Z';
  return {
    X0, X1, bounds, topLine, botLine, lenses, pores, prisms: prisms.join(''), grains,
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

/** the cutaway window and the section inside it; reveal 0..1 opens it from the band outward. Its edge blends over
 *  ~5 % of the radius and is inked navy at the contour weight. */
const SectionWindow: React.FC<{id: string; cam: Cam; reveal: number}> = ({id, cam, reveal}) => {
  if (reveal <= 0.001) return null;
  const px = mmPx(cam);
  const c = OY_WIN.c;
  const r = OY_WIN.r * (1 - Math.pow(1 - clamp(reveal), 1.6));
  if (r < 3 * px) return null;
  const sd = Math.max(0.6 * px, 0.014 * r);
  const R = r * 1.15;
  const S = SECTION;
  const inkB = 2.4 * px; // the cement's outline: 2.4 px outside each edge, as the bone glue's
  const box = {x: c.x - R, y: c.y - R, w: 2 * R, h: 2 * R};
  const winD = closed(winPts(c, r), 1);
  return (
    <g>
      <defs>
        <filter id={`${id}-wf`} filterUnits="userSpaceOnUse" x={f(box.x)} y={f(box.y)} width={f(box.w)} height={f(box.h)}>
          <feGaussianBlur stdDeviation={f(sd)} />
        </filter>
        <mask id={`${id}-wm`} maskUnits="userSpaceOnUse" x={f(box.x)} y={f(box.y)} width={f(box.w)} height={f(box.h)}>
          <path d={closed(winPts(c, r - sd), 1)} fill="#FFFFFF" filter={`url(#${id}-wf)`} />
        </mask>
        <linearGradient id={`${id}-sl`} gradientUnits="userSpaceOnUse" x1={f(c.x - r)} y1={f(c.y - r)} x2={f(c.x + r)} y2={f(c.y + r)}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.05} />
          <stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="0.7" stopColor={K.shadow} stopOpacity={0} />
          <stop offset="1" stopColor={K.shadow} stopOpacity={0.12} />
        </linearGradient>
        <clipPath id={`${id}-rk`}>
          <path d={S.rockD} />
        </clipPath>
        <clipPath id={`${id}-sh`}>
          <path d={S.shellBase} />
        </clipPath>
        <clipPath id={`${id}-cm`}>
          <path d={S.cementD} />
        </clipPath>
      </defs>
      <g mask={`url(#${id}-wm)`}>
        {/* an opaque ground first, so nothing of the outside view shows through inside the window */}
        <path d={winD} fill={K.layer[0]} />
        {/* the shell: the prismatic layer, then the foliated sheets and pearly lenses (all darker than the cement) */}
        <path d={S.shellBase} fill={K.prism} />
        <path d={S.prisms} fill="none" stroke={K.prismLine} strokeWidth={f(1.3 * px)} opacity={0.6} />
        {S.layerD.map((d, k) => (
          <path key={`l${k}`} d={d} fill={K.layer[k % K.layer.length]} />
        ))}
        <g clipPath={`url(#${id}-sh)`}>
          {S.bounds.map((b, k) => (
            <path key={`d${k}`} d={line(b)} fill="none" stroke={K.layerLine} strokeWidth={f((k === 0 ? 2.0 : 1.3) * px)} opacity={k === 0 ? 0.75 : 0.5} />
          ))}
          {S.lenses.map((L, i) => (
            <path key={`n${i}`} d={L.d} fill={K.chalk} stroke={K.layerLine} strokeWidth={f(1.2 * px)} strokeOpacity={0.45} />
          ))}
          {S.pores.map((q, i) => (
            <ellipse key={`o${i}`} cx={f(q.p.x)} cy={f(q.p.y)} rx={f(q.r * 1.4)} ry={f(q.r)} fill={K.chalkPore} />
          ))}
        </g>
        {/* the rock: mixed grains cut by the cement's lower edge */}
        <path d={S.rockD} fill={K.grainGap} />
        <g clipPath={`url(#${id}-rk)`}>
          {S.grains.map((g, i) => (
            <g key={`g${i}`}>
              <path d={g.d} fill={g.tone} stroke={g.big ? K.grainGap : 'none'} strokeWidth={f(2.6 * px)} strokeLinejoin="round" />
              <path d={g.lit} fill="#FFFFFF" opacity={g.kind === 'd' ? 0.05 : 0.07} />
              {g.cleave.map((d, k) => (
                <path key={`c${k}`} d={d} fill="none" stroke={mix(g.tone, INK, 0.25)} strokeWidth={f(1.1 * px)} opacity={0.4} />
              ))}
              {g.flecks.map((d, k) => (
                <path key={`f${k}`} d={d} fill={mix(GRAIN.d[2], INK, 0.2)} opacity={0.75} />
              ))}
              {g.glint && <ellipse cx={f(g.glint.c.x)} cy={f(g.glint.c.y)} rx={f(g.glint.r * 1.6)} ry={f(g.glint.r * 0.5)} transform={`rotate(-30 ${f(g.glint.c.x)} ${f(g.glint.c.y)})`} fill="#FFFFFF" opacity={0.35} />}
            </g>
          ))}
        </g>
        {/* the cement: a thin even band between the two hard surfaces, outlined as the bone glue is */}
        <path d={S.cementD} fill={INK} stroke={INK} strokeWidth={f(2 * inkB)} strokeLinejoin="round" />
        <path d={S.cementD} fill={K.cement} />
        <g clipPath={`url(#${id}-cm)`}>
          <CementLook x0={S.X0} x1={S.X1} px={px} />
        </g>
        {/* the cut face is lit from the upper left */}
        <rect x={f(box.x)} y={f(box.y)} width={f(box.w)} height={f(box.h)} fill={`url(#${id}-sl)`} />
      </g>
      {/* the cut edge: inked navy at the contour weight */}
      <path d={winD} fill="none" stroke={INK} strokeWidth={f(3.6 * px)} strokeLinejoin="round" opacity={f(clamp(reveal * 3))} />
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

/** the seabed beyond the boulder (seen past its right shoulder): hazy sand, a few pebbles and ripples, and the
 *  boulder's dark contact shadow where it sits on the bed */
const Seabed: React.FC<{id: string}> = ({id}) => {
  const top = spline([pt(-200, 52), pt(-60, 48), pt(20, 44.5), pt(60, 42), pt(120, 44), pt(250, 49)], 4);
  const d = line([...top, pt(250, 400), pt(-200, 400)]) + 'Z';
  const pebbles = [pt(58, 52), pt(70, 60), pt(64, 72), pt(52, 84), pt(78, 86), pt(46, 66)];
  return (
    <>
      <defs>
        <linearGradient id={`${id}-sb`} gradientUnits="userSpaceOnUse" x1="0" y1="42" x2="0" y2="120">
          <stop offset="0" stopColor={mix(K.sand, C.sea, 0.35)} />
          <stop offset="0.3" stopColor={K.sand} />
          <stop offset="1" stopColor={K.sandDeep} />
        </linearGradient>
        <radialGradient id={`${id}-cs`}>
          <stop offset="0" stopColor={K.under} stopOpacity={0.75} />
          <stop offset="0.6" stopColor={K.under} stopOpacity={0.4} />
          <stop offset="1" stopColor={K.under} stopOpacity={0} />
        </radialGradient>
      </defs>
      <path d={d} fill={`url(#${id}-sb)`} />
      {[0, 1, 2, 3].map((k) => (
        <path key={k} d={open(edge(30, 110, (x) => 50 + 7 * k + 1.2 * Math.sin(x * 0.25 + k), 3), 1)} fill="none" stroke={mix(K.sand, '#FFFFFF', 0.15)} strokeWidth={0.5} opacity={0.3} />
      ))}
      {pebbles.map((p, i) => (
        <g key={i}>
          <ellipse cx={f(p.x + 0.4)} cy={f(p.y + 0.5)} rx={f(1.6 + hash(i) * 1.4)} ry={f(0.7 + hash(i * 2) * 0.5)} fill={K.sandDeep} opacity={0.5} />
          <ellipse cx={f(p.x)} cy={f(p.y)} rx={f(1.4 + hash(i) * 1.2)} ry={f(0.8 + hash(i * 2) * 0.5)} fill={mix(K.rock, C.sea, 0.35)} />
        </g>
      ))}
    </>
  );
};

/** the boulder's contact shadow on the bed, hugging its undercut (at the boulder's own depth, drawn behind it) */
const BED_SHADOW = (() => {
  const base = ROCK_SIDE.filter((p) => p.y > 44);
  const outer = base.map((p) => pt(p.x + 3.5 + 0.06 * Math.max(0, p.x), p.y + 4.5));
  return {inner: line([...base, ...[...base].reverse().map((p) => pt(p.x + 1.4, p.y + 2.2))]) + 'Z', outer: line([...base, ...[...outer].reverse()]) + 'Z'};
})();
const BedShadow: React.FC = () => (
  <>
    <path d={BED_SHADOW.outer} fill={K.under} opacity={0.3} />
    <path d={BED_SHADOW.inner} fill={K.under} opacity={0.5} />
  </>
);

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
    <Shadows id={`${id}-s`} cam={cam} />
    {/* weed and a bubble stream rooted on the crown behind the oyster, well clear of its hinge */}
    <Seaweed t={t} base={pt(-45.5, crownY(-45.5) + 2.6)} len={44} wid={2.2} lean={-0.32} seed={2.1} iw={iw * 0.8} lw={lw} />
    <Seaweed t={t} base={pt(-50.5, crownY(-50.5) + 3.2)} len={30} wid={1.8} lean={-0.5} seed={6.6} iw={iw * 0.8} lw={lw} />
    <Seaweed t={t} base={pt(44.5, crownY(44.5) + 2.0)} len={30} wid={1.9} lean={0.12} seed={5.3} iw={iw * 0.8} lw={lw} />
    <Tuft t={t} c={pt(-57, crownY(-57) + 3.0)} n={5} size={3.4} seed={2} />
    <Bubbles t={t} cam={cam} z={0} seed={29} every={0.24} xs={[-54.2, -53.8]} y0={crownY(-54) + 1.6} rr={[0.42, 0.85]} vr={[13, 18]} kS={0.6} />
    <Oyster id={`${id}-o`} iw={iw} lw={lw} px={mmPx(cam)} />
  </>
);
/** what lies in front of the oyster: weed and tufts on the brow, the silt puff */
const Foreground: React.FC<{id: string; t: number; cam: Cam; iw: number; lw: number}> = ({id, t, cam, iw, lw}) => (
  <>
    <Tuft t={t} c={pt(-31, browY(-31) - 0.9)} n={5} size={3.0} seed={1} />
    <Tuft t={t} c={pt(34, browY(34) - 1.0)} n={6} size={3.6} seed={3} />
    <Tuft t={t} c={pt(-12, browY(-12) - 0.7)} n={4} size={2.6} seed={5} />
    <Seaweed t={t} base={pt(-49, browY(-49) - 1.4)} len={58} wid={3.0} lean={-0.34} seed={0.4} iw={iw * 0.85} lw={lw} />
    <Seaweed t={t} base={pt(46.6, browY(46.6) - 1.2)} len={40} wid={2.6} lean={0.3} seed={4.2} iw={iw * 0.85} lw={lw} />
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
      {cam.w > 24 && (
        <Layer c={cam} z={30} blurK={22} maxBlur={6}>
          <Seabed id={`${id}-sb`} />
        </Layer>
      )}
      {cam.w > 30 && (
        <Layer c={cam} z={22} blurK={14} maxBlur={6}>
          <Bits t={t} seed={7} n={3} ys={[-70, -34]} size={5} iw={iw} />
        </Layer>
      )}
      <Layer c={cam} z={0}>
        {cam.w > 24 && <BedShadow />}
        <RockBody id={`${id}-r`} cam={cam} iw={iw} lw={lw} />
      </Layer>
      <Layer c={cam} z={0} blurK={0} minBlur={Math.min(6, 0.3 * (W / cam.w))}>
        <Caustics id={`${id}-k`} t={t} cam={cam} />
      </Layer>
      <Layer c={cam} z={0}>
        <FrontScene id={`${id}-m`} t={t} cam={cam} iw={iw} lw={lw} />
        <SectionWindow id={`${id}-w`} cam={cam} reveal={reveal} />
        <Foreground id={`${id}-fg`} t={t} cam={cam} iw={iw} lw={lw} />
        <Scraps t={t} iw={iw} lw={lw} />
        <AdaptiveMotes id={`${id}-am`} t={t} cam={cam} z={0} F={NEAR_FIELD} reveal={reveal} />
      </Layer>
      <Layer c={cam} z={zFore} blurK={0} minBlur={3.5}>
        <AdaptiveMotes id={`${id}-af`} t={t} cam={cam} z={zFore} F={FORE_FIELD} reveal={reveal} />
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
      <Flecks id={`${id}-fk`} t={t} cam={cam} />
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
