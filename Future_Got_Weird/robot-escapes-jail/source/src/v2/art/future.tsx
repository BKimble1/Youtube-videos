// FU art (owner D): the "technology becomes stranger -> real-world implications" props, all drawn in SCREEN space
// through a 2D similarity camera (Cam2: screen = O + k (p - F)), constant on-screen ink widths.
//
//   World A (beat 1, top-down lab mat): MatTop (grid mat), ChannelBlock (a clear acrylic block with a narrow S channel
//     milled into it and a funnel mouth), Magnet2D (red N / blue S bar magnet on a rod) + FieldLines2D (pull).
//   World B (beat 2-3, front view, MODEL space = px at k = 1): a clearly-artificial, water-filled STOMACH MODEL
//     (translucent coral silicone, cut tube ends with rims, clamped to a lab stand), the small foreign BALL, a flat
//     copper induction COIL behind the model's bottom (cold copper -> orange AC glow + pulsing field rings), the
//     ghosted friendly HUMAN outline (hypothetical; drawn on), and a navy BACKDROP with parallax lab bokeh.
// The liquid metal itself is never drawn here: the shot draws it with the engine (ChromeBody).
// Every SVG id comes from uid(); every component is a pure function of its props.
import React from 'react';
import {C, INK, INK_PX} from '../../art/palette';
import {uid} from '../../core/ids';
import {mix, rgba} from '../../core/color';
import {clamp, hash, lerp, noise1} from '../../lib';
import {lattice, loopsPath, marchLoops, Loop} from '../liquid/march';

export type V = {x: number; y: number};
export const f1 = (n: number) => (Math.abs(n) < 1e-4 ? '0' : n.toFixed(1));
const FONT = '"Nunito Variable", "Nunito", system-ui, sans-serif';

// =====================================================================================================================
// CAMERA
// =====================================================================================================================
export type Cam2 = {k: number; F: V; O: V};
export const CAM_ID: Cam2 = {k: 1, F: {x: 540, y: 960}, O: {x: 540, y: 960}};
export const camPt = (c: Cam2, p: V): V => ({x: c.O.x + c.k * (p.x - c.F.x), y: c.O.y + c.k * (p.y - c.F.y)});
export const camPts = (c: Cam2, ps: V[]) => ps.map((p) => camPt(c, p));
/** screen -> model */
export const camInv = (c: Cam2, s: V): V => ({x: c.F.x + (s.x - c.O.x) / c.k, y: c.F.y + (s.y - c.O.y) / c.k});

// =====================================================================================================================
// CURVES
// =====================================================================================================================
/** Catmull-Rom through points (open or closed), n samples per segment */
export const crSample = (ps: V[], n = 8, closed = false): V[] => {
  const out: V[] = [];
  const N = ps.length;
  const seg = closed ? N : N - 1;
  const at = (i: number) => (closed ? ps[((i % N) + N) % N] : ps[Math.max(0, Math.min(N - 1, i))]);
  for (let i = 0; i < seg; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    for (let k = 0; k < n; k++) {
      const u = k / n, u2 = u * u, u3 = u2 * u;
      out.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * u + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * u + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3),
      });
    }
  }
  if (!closed) out.push(ps[N - 1]);
  return out;
};
export const polyD = (ps: V[], close = true) => (ps.length < 2 ? '' : 'M' + ps.map((p) => `${f1(p.x)},${f1(p.y)}`).join('L') + (close ? 'Z' : ''));

/** an arc-length parametrised polyline */
export type Poly = {pts: V[]; s: number[]; len: number};
export const mkPoly = (pts: V[]): Poly => {
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return {pts, s, len: s[s.length - 1]};
};
export const polyAt = (P: Poly, q: number): V => {
  const {pts, s} = P;
  if (q <= 0) return pts[0];
  if (q >= P.len) return pts[pts.length - 1];
  let lo = 0, hi = s.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (s[m] <= q) lo = m;
    else hi = m;
  }
  const u = (q - s[lo]) / Math.max(1e-9, s[hi] - s[lo]);
  return {x: lerp(pts[lo].x, pts[hi].x, u), y: lerp(pts[lo].y, pts[hi].y, u)};
};
export const polyTan = (P: Poly, q: number): V => {
  const a = polyAt(P, q - 2), b = polyAt(P, q + 2);
  const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return {x: (b.x - a.x) / l, y: (b.y - a.y) / l};
};
/** sub-polyline between arc lengths a..b */
export const polySub = (P: Poly, a: number, b: number, step = 6): V[] => {
  const out: V[] = [];
  if (b <= a) return out;
  const n = Math.max(2, Math.ceil((b - a) / step));
  for (let i = 0; i <= n; i++) out.push(polyAt(P, a + ((b - a) * i) / n));
  return out;
};

// =====================================================================================================================
// FIELD LINES + MAGNET (screen space)
// =====================================================================================================================
/** a bar magnet (red N / blue S), centre c, `ang` = direction the N face points (rad), sc = px scale (1 = 168 x 64 px),
 *  with a steel rod handle leaving from the S end */
