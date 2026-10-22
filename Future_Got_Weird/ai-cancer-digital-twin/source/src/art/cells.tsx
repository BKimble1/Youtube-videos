// Whole cells at tissue scale. A Cell is one membrane outline (double line = bilayer at this scale), cytoplasm,
// nucleus with chromatin and a few organelles. States: divide (two daughters pinch apart), bleb (contained surface
// blebs), die (shrink, condense, fragment into apoptotic bodies that stay together — no spray).
import React from 'react';
import {C, M} from '../theme';
import {blob, blobPts, clamp01, closedPath, lerp, mixHex, noise, P, rand, smooth} from '../kit/core';

const INK = C.ink;

export type CellLook = {fill: string; deep: string; nuc: string; nucDeep: string; edge?: string};
export const LOOK = {
  healthy: {fill: M.healthy, deep: M.healthyDeep, nuc: M.nucleus, nucDeep: M.nucleusDeep} as CellLook,
  tumor: {fill: M.tumor, deep: M.tumorDeep, nuc: '#6E2A47', nucDeep: '#4E1A32'} as CellLook,
  resist: {fill: M.resist, deep: M.resistDeep, nuc: '#3D3A86', nucDeep: '#29266A'} as CellLook,
  tcell: {fill: M.tcell, deep: M.tcellDeep, nuc: '#2F6B52', nucDeep: '#1E4A38'} as CellLook,
};

/** Organic outline with blebs: small round bulges at seeded angles, grown by `bleb`. */
const cellPts = (r: number, seed: number, t: number, bleb: number, n = 22, sx = 1, sy = 1): P[] => {
  const pts: P[] = [];
  const nb = 5 + Math.floor(rand(seed * 3) * 3);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    let k = 1 + 0.05 * noise(i * 0.8 + t * 0.4, seed);
    for (let b = 0; b < nb; b++) {
      const ab = rand(seed * 17 + b) * Math.PI * 2;
      const da = Math.atan2(Math.sin(a - ab), Math.cos(a - ab));
      const grow = smooth(clamp01(bleb * 1.6 - rand(seed * 5 + b) * 0.6)) * (0.8 + 0.4 * Math.sin(t * 3 + b));
      k += 0.22 * grow * Math.exp(-(da * da) / 0.035);
    }
    pts.push([Math.cos(a) * r * k * sx, Math.sin(a) * r * k * sy]);
  }
  return pts;
};

export const Cell: React.FC<{
  x: number; y: number; r: number; seed?: number; t?: number; look?: CellLook; rot?: number;
  divide?: number; bleb?: number; die?: number; detail?: number; lw?: number; op?: number; stretch?: number; chromatin?: number; damage?: number;
}> = ({x, y, r, seed = 1, t = 0, look = LOOK.healthy, rot = 0, divide = 0, bleb = 0, die = 0, detail = 1, lw = 3, op = 1, stretch = 1, chromatin = 0, damage = 0}) => {
  const d = smooth(divide);
  const dieS = smooth(die);
  // apoptosis: shrink + blebs, then the body separates into fragments
  const frag = smooth(clamp01((die - 0.55) / 0.45));
  const rr = r * (1 - 0.22 * dieS) * (divide > 0 ? lerp(1, 0.8, d) : 1);
  const blebAmt = Math.max(bleb, clamp01(die * 1.8)) * (1 - frag);
  const fill = mixHex(look.fill, '#9A7A84', dieS * 0.35);
  if (frag > 0.01) return <g opacity={op} transform={`translate(${x} ${y}) rotate(${rot})`}><Fragments r={rr} seed={seed} t={t} look={look} k={frag} lw={lw} /></g>;

  const bodies: [number, number][] = divide > 0 ? [[-d * r * 0.62, 0], [d * r * 0.62, 0]] : [[0, 0]];
  const shapes = bodies.map(([bx, by], i) => ({bx, by, d: closedPath(cellPts(rr * (divide > 0 ? lerp(1, 0.86, d) : 1), seed + i * 7, t, blebAmt, 22, divide > 0 ? 1 + 0.25 * (1 - d) : stretch, 1).map(([px, py]) => [px + bx, py + by] as P))}));
  return (
    <g opacity={op} transform={`translate(${x} ${y}) rotate(${rot})`}>
      {/* outlines first, fills on top: overlapping daughters read as one pinching cell */}
      {shapes.map((s, i) => <path key={'o' + i} d={s.d} fill={look.deep} stroke={INK} strokeWidth={lw * 2.2} strokeLinejoin="round" />)}
      {shapes.map((s, i) => <path key={'m' + i} d={s.d} fill={look.deep} stroke={mixHex(look.fill, '#ffffff', 0.45)} strokeWidth={lw * 0.9} strokeLinejoin="round" />)}
      {shapes.map((s, i) => (
        <g key={'f' + i}>
          <path d={s.d} fill={fill} transform={`translate(${s.bx} ${s.by}) scale(0.93) translate(${-s.bx} ${-s.by})`} />
        </g>
      ))}
      {detail > 0.3 && shapes.map((s, i) => <Organelles key={'g' + i} cx={s.bx} cy={s.by} r={rr} seed={seed + i * 13} t={t} look={look} op={detail * (1 - dieS * 0.6)} />)}
      {/* nucleus (splits during division) */}
      {(divide > 0 ? [[-d * r * 0.62, 0], [d * r * 0.62, 0]] : [[0, 0]]).map(([nx, ny], i) => {
        const nr = rr * 0.42 * (1 - 0.35 * dieS) * (divide > 0 ? lerp(1, 0.78, d) : 1);
        const nk = divide > 0 ? 1 - 0.35 * Math.sin(d * Math.PI) : 1;
        return <Nucleus key={i} x={nx + rr * 0.08} y={ny - rr * 0.04} r={nr} seed={seed + i * 5} t={t} look={look} condense={dieS + chromatin} squeeze={nk} damage={damage} />;
      })}
    </g>
  );
};

