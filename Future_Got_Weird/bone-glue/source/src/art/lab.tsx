// V3 (B): the lab and the droplet (film t ≈ 3.72–7.13 s, "Researchers actually did it. They developed an experimental
// glue"). A lab bench seen from the front and above (a high three-quarter view, elevation EL): a sawn segment of long
// bone lying on a white bench pad, its axis pointing away from the lens, a transverse crack across its top; a 400 mL
// beaker of seawater behind it; the researcher's two gloved hands (blue nitrile over white lab-coat sleeves). No figure,
// no text, no labels.
//
// API
//   LabWorld({id, t, cam, st})   the whole lab, full frame (1080×1920), at film time t (ambient motion only) through the
//                                camera cam (world mm, depth 0), in the state st (LabState below).
//   LabState {bead, press, drop, fall, plunge, move?}  every field 0..1:
//     bead    how far the bead has been laid along the crack, from its left end (0) to its right end (1). The nozzle tip
//             rides at the bead's leading end; BEAD_MATCH is the value at the match cut.
//     press   the left hand's pinch: the far half slides onto the near half, closing the crack (1.16 -> 0.3 mm at the
//             crown) and squeezing the bead into a thin band with a little squeeze-out on both lips.
//     move    the right hand lifts the syringe off the bone and carries it over the beaker (default: ss(drop, 0, 0.4),
//             so the integrator may drive it with drop alone; pass it to time the move separately).
//     drop    a droplet swells at the nozzle (0 = none, 0.6 = a hanging drop, 0.8-1 a pendant teardrop with a thinning
//             neck; it detaches at 1).
//     fall    the free fall from the nozzle to the water surface: height = D * fall^2, so a fall driven linearly in time
//             accelerates (uniform gravity; at the suggested 0.43 s it is a ~4x slow-motion of the real 48 mm drop).
//     plunge  after entry: the drop sinks (decelerating), ripples spread on the surface, entrained bubbles rise, and the
//             water grades from lab seawater to the oyster world's sea (backdrop gradient, sun glow, shafts, motes,
//             vignette as OysterWorld at OY_CAM_IN). At plunge 1 with the camera at LAB_PLUNGE the frame is all water.
//   Cameras: LAB_MATCH (the bead on the wrist glue band's screen line), LAB_WIDE (hands, specimen, beaker), LAB_PRESS (a
//            gentle push toward the specimen during the press), LAB_DROP (the drop forming at the nozzle over the beaker),
//            LAB_PLUNGE (under the surface, inside the beaker).
//   labSuggest(t) -> {cam, st}: the suggested timing of the whole scene on the beat map (see LAB_T), for the integrator to
//            use as is or adapt; beadAt(t) and pullEase are its bead curve and pull-back ease. labDropPos(st) gives the
//            drop's world position (for a custom follow camera).
//
// THE MATCH. production/v2_match_band.json holds the wrist glue band's screen outline at the wrist's MATCH framing. Its
// glueTop / glueBottom / faceTop / faceBottom rows are mapped into this world through LAB_MATCH (very lightly smoothed,
// σ 2.5 px, as the oyster's cement band) and used as the bead's edges and the crack's faces there, so at LAB_MATCH the
// bead lies on the same screen line with the same thickness and waviness, cream bone above and below, a tan broken
// lip each side, the same three gel tones and one highlight. Beyond the json's span the band follows the crack's arc
// over the shaft with the same mean thickness and a gentle wave. The json is read at build time.
//
// Picture plane: x right, y down, millimetres; proj(X, Y, Z) maps the bench's 3D frame (X right, Y away from the lens,
// Z up) into it, the crack's crown at (0, 0). Contours are a constant on-screen width (non-scaling strokes). Light from
// the upper left. Deterministic.
import React from 'react';
import {Cam, Layer, W, H, toWorld, viewRect, zoomAbout, travel} from '../camera';
import {C, INK} from './palette';
import {P, pt, add, sub, mul, nrm, perp, len, lerpP, open, closed, poly, n4} from '../core/geo';
import {mix, rgba, lit, shade} from '../core/color';
import {clamp, ss, ss5, lerp, hash, noise1} from '../lib';
import {GloveHand, GripPose, Digit, farPose, curled, MCP, fingerR, THUMB_R, screenDown, toHand, FAR_UV, SURGEON, NsStyle, NSCLASS} from './surgeon';
import BAND from '../../../production/v2_match_band.json';

const f = n4;
const DEG = Math.PI / 180;
const NS = 'non-scaling-stroke' as const;
const TAU = Math.PI * 2;
/** toward the key light (upper left) */
const LIGHT = nrm(pt(-0.62, -0.78));
const Pf = (p: P) => `${f(p.x)} ${f(p.y)}`;
const dirA = (a: number): P => pt(Math.cos(a), Math.sin(a));

// ------------------------------------------------------------------ the view and the bench
/** the camera's elevation above the bench */
const EL = 50 * DEG;
const SE = Math.sin(EL), CE = Math.cos(EL);
/** the specimen: a sawn segment of a long bone's metaphysis (cortex ring, cancellous core), lying on the bench with its
 *  axis pointing away from the lens, its near cut face toward the camera; the crack runs round the shaft at Y = 0 */
export const SPEC = {R: 34, yNear: -34, yFar: 44, cortex: 5};
const R = SPEC.R;
/** bench 3D (X right, Y away, Z up; mm) -> the picture plane; the crack's crown (0, 0, 2R) lands on (0, 0) */
export const proj = (X: number, Y: number, Z: number): P => pt(X, (2 * R - Z) * CE - Y * SE);
/** the crack's line over the shaft (the upper half of the section circle at Y = 0) */
const archY = (x: number) => R * CE * (1 - Math.sqrt(Math.max(0, 1 - (x / R) ** 2)));
/** the beaker (Griffin, 400 mL): centre on the bench, outer radius, height, water height, glass, base */
export const BEAKER = {X: -14, Y: 135, R: 38, h: 110, water: 80, glass: 1.5, base: 4};
const B = BEAKER;
const RI = B.R - B.glass;
const ellAt = (Z: number) => proj(B.X, B.Y, Z);
const Y_SURF = ellAt(B.water).y;
/** the syringe's nozzle over the beaker while the drop forms (3D height 128 mm: 18 mm above the rim) */
const TIP_DROP = proj(B.X - 0.4, B.Y, 128);

// ------------------------------------------------------------------ colours
const K = {
  // a dark slate epoxy-resin bench top (the white pad, the bone, the gloves and the glass read against it)
  bench: '#46525A',
  benchLit: '#5D6A72',
  benchDeep: '#2C363D',
  pad: '#F7F7F3',
  padLit: '#FFFFFD',
  padShade: '#E1E3DF',
  padEdge: '#C9CEC9',
  shadow: '#141B20',
  gap: '#2B1C16',
  strip: mix(C.cancellous, C.boneShade, 0.25),
  stripLit: mix(C.cancellous, C.boneLit, 0.3),
  stripPore: mix(C.cancellousPore, C.boneDeep, 0.3),
  coat: '#F3F5F7',
  coatLit: '#FFFFFF',
  coatShade: '#CBD3DB',
  coatDeep: '#9EABB8',
  glass: '#DCEEF2',
  glassEdge: '#7E98A6',
  labWater: '#8FD0CC',
  labWaterTop: '#B4E4DF',
  labWaterDeep: '#5DA6A6',
  surf: '#BFE9E4',
  mote: '#DDF6F0',
  plastic: '#EEF3F5',
};
// the gel (as fracture.tsx)
const LIP = mix(C.glue, C.glueLit, 0.42);
const CORE = mix(C.glue, C.glueDeep, 0.16);
const DEEP = mix(C.glueDeep, CORE, 0.36);
const FRESH_LIP = mix(C.glueLit, '#FFFFFF', 0.3);
const GLUE_EDGE = mix(C.glueInk, C.glueDeep, 0.3);
/** contour width (screen px; half shows outside a silhouette), as the instruments and the surgeon */
const INK_PX = 5.6;

// ------------------------------------------------------------------ small helpers
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
const ellPts = (c: P, rx: number, ry: number, a0: number, a1: number, n = 48): P[] => {
  const out: P[] = [];
  for (let i = 0; i <= n; i++) {
    const a = lerp(a0, a1, i / n);
    out.push(pt(c.x + rx * Math.cos(a), c.y + ry * Math.sin(a)));
  }
  return out;
};
const pl = (ps: P[]) => 'M' + ps.map(Pf).join('L');
const blob = (c: P, rx: number, ry: number, seed: number, n = 9, wob = 0.22): P[] => {
  const out: P[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const k = 1 + wob * (0.6 * Math.sin(2 * a + seed * 1.3) + 0.4 * (hash(seed * 7.7 + i * 3.1) * 2 - 1));
    out.push(pt(c.x + Math.cos(a) * rx * k, c.y + Math.sin(a) * ry * k));
  }
  return out;
};
/** a silhouette's ink underlay: filled navy plus a constant-width navy stroke */
const Under: React.FC<{d: string; w?: number; color?: string; opacity?: number}> = ({d, w = INK_PX, color = INK, opacity}) => (
  <path d={d} fill={color} stroke={color} strokeWidth={w} strokeLinejoin="round" vectorEffect={NS} opacity={opacity} />
);
const Ln: React.FC<{d: string; w: number; color?: string; opacity?: number; cap?: 'round' | 'butt'}> = ({d, w, color = INK, opacity, cap = 'round'}) => (
  <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap={cap} strokeLinejoin="round" vectorEffect={NS} opacity={opacity} />
);
/** a profile (solid of revolution seen side on) [[u, r], ...] in an axis frame */
const profile = (pr: [number, number][]) => `M${pr.map(([u, r]) => `${f(u)} ${f(-r)}`).join('L')}L${[...pr].reverse().map(([u, r]) => `${f(u)} ${f(r)}`).join('L')}Z`;
const rect = (u0: number, u1: number, v0: number, v1: number) => `M${f(u0)} ${f(v0)}H${f(u1)}V${f(v1)}H${f(u0)}Z`;
const rrect = (u0: number, u1: number, v0: number, v1: number, r: number) => {
  const rr = Math.min(r, Math.abs(u1 - u0) / 2, Math.abs(v1 - v0) / 2);
  return `M${f(u0 + rr)} ${f(v0)}H${f(u1 - rr)}A${f(rr)} ${f(rr)} 0 0 1 ${f(u1)} ${f(v0 + rr)}V${f(v1 - rr)}A${f(rr)} ${f(rr)} 0 0 1 ${f(u1 - rr)} ${f(v1)}H${f(u0 + rr)}A${f(rr)} ${f(rr)} 0 0 1 ${f(u0)} ${f(v1 - rr)}V${f(v0 + rr)}A${f(rr)} ${f(rr)} 0 0 1 ${f(u0 + rr)} ${f(v0)}Z`;
};
const CylGrad: React.FC<{id: string; r: number; vs: number; stops: [number, string, number?][]}> = ({id, r, vs, stops}) => (
  <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={f(vs * r)} x2="0" y2={f(-vs * r)}>
    {stops.map(([o, c, a], i) => (
      <stop key={i} offset={o} stopColor={c} stopOpacity={a ?? 1} />
    ))}
  </linearGradient>
);
const SoftSpot: React.FC<{id: string; c: P; rx: number; ry: number; a: number; color?: string; rot?: number}> = ({id, c, rx, ry, a, color = K.shadow, rot = 0}) => (
  <g>
    <defs>
      <radialGradient id={id}>
        <stop offset="0" stopColor={color} stopOpacity={a} />
        <stop offset="0.55" stopColor={color} stopOpacity={a * 0.6} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={f(c.x)} cy={f(c.y)} rx={f(rx)} ry={f(ry)} fill={`url(#${id})`} transform={rot ? `rotate(${f(rot)} ${f(c.x)} ${f(c.y)})` : undefined} />
  </g>
);

