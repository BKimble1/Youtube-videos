// The material inside the strand, shared by the street push-in, the macro travel and the lab beaker, so the same
// chains are on screen across every hand-off. Field coordinates: x along the strand (from the attachment back toward
// its source), y across it. Where x is small the silk protein chains are aligned, packed and cross-linked (a solid
// fibre); further along they loosen into curling chains drifting in a pale-gold liquid (the silk solution).
// An illustration of "liquid -> connected fibre", not a molecular model: no formula, no reaction.
import React from 'react';
import {clamp, fmt, hash, lerp, noise1, V} from './dc/math';
import {mix} from './dc/color';

export const FIELD = {alignEnd: 1500, liquidStart: 2700};
export const FIBRE_BG = '#FBF4E2';
export const LIQUID_BG = '#F2D98E';
const CHAIN_FIBRE = '#E4B648';
const CHAIN_LIQ = '#C8962F';
const INK_C = '#6A5326';

/** 0 in the liquid, 1 in the fibre */
export const alignAt = (x: number) => {
  const t = clamp((x - FIELD.alignEnd) / (FIELD.liquidStart - FIELD.alignEnd));
  const s = t * t * (3 - 2 * t);
  return 1 - s;
};
export const bgAt = (x: number) => mix(LIQUID_BG, FIBRE_BG, alignAt(x));

type Map = (x: number, y: number) => V;

/** chains in the field rectangle [x0,x1] x [y0,y1]; `tight` 0..1 straightens the fibre's chains (under load);
 *  t is time in seconds (the liquid drifts) */
export const SilkChains: React.FC<{map: Map; scale: number; x0: number; x1: number; y0: number; y1: number; t: number; tight?: number; opacity?: number}> = ({map, scale, x0, x1, y0, y1, t, tight = 0, opacity = 1}) => {
  const ROW = 46;
  const COL = 230;
  const LEN = 420;
  const els: React.ReactNode[] = [];
  const rungs: string[] = [];
  const r0 = Math.floor(y0 / ROW) - 1;
  const r1 = Math.ceil(y1 / ROW) + 1;
  const c0 = Math.floor((x0 - LEN) / COL) - 1;
  const c1 = Math.ceil(x1 / COL) + 1;
  const w = 7 * scale;
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      const sx = c * COL + (hash(r * 131 + c, 3) - 0.5) * COL * 0.8 + (r % 2) * COL * 0.5;
      const sy = r * ROW + (hash(r * 71 + c, 5) - 0.5) * 10;
      const seed = r * 977 + c * 31;
      const pts: V[] = [];
      const N = 22;
      for (let i = 0; i <= N; i++) {
        const u = i / N;
        const fx = sx + u * LEN;
        const a = alignAt(fx);
        // fibre: nearly straight along x with a fine zigzag (the stacked, ordered parts); liquid: a drifting coil
        const zig = (i % 2 ? 1 : -1) * 3.2 * (1 - 0.7 * tight);
        const fy = sy + zig + Math.sin(u * 9 + seed) * 2 * (1 - tight);
        const cx = sx + LEN * 0.5 + noise1(seed * 0.1 + t * 0.4, 7) * 60;
        const cy = sy + noise1(seed * 0.13 + t * 0.35, 9) * 50;
        const ang = u * 7.5 + seed + t * 0.8 * (hash(seed, 2) > 0.5 ? 1 : -1);
        const rad = 55 + 35 * Math.sin(u * 5.3 + seed);
        const lx = cx + Math.cos(ang) * rad * (0.6 + u * 0.4) + (u - 0.5) * 140;
        const ly = cy + Math.sin(ang) * rad * 0.8;
        pts.push(map(lerp(lx, fx, a), lerp(ly, fy, a)));
      }
      const midA = alignAt(sx + LEN / 2);
      const d = `M${pts.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' L')}`;
      const col = mix(CHAIN_LIQ, CHAIN_FIBRE, midA);
      els.push(
        <g key={`${r}_${c}`}>
          <path d={d} fill="none" stroke={INK_C} strokeWidth={fmt(w * 1.5)} strokeLinecap="round" strokeLinejoin="round" opacity={0.55} />
          <path d={d} fill="none" stroke={col} strokeWidth={fmt(w)} strokeLinecap="round" strokeLinejoin="round" />
        </g>,
      );
      // cross-links to the row below where the chains are aligned (the bonds that make the fibre one piece)
      if (midA > 0.15) {
        for (let k = 3; k < N; k += 4) {
          const fx = sx + (k / N) * LEN;
          const a = alignAt(fx);
          if (a < 0.2) continue;
          const p = map(fx, sy + 4);
          const q = map(fx, sy + ROW - 4);
          rungs.push(`M${fmt(p.x)},${fmt(p.y)} L${fmt(q.x)},${fmt(q.y)}`);
        }
      }
    }
  }
  return (
    <g opacity={opacity}>
      <path d={rungs.join(' ')} fill="none" stroke="#B88A2A" strokeWidth={fmt(w * 0.55)} strokeLinecap="round" opacity={0.55 + 0.35 * tight} />
      {els}
    </g>
  );
};

/** a full-screen view of the field: background graded from fibre to liquid along x, chains on top */
export const FieldView: React.FC<{id: string; U: number; S: number; ang: number; t: number; tight?: number}> = ({id, U, S, ang, t, tight = 0}) => {
  const c = Math.cos((ang * Math.PI) / 180);
  const s = Math.sin((ang * Math.PI) / 180);
  const map: Map = (x, y) => ({x: 540 + ((x - U) * c - y * s) * S, y: 960 + ((x - U) * s + y * c) * S});
  // visible field rectangle (screen corners back to field coordinates)
  const R = Math.hypot(540, 960) / S;
  const g0 = map(FIELD.alignEnd, 0);
  const g1 = map(FIELD.liquidStart, 0);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id={`${id}-bg`} gradientUnits="userSpaceOnUse" x1={fmt(g0.x)} y1={fmt(g0.y)} x2={fmt(g1.x)} y2={fmt(g1.y)}>
          <stop offset="0" stopColor={FIBRE_BG} />
          <stop offset="1" stopColor={LIQUID_BG} />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill={`url(#${id}-bg)`} />
      <SilkChains map={map} scale={S} x0={U - R} x1={U + R} y0={-R} y1={R} t={t} tight={tight} />
    </svg>
  );
};
