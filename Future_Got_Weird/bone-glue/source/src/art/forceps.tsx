// V3: pointed reduction forceps (Weber type), seen from above, in the instruments' style (instruments.tsx), drawn in
// wrist-plane millimetres (anatomy.ts: x right, y down, origin at the fracture centre).
//
//   Two forged steel arms cross at a box joint. Forward of the joint each arm is a curved jaw: it leaves the box almost
//   along the instrument, bows outward and hooks back in to a sharp conical point, so the two points face each other
//   across the bone (a crab-claw outline, the opening between the jaws an oval). Behind the joint each arm runs on as a
//   handle on the OTHER side (the arms cross) to an oval finger ring; near the rings a ratchet (two toothed arcs about
//   the joint, one on each handle) holds the grip. The handles run off the frame toward the surgeon's hand (by default
//   up and a little to the left: FORCEPS_ANG), so the instrument never floats.
//
// The jaws track arbitrary tips: given the two contact points, the joint sits on their perpendicular bisector (on the
// side of the hand's direction, turned toward it by at most FORCEPS.maxSkew), at the distance that keeps each jaw's
// chord (joint -> point) its forged length; each arm is rigid and turns about the joint, so the handles and the ratchet
// open with the jaws. When the bisector and the hand's direction disagree the joint moves off the bisector and each
// jaw is scaled a little along its chord (within about +-12 %, as a projection of a forceps tilted out of the plane).
//
// State (ForcepsState):
//   tipA, tipB  the points' contact points when biting (close = 1), world mm. In the scene the instrument is drawn at
//               depth INSTR_Z with the tips reprojected to bone depth, as the probe and applicator are (Scene.tsx).
//   close       0 = open: each point sits gape / 2 mm (default 3 mm) farther out along the A-B line, so the opening is
//               about 6 mm wider than the bite; 1 = closed on the bone at tipA / tipB.
//   on          1 = at work; toward 0 it is carried out along its own axis (toward the hand) with the instruments'
//               withdrawal law (withdrawDist: 200 mm, gentle while in frame), and is gone at 0.
//   lift        0 = points on the bone, 1 = raised clear (LIFT, about the finger rings, as the other instruments).
// ForcepsShadow draws its contact shadow in the bone layer (depth 0) from the UNreprojected tips.
//
// Weird Crew finish: navy ink contours of constant screen width (non-scaling, INST_INK), cel steel lit from the upper
// left, small white glosses. No text, numbers or glyphs. Deterministic.
import React from 'react';
import {P, pt, add, sub, mul, nrm, perp, dir, len, open} from '../core/geo';
import {mix, shade} from '../core/color';
import {C, INK} from './palette';
import {clamp, ss} from '../lib';
import {DIST} from '../camera';
import {uid} from '../core/ids';
import {INST_INK, INSTR_Z, LIFT, withdrawDist} from './instruments';

// ------------------------------------------------------------------------------------------------ dimensions
export const FORCEPS = {
  /** a jaw's chord, joint centre -> point (mm) */
  jaw: 40,
  /** the extra opening between the points when open (close = 0), mm */
  gape: 6,
  /** joint centre -> finger-ring centre, along each handle (mm) */
  handle: 80,
  /** finger rings: half-width across, half-length along the handle, band width (mm) */
  ringRx: 8.2,
  ringRy: 9.6,
  ringW: 2.5,
  /** the ratchet's distance from the joint (mm) and its bars' width */
  ratchet: 60,
  ratchetW: 2.0,
  /** the box joint: length along the arm, width (mm); the pivot pin's radius */
  boxL: 11,
  boxW: 8.2,
  pin: 1.75,
  /** the most the joint may turn off the tips' bisector toward the hand's direction (rad) */
  maxSkew: 0.36,
  /** the points' height above the bone per mm back along the jaw (the instrument is held tilted up toward the hand) */
  slope: 0.36,
  /** how far the open points hover over the bone before they bite (mm) */
  hover: 0.9,
};
/** the default direction from the tips toward the holding hand (rad, atan2 with y down): up and a little left */
export const FORCEPS_ANG = -1.95;

