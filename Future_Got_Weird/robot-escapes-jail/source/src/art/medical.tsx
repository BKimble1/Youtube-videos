// Medical-application visuals (S7): a stylised, clearly-artificial STOMACH MODEL (glassy coral silicone lab model:
// oesophagus entry top-left, J-shaped body, pylorus + duodenum stub, flat cut ends), the ROUTE through it (the S6
// field line, bent into the stomach), the tiny phase-changing DEVICE (a silver nub of the same liquid metal, with the
// robot's small cyan eyes), the FOREIGN OBJECT (a small blue bead, as in the 2023 lab demo), an outside bar MAGNET
// with field lines to the device (cause -> effect), and the GHOST human outline (dotted, translucent: a hypothetical
// "FUTURE IDEA", never a procedure).
//
// Geometry lives in MODEL space (px of the shot's opening frame: at the S6 -> S7 cut the camera is the identity, so
// the route's lower segment IS the S6 field line FIELD_PATH). The shot maps model -> screen with a similarity
// camera (Cam2) and every component draws in SCREEN space (constant ink widths, no scaled strokes).
// Every SVG id comes from uid(). Pure functions of their props.
import React from 'react';
import {C, INK, INK_PX} from './palette';
import {uid} from '../core/ids';
import {mix, rgba} from '../core/color';
import {clamp, hash, lerp, noise1, ss} from '../lib';
import {LiquidMetal, smoothPath, V} from './liquid';
import {FONT} from './science';

const f1 = (n: number) => (Math.abs(n) < 1e-4 ? '0' : n.toFixed(1));

// =====================================================================================================================
// CAMERA (model -> screen similarity: screen = O + k (p - F))
// =====================================================================================================================
export type Cam2 = {k: number; F: V; O: V};
export const CAM_ID: Cam2 = {k: 1, F: {x: 540, y: 980}, O: {x: 540, y: 980}};
export const camPt = (c: Cam2, p: V): V => ({x: c.O.x + c.k * (p.x - c.F.x), y: c.O.y + c.k * (p.y - c.F.y)});
export const camPts = (c: Cam2, ps: V[]) => ps.map((p) => camPt(c, p));
/** blend two cameras: zoom in log space, focus linear */
export const lerpCam2 = (a: Cam2, b: Cam2, u: number): Cam2 => ({
  k: Math.exp(lerp(Math.log(a.k), Math.log(b.k), u)),
  F: {x: lerp(a.F.x, b.F.x, u), y: lerp(a.F.y, b.F.y, u)},
  O: {x: lerp(a.O.x, b.O.x, u), y: lerp(a.O.y, b.O.y, u)},
});

// =====================================================================================================================
// ROUTE (oesophagus top -> cardia -> body -> greater-curvature bottom -> antrum -> pylorus), 3 cubic segments
// =====================================================================================================================
export type Bez = [V, V, V, V];
const P = (x: number, y: number): V => ({x, y});
export const bezPt = (b: Bez, u: number): V => {
  const m = 1 - u;
  const a = m * m * m, bb = 3 * m * m * u, c = 3 * m * u * u, d = u * u * u;
  return {x: a * b[0].x + bb * b[1].x + c * b[2].x + d * b[3].x, y: a * b[0].y + bb * b[1].y + c * b[2].y + d * b[3].y};
};
/** the S6 field line (FIELD_PATH) as the route's lower segment, written in route order (its end (930,960) first) */
export const SEG2_FIELD: Bez = [P(930, 960), P(700, 1300), P(360, 1220), P(150, 1420)];
/** the final route through the model */
export const ROUTE: Bez[] = [
  [P(772, 392), P(774, 520), P(800, 600), P(850, 660)], // oesophagus -> cardia
  [P(850, 660), P(905, 705), P(983, 840), P(930, 960)], // cardia -> body
  [P(930, 960), P(740, 1390), P(330, 1450), P(200, 1290)], // body -> bottom -> antrum -> pylorus
];
/** route with the lower segment morphing from the field line (m = 0) to its stomach shape (m = 1) */
export const routeAt = (m: number): Bez[] => {
  const u = clamp(m);
  const s2 = SEG2_FIELD.map((p, i) => ({x: lerp(p.x, ROUTE[2][i].x, u), y: lerp(p.y, ROUTE[2][i].y, u)})) as Bez;
  return [ROUTE[0], ROUTE[1], s2];
};
export type Poly = {pts: V[]; L: number[]; total: number};
export const samplePoly = (segs: Bez[], n = 60): Poly => {
  const pts: V[] = [];
  segs.forEach((b, si) => {
    for (let i = si === 0 ? 0 : 1; i <= n; i++) pts.push(bezPt(b, i / n));
  });
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return {pts, L, total: L[L.length - 1]};
};
/** point + unit tangent at arc fraction s (clamped; s < 0 / > 1 extrapolate straight along the end tangents) */
export const polyAt = (pl: Poly, s: number): {p: V; tan: V} => {
  const n = pl.pts.length;
  const tanAt = (i: number) => {
    const a = pl.pts[Math.max(0, i - 1)], b = pl.pts[Math.min(n - 1, i + 1)];
    const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    return {x: (b.x - a.x) / l, y: (b.y - a.y) / l};
  };
  if (s <= 0) {
    const t0 = tanAt(0);
    const d = s * pl.total;
    return {p: {x: pl.pts[0].x + t0.x * d, y: pl.pts[0].y + t0.y * d}, tan: t0};
  }
  if (s >= 1) {
    const t1 = tanAt(n - 1);
    const d = (s - 1) * pl.total;
    return {p: {x: pl.pts[n - 1].x + t1.x * d, y: pl.pts[n - 1].y + t1.y * d}, tan: t1};
  }
  const target = s * pl.total;
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (pl.L[mid] < target) lo = mid;
    else hi = mid;
  }
  const seg = pl.L[hi] - pl.L[lo] || 1;
  const u = (target - pl.L[lo]) / seg;
  const a = pl.pts[lo], b = pl.pts[hi];
  const ta = tanAt(lo), tb = tanAt(hi);
  const tx = lerp(ta.x, tb.x, u), ty = lerp(ta.y, tb.y, u);
  const tl = Math.hypot(tx, ty) || 1;
  return {p: {x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u)}, tan: {x: tx / tl, y: ty / tl}};
};
export const ROUTE_POLY = samplePoly(ROUTE);
/** arc fraction of the route point nearest to p */
export const nearestS = (pl: Poly, p: V) => {
  let best = 0, bd = Infinity;
  pl.pts.forEach((q, i) => {
    const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
    if (d < bd) {
      bd = d;
      best = i;
    }
  });
  return pl.L[best] / pl.total;
};
/** arc fraction where segment i starts (final route) */
export const SEG_S = (() => {
  const l = ROUTE.map((b) => samplePoly([b]).total);
  const tot = l.reduce((a, b) => a + b, 0);
  return [0, l[0] / tot, (l[0] + l[1]) / tot, 1];
})();

