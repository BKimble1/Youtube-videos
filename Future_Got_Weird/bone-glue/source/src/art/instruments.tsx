// The surgeon's two instruments, drawn in wrist-plane millimetres (the world of anatomy.ts: x right, y down, origin at
// the fracture centre).
//
//   Applicator: a compact syringe-type applicator for the teal adhesive (NOT a consumer glue tube): blunt steel cannula
//     (32 mm, 1.3 mm diameter, a slight bend 6 mm from the tip), clear barrel (10.4 x 40 mm) showing the gel whose level
//     drops with the plunger travel, finger flange, white plunger rod and thumb pad, dark rubber stopper. The surgeon
//     holds it in a syringe grip: the index along the barrel, the middle finger under the flange, the thumb on the pad.
//   Probe (V2): a slim positioning probe / pusher: a fine steel shaft (2.2 mm) tapering over its last 9 mm to a small
//     rounded point, a turned ferrule and collar, and a ribbed steel handle (9.6 mm thick, 92 mm long); 156 mm overall.
//     The surgeon's left hand holds it in a precision (pencil) grip at the front of the handle.
//
// Both rise off the bone with `lift` (liftXf: they back away along their axis, drift a little toward the lower right,
// away from the key light, and grow slightly as they come up toward the lens). Their contact shadows on the bone
// (ProbeShadow, AppShadow) are drawn by the scene in the bone layer: they meet the tip at contact and separate, soften
// and fade as it lifts.
//
// Weird Crew finish: navy ink contours (constant on-screen width: non-scaling strokes, so the same art is crisp from
// the extreme close-up of the tips to the wide clinical shot), cel gradients lit from the upper left (LIGHT),
// small white glosses. No text, numbers or glyphs. Deterministic.
import React from 'react';
import {P, pt, add, sub, mul, nrm, perp, dir, open} from '../core/geo';
import {mix, lit, shade} from '../core/color';
import {C, INK} from './palette';
import {clamp} from '../lib';
import {uid} from '../core/ids';
import {AppState2, ProbeState} from '../v2state';

// ------------------------------------------------------------------------------------------------ shared drawing bits
/** direction TOWARD the key light (upper left), as dc/shade LIGHT */
const LIGHT: P = nrm(pt(-0.62, -0.78));
const f = (n: number) => (Math.abs(n) < 1e-6 ? '0' : n.toFixed(3));
const Pf = (p: P) => `${f(p.x)} ${f(p.y)}`;
const deg = (r: number) => (r * 180) / Math.PI;
/** contour width in screen pixels (non-scaling strokes): half of it (2.8 px) shows outside each silhouette, the same
 *  weight as the patient's skin and the surgeon's contours */
export const INST_INK = 5.6;
const NS = 'non-scaling-stroke' as const;

/** the ink underlay of a silhouette: filled navy plus a constant-width navy stroke */
const Under: React.FC<{d: string; w?: number; color?: string; fillRule?: 'evenodd' | 'nonzero'}> = ({d, w = INST_INK, color = INK, fillRule}) => (
  <path d={d} fill={color} stroke={color} strokeWidth={w} strokeLinejoin="round" vectorEffect={NS} fillRule={fillRule} />
);
/** a crisp contour line on top (for clear plastic, where an underlay would show through) */
const Line: React.FC<{d: string; w?: number; color?: string; opacity?: number}> = ({d, w = INST_INK * 0.5, color = INK, opacity}) => (
  <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" vectorEffect={NS} opacity={opacity} />
);
const rect = (u0: number, u1: number, v0: number, v1: number) => `M${f(u0)} ${f(v0)}H${f(u1)}V${f(v1)}H${f(u0)}Z`;
/** a rectangle with rounded corners in an axis frame */
const rrect = (u0: number, u1: number, v0: number, v1: number, r: number) => {
  const rr = Math.min(r, Math.abs(u1 - u0) / 2, Math.abs(v1 - v0) / 2);
  return `M${f(u0 + rr)} ${f(v0)}H${f(u1 - rr)}A${f(rr)} ${f(rr)} 0 0 1 ${f(u1)} ${f(v0 + rr)}V${f(v1 - rr)}A${f(rr)} ${f(rr)} 0 0 1 ${f(u1 - rr)} ${f(v1)}H${f(u0 + rr)}A${f(rr)} ${f(rr)} 0 0 1 ${f(u0)} ${f(v1 - rr)}V${f(v0 + rr)}A${f(rr)} ${f(rr)} 0 0 1 ${f(u0 + rr)} ${f(v0)}Z`;
};
/** a solid of revolution seen side-on, from a radius profile [[u, r], ...] (symmetric about v = 0) */
const profile = (pr: [number, number][]) => {
  const top = pr.map(([u, r]) => `${f(u)} ${f(-r)}`);
  const bot = [...pr].reverse().map(([u, r]) => `${f(u)} ${f(r)}`);
  return `M${top.join('L')}L${bot.join('L')}Z`;
};
/** linear gradient across a cylinder lying along u in an axis frame: offset 0 = the lit edge (v = vs * r) */
const CylGrad: React.FC<{id: string; r: number; vs: number; stops: [number, string, number?][]}> = ({id, r, vs, stops}) => (
  <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={f(vs * r)} x2="0" y2={f(-vs * r)}>
    {stops.map(([o, c, a], i) => (
      <stop key={i} offset={o} stopColor={c} stopOpacity={a ?? 1} />
    ))}
  </linearGradient>
);
const STEEL_STOPS: [number, string][] = [
  [0, mix(C.steel, C.steelLit, 0.35)],
  [0.1, C.steelLit],
  [0.22, C.steelLit],
  [0.34, lit(C.steel, 0.22)],
  [0.56, C.steel],
  [0.78, C.steelDeep],
  [0.92, shade(C.steelDeep, 0.22)],
  [1, mix(C.steelDeep, C.steel, 0.55)],
];