export const MAG = {a: 84, b: 32};
export const magnetNFace = (c: V, ang: number, sc: number): V => ({x: c.x + Math.cos(ang) * MAG.a * sc, y: c.y + Math.sin(ang) * MAG.a * sc});
export const Magnet2D: React.FC<{c: V; ang: number; sc: number; opacity?: number; handle?: number}> = ({c, ang, sc, opacity = 1, handle = 360}) => {
  if (opacity <= 0.003 || sc < 0.02) return null;
  const {a, b} = MAG;
  const r = 12;
  const id = {n: uid('mgN'), s: uid('mgS'), rod: uid('mgR'), sh: uid('mgH')};
  const deg = (ang * 180) / Math.PI;
  const half = (s: 1 | -1) => `M0,${-b} L${s * (a - r)},${-b} Q${s * a},${-b} ${s * a},${-b + r} L${s * a},${b - r} Q${s * a},${b} ${s * (a - r)},${b} L0,${b} Z`;
  // letters stay upright on screen
  const up = (s: number) => `translate(${s * a * 0.5} 0) rotate(${f1(-deg)})`;
  const iw = INK_PX / Math.max(sc, 0.05);
  return (
    <g opacity={opacity} transform={`translate(${f1(c.x)} ${f1(c.y)}) rotate(${f1(deg)}) scale(${sc.toFixed(4)})`}>
      <defs>
        <linearGradient id={id.n} gradientUnits="userSpaceOnUse" x1="0" y1={-b} x2="0" y2={b}>
          <stop offset="0" stopColor="#FF9C98" />
          <stop offset="0.3" stopColor={C.north} />
          <stop offset="1" stopColor="#9A1C24" />
        </linearGradient>
        <linearGradient id={id.s} gradientUnits="userSpaceOnUse" x1="0" y1={-b} x2="0" y2={b}>
          <stop offset="0" stopColor="#9DBEFF" />
          <stop offset="0.3" stopColor={C.south} />
          <stop offset="1" stopColor="#1C3C96" />
        </linearGradient>
        <linearGradient id={id.rod} gradientUnits="userSpaceOnUse" x1="0" y1="-9" x2="0" y2="9">
          <stop offset="0" stopColor="#E9EFF6" />
          <stop offset="0.35" stopColor="#9AA9BB" />
          <stop offset="1" stopColor="#3B4A5E" />
        </linearGradient>
      </defs>
      {/* soft contact shadow */}
      <rect x={-a - handle * 0.1} y={-b + 10} width={2 * a + handle * 0.1} height={2 * b + 8} rx={r + 6} fill={C.navy0} opacity={0.35} transform="translate(8 14)" />
      {handle > 0 && (
        <g>
          <rect x={-a - handle} y={-8} width={handle} height={16} rx={8} fill={`url(#${id.rod})`} stroke={INK} strokeWidth={iw} />
          <rect x={-a - handle} y={-13} width={handle * 0.42} height={26} rx={12} fill="#2A3446" stroke={INK} strokeWidth={iw} />
        </g>
      )}
      <rect x={-a - 3} y={-b - 3} width={2 * a + 6} height={2 * b + 6} rx={r + 3} fill={INK} />
      <path d={half(1)} fill={`url(#${id.n})`} />
      <path d={half(-1)} fill={`url(#${id.s})`} />
      <line x1="0" x2="0" y1={-b} y2={b} stroke={INK} strokeWidth={iw * 0.9} />
      <path d={`M${-a + 14},${-b + 9} L${a - 14},${-b + 9}`} stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" opacity={0.5} />
      {([[1, 'N'], [-1, 'S']] as [number, string][]).map(([s, L]) => (
        <g key={L} transform={up(s)}>
          <text x="0" y="0" dy="0.36em" textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={40} fill="#FFFFFF" stroke={INK} strokeWidth={5} paintOrder="stroke" strokeLinejoin="round">
            {L}
          </text>
        </g>
      ))}
    </g>
  );
};

/** field lines from the magnet's N face (a) to the metal (b): a spindle of curves with a pulse flowing toward the
 *  magnet (the pull). w = line width (px). */
export const FieldLines2D: React.FC<{a: V; b: V; spread: number; w: number; t: number; on: number; n?: number}> = ({a, b, spread, w, t, on, n = 5}) => {
  if (on <= 0.01) return null;
  const dx = b.x - a.x, dy = b.y - a.y;
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const mid = {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2};
  const es = Array.from({length: n}, (_, i) => i - (n - 1) / 2);
  return (
    <g opacity={clamp(on)}>
      {es.map((e) => {
        const s0 = e * spread * 0.16, s1 = e * spread * 0.22, sm = e * spread * 0.62;
        const p0 = {x: a.x + nx * s0, y: a.y + ny * s0}, p1 = {x: b.x + nx * s1, y: b.y + ny * s1};
        const cm = {x: mid.x + nx * sm, y: mid.y + ny * sm};
        const d = `M${f1(p1.x)},${f1(p1.y)} Q${f1(cm.x)},${f1(cm.y)} ${f1(p0.x)},${f1(p0.y)}`;
        const fade = 1 - Math.abs(e) * 0.18;
        return (
          <g key={e} opacity={fade}>
            <path d={d} fill="none" stroke={C.field} strokeWidth={f1(w * 2.4)} strokeLinecap="round" opacity={0.18} />
            <path d={d} fill="none" stroke={C.field} strokeWidth={f1(w)} strokeLinecap="round" opacity={0.8} />
            <path d={d} fill="none" stroke="#E8FBFF" strokeWidth={f1(Math.max(1, w * 0.55))} strokeLinecap="round" strokeDasharray={`${f1(w * 2.6)} ${f1(w * 7.5)}`} strokeDashoffset={f1(-t * w * 26 + e * 7)} opacity={0.9} />
          </g>
        );
      })}
    </g>
  );
};