export type ForcepsState = {tipA: P; tipB: P; close: number; on: number; lift: number};
/** ang = the direction toward the hand (default FORCEPS_ANG); gape = the open extra opening (default FORCEPS.gape) */
export type ForcepsOpts = {ang?: number; gape?: number};

/** a jaw's centreline in its chord frame: [u along the chord 0 (joint) .. 1 (point), v outward, in chord lengths] */
const JAW: [number, number][] = [
  [0, 0], [0.1, 0.014], [0.22, 0.06], [0.38, 0.148], [0.55, 0.205], [0.7, 0.218], [0.82, 0.186], [0.91, 0.124], [0.96, 0.068], [0.985, 0.03], [1, 0],
];
/** its half width (mm) at those stations: forged and heavy at the joint, a sharp point */
const JAW_W = [2.25, 2.15, 1.95, 1.72, 1.5, 1.3, 1.1, 0.88, 0.66, 0.4, 0];
/** a handle's centreline in the same frame (mm: x back from the joint, y toward the OTHER jaw's side) */
const HAN: [number, number][] = [[0, 0], [-6, -0.75], [-16, -2.2], [-32, -4.3], [-50, -6.1], [-64, -7.1], [-FORCEPS.handle + FORCEPS.ringRy - 0.6, -7.8]];
const HAN_W = [2.25, 2.2, 2.0, 1.85, 1.85, 1.95, 2.1];

// ------------------------------------------------------------------------------------------------ shared bits
const LIGHT: P = nrm(pt(-0.62, -0.78));
const NS = 'non-scaling-stroke' as const;
const f = (n: number) => (Math.abs(n) < 1e-6 ? '0' : n.toFixed(3));
const Pf = (p: P) => `${f(p.x)} ${f(p.y)}`;
const deg = (r: number) => (r * 180) / Math.PI;
const wrapA = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/** a curved tapered bar from a centreline with half widths: outline and the lit / shadow bands (as instruments.tsx) */
const bar = (c: P[], hw: number[], pointed = false) => {
  const n = c.length;
  const T = c.map((_, i) => nrm(sub(c[Math.min(n - 1, i + 1)], c[Math.max(0, i - 1)])));
  const N = T.map(perp);
  const lt = N.map((nn) => (nn.x * LIGHT.x + nn.y * LIGHT.y >= 0 ? 1 : -1));
  const band = (k0: number, k1: number, lightSide: boolean) => {
    const a = c.map((p, i) => add(p, mul(N[i], hw[i] * k0 * (lightSide ? lt[i] : -lt[i]))));
    const b = c.map((p, i) => add(p, mul(N[i], hw[i] * k1 * (lightSide ? lt[i] : -lt[i]))));
    return `${open(a, 0.9)}L${open([...b].reverse(), 0.9).slice(1)}Z`;
  };
  const left = c.map((p, i) => add(p, mul(N[i], hw[i])));
  const right = c.map((p, i) => add(p, mul(N[i], -hw[i])));
  const tipCap = pointed ? '' : `L${Pf(add(c[n - 1], mul(T[n - 1], hw[n - 1] * 0.6)))}`;
  const startCap = `L${Pf(add(c[0], mul(T[0], -hw[0] * 0.6)))}`;
  const outline = `${open(left, 0.9)}${tipCap}L${open([...right].reverse(), 0.9).slice(1)}${startCap}Z`;
  return {outline, lit: band(0.16, 0.62, true), spec: band(0.3, 0.48, true), dark: band(0.28, 1.0, false), core: band(-0.05, 0.28, false), rim: band(0.74, 0.9, false)};
};
const SteelBar: React.FC<{b: ReturnType<typeof bar>}> = ({b}) => (
  <g>
    <path d={b.outline} fill={C.steel} />
    <path d={b.dark} fill={C.steelDeep} opacity={0.75} />
    <path d={b.core} fill={mix(C.steel, C.steelDeep, 0.4)} opacity={0.5} />
    <path d={b.rim} fill={C.steelLit} opacity={0.32} />
    <path d={b.lit} fill={C.steelLit} opacity={0.78} />
    <path d={b.spec} fill="#FFFFFF" opacity={0.95} />
  </g>
);
const Under: React.FC<{d: string; fillRule?: 'evenodd' | 'nonzero'}> = ({d, fillRule}) => (
  <path d={d} fill={INK} stroke={INK} strokeWidth={INST_INK} strokeLinejoin="round" vectorEffect={NS} fillRule={fillRule} />
);

