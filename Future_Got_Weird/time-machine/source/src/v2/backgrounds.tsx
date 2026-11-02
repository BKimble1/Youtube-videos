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
