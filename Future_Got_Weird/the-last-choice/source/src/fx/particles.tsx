// Ballistic particles: debris chunks, sparks, hydraulic fluid, glass. All launched at t0 from an origin with seeded
// velocities in a cone (dir in degrees, screen angles: 0 = right, 90 = down, -90 = up), gravity in units/s², one
// damped bounce on an optional ground line and a slide to rest. Coherent trajectories, never random jitter.
import React from 'react';
import {C, SYS} from '../theme';
import {rnd, clamp, lerp} from '../kit/math';
import {ballistic, chunkPts, mixHex} from './common';

export type Material = 'concrete' | 'brick' | 'metal' | 'panel' | 'glass' | 'asphalt' | 'wood';
const MAT: Record<Material, {fills: string[]; stroke?: string; elong: [number, number]; n: number; op?: number}> = {
  concrete: {fills: ['#A39C94', '#8C857E', '#BDB6AC', '#7A736C'], elong: [0.8, 1.3], n: 5},
  brick: {fills: ['#8A4A3A', '#A0583F', '#6E3A2E'], elong: [1.1, 1.6], n: 4},
  metal: {fills: ['#5B6670', '#39424A', '#7F8A93'], elong: [1.6, 3], n: 4},
  panel: {fills: [SYS.panel, SYS.panelShade, SYS.panelDeep, SYS.slate], elong: [1.2, 2.2], n: 4},
  glass: {fills: ['#CFEAF2', '#E6F6FA', '#B5DCE8'], stroke: '#F4FCFF', elong: [0.8, 1.8], n: 3, op: 0.7},
  asphalt: {fills: ['#3B3638', '#57504F', '#2C2829'], elong: [0.9, 1.4], n: 5},
  wood: {fills: ['#9E6B30', '#C9924F', '#7A5226'], elong: [2, 3.5], n: 4},
};

export type DebrisProps = {
  x: number; y: number; t: number; t0: number; seed?: number; n?: number; dir?: number; spread?: number;
  speed?: [number, number]; size?: [number, number]; ground?: number; gravity?: number; material?: Material;
  ink?: number; life?: number; spin?: number; bounce?: number;
};
export const Debris: React.FC<DebrisProps> = ({x, y, t, t0, seed = 1, n = 14, dir = -90, spread = 110, speed = [500, 1500], size = [8, 26], ground, gravity = 2600, material = 'concrete', ink = 3, life, spin = 720, bounce = 0.28}) => {
  const tau = t - t0;
  if (tau < 0) return null;
  const m = MAT[material];
  const fade = life !== undefined ? clamp(1 - (tau - life) / 0.6) : 1;
  if (fade <= 0) return null;
  const out: React.ReactElement[] = [];
  for (let i = 0; i < n; i++) {
    const a = ((dir + (rnd(seed * 3 + i) - 0.5) * spread) * Math.PI) / 180;
    const v = lerp(speed[0], speed[1], Math.pow(rnd(seed * 5 + i), 0.8));
    const sz = lerp(size[0], size[1], Math.pow(rnd(seed * 7 + i), 1.6));
    const b = ballistic(x, y, Math.cos(a) * v, Math.sin(a) * v, tau, gravity, ground, bounce);
    const restT = b.landed ? Math.min(tau, 0.25 + rnd(seed * 9 + i) * 0.5) : tau;
    const rot = rnd(seed * 11 + i) * 360 + (rnd(seed * 13 + i) - 0.5) * spin * 2 * restT * (b.landed ? 0.6 : 1);
    const el = lerp(m.elong[0], m.elong[1], rnd(seed * 17 + i));
    const fill = m.fills[i % m.fills.length];
    const yy = b.landed ? Math.min(b.y, (ground ?? b.y) - sz * 0.35) : b.y;
    out.push(
      <g key={i} transform={`translate(${b.x.toFixed(1)} ${yy.toFixed(1)}) rotate(${rot.toFixed(1)})`}>
        <polygon points={chunkPts(sz, seed * 19 + i, m.n, 0.5, el)} fill={fill} stroke={m.stroke ?? C.ink} strokeWidth={material === 'glass' ? ink * 0.5 : ink} strokeLinejoin="round" opacity={m.op ?? 1} />
        {material === 'glass' && <line x1={-sz * 0.4} y1={-sz * 0.2} x2={sz * 0.2} y2={-sz * 0.4} stroke="#FFFFFF" strokeWidth={ink * 0.6} strokeLinecap="round" opacity={0.6 + 0.4 * Math.sin(t * 20 + i)} />}
      </g>,
    );
  }
  return <g opacity={fade}>{out}</g>;
};

