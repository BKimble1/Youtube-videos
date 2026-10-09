import React from 'react';
import {C} from '../../theme';
import {ZoneBox} from '../v02/S7_ZoneBox';
import {N_POS, RASTER} from '../v02/S7_Plots';

/**
 * V6 only: a copy of S7_Plots' RasterPanel (the 36 preset sensor positions on the authors' 6×6 back-and-forth raster,
 * `sensor_positions_xy_m`, x inverted like the authors' front-view plot) with the empty positions drawn larger and
 * firmer, so the "empty 6 × 6 position grid" of V6.1 reads at phone size. The zone box sits ON a position (no gliding
 * between positions: one position per image).
 */

const RX0 = 0;
const RX1 = 1.28;
const RY0 = 0.32;
const RY1 = 0.96;

export const v6RasterGeom = (width: number, boxSize: number) => {
  const m = boxSize * 0.62;
  const K = (width - 2 * m) / (RX1 - RX0);
  const height = (RY1 - RY0) * K + 2 * m;
  const P = (x: number, y: number) => ({x: m + (RX1 - x) * K, y: m + (RY1 - y) * K});
  return {K, height, P, m};
};

export const V6Raster: React.FC<{width: number; pos: number; done: number; firing?: number; boxSize?: number}> = ({width, pos, done, firing = 0, boxSize = 80}) => {
  const {height, P} = v6RasterGeom(width, boxSize);
  const pts = RASTER.map(([x, y]) => P(x, y));
  const j = Math.max(0, Math.min(N_POS - 1, Math.round(pos) - 1));
  const nDone = Math.max(0, Math.min(N_POS, Math.floor(done)));
  const path = pts.slice(0, Math.max(1, nDone)).map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{display: 'block', overflow: 'visible'}}>
      {nDone > 1 && <path d={path} fill="none" stroke={C.teal} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i < nDone ? 11 : 9} fill={i < nDone ? C.teal : C.cream} stroke={i < nDone ? C.ink : C.inkSoft} strokeWidth={3} />
      ))}
      <ZoneBox asGroup x={pts[j].x} y={pts[j].y - boxSize * 0.12} size={boxSize} firing={firing} listening={firing} />
    </svg>
  );
};
