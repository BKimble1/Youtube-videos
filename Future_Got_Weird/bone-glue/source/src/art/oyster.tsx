// The oyster comparison (film t ≈ 7.95–10.35 s): a Pacific-type oyster cemented to a boulder underwater, seen from the
// side and a little above. World units are millimetres, x right, y down.
//
// MATCH EDGE: the cement's lower contact edge on the rock (cement above, rock below) is a wavy, roughly horizontal ink
// line through (0, 0) across x ∈ [-45.5, 45.5]; it arches down ~2 mm toward its ends with the boulder's curvature.
// The film's match cuts align this edge with the glue's contact edge on the bone. See OYSTER_MATCH.
//
// Science: the oyster cements its LEFT valve (the deeper, cupped one) to hard substrate; the RIGHT valve is the flatter
// lid on top (closed). Here the hinge (beak / umbo) points to screen left, the broad frilly growth margin is on the
// right. Growth lamellae run concentric around the umbo with frilly free edges; faint purple-brown rays radiate from
// it. The cement is mostly calcium carbonate: a pale, glossy fillet that hugs the cupped valve's lower lip and flows
// out onto the rock into a wider, lobed footprint.
//
// The oyster, its cement and the rock never move. Everything that belongs to the water moves: particles drift with a
// left-to-right current in several depth layers, seaweed sways, bubbles rise, light shafts and caustics shimmer, and
// one current SURGE (t ≈ 8.95–9.6, peak ≈ 9.27) bends the weed hard, swirls particles and a puff of silt past, carries
// a few torn weed bits through and streams the bubbles sideways. All motion is a deterministic, continuous function of t.
import React from 'react';
import {Cam, Layer, viewRect, W, H} from '../camera';
import {C} from './palette';
import {P, pt, add, mul, nrm, perp, sub, line, closed, open, tube, n4} from '../core/geo';
import {mix, rgba} from '../core/color';
import {clamp, ss, ss5, lerp, noise1, hash} from '../lib';
import {Inked, Deco, InkPath, InkLine, INK, OUTLINE_K, FEATURE_K} from '../dc/ink';

const f = n4;
const TAU = Math.PI * 2;

