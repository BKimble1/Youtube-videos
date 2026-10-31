// The set: a leaf seen almost edge-on from slightly above (the snail's floor), twigs, a bird dropping with the
// parasite's eggs, a looper caterpillar, and the soft forest behind. World millimetres.
import React from 'react';
import {add, closed, lerpP, mul, open, P, perp, pt, sub, nrm, tube} from '../core/geo';
import {uid} from '../core/ids';
import {clamp, hash, lerp, sm} from '../lib';
import {mix} from '../core/color';

export type LeafSpec = {x0: number; x1: number; y: number; far: number; near: number; tilt: number; hue: string; seed: number};

/** the visible upper surface of a leaf, from the far edge (above the sole line) to the near edge (below it) */
export const leafEdges = (L: LeafSpec) => {
  const n = 40;
  const top: P[] = [], bot: P[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const x = lerp(L.x0, L.x1, u);
    const wdt = Math.pow(Math.sin(Math.PI * clamp(0.04 + u * 0.96)), 0.75) * (1 - 0.25 * u);
    const yc = L.y + L.tilt * (x - L.x0);
    top.push(pt(x, yc - L.far * wdt));
    bot.push(pt(x, yc + L.near * wdt));
  }
  return {top, bot};
};
export const Leaf: React.FC<{L: LeafSpec; trail?: {x0: number; x1: number; y: number} | null; light?: number}> = ({L, trail, light = 1}) => {
  const id = uid('lf');
  const {top, bot} = leafEdges(L);
  const outline = [...top, ...[...bot].reverse()];
  const d = closed(outline, 0.6);
  const mid = top.map((p, i) => lerpP(p, bot[i], L.far / (L.far + L.near)));
  const veins: string[] = [];
  for (let i = 3; i < top.length - 3; i += 3) {
    const a = mid[i];
    const tF = top[Math.min(top.length - 1, i + 3)], tN = bot[Math.min(bot.length - 1, i + 2)];
    veins.push(open([a, lerpP(a, tF, 0.5), lerpP(a, tF, 0.95)]));
    veins.push(open([a, lerpP(a, tN, 0.5), lerpP(a, tN, 0.95)]));
  }
  const edge = closed([...bot, ...[...bot].reverse().map((p) => add(p, pt(0, 0.45)))], 0.6);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1={L.y - L.far} x2="0" y2={L.y + L.near} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={mix(L.hue, '#E6F0A0', 0.25 * light)} />
          <stop offset="0.5" stopColor={L.hue} />
          <stop offset="1" stopColor={mix(L.hue, '#10260C', 0.45)} />
        </linearGradient>
        <filter id={`${id}t`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="1.6 0.9" numOctaves={3} seed={L.seed} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.08  0 0 0 0 0.2  0 0 0 0 0.05  0 0 0 -1.4 0.95" />
        </filter>
        <clipPath id={`${id}c`}>
          <path d={d} />
        </clipPath>
        <filter id={`${id}b`} x="-10%" y="-50%" width="120%" height="200%">
          <feGaussianBlur stdDeviation="0.25" />
        </filter>
      </defs>
      <path d={edge} fill={mix(L.hue, '#0B1A08', 0.6)} />
      <path d={d} fill={`url(#${id}g)`} />
      <g clipPath={`url(#${id}c)`}>
        <rect x={L.x0} y={L.y - L.far - 2} width={L.x1 - L.x0} height={L.far + L.near + 4} filter={`url(#${id}t)`} opacity={0.6} />
        {veins.map((v, i) => <path key={i} d={v} fill="none" stroke={mix(L.hue, '#E9F2B4', 0.45)} strokeWidth={0.12} strokeOpacity={0.45} />)}
        <path d={open(mid)} fill="none" stroke={mix(L.hue, '#F2F6C8', 0.5)} strokeWidth={0.3} strokeOpacity={0.6} />
        {/* glossy sheen on the far half */}
        <path d={open(top.map((p, i) => lerpP(p, mid[i], 0.45)))} fill="none" stroke="#FFFFFF" strokeWidth={0.9} strokeOpacity={0.12 * light} filter={`url(#${id}b)`} />
        {trail && (
          <path d={`M${trail.x0} ${trail.y} L${trail.x1} ${trail.y}`} stroke="#E8F4FF" strokeWidth={1.1} strokeOpacity={0.22} filter={`url(#${id}b)`} />
        )}
      </g>
    </g>
  );
};

