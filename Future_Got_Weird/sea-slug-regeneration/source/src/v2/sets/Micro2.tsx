// Scene 4's microscopic layer: tissue of the abandoned body, seen as the camera pushes on through the cut face.
// Screen-space and drawn in layers at three depths (a soft far layer, the focal cell sheet, a soft near layer) that
// scale apart as the push continues. Digestive-gland cells carry stolen chloroplasts; two copepod-like parasites
// are drawn ghosted (translucent, dashed outline) because their role is a hypothesis.
import React from 'react';
import {W, H} from '../../lib';

const rng = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

type Cell = {x: number; y: number; r: number; pts: [number, number][]; chl: {x: number; y: number; a: number; s: number}[]; nuc: [number, number]};
const makeCells = (seed: number, step: number, cols: number, rows: number, chlN: number): Cell[] => {
  const R = rng(seed);
  const out: Cell[] = [];
  for (let j = -rows; j <= rows; j++)
    for (let i = -cols; i <= cols; i++) {
      const x = (i + (j & 1 ? 0.5 : 0)) * step + (R() - 0.5) * step * 0.22;
      const y = j * step * 0.87 + (R() - 0.5) * step * 0.22;
      const r = step * 0.5;
      const pts: [number, number][] = [];
      const n = 7;
      for (let k = 0; k < n; k++) {
        const th = (k / n) * Math.PI * 2 + R() * 0.3;
        const rr = r * (0.9 + R() * 0.16);
        pts.push([x + Math.cos(th) * rr, y + Math.sin(th) * rr]);
      }
      const chl = Array.from({length: chlN}, () => {
        const th = R() * Math.PI * 2, rr = Math.sqrt(R()) * r * 0.62;
        return {x: x + Math.cos(th) * rr, y: y + Math.sin(th) * rr, a: R() * 180, s: 0.8 + R() * 0.45};
      });
      out.push({x, y, r, pts, chl, nuc: [x + (R() - 0.5) * r * 0.5, y + (R() - 0.5) * r * 0.5]});
    }
  return out;
};
const FAR = makeCells(11, 200, 4, 7, 0);
const MID = makeCells(3, 165, 5, 9, 4);
const NEAR = makeCells(7, 260, 3, 5, 3);

/** a smooth closed path through the points (Catmull-Rom as cubic Béziers) */
const blob = (p: [number, number][]) => {
  const n = p.length;
  let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
};

const Sheet: React.FC<{cells: Cell[]; fill: string; edge: string; chl: string; chlHi: string; nuc: string; lw: number}> = ({cells, fill, edge, chl, chlHi, nuc, lw}) => (
  <>
    {cells.map((c, i) => (
      <g key={i}>
        <path d={blob(c.pts)} fill={fill} stroke={edge} strokeWidth={lw} />
        <ellipse cx={c.nuc[0]} cy={c.nuc[1]} rx={c.r * 0.16} ry={c.r * 0.13} fill={nuc} opacity={0.5} />
        {c.chl.map((q, k) => (
          <g key={k} transform={`translate(${q.x.toFixed(1)},${q.y.toFixed(1)}) rotate(${q.a.toFixed(0)}) scale(${q.s.toFixed(2)})`}>
            <ellipse rx={c.r * 0.2} ry={c.r * 0.12} fill={chl} />
            <ellipse cx={-c.r * 0.05} cy={-c.r * 0.035} rx={c.r * 0.09} ry={c.r * 0.04} fill={chlHi} opacity={0.7} />
          </g>
        ))}
      </g>
    ))}
  </>
);

/** a copepod-like parasite (cephalothorax, tapering segments, antennules, two egg sacs), local units ~ length 1 */
const Copepod: React.FC<{L: number; t: number; ph: number}> = ({L, t, ph}) => {
  const segs = [0.0, 0.17, 0.31, 0.43, 0.53];
  const kick = Math.sin(t * 7 + ph) * 0.1;
  return (
    <g>
      {/* egg sacs trailing behind */}
      {[-1, 1].map((s) => (
        <ellipse key={s} cx={L * 0.82} cy={s * L * 0.11} rx={L * 0.2} ry={L * 0.07} fill="#E2A48E" fillOpacity={0.6} stroke="#6E3B36" strokeWidth={3.5} strokeDasharray="9 7" transform={`rotate(${s * (12 + kick * 30)} ${L * 0.62} 0)`} />
      ))}
      {/* body: the big cephalothorax and the tapering segments */}
      {segs.map((x, i) => {
        const w = L * (0.2 - i * 0.033), l = i === 0 ? L * 0.2 : L * 0.075;
        return <ellipse key={i} cx={x * L + (i ? L * 0.1 : 0)} cy={0} rx={l} ry={w} fill="#D58F7A" fillOpacity={0.72} stroke="#5E2F2C" strokeWidth={4.5} strokeDasharray="12 7" />;
      })}
      {/* antennules and the single eye */}
      {[-1, 1].map((s) => (
        <path key={s} d={`M${-L * 0.15},${s * L * 0.06} q${-L * 0.18},${s * (L * 0.2 + kick * L)} ${-L * 0.06},${s * L * 0.42}`} fill="none" stroke="#5E2F2C" strokeWidth={4} strokeLinecap="round" opacity={0.9} />
      ))}
      <circle cx={-L * 0.12} cy={0} r={L * 0.025} fill="#6A2D2D" opacity={0.7} />
    </g>
  );
};