const Organelles: React.FC<{cx: number; cy: number; r: number; seed: number; t: number; look: CellLook; op: number}> = ({cx, cy, r, seed, t, look, op}) => {
  const items: React.ReactNode[] = [];
  for (let i = 0; i < 5; i++) {
    const a = rand(seed * 31 + i) * Math.PI * 2;
    const dd = r * (0.58 + 0.2 * rand(seed * 37 + i));
    const ox = cx + Math.cos(a) * dd, oy = cy + Math.sin(a) * dd;
    const ang = (a * 180) / Math.PI + 90 + noise(t * 0.3 + i, seed) * 10;
    if (i % 2 === 0) {
      // mitochondrion
      items.push(
        <g key={i} transform={`translate(${ox} ${oy}) rotate(${ang})`}>
          <ellipse rx={r * 0.16} ry={r * 0.075} fill={mixHex(look.deep, '#F0A050', 0.35)} stroke={INK} strokeWidth={r * 0.012 + 0.6} />
          <path d={`M ${-r * 0.1} 0 q ${r * 0.025} ${-r * 0.05} ${r * 0.05} 0 t ${r * 0.05} 0 t ${r * 0.05} 0`} fill="none" stroke={INK} strokeWidth={r * 0.01 + 0.4} opacity={0.6} />
        </g>,
      );
    } else {
      // vesicle
      items.push(<circle key={i} cx={ox} cy={oy} r={r * 0.06} fill={mixHex(look.fill, '#ffffff', 0.35)} stroke={INK} strokeWidth={r * 0.01 + 0.5} />);
    }
  }
  return <g opacity={op}>{items}</g>;
};