export const Twig: React.FC<{pts: P[]; r: number; color?: string}> = ({pts, r, color = '#5B4430'}) => {
  const id = uid('tw');
  const R = pts.map((_, i) => r * (1 - 0.35 * (i / (pts.length - 1))));
  const tb = tube(pts, R, true, true);
  const a = pts[0], b = pts[pts.length - 1];
  const nn = perp(nrm(sub(b, a)));
  const m = lerpP(a, b, 0.5);
  const bark: React.ReactNode[] = [];
  for (let i = 0; i < 26; i++) {
    const u = hash(i * 3.3) * 0.9 + 0.05;
    const j = Math.min(pts.length - 2, Math.floor(u * (pts.length - 1)));
    const p = lerpP(pts[j], pts[j + 1], u * (pts.length - 1) - j);
    const off = (hash(i * 7.1) - 0.5) * 1.4 * R[j];
    const q = add(p, mul(nn, off));
    bark.push(<path key={i} d={`M${q.x - 1.2} ${q.y} L${q.x + 1.2} ${q.y + 0.05}`} stroke="#2E2116" strokeWidth={0.12} strokeOpacity={0.5} />);
  }
  return (
    <g>
      <defs>
        <linearGradient id={`${id}g`} gradientUnits="userSpaceOnUse" x1={m.x + nn.x * r} y1={m.y + nn.y * r} x2={m.x - nn.x * r} y2={m.y - nn.y * r}>
          <stop offset="0" stopColor={mix(color, '#C9B08A', 0.35)} />
          <stop offset="0.5" stopColor={color} />
          <stop offset="1" stopColor={mix(color, '#120C06', 0.6)} />
        </linearGradient>
      </defs>
      <path d={closed(tb.outline, 0.8)} fill={`url(#${id}g)`} />
      {bark}
    </g>
  );
};

/** a bird dropping: a chalky white urate cap over a dark faecal centre, wet and glossy; eggs scattered in it */
export const Dropping: React.FC<{c: P; k: number; t: number; land?: number; eggs?: boolean; micro?: number}> = ({c, k, land = 1, eggs = true, micro = 0}) => {
  const id = uid('dp');
  const spl = sm(land);
  // in flight: a teardrop; landed: a splat
  const pts: P[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const rr = 1 + 0.18 * Math.sin(a * 3 + 1) + 0.12 * Math.sin(a * 5 + 2);
    const sx = lerp(0.75, 2.4, spl) * rr, sy = lerp(1.05, 0.55, spl) * rr;
    const rr2 = lerp(1, rr, spl);
    pts.push(pt(c.x + Math.cos(a) * (sx / rr) * rr2 * k, c.y + (Math.sin(a) * (sy / rr) * rr2) * k - 0.35 * spl * k));
  }
  const core: P[] = pts.map((p) => lerpP(c, p, 0.5)).map((p) => add(p, pt(0.25 * k, -0.1 * k)));
  const E = Array.from({length: 14}, (_, i) => pt(c.x + (hash(i * 2.1) - 0.5) * 3.6 * k * lerp(0.4, 1, spl), c.y - 0.35 * k * spl + (hash(i * 4.7) - 0.5) * 0.7 * k));
  return (
    <g>
      <defs>
        <radialGradient id={`${id}g`} cx={c.x - 0.6 * k} cy={c.y - 0.8 * k} r={2.6 * k} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.6" stopColor="#E9E6DA" />
          <stop offset="1" stopColor="#B9B3A0" />
        </radialGradient>
      </defs>
      <path d={closed(pts, 0.9)} fill={`url(#${id}g)`} />
      {micro > 0.01 && (
        <g opacity={micro}>
          <filter id={`${id}m`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="38" numOctaves={3} seed={5} />
            <feColorMatrix type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.52  0 0 0 0 0.42  0 0 0 -2.2 1.3" />
          </filter>
          <clipPath id={`${id}mc`}>
            <path d={closed(pts, 0.9)} />
          </clipPath>
          <rect x={c.x - 3 * k} y={c.y - 2 * k} width={6 * k} height={3 * k} filter={`url(#${id}m)`} clipPath={`url(#${id}mc)`} />
        </g>
      )}
      <path d={closed(core, 0.9)} fill="#3B3020" opacity={0.85} />
      <path d={closed(core.map((p) => lerpP(add(c, pt(0.3 * k, -0.15 * k)), p, 0.55)), 0.9)} fill="#5A4A2E" opacity={0.6} />
      <ellipse cx={c.x - 0.7 * k} cy={c.y - 0.75 * k * lerp(1, 0.6, spl)} rx={0.5 * k} ry={0.22 * k} fill="#FFFFFF" opacity={0.85} />
      {eggs && E.map((e, i) => <ellipse key={i} cx={e.x} cy={e.y} rx={0.045 * k} ry={0.028 * k} fill="#C38B34" stroke="#5A3A10" strokeWidth={0.005 * k} opacity={0.9} />)}
    </g>
  );
};

/** a green looper caterpillar on a twig, inching forward: rings of yellow and deep green, black flecks */
export const Caterpillar: React.FC<{base: P; dirx: number; t: number; phase: number; L?: number}> = ({base, dirx, t, phase, L = 9}) => {
  const id = uid('cp');
  const n = 30;
  const w = 2 * Math.PI * phase;
  const arch = Math.max(0, Math.sin(w)) * 0.55;
  const C: P[] = [], R: number[] = [];
  const len = L * (1 - 0.18 * arch);
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const x = base.x + dirx * len * u;
    const y = base.y - 1.15 - arch * 2.6 * Math.sin(Math.PI * clamp((u - 0.15) / 0.7)) - 0.25 * Math.sin(w * 2 - 4 * u) * (1 - arch);
    C.push(pt(x, y));
    R.push(0.95 + 0.2 * Math.sin(Math.PI * u) - 0.3 * sm((u - 0.9) / 0.1));
  }
  const tb = tube(C, R, true, true);
  const rings: React.ReactNode[] = [];
  for (let i = 1; i < n - 2; i++) {
    const c = i % 4 === 0 ? '#1E3D16' : i % 4 === 2 ? '#E7D040' : null;
    if (!c) continue;
    const q = [add(C[i], mul(tb.N[i], R[i])), add(C[i + 1], mul(tb.N[i + 1], R[i + 1])), add(C[i + 1], mul(tb.N[i + 1], -R[i + 1])), add(C[i], mul(tb.N[i], -R[i]))];
    rings.push(<path key={i} d={closed(q, 0.3)} fill={c} opacity={0.85} />);
  }
  const head = C[n - 1];
  return (
    <g>
      <defs>
        <clipPath id={`${id}c`}>
          <path d={closed(tb.outline, 0.9)} />
        </clipPath>
      </defs>
      <path d={closed(tb.outline, 0.9)} fill="#8CC23A" />
      <g clipPath={`url(#${id}c)`}>
        {rings}
        <path d={open(C.map((p, i) => add(p, mul(tb.N[i], -0.75 * R[i]))))} fill="none" stroke="#0E2208" strokeWidth={0.45} strokeOpacity={0.45} />
        <path d={open(C.map((p, i) => add(p, mul(tb.N[i], 0.45 * R[i]))))} fill="none" stroke="#FFFFFF" strokeWidth={0.14} strokeOpacity={0.4} />
      </g>
      <circle cx={head.x} cy={head.y} r={0.8} fill="#5E8A26" />
      <circle cx={head.x + dirx * 0.3} cy={head.y - 0.15} r={0.18} fill="#0B0B08" />
    </g>
  );
};