// ------------------------------------------------------------------ colours (underwater grading of the episode palette)
const tint = (c: string, k: number) => mix(c, C.sea, k);
const K = {
  // stone: the episode's rock colours graded cooler and greyer under water
  rock: mix(tint(C.rock, 0.2), '#58605E', 0.35),
  rockLit: mix(tint(C.rockLit, 0.12), '#9EA49C', 0.3),
  rockDeep: tint(C.rockDeep, 0.32),
  // the shell: the episode's shell colours pulled toward warm greys and browns; purple only as a tint in the bands
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
/** sample y(u, x) along x from xa to xb */
const edge = (xa: number, xb: number, y: (u: number, x: number) => number, step = 0.22): P[] => {
  const n = Math.max(2, Math.ceil(Math.abs(xb - xa) / step));
  const out: P[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, x = lerp(xa, xb, u);
    out.push(pt(x, y(u, x)));
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

// ------------------------------------------------------------------ the oyster and its cement (static geometry, built once)
const buildOyster = () => {
  // --- the contact edge (cement -> rock): rounded lobes of cement that flowed out onto the rock, through (0, 0)
  const EX: [number, number] = [-45.5, 45.5];
  const cuts0 = [EX[0] - 14];
  for (let j = 0; cuts0[cuts0.length - 1] < EX[1] + 14; j++) cuts0.push(cuts0[cuts0.length - 1] + lerp(9.6, 13.4, hash(j * 3.17 + 5.3)));
  // phase: x = 0 sits a quarter of the way into its lobe (mid-height on its flank), so near the match point the wavy
  // edge oscillates about y = 0 instead of bottoming out on it
  let j0 = 0;
  while (cuts0[j0 + 1] < 0) j0++;
  const dph = -(cuts0[j0] + 0.25 * (cuts0[j0 + 1] - cuts0[j0]));
  const cuts = cuts0.map((c) => c + dph);
  const amps = cuts.map((_, j) => lerp(0.85, 1.4, hash(j * 7.7 + 1.9)));
  const rawY = (x: number) => {
    let j = 0;
    while (j < cuts.length - 2 && x > cuts[j + 1]) j++;
    const u = clamp((x - cuts[j]) / (cuts[j + 1] - cuts[j]));
    const taper = 0.35 + 0.65 * ss(x, EX[0], EX[0] + 8) * ss(EX[1] - x, 0, 8);
    return 0.0013 * x * x + amps[j] * taper * Math.pow(0.5 - 0.5 * Math.cos(TAU * u), 0.8) + 0.12 * noise1(x * 0.45, 4);
  };
  const y0 = rawY(0);
  const edgeY = (x: number) => rawY(x) - y0;
  const E = edge(EX[0], EX[1], (_, x) => edgeY(x), 0.12);

  // design coordinates -> world: the shell is drawn ~79 mm long and fitted to ~75 mm, hinge at x ≈ -36
  const X = (ps: P[]) => ps.map((p) => pt(0.95 * p.x - 1, p.y));
  // --- the lid (right valve): a thin plate seen a little from above, its broad end (the bill) raised; hinge at HL
  const HL = X([pt(-32.4, -20.7)])[0], LR = X([pt(40.2, -24.0)])[0];
  const LID_BACK0 = spline(X([pt(-32.4, -20.7), pt(-28.4, -22.0), pt(-25, -22.3), pt(-20, -23.6), pt(-11, -25.6), pt(-1, -27.4), pt(9, -29.0), pt(18, -30.3), pt(26, -31.0), pt(32, -30.6), pt(36.4, -29.0), pt(39.2, -26.6), pt(40.2, -24.0)]), 0.2);
  // the far margin is ruffled too: flaky teeth, growing toward the bill (runs left -> right along the top: outward = -1)
  const LID_BACK = frillN(LID_BACK0, -1, [0.35, 1.0], [2.6, 4.6], 17, {mode: 'tooth', taper: 3, ampP: (p) => 0.3 + 0.7 * ss(p.x, -20, 25)});
  // the commissure: broad plication folds plus bold zigzag teeth hanging over the cup's rim (LIP runs right -> left)
  const LIP = spline(X([pt(40.2, -24.0), pt(38.6, -22.6), pt(34, -22.0), pt(27, -21.8), pt(19, -21.5), pt(10, -21.1), pt(1, -20.6), pt(-8, -20.2), pt(-17, -19.8), pt(-24, -19.5), pt(-29, -19.6), pt(-32.4, -20.7)]), 0.2).map((p) =>
    pt(p.x, p.y + 0.8 * Math.sin((p.x + 4) * 0.4) * ss(p.x, -27, -16) * ss(37 - p.x, 0, 4)),
  );
  const lip = frillN(LIP, -1, [1.1, 2.3], [3.2, 5.2], 13, {mode: 'tooth', taper: 2.6, ampP: (p) => 0.35 + 0.65 * ss(p.x, -26, 14)});
  const lidD = line([...LID_BACK, ...lip.slice(1)]) + 'Z';
  // the top surface's front rim: above it the lit top, below it the lid's edge face
  const lipRim = offset(LIP, 1.6);
  const rimLR = [...lipRim].reverse();
  const rimY = (x: number) => yAtX(rimLR, x);
  const edgeFace = line([...lip, ...[...lipRim].reverse()]) + 'Z';
  // growth lamellae on the lid: older, smaller lids nested toward the umbo at the hinge, flaky edges facing outward
  const UL = pt(HL.x + 1.2, HL.y - 0.5);
  const lidRings = [0.86, 0.72, 0.57, 0.42, 0.27].map((s, k) => {
    // the whole older outline (far margin + lip), clipped later to the lid's top surface: it ends where it meets the rim
    const sc = scaleAbout([...LID_BACK0, ...LIP.slice(1)], UL, s);
    const a = 1 - 0.13 * k;
    const fr = frillN(sc, -1, [0.3 * a, 0.9 * a], [2.0, 3.6], 41 + k * 3, {mode: 'tooth', taper: 1.2, ampP: (_, u) => 0.45 + 0.55 * (0.5 + 0.5 * noise1(u * 9 + k * 3, 11))});
    const fill = line(fr) + 'Z';
    // growth is never perfectly regular: some lamellae break off part way
    const cut = 0.3 + 0.25 * hash(k * 4.1 + 0.3);
    const vis = fr.filter((_, i) => i / (fr.length - 1) < cut || k % 2 === 0);
    return {pts: fr, d: line(vis), fill};
  });
  const lidTop = line([...LID_BACK, ...lipRim.slice(1)]) + 'Z';

  // --- the cupped lower valve (left valve): rim hidden under the lid, the broad end bulging past the lid, a deep
  // rounded bottom sunk in cement, the beak (umbo) pointed and upturned at the hinge end
  const LV_MAIN = spline(
    X([
      pt(-30, -20.0), pt(-22, -20.4), pt(-12, -21.0), pt(-2, -21.6), pt(8, -22.1), pt(18, -22.5), pt(28, -22.9), pt(35, -23.6), pt(38.2, -24.0),
      pt(40.6, -22.4), pt(42, -19.4), pt(42.2, -15.4), pt(41.2, -11.4), pt(39, -7.8), pt(35.6, -4.9), pt(30.6, -3.0), pt(24, -2.0), pt(16, -1.5), pt(8, -1.5),
      pt(0, -1.9), pt(-8, -3.0), pt(-15, -4.9), pt(-21, -7.6), pt(-26.4, -10.8), pt(-30.8, -14.2), pt(-34.2, -17.0), pt(-37, -19.8),
    ]),
    0.2,
  );
  const BEAK_TOP = spline(X([pt(-37, -19.8), pt(-35.6, -21.0), pt(-33, -21.3), pt(-30.8, -20.5), pt(-30, -20.0)]), 0.2);
  // the broad end's silhouette steps with the free edges of its growth lamellae (outward = side -1, clockwise)
  const lvMain = frillN(LV_MAIN, -1, [0.4, 1.1], [2.2, 3.8], 23, {mode: 'tooth', taper: 0.5, ampP: (p) => ss(p.x, 35, 37) * (1 - ss(p.y, -8.5, -6))});
  const lvD = line([...lvMain, ...BEAK_TOP.slice(1)]) + 'Z';
  // concentric growth lamellae around the umbo: older, smaller valve outlines, their free flaky edges facing outward
  const UV = X([pt(-33.6, -19.2)])[0];
  const iR = nearest(LV_MAIN, X([pt(38.2, -24.0)])[0]);
  const lvRings = [0.87, 0.74, 0.6, 0.45, 0.3].map((s, k) => {
    const sc = scaleAbout(LV_MAIN.slice(iR), UV, s);
    const a = 1 - 0.12 * k;
    const fr = frillN(sc, -1, [0.35 * a, 1.1 * a], [2.0, 3.6], 31 + k * 5, {mode: 'tooth', taper: 1.5, ampP: (_, u) => 0.4 + 0.6 * (0.5 + 0.5 * noise1(u * 10 + k * 2.3, 12))});
    const z = fr[fr.length - 1];
    const fill = line([...fr, pt(z.x - 6, -32), pt(fr[0].x, -32)]) + 'Z';
    const c0 = 0.12 * hash(k * 2.9 + 1.1), c1 = 1 - 0.25 * hash(k * 6.1 + 0.7);
    const vis = fr.filter((_, i) => {
      const u = i / (fr.length - 1);
      return u >= c0 && u <= c1;
    });
    return {pts: vis, d: line(vis), fill};
  });
  // the hinge ligament: a dark groove along the beak's top
  const lig = BEAK_TOP.slice(2, -3);
  const ligD = line([...lig, ...shift([...lig].reverse(), 0.3, 0.8)]) + 'Z';

  // --- the cement: concave meniscus fillets from thin toes on the rock up to the cup's flanks, and across the bottom a
  // band that rides a little way up the shell (the shell is sunk in it)
  const iCL = nearest(LV_MAIN, pt(-24.2, -9.0)), iCR = nearest(LV_MAIN, pt(36.4, -8.0));
  const cL = add(LV_MAIN[iCL], pt(0.35, 0.1)), cR = add(LV_MAIN[iCR], pt(-0.35, 0.1));
  const under = LV_MAIN.slice(iCR, iCL + 1);
  const underY = (x: number) => yAtX(under, x);
  const men = (x0: number, c: P, p: number) => edge(x0, c.x, (u, x) => edgeY(x) - (edgeY(c.x) - c.y) * Math.pow(u, p), 0.15);
  const menL = men(EX[0], cL, 1.85);
  const menR = [...men(EX[1], cR, 1.7)].reverse();
  const inner = edge(cL.x, cR.x, (_, x) => underY(x) - 2.8 * ss(x, cL.x, cL.x + 6) * ss(cR.x - x, 0, 5) + 0.3 * noise1(x * 0.3, 5), 0.15);
  const T0 = [...menL, ...inner.slice(1), ...menR.slice(1)];
  // where it rides over the shell it creeps up between the lamellae: small irregular lobes (T0 runs left -> right, up = -1)
  const T = frillN(T0, -1, [0.18, 0.55], [2.6, 4.8], 57, {sharp: 0.7, ampP: (p) => ss(p.x, cL.x + 2, cL.x + 6) * (1 - ss(p.x, cR.x - 6, cR.x - 2))});
  const cemD = line([...T, ...[...E].reverse()]) + 'Z';
  const crease = T.filter((p) => p.x > cL.x - 0.2 && p.x < cR.x + 0.2);
  // a highlight that runs along each lobe of the edge, just inside it (some lobes only)
  const lobeHi: string[] = [];
  for (let j = 0; j < cuts.length - 1; j++) {
    const a = cuts[j], b = cuts[j + 1];
    if (a < -43 || b > 43 || hash(j * 5.3 + 2.2) < 0.25) continue;
    const xa = lerp(a, b, 0.22 + 0.1 * hash(j * 1.9)), xb = lerp(a, b, 0.7 + 0.1 * hash(j * 2.7));
    lobeHi.push(line(edge(xa, xb, (_, x) => edgeY(x) - 0.95 - 0.25 * Math.sin(Math.PI * clamp((x - xa) / (xb - xa))), 0.2)));
  }
  // the lit crest of each fillet (the left one faces the light)
  const filHiL = line(menL.filter((_, i) => i > menL.length * 0.35 && i < menL.length * 0.85).map((p) => add(p, pt(0.7, 0.75))));
  const filHiR = line(menR.filter((_, i) => i > menR.length * 0.2 && i < menR.length * 0.55).map((p) => add(p, pt(-0.5, 0.7))));
  const glint = (ps: P[], u: number, d: P) => add(ps[Math.round(u * (ps.length - 1))], d);
  const glints = [glint(menL, 0.62, pt(0.9, 0.8)), glint(inner, 0.3, pt(0, 1.6)), glint(inner, 0.62, pt(0, 1.7))];
  return {
    EX, edgeY, E, cuts, HL, LR, LID_BACK, lip, lipRim, edgeFace, lidD, lidTop, lidRings, LV_MAIN, lvD, lvRings, UV, UL, ligD, T, cemD, crease, lobeHi, filHiL, filHiR, glints,
    base: [cL.x, cR.x] as [number, number],
  };
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
  ray(OY.UV, pt(24, 0), 0.2, 3.2, 0.03),
  ray(OY.UV, pt(4, 1), 0.2, 2.4, 0.04),
  ray(OY.UV, pt(-14, -1), 0.2, 1.8, 0.04),
];
const RAYS_LID = [
  ray(OY.UL, pt(-6, -28.5), 0.15, 1.6, -0.02),
  ray(OY.UL, pt(14, -30), 0.15, 2.2, -0.01),
  ray(OY.UL, pt(31, -29), 0.15, 1.8, 0.0),
  ray(OY.UL, pt(40, -23), 0.15, 1.6, 0.01),
];

// ------------------------------------------------------------------ the rock (static): a boulder whose crown the oyster sits on
const ROCK_TOP = spline(
  [
    pt(-240, 330), pt(-165, 170), pt(-125, 84), pt(-98, 42), pt(-78, 18), pt(-63, 6.0), pt(-51, -0.8), pt(-39, -6.4), pt(-24, -10.8), pt(-8, -13.2), pt(8, -13.6),
    pt(24, -11.6), pt(39, -6.8), pt(51, -0.6), pt(62, 6.0), pt(77, 17.5), pt(96, 37), pt(124, 76), pt(165, 160), pt(240, 320),
  ],
  0.8,
);
const ROCK_D = line([...ROCK_TOP, pt(250, 640), pt(-250, 640)]) + 'Z';
/** the rock's silhouette (back edge of its crown) at x */
const crownY = (x: number) => yAtX(ROCK_TOP, x);
const CRACKS: P[][] = [
  [pt(-64, 12), pt(-65.6, 18), pt(-63.4, 23.5), pt(-66.4, 30), pt(-65, 36), pt(-68.5, 44)],
  [pt(-65.4, 26), pt(-60.5, 29), pt(-58.4, 33.5)],
  [pt(52, 9.5), pt(50.4, 16), pt(53.4, 22), pt(51.8, 30), pt(54.6, 38), pt(53.2, 47)],
  [pt(-34, 40), pt(-31.4, 44.5), pt(-32.6, 49), pt(-29.4, 55)],
  [pt(27, 44), pt(28.6, 49), pt(27.6, 54), pt(30, 60)],
];
/** soft cel planes on the boulder's face (off-centre, irregular): lit ones turned to the upper left, shaded ones away */
const FACETS: {ps: P[]; lit: boolean; a: number}[] = [
  {ps: [pt(-104, 26), pt(-78, 14), pt(-52, 16), pt(-42, 28), pt(-60, 40), pt(-92, 42)], lit: true, a: 0.22},
  {ps: [pt(44, 22), pt(64, 15), pt(84, 22), pt(78, 36), pt(56, 36)], lit: true, a: 0.14},
  {ps: [pt(22, 52), pt(54, 40), pt(84, 50), pt(82, 74), pt(48, 82), pt(22, 70)], lit: false, a: 0.2},
  {ps: [pt(-82, 54), pt(-50, 56), pt(-36, 70), pt(-58, 84), pt(-88, 78)], lit: false, a: 0.15},
];
const PITS = [pt(-48, 50), pt(-43, 53), pt(16, 38), pt(64, 66), pt(-94, 66), pt(-24, 26), pt(-21.3, 27.4), pt(26, 22), pt(-60, 14), pt(58, 26)];

// ------------------------------------------------------------------ the water: a steady current plus one surge
const SURGE: [number, number] = [8.95, 9.6];
const SURGE_MM = 52;
/** the surge's progress 0..1 (C2) */
const surgeD = (t: number) => ss5(t, SURGE[0], SURGE[1]);
/** the surge's speed envelope 0..1 (bell, peak at the middle) */
const surgeE = (t: number) => {
  const x = clamp((t - SURGE[0]) / (SURGE[1] - SURGE[0]));
  return 16 * x * x * (1 - x) * (1 - x);
};
/** the weed's swing back after the surge (a smaller bell) */
const reboundE = (t: number) => {
  const x = clamp((t - 9.45) / 0.8);
  return 16 * x * x * (1 - x) * (1 - x);
};
/** how far the water has moved (mm) by film time t */
const flow = (t: number) => 7.5 * (t - 8) + 1.3 * Math.sin(0.9 * t) + SURGE_MM * surgeD(t);

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
  const sd = surgeD(t), se = surgeE(t);
  const out: React.ReactNode[] = [];
  const i0 = Math.floor((x0 - u) / m.cell) - 2, i1 = Math.ceil((x1 - u) / m.cell) + 2;
  const j0 = Math.floor(y0 / m.cell) - 1, j1 = Math.ceil(y1 / m.cell) + 1;
  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) {
      const h = hash(i * 12.9898 + j * 78.233 + m.seed * 37.719);
      if (h > m.dens) continue;
      const hx = hash(h * 91.7 + 1.3), hy = hash(h * 53.1 + 2.7), hr = hash(h * 17.3 + 5.1), hp = hash(h * 29.9 + 0.3);
      // during the surge each mote is carried through one turn of an eddy (net zero), on top of the bulk flow
      const R = (1.8 + 4.2 * hr) * (m.cell / 10), th0 = hp * TAU, th = th0 + (hx > 0.5 ? 1 : -1) * TAU * sd;
      const ex = R * (Math.sin(th) - Math.sin(th0)), ey = R * (Math.cos(th0) - Math.cos(th));
      const x = (i + hx) * m.cell + u + 1.1 * Math.sin(0.8 * t + hp * TAU) + ex;
      const y = (j + hy) * m.cell + 0.9 * Math.sin(0.62 * t + hp * 9.1) + 0.6 * noise1(t * 0.7 + hp * 10, m.seed) + ey;
      if (x < x0 || x > x1 || y < y0 || y > y1) continue;
      const r = lerp(m.r[0], m.r[1], hr);
      // streaked along the motion while the surge carries them
      const vx = 1 + (R * 6.3 * Math.cos(th) * (hx > 0.5 ? 1 : -1)) / SURGE_MM, vy = (R * 6.3 * Math.sin(th) * (hx > 0.5 ? 1 : -1)) / SURGE_MM;
      const ang = (1 - se) * (-8 + 16 * hp) + se * (Math.atan2(vy, vx) * 180) / Math.PI;
      const st = 1.35 + 3.4 * se;
      out.push(
        <ellipse key={`${i}_${j}`} cx={f(x)} cy={f(y)} rx={f(r * st)} ry={f(r * (0.8 - 0.2 * se))} transform={`rotate(${f(ang)} ${f(x)} ${f(y)})`} fill={m.color} opacity={f(m.a * (0.55 + 0.45 * hr))} />,
      );
    }
  }
  return <>{out}</>;
};

