// AI / digital-twin visuals (cyan and electric blue, with gold for what the analysis singles out). Nothing here is a
// floating wireframe sphere: the twin is a dense reconstruction (stacked scan slices of cells, iso-contours, vessel
// tree, subclone regions) standing on a simulation floor, and every analysis step shows its inputs and its uncertainty.
import React from 'react';
import {Cam, W, H, camTransform} from '../../kit/cam';
import {P as Pt, closedPath, openPath, rand, noise, mixHex, smooth, clamp01, lerp} from '../../kit/core';
import {P} from '../palette';

/** AI-world background: deep navy depth, a perspective floor grid that parallaxes with the camera, drifting data motes. */
export const AIBack: React.FC<{cam: Cam; t: number; floorY?: number; op?: number}> = ({cam, t, floorY = 0.62, op = 1}) => {
  const horizon = H * 0.38;
  const lines: React.ReactNode[] = [];
  // receding horizontal lines
  for (let k = 0; k < 14; k++) {
    const u = ((k + ((cam.x * 0.0 + t * 0.15) % 1)) / 14);
    const y = horizon + (H * floorY + 200 - horizon) * Math.pow(u, 2.2);
    lines.push(<line key={'h' + k} x1={0} x2={W} y1={y} y2={y} stroke={P.ai} strokeWidth={1 + 1.5 * u} opacity={0.05 + 0.18 * u} />);
  }
  // radial lines converging on the vanishing point, sliding with the camera
  const off = ((cam.x * cam.z * 0.15) % 160 + 160) % 160;
  for (let k = -16; k <= 16; k++) {
    const xb = W / 2 + k * 160 - off;
    lines.push(<line key={'v' + k} x1={W / 2 + (xb - W / 2) * 0.08} y1={horizon} x2={W / 2 + (xb - W / 2) * 2.4} y2={H + 200} stroke={P.ai} strokeWidth={1.2} opacity={0.1} />);
  }
  return (
    <g opacity={op}>
      <rect width={W} height={H} fill="url(#aiDepth)" />
      <rect x={0} y={horizon} width={W} height={H - horizon} fill={P.aiBg} opacity={0.45} />
      {lines}
      <ellipse cx={W / 2} cy={horizon} rx={W * 0.7} ry={60} fill="url(#glowAi)" opacity={0.18} />
      {Array.from({length: 40}, (_, k) => {
        const x = ((rand(k * 7) * W * 1.4 - cam.x * cam.z * 0.05 * (0.5 + rand(k))) % (W * 1.4) + W * 1.4) % (W * 1.4) - W * 0.2;
        const y = (rand(k * 11) * H + t * 12 * (0.5 + rand(k * 3))) % H;
        return <rect key={k} x={x} y={y} width={3 + 3 * rand(k)} height={3 + 3 * rand(k)} fill={k % 7 === 0 ? P.aiGold : P.aiHot} opacity={0.15 + 0.25 * rand(k * 5)} />;
      })}
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ digital tumour
const HEXR = 30;
const hexPath = (r: number) => Array.from({length: 6}, (_, k) => {
  const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
  return `${k ? 'L' : 'M'} ${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`;
}).join(' ') + ' Z';
const HEX = hexPath(HEXR * 0.92);
export const dtBoundary = (a: number, seed: number) => 1 + 0.12 * Math.sin(3 * a + seed) + 0.07 * Math.sin(5 * a + seed * 2.1) + 0.04 * Math.sin(9 * a + seed * 0.7);
export const dtOutline = (R: number, seed: number, sy = 1) => closedPath(Array.from({length: 36}, (_, k) => {
  const a = (k / 36) * Math.PI * 2;
  return [Math.cos(a) * R * dtBoundary(a, seed), Math.sin(a) * R * dtBoundary(a, seed) * sy] as Pt;
}), 1);

export const CLONE_AI = [P.ai, '#36F0C8', '#9A7CFF', P.aiGold];
/** Region (subclone) of a tumour point: angular sectors with soft noise. */
const region = (x: number, y: number, seed: number) => {
  const a = Math.atan2(y, x) + 0.4 * noise(Math.hypot(x, y) / 180, seed);
  const s = ((a + Math.PI) / (Math.PI * 2)) * 5 + seed;
  const k = Math.floor(s) % 5;
  return k === 4 ? 0 : k; // 0 cyan dominant, 1 teal, 2 violet, 3 gold (rare)
};

export type DTProps = {
  x?: number; y?: number; R?: number; seed?: number; t: number;
  build?: number;      // 0..1 reconstruction progress (slices stack up, cells fill in)
  lod: number;         // screen px per unit
  shrink?: number;     // treatment response 0..1
  regrow?: number;     // resistant regrowth 0..1
  tint?: string;       // overall colour (default cyan)
  vessels?: number;
  highlight?: number;  // gold weak-point highlight
  op?: number;
  sy?: number;         // vertical squash (perspective)
};
/** A reconstructed tumour: 3 stacked scan slices of hexagonal voxels (cells) + iso-contours + vessel tree. */
export const DigitalTumor: React.FC<DTProps> = ({x = 0, y = 0, R = 500, seed = 1, t, build = 1, lod, shrink = 0, regrow = 0, tint, vessels = 1, highlight = 0, op = 1, sy = 0.82}) => {
  const scale = (1 - 0.6 * smooth(shrink)) * (1 + 0.35 * smooth(regrow));
  const Rr = R * scale;
  const layers = [-1, 0, 1];
  const detail = lod * Rr > 60;
  const cellsOn = lod * HEXR * scale > 2.2;
  const out: React.ReactNode[] = [];
  layers.forEach((L, li) => {
    const lb = smooth(build * 3 - li); // bottom slice first
    if (lb <= 0.01) return;
    const yoff = -L * Rr * 0.16;
    const sR = Rr * (1 - 0.18 * Math.abs(L));
    out.push(
      <g key={'L' + L} opacity={lb * (L === 0 ? 1 : 0.55)} transform={`translate(0 ${yoff})`}>
        <path d={dtOutline(sR, seed + L, sy)} fill={mixHex(P.aiBgLift, tint ?? P.aiDeep, 0.35)} fillOpacity={0.55} stroke={tint ?? P.ai} strokeWidth={Math.max(1.5, 2.5 / Math.max(0.2, lod))} />
      </g>,
    );
    if (L === 0 && cellsOn && detail) {
      const sp = HEXR * 1.8 * scale;
      const n = Math.ceil(sR / sp) + 1;
      const front = lerp(-sR * 1.3, sR * 1.3, clamp01(build * 1.4 - 0.2));
      for (let j = -n; j <= n; j++)
        for (let i = -n; i <= n; i++) {
          const cx = (i + (j % 2 ? 0.5 : 0)) * sp, cy = j * sp * 0.866 * sy;
          const a = Math.atan2(cy / sy, cx);
          if (Math.hypot(cx, cy / sy) > sR * dtBoundary(a, seed) * 0.95) continue;
          if (cx > front) continue;
          const rg = region(cx, cy, seed);
          const c = tint ?? CLONE_AI[rg];
          const flick = 0.35 + 0.35 * rand(i * 31 + j * 17 + seed) + 0.2 * Math.sin(t * 2 + i + j);
          out.push(<path key={`${i},${j}`} d={HEX} transform={`translate(${cx} ${cy + yoff}) scale(${scale} ${scale * sy})`} fill={c} fillOpacity={0.12 + 0.22 * flick} stroke={c} strokeWidth={1.6} strokeOpacity={0.75} />);
        }
    }
  });
  // iso-contours on the middle slice
  const iso = [0.35, 0.6, 0.82].map((f, k) => <path key={'i' + k} d={dtOutline(Rr * f, seed + 3 + k, sy)} fill="none" stroke={tint ?? P.aiHot} strokeWidth={Math.max(1, 1.8 / Math.max(0.3, lod))} strokeDasharray={`${8 / Math.max(0.3, lod)} ${10 / Math.max(0.3, lod)}`} opacity={0.5 * build} />);
  // vessel tree (gold) feeding the mass
  const vt = vessels * smooth(build * 1.6 - 0.6);
  const vess = vt > 0.01 && (
    <g opacity={vt} fill="none" stroke={P.aiGold} strokeLinecap="round">
      {Array.from({length: 5}, (_, k) => {
        const a = (k / 5) * Math.PI * 2 + seed;
        const pts: Pt[] = [[Math.cos(a) * Rr * 1.5, Math.sin(a) * Rr * 1.5 * sy], [Math.cos(a + 0.2) * Rr * 0.9, Math.sin(a + 0.2) * Rr * 0.9 * sy], [Math.cos(a + 0.5) * Rr * 0.45, Math.sin(a + 0.5) * Rr * 0.45 * sy]];
        return <path key={k} d={openPath(pts, 1)} strokeWidth={Math.max(2, 5 * scale)} opacity={0.7} />;
      })}
    </g>
  );
  return (
    <g opacity={op} transform={`translate(${x} ${y})`}>
      <ellipse cx={0} cy={Rr * 0.95} rx={Rr * 1.3} ry={Rr * 0.28} fill="url(#glowAi)" opacity={0.35 * build} />
      {vess}
      {out}
      {iso}
      {highlight > 0.01 && (
        <g opacity={highlight}>
          <circle cx={Rr * 0.3} cy={-Rr * 0.18} r={Rr * 0.5} fill="url(#glowGold)" />
          <path d={HEX} transform={`translate(${Rr * 0.3} ${-Rr * 0.18}) scale(${2.2 * scale})`} fill={P.aiGold} fillOpacity={0.35} stroke={P.aiGold} strokeWidth={2} />
        </g>
      )}
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ data streams
/** An axial CT slice: torso cross-section with lungs, spine, heart and a bright nodule. */
export const CTSlice: React.FC<{x: number; y: number; s: number; k: number; t: number; tumor?: boolean; op?: number; skew?: number}> = ({x, y, s, k, tumor = true, op = 1, skew = 0}) => (
  <g opacity={op} transform={`translate(${x} ${y}) skewX(${skew}) scale(${s} ${s * 0.55})`}>
    <ellipse rx={260} ry={190} fill="#0A1A26" stroke={P.aiHot} strokeWidth={4} />
    <ellipse rx={230} ry={165} fill="#2A3A46" />
    <path d={closedPath([[-200, -40], [-150, -120], [-60, -110], [-40, 20], [-90, 120], [-180, 90]], 1)} fill="#0C141C" />
    <path d={closedPath([[200, -40], [150, -120], [60, -110], [40, 20], [90, 120], [180, 90]], 1)} fill="#0C141C" />
    <circle cx={0} cy={130} r={34} fill="#DDE6EE" />
    <ellipse cx={18} cy={20} rx={52} ry={44} fill="#7A8894" />
    {tumor && <circle cx={120 + 6 * k} cy={-40} r={22 + 8 * Math.sin(k)} fill="#F4F8FF" />}
    {tumor && <circle cx={120 + 6 * k} cy={-40} r={44} fill="url(#glowGold)" opacity={0.7} />}
  </g>
);

/** Biopsy core: a short cylinder of tissue (cells visible) that voxelises into cyan as `digit` goes 0→1. */
export const BiopsyCore: React.FC<{x: number; y: number; s: number; digit: number; t: number; op?: number}> = ({x, y, s, digit, t, op = 1}) => {
  const Lc = 420, Rc = 70;
  return (
    <g opacity={op} transform={`translate(${x} ${y}) rotate(-12) scale(${s})`}>
      <rect x={-Lc / 2} y={-Rc} width={Lc} height={Rc * 2} rx={Rc} fill={mixHex(P.tissueDeep, P.aiDeep, digit)} />
      {Array.from({length: 26}, (_, k) => {
        const cx = -Lc / 2 + 40 + (k % 13) * 27, cy = (Math.floor(k / 13) - 0.5) * 60 + 8 * Math.sin(k);
        const isT = k % 5 === 2 || k % 7 === 0;
        const c = isT ? P.tumorLight : P.tissue;
        return (
          <g key={k}>
            <circle cx={cx} cy={cy} r={22} fill={mixHex(c, P.aiBgLift, digit)} stroke={mixHex(P.tissueDeep, P.ai, digit)} strokeWidth={2 + 2 * digit} />
            <circle cx={cx} cy={cy} r={8} fill={mixHex(isT ? P.tumorDeep : P.nucleus, P.ai, digit)} />
          </g>
        );
      })}
      <rect x={-Lc / 2} y={-Rc} width={Lc} height={Rc * 2} rx={Rc} fill="url(#vol)" opacity={0.9 * (1 - digit * 0.5)} />
      <ellipse cx={Lc / 2 - Rc * 0.4} cy={0} rx={Rc * 0.45} ry={Rc} fill={mixHex(P.tissueLight, P.aiHot, digit)} opacity={0.6} />
    </g>
  );
};

const BASES = 'ACGT';
/** Sequencing read strip: letters streaming, the mutated positions highlighted. */
export const SeqStrip: React.FC<{x: number; y: number; s: number; t: number; reveal: number; op?: number; n?: number}> = ({x, y, s, t, reveal, op = 1, n = 30}) => (
  <g opacity={op} transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-20} y={-46} width={n * 34 + 40} height={92} rx={18} fill={P.aiBg} stroke={P.aiDim} strokeWidth={3} />
    {Array.from({length: n}, (_, k) => {
      if (k / n > reveal) return null;
      const b = BASES[Math.floor(rand(k * 13 + 7) * 4)];
      const mut = k % 9 === 4;
      return (
        <g key={k}>
          {mut && <rect x={k * 34 - 2} y={-36} width={34} height={72} rx={6} fill={P.mutation} opacity={0.35} />}
          <text x={k * 34 + 15} y={14} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontWeight={700} fontSize={40} fill={mut ? '#FFC2DA' : P.aiHot}>{b}</text>
        </g>
      );
    })}
  </g>
);

/** Small growth curve with an uncertainty band (prediction, not certainty). */
export const GrowthCurve: React.FC<{x: number; y: number; w: number; h: number; outcome: number; draw: number; color?: string; op?: number}> = ({x, y, w, h, outcome, draw, color = P.ai, op = 1}) => {
  const N = 24;
  const f = (u: number) => 0.55 - 0.35 * Math.sin(u * 1.4) * (outcome < 0 ? -outcome : 0) + (outcome > 0 ? outcome * 0.5 * u * u : 0) - (outcome < 0 ? -outcome * 0.3 * u : 0);
  const pts: Pt[] = [], up: Pt[] = [], lo: Pt[] = [];
  for (let k = 0; k <= N * clamp01(draw); k++) {
    const u = k / N;
    const v = clamp01(f(u));
    const band = 0.04 + 0.22 * u;
    pts.push([x + u * w, y + h - v * h]);
    up.push([x + u * w, y + h - clamp01(v + band) * h]);
    lo.push([x + u * w, y + h - clamp01(v - band) * h]);
  }
  if (pts.length < 2) return null;
  return (
    <g opacity={op}>
      <rect x={x - 8} y={y - 8} width={w + 16} height={h + 16} rx={8} fill={P.aiBg} opacity={0.7} stroke={P.aiDim} strokeWidth={2} />
      <path d={`M ${up.map((p) => p.join(' ')).join(' L ')} L ${lo.reverse().map((p) => p.join(' ')).join(' L ')} Z`} fill={color} opacity={0.18} />
      <path d={`M ${pts.map((p) => p.join(' ')).join(' L ')}`} fill="none" stroke={color} strokeWidth={3} />
    </g>
  );
};
export const _ai = {camTransform};