// ------------------------------------------------------------------------------------------------ applicator
/** the applicator's state (V1 shape; V2's AppState2 adds lift) */
export type AppState = {tip: P; ang: number; press: number; gel: number; lift?: number};

// ------------------------------------------------------------------------------------------------ lift
/** An instrument rising off the bone: it backs away along its axis by `back` mm, drifts `drift` mm toward the lower
 *  right (away from the key light) and grows by `rise` (it comes up toward the lens). The growth is about the grip, so
 *  the hand that holds it keeps its size; the back-off makes up for the tip's growth, so the tip ends exactly `back`
 *  mm back along the axis and `drift` mm to the lower right of its contact point. h = the tip's height (mm) at lift 1,
 *  for the contact shadow. */
export const LIFT = {back: 6, drift: 3, rise: 0.035, h: 5};
const DRIFT: P = nrm(pt(1, 1));
export type LiftXf = {l: number; k: number; G: P; off: P; map: (p: P) => P; svg: string | undefined};
/** G = the grip point (unlifted), ax = unit axis from the tip toward the handle, gripDist = the tip's distance behind
 *  the grip along the axis */
export const liftXf = (G: P, ax: P, gripDist: number, lift: number): LiftXf => {
  const l = clamp(lift);
  const k = 1 + LIFT.rise * l;
  const off = add(mul(ax, LIFT.back * l + (k - 1) * gripDist), mul(DRIFT, LIFT.drift * l));
  const map = (p: P) => add(add(G, mul(sub(p, G), k)), off);
  const svg = l < 1e-5 ? undefined : `translate(${Pf(add(G, off))}) scale(${k.toFixed(5)}) translate(${Pf(mul(G, -1))})`;
  return {l, k, G, off, map, svg};
};

/** applicator dimensions (mm along the instrument from the cannula tip, s) */
export const APP = {
  tipSeg: 6, // the bent tip segment
  bend: -0.24, // the tip segment's turn from the main axis (rad): it hooks a little toward the wound
  cannula: 32,
  r: 0.65, // cannula radius
  ferrule: 34,
  hub: 40,
  cone: 44, // barrel front shoulder ends
  barrelEnd: 84,
  flangeEnd: 86.6,
  rB: 5.2, // barrel outer radius
  rIn: 4.4, // inner radius
  in0: 45, // inner usable length starts
  inLen: 35,
  stopT: 5,
  rod: 40, // rod length from the stopper's back face to the pad
  rodW: 3.2,
  padR: 8.0,
  padT: 2.6,
  flangeW: 11,
};

/** the applicator's axis: a point at arc length s from the tip, the bend point, the two directions */
export const appAxis = (st: AppState) => {
  const dTip = dir(st.ang + APP.bend);
  const Bp = add(st.tip, mul(dTip, APP.tipSeg));
  const dMain = dir(st.ang);
  const at = (s: number): P => (s <= APP.tipSeg ? add(st.tip, mul(dTip, s)) : add(Bp, mul(dMain, s - APP.tipSeg)));
  return {Bp, dTip, dMain, at};
};
/** the stopper's front face (s) for a plunger travel */
const stopperS = (press: number) => APP.in0 + APP.inLen * (1 - clamp(press));

/** Where the surgeon's right hand holds the applicator (a syringe grip seen from above): p = the centre of the finger
 *  flange (the index curls round its inner wing), ang = the instrument's direction from the back toward the tip
 *  (radians, atan2 convention, y down; the hand's axis lies along it); padBack = the centre of the thumb pad's back
 *  face, where the thumb presses; flangeS / padBackS = their arc lengths from the tip. */
export const APP_GRIP = {s: (APP.barrelEnd + APP.flangeEnd) / 2};
/** the applicator's lift transform (about the flange) */
export const appLift = (st: AppState): LiftXf => {
  const ax = appAxis(st);
  const G = ax.at(APP_GRIP.s);
  return liftXf(G, ax.dMain, Math.max(0, (G.x - st.tip.x) * ax.dMain.x + (G.y - st.tip.y) * ax.dMain.y), st.lift ?? 0);
};
export const appGrip = (st: AppState): {p: P; ang: number; padBack: P; flangeS: number; padBackS: number} => {
  const ax = appAxis(st);
  const lx = appLift(st);
  const sPB = stopperS(st.press) + APP.stopT + APP.rod + APP.padT;
  return {p: lx.map(ax.at(APP_GRIP.s)), ang: st.ang + Math.PI, padBack: lx.map(ax.at(sPB)), flangeS: APP_GRIP.s, padBackS: sPB};
};

