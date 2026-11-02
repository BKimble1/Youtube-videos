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

/** provisional yard (until the yard module is wired): sky, skyline, lawn, a house and a tree */
export const YardWorld: React.FC<{D: number; season: number; t: number; id: string; doorOpen?: number}> = ({D, t, id}) => (
  <g>
    <HookBackground D={D} t={t} id={id} />
    <rect x={1330} y={900} width={650} height={730} fill="#D9E3EE" stroke={INK} strokeWidth={4} />
    <rect x={1385} y={1330} width={130} height={300} fill="#7A4E3A" stroke={INK} strokeWidth={4} />
    <rect x={820} y={1100} width={60} height={530} fill="#8A5A3B" stroke={INK} strokeWidth={4} />
    <circle cx={850} cy={1050} r={200 + 100 * D} fill="#6FB36A" stroke={INK} strokeWidth={4} />
    <rect x={0} y={1640} width={3000} height={500} fill="#6E7884" />
  </g>
);
export const YardFore: React.FC<{t: number; camX: number}> = () => null;
