// Soft light: radial glows and light shafts (the only gradients in the look, besides smoke).
import React from 'react';
import {noise} from '../kit/math';
import {fxId} from './common';

export type GlowProps = {x: number; y: number; r: number; color: string; opacity?: number; t?: number; flicker?: number; seed?: number; squash?: number; id?: string; core?: number};
/** Radial glow centred at (x, y), radius r; squash = vertical/horizontal ratio. core = solid inner fraction. */
export const Glow: React.FC<GlowProps> = ({x, y, r, color, opacity = 0.5, t = 0, flicker = 0, seed = 1, squash = 1, id, core = 0}) => {
  const gid = id ?? fxId('gl', seed, x, y);
  const op = opacity * (1 + flicker * noise(t * 7, seed));
  if (op <= 0.002 || r <= 0) return null;
  return (
    <g>
      <defs>
        <radialGradient id={gid}>
          <stop offset="0%" stopColor={color} stopOpacity={1} />
          <stop offset={`${Math.round(core * 100)}%`} stopColor={color} stopOpacity={core > 0 ? 1 : 0.85} />
          <stop offset="45%" stopColor={color} stopOpacity={0.4} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={x} cy={y} rx={r} ry={r * squash} fill={`url(#${gid})`} opacity={Math.min(1, op)} />
    </g>
  );
};

export type LightShaftProps = {x: number; y: number; angle?: number; length: number; w0: number; w1: number; color?: string; opacity?: number; id?: string; seed?: number; t?: number; dust?: number};
/** A soft beam from (x, y): angle in degrees (90 = straight down), widening from w0 to w1 over length. */
export const LightShaft: React.FC<LightShaftProps> = ({x, y, angle = 90, length, w0, w1, color = '#FFF1C9', opacity = 0.35, id, seed = 1, t = 0, dust = 0}) => {
  const gid = id ?? fxId('ls', seed, x, y);
  const a = (angle * Math.PI) / 180;
  const dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
  const p = (u: number, s: number, w: number) => `${(x + dx * length * u + nx * w * s).toFixed(1)},${(y + dy * length * u + ny * w * s).toFixed(1)}`;
  const poly = (k: number) => [p(0, -1, (w0 / 2) * k), p(0, 1, (w0 / 2) * k), p(1, 1, (w1 / 2) * k), p(1, -1, (w1 / 2) * k)].join(' ');
  const motes: React.ReactElement[] = [];
  for (let i = 0; i < dust; i++) {
    const u = ((i * 0.618 + t * 0.03) % 1);
    const s = (noise(i * 3.1 + t * 0.2, seed) * 0.9);
    const w = w0 + (w1 - w0) * u;
    motes.push(<circle key={i} cx={x + dx * length * u + nx * (w / 2) * s} cy={y + dy * length * u + ny * (w / 2) * s} r={1.6 + (i % 3)} fill={color} opacity={0.5 * Math.sin(Math.PI * u)} />);
  }
  return (
    <g>
      <defs>
        <linearGradient id={gid} x1={x} y1={y} x2={x + dx * length} y2={y + dy * length} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={color} stopOpacity={1} />
          <stop offset="70%" stopColor={color} stopOpacity={0.45} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={poly(1.35)} fill={`url(#${gid})`} opacity={opacity * 0.35} />
      <polygon points={poly(1)} fill={`url(#${gid})`} opacity={opacity} />
      {motes}
    </g>
  );
};