/** one bubble */
const Bubble: React.FC<{x: number; y: number; r: number; sq: number; ang: number}> = ({x, y, r, sq, ang}) => (
  <g transform={`translate(${f(x)} ${f(y)}) rotate(${f(ang)})`}>
    <ellipse rx={f(r * sq)} ry={f(r / sq)} fill={rgba(mix(C.seaLit, '#FFFFFF', 0.35), 0.28)} stroke="#EFFFFB" strokeWidth={f(r * 0.17)} strokeOpacity={0.85} />
    <path d={`M${f(r * 0.25)} ${f(r * 0.72)}A${f(r * 0.78)} ${f(r * 0.78)} 0 0 0 ${f(r * 0.74)} ${f(r * 0.2)}`} fill="none" stroke="#FFFFFF" strokeWidth={f(r * 0.12)} strokeLinecap="round" opacity={0.5} />
    <ellipse cx={f(-r * 0.36)} cy={f(-r * 0.38)} rx={f(r * 0.26)} ry={f(r * 0.17)} transform={`rotate(-40 ${f(-r * 0.36)} ${f(-r * 0.38)})`} fill="#FFFFFF" opacity={0.95} />
  </g>
);

/** bubbles: rising from behind/on the boulder, wobbling, carried by the current and streamed sideways by the surge */
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
    // the surge is slower near the rock (boundary layer): the higher a bubble has risen, the further it is swept
    const g = 0.3 + 0.7 * ss(y0 - y, 0, 45);
    const x = bx + 0.4 * 7.5 * age + 1.4 * Math.sin(5.2 * age + k) * (1 - 0.7 * se) + kS * g * SURGE_MM * (surgeD(t) - surgeD(ts));
    const r = lerp(rr[0], rr[1], hash(k * 4.4 + seed)) * (1 + 0.03 * age) * ss(age, 0, 0.12);
    if (r <= 0.01 || y < vy0 - 4 || y > vy1 + 4 || x < vx0 - 4 || x > vx1 + 4) continue;
    // squashed and tipped by the cross-flow
    const sq = 1 + 0.07 * Math.sin(9 * age + k) + 0.22 * se;
    out.push(<Bubble key={k} x={x} y={y} r={r} sq={sq} ang={-18 * se * g} />);
  }
  return <>{out}</>;
};

