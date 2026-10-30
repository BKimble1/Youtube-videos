// Small paint helpers for HOOK 01: screen-space gradients lit from the upper left (warm key, cool shadow).
import React from 'react';
import {V2} from '../shared/three';
import {lit, mix, shade} from '../shared/color';
import {f2} from './geo';

export const LIGHT = {x: -0.62, y: -0.78};

/** a radial "ball" gradient: centre c, radius r, focal shifted toward the key light */
export const RadG: React.FC<{id: string; c: V2; r: number; col: string; k?: number; focal?: number; stops?: [number, string, number?][]}> = ({id, c, r, col, k = 1, focal = 0.45, stops}) => {
  const fx = c.x + LIGHT.x * r * focal, fy = c.y + LIGHT.y * r * focal;
  const st: [number, string, number?][] = stops ?? [
    [0, lit(col, 0.34 * k)],
    [0.4, lit(col, 0.08 * k)],
    [0.76, col],
    [1, shade(col, 0.4 * k)],
  ];
  return (
    <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={f2(c.x)} cy={f2(c.y)} r={f2(Math.max(1, r))} fx={f2(fx)} fy={f2(fy)}>
      {st.map(([o, cc, a], i) => (
        <stop key={i} offset={o} stopColor={cc} stopOpacity={a ?? 1} />
      ))}
    </radialGradient>
  );
};

export const LinG: React.FC<{id: string; a: V2; b: V2; stops: [number, string, number?][]}> = ({id, a, b, stops}) => (
  <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={f2(a.x)} y1={f2(a.y)} x2={f2(b.x)} y2={f2(b.y)}>
    {stops.map(([o, cc, al], i) => (
      <stop key={i} offset={o} stopColor={cc} stopOpacity={al ?? 1} />
    ))}
  </linearGradient>
);

export {lit, mix, shade};
