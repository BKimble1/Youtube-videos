// V2: same cell field and fibres as V1 (art/Tissue.tsx); fibroblasts are redrawn as organic, attached cells (irregular
// contour, branching processes ending on the matrix, dimensional nucleus) instead of smooth pointed spindles.
// Cultured skin tissue in section, drawn in tissue coordinates (u along the surface, w depth below it) and mapped into
// any scene: the cheek window on the face, the full-frame microscope illustration and the device cross-section all
// draw the SAME cells and fibres, so dives and pull-backs are continuous moves, not cross-fades.
// Scientific basis (simplified): epidermis of keratinocytes on a dermis equivalent of human dermal fibroblasts in a
// collagen gel. Fibroblasts are elongated spindle cells with an oval nucleus; collagen is fibrous, wavy and acellular.
import React from 'react';
import {Pt, lerp, rnd, smooth, path, clamp} from '../lib';

export const EPI = 26; // epidermis thickness (tissue units)
export const DERM = 210; // depth of the dermis bottom
export type TMap = (u: number, w: number) => Pt;

export type Cell = {u: number; w: number; a: number; L: number; Wd: number; ph: number; hero?: string};
// tone 0 = warm tissue colours (seen inside the skin), 1 = cool explanatory microscope palette
export const tc = (tone: number) => {
  const mix = (a: string, b: string) => {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = (s: number) => Math.round(lerp((pa >> s) & 255, (pb >> s) & 255, tone));
    return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
  };
  return {
    matrix: mix('#E7A6A6', '#123E48'),
    matrixDeep: mix('#D58C91', '#0C2F38'),
    fiber: mix('#F7D3CC', '#69C6CC'),
    fiberHi: mix('#FFF0EA', '#A8ECEC'),
    epi: mix('#D98488', '#1F5560'),
    epiCell: mix('#F0B2AE', '#2C6D78'),
    epiEdge: mix('#B9646E', '#59B9C1'),
    cyto: mix('#FFE3DE', '#F5A7B6'),
    cytoEdge: mix('#C8737E', '#E2738C'),
    nuc: mix('#9B5A86', '#5D3B8E'),
    nucHi: mix('#C68AB0', '#8C6BC2'),
    nucleolus: mix('#6E3561', '#36205F'),
  };
};

// deterministic cell field (dermis); a few named hero cells used by the dives
export const HERO = {face: {u: 640, w: 112}, corner: {u: 1180, w: 118}};
export const CELLS: Cell[] = (() => {
  const out: Cell[] = [];
  let i = 0;
  for (let u = -4800; u < 4800; u += 118) {
    for (const row of [0, 1]) {
      const r1 = rnd(++i), r2 = rnd(++i), r3 = rnd(++i);
      const w = row ? 160 + r2 * 26 : 78 + r2 * 22;
      out.push({u: u + (row ? 58 : 0) + (r1 - 0.5) * 40, w, a: (r3 - 0.5) * 34, L: 78 + rnd(++i) * 26, Wd: 15 + rnd(++i) * 5, ph: rnd(++i) * 6.28});
    }
  }
  // hero cells replace whatever is nearest
  const put = (h: {u: number; w: number}, name: string, a: number) => {
    let k = 0, best = 1e9;
    out.forEach((c, j) => { const d = Math.hypot(c.u - h.u, c.w - h.w); if (d < best) { best = d; k = j; } });
    out[k] = {u: h.u, w: h.w, a, L: 104, Wd: 19, ph: 1.1, hero: name};
  };
  put(HERO.face, 'face', -9);
  put(HERO.corner, 'corner', 7);
  return out;
})();

// collagen fibres: long wavy polylines in (u, w)
export const FIBERS = (() => {
  const out: {w0: number; amp: number; f: number; ph: number; u0: number; u1: number; tilt: number; wid: number}[] = [];
  for (let k = 0; k < 165; k++) {
    out.push({w0: EPI + 8 + rnd(500 + k) * (DERM - EPI - 14), amp: 4 + rnd(600 + k) * 7, f: 0.018 + rnd(700 + k) * 0.02, ph: rnd(800 + k) * 6.3,
      u0: -5000 + rnd(900 + k) * 9600, u1: 0, tilt: (rnd(1000 + k) - 0.5) * 0.02, wid: 1.6 + rnd(1100 + k) * 1.6});
    out[k].u1 = out[k].u0 + 500 + rnd(1200 + k) * 900;
  }
  return out;
})();

const fiberPts = (m: TMap, f: (typeof FIBERS)[number], u0: number, u1: number, off = 0) => {
  const pts: Pt[] = [];
  const a = Math.max(f.u0, u0), b = Math.min(f.u1, u1);
  if (b <= a) return pts;
  const n = Math.max(2, Math.ceil((b - a) / 14));
  for (let i = 0; i <= n; i++) {
    const u = lerp(a, b, i / n);
    const w = clamp(f.w0 + f.amp * Math.sin(u * f.f + f.ph) + (u - f.u0) * f.tilt + off, EPI + 3, DERM - 3);
    pts.push(m(u, w));
  }
  return pts;
};

