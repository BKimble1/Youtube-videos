// V4 heart: an original, simplified anterior view drawn in the torso's own frame (x = his left (+V), y = down the
// spine (-U), rig units), so it turns and breathes with him. Chamber cues without labels: the right atrium is a
// rounded lobe on his right (-x) side where the superior vena cava enters from above; a small left-atrial ear
// peeks out at the upper left border; the anterior interventricular groove separates the broad right-ventricle
// face from the narrow left-ventricle strip that runs down to the apex (down and toward his left). The aorta
// rises behind the pulmonary trunk and arches toward his left (+x); the pulmonary trunk leaves the top of the
// right ventricle in front of it and runs up and to his left. Beats come from lib/heart4.ts: the ventricles
// SHRINK on systole about a pivot a third of the way from base to apex (the apex rises), the atria squeeze
// just before. One soft specular (<= 0.3), at most three small state-coloured sensors (never white).
import React from 'react';
import {mix, shade} from '../lib/color';
import {HeartState} from '../lib/heart4';
import {INK} from '../lib/ink';
import {add, clamp, fmt, mul, rot, V} from '../lib/math';

/** The whole heart (chambers and great vessels) is turned by this angle (deg, SVG sense) about its centre in the
 *  window frame: the long axis then runs about 11 deg from down-the-spine toward +V (apex down, toward his left),
 *  which keeps the apex clear of the near arm with the larger heart. Applied in the drawing, the sensors, the SVC
 *  path and the outline alike. */
export const HEART_TILT = 10;
/** heart-local -> window-frame offset (unscaled) */
const tilt = (p: V): V => rot(p, HEART_TILT);

// ---------------------------------------------------------------- geometry (local units, heart centre at 0,0)
const VENT: V[] = [
  {x: -11.5, y: -14.5},
  {x: -6, y: -19.5},
  {x: 3, y: -21},
  {x: 11, y: -18.5},
  {x: 18, y: -10},
  {x: 21, y: 2},
  {x: 17.5, y: 14.5},
  {x: 14, y: 24},
  {x: 5, y: 23},
  {x: -7, y: 18},
  {x: -13.3, y: 9.5},
  {x: -14.8, y: -2.5},
];
const BASE: V = {x: -2, y: -18};
const APEX: V = {x: 14, y: 24};
const AX = (() => {
  const d = {x: APEX.x - BASE.x, y: APEX.y - BASE.y};
  const l = Math.hypot(d.x, d.y);
  return {x: d.x / l, y: d.y / l};
})();
const NX: V = {x: AX.y, y: -AX.x}; // toward the left-ventricle side
/** contraction pivot: 35% of the way from the base to the apex */
const PIV: V = add(BASE, mul({x: APEX.x - BASE.x, y: APEX.y - BASE.y}, 0.35));
const GROOVE: V[] = [
  {x: 5, y: -20},
  {x: 7.5, y: -5},
  {x: 8.5, y: 9},
  {x: 8, y: 21.5},
];
/** right atrium: a compact lobe on the right border (the right lung's front margin covers its outer part in the window) */
const RA = {c: {x: -13.6, y: -6.4}, rx: 7.6, ry: 10.6, rot: -10};
const LAA = {c: {x: 16, y: -17}, rx: 5.5, ry: 3.2, rot: -28};
/** sensors on the ventricle surface: left ventricle (where the trace ends), right ventricle, near the apex */
export const HEART_SENSORS: V[] = [
  {x: 15, y: 4},
  {x: -7, y: 1},
  {x: 9.5, y: 15},
];
/** the treatment pulse's path: the visible part of the vena cava, from the window's top edge into the atrium */
const SVC_PULSE: V[] = [
  {x: -15.3, y: -33},
  {x: -14.9, y: -24},
  {x: -14.5, y: -15},
];
/** superior vena cava centreline (from above the window down into the right atrium) */
export const SVC: V[] = [
  {x: -15.5, y: -60},
  {x: -15.5, y: -40},
  {x: -15, y: -28},
  {x: -14.5, y: -16},
];
// the arch is kept a little low so that, at the window's heart scale, it clears the window's top edge
const AORTA: V[] = [
  {x: -1, y: -14},
  {x: -4, y: -23},
  {x: -2, y: -29},
  {x: 4, y: -32.5},
  {x: 12, y: -31.5},
  {x: 19, y: -26.5},
  {x: 22, y: -21},
];
const PTRUNK: V[] = [
  {x: 3, y: -19},
  {x: 5, y: -24},
  {x: 10, y: -27.5},
];
const LPA: V[] = [
  {x: 10, y: -27.5},
  {x: 16, y: -28.5},
  {x: 25, y: -26.5},
];