// ------------------------------------------------------------------------------------------------ geometry
type Arm = {
  /** the point */
  tip: P;
  /** the whole arm's centreline from the ring end of the handle, through the joint, to the point, and half widths */
  line: P[];
  w: number[];
  /** index of the joint in line */
  iH: number;
  /** finger ring centre and its axis (unit, along the handle away from the joint) */
  ring: P;
  rAx: P;
  /** where the ratchet bar leaves the handle */
  rat: P;
};
export type ForcepsGeo = {
  /** the points now (with the open gape), the bite's midpoint, the joint, the unit axis from the tips toward the hand */
  A: P; B: P; M: P; H: P; ax: P;
  arms: [Arm, Arm];
  /** the box's long axis (unit) */
  boxAx: P;
  /** the grip (between the finger rings: the hand is there) */
  grip: P;
};

/** The instrument's geometry, unlifted and not withdrawn. sc = a size scale (1 for the instrument layer; the shadow
 *  builds it at bone depth with the instrument layer's magnification). */
export const forcepsGeo = (st: ForcepsState, o: ForcepsOpts = {}, sc = 1): ForcepsGeo => {
  const gape = (o.gape ?? FORCEPS.gape) * sc;
  const hand = dir(o.ang ?? FORCEPS_ANG);
  const ab = sub(st.tipB, st.tipA);
  const dAB = len(ab) || 1e-6;
  const u = mul(ab, 1 / dAB);
  const opn = gape * 0.5 * (1 - clamp(st.close));
  const A = add(st.tipA, mul(u, -opn)), B = add(st.tipB, mul(u, opn));
  const M = mul(add(A, B), 0.5);
  const d = len(sub(B, A));
  // the bisector on the hand's side, turned toward the hand by at most maxSkew
  let nb = perp(u);
  if (nb.x * hand.x + nb.y * hand.y < 0) nb = mul(nb, -1);
  const da = wrapA(Math.atan2(hand.y, hand.x) - Math.atan2(nb.y, nb.x));
  const sk = clamp(da, -FORCEPS.maxSkew, FORCEPS.maxSkew);
  const ax = dir(Math.atan2(nb.y, nb.x) + sk);
  const Lc = FORCEPS.jaw * sc;
  // the joint's distance from the bite's midpoint: the mean chord stays the forged length (never closer than 0.35 Lc)
  const half = d / 2;
  const cs = ax.x * nb.x + ax.y * nb.y;
  const hd = Math.max(0.35 * Lc, Math.sqrt(Math.max(0, Lc * Lc - half * half)) / Math.max(0.6, cs));
  const H = add(M, mul(ax, hd));
  const mkArm = (tip: P, other: P): Arm => {
    const ch = sub(tip, H);
    const Lx = len(ch) || 1e-6;
    const e1 = mul(ch, 1 / Lx);
    let e2 = perp(e1);
    if (e2.x * (tip.x - other.x) + e2.y * (tip.y - other.y) < 0) e2 = mul(e2, -1);
    const k = Lx / Lc;
    const jaw = JAW.map(([uu, vv]) => add(H, add(mul(e1, uu * Lx), mul(e2, vv * Lc * k))));
    const han = HAN.map(([hx, hy]) => add(H, add(mul(e1, hx * sc), mul(e2, hy * sc))));
    const line = [...[...han].reverse(), ...jaw.slice(1)];
    const w = [...[...HAN_W].reverse(), ...JAW_W.slice(1)].map((x) => x * sc);
    const rAx = nrm(sub(han[han.length - 1], han[han.length - 2]));
    const ring = add(han[han.length - 1], mul(rAx, (FORCEPS.ringRy - 0.6) * sc));
    // the ratchet bar's root: the handle's point at the ratchet's radius from the joint
    let rat = han[han.length - 1];
    for (let i = 0; i < han.length - 1; i++) {
      const r0 = len(sub(han[i], H)), r1 = len(sub(han[i + 1], H));
      const R = FORCEPS.ratchet * sc;
      if (r0 <= R && r1 >= R) {
        const t = (R - r0) / (r1 - r0 || 1);
        rat = add(han[i], mul(sub(han[i + 1], han[i]), t));
        break;
      }
    }
    return {tip, line, w, iH: han.length - 1, ring, rAx, rat};
  };
  const arms: [Arm, Arm] = [mkArm(A, B), mkArm(B, A)];
  const a0 = arms[0];
  const boxAx = nrm(sub(a0.line[a0.iH + 1], a0.line[a0.iH - 1]));
  return {A, B, M, H, ax, arms, boxAx, grip: mul(add(arms[0].ring, arms[1].ring), 0.5)};
};

