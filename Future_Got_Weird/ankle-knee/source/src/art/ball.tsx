// The soccer ball: a white sphere with the twelve black pentagons of a truncated icosahedron, projected
// orthographically and spun about the view axis (a ball rolling or flying across the frame spins in the picture
// plane). Shaded from the upper-left key light like the rest of the cast.
import React from 'react';
import {Inked} from '../dc/ink';
import {Sphere} from '../dc/shade';
import {INK} from '../dc/ink';
import {fmt} from '../dc/math';

const PHI = (1 + Math.sqrt(5)) / 2;
const RAW: [number, number, number][] = [];
for (const a of [-1, 1]) for (const b of [-1, 1]) { RAW.push([0, a, b * PHI]); RAW.push([a, b * PHI, 0]); RAW.push([b * PHI, 0, a]); }
const VERTS = RAW.map(([x, y, z]) => { const l = Math.hypot(x, y, z); return [x / l, y / l, z / l] as [number, number, number]; });
const rotX = (p: number[], a: number) => [p[0], p[1] * Math.cos(a) - p[2] * Math.sin(a), p[1] * Math.sin(a) + p[2] * Math.cos(a)];
const rotY = (p: number[], a: number) => [p[0] * Math.cos(a) + p[2] * Math.sin(a), p[1], -p[0] * Math.sin(a) + p[2] * Math.cos(a)];
const rotZ = (p: number[], a: number) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a), p[2]];

export const Ball: React.FC<{id: string; x: number; y: number; r: number; spin: number; iw: number}> = ({id, x, y, r, spin, iw}) => {
  const pent: string[] = [];
  for (const v0 of VERTS) {
    const c = rotZ(rotY(rotX(v0, 0.5), 0.3), spin);
    if (c[2] > 0.12) continue; // only the near hemisphere (z toward the camera is negative)
    // tangent basis
    const up = Math.abs(c[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const t1 = [c[1] * up[2] - c[2] * up[1], c[2] * up[0] - c[0] * up[2], c[0] * up[1] - c[1] * up[0]];
    const l1 = Math.hypot(...t1);
    const u = t1.map((q) => q / l1);
    const w = [c[1] * u[2] - c[2] * u[1], c[2] * u[0] - c[0] * u[2], c[0] * u[1] - c[1] * u[0]];
    const a = 0.36;
    const pts: string[] = [];
    for (let k = 0; k < 5; k++) {
      const th = spin + (k / 5) * Math.PI * 2;
      const q = [0, 1, 2].map((i) => c[i] * Math.cos(a) + (u[i] * Math.cos(th) + w[i] * Math.sin(th)) * Math.sin(a));
      pts.push(`${fmt(x + q[0] * r)},${fmt(y + q[1] * r)}`);
    }
    pent.push(pts.join(' '));
  }
  return (
    <g>
      <Inked w={iw}>
        <Sphere id={`${id}-s`} c={{x, y}} r={r} color="#F4F6F8" k={0.9} spec={0.5} />
      </Inked>
      <defs>
        <clipPath id={`${id}-c`}><circle cx={fmt(x)} cy={fmt(y)} r={fmt(r)} /></clipPath>
      </defs>
      <g clipPath={`url(#${id}-c)`}>
        {pent.map((p, i) => <polygon key={i} points={p} fill="#262C35" stroke={INK} strokeWidth={iw * 0.25} strokeLinejoin="round" />)}
        <circle cx={fmt(x - r * 0.35)} cy={fmt(y - r * 0.4)} r={fmt(r * 0.22)} fill="#FFFFFF" opacity={0.35} />
        <circle cx={fmt(x + r * 0.15)} cy={fmt(y + r * 0.25)} r={fmt(r)} fill="#1B2A36" opacity={0.08} />
      </g>
    </g>
  );
};