const bezD = (b: Bez, start = true) =>
  `${start ? `M${f1(b[0].x)},${f1(b[0].y)}` : ''}C${f1(b[1].x)},${f1(b[1].y)} ${f1(b[2].x)},${f1(b[2].y)} ${f1(b[3].x)},${f1(b[3].y)}`;
const revBez = (b: Bez): Bez => [b[3], b[2], b[1], b[0]];
const mapBez = (c: Cam2, b: Bez): Bez => b.map((p) => camPt(c, p)) as Bez;

/** The route line (the S6 field line, same recipe as science.tsx FieldLine: glow width 22 / opacity 0.85 / blur 9
 *  under a 12 px C.field stroke, round caps) in screen space. At m = 0, up = 0, k = 1 it is pixel-identical to the
 *  S6 hand-off. up = draw-on of the upper part (body -> cardia -> oesophagus, growing upward from the line's end),
 *  w = width scale, pulse = travelling light dashes in the device direction. */
export const RouteLine: React.FC<{cam: Cam2; m: number; up: number; w: number; opacity?: number; pulse?: number; t: number}> = ({cam, m, up, w, opacity = 1, pulse = 0, t}) => {
  if (opacity <= 0.002) return null;
  const segs = routeAt(m).map((b) => mapBez(cam, b));
  const lower = bezD(revBez(segs[2])); // FIELD_PATH direction (150,1420) -> (930,960), as S6 draws it
  const upper = bezD(revBez(segs[1])) + bezD(revBez(segs[0]), false);
  const all = bezD(segs[0]) + bezD(segs[1], false) + bezD(segs[2], false);
  const pts = segs.flat();
  const x0 = Math.min(...pts.map((p) => p.x)) - 70, x1 = Math.max(...pts.map((p) => p.x)) + 70;
  const y0 = Math.min(...pts.map((p) => p.y)) - 70, y1 = Math.max(...pts.map((p) => p.y)) + 70;
  const id = uid('rtg');
  const u = clamp(up);
  const L = 1000;
  const glowW = 22 * w, lineW = 12 * w;
  const upDash = u >= 0.9995 ? undefined : `${f1(u * L)} ${L * 3}`;
  const stroke = (d: string, sw: number, col: string, op: number, filt?: string, dash?: string) => (
    <path d={d} fill="none" stroke={col} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" opacity={op} filter={filt} pathLength={L} strokeDasharray={dash} />
  );
  return (
    <g opacity={opacity}>
      <defs>
        <filter id={id} filterUnits="userSpaceOnUse" x={f1(x0)} y={f1(y0)} width={f1(x1 - x0)} height={f1(y1 - y0)}>
          <feGaussianBlur stdDeviation={f1(9 * w)} />
        </filter>
      </defs>
      {stroke(lower, glowW, C.field, 0.85, `url(#${id})`)}
      {u > 0.001 && stroke(upper, glowW, C.field, 0.85, `url(#${id})`, upDash)}
      {stroke(lower, lineW, C.field, 1)}
      {u > 0.001 && stroke(upper, lineW, C.field, 1, undefined, upDash)}
      {pulse > 0.01 && (
        <path d={u >= 0.9995 ? all : lower} fill="none" stroke="#E8FBFF" strokeWidth={Math.max(2, 5 * w)} strokeLinecap="round" pathLength={L} strokeDasharray="18 70" strokeDashoffset={f1(-t * 120)} opacity={pulse * 0.8} />
      )}
    </g>
  );
};