/** the lift and the withdrawal as one map: the instrument grows about the grip as it rises (LIFT, as liftXf), backs
 *  away along its axis, drifts toward the lower right; on < 1 carries it out along its axis. sc as forcepsGeo. */
const DRIFT: P = nrm(pt(1, 1));
const forcepsXf = (g: ForcepsGeo, st: ForcepsState, sc = 1) => {
  const l = clamp(st.lift);
  const k = 1 + LIFT.rise * l;
  const gripDist = Math.max(0, (g.grip.x - g.M.x) * g.ax.x + (g.grip.y - g.M.y) * g.ax.y);
  const off = add(add(mul(g.ax, LIFT.back * l * sc + (k - 1) * gripDist), mul(DRIFT, LIFT.drift * l * sc)), mul(g.ax, withdrawDist(clamp(st.on)) * sc));
  const map = (p: P) => add(add(g.grip, mul(sub(p, g.grip), k)), off);
  const G = g.grip;
  const svg = l < 1e-5 && len(off) < 1e-6 ? undefined : `translate(${Pf(add(G, off))}) scale(${k.toFixed(5)}) translate(${Pf(mul(G, -1))})`;
  return {l, k, off, map, svg};
};

/** the points' contact for the bone (the bite): 0..1, and their height above the bone (mm) */
export const forcepsContact = (st: ForcepsState) => {
  const h = LIFT.h * clamp(st.lift) + FORCEPS.hover * (1 - ss(st.close, 0.55, 0.97));
  const wd = withdrawDist(clamp(st.on));
  return {h, contact: clamp(1 - h / 0.3) * (1 - clamp(wd / 4))};
};

