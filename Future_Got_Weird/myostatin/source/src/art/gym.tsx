// The gym behind the character: a dark back wall with a warm window light, a dumbbell rack, a cool neon strip on the
// right (the rim light's source), rubber floor tiles and bokeh. Drawn as depth layers (see Scene's Layer) so the
// close-ups soften the background like a real lens.
import React from 'react';
import {uid} from '../core/ids';
import {hash} from '../lib';

export const GymWall: React.FC<{dim?: number}> = ({dim = 0}) => {
  const id = uid('gw'), id2 = uid('gwin'), id3 = uid('neon');
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor="#1A2238" />
          <stop offset={0.7} stopColor="#111727" />
          <stop offset={1} stopColor="#0A0E18" />
        </linearGradient>
        <radialGradient id={id2} cx="0.5" cy="0.5" r="0.5">
          <stop offset={0} stopColor="#FFE2B0" stopOpacity={0.95} />
          <stop offset={0.45} stopColor="#F7B26A" stopOpacity={0.5} />
          <stop offset={1} stopColor="#F7B26A" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={id3} x1="0" y1="0" x2="1" y2="0">
          <stop offset={0} stopColor="#38E3FF" stopOpacity={0} />
          <stop offset={0.5} stopColor="#7FF1FF" stopOpacity={0.95} />
          <stop offset={1} stopColor="#38E3FF" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={-900} y={-700} width={1800} height={700} fill={`url(#${id})`} />
      {/* tall window, upper left: the key light */}
      <rect x={-330} y={-560} width={150} height={330} rx={6} fill="#2B3654" />
      <rect x={-322} y={-552} width={134} height={314} rx={4} fill="#F3C98E" opacity={0.85} />
      <path d="M-255 -552 V-238 M-322 -395 H-188" stroke="#2B3654" strokeWidth={8} />
      <ellipse cx={-255} cy={-395} rx={330} ry={300} fill={`url(#${id2})`} opacity={0.75 - 0.4 * dim} />
      {/* neon strip on the right */}
      <rect x={150} y={-520} width={14} height={420} rx={7} fill="#B8F8FF" />
      <rect x={120} y={-540} width={74} height={460} fill={`url(#${id3})`} opacity={0.55} />
      {/* wall panels */}
      {[-560, -420, 60, 330].map((x, i) => <rect key={i} x={x} y={-600} width={6} height={600} fill="#0B0F1A" opacity={0.7} />)}
      {/* dumbbell rack */}
      <rect x={-150} y={-120} width={420} height={14} rx={4} fill="#2B3142" />
      <rect x={-150} y={-64} width={420} height={14} rx={4} fill="#2B3142" />
      {[-140, 250].map((x, i) => <rect key={i} x={x} y={-130} width={12} height={130} fill="#222838" />)}
      {Array.from({length: 9}, (_, i) => {
        const x = -120 + i * 44, r = 9 + i * 1.1;
        return (
          <g key={i}>
            {[-120, -64].map((y, k) => (
              <g key={k}>
                <rect x={x - 11} y={y - r * 2 + 2} width={6} height={r * 2} rx={3} fill="#3A4256" />
                <rect x={x + 9} y={y - r * 2 + 2} width={6} height={r * 2} rx={3} fill="#3A4256" />
                <rect x={x - 6} y={y - r - 2} width={16} height={4} fill="#6B7488" />
              </g>
            ))}
          </g>
        );
      })}
      {/* bokeh: practical lights far behind */}
      {Array.from({length: 16}, (_, i) => {
        const x = -600 + hash(i * 3.1) * 1200, y = -650 + hash(i * 7.7) * 380, r = 10 + hash(i * 1.3) * 22;
        const warm = hash(i * 5.5) > 0.4;
        return <circle key={i} cx={x} cy={y} r={r} fill={warm ? '#FFC77A' : '#7FE6FF'} opacity={0.12 + 0.18 * hash(i * 9.1)} />;
      })}
      {dim > 0 && <rect x={-900} y={-700} width={1800} height={700} fill="#05070E" opacity={dim * 0.5} />}
    </g>
  );
};

export const GymFloor: React.FC = () => {
  const id = uid('gf');
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset={0} stopColor="#1E2230" />
          <stop offset={1} stopColor="#0B0D14" />
        </linearGradient>
      </defs>
      <rect x={-900} y={0} width={1800} height={400} fill={`url(#${id})`} />
      {Array.from({length: 14}, (_, i) => <path key={i} d={`M${-700 + i * 100} 0 L${-1100 + i * 160} 400`} stroke="#090B11" strokeWidth={2} />)}
      <path d="M-900 0 H900" stroke="#2C3244" strokeWidth={1.5} />
      <ellipse cx={-120} cy={30} rx={260} ry={18} fill="#F3C98E" opacity={0.05} />
    </g>
  );
};
