// V2 MICRO (owner: MS / C): the material cutaway for "How? It's made from a metal that melts near body temperature.
// And magnets help control its movement."
//
// MATERIAL SPACE. Everything lives in one 2D "material" plane (m, px at zoom 1) seen through a zoom camera:
//   screen = MC + (m - F) * Z * dl          (MC = frame centre, F = the material point at the centre, dl = layer depth)
// At Z = 1, F = MC the matrix is EXACTLY the engine's <ChromeSurface t/> (same height field, same layers, same window
// glint), so the push into the figure's chest continues seamlessly into the metal: as Z grows, the finer structure of
// the material resolves (crystal facets + grain boundaries of solid gallium, embedded NdFeB microparticles in three depth
// layers with parallax), and the big surface reflections scale away.
//
// MicroMatrix   the silver gallium matrix: hard-edged chrome bands (the engine's ENV / CHROME palette) of ONE height
//               field H(m) = ChromeSurface's surfaceHeight + w(Z) * (solid facets | liquid ripples); a melt front
//               (screen y, liquid below it) blends solid -> liquid, so the facets and grain boundaries dissolve into
//               slowly flowing ripples as the front passes. Pure function of its inputs.
// MicroGrains   the NdFeB microparticles: dark angular grains with a lit facet, a glint, a subtle red N / blue S end
//               (the moment axis), a meniscus ring where the metal wets them, deeper layers smaller and hazier.
// Gauge         a clean vertical thermometer (glass, ticks, an orange-red column) with two marked readings.
// Magnet2D      the external bar magnet (N red / S blue) for the diagram; dipoleField / fieldLines: its 2D dipole field.
// Every SVG id comes from uid(); no randomness (hash), no state.
import React from 'react';
import {C, INK} from '../../art/palette';
import {uid} from '../../core/ids';
import {mix} from '../../core/color';
import {clamp, hash, noise1, ss} from '../../lib';
import {CHROME, ENV, surfaceHeight} from '../liquid/Chrome';
import {lattice, loopsPath, marchLoops} from '../liquid/march';

export type V = {x: number; y: number};
const f1 = (n: number) => (Math.abs(n) < 1e-4 ? '0' : n.toFixed(1));
const f3 = (n: number) => (Math.abs(n) < 1e-6 ? '0' : n.toFixed(3));
export const FONT = '"Nunito Variable", "Nunito", system-ui, sans-serif';

// =====================================================================================================================
// THE ZOOM CAMERA
// =====================================================================================================================
export const MC: V = {x: 540, y: 960};
export type MicroView = {Z: number; F: V};
export const microToScreen = (v: MicroView, m: V, dl = 1): V => ({x: MC.x + (m.x - v.F.x) * v.Z * dl, y: MC.y + (m.y - v.F.y) * v.Z * dl});
export const screenToMicro = (v: MicroView, s: V, dl = 1): V => ({x: v.F.x + (s.x - MC.x) / (v.Z * dl), y: v.F.y + (s.y - MC.y) / (v.Z * dl)});

/** weight of the material's fine structure at zoom Z (0 at the ChromeSurface scale, 1 once magnified) */
export const microDetail = (Z: number) => ss(Math.log(Math.max(Z, 1e-3)), Math.log(2.4), Math.log(9.5));

// =====================================================================================================================
// THE MATRIX
// =====================================================================================================================
/** copy of the engine's (private) ChromeSurface slope, for the window glint (keep identical) */
const surfaceSlopeU = (x: number, y: number, t: number) => {
  const u = x / 1080, v = y / 1920;
  return 0.028 * 4.6 * Math.cos(4.6 * u + 1.8 * v + 0.6 * t) - 0.02 * 2.7 * Math.cos(-2.7 * u + 5.1 * v - 0.45 * t + 1.3) + 0.01 * 8 * Math.cos(8.0 * u - 3.0 * v + 0.9 * t + 2.2) + 0.52 * (u - 0.42);
};