// ------------------------------------------------------------------ the match: the json band mapped through LAB_MATCH
type Row = {centre: number[]; glueTop: number[]; glueBottom: number[]; faceTop: number[]; faceBottom: number[]};
const ROWS: Row[] = (BAND as unknown as {rows: Row[]}).rows;
/** the match point's x on the crack: there the arc's slope equals the json band's trend */
const X_M = -3;
export const LAB_W_MATCH = 10;
/** mm per screen px at LAB_MATCH */
const SPX = LAB_W_MATCH / W;
const MATCH_Y = yOn(ROWS.map((r) => pt(r.centre[0], r.centre[1])), W / 2);
/** the match framing: the json band's centre at screen x 540 lies on the crack at X_M */
export const LAB_MATCH: Cam = {x: X_M, y: archY(X_M) - (MATCH_Y - H / 2) * SPX, w: LAB_W_MATCH, k: 1, focus: 0};
const toW = (q: number[]) => pt(LAB_MATCH.x + (q[0] - W / 2) * SPX, LAB_MATCH.y + (q[1] - H / 2) * SPX);
const smoothEdge = (raw: P[], sigma = 2.5 * SPX): P[] => {
  const ps = [...raw].sort((a, b) => a.x - b.x);
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
const J = {
  gT: smoothEdge(ROWS.map((r) => toW(r.glueTop))),
  gB: smoothEdge(ROWS.map((r) => toW(r.glueBottom))),
  fT: smoothEdge(ROWS.map((r) => toW(r.faceTop))),
  fB: smoothEdge(ROWS.map((r) => toW(r.faceBottom))),
};
const JX0 = Math.max(...Object.values(J).map((e) => e[0].x));
const JX1 = Math.min(...Object.values(J).map((e) => e[e.length - 1].x));
/** the json band relative to the arc: mean centre offset and slope, mean thickness, the gel's mean overlap past each face */
const FIT = (() => {
  const xs: number[] = [];
  for (let x = JX0; x <= JX1; x += 0.04) xs.push(x);
  const mid = xs.map((x) => (yOn(J.gT, x) + yOn(J.gB, x)) / 2 - archY(x));
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = mid.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0;
  xs.forEach((x, i) => {
    sxy += (x - mx) * (mid[i] - my);
    sxx += (x - mx) ** 2;
  });
  const b = sxy / sxx;
  const avg = (g: (x: number) => number) => xs.reduce((a, x) => a + g(x), 0) / n;
  return {
    a: my - b * mx,
    b,
    h: avg((x) => yOn(J.gB, x) - yOn(J.gT, x)),
    oT: avg((x) => yOn(J.fT, x) - yOn(J.gT, x)),
    oB: avg((x) => yOn(J.gB, x) - yOn(J.fB, x)),
  };
})();
const wig = (x: number) => 0.12 * Math.sin(2.1 * x + 0.4) + 0.05 * Math.sin(4.6 * x + 1.9);
const thick = (x: number) => FIT.h * (1 + 0.07 * Math.sin(0.9 * x + 2.1) + 0.05 * Math.sin(3.1 * x));
/** weight of the json inside its span (eased over 0.6 mm at each end: just outside the match frame) */
const jw = (x: number) => ss(x, JX0, JX0 + 0.6) * ss(JX1 - x, 0, 0.6);
type EdgeKey = 'gT' | 'gB' | 'fT' | 'fB';
/** an edge's vertical offset from the arc at x (the crack's gap is along the shaft: vertical in the picture) */
const dev = (e: EdgeKey, x: number) => {
  const mid = FIT.a + FIT.b * x + wig(x);
  const h = thick(x);
  const proc = e === 'gT' ? mid - h / 2 : e === 'gB' ? mid + h / 2 : e === 'fT' ? mid - h / 2 + FIT.oT : mid + h / 2 - FIT.oB;
  const w = jw(x);
  return w < 1e-4 ? proc : lerp(proc, yOn(J[e], x) - archY(x), w);
};
/** the broken lips (chamfers) outside the gel: their widths (mm) */
const cwT = (x: number) => 0.4 + 0.07 * Math.sin(1.7 * x + 0.3) + 0.04 * Math.sin(5.3 * x + 1);
const cwB = (x: number) => 0.38 + 0.06 * Math.sin(1.3 * x + 2) + 0.04 * Math.sin(4.1 * x);
/** how far the far half slides onto the near half at press 1 (picture mm at the crown) */
const DP = 0.85;

// the crack's samples: fine over the match region, coarser elsewhere (angles round the shaft)
const TH: number[] = (() => {
  const out: number[] = [];
  let th = -Math.PI / 2;
  while (th < Math.PI / 2) {
    out.push(th);
    const x = R * Math.sin(th);
    th += Math.abs(x - X_M) < 7.5 ? 0.002 : 0.01;
  }
  out.push(Math.PI / 2);
  return out;
})();
type CP = {th: number; x: number; c: P; rT: P; fT: P; gT: P; gB: P; fB: P; rB: P};
const crackPt = (th: number, press: number): CP => {
  const x = R * Math.sin(th);
  const y0 = archY(x);
  const fs = DP * press;
  // the squeeze: the gel rides up onto the lips (a little more where the noise says), the far lip comes down
  const sq = press * (0.14 + 0.1 * (noise1(x * 2.3, 5) + 1));
  const gT0 = dev('gT', x), gB0 = dev('gB', x), fT0 = dev('fT', x), fB0 = dev('fB', x);
  return {
    th, x, c: pt(x, y0),
    rT: pt(x, y0 + gT0 - cwT(x) + fs),
    fT: pt(x, y0 + fT0 + fs),
    gT: pt(x, y0 + gT0 + 0.55 * fs - sq),
    gB: pt(x, y0 + gB0 + 0.12 * fs + sq * 0.8),
    fB: pt(x, y0 + fB0),
    rB: pt(x, y0 + gB0 + cwB(x)),
  };
};
/** the bead's leading end (angle round the shaft) for a bead value */
const beadTh = (bead: number) => -Math.PI / 2 + Math.PI * clamp(bead);
/** the bead value at the match cut: the nozzle tip 1.9 mm beyond the match frame's right edge */
export const BEAD_MATCH = (Math.asin((X_M + LAB_W_MATCH / 2 + 1.9) / R) + Math.PI / 2) / Math.PI;

// ------------------------------------------------------------------ state
export type LabState = {bead: number; press: number; drop: number; fall: number; plunge: number; move?: number};
export const LAB_START: LabState = {bead: BEAD_MATCH, press: 0, drop: 0, fall: 0, plunge: 0};
const moveOf = (st: LabState) => clamp(st.move ?? ss(st.drop, 0, 0.4));

// ------------------------------------------------------------------ the syringe (a lab dispensing syringe, tapered tip)
/** mm along the syringe from the nozzle tip (s): a translucent tapered dispensing tip on a Luer hub, a clear barrel of
 *  teal gel, finger flange, rubber stopper, white plunger rod and thumb pad */
const SYR = {nozzle: 14, hub: 20, nose: 24, barrelEnd: 80, flangeEnd: 82.4, rB: 6.2, rIn: 5.3, flangeW: 12, stopT: 4.5, rod: 50, rodW: 3.0, padR: 7.2, padT: 2.4, in0: 26, inLen: 48, tipR: 0.8};
const SYR_GRIP = (SYR.barrelEnd + SYR.flangeEnd) / 2;
type SyrState = {tip: P; ang: number; pl: number};
const stopperS = (pl: number) => SYR.in0 + SYR.inLen * (1 - clamp(pl));
const syrAt = (s: SyrState, u: number) => add(s.tip, mul(dirA(s.ang), u));

/** the syringe's pose for a state: on the crack at the bead's end while laying (the barrel trailing down-right toward
 *  the hand), then lifted and carried over the beaker, turned a little flatter */
const syringeOf = (st: LabState): SyrState => {
  const th = beadTh(st.bead);
  const e = crackPt(th, 0);
  const onBead = pt(e.x + 0.12, (e.gT.y + e.gB.y) / 2 - 0.05);
  const m = ss5(moveOf(st), 0, 1);
  // the lift: up off the bone, then over toward the beaker (a quadratic arc)
  const A = onBead, Bp = TIP_DROP;
  const ctrl = pt(lerp(A.x, Bp.x, 0.25) + 8, Bp.y + 26);
  const q = (u: number) => add(add(mul(A, (1 - u) * (1 - u)), mul(ctrl, 2 * u * (1 - u))), mul(Bp, u * u));
  const tip = m <= 0 ? A : q(m);
  const ang = lerp(lerp(60, 74, ss(st.bead, 0.45, 1)), 32, ss(m, 0.1, 0.9)) * DEG;
  // the plunger travel: pressed as the bead is laid, a touch more as the drop forms
  const pl = 0.3 + 0.22 * clamp(st.bead) + 0.07 * ss(st.drop, 0.1, 0.9);
  return {tip, ang, pl};
};

const Syringe: React.FC<{id: string; s: SyrState}> = ({id, s}) => {
  const angD = s.ang / DEG;
  // light in the axis frame: which edge of each cylinder is lit
  const Lf = pt(LIGHT.x * Math.cos(s.ang) + LIGHT.y * Math.sin(s.ang), -LIGHT.x * Math.sin(s.ang) + LIGHT.y * Math.cos(s.ang));
  const vs = Lf.y >= 0 ? 1 : -1;
  const sF = stopperS(s.pl), sB = sF + SYR.stopT, sPad = sB + SYR.rod;
  const id_ = (k: string) => `${id}-${k}`;
  const nozD = profile([[0, SYR.tipR], [0.35, SYR.tipR + 0.06], [SYR.nozzle - 0.6, 2.15], [SYR.nozzle, 2.35]]);
  const hubD = profile([[SYR.nozzle, 3.1], [SYR.nozzle + 0.6, 3.4], [SYR.hub - 2.2, 3.4], [SYR.hub - 2.2, 3.95], [SYR.hub, 3.95]]);
  const barrelD = profile([[SYR.hub, 2.6], [SYR.hub + 0.4, 2.7], [SYR.nose - 1.1, 5.6], [SYR.nose, SYR.rB], [SYR.barrelEnd, SYR.rB]]);
  const flangeD = rrect(SYR.barrelEnd - 0.2, SYR.flangeEnd, -SYR.flangeW, SYR.flangeW, 1.3);
  const rodD = rect(SYR.flangeEnd - 0.3, sPad + 0.2, -SYR.rodW, SYR.rodW);
  const padD = rrect(sPad, sPad + SYR.padT, -SYR.padR, SYR.padR, 1.1);
  const gelD = profile([[0.2, 0.42], [SYR.nozzle - 0.6, 1.35], [SYR.nozzle, 1.4], [SYR.hub, 1.6], [SYR.nose - 1.1, 4.7], [SYR.nose + 0.2, SYR.rIn], [sF + 0.25, SYR.rIn]]);
  return (
    <g transform={`translate(${Pf(s.tip)}) rotate(${f(angD)})`}>
      <defs>
        <CylGrad id={id_('br')} r={SYR.rB} vs={vs} stops={[[0, '#FFFFFF', 0.85], [0.18, lit(C.barrel, 0.6), 0.55], [0.5, C.barrel, 0.3], [0.85, mix(C.barrel, C.steelDeep, 0.35), 0.45], [1, mix(C.barrel, C.steelDeep, 0.6), 0.7]]} />
        <CylGrad id={id_('nz')} r={2.35} vs={vs} stops={[[0, '#FFFFFF', 0.95], [0.3, K.plastic, 0.75], [0.7, mix(K.plastic, '#9FB3BE', 0.35), 0.7], [1, mix(K.plastic, '#7F95A2', 0.55), 0.85]]} />
        <CylGrad id={id_('hb')} r={3.95} vs={vs} stops={[[0, '#FFFFFF'], [0.3, K.plastic], [0.75, mix(K.plastic, '#9FB3BE', 0.45)], [1, mix(K.plastic, '#7F95A2', 0.6)]]} />
        <CylGrad id={id_('gl')} r={SYR.rIn} vs={vs} stops={[[0, C.glueLit], [0.22, mix(C.glueLit, C.glue, 0.5)], [0.55, C.glue], [0.86, C.glueDeep], [1, shade(C.glueDeep, 0.2)]]} />
        <CylGrad id={id_('rd')} r={SYR.rodW} vs={vs} stops={[[0, '#FFFFFF'], [0.35, C.plunger], [0.75, mix(C.plunger, '#AEBBC6', 0.6)], [1, mix(C.plunger, '#8C9AA6', 0.7)]]} />
        <CylGrad id={id_('pd')} r={SYR.padR} vs={vs} stops={[[0, '#FFFFFF'], [0.3, C.plunger], [0.8, mix(C.plunger, '#A9B6C1', 0.7)], [1, mix(C.plunger, '#8C9AA6', 0.8)]]} />
        <CylGrad id={id_('st')} r={SYR.rIn} vs={vs} stops={[[0, lit(C.stopper, 0.35)], [0.3, C.stopper], [1, shade(C.stopper, 0.45)]]} />
        <CylGrad id={id_('fl')} r={SYR.flangeW} vs={vs} stops={[[0, '#FFFFFF', 0.95], [0.3, lit(C.barrel, 0.4), 0.9], [0.7, C.barrel, 0.85], [1, mix(C.barrel, C.steelDeep, 0.5), 0.9]]} />
        <clipPath id={id_('bc')}>
          <path d={barrelD} />
        </clipPath>
        <clipPath id={id_('nc')}>
          <path d={nozD} />
        </clipPath>
      </defs>
      {/* rod and thumb pad */}
      <Under d={rodD} />
      <Under d={padD} />
      <path d={rodD} fill={`url(#${id_('rd')})`} />
      <path d={rect(SYR.flangeEnd, sPad, -0.55, 0.55)} fill={mix(C.plunger, '#9AA8B4', 0.55)} />
      <path d={rect(SYR.flangeEnd, sPad, vs * 0.55 - 0.2, vs * 0.55 + 0.2)} fill="#FFFFFF" opacity={0.9} />
      <path d={padD} fill={`url(#${id_('pd')})`} />
      <path d={rrect(sPad + 0.45, sPad + SYR.padT - 0.6, vs > 0 ? 1.4 : -SYR.padR + 1.6, vs > 0 ? SYR.padR - 1.6 : -1.4, 0.4)} fill="#FFFFFF" opacity={0.85} />
      {/* flange, hub and nozzle silhouettes */}
      <Under d={flangeD} />
      <Under d={hubD} />
      <Under d={nozD} />
      {/* the clear barrel: a pale base, the stopper and rod inside, the gel column, the wall */}
      <path d={barrelD} fill={mix(C.barrel, '#8FA9B8', 0.18)} opacity={0.42} />
      <g clipPath={`url(#${id_('bc')})`}>
        <path d={rect(sB, SYR.barrelEnd + 0.2, -SYR.rodW, SYR.rodW)} fill={`url(#${id_('rd')})`} opacity={0.85} />
        <path d={gelD} fill={`url(#${id_('gl')})`} />
        {[0.24, 0.52, 0.77].map((k, i) => (
          <circle key={i} cx={f(SYR.nose + 3 + k * (sF - SYR.nose - 6))} cy={f((i % 2 ? -1 : 1) * vs * (0.8 + i * 0.9))} r={f(0.36 + 0.14 * i)} fill={C.glueShine} opacity={0.55} />
        ))}
        <path d={rect(SYR.nose + 0.6, sF - 0.4, vs * SYR.rIn * 0.62 - 0.4, vs * SYR.rIn * 0.62 + 0.4)} fill={C.glueShine} opacity={0.55} />
        <path d={`M${f(sF)} ${f(-SYR.rIn)}H${f(sB)}V${f(SYR.rIn)}H${f(sF)}Q${f(sF + 1)} 0 ${f(sF)} ${f(-SYR.rIn)}Z`} fill={`url(#${id_('st')})`} />
        {[0.5, 3.0].map((k, i) => (
          <path key={i} d={rrect(sF + k, sF + k + 1.2, -SYR.rIn - 0.2, SYR.rIn + 0.2, 0.5)} fill={shade(C.stopper, 0.25)} />
        ))}
      </g>
      <path d={barrelD} fill={`url(#${id_('br')})`} />
      <path d={rect(SYR.nose + 1, SYR.barrelEnd - 0.6, vs * SYR.rB * 0.84 - 0.45, vs * SYR.rB * 0.84 + 0.45)} fill="#FFFFFF" opacity={0.92} />
      <path d={rect(SYR.nose + 3, SYR.barrelEnd - 3, -vs * SYR.rB * 0.8 - 0.25, -vs * SYR.rB * 0.8 + 0.25)} fill="#FFFFFF" opacity={0.4} />
      {/* faint graduation ticks (no numbers) */}
      {Array.from({length: Math.floor((SYR.barrelEnd - SYR.nose - 8) / 4.8)}).map((_, i) => {
        const uu = SYR.nose + 5 + i * 4.8;
        const L = i % 4 === 0 ? 3 : 1.7;
        return <path key={i} d={rect(uu - 0.15, uu + 0.15, -vs * (SYR.rB - 0.4), -vs * (SYR.rB - 0.4 - L))} fill={C.steelDeep} opacity={0.35} />;
      })}
      <Ln d={barrelD} w={INK_PX * 0.5} />
      <path d={flangeD} fill={`url(#${id_('fl')})`} />
      <path d={rect(SYR.barrelEnd + 0.4, SYR.flangeEnd - 0.5, vs > 0 ? 1 : -SYR.flangeW + 1.3, vs > 0 ? SYR.flangeW - 1.3 : -1)} fill="#FFFFFF" opacity={0.75} />
      {/* the Luer hub (with its lugs) and the translucent tapered tip, gel showing in its bore */}
      <path d={hubD} fill={`url(#${id_('hb')})`} />
      <path d={rect(SYR.nozzle + 1.2, SYR.hub - 2.6, vs * 2.2 - 0.25, vs * 2.2 + 0.25)} fill="#FFFFFF" opacity={0.9} />
      {[SYR.nozzle + 2.2, SYR.nozzle + 3.4].map((u, i) => (
        <path key={i} d={rect(u - 0.12, u + 0.12, -3.3, 3.3)} fill={mix(K.plastic, '#7F95A2', 0.5)} opacity={0.6} />
      ))}
      <path d={nozD} fill={mix(K.plastic, '#A7BAC4', 0.2)} />
      <g clipPath={`url(#${id_('nc')})`}>
        <path d={profile([[-0.2, 0.46], [SYR.nozzle - 0.6, 1.3], [SYR.nozzle + 0.2, 1.36]])} fill={C.glue} />
        <path d={profile([[-0.2, 0.2], [SYR.nozzle, 0.55]])} fill={C.glueLit} opacity={0.55} transform={`translate(0 ${f(vs * 0.25)})`} />
      </g>
      <path d={nozD} fill={`url(#${id_('nz')})`} />
      <path d={`M${f(1.2)} ${f(vs * 0.62)}L${f(SYR.nozzle - 1)} ${f(vs * 1.62)}`} stroke="#FFFFFF" strokeWidth={0.32} strokeLinecap="round" opacity={0.85} />
      {/* the orifice: a bright ring round the bore, gel inside */}
      <ellipse cx="0" cy="0" rx={f(SYR.tipR * 0.34)} ry={f(SYR.tipR)} fill={mix(K.plastic, '#FFFFFF', 0.4)} />
      <ellipse cx="0" cy="0" rx={f(SYR.tipR * 0.2)} ry={f(SYR.tipR * 0.58)} fill={C.glueDeep} />
      <ellipse cx="0" cy="0" rx={f(SYR.tipR * 0.34)} ry={f(SYR.tipR)} fill="none" stroke={INK} strokeWidth={INK_PX * 0.32} vectorEffect={NS} opacity={0.6} />
    </g>
  );
};

// ------------------------------------------------------------------ the researcher's hands
const L_H = SURGEON.hand;
const CUFF = {len: 40, r0: 0.158 * SURGEON.hand, r1: 27.5};
const L3 = (a: [number, number], b: [number, number], t: number, dv: number): [number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + dv];
const handFrame = (wrist: P, angDeg: number, ts: 1 | -1) => {
  const d = dirA(angDeg * DEG);
  const n = perp(d);
  return {d, n, at: (u: number, v: number) => add(wrist, add(mul(d, u * L_H), mul(n, v * L_H * ts)))};
};

/** the white lab-coat sleeve: a loose tube whose hem hangs over the glove's cuff; dir points from the wrist to the elbow */
const Sleeve: React.FC<{id: string; wrist: P; dir: P; start?: number; length?: number; r0?: number; r1?: number}> = ({id, wrist, dir, start = 33, length = 260, r0 = 37, r1 = 44}) => {
  const d = nrm(dir);
  let n = perp(d);
  if (n.x * LIGHT.x + n.y * LIGHT.y < 0) n = mul(n, -1);
  const a = add(wrist, mul(d, start)), b = add(wrist, mul(d, start + length));
  const ang = Math.atan2(d.y, d.x) / DEG;
  // the hem: an elliptic arc bulging toward the hand
  const D = `M${Pf(add(a, mul(n, r0)))}L${Pf(add(b, mul(n, r1)))}L${Pf(add(b, mul(n, -r1)))}L${Pf(add(a, mul(n, -r0)))}A${f(r0 * 0.3)} ${f(r0)} ${f(ang)} 0 1 ${Pf(add(a, mul(n, r0)))}Z`;
  const m = lerpP(a, b, 0.3);
  const hem = add(a, mul(d, 9));
  const ink = 2.2;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1={f(add(m, mul(n, r1)).x)} y1={f(add(m, mul(n, r1)).y)} x2={f(add(m, mul(n, -r1)).x)} y2={f(add(m, mul(n, -r1)).y)}>
          <stop offset="0" stopColor={K.coatLit} />
          <stop offset="0.3" stopColor={K.coat} />
          <stop offset="0.66" stopColor={mix(K.coat, K.coatShade, 0.5)} />
          <stop offset="0.9" stopColor={K.coatShade} />
          <stop offset="1" stopColor={mix(K.coatShade, K.coat, 0.4)} />
        </linearGradient>
      </defs>
      <Under d={D} />
      <path d={D} fill={`url(#${id}-g)`} />
      {/* the inside of the hem on its far side, the hem's stitched band, and a few loose folds */}
      <path d={`M${Pf(add(add(a, mul(d, 1.2)), mul(n, r0 * 0.86)))}A${f(r0 * 0.24)} ${f(r0 * 0.86)} ${f(ang)} 0 0 ${Pf(add(add(a, mul(d, 1.2)), mul(n, -r0 * 0.86)))}`} fill="none" stroke={K.coatDeep} strokeWidth={3.2} vectorEffect={NS} opacity={0.55} />
      <path d={`M${Pf(add(hem, mul(n, r0 * 0.98)))}A${f(r0 * 0.3)} ${f(r0 * 0.98)} ${f(ang)} 0 1 ${Pf(add(hem, mul(n, -r0 * 0.98)))}`} fill="none" stroke={K.coatShade} strokeWidth={ink} vectorEffect={NS} opacity={0.9} />
      {[0.22, 0.48].map((k, i) => {
        const p = lerpP(a, b, k);
        const q = add(p, mul(d, 24));
        return <path key={i} d={`M${Pf(add(p, mul(n, -r1 * 0.78)))}Q${Pf(add(lerpP(p, q, 0.5), mul(n, -r1 * 0.2)))} ${Pf(add(q, mul(n, r1 * 0.15)))}`} fill="none" stroke={K.coatShade} strokeWidth={2.6} strokeLinecap="round" vectorEffect={NS} opacity={0.75} />;
      })}
      <path d={`M${Pf(add(lerpP(a, b, 0.12), mul(n, r0 * 0.62)))}L${Pf(add(lerpP(a, b, 0.7), mul(n, r1 * 0.62)))}`} stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" vectorEffect={NS} opacity={0.7} />
    </g>
  );
};

