// Stylised fire, embers and falling ash. Flat layered tongues (ember → flame → hot → core) with seeded flicker; no
// outlines, matching the flat vector language. Anchor: (x, y) = centre of the fire's base line.
import React from 'react';
import {CITY} from '../theme';
import {noise, rnd, clamp} from '../kit/math';
import {fxId} from './common';
import {Glow} from './light';

const tongue = (cx: number, by: number, bw: number, hh: number, sway: number) => {
  const L = cx - bw / 2, R = cx + bw / 2, tx = cx + sway, ty = by - hh;
  const f = (n: number) => n.toFixed(1);
  return `M ${f(L)} ${f(by)} C ${f(L - bw * 0.06)} ${f(by - hh * 0.42)} ${f(tx - bw * 0.36)} ${f(ty + hh * 0.36)} ${f(tx)} ${f(ty)} C ${f(tx + bw * 0.3)} ${f(ty + hh * 0.42)} ${f(R + bw * 0.08)} ${f(by - hh * 0.4)} ${f(R)} ${f(by)} Q ${f(cx)} ${f(by + bw * 0.12)} ${f(L)} ${f(by)} Z`;
};

export type FireProps = {x: number; y: number; w: number; h: number; t: number; seed?: number; intensity?: number; glow?: boolean | number; licks?: boolean; wind?: number};
export const Fire: React.FC<FireProps> = ({x, y, w, h, t, seed = 1, intensity = 1, glow = true, licks = true, wind = 0}) => {
  if (intensity <= 0.01) return null;
  const n = Math.max(2, Math.round(w / Math.max(20, h * 0.42)));
  const cols = [CITY.ember, CITY.fire, CITY.fireHot, CITY.fireCore];
  const layers: React.ReactElement[][] = [[], [], [], []];
  let hMax = 0;
  for (let i = 0; i < n; i++) {
    const cx = x - w / 2 + ((i + 0.5) * w) / n + (rnd(seed * 17 + i) - 0.5) * (w / n) * 0.5;
    const centre = 1 - Math.abs((i + 0.5) / n - 0.5) * 1.3;
    const bw = (w / n) * 1.9;
    const fl = 0.76 + 0.24 * noise(t * 3.3 + i * 1.71, seed) + 0.12 * noise(t * 8.3 + i, seed + 3);
    const hh = h * (0.32 + 0.68 * Math.pow(Math.max(0, centre), 0.7)) * (0.6 + 0.55 * rnd(seed * 5 + i)) * fl * intensity;
    hMax = Math.max(hMax, hh);
    const sway = noise(t * 2.1 + i * 0.9, seed + 9) * bw * 0.42 + wind * hh * 0.4;
    ([[1, 1], [0.8, 0.85], [0.55, 0.62], [0.3, 0.4]] as [number, number][]).forEach(([k, kw], li) => {
      if (li === 3 && centre < 0.35) return;
      layers[li].push(<path key={`${li}_${i}`} d={tongue(cx + sway * (1 - k) * 0.25, y, bw * kw, hh * k, sway * k)} fill={cols[li]} />);
    });
  }
  // detached licks breaking off the tallest tips
  const lk: React.ReactElement[] = [];
  if (licks) {
    const m = Math.max(2, Math.round(n * 0.7));
    for (let k = 0; k < m; k++) {
      const P = 0.45 + rnd(seed * 3 + k) * 0.4;
      const cyc = Math.floor((t + rnd(seed * 11 + k) * P) / P);
      const u = (((t + rnd(seed * 11 + k) * P) / P) % 1 + 1) % 1;
      const cx = x - w * 0.3 + rnd(seed * 23 + k * 3 + cyc) * w * 0.6;
      const yy = y - hMax * (0.66 + 0.12 * rnd(seed * 29 + k)) - u * h * 0.2;
      const sz = (w / n) * 0.26 * (1 - u) * intensity;
      if (sz > 1) lk.push(<path key={`l${k}`} d={tongue(cx + wind * u * h * 0.3, yy, sz, sz * 2.4, noise(t * 3 + k, seed) * sz * 0.5)} fill={u < 0.4 ? CITY.fireHot : CITY.fire} opacity={1 - u} />);
    }
  }
  const g = typeof glow === 'number' ? glow : glow ? 1 : 0;
  return (
    <g>
      {g > 0 && <Glow x={x} y={y - h * 0.4} r={Math.max(w, h) * 1.25} color={CITY.fire} opacity={0.32 * g * intensity * (0.85 + 0.15 * noise(t * 5, seed + 1))} squash={0.8} id={fxId('fg', seed, x, y)} />}
      {layers.map((l, i) => <g key={i}>{l}</g>)}
      {lk}
    </g>
  );
};

export type EmbersProps = {x: number; y: number; w: number; h: number; t: number; seed?: number; n?: number; kind?: 'ember' | 'ash'; wind?: number; size?: number; opacity?: number};
/** Embers rise through the region (x, y = top-left; w × h); ash drifts down through it. */
export const Embers: React.FC<EmbersProps> = ({x, y, w, h, t, seed = 1, n = 24, kind = 'ember', wind = 40, size = 1, opacity = 1}) => {
  const out: React.ReactElement[] = [];
  for (let i = 0; i < n; i++) {
    const P = (kind === 'ember' ? 2.2 : 5) + rnd(seed * 7 + i) * (kind === 'ember' ? 2.5 : 4);
    const ph = rnd(seed * 13 + i) * P;
    const cyc = Math.floor((t + ph) / P);
    const u = ((t + ph) / P) % 1;
    const x0 = x + rnd(seed * 19 + i * 5 + cyc * 31) * w;
    const dx = wind * u * P * 0.5 + noise(t * 0.8 + i, seed) * w * 0.04;
    const yy = kind === 'ember' ? y + h - u * h : y + u * h;
    const fade = Math.sin(Math.PI * u);
    if (kind === 'ember') {
      const r = (1.6 + rnd(seed * 3 + i) * 2.4) * size;
      const tw = 0.6 + 0.4 * noise(t * 9 + i, seed);
      out.push(<g key={i} opacity={fade * tw * opacity}><circle cx={x0 + dx} cy={yy} r={r * 2.6} fill={CITY.fire} opacity={0.25} /><circle cx={x0 + dx} cy={yy} r={r} fill={CITY.fireHot} /></g>);
    } else {
      const r = (2 + rnd(seed * 3 + i) * 3) * size;
      const a = (t * 90 + i * 40) % 360;
      out.push(<rect key={i} x={x0 + dx - r} y={yy - r * 0.5} width={r * 2} height={r} rx={r * 0.3} fill={i % 3 ? '#9A9088' : '#6E6560'} opacity={clamp(fade * 1.4) * 0.8 * opacity} transform={`rotate(${a.toFixed(1)} ${(x0 + dx).toFixed(1)} ${yy.toFixed(1)})`} />);
    }
  }
  return <g>{out}</g>;
};