/** a puff of silt lifted off the rock by the surge and swept downstream (fades as it disperses) */
const Silt: React.FC<{t: number; cam: Cam; z: number; seed: number; n: number; xs: [number, number]; r: [number, number]; a: number}> = ({t, cam, z, seed, n, xs, r, a}) => {
  if (t < SURGE[0] || t > 10.8) return null;
  const [vx0, vy0, vx1, vy1] = viewRect(cam, z, 1.1);
  const out: React.ReactNode[] = [];
  const se = surgeE(t);
  for (let i = 0; i < n; i++) {
    const h = hash(i * 3.91 + seed * 11.3), h2 = hash(i * 7.37 + seed * 2.9), h3 = hash(i * 1.73 + seed * 5.1);
    const tb = SURGE[0] + 0.05 + 0.3 * h;
    if (t < tb) continue;
    const age = t - tb;
    const x0 = lerp(xs[0], xs[1], h2);
    const ys = crownY(x0) + 2 + 10 * h3;
    const carry = 1.15 * SURGE_MM * (surgeD(t) - surgeD(tb)) + 6 * age;
    const lift = (5 + 12 * h3) * (1 - Math.exp(-age / 0.35)) + 2.5 * Math.sin(3.1 * age + i);
    const x = x0 + carry + 2.2 * Math.sin(4.3 * age + i * 1.7);
    const y = ys - lift;
    if (x < vx0 || x > vx1 || y < vy0 || y > vy1) continue;
    const op = a * ss(age, 0, 0.18) * (1 - ss(t, 9.65, 10.6)) * (0.5 + 0.5 * hash(i * 9.1 + seed));
    const rr = lerp(r[0], r[1], hash(i * 4.7 + seed)) * (1 + 0.8 * age);
    out.push(<ellipse key={i} cx={f(x)} cy={f(y)} rx={f(rr * (1.2 + 2.2 * se))} ry={f(rr * 0.8)} fill={K.silt} opacity={f(op)} />);
  }
  return <>{out}</>;
};