// ---------------------------------------------------------------- deformation (pure functions of the state)
const vent = (st: HeartState, p: V): V => {
  const r = {x: p.x - PIV.x, y: p.y - PIV.y};
  const along = r.x * AX.x + r.y * AX.y;
  const across = r.x * NX.x + r.y * NX.y;
  // which side of the interventricular groove (0 = right ventricle, 1 = left ventricle)
  const t = clamp((across - 1) / 8);
  const wL = t * t * (3 - 2 * t);
  const k = 1 - (st.lv + st.nLV) * wL - (st.rv + st.nRV) * (1 - wL);
  const q = add(mul(AX, along * st.ventL * k), mul(NX, across * st.ventW * k));
  return add(PIV, rot(q, st.wring));
};
const atrium = (st: HeartState, p: V, c: V, n: number): V => add(c, mul({x: p.x - c.x, y: p.y - c.y}, st.atria * (1 + n)));

const ellPts = (c: V, rx: number, ry: number, deg: number, n = 18): V[] =>
  Array.from({length: n}).map((_, i) => {
    const a = (i / n) * Math.PI * 2;
    return add(c, rot({x: Math.cos(a) * rx, y: Math.sin(a) * ry}, deg));
  });

const P = (p: V) => `${fmt(p.x)},${fmt(p.y)}`;
/** closed Catmull-Rom spline through the points (the rig's smoothClosed) */
export const closedD = (pts: V[]) => {
  let d = `M${P(pts[0])}`;
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[(i - 1 + pts.length) % pts.length];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % pts.length];
    const p3 = pts[(i + 2) % pts.length];
    d += ` C${P({x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6})} ${P({x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6})} ${P(p2)}`;
  }
  return d + ' Z';
};
/** open Catmull-Rom spline */
export const openD = (pts: V[]) => {
  let d = `M${P(pts[0])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C${P({x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6})} ${P({x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6})} ${P(p2)}`;
  }
  return d;
};
/** point at fraction t along a polyline */
export const alongPts = (pts: V[], t: number): V => {
  const segs = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
  const L = segs.reduce((a, b) => a + b, 0);
  let s = clamp(t) * L;
  for (let i = 0; i < segs.length; i++) {
    if (s <= segs[i] || i === segs.length - 1) {
      const k = segs[i] ? Math.min(1, s / segs[i]) : 0;
      return {x: pts[i].x + (pts[i + 1].x - pts[i].x) * k, y: pts[i].y + (pts[i + 1].y - pts[i].y) * k};
    }
    s -= segs[i];
  }
  return pts[pts.length - 1];
};

/** state colour of a sensor dot: 0 cyan (normal), 1 amber (sensing), 2 red (lethal); never white */
export const sensorColor = (w: number) => (w <= 1 ? mix('#46CFFF', '#FFB23E', clamp(w)) : mix('#FFB23E', '#FF4A5A', clamp(w - 1)));

/** Where heart sensor i sits (local frame of the window group), given the heart centre, scale and state. */
export const heartSensorAt = (st: HeartState, c: V, k: number, i: number): V => add(add(c, {x: st.qx, y: st.qy}), mul(tilt(vent(st, HEART_SENSORS[i])), k));
/** A point of the SVC (t 0 = top .. 1 = into the right atrium) in the window group's frame. */
export const svcAt = (st: HeartState, c: V, k: number, t: number): V => add(add(c, {x: st.qx, y: st.qy}), mul(tilt(alongPts(SVC_PULSE, t)), k));

type Props = {
  id: string;
  /** heart centre and scale in the window group's frame (rig units) */
  c: V;
  k: number;
  st: HeartState;
  /** direction toward the key light in this frame */
  light: V;
  sense: number;
  /** the trace's end sensor (sensor 0, on the left ventricle) alone, while the diagnostic trace runs to it before the
   *  other sensors appear (opacity 0..1) */
  senseEnd?: number;
  warn: number;
  /** treatment: pulse in the SVC and the local cyan light where it enters the right atrium */
  treat?: {t: number; a: number};
  treatLight?: number;
};