export const GlassShards: React.FC<Omit<DebrisProps, 'material'> & {glitter?: boolean}> = ({glitter = true, ...p}) => {
  const tau = p.t - p.t0;
  return (
    <g>
      <Debris {...p} material="glass" spin={p.spin ?? 1100} size={p.size ?? [5, 16]} n={p.n ?? 26} bounce={0.18} />
      {glitter && tau >= 0 && tau < 0.12 && <circle cx={p.x} cy={p.y} r={30 + tau * 600} fill="#F4FCFF" opacity={0.5 * (1 - tau / 0.12)} />}
    </g>
  );
};

export type SparksProps = {
  x: number; y: number; t: number; t0: number; seed?: number; n?: number; dir?: number; spread?: number;
  speed?: [number, number]; gravity?: number; life?: [number, number]; mode?: 'burst' | 'stream'; t1?: number; rate?: number;
  width?: number; streak?: number; flash?: boolean;
};
const sparkCol = (u: number) => (u < 0.3 ? mixHex('#FFFBE6', '#FFD25E', u / 0.3) : mixHex('#FFD25E', '#FF6A1F', (u - 0.3) / 0.7));
export const Sparks: React.FC<SparksProps> = ({x, y, t, t0, seed = 1, n = 18, dir = -90, spread = 140, speed = [500, 1400], gravity = 1800, life = [0.25, 0.7], mode = 'burst', t1, rate = 30, width = 4, streak = 0.05, flash = true}) => {
  const tau = t - t0;
  if (tau < 0) return null;
  const out: React.ReactElement[] = [];
  const one = (key: string, sd: number, age: number) => {
    const L = lerp(life[0], life[1], rnd(sd * 3));
    if (age < 0 || age > L) return;
    const a = ((dir + (rnd(sd * 5) - 0.5) * spread) * Math.PI) / 180;
    const v = lerp(speed[0], speed[1], rnd(sd * 7));
    const vx = Math.cos(a) * v, vy = Math.sin(a) * v;
    const p1 = {x: x + vx * age, y: y + vy * age + 0.5 * gravity * age * age};
    const a0 = Math.max(0, age - streak);
    const p0 = {x: x + vx * a0, y: y + vy * a0 + 0.5 * gravity * a0 * a0};
    const u = age / L;
    if (u < 0.35) out.push(<line key={`${key}g`} x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke="#FFB23F" strokeWidth={width * 3.2} strokeLinecap="round" opacity={0.25 * (1 - u / 0.35)} />);
    out.push(<line key={key} x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke={sparkCol(u)} strokeWidth={width * (1 - u * 0.6)} strokeLinecap="round" opacity={1 - u * 0.5} />);
  };
  if (mode === 'burst') for (let i = 0; i < n; i++) one(`b${i}`, seed * 101 + i, tau);
  else {
    const end = Math.min(t, t1 ?? t);
    const kHi = Math.floor((end - t0) * rate), kLo = Math.max(0, Math.floor((t - t0 - life[1]) * rate));
    for (let k = kLo; k <= kHi; k++) {
      const e = t0 + k / rate + (rnd(seed * 7 + k) - 0.5) * (0.5 / rate);
      if (e > end) continue;
      one(`s${k}`, seed * 211 + k, t - e);
    }
  }
  const fl = flash ? (mode === 'burst' ? clamp(1 - tau / 0.09) : t1 !== undefined && t > t1 ? 0 : 0.6 + 0.4 * Math.sin(t * 60)) : 0;
  return (
    <g>
      {fl > 0 && <circle cx={x} cy={y} r={width * 6} fill="#FFF6D0" opacity={fl} />}
      {out}
    </g>
  );
};

export type FluidProps = {
  x: number; y: number; t: number; t0: number; seed?: number; mode?: 'spray' | 'stream' | 'drip' | 'puddle';
  dir?: number; spread?: number; speed?: number; ground?: number; size?: number; t1?: number; rate?: number; gravity?: number; color?: string; ink?: number;
};
const FL = SYS.fluid, SHEEN = '#6E8794';
/** Dark hydraulic fluid. spray: droplets that splat on the ground; stream: a pressurised arc that droops as the
 *  pressure falls (ends at t1); drip: a drop forming and falling every ~0.7 s; puddle: a growing pool at (x, y). */
