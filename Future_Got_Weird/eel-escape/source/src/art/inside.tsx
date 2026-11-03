// Inside the predator (contract B): the interior seen through the translucent skin (mode 'reveal': soft, low contrast)
// and in the three-quarter cutaway over the gills (mode 'cut': clear, inked, with depth shading); the four gill arches;
// the cutaway window and the cut faces of its rim.
//
// Everything is in fish-local units (anatomy.ts: snout x = -50, y down, z toward the viewer).
//
// The cutaway's depth slices (the Scene applies the yaw per slice, screen x' = x0 + (x - x0)cos ψ + z sin ψ, x0 = -26;
// `yawMatrix(z, yaw)` is that transform):
//   InteriorBack  z = 0          (the throat, esophagus, chamber cavity, flesh)
//   eel, z < GILL_Z              (each sample projected with its own z)
//   GillArches    z = GILL_Z     (2.6)
//   eel, z ≥ GILL_Z, inside      (each sample projected with its own z)
//   exterior masked by CUT_WINDOW, and CutEdge, both in the slice z = CUT_Z (6.4)
//   eel outside                  (z = 6.9)
import React from 'react';
import {BODY, ESOPHAGUS, GILL_ARCHES, GILL_Z, OPERCLE_EDGE, P3, PHARYNX, STOMACH, SWIM_BLADDER, VENTRAL, DORSAL} from '../anatomy';
import {add, closed, line, mul, n4, nrm, open, P, perp, pt, sub} from '../core/geo';
import {lit, mix, rgba, shade} from '../core/color';
import {uid} from '../core/ids';
import {clamp} from '../lib';
import {RADII} from '../eel';
import {eelAt} from '../story';
import {C, INK, INK_PX, NS} from './palette';

export type InsideMode = 'reveal' | 'cut';

// ---------------------------------------------------------------- the cutaway's yaw (shared with the Scene)
/** the vertical axis the cutaway's yaw turns about (fish-local x) */
export const YAW_X0 = -26;
/** the depth (fish-local z) of the skin slice that CUT_WINDOW masks and CutEdge is drawn in (the gill cover strip) */
export const CUT_Z = 6.4;
/** screen x of a fish-local point (x, z) under the yaw (radians) */
export const yawX = (x: number, z: number, yaw: number) => YAW_X0 + (x - YAW_X0) * Math.cos(yaw) + z * Math.sin(yaw);
/** the SVG transform of one depth slice at fish-local depth z under the yaw (radians) */
export const yawMatrix = (z: number, yaw: number) => {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return `matrix(${n4(c)} 0 0 1 ${n4(YAW_X0 * (1 - c) + z * s)} 0)`;
};

// ---------------------------------------------------------------- small geometry helpers
/** uniform Catmull-Rom samples through control points (the same curve geo.open draws) */
const crOpen = (cp: P[], per: number): P[] => {
  const out: P[] = [];
  const n = cp.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = cp[Math.max(0, i - 1)], p1 = cp[i], p2 = cp[i + 1], p3 = cp[Math.min(n - 1, i + 2)];
    for (let k = 0; k < per; k++) out.push(crPt(p0, p1, p2, p3, k / per));
  }
  out.push(cp[n - 1]);
  return out;
};
/** the same for a closed loop (the curve geo.closed draws) */
const crClosed = (cp: P[], per: number): P[] => {
  const out: P[] = [];
  const n = cp.length;
  for (let i = 0; i < n; i++) {
    const p0 = cp[(i - 1 + n) % n], p1 = cp[i], p2 = cp[(i + 1) % n], p3 = cp[(i + 2) % n];
    for (let k = 0; k < per; k++) out.push(crPt(p0, p1, p2, p3, k / per));
  }
  return out;
};
const crPt = (p0: P, p1: P, p2: P, p3: P, t: number): P => {
  const t2 = t * t, t3 = t2 * t;
  const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  return pt(f(p0.x, p1.x, p2.x, p3.x), f(p0.y, p1.y, p2.y, p3.y));
};
/** unit tangents of a polyline (open or closed) */
const tangents = (ps: P[], loop: boolean) =>
  ps.map((_, i) => {
    const n = ps.length;
    const a = loop ? ps[(i - 1 + n) % n] : ps[Math.max(0, i - 1)];
    const b = loop ? ps[(i + 1) % n] : ps[Math.min(n - 1, i + 1)];
    return nrm(sub(b, a));
  });
/** offset an open polyline sideways (positive d: to the left of travel, i.e. perp(T)) */
const offsetOpen = (ps: P[], d: number | ((i: number) => number)) => {
  const T = tangents(ps, false);
  return ps.map((p, i) => add(p, mul(perp(T[i]), typeof d === 'number' ? d : d(i))));
};
const bump = (x: number) => (x <= 0 || x >= 1 ? 0 : Math.sin(Math.PI * x));
const P2 = (p: P) => `${n4(p.x)} ${n4(p.y)}`;

