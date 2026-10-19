// A bright, ordinary room for the two Crew characters: a pale wall with a window, a skirting board and a warm floor.
// Drawn once in world coordinates (the camera moves over it); soft gradients only, no texture, so it stays subordinate.
import React from 'react';
import {lit, shade} from '../lib/color';

export const WALL = '#DDEBF2';
export const FLOOR = '#DDB98F';

export const Room: React.FC = () => (
  <g>
    <defs>
      <linearGradient id="rm-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={lit(WALL, 0.45)} />
        <stop offset="0.6" stopColor={WALL} />
        <stop offset="1" stopColor={shade(WALL, 0.14)} />
      </linearGradient>
      <linearGradient id="rm-floor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={shade(FLOOR, 0.18)} />
        <stop offset="0.25" stopColor={FLOOR} />
        <stop offset="1" stopColor={lit(FLOOR, 0.12)} />
      </linearGradient>
      <linearGradient id="rm-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#BFE3F3" />
        <stop offset="1" stopColor="#EAF6FB" />
      </linearGradient>
      <radialGradient id="rm-light" cx="0.28" cy="0.2" r="0.9">
        <stop offset="0" stopColor="#FFF8E6" stopOpacity={0.55} />
        <stop offset="1" stopColor="#FFF8E6" stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect x={-1400} y={-900} width={4000} height={2320} fill="url(#rm-wall)" />
    {/* window */}
    <g>
      <rect x={300} y={90} width={560} height={620} rx={26} fill="#F7FAFC" stroke="#172B3A" strokeWidth={5} />
      <rect x={326} y={116} width={508} height={568} rx={14} fill="url(#rm-sky)" />
      <ellipse cx={470} cy={250} rx={96} ry={30} fill="#FFFFFF" opacity={0.9} />
      <ellipse cx={540} cy={238} rx={70} ry={26} fill="#FFFFFF" opacity={0.9} />
      <ellipse cx={690} cy={420} rx={84} ry={26} fill="#FFFFFF" opacity={0.75} />
      <rect x={572} y={116} width={14} height={568} fill="#F7FAFC" stroke="#172B3A" strokeWidth={4} />
      <rect x={326} y={392} width={508} height={14} fill="#F7FAFC" stroke="#172B3A" strokeWidth={4} />
      <rect x={290} y={700} width={580} height={30} rx={8} fill="#F7FAFC" stroke="#172B3A" strokeWidth={5} />
    </g>
    <rect x={-1400} y={-900} width={4000} height={2320} fill="url(#rm-light)" />
    {/* skirting and floor */}
    <rect x={-1400} y={1396} width={4000} height={34} fill="#F7FAFC" stroke="#172B3A" strokeWidth={4} />
    <rect x={-1400} y={1430} width={4000} height={900} fill="url(#rm-floor)" />
    {Array.from({length: 12}, (_, k) => (
      <line key={k} x1={-1400} x2={2600} y1={1460 + k * 76} y2={1460 + k * 76} stroke={shade(FLOOR, 0.3)} strokeWidth={2.5} opacity={0.35} />
    ))}
  </g>
);
