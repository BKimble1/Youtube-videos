// The lab bench, seen from above: one coherent set for every view of the mouse. A cool slate bench, a quilted
// absorbent pad under the mouse, the dish of food-dye solution (top right), cotton swabs (left), a warm task light
// from the upper left. This is the controlled stand-in for the planned Runway scenery plates (result bench and rinse
// station): it carries the same layout, so a downloaded plate can replace it slot for slot (production/RUNWAY_NOTES.md).
// `wetStain` darkens the pad where rinse water runs off.
import React from 'react';
import {INK} from '../dc/ink';
import {hash} from '../dc/math';

export const Bench: React.FC<{id: string; wetStain: number; dish?: boolean}> = ({id, wetStain, dish = true}) => {
  const quilt: React.ReactNode[] = [];
  for (let k = -12; k < 30; k++) {
    quilt.push(<path key={`a${k}`} d={`M${170 + k * 70},300 l1000,1000`} />);
    quilt.push(<path key={`b${k}`} d={`M${170 + k * 70 - 1000},300 l1000,-1000`} transform="translate(0 2000)" />);
  }
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-task`} cx="0.22" cy="0.18" r="0.95">
          <stop offset="0" stopColor="#FFE9C6" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#FFE9C6" stopOpacity="0.12" />
          <stop offset="1" stopColor="#0E1A24" stopOpacity="0.35" />
        </radialGradient>
        <clipPath id={`${id}-pad`}>
          <rect x={150} y={250} width={780} height={1760} rx={36} />
        </clipPath>
      </defs>
      <rect x={-2400} y={-2600} width={5900} height={6800} fill="#56677A" />
      {/* bench seams */}
      <path d="M-900,240 L1980,240 M-900,2120 L1980,2120" stroke="#46566A" strokeWidth={6} />
      {Array.from({length: 40}, (_, i) => (
        <circle key={i} cx={-600 + hash(i, 2) * 2400} cy={-500 + hash(i, 4) * 3000} r={2 + hash(i, 6) * 2} fill="#6A7B8D" opacity={0.6} />
      ))}
      {/* absorbent pad */}
      <rect x={150} y={250} width={780} height={1760} rx={36} fill="#DDE9EF" stroke={INK} strokeWidth={5} />
      <g clipPath={`url(#${id}-pad)`} stroke="#C3D4DE" strokeWidth={3} fill="none">
        {quilt}
        <g stroke="none" fill="#AFC7D5" opacity={0.42 * Math.min(1, wetStain * 3)} style={{filter: 'blur(14px)'}}>
          <ellipse cx={330} cy={1120} rx={70 * wetStain + 1} ry={170 * wetStain + 1} />
          <ellipse cx={770} cy={1060} rx={80 * wetStain + 1} ry={210 * wetStain + 1} />
          <ellipse cx={720} cy={1290} rx={60 * wetStain + 1} ry={90 * wetStain + 1} />
        </g>
      </g>
      <rect x={168} y={268} width={744} height={1724} rx={26} fill="none" stroke="#fff" strokeOpacity={0.55} strokeWidth={4} />
      {/* cotton swabs, left */}
      {[0, 1].map((k) => (
        <g key={k} transform={`rotate(${-62 + k * 8} ${70 + k * 24} ${1380 + k * 40})`}>
          <rect x={70 + k * 24 - 4} y={1380 + k * 40} width={8} height={230} rx={4} fill="#F4F1EA" stroke={INK} strokeWidth={3} />
          <ellipse cx={70 + k * 24} cy={1380 + k * 40} rx={14} ry={24} fill="#FFFFFF" stroke={INK} strokeWidth={3} />
        </g>
      ))}
      {/* the dish of food-dye solution, top right */}
      {dish && (
        <g>
          <ellipse cx={960} cy={760} rx={118} ry={118} fill="rgba(20,40,60,0.18)" transform="translate(10 14)" />
          <circle cx={960} cy={760} r={118} fill="#E8F2F6" stroke={INK} strokeWidth={5} />
          <circle cx={960} cy={760} r={98} fill="#F2B232" />
          <circle cx={960} cy={760} r={98} fill="none" stroke="#E08A1E" strokeWidth={8} opacity={0.6} />
          <ellipse cx={928} cy={722} rx={36} ry={16} fill="#FFF0B8" opacity={0.7} transform="rotate(-30 928 722)" />
          <path d="M862,700 A118,118 0 0 1 1010,650" stroke="#fff" strokeWidth={8} fill="none" opacity={0.7} strokeLinecap="round" />
        </g>
      )}
      <rect x={-900} y={-700} width={2880} height={3400} fill={`url(#${id}-task)`} />
    </g>
  );
};