// ---------------------------------------------------------------- the cutaway window
/** width of the gill cover's rear strip left intact behind the window (along OPERCLE_EDGE) */
export const STRIP_W = 1.8;
/** the window's rear boundary: the gill cover's free edge offset forward by STRIP_W (from the cover's top to y ≈ 6) */
const REAR: P[] = offsetOpen(OPERCLE_EDGE, STRIP_W).slice(0, 7);
/** control points of the window (clockwise on screen: top, rear boundary, bottom, front), smooth closed curve */
export const CUT_WINDOW_PTS: P[] = [
  pt(-36.4, -9.25), pt(-34.0, -10.3), pt(-31.0, -10.72),
  ...REAR,
  pt(-29.4, 7.0), pt(-33.0, 7.05), pt(-35.95, 5.75), pt(-37.55, 2.9), pt(-37.95, -0.8), pt(-37.35, -5.4),
];
/** the cut wall's thickness (u) at each window control point: thin along the gill cover strip, thicker into the head */
const WIN_THICK: number[] = [2.4, 2.6, 2.6, 1.9, 1.15, 0.95, 0.95, 1.0, 1.15, 1.7, 2.6, 2.6, 2.4, 2.4, 2.4, 2.4];
/** fish-local path: the cutaway window (the hole the Scene masks out of the exterior, in the slice z = CUT_Z) */
export const CUT_WINDOW: string = closed(CUT_WINDOW_PTS);
const WIN_T = tangents(CUT_WINDOW_PTS, true);
/** inward normal at each window control point (the window runs clockwise on screen, so inward = perp(T)) */
const WIN_IN = WIN_T.map(perp);
const winGrown = (d: number, dx = 0) => closed(CUT_WINDOW_PTS.map((p, i) => add(p, add(mul(WIN_IN[i], -d), pt(dx, 0)))));
/** the region InteriorBack covers in mode 'cut': the window and the window seen at full yaw (the deep slice slides
 *  left relative to the skin by CUT_Z·sin ψ, so the deep layer must reach ~2.6 u further back than the window) */
const CUT_REGION = [winGrown(0.55), winGrown(0.55, 3.1)];

// ---------------------------------------------------------------- shared interior shapes (fish-local, static)
const BODY_D = closed(BODY);
/** the throat (pharynx) as seen in the cutaway: a pink lumen from the mouth back to the esophagus */
const THROAT_TOP: P[] = [pt(-41.5, -2.0), pt(-37.5, -2.15), pt(-33.5, -1.85), pt(-30.6, -1.15), pt(-28.6, -0.45), pt(-25.0, -0.42), pt(-20.0, -0.32), pt(-16.0, -0.25)];
const THROAT_BOT: P[] = [pt(-16.0, 3.5), pt(-20.0, 3.48), pt(-25.0, 3.38), pt(-28.4, 3.6), pt(-31.0, 4.15), pt(-34.5, 4.45), pt(-38.0, 4.3), pt(-41.5, 3.9)];
const THROAT_D = open([...THROAT_TOP]) + 'L' + open([...THROAT_BOT]).slice(1) + 'Z';
/** soft longitudinal folds of the throat's lining */
const RUGAE_CUT = [0.25, 1.35, 2.45, 3.4].map((y0, j) =>
  open(Array.from({length: 13}, (_, k) => {
    const x = -41 + k * 2.1;
    return pt(x, y0 + (x > -29.5 ? -0.12 * j : 0.1 * (j - 1.5) * (-29.5 - x) / 11) + 0.16 * Math.sin(k * 1.7 + j * 2.2));
  }), 0.8)).join('');
/** the opercular chamber cavity (the space between the gills and the removed cover), deep red */
const CHAMBER_CUT: P[] = [
  pt(-33.4, -9.9), pt(-29.6, -10.35), pt(-26.3, -9.55), pt(-24.0, -6.9), pt(-22.75, -3.0), pt(-22.6, 1.0), pt(-23.5, 4.9),
  pt(-25.5, 8.1), pt(-28.9, 9.4), pt(-32.4, 9.1), pt(-36.0, 7.9), pt(-39.4, 5.6), pt(-41.2, 1.2), pt(-40.6, -3.6), pt(-37.6, -7.9),
];
const CHAMBER_CUT_D = closed(CHAMBER_CUT);
/** the chamber under the gill cover as seen through the translucent skin (between the preopercle and the free edge) */
const CHAMBER_REV: P[] = [
  pt(-36.2, -9.15), pt(-31.8, -10.3), pt(-27.9, -10.35), pt(-25.3, -8.5), pt(-23.6, -5.4), pt(-23.0, -1.5), pt(-23.3, 2.6),
  pt(-24.8, 6.3), pt(-28.0, 9.4), pt(-31.8, 9.9), pt(-35.6, 8.4), pt(-36.0, 4.0), pt(-34.95, -0.5), pt(-35.05, -5.0),
];
const CHAMBER_REV_D = closed(CHAMBER_REV);
/** pharynx / throat (reveal): behind the closed mouth back to the gills */
const PHARYNX_REV_D = closed([
  pt(PHARYNX.front.x - 0.9, PHARYNX.front.y - 0.1), pt(-45.6, -1.55), pt(-41.0, -2.2), pt(-35.0, -2.0), pt(-30.6, -1.4),
  pt(PHARYNX.back.x + 0.3, PHARYNX.back.y - 0.2), pt(-29.1, 3.0), pt(-31.5, 4.15), pt(-36.0, 4.3), pt(-41.5, 3.7), pt(-45.4, 2.5),
]);
/** esophagus (reveal): a muscular tube from the throat to the cardia */
const ESO_TOP: P[] = [pt(ESOPHAGUS.front.x - 1.2, ESOPHAGUS.front.y - 1.75), pt(-24.0, -0.48), pt(-18.5, -0.32), pt(ESOPHAGUS.back.x, ESOPHAGUS.back.y - 1.85), pt(-11.5, -0.4)];
const ESO_BOT: P[] = [pt(-11.5, 4.0), pt(ESOPHAGUS.back.x, ESOPHAGUS.back.y + 1.95), pt(-18.5, 3.55), pt(-24.0, 3.32), pt(ESOPHAGUS.front.x - 1.2, ESOPHAGUS.front.y + 1.7)];
const ESO_REV_D = open(ESO_TOP) + 'L' + open(ESO_BOT).slice(1) + 'Z';
/** the distended stomach (around STOMACH's egg): narrow at the cardia, where the esophagus enters at its front, full
 *  and round at the back; it holds the whole folded eel */