// =====================================================================================================================
// WORLD A: top-down lab mat + acrylic channel block
// =====================================================================================================================
export const MatTop: React.FC<{cam: Cam2; on: number}> = ({cam, on}) => {
  if (on <= 0.003) return null;
  const tl = camInv(cam, {x: -20, y: -20}), br = camInv(cam, {x: 1100, y: 1940});
  const minor = 60, major = 300;
  const lines: string[] = [], majors: string[] = [];
  for (let x = Math.ceil(tl.x / minor) * minor; x <= br.x; x += minor) {
    const a = camPt(cam, {x, y: tl.y}), b = camPt(cam, {x, y: br.y});
    (x % major === 0 ? majors : lines).push(`M${f1(a.x)},${f1(a.y)}V${f1(b.y)}`);
  }
  for (let y = Math.ceil(tl.y / minor) * minor; y <= br.y; y += minor) {
    const a = camPt(cam, {x: tl.x, y}), b = camPt(cam, {x: br.x, y});
    (y % major === 0 ? majors : lines).push(`M${f1(a.x)},${f1(a.y)}H${f1(b.x)}`);
  }
  const id = uid('matV');
  return (
    <g opacity={clamp(on)}>
      <defs>
        <radialGradient id={id} gradientUnits="userSpaceOnUse" cx="520" cy="900" r="1250">
          <stop offset="0" stopColor={C.navy2} stopOpacity={0.9} />
          <stop offset="0.6" stopColor={C.navy1} stopOpacity={0.4} />
          <stop offset="1" stopColor={C.navy0} stopOpacity={0.85} />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill={`url(#${id})`} />
      <path d={lines.join('')} stroke={C.navy3} strokeWidth={1.2} opacity={0.45} fill="none" />
      <path d={majors.join('')} stroke={C.navy3} strokeWidth={2.2} opacity={0.75} fill="none" />
    </g>
  );
};

/** the course (world A coords): a funnel mouth below the bead, then a narrow S channel down to the exit */
export const COURSE = {
  bead: {x: 540, y: 1100},
  lumen: 104,
  mouthY: 1212, // the funnel's wide top edge
  mouthW: 300,
  ctrl: [
    {x: 540, y: 1300}, {x: 552, y: 1386}, {x: 660, y: 1452}, {x: 700, y: 1550}, {x: 606, y: 1640}, {x: 440, y: 1692},
    {x: 392, y: 1782}, {x: 466, y: 1874}, {x: 540, y: 1962},
  ] as V[],
  block: {x0: 270, y0: 1196, x1: 810, y1: 1968, r: 34},
  magnet: {x: 540, y: 2330},
};
export const COURSE_PATH: Poly = mkPoly(crSample(COURSE.ctrl, 14));

export const ChannelBlock: React.FC<{cam: Cam2; dy: number; t: number}> = ({cam, dy, t}) => {
  const k = cam.k;
  const P = (p: V) => camPt(cam, {x: p.x, y: p.y + dy});
  const B = COURSE.block;
  const a = P({x: B.x0, y: B.y0}), b = P({x: B.x1, y: B.y1});
  const w = b.x - a.x, h = b.y - a.y;
  const cl = COURSE_PATH.pts.map(P);
  const cd = polyD(cl, false);
  const lw = COURSE.lumen * k;
  // the funnel: from the mouth (wide) to the channel entrance
  const E = P(COURSE.ctrl[0]);
  const my = P({x: 540, y: COURSE.mouthY}).y;
  const mw = (COURSE.mouthW * k) / 2;
  const funnel = `M${f1(E.x - lw / 2)},${f1(E.y + 2)} C${f1(E.x - lw / 2)},${f1(E.y - 30 * k)} ${f1(E.x - mw)},${f1(my + 26 * k)} ${f1(E.x - mw)},${f1(my)} L${f1(E.x + mw)},${f1(my)} C${f1(E.x + mw)},${f1(my + 26 * k)} ${f1(E.x + lw / 2)},${f1(E.y - 30 * k)} ${f1(E.x + lw / 2)},${f1(E.y + 2)} Z`;
  const id = {g: uid('acG'), s: uid('acS'), c: uid('acC')};
  const sheen = 0.5 + 0.5 * Math.sin(t * 1.3);
  return (
    <g>
      <defs>
        <linearGradient id={id.g} gradientUnits="userSpaceOnUse" x1={f1(a.x)} y1={f1(a.y)} x2={f1(b.x)} y2={f1(b.y)}>
          <stop offset="0" stopColor="#CFEFFF" stopOpacity={0.3} />
          <stop offset="0.45" stopColor="#9CCBEA" stopOpacity={0.13} />
          <stop offset="1" stopColor="#6E9BC2" stopOpacity={0.2} />
        </linearGradient>
        <linearGradient id={id.s} gradientUnits="userSpaceOnUse" x1={f1(a.x)} y1={f1(a.y)} x2={f1(a.x + w * 0.6)} y2={f1(a.y + h * 0.5)}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.22 + 0.06 * sheen} />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        <clipPath id={id.c}>
          <rect x={f1(a.x)} y={f1(a.y)} width={f1(w)} height={f1(h)} rx={f1(B.r * k)} />
        </clipPath>
      </defs>
      {/* drop shadow of the block on the mat */}
      <rect x={f1(a.x + 14 * k)} y={f1(a.y + 22 * k)} width={f1(w)} height={f1(h)} rx={f1(B.r * k)} fill={C.navy0} opacity={0.55} />
      <rect x={f1(a.x)} y={f1(a.y)} width={f1(w)} height={f1(h)} rx={f1(B.r * k)} fill={`url(#${id.g})`} stroke={INK} strokeWidth={INK_PX} />
      <g clipPath={`url(#${id.c})`}>
        {/* the milled channel: bright cut walls, a darker floor (the mat seen through the thin floor) */}
        <path d={funnel} fill="#D8F2FF" opacity={0.5} />
        <path d={cd} fill="none" stroke="#D8F2FF" strokeWidth={f1(lw + 10)} strokeLinecap="butt" strokeLinejoin="round" opacity={0.5} />
        <path d={funnel} fill={mix(C.navy1, C.navy2, 0.4)} transform={`translate(0 ${f1(4 * k)})`} />
        <path d={cd} fill="none" stroke={mix(C.navy1, C.navy2, 0.4)} strokeWidth={f1(lw)} strokeLinecap="butt" strokeLinejoin="round" />
        {/* floor gloss along the channel */}
        <path d={cd} fill="none" stroke="#9FD3F5" strokeWidth={f1(Math.max(1.5, 6 * k))} strokeLinecap="round" strokeLinejoin="round" opacity={0.18} transform={`translate(${f1(-lw * 0.22)} ${f1(-lw * 0.1)})`} />
        <rect x={f1(a.x)} y={f1(a.y)} width={f1(w)} height={f1(h)} fill={`url(#${id.s})`} />
      </g>
      {/* lit top-left bevel */}
      <path d={`M${f1(a.x + 6 * k)},${f1(b.y - B.r * k)} L${f1(a.x + 6 * k)},${f1(a.y + B.r * k)} Q${f1(a.x + 6 * k)},${f1(a.y + 6 * k)} ${f1(a.x + B.r * k)},${f1(a.y + 6 * k)} L${f1(b.x - B.r * k)},${f1(a.y + 6 * k)}`} fill="none" stroke="#FFFFFF" strokeWidth={f1(Math.max(1.5, 4 * k))} opacity={0.55} strokeLinecap="round" />
    </g>
  );
};