export const Applicator: React.FC<{id: string; s: AppState}> = ({id, s: st}) => {
  const lx = appLift(st);
  const {Bp, dTip, dMain: dMainV, at} = appAxis(st);
  const r = APP.r;
  const angM = deg(st.ang);
  const angT = deg(st.ang + APP.bend);
  // the light in each axis frame decides the lit edge of every cylinder
  const toFrame = (a: number) => pt(LIGHT.x * Math.cos(a) + LIGHT.y * Math.sin(a), -LIGHT.x * Math.sin(a) + LIGHT.y * Math.cos(a));
  const Lm = toFrame(st.ang);
  const Lt = toFrame(st.ang + APP.bend);
  const vs = Lm.y >= 0 ? 1 : -1; // lit edge side in the main frame
  const vt = Lt.y >= 0 ? 1 : -1;
  const u = (s: number) => s - APP.tipSeg; // main-frame u of arc length s
  const sF = stopperS(st.press);
  const sB = sF + APP.stopT; // stopper back face
  const sPad = sB + APP.rod;
  const gel = clamp(st.gel);
  const main = `translate(${Pf(Bp)}) rotate(${f(angM)})`;
  const tipT = `translate(${Pf(Bp)}) rotate(${f(angT)})`;
  const id_ = (k: string) => `${id}-${k}`;

  // --- silhouettes (main frame unless noted)
  const ferruleD = profile([
    [u(APP.cannula) - 0.2, 1.0],
    [u(APP.cannula) + 0.5, 1.12],
    [u(APP.ferrule), 1.12],
  ]);
  const hubD = profile([
    [u(APP.ferrule), 1.9],
    [u(APP.ferrule) + 0.6, 2.15],
    [u(APP.hub) - 1.6, 2.6],
    [u(APP.hub) - 1.6, 3.7],
    [u(APP.hub), 3.7],
  ]);
  const barrelD = profile([
    [u(APP.hub), 2.05],
    [u(APP.hub) + 0.4, 2.1],
    [u(APP.cone) - 1.2, 4.6],
    [u(APP.cone), APP.rB],
    [u(APP.barrelEnd), APP.rB],
  ]);
  const flangeD = rrect(u(APP.barrelEnd) - 0.2, u(APP.flangeEnd), -APP.flangeW, APP.flangeW, 1.25);
  const rodOutD = rect(u(APP.flangeEnd) - 0.3, u(sPad) + 0.2, -APP.rodW, APP.rodW);
  const padD = rrect(u(sPad), u(sPad + APP.padT), -APP.padR, APP.padR, 1.1);
  // gel inside (from the hub channel to the stopper), with the cone's taper
  const gelD = profile([
    [u(APP.ferrule) + 0.3, 0.55],
    [u(APP.hub), 0.75],
    [u(APP.cone) - 1.2, 3.75],
    [u(APP.cone) + 0.2, APP.rIn],
    [u(sF) + 0.25, APP.rIn],
  ]);
  const bulbR = 0.16 + 0.6 * gel;
  // the cannula's centreline, from the ferrule to the tip, with a short smooth arc at the bend
  const can = (() => {
    const pts: P[] = [at(APP.cannula + 0.4), at(30), at(22), at(14), at(9.5), add(Bp, mul(dMainV, 1.8))];
    const b0 = add(Bp, mul(dMainV, 1.8)), b2 = add(Bp, mul(dTip, -1.8));
    for (const t of [0.25, 0.5, 0.75]) pts.push(add(add(mul(b0, (1 - t) * (1 - t)), mul(Bp, 2 * t * (1 - t))), mul(b2, t * t)));
    pts.push(b2, add(st.tip, mul(dTip, 2.2)), add(st.tip, mul(dTip, 0.8)), st.tip);
    const tb = bar(pts, pts.map(() => r), LIGHT, true);
    // a thin reflected light along the shadow edge
    const n = pts.length;
    const T = pts.map((_, i) => nrm(sub(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)])));
    const N = T.map(perp);
    const sh = N.map((nn) => (nn.x * LIGHT.x + nn.y * LIGHT.y >= 0 ? -1 : 1));
    const a1 = pts.map((p, i) => add(p, mul(N[i], r * 0.72 * sh[i])));
    const a2 = pts.map((p, i) => add(p, mul(N[i], r * 0.86 * sh[i])));
    return {...tb, rim: `${open(a1.slice(0, n - 3), 0.9)}L${open([...a2.slice(0, n - 3)].reverse(), 0.9).slice(1)}Z`};
  })();
  // the droplet, in the tip frame (x along the tip direction toward the barrel; the drop swells out on -x)
  const dropD = `M${f(bulbR * 0.75)} ${f(-r * 0.62)}C${f(bulbR * 0.2)} ${f(-bulbR * 0.95)} ${f(-bulbR * 1.15)} ${f(-bulbR * 1.02)} ${f(-bulbR * 1.2)} 0C${f(-bulbR * 1.15)} ${f(bulbR * 1.02)} ${f(bulbR * 0.2)} ${f(bulbR * 0.95)} ${f(bulbR * 0.75)} ${f(r * 0.62)}Z`;

  return (
    <g transform={lx.svg}>
      <defs>
        <CylGrad id={id_('fe')} r={1.12} vs={vs} stops={STEEL_STOPS} />
        <CylGrad id={id_('hb')} r={3.7} vs={vs} stops={[[0, '#FFFFFF'], [0.25, lit(C.barrel, 0.5)], [0.6, C.barrel], [0.9, mix(C.barrel, C.steelDeep, 0.45)], [1, mix(C.barrel, C.steelDeep, 0.25)]]} />
        <CylGrad id={id_('br')} r={APP.rB} vs={vs} stops={[[0, '#FFFFFF', 0.85], [0.18, lit(C.barrel, 0.6), 0.55], [0.5, C.barrel, 0.3], [0.85, mix(C.barrel, C.steelDeep, 0.35), 0.45], [1, mix(C.barrel, C.steelDeep, 0.6), 0.7]]} />
        <CylGrad id={id_('gl')} r={APP.rIn} vs={vs} stops={[[0, C.glueLit], [0.22, mix(C.glueLit, C.glue, 0.5)], [0.55, C.glue], [0.86, C.glueDeep], [1, shade(C.glueDeep, 0.2)]]} />
        <CylGrad id={id_('rd')} r={APP.rodW} vs={vs} stops={[[0, '#FFFFFF'], [0.35, C.plunger], [0.75, mix(C.plunger, '#AEBBC6', 0.6)], [1, mix(C.plunger, '#8C9AA6', 0.7)]]} />
        <CylGrad id={id_('pd')} r={APP.padR} vs={vs} stops={[[0, '#FFFFFF'], [0.3, C.plunger], [0.8, mix(C.plunger, '#A9B6C1', 0.7)], [1, mix(C.plunger, '#8C9AA6', 0.8)]]} />
        <CylGrad id={id_('st')} r={APP.rIn} vs={vs} stops={[[0, lit(C.stopper, 0.35)], [0.3, C.stopper], [1, shade(C.stopper, 0.45)]]} />
        <CylGrad id={id_('fl')} r={APP.flangeW} vs={vs} stops={[[0, '#FFFFFF', 0.95], [0.3, lit(C.barrel, 0.4), 0.9], [0.7, C.barrel, 0.85], [1, mix(C.barrel, C.steelDeep, 0.5), 0.9]]} />
        <radialGradient id={id_('bu')} gradientUnits="userSpaceOnUse" cx={f(-bulbR * 0.3)} cy="0" r={f(bulbR * 1.3)} fx={f(-bulbR * 0.3 + Lt.x * bulbR * 0.5)} fy={f(Lt.y * bulbR * 0.5)}>
          <stop offset="0" stopColor={C.glueLit} />
          <stop offset="0.35" stopColor={mix(C.glueLit, C.glue, 0.6)} />
          <stop offset="0.75" stopColor={C.glue} />
          <stop offset="1" stopColor={C.glueDeep} />
        </radialGradient>
        <clipPath id={id_('bc')}>
          <path d={barrelD} />
        </clipPath>
      </defs>

      {/* ---- plunger rod and thumb pad (behind the flange) */}
      <g transform={main}>
        <Under d={rodOutD} />
        <Under d={padD} />
        <path d={rodOutD} fill={`url(#${id_('rd')})`} />
        {/* the rod's cross fin: a raised rib along its middle */}
        <path d={rect(u(APP.flangeEnd), u(sPad), -0.55, 0.55)} fill={mix(C.plunger, '#9AA8B4', 0.55)} />
        <path d={rect(u(APP.flangeEnd), u(sPad), vs * 0.55 - 0.2, vs * 0.55 + 0.2)} fill="#FFFFFF" opacity={0.9} />
        <path d={padD} fill={`url(#${id_('pd')})`} />
        <path d={rrect(u(sPad) + 0.45, u(sPad + APP.padT) - 0.6, vs > 0 ? 1.4 : -APP.padR + 1.6, vs > 0 ? APP.padR - 1.6 : -1.4, 0.4)} fill="#FFFFFF" opacity={0.85} />
      </g>

      {/* ---- barrel, flange, hub, cannula */}
      <g transform={main}>
        <Under d={flangeD} />
        <Under d={hubD} />
        <Under d={ferruleD} />
        {/* the barrel is clear: its contour is a line on top, not an underlay; an opaque pale base keeps it legible */}
        <path d={barrelD} fill={mix(C.barrel, '#8FA9B8', 0.18)} opacity={0.42} />
        {/* inside: the rod and stopper behind the gel, seen through the wall */}
        <g clipPath={`url(#${id_('bc')})`}>
          <path d={rect(u(sB), u(APP.barrelEnd) + 0.2, -APP.rodW, APP.rodW)} fill={`url(#${id_('rd')})`} opacity={0.85} />
          <path d={rect(u(sB), u(APP.barrelEnd), -0.5, 0.5)} fill={mix(C.plunger, '#9AA8B4', 0.5)} opacity={0.8} />
          {/* the gel column */}
          <path d={gelD} fill={`url(#${id_('gl')})`} />
          {/* tiny suspended bubbles in the gel, deterministic */}
          {[0.22, 0.48, 0.71].map((k, i) =>
            u(APP.cone) + 2 + k * (sF - APP.cone - 3) > u(APP.cone) + 1 && sF - APP.cone > 8 ? (
              <circle key={i} cx={f(u(APP.cone) + 2 + k * (sF - APP.cone - 4))} cy={f((i % 2 ? -1 : 1) * vs * (0.6 + i * 0.7))} r={f(0.32 + 0.12 * i)} fill={C.glueShine} opacity={0.55} />
            ) : null,
          )}
          {/* the gel's long bright reflection */}
          <path d={rect(u(APP.cone) + 0.6, u(sF) - 0.4, vs * APP.rIn * 0.62 - 0.35, vs * APP.rIn * 0.62 + 0.35)} fill={C.glueShine} opacity={0.55} />
          {/* rubber stopper: two ribs, a concave face toward the gel */}
          <path d={`M${f(u(sF))} ${f(-APP.rIn)}H${f(u(sB))}V${f(APP.rIn)}H${f(u(sF))}Q${f(u(sF) + 0.9)} 0 ${f(u(sF))} ${f(-APP.rIn)}Z`} fill={`url(#${id_('st')})`} />
          {[0.5, 4.2].map((k, i) => (
            <path key={i} d={rrect(u(sF) + k, u(sF) + k + 1.3, -APP.rIn - 0.2, APP.rIn + 0.2, 0.5)} fill={shade(C.stopper, 0.25)} />
          ))}
          <path d={rect(u(sF) + 1.9, u(sF) + 4.1, vs * APP.rIn * 0.7 - 0.3, vs * APP.rIn * 0.7 + 0.3)} fill="#FFFFFF" opacity={0.28} />
        </g>
        {/* the clear wall: tint, edges, two highlights */}
        <path d={barrelD} fill={`url(#${id_('br')})`} />
        <path d={rect(u(APP.cone) + 1, u(APP.barrelEnd) - 0.6, vs * APP.rB * 0.84 - 0.42, vs * APP.rB * 0.84 + 0.42)} fill="#FFFFFF" opacity={0.92} />
        <path d={rect(u(APP.cone) + 3, u(APP.barrelEnd) - 3, -vs * APP.rB * 0.8 - 0.22, -vs * APP.rB * 0.8 + 0.22)} fill="#FFFFFF" opacity={0.4} />
        {/* faint graduation ticks (no numbers) */}
        {Array.from({length: Math.floor((APP.barrelEnd - APP.cone - 8) / 5)}).map((_, i) => {
          const uu = u(APP.cone) + 5 + i * 5;
          const L = i % 3 === 0 ? 2.6 : 1.5;
          // short ticks from the wall on the shadow side, inward
          return <path key={i} d={rect(uu - 0.14, uu + 0.14, -vs * (APP.rB - 0.4), -vs * (APP.rB - 0.4 - L))} fill={C.steelDeep} opacity={0.35} />;
        })}
        <Line d={barrelD} />
        {/* finger flange */}
        <path d={flangeD} fill={`url(#${id_('fl')})`} />
        <path d={rect(u(APP.barrelEnd) + 0.4, u(APP.flangeEnd) - 0.5, vs > 0 ? 1 : -APP.flangeW + 1.3, vs > 0 ? APP.flangeW - 1.3 : -1)} fill="#FFFFFF" opacity={0.75} />
        {/* hub: clear plastic with the gel channel inside, Luer lugs at the back */}
        <path d={hubD} fill={`url(#${id_('hb')})`} />
        <path d={profile([[u(APP.ferrule) + 0.2, 0.55], [u(APP.hub), 0.8]])} fill={C.glue} opacity={0.85} />
        <path d={rect(u(APP.ferrule) + 0.8, u(APP.hub) - 2, vs * 1.55 - 0.22, vs * 1.55 + 0.22)} fill="#FFFFFF" opacity={0.9} />
        <path d={rect(u(APP.hub) - 1.6, u(APP.hub), -0.25, 0.25)} fill={mix(C.barrel, C.steelDeep, 0.4)} opacity={0.6} />
        {/* ferrule (crimped steel collar) */}
        <path d={ferruleD} fill={`url(#${id_('fe')})`} />
        <path d={rect(u(APP.cannula) + 0.9, u(APP.cannula) + 1.15, -1.1, 1.1)} fill={C.steelDeep} opacity={0.6} />
      </g>
      {/* the cannula: one smooth steel tube from the ferrule round the slight bend to the blunt tip */}
      <Under d={can.outline} />
      <g transform={tipT}>
        <ellipse cx={f(-APP.tipSeg)} cy="0" rx={f(r * 0.42)} ry={f(r)} fill={INK} stroke={INK} strokeWidth={INST_INK} vectorEffect={NS} />
      </g>
      <SteelBar b={can} />
      <path d={can.rim} fill={C.steelLit} opacity={0.5} />
      {/* the blunt end: a bright rim round the bore (the end face looks up toward the light) */}
      <g transform={tipT}>
        <ellipse cx={f(-APP.tipSeg)} cy="0" rx={f(r * 0.42)} ry={f(r * 0.99)} fill={mix(C.steel, C.steelLit, 0.55)} />
        <ellipse cx={f(-APP.tipSeg)} cy="0" rx={f(r * 0.42)} ry={f(r * 0.99)} fill="none" stroke={INK} strokeWidth={INST_INK * 0.35} vectorEffect={NS} opacity={0.6} />
        <ellipse cx={f(-APP.tipSeg - 0.02)} cy={f(-vt * r * 0.04)} rx={f(r * 0.24)} ry={f(r * 0.58)} fill={gel > 0.02 ? C.glueDeep : '#1A2630'} />
        {gel > 0.02 && <ellipse cx={f(-APP.tipSeg - 0.04)} cy={f(-vt * r * 0.04)} rx={f(r * 0.16)} ry={f(r * 0.44)} fill={C.glue} />}
      </g>
      {gel > 0.02 && (
        // a small droplet of gel swelling out of the bore: an oval along the tip's direction, a neck into the bore
        <g transform={`translate(${Pf(add(st.tip, mul(dTip, -bulbR * 0.72)))}) rotate(${f(angT)})`}>
          <path d={dropD} fill={C.glueInk} stroke={C.glueInk} strokeWidth={INST_INK * 0.8} vectorEffect={NS} strokeLinejoin="round" />
          <path d={dropD} fill={`url(#${id_('bu')})`} />
          <path d={dropD} fill="none" stroke={C.glueLit} strokeWidth={f(bulbR * 0.12)} opacity={0.5} transform={`translate(${f(-Lt.x * bulbR * 0.08)} ${f(-Lt.y * bulbR * 0.08)})`} />
          <ellipse cx={f(Lt.x * bulbR * 0.38)} cy={f(Lt.y * bulbR * 0.42)} rx={f(bulbR * 0.34)} ry={f(bulbR * 0.13)} transform={`rotate(${f(deg(Math.atan2(Lt.y, Lt.x)) + 90)} ${f(Lt.x * bulbR * 0.38)} ${f(Lt.y * bulbR * 0.42)})`} fill="#FFFFFF" opacity={0.9} />
        </g>
      )}
    </g>
  );
};

