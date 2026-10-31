// The water around the fish: a depth gradient, slow light shafts from the surface, and suspended particles that live
// in world space (so they parallax correctly with every camera move). All motion is periodic over the film's length,
// so the last frame flows into the first.
import React from 'react';
import {Basis, dot3, proj, sub3, V3} from './core/three';
import {DUR, hash} from './lib';

export const WaterBg: React.FC<{t: number; tone?: number}> = ({t, tone = 0}) => {
  const rays = [0, 1, 2, 3, 4].map((i) => {
    const x0 = 120 + i * 230 + 60 * Math.sin((2 * Math.PI * t) / (DUR / 2) + i * 1.7);
    const w = 70 + 40 * hash(i);
    const op = 0.06 + 0.04 * Math.sin((2 * Math.PI * t) / (DUR / 4) + i * 2.3);
    return <path key={i} d={`M${x0 - w},-50 L${x0 + w},-50 L${x0 + w - 420},2000 L${x0 - w - 520},2000 Z`} fill="url(#wRay)" opacity={op} />;
  });
  return (
    <g>
      <defs>
        <linearGradient id="wBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tone ? '#3B8E98' : '#2F7F8C'} />
          <stop offset="0.45" stopColor="#1A5868" />
          <stop offset="1" stopColor="#0B2E3C" />
        </linearGradient>
        <linearGradient id="wRay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#CFF3F0" stopOpacity={1} />
          <stop offset="1" stopColor="#CFF3F0" stopOpacity={0} />
        </linearGradient>
        <radialGradient id="pDot">
          <stop offset="0" stopColor="#E8F4EC" stopOpacity={0.9} />
          <stop offset="0.5" stopColor="#E8F4EC" stopOpacity={0.35} />
          <stop offset="1" stopColor="#E8F4EC" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#wBg)" />
      {rays}
    </g>
  );
};

/** suspended particles in a world box, drifting (periodic in DUR); `near` keeps those nearer than the subject */
export const Particles: React.FC<{B: Basis; t: number; box: [V3, V3]; n?: number; seed?: number; zMax?: number; zMin?: number}> = ({B, t, box, n = 90, seed = 0, zMax = 1e9, zMin = 0}) => {
  const [a, b] = box;
  const els: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const h = (k: number) => hash(i * 13.7 + k + seed * 101);
    const span = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    // drift: a slow sink and a sideways sway, wrapped in the box; whole number of laps over the film
    const laps = 1 + Math.floor(h(4) * 2);
    const u = (h(1) + (laps * t) / DUR) % 1;
    const p: V3 = [
      a[0] + span[0] * h(2) + 2 * Math.sin((2 * Math.PI * t) / (DUR / 3) + i),
      a[1] + span[1] * h(3),
      b[2] - span[2] * u,
    ];
    const z = dot3(sub3(p, B.eye), B.fw);
    if (z < Math.max(3, zMin) || z > zMax) continue;
    const P = proj(B, p);
    if (P.x < -50 || P.x > 1130 || P.y < -50 || P.y > 1970) continue;
    const r = (0.25 + 0.45 * h(5)) * P.s;
    // out-of-focus blur for particles very near the lens
    const rr = Math.min(60, Math.max(1.2, r * (z < 40 ? 1 + (40 - z) / 12 : 1)));
    const op = Math.min(0.75, 0.25 + 0.5 * h(6)) * (z < 40 ? Math.max(0.2, z / 40) : 1);
    els.push(<circle key={i} cx={P.x.toFixed(1)} cy={P.y.toFixed(1)} r={rr.toFixed(1)} fill="url(#pDot)" opacity={op.toFixed(2)} />);
  }
  return <g>{els}</g>;
};