// =====================================================================================================================
// WORLD B: the stomach model (model space)
// =====================================================================================================================
const P = (x: number, y: number): V => ({x, y});
/** outer outline, clockwise from the oesophagus' cut top (left wall down, lesser curvature, pylorus + duodenum stub,
 *  greater curvature, fundus, cardiac notch, oesophagus right wall up). A wide oesophagus (it is a model). */
export const STOMACH2: V[] = [
  P(690, 400), P(692, 470), P(702, 548), P(726, 618), P(764, 684),
  P(806, 752), P(820, 840), P(810, 932), P(778, 1036), P(718, 1120), P(636, 1186), P(540, 1228), P(440, 1248), P(345, 1243),
  P(268, 1222),
  P(226, 1206), P(186, 1178), P(150, 1150), P(118, 1124), P(90, 1150), P(80, 1190), P(92, 1226), P(126, 1250), P(160, 1282),
  P(186, 1318),
  P(222, 1378), P(290, 1438), P(386, 1482), P(500, 1500), P(618, 1484), P(736, 1436), P(842, 1356), P(930, 1250), P(1000, 1128),
  P(1046, 990), P(1068, 850), P(1072, 728), P(1050, 628), P(1004, 566), P(948, 542), P(898, 556),
  P(870, 520), P(862, 470), P(860, 400),
];
export const WALL = 20;
export const RIM_TOP2 = {c: P(775, 400), rx: 86, ry: 20, ang: 0};
export const RIM_DUO2 = {c: P(104, 1188), rx: 48, ry: 15, ang: -55};

/** signed distance to a closed polygon (negative inside) */
const sdPoly = (poly: V[], x: number, y: number) => {
  let d = Infinity, s = 1;
  const n = poly.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const a = poly[j], b = poly[i];
    const ex = b.x - a.x, ey = b.y - a.y, wx = x - a.x, wy = y - a.y;
    const h = clamp((wx * ex + wy * ey) / (ex * ex + ey * ey || 1));
    const qx = wx - ex * h, qy = wy - ey * h;
    d = Math.min(d, qx * qx + qy * qy);
    const c1 = y >= a.y, c2 = y < b.y, c3 = ex * wy > ey * wx;
    if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
  }
  return s * Math.sqrt(d);
};

/** the model's geometry (model space), built once: the smooth outer outline, the inner cavity (outline offset by the
 *  wall), the cavity's floor height near the ball */
export const STOMACH_GEO = (() => {
  const outer = crSample(STOMACH2, 10, true);
  const box = {x0: 40, y0: 360, x1: 1110, y1: 1540};
  const L = lattice(box, 6);
  const vals = new Float32Array(L.nx * L.ny);
  for (let j = 0; j < L.ny; j++) for (let i = 0; i < L.nx; i++) vals[j * L.nx + i] = sdPoly(outer, L.x0 + i * L.cell, L.y0 + j * L.cell) + WALL;
  const loops = marchLoops(vals, L, 0);
  // keep the biggest loop (the cavity)
  let inner: Loop = loops[0] ?? [];
  let best = 0;
  for (const lp of loops) {
    let a = 0;
    for (let i = 0, j = lp.length - 1; i < lp.length; j = i++) a += lp[j].x * lp[i].y - lp[i].x * lp[j].y;
    if (Math.abs(a) > best) {
      best = Math.abs(a);
      inner = lp;
    }
  }
  /** the cavity's floor (lowest inner point) at model x */
  const floorAt = (x: number) => {
    let y = -Infinity;
    for (let i = 0, j = inner.length - 1; i < inner.length; j = i++) {
      const a = inner[j], b = inner[i];
      if ((a.x - x) * (b.x - x) <= 0 && a.x !== b.x) {
        const yy = a.y + ((x - a.x) / (b.x - a.x)) * (b.y - a.y);
        if (yy > y) y = yy;
      }
    }
    return y;
  };
  return {outer, inner: inner as V[], floorAt, sd: (x: number, y: number) => sdPoly(outer, x, y)};
})();

/** the water-filled lab model: 'back' = shadow, wall, water-filled cavity (drawn before the contents);
 *  'front' = front-wall tint and sheen, gloss, ink, cut rims (drawn over the contents). */