/** torn bits of weed tumbling through with the surge */
const Bits: React.FC<{t: number; z: number; seed: number; n: number; ys: [number, number]; size: number; iw: number}> = ({t, z, seed, n, ys, size, iw}) => {
  void z;
  if (t < 8.85 || t > 10.5) return null;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const h = hash(i * 5.17 + seed), h2 = hash(i * 2.31 + seed * 3.3);
    const t0 = 8.88 + 0.16 * i + 0.05 * h, t1 = t0 + 0.75 + 0.2 * h2;
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
        return (
          <path key={i} d={`M${f(x)} ${f(c.y + 0.4)}Q${f(m.x)} ${f(m.y)} ${f(e.x)} ${f(e.y)}`} fill="none" stroke={i % 2 ? K.weed : mix(K.weed, K.weedLit, 0.45)} strokeWidth={f(size * 0.075)} strokeLinecap="round" />
        );
      })}
    </g>
  );
};

// ------------------------------------------------------------------ line weights (screen-consistent, slightly heavier when close)
const pxPerMm = (cam: Cam) => W / cam.w;
const grow = (cam: Cam) => Math.pow(150 / cam.w, 0.42);
/** the Inked width for an outline of `px` screen pixels */
const inkW = (cam: Cam, px = 4.2) => (px * grow(cam)) / pxPerMm(cam) / OUTLINE_K;
/** the InkLine width for a drawn line of `px` screen pixels */
const lineW = (cam: Cam, px: number) => (px * grow(cam)) / pxPerMm(cam) / FEATURE_K;

// ------------------------------------------------------------------ the rock
const TERM = [pt(-240, 150), pt(-130, 118), pt(-50, 100), pt(20, 82), pt(70, 54), pt(100, 36), pt(240, 60)];
const RockBody: React.FC<{id: string; cam: Cam; iw: number; lw: number}> = ({id, cam, iw, lw}) => {
  const term = open(TERM, 1);
  // the crown's lit plane: from the silhouette down to where the boulder turns into its front face (follows the dome)
  const crownTop = ROCK_TOP.filter((p) => p.x > -120 && p.x < 120);
  const crown = line([...crownTop, ...[...crownTop].reverse().map((p) => pt(p.x, p.y + 19 + 0.06 * Math.abs(p.x) + 1.6 * noise1(p.x * 0.07, 3)))]) + 'Z';
  // gentle speckle texture (two tones), only where the camera looks
  const [x0, y0, x1, y1] = viewRect(cam, 0, 1.05);
  const spk: React.ReactNode[] = [];
  const cell = 2.6;
  for (let i = Math.floor(x0 / cell); i <= Math.ceil(x1 / cell); i++) {
    for (let j = Math.floor(Math.max(y0, -16) / cell); j <= Math.ceil(Math.min(y1, 160) / cell); j++) {
      const h = hash(i * 17.17 + j * 31.31 + 0.7);
      if (h > 0.3) continue;
      const x = (i + hash(h * 7.1)) * cell, y = (j + hash(h * 3.3)) * cell;
      if (y < crownY(x) + 0.8) continue;
      const r = 0.12 + 0.28 * hash(h * 9.9);
      spk.push(<ellipse key={`${i}_${j}`} cx={f(x)} cy={f(y)} rx={f(r * 1.3)} ry={f(r)} fill={h < 0.15 ? K.rockDeep : mix(K.rockLit, '#FFFFFF', 0.25)} opacity={h < 0.15 ? 0.28 : 0.22} />);
    }
  }
  return (
    <>
      <defs>
        <clipPath id={`${id}-rclip`}>
          <path d={ROCK_D} />
        </clipPath>
        <linearGradient id={`${id}-rg`} gradientUnits="userSpaceOnUse" x1="0" y1="-14" x2="0" y2="170">
          <stop offset="0" stopColor={K.rockLit} />
          <stop offset="0.08" stopColor={mix(K.rockLit, K.rock, 0.5)} />
          <stop offset="0.2" stopColor={K.rock} />
          <stop offset="0.6" stopColor={mix(K.rock, K.rockDeep, 0.6)} />
          <stop offset="1" stopColor={K.rockDeep} />
        </linearGradient>
        {/* the boulder rounds away from the eye toward its flanks and base */}
        <radialGradient id={`${id}-rs`} gradientUnits="userSpaceOnUse" cx="-8" cy="-4" r="105" fx="-20" fy="-12">
          <stop offset="0" stopColor={K.rockDeep} stopOpacity={0} />
          <stop offset="0.42" stopColor={K.rockDeep} stopOpacity={0} />
          <stop offset="0.8" stopColor={K.rockDeep} stopOpacity={0.42} />
          <stop offset="1" stopColor={K.rockDeep} stopOpacity={0.75} />
        </radialGradient>
        <linearGradient id={`${id}-cr`} gradientUnits="userSpaceOnUse" x1="-70" y1="-14" x2="70" y2="20">
          <stop offset="0" stopColor={mix(K.rockLit, '#FFF6E6', 0.2)} stopOpacity={0.62} />
          <stop offset="0.6" stopColor={K.rockLit} stopOpacity={0.38} />
          <stop offset="1" stopColor={K.rockLit} stopOpacity={0.16} />
        </linearGradient>
      </defs>
      <Inked w={iw}>
        <InkPath d={ROCK_D} fill={`url(#${id}-rg)`} />
      </Inked>
      <g clipPath={`url(#${id}-rclip)`}>
        {/* cel planes: facets on the face, the lit crown, the shadow side lower right */}
        {FACETS.map((q, i) => (
          <g key={`f${i}`}>
            <path d={closed(q.ps, 0.7)} fill={q.lit ? K.rockLit : K.rockDeep} opacity={q.a} />
            {q.lit && <path d={open(q.ps.slice(0, 3), 0.7)} fill="none" stroke={mix(K.rockLit, '#FFFFFF', 0.3)} strokeWidth={f(lw * 1.0)} strokeLinecap="round" opacity={0.25} />}
          </g>
        ))}
        <path d={crown} fill={`url(#${id}-cr)`} />
        <rect x="-250" y="-20" width="500" height="660" fill={`url(#${id}-rs)`} />
        <path d={term + 'L240 640L-240 640Z'} fill={K.rockDeep} opacity={0.4} />
        {/* a faint green film of algae on the shaded lower face */}
        <ellipse cx="-86" cy="74" rx="30" ry="10" transform="rotate(-24 -86 74)" fill={K.weedDeep} opacity={0.14} />
        <ellipse cx="100" cy="66" rx="24" ry="8" transform="rotate(30 100 66)" fill={K.weedDeep} opacity={0.13} />
        {spk}
        {/* pits: a dark hollow with a lit lower lip */}
        {PITS.map((q, i) => {
          const r = i >= 5 ? 0.45 + 0.35 * hash(i * 3.7) : 1.1 + 0.9 * hash(i * 3.7);
          return (
            <g key={i}>
              <ellipse cx={f(q.x + 0.25 * r)} cy={f(q.y + 0.3 * r)} rx={f(r * 1.05)} ry={f(r * 0.72)} fill={mix(K.rockLit, '#FFFFFF', 0.1)} opacity={0.35} />
              <ellipse cx={f(q.x)} cy={f(q.y)} rx={f(r)} ry={f(r * 0.62)} fill={mix(K.rockDeep, C.seaDeep, 0.45)} opacity={0.7} />
            </g>
          );
        })}
        {/* cracks: a dark groove with a lit lower-right lip */}
        {CRACKS.map((c, i) => (
          <g key={i}>
            <path d={open(shift(c, 0.4, 0.4), 0.6)} fill="none" stroke={mix(K.rockLit, '#FFFFFF', 0.15)} strokeWidth={f(lw * 0.8)} strokeLinecap="round" strokeLinejoin="round" opacity={0.4} />
            <path d={open(c, 0.6)} fill="none" stroke={mix(K.rockDeep, C.seaDeep, 0.55)} strokeWidth={f(lw * 0.9)} strokeLinecap="round" strokeLinejoin="round" opacity={0.75} />
          </g>
        ))}
        {/* a lit rim along the crown, cool light bouncing up from the water along the shaded flank */}
        <path d={line(shift(ROCK_TOP.filter((p) => p.x > -120 && p.x < 60), 0, 0.9))} fill="none" stroke={mix(K.rockLit, '#FFFFFF', 0.45)} strokeWidth="1.2" strokeLinecap="round" opacity={0.5} />
        <path d={line(ROCK_TOP.filter((p) => p.x > 60))} fill="none" stroke={C.seaLit} strokeWidth="5" opacity={0.2} />
      </g>
    </>
  );
};