// ------------------------------------------------------------------------------------------------ the instrument
const ringPath = (c: P, axU: P, rx: number, ry: number) => {
  // an oval: ry along axU, rx across (sampled, so it works in any orientation)
  const n = 40;
  const v = perp(axU);
  const pts: P[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push(add(c, add(mul(axU, ry * Math.cos(a)), mul(v, rx * Math.sin(a)))));
  }
  return 'M' + pts.map(Pf).join('L') + 'Z';
};
/** a finger ring: an oval steel band (ink, satin steel lit from the upper left, a gloss on its lit side) */
const Ring: React.FC<{id: string; c: P; axU: P; sc: number}> = ({id, c, axU, sc}) => {
  const {ringRx: rx, ringRy: ry, ringW: bw} = FORCEPS;
  const outer = ringPath(c, axU, rx * sc, ry * sc);
  const inner = ringPath(c, axU, (rx - bw) * sc, (ry - bw) * sc);
  const d = `${outer}${inner}`;
  const g0 = add(c, mul(LIGHT, ry * sc)), g1 = add(c, mul(LIGHT, -ry * sc));
  // the gloss: an arc on the band's lit side, from about 10 to 2 o'clock in the light's frame
  const v = perp(axU);
  const arc: P[] = [];
  const mid = (rx - bw * 0.42) * sc, midY = (ry - bw * 0.42) * sc;
  const aL = Math.atan2(LIGHT.x * v.x + LIGHT.y * v.y, LIGHT.x * axU.x + LIGHT.y * axU.y);
  for (let k = 0; k <= 10; k++) {
    const a = aL - 0.75 + (1.5 * k) / 10;
    arc.push(add(c, add(mul(axU, midY * Math.cos(a)), mul(v, mid * Math.sin(a)))));
  }
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1={f(g0.x)} y1={f(g0.y)} x2={f(g1.x)} y2={f(g1.y)}>
          <stop offset={0} stopColor={C.steelLit} />
          <stop offset={0.28} stopColor={mix(C.steel, C.steelLit, 0.5)} />
          <stop offset={0.5} stopColor={C.steel} />
          <stop offset={0.78} stopColor={C.steelDeep} />
          <stop offset={1} stopColor={shade(C.steelDeep, 0.2)} />
        </linearGradient>
      </defs>
      <Under d={d} fillRule="evenodd" />
      <path d={d} fill={`url(#${id}-g)`} fillRule="evenodd" />
      <path d={open(arc, 0.9)} fill="none" stroke="#FFFFFF" strokeWidth={f(bw * 0.3 * sc)} strokeLinecap="round" opacity={0.9} />
    </g>
  );
};

/** the two ratchet bars: arcs about the joint, one from each handle, overlapping past the middle, teeth between */
const Ratchet: React.FC<{g: ForcepsGeo; sc: number}> = ({g, sc}) => {
  const {H} = g;
  const [a, b] = g.arms;
  const R = len(sub(a.rat, H));
  const pa = Math.atan2(a.rat.y - H.y, a.rat.x - H.x), pb = Math.atan2(b.rat.y - H.y, b.rat.x - H.x);
  const D = wrapA(pb - pa);
  const ov = (6 * sc) / R;
  const bw = FORCEPS.ratchetW * sc;
  const arc = (p0: number, p1: number, r: number) => {
    const pts: P[] = [];
    for (let k = 0; k <= 14; k++) {
      const p = p0 + ((p1 - p0) * k) / 14;
      pts.push(add(H, mul(dir(p), r)));
    }
    return pts;
  };
  const sg = Math.sign(D) || 1;
  const aEnd = pa + D * 0.5 + sg * ov, bEnd = pb - D * 0.5 - sg * ov;
  const A1 = arc(pa, aEnd, R + bw * 0.5);
  const B1 = arc(pb, bEnd, R - bw * 0.5);
  const ba = bar(A1, A1.map(() => bw * 0.5));
  const bb = bar(B1, B1.map(() => bw * 0.5));
  // the teeth: small saw teeth along the outer bar's inner edge where the bars overlap
  const teeth: string[] = [];
  const p0 = pa + D * 0.5 - sg * ov, p1 = aEnd;
  const nT = Math.max(2, Math.floor((Math.abs(p1 - p0) * R) / (1.1 * sc)));
  for (let k = 0; k < nT; k++) {
    const q0 = p0 + ((p1 - p0) * k) / nT, q1 = p0 + ((p1 - p0) * (k + 0.6)) / nT;
    const r0 = R, r1 = R - bw * 0.42;
    const t0 = add(H, mul(dir(q0), r0)), t1 = add(H, mul(dir(q1), r1)), t2 = add(H, mul(dir(p0 + ((p1 - p0) * (k + 1)) / nT), r0));
    teeth.push(`M${Pf(t0)}L${Pf(t1)}L${Pf(t2)}Z`);
  }
  return (
    <g>
      <Under d={bb.outline} />
      <SteelBar b={bb} />
      <Under d={ba.outline} />
      <SteelBar b={ba} />
      <path d={teeth.join('')} fill={C.steelDeep} stroke={INK} strokeWidth={INST_INK * 0.22} vectorEffect={NS} strokeLinejoin="round" />
    </g>
  );
};