const STOMACH_PTS: P[] = [
  pt(-14.3, -0.05), pt(-10.6, -1.35), pt(-4.6, -2.1), pt(1.5, -1.75), pt(6.4, -0.1), pt(9.35, 3.3), pt(9.6, 6.8), pt(7.3, 9.6),
  pt(2.5, 11.1), pt(-3.5, 11.25), pt(-9.0, 10.0), pt(-12.9, 7.5), pt(-14.65, 4.9), pt(-14.75, 3.3),
];
export const STOMACH_D = closed(STOMACH_PTS);
const SWIM_D = closed(Array.from({length: 20}, (_, i) => {
  const a = (i / 20) * 2 * Math.PI;
  const ca = Math.cos(a);
  return pt(SWIM_BLADDER.c.x + SWIM_BLADDER.rx * ca, SWIM_BLADDER.c.y + SWIM_BLADDER.ry * Math.sin(a) * (1 - 0.18 * ca));
}));
/** body depth profile helpers for the muscle (myomere) hints */
const yAt = (prof: P[], x: number) => {
  for (let i = 0; i < prof.length - 1; i++) {
    const a = prof[i], b = prof[i + 1];
    if (x >= a.x && x <= b.x) return a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x || 1);
  }
  return prof[x < prof[0].x ? 0 : prof.length - 1].y;
};
const MYOMERES = (() => {
  let d = '';
  for (let x = -17; x <= 31; x += 3.4) {
    const top = yAt(DORSAL, x) + 1.1, bot = yAt(VENTRAL, x) - 1.1, mid = (top * 0.45 + bot * 0.55) - 1.2;
    const lean = 1.6 + 0.02 * (x + 17);
    d += open([pt(x + 0.5, top), pt(x - lean * 0.35, (top + mid) / 2), pt(x - lean, mid), pt(x - lean * 0.35, (mid + bot) / 2), pt(x + 0.6, bot)], 0.9);
  }
  return d;
})();

// ---------------------------------------------------------------- the eel's pose, for the parts that react to it
type EelBits = {pts: P3[]; exitIdx: number};
const eelBits = (t: number): EelBits => {
  const e = eelAt(t);
  return {pts: e.pts, exitIdx: e.exitIdx};
};
/** a tube outline (fish-local x, y) along samples [a, b) with radii scaled by k plus an offset */
const tubeOutline = (pts: P[], radii: number[], k = 1, extra = 0) => {
  const n = pts.length;
  if (n < 2) return '';
  const T = tangents(pts, false);
  const L: P[] = [], R: P[] = [];
  for (let i = 0; i < n; i++) {
    const r = radii[i] * k + extra;
    const N = perp(T[i]);
    L.push(add(pts[i], mul(N, r)));
    R.push(add(pts[i], mul(N, -r)));
  }
  return 'M' + L.map(P2).join('L') + 'L' + R.reverse().map(P2).join('L') + 'Z';
};

// ================================================================ InteriorBack
/** Flesh hints, throat/pharynx, esophagus, the distended stomach (its back wall; StomachFront is the front wall over
 *  the eel) and the opercular chamber. Mode 'reveal': the whole body interior, soft and low in contrast, to sit under
 *  the translucent skin. Mode 'cut': the deep slice of the cutaway (z = 0), covering the window and what the yaw
 *  reveals behind its rear edge, with inked edges and depth shading, plus the soft shadow the eel casts on the throat
 *  floor. Fish-local units. */
export const InteriorBack: React.FC<{t: number; mode: InsideMode}> = ({t, mode}) => (mode === 'cut' ? <InteriorCut t={t} /> : <InteriorReveal t={t} />);