/** caustic shimmer on the crown of the rock (its own softly blurred layer) */
const Caustics: React.FC<{id: string; t: number; cam: Cam}> = ({id, t, cam}) => {
  const [x0, , x1] = viewRect(cam, 0, 1.15);
  const loops: string[] = [];
  const sx = 10;
  const rowY = (j: number) => -15 + 2.3 * j + 0.3 * j * j;
  for (let j = 0; j < 10; j++) {
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
        <linearGradient id={`${id}-cf`} gradientUnits="userSpaceOnUse" x1="0" y1="-15" x2="0" y2="26">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.5} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        <mask id={`${id}-cm`} maskUnits="userSpaceOnUse" x="-400" y="-30" width="800" height="80">
          <rect x="-400" y="-30" width="800" height="80" fill={`url(#${id}-cf)`} />
        </mask>
      </defs>
      <g clipPath={`url(#${id}-rclip)`}>
        <g mask={`url(#${id}-cm)`}>
          <path d={loops.join('')} fill="none" stroke={K.caustic} strokeWidth="0.45" strokeLinejoin="round" opacity={0.22} />
        </g>
      </g>
    </>
  );
};

/** contact shadow under the cement's edge, and the oyster's cast shadow down-right on the rock (light from the upper left) */
const Shadows: React.FC<{id: string; lw: number}> = ({id, lw}) => {
  const E = OY.E;
  return (
    <>
      <defs>
        <radialGradient id={`${id}-cs`}>
          <stop offset="0" stopColor={K.shadow} stopOpacity={0.42} />
          <stop offset="0.6" stopColor={K.shadow} stopOpacity={0.26} />
          <stop offset="1" stopColor={K.shadow} stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* the oyster's shadow on the crown, to the right of the broad end */}
      <ellipse cx="47" cy="-5.5" rx="11" ry="5" transform="rotate(14 47 -5.5)" fill={`url(#${id}-cs)`} />
      <ellipse cx="40" cy="0.5" rx="12" ry="3.2" fill={`url(#${id}-cs)`} />
      {/* occlusion just under the lobed edge: a soft band that follows the lobes, and a crisp dark seam under the ink */}
      <filter id={`${id}-sb`} filterUnits="userSpaceOnUse" x="-60" y="-8" width="120" height="20">
        <feGaussianBlur stdDeviation="0.75" />
      </filter>
      <path d={line([...shift(E, 0.2, 0.3), ...shift([...E].reverse(), 0.6, 2.4)]) + 'Z'} fill={K.shadow} opacity={0.32} filter={`url(#${id}-sb)`} />
      <path d={line(shift(E, 0, 0.35))} fill="none" stroke={K.shadow} strokeWidth={f(lw * 1.4)} strokeOpacity={0.3} />
    </>
  );
};