/** the right hand: the syringe in a syringe grip (the surgeon's: index along the barrel, middle under the flange, thumb
 *  on the plunger pad, ring and little fingers closed), the forearm and sleeve running back toward the lower right */
const RightHand: React.FC<{id: string; s: SyrState; hang?: React.ReactNode}> = ({id, s, hang}) => {
  const ts: 1 | -1 = -1;
  const angD = s.ang / DEG + 180;
  const d = dirA(angD * DEG);
  const p = syrAt(s, SYR_GRIP);
  const wrist = sub(sub(p, mul(d, FAR_UV.u * L_H)), mul(perp(d), FAR_UV.v * L_H * ts));
  const sPB = stopperS(s.pl) + SYR.stopT + SYR.rod + SYR.padT;
  const tipW = sub(syrAt(s, sPB), mul(d, 0.046 * L_H));
  const pose = farPose(toHand(tipW, wrist, angD, ts), screenDown(angD, ts, 1));
  // the forearm turns a little toward the body (down the screen) behind the wrist
  const back = nrm(add(mul(d, -1), pt(0.12, 0.18)));
  return (
    <g className={NSCLASS}>
      <NsStyle />
      <GloveHand id={id} wrist={wrist} ang={angD} L={L_H} ts={ts} pose={pose} color={C.glove} cuff={{dir: back, len: CUFF.len, r0: CUFF.r0, r1: CUFF.r1}} obj={<Syringe id={`${id}-sy`} s={s} />} over={hang} />
      <Sleeve id={`${id}-sl`} wrist={wrist} dir={back} />
    </g>
  );
};