/** crystal facets of solid gallium (Voronoi cells in material space, each a tilted plane): height + edge distance */
const FACET_G = 34;
const facet = (mx: number, my: number) => {
  const ci = Math.floor(mx / FACET_G), cj = Math.floor(my / FACET_G);
  let d1 = 1e9, d2 = 1e9, h = 0, sh = 0;
  for (let dj = -1; dj <= 1; dj++)
    for (let di = -1; di <= 1; di++) {
      const i = ci + di, j = cj + dj;
      const id = i * 37.17 + j * 101.31;
      const px = (i + 0.12 + 0.76 * hash(id)) * FACET_G, py = (j + 0.12 + 0.76 * hash(id + 0.71)) * FACET_G;
      const d = Math.hypot(mx - px, my - py);
      if (d < d1) {
        d2 = d1;
        d1 = d;
        const a = (hash(id + 1.3) - 0.5) * 0.0026, b = (hash(id + 2.9) - 0.5) * 0.0026, c = (hash(id + 4.1) - 0.5) * 0.06;
        h = c + a * (mx - px) + b * (my - py);
        sh = hash(id + 6.7) * 2 - 1;
      } else if (d < d2) d2 = d;
    }
  return {h, e: (d2 - d1) / 2, s: sh};
};
/** slowly flowing ripples of the liquid (material space, advected by `flow`) */
const ripple = (x: number, y: number, t: number) =>
  0.032 * Math.sin(0.082 * x + 0.041 * y + 1.25 * t) + 0.024 * Math.sin(-0.052 * x + 0.093 * y - 0.95 * t + 1.7) + 0.014 * Math.sin(0.15 * x - 0.11 * y + 1.9 * t + 0.4);

/** the melt front (screen): liquid below y = front (+ a gentle wave). 0 solid .. 1 liquid */
export const frontY = (x: number, front: number, t: number) => front + 14 * Math.sin(x * 0.011 + t * 2.6) + 7 * Math.sin(x * 0.027 - t * 3.7 + 1);
export const liqAt = (x: number, y: number, front: number, t: number) => ss(y - frontY(x, front, t), -26, 26);

export type MatrixProps = {
  t: number;
  view: MicroView;
  /** melt front (screen y): below it the matrix is liquid. Use +1e6 for all solid, -1e6 for all liquid */
  front: number;
  /** material advection of the liquid ripples (material px) */
  flow?: V;
  /** lattice cell (px); default 10 (ChromeSurface's) */
  cell?: number;
  /** grain-boundary visibility 0..1 (multiplied by the detail weight) */
  bounds?: number;
  /** weight of ChromeSurface's broad outer reflections (1 = exactly ChromeSurface at Z 1); the rest is the flat mean h0 */
  outer?: number;
  h0?: number;
  /** multiplier of the fine-structure weight (0 = the plain zoomed ChromeSurface) */
  detail?: number;
};

