// The surgeon's two instruments, drawn in wrist-plane millimetres (the world of anatomy.ts: x right, y down, origin at
// the fracture centre).
//
//   Applicator: a slim syringe-type applicator for the teal adhesive (NOT a consumer glue tube): blunt steel cannula
//     (38 mm, 1.3 mm diameter, a slight bend 6 mm from the tip), clear barrel (11 x 62 mm) showing the gel whose level
//     drops with the plunger travel, finger flange, white plunger rod and thumb pad, dark rubber stopper.
//   Clamp: a pointed reduction clamp (Weber type): two curved jaws bowing out to the right of the bone and ending in
//     small points, a box joint 35 mm from the tips, two handles with finger rings and a ratchet, angled down-right
//     toward the surgeon's near hand.
//
// Weird Crew finish: navy ink contours (constant on-screen width: non-scaling strokes, so the same art is crisp from
// the extreme close-up of the cannula tip to the wide clinical shot), cel gradients lit from the upper left (LIGHT),
// small white glosses. No text, numbers or glyphs. Deterministic.
import React from 'react';
import {P, pt, add, sub, mul, nrm, perp, dir, len, lerpP, open} from '../core/geo';
import {mix, lit, shade, rgba} from '../core/color';
import {C, INK} from './palette';
import {clamp} from '../lib';

// ------------------------------------------------------------------------------------------------ shared drawing bits
/** direction TOWARD the key light (upper left), as dc/shade LIGHT */
const LIGHT: P = nrm(pt(-0.62, -0.78));
const f = (n: number) => (Math.abs(n) < 1e-6 ? '0' : n.toFixed(3));
const Pf = (p: P) => `${f(p.x)} ${f(p.y)}`;
const deg = (r: number) => (r * 180) / Math.PI;
/** contour width in screen pixels (non-scaling strokes): a 1.5-1.7 px line shows outside each silhouette */
export const INST_INK = 3.3;
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
export type AppState = {tip: P; ang: number; press: number; gel: number};

