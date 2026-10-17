// Smoke, dust and steam from soft radial-gradient blobs (cheap: one gradient per instance, no blur filters).
// Puffs are emitted on a fixed seeded schedule, so any frame can be rendered alone (deterministic, pre-rolled).
import React from 'react';
import {noise, rnd, clamp, lerp} from '../kit/math';
import {fxId} from './common';

const Puffs: React.FC<{id: string; color: string; shade?: string; puffs: {x: number; y: number; r: number; o: number}[]; edge?: number}> = ({id, color, shade, puffs, edge = 1}) => (
  <g>
    <defs>
      <radialGradient id={id}>
        <stop offset="0%" stopColor={color} stopOpacity={1} />
        <stop offset={`${Math.round(30 + edge * 48)}%`} stopColor={color} stopOpacity={0.95} />
        <stop offset={`${Math.round(70 + edge * 22)}%`} stopColor={color} stopOpacity={0.5} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </radialGradient>
      {shade && (
        <radialGradient id={`${id}s`}>
          <stop offset="0%" stopColor={shade} stopOpacity={0.85} />
          <stop offset="100%" stopColor={shade} stopOpacity={0} />
        </radialGradient>
      )}
    </defs>
    {shade && puffs.map((p, i) => <circle key={`s${i}`} cx={p.x + p.r * 0.12} cy={p.y + p.r * 0.32} r={p.r * 0.85} fill={`url(#${id}s)`} opacity={p.o * 0.7} />)}
    {puffs.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={`url(#${id})`} opacity={p.o} />)}
  </g>
);

export type SmokeProps = {
  x: number; y: number; t: number; seed?: number; color?: string; shade?: string; opacity?: number;
  mode?: 'column' | 'cloud';
  // column: emission at (x, y)
  rate?: number; life?: number; vx?: number; vy?: number; size?: number; grow?: number; spread?: number; wobble?: number; t0?: number; t1?: number;
  // cloud: region centred at (x, y)
  w?: number; h?: number; n?: number; drift?: number;
  id?: string;
};
/**
 * column: puffs emitted at (x, y) rate/s, rising with (vx, vy) units/s (vy < 0 = up), growing; optional emission
 * window [t0, t1]. cloud: n blobs churning inside a w × h region centred at (x, y), drifting by `drift` units/s.
 */
export const Smoke: React.FC<SmokeProps> = (p) => {
  const {x, y, t, seed = 1, color = '#3A2F33', shade, opacity = 0.8, mode = 'column'} = p;
  const id = p.id ?? fxId('sm', seed, x, y);
  const puffs: {x: number; y: number; r: number; o: number}[] = [];
  if (mode === 'column') {
    const rate = p.rate ?? 4, life = p.life ?? 5, vx = p.vx ?? 30, vy = p.vy ?? -160, size = p.size ?? 60, grow = p.grow ?? 70, spread = p.spread ?? 50, wob = p.wobble ?? 30;
    const t0 = p.t0 ?? -1e9, t1 = p.t1 ?? 1e9;
    const iLo = Math.floor((t - life) * rate) - 1, iHi = Math.floor(t * rate) + 1;
    for (let i = iLo; i <= iHi; i++) {
      const b = i / rate + (rnd(seed * 101 + i) - 0.5) * (0.6 / rate);
      if (b < t0 || b > t1) continue;
      const a = t - b;
      if (a < 0 || a > life) continue;
      const u = a / life;
      const sx = (rnd(seed * 37 + i) - 0.5) * spread;
      const px = x + sx * (0.4 + u) + vx * a + noise(b * 0.7 + a * 0.5, seed) * wob * (0.3 + u);
      const py = y + vy * a * (1 - 0.3 * u);
      const r = (size * (0.7 + 0.6 * rnd(seed * 59 + i)) + grow * a);
      const o = opacity * clamp(u * 7) * Math.pow(1 - u, 1.1);
      puffs.push({x: px, y: py, r, o});
    }
  } else {
    const w = p.w ?? 600, h = p.h ?? 300, n = p.n ?? 16, drift = p.drift ?? 12;
    for (let i = 0; i < n; i++) {
      const bx = rnd(seed * 7 + i) * w, by = rnd(seed * 11 + i) * h;
      const px = x - w / 2 + ((bx + drift * t) % w + w) % w;
      const py = y - h / 2 + by + noise(t * 0.25 + i, seed) * h * 0.08;
      const edge = Math.min(px - (x - w / 2), x + w / 2 - px) / (w * 0.18);
      const r = (Math.min(w, h) * (0.32 + 0.3 * rnd(seed * 17 + i))) * (1 + 0.08 * noise(t * 0.4 + i * 2, seed + 4));
      puffs.push({x: px, y: py, r, o: opacity * clamp(edge) * (0.65 + 0.35 * rnd(seed * 23 + i))});
    }
  }
  return <Puffs id={id} color={color} shade={shade} puffs={puffs} edge={mode === 'cloud' ? 0.45 : 1} />;
};

