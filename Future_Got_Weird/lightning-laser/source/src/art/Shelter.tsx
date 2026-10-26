// The control shelter on the right-hand ledge (site world, depth 1): a compact insulated cabin, offset from the
// discharge path, with a lit window toward the tower, a door, a cable entry and a small mast.
import React from 'react';
import {mix} from '../dc/color';

const INKS = '#0B151C';
export const SHELTER = {x0: 870, x1: 1052, y0: 1584, y1: 1694};

export const ShelterExt: React.FC<{flash: number}> = ({flash}) => {
  const {x0, x1, y0, y1} = SHELTER;
  const wall = mix('#6F7E73', '#AEB8D8', flash * 0.45);
  const wallD = mix('#4B5850', '#7E88B4', flash * 0.45);
  return (
    <g>
      <defs>
        <linearGradient id="sh-w" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={wallD} />
          <stop offset="0.3" stopColor={wall} />
          <stop offset="1" stopColor={wallD} />
        </linearGradient>
      </defs>
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="url(#sh-w)" stroke={INKS} strokeWidth={2.4} />
      {/* ribbed cladding */}
      {Array.from({length: 11}, (_, i) => <line key={i} x1={x0 + 8 + i * 16} y1={y0 + 4} x2={x0 + 8 + i * 16} y2={y1 - 2} stroke={INKS} strokeOpacity={0.22} strokeWidth={1.4} />)}
      {/* roof */}
      <path d={`M${x0 - 8},${y0 + 2} L${x0 - 2},${y0 - 14} L${x1 + 4},${y0 - 8} L${x1 + 10},${y0 + 2} Z`} fill={mix('#3D4A52', '#8A94C0', flash * 0.6)} stroke={INKS} strokeWidth={2.2} strokeLinejoin="round" />
      {/* window toward the tower, warm interior with a figure at the console */}
      <rect x={x0 + 16} y={y0 + 22} width={74} height={46} fill="#E6B36A" stroke={INKS} strokeWidth={2.2} />
      <path d={`M${x0 + 34},${y0 + 68} Q${x0 + 36},${y0 + 44} ${x0 + 48},${y0 + 42} Q${x0 + 60},${y0 + 44} ${x0 + 62},${y0 + 68} Z`} fill="#3A2A22" opacity={0.85} />
      <circle cx={x0 + 48} cy={y0 + 36} r={8} fill="#3A2A22" opacity={0.85} />
      <circle cx={x0 + 48} cy={y0 + 26} r={4.5} fill="#1E1A1A" opacity={0.85} />
      <path d={`M${x0 + 16},${y0 + 22} L${x0 + 90},${y0 + 22} L${x0 + 40},${y0 + 68} L${x0 + 16},${y0 + 68} Z`} fill="#FFFFFF" opacity={0.08 + 0.25 * flash} />
      <line x1={x0 + 53} y1={y0 + 22} x2={x0 + 53} y2={y0 + 68} stroke={INKS} strokeWidth={1.8} />
      {/* door, cable entry, step */}
      <rect x={x1 - 52} y={y0 + 18} width={36} height={y1 - y0 - 18} fill={wallD} stroke={INKS} strokeWidth={2} />
      <circle cx={x1 - 22} cy={y0 + 64} r={2.6} fill="#C9D0D6" />
      <rect x={x0 + 4} y={y1 - 26} width={14} height={12} fill="#2A363E" stroke={INKS} strokeWidth={1.4} />
      <rect x={x1 - 58} y={y1} width={48} height={8} fill="#4E5A60" stroke={INKS} strokeWidth={1.6} />
      {/* mast with a weather sensor */}
      <line x1={x1 - 20} y1={y0 - 10} x2={x1 - 20} y2={y0 - 70} stroke={INKS} strokeWidth={2.6} />
      <path d={`M${x1 - 34},${y0 - 66} L${x1 - 6},${y0 - 66}`} stroke={INKS} strokeWidth={2.2} />
      <circle cx={x1 - 34} cy={y0 - 66} r={4} fill="#C9D0D6" stroke={INKS} strokeWidth={1.4} />
    </g>
  );
};
