// Hook 04 set pieces, all projected through the one camera: the bench, the flat induction coil (pancake coil under a
// glass top), the cage of vertical bars, the open silicone mould with its figure-shaped cavity, and the hand-held
// magnet (a nickel NdFeB block in a holder on a rod that leaves frame).
import React from 'react';
import {lit, mix, rgba, shade} from '../shared/color';
import {Deco, INK, Inked, InkPath} from '../shared/ink';
import {a3, Cam, camPos, circlePts, d3, facingAngle, m3, n3, poly, project, s3, SP, V3, v3} from './cam';
import {Capsule, SoftShadow} from './shade';

export const ZT = 0.35; // top of the coil pad and of the mould
export const RP = 2.45; // coil pad radius
export const RG = 2.12; // glass window radius
export const RC = 0.98; // cage radius
export const CAGE_H = 2.45;
export const NB = 12;
export const BAR_R = 0.034;
export const barAngle = (k: number) => -90 + 15 + (360 / NB) * k;
export const MOULD = {x0: -0.4, x1: 2.2, y0: -5.3, y1: -2.27};

const BENCH = '#24433F';

export const Bench: React.FC<{c: Cam; t: number}> = ({c, t}) => {
  const lines: React.ReactNode[] = [];
  const g = (a: V3, b: V3, k: string, w: number, op: number) => {
    const p = project(c, a), q = project(c, b);
    lines.push(<line key={k} x1={p.x.toFixed(1)} y1={p.y.toFixed(1)} x2={q.x.toFixed(1)} y2={q.y.toFixed(1)} stroke="#9FD3C7" strokeWidth={w} opacity={op} />);
  };
  for (let i = -10; i <= 12; i++) g(v3(i, -14, 0), v3(i, 10, 0), `x${i}`, i % 5 === 0 ? 2.2 : 1.2, i % 5 === 0 ? 0.16 : 0.09);
  for (let j = -14; j <= 10; j++) g(v3(-10, j, 0), v3(12, j, 0), `y${j}`, j % 5 === 0 ? 2.2 : 1.2, j % 5 === 0 ? 0.16 : 0.09);
  const o = project(c, v3(0.5, -1.5, 0));
  return (
    <g>
      <defs>
        <linearGradient id="bench-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(BENCH, '#0F2427', 0.45)} />
          <stop offset="0.5" stopColor={BENCH} />
          <stop offset="1" stopColor={lit(BENCH, 0.06)} />
        </linearGradient>
        <radialGradient id="bench-l" cx={(o.x - 260).toFixed(0)} cy={(o.y - 380).toFixed(0)} r="1100" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFE9C8" stopOpacity={0.2} />
          <stop offset="0.55" stopColor="#FFE9C8" stopOpacity={0.06} />
          <stop offset="1" stopColor="#FFE9C8" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="bench-m" cx={o.x.toFixed(0)} cy={o.y.toFixed(0)} r="1300" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#000" stopOpacity={0} />
          <stop offset="0.6" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#06141A" stopOpacity={0.45} />
        </radialGradient>
      </defs>
      <rect x={-50} y={-50} width={1180} height={2020} fill="url(#bench-g)" />
      <g>{lines}</g>
      <rect x={-50} y={-50} width={1180} height={2020} fill="url(#bench-l)" />
      <rect x={-50} y={-50} width={1180} height={2020} fill="url(#bench-m)" />
    </g>
  );
};

/** a vertical cylinder (pad, holder): side band + top disc, as screen paths */
const cyl = (c: Cam, ctr: V3, r: number, h: number) => {
  const fa = facingAngle(c, ctr);
  const bot = circlePts(c, ctr, r, fa - 90, fa + 90, 48);
  const top = circlePts(c, a3(ctr, v3(0, 0, h)), r, fa - 90, fa + 90, 48);
  const side = poly([...bot, ...top.slice().reverse()]);
  const topD = poly(circlePts(c, a3(ctr, v3(0, 0, h)), r, 0, 360, 72));
  return {side, topD, bot, top, fa};
};