/** the left hand's pinch across the crack: index and middle pads on the far half, the thumb pad on the near half's cut
 *  edge, squeezing along the shaft; ring and little fingers curled under the palm; the thumb grows out of the palm */
const LH = {ang: -30, idx: pt(-22, -6), idxH: [0.69, 0.11] as [number, number], midH: [0.705, 0.04] as [number, number], thH: [0.6, 0.235] as [number, number]};
const leftHandSolve = (press: number) => {
  const ts: 1 | -1 = 1;
  const fs = DP * press;
  const fr = handFrame(pt(0, 0), LH.ang, ts);
  const wrist = sub(LH.idx, add(mul(fr.d, LH.idxH[0] * L_H), mul(fr.n, LH.idxH[1] * L_H)));
  const at = handFrame(wrist, LH.ang, ts).at;
  // the squeeze: the finger pads ride down with the far half and the fingers flex (their tips draw back toward the
  // palm); the thumb pushes in toward them
  const flex = mul(fr.d, -2.4 * press);
  const thW = at(...LH.thH);
  const toIdx = nrm(sub(LH.idx, thW));
  const idx = toHand(add(add(LH.idx, pt(0.25 * fs, fs)), flex), wrist, LH.ang, ts);
  const mid = toHand(add(add(at(...LH.midH), pt(0.25 * fs, fs)), flex), wrist, LH.ang, ts);
  const th = toHand(add(thW, mul(toIdx, 2.6 * press)), wrist, LH.ang, ts);
  const down = screenDown(LH.ang, ts, 1);
  const base: [number, number] = [0.13, 0.2];
  const pose: GripPose = {
    fingers: [
      // flexed: a long proximal phalanx, the middle and distal ones foreshortened as they turn down onto the bone
      {j: [MCP[0], L3(MCP[0], idx, 0.64, 0.012), L3(MCP[0], idx, 0.88, 0.004), idx], r: fingerR(0)} as Digit,
      {j: [MCP[1], L3(MCP[1], mid, 0.62, 0.006), L3(MCP[1], mid, 0.87, 0.002), mid], r: fingerR(1)} as Digit,
      // ring and little fingers closed into the palm (knuckle stubs, tucked)
      curled(2, [0.535, 0.0], down, 0.06, true),
      curled(3, [0.485, -0.075], down, 0.055, true),
    ],
    thumb: {j: [base, L3(base, th, 0.44, 0.07), L3(base, th, 0.76, 0.035), th], r: THUMB_R},
    thumbLay: 'p',
    thumbOver: false,
  };
  return {wrist, pose, ts};
};
const LeftHand: React.FC<{id: string; press: number}> = ({id, press}) => {
  const {wrist, pose, ts} = leftHandSolve(press);
  const d = dirA(LH.ang * DEG);
  const back = nrm(add(mul(d, -1), pt(-0.05, 0.22)));
  return (
    <g className={NSCLASS}>
      <NsStyle />
      <GloveHand id={id} wrist={wrist} ang={LH.ang} L={L_H} ts={ts} pose={pose} color={C.glove} cuff={{dir: back, len: CUFF.len, r0: CUFF.r0, r1: CUFF.r1}} />
      <Sleeve id={`${id}-sl`} wrist={wrist} dir={back} />
    </g>
  );
};

// ------------------------------------------------------------------ the bench
const Bench: React.FC<{id: string}> = ({id}) => {
  const PX0 = -125, PX1 = 92, PY0 = -125, PY1 = 82;
  const pad = [proj(PX0, PY0, 0), proj(PX1, PY0, 0), proj(PX1, PY1, 0), proj(PX0, PY1, 0)];
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-b`} gradientUnits="userSpaceOnUse" cx="-90" cy="-160" r="520">
          <stop offset="0" stopColor={K.benchLit} />
          <stop offset="0.45" stopColor={K.bench} />
          <stop offset="1" stopColor={K.benchDeep} />
        </radialGradient>
        <radialGradient id={`${id}-p`} gradientUnits="userSpaceOnUse" cx="-60" cy="-120" r="330">
          <stop offset="0" stopColor={K.padLit} />
          <stop offset="0.6" stopColor={K.pad} />
          <stop offset="1" stopColor={K.padShade} />
        </radialGradient>
      </defs>
      <rect x="-4000" y="-4000" width="8000" height="8000" fill={`url(#${id}-b)`} />
      {/* the white bench pad: a thin absorbent sheet with a faint quilted emboss */}
      <path d={poly(pad.map((p) => add(p, pt(1.5, 2.2))))} fill={K.benchDeep} opacity={0.5} />
      <path d={poly(pad)} fill={`url(#${id}-p)`} stroke={K.padEdge} strokeWidth={1.6} vectorEffect={NS} />
      {Array.from({length: 13}).map((_, i) => {
        const X = PX0 + (i + 0.5) * ((PX1 - PX0) / 13);
        return <path key={`v${i}`} d={pl([proj(X, PY0, 0), proj(X, PY1, 0)])} stroke={K.padShade} strokeWidth={1.2} vectorEffect={NS} opacity={0.5} />;
      })}
      {Array.from({length: 12}).map((_, i) => {
        const Y = PY0 + (i + 0.5) * ((PY1 - PY0) / 12);
        return <path key={`h${i}`} d={pl([proj(PX0, Y, 0), proj(PX1, Y, 0)])} stroke={K.padShade} strokeWidth={1.2} vectorEffect={NS} opacity={0.5} />;
      })}
    </g>
  );
};

// ------------------------------------------------------------------ the specimen
/** silhouette pieces (picture mm). The far half carries the press shift. */
const nearFaceC = proj(0, SPEC.yNear, R);
const farEndArc = (fs: number) => TH.filter((_, i) => i % 6 === 0 || i === TH.length - 1).map((th) => pt(R * Math.sin(th), R * CE * (1 - Math.cos(th)) - SPEC.yFar * SE + fs));
const coarse = (ps: CP[], k: (p: CP) => P) => ps.map(k);
/** cylinder shading across x (lit about -0.55 R, turning into shade toward the right) */
const BoneGrad: React.FC<{id: string}> = ({id}) => (
  <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={f(-R)} y1="0" x2={f(R)} y2="0">
    <stop offset="0" stopColor={mix(C.bone, C.boneShade, 0.35)} />
    <stop offset="0.1" stopColor={C.bone} />
    <stop offset="0.24" stopColor={C.boneLit} />
    <stop offset="0.42" stopColor={mix(C.boneLit, C.bone, 0.45)} />
    <stop offset="0.62" stopColor={C.bone} />
    <stop offset="0.82" stopColor={mix(C.bone, C.boneShade, 0.75)} />
    <stop offset="1" stopColor={mix(C.boneShade, C.boneDeep, 0.35)} />
  </linearGradient>
);
/** the vascular pores of the cortex (elongated along the shaft), drawn only near enough to read */
const SURF_PORES = (() => {
  const out: {c: P; rx: number; ry: number; a: number}[] = [];
  const cell = 1.05;
  for (let i = -26; i <= 26; i++) {
    for (let j = -30; j <= 28; j++) {
      const h = hash(i * 12.9898 + j * 78.233 + 4.1);
      if (h > 0.5) continue;
      const x = (i + hash(h * 91.7)) * cell, y = (j + hash(h * 53.1)) * cell;
      if (Math.abs(x) > R - 1.2) continue;
      out.push({c: pt(x, y), rx: 0.03 + 0.03 * hash(h * 17.3), ry: 0.07 + 0.08 * hash(h * 29.9), a: 0.35 + 0.4 * hash(h * 3.7)});
    }
  }
  return out;
})();
/** the cancellous core of the near cut face: a jittered honeycomb of pores (unit disk coordinates) */
const CANC = (() => {
  const out: {u: number; v: number; r: number; s: number}[] = [];
  const sp = 0.085;
  for (let j = -13; j <= 13; j++) {
    for (let i = -13; i <= 13; i++) {
      const u = (i + (j % 2 ? 0.5 : 0)) * sp + (hash(i * 3.1 + j * 7.7) - 0.5) * sp * 0.55;
      const v = j * sp * 0.87 + (hash(i * 5.3 + j * 1.9) - 0.5) * sp * 0.55;
      const rr = Math.hypot(u, v);
      if (rr > 0.96) continue;
      out.push({u, v, r: sp * (0.26 + 0.2 * hash(i * 9.1 + j * 2.3)) * (1 - 0.45 * ss(rr, 0.7, 0.96)), s: i * 13 + j * 7});
    }
  }
  return out;
})();
const Specimen: React.FC<{id: string; st: LabState; cam: Cam; px: number}> = ({id, st, cam, px}) => {
  const press = clamp(st.press);
  const fs = DP * press;
  const cps = TH.map((th) => crackPt(th, press));
  const cL = cps[0], cR = cps[cps.length - 1];
  const yFarSide = R * CE - SPEC.yFar * SE + fs;
  const yNearSide = nearFaceC.y;
  const farD = pl([pt(-R, cL.fT.y), pt(-R, yFarSide), ...farEndArc(fs), pt(R, yFarSide), pt(R, cR.fT.y), ...[...coarse(cps, (p) => p.fT)].reverse()]) + 'Z';
  const lowArc = ellPts(nearFaceC, R, R * CE, 0, Math.PI, 60);
  const nearD = pl([...coarse(cps, (p) => p.fB), pt(R, yNearSide), ...lowArc, pt(-R, cL.fB.y)]) + 'Z';
  const faceD = closed(ellPts(nearFaceC, R, R * CE, 0, TAU, 40).slice(0, 40), 1);
  const innerD = closed(Array.from({length: 36}, (_, i) => {
    const a = (i / 36) * TAU;
    const k = (R - SPEC.cortex) * (1 + 0.035 * Math.sin(3 * a + 0.7) + 0.025 * Math.sin(5 * a + 2.1));
    return pt(nearFaceC.x + Math.cos(a) * k, nearFaceC.y + Math.sin(a) * k * CE);
  }), 1);
  const [vx0, vy0, vx1, vy1] = viewRect(cam, 0, 1.05);
  const poreA = ss(cam.w, 70, 30);
  const fineA = ss(cam.w, 34, 16);
  const id_ = (k: string) => `${id}-${k}`;
  return (
    <g>
      <defs>
        <BoneGrad id={id_('bg')} />
        <linearGradient id={id_('fg')} gradientUnits="userSpaceOnUse" x1={f(-R)} y1={f(nearFaceC.y - R * CE)} x2={f(R)} y2={f(nearFaceC.y + R * CE)}>
          <stop offset="0" stopColor={mix(C.bone, C.boneLit, 0.4)} />
          <stop offset="0.55" stopColor={mix(C.bone, C.boneShade, 0.25)} />
          <stop offset="1" stopColor={C.boneShade} />
        </linearGradient>
        <radialGradient id={id_('cg')} gradientUnits="userSpaceOnUse" cx={f(nearFaceC.x - 6)} cy={f(nearFaceC.y - 5)} r={f(R)}>
          <stop offset="0" stopColor={mix(C.cancellous, C.boneLit, 0.25)} />
          <stop offset="0.7" stopColor={C.cancellous} />
          <stop offset="1" stopColor={mix(C.cancellous, C.boneShade, 0.6)} />
        </radialGradient>
        <clipPath id={id_('bc')}>
          <path d={farD} />
          <path d={nearD} />
        </clipPath>
        <clipPath id={id_('ic')}>
          <path d={innerD} />
        </clipPath>
      </defs>
      {/* the contact shadow on the pad (light from the upper left) */}
      <SoftSpot id={id_('sh')} c={pt(12, nearFaceC.y + 6)} rx={52} ry={26} a={0.32} rot={-8} />
      <path d={`M${f(-R + 2)} ${f(yNearSide + R * CE - 1)}Q${f(4)} ${f(yNearSide + R * CE + 5.5)} ${f(R + 4)} ${f(yNearSide + 4)}L${f(R + 1)} ${f(yNearSide - 6)}Z`} fill={K.shadow} opacity={0.16} />
      {/* the two halves and the cut face: one inked silhouette */}
      <Under d={farD} />
      <Under d={nearD} />
      <Under d={faceD} />
      <path d={farD} fill={`url(#${id_('bg')})`} />
      <path d={nearD} fill={`url(#${id_('bg')})`} />
      <g clipPath={`url(#${id_('bc')})`}>
        {/* a long sheen down the lit generator line, and the cortex's faint longitudinal grain */}
        <path d={rect(-R * 0.62, -R * 0.4, -80, 80)} fill="#FFFFFF" opacity={0.22} />
        {[-0.82, -0.3, 0.12, 0.47, 0.74].map((k, i) => (
          <path key={i} d={`M${f(k * R)} -60L${f(k * R + 0.6 * Math.sin(i))} 60`} stroke={C.boneShade} strokeWidth={1.4} vectorEffect={NS} opacity={0.32} />
        ))}
        {/* a few faint stains (a real specimen, not a model) */}
        <ellipse cx={f(17)} cy={f(-21 + fs)} rx={6} ry={2.6} fill={C.boneShade} opacity={0.18} />
        <ellipse cx={f(-21)} cy={f(19)} rx={4.2} ry={1.9} fill={C.boneShade} opacity={0.16} />
        {poreA > 0.01 && (
          <g opacity={f(poreA)}>
            {SURF_PORES.filter((q) => q.c.x > vx0 - 1 && q.c.x < vx1 + 1 && q.c.y > vy0 - 1 && q.c.y < vy1 + 1).map((q, i) => {
              const y = q.c.y < 0 ? q.c.y + fs : q.c.y;
              return <ellipse key={i} cx={f(q.c.x)} cy={f(y)} rx={f(q.rx)} ry={f(q.ry)} fill={C.boneShade} opacity={f(q.a)} />;
            })}
          </g>
        )}
      </g>
      {/* the near cut face: the cortex ring (with its lamellae), the cancellous core, saw marks */}
      <path d={faceD} fill={`url(#${id_('fg')})`} />
      {[0.35, 0.7].map((k, i) => (
        <ellipse key={i} cx={f(nearFaceC.x)} cy={f(nearFaceC.y)} rx={f(R - SPEC.cortex * k)} ry={f((R - SPEC.cortex * k) * CE)} fill="none" stroke={C.boneShade} strokeWidth={1.2} vectorEffect={NS} opacity={0.6} />
      ))}
      <path d={innerD} fill={`url(#${id_('cg')})`} />
      <g clipPath={`url(#${id_('ic')})`}>
        {CANC.map((q, i) => {
          const r0 = R - SPEC.cortex;
          const c = pt(nearFaceC.x + q.u * r0, nearFaceC.y + q.v * r0 * CE);
          const ps = blob(c, q.r * r0, q.r * r0 * CE * 1.05, q.s, 7, 0.28);
          return (
            <g key={i}>
              <path d={closed(ps, 1)} fill={C.cancellousPore} />
              <path d={closed(blob(add(c, pt(q.r * r0 * 0.18, q.r * r0 * 0.2)), q.r * r0 * 0.6, q.r * r0 * CE * 0.6, q.s + 3, 6, 0.2), 1)} fill={shade(C.cancellousPore, 0.35)} opacity={0.7} />
            </g>
          );
        })}
        {[-0.5, -0.1, 0.32].map((k, i) => (
          <path key={i} d={`M${f(-R)} ${f(nearFaceC.y + k * R * CE - 6)}L${f(R)} ${f(nearFaceC.y + k * R * CE + 4)}`} stroke="#FFFFFF" strokeWidth={2} vectorEffect={NS} opacity={0.16} />
        ))}
      </g>
      <path d={innerD} fill="none" stroke={C.boneInk} strokeWidth={1.4} vectorEffect={NS} opacity={0.45} />
      <path d={open(ellPts(nearFaceC, R, R * CE, Math.PI, TAU, 40))} fill="none" stroke={C.boneInk} strokeWidth={2} vectorEffect={NS} opacity={0.7} />
      <Crack id={id_('ck')} cps={cps} st={st} px={px} fineA={fineA} view={[vx0, vy0, vx1, vy1]} />
    </g>
  );
};