const InteriorReveal: React.FC<{t: number}> = () => {
  const gFlesh = uid('inFl'), cBody = uid('inBc'), gSt = uid('inSt'), gCh = uid('inCh'), gEso = uid('inEs'), gPh = uid('inPh'), gSw = uid('inSw');
  const ln = (o: number) => ({stroke: rgba(INK, o), strokeWidth: 1.3, vectorEffect: NS} as const);
  return (
    <g>
      <defs>
        <linearGradient id={gFlesh} gradientUnits="userSpaceOnUse" x1={0} y1={-13} x2={0} y2={12.5}>
          <stop offset="0" stopColor={lit(C.flesh, 0.12)} />
          <stop offset="0.55" stopColor={C.flesh} />
          <stop offset="1" stopColor={mix(C.flesh, C.fleshDeep, 0.55)} />
        </linearGradient>
        <clipPath id={cBody}>
          <path d={BODY_D} />
        </clipPath>
        <radialGradient id={gSt} gradientUnits="userSpaceOnUse" cx={STOMACH.c.x - 1.5} cy={STOMACH.c.y - 1.2} r={STOMACH.rx * 1.02}>
          <stop offset="0" stopColor={lit(C.stomach, 0.12)} />
          <stop offset="0.6" stopColor={C.stomach} />
          <stop offset="0.9" stopColor={mix(C.stomach, C.stomachWall, 0.7)} />
          <stop offset="1" stopColor={shade(C.stomachWall, 0.18)} />
        </radialGradient>
        <linearGradient id={gCh} gradientUnits="userSpaceOnUse" x1={-33} y1={-10} x2={-26} y2={9}>
          <stop offset="0" stopColor={mix(C.chamber, C.gillDark, 0.2)} />
          <stop offset="0.55" stopColor={mix(C.chamber, C.pharynx, 0.28)} />
          <stop offset="1" stopColor={mix(C.chamber, C.pharynx, 0.5)} />
        </linearGradient>
        <linearGradient id={gEso} gradientUnits="userSpaceOnUse" x1={0} y1={-0.5} x2={0} y2={3.6}>
          <stop offset="0" stopColor={lit(C.esophagus, 0.18)} />
          <stop offset="0.5" stopColor={C.esophagus} />
          <stop offset="1" stopColor={shade(C.esophagus, 0.22)} />
        </linearGradient>
        <linearGradient id={gPh} gradientUnits="userSpaceOnUse" x1={0} y1={-2.2} x2={0} y2={4.3}>
          <stop offset="0" stopColor={shade(C.pharynx, 0.25)} />
          <stop offset="0.6" stopColor={C.pharynx} />
          <stop offset="1" stopColor={lit(C.pharynx, 0.15)} />
        </linearGradient>
        <linearGradient id={gSw} gradientUnits="userSpaceOnUse" x1={0} y1={-9.2} x2={0} y2={-4}>
          <stop offset="0" stopColor={lit(C.flesh, 0.7)} />
          <stop offset="1" stopColor={lit(C.flesh, 0.35)} />
        </linearGradient>
      </defs>
      {/* the flesh: muscle filling the body, a little deeper toward the skin */}
      <path d={BODY_D} fill={`url(#${gFlesh})`} />
      <g clipPath={`url(#${cBody})`}>
        <path d={BODY_D} fill="none" stroke={rgba(C.fleshDeep, 0.5)} strokeWidth={2.6} />
        <path d={MYOMERES} fill="none" stroke={rgba(lit(C.flesh, 0.55), 0.75)} strokeWidth={1.5} vectorEffect={NS} strokeLinecap="round" />
      </g>
      {/* the swim bladder (gas), pale above the gut */}
      <path d={SWIM_D} fill={`url(#${gSw})`} opacity={0.75} {...ln(0.18)} />
      {/* the throat and the esophagus running back to the stomach */}
      <path d={PHARYNX_REV_D} fill={`url(#${gPh})`} />
      <path d={PHARYNX_REV_D} fill="none" {...ln(0.16)} />
      <path d={ESO_REV_D} fill={`url(#${gEso})`} />
      <path d={open([pt(-28.6, 0.6), pt(-22, 0.75), pt(-15.5, 0.95)])} fill="none" stroke={rgba(lit(C.esophagus, 0.4), 0.6)} strokeWidth={1.2} vectorEffect={NS} />
      <path d={open([pt(-28.6, 2.5), pt(-22, 2.6), pt(-15.5, 2.75)])} fill="none" stroke={rgba(shade(C.esophagus, 0.3), 0.45)} strokeWidth={1.2} vectorEffect={NS} />
      {/* the stomach's back wall (the eel lies in front of it) */}
      <path d={STOMACH_D} fill={`url(#${gSt})`} />
      {/* the opercular chamber under the gill cover */}
      <path d={CHAMBER_REV_D} fill={`url(#${gCh})`} opacity={0.78} />
      <path d={CHAMBER_REV_D} fill="none" stroke={rgba(C.fleshDeep, 0.55)} strokeWidth={0.5} />
      <path d={open(ESO_TOP.slice(0, -1)) + open(ESO_BOT.slice(1))} fill="none" {...ln(0.16)} />
      <path d={STOMACH_D} fill="none" {...ln(0.2)} />
      <path d={CHAMBER_REV_D} fill="none" {...ln(0.14)} />
    </g>
  );
};