// =====================================================================================================================
// STOMACH MODEL (outline in model space, clockwise from the oesophagus top-left)
// =====================================================================================================================
export const STOMACH: V[] = [
  // oesophagus left wall (down)
  P(716, 400), P(717, 470), P(724, 545), P(742, 610), P(772, 668),
  // lesser curvature (inner, down to the angular incisure, then along the antrum's upper wall)
  P(808, 742), P(822, 836), P(812, 930), P(778, 1036), P(718, 1120), P(636, 1186), P(540, 1228), P(440, 1248), P(345, 1243),
  P(268, 1222),
  // pylorus (narrow) + duodenum stub (cut end)
  P(226, 1206), P(186, 1178), P(150, 1150), P(118, 1124), P(90, 1150), P(80, 1190), P(92, 1226), P(126, 1250), P(160, 1282),
  P(186, 1318),
  // greater curvature (outer: bottom, right side, up to the fundus dome)
  P(222, 1378), P(290, 1438), P(386, 1482), P(500, 1500), P(618, 1484), P(736, 1436), P(842, 1356), P(930, 1250), P(1000, 1128),
  P(1046, 990), P(1068, 850), P(1072, 728), P(1050, 628), P(1000, 562), P(938, 536), P(880, 552),
  // cardiac notch, oesophagus right wall (up)
  P(846, 590), P(832, 540), P(828, 470), P(828, 400),
];
/** the open ends of the model (cut tube rims): centre, radius along, radius across, angle (deg) */
export const RIM_TOP = {c: P(772, 400), rx: 56, ry: 17, ang: 0};
export const RIM_DUO = {c: P(104, 1188), rx: 46, ry: 15, ang: -55};

/** per outline point: the arc fraction of its nearest final-route point (for the inflate-from-the-line build) */
export const STOMACH_S = STOMACH.map((p) => nearestS(ROUTE_POLY, p));

/** the model's outline (and inner cavity outline) in screen space for a given build state; gAvg = mean inflation */
export const stomachPts = (cam: Cam2, grow: (s: number) => number, m: number, pl: Poly = samplePoly(routeAt(m), 40), tip = 0) => {
  const tipP = polyAt(pl, tip).p;
  const pts: V[] = [], inner: V[] = [];
  let gsum = 0;
  STOMACH.forEach((q, i) => {
    const s = STOMACH_S[i];
    const g = clamp(grow(s));
    gsum += g;
    const onRoute = polyAt(pl, s).p;
    // the final model point relative to the FINAL route point, carried by the morphing route point
    const fin = polyAt(ROUTE_POLY, s).p;
    const full = {x: onRoute.x + (q.x - fin.x), y: onRoute.y + (q.y - fin.y)};
    // not-yet-drawn route (s < tip): collapsed onto the drawn tip, not onto the invisible route
    const base = s < tip ? tipP : onRoute;
    pts.push(camPt(cam, {x: lerp(base.x, full.x, g), y: lerp(base.y, full.y, g)}));
    inner.push(camPt(cam, {x: lerp(base.x, full.x, g * 0.8), y: lerp(base.y, full.y, g * 0.8)}));
  });
  return {pts, inner, gAvg: gsum / STOMACH.length};
};
/** smooth closed path of the model's outline in screen space (for clipping contents to the model) */
export const stomachD = (cam: Cam2, grow: (s: number) => number, m: number, tip = 0) => smoothPath(stomachPts(cam, grow, m, undefined, tip).pts, 1);

/** The model. grow(s) = 0..1 inflation of the wall around route fraction s (0 = collapsed on the line);
 *  m = current route morph (the walls ride on the morphing line while they inflate). */