/** the crack: the two broken lips (tan chamfers), the dark gap ahead of the bead, the bead (as the wrist's glue), and the
 *  lips' bone-ink edges */
const Crack: React.FC<{id: string; cps: CP[]; st: LabState; px: number; fineA: number; view: [number, number, number, number]}> = ({id, cps, st, px, fineA, view}) => {
  const press = clamp(st.press);
  const the = beadTh(st.bead);
  const n = cps.length;
  const ie = (() => {
    let i = 0;
    while (i < n - 1 && cps[i + 1].th <= the) i++;
    return i;
  })();
  const stripT = poly([...cps.map((p) => p.rT), ...[...cps].reverse().map((p) => p.fT)]);
  const stripB = poly([...cps.map((p) => p.fB), ...[...cps].reverse().map((p) => p.rB)]);
  const gapD = poly([...cps.map((p) => p.fT), ...[...cps].reverse().map((p) => p.fB)]);
  // the bead from the left end to its leading end (an exact sample at the end)
  let bead: CP[] = [];
  if (st.bead > 1e-3) {
    bead = cps.slice(0, ie + 1);
    const end = crackPt(the, press);
    if (the - bead[bead.length - 1].th > 1e-6) bead.push(end);
  }
  const [vx0, vy0, vx1, vy1] = view;
  // the chamfers' pores at close range
  const dots: React.ReactNode[] = [];
  if (fineA > 0.01) {
    cps.forEach((p, i) => {
      if (i % 2 || p.x < vx0 - 0.5 || p.x > vx1 + 0.5 || p.c.y < vy0 - 2 || p.c.y > vy1 + 2) return;
      [0, 1].forEach((side) => {
        const h = hash(i * 3.17 + side * 11.3);
        if (h > 0.45) return;
        const a = side ? p.fB : p.rT, b = side ? p.rB : p.fT;
        const c = lerpP(a, b, 0.2 + 0.6 * hash(h * 7.1));
        dots.push(<ellipse key={`${i}_${side}`} cx={f(c.x)} cy={f(c.y)} rx={f(0.025 + 0.03 * hash(h * 3.3))} ry={f(0.018 + 0.02 * hash(h * 5.9))} fill={K.stripPore} opacity={0.75} />);
      });
    });
  }
  return (
    <g>
      <path d={stripT} fill={K.strip} />
      <path d={stripB} fill={K.stripLit} />
      {/* faceted light on the lips */}
      <path d={poly([...cps.map((p) => lerpP(p.rT, p.fT, 0.15)), ...[...cps].reverse().map((p) => lerpP(p.rT, p.fT, 0.45))])} fill={mix(K.strip, C.boneLit, 0.35)} opacity={0.5} />
      <path d={poly([...cps.map((p) => lerpP(p.fB, p.rB, 0.5)), ...[...cps].reverse().map((p) => lerpP(p.fB, p.rB, 0.85))])} fill={mix(K.stripLit, '#FFFFFF', 0.3)} opacity={0.45} />
      <g opacity={f(fineA)}>{dots}</g>
      <path d={gapD} fill={K.gap} />
      {bead.length > 1 && <Bead id={`${id}-bd`} pts={bead} px={px} fresh={1 - ss(moveOf(st), 0.05, 0.5)} press={press} />}
      {/* the lips' crisp bone-ink outer edges */}
      <Ln d={open(cps.map((p) => p.rT), 0.6)} w={1.8} color={C.boneInk} />
      <Ln d={open(cps.map((p) => p.rB), 0.6)} w={1.8} color={C.boneInk} />
    </g>
  );
};

/** the bead of gel: the wrist's glue look (fracture.tsx) laid along the crack: an inked union, the light lips, the core
 *  between the faces, a deep strip under the far (shaded) lip, one highlight; a proud, brighter fresh tail and a bulb
 *  at the nozzle while it is being laid */
const FRESH_MM = 1.6;
const MIN_PX = 6.5;
const Bead: React.FC<{id: string; pts: CP[]; px: number; fresh: number; press: number}> = ({id, pts, px, fresh, press}) => {
  const n = pts.length;
  // arc length along the bead (centre line), from its start
  const sArr: number[] = [0];
  for (let i = 1; i < n; i++) sArr.push(sArr[i - 1] + len(sub(pts[i].c, pts[i - 1].c)));
  const S = sArr[n - 1];
  // a minimum on-screen width at wide framings; the fresh tail stands a little proud
  const fz = (i: number) => fresh * ss(sArr[i], S - FRESH_MM, S - 0.15);
  const P_ = pts.map((p, i) => {
    let gT = p.gT, gB = p.gB, fT = p.fT, fB = p.fB;
    const w = gB.y - gT.y;
    const minW = MIN_PX * px;
    if (w < minW) {
      const m = (gT.y + gB.y) / 2, k = minW / Math.max(1e-6, w);
      gT = pt(gT.x, m - minW / 2);
      gB = pt(gB.x, m + minW / 2);
      fT = pt(fT.x, m + (fT.y - m) * k);
      fB = pt(fB.x, m + (fB.y - m) * k);
    }
    const pr = 0.075 * fz(i);
    return {gT: pt(gT.x, gT.y - pr), gB: pt(gB.x, gB.y + pr), fT, fB};
  });
  const gT = P_.map((p) => p.gT), gB = P_.map((p) => p.gB), fT = P_.map((p) => p.fT), fB = P_.map((p) => p.fB);
  // the leading end: a round cap bulging forward along the crack
  const e0 = gT[n - 1], e1 = gB[n - 1];
  const m = lerpP(e0, e1, 0.5);
  const tg = nrm(sub(pts[n - 1].c, pts[Math.max(0, n - 4)].c));
  const r = len(sub(e1, e0)) / 2;
  const up = nrm(sub(e0, m));
  const cap: P[] = [];
  for (let k = 1; k < 10; k++) {
    const a = (k / 10) * Math.PI;
    cap.push(add(m, add(mul(up, r * Math.cos(a)), mul(tg, r * 0.9 * Math.sin(a)))));
  }
  const outline = poly([...gT, ...cap, ...[...gB].reverse()]);
  const coreD = poly([...fT, ...[...fB].reverse()]);
  const bandPx = (gB.reduce((a, p, i) => a + p.y - gT[i].y, 0) / n) / px;
  const detK = clamp((bandPx - 4) / 4);
  const deepD = poly([...gT, ...[...fT].map((p, i) => lerpP(p, fB[i], 0.26)).reverse()]);
  const hlW = Math.min(Math.max(0.05 * bandPx, 2.2), 6);
  const hlPts = fT.map((p, i) => lerpP(p, fB[i], 0.82));
  const settled = hlPts.filter((_, i) => sArr[i] > 0.35 && (fresh < 0.01 || sArr[i] < S - FRESH_MM * 0.55));
  const freshPts = hlPts.map((p, i) => lerpP(fT[i], fB[i], 0.3)).filter((_, i) => sArr[i] >= S - FRESH_MM * 0.75 && sArr[i] <= S - 0.08);
  const freshLip = (() => {
    const A: P[] = [], Bq: P[] = [];
    for (let i = 0; i < n; i++) {
      const k = fz(i);
      if (k < 0.02) continue;
      A.push(gT[i]);
      Bq.push(lerpP(gT[i], gB[i], 0.3 * k));
    }
    return A.length > 1 ? poly([...A, ...Bq.reverse()]) : '';
  })();
  const lipLine = gT.filter((_, i) => sArr[i] < S - (fresh > 0.01 ? FRESH_MM * 0.6 : 0.3));
  const bulb = {c: add(m, mul(tg, r * 0.25)), r: r * 1.12};
  return (
    <g>
      {/* the gel's own edge (an inked union of the band and the bulb) */}
      <path d={outline} fill={GLUE_EDGE} stroke={GLUE_EDGE} strokeWidth={2.5} strokeLinejoin="round" vectorEffect={NS} />
      {fresh > 0.01 && <circle cx={f(bulb.c.x)} cy={f(bulb.c.y)} r={f(bulb.r * fresh)} fill={GLUE_EDGE} stroke={GLUE_EDGE} strokeWidth={2.5} vectorEffect={NS} />}
      <path d={outline} fill={LIP} />
      {fresh > 0.01 && <circle cx={f(bulb.c.x)} cy={f(bulb.c.y)} r={f(bulb.r * fresh)} fill={LIP} />}
      <path d={coreD} fill={CORE} />
      {detK > 0.01 && <path d={deepD} fill={DEEP} opacity={f(detK)} />}
      {freshLip && <path d={freshLip} fill={FRESH_LIP} opacity={f(0.85 * Math.max(detK, 0.4))} />}
      {/* the one highlight: continuous while glossy; on the fresh tail wider and on the proud crest */}
      {settled.length > 1 && <Ln d={open(settled, 0.5)} w={hlW * (1 + 0.25 * press)} color={C.glueShine} opacity={0.9 * Math.max(detK, 0.55)} />}
      {fresh > 0.01 && freshPts.length > 1 && <Ln d={open(freshPts, 0.5)} w={Math.max(hlW, 0.12 * bandPx) * fresh} color={C.glueShine} opacity={0.95 * fresh} />}
      {fresh > 0.01 && (
        <g opacity={f(fresh)}>
          <circle cx={f(bulb.c.x + bulb.r * 0.12)} cy={f(bulb.c.y + bulb.r * 0.14)} r={f(bulb.r * 0.75)} fill={C.glueDeep} opacity={0.35} />
          <circle cx={f(bulb.c.x - bulb.r * 0.06)} cy={f(bulb.c.y - bulb.r * 0.06)} r={f(bulb.r * 0.7)} fill={CORE} />
          <ellipse cx={f(bulb.c.x - bulb.r * 0.34)} cy={f(bulb.c.y - bulb.r * 0.38)} rx={f(bulb.r * 0.3)} ry={f(bulb.r * 0.17)} fill={C.glueShine} opacity={0.92} transform={`rotate(-38 ${f(bulb.c.x - bulb.r * 0.34)} ${f(bulb.c.y - bulb.r * 0.38)})`} />
        </g>
      )}
      {/* the far lip's bone-ink edge over the gel: the gel lies IN the crack */}
      {lipLine.length > 1 && <Ln d={open(lipLine, 0.5)} w={1.8} color={C.boneInk} opacity={0.9} />}
    </g>
  );
};