/** the silver gallium matrix (full frame) */
export const MicroMatrix: React.FC<MatrixProps> = ({t, view, front, flow = {x: 0, y: 0}, cell = 10, bounds = 1, outer = 1, h0 = 0.47, detail = 1}) => {
  const L = lattice({x0: -40, y0: -40, x1: 1120, y1: 1960}, cell);
  const N = L.nx * L.ny;
  const hv = new Float32Array(N), pv = new Float32Array(N), bv = new Float32Array(N), sv = new Float32Array(N);
  const w = microDetail(view.Z) * detail;
  const glints = view.Z < 2.6;
  const bw = 3.0 / view.Z; // grain boundary half width: ~3 px on screen
  const showB = w * bounds > 0.02;
  for (let j = 0; j < L.ny; j++)
    for (let i = 0; i < L.nx; i++) {
      const x = L.x0 + i * L.cell, y = L.y0 + j * L.cell;
      const mx = view.F.x + (x - MC.x) / view.Z, my = view.F.y + (y - MC.y) / view.Z;
      let h = outer > 0.999 ? surfaceHeight(mx, my, t) : outer * surfaceHeight(mx, my, t) + (1 - outer) * h0;
      const k = j * L.nx + i;
      if (w > 0.001) {
        const lq = liqAt(x, y, front, t);
        const fc = lq < 0.999 ? facet(mx, my) : {h: 0, e: 1e9, s: 0};
        const rp = lq > 0.001 ? ripple(mx - flow.x, my - flow.y, t) : 0;
        h += w * (fc.h * (1 - lq) + rp * lq);
        bv[k] = showB ? Math.max(fc.e - bw, (lq - 0.5) * 8) * view.Z : 1e3;
        sv[k] = lq < 0.5 ? fc.s : 0;
      } else bv[k] = 1e3;
      hv[k] = h;
      if (glints) pv[k] = mx / 1080 + 0.9 * surfaceSlopeU(mx, my, t);
    }
  const Ek = (h: number) => (0.55 - h) * 2.1;
  const region = (fn: (q: number) => number, minA = 4) => {
    const a = new Float32Array(N);
    for (let q = 0; q < N; q++) a[q] = fn(q);
    return loopsPath(marchLoops(a, L, 0), minA);
  };
  const above = (e: number) => region((q) => (e - Ek(hv[q])) * 400);
  const below = (e: number) => region((q) => (Ek(hv[q]) - e) * 400);
  const between = (e0: number, e1: number) => region((q) => Math.max(e0 - Ek(hv[q]), Ek(hv[q]) - e1) * 400);
  let glint = '', glint2 = '';
  if (glints) {
    const gx = 0.36 + 0.05 * Math.sin(0.55 * t + 0.4), gy = 0.25 + 0.014 * Math.sin(0.45 * t + 1);
    const rbox = (p: number, h: number, cx: number, cy: number, a: number, b: number, r: number) => {
      const qx = Math.abs(p - cx) - (a - r), qy = Math.abs(h - cy) - (b - r);
      return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
    };
    // the window glint lives in the OUTER surface (material) coordinates: it scales away with the zoom
    const hO = new Float32Array(N);
    for (let j = 0; j < L.ny; j++)
      for (let i = 0; i < L.nx; i++) {
        const x = L.x0 + i * L.cell, y = L.y0 + j * L.cell;
        hO[j * L.nx + i] = surfaceHeight(view.F.x + (x - MC.x) / view.Z, view.F.y + (y - MC.y) / view.Z, t);
      }
    glint = region((q) => {
      const p = pv[q], h = hO[q];
      const ww = rbox(p, h, gx, gy, 0.2, 0.085, 0.025);
      const mull = Math.min(Math.abs(p - gx + 0.01 * (h - gy)) - 0.01, Math.abs(h - gy - 0.004) - 0.007);
      return Math.max(ww, -mull) * 1080 * view.Z;
    }, 6);
    glint2 = region((q) => rbox(pv[q], hO[q], gx + 0.4, gy + 0.035, 0.06, 0.026, 0.014) * 1080 * view.Z, 6);
  }
  const bnd = showB ? region((q) => bv[q], 3) : '';
  // crystal grains: a few cells a touch lighter, a few a touch darker (a subtle polycrystalline mosaic)
  const cLit = showB ? region((q) => (0.4 - sv[q]) * 100, 8) : '';
  const cDark = showB ? region((q) => (sv[q] + 0.45) * 100, 8) : '';
  const ids = {a: uid('mxA'), b: uid('mxB'), v: uid('mxV'), g: uid('mxG'), s: uid('mxS')};
  return (
    <g>
      <defs>
        <linearGradient id={ids.a} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="420" y2="1920">
          <stop offset="0" stopColor={CHROME.base0} />
          <stop offset="0.5" stopColor={CHROME.base1} />
          <stop offset="1" stopColor={CHROME.base2} />
        </linearGradient>
        <linearGradient id={ids.s} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="300" y2="800">
          <stop offset="0" stopColor={CHROME.hot} />
          <stop offset="0.55" stopColor={CHROME.sky} />
          <stop offset="1" stopColor="#C9D7E6" />
        </linearGradient>
        <linearGradient id={ids.b} gradientUnits="userSpaceOnUse" x1="0" y1="1000" x2="1080" y2="1300">
          <stop offset="0" stopColor={CHROME.band1} />
          <stop offset="1" stopColor={CHROME.band0} />
        </linearGradient>
        <linearGradient id={ids.g} gradientUnits="userSpaceOnUse" x1="0" y1="1150" x2="0" y2="1920">
          <stop offset="0" stopColor={CHROME.floor0} />
          <stop offset="1" stopColor={CHROME.floor1} />
        </linearGradient>
        <radialGradient id={ids.v} gradientUnits="userSpaceOnUse" cx="480" cy="860" r="1300">
          <stop offset="0.62" stopColor={C.navy0} stopOpacity={0} />
          <stop offset="1" stopColor={C.navy0} stopOpacity={0.45} />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill={`url(#${ids.a})`} />
      <path d={below(ENV.band1)} fill={`url(#${ids.g})`} fillRule="evenodd" />
      <path d={below(ENV.low)} fill={CHROME.low} opacity={0.9} fillRule="evenodd" />
      <path d={between(ENV.band0, ENV.band1)} fill={`url(#${ids.b})`} fillRule="evenodd" />
      <path d={between(ENV.band1 + 0.015, ENV.band1 + 0.04)} fill="#FFFFFF" opacity={0.55} fillRule="evenodd" />
      <path d={above(ENV.sky)} fill={`url(#${ids.s})`} fillRule="evenodd" />
      <path d={above(ENV.hot + 0.25)} fill={CHROME.hot} fillRule="evenodd" />
      <path d={between(0.12, 0.15)} fill={CHROME.sky} opacity={0.7} fillRule="evenodd" />
      {cLit && <path d={cLit} fill="#FFFFFF" opacity={f3(0.16 * w * bounds)} fillRule="evenodd" />}
      {cDark && <path d={cDark} fill={C.navy2} opacity={f3(0.14 * w * bounds)} fillRule="evenodd" />}
      {bnd && <path d={bnd} fill={C.navy1} opacity={f3(0.42 * w * bounds)} fillRule="evenodd" />}
      {glint && <path d={glint} fill="#FFFFFF" fillRule="evenodd" />}
      {glint2 && <path d={glint2} fill="#FFFFFF" opacity={0.9} fillRule="evenodd" />}
      <rect x={0} y={0} width={1080} height={1920} fill={`url(#${ids.v})`} />
    </g>
  );
};