export const StomachModel: React.FC<{cam: Cam2; grow: (s: number) => number; m: number; t: number; opacity?: number; layer: 'back' | 'front'; tip?: number}> = ({
  cam, grow, m, t, opacity = 1, layer, tip = 0,
}) => {
  if (opacity <= 0.002) return null;
  const pl = samplePoly(routeAt(m), 40);
  const {pts, inner, gAvg} = stomachPts(cam, grow, m, pl, tip);
  if (gAvg < 0.004) return null;
  const d = smoothPath(pts, 1);
  const di = smoothPath(inner, 1);
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const bx0 = Math.min(...xs), bx1 = Math.max(...xs), by0 = Math.min(...ys), by1 = Math.max(...ys);
  const op = opacity * clamp(gAvg * 3);
  const k = cam.k;
  if (layer === 'back') {
    const idF = uid('stF'), idI = uid('stI'), idC = uid('stC');
    return (
      <g opacity={op}>
        <defs>
          <linearGradient id={idF} gradientUnits="userSpaceOnUse" x1={f1(bx0)} y1={f1(by0)} x2={f1(bx1)} y2={f1(by1)}>
            <stop offset="0" stopColor={C.stomachLit} />
            <stop offset="0.45" stopColor={C.stomach} />
            <stop offset="1" stopColor={C.stomachDeep} />
          </linearGradient>
          <linearGradient id={idI} gradientUnits="userSpaceOnUse" x1={f1(bx0)} y1={f1(by0)} x2={f1(bx1)} y2={f1(by1)}>
            <stop offset="0" stopColor={mix(C.stomachIn, C.navy3, 0.35)} />
            <stop offset="1" stopColor={mix(C.stomachDeep, C.navy2, 0.45)} />
          </linearGradient>
          <clipPath id={idC}>
            <path d={d} />
          </clipPath>
        </defs>
        {/* soft drop shadow (the model floats over the navy) */}
        <path d={d} fill={C.navy0} opacity={0.45} transform={`translate(${f1(10 * k)} ${f1(16 * k)})`} />
        {/* silicone wall */}
        <path d={d} fill={`url(#${idF})`} />
        {/* the hollow inside (seen through the translucent front wall) */}
        <path d={di} fill={`url(#${idI})`} opacity={0.82} />
        <g clipPath={`url(#${idC})`}>
          {/* inner rim light: the wall's thickness reads as a bright band hugging the cavity */}
          <path d={di} fill="none" stroke={C.stomachLit} strokeWidth={Math.max(1.5, 5 * k)} opacity={0.55} />
        </g>
      </g>
    );
  }
  // FRONT: glassy front wall over the contents: sheen, gloss streaks, cut rims, ink contour
  const idS = uid('stS'), idC2 = uid('stK');
  const rim = (r: typeof RIM_TOP, key: string) => {
    const s = nearestS(ROUTE_POLY, r.c);
    const base = polyAt(pl, Math.max(s, tip)).p, fin = polyAt(ROUTE_POLY, s).p;
    const g = clamp(grow(s));
    const c = camPt(cam, {x: base.x + (r.c.x - fin.x) * g, y: base.y + (r.c.y - fin.y) * g});
    if (g < 0.05) return null;
    return (
      <g key={key} transform={`translate(${f1(c.x)} ${f1(c.y)}) rotate(${r.ang})`} opacity={clamp(g * 1.5)}>
        <ellipse rx={f1(r.rx * k * g)} ry={f1(r.ry * k * g)} fill={mix(C.stomachDeep, C.navy1, 0.45)} stroke={INK} strokeWidth={2} />
        <ellipse rx={f1(r.rx * k * g * 0.72)} ry={f1(r.ry * k * g * 0.62)} fill={mix(C.stomachDeep, C.navy0, 0.65)} />
        <path d={`M${f1(-r.rx * k * g * 0.9)},${f1(-r.ry * k * g * 0.2)} A${f1(r.rx * k * g)},${f1(r.ry * k * g)} 0 0 1 ${f1(r.rx * k * g * 0.3)},${f1(-r.ry * k * g * 0.98)}`} fill="none" stroke="#FFFFFF" strokeWidth={2} opacity={0.6} strokeLinecap="round" />
      </g>
    );
  };
  // gloss streaks along the upper-left of the fundus / body and the bottom bulge (model-space curves)
  const gloss = (ps: V[], w: number, o: number, key: string) => (
    <path key={key} d={'M' + camPts(cam, ps).map((p) => `${f1(p.x)},${f1(p.y)}`).join('L')} fill="none" stroke="#FFFFFF" strokeWidth={Math.max(1.2, w * k)} strokeLinecap="round" strokeLinejoin="round" opacity={o * clamp(gAvg * 1.4 - 0.4)} />
  );
  const tw = 0.85 + 0.15 * Math.sin(t * 1.7);
  return (
    <g opacity={op}>
      <defs>
        <linearGradient id={idS} gradientUnits="userSpaceOnUse" x1={f1(bx0)} y1={f1(by0)} x2={f1(bx0 + (bx1 - bx0) * 0.7)} y2={f1(by1)}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.32} />
          <stop offset="0.35" stopColor="#FFFFFF" stopOpacity={0.06} />
          <stop offset="0.7" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="1" stopColor={C.navy0} stopOpacity={0.16} />
        </linearGradient>
        <clipPath id={idC2}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill={`url(#${idS})`} />
      <g clipPath={`url(#${idC2})`}>
        {gloss(sampleCurve([P(905, 585), P(960, 572), P(1012, 600), P(1040, 660)]), 10, 0.75 * tw, 'g1')}
        {gloss(sampleCurve([P(1044, 760), P(1040, 880), P(1018, 980)]), 7, 0.5, 'g2')}
        {gloss(sampleCurve([P(300, 1420), P(400, 1460), P(500, 1472)]), 6, 0.35, 'g3')}
        {gloss(sampleCurve([P(746, 470), P(748, 560), P(762, 615)]), 6, 0.5, 'g4')}
      </g>
      <path d={d} fill="none" stroke={INK} strokeWidth={INK_PX} strokeLinejoin="round" />
      {rim(RIM_TOP, 'rt')}
      {rim(RIM_DUO, 'rd')}
    </g>
  );
};
/** Catmull-Rom polyline through a few model points (open) */
const sampleCurve = (ps: V[], n = 8): V[] => {
  const out: V[] = [];
  for (let i = 0; i < ps.length - 1; i++) {
    const p0 = ps[Math.max(0, i - 1)], p1 = ps[i], p2 = ps[i + 1], p3 = ps[Math.min(ps.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const u = k / n, u2 = u * u, u3 = u2 * u;
      out.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * u + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * u + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3),
      });
    }
  }
  out.push(ps[ps.length - 1]);
  return out;
};