// spindle-shaped fibroblast outline in tissue coords, with slowly extending processes (living cell)
export const cellOutline = (c: Cell, t: number) => {
  const ca = Math.cos((c.a * Math.PI) / 180), sa = Math.sin((c.a * Math.PI) / 180);
  const ext1 = 1 + 0.10 * Math.sin(t * 1.4 + c.ph), ext2 = 1 + 0.10 * Math.sin(t * 1.1 + c.ph + 2);
  const P = (s: number, h: number) => {
    const L = (c.L / 2) * (s > 0 ? ext1 : ext2);
    const x = s * L, y = h;
    return {u: c.u + x * ca - y * sa, w: c.w + x * sa + y * ca};
  };
  const top: {u: number; w: number}[] = [], bot: {u: number; w: number}[] = [];
  const N = 22;
  for (let i = 0; i <= N; i++) {
    const s = -1 + (2 * i) / N;
    // body is widest just behind the nucleus; thin tapering processes at both ends; a slight bend
    const prof = Math.pow(Math.max(0, 1 - s * s), 0.9) * (1 + 0.25 * Math.exp(-((s + 0.1) ** 2) / 0.08));
    const bend = 0.18 * c.Wd * Math.sin(s * 2.2 + c.ph) * s;
    top.push(P(s, -(c.Wd / 2) * prof + bend));
    bot.push(P(s, (c.Wd / 2) * prof + bend));
  }
  return [...top, ...bot.reverse()];
};

export const TissueSection: React.FC<{
  m: TMap; u0: number; u1: number; t: number; tone: number; id: string;
  epidermis?: boolean; detail?: number; // detail 0..1 adds nucleus speckle, fibre highlights
  cellFilter?: (c: Cell) => boolean; extraCells?: Cell[]; matrixOnly?: boolean; flat?: boolean;
}> = ({m, u0, u1, t, tone, id, epidermis = true, detail = 1, cellFilter, extraCells = [], matrixOnly, flat}) => {
  const C = tc(tone);
  const n = Math.max(4, Math.ceil((u1 - u0) / 20));
  const edge = (w: number) => Array.from({length: n + 1}, (_, i) => m(lerp(u0, u1, i / n), w));
  const top = edge(0), epiB = edge(EPI), bot = edge(DERM);
  const band = (a: Pt[], b: Pt[]) => path([...a, ...[...b].reverse()]);
  const cells = [...CELLS.filter((c) => c.u > u0 - 80 && c.u < u1 + 80 && (!cellFilter || cellFilter(c))), ...extraCells];
  const g0 = m(u0, 0), g1 = m(u0, DERM);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-mx`} gradientUnits="userSpaceOnUse" x1={g0.x} y1={g0.y} x2={g1.x} y2={g1.y}>
          <stop offset="0" stopColor={C.matrix} />
          <stop offset="1" stopColor={C.matrixDeep} />
        </linearGradient>
        <radialGradient id={`${id}-cy`} cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.55} />
          <stop offset="0.5" stopColor={C.cyto} stopOpacity={1} />
          <stop offset="1" stopColor={C.cytoEdge} stopOpacity={1} />
        </radialGradient>
        <radialGradient id={`${id}-nu`} cx="0.38" cy="0.35" r="0.75">
          <stop offset="0" stopColor={C.nucHi} />
          <stop offset="1" stopColor={C.nuc} />
        </radialGradient>
        <clipPath id={`${id}-clip`}><path d={band(top, bot)} /></clipPath>
      </defs>
      <path d={band(top, bot)} fill={flat ? C.matrix : `url(#${id}-mx)`} />
      <g clipPath={`url(#${id}-clip)`}>
        {/* collagen fibres: two strands per bundle */}
        {FIBERS.map((f, k) => {
          const a = fiberPts(m, f, u0, u1), b = fiberPts(m, f, u0, u1, f.wid * 1.6);
          if (a.length < 2) return null;
          const fs = scaleOf(m, (Math.max(f.u0, u0) + Math.min(f.u1, u1)) / 2, f.w0);
          return (
            <g key={k} opacity={0.55}>
              <path d={smooth(a)} fill="none" stroke={C.fiber} strokeWidth={f.wid * fs} strokeLinecap="round" />
              <path d={smooth(b)} fill="none" stroke={C.fiber} strokeWidth={f.wid * 0.6 * fs} strokeLinecap="round" opacity={0.7} />
              {detail > 0.5 && <path d={smooth(a)} fill="none" stroke={C.fiberHi} strokeWidth={f.wid * 0.35 * fs} strokeLinecap="round" opacity={0.6} />}
            </g>
          );
        })}
        {!matrixOnly && cells.map((c, k) => <Fibroblast key={k} c={c} m={m} t={t} id={id} C={C} detail={detail} />)}
      </g>
      {epidermis && (
        <g>
          <path d={band(top, epiB)} fill={C.epi} />
          {Array.from({length: Math.ceil((u1 - u0) / 15)}, (_, i) => {
            const u = u0 + i * 15 + (rnd(i * 3) - 0.5) * 3;
            const rows = [{w: 18, r: 7.5}, {w: 8, r: 5.5, sq: 0.55}];
            return rows.map((r, j) => {
              const uu = u + (j ? 7 : 0);
              if (uu > u1 - 4 || uu < u0 + 4) return null;
              const pts = Array.from({length: 12}, (_, q) => {
                const a = (q / 12) * Math.PI * 2;
                return m(uu + Math.cos(a) * r.r * 1.05, r.w + Math.sin(a) * r.r * (r.sq ?? 0.85));
              });
              return <path key={i * 2 + j} d={smooth(pts, true)} fill={C.epiCell} stroke={C.epiEdge} strokeWidth={0.9 * scaleOf(m, uu, 10)} opacity={0.95} />;
            });
          })}
          <path d={smooth(top)} fill="none" stroke={C.fiberHi} strokeWidth={1.6 * scaleOf(m, (u0 + u1) / 2, 0)} opacity={0.7} />
        </g>
      )}
    </g>
  );
};