/** the arches' outlines offset down and back: their shadows on the deep wall (built on first use, static) */
let ARCH_SHADOWS: string | null = null;
const archShadows = () =>
  (ARCH_SHADOWS ??= [0, 1, 2, 3].map((i) => archGeo(i, 0.3, []).hull).join('').replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${n4(+x + 0.55)} ${n4(+y + 0.75)}`));
const THROAT_GLINTS =
  open([pt(-39.6, -1.25), pt(-38.4, -1.42), pt(-37.3, -1.45)]) + open([pt(-36.4, -1.38), pt(-35.9, -1.36)]) +
  open([pt(-24.6, 0.05), pt(-23.2, 0.0), pt(-22.1, 0.02)]) + open([pt(-38.8, 3.55), pt(-37.6, 3.62)]);

const InteriorCut: React.FC<{t: number}> = ({t}) => {
  const cR = uid('icR'), gFl = uid('icFl'), gCh = uid('icCh'), gTh = uid('icTh'), gEw = uid('icEw');
  const e = eelBits(t);
  // the eel's soft shadow on the throat floor (only the part behind the gill plane, inside the fish)
  const behind: P[] = [], rr: number[] = [];
  for (let i = 0; i < Math.min(e.exitIdx, e.pts.length); i++) {
    const q = e.pts[i];
    if (q.z >= GILL_Z + 0.2) break;
    if (q.x < -36 || q.x > -19) continue;
    behind.push(pt(q.x + 0.12 + 0.12 * q.z, q.y + 0.34 + 0.1 * q.z));
    rr.push(RADII[i]);
  }
  return (
    <g>
      <defs>
        <clipPath id={cR}>
          {CUT_REGION.map((d, i) => <path key={i} d={d} />)}
        </clipPath>
        <linearGradient id={gFl} gradientUnits="userSpaceOnUse" x1={-37} y1={-11} x2={-25} y2={8}>
          <stop offset="0" stopColor={lit(C.flesh, 0.1)} />
          <stop offset="0.55" stopColor={C.flesh} />
          <stop offset="1" stopColor={mix(C.flesh, C.fleshDeep, 0.6)} />
        </linearGradient>
        <radialGradient id={gCh} gradientUnits="userSpaceOnUse" cx={-29.4} cy={-0.8} r={10.4} fx={-30.6} fy={-2.4}>
          <stop offset="0" stopColor={C.gillDark} />
          <stop offset="0.62" stopColor={mix(C.gillDark, C.chamber, 0.6)} />
          <stop offset="0.9" stopColor={C.chamber} />
          <stop offset="1" stopColor={mix(C.chamber, C.fleshDeep, 0.45)} />
        </radialGradient>
        <linearGradient id={gTh} gradientUnits="userSpaceOnUse" x1={0} y1={-2.2} x2={0} y2={4.5}>
          <stop offset="0" stopColor={mix(C.pharynx, C.chamber, 0.55)} />
          <stop offset="0.35" stopColor={C.pharynx} />
          <stop offset="0.8" stopColor={lit(C.pharynx, 0.12)} />
          <stop offset="1" stopColor={mix(C.pharynx, C.esophagus, 0.6)} />
        </linearGradient>
        <linearGradient id={gEw} gradientUnits="userSpaceOnUse" x1={-28} y1={0} x2={-18} y2={0}>
          <stop offset="0" stopColor={shade(C.esophagus, 0.2)} />
          <stop offset="1" stopColor={C.esophagus} />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${cR})`}>
        {/* flesh: the head's muscle around the cut */}
        <rect x={-42} y={-13} width={24} height={23} fill={`url(#${gFl})`} />
        <path
          d={open([pt(-39, -8.6), pt(-35.5, -9.6), pt(-31, -10.2), pt(-26, -9.9), pt(-21, -8.6)]) +
            open([pt(-39, -6.1), pt(-36.6, -6.9), pt(-34.8, -7.2)]) +
            open([pt(-39.5, 6.3), pt(-36, 7.0), pt(-31, 7.9), pt(-26, 8.2), pt(-21, 7.6)]) +
            open([pt(-21.4, -6.5), pt(-21.0, -2.0), pt(-21.2, 2.5), pt(-22.2, 6.0)])}
          fill="none" stroke={rgba(lit(C.flesh, 0.6), 0.8)} strokeWidth={1.3} vectorEffect={NS} strokeLinecap="round"
        />
        {/* the opercular chamber: a deep red cavity around the gills */}
        <path d={CHAMBER_CUT_D} fill={`url(#${gCh})`} />
        {/* the throat: the pharynx lumen running forward to the mouth and back into the esophagus */}
        <path d={THROAT_D} fill={`url(#${gTh})`} />
        <path d={RUGAE_CUT} fill="none" stroke={rgba(lit(C.pharynx, 0.4), 0.5)} strokeWidth={1.2} vectorEffect={NS} strokeLinecap="round" />
        {/* the esophagus wall, cut open lengthwise: its muscular rims above and below the lumen */}
        <path d={open([pt(-28.6, -0.45), pt(-25.0, -0.42), pt(-20.0, -0.32), pt(-16.0, -0.25)]) + 'L-16 -1.15' + open([pt(-16, -1.15), pt(-20, -1.22), pt(-25, -1.3), pt(-28.0, -1.25)]).slice(1) + 'Z'} fill={`url(#${gEw})`} />
        <path d={open([pt(-28.4, 3.6), pt(-25.0, 3.38), pt(-20.0, 3.48), pt(-16.0, 3.5)]) + 'L-16 4.35' + open([pt(-16, 4.35), pt(-20, 4.35), pt(-25, 4.3), pt(-28.0, 4.45)]).slice(1) + 'Z'} fill={`url(#${gEw})`} />
        {/* the gill arches' soft shadows on the throat's far wall (light from the upper left) */}
        <path d={archShadows()} fill={rgba(C.gillDark, 0.26)} />
        {/* wet glints on the throat's lining */}
        <path d={THROAT_GLINTS} fill="none" stroke="#FFFFFF" strokeOpacity={0.42} strokeWidth={0.13} strokeLinecap="round" />
        {/* the eel's soft shadow on the throat floor */}
        {behind.length > 1 && <path d={tubeOutline(behind, rr, 1.05, 0.08)} fill={rgba(C.gillDark, 0.38)} />}
        {/* ink: the cavity and the throat's edges */}
        <path d={CHAMBER_CUT_D} fill="none" stroke={rgba(INK, 0.55)} strokeWidth={1.4} vectorEffect={NS} />
        <path d={open(THROAT_TOP)} fill="none" stroke={rgba(INK, 0.5)} strokeWidth={1.4} vectorEffect={NS} />
        <path d={open(THROAT_BOT)} fill="none" stroke={rgba(INK, 0.5)} strokeWidth={1.4} vectorEffect={NS} />
        <path d={open([pt(-28.0, -1.25), pt(-25, -1.3), pt(-20, -1.22), pt(-16, -1.15)])} fill="none" stroke={rgba(INK, 0.4)} strokeWidth={1.2} vectorEffect={NS} />
        <path d={open([pt(-28.0, 4.45), pt(-25, 4.3), pt(-20, 4.35), pt(-16, 4.35)])} fill="none" stroke={rgba(INK, 0.4)} strokeWidth={1.2} vectorEffect={NS} />
      </g>
    </g>
  );
};

