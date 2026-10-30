// The worksite: a single, non-electrified track through highland larch forest in autumn (the JR East work reported
// on the Koumi Line near Nobeyama; drawn as an original illustration, not a depiction of the exact spot).
// Camera: the world point at screen centre and a zoom (screen px per cm). Background layers pan and zoom less.
import React from 'react';
import {add, clamp, lerp, mul, norm, perp, sub, V} from '../dc/math';
import {lit, shade} from '../dc/color';
import {H, hash, W} from '../lib/core';
import {circ, f, INK, IP, Line, Mat, poly} from '../lib/draw';

export type Cam = {x: number; y: number; z: number};
/** a layer whose camera moves `p` of the main camera's travel and zooms with exponent `q` (anchored at a0) */
export const Layer: React.FC<{cam: Cam; p?: number; q?: number; a0?: V; children: React.ReactNode; opacity?: number}> = ({cam, p = 1, q = 1, a0 = {x: 500, y: -700}, children, opacity}) => {
  const z = Math.pow(cam.z, q);
  const x = a0.x + (cam.x - a0.x) * p;
  const y = a0.y + (cam.y - a0.y) * p;
  return (
    <g transform={`translate(${W / 2} ${H / 2}) scale(${z.toFixed(5)}) translate(${f(-x)} ${f(-y)})`} opacity={opacity}>
      {children}
    </g>
  );
};
export const toScreen = (cam: Cam, p: V): V => ({x: W / 2 + (p.x - cam.x) * cam.z, y: H / 2 + (p.y - cam.y) * cam.z});

export const PALW = {
  sky0: '#BFE3F2',
  sky1: '#EAF6F4',
  mount: '#8FA9C2',
  mountSnow: '#F4F8FB',
  larch: '#E3A43A',
  larchDeep: '#B9742A',
  larchLight: '#F6CD6B',
  pine: '#3F6E58',
  grass: '#A7B860',
  grassDeep: '#7B8F45',
  ballast: '#9A938A',
  sleeper: '#6E5A48',
  rail: '#5B6670',
  bark: '#7A5B45',
  barkDeep: '#4F3A2C',
  wood: '#F2D7A6',
  woodDeep: '#D9B176',
};

export const WorldDefs: React.FC = () => (
  <defs>
    <linearGradient id="w-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={PALW.sky0} />
      <stop offset="1" stopColor={PALW.sky1} />
    </linearGradient>
    <linearGradient id="w-mount" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#A9BED3" />
      <stop offset="1" stopColor="#CFDDE6" />
    </linearGradient>
    <Mat id="w-bark" c={PALW.bark} />
    <Mat id="w-larch" c={PALW.larch} k={0.7} />
    <Mat id="w-pine" c={PALW.pine} k={0.6} />
    <Mat id="w-grass" c={PALW.grass} k={0.5} />
    <Mat id="w-ballast" c={PALW.ballast} k={0.5} />
    <Mat id="w-rail" c={PALW.rail} k={0.8} />
    <radialGradient id="w-wood" cx="0.4" cy="0.4" r="0.7">
      <stop offset="0" stopColor="#FBE9C6" />
      <stop offset="0.7" stopColor={PALW.wood} />
      <stop offset="1" stopColor={PALW.woodDeep} />
    </radialGradient>
  </defs>
);