// local scale of a mapping (world units per tissue unit), used for stroke widths
const scaleOf = (m: TMap, u = 0, w = 100) => {
  const a = m(u, w), b = m(u + 10, w);
  return Math.hypot(b.x - a.x, b.y - a.y) / 10;
};

export const Fibroblast: React.FC<{c: Cell; m: TMap; t: number; id: string; C: ReturnType<typeof tc>; detail: number; glow?: number}> = ({c, m, t, id, C, detail, glow = 0}) => {
  const s = scaleOf(m, c.u, c.w);
  const ca = Math.cos((c.a * Math.PI) / 180), sa = Math.sin((c.a * Math.PI) / 180);
  // local cell frame: x along the axis, y across; -> tissue -> world
  const L = (x: number, y: number) => m(c.u + x * ca - y * sa, c.w + x * sa + y * ca);
  const ph = c.ph;
  const half = c.L / 2, hw = c.Wd / 2;
  // irregular, asymmetric body: blunt trailing end, tapering leading process; slow living contour change
  const prof = (q: number) => {
    const base = Math.pow(Math.max(0, 1 - q * q), q < 0 ? 0.55 : 1.15);
    const wob = 1 + 0.16 * Math.sin(3.1 * q + ph + t * 0.9) + 0.08 * Math.sin(7.3 * q + 2 * ph - t * 0.6);
    return hw * base * wob * (1 + 0.22 * Math.exp(-((q + 0.15) ** 2) / 0.06));
  };
  const bend = (q: number) => 0.22 * hw * Math.sin(q * 2.1 + ph) * q;
  const ext = 1 + 0.07 * Math.sin(t * 1.3 + ph);
  const N = 26, top: Pt[] = [], bot: Pt[] = [];
  for (let i = 0; i <= N; i++) {
    const q = -1 + (2 * i) / N, x = q * half * (q > 0 ? ext : 1);
    top.push(L(x, -prof(q) + bend(q)));
    bot.push(L(x, prof(q) + bend(q)));
  }
  const body = [...top, ...bot.reverse()];
  // processes: two long axial tails and 2-3 side branches, each tapering to a small adhesion foot on the matrix
  // processes: the leading and trailing extensions run ALONG the matrix (near the cell axis); two fine side
  // filopodia hug nearby fibres. All taper to hair-thin tips, so the cell reads as stretched on the matrix, not limbed.
  const procs: {x: number; y: number; ang: number; len: number; w: number}[] = [
    {x: half * 0.92 * ext, y: bend(1), ang: 5 * Math.sin(ph), len: c.L * 0.5, w: hw * 0.3},
    {x: -half * 0.95, y: bend(-1), ang: 180 + 6 * Math.sin(ph * 2), len: c.L * 0.32, w: hw * 0.34},
    {x: half * 0.45, y: -prof(0.45) * 0.9, ang: -22 + 8 * Math.sin(ph * 3), len: c.L * 0.24, w: hw * 0.13},
    {x: -half * 0.4, y: prof(-0.4) * 0.9, ang: 158 + 8 * Math.sin(ph * 5), len: c.L * 0.22, w: hw * 0.12},
  ];
  const procPath = (p: (typeof procs)[number]) => {
    const r = (p.ang * Math.PI) / 180, cr = Math.cos(r), sr = Math.sin(r);
    const nx = -sr, ny = cr;
    const pts1: Pt[] = [], pts2: Pt[] = [];
    for (let i = 0; i <= 8; i++) {
      const k = i / 8, curve = 0.1 * p.len * Math.sin(k * 2.2 + ph) * k;
      const x = p.x + cr * p.len * k + nx * curve, y = p.y + sr * p.len * k + ny * curve;
      const w = p.w * Math.pow(1 - k, 1.4) + 0.02 * hw;
      pts1.push(L(x + nx * w, y + ny * w));
      pts2.push(L(x - nx * w, y - ny * w));
    }
    const tip = L(p.x + cr * p.len + nx * 0.1 * p.len * Math.sin(2.2 + ph), p.y + sr * p.len + ny * 0.1 * p.len * Math.sin(2.2 + ph));
    return {d: smooth(pts1) + 'L' + [...pts2].reverse().map((q) => `${q.x.toFixed(2)} ${q.y.toFixed(2)}`).join('L') + 'Z', tip};
  };
  const P = procs.map(procPath);
  const nr = c.L * 0.14, nh = hw * 0.62;
  const nucPts = Array.from({length: 18}, (_, q) => {
    const a = (q / 18) * Math.PI * 2;
    const rr = 1 + 0.05 * Math.sin(a * 3 + ph);
    return L(-c.L * 0.06 + Math.cos(a) * nr * rr, bend(-0.1) + Math.sin(a) * nh * rr);
  });
  const nucShadow = nucPts.map((p) => ({x: p.x + 1.6 * s, y: p.y + 2.4 * s}));
  const lineAlong = (y: number) => smooth(Array.from({length: 9}, (_, i) => { const q = -0.85 + (i / 8) * 1.7; return L(q * half, y * prof(q) + bend(q)); }));
  return (
    <g>
      {glow > 0 && <path d={smooth(body, true)} fill="none" stroke="#BFF7F2" strokeWidth={6 * s} opacity={0.5 * glow} />}
      {P.map((p, k) => <path key={k} d={p.d} fill={C.cyto} stroke={C.cytoEdge} strokeWidth={0.9 * s} opacity={0.95} />)}
      <path d={smooth(body, true)} fill={`url(#${id}-cy)`} stroke={C.cytoEdge} strokeWidth={1.2 * s} />
      {detail > 0.6 && [-0.45, 0, 0.45].map((y, k) => <path key={k} d={lineAlong(y)} fill="none" stroke={C.cytoEdge} strokeWidth={0.7 * s} opacity={0.28} />)}
      {/* perinuclear zone, cast shadow, nucleus with envelope, chromatin and nucleoli */}
      <path d={smooth(nucPts.map((p, i) => ({x: lerp(p.x, L(-c.L * 0.06, bend(-0.1)).x, -0.35), y: lerp(p.y, L(-c.L * 0.06, bend(-0.1)).y, -0.35)})), true)} fill={C.cytoEdge} opacity={0.16} />
      <path d={smooth(nucShadow, true)} fill={C.nucleolus} opacity={0.28} />
      <path d={smooth(nucPts, true)} fill={`url(#${id}-nu)`} stroke={C.nucleolus} strokeWidth={1.1 * s} />
      {detail > 0.3 && (() => {
        const a = L(-c.L * 0.06 + nr * 0.3, bend(-0.1) - nh * 0.2), b = L(-c.L * 0.06 - nr * 0.35, bend(-0.1) + nh * 0.25);
        return (
          <g>
            <circle cx={a.x} cy={a.y} r={nh * 0.26 * s} fill={C.nucleolus} />
            {detail > 0.6 && <circle cx={b.x} cy={b.y} r={nh * 0.16 * s} fill={C.nucleolus} opacity={0.8} />}
          </g>
        );
      })()}
      {detail > 0.6 && Array.from({length: 9}, (_, k) => {
        const p = L(-c.L * 0.06 + (rnd(k + c.u) - 0.5) * nr * 1.4, bend(-0.1) + (rnd(k * 7 + c.w) - 0.5) * nh * 1.3);
        return <circle key={k} cx={p.x} cy={p.y} r={nh * (0.07 + 0.05 * rnd(k * 3 + c.u)) * s} fill={k % 3 ? C.nucHi : C.nucleolus} opacity={0.55} />;
      })}
      {detail > 0.3 && (() => { const h = L(-c.L * 0.06 - nr * 0.35, bend(-0.1) - nh * 0.45); return <ellipse cx={h.x} cy={h.y} rx={nr * 0.35 * s} ry={nh * 0.16 * s} fill="#FFFFFF" opacity={0.35} transform={`rotate(${c.a} ${h.x} ${h.y})`} />; })()}
    </g>
  );
};