/** The forceps, drawn in the instrument layer (Scene: depth INSTR_Z, the tips reprojected to bone depth). px = world mm
 *  per screen pixel at depth 0 (keeps the points' glints visible at phone size). */
export const ReductionForceps: React.FC<{id: string; st: ForcepsState; px: number; ang?: number; gape?: number}> = ({id, st, px, ang, gape}) => {
  if (withdrawDist(clamp(st.on)) >= 199.5) return null;
  const g = forcepsGeo(st, {ang, gape});
  const xf = forcepsXf(g, st);
  const [aA, aB] = g.arms;
  const bA = bar(aA.line, aA.w, true);
  const bB = bar(aB.line, aB.w, true);
  const id_ = (k: string) => `${id}-${k}`;
  const bx = g.boxAx, by = perp(bx);
  const {boxL, boxW, pin} = FORCEPS;
  // the box: a rounded plate over the crossing, with its two cheeks' edges and the pivot pin
  const boxPts = (l: number, w: number, r: number) => {
    const out: P[] = [];
    const corners: [number, number][] = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
    corners.forEach(([sx, sy], ci) => {
      const cc = add(g.H, add(mul(bx, sx * (l / 2 - r)), mul(by, sy * (w / 2 - r))));
      for (let k = 0; k <= 4; k++) {
        const a = (ci * Math.PI) / 2 + (k / 4) * (Math.PI / 2);
        out.push(add(cc, add(mul(bx, Math.cos(a) * r), mul(by, Math.sin(a) * r))));
      }
    });
    return 'M' + out.map(Pf).join('L') + 'Z';
  };
  const boxD = boxPts(boxL, boxW, 2.2);
  const g0 = add(g.H, mul(LIGHT, boxW * 0.6)), g1 = add(g.H, mul(LIGHT, -boxW * 0.6));
  // glints on the points: a short bright tick on each jaw's lit side just behind the point
  const glint = (a: Arm) => {
    const n = a.line.length;
    const p = a.line[n - 3], q = a.line[n - 2];
    const T = nrm(sub(a.line[n - 1], p));
    let N = perp(T);
    if (N.x * LIGHT.x + N.y * LIGHT.y < 0) N = mul(N, -1);
    const o = Math.max(0.25, a.w[n - 3] * 0.35);
    const s0 = add(p, mul(N, o)), s1 = add(q, mul(N, Math.max(0.12, a.w[n - 2] * 0.3)));
    return <path d={`M${Pf(s0)}L${Pf(s1)}`} stroke="#FFFFFF" strokeWidth={Math.max(1.4, 0.3 / Math.max(px, 1e-4))} strokeLinecap="round" vectorEffect={NS} opacity={0.95} />;
  };
  return (
    <g transform={xf.svg}>
      <defs>
        <linearGradient id={id_('bx')} gradientUnits="userSpaceOnUse" x1={f(g0.x)} y1={f(g0.y)} x2={f(g1.x)} y2={f(g1.y)}>
          <stop offset={0} stopColor={C.steelLit} />
          <stop offset={0.3} stopColor={mix(C.steel, C.steelLit, 0.45)} />
          <stop offset={0.62} stopColor={C.steel} />
          <stop offset={1} stopColor={C.steelDeep} />
        </linearGradient>
      </defs>
      {/* the ratchet under the handles, the rings at their ends */}
      <Ratchet g={g} sc={1} />
      <Ring id={id_('rb')} c={aB.ring} axU={aB.rAx} sc={1} />
      <Ring id={id_('ra')} c={aA.ring} axU={aA.rAx} sc={1} />
      {/* arm B (passes through the box), then arm A over it */}
      <Under d={bB.outline} />
      <SteelBar b={bB} />
      {glint(aB)}
      <Under d={bA.outline} />
      <SteelBar b={bA} />
      {glint(aA)}
      {/* the box joint and its pivot pin */}
      <Under d={boxD} />
      <path d={boxD} fill={`url(#${id_('bx')})`} />
      <path d={boxPts(boxL - 2.2, boxW - 2.4, 1.4)} fill="none" stroke={C.steelDeep} strokeWidth={INST_INK * 0.3} opacity={0.55} vectorEffect={NS} />
      <path d={`M${Pf(add(g.H, add(mul(bx, -boxL * 0.32), mul(by, (boxW / 2 - 0.9) * (by.x * LIGHT.x + by.y * LIGHT.y >= 0 ? 1 : -1)))))}L${Pf(add(g.H, add(mul(bx, boxL * 0.32), mul(by, (boxW / 2 - 0.9) * (by.x * LIGHT.x + by.y * LIGHT.y >= 0 ? 1 : -1)))))}`} stroke="#FFFFFF" strokeWidth={0.6} strokeLinecap="round" opacity={0.85} />
      <circle cx={f(g.H.x)} cy={f(g.H.y)} r={f(pin)} fill={C.steelDeep} stroke={INK} strokeWidth={INST_INK * 0.4} vectorEffect={NS} />
      <circle cx={f(g.H.x + LIGHT.x * pin * 0.25)} cy={f(g.H.y + LIGHT.y * pin * 0.25)} r={f(pin * 0.62)} fill={C.steel} />
      <circle cx={f(g.H.x + LIGHT.x * pin * 0.42)} cy={f(g.H.y + LIGHT.y * pin * 0.42)} r={f(pin * 0.26)} fill="#FFFFFF" opacity={0.9} />
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ contact shadow
/** as instruments.tsx: shadow offset per mm of height, its direction on the bone, colours */
const SH_K = 0.8;
const AWAY: P = dir(0.4);
const SHADOW_COL = '#2B170D';
const PRESS_COL = '#FFFDF6';
/** how much larger an offset is drawn in the instrument layer than on a receiving layer at depth z (0 = the bone), for a
 *  camera whose depth-0 scale is px */
const instrK = (px: number, z = 0) => {
  const d = DIST * px * 1080;
  return (d + z) / (d + INSTR_Z);
};

/** The forceps' contact shadow on the bone. Scene: the BONE layer (depth 0), with the state in depth-0 world mm (NOT
 *  reprojected); px = world mm per screen pixel at depth 0. The jaws' cast shadow (flat cel steps, sliding away from
 *  the points as they rise), and while the points bite, a small dark pit with a pressure highlight at each.
 *  z (optional) = a different receiving layer's depth, e.g. the skin's (Scene: Z_SKIN): then pass the tips reprojected
 *  to that layer; only the parts of the jaws above that surface cast (the points are down in the window), and there is
 *  no bite. On the skin, wrap it in the skin's window mask (ArmSkin's `${id}-wm`) so it does not fall into the hole. */
export const ForcepsShadow: React.FC<{st: ForcepsState; px: number; ang?: number; gape?: number; z?: number}> = ({st, px, ang, gape, z = 0}) => {
  const kI = instrK(px, z);
  const above = Math.max(0, -z);
  const wd = withdrawDist(clamp(st.on));
  const fade = 1 - clamp(wd / 40);
  if (fade <= 0.001) return null;
  const id = uid('fsh');
  const g = forcepsGeo(st, {ang, gape}, kI);
  // the points are exact (the scene reprojects them); offsets from them are drawn kI larger: build at scale kI about
  // the bite, then put the tips back where they touch
  const xf = forcepsXf(g, st, kI);
  const {h: h0, contact} = forcepsContact(st);
  const shadowOf = (a: Arm, key: string) => {
    const n = a.line.length;
    // from the point (or where the jaw rises above the receiving surface) back along the jaw for about 18 mm
    const c: P[] = [];
    const w: number[] = [];
    let s = 0;
    const sMax = (18 + above / FORCEPS.slope) * kI;
    for (let i = n - 1; i >= a.iH; i--) {
      if (i < n - 1) s += len(sub(a.line[i], a.line[i + 1]));
      if (s > sMax) break;
      const h = h0 + FORCEPS.slope * s - above;
      if (h < 0) continue;
      const p = xf.map(a.line[i]);
      c.push(add(p, mul(AWAY, h * SH_K)));
      w.push(c.length === 1 ? 0 : Math.max(a.w[i] * xf.k * 1.04, 1.6 * px));
    }
    if (c.length < 3) return null;
    const m = c.length;
    const T = c.map((_, i) => nrm(sub(c[Math.min(m - 1, i + 1)], c[Math.max(0, i - 1)])));
    const N = T.map(perp);
    const left = c.map((p, i) => add(p, mul(N[i], w[i])));
    const right = c.map((p, i) => add(p, mul(N[i], -w[i])));
    const d = `${open(left, 0.9)}L${open([...right].reverse(), 0.9).slice(1)}Z`;
    const alpha = 0.5 * (1 - 0.3 * xf.l) * fade;
    return (
      <g key={key}>
        <defs>
          <linearGradient id={`${id}-${key}`} gradientUnits="userSpaceOnUse" x1={f(c[0].x)} y1={f(c[0].y)} x2={f(c[m - 1].x)} y2={f(c[m - 1].y)}>
            <stop offset="0" stopColor={SHADOW_COL} stopOpacity={alpha} />
            <stop offset="0.5" stopColor={SHADOW_COL} stopOpacity={alpha} />
            <stop offset="0.5" stopColor={SHADOW_COL} stopOpacity={alpha * 0.62} />
            <stop offset="0.86" stopColor={SHADOW_COL} stopOpacity={alpha * 0.62} />
            <stop offset="1" stopColor={SHADOW_COL} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={d} fill={`url(#${id}-${key})`} />
      </g>
    );
  };
  // the bite: a small pit where each point presses in, dark on its far side, a pressure highlight toward the light
  const ct = above > 0 ? 0 : contact * fade;
  const bite = (a: Arm, key: string) => {
    if (ct <= 0.01) return null;
    const p = xf.map(a.tip);
    const r = Math.max(0.28, 3 * px);
    // the point's tangent (toward the point): the dimple opens a little ahead of it
    const n = a.line.length;
    const T = nrm(sub(a.line[n - 1], a.line[n - 2]));
    const q = add(p, mul(T, r * 0.6));
    return (
      <g key={key} opacity={ct}>
        <circle cx={f(q.x - LIGHT.x * r * 0.7)} cy={f(q.y - LIGHT.y * r * 0.7)} r={f(r * 1.2)} fill={PRESS_COL} opacity={0.75} />
        <circle cx={f(q.x + AWAY.x * r * 0.55)} cy={f(q.y + AWAY.y * r * 0.55)} r={f(r * 1.15)} fill={SHADOW_COL} opacity={0.6} />
        <circle cx={f(q.x)} cy={f(q.y)} r={f(r * 0.62)} fill={SHADOW_COL} opacity={0.85} />
      </g>
    );
  };
  const [aA, aB] = g.arms;
  return (
    <g>
      {shadowOf(aA, 'a')}
      {shadowOf(aB, 'b')}
      {bite(aA, 'pa')}
      {bite(aB, 'pb')}
    </g>
  );
};