/** sky, far mountains and the larch forest (parallax layers) */
export const Backdrop: React.FC<{cam: Cam; t: number}> = ({cam}) => {
  // depth of field: the closer the camera, the softer the background (stdDeviation in screen px)
  const dof = clamp((Math.log(cam.z) + 0.2) / 2.2) * 9;
  const ridge: V[] = [];
  for (let i = 0; i <= 40; i++) {
    const x = -6000 + i * 330;
    const y = -1500 - (hash(i * 3.1) * 520 + (i % 7 === 3 ? 520 : 0) + Math.sin(i * 0.7) * 160);
    ridge.push({x, y});
  }
  const trees = (n: number, y0: number, h: number, seed: number, col: string, spread: number) =>
    Array.from({length: n}, (_, i) => {
      const x = -5000 + i * spread + hash(i + seed) * spread * 0.8;
      const hh = h * (0.7 + hash(i * 7 + seed) * 0.6);
      const w = hh * 0.34;
      return <path key={i} d={poly([{x, y: y0 - hh}, {x: x + w, y: y0}, {x: x - w, y: y0}])} fill={col} />;
    });
  return (
    <g>
      <rect x={-1} y={-1} width={W + 2} height={H + 2} fill="url(#w-sky)" />
      <Layer cam={cam} p={0.08} q={0.15}>
        <path d={poly([...ridge, {x: 8000, y: 1000}, {x: -6000, y: 1000}])} fill="url(#w-mount)" />
        {ridge.filter((_, i) => i % 7 === 3).map((r, i) => (
          <path key={i} d={poly([r, add(r, {x: 120, y: 160}), add(r, {x: 30, y: 120}), add(r, {x: -60, y: 170})])} fill={PALW.mountSnow} opacity={0.9} />
        ))}
      </Layer>
      <defs>
        <filter id={`w-dof1-${Math.round(dof * 10)}`} x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation={(dof * 0.7).toFixed(2)} /></filter>
        <filter id={`w-dof2-${Math.round(dof * 10)}`} x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation={dof.toFixed(2)} /></filter>
      </defs>
      <g filter={dof > 0.4 ? `url(#w-dof1-${Math.round(dof * 10)})` : undefined}>
      <Layer cam={cam} p={0.25} q={0.35}>
        <rect x={-6000} y={-700} width={14000} height={2000} fill="#C9C77A" opacity={0.0} />
        <g opacity={0.55}>{trees(90, -500, 900, 11, '#D7B166', 150)}</g>
        <path d={`M-6000 -520 L8000 -520 L8000 2000 L-6000 2000 Z`} fill="#BDBB79" opacity={0.55} />
      </Layer>
      </g>
      <g filter={dof > 0.4 ? `url(#w-dof2-${Math.round(dof * 10)})` : undefined}>
      <Layer cam={cam} p={0.5} q={0.6}>
        {Array.from({length: 60}, (_, i) => {
          const x = -5000 + i * 230 + hash(i + 77) * 120;
          return <rect key={i} x={x} y={-1000} width={14} height={900} fill="#6B5444" opacity={0.7} />;
        })}
        <g opacity={0.85}>{trees(46, -120, 1150, 23, PALW.larch, 300)}</g>
        <g opacity={0.8}>{trees(28, -100, 1500, 41, '#5E8467', 480)}</g>
        <path d={`M-6000 -140 L8000 -140 L8000 3000 L-6000 3000 Z`} fill="#A9B467" />
      </Layer>
      </g>
    </g>
  );
};