// ================================================================ GillArches
type ArchGeo = {ink: string; filBack: string; fil: string; core: string; bar: string; hi: string; hull: string};
const ARCH_PER = 10; // centreline samples per control segment
const FIL_STEP = 0.36; // filament spacing along the arch (u)
const FIL_W = 0.22; // filament thickness at the base (u)
/** resample a polyline at equal arc-length steps (position, unit tangent, arc fraction) */
const resample = (ps: P[], step: number) => {
  const s = [0];
  for (let i = 1; i < ps.length; i++) s.push(s[i - 1] + Math.hypot(ps[i].x - ps[i - 1].x, ps[i].y - ps[i - 1].y));
  const L = s[s.length - 1];
  const n = Math.max(2, Math.round(L / step));
  const out: {p: P; T: P; u: number}[] = [];
  let j = 0;
  for (let k = 0; k <= n; k++) {
    const sk = (k / n) * L;
    while (j < ps.length - 2 && s[j + 1] < sk) j++;
    const r = (sk - s[j]) / (s[j + 1] - s[j] || 1);
    const p = pt(ps[j].x + (ps[j + 1].x - ps[j].x) * r, ps[j].y + (ps[j + 1].y - ps[j].y) * r);
    const a = ps[Math.max(0, j - 1)], b = ps[Math.min(ps.length - 1, j + 2)];
    out.push({p, T: nrm(sub(b, a)), u: k / n});
  }
  return out;
};
type EelDisc = {p: P; r: number};
/** the eel's samples inside the gill plane's depth band: where it passes through a slit */
const inPlane = (e: EelBits): EelDisc[] => {
  const out: EelDisc[] = [];
  for (let i = 0; i < Math.min(e.exitIdx, e.pts.length); i++) {
    const q = e.pts[i];
    if (q.z > GILL_Z - 0.65 && q.z < GILL_Z + 0.75) out.push({p: pt(q.x, q.y), r: RADII[i]});
  }
  return out;
};
/** distance from the eel's surface (large when none is near) */
const clearOf = (eel: EelDisc[], p: P) => {
  let d = 99;
  for (const q of eel) d = Math.min(d, Math.hypot(p.x - q.p.x, p.y - q.p.y) - q.r);
  return d;
};
/** a smooth envelope over a sampled need (max of Gaussian bumps), so a local push bends instead of kinking */
const envelope = (need: number[], step: number, sigma: number) =>
  need.map((_, k) => {
    let m = 0;
    for (let j = 0; j < need.length; j++) if (need[j] > 0) m = Math.max(m, need[j] * Math.exp(-((((k - j) * step) / sigma) ** 2)));
    return m;
  });
const SLIT_CLEAR = 0.3; // the gap the eel keeps around itself in the slit (u)

const archGeo = (i: number, gill: number, eel: EelDisc[]): ArchGeo => {
  let S = resample(crOpen(GILL_ARCHES[i], ARCH_PER), FIL_STEP);
  const n = S.length;
  const rb = (u: number) => 0.21 * (0.55 + 0.45 * Math.sin(Math.PI * clamp(u)));
  const back = (T: P) => pt(T.y, -T.x); // posterior normal (toward +x for a downward arch)
  // arch 3 (index 2) is pushed back where the eel squeezes past its front edge
  if (i === 2 && eel.length) {
    const need = S.map(({p, T, u}) => Math.max(0, SLIT_CLEAR - clearOf(eel, add(p, mul(perp(T), rb(u))))));
    const env = envelope(need, FIL_STEP, 2.1);
    S = S.map((s, k) => ({...s, p: add(s.p, pt(Math.min(1.0, env[k]), 0))}));
    S = S.map((s, k) => ({...s, T: nrm(sub(S[Math.min(n - 1, k + 1)].p, S[Math.max(0, k - 1)].p))}));
  }
  const len = (u: number, k: number) => 1.22 * (1 + 0.12 * gill) * (0.38 + 0.62 * Math.pow(Math.sin(Math.PI * clamp(u)), 0.55)) * (1 + 0.07 * Math.sin(k * 2.7 + i * 1.3) + 0.07 * Math.sin(k * 0.83 + i * 2.1));
  const base = S.map(({p, T, u}) => add(p, mul(back(T), rb(u) * 0.4)));
  const dirs = S.map(({T, u}) => nrm(add(back(T), mul(T, 0.42 * (u - 0.5))))); // the filaments fan out toward the arch's ends
  let L = S.map(({u}, k) => len(u, k));
  const splay = S.map(() => 0);
  // arch 2 (index 1): its filaments bend and fold back where the eel slips past their tips
  if (i === 1 && eel.length) {
    const need = S.map((_, k) => Math.max(0, SLIT_CLEAR + 0.05 - clearOf(eel, add(base[k], mul(dirs[k], L[k])))));
    const env = envelope(need, FIL_STEP, 1.1);
    let yc = 0, w = 0;
    for (const q of eel) { yc += q.p.y; w++; }
    yc /= w || 1;
    L = L.map((l, k) => Math.max(l * 0.3, l - env[k] * 1.05));
    S.forEach((s, k) => (splay[k] = Math.tanh((s.p.y - yc) / 0.7) * Math.min(0.7, env[k] * 0.9)));
  }
  const tipOf = (k: number, kL = 1, dk = 0) => {
    const T = S[k].T;
    return add(add(base[k], mul(dirs[k], L[k] * kL)), mul(T, splay[k] * kL + dk));
  };
  // each filament a slender finger with a rounded tip
  const finger = (b: P, tp: P, w0: number) => {
    const v = sub(tp, b), l = Math.hypot(v.x, v.y) || 1e-6, d = mul(v, 1 / l), m = perp(d);
    const w1 = w0 * 0.82;
    const cap = Math.min(0.45 * l, 1.25 * w1);
    const mid = sub(tp, mul(d, cap));
    const ctrl = sub(mul(tp, 2), mid);
    return `M${P2(add(b, mul(m, w0)))}L${P2(add(mid, mul(m, w1)))}Q${P2(ctrl)} ${P2(add(mid, mul(m, -w1)))}L${P2(add(b, mul(m, -w0)))}Z`;
  };
  let filBack = '', fil = '', core = '';
  for (let k = 0; k < n; k++) {
    const b = base[k], tp = tipOf(k);
    fil += finger(b, tp, FIL_W * 0.5);
    {
      // the lit upper side of the filament (light from the upper left)
      const up = mul(perp(nrm(sub(tp, b))), -FIL_W * 0.18 * Math.sign(sub(tp, b).x || 1));
      core += `M${P2(add(add(b, mul(sub(tp, b), 0.3)), up))}L${P2(add(add(b, mul(sub(tp, b), 0.78)), up))}`;
    }
    if (k < n - 1) filBack += finger(mul(add(base[k], base[k + 1]), 0.5), mul(add(tipOf(k, 0.92), tipOf(k + 1, 0.92)), 0.5), FIL_W * 0.5);
  }
  const ink = filBack + fil;
  // the bony bar: a tube tapered at both ends, with its lit front edge
  const C0 = S.map((s) => s.p);
  const Lb = S.map(({p, T, u}) => add(p, mul(perp(T), rb(u))));
  const Rb = S.map(({p, T, u}) => add(p, mul(perp(T), -rb(u))));
  const capT = add(C0[0], mul(S[0].T, -0.16)), capB = add(C0[n - 1], mul(S[n - 1].T, 0.16));
  const bar = `M${P2(capT)}L` + Lb.map(P2).join('L') + `L${P2(capB)}L` + [...Rb].reverse().map(P2).join('L') + 'Z';
  const hi = line(S.slice(3, -3).map(({p, T, u}) => add(p, mul(perp(T), rb(u) * 0.42))));
  // the arch's hull (bar + filament tips), for clipping the eel's shadow
  const hull = `M${P2(capT)}L` + Lb.map(P2).join('L') + `L${P2(capB)}L` + S.map((_, k) => P2(tipOf(n - 1 - k, 1.04))).join('L') + 'Z';
  return {ink, filBack, fil, core, bar, hi, hull};
};