export const StomachModel2: React.FC<{cam: Cam2; t: number; layer: 'back' | 'front'; opacity?: number}> = ({cam, t, layer, opacity = 1}) => {
  if (opacity <= 0.003) return null;
  const G = STOMACH_GEO;
  const out = camPts(cam, G.outer), inn = camPts(cam, G.inner);
  const dO = polyD(out), dI = polyD(inn);
  const k = cam.k;
  const xs = out.map((p) => p.x), ys = out.map((p) => p.y);
  const bx0 = Math.min(...xs), bx1 = Math.max(...xs), by0 = Math.min(...ys), by1 = Math.max(...ys);
  if (layer === 'back') {
    const id = {w: uid('smW'), c: uid('smC'), k: uid('smK'), l: uid('smL')};
    // slow caustic light bands in the water (refraction through the wall)
    const caus: string[] = [];
    for (let i = 0; i < 6; i++) {
      const yy = 560 + i * 165 + 18 * Math.sin(t * 0.9 + i * 1.7);
      const pts: V[] = [];
      for (let x = 60; x <= 1100; x += 40) pts.push({x, y: yy + 22 * Math.sin(x * 0.011 + t * 1.4 + i * 2.1) + 10 * noise1(x * 0.01 + t * 0.6, i)});
      caus.push(polyD(camPts(cam, pts), false));
    }
    return (
      <g opacity={opacity}>
        <defs>
          <linearGradient id={id.w} gradientUnits="userSpaceOnUse" x1={f1(bx0)} y1={f1(by0)} x2={f1(bx1)} y2={f1(by1)}>
            <stop offset="0" stopColor={C.stomachLit} />
            <stop offset="0.45" stopColor={C.stomach} />
            <stop offset="1" stopColor={C.stomachDeep} />
          </linearGradient>
          <linearGradient id={id.c} gradientUnits="userSpaceOnUse" x1={f1(bx0)} y1={f1(by0)} x2={f1(bx1 * 0.8)} y2={f1(by1)}>
            <stop offset="0" stopColor={mix(mix(C.stomachIn, '#3E7FA6', 0.62), C.navy2, 0.2)} />
            <stop offset="0.55" stopColor={mix(mix(C.stomachDeep, '#2D5E86', 0.62), C.navy2, 0.3)} />
            <stop offset="1" stopColor={mix(C.stomachDeep, C.navy1, 0.62)} />
          </linearGradient>
          <clipPath id={id.k}>
            <path d={dI} />
          </clipPath>
        </defs>
        <path d={dO} fill={C.navy0} opacity={0.5} transform={`translate(${f1(14 * k)} ${f1(20 * k)})`} />
        <path d={dO} fill={`url(#${id.w})`} opacity={0.94} />
        <path d={dI} fill={`url(#${id.c})`} opacity={0.93} />
        <g clipPath={`url(#${id.k})`}>
          {caus.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="#FFFFFF" strokeWidth={f1(Math.max(1, 3 * k))} opacity={0.1 + 0.05 * Math.sin(t * 2 + i)} strokeLinecap="round" />
          ))}
          {/* the wall's thickness reads as a bright band hugging the cavity */}
          <path d={dI} fill="none" stroke={C.stomachLit} strokeWidth={f1(Math.max(1.5, 6 * k))} opacity={0.55} />
          <path d={dI} fill="none" stroke={C.navy0} strokeWidth={f1(Math.max(1.5, 16 * k))} opacity={0.18} transform={`translate(${f1(4 * k)} ${f1(5 * k)})`} />
        </g>
      </g>
    );
  }
  const id = {s: uid('smS'), k: uid('smQ'), t: uid('smT')};
  const gl = (ps: V[], w: number, o: number, key: string) => (
    <path key={key} d={polyD(camPts(cam, crSample(ps, 8)), false)} fill="none" stroke="#FFFFFF" strokeWidth={f1(Math.max(1.2, w * k))} strokeLinecap="round" strokeLinejoin="round" opacity={o} />
  );
  const rim = (r: typeof RIM_TOP2, key: string) => {
    const c = camPt(cam, r.c);
    const rx = r.rx * k, ry = r.ry * k;
    return (
      <g key={key} transform={`translate(${f1(c.x)} ${f1(c.y)}) rotate(${r.ang})`}>
        <ellipse rx={f1(rx)} ry={f1(ry)} fill={mix(C.stomach, C.stomachLit, 0.3)} stroke={INK} strokeWidth={INK_PX * 0.8} />
        <ellipse rx={f1(rx * 0.76)} ry={f1(ry * 0.62)} fill={mix(C.stomachDeep, C.navy1, 0.35)} />
        <ellipse rx={f1(rx * 0.76)} ry={f1(ry * 0.62)} fill="none" stroke={rgba('#BFE3F2', 0.5)} strokeWidth={1.5} />
        <path d={`M${f1(-rx * 0.92)},${f1(-ry * 0.25)} A${f1(rx)},${f1(ry)} 0 0 1 ${f1(rx * 0.3)},${f1(-ry * 0.98)}`} fill="none" stroke="#FFFFFF" strokeWidth={2} opacity={0.7} strokeLinecap="round" />
      </g>
    );
  };
  const tw = 0.85 + 0.15 * Math.sin(t * 1.7);
  return (
    <g opacity={opacity}>
      <defs>
        <linearGradient id={id.s} gradientUnits="userSpaceOnUse" x1={f1(bx0)} y1={f1(by0)} x2={f1(bx0 + (bx1 - bx0) * 0.7)} y2={f1(by1)}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.3} />
          <stop offset="0.35" stopColor="#FFFFFF" stopOpacity={0.05} />
          <stop offset="0.7" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="1" stopColor={C.navy0} stopOpacity={0.14} />
        </linearGradient>
        <clipPath id={id.k}>
          <path d={dO} />
        </clipPath>
      </defs>
      {/* the translucent front wall over the contents: a faint coral tint + sheen */}
      <path d={dI} fill={C.stomach} opacity={0.07} />
      <path d={dI} fill="none" stroke={mix(C.stomachDeep, INK, 0.45)} strokeWidth={f1(Math.max(1, Math.min(2.2, 1.6 * k)))} opacity={0.8} />
      <path d={dO} fill={`url(#${id.s})`} />
      <g clipPath={`url(#${id.k})`}>
        {gl([P(905, 590), P(962, 576), P(1014, 604), P(1042, 664)], 11, 0.75 * tw, 'g1')}
        {gl([P(1046, 770), P(1042, 890), P(1020, 990)], 7, 0.5, 'g2')}
        {gl([P(300, 1442), P(400, 1482), P(500, 1491)], 5, 0.35, 'g3')}
        {gl([P(716, 470), P(718, 560), P(736, 622)], 7, 0.55, 'g4')}
      </g>
      <path d={dO} fill="none" stroke={INK} strokeWidth={INK_PX} strokeLinejoin="round" />
      {rim(RIM_TOP2, 'rt')}
      {rim(RIM_DUO2, 'rd')}
    </g>
  );
};