/** ground band, ballast and the track (side-on, a little from above so both rails read) */
export const Track: React.FC<{x0?: number; x1?: number}> = ({x0 = -4000, x1 = 6000}) => {
  const sleepers = [];
  for (let x = x0; x < x1; x += 60) {
    sleepers.push(<path key={x} d={poly([{x, y: 2}, {x: x + 26, y: 2}, {x: x + 34, y: -26}, {x: x + 10, y: -26}])} fill={PALW.sleeper} stroke={INK} strokeWidth={1.2} />);
  }
  return (
    <g>
      <path d={`M${x0} -40 L${x1} -40 L${x1} 800 L${x0} 800 Z`} fill="url(#w-grass)" />
      <path d={`M${x0} -34 L${x1} -34 L${x1} 40 L${x0} 40 Z`} fill="url(#w-ballast)" stroke={INK} strokeWidth={2} />
      {sleepers}
      {/* far rail, near rail */}
      <path d={`M${x0} -27 L${x1} -27 L${x1} -20 L${x0} -20 Z`} fill="url(#w-rail)" stroke={INK} strokeWidth={1.5} />
      <path d={`M${x0} -9 L${x1} -9 L${x1} 0 L${x0} 0 Z`} fill="url(#w-rail)" stroke={INK} strokeWidth={1.8} />
      <path d={`M${x0} -9 L${x1} -9`} stroke="#C9D2DA" strokeWidth={1.5} />
      <path d={`M${x0} 40 L${x1} 40 L${x1} 800 L${x0} 800 Z`} fill="#93A456" />
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// Branches. A branch is a polyline from the trunk end (index 0) to the tip, with a radius at each point.
export type BranchDef = {id: string; pts: V[]; r: number[]; seed: number};

/** point and tangent at arc fraction u (0 trunk end .. 1 tip) */
export const along = (b: BranchDef, u: number) => {
  const L: number[] = [0];
  for (let i = 1; i < b.pts.length; i++) L.push(L[i - 1] + Math.hypot(b.pts[i].x - b.pts[i - 1].x, b.pts[i].y - b.pts[i - 1].y));
  const s = clamp(u) * L[L.length - 1];
  let i = 1;
  while (i < L.length - 1 && L[i] < s) i++;
  const t = (s - L[i - 1]) / (L[i] - L[i - 1] || 1);
  const p = {x: lerp(b.pts[i - 1].x, b.pts[i].x, t), y: lerp(b.pts[i - 1].y, b.pts[i].y, t)};
  const d = norm(sub(b.pts[i], b.pts[i - 1]));
  const r = lerp(b.r[i - 1], b.r[i], t);
  return {p, d, r, s, total: L[L.length - 1]};
};

const tube = (b: BranchDef, u0: number, u1: number, n = 18) => {
  const top: V[] = [];
  const bot: V[] = [];
  for (let k = 0; k <= n; k++) {
    const a = along(b, lerp(u0, u1, k / n));
    const nn = perp(a.d);
    top.push(add(a.p, mul(nn, -a.r)));
    bot.push(add(a.p, mul(nn, a.r)));
  }
  return [...top, ...bot.reverse()];
};

/** larch needle tufts and twigs along the branch (deterministic) */
const Foliage: React.FC<{b: BranchDef; u0: number; u1: number; scale?: number}> = ({b, u0, u1, scale = 1}) => {
  const items = [];
  for (let i = 0; i < 16; i++) {
    const u = lerp(0.7, 1, hash(b.seed + i * 1.7));
    if (u < u0 || u > u1) continue;
    const a = along(b, u);
    const side = hash(b.seed + i * 3.3) > 0.5 ? 1 : -1;
    const nn = perp(a.d);
    const len = (30 + hash(b.seed + i * 5.1) * 45) * scale;
    const tip = add(add(a.p, mul(nn, side * len)), mul(a.d, len * 0.6));
    items.push(
      <g key={i}>
        <Line a={a.p} b={tip} w={Math.max(2, a.r * 0.28)} c={PALW.barkDeep} />
        {[0, 1, 2].map((j) => {
          const c = add(lerp2(a.p, tip, 0.45 + j * 0.27), {x: (hash(i * 9 + j) - 0.5) * 12, y: (hash(i * 13 + j) - 0.5) * 12});
          const rr = (8 + hash(i * 17 + j) * 7) * scale;
          return <ellipse key={j} cx={f(c.x)} cy={f(c.y)} rx={f(rr)} ry={f(rr * 0.72)} fill={j % 2 ? PALW.larch : PALW.larchLight} stroke={shade(PALW.larch, 0.4)} strokeWidth={1.2} />;
        })}
      </g>,
    );
  }
  return <g>{items}</g>;
};
const lerp2 = (a: V, b: V, t: number): V => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t)});

export type CutState = {
  /** where the cut is (arc fraction) */
  u: number;
  /** kerf depth 0..1 (1 = through) */
  k: number;
  /** after the cut: rigid transform of the outer piece (deg rotation about `pivot`, then translation) */
  rot: number;
  pivot: V;
  move: V;
};

