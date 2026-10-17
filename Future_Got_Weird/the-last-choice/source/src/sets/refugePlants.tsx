// Refuge greenery and soft background figures (shared by the exterior and the interior).
import React from 'react';
import {REF, C} from '../theme';
import {rnd, noise, lerp} from '../kit/math';

/** A single broad leaf pointing along +x from (0,0): length L, width W. */
export const leafPath = (L: number, W: number, curl = 0) =>
  `M 0 0 C ${L * 0.25} ${-W * 0.9 + curl} ${L * 0.7} ${-W * 0.7 + curl * 1.5} ${L} ${curl * 2} C ${L * 0.7} ${W * 0.55 + curl * 1.5} ${L * 0.25} ${W * 0.75 + curl} 0 0 Z`;

export type PlantProps = {x: number; y: number; s?: number; t?: number; seed?: number; ink?: number; kind?: 'tall' | 'bush' | 'fern' | 'palm'; pot?: boolean; tint?: number};
/** A potted plant standing on (x, y). s = 1 → about 1.6 m (400 units) for 'tall'. */
export const Plant: React.FC<PlantProps> = ({x, y, s = 1, t = 0, seed = 1, ink = 4, kind = 'tall', pot = true}) => {
  const leaves: React.ReactElement[] = [];
  const potH = pot ? 110 * s : 0;
  const base = {x, y: y - potH};
  const n = kind === 'bush' ? 11 : kind === 'fern' ? 14 : kind === 'palm' ? 9 : 8;
  const sw = noise(t * 0.35, seed) * 3;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    let ang: number, L: number, W: number, stem: number;
    if (kind === 'palm') { ang = lerp(-160, -20, u) + (rnd(seed * 3 + i) - 0.5) * 14; L = 300 * s * (0.8 + 0.3 * rnd(seed * 5 + i)); W = 34 * s; stem = 420 * s; }
    else if (kind === 'fern') { ang = lerp(-170, -10, u) + (rnd(seed * 3 + i) - 0.5) * 12; L = 170 * s * (0.7 + 0.5 * rnd(seed * 5 + i)); W = 20 * s; stem = 10 * s; }
    else if (kind === 'bush') { ang = lerp(-165, -15, u) + (rnd(seed * 3 + i) - 0.5) * 25; L = 120 * s * (0.75 + 0.4 * rnd(seed * 5 + i)); W = 46 * s; stem = 30 * s * rnd(seed * 9 + i); }
    else { ang = lerp(-150, -30, u) + (rnd(seed * 3 + i) - 0.5) * 20; L = 190 * s * (0.75 + 0.45 * rnd(seed * 5 + i)); W = 70 * s; stem = (60 + 200 * rnd(seed * 7 + i)) * s; }
    const a = ang + sw * (0.5 + u);
    const sx = base.x + Math.cos((-90 * Math.PI) / 180) * 0, sy = base.y - stem * (kind === 'palm' ? 1 : 0.6);
    const col = i % 3 === 0 ? REF.leafDark : i % 3 === 1 ? REF.leaf : REF.leafLight;
    const curl = (rnd(seed * 11 + i) - 0.5) * W * 0.6 * (Math.cos((a * Math.PI) / 180) > 0 ? 1 : -1);
    leaves.push(
      <g key={i}>
        {kind !== 'fern' && kind !== 'palm' && <path d={`M ${base.x} ${base.y} Q ${base.x} ${(base.y + sy) / 2} ${sx} ${sy}`} fill="none" stroke={REF.leafDark} strokeWidth={6 * s} strokeLinecap="round" />}
        <g transform={`translate(${sx.toFixed(1)} ${sy.toFixed(1)}) rotate(${a.toFixed(1)})`}>
          <path d={leafPath(L, W, curl)} fill={col} stroke={C.ink} strokeWidth={ink * 0.8} strokeLinejoin="round" />
          <path d={`M ${L * 0.06} 0 Q ${L * 0.5} ${curl * 0.9} ${L * 0.92} ${curl * 1.8}`} fill="none" stroke={REF.leafDark} strokeWidth={ink * 0.6} opacity={0.7} />
          {kind === 'tall' && [0.3, 0.5, 0.7].map((k) => <path key={k} d={`M ${L * k} ${curl * k * 2} l ${L * 0.08} ${W * 0.45}`} stroke={C.paper} strokeWidth={ink * 0.6} opacity={0.35} />)}
        </g>
      </g>,
    );
  }
  const trunk = kind === 'palm' ? (() => {
    const top = base.y - 420 * s, w0 = 34 * s, w1 = 18 * s;
    const rings = [];
    for (let k = 1; k < 9; k++) { const yy = base.y - (k / 9) * 420 * s; const ww = w0 + (w1 - w0) * (k / 9); rings.push(<path key={k} d={`M ${x - ww} ${yy} q ${ww} ${10 * s} ${ww * 2} 0`} fill="none" stroke={REF.woodDark} strokeWidth={ink * 0.7} />); }
    return <g><path d={`M ${x - w0} ${base.y} L ${x - w1} ${top} L ${x + w1} ${top} L ${x + w0} ${base.y} Z`} fill={REF.wood} stroke={C.ink} strokeWidth={ink} strokeLinejoin="round" />{rings}</g>;
  })() : null;
  return (
    <g>
      {trunk}
      {leaves}
      {pot && (
        <g>
          <path d={`M ${x - 80 * s} ${y - potH} L ${x + 80 * s} ${y - potH} L ${x + 62 * s} ${y} L ${x - 62 * s} ${y} Z`} fill={REF.wood} stroke={C.ink} strokeWidth={ink} strokeLinejoin="round" />
          <rect x={x - 88 * s} y={y - potH - 16 * s} width={176 * s} height={22 * s} rx={6 * s} fill={REF.woodDark} stroke={C.ink} strokeWidth={ink} />
        </g>
      )}
    </g>
  );
};

/** Soft background people (not cast): simple warm silhouettes standing or seated, with a slow breath/sway. */
export const SoftFigure: React.FC<{x: number; y: number; s?: number; t?: number; seed?: number; seated?: boolean; ink?: number; color?: string; skin?: string; opacity?: number}> = ({x, y, s = 1, t = 0, seed = 1, seated = false, ink = 3, color, skin, opacity = 1}) => {
  const cols = ['#C98E6E', '#9A7F96', '#7F9A88', '#C7A27A', '#8E7A9E', '#B6876A'];
  const skins = ['#E8B996', '#A86F4C', '#F0C8A8', '#6E4630', '#C98B5E'];
  const c = color ?? cols[Math.floor(rnd(seed * 3) * cols.length)];
  const sk = skin ?? skins[Math.floor(rnd(seed * 5) * skins.length)];
  const h = (seated ? 300 : 420) * s * (0.92 + 0.12 * rnd(seed * 7));
  const sway = noise(t * 0.4, seed) * 4 * s;
  const bodyW = 110 * s;
  return (
    <g opacity={opacity}>
      {!seated && <rect x={x - bodyW * 0.32} y={y - h * 0.42} width={bodyW * 0.64} height={h * 0.42} rx={bodyW * 0.25} fill="#4A4A52" stroke={C.ink} strokeWidth={ink} />}
      <rect x={x - bodyW / 2 + sway * 0.5} y={y - h * 0.82} width={bodyW} height={h * (seated ? 0.62 : 0.46)} rx={bodyW * 0.38} fill={c} stroke={C.ink} strokeWidth={ink} />
      <circle cx={x + sway} cy={y - h * 0.9} r={44 * s} fill={sk} stroke={C.ink} strokeWidth={ink} />
    </g>
  );
};
