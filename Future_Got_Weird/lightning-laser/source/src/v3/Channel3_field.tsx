// V3 beat D+E helpers: the micro world of the molecular scene (adapted from v2/Molecular2.tsx, which V2 keeps).
// Micro units: molecules ~150 apart. The channel axis is the line x = 0 (up = -y); the camera always rolls by
// MICRO_ANG, so on screen the axis runs up and to the right exactly like the beam in the macro views (cams3.ts), and
// it keeps its centre on the axis (cx = 0), so the axis passes through the camera's screen anchor.
import React from 'react';
import {mix} from '../dc/color';
import {clamp, fmt, hash} from '../dc/math';
import {MICRO_ANG} from './cams3';

export const INK = '#0B151C';
export const SP = 150; // molecule spacing (micro units)
/** the micro camera: the axis point (0, cy) is drawn at screen (ax, ay); z = screen px per micro unit */
export type MCam = {ax: number; ay: number; cy: number; z: number};
const RAD = (MICRO_ANG * Math.PI) / 180;
export const CA = Math.cos(RAD), SA = Math.sin(RAD);
/** the SVG transform of a layer seen through the camera (k < 1: a farther, slower layer) */
export const camTr = (c: MCam, k = 1) => `translate(${fmt(c.ax)} ${fmt(c.ay)}) rotate(${MICRO_ANG.toFixed(4)}) scale(${(c.z * k).toFixed(5)}) translate(0 ${fmt(-c.cy)})`;
/** micro point -> screen */
export const toScreen = (c: MCam, x: number, y: number) => {
  const dx = x * c.z, dy = (y - c.cy) * c.z;
  return {x: c.ax + dx * CA - dy * SA, y: c.ay + dx * SA + dy * CA};
};
export type Box = {x0: number; x1: number; y0: number; y1: number};
/** the micro-space bounding box of the frame (for a layer of scale z * k), padded */
export const frameBox = (c: MCam, k = 1, pad = 0): Box => {
  const zk = c.z * k;
  const pts = [[0, 0], [1080, 0], [0, 1920], [1080, 1920]].map(([sx, sy]) => {
    const dx = sx - c.ax, dy = sy - c.ay;
    return {x: (dx * CA + dy * SA) / zk, y: (-dx * SA + dy * CA) / zk + c.cy};
  });
  return {
    x0: Math.min(...pts.map((p) => p.x)) - pad, x1: Math.max(...pts.map((p) => p.x)) + pad,
    y0: Math.min(...pts.map((p) => p.y)) - pad, y1: Math.max(...pts.map((p) => p.y)) + pad,
  };
};

// ------------------------------------------------------------------ the hashed molecule field
export type Mol = {x: number; y: number; o2: boolean; th: number; ph: number; id: number; r1: number; r2: number; r3: number};
/** the molecule of grid cell (i, j): jittered inside its cell (never closer than half a spacing to a neighbour) */
export const molCell = (i: number, j: number, seed: number, sp = SP): Mol => {
  const id = (i * 7919 + j * 104729 + seed * 31) | 0;
  return {
    x: (i + 0.22 + 0.56 * hash(id, 3)) * sp, y: (j + 0.22 + 0.56 * hash(id, 5)) * sp,
    o2: hash(id, 7) < 0.21, th: 360 * hash(id, 9), ph: 6.283 * hash(id, 11), id, r1: hash(id, 13), r2: hash(id, 15), r3: hash(id, 17),
  };
};
/** every molecule whose cell overlaps the box (the caller culls after displacement) */
export const molsIn = (b: Box, seed: number, sp = SP, max = 2600): Mol[] => {
  const i0 = Math.floor(b.x0 / sp), i1 = Math.ceil(b.x1 / sp), j0 = Math.floor(b.y0 / sp), j1 = Math.ceil(b.y1 / sp);
  if ((i1 - i0 + 1) * (j1 - j0 + 1) > max) return [];
  const out: Mol[] = [];
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) out.push(molCell(i, j, seed, sp));
  return out;
};
/** a molecule's level-of-detail key (0..1): as a view widens past its scale, the molecules with the highest keys
 *  fade out first, so the drawn density on screen stays about constant (and the cell count never explodes) */
export const lodKey = (i: number, j: number, seed: number) => hash((i * 7919 + j * 104729 + seed * 31) | 0, 41);
/** the molecules of the box whose LOD key is below keep (+ a fade margin); cheap for very wide boxes */
export const molsLod = (b: Box, seed: number, keep: number, sp = SP, max = 40000): {m: Mol; lod: number}[] => {
  const i0 = Math.floor(b.x0 / sp), i1 = Math.ceil(b.x1 / sp), j0 = Math.floor(b.y0 / sp), j1 = Math.ceil(b.y1 / sp);
  if ((i1 - i0 + 1) * (j1 - j0 + 1) > max) return [];
  const out: {m: Mol; lod: number}[] = [];
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
    const k = lodKey(i, j, seed);
    const lod = clamp((keep + 0.1 - k) / 0.1);
    if (lod > 0.004) out.push({m: molCell(i, j, seed, sp), lod});
  }
  return out;
};