/** the branch with an optional cut; the outer piece is drawn under its own transform */
export const Branch: React.FC<{b: BranchDef; cut?: CutState; foliage?: boolean; sawdustT?: number}> = ({b, cut, foliage = true}) => {
  if (!cut) {
    return (
      <g>
        <IP d={poly(tube(b, 0, 1))} fill="url(#w-bark)" ink={3} />
        <BarkLines b={b} u0={0} u1={1} />
        {foliage && <Foliage b={b} u0={0} u1={1} />}
      </g>
    );
  }
  const c = along(b, cut.u);
  const nn = perp(c.d);
  const kerfW = 5;
  // inner part (attached): tube to the cut, with a notch of depth k from the top side
  const inner = tube(b, 0, cut.u - kerfW / c.total);
  const outerPts = tube(b, cut.u + kerfW / c.total, 1);
  const through = cut.k >= 1;
  // notch polygon (drawn in the background colour of the cut face)
  const top = add(c.p, mul(nn, -c.r - 1));
  const depth = cut.k * c.r * 2;
  const notch = [add(top, mul(c.d, -kerfW)), add(top, mul(c.d, kerfW)), add(add(top, mul(nn, depth)), mul(c.d, kerfW * 0.7)), add(add(top, mul(nn, depth)), mul(c.d, -kerfW * 0.7))];
  const tr = `translate(${f(cut.move.x)} ${f(cut.move.y)}) rotate(${f(cut.rot)} ${f(cut.pivot.x)} ${f(cut.pivot.y)})`;
  const bridge = !through ? tube(b, cut.u - kerfW / c.total, cut.u + kerfW / c.total, 2) : null;
  return (
    <g>
      <IP d={poly(inner)} fill="url(#w-bark)" ink={3} />
      <BarkLines b={b} u0={0} u1={cut.u - 0.01} />
      {foliage && <Foliage b={b} u0={0} u1={cut.u - 0.02} />}
      {bridge && <IP d={poly(bridge)} fill="url(#w-bark)" ink={0} />}
      {cut.k > 0 && !through && <path d={poly(notch)} fill="url(#w-wood)" stroke={shade(PALW.woodDeep, 0.3)} strokeWidth={1.2} />}
      {through && <path d={`M${f(c.p.x - c.d.x * kerfW)} ${f(c.p.y - c.d.y * kerfW)} m0 0`} />}
      {/* fresh cut face on the stump end */}
      {through && <ellipse cx={f(c.p.x - c.d.x * kerfW)} cy={f(c.p.y - c.d.y * kerfW)} rx={f(c.r * 0.3)} ry={f(c.r)} transform={`rotate(${f((Math.atan2(c.d.y, c.d.x) * 180) / Math.PI)} ${f(c.p.x - c.d.x * kerfW)} ${f(c.p.y - c.d.y * kerfW)})`} fill="url(#w-wood)" stroke={INK} strokeWidth={2} />}
      <g transform={tr}>
        <IP d={poly(outerPts)} fill="url(#w-bark)" ink={3} />
        <BarkLines b={b} u0={cut.u + 0.01} u1={1} />
        {foliage && <Foliage b={b} u0={cut.u + 0.02} u1={1} />}
        {through && <ellipse cx={f(c.p.x + c.d.x * kerfW)} cy={f(c.p.y + c.d.y * kerfW)} rx={f(c.r * 0.3)} ry={f(c.r)} transform={`rotate(${f((Math.atan2(c.d.y, c.d.x) * 180) / Math.PI)} ${f(c.p.x + c.d.x * kerfW)} ${f(c.p.y + c.d.y * kerfW)})`} fill="url(#w-wood)" stroke={INK} strokeWidth={2} />}
      </g>
    </g>
  );
};