export const Heart4: React.FC<Props> = ({id, c, k, st, light: lightW, sense, senseEnd = 0, warn, treat, treatLight = 0}) => {
  // the key light in the heart's own (tilted) frame
  const light = rot(lightW, -HEART_TILT);
  const base = mix('#C8323F', '#D22A3C', st.chaos * 0.6);
  const lit = '#E25560';
  const dark = '#7E1E28';
  const atr = '#B92B3A';
  const vPts = VENT.map((p) => vent(st, p));
  const ventD = closedD(vPts);
  const raPts = ellPts(RA.c, RA.rx, RA.ry, RA.rot).map((p) => atrium(st, p, RA.c, st.nRA));
  const laPts = ellPts(LAA.c, LAA.rx, LAA.ry, LAA.rot, 12).map((p) => atrium(st, p, LAA.c, st.nLA));
  const groove = GROOVE.map((p) => vent(st, p));
  // the roots of the great vessels follow the top of the ventricles a little and widen in systole
  const top = vent(st, {x: 3, y: -21});
  const dTop = {x: top.x - 3, y: top.y + 21};
  const pt = PTRUNK.map((p, i) => (i === 0 ? add(p, dTop) : i === 1 ? add(p, mul(dTop, 0.5)) : p));
  const ao = AORTA.map((p, i) => (i === 0 ? add(p, mul(dTop, 0.6)) : p));
  const wr = st.roots;
  const lc = add(PIV, mul(light, 26));
  const spec = clamp(0.24 + 0.03 * st.chaos * Math.sin(st.qx * 9));
  const specC = vent(st, {x: -7, y: -9});
  const tl = clamp(treatLight);
  const raTop = atrium(st, {x: -14.5, y: -15}, RA.c, 0);
  return (
    <g transform={`translate(${fmt(c.x + st.qx)} ${fmt(c.y + st.qy)}) rotate(${HEART_TILT}) scale(${fmt(k)})`}>
      <defs>
        <radialGradient id={`${id}-v`} gradientUnits="userSpaceOnUse" cx={fmt(PIV.x)} cy={fmt(PIV.y)} r={30} fx={fmt(lc.x * 0.6)} fy={fmt(lc.y * 0.6)}>
          <stop offset="0" stopColor={lit} />
          <stop offset="0.5" stopColor={base} />
          <stop offset="1" stopColor={dark} />
        </radialGradient>
        <radialGradient id={`${id}-a`} gradientUnits="userSpaceOnUse" cx={fmt(RA.c.x)} cy={fmt(RA.c.y)} r={13} fx={fmt(RA.c.x + light.x * 5)} fy={fmt(RA.c.y + light.y * 5)}>
          <stop offset="0" stopColor={mix(atr, lit, 0.35)} />
          <stop offset="1" stopColor={shade(atr, 0.4)} />
        </radialGradient>
        <radialGradient id={`${id}-s`}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-tl`}>
          <stop offset="0" stopColor="#BFF3FF" stopOpacity={1} />
          <stop offset="0.5" stopColor="#39C6F4" stopOpacity={0.55} />
          <stop offset="1" stopColor="#39C6F4" stopOpacity={0} />
        </radialGradient>
        <clipPath id={`${id}-vc`}>
          <path d={ventD} />
        </clipPath>
      </defs>
      {/* superior vena cava (deoxygenated, the backmost vessel), down into the right atrium */}
      <path d={openD(SVC)} fill="none" stroke={shade('#4A5296', 0.25)} strokeWidth={6.6} strokeLinecap="round" />
      <path d={openD(SVC)} fill="none" stroke="#5A63A8" strokeWidth={4.8} strokeLinecap="round" />
      <path d={openD(SVC.map((p) => add(p, mul(light, 1))))} fill="none" stroke="#7C86C4" strokeWidth={1.2} strokeLinecap="round" opacity={0.5} />
      {/* aorta: rises behind the pulmonary trunk and arches toward his left */}
      <path d={openD(ao)} fill="none" stroke={shade('#D94A55', 0.3)} strokeWidth={fmt(10.5 * wr)} strokeLinecap="round" strokeLinejoin="round" />
      <path d={openD(ao)} fill="none" stroke="#D94A55" strokeWidth={fmt(8.4 * wr)} strokeLinecap="round" strokeLinejoin="round" />
      <path d={openD(ao.map((p) => add(p, mul(light, 1.8))))} fill="none" stroke="#E86E7A" strokeWidth={fmt(2 * wr)} strokeLinecap="round" opacity={0.45} />
      {/* atria behind the ventricles: the right atrium lobe and the small left-atrial ear */}
      <path d={closedD(laPts)} fill={atr} stroke={INK} strokeOpacity={0.45} strokeWidth={0.7} />
      <path d={closedD(raPts)} fill={`url(#${id}-a)`} stroke={INK} strokeOpacity={0.45} strokeWidth={0.7} />
      {/* ventricles */}
      <path d={ventD} fill={`url(#${id}-v)`} stroke={INK} strokeOpacity={0.5} strokeWidth={0.75} />
      <g clipPath={`url(#${id}-vc)`}>
        {/* the narrow left-ventricle strip is a touch darker than the right-ventricle face */}
        <path d={`${openD(groove)} L${P(vent(st, {x: 30, y: 30}))} L${P(vent(st, {x: 30, y: -30}))} Z`} fill={dark} opacity={0.18} />
        {/* the coronary (atrioventricular) groove line along the right atrium */}
        <path d={openD([vent(st, {x: -10.8, y: -15}), vent(st, {x: -12.8, y: -2.5}), vent(st, {x: -10.8, y: 11})])} fill="none" stroke={shade(base, 0.55)} strokeWidth={1.1} opacity={0.4} strokeLinecap="round" />
        {/* one soft specular on the right-ventricle face */}
        <ellipse cx={fmt(specC.x)} cy={fmt(specC.y)} rx={7} ry={3} transform={`rotate(-35 ${fmt(specC.x)} ${fmt(specC.y)})`} fill={`url(#${id}-s)`} opacity={spec} />
      </g>
      {/* anterior interventricular groove */}
      <path d={openD(groove)} fill="none" stroke={shade(base, 0.5)} strokeWidth={1.3} opacity={0.55} strokeLinecap="round" />
      {/* pulmonary trunk (in front of the aortic root) and the left pulmonary artery */}
      <path d={openD([...pt, ...LPA.slice(1)])} fill="none" stroke={shade('#5F6FBE', 0.3)} strokeWidth={fmt(8.4 * wr)} strokeLinecap="round" strokeLinejoin="round" />
      <path d={openD([...pt, ...LPA.slice(1)])} fill="none" stroke="#5F6FBE" strokeWidth={fmt(6.6 * wr)} strokeLinecap="round" strokeLinejoin="round" />
      <path d={openD(pt.map((p) => add(p, mul(light, 1.2))))} fill="none" stroke="#8B9AE0" strokeWidth={fmt(2 * wr)} strokeLinecap="round" opacity={0.6} />
      {/* sensors on the surface: small, state-coloured, no halo */}
      {HEART_SENSORS.map((p, i) => {
        const a = i === 0 ? Math.max(sense, senseEnd) : sense;
        if (a <= 0.01) return null;
        const q = vent(st, p);
        return <circle key={i} cx={fmt(q.x)} cy={fmt(q.y)} r={1.6} fill={sensorColor(warn)} stroke={shade(sensorColor(warn), 0.55)} strokeWidth={0.55} opacity={a} />;
      })}
      {/* treatment: restrained local cyan light where the pulse enters the right atrium (radius 4 local, about
          5.6 world at the window's heart scale 1.15: a quarter of the wrist radius; alpha <= 0.35, normal blending) */}
      {tl > 0.01 && <circle cx={fmt(raTop.x)} cy={fmt(raTop.y + 2)} r={4} fill={`url(#${id}-tl)`} opacity={0.35 * tl} />}
      {treat && treat.a > 0.01 && (() => {
        // the pulse: one narrow slug inside the vena cava (core #EAF4FF, rim #4F86FF)
        const p = alongPts(SVC_PULSE, treat.t);
        const q = alongPts(SVC_PULSE, Math.max(0, treat.t - 0.12));
        const ang = (Math.atan2(p.y - q.y, p.x - q.x) * 180) / Math.PI;
        return (
          <g opacity={treat.a}>
            <ellipse cx={fmt(p.x)} cy={fmt(p.y)} rx={5.2} ry={2.6} transform={`rotate(${fmt(ang)} ${fmt(p.x)} ${fmt(p.y)})`} fill="#4F86FF" />
            <ellipse cx={fmt(p.x)} cy={fmt(p.y)} rx={3.6} ry={1.4} transform={`rotate(${fmt(ang)} ${fmt(p.x)} ${fmt(p.y)})`} fill="#EAF4FF" />
          </g>
        );
      })()}
    </g>
  );
};

/** The heart's silhouette (ventricles, right atrium, left-atrial ear) for state st, relative to the heart centre,
 *  turned by HEART_TILT and unscaled (multiply by k and add the centre); for layout checks (clearance from the near
 *  arm, inside the window). */
export const heartOutline = (st: HeartState): V[] => [
  ...VENT.map((p) => vent(st, p)),
  ...ellPts(RA.c, RA.rx, RA.ry, RA.rot, 24).map((p) => atrium(st, p, RA.c, st.nRA)),
  ...ellPts(LAA.c, LAA.rx, LAA.ry, LAA.rot, 12).map((p) => atrium(st, p, LAA.c, st.nLA)),
].map((p) => add(tilt(p), {x: st.qx, y: st.qy}));