// =====================================================================================================================
// FOREIGN OBJECT: a small blue bead (screen space)
// =====================================================================================================================
export const BEAD = {c: P(352, 1430), r: 25};
export const Bead: React.FC<{c: V; r: number; window?: number; opacity?: number}> = ({c, r, window = 1, opacity = 1}) => {
  if (opacity <= 0.002 || r < 0.5) return null;
  const idG = uid('bdG'), idC = uid('bdC');
  const w = clamp(window);
  return (
    <g opacity={opacity}>
      <defs>
        <radialGradient id={idG} gradientUnits="userSpaceOnUse" cx={f1(c.x - r * 0.35)} cy={f1(c.y - r * 0.4)} r={f1(r * 1.5)}>
          <stop offset="0" stopColor={mix(C.object, '#FFFFFF', 0.55)} />
          <stop offset="0.45" stopColor={C.object} />
          <stop offset="1" stopColor={mix(C.object, C.navy0, 0.55)} />
        </radialGradient>
        {w < 0.999 && (
          <clipPath id={idC}>
            <circle cx={f1(c.x)} cy={f1(c.y - r * 0.08)} r={f1(r * w)} />
          </clipPath>
        )}
      </defs>
      <g clipPath={w < 0.999 ? `url(#${idC})` : undefined}>
        <circle cx={f1(c.x)} cy={f1(c.y)} r={f1(r)} fill={`url(#${idG})`} stroke={INK} strokeWidth={2.2} />
        <ellipse cx={f1(c.x - r * 0.35)} cy={f1(c.y - r * 0.42)} rx={f1(r * 0.28)} ry={f1(r * 0.18)} fill="#FFFFFF" opacity={0.85} transform={`rotate(-30 ${f1(c.x - r * 0.35)} ${f1(c.y - r * 0.42)})`} />
      </g>
      {w < 0.999 && (
        // the silver lip of the metal holding it (a socket)
        <circle cx={f1(c.x)} cy={f1(c.y - r * 0.08)} r={f1(r * w)} fill="none" stroke={C.silverLit} strokeWidth={Math.max(1.5, r * 0.16)} opacity={clamp((1 - w) * 4)} />
      )}
      {w < 0.999 && <circle cx={f1(c.x)} cy={f1(c.y - r * 0.08)} r={f1(r * w + Math.max(1, r * 0.08))} fill="none" stroke={INK} strokeWidth={1.4} opacity={clamp((1 - w) * 4) * 0.8} />}
    </g>
  );
};

// =====================================================================================================================
// THE DEVICE: a small nub of the same liquid metal (solid -> liquid -> solid), with the robot's small eyes
// =====================================================================================================================
/** device outline in screen px. solid: a rounded gumdrop (w x h) with a motion stretch along dir; liquid: a low
 *  wobbling puddle (rx x ry) around pc; nub: the re-solidified, rounder nub around pc. melt, cool in 0..1. */
export const deviceOutline = (o: {
  c: V; w: number; h: number; dir: V; stretch: number; melt: number; cool: number; pc: V; prx: number; pry: number; nw: number; nh: number; t: number; n?: number;
}): V[] => {
  const n = o.n ?? 40;
  const out: V[] = [];
  const m = clamp(o.melt), cl = clamp(o.cool);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const ca = Math.cos(a), sa = Math.sin(a);
    // solid gumdrop: flatter bottom, domed top (superellipse-ish)
    const e = 2 / 3.2;
    const sx = Math.sign(ca) * Math.abs(ca) ** e, sy = Math.sign(sa) * Math.abs(sa) ** (sa > 0 ? 0.7 : 1);
    let px = sx * o.w * 0.5, py = sy * o.h * 0.5;
    // motion stretch along dir
    const dl = Math.hypot(o.dir.x, o.dir.y) || 1;
    const ux = o.dir.x / dl, uy = o.dir.y / dl;
    const along = px * ux + py * uy, across = -px * uy + py * ux;
    const st = 1 + o.stretch;
    const al = along * st, ac = across / Math.sqrt(st);
    px = al * ux - ac * uy;
    py = al * uy + ac * ux;
    const solid = {x: o.c.x + px, y: o.c.y + py};
    // liquid puddle
    const wob = 1 + 0.08 * Math.sin(2 * a + o.t * 5.2) + 0.06 * Math.sin(3 * a - o.t * 6.1) + 0.05 * noise1(a * 1.9 + o.t * 3.3, 7);
    const liq = {x: o.pc.x + ca * o.prx * wob, y: o.pc.y + (sa < 0 ? sa * o.pry * 1.15 : sa * o.pry * 0.75) * wob};
    // re-solidified nub (rounder, holds the bead)
    const nub = {x: o.pc.x + sx * o.nw * 0.5, y: o.pc.y + sy * o.nh * 0.5 - o.nh * 0.05};
    const a1 = {x: lerp(solid.x, liq.x, m), y: lerp(solid.y, liq.y, m)};
    out.push({x: lerp(a1.x, nub.x, cl), y: lerp(a1.y, nub.y, cl)});
  }
  return out;
};

/** the solid finish over the device (crisp gloss + rim), fading while it is liquid */
export const DeviceGloss: React.FC<{c: V; w: number; h: number; k: number; opacity: number}> = ({c, w, h, k, opacity}) => {
  if (opacity <= 0.01) return null;
  return (
    <g opacity={opacity}>
      <path d={`M${f1(c.x - w * 0.3)},${f1(c.y - h * 0.18)} Q${f1(c.x - w * 0.18)},${f1(c.y - h * 0.4)} ${f1(c.x + w * 0.08)},${f1(c.y - h * 0.38)}`} fill="none" stroke="#FFFFFF" strokeWidth={Math.max(1.5, k * 5)} strokeLinecap="round" opacity={0.92} />
      <circle cx={f1(c.x + w * 0.22)} cy={f1(c.y - h * 0.3)} r={f1(Math.max(1, k * 2.4))} fill="#FFFFFF" opacity={0.85} />
    </g>
  );
};