/** a curved tapered bar from a centreline with half widths: outline and the lit / shadow bands (a steel rod's form) */
const bar = (c: P[], hw: number[], L: P, pointed = false) => {
  const n = c.length;
  const T = c.map((_, i) => nrm(sub(c[Math.min(n - 1, i + 1)], c[Math.max(0, i - 1)])));
  const N = T.map(perp);
  const side = (k: number, s: number) => c.map((p, i) => add(p, mul(N[i], hw[i] * k * s)));
  const lt = N.map((nn) => (nn.x * L.x + nn.y * L.y >= 0 ? 1 : -1));
  const band = (k0: number, k1: number, lightSide: boolean) => {
    const a = c.map((p, i) => add(p, mul(N[i], hw[i] * k0 * (lightSide ? lt[i] : -lt[i]))));
    const b = c.map((p, i) => add(p, mul(N[i], hw[i] * k1 * (lightSide ? lt[i] : -lt[i]))));
    return `${open(a, 0.9)}L${open([...b].reverse(), 0.9).slice(1)}Z`;
  };
  const left = side(1, 1);
  const right = side(1, -1);
  const tipCap = pointed ? '' : `L${Pf(add(c[n - 1], mul(T[n - 1], hw[n - 1] * 0.6)))}`;
  const outline = `${open(left, 0.9)}${tipCap}L${open([...right].reverse(), 0.9).slice(1)}Z`;
  return {outline, lit: band(0.18, 0.62, true), spec: band(0.3, 0.48, true), dark: band(0.25, 1.0, false), core: band(-0.05, 0.25, false)};
};

