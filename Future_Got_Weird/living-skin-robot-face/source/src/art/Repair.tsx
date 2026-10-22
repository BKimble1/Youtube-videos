// Microscope-style explanatory view of the finger's wound repair in culture (2022 study, simplified): a V-shaped cut in
// the dermis equivalent, an acellular collagen sheet grafted on top, and over seven days surrounding fibroblasts
// migrate into the sheet and the gap while the wound edges draw together. The graft stays visible as a graft.
import React from 'react';
import {Pt, lerp, clamp, eio, path, smooth, rnd} from '../lib';
import {TissueSection, TMap, Cell, Fibroblast, tc, CELLS, DERM} from './Tissue';

export const RP = {gap: 150, depth: 150, patchW: 330, patchH: 72, shrink: 0.45};
const gapHalf = (w: number) => Math.max(0, RP.gap * (1 - w / RP.depth));
// tissue contraction toward the wound as it repairs
export const repairMap = (p: number): TMap => (u, w) => {
  const D = RP.gap * RP.shrink * p;
  const a = Math.abs(u);
  const k = clamp(1 - Math.max(0, a - gapHalf(Math.max(0, w))) / 520) * clamp(1 - Math.max(0, w) / 300 + 0.2);
  return {x: u - Math.tanh(u / 150) * D * k, y: w};
};
// migrating cells: [start (rest u,w), end (rest u,w), delay]
type Mig = {s: Pt; e: Pt; d: number; L: number};
export const MIG: Mig[] = [
  {s: {x: -262, y: 118}, e: {x: -70, y: -36}, d: 0.12, L: 100}, // hero
  {s: {x: 250, y: 96}, e: {x: 110, y: -38}, d: 0.05, L: 92},
  {s: {x: -215, y: 60}, e: {x: -220, y: -34}, d: 0.0, L: 86},
  {s: {x: 200, y: 44}, e: {x: 236, y: -36}, d: 0.08, L: 88},
  {s: {x: -160, y: 170}, e: {x: -36, y: 60}, d: 0.22, L: 84},
  {s: {x: 176, y: 176}, e: {x: 36, y: 96}, d: 0.28, L: 84},
  {s: {x: -320, y: 40}, e: {x: -160, y: -16}, d: 0.34, L: 90},
  {s: {x: 320, y: 64}, e: {x: 186, y: -14}, d: 0.4, L: 90},
  {s: {x: 64, y: 200}, e: {x: 4, y: 26}, d: 0.36, L: 80},
];
export const migPos = (m: Mig, p: number) => {
  const k = eio(clamp((p - m.d) / 0.62));
  // slight arc so the path reads as crawling, not sliding
  const mid = {x: (m.s.x + m.e.x) / 2, y: (m.s.y + m.e.y) / 2 - 20};
  const a = lerp(lerp(m.s.x, mid.x, k), lerp(mid.x, m.e.x, k), k), b = lerp(lerp(m.s.y, mid.y, k), lerp(mid.y, m.e.y, k), k);
  const k2 = clamp(k + 0.02);
  const a2 = lerp(lerp(m.s.x, mid.x, k2), lerp(mid.x, m.e.x, k2), k2), b2 = lerp(lerp(m.s.y, mid.y, k2), lerp(mid.y, m.e.y, k2), k2);
  return {x: a, y: b, ang: k < 0.98 ? (Math.atan2(b2 - b, a2 - a) * 180) / Math.PI : 0, moving: k > 0.01 && k < 0.99};
};