// ------------------------------------------------------------------ the beaker, the water and the drop
const B_BASE = ellAt(0), B_RIM = ellAt(B.h), B_IN = ellAt(B.base);
const RYo = B.R * SE, RYi = RI * SE;
/** the water as seen in the picture: its surface ellipse and the column below it down to the inner base */
const WATER_D = (() => {
  const top = ellPts(pt(B.X, Y_SURF), RI, RYi, Math.PI, TAU, 48);
  const bot = ellPts(B_IN, RI, RYi, 0, Math.PI, 48);
  return pl([...top, ...bot]) + 'Z';
})();
const SURF_D = closed(ellPts(pt(B.X, Y_SURF), RI, RYi, 0, TAU, 48).slice(0, 48), 1);
/** the drop's detach point (its centre at drop 1) and its path */
const RD = 1.7;
const dropShape = (drop: number) => {
  const d = clamp(drop);
  const v = ss(d, 0, 0.9);
  const r = RD * (0.28 + 0.72 * Math.cbrt(v));
  const el = ss(d, 0.55, 1);
  const neck = lerp(0.62, 0.1, ss(d, 0.7, 1));
  const hang = 0.2 + r * (0.72 + 0.55 * el) + 0.9 * el;
  return {r, el, neck, c: add(TIP_DROP, pt(-0.25, hang))};
};
const DETACH = dropShape(1).c;
const Y_END = proj(B.X, B.Y, 8).y;
export const labDropPos = (st: LabState): P => {
  if (st.fall <= 0 && st.plunge <= 0) return dropShape(st.drop).c;
  if (st.plunge <= 0) return pt(DETACH.x, DETACH.y + (Y_SURF - DETACH.y) * clamp(st.fall) ** 2);
  const p = clamp(st.plunge);
  return pt(DETACH.x + 0.6 * Math.sin(p * 4), Y_SURF + (Y_END - Y_SURF) * (1 - (1 - p) ** 2));
};

/** a drop of gel (a glossy teal sphere-ish blob), sx/sy its squash */
const GelDrop: React.FC<{id: string; c: P; r: number; sx?: number; sy?: number; tint?: number}> = ({id, c, r, sx = 1, sy = 1, tint = 0}) => {
  const col = (x: string) => mix(x, C.sea, tint);
  return (
    <g transform={`translate(${Pf(c)}) scale(${f(sx)} ${f(sy)})`}>
      <defs>
        <radialGradient id={id} cx="0.34" cy="0.3" r="0.8" gradientUnits="objectBoundingBox">
          <stop offset="0" stopColor={col(C.glueLit)} />
          <stop offset="0.4" stopColor={col(mix(C.glueLit, C.glue, 0.6))} />
          <stop offset="0.75" stopColor={col(C.glue)} />
          <stop offset="1" stopColor={col(C.glueDeep)} />
        </radialGradient>
      </defs>
      <circle r={f(r)} fill={GLUE_EDGE} stroke={GLUE_EDGE} strokeWidth={2.6} vectorEffect={NS} />
      <circle r={f(r)} fill={`url(#${id})`} />
      <path d={`M${f(r * 0.1)} ${f(r * 0.82)}A${f(r * 0.86)} ${f(r * 0.86)} 0 0 0 ${f(r * 0.84)} ${f(r * 0.05)}`} fill="none" stroke={col(C.glueLit)} strokeWidth={f(r * 0.1)} strokeLinecap="round" opacity={0.7} />
      <ellipse cx={f(-r * 0.36)} cy={f(-r * 0.4)} rx={f(r * 0.3)} ry={f(r * 0.17)} transform={`rotate(-38 ${f(-r * 0.36)} ${f(-r * 0.4)})`} fill={C.glueShine} opacity={0.95} />
    </g>
  );
};
/** the hanging drop at the nozzle (with its neck), or the small residual bead once it has gone */
const HangingDrop: React.FC<{id: string; st: LabState}> = ({id, st}) => {
  const fl = clamp(st.fall);
  if (st.drop <= 0.001) return null;
  if (fl > 0 || st.plunge > 0) {
    // after the pinch-off: a thread retracting into the nozzle, a residual bead, a little satellite droplet
    const c = labDropPos(st);
    const thr = 1 - ss(fl, 0, 0.18);
    const top = add(TIP_DROP, pt(-0.2, 0.3));
    const sat = pt(DETACH.x, DETACH.y - RD + (Y_SURF - DETACH.y) * clamp(fl - 0.12) ** 2 * 0.95);
    return (
      <g>
        {thr > 0.01 && st.plunge <= 0 && <Ln d={pl([top, lerpP(top, add(c, pt(0, -RD * 0.8)), thr)])} w={3.2 * thr} color={CORE} />}
        <GelDrop id={`${id}-res`} c={add(TIP_DROP, pt(-0.15, 0.32))} r={0.42} sy={0.85} />
        {fl > 0.12 && st.plunge <= 0 && <GelDrop id={`${id}-sat`} c={sat} r={0.26} />}
      </g>
    );
  }
  const s = dropShape(st.drop);
  const {c, r, el, neck} = s;
  const sy = 1 + 0.2 * el, sx = 1 - 0.06 * el;
  const nl = add(TIP_DROP, pt(-neck, 0.15)), nr = add(TIP_DROP, pt(neck, 0.15));
  const ry = r * sy, rx = r * sx;
  const D = `M${Pf(nl)}C${f(nl.x)} ${f(nl.y + (c.y - ry * 0.5 - nl.y) * 0.6)} ${f(c.x - rx)} ${f(c.y - ry * 0.75)} ${f(c.x - rx)} ${f(c.y)}A${f(rx)} ${f(ry)} 0 0 0 ${f(c.x + rx)} ${f(c.y)}C${f(c.x + rx)} ${f(c.y - ry * 0.75)} ${f(nr.x)} ${f(nr.y + (c.y - ry * 0.5 - nr.y) * 0.6)} ${Pf(nr)}Z`;
  const gid = `${id}-hg`;
  return (
    <g>
      <defs>
        <radialGradient id={gid} gradientUnits="userSpaceOnUse" cx={f(c.x - rx * 0.3)} cy={f(c.y - ry * 0.35)} r={f(Math.max(rx, ry) * 1.3)}>
          <stop offset="0" stopColor={C.glueLit} />
          <stop offset="0.4" stopColor={mix(C.glueLit, C.glue, 0.6)} />
          <stop offset="0.78" stopColor={C.glue} />
          <stop offset="1" stopColor={C.glueDeep} />
        </radialGradient>
      </defs>
      <path d={D} fill={GLUE_EDGE} stroke={GLUE_EDGE} strokeWidth={2.6} strokeLinejoin="round" vectorEffect={NS} />
      <path d={D} fill={`url(#${gid})`} />
      <path d={`M${f(c.x + rx * 0.1)} ${f(c.y + ry * 0.82)}A${f(rx * 0.86)} ${f(ry * 0.86)} 0 0 0 ${f(c.x + rx * 0.84)} ${f(c.y + ry * 0.05)}`} fill="none" stroke={C.glueLit} strokeWidth={f(r * 0.1)} strokeLinecap="round" opacity={0.7} />
      <ellipse cx={f(c.x - rx * 0.36)} cy={f(c.y - ry * 0.4)} rx={f(rx * 0.3)} ry={f(ry * 0.17)} transform={`rotate(-38 ${f(c.x - rx * 0.36)} ${f(c.y - ry * 0.4)})`} fill={C.glueShine} opacity={0.95} />
    </g>
  );
};

/** a bubble (the oyster world's look) */
const Bubble: React.FC<{x: number; y: number; r: number; sq?: number; a?: number}> = ({x, y, r, sq = 1, a = 1}) => (
  <g transform={`translate(${f(x)} ${f(y)})`} opacity={f(a)}>
    <ellipse rx={f(r * sq)} ry={f(r / sq)} fill={rgba(mix(C.seaLit, '#FFFFFF', 0.35), 0.28)} stroke="#EFFFFB" strokeWidth={f(r * 0.17)} strokeOpacity={0.85} />
    <path d={`M${f(r * 0.25)} ${f(r * 0.72)}A${f(r * 0.78)} ${f(r * 0.78)} 0 0 0 ${f(r * 0.74)} ${f(r * 0.2)}`} fill="none" stroke="#FFFFFF" strokeWidth={f(r * 0.12)} strokeLinecap="round" opacity={0.5} />
    <ellipse cx={f(-r * 0.36)} cy={f(-r * 0.38)} rx={f(r * 0.26)} ry={f(r * 0.17)} transform={`rotate(-40 ${f(-r * 0.36)} ${f(-r * 0.38)})`} fill="#FFFFFF" opacity={0.95} />
  </g>
);
/** air bubbles clinging to the inside of the glass (a beaker of fresh seawater) */
const WALL_BUBBLES = Array.from({length: 26}, (_, i) => {
  const h = hash(i * 4.7 + 1.3);
  const side = i % 3 === 0 ? 0 : i % 3 === 1 ? -1 : 1;
  const Z = 6 + 66 * hash(h * 9.1);
  const a = side === 0 ? (0.15 + 0.7 * hash(h * 3.3)) * Math.PI : side < 0 ? Math.PI * (0.9 + 0.12 * hash(h * 5.1)) : Math.PI * (0.1 - 0.12 * hash(h * 5.1));
  const p = proj(B.X + Math.cos(a) * (RI - 0.6), B.Y - Math.sin(a) * (RI - 0.6), Z);
  return {p, r: 0.28 + 0.6 * hash(h * 7.7) ** 2};
});