export const Device: React.FC<{
  pts: V[]; t: number; k: number; heat: number; ripple: number; gloss: {c: V; w: number; h: number; on: number};
  eyes: {c: V; s: number; open: number; lookX: number; lookY: number; mood: number; glow: number} | null; cool: number; opacity?: number;
}> = ({pts, t, k, heat, ripple, gloss, eyes, cool, opacity = 1}) => {
  if (opacity <= 0.002) return null;
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const bx0 = Math.min(...xs), bx1 = Math.max(...xs), by0 = Math.min(...ys), by1 = Math.max(...ys);
  const idM = uid('dvM'), idI = uid('dvI');
  const cl = clamp(cool);
  // cool shimmer: an ice-blue band sweeping up across the metal as it freezes
  const band = by1 - (by1 - by0 + 40) * clamp(cl * 1.15) + 20;
  return (
    <g opacity={opacity}>
      <LiquidMetal pts={[pts]} t={t} px={Math.max(6, 26 * k)} heat={heat} ripple={ripple} />
      {cl > 0.001 && cl < 0.999 && (
        <g>
          <defs>
            <clipPath id={idM}>
              <path d={smoothPath(pts)} />
            </clipPath>
            <linearGradient id={idI} gradientUnits="userSpaceOnUse" x1="0" y1={f1(band - 26)} x2="0" y2={f1(band + 26)}>
              <stop offset="0" stopColor={C.ice} stopOpacity={0} />
              <stop offset="0.5" stopColor={C.ice} stopOpacity={0.85} />
              <stop offset="1" stopColor={C.ice} stopOpacity={0} />
            </linearGradient>
          </defs>
          <g clipPath={`url(#${idM})`}>
            <rect x={f1(bx0 - 4)} y={f1(band - 26)} width={f1(bx1 - bx0 + 8)} height={52} fill={`url(#${idI})`} opacity={Math.sin(Math.PI * cl)} />
          </g>
        </g>
      )}
      <DeviceGloss c={gloss.c} w={gloss.w} h={gloss.h} k={k} opacity={gloss.on} />
      {eyes && <EyesSmall {...eyes} />}
    </g>
  );
};
// small eyes: the robot's eye design, imported lazily to keep this module's API flat
import {RobotEyes} from './liquid';
const EyesSmall: React.FC<{c: V; s: number; open: number; lookX: number; lookY: number; mood: number; glow: number}> = (p) => <RobotEyes {...p} squash={1} />;

/** a sparkle (4-point star) for the "cools -> solid" moment */
export const Sparkle: React.FC<{c: V; r: number; a: number; color?: string}> = ({c, r, a, color = '#FFFFFF'}) => {
  if (a <= 0.01 || r < 0.5) return null;
  const q = r * 0.22;
  const d = `M${f1(c.x)},${f1(c.y - r)} Q${f1(c.x + q)},${f1(c.y - q)} ${f1(c.x + r)},${f1(c.y)} Q${f1(c.x + q)},${f1(c.y + q)} ${f1(c.x)},${f1(c.y + r)} Q${f1(c.x - q)},${f1(c.y + q)} ${f1(c.x - r)},${f1(c.y)} Q${f1(c.x - q)},${f1(c.y - q)} ${f1(c.x)},${f1(c.y - r)}Z`;
  return <path d={d} fill={color} opacity={a} />;
};

// =====================================================================================================================
// MAGNET (outside the model) + its field lines to the device
// =====================================================================================================================
/** compact bar magnet (red N / blue S, local +x = N), size scales with sc (letters too) */
export const SmallMagnet: React.FC<{c: V; ang: number; sc: number; opacity?: number}> = ({c, ang, sc, opacity = 1}) => {
  if (opacity <= 0.002) return null;
  const a = 84, b = 30, r = 10;
  const idN = uid('smN'), idS = uid('smS');
  const deg = (ang * 180) / Math.PI;
  const half = (s: 1 | -1, id: string) =>
    `M0,${-b} L${s * (a - r)},${-b} Q${s * a},${-b} ${s * a},${-b + r} L${s * a},${b - r} Q${s * a},${b} ${s * (a - r)},${b} L0,${b} Z`;
  return (
    <g opacity={opacity} transform={`translate(${f1(c.x)} ${f1(c.y)}) rotate(${f1(deg)}) scale(${sc.toFixed(4)})`}>
      <defs>
        <linearGradient id={idN} gradientUnits="userSpaceOnUse" x1="0" y1={-b} x2="0" y2={b}>
          <stop offset="0" stopColor="#FF8A86" />
          <stop offset="0.35" stopColor={C.north} />
          <stop offset="1" stopColor="#9E1F26" />
        </linearGradient>
        <linearGradient id={idS} gradientUnits="userSpaceOnUse" x1="0" y1={-b} x2="0" y2={b}>
          <stop offset="0" stopColor="#8DB3FF" />
          <stop offset="0.35" stopColor={C.south} />
          <stop offset="1" stopColor="#1E3F9A" />
        </linearGradient>
      </defs>
      <rect x={-a - 4} y={-b - 4} width={2 * a + 8} height={2 * b + 8} rx={r + 4} fill={INK} />
      <path d={half(1, idN)} fill={`url(#${idN})`} />
      <path d={half(-1, idS)} fill={`url(#${idS})`} />
      <line x1="0" x2="0" y1={-b} y2={b} stroke={INK} strokeWidth={3} />
      <path d={`M${-a + 12},${-b + 8} L${a - 12},${-b + 8}`} stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.55} />
      {([[1, 'N'], [-1, 'S']] as [number, string][]).map(([s, L]) => (
        <g key={L} transform={`translate(${s * a * 0.52} 0) rotate(${f1(-deg)})`}>
          <text x="0" y="0" dy="0.36em" textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={36} fill="#FFFFFF" stroke={INK} strokeWidth={5} paintOrder="stroke" strokeLinejoin="round">
            {L}
          </text>
        </g>
      ))}
    </g>
  );
};
export const MAG_HALF = 84; // half length of SmallMagnet at sc = 1