/** the melt front as a warm glowing seam (screen) */
export const MeltFrontLine: React.FC<{front: number; t: number; amt: number}> = ({front, t, amt}) => {
  if (amt <= 0.01 || front < -60 || front > 1990) return null;
  const pts: V[] = [];
  for (let x = -40; x <= 1120; x += 20) pts.push({x, y: frontY(x, front, t)});
  const d = 'M' + pts.map((p) => `${f1(p.x)},${f1(p.y)}`).join('L');
  return (
    <g opacity={f3(amt)}>
      <path d={d} fill="none" stroke={C.heat} strokeWidth={26} opacity={0.22} strokeLinecap="round" />
      <path d={d} fill="none" stroke={C.heat} strokeWidth={9} opacity={0.6} strokeLinecap="round" />
      <path d={d} fill="none" stroke="#FFE2B8" strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};

// =====================================================================================================================
// THE NdFeB MICROPARTICLES
// =====================================================================================================================
export type Grain = {key: number; m0: V; r: number; layer: number; ang0: number; shape: V[]; seed: number};
/** depth layers: grid spacing, presence, radius (material px), parallax depth, haze */
export const GRAIN_LAYERS = [
  {g: 31, p: 0.46, r: 4.2, dl: 1, haze: 0},
  {g: 27, p: 0.34, r: 3.0, dl: 0.88, haze: 0.38},
  {g: 23, p: 0.3, r: 2.2, dl: 0.78, haze: 0.62},
];
/** on-screen radius of a grain of material radius r at zoom Z (a gentle cheat: grains stay readable when zoomed out) */
export const grainPx = (r: number, Z: number) => r * Math.pow(Math.max(Z, 1e-3), 0.85) * 1.45;

const grainShape = (seed: number): V[] => {
  const n = 6 + Math.floor(hash(seed + 0.5) * 3);
  const out: V[] = [];
  for (let i = 0; i < n; i++) {
    const a = ((i + 0.3 * (hash(seed + i * 1.7) - 0.5)) / n) * Math.PI * 2;
    const rr = 0.72 + 0.42 * hash(seed + i * 3.1 + 9);
    // elongated along the moment axis (x) a little
    out.push({x: Math.cos(a) * rr * 1.18, y: Math.sin(a) * rr * 0.86});
  }
  return out;
};

/** the grains whose material base position m0 (+ `shift`) can be on screen in `view` (pad px) */
export const grainsIn = (view: MicroView, shift: V = {x: 0, y: 0}, pad = 140): Grain[] => {
  const out: Grain[] = [];
  GRAIN_LAYERS.forEach((Ly, li) => {
    const a = screenToMicro(view, {x: -pad, y: -pad}, Ly.dl), b = screenToMicro(view, {x: 1080 + pad, y: 1920 + pad}, Ly.dl);
    const i0 = Math.floor((a.x - shift.x) / Ly.g) - 1, i1 = Math.ceil((b.x - shift.x) / Ly.g) + 1;
    const j0 = Math.floor((a.y - shift.y) / Ly.g) - 1, j1 = Math.ceil((b.y - shift.y) / Ly.g) + 1;
    if ((i1 - i0) * (j1 - j0) > 20000) return;
    for (let j = j0; j <= j1; j++)
      for (let i = i0; i <= i1; i++) {
        const seed = i * 13.37 + j * 71.9 + li * 517.3;
        if (hash(seed) > Ly.p) continue;
        const m0 = {x: (i + 0.15 + 0.7 * hash(seed + 0.11)) * Ly.g, y: (j + 0.15 + 0.7 * hash(seed + 0.23)) * Ly.g};
        out.push({key: seed, m0, r: Ly.r * (0.78 + 0.44 * hash(seed + 0.37)), layer: li, ang0: hash(seed + 0.53) * Math.PI * 2, shape: grainShape(seed), seed});
      }
  });
  return out;
};

/** clip a polygon to the half plane a*x + b*y + c >= 0 */
const clipHalf = (P: V[], a: number, b: number, c: number): V[] => {
  const out: V[] = [];
  for (let i = 0; i < P.length; i++) {
    const p = P[i], q = P[(i + 1) % P.length];
    const fp = a * p.x + b * p.y + c, fq = a * q.x + b * q.y + c;
    if (fp >= 0) out.push(p);
    if ((fp >= 0) !== (fq >= 0)) {
      const u = fp / (fp - fq);
      out.push({x: p.x + (q.x - p.x) * u, y: p.y + (q.y - p.y) * u});
    }
  }
  return out;
};
const polyD = (P: V[]) => (P.length < 3 ? '' : 'M' + P.map((p) => `${f1(p.x)},${f1(p.y)}`).join('L') + 'Z');

export const MATRIX_MID = '#9AA9BD';
/** one placed grain: screen centre, radius px, moment angle (rad, screen; the N end points along it), alpha */
export type GrainDraw = {g: Grain; p: V; r: number; ang: number; a: number; menis?: number};
export const MicroGrains: React.FC<{grains: GrainDraw[]}> = ({grains}) => {
  // deep layers first
  const sorted = [...grains].sort((u, v) => v.g.layer - u.g.layer || u.g.key - v.g.key);
  return (
    <g>
      {sorted.map((G) => {
        if (G.a <= 0.01 || G.r < 1.2) return null;
        if (G.p.x < -G.r * 2 || G.p.x > 1080 + G.r * 2 || G.p.y < -G.r * 2 || G.p.y > 1920 + G.r * 2) return null;
        const haze = GRAIN_LAYERS[G.g.layer].haze;
        const c = Math.cos(G.ang), s = Math.sin(G.ang);
        const toS = (q: V): V => ({x: G.p.x + (q.x * c - q.y * s) * G.r, y: G.p.y + (q.x * s + q.y * c) * G.r});
        const poly = G.g.shape.map(toS);
        // N half: local x >= 0 (along the moment); S half: x <= 0. In screen: (p - centre) . (c, s)
        const nHalf = clipHalf(poly, c, s, -(c * G.p.x + s * G.p.y));
        const sHalf = clipHalf(poly, -c, -s, c * G.p.x + s * G.p.y);
        const body = mix('#262E3E', MATRIX_MID, haze * 0.85);
        const lt = {x: -0.6, y: -0.8};
        const facetP = poly.map((q) => ({x: G.p.x + (q.x - G.p.x) * 0.52 + lt.x * G.r * 0.24, y: G.p.y + (q.y - G.p.y) * 0.52 + lt.y * G.r * 0.24}));
        // glint: the edge whose outward normal faces the key light the most
        let bi = 0, bd = -1e9;
        for (let i = 0; i < poly.length; i++) {
          const p = poly[i], q = poly[(i + 1) % poly.length];
          const mx = (p.x + q.x) / 2 - G.p.x, my = (p.y + q.y) / 2 - G.p.y;
          const dd = (mx * lt.x + my * lt.y) / (Math.hypot(mx, my) || 1);
          if (dd > bd) {
            bd = dd;
            bi = i;
          }
        }
        const ga = poly[bi], gb = poly[(bi + 1) % poly.length];
        const inkW = clamp(G.r * 0.065, 1.1, 3.2) * (1 - haze * 0.6);
        const shadow = poly.map((q) => ({x: q.x + G.r * 0.16, y: q.y + G.r * 0.22}));
        const men = (G.menis ?? 1) * (1 - haze);
        const mr = G.r * 1.32;
        const arc = (a0: number, a1: number) => `M${f1(G.p.x + Math.cos(a0) * mr)},${f1(G.p.y + Math.sin(a0) * mr)} A${f1(mr)},${f1(mr)} 0 0 1 ${f1(G.p.x + Math.cos(a1) * mr)},${f1(G.p.y + Math.sin(a1) * mr)}`;
        return (
          <g key={G.g.key} opacity={f3(G.a)}>
            <path d={polyD(shadow)} fill={C.navy0} opacity={f3(0.32 * (1 - haze))} />
            {men > 0.02 && G.r > 6 && (
              <>
                <path d={arc(Math.PI * 1.05, Math.PI * 1.62)} fill="none" stroke="#FFFFFF" strokeWidth={f1(Math.max(1.2, G.r * 0.07))} strokeLinecap="round" opacity={f3(0.55 * men)} />
                <path d={arc(Math.PI * 0.05, Math.PI * 0.62)} fill="none" stroke={C.navy1} strokeWidth={f1(Math.max(1.2, G.r * 0.06))} strokeLinecap="round" opacity={f3(0.3 * men)} />
              </>
            )}
            <path d={polyD(poly)} fill={body} />
            <path d={polyD(nHalf)} fill={mix(body, C.north, 0.42 * (1 - haze * 0.6))} />
            <path d={polyD(sHalf)} fill={mix(body, C.south, 0.42 * (1 - haze * 0.6))} />
            <path d={polyD(facetP)} fill="#FFFFFF" opacity={f3(0.16 * (1 - haze))} />
            <path d={polyD(poly)} fill="none" stroke={INK} strokeWidth={f1(inkW)} strokeLinejoin="round" />
            {G.r > 5 && <path d={`M${f1(ga.x)},${f1(ga.y)}L${f1(gb.x)},${f1(gb.y)}`} stroke="#FFFFFF" strokeWidth={f1(Math.max(1.1, G.r * 0.08))} strokeLinecap="round" opacity={f3(0.85 * (1 - haze * 0.7))} />}
          </g>
        );
      })}
    </g>
  );
};

// =====================================================================================================================
// THE GAUGE (vertical thermometer)
// =====================================================================================================================
export type GaugeGeo = {x: number; top: number; bot: number; bulbY: number; bulbR: number; w: number; t0: number; t1: number};
export const GAUGE: GaugeGeo = {x: 800, top: 470, bot: 1062, bulbY: 1112, bulbR: 50, w: 58, t0: 15, t1: 40};
export const gaugeY = (g: GaugeGeo, temp: number) => g.bot - ((temp - g.t0) / (g.t1 - g.t0)) * (g.bot - g.top);
export const Gauge: React.FC<{g?: GaugeGeo; temp: number; t: number; dx?: number; marks: {temp: number; amt: number; color: string}[]; heat?: number}> = ({g = GAUGE, temp, t, dx = 0, marks, heat = 1}) => {
  const x = g.x + dx;
  const hw = g.w / 2;
  const ids = {glass: uid('gaG'), col: uid('gaC'), clip: uid('gaK')};
  const yT = gaugeY(g, temp);
  const tube = `M${f1(x - hw)},${f1(g.top + hw)} A${f1(hw)},${f1(hw)} 0 0 1 ${f1(x + hw)},${f1(g.top + hw)} L${f1(x + hw)},${f1(g.bulbY - g.bulbR * 0.8)} A${f1(g.bulbR)},${f1(g.bulbR)} 0 1 1 ${f1(x - hw)},${f1(g.bulbY - g.bulbR * 0.8)} Z`;
  const iw = hw * 0.5;
  const colTop = Math.min(g.bulbY, yT);
  const shimmer = 0.5 + 0.5 * Math.sin(t * 9);
  const colC = mix(C.heat, C.red, clamp((temp - 26) / 10));
  return (
    <g>
      <defs>
        <linearGradient id={ids.glass} gradientUnits="userSpaceOnUse" x1={f1(x - hw)} y1="0" x2={f1(x + hw)} y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.5} />
          <stop offset="0.35" stopColor="#E9F2FA" stopOpacity={0.22} />
          <stop offset="1" stopColor="#9FB3C8" stopOpacity={0.35} />
        </linearGradient>
        <linearGradient id={ids.col} gradientUnits="userSpaceOnUse" x1={f1(x - iw)} y1="0" x2={f1(x + iw)} y2="0">
          <stop offset="0" stopColor="#FFD2A8" />
          <stop offset="0.4" stopColor={colC} />
          <stop offset="1" stopColor={mix(colC, C.redDeep, 0.5)} />
        </linearGradient>
      </defs>
      {/* soft shadow */}
      <path d={tube} transform="translate(8 10)" fill={C.navy0} opacity={0.35} />
      <path d={tube} fill={C.navy1} opacity={0.78} />
      {/* scale ticks every 1 C (long every 5) */}
      {Array.from({length: g.t1 - g.t0 + 1}, (_, i) => g.t0 + i).map((c) => {
        const y = gaugeY(g, c);
        const long = c % 5 === 0;
        return <path key={c} d={`M${f1(x + hw + 6)},${f1(y)}L${f1(x + hw + (long ? 26 : 14))},${f1(y)}`} stroke="#DCE7F2" strokeWidth={long ? 3 : 2} opacity={long ? 0.75 : 0.45} strokeLinecap="round" />;
      })}
      {/* the column */}
      <path d={`M${f1(x - iw)},${f1(colTop)} L${f1(x + iw)},${f1(colTop)} L${f1(x + iw)},${f1(g.bulbY)} L${f1(x - iw)},${f1(g.bulbY)} Z`} fill={`url(#${ids.col})`} />
      <circle cx={f1(x)} cy={f1(g.bulbY)} r={f1(g.bulbR * 0.72)} fill={`url(#${ids.col})`} />
      <ellipse cx={f1(x)} cy={f1(colTop)} rx={f1(iw)} ry={f1(iw * 0.35)} fill="#FFE6CC" opacity={0.6 + 0.3 * shimmer * heat} />
      {/* marked readings: a bright tick across the tube */}
      {marks.map((mk, i) => {
        if (mk.amt <= 0.01) return null;
        const y = gaugeY(g, mk.temp);
        return (
          <g key={i} opacity={f3(clamp(mk.amt))}>
            <path d={`M${f1(x - hw - 34)},${f1(y)}L${f1(x + hw + 30)},${f1(y)}`} stroke={INK} strokeWidth={9} strokeLinecap="round" />
            <path d={`M${f1(x - hw - 34)},${f1(y)}L${f1(x + hw + 30)},${f1(y)}`} stroke={mk.color} strokeWidth={5} strokeLinecap="round" />
          </g>
        );
      })}
      {/* glass */}
      <path d={tube} fill={`url(#${ids.glass})`} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d={`M${f1(x - hw * 0.52)},${f1(g.top + hw * 1.2)} L${f1(x - hw * 0.52)},${f1(g.bulbY - g.bulbR * 1.4)}`} stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.75} />
      <path d={`M${f1(x - g.bulbR * 0.55)},${f1(g.bulbY - g.bulbR * 0.35)} A${f1(g.bulbR * 0.62)},${f1(g.bulbR * 0.62)} 0 0 1 ${f1(x - g.bulbR * 0.1)},${f1(g.bulbY - g.bulbR * 0.66)}`} fill="none" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.7} />
    </g>
  );
};