const BarkLines: React.FC<{b: BranchDef; u0: number; u1: number}> = ({b, u0, u1}) => {
  const out = [];
  for (let i = 0; i < 22; i++) {
    const u = lerp(u0, u1, hash(b.seed * 3 + i * 1.31));
    const a = along(b, u);
    if (a.r < 3) continue;
    const nn = perp(a.d);
    const off = (hash(b.seed + i * 7.7) - 0.5) * 1.3 * a.r;
    const p0 = add(a.p, mul(nn, off));
    const L = a.r * (0.8 + hash(i * 2.3) * 1.6);
    out.push(<Line key={i} a={p0} b={add(p0, mul(a.d, L))} w={Math.max(1, a.r * 0.08)} c={shade(PALW.bark, 0.5)} o={0.7} />);
  }
  return <g>{out}</g>;
};

/** a tree on the embankment: trunk + a few limbs + crown (the branch being worked is drawn separately) */
export const Tree: React.FC<{x: number; y: number; h: number; seed: number; crown?: boolean}> = ({x, y, h, seed, crown = true}) => {
  const trunk = [
    {x: x - 34, y},
    {x: x - 22, y: y - h * 0.55},
    {x: x - 12, y: y - h},
    {x: x + 12, y: y - h},
    {x: x + 24, y: y - h * 0.55},
    {x: x + 36, y},
  ];
  return (
    <g>
      {crown && Array.from({length: 9}, (_, i) => {
        const cy = y - h * (0.42 + i * 0.065);
        const w = h * (0.34 - i * 0.03);
        return <path key={i} d={poly([{x: x - w, y: cy + 60}, {x: x + (hash(seed + i) - 0.5) * 20, y: cy - 130}, {x: x + w, y: cy + 60}])} fill={i % 2 ? PALW.larch : '#EBB54C'} stroke={shade(PALW.larch, 0.45)} strokeWidth={2.2} strokeLinejoin="round" />;
      })}
      <IP d={poly(trunk)} fill="url(#w-bark)" ink={3} />
      {Array.from({length: 8}, (_, i) => (
        <Line key={i} a={{x: x - 18 + hash(seed + i) * 30, y: y - h * hash(seed + i * 3)}} b={{x: x - 18 + hash(seed + i) * 30, y: y - h * hash(seed + i * 3) - 60}} w={2} c={PALW.barkDeep} o={0.6} />
      ))}
    </g>
  );
};

/** sawdust: particles from the kerf, drifting down with gravity (deterministic per particle) */
export const Sawdust: React.FC<{at: V; dir: V; t: number; t0: number; t1: number; scale?: number}> = ({at, dir, t, t0, t1, scale = 1}) => {
  const out = [];
  const rate = 70;
  const n0 = Math.max(0, Math.floor((t - 1.4 - t0) * rate));
  const n1 = Math.floor((Math.min(t, t1) - t0) * rate);
  for (let i = n0; i <= n1; i++) {
    const born = t0 + i / rate;
    const age = t - born;
    if (age < 0 || age > 1.4) continue;
    const sp = (90 + hash(i * 1.7) * 160) * scale;
    const ang = (hash(i * 2.9) - 0.5) * 0.9;
    const d = norm({x: dir.x * Math.cos(ang) - dir.y * Math.sin(ang), y: dir.x * Math.sin(ang) + dir.y * Math.cos(ang)});
    const p = add(at, {x: d.x * sp * age, y: d.y * sp * age + 260 * scale * age * age});
    const r = (1.2 + hash(i * 4.1) * 2.2) * scale;
    out.push(<rect key={i} x={f(p.x - r)} y={f(p.y - r * 0.6)} width={f(r * 2)} height={f(r * 1.2)} fill={i % 3 ? '#F4DDB0' : '#E2BD7E'} opacity={clamp(1.3 - age)} transform={`rotate(${f(hash(i) * 180 + age * 400)} ${f(p.x)} ${f(p.y)})`} />);
  }
  return <g>{out}</g>;
};

export {lit};