// ------------------------------------------------------------------ drawing
export const N2 = '#86A9C9', O2 = '#E0806E';
/** a molecule's drawn state: position (micro), bond angle (deg), heat 0..1, opacity, detail (0 flat .. 1 full) */
export type MS = {x: number; y: number; th: number; heat: number; alpha: number; dim: number};
/** one molecule: two atoms with ink contours (N2 blue, O2 red), warmed by heat, dimmed (toward the backdrop) by dim */
/** heatGlow: the url of a radial warm gradient for a hot molecule's glow */
export const MolDraw: React.FC<{m: Mol; s: MS; z: number; warm: string; heatGlow: string}> = ({m, s, z, warm, heatGlow}) => {
  if (s.alpha <= 0.01) return null;
  const th = (s.th * Math.PI) / 180;
  const c = Math.cos(th), sn = Math.sin(th);
  const r = m.o2 ? 17 : 18, d = m.o2 ? 13 : 14;
  const base = mix(m.o2 ? O2 : N2, warm, clamp(s.heat) * 0.25);
  const col = mix(base, '#141E2C', s.dim);
  const ink = mix(INK, '#141E2C', s.dim * 0.5);
  const sw = clamp(2.6 / z, 1.2, 9);
  const hiA = clamp((z - 0.42) / 0.3); // the highlights fade out (never switch) as the view widens
  const hi = hiA > 0.02;
  return (
    <g opacity={fmt(s.alpha)}>
      {s.heat > 0.04 && <circle cx={fmt(s.x)} cy={fmt(s.y)} r={62} fill={heatGlow} opacity={fmt(s.heat * (1 - 0.6 * s.dim))} />}
      {[-1, 1].map((k) => (
        <circle key={k} cx={fmt(s.x + c * d * k)} cy={fmt(s.y + sn * d * k)} r={r} fill={col} stroke={ink} strokeWidth={fmt(sw)} />
      ))}
      {hi && [-1, 1].map((k) => (
        <circle key={`h${k}`} cx={fmt(s.x + c * d * k - r * 0.3)} cy={fmt(s.y + sn * d * k - r * 0.32)} r={fmt(r * 0.34)} fill="#FFFFFF" opacity={fmt(0.32 * hiA * (1 - s.dim))} />
      ))}
    </g>
  );
};
/** a small bound electron (pale blue-white with an ink rim and a soft glow), sitting on its molecule; r in micro units.
 *  dim: it quiets with its molecule (its colours go toward the backdrop, like MolDraw's), so a dimmed molecule's
 *  electron is a dim dot, never a grey ring */
export const Electron: React.FC<{x: number; y: number; z: number; a: number; glow?: number; dim?: number}> = ({x, y, z, a, glow = 0.35, dim = 0}) => {
  if (a <= 0.01) return null;
  const r = Math.max(6, 4.2 / z);
  return (
    <g opacity={fmt(a)}>
      <circle cx={fmt(x)} cy={fmt(y)} r={fmt(r * 2.1)} fill="#CFF4FF" opacity={fmt(glow * (1 - dim))} />
      <circle cx={fmt(x)} cy={fmt(y)} r={fmt(r)} fill={mix('#EAFBFF', '#141E2C', dim)} stroke={mix(INK, '#141E2C', dim * 0.5)} strokeWidth={fmt(clamp(1.8 / z, 0.6, 4))} />
    </g>
  );
};
/** a freed electron: no ink rim, a hot white core in a bright cyan-white glow, and a short motion streak behind it
 *  (vx, vy: its velocity in micro units per second; the streak is the last 0.07 s of its path). It fades to
 *  transparent (glow and core together), never to a grey ring. glowUrl: a radial gradient (white -> transparent). */
export const FreeElectron: React.FC<{x: number; y: number; vx: number; vy: number; z: number; a: number; glowUrl: string}> = ({x, y, vx, vy, z, a, glowUrl}) => {
  if (a <= 0.01) return null;
  const r = Math.max(6, 4.2 / z) * 1.1;
  const sp = Math.hypot(vx, vy);
  const L = Math.min(sp * 0.07, 34 / z + 60); // streak length (micro)
  const ux = sp > 1e-3 ? vx / sp : 0, uy = sp > 1e-3 ? vy / sp : 0;
  const sk = clamp((L * z - 6) / 30); // the streak shows only while it is moving fast on screen
  return (
    <g opacity={fmt(a)}>
      {sk > 0.02 && (
        <g style={{mixBlendMode: 'screen'}} opacity={fmt(sk)} strokeLinecap="round">
          <path d={`M${fmt(x - ux * L)},${fmt(y - uy * L)} L${fmt(x)},${fmt(y)}`} stroke="#9FE9FF" strokeOpacity={0.35} strokeWidth={fmt(r * 2.2)} />
          <path d={`M${fmt(x - ux * L * 0.7)},${fmt(y - uy * L * 0.7)} L${fmt(x)},${fmt(y)}`} stroke="#E8FCFF" strokeOpacity={0.8} strokeWidth={fmt(r * 0.9)} />
        </g>
      )}
      <circle cx={fmt(x)} cy={fmt(y)} r={fmt(r * 3.6)} fill={glowUrl} style={{mixBlendMode: 'screen'}} />
      <circle cx={fmt(x)} cy={fmt(y)} r={fmt(r * 0.95)} fill="#FFFFFF" />
    </g>
  );
};
/** a spark: a four-ray star (white), k = 1 at its peak; L in micro units */
export const sparkPath = (x: number, y: number, L: number, rot = 0) => {
  const out: string[] = [];
  for (let i = 0; i < 4; i++) {
    const a = rot + (i * Math.PI) / 4;
    const l = i % 2 ? L * 0.55 : L;
    out.push(`M${fmt(x - Math.cos(a) * l)},${fmt(y - Math.sin(a) * l)} L${fmt(x + Math.cos(a) * l)},${fmt(y + Math.sin(a) * l)}`);
  }
  return out.join(' ');
};