/** a lab stand rod + clamp holding the model's oesophagus (makes it read as a bench model) */
export const StandClamp: React.FC<{cam: Cam2; opacity?: number}> = ({cam, opacity = 1}) => {
  if (opacity <= 0.003) return null;
  const k = cam.k;
  const c = camPt(cam, {x: 775, y: 452});
  const top = camPt(cam, {x: 1180, y: -900});
  const arm0 = camPt(cam, {x: 868, y: 452}), arm1 = camPt(cam, {x: 1180, y: 452});
  const id = uid('scR');
  const rw = Math.max(3, 22 * k);
  return (
    <g opacity={opacity}>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={f1(arm1.x - rw)} y1="0" x2={f1(arm1.x + rw)} y2="0">
          <stop offset="0" stopColor="#B9C6D4" />
          <stop offset="0.4" stopColor="#6C7B8F" />
          <stop offset="1" stopColor="#2E3A4C" />
        </linearGradient>
      </defs>
      <rect x={f1(arm1.x - rw / 2)} y={f1(top.y)} width={f1(rw)} height={f1(arm1.y - top.y + rw)} fill={`url(#${id})`} stroke={INK} strokeWidth={2} />
      <rect x={f1(arm0.x)} y={f1(arm0.y - rw * 0.35)} width={f1(arm1.x - arm0.x)} height={f1(rw * 0.7)} fill="#5E6E82" stroke={INK} strokeWidth={2} />
      <rect x={f1(arm1.x - rw * 0.9)} y={f1(arm1.y - rw * 0.8)} width={f1(rw * 1.8)} height={f1(rw * 1.6)} rx={f1(rw * 0.3)} fill="#3A4A60" stroke={INK} strokeWidth={2} />
      {/* the clamp band around the tube */}
      <rect x={f1(c.x - 95 * k)} y={f1(c.y - 13 * k)} width={f1(190 * k)} height={f1(26 * k)} rx={f1(10 * k)} fill="#8796A9" stroke={INK} strokeWidth={2} opacity={0.95} />
      <rect x={f1(c.x - 95 * k)} y={f1(c.y - 13 * k)} width={f1(190 * k)} height={f1(8 * k)} rx={f1(4 * k)} fill="#FFFFFF" opacity={0.35} />
    </g>
  );
};

/** the small foreign object (a glossy lime ball: it pops against the navy cavity, the coral wall and the orange heat), screen space */
export const Ball: React.FC<{c: V; r: number; opacity?: number}> = ({c, r, opacity = 1}) => {
  if (opacity <= 0.003 || r < 0.4) return null;
  const id = uid('ball');
  return (
    <g opacity={opacity}>
      <defs>
        <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={f1(c.x - r * 0.35)} cy={f1(c.y - r * 0.4)} r={f1(r * 1.5)}>
          <stop offset="0" stopColor="#F4FFD0" />
          <stop offset="0.35" stopColor="#B6EE5A" />
          <stop offset="0.8" stopColor="#62B32C" />
          <stop offset="1" stopColor="#2F6E1C" />
        </radialGradient>
      </defs>
      <circle cx={f1(c.x)} cy={f1(c.y)} r={f1(r)} fill={`url(#${id})`} stroke={INK} strokeWidth={f1(Math.min(INK_PX, Math.max(1, r * 0.12)))} />
      <ellipse cx={f1(c.x - r * 0.36)} cy={f1(c.y - r * 0.42)} rx={f1(r * 0.3)} ry={f1(r * 0.2)} transform={`rotate(-30 ${f1(c.x - r * 0.36)} ${f1(c.y - r * 0.42)})`} fill="#FFFFFF" opacity={0.85} />
    </g>
  );
};

/** a flat copper induction coil seen face-on (behind the model's bottom); heat 0..1 = energised (orange glow + AC
 *  rings travelling out). on = visibility. */