/** soft forest beyond: light through a canopy, and out-of-focus highlights */
export const FarForest: React.FC<{light: number}> = ({light}) => {
  const id = uid('ff');
  const spots = Array.from({length: 46}, (_, i) => ({x: -500 + hash(i * 1.7) * 1100, y: -650 + hash(i * 3.9) * 1300, r: 12 + hash(i * 5.3) * 38, c: hash(i * 2.9)}));
  return (
    <g>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="-700" x2="0" y2="700" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={mix('#9DBB66', '#DDE8A0', 0.3 * light)} />
          <stop offset="0.45" stopColor="#4F7436" />
          <stop offset="1" stopColor="#1D3318" />
        </linearGradient>
      </defs>
      <rect x={-900} y={-900} width={1900} height={1900} fill={`url(#${id}g)`} />
      {spots.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={s.c > 0.66 ? '#E9F0B0' : s.c > 0.33 ? '#6E9A44' : '#22401C'} opacity={s.c > 0.66 ? 0.22 * (0.6 + 0.4 * light) : 0.28} />
      ))}
    </g>
  );
};
/** out-of-focus leaves and stems between the set and the far forest */
export const MidPlants: React.FC<{seed: number; n: number; spread: [number, number, number, number]; scale: number; dark: number}> = ({seed, n, spread, scale, dark}) => {
  const items: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const x = spread[0] + hash(i * 3.1 + seed) * (spread[1] - spread[0]);
    const y = spread[2] + hash(i * 5.7 + seed) * (spread[3] - spread[2]);
    const a = (hash(i * 7.3 + seed) - 0.5) * 2.4;
    const L = scale * (0.6 + hash(i * 1.3 + seed));
    const tipP = add(pt(x, y), mul({x: Math.cos(a), y: Math.sin(a)}, L));
    const nn = perp(nrm(sub(tipP, pt(x, y))));
    const m = lerpP(pt(x, y), tipP, 0.45);
    const wv = L * 0.28;
    const col = mix('#3F6A2C', '#0F2210', dark * (0.5 + 0.5 * hash(i * 9.1 + seed)));
    items.push(<path key={i} d={closed([pt(x, y), add(m, mul(nn, wv)), tipP, add(m, mul(nn, -wv))], 0.9)} fill={col} />);
    if (i % 3 === 0) items.push(<path key={`s${i}`} d={`M${x} ${y} Q${x + (hash(i) - 0.5) * scale} ${y + scale * 1.2} ${x + (hash(i) - 0.5) * scale * 1.5} ${y + scale * 2.5}`} fill="none" stroke={col} strokeWidth={scale * 0.12} opacity={0.7} />);
  }
  return <g>{items}</g>;
};
void sub;