/** field lines from the magnet's facing pole to the device: a spindle of curves, flowing toward the magnet (pull) */
export const FieldBundle: React.FC<{a: V; b: V; spread: number; w: number; t: number; on: number}> = ({a, b, spread, w, t, on}) => {
  if (on <= 0.01) return null;
  const dx = b.x - a.x, dy = b.y - a.y;
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const mid = {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2};
  const lines = [-2, -1, 0, 1, 2].map((e) => {
    const s0 = e * spread * 0.14, s1 = e * spread * 0.1, sm = e * spread * 0.5;
    const p0 = {x: a.x + nx * s0, y: a.y + ny * s0}, p1 = {x: b.x + nx * s1, y: b.y + ny * s1};
    const cm = {x: mid.x + nx * sm, y: mid.y + ny * sm};
    return {d: `M${f1(p1.x)},${f1(p1.y)} Q${f1(cm.x)},${f1(cm.y)} ${f1(p0.x)},${f1(p0.y)}`, e};
  });
  return (
    <g opacity={on}>
      {lines.map((l) => (
        <g key={l.e} opacity={1 - Math.abs(l.e) * 0.22}>
          <path d={l.d} fill="none" stroke={C.field} strokeWidth={w * 1.8} strokeLinecap="round" opacity={0.25} />
          <path d={l.d} fill="none" stroke={C.field} strokeWidth={w} strokeLinecap="round" opacity={0.85} />
          <path d={l.d} fill="none" stroke="#E8FBFF" strokeWidth={Math.max(1, w * 0.55)} strokeLinecap="round" strokeDasharray={`${f1(w * 2.5)} ${f1(w * 7)}`} strokeDashoffset={f1(-t * w * 30)} opacity={0.9} />
        </g>
      ))}
    </g>
  );
};

// =====================================================================================================================
// GHOST HUMAN OUTLINE (hypothetical): dotted, translucent; model space, midline x = 600
// =====================================================================================================================
const TORSO_R: V[] = [
  // right half (screen-right), from the neck base down to the hip; mirrored for the left
  P(735, -700), P(738, -560), P(760, -500), P(900, -455), P(1080, -420), P(1240, -380), P(1360, -300), P(1430, -170),
  P(1450, 0), P(1440, 180), P(1400, 330), P(1352, 470), P(1340, 700), P(1320, 950), P(1280, 1200), P(1240, 1420), P(1250, 1650),
  P(1290, 1900), P(1320, 2150), P(1330, 2400),
];
export const TORSO_MID = 600;
export const HEAD = {c: P(600, -1000), rx: 285, ry: 345};
const torsoBody = (): V[] => {
  const right = sampleCurve(TORSO_R, 10);
  const left = right.map((p) => ({x: 2 * TORSO_MID - p.x, y: p.y})).reverse();
  return [...left, ...right];
};
const resample = (ps: V[], step: number): V[] => {
  const out: V[] = [ps[0]];
  let acc = 0;
  for (let i = 1; i < ps.length; i++) {
    const a = ps[i - 1], b = ps[i];
    const l = Math.hypot(b.x - a.x, b.y - a.y);
    let pos = step - acc;
    while (pos <= l) {
      const u = pos / l;
      out.push({x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u)});
      pos += step;
    }
    acc = (acc + l) % step;
    acc = l - (pos - step);
  }
  return out;
};
/** the ghost's dots (model space), with a per-dot "distance from the stomach" for the staggered draw-on */
export const GHOST_DOTS: {p: V; d: number; i: number}[] = (() => {
  const body = resample(torsoBody(), 62);
  const head: V[] = [];
  const nH = 46;
  for (let i = 0; i < nH; i++) {
    const a = (i / nH) * Math.PI * 2;
    head.push({x: HEAD.c.x + Math.cos(a) * HEAD.rx, y: HEAD.c.y + Math.sin(a) * HEAD.ry});
  }
  const sc = P(620, 1000);
  return [...body, ...head].map((p, i) => ({p, d: Math.hypot(p.x - sc.x, p.y - sc.y), i}));
})();
export const GHOST_BODY_PATH = (cam: Cam2) => {
  const ps = camPts(cam, sampleCurve(torsoBody().filter((_, i) => i % 2 === 0), 2));
  return 'M' + ps.map((p) => `${f1(p.x)},${f1(p.y)}`).join('L');
};

/** p = 0..1 draw-on (dots appear outward from the stomach), fill = translucent body tint 0..1, fadeY = screen y where
 *  the body fades out at the bottom */
