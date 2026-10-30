// HOOK 05: the set. Damp soil at the edge of a stone (where Brachinus shelters), muted and softly graded so the orange
// and blue-black beetle and the pale spray read first. Everything sits in the world (z = 0 is the ground), so it
// parallaxes with the camera; depth of field blurs by distance from the focus.
import React from 'react';
import {add3, Basis, mul3, proj, projPoly, smoothClosed, V3} from '../shared/three';
import {hash} from '../shared/lib';
import {lit, mix, rgba, shade} from '../shared/color';
import {INK} from '../shared/ink';
import {ellipsoidPath, inkW} from './core/draw3';

const f2 = (n: number) => n.toFixed(2);
const SOIL = '#5B5442';
const FOG = '#56655C';

type Peb = {c: V3; a: V3; yaw: number; col: string};
const PCOL = ['#7C7766', '#8A8270', '#6C6858', '#968C76', '#5F5B4D', '#A0927A'];
const PEBBLES: Peb[] = (() => {
  const out: Peb[] = [];
  for (let k = 0; out.length < 150 && k < 900; k++) {
    const x = -70 + hash(k * 1.37) * 110, y = -40 + hash(k * 2.71) * 150;
    // keep the stage (beetle, ant path, spray) clear
    if (x > -26 && x < 10 && y > -7 && y < 16) continue;
    const big = hash(k * 5.1) < 0.12;
    const r = big ? 2.2 + hash(k * 3.3) * 3.5 : 0.35 + hash(k * 3.3) * 1.3;
    out.push({c: [x, y, r * 0.25], a: [r, r * (0.6 + 0.35 * hash(k * 4.4)), r * (0.45 + 0.2 * hash(k * 6.6))], yaw: hash(k * 7.7) * 180, col: PCOL[Math.floor(hash(k * 8.8) * PCOL.length)]});
  }
  // a few grains close around the stage, small enough not to clutter it
  for (let k = 0; k < 40; k++) {
    const x = -24 + hash(k * 9.1 + 3) * 32, y = -6 + hash(k * 4.9 + 1) * 21;
    const r = 0.18 + hash(k * 2.2 + 7) * 0.32;
    out.push({c: [x, y, r * 0.3], a: [r, r * 0.8, r * 0.55], yaw: hash(k * 3.9) * 180, col: PCOL[Math.floor(hash(k * 6.1) * PCOL.length)]});
  }
  return out;
})();
type Leaf = {c: V3; L: number; Wd: number; yaw: number; col: string};
const LEAVES: Leaf[] = Array.from({length: 26}, (_, k) => ({
  c: [-80 + hash(k * 3.9 + 11) * 130, -30 + hash(k * 7.3 + 5) * 160, 0.05] as V3,
  L: 6 + hash(k * 2.1) * 12,
  Wd: 3 + hash(k * 4.2) * 5,
  yaw: hash(k * 5.6) * 360,
  col: ['#6E4F2E', '#86643A', '#5C4529', '#7B6A3E'][k % 4],
})).filter((q) => !(q.c[0] > -28 && q.c[0] < 12 && q.c[1] > -9 && q.c[1] < 18));
const SPECKS: {c: V3; r: number; col: string}[] = Array.from({length: 420}, (_, k) => ({
  c: [-45 + hash(k * 1.13 + 77) * 70, -20 + hash(k * 2.37 + 41) * 75, 0.01] as V3,
  r: 0.06 + hash(k * 3.71 + 9) * 0.22,
  col: hash(k * 5.9 + 3) < 0.6 ? '#3F3A2C' : '#8A8168',
}));
/** the big sheltering stone behind the stage, and a second one off to the side */
const STONES: {c: V3; a: V3; col: string}[] = [
  {c: [-46, 52, 4], a: [26, 14, 13], col: '#6B6B60'},
  {c: [14, 64, 2], a: [18, 12, 9], col: '#76705F'},
  {c: [-82, 18, 2], a: [14, 10, 8], col: '#6E695A'},
];

const pebPath = (B: Basis, p: Peb) => {
  const a = (p.yaw * Math.PI) / 180;
  const ex: V3 = [Math.cos(a) * p.a[0], Math.sin(a) * p.a[0], 0];
  const ey: V3 = [-Math.sin(a) * p.a[1], Math.cos(a) * p.a[1], 0];
  return ellipsoidPath(B, p.c, [ex, ey, [0, 0, p.a[2]]]);
};