export const Coil2D: React.FC<{cam: Cam2; c: V; r0: number; r1: number; heat: number; t: number; on?: number; layer: 'coil' | 'glow'}> = ({cam, c, r0, r1, heat, t, on = 1, layer}) => {
  if (on <= 0.003) return null;
  const k = cam.k;
  const C0 = camPt(cam, c);
  const h = clamp(heat);
  if (layer === 'glow') {
    if (h <= 0.01) return null;
    const id = uid('cgG');
    const rings = [0, 1, 2].map((i) => {
      const ph = (t * 1.6 + i / 3) % 1;
      return {r: (r0 * 0.6 + (r1 * 1.25 - r0 * 0.6) * ph) * k, o: Math.sin(Math.PI * ph) * 0.55};
    });
    return (
      <g opacity={on * h}>
        <defs>
          <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={f1(C0.x)} cy={f1(C0.y)} r={f1(r1 * 1.3 * k)}>
            <stop offset="0" stopColor={C.heat} stopOpacity={0.55} />
            <stop offset="0.55" stopColor={C.heat} stopOpacity={0.22} />
            <stop offset="1" stopColor={C.heat} stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={f1(C0.x)} cy={f1(C0.y)} r={f1(r1 * 1.3 * k)} fill={`url(#${id})`} style={{mixBlendMode: 'screen'}} />
        {rings.map((q, i) => (
          <circle key={i} cx={f1(C0.x)} cy={f1(C0.y)} r={f1(q.r)} fill="none" stroke={C.yellow} strokeWidth={f1(Math.max(1.5, 3 * k))} strokeDasharray={`${f1(10 * k)} ${f1(12 * k)}`} strokeDashoffset={f1(t * 60 * k * (i % 2 ? 1 : -1))} opacity={q.o * 0.6} />
        ))}
      </g>
    );
  }
  // spiral windings
  const turns = 4;
  const pts: V[] = [];
  const N = 260;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const a = u * turns * Math.PI * 2 - Math.PI / 2;
    const r = (r0 + (r1 - r0) * u) * k;
    pts.push({x: C0.x + Math.cos(a) * r, y: C0.y + Math.sin(a) * r});
  }
  const d = polyD(pts, false);
  // the leads: a short return across the windings, then one sleeved cable away to the (unseen) induction heater
  const e = pts[N];
  const cable = `M${f1(e.x)},${f1(e.y)} C${f1(e.x + 60 * k)},${f1(e.y + 10 * k)} ${f1(e.x + 120 * k)},${f1(e.y + 80 * k)} ${f1(e.x + 260 * k)},${f1(e.y + 700 * k)}`;
  const lead = '';
  const lead2 = `M${f1(pts[0].x)},${f1(pts[0].y)} L${f1(e.x)},${f1(pts[0].y + (e.y - pts[0].y) * 0.3)} L${f1(e.x)},${f1(e.y)}`;
  const cw = Math.max(2, ((r1 - r0) / turns) * 0.6 * k);
  const cu = mix('#8E5432', C.heat, h * 0.75);
  const hot = mix('#C98A5C', C.yellow, h);
  return (
    <g opacity={on}>
      <path d={cable} fill="none" stroke={INK} strokeWidth={f1(cw * 1.3 + 3)} strokeLinecap="round" opacity={0.8} />
      <path d={cable} fill="none" stroke="#26324A" strokeWidth={f1(cw * 1.3)} strokeLinecap="round" opacity={0.8} />
      <path d={`${d} ${lead} ${lead2}`} fill="none" stroke={INK} strokeWidth={f1(cw + 3)} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`${d} ${lead} ${lead2}`} fill="none" stroke={cu} strokeWidth={f1(cw)} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={hot} strokeWidth={f1(Math.max(1, cw * 0.3))} strokeLinecap="round" opacity={0.75} transform={`translate(${f1(-cw * 0.18)} ${f1(-cw * 0.2)})`} />
    </g>
  );
};