const SteelBar: React.FC<{b: ReturnType<typeof bar>}> = ({b}) => (
  <g>
    <path d={b.outline} fill={C.steel} />
    <path d={b.dark} fill={C.steelDeep} opacity={0.75} />
    <path d={b.core} fill={mix(C.steel, C.steelDeep, 0.4)} opacity={0.5} />
    <path d={b.lit} fill={C.steelLit} opacity={0.75} />
    <path d={b.spec} fill="#FFFFFF" opacity={0.95} />
  </g>
);


/** a band between two fractions of a solid of revolution's radius on one side (lit side = +1 * vs): [[u, r], ...] */
const bandD = (pr: [number, number][], k0: number, k1: number, side: number) => {
  const a = pr.map(([u, r]) => `${f(u)} ${f(side * k0 * r)}`);
  const b = [...pr].reverse().map(([u, r]) => `${f(u)} ${f(side * k1 * r)}`);
  return `M${a.join('L')}L${b.join('L')}Z`;
};
/** the light direction in an axis frame rotated by ang */
const lightIn = (ang: number) => pt(LIGHT.x * Math.cos(ang) + LIGHT.y * Math.sin(ang), -LIGHT.x * Math.sin(ang) + LIGHT.y * Math.cos(ang));

// ------------------------------------------------------------------------------------------------ probe
/** probe dimensions (mm along the instrument from the tip, s) */
export const PROBE = {
  taper: 9, // the point tapers to the full shaft over this length
  r: 1.1, // shaft radius (2.2 mm)
  shaftEnd: 54.6,
  ferrule: 61, // a turned cone from the shaft up to the collar
  collar: 63.8,
  h0: 63.6, // the handle (ribbed at its front, where the fingertips hold it)
  h1: 156.7,
  rH: 4.8,
  rib0: 66.4,
  rib1: 103,
  ribStep: 2.2,
  /** where the fingertips pinch it (the grip point; the lift grows about it) */
  pinch: 71,
};
const SHAFT_PR: [number, number][] = [
  [0, 0],
  [0.05, 0.12],
  [0.2, 0.2],
  [0.55, 0.3],
  [1.4, 0.45],
  [2.8, 0.63],
  [4.8, 0.84],
  [6.9, 1.0],
  [PROBE.taper, PROBE.r],
  [PROBE.shaftEnd, PROBE.r],
];
const FERRULE_PR: [number, number][] = [
  [PROBE.shaftEnd - 0.4, PROBE.r],
  [55.4, 1.32],
  [59.8, 2.42],
  [PROBE.ferrule + 0.1, 2.6],
];
const HANDLE_PR: [number, number][] = [
  [PROBE.h0, 3.7],
  [64.1, 4.45],
  [64.8, PROBE.rH],
  [104, PROBE.rH],
  [106.2, 4.6],
  [150, 4.42],
  [153.6, 4.26],
  [155.3, 3.85],
  [156.2, 2.95],
  [156.6, 1.7],
  [PROBE.h1, 0],
];
/** the probe's radius at s (for the contact shadow) */
const probeR = (s: number) => {
  for (let i = 0; i < SHAFT_PR.length - 1; i++) {
    const [u0, r0] = SHAFT_PR[i], [u1, r1] = SHAFT_PR[i + 1];
    if (s <= u1) return r0 + ((r1 - r0) * clamp((s - u0) / (u1 - u0 || 1)));
  }
  return PROBE.r;
};