export const GhostHuman: React.FC<{cam: Cam2; p: number; t: number; fadeY: number}> = ({cam, p, t, fadeY}) => {
  if (p <= 0.001) return null;
  const k = cam.k;
  const maxD = 3200;
  const idF = uid('ghF'), idG = uid('ghG'), idM = uid('ghM');
  const bodyD = (() => {
    const ps = camPts(cam, torsoBody());
    return smoothPath(ps.concat([{x: ps[ps.length - 1].x, y: ps[ps.length - 1].y + 400}, {x: ps[0].x, y: ps[0].y + 400}]), 1);
  })();
  const hc = camPt(cam, HEAD.c);
  const fillOp = 0.16 * ss(p, 0.25, 0.9);
  return (
    <g>
      <defs>
        <linearGradient id={idF} gradientUnits="userSpaceOnUse" x1="0" y1={f1(fadeY - 420)} x2="0" y2={f1(fadeY)}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        <mask id={idM} maskUnits="userSpaceOnUse" x="0" y="0" width="1080" height="1920">
          <rect x="0" y="0" width="1080" height="1920" fill={`url(#${idF})`} />
        </mask>
        <radialGradient id={idG} gradientUnits="userSpaceOnUse" cx={f1(camPt(cam, P(620, 900)).x)} cy={f1(camPt(cam, P(620, 900)).y)} r={f1(2200 * k)}>
          <stop offset="0" stopColor={C.field} stopOpacity={0.55} />
          <stop offset="1" stopColor={C.fieldDeep} stopOpacity={0.15} />
        </radialGradient>
      </defs>
      <g mask={`url(#${idM})`}>
        <path d={bodyD} fill={`url(#${idG})`} opacity={fillOp} />
        <ellipse cx={f1(hc.x)} cy={f1(hc.y)} rx={f1(HEAD.rx * k)} ry={f1(HEAD.ry * k)} fill={`url(#${idG})`} opacity={fillOp} />
        {GHOST_DOTS.map(({p: q, d, i}) => {
          const a = clamp((p * (maxD + 900) - d) / 900);
          if (a <= 0.01) return null;
          const s = camPt(cam, q);
          const tw = 0.75 + 0.25 * Math.sin(t * 3.1 + hash(i) * 6.28);
          return <circle key={i} cx={f1(s.x)} cy={f1(s.y)} r={f1(Math.max(2.2, 15 * k) * (0.6 + 0.4 * a))} fill={mix(C.field, '#FFFFFF', 0.45)} opacity={a * tw * 0.95} />;
        })}
      </g>
    </g>
  );
};

// =====================================================================================================================
// LABELS (≤ 4 words, Nunito 900): a solid tag (research demo) and a dashed ghost tag (future idea)
// =====================================================================================================================
const backOut = (x: number) => {
  const c1 = 1.9, c3 = c1 + 1;
  const u = clamp(x);
  return 1 + c3 * (u - 1) ** 3 + c1 * (u - 1) ** 2;
};
/** text with the caption treatment (dark stroke), popping in (p 0..1) about its own centre */
export const MedText: React.FC<{x: number; y: number; text: string; size: number; color?: string; p: number; opacity?: number; anchor?: 'start' | 'middle' | 'end'}> = ({
  x, y, text, size, color = '#FFFFFF', p, opacity = 1, anchor = 'middle',
}) => {
  if (p <= 0.001 || opacity <= 0.002) return null;
  const sc = 0.7 + 0.3 * backOut(p);
  return (
    <g opacity={clamp(p * 2.5) * opacity} transform={`translate(${f1(x)} ${f1(y)}) scale(${sc.toFixed(3)})`}>
      <text x="0" y="0" dy="0.36em" textAnchor={anchor} fontFamily={FONT} fontWeight={900} fontSize={size} fill={color} stroke="rgba(6,10,18,0.92)" strokeWidth={Math.max(6, size * 0.17)} strokeLinejoin="round" paintOrder="stroke" letterSpacing="0.01em">
        {text}
      </text>
    </g>
  );
};
/** a pill tag: solid (LAB DEMO) or dashed ghost (FUTURE IDEA) */
export const MedTag: React.FC<{x: number; y: number; w: number; h: number; text: string; size: number; p: number; opacity?: number; ghost?: boolean; t?: number}> = ({
  x, y, w, h, text, size, p, opacity = 1, ghost = false, t = 0,
}) => {
  if (p <= 0.001 || opacity <= 0.002) return null;
  const sc = 0.7 + 0.3 * backOut(p);
  const a = clamp(p * 2.5) * opacity;
  return (
    <g opacity={a} transform={`translate(${f1(x)} ${f1(y)}) scale(${sc.toFixed(3)})`}>
      {ghost ? (
        <>
          <rect x={f1(-w / 2)} y={f1(-h / 2)} width={f1(w)} height={f1(h)} rx={f1(h / 2)} fill={rgba(C.navy0, 0.55)} />
          <rect x={f1(-w / 2)} y={f1(-h / 2)} width={f1(w)} height={f1(h)} rx={f1(h / 2)} fill="none" stroke={C.yellow} strokeWidth={4} strokeDasharray="2 12" strokeLinecap="round" strokeDashoffset={f1(-t * 14)} />
          <text x="0" y="0" dy="0.36em" textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} fill={C.yellow} letterSpacing="0.03em">
            {text}
          </text>
        </>
      ) : (
        <>
          <rect x={f1(-w / 2 - 3)} y={f1(-h / 2 - 3)} width={f1(w + 6)} height={f1(h + 6)} rx={f1(h / 2 + 3)} fill={INK} />
          <rect x={f1(-w / 2)} y={f1(-h / 2)} width={f1(w)} height={f1(h)} rx={f1(h / 2)} fill={C.yellow} />
          <rect x={f1(-w / 2 + 8)} y={f1(-h / 2 + 4)} width={f1(w - 16)} height={f1(h * 0.28)} rx={f1(h * 0.14)} fill="#FFFFFF" opacity={0.35} />
          <text x="0" y="0" dy="0.36em" textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} fill={INK} letterSpacing="0.03em">
            {text}
          </text>
        </>
      )}
    </g>
  );
};
export {rgba, INK};