/** The four gill arches (near side, z = GILL_Z) with their red filaments, drawn rearmost first. `gill` (0..1, the
 *  cover's flare) spreads the filaments a little. Where the eel passes through the slit between arch 2 and arch 3 it
 *  parts them (arch 3 bends back, arch 2's filaments fold aside), so the slit opens around its body. Mode 'cut' also
 *  shades what lies behind the gill plane (the eel's deeper section reads as deeper) and draws the shadow the eel in
 *  the chamber casts on the arches; mode 'reveal' is softer (lighter ink, lower contrast). Fish-local units. */
export const GillArches: React.FC<{t: number; mode: InsideMode; gill: number}> = ({t, mode, gill}) => {
  const cut = mode === 'cut';
  const e = eelBits(t);
  const eel = inPlane(e);
  const geos = [3, 2, 1, 0].map((i) => archGeo(i, gill, eel));
  const gDim = uid('gaDim'), cArch = uid('gaCl'), mDim = uid('gaM'), gHole = uid('gaH');
  // where the eel crosses the gill plane: the shade fades out around it, so the body brightens as it emerges
  let cross: P | null = null;
  for (let i = 1; i < Math.min(e.exitIdx, e.pts.length); i++) {
    const a = e.pts[i - 1], b = e.pts[i];
    if (a.z < GILL_Z && b.z >= GILL_Z) {
      const u = (GILL_Z - a.z) / (b.z - a.z || 1);
      cross = pt(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u);
      break;
    }
  }
  const barC = mix(C.flesh, C.gillRed, cut ? 0.5 : 0.35);
  // the eel's part in front of the gill plane (inside the fish): its shadow falls on the arches, down and right
  const front: P[] = [], rr: number[] = [];
  if (cut) {
    for (let i = 0; i < Math.min(e.exitIdx, e.pts.length); i++) {
      const q = e.pts[i];
      if (q.z < GILL_Z) continue;
      const h = q.z - GILL_Z + 0.3;
      front.push(pt(q.x + 0.16 * h, q.y + 0.24 * h));
      rr.push(RADII[i]);
    }
  }
  const inkC = rgba(INK, cut ? 0.85 : 0.35);
  const red = cut ? C.gillRed : mix(C.gillRed, C.gillFilament, 0.35);
  return (
    <g>
      <defs>
        <radialGradient id={gDim} gradientUnits="userSpaceOnUse" cx={-29.0} cy={-0.5} r={10.2}>
          <stop offset="0" stopColor={C.gillDark} stopOpacity={0.36} />
          <stop offset="0.7" stopColor={C.gillDark} stopOpacity={0.26} />
          <stop offset="1" stopColor={C.gillDark} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={gHole}>
          <stop offset="0" stopColor="#000000" />
          <stop offset="0.35" stopColor="#000000" />
          <stop offset="1" stopColor="#FFFFFF" />
        </radialGradient>
        {cut && (
          <clipPath id={cArch}>
            {geos.map((g, k) => <path key={k} d={g.hull} />)}
          </clipPath>
        )}
      </defs>
      {/* depth: what lies behind the gill plane sits in the chamber's shade */}
      {cut && cross && (
        <mask id={mDim} maskUnits="userSpaceOnUse" x={-45} y={-15} width={30} height={30}>
          <rect x={-45} y={-15} width={30} height={30} fill="#FFFFFF" />
          <circle cx={n4(cross.x)} cy={n4(cross.y)} r={2.2} fill={`url(#${gHole})`} />
        </mask>
      )}
      {cut && <path d={CHAMBER_CUT_D} fill={`url(#${gDim})`} mask={cross ? `url(#${mDim})` : undefined} />}
      {geos.map((g, k) => (
        <g key={k} opacity={cut ? 1 : 0.86}>
          <path d={g.ink} fill={inkC} stroke={inkC} strokeWidth={cut ? 0.1 : 0.05} strokeLinejoin="round" />
          <path d={g.filBack} fill={shade(C.gillRed, cut ? 0.45 : 0.25)} />
          <path d={g.fil} fill={red} />
          <path d={g.core} stroke={cut ? C.gillFilament : lit(C.gillFilament, 0.15)} strokeWidth={FIL_W * 0.3} strokeLinecap="round" fill="none" />
          <path d={g.bar} fill={barC} stroke={inkC} strokeWidth={cut ? 1.3 : 0.9} vectorEffect={NS} strokeLinejoin="round" />
          <path d={g.hi} stroke={lit(barC, 0.45)} strokeWidth={0.07} strokeLinecap="round" fill="none" />
        </g>
      ))}
      {/* the eel's shadow where it crosses the chamber in front of the arches */}
      {cut && front.length > 1 && (
        <g clipPath={`url(#${cArch})`}>
          <path d={tubeOutline(front, rr, 1.15, 0.12)} fill={rgba(C.gillDark, 0.55)} />
        </g>
      )}
    </g>
  );
};

