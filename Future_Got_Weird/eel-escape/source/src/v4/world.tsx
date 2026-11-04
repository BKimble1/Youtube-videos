// The exterior environment, as the film uses it. Until art/world3d.tsx (builder W) lands this is a plain stand-in
// with the same API; then it re-exports world3d.
import React from 'react';
import {Basis, proj, V3} from './three';
import {C} from '../art/palette';

export const WorldBack: React.FC<{B: Basis; t: number}> = ({B}) => {
  const bed: V3[] = [[-400, 12.95, -400], [400, 12.95, -400], [400, 12.95, 400], [-400, 12.95, 400]];
  const q = bed.map((p) => proj(B, p));
  const ok = q.every((p) => p.z > 1);
  return (
    <g>
      <rect width={1080} height={1920} fill={C.waterMid} />
      {ok && <path d={`M${q.map((p) => `${p.x},${p.y}`).join('L')}Z`} fill={C.sand} opacity={0.6} />}
    </g>
  );
};
export const WorldFront: React.FC<{B: Basis; t: number}> = () => null;
export const PredShadow: React.FC<{B: Basis; pose?: unknown}> = () => null;
export const Reeds: React.FC<{B: Basis; t: number; near: boolean; zSplit?: number}> = () => null;
export const ReedWipe: React.FC<{t: number; t0: number; t1: number}> = ({t, t0, t1}) => {
  const k = Math.max(0, Math.min(1, (t - t0) / (t1 - t0)));
  const x = 1300 - k * 1800;
  return <path d={`M${x},-50 L${x + 260},-50 L${x + 160},1970 L${x - 100},1970Z`} fill="#2F4A2A" />;
};
export const reedWipePoly = (t: number, t0: number, t1: number): string => {
  const k = Math.max(0, Math.min(1, (t - t0) / (t1 - t0)));
  const x = 1300 - k * 1800;
  return `M${x + 200},-50 L1200,-50 L1200,1970 L${x + 100},1970Z`;
};
