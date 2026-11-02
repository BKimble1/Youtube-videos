// Background for the close two-shot. Placeholder until the yard module lands: sky, the skyline across the street and
// the fence (the real Yard replaces it).
import React from 'react';
import {Building, makeSkyline, skyBot, skyTop} from '../art/city';
import {INK} from '../art/crew';

export const HookBackground: React.FC<{D: number; t: number; id: string}> = ({D, id}) => {
  const far = React.useMemo(() => makeSkyline(20, 600, 2000, 71, 180, 360, 1.6, ['#A9BCD0', '#B8C6D6', '#9EB1C7'], ['#B9E4EC', '#CFE9F7', '#A8D8E6']), []);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={skyTop(D * 0.8)} />
          <stop offset="1" stopColor={skyBot(D * 0.8)} />
        </linearGradient>
      </defs>
      <rect x={-2000} y={-2000} width={6000} height={6000} fill={`url(#${id}-sky)`} />
      {far.map((b, i) => <Building key={i} b={b} f={D} base={1500} detail={0.6} />)}
      <rect x={0} y={1500} width={3000} height={600} fill="#9CC77E" stroke={INK} strokeWidth={4} />
    </g>
  );
};

import {Yard, YardForeground} from './yard';
/** the yard at the reunion spot (the opening's background advances with D) */
export const YardWorld: React.FC<{D: number; season: number; t: number; id: string; doorOpen?: number; gateOpen?: number; layer?: 'all' | 'back' | 'front'}> = (p) => <Yard {...p} />;
/** figures whose feet are behind the fence line (on the lawn or the garden path) are drawn between the layers */
export const FENCE_Y = 1588;
export const YardFore: React.FC<{t: number; camX: number; zoom: number; D: number; season: number; trunkX: number; leavesX: number}> = ({t, camX, zoom, D, season, trunkX, leavesX}) => (
  <YardForeground camX={camX} t={t} D={D} season={season} id="yfg" zoom={zoom} trunkX={trunkX} leavesX={leavesX} />
);