/** focus depth (mm) and a blur in px per unit of relative defocus */
export const Env: React.FC<{B: Basis; focus: number; ns: string}> = ({B, focus, ns}) => {
  // ground colour by screen height: ray -> floor distance -> fog
  const ys = [0, 320, 640, 960, 1280, 1600, 1920];
  const groundAt = (y: number) => {
    const dx = 0, dy = -(y - B.cy) / B.f;
    const r = add3(B.fw, add3(mul3(B.r, dx), mul3(B.u, dy)));
    if (r[2] >= -1e-3) return FOG;
    const tHit = -B.eye[2] / r[2];
    const dist = tHit * Math.hypot(r[0], r[1], r[2]);
    return mix(lit(SOIL, 0.06), FOG, Math.min(1, Math.max(0, (dist - 40) / 260)));
  };
  type E = {z: number; el: React.ReactNode};
  const bins: E[][] = [[], [], [], []];
  const binOf = (z: number) => {
    const d = Math.abs(1 / Math.max(z, 1) - 1 / focus) * focus; // relative defocus
    return d < 0.18 ? 0 : d < 0.45 ? 1 : d < 0.8 ? 2 : 3;
  };
  STONES.forEach((s, k) => {
    const d = ellipsoidPath(B, s.c, [[s.a[0], 0, 0], [0, s.a[1], 0], [0, 0, s.a[2]]]);
    const C = proj(B, s.c);
    if (C.z < 5) return;
    const R = s.a[0] * C.s;
    bins[binOf(C.z)].push({z: C.z, el: (
      <g key={`st${k}`}>
        <defs>
          <radialGradient id={`${ns}st${k}`} gradientUnits="userSpaceOnUse" cx={f2(C.x - R * 0.3)} cy={f2(C.y - R * 0.45)} r={f2(R * 1.2)}>
            <stop offset="0" stopColor={lit(s.col, 0.25)} />
            <stop offset="0.5" stopColor={s.col} />
            <stop offset="1" stopColor={shade(s.col, 0.5)} />
          </radialGradient>
        </defs>
        <path d={d} fill={`url(#${ns}st${k})`} />
      </g>
    )});
  });
  LEAVES.forEach((q, k) => {
    const a = (q.yaw * Math.PI) / 180;
    const ex: V3 = [Math.cos(a), Math.sin(a), 0], ey: V3 = [-Math.sin(a), Math.cos(a), 0];
    const pts = Array.from({length: 14}, (_, j) => {
      const u = (j / 14) * 2 * Math.PI;
      const x = Math.cos(u) * q.L * 0.5, y = Math.sin(u) * q.Wd * 0.5 * (1 - 0.35 * Math.cos(u));
      return add3(q.c, add3(mul3(ex, x), mul3(ey, y)));
    });
    const P = pts.map((p) => proj(B, p));
    if (P.some((p) => p.z < 3)) return;
    const C = proj(B, q.c);
    const vein = `M${f2(proj(B, add3(q.c, mul3(ex, -q.L * 0.5))).x)},${f2(proj(B, add3(q.c, mul3(ex, -q.L * 0.5))).y)} L${f2(proj(B, add3(q.c, mul3(ex, q.L * 0.5))).x)},${f2(proj(B, add3(q.c, mul3(ex, q.L * 0.5))).y)}`;
    bins[binOf(C.z)].push({z: C.z + 1000, el: <g key={`lf${k}`}><path d={smoothClosed(P)} fill={q.col} opacity={0.8} /><path d={vein} stroke={lit(q.col, 0.3)} strokeWidth={f2(Math.max(0.8, 0.15 * C.s))} opacity={0.6} /></g>});
  });
  PEBBLES.forEach((p, k) => {
    const C = proj(B, p.c);
    if (C.z < 4) return;
    const R = p.a[0] * C.s;
    if (C.x < -R - 40 || C.x > 1120 + R || C.y < -R - 40 || C.y > 1960 + R) return;
    const d = pebPath(B, p);
    bins[binOf(C.z)].push({z: C.z, el: (
      <g key={`pb${k}`}>
        <path d={d} fill={`url(#${ns}peb${k % 6})`} stroke={rgba(INK, 0.5)} strokeWidth={f2(Math.min(2.2, inkW(C.s, 0.5)))} />
      </g>
    )});
  });
  SPECKS.forEach((q, k) => {
    const C = proj(B, q.c);
    if (C.z < 4) return;
    const r = q.r * C.s;
    if (r < 0.4 || C.x < -10 || C.x > 1090 || C.y < -10 || C.y > 1930) return;
    bins[binOf(C.z)].push({z: C.z + 2000, el: <ellipse key={`sk${k}`} cx={f2(C.x)} cy={f2(C.y)} rx={f2(r)} ry={f2(r * Math.max(0.3, -B.fw[2]))} fill={q.col} opacity={0.55} />});
  });
  // contact shading of the pebbles on the ground is folded into their gradient; the bins blur by defocus
  const blur = [0, 1.6, 4, 8];
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <linearGradient id={`${ns}gr`} x1="0" y1="0" x2="0" y2="1">
          {ys.map((y, k) => <stop key={k} offset={f2(y / 1920)} stopColor={groundAt(y)} />)}
        </linearGradient>
        {PCOL.map((c, k) => (
          <radialGradient key={k} id={`${ns}peb${k}`} cx="0.36" cy="0.3" r="0.8">
            <stop offset="0" stopColor={lit(c, 0.3)} />
            <stop offset="0.55" stopColor={c} />
            <stop offset="1" stopColor={shade(c, 0.55)} />
          </radialGradient>
        ))}
        {blur.map((b, k) => (b > 0 ? <filter key={k} id={`${ns}bl${k}`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={b} /></filter> : null))}
        <radialGradient id={`${ns}damp`} cx="0.5" cy="0.55" r="0.6">
          <stop offset="0" stopColor="#3E3A2E" stopOpacity="0.35" />
          <stop offset="1" stopColor="#3E3A2E" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill={`url(#${ns}gr)`} />
      {[3, 2, 1, 0].map((k) => {
        const els = bins[k].sort((a, b) => b.z - a.z).map((e) => e.el);
        return els.length ? <g key={k} filter={blur[k] > 0 ? `url(#${ns}bl${k})` : undefined}>{els}</g> : null;
      })}
    </svg>
  );
};