// =====================================================================================================================
// THE EXTERNAL MAGNET (2D bar magnet) + its dipole field
// =====================================================================================================================
/** a magnet in material space: N-face centre, unit axis pointing OUT of the N face, length / thickness (material px) */
export type Magnet2 = {n: V; ax: V; len: number; th: number};
export const magnetPoles = (M: Magnet2) => {
  const k = M.len * 0.2;
  return {N: {x: M.n.x - M.ax.x * k, y: M.n.y - M.ax.y * k}, S: {x: M.n.x - M.ax.x * (M.len - k), y: M.n.y - M.ax.y * (M.len - k)}};
};
/** 2D dipole field (two poles, 1/r^2 falloff), direction N -> S outside the magnet */
export const dipoleField = (M: Magnet2, p: V): V => {
  const {N, S} = magnetPoles(M);
  const ax = p.x - N.x, ay = p.y - N.y, bx = p.x - S.x, by = p.y - S.y;
  const ra = Math.max(1, (ax * ax + ay * ay) ** 1.5), rb = Math.max(1, (bx * bx + by * by) ** 1.5);
  return {x: ax / ra - bx / rb, y: ay / ra - by / rb};
};
/** field lines (material space) through seeds, traced both ways; ordered from the N side to the S side */
export const fieldLines = (M: Magnet2, seeds: V[], step = 3, maxN = 700): V[][] => {
  const {N, S} = magnetPoles(M);
  const inside = (p: V) => {
    const rx = p.x - M.n.x, ry = p.y - M.n.y;
    const u = -(rx * M.ax.x + ry * M.ax.y), v = rx * -M.ax.y + ry * M.ax.x;
    return u > -2 && u < M.len + 2 && Math.abs(v) < M.th / 2 + 2;
  };
  const trace = (s: V, dir: 1 | -1) => {
    const pts: V[] = [];
    let p = {...s};
    for (let n = 0; n < maxN; n++) {
      const f = dipoleField(M, p);
      const l = Math.hypot(f.x, f.y) || 1;
      p = {x: p.x + (dir * step * f.x) / l, y: p.y + (dir * step * f.y) / l};
      if (inside(p)) break;
      if (Math.hypot(p.x - N.x, p.y - N.y) < 4 || Math.hypot(p.x - S.x, p.y - S.y) < 4) break;
      pts.push(p);
    }
    return pts;
  };
  return seeds.map((s) => [...trace(s, -1).reverse(), s, ...trace(s, 1)]);
};

