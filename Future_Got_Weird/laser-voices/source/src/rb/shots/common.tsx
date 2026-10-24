// Shared pieces for the shots: the instructional beam path (seen by the audience, never by the characters), easing,
// blinks and breathing.
import React from 'react';
import {clamp, fmt, lerp} from '../lib/math';

export const ss = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const eio = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const blinkAt = (t: number, times: number[]) => Math.max(0, ...times.map((b) => clamp(1 - Math.abs(t - b) / 0.08)));
export const breath = (t: number, rate = 0.27) => Math.sin(t * Math.PI * 2 * rate);

/** The path from the lens to the ear as a translucent instructional overlay: a dashed amber line with a faint glow and
 *  chevrons travelling toward the ear. `reveal` draws it in from the lens; `end` cuts it short (an obstruction). */
export const BeamPath: React.FC<{id: string; a: {x: number; y: number}; b: {x: number; y: number}; t: number; reveal?: number; amt?: number; end?: number; w?: number; from?: number}> = ({id, a: a0, b, t, reveal = 1, amt = 1, end = 1, w = 1, from = 0}) => {
  if (amt <= 0.01) return null;
  // `from` trims the start (a path traced back from the ear toward the lens grows from its far end)
  const a = {x: lerp(a0.x, b.x, clamp(from)), y: lerp(a0.y, b.y, clamp(from))};
  const u1 = Math.min(clamp(reveal), clamp(end));
  const e = {x: lerp(a.x, b.x, u1), y: lerp(a.y, b.y, u1)};
  const L = Math.hypot(b.x - a.x, b.y - a.y);
  const dir = {x: (b.x - a.x) / L, y: (b.y - a.y) / L};
  const n = {x: -dir.y, y: dir.x};
  const chev: React.ReactNode[] = [];
  const spacing = 70 * w;
  const k = Math.floor((L * u1) / spacing);
  for (let i = 0; i < k; i++) {
    const s0 = ((i * spacing + t * 160 * w) % (L * u1));
    const p = {x: a.x + dir.x * s0, y: a.y + dir.y * s0};
    const sz = 9 * w;
    chev.push(
      <path key={i} d={`M${fmt(p.x - dir.x * sz + n.x * sz)},${fmt(p.y - dir.y * sz + n.y * sz)} L${fmt(p.x)},${fmt(p.y)} L${fmt(p.x - dir.x * sz - n.x * sz)},${fmt(p.y - dir.y * sz - n.y * sz)}`} fill="none" stroke="#FFD9A8" strokeWidth={2.4 * w} strokeLinecap="round" strokeLinejoin="round" opacity={0.75 * Math.sin(Math.PI * clamp(s0 / (L * u1)))} />,
    );
  }
  return (
    <g opacity={amt}>
      <defs>
        <filter id={`${id}-gl`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={6 * w} />
        </filter>
      </defs>
      <line x1={fmt(a.x)} y1={fmt(a.y)} x2={fmt(e.x)} y2={fmt(e.y)} stroke="#FF8A3D" strokeWidth={10 * w} opacity={0.22} filter={`url(#${id}-gl)`} strokeLinecap="round" />
      <line x1={fmt(a.x)} y1={fmt(a.y)} x2={fmt(e.x)} y2={fmt(e.y)} stroke="#FFAA5E" strokeWidth={3 * w} strokeDasharray={`${fmt(14 * w)} ${fmt(10 * w)}`} strokeDashoffset={fmt(-t * 90 * w)} opacity={0.85} strokeLinecap="round" />
      {chev}
      {end < 1 && end <= reveal && <circle cx={fmt(e.x)} cy={fmt(e.y)} r={fmt(8 * w)} fill="#FFB067" opacity={0.6} filter={`url(#${id}-gl)`} />}
    </g>
  );
};