export const Fluid: React.FC<FluidProps> = ({x, y, t, t0, seed = 1, mode = 'spray', dir = -30, spread = 50, speed = 700, ground, size = 60, t1, rate = 4, gravity = 2200, color = FL, ink = 3}) => {
  const tau = t - t0;
  if (tau < 0) return null;
  const out: React.ReactElement[] = [];
  if (mode === 'puddle') {
    const r = size * (1 - Math.exp(-tau / 1.6));
    out.push(<ellipse key="p" cx={x} cy={y} rx={r} ry={r * 0.22} fill={color} />);
    out.push(<ellipse key="ps" cx={x - r * 0.25} cy={y - r * 0.05} rx={r * 0.35} ry={r * 0.05} fill={SHEEN} opacity={0.5} />);
    return <g>{out}</g>;
  }
  if (mode === 'spray') {
    const n = Math.round(size / 3) + 10;
    for (let i = 0; i < n; i++) {
      const a = ((dir + (rnd(seed * 3 + i) - 0.5) * spread) * Math.PI) / 180;
      const v = speed * (0.4 + 0.6 * rnd(seed * 5 + i));
      const b = ballistic(x, y, Math.cos(a) * v, Math.sin(a) * v, tau, gravity, ground, 0, 12);
      const r = 3 + rnd(seed * 7 + i) * size * 0.08;
      if (b.landed && ground !== undefined) {
        const sp = r * 2.2;
        out.push(<ellipse key={i} cx={b.x} cy={ground - 1} rx={sp} ry={sp * 0.28} fill={color} />);
      } else {
        const ang = (Math.atan2(b.vy, b.vx) * 180) / Math.PI;
        const st = clamp(Math.hypot(b.vx, b.vy) / 900, 1, 2.4);
        out.push(<ellipse key={i} cx={b.x} cy={b.y} rx={r * st} ry={r} fill={color} transform={`rotate(${ang.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)})`} />);
      }
    }
    return <g>{out}</g>;
  }
  if (mode === 'stream') {
    const end = t1 ?? t0 + 2.5;
    if (t > end + 1.2) return null;
    const pressure = Math.exp(-Math.max(0, Math.min(t, end) - t0) / 1.4);
    const a = (dir * Math.PI) / 180;
    const pts: {x: number; y: number}[] = [];
    const m = 16;
    for (let k = 0; k <= m; k++) {
      const age = (k / m) * 0.45;
      const em = t - age;
      if (em < t0 || em > end) continue;
      const pr = Math.exp(-(em - t0) / 1.4);
      const v = speed * pr;
      const b = ballistic(x, y, Math.cos(a) * v, Math.sin(a) * v, age, gravity, ground, 0, 12);
      pts.push(b);
    }
    if (pts.length > 1) {
      const w0 = size * 0.32 * (0.4 + 0.6 * pressure);
      for (let k = 0; k < pts.length - 1; k++) {
        const w = w0 * (1 - (k / pts.length) * 0.6);
        out.push(<line key={k} x1={pts[k].x} y1={pts[k].y} x2={pts[k + 1].x} y2={pts[k + 1].y} stroke={color} strokeWidth={w} strokeLinecap="round" />);
      }
      out.push(<polyline key="sh" points={pts.slice(0, Math.ceil(pts.length * 0.6)).map((q) => `${q.x.toFixed(1)},${(q.y - w0 * 0.2).toFixed(1)}`).join(' ')} fill="none" stroke={SHEEN} strokeWidth={Math.max(1, w0 * 0.18)} strokeLinecap="round" opacity={0.7} />);
    }
    // the spatter where it lands
    if (ground !== undefined) out.push(<Fluid key="pd" x={x + Math.cos(a) * speed * 0.35} y={ground} t={t} t0={t0 + 0.3} mode="puddle" size={size * 1.4} />);
    return <g>{out}</g>;
  }
  // drip
  const P = 1 / Math.max(0.1, rate / 3);
  const k = Math.floor(tau / P);
  const u = tau / P - k;
  const form = clamp(u / 0.55);
  const r = 3 + size * 0.06 * form;
  if (u < 0.55) out.push(<path key="d" d={`M ${x - r * 0.5} ${y} Q ${x} ${y + r * 2.6} ${x + r * 0.5} ${y} Z`} fill={color} />, <circle key="dc" cx={x} cy={y + r * 1.6} r={r} fill={color} />);
  else {
    const ft = (u - 0.55) * P;
    const yy = y + r * 1.6 + 0.5 * gravity * ft * ft;
    if (ground === undefined || yy < ground) out.push(<ellipse key="df" cx={x} cy={yy} rx={r * 0.8} ry={r * 1.3} fill={color} />);
  }
  if (ground !== undefined) out.push(<Fluid key="dp" x={x} y={ground} t={t} t0={t0 + 0.6} mode="puddle" size={size} />);
  void ink;
  return <g>{out}</g>;
};