/** the oyster (cupped lower valve + lid) fused into its cement */
const Oyster: React.FC<{id: string; iw: number; lw: number}> = ({id, iw, lw}) => {
  const {lvD, lidD, cemD, lvRings, lidRings, lip, T, E, crease} = OY;
  // growth bands alternate: a purple-brown tinted band, then a paler one (nested fills accumulate toward the umbo)
  const bandTint = [rgba(K.shPurple, 0.3), rgba(K.shLit, 0.38), rgba(K.shBrown, 0.3), rgba(K.shLit, 0.4), rgba(K.shPurple, 0.22)];
  const lidTint = [rgba(K.sh, 0.2), rgba(K.shLit, 0.45), rgba(K.shPurple, 0.16), rgba(K.shLit, 0.45), rgba(K.shBrown, 0.14)];
  const edgeW = iw * OUTLINE_K * 1.6;
  return (
    <>
      <defs>
        <linearGradient id={`${id}-lv`} gradientUnits="userSpaceOnUse" x1="-34" y1="-22" x2="30" y2="-2">
          <stop offset="0" stopColor={K.shLit} />
          <stop offset="0.28" stopColor={K.shPale} />
          <stop offset="0.7" stopColor={K.sh} />
          <stop offset="1" stopColor={mix(K.sh, K.shDeep, 0.3)} />
        </linearGradient>
        {/* the cup turns under toward the rock and away from the light at the broad end */}
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
        <linearGradient id={`${id}-cfl`} gradientUnits="userSpaceOnUse" x1="-46" y1="0" x2="46" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.4} />
          <stop offset="0.15" stopColor="#FFFFFF" stopOpacity={0.1} />
          <stop offset="0.3" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="0.8" stopColor={K.cementShade} stopOpacity={0} />
          <stop offset="0.9" stopColor={K.cementShade} stopOpacity={0.3} />
          <stop offset="1" stopColor={K.cementShade} stopOpacity={0.45} />
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
        <clipPath id={`${id}-cc`}>
          <path d={cemD} />
        </clipPath>
        <filter id={`${id}-cb`} filterUnits="userSpaceOnUse" x="-60" y="-20" width="120" height="30">
          <feGaussianBlur stdDeviation="0.35" />
        </filter>
      </defs>
      {/* the cupped lower valve and its cement: one inked shape (the cement is fused to the shell, no contour between) */}
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
            {/* each lamella's free edge: a shade just outside it, a lit flaky roll just inside */}
            {lvRings.map((r, k) => (
              <g key={`e${k}`}>
                <path d={line(offset(r.pts, -lw * 2))} fill="none" stroke={K.shDeep} strokeWidth={f(lw * 3.4)} strokeOpacity={0.3} strokeLinejoin="round" />
                <path d={line(offset(r.pts, lw * 1.15))} fill="none" stroke={mix(K.shLit, '#FFFFFF', 0.3)} strokeWidth={f(lw * 1.15)} strokeOpacity={0.9} strokeLinejoin="round" />
              </g>
            ))}
            {/* the lid's teeth shade the cup just below the commissure */}
            <path d={line(offset(lip, -lw * 3.4))} fill="none" stroke={K.shDeep} strokeWidth={f(lw * 6)} strokeOpacity={0.42} strokeLinejoin="round" />
            <path d={line(offset(lip, -lw * 1.3))} fill="none" stroke={K.shDeep} strokeWidth={f(lw * 2.6)} strokeOpacity={0.45} strokeLinejoin="round" />
            {/* the beak catches the light */}
            <path d={line([pt(-35.0, -19.6), pt(-33.0, -17.3), pt(-30.2, -14.4)])} fill="none" stroke="#FFFFFF" strokeWidth={f(lw * 1.0)} strokeOpacity={0.55} strokeLinecap="round" />
          </g>
          <path d={OY.ligD} fill={K.shDeep} opacity={0.85} />
          {lvRings.map((r, k) => (
            <InkLine key={`i${k}`} d={r.d} w={lw * (0.85 - 0.1 * k)} opacity={0.75} />
          ))}
        </Deco>
        <InkPath d={cemD} fill={K.cement} />
        <Deco>
          <g clipPath={`url(#${id}-cc)`}>
            {/* the fillet: a cool, occluded crease at the shell, a bright glossy bulge, the thin cool edge on the rock */}
            <g filter={`url(#${id}-cb)`}>
              <path d={line(shift(T, 0, 0.2))} fill="none" stroke={K.cementCool} strokeWidth="1.9" strokeOpacity={0.75} strokeLinejoin="round" />
              <path d={line(shift(crease, 0.1, 1.9))} fill="none" stroke={K.cementLit} strokeWidth="1.3" strokeOpacity={0.95} strokeLinejoin="round" />
              <path d={line(shift(E, 0, -0.3))} fill="none" stroke={K.cementCool} strokeWidth="1.2" strokeOpacity={0.55} />
            </g>
            <path d={line(shift(T, 0, lw * 0.6))} fill="none" stroke={K.cementShade} strokeWidth={f(lw * 1.2)} strokeOpacity={0.45} strokeLinejoin="round" />
            <path d={cemD} fill={`url(#${id}-cfl)`} />
            <path d={OY.filHiL} fill="none" stroke="#FFFFFF" strokeWidth={f(lw * 1.4)} strokeOpacity={0.8} strokeLinecap="round" />
            <path d={OY.filHiR} fill="none" stroke="#FFFFFF" strokeWidth={f(lw * 0.9)} strokeOpacity={0.5} strokeLinecap="round" />
            {OY.lobeHi.map((d, i) => (
              <path key={i} d={d} fill="none" stroke="#FFFFFF" strokeWidth={f(lw * 1.1)} strokeOpacity={0.8} strokeLinecap="round" />
            ))}
          </g>
          {/* where the cement meets the shell: a soft crease, not a contour */}
          <path d={line(crease)} fill="none" stroke={mix(K.shDeep, INK, 0.3)} strokeWidth={f(lw * 0.75)} strokeOpacity={0.55} strokeLinejoin="round" />
          {/* wet glints */}
          {OY.glints.map((g, i) => (
            <ellipse key={i} cx={f(g.x)} cy={f(g.y)} rx={f(i === 0 ? 1.0 : 1.2)} ry="0.3" transform={`rotate(${i === 0 ? -48 : -4} ${f(g.x)} ${f(g.y)})`} fill="#FFFFFF" opacity={0.92} />
          ))}
          {/* the contact edge on the rock: one crisp ink line along the lobed edge (through the match point) */}
          <path d={line(E)} fill="none" stroke={INK} strokeWidth={f(edgeW)} strokeLinecap="round" strokeLinejoin="round" />
        </Deco>
      </Inked>
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
            {/* the lid's edge face along the lip: a darker band under the lit rim of the top */}
            <path d={OY.edgeFace} fill={K.sh} opacity={0.55} />
            <path d={line(offset(lip, lw * 1.4))} fill="none" stroke={K.shDeep} strokeWidth={f(lw * 2.3)} strokeOpacity={0.3} strokeLinejoin="round" />
            <path d={line(OY.lipRim)} fill="none" stroke="#FFFFFF" strokeWidth={f(lw * 0.8)} strokeOpacity={0.45} strokeLinejoin="round" />
          </g>
          <g clipPath={`url(#${id}-lidt)`}>
            {lidRings.map((r, k) => (
              <InkLine key={`i${k}`} d={r.d} w={lw * (0.7 - 0.07 * k)} opacity={0.6} />
            ))}
          </g>
          {/* small wet glosses */}
          <ellipse cx="-13" cy="-23.6" rx="2.4" ry="0.42" transform="rotate(-14 -13 -23.6)" fill="#FFFFFF" opacity={0.9} />
          <ellipse cx="-7.2" cy="-25.1" rx="0.7" ry="0.3" transform="rotate(-10 -7.2 -25.1)" fill="#FFFFFF" opacity={0.85} />
          <ellipse cx="22" cy="-26.2" rx="1.1" ry="0.26" transform="rotate(2 22 -26.2)" fill="#FFFFFF" opacity={0.6} />
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

const Reef: React.FC<{id: string}> = ({id}) => {
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
  const d = closed([pt(-120, 84), pt(-96, 72), pt(-74, 69), pt(-56, 76), pt(-44, 90), pt(-40, 112), pt(-60, 148), pt(-120, 158)], 1);
  const pebble = closed([pt(-38, 106), pt(-30, 100), pt(-22, 102), pt(-19, 110), pt(-26, 118), pt(-38, 116)], 1);
  return (
    <>
      <defs>
        <radialGradient id={`${id}-nr`} gradientUnits="userSpaceOnUse" cx="-70" cy="102" r="46" fx="-82" fy="80">
          <stop offset="0" stopColor={mix(K.rockDeep, C.sea, 0.25)} />
          <stop offset="0.7" stopColor={mix(K.rockDeep, C.seaDeep, 0.55)} />
          <stop offset="1" stopColor={mix(C.seaDeep, '#06141C', 0.4)} />
        </radialGradient>
      </defs>
      <path d={d} fill={`url(#${id}-nr)`} />
      <path d={pebble} fill={mix(K.rockDeep, C.seaDeep, 0.45)} />
      <path d={open([pt(-104, 76), pt(-84, 70.6), pt(-66, 71.6)], 1)} fill="none" stroke={mix(K.rockLit, C.seaLit, 0.4)} strokeWidth="2.2" strokeLinecap="round" opacity={0.45} />
    </>
  );
};

// ------------------------------------------------------------------ the world
/**
 * The underwater oyster world, full frame (1080×1920). Draws its own background and every depth layer.
 * `t` is the film time in seconds (designed for 7.9..10.4, continuous outside it); `cam` frames the world in mm.
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
        <Reef id={`${id}-rf`} />
      </Layer>
      {motes((m) => m.z >= 100 && m.z < 250)}
      <Layer c={cam} z={45} blurK={8} maxBlur={4}>
        <MoteField t={t} cam={cam} m={MOTES[2]} />
        <Bubbles t={t} cam={cam} z={45} seed={3} every={1.05} xs={[-95, 90]} y0={14} rr={[0.55, 1.2]} />
      </Layer>
      <Layer c={cam} z={22} blurK={14} maxBlur={6}>
        <Bits t={t} z={22} seed={7} n={3} ys={[-70, -30]} size={5} iw={iw} />
      </Layer>
      <Layer c={cam} z={0}>
        <RockBody id={`${id}-r`} cam={cam} iw={iw} lw={lw} />
      </Layer>
      <Layer c={cam} z={0} blurK={0} minBlur={0.3 * pxPerMm(cam)}>
        <Caustics id={`${id}-k`} t={t} cam={cam} />
      </Layer>
      <Layer c={cam} z={0}>
        <FrontScene id={`${id}-m`} t={t} cam={cam} iw={iw} lw={lw} />
      </Layer>
      {motes((m) => m.z <= 0 && m.z > -30)}
      {d0 - 6 > 0.3 * d0 && (
        <Layer c={cam} z={-6} blurK={30} maxBlur={5}>
          <Silt t={t} cam={cam} z={-6} seed={2} n={34} xs={[-85, 15]} r={[0.25, 0.6]} a={0.55} />
        </Layer>
      )}
      {d0 - 30 > 0.3 * d0 && (
        <Layer c={cam} z={-30} blurK={90} maxBlur={12}>
          <NearRock id={`${id}-nr`} />
        </Layer>
      )}
      {motes((m) => m.z <= -30)}
      {d0 - 14 > 0.3 * d0 && (
        <Layer c={cam} z={-14} blurK={30} maxBlur={10}>
          <Bubbles t={t} cam={cam} z={-14} seed={17} every={2.3} xs={[30, 70]} y0={60} rr={[1.1, 1.7]} />
          <Bits t={t} z={-14} seed={3} n={2} ys={[-40, -12]} size={7} iw={iw} />
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

const FrontScene: React.FC<{id: string; t: number; cam: Cam; iw: number; lw: number}> = ({id, t, cam, iw, lw}) => (
  <>
    <Shadows id={`${id}-s`} lw={lw} />
    {/* weed and bubbles rooted on the crown behind the oyster */}
    <Seaweed t={t} base={pt(-42.5, crownY(-42.5) + 2.6)} len={44} wid={2.2} lean={-0.32} seed={2.1} iw={iw * 0.8} lw={lw} />
    <Seaweed t={t} base={pt(-47.5, crownY(-47.5) + 3.4)} len={30} wid={1.8} lean={-0.5} seed={6.6} iw={iw * 0.8} lw={lw} />
    <Seaweed t={t} base={pt(44.5, crownY(44.5) + 2.8)} len={34} wid={2.0} lean={0.08} seed={5.3} iw={iw * 0.8} lw={lw} />
    <Tuft t={t} c={pt(-54, crownY(-54) + 2.5)} n={5} size={3.4} seed={2} />
    <Bubbles t={t} cam={cam} z={0} seed={29} every={0.22} xs={[-39.6, -39.2]} y0={crownY(-39.4) + 1.6} rr={[0.42, 0.85]} vr={[13, 18]} kS={0.95} />
    <Oyster id={`${id}-o`} iw={iw} lw={lw} />
    {/* weed and tufts on the rock in front */}
    <Tuft t={t} c={pt(-31, 17)} n={5} size={3.0} seed={1} />
    <Tuft t={t} c={pt(62, 4.5)} n={6} size={4.0} seed={3} />
    <Seaweed t={t} base={pt(-58, 9)} len={74} wid={3.0} lean={-0.22} seed={0.4} iw={iw * 0.85} lw={lw} />
    <Seaweed t={t} base={pt(60, 12)} len={58} wid={2.8} lean={0.02} seed={4.2} iw={iw * 0.85} lw={lw} />
  </>
);

/** the match point and the extent of the attachment boundary, for the film's match cut:
 *  point = (0, 0), on the cement's contact edge; base = the shell's cemented span [x0, x1]; cement = the contact edge's
 *  span [x0, x1]; edgeY(x) = the contact edge's y at x (wavy, edgeY(0) = 0, ~+2 mm at the ends). */
export const OYSTER_MATCH = {point: pt(0, 0), base: OY.base, cement: OY.EX, edgeY: OY.edgeY};