/** the underwater look, locked to the screen (the oyster world's backdrop at OY_CAM_IN: its gradient, sun glow, shafts) */
const Underwater: React.FC<{id: string; cam: Cam; t: number}> = ({id, cam, t}) => {
  const q = (x: number, y: number) => toWorld(cam, pt(x, y));
  const g0 = q(540, -212), g1 = q(540, 1850);
  const sun = q(245, -339);
  const mm = cam.w / W;
  const [x0, y0, x1, y1] = viewRect(cam, 0, 1.2);
  const shafts = [
    {x: 120, w0: 46, w1: 96, a: 0.8},
    {x: 300, w0: 30, w1: 72, a: 1.0},
    {x: 470, w0: 54, w1: 122, a: 0.75},
    {x: 650, w0: 26, w1: 64, a: 0.9},
    {x: 800, w0: 42, w1: 92, a: 0.7},
  ];
  const yT = -60, yB = 1300, slope = 0.32;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-bg`} gradientUnits="userSpaceOnUse" x1={f(g0.x)} y1={f(g0.y)} x2={f(g1.x)} y2={f(g1.y)}>
          <stop offset="0" stopColor={mix(C.seaLit, '#EFFFF9', 0.35)} />
          <stop offset="0.22" stopColor={mix(C.seaLit, C.sea, 0.35)} />
          <stop offset="0.5" stopColor={C.sea} />
          <stop offset="0.72" stopColor={mix(C.sea, C.seaDeep, 0.55)} />
          <stop offset="1" stopColor={C.seaDeep} />
        </linearGradient>
        <radialGradient id={`${id}-sun`} gradientUnits="userSpaceOnUse" cx={f(sun.x)} cy={f(sun.y)} r={f(884 * mm)}>
          <stop offset="0" stopColor="#F4FFF8" stopOpacity={0.55} />
          <stop offset="0.5" stopColor="#E0FFF6" stopOpacity={0.16} />
          <stop offset="1" stopColor="#E0FFF6" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}-sf`} gradientUnits="userSpaceOnUse" x1="0" y1={f(q(0, yT).y)} x2="0" y2={f(q(0, yB).y)}>
          <stop offset="0" stopColor="#D8FFF4" stopOpacity={0.3} />
          <stop offset="0.45" stopColor="#D8FFF4" stopOpacity={0.13} />
          <stop offset="1" stopColor="#D8FFF4" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={f(x0)} y={f(y0)} width={f(x1 - x0)} height={f(y1 - y0)} fill={`url(#${id}-bg)`} />
      <rect x={f(x0)} y={f(y0)} width={f(x1 - x0)} height={f(y1 - y0)} fill={`url(#${id}-sun)`} />
      {shafts.map((s, i) => {
        const sway = 14 * Math.sin(0.33 * t + i * 1.7);
        const xt = s.x + sway, xb = s.x + sway * 0.4 + slope * (yB - yT);
        const a = q(xt - s.w0 / 2, yT), b = q(xt + s.w0 / 2, yT), c = q(xb + s.w1 / 2, yB), d = q(xb - s.w1 / 2, yB);
        return <path key={i} d={poly([a, b, c, d])} fill={`url(#${id}-sf)`} opacity={f(s.a * (0.7 + 0.3 * noise1(t * 0.7 + i * 3.1, 9)))} />;
      })}
    </g>
  );
};

/** suspended particles in the water (light motes, as the oyster world's), drifting slowly */
const MOTES = (() => {
  const out: {p: P; r: number; a: number; ph: number}[] = [];
  const cell = 2.1;
  for (let i = 0; i < Math.ceil((2 * RI) / cell); i++) {
    for (let j = 0; j < Math.ceil((B_IN.y + RYi - (Y_SURF - RYi)) / cell); j++) {
      const h = hash(i * 12.9898 + j * 78.233 + 9.3);
      if (h > 0.42) continue;
      out.push({p: pt(B.X - RI + (i + hash(h * 91.7)) * cell, Y_SURF - RYi + (j + hash(h * 53.1)) * cell), r: 0.05 + 0.15 * hash(h * 17.3) ** 1.5, a: 0.4 + 0.5 * hash(h * 29.9), ph: hash(h * 3.1) * TAU});
    }
  }
  return out;
})();

const Beaker: React.FC<{id: string; t: number; cam: Cam; st: LabState; px: number}> = ({id, t, cam, st, px}) => {
  const id_ = (k: string) => `${id}-${k}`;
  const pg = clamp(st.plunge);
  const uw = ss(pg, 0.2, 0.85);
  const inAir = st.fall > 0 && pg <= 0;
  const dp = labDropPos(st);
  const left = pt(B.X - B.R, B_RIM.y), right = pt(B.X + B.R, B_RIM.y);
  const silD = pl([left, pt(B.X - B.R, B_BASE.y), ...ellPts(B_BASE, B.R, RYo, Math.PI, 0, 48), right, ...ellPts(B_RIM, B.R, RYo, 0, -Math.PI, 48)]) + 'Z';
  const [vx0, vy0, vx1, vy1] = viewRect(cam, 0, 1.1);
  // the drop's entry: ripples (3 rings), entrained bubbles rising from its trail
  const rings = [0, 0.09, 0.2].map((k, i) => {
    const u = pg - k;
    if (u <= 0 || u > 0.9) return null;
    const rr = 1.5 + 34 * u ** 0.75;
    return <ellipse key={i} cx={f(DETACH.x)} cy={f(Y_SURF)} rx={f(rr)} ry={f(rr * SE)} fill="none" stroke="#FFFFFF" strokeWidth={2.4 - i * 0.5} vectorEffect={NS} opacity={f(0.75 * (1 - u / 0.9) * (1 - 0.6 * uw))} />;
  });
  const trail: React.ReactNode[] = [];
  if (pg > 0) {
    for (let k = 0; k < 14; k++) {
      const p0 = 0.015 + 0.3 * hash(k * 5.1 + 1);
      if (pg < p0) continue;
      const age = pg - p0;
      const dpk = labDropPos({...st, plunge: p0});
      const r = (0.18 + 0.36 * hash(k * 7.3)) * ss(age, 0, 0.05);
      const x = dpk.x + (hash(k * 2.9) - 0.5) * 2.4 + 0.5 * Math.sin(age * 22 + k);
      const y = dpk.y - RD * 0.7 - age * (22 + 26 * hash(k * 1.7));
      if (y < Y_SURF + 0.4) continue;
      trail.push(<Bubble key={k} x={x} y={y} r={r} sq={1 + 0.08 * Math.sin(age * 30 + k)} />);
    }
  }
  // ambient rising bubbles (underwater only), on screen-sized loops
  const amb: React.ReactNode[] = [];
  if (uw > 0.01) {
    for (let k = 0; k < 9; k++) {
      const per = 1.6 + 1.2 * hash(k * 3.3);
      const ph = (t / per + hash(k * 9.7)) % 1;
      const x = B.X - 14 + 28 * hash(k * 4.1) + 0.6 * Math.sin(ph * 12 + k);
      const y = B_IN.y - 4 - ph * 60;
      if (y < Y_SURF + 0.5) continue;
      amb.push(<Bubble key={k} x={x} y={y} r={0.12 + 0.22 * hash(k * 6.1)} a={uw} />);
    }
  }
  const moteA = 0.35 + 0.65 * uw;
  const motes = cam.w < 150
    ? MOTES.map((m, i) => {
        const x = m.p.x + 0.8 * Math.sin(0.5 * t + m.ph) + 1.2 * (t - 6);
        const y = m.p.y + 0.6 * Math.sin(0.37 * t + m.ph * 1.7) - 0.4 * (t - 6);
        if (x < vx0 || x > vx1 || y < vy0 || y > vy1) return null;
        return <ellipse key={i} cx={f(x)} cy={f(y)} rx={f(m.r * 1.35)} ry={f(m.r * 0.8)} fill={K.mote} opacity={f(m.a * moteA * ss(cam.w, 150, 60))} />;
      })
    : null;
  const tint = 0.55 * uw;
  return (
    <g>
      <defs>
        <clipPath id={id_('wc')}>
          <path d={WATER_D} />
        </clipPath>
        <linearGradient id={id_('wg')} gradientUnits="userSpaceOnUse" x1="0" y1={f(Y_SURF - RYi)} x2="0" y2={f(B_IN.y + RYi)}>
          <stop offset="0" stopColor={K.labWaterTop} stopOpacity={0.78} />
          <stop offset="0.45" stopColor={K.labWater} stopOpacity={0.7} />
          <stop offset="1" stopColor={K.labWaterDeep} stopOpacity={0.78} />
        </linearGradient>
        <linearGradient id={id_('gw')} gradientUnits="userSpaceOnUse" x1={f(B.X - B.R)} y1="0" x2={f(B.X + B.R)} y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.35} />
          <stop offset="0.1" stopColor="#FFFFFF" stopOpacity={0.75} />
          <stop offset="0.16" stopColor="#FFFFFF" stopOpacity={0.12} />
          <stop offset="0.7" stopColor="#FFFFFF" stopOpacity={0.05} />
          <stop offset="0.86" stopColor={K.glassEdge} stopOpacity={0.16} />
          <stop offset="0.95" stopColor="#FFFFFF" stopOpacity={0.5} />
          <stop offset="1" stopColor={K.glassEdge} stopOpacity={0.3} />
        </linearGradient>
      </defs>
      {/* the shadow, with the light it lets through (a pale caustic) */}
      <SoftSpot id={id_('sh')} c={add(B_BASE, pt(20, 12))} rx={B.R * 1.45} ry={RYo * 1.15} a={0.26} rot={-6} />
      <SoftSpot id={id_('ca')} c={add(B_BASE, pt(14, 8))} rx={B.R * 0.55} ry={RYo * 0.4} a={0.5} color="#E9FFFB" rot={-6} />
      {/* the glass body (a faint tint), the back of the rim, the base inside */}
      <path d={silD} fill={K.glass} opacity={0.14} />
      {/* the inside of the back wall above the water: a pale glint where it catches the light */}
      <path d={pl([pt(B.X - RI, B_RIM.y), pt(B.X - RI, Y_SURF), ...ellPts(pt(B.X, Y_SURF), RI, RYi, Math.PI, TAU, 40), pt(B.X + RI, B_RIM.y), ...ellPts(B_RIM, RI, RYi, 0, -Math.PI, 40)]) + 'Z'} fill="#FFFFFF" opacity={0.07} />
      <path d={open(ellPts(B_RIM, B.R, RYo, Math.PI, TAU, 48))} fill="none" stroke={K.glassEdge} strokeWidth={2} vectorEffect={NS} opacity={0.7} />
      <path d={open(ellPts(B_IN, RI, RYi, Math.PI, TAU, 40))} fill="none" stroke={K.glassEdge} strokeWidth={1.4} vectorEffect={NS} opacity={0.4} />
      {/* the water: lab seawater, grading to the sea as the camera goes under */}
      <path d={WATER_D} fill={`url(#${id_('wg')})`} />
      <g clipPath={`url(#${id_('wc')})`}>
        {uw > 0.003 && (
          <g opacity={f(uw)}>
            <Underwater id={id_('uw')} cam={cam} t={t} />
          </g>
        )}
        {WALL_BUBBLES.map((b, i) => (
          <Bubble key={i} x={b.p.x} y={b.p.y} r={b.r} a={0.8} />
        ))}
        {motes}
        {amb}
        {trail}
      </g>
      {/* the surface: a paler sheet reflecting the room, its meniscus, the ripples */}
      <g opacity={f(1 - uw)}>
        <path d={SURF_D} fill={K.surf} opacity={0.62} />
        {/* the surface reflects the dark back wall near the back, the lab's light toward the front */}
        <path d={pl([...ellPts(pt(B.X, Y_SURF), RI, RYi, Math.PI, TAU, 40), ...ellPts(pt(B.X, Y_SURF - RYi * 0.35), RI * 0.96, RYi * 0.6, 0, -Math.PI, 40)]) + 'Z'} fill={K.labWaterDeep} opacity={0.35} />
        <path d={closed(ellPts(pt(B.X - 11, Y_SURF + RYi * 0.3), RI * 0.42, RYi * 0.14, 0, TAU, 24).slice(0, 24), 1)} fill="#FFFFFF" opacity={0.3} />
      </g>
      <path d={SURF_D} fill="none" stroke={mix(K.glassEdge, '#FFFFFF', 0.3)} strokeWidth={1.6} vectorEffect={NS} opacity={0.8} />
      <g clipPath={`url(#${id_('sc')})`}>{rings}</g>
      {/* the sunk drop (over the surface sheet: seen through it, a little graded by the water) */}
      {pg > 0 && (
        <g clipPath={`url(#${id_('wc')})`}>
          <GelDrop id={id_('dw')} c={dp} r={RD} sx={1 + 0.1 * Math.exp(-pg * 6) * Math.cos(pg * 26)} sy={1 - 0.1 * Math.exp(-pg * 6) * Math.cos(pg * 26)} tint={0.08 + 0.1 * uw} />
        </g>
      )}
      <defs>
        <clipPath id={id_('sc')}>
          <path d={SURF_D} />
        </clipPath>
      </defs>
      {/* the falling drop (in air, through the opening) */}
      {inAir && <GelDrop id={id_('df')} c={dp} r={RD} sx={1 - 0.08 * Math.cos(st.fall * 12) * Math.exp(-st.fall * 2)} sy={1 + 0.08 * Math.cos(st.fall * 12) * Math.exp(-st.fall * 2)} />}
      {/* the front water line seen through the glass: a bright band and the meniscus */}
      <path d={open(ellPts(pt(B.X, Y_SURF), RI, RYi, 0, Math.PI, 48))} fill="none" stroke="#FFFFFF" strokeWidth={3.2} vectorEffect={NS} opacity={0.85} />
      <path d={open(ellPts(pt(B.X, Y_SURF + 1.2), RI, RYi, 0.15, Math.PI - 0.15, 40))} fill="none" stroke={mix(K.labWaterDeep, C.sea, 0.2)} strokeWidth={2} vectorEffect={NS} opacity={0.5} />
      {/* the front wall: tint, highlights, graduation ticks (no numbers), the thick base, the rim and the spout */}
      <g opacity={f(1 - ss(pg, 0, 0.35))}>
        <path d={silD} fill={`url(#${id_('gw')})`} />
        {[30, 45, 60, 75, 90].map((Z, i) => {
          const c = ellAt(Z);
          return <path key={i} d={open(ellPts(c, B.R, RYo, Math.PI * 0.56, Math.PI * (i % 2 ? 0.66 : 0.72), 8))} fill="none" stroke="#FFFFFF" strokeWidth={1.8} vectorEffect={NS} opacity={0.6} />;
        })}
        <path d={pl([...ellPts(B_BASE, B.R, RYo, 0, Math.PI, 40), ...ellPts(B_IN, RI, RYi, Math.PI, 0, 40)]) + 'Z'} fill="#FFFFFF" opacity={0.35} />
      </g>
      <path d={open(ellPts(B_IN, RI, RYi, 0, Math.PI, 40))} fill="none" stroke={K.glassEdge} strokeWidth={1.4} vectorEffect={NS} opacity={0.55} />
      {/* the outline: the sides and the base (a clear wall: crisp lines, no underlay) */}
      <Ln d={pl([left, pt(B.X - B.R, B_BASE.y)]) + open(ellPts(B_BASE, B.R, RYo, Math.PI, 0, 48)).replace('M', 'L') + `L${Pf(right)}`} w={2.6} color={INK} opacity={0.85} />
      <Ln d={open(ellPts(B_RIM, B.R, RYo, 0, Math.PI, 48))} w={2.6} color={INK} opacity={0.85} />
      <Ln d={open(ellPts(B_RIM, RI + 0.2, RYi, 0, TAU, 60))} w={1.6} color="#FFFFFF" opacity={0.75} />
      <Ln d={open(ellPts(B_RIM, B.R - 0.5, RYo - 0.4, Math.PI * 1.05, Math.PI * 1.95, 40))} w={2.2} color="#FFFFFF" opacity={0.55} />
      <Ln d={pl([pt(B.X + B.R - 1.1, B_RIM.y + 2), pt(B.X + B.R - 1.1, B_BASE.y - 2)])} w={2} color="#FFFFFF" opacity={0.4} />
      {/* the spout: a small lip on the left of the rim */}
      <path d={`M${Pf(add(left, pt(0.2, -3.6)))}Q${Pf(add(left, pt(-4.8, -1.6)))} ${Pf(add(left, pt(-5.4, 1.2)))}Q${Pf(add(left, pt(-2.2, 2.8)))} ${Pf(add(left, pt(0.4, 3.8)))}`} fill={K.glass} fillOpacity={0.5} stroke={INK} strokeWidth={2.4} vectorEffect={NS} opacity={0.85} />
      <path d={`M${Pf(add(left, pt(2.6, -10)))}L${Pf(add(left, pt(2.6, -2 + (B_BASE.y - B_RIM.y) * 0.85)))}`} stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" vectorEffect={NS} opacity={f(0.55 * (1 - uw))} />
    </g>
  );
};