export const Pad: React.FC<{c: Cam; t: number; power: number; ink: number}> = ({c, t, power, ink}) => {
  const C0 = v3(0, 0, 0);
  const {side, topD, bot} = cyl(c, C0, RP, ZT);
  const glass = poly(circlePts(c, v3(0, 0, ZT), RG, 0, 360, 72));
  // copper pancake coil under the glass
  const turns = 8, n = turns * 60;
  const sp: SP[] = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * turns * 2 * Math.PI;
    const r = 0.3 + (1.9 - 0.3) * (i / n);
    sp.push(project(c, v3(r * Math.cos(a + 0.6), r * Math.sin(a + 0.6), ZT - 0.05)));
  }
  const spD = poly(sp, false);
  const k = project(c, v3(0, 0, ZT)).k;
  const wire = 0.11 * k;
  const p0 = project(c, v3(-RP, -RP, ZT)), p1 = project(c, v3(RP, RP, ZT));
  const led = project(c, v3(RP * Math.cos((-128 * Math.PI) / 180) * 0.94, RP * Math.sin((-128 * Math.PI) / 180) * 0.94, ZT));
  const left = bot[0], right = bot[bot.length - 1];
  return (
    <g>
      <SoftShadow id="pad-sh" c={{x: (left.x + right.x) / 2 + 30, y: (left.y + right.y) / 2 + 30}} rx={Math.abs(right.x - left.x) * 0.56} ry={Math.abs(right.x - left.x) * 0.24} alpha={0.42} color="#071417" />
      <Inked w={ink}>
        <InkPath d={side} fill="url(#pad-side)" />
        <InkPath d={topD} fill="url(#pad-top)" />
      </Inked>
      <defs>
        <linearGradient id="pad-side" gradientUnits="userSpaceOnUse" x1={left.x.toFixed(0)} y1="0" x2={right.x.toFixed(0)} y2="0">
          <stop offset="0" stopColor="#E9EDEF" />
          <stop offset="0.35" stopColor="#CBD3D8" />
          <stop offset="1" stopColor="#7D8C96" />
        </linearGradient>
        <linearGradient id="pad-top" gradientUnits="userSpaceOnUse" x1={p0.x.toFixed(0)} y1={p1.y.toFixed(0)} x2={p1.x.toFixed(0)} y2={p0.y.toFixed(0)}>
          <stop offset="0" stopColor="#F3F5F6" />
          <stop offset="1" stopColor="#B4C0C7" />
        </linearGradient>
        <linearGradient id="pad-glass" gradientUnits="userSpaceOnUse" x1={p0.x.toFixed(0)} y1={p1.y.toFixed(0)} x2={p1.x.toFixed(0)} y2={p0.y.toFixed(0)}>
          <stop offset="0" stopColor="#2E3D45" />
          <stop offset="1" stopColor="#141C22" />
        </linearGradient>
        <linearGradient id="pad-cu" gradientUnits="userSpaceOnUse" x1={p0.x.toFixed(0)} y1={p1.y.toFixed(0)} x2={p1.x.toFixed(0)} y2={p0.y.toFixed(0)}>
          <stop offset="0" stopColor="#C98A5A" />
          <stop offset="0.5" stopColor="#9A5C34" />
          <stop offset="1" stopColor="#5E3420" />
        </linearGradient>
        <clipPath id="pad-gc">
          <path d={glass} />
        </clipPath>
      </defs>
      <path d={glass} fill="url(#pad-glass)" stroke={INK} strokeWidth={ink * 0.5} />
      <g clipPath="url(#pad-gc)">
        <path d={spD} fill="none" stroke="#1A1410" strokeWidth={wire * 1.18} strokeLinecap="round" />
        <path d={spD} fill="none" stroke="url(#pad-cu)" strokeWidth={wire} strokeLinecap="round" />
        <path d={spD} fill="none" stroke="#FFE2BC" strokeWidth={wire * 0.22} strokeLinecap="round" opacity={0.35} transform={`translate(${(-wire * 0.18).toFixed(1)} ${(-wire * 0.22).toFixed(1)})`} />
        {power > 0 && (
          <path d={spD} fill="none" stroke="#FFE6C4" strokeWidth={wire * 0.5} strokeLinecap="round" strokeDasharray={`${(k * 0.18).toFixed(1)} ${(k * 0.9).toFixed(1)}`}
            strokeDashoffset={(-t * k * 3.2).toFixed(1)} opacity={power * (0.22 + 0.1 * Math.sin(t * 2 * Math.PI * 2.3))} />
        )}
        {/* glass: a dark tint over the coil and one soft window reflection */}
        <path d={glass} fill="#0E171C" opacity={0.5} />
        <path d={glass} fill="url(#pad-refl)" />
        <defs>
          <linearGradient id="pad-refl" gradientUnits="userSpaceOnUse" x1={p0.x.toFixed(0)} y1={p1.y.toFixed(0)} x2={p1.x.toFixed(0)} y2={p0.y.toFixed(0)}>
            <stop offset="0.18" stopColor="#FFFFFF" stopOpacity={0} />
            <stop offset="0.26" stopColor="#FFFFFF" stopOpacity={0.12} />
            <stop offset="0.33" stopColor="#FFFFFF" stopOpacity={0} />
          </linearGradient>
        </defs>
      </g>
      {/* status LED on the bezel: lit while the alternating field is on */}
      <circle cx={led.x} cy={led.y} r={0.06 * k} fill={power > 0.05 ? '#FFB347' : '#6B5A48'} stroke={INK} strokeWidth={ink * 0.4} />
      {power > 0.05 && <circle cx={led.x} cy={led.y} r={0.2 * k} fill="url(#pad-led)" opacity={power} />}
      <defs>
        <radialGradient id="pad-led">
          <stop offset="0" stopColor="#FFC870" stopOpacity={0.7} />
          <stop offset="1" stopColor="#FFC870" stopOpacity={0} />
        </radialGradient>
      </defs>
    </g>
  );
};