/** the probe's axis: a point at arc length s from the tip (unlifted) and the unit axis toward the handle */
export const probeAxis = (st: ProbeState) => {
  const ax = dir(st.ang);
  return {ax, at: (s: number): P => add(st.tip, mul(ax, s))};
};
export const probeLift = (st: ProbeState): LiftXf => {
  const pa = probeAxis(st);
  return liftXf(pa.at(PROBE.pinch), pa.ax, PROBE.pinch, st.lift);
};
/** Where the surgeon's left hand holds the probe (a precision grip): p = the pinch point on the axis (the index pad
 *  rests on top of the handle there, the thumb and middle fingertips press its sides), ang = the direction from the
 *  handle toward the tip (rad), ax = the unit axis from the tip toward the handle, s = the pinch's arc length, k = the
 *  lift's growth. Lifted with the instrument. */
export const probeGrip = (st: ProbeState): {p: P; ang: number; ax: P; s: number; k: number} => {
  const pa = probeAxis(st);
  const lx = probeLift(st);
  return {p: lx.map(pa.at(PROBE.pinch)), ang: st.ang + Math.PI, ax: pa.ax, s: PROBE.pinch, k: lx.k};
};

export const Probe: React.FC<{id: string; s: ProbeState}> = ({id, s: st}) => {
  const lx = probeLift(st);
  const Lf = lightIn(st.ang);
  const vs = Lf.y >= 0 ? 1 : -1; // the lit edge's side in the axis frame
  const id_ = (k: string) => `${id}-${k}`;
  const shaftD = profile(SHAFT_PR);
  const ferD = profile(FERRULE_PR);
  const colD = rrect(PROBE.ferrule, PROBE.collar, -3.3, 3.3, 0.7);
  const hanD = profile(HANDLE_PR);
  const ribs: number[] = [];
  for (let u = PROBE.rib0; u <= PROBE.rib1; u += PROBE.ribStep) ribs.push(u);
  const R = PROBE.rH;
  return (
    <g transform={lx.svg}>
      <g transform={`translate(${Pf(st.tip)}) rotate(${f(deg(st.ang))})`}>
        <defs>
          <CylGrad id={id_('sh')} r={PROBE.r} vs={vs} stops={STEEL_STOPS} />
          <CylGrad id={id_('fe')} r={2.6} vs={vs} stops={STEEL_STOPS} />
          <CylGrad id={id_('co')} r={3.3} vs={vs} stops={STEEL_STOPS} />
          <CylGrad id={id_('ha')} r={R} vs={vs} stops={STEEL_STOPS.map(([o, c]) => [o, mix(c, C.steelDeep, 0.08)] as [number, string])} />
          <clipPath id={id_('hc')}>
            <path d={hanD} />
          </clipPath>
        </defs>
        {/* one ink silhouette round the whole instrument */}
        <Under d={hanD} />
        <Under d={colD} />
        <Under d={ferD} />
        <Under d={shaftD} />
        {/* handle: satin steel, ribbed at the front where the fingertips hold it */}
        <path d={hanD} fill={`url(#${id_('ha')})`} />
        <path d={bandD(HANDLE_PR, 0.34, 0.6, vs)} fill="#FFFFFF" opacity={0.75} />
        <g clipPath={`url(#${id_('hc')})`}>
          {ribs.map((u, i) => (
            <g key={i}>
              <path d={rect(u - 0.38, u + 0.38, -R, R)} fill={shade(C.steelDeep, 0.15)} opacity={0.62} />
              <path d={rect(u + 0.38, u + 0.78, -R, R)} fill="#FFFFFF" opacity={0.32} />
            </g>
          ))}
          {/* a soft reflected rim on the shadow side, and the smooth body's long gloss */}
          <path d={bandD(HANDLE_PR, 0.74, 0.88, -vs)} fill={C.steelLit} opacity={0.32} />
          <path d={rect(PROBE.rib1 + 4, 150, vs * R * 0.42, vs * R * 0.56)} fill="#FFFFFF" opacity={0.9} />
        </g>
        <Line d={`M${f(PROBE.h0 + 0.5)} ${f(-3.9)}L${f(PROBE.h0 + 0.5)} ${f(3.9)}`} w={INST_INK * 0.3} opacity={0.55} />
        {/* collar and ferrule */}
        <path d={colD} fill={`url(#${id_('co')})`} />
        <path d={rect(PROBE.ferrule + 0.5, PROBE.collar - 0.6, vs * 1.0, vs * 2.2)} fill="#FFFFFF" opacity={0.8} />
        <path d={ferD} fill={`url(#${id_('fe')})`} />
        <path d={bandD(FERRULE_PR, 0.3, 0.55, vs)} fill="#FFFFFF" opacity={0.85} />
        <Line d={`M${f(PROBE.ferrule)} ${f(-2.6)}L${f(PROBE.ferrule)} ${f(2.6)}`} w={INST_INK * 0.3} opacity={0.5} />
        {/* the shaft and its point: cel bands that follow the taper */}
        <path d={shaftD} fill={C.steel} />
        <path d={bandD(SHAFT_PR, 0.25, 1.0, -vs)} fill={C.steelDeep} opacity={0.78} />
        <path d={bandD(SHAFT_PR, -0.05, 0.25, -vs)} fill={mix(C.steel, C.steelDeep, 0.4)} opacity={0.5} />
        <path d={bandD(SHAFT_PR, 0.72, 0.88, -vs)} fill={C.steelLit} opacity={0.45} />
        <path d={bandD(SHAFT_PR, 0.16, 0.64, vs)} fill={C.steelLit} opacity={0.8} />
        <path d={bandD(SHAFT_PR, 0.3, 0.5, vs)} fill="#FFFFFF" opacity={0.95} />
        {/* the point's polished facet catches the light: a short bright glint just behind the tip */}
        <ellipse cx={f(1.5)} cy={f(vs * 0.18)} rx={f(0.75)} ry={f(0.11)} fill="#FFFFFF" opacity={0.9} />
      </g>
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ contact shadows
/** shadow offset (mm) per mm of height above the bone (the key light's elevation), and the direction it falls: away
 *  from the upper-left key light, turned a little more toward screen-down (a stylised key a touch higher than LIGHT) so
 *  an instrument that points up-left into the light still shows its shadow beside it rather than hidden beneath it */
const SH_K = 0.8;
const AWAY: P = nrm(add(mul(LIGHT, -1), pt(-0.22, 0.2)));
const SHADOW_COL = '#2B170D';
/** the soft cast shadow of an instrument's tip region on the bone (depth-0 world mm). axis(s) = the instrument's
 *  centreline over the bone at arc length s from the tip (lifted), r(s) its radius; h0 = the tip's height above the
 *  bone, slope = the shaft's rise per mm. At h0 = 0 the shadow meets the tip (contact) with a tight dark contact spot;
 *  as the tip rises it slides off toward the lower right, widens, softens and fades. */
const CastShadow: React.FC<{axis: (s: number) => P; r: (s: number) => number; s1: number; h0: number; slope: number; px: number; alpha: number}> = ({axis, r, s1, h0, slope, px, alpha}) => {
  const id = uid('csh');
  const N = 18;
  const c: P[] = [];
  const w: number[] = [];
  for (let i = 0; i <= N; i++) {
    const s = s1 * Math.pow(i / N, 1.4);
    const h = h0 + slope * s;
    c.push(add(axis(s), mul(AWAY, h * SH_K)));
    w.push(Math.max(r(s) * 1.05 + 0.07 * h, 2.2 * px));
  }
  const T = c.map((_, i) => nrm(sub(c[Math.min(N, i + 1)], c[Math.max(0, i - 1)])));
  const Nn = T.map(perp);
  const left = c.map((p, i) => add(p, mul(Nn[i], w[i])));
  const right = c.map((p, i) => add(p, mul(Nn[i], -w[i])));
  // a round cap at the tip end
  const cap: P[] = [];
  for (let k = 1; k < 6; k++) {
    const a = (k / 6) * Math.PI;
    cap.push(add(c[0], add(mul(Nn[0], -Math.cos(a) * w[0]), mul(T[0], -Math.sin(a) * w[0]))));
  }
  const d = `M${[...right].reverse().map(Pf).join('L')}L${cap.map(Pf).join('L')}L${left.map(Pf).join('L')}Z`;
  const blur = Math.max(1.6 * px, 0.03 + 0.09 * h0);
  const xs = [...left, ...right].map((p) => p.x), ys = [...left, ...right].map((p) => p.y);
  const m = blur * 3.2 + 0.2;
  const box = {x: Math.min(...xs) - m, y: Math.min(...ys) - m, w: Math.max(...xs) - Math.min(...xs) + 2 * m, h: Math.max(...ys) - Math.min(...ys) + 2 * m};
  const contact = clamp(1 - h0 / 0.7);
  const cb = Math.max(1.2 * px, 0.04);
  const cr = Math.max(r(0) + 0.3, 5.5 * px);
  // the contact spot sits under the tip and the shaft just behind it (never ahead of the tip, toward the light)
  const cc = add(add(axis(0), mul(T[0], cr * 0.95)), mul(AWAY, cr * 0.25));
  const a0 = deg(Math.atan2(T[0].y, T[0].x));
  return (
    <g>
      <defs>
        <filter id={`${id}-f`} filterUnits="userSpaceOnUse" x={f(box.x)} y={f(box.y)} width={f(box.w)} height={f(box.h)}>
          <feGaussianBlur stdDeviation={f(blur)} />
        </filter>
        <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1={f(c[0].x)} y1={f(c[0].y)} x2={f(c[N].x)} y2={f(c[N].y)}>
          <stop offset="0" stopColor={SHADOW_COL} stopOpacity={alpha} />
          <stop offset="0.45" stopColor={SHADOW_COL} stopOpacity={alpha * 0.85} />
          <stop offset="0.8" stopColor={SHADOW_COL} stopOpacity={alpha * 0.3} />
          <stop offset="1" stopColor={SHADOW_COL} stopOpacity={0} />
        </linearGradient>
        {contact > 0 && (
          <filter id={`${id}-cf`} filterUnits="userSpaceOnUse" x={f(cc.x - cr * 2 - cb * 4)} y={f(cc.y - cr * 2 - cb * 4)} width={f(cr * 4 + cb * 8)} height={f(cr * 4 + cb * 8)}>
            <feGaussianBlur stdDeviation={f(cb)} />
          </filter>
        )}
      </defs>
      <path d={d} fill={`url(#${id}-g)`} filter={`url(#${id}-f)`} />
      {contact > 0 && (
        <ellipse cx={f(cc.x)} cy={f(cc.y)} rx={f(cr * 1.25)} ry={f(cr * 0.8)} transform={`rotate(${f(a0)} ${f(cc.x)} ${f(cc.y)})`} fill={SHADOW_COL} opacity={0.75 * contact} filter={`url(#${id}-cf)`} />
      )}
    </g>
  );
};

/** The probe's contact shadow on the bone. Scene: the BONE layer (depth 0), with the probe state in depth-0 world mm
 *  (NOT reprojected); px = world mm per screen pixel at depth 0. */
export const ProbeShadow: React.FC<{st: ProbeState; px: number}> = ({st, px}) => {
  const pa = probeAxis(st);
  const lx = probeLift(st);
  return <CastShadow axis={(s) => lx.map(pa.at(s))} r={(s) => probeR(s) * lx.k} s1={20} h0={LIFT.h * lx.l} slope={0.75} px={px} alpha={0.46 * (1 - 0.3 * lx.l)} />;
};

/** The applicator cannula's contact shadow on the bone (as ProbeShadow). */
export const AppShadow: React.FC<{st: AppState2; px: number}> = ({st, px}) => {
  const ax = appAxis(st);
  const lx = appLift(st);
  return <CastShadow axis={(s) => lx.map(ax.at(s))} r={() => APP.r * lx.k} s1={16} h0={LIFT.h * lx.l} slope={0.34} px={px} alpha={0.42 * (1 - 0.3 * lx.l)} />;
};