export const Magnet2D: React.FC<{p: V; ang: number; len: number; th: number}> = ({p, ang, len, th}) => {
  // local frame: x from the N face (x = 0) back to the S end (x = len); ang = screen angle of local +x (deg)
  const ids = {n: uid('m2N'), s: uid('m2S')};
  const r = th * 0.12;
  const half = len / 2;
  const fs = th * 0.52;
  return (
    <g transform={`translate(${f1(p.x)} ${f1(p.y)}) rotate(${f1(ang)})`}>
      <defs>
        <linearGradient id={ids.n} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(C.north, '#FFFFFF', 0.35)} />
          <stop offset="0.45" stopColor={C.north} />
          <stop offset="1" stopColor={mix(C.north, C.navy0, 0.45)} />
        </linearGradient>
        <linearGradient id={ids.s} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(C.south, '#FFFFFF', 0.35)} />
          <stop offset="0.45" stopColor={C.south} />
          <stop offset="1" stopColor={mix(C.south, C.navy0, 0.45)} />
        </linearGradient>
      </defs>
      <rect x={f1(len * 0.04)} y={f1(-th / 2 + th * 0.14)} width={f1(len)} height={f1(th)} rx={f1(r)} fill={C.navy0} opacity={0.4} />
      <rect x={0} y={f1(-th / 2)} width={f1(half)} height={f1(th)} rx={f1(r)} fill={`url(#${ids.n})`} />
      <rect x={f1(half)} y={f1(-th / 2)} width={f1(half)} height={f1(th)} rx={f1(r)} fill={`url(#${ids.s})`} />
      <path d={`M${f1(half)},${f1(-th / 2)}L${f1(half)},${f1(th / 2)}`} stroke={INK} strokeWidth={3} />
      <rect x={0} y={f1(-th / 2)} width={f1(len)} height={f1(th)} rx={f1(r)} fill="none" stroke={INK} strokeWidth={4.5} />
      <path d={`M${f1(r + 4)},${f1(-th / 2 + 7)}L${f1(len - r - 4)},${f1(-th / 2 + 7)}`} stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" opacity={0.45} />
      {(['N', 'S'] as const).map((l, i) => (
        <text key={l} x={f1(half * (i + 0.5))} y={0} dy="0.36em" textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={f1(fs)} fill="#FFFFFF" transform={`rotate(${f1(-ang)} ${f1(half * (i + 0.5))} 0)`}>
          {l}
        </text>
      ))}
    </g>
  );
};