export const RepairMicro: React.FC<{p: number; t: number; tone: number; id: string; heroGlow?: number}> = ({p, t, tone, id, heroGlow = 0}) => {
  const C = tc(tone);
  const m = repairMap(p);
  const inGap = (c: Cell) => Math.abs(c.u) < gapHalf(c.w) + 30 || (c.w < 30 && Math.abs(c.u) < RP.patchW);
  const fill = clamp(p * 1.1);
  const gapPoly = (shrinkTo = 1) => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 12; i++) { const w = (i / 12) * RP.depth; pts.push(m(-gapHalf(w) * shrinkTo, w)); }
    for (let i = 12; i >= 0; i--) { const w = (i / 12) * RP.depth; pts.push(m(gapHalf(w) * shrinkTo, w)); }
    return pts;
  };
  const pw = RP.patchW, ph = RP.patchH;
  const patchPts = [m(-pw, -ph), m(pw, -ph), m(pw, 2), m(-pw, 2)];
  const patchWarm = clamp(p * 1.2 - 0.1);
  return (
    <g>
      <rect x={-3000} y={2 * DERM - 14} width={6000} height={3000} fill={C.matrix} />
      <TissueSection m={(u, w) => m(u, w + DERM - 6)} u0={-1400} u1={1400} t={t} tone={tone} id={`${id}-d`} epidermis={false} flat />
      <TissueSection m={m} u0={-1400} u1={1400} t={t} tone={tone} id={`${id}-t`} epidermis={false} flat cellFilter={(c) => !inGap(c) && !c.hero} />
      {/* the cut: open at day 0, filling with new matrix as cells arrive */}
      <path d={smooth(gapPoly(), true, 0.05)} fill={tone > 0.5 ? '#082027' : '#5B2E35'} opacity={1 - 0.88 * fill} />
      {fill > 0 && Array.from({length: 7}, (_, k) => {
        const w = 14 + k * 18;
        const h = gapHalf(w);
        if (h < 6) return null;
        const pts = Array.from({length: 7}, (_, i) => m(lerp(-h - 10, h + 10, i / 6), w + 5 * Math.sin(i * 1.7 + k)));
        return <path key={k} d={smooth(pts)} fill="none" stroke={C.fiber} strokeWidth={2.4} opacity={0.6 * fill} />;
      })}
      {/* grafted collagen sheet: acellular, paler, its own fibre direction */}
      <path d={path(patchPts)} fill={tone > 0.5 ? '#2C6B74' : '#F4E3DF'} opacity={0.9} />
      {Array.from({length: 6}, (_, k) => {
        const pts = Array.from({length: 13}, (_, i) => m(lerp(-pw + 8, pw - 8, i / 12), -ph + 9 + k * 11 + 3 * Math.sin(i * 0.9 + k * 2)));
        return <path key={k} d={smooth(pts)} fill="none" stroke={tone > 0.5 ? '#B9F1EE' : '#FFFFFF'} strokeWidth={2} opacity={0.55} />;
      })}
      {/* integration: fibres from the tissue cross into the sheet */}
      {patchWarm > 0 && Array.from({length: 8}, (_, k) => {
        const u = -pw + 40 + k * ((2 * pw - 80) / 7);
        const pts = [m(u, 26), m(u + 10, 6), m(u + 4, -24), m(u + 14, -52)];
        return <path key={k} d={smooth(pts)} fill="none" stroke={C.fiber} strokeWidth={2.4} opacity={0.65 * patchWarm} />;
      })}
      {/* migrating fibroblasts */}
      {MIG.map((g, k) => {
        const q = migPos(g, p);
        const c: Cell = {u: q.x, w: q.y, a: q.moving ? q.ang : (k % 2 ? 4 : -6), L: q.moving ? g.L * 1.18 : g.L, Wd: q.moving ? 15 : 18, ph: k * 1.3};
        return <Fibroblast key={k} c={c} m={m} t={t} id={`${id}-t`} C={C} detail={1} glow={k === 0 ? heroGlow : 0} />;
      })}
      <path d={path(patchPts)} fill="none" stroke={tone > 0.5 ? '#C8FFFA' : '#FFFFFF'} strokeWidth={3} opacity={lerp(0.95, 0.35, patchWarm)} strokeDasharray={p > 0.9 ? '10 8' : undefined} />
    </g>
  );
};

export const heroMigPos = (p: number) => {
  const q = migPos(MIG[0], p);
  return repairMap(p)(q.x, q.y);
};