// =====================================================================================================================
// THE GHOST HUMAN (hypothetical): soft translucent silhouette + a glowing dashed outline drawn on from the stomach
// outward. Model space, midline x = 600 (head above, the model sits in the upper-left abdomen).
// =====================================================================================================================
const TORSO_R: V[] = [
  P(735, -700), P(740, -560), P(770, -500), P(910, -455), P(1090, -420), P(1250, -378), P(1370, -296), P(1438, -166),
  P(1460, 0), P(1448, 190), P(1408, 340), P(1360, 480), P(1346, 700), P(1326, 950), P(1286, 1200), P(1246, 1420), P(1256, 1650),
  P(1296, 1900), P(1326, 2150), P(1336, 2500),
];
export const GHOST = {mid: 600, head: {c: P(600, -1010), rx: 280, ry: 335}};
const ghostOutline = (() => {
  const right = crSample(TORSO_R, 10);
  const left = right.map((p) => ({x: 2 * GHOST.mid - p.x, y: p.y})).reverse();
  return {left, right};
})();
const headPts = (() => {
  const out: V[] = [];
  const {c, rx, ry} = GHOST.head;
  for (let i = 0; i <= 72; i++) {
    // start at the chin, go round
    const a = Math.PI / 2 + (i / 72) * Math.PI * 2;
    out.push({x: c.x + Math.cos(a) * rx, y: c.y + Math.sin(a) * ry * (Math.sin(a) > 0 ? 1.0 : 0.96)});
  }
  return out;
})();
/** the ghost oesophagus (model space): from the model's top rim up the chest to the throat */
export const GHOST_GULLET: V[] = [P(775, 400), P(772, 250), P(735, 60), P(668, -140), P(630, -330), P(612, -560), P(606, -700)];
export const GhostBody: React.FC<{cam: Cam2; p: number; t: number; opacity?: number}> = ({cam, p, t, opacity = 1}) => {
  if (opacity <= 0.003 || p <= 0.003) return null;
  const k = cam.k;
  const R = camPts(cam, ghostOutline.right), Lf = camPts(cam, ghostOutline.left);
  const Hd = camPts(cam, headPts);
  const fill = polyD([...Lf, ...R]);
  const id = {f: uid('ghF'), h: uid('ghH')};
  // the outline draws on: torso sides from the waist up (both sides), then the head from the chin round
  const pr = clamp(p);
  const torsoK = clamp(pr / 0.7), headK = clamp((pr - 0.45) / 0.55);
  const lenOf = (ps: V[]) => ps.reduce((s, q, i) => (i ? s + Math.hypot(q.x - ps[i - 1].x, q.y - ps[i - 1].y) : 0), 0);
  const rUp = [...R].reverse(), lUp = Lf; // both from the hip up to the neck
  const LR = lenOf(rUp);
  const LH = lenOf(Hd);
  const line = (ps: V[], L: number, u: number, key: string) => (
    <g key={key}>
      <path d={polyD(ps, false)} fill="none" stroke={C.field} strokeWidth={f1(Math.max(6, 14 * k))} strokeLinecap="round" strokeLinejoin="round" opacity={0.22} pathLength={L} strokeDasharray={`${f1(L * u)} ${f1(L)}`} />
      <path d={polyD(ps, false)} fill="none" stroke="#D6F6FF" strokeWidth={f1(Math.max(2.4, 4.4 * k))} strokeLinecap="round" strokeLinejoin="round" opacity={0.95} pathLength={L} strokeDasharray={u >= 0.999 ? `${f1(12 * k)} ${f1(9 * k)}` : `${f1(L * u)} ${f1(L)}`} strokeDashoffset={u >= 0.999 ? f1(-t * 20 * k) : 0} />
    </g>
  );
  const gul = camPts(cam, crSample(GHOST_GULLET, 8));
  return (
    <g opacity={opacity}>
      <defs>
        <linearGradient id={id.f} gradientUnits="userSpaceOnUse" x1="0" y1={f1(camPt(cam, P(0, -700)).y)} x2="0" y2={f1(camPt(cam, P(0, 2400)).y)}>
          <stop offset="0" stopColor={C.field} stopOpacity={0.22} />
          <stop offset="0.5" stopColor={C.field} stopOpacity={0.08} />
          <stop offset="1" stopColor={C.field} stopOpacity={0} />
        </linearGradient>
        <radialGradient id={id.h} gradientUnits="userSpaceOnUse" cx={f1(Hd[0].x)} cy={f1(camPt(cam, GHOST.head.c).y)} r={f1(GHOST.head.ry * k * 1.05)}>
          <stop offset="0" stopColor={C.field} stopOpacity={0.14} />
          <stop offset="1" stopColor={C.field} stopOpacity={0.05} />
        </radialGradient>
      </defs>
      <path d={fill} fill={`url(#${id.f})`} opacity={torsoK} />
      <path d={polyD(Hd)} fill={`url(#${id.h})`} opacity={headK} />
      {line(rUp, LR, torsoK, 'r')}
      {line(lUp, LR, torsoK, 'l')}
      {line(Hd, LH, headK, 'h')}
      {/* the gullet (where a retrieved object would leave): a faint dotted guide */}
      <path d={polyD(gul, false)} fill="none" stroke="#BFEFFF" strokeWidth={f1(Math.max(1.2, 2.4 * k))} strokeDasharray={`${f1(3 * k)} ${f1(14 * k)}`} strokeLinecap="round" opacity={0.55 * torsoK} />
    </g>
  );
};

// =====================================================================================================================
// BACKDROP (world B): a dark lab, out-of-focus lights parallaxing behind the model; `lab` 0..1 = how much of the lab
// is visible (1: lab demo, 0: plain C.navy1)
// =====================================================================================================================
const BOKEH: {p: V; r: number; c: string; a: number}[] = Array.from({length: 14}, (_, i) => ({
  p: {x: -300 + hash(i * 3.1) * 1700, y: -500 + hash(i * 7.7 + 1) * 2700},
  r: 26 + hash(i * 5.3 + 2) * 60,
  c: ['#7FC8FF', '#FFFFFF', '#46E6FF', '#FFC27A', '#5CA8FF'][i % 5],
  a: 0.06 + hash(i * 2.9 + 4) * 0.1,
}));
export const Backdrop: React.FC<{cam: Cam2; lab: number; t: number}> = ({cam, lab, t}) => {
  const L = clamp(lab);
  const id = {g: uid('bdG'), v: uid('bdV')};
  // parallax: the far lights move at a fraction of the camera's pan and zoom
  const pk = Math.pow(cam.k, 0.25);
  const far: Cam2 = {k: pk * 0.8, F: {x: lerp(540, cam.F.x, 0.35), y: lerp(960, cam.F.y, 0.35)}, O: cam.O};
  return (
    <g>
      <rect width={1080} height={1920} fill={C.navy1} />
      {L > 0.003 && (
        <g opacity={L}>
          <defs>
            <radialGradient id={id.g} gradientUnits="userSpaceOnUse" cx="560" cy="820" r="1150">
              <stop offset="0" stopColor={C.navy2} />
              <stop offset="0.65" stopColor={C.navy1} />
              <stop offset="1" stopColor={C.navy0} />
            </radialGradient>
          </defs>
          <rect width={1080} height={1920} fill={`url(#${id.g})`} />
          {BOKEH.map((b, i) => {
            const s = camPt(far, b.p);
            return <circle key={i} cx={f1(s.x)} cy={f1(s.y + 8 * Math.sin(t * 0.4 + i))} r={f1(b.r * pk)} fill={b.c} opacity={b.a} />;
          })}
        </g>
      )}
    </g>
  );
};