/** applicator dimensions (mm along the instrument from the cannula tip, s) */
export const APP = {
  tipSeg: 6, // the bent tip segment
  bend: -0.3, // the tip segment's turn from the main axis (rad): it hooks a little toward the wound
  cannula: 38,
  r: 0.65, // cannula radius
  ferrule: 40,
  hub: 47,
  cone: 51, // barrel front shoulder ends
  barrelEnd: 113,
  flangeEnd: 115.6,
  rB: 5.5, // barrel outer radius
  rIn: 4.65, // inner radius
  in0: 52, // inner usable length starts
  inLen: 56,
  stopT: 6,
  rod: 62, // rod length from the stopper's back face to the pad
  rodW: 3.5,
  padR: 8.4,
  padT: 2.6,
  flangeW: 11.6,
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

/** Where and how the surgeon's right hand holds the applicator: p = the grip point on the barrel just in front of the
 *  finger flange; ang = the hand axis (wrist -> fingers, radians, atan2 convention, y down). The fingers wrap the
 *  barrel from above, the forearm comes from the surgeon (screen right). */
export const APP_GRIP = {s: 97, turn: 0.62};
export const appGrip = (st: AppState): {p: P; ang: number} => {
  const ax = appAxis(st);
  return {p: ax.at(APP_GRIP.s), ang: st.ang + Math.PI + APP_GRIP.turn};
};

export const Applicator: React.FC<{id: string; s: AppState; shadow?: boolean}> = ({id, s: st, shadow = true}) => {
  const {Bp, dTip, at} = appAxis(st);
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
  const shaftD = rect(0, u(APP.cannula) + 0.4, -r, r);
  const tipD = `M${f(-APP.tipSeg + 0.02)} ${f(-r)}H0.2V${f(r)}H${f(-APP.tipSeg + 0.02)}A${f(r * 0.42)} ${f(r)} 0 0 1 ${f(-APP.tipSeg + 0.02)} ${f(-r)}Z`;
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
  const bulbR = 0.28 + 0.78 * gel;

  // the cannula's shadow on the wound: converges to the tip (contact), softens and fades as the shaft rises
  const shadowEl = (() => {
    if (!shadow) return null;
    const away = mul(LIGHT, -1);
    const pts: P[] = [];
    const N = 10;
    const ws: number[] = [];
    for (let i = 0; i <= N; i++) {
      const s = (APP.cannula + 4) * (i / N);
      pts.push(add(at(s), mul(away, 0.05 + s * 0.16)));
      ws.push(r * (1 + s * 0.03));
    }
    const left: P[] = [], right: P[] = [];
    for (let i = 0; i <= N; i++) {
      const t = nrm(sub(pts[Math.min(N, i + 1)], pts[Math.max(0, i - 1)]));
      const n = perp(t);
      left.push(add(pts[i], mul(n, ws[i])));
      right.push(add(pts[i], mul(n, -ws[i])));
    }
    const d = `M${left.map(Pf).join('L')}L${[...right].reverse().map(Pf).join('L')}Z`;
    const g0 = at(0), g1 = at(APP.cannula);
    return (
      <g>
        <defs>
          <filter id={id_('shf')} filterUnits="userSpaceOnUse" x="-2000" y="-2000" width="4000" height="4000">
            <feGaussianBlur stdDeviation={f(0.55)} />
          </filter>
          <linearGradient id={id_('shg')} gradientUnits="userSpaceOnUse" x1={f(g0.x)} y1={f(g0.y)} x2={f(g1.x)} y2={f(g1.y)}>
            <stop offset="0" stopColor="#0B1620" stopOpacity={0.42} />
            <stop offset="0.45" stopColor="#0B1620" stopOpacity={0.2} />
            <stop offset="1" stopColor="#0B1620" stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={d} fill={`url(#${id_('shg')})`} filter={`url(#${id_('shf')})`} />
      </g>
    );
  })();

  return (
    <g>
      {shadowEl}
      <defs>
        <CylGrad id={id_('cm')} r={r} vs={vs} stops={STEEL_STOPS} />
        <CylGrad id={id_('ct')} r={r} vs={vt} stops={STEEL_STOPS} />
        <CylGrad id={id_('fe')} r={1.12} vs={vs} stops={STEEL_STOPS} />
        <CylGrad id={id_('hb')} r={3.7} vs={vs} stops={[[0, '#FFFFFF'], [0.25, lit(C.barrel, 0.5)], [0.6, C.barrel], [0.9, mix(C.barrel, C.steelDeep, 0.45)], [1, mix(C.barrel, C.steelDeep, 0.25)]]} />
        <CylGrad id={id_('br')} r={APP.rB} vs={vs} stops={[[0, '#FFFFFF', 0.85], [0.18, lit(C.barrel, 0.6), 0.55], [0.5, C.barrel, 0.3], [0.85, mix(C.barrel, C.steelDeep, 0.35), 0.45], [1, mix(C.barrel, C.steelDeep, 0.6), 0.7]]} />
        <CylGrad id={id_('gl')} r={APP.rIn} vs={vs} stops={[[0, C.glueLit], [0.22, mix(C.glueLit, C.glue, 0.5)], [0.55, C.glue], [0.86, C.glueDeep], [1, shade(C.glueDeep, 0.2)]]} />
        <CylGrad id={id_('rd')} r={APP.rodW} vs={vs} stops={[[0, '#FFFFFF'], [0.35, C.plunger], [0.75, mix(C.plunger, '#AEBBC6', 0.6)], [1, mix(C.plunger, '#8C9AA6', 0.7)]]} />
        <CylGrad id={id_('pd')} r={APP.padR} vs={vs} stops={[[0, '#FFFFFF'], [0.3, C.plunger], [0.8, mix(C.plunger, '#A9B6C1', 0.7)], [1, mix(C.plunger, '#8C9AA6', 0.8)]]} />
        <CylGrad id={id_('st')} r={APP.rIn} vs={vs} stops={[[0, lit(C.stopper, 0.35)], [0.3, C.stopper], [1, shade(C.stopper, 0.45)]]} />
        <CylGrad id={id_('fl')} r={APP.flangeW} vs={vs} stops={[[0, '#FFFFFF', 0.95], [0.3, lit(C.barrel, 0.4), 0.9], [0.7, C.barrel, 0.85], [1, mix(C.barrel, C.steelDeep, 0.5), 0.9]]} />
        <radialGradient id={id_('bu')} gradientUnits="userSpaceOnUse" cx="0" cy="0" r={f(bulbR * 1.15)} fx={f(LIGHT.x * bulbR * 0.45)} fy={f(LIGHT.y * bulbR * 0.45)}>
          <stop offset="0" stopColor={C.glueShine} />
          <stop offset="0.3" stopColor={C.glueLit} />
          <stop offset="0.68" stopColor={C.glue} />
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
        <Under d={shaftD} />
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
        {Array.from({length: 9}).map((_, i) => {
          const uu = u(APP.cone) + 6 + i * 6;
          const L = i % 3 === 0 ? 2.6 : 1.5;
          return <path key={i} d={rect(uu - 0.14, uu + 0.14, -vs * APP.rB + 0.35, -vs * APP.rB + 0.35 + L * -vs * -1)} fill={C.steelDeep} opacity={0.35} />;
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
        {/* cannula shaft */}
        <path d={shaftD} fill={`url(#${id_('cm')})`} />
        <path d={rect(0.15, u(APP.cannula) - 0.6, vs * r * 0.5 - r * 0.08, vs * r * 0.5 + r * 0.08)} fill="#FFFFFF" />
        <path d={rect(1.2, u(APP.cannula) - 2, -vs * r * 0.74 - r * 0.05, -vs * r * 0.74 + r * 0.05)} fill={C.steelLit} opacity={0.45} />
      </g>
      {/* the bend: a round joint between the two straight runs */}
      <g transform={main}>
        <circle cx="0" cy="0" r={f(r)} fill={INK} stroke={INK} strokeWidth={INST_INK} vectorEffect={NS} />
      </g>
      <g transform={tipT}>
        <Under d={tipD} />
      </g>
      <g transform={main}>
        <circle cx="0" cy="0" r={f(r)} fill={`url(#${id_('cm')})`} />
        <path d={rect(0, 0.3, vs * r * 0.5 - r * 0.08, vs * r * 0.5 + r * 0.08)} fill="#FFFFFF" />
      </g>
      {/* the bent tip segment, its blunt rounded end with the bore, the gel bulb */}
      <g transform={tipT}>
        <path d={tipD} fill={`url(#${id_('ct')})`} />
        <path d={rect(-APP.tipSeg + 0.35, 0.1, vt * r * 0.5 - r * 0.08, vt * r * 0.5 + r * 0.08)} fill="#FFFFFF" />
        <circle cx="0" cy="0" r={f(r * 0.995)} fill={`url(#${id_('ct')})`} opacity={0.5} />
        {/* the end face: a bright rim round the bore (the face looks up toward the light) */}
        <ellipse cx={f(-APP.tipSeg + 0.02)} cy="0" rx={f(r * 0.4)} ry={f(r * 0.98)} fill={mix(C.steel, C.steelLit, 0.55)} />
        <ellipse cx={f(-APP.tipSeg + 0.02)} cy="0" rx={f(r * 0.4)} ry={f(r * 0.98)} fill="none" stroke={INK} strokeWidth={INST_INK * 0.4} vectorEffect={NS} opacity={0.75} />
        <ellipse cx={f(-APP.tipSeg)} cy={f(-vt * r * 0.04)} rx={f(r * 0.24)} ry={f(r * 0.58)} fill={gel > 0.02 ? C.glueDeep : '#1A2630'} />
        {gel > 0.02 && <ellipse cx={f(-APP.tipSeg - 0.02)} cy={f(-vt * r * 0.04)} rx={f(r * 0.17)} ry={f(r * 0.45)} fill={C.glue} />}
      </g>
      {gel > 0.02 && (
        <g transform={`translate(${Pf(add(st.tip, mul(dTip, -bulbR * 0.55)))})`}>
          <g transform={`rotate(${f(angT)})`}>
            <ellipse cx="0" cy="0" rx={f(bulbR * 1.12)} ry={f(bulbR)} fill={C.glueInk} stroke={C.glueInk} strokeWidth={INST_INK * 0.85} vectorEffect={NS} />
          </g>
          <g transform={`rotate(${f(angT)})`}>
            <ellipse cx="0" cy="0" rx={f(bulbR * 1.12)} ry={f(bulbR)} fill={C.glue} />
          </g>
          <circle cx="0" cy="0" r={f(bulbR * 1.05)} fill={`url(#${id_('bu')})`} opacity={0.92} />
          <ellipse cx={f(LIGHT.x * bulbR * 0.42)} cy={f(LIGHT.y * bulbR * 0.42)} rx={f(bulbR * 0.3)} ry={f(bulbR * 0.18)} transform={`rotate(-38 ${f(LIGHT.x * bulbR * 0.42)} ${f(LIGHT.y * bulbR * 0.42)})`} fill="#FFFFFF" opacity={0.95} />
          <circle cx={f(-LIGHT.x * bulbR * 0.55)} cy={f(-LIGHT.y * bulbR * 0.55)} r={f(bulbR * 0.1)} fill="#FFFFFF" opacity={0.5} />
        </g>
      )}
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ clamp
export type ClampState = {a: P; b: P; open: number; lift: number};

/** clamp dimensions (mm) */
export const CLAMP = {
  joint: 35, // tips -> box joint
  bendHandle: 0.52, // the handles' turn (rad) from the jaws' axis, so they run down-right to the near hand
  handle: 74, // joint -> ring centres along the handles
  ringR: 8.4,
  ringIn: 5.7,
  openMax: 0.24, // jaw rotation at open = 1 (rad)
  liftDist: 135,
};

/** the clamp's frame: tips' midpoint, unit axis toward the joint (away from the bone), unit a -> b, half spread */
const clampFrame = (st: ClampState) => {
  const ab = nrm(sub(st.b, st.a));
  const ax = pt(ab.y, -ab.x);
  const h = len(sub(st.b, st.a)) / 2;
  const hd = pt(Math.cos(CLAMP.bendHandle), Math.sin(CLAMP.bendHandle)); // handle direction in the frame
  const hdW = add(mul(ax, hd.x), mul(ab, hd.y)); // ... in the world
  const off = mul(hdW, CLAMP.liftDist * clamp(st.lift));
  const m = add(lerpP(st.a, st.b, 0.5), off);
  const W = (q: P): P => add(m, add(mul(ax, q.x), mul(ab, q.y)));
  return {ab, ax, h, hd, hdW, m, W};
};

/** Where and how the surgeon's left hand holds the clamp: p = the grip point between the handles (ahead of the rings);
 *  ang = the hand axis (wrist -> fingers, radians). The fingers wrap both handles; the jaws exit the thumb side. */
export const CLAMP_GRIP = {d: 50, turn: -0.95};
export const clampGrip = (st: ClampState): {p: P; ang: number} => {
  const F = clampFrame(st);
  const J = pt(CLAMP.joint, 0);
  const p = F.W(add(J, mul(F.hd, CLAMP_GRIP.d)));
  const back = Math.atan2(-F.hdW.y, -F.hdW.x); // along the handles toward the joint
  return {p, ang: back + CLAMP_GRIP.turn};
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

export const Clamp: React.FC<{id: string; s: ClampState; shadow?: boolean}> = ({id, s: st, shadow = true}) => {
  const F = clampFrame(st);
  const h = F.h;
  const th = CLAMP.openMax * clamp(st.open);
  const J = pt(CLAMP.joint, 0);
  // light in the clamp frame
  const Lc = pt(LIGHT.x * F.ax.x + LIGHT.y * F.ax.y, LIGHT.x * F.ab.x + LIGHT.y * F.ab.y);
  const rotAbout = (q: P, c: P, a: number) => {
    const d = sub(q, c);
    return add(c, pt(d.x * Math.cos(a) - d.y * Math.sin(a), d.x * Math.sin(a) + d.y * Math.cos(a)));
  };
  // jaw centrelines in the frame (u toward the joint, v along a -> b), for the closed clamp, from the joint to the tip
  const jaw = (sg: number): P[] => [
    pt(CLAMP.joint + 2, sg * 1.4),
    pt(CLAMP.joint - 5, sg * 4.6),
    pt(CLAMP.joint - 12, sg * (h + 5.2)),
    pt(15, sg * (h + 8.4)),
    pt(7.4, sg * (h + 8.2)),
    pt(2.6, sg * (h + 5.0)),
    pt(0.55, sg * (h + 2.0)),
    pt(0, sg * h),
  ];
  const jawW = [2.2, 2.1, 1.95, 1.75, 1.5, 1.15, 0.7, 0.05];
  // handles: from the joint along hd, each to its ring (piece 1 = jaw a (-v) + the handle on the +n side, crossed)
  const hn = perp(F.hd);
  const handle = (sg: number): P[] => {
    const at = (d: number, o: number) => add(J, add(mul(F.hd, d), mul(hn, o * sg)));
    return [at(-3, 0.6 * sg * 0), at(10, 2.2), at(30, 4.6), at(52, 6.8), at(CLAMP.handle - CLAMP.ringR + 0.6, 8.0)];
  };
  const ringC = (sg: number) => add(J, add(mul(F.hd, CLAMP.handle), mul(hn, 8.6 * sg)));
  const handleW = [2.3, 2.3, 2.1, 2.0, 1.9];
  // world mapping (with each piece's rotation for the opening)
  const piece = (sg: number) => {
    const a = th * (sg < 0 ? 1 : -1); // jaw a (sg -1) rotates +th
    const R = (q: P) => F.W(rotAbout(q, J, a));
    const jc = jaw(sg).map(R);
    const hc = handle(-sg).map(R);
    const rc = R(ringC(-sg));
    return {jc, hc, rc, a};
  };
  const p1 = piece(-1);
  const p2 = piece(1);
  const LW = LIGHT;
  const jawBar = (pc: typeof p1) => bar(pc.jc, jawW, LW, true);
  const handleBar = (pc: typeof p1) => bar(pc.hc, handleW, LW);
  const ringD = (c: P, R1: number, R0: number) =>
    `M${f(c.x + R1)} ${f(c.y)}A${f(R1)} ${f(R1)} 0 1 0 ${f(c.x - R1)} ${f(c.y)}A${f(R1)} ${f(R1)} 0 1 0 ${f(c.x + R1)} ${f(c.y)}Z M${f(c.x + R0)} ${f(c.y)}A${f(R0)} ${f(R0)} 0 1 1 ${f(c.x - R0)} ${f(c.y)}A${f(R0)} ${f(R0)} 0 1 1 ${f(c.x + R0)} ${f(c.y)}Z`;
  // ratchet: a toothed bar on each handle reaching across to the other one, ahead of the rings
  const ratchet = (pc: typeof p1, sg: number) => {
    const base = (d: number, o: number) => {
      const q = add(J, add(mul(F.hd, d), mul(hn, o * sg)));
      return F.W(rotAbout(q, J, pc.a));
    };
    const d0 = 55;
    const outline = [base(d0, 6.4), base(d0, -3.0), base(d0 + 2.4, -3.0), base(d0 + 2.4, 6.4)];
    const teeth: P[] = [];
    for (let i = 0; i <= 5; i++) teeth.push(base(d0 + (sg > 0 ? 2.4 : 0) + (sg > 0 ? 0.55 : -0.55), 5.6 - i * 1.6), base(d0 + (sg > 0 ? 2.4 : 0), 5.0 - i * 1.6));
    return {d: `M${outline.map(Pf).join('L')}Z`, teeth: `M${teeth.map(Pf).join('L')}`};
  };
  const r1 = ratchet(p1, -1);
  const r2 = ratchet(p2, 1);
  const Jw = F.W(J);
  const boxAng = deg(Math.atan2(F.ax.y, F.ax.x));
  const pieceEl = (pc: typeof p1, k: string, rt: ReturnType<typeof ratchet>) => {
    const jb = jawBar(pc);
    const hb = handleBar(pc);
    return (
      <g key={k}>
        <Under d={jb.outline} />
        <Under d={hb.outline} />
        <Under d={rt.d} />
        <Under d={ringD(pc.rc, CLAMP.ringR, CLAMP.ringIn)} fillRule="evenodd" />
        <SteelBar b={jb} />
        <SteelBar b={hb} />
        <path d={rt.d} fill={C.steel} />
        <path d={rt.teeth} fill="none" stroke={C.steelDeep} strokeWidth={INST_INK * 0.35} vectorEffect={NS} />
        <path d={ringD(pc.rc, CLAMP.ringR, CLAMP.ringIn)} fill={`url(#${id}-rg)`} fillRule="evenodd" />
        {/* ring gloss: a crisp arc on the lit upper-left and a soft one on the inner lower-right */}
        <path d={`M${Pf(add(pc.rc, mul(dir(-2.75), CLAMP.ringR * 0.83)))}A${f(CLAMP.ringR * 0.83)} ${f(CLAMP.ringR * 0.83)} 0 0 1 ${Pf(add(pc.rc, mul(dir(-1.35), CLAMP.ringR * 0.83)))}`} fill="none" stroke="#FFFFFF" strokeWidth={f(0.75)} strokeLinecap="round" />
        <path d={`M${Pf(add(pc.rc, mul(dir(0.15), CLAMP.ringIn * 1.12)))}A${f(CLAMP.ringIn * 1.12)} ${f(CLAMP.ringIn * 1.12)} 0 0 1 ${Pf(add(pc.rc, mul(dir(1.5), CLAMP.ringIn * 1.12)))}`} fill="none" stroke={C.steelLit} strokeWidth={f(0.6)} strokeLinecap="round" opacity={0.8} />
      </g>
    );
  };
  // contact shadows: the jaws lie close over the bone, the points press into it
  const shadowEl = shadow ? (
    <g>
      <defs>
        <filter id={`${id}-sf`} filterUnits="userSpaceOnUse" x="-2000" y="-2000" width="4000" height="4000">
          <feGaussianBlur stdDeviation="0.9" />
        </filter>
      </defs>
      <g filter={`url(#${id}-sf)`} opacity={0.38 * (1 - clamp(st.lift * 2.5))}>
        {[p1, p2].map((pc, i) => (
          <path key={i} d={open(pc.jc.map((q, j) => add(q, mul(LIGHT, -(0.6 + (pc.jc.length - 1 - j) * 0.25)))), 0.9)} fill="none" stroke="#0B1620" strokeWidth={f(3.2)} strokeLinecap="round" />
        ))}
      </g>
      {[p1, p2].map((pc, i) => {
        const tp = pc.jc[pc.jc.length - 1];
        return <ellipse key={`t${i}`} cx={f(tp.x + 0.25)} cy={f(tp.y + 0.3)} rx={f(0.95)} ry={f(0.8)} fill="#0B1620" opacity={0.3 * (1 - clamp(st.lift * 4))} />;
      })}
    </g>
  ) : null;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-rg`} gradientUnits="objectBoundingBox" x1="0.15" y1="0.1" x2="0.85" y2="0.9">
          <stop offset="0" stopColor={C.steelLit} />
          <stop offset="0.35" stopColor={C.steel} />
          <stop offset="0.75" stopColor={C.steelDeep} />
          <stop offset="1" stopColor={mix(C.steelDeep, C.steel, 0.5)} />
        </linearGradient>
        <linearGradient id={`${id}-bx`} gradientUnits="userSpaceOnUse" x1={f(Jw.x + LIGHT.x * 5)} y1={f(Jw.y + LIGHT.y * 5)} x2={f(Jw.x - LIGHT.x * 5)} y2={f(Jw.y - LIGHT.y * 5)}>
          <stop offset="0" stopColor={C.steelLit} />
          <stop offset="0.4" stopColor={C.steel} />
          <stop offset="1" stopColor={C.steelDeep} />
        </linearGradient>
      </defs>
      {shadowEl}
      {pieceEl(p2, 'p2', r2)}
      {pieceEl(p1, 'p1', r1)}
      {/* the box joint over both pieces, with its pivot pin */}
      <g transform={`translate(${Pf(Jw)}) rotate(${f(boxAng + deg(th * 0))})`}>
        <path d={rrect(-4.6, 4.6, -3.9, 3.9, 1.6)} fill={INK} stroke={INK} strokeWidth={INST_INK} vectorEffect={NS} />
      </g>
      <g transform={`translate(${Pf(Jw)}) rotate(${f(boxAng)})`}>
        <path d={rrect(-4.6, 4.6, -3.9, 3.9, 1.6)} fill={`url(#${id}-bx)`} transform={`rotate(${f(-boxAng)}) rotate(${f(boxAng)})`} />
        <path d={rrect(-3.6, 3.6, -3.9 + 0.8 * Math.sign(Lc.y || 1) * -1 * 0, -2.9, 0.8)} fill={C.steelLit} opacity={0.6} />
        <circle cx="0" cy="0" r="1.75" fill={C.steelDeep} />
        <circle cx="0" cy="0" r="1.75" fill="none" stroke={INK} strokeWidth={INST_INK * 0.45} vectorEffect={NS} />
        <circle cx="-0.15" cy="-0.15" r="1.2" fill={C.steel} />
        <circle cx={f(LIGHT.x * 0.55)} cy={f(LIGHT.y * 0.55)} r="0.45" fill="#FFFFFF" opacity={0.9} />
      </g>
    </g>
  );
};

/** soft rgba helper re-export for scenes that tint instrument shadows */
export const instShadow = (a: number) => rgba('#0B1620', a);