// ================================================================ StomachFront
/** Optional: the stomach's translucent front wall over the swallowed eel (draw it after the eel's inside part and
 *  before the skin). Mode 'reveal' only (in the cutaway the stomach is outside the window: renders nothing). */
export const StomachFront: React.FC<{t: number; mode: InsideMode}> = ({mode}) => {
  if (mode === 'cut') return null;
  const g = uid('sfG'), cl = uid('sfC');
  return (
    <g>
      <defs>
        <radialGradient id={g} gradientUnits="userSpaceOnUse" cx={STOMACH.c.x - 1.5} cy={STOMACH.c.y - 0.8} r={STOMACH.rx * 1.02}>
          <stop offset="0" stopColor={C.stomach} stopOpacity={0.12} />
          <stop offset="0.62" stopColor={C.stomach} stopOpacity={0.22} />
          <stop offset="0.9" stopColor={C.stomachWall} stopOpacity={0.55} />
          <stop offset="1" stopColor={C.stomachWall} stopOpacity={0.75} />
        </radialGradient>
        <clipPath id={cl}>
          <path d={STOMACH_D} />
        </clipPath>
      </defs>
      <path d={STOMACH_D} fill={`url(#${g})`} />
      <g clipPath={`url(#${cl})`}>
        {/* wall folds (rugae) and a soft gloss from the upper left */}
        <path
          d={open([pt(-12, 0.2), pt(-6, -0.9), pt(1, -0.8), pt(7, 0.9)]) + open([pt(-14, 6.3), pt(-11, 9.3), pt(-5, 10.9), pt(2, 10.8), pt(7.5, 8.8)])}
          fill="none" stroke={rgba(lit(C.stomach, 0.45), 0.5)} strokeWidth={1.4} vectorEffect={NS} strokeLinecap="round"
        />
        <ellipse cx={STOMACH.c.x - 5.2} cy={STOMACH.c.y - 3.6} rx={4.2} ry={1.1} transform={`rotate(-14 ${n4(STOMACH.c.x - 5.2)} ${n4(STOMACH.c.y - 3.6)})`} fill="#FFFFFF" opacity={0.2} />
      </g>
      <path d={STOMACH_D} fill="none" stroke={rgba(INK, 0.42)} strokeWidth={1.5} vectorEffect={NS} />
    </g>
  );
};

// ================================================================ CutEdge
/** The cut faces of the window: the skin's thin lip all round, and the wall's cut face (skin + muscle; thin along the
 *  gill cover strip, thicker into the head) that the yaw reveals along the window's rear edge, its visible width
 *  growing with tan ψ. Draw it in the SAME slice transform as the masked exterior (yawMatrix(CUT_Z, yaw)), right
 *  after the exterior and before the outside eel. `yaw` in radians; `opacity` for the cutaway's fade. */
export const CutEdge: React.FC<{yaw: number; opacity?: number}> = ({yaw, opacity = 1}) => {
  const tn = Math.tan(yaw);
  const LIP = 0.2;
  // inner lip of the face: the window inset by the lip, slid by the wall thickness (projected into this slice)
  const inner = CUT_WINDOW_PTS.map((p, i) => add(p, add(mul(WIN_IN[i], LIP), pt(-WIN_THICK[i] * tn, 0))));
  const midL = CUT_WINDOW_PTS.map((p, i) => add(p, add(mul(WIN_IN[i], LIP), pt(-WIN_THICK[i] * tn * 0.38, 0))));
  const innerD = closed(inner), midD = closed(midL);
  const lipD = closed(CUT_WINDOW_PTS.map((p, i) => add(p, mul(WIN_IN[i], LIP))));
  const cW = uid('ceW'), cF = uid('ceF'), cI = uid('ceI');
  const show = Math.abs(tn) > 0.004;
  return (
    <g opacity={opacity}>
      <defs>
        <clipPath id={cW}>
          <path d={CUT_WINDOW} />
        </clipPath>
        <clipPath id={cF}>
          <path d={CUT_WINDOW + innerD} clipRule="evenodd" />
        </clipPath>
        <clipPath id={cI}>
          <path d={innerD} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${cW})`}>
        {/* the interior's occlusion just inside the cut (the wall overhangs the cavity) */}
        <g clipPath={`url(#${cI})`}>
          <path d={innerD} fill="none" stroke={rgba(C.gillDark, 0.32)} strokeWidth={1.5} />
          <path d={innerD} fill="none" stroke={rgba(C.gillDark, 0.3)} strokeWidth={0.6} />
        </g>
        {show && (
          <g clipPath={`url(#${cF})`}>
            <path d={CUT_WINDOW} fill={C.cutFace} />
            {/* the muscle under the skin and fat, a shade deeper toward the inside */}
            <path d={midD} fill="none" stroke={rgba(C.fleshDeep, 0.55)} strokeWidth={1.1} vectorEffect={NS} />
            <path d={innerD} fill="none" stroke={rgba(C.fleshDeep, 0.6)} strokeWidth={0.36} />
          </g>
        )}
        {/* the skin's own thickness: a dark lip just inside the window's edge, catching a thin highlight */}
        <path d={CUT_WINDOW} fill="none" stroke={C.fishDark} strokeWidth={LIP * 2} />
        <path d={lipD} fill="none" stroke={rgba(lit(C.cutFace, 0.3), 0.9)} strokeWidth={1.2} vectorEffect={NS} />
        {show && <path d={innerD} fill="none" stroke={rgba(INK, 0.6)} strokeWidth={1.3} vectorEffect={NS} />}
      </g>
      <path d={CUT_WINDOW} fill="none" stroke={INK} strokeWidth={INK_PX} vectorEffect={NS} strokeLinejoin="round" />
    </g>
  );
};