/** the coil's lead cable, running back off the bench */
export const Cable: React.FC<{c: Cam; ink: number}> = ({c, ink}) => {
  const pts = [v3(-1.2, 2.1, 0.12), v3(-1.6, 3.4, 0.1), v3(-1.3, 5.2, 0.1), v3(-2.4, 8, 0.1)].map((p) => project(c, p));
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const w = 0.16 * pts[0].k;
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={w + ink} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#3A4650" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

export type CageParts = {back: React.ReactNode; front: React.ReactNode};
export const cage = (c: Cam, ink: number): CageParts => {
  const cp = camPos(c);
  const back: React.ReactNode[] = [], front: React.ReactNode[] = [];
  const bars = Array.from({length: NB}, (_, k) => {
    const a = (barAngle(k) * Math.PI) / 180;
    const x = RC * Math.cos(a), y = RC * Math.sin(a);
    const facing = (cp.x - x) * Math.cos(a) + (cp.y - y) * Math.sin(a) > 0;
    const dep = project(c, v3(x, y, ZT)).d;
    return {k, x, y, facing, dep};
  }).sort((p, q) => q.dep - p.dep);
  for (const b of bars) {
    const A = project(c, v3(b.x, b.y, ZT)), B = project(c, v3(b.x, b.y, ZT + CAGE_H));
    const el = (
      <g key={b.k}>
        <SoftShadow id={`bar-sh${b.k}`} c={{x: A.x + 4, y: A.y + 2}} rx={BAR_R * A.k * 2.6} ry={BAR_R * A.k * 1.3} alpha={0.5} color="#050B0E" />
        <Inked w={ink * 0.8}>
          <Capsule id={`bar${b.k}`} a={A} b={B} ra={BAR_R * A.k} rb={BAR_R * B.k} color="#B9C4CC" spec={0.55} k={1.3} />
        </Inked>
      </g>
    );
    (b.facing ? front : back).push(el);
  }
  const fa = facingAngle(c, v3(0, 0, 0));
  const ring = (a0: number, a1: number, key: string) => {
    const pts = circlePts(c, v3(0, 0, ZT + CAGE_H), RC, a0, a1, 40);
    const d = poly(pts, false);
    const k = pts[0].k;
    return (
      <g key={key}>
        <path d={d} fill="none" stroke={INK} strokeWidth={0.13 * k + ink * 0.9} strokeLinecap="round" />
        <path d={d} fill="none" stroke="#9AA7B1" strokeWidth={0.13 * k} strokeLinecap="round" />
        <path d={d} fill="none" stroke="#E7EDF1" strokeWidth={0.045 * k} strokeLinecap="round" transform={`translate(0 ${(-0.03 * k).toFixed(1)})`} opacity={0.85} />
      </g>
    );
  };
  return {
    back: (
      <g>
        {back}
        {ring(fa + 90, fa + 270, 'rb')}
      </g>
    ),
    front: (
      <g>
        {front}
        {ring(fa - 92, fa + 92, 'rf')}
      </g>
    ),
  };
};

/** screen region in front of the cage's front bars (for liquid that is outside and nearer than the bars) */
export const frontRegion = (c: Cam) => {
  const fa = facingAngle(c, v3(0, 0, 0));
  const arc = circlePts(c, v3(0, 0, ZT + 0.06), RC + 0.03, fa + 90, fa - 90, 40);
  const s0 = arc[0], s1 = arc[arc.length - 1];
  const e1 = s1.x > s0.x ? 1400 : -320, e0 = s1.x > s0.x ? -320 : 1400;
  return poly([...arc, {x: e1, y: s1.y}, {x: e1, y: 2400}, {x: e0, y: 2400}, {x: e0, y: s0.y}]);
};

/** an axis-aligned box: visible faces only, far first, one ink contour */
export const boxFaces = (c: Cam, lo: V3, hi: V3, cols: {top: string; nx: string; px: string; ny: string; py: string}) => {
  const cp = camPos(c);
  const ctr = m3(a3(lo, hi), 0.5);
  const P = (x: number, y: number, z: number) => project(c, v3(x, y, z));
  const faces = [
    {n: v3(0, 0, 1), q: [P(lo.x, lo.y, hi.z), P(hi.x, lo.y, hi.z), P(hi.x, hi.y, hi.z), P(lo.x, hi.y, hi.z)], col: cols.top, c: v3(ctr.x, ctr.y, hi.z)},
    {n: v3(0, -1, 0), q: [P(lo.x, lo.y, lo.z), P(hi.x, lo.y, lo.z), P(hi.x, lo.y, hi.z), P(lo.x, lo.y, hi.z)], col: cols.ny, c: v3(ctr.x, lo.y, ctr.z)},
    {n: v3(0, 1, 0), q: [P(lo.x, hi.y, lo.z), P(hi.x, hi.y, lo.z), P(hi.x, hi.y, hi.z), P(lo.x, hi.y, hi.z)], col: cols.py, c: v3(ctr.x, hi.y, ctr.z)},
    {n: v3(-1, 0, 0), q: [P(lo.x, lo.y, lo.z), P(lo.x, hi.y, lo.z), P(lo.x, hi.y, hi.z), P(lo.x, lo.y, hi.z)], col: cols.nx, c: v3(lo.x, ctr.y, ctr.z)},
    {n: v3(1, 0, 0), q: [P(hi.x, lo.y, lo.z), P(hi.x, hi.y, lo.z), P(hi.x, hi.y, hi.z), P(hi.x, lo.y, hi.z)], col: cols.px, c: v3(hi.x, ctr.y, ctr.z)},
  ];
  return faces.filter((f) => d3(f.n, s3(cp, f.c)) > 0).map((f) => ({d: poly(f.q), col: f.col, top: f.n.z > 0}));
};

const CORAL = '#DD7E66';
export const MouldBody: React.FC<{c: Cam; ink: number}> = ({c, ink}) => {
  const faces = boxFaces(c, v3(MOULD.x0, MOULD.y0, 0), v3(MOULD.x1, MOULD.y1, ZT), {
    top: lit(CORAL, 0.1), nx: shade(CORAL, 0.15), px: shade(CORAL, 0.38), ny: shade(CORAL, 0.22), py: shade(CORAL, 0.3),
  });
  const a = project(c, v3(MOULD.x0, MOULD.y0, 0)), b = project(c, v3(MOULD.x1, MOULD.y1, 0));
  return (
    <g>
      <SoftShadow id="mould-sh" c={{x: (a.x + b.x) / 2 + 24, y: (a.y + b.y) / 2 + 22}} rx={Math.abs(b.x - a.x) * 0.7} ry={Math.abs(b.y - a.y) * 0.62} alpha={0.4} color="#071417" />
      <Inked w={ink}>
        {faces.map((f, i) => (
          <InkPath key={i} d={f.d} fill={f.col} />
        ))}
      </Inked>
    </g>
  );
};
export const CORAL_C = CORAL;

/** the hand-held magnet: a nickel-plated NdFeB block in a dark holder on a rod that runs up out of frame */
export const Magnet: React.FC<{c: Cam; M: V3; ink: number; tilt?: number}> = ({c, M, ink}) => {
  const hx = 0.27, hy = 0.27, hz = 0.19;
  const faces = boxFaces(c, v3(M.x - hx, M.y - hy, M.z - hz), v3(M.x + hx, M.y + hy, M.z + hz), {
    top: '#CBD3D9', nx: '#A2AEB7', px: '#66727D', ny: '#8B97A1', py: '#7A8691',
  });
  const hc = v3(M.x, M.y, M.z + hz);
  const holder = cyl(c, hc, 0.2, 0.26);
  const rodDir = n3(v3(0.5, 0.26, 0.83));
  const r0 = project(c, a3(hc, v3(0, 0, 0.26))), r1 = project(c, a3(hc, a3(v3(0, 0, 0.26), m3(rodDir, 16))));
  const k = r0.k;
  return (
    <g>
      <Inked w={ink}>
        {faces.map((f, i) => (
          <InkPath key={i} d={f.d} fill={f.col} />
        ))}
      </Inked>
      <Deco>
        {/* bevel glint along the block's lit top edge */}
        {(() => {
          const p = project(c, v3(M.x - hx * 0.9, M.y - hy, M.z + hz)), q = project(c, v3(M.x + hx * 0.6, M.y - hy, M.z + hz));
          return <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="#FFFFFF" strokeWidth={0.03 * k} strokeLinecap="round" opacity={0.9} />;
        })()}
      </Deco>
      <Inked w={ink}>
        <InkPath d={holder.side} fill="url(#mag-hold)" />
        <InkPath d={holder.topD} fill="#41557A" />
      </Inked>
      <defs>
        <linearGradient id="mag-hold" gradientUnits="userSpaceOnUse" x1={holder.bot[0].x.toFixed(0)} y1="0" x2={holder.bot[holder.bot.length - 1].x.toFixed(0)} y2="0">
          <stop offset="0" stopColor="#4F6690" />
          <stop offset="0.4" stopColor="#30436A" />
          <stop offset="1" stopColor="#1A2744" />
        </linearGradient>
      </defs>
      <Inked w={ink}>
        <Capsule id="mag-rod" a={r0} b={r1} ra={0.07 * k} rb={0.07 * r1.k} color="#56698A" spec={0.4} />
      </Inked>
    </g>
  );
};

export const surfaceZ = (x: number, y: number) =>
  Math.hypot(x, y) <= RP || (x >= MOULD.x0 && x <= MOULD.x1 && y >= MOULD.y0 && y <= MOULD.y1) ? ZT : 0;

export {rgba};