/** draw field lines (screen polylines): cyan line + glow + white dashes flowing N -> S; `reveal` 0..1 grows each line
 *  out from its N end (the field arriving) */
export const FieldLinesDraw: React.FC<{lines: {pts: V[]; a: number}[]; t: number; reveal?: number; width?: number; halo?: number}> = ({lines, t, reveal = 1, width = 3.4, halo = 1}) => (
  <g>
    {lines.map((L, i) => {
      if (L.a <= 0.01 || L.pts.length < 2) return null;
      // arc length clip
      let pts = L.pts;
      if (reveal < 0.999) {
        let tot = 0;
        for (let k = 1; k < pts.length; k++) tot += Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y);
        const lim = tot * clamp(reveal);
        const out: V[] = [pts[0]];
        let acc = 0;
        for (let k = 1; k < pts.length; k++) {
          const sl = Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y);
          if (acc + sl > lim) {
            const u = (lim - acc) / (sl || 1);
            out.push({x: pts[k - 1].x + (pts[k].x - pts[k - 1].x) * u, y: pts[k - 1].y + (pts[k].y - pts[k - 1].y) * u});
            break;
          }
          acc += sl;
          out.push(pts[k]);
        }
        pts = out;
      }
      if (pts.length < 2) return null;
      const d = 'M' + pts.map((p) => `${f1(p.x)},${f1(p.y)}`).join('L');
      return (
        <g key={i} opacity={f3(L.a)}>
          <path d={d} fill="none" stroke={C.navy0} strokeWidth={f1(width + 3.2 * halo)} opacity={f3(Math.min(0.85, 0.45 * halo))} strokeLinecap="round" strokeLinejoin="round" />
          <path d={d} fill="none" stroke={C.field} strokeWidth={f1(width * 3.4)} opacity={0.16} strokeLinecap="round" strokeLinejoin="round" />
          <path d={d} fill="none" stroke={C.field} strokeWidth={f1(width)} strokeLinecap="round" strokeLinejoin="round" />
          <path d={d} fill="none" stroke="#E8FBFF" strokeWidth={f1(width * 0.55)} strokeLinecap="round" strokeDasharray="14 46" strokeDashoffset={f1(-t * 140)} opacity={0.9} />
        </g>
      );
    })}
  </g>
);

/** shortest-arc angle interpolation */
export const lerpAng = (a: number, b: number, u: number) => {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * u;
};
void noise1;
