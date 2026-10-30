// The near-infrared source: a classic through-hole LED (smoky epoxy dome, reflector cup and die inside, flange, two
// legs) held in a small dark clip on a thin lab arm. Drawn in L1 units, tip at the origin, its axis along +x (away from
// the eye). When it is on, only the die shows a faint deep red (as real 850 nm LEDs do); the light it sends is drawn
// separately as stylised dashed packets.
import React from 'react';
import {INK} from './Lead8';

const ns = {vectorEffect: 'non-scaling-stroke' as const};
export const Emitter: React.FC<{on: number; id: string; inkW: number}> = ({on, id, inkW}) => {
  const sw = inkW;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-epoxy`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8B7D92" />
          <stop offset="0.35" stopColor="#5A4A63" />
          <stop offset="1" stopColor="#2B2233" />
        </linearGradient>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E6EDF0" />
          <stop offset="0.5" stopColor="#9DAAB2" />
          <stop offset="1" stopColor="#5E6C75" />
        </linearGradient>
        <linearGradient id={`${id}-clip`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4A5C66" />
          <stop offset="0.5" stopColor="#2C3A43" />
          <stop offset="1" stopColor="#18232A" />
        </linearGradient>
        <radialGradient id={`${id}-die`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FF6A7C" stopOpacity={0.95} />
          <stop offset="0.35" stopColor="#B8203C" stopOpacity={0.6} />
          <stop offset="1" stopColor="#6E0E22" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* the arm that holds the clip (leaves the frame up and to the right) */}
      <path d="M78 -2 L150 -40 L320 -60" fill="none" stroke={INK} strokeWidth={9 + sw * 2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M78 -2 L150 -40 L320 -60" fill="none" stroke="#7F8E97" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M80 -6 L150 -44 L320 -64" fill="none" stroke="#C9D3D8" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
      <circle cx={150} cy={-40} r={9} fill="#5E6C75" stroke={INK} strokeWidth={sw} />
      <circle cx={148} cy={-42} r={3.4} fill="#C9D3D8" />
      {/* clip block */}
      <rect x={54} y={-15} width={30} height={30} rx={5} fill={`url(#${id}-clip)`} stroke={INK} strokeWidth={sw} />
      <rect x={58} y={-12} width={22} height={5} rx={2} fill="#FFFFFF" opacity={0.12} />
      {/* legs */}
      <path d="M36 -3.6 L56 -3.6 M36 3.6 L56 3.6" stroke="#B9C4CA" strokeWidth={2.2} strokeLinecap="round" />
      {/* flange and body */}
      <path d="M33 -12.4 L37 -12.4 L37 12.4 L33 12.4 Z" fill="#3A2F44" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      <path d="M10.5 -10.5 L33 -10.5 L33 10.5 L10.5 10.5 A10.5 10.5 0 0 1 10.5 -10.5 Z" fill={`url(#${id}-epoxy)`} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      {/* inside the epoxy: the two lead frames (post and anvil with its reflector cup), the die and the bond wire */}
      <g opacity={0.85}>
        <path d="M33 -3.6 L22 -3.6 L22 -2.2" fill="none" stroke="#B9C4CA" strokeWidth={1.4} />
        <path d="M33 3.6 L19 3.6 L16 6.4 L16 -1.4 L19 1 L24 1" fill="#9DAAB2" stroke="#6C7A83" strokeWidth={0.8} />
        <path d="M16 -1 L13.4 -4.6 L13.4 4.6 L16 1.2 Z" fill="#C9D3D8" opacity={0.7} />
        <path d="M15.6 -0.2 Q18 -4 22 -2.4" fill="none" stroke="#E6EDF0" strokeWidth={0.5} />
        <rect x={14.6} y={-1.4} width={2.4} height={2.6} fill={on > 0.02 ? '#E0506A' : '#3B2530'} />
      </g>
      {on > 0.01 && <circle cx={15.8} cy={0} r={9 + 5 * on} fill={`url(#${id}-die)`} opacity={0.75 * on} />}
      {/* epoxy highlights */}
      <path d="M6 -7.5 A9 9 0 0 1 14 -9.2 L31 -9.2" fill="none" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" opacity={0.55} />
      <path d="M3.2 -2.4 A8 8 0 0 1 5 -6" fill="none" stroke="#FFFFFF" strokeWidth={1.4} strokeLinecap="round" opacity={0.7} />
      <path d="M12 8.6 L30 8.6" stroke="#160F1C" strokeWidth={1.4} opacity={0.6} {...ns} />
    </g>
  );
};