export const Micro2: React.FC<{id: string; op: number; t: number; para: number; zoom: number; reveal: number}> = ({id, op, t, para, zoom, reveal}) => {
  if (op <= 0.001) return null;
  const cx = W / 2, cy = H * 0.47;
  const layer = (k: number, rot: number, node: React.ReactNode) => (
    <g transform={`translate(${cx},${cy}) scale(${k}) rotate(${rot})`}>{node}</g>
  );
  const zf = 0.8 + 0.2 * zoom, zm = zoom, zn = Math.pow(zoom, 1.9);
  const drift = t * 3;
  // parasites move slowly through the gland tissue
  const bugs = [
    {x: -170 + Math.sin(t * 0.9) * 24 + drift * 4, y: -260 + Math.cos(t * 0.7) * 16, a: 28, ph: 0, L: 300},
    {x: 190 - drift * 3, y: 250 + Math.sin(t * 0.8 + 1) * 18, a: 196, ph: 2, L: 260},
  ];
  return (
    <g opacity={op}>
      <defs>
        <filter id={`${id}mcF`} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation={9} /></filter>
        <filter id={`${id}mcN`} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation={16} /></filter>
        <radialGradient id={`${id}mcV`} cx="0.5" cy="0.47" r="0.75">
          <stop offset="0.55" stopColor="#0E2E1C" stopOpacity={0} />
          <stop offset="1" stopColor="#0E2E1C" stopOpacity={0.55} />
        </radialGradient>
        <radialGradient id={`${id}mcR`} cx="0.5" cy="0.47" r="0.7">
          <stop offset={Math.max(0, reveal * 1.2 - 0.2)} stopColor="#fff" />
          <stop offset={Math.min(1, reveal * 1.2)} stopColor="#000" />
        </radialGradient>
        <mask id={`${id}mcM`}><rect width={W} height={H} fill={`url(#${id}mcR)`} /></mask>
      </defs>
      <g mask={`url(#${id}mcM)`}>
        <rect width={W} height={H} fill="#A9CC8A" />
        <g filter={`url(#${id}mcF)`} opacity={0.75}>{layer(zf, 8, <Sheet cells={FAR} fill="#B7D79A" edge="#86B26D" chl="#5E9C47" chlHi="#9CCB6E" nuc="#6E8F55" lw={4} />)}</g>
        {/* a digestive tubule (lumen) crossing the gland, then the focal sheet of cells */}
        {layer(zm, -4, (
          <>
            <Sheet cells={MID} fill="#D3EABA" edge="#7FAE66" chl="#3F8B35" chlHi="#A9DA7A" nuc="#7A9B60" lw={2.6} />
            <path d="M-900,120 C-400,40 -150,170 250,90 S700,10 1000,60 L1000,150 C700,110 520,190 250,180 S-400,140 -900,215Z" fill="#F0F6DF" opacity={0.7} stroke="#8DB875" strokeWidth={3} />
            <g opacity={0.95 * para}>
              {bugs.map((b, i) => (
                <g key={i} transform={`translate(${b.x.toFixed(1)},${b.y.toFixed(1)}) rotate(${(b.a + Math.sin(t * 1.3 + b.ph) * 6).toFixed(1)})`}>
                  <Copepod L={b.L} t={t} ph={b.ph} />
                </g>
              ))}
            </g>
          </>
        ))}
        <g filter={`url(#${id}mcN)`} opacity={0.3}>{layer(zn, 20, <Sheet cells={NEAR} fill="#C5E2A6" edge="#6E9F58" chl="#3B7F33" chlHi="#93C76A" nuc="#678A4F" lw={6} />)}</g>
        <rect width={W} height={H} fill={`url(#${id}mcV)`} />
      </g>
    </g>
  );
};