export const Nucleus: React.FC<{x: number; y: number; r: number; seed: number; t: number; look: CellLook; condense?: number; squeeze?: number; damage?: number}> = ({x, y, r, seed, t, look, condense = 0, squeeze = 1, damage = 0}) => {
  const c = clamp01(condense);
  const nfill = mixHex(look.nuc, '#2A1830', c * 0.5);
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={blob(0, 0, r, seed, t, 0.06, 12, squeeze, 1)} fill={nfill} stroke={INK} strokeWidth={Math.max(1, r * 0.05)} />
      {/* chromatin: loose threads that clump as the cell condenses */}
      {Array.from({length: 6}, (_, i) => {
        const a = rand(seed * 41 + i) * Math.PI * 2, dd = r * 0.45 * rand(seed * 43 + i) * (1 - c * 0.5);
        const px = Math.cos(a) * dd * squeeze, py = Math.sin(a) * dd;
        return c < 0.4 ? (
          <path key={i} d={`M ${px - r * 0.18} ${py} q ${r * 0.09} ${-r * 0.12} ${r * 0.18} 0 t ${r * 0.18} 0`} fill="none" stroke={look.nucDeep} strokeWidth={r * 0.07} strokeLinecap="round" opacity={0.75} />
        ) : (
          <circle key={i} cx={px} cy={py} r={r * (0.1 + 0.08 * c)} fill={look.nucDeep} />
        );
      })}
      {/* DNA breaks (drug damage): small bright gaps */}
      {damage > 0.01 && [0, 1, 2].map((i) => (
        <g key={i} opacity={smooth(clamp01(damage * 2 - i * 0.3))}>
          <circle cx={(rand(seed + i) - 0.5) * r} cy={(rand(seed + i + 9) - 0.5) * r} r={r * 0.12} fill={M.payload} opacity={0.5} />
          <path d={`M ${(rand(seed + i) - 0.5) * r - r * 0.1} ${(rand(seed + i + 9) - 0.5) * r} l ${r * 0.08} ${-r * 0.06} m ${r * 0.04} ${r * 0.06} l ${r * 0.08} ${-r * 0.06}`} stroke="#FFF2C8" strokeWidth={r * 0.04} strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
};

/** Apoptotic bodies: the cell's contents divided into membrane-wrapped fragments that drift apart a little. */
const Fragments: React.FC<{r: number; seed: number; t: number; look: CellLook; k: number; lw: number}> = ({r, seed, t, look, k, lw}) => {
  const n = 6;
  return (
    <g>
      {Array.from({length: n}, (_, i) => {
        const a = (i / n) * Math.PI * 2 + rand(seed + i) * 0.6;
        const dist = r * (0.25 + 0.55 * k) * (0.7 + 0.5 * rand(seed * 3 + i));
        const fr = r * (0.42 - 0.12 * k) * (0.7 + 0.5 * rand(seed * 5 + i));
        const fx = Math.cos(a) * dist, fy = Math.sin(a) * dist;
        const fill = mixHex(look.fill, '#8E7A86', 0.3 + 0.3 * k);
        return (
          <g key={i} transform={`translate(${fx} ${fy})`}>
            <path d={blob(0, 0, fr, seed + i * 3, t, 0.12, 10)} fill={fill} stroke={INK} strokeWidth={lw * 1.4} />
            {i % 2 === 0 && <circle cx={fr * 0.15} cy={-fr * 0.1} r={fr * 0.38} fill={look.nucDeep} />}
          </g>
        );
      })}
    </g>
  );
};

/** A packed tissue field: jittered hex grid of cells within a rectangle. kind(i, x, y) picks a look and options. */
export type TissueCell = {x: number; y: number; r: number; seed: number};
export const tissueGrid = (x0: number, y0: number, x1: number, y1: number, r: number, seed = 1): TissueCell[] => {
  const out: TissueCell[] = [];
  const dx = r * 1.95, dy = r * 1.7;
  let row = 0;
  for (let y = y0; y <= y1; y += dy, row++) {
    for (let x = x0 + (row % 2 ? dx / 2 : 0); x <= x1; x += dx) {
      const s = Math.floor(x * 7 + y * 13 + seed * 101);
      out.push({x: x + (rand(s) - 0.5) * r * 0.35, y: y + (rand(s + 1) - 0.5) * r * 0.35, r: r * (0.88 + 0.18 * rand(s + 2)), seed: (s % 997) + 1});
    }
  }
  return out;
};

/** Blood-vessel / interstitial backdrop: soft fibres and floating protein crowd, drawn behind tissue. */
export const Crowd: React.FC<{x0: number; y0: number; x1: number; y1: number; n?: number; t?: number; seed?: number; color?: string; rmin?: number; rmax?: number; op?: number; speed?: number}> = ({
  x0, y0, x1, y1, n = 40, t = 0, seed = 3, color = M.fluidHi, rmin = 8, rmax = 30, op = 0.5, speed = 1,
}) => (
  <g opacity={op}>
    {Array.from({length: n}, (_, i) => {
      const x = x0 + rand(seed * 97 + i) * (x1 - x0) + noise(t * 0.2 * speed + i, seed) * 30;
      const y = y0 + rand(seed * 89 + i) * (y1 - y0) + noise(t * 0.17 * speed + i * 1.3, seed + 5) * 30;
      const r = rmin + rand(seed * 83 + i) * (rmax - rmin);
      return <path key={i} d={blob(x, y, r, seed + i, t * speed, 0.18, 9)} fill={color} />;
    })}
  </g>
);

export const Ring: React.FC<{x: number; y: number; r: number; color?: string; w?: number; op?: number; dash?: string}> = ({x, y, r, color = '#fff', w = 3, op = 1, dash}) => (
  <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={w} opacity={op} strokeDasharray={dash} />
);

export const blobOf = blobPts;