export type DustProps = {x: number; y: number; t: number; t0: number; seed?: number; size?: number; color?: string; life?: number; n?: number; dir?: number; id?: string; opacity?: number};
/** Impact dust: a low puff spreading along the ground from (x, y) at t0. dir: 0 = both ways, ±1 = biased. */
export const Dust: React.FC<DustProps> = ({x, y, t, t0, seed = 1, size = 120, color = '#B9AC9C', life = 2.2, n = 14, dir = 0, id, opacity = 0.75}) => {
  const a = t - t0;
  if (a < 0 || a > life) return null;
  const puffs: {x: number; y: number; r: number; o: number}[] = [];
  for (let i = 0; i < n; i++) {
    const side = dir !== 0 ? (rnd(seed * 3 + i) < 0.8 ? dir : -dir) : (i % 2 ? 1 : -1);
    const reach = size * (0.2 + 1.7 * ((i + rnd(seed * 5 + i)) / n));
    const k = 1 - Math.exp(-3.2 * a);
    const px = x + side * reach * k;
    const py = y - size * 0.25 - size * 0.55 * rnd(seed * 7 + i) * k - a * 18;
    const r = size * (0.32 + 0.3 * rnd(seed * 9 + i)) * (0.5 + 0.9 * k) * (1.15 - 0.4 * ((i + 0.5) / n));
    puffs.push({x: px, y: py, r, o: opacity * clamp(a * 12) * Math.pow(1 - a / life, 1.4)});
  }
  return <Puffs id={id ?? fxId('du', seed, x, y)} color={color} puffs={puffs} edge={0.6} />;
};

export type SteamProps = {
  mode?: 'jet' | 'cloud'; t: number; seed?: number; color?: string; opacity?: number; id?: string;
  // jet: from (x, y) toward dir (deg, 0 = right, -90 = up)
  x?: number; y?: number; dir?: number; length?: number; width?: number; rate?: number;
  // cloud: region
  x0?: number; y0?: number; x1?: number; y1?: number; density?: number;
};
export const steamBounds = (p: SteamProps) => ({x0: p.x0 ?? 0, y0: p.y0 ?? 0, x1: p.x1 ?? 600, y1: p.y1 ?? 400});
/** Blob list of a steam cloud at time t (also used by SteamClip so a projection can be clipped to the cloud). */
export const steamBlobs = (p: SteamProps) => {
  const {x0, y0, x1, y1} = steamBounds(p);
  const w = x1 - x0, h = y1 - y0, seed = p.seed ?? 1;
  const n = Math.round((p.density ?? 1) * Math.max(10, (w * h) / 16000));
  const out: {x: number; y: number; r: number; o: number}[] = [];
  for (let i = 0; i < n; i++) {
    const bx = rnd(seed * 7 + i), by = rnd(seed * 13 + i);
    const px = x0 + w * (0.08 + 0.84 * bx) + noise(p.t * 0.35 + i * 1.3, seed) * w * 0.05;
    const py = y0 + h * (0.12 + 0.76 * by) + noise(p.t * 0.3 + i * 2.1, seed + 5) * h * 0.06;
    const r = Math.min(w, h) * (0.26 + 0.2 * rnd(seed * 17 + i)) * (1 + 0.1 * noise(p.t * 0.6 + i, seed + 9));
    out.push({x: px, y: py, r, o: (p.opacity ?? 0.85) * (0.6 + 0.4 * rnd(seed * 19 + i))});
  }
  return out;
};
export const Steam: React.FC<SteamProps> = (p) => {
  const seed = p.seed ?? 1, t = p.t, color = p.color ?? '#F2F1EC';
  if ((p.mode ?? 'jet') === 'cloud') {
    const b = steamBounds(p);
    return <Puffs id={p.id ?? fxId('stc', seed, b.x0, b.y0)} color={color} shade="#C9CFD2" puffs={steamBlobs(p)} edge={0.8} />;
  }
  const x = p.x ?? 0, y = p.y ?? 0, dir = ((p.dir ?? -90) * Math.PI) / 180, L = p.length ?? 500, W = p.width ?? 160, rate = p.rate ?? 34;
  const life = 1.1, speed = L / life;
  const puffs: {x: number; y: number; r: number; o: number}[] = [];
  const iLo = Math.floor((t - life) * rate) - 1, iHi = Math.floor(t * rate) + 1;
  for (let i = iLo; i <= iHi; i++) {
    const b = i / rate + (rnd(seed * 3 + i) - 0.5) * (0.5 / rate);
    const a = t - b;
    if (a < 0 || a > life) continue;
    const u = a / life;
    const d = speed * life * (1 - Math.pow(1 - u, 1.8));
    const side = (rnd(seed * 5 + i) - 0.5) * W * u * 1.2;
    const px = x + Math.cos(dir) * d - Math.sin(dir) * side;
    const py = y + Math.sin(dir) * d + Math.cos(dir) * side - a * 30;
    const r = lerp(W * 0.1, W * 0.6, Math.pow(u, 0.7)) * (0.85 + 0.3 * rnd(seed * 7 + i));
    puffs.push({x: px, y: py, r, o: (p.opacity ?? 0.85) * clamp(u * 14) * Math.pow(1 - u, 0.8) * 0.8});
  }
  return <Puffs id={p.id ?? fxId('stj', seed, x, y)} color={color} puffs={puffs} />;
};
/** <clipPath id={clipId}> shaped like the steam cloud at time t (solid blobs), for clipping a projection to it. */
export const SteamClip: React.FC<SteamProps & {clipId: string; shrink?: number}> = ({clipId, shrink = 0.72, ...p}) => (
  <clipPath id={clipId}>{steamBlobs(p).map((b, i) => <circle key={i} cx={b.x} cy={b.y} r={b.r * shrink} />)}</clipPath>
);