// ------------------------------------------------------------------ the world
export const LabWorld: React.FC<{id: string; t: number; cam: Cam; st: LabState}> = ({id, t, cam, st}) => {
  const px = cam.w / W;
  const syr = syringeOf(st);
  const uw = ss(clamp(st.plunge), 0.2, 0.85);
  const press = clamp(st.press);
  // the hands' shadows on the pad and the bone (soft, toward the lower right)
  const lh = leftHandSolve(press);
  const lc = handFrame(lh.wrist, LH.ang, 1).at(0.42, 0.06);
  const rp = syrAt(syr, SYR_GRIP);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', background: K.bench}}>
      <Layer c={cam} z={0}>
        <Bench id={`${id}-bn`} />
        <Beaker id={`${id}-bk`} t={t} cam={cam} st={st} px={px} />
        <Specimen id={`${id}-sp`} st={st} cam={cam} px={px} />
        <SoftSpot id={`${id}-lhs`} c={add(lc, pt(14, 18))} rx={62} ry={40} a={0.2} rot={-30} />
        <SoftSpot id={`${id}-rhs`} c={add(rp, pt(16, 26))} rx={70} ry={42} a={0.17 * (1 - ss(moveOf(st), 0, 0.5))} rot={60} />
        {/* the fingertips' contact shadows on the bone */}
        {[LH.idx, handFrame(lh.wrist, LH.ang, 1).at(...LH.midH)].map((q, i) => (
          <ellipse key={i} cx={f(q.x + 1.6 + 0.25 * DP * press - 2.4 * press * Math.cos(LH.ang * DEG))} cy={f(q.y + DP * press + 2.2 - 2.4 * press * Math.sin(LH.ang * DEG))} rx={6.5} ry={3.4} fill={K.shadow} opacity={0.2 + 0.1 * press} />
        ))}
        <LeftHand id={`${id}-lh`} press={press} />
        <RightHand id={`${id}-rh`} s={syr} hang={<HangingDrop id={`${id}-hd`} st={st} />} />
      </Layer>
      {uw > 0.003 && (
        <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
          <defs>
            <radialGradient id={`${id}-vig`} gradientUnits="userSpaceOnUse" cx={W / 2} cy={H * 0.5} r={H * 0.68}>
              <stop offset="0.5" stopColor={C.seaDeep} stopOpacity={0} />
              <stop offset="1" stopColor={C.seaDeep} stopOpacity={0.4} />
            </radialGradient>
          </defs>
          <rect width={W} height={H} fill={`url(#${id}-vig)`} opacity={f(uw)} />
        </svg>
      )}
    </div>
  );
};

// ------------------------------------------------------------------ cameras and the suggested timing
/** the hands, the specimen and the beaker (both gloves with their cuffs and the coat's sleeves) */
export const LAB_WIDE: Cam = {x: -12, y: 38, w: 330, k: 1, focus: 0};
/** a gentle push in toward the specimen while the halves are pressed (from LAB_WIDE) */
export const LAB_PRESS: Cam = {x: -14, y: 22, w: 270, k: 1, focus: 0};
/** the drop forming at the nozzle over the beaker (the water surface in the lower part of the frame) */
export const LAB_DROP: Cam = {x: B.X + 2, y: TIP_DROP.y + 14, w: 44, k: 1, focus: 0};
/** under the surface, inside the beaker: the frame is all water (with plunge 1 it matches OysterWorld at OY_CAM_IN) */
export const LAB_PLUNGE: Cam = {x: B.X - 1, y: -58, w: 24, k: 1, focus: 0};

/** suggested beat timing (film seconds) */
export const LAB_T = {
  cut: 3.72, // match cut from the wrist's MATCH framing (bead = BEAD_MATCH)
  beadEnd: 4.5, // the bead reaches the crack's right end
  wide: 4.66, // the pull back lands on LAB_WIDE
  press0: 4.6, press1: 5.02,
  move0: 4.98, move1: 5.5, // the syringe carried over the beaker; the camera travels to LAB_DROP
  drop0: 5.46, drop1: 6.1, // "They developed": the drop swells and pinches off
  fall1: 6.53, // the fall (linear in time: it accelerates)
  plunge1: 7.13, // through the surface and down; dissolve into OysterWorld at OY_CAM_IN over ~6.95-7.13
  dissolve0: 6.95,
};
const T_ = LAB_T;
/** the pull back's ease (log width): from rest at the cut, front-loaded so the nozzle comes into view by ~3.9 s */
export const pullEase = (x: number) => 1 - (1 - clamp(x) ** 1.6) ** 3;
/** the bead's speed profile: it gathers speed over 0.55 s after the cut (the nozzle is just outside the frame and enters
 *  it at ~3.9 s as the camera pulls back), runs at a steady pace and eases to a stop at the crack's end at T_.beadEnd */
const beadSpeed = (t: number) => ss(t, T_.cut, T_.cut + 0.55) * (1 - ss(t, T_.beadEnd - 0.16, T_.beadEnd));
const BEAD_F = (() => {
  const n = 400, out: number[] = [0];
  const dt = (T_.beadEnd - T_.cut) / n;
  for (let i = 1; i <= n; i++) out.push(out[i - 1] + beadSpeed(T_.cut + (i - 0.5) * dt) * dt);
  return {out, dt, n};
})();
/** the suggested bead value at film time t */
export const beadAt = (t: number) => {
  const {out, dt, n} = BEAD_F;
  const u = clamp((t - T_.cut) / dt, 0, n);
  const i = Math.min(n - 1, Math.floor(u));
  const F = out[i] + (out[i + 1] - out[i]) * (u - i);
  return BEAD_MATCH + (1 - BEAD_MATCH) * (F / out[n]);
};
/** the suggested camera and state at film time t (3.72 <= t <= 7.13) */
export const labSuggest = (t: number): {cam: Cam; st: LabState} => {
  const bead = beadAt(t);
  const press = ss(t, T_.press0, T_.press1);
  const move = ss5(t, T_.move0, T_.move1);
  const drop = clamp((t - T_.drop0) / (T_.drop1 - T_.drop0));
  const fall = clamp((t - T_.drop1) / (T_.fall1 - T_.drop1));
  const plunge = clamp((t - T_.fall1) / (T_.plunge1 - T_.fall1));
  const st: LabState = {bead, press, drop, fall, plunge, move};
  let cam: Cam;
  if (t < T_.wide) cam = zoomAbout((t - T_.cut) / (T_.wide - T_.cut), LAB_MATCH, LAB_WIDE, pullEase);
  else if (t < T_.move0) cam = travel((t - T_.wide) / (T_.move0 - T_.wide), LAB_WIDE, LAB_PRESS, (x) => ss(x, 0, 1));
  else if (t < T_.move1 + 0.08) cam = zoomAbout((t - T_.move0) / (T_.move1 + 0.08 - T_.move0), LAB_PRESS, LAB_DROP);
  else if (t < T_.drop1) cam = travel((t - T_.move1 - 0.08) / (T_.drop1 - T_.move1 - 0.08), LAB_DROP, {...LAB_DROP, w: LAB_DROP.w * 0.94, y: LAB_DROP.y + 0.6}, (x) => ss(x, 0, 1));
  else cam = travel((t - T_.drop1) / (T_.plunge1 - T_.drop1), {...LAB_DROP, w: LAB_DROP.w * 0.94, y: LAB_DROP.y + 0.6}, LAB_PLUNGE, (x) => ss5(x, 0, 1));
  return {cam, st};
};
