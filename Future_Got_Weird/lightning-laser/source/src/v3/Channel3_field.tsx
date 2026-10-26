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
  const hi = z > 0.62;
  return (
    <g opacity={fmt(s.alpha)}>
      {s.heat > 0.04 && <circle cx={fmt(s.x)} cy={fmt(s.y)} r={62} fill={heatGlow} opacity={fmt(s.heat * (1 - 0.6 * s.dim))} />}
      {[-1, 1].map((k) => (
        <circle key={k} cx={fmt(s.x + c * d * k)} cy={fmt(s.y + sn * d * k)} r={r} fill={col} stroke={ink} strokeWidth={fmt(sw)} />
      ))}
      {hi && [-1, 1].map((k) => (
        <circle key={`h${k}`} cx={fmt(s.x + c * d * k - r * 0.3)} cy={fmt(s.y + sn * d * k - r * 0.32)} r={fmt(r * 0.34)} fill="#FFFFFF" opacity={fmt(0.32 * (1 - s.dim))} />
      ))}
    </g>
  );
};
/** a small electron (pale blue-white with an ink rim and a soft glow); r in micro units */
export const Electron: React.FC<{x: number; y: number; z: number; a: number; glow?: number}> = ({x, y, z, a, glow = 0.35}) => {
  if (a <= 0.01) return null;
  const r = Math.max(6, 4.2 / z);
  return (
    <g opacity={fmt(a)}>
      <circle cx={fmt(x)} cy={fmt(y)} r={fmt(r * 2.1)} fill="#CFF4FF" opacity={glow} />
      <circle cx={fmt(x)} cy={fmt(y)} r={fmt(r)} fill="#EAFBFF" stroke={INK} strokeWidth={fmt(clamp(1.8 / z, 0.6, 4))} />
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
